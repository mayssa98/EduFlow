import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

const API_PREFIX = '/api';
const API_ABSOLUTE_REGEX = /^https?:\/\/[^/]+\/api(?:\/|$)/i;
const REFRESH_PATH = '/api/auth/refresh';
const LOGIN_PATH = '/api/auth/login';
const ME_PATH = '/api/auth/me';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Always send credentials for API calls (relative or absolute) so cookie auth works in dev and prod.
  const apiCall = req.url.startsWith(API_PREFIX) || API_ABSOLUTE_REGEX.test(req.url);
  const withCreds = apiCall ? req.clone({ withCredentials: true }) : req;
  const auth = inject(AuthService);
  const router = inject(Router);

  const isRefreshCall = req.url.includes(REFRESH_PATH);
  const isLoginCall = req.url.includes(LOGIN_PATH);
  const isMeCall = req.url.includes(ME_PATH);

  return next(withCreds).pipe(
    catchError((err: HttpErrorResponse) => {
      if (
        err.status === 401 &&
        apiCall &&
        !isRefreshCall &&
        !isLoginCall &&
        !isMeCall
      ) {
        return tryRefreshAndRetry(withCreds, next, auth, router);
      }
      return throwError(() => err);
    }),
  );
};

function tryRefreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
) {
  return auth.refresh().pipe(
    switchMap(user => {
      if (!user) {
        router.navigateByUrl('/auth');
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      }
      return next(req);
    }),
    catchError(() => {
      router.navigateByUrl('/auth');
      return of();
    }),
  );
}
