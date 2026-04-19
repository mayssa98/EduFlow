import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CourseService, Course } from '../../core/services/course.service';
import { StatusChipComponent, ChipTone } from '../../shared/components/status-chip/status-chip.component';
import { ICONS } from '../../shared/icons';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, StatusChipComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'COURSES.MANAGE_TITLE' | translate }}</h1>
        <p class="muted">{{ 'COURSES.MENU' | translate }} · {{ courses().length }}</p>
      </div>
      <button class="btn btn-primary" (click)="openCreateModal()">
        <span [innerHTML]="iconPlus"></span>
        {{ 'COURSES.NEW' | translate }}
      </button>
    </div>

    <div class="loading-center" *ngIf="loading()">
      <div class="spinner spinner-lg"></div>
    </div>

    <section class="card table-card fade-up" *ngIf="!loading() && courses().length > 0">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ 'COURSES.TITLE_LABEL' | translate }}</th>
              <th>{{ 'COURSES.DESCRIPTION' | translate }}</th>
              <th>{{ 'ADMIN.TH_STATUS' | translate }}</th>
              <th>{{ 'COURSES.CREATED_AT' | translate }}</th>
              <th class="right">{{ 'ADMIN.TH_ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of courses()">
              <td><strong>{{ c.titre }}</strong></td>
              <td class="muted">{{ truncate(c.description) }}</td>
              <td>
                <app-status-chip [label]="('COURSES.STATUS_' + c.statut) | translate" [tone]="tone(c.statut)"></app-status-chip>
              </td>
              <td class="muted small">{{ formatDate(c.dateCreation) }}</td>
              <td class="right">
                <div class="action-row">
                  <a [routerLink]="['/teacher/courses', c.id]" class="btn-icon-only"
                     [title]="'BUTTONS.OPEN' | translate">
                    <span [innerHTML]="iconEye"></span>
                  </a>
                  <button class="btn-icon-only" [title]="'COURSES.EDIT' | translate" (click)="openEditModal(c)">
                    <span [innerHTML]="iconEdit"></span>
                  </button>
                  <button *ngIf="c.statut === 'DRAFT'" class="btn-icon-only success"
                          [title]="'COURSES.PUBLISH' | translate" (click)="publish(c.id)">
                    <span [innerHTML]="iconRocket"></span>
                  </button>
                  <button *ngIf="c.statut === 'PUBLISHED'" class="btn-icon-only warn"
                          [title]="'COURSES.ARCHIVE' | translate" (click)="archive(c.id)">
                    <span [innerHTML]="iconArchive"></span>
                  </button>
                  <button class="btn-icon-only danger"
                          [title]="'BUTTONS.DELETE' | translate" (click)="delete(c.id)">
                    <span [innerHTML]="iconTrash"></span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="empty-state fade-up" *ngIf="!loading() && courses().length === 0">
      {{ 'COURSES.EMPTY' | translate }}
    </div>

    <!-- Create/Edit modal -->
    <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
      <div class="modal glass" (click)="$event.stopPropagation()">
        <h3>{{ (editingCourse() ? 'COURSES.EDIT' : 'COURSES.CREATE') | translate }}</h3>
        <form [formGroup]="courseForm" (ngSubmit)="saveCourse()" class="form">
          <div class="field">
            <label>{{ 'COURSES.TITLE_LABEL' | translate }}</label>
            <input type="text" formControlName="titre" class="input" />
          </div>
          <div class="field">
            <label>{{ 'COURSES.DESCRIPTION' | translate }}</label>
            <textarea formControlName="description" class="input" rows="4"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline btn-sm" (click)="closeModal()">
              {{ 'BUTTONS.CANCEL' | translate }}
            </button>
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="courseForm.invalid || busy()">
              {{ 'BUTTONS.SAVE' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .table-card { padding: 0; overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .data-table thead th.right, .data-table tbody td.right { text-align: end; }

    .muted { color: var(--color-muted-foreground); }
    .small { font-size: 0.8rem; }
    .action-row { display: inline-flex; gap: 6px; justify-content: flex-end; }

    .form { display: flex; flex-direction: column; gap: 12px; }
    .modal.glass h3 { font-size: 1.1rem; }
  `],
})
export class TeacherCoursesComponent implements OnInit {
  private courseSvc = inject(CourseService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  readonly iconPlus = ICONS.plus;
  readonly iconEye = ICONS.eye;
  readonly iconEdit = ICONS.edit;
  readonly iconTrash = ICONS.trash;
  readonly iconRocket = ICONS.rocket;
  readonly iconArchive = ICONS.archive;

  courses = signal<Course[]>([]);
  loading = signal(true);
  busy = signal(false);

  showModal = signal(false);
  editingCourse = signal<Course | null>(null);

  courseForm = this.fb.nonNullable.group({
    titre: ['', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void { this.loadAll(); }

  tone(s: string): ChipTone {
    return s === 'PUBLISHED' ? 'success' : s === 'ARCHIVED' ? 'info' : 'warn';
  }

  truncate(text: string): string {
    if (!text) return '';
    return text.length > 60 ? text.substring(0, 60) + '…' : text;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  loadAll(): void {
    this.loading.set(true);
    this.courseSvc.list().subscribe({
      next: res => { this.courses.set(res); this.loading.set(false); },
      error: () => { this.courses.set([]); this.loading.set(false); },
    });
  }

  openCreateModal(): void {
    this.editingCourse.set(null);
    this.courseForm.reset();
    this.showModal.set(true);
  }

  openEditModal(c: Course): void {
    this.editingCourse.set(c);
    this.courseForm.patchValue({ titre: c.titre, description: c.description });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveCourse(): void {
    if (this.courseForm.invalid) return;
    const val = this.courseForm.getRawValue();
    const isEdit = this.editingCourse();
    this.busy.set(true);
    const obs$ = isEdit ? this.courseSvc.update(isEdit.id, val) : this.courseSvc.create(val);
    obs$.subscribe({
      next: () => { this.busy.set(false); this.closeModal(); this.loadAll(); },
      error: e => { this.busy.set(false); alert(e?.error?.message || this.translate.instant('ERRORS.GENERIC')); },
    });
  }

  delete(id: number): void {
    if (!confirm(this.translate.instant('COURSES.DELETE_CONFIRM'))) return;
    this.courseSvc.delete(id).subscribe(() => this.loadAll());
  }

  publish(id: number): void {
    if (!confirm(this.translate.instant('COURSES.PUBLISH_CONFIRM'))) return;
    this.courseSvc.publish(id).subscribe(() => this.loadAll());
  }

  archive(id: number): void {
    if (!confirm(this.translate.instant('COURSES.ARCHIVE_CONFIRM'))) return;
    this.courseSvc.archive(id).subscribe(() => this.loadAll());
  }
}
