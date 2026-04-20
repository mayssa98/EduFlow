import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap" [style.--chart-size.px]="size">
      <div class="visual">
        <div class="ambient-ring"></div>

        <svg viewBox="0 0 100 100" class="chart" role="img" [attr.aria-label]="centerLabel">
          <circle
            cx="50"
            cy="50"
            [attr.r]="radius()"
            fill="none"
            stroke="var(--color-muted)"
            [attr.stroke-width]="strokeWidth"
            class="track"
          />

          <ng-container *ngFor="let s of segments(); let i = index">
            <circle
              cx="50"
              cy="50"
              [attr.r]="radius()"
              fill="none"
              [attr.stroke]="colorFor(i, s.color)"
              [attr.stroke-width]="strokeWidth"
              stroke-linecap="round"
              pathLength="100"
              [attr.stroke-dasharray]="s.dash"
              [attr.stroke-dashoffset]="s.offset"
              transform="rotate(-90 50 50)"
              (mouseenter)="hover.set({ i, label: s.label, value: s.raw, pct: s.pct })"
              (mouseleave)="hover.set(null)"
              class="seg"
              [style.animationDelay.ms]="i * 90"
            />
          </ng-container>

          <circle cx="50" cy="50" r="23" class="core"></circle>

          <text
            x="50"
            y="41.5"
            text-anchor="middle"
            font-size="5.2"
            fill="currentColor"
            fill-opacity="0.55"
            class="center-copy"
          >
            <tspan
              *ngFor="let line of activeLabelLines(); let idx = index"
              x="50"
              [attr.dy]="idx === 0 ? 0 : 6.5"
            >
              {{ line }}
            </tspan>
          </text>

          <text x="50" y="57.5" text-anchor="middle" font-size="14" fill="currentColor" font-weight="800">
            {{ hover() ? hover()!.value : (total() | number) }}
          </text>

          <text x="50" y="65.5" text-anchor="middle" font-size="4.6" fill="currentColor" fill-opacity="0.55">
            {{ hover() ? hover()!.pct + '% du total' : 'elements suivis' }}
          </text>
        </svg>
      </div>

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
    .wrap {
      display: grid;
      grid-template-columns: minmax(220px, var(--chart-size)) minmax(180px, 1fr);
      gap: 20px;
      align-items: center;
    }

    .visual {
      position: relative;
      display: grid;
      place-items: center;
      min-height: var(--chart-size);
    }

    .ambient-ring {
      position: absolute;
      inset: 8% 12%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.22), transparent 60%);
      filter: blur(26px);
      animation: pulseRing 5.2s ease-in-out infinite;
      pointer-events: none;
    }

    .chart {
      width: min(100%, var(--chart-size));
      height: auto;
      color: var(--color-foreground);
      justify-self: center;
      filter: drop-shadow(0 18px 28px rgba(15,23,42,0.28));
      animation: chartEnter 680ms cubic-bezier(.2,.8,.2,1);
    }

    .track { opacity: 0.5; }

    .core {
      fill: rgba(15, 23, 42, 0.86);
      stroke: rgba(255,255,255,0.06);
      stroke-width: 1;
    }

    .seg {
      transition: stroke-width 160ms ease, filter 160ms ease;
      cursor: pointer;
      opacity: 0;
      animation: segmentReveal 720ms ease forwards;
    }

    .seg:hover {
      stroke-width: 18;
      filter: brightness(1.05);
    }

    .center-copy {
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .legend {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .legend li {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      font-size: 0.84rem;
      transition: transform 160ms ease, border-color 160ms ease;
    }

    .legend li:hover {
      transform: translateX(2px);
      border-color: rgba(99,102,241,0.18);
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      box-shadow: 0 0 0 4px rgba(255,255,255,0.03);
    }

    .lab {
      color: var(--color-muted-foreground);
      font-weight: 600;
    }

    .val {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1rem;
    }

    @keyframes pulseRing {
      0%, 100% { transform: scale(0.96); opacity: 0.8; }
      50% { transform: scale(1.04); opacity: 1; }
    }

    @keyframes chartEnter {
      from { opacity: 0; transform: scale(0.92) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes segmentReveal {
      from { opacity: 0; transform: scale(0.94); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 720px) {
      .wrap { grid-template-columns: 1fr; }
    }
  `],
})
export class DonutChartComponent {
  @Input() slices: DonutSlice[] = [];
  @Input() centerLabel = 'Total';
  @Input() size = 240;
  @Input() strokeWidth = 16;

  readonly hover = signal<{ i: number; label: string; value: number; pct: number } | null>(null);
  readonly total = computed(() => this.slices.reduce((acc, s) => acc + (s.value || 0), 0));

  readonly segments = computed(() => {
    const total = this.total() || 1;
    let acc = 0;
    return this.slices.map(s => {
      const pct = (s.value / total) * 100;
      const seg = {
        label: s.label,
        raw: s.value,
        color: s.color,
        pct: Math.round(pct),
        dash: `${pct} ${100 - pct}`,
        offset: -acc,
      };
      acc += pct;
      return seg;
    });
  });

  colorFor(i: number, override?: string): string {
    if (override) return override;
    const palette = ['#6366f1', '#8b5cf6', '#2dd4bf', '#fbbf24', '#f97316', '#ef4444'];
    return palette[i % palette.length];
  }

  radius(): number {
    return Math.max(24, 50 - this.strokeWidth / 2 - 6);
  }

  activeLabelLines(): string[] {
    const label = this.hover()?.label || this.centerLabel || 'Total';
    if (label.length <= 16) return [label];

    const words = label.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > 16 && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }

    if (current) lines.push(current);
    return lines.slice(0, 2);
  }
}
