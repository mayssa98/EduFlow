import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <section class="hero glass fade-up">
      <h1>{{ 'home.title' | translate }}</h1>
      <p class="lede">{{ 'home.subtitle' | translate }}</p>
      <div class="actions">
        <button class="btn btn-primary">{{ 'common.getStarted' | translate }}</button>
        <button class="btn">{{ 'common.learnMore' | translate }}</button>
      </div>
    </section>
  `,
  styles: [
    `
      .hero { padding: 56px 32px; text-align: center; margin-top: 24px; }
      h1 { font-size: clamp(2rem, 4vw, 3.25rem); font-weight: 800;
           background: linear-gradient(135deg, var(--indigo-500), var(--violet-500));
           -webkit-background-clip: text; background-clip: text;
           -webkit-text-fill-color: transparent; }
      .lede { color: var(--text-secondary); margin: 12px auto 24px; max-width: 640px; font-size: 1.05rem; }
      .actions { display: inline-flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    `,
  ],
})
export class HomeComponent {}
