import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { Assignment, AssignmentService, Submission } from '../../core/services/assignment.service';
import { Course, CourseService } from '../../core/services/course.service';
import { APP_ICONS } from '../../shared/icons/app-icons';

interface AssignmentGuide {
  title: string;
  text: string;
  icon: string;
}

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="assign-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <span class="eyebrow">
            <span [innerHTML]="icons.document"></span>
            Espace de remise
          </span>
          <h1>Mes devoirs et travaux a rendre</h1>
          <p>
            Filtrez un cours, reperez les echeances et soumettez vos livrables PDF ou MP4
            depuis un parcours plus clair.
          </p>
        </div>

        <div class="hero-stats">
          <article class="hero-stat">
            <span class="hero-stat-icon" [innerHTML]="icons.layers"></span>
            <div>
              <strong>{{ courses().length }}</strong>
              <p>cours disponibles</p>
            </div>
          </article>

          <article class="hero-stat">
            <span class="hero-stat-icon" [innerHTML]="icons.checkCircle"></span>
            <div>
              <strong>{{ gradedCount() }}</strong>
              <p>copies evaluees</p>
            </div>
          </article>

          <article class="hero-stat">
            <span class="hero-stat-icon" [innerHTML]="icons.clock"></span>
            <div>
              <strong>{{ pendingCount() }}</strong>
              <p>rendus en attente</p>
            </div>
          </article>
        </div>
      </section>

      <section class="filter-panel">
        <div class="filter-copy">
          <h2>Selection du cours</h2>
          <p>Choisissez un module pour voir les devoirs attendus et les prochaines remises.</p>
        </div>

        <div class="filter-controls">
          <label class="field">
            <span>Filtrer par cours</span>
            <select class="form-control" [ngModel]="selectedCourseFilter()" (ngModelChange)="onCourseFilterChange($event)">
              <option [ngValue]="null">Selectionnez un cours pour afficher les devoirs</option>
              <option *ngFor="let c of courses()" [ngValue]="c.id">{{ c.titre }}</option>
            </select>
          </label>

          <div class="format-pills">
            <span class="format-pill"><span [innerHTML]="icons.document"></span> PDF</span>
            <span class="format-pill"><span [innerHTML]="icons.playCircle"></span> MP4</span>
            <span class="format-pill"><span [innerHTML]="icons.calendarCheck"></span> depot date</span>
          </div>
        </div>
      </section>

      <div class="grid-2" *ngIf="!loading(); else spinner">
        <section class="panel">
          <header class="panel-head">
            <div>
              <h2>Devoirs a faire</h2>
              <p>La liste se met a jour selon le cours choisi et garde les actions visibles.</p>
            </div>
            <span class="panel-badge">{{ assignments().length }}</span>
          </header>

          <ng-container *ngIf="selectedCourseFilter(); else instructionalState">
            <div class="empty-state" *ngIf="assignments().length === 0">
              <span class="state-icon" [innerHTML]="icons.checkCircle"></span>
              <div>
                <strong>Aucun devoir prevu sur ce cours</strong>
                <p>Le prochain travail publie apparaitra ici automatiquement.</p>
              </div>
            </div>

            <article class="assign-card" *ngFor="let a of assignments()">
              <div class="card-head">
                <div class="title-wrap">
                  <span class="mini-icon" [innerHTML]="icons.clipboard"></span>
                  <div>
                    <h3>{{ a.titre }}</h3>
                    <p>{{ a.coursTitre }}</p>
                  </div>
                </div>

                <span class="due-date" [class.overdue]="isOverdue(a.dateEcheance)">
                  <span [innerHTML]="isOverdue(a.dateEcheance) ? icons.alert : icons.calendarCheck"></span>
                  {{ formatDate(a.dateEcheance) }}
                </span>
              </div>

              <p class="desc">{{ a.description || 'Aucune consigne detaillee pour le moment.' }}</p>

              <div class="meta-row">
                <span><span [innerHTML]="icons.layers"></span>{{ a.nbSoumissions }} rendus deja recus</span>
                <span><span [innerHTML]="icons.target"></span>{{ getSubmissionFor(a.id) ? 'Suivi personalise' : 'Remise ouverte' }}</span>
              </div>

              <ng-container *ngIf="getSubmissionFor(a.id) as sub; else notSubmitted">
                <div class="status-banner submitted">
                  <div>
                    <strong>Travail deja remis</strong>
                    <p>Envoye le {{ formatDate(sub.dateSoumission) }}</p>
                  </div>
                  <span *ngIf="sub.note != null" class="grade-pill">{{ sub.note }}/20</span>
                </div>
              </ng-container>

              <ng-template #notSubmitted>
                <div class="actions">
                  <input
                    type="file"
                    #fileInput
                    (change)="onFileSelected($event, a.id)"
                    accept="application/pdf,video/mp4"
                    hidden
                  />
                  <button class="primary-btn" type="button" (click)="fileInput.click()" [disabled]="isOverdue(a.dateEcheance)">
                    <span [innerHTML]="icons.document"></span>
                    {{ isOverdue(a.dateEcheance) ? 'Delai depasse' : 'Soumettre mon travail' }}
                  </button>
                  <span class="uploading-text" *ngIf="uploadingId() === a.id">Envoi du fichier en cours...</span>
                </div>
              </ng-template>
            </article>
          </ng-container>

          <ng-template #instructionalState>
            <div class="instruction-grid">
              <article class="guide-card" *ngFor="let guide of assignmentGuides">
                <span class="guide-icon" [innerHTML]="guide.icon"></span>
                <div>
                  <strong>{{ guide.title }}</strong>
                  <p>{{ guide.text }}</p>
                </div>
              </article>
            </div>
          </ng-template>
        </section>

        <section class="panel highlight-panel">
          <header class="panel-head">
            <div>
              <h2>Mes resultats et rendus</h2>
              <p>Un fil chronologique plus propre pour suivre l evaluation de vos travaux.</p>
            </div>
            <span class="panel-badge alt">{{ mySubmissions().length }}</span>
          </header>

          <div class="timeline" *ngIf="mySubmissions().length > 0; else emptyTimeline">
            <article class="timeline-item" *ngFor="let s of mySubmissions()">
              <span class="tl-icon" [class.graded]="s.note != null" [innerHTML]="s.note != null ? icons.award : icons.clock"></span>

              <div class="tl-content">
                <div class="tl-head">
                  <strong>{{ s.devoirTitre }}</strong>
                  <span class="tl-status" [class.pending]="s.note == null">
                    {{ s.note != null ? 'Corrige' : 'En attente' }}
                  </span>
                </div>

                <p class="tl-date">Soumis le {{ formatDate(s.dateSoumission) }}</p>

                <div class="tl-grade" *ngIf="s.note != null; else pendingGrade">
                  <h3 [class.failed]="s.note < 10">{{ s.note }} / 20</h3>
                  <p class="tl-comment" *ngIf="s.commentaire">{{ s.commentaire }}</p>
                </div>

                <ng-template #pendingGrade>
                  <div class="tl-grade pending-copy">
                    Evaluation en attente. Vous verrez la note ici des qu elle sera publiee.
                  </div>
                </ng-template>
              </div>
            </article>
          </div>

          <ng-template #emptyTimeline>
            <div class="empty-state alt">
              <span class="state-icon" [innerHTML]="icons.activity"></span>
              <div>
                <strong>Aucun rendu enregistre</strong>
                <p>Vos futures remises apparaitront ici avec leur statut et la note obtenue.</p>
              </div>
            </div>
          </ng-template>
        </section>
      </div>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      --card: #17182a;
      --border: rgba(99,102,241,0.14);
      --text: #e2e8f0;
      --muted: #94a3b8;
    }

    .assign-shell {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .hero-panel,
    .filter-panel,
    .highlight-panel {
      border-radius: 26px;
      border: 1px solid var(--border);
      background:
        radial-gradient(circle at top right, rgba(99,102,241,0.15), transparent 34%),
        linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
      box-shadow: 0 20px 40px rgba(15,23,42,0.16);
    }

    .hero-panel {
      display: grid;
      grid-template-columns: minmax(280px, 1.1fr) minmax(250px, 0.9fr);
      gap: 18px;
      padding: 24px;
    }

    .hero-copy {
      display: flex;
      flex-direction: column;
      gap: 12px;
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

    .hero-copy h1,
    .filter-copy h2,
    .panel-head h2 {
      margin: 0;
      font-family: var(--font-display);
      color: var(--text);
    }

    .hero-copy h1 {
      font-size: clamp(2rem, 3vw, 2.7rem);
      line-height: 1;
    }

    .hero-copy p,
    .filter-copy p,
    .panel-head p,
    .guide-card p,
    .empty-state p,
    .tl-comment {
      margin: 0;
      color: var(--muted);
      line-height: 1.65;
    }

    .hero-stats {
      display: grid;
      gap: 12px;
      align-content: center;
    }

    .hero-stat {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      border-radius: 20px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      animation: lift 6s ease-in-out infinite;
    }

    .hero-stat:nth-child(2) { animation-delay: 0.8s; }
    .hero-stat:nth-child(3) { animation-delay: 1.6s; }

    .hero-stat-icon,
    .guide-icon,
    .mini-icon,
    .state-icon,
    .tl-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .hero-stat-icon,
    .guide-icon,
    .mini-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      color: #c7d2fe;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
    }

    .hero-stat strong {
      display: block;
      margin-bottom: 4px;
      font-family: var(--font-display);
      font-size: 1.15rem;
    }

    .hero-stat p {
      margin: 0;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 600;
    }

    .filter-panel {
      display: grid;
      grid-template-columns: minmax(220px, 0.8fr) minmax(260px, 1.2fr);
      gap: 18px;
      padding: 22px;
    }

    .filter-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: var(--text);
      font-weight: 700;
      font-size: 0.86rem;
    }

    .form-control {
      min-height: 52px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: #fff;
      padding: 0 14px;
      border-radius: 14px;
      font-family: inherit;
      font-size: 0.96rem;
      outline: none;
    }

    .form-control:focus {
      border-color: rgba(99,102,241,0.4);
      box-shadow: 0 0 0 4px rgba(99,102,241,0.08);
    }

    .format-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .format-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
      gap: 20px;
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .panel-badge {
      min-width: 44px;
      height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: rgba(99,102,241,0.14);
      border: 1px solid rgba(99,102,241,0.18);
      color: #c7d2fe;
      font-family: var(--font-display);
      font-weight: 800;
    }

    .panel-badge.alt {
      background: rgba(59,130,246,0.12);
      border-color: rgba(59,130,246,0.16);
    }

    .instruction-grid {
      display: grid;
      gap: 12px;
    }

    .guide-card,
    .empty-state {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      padding: 18px;
      border-radius: 20px;
      border: 1px dashed rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
    }

    .guide-card strong,
    .empty-state strong {
      display: block;
      margin-bottom: 4px;
      font-family: var(--font-display);
      font-size: 0.95rem;
      color: var(--text);
    }

    .state-icon {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      color: #c7d2fe;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.16);
    }

    .empty-state.alt {
      background: rgba(59,130,246,0.04);
      border-style: solid;
      border-color: rgba(59,130,246,0.12);
    }

    .assign-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 20px;
      border-radius: 22px;
      background:
        radial-gradient(circle at top right, rgba(99,102,241,0.14), transparent 34%),
        var(--card);
      border: 1px solid var(--border);
      box-shadow: 0 16px 30px rgba(15,23,42,0.14);
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .assign-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99,102,241,0.28);
      box-shadow: 0 22px 42px rgba(15,23,42,0.2);
    }

    .card-head,
    .title-wrap,
    .meta-row,
    .status-banner,
    .tl-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .title-wrap h3,
    .tl-content strong {
      margin: 0 0 4px;
      color: #fff;
      font-family: var(--font-display);
      font-size: 1.05rem;
    }

    .title-wrap p,
    .tl-date {
      margin: 0;
      color: var(--muted);
      font-size: 0.84rem;
    }

    .due-date {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 999px;
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.18);
      color: #86efac;
      font-size: 0.8rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .due-date.overdue {
      background: rgba(239,68,68,0.08);
      border-color: rgba(239,68,68,0.18);
      color: #fca5a5;
    }

    .desc {
      margin: 0;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.65;
    }

    .meta-row {
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 600;
    }

    .meta-row span,
    .primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .status-banner {
      padding: 14px 16px;
      border-radius: 18px;
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.18);
      color: #86efac;
    }

    .status-banner p {
      margin: 4px 0 0;
      color: rgba(134,239,172,0.86);
      font-size: 0.82rem;
    }

    .grade-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 68px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(2,6,23,0.25);
      color: #fff;
      font-family: var(--font-display);
      font-weight: 800;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .primary-btn {
      width: fit-content;
      padding: 10px 16px;
      border-radius: 12px;
      border: 1px solid rgba(99,102,241,0.18);
      background: linear-gradient(135deg, rgba(99,102,241,0.95), rgba(79,70,229,0.85));
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 14px 24px rgba(79,70,229,0.18);
      transition: transform 160ms ease, opacity 160ms ease;
    }

    .primary-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }

    .uploading-text {
      color: #fde68a;
      font-size: 0.84rem;
      font-weight: 700;
    }

    .highlight-panel {
      padding: 22px;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 17px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: rgba(255,255,255,0.05);
    }

    .timeline-item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 14px;
      position: relative;
      z-index: 1;
    }

    .tl-icon {
      width: 36px;
      height: 36px;
      border-radius: 14px;
      color: #fde68a;
      background: rgba(234,179,8,0.08);
      border: 1px solid rgba(234,179,8,0.18);
      flex-shrink: 0;
    }

    .tl-icon.graded {
      color: #86efac;
      background: rgba(34,197,94,0.08);
      border-color: rgba(34,197,94,0.18);
    }

    .tl-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border-radius: 18px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
    }

    .tl-status {
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.16);
      color: #86efac;
      font-size: 0.76rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .tl-status.pending {
      background: rgba(234,179,8,0.08);
      border-color: rgba(234,179,8,0.16);
      color: #fde68a;
    }

    .tl-grade {
      padding: 12px;
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
    }

    .tl-grade h3 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.4rem;
      color: #86efac;
    }

    .tl-grade h3.failed {
      color: #fca5a5;
    }

    .pending-copy {
      color: #fde68a;
      font-size: 0.84rem;
      font-weight: 600;
    }

    .center-spinner {
      display: flex;
      justify-content: center;
      padding: 56px 0;
    }

    .big-spinner {
      width: 38px;
      height: 38px;
      border: 3px solid rgba(99,102,241,0.26);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes lift {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @media (max-width: 1120px) {
      .hero-panel,
      .filter-panel,
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 760px) {
      .card-head,
      .panel-head,
      .status-banner,
      .tl-head {
        flex-direction: column;
        align-items: flex-start;
      }

      .primary-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class StudentAssignmentsComponent implements OnInit {
  private readonly asgSvc = inject(AssignmentService);
  private readonly crsSvc = inject(CourseService);
  readonly icons = APP_ICONS;

  readonly assignmentGuides: AssignmentGuide[] = [
    {
      title: 'Choisissez un module',
      text: 'Le filtre active tout de suite la liste des devoirs lies au cours choisi.',
      icon: APP_ICONS.layers,
    },
    {
      title: 'Formats attendus',
      text: 'Les remises sont prevues pour les PDF et les capsules MP4.',
      icon: APP_ICONS.playCircle,
    },
    {
      title: 'Resultats au meme endroit',
      text: 'Vos rendus et vos notes restent visibles dans la colonne de droite.',
      icon: APP_ICONS.award,
    },
  ];

  readonly courses = signal<Course[]>([]);
  readonly loading = signal(false);
  readonly selectedCourseFilter = signal<number | null>(null);
  readonly assignments = signal<Assignment[]>([]);
  readonly mySubmissions = signal<Submission[]>([]);
  readonly uploadingId = signal<number | null>(null);

  ngOnInit(): void {
    this.crsSvc.list().subscribe(res => this.courses.set(res));
    this.loadMySubmissions();
  }

  loadMySubmissions(): void {
    this.asgSvc.mySubmissions().subscribe(res => {
      res.sort((a, b) => new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime());
      this.mySubmissions.set(res);
    });
  }

  onCourseFilterChange(courseId: number | null): void {
    if (courseId == null) {
      this.selectedCourseFilter.set(null);
      this.assignments.set([]);
      return;
    }

    this.selectedCourseFilter.set(courseId);
    this.loading.set(true);

    this.asgSvc.listForCourse(courseId).subscribe({
      next: res => {
        this.assignments.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getSubmissionFor(assignmentId: number): Submission | undefined {
    return this.mySubmissions().find(s => s.devoirId === assignmentId);
  }

  gradedCount(): number {
    return this.mySubmissions().filter(s => s.note != null).length;
  }

  pendingCount(): number {
    return this.mySubmissions().filter(s => s.note == null).length;
  }

  onFileSelected(event: Event, assignmentId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.uploadingId.set(assignmentId);

    this.asgSvc.submit(assignmentId, file).subscribe({
      next: () => {
        this.uploadingId.set(null);
        this.loadMySubmissions();
        alert('Devoir remis avec succes.');
        input.value = '';
      },
      error: err => {
        this.uploadingId.set(null);
        alert(`Erreur lors de la remise. ${err.error?.message || ''}`);
        input.value = '';
      },
    });
  }

  formatDate(value?: string): string {
    if (!value) return '--';
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isOverdue(date: string): boolean {
    return new Date(date).getTime() < Date.now();
  }
}
