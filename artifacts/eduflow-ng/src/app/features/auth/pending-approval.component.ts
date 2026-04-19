import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="pending-shell">
      <article class="card">
        <h1>Compte en attente</h1>
        <p>
          Votre demande est bien enregistrée. Votre compte reste en attente jusqu'à validation par un administrateur.
        </p>
        <p class="muted">Vous recevrez un email d'acceptation ou de refus.</p>
        <button class="btn" (click)="logout()">Se déconnecter</button>
        <a routerLink="/" class="link">Retour à l'accueil</a>
      </article>
    </section>
  `,
  styles: [`
    .pending-shell { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #0b1020; }
    .card { max-width: 560px; width: 100%; background: #111827; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 28px; color: #e5e7eb; text-align: center; }
    h1 { margin: 0 0 12px; }
    p { margin: 0 0 10px; line-height: 1.5; }
    .muted { color: #9ca3af; }
    .btn { margin-top: 10px; width: 100%; border: none; border-radius: 10px; padding: 12px; font-weight: 700; background: #6366f1; color: #fff; cursor: pointer; }
    .link { display: inline-block; margin-top: 12px; color: #c4b5fd; text-decoration: none; }
  `]
})
export class PendingApprovalComponent {
  private auth = inject(AuthService);

  logout(): void {
    this.auth.logout().subscribe();
  }
}
