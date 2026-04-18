import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './auth.service';

export interface AiPrediction {
  etudiantId: number;
  etudiantNom: string;
  niveauRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  probabiliteEchec: number;
  facteursCle: string;
}

export interface AiRecommendation {
  type: string;
  description: string;
}

export interface AiAnalysisResult {
  coursId: number;
  statut: string;
  utiliseFallback: boolean;
  predictions: AiPrediction[];
  recommandationsGlobales: AiRecommendation[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);

  analyze(coursId: number): Observable<AiAnalysisResult> {
    return this.http.post<AiAnalysisResult>(`${API_BASE}/ai/pedagogical-risk-analysis`, { coursId }, { withCredentials: true });
  }
}
