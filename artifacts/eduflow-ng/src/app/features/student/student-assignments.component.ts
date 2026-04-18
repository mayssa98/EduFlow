import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignmentService, Assignment, Submission } from '../../core/services/assignment.service';
import { CourseService, Course } from '../../core/services/course.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="assign-shell">
      <div class="header-row">
        <h1>📝 Mes Devoirs & Travaux à rendre</h1>
      </div>

      <div class="filter-row">
        <label class="muted">Filtrer par cours :</label>
        <select class="form-control" [ngModel]="selectedCourseFilter()" (ngModelChange)="onCourseFilterChange($event)">
          <option [value]="null">Sélectionnez un cours pour voir les devoirs...</option>
          <option *ngFor="let c of courses()" [value]="c.id">{{ c.titre }}</option>
        </select>
      </div>

      <div class="grid-2" *ngIf="!loading(); else spinner">
        
        <!-- Left: Pending Assignments -->
        <div class="panel">
          <h2>Devoirs à faire</h2>
          <div class="empty-state" *ngIf="!selectedCourseFilter()">
            Veuillez sélectionner un cours ci-dessus !
          </div>
          <div class="empty-state" *ngIf="selectedCourseFilter() && assignments().length === 0">
            Aucun devoir de prévu pour ce cours. 🎉
          </div>
          
          <div class="assign-card" *ngFor="let a of assignments()">
            <div class="card-header">
              <h3>{{ a.titre }}</h3>
              <span class="due-date" [class.overdue]="isOverdue(a.dateEcheance)">
                ⏳ {{ formatDate(a.dateEcheance) }}
              </span>
            </div>
            <p class="desc">{{ a.description || 'Aucune consigne détaillée.' }}</p>

            <!-- Show submission status for this assignment if exists -->
            <ng-container *ngIf="getSubmissionFor(a.id) as sub; else notSubmitted">
               <div class="status-banner submitted">
                 ✔️ Rendu le {{ formatDate(sub.dateSoumission) }}
                 <span *ngIf="sub.note" class="grade-pill">Note: {{ sub.note }}/20</span>
               </div>
            </ng-container>
            <ng-template #notSubmitted>
               <div class="actions">
                 <input type="file" #fileInput (change)="onFileSelected($event, a.id)" accept="application/pdf,video/mp4" style="display:none" />
                 <button class="btn btn-primary" (click)="fileInput.click()" [disabled]="isOverdue(a.dateEcheance)">
                   {{ isOverdue(a.dateEcheance) ? 'Délai dépassé' : 'Soumettre mon travail' }}
                 </button>
                 <span class="uploading-text mt-2" *ngIf="uploadingId() === a.id">⏳ Envoi...</span>
               </div>
            </ng-template>
          </div>
        </div>

        <!-- Right: My Grades & Submissions -->
        <div class="panel highlight-panel">
          <h2>📊 Mes résultats et rendus</h2>
          
          <div class="timeline">
            <div class="timeline-item" *ngFor="let s of mySubmissions()">
              <div class="tl-icon" [class.graded]="s.note != null">
                {{ s.note != null ? '📝' : '⏳' }}
              </div>
              <div class="tl-content">
                <strong>{{ s.devoirTitre }}</strong>
                <p class="tl-date">Soumis le {{ formatDate(s.dateSoumission) }}</p>
                <div class="tl-grade" *ngIf="s.note != null">
                   <h3 [class.failed]="s.note < 10">{{ s.note }} / 20</h3>
                   <p class="tl-comment" *ngIf="s.commentaire">"{{ s.commentaire }}"</p>
                </div>
                <div class="tl-grade pending" *ngIf="s.note == null">
                   En attente d'évaluation
                </div>
              </div>
            </div>
            <div class="empty-state" *ngIf="mySubmissions().length === 0">
               Vous n'avez encore rien rendu !
            </div>
          </div>
        </div>

      </div>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .assign-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
    .header-row h1 { margin: 0; font-size: 1.5rem; color: var(--text); }
    
    .filter-row { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .filter-row select { max-width: 350px; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
    @media (max-width: 1000px) { .grid-2 { grid-template-columns: 1fr; } }
    
    .panel { display: flex; flex-direction: column; gap: 16px; }
    .panel h2 { font-size: 1.15rem; color: #fff; margin: 0 0 8px 0; }
    
    .highlight-panel { background: rgba(99,102,241,0.03); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
    
    .empty-state { padding: 28px; text-align: center; color: var(--muted); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; font-style: italic; }
    
    .form-control { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px; border-radius: 8px; font-family: inherit; }
    .form-control:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.08); }
    
    .assign-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: transform 0.2s; }
    .assign-card:hover { transform: translateY(-2px); border-color: rgba(99,102,241,0.5); }
    
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .card-header h3 { margin: 0; font-size: 1.1rem; color: #fff; }
    .due-date { font-size: 0.85rem; font-weight: 600; color: #86efac; background: rgba(134,239,172,0.1); padding: 4px 8px; border-radius: 6px; }
    .due-date.overdue { color: #fca5a5; background: rgba(239,68,68,0.1); }
    
    .desc { font-size: 0.9rem; color: var(--muted); line-height: 1.5; margin-bottom: 20px; }
    
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; transition: opacity 0.2s;}
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    
    .status-banner { padding: 12px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; display: flex; justify-content: space-between; align-items: center;}
    .status-banner.submitted { background: rgba(134,239,172,0.1); color: #86efac; border: 1px solid rgba(134,239,172,0.2); }
    .grade-pill { background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 12px; }
    
    .uploading-text { font-size: 0.85rem; color: #fde68a; display: block; text-align: center; font-weight: 600; }
    .mt-2 { margin-top: 8px; }

    /* Timeline Styles */
    .timeline { display: flex; flex-direction: column; gap: 20px; position: relative; margin-top: 10px; }
    .timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.05); }
    
    .timeline-item { display: flex; gap: 16px; position: relative; z-index: 1; }
    .tl-icon { width: 32px; height: 32px; border-radius: 50%; background: #1e1e35; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
    .tl-icon.graded { border-color: #8b5cf6; background: rgba(139,92,246,0.1); }
    
    .tl-content { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px; flex: 1; }
    .tl-content strong { color: #fff; font-size: 0.95rem; }
    .tl-date { margin: 4px 0 12px 0; font-size: 0.8rem; color: var(--muted); }
    
    .tl-grade { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; }
    .tl-grade h3 { margin: 0; color: #86efac; font-size: 1.4rem; font-family: var(--font-display); font-weight: 700; }
    .tl-grade h3.failed { color: #fca5a5; }
    .tl-comment { margin: 8px 0 0 0; font-size: 0.85rem; color: #cbd5e1; font-style: italic; }
    .tl-grade.pending { background: rgba(234,179,8,0.1); color: #fde68a; font-size: 0.85rem; font-weight: 600; text-align: center; padding: 8px;}

    .center-spinner { display: flex; justify-content: center; padding: 40px; }
    .big-spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.3); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class StudentAssignmentsComponent implements OnInit {
  private asgSvc = inject(AssignmentService);
  private crsSvc = inject(CourseService);

  courses = signal<Course[]>([]);
  loading = signal(false);
  
  selectedCourseFilter = signal<number | null>(null);
  assignments = signal<Assignment[]>([]);
  
  mySubmissions = signal<Submission[]>([]);
  uploadingId = signal<number | null>(null);

  ngOnInit() {
    // Load student's courses (all published ones)
    this.crsSvc.list().subscribe(res => {
      this.courses.set(res);
    });

    // Load ALL submissions for this student across all assignments to display the grading timeline
    this.loadMySubmissions();
  }

  loadMySubmissions() {
    this.asgSvc.mySubmissions().subscribe(res => {
      // Sort so most recent is first
      res.sort((a,b) => new Date(b.dateSoumission).getTime() - new Date(a.dateSoumission).getTime());
      this.mySubmissions.set(res);
    });
  }

  onCourseFilterChange(val: string) {
    if (!val || val === 'null') {
      this.selectedCourseFilter.set(null);
      this.assignments.set([]);
      return;
    }
    const cid = Number(val);
    this.selectedCourseFilter.set(cid);
    
    this.loading.set(true);
    this.asgSvc.listForCourse(cid).subscribe({
      next: (res) => { this.assignments.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getSubmissionFor(assignmentId: number): Submission | undefined {
    return this.mySubmissions().find(s => s.devoirId === assignmentId);
  }

  onFileSelected(event: Event, assignmentId: number) {
    const el = event.target as HTMLInputElement;
    if (el.files && el.files.length > 0) {
      const file = el.files[0];
      this.uploadingId.set(assignmentId);
      this.asgSvc.submit(assignmentId, file).subscribe({
        next: () => {
          this.uploadingId.set(null);
          // Reload timeline / submissions status
          this.loadMySubmissions();
          alert('Devoir remis avec succès !');
        },
        error: (err) => {
          this.uploadingId.set(null);
          alert('Erreur lors de la remise. ' + (err.error?.message || ''));
        }
      });
    }
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  isOverdue(d: string): boolean {
    return new Date(d).getTime() < new Date().getTime();
  }
}
