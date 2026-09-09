import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CalculatorSummary {
  title: string;
  description: string;
  route?: string;
  comingSoon?: boolean;
}

/**
 * Lista as calculadoras disponíveis (e as futuras, marcadas como
 * "em breve"). Ao adicionar um novo módulo — ex.: folha de pagamento —
 * basta incluir uma nova entrada aqui com sua rota.
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  readonly calculators: CalculatorSummary[] = [
    {
      title: 'Juros Compostos',
      description: 'Simule investimentos com aportes mensais e juros compostos.',
      route: '/juros-compostos',
    },
    {
      title: 'Financiamento (Price ou SAC)',
      description: 'Calcule as parcelas e a tabela de amortização de um financiamento.',
      route: '/financiamento',
    },
    {
      title: 'Salário Líquido e Folha de Pagamento',
      description: 'Cálculo de INSS, IRRF, FGTS e folha de pagamento.',
      comingSoon: true,
    },
  ];
}
