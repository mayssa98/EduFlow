import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../core/services/auth.service';
import { SidebarComponent, SidebarItem } from '../shared/components/sidebar/sidebar.component';
import { LanguageSwitcherComponent } from '../shared/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';
import { APP_ICONS } from '../shared/icons/app-icons';

const {
  home: ICON_HOME,
  users: ICON_USERS,
  book: ICON_BOOK,
  chart: ICON_CHART,
  sparkles: ICON_ZAP,
  logout: ICON_LOGOUT,
  document: ICON_FILE,
  profile: ICON_PROFILE,
  settings: ICON_SETTINGS,
  approval: ICON_CHECK,
} = APP_ICONS;

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslateModule, SidebarComponent, LanguageSwitcherComponent, ThemeToggleComponent],
  template: `
    <div class="shell">
      <app-sidebar [items]="items()"></app-sidebar>
      <div class="main">
        <header class="topbar glass">
          <div class="title-group">
            <div class="title">
              <span class="hello">{{ 'DASHBOARD.WELCOME' | translate }}</span>
              <div class="headline">
                <strong>{{ user()?.prenom }} {{ user()?.nom }}</strong>
                <span class="role-chip">{{ ('ROLES.' + roleKey()) | translate }}</span>
              </div>
              <span class="workspace-tag">{{ workspaceCopy() }}</span>
            </div>
          </div>
          <div class="actions">
            <app-language-switcher></app-language-switcher>
            <app-theme-toggle></app-theme-toggle>
            <button class="btn btn-outline btn-sm" (click)="logout()" [title]="'NAV.LOGOUT' | translate">
              <span [innerHTML]="logoutIcon"></span>
              <span class="hide-sm">{{ 'NAV.LOGOUT' | translate }}</span>
            </button>
          </div>
        </header>
        <main class="content fade-up">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell { display: flex; min-height: 100vh; background: var(--color-background); color: var(--color-foreground); }
    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      position: sticky; top: 0; z-index: 20;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; padding: 12px 22px; margin: 12px 16px 0;
      border-radius: var(--radius-lg);
    }
    .title-group { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .title { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; }
    .headline { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
    .hello {
      color: var(--color-muted-foreground);
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .title strong { font-family: var(--font-display); font-size: 1.08rem; font-weight: 800; }
    .role-chip {
      font-family: var(--font-display); font-weight: 600; font-size: 0.7rem; text-transform: uppercase;
      padding: 3px 10px; border-radius: 999px; letter-spacing: 0.04em;
      background: rgba(99, 102, 241, 0.14); color: var(--indigo-400);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .workspace-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      color: var(--color-muted-foreground);
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      font-size: 0.76rem;
      font-weight: 600;
    }
    .actions { display: flex; align-items: center; gap: 8px; }
    .content { flex: 1; padding: 22px; overflow-x: hidden; }
    @media (max-width: 920px) { .title-group { gap: 10px; } }
    @media (max-width: 820px) { .topbar { align-items: flex-start; } }
    @media (max-width: 720px) { .hide-sm { display: none; } }
  `],
})
export class AuthenticatedLayoutComponent {
  private auth = inject(AuthService);

  readonly logoutIcon = ICON_LOGOUT;
  readonly user = this.auth.user;
  readonly homeRoute = computed(() => {
    const role = this.auth.role();
    return role === 'ADMIN' ? '/admin' : role === 'ENSEIGNANT' ? '/teacher' : '/student';
  });
  readonly roleKey = computed(() => {
    const r = this.auth.role();
    return r === 'ADMIN' ? 'ADMIN' : r === 'ENSEIGNANT' ? 'TEACHER' : 'STUDENT';
  });
  readonly workspaceCopy = computed(() => {
    const role = this.auth.role();
    return role === 'ADMIN'
      ? 'Pilotage de la plateforme'
      : role === 'ENSEIGNANT'
        ? 'Suivi pedagogique'
        : 'Parcours etudiant';
  });

  readonly items = computed<SidebarItem[]>(() => {
    const role = this.auth.role();

    if (role === 'ADMIN') {
      return [
        { route: this.homeRoute(),   labelKey: 'NAV.DASHBOARD',  icon: ICON_HOME,    shortLabel: 'Dashboard' },
        { route: '/admin/users',     labelKey: 'NAV.STUDENTS',   icon: ICON_USERS,   shortLabel: 'Utilisateurs' },
        { route: '/admin/courses',   labelKey: 'NAV.COURSES',    icon: ICON_BOOK,    shortLabel: 'Cours' },
        { route: '/admin/approvals', labelKey: 'NAV.APPROVALS',  icon: ICON_CHECK,   shortLabel: 'Validation' },
        { route: '/profile',         labelKey: 'NAV.PROFILE',    icon: ICON_PROFILE, shortLabel: 'Profil' },
        { route: '/settings',        labelKey: 'NAV.SETTINGS',   icon: ICON_SETTINGS, shortLabel: 'Reglages' },
      ];
    }
    if (role === 'ENSEIGNANT') {
      return [
        { route: this.homeRoute(),        labelKey: 'NAV.DASHBOARD',    icon: ICON_HOME,    shortLabel: 'Dashboard' },
        { route: '/teacher/courses',      labelKey: 'NAV.COURSES',      icon: ICON_BOOK,    shortLabel: 'Cours' },
        { route: '/teacher/assignments',  labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE,    shortLabel: 'Travaux' },
        { route: '/teacher/ai-analysis',  labelKey: 'AI.MENU',          icon: ICON_ZAP,     shortLabel: 'Analyse IA' },
        { route: '/profile',              labelKey: 'NAV.PROFILE',      icon: ICON_PROFILE, shortLabel: 'Profil' },
        { route: '/settings',             labelKey: 'NAV.SETTINGS',     icon: ICON_SETTINGS, shortLabel: 'Reglages' },
      ];
    }
    // ETUDIANT
    return [
      { route: this.homeRoute(),        labelKey: 'NAV.DASHBOARD',    icon: ICON_HOME,    shortLabel: 'Dashboard' },
      { route: '/student/courses',      labelKey: 'NAV.COURSES',      icon: ICON_BOOK,    shortLabel: 'Cours' },
      { route: '/student/assignments',  labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE,    shortLabel: 'Devoirs' },
      { route: '/student/grades',       labelKey: 'NAV.GRADES',       icon: ICON_CHART,   shortLabel: 'Notes' },
      { route: '/profile',              labelKey: 'NAV.PROFILE',      icon: ICON_PROFILE, shortLabel: 'Profil' },
      { route: '/settings',             labelKey: 'NAV.SETTINGS',     icon: ICON_SETTINGS, shortLabel: 'Reglages' },
    ];
  });

  logout(): void { this.auth.logout().subscribe(); }
}
