// ── Courses ──────────────────────────────────────────────────────────────────
export interface CourseResponse {
  id: number;
  titre: string;
  description?: string;
  enseignantId: number;
  enseignantNom: string;
  matiereId?: number;
  matiereNom?: string;
  statut: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  dateCreation: string;
  datePublication?: string;
  nbConsultations: number;
}

export interface CourseCreateRequest { titre: string; description?: string; matiereId?: number | null; }
export interface CourseUpdateRequest { titre?: string; description?: string; matiereId?: number | null; }

export interface SupportResponse {
  id: number;
  coursId: number;
  titre: string;
  typeFichier: 'PDF' | 'MP4';
  tailleOctets: number;
  dateUpload: string;
}

export interface EnrollmentStatus { enrolled: boolean; }

// ── Assignments (Devoirs) ─────────────────────────────────────────────────────
export interface DevoirResponse {
  id: number;
  coursId: number;
  coursTitre: string;
  titre: string;
  consigne?: string;
  difficulte?: string;
  dateDebut: string;
  dateFin: string;
  noteMax: number;
  dateCreation: string;
}

export interface DevoirCreateRequest {
  coursId: number;
  titre: string;
  consigne?: string;
  dateDebut: string;
  dateFin: string;
  noteMax: number;
}

export interface DevoirUpdateRequest {
  titre?: string;
  consigne?: string;
  dateDebut?: string;
  dateFin?: string;
  noteMax?: number;
}

export interface SoumissionResponse {
  id: number;
  devoirId: number;
  etudiantId: number;
  etudiantNom: string;
  contenuTexte?: string;
  cheminFichier?: string;
  statut: 'SUBMITTED' | 'LATE' | 'GRADED';
  note?: number;
  commentaire?: string;
  dateSoumission: string;
  dateNotation?: string;
}

export interface SoumissionGradeRequest { note: number; commentaire?: string; }

// ── AI ────────────────────────────────────────────────────────────────────────
export type RiskLevel = 'FAIBLE' | 'MODERE' | 'ELEVE';

export interface StudentRisk {
  etudiantId: number;
  nom: string;
  prenom: string;
  niveauRisque: RiskLevel;
  score: number;
  justification: string;
  recommandations: string[];
}

export interface AnalyseResponse {
  analyseId: number;
  coursId: number;
  dateAnalyse: string;
  utiliseFallback: boolean;
  fournisseur: string;
  summary: string;
  risques: StudentRisk[];
}

// ── Admin / Users ─────────────────────────────────────────────────────────────
export interface UserSummary {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT';
  statutCompte: 'ACTIVE' | 'PENDING' | 'BLOCKED';
  dateCreation: string;
  derniereConnexion?: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT';
}

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
