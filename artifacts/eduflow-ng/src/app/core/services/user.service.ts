import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

export interface ProfileResponse {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statutCompte: string;
  photoUrl?: string;
  dateCreation: string;
  derniereConnexion?: string;
}

export interface UpdateProfileRequest { nom: string; prenom: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }

export interface UserSummary {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statutCompte: string;
  dateCreation: string;
  derniereConnexion?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${API_BASE}/users/me`, { withCredentials: true });
  }

  updateProfile(req: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>(`${API_BASE}/users/me/profile`, req, { withCredentials: true });
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.patch<void>(`${API_BASE}/users/me/password`, req, { withCredentials: true });
  }

  // --- Admin endpoints ---
  listUsers(role?: string, status?: string): Observable<UserSummary[]> {
    let params: any = {};
    if (role) params['role'] = role;
    if (status) params['status'] = status;
    return this.http.get<UserSummary[]>(`${API_BASE}/admin/users`, { params, withCredentials: true });
  }

  blockUser(id: number): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/users/${id}/block`, {}, { withCredentials: true });
  }

  unblockUser(id: number): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/users/${id}/unblock`, {}, { withCredentials: true });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${API_BASE}/admin/users/${id}`, { withCredentials: true });
  }

  getPendingTeachers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${API_BASE}/admin/approvals`, { withCredentials: true });
  }

  decideTeacherApproval(id: number, decision: 'APPROVE' | 'REJECT'): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/approvals/${id}`, { decision }, { withCredentials: true });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${API_BASE}/admin/stats/overview`, { withCredentials: true });
  }
}
