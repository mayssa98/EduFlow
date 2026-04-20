import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { BarChartComponent } from '../../shared/components/charts/bar-chart.component';
import { AreaChartComponent } from '../../shared/components/charts/area-chart.component';
import { DonutChartComponent } from '../../shared/components/charts/donut-chart.component';
import { ActivityFeedComponent, ActivityItem } from '../../shared/components/activity-feed/activity-feed.component';
import { RiskBadgeComponent } from '../../shared/components/risk-badge/risk-badge.component';
import { API_BASE } from '../../core/services/auth.service';
import { APP_ICONS } from '../../shared/icons/app-icons';

interface StatsOverview {
  usersByRole?: Record<string, number>;
  publishedCourses?: number;
  draftCourses?: number;
  pendingApprovals?: number;
  submissionsThisWeek?: number;
  activeSessions?: number;
  recentActivity?: { tone: string; title: string; at?: string }[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, TranslateModule,
    KpiCardComponent, ChartCardComponent,
    BarChartComponent, AreaChartComponent, DonutChartComponent,
    ActivityFeedComponent, RiskBadgeComponent,
  ],
  template: `
    <h1 class="page-title">{{ 'ADMIN.TITLE' | translate }}</h1>

    <div class="kpi-grid">
      <app-kpi-card [label]="'ADMIN.KPI_ADMINS' | translate"   [value]="roleCount('ADMIN')"      [trend]="0"  [hint]="'DASHBOARD.OVERVIEW' | translate" [icon]="icons.shield"></app-kpi-card>
      <app-kpi-card [label]="'ADMIN.KPI_TEACHERS' | translate" [value]="roleCount('ENSEIGNANT')" [trend]="3" [icon]="icons.users"></app-kpi-card>
      <app-kpi-card [label]="'ADMIN.KPI_STUDENTS' | translate" [value]="roleCount('ETUDIANT')"   [trend]="12" [icon]="icons.graduation"></app-kpi-card>
      <app-kpi-card [label]="'ADMIN.KPI_PUBLISHED' | translate" [value]="overview()?.publishedCourses ?? 0" [trend]="6" [icon]="icons.rocket"></app-kpi-card>
      <app-kpi-card [label]="'ADMIN.KPI_DRAFTS' | translate"    [value]="overview()?.draftCourses ?? 0"     [trend]="-1" [icon]="icons.edit"></app-kpi-card>
      <app-kpi-card [label]="'ADMIN.KPI_APPROVALS' | translate" [value]="overview()?.pendingApprovals ?? 0" [trend]="0" [hint]="'ADMIN.NEEDS_REVIEW' | translate" [icon]="icons.approval"></app-kpi-card>
      <app-kpi-card [label]="'ADMIN.KPI_SUBMISSIONS' | translate" [value]="overview()?.submissionsThisWeek ?? 0" [trend]="8" [icon]="icons.clipboard"></app-kpi-card>
      <app-kpi-card [label]="'ADMIN.KPI_SESSIONS' | translate"  [value]="overview()?.activeSessions ?? 0"   [trend]="2" [trendSuffix]="'%'" [icon]="icons.activity"></app-kpi-card>
    </div>

    <div class="grid-2">
      <app-chart-card [title]="'ADMIN.PLATFORM_GROWTH' | translate" [subtitle]="'ADMIN.PLATFORM_GROWTH_SUB' | translate">
        <app-bar-chart [labels]="growthLabels" [series]="growthSeries"></app-bar-chart>
      </app-chart-card>
      <app-chart-card [title]="'ADMIN.ROLE_DISTRIBUTION' | translate">
        <app-donut-chart [slices]="roleSlices()" [centerLabel]="'NAV.STUDENTS' | translate"></app-donut-chart>
      </app-chart-card>
    </div>

    <div class="grid-2">
      <app-chart-card [title]="'ADMIN.SUBMISSIONS_ACTIVITY' | translate">
        <app-area-chart [labels]="weekLabels" [values]="submissionTrend"></app-area-chart>
      </app-chart-card>
      <app-chart-card [title]="'ADMIN.AT_RISK' | translate" [subtitle]="'ADMIN.AT_RISK_SUB' | translate">
        <ul class="risk-list">
          <li *ngFor="let r of atRisk">
            <div>
              <strong>{{ r.name }}</strong>
              <p class="why">{{ r.justification }}</p>
            </div>
            <app-risk-badge [level]="r.level" [label]="r.level"></app-risk-badge>
          </li>
        </ul>
      </app-chart-card>
    </div>

    <app-chart-card [title]="'DASHBOARD.RECENT_ACTIVITY' | translate" [fluid]="true">
      <app-activity-feed [items]="activity()"></app-activity-feed>
    </app-chart-card>
  `,
  styles: [`
    .page-title { font-size: 1.5rem; margin-bottom: 18px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .grid-2 { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 18px; }
    @media (max-width: 1100px) { .grid-2 { grid-template-columns: 1fr; } }
    .risk-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .risk-list li { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 10px; border: 1px dashed var(--color-border); border-radius: var(--radius); }
    .risk-list strong { font-family: var(--font-display); font-size: 0.95rem; }
    .why { font-size: 0.8rem; color: var(--color-muted-foreground); margin-top: 2px; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  readonly icons = APP_ICONS;

  overview = signal<StatsOverview | null>(null);
  roleCount(role: 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT'): number {
    const r = this.overview()?.usersByRole ?? {};
    return r[role] ?? 0;
  }

  growthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  growthSeries = [
    { name: 'Students', values: [120, 135, 160, 190, 210, 245, 280, 310, 340, 380], color: '#6366f1' },
    { name: 'Teachers', values: [22, 25, 28, 30, 33, 36, 38, 41, 44, 48], color: '#8b5cf6' },
  ];
  weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  submissionTrend = [120, 145, 132, 168, 190, 88, 64];

  atRisk: { name: string; level: 'FAIBLE' | 'MODERE' | 'ELEVE'; justification: string }[] = [];

  activity = signal<ActivityItem[]>([]);

  roleSlices = () => ([
    { label: 'Students', value: this.roleCount('ETUDIANT'),   color: '#6366f1' },
    { label: 'Teachers', value: this.roleCount('ENSEIGNANT'), color: '#8b5cf6' },
    { label: 'Admins',   value: this.roleCount('ADMIN'),      color: '#2dd4bf' },
  ]);

  ngOnInit(): void {
    this.http.get<StatsOverview>(`${API_BASE}/admin/stats/overview`).pipe(
      catchError(() => of<StatsOverview | null>(null)),
    ).subscribe(s => {
      this.overview.set(s ?? defaults());
      const acts = (s?.recentActivity ?? defaults().recentActivity ?? []).map(a => ({
        tone: (a.tone as ActivityItem['tone']) ?? 'info',
        title: a.title,
        time: a.at,
      }));
      this.activity.set(acts);
    });

    // At-risk panel placeholder until the dedicated AI endpoint is wired (downstream task).
    this.atRisk = [
      { name: 'Sami B.',   level: 'ELEVE',  justification: 'Missed 3 deadlines, average grade 8/20.' },
      { name: 'Maya K.',   level: 'MODERE', justification: 'Declining grades trend over last 4 weeks.' },
      { name: 'Anis D.',   level: 'FAIBLE', justification: 'Stable performance, watch attendance.' },
    ];
  }
}

function defaults(): StatsOverview {
  return {
    usersByRole: { ADMIN: 1, ENSEIGNANT: 0, ETUDIANT: 0 },
    publishedCourses: 0, draftCourses: 0, pendingApprovals: 0,
    submissionsThisWeek: 0, activeSessions: 1,
    recentActivity: [
      { tone: 'info',    title: 'Welcome to EduFlow', at: 'Just now' },
    ],
  };
}
