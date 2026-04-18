import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

export interface Assignment {
  id: number;
  titre: string;
  description: string;
  coursId: number;
  coursTitre: string;
  dateEcheance: string;
  dateCreation: string;
  nbSoumissions: number;
}

export interface AssignmentCreateReq {
  coursId: number;
  titre: string;
  description: string;
  dateEcheance: string;
}

export interface AssignmentUpdateReq {
  titre: string;
  description: string;
  dateEcheance: string;
}

export interface Submission {
  id: number;
  devoirId: number;
  devoirTitre: string;
  etudiantId: number;
  etudiantNom: string;
  dateSoumission: string;
  note?: number;
  commentaire?: string;
  cheminFichier: string;
  typeFichier: 'PDF' | 'MP4';
}

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);

  listForCourse(courseId: number): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${API_BASE}/assignments?courseId=${courseId}`, { withCredentials: true });
  }

  get(id: number): Observable<Assignment> {
    return this.http.get<Assignment>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  create(req: AssignmentCreateReq): Observable<Assignment> {
    return this.http.post<Assignment>(`${API_BASE}/assignments`, req, { withCredentials: true });
  }

  update(id: number, req: AssignmentUpdateReq): Observable<Assignment> {
    return this.http.patch<Assignment>(`${API_BASE}/assignments/${id}`, req, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  // Submissions mapping
  submit(id: number, file: File): Observable<Submission> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<Submission>(`${API_BASE}/assignments/${id}/submissions`, fd, { withCredentials: true });
  }

  listSubmissions(id: number): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${API_BASE}/assignments/${id}/submissions`, { withCredentials: true });
  }

  gradeSubmission(submissionId: number, note: number, commentaire?: string): Observable<Submission> {
    return this.http.patch<Submission>(`${API_BASE}/assignments/submissions/${submissionId}/grade`, { note, commentaire }, { withCredentials: true });
  }

  mySubmissions(): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${API_BASE}/assignments/me/submissions`, { withCredentials: true });
  }
}
