import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then(m => m.LandingPageComponent)
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth-page.component').then(m => m.AuthPageComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
