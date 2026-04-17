export type UserRole = 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED';

export interface AuthUser {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthUserResponse {
  user: AuthUser;
}

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: 'ENSEIGNANT' | 'ETUDIANT';
}
export interface OtpVerifyRequest { email: string; code: string; purpose: 'REGISTRATION' | 'PASSWORD_RESET'; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { email: string; code: string; newPassword: string; }
export interface SimpleMessageResponse { message: string; }
