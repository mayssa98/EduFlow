import { AfterViewInit, Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { BrandMarkComponent } from '../../shared/components/brand/brand-mark.component';
import { APP_ICONS } from '../../shared/icons/app-icons';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    ThemeToggleComponent,
    LanguageSwitcherComponent,
    BrandMarkComponent,
  ],
  template: `
    <div class="landing">
      <div class="landing__grid"></div>
      <div class="landing__glow landing__glow--violet"></div>
      <div class="landing__glow landing__glow--cyan"></div>
      <div class="landing__glow landing__glow--orange"></div>

      <div class="landing__inner">
        <nav class="nav glass" aria-label="Navigation principale">
          <div class="nav__brand">
            <app-brand-mark [size]="40" [rounded]="14"></app-brand-mark>
          </div>

          <div class="nav__links" role="tablist" aria-label="Sections de la page">
            @for (item of navItems; track item.id) {
              <button
                class="nav__link"
                type="button"
                [class.is-active]="activeSection() === item.id"
                [attr.aria-current]="activeSection() === item.id ? 'page' : null"
                (click)="scrollToSection(item.id)"
              >
                <span class="nav__icon" [innerHTML]="item.icon"></span>
                <span>{{ item.labelKey | translate }}</span>
              </button>
            }
          </div>

          <div class="nav__actions">
            <app-language-switcher></app-language-switcher>
            <app-theme-toggle></app-theme-toggle>
            <a class="btn btn-primary nav__cta" routerLink="/login">
              {{ 'AUTH.SIGN_IN' | translate }}
            </a>
          </div>
        </nav>

        <main class="landing__content">
          <section id="home" class="hero">
            <div class="hero__copy fade-up">
              <span class="eyebrow glass">{{ 'LANDING.HERO_BADGE' | translate }}</span>
              <h1 class="hero__title gradient-text">{{ 'LANDING.HERO_TITLE' | translate }}</h1>
              <p class="hero__subtitle">{{ 'LANDING.HERO_SUBTITLE' | translate }}</p>

              <ul class="hero-points">
                @for (point of heroPoints; track point.key) {
                  <li class="hero-point">
                    <span class="hero-point__icon" [innerHTML]="point.icon"></span>
                    <span>{{ point.key | translate }}</span>
                  </li>
                }
              </ul>

              <div class="hero__actions">
                <a class="btn btn-primary btn-lg" routerLink="/login">
                  {{ 'LANDING.GET_STARTED' | translate }}
                </a>
                <button class="btn btn-outline btn-lg" type="button" (click)="scrollToSection('features')">
                  {{ 'LANDING.LEARN_MORE' | translate }}
                </button>
              </div>

              <div class="proof-strip glass">
                @for (proof of proofStats; track proof.labelKey) {
                  <div class="proof-strip__item">
                    <strong>{{ proof.value }}</strong>
                    <span>{{ proof.labelKey | translate }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="hero__visual fade-up">
              <div class="hero__halo hero__halo--indigo"></div>
              <div class="hero__halo hero__halo--cyan"></div>

              <div class="visual-stage glass">
                <div class="visual-stage__header">
                  <span class="visual-stage__label">{{ 'LANDING.VISUAL_PANEL_TITLE' | translate }}</span>
                  <span class="status-pill">
                    <span class="status-pill__dot"></span>
                    {{ 'LANDING.STATUS_BADGE' | translate }}
                  </span>
                </div>

                <div class="visual-stage__canvas">
                  <div class="visual-card visual-card--overview glass">
                    <div class="visual-card__topline">
                      <span>{{ 'LANDING.VISUAL_PANEL_TITLE' | translate }}</span>
                      <span class="visual-chip">Live</span>
                    </div>
                    <div class="visual-chart" aria-hidden="true">
                      <span class="visual-chart__bar"></span>
                      <span class="visual-chart__bar"></span>
                      <span class="visual-chart__bar"></span>
                      <span class="visual-chart__bar"></span>
                    </div>
                    <div class="visual-card__stats">
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

                  <div class="student-frame">
                    <img src="assets/landing-student-photo.jpg" alt="Etudiante EduFlow" />
                    <div class="student-frame__shade"></div>
                  </div>

                  <article class="floating-card floating-card--session glass">
                    <div class="floating-card__icon" [innerHTML]="APP_ICONS.calendarCheck"></div>
                    <div>
                      <h3>{{ 'LANDING.VIDEO_CARD_TITLE' | translate }}</h3>
                      <p>{{ 'LANDING.VIDEO_CARD_SUBTITLE' | translate }}</p>
                    </div>
                  </article>

                  <article class="floating-card floating-card--focus glass">
                    <div class="floating-card__eyebrow">{{ 'LANDING.FLOATING_CARD_TITLE' | translate }}</div>
                    <strong>{{ 'LANDING.FLOATING_CARD_VALUE' | translate }}</strong>
                    <p>{{ 'LANDING.FLOATING_CARD_HINT' | translate }}</p>
                  </article>

                  <article class="floating-card floating-card--signals glass">
                    @for (signal of quickSignals; track signal.titleKey) {
                      <div class="signal-line">
                        <span class="signal-line__icon" [innerHTML]="signal.icon"></span>
                        <div>
                          <strong>{{ signal.titleKey | translate }}</strong>
                          <span>{{ signal.descKey | translate }}</span>
                        </div>
                      </div>
                    }
                  </article>
                </div>
              </div>
            </div>
          </section>

          <section id="overview" class="section">
            <div class="section-heading">
              <span class="section-kicker">{{ 'LANDING.STATS_KICKER' | translate }}</span>
              <h2>{{ 'LANDING.STATS_TITLE' | translate }}</h2>
              <p>{{ 'LANDING.STATS_SUBTITLE' | translate }}</p>
            </div>

            <div class="overview-grid">
              <article class="overview-card glass">
                <div class="overview-card__copy">
                  <span class="section-kicker section-kicker--soft">{{ 'LANDING.FEATURE_STORY_BADGE' | translate }}</span>
                  <h3>{{ 'LANDING.FEATURE_STORY_TITLE' | translate }}</h3>
                  <p>{{ 'LANDING.FEATURE_STORY_SUBTITLE' | translate }}</p>
                </div>

                <div class="overview-card__list">
                  @for (story of storyItems; track story.titleKey) {
                    <div class="story-item">
                      <span class="story-item__icon" [innerHTML]="story.icon"></span>
                      <div>
                        <strong>{{ story.titleKey | translate }}</strong>
                        <p>{{ story.descKey | translate }}</p>
                      </div>
                    </div>
                  }
                </div>
              </article>

              <div class="stats-grid">
                @for (stat of overviewStats; track stat.labelKey) {
                  <article class="stat-card glass">
                    <div class="stat-card__accent" [style.background]="stat.accent"></div>
                    <strong>{{ stat.value }}</strong>
                    <span>{{ stat.labelKey | translate }}</span>
                  </article>
                }
              </div>
            </div>
          </section>

          <section id="features" class="section">
            <div class="section-heading section-heading--center">
              <span class="section-kicker">{{ 'LANDING.FEATURES_TITLE' | translate }}</span>
              <h2>{{ 'LANDING.FEATURES_SUBTITLE' | translate }}</h2>
            </div>

            <div class="feature-layout">
              <div class="feature-grid">
                @for (feature of featureCards; track feature.titleKey) {
                  <article class="feature-card glass">
                    <div class="feature-card__head">
                      <span class="feature-card__icon" [innerHTML]="feature.icon"></span>
                      <span class="feature-card__chip">{{ feature.chipKey | translate }}</span>
                    </div>
                    <h3>{{ feature.titleKey | translate }}</h3>
                    <p>{{ feature.descKey | translate }}</p>
                  </article>
                }
              </div>

              <article class="feature-story glass">
                <div class="feature-story__badge">{{ 'LANDING.FEATURE_STORY_BADGE' | translate }}</div>
                <h3>{{ 'LANDING.FEATURE_STORY_TITLE' | translate }}</h3>
                <p>{{ 'LANDING.FEATURE_STORY_SUBTITLE' | translate }}</p>

                <div class="feature-story__lines">
                  @for (story of storyItems; track story.titleKey) {
                    <div class="feature-story__line">
                      <span class="feature-story__line-icon" [innerHTML]="story.icon"></span>
                      <div>
                        <strong>{{ story.titleKey | translate }}</strong>
                        <span>{{ story.descKey | translate }}</span>
                      </div>
                    </div>
                  }
                </div>
              </article>
            </div>
          </section>

          <section id="journey" class="section">
            <div class="section-heading section-heading--center">
              <span class="section-kicker">{{ 'LANDING.JOURNEY_KICKER' | translate }}</span>
              <h2>{{ 'LANDING.JOURNEY_TITLE' | translate }}</h2>
              <p>{{ 'LANDING.JOURNEY_SUBTITLE' | translate }}</p>
            </div>

            <div class="journey-layout">
              <div class="journey-grid">
                @for (step of journeySteps; track step.titleKey) {
                  <article class="journey-card glass">
                    <span class="journey-card__icon" [innerHTML]="step.icon"></span>
                    <h3>{{ step.titleKey | translate }}</h3>
                    <p>{{ step.descKey | translate }}</p>
                  </article>
                }
              </div>

              <article class="timeline-card glass">
                <div class="timeline-card__header">
                  <span class="timeline-card__badge">{{ 'LANDING.TIMELINE_BADGE' | translate }}</span>
                  <h3>{{ 'LANDING.TIMELINE_TITLE' | translate }}</h3>
                </div>

                <div class="timeline-list">
                  @for (item of timelineItems; track item.titleKey) {
                    <div class="timeline-item">
                      <span class="timeline-item__icon" [innerHTML]="item.icon"></span>
                      <div>
                        <strong>{{ item.titleKey | translate }}</strong>
                        <p>{{ item.descKey | translate }}</p>
                      </div>
                    </div>
                  }
                </div>
              </article>
            </div>
          </section>

          <section class="cta-section glass">
            <div class="cta-section__copy">
              <h2>{{ 'LANDING.CTA_TITLE' | translate }}</h2>
              <p>{{ 'LANDING.CTA_SUBTITLE' | translate }}</p>
            </div>
            <a class="btn btn-primary btn-lg" routerLink="/login">
              {{ 'LANDING.GET_STARTED' | translate }}
            </a>
          </section>

          <footer class="footer">
            <span>&copy; 2026 EduFlow. {{ 'APP.TAGLINE' | translate }}</span>
          </footer>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 34%),
        radial-gradient(circle at top right, rgba(45, 212, 191, 0.12), transparent 28%),
        linear-gradient(180deg, #090913 0%, #0c0d18 42%, #090912 100%);
      color: rgba(244, 247, 255, 0.96);
    }

    .landing {
      position: relative;
      overflow: clip;
      min-height: 100vh;
    }

    .landing__grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 72px 72px;
      mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 88%);
      pointer-events: none;
    }

    .landing__glow {
      position: absolute;
      border-radius: 999px;
      filter: blur(70px);
      opacity: 0.55;
      pointer-events: none;
    }

    .landing__glow--violet {
      top: 40px;
      left: -120px;
      width: 320px;
      height: 320px;
      background: rgba(124, 58, 237, 0.34);
    }

    .landing__glow--cyan {
      top: 280px;
      right: -80px;
      width: 280px;
      height: 280px;
      background: rgba(45, 212, 191, 0.2);
    }

    .landing__glow--orange {
      bottom: 160px;
      right: 12%;
      width: 200px;
      height: 200px;
      background: rgba(249, 115, 22, 0.18);
    }

    .landing__inner {
      position: relative;
      width: min(1200px, calc(100% - 32px));
      margin: 0 auto;
      padding: 18px 0 40px;
    }

    .nav {
      position: sticky;
      top: 18px;
      z-index: 90;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 18px;
      padding: 14px 18px;
      margin-bottom: 34px;
      border-radius: 28px;
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.86), rgba(17, 24, 39, 0.7));
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 22px 50px rgba(0, 0, 0, 0.34);
    }

    .nav__brand {
      display: inline-flex;
      align-items: center;
      min-width: fit-content;
    }

    .nav__links {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 6px;
      min-height: 64px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .nav__link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 50px;
      padding: 0 18px;
      border-radius: 18px;
      border: 1px solid transparent;
      background: transparent;
      color: rgba(240, 244, 255, 0.84);
      font: inherit;
      font-family: var(--font-display);
      font-size: 0.96rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        color 180ms ease,
        border-color 180ms ease,
        background 180ms ease,
        transform 180ms ease,
        box-shadow 180ms ease;
    }

    .nav__link:hover,
    .nav__link:focus-visible {
      color: #ffffff;
      border-color: rgba(129, 140, 248, 0.22);
      background: rgba(99, 102, 241, 0.08);
      transform: translateY(-1px);
      outline: none;
    }

    .nav__link.is-active {
      color: #ffffff;
      background:
        linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(59, 130, 246, 0.1)),
        rgba(255, 255, 255, 0.05);
      border-color: rgba(129, 140, 248, 0.32);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 16px 28px rgba(37, 99, 235, 0.18);
    }

    .nav__icon,
    .hero-point__icon,
    .feature-card__icon,
    .feature-story__line-icon,
    .story-item__icon,
    .journey-card__icon,
    .timeline-item__icon,
    .floating-card__icon,
    .signal-line__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 14px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(243, 247, 255, 0.92);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .nav__icon {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 12px;
      padding: 7px;
      background:
        radial-gradient(circle at 30% 30%, rgba(129, 140, 248, 0.24), transparent 68%),
        rgba(255, 255, 255, 0.05);
      border-color: rgba(129, 140, 248, 0.14);
    }

    .nav__link.is-active .nav__icon {
      background:
        radial-gradient(circle at 30% 30%, rgba(129, 140, 248, 0.34), transparent 68%),
        linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(56, 189, 248, 0.08));
      border-color: rgba(129, 140, 248, 0.24);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.06),
        0 12px 22px rgba(37, 99, 235, 0.18);
    }

    .nav__icon :is(svg),
    .hero-point__icon :is(svg),
    .feature-card__icon :is(svg),
    .feature-story__line-icon :is(svg),
    .story-item__icon :is(svg),
    .journey-card__icon :is(svg),
    .timeline-item__icon :is(svg),
    .floating-card__icon :is(svg),
    .signal-line__icon :is(svg) {
      width: 100%;
      height: 100%;
      display: block;
    }

    .nav__actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      min-width: fit-content;
    }

    .nav__cta {
      min-height: 40px;
      padding-inline: 18px;
      border-radius: 14px;
      font-size: 0.88rem;
    }

    .landing__content {
      display: grid;
      gap: 72px;
    }

    .hero,
    .section {
      position: relative;
      scroll-margin-top: 112px;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.03fr) minmax(0, 0.97fr);
      align-items: center;
      gap: 40px;
      min-height: 700px;
      padding: 18px 0 12px;
    }

    .hero__copy {
      display: grid;
      gap: 22px;
      align-content: center;
      max-width: 560px;
    }

    .eyebrow,
    .section-kicker,
    .feature-story__badge,
    .timeline-card__badge,
    .visual-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      min-height: 34px;
      padding: 0 14px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(197, 205, 255, 0.86);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .section-kicker--soft {
      margin-bottom: 14px;
    }

    .hero__title {
      font-size: clamp(3rem, 5vw, 4.7rem);
      line-height: 0.94;
      letter-spacing: -0.055em;
      max-width: 10ch;
      text-wrap: balance;
    }

    .hero__subtitle,
    .section-heading p,
    .feature-card p,
    .feature-story p,
    .journey-card p,
    .timeline-item p,
    .cta-section p,
    .floating-card p,
    .overview-card p,
    .story-item p,
    .signal-line span,
    .proof-strip__item span {
      color: rgba(224, 231, 255, 0.7);
    }

    .hero__subtitle {
      max-width: 54ch;
      font-size: 1.05rem;
      line-height: 1.8;
    }

    .hero-points {
      display: grid;
      gap: 14px;
      list-style: none;
    }

    .hero-point {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 1rem;
      color: rgba(244, 247, 255, 0.92);
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      padding-top: 4px;
    }

    .proof-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      padding: 18px 20px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.74), rgba(17, 24, 39, 0.44));
    }

    .proof-strip__item {
      display: grid;
      gap: 6px;
      min-width: 0;
    }

    .proof-strip__item strong,
    .stat-card strong {
      font-family: var(--font-display);
      font-size: clamp(1.6rem, 3vw, 2.4rem);
      line-height: 1;
      color: #ffffff;
    }

    .hero__visual {
      position: relative;
      min-height: 620px;
      display: grid;
      align-items: center;
    }

    .hero__halo {
      position: absolute;
      border-radius: 999px;
      filter: blur(56px);
      pointer-events: none;
    }

    .hero__halo--indigo {
      inset: auto auto 12% 10%;
      width: 220px;
      height: 220px;
      background: rgba(99, 102, 241, 0.26);
    }

    .hero__halo--cyan {
      inset: 10% 8% auto auto;
      width: 180px;
      height: 180px;
      background: rgba(45, 212, 191, 0.2);
    }

    .visual-stage {
      position: relative;
      min-height: 620px;
      padding: 28px;
      border-radius: 34px;
      background: linear-gradient(155deg, rgba(17, 24, 39, 0.78), rgba(15, 23, 42, 0.54));
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.35);
      overflow: hidden;
    }

    .visual-stage__header {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }

    .visual-stage__label {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: rgba(245, 248, 255, 0.92);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      min-height: 36px;
      padding: 0 14px;
      border-radius: 999px;
      background: rgba(12, 18, 30, 0.76);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(244, 247, 255, 0.92);
      font-weight: 600;
    }

    .status-pill__dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: linear-gradient(135deg, #2dd4bf, #38bdf8);
      box-shadow: 0 0 0 6px rgba(45, 212, 191, 0.12);
    }

    .visual-stage__canvas {
      position: relative;
      min-height: 520px;
    }

    .student-frame {
      position: absolute;
      inset: 78px 68px 20px auto;
      width: min(58%, 360px);
      min-width: 290px;
      border-radius: 34px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.34);
    }

    .student-frame img {
      width: 100%;
      height: 100%;
      min-height: 460px;
      object-fit: cover;
      object-position: center 16%;
      display: block;
    }

    .student-frame__shade {
      position: absolute;
      inset: auto 0 0 0;
      height: 42%;
      background: linear-gradient(180deg, transparent, rgba(10, 12, 22, 0.48));
      pointer-events: none;
    }

    .visual-card,
    .floating-card {
      position: absolute;
      z-index: 2;
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.88), rgba(15, 23, 42, 0.72));
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.28);
    }

    .visual-card--overview {
      top: 18px;
      left: 0;
      width: min(46%, 250px);
      padding: 18px;
      border-radius: 24px;
    }

    .visual-card__topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
      font-size: 0.82rem;
      color: rgba(224, 231, 255, 0.72);
    }

    .visual-chart {
      display: flex;
      align-items: end;
      gap: 10px;
      height: 74px;
      margin-bottom: 18px;
    }

    .visual-chart__bar {
      flex: 1;
      border-radius: 999px 999px 8px 8px;
      background: linear-gradient(180deg, rgba(56, 189, 248, 0.95), rgba(99, 102, 241, 0.72));
      box-shadow: 0 12px 26px rgba(37, 99, 235, 0.18);
    }

    .visual-chart__bar:nth-child(1) { height: 42%; }
    .visual-chart__bar:nth-child(2) { height: 68%; }
    .visual-chart__bar:nth-child(3) { height: 58%; }
    .visual-chart__bar:nth-child(4) { height: 92%; }

    .visual-card__stats {
      display: grid;
      gap: 14px;
    }

    .visual-card__stats div {
      display: grid;
      gap: 4px;
    }

    .visual-card__stats strong {
      font-size: 1.7rem;
      line-height: 1;
      color: #ffffff;
    }

    .visual-card__stats span {
      font-size: 0.82rem;
      color: rgba(224, 231, 255, 0.68);
    }

    .floating-card {
      border-radius: 24px;
    }

    .floating-card--session {
      top: 168px;
      right: 0;
      width: min(42%, 240px);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .floating-card--session h3,
    .floating-card--focus strong,
    .signal-line strong,
    .feature-card h3,
    .feature-story h3,
    .journey-card h3,
    .timeline-card h3,
    .overview-card h3,
    .story-item strong {
      color: #ffffff;
    }

    .floating-card--session h3 {
      font-size: 1rem;
      margin-bottom: 4px;
    }

    .floating-card--session p {
      font-size: 0.88rem;
      line-height: 1.55;
    }

    .floating-card--focus {
      left: 26px;
      bottom: 46px;
      width: min(42%, 240px);
      padding: 16px;
      display: grid;
      gap: 10px;
    }

    .floating-card__eyebrow {
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(196, 204, 255, 0.76);
    }

    .floating-card--focus strong {
      font-size: 1.25rem;
      line-height: 1.1;
    }

    .floating-card--signals {
      right: 48px;
      bottom: 24px;
      width: min(46%, 250px);
      padding: 14px;
      display: grid;
      gap: 12px;
    }

    .signal-line {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      align-items: center;
      gap: 12px;
    }

    .signal-line div {
      display: grid;
      gap: 4px;
    }

    .signal-line strong {
      font-size: 0.95rem;
    }

    .signal-line span {
      font-size: 0.82rem;
      line-height: 1.45;
    }

    .section {
      display: grid;
      gap: 28px;
    }

    .section-heading {
      display: grid;
      gap: 14px;
      max-width: 760px;
    }

    .section-heading--center {
      justify-items: center;
      text-align: center;
      margin-inline: auto;
    }

    .section-heading h2,
    .cta-section h2 {
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      line-height: 1.04;
      letter-spacing: -0.045em;
      text-wrap: balance;
    }

    .section-heading p,
    .cta-section p {
      font-size: 1rem;
      line-height: 1.75;
    }

    .overview-grid,
    .feature-layout,
    .journey-layout {
      display: grid;
      gap: 22px;
    }

    .overview-grid {
      grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
      align-items: stretch;
    }

    .overview-card,
    .feature-card,
    .feature-story,
    .journey-card,
    .timeline-card,
    .cta-section,
    .stat-card {
      border-radius: 28px;
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.76), rgba(15, 23, 42, 0.52));
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.24);
    }

    .overview-card {
      display: grid;
      gap: 26px;
      padding: 28px;
    }

    .overview-card__copy {
      max-width: 56ch;
    }

    .overview-card__copy h3 {
      font-size: 2rem;
      line-height: 1.06;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
      text-wrap: balance;
    }

    .overview-card__list {
      display: grid;
      gap: 16px;
    }

    .story-item {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      padding: 16px 18px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .story-item__icon {
      width: 28px;
      height: 28px;
      padding: 0;
      margin-top: 2px;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      color: rgba(167, 180, 255, 0.96);
    }

    .story-item div {
      display: grid;
      gap: 6px;
    }

    .story-item strong {
      font-size: 1rem;
    }

    .story-item p {
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 18px;
    }

    .stat-card {
      position: relative;
      min-height: 180px;
      padding: 24px;
      display: grid;
      align-content: end;
      gap: 10px;
      overflow: hidden;
    }

    .stat-card__accent {
      position: absolute;
      inset: 0 0 auto 0;
      height: 4px;
      opacity: 0.96;
    }

    .stat-card span {
      font-size: 0.95rem;
      color: rgba(224, 231, 255, 0.68);
    }

    .feature-layout {
      grid-template-columns: minmax(0, 1.06fr) minmax(320px, 0.94fr);
      align-items: stretch;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .feature-card {
      display: grid;
      gap: 18px;
      padding: 24px;
      min-height: 250px;
    }

    .feature-card__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .feature-card__chip {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(129, 140, 248, 0.18);
      color: rgba(198, 206, 255, 0.86);
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .feature-card h3 {
      font-size: 1.36rem;
      line-height: 1.08;
    }

    .feature-card p,
    .feature-story p,
    .journey-card p,
    .timeline-item p {
      font-size: 0.95rem;
      line-height: 1.7;
    }

    .feature-story {
      display: grid;
      gap: 18px;
      padding: 28px;
    }

    .feature-story h3 {
      font-size: 2rem;
      line-height: 1.05;
      letter-spacing: -0.03em;
      text-wrap: balance;
    }

    .feature-story__lines {
      display: grid;
      gap: 16px;
      margin-top: 6px;
    }

    .feature-story__line {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .feature-story__line:first-child {
      border-top: none;
      padding-top: 0;
    }

    .feature-story__line div {
      display: grid;
      gap: 5px;
    }

    .feature-story__line strong {
      font-size: 1rem;
      color: #ffffff;
    }

    .feature-story__line span {
      color: rgba(224, 231, 255, 0.68);
      line-height: 1.6;
    }

    .journey-layout {
      grid-template-columns: minmax(0, 1.02fr) minmax(320px, 0.98fr);
      align-items: stretch;
    }

    .journey-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .journey-card {
      display: grid;
      gap: 16px;
      padding: 24px;
      min-height: 220px;
      align-content: start;
    }

    .journey-card h3 {
      font-size: 1.24rem;
      line-height: 1.08;
    }

    .timeline-card {
      display: grid;
      gap: 22px;
      padding: 28px;
    }

    .timeline-card__header {
      display: grid;
      gap: 14px;
    }

    .timeline-list {
      display: grid;
      gap: 16px;
    }

    .timeline-item {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      padding: 16px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .timeline-item:first-child {
      border-top: none;
      padding-top: 0;
    }

    .timeline-item div {
      display: grid;
      gap: 5px;
    }

    .cta-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 32px;
      margin-top: -8px;
    }

    .cta-section__copy {
      max-width: 640px;
    }

    .footer {
      padding: 8px 0 0;
      text-align: center;
      color: rgba(224, 231, 255, 0.48);
      font-size: 0.88rem;
    }

    @media (max-width: 1140px) {
      .nav {
        grid-template-columns: 1fr;
        justify-items: stretch;
      }

      .nav__brand,
      .nav__actions {
        justify-content: space-between;
      }

      .hero,
      .overview-grid,
      .feature-layout,
      .journey-layout {
        grid-template-columns: 1fr;
      }

      .hero {
        gap: 28px;
        min-height: auto;
      }

      .hero__copy {
        max-width: none;
      }

      .hero__visual {
        min-height: 580px;
      }

      .stats-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 860px) {
      .landing__inner {
        width: min(100% - 20px, 1200px);
        padding-top: 10px;
      }

      .nav {
        top: 10px;
        gap: 14px;
        padding: 14px;
        border-radius: 24px;
      }

      .nav__brand,
      .nav__actions {
        flex-wrap: wrap;
      }

      .nav__links {
        justify-content: stretch;
      }

      .nav__link {
        flex: 1 1 calc(50% - 10px);
      }

      .landing__content {
        gap: 56px;
      }

      .hero__title {
        max-width: 12ch;
      }

      .proof-strip,
      .stats-grid,
      .feature-grid,
      .journey-grid {
        grid-template-columns: 1fr;
      }

      .visual-stage {
        min-height: 700px;
      }

      .student-frame {
        inset: 120px 24px auto 24px;
        width: auto;
        min-width: 0;
      }

      .student-frame img {
        min-height: 420px;
        max-height: 470px;
      }

      .visual-card--overview {
        top: 18px;
        left: 18px;
        width: calc(100% - 36px);
      }

      .floating-card--session,
      .floating-card--focus,
      .floating-card--signals {
        width: calc(100% - 36px);
        left: 18px;
        right: 18px;
      }

      .floating-card--session {
        top: auto;
        bottom: 218px;
      }

      .floating-card--signals {
        bottom: 18px;
      }

      .floating-card--focus {
        bottom: 132px;
      }

      .cta-section {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    @media (max-width: 560px) {
      .nav__actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
      }

      .nav__cta {
        width: 100%;
        justify-content: center;
      }

      .nav__link {
        min-width: 0;
        flex-basis: 100%;
      }

      .hero {
        padding-top: 6px;
      }

      .hero__title,
      .section-heading h2,
      .cta-section h2,
      .overview-card__copy h3,
      .feature-story h3 {
        font-size: clamp(2rem, 11vw, 2.75rem);
      }

      .hero__subtitle,
      .section-heading p,
      .feature-card p,
      .feature-story p,
      .journey-card p,
      .timeline-item p,
      .cta-section p {
        font-size: 0.96rem;
      }

      .visual-stage {
        padding: 18px;
        min-height: 760px;
      }

      .student-frame {
        inset: 126px 12px auto 12px;
        border-radius: 28px;
      }

      .floating-card--session,
      .floating-card--focus,
      .floating-card--signals,
      .visual-card--overview {
        left: 12px;
        right: 12px;
        width: auto;
      }

      .floating-card--session {
        bottom: 230px;
      }

      .floating-card--focus {
        bottom: 144px;
      }

      .overview-card,
      .feature-card,
      .feature-story,
      .journey-card,
      .timeline-card,
      .cta-section,
      .stat-card {
        padding: 22px;
        border-radius: 24px;
      }
    }
  `],
})
export class LandingPageComponent implements AfterViewInit {
  readonly APP_ICONS = APP_ICONS;

  readonly navItems: ReadonlyArray<{ id: string; labelKey: string; icon: SafeHtml }>;

  readonly heroPoints = [
    { key: 'LANDING.HERO_POINT_PERSONALIZED', icon: APP_ICONS.profile },
    { key: 'LANDING.HERO_POINT_TRACKING', icon: APP_ICONS.calendarCheck },
    { key: 'LANDING.HERO_POINT_COLLAB', icon: APP_ICONS.users },
  ] as const;

  readonly proofStats = [
    { value: '98%', labelKey: 'LANDING.PROOF_SATISFACTION' },
    { value: '3x', labelKey: 'LANDING.PROOF_SPEED' },
    { value: '24h', labelKey: 'LANDING.PROOF_ONBOARDING' },
  ] as const;

  readonly quickSignals = [
    { icon: APP_ICONS.activity, titleKey: 'LANDING.STEP_GUIDE', descKey: 'LANDING.STEP_GUIDE_DESC' },
    { icon: APP_ICONS.checkCircle, titleKey: 'LANDING.STEP_GROW', descKey: 'LANDING.STEP_GROW_DESC' },
  ] as const;

  readonly overviewStats = [
    { value: '12k+', labelKey: 'LANDING.STAT_STUDENTS', accent: 'linear-gradient(90deg, #6366f1, #8b5cf6)' },
    { value: '94%', labelKey: 'LANDING.STAT_COMPLETION', accent: 'linear-gradient(90deg, #2dd4bf, #38bdf8)' },
    { value: '24/7', labelKey: 'LANDING.STAT_SUPPORT', accent: 'linear-gradient(90deg, #f97316, #fbbf24)' },
  ] as const;

  readonly featureCards = [
    {
      icon: APP_ICONS.chart,
      chipKey: 'LANDING.FEATURE_CHIP_ANALYTICS',
      titleKey: 'LANDING.FEATURE_ANALYTICS',
      descKey: 'LANDING.FEATURE_ANALYTICS_DESC',
    },
    {
      icon: APP_ICONS.sparkles,
      chipKey: 'LANDING.FEATURE_CHIP_AI',
      titleKey: 'LANDING.FEATURE_AI',
      descKey: 'LANDING.FEATURE_AI_DESC',
    },
    {
      icon: APP_ICONS.globe,
      chipKey: 'LANDING.FEATURE_CHIP_MULTILANG',
      titleKey: 'LANDING.FEATURE_MULTILANG',
      descKey: 'LANDING.FEATURE_MULTILANG_DESC',
    },
    {
      icon: APP_ICONS.target,
      chipKey: 'LANDING.FEATURE_CHIP_EXPERIENCE',
      titleKey: 'LANDING.FEATURE_EXPERIENCE',
      descKey: 'LANDING.FEATURE_EXPERIENCE_DESC',
    },
  ] as const;

  readonly storyItems = [
    { icon: APP_ICONS.graduation, titleKey: 'LANDING.STORY_ONE_TITLE', descKey: 'LANDING.STORY_ONE_DESC' },
    { icon: APP_ICONS.users, titleKey: 'LANDING.STORY_TWO_TITLE', descKey: 'LANDING.STORY_TWO_DESC' },
    { icon: APP_ICONS.message, titleKey: 'LANDING.STORY_THREE_TITLE', descKey: 'LANDING.STORY_THREE_DESC' },
  ] as const;

  readonly journeySteps = [
    { icon: APP_ICONS.lock, titleKey: 'LANDING.STEP_PLAN', descKey: 'LANDING.STEP_PLAN_DESC' },
    { icon: APP_ICONS.activity, titleKey: 'LANDING.STEP_GUIDE', descKey: 'LANDING.STEP_GUIDE_DESC' },
    { icon: APP_ICONS.checkBadge, titleKey: 'LANDING.STEP_GROW', descKey: 'LANDING.STEP_GROW_DESC' },
  ] as const;

  readonly timelineItems = [
    { icon: APP_ICONS.key, titleKey: 'LANDING.TIMELINE_ITEM_ONE_TITLE', descKey: 'LANDING.TIMELINE_ITEM_ONE_DESC' },
    { icon: APP_ICONS.calendarCheck, titleKey: 'LANDING.TIMELINE_ITEM_TWO_TITLE', descKey: 'LANDING.TIMELINE_ITEM_TWO_DESC' },
    { icon: APP_ICONS.document, titleKey: 'LANDING.TIMELINE_ITEM_THREE_TITLE', descKey: 'LANDING.TIMELINE_ITEM_THREE_DESC' },
  ] as const;

  readonly activeSection = signal<string>('home');

  constructor(private readonly sanitizer: DomSanitizer) {
    this.navItems = [
      { id: 'home', labelKey: 'LANDING.NAV_HOME', icon: this.toSafeIcon(APP_ICONS.navHome) },
      { id: 'overview', labelKey: 'LANDING.NAV_COMMUNITY', icon: this.toSafeIcon(APP_ICONS.navOverview) },
      { id: 'features', labelKey: 'LANDING.NAV_FEATURES', icon: this.toSafeIcon(APP_ICONS.navFeatures) },
      { id: 'journey', labelKey: 'LANDING.NAV_JOURNEY', icon: this.toSafeIcon(APP_ICONS.navJourney) },
    ];
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateActiveSection());
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateActiveSection();
  }

  scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private updateActiveSection(): void {
    const sectionIds = this.navItems.map((item) => item.id);
    let current = sectionIds[0];

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (!element) continue;

      const top = element.getBoundingClientRect().top;
      if (top <= 160) {
        current = id;
      }
    }

    this.activeSection.set(current);
  }

  private toSafeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
