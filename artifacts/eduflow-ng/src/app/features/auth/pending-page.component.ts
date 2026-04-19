import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-pending-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="pending-shell">
      <div class="topbar">
        <a routerLink="/" class="brand">
          <img src="assets/logo.png" alt="EduFlow" class="brand-logo" />
          <span>EduFlow</span>
        </a>
      </div>

      <div class="pending-card fade-up">
        <div class="hourglass-anim">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1>Compte en attente d'approbation</h1>
        <p class="muted">
          Votre inscription a été enregistrée avec succès !<br/>
          Un administrateur doit valider votre compte avant que vous puissiez accéder à la plateforme.
        </p>

        <div class="info-box">
          <div class="info-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <strong>Vous recevrez un email</strong>
            <p>Lorsque votre compte sera approuvé ou refusé, un email de notification vous sera envoyé.</p>
          </div>
        </div>

        <div class="status-box">
          <div class="pulse-dot"></div>
          <span>Vérification en cours…</span>
          <span class="refresh-hint">Vérification automatique chaque 30s</span>
        </div>

        <button class="btn-logout" (click)="logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Se déconnecter
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #6366f1;
      --bg: #0d0d1a;
      --card: #1a1a2e;
      --text: #e2e8f0;
      --muted: #94a3b8;
      display: block;
    }

    .pending-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 20px;
      background:
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.12), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08), transparent 40%),
        var(--bg);
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .topbar {
      width: 100%;
      max-width: 600px;
      display: flex;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
      font-weight: 700;
      text-decoration: none;
    }

    .pending-card {
      width: 100%;
      max-width: 520px;
      background: var(--card);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 24px;
      padding: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .hourglass-anim {
      font-size: 3.5rem;
      animation: sway 2s ease-in-out infinite;
    }

    @keyframes sway {
      0%, 100% { transform: rotate(-10deg); }
      50% { transform: rotate(10deg); }
    }

    h1 {
      color: var(--text);
      font-size: 1.45rem;
      margin: 0;
      line-height: 1.3;
    }

    .muted {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: rgba(99, 102, 241, 0.06);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 14px;
      padding: 16px;
      text-align: left;
      width: 100%;
    }

    .info-icon { margin-top: 2px; flex-shrink: 0; }
    .brand-logo { width: 32px; height: 32px; border-radius: 8px; }
    .info-box strong { color: var(--text); font-size: 0.88rem; }
    .info-box p { color: var(--muted); font-size: 0.82rem; margin: 4px 0 0; }

    .status-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      background: rgba(34, 197, 94, 0.06);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 12px;
      font-size: 0.88rem;
      color: #86efac;
      width: 100%;
      flex-wrap: wrap;
    }

    .pulse-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }

    .refresh-hint {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--muted);
    }

    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #fca5a5;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
    }

    .fade-up {
      animation: fadeUp 0.5s ease-out both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class PendingPageComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private pollSub?: Subscription;

  ngOnInit(): void {
    // Poll /auth/me every 30s to check if status changed
    this.pollSub = interval(30000).subscribe(() => {
      this.auth.bootstrap().subscribe(user => {
        if (user && user.statutCompte !== 'PENDING_APPROVAL' && user.statutCompte !== 'PENDING') {
          if (user.statutCompte === 'BLOCKED') {
            this.router.navigateByUrl('/auth');
          } else {
            this.router.navigateByUrl('/onboarding');
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/auth'));
  }
}
