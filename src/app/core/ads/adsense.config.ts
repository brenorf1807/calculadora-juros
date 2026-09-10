/**
 * Configuração do Google AdSense.
 *
 * `ADSENSE_CLIENT_ID` já é o Publisher ID real da conta AdSense do site
 * (obtido em https://www.google.com/adsense/). O script do AdSense em si é
 * carregado sem esperar consentimento — ver a tag `<script>` em
 * `src/index.html` — porque o Google exige que ele esteja presente (e sem
 * gate de clique) em toda página para verificar o site e liberar o Auto
 * ads. Só o Firebase Analytics fica atrás do aviso de cookies.
 *
 * `ADSENSE_SLOTS` ainda está com um PLACEHOLDER: nenhum bloco de anúncio
 * manual (`<ins class="adsbygoogle">`, usado pelo `AdSlotComponent` no
 * rodapé) foi criado no painel do AdSense ainda. Até lá, `isSlotConfigured()`
 * retorna `false` para esse ID e o `AdSlotComponent` não renderiza nada.
 *
 * Para ativar o bloco do rodapé:
 * 1. Criar o bloco de anúncio (ad unit) no painel do AdSense.
 * 2. Colocar o ID gerado em `ADSENSE_SLOTS.footer`.
 * 3. Atualizar `public/ads.txt` com a linha fornecida pelo AdSense.
 * Nenhuma outra mudança de código é necessária — ver o README.
 */
export const ADSENSE_CLIENT_ID: string = 'ca-pub-2967676720541876';

/** IDs dos blocos de anúncio (ad units), criados no painel do AdSense. */
export const ADSENSE_SLOTS = {
  /** Bloco exibido no rodapé de todas as páginas (ver app.html). */
  footer: '0000000000',
};

const PLACEHOLDER_CLIENT_ID = 'ca-pub-0000000000000000';
const PLACEHOLDER_SLOT_ID = '0000000000';

export function isAdsenseConfigured(): boolean {
  return ADSENSE_CLIENT_ID !== PLACEHOLDER_CLIENT_ID && /^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT_ID);
}

/** Um bloco de anúncio manual só deve renderizar depois de ter um ID real. */
export function isSlotConfigured(slotId: string): boolean {
  return isAdsenseConfigured() && slotId !== PLACEHOLDER_SLOT_ID && /^\d+$/.test(slotId);
}
