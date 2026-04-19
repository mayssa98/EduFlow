import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const NIVEAUX = ['Licence 1 (L1)', 'Licence 2 (L2)', 'Licence 3 (L3)', 'Master 1 (M1)', 'Master 2 (M2)', 'Doctorat', 'Ingénieur'];
const SPECIALITES = [
  'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie',
  'Génie Civil', 'Génie Électrique', 'Génie Mécanique',
  'Sciences Économiques', 'Droit', 'Médecine', 'Pharmacie',
  'Lettres', 'Langues Étrangères', 'Sciences Politiques',
];

@Component({
  selector: 'app-onboarding-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="onboard-shell">
      <div class="topbar">
        <a routerLink="/" class="brand">
          <img src="assets/logo.png" alt="EduFlow" class="brand-logo" />
          <span>EduFlow</span>
        </a>
      </div>

      <div class="profile-card fade-up">
        <div class="step-indicator">
          <div class="step done"></div>
          <div class="step active"></div>
          <div class="step"></div>
        </div>

        <div class="head-icon">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
          </svg>
        </div>
        <h1>Complétez votre profil</h1>
        <p class="muted">Sélectionnez votre niveau d'études et votre spécialité. Ces informations nous aident à personnaliser votre expérience.</p>

        <!-- Niveau -->
        <div class="field-group">
          <label>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            Niveau d'études <span class="required">*</span>
          </label>
          <div class="option-grid">
            <button *ngFor="let n of niveaux" class="option-chip"
                    [class.selected]="selectedNiveau() === n"
                    (click)="selectNiveau(n)">
              {{ n }}
            </button>
            <button class="option-chip add-btn"
                    [class.selected]="showCustomNiveau()"
                    (click)="showCustomNiveau.set(!showCustomNiveau())">
              + Autre
            </button>
          </div>
          <input *ngIf="showCustomNiveau()" class="input" type="text"
                 placeholder="Saisir votre niveau..."
                 [ngModel]="customNiveau()"
                 (ngModelChange)="onCustomNiveau($event)" />
        </div>

        <!-- Spécialité -->
        <div class="field-group">
          <label>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Spécialité <span class="required">*</span>
          </label>
          <div class="option-grid">
            <button *ngFor="let s of specialites" class="option-chip"
                    [class.selected]="selectedSpecialite() === s"
                    (click)="selectSpecialite(s)">
              {{ s }}
            </button>
            <button class="option-chip add-btn"
                    [class.selected]="showCustomSpecialite()"
                    (click)="showCustomSpecialite.set(!showCustomSpecialite())">
              + Autre
            </button>
          </div>
          <input *ngIf="showCustomSpecialite()" class="input" type="text"
                 placeholder="Saisir votre spécialité..."
                 [ngModel]="customSpecialite()"
                 (ngModelChange)="onCustomSpecialite($event)" />
        </div>

        <div class="actions">
          <button class="btn-continue" [disabled]="!isValid()" (click)="save()">
            Continuer
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --bg: #0d0d1a; --card: #1a1a2e; --text: #e2e8f0; --muted: #94a3b8; --primary: #6366f1; display: block; }

    .onboard-shell {
      min-height: 100vh; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 20px;
      background:
        radial-gradient(circle at 15% 25%, rgba(99,102,241,0.12), transparent 40%),
        radial-gradient(circle at 85% 75%, rgba(139,92,246,0.08), transparent 40%),
        var(--bg);
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .topbar { width: 100%; max-width: 640px; }
    .brand { display: flex; align-items: center; gap: 8px; color: var(--text); font-weight: 700; text-decoration: none; }
    .brand-logo { width: 32px; height: 32px; border-radius: 8px; }

    .profile-card {
      width: 100%; max-width: 600px;
      background: var(--card); border: 1px solid rgba(99,102,241,0.2);
      border-radius: 24px; padding: 36px;
      display: flex; flex-direction: column; align-items: center; gap: 22px;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .step-indicator { display: flex; gap: 8px; }
    .step { width: 32px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); }
    .step.active { background: var(--primary); }
    .step.done { background: #22c55e; }

    .head-icon { font-size: 2.6rem; }
    h1 { color: var(--text); font-size: 1.35rem; margin: 0; }
    .muted { color: var(--muted); font-size: 0.88rem; line-height: 1.6; margin: 0; }

    .field-group {
      width: 100%; text-align: left; display: flex; flex-direction: column; gap: 10px;
    }

    .field-group label {
      color: var(--text); font-size: 0.92rem; font-weight: 700;
    }

    .required { color: #f87171; }

    .option-grid {
      display: flex; flex-wrap: wrap; gap: 8px;
    }

    .option-chip {
      padding: 8px 16px; border-radius: 20px; font-size: 0.82rem;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      color: var(--muted); cursor: pointer; font-weight: 600;
      transition: all 0.2s;
    }
    .option-chip:hover { border-color: rgba(99,102,241,0.4); color: var(--text); }
    .option-chip.selected {
      background: rgba(99,102,241,0.15); border-color: var(--primary);
      color: #a5b4fc; box-shadow: 0 0 12px rgba(99,102,241,0.2);
    }
    .add-btn { border-style: dashed; }

    .input {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
      color: #fff; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem;
      width: 100%;
    }
    .input:focus { outline: none; border-color: var(--primary); }

    .actions { display: flex; justify-content: flex-end; width: 100%; }

    .btn-continue {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
      border: none; padding: 12px 28px; border-radius: 10px;
      font-weight: 700; font-size: 0.92rem; cursor: pointer; transition: all 0.2s;
    }
    .btn-continue:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
    .btn-continue:disabled { opacity: 0.4; cursor: not-allowed; }

    .fade-up { animation: fadeUp 0.5s ease-out both; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class OnboardingProfileComponent {
  private router = inject(Router);

  readonly niveaux = NIVEAUX;
  readonly specialites = SPECIALITES;

  selectedNiveau = signal<string | null>(null);
  selectedSpecialite = signal<string | null>(null);
  showCustomNiveau = signal(false);
  showCustomSpecialite = signal(false);
  customNiveau = signal('');
  customSpecialite = signal('');

  selectNiveau(n: string): void {
    this.selectedNiveau.set(n);
    this.showCustomNiveau.set(false);
    this.customNiveau.set('');
  }

  selectSpecialite(s: string): void {
    this.selectedSpecialite.set(s);
    this.showCustomSpecialite.set(false);
    this.customSpecialite.set('');
  }

  onCustomNiveau(v: string): void {
    this.customNiveau.set(v);
    this.selectedNiveau.set(v || null);
  }

  onCustomSpecialite(v: string): void {
    this.customSpecialite.set(v);
    this.selectedSpecialite.set(v || null);
  }

  isValid(): boolean {
    return !!(this.selectedNiveau() && this.selectedSpecialite());
  }

  save(): void {
    if (!this.isValid()) return;
    // Save to localStorage (backend endpoint can be added later)
    localStorage.setItem('eduflow.onboarding.niveau', this.selectedNiveau()!);
    localStorage.setItem('eduflow.onboarding.specialite', this.selectedSpecialite()!);
    localStorage.setItem('eduflow.onboarding.done', 'true');
    this.router.navigateByUrl('/onboarding/complete');
  }
}
