import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

const PWD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]:;"'<>,.?/\\|`~]).{8,}$/;

// Validation: pas de + dans l'email
function emailNoPlus(c: AbstractControl) {
  if (!c.value) return null;
  return String(c.value).includes('+') ? { plus: true } : null;
}

// Validation: règles détaillées du mot de passe
function pwdLength(c: AbstractControl)    { return c.value && c.value.length >= 8 ? null : { pwdLength: true }; }
function pwdUpper(c: AbstractControl)     { return c.value && /[A-Z]/.test(c.value) ? null : { pwdUpper: true }; }
function pwdDigit(c: AbstractControl)     { return c.value && /\d/.test(c.value) ? null : { pwdDigit: true }; }
function pwdSpecial(c: AbstractControl)   { return c.value && /[!@#$%^&*()_\-+={}\[\]:;"'<>,.?/\\|`~]/.test(c.value) ? null : { pwdSpecial: true }; }

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, ThemeToggleComponent, LanguageSwitcherComponent],
  template: `
    <div class="auth-shell">
      <div class="topbar">
        <a routerLink="/" class="brand">
          <img src="assets/logo.png" alt="EduFlow" width="32" height="32" />
          <span>EduFlow</span>
        </a>
        <div class="topbar-actions">
          <app-language-switcher></app-language-switcher>
          <app-theme-toggle></app-theme-toggle>
        </div>
      </div>

      <div class="auth-content">

      <!-- OTP screen -->
      <div class="auth-otp-card fade-up" *ngIf="step() === 'otp'">
        <h1>{{ 'AUTH.OTP_TITLE' | translate }}</h1>
        <p class="muted">{{ 'AUTH.OTP_SUBTITLE' | translate }} <strong>{{ pendingEmail() }}</strong></p>
        <input class="input otp-input" maxlength="6" inputmode="numeric" [value]="otpCode()"
               (input)="onOtpInput($event)" placeholder="••••••" autocomplete="one-time-code"/>
        <div class="otp-meta">
          <span [class.warn]="remaining() < 60">{{ 'AUTH.OTP_EXPIRES_IN' | translate }} {{ formatRemaining() }}</span>
          <span>{{ 'AUTH.OTP_ATTEMPTS' | translate: { used: attempts(), total: 5 } }}</span>
        </div>
        <div class="error" *ngIf="error()">{{ error() }}</div>
        <button class="btn btn-primary btn-lg full" (click)="submitOtp()"
                [disabled]="otpCode().length !== 6 || busy() || attempts() >= 5 || remaining() <= 0">
          <span class="spinner" *ngIf="busy()"></span>{{ 'AUTH.OTP_VERIFY' | translate }}
        </button>
        <p class="error" *ngIf="remaining() <= 0 && step() === 'otp'">⏳ Le code a expiré. Veuillez en renvoyer un nouveau.</p>
        <p class="error" *ngIf="attempts() >= 5">🚫 Nombre maximum de tentatives atteint. Renvoyez un nouveau code.</p>
        <button class="btn btn-outline full" (click)="resendOtp()" [disabled]="busy() || remaining() > 540">
          {{ 'AUTH.OTP_RESEND' | translate }}
        </button>
        <button class="link" (click)="step.set('signin'); error.set(null)">← {{ 'BUTTONS.BACK' | translate }}</button>
      </div>

      <!-- OTP 2FA screen -->
      <div class="auth-otp-card fade-up" *ngIf="step() === 'otp2fa'">
        <h1>Vérification 2FA</h1>
        <p class="muted">Entrez le code envoyé sur votre email pour certifier votre connexion.</p>
        <input class="input otp-input" maxlength="6" inputmode="numeric" [value]="otpCode()"
               (input)="onOtpInput($event)" placeholder="••••••" autocomplete="one-time-code"/>
        <div class="error" *ngIf="error()">{{ error() }}</div>
        <button class="btn btn-primary btn-lg full" (click)="submit2fa()"
                [disabled]="otpCode().length !== 6 || busy() || mfaAttempts() >= 3">
          <span class="spinner" *ngIf="busy()"></span>Vérifier
        </button>
        <p class="error" *ngIf="mfaAttempts() >= 3">🚫 3 tentatives échouées. Votre compte est temporairement bloqué (15 min).</p>
        <button class="link" (click)="step.set('signin'); error.set(null)">← {{ 'BUTTONS.BACK' | translate }}</button>
      </div>

      <!-- Google Optional Setup -->
      <div class="auth-otp-card fade-up" *ngIf="step() === 'googleOptional'">
        <h1>Dernière étape</h1>
        <p class="muted">Votre compte Google a été certifié. Souhaitez-vous créer un mot de passe (optionnel) pour vous connecter autrement à l'avenir ?</p>
        <input class="input" type="password" [value]="optionalPwd()" (input)="onOptionalPwdInput($event)" placeholder="Mot de passe optionnel"/>
        <div class="error" *ngIf="error()">{{ error() }}</div>
        <button class="btn btn-primary btn-lg full" (click)="completeGoogle()" [disabled]="busy()">
          <span class="spinner" *ngIf="busy()"></span>Continuer
        </button>
      </div>

      <!-- Sliding login/signup -->
      <div class="container auth-slider fade-up" *ngIf="step() === 'signin' || step() === 'signup'"
           [class.active]="step() === 'signup'">
        <!-- Sign-up form: Multi-step wizard -->
        <div class="form-container sign-up-container">
          <div class="form" style="overflow-y:auto">
            <h1>{{ 'AUTH.REGISTER' | translate }}</h1>
            <p class="step-label" style="margin-bottom:4px">Créez votre compte EduFlow en quelques étapes</p>

            <!-- Progress bar -->
            <div class="wizard-progress">
              <div class="wizard-step" [class.active]="regStep() >= 1" [class.done]="regStep() > 1">1</div>
              <div class="wizard-line" [class.done]="regStep() > 1"></div>
              <div class="wizard-step" [class.active]="regStep() >= 2" [class.done]="regStep() > 2">2</div>
              <div class="wizard-line" [class.done]="regStep() > 2"></div>
              <div class="wizard-step" [class.active]="regStep() >= 3" [class.done]="regStep() > 3">3</div>
              <div class="wizard-line" [class.done]="regStep() > 3"></div>
              <div class="wizard-step" [class.active]="regStep() >= 4" [class.done]="regStep() > 4">4</div>
            </div>

            <!-- Step 1: Role selection -->
            <div class="wiz-panel" *ngIf="regStep() === 1">
              <p class="step-label">Êtes-vous étudiant ou enseignant ?</p>
              <div class="social-container">
                <button type="button" class="social google-option" (click)="auth.googleLogin()" aria-label="Google">
                  <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 11v3.2h5.4c-.2 1.4-1.7 4-5.4 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                  </svg>
                  {{ 'AUTH.CONTINUE_GOOGLE' | translate }}
                </button>
              </div>
              <div class="role-switch" role="tablist">
                <button type="button" class="role-option" [class.active]="signUpForm.value.role === 'ETUDIANT'"
                        (click)="signUpForm.patchValue({ role: 'ETUDIANT' })">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:4px"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>
                  {{ 'ROLES.STUDENT' | translate }}
                </button>
                <button type="button" class="role-option" [class.active]="signUpForm.value.role === 'ENSEIGNANT'"
                        (click)="signUpForm.patchValue({ role: 'ENSEIGNANT' })">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:4px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {{ 'ROLES.TEACHER' | translate }}
                </button>
              </div>
              <button type="button" class="main-btn full" (click)="regStep.set(2)">
                Suivant →
              </button>
            </div>

            <!-- Step 2: Nom, Prénom, Âge -->
            <div class="wiz-panel" *ngIf="regStep() === 2">
              <p class="step-label">Vos informations personnelles</p>
              <form [formGroup]="signUpForm" novalidate style="width:100%;display:flex;flex-direction:column;gap:0">
                <input class="input" formControlName="prenom" [class.invalid]="touched(signUpForm, 'prenom')"
                       [placeholder]="'AUTH.FIRST_NAME' | translate" autocomplete="given-name"/>
                <input class="input" formControlName="nom" [class.invalid]="touched(signUpForm, 'nom')"
                       [placeholder]="'AUTH.LAST_NAME' | translate" autocomplete="family-name"/>
                <input class="input" type="number" formControlName="age" [class.invalid]="touched(signUpForm, 'age')"
                       placeholder="Âge" min="10" max="99"/>
              </form>
              <div class="wiz-nav">
                <button type="button" class="nav-back" (click)="regStep.set(1)">← Retour</button>
                <button type="button" class="main-btn"
                        [disabled]="f(signUpForm,'prenom').invalid || f(signUpForm,'nom').invalid || f(signUpForm,'age').invalid"
                        (click)="regStep.set(3)">
                  Suivant →
                </button>
              </div>
            </div>

            
            <!-- Step 3: Identifiants (Email & Password) -->
            <div class="wiz-panel" *ngIf="regStep() === 3">
              <p class="step-label">Vos identifiants et mot de passe (3/4)</p>
              <form [formGroup]="signUpForm" novalidate style="width:100%;display:flex;flex-direction:column;gap:0">
                
                <input class="input" type="email" formControlName="email" [class.invalid]="touched(signUpForm, 'email')"
                       [placeholder]="'AUTH.EMAIL' | translate" autocomplete="email"/>
                <small class="input-error" *ngIf="touched(signUpForm, 'email') && f(signUpForm,'email').errors?.['email']">
                  Format d'email invalide.
                </small>
                <small class="input-error" *ngIf="touched(signUpForm, 'email') && f(signUpForm,'email').errors?.['plus']">
                  Le symbole « + » n'est pas autorisé.
                </small>

                <div style="margin-top:20px;"></div>

                <div class="pwd-wrap">
                  <input class="input" [type]="showPwdSignup() ? 'text' : 'password'" formControlName="password"
                         [class.invalid]="touched(signUpForm, 'password')" placeholder="Mot de passe" autocomplete="new-password"/>
                  <button type="button" class="pwd-toggle" (click)="showPwdSignup.set(!showPwdSignup())" tabindex="-1">
                    <svg *ngIf="!showPwdSignup()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg *ngIf="showPwdSignup()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
                <div class="pwd-rules" *ngIf="signUpForm.get('password')?.value">
                  <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdLength']">
                    <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdLength'] ? '✓' : '✗' }}</span>
                    Au moins 8 caractères
                  </small>
                  <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdUpper']">
                    <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdUpper'] ? '✓' : '✗' }}</span>
                    Une majuscule
                  </small>
                  <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdDigit']">
                    <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdDigit'] ? '✓' : '✗' }}</span>
                    Un chiffre
                  </small>
                  <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdSpecial']">
                    <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdSpecial'] ? '✓' : '✗' }}</span>
                    Caractère spécial (!&#64;#$...)
                  </small>
                </div>
                <div class="pwd-wrap">
                  <input class="input" [type]="showPwdConfirm() ? 'text' : 'password'" formControlName="confirmPassword"
                         placeholder="Confirmer le mot de passe" autocomplete="new-password"/>
                  <button type="button" class="pwd-toggle" (click)="showPwdConfirm.set(!showPwdConfirm())" tabindex="-1">
                    <svg *ngIf="!showPwdConfirm()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg *ngIf="showPwdConfirm()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
                <small class="input-error" *ngIf="signUpForm.get('confirmPassword')?.touched && signUpForm.get('confirmPassword')?.value !== signUpForm.get('password')?.value && signUpForm.get('confirmPassword')?.value">
                  Les mots de passe ne correspondent pas.
                </small>

              </form>
              <div class="error" *ngIf="error()">{{ error() }}</div>
              <div class="wiz-nav">
                <button type="button" class="nav-back" (click)="regStep.set(2)">← Retour</button>
                <button type="button" class="main-btn" [disabled]="!canSubmitStep3() || busy()" (click)="sendOtpForReg()">
                  <span class="spinner" *ngIf="busy()"></span>Créer mon compte →
                </button>
              </div>
            </div>

            <!-- Step 4: OTP Verification -->
            <div class="wiz-panel" *ngIf="regStep() === 4">
              <p class="step-label">Dernière étape : vérification de l'email</p>
              <p class="step-label" style="font-size:12.5px; opacity: 0.8; margin-top:-8px">Un code OTP a été envoyé à <strong>{{ pendingEmail() }}</strong></p>
              <input class="input otp-input" maxlength="6" inputmode="numeric" [value]="otpCode()"
                     (input)="onOtpInput($event)" placeholder="••••••"/>
              <div class="otp-meta">
                <span [class.warn]="remaining() < 60">Expire dans {{ formatRemaining() }}</span>
                <span>Tentative {{ attempts() }}/5</span>
              </div>
              <div class="error" *ngIf="error()">{{ error() }}</div>
              <div class="wiz-nav">
                <!-- Return to Step 3 allows fixing email or password if needed -->
                <button type="button" class="nav-back" (click)="regStep.set(3); error.set(null)">← Modifier</button>
                <button type="button" class="main-btn" [disabled]="otpCode().length !== 6 || busy() || attempts() >= 5" (click)="verifyOtpForReg()">
                  <span class="spinner" *ngIf="busy()"></span>Vérifier ✓
                </button>
              </div>
              <button type="button" class="link" (click)="resendOtp()" [disabled]="busy() || remaining() > 540">Renvoyer le code</button>
            </div>

            <!-- Step 5: Success -->
            <div class="wiz-panel" *ngIf="regStep() === 5">
              <div style="margin-bottom:4px">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#86efac" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
                </svg>
              </div>
              <h2 style="color:#86efac;margin:0">Inscription réussie !</h2>
              <p class="step-label">Votre compte est en attente d'approbation par un administrateur.</p>
              <div class="pending-info">
                <div class="pending-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <p>Vous recevrez un email de confirmation lorsque votre compte sera activé.</p>
              </div>
              <button type="button" class="main-btn full" (click)="goToPending()">Compris →</button>
            </div>
          </div>
        </div>



        <!-- Sign-in form -->
        <div class="form-container sign-in-container">
          <form [formGroup]="signInForm" (ngSubmit)="onSignIn()" class="form" novalidate>
            <h1>{{ 'AUTH.LOGIN' | translate }}</h1>
            <p class="step-label" style="margin-bottom:6px">Ravi de vous revoir sur EduFlow</p>
            <div class="social-container">
              <button type="button" class="social google-option" (click)="auth.googleLogin()" aria-label="Google">
                <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 11v3.2h5.4c-.2 1.4-1.7 4-5.4 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                </svg>
                {{ 'AUTH.CONTINUE_GOOGLE' | translate }}
              </button>
            </div>
            <div class="divider"><span>ou avec votre email</span></div>
            <input class="input" type="email" formControlName="email" [class.invalid]="touched(signInForm, 'email')"
                   [placeholder]="'AUTH.EMAIL' | translate" autocomplete="email"/>
            <div class="pwd-wrap">
              <input class="input" [type]="showPwdLogin() ? 'text' : 'password'" formControlName="password" [class.invalid]="touched(signInForm, 'password')"
                     [placeholder]="'AUTH.PASSWORD' | translate" autocomplete="current-password"/>
              <button type="button" class="pwd-toggle" (click)="showPwdLogin.set(!showPwdLogin())" tabindex="-1">
                <svg *ngIf="!showPwdLogin()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="showPwdLogin()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <a routerLink="/auth/forgot" class="link forgot-link">{{ 'AUTH.FORGOT_PASSWORD' | translate }}</a>
            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button type="submit" class="main-btn full" [disabled]="signInForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>
              {{ 'AUTH.SIGN_IN' | translate }}
            </button>
          </form>
        </div>

        <!-- Sliding overlay -->
        <div class="overlay-container">
          <div class="overlay">
            <div class="overlay-panel overlay-left">
              <h1>{{ 'AUTH.WELCOME_BACK' | translate }}</h1>
              <p>{{ 'AUTH.SIGNIN_DETAILS' | translate }}</p>
              <button type="button" class="ghost-btn" id="signIn" (click)="step.set('signin'); error.set(null)">
                {{ 'AUTH.SIGN_IN' | translate }}
              </button>
            </div>
            <div class="overlay-panel overlay-right">
              <h1>{{ 'AUTH.HELLO_STUDENT' | translate }}</h1>
              <p>{{ 'AUTH.SIGNUP_DETAILS' | translate }}</p>
              <button type="button" class="ghost-btn" id="signUp" (click)="step.set('signup'); error.set(null)">
                {{ 'AUTH.SIGN_UP' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>

      </div><!-- /auth-content -->
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    :host {
      --primary: #6c47ff;
      --primary-light: #8b6fff;
      --primary-dark: #4f32c0;
      --bg: #0b0c1e;
      --card: #13142a;
      --card-border: rgba(108,71,255,0.18);
      --input: #1c1e38;
      --input-border: rgba(255,255,255,0.08);
      --text: #f0f0ff;
      --text-dim: #8b8bab;
      --success: #22c55e;
      display: block;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    .auth-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--bg);
      position: relative;
      overflow: hidden;
      padding: 0;
    }

    .auth-shell::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 10% 10%, rgba(108,71,255,0.28) 0%, transparent 55%),
        radial-gradient(ellipse 60% 50% at 90% 90%, rgba(76,29,149,0.22) 0%, transparent 50%),
        radial-gradient(ellipse 50% 40% at 50% 50%, rgba(108,71,255,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .auth-shell::after {
      content: '';
      position: fixed;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(108,71,255,0.12) 0%, transparent 70%);
      top: -200px;
      right: -150px;
      pointer-events: none;
      z-index: 0;
      animation: float 10s ease-in-out infinite alternate;
    }

    @keyframes float {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-40px, 40px) scale(1.08); }
    }

    .topbar {
      position: relative;
      z-index: 10;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 32px;
      background: rgba(11,12,30,0.7);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(108,71,255,0.12);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text);
      font-weight: 800;
      font-size: 1.1rem;
      text-decoration: none;
      letter-spacing: -0.3px;
    }

    .brand img {
      border-radius: 10px;
      box-shadow: 0 0 0 2px rgba(108,71,255,0.4);
    }

    .topbar-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .auth-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 32px 16px;
      min-height: calc(100vh - 70px);
    }

    .container {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 28px;
      box-shadow:
        0 0 0 1px rgba(108,71,255,0.08),
        0 30px 80px rgba(0,0,0,0.6),
        0 0 60px rgba(108,71,255,0.07);
      position: relative;
      overflow: hidden;
      width: 860px;
      max-width: 100%;
      min-height: 560px;
    }

    .form-container {
      position: absolute;
      top: 0;
      height: 100%;
      transition: all 0.6s ease-in-out;
    }

    .sign-in-container {
      left: 0;
      width: 50%;
      z-index: 2;
    }

    .sign-up-container {
      left: 0;
      width: 50%;
      opacity: 0;
      z-index: 1;
    }

    .container.active .sign-in-container {
      transform: translateX(100%);
      opacity: 0;
    }

    .container.active .sign-up-container {
      transform: translateX(100%);
      opacity: 1;
      z-index: 5;
      animation: show 0.6s;
    }

    @keyframes show {
      0%, 49.99% { opacity: 0; z-index: 1; }
      50%, 100% { opacity: 1; z-index: 5; }
    }

    form, .form {
      background: var(--card);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 0 48px;
      height: 100%;
      text-align: center;
    }

    h1 {
      color: var(--text);
      margin-bottom: 6px;
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.5px;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      margin: 10px 0 6px;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.07);
    }

    .divider span {
      color: var(--text-dim);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .social-container {
      margin: 4px 0 8px;
      display: flex;
      gap: 10px;
      width: 100%;
    }

    .social {
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      height: 35px;
      width: 35px;
      color: white;
      background: transparent;
      cursor: pointer;
      transition: 0.25s ease;
      font-size: 0.86rem;
      font-weight: 700;
    }

    .google-option {
      width: 100%;
      height: 46px;
      border-radius: 14px;
      justify-content: center;
      gap: 10px;
      text-transform: none;
      font-weight: 600;
      font-size: 0.88rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text);
      transition: all 0.25s ease;
    }

    .google-option:hover {
      background: rgba(255,255,255,0.09);
      border-color: rgba(255,255,255,0.2);
      transform: translateY(-1px);
    }

    .google-icon {
      width: 18px;
      height: 18px;
      display: block;
    }

    .role-switch {
      width: 100%;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 5px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin: 8px 0;
    }

    .role-option {
      border: none;
      border-radius: 12px;
      padding: 10px 12px;
      background: transparent;
      color: var(--text-dim);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.25s ease;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .role-option.active {
      color: #fff;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      box-shadow: 0 6px 20px rgba(108,71,255,0.4);
    }

    .social:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: var(--primary);
      color: var(--primary);
    }

    .social:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      width: 100%;
    }

    .input {
      background: var(--input);
      border: 1px solid var(--input-border);
      padding: 13px 16px;
      margin: 6px 0;
      width: 100%;
      border-radius: 14px;
      color: var(--text);
      outline: none;
      font-size: 0.88rem;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .input:focus {
      border-color: rgba(108,71,255,0.6);
      box-shadow: 0 0 0 3px rgba(108,71,255,0.12);
    }

    .input::placeholder { color: rgba(255,255,255,0.25); }

    .input.invalid {
      border-color: rgba(239,68,68,0.7);
      box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
    }

    .input-error {
      width: 100%;
      text-align: left;
      margin-top: -2px;
      margin-bottom: 2px;
      color: #fca5a5;
      font-size: 12px;
    }

    .main-btn {
      border-radius: 50px;
      border: none;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: white;
      font-size: 12px;
      font-weight: 700;
      padding: 13px 45px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      cursor: pointer;
      margin-top: 12px;
      transition: all 0.25s ease;
      box-shadow: 0 8px 24px rgba(108,71,255,0.35);
      font-family: inherit;
    }

    .main-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(108,71,255,0.5);
    }

    .main-btn:active {
      transform: scale(0.97);
    }

    .main-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .full {
      width: 100%;
    }

    .overlay-container {
      position: absolute;
      top: 0;
      left: 50%;
      width: 50%;
      height: 100%;
      overflow: hidden;
      transition: transform 0.6s cubic-bezier(0.77,0,0.175,1);
      z-index: 100;
    }

    .container.active .overlay-container {
      transform: translateX(-100%);
    }

    .overlay {
      background: linear-gradient(145deg, var(--primary) 0%, var(--primary-dark) 60%, #2d1b8e 100%);
      color: #ffffff;
      position: relative;
      left: -100%;
      height: 100%;
      width: 200%;
      transform: translateX(0);
      transition: transform 0.6s cubic-bezier(0.77,0,0.175,1);
      overflow: hidden;
    }

    .overlay::before {
      content: '';
      position: absolute;
      width: 400px; height: 400px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      top: -100px; left: -80px;
    }

    .overlay::after {
      content: '';
      position: absolute;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      bottom: -60px; right: 40px;
    }

    .container.active .overlay {
      transform: translateX(50%);
    }

    .overlay-panel {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 0 44px;
      text-align: center;
      top: 0;
      height: 100%;
      width: 50%;
      transition: transform 0.6s cubic-bezier(0.77,0,0.175,1);
    }

    .overlay-panel h1 {
      font-size: 1.65rem;
      margin-bottom: 10px;
    }

    .overlay-left {
      transform: translateX(-20%);
    }

    .container.active .overlay-left {
      transform: translateX(0);
    }

    .overlay-right {
      right: 0;
      transform: translateX(0);
    }

    .container.active .overlay-right {
      transform: translateX(20%);
    }

    .ghost-btn {
      background: rgba(255,255,255,0.12);
      border: 1.5px solid rgba(255,255,255,0.5);
      border-radius: 50px;
      color: white;
      padding: 11px 40px;
      cursor: pointer;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-size: 12px;
      margin-top: 20px;
      font-family: inherit;
      transition: all 0.25s ease;
      backdrop-filter: blur(4px);
    }

    .ghost-btn:hover {
      background: rgba(255,255,255,0.22);
      transform: translateY(-2px);
    }

    .overlay-panel p {
      font-size: 13.5px;
      margin: 14px 0;
      opacity: 0.78;
      line-height: 1.6;
    }

    .forgot-link {
      align-self: flex-end;
      color: var(--text-dim);
      text-decoration: none;
      margin: 6px 0 2px;
      font-size: 13px;
    }

    .forgot-link:hover {
      color: #fff;
      text-decoration: underline;
    }

    .error {
      color: #fca5a5;
      font-size: 0.85rem;
      min-height: 1.1rem;
      width: 100%;
      text-align: left;
      margin-top: 2px;
    }

    .auth-otp-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 480px;
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 28px;
      box-shadow:
        0 0 0 1px rgba(108,71,255,0.08),
        0 30px 80px rgba(0,0,0,0.6),
        0 0 60px rgba(108,71,255,0.07);
      color: var(--text);
      padding: 40px 36px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .auth-otp-card h1 {
      margin-bottom: 4px;
    }

    .auth-otp-card .muted {
      color: var(--text-dim);
      font-size: 14px;
      line-height: 1.55;
    }

    .otp-input {
      font-size: 1.65rem;
      letter-spacing: 0.5em;
      text-align: center;
      font-weight: 700;
    }

    .otp-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--text-dim);
      font-size: 12px;
      padding: 0 2px;
    }

    .otp-meta .warn {
      color: #f59e0b;
      font-weight: 700;
    }

    .link {
      border: none;
      background: none;
      color: var(--primary-light);
      cursor: pointer;
      text-align: left;
      padding: 0;
      margin-top: 4px;
      font-size: 13px;
      font-family: inherit;
      transition: color 0.2s;
    }

    .link:hover { color: #fff; }

    .pwd-rules {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: -2px;
      margin-bottom: 4px;
    }

    .rule {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: #fca5a5;
      text-align: left;
      transition: color 0.2s ease;
    }

    .rule.ok {
      color: #86efac;
    }

    .rule-icon {
      font-weight: 700;
      font-size: 13px;
      min-width: 14px;
    }

    .wizard-progress {
      display: flex;
      align-items: center;
      gap: 0;
      width: 100%;
      margin-bottom: 16px;
    }

    .wizard-step {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      border: 2px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.04);
      transition: all 0.35s ease;
      flex-shrink: 0;
    }

    .wizard-step.active {
      border-color: var(--primary);
      color: #fff;
      background: var(--primary);
      box-shadow: 0 0 0 4px rgba(108,71,255,0.2);
    }

    .wizard-step.done {
      border-color: var(--success);
      color: #fff;
      background: var(--success);
      box-shadow: 0 0 0 4px rgba(34,197,94,0.15);
    }

    .wizard-line {
      flex: 1;
      height: 2px;
      background: rgba(255,255,255,0.08);
      transition: background 0.4s ease;
      border-radius: 2px;
    }

    .wizard-line.done { background: var(--success); }

    .wiz-panel {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: none; }
    }

    .step-label {
      color: var(--text-dim);
      font-size: 0.87rem;
      margin: 0 0 4px;
      line-height: 1.45;
    }

    .wiz-nav {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 10px;
      align-items: center;
    }

    .nav-back {
      background: none;
      border: none;
      color: var(--primary-light);
      cursor: pointer;
      font-size: 13px;
      padding: 8px 0;
      font-family: inherit;
      transition: color 0.2s;
    }

    .nav-back:hover { color: #fff; }

    .pending-info {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      width: 100%;
      background: rgba(108,71,255,0.08);
      border: 1px solid rgba(108,71,255,0.2);
      border-radius: 14px;
      padding: 16px;
      text-align: left;
    }

    .pending-icon { flex-shrink: 0; }
    .pending-info p { color: var(--text-dim); font-size: 0.83rem; margin: 0; line-height: 1.5; }

    .spinner {
      width: 13px;
      height: 13px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
      vertical-align: -2px;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .pwd-wrap {
      width: 100%;
      position: relative;
    }

    .pwd-wrap .input {
      padding-right: 42px;
    }

    .pwd-toggle {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #a0a0a0;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
    }

    .pwd-toggle:hover {
      color: #fff;
    }

    .btn, .btn-primary, .btn-outline {
      border-radius: 50px;
      border: none;
      padding: 12px 28px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
      font-family: inherit;
      transition: all 0.25s ease;
      width: 100%;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: white;
      box-shadow: 0 8px 24px rgba(108,71,255,0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(108,71,255,0.5);
    }

    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

    .btn-outline {
      background: transparent;
      border: 1px solid rgba(108,71,255,0.4);
      color: var(--primary-light);
    }

    .btn-outline:hover:not(:disabled) {
      border-color: var(--primary);
      background: rgba(108,71,255,0.08);
    }

    .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-lg { padding: 14px 28px; font-size: 14px; }

    @media (max-width: 900px) {
      .container { min-height: 560px; }
      form { padding: 0 28px; }
      .topbar { padding: 14px 20px; }
    }

    @media (max-width: 760px) {
      .container {
        width: 100%;
        min-height: auto;
        border-radius: 20px;
      }

      .form-container {
        position: relative;
        width: 100%;
        height: auto;
      }

      .sign-up-container { opacity: 1; }

      .sign-in-container,
      .sign-up-container,
      .container.active .sign-in-container,
      .container.active .sign-up-container {
        transform: none;
      }

      .container:not(.active) .sign-up-container,
      .container.active .sign-in-container {
        display: none;
      }

      .overlay-container { display: none; }

      form { padding: 28px 22px; }

      .auth-content { padding: 20px 12px; }

      .topbar { padding: 14px 16px; }

      .name-row { grid-template-columns: 1fr; gap: 0; }
    }
  `],
})
export class AuthPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  readonly auth = inject(AuthService);

  step = signal<'signin' | 'signup' | 'otp' | 'otp2fa' | 'googleOptional'>('signin');
  busy = signal(false);
  error = signal<string | null>(null);
  showPwdLogin = signal(false);
  showPwdSignup = signal(false);
  showPwdConfirm = signal(false);
  pendingEmail = signal('');
  otpCode = signal('');
  mfaTicket = signal('');
  googleRegTicket = signal('');
  optionalPwd = signal('');
  attempts = signal(0);
  mfaAttempts = signal(0);
  regStep = signal(1);
  emailVerified = signal(false);
  otpSent = signal(false);

  private otpStartedAt = 0;
  remaining = signal(0);
  formatRemaining = computed(() => {
    const r = Math.max(0, this.remaining());
    const m = Math.floor(r / 60); const s = r % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  signInForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email, emailNoPlus]],
    password: ['', [Validators.required]],
  });
  signUpForm = this.fb.group({
    prenom:          ['', [Validators.required, Validators.minLength(2)]],
    nom:             ['', [Validators.required, Validators.minLength(2)]],
    age:             [null as number | null, [Validators.required, Validators.min(10), Validators.max(99)]],
    email:           ['', [Validators.required, Validators.email, emailNoPlus]],
    password:        ['', [Validators.required, pwdLength, pwdUpper, pwdDigit, pwdSpecial]],
    confirmPassword: ['', [Validators.required]],
    role:            ['ETUDIANT' as 'ETUDIANT' | 'ENSEIGNANT', [Validators.required]],
  });

  f(form: FormGroup, name: string): AbstractControl { return form.controls[name]; }
  touched(form: FormGroup, name: string): boolean { return this.f(form, name).touched && this.f(form, name).invalid; }

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    const oauthError = this.route.snapshot.queryParamMap.get('error');
    if (!code && !oauthError) return;

    this.step.set('signin');
    if (oauthError) {
      this.error.set('Connexion Google annulée. Réessayez.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      return;
    }

    if (!this.auth.validateGoogleState(state)) {
      this.error.set('Session Google invalide. Réessayez la connexion.');
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    const redirectUri = this.auth.consumeGoogleRedirectUri() ?? window.location.href.split('?')[0];
    this.auth.loginWithGoogleCode({ code: code!, redirectUri }).subscribe({
      next: (res: any) => {
        this.busy.set(false);
        if (res.requiresRegistration) {
          this.googleRegTicket.set(res.registerTicket);
          this.step.set('googleOptional');
        } else {
          this.router.navigateByUrl(this.auth.defaultRouteForRole(res.role));
        }
      },
      error: e => {
        this.busy.set(false);
        const backendMessage = e?.error?.message;
        this.error.set(backendMessage || this.translate.instant('ERRORS.GENERIC'));
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      },
    });
  }

  onSignIn(): void {
    this.signInForm.markAllAsTouched();
    if (this.signInForm.invalid) return;
    const v = this.signInForm.getRawValue();
    this.busy.set(true); this.error.set(null);
    this.auth.login({ email: v.email!, password: v.password! }).subscribe({
      next: (res: any) => { 
        this.busy.set(false);
        if (res.mfaRequired) {
          this.mfaTicket.set(res.ticket);
          this.otpCode.set('');
          this.step.set('otp2fa');
        } else {
          const status = res.statutCompte ?? res.status ?? 'ACTIVE';
          if (status === 'PENDING_APPROVAL' || status === 'PENDING') {
            this.router.navigateByUrl('/pending');
          } else if (status === 'BLOCKED') {
            this.error.set('🚫 Votre compte est bloqué. Contactez l\'administrateur.');
          } else {
            this.router.navigateByUrl(this.auth.defaultRouteForRole(res.role)); 
          }
        }
      },
      error: e => {
        this.busy.set(false);
        this.error.set(this.translateError(e?.error?.code) ?? this.translate.instant('AUTH.ERR_INVALID_CREDENTIALS'));
      },
    });
  }

  onSignUp(): void {
    this.signUpForm.markAllAsTouched();
    if (this.signUpForm.invalid) return;
    const v = this.signUpForm.getRawValue();
    this.busy.set(true); this.error.set(null);
    this.auth.register({
      email: v.email!, password: v.password!, prenom: v.prenom!, nom: v.nom!,
      role: v.role!,
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.pendingEmail.set(v.email!); this.attempts.set(0); this.otpCode.set('');
        this.startOtpTimer();
        this.step.set('otp');
      },
      error: e => {
        this.busy.set(false);
        this.error.set(this.translateError(e?.error?.code) ?? this.translate.instant('ERRORS.GENERIC'));
      },
    });
  }

  onOtpInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '').slice(0, 6);
    this.otpCode.set(v);
  }

  submitOtp(): void {
    if (this.attempts() >= 5) {
      this.error.set('🚫 Nombre maximum de tentatives (5) atteint. Renvoyez un nouveau code.');
      return;
    }
    if (this.remaining() <= 0) {
      this.error.set('⏳ Le code OTP a expiré. Veuillez en renvoyer un nouveau.');
      return;
    }
    this.busy.set(true); this.error.set(null);
    this.attempts.update(n => n + 1);
    this.auth.verifyOtp({ email: this.pendingEmail(), code: this.otpCode(), purpose: 'REGISTRATION' }).subscribe({
      next: u => {
        this.busy.set(false);
        // Étape 28 du diagramme : Inscription terminée, connexion automatique
        this.router.navigateByUrl(this.auth.defaultRouteForRole(u.role));
      },
      error: e => {
        this.busy.set(false);
        const code = e?.error?.code;
        if (code === 'OTP_EXPIRED') {
          this.error.set('⏳ Le code OTP a expiré. Veuillez en renvoyer un nouveau.');
          this.remaining.set(0);
        } else if (code === 'OTP_MAX_ATTEMPTS' || this.attempts() >= 5) {
          this.error.set('🚫 Code incorrect. Tentative 5/5 atteinte. Renvoyez un nouveau code.');
        } else {
          this.error.set(`❌ Code incorrect. Veuillez réessayer (tentative ${this.attempts()}/5).`);
        }
      },
    });
  }

  resendOtp(): void {
    if (!this.pendingEmail()) return;
    // Étape 33 du diagramme : demande de renvoi d'OTP via le bon endpoint
    const v = this.signUpForm.getRawValue();
    this.busy.set(true); this.error.set(null);
    this.auth.register({
      email: this.pendingEmail(),
      password: v.password ?? '',
      prenom: v.prenom ?? '',
      nom: v.nom ?? '',
      role: v.role ?? 'ETUDIANT',
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.startOtpTimer();
        this.attempts.set(0);
        this.otpCode.set('');
        this.error.set(null);
      },
      error: () => { this.busy.set(false); this.startOtpTimer(); }
    });
  }

  onOptionalPwdInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.optionalPwd.set(v);
  }

  submit2fa(): void {
    if (this.mfaAttempts() >= 3) {
      this.error.set('🚫 3 tentatives échouées. Compte temporairement bloqué pendant 15 minutes.');
      return;
    }
    this.busy.set(true); this.error.set(null);
    this.mfaAttempts.update(n => n + 1);
    this.auth.verify2fa({ ticket: this.mfaTicket(), code: this.otpCode() }).subscribe({
      next: u => { this.busy.set(false); this.router.navigateByUrl(this.auth.defaultRouteForRole(u.role)); },
      error: e => {
        this.busy.set(false);
        const code = e?.error?.code;
        if (code === 'ACCOUNT_BLOCKED' || code === 'MFA_BLOCKED') {
          this.mfaAttempts.set(3);
          this.error.set('🚫 Compte temporairement bloqué pendant 15 minutes. Réessayez plus tard.');
        } else if (this.mfaAttempts() >= 3) {
          this.error.set('🚫 3 tentatives échouées. Compte temporairement bloqué pendant 15 minutes.');
        } else {
          this.error.set(`❌ Code 2FA invalide ou expiré. Tentative ${this.mfaAttempts()}/3.`);
        }
      },
    });
  }

  completeGoogle(): void {
    this.busy.set(true); this.error.set(null);
    this.auth.completeGoogleRegistration({ registerTicket: this.googleRegTicket(), optionalPassword: this.optionalPwd() }).subscribe({
      next: u => { this.busy.set(false); this.router.navigateByUrl(this.auth.defaultRouteForRole(u.role)); },
      error: e => {
        this.busy.set(false);
        this.error.set(e?.error?.message ?? "Erreur lors de la finalisation.");
      },
    });
  }

  private startOtpTimer(): void {
    this.otpStartedAt = Date.now();
    this.remaining.set(600);
    const tick = () => {
      const elapsed = Math.floor((Date.now() - this.otpStartedAt) / 1000);
      this.remaining.set(Math.max(0, 600 - elapsed));
      if ((this.step() === 'otp' || this.regStep() === 3) && this.remaining() > 0)
        requestAnimationFrame(() => setTimeout(tick, 1000));
    };
    tick();
  }

  // ── Multi-step registration wizard methods ──

  sendOtpForReg(): void {
    const v = this.signUpForm.getRawValue();
    this.busy.set(true); this.error.set(null);
    this.auth.register({
      email: v.email!, password: v.password!, prenom: v.prenom!, nom: v.nom!, role: v.role!,
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.pendingEmail.set(v.email!);
        this.attempts.set(0);
        this.otpCode.set('');
        this.otpSent.set(true);
        this.emailVerified.set(false);
        this.startOtpTimer();
        this.regStep.set(4);
      },
      error: (e: any) => {
        this.busy.set(false);
        this.error.set(this.translateError(e?.error?.code) ?? e?.error?.message ?? this.translate.instant('ERRORS.GENERIC'));
      },
    });
  }


  verifyOtpForReg(): void {
    if (this.attempts() >= 5) {
      this.error.set('🚫 Nombre maximum de tentatives atteint. Renvoyez un nouveau code.');
      return;
    }
    if (this.remaining() <= 0) {
      this.error.set('⏳ Le code a expiré. Renvoyez un nouveau code.');
      return;
    }
    this.busy.set(true); this.error.set(null);
    this.attempts.update(n => n + 1);
    this.auth.verifyOtp({ email: this.pendingEmail(), code: this.otpCode(), purpose: 'REGISTRATION' }).subscribe({
      next: () => {
        this.busy.set(false);
        this.emailVerified.set(true);
        this.otpSent.set(false);
        this.regStep.set(5);
      },
      error: (e: any) => {
        this.busy.set(false);
        const code = e?.error?.code;
        if (code === 'OTP_EXPIRED') {
          this.error.set('⏳ Le code a expiré. Renvoyez un nouveau.');
          this.remaining.set(0);
        } else if (this.attempts() >= 5) {
          this.error.set('🚫 5/5 tentatives. Renvoyez un nouveau code.');
        } else {
          this.error.set(`❌ Code incorrect. Tentative ${this.attempts()}/5.`);
        }
      },
    });
  }


  canSubmitStep3(): boolean {
    const v = this.signUpForm.getRawValue();
    return !this.f(this.signUpForm, 'email').invalid
        && !this.f(this.signUpForm, 'password').invalid
        && !!v.confirmPassword
        && v.password === v.confirmPassword;
  }

  

  goToPending(): void {
    this.router.navigateByUrl('/pending');
  }

  private translateError(code?: string): string | null {
    if (!code) return null;
    const map: Record<string, string> = {
      INVALID_CREDENTIALS: 'AUTH.ERR_INVALID_CREDENTIALS',
      ACCOUNT_BLOCKED:     'AUTH.ERR_BLOCKED',
      OTP_INVALID:         'AUTH.ERR_OTP_INVALID',
      OTP_EXPIRED:         'AUTH.ERR_OTP_EXPIRED',
      EMAIL_TAKEN:         'AUTH.ERR_EMAIL_TAKEN',
      VALIDATION:          'ERRORS.GENERIC',
    };
    const key = map[code];
    return key ? this.translate.instant(key) : null;
  }
}
