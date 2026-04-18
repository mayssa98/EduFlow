import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AssignmentService } from '../../core/services/api.services';
import { DevoirResponse, SoumissionResponse } from '../../core/models/api.models';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-teacher-submissions-grade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, StatusChipComponent],
  template: `
    <div class="page-head">
      <div>
        <a routerLink="/teacher/courses" class="back">← {{ 'COURSES.BACK' | translate }}</a>
        <h1>{{ 'GRADE.TITLE' | translate }}</h1>
        <p class="muted" *ngIf="assignment() as a">
          <strong>{{ a.titre }}</strong> · /{{ a.noteMax }} · {{ 'ASSIGNMENTS.DUE' | translate }} {{ a.dateFin | date:'short' }}
        </p>
      </div>
    </div>

    <div class="grid">
      <article class="card glass" *ngFor="let s of submissions()">
        <header>
          <div class="meta">
            <strong>{{ s.etudiantNom }}</strong>
            <span class="muted">{{ 'GRADE.SUBMITTED_ON' | translate }} {{ s.dateSoumission | date:'short' }}</span>
          </div>
          <app-status-chip [label]="('STATUS.' + s.statut) | translate" [tone]="tone(s.statut)"></app-status-chip>
        </header>

        <p class="content" *ngIf="s.contenuTexte">{{ s.contenuTexte }}</p>
        <a *ngIf="s.cheminFichier" class="link" [href]="fileUrl(s.id)" target="_blank" rel="noopener">📎 {{ 'GRADE.OPEN_FILE' | translate }}</a>

        <form *ngIf="s.statut !== 'GRADED'" (ngSubmit)="grade(s)" class="grade">
          <input class="input" type="number" min="0" max="20" step="0.25"
                 [value]="grades()[s.id]?.note ?? ''"
                 (input)="setGrade(s.id, 'note', $any($event.target).value)"
                 [placeholder]="'GRADE.MARK' | translate"/>
          <textarea class="input" rows="2"
                    [value]="grades()[s.id]?.commentaire ?? ''"
                    (input)="setGrade(s.id, 'commentaire', $any($event.target).value)"
                    [placeholder]="'GRADE.COMMENT' | translate"></textarea>
          <button class="btn btn-primary btn-sm" [disabled]="busy() === s.id">
            <span class="spinner" *ngIf="busy() === s.id"></span>{{ 'GRADE.SAVE' | translate }}
          </button>
          <p class="error" *ngIf="errors()[s.id]">{{ errors()[s.id] }}</p>
        </form>

        <div class="graded" *ngIf="s.statut === 'GRADED'">
          <strong>{{ 'GRADE.NOTED' | translate }} : {{ s.note }}/{{ assignment()?.noteMax || 20 }}</strong>
          <p class="muted" *ngIf="s.commentaire">{{ s.commentaire }}</p>
          <p class="muted small">{{ s.dateNotation | date:'short' }}</p>
        </div>
      </article>

      <div class="card glass empty" *ngIf="!submissions().length">
        {{ 'GRADE.EMPTY' | translate }}
      </div>
    </div>
  `,
  styles: [`
    .back { color: var(--color-primary); font-size:.85rem; text-decoration:none; }
    h1 { font-size:1.5rem; margin-top:6px; }
    .muted { color: var(--color-muted-foreground); font-size:.85rem; }
    .small { font-size:.78rem; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap:14px; }
    .card { padding:16px; display:flex; flex-direction:column; gap:10px; }
    header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    .meta { display:flex; flex-direction:column; }
    .meta strong { font-family: var(--font-display); font-size:1rem; }
    .content { padding:10px; background: var(--color-muted); border-radius: var(--radius); font-size:.88rem; max-height: 160px; overflow:auto; }
    .link { color: var(--color-primary); font-size:.88rem; text-decoration:none; }
    .grade { display:flex; flex-direction:column; gap:8px; padding-top:8px; border-top:1px dashed var(--color-border); }
    .graded { padding:10px; background: rgba(34,197,94,.08); border:1px solid rgba(34,197,94,.3); border-radius: var(--radius); }
    .error { color: var(--red-500); font-size:.85rem; }
    .empty { grid-column: 1 / -1; padding:36px; text-align:center; color: var(--color-muted-foreground); }
  `],
})
export class TeacherSubmissionsGradeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(AssignmentService);

  assignment = signal<DevoirResponse | null>(null);
  submissions = signal<SoumissionResponse[]>([]);
  grades = signal<Record<number, { note?: string; commentaire?: string }>>({});
  busy = signal<number | null>(null);
  errors = signal<Record<number, string>>({});

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    this.svc.get(id).subscribe(a => this.assignment.set(a));
    this.svc.submissions(id).subscribe(ss => this.submissions.set(ss));
  }

  tone(s: string): 'success' | 'warn' | 'danger' | 'info' {
    return s === 'GRADED' ? 'success' : s === 'LATE' ? 'danger' : s === 'SUBMITTED' ? 'info' : 'warn';
  }

  fileUrl(submissionId: number): string { return this.svc.submissionFileUrl(submissionId); }

  setGrade(id: number, field: 'note' | 'commentaire', v: string) {
    this.grades.update(g => ({ ...g, [id]: { ...g[id], [field]: v } }));
  }

  grade(s: SoumissionResponse): void {
    const g = this.grades()[s.id] ?? {};
    const note = Number(g.note);
    if (isNaN(note) || note < 0 || note > (this.assignment()?.noteMax ?? 20)) {
      this.errors.update(e => ({ ...e, [s.id]: `Note invalide (0 à ${this.assignment()?.noteMax ?? 20}).` }));
      return;
    }
    this.busy.set(s.id);
    this.errors.update(e => ({ ...e, [s.id]: '' }));
    this.svc.grade(s.id, { note, commentaire: g.commentaire || undefined }).subscribe({
      next: u => {
        this.busy.set(null);
        this.submissions.update(list => list.map(x => x.id === s.id ? u : x));
      },
      error: e => {
        this.busy.set(null);
        const code = e?.error?.code;
        const msg = code === 'ALREADY_GRADED' ? 'Cette soumission est déjà notée.'
                  : code === 'NOTE_OUT_OF_RANGE' ? 'Note hors plage.'
                  : (e?.error?.message || 'Erreur');
        this.errors.update(er => ({ ...er, [s.id]: msg }));
      },
    });
  }
}
