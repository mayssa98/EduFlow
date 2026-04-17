import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { LanguageSwitcherComponent } from './shared/components/language-switcher.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, LanguageSwitcherComponent, ThemeToggleComponent],
  template: `
    <header class="topbar glass">
      <div class="brand">
        <span class="brand-icon">E</span>
        <span class="brand-name">EduFlow</span>
      </div>
      <nav class="topbar-actions">
        <app-language-switcher></app-language-switcher>
        <app-theme-toggle></app-theme-toggle>
      </nav>
    </header>
    <main class="page">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .topbar {
        position: sticky; top: 12px; z-index: 50;
        margin: 12px auto 0; max-width: 1200px;
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 18px;
      }
      .brand { display: flex; align-items: center; gap: 10px; }
      .brand-icon {
        width: 32px; height: 32px; border-radius: 10px;
        display: inline-flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, var(--indigo-500), var(--violet-500));
        color: white; font-family: var(--font-display); font-weight: 800;
      }
      .brand-name { font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; }
      .topbar-actions { display: flex; align-items: center; gap: 10px; }
      .page { max-width: 1200px; margin: 0 auto; padding: 24px; }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly language = inject(LanguageService);
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    this.language.init();
    this.theme.init();
  }
}
