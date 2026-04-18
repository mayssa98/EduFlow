import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, UserSummary } from '../../core/services/user.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="users-shell">
      <div class="page-header">
        <h1>👥 Gestion des utilisateurs</h1>
        <div class="filters">
          <button class="filter-btn" [class.active]="roleFilter() === ''" (click)="setRole('')">Tous</button>
          <button class="filter-btn" [class.active]="roleFilter() === 'ADMIN'" (click)="setRole('ADMIN')">Admins</button>
          <button class="filter-btn" [class.active]="roleFilter() === 'ENSEIGNANT'" (click)="setRole('ENSEIGNANT')">Enseignants</button>
          <button class="filter-btn" [class.active]="roleFilter() === 'ETUDIANT'" (click)="setRole('ETUDIANT')">Étudiants</button>
        </div>
      </div>

      <!-- Approbations en attente -->
      <div class="section" *ngIf="pendingTeachers().length > 0">
        <h2 class="section-title warn">⚠️ Enseignants en attente d'approbation ({{ pendingTeachers().length }})</h2>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Nom</th><th>Email</th><th>Date inscription</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let u of pendingTeachers()">
                <td><span class="name">{{ u.prenom }} {{ u.nom }}</span></td>
                <td class="muted">{{ u.email }}</td>
                <td class="muted">{{ formatDate(u.dateCreation) }}</td>
                <td>
                  <div class="action-row">
                    <button class="btn-approve" (click)="decide(u.id, 'APPROVE')">✓ Approuver</button>
                    <button class="btn-reject"  (click)="decide(u.id, 'REJECT')">✗ Rejeter</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table principale -->
      <div class="section">
        <h2 class="section-title">Utilisateurs ({{ users().length }})</h2>
        <div class="table-wrap" *ngIf="!loading(); else spinner">
          <table>
            <thead><tr>
              <th>Utilisateur</th><th>Rôle</th><th>Statut</th>
              <th>Inscription</th><th>Dernière connexion</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let u of users()" [class.blocked-row]="u.statutCompte === 'BLOCKED'">
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ initials(u) }}</div>
                    <div>
                      <div class="name">{{ u.prenom }} {{ u.nom }}</div>
                      <div class="muted small">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="role-badge" [class]="'role-' + u.role.toLowerCase()">{{ u.role }}</span>
                </td>
                <td>
                  <span class="status-badge" [class]="'status-' + u.statutCompte.toLowerCase()">
                    {{ u.statutCompte }}
                  </span>
                </td>
                <td class="muted small">{{ formatDate(u.dateCreation) }}</td>
                <td class="muted small">{{ formatDate(u.derniereConnexion) }}</td>
                <td>
                  <div class="action-row">
                    <button *ngIf="u.statutCompte !== 'BLOCKED'" class="btn-icon warn"
                            title="Bloquer" (click)="block(u.id)">🔒</button>
                    <button *ngIf="u.statutCompte === 'BLOCKED'" class="btn-icon ok"
                            title="Débloquer" (click)="unblock(u.id)">🔓</button>
                    <button class="btn-icon danger" title="Supprimer" (click)="confirmDelete(u)">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #spinner>
          <div class="center-spinner"><div class="big-spinner"></div></div>
        </ng-template>
      </div>

      <!-- Modal confirmation suppression -->
      <div class="modal-overlay" *ngIf="deleteTarget()">
        <div class="modal">
          <h3>Confirmer la suppression</h3>
          <p>Êtes-vous sûr de vouloir supprimer <strong>{{ deleteTarget()?.prenom }} {{ deleteTarget()?.nom }}</strong> ?</p>
          <p class="muted small">Cette action est irréversible.</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="deleteTarget.set(null)">Annuler</button>
            <button class="btn-reject" (click)="doDelete()">Supprimer définitivement</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }

    .users-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }

    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { margin: 0; font-size: 1.5rem; color: var(--text); }

    .filters { display: flex; gap: 8px; }
    .filter-btn {
      background: rgba(99,102,241,0.1); border: 1px solid var(--border);
      color: var(--muted); border-radius: 20px; padding: 6px 14px;
      font-size: 13px; cursor: pointer; transition: all 0.2s;
    }
    .filter-btn.active { background: #6366f1; color: white; border-color: #6366f1; }
    .filter-btn:hover:not(.active) { border-color: #6366f1; color: var(--text); }

    .section { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .section-title { margin: 0; padding: 18px 24px; font-size: 1rem; color: var(--text); border-bottom: 1px solid var(--border); }
    .section-title.warn { color: #fde68a; }

    .table-wrap { overflow-x: auto; }

    table { width: 100%; border-collapse: collapse; }
    th { padding: 12px 16px; text-align: left; font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
    td { padding: 14px 16px; border-bottom: 1px solid rgba(99,102,241,0.08); vertical-align: middle; }
    tr:last-child td { border: none; }
    tr.blocked-row td { opacity: 0.55; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar-sm {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    }

    .name { font-weight: 600; color: var(--text); font-size: 0.9rem; }
    .muted { color: var(--muted); }
    .small { font-size: 0.8rem; }

    .role-badge, .status-badge {
      padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap;
    }
    .role-admin     { background: rgba(239,68,68,0.15);   color: #fca5a5; }
    .role-enseignant{ background: rgba(234,179,8,0.15);   color: #fde68a; }
    .role-etudiant  { background: rgba(99,102,241,0.15);  color: #c4b5fd; }
    .status-active  { background: rgba(134,239,172,0.15); color: #86efac; }
    .status-blocked { background: rgba(239,68,68,0.15);   color: #fca5a5; }
    .status-pending { background: rgba(234,179,8,0.15);   color: #fde68a; }
    .status-pending_approval { background: rgba(249,115,22,0.15); color: #fdba74; }

    .action-row { display: flex; gap: 6px; }

    .btn-icon {
      background: none; border: 1px solid var(--border); border-radius: 8px;
      padding: 6px 10px; cursor: pointer; font-size: 14px; transition: all 0.2s;
    }
    .btn-icon.warn:hover   { background: rgba(234,179,8,0.15); border-color: #fde68a; }
    .btn-icon.ok:hover     { background: rgba(134,239,172,0.15); border-color: #86efac; }
    .btn-icon.danger:hover { background: rgba(239,68,68,0.15); border-color: #fca5a5; }

    .btn-approve {
      background: rgba(134,239,172,0.15); border: 1px solid #86efac;
      color: #86efac; border-radius: 8px; padding: 6px 14px; font-size: 12px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-approve:hover { background: rgba(134,239,172,0.3); }

    .btn-reject {
      background: rgba(239,68,68,0.15); border: 1px solid #fca5a5;
      color: #fca5a5; border-radius: 8px; padding: 6px 14px; font-size: 12px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-reject:hover { background: rgba(239,68,68,0.3); }

    .center-spinner { display: flex; justify-content: center; padding: 40px; }
    .big-spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(99,102,241,0.3);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal {
      background: #1e1e35; border: 1px solid var(--border); border-radius: 16px;
      padding: 28px; max-width: 420px; width: 90%; display: flex;
      flex-direction: column; gap: 12px;
    }
    .modal h3 { margin: 0; color: var(--text); }
    .modal p  { margin: 0; color: var(--text); }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .btn-cancel {
      background: none; border: 1px solid var(--border); color: var(--muted);
      border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 13px;
    }
  `],
})
export class AdminUsersComponent implements OnInit {
  private userSvc = inject(UserService);

  users          = signal<UserSummary[]>([]);
  pendingTeachers = signal<UserSummary[]>([]);
  loading        = signal(true);
  roleFilter     = signal('');
  deleteTarget   = signal<UserSummary | null>(null);

  ngOnInit(): void { this.loadAll(); }

  private loadAll(): void {
    this.loading.set(true);
    this.userSvc.listUsers(this.roleFilter() || undefined).subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.userSvc.getPendingTeachers().subscribe({
      next: t => this.pendingTeachers.set(t),
    });
  }

  setRole(r: string): void { this.roleFilter.set(r); this.loadAll(); }

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

  decide(id: number, decision: 'APPROVE' | 'REJECT'): void {
    this.userSvc.approveTeacher(id, decision).subscribe({ next: () => this.loadAll() });
  }

  initials(u: UserSummary): string {
    return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
