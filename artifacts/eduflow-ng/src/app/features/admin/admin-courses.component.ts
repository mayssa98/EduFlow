import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../../core/services/auth.service';

interface CourseRow {
  id: number;
  titre: string;
  description: string;
  enseignantNom: string;
  statut: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  dateCreation: string;
  datePublication?: string;
  nbConsultations?: number;
}

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="courses-shell">
      <div class="page-header">
        <h1>📚 Gestion des cours (Admin)</h1>
        <div class="filters">
          <button class="filter-btn" [class.active]="statusFilter() === ''" (click)="setFilter('')">Tous</button>
          <button class="filter-btn" [class.active]="statusFilter() === 'PUBLISHED'" (click)="setFilter('PUBLISHED')">Publiés</button>
          <button class="filter-btn" [class.active]="statusFilter() === 'DRAFT'" (click)="setFilter('DRAFT')">Brouillons</button>
          <button class="filter-btn" [class.active]="statusFilter() === 'ARCHIVED'" (click)="setFilter('ARCHIVED')">Archivés</button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-val">{{ countByStatus('PUBLISHED') }}</span>
          <span class="stat-lbl">Publiés</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ countByStatus('DRAFT') }}</span>
          <span class="stat-lbl">Brouillons</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ countByStatus('ARCHIVED') }}</span>
          <span class="stat-lbl">Archivés</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ allCourses().length }}</span>
          <span class="stat-lbl">Total</span>
        </div>
      </div>

      <div class="section" *ngIf="!loading(); else spinner">
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Cours</th><th>Enseignant</th><th>Statut</th>
              <th>Créé le</th><th>Consultations</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let c of filtered()">
                <td>
                  <div class="course-cell">
                    <div class="course-icon">📖</div>
                    <div>
                      <div class="name">{{ c.titre }}</div>
                      <div class="muted small">{{ truncate(c.description) }}</div>
                    </div>
                  </div>
                </td>
                <td class="muted">{{ c.enseignantNom }}</td>
                <td>
                  <span class="status-badge" [class]="'status-' + c.statut.toLowerCase()">
                    {{ c.statut }}
                  </span>
                </td>
                <td class="muted small">{{ formatDate(c.dateCreation) }}</td>
                <td>
                  <span class="views-badge">👁 {{ c.nbConsultations ?? 0 }}</span>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="5" class="center muted py-4">Aucun cours trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .courses-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
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

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .stat-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 12px;
      padding: 18px 16px; display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .stat-val { font-size: 1.6rem; font-weight: 800; color: #c4b5fd; font-family: var(--font-display); }
    .stat-lbl { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }

    .section { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 12px 16px; text-align: left; font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
    td { padding: 14px 16px; border-bottom: 1px solid rgba(99,102,241,0.08); vertical-align: middle; }
    tr:last-child td { border: none; }

    .course-cell { display: flex; align-items: center; gap: 10px; }
    .course-icon { font-size: 1.5rem; }
    .name { font-weight: 600; color: var(--text); font-size: 0.9rem; }
    .muted { color: var(--muted); }
    .small { font-size: 0.8rem; }

    .status-badge { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .status-draft { background: rgba(99,102,241,0.15); color: #c4b5fd; }
    .status-published { background: rgba(134,239,172,0.15); color: #86efac; }
    .status-archived { background: rgba(234,179,8,0.15); color: #fde68a; }

    .views-badge { font-size: 0.85rem; color: var(--muted); }

    .center { text-align: center; }
    .py-4 { padding: 2rem 0; }

    .center-spinner { display: flex; justify-content: center; padding: 40px; }
    .big-spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(99,102,241,0.3);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AdminCoursesComponent implements OnInit {
  private http = inject(HttpClient);

  allCourses = signal<CourseRow[]>([]);
  loading = signal(true);
  statusFilter = signal('');

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading.set(true);
    this.http.get<CourseRow[]>(`${API_BASE}/courses`, { withCredentials: true }).subscribe({
      next: c => { this.allCourses.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setFilter(s: string): void { this.statusFilter.set(s); }

  filtered(): CourseRow[] {
    const f = this.statusFilter();
    if (!f) return this.allCourses();
    return this.allCourses().filter(c => c.statut === f);
  }

  countByStatus(s: string): number {
    return this.allCourses().filter(c => c.statut === s).length;
  }

  truncate(text: string): string {
    if (!text) return '';
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
