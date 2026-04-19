import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
          Votre compte a été approuvé par l'administrateur. Vous êtes maintenant membre de la communauté EduFlow !
        </p>

        <div class="social-section">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" style="vertical-align:-3px;margin-right:6px"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
            Retrouvez-nous sur nos réseaux sociaux
          </h3>
          <div class="social-grid">
            <a href="https://facebook.com" target="_blank" rel="noopener" class="social-link facebook">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              <span>Facebook</span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener" class="social-link instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              <span>Instagram</span>
            </a>
            <a href="https://x.com" target="_blank" rel="noopener" class="social-link twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>X (Twitter)</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener" class="social-link linkedin">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        <div class="actions">
          <button class="btn-skip" (click)="skip()">Ignorer</button>
          <button class="btn-continue" (click)="next()">
            Continuer
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg: #0d0d1a; --card: #1a1a2e; --text: #e2e8f0; --muted: #94a3b8; --primary: #6366f1;
      display: block;
    }

    .onboard-shell {
      min-height: 100vh;
      display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 20px;
      background:
        radial-gradient(circle at 15% 25%, rgba(99,102,241,0.12), transparent 40%),
        radial-gradient(circle at 85% 75%, rgba(139,92,246,0.08), transparent 40%),
        var(--bg);
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .topbar { width: 100%; max-width: 600px; }
    .brand { display: flex; align-items: center; gap: 8px; color: var(--text); font-weight: 700; text-decoration: none; }
    .brand-logo { width: 32px; height: 32px; border-radius: 8px; }

    .welcome-card {
      width: 100%; max-width: 540px;
      background: var(--card); border: 1px solid rgba(99,102,241,0.2);
      border-radius: 24px; padding: 36px;
      display: flex; flex-direction: column; align-items: center; gap: 20px;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .step-indicator { display: flex; gap: 8px; }
    .step { width: 32px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); }
    .step.active { background: var(--primary); }

    .party-icon { font-size: 3rem; animation: bounce 1s ease-in-out infinite alternate; }
    @keyframes bounce { from { transform: scale(1); } to { transform: scale(1.15); } }

    h1 { color: var(--text); font-size: 1.4rem; margin: 0; }
    .muted { color: var(--muted); font-size: 0.9rem; line-height: 1.6; margin: 0; }

    .social-section {
      width: 100%; text-align: left;
      background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.12);
      border-radius: 16px; padding: 20px;
    }
    .social-section h3 { color: var(--text); font-size: 0.95rem; margin: 0 0 14px; }

    .social-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    .social-link {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border-radius: 12px;
      text-decoration: none; font-size: 0.88rem; font-weight: 600;
      transition: all 0.2s; border: 1px solid transparent;
    }
    .social-link:hover { transform: translateY(-2px); }

    .facebook { background: rgba(59,89,152,0.12); color: #8b9dc3; border-color: rgba(59,89,152,0.25); }
    .facebook:hover { background: rgba(59,89,152,0.2); }
    .instagram { background: rgba(225,48,108,0.1); color: #e1306c; border-color: rgba(225,48,108,0.25); }
    .instagram:hover { background: rgba(225,48,108,0.18); }
    .twitter { background: rgba(255,255,255,0.06); color: #e2e8f0; border-color: rgba(255,255,255,0.12); }
    .twitter:hover { background: rgba(255,255,255,0.1); }
    .linkedin { background: rgba(0,119,181,0.1); color: #0a66c2; border-color: rgba(0,119,181,0.25); }
    .linkedin:hover { background: rgba(0,119,181,0.18); }

    .actions {
      display: flex; gap: 12px; width: 100%; justify-content: flex-end;
    }

    .btn-skip {
      background: none; border: 1px solid rgba(255,255,255,0.12); color: var(--muted);
      padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-skip:hover { border-color: rgba(255,255,255,0.25); color: var(--text); }

    .btn-continue {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
      border: none; padding: 10px 24px; border-radius: 10px;
      font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-continue:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }

    .fade-up { animation: fadeUp 0.5s ease-out both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 500px) { .social-grid { grid-template-columns: 1fr; } }
  `],
})
export class OnboardingWelcomeComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  get userName(): string {
    return this.auth.user()?.prenom || 'Utilisateur';
  }

  skip(): void { this.router.navigateByUrl('/onboarding/profile'); }
  next(): void { this.router.navigateByUrl('/onboarding/profile'); }
}
