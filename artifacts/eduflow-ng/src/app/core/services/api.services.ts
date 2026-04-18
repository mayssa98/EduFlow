import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { API_BASE } from './auth.service';
import {
  AnalyseResponse,
  CourseResponse,
  DevoirResponse,
  SoumissionResponse,
  SupportResponse,
  UserSummary,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private http = inject(HttpClient);

  list(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${API_BASE}/admin/approvals`, { withCredentials: true });
  }

  decide(id: number, decision: 'APPROVE' | 'REJECT', motif?: string): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/approvals/${id}`, { decision, motif }, { withCredentials: true });
  }
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);

  list(opts?: { status?: string; mine?: boolean }): Observable<CourseResponse[]> {
    return this.http.get<CourseResponse[]>(`${API_BASE}/courses`, { withCredentials: true }).pipe(
      switchMap(courses => {
        if (!opts?.mine) return of(courses);
        return this.http.get<{ id: number }>(`${API_BASE}/auth/me`, { withCredentials: true }).pipe(
          map(me => courses.filter(c => c.enseignantId === me.id)),
          catchError(() => of(courses)),
        );
      }),
      map(courses => {
        if (!opts?.status) return courses;
        return courses.filter(c => String(c.statut).toUpperCase() === opts.status!.toUpperCase());
      }),
    );
  }

  get(id: number): Observable<CourseResponse> {
    return this.http.get<CourseResponse>(`${API_BASE}/courses/${id}`, { withCredentials: true });
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

  deleteFile(id: number, fileId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${id}/files/${fileId}`, { withCredentials: true });
  }

  isEnrolled(id: number): Observable<{ enrolled: boolean }> {
    return this.http.get<{ enrolled: boolean }>(`${API_BASE}/courses/${id}/enrollment`, { withCredentials: true });
  }

  enroll(id: number): Observable<void> {
    return this.http.post<void>(`${API_BASE}/courses/${id}/enroll`, {}, { withCredentials: true });
  }

  unenroll(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${id}/enroll`, { withCredentials: true });
  }
}

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);

  list(courseId: number): Observable<DevoirResponse[]> {
    return this.http.get<DevoirResponse[]>(`${API_BASE}/assignments?courseId=${courseId}`, { withCredentials: true });
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

  get(id: number): Observable<DevoirResponse> {
    return this.http.get<DevoirResponse>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  submissions(id: number): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/${id}/submissions`, { withCredentials: true });
  }

  grade(id: number, req: { note: number; commentaire?: string }): Observable<SoumissionResponse> {
    return this.http.patch<SoumissionResponse>(`${API_BASE}/assignments/submissions/${id}/grade`, req, { withCredentials: true });
  }

  submissionFileUrl(submissionId: number): string {
    return `${API_BASE}/assignments/submissions/${submissionId}/file`;
  }

  myAssignments(): Observable<DevoirResponse[]> {
    return this.http.get<CourseResponse[]>(`${API_BASE}/courses`, { withCredentials: true }).pipe(
      switchMap(courses => {
        if (!courses.length) return of([] as DevoirResponse[]);
        return forkJoin(
          courses.map(c =>
            this.list(c.id).pipe(catchError(() => of([] as DevoirResponse[]))),
          ),
        ).pipe(map(groups => groups.flat()));
      }),
    );
  }

  mySubmissions(): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/me/submissions`, { withCredentials: true });
  }

  submit(id: number, text?: string): Observable<SoumissionResponse> {
    return this.http.post<SoumissionResponse>(`${API_BASE}/assignments/${id}/submissions`, { contenuTexte: text || null }, { withCredentials: true });
  }
}

@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
  private http = inject(HttpClient);

  analyseCourse(coursId: number): Observable<AnalyseResponse> {
    return this.http.post<AnalyseResponse>(`${API_BASE}/ai/pedagogical-risk-analysis`, { coursId }, { withCredentials: true });
  }
}
