/**
 * Tipos compartilhados entre todas as calculadoras financeiras.
 * Ficam em `core` (e não dentro de uma feature) justamente para serem
 * reaproveitados por módulos futuros (ex.: folha de pagamento também
 * pode usar taxas mensais/anuais).
 */
export type RateType = 'monthly' | 'annual';

export type TermUnit = 'months' | 'years';
