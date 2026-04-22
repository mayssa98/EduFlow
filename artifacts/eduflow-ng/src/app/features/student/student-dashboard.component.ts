import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, catchError, forkJoin, map, of, switchMap, timer } from 'rxjs';

import { Assignment, AssignmentService, Submission } from '../../core/services/assignment.service';
import { Course, CourseService } from '../../core/services/course.service';
import { ChartCardComponent } from '../../shared/components/chart-card/chart-card.component';
import { DonutChartComponent, DonutSlice } from '../../shared/components/charts/donut-chart.component';
import { LineChartComponent } from '../../shared/components/charts/line-chart.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
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

interface DashboardTotals {
  enrolled: number;
  completed: number;
  pending: number;
  overdue: number;
  average: number;
}

interface DashboardSnapshot {
  totals: DashboardTotals;
  courses: CourseProgress[];
  statusSlices: DonutSlice[];
  gradeLabels: string[];
  gradeTrend: number[];
  deadlines: Deadline[];
  lastSyncedAt: number | null;
}

interface CourseAssignments {
  course: Course;
  assignments: Assignment[];
}

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  totals: {
    enrolled: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    average: 0,
  },
  courses: [],
  statusSlices: [
    { label: 'Completed', value: 0, color: '#22c55e' },
    { label: 'Pending', value: 0, color: '#fbbf24' },
    { label: 'Overdue', value: 0, color: '#ef4444' },
  ],
  gradeLabels: [],
  gradeTrend: [],
  deadlines: [],
  lastSyncedAt: null,
};

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
          Toutes les statistiques partent de l'etat reel du compte et se
          synchronisent automatiquement. Si une note, un rendu ou un devoir
          change, le tableau se recalcule sans rester fige.
        </p>
        <span class="sync-pill" [class.loading]="loading()">
          {{ loading() ? 'Actualisation en cours...' : syncLabel() }}
        </span>
      </div>

      <div class="hero-briefs">
        <article class="hero-brief" *ngFor="let brief of heroBriefs()">
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
        [value]="snapshot().totals.enrolled"
        [hint]="'modules actifs'"
        [icon]="icons.layers"
      ></app-kpi-card>

      <app-kpi-card
        [label]="'STUDENT.KPI_DONE' | translate"
        [value]="snapshot().totals.completed"
        [hint]="'travaux remis'"
        [icon]="icons.checkCircle"
      ></app-kpi-card>

      <app-kpi-card
        [label]="'STUDENT.KPI_OVERDUE' | translate"
        [value]="snapshot().totals.overdue"
        [hint]="'actions urgentes'"
        [icon]="icons.alert"
      ></app-kpi-card>

      <app-kpi-card
        [label]="'STUDENT.KPI_AVG_GRADE' | translate"
        [value]="snapshot().totals.average"
        [suffix]="'/20'"
        [hint]="'notes publiees'"
        [icon]="icons.award"
        [format]="'1.1-1'"
      ></app-kpi-card>
    </div>

    <div class="grid-2">
      <app-chart-card
        [title]="'STUDENT.COURSE_PROGRESS' | translate"
        subtitle="Progression calculee depuis les devoirs repondus par cours"
      >
        <ul class="cp" *ngIf="snapshot().courses.length > 0; else emptyCourses">
          <li *ngFor="let c of snapshot().courses">
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

        <ng-template #emptyCourses>
          <div class="panel-empty">
            Aucun module actif n'est encore visible dans votre tableau.
          </div>
        </ng-template>
      </app-chart-card>

      <app-chart-card
        [title]="'STUDENT.ASSIGNMENT_STATUS' | translate"
        subtitle="Statistiques actives : termine, a faire et deja en retard"
      >
        <app-donut-chart
          [slices]="snapshot().statusSlices"
          centerLabel="Statut devoirs"
          [size]="310"
          [strokeWidth]="12"
          [segmentGap]="0"
        ></app-donut-chart>
      </app-chart-card>
    </div>

    <div class="grid-2">
      <app-chart-card
        [title]="'STUDENT.GRADE_TREND' | translate"
        subtitle="Courbe mise a jour depuis les dernieres soumissions notees"
      >
        <ng-container *ngIf="snapshot().gradeTrend.length > 0; else emptyGrades">
          <app-line-chart [labels]="snapshot().gradeLabels" [values]="snapshot().gradeTrend" color="#6366f1"></app-line-chart>
        </ng-container>

        <ng-template #emptyGrades>
          <div class="panel-empty">
            Les notes apparaitront ici des que des corrections seront publiees.
          </div>
        </ng-template>
      </app-chart-card>

      <app-chart-card
        [title]="'STUDENT.UPCOMING_DEADLINES' | translate"
        subtitle="Les prochaines echeances se recalculent automatiquement"
        [fluid]="true"
      >
        <ul class="deadlines" *ngIf="snapshot().deadlines.length > 0; else emptyDeadlines">
          <li *ngFor="let d of snapshot().deadlines" [class.urgent]="d.urgent">
            <div class="deadline-copy">
              <strong>{{ d.title }}</strong>
              <p class="muted">{{ d.course }}</p>
            </div>
            <div class="due">
              <app-status-chip [label]="d.due" [tone]="d.urgent ? 'danger' : 'info'"></app-status-chip>
            </div>
          </li>
        </ul>

        <ng-template #emptyDeadlines>
          <div class="panel-empty">
            Aucune echeance ouverte pour le moment.
          </div>
        </ng-template>
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

    .sync-pill {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid rgba(34,197,94,0.22);
      background: rgba(34,197,94,0.1);
      color: #86efac;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    .sync-pill.loading {
      border-color: rgba(251,191,36,0.22);
      background: rgba(251,191,36,0.1);
      color: #fde68a;
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

    .panel-empty {
      min-height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 18px;
      color: var(--color-muted-foreground);
      line-height: 1.7;
      border: 1px dashed rgba(255,255,255,0.08);
      border-radius: 20px;
      background: rgba(255,255,255,0.03);
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
export class StudentDashboardComponent implements OnInit {
  private readonly courseSvc = inject(CourseService);
  private readonly assignmentSvc = inject(AssignmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly icons = APP_ICONS;
  readonly loading = signal(true);
  readonly snapshot = signal<DashboardSnapshot>(EMPTY_SNAPSHOT);

  readonly heroBriefs = computed<DashboardBrief[]>(() => {
    const current = this.snapshot();
    const tracked = current.statusSlices.reduce((sum, slice) => sum + slice.value, 0);

    return [
      {
        title: 'Vision en temps reel',
        text: `${current.totals.enrolled} modules actifs et ${tracked} elements suivis depuis les donnees reelles.`,
        icon: APP_ICONS.layers,
      },
      {
        title: 'Rendus synchronises',
        text: `${current.totals.completed} rendus termines et ${current.totals.pending} devoirs encore ouverts.`,
        icon: APP_ICONS.target,
      },
      {
        title: 'Priorites immediates',
        text: `${current.totals.overdue} urgences detectees et ${current.deadlines.length} echeances visibles maintenant.`,
        icon: APP_ICONS.calendarCheck,
      },
    ];
  });

  readonly syncLabel = computed(() => {
    const ts = this.snapshot().lastSyncedAt;
    if (!ts) return 'Synchronisation auto active';
    return `Synchronise a ${this.formatClock(ts)} - refresh auto 5s`;
  });

  ngOnInit(): void {
    timer(0, 5000)
      .pipe(
        switchMap(() => this.fetchDashboardSnapshot(this.snapshot())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(snapshot => {
        this.snapshot.set(snapshot);
        this.loading.set(false);
      });
  }

  private fetchDashboardSnapshot(previous: DashboardSnapshot): Observable<DashboardSnapshot> {
    this.loading.set(true);

    return forkJoin({
      courses: this.courseSvc.list().pipe(catchError(() => of([] as Course[]))),
      submissions: this.assignmentSvc.mySubmissions().pipe(catchError(() => of([] as Submission[]))),
    }).pipe(
      switchMap(({ courses, submissions }) => {
        if (courses.length === 0) {
          return of(this.buildSnapshot([], submissions, previous));
        }

        return forkJoin(
          courses.map(course =>
            this.assignmentSvc.listForCourse(course.id).pipe(
              catchError(() => of([] as Assignment[])),
              map(assignments => ({ course, assignments })),
            ),
          ),
        ).pipe(map(courseAssignments => this.buildSnapshot(courseAssignments, submissions, previous)));
      }),
      catchError(() => {
        this.loading.set(false);
        return of(previous);
      }),
    );
  }

  private buildSnapshot(courseAssignments: CourseAssignments[], submissions: Submission[], previous: DashboardSnapshot): DashboardSnapshot {
    const now = Date.now();
    const submissionByAssignment = new Map<number, Submission>();

    submissions.forEach(submission => {
      const existing = submissionByAssignment.get(submission.devoirId);
      if (!existing || new Date(submission.dateSoumission).getTime() > new Date(existing.dateSoumission).getTime()) {
        submissionByAssignment.set(submission.devoirId, submission);
      }
    });

    const allAssignments = courseAssignments.flatMap(({ course, assignments }) =>
      assignments.map(assignment => ({ ...assignment, teacher: course.enseignantNom })),
    );

    const completed = allAssignments.filter(assignment => submissionByAssignment.has(assignment.id)).length;
    const overdue = allAssignments.filter(assignment => !submissionByAssignment.has(assignment.id) && this.isOverdue(assignment.dateEcheance)).length;
    const pending = Math.max(0, allAssignments.length - completed - overdue);

    const gradedSubmissions = [...submissions]
      .filter(submission => submission.note != null)
      .sort((left, right) => new Date(left.dateSoumission).getTime() - new Date(right.dateSoumission).getTime());

    const average = gradedSubmissions.length > 0
      ? Math.round((gradedSubmissions.reduce((sum, submission) => sum + (submission.note ?? 0), 0) / gradedSubmissions.length) * 10) / 10
      : 0;

    const courses = courseAssignments
      .map(({ course, assignments }) => {
        const submittedCount = assignments.filter(assignment => submissionByAssignment.has(assignment.id)).length;
        const progress = assignments.length > 0 ? Math.round((submittedCount / assignments.length) * 100) : 0;

        return {
          name: course.titre,
          teacher: course.enseignantNom,
          progress,
          totalAssignments: assignments.length,
        };
      })
      .sort((left, right) => {
        if (right.progress !== left.progress) return right.progress - left.progress;
        if (right.totalAssignments !== left.totalAssignments) return right.totalAssignments - left.totalAssignments;
        return left.name.localeCompare(right.name);
      })
      .slice(0, 5)
      .map(({ totalAssignments, ...course }) => course);

    const outstandingAssignments = allAssignments
      .filter(assignment => !submissionByAssignment.has(assignment.id))
      .sort((left, right) => new Date(left.dateEcheance).getTime() - new Date(right.dateEcheance).getTime());

    const deadlines = outstandingAssignments.slice(0, 3).map(assignment => ({
      title: assignment.titre,
      course: assignment.coursTitre,
      due: this.relativeDueLabel(assignment.dateEcheance, now),
      urgent: this.isUrgent(assignment.dateEcheance, now),
    }));

    const recentGrades = gradedSubmissions.slice(-6);

    const totals: DashboardTotals = {
      enrolled: courseAssignments.length,
      completed,
      pending,
      overdue,
      average,
    };

    return {
      totals,
      courses,
      statusSlices: [
        { label: 'Completed', value: completed, color: '#22c55e' },
        { label: 'Pending', value: pending, color: '#fbbf24' },
        { label: 'Overdue', value: overdue, color: '#ef4444' },
      ],
      gradeLabels: recentGrades.map((submission, index) => this.compactGradeLabel(submission, index)),
      gradeTrend: recentGrades.map(submission => submission.note ?? 0),
      deadlines,
      lastSyncedAt: now,
    };
  }

  private compactGradeLabel(submission: Submission, index: number): string {
    const title = submission.devoirTitre?.trim() || `Note ${index + 1}`;
    return title.length <= 10 ? title : `${title.slice(0, 9)}.`;
  }

  private relativeDueLabel(dateValue: string, now: number): string {
    const diffMs = new Date(dateValue).getTime() - now;
    const diffDays = Math.ceil(diffMs / 86_400_000);

    if (diffMs < 0) return 'En retard';
    if (diffDays <= 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays <= 7) return `Dans ${diffDays} jours`;
    return `Le ${this.formatShortDate(dateValue)}`;
  }

  private isUrgent(dateValue: string, now: number): boolean {
    const diffMs = new Date(dateValue).getTime() - now;
    return diffMs < 0 || diffMs <= 2 * 86_400_000;
  }

  private isOverdue(dateValue: string): boolean {
    return new Date(dateValue).getTime() < Date.now();
  }

  private formatShortDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  }

  private formatClock(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
