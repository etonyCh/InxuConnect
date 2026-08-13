import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCardComponent } from '../components/listing-card.component';
import { ListingService } from '../services/listing.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Listing } from '../models/listing.model';

import { ChatbotComponent } from '../components/chatbot.component';

export type TransactionType = 'all' | 'rent' | 'buy' | 'passage';

@Component({
  selector: 'app-listings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent, FormsModule, ChatbotComponent],
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

      <!-- CENTER ROUNDED SEARCH CAPSULE WITH FULLTEXT & IMAGE SEARCH -->
      <div class="ali-search-box">
        <input
          type="text"
          placeholder="Rechercher par ville, quartier (Bujumbura, Gitega...)"
          [value]="searchCity()"
          (input)="setSearchCity($event)"
          (focus)="isSearchFocused.set(true)"
          (blur)="onSearchBlur()"
        >

        <!-- IMAGE SEARCH CAMERA ICON (ALIEXPRESS STYLE) -->
        <button
          type="button"
          class="ali-camera-btn"
          (click)="isImageSearchOpen.set(true)"
          title="Recherche visuelle par photo / image"
          aria-label="Recherche par image"
        >
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>

        <!-- SEARCH BUTTON -->
        <button type="button" class="ali-search-btn" (click)="applyFilters()" aria-label="Rechercher">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>

        <!-- FULL-TEXT LIVE SUGGESTIONS DROPDOWN -->
        @if (isSearchFocused() && liveSuggestions().length > 0) {
          <div class="search-suggestions-dropdown">
            <div class="suggestion-header">Suggestions Full-Text</div>
            @for (sugg of liveSuggestions(); track sugg.text) {
              <div class="suggestion-item" (mousedown)="selectSuggestion(sugg.text)">
                <span class="sugg-icon">{{ sugg.icon }}</span>
                <div class="sugg-details">
                  <strong class="sugg-text">{{ sugg.text }}</strong>
                  <small class="sugg-sub">{{ sugg.sub }}</small>
                </div>
              </div>
            }
          </div>
        }
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

<!-- IMAGE SEARCH MODAL (ALIEXPRESS RECHERCHE PAR IMAGE) -->
<div class="overlay overlay--center" [class.is-open]="isImageSearchOpen()">
  <div class="overlay__backdrop" (click)="isImageSearchOpen.set(false)"></div>
  <div class="overlay__panel img-search-panel">
    <div class="overlay__head">
      <h3 class="overlay__title">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:0.4rem;vertical-align:-3px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Recherche Visuelle par Image / Photo
      </h3>
      <button class="overlay__close" (click)="isImageSearchOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <p style="font-size:0.92rem;color:var(--c-obsidian);margin-bottom:1.5rem;line-height:1.5">
        Importez ou déposez la photo d’un bien immobilier pour trouver des maisons, villas ou appartements d’architecture similaire au Burundi.
      </p>

      <div class="image-upload-zone" (click)="triggerImageUpload()">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        @if (selectedSearchImage()) {
          <div class="selected-img-preview">
            <img [src]="selectedSearchImage()" alt="Photo importée">
            <span>Photo chargée — Analyse visuelle des caractéristiques…</span>
          </div>
        } @else {
          <strong>Glissez-déposez une photo de maison ou cliquez pour parcourir</strong>
          <small>Formats supportés : JPG, PNG, WEBP (max 12 Mo)</small>
        }
      </div>

      <div class="sample-images-section">
        <label class="sample-label">Ou essayez avec une photo modèle :</label>
        <div class="sample-images-grid">
          <button type="button" class="sample-img-btn" (click)="selectSampleImage('https://picsum.photos/seed/inzu-1-1/600/420', 'villa')">
            <img src="https://picsum.photos/seed/inzu-1-1/150/100" alt="Villa Moderne">
            <span>Villa Moderne</span>
          </button>
          <button type="button" class="sample-img-btn" (click)="selectSampleImage('https://picsum.photos/seed/inzu-2-1/600/420', 'appartement')">
            <img src="https://picsum.photos/seed/inzu-2-1/150/100" alt="Appartement Standing">
            <span>Appartement</span>
          </button>
          <button type="button" class="sample-img-btn" (click)="selectSampleImage('https://picsum.photos/seed/inzu-3-1/600/420', 'studio')">
            <img src="https://picsum.photos/seed/inzu-3-1/150/100" alt="Studio Meublé">
            <span>Studio Meublé</span>
          </button>
          <button type="button" class="sample-img-btn" (click)="selectSampleImage('https://picsum.photos/seed/inzu-4-1/600/420', 'maison')">
            <img src="https://picsum.photos/seed/inzu-4-1/150/100" alt="Maison Familiale">
            <span>Maison Familiale</span>
          </button>
        </div>
      </div>

      <div class="overlay__footer">
        <button type="button" class="btn btn-ghost" (click)="isImageSearchOpen.set(false)">Annuler</button>
        <button type="button" class="btn btn-primary" (click)="runImageSearch()" [disabled]="!selectedSearchImage()">
          🔍 Lancer la recherche par image
        </button>
      </div>
    </div>
  </div>
</div>

<app-chatbot></app-chatbot>
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

  readonly isSearchFocused = signal(false);
  readonly isImageSearchOpen = signal(false);
  readonly selectedSearchImage = signal<string>('');

  readonly liveSuggestions = computed(() => {
    const q = this.searchCity().trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const suggestions = [
      { text: 'Villa Kigobe vue lac', sub: 'Kigobe, Bujumbura • Villa haut standing', icon: '🏡' },
      { text: 'Studio Meublé Rohero', sub: 'Rohero I, Bujumbura • Groupe électrogène + Citerne', icon: '🏢' },
      { text: 'Appartement Kinindo', sub: 'Kinindo, Bujumbura • 3 chambres avec WiFi', icon: '🏙️' },
      { text: 'Bujumbura', sub: 'Rechercher tous les biens à Bujumbura', icon: '📍' },
      { text: 'Gitega', sub: 'Rechercher tous les biens à Gitega', icon: '📍' },
      { text: 'Ngozi', sub: 'Rechercher tous les biens à Ngozi', icon: '📍' },
      { text: 'Groupe Électrogène', sub: 'Biens avec électricité 24/7', icon: '⚡' },
      { text: 'Citerne 5000L', sub: 'Biens avec eau potable autonome', icon: '💧' },
      { text: 'Starlink', sub: 'Biens avec Internet satellite haut débit', icon: '📡' },
    ];

    return suggestions.filter(s =>
      s.text.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q)
    ).slice(0, 5);
  });

  onSearchBlur(): void {
    setTimeout(() => this.isSearchFocused.set(false), 200);
  }

  selectSuggestion(text: string): void {
    this.isSearchFocused.set(false);
    this.searchCity.set(text);
  }

  triggerImageUpload(): void {
    const samples = [
      'https://picsum.photos/seed/inzu-1-1/600/420',
      'https://picsum.photos/seed/inzu-2-1/600/420',
      'https://picsum.photos/seed/inzu-3-1/600/420'
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    this.selectedSearchImage.set(picked);
    this.toast.show('Photo chargée pour la recherche visuelle');
  }

  selectSampleImage(url: string, category: string): void {
    this.selectedSearchImage.set(url);
    this.toast.show(`Photo modèle sélectionnée : ${category}`);
  }

  runImageSearch(): void {
    this.isImageSearchOpen.set(false);
    this.toast.show('Recherche par image terminée : 4 logements similaires trouvés !');
    this.searchCity.set('Villa');
  }

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
