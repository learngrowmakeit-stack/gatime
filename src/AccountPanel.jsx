import React, { useState } from 'react';
import { Cloud, LogIn, LogOut, RefreshCw, X } from 'lucide-react';
import { cloud } from './cloud';

export default function AccountPanel({ account, onAccountChange, onNotice }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const { user, sync, authReady, syncNow, addDeviceRecipes, guestCount, resolve } = account;
  async function sendLink(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const { error } = await cloud.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      setMessage('Check your email and open the sign-in link on this device. Use the same email on your other devices.');
    } catch { setMessage('Could not send the sign-in email. Check your connection and try again in a minute.'); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await cloud.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setOpen(false); onAccountChange();
    } catch { onNotice('Could not sign out. Reconnect and try again.'); }
    finally { setBusy(false); }
  }
  const label = !authReady ? 'Opening your account…' : !user ? 'Saved on this device' : sync.status === 'synced' ? 'Synced across your devices' : sync.status === 'syncing' ? 'Syncing recipes…' : sync.status === 'error' ? 'Sync needs attention' : sync.status === 'conflict' ? 'Choose which edit to keep' : sync.status === 'offline' || !navigator.onLine ? `Offline · ${sync.pending} changes waiting` : sync.pending ? `${sync.pending} changes waiting to sync` : 'Connecting to your recipes…';
  return <div className="account-panel">
    <button className="profile account-profile" onClick={() => {setOpen(!open);setMessage('');}} aria-expanded={open}><div className="avatar">{user ? user.email?.[0].toUpperCase() : 'Y'}</div><div><strong>{user ? user.email : 'Your kitchen'}</strong><span>{label}</span></div><Cloud size={17}/></button>
    {open && <section className="account-menu" aria-label="Recipe account"><button className="account-close icon-button" onClick={() => setOpen(false)} aria-label="Close account"><X size={15}/></button>
      {!cloud ? <><h3>Sync across devices</h3><p>Online accounts are being set up. Your recipes are still saved on this device; Export keeps a backup.</p></> : !authReady ? <p>Opening your account…</p> : !user ? <><h3>Your recipes, everywhere.</h3><p>Sign in with the same email on your phone and computer. No password to remember.</p><form onSubmit={sendLink}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/></label><button className="primary-button" disabled={busy}><LogIn size={15}/>{busy ? 'Sending…' : 'Email me a sign-in link'}</button></form>{message && <p className="account-message" role="status">{message}</p>}</> : <><h3>Your recipe account</h3><p className="account-email">{user.email}</p><p role="status">{label}</p>{sync.error && <p className="account-message" role="alert">{sync.error}</p>}<button className="secondary-button" onClick={syncNow} disabled={sync.status === 'syncing'}><RefreshCw size={14}/>Sync now</button>
      {guestCount > 0 && <div className="device-import"><p>Recipes saved on this device before sign-in stay separate until you add them to your account.</p><button onClick={() => setConfirmation(!confirmation)}>Add this device’s recipes</button>{confirmation && <><p>Add up to {guestCount} recipes to this account? Recipes already added will be skipped. The device copies are kept.</p><button className="secondary-button" onClick={async () => {const count=await addDeviceRecipes(); if(count !== undefined) {setConfirmation(false);onNotice(`Added ${count} device recipes to your account. They will sync when online.`);}}}>Add recipes to my account</button></>}</div>}
      {sync.conflicts.map(op=><div className="sync-conflict" key={op.id}><strong>{op.data?.title || op.conflict.data?.title || 'Deleted recipe'}</strong><p>This recipe changed on another device. Your edit has been kept safely. Which version should be saved?</p><button onClick={()=>resolve(op.id,'device')}>Keep this device’s {op.data ? 'edit' : 'deletion'}</button><button onClick={()=>resolve(op.id,'cloud')}>Keep the online {op.conflict.deleted ? 'deletion' : 'version'}</button></div>)}
      <button className="signout-button" onClick={signOut} disabled={busy}><LogOut size={14}/>{busy ? 'Signing out…' : 'Sign out on this device'}</button><p className="account-footnote">{sync.pending ? 'Pending changes remain saved for this account and will sync when you sign back in.' : 'Your device recipes stay separate from your account.'}</p></>}
    </section>}
  </div>;
}
