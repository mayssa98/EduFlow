import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'en' | 'fr' | 'ar';
export const SUPPORTED_LANGS: Lang[] = ['en', 'fr', 'ar'];
const STORAGE_KEY = 'eduflow.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly current$ = new BehaviorSubject<Lang>('en');
  readonly lang$ = this.current$.asObservable();

  init(): void {
    this.translate.addLangs(SUPPORTED_LANGS);
    let saved: Lang | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY) as Lang | null; } catch { /* storage may be disabled */ }
    const initial: Lang = saved && SUPPORTED_LANGS.includes(saved) ? saved : 'en';
    this.set(initial);
  }

  get(): Lang {
    return this.current$.value;
  }

  set(lang: Lang): void {
    this.current$.next(lang);
    this.translate.use(lang);
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage may be disabled */ }
  }
}
