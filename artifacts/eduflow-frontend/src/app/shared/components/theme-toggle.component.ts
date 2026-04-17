import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, AsyncPipe, TranslateModule],
  template: `
    <button
      type="button"
      class="tt"
      (click)="theme.toggle()"
      [attr.aria-label]="'nav.theme' | translate"
      data-testid="theme-toggle"
    >
      <ng-container *ngIf="(theme.theme$ | async) === 'dark'; else moon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </ng-container>
      <ng-template #moon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </ng-template>
    </button>
  `,
  styles: [
    `
      .tt {
        display: inline-flex; align-items: center; justify-content: center;
        width: 36px; height: 36px;
        border-radius: var(--radius-md);
        background: var(--bg-surface-strong);
        color: var(--text-primary);
        border: 1px solid var(--border-subtle);
        cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease;
      }
      .tt:hover { transform: translateY(-1px); box-shadow: var(--shadow-glow); }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
