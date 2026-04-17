import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="chart-card" [class.fluid]="fluid">
      <header>
        <div>
          <h3>{{ title }}</h3>
          <p class="sub" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <ng-content select="[card-actions]"></ng-content>
      </header>
      <div class="body"><ng-content></ng-content></div>
    </section>
  `,
  styles: [`
    .chart-card {
      background: var(--color-card); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 1.25rem;
      display: flex; flex-direction: column; gap: 1rem;
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    html.dark .chart-card { backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); }
    .chart-card:hover { border-color: var(--color-border-strong); box-shadow: var(--shadow-md); }
    .chart-card.fluid { flex: 1; }
    header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
    }
    h3 { font-size: 1rem; font-weight: 700; }
    .sub { color: var(--color-muted-foreground); font-size: 0.8rem; margin-top: 2px; }
    .body { flex: 1; min-height: 0; }
  `],
})
export class ChartCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() fluid = false;
}
