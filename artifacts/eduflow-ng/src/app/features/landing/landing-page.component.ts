import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ThemeToggleComponent, LanguageSwitcherComponent],
  template: `
    <div class="landing">
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>

      <nav class="nav glass">
        <a routerLink="/" class="brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="url(#g1)"/>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/>
            </linearGradient></defs>
            <path d="M9 16l5 5 9-10" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          <span>EduFlow</span>
        </a>
        <div class="nav-actions">
          <app-language-switcher></app-language-switcher>
          <app-theme-toggle></app-theme-toggle>
          <a routerLink="/auth" class="btn btn-primary btn-sm">{{ 'AUTH.SIGN_IN' | translate }}</a>
        </div>
      </nav>

      <section class="hero fade-up">
        <h1>
          <span class="gradient-text">{{ 'LANDING.HERO_TITLE' | translate }}</span>
        </h1>
        <p class="lede">{{ 'LANDING.HERO_SUBTITLE' | translate }}</p>
        <div class="cta">
          <a routerLink="/auth" class="btn btn-primary btn-lg">{{ 'LANDING.GET_STARTED' | translate }}</a>
          <a href="#features" class="btn btn-outline btn-lg">{{ 'LANDING.LEARN_MORE' | translate }}</a>
        </div>
      </section>

      <section class="stats">
        <div class="stat" *ngFor="let s of stats">
          <div class="num">{{ s.num }}</div>
          <div class="lab">{{ s.label | translate }}</div>
        </div>
      </section>

      <section id="features" class="features">
        <h2 class="section-title">{{ 'LANDING.FEATURES_TITLE' | translate }}</h2>
        <div class="grid">
          <article class="feat glass" *ngFor="let f of features">
            <div class="ico" [style.background]="f.bg"><span [innerHTML]="f.icon"></span></div>
            <h3>{{ f.titleKey | translate }}</h3>
            <p>{{ f.descKey | translate }}</p>
          </article>
        </div>
      </section>

      <section class="cta-banner glass">
        <h2>{{ 'LANDING.CTA_TITLE' | translate }}</h2>
        <p>{{ 'LANDING.CTA_SUBTITLE' | translate }}</p>
        <a routerLink="/auth" class="btn btn-primary btn-lg">{{ 'LANDING.GET_STARTED' | translate }}</a>
      </section>

      <footer>
        <span>© 2026 EduFlow. {{ 'APP.TAGLINE' | translate }}.</span>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .landing {
      position: relative; overflow-x: hidden;
      min-height: 100vh; padding: 16px 18px 40px;
      max-width: 1240px; margin: 0 auto;
    }
    .bg-glow { position: fixed; pointer-events: none; z-index: 0; filter: blur(80px); border-radius: 50%; }
    .bg-glow-1 { top: -160px; left: -120px; width: 480px; height: 480px;
      background: radial-gradient(circle, rgba(99,102,241,0.45), transparent 70%); animation: glowFloat 12s ease-in-out infinite; }
    .bg-glow-2 { bottom: -180px; right: -120px; width: 540px; height: 540px;
      background: radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%); animation: glowFloat 14s ease-in-out infinite reverse; }

    .nav, .hero, .stats, .features, .cta-banner, footer { position: relative; z-index: 1; }

    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 18px; border-radius: var(--radius-lg);
      position: sticky; top: 12px; z-index: 30;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; color: var(--color-foreground); }
    .nav-actions { display: flex; align-items: center; gap: 10px; }

    .hero { text-align: center; padding: 80px 16px 48px; max-width: 900px; margin: 0 auto; }
    .hero h1 { font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 800; line-height: 1.05; }
    .lede { color: var(--color-muted-foreground); font-size: 1.1rem; margin: 18px auto 28px; max-width: 640px; line-height: 1.6; }
    .cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

    .stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
      background: linear-gradient(135deg, var(--indigo-500), var(--violet-500));
      border-radius: var(--radius-xl); padding: 26px; margin: 40px 0 56px;
      box-shadow: var(--shadow-glow); color: #fff;
    }
    .stat { text-align: center; padding: 8px 12px; border-inline-end: 1px solid rgba(255,255,255,0.18); }
    .stat:last-child { border-inline-end: none; }
    .num { font-family: var(--font-display); font-weight: 800; font-size: 2rem; line-height: 1; }
    .lab { font-size: 0.82rem; opacity: 0.92; margin-top: 4px; font-weight: 500; }
    @media (max-width: 700px) { .stats { grid-template-columns: repeat(2, 1fr); }
      .stat:nth-child(2) { border-inline-end: none; }
      .stat { border-bottom: 1px solid rgba(255,255,255,0.18); }
      .stat:nth-last-child(-n+2) { border-bottom: none; }
    }

    .features { padding: 24px 0; }
    .section-title { text-align: center; font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 700; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
    .feat { padding: 26px; transition: transform 200ms ease, box-shadow 200ms ease; }
    .feat:hover { transform: translateY(-4px); box-shadow: var(--shadow-glow); }
    .ico {
      width: 48px; height: 48px; border-radius: 12px;
      display: inline-flex; align-items: center; justify-content: center;
      color: white; margin-bottom: 16px;
    }
    .feat h3 { font-size: 1.1rem; margin-bottom: 8px; }
    .feat p  { color: var(--color-muted-foreground); font-size: 0.92rem; line-height: 1.55; }

    .cta-banner {
      margin: 56px 0 32px; padding: 40px 28px; text-align: center;
      background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12));
    }
    .cta-banner h2 { font-size: clamp(1.4rem, 3vw, 2rem); margin-bottom: 10px; }
    .cta-banner p  { color: var(--color-muted-foreground); margin-bottom: 22px; }

    footer { text-align: center; color: var(--color-muted-foreground); font-size: 0.82rem; padding: 20px 0; }
  `],
})
export class LandingPageComponent {
  stats = [
    { num: '12k+', label: 'LANDING.STAT_STUDENTS' },
    { num: '500+', label: 'LANDING.STAT_TEACHERS' },
    { num: '94%',  label: 'LANDING.STAT_COMPLETION' },
    { num: '24/7', label: 'LANDING.STAT_SUPPORT' },
  ];

  features = [
    {
      titleKey: 'LANDING.FEATURE_ANALYTICS',
      descKey:  'LANDING.FEATURE_ANALYTICS_DESC',
      bg: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    },
    {
      titleKey: 'LANDING.FEATURE_AI',
      descKey:  'LANDING.FEATURE_AI_DESC',
      bg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    },
    {
      titleKey: 'LANDING.FEATURE_MULTILANG',
      descKey:  'LANDING.FEATURE_MULTILANG_DESC',
      bg: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    },
  ];
}
