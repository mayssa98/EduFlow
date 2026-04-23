import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-onboarding-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="onboard-shell">
      <div class="topbar">
        <a routerLink="/" class="brand">
          <img src="assets/logo.png" alt="EduFlow" class="brand-logo" />
          <span>EduFlow</span>
        </a>
      </div>

      <div class="welcome-card fade-up">
        <div class="step-indicator">
          <div class="step active"></div>
          <div class="step"></div>
          <div class="step"></div>
        </div>

        <div class="party-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
          </svg>
        </div>

        <h1>Bienvenue sur EduFlow, {{ userName }} !</h1>
        <p class="muted">
          Votre compte a ete approuve par l'administrateur. Vous etes maintenant membre de la communaute EduFlow.
        </p>

        <div class="welcome-panel">
          <div class="welcome-row">
            <span class="welcome-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
              </svg>
            </span>
            <div>
              <strong>Profil academique</strong>
              <p>Indiquez votre niveau et votre specialite pour personnaliser votre espace.</p>
            </div>
          </div>

          <div class="welcome-row">
            <span class="welcome-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M12 4h9"/>
                <path d="M4 9h16"/>
                <path d="M4 15h16"/>
              </svg>
            </span>
            <div>
              <strong>Configuration rapide</strong>
              <p>Cette etape prend quelques secondes avant d'acceder a votre environnement complet.</p>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn-skip" (click)="skip()">Ignorer</button>
          <button class="btn-continue" (click)="next()">
            Continuer
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg: #0d0d1a;
      --card: #1a1a2e;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --primary: #6366f1;
      display: block;
    }

    .onboard-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 20px;
      background:
        radial-gradient(circle at 15% 25%, rgba(99,102,241,0.12), transparent 40%),
        radial-gradient(circle at 85% 75%, rgba(139,92,246,0.08), transparent 40%),
        var(--bg);
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .topbar {
      width: 100%;
      max-width: 600px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-weight: 700;
      text-decoration: none;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .welcome-card {
      width: 100%;
      max-width: 540px;
      background: var(--card);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 24px;
      padding: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .step-indicator {
      display: flex;
      gap: 8px;
    }

    .step {
      width: 32px;
      height: 4px;
      border-radius: 2px;
      background: rgba(255,255,255,0.1);
    }

    .step.active {
      background: var(--primary);
    }

    .party-icon {
      font-size: 3rem;
      animation: bounce 1s ease-in-out infinite alternate;
    }

    @keyframes bounce {
      from { transform: scale(1); }
      to { transform: scale(1.15); }
    }

    h1 {
      color: var(--text);
      font-size: 1.4rem;
      margin: 0;
    }

    .muted {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
    }

    .welcome-panel {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
      background: rgba(99,102,241,0.04);
      border: 1px solid rgba(99,102,241,0.12);
      border-radius: 18px;
      padding: 20px;
    }

    .welcome-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 15px;
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
    }

    .welcome-icon {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: #a5b4fc;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
    }

    .welcome-row strong {
      display: block;
      color: var(--text);
      font-size: 0.94rem;
      margin-bottom: 4px;
    }

    .welcome-row p {
      margin: 0;
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 12px;
      width: 100%;
      justify-content: flex-end;
    }

    .btn-skip {
      background: none;
      border: 1px solid rgba(255,255,255,0.12);
      color: var(--muted);
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-skip:hover {
      border-color: rgba(255,255,255,0.25);
      color: var(--text);
    }

    .btn-continue {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-continue:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99,102,241,0.4);
    }

    .fade-up {
      animation: fadeUp 0.5s ease-out both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 560px) {
      .welcome-card {
        padding: 28px 20px;
      }

      .actions {
        flex-direction: column-reverse;
      }

      .btn-skip,
      .btn-continue {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class OnboardingWelcomeComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  get userName(): string {
    return this.auth.user()?.prenom || 'Utilisateur';
  }

  skip(): void {
    localStorage.removeItem('eduflow.onboarding.discovery');
    localStorage.removeItem('eduflow.onboarding.discoveryOther');
    this.router.navigateByUrl('/onboarding/profile');
  }

  next(): void {
    localStorage.removeItem('eduflow.onboarding.discovery');
    localStorage.removeItem('eduflow.onboarding.discoveryOther');
    this.router.navigateByUrl('/onboarding/profile');
  }
}
