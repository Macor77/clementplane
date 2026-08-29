import { useEffect, useMemo, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  INSTALL_HINT_COOLDOWN_MS,
  getAccessMode,
  isIosDevice,
  isMobileDevice,
  isStandalone,
  shouldShowInstallHint,
} from '../../pwa/pwaEnvironment.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { trackProductEvent } from '../../services/productAnalyticsService.js';
import './PwaManager.css';

const DISMISSED_KEY = 'clementplane:pwa-install-dismissed-at';
const INSTALLED_KEY = 'clementplane:pwa-installed';

function readInstalledFlag() {
  try {
    return window.localStorage.getItem(INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

function readDismissedAt() {
  try {
    return Number(window.localStorage.getItem(DISMISSED_KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function PwaManager() {
  const { session } = useAuth();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissedAt, setDismissedAt] = useState(readDismissedAt);
  const [appInstalled, setAppInstalled] = useState(() => isStandalone(window, navigator) || readInstalledFlag());
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const trackedUsersRef = useRef(new Set());
  const ios = isIosDevice(navigator);
  const mobile = isMobileDevice(navigator);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setAppInstalled(false);
      try {
        window.localStorage.removeItem(INSTALLED_KEY);
      } catch {
        // Le prompt reste utilisable même si le stockage local est indisponible.
      }
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setAppInstalled(true);
      try {
        window.localStorage.setItem(INSTALLED_KEY, '1');
      } catch {
        // Le mode standalone masquera tout de même l’invitation dans l’application installée.
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);


  useEffect(() => {
    if (!needRefresh) return;
    updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || trackedUsersRef.current.has(userId)) return;

    trackedUsersRef.current.add(userId);
    const accessMode = getAccessMode(window, navigator);
    trackProductEvent('app_opened', accessMode, { access_mode: accessMode }).catch((error) => {
      console.warn('Impossible de journaliser le mode d’accès PWA', error);
    });
  }, [session?.user?.id]);

  const showInstallHint = useMemo(() => shouldShowInstallHint({
    installed: appInstalled,
    dismissedAt,
    cooldownMs: INSTALL_HINT_COOLDOWN_MS,
  }), [appInstalled, dismissedAt]);

  const dismissInstallHint = () => {
    const value = Date.now();
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(value));
    } catch {
      // Le bandeau peut tout de même être fermé si le stockage local est indisponible.
    }
    setDismissedAt(value);
  };

  const install = async () => {
    if (!deferredPrompt) {
      setInstallHelpOpen(true);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="pwa-notices" aria-live="polite" aria-atomic="false">
      {!online && (
        <div className="pwa-notice pwa-notice--offline" role="status">
          <div className="pwa-notice__text">
            <strong>Vous êtes hors connexion.</strong>
            <span>Clementplane nécessite une connexion Internet pour accéder aux données et les modifier.</span>
          </div>
        </div>
      )}



      {session?.user && online && showInstallHint && !needRefresh && mobile && (
        <div className="pwa-notice pwa-notice--install" role="status">
          <div className="pwa-notice__text">
            <strong>Clementplane sur votre téléphone</strong>
            <span>
              {installHelpOpen
                ? (ios
                  ? 'Sur iPhone/iPad : touchez Partager, puis « Sur l’écran d’accueil » et « Ajouter ».'
                  : 'Dans Chrome, ouvrez le menu ⋮ puis choisissez « Installer et créer un raccourci ».'
                )
                : 'Installez Clementplane pour y accéder directement depuis votre écran d’accueil.'}
            </span>
          </div>
          <div className="pwa-notice__actions">
            {!installHelpOpen && (
              <button type="button" className="pwa-notice__primary" onClick={install}>
                Installer Clementplane
              </button>
            )}
            <button type="button" className="pwa-notice__close" onClick={dismissInstallHint} aria-label="Fermer l’aide à l’installation">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
