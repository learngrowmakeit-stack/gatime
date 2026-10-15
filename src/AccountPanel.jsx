import {startGoogleSignIn} from './google-sign-in';
import DeleteAccount from './DeleteAccount';
import { useLanguage } from './Language';
import React, { useState } from 'react';
import { Cloud, LogIn, LogOut, RefreshCw, X } from 'lucide-react';
import { cloud, missingCloudConfig, signInCallbackFailed } from './cloud';
export default function AccountPanel({
  account,
  onAccountChange,
  onNotice
}) {
  const {
    t
  } = useLanguage();
  const [open, setOpen] = useState(()=>signInCallbackFailed||['delete-account','account'].some(key=>new URLSearchParams(window.location.search).has(key)));
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy,setGoogleBusy]=useState(false);
  const [message, setMessage] = useState(signInCallbackFailed?'Sign-in was not completed. Try again.':'');
  const [confirmation, setConfirmation] = useState(false);
  const {
    user,
    sync,
    authReady,
    syncNow,
    addDeviceRecipes,
    guestCount,
    resolve
  } = account;
  async function sendLink(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const {
        error
      } = await cloud.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      setMessage('Check your email and open the sign-in link on this device. Use the same email on your other devices.');
    } catch {
      setMessage('Could not send the sign-in email. Check your connection and try again in a minute.');
    } finally {
      setBusy(false);
    }
  }
  async function signInGoogle() {
    if (busy || googleBusy) return;
    if (!navigator.onLine) {setMessage('Connect to the internet to sign in with Google.');return;}
    setGoogleBusy(true);setMessage('');
    try {
      await startGoogleSignIn(cloud,window.location.origin);
    } catch {
      setMessage('Could not start Google sign-in. Check your connection and try again.');
    } finally {setGoogleBusy(false);}
  }
  async function signOut() {
    setBusy(true);
    try {
      const {
        error
      } = await cloud.auth.signOut({
        scope: 'local'
      });
      if (error) throw error;
      setOpen(false);
      onAccountChange();
    } catch {
      onNotice('Could not sign out. Reconnect and try again.');
    } finally {
      setBusy(false);
    }
  }
  const label = !authReady ? 'Opening your account…' : !user ? 'Saved on this device' : sync.status === 'synced' ? 'Synced across your devices' : sync.status === 'syncing' ? 'Syncing recipes…' : sync.status === 'error' ? 'Sync needs attention' : sync.status === 'conflict' ? 'Choose which edit to keep' : sync.status === 'offline' || !navigator.onLine ? `Offline · ${sync.pending} changes waiting` : sync.pending ? `${sync.pending} changes waiting to sync` : 'Connecting to your recipes…';
  return <div className="account-panel">
    <button className="profile account-profile" onClick={() => {
      setOpen(!open);
      setMessage('');
    }} aria-expanded={open}><div className="avatar">{user ? user.email?.[0].toUpperCase() : 'Y'}</div><div><strong>{user ? user.email : t("Your kitchen")}</strong><span>{t(label)}</span></div><Cloud size={17} /></button>
    {open && <section className="account-menu" aria-label={t("Recipe account")}><button className="account-close icon-button" onClick={() => setOpen(false)} aria-label={t("Close account")}><X size={15} /></button>
      {!cloud ? <><h3>{t("Sync across devices")}</h3><p>{t("This published version is missing the following setup values:")}</p><ul className="missing-config">{missingCloudConfig.map(name => <li key={name}><code>{name}</code></li>)}</ul><p>{t("Add these in Vercel\u2019s Production environment and deploy again. Your recipes are still saved on this device.")}</p></> : !authReady ? <p>{t("Opening your account\u2026")}</p> : !user ? <><h3>{t("Your recipes, everywhere.")}</h3><p>{t("Sign in with the same email on your phone and computer. No password to remember.")}</p><button className="google-signin" disabled={busy||googleBusy} onClick={signInGoogle}><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.91H24v7.4h11a9.4 9.4 0 0 1-4.08 6.18v5.13h6.61c3.87-3.56 6.08-8.81 6.08-14.8Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.82 13.47-4.94l-6.61-5.13c-1.83 1.22-4.17 1.96-6.86 1.96-5.3 0-9.8-3.58-11.41-8.4H5.77v5.29A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.59 27.49A12 12 0 0 1 12 24c0-1.21.21-2.39.59-3.49v-5.29H5.77A20 20 0 0 0 4 24c0 3.23.77 6.28 2.13 8.98l6.46-5.49Z"/><path fill="#EA4335" d="M24 12.11c3 0 5.68 1.03 7.8 3.05l5.85-5.85A19.6 19.6 0 0 0 24 4 20 20 0 0 0 5.77 15.22l6.82 5.29C14.2 15.69 18.7 12.11 24 12.11Z"/></svg>{googleBusy?t('Opening Google…'):t('Continue with Google')}</button><p className="account-divider">{t('Or use an email sign-in link')}</p><form onSubmit={sendLink}><label>{t("Email address")}<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label><button className="primary-button" disabled={busy||googleBusy}><LogIn size={15} />{busy ? t("Sending\u2026") : t("Email me a sign-in link")}</button></form>{message && <p className="account-message" role="status">{t(message)}</p>}</> : <><h3>{t("Your recipe account")}</h3><p className="account-email">{user.email}</p><p role="status">{t(label)}</p>{sync.error && <p className="account-message" role="alert">{t(sync.error)}</p>}<button className="secondary-button" onClick={syncNow} disabled={sync.status === 'syncing'}><RefreshCw size={14} />{t("Sync now")}</button>
      {guestCount > 0 && <div className="device-import"><p>{t("Recipes saved on this device before sign-in stay separate until you add them to your account.")}</p><button onClick={() => setConfirmation(!confirmation)}>{t("Add this device\u2019s recipes")}</button>{confirmation && <><p>{t("Add up to") + " "}{guestCount}{" " + t("recipes to this account? Recipes already added will be skipped. The device copies are kept.")}</p><button className="secondary-button" onClick={async () => {
              const count = await addDeviceRecipes();
              if (count !== undefined) {
                setConfirmation(false);
                onNotice(`Added ${count} device recipes to your account. They will sync when online.`);
              }
            }}>{t("Add recipes to my account")}</button></>}</div>}
      {sync.conflicts.map(op => <div className="sync-conflict" key={op.id}><strong>{op.data?.title || op.conflict.data?.title || t("Deleted recipe")}</strong><p>{t("This recipe changed on another device. Your edit has been kept safely. Which version should be saved?")}</p><button onClick={() => resolve(op.id, 'device')}>{t("Keep this device\u2019s") + " "}{op.data ? t("edit") : t("deletion")}</button><button onClick={() => resolve(op.id, 'cloud')}>{t("Keep the online") + " "}{op.conflict.deleted ? t("deletion") : t("version")}</button></div>)}
      <DeleteAccount account={account}/><button className="signout-button" onClick={signOut} disabled={busy}><LogOut size={14} />{busy ? t("Signing out\u2026") : t("Sign out on this device")}</button><p className="account-footnote">{sync.pending ? t("Pending changes remain saved for this account and will sync when you sign back in.") : t("Your device recipes stay separate from your account.")}</p></>}
    </section>}
  </div>;
}
