/**
 * Shared TypeScript interfaces matching the backend Java DTOs.
 * Used by components that import from 'core/models/api.models'.
 */

// ── Enums ──────────────────────────────────────────────────────
export type RiskLevel = 'FAIBLE' | 'MODERE' | 'ELEVE';
export type StatutCours = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type TypeFichier = 'PDF' | 'MP4';
export type StatutDevoir = 'SUBMITTED' | 'GRADED' | 'LATE';
export type Role = 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT';
export type StatutCompte = 'ACTIVE' | 'PENDING' | 'BLOCKED' | 'PENDING_APPROVAL';

// ── Course ─────────────────────────────────────────────────────
export interface CourseResponse {
  id: number;
  titre: string;
  description: string;
  enseignantId: number;
  enseignantNom: string;
  matiereId?: number;
  matiereNom?: string;
  statut: StatutCours;
  dateCreation: string;
  datePublication?: string;
  nbConsultations?: number;
}

export interface SupportResponse {
  id: number;
  coursId: number;
  titre: string;
  typeFichier: TypeFichier;
  tailleOctets: number;
  dateUpload: string;
}

// ── Assignment (Devoir) ────────────────────────────────────────
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

export interface SoumissionResponse {
  id: number;
  devoirId: number;
  etudiantId: number;
  etudiantNom: string;
  contenuTexte?: string;
  cheminFichier?: string;
  statut: StatutDevoir;
  note?: number;
  commentaire?: string;
  dateSoumission: string;
  dateNotation?: string;
}

// ── AI Analysis ────────────────────────────────────────────────
export interface StudentRisk {
  etudiantId: number;
  nom: string;
  prenom: string;
  niveauRisque: RiskLevel;
  score: number;
  justification: string;
  recommandations?: string[];
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

// ── Admin / User ───────────────────────────────────────────────
export interface UserSummary {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  statutCompte: StatutCompte;
  dateCreation: string;
  derniereConnexion?: string;
}

export interface StatsOverview {
  usersByRole?: Record<string, number>;
  usersByStatus?: Record<string, number>;
  coursesByStatus?: Record<string, number>;
  pendingTeachers?: number;
  pendingSubmissions?: number;
  topCourses?: { coursId: number; titre: string; nbInscrits: number; nbConsultations: number }[];
  recentActivity?: { type: string; id: number; title: string; actor: string; timestamp: string }[];
}
