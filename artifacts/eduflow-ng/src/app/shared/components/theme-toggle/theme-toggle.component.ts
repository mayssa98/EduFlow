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
      width: 40px;
      height: 40px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.04);
      color: rgba(245, 245, 250, 0.92);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(129, 140, 248, 0.2);
      transform: translateY(-1px);
    }

    .theme-toggle:active {
      transform: translateY(0);
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
