export type AccountStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'LATE' | 'PENDING';
export type FileType = 'PDF' | 'MP4';
export type RiskLevel = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE';

export interface UserSummary {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statutCompte: AccountStatus | string;
  dateCreation: string;
  derniereConnexion?: string;
}

export interface CourseResponse {
  id: number;
  titre: string;
  description: string;
  enseignantId: number;
  enseignantNom: string;
  matiereId?: number;
  matiereNom?: string;
  statut: CourseStatus | string;
  dateCreation: string;
  datePublication?: string;
  nbConsultations?: number;
}

export interface SupportResponse {
  id: number;
  coursId: number;
  titre: string;
  typeFichier: FileType | string;
  tailleOctets: number;
  dateUpload: string;
}

export interface DevoirResponse {
  id: number;
  coursId: number;
  coursTitre: string;
  titre: string;
  consigne?: string;
  dateDebut: string;
  dateFin: string;
  noteMax: number;
  dateCreation?: string;
}

export interface SoumissionResponse {
  id: number;
  devoirId: number;
  etudiantId?: number;
  etudiantNom?: string;
  contenuTexte?: string;
  cheminFichier?: string;
  statut: SubmissionStatus | string;
  note?: number;
  commentaire?: string;
  dateSoumission: string;
  dateNotation?: string;
}

export interface StudentRisk {
  etudiantId: number;
  nom: string;
  prenom: string;
  niveauRisque: RiskLevel | string;
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

