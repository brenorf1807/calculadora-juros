import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { formatBRL } from '../../../core/utils/currency.util';

export interface PieSlice {
  label: string;
  value: number;
  /** Cor em CSS; se omitida, usa a paleta padrão do componente. */
  color?: string;
}

interface PieSegment extends PieSlice {
  color: string;
  path: string;
  percentage: number;
}

/**
 * Gráfico de pizza simples (SVG inline, sem biblioteca externa) com
 * legenda. Reutilizável por qualquer calculadora que precise mostrar a
 * distribuição de um total entre categorias (ex.: salário líquido vs.
 * descontos).
 */
@Component({
  selector: 'app-pie-chart',
  imports: [DecimalPipe],
  templateUrl: './pie-chart.html',
  styleUrl: './pie-chart.scss',
})
export class PieChartComponent {
  readonly slices = input<PieSlice[]>([]);
  readonly title = input('Distribuição');

  private readonly palette = ['#0f766e', '#b45309', '#be123c', '#6d28d9', '#0369a1', '#4d7c0f'];

  private readonly total = computed(() => this.slices().reduce((sum, slice) => sum + slice.value, 0));

  readonly segments = computed<PieSegment[]>(() => {
    const total = this.total();
    if (!total) {
      return [];
    }

    let cumulativeFraction = 0;
    return this.slices().map((slice, index) => {
      const fraction = slice.value / total;
      const startAngle = cumulativeFraction * 360;
      cumulativeFraction += fraction;
      const endAngle = cumulativeFraction * 360;

      return {
        ...slice,
        color: slice.color ?? this.palette[index % this.palette.length],
        path: describeSlice(startAngle, endAngle),
        percentage: fraction * 100,
      };
    });
  });

  formatValue(value: number): string {
    return formatBRL(value);
  }
}

function polarToCartesian(radius: number, angleDeg: number): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(angleRad), y: 50 + radius * Math.sin(angleRad) };
}

function describeSlice(startAngle: number, endAngle: number): string {
  const radius = 50;
  // Fatia única (100%): desenha um círculo completo em dois arcos de 180°.
  if (endAngle - startAngle >= 359.999) {
    const start = polarToCartesian(radius, 0);
    const mid = polarToCartesian(radius, 180);
    return [
      `M50,50`,
      `L${start.x},${start.y}`,
      `A${radius},${radius} 0 1 1 ${mid.x},${mid.y}`,
      `A${radius},${radius} 0 1 1 ${start.x},${start.y}`,
      'Z',
    ].join(' ');
  }

  const start = polarToCartesian(radius, startAngle);
  const end = polarToCartesian(radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M50,50 L${start.x},${start.y} A${radius},${radius} 0 ${largeArc} 1 ${end.x},${end.y} Z`;
}
