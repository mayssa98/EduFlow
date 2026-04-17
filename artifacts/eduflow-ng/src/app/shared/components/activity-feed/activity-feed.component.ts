import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ActivityTone = 'info' | 'success' | 'warn' | 'danger';
export interface ActivityItem { tone: ActivityTone; title: string; meta?: string; time?: string; }

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="feed">
      <li *ngFor="let it of items" class="item fade-up">
        <span class="bullet" [class]="'b-' + it.tone"></span>
        <div class="body">
          <div class="title">{{ it.title }}</div>
          <div class="meta" *ngIf="it.meta">{{ it.meta }}</div>
        </div>
        <span class="time" *ngIf="it.time">{{ it.time }}</span>
      </li>
      <li class="empty" *ngIf="!items?.length">{{ emptyText }}</li>
    </ul>
  `,
  styles: [`
    .feed { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .item {
      display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center;
      padding: 10px 4px; border-bottom: 1px dashed var(--color-border);
    }
    .item:last-child { border-bottom: none; }
    .bullet { width: 8px; height: 8px; border-radius: 50%; }
    .b-info    { background: var(--indigo-500); box-shadow: 0 0 0 4px rgba(99,102,241,0.15); }
    .b-success { background: var(--green-500); box-shadow: 0 0 0 4px rgba(34,197,94,0.15); }
    .b-warn    { background: var(--amber-400); box-shadow: 0 0 0 4px rgba(251,191,36,0.18); }
    .b-danger  { background: var(--red-500);   box-shadow: 0 0 0 4px rgba(239,68,68,0.18); }
    .title { font-size: 0.86rem; font-weight: 500; }
    .meta  { font-size: 0.76rem; color: var(--color-muted-foreground); margin-top: 2px; }
    .time  { font-size: 0.74rem; color: var(--color-muted-foreground); }
    .empty { padding: 20px; text-align: center; color: var(--color-muted-foreground); font-size: 0.85rem; }
  `],
})
export class ActivityFeedComponent {
  @Input() items: ActivityItem[] = [];
  @Input() emptyText = 'No recent activity';
}
