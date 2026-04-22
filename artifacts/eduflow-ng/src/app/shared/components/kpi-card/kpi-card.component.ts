import {
  Component, Input, OnChanges, SimpleChanges, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="kpi" [class.has-glow]="glow">
      <div class="glow" *ngIf="glow"></div>
      <header>
        <span class="label">{{ label }}</span>
        <span class="icon" *ngIf="icon" [innerHTML]="icon | safeHtml"></span>
      </header>
      <div class="value">
        <ng-container *ngIf="isNumeric; else strBlock">{{ animated() | number:format }}</ng-container>
        <ng-template #strBlock>{{ value }}</ng-template>
        <span class="suffix" *ngIf="suffix">{{ suffix }}</span>
      </div>
      <footer *ngIf="trend !== undefined">
        <span class="trend" [class.up]="trend > 0" [class.down]="trend < 0">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path *ngIf="trend > 0" d="M2 9l4-5 4 5z" fill="currentColor"/>
            <path *ngIf="trend < 0" d="M2 3l4 5 4-5z" fill="currentColor"/>
            <circle *ngIf="trend === 0" cx="6" cy="6" r="3" fill="currentColor"/>
          </svg>
          {{ trend > 0 ? '+' : '' }}{{ trend }}{{ trendSuffix }}
        </span>
        <span class="hint" *ngIf="hint">{{ hint }}</span>
      </footer>
    </article>
  `,
  styles: [`
    .kpi {
      position: relative; overflow: hidden;
      background: var(--color-card); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 1.35rem 1.35rem 1.05rem;
      display: flex; flex-direction: column; gap: 8px;
      transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
    }
    html.dark .kpi { backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); }
    .kpi:hover { transform: translateY(-2px); border-color: var(--color-border-strong); box-shadow: var(--shadow-md); }
    .glow {
      position: absolute; top: -38%; right: -16%; width: 240px; height: 240px;
      background: radial-gradient(circle, rgba(99,102,241,0.32), transparent 60%);
      filter: blur(40px); pointer-events: none;
      animation: glowFloat 8s ease-in-out infinite;
    }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .label {
      color: var(--color-muted-foreground);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .icon  {
      width: 3rem; height: 3rem;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 16px;
      color: var(--indigo-400);
      background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 14px 24px rgba(79,70,229,0.12);
      transition: transform 200ms ease, box-shadow 200ms ease;
      animation: kpiOrbit 6s ease-in-out infinite;
    }
    .icon :is(svg) { display: block; }
    .kpi:hover .icon { transform: translateY(-1px) scale(1.03); box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 16px 28px rgba(79,70,229,0.16); }
    .value {
      font-family: var(--font-display); font-weight: 800; font-size: 2rem; letter-spacing: -0.03em;
      line-height: 1.1; display: flex; align-items: baseline; gap: 4px;
    }
    .suffix { font-size: 0.95rem; color: var(--color-muted-foreground); font-weight: 600; }
    footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.78rem; }
    .trend {
      display: inline-flex; align-items: center; gap: 4px;
      font-family: var(--font-display); font-weight: 600;
    }
    .trend.up   { color: var(--green-500); }
    .trend.down { color: var(--red-500); }
    .trend:not(.up):not(.down) { color: var(--color-muted-foreground); }
    .hint { color: var(--color-muted-foreground); }
    @keyframes kpiOrbit {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
  `],
})
export class KpiCardComponent implements OnChanges {
  @Input() label = '';
  @Input() value: string | number = 0;
  @Input() suffix = '';
  @Input() trend?: number;
  @Input() trendSuffix = '%';
  @Input() hint = '';
  @Input() icon = '';
  @Input() glow = true;
  @Input() format = '1.0-0';

  readonly animated = signal(0);
  isNumeric = false;

  ngOnChanges(c: SimpleChanges): void {
    if (c['value']) {
      const n = Number(this.value);
      this.isNumeric = !Number.isNaN(n) && typeof this.value === 'number';
      if (this.isNumeric) this.runCountUp(n);
    }
  }

  private runCountUp(target: number): void {
    const start = performance.now();
    const duration = 700;
    const from = this.animated();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.animated.set(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else this.animated.set(target);
    };
    requestAnimationFrame(tick);
  }
}
