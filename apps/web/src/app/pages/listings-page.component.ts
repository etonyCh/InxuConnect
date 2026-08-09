import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCardComponent } from '../components/listing-card.component';
import { ListingService } from '../services/listing.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Listing } from '../models/listing.model';

export type TransactionType = 'all' | 'rent' | 'buy' | 'passage';

@Component({
  selector: 'app-listings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent, FormsModule],
  template: `
<div class="app-shell">

  <!-- ============================================================
       TOP ANNOUNCEMENT STRIP
       ============================================================ -->
  <div class="ali-strip">
    <div class="ali-strip__inner">
      <span>⚡ <strong>Garantie InzuConnect :</strong> Électricité 24/7 & Eau Potable autonomes sur tous les logements certifiés au Burundi</span>
    </div>
  </div>

  <!-- ============================================================
       ALIEXPRESS-INSPIRED TOP NAVIGATION HEADER
       ============================================================ -->
  <header class="ali-topnav">
    <div class="ali-topnav__main">
      <!-- LOGO -->
      <a class="ali-topnav__logo" routerLink="/" aria-label="Accueil InzuConnect">
        <span class="logo__mark"><span class="pulse"></span></span>
        <span>
          <strong>InzuConnect</strong>
          <small>Immobilier Burundi</small>
        </span>
      </a>

      <!-- CENTER ROUNDED SEARCH CAPSULE -->
      <div class="ali-search-box">
        <input
          type="text"
          placeholder="Rechercher par ville, quartier (Bujumbura, Gitega...)"
          [value]="searchCity()"
          (input)="setSearchCity($event)"
        >
        <button type="button" class="ali-search-btn" (click)="applyFilters()" aria-label="Rechercher">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>

      <!-- RIGHT ACTIONS BLOCK -->
      <div class="ali-topnav__right">
        @if (user()) {
          <button class="user-btn" (click)="navigateDashboard()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
            <span class="user-name">{{ user()?.name || 'Mon Compte' }}</span>
          </button>
        } @else {
          <a class="user-btn" routerLink="/login">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
            <span>Connexion</span>
          </a>
        }

        <button class="btn btn-primary btn-sm cta-pub-btn" (click)="navigateHostWizard()">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Publier</span>
        </button>
      </div>
    </div>

    <!-- SECONDARY SUB-NAVBAR CATEGORIES ROW -->
    <div class="ali-subnav">
      <div class="ali-subnav__inner">
        <div class="ali-subnav__links">
          <a class="subnav-link" [class.is-active]="selectedTransaction() === 'all'" (click)="selectedTransaction.set('all')">Tous les biens</a>
          <a class="subnav-link highlight" (click)="selectedTransaction.set('all')">🔥 Offres Vérifiées</a>
          <a class="subnav-link" [class.is-active]="selectedTransaction() === 'rent'" (click)="selectedTransaction.set('rent')">À louer</a>
          <a class="subnav-link" [class.is-active]="selectedTransaction() === 'buy'" (click)="selectedTransaction.set('buy')">À acheter</a>
          <a class="subnav-link" [class.is-active]="selectedTransaction() === 'passage'" (click)="selectedTransaction.set('passage')">Maisons de passage</a>
        </div>
      </div>
    </div>
  </header>

  <!-- ============================================================
       PAGE HEADER
       ============================================================ -->
  <header class="biens-header">
    <div class="biens-header__inner">
      <p class="mono section-eyebrow">PORTEFEUILLE IMMOBILIER BURUNDI</p>
      <h1>Nos biens disponibles</h1>
      <p class="biens-header__sub">
        Parcourez l'ensemble de nos annonces d'exception — maisons, villas, appartements, studios et résidences meublées avec garanties eau & électricité.
      </p>
    </div>
  </header>

  <!-- ============================================================
       2-COLUMN CATALOG LAYOUT (VERTICAL FILTER + LISTINGS GRID)
       ============================================================ -->
  <div class="biens-container">
    <!-- LEFT SIDEBAR: VERTICAL FILTERS -->
    <aside class="biens-sidebar">
      <div class="sidebar-card">
        <div class="sidebar-card__head">
          <h3>Filtres de recherche</h3>
          <button class="link-btn-sm" (click)="resetFilters()">Effacer</button>
        </div>

        <!-- TRANSACTION TYPE -->
        <div class="filter-group">
          <label class="filter-label">Offre & Transaction</label>
          <div class="pill-toggle-grid">
            <button class="pill-toggle" [class.is-active]="selectedTransaction() === 'all'" (click)="selectedTransaction.set('all')">Tous</button>
            <button class="pill-toggle" [class.is-active]="selectedTransaction() === 'rent'" (click)="selectedTransaction.set('rent')">À louer</button>
            <button class="pill-toggle" [class.is-active]="selectedTransaction() === 'buy'" (click)="selectedTransaction.set('buy')">À acheter</button>
            <button class="pill-toggle" [class.is-active]="selectedTransaction() === 'passage'" (click)="selectedTransaction.set('passage')">Passage</button>
          </div>
        </div>

        <!-- LOCATION -->
        <div class="filter-group">
          <label class="filter-label">Localisation</label>
          <div class="field-inner">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s-7-6.3-7-12a7 7 0 1 1 14 0c0 5.7-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <input type="text" placeholder="Toutes les villes…" [value]="searchCity()" (input)="setSearchCity($event)" list="city-suggest">
          </div>
        </div>

        <!-- PROPERTY TYPE -->
        <div class="filter-group">
          <label class="filter-label">Type de bien</label>
          <select [value]="selectedCategory()" (change)="setSelectedCategory($event)">
            <option value="">Tous les types</option>
            <option value="maison">Maisons</option>
            <option value="villa">Villas</option>
            <option value="appartement">Appartements</option>
            <option value="studio">Studios</option>
            <option value="commercial">Espaces commercieux</option>
          </select>
        </div>

        <!-- MAX PRICE SLIDER -->
        <div class="filter-group">
          <div class="filter-label-row">
            <label class="filter-label">Prix max / nuit</label>
            <span class="mono price-val">{{ formatPrice(priceMax()) }}</span>
          </div>
          <input type="range" min="20000" max="500000" step="10000" [value]="priceMax()" (input)="setPriceMax($event)">
        </div>

        <!-- MIN BEDROOMS -->
        <div class="filter-group">
          <label class="filter-label">Chambres minimum</label>
          <div class="stepper">
            <button type="button" class="stepper__btn" (click)="stepBedrooms(-1)">−</button>
            <span class="stepper__val mono">{{ bedroomsMin() }}</span>
            <button type="button" class="stepper__btn" (click)="stepBedrooms(1)">+</button>
          </div>
        </div>

        <!-- GUARANTEES / COMMODITIES -->
        <div class="filter-group">
          <label class="filter-label">Garanties & Équipements</label>
          <div class="checkbox-list">
            <label class="check-row">
              <input type="checkbox" [checked]="hasGenerator()" (change)="hasGenerator.set(!hasGenerator())">
              <span>Groupe électrogène ⚡</span>
            </label>
            <label class="check-row">
              <input type="checkbox" [checked]="hasWaterTank()" (change)="hasWaterTank.set(!hasWaterTank())">
              <span>Citerne d'eau autonome 💧</span>
            </label>
            <label class="check-row">
              <input type="checkbox" [checked]="hasStarlink()" (change)="hasStarlink.set(!hasStarlink())">
              <span>Internet Starlink 📡</span>
            </label>
          </div>
        </div>

        <button class="btn btn-primary btn-block" (click)="applyFilters()">
          Filtrer les annonces
        </button>
      </div>
    </aside>

    <!-- RIGHT MAIN CONTENT: LISTINGS GRID -->
    <main class="biens-main">
      <div class="biens-toolbar">
        <div class="biens-count">
          <strong>{{ filteredListings().length }}</strong>
          <span>biens trouvés</span>
        </div>

        <div class="biens-sort">
          <label>Trier par :</label>
          <select [value]="sortBy()" (change)="setSortBy($event)">
            <option value="recent">Plus récents</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="rating">Meilleure note</option>
          </select>
        </div>
      </div>

      <div class="biens-grid">
        @for (l of filteredListings(); track l.id) {
          <app-listing-card
            [listing]="l"
            (clicked)="openListingDetail($event)"
          />
        }

        @if (filteredListings().length === 0) {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
            <h3>Aucun bien ne correspond à vos critères</h3>
            <p>Essayez de réinitialiser la recherche ou d'élargir vos filtres de prix et de localisation.</p>
            <button class="btn btn-dark" (click)="resetFilters()">Réinitialiser les filtres</button>
          </div>
        }
      </div>
    </main>
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer__cols">
      <div class="footer__col">
        <div class="footer__logo">
          <span class="logo__mark"><span class="pulse"></span></span>
          <strong>InzuConnect</strong>
        </div>
        <p>InzuConnect est votre partenaire immobilier de confiance pour acheter, louer ou réserver au Burundi.</p>
      </div>

      <div class="footer__col">
        <h5>Informations & Services</h5>
        <ul>
          <li><a (click)="isAboutOpen.set(true)">À propos d'InzuConnect</a></li>
          <li><a (click)="isContactOpen.set(true)">Formulaire de Contact</a></li>
          <li><a routerLink="/kyc">Vérification KYC & Badge Hôte</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h5>Newsletter</h5>
        <p>Recevez nos nouvelles annonces et nos conseils immo.</p>
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

<!-- MODALS -->
<div class="overlay overlay--center" [class.is-open]="isAboutOpen()">
  <div class="overlay__backdrop" (click)="isAboutOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">À propos d'InzuConnect</h3>
      <button class="overlay__close" (click)="isAboutOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <p style="font-size:1rem;color:var(--c-obsidian);line-height:1.6;margin-bottom:1.5rem;font-weight:500">
        <strong style="color:var(--c-bronze-dark)">InzuConnect</strong> est la 1ère plateforme immobilière certifiée au Burundi dédiée à l'achat, la location et l'hospitalité haut de gamme.
      </p>

      <div class="security-promises" style="margin-bottom:1.5rem">
        <div class="promise-item promise-item--dark">
          <span class="promise-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A7 7 0 0 1 12 3a7 7 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/></svg></span>
          <div>
            <strong class="promise-title">Eau & Électricité Garanties</strong>
            <p class="promise-desc">Chaque logement répertorié dispose d'une alimentation électrique et d'eau autonome contrôlée.</p>
          </div>
        </div>

        <div class="promise-item promise-item--dark">
          <span class="promise-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/></svg></span>
          <div>
            <strong class="promise-title">Hôtes & Propriétaires Vérifiés (Badge KYC)</strong>
            <p class="promise-desc">Vérification systématique d'identité et des titres de propriété.</p>
          </div>
        </div>

        <div class="promise-item promise-item--dark">
          <span class="promise-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg></span>
          <div>
            <strong class="promise-title">Couverture Nationale</strong>
            <p class="promise-desc">Des milliers de biens disponibles à Bujumbura, Gitega, Ngozi et dans tout le Burundi.</p>
          </div>
        </div>
      </div>

      <div class="overlay__footer">
        <button type="button" class="btn btn-ghost" (click)="isAboutOpen.set(false)">Fermer</button>
        <button type="button" class="btn btn-primary" (click)="isAboutOpen.set(false); isContactOpen.set(true)">Nous contacter</button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isContactOpen()">
  <div class="overlay__backdrop" (click)="isContactOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Contactez l'équipe InzuConnect</h3>
      <button class="overlay__close" (click)="isContactOpen.set(false)">✕</button>
    </div>
    <form class="overlay__body" (submit)="onContactSubmit($event)">
      <p style="font-size:0.9rem;color:var(--c-obsidian);margin-bottom:1.5rem">
        Une question sur une annonce, un partenariat ou besoin d'assistance ? Remplissez ce formulaire et notre équipe vous répondra sous 24h.
      </p>

      <div class="field">
        <label>Nom & Prénom</label>
        <input type="text" placeholder="Votre nom complet" required [value]="contactName()" (input)="setContactName($event)">
      </div>

      <div class="field">
        <label>Email ou Téléphone</label>
        <input type="text" placeholder="+257 79 000 000 ou email@exemple.bi" required [value]="contactEmail()" (input)="setContactEmail($event)">
      </div>

      <div class="field">
        <label>Sujet de votre demande</label>
        <select [value]="contactSubject()" (change)="setContactSubject($event)">
          <option value="renseignement">Demande d'information sur un bien</option>
          <option value="hote">Devenir Hôte / Publier un bien</option>
          <option value="partenariat">Partenariat & Agences Immobilieres</option>
          <option value="support">Assistance Technique & KYC</option>
        </select>
      </div>

      <div class="field">
        <label>Votre message</label>
        <textarea rows="4" placeholder="Précisez votre demande..." required style="width:100%;padding:0.85rem 1rem;border:1.5px solid rgba(166,138,109,0.3);border-radius:var(--r-sm);font-family:var(--f-body);font-size:0.95rem;color:var(--c-obsidian)" [value]="contactMessage()" (input)="setContactMessage($event)"></textarea>
      </div>

      <div class="overlay__footer">
        <button type="button" class="btn btn-ghost" (click)="isContactOpen.set(false)">Annuler</button>
        <button type="submit" class="btn btn-primary">Envoyer le message</button>
      </div>
    </form>
  </div>
</div>
  `,
})
export class ListingsPageComponent implements OnInit {
  private readonly listingSvc = inject(ListingService);
  readonly toast = inject(ToastService);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);

  readonly listings = signal<Listing[]>([]);
  readonly user = computed(() => this.authSvc.user());

  // FILTERS SIGNALS
  readonly selectedTransaction = signal<TransactionType>('all');
  readonly searchCity = signal('');
  readonly selectedCategory = signal('');
  readonly priceMax = signal(350000);
  readonly bedroomsMin = signal(0);
  readonly hasGenerator = signal(false);
  readonly hasWaterTank = signal(false);
  readonly hasStarlink = signal(false);
  readonly sortBy = signal('recent');

  // MODALS SIGNALS
  readonly isAboutOpen = signal(false);
  readonly isContactOpen = signal(false);
  readonly isKycOpen = signal(false);
  readonly contactName = signal('');
  readonly contactEmail = signal('');
  readonly contactSubject = signal('renseignement');
  readonly contactMessage = signal('');

  readonly filteredListings = computed(() => {
    let result = this.listings().slice();

    // Transaction filter
    const trans = this.selectedTransaction();
    if (trans === 'rent') {
      result = result.filter((l) => ['appartement','studio','chambre'].includes((l.category || '').toLowerCase()) || l.pricePerNightFbu < 180000);
    } else if (trans === 'buy') {
      result = result.filter((l) => ['villa','maison','terrain'].includes((l.category || '').toLowerCase()) || l.pricePerNightFbu >= 180000);
    } else if (trans === 'passage') {
      result = result.slice(0, 5);
    }

    // City filter
    const city = this.searchCity().trim().toLowerCase();
    if (city) {
      result = result.filter((l) => (l.location || '').toLowerCase().includes(city));
    }

    // Category filter
    const cat = this.selectedCategory().trim().toLowerCase();
    if (cat) {
      result = result.filter((l) => (l.category || '').toLowerCase().includes(cat));
    }

    // Price max filter
    const pMax = this.priceMax();
    if (pMax > 0) {
      result = result.filter((l) => l.pricePerNightFbu <= pMax);
    }

    // Bedrooms min filter
    const bMin = this.bedroomsMin();
    if (bMin > 0) {
      result = result.filter((l) => (l.bedroomsCount || 1) >= bMin);
    }

    // Amenities filters
    if (this.hasGenerator()) {
      result = result.filter((l) => (l.amenities || []).some((a) => a.toLowerCase().includes('groupe')));
    }
    if (this.hasWaterTank()) {
      result = result.filter((l) => (l.amenities || []).some((a) => a.toLowerCase().includes('citerne')));
    }
    if (this.hasStarlink()) {
      result = result.filter((l) => (l.amenities || []).some((a) => a.toLowerCase().includes('starlink')));
    }

    // Sort
    const sort = this.sortBy();
    if (sort === 'price-asc') {
      result.sort((a, b) => a.pricePerNightFbu - b.pricePerNightFbu);
    } else if (sort === 'price-desc') {
      result.sort((a, b) => b.pricePerNightFbu - a.pricePerNightFbu);
    } else if (sort === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  });

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.listingSvc.getListings().subscribe((data) => {
      this.listings.set(data);
    });

    this.route.queryParams.subscribe((params) => {
      if (params['type']) {
        const t = params['type'] as TransactionType;
        if (['all', 'rent', 'buy', 'passage'].includes(t)) {
          this.selectedTransaction.set(t);
        }
      }
      if (params['q']) {
        this.searchCity.set(params['q']);
      }
    });
  }

  setSearchCity(e: Event): void {
    const v = (e.target as HTMLInputElement)?.value;
    if (typeof v === 'string') this.searchCity.set(v);
  }

  setSelectedCategory(e: Event): void {
    const v = (e.target as HTMLSelectElement)?.value;
    if (typeof v === 'string') this.selectedCategory.set(v);
  }

  setPriceMax(e: Event): void {
    const n = Number((e.target as HTMLInputElement)?.value);
    if (!Number.isNaN(n)) this.priceMax.set(n);
  }

  setSortBy(e: Event): void {
    const v = (e.target as HTMLSelectElement)?.value;
    if (typeof v === 'string') this.sortBy.set(v);
  }

  stepBedrooms(delta: number): void {
    this.bedroomsMin.set(Math.max(0, Math.min(10, this.bedroomsMin() + delta)));
  }

  resetFilters(): void {
    this.selectedTransaction.set('all');
    this.searchCity.set('');
    this.selectedCategory.set('');
    this.priceMax.set(500000);
    this.bedroomsMin.set(0);
    this.hasGenerator.set(false);
    this.hasWaterTank.set(false);
    this.hasStarlink.set(false);
    this.sortBy.set('recent');
    this.toast.show('Filtres réinitialisés');
  }

  applyFilters(): void {
    this.toast.show(`${this.filteredListings().length} biens trouvés`);
  }

  openListingDetail(id: string | number): void {
    this.router.navigate(['/listing', String(id)]);
  }

  navigateHostWizard(): void {
    if (this.authSvc.user()) {
      this.router.navigate(['/host-wizard']);
    } else {
      this.toast.show('Connectez-vous pour publier une annonce');
      this.router.navigate(['/login']);
    }
  }

  navigateDashboard(): void {
    if (this.authSvc.user()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  setContactName(e: Event): void {
    const v = (e.target as HTMLInputElement)?.value;
    if (typeof v === 'string') this.contactName.set(v);
  }
  setContactEmail(e: Event): void {
    const v = (e.target as HTMLInputElement)?.value;
    if (typeof v === 'string') this.contactEmail.set(v);
  }
  setContactSubject(e: Event): void {
    const v = (e.target as HTMLSelectElement)?.value;
    if (typeof v === 'string') this.contactSubject.set(v);
  }
  setContactMessage(e: Event): void {
    const v = (e.target as HTMLTextAreaElement)?.value;
    if (typeof v === 'string') this.contactMessage.set(v);
  }

  onContactSubmit(e: Event): void {
    e.preventDefault();
    this.isContactOpen.set(false);
    this.contactName.set('');
    this.contactEmail.set('');
    this.contactMessage.set('');
    this.toast.show('Message transmis à l\'équipe InzuConnect. Réponse sous 24h.');
  }

  formatPrice(value: number): string {
    if (!value && value !== 0) return '0 FBu';
    return `${Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FBu`;
  }
}
