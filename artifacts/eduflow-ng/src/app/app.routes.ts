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
    path: 'auth/google/callback',
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
        path: 'admin/users',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/admin/admin-users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'teacher',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
      },
      {
        path: 'teacher/courses',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/teacher-courses.component').then(m => m.TeacherCoursesComponent),
      },
      {
        path: 'teacher/assignments',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/teacher-assignments.component').then(m => m.TeacherAssignmentsComponent),
      },
      {
        path: 'teacher/ai-analysis',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/teacher-ai-analysis.component').then(m => m.TeacherAiAnalysisComponent),
      },
      {
        path: 'student',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./features/student/student-dashboard.component').then(m => m.StudentDashboardComponent),
      },
      {
        path: 'student/courses',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./features/student/student-courses.component').then(m => m.StudentCoursesComponent),
      },
      {
        path: 'student/assignments',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./features/student/student-assignments.component').then(m => m.StudentAssignmentsComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./shared/components/profile/profile-page.component').then(m => m.ProfilePageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
