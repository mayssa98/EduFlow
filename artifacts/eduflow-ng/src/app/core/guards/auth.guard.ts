import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  // Try a session refresh before redirecting (cookies still present).
  return auth.bootstrap().pipe(map(u => {
    if (u) return true;
    router.navigateByUrl('/auth');
    return false;
  }));
};

export const roleGuard = (allowed: UserRole[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const proceed = (role: UserRole | null) => {
    if (role && allowed.includes(role)) return true;
    router.navigateByUrl(auth.defaultRouteForRole(role, auth.user()));
    return false;
  };
  if (auth.isAuthenticated()) return of(proceed(auth.role()));
  return auth.bootstrap().pipe(map(u => proceed(u?.role ?? null)));
};

/** Sends already-authenticated users away from /auth straight to their dashboard. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const redirect = (role: UserRole | null) => {
    if (role) { router.navigateByUrl(auth.defaultRouteForRole(role, auth.user())); return false; }
    return true;
  };
  if (auth.isAuthenticated()) return redirect(auth.role());
  return auth.bootstrap().pipe(map(u => redirect(u?.role ?? null)));
};
