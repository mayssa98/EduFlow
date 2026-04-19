export type RiskLevel = 'FAIBLE' | 'MODERE' | 'ELEVE';

export interface CourseResponse {
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
  nbConsultations?: number;
}

export interface SupportResponse {
  id: number;
  coursId?: number;
  titre: string;
  typeFichier: 'PDF' | 'MP4';
  tailleOctets: number;
  dateUpload: string;
}

export interface DevoirResponse {
  id: number;
  coursId: number;
  coursTitre: string;
  titre: string;
  consigne?: string;
  dateDebut?: string;
  dateFin: string;
  noteMax: number;
  dateCreation?: string;
}

export interface SoumissionResponse {
  id: number;
  devoirId: number;
  etudiantId?: number;
  etudiantNom: string;
  contenuTexte?: string;
  cheminFichier?: string;
  typeFichier?: 'PDF' | 'MP4';
  statut: 'SUBMITTED' | 'LATE' | 'GRADED';
  note?: number;
  commentaire?: string;
  dateSoumission: string;
  dateNotation?: string;
}

export interface AnalyseRiskItem {
  etudiantId?: number;
  nom: string;
  prenom: string;
  niveauRisque: RiskLevel;
  score: number;
  justification: string;
  recommandations?: string[];
}

export interface AnalyseResponse {
  analyseId?: number;
  coursId: number;
  dateAnalyse: string;
  utiliseFallback: boolean;
  fournisseur: string;
  summary: string;
  risques: AnalyseRiskItem[];
}

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
