import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand-mark',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a *ngIf="link !== null; else staticBrand" [routerLink]="link" class="brand-mark">
      <ng-container [ngTemplateOutlet]="content"></ng-container>
    </a>

    <ng-template #staticBrand>
      <span class="brand-mark">
        <ng-container [ngTemplateOutlet]="content"></ng-container>
      </span>
    </ng-template>

    <ng-template #content>
      <span
        class="brand-mark__logo"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.border-radius.px]="rounded"
      >
        <img src="assets/logo.png" alt="EduFlow" />
      </span>
      <span class="brand-mark__text" *ngIf="showText">EduFlow</span>
    </ng-template>
  `,
  styles: [`
    :host { display: inline-flex; }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: inherit;
      text-decoration: none;
      min-height: 40px;
    }

    .brand-mark__logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      padding: 0;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.06),
        0 10px 24px rgba(15, 23, 42, 0.18);
    }

    .brand-mark__logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
      display: block;
    }

    .brand-mark__text {
      font-family: var(--font-display);
      font-size: 1.08rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.02;
      color: inherit;
    }
  `],
})
export class BrandMarkComponent {
  @Input() link: string | null = '/';
  @Input() showText = true;
  @Input() size = 36;
  @Input() rounded = 12;
}
