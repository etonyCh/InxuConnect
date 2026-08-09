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
       1. TOP NAVIGATION BAR
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
      <a class="topnav__link is-active" (click)="scrollToHero()">Accueil</a>
      <a class="topnav__link" (click)="setSearchTab('buy'); scrollToHero()">Acheter</a>
      <a class="topnav__link" (click)="setSearchTab('rent'); scrollToHero()">Louer</a>
      <a class="topnav__link" (click)="setSearchTab('new'); scrollToHero()">Neuf</a>
      <a class="topnav__link" (click)="scrollTo('about')">À propos</a>
      <a class="topnav__link" (click)="scrollTo('footer')">Contact</a>
    </div>

    <div class="topnav__actions">
      <button class="icon-btn" title="Favoris" (click)="isWishlistOpen.set(true)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>
      </button>

      @if (user()) {
        <button class="btn btn-ghost btn-sm" (click)="navigateDashboard()">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
          {{ user()?.name || 'Mon Compte' }}
        </button>
      } @else {
        <a class="btn btn-ghost btn-sm" routerLink="/login">Connexion</a>
      }

      <button class="btn btn-primary btn-sm" (click)="navigateHostWizard()">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Publier une annonce
      </button>
    </div>
  </nav>

  <!-- ============================================================
       2. HERO BANNER + SEARCH TABS
       ============================================================ -->
  <header id="hero" class="hero hero--v2">
    <div class="hero__content">
      <p class="hero__eyebrow mono">RÉSERVATION · EAU · ÉLECTRICITÉ — TROIS SIGNAUX, UN SÉJOUR</p>
      <h1 class="hero__title">Un logement au Burundi, <span>garanti connecté.</span></h1>
      <p class="hero__sub">
        Maisons, appartements, villas, terrains… Trouvez le bien qui vous correspond parmi
        des milliers d'annonces <strong>vérifiées InzuConnect</strong> — eau, électricité, hôte.
      </p>
      <div class="hero__cta-row">
        <button class="btn btn-primary" (click)="scrollToFeatured()">Découvrir les biens</button>
        <button class="btn btn-ghost-dark" (click)="navigateHostWizard()">Je suis hôte</button>
      </div>
    </div>

    <!-- SEARCH BOX WITH TABS -->
    <div class="search-box">
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
        <div class="field search-field">
          <label>Localisation</label>
          <div class="search-field__inner">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22s-7-6.3-7-12a7 7 0 1 1 14 0c0 5.7-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <input type="text" placeholder="Bujumbura, Gitega, Ngozi…" name="searchCity" [(ngModel)]="searchCity" list="city-suggest" autocomplete="off">
          </div>
          <datalist id="city-suggest">
            <option value="Bujumbura">Bujumbura (tout)</option>
            <option value="Rohero">Rohero · Bujumbura</option>
            <option value="Kigobe">Kigobe · Bujumbura</option>
            <option value="Kinindo">Kinindo · Bujumbura</option>
            <option value="Gitega">Gitega</option>
            <option value="Ngozi">Ngozi</option>
            <option value="Bururi">Bururi</option>
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
          </select>
        </div>

        <button type="submit" class="btn btn-primary search-submit" aria-label="Lancer la recherche">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
          Rechercher
        </button>
      </form>
    </div>
  </header>

  <!-- ============================================================
       3. TRUST BADGES (4 ICÔNES)
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
       4. CATEGORIES (6 CARDS GRID)
       ============================================================ -->
  <section class="category-section" id="about">
    <header class="section-head">
      <div>
        <p class="section-eyebrow mono">PAR CATÉGORIE</p>
        <h2>Explorez par type de bien</h2>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="scrollTo('listings')">Tous les biens →</button>
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
       5. SECTION BIENS À LA UNE
       ============================================================ -->
  <section id="featured" class="featured-section">
    <header class="section-head">
      <div>
        <p class="section-eyebrow mono">NOS SÉLECTIONS</p>
        <h2>Biens à la une</h2>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="scrollTo('listings')">Voir toutes les annonces →</button>
    </header>

    <div class="featured-grid">
      @if (featuredListings().length === 0) {
        <p style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--ink-on-light-65);">Chargement des biens à la une…</p>
      }
      @for (l of featuredListings(); track l.id) {
        <div class="featured-card" (click)="openListingDetail(l.id)" style="cursor:pointer">
          <div class="featured-card__media">
            <span class="featured-card__badge" [class.is-rent]="rentTabActive()">
              {{ rentTabActive() ? 'À louer' : 'À vendre' }}
            </span>
            <button class="featured-card__heart" (click)="$event.stopPropagation(); toggleFavorite(l)" aria-label="Favori">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>
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
            <h4 class="featured-card__title">{{ l.title }}</h4>
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
       6. MAIN LISTINGS & QUICKBAR
       ============================================================ -->
  <main id="listings" class="content">
    <nav class="category-bar">
      <div class="hscroll">
        @for (cat of categories; track cat) {
          <button class="chip" [class.is-active]="activeCategory()===cat" (click)="activeCategory.set(cat); loadByCategory(cat)">
            @if (cat === 'tous') { Tous les biens }
            @if (cat === 'maison') { Maison }
            @if (cat === 'studio') { Studio }
            @if (cat === 'villa') { Villa }
            @if (cat === 'appartement') { Appartement }
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
        <span class="quickbar__voice-icon">
          <span class="pulse"></span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        </span>
        <span class="quickbar__voice-text">
          <strong>Assistant vocal InzuConnect</strong>
          <em>Kirundi ou Français — « Une maison à Gitega avec groupe électrogène »</em>
        </span>
      </button>
      <div class="quickbar__creative">
        <button class="creative-chip" (click)="isStagingOpen.set(true)">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
          AI Staging Déco
        </button>
        <button class="creative-chip" (click)="isTransferOpen.set(true)">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
          Transfert Aéroport
        </button>
      </div>
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
       7. STATS CTA BANNER
       ============================================================ -->
  <section class="stats-cta">
    <div class="stats-cta__left">
      <h2>Vous avez un bien<br>à vendre ou à louer ?</h2>
      <p>
        Publiez votre annonce <strong>gratuitement</strong> et touchez des milliers de
        potentiels acheteurs ou locataires — partout au Burundi et dans la diaspora.
      </p>
      <button class="btn btn-primary" (click)="navigateHostWizard()">Publier une annonce</button>
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
       8. FOOTER WITH FULL WORKING REDIRECTIONS
       ============================================================ -->
  <footer class="footer" id="footer">
    <div class="footer__cols">
      <div class="footer__col">
        <div class="footer__logo">
          <span class="logo__mark"><span class="pulse"></span></span>
          <strong>InzuConnect</strong>
        </div>
        <p>
          InzuConnect est votre partenaire immobilier de confiance pour acheter,
          louer ou vendre votre bien en toute sérénité au Burundi.
        </p>
      </div>

      <div class="footer__col">
        <h5>Liens rapides</h5>
        <ul>
          <li><a (click)="scrollToHero()">Accueil</a></li>
          <li><a (click)="setSearchTab('buy'); scrollToHero()">Acheter</a></li>
          <li><a (click)="setSearchTab('rent'); scrollToHero()">Louer</a></li>
          <li><a (click)="setSearchTab('new'); scrollToHero()">Vendre</a></li>
          <li><a (click)="navigateHostWizard()">Publier une annonce</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h5>Informations</h5>
        <ul>
          <li><a (click)="scrollTo('about')">Qui sommes-nous ?</a></li>
          <li><a (click)="isKycOpen.set(true)">Vérification KYC & Badge</a></li>
          <li><a (click)="isTransferOpen.set(true)">Services de Transfert</a></li>
          <li><a (click)="isVoiceOpen.set(true)">Assistant Vocal Kirundi</a></li>
          <li><a (click)="isFilterOpen.set(true)">Recherche Avancée</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <h5>Newsletter</h5>
        <p>Recevez nos nouvelles annonces et nos conseils immo.</p>
        <form class="footer__newsletter" (submit)="onNewsletterSubmit($event)">
          <input type="email" required placeholder="Votre email" autocomplete="email" [value]="newsletterEmail()" (input)="setNewsletterEmail($event)">
          <button type="submit" class="btn btn-dark btn-sm" aria-label="S'abonner">Envoyer</button>
        </form>
      </div>
    </div>

    <div class="footer__bottom">
      <small>© 2026 InzuConnect. Tous droits réservés.</small>
      <small>Plateforme certifiée pour le Burundi</small>
    </div>
  </footer>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav">
    <button class="mobile-nav__tab is-active" (click)="scrollToHero()">Accueil</button>
    <button class="mobile-nav__tab" (click)="scrollTo('listings')">Recherche</button>
    <button class="mobile-nav__tab mobile-nav__tab--plus" (click)="navigateHostWizard()">+</button>
    <button class="mobile-nav__tab" (click)="isChatOpen.set(true)">Messages</button>
    <button class="mobile-nav__tab" (click)="isWishlistOpen.set(true)">Favoris</button>
  </nav>
</div>

<!-- ==================== MODALS ==================== -->
<div class="overlay overlay--center" [class.is-open]="isFilterOpen()">
  <div class="overlay__backdrop" (click)="isFilterOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Tous les filtres</h3>
      <button class="overlay__close" (click)="isFilterOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="filter-block">
        <div class="filter-block__row">
          <label class="mono">Prix maximum / nuit</label>
          <span class="mono">{{ formatPrice(priceMax()) }}</span>
        </div>
        <input type="range" min="15000" max="500000" step="5000" [value]="priceMax()" (input)="setPriceMax($event)">
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
              <span>{{ amenity.label }}</span>
            </label>
          }
        </div>
      </div>

      <div class="overlay__footer">
        <button class="btn btn-ghost" (click)="isFilterOpen.set(false)">Annuler</button>
        <button class="btn btn-primary" (click)="applyFilters()">Appliquer les filtres</button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--drawer" [class.is-open]="isChatOpen()">
  <div class="overlay__backdrop" (click)="isChatOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Messagerie Hôte</h3>
      <button class="overlay__close" (click)="isChatOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="chat-list">
        @for (chat of mockChats; track chat.id) {
          <div class="chat-row" style="padding:1rem;border-bottom:1px solid #eee;cursor:pointer">
            <strong>{{ chat.name }}</strong>
            <p style="font-size:0.85rem;color:#666">{{ chat.lastMessage }}</p>
          </div>
        }
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isWishlistOpen()">
  <div class="overlay__backdrop" (click)="isWishlistOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Mes favoris</h3>
      <button class="overlay__close" (click)="isWishlistOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="featured-grid" style="grid-template-columns:1fr">
        @for (listing of favoriteListings(); track listing.id) {
          <div (click)="openListingDetail(listing.id); isWishlistOpen.set(false)" style="cursor:pointer;padding:1rem;border:1px solid #eee;border-radius:12px">
            <h4>{{ listing.title }}</h4>
            <p>{{ formatPrice(listing.pricePerNightFbu) }} / nuit</p>
          </div>
        }
        @if (favoriteListings().length === 0) {
          <p style="text-align:center;padding:2rem 0;color:var(--ink-on-light-65);">Aucun favori pour le moment.</p>
        }
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isKycOpen()">
  <div class="overlay__backdrop" (click)="isKycOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Vérification KYC & Badge</h3>
      <button class="overlay__close" (click)="isKycOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <p style="margin-bottom:1rem">Téléversez votre pièce d'identité pour obtenir le badge Vérifié.</p>
      <div class="dropzone">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <strong>Photo pièce d'identité (CIP / Passeport)</strong>
      </div>
      <div class="overlay__footer">
        <button class="btn btn-ghost" (click)="isKycOpen.set(false)">Fermer</button>
        <button class="btn btn-primary" (click)="isKycOpen.set(false); toast.show('Dossier KYC soumis')">Soumettre</button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isStagingOpen()">
  <div class="overlay__backdrop" (click)="isStagingOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">AI Staging Déco</h3>
      <button class="overlay__close" (click)="isStagingOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="dropzone">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        <strong>Charger une photo de pièce vide</strong>
      </div>
      <div class="overlay__footer">
        <button class="btn btn-ghost" (click)="isStagingOpen.set(false)">Annuler</button>
        <button class="btn btn-primary" (click)="generateStaging()">Générer l'image</button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isTransferOpen()">
  <div class="overlay__backdrop" (click)="isTransferOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Transfert Aéroport</h3>
      <button class="overlay__close" (click)="isTransferOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <div class="vehicle-grid">
        @for (veh of vehicles; track veh.id) {
          <button type="button" class="vehicle-card" [class.is-active]="selectedVehicle()===veh.id" (click)="selectVehicle(veh)">
            <span>{{ veh.name }}</span><em class="mono">{{ veh.price }} FBu</em>
          </button>
        }
      </div>
      <div class="overlay__footer">
        <button class="btn btn-ghost" (click)="isTransferOpen.set(false)">Annuler</button>
        <button class="btn btn-primary" (click)="bookTransfer()">Réserver — <span class="mono">{{ transferPrice() }}</span></button>
      </div>
    </div>
  </div>
</div>

<div class="overlay overlay--center" [class.is-open]="isVoiceOpen()">
  <div class="overlay__backdrop" (click)="isVoiceOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Assistant vocal (Kirundi & Français)</h3>
      <button class="overlay__close" (click)="isVoiceOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <p style="margin-bottom:1rem">Appuyez pour parler en Kirundi ou tapez votre recherche.</p>
      <div class="overlay__footer">
        <button class="btn btn-ghost" (click)="isVoiceOpen.set(false)">Fermer</button>
        <button class="btn btn-primary" (click)="runVoiceSearch()">Lancer la recherche</button>
      </div>
    </div>
  </div>
</div>
`,
})
export class HomePageComponent implements OnInit {
  private readonly listingSvc = inject(ListingService);
  readonly toast = inject(ToastService);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);

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

  readonly listings = signal<Listing[]>([]);
  readonly featuredListings = computed<Listing[]>(() => {
    return this.listings().slice(0, 4);
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
  readonly priceMax = signal(250000);
  readonly bedroomsMin = signal(1);
  readonly selectedAmenities = signal<string[]>([]);
  readonly transferPrice = signal('15 000 FBu');
  readonly selectedVehicle = signal(1);
  readonly user = computed(() => this.authSvc.user());

  readonly categories = ['tous', 'maison', 'studio', 'villa', 'appartement', 'Bujumbura', 'Gitega', 'Ngozi'];

  readonly amenityOptions = [
    { value: 'salle-de-bain', label: 'Salle de bain privée' },
    { value: 'wifi', label: 'WiFi Haut Débit' },
    { value: 'cuisine', label: 'Cuisine Équipée' },
    { value: 'groupe', label: 'Groupe électrogène' },
    { value: 'citerne', label: 'Citerne d\'eau autonome' },
    { value: 'starlink', label: 'Internet Starlink' },
  ];

  readonly vehicles = [
    { id: 1, name: 'Moto Express', price: '15 000' },
    { id: 2, name: 'Berline Confort', price: '45 000' },
    { id: 3, name: 'Van VIP', price: '70 000' },
    { id: 4, name: 'SUV 4x4', price: '90 000' },
  ];

  readonly mockChats = [
    { id: 1, name: 'Eric N. · Villa Kigobe', lastMessage: 'Bonjour, votre check-in est confirmé pour 14h' },
    { id: 2, name: 'Claudine M. · Studio Rohero', lastMessage: 'Le groupe électrogène est testé et prêt.' },
  ];

  readonly favoriteListings = computed(() => this.listings().filter((l) => l.isFavorite));

  setNewsletterEmail(e: Event): void {
    const v = (e.target as HTMLInputElement)?.value;
    if (typeof v === 'string') this.newsletterEmail.set(v);
  }
  setPriceMax(e: Event): void {
    const n = Number((e.target as HTMLInputElement)?.value);
    if (!Number.isNaN(n)) this.priceMax.set(n);
  }

  ngOnInit(): void {
    this.listingSvc.getListings().subscribe((data) => {
      this.listings.set(data);
    });
  }

  // REDIRECTIONS INTELLIGENTES & AUTHENTIFICATION
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
    const backendCat = cat.backendCategory || cat.key;
    this.listingSvc.getListings(backendCat, this.searchCity()).subscribe((data) => {
      this.listings.set(data);
      this.toast.show(`${cat.label} · ${data.length} biens`);
    });
    this.scrollTo('listings');
  }

  onHeroSearchSubmit(): void {
    const hasGenerator = this.selectedAmenities().includes('groupe');
    const hasWaterTank = this.selectedAmenities().includes('citerne');
    const hasStarlink = this.selectedAmenities().includes('starlink');
    const maxPrice = this.searchPriceMax() ?? this.priceMax();
    const bedrooms = this.searchPieces() ?? this.bedroomsMin();
    const loc = this.searchCity();

    this.listingSvc.filterAdvanced({
      city: loc.length > 0 ? loc : undefined,
      maxPrice: maxPrice > 0 ? maxPrice : undefined,
      bedroomsMin: bedrooms > 0 ? bedrooms : undefined,
      hasGenerator, hasWaterTank, hasStarlink,
    }).subscribe((data) => {
      this.listings.set(data);
      this.toast.show(`${data.length} biens trouvés`);
      this.scrollTo('listings');
    });
  }

  onNewsletterSubmit(e: Event): void {
    e.preventDefault();
    const email = this.newsletterEmail().trim();
    if (!email) return;
    this.newsletterEmail.set('');
    this.toast.show(`Inscription newsletter effectuée — ${email}`);
  }

  listingSurfaceEstimate(l: Listing): string {
    const bedrooms = Math.max(1, l.bedroomsCount ?? 1);
    return `${bedrooms * 28 + 20} m²`;
  }

  loadByCategory(cat: string): void {
    this.listingSvc.getListings(cat, this.searchCity()).subscribe((data) => {
      this.listings.set(data);
    });
  }

  openListingDetail(id: string | number): void {
    this.router.navigate(['/listing', String(id)]);
  }

  toggleFavorite(listing: Listing): void {
    const all = this.listings().slice();
    const idx = all.findIndex((l) => l.id === listing.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], isFavorite: !all[idx].isFavorite };
      this.listings.set(all);
    }
    this.toast.show(listing.isFavorite ? `Retiré des favoris` : `${listing.title} ajouté aux favoris`);
  }

  resetFilters(): void {
    this.activeCategory.set('tous');
    this.activeCategoryKey.set('');
    this.searchCity.set('');
    this.searchType.set('');
    this.searchPriceMin.set(null);
    this.searchPriceMax.set(null);
    this.searchPieces.set(0);
    this.priceMax.set(250000);
    this.bedroomsMin.set(1);
    this.selectedAmenities.set([]);
    this.listingSvc.getListings().subscribe((data) => this.listings.set(data));
    this.toast.show('Filtres réinitialisés');
    this.scrollToHero();
  }

  stepBedrooms(delta: number): void {
    this.bedroomsMin.set(Math.max(0, Math.min(10, this.bedroomsMin() + delta)));
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

  generateStaging(): void {
    this.toast.show('Génération AI Déco en cours…');
    setTimeout(() => {
      this.isStagingOpen.set(false);
      this.toast.show('Rendu AI généré avec succès');
    }, 1800);
  }

  selectVehicle(veh: { id: number; price: string }): void {
    this.selectedVehicle.set(veh.id);
    this.transferPrice.set(`${veh.price} FBu`);
  }

  bookTransfer(): void {
    this.isTransferOpen.set(false);
    this.toast.show(`Transfert réservé — ${this.transferPrice()}`);
  }

  runVoiceSearch(): void {
    this.listingSvc.getListings('Gitega').subscribe((data) => this.listings.set(data));
    this.isVoiceOpen.set(false);
    this.toast.show('Recherche Kirundi appliquée (Gitega)');
    this.scrollTo('listings');
  }

  formatPrice(value: number): string {
    if (!value && value !== 0) return '0 FBu';
    return `${Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FBu`;
  }
}
