import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { ChatbotComponent } from '../components/chatbot.component';

@Component({
  selector: 'app-kyc-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ChatbotComponent],
  template: `
<div class="app-shell">

  <!-- ============================================================
       TOP ANNOUNCEMENT STRIP
       ============================================================ -->
  <div class="ali-strip">
    <div class="ali-strip__inner">
      <span>🛡️ <strong>Programme de Confiance InzuConnect :</strong> Badge KYC & Vérification Certifiée des Propriétaires au Burundi</span>
    </div>
  </div>

  <!-- TOPNAV -->
  <header class="ali-topnav">
    <div class="ali-topnav__main">
      <a class="ali-topnav__logo" routerLink="/" aria-label="Accueil InzuConnect">
        <span class="logo__mark">
          <span class="pulse-burundi">
            <svg viewBox="0 0 155 165" aria-hidden="true">
              <g transform="translate(10 10) scale(1.05)">
                <path fill="var(--c-bronze)" stroke="rgba(17,17,17,0.15)" stroke-width="0.8" d="M 116,14 L 114,14 L 110,17 L 104,16 L 100,21 L 96,21 L 91,16 L 87,15 L 86,16 L 87,24 L 85,27 L 85,35 L 81,41 L 79,42 L 75,41 L 73,44 L 68,44 L 67,43 L 61,45 L 57,44 L 49,45 L 47,43 L 47,38 L 45,34 L 38,33 L 36,31 L 30,31 L 29,32 L 29,39 L 26,42 L 26,44 L 28,44 L 37,56 L 40,57 L 42,60 L 40,78 L 48,79 L 46,77 L 51,75 L 52,73 L 56,76 L 55,77 L 58,78 L 56,79 L 56,84 L 55,85 L 51,83 L 49,85 L 49,97 L 47,102 L 65,140 L 68,142 L 70,146 L 74,146 L 79,140 L 82,141 L 93,134 L 93,131 L 103,120 L 103,116 L 109,108 L 109,106 L 114,104 L 114,99 L 117,95 L 117,92 L 121,88 L 128,85 L 131,82 L 129,80 L 131,76 L 136,73 L 137,74 L 141,72 L 142,66 L 141,62 L 139,60 L 141,58 L 141,56 L 139,57 L 131,56 L 126,51 L 121,54 L 115,48 L 117,41 L 122,36 L 117,37 L 116,34 L 119,31 L 123,21 L 123,19 L 120,18 Z"/>
                <path fill="#FFFFFF" d="M 49,74 L 50,77 L 54,76 L 52,80 L 55,82 L 51,82 L 51,86 L 48,83 L 46,86 L 46,82 L 42,82 L 45,80 L 43,77 L 47,78 Z" class="sparkle-blink"/>
                <path fill="#FFFFFF" d="M 71,80 L 71,81 L 72,81 L 84,70 L 85,70 L 96,81 L 98,81 L 98,80 L 94,77 L 94,70 L 91,70 L 91,72 L 90,73 L 86,69 L 83,69 L 73,79 Z"/>
                <path fill="#FFFFFF" d="M 85,73 L 84,73 L 75,82 L 75,93 L 81,93 L 81,87 L 82,86 L 87,86 L 88,87 L 88,93 L 93,93 L 94,92 L 94,82 Z"/>
              </g>
            </svg>
          </span>
          <span class="logo__mark-txt"><b>BURUNDI</b></span>
        </span>
        <span>
          <strong>InzuConnect</strong>
          <small>Immobilier Burundi</small>
        </span>
      </a>

      <div class="ali-topnav__right">
        <a class="user-btn" routerLink="/biens">Nos biens</a>
        <a class="btn btn-primary btn-sm cta-pub-btn" routerLink="/host-wizard">Publier une annonce</a>
      </div>
    </div>
  </header>

  <!-- ============================================================
       HERO BANNER KYC
       ============================================================ -->
  <section class="kyc-hero">
    <div class="kyc-hero__inner">
      <span class="mono section-eyebrow">SÉCURITÉ & TRANSPARENCE EN REAL ESTATE</span>
      <h1>Vérification KYC & Badge Hôte Certifié</h1>
      <p class="kyc-hero__sub">
        InzuConnect est la 1ère plateforme immobilière au Burundi à vérifier systématiquement l'identité des hôtes, les titres de propriété et le fonctionnement des équipements autonomes d'eau et d'électricité.
      </p>

      <div class="kyc-stats-row">
        <div class="kyc-stat-card">
          <strong class="mono">100%</strong>
          <span>Propriétaires vérifiés par CNI & Titre foncier</span>
        </div>
        <div class="kyc-stat-card">
          <strong class="mono">+45%</strong>
          <span>De réservations en plus pour les biens avec Badge KYC</span>
        </div>
        <div class="kyc-stat-card">
          <strong class="mono">&lt; 24h</strong>
          <span>Délai de validation de votre dossier KYC</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       MAIN CONTENT: PILLARS & INTERACTIVE FORM
       ============================================================ -->
  <main class="kyc-container">
    
    <!-- 4 PILLARS OF VERIFICATION -->
    <section class="kyc-pillars">
      <h2 class="pillars-title">Les 4 Étapes de notre Procédure de Certification</h2>
      <div class="pillars-grid">
        <div class="pillar-card">
          <span class="pillar-num">01</span>
          <span class="pillar-icon">🆔</span>
          <h3>Vérification d'Identité (CNI / Passeport)</h3>
          <p>Contrôle de la pièce d'identité officielle du bailleur ou mandataire d'agence pour éviter les fausses annonces.</p>
        </div>

        <div class="pillar-card">
          <span class="pillar-num">02</span>
          <span class="pillar-icon">📜</span>
          <h3>Titre de Propriété ou Mandat Notarié</h3>
          <p>Validation du document légal attestant du droit de louer ou vendre le bien immobilier au Burundi.</p>
        </div>

        <div class="pillar-card">
          <span class="pillar-num">03</span>
          <span class="pillar-icon">⚡</span>
          <h3>Audit des Équipements (Eau & Électrique)</h3>
          <p>Attestation de présence d'un groupe électrogène fonctionnel et d'une citerne d'eau de secours autonome.</p>
        </div>

        <div class="pillar-card">
          <span class="pillar-num">04</span>
          <span class="pillar-icon">🎖️</span>
          <h3>Attribution du Badge "Hôte Certifié"</h3>
          <p>Le badge or est affiché sur vos annonces pour rassurer les clients voyageurs et acheteurs nationaux et de la diaspora.</p>
        </div>
      </div>
    </section>

    <!-- INTERACTIVE KYC FORM SECTION -->
    <section class="kyc-form-section">
      <div class="form-card">
        <div class="form-card__head">
          <h2>Demande de Badge KYC & Certification</h2>
          <p>Remplissez ce formulaire pour faire vérifier vos annonces ou votre compte hôte InzuConnect.</p>
        </div>

        <form (submit)="onSubmitKyc($event)" class="kyc-form">
          <!-- SECTION 1: PROPRIETAIRE -->
          <div class="form-group-title">
            <span class="step-badge">1</span>
            <h3>Informations Personnelles ou Agence</h3>
          </div>

          <div class="form-row-2">
            <div class="field">
              <label>Nom complet / Raison Sociale</label>
              <input type="text" placeholder="ex: Ndayishimiye Jean-Paul ou Agence Immo Rohero" required [(ngModel)]="fullName" name="fullName">
            </div>

            <div class="field">
              <label>Téléphone Mobile Money / WhatsApp</label>
              <input type="tel" placeholder="+257 79 000 000" required [(ngModel)]="phone" name="phone">
            </div>
          </div>

          <div class="form-row-2">
            <div class="field">
              <label>Email de contact</label>
              <input type="email" placeholder="votre.email@exemple.bi" required [(ngModel)]="email" name="email">
            </div>

            <div class="field">
              <label>Votre Statut au Burundi</label>
              <select [(ngModel)]="statusType" name="statusType">
                <option value="particulier">Propriétaire Particulier</option>
                <option value="agence">Agence Immobilière Agréée</option>
                <option value="mandataire">Gestionnaire / Mandataire</option>
              </select>
            </div>
          </div>

          <!-- SECTION 2: IDENTITE & TITRE -->
          <div class="form-group-title" style="margin-top:2rem">
            <span class="step-badge">2</span>
            <h3>Pièces Justificatives & Titre Foncier</h3>
          </div>

          <div class="form-row-2">
            <div class="field">
              <label>Numéro de CNI ou Passeport</label>
              <input type="text" placeholder="ex: 102.405/BUJ" required [(ngModel)]="idNumber" name="idNumber">
            </div>

            <div class="field">
              <label>Numéro de Parcelle / Titre Foncier (Optionnel)</label>
              <input type="text" placeholder="ex: Parcelle N° 4500 Kigobe Nord" [(ngModel)]="parcelNumber" name="parcelNumber">
            </div>
          </div>

          <div class="field">
            <label>Copie de la Pièce d'Identité (Recto/Verso)</label>
            <div class="file-dropzone" (click)="triggerFileSelect()">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              @if (fileName()) {
                <strong class="file-name">{{ fileName() }}</strong>
              } @else {
                <strong>Cliquez pour joindre la CNI ou le Passeport (PDF, JPG, PNG)</strong>
                <small>Taille max : 10 Mo · Document chiffré et sécurisé</small>
              }
            </div>
          </div>

          <!-- SECTION 3: INFRASTRUCTURES -->
          <div class="form-group-title" style="margin-top:2rem">
            <span class="step-badge">3</span>
            <h3>Attestation des Équipements Autonomes</h3>
          </div>

          <div class="checkbox-cards-grid">
            <label class="check-box-card" [class.is-checked]="hasGen">
              <input type="checkbox" [(ngModel)]="hasGen" name="hasGen">
              <span class="check-icon">⚡</span>
              <div>
                <strong>Groupe Électrogène Autonome</strong>
                <small>Bascule automatique lors des coupures REGIDESO</small>
              </div>
            </label>

            <label class="check-box-card" [class.is-checked]="hasWater">
              <input type="checkbox" [(ngModel)]="hasWater" name="hasWater">
              <span class="check-icon">💧</span>
              <div>
                <strong>Citerne d'Eau 3000L+</strong>
                <small>Réserve sous pression autonome d'eau potable</small>
              </div>
            </label>
          </div>

          <div class="form-actions" style="margin-top:2.5rem">
            <button type="submit" class="btn btn-primary btn-block submit-kyc-btn">
              🛡️ Soumettre mon Dossier de Vérification KYC
            </button>
          </div>
        </form>
      </div>
    </section>

  </main>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer__cols">
      <div class="footer__col">
        <div class="footer__logo">
          <span class="logo__mark">
            <span class="pulse-burundi">
              <svg viewBox="0 0 155 165" aria-hidden="true">
                <g transform="translate(10 10) scale(1.05)">
                  <path fill="var(--c-bronze)" stroke="rgba(17,17,17,0.15)" stroke-width="0.8" d="M 116,14 L 114,14 L 110,17 L 104,16 L 100,21 L 96,21 L 91,16 L 87,15 L 86,16 L 87,24 L 85,27 L 85,35 L 81,41 L 79,42 L 75,41 L 73,44 L 68,44 L 67,43 L 61,45 L 57,44 L 49,45 L 47,43 L 47,38 L 45,34 L 38,33 L 36,31 L 30,31 L 29,32 L 29,39 L 26,42 L 26,44 L 28,44 L 37,56 L 40,57 L 42,60 L 40,78 L 48,79 L 46,77 L 51,75 L 52,73 L 56,76 L 55,77 L 58,78 L 56,79 L 56,84 L 55,85 L 51,83 L 49,85 L 49,97 L 47,102 L 65,140 L 68,142 L 70,146 L 74,146 L 79,140 L 82,141 L 93,134 L 93,131 L 103,120 L 103,116 L 109,108 L 109,106 L 114,104 L 114,99 L 117,95 L 117,92 L 121,88 L 128,85 L 131,82 L 129,80 L 131,76 L 136,73 L 137,74 L 141,72 L 142,66 L 141,62 L 139,60 L 141,58 L 141,56 L 139,57 L 131,56 L 126,51 L 121,54 L 115,48 L 117,41 L 122,36 L 117,37 L 116,34 L 119,31 L 123,21 L 123,19 L 120,18 Z"/>
                  <path fill="#FFFFFF" d="M 49,74 L 50,77 L 54,76 L 52,80 L 55,82 L 51,82 L 51,86 L 48,83 L 46,86 L 46,82 L 42,82 L 45,80 L 43,77 L 47,78 Z" class="sparkle-blink"/>
                  <path fill="#FFFFFF" d="M 71,80 L 71,81 L 72,81 L 84,70 L 85,70 L 96,81 L 98,81 L 98,80 L 94,77 L 94,70 L 91,70 L 91,72 L 90,73 L 86,69 L 83,69 L 73,79 Z"/>
                  <path fill="#FFFFFF" d="M 85,73 L 84,73 L 75,82 L 75,93 L 81,93 L 81,87 L 82,86 L 87,86 L 88,87 L 88,93 L 93,93 L 94,92 L 94,82 Z"/>
                </g>
              </svg>
            </span>
            <span class="logo__mark-txt"><b>BURUNDI</b></span>
          </span>
          <strong>InzuConnect</strong>
        </div>
        <p>InzuConnect est votre partenaire immobilier de confiance pour acheter, louer ou réserver au Burundi.</p>
      </div>

      <div class="footer__col">
        <h5>Informations & Services</h5>
        <ul>
          <li><a routerLink="/biens">Tous nos biens</a></li>
          <li><a routerLink="/kyc">Vérification KYC & Badge Hôte</a></li>
          <li><a routerLink="/">Formulaire de Contact</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h5>Newsletter</h5>
        <p>Recevez nos annonces vérifiées par email.</p>
        <form class="footer__newsletter" (submit)="$event.preventDefault(); toast.show('Inscription enregistrée')">
          <input type="email" required placeholder="Votre email">
          <button type="submit" class="btn btn-dark btn-sm">Envoyer</button>
        </form>
      </div>
    </div>
    <div class="footer__bottom">
      <small>© 2026 InzuConnect. Tous droits réservés.</small>
      <small>Plateforme certifiée pour le Burundi</small>
    </div>
  </footer>

</div>
<app-chatbot></app-chatbot>
  `,
})
export class KycPageComponent {
  readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  fullName = '';
  phone = '';
  email = '';
  statusType = 'particulier';
  idNumber = '';
  parcelNumber = '';
  hasGen = true;
  hasWater = true;

  readonly fileName = signal<string>('');

  triggerFileSelect(): void {
    const fakeNames = ['CNI_RectoVerso_Scanné.pdf', 'Passeport_Burundi_ID.jpg', 'TitreFoncier_Certifié.pdf'];
    const randomFile = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    this.fileName.set(randomFile);
    this.toast.show(`Fichier sélectionné : ${randomFile}`);
  }

  onSubmitKyc(e: Event): void {
    e.preventDefault();
    this.toast.show('Dossier KYC transmis avec succès ! Analyse sous 24h par notre équipe.');
    setTimeout(() => {
      this.router.navigate(['/biens']);
    }, 1800);
  }
}
