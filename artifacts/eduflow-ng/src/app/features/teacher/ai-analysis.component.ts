import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { CourseService, AiAnalysisService } from '../../core/services/api.services';
import { CourseResponse, AnalyseResponse, RiskLevel } from '../../core/models/api.models';
import { RiskBadgeComponent } from '../../shared/components/risk-badge/risk-badge.component';

@Component({
  selector: 'app-teacher-ai-analysis',
  standalone: true,
  imports: [CommonModule, TranslateModule, RiskBadgeComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'AI.TITLE' | translate }}</h1>
        <p class="muted">{{ 'AI.SUBTITLE' | translate }}</p>
      </div>
    </div>

    <div class="card glass control">
      <label class="lbl">{{ 'AI.SELECT_COURSE' | translate }}</label>
      <div class="ctrl-row">
        <select class="input" [value]="coursId() ?? ''" (change)="setCourse($any($event.target).value)">
          <option value="">{{ 'AI.PICK_PLACEHOLDER' | translate }}</option>
          <option *ngFor="let c of courses()" [value]="c.id">{{ c.titre }}</option>
        </select>
        <button class="btn btn-primary" (click)="analyse()" [disabled]="!coursId() || busy()">
          <span class="spinner" *ngIf="busy()"></span>
          ⚡ {{ 'AI.RUN' | translate }}
        </button>
      </div>
      <p class="error" *ngIf="error()">{{ error() }}</p>
    </div>

    <ng-container *ngIf="result() as r">
      <div class="card glass summary">
        <div class="left">
          <h2>{{ 'AI.RESULT_TITLE' | translate }}</h2>
          <p class="muted">{{ 'AI.ANALYSED_ON' | translate }} {{ r.dateAnalyse | date:'medium' }} · {{ r.fournisseur }}</p>
        </div>
        <span class="fallback" *ngIf="r.utiliseFallback">⚠ {{ 'AI.FALLBACK' | translate }}</span>
      </div>

      <p class="card glass">{{ r.summary }}</p>

      <div class="legend">
        <span class="lg lg-FAIBLE">{{ 'AI.LOW' | translate }}</span>
        <span class="lg lg-MODERE">{{ 'AI.MEDIUM' | translate }}</span>
        <span class="lg lg-ELEVE">{{ 'AI.HIGH' | translate }}</span>
      </div>

      <div class="grid">
        <article class="card glass risk" *ngFor="let s of r.risques" [attr.data-level]="s.niveauRisque">
          <header>
            <strong>{{ s.prenom }} {{ s.nom }}</strong>
            <app-risk-badge [level]="s.niveauRisque" [label]="('AI.LEVEL_' + s.niveauRisque) | translate"></app-risk-badge>
          </header>
          <div class="score">{{ 'AI.SCORE' | translate }} <strong>{{ s.score | number:'1.1-1' }}</strong></div>
          <p class="just">{{ s.justification }}</p>
          <ul class="reco" *ngIf="s.recommandations?.length">
            <li *ngFor="let r of s.recommandations">→ {{ r }}</li>
          </ul>
        </article>

        <div class="card glass empty" *ngIf="!r.risques.length">
          {{ 'AI.NO_DATA' | translate }}
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    h1 { font-size:1.5rem; }
    .muted { color: var(--color-muted-foreground); font-size:.85rem; margin-bottom:18px; }
    .control { padding:16px; margin-bottom:14px; }
    .lbl { font-size:.78rem; text-transform:uppercase; color: var(--color-muted-foreground); }
    .ctrl-row { display:flex; gap:10px; margin-top:6px; flex-wrap:wrap; }
    .ctrl-row .input { flex:1; max-width:420px; }
    .summary { display:flex; justify-content:space-between; align-items:center; padding:16px; margin-bottom:10px; }
    .summary h2 { font-size:1.1rem; }
    .fallback { font-family: var(--font-display); font-weight:700; font-size:.78rem; padding:4px 10px; border-radius:999px; background: rgba(251,191,36,.14); color: var(--orange-500); border:1px solid rgba(251,191,36,.4); }
    .legend { display:flex; gap:10px; margin:14px 0; flex-wrap:wrap; }
    .lg { font-family: var(--font-display); font-weight:600; font-size:.78rem; padding:4px 12px; border-radius:999px; }
    .lg-FAIBLE { background: rgba(34,197,94,.14); color: var(--green-500); }
    .lg-MODERE { background: rgba(251,191,36,.14); color: var(--orange-500); }
    .lg-ELEVE  { background: rgba(239,68,68,.14); color: var(--red-500); }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:14px; }
    .risk { padding:14px; display:flex; flex-direction:column; gap:8px; border-left:4px solid transparent; }
    .risk[data-level="FAIBLE"] { border-left-color: var(--green-500); }
    .risk[data-level="MODERE"] { border-left-color: var(--orange-500); }
    .risk[data-level="ELEVE"]  { border-left-color: var(--red-500); }
    .risk header { display:flex; justify-content:space-between; align-items:center; }
    .risk strong { font-family: var(--font-display); font-size:.95rem; }
    .score { font-size:.85rem; color: var(--color-muted-foreground); }
    .just { font-size:.85rem; }
    .reco { list-style:none; display:flex; flex-direction:column; gap:4px; font-size:.82rem; padding-left:8px; border-left:2px dashed var(--color-border); }
    .empty { grid-column: 1 / -1; padding:24px; text-align:center; color: var(--color-muted-foreground); }
    .error { color: var(--red-500); font-size:.85rem; margin-top:8px; }
  `],
})
export class TeacherAiAnalysisComponent implements OnInit {
  private courseSvc = inject(CourseService);
  private aiSvc = inject(AiAnalysisService);

  courses = signal<CourseResponse[]>([]);
  coursId = signal<number | null>(null);
  result = signal<AnalyseResponse | null>(null);
  busy = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.courseSvc.list({ mine: true }).subscribe({
      next: cs => this.courses.set(cs),
      error: () => this.courses.set([]),
    });
  }

  setCourse(v: string): void { this.coursId.set(v ? Number(v) : null); }

  analyse(): void {
    const id = this.coursId(); if (!id) return;
    this.busy.set(true); this.error.set(null);
    this.aiSvc.analyseCourse(id).subscribe({
      next: r => { this.busy.set(false); this.result.set(r); },
      error: e => {
        this.busy.set(false);
        const code = e?.error?.code;
        if (code === 'NO_DATA') this.error.set('Pas de données suffisantes pour analyser ce cours.');
        else if (e?.status === 504 || code === 'TIMEOUT') this.error.set('L\'analyse a expiré (15 s). Réessayez plus tard.');
        else this.error.set(e?.error?.message || 'Erreur lors de l\'analyse.');
      },
    });
  }

  trackByLevel(_: number, level: RiskLevel) { return level; }
}
