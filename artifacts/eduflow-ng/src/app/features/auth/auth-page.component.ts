import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

const PWD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]:;"'<>,.?/\\|`~]).{8,}$/;
function emailNoPlus(c: AbstractControl) {
  if (!c.value) return null;
  return String(c.value).includes('+') ? { plus: true } : null;
}

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, ThemeToggleComponent, LanguageSwitcherComponent],
  template: `
    <div class="auth-shell">
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>

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
      <div class="card otp-card glass fade-up" *ngIf="step() === 'otp'">
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

      <!-- Sliding login/signup -->
      <div class="auth-container fade-up" *ngIf="step() === 'signin' || step() === 'signup'"
           [class.signup-active]="step() === 'signup'">
        <!-- Sign-up form -->
        <div class="panel panel-signup">
          <form [formGroup]="signUpForm" (ngSubmit)="onSignUp()" class="form" novalidate>
            <h1>{{ 'AUTH.REGISTER' | translate }}</h1>
            <button type="button" class="btn social" (click)="auth.googleLogin()">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 11v3.2h5.4c-.2 1.4-1.7 4-5.4 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
              </svg>
              {{ 'AUTH.CONTINUE_GOOGLE' | translate }}
            </button>
            <span class="divider">{{ 'AUTH.OR_USE_EMAIL' | translate }}</span>
            <input class="input" formControlName="prenom" [class.invalid]="touched(signUpForm, 'prenom')"
                   [placeholder]="'AUTH.FIRST_NAME' | translate" autocomplete="given-name"/>
            <input class="input" formControlName="nom" [class.invalid]="touched(signUpForm, 'nom')"
                   [placeholder]="'AUTH.LAST_NAME' | translate" autocomplete="family-name"/>
            <input class="input" type="email" formControlName="email" [class.invalid]="touched(signUpForm, 'email')"
                   [placeholder]="'AUTH.EMAIL' | translate" autocomplete="email"/>
            <small class="input-error" *ngIf="touched(signUpForm, 'email') && f(signUpForm,'email').errors?.['plus']">
              {{ 'AUTH.NO_PLUS_IN_EMAIL' | translate }}
            </small>
            <input class="input" type="password" formControlName="password" [class.invalid]="touched(signUpForm, 'password')"
                   [placeholder]="'AUTH.PASSWORD' | translate" autocomplete="new-password"/>
            <small class="input-error" *ngIf="touched(signUpForm, 'password') && f(signUpForm,'password').errors?.['pattern']">
              {{ 'AUTH.PASSWORD_RULES' | translate }}
            </small>
            <select class="input" formControlName="role">
              <option value="ETUDIANT">{{ 'ROLES.STUDENT' | translate }}</option>
              <option value="ENSEIGNANT">{{ 'ROLES.TEACHER' | translate }}</option>
            </select>
            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button type="submit" class="btn btn-primary btn-lg full" [disabled]="signUpForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>{{ 'AUTH.SIGN_UP' | translate }}
            </button>
          </form>
        </div>

        <!-- Sign-in form -->
        <div class="panel panel-signin">
          <form [formGroup]="signInForm" (ngSubmit)="onSignIn()" class="form" novalidate>
            <h1>{{ 'AUTH.LOGIN' | translate }}</h1>
            <button type="button" class="btn social" (click)="auth.googleLogin()">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 11v3.2h5.4c-.2 1.4-1.7 4-5.4 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
              </svg>
              {{ 'AUTH.CONTINUE_GOOGLE' | translate }}
            </button>
            <span class="divider">{{ 'AUTH.OR_USE_EXISTING' | translate }}</span>
            <input class="input" type="email" formControlName="email" [class.invalid]="touched(signInForm, 'email')"
                   [placeholder]="'AUTH.EMAIL' | translate" autocomplete="email"/>
            <input class="input" type="password" formControlName="password" [class.invalid]="touched(signInForm, 'password')"
                   [placeholder]="'AUTH.PASSWORD' | translate" autocomplete="current-password"/>
            <a routerLink="/auth/forgot" class="link forgot">{{ 'AUTH.FORGOT_PASSWORD' | translate }}</a>
            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button type="submit" class="btn btn-primary btn-lg full" [disabled]="signInForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>{{ 'AUTH.SIGN_IN' | translate }}
            </button>
          </form>
        </div>

        <!-- Sliding overlay -->
        <div class="overlay-wrap" aria-hidden="true">
          <div class="overlay">
            <div class="overlay-panel overlay-left">
              <h2>{{ 'AUTH.WELCOME_BACK' | translate }}</h2>
              <p>{{ 'AUTH.SIGNIN_DETAILS' | translate }}</p>
              <button type="button" class="btn btn-ghost" (click)="step.set('signin'); error.set(null)">{{ 'AUTH.SIGN_IN' | translate }}</button>
            </div>
            <div class="overlay-panel overlay-right">
              <h2>{{ 'AUTH.HELLO_STUDENT' | translate }}</h2>
              <p>{{ 'AUTH.SIGNUP_DETAILS' | translate }}</p>
              <button type="button" class="btn btn-ghost" (click)="step.set('signup'); error.set(null)">{{ 'AUTH.SIGN_UP' | translate }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-shell { position: relative; min-height: 100vh; padding: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 24px; overflow: hidden; }
    .bg-glow { position: fixed; pointer-events: none; z-index: 0; filter: blur(80px); border-radius: 50%; }
    .bg-glow-1 { top: -120px; left: -100px; width: 460px; height: 460px;
      background: radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%); animation: glowFloat 12s ease-in-out infinite; }
    .bg-glow-2 { bottom: -180px; right: -120px; width: 540px; height: 540px;
      background: radial-gradient(circle, rgba(139,92,246,0.45), transparent 70%); animation: glowFloat 14s ease-in-out infinite reverse; }

    .topbar { width: 100%; max-width: 920px; display: flex; align-items: center; justify-content: space-between; z-index: 5; }
    .brand { display: flex; align-items: center; gap: 8px; font-family: var(--font-display); font-weight: 700; color: var(--color-foreground); font-size: 1.1rem; }
    .topbar-actions { display: flex; gap: 8px; align-items: center; }

    .auth-container {
      position: relative; width: 100%; max-width: 920px; min-height: 540px;
      background: var(--color-card); border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg); overflow: hidden; z-index: 5;
      border: 1px solid var(--color-border);
    }
    html.dark .auth-container { backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); }

    .panel { position: absolute; top: 0; height: 100%; width: 50%; transition: transform 600ms ease-in-out, opacity 600ms ease; }
    .panel-signin { right: 0; z-index: 2; }
    .panel-signup { left: 0; opacity: 0; z-index: 1; }
    .auth-container.signup-active .panel-signin { transform: translateX(100%); opacity: 0; }
    .auth-container.signup-active .panel-signup { transform: translateX(100%); opacity: 1; z-index: 5; }

    .form { padding: 36px 36px; height: 100%; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
    .form h1 { font-size: 1.6rem; margin-bottom: 6px; }
    .input + .input-error { margin-top: -4px; }
    .full { width: 100%; }
    .link { background: none; border: none; color: var(--color-primary); font-size: 0.85rem; cursor: pointer; text-decoration: none; }
    .forgot { align-self: flex-end; margin: 4px 0; }
    .error { color: var(--red-500); font-size: 0.85rem; min-height: 1.2em; }
    .social { background: var(--color-card); border: 1px solid var(--color-border-strong); color: var(--color-foreground); width: 100%; }
    .social:hover { background: var(--color-muted); }
    .divider {
      display: flex; align-items: center; gap: 8px; color: var(--color-muted-foreground);
      font-size: 0.78rem; text-align: center; margin: 4px 0;
    }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--color-border); }

    .overlay-wrap {
      position: absolute; top: 0; left: 50%; width: 50%; height: 100%; overflow: hidden;
      transition: transform 600ms ease-in-out; z-index: 10; border-radius: 150px 0 0 150px;
    }
    .auth-container.signup-active .overlay-wrap { transform: translateX(-100%); border-radius: 0 150px 150px 0; }
    .overlay {
      background: linear-gradient(135deg, var(--indigo-500), var(--violet-500));
      color: #fff; height: 100%; width: 200%; position: relative; left: -100%;
      transition: transform 600ms ease-in-out;
    }
    .auth-container.signup-active .overlay { transform: translateX(50%); }
    .overlay-panel {
      position: absolute; top: 0; height: 100%; width: 50%; padding: 40px 32px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: 16px;
    }
    .overlay-left  { left: 0;  transform: translateX(-20%); }
    .overlay-right { right: 0; transform: translateX(0); }
    .auth-container.signup-active .overlay-left  { transform: translateX(0); }
    .auth-container.signup-active .overlay-right { transform: translateX(20%); }
    .overlay-panel h2 { font-size: 1.7rem; }
    .overlay-panel p  { font-size: 0.92rem; line-height: 1.55; max-width: 280px; opacity: 0.95; }

    .otp-card { padding: 32px; max-width: 440px; width: 100%; display: flex; flex-direction: column; gap: 12px; z-index: 5; }
    .otp-card h1 { font-size: 1.5rem; }
    .otp-card .muted { color: var(--color-muted-foreground); font-size: 0.9rem; }
    .otp-input { font-family: var(--font-display); font-size: 1.6rem; letter-spacing: 0.6em; text-align: center; padding: 14px; }
    .otp-meta { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--color-muted-foreground); }
    .otp-meta .warn { color: var(--orange-500); font-weight: 600; }

    @media (max-width: 720px) {
      .auth-container { min-height: auto; }
      .panel { position: relative; width: 100%; height: auto; }
      .panel-signup { display: block; opacity: 1; }
      .panel-signin { display: none; }
      .auth-container.signup-active .panel-signin { display: none; }
      .auth-container:not(.signup-active) .panel-signup { display: none; }
      .auth-container:not(.signup-active) .panel-signin { display: block; }
      .overlay-wrap { display: none; }
    }
  `],
})
export class AuthPageComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translate = inject(TranslateService);
  readonly auth = inject(AuthService);

  step = signal<'signin' | 'signup' | 'otp'>('signin');
  busy = signal(false);
  error = signal<string | null>(null);
  pendingEmail = signal('');
  otpCode = signal('');
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
  });
  signUpForm = this.fb.group({
    prenom:   ['', [Validators.required, Validators.minLength(2)]],
    nom:      ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email, emailNoPlus]],
    password: ['', [Validators.required, Validators.pattern(PWD_REGEX)]],
    role:     ['ETUDIANT' as 'ETUDIANT' | 'ENSEIGNANT', [Validators.required]],
  });

  f(form: FormGroup, name: string): AbstractControl { return form.controls[name]; }
  touched(form: FormGroup, name: string): boolean { return this.f(form, name).touched && this.f(form, name).invalid; }

  onSignIn(): void {
    this.signInForm.markAllAsTouched();
    if (this.signInForm.invalid) return;
    const v = this.signInForm.getRawValue();
    this.busy.set(true); this.error.set(null);
    this.auth.login({ email: v.email!, password: v.password! }).subscribe({
      next: u => { this.busy.set(false); this.router.navigateByUrl(this.auth.defaultRouteForRole(u.role)); },
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
    this.busy.set(true); this.error.set(null);
    this.attempts.update(n => n + 1);
    this.auth.verifyOtp({ email: this.pendingEmail(), code: this.otpCode(), purpose: 'REGISTRATION' }).subscribe({
      next: u => { this.busy.set(false); this.router.navigateByUrl(this.auth.defaultRouteForRole(u.role)); },
      error: e => {
        this.busy.set(false);
        this.error.set(this.translateError(e?.error?.code) ?? this.translate.instant('AUTH.ERR_OTP_INVALID'));
      },
    });
  }

  resendOtp(): void {
    if (!this.pendingEmail()) return;
    this.busy.set(true); this.error.set(null);
    this.auth.forgotPassword({ email: this.pendingEmail() }).subscribe({
      next: () => { this.busy.set(false); this.startOtpTimer(); this.attempts.set(0); },
      error: () => { this.busy.set(false); this.startOtpTimer(); },
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
}
