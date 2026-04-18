import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CourseService, AssignmentService } from '../../core/services/api.services';
import { CourseResponse, SupportResponse, DevoirResponse } from '../../core/models/api.models';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

const PDF_MAX = 25 * 1024 * 1024;
const MP4_MAX = 250 * 1024 * 1024;

@Component({
  selector: 'app-teacher-course-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, StatusChipComponent],
  template: `
    <ng-container *ngIf="course() as c">
      <div class="page-head">
        <div>
          <a routerLink="/teacher/courses" class="back">← {{ 'COURSES.BACK' | translate }}</a>
          <h1>{{ c.titre }}</h1>
          <p class="muted">{{ c.description || ('COURSES.NO_DESC' | translate) }}</p>
        </div>
        <div class="head-actions">
          <app-status-chip [label]="('STATUS.' + c.statut) | translate" [tone]="tone(c.statut)"></app-status-chip>
          <button class="btn btn-primary btn-sm" *ngIf="c.statut === 'DRAFT'" (click)="publish(c)" [disabled]="busy()">
            {{ 'COURSES.PUBLISH' | translate }}
          </button>
          <button class="btn btn-outline btn-sm" *ngIf="c.statut === 'PUBLISHED'" (click)="archive(c)" [disabled]="busy()">
            {{ 'COURSES.ARCHIVE' | translate }}
          </button>
        </div>
      </div>

      <div class="warn glass" *ngIf="c.statut === 'DRAFT' && !files().length">
        ⚠ {{ 'COURSES.PUBLISH_NO_FILES_WARN' | translate }}
      </div>

      <div class="grid-2">
        <section class="card glass">
          <header>
            <h2>{{ 'COURSES.MATERIALS' | translate }}</h2>
            <label class="btn btn-outline btn-sm upload">
              + {{ 'COURSES.UPLOAD' | translate }}
              <input type="file" (change)="onUpload($event)" hidden accept=".pdf,application/pdf,.mp4,video/mp4"/>
            </label>
          </header>
          <p class="muted small">{{ 'COURSES.UPLOAD_HINT' | translate }}</p>
          <div class="error" *ngIf="uploadErr()">{{ uploadErr() }}</div>
          <ul class="files">
            <li *ngFor="let f of files()">
              <span class="ftype" [class.mp4]="f.typeFichier === 'MP4'">{{ f.typeFichier }}</span>
              <div class="finfo">
                <strong>{{ f.titre }}</strong>
                <span class="muted">{{ humanSize(f.tailleOctets) }} · {{ f.dateUpload | date:'short' }}</span>
              </div>
              <button class="btn btn-danger btn-sm" (click)="deleteFile(f)">×</button>
            </li>
            <li class="empty" *ngIf="!files().length">{{ 'COURSES.NO_MATERIALS' | translate }}</li>
          </ul>
        </section>

        <section class="card glass">
          <header>
            <h2>{{ 'ASSIGNMENTS.TITLE' | translate }}</h2>
            <button class="btn btn-outline btn-sm" (click)="showAssign.set(!showAssign())">
              + {{ 'ASSIGNMENTS.NEW' | translate }}
            </button>
          </header>

          <form *ngIf="showAssign()" [formGroup]="assignForm" (ngSubmit)="createAssignment()" class="aform">
            <input class="input" formControlName="titre" [placeholder]="'ASSIGNMENTS.TITLE_LABEL' | translate"/>
            <textarea class="input" rows="2" formControlName="consigne" [placeholder]="'ASSIGNMENTS.CONSIGNE' | translate"></textarea>
            <div class="grid-input">
              <label>{{ 'ASSIGNMENTS.DATE_DEBUT' | translate }}<input class="input" type="datetime-local" formControlName="dateDebut"/></label>
              <label>{{ 'ASSIGNMENTS.DATE_FIN' | translate }}<input class="input" type="datetime-local" formControlName="dateFin"/></label>
              <label>{{ 'ASSIGNMENTS.NOTE_MAX' | translate }}<input class="input" type="number" min="0.01" max="20" step="0.5" formControlName="noteMax"/></label>
            </div>
            <button type="submit" class="btn btn-primary btn-sm" [disabled]="assignForm.invalid">{{ 'BUTTONS.SAVE' | translate }}</button>
          </form>

          <ul class="alist">
            <li *ngFor="let a of assignments()">
              <div>
                <strong>{{ a.titre }}</strong>
                <p class="muted small">{{ 'ASSIGNMENTS.DUE' | translate }} {{ a.dateFin | date:'short' }} · /{{ a.noteMax }}</p>
              </div>
              <a [routerLink]="['/teacher/assignments', a.id, 'submissions']" class="btn btn-outline btn-sm">
                {{ 'ASSIGNMENTS.SUBMISSIONS' | translate }}
              </a>
            </li>
            <li class="empty" *ngIf="!assignments().length">{{ 'ASSIGNMENTS.EMPTY' | translate }}</li>
          </ul>
        </section>
      </div>
    </ng-container>
  `,
  styles: [`
    .back { color: var(--color-primary); font-size:.85rem; text-decoration:none; }
    .page-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
    h1 { font-size:1.5rem; margin-top:6px; }
    .muted { color: var(--color-muted-foreground); font-size:.85rem; }
    .small { font-size:.78rem; }
    .head-actions { display:flex; gap:8px; align-items:center; }
    .warn { padding:12px 16px; margin-bottom:14px; border-radius:var(--radius); border:1px solid rgba(251,191,36,.4); color: var(--orange-500); }
    .grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
    @media (max-width:1100px) { .grid-2 { grid-template-columns:1fr; } }
    .card { padding:16px; }
    .card header { display:flex; justify-content:space-between; align-items:center; }
    .card h2 { font-size:1.05rem; }
    .upload { cursor:pointer; }
    .files, .alist { list-style:none; display:flex; flex-direction:column; gap:8px; margin-top:10px; }
    .files li { display:flex; align-items:center; gap:10px; padding:10px; border:1px dashed var(--color-border); border-radius:var(--radius); }
    .ftype { font-family: var(--font-display); font-weight:700; font-size:.7rem; padding:4px 8px; border-radius:6px; background:rgba(99,102,241,.14); color:var(--indigo-400); }
    .ftype.mp4 { background:rgba(139,92,246,.14); color: var(--violet-500); }
    .finfo { flex:1; display:flex; flex-direction:column; }
    .finfo strong { font-family: var(--font-display); font-size:.9rem; }
    .empty { color: var(--color-muted-foreground); font-size:.85rem; padding:16px; text-align:center; border:1px dashed var(--color-border); border-radius: var(--radius); }
    .aform { display:flex; flex-direction:column; gap:8px; padding:12px; margin-top:10px; border:1px dashed var(--color-border); border-radius: var(--radius); }
    .grid-input { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; }
    .grid-input label { display:flex; flex-direction:column; gap:4px; font-size:.78rem; color: var(--color-muted-foreground); }
    @media (max-width:780px) { .grid-input { grid-template-columns:1fr; } }
    .alist li { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px; border:1px dashed var(--color-border); border-radius: var(--radius); }
    .alist strong { font-family: var(--font-display); font-size:.92rem; }
    .error { color: var(--red-500); font-size:.85rem; margin-top:6px; }
  `],
})
export class TeacherCourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private courseSvc = inject(CourseService);
  private assignSvc = inject(AssignmentService);

  course = signal<CourseResponse | null>(null);
  files = signal<SupportResponse[]>([]);
  assignments = signal<DevoirResponse[]>([]);
  busy = signal(false);
  uploadErr = signal<string | null>(null);
  showAssign = signal(false);

  assignForm = this.fb.group({
    titre:     ['', [Validators.required]],
    consigne:  [''],
    dateDebut: ['', [Validators.required]],
    dateFin:   ['', [Validators.required]],
    noteMax:   [20, [Validators.required, Validators.min(0.01), Validators.max(20)]],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigateByUrl('/teacher/courses'); return; }
    this.refresh(id);
  }

  tone(s: string): 'success' | 'warn' | 'info' { return s === 'PUBLISHED' ? 'success' : s === 'ARCHIVED' ? 'info' : 'warn'; }
  humanSize(n: number): string {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  refresh(id: number): void {
    this.courseSvc.get(id).subscribe(c => this.course.set(c));
    this.courseSvc.files(id).subscribe(fs => this.files.set(fs));
    this.assignSvc.list(id).subscribe({ next: as => this.assignments.set(as), error: () => this.assignments.set([]) });
  }

  publish(c: CourseResponse): void {
    if (!this.files().length && !confirm('Publier sans aucun support pédagogique ?')) return;
    this.busy.set(true);
    this.courseSvc.publish(c.id).subscribe({
      next: u => { this.busy.set(false); this.course.set(u); },
      error: e => { this.busy.set(false); alert(e?.error?.message || 'Erreur'); },
    });
  }

  archive(c: CourseResponse): void {
    if (!confirm('Archiver ce cours ?')) return;
    this.busy.set(true);
    this.courseSvc.archive(c.id).subscribe({
      next: u => { this.busy.set(false); this.course.set(u); },
      error: e => { this.busy.set(false); alert(e?.error?.message || 'Erreur'); },
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
    if (!isPdf && !isMp4) { this.uploadErr.set('Format non supporté : PDF ou MP4 uniquement.'); return; }
    if (isPdf && file.size > PDF_MAX) { this.uploadErr.set('PDF trop volumineux (max 25 Mo).'); return; }
    if (isMp4 && file.size > MP4_MAX) { this.uploadErr.set('MP4 trop volumineux (max 250 Mo).'); return; }

    const c = this.course(); if (!c) return;
    this.busy.set(true);
    this.courseSvc.uploadFile(c.id, file, file.name).subscribe({
      next: f => { this.busy.set(false); this.files.update(fs => [...fs, f]); },
      error: e => {
        this.busy.set(false);
        const status = e?.status;
        if (status === 413) this.uploadErr.set('Fichier trop volumineux.');
        else if (status === 400) this.uploadErr.set('Format invalide ou requête malformée.');
        else this.uploadErr.set(e?.error?.message || 'Erreur lors du dépôt.');
      },
    });
  }

  deleteFile(f: SupportResponse): void {
    const c = this.course(); if (!c) return;
    if (!confirm('Supprimer ce support ?')) return;
    this.courseSvc.deleteFile(c.id, f.id).subscribe(() => this.files.update(fs => fs.filter(x => x.id !== f.id)));
  }

  createAssignment(): void {
    const c = this.course(); if (!c) return;
    if (this.assignForm.invalid) return;
    const v = this.assignForm.getRawValue();
    if (new Date(v.dateFin!) <= new Date(v.dateDebut!)) { alert('La date de fin doit être postérieure à la date de début.'); return; }
    this.assignSvc.create({
      courseId: c.id,
      titre: v.titre!,
      consigne: v.consigne || undefined,
      dateDebut: new Date(v.dateDebut!).toISOString(),
      dateFin:   new Date(v.dateFin!).toISOString(),
      noteMax: Number(v.noteMax),
    }).subscribe({
      next: () => { this.assignForm.reset({ noteMax: 20 }); this.showAssign.set(false); this.refresh(c.id); },
      error: e => alert(e?.error?.message || 'Erreur'),
    });
  }
}
