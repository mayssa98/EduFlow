import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../core/services/auth.service';
import { SidebarComponent, SidebarItem } from '../shared/components/sidebar/sidebar.component';
import { LanguageSwitcherComponent } from '../shared/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';

import { ICONS } from '../shared/icons';

const ICON_HOME      = ICONS.home;
const ICON_USERS     = ICONS.users;
const ICON_BOOK      = ICONS.book;
const ICON_ZAP       = ICONS.sparkles;
const ICON_LOGOUT    = ICONS.logout;
const ICON_FILE      = ICONS.file;
const ICON_PROFILE   = ICONS.user;
const ICON_INBOX     = ICONS.inbox;

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslateModule, SidebarComponent, LanguageSwitcherComponent, ThemeToggleComponent],
  template: `
    <div class="shell">
      <app-sidebar [items]="items()"></app-sidebar>
      <div class="main">
        <header class="topbar glass">
          <div class="title">
            <span class="hello">{{ 'DASHBOARD.WELCOME' | translate }},</span>
            <strong>{{ user()?.prenom }} {{ user()?.nom }}</strong>
            <span class="role-chip">{{ ('ROLES.' + roleKey()) | translate }}</span>
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
    .title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .hello { color: var(--color-muted-foreground); font-size: 0.92rem; }
    .title strong { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; }
    .role-chip {
      font-family: var(--font-display); font-weight: 600; font-size: 0.7rem; text-transform: uppercase;
      padding: 3px 10px; border-radius: 999px; letter-spacing: 0.04em;
      background: rgba(99, 102, 241, 0.14); color: var(--indigo-400);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .actions { display: flex; align-items: center; gap: 8px; }
    .content { flex: 1; padding: 22px; overflow-x: hidden; }
    @media (max-width: 720px) { .hide-sm { display: none; } }
  `],
})
export class AuthenticatedLayoutComponent {
  private auth = inject(AuthService);

  readonly logoutIcon = ICON_LOGOUT;
  readonly user = this.auth.user;
  readonly roleKey = computed(() => {
    const r = this.auth.role();
    return r === 'ADMIN' ? 'ADMIN' : r === 'ENSEIGNANT' ? 'TEACHER' : 'STUDENT';
  });

  readonly items = computed<SidebarItem[]>(() => {
    const role = this.auth.role();
    const home =
      role === 'ADMIN'      ? '/admin' :
      role === 'ENSEIGNANT' ? '/teacher' :
      '/student';

    if (role === 'ADMIN') {
      return [
        { route: '/admin',           labelKey: 'NAV.DASHBOARD', icon: ICON_HOME },
        { route: '/admin/users',     labelKey: 'NAV.USERS',     icon: ICON_USERS },
        { route: '/admin/approvals', labelKey: 'NAV.APPROVALS', icon: ICON_INBOX },
        { route: '/profile',         labelKey: 'NAV.PROFILE',   icon: ICON_PROFILE },
      ];
    }
    if (role === 'ENSEIGNANT') {
      return [
        { route: '/teacher',             labelKey: 'NAV.DASHBOARD',    icon: ICON_HOME },
        { route: '/teacher/courses',     labelKey: 'NAV.COURSES',      icon: ICON_BOOK },
        { route: '/teacher/assignments', labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE },
        { route: '/teacher/ai-analysis', labelKey: 'AI.MENU',          icon: ICON_ZAP },
        { route: '/profile',             labelKey: 'NAV.PROFILE',      icon: ICON_PROFILE },
      ];
    }
    // ETUDIANT
    return [
      { route: '/student',             labelKey: 'NAV.DASHBOARD',    icon: ICON_HOME },
      { route: '/student/courses',     labelKey: 'NAV.COURSES',      icon: ICON_BOOK },
      { route: '/student/assignments', labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE },
      { route: '/profile',             labelKey: 'NAV.PROFILE',      icon: ICON_PROFILE },
    ];
  });

  logout(): void { this.auth.logout().subscribe(); }
}
