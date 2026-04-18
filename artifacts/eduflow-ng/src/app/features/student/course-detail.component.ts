import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { CourseService } from '../../core/services/api.services';
import { CourseResponse, SupportResponse } from '../../core/models/api.models';
import { API_BASE } from '../../core/services/auth.service';

@Component({
  selector: 'app-student-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <ng-container *ngIf="course() as c">
      <div class="page-head">
        <div>
          <a routerLink="/student/courses" class="back">← {{ 'COURSES.BACK' | translate }}</a>
          <h1>{{ c.titre }}</h1>
          <p class="muted">👤 {{ c.enseignantNom }} · {{ c.matiereNom || ('COURSES.GENERAL' | translate) }}</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" *ngIf="!enrolled()" (click)="enroll()" [disabled]="busy()">
            ✓ {{ 'COURSES.ENROLL' | translate }}
          </button>
          <button class="btn btn-outline" *ngIf="enrolled()" (click)="unenroll()" [disabled]="busy()">
            {{ 'COURSES.UNENROLL' | translate }}
          </button>
        </div>
      </div>

      <p class="card glass desc">{{ c.description || ('COURSES.NO_DESC' | translate) }}</p>

      <h2 class="section-title">{{ 'COURSES.MATERIALS' | translate }}</h2>
      <div class="grid">
        <article class="card glass mat" *ngFor="let f of files()">
          <header>
            <span class="ftype" [class.mp4]="f.typeFichier === 'MP4'">{{ f.typeFichier }}</span>
            <strong>{{ f.titre }}</strong>
          </header>
          <p class="muted small">{{ humanSize(f.tailleOctets) }}</p>
          <button class="btn btn-outline btn-sm" (click)="open(f)">
            {{ f.typeFichier === 'PDF' ? ('COURSES.READ_ONLINE' | translate) : ('COURSES.OPEN' | translate) }}
          </button>
        </article>

        <div class="card glass empty" *ngIf="!files().length">
          {{ 'COURSES.NO_MATERIALS' | translate }}
        </div>
      </div>

      <div class="viewer" *ngIf="viewerUrl() as url">
        <header>
          <strong>{{ viewerTitle() }}</strong>
          <button class="btn btn-outline btn-sm" (click)="closeViewer()">×</button>
        </header>
        <iframe [src]="url" frameborder="0"></iframe>
      </div>
    </ng-container>
  `,
  styles: [`
    .back { color: var(--color-primary); font-size:.85rem; text-decoration:none; }
    h1 { font-size:1.5rem; margin-top:6px; }
    .muted { color: var(--color-muted-foreground); font-size:.85rem; }
    .small { font-size:.78rem; }
    .page-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
    .desc { padding:14px; margin-bottom:14px; }
    .section-title { font-size:1.1rem; margin-bottom:10px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:12px; margin-bottom:14px; }
    .mat { padding:14px; display:flex; flex-direction:column; gap:8px; }
    .mat header { display:flex; align-items:center; gap:10px; }
    .ftype { font-family: var(--font-display); font-weight:700; font-size:.7rem; padding:4px 8px; border-radius:6px; background:rgba(99,102,241,.14); color:var(--indigo-400); }
    .ftype.mp4 { background: rgba(139,92,246,.14); color: var(--violet-500); }
    .mat strong { font-family: var(--font-display); font-size:.9rem; flex:1; }
    .empty { grid-column: 1 / -1; padding:24px; text-align:center; color: var(--color-muted-foreground); }
    .viewer { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:50; display:flex; flex-direction:column; padding:24px; }
    .viewer header { display:flex; justify-content:space-between; align-items:center; padding:8px 16px; background:#fff; border-radius: var(--radius) var(--radius) 0 0; }
    .viewer iframe { flex:1; border:0; background:#fff; border-radius: 0 0 var(--radius) var(--radius); }
  `],
})
export class StudentCourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private svc = inject(CourseService);

  course = signal<CourseResponse | null>(null);
  files = signal<SupportResponse[]>([]);
  enrolled = signal(false);
  busy = signal(false);
  viewerUrl = signal<SafeResourceUrl | null>(null);
  viewerTitle = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    this.refresh(id);
  }

  humanSize(n: number): string {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  refresh(id: number): void {
    this.svc.get(id).subscribe(c => this.course.set(c));
    this.svc.files(id).subscribe({ next: fs => this.files.set(fs), error: () => this.files.set([]) });
    this.svc.isEnrolled(id).subscribe({
      next: r => this.enrolled.set(!!r?.enrolled),
      error: () => this.enrolled.set(false),
    });
  }

  enroll(): void {
    const c = this.course(); if (!c) return;
    this.busy.set(true);
    this.svc.enroll(c.id).subscribe({
      next: () => { this.busy.set(false); this.enrolled.set(true); this.refresh(c.id); },
      error: e => { this.busy.set(false); alert(e?.error?.message || 'Erreur lors de l\'inscription'); },
    });
  }

  unenroll(): void {
    const c = this.course(); if (!c) return;
    if (!confirm('Se désinscrire de ce cours ?')) return;
    this.busy.set(true);
    this.svc.unenroll(c.id).subscribe({
      next: () => { this.busy.set(false); this.enrolled.set(false); },
      error: e => { this.busy.set(false); alert(e?.error?.message || 'Erreur'); },
    });
  }

  open(f: SupportResponse): void {
    const c = this.course(); if (!c) return;
    const url = `${API_BASE}/courses/${c.id}/files/${f.id}`;
    if (f.typeFichier === 'PDF') {
      this.viewerTitle.set(f.titre);
      this.viewerUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url + '#toolbar=1'));
    } else {
      window.open(url, '_blank', 'noopener');
    }
  }

  closeViewer(): void { this.viewerUrl.set(null); }
}
