import { Injectable, signal } from '@angular/core';

export type ConsentState = 'granted' | 'denied' | 'unset';

const STORAGE_KEY = 'cookie-consent';

/**
 * Consentimento do usuário para cookies não essenciais (Google Analytics
 * e, quando configurado, Google AdSense). Persistido em localStorage —
 * enquanto estiver "unset", nem Analytics nem anúncios são carregados
 * (ver `App` e `AdSlotComponent`).
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly _consent = signal<ConsentState>(readStoredConsent());

  readonly consent = this._consent.asReadonly();

  grant(): void {
    this._consent.set('granted');
    persistConsent('granted');
  }

  deny(): void {
    this._consent.set('denied');
    persistConsent('denied');
  }
}

function readStoredConsent(): ConsentState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : 'unset';
  } catch {
    return 'unset';
  }
}

function persistConsent(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, state);
  } catch {
    // localStorage indisponível (ex.: modo privado) — a escolha vale só para esta sessão.
  }
}
