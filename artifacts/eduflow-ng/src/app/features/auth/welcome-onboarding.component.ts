import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-welcome-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <section class="welcome-shell">
      <article class="card" *ngIf="step() === 1">
        <h1>{{ 'ONBOARDING.TITLE' | translate }}</h1>
        <p>{{ 'ONBOARDING.FIND_US' | translate }}</p>
        <ul>
          <li>{{ 'ONBOARDING.SITE' | translate }}: {{ links.site }}</li>
          <li>{{ 'ONBOARDING.FACEBOOK' | translate }}: {{ links.facebook }}</li>
          <li>{{ 'ONBOARDING.INSTAGRAM' | translate }}: {{ links.instagram }}</li>
          <li>{{ 'ONBOARDING.X' | translate }}: {{ links.x }}</li>
        </ul>
        <div class="actions">
          <button class="btn btn-ghost" (click)="goStep2()">{{ 'ONBOARDING.SKIP' | translate }}</button>
          <button class="btn" (click)="goStep2()">{{ 'ONBOARDING.CONTINUE' | translate }}</button>
        </div>
      </article>

      <article class="card" *ngIf="step() === 2">
        <h2>{{ 'ONBOARDING.LEVEL_SPECIALTY_TITLE' | translate }}</h2>
        <label for="niveau-select">{{ 'ONBOARDING.LEVEL' | translate }}</label>
        <select id="niveau-select" [(ngModel)]="niveau">
          <option *ngFor="let n of niveaux" [ngValue]="n">{{ n }}</option>
        </select>
        <input [placeholder]="'ONBOARDING.ADD_LEVEL' | translate" [(ngModel)]="customNiveau" [attr.aria-label]="'ONBOARDING.ADD_LEVEL' | translate" />
        <button class="mini" (click)="addNiveau()">{{ 'ONBOARDING.ADD_LEVEL_ACTION' | translate }}</button>

        <label for="specialite-select">{{ 'ONBOARDING.SPECIALTY' | translate }}</label>
        <select id="specialite-select" [(ngModel)]="specialite">
          <option *ngFor="let s of specialites" [ngValue]="s">{{ s }}</option>
        </select>
        <input [placeholder]="'ONBOARDING.ADD_SPECIALTY' | translate" [(ngModel)]="customSpecialite" [attr.aria-label]="'ONBOARDING.ADD_SPECIALTY' | translate" />
        <button class="mini" (click)="addSpecialite()">{{ 'ONBOARDING.ADD_SPECIALTY_ACTION' | translate }}</button>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <button class="btn" (click)="finish()">{{ 'ONBOARDING.CONTINUE' | translate }}</button>
      </article>

      <article class="card" *ngIf="step() === 3">
        <h2>{{ 'ONBOARDING.SUCCESS_TITLE' | translate }}</h2>
        <p>{{ 'ONBOARDING.SUCCESS_SUBTITLE' | translate }}</p>
        <button class="btn" (click)="goDashboard()">{{ 'ONBOARDING.CONTINUE' | translate }}</button>
      </article>
    </section>
  `,
  styles: [`
    .welcome-shell { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #0b1020; }
    .card { max-width: 620px; width: 100%; background: #111827; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 24px; color: #e5e7eb; display: grid; gap: 10px; }
    ul { margin: 0 0 4px 18px; color: #cbd5e1; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    label { font-weight: 700; margin-top: 8px; }
    select, input { width: 100%; border: 1px solid rgba(255,255,255,.2); border-radius: 10px; background: #0f172a; color: #fff; padding: 10px; }
    .btn { border: none; border-radius: 10px; padding: 12px; font-weight: 700; background: #6366f1; color: #fff; cursor: pointer; }
    .btn-ghost { background: transparent; border: 1px solid #6366f1; }
    .mini { justify-self: start; border: none; border-radius: 8px; padding: 8px 10px; background: #334155; color: #fff; cursor: pointer; }
    .error { color: #fca5a5; min-height: 20px; margin: 0; }
  `]
})
export class WelcomeOnboardingComponent {
  private auth = inject(AuthService);
  private userSvc = inject(UserService);
  private router = inject(Router);

  step = signal(1);
  error = signal<string | null>(null);
  links = {
    site: 'https://eduflow.app',
    facebook: 'EduFlow',
    instagram: '@eduflow',
    x: '@eduflow',
  };
  niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
  specialites = ['Informatique', 'Mathématiques', 'Physique', 'Économie'];
  niveau = this.niveaux[0];
  specialite = this.specialites[0];
  customNiveau = '';
  customSpecialite = '';

  goStep2(): void { this.step.set(2); }

  addNiveau(): void {
    const v = this.customNiveau.trim();
    if (!v) return;
    if (!this.niveaux.includes(v)) this.niveaux = [...this.niveaux, v];
    this.niveau = v;
    this.customNiveau = '';
  }

  addSpecialite(): void {
    const v = this.customSpecialite.trim();
    if (!v) return;
    if (!this.specialites.includes(v)) this.specialites = [...this.specialites, v];
    this.specialite = v;
    this.customSpecialite = '';
  }

  finish(): void {
    if (!this.niveau || !this.specialite) {
      this.error.set('Veuillez sélectionner un niveau et une spécialité.');
      return;
    }
    this.userSvc.completeOnboarding({ niveau: this.niveau, specialite: this.specialite }).subscribe({
      next: () => {
        this.auth.bootstrap().subscribe(() => this.step.set(3));
      },
      error: e => this.error.set(e?.error?.message ?? 'Erreur lors de la finalisation.')
    });
  }

  goDashboard(): void {
    const user = this.auth.user();
    if (!user) {
      this.router.navigateByUrl('/auth');
      return;
    }
    if (user.role === 'ADMIN') this.router.navigateByUrl('/admin');
    else if (user.role === 'ENSEIGNANT') this.router.navigateByUrl('/teacher');
    else this.router.navigateByUrl('/student');
  }
}
