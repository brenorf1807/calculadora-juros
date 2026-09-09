/**
 * Utilitários de formatação monetária (padrão brasileiro: R$ 1.234,56).
 * Funções puras, sem qualquer dependência do Angular — podem ser usadas
 * tanto pelos componentes de UI quanto pelos serviços de cálculo.
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBRL(value: number | null | undefined): string {
  return currencyFormatter.format(value ?? 0);
}

/**
 * Converte o texto digitado em um input mascarado (ex.: "123456", onde os
 * dois últimos dígitos são centavos) para um número em reais.
 * Ex.: "123456" -> 1234.56
 */
export function centsToReais(rawDigits: string): number {
  const digitsOnly = rawDigits.replace(/\D/g, '');
  return digitsOnly ? Number(digitsOnly) / 100 : 0;
}
