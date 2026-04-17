import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { niceMax, smoothPath, Point } from './_chart-utils';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none" class="chart" role="img">
      <g class="grid">
        <line *ngFor="let g of gridLines()" x1="40" [attr.x2]="width - 12"
              [attr.y1]="g" [attr.y2]="g" stroke="currentColor" stroke-opacity="0.08"/>
      </g>
      <g class="ylabels">
        <text *ngFor="let g of gridLines(); let i = index" x="32" [attr.y]="g + 4"
              text-anchor="end" font-size="10" fill="currentColor" fill-opacity="0.55">{{ ticks()[i] }}</text>
      </g>
      <path [attr.d]="path()" fill="none" [attr.stroke]="color" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" class="line"/>
      <g class="dots">
        <circle *ngFor="let p of points(); let i = index" [attr.cx]="p.x" [attr.cy]="p.y" r="3.5"
                [attr.fill]="color" stroke="var(--color-card)" stroke-width="2"
                (mouseenter)="hover.set({ i, v: values[i] })" (mouseleave)="hover.set(null)"/>
      </g>
      <g class="xlabels">
        <text *ngFor="let l of labels; let i = index" [attr.x]="points()[i].x" [attr.y]="height - 6"
              text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.6">{{ l }}</text>
      </g>
    </svg>
    <div class="tooltip fade-in" *ngIf="hover()">
      <strong>{{ labels[hover()!.i] }}</strong>
      <span>{{ hover()!.v }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }
    svg.chart { width: 100%; height: 220px; color: var(--color-foreground); display: block; }
    .line { stroke-dasharray: 1500; stroke-dashoffset: 1500; animation: drawLine 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    .tooltip {
      position: absolute; top: 0; right: 0;
      background: var(--color-card); border: 1px solid var(--color-border-strong);
      border-radius: var(--radius); padding: 6px 10px; font-size: 0.78rem;
      display: flex; flex-direction: column; gap: 2px; pointer-events: none;
      box-shadow: var(--shadow-md);
    }
  `],
})
export class LineChartComponent {
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() color = '#8b5cf6';

  width = 600; height = 240;
  hover = signal<{ i: number; v: number } | null>(null);

  private nice = computed(() => niceMax(Math.max(...this.values, 1)));
  ticks = computed(() => {
    const max = this.nice(); const step = max / 5;
    return [5, 4, 3, 2, 1, 0].map(i => Math.round(i * step));
  });
  gridLines = computed(() => [0, 1, 2, 3, 4, 5].map(i => 12 + i * (this.height - 36) / 5));

  points = computed<Point[]>(() => {
    if (!this.values.length) return [];
    const left = 44, right = this.width - 12, top = 12, bottom = this.height - 24;
    const stepX = (right - left) / Math.max(1, this.values.length - 1);
    return this.values.map((v, i) => ({
      x: left + stepX * i,
      y: top + (bottom - top) - (v / this.nice()) * (bottom - top),
    }));
  });
  path = computed(() => smoothPath(this.points()));
}
