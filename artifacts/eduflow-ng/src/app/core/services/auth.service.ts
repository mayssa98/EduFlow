import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, of, catchError, map } from 'rxjs';
import {
  AuthUser, AuthUserResponse, LoginRequest, RegisterRequest,
  OtpVerifyRequest, ForgotPasswordRequest, ResetPasswordRequest,
  SimpleMessageResponse, UserRole,
} from '../models/auth.models';

export const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
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
    return this.http.get<AuthUserResponse>(`${API_BASE}/auth/me`, { withCredentials: true }).pipe(
      map(r => r.user),
      tap(u => this.setUser(u)),
      catchError(() => { this.setUser(null); return of(null); }),
    );
  }

  login(body: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUserResponse>(`${API_BASE}/auth/login`, body, { withCredentials: true }).pipe(
      map(r => r.user),
      tap(u => this.setUser(u)),
    );
  }

  register(body: RegisterRequest): Observable<SimpleMessageResponse> {
    return this.http.post<SimpleMessageResponse>(`${API_BASE}/auth/register`, body, { withCredentials: true });
  }

  verifyOtp(body: OtpVerifyRequest): Observable<AuthUser> {
    return this.http.post<AuthUserResponse>(`${API_BASE}/auth/verify-otp`, body, { withCredentials: true }).pipe(
      map(r => r.user),
      tap(u => this.setUser(u)),
    );
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<SimpleMessageResponse> {
    return this.http.post<SimpleMessageResponse>(`${API_BASE}/auth/forgot-password`, body, { withCredentials: true });
  }

  resetPassword(body: ResetPasswordRequest): Observable<SimpleMessageResponse> {
    return this.http.post<SimpleMessageResponse>(`${API_BASE}/auth/reset-password`, body, { withCredentials: true });
  }

  refresh(): Observable<AuthUser | null> {
    return this.http.post<AuthUserResponse>(`${API_BASE}/auth/refresh`, {}, { withCredentials: true }).pipe(
      map(r => r.user),
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

  /** Initiate Google OAuth flow by redirecting to backend endpoint. */
  googleLogin(): void {
    // Backend exposes POST /auth/google for token exchange.
    // For an authorization-code flow the user clicks an external Google URL.
    // Until the redirect URL is configured at runtime, expose a hook the host can override.
    const googleUrl = (window as unknown as { __EDUFLOW_GOOGLE_URL?: string }).__EDUFLOW_GOOGLE_URL;
    if (googleUrl) { window.location.href = googleUrl; return; }
    // Fallback: alert until OAuth client id is provisioned.
    alert('Google sign-in is not configured yet. Set GOOGLE_CLIENT_ID on the backend.');
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
