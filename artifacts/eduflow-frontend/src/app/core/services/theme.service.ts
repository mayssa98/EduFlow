import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';
const STORAGE_KEY = 'eduflow.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly current$ = new BehaviorSubject<Theme>('dark');
  readonly theme$ = this.current$.asObservable();

  init(): void {
    let saved: Theme | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY) as Theme | null; } catch { /* storage may be disabled */ }
    this.set(saved ?? 'dark');
  }

  get(): Theme {
    return this.current$.value;
  }

  set(theme: Theme): void {
    this.current$.next(theme);
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage may be disabled */ }
  }

  toggle(): void {
    this.set(this.get() === 'dark' ? 'light' : 'dark');
  }
}
