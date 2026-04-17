import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'en' | 'fr' | 'ar';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

const LANG_KEY = 'eduflow-lang';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English',  nativeLabel: 'English',  dir: 'ltr', flag: '🇬🇧' },
  { code: 'fr', label: 'French',   nativeLabel: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'ar', label: 'Arabic',   nativeLabel: 'العربية',  dir: 'rtl', flag: '🇸🇦' },
];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private _currentLang = signal<Language>(this.loadStoredLang());

  readonly currentLang = this._currentLang.asReadonly();
  readonly languages = LANGUAGES;

  constructor(private translate: TranslateService) {}

  init(): void {
    const lang = this._currentLang();
    this.translate.setDefaultLang('en');
    this.translate.addLangs(['en', 'fr', 'ar']);
    this.applyLanguage(lang);
  }

  setLanguage(lang: Language): void {
    this._currentLang.set(lang);
    localStorage.setItem(LANG_KEY, lang);
    this.applyLanguage(lang);
  }

  getCurrentOption(): LanguageOption {
    return LANGUAGES.find(l => l.code === this._currentLang())!;
  }

  private loadStoredLang(): Language {
    const stored = localStorage.getItem(LANG_KEY) as Language | null;
    if (stored === 'en' || stored === 'fr' || stored === 'ar') {
      return stored;
    }
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'fr') return 'fr';
    if (browserLang === 'ar') return 'ar';
    return 'en';
  }

  private applyLanguage(lang: Language): void {
    this.translate.use(lang);
    const option = LANGUAGES.find(l => l.code === lang)!;
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', option.dir);
    if (lang === 'ar') {
      html.classList.add('font-arabic');
    } else {
      html.classList.remove('font-arabic');
    }
  }
}
