import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';

import { API_BASE } from './auth.service';
import { CourseService as ModernCourseService } from './course.service';
import { AssignmentService as ModernAssignmentService } from './assignment.service';
import { AiService } from './ai.service';
import { UserService } from './user.service';
import {
  AnalyseResponse,
  CourseResponse,
  DevoirResponse,
  SoumissionResponse,
  SupportResponse,
  UserSummary,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private modern = inject(ModernCourseService);

  list(filters?: { status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; mine?: boolean }): Observable<CourseResponse[]> {
    return this.modern.list().pipe(
      map(cs => filters?.status ? cs.filter(c => c.statut === filters.status) : cs),
      map(cs => cs.map(c => ({ ...c }))),
    );
  }

  get(id: number): Observable<CourseResponse> {
    return this.modern.get(id).pipe(map(c => ({ ...c })));
  }

  publish(id: number): Observable<CourseResponse> {
    return this.modern.publish(id).pipe(map(c => ({ ...c })));
  }

  archive(id: number): Observable<CourseResponse> {
    return this.modern.archive(id).pipe(map(c => ({ ...c })));
  }

  files(id: number): Observable<SupportResponse[]> {
    return this.modern.listFiles(id).pipe(
      map(fs => fs.map(f => ({ ...f, coursId: id }))),
    );
  }

  uploadFile(id: number, file: File, _title?: string): Observable<SupportResponse> {
    return this.modern.uploadFile(id, file).pipe(map(f => ({ ...f, coursId: id })));
  }

  deleteFile(id: number, fileId: number): Observable<void> {
    return this.modern.deleteFile(id, fileId);
  }

  isEnrolled(_courseId: number): Observable<{ enrolled: boolean }> {
    return of({ enrolled: false });
  }

  enroll(_courseId: number): Observable<void> {
    return of(void 0);
  }

  unenroll(_courseId: number): Observable<void> {
    return of(void 0);
  }
}

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);
  private modern = inject(ModernAssignmentService);

  list(courseId: number): Observable<DevoirResponse[]> {
    return this.http.get<DevoirResponse[]>(`${API_BASE}/assignments`, {
      params: { courseId },
      withCredentials: true,
    });
  }

  listForCourse(courseId: number): Observable<DevoirResponse[]> {
    return this.list(courseId);
  }

  get(id: number): Observable<DevoirResponse> {
    return this.http.get<DevoirResponse>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  create(req: {
    coursId: number;
    titre: string;
    consigne?: string;
    dateDebut?: string;
    dateFin?: string;
    dateEcheance?: string;
    noteMax?: number;
    description?: string;
  }): Observable<DevoirResponse> {
    const payload: any = {
      coursId: req.coursId,
      titre: req.titre,
      consigne: req.consigne ?? req.description,
      dateDebut: req.dateDebut ?? new Date().toISOString(),
      dateFin: req.dateFin ?? req.dateEcheance ?? new Date().toISOString(),
      noteMax: req.noteMax ?? 20,
    };
    return this.http.post<DevoirResponse>(`${API_BASE}/assignments`, payload, { withCredentials: true });
  }

  update(id: number, req: { titre?: string; description?: string; dateEcheance?: string }): Observable<DevoirResponse> {
    const payload: any = {
      titre: req.titre,
      consigne: req.description,
      dateFin: req.dateEcheance,
    };
    return this.http.patch<DevoirResponse>(`${API_BASE}/assignments/${id}`, payload, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  submissions(id: number): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/${id}/submissions`, { withCredentials: true });
  }

  listSubmissions(id: number): Observable<SoumissionResponse[]> {
    return this.submissions(id);
  }

  grade(id: number, req: { note: number; commentaire?: string }): Observable<SoumissionResponse> {
    return this.http.patch<SoumissionResponse>(`${API_BASE}/assignments/submissions/${id}/grade`, req, { withCredentials: true });
  }

  gradeSubmission(id: number, note: number, commentaire?: string): Observable<SoumissionResponse> {
    return this.grade(id, { note, commentaire });
  }

  submit(id: number, contenuTexte?: string, file?: File | null): Observable<SoumissionResponse> {
    if (file) {
      return this.modern.submit(id, file).pipe(
        map(s => ({
          ...s,
          statut: s.note != null ? 'GRADED' : 'SUBMITTED',
        })),
      );
    }
    return this.http.post<SoumissionResponse>(`${API_BASE}/assignments/${id}/submissions`, { contenuTexte }, { withCredentials: true });
  }

  mySubmissions(): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/me/submissions`, { withCredentials: true });
  }

  myAssignments(): Observable<DevoirResponse[]> {
    return of([]);
  }

  submissionFileUrl(submissionId: number): string {
    return `${API_BASE}/assignments/submissions/${submissionId}/file`;
  }
}

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
  private ai = inject(AiService);

  analyseCourse(coursId: number): Observable<AnalyseResponse> {
    return this.ai.analyze(coursId).pipe(
      map(r => ({
        coursId,
        dateAnalyse: new Date().toISOString(),
        utiliseFallback: r.utiliseFallback,
        fournisseur: 'Gemini',
        summary: r.statut || 'Analyse terminée',
        risques: (r.predictions ?? []).map(p => {
          const fullName = (p.etudiantNom ?? '').trim();
          const [prenom, ...rest] = fullName.split(' ');
          const niveau = p.niveauRisque === 'MOYEN' ? 'MODERE' : p.niveauRisque === 'CRITIQUE' ? 'ELEVE' : p.niveauRisque;
          return {
            etudiantId: p.etudiantId,
            prenom: prenom || 'Étudiant',
            nom: rest.join(' ') || '',
            niveauRisque: (niveau as 'FAIBLE' | 'MODERE' | 'ELEVE'),
            score: p.probabiliteEchec ?? 0,
            justification: p.facteursCle ?? '',
            recommandations: [],
          };
        }),
      })),
    );
  }
}

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private users = inject(UserService);

  list(): Observable<UserSummary[]> {
    return this.users.getPendingTeachers().pipe(map(us => us.map(u => ({ ...u }))));
  }

  decide(id: number, decision: 'APPROVE' | 'REJECT', _motif?: string): Observable<UserSummary> {
    return this.users.approveTeacher(id, decision).pipe(map(u => ({ ...u })));
  }
}
