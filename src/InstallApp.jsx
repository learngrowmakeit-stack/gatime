import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Register early so Chrome's install event is retained even while React mounts.
let pendingInstall = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  pendingInstall = event;
  window.dispatchEvent(new Event('gatime-install-available'));
});

export default function InstallApp() {
  const [install, setInstall] = useState(pendingInstall);
  const [standalone, setStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone));
  const [offline, setOffline] = useState(!navigator.onLine);
  const [controlled, setControlled] = useState(Boolean(navigator.serviceWorker?.controller));
  const [help, setHelp] = useState(false);
  const [installError, setInstallError] = useState('');
  const { offlineReady: [ready], needRefresh: [refresh, setRefresh], updateServiceWorker } = useRegisterSW();

  useEffect(() => {
    const available = () => setInstall(pendingInstall);
    const installed = () => { pendingInstall = null; setInstall(null); setStandalone(true); setHelp(false); };
    const connectivity = () => setOffline(!navigator.onLine);
    const controllerChanged = () => setControlled(Boolean(navigator.serviceWorker?.controller));
    navigator.serviceWorker?.addEventListener('controllerchange', controllerChanged);
    window.addEventListener('gatime-install-available', available);
    window.addEventListener('appinstalled', installed);
    window.addEventListener('online', connectivity);
    window.addEventListener('offline', connectivity);
    return () => {
      window.removeEventListener('gatime-install-available', available);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', connectivity);
      window.removeEventListener('offline', connectivity);
      navigator.serviceWorker?.removeEventListener('controllerchange', controllerChanged);
    };
  }, []);

  async function installApp() {
    if (!install) { setHelp(!help); return; }
    try {
      await install.prompt();
      await install.userChoice;
      pendingInstall = null;
      setInstall(null);
    } catch {
      setInstallError('Open Chrome’s menu and choose “Add to Home screen” to install.');
    }
  }

  return <div className="install-app">
    {!standalone && <button className="install-button" onClick={installApp}><Download size={16}/>Install Gatime</button>}
    {help && !standalone && <p className="install-help">On Android, open this site in Chrome. Tap ⋮, then <strong>Add to Home screen → Install</strong>. If only a shortcut is offered, reload once while online and try again.</p>}
    {installError && <p className="install-help" role="alert">{installError}</p>}
    {offline && <p className="offline-status" role="status"><WifiOff size={13}/>{ready || controlled ? 'Offline · recipes still available' : 'You’re offline'}</p>}
    {!offline && (ready || controlled) && <p className="offline-status">Ready to use offline</p>}
    {refresh && <div className="app-update"><p>A new version is ready. Save any recipe you’re editing before updating.</p><div><button onClick={() => updateServiceWorker(true)}><RefreshCw size={13}/>Update app</button><button aria-label="Dismiss app update" onClick={() => setRefresh(false)}><X size={14}/></button></div></div>}
  </div>;
}
