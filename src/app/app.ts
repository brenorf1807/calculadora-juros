import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ADSENSE_SLOTS, isAdsenseConfigured } from './core/ads/adsense.config';
import { loadAdsenseScript } from './core/ads/adsense-loader';
import { initializeFirebaseAnalytics } from './core/firebase/firebase-analytics';
import { ConsentService } from './core/services/consent.service';
import { AdSlotComponent } from './shared/ui/ad-slot/ad-slot';
import { CookieConsentBannerComponent } from './shared/ui/cookie-consent-banner/cookie-consent-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CookieConsentBannerComponent, AdSlotComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly consentService = inject(ConsentService);

  protected readonly navLinks = [
    { path: '/', label: 'Início', exact: true },
    { path: '/juros-compostos', label: 'Juros Compostos', exact: false },
    { path: '/financiamento', label: 'Financiamento', exact: false },
    { path: '/salario', label: 'Salário Líquido', exact: false },
    { path: '/ferias', label: 'Férias', exact: false },
    { path: '/mes-de-ferias', label: 'Mês de Férias', exact: false },
    { path: '/rescisao', label: 'Rescisão', exact: false },
  ];

  protected readonly showAdSlot = isAdsenseConfigured();
  protected readonly footerAdSlot = ADSENSE_SLOTS.footer;

  constructor() {
    // Firebase Analytics e AdSense só carregam depois que o usuário
    // aceita o aviso de cookies (ConsentService) — nunca antes disso.
    effect(() => {
      if (this.consentService.consent() === 'granted') {
        initializeFirebaseAnalytics();
        loadAdsenseScript();
      }
    });
  }
}
