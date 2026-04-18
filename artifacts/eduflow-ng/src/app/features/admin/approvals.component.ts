import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { ApprovalService } from '../../core/services/api.services';
import { UserSummary } from '../../core/models/api.models';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule, TranslateModule, StatusChipComponent],
  template: `
    <h1 class="page-title">{{ 'APPROVALS.TITLE' | translate }}</h1>
    <p class="muted">{{ 'APPROVALS.SUBTITLE' | translate }}</p>

    <div class="card glass" *ngIf="error()">
      <p class="error">{{ error() }}</p>
    </div>

    <div class="grid">
      <article class="card glass" *ngFor="let u of pending()" [class.processing]="busy() === u.id">
        <header>
          <div class="ava">{{ initials(u) }}</div>
          <div class="meta">
            <strong>{{ u.prenom }} {{ u.nom }}</strong>
            <span class="muted">{{ u.email }}</span>
          </div>
          <app-status-chip [label]="('STATUS.' + u.statutCompte) | translate" tone="warn"></app-status-chip>
        </header>
        <div class="info">
          <span class="muted">{{ 'APPROVALS.REGISTERED_ON' | translate }}</span>
          <span>{{ u.dateCreation | date:'mediumDate' }}</span>
        </div>
        <textarea *ngIf="rejectingId() === u.id" class="input motif" rows="2"
                  [value]="motif()" (input)="motif.set($any($event.target).value)"
                  placeholder="Motif du rejet (optionnel)…"></textarea>
        <footer>
          <ng-container *ngIf="rejectingId() !== u.id">
            <button class="btn btn-outline btn-sm" (click)="rejectingId.set(u.id); motif.set('')" [disabled]="busy() === u.id">
              {{ 'APPROVALS.REJECT' | translate }}
            </button>
            <button class="btn btn-primary btn-sm" (click)="decide(u, 'APPROVE')" [disabled]="busy() === u.id">
              {{ 'APPROVALS.APPROVE' | translate }}
            </button>
          </ng-container>
          <ng-container *ngIf="rejectingId() === u.id">
            <button class="btn btn-outline btn-sm" (click)="rejectingId.set(null)">Annuler</button>
            <button class="btn btn-danger btn-sm" (click)="decide(u, 'REJECT', motif())" [disabled]="busy() === u.id">
              Confirmer le rejet
            </button>
          </ng-container>
        </footer>
      </article>

      <div class="card glass empty" *ngIf="!pending().length && !error()">
        <p>✓ {{ 'APPROVALS.EMPTY' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size:1.5rem; }
    .muted { color: var(--color-muted-foreground); font-size:.85rem; margin-bottom:18px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:14px; }
    .card { padding:16px; display:flex; flex-direction:column; gap:12px; transition: opacity .2s; }
    .card.processing { opacity:.55; }
    .card header { display:flex; align-items:center; gap:10px; }
    .ava {
      width:42px; height:42px; border-radius:50%;
      background: linear-gradient(135deg, var(--indigo-500), var(--violet-500));
      color:#fff; font-family: var(--font-display); font-weight:700;
      display:flex; align-items:center; justify-content:center;
    }
    .meta { display:flex; flex-direction:column; flex:1; min-width:0; }
    .meta strong { font-family: var(--font-display); font-size:.95rem; }
    .meta .muted { font-size:.8rem; }
    .info { display:flex; justify-content:space-between; padding-top:6px; border-top:1px dashed var(--color-border); }
    footer { display:flex; gap:8px; justify-content:flex-end; }
    .empty { grid-column: 1 / -1; padding:36px; text-align:center; color: var(--color-muted-foreground); }
    .error { color: var(--red-500); }
  `],
})
export class AdminApprovalsComponent implements OnInit {
  private svc = inject(ApprovalService);
  pending = signal<UserSummary[]>([]);
  busy = signal<number | null>(null);
  error = signal<string | null>(null);
  rejectingId = signal<number | null>(null);
  motif = signal<string>('');

  ngOnInit(): void { this.refresh(); }

  initials(u: UserSummary): string {
    return ((u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '')).toUpperCase();
  }

  refresh(): void {
    this.error.set(null);
    this.svc.list().subscribe({
      next: us => this.pending.set(us),
      error: e => this.error.set(e?.error?.message || 'Erreur'),
    });
  }

  decide(u: UserSummary, decision: 'APPROVE' | 'REJECT', motif?: string): void {
    this.busy.set(u.id);
    this.svc.decide(u.id, decision, motif).subscribe({
      next: () => {
        this.busy.set(null);
        this.rejectingId.set(null);
        this.motif.set('');
        this.pending.update(list => list.filter(x => x.id !== u.id));
      },
      error: e => {
        this.busy.set(null);
        if (e?.error?.code === 'ALREADY_PROCESSED') alert('Cette demande a déjà été traitée.');
        else alert(e?.error?.message || 'Erreur');
        this.refresh();
      },
    });
  }
}
