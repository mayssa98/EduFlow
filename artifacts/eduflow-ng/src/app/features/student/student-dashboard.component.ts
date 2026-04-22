import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { LineChartComponent } from '../../shared/components/charts/line-chart.component';
import { DonutChartComponent } from '../../shared/components/charts/donut-chart.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { APP_ICONS } from '../../shared/icons/app-icons';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

interface CourseProgress {
  name: string;
  progress: number;
  teacher: string;
}

interface Deadline {
  title: string;
  course: string;
  due: string;
  urgent: boolean;
}

interface DashboardBrief {
  title: string;
  text: string;
  icon: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    KpiCardComponent,
    ChartCardComponent,
    LineChartComponent,
    DonutChartComponent,
    ProgressBarComponent,
    StatusChipComponent,
    SafeHtmlPipe,
  ],
  template: `
    <section class="hero-panel">
      <div class="hero-aura hero-aura-left"></div>
      <div class="hero-aura hero-aura-right"></div>
      <div class="hero-copy">
        <span class="eyebrow">
          <span class="eyebrow-icon" [innerHTML]="icons.sparkles | safeHtml"></span>
          Cockpit etudiant
        </span>
        <h1 class="page-title">{{ 'STUDENT.TITLE' | translate }}</h1>
        <p>
          Suivez vos modules, vos rendus et vos priorites de la semaine depuis un espace
          plus lisible et plus vivant.
        </p>
      </div>

      <div class="hero-briefs">
        <article class="hero-brief" *ngFor="let brief of heroBriefs">
          <span class="brief-icon" [innerHTML]="brief.icon | safeHtml"></span>
          <div>
            <strong>{{ brief.title }}</strong>
            <p>{{ brief.text }}</p>
          </div>
        </article>
      </div>
    </section>

    <div class="kpi-grid">
      <app-kpi-card
        [label]="'STUDENT.KPI_ENROLLED' | translate"
        [value]="6"
        [trend]="1"
        [hint]="'modules actifs'"
        [icon]="icons.layers"
      ></app-kpi-card>

      <app-kpi-card
        [label]="'STUDENT.KPI_DONE' | translate"
        [value]="14"
        [trend]="3"
        [hint]="'travaux remis'"
        [icon]="icons.checkCircle"
      ></app-kpi-card>

      <app-kpi-card
        [label]="'STUDENT.KPI_OVERDUE' | translate"
        [value]="2"
        [trend]="-1"
        [hint]="'actions urgentes'"
        [icon]="icons.alert"
      ></app-kpi-card>

      <app-kpi-card
        [label]="'STUDENT.KPI_AVG_GRADE' | translate"
        [value]="14.2"
        [suffix]="'/20'"
        [trend]="0.5"
        [hint]="'progression continue'"
        [icon]="icons.award"
        [format]="'1.1-1'"
      ></app-kpi-card>
    </div>

    <div class="grid-2">
      <app-chart-card
        [title]="'STUDENT.COURSE_PROGRESS' | translate"
        subtitle="Lecture rapide de vos modules les plus engages"
      >
        <ul class="cp">
          <li *ngFor="let c of courses">
            <header>
              <div>
                <strong>{{ c.name }}</strong>
                <span class="muted">{{ c.teacher }}</span>
              </div>
              <span class="progress-badge">{{ c.progress }}%</span>
            </header>
            <app-progress-bar [value]="c.progress" [label]="c.name"></app-progress-bar>
          </li>
        </ul>
      </app-chart-card>

      <app-chart-card
        [title]="'STUDENT.ASSIGNMENT_STATUS' | translate"
        subtitle="Diagramme agrandi avec lecture immediate par categorie"
      >
        <app-donut-chart
          [slices]="statusSlices"
          centerLabel="Statut devoirs"
          [size]="292"
          [strokeWidth]="18"
        ></app-donut-chart>
      </app-chart-card>
    </div>

    <div class="grid-2">
      <app-chart-card
        [title]="'STUDENT.GRADE_TREND' | translate"
        subtitle="Une courbe simple pour verifier la regularite"
      >
        <app-line-chart [labels]="gradeLabels" [values]="gradeTrend" color="#6366f1"></app-line-chart>
      </app-chart-card>

      <app-chart-card
        [title]="'STUDENT.UPCOMING_DEADLINES' | translate"
        subtitle="Les prochaines echeances a ne pas laisser glisser"
        [fluid]="true"
      >
        <ul class="deadlines">
          <li *ngFor="let d of deadlines" [class.urgent]="d.urgent">
            <div class="deadline-copy">
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
    .hero-panel {
      position: relative;
      display: grid;
      grid-template-columns: minmax(280px, 1.1fr) minmax(280px, 0.9fr);
      gap: 18px;
      margin-bottom: 20px;
      padding: 22px;
      border-radius: 28px;
      border: 1px solid rgba(99,102,241,0.14);
      background:
        radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 34%),
        linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
      box-shadow: 0 20px 40px rgba(15,23,42,0.16);
      overflow: hidden;
    }

    .hero-aura {
      position: absolute;
      border-radius: 999px;
      filter: blur(10px);
      pointer-events: none;
      opacity: 0.8;
    }

    .hero-aura-left {
      top: -42px;
      left: -28px;
      width: 180px;
      height: 180px;
      background: radial-gradient(circle, rgba(56,189,248,0.16), transparent 70%);
      animation: auraFloat 8s ease-in-out infinite;
    }

    .hero-aura-right {
      bottom: -54px;
      right: 12%;
      width: 220px;
      height: 220px;
      background: radial-gradient(circle, rgba(129,140,248,0.18), transparent 68%);
      animation: auraFloat 10s ease-in-out infinite reverse;
    }

    .hero-copy {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      justify-content: center;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.2);
      color: #c7d2fe;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .eyebrow-icon,
    .brief-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: currentColor;
    }

    .page-title {
      font-size: clamp(2rem, 3vw, 2.7rem);
      line-height: 1;
      margin: 0;
    }

    .hero-copy p {
      max-width: 42rem;
      margin: 0;
      color: var(--color-muted-foreground);
      font-size: 0.98rem;
      line-height: 1.7;
    }

    .hero-briefs {
      position: relative;
      display: grid;
      gap: 12px;
      align-content: center;
    }

    .hero-brief {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: flex-start;
      padding: 16px 18px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.05);
      background:
        linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025)),
        rgba(255,255,255,0.03);
      box-shadow: 0 16px 28px rgba(15,23,42,0.12);
      animation: floatCard 6s ease-in-out infinite;
    }

    .hero-brief:nth-child(2) { animation-delay: 0.7s; }
    .hero-brief:nth-child(3) { animation-delay: 1.4s; }

    .brief-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      color: #a5b4fc;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 22px rgba(59,130,246,0.12);
      animation: iconPulse 4.8s ease-in-out infinite;
    }

    .hero-brief strong {
      display: block;
      margin-bottom: 4px;
      font-family: var(--font-display);
      font-size: 0.96rem;
    }

    .hero-brief p {
      margin: 0;
      color: var(--color-muted-foreground);
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }

    .cp {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cp li {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px 14px 12px;
      border-radius: 18px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.04);
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .cp li:hover {
      transform: translateY(-2px);
      border-color: rgba(99,102,241,0.18);
      box-shadow: 0 18px 30px rgba(15,23,42,0.14);
    }

    .cp header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .cp strong {
      display: block;
      margin-bottom: 3px;
      font-family: var(--font-display);
      font-size: 0.96rem;
    }

    .progress-badge {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.18);
      font-size: 0.78rem;
      font-weight: 700;
      color: #c7d2fe;
      white-space: nowrap;
    }

    .muted {
      color: var(--color-muted-foreground);
      font-size: 0.84rem;
    }

    .deadlines {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .deadlines li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      border: 1px dashed var(--color-border);
      border-radius: 18px;
      background: rgba(255,255,255,0.02);
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
    }

    .deadlines li:hover {
      transform: translateY(-2px);
      border-color: rgba(99,102,241,0.2);
      background: rgba(255,255,255,0.04);
    }

    .deadlines li.urgent {
      border-color: rgba(239,68,68,0.36);
      background: rgba(239,68,68,0.05);
    }

    .deadline-copy strong {
      display: block;
      margin-bottom: 4px;
      font-family: var(--font-display);
      font-size: 0.95rem;
    }

    @keyframes floatCard {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @keyframes iconPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }

    @keyframes auraFloat {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(14px, -10px, 0); }
    }

    @media (max-width: 1120px) {
      .hero-panel { grid-template-columns: 1fr; }
    }

    @media (max-width: 1000px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
  `],
})
export class StudentDashboardComponent {
  readonly icons = APP_ICONS;

  readonly heroBriefs: DashboardBrief[] = [
    {
      title: 'Vision en un coup d oeil',
      text: 'Les indicateurs clefs restent visibles sans noyer les informations utiles.',
      icon: APP_ICONS.layers,
    },
    {
      title: 'Rendus sous controle',
      text: 'Le diagramme agrandi vous montre vite ce qui est termine, a faire ou deja critique.',
      icon: APP_ICONS.target,
    },
    {
      title: 'Priorites de la semaine',
      text: 'Les prochaines echeances restent presentes pour mieux arbitrer vos efforts.',
      icon: APP_ICONS.calendarCheck,
    },
  ];

  readonly courses: CourseProgress[] = [
    { name: 'Algorithms 101', teacher: 'Prof. Hadj', progress: 78 },
    { name: 'Web Engineering', teacher: 'Prof. Saidi', progress: 54 },
    { name: 'Databases', teacher: 'Prof. Khelifa', progress: 42 },
    { name: 'Mathematics', teacher: 'Prof. Bouaziz', progress: 91 },
    { name: 'AI Foundations', teacher: 'Prof. Rezzag', progress: 22 },
  ];

  readonly statusSlices = [
    { label: 'Completed', value: 14, color: '#22c55e' },
    { label: 'Pending', value: 5, color: '#fbbf24' },
    { label: 'Overdue', value: 2, color: '#ef4444' },
  ];

  readonly gradeLabels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
  readonly gradeTrend = [11.5, 12.2, 12.8, 13.4, 13.9, 14.2];

  readonly deadlines: Deadline[] = [
    { title: 'Sorting algorithms TP', course: 'Algorithms 101', due: 'in 1 day', urgent: true },
    { title: 'Database normalisation', course: 'Databases', due: 'in 4 days', urgent: false },
    { title: 'Final project', course: 'Web Engineering', due: 'in 12 days', urgent: false },
  ];
}
