import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { DEMO_RECIPES } from './recipes.js';

test('database enforces account isolation, version conflicts, idempotent retries and deletions', async t => {
  const db = new PGlite();
  const alice='11111111-1111-4111-8111-111111111111', bob='22222222-2222-4222-8222-222222222222';
  const recipe={...DEMO_RECIPES[0],id:'shared-id',image:'data:image/jpeg;base64,/9j/'+'A'.repeat(59970)};
  let mutation=0;
  const nextMutation=()=>`00000000-0000-4000-8000-${String(++mutation).padStart(12,'0')}`;
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid stable language sql as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
      grant usage on schema auth to authenticated, anon;
      insert into auth.users(id) values ('${alice}'), ('${bob}');`);
    const schema=await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8');
    await db.exec(schema);await db.exec(schema);
    async function asUser(id,role='authenticated') {
      await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub', $1, false)",[id]);await db.exec(`set role ${role}`);
    }
    async function save(data,version,id=nextMutation()) {
      const result=await db.query('select public.save_recipe($1,$2::jsonb,$3,$4::uuid) as result',['shared-id',data === null ? null : JSON.stringify(data),version,id]);return result.rows[0].result;
    }
    await t.test('signed-in account can save and retry safely',async()=>{
      await asUser(alice);const id=nextMutation();const first=await save(recipe,0,id);assert.equal(first.status,'applied');assert.equal(first.row.version,1);assert.equal(first.row.data.image,recipe.image);
      const again=await save(recipe,0,id);assert.deepEqual(again,first);
    });
    await t.test('another account cannot read or overwrite the first account’s data',async()=>{
      await asUser(bob);assert.equal((await db.query('select * from public.recipes')).rows.length,0);
      await save({...recipe,title:'Bob recipe'},0);const rows=(await db.query('select * from public.recipes')).rows;assert.equal(rows.length,1);assert.equal(rows[0].user_id,bob);
      await asUser(alice);assert.equal((await db.query('select data from public.recipes')).rows[0].data.title,recipe.title);
    });
    await t.test('direct table writes cannot bypass version protection',async()=>{
      await asUser(alice);await assert.rejects(()=>db.query('update public.recipes set version = 99'));
      await assert.rejects(()=>db.query('delete from public.recipes'));await assert.rejects(()=>db.query('select * from public.recipe_mutations'));
    });
    await t.test('old versions receive conflicts, never overwrite new edits',async()=>{
      await asUser(alice);const updated=await save({...recipe,title:'New edit'},1);assert.equal(updated.row.version,2);
      const conflict=await save({...recipe,title:'Stale edit'},1);assert.equal(conflict.status,'conflict');assert.equal(conflict.row.data.title,'New edit');
    });
    await t.test('deleted recipes keep a tombstone and reject stale resurrection',async()=>{
      await asUser(alice);const deleted=await save(null,2);assert.equal(deleted.row.deleted,true);assert.equal(deleted.row.data,null);assert.equal(deleted.row.version,3);
      const conflict=await save(recipe,2);assert.equal(conflict.status,'conflict');assert.equal(conflict.row.deleted,true);
    });
    await t.test('anonymous clients cannot read data or execute the write function',async()=>{
      await asUser('','anon');await assert.rejects(()=>db.query('select * from public.recipes'));await assert.rejects(()=>save(recipe,0));
    });
    await t.test('missing authentication and invalid payloads are refused',async()=>{
      await asUser('');await assert.rejects(()=>save(recipe,0));
      await asUser(alice);await assert.rejects(()=>save({...recipe,id:'other'},3));
    });
  } finally { await db.close(); }
});
