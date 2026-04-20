import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AssignmentService, Submission } from '../../core/services/assignment.service';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { LineChartComponent } from '../../shared/components/charts/line-chart.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { APP_ICONS } from '../../shared/icons/app-icons';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [
    CommonModule, TranslateModule,
    KpiCardComponent, ChartCardComponent, LineChartComponent, ProgressBarComponent,
  ],
  template: `
    <div class="grades-shell">
      <h1 class="page-title">
        <span class="title-icon" [innerHTML]="icons.chart"></span>
        Releve de notes et resultats
      </h1>

      <div class="kpi-grid">
        <app-kpi-card [label]="'Total soumissions'" [value]="submissions().length" [trend]="0" [icon]="icons.clipboard"></app-kpi-card>
        <app-kpi-card [label]="'Notes'" [value]="gradedCount()" [trend]="0" [icon]="icons.checkCircle"></app-kpi-card>
        <app-kpi-card [label]="'En attente'" [value]="pendingCount()" [trend]="0" [icon]="icons.clock"></app-kpi-card>
        <app-kpi-card [label]="'Moyenne generale'" [value]="average()" [suffix]="'/20'" [trend]="0" [icon]="icons.award"></app-kpi-card>
      </div>

      <div class="grid-2">
        <app-chart-card [title]="'Évolution des notes'">
          <app-line-chart [labels]="gradeLabels()" [values]="gradeValues()" color="#6366f1"></app-line-chart>
        </app-chart-card>

        <app-chart-card [title]="'Récapitulatif'" [fluid]="true">
          <div class="summary-list">
            <div class="summary-item" *ngFor="let s of submissions()">
              <div class="summary-left">
                <div class="summary-icon" [class.graded]="s.note != null" [innerHTML]="s.note != null ? icons.checkCircle : icons.clock"></div>
                <div>
                  <strong>{{ s.devoirTitre }}</strong>
                  <p class="muted small">Soumis le {{ formatDate(s.dateSoumission) }}</p>
                </div>
              </div>
              <div class="summary-right" *ngIf="s.note != null">
                <span class="grade" [class.failed]="s.note < 10" [class.passed]="s.note >= 10">
                  {{ s.note }}/20
                </span>
              </div>
              <div class="summary-right pending" *ngIf="s.note == null">
                En attente
              </div>
            </div>
            <div class="empty-state" *ngIf="submissions().length === 0">
              Aucune soumission pour le moment.
            </div>
          </div>
        </app-chart-card>
      </div>

      <!-- Performance by assignment -->
      <app-chart-card [title]="'Performance par devoir'" [fluid]="true">
        <div class="perf-grid">
          <div class="perf-item" *ngFor="let s of gradedSubmissions()">
            <div class="perf-header">
              <strong>{{ s.devoirTitre }}</strong>
              <span class="grade" [class.failed]="(s.note ?? 0) < 10" [class.passed]="(s.note ?? 0) >= 10">
                {{ s.note }}/20
              </span>
            </div>
            <app-progress-bar [value]="((s.note ?? 0) / 20) * 100" [label]="s.devoirTitre"></app-progress-bar>
            <p class="muted small comment" *ngIf="s.commentaire">💬 {{ s.commentaire }}</p>
          </div>
        </div>
      </app-chart-card>
    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .grades-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .page-title { display: flex; align-items: center; gap: 10px; font-size: 1.5rem; margin: 0; color: var(--text); }
    .title-icon { display: inline-flex; align-items: center; justify-content: center; color: #a5b4fc; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 1000px) { .grid-2 { grid-template-columns: 1fr; } }

    .summary-list { display: flex; flex-direction: column; gap: 12px; }
    .summary-item {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 12px; border: 1px solid rgba(99,102,241,0.1);
      border-radius: 10px; transition: background 0.15s;
    }
    .summary-item:hover { background: rgba(99,102,241,0.04); }
    .summary-left { display: flex; align-items: center; gap: 12px; }
    .summary-icon {
      width: 36px; height: 36px;
      display: inline-flex; align-items: center; justify-content: center;
      color: #fcd34d;
      background: rgba(251,191,36,0.08);
      border: 1px solid rgba(251,191,36,0.16);
      border-radius: 12px;
      flex-shrink: 0;
    }
    .summary-icon.graded {
      color: #86efac;
      background: rgba(34,197,94,0.08);
      border-color: rgba(34,197,94,0.18);
    }
    .summary-icon :is(svg) { display: block; }
    .summary-left strong { font-size: 0.92rem; color: var(--text); }
    .muted { color: var(--muted); }
    .small { font-size: 0.8rem; }
    .grade { font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; }
    .grade.passed { color: #86efac; }
    .grade.failed { color: #fca5a5; }
    .pending { font-size: 0.85rem; color: #fde68a; font-weight: 600; }

    .perf-grid { display: flex; flex-direction: column; gap: 16px; }
    .perf-item { display: flex; flex-direction: column; gap: 6px; }
    .perf-header { display: flex; justify-content: space-between; align-items: center; }
    .perf-header strong { font-size: 0.9rem; color: var(--text); }
    .comment { margin-top: 4px; font-style: italic; }
    .empty-state { padding: 28px; text-align: center; color: var(--muted); font-style: italic; }
  `],
})
export class StudentGradesComponent implements OnInit {
  private asgSvc = inject(AssignmentService);
  readonly icons = APP_ICONS;
  submissions = signal<Submission[]>([]);

  ngOnInit(): void {
    this.asgSvc.mySubmissions().subscribe({
      next: subs => {
        subs.sort((a, b) => new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime());
        this.submissions.set(subs);
      },
      error: () => this.submissions.set([]),
    });
  }

  gradedSubmissions(): Submission[] {
    return this.submissions().filter(s => s.note != null);
  }

  gradedCount(): number { return this.gradedSubmissions().length; }
  pendingCount(): number { return this.submissions().filter(s => s.note == null).length; }

  average(): number {
    const graded = this.gradedSubmissions();
    if (graded.length === 0) return 0;
    const sum = graded.reduce((acc, s) => acc + (s.note ?? 0), 0);
    return Math.round((sum / graded.length) * 10) / 10;
  }

  gradeLabels(): string[] {
    return this.gradedSubmissions().map((_, i) => `D${i + 1}`);
  }

  gradeValues(): number[] {
    return this.gradedSubmissions().map(s => s.note ?? 0);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
