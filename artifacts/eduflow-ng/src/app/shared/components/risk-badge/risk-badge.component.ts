import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RiskLevel = 'FAIBLE' | 'MODERE' | 'ELEVE';

@Component({
  selector: 'app-risk-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="risk" [class.low]="level === 'FAIBLE'" [class.med]="level === 'MODERE'" [class.high]="level === 'ELEVE'">
      <span class="dot"></span>
      {{ label }}
    </span>
  `,
  styles: [`
    .risk {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 999px;
      font-family: var(--font-display); font-weight: 600; font-size: 0.74rem;
      letter-spacing: 0.02em; text-transform: uppercase;
      border: 1px solid transparent;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .low  { background: rgba(34,197,94,0.12);  color: #22c55e; border-color: rgba(34,197,94,0.3); }
    .low .dot { background: #22c55e; }
    .med  { background: rgba(249,115,22,0.12); color: #f97316; border-color: rgba(249,115,22,0.3); }
    .med .dot { background: #f97316; }
    .high { background: rgba(239,68,68,0.15);  color: #ef4444; border-color: rgba(239,68,68,0.35); animation: pulseRisk 1.6s ease-in-out infinite; }
    .high .dot { background: #ef4444; }
  `],
})
export class RiskBadgeComponent {
  @Input() level: RiskLevel = 'FAIBLE';
  @Input() label = '';
}
