export type UserRole = 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED' | 'PENDING_APPROVAL';

export interface AuthUser {
  id: number;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  status: UserStatus;
  statutCompte?: string;
  photoUrl?: string;
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
export interface VerifyResetOtpRequest { email: string; code: string; }
export interface ResetPasswordRequest { email: string; code: string; newPassword: string; }
export interface GoogleAuthRequest { code: string; redirectUri?: string; }
export interface GoogleOAuthConfigResponse { clientId: string; redirectUri: string; }
export interface SimpleMessageResponse { message: string; }

// --- Nouvelles interfaces 2FA et Google Optionnel ---

export interface MfaChallengeResponse {
  mfaRequired: boolean;
  ticket: string;
  availableMethods: string[];
}

export interface VerifyMfaRequest {
  ticket: string;
  code: string;
}

export interface GoogleRegistrationChallenge {
  requiresRegistration: boolean;
  registerTicket: string;
  email: string;
  nom: string;
  prenom: string;
  photoUrl?: string;
}

export interface GoogleCompleteRequest {
  registerTicket: string;
  optionalPassword?: string;
}
