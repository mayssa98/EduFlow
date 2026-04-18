import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../core/services/api.services';
import { CourseResponse, SupportResponse } from '../../core/models/api.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="courses-shell">
      <div class="header-row">
        <h1>📚 Gestion de mes cours</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Nouveau Cours</button>
      </div>

      <div class="table-wrap" *ngIf="!loading(); else spinner">
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of courses()">
              <td><strong>{{ c.titre }}</strong></td>
              <td class="muted">{{ truncate(c.description ?? '') }}</td>
              <td>
                <span class="status-badge" [class]="'status-' + c.statut.toLowerCase()">
                  {{ c.statut }}
                </span>
              </td>
              <td class="muted small">{{ formatDate(c.dateCreation) }}</td>
              <td>
                <div class="action-row">
                  <button class="btn-icon" title="Modifier" (click)="openEditModal(c)">✏️</button>
                  <button class="btn-icon ok" title="Publier" *ngIf="c.statut === 'DRAFT'" (click)="publish(c.id)">🚀</button>
                  <button class="btn-icon warn" title="Archiver" *ngIf="c.statut === 'PUBLISHED'" (click)="archive(c.id)">📦</button>
                  <button class="btn-icon" title="Gérer fichiers" (click)="openFilesModal(c)">📂</button>
                  <button class="btn-icon danger" title="Supprimer" (click)="delete(c.id)">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="courses().length === 0">
              <td colspan="5" class="center muted py-4">Aucun cours trouvé. Créez-en un nouveau !</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>

      <!-- Modal Create/Edit Course -->
      <div class="modal-overlay" *ngIf="showModal()">
        <div class="modal">
          <h3>{{ editingCourse() ? 'Modifier le cours' : 'Créer un nouveau cours' }}</h3>
          <form [formGroup]="courseForm" (ngSubmit)="saveCourse()">
            <div class="form-group">
              <label>Titre</label>
              <input type="text" formControlName="titre" class="form-control" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" class="form-control" rows="4"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModal()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="courseForm.invalid">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Manage Files -->
      <div class="modal-overlay" *ngIf="showFilesModal()">
        <div class="modal large">
          <h3>📂 Fichiers de : {{ selectedCourse()?.titre }}</h3>
          
          <div class="upload-section">
            <input type="file" #fileInput (change)="onFileSelected($event)" accept="application/pdf,video/mp4" style="display:none" />
            <button class="btn btn-outline" (click)="fileInput.click()">+ Ajouter un support (PDF/MP4) (max 25/250 MB)</button>
            <span class="uploading-text" *ngIf="uploading()">⏳ Envoi en cours...</span>
          </div>

          <table class="t-files" *ngIf="files().length > 0">
            <tbody>
              <tr *ngFor="let f of files()">
                <td>
                  <span class="icon">{{ f.typeFichier === 'PDF' ? '📄' : '🎥' }}</span>
                  {{ f.titre }}
                </td>
                <td class="muted small">{{ formatBytes(f.tailleOctets) }}</td>
                <td align="right">
                  <a [href]="getFileUrl(selectedCourse()!.id, f.id)" target="_blank" class="btn-icon">👁️</a>
                  <button class="btn-icon danger" (click)="deleteFile(selectedCourse()!.id, f.id)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="muted center" *ngIf="files().length === 0">Aucun fichier pour le moment.</p>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeFilesModal()">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .courses-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .header-row h1 { margin: 0; font-size: 1.5rem; color: var(--text); }
    
    .table-wrap { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 12px 16px; text-align: left; font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; border-bottom: 1px solid var(--border); }
    td { padding: 14px 16px; border-bottom: 1px solid rgba(99,102,241,0.08); vertical-align: middle; }
    tr:last-child td { border: none; }
    
    .t-files { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .t-files td { padding: 8px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); }
    .icon { margin-right: 8px; }

    .status-badge { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .status-draft { background: rgba(99,102,241,0.15); color: #c4b5fd; }
    .status-published { background: rgba(134,239,172,0.15); color: #86efac; }
    .status-archived { background: rgba(234,179,8,0.15); color: #fde68a; }

    .action-row { display: flex; gap: 6px; }
    .btn-icon { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; cursor: pointer; color: var(--text); }
    .btn-icon.ok:hover { border-color: #86efac; background: rgba(134,239,172,0.1); }
    .btn-icon.warn:hover { border-color: #fde68a; background: rgba(234,179,8,0.1); }
    .btn-icon.danger:hover { border-color: #fca5a5; background: rgba(239,68,68,0.1); }
    
    .center { text-align: center; } .py-4 { padding-top: 2rem; padding-bottom: 2rem; }
    .muted { color: var(--muted); } .small { font-size: 0.85rem; }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #1e1e35; border: 1px solid var(--border); border-radius: 16px; padding: 28px; max-width: 420px; width: 90%; display: flex; flex-direction: column; gap: 16px; }
    .modal.large { max-width: 600px; }
    .modal h3 { margin: 0; color: var(--text); }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-control { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px; border-radius: 8px; font-family: inherit; }
    .form-control:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.08); }
    
    .btn-cancel { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 8px 16px; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .upload-section { margin-top: 10px; display: flex; gap: 10px; align-items: center; }
    .uploading-text { color: #fde68a; font-size: 0.85rem; font-weight: bold; }
    
    .center-spinner { display: flex; justify-content: center; padding: 40px; }
    .big-spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.3); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TeacherCoursesComponent implements OnInit {
  private courseSvc = inject(CourseService);
  private fb = inject(FormBuilder);

  courses = signal<CourseResponse[]>([]);
  loading = signal(true);
  
  showModal = signal(false);
  editingCourse = signal<CourseResponse | null>(null);
  
  showFilesModal = signal(false);
  selectedCourse = signal<CourseResponse | null>(null);
  files = signal<SupportResponse[]>([]);
  uploading = signal(false);

  courseForm = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    description: ['']
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.courseSvc.list().subscribe({
      next: (res) => { this.courses.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal() {
    this.editingCourse.set(null);
    this.courseForm.reset();
    this.showModal.set(true);
  }

  openEditModal(c: CourseResponse) {
    this.editingCourse.set(c);
    this.courseForm.patchValue({ titre: c.titre, description: c.description });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveCourse() {
    if (this.courseForm.invalid) return;
    const val = this.courseForm.getRawValue();
    const isEdit = this.editingCourse();
    const obs$ = isEdit 
      ? this.courseSvc.update(isEdit.id, val)
      : this.courseSvc.create(val);
      
    obs$.subscribe(() => {
      this.closeModal();
      this.loadAll();
    });
  }

  delete(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
      this.courseSvc.delete(id).subscribe(() => this.loadAll());
    }
  }

  publish(id: number) {
    this.courseSvc.publish(id).subscribe(() => this.loadAll());
  }

  archive(id: number) {
    this.courseSvc.archive(id).subscribe(() => this.loadAll());
  }

  // --- Files Management ---
  openFilesModal(c: CourseResponse) {
    this.selectedCourse.set(c);
    this.loadFiles(c.id);
    this.showFilesModal.set(true);
  }

  closeFilesModal() { this.showFilesModal.set(false); }

  loadFiles(courseId: number) {
    this.courseSvc.files(courseId).subscribe(res => this.files.set(res));
  }

  onFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    if (el.files && el.files.length > 0) {
      const file = el.files[0];
      const cid = this.selectedCourse()?.id;
      if (cid) {
        this.uploading.set(true);
        this.courseSvc.uploadFile(cid, file).subscribe({
          next: () => {
            this.uploading.set(false);
            this.loadFiles(cid);
          },
          error: () => this.uploading.set(false)
        });
      }
    }
  }

  deleteFile(courseId: number, fileId: number) {
    this.courseSvc.deleteFile(courseId, fileId).subscribe(() => this.loadFiles(courseId));
  }

  getFileUrl(courseId: number, fileId: number): string {
    return `http://localhost:8081/api/courses/${courseId}/files/${fileId}`;
  }

  // Utils
  truncate(text: string): string {
    if (!text) return '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024, i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
  }
}
