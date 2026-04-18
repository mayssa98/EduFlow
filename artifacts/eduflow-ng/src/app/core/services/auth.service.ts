import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, of, catchError, map } from 'rxjs';
import {
  AuthUser, LoginRequest, RegisterRequest,
  OtpVerifyRequest, ForgotPasswordRequest, ResetPasswordRequest,
  SimpleMessageResponse, UserRole, GoogleAuthRequest, GoogleOAuthConfigResponse,
  MfaChallengeResponse, GoogleRegistrationChallenge, VerifyMfaRequest, GoogleCompleteRequest
} from '../models/auth.models';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = isLocalhost ? 'http://localhost:8081/api' : '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly googleStateKey = 'eduflow.google.oauth.state';
  private readonly googleRedirectKey = 'eduflow.google.oauth.redirectUri';

  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _user = signal<AuthUser | null>(null);
  readonly currentUser$ = new BehaviorSubject<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);

  private setUser(user: AuthUser | null): void {
    this._user.set(user);
    this.currentUser$.next(user);
  }

  /** Bootstrap: try /auth/me to restore session from cookie. */
  bootstrap(): Observable<AuthUser | null> {
    return this.http.get<AuthUser>(`${API_BASE}/auth/me`, { withCredentials: true }).pipe(
      tap(u => this.setUser(u)),
      catchError(() => { this.setUser(null); return of(null); }),
    );
  }

  login(body: LoginRequest): Observable<AuthUser | MfaChallengeResponse> {
    return this.http.post<AuthUser | MfaChallengeResponse>(`${API_BASE}/auth/login`, body, { withCredentials: true }).pipe(
      tap(res => {
        if ('id' in res) { // It's an AuthUser
          this.setUser(res as AuthUser);
        }
        // If it's a challenge, we don't set user yet
      })
    );
  }

  verify2fa(body: VerifyMfaRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API_BASE}/auth/verify-2fa`, body, { withCredentials: true }).pipe(
      tap(u => this.setUser(u))
    );
  }

  register(body: RegisterRequest): Observable<SimpleMessageResponse> {
    return this.http.post<SimpleMessageResponse>(`${API_BASE}/auth/register`, body, { withCredentials: true });
  }

  verifyOtp(body: OtpVerifyRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API_BASE}/auth/verify-otp`, body, { withCredentials: true }).pipe(
      tap(u => this.setUser(u)),
    );
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<SimpleMessageResponse> {
    return this.http.post<SimpleMessageResponse>(`${API_BASE}/auth/forgot-password`, body, { withCredentials: true });
  }

  resetPassword(body: ResetPasswordRequest): Observable<SimpleMessageResponse> {
    return this.http.post<SimpleMessageResponse>(`${API_BASE}/auth/reset-password`, body, { withCredentials: true });
  }

  loginWithGoogleCode(body: GoogleAuthRequest): Observable<AuthUser | GoogleRegistrationChallenge> {
    return this.http.post<AuthUser | GoogleRegistrationChallenge>(`${API_BASE}/auth/google`, body, { withCredentials: true }).pipe(
      tap(res => {
        if ('id' in res) {
          this.setUser(res as AuthUser);
        }
      })
    );
  }

  completeGoogleRegistration(body: GoogleCompleteRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${API_BASE}/auth/google/complete`, body, { withCredentials: true }).pipe(
      tap(u => this.setUser(u))
    );
  }

  refresh(): Observable<AuthUser | null> {
    return this.http.post<AuthUser>(`${API_BASE}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(u => this.setUser(u)),
      catchError(() => { this.setUser(null); return of(null); }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<SimpleMessageResponse>(`${API_BASE}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => { this.setUser(null); this.router.navigateByUrl('/auth'); }),
      map(() => undefined),
      catchError(() => { this.setUser(null); this.router.navigateByUrl('/auth'); return of(undefined); }),
    );
  }

  googleLogin(): void {
    this.http.get<GoogleOAuthConfigResponse>(`${API_BASE}/auth/google/config`).subscribe({
      next: cfg => {
        const state = this.createGoogleState();
        sessionStorage.setItem(this.googleStateKey, state);
        sessionStorage.setItem(this.googleRedirectKey, cfg.redirectUri);

        const query = new URLSearchParams({
          client_id: cfg.clientId,
          redirect_uri: cfg.redirectUri,
          response_type: 'code',
          scope: 'openid email profile',
          prompt: 'select_account',
          state,
          access_type: 'offline',
        });
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`;
      },
      error: () => {
        alert('Google sign-in is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI on the backend.');
      },
    });
  }

  consumeGoogleRedirectUri(): string | null {
    const v = sessionStorage.getItem(this.googleRedirectKey);
    sessionStorage.removeItem(this.googleRedirectKey);
    return v;
  }

  validateGoogleState(state: string | null): boolean {
    if (!state) return false;
    const expected = sessionStorage.getItem(this.googleStateKey);
    sessionStorage.removeItem(this.googleStateKey);
    return !!expected && expected === state;
  }

  private createGoogleState(): string {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  defaultRouteForRole(role: UserRole | null | undefined): string {
    switch (role) {
      case 'ADMIN':      return '/admin';
      case 'ENSEIGNANT': return '/teacher';
      case 'ETUDIANT':   return '/student';
      default:           return '/auth';
    }
  }
}
