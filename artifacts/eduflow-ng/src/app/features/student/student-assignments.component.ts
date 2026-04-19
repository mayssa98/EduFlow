import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AssignmentService, Assignment, Submission } from '../../core/services/assignment.service';
import { CourseService, Course } from '../../core/services/course.service';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { ICONS } from '../../shared/icons';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, StatusChipComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'ASSIGNMENTS.MINE_TITLE' | translate }}</h1>
        <p class="muted">{{ 'ASSIGNMENTS.MINE_SUBTITLE' | translate }}</p>
      </div>
    </div>

    <div class="card toolbar">
      <label class="muted">{{ 'ASSIGNMENTS.FILTER_COURSE' | translate }}</label>
      <select class="input select" [ngModel]="selectedCourseFilter()" (ngModelChange)="onCourseFilterChange($event)">
        <option [ngValue]="null">{{ 'ASSIGNMENTS.SELECT_COURSE' | translate }}</option>
        <option *ngFor="let c of courses()" [ngValue]="c.id">{{ c.titre }}</option>
      </select>
    </div>

    <div class="loading-center" *ngIf="loading()">
      <div class="spinner spinner-lg"></div>
    </div>

    <div class="layout-2col fade-up" *ngIf="!loading()">
      <!-- Left: pending assignments -->
      <section class="col">
        <h2 class="section-title">{{ 'ASSIGNMENTS.MENU' | translate }}</h2>

        <div class="empty-state" *ngIf="!selectedCourseFilter()">
          {{ 'ASSIGNMENTS.EMPTY_NONE_COURSE' | translate }}
        </div>

        <div class="empty-state" *ngIf="selectedCourseFilter() && assignments().length === 0">
          {{ 'ASSIGNMENTS.EMPTY_NONE' | translate }}
        </div>

        <article class="card assign-card" *ngFor="let a of assignments()">
          <header class="assign-head">
            <div>
              <strong>{{ a.titre }}</strong>
              <p class="desc">{{ a.description || ('COMMON.NONE' | translate) }}</p>
            </div>
            <span class="badge" [ngClass]="isOverdue(a.dateEcheance) ? 'badge-danger' : 'badge-info'">
              <span [innerHTML]="iconClock"></span>
              {{ formatDate(a.dateEcheance) }}
            </span>
          </header>

          <ng-container *ngIf="getSubmissionFor(a.id) as sub; else notSubmitted">
            <div class="submitted-banner">
              <span [innerHTML]="iconCheck"></span>
              <span>{{ 'ASSIGNMENTS.SUBMITTED_ON' | translate }} {{ formatDate(sub.dateSoumission) }}</span>
              <span class="grade-pill" *ngIf="sub.note != null">
                {{ 'ASSIGNMENTS.GRADE_PILL' | translate: { note: sub.note } }}
              </span>
            </div>
          </ng-container>

          <ng-template #notSubmitted>
            <div class="assign-actions">
              <input type="file" #fileInput (change)="onFileSelected($event, a.id)"
                     accept="application/pdf,video/mp4" hidden />
              <button class="btn btn-primary btn-sm"
                      (click)="fileInput.click()"
                      [disabled]="isOverdue(a.dateEcheance) || uploadingId() === a.id">
                <span [innerHTML]="iconUpload"></span>
                {{ (isOverdue(a.dateEcheance) ? 'ASSIGNMENTS.OVERDUE' : 'ASSIGNMENTS.SUBMIT') | translate }}
              </button>
              <span class="uploading-text" *ngIf="uploadingId() === a.id">
                <span class="spinner"></span> {{ 'ASSIGNMENTS.UPLOADING' | translate }}
              </span>
            </div>
          </ng-template>
        </article>
      </section>

      <!-- Right: timeline of my submissions -->
      <aside class="col">
        <h2 class="section-title">{{ 'ASSIGNMENTS.MY_RESULTS' | translate }}</h2>
        <div class="card timeline-card">
          <div class="timeline" *ngIf="mySubmissions().length > 0">
            <article class="tl-item" *ngFor="let s of mySubmissions()">
              <span class="tl-dot" [class.graded]="s.note != null"
                    [innerHTML]="s.note != null ? iconCheck : iconClock"></span>
              <div class="tl-body">
                <strong>{{ s.devoirTitre }}</strong>
                <p class="muted small">{{ formatDate(s.dateSoumission) }}</p>
                <div class="tl-grade" *ngIf="s.note != null; else pendingGrade">
                  <div class="grade-value" [class.failed]="s.note! < 10">
                    {{ s.note }} <span class="max">/20</span>
                  </div>
                  <p class="muted small" *ngIf="s.commentaire">"{{ s.commentaire }}"</p>
                </div>
                <ng-template #pendingGrade>
                  <app-status-chip [label]="'ASSIGNMENTS.PENDING_REVIEW' | translate" tone="warn"></app-status-chip>
                </ng-template>
              </div>
            </article>
          </div>
          <div class="empty-state" *ngIf="mySubmissions().length === 0">
            {{ 'ASSIGNMENTS.EMPTY_SUBMISSIONS' | translate }}
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .toolbar {
      display: flex; align-items: center; gap: 12px; padding: 14px 18px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .toolbar .muted { color: var(--color-muted-foreground); font-size: 0.85rem; }
    .select { min-width: 260px; }

    .layout-2col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
    @media (max-width: 1000px) { .layout-2col { grid-template-columns: 1fr; } }
    .col { display: flex; flex-direction: column; gap: 14px; }
    .section-title { font-size: 1.05rem; font-family: var(--font-display); font-weight: 700; }

    .muted { color: var(--color-muted-foreground); }
    .small { font-size: 0.8rem; }

    .assign-card { display: flex; flex-direction: column; gap: 12px; }
    .assign-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .assign-head strong { font-family: var(--font-display); font-size: 1rem; }
    .desc { color: var(--color-muted-foreground); font-size: 0.88rem; margin-top: 4px; }
    .assign-actions { display: flex; align-items: center; gap: 10px; }
    .uploading-text { display: inline-flex; align-items: center; gap: 8px; color: var(--amber-400); font-size: 0.85rem; }

    .submitted-banner {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 14px;
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.3);
      color: var(--green-500);
      border-radius: var(--radius);
      font-weight: 500;
      font-size: 0.9rem;
      flex-wrap: wrap;
    }
    .grade-pill {
      margin-inline-start: auto;
      padding: 3px 10px;
      background: var(--color-card);
      border-radius: 999px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.8rem;
    }

    .timeline-card { padding: 18px; }
    .timeline { display: flex; flex-direction: column; gap: 18px; position: relative; }
    .timeline::before {
      content: '';
      position: absolute;
      inset-inline-start: 14px; top: 4px; bottom: 4px;
      width: 2px;
      background: var(--color-border);
    }
    .tl-item { display: flex; gap: 14px; position: relative; z-index: 1; }
    .tl-dot {
      width: 30px; height: 30px; border-radius: 50%;
      background: var(--color-card);
      border: 2px solid var(--color-border);
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--color-muted-foreground);
      flex-shrink: 0;
    }
    .tl-dot.graded { background: rgba(99,102,241,0.12); border-color: var(--indigo-400); color: var(--indigo-400); }
    .tl-body { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .tl-body strong { font-family: var(--font-display); font-size: 0.92rem; }
    .tl-grade .grade-value {
      font-family: var(--font-display); font-weight: 800; font-size: 1.4rem; color: var(--green-500);
    }
    .tl-grade .grade-value.failed { color: var(--red-500); }
    .tl-grade .max { font-size: 0.85rem; color: var(--color-muted-foreground); font-weight: 600; }
  `],
})
export class StudentAssignmentsComponent implements OnInit {
  private asgSvc = inject(AssignmentService);
  private crsSvc = inject(CourseService);
  private translate = inject(TranslateService);

  readonly iconClock = ICONS.clock;
  readonly iconCheck = ICONS.check;
  readonly iconUpload = ICONS.upload;

  courses = signal<Course[]>([]);
  loading = signal(false);

  selectedCourseFilter = signal<number | null>(null);
  assignments = signal<Assignment[]>([]);

  mySubmissions = signal<Submission[]>([]);
  uploadingId = signal<number | null>(null);

  ngOnInit(): void {
    this.crsSvc.list().subscribe(res => {
      this.courses.set(res.filter(c => c.statut === 'PUBLISHED'));
    });
    this.loadMySubmissions();
  }

  loadMySubmissions(): void {
    this.asgSvc.mySubmissions().subscribe(res => {
      res.sort((a, b) => new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime());
      this.mySubmissions.set(res);
    });
  }

  onCourseFilterChange(val: number | null): void {
    if (!val) {
      this.selectedCourseFilter.set(null);
      this.assignments.set([]);
      return;
    }
    this.selectedCourseFilter.set(val);
    this.loading.set(true);
    this.asgSvc.listForCourse(val).subscribe({
      next: res => { this.assignments.set(res); this.loading.set(false); },
      error: () => { this.assignments.set([]); this.loading.set(false); },
    });
  }

  getSubmissionFor(assignmentId: number): Submission | undefined {
    return this.mySubmissions().find(s => s.devoirId === assignmentId);
  }

  onFileSelected(event: Event, assignmentId: number): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    this.uploadingId.set(assignmentId);
    this.asgSvc.submit(assignmentId, file).subscribe({
      next: () => {
        this.uploadingId.set(null);
        this.loadMySubmissions();
        alert(this.translate.instant('ASSIGNMENTS.SUBMITTED_SUCCESS'));
      },
      error: err => {
        this.uploadingId.set(null);
        alert(err?.error?.message || this.translate.instant('ERRORS.GENERIC'));
      },
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  isOverdue(d: string): boolean {
    return new Date(d).getTime() < Date.now();
  }
}
