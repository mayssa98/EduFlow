import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'login',
    redirectTo: 'auth',
    pathMatch: 'full',
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
    path: 'pending',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/pending-page.component').then(m => m.PendingPageComponent),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./features/onboarding/onboarding-welcome.component').then(m => m.OnboardingWelcomeComponent),
  },
  {
    path: 'onboarding/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/onboarding/onboarding-profile.component').then(m => m.OnboardingProfileComponent),
  },
  {
    path: 'onboarding/complete',
    canActivate: [authGuard],
    loadComponent: () => import('./features/onboarding/onboarding-final.component').then(m => m.OnboardingFinalComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/authenticated-layout.component').then(m => m.AuthenticatedLayoutComponent),
    children: [
      // ── Admin ────────────────────────────────────────────────
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
        path: 'admin/approvals',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/admin/approvals.component').then(m => m.AdminApprovalsComponent),
      },
      {
        path: 'admin/courses',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/admin/admin-courses.component').then(m => m.AdminCoursesComponent),
      },

      // ── Teacher ──────────────────────────────────────────────
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
        path: 'teacher/courses/:id',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/course-detail.component').then(m => m.TeacherCourseDetailComponent),
      },
      {
        path: 'teacher/assignments',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/teacher-assignments.component').then(m => m.TeacherAssignmentsComponent),
      },
      {
        path: 'teacher/assignments/:id/submissions',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/submissions-grade.component').then(m => m.TeacherSubmissionsGradeComponent),
      },
      {
        path: 'teacher/ai-analysis',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./features/teacher/teacher-ai-analysis.component').then(m => m.TeacherAiAnalysisComponent),
      },

      // ── Student ──────────────────────────────────────────────
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
        path: 'student/courses/:id',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./features/student/course-detail.component').then(m => m.StudentCourseDetailComponent),
      },
      {
        path: 'student/assignments',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./features/student/student-assignments.component').then(m => m.StudentAssignmentsComponent),
      },
      {
        path: 'student/grades',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./features/student/student-grades.component').then(m => m.StudentGradesComponent),
      },

      // ── Common (all roles) ───────────────────────────────────
      {
        path: 'profile',
        redirectTo: 'settings/profile',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/settings/settings-page.component').then(m => m.SettingsPageComponent),
      },
      {
        path: 'settings/:section',
        loadComponent: () => import('./shared/components/settings/settings-page.component').then(m => m.SettingsPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
