import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, LanguageOption } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="lang-switcher">
      <button
        class="lang-trigger"
        (click)="toggleOpen()"
        [attr.aria-label]="'LANGUAGE.SELECT' | translate"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        type="button"
      >
        <svg class="lang-globe" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/>
          <path d="M4 12h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          <path d="M12 4c2.7 2.6 4.15 5.25 4.15 8S14.7 17.4 12 20c-2.7-2.6-4.15-5.25-4.15-8S9.3 6.6 12 4Z" stroke="currentColor" stroke-width="1.7"/>
        </svg>
        <span class="lang-code">{{ current.code.toUpperCase() }}</span>
        <svg class="lang-chevron" [class.rotated]="open()" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      @if (open()) {
        <ul class="lang-dropdown" role="listbox" [attr.aria-label]="'LANGUAGE.SELECT' | translate">
          @for (lang of langService.languages; track lang.code) {
            <li
              class="lang-option"
              [class.active]="lang.code === current.code"
              role="option"
              [attr.aria-selected]="lang.code === current.code"
              (click)="selectLang(lang)"
              (keydown.enter)="selectLang(lang)"
              tabindex="0"
            >
              <span class="lang-native">{{ getLabelKey(lang) | translate }}</span>
              <span class="lang-pill">{{ lang.code.toUpperCase() }}</span>
              @if (lang.code === current.code) {
                <svg class="lang-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              }
            </li>
          }
        </ul>
        <div class="lang-backdrop" (click)="close()"></div>
      }
    </div>
  `,
  styles: [`
    .lang-switcher {
      position: relative;
      display: inline-block;
      z-index: 60;
    }

    .lang-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
      padding: 0 12px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.04);
      color: rgba(245, 245, 250, 0.92);
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
      white-space: nowrap;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .lang-trigger:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(129, 140, 248, 0.2);
      transform: translateY(-1px);
    }

    .lang-globe {
      color: rgba(226, 232, 240, 0.82);
      flex-shrink: 0;
    }

    .lang-code {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .lang-chevron {
      transition: transform 0.2s;
      color: rgba(226, 232, 240, 0.62);
      flex-shrink: 0;
    }

    .lang-chevron.rotated {
      transform: rotate(180deg);
    }

    .lang-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      inset-inline-end: 0;
      min-width: 220px;
      max-width: min(260px, calc(100vw - 32px));
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
      list-style: none;
      margin: 0;
      padding: 8px;
      z-index: 70;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      animation: langDropdownEnter 180ms ease;
    }

    .lang-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-radius: 12px;
      cursor: pointer;
      color: rgba(245, 245, 250, 0.92);
      font-size: 0.875rem;
      transition: background 0.12s, transform 0.12s;
    }

    .lang-option:hover,
    .lang-option:focus {
      background: rgba(99, 102, 241, 0.12);
      transform: translateX(2px);
      outline: none;
    }

    .lang-option.active {
      font-weight: 600;
      color: #ffffff;
    }

    .lang-native {
      flex: 1;
    }

    .lang-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 38px;
      min-height: 24px;
      padding: 0 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(224, 231, 255, 0.7);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .lang-check {
      color: rgba(129, 140, 248, 0.92);
      flex-shrink: 0;
    }

    .lang-backdrop {
      position: fixed;
      inset: 0;
      z-index: 65;
    }

    @keyframes langDropdownEnter {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 720px) {
      .lang-dropdown {
        inset-inline-end: auto;
        inset-inline-start: 0;
        min-width: 200px;
      }
    }
  `]
})
export class LanguageSwitcherComponent {
  open = signal(false);

  constructor(public langService: LanguageService) {}

  get current(): LanguageOption {
    return this.langService.getCurrentOption();
  }

  toggleOpen(): void {
    this.open.update(v => !v);
  }

  close(): void {
    this.open.set(false);
  }

  selectLang(lang: LanguageOption): void {
    this.langService.setLanguage(lang.code);
    this.close();
  }

  getLabelKey(lang: LanguageOption): string {
    if (lang.code === 'fr') return 'LANGUAGE.FRENCH';
    if (lang.code === 'ar') return 'LANGUAGE.ARABIC';
    return 'LANGUAGE.ENGLISH';
  }
}
