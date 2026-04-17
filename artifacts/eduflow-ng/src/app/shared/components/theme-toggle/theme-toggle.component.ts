import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <button
      class="theme-toggle"
      (click)="themeService.toggle()"
      [attr.aria-label]="(themeService.isDark ? 'THEME.LIGHT' : 'THEME.DARK') | translate"
      [title]="(themeService.isDark ? 'THEME.LIGHT' : 'THEME.DARK') | translate"
      type="button"
    >
      @if (themeService.isDark) {
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      } @else {
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      }
    </button>
  `,
  styles: [`
    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius);
      border: 1px solid var(--color-border);
      background: var(--color-card);
      color: var(--color-foreground);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
    }

    .theme-toggle:hover {
      background: var(--color-muted);
      transform: scale(1.05);
    }

    .theme-toggle:active {
      transform: scale(0.95);
    }

    .icon {
      display: block;
      transition: transform 0.3s, opacity 0.2s;
    }
  `]
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}
}
