import { useEffect, useRef, useState } from 'react';
import {clearAccountData} from './account-data';
import { cloud, recipeApi } from './cloud';
import { RecipeSync } from './sync-core';
import { DEMO_RECIPES, STORAGE_KEY, parseRecipes } from './recipes';

function loadGuest() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return { recipes: raw === null ? DEMO_RECIPES : parseRecipes(raw), error: '' }; }
  catch { return { recipes: [], error: 'Your device recipes could not be read. Export or restore a backup before making changes. The original data has not been overwritten.' }; }
}
const guestStatus = { pending: 0, conflicts: [], status: 'guest', error: '', lastSynced: null };
export default function useRecipes() {
  const [guest, setGuest] = useState(loadGuest);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!cloud);
  const [sync, setSync] = useState(guestStatus);
  const [recipes, setRecipes] = useState(guest.recipes);
  const [ownerId, setOwnerId] = useState(null);
  const [storageError, setStorageError] = useState(guest.error);
  const engine = useRef(null);
  const guestRef = useRef(guest); guestRef.current = guest;
  const syncNow = () => engine.current?.flush();

  useEffect(() => {
    if (!cloud) return;
    let active = true;
    const { data: { subscription } } = cloud.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setAuthReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    engine.current?.stop(); engine.current = null;
    if (!user) { setOwnerId(null); setRecipes(guestRef.current.recipes); setStorageError(guestRef.current.error); setSync(guestStatus); return; }
    let service;
    try {
      service = new RecipeSync({ userId: user.id, storage: localStorage, api: recipeApi(user.id), online: () => navigator.onLine,
        exclusive: operation => navigator.locks ? navigator.locks.request(`gatime-recipes:${user.id}`, operation) : Promise.resolve().then(operation),
        onChange: snapshot => { setRecipes(snapshot.recipes); setSync(snapshot); },
      });
      engine.current = service; setOwnerId(user.id); setStorageError(''); setRecipes(service.snapshot().recipes); setSync(service.snapshot());
    } catch {
      setRecipes([]); setStorageError('Your saved account data could not be read. Your data has not been overwritten. Restore a backup or use another browser to access your online recipes.');
      setSync({ ...guestStatus, status: 'error' }); return;
    }
    const run = () => service.flush();
    const storageChanged = event => { if (event.key === `gatime.account.v1:${user.id}`) service.refresh().catch(() => setStorageError('Could not read updated device storage.')); };
    run(); const timer = setInterval(run, 15000);
    const visible = () => { if (document.visibilityState === 'visible') run(); };
    window.addEventListener('storage', storageChanged); window.addEventListener('online', run); window.addEventListener('focus', run); document.addEventListener('visibilitychange', visible);
    return () => { service.stop(); clearInterval(timer); window.removeEventListener('storage', storageChanged); window.removeEventListener('online', run); window.removeEventListener('focus', run); document.removeEventListener('visibilitychange', visible); };
  }, [user?.id]);

  async function persist(next, versions = {}) {
    if (!authReady) { setStorageError('Please wait while your account opens.'); return false; }
    try {
      if (user) {
        if (!engine.current || engine.current.userId !== user.id) throw new Error('Account unavailable');
        await engine.current.commit(next, versions); syncNow();
      } else {
        if (guestRef.current.error) throw new Error('Device data unreadable');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        const value = { recipes: next, error: '' }; guestRef.current = value; setGuest(value); setRecipes(next);
      }
      setStorageError(''); return true;
    } catch { setStorageError('Could not save this change on this device. Free up browser storage, enable local storage, or restore unreadable data from a backup, then try again.'); return false; }
  }
  async function addDeviceRecipes() {
    if (!engine.current || guestRef.current.error) return;
    try { const count = await engine.current.addDeviceRecipes(guestRef.current.recipes); syncNow(); return count; }
    catch { setStorageError('Could not add these recipes. Check browser storage and try again.'); }
  }
  async function resolve(id, choice) { try { await engine.current?.resolve(id, choice); syncNow(); } catch { setStorageError('Could not save your conflict choice. Check browser storage and retry.'); } }
  async function deleteAccount(email) {
    if (!user || !cloud) throw new Error('SIGN_IN');
    const {data:{session}}=await cloud.auth.getSession();
    if (!session) throw new Error('SIGN_IN');
    const response=await fetch('/api/delete-account',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({confirm:'DELETE_MY_ACCOUNT',email})});
    const result=await response.json();
    if(!response.ok||!result.deleted)throw new Error(result.error||'DELETE_FAILED');
    engine.current?.stop();engine.current=null;
    // Clear only after the server confirms deletion. Never clear guest recipes.
    clearAccountData(localStorage,user.id);
    await cloud.auth.signOut({scope:'local'}).catch(()=>{});
    // Supabase's default storage key; also remove it if an offline sign-out failed.
    const authKey=`sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
    for(const suffix of ['', '-code-verifier', '-user'])localStorage.removeItem(authKey+suffix);
    window.location.replace('/');
  }
  return { deleteAccount, recipes: user ? ownerId === user.id ? recipes : [] : guest.recipes, user, authReady, sync, storageError, persist, syncNow, addDeviceRecipes, guestCount: guest.recipes.length, revision: id => engine.current?.revision(id) ?? 0, resolve };
}
