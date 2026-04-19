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
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="url(#agg)"/>
            <defs><linearGradient id="agg" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/>
            </linearGradient></defs>
            <path d="M9 16l5 5 9-10" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          <span>EduFlow</span>
        </a>
        <div class="topbar-actions">
          <app-language-switcher></app-language-switcher>
          <app-theme-toggle></app-theme-toggle>
        </div>
      </div>

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
        <button class="btn btn-primary btn-lg full" (click)="submitOtp()" [disabled]="otpCode().length !== 6 || busy()">
          <span class="spinner" *ngIf="busy()"></span>{{ 'AUTH.OTP_VERIFY' | translate }}
        </button>
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
        <button class="btn btn-primary btn-lg full" (click)="submit2fa()" [disabled]="otpCode().length !== 6 || busy()">
          <span class="spinner" *ngIf="busy()"></span>Vérifier
        </button>
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

      <div class="auth-otp-card fade-up" *ngIf="step() === 'signupPending'">
        <h1>Inscription réussie</h1>
        <p class="muted">
          Votre compte a été créé et reste en attente de validation administrateur.
          Vous recevrez un email de confirmation ou de refus.
        </p>
        <button class="btn btn-primary btn-lg full" (click)="goToSignInAfterPending()">
          Aller à la connexion
        </button>
      </div>

      <!-- Sliding login/signup -->
      <div class="container auth-slider fade-up" *ngIf="step() === 'signin' || step() === 'signup'"
           [class.active]="step() === 'signup'">
        <!-- Sign-up form -->
        <div class="form-container sign-up-container">
          <form [formGroup]="signUpForm" (ngSubmit)="onSignUp()" class="form" novalidate>
            <h1>{{ 'AUTH.REGISTER' | translate }}</h1>
            <div class="social-container">
              <button type="button" class="social google-option" (click)="auth.googleLogin()" aria-label="Google">
                <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 11v3.2h5.4c-.2 1.4-1.7 4-5.4 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                </svg>
                {{ 'AUTH.CONTINUE_GOOGLE' | translate }}
              </button>
            </div>
            <div class="role-switch" role="tablist" aria-label="Role">
              <button type="button" class="role-option" [class.active]="signUpForm.value.role === 'ETUDIANT'"
                      (click)="signUpForm.patchValue({ role: 'ETUDIANT' })">
                {{ 'ROLES.STUDENT' | translate }}
              </button>
              <button type="button" class="role-option" [class.active]="signUpForm.value.role === 'ENSEIGNANT'"
                      (click)="signUpForm.patchValue({ role: 'ENSEIGNANT' })">
                {{ 'ROLES.TEACHER' | translate }}
              </button>
            </div>

            <div *ngIf="signUpStage() === 1" class="full">
              <div class="name-row">
                <input class="input" formControlName="prenom" [class.invalid]="touched(signUpForm, 'prenom')"
                      [placeholder]="'AUTH.FIRST_NAME' | translate" autocomplete="given-name"/>
                <input class="input" formControlName="nom" [class.invalid]="touched(signUpForm, 'nom')"
                      [placeholder]="'AUTH.LAST_NAME' | translate" autocomplete="family-name"/>
              </div>
              <input class="input" type="number" formControlName="age" [class.invalid]="touched(signUpForm, 'age')"
                    [placeholder]="'AUTH.AGE' | translate" [attr.aria-label]="'AUTH.AGE' | translate" />
              <button type="submit" class="main-btn full" [disabled]="busy()">
                Continuer
              </button>
            </div>

            <div *ngIf="signUpStage() === 2" class="full">
              <input class="input" formControlName="adresse" [class.invalid]="touched(signUpForm, 'adresse')"
                    [placeholder]="'AUTH.ADDRESS' | translate" [attr.aria-label]="'AUTH.ADDRESS' | translate" />
              <input class="input" type="email" formControlName="email" [class.invalid]="touched(signUpForm, 'email')"
                    [placeholder]="'AUTH.EMAIL' | translate" autocomplete="email"/>
              <small class="input-error" *ngIf="touched(signUpForm, 'email') && f(signUpForm,'email').errors?.['email']">
                Format d'email invalide.
              </small>
              <small class="input-error" *ngIf="touched(signUpForm, 'email') && f(signUpForm,'email').errors?.['plus']">
                4. Erreur : le symbole « + » n'est pas autorisé.
              </small>
              <input class="input" type="password" formControlName="password" [class.invalid]="touched(signUpForm, 'password')"
                    [placeholder]="'AUTH.PASSWORD' | translate" autocomplete="new-password"/>
              <input class="input" type="password" formControlName="confirmPassword" [class.invalid]="touched(signUpForm, 'confirmPassword')"
                    [placeholder]="'AUTH.CONFIRM_PASSWORD' | translate" autocomplete="new-password"/>
              <div class="pwd-rules" *ngIf="signUpForm.get('password')?.value">
                <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdLength']">
                  <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdLength'] ? '✓' : '✗' }}</span>
                  5. Le mot de passe doit contenir au moins 8 caractères
                </small>
                <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdUpper']">
                  <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdUpper'] ? '✓' : '✗' }}</span>
                  6. Le mot de passe doit contenir au moins une lettre majuscule
                </small>
                <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdDigit']">
                  <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdDigit'] ? '✓' : '✗' }}</span>
                  7. Le mot de passe doit contenir au moins un chiffre
                </small>
                <small class="rule" [class.ok]="!f(signUpForm,'password').errors?.['pwdSpecial']">
                  <span class="rule-icon">{{ !f(signUpForm,'password').errors?.['pwdSpecial'] ? '✓' : '✗' }}</span>
                  8. Le mot de passe doit contenir au moins un caractère spécial (!&#64;#$...)
                </small>
              </div>
              <div class="error" *ngIf="error()">{{ error() }}</div>
              <button type="submit" class="main-btn full" [disabled]="signUpForm.invalid || busy()">
                <span class="spinner" *ngIf="busy()"></span>
                {{ 'AUTH.SIGN_UP' | translate }}
              </button>
              <button type="button" class="link" (click)="goBackSignUpStage()">← {{ 'BUTTONS.BACK' | translate }}</button>
            </div>
          </form>
        </div>

        <!-- Sign-in form -->
        <div class="form-container sign-in-container">
          <form [formGroup]="signInForm" (ngSubmit)="onSignIn()" class="form" novalidate>
            <h1>{{ 'AUTH.LOGIN' | translate }}</h1>
            <div class="social-container">
              <button type="button" class="social google-option" (click)="auth.googleLogin()" aria-label="Google">
                <svg class="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 11v3.2h5.4c-.2 1.4-1.7 4-5.4 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                </svg>
                {{ 'AUTH.CONTINUE_GOOGLE' | translate }}
              </button>
            </div>
            <div class="role-switch" role="tablist" aria-label="Role">
              <button type="button" class="role-option" [class.active]="signInForm.value.role === 'ETUDIANT'"
                      (click)="signInForm.patchValue({ role: 'ETUDIANT' })">
                {{ 'ROLES.STUDENT' | translate }}
              </button>
              <button type="button" class="role-option" [class.active]="signInForm.value.role === 'ENSEIGNANT'"
                      (click)="signInForm.patchValue({ role: 'ENSEIGNANT' })">
                {{ 'ROLES.TEACHER' | translate }}
              </button>
            </div>
            <input class="input" type="email" formControlName="email" [class.invalid]="touched(signInForm, 'email')"
                   [placeholder]="'AUTH.EMAIL' | translate" autocomplete="email"/>
            <input class="input" type="password" formControlName="password" [class.invalid]="touched(signInForm, 'password')"
                   [placeholder]="'AUTH.PASSWORD' | translate" autocomplete="current-password"/>
            <a routerLink="/auth/forgot" class="link forgot-link">{{ 'AUTH.FORGOT_PASSWORD' | translate }}</a>
            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button type="submit" class="main-btn full" [disabled]="signInForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>
              {{ 'AUTH.SIGN_IN' | translate }}
            </button>
          </form>
        </div>

        <!-- Sliding overlay -->
        <div class="overlay-container" aria-hidden="true">
          <div class="overlay">
            <div class="overlay-panel overlay-left">
              <h1>{{ 'AUTH.WELCOME_BACK' | translate }}</h1>
              <p>{{ 'AUTH.SIGNIN_DETAILS' | translate }}</p>
              <button type="button" class="ghost-btn" id="signIn" (click)="step.set('signin'); signUpStage.set(1); error.set(null)">
                {{ 'AUTH.SIGN_IN' | translate }}
              </button>
            </div>
            <div class="overlay-panel overlay-right">
              <h1>{{ 'AUTH.HELLO_STUDENT' | translate }}</h1>
              <p>{{ 'AUTH.SIGNUP_DETAILS' | translate }}</p>
              <button type="button" class="ghost-btn" id="signUp" (click)="step.set('signup'); signUpStage.set(1); error.set(null)">
                {{ 'AUTH.SIGN_UP' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #5e43f3;
      --bg: #eae5e5;
      --card: #1a1a1a;
      --input: #252525;
      --text: #ffffff;
      --text-dim: #a0a0a0;
      display: block;
    }

    .auth-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 16px;
      background:
        radial-gradient(circle at 12% 16%, rgba(94, 67, 243, 0.16), transparent 32%),
        radial-gradient(circle at 88% 84%, rgba(94, 67, 243, 0.12), transparent 34%),
        var(--bg);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .topbar {
      width: 100%;
      max-width: 920px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 5;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1f1f1f;
      font-weight: 700;
      text-decoration: none;
    }

    .topbar-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .container {
      background-color: var(--card);
      border-radius: 30px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      position: relative;
      overflow: hidden;
      width: 800px;
      max-width: 100%;
      min-height: 530px;
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

    form {
      background-color: var(--card);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 0 40px;
      height: 100%;
      text-align: center;
    }

    h1 {
      color: var(--text);
      margin-bottom: 14px;
      font-size: 1.8rem;
      line-height: 1.15;
    }

    .social-container {
      margin: 12px 0;
      display: flex;
      gap: 10px;
      width: 100%;
    }

    .social {
      border: 1px solid #333;
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
      text-transform: lowercase;
    }

    .google-option {
      width: 100%;
      height: 44px;
      border-radius: 12px;
      justify-content: center;
      gap: 10px;
      text-transform: none;
      font-weight: 600;
      background: #202020;
    }

    .google-icon {
      width: 18px;
      height: 18px;
      display: block;
    }

    .role-switch {
      width: 100%;
      background: #101010;
      border-radius: 14px;
      padding: 4px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 2px;
      margin-bottom: 6px;
    }

    .role-option {
      border: none;
      border-radius: 10px;
      padding: 9px 10px;
      background: transparent;
      color: #a0a0a0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.4px;
      cursor: pointer;
      transition: all 0.25s ease;
      text-transform: uppercase;
    }

    .role-option.active {
      color: #fff;
      background: linear-gradient(135deg, #5e43f3, #7f6af8);
      box-shadow: 0 8px 18px rgba(94, 67, 243, 0.35);
      transform: translateY(-1px);
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
      background-color: var(--input);
      border: 1px solid transparent;
      padding: 12px 15px;
      margin: 8px 0;
      width: 100%;
      border-radius: 12px;
      color: white;
      outline: none;
    }

    .input.invalid {
      border-color: #ef4444;
    }

    .input-error {
      width: 100%;
      text-align: left;
      margin-top: -4px;
      margin-bottom: 2px;
      color: #fca5a5;
      font-size: 12px;
    }

    .main-btn {
      border-radius: 50px;
      border: none;
      background-color: var(--primary);
      color: white;
      font-size: 12px;
      font-weight: bold;
      padding: 12px 45px;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      margin-top: 15px;
      transition: transform 0.1s ease, opacity 0.2s ease;
    }

    .main-btn:active {
      transform: scale(0.95);
    }

    .main-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
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
      transition: transform 0.6s ease-in-out;
      z-index: 100;
    }

    .container.active .overlay-container {
      transform: translateX(-100%);
    }

    .overlay {
      background: var(--primary);
      color: #ffffff;
      position: relative;
      left: -100%;
      height: 100%;
      width: 200%;
      transform: translateX(0);
      transition: transform 0.6s ease-in-out;
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
      padding: 0 40px;
      text-align: center;
      top: 0;
      height: 100%;
      width: 50%;
      transition: transform 0.6s ease-in-out;
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
      background-color: transparent;
      border: 1px solid white;
      border-radius: 50px;
      color: white;
      padding: 10px 40px;
      cursor: pointer;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 20px;
    }

    .overlay-panel p {
      font-size: 14px;
      margin: 20px 0;
      opacity: 0.85;
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
      width: 100%;
      max-width: 460px;
      background: var(--card);
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      color: var(--text);
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .auth-otp-card .muted {
      color: var(--text-dim);
      font-size: 14px;
    }

    .otp-input {
      font-size: 1.55rem;
      letter-spacing: 0.45em;
      text-align: center;
    }

    .otp-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: var(--text-dim);
      font-size: 12px;
    }

    .otp-meta .warn {
      color: #f59e0b;
      font-weight: 700;
    }

    .link {
      border: none;
      background: none;
      color: #d1c8ff;
      cursor: pointer;
      text-align: left;
      padding: 0;
      margin-top: 4px;
      font-size: 13px;
    }

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

    @media (max-width: 900px) {
      .container {
        min-height: 560px;
      }

      form {
        padding: 0 24px;
      }
    }

    @media (max-width: 760px) {
      .auth-shell {
        padding: 12px;
      }

      .topbar {
        max-width: 520px;
      }

      .container {
        width: 100%;
        min-height: auto;
        border-radius: 24px;
      }

      .form-container {
        position: relative;
        width: 100%;
        height: auto;
      }

      .sign-up-container {
        opacity: 1;
      }

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

      .overlay-container {
        display: none;
      }

      form {
        padding: 26px 20px;
      }

      .name-row {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }
  `],
})
export class AuthPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  readonly auth = inject(AuthService);

  step = signal<'signin' | 'signup' | 'otp' | 'otp2fa' | 'googleOptional' | 'signupPending'>('signin');
  signUpStage = signal<1 | 2>(1);
  busy = signal(false);
  error = signal<string | null>(null);
  pendingEmail = signal('');
  otpCode = signal('');
  mfaTicket = signal('');
  googleRegTicket = signal('');
  optionalPwd = signal('');
  attempts = signal(0);

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
    role:     ['ETUDIANT' as 'ETUDIANT' | 'ENSEIGNANT', [Validators.required]],
  });
  signUpForm = this.fb.group({
    prenom:   ['', [Validators.required, Validators.minLength(2)]],
    nom:      ['', [Validators.required, Validators.minLength(2)]],
    age:      [18, [Validators.required, Validators.min(5), Validators.max(120)]],
    adresse:  ['', [Validators.required, Validators.minLength(5)]],
    email:    ['', [Validators.required, Validators.email, emailNoPlus]],
    password: ['', [Validators.required, pwdLength, pwdUpper, pwdDigit, pwdSpecial]],
    confirmPassword: ['', [Validators.required]],
    role:     ['ETUDIANT' as 'ETUDIANT' | 'ENSEIGNANT', [Validators.required]],
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
          this.router.navigateByUrl(this.auth.defaultRouteForRole(res.role, res));
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
          const expectedRole = this.signInForm.value.role;
          if ((res.role === 'ETUDIANT' || res.role === 'ENSEIGNANT') && expectedRole && expectedRole !== res.role) {
            this.error.set('Le rôle choisi ne correspond pas à votre compte.');
            return;
          }
          this.router.navigateByUrl(this.auth.defaultRouteForRole(res.role, res)); 
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
    const v = this.signUpForm.getRawValue();
    if (this.signUpStage() === 1) {
      const prenomOk = this.f(this.signUpForm, 'prenom').valid;
      const nomOk = this.f(this.signUpForm, 'nom').valid;
      const ageOk = this.f(this.signUpForm, 'age').valid;
      if (!prenomOk || !nomOk || !ageOk) return;
      this.signUpStage.set(2);
      return;
    }
    if (this.signUpForm.invalid) return;
    if (v.password !== v.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.busy.set(true); this.error.set(null);
    this.auth.register({
      email: v.email!, password: v.password!, prenom: v.prenom!, nom: v.nom!,
      age: Number(v.age!), adresse: v.adresse!,
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
      this.error.set('31. Code incorrect. Nombre maximum de tentatives (5) atteint.');
      return;
    }
    this.busy.set(true); this.error.set(null);
    this.attempts.update(n => n + 1);
    this.auth.verifyOtp({ email: this.pendingEmail(), code: this.otpCode(), purpose: 'REGISTRATION' }).subscribe({
      next: () => {
        this.busy.set(false);
        this.step.set('signupPending');
      },
      error: e => {
        this.busy.set(false);
        if (this.attempts() >= 5) {
          this.error.set('31. Code incorrect. Veuillez réessayer (tentative 5/5 atteinte). Renvoyez un nouveau code.');
        } else {
          this.error.set(`31. Code incorrect. Veuillez réessayer (tentative ${this.attempts()}/5).`);
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
      age: Number(v.age ?? 18),
      adresse: v.adresse ?? '',
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
    this.busy.set(true); this.error.set(null);
    this.auth.verify2fa({ ticket: this.mfaTicket(), code: this.otpCode() }).subscribe({
      next: u => { this.busy.set(false); this.router.navigateByUrl(this.auth.defaultRouteForRole(u.role, u)); },
      error: e => {
        this.busy.set(false);
        this.error.set(e?.error?.message ?? "Code 2FA invalide ou expiré.");
      },
    });
  }

  completeGoogle(): void {
    this.busy.set(true); this.error.set(null);
    this.auth.completeGoogleRegistration({ registerTicket: this.googleRegTicket(), optionalPassword: this.optionalPwd() }).subscribe({
      next: u => { this.busy.set(false); this.router.navigateByUrl(this.auth.defaultRouteForRole(u.role, u)); },
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
      if (this.step() === 'otp' && this.remaining() > 0) requestAnimationFrame(() => setTimeout(tick, 1000));
    };
    tick();
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

  goBackSignUpStage(): void {
    this.signUpStage.set(1);
  }

  goToSignInAfterPending(): void {
    this.step.set('signin');
    this.signUpStage.set(1);
    this.error.set(null);
    this.otpCode.set('');
  }
}
