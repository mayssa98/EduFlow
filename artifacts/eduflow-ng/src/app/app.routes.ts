import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-page.component').then(m => m.AuthPageComponent),
  },
  {
    path: 'auth/forgot',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/authenticated-layout.component').then(m => m.AuthenticatedLayoutComponent),
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'teacher',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
      },
      {
        path: 'student',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./features/student/student-dashboard.component').then(m => m.StudentDashboardComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
