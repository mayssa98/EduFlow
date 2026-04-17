import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule, ThemeToggleComponent, LanguageSwitcherComponent],
  template: `
    <div class="auth-page">
      <div class="auth-controls">
        <app-language-switcher />
        <app-theme-toggle />
      </div>

      <div class="auth-container" [class.sign-up-active]="isSignUp()">
        <!-- Sign-up panel -->
        <div class="panel panel-signup">
          <form [formGroup]="signUpForm" (ngSubmit)="onSignUp()" class="auth-form">
            <h1 class="form-title">{{ 'AUTH.REGISTER' | translate }}</h1>
            <input class="form-input" type="text" [placeholder]="'AUTH.FULL_NAME' | translate" formControlName="name" autocomplete="name"/>
            <input class="form-input" type="email" [placeholder]="'AUTH.EMAIL' | translate" formControlName="email" autocomplete="email"/>
            <input class="form-input" type="password" [placeholder]="'AUTH.PASSWORD' | translate" formControlName="password" autocomplete="new-password"/>
            <button class="btn-submit" type="submit" [disabled]="signUpForm.invalid">{{ 'AUTH.SIGN_UP' | translate }}</button>
          </form>
        </div>

        <!-- Sign-in panel -->
        <div class="panel panel-signin">
          <form [formGroup]="signInForm" (ngSubmit)="onSignIn()" class="auth-form">
            <h1 class="form-title">{{ 'AUTH.LOGIN' | translate }}</h1>
            <input class="form-input" type="email" [placeholder]="'AUTH.EMAIL' | translate" formControlName="email" autocomplete="email"/>
            <input class="form-input" type="password" [placeholder]="'AUTH.PASSWORD' | translate" formControlName="password" autocomplete="current-password"/>
            <a href="#" class="forgot-link">{{ 'AUTH.FORGOT_PASSWORD' | translate }}</a>
            <button class="btn-submit" type="submit" [disabled]="signInForm.invalid">{{ 'AUTH.SIGN_IN' | translate }}</button>
          </form>
        </div>

        <!-- Sliding overlay -->
        <div class="overlay-wrap">
          <div class="overlay">
            <div class="overlay-panel overlay-left">
              <h2 class="overlay-title">{{ 'AUTH.WELCOME_BACK' | translate }}</h2>
              <p class="overlay-text">{{ 'AUTH.SIGNIN_DETAILS' | translate }}</p>
              <button class="btn-ghost" type="button" (click)="showSignIn()">{{ 'AUTH.SIGN_IN' | translate }}</button>
            </div>
            <div class="overlay-panel overlay-right">
              <h2 class="overlay-title">{{ 'AUTH.HELLO_STUDENT' | translate }}</h2>
              <p class="overlay-text">{{ 'AUTH.SIGNUP_DETAILS' | translate }}</p>
              <button class="btn-ghost" type="button" (click)="showSignUp()">{{ 'AUTH.SIGN_UP' | translate }}</button>
            </div>
          </div>
        </div>
      </div>

      <a routerLink="/" class="back-link">← {{ 'BUTTONS.BACK' | translate }}</a>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-background);
      color: var(--color-foreground);
      position: relative;
      padding: 2rem;
    }

    .auth-controls {
      position: fixed;
      top: 1rem;
      inset-inline-end: 1.25rem;
      display: flex;
      gap: 8px;
      align-items: center;
      z-index: 20;
    }

    .back-link {
      position: fixed;
      top: 1.1rem;
      inset-inline-start: 1.25rem;
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      text-decoration: none;
      font-weight: 500;
    }

    .back-link:hover { color: var(--color-foreground); }

    .auth-container {
      position: relative;
      width: 100%;
      max-width: 800px;
      min-height: 520px;
      overflow: hidden;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: 0 20px 60px rgba(0,0,0,.12);
      background: var(--color-card);
    }

    .panel {
      position: absolute;
      top: 0;
      width: 50%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.6s ease-in-out;
    }

    .panel-signin { inset-inline-start: 0; z-index: 2; }
    .panel-signup { inset-inline-start: 0; z-index: 1; opacity: 0; transform: translateX(100%); }

    :host-context(.sign-up-active) .panel-signin { transform: translateX(100%); opacity: 0; }
    .auth-container.sign-up-active .panel-signup { transform: translateX(0); opacity: 1; z-index: 5; }

    .auth-form {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 2.5rem;
      width: 100%;
    }

    .form-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--color-input);
      border-radius: var(--radius);
      background: var(--color-background);
      color: var(--color-foreground);
      font-size: 0.9375rem;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
    }

    .form-input:focus { border-color: var(--color-ring); }

    .forgot-link {
      align-self: flex-end;
      font-size: 0.8125rem;
      color: var(--color-muted-foreground);
      text-decoration: none;
    }

    .forgot-link:hover { color: var(--color-foreground); }

    .btn-submit {
      width: 100%;
      padding: 11px;
      border-radius: var(--radius);
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      margin-top: 4px;
      transition: opacity 0.15s;
      font-family: inherit;
    }

    .btn-submit:hover:not(:disabled) { opacity: 0.88; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .overlay-wrap {
      position: absolute;
      top: 0;
      inset-inline-start: 50%;
      width: 50%;
      height: 100%;
      overflow: hidden;
      z-index: 10;
      transition: transform 0.6s ease-in-out;
    }

    .auth-container.sign-up-active .overlay-wrap { transform: translateX(-100%); }

    .overlay {
      position: relative;
      width: 200%;
      height: 100%;
      display: flex;
      background: var(--color-primary);
      transition: transform 0.6s ease-in-out;
    }

    .auth-container.sign-up-active .overlay { transform: translateX(50%); }

    .overlay-panel {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }

    .overlay-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--color-primary-foreground);
    }

    .overlay-text {
      font-size: 0.9rem;
      color: var(--color-primary-foreground);
      opacity: 0.85;
      line-height: 1.6;
    }

    .btn-ghost {
      padding: 9px 24px;
      border-radius: var(--radius);
      border: 2px solid var(--color-primary-foreground);
      background: transparent;
      color: var(--color-primary-foreground);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      margin-top: 0.5rem;
      font-family: inherit;
    }

    .btn-ghost:hover { background: rgba(255,255,255,.15); }

    @media (max-width: 640px) {
      .auth-container { min-height: auto; }
      .panel { position: relative; width: 100%; transform: none !important; opacity: 1 !important; }
      .panel-signup { display: none; }
      .auth-container.sign-up-active .panel-signin { display: none; }
      .auth-container.sign-up-active .panel-signup { display: flex; }
      .overlay-wrap { display: none; }
    }
  `]
})
export class AuthPageComponent {
  isSignUp = signal(false);
  signInForm: FormGroup;
  signUpForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
    this.signUpForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  showSignUp(): void { this.isSignUp.set(true); }
  showSignIn(): void { this.isSignUp.set(false); }

  onSignIn(): void {
    if (this.signInForm.valid) {
      console.log('Sign in', this.signInForm.value);
    }
  }

  onSignUp(): void {
    if (this.signUpForm.valid) {
      console.log('Sign up', this.signUpForm.value);
    }
  }
}
