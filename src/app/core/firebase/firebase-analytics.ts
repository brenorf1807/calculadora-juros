import { initializeApp } from 'firebase/app';
import { isSupported, getAnalytics } from 'firebase/analytics';

import { firebaseConfig } from './firebase.config';

/**
 * Inicializa o Firebase App e, quando suportado pelo navegador (ex.: não
 * bloqueado por extensões de privacidade, não em modo privado em alguns
 * browsers), o Google Analytics. Chamado uma única vez na inicialização
 * da aplicação — ver `provideAppInitializer` em `app.config.ts`.
 */
export async function initializeFirebaseAnalytics(): Promise<void> {
  const app = initializeApp(firebaseConfig);

  if (await isSupported()) {
    getAnalytics(app);
  }
}
