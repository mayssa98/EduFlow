import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, Lang, SUPPORTED_LANGS } from '../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <label class="ls" [attr.aria-label]="'nav.language' | translate">
      <select
        [value]="language.get()"
        (change)="onChange($any($event.target).value)"
        data-testid="language-switcher"
      >
        <option *ngFor="let l of langs" [value]="l">{{ labels[l] }}</option>
      </select>
    </label>
  `,
  styles: [
    `
      .ls select {
        appearance: none;
        background: var(--bg-surface-strong);
        color: var(--text-primary);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        padding: 6px 28px 6px 10px;
        font-family: var(--font-display);
        font-weight: 600; font-size: 0.85rem; cursor: pointer;
        background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
                          linear-gradient(135deg, currentColor 50%, transparent 50%);
        background-position: calc(100% - 14px) 50%, calc(100% - 9px) 50%;
        background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;
      }
    `,
  ],
})
export class LanguageSwitcherComponent {
  readonly language = inject(LanguageService);
  readonly langs = SUPPORTED_LANGS;
  readonly labels: Record<Lang, string> = { en: 'EN', fr: 'FR', ar: 'AR' };

  onChange(value: string): void {
    if (SUPPORTED_LANGS.includes(value as Lang)) this.language.set(value as Lang);
  }
}
