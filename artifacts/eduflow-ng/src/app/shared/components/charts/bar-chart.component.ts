import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { niceMax } from './_chart-utils';

export interface Series { name: string; values: number[]; color?: string; }

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legend" *ngIf="series.length > 1">
      <span class="lg" *ngFor="let s of series; let i = index">
        <i [style.background]="colorFor(i, s.color)"></i>{{ s.name }}
      </span>
    </div>
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none" class="chart" role="img">
      <g class="grid">
        <line *ngFor="let g of gridLines()" x1="40" [attr.x2]="width - 12"
              [attr.y1]="g" [attr.y2]="g" stroke="currentColor" stroke-opacity="0.08"/>
      </g>
      <g class="ylabels">
        <text *ngFor="let g of gridLines(); let i = index" x="32" [attr.y]="g + 4"
              text-anchor="end" font-size="10" fill="currentColor" fill-opacity="0.55">
          {{ ticks()[i] }}
        </text>
      </g>
      <g class="bars">
        <ng-container *ngFor="let label of labels; let li = index">
          <g *ngFor="let s of series; let si = index"
             [attr.transform]="'translate(' + xPos(li, si) + ' 0)'"
             (mouseenter)="hover.set({ li, si, v: s.values[li] })"
             (mouseleave)="hover.set(null)">
            <rect [attr.y]="yPos(s.values[li])" [attr.height]="barH(s.values[li])"
                  width="14" rx="3"
                  [attr.fill]="colorFor(si, s.color)"
                  class="bar" [style.transformOrigin]="'center ' + (height - 24) + 'px'"/>
          </g>
        </ng-container>
      </g>
      <g class="xlabels">
        <text *ngFor="let l of labels; let i = index"
              [attr.x]="groupCenter(i)" [attr.y]="height - 6"
              text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.6">{{ l }}</text>
      </g>
    </svg>
    <div class="tooltip fade-in" *ngIf="hover()" [style.left.px]="0">
      <strong>{{ labels[hover()!.li] }}</strong>
      <span>{{ series[hover()!.si].name }}: {{ hover()!.v }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }
    .legend { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; font-size: 0.78rem; color: var(--color-muted-foreground); }
    .lg i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: middle; }
    svg.chart { width: 100%; height: 220px; color: var(--color-foreground); display: block; }
    .bar { animation: barGrow 600ms cubic-bezier(0.22, 1, 0.36, 1) both; }
    .tooltip {
      position: absolute; top: 0; right: 0;
      background: var(--color-card); border: 1px solid var(--color-border-strong);
      border-radius: var(--radius); padding: 6px 10px; font-size: 0.78rem;
      display: flex; flex-direction: column; gap: 2px; pointer-events: none;
      box-shadow: var(--shadow-md);
    }
    .tooltip strong { font-family: var(--font-display); font-size: 0.8rem; }
  `],
})
export class BarChartComponent {
  @Input() labels: string[] = [];
  @Input() series: Series[] = [];
  width = 600; height = 240;
  hover = signal<{ li: number; si: number; v: number } | null>(null);

  private maxVal = computed(() => {
    const all = this.series.flatMap(s => s.values);
    return all.length ? Math.max(...all, 1) : 1;
  });
  private nice = computed(() => niceMax(this.maxVal()));

  ticks = computed(() => {
    const max = this.nice(); const step = max / 5;
    return [5, 4, 3, 2, 1, 0].map(i => Math.round(i * step));
  });
  gridLines = computed(() => [0, 1, 2, 3, 4, 5].map(i => 12 + i * (this.height - 36) / 5));

  groupWidth(): number {
    const usable = this.width - 56;
    return usable / Math.max(1, this.labels.length);
  }
  groupCenter(li: number): number { return 44 + this.groupWidth() * (li + 0.5); }
  xPos(li: number, si: number): number {
    const totalSlot = this.series.length * 14 + (this.series.length - 1) * 4;
    const startX = this.groupCenter(li) - totalSlot / 2;
    return startX + si * 18;
  }
  yPos(v: number): number {
    const h = this.height - 36;
    return 12 + h - (v / this.nice()) * h;
  }
  barH(v: number): number {
    const h = this.height - 36;
    return Math.max(2, (v / this.nice()) * h);
  }
  colorFor(i: number, override?: string): string {
    if (override) return override;
    const palette = ['#6366f1', '#8b5cf6', '#2dd4bf', '#fbbf24', '#f97316'];
    return palette[i % palette.length];
  }
}
