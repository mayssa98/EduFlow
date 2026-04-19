import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

/**
 * Check if user is authenticated, then redirect based on statutCompte:
 * - PENDING_APPROVAL / PENDING → /pending (except if already there)
 * - BLOCKED → /auth
 * - ACTIVE → allow through (or redirect to onboarding if not done)
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const checkStatus = (user: any): boolean => {
    if (!user) {
      router.navigateByUrl('/auth');
      return false;
    }
    const status = user.statutCompte ?? user.status ?? 'ACTIVE';
    const currentPath = route.routeConfig?.path ?? '';

    // BLOCKED → kick to auth
    if (status === 'BLOCKED') {
      router.navigateByUrl('/auth');
      return false;
    }

    // PENDING_APPROVAL → only allow /pending page
    if (status === 'PENDING_APPROVAL' || status === 'PENDING') {
      if (currentPath === 'pending') return true;
      router.navigateByUrl('/pending');
      return false;
    }

    // ACTIVE → don't let them visit /pending
    if (currentPath === 'pending') {
      // Check if onboarding is done
      const onboardingDone = localStorage.getItem('eduflow.onboarding.done');
      if (!onboardingDone) {
        router.navigateByUrl('/onboarding');
      } else {
        router.navigateByUrl(auth.defaultRouteForRole(user.role));
      }
      return false;
    }

    return true;
  };

  if (auth.isAuthenticated()) return checkStatus(auth.user());
  return auth.bootstrap().pipe(map(u => checkStatus(u)));
};

export const roleGuard = (allowed: UserRole[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const proceed = (role: UserRole | null) => {
    if (role && allowed.includes(role)) return true;
    router.navigateByUrl(auth.defaultRouteForRole(role));
    return false;
  };
  if (auth.isAuthenticated()) return of(proceed(auth.role()));
  return auth.bootstrap().pipe(map(u => proceed(u?.role ?? null)));
};

/** Sends already-authenticated users away from /auth straight to their dashboard. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const redirect = (user: any) => {
    if (!user) return true;
    const status = user.statutCompte ?? user.status ?? 'ACTIVE';
    if (status === 'PENDING_APPROVAL' || status === 'PENDING') {
      router.navigateByUrl('/pending');
      return false;
    }
    if (status === 'BLOCKED') return true; // Let them see auth page
    router.navigateByUrl(auth.defaultRouteForRole(user.role));
    return false;
  };

  if (auth.isAuthenticated()) return redirect(auth.user());
  return auth.bootstrap().pipe(map(u => redirect(u)));
};
