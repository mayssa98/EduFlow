import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { UserService, ProfileResponse } from '../../../core/services/user.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, LanguageSwitcherComponent, ThemeToggleComponent],
  template: `
    <div class="settings-shell">
      <h1 class="page-title">⚙️ Paramètres du compte</h1>

      <!-- Profile Section -->
      <section class="card">
        <h2>👤 Informations personnelles</h2>
        <p class="muted">Modifier votre nom et prénom.</p>

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form-grid" *ngIf="profile()">
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" formControlName="prenom" class="form-control" />
          </div>
          <div class="form-group">
            <label>Nom</label>
            <input type="text" formControlName="nom" class="form-control" />
          </div>
          <div class="form-group full">
            <label>Email</label>
            <input type="text" class="form-control disabled" [value]="profile()?.email" disabled />
          </div>
          <div class="form-group full">
            <label>Rôle</label>
            <input type="text" class="form-control disabled" [value]="profile()?.role" disabled />
          </div>
          <div class="form-actions">
            <span class="success-msg" *ngIf="profileSaved()">✓ Profil mis à jour</span>
            <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || profileSaving()">
              {{ profileSaving() ? '⏳ Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Password Section -->
      <section class="card">
        <h2>🔒 Changer le mot de passe</h2>
        <p class="muted">Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.</p>

        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="form-grid">
          <div class="form-group full">
            <label>Mot de passe actuel</label>
            <input type="password" formControlName="currentPassword" class="form-control" />
          </div>
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" formControlName="newPassword" class="form-control" />
          </div>
          <div class="form-group">
            <label>Confirmer</label>
            <input type="password" formControlName="confirmPassword" class="form-control" />
          </div>
          <div class="form-actions">
            <span class="error-msg" *ngIf="passwordError()">{{ passwordError() }}</span>
            <span class="success-msg" *ngIf="passwordSaved()">✓ Mot de passe modifié</span>
            <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || passwordSaving()">
              {{ passwordSaving() ? '⏳ ...' : 'Modifier le mot de passe' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Preferences Section -->
      <section class="card preferences-card">
        <h2>🎨 Préférences</h2>
        <div class="pref-row">
          <div class="pref-item">
            <label>Langue</label>
            <app-language-switcher></app-language-switcher>
          </div>
          <div class="pref-item">
            <label>Thème</label>
            <app-theme-toggle></app-theme-toggle>
          </div>
        </div>
      </section>

      <!-- Account Info Section -->
      <section class="card" *ngIf="profile() as p">
        <h2>📋 Informations du compte</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Statut du compte</span>
            <span class="badge" [class]="'status-' + (p.statutCompte ?? '').toLowerCase()">{{ p.statutCompte }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date d'inscription</span>
            <span>{{ formatDate(p.dateCreation) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Dernière connexion</span>
            <span>{{ formatDate(p.derniereConnexion) }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { --card-bg: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .settings-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; max-width: 780px; }
    .page-title { font-size: 1.5rem; margin: 0; color: var(--text); }

    .card {
      background: var(--card-bg); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px;
    }
    .card h2 { margin: 0; font-size: 1.15rem; color: var(--text); }
    .muted { color: var(--muted); font-size: 0.85rem; margin: 0; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
    .form-control {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      color: #fff; padding: 10px 12px; border-radius: 8px; font-family: inherit; font-size: 0.9rem;
    }
    .form-control:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.08); }
    .form-control.disabled { opacity: 0.5; cursor: not-allowed; }

    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
      border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .success-msg { color: #86efac; font-size: 0.85rem; font-weight: 600; }
    .error-msg { color: #fca5a5; font-size: 0.85rem; font-weight: 600; }

    .preferences-card .pref-row { display: flex; gap: 32px; flex-wrap: wrap; }
    .pref-item { display: flex; flex-direction: column; gap: 8px; }
    .pref-item label { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: inline-block; width: fit-content; }
    .status-active { background: rgba(134,239,172,0.15); color: #86efac; }
    .status-pending { background: rgba(234,179,8,0.15); color: #fde68a; }
    .status-blocked { background: rgba(239,68,68,0.15); color: #fca5a5; }

    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class SettingsPageComponent implements OnInit {
  private userSvc = inject(UserService);
  private fb = inject(FormBuilder);

  profile = signal<ProfileResponse | null>(null);
  profileSaving = signal(false);
  profileSaved = signal(false);
  passwordSaving = signal(false);
  passwordSaved = signal(false);
  passwordError = signal<string | null>(null);

  profileForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required]],
    nom: ['', [Validators.required]],
  });

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.userSvc.getProfile().subscribe({
      next: (p: ProfileResponse) => {
        this.profile.set(p);
        this.profileForm.patchValue({ prenom: p.prenom, nom: p.nom });
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileSaving.set(true);
    this.profileSaved.set(false);
    const val = this.profileForm.getRawValue();
    this.userSvc.updateProfile(val).subscribe({
      next: (p: ProfileResponse) => {
        this.profile.set(p);
        this.profileSaving.set(false);
        this.profileSaved.set(true);
        setTimeout(() => this.profileSaved.set(false), 3000);
      },
      error: () => this.profileSaving.set(false),
    });
  }

  changePassword(): void {
    this.passwordError.set(null);
    this.passwordSaved.set(false);
    const val = this.passwordForm.getRawValue();
    if (val.newPassword !== val.confirmPassword) {
      this.passwordError.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.passwordSaving.set(true);
    this.userSvc.changePassword({
      currentPassword: val.currentPassword,
      newPassword: val.newPassword,
    }).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSaved.set(true);
        this.passwordForm.reset();
        setTimeout(() => this.passwordSaved.set(false), 3000);
      },
      error: (err: any) => {
        this.passwordSaving.set(false);
        this.passwordError.set(err?.error?.message || 'Erreur lors du changement de mot de passe.');
      },
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
