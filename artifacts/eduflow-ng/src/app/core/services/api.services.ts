import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';
import {
  CourseResponse, CourseCreateRequest, CourseUpdateRequest,
  SupportResponse, EnrollmentStatus,
  DevoirResponse, DevoirCreateRequest, DevoirUpdateRequest,
  SoumissionResponse, SoumissionGradeRequest,
  AnalyseResponse,
  UserSummary, UserCreateRequest,
  ProfileResponse, UpdateProfileRequest, ChangePasswordRequest,
} from '../models/api.models';

// ── CourseService ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);

  list(params?: { mine?: boolean; status?: string }): Observable<CourseResponse[]> {
    let p = new HttpParams();
    if (params?.mine) p = p.set('mine', 'true');
    if (params?.status) p = p.set('status', params.status);
    return this.http.get<CourseResponse[]>(`${API_BASE}/courses`, { params: p, withCredentials: true });
  }

  get(id: number): Observable<CourseResponse> {
    return this.http.get<CourseResponse>(`${API_BASE}/courses/${id}`, { withCredentials: true });
  }

  create(req: CourseCreateRequest): Observable<CourseResponse> {
    return this.http.post<CourseResponse>(`${API_BASE}/courses`, req, { withCredentials: true });
  }

  update(id: number, req: CourseUpdateRequest): Observable<CourseResponse> {
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

  uploadFile(id: number, file: File, name?: string): Observable<SupportResponse> {
    const fd = new FormData();
    fd.append('file', file, name ?? file.name);
    return this.http.post<SupportResponse>(`${API_BASE}/courses/${id}/files`, fd, { withCredentials: true });
  }

  deleteFile(courseId: number, fileId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${courseId}/files/${fileId}`, { withCredentials: true });
  }

  enroll(id: number): Observable<void> {
    return this.http.post<void>(`${API_BASE}/courses/${id}/enroll`, {}, { withCredentials: true });
  }

  unenroll(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/courses/${id}/enroll`, { withCredentials: true });
  }

  isEnrolled(id: number): Observable<EnrollmentStatus> {
    return this.http.get<EnrollmentStatus>(`${API_BASE}/courses/${id}/enrolled`, { withCredentials: true });
  }
}

// ── AssignmentService ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);

  list(courseId: number): Observable<DevoirResponse[]> {
    return this.http.get<DevoirResponse[]>(`${API_BASE}/assignments`, {
      params: { courseId: String(courseId) },
      withCredentials: true,
    });
  }

  get(id: number): Observable<DevoirResponse> {
    return this.http.get<DevoirResponse>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  create(req: DevoirCreateRequest): Observable<DevoirResponse> {
    return this.http.post<DevoirResponse>(`${API_BASE}/assignments`, req, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assignments/${id}`, { withCredentials: true });
  }

  update(id: number, req: DevoirUpdateRequest): Observable<DevoirResponse> {
    return this.http.patch<DevoirResponse>(`${API_BASE}/assignments/${id}`, req, { withCredentials: true });
  }

  submissions(assignmentId: number): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/${assignmentId}/submissions`, { withCredentials: true });
  }

  grade(id: number, req: SoumissionGradeRequest): Observable<SoumissionResponse> {
    return this.http.patch<SoumissionResponse>(`${API_BASE}/assignments/submissions/${id}/grade`, req, { withCredentials: true });
  }

  myAssignments(): Observable<DevoirResponse[]> {
    return this.http.get<DevoirResponse[]>(`${API_BASE}/assignments/me`, { withCredentials: true });
  }

  mySubmissions(): Observable<SoumissionResponse[]> {
    return this.http.get<SoumissionResponse[]>(`${API_BASE}/assignments/me/submissions`, { withCredentials: true });
  }

  submit(assignmentId: number, text?: string, file?: File | null): Observable<SoumissionResponse> {
    return this.http.post<SoumissionResponse>(
      `${API_BASE}/assignments/${assignmentId}/submissions`,
      { contenuTexte: text ?? null },
      { withCredentials: true },
    );
  }

  submissionFileUrl(submissionId: number): string {
    return `${API_BASE}/assignments/submissions/${submissionId}/file`;
  }
}

// ── AiAnalysisService ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AiAnalysisService {
  private http = inject(HttpClient);

  analyseCourse(coursId: number): Observable<AnalyseResponse> {
    return this.http.post<AnalyseResponse>(`${API_BASE}/ai/pedagogical-risk-analysis`, { coursId }, { withCredentials: true });
  }
}

// ── ApprovalService ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private http = inject(HttpClient);

  list(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${API_BASE}/admin/approvals`, { withCredentials: true });
  }

  decide(id: number, decision: 'APPROVE' | 'REJECT', motif?: string): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/approvals/${id}`, { decision }, { withCredentials: true });
  }
}

// ── UserService ───────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  list(role?: string, status?: string): Observable<UserSummary[]> {
    let p = new HttpParams();
    if (role) p = p.set('role', role);
    if (status) p = p.set('status', status);
    return this.http.get<UserSummary[]>(`${API_BASE}/admin/users`, { params: p, withCredentials: true });
  }

  create(req: UserCreateRequest): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${API_BASE}/admin/users`, req, { withCredentials: true });
  }

  block(id: number): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/users/${id}/block`, {}, { withCredentials: true });
  }

  unblock(id: number): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/users/${id}/unblock`, {}, { withCredentials: true });
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/admin/users/${id}`, { withCredentials: true });
  }

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${API_BASE}/users/me`, { withCredentials: true });
  }

  updateProfile(req: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${API_BASE}/users/me/profile`, req, { withCredentials: true });
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.patch<void>(`${API_BASE}/users/me/password`, req, { withCredentials: true });
  }
}
