import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { HBarChartComponent, HBarRow } from '../../shared/components/charts/hbar-chart.component';
import { AreaChartComponent } from '../../shared/components/charts/area-chart.component';
import { LineChartComponent } from '../../shared/components/charts/line-chart.component';
import { ActivityFeedComponent, ActivityItem } from '../../shared/components/activity-feed/activity-feed.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { API_BASE } from '../../core/services/auth.service';
import { APP_ICONS } from '../../shared/icons/app-icons';

interface TeacherStats {
  myCourses?: number;
  publishedCourses?: number;
  totalStudents?: number;
  averageGrade?: number;
  pendingGradings?: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule, TranslateModule,
    KpiCardComponent, ChartCardComponent,
    HBarChartComponent, AreaChartComponent, LineChartComponent,
    ActivityFeedComponent, StatusChipComponent,
  ],
  template: `
    <h1 class="page-title">{{ 'TEACHER.TITLE' | translate }}</h1>

    <div class="kpi-grid">
      <app-kpi-card [label]="'TEACHER.KPI_COURSES' | translate"     [value]="stats()?.myCourses ?? 0"        [trend]="2" [icon]="icons.book"></app-kpi-card>
      <app-kpi-card [label]="'TEACHER.KPI_PUBLISHED' | translate"   [value]="stats()?.publishedCourses ?? 0" [trend]="1" [icon]="icons.rocket"></app-kpi-card>
      <app-kpi-card [label]="'TEACHER.KPI_STUDENTS' | translate"    [value]="stats()?.totalStudents ?? 0"    [trend]="9" [icon]="icons.users"></app-kpi-card>
      <app-kpi-card [label]="'TEACHER.KPI_AVG_GRADE' | translate"   [value]="stats()?.averageGrade ?? 0"     [suffix]="'/20'" [trend]="0.4" [icon]="icons.award"></app-kpi-card>
      <app-kpi-card [label]="'TEACHER.KPI_PENDING' | translate"     [value]="stats()?.pendingGradings ?? 0"  [trend]="-2" [icon]="icons.clipboard"></app-kpi-card>
    </div>

    <div class="grid-2">
      <app-chart-card [title]="'TEACHER.ENROLLMENT_VS_COMPLETION' | translate">
        <app-hbar-chart [rows]="enrollmentRows" [primaryLabel]="'TEACHER.ENROLLED' | translate" [secondaryLabel]="'TEACHER.COMPLETED' | translate"></app-hbar-chart>
      </app-chart-card>
      <app-chart-card [title]="'TEACHER.SUBMISSIONS_TREND' | translate">
        <app-area-chart [labels]="weekLabels" [values]="submissionTrend" color="#8b5cf6"></app-area-chart>
      </app-chart-card>
    </div>

    <div class="grid-2">
      <app-chart-card [title]="'TEACHER.GRADE_AVERAGE_TREND' | translate">
        <app-line-chart [labels]="gradeLabels" [values]="gradeTrend" color="#2dd4bf"></app-line-chart>
      </app-chart-card>
      <app-chart-card [title]="'TEACHER.MY_COURSES' | translate" [fluid]="true">
        <table class="t">
          <thead><tr>
            <th>{{ 'TEACHER.COURSE' | translate }}</th>
            <th>{{ 'TEACHER.STUDENTS' | translate }}</th>
            <th>{{ 'TEACHER.STATUS' | translate }}</th>
            <th>{{ 'TEACHER.TREND' | translate }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let c of courses">
              <td><strong>{{ c.name }}</strong></td>
              <td>{{ c.students }}</td>
              <td><app-status-chip [label]="c.status" [tone]="c.status === 'PUBLISHED' ? 'success' : 'warn'"></app-status-chip></td>
              <td><span [class.up]="c.trend > 0" [class.down]="c.trend < 0" class="trend">{{ c.trend > 0 ? '+' : '' }}{{ c.trend }}%</span></td>
            </tr>
          </tbody>
        </table>
      </app-chart-card>
    </div>

    <app-chart-card [title]="'DASHBOARD.RECENT_ACTIVITY' | translate" [fluid]="true">
      <app-activity-feed [items]="activity"></app-activity-feed>
    </app-chart-card>
  `,
  styles: [`
    .page-title { font-size: 1.5rem; margin-bottom: 18px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
    @media (max-width: 1100px) { .grid-2 { grid-template-columns: 1fr; } }
    .t { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .t th { text-align: start; padding: 8px 10px; color: var(--color-muted-foreground); font-weight: 500; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--color-border); }
    .t td { padding: 10px; border-bottom: 1px dashed var(--color-border); }
    .trend { font-family: var(--font-display); font-weight: 700; }
    .trend.up   { color: var(--green-500); }
    .trend.down { color: var(--red-500); }
  `],
})
export class TeacherDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  readonly icons = APP_ICONS;
  stats = signal<TeacherStats | null>(null);

  enrollmentRows: HBarRow[] = [
    { label: 'Algorithms 101', primary: 48, secondary: 32 },
    { label: 'Web Engineering', primary: 42, secondary: 26 },
    { label: 'Databases',       primary: 36, secondary: 22 },
    { label: 'AI Foundations',  primary: 28, secondary: 14 },
  ];
  weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  submissionTrend = [22, 28, 19, 36, 41, 12, 8];
  gradeLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  gradeTrend = [12.4, 12.8, 13.2, 13.0, 13.6, 13.9, 14.1, 14.5];

  courses = [
    { name: 'Algorithms 101', students: 48, status: 'PUBLISHED', trend: 8 },
    { name: 'Web Engineering', students: 42, status: 'PUBLISHED', trend: 3 },
    { name: 'Databases',       students: 36, status: 'PUBLISHED', trend: -2 },
    { name: 'AI Foundations',  students: 28, status: 'DRAFT',     trend: 0 },
  ];

  activity: ActivityItem[] = [
    { tone: 'success', title: 'Graded 12 submissions for Algorithms 101', time: '2 min ago' },
    { tone: 'info',    title: 'New material uploaded to Databases',       time: '1 h ago' },
    { tone: 'warn',    title: '3 submissions awaiting your review',       time: '3 h ago' },
  ];

  ngOnInit(): void {
    this.http.get<TeacherStats>(`${API_BASE}/teacher/stats`).pipe(
      catchError(() => of<TeacherStats>({ myCourses: 4, publishedCourses: 3, totalStudents: 154, averageGrade: 13.6, pendingGradings: 7 })),
    ).subscribe(s => this.stats.set(s));
  }
}
