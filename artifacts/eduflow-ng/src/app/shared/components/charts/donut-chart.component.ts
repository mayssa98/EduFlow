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
        <div class="ambient-ring ambient-ring-secondary"></div>
        <div class="chart-shell"></div>

        <svg viewBox="0 0 100 100" class="chart" role="img" [attr.aria-label]="centerLabel">
          <defs>
            <filter id="chartGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#0f172a" flood-opacity="0.24"/>
            </filter>
          </defs>

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
              [attr.stroke-width]="segmentStrokeWidth(i)"
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

          <circle cx="50" cy="50" [attr.r]="innerCoreRadius()" class="inner-ring"></circle>
          <circle cx="50" cy="50" r="24" class="core"></circle>
          <circle cx="50" cy="50" r="20.5" class="core-highlight"></circle>

          <text
            x="50"
            y="35"
            text-anchor="middle"
            font-size="4"
            fill="currentColor"
            fill-opacity="0.52"
            class="micro-copy"
          >
            {{ hover() ? 'segment actif' : 'vue globale' }}
          </text>

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

          <text x="50" y="56.5" text-anchor="middle" font-size="15" fill="currentColor" font-weight="800" class="center-value">
            {{ hover() ? hover()!.value : (total() | number) }}
          </text>

          <text x="50" y="64.5" text-anchor="middle" font-size="4.5" fill="currentColor" fill-opacity="0.55" class="center-meta">
            {{ hover() ? hover()!.pct + '% du total' : 'elements suivis' }}
          </text>
        </svg>
      </div>

      <ul class="legend">
        <li
          *ngFor="let s of segments(); let i = index"
          [class.active]="hover()?.i === i"
          (mouseenter)="hover.set({ i, label: s.label, value: s.raw, pct: s.pct })"
          (mouseleave)="hover.set(null)"
        >
          <span class="connector"></span>
          <span class="dot" [style.background]="colorFor(i, s.color)"></span>
          <div class="legend-copy">
            <span class="lab">{{ s.label }}</span>
            <span class="pct">{{ s.raw }} elements</span>
          </div>
          <span class="val">{{ s.pct }}%</span>
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

    .chart-shell {
      position: absolute;
      inset: 8%;
      border-radius: 50%;
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.06), rgba(255,255,255,0.01) 54%, transparent 55%),
        radial-gradient(circle, rgba(255,255,255,0.04), transparent 72%);
      border: 1px solid rgba(255,255,255,0.04);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 28px rgba(15,23,42,0.1);
      pointer-events: none;
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

    .ambient-ring-secondary {
      inset: 18% 18%;
      background: radial-gradient(circle, rgba(56,189,248,0.14), transparent 62%);
      filter: blur(18px);
      animation-duration: 6.8s;
      animation-direction: reverse;
    }

    .chart {
      width: min(100%, var(--chart-size));
      height: auto;
      color: var(--color-foreground);
      justify-self: center;
      filter: drop-shadow(0 18px 28px rgba(15,23,42,0.28));
      animation: chartEnter 680ms cubic-bezier(.2,.8,.2,1);
    }

    .track {
      opacity: 0.2;
      stroke: rgba(148, 163, 184, 0.12);
    }

    .inner-ring {
      fill: rgba(255,255,255,0.02);
      stroke: rgba(255,255,255,0.04);
      stroke-width: 0.8;
    }

    .core {
      fill: color-mix(in srgb, var(--color-card) 88%, transparent);
      stroke: rgba(255,255,255,0.04);
      stroke-width: 0.8;
    }

    .core-highlight {
      fill: rgba(255,255,255,0.015);
      stroke: rgba(255,255,255,0.03);
      stroke-width: 0.6;
    }

    .seg {
      transition: stroke-width 220ms ease, filter 220ms ease, opacity 220ms ease;
      cursor: pointer;
      opacity: 0;
      animation: segmentReveal 720ms ease forwards;
      filter: url(#chartGlow);
    }

    .seg:hover { filter: brightness(1.08); }

    .center-copy {
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-weight: 700;
    }

    .micro-copy {
      text-transform: uppercase;
      letter-spacing: 0.22em;
    }

    .center-value {
      font-family: var(--font-display);
      letter-spacing: -0.04em;
    }

    .center-meta {
      letter-spacing: 0.04em;
    }

    .legend {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .legend li {
      display: grid;
      grid-template-columns: minmax(52px, 76px) auto minmax(120px, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
      border-radius: 0;
      background: transparent;
      border: 0;
      font-size: 0.84rem;
      transition: transform 160ms ease, opacity 160ms ease;
      cursor: pointer;
    }

    .legend li:hover {
      transform: translateX(2px);
    }

    .legend li.active {
      transform: translateX(4px);
    }

    .connector {
      height: 1.5px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.55);
      transform-origin: left center;
      transition: transform 160ms ease, background 160ms ease;
    }

    .legend li.active .connector,
    .legend li:hover .connector {
      transform: scaleX(1.08);
      background: rgba(226, 232, 240, 0.78);
    }

    .dot {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      box-shadow: 0 12px 24px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.2);
    }

    .legend-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .lab {
      color: var(--color-foreground);
      font-weight: 500;
      font-size: 0.98rem;
    }

    .pct {
      color: var(--color-muted-foreground);
      font-size: 0.74rem;
      font-weight: 500;
    }

    .val {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--color-muted-foreground);
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
      .legend li {
        grid-template-columns: 40px auto 1fr auto;
        gap: 10px;
      }
      .connector { display: none; }
      .dot {
        width: 30px;
        height: 30px;
        border-radius: 12px;
      }
    }
  `],
})
export class DonutChartComponent {
  @Input() slices: DonutSlice[] = [];
  @Input() centerLabel = 'Total';
  @Input() size = 240;
  @Input() strokeWidth = 16;
  @Input() segmentGap = 0;

  readonly hover = signal<{ i: number; label: string; value: number; pct: number } | null>(null);
  readonly total = computed(() => this.slices.reduce((acc, s) => acc + (s.value || 0), 0));

  readonly segments = computed(() => {
    const rawTotal = this.total();
    if (rawTotal <= 0) {
      return this.slices.map(s => ({
        label: s.label,
        raw: s.value,
        color: s.color,
        pct: 0,
        dash: '0 100',
        offset: 0,
      }));
    }

    const total = rawTotal;
    let acc = 0;
    return this.slices.map(s => {
      const pct = (s.value / total) * 100;
      const visiblePct = pct <= 0 ? 0 : Math.max(0.8, pct - this.segmentGap);
      const seg = {
        label: s.label,
        raw: s.value,
        color: s.color,
        pct: Math.round(pct),
        dash: `${visiblePct} ${100 - visiblePct}`,
        offset: -(acc + this.segmentGap / 2),
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

  innerCoreRadius(): number {
    return Math.max(28, this.radius() - this.strokeWidth / 2 + 8);
  }

  segmentStrokeWidth(index: number): number {
    return this.hover()?.i === index ? this.strokeWidth + 6 : this.strokeWidth;
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
