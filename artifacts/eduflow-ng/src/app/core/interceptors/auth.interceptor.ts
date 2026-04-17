import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

const REFRESH_PATH = '/api/auth/refresh';
const LOGIN_PATH = '/api/auth/login';
const ME_PATH = '/api/auth/me';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Always send credentials for same-origin /api calls so cookies travel.
  const apiCall = req.url.startsWith('/api');
  const withCreds = apiCall ? req.clone({ withCredentials: true }) : req;
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(withCreds).pipe(
    catchError((err: HttpErrorResponse) => {
      if (
        err.status === 401 &&
        apiCall &&
        ![REFRESH_PATH, LOGIN_PATH, ME_PATH].some(p => req.url.startsWith(p))
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
