import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card glass wrap">
      <h1>{{ title() }}</h1>
      <p class="muted">{{ subtitle() }}</p>
    </section>
  `,
  styles: [`
    .wrap { padding: 22px; }
    h1 { font-size: 1.4rem; margin: 0 0 8px; }
    .muted { margin: 0; color: var(--color-muted-foreground); }
  `],
})
export class PlaceholderPageComponent {
  private route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.data['title'] ?? 'Page';
  readonly subtitle = this.route.snapshot.data['subtitle'] ?? 'Cette page sera complétée dans le prochain lot.';
}
