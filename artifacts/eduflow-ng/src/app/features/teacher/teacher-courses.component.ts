import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { API_BASE } from '../../core/services/auth.service';
import { Course, CourseService, SupportFile } from '../../core/services/course.service';
import { APP_ICONS } from '../../shared/icons/app-icons';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="courses-shell">
      <div class="header-row">
        <div>
          <p class="eyebrow">Course Studio</p>
          <h1>Gestion de mes cours</h1>
        </div>
        <button class="btn btn-primary" type="button" (click)="openCreateModal()">+ Nouveau cours</button>
      </div>

      <div class="table-wrap" *ngIf="!loading(); else spinner">
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Cree le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of courses()">
              <td><strong>{{ c.titre }}</strong></td>
              <td class="muted">{{ truncate(c.description) }}</td>
              <td>
                <span class="status-badge" [class]="'status-' + c.statut.toLowerCase()">
                  {{ c.statut }}
                </span>
              </td>
              <td class="muted small">{{ formatDate(c.dateCreation) }}</td>
              <td>
                <div class="action-row">
                  <button class="btn-icon" title="Modifier" type="button" (click)="openEditModal(c)">Editer</button>
                  <button class="btn-icon ok" title="Publier" type="button" *ngIf="c.statut === 'DRAFT'" (click)="publish(c.id)">Publier</button>
                  <button class="btn-icon warn" title="Archiver" type="button" *ngIf="c.statut === 'PUBLISHED'" (click)="archive(c.id)">Archiver</button>
                  <button class="btn-icon" title="Gerer les fichiers" type="button" (click)="openFilesModal(c)">Fichiers</button>
                  <button class="btn-icon danger" title="Supprimer" type="button" (click)="delete(c.id)">Supprimer</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="courses().length === 0">
              <td colspan="5" class="center muted py-4">Aucun cours trouve. Creez-en un nouveau.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>

      <div class="modal-overlay" *ngIf="showModal()">
        <div class="modal editor-modal">
          <h3>{{ editingCourse() ? 'Modifier le cours' : 'Creer un nouveau cours' }}</h3>
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

      <div class="modal-overlay" *ngIf="showFilesModal()">
        <div class="modal files-modal">
          <div class="files-head">
            <div>
              <p class="eyebrow">Support manager</p>
              <h3>{{ selectedCourse()?.titre }}</h3>
              <p class="muted files-subcopy">
                Ajoutez des PDF ou MP4, previsualisez-les et verifiez exactement ce que l etudiant verra apres publication.
              </p>
            </div>
            <button class="btn-cancel" type="button" (click)="closeFilesModal()">Fermer</button>
          </div>

          <div class="upload-shell">
            <div class="upload-copy">
              <strong>Bibliotheque du cours</strong>
              <p class="muted">Formats acceptes: PDF et MP4. Les fichiers publies sont consultables par les etudiants sur la page des cours.</p>
            </div>

            <div class="upload-actions">
              <input
                type="file"
                #fileInput
                (change)="onFileSelected($event)"
                accept="application/pdf,video/mp4"
                style="display:none"
              />
              <button class="btn btn-outline" type="button" (click)="fileInput.click()">+ Ajouter un support</button>
              <span class="uploading-text" *ngIf="uploading()">Envoi en cours...</span>
            </div>
          </div>

          <ng-container *ngIf="!loadingFiles(); else filesLoading">
            <div class="file-studio" *ngIf="files().length > 0; else emptyFiles">
              <aside class="file-list">
                <button
                  class="file-card"
                  type="button"
                  *ngFor="let f of files()"
                  [class.active]="selectedFile()?.id === f.id"
                  (click)="selectFile(f)"
                >
                  <span class="file-icon" [innerHTML]="resolveFileIcon(f)"></span>
                  <div class="file-meta">
                    <strong>{{ f.titre }}</strong>
                    <p>{{ f.typeFichier }} / {{ formatBytes(f.tailleOctets) }}</p>
                    <span>{{ fileExperienceLabel(f) }}</span>
                  </div>
                </button>
              </aside>

              <section class="preview-pane" *ngIf="selectedFile() as active">
                <div class="preview-pane-head">
                  <div>
                    <p class="eyebrow">{{ active.typeFichier === 'PDF' ? 'PDF viewer' : 'Video viewer' }}</p>
                    <h4>{{ active.titre }}</h4>
                    <p class="muted preview-copy">
                      {{ active.typeFichier === 'PDF'
                        ? 'Visionnage integre du document pour verifier le rendu avant diffusion.'
                        : 'Lecture integree du support video avec controles natifs.' }}
                    </p>
                  </div>

                  <div class="preview-tools">
                    <a
                      *ngIf="selectedFileUrl() as fileUrl"
                      class="btn btn-primary"
                      [href]="fileUrl"
                      target="_blank"
                      rel="noopener"
                    >
                      Ouvrir
                    </a>
                    <button
                      class="btn btn-outline danger-outline"
                      type="button"
                      (click)="deleteFile(selectedCourse()!.id, active.id)"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div class="preview-stage" [class.video-stage]="active.typeFichier === 'MP4'">
                  <iframe
                    *ngIf="active.typeFichier === 'PDF'"
                    class="preview-frame"
                    [src]="selectedPdfUrl()"
                    [title]="active.titre"
                  ></iframe>

                  <video
                    *ngIf="active.typeFichier === 'MP4'"
                    class="preview-video"
                    [src]="selectedFileUrl() || ''"
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    playsinline
                  ></video>
                </div>

                <div class="preview-footer">
                  <div class="footer-metric">
                    <small>Taille</small>
                    <strong>{{ formatBytes(active.tailleOctets) }}</strong>
                  </div>
                  <div class="footer-metric">
                    <small>Ajoute le</small>
                    <strong>{{ formatDate(active.dateUpload) }}</strong>
                  </div>
                  <div class="footer-note">
                    <span [innerHTML]="icons.info"></span>
                    Le rendu ci-dessus correspond au mode de consultation integre disponible cote etudiant.
                  </div>
                </div>
              </section>
            </div>
          </ng-container>

          <ng-template #emptyFiles>
            <div class="empty-state">
              <span class="empty-icon" [innerHTML]="icons.folderOpen"></span>
              <div>
                <strong>Aucun support pour le moment</strong>
                <p class="muted">Deposez un PDF ou une video MP4 pour activer la visionneuse professionnelle.</p>
              </div>
            </div>
          </ng-template>

          <ng-template #filesLoading>
            <div class="loading-state">
              <div class="big-spinner"></div>
              <p class="muted">Chargement des supports...</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --card: #1a1a2e;
      --border: rgba(99,102,241,0.2);
      --text: #e2e8f0;
      --muted: #94a3b8;
    }

    .courses-shell {
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #a5b4fc;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .header-row h1,
    .files-head h3,
    .preview-pane h4,
    .editor-modal h3 {
      margin: 0;
      color: var(--text);
    }

    .table-wrap {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow-x: auto;
      box-shadow: 0 20px 40px rgba(15,23,42,0.16);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(99,102,241,0.08);
      vertical-align: middle;
    }

    tr:last-child td {
      border: none;
    }

    .status-badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .status-draft {
      background: rgba(99,102,241,0.15);
      color: #c4b5fd;
    }

    .status-published {
      background: rgba(134,239,172,0.15);
      color: #86efac;
    }

    .status-archived {
      background: rgba(234,179,8,0.15);
      color: #fde68a;
    }

    .action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .btn,
    .btn-icon,
    .btn-cancel {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      font-weight: 700;
    }

    .btn-icon {
      background: none;
      border: 1px solid var(--border);
      padding: 6px 10px;
      color: var(--text);
      font-size: 0.8rem;
    }

    .btn-icon.ok:hover {
      border-color: #86efac;
      background: rgba(134,239,172,0.1);
    }

    .btn-icon.warn:hover {
      border-color: #fde68a;
      background: rgba(234,179,8,0.1);
    }

    .btn-icon.danger:hover {
      border-color: #fca5a5;
      background: rgba(239,68,68,0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 10px 16px;
      text-decoration: none;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-outline {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 16px;
    }

    .danger-outline {
      border-color: rgba(239,68,68,0.26);
      color: #fda4af;
    }

    .danger-outline:hover {
      background: rgba(239,68,68,0.12);
    }

    .btn-cancel {
      background: none;
      border: 1px solid var(--border);
      color: var(--muted);
      padding: 10px 16px;
    }

    .center {
      text-align: center;
    }

    .py-4 {
      padding-top: 2rem;
      padding-bottom: 2rem;
    }

    .muted {
      color: var(--muted);
    }

    .small {
      font-size: 0.85rem;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.68);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal {
      background: #1e1e35;
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      width: 90%;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 28px 60px rgba(15,23,42,0.28);
    }

    .editor-modal {
      max-width: 420px;
    }

    .files-modal {
      max-width: 1240px;
      max-height: 88vh;
      overflow: hidden;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-control {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      padding: 10px;
      border-radius: 8px;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(255,255,255,0.08);
    }

    .files-head,
    .upload-shell,
    .preview-pane-head,
    .preview-tools,
    .preview-footer {
      display: flex;
      justify-content: space-between;
      gap: 14px;
    }

    .files-head {
      align-items: flex-start;
    }

    .files-subcopy,
    .preview-copy {
      max-width: 68ch;
      line-height: 1.6;
      margin: 0;
    }

    .upload-shell {
      align-items: center;
      padding: 16px 18px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
    }

    .upload-copy strong {
      display: block;
      margin-bottom: 4px;
      color: var(--text);
    }

    .upload-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: flex-end;
    }

    .uploading-text {
      color: #fde68a;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .file-studio {
      display: grid;
      grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
      gap: 18px;
      min-height: 0;
      flex: 1;
      overflow: hidden;
    }

    .file-list,
    .preview-pane {
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      overflow: auto;
    }

    .file-card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 12px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,13,33,0.36);
      color: var(--text);
      text-align: left;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .file-card:hover,
    .file-card.active {
      transform: translateY(-1px);
      border-color: rgba(99,102,241,0.26);
      background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(15,23,42,0.76));
    }

    .file-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 16px;
      color: #c7d2fe;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
      flex-shrink: 0;
    }

    .file-meta {
      min-width: 0;
    }

    .file-meta strong {
      display: block;
      margin-bottom: 4px;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta p,
    .file-meta span {
      margin: 0;
      color: var(--muted);
      line-height: 1.5;
    }

    .file-meta span {
      display: block;
      font-size: 0.78rem;
    }

    .preview-pane {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 18px;
      overflow: auto;
    }

    .preview-pane-head {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .preview-tools {
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: flex-end;
    }

    .preview-stage {
      display: flex;
      min-height: 480px;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03), rgba(9,13,33,0.8)),
        #0f172a;
    }

    .preview-stage.video-stage {
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .preview-frame,
    .preview-video {
      width: 100%;
      height: 100%;
      border: 0;
      background: #0f172a;
      display: block;
    }

    .preview-video {
      border-radius: 18px;
      object-fit: contain;
    }

    .footer-metric {
      min-width: 120px;
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
    }

    .footer-metric small {
      display: block;
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }

    .footer-metric strong,
    .footer-note {
      color: var(--text);
    }

    .footer-note {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 260px;
      color: var(--muted);
    }

    .empty-state,
    .loading-state {
      display: grid;
      place-items: center;
      gap: 12px;
      min-height: 320px;
      text-align: center;
      border-radius: 18px;
      border: 1px dashed rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      padding: 24px;
    }

    .empty-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 20px;
      color: #c7d2fe;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
    }

    .center-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .big-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(99,102,241,0.3);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 980px) {
      .file-studio {
        grid-template-columns: 1fr;
      }

      .file-list {
        max-height: 260px;
      }
    }

    @media (max-width: 760px) {
      .header-row,
      .files-head,
      .upload-shell,
      .preview-pane-head,
      .preview-tools,
      .preview-footer,
      .modal-actions {
        flex-direction: column;
        align-items: flex-start;
      }

      .btn,
      .btn-cancel {
        width: 100%;
      }

      .files-modal,
      .editor-modal {
        width: 100%;
        padding: 20px;
      }

      .preview-stage {
        min-height: 320px;
      }
    }
  `],
})
export class TeacherCoursesComponent implements OnInit {
  private readonly courseSvc = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  readonly icons = APP_ICONS;

  readonly courses = signal<Course[]>([]);
  readonly loading = signal(true);

  readonly showModal = signal(false);
  readonly editingCourse = signal<Course | null>(null);

  readonly showFilesModal = signal(false);
  readonly loadingFiles = signal(false);
  readonly selectedCourse = signal<Course | null>(null);
  readonly files = signal<SupportFile[]>([]);
  readonly selectedFile = signal<SupportFile | null>(null);
  readonly selectedPdfUrl = signal<SafeResourceUrl | null>(null);
  readonly uploading = signal(false);

  readonly selectedFileUrl = computed(() => {
    const course = this.selectedCourse();
    const file = this.selectedFile();
    return course && file ? `${API_BASE}/courses/${course.id}/files/${file.id}` : null;
  });

  readonly courseForm = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.courseSvc.list().subscribe({
      next: res => {
        this.courses.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateModal(): void {
    this.editingCourse.set(null);
    this.courseForm.reset();
    this.showModal.set(true);
  }

  openEditModal(course: Course): void {
    this.editingCourse.set(course);
    this.courseForm.patchValue({ titre: course.titre, description: course.description });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCourse(): void {
    if (this.courseForm.invalid) return;
    const value = this.courseForm.getRawValue();
    const current = this.editingCourse();
    const request$ = current
      ? this.courseSvc.update(current.id, value)
      : this.courseSvc.create(value);

    request$.subscribe(() => {
      this.closeModal();
      this.loadAll();
    });
  }

  delete(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer ce cours ?')) return;
    this.courseSvc.delete(id).subscribe(() => this.loadAll());
  }

  publish(id: number): void {
    this.courseSvc.publish(id).subscribe(() => this.loadAll());
  }

  archive(id: number): void {
    this.courseSvc.archive(id).subscribe(() => this.loadAll());
  }

  openFilesModal(course: Course): void {
    this.selectedCourse.set(course);
    this.showFilesModal.set(true);
    this.loadFiles(course.id);
  }

  closeFilesModal(): void {
    this.showFilesModal.set(false);
    this.loadingFiles.set(false);
    this.selectedCourse.set(null);
    this.files.set([]);
    this.selectedFile.set(null);
    this.selectedPdfUrl.set(null);
  }

  loadFiles(courseId: number): void {
    const selectedId = this.selectedFile()?.id ?? null;
    this.loadingFiles.set(true);

    this.courseSvc.listFiles(courseId).subscribe({
      next: res => {
        this.files.set(res);
        const nextFile = res.find(file => file.id === selectedId) ?? res[0] ?? null;
        this.selectFile(nextFile);
        this.loadingFiles.set(false);
      },
      error: () => {
        this.files.set([]);
        this.selectedFile.set(null);
        this.selectedPdfUrl.set(null);
        this.loadingFiles.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const courseId = this.selectedCourse()?.id;
    if (!file || !courseId) return;

    this.uploading.set(true);
    this.courseSvc.uploadFile(courseId, file).subscribe({
      next: () => {
        this.uploading.set(false);
        input.value = '';
        this.loadFiles(courseId);
      },
      error: () => {
        this.uploading.set(false);
        input.value = '';
      },
    });
  }

  deleteFile(courseId: number, fileId: number): void {
    this.courseSvc.deleteFile(courseId, fileId).subscribe(() => this.loadFiles(courseId));
  }

  getFileUrl(courseId: number, fileId: number): string {
    return `${API_BASE}/courses/${courseId}/files/${fileId}`;
  }

  selectFile(file: SupportFile | null): void {
    this.selectedFile.set(file);

    if (!file || file.typeFichier !== 'PDF') {
      this.selectedPdfUrl.set(null);
      return;
    }

    const course = this.selectedCourse();
    if (!course) {
      this.selectedPdfUrl.set(null);
      return;
    }

    const url = `${this.getFileUrl(course.id, file.id)}#toolbar=1&navpanes=0&view=FitH`;
    this.selectedPdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  resolveFileIcon(file: SupportFile): string {
    return file.typeFichier === 'PDF' ? this.icons.document : this.icons.playCircle;
  }

  fileExperienceLabel(file: SupportFile): string {
    return file.typeFichier === 'PDF'
      ? 'Lecture integree et verification rapide du support.'
      : 'Lecture integree avec controles video natifs.';
  }

  truncate(text?: string): string {
    if (!text) return '';
    return text.length > 50 ? `${text.substring(0, 50)}...` : text;
  }

  formatDate(value?: string): string {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('fr-FR');
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
  }
}
