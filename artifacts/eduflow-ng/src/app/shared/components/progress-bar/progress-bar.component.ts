import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="track" [attr.aria-label]="label" role="progressbar"
         [attr.aria-valuenow]="clamped" aria-valuemin="0" aria-valuemax="100">
      <div class="fill" [class.warn]="tone() === 'warn'" [class.danger]="tone() === 'danger'"
           [style.width.%]="clamped"></div>
    </div>
  `,
  styles: [`
    .track { height: 8px; background: var(--color-muted); border-radius: 999px; overflow: hidden; }
    .fill  {
      height: 100%; border-radius: inherit;
      background: linear-gradient(90deg, var(--indigo-500), var(--violet-500));
      transition: width 600ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .fill.warn   { background: linear-gradient(90deg, var(--amber-400), var(--orange-500)); }
    .fill.danger { background: linear-gradient(90deg, var(--orange-500), var(--red-500)); }
  `],
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() label = '';
  get clamped(): number { return Math.max(0, Math.min(100, this.value || 0)); }
  tone(): 'normal' | 'warn' | 'danger' {
    if (this.clamped < 30) return 'danger';
    if (this.clamped < 60) return 'warn';
    return 'normal';
  }
}
