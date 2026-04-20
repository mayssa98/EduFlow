import { Component, OnDestroy, computed, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { BrandMarkComponent } from '../../shared/components/brand/brand-mark.component';
import { APP_ICONS } from '../../shared/icons/app-icons';

function pwdLength(c: AbstractControl)  { return c.value && c.value.length >= 8 ? null : { pwdLength: true }; }
function pwdUpper(c: AbstractControl)   { return c.value && /[A-Z]/.test(c.value) ? null : { pwdUpper: true }; }
function pwdDigit(c: AbstractControl)   { return c.value && /\d/.test(c.value) ? null : { pwdDigit: true }; }
function pwdSpecial(c: AbstractControl) { return c.value && /[!@#$%^&*()_\-+={}[\]:;"'<>,.?/\\|`~]/.test(c.value) ? null : { pwdSpecial: true }; }

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, BrandMarkComponent],
  template: `
    <div class="wrap">
      <div class="auth-header">
        <app-brand-mark [link]="'/auth'" [size]="40"></app-brand-mark>
      </div>
      <div class="card fade-up">
        <a routerLink="/auth" class="back" aria-label="Retour à la connexion">
          <span class="back-icon" [innerHTML]="icons.arrowLeft"></span>
          <span>Retour à la connexion</span>
        </a>
        <div class="wizard-progress" *ngIf="step() !== 'done'">
          <div class="wizard-step" [class.active]="progressStep() >= 1" [class.done]="progressStep() > 1">1</div>
          <div class="wizard-line" [class.done]="progressStep() > 1"></div>
          <div class="wizard-step" [class.active]="progressStep() >= 2" [class.done]="progressStep() > 2">2</div>
          <div class="wizard-line" [class.done]="progressStep() > 2"></div>
          <div class="wizard-step" [class.active]="progressStep() >= 3">3</div>
        </div>

        <ng-container *ngIf="step() === 'request'">
          <div class="step-icon" aria-hidden="true" [innerHTML]="icons.shieldLock"></div>
          <h1>Mot de passe oublié</h1>
          <p class="muted">Entrez votre adresse email pour recevoir un code de vérification.</p>
          <form [formGroup]="emailForm" (ngSubmit)="requestReset()" novalidate>
            <input class="input" type="email" formControlName="email"
                   placeholder="Votre adresse email" autocomplete="email"/>
            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button class="btn-primary full" [disabled]="emailForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>
              Envoyer le code
            </button>
          </form>
        </ng-container>

        <ng-container *ngIf="step() === 'otp'">
          <div class="step-icon" aria-hidden="true" [innerHTML]="icons.mailSpark"></div>
          <h1>Vérification par email</h1>
          <p class="muted">Saisissez le code à 6 chiffres envoyé à <strong>{{ pendingEmail() }}</strong>.</p>

          <div class="otp-meta-row">
            <span [class.warn]="remaining() < 60">⏱ Expire dans {{ formatRemaining() }}</span>
            <span>Tentative {{ attempts() }}/5</span>
          </div>

          <div class="otp-grid">
            <input
              *ngFor="let digit of otpSlots(); let i = index"
              #otpBox
              class="otp-box"
              type="text"
              inputmode="numeric"
              maxlength="1"
              autocomplete="one-time-code"
              [value]="digit"
              (input)="onOtpBoxInput(i, $event)"
              (keydown)="onOtpKeyDown(i, $event)"
              (paste)="onOtpPaste(i, $event)"
            />
          </div>

          <div class="error" *ngIf="error()">{{ error() }}</div>

          <button class="btn-primary full" (click)="verifyOtp()"
                  [disabled]="otpCode().length !== 6 || busy() || attempts() >= 5 || remaining() <= 0">
            <span class="spinner" *ngIf="busy()"></span>
            Vérifier le code
          </button>

          <div class="resend-row">
            <button class="link-btn" (click)="resendOtp()" [disabled]="busy() || remaining() > otpResendCooldownSeconds">
              Renvoyer un nouveau code
            </button>
          </div>
        </ng-container>

        <ng-container *ngIf="step() === 'newpwd'">
          <div class="step-icon" [innerHTML]="icons.key"></div>
          <h1>Nouveau mot de passe</h1>
          <p class="muted">Le code a été confirmé. Choisissez maintenant un mot de passe sécurisé.</p>
          <form [formGroup]="resetForm" (ngSubmit)="submitReset()" novalidate>
            <input class="input" type="password" formControlName="newPassword"
                   placeholder="Nouveau mot de passe" autocomplete="new-password"/>

            <div class="pwd-rules" *ngIf="resetForm.get('newPassword')?.value">
              <small class="rule" [class.ok]="!resetForm.get('newPassword')?.errors?.['pwdLength']">
                <span class="rule-icon">{{ !resetForm.get('newPassword')?.errors?.['pwdLength'] ? '✓' : '✕' }}</span>
                Au moins 8 caractères
              </small>
              <small class="rule" [class.ok]="!resetForm.get('newPassword')?.errors?.['pwdUpper']">
                <span class="rule-icon">{{ !resetForm.get('newPassword')?.errors?.['pwdUpper'] ? '✓' : '✕' }}</span>
                Au moins une lettre majuscule
              </small>
              <small class="rule" [class.ok]="!resetForm.get('newPassword')?.errors?.['pwdDigit']">
                <span class="rule-icon">{{ !resetForm.get('newPassword')?.errors?.['pwdDigit'] ? '✓' : '✕' }}</span>
                Au moins un chiffre
              </small>
              <small class="rule" [class.ok]="!resetForm.get('newPassword')?.errors?.['pwdSpecial']">
                <span class="rule-icon">{{ !resetForm.get('newPassword')?.errors?.['pwdSpecial'] ? '✓' : '✕' }}</span>
                Au moins un caractère spécial (!&#64;#$...)
              </small>
            </div>

            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button class="btn-primary full" [disabled]="resetForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>
              Mettre à jour le mot de passe
            </button>
          </form>
        </ng-container>

        <ng-container *ngIf="step() === 'done'">
          <div class="step-icon" [innerHTML]="icons.checkBadge"></div>
          <h1>Mot de passe mis ? jour</h1>
          <p class="muted">Votre mot de passe a été changé avec succès. Vous pouvez maintenant vous connecter.</p>
          <a routerLink="/auth" class="btn-primary full cta-link">
            Se connecter
          </a>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #6366f1;
      --card-bg: #1a1a2e;
      --input-bg: #252540;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --red: #fca5a5;
      --green: #86efac;
      --warn: #f59e0b;
    }

    .wrap {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(circle at 20% 20%, rgba(99,102,241,0.15), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(139,92,246,0.12), transparent 40%),
        #0f0f1a;
    }

    .auth-header {
      margin-bottom: 18px;
    }

    .card {
      background: #1a1a2e;
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 24px;
      padding: 40px;
      max-width: 460px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      animation: fadeUp 0.35s ease both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .back {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      width: fit-content;
      font-size: 0.82rem;
      color: var(--muted);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .back:hover { color: var(--text); }

    .back-icon {
      display: inline-flex;
      width: 15px;
      height: 15px;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    .back-icon :is(svg) { width: 15px; height: 15px; display: block; }

    .back:hover .back-icon { transform: translateX(-2px); }

    .wizard-progress {
      display: flex;
      align-items: center;
      gap: 0;
      width: 100%;
      margin: 4px 0 8px;
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
      box-shadow: 0 0 0 4px rgba(99,102,241,0.2);
    }

    .wizard-step.done {
      border-color: var(--green);
      color: #fff;
      background: var(--green);
      box-shadow: 0 0 0 4px rgba(134,239,172,0.15);
    }

    .wizard-line {
      flex: 1;
      height: 2px;
      background: rgba(255,255,255,0.08);
      transition: background 0.4s ease;
      border-radius: 2px;
    }

    .wizard-line.done { background: var(--green); }

    .step-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto;
      display: grid;
      place-items: center;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.16));
      border: 1px solid rgba(99,102,241,0.28);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 30px rgba(0,0,0,0.25);
      font-size: 2rem;
      text-align: center;
    }

    .step-icon svg {
      width: 30px;
      height: 30px;
      stroke: #c4b5fd;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    h1 {
      color: var(--text);
      font-size: 1.55rem;
      font-weight: 700;
      text-align: center;
      margin: 0;
    }

    .muted {
      color: var(--muted);
      font-size: 0.88rem;
      text-align: center;
      line-height: 1.5;
      margin: 0;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .input {
      background: var(--input-bg);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 12px;
      padding: 12px 16px;
      color: var(--text);
      font-size: 0.95rem;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .input:focus { border-color: var(--primary); }

    .otp-grid {
      display: grid;
      grid-template-columns: repeat(6, 42px);
      justify-content: center;
      gap: 8px;
      width: fit-content;
      max-width: 100%;
      margin: 4px auto 0;
    }

    .otp-box {
      width: 42px;
      height: 50px;
      padding: 0;
      border-radius: 12px;
      border: 1px solid rgba(99,102,241,0.25);
      background: var(--input-bg);
      color: var(--text);
      font-size: 1.2rem;
      font-weight: 700;
      text-align: center;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
      text-transform: uppercase;
      box-sizing: border-box;
    }

    .otp-box:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
      transform: translateY(-1px);
    }

    .otp-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
    }

    .warn { color: var(--warn) !important; font-weight: 700; }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 13px 24px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: opacity 0.2s, transform 0.1s;
    }

    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .full { width: 100%; box-sizing: border-box; }

    .resend-row { text-align: center; }

    .link-btn {
      background: none;
      border: none;
      color: #a5b4fc;
      font-size: 13px;
      cursor: pointer;
      padding: 0;
    }

    .link-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .link-btn:hover:not(:disabled) { text-decoration: underline; }

    .error {
      color: var(--red);
      font-size: 0.83rem;
      text-align: left;
    }

    .pwd-rules {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 10px 12px;
      background: rgba(99,102,241,0.06);
      border-radius: 10px;
      border: 1px solid rgba(99,102,241,0.15);
    }

    .rule {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      color: var(--red);
      transition: color 0.2s ease;
    }

    .rule.ok { color: var(--green); }

    .rule-icon {
      font-weight: 700;
      font-size: 13px;
      min-width: 16px;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      display: inline-block;
    }

    .cta-link {
      text-align: center;
      text-decoration: none;
    }

    @media (max-width: 520px) {
      .card {
        padding: 32px 20px;
      }

      .otp-grid {
        grid-template-columns: repeat(6, 38px);
        gap: 6px;
      }

      .otp-box {
        width: 38px;
        height: 46px;
        font-size: 1.05rem;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ForgotPasswordComponent implements OnDestroy {
  @ViewChildren('otpBox') private otpBoxes?: QueryList<ElementRef<HTMLInputElement>>;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  readonly icons = APP_ICONS;

  step = signal<'request' | 'otp' | 'newpwd' | 'done'>('request');
  busy = signal(false);
  error = signal<string | null>(null);
  private otpDigits = signal<string[]>(Array(6).fill(''));
  otpCode = computed(() => this.otpDigits().join(''));
  attempts = signal(0);
  pendingEmail = signal('');
  readonly otpExpirySeconds = 180;
  readonly otpResendCooldownSeconds = 120;

  private otpStartedAt = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  remaining = signal(0);

  progressStep = computed(() => {
    switch (this.step()) {
      case 'request': return 1;
      case 'otp': return 2;
      case 'newpwd': return 3;
      default: return 3;
    }
  });

  otpSlots = computed(() => [...this.otpDigits()]);

  formatRemaining = computed(() => {
    const r = Math.max(0, this.remaining());
    return `${Math.floor(r / 60)}:${(r % 60).toString().padStart(2, '0')}`;
  });

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, pwdLength, pwdUpper, pwdDigit, pwdSpecial]],
  });

  requestReset(): void {
    if (this.emailForm.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    this.pendingEmail.set(this.emailForm.value.email ?? '');
    this.auth.forgotPassword({ email: this.pendingEmail() }).subscribe({
      next: () => {
        this.busy.set(false);
        this.goToOtp();
      },
      error: e => {
        this.busy.set(false);
        const msg = e?.error?.message ?? '';
        if (msg.toLowerCase().includes('email not found')) {
          this.error.set("Cette adresse email n'existe pas.");
        } else {
          this.error.set(msg || "Impossible d'envoyer le code de réinitialisation.");
        }
      },
    });
  }

  private goToOtp(): void {
    this.attempts.set(0);
    this.clearOtpDigits();
    this.startTimer();
    this.step.set('otp');
    setTimeout(() => this.focusOtpBox(0));
  }

  onOtpBoxInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.dataset['skipInput'] === '1') {
      input.dataset['skipInput'] = '0';
      return;
    }

    const inputEvent = event as InputEvent;
    const digits = input.value.replace(/\D/g, '');

    if (inputEvent.inputType === 'deleteContentBackward') {
      this.setOtpDigit(index, '');
      if (index > 0) this.focusOtpBox(index - 1);
      return;
    }

    if (!digits) {
      this.setOtpDigit(index, '');
      return;
    }

    if (digits.length > 1) {
      if (index === 0 && digits.length === 6) {
        this.insertOtpDigits(0, digits, true);
        setTimeout(() => this.focusOtpBox(5));
        return;
      }

      const lastDigit = digits.slice(-1);
      this.setOtpDigit(index, lastDigit);
      if (index < 5) setTimeout(() => this.focusOtpBox(index + 1));
      return;
    }

    this.setOtpDigit(index, digits);
    if (index < 5) {
      setTimeout(() => this.focusOtpBox(index + 1));
    }
  }

  onOtpKeyDown(index: number, event: KeyboardEvent): void {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      input.dataset['skipInput'] = '1';
      this.setOtpDigit(index, event.key);
      if (index < 5) setTimeout(() => this.focusOtpBox(index + 1));
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      const digits = this.otpDigits();
      if (digits[index]) {
        this.setOtpDigit(index, '');
        if (index > 0) this.focusOtpBox(index - 1);
        return;
      }

      if (index > 0) {
        this.setOtpDigit(index - 1, '');
        this.focusOtpBox(index - 1);
      }
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      this.setOtpDigit(index, '');
      return;
    }

    if (event.key.length === 1 && !/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtpBox(index - 1);
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusOtpBox(index + 1);
    }
  }

  onOtpPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) ?? '';
    if (!pasted) return;
    this.insertOtpDigits(index, pasted, true);
    setTimeout(() => this.focusOtpBox(Math.min(index + pasted.length, 5)));
  }

  verifyOtp(): void {
    if (this.attempts() >= 5) {
      this.error.set('Trop de tentatives. Recommencez la procédure.');
      return;
    }
    if (this.remaining() <= 0) {
      this.error.set('Code expiré. Renvoyez un nouveau code.');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.auth.verifyResetOtp({ email: this.pendingEmail(), code: this.otpCode() }).subscribe({
      next: () => {
        this.busy.set(false);
        this.stopTimer();
        this.step.set('newpwd');
      },
      error: e => {
        this.busy.set(false);
        this.attempts.update(n => n + 1);
        const msg = (e?.error?.message ?? '').toLowerCase();
        if (msg.includes('expired')) {
          this.error.set('Code expiré. Renvoyez un nouveau code.');
          this.remaining.set(0);
        } else if (msg.includes('too many')) {
          this.error.set('Nombre maximum de tentatives atteint. Renvoyez un nouveau code.');
          this.attempts.set(5);
        } else {
          this.error.set(`Code incorrect. Tentative ${this.attempts()}/5.`);
        }
      },
    });
  }

  resendOtp(): void {
    if (!this.pendingEmail()) return;
    this.busy.set(true);
    this.error.set(null);
    this.auth.forgotPassword({ email: this.pendingEmail() }).subscribe({
      next: () => {
        this.busy.set(false);
        this.attempts.set(0);
        this.clearOtpDigits();
        this.startTimer();
        setTimeout(() => this.focusOtpBox(0));
      },
      error: e => {
        this.busy.set(false);
        const msg = e?.error?.message ?? '';
        this.error.set(msg || 'Impossible de renvoyer le code.');
      },
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    const newPassword = this.resetForm.value.newPassword ?? '';
    this.auth.resetPassword({
      email: this.pendingEmail(),
      code: this.otpCode(),
      newPassword,
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.stopTimer();
        this.step.set('done');
      },
      error: e => {
        this.busy.set(false);
        const msg = (e?.error?.message ?? '').toLowerCase();
        if (msg.includes('expired')) {
          this.error.set('Code expiré. Renvoyez un nouveau code OTP.');
          this.step.set('otp');
        } else if (msg.includes('invalid')) {
          this.error.set('Code incorrect ou expiré. Vérifiez votre email.');
          this.step.set('otp');
        } else {
          this.error.set(e?.error?.message || 'Une erreur est survenue.');
        }
      },
    });
  }

  private focusOtpBox(index: number): void {
    const box = this.otpBoxes?.get(index)?.nativeElement;
    box?.focus();
    box?.select();
  }

  private clearOtpDigits(): void {
    this.otpDigits.set(Array(6).fill(''));
  }

  private setOtpDigit(index: number, value: string): void {
    this.otpDigits.update(current => {
      const next = [...current];
      next[index] = value.slice(-1);
      return next;
    });
  }

  private insertOtpDigits(index: number, rawDigits: string, clearAfter: boolean): void {
    const digits = rawDigits.replace(/\D/g, '');
    this.otpDigits.update(current => {
      const next = [...current];
      let writeIndex = index;
      for (const digit of digits) {
        if (writeIndex > 5) break;
        next[writeIndex] = digit;
        writeIndex += 1;
      }
      if (clearAfter) {
        for (let i = writeIndex; i < 6; i += 1) {
          next[i] = '';
        }
      }
      return next;
    });
  }

  private startTimer(): void {
    this.stopTimer();
    this.otpStartedAt = Date.now();
    this.remaining.set(this.otpExpirySeconds);
    this.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.otpStartedAt) / 1000);
      const nextRemaining = Math.max(0, this.otpExpirySeconds - elapsed);
      this.remaining.set(nextRemaining);
      if (nextRemaining <= 0 || this.step() !== 'otp') {
        this.stopTimer();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId === null) return;
    clearInterval(this.timerId);
    this.timerId = null;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}

