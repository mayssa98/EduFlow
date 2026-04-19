import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CourseService, Course, SupportFile } from '../../core/services/course.service';
import { AssignmentService, Assignment } from '../../core/services/assignment.service';
import { API_BASE } from '../../core/services/auth.service';
import { StatusChipComponent, ChipTone } from '../../shared/components/status-chip/status-chip.component';
import { ICONS } from '../../shared/icons';

const PDF_MAX = 25 * 1024 * 1024;
const MP4_MAX = 250 * 1024 * 1024;

@Component({
  selector: 'app-teacher-course-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, StatusChipComponent],
  template: `
    <ng-container *ngIf="course() as c; else loadingOrMissing">
      <div class="page-head">
        <div>
          <a routerLink="/teacher/courses" class="back">
            <span [innerHTML]="iconBack"></span>
            {{ 'COURSES.BACK' | translate }}
          </a>
          <h1>{{ c.titre }}</h1>
          <p class="muted">{{ c.description || ('COMMON.NONE' | translate) }}</p>
        </div>
        <div class="head-actions">
          <app-status-chip [label]="('COURSES.STATUS_' + c.statut) | translate" [tone]="tone(c.statut)"></app-status-chip>
          <button class="btn btn-primary btn-sm" *ngIf="c.statut === 'DRAFT'" (click)="publish(c)" [disabled]="busy()">
            <span [innerHTML]="iconPublish"></span>
            {{ 'COURSES.PUBLISH' | translate }}
          </button>
          <button class="btn btn-outline btn-sm" *ngIf="c.statut === 'PUBLISHED'" (click)="archive(c)" [disabled]="busy()">
            <span [innerHTML]="iconArchive"></span>
            {{ 'COURSES.ARCHIVE' | translate }}
          </button>
        </div>
      </div>

      <div class="grid-2">
        <!-- MATERIALS -->
        <section class="card">
          <header class="card-header">
            <h2>{{ 'COURSES.MATERIALS' | translate }}</h2>
            <label class="btn btn-outline btn-sm">
              <span [innerHTML]="iconUpload"></span>
              {{ 'COURSES.UPLOAD' | translate }}
              <input type="file" (change)="onUpload($event)" hidden
                     accept=".pdf,application/pdf,.mp4,video/mp4"/>
            </label>
          </header>
          <p class="muted small">{{ 'COURSES.UPLOAD_HINT' | translate }}</p>
          <p class="error" *ngIf="uploadErr()">{{ uploadErr() }}</p>
          <p class="uploading" *ngIf="uploading()">
            <span class="spinner"></span> {{ 'COURSES.UPLOADING' | translate }}
          </p>

          <ul class="files">
            <li *ngFor="let f of files()" class="file-item">
              <span class="ftype" [class.video]="f.typeFichier === 'MP4'" [innerHTML]="f.typeFichier === 'PDF' ? iconFile : iconVideo"></span>
              <div class="file-info">
                <strong>{{ f.titre }}</strong>
                <span class="muted small">{{ humanSize(f.tailleOctets) }} · {{ f.dateUpload | date:'short' }}</span>
              </div>
              <a [href]="fileUrl(c.id, f.id)" target="_blank" rel="noopener" class="btn-icon-only" [title]="'BUTTONS.OPEN' | translate">
                <span [innerHTML]="iconEye"></span>
              </a>
              <button class="btn-icon-only danger" (click)="deleteFile(f)" [title]="'BUTTONS.DELETE' | translate">
                <span [innerHTML]="iconTrash"></span>
              </button>
            </li>
            <li class="empty-state" *ngIf="!files().length">{{ 'COURSES.NO_MATERIALS' | translate }}</li>
          </ul>
        </section>

        <!-- ASSIGNMENTS -->
        <section class="card">
          <header class="card-header">
            <h2>{{ 'ASSIGNMENTS.MENU' | translate }}</h2>
            <button class="btn btn-outline btn-sm" (click)="toggleAssignForm()">
              <span [innerHTML]="iconPlus"></span>
              {{ 'ASSIGNMENTS.NEW' | translate }}
            </button>
          </header>

          <form *ngIf="showAssignForm()" [formGroup]="assignForm" (ngSubmit)="createAssignment()" class="aform">
            <div class="field">
              <label>{{ 'ASSIGNMENTS.TITLE_LABEL' | translate }}</label>
              <input class="input" formControlName="titre"/>
            </div>
            <div class="field">
              <label>{{ 'ASSIGNMENTS.DESCRIPTION' | translate }}</label>
              <textarea class="input" rows="2" formControlName="description"></textarea>
            </div>
            <div class="field">
              <label>{{ 'ASSIGNMENTS.DEADLINE' | translate }}</label>
              <input class="input" type="datetime-local" formControlName="dateEcheance"/>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline btn-sm" (click)="showAssignForm.set(false)">
                {{ 'BUTTONS.CANCEL' | translate }}
              </button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="assignForm.invalid">
                {{ 'BUTTONS.SAVE' | translate }}
              </button>
            </div>
          </form>

          <ul class="assign-list">
            <li *ngFor="let a of assignments()" class="assign-item">
              <div class="assign-main">
                <strong>{{ a.titre }}</strong>
                <span class="muted small">
                  {{ 'ASSIGNMENTS.DEADLINE' | translate }}: {{ formatDateTime(a.dateEcheance) }}
                  · <span class="badge badge-info">{{ 'ASSIGNMENTS.SUBMITTED_COUNT' | translate: { count: a.nbSoumissions } }}</span>
                </span>
              </div>
              <a [routerLink]="['/teacher/assignments', a.id, 'submissions']" class="btn btn-outline btn-sm">
                {{ 'ASSIGNMENTS.VIEW_SUBMISSIONS' | translate }}
              </a>
            </li>
            <li class="empty-state" *ngIf="!assignments().length">{{ 'ASSIGNMENTS.EMPTY_NONE' | translate }}</li>
          </ul>
        </section>
      </div>
    </ng-container>

    <ng-template #loadingOrMissing>
      <div class="loading-center" *ngIf="loading()"><div class="spinner spinner-lg"></div></div>
    </ng-template>
  `,
  styles: [`
    .back {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--color-primary); font-size: 0.85rem; text-decoration: none;
      margin-bottom: 8px;
    }
    .back:hover { text-decoration: underline; }
    h1 { font-size: 1.5rem; margin-top: 4px; }
    .muted { color: var(--color-muted-foreground); font-size: 0.9rem; }
    .small { font-size: 0.78rem; }
    .head-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .card { display: flex; flex-direction: column; gap: 12px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .card-header h2 { font-size: 1.05rem; font-family: var(--font-display); }

    .files, .assign-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .file-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      transition: border-color 140ms ease, background 140ms ease;
    }
    .file-item:hover { border-color: var(--color-border-strong); background: var(--color-muted); }
    .ftype {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: var(--radius);
      background: rgba(99,102,241,0.14); color: var(--indigo-400);
      flex-shrink: 0;
    }
    .ftype.video { background: rgba(139,92,246,0.14); color: var(--violet-500); }
    .file-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .file-info strong { font-family: var(--font-display); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .assign-item {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .assign-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
    .assign-main strong { font-family: var(--font-display); font-size: 0.92rem; }

    .aform {
      display: flex; flex-direction: column; gap: 10px;
      padding: 14px;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .uploading { display: flex; align-items: center; gap: 8px; color: var(--amber-400); font-size: 0.85rem; }
    .error { color: var(--red-500); font-size: 0.85rem; }
  `],
})
export class TeacherCourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private courseSvc = inject(CourseService);
  private assignSvc = inject(AssignmentService);
  private translate = inject(TranslateService);

  readonly iconBack = ICONS.arrowLeft;
  readonly iconUpload = ICONS.upload;
  readonly iconEye = ICONS.eye;
  readonly iconTrash = ICONS.trash;
  readonly iconFile = ICONS.file;
  readonly iconVideo = ICONS.video;
  readonly iconPlus = ICONS.plus;
  readonly iconPublish = ICONS.rocket;
  readonly iconArchive = ICONS.archive;

  course = signal<Course | null>(null);
  files = signal<SupportFile[]>([]);
  assignments = signal<Assignment[]>([]);
  loading = signal(true);
  busy = signal(false);
  uploading = signal(false);
  uploadErr = signal<string | null>(null);
  showAssignForm = signal(false);

  assignForm = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    description: [''],
    dateEcheance: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigateByUrl('/teacher/courses'); return; }
    this.refresh(id);
  }

  tone(s: string): ChipTone {
    return s === 'PUBLISHED' ? 'success' : s === 'ARCHIVED' ? 'info' : 'warn';
  }

  humanSize(n: number): string {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  formatDateTime(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  fileUrl(courseId: number, fileId: number): string {
    return `${API_BASE}/courses/${courseId}/files/${fileId}`;
  }

  refresh(id: number): void {
    this.loading.set(true);
    this.courseSvc.get(id).subscribe({
      next: c => { this.course.set(c); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigateByUrl('/teacher/courses'); },
    });
    this.courseSvc.listFiles(id).subscribe({ next: fs => this.files.set(fs), error: () => this.files.set([]) });
    this.assignSvc.listForCourse(id).subscribe({ next: as => this.assignments.set(as), error: () => this.assignments.set([]) });
  }

  toggleAssignForm(): void {
    this.showAssignForm.update(v => !v);
    if (this.showAssignForm()) this.assignForm.reset();
  }

  publish(c: Course): void {
    if (!this.files().length && !confirm(this.translate.instant('COURSES.PUBLISH_CONFIRM'))) return;
    this.busy.set(true);
    this.courseSvc.publish(c.id).subscribe({
      next: u => { this.busy.set(false); this.course.set(u); },
      error: e => { this.busy.set(false); alert(e?.error?.message || this.translate.instant('ERRORS.GENERIC')); },
    });
  }

  archive(c: Course): void {
    if (!confirm(this.translate.instant('COURSES.ARCHIVE_CONFIRM'))) return;
    this.busy.set(true);
    this.courseSvc.archive(c.id).subscribe({
      next: u => { this.busy.set(false); this.course.set(u); },
      error: e => { this.busy.set(false); alert(e?.error?.message || this.translate.instant('ERRORS.GENERIC')); },
    });
  }

  onUpload(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadErr.set(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
    if (!isPdf && !isMp4) { this.uploadErr.set(this.translate.instant('COURSES.FILE_INVALID')); return; }
    if (isPdf && file.size > PDF_MAX) { this.uploadErr.set(this.translate.instant('COURSES.FILE_TOO_LARGE')); return; }
    if (isMp4 && file.size > MP4_MAX) { this.uploadErr.set(this.translate.instant('COURSES.FILE_TOO_LARGE')); return; }

    const c = this.course(); if (!c) return;
    this.uploading.set(true);
    this.courseSvc.uploadFile(c.id, file).subscribe({
      next: f => { this.uploading.set(false); this.files.update(fs => [...fs, f]); },
      error: e => {
        this.uploading.set(false);
        this.uploadErr.set(e?.error?.message || this.translate.instant('ERRORS.GENERIC'));
      },
    });
  }

  deleteFile(f: SupportFile): void {
    const c = this.course(); if (!c) return;
    if (!confirm(this.translate.instant('COURSES.DELETE_CONFIRM'))) return;
    this.courseSvc.deleteFile(c.id, f.id).subscribe(() => {
      this.files.update(fs => fs.filter(x => x.id !== f.id));
    });
  }

  createAssignment(): void {
    const c = this.course(); if (!c) return;
    if (this.assignForm.invalid) return;
    const v = this.assignForm.getRawValue();
    const deadline = new Date(v.dateEcheance).toISOString();

    this.assignSvc.create({
      coursId: c.id,
      titre: v.titre,
      description: v.description,
      dateEcheance: deadline,
    }).subscribe({
      next: () => {
        this.assignForm.reset();
        this.showAssignForm.set(false);
        this.refresh(c.id);
      },
      error: e => alert(e?.error?.message || this.translate.instant('ERRORS.GENERIC')),
    });
  }
}
