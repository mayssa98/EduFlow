import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserService, UserSummary } from '../../core/services/user.service';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { ICONS } from '../../shared/icons';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule, TranslateModule, StatusChipComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ 'APPROVALS.TITLE' | translate }}</h1>
        <p class="muted">{{ 'APPROVALS.SUBTITLE' | translate }}</p>
      </div>
      <span class="badge badge-warn" *ngIf="pending().length > 0">
        {{ 'APPROVALS.COUNT' | translate: { count: pending().length } }}
      </span>
    </div>

    <div class="loading-center" *ngIf="loading()">
      <div class="spinner spinner-lg"></div>
    </div>

    <div class="grid-auto-fill-320 fade-up" *ngIf="!loading()">
      <article class="card glass teacher-card" *ngFor="let u of pending()" [class.processing]="busy() === u.id">
        <header>
          <div class="avatar">{{ initials(u) }}</div>
          <div class="meta">
            <strong>{{ u.prenom }} {{ u.nom }}</strong>
            <span class="muted">{{ u.email }}</span>
          </div>
          <app-status-chip [label]="'STATUS.PENDING_APPROVAL' | translate" tone="warn"></app-status-chip>
        </header>

        <div class="info">
          <span class="muted">{{ 'APPROVALS.REGISTERED_ON' | translate }}</span>
          <span>{{ formatDate(u.dateCreation) }}</span>
        </div>

        <footer>
          <button class="btn btn-outline btn-sm" (click)="decide(u, 'REJECT')" [disabled]="busy() === u.id">
            <span [innerHTML]="iconClose"></span>
            {{ 'APPROVALS.REJECT' | translate }}
          </button>
          <button class="btn btn-primary btn-sm" (click)="decide(u, 'APPROVE')" [disabled]="busy() === u.id">
            <span [innerHTML]="iconCheck"></span>
            {{ 'APPROVALS.APPROVE' | translate }}
          </button>
        </footer>
      </article>

      <div class="empty-state" *ngIf="!pending().length" [style.grid-column]="'1 / -1'">
        <span [innerHTML]="iconCheckCircle" style="color: var(--green-500); display:inline-flex; margin-bottom: 10px;"></span>
        <p>{{ 'APPROVALS.EMPTY' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .teacher-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: opacity 160ms ease, transform 200ms ease, box-shadow 200ms ease;
    }
    .teacher-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .teacher-card.processing { opacity: 0.55; pointer-events: none; }
    .teacher-card header { display: flex; align-items: center; gap: 10px; }
    .meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .meta strong { font-family: var(--font-display); font-size: 0.95rem; }
    .meta .muted { font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .info {
      display: flex;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1px dashed var(--color-border);
      font-size: 0.85rem;
    }
    .info .muted { color: var(--color-muted-foreground); }
    footer { display: flex; gap: 8px; justify-content: flex-end; }
    .empty-state p { margin: 0; }
  `],
})
export class AdminApprovalsComponent implements OnInit {
  private userSvc = inject(UserService);
  private translate = inject(TranslateService);

  readonly iconCheck = ICONS.check;
  readonly iconClose = ICONS.close;
  readonly iconCheckCircle = ICONS.checkCircle;

  pending = signal<UserSummary[]>([]);
  busy = signal<number | null>(null);
  loading = signal(true);

  ngOnInit(): void { this.refresh(); }

  initials(u: UserSummary): string {
    return ((u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '')).toUpperCase();
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(this.translate.currentLang || 'en', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.userSvc.getPendingTeachers().subscribe({
      next: us => { this.pending.set(us ?? []); this.loading.set(false); },
      error: () => { this.pending.set([]); this.loading.set(false); },
    });
  }

  decide(u: UserSummary, decision: 'APPROVE' | 'REJECT'): void {
    const key = decision === 'APPROVE' ? 'APPROVALS.APPROVE_CONFIRM' : 'APPROVALS.REJECT_CONFIRM';
    if (!confirm(this.translate.instant(key))) return;
    this.busy.set(u.id);
    this.userSvc.approveTeacher(u.id, decision).subscribe({
      next: () => {
        this.busy.set(null);
        this.pending.update(list => list.filter(x => x.id !== u.id));
      },
      error: e => {
        this.busy.set(null);
        alert(e?.error?.message || this.translate.instant('ERRORS.GENERIC'));
        this.refresh();
      },
    });
  }
}
