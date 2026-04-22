import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BrandMarkComponent } from '../brand/brand-mark.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export interface SidebarItem {
  route: string;
  labelKey: string;
  icon: string;
  shortLabel?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, BrandMarkComponent, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <div class="brand">
        <app-brand-mark [showText]="false" [size]="38"></app-brand-mark>
      </div>
      <nav>
        <a *ngFor="let it of items" [routerLink]="it.route" routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: false }"
           class="nav-item" [attr.aria-label]="it.labelKey | translate"
          [attr.title]="it.labelKey | translate">
          <span class="active-beam"></span>
          <span class="ambient-orb"></span>
          <span class="icon-shell">
            <span class="icon" [innerHTML]="it.icon | safeHtml"></span>
          </span>
          <span class="name">{{ it.shortLabel || (it.labelKey | translate) }}</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 104px; flex-shrink: 0; height: 100vh; position: sticky; top: 0;
      background: var(--color-sidebar);
      border-inline-end: 1px solid var(--color-sidebar-border);
      display: flex; flex-direction: column; align-items: center;
      padding: 14px 10px; gap: 10px;
    }
    .brand {
      width: 100%;
      display: flex;
      justify-content: center;
      padding: 4px 0 14px;
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    nav { display: flex; flex-direction: column; gap: 10px; width: 100%; align-items: center; }
    .nav-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 78px;
      padding: 10px 8px;
      border-radius: 18px;
      color: var(--color-muted-foreground);
      border: 1px solid rgba(255,255,255,0.04);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)),
        rgba(255,255,255,0.02);
      overflow: hidden;
      transition: background 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
    }
    .nav-item:hover {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)),
        rgba(255,255,255,0.03);
      color: var(--color-foreground);
      border-color: rgba(99,102,241,0.2);
      transform: translateY(-2px);
      box-shadow: 0 16px 30px rgba(15,23,42,0.18);
    }
    .nav-item.active {
      background:
        radial-gradient(circle at top, rgba(99,102,241,0.2), transparent 60%),
        linear-gradient(180deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      color: var(--color-sidebar-accent-foreground);
      border-color: rgba(99,102,241,0.32);
      box-shadow: 0 18px 32px rgba(79,70,229,0.18);
    }
    .ambient-orb {
      position: absolute;
      inset: auto auto -16px -10px;
      width: 52px;
      height: 52px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(96,165,250,0.24), transparent 68%);
      opacity: 0;
      transform: scale(0.7);
      transition: opacity 180ms ease, transform 180ms ease;
      pointer-events: none;
    }
    .nav-item:hover .ambient-orb,
    .nav-item.active .ambient-orb {
      opacity: 1;
      transform: scale(1);
    }
    .active-beam {
      position: absolute;
      inset-inline-start: -1px;
      top: 14px;
      bottom: 14px;
      width: 3px;
      border-radius: 999px;
      background: linear-gradient(180deg, #60a5fa, #6366f1);
      opacity: 0;
      transform: scaleY(0.4);
      transition: opacity 180ms ease, transform 180ms ease;
    }
    .nav-item.active .active-beam { opacity: 1; transform: scaleY(1); }
    .icon-shell {
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(99,102,241,0.16), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.2);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
      transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
    }
    .nav-item:hover .icon-shell,
    .nav-item.active .icon-shell {
      transform: translateY(-1px);
      background: linear-gradient(135deg, rgba(99,102,241,0.24), rgba(56,189,248,0.16));
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.42), 0 18px 28px rgba(37,99,235,0.18);
    }
    .icon {
      display: inline-flex;
      color: currentColor;
      animation: navIconFloat 5.4s ease-in-out infinite;
    }
    .nav-item:nth-child(2) .icon { animation-delay: 0.35s; }
    .nav-item:nth-child(3) .icon { animation-delay: 0.7s; }
    .nav-item:nth-child(4) .icon { animation-delay: 1.05s; }
    .nav-item:nth-child(5) .icon { animation-delay: 1.4s; }
    .nav-item:nth-child(6) .icon { animation-delay: 1.75s; }
    .icon :is(svg) { display: block; }
    .name {
      text-align: center;
      font-size: 0.66rem;
      line-height: 1.25;
      font-weight: 700;
      letter-spacing: 0.01em;
      max-width: 72px;
      color: inherit;
      text-wrap: balance;
    }
    @keyframes navIconFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
    @media (max-width: 760px) {
      .sidebar { width: 74px; padding-inline: 8px; }
      .nav-item { min-height: 60px; padding: 8px 6px; }
      .name { display: none; }
    }
  `],
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
}
