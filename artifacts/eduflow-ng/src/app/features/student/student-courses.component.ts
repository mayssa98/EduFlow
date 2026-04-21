import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { Course, CourseService, SupportFile } from '../../core/services/course.service';
import { API_BASE } from '../../core/services/auth.service';
import { APP_ICONS } from '../../shared/icons/app-icons';

interface LibraryFeature {
  title: string;
  text: string;
  icon: string;
}

interface ShowcaseCard {
  title: string;
  teacher: string;
  badge: string;
  progress: number;
  icon: string;
}

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="courses-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <span class="eyebrow">
            <span [innerHTML]="icons.layers"></span>
            Learning Library
          </span>

          <h1>Un espace cours plus professionnel</h1>

          <p>
            Cette page devient une vraie bibliotheque academique: modules publies,
            supports centralises, apercu visuel des contenus et etat vide beaucoup plus credible.
          </p>

          <div class="hero-metrics">
            <article class="metric-card">
              <strong>{{ courses().length }}</strong>
              <span>modules publies</span>
            </article>
            <article class="metric-card">
              <strong>{{ teacherCount() }}</strong>
              <span>enseignants visibles</span>
            </article>
            <article class="metric-card">
              <strong>{{ documentModeLabel() }}</strong>
              <span>formats de support</span>
            </article>
          </div>

          <div class="hero-actions">
            <button class="primary-btn" type="button" (click)="loadAll()">
              <span [innerHTML]="icons.activity"></span>
              Actualiser la bibliotheque
            </button>
            <div class="hint-pill">
              <span [innerHTML]="icons.folderOpen"></span>
              Ouverture rapide des ressources PDF et MP4
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <article class="glass-card main-showcase">
            <div class="showcase-head">
              <span class="icon-shell" [innerHTML]="icons.book"></span>
              <div>
                <p class="mini-label">Exemple de module</p>
                <strong>Web Engineering Studio</strong>
              </div>
              <span class="accent-tag">Disponible</span>
            </div>

            <div class="showcase-lines">
              <div class="showcase-bullet">
                <span class="bullet-icon" [innerHTML]="icons.checkCircle"></span>
                <span>Supports de cours PDF interactifs</span>
              </div>
              <div class="showcase-bullet">
                <span class="bullet-icon" [innerHTML]="icons.playCircle"></span>
                <span>Mini-capsules vidéo MP4</span>
              </div>
              <div class="showcase-bullet">
                <span class="bullet-icon" [innerHTML]="icons.document"></span>
                <span>Ressources téléchargeables</span>
              </div>
            </div>

            <div class="showcase-meta">
              <div>
                <small>Supports</small>
                <strong>12 ressources</strong>
              </div>
              <div>
                <small>Format</small>
                <strong>PDF + MP4</strong>
              </div>
            </div>
          </article>

          <div class="showcase-stack">
            <article class="stack-card" *ngFor="let item of showcaseCards">
              <span class="stack-icon" [innerHTML]="item.icon"></span>
              <div class="stack-copy">
                <strong>{{ item.title }}</strong>
                <p>{{ item.teacher }}</p>
              </div>
              <div class="stack-side">
                <span class="stack-badge">{{ item.badge }}</span>
                <small>{{ item.progress }}%</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="signal-strip">
        <article class="signal-card" *ngFor="let item of libraryFeatures">
          <span class="signal-icon" [innerHTML]="item.icon"></span>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.text }}</p>
          </div>
        </article>
      </section>

      <section class="catalog-panel">
        <header class="section-head">
          <div>
            <p class="mini-label">Catalogue</p>
            <h2>Modules et ressources</h2>
            <p class="section-copy">
              Quand des cours sont publies, ils apparaissent ici sous forme de cartes riches
              avec enseignant, date, acces et apercu.
            </p>
          </div>
          <div class="status-chip">
            <span [innerHTML]="icons.target"></span>
            {{ courses().length === 0 ? 'Aucun cours publie' : courses().length + ' cours disponibles' }}
          </div>
        </header>

        <ng-container *ngIf="!loading(); else spinner">
          <ng-container *ngIf="courses().length > 0; else emptyLibrary">
            <div class="catalog-grid">
              <article class="course-card featured" *ngIf="featuredCourse() as featured">
                <div class="card-top">
                  <span class="course-icon large" [innerHTML]="resolveCourseIcon(featured)"></span>
                  <div class="card-copy">
                    <p class="mini-label">{{ featured.matiereNom || 'Module phare' }}</p>
                    <h3>{{ featured.titre }}</h3>
                    <p class="teacher-line">{{ featured.enseignantNom }}</p>
                  </div>
                  <span class="accent-tag">Featured</span>
                </div>

                <p class="desc">{{ truncate(featured.description, 180) }}</p>

                <div class="meta-grid">
                  <div>
                    <small>Publication</small>
                    <strong>{{ formatDate(featured.datePublication) }}</strong>
                  </div>
                  <div>
                    <small>Consultations</small>
                    <strong>{{ featured.nbConsultations }}</strong>
                  </div>
                  <div>
                    <small>Ressources</small>
                    <strong>Supports centralises</strong>
                  </div>
                </div>

                <div class="card-footer">
                  <div class="support-hint">
                    <span [innerHTML]="icons.folderOpen"></span>
                    Voir les ressources du module
                  </div>
                  <button class="primary-btn" type="button" (click)="openCourse(featured)">Ouvrir</button>
                </div>
              </article>

              <article class="course-card" *ngFor="let c of secondaryCourses()">
                <div class="card-top">
                  <span class="course-icon" [innerHTML]="resolveCourseIcon(c)"></span>
                  <div class="card-copy">
                    <p class="mini-label">{{ c.matiereNom || 'Module publie' }}</p>
                    <h3>{{ c.titre }}</h3>
                    <p class="teacher-line">{{ c.enseignantNom }}</p>
                  </div>
                </div>

                <p class="desc">{{ truncate(c.description, 120) }}</p>

                <div class="card-rail">
                  <span><span [innerHTML]="icons.calendarCheck"></span>{{ formatDate(c.datePublication) }}</span>
                  <span><span [innerHTML]="icons.activity"></span>{{ c.nbConsultations }} vues</span>
                </div>

                <div class="card-footer">
                  <div class="support-hint">
                    <span [innerHTML]="icons.layers"></span>
                    Bibliotheque du cours
                  </div>
                  <button class="ghost-btn" type="button" (click)="openCourse(c)">Consulter</button>
                </div>
              </article>
            </div>
          </ng-container>
        </ng-container>

        <ng-template #emptyLibrary>
          <div class="empty-layout">
            <section class="empty-main">
              <div class="empty-visual">
                <span class="orb orb-a"></span>
                <span class="orb orb-b"></span>
                <span class="empty-icon" [innerHTML]="icons.folderOpen"></span>
              </div>

              <div class="empty-copy">
                <p class="mini-label">Etat actuel</p>
                <h3>La bibliotheque est prete, mais aucun module n est encore publie</h3>
                <p>
                  Au lieu d un simple bloc vide, cette page presente deja le niveau d information
                  attendu: apercus de cours, zones de ressources et sections d orientation.
                </p>
              </div>

              <div class="empty-actions">
                <button class="primary-btn" type="button" (click)="loadAll()">
                  <span [innerHTML]="icons.activity"></span>
                  Recharger les cours
                </button>
                <div class="hint-pill">
                  <span [innerHTML]="icons.info"></span>
                  Les nouveaux cours apparaitront ici automatiquement.
                </div>
              </div>
            </section>

            <aside class="preview-board">
              <article class="preview-tile" *ngFor="let item of emptyExamples">
                <div class="preview-head">
                  <span class="preview-icon" [innerHTML]="item.icon"></span>
                  <span class="preview-tag">A venir</span>
                </div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.text }}</p>
              </article>
            </aside>
          </div>
        </ng-template>
      </section>

      <ng-template #spinner>
        <div class="center-spinner"><div class="big-spinner"></div></div>
      </ng-template>

      <div class="modal-overlay" *ngIf="showFilesModal()">
        <div class="modal media-modal">
          <div class="modal-head">
            <div>
              <p class="mini-label">Ressources du module</p>
              <h3>{{ selectedCourse()?.titre }}</h3>
              <p class="section-copy">{{ selectedCourse()?.description }}</p>
            </div>
            <button class="ghost-btn" type="button" (click)="closeFilesModal()">Fermer</button>
          </div>

          <ng-container *ngIf="!loadingFiles(); else filesLoading">
            <div class="media-room" *ngIf="files().length > 0; else filesEmpty">
              <aside class="resource-rail">
                <div class="rail-head">
                  <strong>{{ files().length }} support{{ files().length > 1 ? 's' : '' }}</strong>
                  <span class="hint-pill compact">
                    <span [innerHTML]="icons.layers"></span>
                    PDF et MP4
                  </span>
                </div>

                <button
                  class="resource-card"
                  type="button"
                  *ngFor="let f of files()"
                  [class.active]="selectedFile()?.id === f.id"
                  (click)="selectFile(f)"
                >
                  <span class="file-type large" [innerHTML]="resolveFileIcon(f)"></span>
                  <div class="resource-copy">
                    <strong>{{ f.titre }}</strong>
                    <p>{{ f.typeFichier }} · {{ formatBytes(f.tailleOctets) }}</p>
                    <span>{{ fileExperienceLabel(f) }}</span>
                  </div>
                  <span class="resource-tag">{{ f.typeFichier }}</span>
                </button>
              </aside>

              <section class="preview-panel" *ngIf="selectedFile() as active">
                <div class="preview-headline">
                  <div>
                    <p class="mini-label">{{ active.typeFichier === 'PDF' ? 'Visionneuse PDF' : 'Lecteur video' }}</p>
                    <h4>{{ active.titre }}</h4>
                    <p class="preview-copy">
                      {{ active.typeFichier === 'PDF'
                        ? 'Lecture integree avec affichage pleine largeur pour consulter le support sans quitter la plateforme.'
                        : 'Lecture video integree avec controles natifs pour une experience plus propre et plus stable.' }}
                    </p>
                  </div>

                  <div class="preview-actions">
                    <div class="preview-stat">
                      <small>Taille</small>
                      <strong>{{ formatBytes(active.tailleOctets) }}</strong>
                    </div>
                    <div class="preview-stat">
                      <small>Ajoute le</small>
                      <strong>{{ formatDate(active.dateUpload) }}</strong>
                    </div>
                    <a
                      *ngIf="selectedFileUrl() as fileUrl"
                      [href]="fileUrl"
                      target="_blank"
                      rel="noopener"
                      class="primary-btn small-btn"
                    >
                      Ouvrir dans un onglet
                    </a>
                  </div>
                </div>

                <div class="preview-stage" [class.video-stage]="active.typeFichier === 'MP4'">
                  <iframe
                    *ngIf="active.typeFichier === 'PDF'"
                    class="preview-frame"
                    [src]="selectedPdfUrl()"
                    [title]="active.titre"
                  ></iframe>

                  <video
                    *ngIf="active.typeFichier === 'MP4'"
                    class="preview-video"
                    [src]="selectedFileUrl() || ''"
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    playsinline
                  ></video>
                </div>

                <div class="preview-footer">
                  <div class="preview-note">
                    <span [innerHTML]="active.typeFichier === 'PDF' ? icons.document : icons.playCircle"></span>
                    <div>
                      <strong>{{ active.typeFichier === 'PDF' ? 'Consultation documentaire' : 'Lecture multimedia' }}</strong>
                      <p>{{ fileExperienceLabel(active) }}</p>
                    </div>
                  </div>

                  <div class="preview-help">
                    Si l apercu integre ne suffit pas, utilisez l ouverture dans un onglet pour une consultation complete.
                  </div>
                </div>
              </section>
            </div>
          </ng-container>

          <ng-template #filesEmpty>
            <div class="empty-files">
              <span [innerHTML]="icons.folderOpen"></span>
              <div>
                <strong>Aucun support disponible pour ce cours.</strong>
                <p>Les fichiers PDF et MP4 apparaitront ici avec leur visionnage integre.</p>
              </div>
            </div>
          </ng-template>

          <ng-template #filesLoading>
            <div class="modal-loading">
              <div class="big-spinner"></div>
              <p>Chargement des supports et preparation de la visionneuse...</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --card: #17182a;
      --border: rgba(99,102,241,0.14);
      --text: #e2e8f0;
      --muted: #94a3b8;
    }

    .courses-shell {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .hero-panel,
    .catalog-panel {
      padding: 26px;
      border-radius: 30px;
      border: 1px solid var(--border);
      background:
        radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 34%),
        linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
      box-shadow: 0 22px 44px rgba(15,23,42,0.16);
    }

    .hero-panel {
      display: grid;
      grid-template-columns: minmax(320px, 1.05fr) minmax(280px, 0.95fr);
      gap: 22px;
    }

    .hero-copy {
      display: flex;
      flex-direction: column;
      gap: 14px;
      justify-content: center;
    }

    .eyebrow,
    .accent-tag,
    .status-chip,
    .preview-tag,
    .hint-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .eyebrow {
      padding: 6px 12px;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.22);
      color: #c7d2fe;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    h1,
    h2,
    h3,
    strong {
      margin: 0;
      color: var(--text);
      font-family: var(--font-display);
    }

    .hero-copy h1 {
      font-size: clamp(2.2rem, 3vw, 3rem);
      line-height: 0.95;
      max-width: 14ch;
    }

    .hero-copy p,
    .section-copy,
    .empty-copy p,
    .preview-tile p,
    .signal-card p {
      margin: 0;
      color: var(--muted);
      line-height: 1.7;
    }

    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .metric-card,
    .glass-card,
    .stack-card,
    .signal-card,
    .preview-tile,
    .course-card,
    .empty-main,
    .preview-board {
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
      box-shadow: 0 16px 30px rgba(15,23,42,0.12);
    }

    .metric-card {
      padding: 14px 16px;
      border-radius: 18px;
    }

    .metric-card strong {
      display: block;
      margin-bottom: 5px;
      font-size: 1.2rem;
    }

    .metric-card span {
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 600;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 4px;
    }

    .hero-visual {
      display: grid;
      gap: 14px;
      align-content: center;
    }

    .glass-card {
      padding: 18px;
      border-radius: 24px;
      background:
        radial-gradient(circle at top right, rgba(45,212,191,0.16), transparent 38%),
        rgba(255,255,255,0.04);
    }

    .showcase-head,
    .showcase-meta,
    .stack-card,
    .signal-card,
    .card-top,
    .card-footer,
    .meta-grid,
    .card-rail,
    .empty-actions,
    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .icon-shell,
    .stack-icon,
    .signal-icon,
    .course-icon,
    .preview-icon,
    .empty-icon,
    .file-type {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #c7d2fe;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
    }

    .icon-shell,
    .stack-icon,
    .signal-icon,
    .preview-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
    }

    .course-icon {
      width: 52px;
      height: 52px;
      border-radius: 18px;
    }

    .course-icon.large {
      width: 60px;
      height: 60px;
      border-radius: 20px;
    }

    .mini-label {
      margin: 0 0 6px;
      color: #a5b4fc;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .accent-tag,
    .preview-tag,
    .status-chip {
      padding: 8px 12px;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.18);
      color: #c7d2fe;
    }

    .showcase-lines {
      display: grid;
      gap: 12px;
      margin: 18px 0;
    }

    .showcase-bullet {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #e2e8f0;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .bullet-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #99f6e4;
      width: 18px;
    }

    .showcase-meta > div,
    .meta-grid > div {
      flex: 1;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
    }

    .showcase-meta small,
    .meta-grid small {
      display: block;
      margin-bottom: 6px;
      color: var(--muted);
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .showcase-stack {
      display: grid;
      gap: 10px;
    }

    .stack-card,
    .signal-card {
      padding: 14px 16px;
      border-radius: 18px;
      animation: lift 6s ease-in-out infinite;
    }

    .stack-card:nth-child(2),
    .signal-card:nth-child(2) { animation-delay: 0.8s; }
    .stack-card:nth-child(3),
    .signal-card:nth-child(3) { animation-delay: 1.6s; }

    .stack-copy,
    .signal-card div {
      flex: 1;
    }

    .stack-copy strong,
    .signal-card strong,
    .preview-tile strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.95rem;
    }

    .stack-copy p,
    .teacher-line {
      margin: 0;
      color: var(--muted);
      font-size: 0.84rem;
    }

    .stack-side {
      text-align: right;
    }

    .stack-badge {
      display: inline-flex;
      padding: 5px 9px;
      border-radius: 999px;
      background: rgba(45,212,191,0.12);
      border: 1px solid rgba(45,212,191,0.18);
      color: #99f6e4;
      font-size: 0.74rem;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .stack-side small {
      display: block;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .signal-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 20px;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 16px;
    }

    .course-card {
      grid-column: span 4;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      border-radius: 24px;
      background:
        radial-gradient(circle at top right, rgba(99,102,241,0.14), transparent 34%),
        var(--card);
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .course-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99,102,241,0.28);
      box-shadow: 0 24px 44px rgba(15,23,42,0.22);
    }

    .course-card.featured {
      grid-column: span 8;
    }

    .card-copy {
      flex: 1;
    }

    .card-copy h3 {
      font-size: 1.12rem;
      line-height: 1.25;
    }

    .desc {
      margin: 0;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.7;
    }

    .meta-grid {
      gap: 10px;
    }

    .card-rail {
      flex-wrap: wrap;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 600;
    }

    .card-rail span,
    .support-hint,
    .hint-pill,
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .support-hint {
      color: var(--muted);
      font-size: 0.84rem;
      font-weight: 600;
    }

    .hint-pill {
      padding: 10px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: var(--muted);
    }

    .primary-btn,
    .ghost-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
    }

    .primary-btn {
      border: 1px solid rgba(99,102,241,0.18);
      background: linear-gradient(135deg, rgba(99,102,241,0.95), rgba(79,70,229,0.85));
      color: #fff;
      box-shadow: 0 14px 24px rgba(79,70,229,0.18);
      text-decoration: none;
    }

    .ghost-btn {
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: var(--text);
    }

    .primary-btn:hover,
    .ghost-btn:hover {
      transform: translateY(-1px);
    }

    .small-btn {
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
    }

    .empty-layout {
      display: grid;
      grid-template-columns: minmax(300px, 1.1fr) minmax(260px, 0.9fr);
      gap: 18px;
    }

    .empty-main,
    .preview-board {
      padding: 22px;
      border-radius: 24px;
    }

    .empty-main {
      display: grid;
      gap: 18px;
      background:
        radial-gradient(circle at top right, rgba(99,102,241,0.14), transparent 34%),
        rgba(255,255,255,0.03);
    }

    .empty-visual {
      position: relative;
      min-height: 180px;
      display: grid;
      place-items: center;
      overflow: hidden;
      border-radius: 22px;
      background: rgba(15,23,42,0.4);
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(18px);
      opacity: 0.84;
    }

    .orb-a {
      width: 140px;
      height: 140px;
      background: rgba(99,102,241,0.28);
      inset: auto auto 14px 16%;
    }

    .orb-b {
      width: 94px;
      height: 94px;
      background: rgba(45,212,191,0.18);
      inset: 18px 16% auto auto;
    }

    .empty-icon {
      position: relative;
      z-index: 1;
      width: 82px;
      height: 82px;
      border-radius: 26px;
      box-shadow: 0 20px 30px rgba(15,23,42,0.18);
    }

    .empty-copy h3 {
      margin-bottom: 8px;
      font-size: 1.6rem;
      line-height: 1.15;
    }

    .preview-board {
      display: grid;
      gap: 12px;
    }

    .preview-tile {
      padding: 18px;
      border-radius: 20px;
      animation: lift 6s ease-in-out infinite;
    }

    .preview-tile:nth-child(2) { animation-delay: 0.8s; }
    .preview-tile:nth-child(3) { animation-delay: 1.6s; }

    .preview-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .preview-icon {
      width: 42px;
      height: 42px;
      border-radius: 14px;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2,6,23,0.74);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal {
      width: min(760px, 100%);
      padding: 24px;
      border-radius: 24px;
      background: #17182a;
      border: 1px solid var(--border);
      box-shadow: 0 24px 50px rgba(15,23,42,0.32);
    }

    .file-type {
      width: 34px;
      height: 34px;
      margin-right: 10px;
      border-radius: 12px;
      vertical-align: middle;
    }

    .file-type.large {
      width: 46px;
      height: 46px;
      margin-right: 0;
      border-radius: 16px;
      flex-shrink: 0;
    }

    .media-modal {
      width: min(1240px, 100%);
      max-height: min(88vh, 920px);
      display: flex;
      flex-direction: column;
      gap: 18px;
      overflow: hidden;
    }

    .media-room {
      display: grid;
      grid-template-columns: minmax(290px, 340px) minmax(0, 1fr);
      gap: 18px;
      min-height: 0;
      flex: 1;
    }

    .resource-rail,
    .preview-panel {
      min-height: 0;
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
    }

    .resource-rail {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      overflow: auto;
    }

    .rail-head,
    .preview-headline,
    .preview-actions,
    .preview-note {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .rail-head {
      align-items: center;
      margin-bottom: 4px;
    }

    .hint-pill.compact {
      padding: 8px 10px;
      font-size: 0.74rem;
    }

    .resource-card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,13,33,0.36);
      color: var(--text);
      text-align: left;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
    }

    .resource-card:hover,
    .resource-card.active {
      transform: translateY(-1px);
      border-color: rgba(99,102,241,0.24);
      background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(15,23,42,0.72));
      box-shadow: 0 18px 32px rgba(15,23,42,0.18);
    }

    .resource-copy {
      min-width: 0;
    }

    .resource-copy strong,
    .preview-note strong,
    .preview-headline h4 {
      display: block;
      margin-bottom: 4px;
    }

    .resource-copy p,
    .resource-copy span,
    .preview-copy,
    .preview-help,
    .preview-note p,
    .modal-loading p,
    .empty-files p {
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
    }

    .resource-copy strong {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .resource-copy span {
      display: block;
      font-size: 0.78rem;
    }

    .resource-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 9px;
      border-radius: 999px;
      background: rgba(45,212,191,0.12);
      border: 1px solid rgba(45,212,191,0.18);
      color: #99f6e4;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
    }

    .preview-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 18px;
      overflow: auto;
    }

    .preview-headline {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .preview-headline h4 {
      font-size: 1.3rem;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }

    .preview-copy {
      max-width: 64ch;
    }

    .preview-actions {
      align-items: stretch;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .preview-stat {
      min-width: 104px;
      padding: 10px 12px;
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
    }

    .preview-stat small {
      display: block;
      margin-bottom: 5px;
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .preview-stage {
      display: flex;
      min-height: 480px;
      border-radius: 22px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03), rgba(9,13,33,0.8)),
        #0f172a;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    }

    .preview-stage.video-stage {
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .preview-frame,
    .preview-video {
      width: 100%;
      height: 100%;
      border: 0;
      background: #0f172a;
      display: block;
    }

    .preview-video {
      border-radius: 18px;
      object-fit: contain;
      box-shadow: 0 24px 44px rgba(2,6,23,0.32);
    }

    .preview-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(9,13,33,0.34);
    }

    .preview-note {
      align-items: center;
      flex: 1 1 340px;
    }

    .preview-note > span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      color: #c7d2fe;
      background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.08));
      border: 1px solid rgba(99,102,241,0.18);
    }

    .preview-help {
      max-width: 34ch;
      font-size: 0.86rem;
      align-self: center;
    }

    .empty-files {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px;
      border-radius: 18px;
      background: rgba(255,255,255,0.03);
      border: 1px dashed rgba(255,255,255,0.08);
      color: var(--muted);
    }

    .empty-files strong {
      display: block;
      margin-bottom: 4px;
    }

    .modal-loading {
      min-height: 320px;
      display: grid;
      place-items: center;
      gap: 12px;
      text-align: center;
    }

    .center-spinner {
      display: flex;
      justify-content: center;
      padding: 56px 0;
    }

    .big-spinner {
      width: 38px;
      height: 38px;
      border: 3px solid rgba(99,102,241,0.26);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .muted { color: var(--muted); }
    .small { font-size: 0.82rem; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes lift {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @media (max-width: 1180px) {
      .catalog-grid,
      .signal-strip,
      .empty-layout,
      .hero-panel {
        grid-template-columns: 1fr;
      }

      .course-card,
      .course-card.featured {
        grid-column: auto;
      }
    }

    @media (max-width: 760px) {
      .hero-metrics,
      .meta-grid {
        grid-template-columns: 1fr;
      }

      .section-head,
      .card-top,
      .card-footer,
      .modal-head {
        flex-direction: column;
        align-items: flex-start;
      }

      .primary-btn,
      .ghost-btn {
        width: 100%;
      }
    }

    @media (max-width: 1080px) {
      .media-room {
        grid-template-columns: 1fr;
      }

      .resource-rail {
        max-height: 280px;
      }
    }

    @media (max-width: 760px) {
      .media-modal {
        padding: 18px;
      }

      .preview-headline,
      .preview-actions,
      .rail-head,
      .preview-footer,
      .preview-note {
        flex-direction: column;
        align-items: flex-start;
      }

      .resource-card {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .resource-tag {
        grid-column: 2;
        width: fit-content;
      }

      .preview-stage {
        min-height: 320px;
      }

      .preview-help {
        max-width: none;
      }
    }
  `],
})
export class StudentCoursesComponent implements OnInit {
  private readonly courseSvc = inject(CourseService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly icons = APP_ICONS;

  readonly libraryFeatures: LibraryFeature[] = [
    {
      title: 'Consultation centralisee',
      text: 'Chaque module rassemble ressources, informations de publication et acces rapide.',
      icon: APP_ICONS.folderOpen,
    },
    {
      title: 'Presentation premium',
      text: 'Les cartes utilisent une hierarchie claire, des badges et des metadonnees visibles.',
      icon: APP_ICONS.layers,
    },
    {
      title: 'Etat vide utile',
      text: 'Quand aucun cours n est publie, la page reste elegante et informative.',
      icon: APP_ICONS.info,
    },
  ];

  readonly showcaseCards: ShowcaseCard[] = [
    {
      title: 'Systems Design Basics',
      teacher: 'Prof. Haddad',
      badge: 'PDF',
      progress: 82,
      icon: APP_ICONS.book,
    },
    {
      title: 'Data Visualisation Lab',
      teacher: 'Prof. Saidi',
      badge: 'MP4',
      progress: 64,
      icon: APP_ICONS.playCircle,
    },
    {
      title: 'AI Foundations',
      teacher: 'Prof. Rezzag',
      badge: 'Mixed',
      progress: 91,
      icon: APP_ICONS.target,
    },
  ];

  readonly emptyExamples: LibraryFeature[] = [
    {
      title: 'Syllabus et objectifs',
      text: 'Chaque fiche de cours pourra afficher les objectifs, le plan et les attentes du module.',
      icon: APP_ICONS.clipboard,
    },
    {
      title: 'Ressources multimedia',
      text: 'Les enseignants pourront deposer PDF, captures ecran, videos et materiel de revision.',
      icon: APP_ICONS.playCircle,
    },
    {
      title: 'Acces rapide',
      text: 'Une seule action suffira pour ouvrir les supports d un cours des qu il sera publie.',
      icon: APP_ICONS.activity,
    },
  ];

  readonly courses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly showFilesModal = signal(false);
  readonly loadingFiles = signal(false);
  readonly selectedCourse = signal<Course | null>(null);
  readonly files = signal<SupportFile[]>([]);
  readonly selectedFile = signal<SupportFile | null>(null);
  readonly selectedPdfUrl = signal<SafeResourceUrl | null>(null);

  readonly featuredCourse = computed(() => this.courses()[0] ?? null);
  readonly secondaryCourses = computed(() => this.courses().slice(1));
  readonly selectedFileUrl = computed(() => {
    const course = this.selectedCourse();
    const file = this.selectedFile();
    return course && file ? `${API_BASE}/courses/${course.id}/files/${file.id}` : null;
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.courseSvc.list().subscribe({
      next: res => {
        this.courses.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCourse(course: Course): void {
    this.selectedCourse.set(course);
    this.showFilesModal.set(true);
    this.loadingFiles.set(true);
    this.files.set([]);
    this.selectedFile.set(null);
    this.selectedPdfUrl.set(null);

    this.courseSvc.listFiles(course.id).subscribe({
      next: res => {
        this.files.set(res);
        this.selectFile(res[0] ?? null);
        this.loadingFiles.set(false);
      },
      error: () => {
        this.files.set([]);
        this.selectedFile.set(null);
        this.selectedPdfUrl.set(null);
        this.loadingFiles.set(false);
      },
    });
  }

  closeFilesModal(): void {
    this.showFilesModal.set(false);
    this.loadingFiles.set(false);
    this.selectedCourse.set(null);
    this.files.set([]);
    this.selectedFile.set(null);
    this.selectedPdfUrl.set(null);
  }

  getFileUrl(courseId: number, fileId: number): string {
    return `${API_BASE}/courses/${courseId}/files/${fileId}`;
  }

  teacherCount(): number {
    return new Set(this.courses().map(c => c.enseignantId)).size;
  }

  documentModeLabel(): string {
    return this.courses().length === 0 ? 'PDF · MP4' : 'Riche';
  }

  resolveCourseIcon(course: Course): string {
    const label = `${course.matiereNom || ''} ${course.titre}`.toLowerCase();
    if (label.includes('video') || label.includes('media')) return this.icons.playCircle;
    if (label.includes('ia') || label.includes('ai')) return this.icons.target;
    if (label.includes('web') || label.includes('design')) return this.icons.layers;
    return this.icons.book;
  }

  truncate(text?: string, max = 140): string {
    if (!text) return 'Le descriptif detaille apparaitra ici avec les objectifs, ressources et indications de progression.';
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  formatDate(value?: string): string {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('fr-FR');
  }

  selectFile(file: SupportFile | null): void {
    this.selectedFile.set(file);

    if (!file || file.typeFichier !== 'PDF') {
      this.selectedPdfUrl.set(null);
      return;
    }

    const course = this.selectedCourse();
    if (!course) {
      this.selectedPdfUrl.set(null);
      return;
    }

    const url = `${this.getFileUrl(course.id, file.id)}#toolbar=1&navpanes=0&view=FitH`;
    this.selectedPdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  resolveFileIcon(file: SupportFile): string {
    return file.typeFichier === 'PDF' ? this.icons.document : this.icons.playCircle;
  }

  fileExperienceLabel(file: SupportFile): string {
    return file.typeFichier === 'PDF'
      ? 'Lecture integree, zoom navigateur et ouverture rapide du document.'
      : 'Lecture integree avec controles video et bascule vers un onglet dedie.';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
  }
}
