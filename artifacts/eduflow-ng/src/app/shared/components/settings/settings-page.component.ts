import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { LANGUAGES, Language, LanguageService } from '../../../core/services/language.service';
import { Theme, ThemeService } from '../../../core/services/theme.service';
import {
  ClassOption,
  ProfileResponse,
  UserService,
} from '../../../core/services/user.service';
import { APP_ICONS } from '../../icons/app-icons';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

type SettingsSection = 'home' | 'profile' | 'security' | 'class' | 'preferences';

interface SettingsOption {
  key: Exclude<SettingsSection, 'home'>;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SafeHtmlPipe],
  template: `
    <div class="settings-shell">
      <ng-container *ngIf="profile() as p; else loadingState">
        <section class="hub-card" *ngIf="section() === 'home'">
          <div class="hub-head">
            <div class="hub-copy">
              <h1>Reglages</h1>
            </div>

            <div class="hub-user">
              <div class="avatar-shell hub-avatar">
                <img *ngIf="avatarSrc(); else hubAvatarFallback" [src]="avatarSrc()!" alt="Photo de profil" class="avatar-img" />
                <ng-template #hubAvatarFallback>
                  <span class="avatar-fallback" [innerHTML]="icons.profile | safeHtml"></span>
                </ng-template>
              </div>
              <div class="hub-user-copy">
                <strong>{{ p.prenom }} {{ p.nom }}</strong>
                <span>{{ p.email }}</span>
                <small>{{ roleLabel(p.role) }}</small>
              </div>
            </div>
          </div>

          <div class="options-grid">
            <a
              *ngFor="let option of settingsOptions()"
              class="option-card"
              [routerLink]="['/settings', option.key]"
            >
              <span class="option-icon" [innerHTML]="option.icon | safeHtml"></span>
              <span class="option-copy">
                <strong>{{ option.title }}</strong>
                <small>{{ option.description }}</small>
              </span>
              <span class="option-arrow" [innerHTML]="icons.arrowLeft | safeHtml"></span>
            </a>
          </div>
        </section>

        <ng-container *ngIf="section() !== 'home'">
          <header class="section-banner">
            <a class="back-link" routerLink="/settings">
              <span [innerHTML]="icons.arrowLeft | safeHtml"></span>
              Retour aux options
            </a>
            <div class="section-copy">
              <h1>{{ sectionTitle() }}</h1>
              <p>{{ sectionDescription() }}</p>
            </div>
          </header>
        </ng-container>

        <section class="card" *ngIf="section() === 'profile'">
          <div class="two-col profile-layout">
            <div class="summary-panel avatar-panel">
              <input
                #avatarInput
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                (change)="onAvatarSelected($event)"
              />

              <button
                type="button"
                class="avatar-shell avatar-large"
                (click)="triggerAvatarPicker()"
                [disabled]="avatarUploading()"
                title="Choisir une nouvelle image"
              >
                <img *ngIf="avatarSrc(); else profileAvatarFallback" [src]="avatarSrc()!" alt="Photo de profil" class="avatar-img" />
                <ng-template #profileAvatarFallback>
                  <span class="avatar-fallback" [innerHTML]="icons.profile | safeHtml"></span>
                </ng-template>
              </button>

              <button
                type="button"
                class="btn-secondary"
                (click)="triggerAvatarPicker()"
                [disabled]="avatarUploading()"
              >
                {{ avatarUploading() ? 'Import en cours...' : 'Choisir une image' }}
              </button>

              <small class="hint">PNG, JPG ou WEBP. 5 Mo maximum.</small>
              <span class="success-msg" *ngIf="avatarSaved()">{{ avatarSaved() }}</span>
              <span class="error-msg" *ngIf="avatarError()">{{ avatarError() }}</span>

              <div class="summary-row">
                <span class="summary-label">Adresse email</span>
                <strong>{{ p.email }}</strong>
              </div>
              <div class="summary-row">
                <span class="summary-label">Age</span>
                <strong>{{ p.age != null ? (p.age + ' ans') : 'Non renseigne' }}</strong>
              </div>
              <div class="summary-row">
                <span class="summary-label">Compte</span>
                <span class="status-badge" [class]="'status-' + p.statutCompte.toLowerCase()">{{ p.statutCompte }}</span>
              </div>
            </div>

            <form class="form-grid" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="form-group">
                <label>Prenom</label>
                <input class="form-control" formControlName="prenom" />
              </div>

              <div class="form-group">
                <label>Nom</label>
                <input class="form-control" formControlName="nom" />
              </div>

              <div class="form-group full">
                <label>Adresse email</label>
                <input class="form-control disabled" [value]="p.email" disabled />
                <small class="hint">
                  L'email s'affiche ici. Sa modification reste dans la rubrique Securite.
                </small>
              </div>

              <div class="form-actions full">
                <span class="success-msg" *ngIf="profileSaved()">{{ profileSaved() }}</span>
                <span class="error-msg" *ngIf="profileError()">{{ profileError() }}</span>
                <button class="btn-primary" type="submit" [disabled]="profileForm.invalid || profileSaving()">
                  {{ profileSaving() ? 'Enregistrement...' : 'Enregistrer le profil' }}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section class="card" *ngIf="section() === 'security'">
          <div class="security-grid">
            <form class="security-card" [formGroup]="emailForm" (ngSubmit)="changeEmail()">
              <h3>Changer l'adresse email</h3>
              <p class="muted">Le mot de passe actuel est requis pour valider ce changement.</p>

              <div class="form-group">
                <label>Nouveau email</label>
                <input class="form-control" formControlName="newEmail" [disabled]="!p.emailChangeAllowed" />
              </div>

              <div class="form-group">
                <label>Mot de passe actuel</label>
                <input class="form-control" type="password" formControlName="currentPassword" [disabled]="!p.emailChangeAllowed" />
              </div>

              <div class="form-actions">
                <span class="success-msg" *ngIf="emailSaved()">{{ emailSaved() }}</span>
                <span class="error-msg" *ngIf="emailError()">{{ emailError() }}</span>
                <button class="btn-secondary" type="submit" [disabled]="emailForm.invalid || emailSaving() || !p.emailChangeAllowed">
                  {{ emailSaving() ? 'Mise a jour...' : 'Mettre a jour l\\'email' }}
                </button>
              </div>
            </form>

            <form class="security-card" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <h3>Changer le mot de passe</h3>
              <p class="muted">Le nouveau mot de passe doit rester fort et unique.</p>

              <div class="form-group">
                <label>Mot de passe actuel</label>
                <input class="form-control" type="password" formControlName="currentPassword" [disabled]="!p.passwordChangeAllowed" />
              </div>

              <div class="form-group">
                <label>Nouveau mot de passe</label>
                <input class="form-control" type="password" formControlName="newPassword" [disabled]="!p.passwordChangeAllowed" />
              </div>

              <div class="form-group">
                <label>Confirmer le nouveau mot de passe</label>
                <input class="form-control" type="password" formControlName="confirmPassword" [disabled]="!p.passwordChangeAllowed" />
              </div>

              <div class="form-actions">
                <span class="success-msg" *ngIf="passwordSaved()">{{ passwordSaved() }}</span>
                <span class="error-msg" *ngIf="passwordError()">{{ passwordError() }}</span>
                <button class="btn-secondary" type="submit" [disabled]="passwordForm.invalid || passwordSaving() || !p.passwordChangeAllowed">
                  {{ passwordSaving() ? 'Mise a jour...' : 'Changer le mot de passe' }}
                </button>
              </div>
            </form>

            <div class="security-card methods-card">
              <h3>Authentification renforcee</h3>
              <p class="muted">
                OTP par email est operationnel. Google Authenticator et cle d'acces restent visibles,
                mais sont encore en preparation.
              </p>

              <button
                type="button"
                class="method-card"
                [class.active]="p.mfaEnabled && p.mfaMethod === 'EMAIL'"
                (click)="toggleEmailOtp(!p.mfaEnabled || p.mfaMethod !== 'EMAIL')"
              >
                <span class="method-icon" [innerHTML]="icons.mail | safeHtml"></span>
                <span class="method-copy">
                  <strong>OTP par email</strong>
                  <small>{{ p.mfaEnabled && p.mfaMethod === 'EMAIL' ? 'Active' : 'Cliquer pour activer' }}</small>
                </span>
              </button>

              <div class="method-card disabled">
                <span class="method-icon" [innerHTML]="icons.shield | safeHtml"></span>
                <span class="method-copy">
                  <strong>Google Authenticator</strong>
                  <small>Bientot disponible</small>
                </span>
              </div>

              <div class="method-card disabled">
                <span class="method-icon" [innerHTML]="icons.key | safeHtml"></span>
                <span class="method-copy">
                  <strong>Cle d'acces</strong>
                  <small>Bientot disponible</small>
                </span>
              </div>

              <div class="form-actions inline">
                <span class="success-msg" *ngIf="mfaSaved()">{{ mfaSaved() }}</span>
                <span class="error-msg" *ngIf="mfaError()">{{ mfaError() }}</span>
                <button class="btn-secondary ghost" type="button" (click)="toggleEmailOtp(false)" [disabled]="!p.mfaEnabled || mfaSaving()">
                  {{ mfaSaving() ? '...' : 'Desactiver le MFA' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="card" *ngIf="section() === 'class' && p.role === 'ETUDIANT'">
          <div class="two-col">
            <div class="summary-panel">
              <div class="summary-row">
                <span class="summary-label">Classe actuelle</span>
                <strong>{{ p.currentClassName || 'Aucune classe affectee' }}</strong>
              </div>
              <div class="summary-row" *ngIf="p.pendingClassChange as pending">
                <span class="summary-label">Derniere demande</span>
                <strong>{{ pending.classeSouhaiteeNom || 'Classe cible' }} - {{ pending.statut }}</strong>
              </div>
              <div class="summary-row" *ngIf="p.pendingClassChange?.motif">
                <span class="summary-label">Motif precedent</span>
                <strong>{{ p.pendingClassChange?.motif }}</strong>
              </div>
            </div>

            <form class="form-grid" [formGroup]="classForm" (ngSubmit)="requestClassChange()">
              <div class="form-group full">
                <label>Classe souhaitee</label>
                <select class="form-control" formControlName="targetClassId" [disabled]="availableClassChoices().length === 0 || hasPendingClassRequest()">
                  <option [ngValue]="0">Choisir une classe disponible</option>
                  <option *ngFor="let option of availableClassChoices()" [ngValue]="option.id">
                    {{ formatClassOption(option) }}
                  </option>
                </select>
              </div>

              <div class="form-group full">
                <label>Motif de la demande</label>
                <textarea class="form-control textarea" formControlName="motif" placeholder="Expliquez pourquoi vous souhaitez changer de classe."></textarea>
              </div>

              <div class="form-actions full">
                <span class="success-msg" *ngIf="classSaved()">{{ classSaved() }}</span>
                <span class="error-msg" *ngIf="classError()">{{ classError() }}</span>
                <button
                  class="btn-primary"
                  type="submit"
                  [disabled]="classSaving() || hasPendingClassRequest() || classForm.getRawValue().targetClassId === 0 || availableClassChoices().length === 0"
                >
                  {{ classSaving() ? 'Envoi...' : 'Envoyer la demande a l\\'administrateur' }}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section class="card" *ngIf="section() === 'preferences'">
          <div class="preferences-grid">
            <div class="pref-block">
              <label>Langue</label>
              <div class="choice-row">
                <button
                  *ngFor="let lang of languages"
                  type="button"
                  class="choice-pill"
                  [class.active]="languageService.currentLang() === lang.code"
                  (click)="setLanguage(lang.code)"
                >
                  <span>{{ lang.nativeLabel }}</span>
                  <small>{{ lang.code.toUpperCase() }}</small>
                </button>
              </div>
            </div>

            <div class="pref-block">
              <label>Luminosite</label>
              <div class="choice-row">
                <button
                  type="button"
                  class="choice-pill"
                  [class.active]="themeService.theme() === 'dark'"
                  (click)="setTheme('dark')"
                >
                  <span>Sombre</span>
                  <small>Dark</small>
                </button>
                <button
                  type="button"
                  class="choice-pill"
                  [class.active]="themeService.theme() === 'light'"
                  (click)="setTheme('light')"
                >
                  <span>Clair</span>
                  <small>Light</small>
                </button>
              </div>
            </div>
          </div>
        </section>
      </ng-container>

      <ng-template #loadingState>
        <section class="hub-card loading-card">
          <h1 *ngIf="pageLoading()">Chargement des reglages...</h1>
          <div *ngIf="!pageLoading() && pageError()" class="error-state">
            <strong>Impossible de charger les reglages.</strong>
            <span>{{ pageError() }}</span>
          </div>
        </section>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      color: var(--color-foreground);
    }

    .settings-shell {
      max-width: 1120px;
      margin: 0 auto;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .hub-card,
    .card,
    .section-banner {
      background:
        linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)),
        var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 24px;
      box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
    }

    .hub-card,
    .card {
      padding: 24px;
    }

    .hub-head,
    .section-banner,
    .two-col,
    .security-grid,
    .preferences-grid,
    .options-grid {
      display: grid;
      gap: 18px;
    }

    .hub-head,
    .section-banner,
    .two-col,
    .preferences-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hub-head {
      align-items: center;
      margin-bottom: 22px;
    }

    .hub-copy,
    .section-copy {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.18);
      color: #c7d2fe;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    .hub-copy h1,
    .section-copy h1 {
      font-size: clamp(2rem, 4vw, 2.5rem);
      line-height: 1;
    }

    .hub-copy p,
    .section-copy p,
    .muted,
    .hint {
      color: var(--color-muted-foreground);
      line-height: 1.6;
    }

    .hub-user {
      justify-self: end;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 22px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .hub-user-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .hub-user-copy strong {
      font-family: var(--font-display);
      font-size: 1.05rem;
    }

    .hub-user-copy span,
    .hub-user-copy small {
      color: var(--color-muted-foreground);
    }

    .options-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .option-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      text-decoration: none;
      color: inherit;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .option-card:hover {
      transform: translateY(-2px);
      border-color: rgba(99,102,241,0.24);
      background: rgba(99,102,241,0.08);
    }

    .option-icon,
    .option-arrow,
    .back-link span,
    .method-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .option-icon,
    .method-icon {
      width: 2.8rem;
      height: 2.8rem;
      border-radius: 16px;
      color: #a5b4fc;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.16);
    }

    .option-copy,
    .method-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .option-copy strong,
    .method-copy strong {
      font-size: 1rem;
    }

    .option-copy small,
    .method-copy small {
      color: var(--color-muted-foreground);
      line-height: 1.55;
    }

    .option-arrow {
      margin-left: auto;
      color: #c7d2fe;
      transform: rotate(180deg);
      opacity: 0.82;
    }

    .section-banner {
      align-items: center;
      padding: 18px 22px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      width: fit-content;
      color: #c7d2fe;
      text-decoration: none;
      font-weight: 700;
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .profile-layout {
      align-items: start;
    }

    .summary-panel,
    .security-card {
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
      padding: 18px;
    }

    .summary-panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .avatar-panel {
      align-items: flex-start;
    }

    .avatar-shell {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 26px;
      background: linear-gradient(145deg, rgba(99,102,241,0.2), rgba(56,189,248,0.12));
      border: 1px solid rgba(129,140,248,0.26);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 20px 30px rgba(59,130,246,0.14);
      overflow: hidden;
      flex-shrink: 0;
    }

    .hub-avatar {
      width: 72px;
      height: 72px;
    }

    .avatar-large {
      width: 124px;
      height: 124px;
      padding: 0;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease;
    }

    .avatar-large:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: rgba(129,140,248,0.42);
    }

    .avatar-large:disabled {
      opacity: 0.65;
      cursor: wait;
    }

    .avatar-img,
    .avatar-fallback {
      width: 100%;
      height: 100%;
      border-radius: inherit;
    }

    .avatar-img {
      object-fit: cover;
      display: block;
    }

    .avatar-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #c7d2fe;
    }

    .summary-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-label,
    .pref-block label,
    .form-group label {
      color: var(--color-muted-foreground);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .status-badge {
      width: fit-content;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .status-active { background: rgba(34,197,94,0.16); color: #86efac; }
    .status-pending,
    .status-pending_approval { background: rgba(251,191,36,0.16); color: #fde68a; }
    .status-blocked { background: rgba(239,68,68,0.16); color: #fca5a5; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .security-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .preferences-grid {
      gap: 22px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full {
      grid-column: 1 / -1;
    }

    .form-control {
      width: 100%;
      padding: 11px 13px;
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--color-foreground);
      font: inherit;
      transition: border-color 160ms ease, background 160ms ease;
    }

    .form-control:focus {
      outline: none;
      border-color: rgba(99,102,241,0.38);
      background: rgba(255,255,255,0.08);
    }

    .form-control.disabled {
      opacity: 0.68;
      cursor: not-allowed;
    }

    .textarea {
      min-height: 110px;
      resize: vertical;
    }

    .security-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .methods-card {
      gap: 14px;
    }

    .method-card {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
      color: inherit;
      text-align: left;
    }

    button.method-card {
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    button.method-card:hover {
      transform: translateY(-1px);
      border-color: rgba(99,102,241,0.24);
      background: rgba(99,102,241,0.08);
    }

    .method-card.active {
      border-color: rgba(34,197,94,0.32);
      background: rgba(34,197,94,0.12);
    }

    .method-card.disabled {
      opacity: 0.62;
    }

    .pref-block {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
      padding: 18px;
    }

    .choice-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .choice-pill {
      min-width: 120px;
      display: inline-flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: var(--color-foreground);
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .choice-pill:hover {
      transform: translateY(-1px);
    }

    .choice-pill small {
      color: var(--color-muted-foreground);
      font-size: 0.74rem;
      letter-spacing: 0.04em;
    }

    .choice-pill.active {
      border-color: rgba(99,102,241,0.28);
      background: rgba(99,102,241,0.12);
      color: #c7d2fe;
    }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }

    .form-actions.inline {
      justify-content: flex-start;
      margin-top: 4px;
    }

    .btn-primary,
    .btn-secondary {
      border: 0;
      border-radius: 999px;
      padding: 11px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 160ms ease, opacity 160ms ease, box-shadow 160ms ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      box-shadow: 0 14px 24px rgba(99,102,241,0.2);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.08);
      color: var(--color-foreground);
      border: 1px solid rgba(255,255,255,0.08);
      width: fit-content;
    }

    .btn-secondary.ghost {
      background: transparent;
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-primary:hover:not(:disabled),
    .btn-secondary:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .success-msg,
    .error-msg {
      font-size: 0.84rem;
      font-weight: 600;
    }

    .success-msg { color: #86efac; }
    .error-msg { color: #fca5a5; }

    .loading-card {
      min-height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      gap: 10px;
      color: #fca5a5;
    }

    @media (max-width: 1080px) {
      .security-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 920px) {
      .hub-head,
      .section-banner,
      .two-col,
      .preferences-grid,
      .options-grid {
        grid-template-columns: 1fr;
      }

      .hub-user {
        justify-self: start;
      }
    }

    @media (max-width: 720px) {
      .settings-shell {
        padding: 18px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class SettingsPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userSvc = inject(UserService);
  private authSvc = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);
  readonly icons = APP_ICONS;
  readonly languages = LANGUAGES;

  @ViewChild('avatarInput') private avatarInput?: ElementRef<HTMLInputElement>;

  readonly section = signal<SettingsSection>('home');
  readonly profile = signal<ProfileResponse | null>(null);
  readonly pageLoading = signal(true);
  readonly pageError = signal<string | null>(null);

  readonly profileSaving = signal(false);
  readonly profileSaved = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);

  readonly avatarUploading = signal(false);
  readonly avatarSaved = signal<string | null>(null);
  readonly avatarError = signal<string | null>(null);

  readonly emailSaving = signal(false);
  readonly emailSaved = signal<string | null>(null);
  readonly emailError = signal<string | null>(null);

  readonly passwordSaving = signal(false);
  readonly passwordSaved = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly mfaSaving = signal(false);
  readonly mfaSaved = signal<string | null>(null);
  readonly mfaError = signal<string | null>(null);

  readonly classSaving = signal(false);
  readonly classSaved = signal<string | null>(null);
  readonly classError = signal<string | null>(null);

  readonly avatarSrc = computed(() => this.profile()?.photoUrl?.trim() || null);

  readonly availableClassChoices = computed(() =>
    (this.profile()?.availableClasses ?? []).filter(option => option.id !== this.profile()?.currentClassId)
  );

  readonly hasPendingClassRequest = computed(() => this.profile()?.pendingClassChange?.statut === 'PENDING');

  readonly settingsOptions = computed<SettingsOption[]>(() => {
    const options: SettingsOption[] = [
      {
        key: 'profile',
        title: 'Profil',
        description: 'Photo, nom, prenom et informations visibles.',
        icon: this.icons.profile,
      },
      {
        key: 'security',
        title: 'Securite',
        description: 'Email, mot de passe et authentification renforcee.',
        icon: this.icons.lock,
      },
      {
        key: 'preferences',
        title: 'Preferences',
        description: 'Langue et mode clair ou sombre.',
        icon: this.icons.palette,
      },
    ];

    if (this.profile()?.role === 'ETUDIANT') {
      options.splice(2, 0, {
        key: 'class',
        title: 'Classe',
        description: 'Classe actuelle et demande de changement.',
        icon: this.icons.graduation,
      });
    }

    return options;
  });

  readonly profileForm = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
  });

  readonly emailForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newEmail: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly classForm = this.fb.nonNullable.group({
    targetClassId: 0,
    motif: [''],
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => this.applyRouteSection(params));
    this.authSvc.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(currentUser => {
        if (!currentUser || !this.profile()) return;
        this.profile.update(profile => profile ? { ...profile, photoUrl: currentUser.photoUrl } : profile);
      });
    this.loadProfile();
  }

  roleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrateur' : role === 'ENSEIGNANT' ? 'Enseignant' : 'Etudiant';
  }

  sectionTitle(): string {
    switch (this.section()) {
      case 'profile':
        return 'Profil';
      case 'security':
        return 'Securite';
      case 'class':
        return 'Classe';
      case 'preferences':
        return 'Preferences';
      default:
        return 'Reglages';
    }
  }

  sectionDescription(): string {
    switch (this.section()) {
      case 'profile':
        return 'Modifiez votre photo, votre nom et votre prenom.';
      case 'security':
        return 'Gerez votre email, votre mot de passe et la protection du compte.';
      case 'class':
        return 'Consultez votre classe et envoyez une demande de changement.';
      case 'preferences':
        return 'Choisissez la langue et la luminosite de l interface.';
      default:
        return '';
    }
  }

  formatClassOption(option: ClassOption): string {
    return [option.nom, option.niveau, option.anneeScolaire].filter(Boolean).join(' - ');
  }

  setLanguage(lang: Language): void {
    this.languageService.setLanguage(lang);
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  triggerAvatarPicker(): void {
    this.avatarInput?.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (input) input.value = '';
    if (!file) return;

    this.avatarSaved.set(null);
    this.avatarError.set(null);

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.avatarError.set('Choisissez une image PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError.set('L image depasse 5 Mo.');
      return;
    }

    this.avatarUploading.set(true);
    this.userSvc.uploadAvatar(file).subscribe({
      next: profile => {
        this.applyProfile(profile);
        this.authSvc.patchCurrentUser({ photoUrl: profile.photoUrl ?? undefined });
        this.avatarUploading.set(false);
        this.avatarSaved.set('Photo de profil mise a jour.');
      },
      error: error => {
        this.avatarUploading.set(false);
        this.avatarError.set(this.extractError(error, 'Impossible d importer la photo de profil.'));
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileSaving.set(true);
    this.profileSaved.set(null);
    this.profileError.set(null);

    const value = this.profileForm.getRawValue();
    this.userSvc.updateProfile({
      prenom: value.prenom.trim(),
      nom: value.nom.trim(),
    }).subscribe({
      next: profile => {
        this.applyProfile(profile);
        this.authSvc.patchCurrentUser({
          prenom: profile.prenom,
          nom: profile.nom,
        });
        this.profileSaving.set(false);
        this.profileSaved.set('Profil mis a jour.');
      },
      error: error => {
        this.profileSaving.set(false);
        this.profileError.set(this.extractError(error, 'Erreur lors de la mise a jour du profil.'));
      },
    });
  }

  changeEmail(): void {
    if (this.emailForm.invalid) return;
    this.emailSaving.set(true);
    this.emailSaved.set(null);
    this.emailError.set(null);

    const value = this.emailForm.getRawValue();
    this.userSvc.changeEmail({
      currentPassword: value.currentPassword,
      newEmail: value.newEmail.trim(),
    }).subscribe({
      next: profile => {
        this.applyProfile(profile);
        this.authSvc.patchCurrentUser({ email: profile.email });
        this.emailSaving.set(false);
        this.emailSaved.set('Adresse email mise a jour.');
        this.emailForm.patchValue({ currentPassword: '', newEmail: profile.email });
      },
      error: error => {
        this.emailSaving.set(false);
        this.emailError.set(this.extractError(error, 'Impossible de modifier l adresse email.'));
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.passwordSaved.set(null);
    this.passwordError.set(null);

    const value = this.passwordForm.getRawValue();
    if (value.newPassword !== value.confirmPassword) {
      this.passwordError.set('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    this.passwordSaving.set(true);
    this.userSvc.changePassword({
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
    }).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.passwordSaved.set('Mot de passe modifie.');
        this.passwordForm.setValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
      error: error => {
        this.passwordSaving.set(false);
        this.passwordError.set(this.extractError(error, 'Erreur lors du changement de mot de passe.'));
      },
    });
  }

  toggleEmailOtp(enabled: boolean): void {
    this.mfaSaving.set(true);
    this.mfaSaved.set(null);
    this.mfaError.set(null);

    this.userSvc.updateMfa({ enabled, method: enabled ? 'EMAIL' : null }).subscribe({
      next: profile => {
        this.applyProfile(profile);
        this.mfaSaving.set(false);
        this.mfaSaved.set(enabled ? 'OTP par email active.' : 'Authentification renforcee desactivee.');
      },
      error: error => {
        this.mfaSaving.set(false);
        this.mfaError.set(this.extractError(error, 'Impossible de mettre a jour la securite.'));
      },
    });
  }

  requestClassChange(): void {
    const targetClassId = Number(this.classForm.getRawValue().targetClassId);
    if (!targetClassId) return;

    this.classSaving.set(true);
    this.classSaved.set(null);
    this.classError.set(null);

    this.userSvc.requestClassChange({
      targetClassId,
      motif: this.classForm.getRawValue().motif.trim() || undefined,
    }).subscribe({
      next: profile => {
        this.applyProfile(profile);
        this.classSaving.set(false);
        this.classSaved.set('Demande envoyee a l administrateur.');
      },
      error: error => {
        this.classSaving.set(false);
        this.classError.set(this.extractError(error, 'Impossible d envoyer la demande de changement de classe.'));
      },
    });
  }

  private applyRouteSection(params: ParamMap): void {
    const rawSection = params.get('section');
    if (!rawSection) {
      this.section.set('home');
      return;
    }

    if (rawSection === 'profile' || rawSection === 'security' || rawSection === 'class' || rawSection === 'preferences') {
      this.section.set(rawSection);
      return;
    }

    void this.router.navigateByUrl('/settings');
  }

  private loadProfile(): void {
    this.pageLoading.set(true);
    this.pageError.set(null);
    this.userSvc.getProfile().subscribe({
      next: profile => {
        this.applyProfile(profile);
        this.pageLoading.set(false);
      },
      error: error => {
        this.pageLoading.set(false);
        this.pageError.set(this.extractError(error, 'Impossible de charger les reglages du compte.'));
      },
    });
  }

  private applyProfile(profile: ProfileResponse): void {
    this.profile.set(profile);

    if (this.section() === 'class' && profile.role !== 'ETUDIANT') {
      void this.router.navigateByUrl('/settings');
    }

    this.profileForm.patchValue({
      prenom: profile.prenom ?? '',
      nom: profile.nom ?? '',
    });

    this.emailForm.patchValue({
      currentPassword: '',
      newEmail: profile.email ?? '',
    });

    const firstClass = this.availableClassChoices()[0]?.id ?? 0;
    this.classForm.patchValue({
      targetClassId: firstClass,
      motif: '',
    });
  }

  private extractError(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }
}
