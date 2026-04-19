import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CourseService, Course, SupportFile } from '../../core/services/course.service';
import { API_BASE } from '../../core/services/auth.service';
import { ICONS } from '../../shared/icons';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'COURSES.BROWSE_TITLE' | translate }}</h1>
        <p class="muted">{{ 'COURSES.BROWSE_SUBTITLE' | translate }}</p>
      </div>
      <label class="search-wrap">
        <span class="search-icon" [innerHTML]="iconSearch"></span>
        <input type="search" class="input search" [placeholder]="'COURSES.SEARCH' | translate"
               [ngModel]="searchText()" (ngModelChange)="searchText.set($event)"/>
      </label>
    </div>

    <div class="loading-center" *ngIf="loading()">
      <div class="spinner spinner-lg"></div>
    </div>

    <div class="grid-auto-fill-320 fade-up" *ngIf="!loading()">
      <article class="card course-card" *ngFor="let c of filtered()" (click)="openCourse(c)">
        <div class="course-head">
          <h3>{{ c.titre }}</h3>
          <span class="badge badge-info">{{ c.enseignantNom }}</span>
        </div>
        <p class="desc">{{ truncate(c.description) }}</p>
        <div class="course-foot">
          <span class="muted small">{{ 'COURSES.PUBLISHED_AT' | translate }} · {{ formatDate(c.datePublication || c.dateCreation) }}</span>
          <span class="btn btn-outline btn-sm">{{ 'COURSES.CONSULT' | translate }}</span>
        </div>
      </article>

      <div class="empty-state" *ngIf="!filtered().length" [style.grid-column]="'1 / -1'">
        {{ 'COURSES.EMPTY_BROWSE' | translate }}
      </div>
    </div>

    <!-- Materials modal -->
    <div class="modal-overlay" *ngIf="showFilesModal()" (click)="closeFilesModal()">
      <div class="modal glass modal-lg" (click)="$event.stopPropagation()">
        <header class="modal-head">
          <div>
            <h3>{{ selectedCourse()?.titre }}</h3>
            <p class="muted small">{{ selectedCourse()?.description }}</p>
          </div>
          <button class="btn-icon-only" (click)="closeFilesModal()">
            <span [innerHTML]="iconClose"></span>
          </button>
        </header>

        <div class="loading-center" *ngIf="loadingFiles()">
          <div class="spinner"></div>
        </div>

        <ul class="files" *ngIf="!loadingFiles()">
          <li *ngFor="let f of files()" class="file-item">
            <span class="ftype" [class.video]="f.typeFichier === 'MP4'"
                  [innerHTML]="f.typeFichier === 'PDF' ? iconFile : iconVideo"></span>
            <div class="file-info">
              <strong>{{ f.titre }}</strong>
              <span class="muted small">{{ humanSize(f.tailleOctets) }}</span>
            </div>
            <a [href]="fileUrl(selectedCourse()!.id, f.id)" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
              {{ 'COURSES.OPEN' | translate }}
            </a>
          </li>
          <li class="empty-state" *ngIf="!files().length">{{ 'COURSES.NO_MATERIALS' | translate }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .search-wrap { position: relative; display: flex; align-items: center; min-width: 240px; }
    .search-icon { position: absolute; inset-inline-start: 10px; color: var(--color-muted-foreground); display: inline-flex; }
    .search { padding-inline-start: 36px; min-width: 240px; }

    .course-card {
      cursor: pointer;
      display: flex; flex-direction: column; gap: 10px;
      transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
    }
    .course-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--color-border-strong); }
    .course-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .course-head h3 { font-size: 1.05rem; font-family: var(--font-display); line-height: 1.3; }
    .desc { color: var(--color-muted-foreground); font-size: 0.88rem; line-height: 1.5; flex: 1; }
    .course-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px dashed var(--color-border); }
    .small { font-size: 0.78rem; }
    .muted { color: var(--color-muted-foreground); }

    .modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .modal-head h3 { font-size: 1.1rem; font-family: var(--font-display); }

    .files { list-style: none; display: flex; flex-direction: column; gap: 8px; padding: 0; }
    .file-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .file-item:hover { background: var(--color-muted); }
    .ftype {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: var(--radius);
      background: rgba(99,102,241,0.14); color: var(--indigo-400); flex-shrink: 0;
    }
    .ftype.video { background: rgba(139,92,246,0.14); color: var(--violet-500); }
    .file-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .file-info strong { font-family: var(--font-display); font-size: 0.9rem; }
  `],
})
export class StudentCoursesComponent implements OnInit {
  private courseSvc = inject(CourseService);
  private translate = inject(TranslateService);

  readonly iconSearch = ICONS.search;
  readonly iconClose = ICONS.close;
  readonly iconFile = ICONS.file;
  readonly iconVideo = ICONS.video;

  courses = signal<Course[]>([]);
  loading = signal(true);

  showFilesModal = signal(false);
  selectedCourse = signal<Course | null>(null);
  files = signal<SupportFile[]>([]);
  loadingFiles = signal(false);

  searchText = signal('');

  filtered = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const items = this.courses();
    if (!q) return items;
    return items.filter(c =>
      c.titre.toLowerCase().includes(q) ||
      (c.description?.toLowerCase().includes(q) ?? false) ||
      (c.enseignantNom?.toLowerCase().includes(q) ?? false)
    );
  });

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading.set(true);
    this.courseSvc.list().subscribe({
      next: res => {
        this.courses.set(res.filter(c => c.statut === 'PUBLISHED'));
        this.loading.set(false);
      },
      error: () => { this.courses.set([]); this.loading.set(false); },
    });
  }

  openCourse(c: Course): void {
    this.selectedCourse.set(c);
    this.showFilesModal.set(true);
    this.loadingFiles.set(true);
    this.courseSvc.listFiles(c.id).subscribe({
      next: res => { this.files.set(res); this.loadingFiles.set(false); },
      error: () => { this.files.set([]); this.loadingFiles.set(false); },
    });
  }

  closeFilesModal(): void { this.showFilesModal.set(false); }

  fileUrl(courseId: number, fileId: number): string {
    return `${API_BASE}/courses/${courseId}/files/${fileId}`;
  }

  truncate(text: string): string {
    if (!text) return '—';
    return text.length > 120 ? text.substring(0, 120) + '…' : text;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  humanSize(n: number): string {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}
