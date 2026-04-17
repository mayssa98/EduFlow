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
        <span class="lang-flag">{{ current.flag }}</span>
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
              <span class="lang-flag">{{ lang.flag }}</span>
              <span class="lang-native">{{ lang.nativeLabel }}</span>
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
    }

    .lang-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: var(--radius);
      border: 1px solid var(--color-border);
      background: var(--color-card);
      color: var(--color-foreground);
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: background 0.15s, border-color 0.15s;
      white-space: nowrap;
    }

    .lang-trigger:hover {
      background: var(--color-muted);
    }

    .lang-flag {
      font-size: 1rem;
      line-height: 1;
    }

    .lang-code {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .lang-chevron {
      transition: transform 0.2s;
      color: var(--color-muted-foreground);
      flex-shrink: 0;
    }

    .lang-chevron.rotated {
      transform: rotate(180deg);
    }

    .lang-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      inset-inline-end: 0;
      min-width: 160px;
      background: var(--color-popover);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
      list-style: none;
      margin: 0;
      padding: 4px;
      z-index: 50;
    }

    .lang-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: calc(var(--radius) - 2px);
      cursor: pointer;
      color: var(--color-popover-foreground);
      font-size: 0.875rem;
      transition: background 0.12s;
    }

    .lang-option:hover,
    .lang-option:focus {
      background: var(--color-accent);
      outline: none;
    }

    .lang-option.active {
      font-weight: 600;
      color: var(--color-primary);
    }

    .lang-native { flex: 1; }

    .lang-check {
      color: var(--color-primary);
      flex-shrink: 0;
    }

    .lang-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
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
}
