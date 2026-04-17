import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { LineChartComponent } from '../../shared/components/charts/line-chart.component';
import { DonutChartComponent } from '../../shared/components/charts/donut-chart.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

interface CourseProgress { name: string; progress: number; teacher: string; }
interface Deadline       { title: string; course: string; due: string; urgent: boolean; }

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule, TranslateModule,
    KpiCardComponent, ChartCardComponent,
    LineChartComponent, DonutChartComponent,
    ProgressBarComponent, StatusChipComponent,
  ],
  template: `
    <h1 class="page-title">{{ 'STUDENT.TITLE' | translate }}</h1>

    <div class="kpi-grid">
      <app-kpi-card [label]="'STUDENT.KPI_ENROLLED' | translate" [value]="6"  [trend]="1"></app-kpi-card>
      <app-kpi-card [label]="'STUDENT.KPI_DONE' | translate"     [value]="14" [trend]="3"></app-kpi-card>
      <app-kpi-card [label]="'STUDENT.KPI_OVERDUE' | translate"  [value]="2"  [trend]="-1"></app-kpi-card>
      <app-kpi-card [label]="'STUDENT.KPI_AVG_GRADE' | translate" [value]="14.2" [suffix]="'/20'" [trend]="0.5"></app-kpi-card>
    </div>

    <div class="grid-2">
      <app-chart-card [title]="'STUDENT.COURSE_PROGRESS' | translate">
        <ul class="cp">
          <li *ngFor="let c of courses">
            <header>
              <strong>{{ c.name }}</strong>
              <span class="muted">{{ c.teacher }}</span>
            </header>
            <app-progress-bar [value]="c.progress" [label]="c.name"></app-progress-bar>
            <small>{{ c.progress }}%</small>
          </li>
        </ul>
      </app-chart-card>

      <app-chart-card [title]="'STUDENT.ASSIGNMENT_STATUS' | translate">
        <app-donut-chart [slices]="statusSlices" [centerLabel]="'STUDENT.ASSIGNMENT_STATUS' | translate"></app-donut-chart>
      </app-chart-card>
    </div>

    <div class="grid-2">
      <app-chart-card [title]="'STUDENT.GRADE_TREND' | translate">
        <app-line-chart [labels]="gradeLabels" [values]="gradeTrend" color="#6366f1"></app-line-chart>
      </app-chart-card>

      <app-chart-card [title]="'STUDENT.UPCOMING_DEADLINES' | translate" [fluid]="true">
        <ul class="deadlines">
          <li *ngFor="let d of deadlines" [class.urgent]="d.urgent">
            <div>
              <strong>{{ d.title }}</strong>
              <p class="muted">{{ d.course }}</p>
            </div>
            <div class="due">
              <app-status-chip [label]="d.due" [tone]="d.urgent ? 'danger' : 'info'"></app-status-chip>
            </div>
          </li>
        </ul>
      </app-chart-card>
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.5rem; margin-bottom: 18px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
    @media (max-width: 1000px) { .grid-2 { grid-template-columns: 1fr; } }
    .cp { list-style: none; display: flex; flex-direction: column; gap: 14px; }
    .cp li { display: flex; flex-direction: column; gap: 6px; }
    .cp header { display: flex; justify-content: space-between; align-items: baseline; }
    .cp strong { font-family: var(--font-display); font-size: 0.95rem; }
    .cp small  { color: var(--color-muted-foreground); font-size: 0.78rem; align-self: end; }
    .muted { color: var(--color-muted-foreground); font-size: 0.8rem; }
    .deadlines { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .deadlines li {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px; border: 1px dashed var(--color-border); border-radius: var(--radius);
    }
    .deadlines li.urgent { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.04); }
    .deadlines strong { font-family: var(--font-display); font-size: 0.92rem; }
  `],
})
export class StudentDashboardComponent {
  courses: CourseProgress[] = [
    { name: 'Algorithms 101',  teacher: 'Prof. Hadj',   progress: 78 },
    { name: 'Web Engineering', teacher: 'Prof. Saidi',  progress: 54 },
    { name: 'Databases',       teacher: 'Prof. Khelifa', progress: 42 },
    { name: 'Mathematics',     teacher: 'Prof. Bouaziz', progress: 91 },
    { name: 'AI Foundations',  teacher: 'Prof. Rezzag',  progress: 22 },
  ];
  statusSlices = [
    { label: 'Completed', value: 14, color: '#22c55e' },
    { label: 'Pending',   value: 5,  color: '#fbbf24' },
    { label: 'Overdue',   value: 2,  color: '#ef4444' },
  ];
  gradeLabels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
  gradeTrend  = [11.5, 12.2, 12.8, 13.4, 13.9, 14.2];
  deadlines: Deadline[] = [
    { title: 'Sorting algorithms TP',  course: 'Algorithms 101', due: 'in 1 day',  urgent: true  },
    { title: 'Database normalisation', course: 'Databases',      due: 'in 4 days', urgent: false },
    { title: 'Final project',          course: 'Web Engineering',due: 'in 12 days', urgent: false },
  ];
}
