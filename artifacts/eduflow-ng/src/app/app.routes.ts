import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'login',
    pathMatch: 'full',
    redirectTo: 'auth',
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
    path: 'verify-email',
    loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
    data: { title: 'Vérification email', subtitle: 'Confirmez votre email pour activer votre compte.' },
  },
  {
    path: 'blocked',
    loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
    data: { title: 'Compte bloqué', subtitle: 'Votre compte est bloqué. Veuillez contacter l’administration.' },
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
        path: 'admin/teachers/pending',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Approbation enseignants', subtitle: 'Validation des enseignants en attente.' },
      },
      {
        path: 'admin/groups',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Gestion groupes-classe', subtitle: 'CRUD des groupes, affectations et niveaux.' },
      },
      {
        path: 'admin/subjects',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Gestion matières', subtitle: 'Gestion et archivage des matières.' },
      },
      {
        path: 'admin/change-requests',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Demandes de changement de classe', subtitle: 'Traitement des demandes approuver/rejeter.' },
      },
      {
        path: 'admin/stats',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Statistiques', subtitle: 'Vue globale des indicateurs plateforme.' },
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
        path: 'teacher/courses/new',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Nouveau cours', subtitle: 'Création guidée d’un cours.' },
      },
      {
        path: 'teacher/courses/:courseId',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Détail cours enseignant', subtitle: 'Vue détaillée du cours et modules associés.' },
      },
      {
        path: 'teacher/courses/:courseId/edit',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Édition cours', subtitle: 'Modification des informations du cours.' },
      },
      {
        path: 'teacher/courses/:courseId/materials',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Supports pédagogiques', subtitle: 'Upload, aperçu et gestion des supports.' },
      },
      {
        path: 'teacher/courses/:courseId/assignments',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Devoirs du cours', subtitle: 'Gestion des devoirs liés à ce cours.' },
      },
      {
        path: 'teacher/assignments/:assignmentId/submissions',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Correction des soumissions', subtitle: 'Consultation et notation des rendus.' },
      },
      {
        path: 'teacher/courses/:courseId/ai-analysis',
        canActivate: [roleGuard(['ENSEIGNANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Analyse IA du cours', subtitle: 'Score global, risque et recommandations.' },
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
        path: 'student/courses/:courseId',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Détail cours étudiant', subtitle: 'Contenu, devoirs et progression du cours.' },
      },
      {
        path: 'student/assignments/:assignmentId/submit',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Soumettre un devoir', subtitle: 'Réponse texte, fichier et état de correction.' },
      },
      {
        path: 'student/progress',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Progression', subtitle: 'Suivi de progression et moyenne générale.' },
      },
      {
        path: 'student/change-class-request',
        canActivate: [roleGuard(['ETUDIANT'])],
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Demande changement de classe', subtitle: 'Création et suivi des demandes.' },
      },
      {
        path: 'notifications',
        loadComponent: () => import('./shared/components/placeholder/placeholder-page.component').then(m => m.PlaceholderPageComponent),
        data: { title: 'Notifications', subtitle: 'Liste lues/non lues et marquage.' },
      },
      {
        path: 'profile',
        loadComponent: () => import('./shared/components/profile/profile-page.component').then(m => m.ProfilePageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
