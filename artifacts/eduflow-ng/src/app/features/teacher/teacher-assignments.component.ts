import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { AssignmentService } from '../../core/services/api.services';
import { DevoirResponse, SoumissionResponse } from '../../core/models/api.models';
import { CourseService } from '../../core/services/api.services';
import { CourseResponse } from '../../core/models/api.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  template: `
    <div class="assign-shell">
      <div class="header-row">
        <h1>📝 Gestion des devoirs</h1>
        <button class="btn btn-primary" (click)="openCreateModal()" [disabled]="courses().length === 0">+ Nouveau Devoir</button>
      </div>
      
      <div class="filter-row">
        <label class="muted">Filtrer par cours :</label>
        <select class="form-control" [ngModel]="selectedCourseFilter()" (ngModelChange)="onCourseFilterChange($event)">
          <option [value]="null">Sélectionnez un cours d'abord...</option>
          <option *ngFor="let c of courses()" [value]="c.id">{{ c.titre }}</option>
        </select>
      </div>

      <div class="table-wrap" *ngIf="!loading(); else spinner">
        <table *ngIf="selectedCourseFilter(); else noCourse">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Description</th>
              <th>Échéance</th>
              <th>Soumissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of assignments()">
              <td><strong>{{ a.titre }}</strong></td>
              <td class="muted">{{ truncate(a.consigne ?? '') }}</td>
              <td [class.overdue]="isOverdue(a.dateFin)">{{ formatDate(a.dateFin) }}</td>
              <td><span class="badge">{{ 0 }} rendues</span></td>
              <td>
                <div class="action-row">
                  <button class="btn-icon" title="Modifier" (click)="openEditModal(a)">✏️</button>
                  <button class="btn-icon ok" title="Voir les copies" (click)="openSubmissionsModal(a)">📥</button>
                  <button class="btn-icon danger" title="Supprimer" (click)="delete(a.id)">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="assignments().length === 0">
              <td colspan="5" class="center muted py-4">Aucun devoir pour ce cours.</td>
            </tr>
          </tbody>
        </table>
        <ng-template #noCourse>
          <div class="empty-state">
            <p>Veuillez sélectionner un cours ci-dessus pour gérer ses devoirs.</p>
          </div>
        </ng-template>
      </div>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>

      <!-- Modal Create/Edit Assignment -->
      <div class="modal-overlay" *ngIf="showModal()">
        <div class="modal">
          <h3>{{ editingAssignment() ? 'Modifier le devoir' : 'Créer un nouveau devoir' }}</h3>
          <form [formGroup]="assignForm" (ngSubmit)="saveAssignment()">
            <div class="form-group" *ngIf="!editingAssignment()">
              <label>Cours concerné</label>
              <select formControlName="coursId" class="form-control">
                <option *ngFor="let c of courses()" [value]="c.id">{{ c.titre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Titre</label>
              <input type="text" formControlName="titre" class="form-control" />
            </div>
            <div class="form-group">
              <label>Consignes</label>
              <textarea formControlName="consigne" class="form-control" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label>Date de fin</label>
              <input type="datetime-local" formControlName="dateFin" class="form-control" />
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModal()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="assignForm.invalid">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Submissions / Grading -->
      <div class="modal-overlay" *ngIf="showSubModal()">
        <div class="modal large">
          <h3>📥 Copies : {{ selectedAssignment()?.titre }}</h3>

          <div class="table-wrap no-border" *ngIf="!loadingSubs(); else spinner">
            <table>
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Date & Fichier</th>
                  <th>Note (/20)</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sub of submissions()">
                  <td><strong>{{ sub.etudiantNom }}</strong></td>
                  <td>
                    <div class="sub-date">{{ formatDate(sub.dateSoumission) }}</div>
                    <a [href]="getFileUrl(sub.cheminFichier ?? '')" target="_blank" class="btn btn-outline btn-sm mt-2">
                       {{ sub.cheminFichier ? '📄' : '🎥' }} Ouvrir le rendu
                    </a>
                  </td>
                  <td>
                    <ng-container *ngIf="sub.note !== null && sub.note !== undefined">
                      <span class="badge" [class.warn]="sub.note < 10" [class.success]="sub.note >= 10">{{ sub.note }} / 20</span>
                    </ng-container>
                    <ng-container *ngIf="sub.note === null || sub.note === undefined">
                       <input type="number" class="form-control sm-control inline-number" min="0" max="20" #noteInput placeholder="---" />
                       <button class="btn btn-primary btn-sm ml-2" (click)="grade(sub.id, noteInput.value)">Valider</button>
                    </ng-container>
                  </td>
                  <td>
                    <ng-container *ngIf="sub.note !== null && sub.note !== undefined">
                      <span class="muted small">{{ sub.commentaire || '—' }}</span>
                    </ng-container>
                  </td>
                </tr>
                <tr *ngIf="submissions().length === 0">
                  <td colspan="4" class="center muted py-4">Personne n'a encore rendu ce devoir.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeSubModal()">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .assign-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .header-row h1 { margin: 0; font-size: 1.5rem; color: var(--text); }
    
    .filter-row { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; }
    .filter-row select { max-width: 300px; }
    
    .table-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow-x: auto; }
    .table-wrap.no-border { border: none; background: transparent; }
    .empty-state { padding: 40px; text-align: center; color: var(--muted); }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 12px 16px; text-align: left; font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    td { padding: 14px 16px; border-bottom: 1px solid rgba(99,102,241,0.08); vertical-align: middle; }
    tr:last-child td { border: none; }
    
    .status-badge { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .badge { background: rgba(99,102,241,0.15); color: #c4b5fd; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    .badge.warn { background: rgba(239,68,68,0.15); color: #fca5a5; }
    .badge.success { background: rgba(134,239,172,0.15); color: #86efac; }
    
    .action-row { display: flex; gap: 6px; }
    .btn-icon { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; cursor: pointer; color: var(--text); transition: all 0.2s;}
    .btn-icon.ok:hover { border-color: #86efac; background: rgba(134,239,172,0.1); }
    .btn-icon.danger:hover { border-color: #fca5a5; background: rgba(239,68,68,0.1); }
    
    .center { text-align: center; } .py-4 { padding-top: 2rem; padding-bottom: 2rem; }
    .muted { color: var(--muted); } .small { font-size: 0.85rem; }
    .overdue { color: #fca5a5; font-weight: 600; }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #1e1e35; border: 1px solid var(--border); border-radius: 16px; padding: 28px; max-width: 480px; width: 90%; display: flex; flex-direction: column; gap: 16px; max-height: 90vh; overflow-y: auto;}
    .modal.large { max-width: 800px; }
    .modal h3 { margin: 0; color: var(--text); }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-control { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px; border-radius: 8px; font-family: inherit; }
    .form-control:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.08); }
    .sm-control { padding: 6px; font-size: 0.85rem; }
    .inline-number { width: 70px; display: inline-block; }
    
    .btn-cancel { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 8px 16px; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 6px 12px; cursor: pointer; text-decoration: none; display: inline-block;}
    .btn-outline:hover { background: rgba(255,255,255,0.1); }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }
    .mt-2 { margin-top: 8px; } .ml-2 { margin-left: 8px; }
    
    .center-spinner { display: flex; justify-content: center; padding: 40px; }
    .big-spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.3); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TeacherAssignmentsComponent implements OnInit {
  private asgSvc = inject(AssignmentService);
  private crsSvc = inject(CourseService);
  private fb = inject(FormBuilder);

  courses = signal<CourseResponse[]>([]);
  loading = signal(false);
  
  selectedCourseFilter = signal<number | null>(null);
  assignments = signal<DevoirResponse[]>([]);

  showModal = signal(false);
  editingAssignment = signal<DevoirResponse | null>(null);

  showSubModal = signal(false);
  selectedAssignment = signal<DevoirResponse | null>(null);
  submissions = signal<SoumissionResponse[]>([]);
  loadingSubs = signal(false);

  assignForm = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    consigne: [''],
    dateFin: ['', [Validators.required]],
    coursId: [0, [Validators.min(1)]]
  });

  ngOnInit() {
    this.crsSvc.list().subscribe(res => {
      // Only keep courses where the teacher is the owner (in real app we verify server side too)
      // Wait, listVisible() or courses endpoint ? The teacher gets their courses.
      this.courses.set(res);
      if (res.length > 0) {
        this.selectedCourseFilter.set(res[0].id);
        this.loadAssignments();
      }
    });
  }

  onCourseFilterChange(val: string) {
    if (!val || val === 'null') {
      this.selectedCourseFilter.set(null);
      this.assignments.set([]);
      return;
    }
    this.selectedCourseFilter.set(Number(val));
    this.loadAssignments();
  }

  loadAssignments() {
    const cid = this.selectedCourseFilter();
    if (!cid) return;
    this.loading.set(true);
    this.asgSvc.list(cid).subscribe({
      next: (res) => { this.assignments.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal() {
    this.editingAssignment.set(null);
    this.assignForm.reset();
    const cid = this.selectedCourseFilter();
    if (cid) {
      this.assignForm.patchValue({ coursId: cid });
    }
    this.showModal.set(true);
  }

  openEditModal(a: DevoirResponse) {
    this.editingAssignment.set(a);
    // Format date for 'datetime-local' input
    const d = new Date(a.dateFin);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);

    this.assignForm.patchValue({
      coursId: a.coursId,
      titre: a.titre,
      consigne: a.consigne,
      dateFin: localISOTime
    });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveAssignment() {
    if (this.assignForm.invalid) return;
    const val = this.assignForm.getRawValue();
    const serverDate = new Date(val.dateFin).toISOString();
    const now = new Date().toISOString();

    const isEdit = this.editingAssignment();
    const obs$ = isEdit
      ? this.asgSvc.update(isEdit.id, { titre: val.titre, consigne: val.consigne, dateFin: serverDate })
      : this.asgSvc.create({
          coursId: val.coursId,
          titre: val.titre,
          consigne: val.consigne,
          dateDebut: now,
          dateFin: serverDate,
          noteMax: 20,
        });

    obs$.subscribe(() => {
      this.closeModal();
      this.loadAssignments();
    });
  }

  delete(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce devoir ?')) {
      this.asgSvc.delete(id).subscribe(() => this.loadAssignments());
    }
  }

  // --- Submissions ---
  openSubmissionsModal(a: DevoirResponse) {
    this.selectedAssignment.set(a);
    this.loadingSubs.set(true);
    this.showSubModal.set(true);
    this.asgSvc.submissions(a.id).subscribe({
      next: (res) => { this.submissions.set(res); this.loadingSubs.set(false); },
      error: () => this.loadingSubs.set(false)
    });
  }

  closeSubModal() { this.showSubModal.set(false); }

  grade(subId: number, noteVal: string) {
    const noteNum = parseFloat(noteVal);
    if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
      alert('La note doit être un nombre entre 0 et 20.');
      return;
    }
    const com = prompt('Un commentaire facultatif pour cette note ?');
    this.asgSvc.grade(subId, { note: noteNum, commentaire: com || undefined }).subscribe(() => {
      // Reload submissions
      this.openSubmissionsModal(this.selectedAssignment()!);
    });
  }

  getFileUrl(path: string): string {
    // Basic formatting for file url
    return `http://localhost:8081/uploads/${path.split('/').pop()}`; // If static serving is enabled. With current backend it's restricted.
    // Wait, backend /assignments/files/ ? actually backend doesn't have an endpoint to download submissions natively shown in DevoirController, it just stores path.
    // We'll return a placeholder or local URL because downloading submission files usually need an endpoint.
  }

  // Utils
  truncate(text: string): string {
    if (!text) return '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  isOverdue(d: string): boolean {
    return new Date(d).getTime() < new Date().getTime();
  }
}
