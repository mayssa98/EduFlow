import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AssignmentService } from '../../core/services/api.services';
import { DevoirResponse, SoumissionResponse } from '../../core/models/api.models';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, StatusChipComponent],
  template: `
    <div class="page-head">
      <h1>{{ 'ASSIGNMENTS.MINE' | translate }}</h1>
      <p class="muted">{{ 'ASSIGNMENTS.MINE_SUBTITLE' | translate }}</p>
    </div>

    <h2 class="section">{{ 'ASSIGNMENTS.ACTIVE' | translate }}</h2>
    <div class="grid">
      <article class="card glass dev" *ngFor="let d of active()" [class.urgent]="hoursLeft(d) < 24">
        <header>
          <strong>{{ d.titre }}</strong>
          <app-status-chip *ngIf="mySub(d) as s" [label]="('STATUS.' + s.statut) | translate" [tone]="tone(s.statut)"></app-status-chip>
        </header>
        <p class="muted">{{ d.coursTitre }} · /{{ d.noteMax }}</p>
        <p class="cd"><strong>{{ formatTimeLeft(d) }}</strong></p>
        <p class="consigne" *ngIf="d.consigne">{{ d.consigne }}</p>

        <details class="sub">
          <summary>📤 {{ mySub(d) ? ('ASSIGNMENTS.RESUBMIT' | translate) : ('ASSIGNMENTS.SUBMIT' | translate) }}</summary>
          <ng-container *ngIf="canSubmit(d)">
            <textarea class="input" rows="3" [value]="texts()[d.id] || ''"
                      (input)="setText(d.id, $any($event.target).value)"
                      [placeholder]="'ASSIGNMENTS.CONTENT' | translate"></textarea>
            <label class="file-lbl">
              <input type="file" accept="application/pdf" hidden
                     (change)="setFile(d.id, $any($event.target).files?.[0])"/>
              📎 {{ files()[d.id]?.name || ('ASSIGNMENTS.ATTACH_PDF' | translate) }}
            </label>
            <p class="error" *ngIf="errors()[d.id]">{{ errors()[d.id] }}</p>
            <button class="btn btn-primary btn-sm" (click)="submit(d)" [disabled]="busy() === d.id">
              <span class="spinner" *ngIf="busy() === d.id"></span>{{ 'ASSIGNMENTS.SEND' | translate }}
            </button>
          </ng-container>
          <p *ngIf="!canSubmit(d)" class="muted">
            {{ mySub(d)?.statut === 'GRADED' ? ('ASSIGNMENTS.LOCKED_GRADED' | translate) : ('ASSIGNMENTS.LOCKED_PAST' | translate) }}
          </p>
        </details>

        <div class="grade-block" *ngIf="mySub(d) as s">
          <span *ngIf="s.statut === 'GRADED'"><strong>{{ s.note }}/{{ d.noteMax }}</strong> · {{ s.commentaire || ('ASSIGNMENTS.NO_COMMENT' | translate) }}</span>
        </div>
      </article>

      <div class="card glass empty" *ngIf="!active().length">{{ 'ASSIGNMENTS.NONE_ACTIVE' | translate }}</div>
    </div>

    <h2 class="section">{{ 'ASSIGNMENTS.PAST' | translate }}</h2>
    <div class="grid">
      <article class="card glass dev past" *ngFor="let d of past()">
        <header>
          <strong>{{ d.titre }}</strong>
          <app-status-chip *ngIf="mySub(d) as s" [label]="('STATUS.' + s.statut) | translate" [tone]="tone(s.statut)"></app-status-chip>
        </header>
        <p class="muted">{{ d.coursTitre }} · {{ d.dateFin | date:'short' }}</p>
        <p *ngIf="mySub(d) as s">
          <strong *ngIf="s.statut === 'GRADED'">{{ s.note }}/{{ d.noteMax }}</strong>
          <span *ngIf="s.commentaire" class="muted small"> · {{ s.commentaire }}</span>
        </p>
      </article>
      <div class="card glass empty" *ngIf="!past().length">{{ 'ASSIGNMENTS.NONE_PAST' | translate }}</div>
    </div>
  `,
  styles: [`
    h1 { font-size:1.5rem; }
    .muted { color: var(--color-muted-foreground); font-size:.85rem; }
    .small { font-size:.78rem; }
    .page-head { margin-bottom:14px; }
    .section { font-size:1.05rem; margin: 18px 0 10px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:14px; }
    .dev { padding:16px; display:flex; flex-direction:column; gap:8px; border-left:4px solid transparent; }
    .dev.urgent { border-left-color: var(--red-500); }
    .dev.past { opacity:.85; }
    .dev header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    .dev strong { font-family: var(--font-display); font-size:1rem; }
    .cd { font-family: var(--font-display); font-size:.95rem; }
    .consigne { font-size:.85rem; color: var(--color-muted-foreground); }
    .sub summary { cursor:pointer; font-size:.85rem; padding:6px 0; color: var(--color-primary); }
    .sub textarea, .sub .file-lbl { margin-top:6px; }
    .file-lbl { display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px dashed var(--color-border); border-radius: var(--radius); cursor:pointer; font-size:.85rem; }
    .grade-block { padding:8px; border-top:1px dashed var(--color-border); margin-top:6px; }
    .empty { grid-column: 1 / -1; padding:24px; text-align:center; color: var(--color-muted-foreground); }
    .error { color: var(--red-500); font-size:.85rem; }
  `],
})
export class StudentAssignmentsComponent implements OnInit, OnDestroy {
  private svc = inject(AssignmentService);

  assignments = signal<DevoirResponse[]>([]);
  submissions = signal<SoumissionResponse[]>([]);
  texts = signal<Record<number, string>>({});
  files = signal<Record<number, File | null>>({});
  busy = signal<number | null>(null);
  errors = signal<Record<number, string>>({});
  now = signal(Date.now());
  private timer: any;

  ngOnInit(): void {
    this.svc.myAssignments().subscribe({ next: a => this.assignments.set(a), error: () => this.assignments.set([]) });
    this.svc.mySubmissions().subscribe({ next: s => this.submissions.set(s), error: () => this.submissions.set([]) });
    this.timer = setInterval(() => this.now.set(Date.now()), 1000);
  }
  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  active() { return this.assignments().filter(d => new Date(d.dateFin).getTime() > this.now() || (this.mySub(d) && this.mySub(d)!.statut !== 'GRADED')); }
  past()   { return this.assignments().filter(d => !this.active().includes(d)); }

  mySub(d: DevoirResponse): SoumissionResponse | undefined { return this.submissions().find(s => s.devoirId === d.id); }
  hoursLeft(d: DevoirResponse): number { return (new Date(d.dateFin).getTime() - this.now()) / 3_600_000; }

  formatTimeLeft(d: DevoirResponse): string {
    const ms = new Date(d.dateFin).getTime() - this.now();
    if (ms <= 0) return 'Échéance dépassée';
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    if (days > 0) return `Dans ${days}j ${hours}h`;
    if (hours > 0) return `Dans ${hours}h ${mins}min`;
    const secs = Math.floor((ms % 60_000) / 1000);
    return `Dans ${mins}min ${secs}s`;
  }

  canSubmit(d: DevoirResponse): boolean {
    const sub = this.mySub(d);
    if (sub?.statut === 'GRADED') return false;
    return new Date(d.dateFin).getTime() > this.now();
  }

  tone(s: string): 'success' | 'warn' | 'danger' | 'info' {
    return s === 'GRADED' ? 'success' : s === 'LATE' ? 'danger' : s === 'SUBMITTED' ? 'info' : 'warn';
  }

  setText(id: number, v: string)  { this.texts.update(t => ({ ...t, [id]: v })); }
  setFile(id: number, f: File | undefined) { this.files.update(m => ({ ...m, [id]: f ?? null })); }

  submit(d: DevoirResponse): void {
    if (!this.canSubmit(d)) { this.errors.update(e => ({ ...e, [d.id]: 'Soumission impossible.' })); return; }
    const text = this.texts()[d.id];
    const file = this.files()[d.id];
    if ((!text || !text.trim()) && !file) { this.errors.update(e => ({ ...e, [d.id]: 'Veuillez saisir une réponse ou joindre un PDF.' })); return; }
    this.busy.set(d.id);
    this.errors.update(e => ({ ...e, [d.id]: '' }));
    this.svc.submit(d.id, text, file).subscribe({
      next: s => {
        this.busy.set(null);
        this.submissions.update(list => {
          const i = list.findIndex(x => x.devoirId === d.id);
          if (i >= 0) { const c = [...list]; c[i] = s; return c; }
          return [...list, s];
        });
      },
      error: e => {
        this.busy.set(null);
        const code = e?.error?.code;
        const msg =
          code === 'DEADLINE_PAST'   ? 'Date limite dépassée.' :
          code === 'INVALID_MIME'    ? 'Format invalide (PDF uniquement).' :
          code === 'FILE_TOO_LARGE'  ? 'Fichier trop volumineux.' :
          code === 'ALREADY_GRADED'  ? 'Cette soumission est déjà notée.' :
          (e?.error?.message || 'Erreur lors de la soumission.');
        this.errors.update(er => ({ ...er, [d.id]: msg }));
      },
    });
  }
}
