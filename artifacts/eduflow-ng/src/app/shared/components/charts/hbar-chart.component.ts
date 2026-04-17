import { Component, Input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { niceMax } from './_chart-utils';

export interface HBarRow { label: string; primary: number; secondary?: number; }

@Component({
  selector: 'app-hbar-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legend" *ngIf="secondaryLabel">
      <span class="lg"><i style="background: var(--indigo-500)"></i>{{ primaryLabel }}</span>
      <span class="lg"><i style="background: var(--violet-500); opacity: 0.5"></i>{{ secondaryLabel }}</span>
    </div>
    <div class="rows">
      <div class="row" *ngFor="let r of rows">
        <span class="rlabel">{{ r.label }}</span>
        <div class="track">
          <div class="bar bar-primary" [style.width.%]="(r.primary / nice()) * 100"
               [attr.title]="primaryLabel + ': ' + r.primary"></div>
          <div class="bar bar-secondary" *ngIf="r.secondary !== undefined"
               [style.width.%]="(r.secondary / nice()) * 100"
               [attr.title]="(secondaryLabel || '') + ': ' + r.secondary"></div>
        </div>
        <span class="rvalue">{{ r.primary }}<ng-container *ngIf="r.secondary !== undefined"> / {{ r.secondary }}</ng-container></span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .legend { display: flex; gap: 16px; margin-bottom: 12px; font-size: 0.78rem; color: var(--color-muted-foreground); }
    .lg i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
    .rows { display: flex; flex-direction: column; gap: 12px; }
    .row { display: grid; grid-template-columns: 140px 1fr 80px; gap: 12px; align-items: center; }
    .rlabel { font-size: 0.8rem; color: var(--color-muted-foreground); }
    .rvalue { font-family: var(--font-display); font-weight: 600; font-size: 0.85rem; text-align: end; }
    .track { position: relative; height: 24px; background: var(--color-muted); border-radius: 6px; overflow: hidden; }
    .bar {
      position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit;
      transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .bar-primary   { background: linear-gradient(90deg, var(--indigo-500), var(--violet-500)); animation: barGrow 600ms ease both; transform-origin: left; }
    .bar-secondary { background: rgba(139, 92, 246, 0.35); top: auto; bottom: 0; height: 6px; border-radius: 999px; }
  `],
})
export class HBarChartComponent {
  @Input() rows: HBarRow[] = [];
  @Input() primaryLabel = '';
  @Input() secondaryLabel = '';

  nice = computed(() => {
    const max = Math.max(
      ...this.rows.flatMap(r => [r.primary, r.secondary ?? 0]),
      1,
    );
    return niceMax(max);
  });
}
