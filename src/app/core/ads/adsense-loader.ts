import { ADSENSE_CLIENT_ID, isAdsenseConfigured } from './adsense.config';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptLoaded = false;

/**
 * Injeta o script do Google AdSense uma única vez. Só deve ser chamada
 * depois de confirmar `isAdsenseConfigured()` (Client ID real
 * configurado) e consentimento do usuário concedido — ver `App`.
 */
export function loadAdsenseScript(): void {
  if (scriptLoaded || !isAdsenseConfigured()) {
    return;
  }
  scriptLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}
