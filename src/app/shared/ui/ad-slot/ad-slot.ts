import { AfterViewInit, Component, computed, input } from '@angular/core';

import { ADSENSE_CLIENT_ID, isSlotConfigured } from '../../../core/ads/adsense.config';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Bloco de anúncio do Google AdSense, reutilizável em qualquer página.
 * Não renderiza nada (nem consome espaço) enquanto o bloco de anúncio não
 * tiver um ID real criado no painel do AdSense — ver `adsense.config.ts`.
 */
@Component({
  selector: 'app-ad-slot',
  imports: [],
  templateUrl: './ad-slot.html',
  styleUrl: './ad-slot.scss',
})
export class AdSlotComponent implements AfterViewInit {
  readonly slot = input.required<string>();

  readonly clientId = ADSENSE_CLIENT_ID;
  readonly configured = computed(() => isSlotConfigured(this.slot()));

  ngAfterViewInit(): void {
    if (!this.configured()) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Bloqueadores de anúncio podem impedir isso — falha silenciosamente.
    }
  }
}
