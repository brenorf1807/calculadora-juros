/**
 * Utilitários para exibir e interpretar percentuais no formato brasileiro
 * (vírgula como separador decimal). Funções puras, sem dependência do Angular.
 */

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export function formatPercentInput(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return decimalFormatter.format(value);
}

/** Converte texto digitado ("1,5", "10.000,25") para número (1.5, 10000.25). */
export function parsePercentInput(rawText: string): number {
  const normalized = rawText
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const value = Number(normalized);
  return Number.isNaN(value) ? 0 : value;
}
