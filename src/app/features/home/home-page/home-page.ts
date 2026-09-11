import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CalculatorSummary {
  title: string;
  description: string;
  route: string;
}

/**
 * Lista as calculadoras disponíveis. Ao adicionar um novo módulo, basta
 * incluir uma nova entrada aqui com sua rota.
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
      title: 'Salário Líquido',
      description: 'Desconto de INSS e IRRF a partir do salário bruto, com gráfico da distribuição.',
      route: '/salario',
    },
    {
      title: 'Férias',
      description: 'Valor líquido das férias com 1/3 constitucional e adiantamento do 13º salário.',
      route: '/ferias',
    },
    {
      title: 'Mês de Férias',
      description:
        'Salário + férias do mesmo mês com INSS e IRRF calculados juntos, respeitando um único teto do INSS.',
      route: '/mes-de-ferias',
    },
    {
      title: 'Rescisão',
      description: 'Verbas rescisórias para os 4 motivos mais comuns de desligamento, com INSS e IRRF corretos.',
      route: '/rescisao',
    },
  ];
}
