import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AssignmentService, Assignment } from '../../core/services/assignment.service';
import { CourseService, Course } from '../../core/services/course.service';
import { ICONS } from '../../shared/icons';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'ASSIGNMENTS.MANAGE_TITLE' | translate }}</h1>
        <p class="muted">{{ 'ASSIGNMENTS.MENU' | translate }}</p>
      </div>
      <button class="btn btn-primary" (click)="openCreateModal()" [disabled]="courses().length === 0">
        <span [innerHTML]="iconPlus"></span>
        {{ 'ASSIGNMENTS.NEW' | translate }}
      </button>
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

    <ng-container *ngIf="!loading()">
      <div class="empty-state fade-up" *ngIf="!selectedCourseFilter()">
        {{ 'ASSIGNMENTS.EMPTY_COURSE' | translate }}
      </div>

      <section class="card table-card fade-up" *ngIf="selectedCourseFilter() && assignments().length > 0">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'ASSIGNMENTS.TH_TITLE' | translate }}</th>
                <th>{{ 'ASSIGNMENTS.DESCRIPTION' | translate }}</th>
                <th>{{ 'ASSIGNMENTS.TH_DEADLINE' | translate }}</th>
                <th>{{ 'ASSIGNMENTS.TH_SUBMISSIONS' | translate }}</th>
                <th class="right">{{ 'ADMIN.TH_ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of assignments()">
                <td><strong>{{ a.titre }}</strong></td>
                <td class="muted">{{ truncate(a.description) }}</td>
                <td>
                  <span class="badge" [ngClass]="isOverdue(a.dateEcheance) ? 'badge-danger' : 'badge-info'">
                    {{ formatDate(a.dateEcheance) }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-info">
                    {{ 'ASSIGNMENTS.SUBMITTED_COUNT' | translate: { count: a.nbSoumissions } }}
                  </span>
                </td>
                <td class="right">
                  <div class="action-row">
                    <a [routerLink]="['/teacher/assignments', a.id, 'submissions']" class="btn-icon-only success"
                       [title]="'ASSIGNMENTS.VIEW_SUBMISSIONS' | translate">
                      <span [innerHTML]="iconInbox"></span>
                    </a>
                    <button class="btn-icon-only" [title]="'BUTTONS.EDIT' | translate" (click)="openEditModal(a)">
                      <span [innerHTML]="iconEdit"></span>
                    </button>
                    <button class="btn-icon-only danger" [title]="'BUTTONS.DELETE' | translate" (click)="delete(a.id)">
                      <span [innerHTML]="iconTrash"></span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="empty-state fade-up" *ngIf="selectedCourseFilter() && assignments().length === 0">
        {{ 'ASSIGNMENTS.EMPTY' | translate }}
      </div>
    </ng-container>

    <!-- Create/Edit modal -->
    <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
      <div class="modal glass modal-lg" (click)="$event.stopPropagation()">
        <h3>{{ (editingAssignment() ? 'ASSIGNMENTS.EDIT' : 'ASSIGNMENTS.CREATE') | translate }}</h3>
        <form [formGroup]="assignForm" (ngSubmit)="saveAssignment()" class="form">
          <div class="field" *ngIf="!editingAssignment()">
            <label>{{ 'COURSES.MENU' | translate }}</label>
            <select formControlName="coursId" class="input select">
              <option *ngFor="let c of courses()" [ngValue]="c.id">{{ c.titre }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ 'ASSIGNMENTS.TITLE_LABEL' | translate }}</label>
            <input type="text" formControlName="titre" class="input" />
          </div>
          <div class="field">
            <label>{{ 'ASSIGNMENTS.DESCRIPTION' | translate }}</label>
            <textarea formControlName="description" class="input" rows="3"></textarea>
          </div>
          <div class="field">
            <label>{{ 'ASSIGNMENTS.DEADLINE' | translate }}</label>
            <input type="datetime-local" formControlName="dateEcheance" class="input" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline btn-sm" (click)="closeModal()">
              {{ 'BUTTONS.CANCEL' | translate }}
            </button>
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="assignForm.invalid || busy()">
              {{ 'BUTTONS.SAVE' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .toolbar {
      display: flex; align-items: center; gap: 12px; padding: 14px 18px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .toolbar .muted { color: var(--color-muted-foreground); font-size: 0.85rem; }
    .select { min-width: 260px; }

    .table-card { padding: 0; overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .data-table thead th.right, .data-table tbody td.right { text-align: end; }
    .action-row { display: inline-flex; gap: 6px; justify-content: flex-end; }
    .muted { color: var(--color-muted-foreground); }
    .form { display: flex; flex-direction: column; gap: 12px; }
  `],
})
export class TeacherAssignmentsComponent implements OnInit {
  private asgSvc = inject(AssignmentService);
  private crsSvc = inject(CourseService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  readonly iconPlus = ICONS.plus;
  readonly iconEdit = ICONS.edit;
  readonly iconTrash = ICONS.trash;
  readonly iconInbox = ICONS.inbox;

  courses = signal<Course[]>([]);
  loading = signal(false);
  busy = signal(false);

  selectedCourseFilter = signal<number | null>(null);
  assignments = signal<Assignment[]>([]);

  showModal = signal(false);
  editingAssignment = signal<Assignment | null>(null);

  assignForm = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    description: [''],
    dateEcheance: ['', [Validators.required]],
    coursId: [0, [Validators.min(1)]],
  });

  ngOnInit(): void {
    this.crsSvc.list().subscribe(res => {
      this.courses.set(res);
      if (res.length > 0) {
        this.selectedCourseFilter.set(res[0].id);
        this.loadAssignments();
      }
    });
  }

  onCourseFilterChange(val: number | null): void {
    if (!val) {
      this.selectedCourseFilter.set(null);
      this.assignments.set([]);
      return;
    }
    this.selectedCourseFilter.set(val);
    this.loadAssignments();
  }

  loadAssignments(): void {
    const cid = this.selectedCourseFilter();
    if (!cid) return;
    this.loading.set(true);
    this.asgSvc.listForCourse(cid).subscribe({
      next: res => { this.assignments.set(res); this.loading.set(false); },
      error: () => { this.assignments.set([]); this.loading.set(false); },
    });
  }

  openCreateModal(): void {
    this.editingAssignment.set(null);
    this.assignForm.reset();
    const cid = this.selectedCourseFilter();
    if (cid) this.assignForm.patchValue({ coursId: cid });
    this.showModal.set(true);
  }

  openEditModal(a: Assignment): void {
    this.editingAssignment.set(a);
    const d = new Date(a.dateEcheance);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    this.assignForm.patchValue({
      coursId: a.coursId, titre: a.titre, description: a.description, dateEcheance: localISOTime,
    });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveAssignment(): void {
    if (this.assignForm.invalid) return;
    const val = this.assignForm.getRawValue();
    const serverDate = new Date(val.dateEcheance).toISOString();
    const payload = { ...val, dateEcheance: serverDate };
    const isEdit = this.editingAssignment();
    this.busy.set(true);
    const obs$ = isEdit ? this.asgSvc.update(isEdit.id, payload) : this.asgSvc.create(payload);
    obs$.subscribe({
      next: () => { this.busy.set(false); this.closeModal(); this.loadAssignments(); },
      error: e => { this.busy.set(false); alert(e?.error?.message || this.translate.instant('ERRORS.GENERIC')); },
    });
  }

  delete(id: number): void {
    if (!confirm(this.translate.instant('ASSIGNMENTS.DELETE_CONFIRM'))) return;
    this.asgSvc.delete(id).subscribe(() => this.loadAssignments());
  }

  truncate(text: string): string {
    if (!text) return '—';
    return text.length > 60 ? text.substring(0, 60) + '…' : text;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  isOverdue(d: string): boolean {
    return new Date(d).getTime() < Date.now();
  }
}
