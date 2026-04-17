import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ThemeToggleComponent, LanguageSwitcherComponent],
  template: `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--color-primary)"/>
            <path d="M7 14L12 19L21 9" stroke="var(--color-primary-foreground)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ 'APP.NAME' | translate }}</span>
        </div>
        <nav class="sidebar-nav">
          <a class="sidebar-link active" routerLink="/dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            {{ 'NAV.DASHBOARD' | translate }}
          </a>
          <a class="sidebar-link" href="#">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            {{ 'NAV.COURSES' | translate }}
          </a>
          <a class="sidebar-link" href="#">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {{ 'NAV.STUDENTS' | translate }}
          </a>
          <a class="sidebar-link" href="#">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            {{ 'NAV.REPORTS' | translate }}
          </a>
          <a class="sidebar-link" href="#">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.49M4.93 4.93a10 10 0 0 0 0 14.14M7.76 7.76a6 6 0 0 0 0 8.49"/></svg>
            {{ 'NAV.SETTINGS' | translate }}
          </a>
        </nav>
      </aside>

      <div class="main-area">
        <header class="dash-header">
          <h1 class="dash-title">{{ 'DASHBOARD.OVERVIEW' | translate }}</h1>
          <div class="header-actions">
            <app-language-switcher />
            <app-theme-toggle />
          </div>
        </header>

        <div class="kpi-grid">
          @for (kpi of kpis; track kpi.label) {
            <div class="kpi-card">
              <span class="kpi-label">{{ kpi.label | translate }}</span>
              <span class="kpi-value">{{ kpi.value }}</span>
              <span class="kpi-delta" [class.positive]="kpi.positive" [class.negative]="!kpi.positive">{{ kpi.delta }}</span>
            </div>
          }
        </div>

        <div class="chart-placeholder">
          <div class="chart-header">
            <span class="chart-title">{{ 'DASHBOARD.RECENT_ACTIVITY' | translate }}</span>
          </div>
          <div class="chart-bars">
            @for (h of barHeights; track $index) {
              <div class="chart-bar" [style.height.%]="h"></div>
            }
          </div>
        </div>

        <a routerLink="/" class="back-link">← {{ 'BUTTONS.BACK' | translate }}</a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: var(--color-background);
      color: var(--color-foreground);
    }

    .sidebar {
      width: 220px;
      flex-shrink: 0;
      border-inline-end: 1px solid var(--color-border);
      background: var(--color-sidebar);
      display: flex;
      flex-direction: column;
      padding: 1.25rem 0;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 1.25rem 1.5rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-sidebar-foreground);
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 0.75rem;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius);
      color: var(--color-sidebar-foreground);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      opacity: 0.75;
      transition: background 0.12s, opacity 0.12s;
    }

    .sidebar-link:hover,
    .sidebar-link.active {
      background: var(--color-sidebar-accent);
      opacity: 1;
      color: var(--color-sidebar-accent-foreground);
    }

    .main-area {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .dash-title {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .kpi-label {
      font-size: 0.8125rem;
      color: var(--color-muted-foreground);
      font-weight: 500;
    }

    .kpi-value {
      font-size: 1.875rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }

    .kpi-delta {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .kpi-delta.positive { color: hsl(142 71% 45%); }
    .kpi-delta.negative { color: hsl(0 84% 60%); }

    .chart-placeholder {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart-header { margin-bottom: 1.25rem; }

    .chart-title {
      font-size: 1rem;
      font-weight: 600;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 140px;
    }

    .chart-bar {
      flex: 1;
      background: var(--color-primary);
      border-radius: 4px 4px 0 0;
      opacity: 0.8;
      min-height: 8px;
      transition: opacity 0.15s;
    }

    .chart-bar:hover { opacity: 1; }

    .back-link {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      text-decoration: none;
      font-weight: 500;
    }

    .back-link:hover { color: var(--color-foreground); }
  `]
})
export class DashboardComponent {
  barHeights = [45, 72, 58, 90, 63, 81, 55, 70, 88, 42, 76, 60];

  kpis = [
    { label: 'DASHBOARD.TOTAL_STUDENTS',  value: '1,247', delta: '+12%', positive: true  },
    { label: 'DASHBOARD.ACTIVE_COURSES',  value: '48',    delta: '+3',   positive: true  },
    { label: 'DASHBOARD.COMPLETION_RATE', value: '94.2%', delta: '+2.1%',positive: true  },
    { label: 'DASHBOARD.AT_RISK',         value: '23',    delta: '+5',   positive: false },
  ];
}
