import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SafeHtml } from '@angular/platform-browser';

export interface SidebarItem { route: string; labelKey: string; icon: SafeHtml; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <div class="brand">
        <span class="logo">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="url(#sg)"/>
            <defs><linearGradient id="sg" x1="0" y1="0" x2="28" y2="28">
              <stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/>
            </linearGradient></defs>
            <path d="M8 14l4 4 8-9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </span>
      </div>
      <nav>
        <a *ngFor="let it of items" [routerLink]="it.route" routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: false }"
           class="nav-item" [attr.aria-label]="it.labelKey | translate"
           [attr.title]="it.labelKey | translate">
          <span class="icon" [innerHTML]="it.icon"></span>
          <span class="tooltip">{{ it.labelKey | translate }}</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 64px; flex-shrink: 0; height: 100vh; position: sticky; top: 0;
      background: var(--color-sidebar);
      border-inline-end: 1px solid var(--color-sidebar-border);
      display: flex; flex-direction: column; align-items: center;
      padding: 12px 0; gap: 8px;
    }
    .brand { padding: 6px; margin-bottom: 8px; }
    .logo { display: inline-flex; align-items: center; justify-content: center; }
    nav { display: flex; flex-direction: column; gap: 4px; width: 100%; align-items: center; }
    .nav-item {
      position: relative; display: inline-flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 10px;
      color: var(--color-muted-foreground); transition: background 160ms ease, color 160ms ease;
    }
    .nav-item:hover { background: var(--color-muted); color: var(--color-foreground); }
    .nav-item.active { background: var(--color-sidebar-accent); color: var(--color-sidebar-accent-foreground); }
    .nav-item .icon { display: inline-flex; }
    .tooltip {
      position: absolute; inset-inline-start: 56px; top: 50%; transform: translateY(-50%);
      background: var(--color-card); color: var(--color-foreground);
      padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 500;
      border: 1px solid var(--color-border-strong); white-space: nowrap;
      opacity: 0; pointer-events: none; transition: opacity 140ms ease; z-index: 30;
      box-shadow: var(--shadow-md);
    }
    .nav-item:hover .tooltip { opacity: 1; }
  `],
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
}
