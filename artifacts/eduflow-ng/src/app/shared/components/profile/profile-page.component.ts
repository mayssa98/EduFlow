import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { UserService } from '../../../core/services/api.services';
import { ProfileResponse } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';

function pwdLength(c: AbstractControl)  { return c.value && c.value.length >= 8 ? null : { pwdLength: true }; }
function pwdUpper(c: AbstractControl)   { return c.value && /[A-Z]/.test(c.value) ? null : { pwdUpper: true }; }
function pwdDigit(c: AbstractControl)   { return c.value && /\d/.test(c.value) ? null : { pwdDigit: true }; }
function pwdSpecial(c: AbstractControl) { return c.value && /[!@#$%^&*()_\-+={}[\]:;"'<>,.?/\\|`~]/.test(c.value) ? null : { pwdSpecial: true }; }

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-shell">
      <div class="profile-header">
        <div class="avatar">
          <img *ngIf="profile()?.photoUrl" [src]="profile()!.photoUrl" alt="Photo de profil" class="avatar-img"/>
          <div *ngIf="!profile()?.photoUrl" class="avatar-placeholder">
            {{ initials() }}
          </div>
        </div>
        <div class="header-info">
          <h1>{{ profile()?.prenom }} {{ profile()?.nom }}</h1>
          <span class="role-badge" [class]="'badge-' + (profile()?.role?.toLowerCase() || '')">
            {{ roleLabel() }}
          </span>
          <p class="email-label">{{ profile()?.email }}</p>
        </div>
      </div>

      <div class="cards-grid">
        <!-- Carte : Modifier le profil -->
        <div class="card">
          <h2>✏️ Modifier le profil</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="field-row">
              <div class="field">
                <label>Prénom</label>
                <input class="input" formControlName="prenom" placeholder="Prénom"/>
              </div>
              <div class="field">
                <label>Nom</label>
                <input class="input" formControlName="nom" placeholder="Nom"/>
              </div>
            </div>
            <div class="success" *ngIf="profileSuccess()">✓ Profil mis à jour avec succès</div>
            <div class="error" *ngIf="profileError()">{{ profileError() }}</div>
            <button class="btn-primary" [disabled]="profileForm.invalid || profileBusy()">
              <span class="spinner" *ngIf="profileBusy()"></span>
              Enregistrer les modifications
            </button>
          </form>
        </div>

        <!-- Carte : Changer le mot de passe -->
        <div class="card">
          <h2>🔒 Changer le mot de passe</h2>
          <form [formGroup]="pwdForm" (ngSubmit)="changePassword()">
            <div class="field">
              <label>Mot de passe actuel</label>
              <input class="input" type="password" formControlName="currentPassword"
                     placeholder="Votre mot de passe actuel" autocomplete="current-password"/>
            </div>
            <div class="field">
              <label>Nouveau mot de passe</label>
              <input class="input" type="password" formControlName="newPassword"
                     placeholder="Nouveau mot de passe" autocomplete="new-password"/>
              <!-- Checklist dynamique -->
              <div class="pwd-rules" *ngIf="pwdForm.get('newPassword')?.value">
                <small class="rule" [class.ok]="!pwdForm.get('newPassword')?.errors?.['pwdLength']">
                  <span>{{ !pwdForm.get('newPassword')?.errors?.['pwdLength'] ? '✓' : '✗' }}</span>
                  Au moins 8 caractères
                </small>
                <small class="rule" [class.ok]="!pwdForm.get('newPassword')?.errors?.['pwdUpper']">
                  <span>{{ !pwdForm.get('newPassword')?.errors?.['pwdUpper'] ? '✓' : '✗' }}</span>
                  Une lettre majuscule
                </small>
                <small class="rule" [class.ok]="!pwdForm.get('newPassword')?.errors?.['pwdDigit']">
                  <span>{{ !pwdForm.get('newPassword')?.errors?.['pwdDigit'] ? '✓' : '✗' }}</span>
                  Un chiffre
                </small>
                <small class="rule" [class.ok]="!pwdForm.get('newPassword')?.errors?.['pwdSpecial']">
                  <span>{{ !pwdForm.get('newPassword')?.errors?.['pwdSpecial'] ? '✓' : '✗' }}</span>
                  Un caractère spécial
                </small>
              </div>
            </div>
            <div class="success" *ngIf="pwdSuccess()">✓ Mot de passe mis à jour</div>
            <div class="error" *ngIf="pwdError()">{{ pwdError() }}</div>
            <button class="btn-primary" [disabled]="pwdForm.invalid || pwdBusy()">
              <span class="spinner" *ngIf="pwdBusy()"></span>
              Changer le mot de passe
            </button>
          </form>
        </div>

        <!-- Carte : Informations du compte -->
        <div class="card info-card">
          <h2>📋 Informations du compte</h2>
          <div class="info-row">
            <span class="info-label">Statut</span>
            <span class="status-badge" [class.active]="profile()?.statutCompte === 'ACTIVE'">
              {{ profile()?.statutCompte }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Membre depuis</span>
            <span>{{ formatDate(profile()?.dateCreation) }}</span>
          </div>
          <div class="info-row" *ngIf="profile()?.derniereConnexion">
            <span class="info-label">Dernière connexion</span>
            <span>{{ formatDate(profile()?.derniereConnexion) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #6366f1;
      --card: #1a1a2e;
      --border: rgba(99,102,241,0.2);
      --text: #e2e8f0;
      --muted: #94a3b8;
      --green: #86efac;
      --red: #fca5a5;
    }

    .profile-shell {
      padding: 28px;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
    }

    .avatar { flex-shrink: 0; }

    .avatar-img {
      width: 80px; height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--primary);
    }

    .avatar-placeholder {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 700; color: white;
    }

    .header-info { display: flex; flex-direction: column; gap: 6px; }
    .header-info h1 { margin: 0; font-size: 1.6rem; color: var(--text); }

    .role-badge {
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-admin    { background: rgba(239,68,68,0.2);   color: #fca5a5; }
    .badge-enseignant { background: rgba(234,179,8,0.2); color: #fde68a; }
    .badge-etudiant { background: rgba(99,102,241,0.2);  color: #c4b5fd; }

    .email-label { color: var(--muted); font-size: 0.88rem; margin: 0; }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card h2 { margin: 0; font-size: 1.1rem; color: var(--text); }

    form { display: flex; flex-direction: column; gap: 12px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    label { font-size: 0.82rem; color: var(--muted); font-weight: 500; }

    .input {
      background: #252540;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 14px;
      color: var(--text);
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .input:focus { border-color: var(--primary); }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 11px 20px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      transition: opacity 0.2s;
      font-size: 0.9rem;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .pwd-rules {
      display: flex; flex-direction: column; gap: 4px;
      padding: 8px 12px;
      background: rgba(99,102,241,0.06);
      border-radius: 8px;
      border: 1px solid rgba(99,102,241,0.12);
    }

    .rule { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--red); }
    .rule.ok { color: var(--green); }

    .success { color: var(--green); font-size: 0.85rem; }
    .error   { color: var(--red);   font-size: 0.85rem; }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
      color: var(--text);
    }
    .info-row:last-child { border: none; }
    .info-label { color: var(--muted); }

    .status-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(239,68,68,0.15);
      color: #fca5a5;
    }
    .status-badge.active { background: rgba(134,239,172,0.15); color: var(--green); }

    .spinner {
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ProfilePageComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private userSvc    = inject(UserService);
  private authSvc    = inject(AuthService);

  profile       = signal<ProfileResponse | null>(null);
  profileBusy   = signal(false);
  profileSuccess = signal(false);
  profileError  = signal<string | null>(null);
  pwdBusy       = signal(false);
  pwdSuccess    = signal(false);
  pwdError      = signal<string | null>(null);

  initials = computed(() => {
    const p = this.profile();
    if (!p) return '?';
    return `${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase();
  });

  roleLabel = computed(() => {
    const r = this.profile()?.role;
    return r === 'ADMIN' ? 'Administrateur' : r === 'ENSEIGNANT' ? 'Enseignant' : 'Étudiant';
  });

  profileForm = this.fb.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom:    ['', [Validators.required, Validators.minLength(2)]],
  });

  pwdForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword:     ['', [Validators.required, pwdLength, pwdUpper, pwdDigit, pwdSpecial]],
  });

  ngOnInit(): void {
    this.userSvc.getProfile().subscribe({
      next: p => {
        this.profile.set(p);
        this.profileForm.patchValue({ prenom: p.prenom, nom: p.nom });
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileBusy.set(true); this.profileSuccess.set(false); this.profileError.set(null);
    const v = this.profileForm.getRawValue();
    this.userSvc.updateProfile({ nom: v.nom!, prenom: v.prenom! }).subscribe({
      next: p => {
        this.profile.set(p);
        this.profileBusy.set(false);
        this.profileSuccess.set(true);
        setTimeout(() => this.profileSuccess.set(false), 3000);
      },
      error: e => { this.profileBusy.set(false); this.profileError.set(e?.error?.message ?? 'Erreur lors de la mise à jour.'); },
    });
  }

  changePassword(): void {
    if (this.pwdForm.invalid) return;
    this.pwdBusy.set(true); this.pwdSuccess.set(false); this.pwdError.set(null);
    const v = this.pwdForm.getRawValue();
    this.userSvc.changePassword({ currentPassword: v.currentPassword!, newPassword: v.newPassword! }).subscribe({
      next: () => {
        this.pwdBusy.set(false);
        this.pwdSuccess.set(true);
        this.pwdForm.reset();
        setTimeout(() => this.pwdSuccess.set(false), 3000);
      },
      error: e => { this.pwdBusy.set(false); this.pwdError.set(e?.error?.message ?? 'Mot de passe actuel incorrect.'); },
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
