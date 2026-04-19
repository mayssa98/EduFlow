import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-onboarding-final',
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

      <div class="final-card fade-up">
        <div class="step-indicator">
          <div class="step done"></div>
          <div class="step done"></div>
          <div class="step active"></div>
        </div>

        <!-- Confetti animation -->
        <div class="confetti-container">
          <div class="confetti" *ngFor="let c of confetti" [style.left]="c.x" [style.animationDelay]="c.d" [style.background]="c.color"></div>
        </div>

        <div class="success-check">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="url(#cg)" stroke-width="3" fill="rgba(34,197,94,0.08)"/>
            <defs><linearGradient id="cg" x1="0" y1="0" x2="64" y2="64">
              <stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#86efac"/>
            </linearGradient></defs>
            <path d="M20 32l8 8 16-18" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" class="check-anim"/>
          </svg>
        </div>

        <h1>Bienvenue, {{ userName }} !</h1>
        <p class="muted">
          Votre compte est maintenant <strong class="active-text">entièrement activé</strong>.<br/>
          Vous êtes prêt(e) à explorer EduFlow !
        </p>

        <div class="info-summary" *ngIf="niveau || specialite">
          <div class="summary-item" *ngIf="niveau">
            <span class="label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:3px"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              Niveau
            </span>
            <span class="value">{{ niveau }}</span>
          </div>
          <div class="summary-item" *ngIf="specialite">
            <span class="label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:3px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              Spécialité
            </span>
            <span class="value">{{ specialite }}</span>
          </div>
        </div>

        <button class="btn-dashboard" (click)="goToDashboard()">
          Accéder à mon espace
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { --bg: #0d0d1a; --card: #1a1a2e; --text: #e2e8f0; --muted: #94a3b8; --primary: #6366f1; display: block; }

    .onboard-shell {
      min-height: 100vh; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 20px;
      background:
        radial-gradient(circle at 15% 25%, rgba(34,197,94,0.08), transparent 40%),
        radial-gradient(circle at 85% 75%, rgba(99,102,241,0.08), transparent 40%),
        var(--bg);
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .topbar { width: 100%; max-width: 600px; }
    .brand { display: flex; align-items: center; gap: 8px; color: var(--text); font-weight: 700; text-decoration: none; }
    .brand-logo { width: 32px; height: 32px; border-radius: 8px; }

    .final-card {
      width: 100%; max-width: 520px; position: relative; overflow: hidden;
      background: var(--card); border: 1px solid rgba(34,197,94,0.2);
      border-radius: 24px; padding: 40px;
      display: flex; flex-direction: column; align-items: center; gap: 20px;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .step-indicator { display: flex; gap: 8px; z-index: 2; }
    .step { width: 32px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); }
    .step.active { background: #22c55e; }
    .step.done { background: #22c55e; }

    .confetti-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
    .confetti {
      position: absolute; top: -10px; width: 8px; height: 8px; border-radius: 2px;
      animation: fall 3s ease-in forwards;
    }
    @keyframes fall {
      to { transform: translateY(500px) rotate(720deg); opacity: 0; }
    }

    .success-check { z-index: 2; animation: popIn 0.6s ease-out both 0.2s; }
    @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .check-anim { stroke-dasharray: 44; stroke-dashoffset: 44; animation: draw 0.8s ease-out forwards 0.6s; }
    @keyframes draw { to { stroke-dashoffset: 0; } }

    h1 { color: var(--text); font-size: 1.4rem; margin: 0; z-index: 2; }
    .muted { color: var(--muted); font-size: 0.9rem; line-height: 1.6; margin: 0; z-index: 2; }
    .active-text { color: #86efac; }

    .info-summary {
      display: flex; gap: 16px; width: 100%; z-index: 2;
      background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.12);
      border-radius: 14px; padding: 16px;
    }
    .summary-item { display: flex; flex-direction: column; gap: 4px; flex: 1; text-align: left; }
    .label { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
    .value { font-size: 0.92rem; color: var(--text); font-weight: 700; }

    .btn-dashboard {
      display: flex; align-items: center; gap: 8px; z-index: 2;
      background: linear-gradient(135deg, #22c55e, #16a34a); color: white;
      border: none; padding: 14px 32px; border-radius: 12px;
      font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
    }
    .btn-dashboard:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,197,94,0.35); }

    .fade-up { animation: fadeUp 0.5s ease-out both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class OnboardingFinalComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  confetti: { x: string; d: string; color: string }[] = [];
  niveau = '';
  specialite = '';

  get userName(): string {
    return this.auth.user()?.prenom || 'Utilisateur';
  }

  ngOnInit(): void {
    // Generate confetti
    const colors = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
    this.confetti = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100 + '%',
      d: Math.random() * 2 + 's',
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Load saved profile
    this.niveau = localStorage.getItem('eduflow.onboarding.niveau') || '';
    this.specialite = localStorage.getItem('eduflow.onboarding.specialite') || '';
  }

  goToDashboard(): void {
    const role = this.auth.user()?.role;
    this.router.navigateByUrl(this.auth.defaultRouteForRole(role ?? null));
  }
}
