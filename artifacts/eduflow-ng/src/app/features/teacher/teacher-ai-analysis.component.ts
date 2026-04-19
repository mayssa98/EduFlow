import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AiService, AiAnalysisResult, AiPrediction } from '../../core/services/ai.service';
import { CourseService, Course } from '../../core/services/course.service';
import { RiskBadgeComponent, RiskLevel } from '../../shared/components/risk-badge/risk-badge.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { ICONS } from '../../shared/icons';

@Component({
  selector: 'app-teacher-ai-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RiskBadgeComponent, ProgressBarComponent, DecimalPipe],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'AI.TITLE' | translate }}</h1>
        <p class="muted">{{ 'AI.SUBTITLE' | translate }}</p>
      </div>
    </div>

    <section class="card toolbar">
      <label class="muted">{{ 'AI.SELECT_COURSE' | translate }}</label>
      <select class="input select" [ngModel]="selectedCourse()" (ngModelChange)="selectedCourse.set($event)">
        <option [ngValue]="null">{{ 'AI.PICK_PLACEHOLDER' | translate }}</option>
        <option *ngFor="let c of courses()" [ngValue]="c.id">{{ c.titre }}</option>
      </select>
      <button class="btn btn-primary" [disabled]="!selectedCourse() || loading()" (click)="runAnalysis()">
        <span *ngIf="loading()" class="spinner"></span>
        <span *ngIf="!loading()" [innerHTML]="iconSparkles"></span>
        {{ (loading() ? 'AI.RUNNING' : 'AI.RUN') | translate }}
      </button>
    </section>

    <div class="loading-center" *ngIf="loading()">
      <div class="spinner spinner-lg"></div>
    </div>

    <ng-container *ngIf="result() as res">
      <div class="fallback-banner" *ngIf="res.utiliseFallback">
        <span [innerHTML]="iconAlert"></span>
        {{ 'AI.FALLBACK' | translate }}
      </div>

      <div class="ai-grid fade-up">
        <!-- Predictions table -->
        <section class="card">
          <header class="card-head">
            <h2>{{ 'AI.RESULT_TITLE' | translate }}</h2>
            <span class="badge badge-info">{{ res.predictions.length }}</span>
          </header>

          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'AI.TH_STUDENT' | translate }}</th>
                  <th>{{ 'AI.TH_LEVEL' | translate }}</th>
                  <th>{{ 'AI.TH_FAIL_PROB' | translate }}</th>
                  <th>{{ 'AI.TH_FACTORS' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of res.predictions">
                  <td><strong>{{ p.etudiantNom }}</strong></td>
                  <td>
                    <app-risk-badge
                      [level]="riskLevel(p)"
                      [label]="('AI.LEVEL_' + p.niveauRisque) | translate">
                    </app-risk-badge>
                  </td>
                  <td class="prob-cell">
                    <app-progress-bar [value]="p.probabiliteEchec"></app-progress-bar>
                    <span class="muted small">{{ p.probabiliteEchec | number:'1.0-0' }}%</span>
                  </td>
                  <td class="muted small factors">{{ p.facteursCle }}</td>
                </tr>
                <tr *ngIf="res.predictions.length === 0">
                  <td colspan="4" class="center muted py-4">{{ 'AI.NO_DATA' | translate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Recommendations -->
        <section class="card">
          <header class="card-head">
            <h2>{{ 'AI.RECOMMENDATIONS' | translate }}</h2>
          </header>
          <div class="recommendations">
            <article class="rec-card" *ngFor="let r of res.recommandationsGlobales">
              <span class="rec-type">{{ r.type }}</span>
              <p class="rec-desc">{{ r.description }}</p>
            </article>
            <div class="empty-state" *ngIf="!res.recommandationsGlobales.length">
              {{ 'AI.NO_RECOS' | translate }}
            </div>
          </div>
        </section>
      </div>
    </ng-container>
  `,
  styles: [`
    .toolbar {
      display: flex; align-items: center; gap: 12px; padding: 14px 18px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .toolbar .muted { color: var(--color-muted-foreground); font-size: 0.85rem; }
    .select { min-width: 260px; flex: 1; max-width: 380px; }

    .fallback-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      background: rgba(251,191,36,0.1);
      border: 1px solid rgba(251,191,36,0.3);
      color: var(--amber-400);
      border-radius: var(--radius);
      margin-bottom: 16px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .ai-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; }
    @media (max-width: 1100px) { .ai-grid { grid-template-columns: 1fr; } }

    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .card-head h2 { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; }

    .table-scroll { overflow-x: auto; }
    .prob-cell { display: flex; align-items: center; gap: 10px; min-width: 150px; }
    .prob-cell app-progress-bar { flex: 1; }
    .small { font-size: 0.8rem; }
    .muted { color: var(--color-muted-foreground); }
    .factors { max-width: 260px; }
    .center { text-align: center; }
    .py-4 { padding: 2rem 0; }

    .recommendations { display: flex; flex-direction: column; gap: 10px; }
    .rec-card {
      padding: 14px;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-inline-start: 3px solid var(--indigo-400);
      border-radius: var(--radius);
    }
    .rec-type {
      display: inline-block;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.72rem;
      color: var(--indigo-400);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .rec-desc { font-size: 0.9rem; line-height: 1.5; }
  `],
})
export class TeacherAiAnalysisComponent implements OnInit {
  private aiSvc = inject(AiService);
  private crsSvc = inject(CourseService);
  private translate = inject(TranslateService);

  readonly iconSparkles = ICONS.sparkles;
  readonly iconAlert = ICONS.alert;

  courses = signal<Course[]>([]);
  selectedCourse = signal<number | null>(null);

  loading = signal(false);
  result = signal<AiAnalysisResult | null>(null);

  ngOnInit(): void {
    this.crsSvc.list().subscribe(res => {
      this.courses.set(res);
      if (res.length > 0) this.selectedCourse.set(res[0].id);
    });
  }

  riskLevel(p: AiPrediction): RiskLevel {
    if (p.niveauRisque === 'FAIBLE') return 'FAIBLE';
    if (p.niveauRisque === 'MOYEN') return 'MODERE';
    return 'ELEVE';
  }

  runAnalysis(): void {
    const cid = this.selectedCourse();
    if (!cid) return;
    this.loading.set(true);
    this.result.set(null);
    this.aiSvc.analyze(cid).subscribe({
      next: res => { this.result.set(res); this.loading.set(false); },
      error: err => {
        this.loading.set(false);
        alert(err?.error?.message || this.translate.instant('ERRORS.GENERIC'));
      },
    });
  }
}
