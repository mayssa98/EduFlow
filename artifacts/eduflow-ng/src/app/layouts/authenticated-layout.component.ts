import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/user.service';
import { SidebarComponent, SidebarItem } from '../shared/components/sidebar/sidebar.component';
import { APP_ICONS } from '../shared/icons/app-icons';
import { SafeHtmlPipe } from '../shared/pipes/safe-html.pipe';

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
  graduation: ICON_GRADUATION,
  rocket: ICON_ROCKET,
} = APP_ICONS;

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslateModule, SidebarComponent, SafeHtmlPipe],
  template: `
    <div class="shell">
      <app-sidebar [items]="items()"></app-sidebar>
      <div class="main">
        <header class="topbar glass">
          <div class="title-group">
            <input
              #headerAvatarInput
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              (change)="onAvatarSelected($event)"
            />
            <button
              class="profile-avatar"
              type="button"
              (click)="triggerAvatarPicker()"
              [disabled]="avatarUploading()"
              title="Choisir une photo de profil"
            >
              <img
                *ngIf="avatarUrl()"
                [src]="avatarUrl()!"
                alt="Photo de profil"
                class="profile-avatar-img"
              />
              <span *ngIf="!avatarUrl()" class="profile-avatar-fallback" [innerHTML]="avatarFallbackIcon | safeHtml"></span>
              <span class="profile-avatar-plus" aria-hidden="true">+</span>
            </button>
            <div class="title">
              <span class="hello">{{ 'DASHBOARD.WELCOME' | translate }}</span>
              <div class="headline">
                <strong>{{ user()?.prenom }} {{ user()?.nom }}</strong>
                <span class="role-chip">{{ ('ROLES.' + roleKey()) | translate }}</span>
              </div>
              <span class="workspace-tag">
                <span class="workspace-tag-icon" [innerHTML]="workspaceIcon | safeHtml"></span>
                {{ workspaceCopy() }}
              </span>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-outline btn-sm" (click)="logout()" [title]="'NAV.LOGOUT' | translate">
              <span class="logout-icon" [innerHTML]="logoutIcon | safeHtml"></span>
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
      overflow: visible;
      background:
        radial-gradient(circle at top right, rgba(99,102,241,0.16), transparent 26%),
        linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
    }
    .title-group { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .profile-avatar {
      position: relative;
      width: 56px;
      height: 56px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      background: linear-gradient(145deg, rgba(99,102,241,0.22), rgba(56,189,248,0.12));
      border: 1px solid rgba(129,140,248,0.26);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 18px 30px rgba(59,130,246,0.12);
      flex-shrink: 0;
      padding: 0;
      overflow: visible;
      cursor: pointer;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }
    .profile-avatar:disabled {
      opacity: 0.7;
      cursor: wait;
      transform: none;
    }
    .profile-avatar:hover {
      transform: translateY(-1px);
      border-color: rgba(129,140,248,0.4);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 20px 34px rgba(59,130,246,0.18);
    }
    .profile-avatar::after {
      content: '';
      position: absolute;
      inset: -10px;
      border-radius: 24px;
      border: 1px solid rgba(99,102,241,0.08);
      animation: haloPulse 4.8s ease-in-out infinite;
    }
    .profile-avatar-img,
    .profile-avatar-fallback {
      width: 100%;
      height: 100%;
      border-radius: inherit;
    }
    .profile-avatar-img {
      object-fit: cover;
      display: block;
    }
    .profile-avatar-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #c7d2fe;
      animation: floatBadge 5.4s ease-in-out infinite;
    }
    .profile-avatar-plus {
      position: absolute;
      right: -4px;
      bottom: -4px;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      color: #fff;
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      line-height: 1;
      border: 2px solid rgba(15, 23, 42, 0.92);
      box-shadow: 0 10px 18px rgba(37,99,235,0.3);
      z-index: 1;
    }
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
      gap: 8px;
      padding: 4px 10px;
      border-radius: 999px;
      color: var(--color-muted-foreground);
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      font-size: 0.76rem;
      font-weight: 600;
    }
    .workspace-tag-icon,
    .logout-icon {
      display: inline-flex;
      color: #a5b4fc;
    }
    .actions { display: flex; align-items: center; gap: 8px; }
    .content { flex: 1; padding: 22px; overflow-x: hidden; }
    @keyframes haloPulse {
      0%, 100% { transform: scale(0.96); opacity: 0.45; }
      50% { transform: scale(1); opacity: 0.95; }
    }
    @keyframes floatBadge {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    @media (max-width: 920px) { .title-group { gap: 10px; } }
    @media (max-width: 820px) {
      .topbar { align-items: flex-start; }
      .profile-avatar { width: 48px; height: 48px; border-radius: 18px; }
    }
    @media (max-width: 720px) { .hide-sm { display: none; } }
  `],
})
export class AuthenticatedLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private userSvc = inject(UserService);

  @ViewChild('headerAvatarInput') private headerAvatarInput?: ElementRef<HTMLInputElement>;

  readonly avatarUploading = signal(false);

  readonly logoutIcon = ICON_LOGOUT;
  readonly workspaceIcon = ICON_ROCKET;
  readonly avatarFallbackIcon = ICON_PROFILE;
  readonly user = this.auth.user;
  readonly avatarUrl = computed(() => this.user()?.photoUrl?.trim() || null);
  readonly homeRoute = computed(() => {
    const role = this.auth.role();
    return role === 'ADMIN' ? '/admin' : role === 'ENSEIGNANT' ? '/teacher' : '/student';
  });
  readonly roleKey = computed(() => {
    const r = this.auth.role();
    return r === 'ADMIN' ? 'ADMIN' : r === 'ENSEIGNANT' ? 'TEACHER' : 'STUDENT';
  });
  readonly roleBadgeIcon = computed(() => {
    const role = this.auth.role();
    return role === 'ADMIN' ? ICON_CHECK : role === 'ENSEIGNANT' ? ICON_ROCKET : ICON_GRADUATION;
  });
  readonly workspaceCopy = computed(() => {
    const role = this.auth.role();
    return role === 'ADMIN'
      ? 'Pilotage de la plateforme'
      : role === 'ENSEIGNANT'
        ? 'Suivi pedagogique'
        : 'Parcours etudiant';
  });

  triggerAvatarPicker(): void {
    this.headerAvatarInput?.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (input) input.value = '';
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      return;
    }

    this.avatarUploading.set(true);
    this.userSvc.uploadAvatar(file).subscribe({
      next: profile => {
        this.auth.patchCurrentUser({ photoUrl: profile.photoUrl ?? undefined });
        this.avatarUploading.set(false);
      },
      error: () => {
        this.avatarUploading.set(false);
      },
    });
  }

  readonly items = computed<SidebarItem[]>(() => {
    const role = this.auth.role();

    if (role === 'ADMIN') {
      return [
        { route: this.homeRoute(),   labelKey: 'NAV.DASHBOARD',  icon: ICON_HOME,    shortLabel: 'Dashboard' },
        { route: '/admin/users',     labelKey: 'NAV.STUDENTS',   icon: ICON_USERS,   shortLabel: 'Utilisateurs' },
        { route: '/admin/courses',   labelKey: 'NAV.COURSES',    icon: ICON_BOOK,    shortLabel: 'Cours' },
        { route: '/admin/approvals', labelKey: 'NAV.APPROVALS',  icon: ICON_CHECK,   shortLabel: 'Validation' },
        { route: '/settings',        labelKey: 'NAV.SETTINGS',   icon: ICON_SETTINGS, shortLabel: 'Reglages' },
      ];
    }
    if (role === 'ENSEIGNANT') {
      return [
        { route: this.homeRoute(),        labelKey: 'NAV.DASHBOARD',    icon: ICON_HOME,    shortLabel: 'Dashboard' },
        { route: '/teacher/courses',      labelKey: 'NAV.COURSES',      icon: ICON_BOOK,    shortLabel: 'Cours' },
        { route: '/teacher/assignments',  labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE,    shortLabel: 'Travaux' },
        { route: '/teacher/ai-analysis',  labelKey: 'AI.MENU',          icon: ICON_ZAP,     shortLabel: 'Analyse IA' },
        { route: '/settings',             labelKey: 'NAV.SETTINGS',     icon: ICON_SETTINGS, shortLabel: 'Reglages' },
      ];
    }
    // ETUDIANT
    return [
      { route: this.homeRoute(),        labelKey: 'NAV.DASHBOARD',    icon: ICON_HOME,    shortLabel: 'Dashboard' },
      { route: '/student/courses',      labelKey: 'NAV.COURSES',      icon: ICON_BOOK,    shortLabel: 'Cours' },
      { route: '/student/assignments',  labelKey: 'ASSIGNMENTS.MENU', icon: ICON_FILE,    shortLabel: 'Devoirs' },
      { route: '/student/grades',       labelKey: 'NAV.GRADES',       icon: ICON_CHART,   shortLabel: 'Notes' },
      { route: '/settings',             labelKey: 'NAV.SETTINGS',     icon: ICON_SETTINGS, shortLabel: 'Reglages' },
    ];
  });

  logout(): void { this.auth.logout().subscribe(); }
}
