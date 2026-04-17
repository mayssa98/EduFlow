import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="wrap">
      <div class="card glass fade-up">
        <a routerLink="/auth" class="back">← {{ 'BUTTONS.BACK' | translate }}</a>

        <ng-container *ngIf="step() === 'request'">
          <h1>{{ 'AUTH.FORGOT_TITLE' | translate }}</h1>
          <p class="muted">{{ 'AUTH.FORGOT_SUBTITLE' | translate }}</p>
          <form [formGroup]="emailForm" (ngSubmit)="requestReset()">
            <input class="input" type="email" formControlName="email" [placeholder]="'AUTH.EMAIL' | translate" autocomplete="email"/>
            <button class="btn btn-primary btn-lg full" [disabled]="emailForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>{{ 'AUTH.SEND_RESET_CODE' | translate }}
            </button>
          </form>
        </ng-container>

        <ng-container *ngIf="step() === 'sent'">
          <h1>{{ 'AUTH.CHECK_EMAIL' | translate }}</h1>
          <p class="muted">{{ 'AUTH.RESET_NEUTRAL_HINT' | translate }}</p>
          <button class="btn btn-primary btn-lg full" (click)="step.set('reset')">{{ 'AUTH.HAVE_OTP' | translate }}</button>
        </ng-container>

        <ng-container *ngIf="step() === 'reset'">
          <h1>{{ 'AUTH.RESET_TITLE' | translate }}</h1>
          <form [formGroup]="resetForm" (ngSubmit)="submitReset()">
            <input class="input" type="email" formControlName="email" [placeholder]="'AUTH.EMAIL' | translate"/>
            <input class="input" maxlength="6" inputmode="numeric" formControlName="code"
                   [placeholder]="'AUTH.OTP_CODE' | translate"/>
            <input class="input" type="password" formControlName="newPassword"
                   [placeholder]="'AUTH.NEW_PASSWORD' | translate" autocomplete="new-password"/>
            <small class="muted">{{ 'AUTH.PASSWORD_RULES' | translate }}</small>
            <div class="error" *ngIf="error()">{{ error() }}</div>
            <button class="btn btn-primary btn-lg full" [disabled]="resetForm.invalid || busy()">
              <span class="spinner" *ngIf="busy()"></span>{{ 'AUTH.RESET_PASSWORD' | translate }}
            </button>
          </form>
        </ng-container>

        <ng-container *ngIf="step() === 'done'">
          <h1>{{ 'AUTH.RESET_DONE' | translate }}</h1>
          <p class="muted">{{ 'AUTH.RESET_DONE_HINT' | translate }}</p>
          <a routerLink="/auth" class="btn btn-primary btn-lg full">{{ 'AUTH.SIGN_IN' | translate }}</a>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { padding: 36px; max-width: 460px; width: 100%; display: flex; flex-direction: column; gap: 14px; }
    .back { font-size: 0.85rem; color: var(--color-muted-foreground); text-decoration: none; }
    h1 { font-size: 1.5rem; }
    .muted { color: var(--color-muted-foreground); font-size: 0.9rem; }
    form { display: flex; flex-direction: column; gap: 12px; }
    .full { width: 100%; }
    .error { color: var(--red-500); font-size: 0.85rem; }
  `],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  step = signal<'request' | 'sent' | 'reset' | 'done'>('request');
  busy = signal(false);
  error = signal<string | null>(null);

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  resetForm = this.fb.group({
    email:       ['', [Validators.required, Validators.email]],
    code:        ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)]],
  });

  requestReset(): void {
    if (this.emailForm.invalid) return;
    this.busy.set(true);
    const email = this.emailForm.value.email!;
    this.auth.forgotPassword({ email }).subscribe({
      next: () => { this.busy.set(false); this.resetForm.patchValue({ email }); this.step.set('sent'); },
      error: () => { this.busy.set(false); this.step.set('sent'); }, // neutral confirmation
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) return;
    this.busy.set(true); this.error.set(null);
    const v = this.resetForm.getRawValue();
    this.auth.resetPassword({ email: v.email!, code: v.code!, newPassword: v.newPassword! }).subscribe({
      next: () => { this.busy.set(false); this.step.set('done'); },
      error: e => {
        this.busy.set(false);
        this.error.set(e?.error?.message ?? this.translate.instant('AUTH.ERR_OTP_INVALID'));
      },
    });
  }
}
