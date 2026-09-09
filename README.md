# Calculadora Financeira

Aplicação Angular (standalone components, sem backend) com calculadoras financeiras. Todo cálculo roda 100% no navegador — a única comunicação com um servidor é o Google Analytics (Firebase), usado apenas para métricas de uso do site.

Calculadoras disponíveis:

- **Juros Compostos** — evolução de um investimento com aportes mensais.
- **Financiamento (Tabela Price)** — parcela fixa e tabela de amortização.

A arquitetura foi pensada para crescer: novos módulos (ex.: salário líquido, folha de pagamento, INSS, IRRF, FGTS) podem ser adicionados sem refatorar o que já existe.

## Stack

- Angular 20 (standalone components, novo control flow `@if`/`@for`, signals)
- TypeScript, Angular Reactive Forms
- SCSS puro (sem framework de UI) — mantém o bundle pequeno e dá controle total sobre o design responsivo mobile-first
- Gráfico de evolução em SVG inline (sem biblioteca externa)
- Testes unitários com Jasmine/Karma
- Firebase (Hosting + Analytics) — configuração em `src/app/core/firebase/`

## Rodando localmente

Pré-requisitos: Node.js 22+ e npm.

```bash
npm install
npm start       # http://localhost:4200
```

Outros comandos úteis:

```bash
npm run build   # build de produção em dist/calculadora-financeira/browser
npm test        # testes unitários (Karma + Jasmine)
```

Em ambientes que rodam como root (ex.: alguns containers), o Chrome precisa do
flag `--no-sandbox`. Use o launcher `ChromeHeadlessCI` já configurado em
`karma.conf.js`:

```bash
npm test -- --watch=false --browsers=ChromeHeadlessCI
```

## Arquitetura

```
src/app/
  core/               # utilitários e tipos compartilhados por toda a app
    models/            # tipos comuns (ex.: RateType, TermUnit)
    utils/             # formatação de moeda/percentual, conversão de taxas — funções puras
    validators/        # validators de formulário reutilizáveis
  shared/
    ui/                # componentes de UI reutilizáveis (inputs, cards, tabela, gráfico)
  features/
    home/               # página inicial, lista as calculadoras disponíveis
    compound-interest/  # calculadora de juros compostos
    financing/           # calculadora de financiamento (Tabela Price)
    # payroll/            <- próximo módulo entraria aqui, seguindo o mesmo padrão
```

Cada calculadora segue o mesmo padrão:

- `*.model.ts` — interfaces de entrada/saída (ex.: `CompoundInterestInput`, `CompoundInterestResult`).
- `*.calculations.ts` (+ `.spec.ts`) — funções **puras**, sem nenhuma dependência do Angular. Podem ser testadas isoladamente e reaproveitadas fora de um componente.
- `*.routes.ts` — rota lazy-loaded (`loadChildren`/`loadComponent`), registrada em `app.routes.ts`.
- `*-page/` — componente standalone com o formulário reativo, que consome a função de cálculo e monta a UI a partir dos componentes de `shared/ui`.

### Como adicionar uma nova calculadora

Usando a de juros compostos como referência:

1. Crie `src/app/features/<nome>/` com `<nome>.model.ts` e `<nome>.calculations.ts` (+ spec). Escreva a lógica como função pura, sem importar nada do Angular.
2. Crie `<nome>-page/` com um componente standalone: formulário com `ReactiveFormsModule`, usando os inputs de `shared/ui` (`CurrencyInputComponent`, `PercentInputComponent`, `UnitToggleComponent`) e exibindo o resultado com `ResultCardComponent`, `ScheduleTableComponent` e, se fizer sentido, `BalanceChartComponent`.
3. Crie `<nome>.routes.ts` exportando um array `Routes` com `loadComponent` apontando para a página.
4. Registre a rota em `src/app/app.routes.ts` (`loadChildren`) e adicione um link em `src/app/app.ts` (`navLinks`) e em `src/app/features/home/home-page/home-page.ts` (`calculators`).

### Componentes reutilizáveis (`shared/ui`)

- `CurrencyInputComponent` — input com máscara de R$.
- `PercentInputComponent` — input de percentual (vírgula decimal).
- `UnitToggleComponent` — seletor segmentado genérico (ex.: Mensal/Anual, Meses/Anos).
- `ResultCardComponent` — card de destaque para um resultado numérico.
- `ScheduleTableComponent` — tabela genérica de evolução/amortização mês a mês.
- `BalanceChartComponent` — gráfico de linha (SVG) para visualizar a evolução de um saldo.

## Deploy automático (Firebase Hosting + GitHub Actions)

O repositório já vem com os workflows configurados:

- `.github/workflows/firebase-hosting-merge.yml` — a cada push/merge na branch `main`, builda o projeto e publica em produção (canal `live`) no Firebase Hosting.
- `.github/workflows/firebase-hosting-pull-request.yml` — a cada Pull Request para `main`, publica um canal de preview temporário (útil para revisar antes do merge).

O projeto Firebase já está criado (`calculadora-aeca3`) e configurado em `.firebaserc` e em
`src/app/core/firebase/firebase.config.ts` (Hosting + Analytics). Falta apenas ativar o deploy
automático seguindo os passos abaixo.

### 1. Ativar o Hosting no projeto

No [console.firebase.google.com](https://console.firebase.google.com), abra o projeto
`calculadora-aeca3` e ative o **Hosting**, caso ainda não esteja ativo.

### 2. Gerar as credenciais de deploy

Você pode usar o próprio CLI do Firebase para gerar tudo automaticamente
(recomendado — ele já cria os secrets no repositório GitHub):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting:github
```

Ou, manualmente:

1. No [Console do Google Cloud](https://console.cloud.google.com/iam-admin/serviceaccounts), crie uma Service Account com o papel **Firebase Hosting Admin** no projeto Firebase.
2. Gere uma chave JSON para essa Service Account.

### 3. Configurar os secrets no GitHub

Em **Settings → Secrets and variables → Actions** do repositório, adicione:

| Secret | Valor |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Conteúdo completo do JSON da Service Account |
| `FIREBASE_PROJECT_ID` | `calculadora-aeca3` |

### 4. Fazer o deploy

Basta dar push (ou fazer merge de um PR) na branch `main`: o GitHub Actions builda a aplicação, roda os testes unitários e publica automaticamente no Firebase Hosting.

## Fora de escopo (por enquanto)

- Autenticação, persistência em servidor ou banco de dados.
- Módulos de salário/folha de pagamento (a arquitetura já está pronta para recebê-los).
- Sistema de Amortização Constante (SAC) na calculadora de financiamento — o código já está preparado (`financing.model.ts` e `financing.calculations.ts`) para receber essa implementação.
