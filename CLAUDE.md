# Calculadora Financeira — guia para o Claude

Aplicação Angular 20 (standalone components, sem backend) com calculadoras financeiras e trabalhistas
brasileiras. Todo cálculo roda no navegador do usuário. Deploy automático no Firebase Hosting a cada
push em `main`.

## Visão geral do produto

Calculadoras disponíveis (todas em `src/app/features/`):

- **Juros Compostos** (`compound-interest/`) — evolução de investimento com aportes mensais.
- **Financiamento** (`financing/`) — parcelas e tabela de amortização, Tabela Price ou SAC.
- **Salário Líquido** (`payroll/`) — desconto de INSS e IRRF a partir do bruto, com gráfico de pizza.
- **Férias** (`vacation/`) — valor líquido das férias (1/3 constitucional) + adiantamento do 13º.
- **Mês de Férias** (`vacation-payroll/`) — une salário e férias do mesmo mês: INSS com teto único,
  IRRF apurado separadamente para cada parte (ver "Regras de domínio" abaixo — isso já gerou vários
  bugs reais, tome cuidado ao mexer aqui).
- **Rescisão** (`termination/`) — verbas rescisórias para 4 motivos: sem justa causa, justa causa,
  pedido de demissão, acordo entre as partes (art. 484-A CLT). Rescisão indireta, culpa recíproca,
  contrato por prazo determinado, aposentadoria e morte do empregado **não estão implementados** —
  isso é intencional e está documentado na própria página.
- **Política de Privacidade** (`legal/privacy-page/`) — página estática, rota `/privacidade`.

A home (`features/home/`) não tem mais nenhum card "em breve"/placeholder — isso foi removido de
propósito (ver seção AdSense). Se adicionar um módulo novo, só adicione o card quando a feature
estiver pronta e navegável.

## Arquitetura e padrões

- **Cálculo puro, sem Angular**: cada feature tem um `*.calculations.ts` sem nenhum import do
  Angular, recebendo `tables: TaxTables = DEFAULT_TAX_TABLES` como parâmetro opcional. Isso torna os
  cálculos testáveis isoladamente e reutilizáveis. Nunca coloque lógica de cálculo dentro de um
  componente.
- **INSS/IRRF compartilhados**: `src/app/core/tax/` tem `tax-tables.model.ts`,
  `default-tax-tables.ts` e `inss-irrf.calculations.ts` (funções `calculateINSS`,
  `calculateIRRFFromTable`, `applyIrrfReducer`, `calculateIRRF`). Usadas por payroll, vacation,
  vacation-payroll e termination. Se o governo publicar novos valores de tabela, só é preciso
  atualizar `default-tax-tables.ts` e `public/data/tax-tables-2026.json` — nenhuma lógica muda.
- **TaxTablesService** (`core/services/tax-tables.service.ts`) busca
  `public/data/tax-tables-2026.json` via `HttpClient` em runtime e cai para `DEFAULT_TAX_TABLES` se
  falhar. Não existe API pública gratuita de tabelas INSS/IRRF no Brasil — já pesquisado.
- **Componentes de UI compartilhados** em `shared/ui/`: `pie-chart`, `balance-chart`,
  `schedule-table`, `currency-input`, `percent-input`, `unit-toggle`, `result-card`, `ad-slot`,
  `cookie-consent-banner`.
- **GOTCHA DE REATIVIDADE (já causou bug real, duas vezes)**: um `computed()` que lê
  `form.controls.x.value` diretamente **nunca invalida** quando o form muda, porque `.value` é uma
  propriedade simples, não um signal. Use sempre
  `toSignal(form.controls.x.valueChanges, { initialValue: form.controls.x.value })` e leia esse
  signal dentro do `computed()`. Isso já quebrou a tela de Rescisão (campos condicionais que não
  apareciam/sumiam ao trocar o motivo) — foi corrigido, mas o padrão errado é fácil de reintroduzir.
- Layout comum das páginas de calculadora (`.calculator`, `.calculator__header`,
  `.calculator__grid`, `.calculator__results`, `.calculator__hint`, `.calculator__explainer`) está em
  `src/styles.scss`, não duplicado em cada página.

## Regras de domínio (leis e cálculos — não simplifique sem entender por quê)

Este projeto já passou por **vários rounds de bugs reais de cálculo**, todos reportados pelo usuário
(que tem conhecimento de direito trabalhista/tributário) comparando os resultados com cálculo manual.
As regras abaixo são o estado final, correto e testado — qualquer alteração aqui deve vir com testes
reproduzindo os cenários antigos.

- **INSS**: progressivo por faixas (cada faixa só paga sua alíquota sobre a parte do salário que cai
  nela), com teto de contribuição.
- **IRRF**: progressivo sobre a base (salário − INSS já descontado − dedução por dependente), com o
  redutor da **Lei 15.270/2025** (vigente desde 01/01/2026): isenção até R$ 5.000 de base, redução
  progressiva até R$ 7.350 (`reducer = 978.62 - 0.133145 × grossValue`).
- **Mês de Férias — a parte mais delicada do projeto**. Quando salário e férias caem no mesmo mês:
  - O **INSS efetivamente descontado** é incremental, não um rateio proporcional: primeiro o INSS das
    férias, calculado de forma independente (como se fossem a única remuneração do mês); depois o
    INSS do salário, pela diferença entre o INSS do total combinado (já com o teto aplicado) e o INSS
    já atribuído às férias. Isso garante que a soma nunca ultrapassa o teto único da competência.
  - O **IRRF nunca pode somar as duas bases** (férias + salário) antes de aplicar a tabela — isso
    violaria o art. 625 do RIR/2018. Cada parte é apurada separadamente.
  - Para o IRRF, o INSS usado como dedução de cada parte é recalculado **de forma independente** sobre
    aquela parte (não é o INSS incremental do item acima) — é assim que o IRRF de cada parte bate
    exatamente com o que as calculadoras de Salário Líquido e de Férias isoladas dariam para os
    mesmos valores. Isso é não-óbvio e já foi implementado errado duas vezes antes de chegar nesse
    resultado (regime de caixa para fins de IRRF vs. regime de competência para o INSS realmente
    retido).
- **Férias**: 1/3 constitucional sobre o valor proporcional aos dias gozados (art. 7º, XVII, CF).
  Adiantamento da 1ª parcela do 13º é opcional. Abono pecuniário (venda de até 1/3 dos dias) **não
  está implementado**.
- **Rescisão**:
  - Aviso prévio proporcional: `30 + min(60, max(0, floor(anos) - 1) * 3)` dias (Lei 12.506/2011,
    máximo 90 dias).
  - Sem justa causa: todas as verbas + multa de 40% do FGTS.
  - Justa causa: só saldo de salário + férias vencidas; sem aviso prévio, 13º proporcional, férias
    proporcionais ou multa do FGTS.
  - Pedido de demissão: mesmas verbas da dispensa sem justa causa, exceto a multa do FGTS; desconta um
    salário se o aviso prévio não for cumprido.
  - Acordo entre as partes (art. 484-A CLT): aviso prévio pela metade, multa do FGTS reduzida a 20%,
    saque de até 80% do FGTS, sem direito a seguro-desemprego.
  - Saldo de salário e 13º proporcional são tributáveis (INSS e IRRF apurados de forma independente).
    Aviso prévio indenizado, férias (vencidas e proporcionais, com 1/3) e multa do FGTS são isentos
    de INSS/IRRF por natureza indenizatória (Lei 7.713/1988 art. 6º, V; Decreto 3.048/1999 art. 214
    §9º).

## Testes

- Karma + `ChromeHeadlessCI` (launcher customizado em `karma.conf.js` com `--no-sandbox`, necessário
  em ambientes containerizados rodando como root). Rodar com:
  `CHROME_BIN=/opt/pw-browsers/chromium npx ng test --watch=false --browsers=ChromeHeadlessCI`
- Build: `npm run build`.
- Verificação visual: servir `dist/calculadora-financeira/browser` com `npx serve` e usar Playwright
  (Chromium em `/opt/pw-browsers/chromium`) para screenshot das páginas alteradas antes de dar por
  concluída qualquer mudança visual.
- Todos os `*.calculations.ts` têm specs cobrindo os casos de lei (faixas de INSS/IRRF, aviso prévio,
  isenções). Ao corrigir um bug de cálculo reportado pelo usuário, sempre adicione um teste
  reproduzindo o cenário exato relatado.

## Deploy e workflow de Git

- Branch de desenvolvimento: `claude/prompt-firebase-auto-deploy-1pkpcu`. Commitar e dar push nela.
- O workflow do GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`) só dispara deploy em
  push para `main` — então depois de commitar na branch de trabalho, é preciso também:
  ```
  git checkout main
  git merge origin/main --ff-only
  git merge claude/prompt-firebase-auto-deploy-1pkpcu --ff-only
  git push origin main
  git checkout claude/prompt-firebase-auto-deploy-1pkpcu
  ```
- Projeto Firebase: `calculadora-aeca3` (Hosting + Analytics), já configurado em `.firebaserc` e
  `src/app/core/firebase/firebase.config.ts`. Site em produção:
  https://calculadora-aeca3.web.app/
- Depois de dar push em `main`, monitore a run do workflow "Deploy para Firebase Hosting (produção)"
  via GitHub Actions até `conclusion: success` antes de considerar a tarefa concluída.

## Consentimento de cookies e Google AdSense

- `ConsentService` (`core/services/consent.service.ts`) guarda o estado (`granted`/`denied`/`unset`)
  em `localStorage`. `CookieConsentBannerComponent` mostra o banner enquanto `unset`.
- **O script do AdSense carrega incondicionalmente**, direto no `<head>` de `src/index.html` (tag
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2967676720541876">`)
  — **sem esperar consentimento**. Isso foi uma decisão deliberada: o verificador de sites do AdSense
  não interage com a página, então um script carregado só depois de um clique em "Aceitar" nunca era
  detectado, travando a verificação da conta. Só o **Google Analytics** (`initializeFirebaseAnalytics`
  em `core/firebase/firebase-analytics.ts`) continua atrás do consentimento, disparado no `effect()`
  do `app.ts`.
- `ADSENSE_CLIENT_ID` em `core/ads/adsense.config.ts` já é o Publisher ID real
  (`ca-pub-2967676720541876`) — precisa bater com o da tag `<script>` em `index.html` se um dos dois
  mudar. `ADSENSE_SLOTS.footer` ainda é **placeholder** (`'0000000000'`): o bloco manual de anúncio no
  rodapé (`AdSlotComponent`, usado em `app.html`) só renderiza depois que um ad unit real for criado
  no painel do AdSense e o ID colado em `ADSENSE_SLOTS`. `isSlotConfigured()` controla isso.
- `public/ads.txt` já tem a linha real: `google.com, pub-2967676720541876, DIRECT, f08c47fec0942fa0`.
- **Histórico da revisão do Google**: a primeira submissão foi rejeitada por "anúncios em telas sem
  conteúdo do editor" — causada por (1) um card "Em breve" na home (tela em construção, banida pela
  política — removido) e (2) páginas de calculadora com pouco texto além do formulário (corrigido
  adicionando uma seção `.calculator__explainer` com conteúdo editorial real em cada uma). Se o Google
  rejeitar de novo por motivo parecido, o padrão de solução é o mesmo: garantir que toda página tenha
  conteúdo substantivo e que nenhuma tela pareça incompleta/placeholder.
- Página `/privacidade` (`features/legal/privacy-page/`) documenta tudo isso para o usuário final —
  mantenha-a sincronizada se o comportamento de consentimento mudar.

## Convenções de commit

Commits em português, formato "tipo: descrição" (`feat:`, `fix:`), corpo explicando o *porquê*, não
o *o quê*. Sempre rodar build + testes + verificação visual antes de commitar mudanças de UI.
