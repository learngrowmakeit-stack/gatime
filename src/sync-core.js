import { parseRecipes } from './recipes.js';

export const accountStorageKey = userId => `gatime.account.v1:${userId}`;
const sameRecipe = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function cleanRecipe(data, id) {
  const recipe = parseRecipes(JSON.stringify([data]))[0];
  if (recipe.id !== id) throw new Error('Recipe identity does not match.');
  return recipe;
}
function cleanRow(row) {
  if (!row || typeof row.recipe_id !== 'string' || !Number.isSafeInteger(row.version) || row.version < 1 || typeof row.deleted !== 'boolean') throw new Error('Invalid online recipe.');
  return { recipe_id: row.recipe_id, version: row.version, deleted: row.deleted, data: row.deleted ? null : cleanRecipe(row.data, row.recipe_id) };
}
export function readAccount(storage, userId) {
  const raw = storage.getItem(accountStorageKey(userId));
  if (raw === null) return { rows: [], pending: [] };
  const value = JSON.parse(raw);
  if (!value || !Array.isArray(value.rows) || !Array.isArray(value.pending)) throw new Error('Invalid saved account data.');
  const rows = value.rows.map(cleanRow);
  const pending = value.pending.map(op => {
    if (!op || typeof op.id !== 'string' || typeof op.mutationId !== 'string' || !Number.isSafeInteger(op.baseVersion) || op.baseVersion < 0) throw new Error('Invalid pending recipe.');
    return { ...op, data: op.data === null ? null : cleanRecipe(op.data, op.id), conflict: op.conflict ? cleanRow(op.conflict) : null };
  });
  return { rows, pending };
}
export function visibleRecipes(state) {
  const values = new Map(state.rows.map(row => [row.recipe_id, row.deleted ? null : row.data]));
  for (const op of state.pending) values.set(op.id, op.data);
  return [...values.values()].filter(Boolean);
}

// Each account has its own durable outbox. Only changed recipes are written online.
// Server versions and tombstones protect edits made on another device.
export class RecipeSync {
  constructor({ userId, storage, api, online = () => true, uuid = () => crypto.randomUUID(), onChange = () => {}, exclusive = async operation => operation() }) {
    this.userId = userId; this.storage = storage; this.api = api; this.online = online; this.uuid = uuid; this.onChange = onChange; this.exclusive = exclusive;
    this.state = readAccount(storage, userId); this.status = 'waiting'; this.error = ''; this.lastSynced = null; this.busy = false; this.active = true;
  }
  snapshot() { return { recipes: visibleRecipes(this.state), pending: this.state.pending.length, conflicts: this.state.pending.filter(op => op.conflict), status: this.status, error: this.error, lastSynced: this.lastSynced }; }
  emit() { if (this.active) this.onChange(this.snapshot()); }
  revision(id) { return this.state.rows.find(row => row.recipe_id === id)?.version ?? 0; }
  write(state) {
    this.storage.setItem(accountStorageKey(this.userId), JSON.stringify(state));
    this.state = state;
    this.emit();
  }
  async refresh() {
    await this.exclusive(() => { if (this.active) { this.state = readAccount(this.storage, this.userId); this.emit(); } });
  }
  async commit(next, expectedVersions = {}) {
    if (!this.active) throw new Error('Sign in again before saving.');
    // Capture what this editor saw before waiting for another browser window.
    const base = this.state;
    const previous = new Map(visibleRecipes(base).map(recipe => [recipe.id, recipe]));
    const incoming = new Map(next.map(recipe => [recipe.id, cleanRecipe(recipe, recipe.id)]));
    await this.exclusive(() => {
      if (!this.active) throw new Error('Sign in again before saving.');
      this.state = readAccount(this.storage, this.userId);
      const pending = new Map(this.state.pending.map(op => [op.id, op]));
      for (const id of new Set([...previous.keys(), ...incoming.keys()])) {
        const before = previous.get(id) ?? null, after = incoming.get(id) ?? null;
        if (sameRecipe(before, after)) continue;
        const existing = pending.get(id);
        const baseVersion = base.rows.find(row => row.recipe_id === id)?.version ?? 0;
        pending.set(id, { id, data: after, baseVersion: existing?.baseVersion ?? expectedVersions[id] ?? baseVersion, mutationId: this.uuid(), conflict: existing?.conflict ?? null });
      }
      this.write({ ...this.state, pending: [...pending.values()] });
      this.status = this.online() ? 'waiting' : 'offline'; this.emit();
    });
  }
  async addDeviceRecipes(recipes) {
    await this.refresh();
    const known = new Set([...this.state.rows.map(row => row.recipe_id), ...this.state.pending.map(op => op.id)]);
    const additions = recipes.filter(recipe => !known.has(recipe.id));
    await this.commit([...visibleRecipes(this.state), ...additions]);
    return additions.length;
  }
  async resolve(id, choice) {
    await this.exclusive(() => {
      if (!this.active) return;
      this.state = readAccount(this.storage, this.userId);
      const op = this.state.pending.find(item => item.id === id);
      if (!op?.conflict) return;
      const pending = this.state.pending.filter(item => item.id !== id);
      if (choice === 'device') pending.push({ ...op, baseVersion: op.conflict.version, conflict: null, mutationId: this.uuid() });
      this.write({ ...this.state, pending });
      this.status = 'waiting'; this.emit();
    });
  }
  async flush() {
    if (!this.active || this.busy) return;
    if (!this.online()) { this.status = 'offline'; this.emit(); return; }
    this.busy = true; this.status = 'syncing'; this.error = ''; this.emit();
    try {
      await this.refresh();
      for (const captured of [...this.state.pending]) {
        await this.refresh();
        const op = this.state.pending.find(item => item.id === captured.id);
        if (!this.active) return;
        if (!op || op.conflict) continue;
        const response = await this.api.save(op);
        if (!this.active) return;
        if (!['applied', 'conflict'].includes(response.status)) throw new Error('Unexpected sync response.');
        const row = cleanRow(response.row);
        if (row.recipe_id !== op.id) throw new Error('Unexpected recipe identity.');
        await this.exclusive(() => {
          if (!this.active) return;
          this.state = readAccount(this.storage, this.userId);
          const existingRow = this.state.rows.find(item => item.recipe_id === row.recipe_id);
          const newestRow = existingRow && existingRow.version > row.version ? existingRow : row;
          const rows = [...this.state.rows.filter(item => item.recipe_id !== row.recipe_id), newestRow];
          const pending = this.state.pending.flatMap(current => {
            if (current.id !== op.id) return [current];
            if (response.status === 'conflict') return current.mutationId === op.mutationId ? [{ ...current, conflict: row }] : [current];
            // A new edit may have been queued while this request was in flight.
            return current.mutationId === op.mutationId ? [] : [{ ...current, baseVersion: row.version, conflict: null }];
          });
          this.write({ rows, pending });
        });
      }
      const remote = await this.api.list();
      if (!this.active) return;
      await this.exclusive(() => {
        if (!this.active) return;
        this.state = readAccount(this.storage, this.userId);
        const rows = new Map(this.state.rows.map(row => [row.recipe_id, row]));
        for (const item of remote) {
          const row = cleanRow(item);
          if (!rows.has(row.recipe_id) || row.version > rows.get(row.recipe_id).version) rows.set(row.recipe_id, row);
        }
        this.write({ ...this.state, rows: [...rows.values()] });
      });
      this.status = this.state.pending.some(op => op.conflict) ? 'conflict' : this.state.pending.length ? 'waiting' : 'synced';
      this.lastSynced = Date.now();
    } catch (error) {
      if (!this.active) return;
      this.status = this.online() ? 'error' : 'offline';
      this.error = this.online() ? 'Could not sync. Your changes are saved on this device and will retry automatically. If this continues, check your connection or sign in again.' : '';
    } finally { this.busy = false; this.emit(); }
  }
  stop() { this.active = false; }
}
