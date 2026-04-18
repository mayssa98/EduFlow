import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

export interface Course {
  id: number;
  titre: string;
  description: string;
  enseignantId: number;
  enseignantNom: string;
  matiereId?: number;
  matiereNom?: string;
  statut: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  dateCreation: string;
  datePublication?: string;
  nbConsultations: number;
}

export interface CourseCreateReq { titre: string; description: string; matiereId?: number | null; }
export interface CourseUpdateReq { titre: string; description: string; matiereId?: number | null; }

export interface SupportFile {
  id: number;
  titre: string;
  typeFichier: 'PDF' | 'MP4';
  tailleOctets: number;
  dateUpload: string;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);

  list(): Observable<Course[]> {
    return this.http.get<Course[]>(`${API_BASE}/courses`, { withCredentials: true });
  }

  get(id: number): Observable<Course> {
    return this.http.get<Course>(`${API_BASE}/courses/${id}`, { withCredentials: true });
  }

  create(req: CourseCreateReq): Observable<Course> {
    return this.http.post<Course>(`${API_BASE}/courses`, req, { withCredentials: true });
  }

  update(id: number, req: CourseUpdateReq): Observable<Course> {
    return this.http.patch<Course>(`${API_BASE}/courses/${id}`, req, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${id}`, { withCredentials: true });
  }

  publish(id: number): Observable<Course> {
    return this.http.patch<Course>(`${API_BASE}/courses/${id}/publish`, {}, { withCredentials: true });
  }

  archive(id: number): Observable<Course> {
    return this.http.patch<Course>(`${API_BASE}/courses/${id}/archive`, {}, { withCredentials: true });
  }

  listFiles(id: number): Observable<SupportFile[]> {
    return this.http.get<SupportFile[]>(`${API_BASE}/courses/${id}/files`, { withCredentials: true });
  }

  uploadFile(id: number, file: File): Observable<SupportFile> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<SupportFile>(`${API_BASE}/courses/${id}/files`, fd, { withCredentials: true });
  }

  deleteFile(id: number, fileId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${id}/files/${fileId}`, { withCredentials: true });
  }
}
