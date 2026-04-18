import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CourseService } from '../../core/services/api.services';
import { CourseResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-student-courses-browse',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'COURSES.BROWSE_TITLE' | translate }}</h1>
        <p class="muted">{{ 'COURSES.BROWSE_SUBTITLE' | translate }}</p>
      </div>
      <input class="input search" [value]="q()" (input)="q.set($any($event.target).value)"
             [placeholder]="'COURSES.SEARCH' | translate"/>
    </div>

    <div class="grid">
      <article class="card glass course" *ngFor="let c of filtered()">
        <header>
          <strong>{{ c.titre }}</strong>
          <span class="badge">{{ c.matiereNom || ('COURSES.GENERAL' | translate) }}</span>
        </header>
        <p class="desc">{{ c.description || ('COURSES.NO_DESC' | translate) }}</p>
        <div class="meta">
          <span class="muted">👤 {{ c.enseignantNom }}</span>
          <span class="muted" *ngIf="c.nbConsultations !== undefined">👁 {{ c.nbConsultations }}</span>
        </div>
        <footer>
          <a [routerLink]="['/student/courses', c.id]" class="btn btn-primary btn-sm full">
            {{ 'COURSES.VIEW' | translate }}
          </a>
        </footer>
      </article>

      <div class="card glass empty" *ngIf="!filtered().length">
        {{ 'COURSES.BROWSE_EMPTY' | translate }}
      </div>
    </div>
  `,
  styles: [`
    .page-head { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
    h1 { font-size:1.5rem; }
    .muted { color: var(--color-muted-foreground); font-size:.85rem; }
    .search { max-width:280px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:14px; }
    .course { padding:16px; display:flex; flex-direction:column; gap:10px; transition: transform .2s, box-shadow .2s; }
    .course:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    .course header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    .course strong { font-family: var(--font-display); font-size:1rem; }
    .badge { font-size:.7rem; padding:3px 8px; border-radius:999px; background: rgba(99,102,241,.14); color: var(--indigo-400); }
    .desc { color: var(--color-muted-foreground); font-size:.88rem; min-height:42px; }
    .meta { display:flex; justify-content:space-between; padding-top:8px; border-top:1px dashed var(--color-border); font-size:.82rem; }
    .full { width:100%; text-align:center; }
    .empty { grid-column: 1 / -1; padding:36px; text-align:center; color: var(--color-muted-foreground); }
  `],
})
export class StudentCoursesBrowseComponent implements OnInit {
  private svc = inject(CourseService);
  courses = signal<CourseResponse[]>([]);
  q = signal('');
  filtered = () => {
    const s = this.q().trim().toLowerCase();
    if (!s) return this.courses();
    return this.courses().filter(c =>
      c.titre.toLowerCase().includes(s) ||
      (c.description ?? '').toLowerCase().includes(s) ||
      (c.enseignantNom ?? '').toLowerCase().includes(s),
    );
  };
  ngOnInit(): void {
    this.svc.list({ status: 'PUBLISHED' }).subscribe({
      next: cs => this.courses.set(cs),
      error: () => this.courses.set([]),
    });
  }
}
