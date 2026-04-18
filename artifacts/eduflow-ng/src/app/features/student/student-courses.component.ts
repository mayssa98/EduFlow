import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService, Course, SupportFile } from '../../core/services/course.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="courses-shell">
      <div class="header-row">
        <h1>📚 Cours Disponibles</h1>
      </div>

      <div class="grid-wrap" *ngIf="!loading(); else spinner">
        <div class="course-card" *ngFor="let c of courses()">
          <div class="card-header">
            <h3>{{ c.titre }}</h3>
            <span class="badge">{{ c.enseignantNom }}</span>
          </div>
          <p class="desc">{{ truncate(c.description) }}</p>
          <div class="card-footer">
            <span class="date">Ajouté le {{ formatDate(c.datePublication) }}</span>
            <button class="btn btn-outline" (click)="openCourse(c)">Consulter</button>
          </div>
        </div>

        <div class="empty-state" *ngIf="courses().length === 0">
          <p>Aucun cours n'est actuellement disponible.</p>
        </div>
      </div>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>

      <!-- Modal View Course Files -->
      <div class="modal-overlay" *ngIf="showFilesModal()">
        <div class="modal large">
          <h3>📂 Supports pour : {{ selectedCourse()?.titre }}</h3>
          <p class="muted mb-4">{{ selectedCourse()?.description }}</p>

          <table class="t-files" *ngIf="files().length > 0">
            <tbody>
              <tr *ngFor="let f of files()">
                <td>
                  <span class="icon">{{ f.typeFichier === 'PDF' ? '📄' : '🎥' }}</span>
                  {{ f.titre }}
                </td>
                <td class="muted small">{{ formatBytes(f.tailleOctets) }}</td>
                <td align="right">
                  <a [href]="getFileUrl(selectedCourse()!.id, f.id)" target="_blank" class="btn btn-primary btn-sm">Ouvrir</a>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="muted center" *ngIf="files().length === 0">Aucun support disponible pour ce cours.</p>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeFilesModal()">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --card: #1a1a2e; --border: rgba(99,102,241,0.2); --text: #e2e8f0; --muted: #94a3b8; }
    .courses-shell { padding: 28px; display: flex; flex-direction: column; gap: 24px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .header-row h1 { margin: 0; font-size: 1.5rem; color: var(--text); }

    .grid-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    
    .course-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
    .course-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); border-color: #6366f1; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .card-header h3 { margin: 0; font-size: 1.15rem; color: #fff; line-height: 1.3; }
    .badge { background: rgba(99,102,241,0.15); color: #c4b5fd; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; margin-left: 10px; }
    
    .desc { margin: 0; color: var(--muted); font-size: 0.9rem; line-height: 1.5; flex: 1; margin-bottom: 20px; }
    
    .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
    .date { font-size: 0.8rem; color: var(--muted); }
    
    .empty-state { grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 40px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1); }

    .btn-outline { background: transparent; border: 1px solid #6366f1; color: #c4b5fd; padding: 6px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-outline:hover { background: rgba(99,102,241,0.1); color: #fff; }
    
    .t-files { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .t-files td { padding: 12px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); }
    .icon { margin-right: 8px; font-size: 1.2rem; }

    .mb-4 { margin-bottom: 1.2rem; }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #1e1e35; border: 1px solid var(--border); border-radius: 16px; padding: 28px; max-width: 420px; width: 90%; display: flex; flex-direction: column; gap: 16px; }
    .modal.large { max-width: 600px; }
    .modal h3 { margin: 0; color: var(--text); }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    
    .btn-cancel { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 8px 16px; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-sm { padding: 6px 12px; font-size: 0.85rem; }

    .center-spinner { display: flex; justify-content: center; padding: 40px; }
    .big-spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.3); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class StudentCoursesComponent implements OnInit {
  private courseSvc = inject(CourseService);

  courses = signal<Course[]>([]);
  loading = signal(true);
  
  showFilesModal = signal(false);
  selectedCourse = signal<Course | null>(null);
  files = signal<SupportFile[]>([]);

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.courseSvc.list().subscribe({
      next: (res) => { this.courses.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCourse(c: Course) {
    this.selectedCourse.set(c);
    this.courseSvc.listFiles(c.id).subscribe(res => this.files.set(res));
    this.showFilesModal.set(true);
  }

  closeFilesModal() { this.showFilesModal.set(false); }

  getFileUrl(courseId: number, fileId: number): string {
    return `http://localhost:8081/api/courses/${courseId}/files/${fileId}`;
  }

  truncate(text: string): string {
    if (!text) return '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024, i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
  }
}
