import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { BrandMarkComponent } from '../../shared/components/brand/brand-mark.component';
import { APP_ICONS } from '../../shared/icons/app-icons';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ThemeToggleComponent, LanguageSwitcherComponent, BrandMarkComponent],
  template: `
    <div class="landing">
      <div class="bg-mesh"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
      <div class="bg-glow bg-glow-3"></div>

      <div class="hero-backdrop" aria-hidden="true">
        <img src="assets/landing-student-photo.jpg" alt="" />
      </div>

      <nav class="nav glass">
        <app-brand-mark [size]="40"></app-brand-mark>
        <div class="nav-links">
          <a *ngFor="let item of navItems" [href]="item.href" class="nav-link">
            <span class="nav-link__icon" [innerHTML]="item.icon"></span>
            <span class="nav-link__label">{{ item.labelKey | translate }}</span>
          </a>
        </div>
        <div class="nav-actions">
          <app-language-switcher></app-language-switcher>
          <app-theme-toggle></app-theme-toggle>
          <a routerLink="/auth" class="btn btn-primary btn-sm">{{ 'AUTH.SIGN_IN' | translate }}</a>
        </div>
      </nav>

      <section id="home" class="hero">
        <div class="hero-copy fade-up">
          <span class="hero-badge glass">
            <span class="hero-badge__icon" [innerHTML]="icons.sparkles"></span>
            {{ 'LANDING.HERO_BADGE' | translate }}
          </span>

          <h1>
            <span class="gradient-text">{{ 'LANDING.HERO_TITLE' | translate }}</span>
          </h1>

          <p class="lede">{{ 'LANDING.HERO_SUBTITLE' | translate }}</p>

          <ul class="hero-points">
            <li class="hero-point" *ngFor="let point of heroPoints">
              <span class="hero-point__bullet"></span>
              <span>{{ point.labelKey | translate }}</span>
            </li>
          </ul>

          <div class="cta">
            <a routerLink="/auth" class="btn btn-primary btn-lg">{{ 'LANDING.GET_STARTED' | translate }}</a>
            <a href="#features" class="btn btn-outline btn-lg">{{ 'LANDING.LEARN_MORE' | translate }}</a>
          </div>

          <div class="hero-proof glass">
            <div class="proof-item" *ngFor="let item of proofItems">
              <strong>{{ item.value }}</strong>
              <span>{{ item.labelKey | translate }}</span>
            </div>
          </div>
        </div>

        <div class="hero-visual fade-up">
          <div class="visual-shell glass">
            <div class="visual-gradient"></div>
            <div class="visual-orbit orbit-a"></div>
            <div class="visual-orbit orbit-b"></div>

            <div class="dashboard-card">
              <div class="dashboard-card__header">
                <span>{{ 'LANDING.VISUAL_PANEL_TITLE' | translate }}</span>
                <span class="status-pill">
                  <span class="status-pill__dot"></span>
                  {{ 'LANDING.STATUS_BADGE' | translate }}
                </span>
              </div>

              <div class="dashboard-card__body">
                <div class="mini-chart">
                  <span *ngFor="let bar of visualBars" [style.height.%]="bar"></span>
                </div>

                <div class="mini-stats">
                  <div>
                    <strong>94%</strong>
                    <span>{{ 'LANDING.STAT_COMPLETION' | translate }}</span>
                  </div>
                  <div>
                    <strong>12k+</strong>
                    <span>{{ 'LANDING.STAT_STUDENTS' | translate }}</span>
                  </div>
                </div>
              </div>
            </div>

            <img src="assets/landing-student-photo.jpg" alt="Etudiante utilisant la plateforme" class="hero-student" />

            <div class="floating-card floating-card-left glass">
              <span class="floating-card__icon floating-card__icon--teal" [innerHTML]="icons.checkBadge"></span>
              <div class="floating-card__copy">
                <span class="floating-card__label">{{ 'LANDING.FLOATING_CARD_TITLE' | translate }}</span>
                <strong>{{ 'LANDING.FLOATING_CARD_VALUE' | translate }}</strong>
                <p>{{ 'LANDING.FLOATING_CARD_HINT' | translate }}</p>
              </div>
            </div>

            <div class="floating-card floating-card-right glass">
              <span class="floating-card__icon floating-card__icon--amber" [innerHTML]="icons.clock"></span>
              <div class="floating-card__copy">
                <strong>{{ 'LANDING.VIDEO_CARD_TITLE' | translate }}</strong>
                <p>{{ 'LANDING.VIDEO_CARD_SUBTITLE' | translate }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="community" class="stats-section">
        <div class="section-heading section-heading-left">
          <span class="section-kicker">{{ 'LANDING.STATS_KICKER' | translate }}</span>
          <h2>{{ 'LANDING.STATS_TITLE' | translate }}</h2>
          <p>{{ 'LANDING.STATS_SUBTITLE' | translate }}</p>
        </div>

        <div class="stats-grid">
          <article class="stat glass" *ngFor="let s of stats" [style.--stat-accent]="s.accent">
            <span class="stat__accent"></span>
            <div class="num">{{ s.num }}</div>
            <div class="lab">{{ s.label | translate }}</div>
          </article>
        </div>
      </section>

      <section id="features" class="features">
        <div class="section-heading">
          <span class="section-kicker">{{ 'LANDING.FEATURES_TITLE' | translate }}</span>
          <h2>{{ 'LANDING.FEATURES_SUBTITLE' | translate }}</h2>
        </div>

        <div class="feature-layout">
          <div class="grid">
            <article class="feat glass" *ngFor="let f of features">
              <div class="feat-head">
                <div class="ico" [style.background]="f.bg"><span [innerHTML]="f.icon"></span></div>
                <span class="feat-chip">{{ f.chipKey | translate }}</span>
              </div>
              <h3>{{ f.titleKey | translate }}</h3>
              <p>{{ f.descKey | translate }}</p>
            </article>
          </div>

          <aside class="feature-story glass">
            <span class="feature-story__badge">{{ 'LANDING.FEATURE_STORY_BADGE' | translate }}</span>
            <h3>{{ 'LANDING.FEATURE_STORY_TITLE' | translate }}</h3>
            <p>{{ 'LANDING.FEATURE_STORY_SUBTITLE' | translate }}</p>

            <div class="story-list">
              <div class="story-item" *ngFor="let item of storyItems">
                <span class="story-item__icon" [innerHTML]="item.icon"></span>
                <div>
                  <strong>{{ item.titleKey | translate }}</strong>
                  <p>{{ item.descKey | translate }}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section id="journey" class="journey">
        <div class="section-heading">
          <span class="section-kicker">{{ 'LANDING.JOURNEY_KICKER' | translate }}</span>
          <h2>{{ 'LANDING.JOURNEY_TITLE' | translate }}</h2>
          <p>{{ 'LANDING.JOURNEY_SUBTITLE' | translate }}</p>
        </div>

        <div class="journey-layout">
          <div class="journey-steps">
            <article class="journey-step glass" *ngFor="let step of workflowSteps">
              <span class="journey-step__index">{{ step.index }}</span>
              <span class="journey-step__icon" [innerHTML]="step.icon"></span>
              <h3>{{ step.titleKey | translate }}</h3>
              <p>{{ step.descKey | translate }}</p>
            </article>
          </div>

          <div class="journey-preview glass">
            <div class="journey-preview__header">
              <div>
                <span class="journey-preview__badge">{{ 'LANDING.TIMELINE_BADGE' | translate }}</span>
                <h3>{{ 'LANDING.TIMELINE_TITLE' | translate }}</h3>
              </div>
              <span class="journey-preview__pulse"></span>
            </div>

            <div class="timeline-item" *ngFor="let item of timelineItems">
              <span class="timeline-item__dot"></span>
              <div>
                <strong>{{ item.titleKey | translate }}</strong>
                <p>{{ item.descKey | translate }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="cta-banner glass">
        <div>
          <h2>{{ 'LANDING.CTA_TITLE' | translate }}</h2>
          <p>{{ 'LANDING.CTA_SUBTITLE' | translate }}</p>
        </div>
        <a routerLink="/auth" class="btn btn-primary btn-lg">{{ 'LANDING.GET_STARTED' | translate }}</a>
      </section>

      <footer>
        <span>&copy; 2026 EduFlow. {{ 'APP.TAGLINE' | translate }}.</span>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .landing {
      position: relative;
      overflow: hidden;
      min-height: 100vh;
      padding: 16px 18px 56px;
      max-width: 1320px;
      margin: 0 auto;
    }

    .bg-mesh,
    .bg-glow,
    .hero-backdrop {
      position: fixed;
      pointer-events: none;
      z-index: 0;
    }

    .bg-mesh {
      inset: 0;
      background:
        radial-gradient(circle at 15% 18%, rgba(99, 102, 241, 0.16), transparent 28%),
        radial-gradient(circle at 85% 22%, rgba(45, 212, 191, 0.12), transparent 24%),
        linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
      background-size: auto, auto, 58px 58px, 58px 58px;
      mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 88%);
      opacity: 0.75;
    }

    .bg-glow {
      filter: blur(90px);
      border-radius: 50%;
    }

    .bg-glow-1 {
      top: -120px;
      left: -80px;
      width: 420px;
      height: 420px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent 72%);
      animation: glowFloat 12s ease-in-out infinite;
    }

    .bg-glow-2 {
      top: 20%;
      right: -120px;
      width: 460px;
      height: 460px;
      background: radial-gradient(circle, rgba(45, 212, 191, 0.22), transparent 74%);
      animation: glowFloat 15s ease-in-out infinite reverse;
    }

    .bg-glow-3 {
      bottom: -180px;
      left: 40%;
      width: 520px;
      height: 520px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.26), transparent 74%);
      animation: glowFloat 17s ease-in-out infinite;
    }

    .hero-backdrop {
      top: 120px;
      right: -120px;
      width: min(44vw, 680px);
      opacity: 0.12;
      transform: rotate(-8deg);
      animation: heroBackdropFloat 18s ease-in-out infinite;
    }

    .hero-backdrop img {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 36px;
      filter: saturate(0.92);
    }

      .nav,
      .hero,
      .stats-section,
    .features,
    .journey,
    .cta-banner,
    footer {
      position: relative;
      z-index: 1;
    }

    .nav {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      padding: 10px 18px;
      border-radius: var(--radius-lg);
      position: sticky;
      top: 12px;
      z-index: 30;
    }

    .nav-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      padding: 6px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.32);
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 42px;
      padding: 9px 16px;
      border-radius: 999px;
      color: var(--color-foreground);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 700;
      border: 1px solid transparent;
      transition: transform 180ms ease, color 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .nav-link__icon {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);
      color: var(--color-primary);
      flex-shrink: 0;
    }

    .nav-link__label {
      line-height: 1;
    }

    .nav-link:hover,
    .nav-link:focus-visible {
      transform: translateY(-1px);
      color: #ffffff;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(59, 130, 246, 0.12));
      border-color: rgba(99, 102, 241, 0.28);
      box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
      align-items: center;
      gap: 28px;
      padding: 64px 0 44px;
    }

    .hero-copy {
      max-width: 640px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      margin-bottom: 18px;
      font-size: 0.86rem;
      color: var(--color-muted-foreground);
      border-radius: 999px;
    }

    .hero-badge__icon,
    .hero-point__icon,
    .story-item__icon,
    .journey-step__icon,
    .floating-card__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .hero-badge__icon {
      color: var(--color-primary);
    }

    .hero h1 {
      font-size: clamp(2.6rem, 5vw, 4.8rem);
      font-weight: 800;
      line-height: 0.98;
      letter-spacing: -0.04em;
      max-width: 12ch;
    }

    .lede {
      color: var(--color-muted-foreground);
      font-size: 1.08rem;
      margin: 20px 0 28px;
      max-width: 58ch;
      line-height: 1.72;
    }

    .hero-points {
      display: grid;
      gap: 12px;
      margin-bottom: 30px;
      padding: 0;
      list-style: none;
    }

    .hero-point {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 12px;
      color: var(--color-foreground);
      font-size: 0.96rem;
      line-height: 1.55;
    }

    .hero-point__bullet {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
      flex-shrink: 0;
    }

    .cta {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .hero-proof {
      margin-top: 26px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      padding: 18px;
    }

    .proof-item {
      display: grid;
      gap: 4px;
    }

    .proof-item strong {
      font-family: var(--font-display);
      font-size: 1.5rem;
      line-height: 1;
    }

    .proof-item span {
      font-size: 0.82rem;
      color: var(--color-muted-foreground);
      line-height: 1.45;
    }

    .hero-visual {
      position: relative;
    }

    .visual-shell {
      position: relative;
      min-height: 590px;
      padding: 24px;
      overflow: hidden;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 42%),
        var(--glass-bg);
      box-shadow: var(--shadow-lg);
    }

    html.dark .visual-shell {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.07), transparent 42%),
        rgba(7, 11, 24, 0.64);
    }

    .visual-gradient {
      position: absolute;
      inset: auto 14% 10% 14%;
      height: 44%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.28), transparent 72%);
      filter: blur(34px);
      animation: heroBackdropFloat 10s ease-in-out infinite;
    }

    .visual-orbit {
      position: absolute;
      border: 1px dashed rgba(99, 102, 241, 0.22);
      border-radius: 50%;
      animation: orbitSpin linear infinite;
    }

    .orbit-a {
      width: 440px;
      height: 440px;
      top: 62px;
      left: 50%;
      transform: translateX(-50%);
      animation-duration: 20s;
    }

    .orbit-b {
      width: 320px;
      height: 320px;
      top: 124px;
      left: 50%;
      transform: translateX(-50%);
      animation-duration: 14s;
      animation-direction: reverse;
    }

    .dashboard-card {
      position: absolute;
      inset: 24px 28px auto 28px;
      padding: 18px 18px 16px;
      border-radius: 22px;
      background:
        linear-gradient(135deg, rgba(8, 15, 34, 0.94), rgba(15, 23, 42, 0.84));
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(18px);
      color: #ffffff;
      box-shadow: 0 26px 48px rgba(15, 23, 42, 0.25);
    }

    .dashboard-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
      font-size: 0.88rem;
      color: rgba(255, 255, 255, 0.72);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      text-transform: none;
      letter-spacing: 0;
    }

    .status-pill__dot,
    .journey-preview__pulse {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--teal-400);
      box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.55);
      animation: pulseDot 1.8s infinite;
    }

    .dashboard-card__body {
      display: grid;
      gap: 18px;
    }

    .mini-chart {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      align-items: end;
      gap: 10px;
      height: 126px;
    }

    .mini-chart span {
      display: block;
      border-radius: 999px 999px 8px 8px;
      background: linear-gradient(180deg, var(--teal-400), var(--indigo-500));
      transform-origin: bottom;
      animation: barGrow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .mini-chart span:nth-child(2) { animation-delay: 90ms; }
    .mini-chart span:nth-child(3) { animation-delay: 160ms; }
    .mini-chart span:nth-child(4) { animation-delay: 230ms; }
    .mini-chart span:nth-child(5) { animation-delay: 300ms; }
    .mini-chart span:nth-child(6) { animation-delay: 370ms; }

    .mini-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .mini-stats div {
      padding: 14px;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(8, 15, 34, 0.96), rgba(17, 24, 39, 0.86));
      border: 1px solid rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(16px);
      display: grid;
      gap: 6px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .mini-stats div:first-child {
      background: linear-gradient(160deg, rgba(14, 116, 144, 0.34), rgba(15, 23, 42, 0.96));
    }

    .mini-stats div:last-child {
      background: linear-gradient(160deg, rgba(79, 70, 229, 0.28), rgba(15, 23, 42, 0.96));
    }

    .mini-stats strong {
      font-family: var(--font-display);
      font-size: 1.6rem;
      line-height: 1;
      text-shadow: 0 8px 18px rgba(0, 0, 0, 0.34);
    }

    .mini-stats span {
      color: rgba(255, 255, 255, 0.98);
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }

    .hero-student {
      position: absolute;
      bottom: 34px;
      left: 50%;
      width: min(72%, 390px);
      height: min(72%, 420px);
      transform: translateX(-50%);
      object-fit: cover;
      border-radius: 30px;
      border: 8px solid rgba(255, 255, 255, 0.3);
      box-shadow:
        0 28px 60px rgba(15, 23, 42, 0.24),
        inset 0 1px 0 rgba(255, 255, 255, 0.45);
      animation: studentFloat 7s ease-in-out infinite;
    }

    .floating-card {
      position: absolute;
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: start;
      gap: 14px;
      padding: 18px;
      max-width: 270px;
      background:
        linear-gradient(135deg, rgba(4, 9, 24, 0.96), rgba(15, 23, 42, 0.88));
      border: 1px solid rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(22px);
      box-shadow:
        0 18px 38px rgba(2, 6, 23, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .floating-card__copy {
      display: grid;
      gap: 6px;
    }

    .floating-card strong {
      font-size: 1.08rem;
      line-height: 1.25;
      color: #ffffff;
      text-shadow: 0 6px 16px rgba(0, 0, 0, 0.38);
    }

    .floating-card p,
    .feature-story p,
    .story-item p,
    .journey-step p,
    .journey-preview p,
    .section-heading p,
    .cta-banner p {
      color: var(--color-muted-foreground);
      line-height: 1.62;
    }

    .floating-card p {
      color: rgba(255, 255, 255, 0.92);
      margin: 0;
      font-size: 0.9rem;
    }

    .floating-card__label {
      color: rgba(255, 255, 255, 0.94);
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .floating-card-left {
      left: 16px;
      bottom: 48px;
      animation: cardFloat 6s ease-in-out infinite;
    }

    .floating-card-right {
      top: 196px;
      right: 12px;
      animation: cardFloat 6.5s ease-in-out infinite reverse;
    }

    .floating-card__icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: rgba(99, 102, 241, 0.16);
      color: #ffffff;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.14),
        0 12px 24px rgba(15, 23, 42, 0.26);
    }

    .floating-card__icon--teal {
      background: linear-gradient(135deg, rgba(20, 184, 166, 0.95), rgba(14, 116, 144, 0.9));
    }

    .floating-card__icon--amber {
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.96), rgba(245, 158, 11, 0.9));
    }

    .stats-section,
    .features,
    .journey {
      padding-top: 36px;
    }

    .section-heading {
      max-width: 720px;
      margin: 0 auto 28px;
      text-align: center;
    }

    .section-heading-left {
      margin-left: 0;
      margin-right: 0;
      text-align: left;
      max-width: 520px;
    }

    .section-kicker,
    .feature-story__badge,
    .journey-preview__badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--color-primary);
      margin-bottom: 12px;
      font-weight: 700;
    }

    .section-heading h2,
    .cta-banner h2 {
      font-size: clamp(1.8rem, 3.4vw, 3rem);
      line-height: 1.05;
      margin-bottom: 12px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
      gap: 22px;
      align-items: start;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .stat {
      position: relative;
      padding: 24px;
      overflow: hidden;
      min-height: 148px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .stat__accent {
      position: absolute;
      inset: 0 auto auto 0;
      width: 100%;
      height: 4px;
      background: var(--stat-accent);
    }

    .num {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: clamp(2rem, 3vw, 2.5rem);
      line-height: 1;
      margin-bottom: 10px;
    }

    .lab {
      color: var(--color-muted-foreground);
      font-size: 0.94rem;
      line-height: 1.45;
    }

    .feature-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
      gap: 20px;
      align-items: start;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .feat,
    .feature-story,
    .journey-step {
      transition: transform 220ms ease, box-shadow 220ms ease;
    }

    .feat:hover,
    .feature-story:hover,
    .journey-step:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-glow);
    }

    .feat {
      position: relative;
      padding: 28px;
      min-height: 228px;
      overflow: hidden;
      background:
        radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 34%),
        var(--glass-bg);
    }

    .feat-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 22px;
    }

    .ico {
      width: 66px;
      height: 66px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.24),
        0 22px 34px rgba(15, 23, 42, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .feat-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(99, 102, 241, 0.18);
      background: rgba(99, 102, 241, 0.08);
      color: var(--color-primary);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .feat p {
      max-width: 30ch;
      color: var(--color-muted-foreground);
    }

    .feat h3,
    .feature-story h3,
    .journey-step h3,
    .journey-preview h3 {
      font-size: 1.16rem;
      margin-bottom: 10px;
    }

    .feature-story {
      padding: 28px;
      position: sticky;
      top: 94px;
    }

    .story-list {
      display: grid;
      gap: 16px;
      margin-top: 24px;
    }

    .story-item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 14px;
      align-items: start;
    }

    .story-item__icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(59, 130, 246, 0.12));
      color: #ffffff;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        0 16px 28px rgba(15, 23, 42, 0.16);
      flex-shrink: 0;
    }

    .hero-badge__icon svg,
    .nav-link__icon svg,
    .story-item__icon svg,
    .journey-step__icon svg,
    .floating-card__icon svg,
    .ico svg {
      width: 22px;
      height: 22px;
      stroke-width: 2;
    }

    .ico span,
    .nav-link__icon span,
    .story-item__icon span,
    .floating-card__icon span,
    .hero-badge__icon span,
    .journey-step__icon span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .story-item strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.98rem;
    }

    .journey-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(300px, 0.9fr);
      gap: 20px;
      align-items: start;
    }

    .journey-steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .journey-step {
      padding: 24px;
      position: relative;
      min-height: 220px;
    }

    .journey-step__index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: rgba(99, 102, 241, 0.12);
      color: var(--color-primary);
      font-family: var(--font-display);
      font-size: 0.92rem;
      font-weight: 700;
      margin-bottom: 18px;
    }

    .journey-step__icon {
      color: var(--color-primary);
      margin-bottom: 12px;
    }

    .journey-preview {
      padding: 24px;
      min-height: 100%;
    }

    .journey-preview__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }

    .timeline-item {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 14px;
      padding: 14px 0 14px 4px;
    }

    .timeline-item + .timeline-item {
      border-top: 1px solid var(--color-border);
    }

    .timeline-item__dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      margin-top: 4px;
      background: linear-gradient(135deg, var(--teal-400), var(--indigo-500));
      box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.08);
    }

    .timeline-item strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.96rem;
    }

    .cta-banner {
      margin: 56px 0 20px;
      padding: 34px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      background:
        radial-gradient(circle at top right, rgba(45, 212, 191, 0.14), transparent 35%),
        linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.16));
    }

    footer {
      text-align: center;
      color: var(--color-muted-foreground);
      font-size: 0.82rem;
      padding-top: 8px;
    }

    @keyframes orbitSpin {
      from { transform: translateX(-50%) rotate(0deg); }
      to { transform: translateX(-50%) rotate(360deg); }
    }

    @keyframes studentFloat {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-10px); }
    }

    @keyframes cardFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes heroBackdropFloat {
      0%, 100% { transform: rotate(-8deg) translateY(0); }
      50% { transform: rotate(-5deg) translateY(-12px); }
    }

    @keyframes pulseDot {
      0% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.55); }
      70% { box-shadow: 0 0 0 10px rgba(45, 212, 191, 0); }
      100% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
    }

    @media (max-width: 1100px) {
      .hero,
      .stats-section,
      .feature-layout,
      .journey-layout {
        grid-template-columns: 1fr;
      }

      .hero-copy {
        max-width: none;
      }

      .section-heading-left,
      .section-heading {
        max-width: none;
        text-align: center;
      }

      .feature-story {
        position: static;
      }

      .journey-steps {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 900px) {
      .hero {
        padding-top: 42px;
      }

      .hero h1 {
        max-width: none;
      }

      .hero-copy,
      .section-heading-left {
        text-align: center;
      }

      .hero-points {
        justify-items: center;
      }

      .hero-point {
        max-width: 34rem;
      }

      .hero-proof {
        grid-template-columns: 1fr;
      }

      .stats-grid,
      .grid,
      .journey-steps {
        grid-template-columns: 1fr;
      }

      .visual-shell {
        min-height: 560px;
      }

      .hero-backdrop {
        width: min(70vw, 520px);
        right: -140px;
      }

      .cta-banner {
        flex-direction: column;
        text-align: center;
      }
    }

    @media (max-width: 700px) {
      .landing {
        padding-inline: 14px;
      }

      .nav {
        align-items: flex-start;
      }

      .nav-links {
        width: 100%;
        justify-content: center;
        order: 3;
      }

      .nav-actions {
        width: 100%;
      }

      .cta {
        justify-content: center;
      }

      .visual-shell {
        min-height: 520px;
        padding: 18px;
      }

      .dashboard-card {
        inset-inline: 18px;
      }

      .floating-card-left {
        left: 12px;
        right: 12px;
        max-width: none;
        bottom: 16px;
      }

      .floating-card-right {
        top: 184px;
        right: 14px;
        left: auto;
        max-width: 180px;
      }

      .hero-student {
        width: min(88%, 360px);
        height: min(62%, 360px);
        bottom: 18px;
      }

      .mini-stats {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .landing {
        padding-top: 12px;
      }

      .nav {
        grid-template-columns: 1fr;
      }

      .nav-links {
        justify-content: center;
      }

      .nav-link {
        width: calc(50% - 6px);
        justify-content: flex-start;
      }

      .nav-actions {
        justify-content: space-between;
      }

      .hero h1 {
        font-size: 2.3rem;
      }

      .hero-badge {
        width: 100%;
        justify-content: center;
      }

      .floating-card-right {
        position: static;
        margin: 164px 12px 0;
        max-width: none;
      }

      .visual-shell {
        min-height: 610px;
      }
    }
  `],
})
export class LandingPageComponent {
  readonly icons = APP_ICONS;

  readonly visualBars = [34, 52, 47, 74, 63, 86];

  readonly navItems = [
    { href: '#home', labelKey: 'LANDING.NAV_HOME', icon: APP_ICONS.home },
    { href: '#community', labelKey: 'LANDING.NAV_COMMUNITY', icon: APP_ICONS.chart },
    { href: '#features', labelKey: 'LANDING.NAV_FEATURES', icon: APP_ICONS.layers },
    { href: '#journey', labelKey: 'LANDING.NAV_JOURNEY', icon: APP_ICONS.rocket },
  ];

  readonly heroPoints = [
    { labelKey: 'LANDING.HERO_POINT_PERSONALIZED' },
    { labelKey: 'LANDING.HERO_POINT_TRACKING' },
    { labelKey: 'LANDING.HERO_POINT_COLLAB' },
  ];

  readonly proofItems = [
    { value: '98%', labelKey: 'LANDING.PROOF_SATISFACTION' },
    { value: '3x', labelKey: 'LANDING.PROOF_SPEED' },
    { value: '24h', labelKey: 'LANDING.PROOF_ONBOARDING' },
  ];

  readonly stats = [
    {
      num: '12k+',
      label: 'LANDING.STAT_STUDENTS',
      accent: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    },
    {
      num: '500+',
      label: 'LANDING.STAT_TEACHERS',
      accent: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
    },
    {
      num: '94%',
      label: 'LANDING.STAT_COMPLETION',
      accent: 'linear-gradient(135deg, #f97316, #fbbf24)',
    },
  ];

  readonly features = [
    {
      titleKey: 'LANDING.FEATURE_ANALYTICS',
      descKey: 'LANDING.FEATURE_ANALYTICS_DESC',
      chipKey: 'LANDING.FEATURE_CHIP_ANALYTICS',
      bg: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      icon: APP_ICONS.chart,
    },
    {
      titleKey: 'LANDING.FEATURE_AI',
      descKey: 'LANDING.FEATURE_AI_DESC',
      chipKey: 'LANDING.FEATURE_CHIP_AI',
      bg: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      icon: APP_ICONS.sparkles,
    },
    {
      titleKey: 'LANDING.FEATURE_MULTILANG',
      descKey: 'LANDING.FEATURE_MULTILANG_DESC',
      chipKey: 'LANDING.FEATURE_CHIP_MULTILANG',
      bg: 'linear-gradient(135deg, #2dd4bf, #14b8a6)',
      icon: APP_ICONS.globe,
    },
    {
      titleKey: 'LANDING.FEATURE_EXPERIENCE',
      descKey: 'LANDING.FEATURE_EXPERIENCE_DESC',
      chipKey: 'LANDING.FEATURE_CHIP_EXPERIENCE',
      bg: 'linear-gradient(135deg, #f97316, #fbbf24)',
      icon: APP_ICONS.home,
    },
  ];

  readonly storyItems = [
    {
      titleKey: 'LANDING.STORY_ONE_TITLE',
      descKey: 'LANDING.STORY_ONE_DESC',
      icon: APP_ICONS.target,
    },
    {
      titleKey: 'LANDING.STORY_TWO_TITLE',
      descKey: 'LANDING.STORY_TWO_DESC',
      icon: APP_ICONS.activity,
    },
    {
      titleKey: 'LANDING.STORY_THREE_TITLE',
      descKey: 'LANDING.STORY_THREE_DESC',
      icon: APP_ICONS.message,
    },
  ];

  readonly workflowSteps = [
    {
      index: '01',
      titleKey: 'LANDING.STEP_PLAN',
      descKey: 'LANDING.STEP_PLAN_DESC',
      icon: APP_ICONS.rocket,
    },
    {
      index: '02',
      titleKey: 'LANDING.STEP_GUIDE',
      descKey: 'LANDING.STEP_GUIDE_DESC',
      icon: APP_ICONS.calendarCheck,
    },
    {
      index: '03',
      titleKey: 'LANDING.STEP_GROW',
      descKey: 'LANDING.STEP_GROW_DESC',
      icon: APP_ICONS.award,
    },
  ];

  readonly timelineItems = [
    {
      titleKey: 'LANDING.TIMELINE_ITEM_ONE_TITLE',
      descKey: 'LANDING.TIMELINE_ITEM_ONE_DESC',
    },
    {
      titleKey: 'LANDING.TIMELINE_ITEM_TWO_TITLE',
      descKey: 'LANDING.TIMELINE_ITEM_TWO_DESC',
    },
    {
      titleKey: 'LANDING.TIMELINE_ITEM_THREE_TITLE',
      descKey: 'LANDING.TIMELINE_ITEM_THREE_DESC',
    },
  ];
}
