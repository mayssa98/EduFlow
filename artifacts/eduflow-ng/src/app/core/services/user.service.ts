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
  dateNaissance?: string;
  age?: number;
  emailChangeAllowed?: boolean;
  passwordChangeAllowed?: boolean;
  mfaEnabled?: boolean;
  mfaMethod?: 'EMAIL' | 'TOTP' | 'WEBAUTHN' | null;
  currentClassId?: number | null;
  currentClassName?: string | null;
  availableClasses?: ClassOption[];
  pendingClassChange?: PendingClassChangeSummary | null;
}

export interface ClassOption {
  id: number;
  nom: string;
  niveau?: string;
  anneeScolaire?: string;
}

export interface PendingClassChangeSummary {
  id: number;
  statut: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  classeActuelleNom?: string | null;
  classeSouhaiteeNom?: string | null;
  motif?: string | null;
  dateDemande: string;
}

export interface UpdateProfileRequest {
  nom: string;
  prenom: string;
  photoUrl?: string | null;
}
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }
export interface ChangeEmailRequest { currentPassword: string; newEmail: string; }
export interface UpdateMfaRequest { enabled: boolean; method: 'EMAIL' | 'TOTP' | 'WEBAUTHN' | null; }
export interface RequestClassChangeRequest { targetClassId: number; motif?: string; }

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

  uploadAvatar(file: File): Observable<ProfileResponse> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ProfileResponse>(`${API_BASE}/users/me/avatar`, body, { withCredentials: true });
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.patch<void>(`${API_BASE}/users/me/password`, req, { withCredentials: true });
  }

  changeEmail(req: ChangeEmailRequest): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${API_BASE}/users/me/email`, req, { withCredentials: true });
  }

  updateMfa(req: UpdateMfaRequest): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${API_BASE}/users/me/mfa`, req, { withCredentials: true });
  }

  requestClassChange(req: RequestClassChangeRequest): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${API_BASE}/users/me/class-change`, req, { withCredentials: true });
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

  approveTeacher(id: number, decision: 'APPROVE' | 'REJECT'): Observable<UserSummary> {
    return this.http.patch<UserSummary>(`${API_BASE}/admin/approvals/${id}`, { decision }, { withCredentials: true });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${API_BASE}/admin/stats/overview`, { withCredentials: true });
  }
}
