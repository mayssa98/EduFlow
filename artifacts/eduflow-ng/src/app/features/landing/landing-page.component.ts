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
      <!-- Navigation -->
      <nav class="landing-nav">
        <div class="nav-brand">
          <svg class="brand-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--color-primary)"/>
            <path d="M7 14L12 19L21 9" stroke="var(--color-primary-foreground)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ 'APP.NAME' | translate }}</span>
        </div>
        <div class="nav-links">
          <a routerLink="/" class="nav-link">{{ 'NAV.HOME' | translate }}</a>
          <a routerLink="/dashboard" class="nav-link">{{ 'NAV.DASHBOARD' | translate }}</a>
        </div>
        <div class="nav-actions">
          <app-language-switcher />
          <app-theme-toggle />
          <a routerLink="/auth" class="btn-primary">{{ 'AUTH.SIGN_IN' | translate }}</a>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">{{ 'LANDING.HERO_TITLE' | translate }}</h1>
          <p class="hero-subtitle">{{ 'LANDING.HERO_SUBTITLE' | translate }}</p>
          <div class="hero-cta">
            <a routerLink="/auth" class="btn-primary btn-lg">{{ 'LANDING.GET_STARTED' | translate }}</a>
            <a routerLink="/dashboard" class="btn-outline btn-lg">{{ 'LANDING.LEARN_MORE' | translate }}</a>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="hero-card card-1">
            <span class="stat-value">94%</span>
            <span class="stat-label">{{ 'DASHBOARD.COMPLETION_RATE' | translate }}</span>
          </div>
          <div class="hero-card card-2">
            <span class="stat-value">1.2k</span>
            <span class="stat-label">{{ 'DASHBOARD.TOTAL_STUDENTS' | translate }}</span>
          </div>
          <div class="hero-card card-3">
            <span class="stat-value">87%</span>
            <span class="stat-label">{{ 'DASHBOARD.ATTENDANCE_RATE' | translate }}</span>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features">
        <h2 class="section-title">{{ 'LANDING.FEATURES_TITLE' | translate }}</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <h3 class="feature-title">{{ 'LANDING.FEATURE_ANALYTICS' | translate }}</h3>
            <p class="feature-desc">{{ 'LANDING.FEATURE_ANALYTICS_DESC' | translate }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon feature-icon--accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </div>
            <h3 class="feature-title">{{ 'LANDING.FEATURE_AI' | translate }}</h3>
            <p class="feature-desc">{{ 'LANDING.FEATURE_AI_DESC' | translate }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon feature-icon--success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3 class="feature-title">{{ 'LANDING.FEATURE_MULTILANG' | translate }}</h3>
            <p class="feature-desc">{{ 'LANDING.FEATURE_MULTILANG_DESC' | translate }}</p>
          </div>
        </div>
      </section>

      <footer class="landing-footer">
        <span>© 2026 {{ 'APP.NAME' | translate }}. {{ 'APP.TAGLINE' | translate }}.</span>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--color-background);
      color: var(--color-foreground);
    }

    .landing-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 64px;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--color-background);
      gap: 1rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-foreground);
      flex-shrink: 0;
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;
      flex: 1;
      justify-content: center;
    }

    .nav-link {
      padding: 6px 14px;
      border-radius: var(--radius);
      color: var(--color-muted-foreground);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.15s, background 0.15s;
    }

    .nav-link:hover {
      color: var(--color-foreground);
      background: var(--color-muted);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 18px;
      border-radius: var(--radius);
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }

    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:active { transform: scale(0.98); }

    .btn-outline {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 18px;
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-foreground);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-outline:hover { background: var(--color-muted); }

    .btn-lg { padding: 12px 28px; font-size: 1rem; }

    .hero {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 3rem;
      padding: 4rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .hero-title {
      font-size: clamp(1.875rem, 4vw, 3rem);
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 1.25rem;
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      font-size: 1.0625rem;
      color: var(--color-muted-foreground);
      line-height: 1.65;
      margin-bottom: 2rem;
      max-width: 520px;
    }

    .hero-cta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hero-visual {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .hero-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,.06);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .hero-card:hover { transform: translateY(-4px); }

    .card-1 { grid-column: 1; }
    .card-2 { grid-column: 2; }
    .card-3 { grid-column: 1 / -1; }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--color-muted-foreground);
      font-weight: 500;
    }

    .features {
      padding: 4rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .section-title {
      text-align: center;
      font-size: clamp(1.5rem, 3vw, 2.125rem);
      font-weight: 700;
      margin-bottom: 2.5rem;
      letter-spacing: -0.01em;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 2rem;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .feature-card:hover {
      box-shadow: 0 8px 32px rgba(0,0,0,.08);
      transform: translateY(-2px);
    }

    .feature-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .feature-icon--accent { background: hsl(258 90% 62%); }
    .feature-icon--success { background: hsl(142 71% 45%); }

    .feature-title {
      font-size: 1.0625rem;
      font-weight: 700;
      margin-bottom: 0.625rem;
    }

    .feature-desc {
      font-size: 0.9375rem;
      color: var(--color-muted-foreground);
      line-height: 1.6;
    }

    .landing-footer {
      border-top: 1px solid var(--color-border);
      padding: 1.25rem 2rem;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--color-muted-foreground);
    }

    @media (max-width: 768px) {
      .hero {
        grid-template-columns: 1fr;
        padding: 2rem 1rem;
      }
      .hero-visual { display: none; }
      .landing-nav { padding: 0 1rem; }
      .nav-links { display: none; }
    }
  `]
})
export class LandingPageComponent {}
