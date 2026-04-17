import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSlice { label: string; value: number; color?: string; }

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <svg viewBox="0 0 100 100" class="chart" role="img">
        <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-muted)" stroke-width="14"/>
        <ng-container *ngFor="let s of segments(); let i = index">
          <circle cx="50" cy="50" r="38" fill="none" [attr.stroke]="colorFor(i, s.color)"
                  stroke-width="14" stroke-linecap="butt" pathLength="100"
                  [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset"
                  transform="rotate(-90 50 50)"
                  (mouseenter)="hover.set({ i, label: s.label, value: s.raw, pct: s.pct })"
                  (mouseleave)="hover.set(null)" class="seg"/>
        </ng-container>
        <text x="50" y="48" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.55">
          {{ (hover() ? hover()!.label : centerLabel) }}
        </text>
        <text x="50" y="60" text-anchor="middle" font-size="14" fill="currentColor" font-weight="700">
          {{ (hover() ? hover()!.pct + '%' : (total() | number)) }}
        </text>
      </svg>
      <ul class="legend">
        <li *ngFor="let s of slices; let i = index">
          <span class="dot" [style.background]="colorFor(i, s.color)"></span>
          <span class="lab">{{ s.label }}</span>
          <span class="val">{{ s.value }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: center; }
    svg.chart { width: 100%; max-width: 200px; height: auto; color: var(--color-foreground); justify-self: center; }
    .seg { transition: stroke-width 160ms ease; cursor: pointer; }
    .seg:hover { stroke-width: 16; }
    .legend { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .legend li { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
    .dot { width: 10px; height: 10px; border-radius: 3px; }
    .lab { color: var(--color-muted-foreground); flex: 1; }
    .val { font-family: var(--font-display); font-weight: 600; }
    @media (max-width: 520px) { .wrap { grid-template-columns: 1fr; } }
  `],
})
export class DonutChartComponent {
  @Input() slices: DonutSlice[] = [];
  @Input() centerLabel = 'Total';

  hover = signal<{ i: number; label: string; value: number; pct: number } | null>(null);
  total = computed(() => this.slices.reduce((acc, s) => acc + (s.value || 0), 0));

  segments = computed(() => {
    const total = this.total() || 1;
    let acc = 0;
    return this.slices.map(s => {
      const pct = (s.value / total) * 100;
      const seg = { label: s.label, raw: s.value, color: s.color, pct: Math.round(pct), dash: `${pct} ${100 - pct}`, offset: -acc };
      acc += pct;
      return seg;
    });
  });

  colorFor(i: number, override?: string): string {
    if (override) return override;
    const palette = ['#6366f1', '#8b5cf6', '#2dd4bf', '#fbbf24', '#f97316', '#ef4444'];
    return palette[i % palette.length];
  }
}
