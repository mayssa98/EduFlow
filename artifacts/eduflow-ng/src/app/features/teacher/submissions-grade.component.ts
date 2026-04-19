import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AssignmentService, Assignment, Submission } from '../../core/services/assignment.service';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { ICONS } from '../../shared/icons';

interface GradeDraft { note: string; commentaire: string; }

@Component({
  selector: 'app-teacher-submissions-grade',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule, StatusChipComponent],
  template: `
    <div class="page-head">
      <div>
        <a routerLink="/teacher/assignments" class="back">
          <span [innerHTML]="iconBack"></span>
          {{ 'BUTTONS.BACK' | translate }}
        </a>
        <h1>{{ 'GRADE.TITLE' | translate }}</h1>
        <p class="muted" *ngIf="assignment() as a">
          <strong>{{ a.titre }}</strong>
          <span *ngIf="a.dateEcheance"> · {{ 'ASSIGNMENTS.DEADLINE' | translate }}: {{ formatDate(a.dateEcheance) }}</span>
        </p>
      </div>
    </div>

    <div class="loading-center" *ngIf="loading()">
      <div class="spinner spinner-lg"></div>
    </div>

    <div class="grid-auto-fill-320 fade-up" *ngIf="!loading()">
      <article class="card" *ngFor="let s of submissions()">
        <header class="sub-header">
          <div class="student">
            <div class="avatar">{{ initials(s.etudiantNom) }}</div>
            <div class="meta">
              <strong>{{ s.etudiantNom }}</strong>
              <span class="muted small">{{ formatDate(s.dateSoumission) }}</span>
            </div>
          </div>
          <app-status-chip
            [label]="(s.note != null ? 'GRADE.GRADED' : 'STATUS.PENDING') | translate"
            [tone]="s.note != null ? 'success' : 'warn'">
          </app-status-chip>
        </header>

        <a [href]="fileUrl(s)" target="_blank" rel="noopener" class="file-link">
          <span [innerHTML]="s.typeFichier === 'PDF' ? iconFile : iconVideo"></span>
          <span>{{ 'GRADE.OPEN_FILE' | translate }}</span>
        </a>

        <!-- Graded display -->
        <div class="graded-block" *ngIf="s.note != null">
          <div class="grade-value" [class.failed]="s.note! < 10">
            {{ s.note }} <span class="max">/20</span>
          </div>
          <p class="muted small" *ngIf="s.commentaire">"{{ s.commentaire }}"</p>
        </div>

        <!-- Grading form -->
        <form *ngIf="s.note == null" class="grade-form" (ngSubmit)="saveGrade(s)">
          <div class="field">
            <label>{{ 'GRADE.MARK' | translate }}</label>
            <input type="number" class="input" min="0" max="20" step="0.25"
                   [ngModel]="drafts()[s.id]?.note"
                   (ngModelChange)="updateDraft(s.id, 'note', $event)"
                   [ngModelOptions]="{ standalone: true }"
                   [placeholder]="'GRADE.MARK' | translate"/>
          </div>
          <div class="field">
            <label>{{ 'GRADE.TH_COMMENT' | translate }}</label>
            <textarea class="input" rows="2"
                      [ngModel]="drafts()[s.id]?.commentaire"
                      (ngModelChange)="updateDraft(s.id, 'commentaire', $event)"
                      [ngModelOptions]="{ standalone: true }"
                      [placeholder]="'GRADE.COMMENT_PLACEHOLDER' | translate"></textarea>
          </div>
          <p class="error" *ngIf="errors()[s.id]">{{ errors()[s.id] }}</p>
          <button type="submit" class="btn btn-primary btn-sm" [disabled]="busy() === s.id">
            <span class="spinner" *ngIf="busy() === s.id"></span>
            <span [innerHTML]="iconCheck" *ngIf="busy() !== s.id"></span>
            {{ 'GRADE.SAVE' | translate }}
          </button>
        </form>
      </article>

      <div class="empty-state" *ngIf="!submissions().length" [style.grid-column]="'1 / -1'">
        {{ 'GRADE.EMPTY' | translate }}
      </div>
    </div>
  `,
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-size: 0.85rem; text-decoration: none; margin-bottom: 8px; }
    .back:hover { text-decoration: underline; }
    h1 { font-size: 1.5rem; margin-top: 4px; }
    .muted { color: var(--color-muted-foreground); font-size: 0.9rem; }
    .small { font-size: 0.78rem; }
    .card { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
    .sub-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .student { display: flex; align-items: center; gap: 10px; }
    .meta strong { font-family: var(--font-display); font-size: 0.95rem; display: block; }
    .file-link {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 12px;
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
      color: var(--color-foreground); font-size: 0.88rem;
      text-decoration: none;
      transition: background 140ms ease, border-color 140ms ease;
    }
    .file-link:hover { background: var(--color-muted); border-color: var(--color-border-strong); }
    .graded-block {
      padding: 14px;
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.3);
      border-radius: var(--radius);
      text-align: center;
    }
    .grade-value { font-family: var(--font-display); font-weight: 800; font-size: 1.8rem; color: var(--green-500); }
    .grade-value.failed { color: var(--red-500); }
    .grade-value .max { font-size: 1rem; color: var(--color-muted-foreground); font-weight: 600; }
    .grade-form { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; border-top: 1px dashed var(--color-border); }
    .grade-form button { align-self: flex-end; }
    .error { color: var(--red-500); font-size: 0.85rem; }
  `],
})
export class TeacherSubmissionsGradeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(AssignmentService);
  private translate = inject(TranslateService);

  readonly iconBack = ICONS.arrowLeft;
  readonly iconCheck = ICONS.check;
  readonly iconFile = ICONS.file;
  readonly iconVideo = ICONS.video;

  assignment = signal<Assignment | null>(null);
  submissions = signal<Submission[]>([]);
  loading = signal(true);
  busy = signal<number | null>(null);
  drafts = signal<Record<number, GradeDraft>>({});
  errors = signal<Record<number, string>>({});

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigateByUrl('/teacher/assignments'); return; }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.svc.get(id).subscribe({
      next: a => this.assignment.set(a),
      error: () => this.router.navigateByUrl('/teacher/assignments'),
    });
    this.svc.listSubmissions(id).subscribe({
      next: ss => { this.submissions.set(ss); this.loading.set(false); },
      error: () => { this.submissions.set([]); this.loading.set(false); },
    });
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  fileUrl(s: Submission): string {
    // Submission files are usually served through a dedicated endpoint; fallback to raw path.
    return s.cheminFichier?.startsWith('http')
      ? s.cheminFichier
      : `/api/assignments/submissions/${s.id}/file`;
  }

  updateDraft(id: number, field: keyof GradeDraft, value: string): void {
    this.drafts.update(m => ({
      ...m,
      [id]: { note: '', commentaire: '', ...(m[id] ?? {}), [field]: value },
    }));
  }

  saveGrade(s: Submission): void {
    const d = this.drafts()[s.id] ?? { note: '', commentaire: '' };
    const noteNum = Number(d.note);
    if (isNaN(noteNum) || noteNum < 0 || noteNum > 20) {
      this.errors.update(m => ({ ...m, [s.id]: this.translate.instant('GRADE.INVALID_MARK') }));
      return;
    }
    this.busy.set(s.id);
    this.errors.update(m => ({ ...m, [s.id]: '' }));
    this.svc.gradeSubmission(s.id, noteNum, d.commentaire || undefined).subscribe({
      next: updated => {
        this.busy.set(null);
        this.submissions.update(list => list.map(x => x.id === s.id ? updated : x));
      },
      error: e => {
        this.busy.set(null);
        this.errors.update(m => ({
          ...m,
          [s.id]: e?.error?.message || this.translate.instant('ERRORS.GENERIC'),
        }));
      },
    });
  }
}
