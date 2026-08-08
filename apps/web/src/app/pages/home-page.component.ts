import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCardComponent } from '../components/listing-card.component';
import { ListingService } from '../services/listing.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Listing } from '../models/listing.model';

export type SearchTab = 'buy' | 'rent' | 'new';

interface CategoryCard {
  key: string;
  label: string;
  icon: string;
  count: number;
  backendCategory?: string;
}

interface TrustBadge { icon: string; title: string; desc: string; }
interface StatItem { icon: string; value: string; label: string; }

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent, FormsModule],
  template: `
<div class="app-shell" id="appShell">

  <!-- ============================================================
       1. TOP NAVIGATION BAR (inspiré HomeNest + Royal Homes)
       ============================================================ -->
  <nav class="topnav">
    <button class="topnav__logo" (click)="resetFilters()" aria-label="Accueil InzuConnect">
      <span class="logo__mark"><span class="pulse"></span></span>
      <span>
        <strong>InzuConnect</strong>
        <small>Trouvez votre chez-vous</small>
      </span>
    </button>

    <div class="topnav__menu">
      <a class="topnav__link is-active" routerLink="/" fragment="hero">Accueil</a>
      <a class="topnav__link" (click)="setSearchTab('buy'); scrollToHero()">Acheter</a>
      <a class="topnav__link" (click)="setSearchTab('rent'); scrollToHero()">Louer</a>
      <a class="topnav__link" (click)="setSearchTab('new'); scrollToHero()">Neuf</a>
      <a class="topnav__link" routerLink="/dashboard">À propos</a>
      <a class="topnav__link" routerLink="/host-wizard">Contact</a>
    </div>

    <div class="topnav__actions">
      <button class="icon-btn icon-btn--ghost" title="Favoris" (click)="isWishlistOpen.set(true)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>
      </button>
      <a class="btn btn-dark btn-sm publish-btn" routerLink="/host-wizard">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Publier une annonce
      </a>
    </div>
  </nav>

  <!-- ============================================================
       2. HERO BANNER + SEARCH TABS (Acheter / Louer / Neuf)
       ============================================================ -->
  <header id="hero" class="hero hero--v2">
    <div class="hero__content">
      <p class="hero__eyebrow serif-rule mono">TROUVEZ LA MAISON DE VOS RÊVES</p>
      <h1 class="hero__title">Découvrez des biens <span>d'exception</span></h1>
      <p class="hero__sub">
        Maisons, appartements, villas, terrains… Trouvez le bien qui vous correspond parmi
        des milliers d'annonces <strong>vérifiées InzuConnect</strong> — eau, électricité, hôte.
      </p>
      <div class="hero__cta-row">
        <a class="btn btn-primary" (click)="scrollToFeatured()">Découvrir les biens</a>
        <a class="btn btn-ghost" routerLink="/host-wizard">Je suis hôte</a>
      </div>
    </div>

    <!-- SEARCH BOX WITH TABS - inspiré exactement HomeNest FR + Royal Homes -->
    <div class="search-box surface">
      <div class="search-box__tabs" role="tablist">
        @for (t of searchTabs; track t.key) {
          <button
            role="tab"
            class="search-box__tab"
            [class.is-active]="activeTab() === t.key"
            (click)="setSearchTab(t.key)"
          >
            <span class="search-box__tab-icon" [innerHTML]="t.icon"></span>
            {{ t.label }}
          </button>
        }
      </div>

      <form class="search-box__fields" (ngSubmit)="onHeroSearchSubmit()">
        <div class="field search-field search-field--loc">
          <label>Localisation</label>
          <div class="search-field__inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22s-7-6.3-7-12a7 7 0 1 1 14 0c0 5.7-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <input type="text" placeholder="Ville, quartier, région…" name="searchCity" [(ngModel)]="searchCity" list="city-suggest" autocomplete="off">
          </div>
          <datalist id="city-suggest">
            <option value="Bujumbura">Bujumbura (tout)</option>
            <option value="Rohero">Rohero · Bujumbura</option>
            <option value="Kigobe">Kigobe · Bujumbura</option>
            <option value="Kinindo">Kinindo · Bujumbura</option>
            <option value="Gitega">Gitega</option>
            <option value="Ngozi">Ngozi</option>
            <option value="Bururi">Bururi</option>
            <option value="Rumonge">Rumonge</option>
            <option value="Makamba">Makamba</option>
            <option value="Cibitoke">Cibitoke</option>
          </datalist>
        </div>

        <div class="field search-field">
          <label>Type de bien</label>
          <select name="searchType" [(ngModel)]="searchType">
            <option value="">Tous les types</option>
            @for (cat of categoryCards; track cat.key) {
              <option [value]="cat.key">{{ cat.label }}</option>
            }
          </select>
        </div>

        <div class="field search-field">
          <label>Prix min</label>
          <div class="search-field__inner">
            <input type="number" min="0" step="10000" placeholder="Min" name="searchPriceMin" [(ngModel)]="searchPriceMin">
            <small class="mono">FBu</small>
          </div>
        </div>

        <div class="field search-field">
          <label>Prix max</label>
          <div class="search-field__inner">
            <input type="number" min="0" step="10000" placeholder="Max" name="searchPriceMax" [(ngModel)]="searchPriceMax">
            <small class="mono">FBu</small>
          </div>
        </div>

        <div class="field search-field">
          <label>Pièces</label>
          <select name="searchPieces" [(ngModel)]="searchPieces">
            <option [value]="0">Toutes</option>
            <option [value]="1">1+ pièce</option>
            <option [value]="2">2+ pièces</option>
            <option [value]="3">3+ pièces</option>
            <option [value]="4">4+ pièces</option>
            <option [value]="5">5+ pièces</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary search-submit" aria-label="Lancer la recherche">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
          Rechercher
        </button>
      </form>
    </div>
  </header>

  <!-- ============================================================
       3. TRUST BADGES 4 icônes (HomeNest exact)
       ============================================================ -->
  <section class="trust-strip">
    @for (b of trustBadges; track b.title) {
      <div class="trust-item">
        <div class="trust-item__icon" [innerHTML]="b.icon"></div>
        <div>
          <strong>{{ b.title }}</strong>
          <p>{{ b.desc }}</p>
        </div>
      </div>
    }
  </section>

  <!-- ============================================================
       4. 6 CARTES CATÉGORIES (Royal Homes exact 6 cards layout)
       ============================================================ -->
  <section class="category-section surface-alt">
    <header class="section-head">
      <div>
        <p class="section-eyebrow mono">PARCATÉGORIE</p>
        <h2 class="serif-rule">Explorez par type de bien</h2>
      </div>
      <a class="btn btn-ghost btn-sm" (click)="scrollTo('listings')">Tous les biens →</a>
    </header>

    <div class="category-grid">
      @for (cat of categoryCards; track cat.key) {
        <button
          type="button"
          class="category-card"
          [class.is-active]="activeCategoryKey() === cat.key"
          (click)="applyCategoryFilter(cat)"
        >
          <span class="category-card__icon" [innerHTML]="cat.icon"></span>
          <span class="category-card__label">{{ cat.label }}</span>
          <small class="mono category-card__count">{{ cat.count }} biens</small>
        </button>
      }
    </div>
  </section>

  <!-- ============================================================
       5. SECTION BIENS À LA UNE (4 cards like HomeNest FR)
       ============================================================ -->
  <section id="featured" class="featured-section">
    <header class="section-head">
      <div>
        <p class="section-eyebrow mono">NOS SÉLECTIONS</p>
        <h2 class="serif-rule">Biens à la une</h2>
      </div>
      <a class="btn btn-ghost btn-sm" (click)="scrollTo('listings')">Voir toutes les annonces →</a>
    </header>

    <div class="featured-grid">
      @if (featuredListings().length === 0) {
        <p style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--ink-on-light-65);">Chargement des biens à la une…</p>
      }
      @for (l of featuredListings(); track l.id; let idx = $index) {
        <div class="featured-card">
          <div class="featured-card__media">
            <span class="featured-card__badge" [class.is-rent]="rentTabActive()">
              {{ rentTabActive() ? 'À louer' : 'À vendre' }}
            </span>
            <button class="featured-card__heart" (click)="toggleFavorite(l)" aria-label="Favori">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>
            </button>
            @if (l.photos[0]) {
              <img [src]="l.photos[0]" [alt]="l.title" loading="lazy">
            }
            <div class="featured-card__meta-row">
              <small>{{ l.bedroomsCount }} pièces</small>
              <small>{{ l.guestsCount }} pers.</small>
              <small>{{ (l.amenities[0] || 'Confort') }}</small>
            </div>
          </div>
          <div class="featured-card__body">
            <h3 class="featured-card__price"><strong>{{ formatPrice(l.pricePerNightFbu) }}</strong><span>/nuit</span></h3>
            <h4 (click)="openListingDetail(l.id)" class="featured-card__title">{{ l.title }}</h4>
            <p class="featured-card__loc">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s-7-6.3-7-12a7 7 0 1 1 14 0c0 5.7-7 12-7 12Z"/></svg>
              {{ l.location || 'Bujumbura, Burundi' }}
            </p>
            <div class="featured-card__tags">
              <span>{{ l.bedroomsCount }} chambres</span>
              <span>{{ listingSurfaceEstimate(l) }}</span>
              <span>{{ (l.bathroomsCount || 1) }} salle(s) de bain</span>
            </div>
          </div>
        </div>
      }
    </div>
  </section>

  <!-- ============================================================
       6. (conservé) CATEGORY BAR chips ancienne + VOICE AI bar
       ============================================================ -->
  <main id="listings" class="content">
    <nav class="category-bar">
      <div class="hscroll">
        @for (cat of categories; track cat) {
          <button class="chip" [class.is-active]="activeCategory()===cat" (click)="activeCategory.set(cat); loadByCategory(cat)">
            @if (cat === 'tous') { Tous }
            @if (cat === 'maison') { 🏡 Maison }
            @if (cat === 'studio') { 🛏️ Studio }
            @if (cat === 'villa') { 🏛️ Villa }
            @if (cat === 'appartement') { 🏢 Appartement }
            @if (cat === 'Bujumbura') { Bujumbura }
            @if (cat === 'Gitega') { Gitega }
            @if (cat === 'Ngozi') { Ngozi }
          </button>
        }
      </div>
      <button class="btn btn-ghost btn-sm filter-cta" (click)="isFilterOpen.set(true)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/><circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="10" cy="18" r="1.6" fill="currentColor"/></svg>
        Tous les filtres
      </button>
    </nav>

    <div class="quickbar">
      <button class="quickbar__voice" (click)="isVoiceOpen.set(true)">
        <span class="quickbar__voice-icon"><span class="pulse"></span>🎙️</span>
        <span class="quickbar__voice-text">
          <strong>Parlez à l'assistant InzuConnect</strong>
          <em>Kirundi ou Français — « Une maison à Gitega avec groupe électrogène »</em>
        </span>
      </button>
      <div class="quickbar__creative">
        <button class="creative-chip" (click)="isStagingOpen.set(true)">🪄 AI Staging Déco</button>
        <button class="creative-chip" (click)="isTransferOpen.set(true)">🚕 Transfert Aéroport</button>
      </div>
    </div>

    <div class="filter-banner" [hidden]="!hasActiveFilters()">
      <span class="mono">{{ filterBannerText() }}</span>
      <button class="btn btn-ghost btn-sm" (click)="resetFilters()">Réinitialiser</button>
    </div>

    <div class="listings-head">
      <h2>{{ resultsCount() }}</h2>
      <button class="btn btn-dark btn-sm" (click)="showMap.set(!showMap())">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 20 3 17V4l6 3m0 13 6-3m-6 3V7m6 10 6 3V7l-6-3m0 16V4m0 3-6-3"/></svg>
        {{ showMap() ? 'Voir la liste' : 'Voir la carte' }}
      </button>
    </div>

    <section class="listings-grid" [hidden]="showMap()">
      @for (listing of listings(); track listing.id) {
        <app-listing-card
          [listing]="listing"
          (clicked)="openListingDetail($event)"
          (favorited)="toggleFavorite($event)"
        />
      }
      @if (listings().length === 0) {
        <p style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--ink-on-light-65);">Aucun logement ne correspond à vos critères — élargissez votre recherche.</p>
      }
    </section>

    <section class="map-view" [hidden]="!showMap()">
      <div class="map-view__canvas"></div>
    </section>
  </main>

  <!-- ============================================================
       7. STATS 4 CHIFFRES CTA banner (HomeNest exact)
       ============================================================ -->
  <section class="stats-cta surface-dark">
    <div class="stats-cta__left">
      <h2>Vous avez un bien<br>à vendre ou à louer ?</h2>
      <p>
        Publiez votre annonce <strong>gratuitement</strong> et touchez des milliers de
        potentiels acheteurs ou locataires — partout au Burundi et dans la diaspora.
      </p>
      <a class="btn btn-primary btn--luxe" routerLink="/host-wizard">Publier une annonce</a>
    </div>
    <div class="stats-grid">
      @for (s of stats; track s.label) {
        <div class="stat-card">
          <span [innerHTML]="s.icon" class="stat-card__icon"></span>
          <strong class="mono">{{ s.value }}</strong>
          <small>{{ s.label }}</small>
        </div>
      }
    </div>
  </section>

  <!-- ============================================================
       8. FOOTER (HomeNest style : 4 colonnes + newsletter + copyright)
       ============================================================ -->
  <footer class="footer">
    <div class="footer__cols">
      <div class="footer__col footer__col--brand">
        <div class="footer__logo">
          <span class="logo__mark"><span class="pulse"></span></span>
          <strong>InzuConnect</strong>
        </div>
        <p>
          InzuConnect est votre partenaire immobilier de confiance pour acheter,
          louer ou vendre votre bien en toute sérénité au Burundi.
        </p>
        <div class="footer__socials">
          <a href="#" class="icon-btn" aria-label="Facebook"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.5-1.5h1.7V4.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6V14h2.6v8h3.3Z"/></svg></a>
          <a href="#" class="icon-btn" aria-label="Instagram"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
          <a href="#" class="icon-btn" aria-label="X/Twitter"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.5 3H21l-6.5 7.5L22 21h-6.2l-4.8-6L5 21H2.5l7-8L2 3h6.3l4.4 5.7L18.5 3Zm-2.4 16.2h1.7L8 4.8H6.2l9.9 14.4Z"/></svg></a>
          <a href="#" class="icon-btn" aria-label="LinkedIn"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9Z"/></svg></a>
        </div>
      </div>

      <div class="footer__col">
        <h5>Liens rapides</h5>
        <ul>
          <li><a (click)="scrollToHero()">Accueil</a></li>
          <li><a (click)="setSearchTab('buy'); scrollToHero()">Acheter</a></li>
          <li><a (click)="setSearchTab('rent'); scrollToHero()">Louer</a></li>
          <li><a (click)="setSearchTab('new'); scrollToHero()">Vendre</a></li>
          <li><a routerLink="/dashboard">À propos</a></li>
          <li><a routerLink="/host-wizard">Contact</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h5>Informations</h5>
        <ul>
          <li><a>Qui sommes-nous ?</a></li>
          <li><a>Nos services</a></li>
          <li><a>Mentions légales</a></li>
          <li><a>Conditions d'utilisation</a></li>
          <li><a>Politique de confidentialité</a></li>
          <li><a>FAQ</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h5>Newsletter</h5>
        <p class="footer__newsletter-desc">
          Recevez nos nouvelles annonces et nos conseils immo.
        </p>
        <form class="footer__newsletter" (submit)="onNewsletterSubmit($event)">
          <input type="email" required placeholder="Votre email" autocomplete="email" [value]="newsletterEmail()" (input)="newsletterEmail.set(($event.target as HTMLInputElement).value)">
          <button type="submit" class="btn btn-dark btn-sm" aria-label="S'abonner">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>

    <div class="footer__bottom">
      <small>© 2026 InzuConnect. Tous droits réservés.</small>
      <small>Conçu avec ❤️ pour votre futur chez-vous.</small>
    </div>
  </footer>

  <!-- Mobile nav + old overlays (all kept intact 100% compat back) -->
  <nav class="mobile-nav">
    <button class="mobile-nav__tab is-active" data-tab="home">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/></svg>
      Accueil
    </button>
    <button class="mobile-nav__tab" data-tab="search" (click)="scrollToHero()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
      Recherche
    </button>
    <a class="mobile-nav__tab mobile-nav__tab--plus" routerLink="/host-wizard">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </a>
    <button class="mobile-nav__tab" data-tab="messages" (click)="isChatOpen.set(true)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.7 8.7 0 0 1-3.8-.9L3 20l1.1-4.3A8.4 8.4 0 1 1 21 11.5Z"/></svg>
      Messages
    </button>
    <button class="mobile-nav__tab" data-tab="favorites" (click)="isWishlistOpen.set(true)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>
      Favoris
    </button>
  </nav>
</div>

<!-- ============ MODALS (ALL KEPT INTACT FROM PREVIOUS SIGNAL&GRID) ============ -->
<div class="overlay overlay--center" [class.is-open]="isFilterOpen()">
  <div class="overlay__backdrop" data-close (click)="isFilterOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Tous les filtres</h3>
      <button class="overlay__close" data-close aria-label="Fermer" (click)="isFilterOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="filter-block">
        <div class="filter-block__row">
          <label class="mono">Prix maximum / nuit</label>
          <span class="mono filter-price-out">{{ formatPrice(priceMax()) }}</span>
        </div>
        <input type="range" min="15000" max="500000" step="5000" [value]="priceMax()" (input)="priceMax.set(+($event.target as HTMLInputElement).value)">
      </div>

      <div class="filter-block">
        <label class="mono">Chambres minimum</label>
        <div class="stepper">
          <button type="button" class="stepper__btn" (click)="stepBedrooms(-1)">−</button>
          <span class="stepper__val mono">{{ bedroomsMin() }}</span>
          <button type="button" class="stepper__btn" (click)="stepBedrooms(1)">+</button>
        </div>
      </div>

      <div class="filter-block">
        <label class="mono">Commodités</label>
        <div class="check-grid">
          @for (amenity of amenityOptions; track amenity.value) {
            <label class="check-pill">
              <input type="checkbox" [checked]="selectedAmenities().includes(amenity.value)" (change)="toggleAmenity(amenity.value)">
              <span>{{ amenity.icon }} {{ amenity.label }}</span>
            </label>
          }
        </div>
      </div>

      <div class="filter-block">
        <label class="mono">Accessibilité</label>
        <div class="check-grid">
          <label class="check-pill"><input type="checkbox"><span>♿ Rampe d'accès</span></label>
          <label class="check-pill"><input type="checkbox"><span>🛗 Ascenseur</span></label>
        </div>
      </div>

      <div class="overlay__footer">
        <button class="btn btn-ghost btn-block" (click)="isFilterOpen.set(false)">Annuler</button>
        <button class="btn btn-primary btn-block" (click)="applyFilters()">Appliquer les filtres</button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--drawer" [class.is-open]="isChatOpen()">
  <div class="overlay__backdrop" data-close (click)="isChatOpen.set(false)"></div>
  <div class="overlay__panel chat-panel">
    <div class="overlay__head">
      <h3 class="overlay__title">{{ chatView() === 'list' ? 'Messagerie' : 'Conversation' }}</h3>
      <button class="overlay__close" data-close aria-label="Fermer" (click)="isChatOpen.set(false)">✕</button>
    </div>

    <div class="overlay__body">
      <div class="chat-list" [hidden]="chatView() !== 'list'">
        @for (chat of mockChats; track chat.id) {
          <button class="chat-row" (click)="openChatThread(chat.id)">
            <span class="chat-row__avatar">{{ chat.initials }}</span>
            <span class="chat-row__body">
              <strong>{{ chat.name }}</strong>
              <span>{{ chat.lastMessage }}</span>
            </span>
            @if (chat.unread) { <span class="pulse"></span> }
          </button>
        }
      </div>

      <div class="chat-thread" [hidden]="chatView() !== 'thread'">
        <button class="chat-thread__back" (click)="chatView.set('list'); activeChatThread.set(null)">← Retour aux conversations</button>
        <div class="chat-thread__messages">
          <div class="msg msg--theirs">Bonjour, votre check-in est confirmé pour 14h 👋</div>
          <div class="msg msg--mine">Parfait, merci ! Le groupe électrogène est bien en place ?</div>
          <div class="msg msg--theirs">Oui, tout est testé et prêt pour votre arrivée. À très vite !</div>
        </div>
        <form class="chat-thread__input" (submit)="sendChatMessage($event)">
          <button type="button" class="icon-btn" aria-label="Joindre un fichier">📎</button>
          <input type="text" placeholder="Écrire un message…" autocomplete="off" [value]="chatInputText()" (input)="chatInputText.set(($event.target as HTMLInputElement).value)">
          <button type="submit" class="btn btn-primary btn-sm">Envoyer</button>
        </form>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isWishlistOpen()">
  <div class="overlay__backdrop" data-close (click)="isWishlistOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Mes favoris</h3>
      <button class="overlay__close" data-close aria-label="Fermer" (click)="isWishlistOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="wishlist-grid">
        @for (listing of favoriteListings(); track listing.id) {
          <app-listing-card
            [listing]="listing"
            (clicked)="openListingDetail($event); isWishlistOpen.set(false)"
            (favorited)="toggleFavorite($event)"
          />
        }
        @if (favoriteListings().length === 0) {
          <p style="grid-column:1/-1;text-align:center;padding:2rem 0;color:var(--ink-on-light-65);">Aucun favori pour le moment.</p>
        }
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isKycOpen()">
  <div class="overlay__backdrop" data-close (click)="isKycOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Vérification KYC & Badge</h3>
      <button class="overlay__close" data-close aria-label="Fermer" (click)="isKycOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="steps-dots">
        @for (step of [1,2,3,4]; track step) {
          <span [class.is-active]="kycStep() >= step"></span>
        }
      </div>

      <div class="kyc-step" [class.is-active]="kycStep()===1">
        <div class="field"><label>Prénom</label><input type="text" placeholder="Diane"></div>
        <div class="field"><label>Nom</label><input type="text" placeholder="Ndayishimiye"></div>
        <div class="field"><label>Date de naissance</label><input type="date"></div>
        <div class="field"><label>N° téléphone</label><input type="tel" placeholder="+257 79 000 000"></div>
        <div class="field"><label>Adresse postale</label><input type="text" placeholder="Rohero I, Bujumbura"></div>
      </div>

      <div class="kyc-step" [class.is-active]="kycStep()===2">
        <div class="dropzone"><span>📄</span><strong>Photo pièce d'identité</strong><em>CIP ou passeport</em></div>
        <div class="dropzone"><span>🏠</span><strong>Justificatif de domicile</strong><em>Facture eau / électricité</em></div>
      </div>

      <div class="kyc-step" [class.is-active]="kycStep()===3">
        <label class="consent-row">
          <input type="checkbox">
          <span>J'accepte que InzuConnect traite mes données conformément au RGPD à des fins de vérification d'identité.</span>
        </label>
      </div>

      <div class="kyc-step" [class.is-active]="kycStep()===4">
        <div class="kyc-status">
          <span class="pulse"></span>
          <div>
            <strong>En attente de vérification</strong>
            <p>Votre dossier a été soumis. Statut habituellement mis à jour sous 24h.</p>
          </div>
        </div>
      </div>

      <div class="overlay__footer">
        <button class="btn btn-ghost btn-block" (click)="kycStepBack()" [disabled]="kycStep()<=1">Retour</button>
        <button class="btn btn-primary btn-block" (click)="kycStepNext()">{{ kycStep() >= 4 ? 'Terminer' : 'Continuer' }}</button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isStagingOpen()">
  <div class="overlay__backdrop" data-close (click)="isStagingOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">🪄 AI Staging Déco</h3>
      <button class="overlay__close" data-close aria-label="Fermer" (click)="isStagingOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="dropzone">
        <span>📷</span><strong>Charger une photo de pièce vide</strong><em>JPG, PNG — 10 Mo max</em>
      </div>
      <div class="field" style="margin-top:1.2rem">
        <label>Style souhaité</label>
        <div class="check-grid">
          @for (style of stagingStyles; track style) {
            <button type="button" class="chip style-chip" [class.is-active]="selectedStagingStyle()===style" (click)="selectedStagingStyle.set(style)">{{ style }}</button>
          }
        </div>
      </div>

      <div class="staging-result" [hidden]="!stagingGenerating()">
        <div class="staging-result__loading" [hidden]="stagingResultImg()">
          <span class="pulse"></span> Génération de l'image en cours…
        </div>
        @if (stagingResultImg()) {
          <img [src]="stagingResultImg()!" alt="Rendu généré par IA">
        }
      </div>

      <div class="overlay__footer">
        <button class="btn btn-ghost btn-block" (click)="isStagingOpen.set(false)">Annuler</button>
        <button class="btn btn-primary btn-block" (click)="generateStaging()">✨ Générer l'image</button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isTransferOpen()">
  <div class="overlay__backdrop" data-close (click)="isTransferOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">🚕 Transfert Aéroport</h3>
      <button class="overlay__close" data-close aria-label="Fermer" (click)="isTransferOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="field"><label>Aéroport de départ</label><input type="text" value="Bujumbura Intl. (BJM)" readonly></div>
      <div class="field"><label>Adresse d'arrivée</label><input type="text" placeholder="Villa Kigobe, Bujumbura"></div>
      <div class="two-col">
        <div class="field"><label>Date</label><input type="date"></div>
        <div class="field"><label>Heure</label><input type="time" value="14:00"></div>
      </div>

      <div class="field">
        <label>Véhicule</label>
        <div class="vehicle-grid">
          @for (veh of vehicles; track veh.id) {
            <button type="button" class="vehicle-card" [class.is-active]="selectedVehicle()===veh.id" (click)="selectVehicle(veh)">
              {{ veh.icon }}<span>{{ veh.name }}</span><em class="mono">{{ veh.price }} FBu</em>
            </button>
          }
        </div>
      </div>

      <div class="two-col">
        <div class="field"><label>Bagages</label><input type="number" min="0" value="1"></div>
        <div class="field"><label>Voyageurs</label><input type="number" min="1" value="1"></div>
      </div>
      <div class="field"><label>Nom du chauffeur (optionnel)</label><input type="text" placeholder="Sur demande"></div>

      <div class="overlay__footer">
        <button class="btn btn-ghost btn-block" (click)="isTransferOpen.set(false)">Annuler</button>
        <button class="btn btn-primary btn-block" (click)="bookTransfer()">✅ Réserver le transfert — <span class="mono">{{ transferPrice() }}</span></button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isVoiceOpen()">
  <div class="overlay__backdrop" data-close (click)="isVoiceOpen.set(false)"></div>
  <div class="overlay__panel voice-panel">
    <div class="overlay__head">
      <h3 class="overlay__title">🎙️ Assistant vocal</h3>
      <button class="overlay__close" data-close aria-label="Fermer" (click)="isVoiceOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <button class="voice-mic" (click)="toggleVoiceRecording()">
        <span class="voice-mic__ring"></span>
        <span class="voice-mic__icon">🎙️</span>
      </button>
      <p class="voice-hint">{{ voiceRecording() ? 'Enregistrement en cours… Parlez maintenant' : 'Appuyez pour parler — Kirundi ou Français (5s)' }}</p>

      <div class="field"><label>Ou tapez votre commande</label>
        <textarea rows="2" placeholder="Ex : Une maison à Gitega avec groupe électrogène, moins de 150 000 FBu" [value]="voiceText()" (input)="voiceText.set(($event.target as HTMLTextAreaElement).value)"></textarea>
      </div>

      <div class="voice-result" [hidden]="!voiceResultText()">
        <strong>Requête IA interprétée</strong>
        <p style="margin-top:.5rem;">{{ voiceResultText() }}</p>
      </div>

      <div class="overlay__footer">
        <button class="btn btn-ghost btn-block" (click)="isVoiceOpen.set(false)">Fermer</button>
        <button class="btn btn-primary btn-block" (click)="runVoiceSearch()">🔍 Lancer la recherche IA</button>
      </div>
    </div>
  </div>
</div>

<div class="toast" [class.is-show]="toast.state().show"><span class="pulse"></span><span>{{ toast.state().text }}</span></div>
`,
})
export class HomePageComponent implements OnInit {
  private readonly listingSvc = inject(ListingService);
  readonly toast = inject(ToastService);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);

  // ----- NEW: Hero search state (HomeNest / Royal Homes style) -----
  readonly activeTab = signal<SearchTab>('rent');
  readonly activeCategoryKey = signal<string>('');

  readonly searchTabs: { key: SearchTab; label: string; icon: string }[] = [
    { key: 'buy',  label: 'Acheter',  icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/></svg>' },
    { key: 'rent', label: 'Louer',   icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 10h10M7 14h10M5 21V6l7-3 7 3v15M3 8h18"/></svg>' },
    { key: 'new',  label: 'Neuf',    icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 18V9a8 8 0 0 1 16 0v9"/><path d="M2 18h20M9 18v-4h6v4"/></svg>' },
  ];

  readonly searchCity = signal('');
  readonly searchType = signal('');
  readonly searchPriceMin = signal<number | null>(null);
  readonly searchPriceMax = signal<number | null>(null);
  readonly searchPieces = signal<number>(0);
  readonly newsletterEmail = signal('');

  readonly trustBadges: TrustBadge[] = [
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
      title: 'Annonces vérifiées', desc: 'Des annonces de qualité vérifiées par nos équipes.' },
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>',
      title: 'Coup de cœur',   desc: 'Enregistrez vos biens préférés et retrouvez-les facilement.' },
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
      title: 'Accompagnement', desc: 'Nos conseillers vous accompagnent à chaque étape.' },
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4M12 15v3"/></svg>',
      title: 'Paiement sécurisé', desc: 'Vos transactions sont sécurisées et en toute confiance.' },
  ];

  readonly categoryCards: CategoryCard[] = [
    { key: 'studio',      label: 'Studios',       icon: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="10" width="18" height="11" rx="1.5"/><path d="M5 10V7a4 4 0 0 1 8 0v3M13 10V7a4 4 0 0 1 8 0v3M8 15h3M8 18h2"/></svg>', count: 342, backendCategory: 'studio' },
    { key: 'appartement', label: 'Appartements', icon: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',                           count: 486, backendCategory: 'appartement' },
    { key: 'maison',      label: 'Maisons',      icon: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11 12 4l9 7M5 10v9h14v-9M9 19v-5h6v5"/></svg>',                                                            count: 512, backendCategory: 'maison' },
    { key: 'villa',       label: 'Villas',       icon: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 11 12 3l9 8M5 11v9h14v-9M9 14h3v6M12 14h3v6M9 11v-1h6v1"/></svg>',                                                         count: 184, backendCategory: 'villa' },
    { key: 'commercial',  label: 'Commerciaux',  icon: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 10h18M9 19v-5h6v5M8 8h.01M12 8h.01M16 8h.01"/></svg>',                               count: 96 },
    { key: 'family',      label: 'Familiaux',    icon: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="2.5"/><circle cx="16" cy="10" r="2"/><path d="M4 21c0-3.6 2.7-6.5 6-6.5M21 21c0-2.8-2.2-5-5-5M12 21v-6"/></svg>',                                                   count: 278, backendCategory: 'maison' },
  ];

  readonly stats: StatItem[] = [
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/></svg>',
      value: '12 458', label: 'Biens disponibles' },
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/><circle cx="17" cy="7" r="3"/></svg>',
      value: '8 745',  label: 'Clients satisfaits' },
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h10l6 6v10H4z"/><path d="M14 4v6h6M8 13h8M8 16h6"/></svg>',
      value: '2 356',  label: 'Annonces publiées' },
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3z"/></svg>',
      value: '15+',    label: 'Années d\'expérience' },
  ];

  readonly rentTabActive = computed(() => this.activeTab() === 'rent');

  // ----- Existing state (compat 100% back) -----
  readonly listings = signal<Listing[]>([]);
  readonly featuredListings = computed<Listing[]>(() => {
    const all = this.listings();
    const out: Listing[] = [];
    const seen = new Set<string>();
    // Sort: newer created first (simulating tab "new") if possible, else stable order
    for (const l of all) {
      if (!l || seen.has(l.id)) continue;
      seen.add(l.id);
      // Filter by active tab category (rent = locations, buy = ventes)
      if (this.activeTab() === 'rent') {
        const cat = (l.category || '').toLowerCase();
        if (cat === 'villa' || cat === 'maison') continue; // rent prefers studio/appartement
      } else if (this.activeTab() === 'buy') {
        const cat = (l.category || '').toLowerCase();
        if (cat === 'studio') continue;
      }
      out.push(l);
      if (out.length >= 4) break;
    }
    // Fallback: at least 4 if filters too strict, take first 4 not duplicated
    if (out.length < 4) {
      for (const l of all) {
        if (out.length >= 4) break;
        if (seen.has(l.id)) continue;
        seen.add(l.id); out.push(l);
      }
    }
    return out;
  });

  readonly resultsCount = computed(() => `${this.listings().length} logements disponibles`);
  readonly activeCategory = signal('tous');
  readonly showMap = signal(false);
  readonly isFilterOpen = signal(false);
  readonly isChatOpen = signal(false);
  readonly isWishlistOpen = signal(false);
  readonly isKycOpen = signal(false);
  readonly isStagingOpen = signal(false);
  readonly isTransferOpen = signal(false);
  readonly isVoiceOpen = signal(false);
  readonly searchWhere = signal('');
  readonly searchWhen = signal('');
  readonly searchWho = signal('');
  readonly priceMax = signal(250000);
  readonly bedroomsMin = signal(1);
  readonly selectedAmenities = signal<string[]>([]);
  readonly kycStep = signal(1);
  readonly chatView = signal<'list' | 'thread'>('list');
  readonly activeChatThread = signal<number | null>(null);
  readonly transferPrice = signal('15 000 FBu');
  readonly user = computed(() => this.authSvc.user());

  readonly categories = ['tous', 'maison', 'studio', 'villa', 'appartement', 'Bujumbura', 'Gitega', 'Ngozi'];

  readonly amenityOptions = [
    { value: 'salle-de-bain', label: 'Salle de bain privée', icon: '🚿' },
    { value: 'wifi', label: 'WiFi', icon: '📶' },
    { value: 'cuisine', label: 'Cuisine', icon: '🍳' },
    { value: 'groupe', label: 'Groupe électrogène', icon: '🔌' },
    { value: 'citerne', label: 'Citerne d\'eau', icon: '💧' },
    { value: 'starlink', label: 'Starlink', icon: '🛰️' },
  ];

  readonly stagingStyles = ['Moderne', 'Africain', 'Minimaliste', 'Luxueux'];
  readonly selectedStagingStyle = signal('Moderne');
  readonly stagingGenerating = signal(false);
  readonly stagingResultImg = signal<string | null>(null);

  readonly vehicles = [
    { id: 1, icon: '🏍️', name: 'Moto', price: '15 000', priceNum: 15000 },
    { id: 2, icon: '🚗', name: 'Berline', price: '45 000', priceNum: 45000 },
    { id: 3, icon: '🚐', name: 'Van', price: '70 000', priceNum: 70000 },
    { id: 4, icon: '🚙', name: '4x4', price: '90 000', priceNum: 90000 },
  ];
  readonly selectedVehicle = signal(1);

  readonly mockChats = [
    { id: 1, initials: 'EN', name: 'Eric N. · Villa Kigobe', lastMessage: 'Bonjour, votre check-in est confirmé pour 14h 👋', unread: true },
    { id: 2, initials: 'CM', name: 'Claudine M. · Studio Rohero', lastMessage: 'Le groupe électrogène est testé et prêt.', unread: false },
    { id: 3, initials: 'AB', name: 'Alain B. · Maison Kinindo', lastMessage: 'Merci pour votre avis 5 étoiles !', unread: false },
  ];

  readonly chatInputText = signal('');
  readonly voiceRecording = signal(false);
  readonly voiceText = signal('');
  readonly voiceResultText = signal('');

  readonly favoriteListings = computed(() => this.listings().filter((l) => l.isFavorite));

  // ================= LIFE CYCLE =================
  ngOnInit(): void {
    this.listingSvc.getListings().subscribe((data) => {
      this.listings.set(data);
    });
  }

  // ================= NEW: Hero + HomeNest actions =================
  setSearchTab(t: SearchTab): void {
    this.activeTab.set(t);
  }

  scrollToHero(): void { this.scrollTo('hero'); }
  scrollToFeatured(): void { this.scrollTo('featured'); }
  scrollTo(id: string): void {
    try {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
  }

  applyCategoryFilter(cat: CategoryCard): void {
    this.activeCategoryKey.set(cat.key);
    this.searchType.set(cat.key);
    this.searchWhere.set('');
    const backendCat = cat.backendCategory || cat.key;
    this.listingSvc.getListings(backendCat, this.searchCity()).subscribe((data) => {
      this.listings.set(data);
      this.toast.show(`${cat.label} · ${data.length} biens`);
    });
    this.scrollTo('listings');
  }

  onHeroSearchSubmit(): void {
    // 100% BACK COMPAT: map fields to listingSvc.filterAdvanced
    const hasGenerator = this.selectedAmenities().includes('groupe');
    const hasWaterTank = this.selectedAmenities().includes('citerne');
    const hasStarlink = this.selectedAmenities().includes('starlink');
    const maxPrice = this.searchPriceMax() ?? this.priceMax();
    const bedrooms = this.searchPieces() ?? this.bedroomsMin();
    const cat = this.searchType() || this.activeCategoryKey() || '';
    const loc = this.searchCity() || this.searchWhere();

    // Step 1: backend filter
    this.listingSvc.filterAdvanced({
      city: loc.length > 0 ? loc : undefined,
      maxPrice: maxPrice > 0 ? maxPrice : undefined,
      bedroomsMin: bedrooms > 0 ? bedrooms : undefined,
      hasGenerator, hasWaterTank, hasStarlink,
    }).subscribe((data) => {
      let out = data;
      // Step 2: category frontend filter (tab Acheter → Villa/Maison, Louer → Studio/Appart)
      if (this.activeTab() === 'buy') {
        out = out.filter((l) => !['studio','chambre'].includes((l.category || '').toLowerCase()));
      } else if (this.activeTab() === 'rent') {
        out = out.filter((l) => !['villa','terrain'].includes((l.category || '').toLowerCase()));
      }
      // Step 3: min price frontend filter (filterAdvanced n'a pas de minPrice endpoint)
      const minPrice = this.searchPriceMin();
      if (minPrice && minPrice > 0) {
        out = out.filter((l) => (l.pricePerNightFbu || 0) >= minPrice);
      }
      // Step 4: specific type select
      if (cat) {
        const chosen = this.categoryCards.find((c) => c.key === cat);
        if (chosen?.backendCategory) {
          out = out.filter((l) => (l.category || '').toLowerCase() === chosen.backendCategory!.toLowerCase());
        } else {
          out = out.filter((l) => (l.category || '').toLowerCase() === cat.toLowerCase());
        }
      }
      this.listings.set(out);
      this.toast.show(`${out.length} biens · ${this.activeTabName()} · ${loc || 'Tout le pays'}`);
      this.scrollTo('listings');
    });
  }

  private activeTabName(): string {
    return this.searchTabs.find((t) => t.key === this.activeTab())?.label || 'Louer';
  }

  onNewsletterSubmit(e: Event): void {
    e.preventDefault();
    const email = this.newsletterEmail().trim();
    if (!email) return;
    this.newsletterEmail.set('');
    this.toast.show(`✅ Inscription newsletter OK — ${email}`);
  }

  listingSurfaceEstimate(l: Listing): string {
    const bedrooms = Math.max(1, l.bedroomsCount ?? 1);
    const sqm = bedrooms * 28 + 20;
    return `${sqm} m²`;
  }

  // ================= EXISTING COMPAT METHODS =================
  loadByCategory(cat: string): void {
    this.listingSvc.getListings(cat, this.searchWhere() || this.searchCity()).subscribe((data) => {
      this.listings.set(data);
    });
  }

  onSearchSubmit(): void {
    this.onHeroSearchSubmit();
  }

  openListingDetail(id: string | number): void {
    this.router.navigate(['/listing', String(id)]);
  }

  toggleFavorite(listing: Listing): void {
    // Flip in memory for UX (non persistant remote — no backend endpoint favoris in schema)
    const all = this.listings().slice();
    const idx = all.findIndex((l) => l.id === listing.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], isFavorite: !all[idx].isFavorite };
      this.listings.set(all);
    }
    this.toast.show(listing.isFavorite ? `Retiré des favoris` : `${listing.title} ajouté aux favoris ♥`);
  }

  hasActiveFilters(): boolean {
    return (
      this.priceMax() < 500000 ||
      this.bedroomsMin() > 1 ||
      this.selectedAmenities().length > 0 ||
      (this.searchWhere() !== '' || this.searchCity() !== '') ||
      this.activeCategory() !== 'tous' ||
      (this.searchPriceMin() ?? 0) > 0 ||
      (this.searchPriceMax() ?? 0) > 0 ||
      this.searchPieces() > 0 ||
      this.searchType() !== ''
    );
  }

  filterBannerText(): string {
    const parts: string[] = [];
    if (this.activeCategory() !== 'tous') parts.push(`Catégorie: ${this.activeCategory()}`);
    if (this.searchCity()) parts.push(`Lieu: ${this.searchCity()}`);
    const pmin = this.searchPriceMin();
    const pmax = this.searchPriceMax() ?? this.priceMax();
    if (pmin) parts.push(`≥ ${this.formatPrice(pmin)}`);
    if (pmax < 500000) parts.push(`≤ ${this.formatPrice(pmax)}`);
    const pieces = this.searchPieces() ?? this.bedroomsMin();
    if (pieces > 1) parts.push(`${pieces}+ ch.`);
    if (this.selectedAmenities().length) parts.push(`${this.selectedAmenities().length} commodité(s)`);
    return parts.length ? parts.join(' · ') : 'Filtres actifs';
  }

  resetFilters(): void {
    this.activeCategory.set('tous');
    this.activeCategoryKey.set('');
    this.activeTab.set('rent');
    this.searchWhere.set(''); this.searchWhen.set(''); this.searchWho.set('');
    this.searchCity.set(''); this.searchType.set('');
    this.searchPriceMin.set(null); this.searchPriceMax.set(null); this.searchPieces.set(0);
    this.priceMax.set(250000); this.bedroomsMin.set(1);
    this.selectedAmenities.set([]);
    this.newsletterEmail.set('');
    this.listingSvc.getListings().subscribe((data) => this.listings.set(data));
    this.toast.show('Filtres réinitialisés');
    this.scrollToHero();
  }

  stepBedrooms(delta: number): void {
    const next = Math.max(0, Math.min(10, this.bedroomsMin() + delta));
    this.bedroomsMin.set(next);
  }

  toggleAmenity(value: string): void {
    const current = this.selectedAmenities();
    if (current.includes(value)) {
      this.selectedAmenities.set(current.filter((v) => v !== value));
    } else {
      this.selectedAmenities.set([...current, value]);
    }
  }

  applyFilters(): void {
    this.isFilterOpen.set(false);
    this.onHeroSearchSubmit();
  }

  openChatThread(id: number): void {
    this.activeChatThread.set(id);
    this.chatView.set('thread');
  }

  sendChatMessage(e: Event): void {
    e.preventDefault();
    if (!this.chatInputText().trim()) return;
    this.chatInputText.set('');
    this.toast.show('Message envoyé');
  }

  kycStepBack(): void {
    if (this.kycStep() > 1) this.kycStep.set(this.kycStep() - 1);
  }

  kycStepNext(): void {
    if (this.kycStep() < 4) {
      this.kycStep.set(this.kycStep() + 1);
    } else {
      this.isKycOpen.set(false);
      this.kycStep.set(1);
      this.toast.show('Dossier KYC soumis');
    }
  }

  generateStaging(): void {
    this.stagingGenerating.set(true);
    this.stagingResultImg.set(null);
    setTimeout(() => {
      this.stagingGenerating.set(false);
      this.toast.show('Rendu généré avec succès');
    }, 2200);
  }

  selectVehicle(veh: { id: number; price: string }): void {
    this.selectedVehicle.set(veh.id);
    this.transferPrice.set(`${veh.price} FBu`);
  }

  bookTransfer(): void {
    this.isTransferOpen.set(false);
    this.toast.show(`Transfert réservé — ${this.transferPrice()}`);
  }

  toggleVoiceRecording(): void {
    this.voiceRecording.set(!this.voiceRecording());
    if (this.voiceRecording()) {
      setTimeout(() => {
        this.voiceRecording.set(false);
        this.voiceText.set('Une maison à Gitega avec groupe électrogène, moins de 150 000 FBu');
      }, 3500);
    }
  }

  runVoiceSearch(): void {
    if (this.voiceText().trim()) {
      this.voiceResultText.set(
        `📍 Lieu: Gitega · 🏡 Type: Maison · 🔌 Groupe électrogène · 💰 Budget ≤ 150 000 FBu/nuit`,
      );
    }
    this.listingSvc.getListings('Gitega').subscribe((data) => this.listings.set(data));
    setTimeout(() => {
      this.isVoiceOpen.set(false);
      this.toast.show('Recherche IA appliquée');
    }, 1200);
  }

  formatPrice(value: number): string {
    if (!value && value !== 0) return '0 FBu';
    const formatted = Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FBu`;
  }

  userInitials(): string {
    const u = this.user();
    if (u?.name) {
      return u.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return 'DN';
  }
}
