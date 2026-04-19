/**
 * Aggregate API services used by components that import from 'core/services/api.services'.
 * Each service wraps HttpClient calls to the Spring Boot backend.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { API_BASE } from './auth.service';
import {
  CourseResponse,
  SupportResponse,
  DevoirResponse,
  SoumissionResponse,
  AnalyseResponse,
  UserSummary,
} from '../models/api.models';

// ── CourseService ───────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);

  list(opts?: { status?: string; mine?: boolean }): Observable<CourseResponse[]> {
    let params = new HttpParams();
    if (opts?.status) params = params.set('status', opts.status);
    return this.http.get<CourseResponse[]>(`${API_BASE}/courses`, { params, withCredentials: true });
  }

  get(id: number): Observable<CourseResponse> {
    return this.http.get<CourseResponse>(`${API_BASE}/courses/${id}`, { withCredentials: true });
  }

  create(req: { titre: string; description?: string; matiereId?: number | null }): Observable<CourseResponse> {
    return this.http.post<CourseResponse>(`${API_BASE}/courses`, req, { withCredentials: true });
  }

  update(id: number, req: { titre?: string; description?: string; matiereId?: number | null }): Observable<CourseResponse> {
    return this.http.patch<CourseResponse>(`${API_BASE}/courses/${id}`, req, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${id}`, { withCredentials: true });
  }

  publish(id: number): Observable<CourseResponse> {
    return this.http.patch<CourseResponse>(`${API_BASE}/courses/${id}/publish`, {}, { withCredentials: true });
  }

  archive(id: number): Observable<CourseResponse> {
    return this.http.patch<CourseResponse>(`${API_BASE}/courses/${id}/archive`, {}, { withCredentials: true });
  }

  files(id: number): Observable<SupportResponse[]> {
    return this.http.get<SupportResponse[]>(`${API_BASE}/courses/${id}/files`, { withCredentials: true });
  }

  uploadFile(id: number, file: File, title?: string): Observable<SupportResponse> {
    const fd = new FormData();
    fd.append('file', file);
    if (title) fd.append('title', title);
    return this.http.post<SupportResponse>(`${API_BASE}/courses/${id}/files`, fd, { withCredentials: true });
  }

  deleteFile(courseId: number, fileId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${courseId}/files/${fileId}`, { withCredentials: true });
  }

  // TODO: Enrollment endpoints — backend does not yet expose these.
  isEnrolled(courseId: number): Observable<{ enrolled: boolean }> {
    return of({ enrolled: false });
  }

  enroll(courseId: number): Observable<void> {
    return of(void 0);
  }

  unenroll(courseId: number): Observable<void> {
    return of(void 0);
  }
}

// ── AssignmentService ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);

  list(courseId: number): Observable<DevoirResponse[]> {
    return this.http.get<DevoirResponse[]>(`${API_BASE}/assignments?courseId=${courseId}`, { withCredentials: true });
  }

  get(id: number): Observable<DevoirResponse> {
    return this.http.get<DevoirResponse>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  create(req: {
    coursId: number;
    titre: string;
    consigne?: string;
    dateDebut: string;
    dateFin: string;
    noteMax: number;
  }): Observable<DevoirResponse> {
    return this.http.post<DevoirResponse>(`${API_BASE}/assignments`, req, { withCredentials: true });
  }

  update(id: number, req: Partial<DevoirResponse>): Observable<DevoirResponse> {
    return this.http.patch<DevoirResponse>(`${API_BASE}/assignments/${id}`, req, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  listSubmissions(id: number): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/${id}/submissions`, { withCredentials: true });
  }

  /** Alias used by submissions-grade component */
  submissions(id: number): Observable<SoumissionResponse[]> {
    return this.listSubmissions(id);
  }

  grade(submissionId: number, req: { note: number; commentaire?: string }): Observable<SoumissionResponse> {
    return this.http.patch<SoumissionResponse>(
      `${API_BASE}/assignments/submissions/${submissionId}/grade`,
      req,
      { withCredentials: true },
    );
  }

  submissionFileUrl(submissionId: number): string {
    return `${API_BASE}/assignments/submissions/${submissionId}/file`;
  }

  mySubmissions(): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/me/submissions`, { withCredentials: true });
  }

  // TODO: Backend does not expose a filtered "my assignments" endpoint yet.
  myAssignments(): Observable<DevoirResponse[]> {
    return this.http.get<DevoirResponse[]>(`${API_BASE}/assignments/me/submissions`, { withCredentials: true })
      .pipe(/* stub: returns submissions, not assignments */);
  }

  submit(assignmentId: number, text?: string, file?: File | null): Observable<SoumissionResponse> {
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      if (text) fd.append('contenuTexte', text);
      return this.http.post<SoumissionResponse>(
        `${API_BASE}/assignments/${assignmentId}/submissions`,
        fd,
        { withCredentials: true },
      );
    }
    return this.http.post<SoumissionResponse>(
      `${API_BASE}/assignments/${assignmentId}/submissions`,
      { contenuTexte: text },
      { withCredentials: true },
    );
  }
}

// ── AiAnalysisService ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
  private http = inject(HttpClient);

  analyseCourse(coursId: number): Observable<AnalyseResponse> {
    return this.http.post<AnalyseResponse>(
      `${API_BASE}/ai/pedagogical-risk-analysis`,
      { coursId },
      { withCredentials: true },
    );
  }
}

// ── ApprovalService ────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private http = inject(HttpClient);

  list(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${API_BASE}/admin/approvals`, { withCredentials: true });
  }

  decide(id: number, decision: 'APPROVE' | 'REJECT', motif?: string): Observable<UserSummary> {
    return this.http.patch<UserSummary>(
      `${API_BASE}/admin/approvals/${id}`,
      { decision, motif },
      { withCredentials: true },
    );
  }
}
