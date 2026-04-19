import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../core/services/auth.service';
import { SidebarComponent, SidebarItem } from '../shared/components/sidebar/sidebar.component';
import { LanguageSwitcherComponent } from '../shared/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle/theme-toggle.component';

const ICON_HOME      = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9"/><path d="M5 10v10h14V10"/></svg>`;
const ICON_USERS     = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const ICON_BOOK      = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h7a4 4 0 0 1 4 4v12"/><path d="M22 4h-7a4 4 0 0 0-4 4v12"/><line x1="2" y1="20" x2="13" y2="20"/><line x1="11" y1="20" x2="22" y2="20"/></svg>`;
const ICON_CHART     = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
const ICON_ZAP       = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const ICON_LOGOUT    = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const ICON_FILE      = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const ICON_PROFILE   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const ICON_APPROVALS = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9a9 9 0 1 1 0-18 9 9 0 0 1 9 9Z"/></svg>`;

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
        { route: '/admin/approvals', labelKey: 'NAV.APPROVALS', icon: ICON_APPROVALS },
        { route: '/profile',         labelKey: 'NAV.PROFILE',   icon: ICON_PROFILE },
      ];
    }
    if (role === 'ENSEIGNANT') {
      return [
        { route: '/teacher',  labelKey: 'NAV.DASHBOARD',  icon: ICON_HOME },
        { route: '/teacher/courses',  labelKey: 'NAV.COURSES',    icon: ICON_BOOK },
        { route: '/teacher/assignments',  labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE },
        { route: '/teacher/ai-analysis',  labelKey: 'AI.MENU',        icon: ICON_ZAP },
        { route: '/profile',  labelKey: 'NAV.PROFILE',    icon: ICON_PROFILE },
      ];
    }
    // ETUDIANT
    return [
      { route: '/student',  labelKey: 'NAV.DASHBOARD',    icon: ICON_HOME },
      { route: '/student/courses',  labelKey: 'NAV.COURSES',      icon: ICON_BOOK },
      { route: '/student/assignments',  labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE },
      { route: '/student',  labelKey: 'DASHBOARD.OVERVIEW', icon: ICON_CHART },
      { route: '/profile',  labelKey: 'NAV.PROFILE',      icon: ICON_PROFILE },
    ];
  });

  logout(): void { this.auth.logout().subscribe(); }
}
