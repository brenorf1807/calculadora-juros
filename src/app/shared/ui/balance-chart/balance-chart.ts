import { Component, computed, input } from '@angular/core';

export interface ChartPoint {
  label: string;
  value: number;
}

/**
 * Gráfico de linha simples (SVG inline, sem dependência de bibliotecas
 * externas) para visualizar a evolução de um saldo ao longo do tempo.
 * Mantido deliberadamente leve para não pesar o bundle de uma app que
 * hoje tem só duas calculadoras e no futuro terá mais.
 */
@Component({
  selector: 'app-balance-chart',
  imports: [],
  templateUrl: './balance-chart.html',
  styleUrl: './balance-chart.scss',
})
export class BalanceChartComponent {
  readonly points = input<ChartPoint[]>([]);
  readonly title = input('Evolução do saldo');

  private readonly viewBoxWidth = 600;
  private readonly viewBoxHeight = 220;
  private readonly paddingX = 12;
  private readonly paddingY = 16;

  readonly viewBox = `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`;

  private readonly coordinates = computed(() => {
    const pts = this.points();
    if (!pts.length) {
      return [];
    }

    const values = pts.map((p) => p.value);
    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    const innerWidth = this.viewBoxWidth - this.paddingX * 2;
    const innerHeight = this.viewBoxHeight - this.paddingY * 2;
    const stepX = pts.length > 1 ? innerWidth / (pts.length - 1) : 0;

    return pts.map((point, index) => ({
      x: this.paddingX + stepX * index,
      y: this.paddingY + innerHeight - ((point.value - minValue) / range) * innerHeight,
    }));
  });

  readonly linePath = computed(() => {
    const coords = this.coordinates();
    return coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
  });

  readonly areaPath = computed(() => {
    const coords = this.coordinates();
    if (!coords.length) {
      return '';
    }
    const baseline = this.viewBoxHeight - this.paddingY;
    const first = coords[0];
    const last = coords[coords.length - 1];
    return `${this.linePath()} L${last.x.toFixed(2)},${baseline} L${first.x.toFixed(2)},${baseline} Z`;
  });
}
