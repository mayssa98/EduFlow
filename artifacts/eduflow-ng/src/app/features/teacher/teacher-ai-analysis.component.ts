import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AiAnalysisResult } from '../../core/services/ai.service';
import { CourseService, Course } from '../../core/services/course.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-teacher-ai-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="ai-shell">
      <div class="header-row">
        <h1>🧠 IA Prédictive & Analyse de Risque</h1>
        <p class="muted">Détectez les étudiants en difficulté grâce au modèle heuristique Gemini.</p>
      </div>
      
      <div class="filter-row">
        <label class="muted">Sélectionner un cours à analyser :</label>
        <select class="form-control" [ngModel]="selectedCourse()" (ngModelChange)="selectedCourse.set(Number($event))">
          <option [value]="null">--- Séléctionner ---</option>
          <option *ngFor="let c of courses()" [value]="c.id">{{ c.titre }}</option>
        </select>
        <button class="btn btn-ai" [disabled]="!selectedCourse() || loading()" (click)="runAnalysis()">
           <span *ngIf="!loading()">✨ Lancer l'Analyse IA</span>
           <span *ngIf="loading()">⏳ Analyse en cours...</span>
        </button>
      </div>

      <div class="results" *ngIf="result() as res">
        <div class="info-banner" *ngIf="res.utiliseFallback">
           ⚠️ Mode Heuristique Activé : L'API principale Gemini est indisponible ou n'a pas répondu, nous utilisons l'algorithme heuristique de secours.
        </div>
        
        <div class="grid-2">
          <!-- Risques -->
          <div class="panel highlight">
            <h2>⚠️ Étudiants à Risque</h2>
            <div class="table-wrap no-border mt-3">
              <table>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Niveau</th>
                    <th>Prob. Échec</th>
                    <th>Facteurs Clés</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of res.predictions">
                    <td><strong>{{ p.etudiantNom }}</strong></td>
                    <td>
                      <span class="badge" [ngClass]="p.niveauRisque.toLowerCase()">
                         {{ p.niveauRisque }}
                      </span>
                    </td>
                    <td>
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill" [ngClass]="p.niveauRisque.toLowerCase()" [style.width]="p.probabiliteEchec + '%'"></div>
                      </div>
                      <span class="muted small ml-2">{{ p.probabiliteEchec | number:'1.0-0' }}%</span>
                    </td>
                    <td class="muted tl-comment">{{ p.facteursCle }}</td>
                  </tr>
                  <tr *ngIf="res.predictions.length === 0">
                    <td colspan="4" class="center muted py-4">Aucun étudiant à risque détecté dans ce cours.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="panel">
            <h2>💡 Recommandations IA</h2>
            <div class="recommendations">
              <div class="rec-card" *ngFor="let r of res.recommandationsGlobales">
                 <div class="rec-type">{{ r.type }}</div>
                 <p class="rec-desc">{{ r.description }}</p>
              </div>
              <div class="empty-state" *ngIf="res.recommandationsGlobales.length === 0">
                 Aucune recommandation globale pour le moment.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .ai-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .header-row h1 { margin: 0; font-size: 1.5rem; color: var(--text); }
    .header-row p { margin: 8px 0 0 0; }
    
    .filter-row { display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .filter-row select { max-width: 300px; flex: 1; }
    
    .form-control { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px; border-radius: 8px; font-family: inherit; }
    .form-control:focus { outline: none; border-color: #6366f1; background: rgba(255,255,255,0.08); }
    
    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s;}
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn:active:not(:disabled) { transform: scale(0.98); }
    .btn-ai { background: linear-gradient(135deg, #10b981, #3b82f6); color: white; border: none; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }

    .info-banner { background: rgba(234,179,8,0.1); border: 1px solid #fde68a; color: #fde68a; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: 500;}

    .grid-2 { display: grid; grid-template-columns: 1fr 400px; gap: 24px; }
    @media (max-width: 1100px) { .grid-2 { grid-template-columns: 1fr; } }
    
    .panel { display: flex; flex-direction: column; gap: 16px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px;}
    .panel h2 { font-size: 1.15rem; color: #fff; margin: 0; }
    
    .highlight { border-color: rgba(239,68,68,0.3); }

    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 12px 16px; text-align: left; font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; border-bottom: 1px dashed var(--border); }
    td { padding: 14px 16px; border-bottom: 1px dashed rgba(255,255,255,0.05); vertical-align: middle; }
    
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    .faible { background: rgba(134,239,172,0.15); color: #86efac; }
    .moyen { background: rgba(250,204,21,0.15); color: #fde047; }
    .eleve { background: rgba(249,115,22,0.15); color: #fdba74; }
    .critique { background: rgba(239,68,68,0.15); color: #fca5a5; }

    .progress-bar-bg { width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; display: inline-block; vertical-align: middle;}
    .progress-bar-fill { height: 100%; border-radius: 4px; background: #6366f1; transition: width 0.3s ease; }
    .progress-bar-fill.faible { background: #10b981; }
    .progress-bar-fill.moyen { background: #eab308; }
    .progress-bar-fill.eleve { background: #f97316; }
    .progress-bar-fill.critique { background: #ef4444; }

    .tl-comment { font-size: 0.85rem; font-style: italic; }
    .ml-2 { margin-left: 8px; } .mt-3 { margin-top: 16px; }
    
    .recommendations { display: flex; flex-direction: column; gap: 12px; }
    .rec-card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; border-left: 4px solid #3b82f6;}
    .rec-type { color: #93c5fd; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;}
    .rec-desc { margin: 0; color: #fff; font-size: 0.95rem; line-height: 1.4; }

    .center { text-align: center; } .py-4 { padding-top: 2rem; padding-bottom: 2rem; }
    .empty-state { padding: 28px; text-align: center; color: var(--muted); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; font-style: italic; }
    
  `]
})
export class TeacherAiAnalysisComponent implements OnInit {
  private aiSvc = inject(AiService);
  private crsSvc = inject(CourseService);

  courses = signal<Course[]>([]);
  selectedCourse = signal<number | null>(null);
  Number = window.Number;
  
  loading = signal(false);
  result = signal<AiAnalysisResult | null>(null);

  ngOnInit() {
    this.crsSvc.list().subscribe(res => {
      this.courses.set(res);
      if (res.length > 0) {
        this.selectedCourse.set(res[0].id);
      }
    });
  }

  runAnalysis() {
    const cid = this.selectedCourse();
    if (!cid) return;
    this.loading.set(true);
    this.result.set(null);
    this.aiSvc.analyze(cid).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: (err) => { 
        this.loading.set(false);
        alert('Erreur lors de l’analyse : ' + (err.error?.message || err.message));
      }
    });
  }
}
