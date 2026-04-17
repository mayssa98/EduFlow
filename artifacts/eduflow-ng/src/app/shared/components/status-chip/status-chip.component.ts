import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ChipTone = 'neutral' | 'success' | 'warn' | 'danger' | 'info';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="chip" [class]="'chip-' + tone">{{ label }}</span>`,
  styles: [`
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: 999px;
      font-family: var(--font-display); font-weight: 600; font-size: 0.72rem;
      text-transform: uppercase; letter-spacing: 0.04em;
      border: 1px solid transparent;
    }
    .chip-neutral { background: var(--color-muted); color: var(--color-foreground); border-color: var(--color-border); }
    .chip-success { background: rgba(34,197,94,0.12); color: #22c55e; border-color: rgba(34,197,94,0.3); }
    .chip-warn    { background: rgba(251,191,36,0.12); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
    .chip-danger  { background: rgba(239,68,68,0.12); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .chip-info    { background: rgba(99,102,241,0.12); color: #818cf8; border-color: rgba(99,102,241,0.3); }
  `],
})
export class StatusChipComponent {
  @Input() label = '';
  @Input() tone: ChipTone = 'neutral';
}
