import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService, UserSummary } from '../../core/services/user.service';
import { ICONS } from '../../shared/icons';

type RoleFilter = '' | 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'ADMIN.USERS_TITLE' | translate }}</h1>
        <p class="muted">{{ 'ADMIN.USERS_COUNT' | translate: { count: users().length } }}</p>
      </div>
      <div class="filter-bar">
        <button *ngFor="let f of filters"
                class="filter-pill" [class.active]="roleFilter() === f.value"
                (click)="setRole(f.value)">
          {{ f.label | translate }}
        </button>
      </div>
    </div>

    <div class="loading-center" *ngIf="loading()">
      <div class="spinner spinner-lg"></div>
    </div>

    <section class="card table-card fade-up" *ngIf="!loading()">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ 'ADMIN.TH_USER' | translate }}</th>
              <th>{{ 'ADMIN.TH_ROLE' | translate }}</th>
              <th>{{ 'ADMIN.TH_STATUS' | translate }}</th>
              <th>{{ 'ADMIN.TH_CREATED' | translate }}</th>
              <th>{{ 'ADMIN.TH_LAST_LOGIN' | translate }}</th>
              <th class="right">{{ 'ADMIN.TH_ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users()" [class.dimmed]="u.statutCompte === 'BLOCKED'">
              <td>
                <div class="user-cell">
                  <div class="avatar avatar-sm">{{ initials(u) }}</div>
                  <div>
                    <div class="name">{{ u.prenom }} {{ u.nom }}</div>
                    <div class="muted small">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="roleBadgeClass(u.role)">{{ ('ROLES.' + roleKey(u.role)) | translate }}</span>
              </td>
              <td>
                <span class="badge" [ngClass]="statusBadgeClass(u.statutCompte)">
                  {{ ('STATUS.' + u.statutCompte) | translate }}
                </span>
              </td>
              <td class="muted small">{{ formatDate(u.dateCreation) }}</td>
              <td class="muted small">{{ formatDate(u.derniereConnexion) }}</td>
              <td class="right">
                <div class="action-row">
                  <button *ngIf="u.statutCompte !== 'BLOCKED'" class="btn-icon-only warn"
                          [title]="'ADMIN.BLOCK_USER' | translate" (click)="block(u.id)">
                    <span [innerHTML]="iconLock"></span>
                  </button>
                  <button *ngIf="u.statutCompte === 'BLOCKED'" class="btn-icon-only success"
                          [title]="'ADMIN.UNBLOCK_USER' | translate" (click)="unblock(u.id)">
                    <span [innerHTML]="iconUnlock"></span>
                  </button>
                  <button class="btn-icon-only danger"
                          [title]="'ADMIN.DELETE_USER' | translate" (click)="confirmDelete(u)">
                    <span [innerHTML]="iconTrash"></span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!users().length">
              <td colspan="6" class="center muted py-4">{{ 'COMMON.EMPTY' | translate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Delete confirmation modal -->
    <div class="modal-overlay" *ngIf="deleteTarget()" (click)="deleteTarget.set(null)">
      <div class="modal glass" (click)="$event.stopPropagation()">
        <h3>{{ 'ADMIN.CONFIRM_DELETE_TITLE' | translate }}</h3>
        <p>
          {{ 'ADMIN.CONFIRM_DELETE_BODY' | translate }}
          <strong>{{ deleteTarget()?.prenom }} {{ deleteTarget()?.nom }}</strong> ?
        </p>
        <p class="muted small">{{ 'ADMIN.CONFIRM_DELETE_HINT' | translate }}</p>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" (click)="deleteTarget.set(null)">
            {{ 'BUTTONS.CANCEL' | translate }}
          </button>
          <button class="btn btn-danger btn-sm" (click)="doDelete()">
            {{ 'BUTTONS.DELETE' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-card { padding: 0; overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .data-table thead th.right, .data-table tbody td.right { text-align: end; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .name { font-family: var(--font-display); font-weight: 600; font-size: 0.92rem; }
    .small { font-size: 0.8rem; }
    .muted { color: var(--color-muted-foreground); }
    .center { text-align: center; }
    .py-4 { padding: 2rem 0; }

    tr.dimmed td { opacity: 0.55; }

    .action-row { display: inline-flex; gap: 6px; justify-content: flex-end; }

    /* Role badges */
    .badge-role-admin      { background: rgba(239,68,68,0.12);  color: var(--red-500);    border-color: rgba(239,68,68,0.3); }
    .badge-role-teacher    { background: rgba(251,191,36,0.12); color: var(--amber-400);  border-color: rgba(251,191,36,0.3); }
    .badge-role-student    { background: rgba(99,102,241,0.12); color: var(--indigo-400); border-color: rgba(99,102,241,0.3); }

    .btn.btn-danger { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.35); color: var(--red-500); }
    .btn.btn-danger:hover { background: rgba(239,68,68,0.18); }
  `],
})
export class AdminUsersComponent implements OnInit {
  private userSvc = inject(UserService);
  private translate = inject(TranslateService);

  readonly iconTrash = ICONS.trash;
  readonly iconLock = ICONS.lock;
  readonly iconUnlock = ICONS.unlock;

  users = signal<UserSummary[]>([]);
  loading = signal(true);
  roleFilter = signal<RoleFilter>('');
  deleteTarget = signal<UserSummary | null>(null);

  readonly filters: { value: RoleFilter; label: string }[] = [
    { value: '',           label: 'ADMIN.FILTER_ALL' },
    { value: 'ADMIN',      label: 'ADMIN.FILTER_ADMINS' },
    { value: 'ENSEIGNANT', label: 'ADMIN.FILTER_TEACHERS' },
    { value: 'ETUDIANT',   label: 'ADMIN.FILTER_STUDENTS' },
  ];

  ngOnInit(): void { this.loadAll(); }

  setRole(r: RoleFilter): void { this.roleFilter.set(r); this.loadAll(); }

  roleKey(role: string): 'ADMIN' | 'TEACHER' | 'STUDENT' {
    return role === 'ADMIN' ? 'ADMIN' : role === 'ENSEIGNANT' ? 'TEACHER' : 'STUDENT';
  }

  roleBadgeClass(role: string): string {
    if (role === 'ADMIN') return 'badge-role-admin';
    if (role === 'ENSEIGNANT') return 'badge-role-teacher';
    return 'badge-role-student';
  }

  statusBadgeClass(s: string): string {
    if (s === 'ACTIVE') return 'badge-success';
    if (s === 'BLOCKED') return 'badge-danger';
    return 'badge-warn';
  }

  initials(u: UserSummary): string {
    return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  private loadAll(): void {
    this.loading.set(true);
    this.userSvc.listUsers(this.roleFilter() || undefined).subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => { this.users.set([]); this.loading.set(false); },
    });
  }

  block(id: number): void {
    this.userSvc.blockUser(id).subscribe({ next: () => this.loadAll() });
  }

  unblock(id: number): void {
    this.userSvc.unblockUser(id).subscribe({ next: () => this.loadAll() });
  }

  confirmDelete(u: UserSummary): void { this.deleteTarget.set(u); }

  doDelete(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleteTarget.set(null);
    this.userSvc.deleteUser(t.id).subscribe({ next: () => this.loadAll() });
  }
}
