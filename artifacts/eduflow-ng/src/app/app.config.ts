import {
  ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, importProvidersFrom,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch, HttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { ThemeService } from './core/services/theme.service';
import { LanguageService } from './core/services/language.service';
import { AuthService } from './core/services/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

function initApp(theme: ThemeService, lang: LanguageService, auth: AuthService) {
  return () => {
    theme.init();
    lang.init();
    // Best-effort session restore. Errors swallowed — guards run again on navigation.
    return new Promise<void>(resolve => {
      auth.bootstrap().subscribe({ next: () => resolve(), error: () => resolve() });
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimations(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: { provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient] },
      }),
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [ThemeService, LanguageService, AuthService],
      multi: true,
    },
  ],
};
