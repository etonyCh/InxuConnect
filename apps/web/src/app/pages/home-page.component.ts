import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCardComponent } from '../components/listing-card.component';
import { ListingService } from '../services/listing.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Listing } from '../models/listing.model';

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
      <a class="ali-topnav__logo" routerLink="/" (click)="resetFilters()" aria-label="Accueil InzuConnect">
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
          placeholder="Rechercher une maison, villa, studio à Bujumbura, Gitega, Ngozi..."
          [value]="headerSearchQuery()"
          (input)="setHeaderSearchQuery($event)"
          (keyup.enter)="onHeaderSearch()"
        >
        <button type="button" class="ali-search-btn" (click)="onHeaderSearch()" aria-label="Rechercher">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
      </div>

      <!-- RIGHT ACTIONS BLOCK -->
      <div class="ali-topnav__right">
        <div class="currency-chip" title="Monnaie officielle Burundi">
          <span class="flag">🇧🇮</span>
          <span class="curr mono">FBu</span>
        </div>

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
        <a class="cat-dropdown-btn" routerLink="/biens">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <span>Tous les biens</span>
        </a>

        <div class="ali-subnav__links">
          <a class="subnav-link highlight" routerLink="/biens">🔥 Offres Vérifiées</a>
          <a class="subnav-link" routerLink="/biens">À louer</a>
          <a class="subnav-link" routerLink="/biens">À acheter</a>
          <a class="subnav-link" routerLink="/biens">Maisons de passage</a>
          <a class="subnav-link" (click)="isAboutOpen.set(true)">À propos</a>
          <a class="subnav-link" (click)="isContactOpen.set(true)">Contact</a>
        </div>
      </div>
    </div>
  </header>

  <!-- ============================================================
       2. HERO BANNER + SEARCH BAR
       ============================================================ -->
  <header id="hero" class="hero hero--v2">
    <div class="hero__content">
      <p class="hero__eyebrow mono">RÉSERVATION · EAU · ÉLECTRICITÉ — TROIS SIGNAUX, UN SÉJOUR</p>
      <h1 class="hero__title">Un logement au Burundi, <span>garanti connecté.</span></h1>
      <p class="hero__sub">
        Maisons, appartements, villas, résidences meublées… Trouvez le bien qui vous correspond parmi
        des milliers d'annonces <strong>vérifiées InzuConnect</strong> avec garantie d'eau et d'électricité.
      </p>
      <div class="hero__cta-row">
        <button class="btn btn-primary" (click)="setActiveNav('rent')">Découvrir les logements</button>
        <button class="btn btn-ghost-dark" (click)="navigateHostWizard()">Je suis hôte</button>
      </div>
    </div>

    <!-- CLEAN SINGLE SEARCH BAR -->
    <div class="search-box">
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
       3. TRUST BADGES
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
      <button class="btn btn-ghost btn-sm" (click)="isFilterOpen.set(true)">Filtres avancés →</button>
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
       5. HORIZONTAL CARDS SECTION 1: À LOUER
       ============================================================ -->
  <section id="section-rent" class="horizontal-section">
    <header class="section-head">
      <div>
        <p class="section-eyebrow mono">LOCATIONS DISPONIBLES</p>
        <h2>Biens à louer</h2>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="setActiveNav('buy')">Voir à acheter →</button>
    </header>

    <div class="horizontal-card-row">
      @for (l of rentListings(); track l.id) {
        <div class="card-item-wrap">
          <app-listing-card
            [listing]="l"
            (clicked)="openListingDetail($event)"
          />
        </div>
      }
      @if (rentListings().length === 0) {
        <p style="padding:2rem;color:var(--ink-on-light-65);">Chargement des biens à louer…</p>
      }
    </div>
  </section>

  <!-- ============================================================
       6. HORIZONTAL CARDS SECTION 2: À ACHETER
       ============================================================ -->
  <section id="section-buy" class="horizontal-section">
    <header class="section-head">
      <div>
        <p class="section-eyebrow mono">VENTES IMMOBILIÈRES</p>
        <h2>Biens & Maisons à acheter</h2>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="setActiveNav('passage')">Voir maisons de passage →</button>
    </header>

    <div class="horizontal-card-row">
      @for (l of buyListings(); track l.id) {
        <div class="card-item-wrap">
          <app-listing-card
            [listing]="l"
            (clicked)="openListingDetail($event)"
          />
        </div>
      }
      @if (buyListings().length === 0) {
        <p style="padding:2rem;color:var(--ink-on-light-65);">Chargement des biens à acheter…</p>
      }
    </div>
  </section>

  <!-- ============================================================
       7. HORIZONTAL CARDS SECTION 3: MAISONS DE PASSAGE
       ============================================================ -->
  <section id="section-passage" class="horizontal-section">
    <header class="section-head">
      <div>
        <p class="section-eyebrow mono">SÉJOURS & RÉSIDENCES MEUBLÉES</p>
        <h2>Maisons de passage</h2>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="isFilterOpen.set(true)">Tous les filtres →</button>
    </header>

    <div class="horizontal-card-row">
      @for (l of passageListings(); track l.id) {
        <div class="card-item-wrap">
          <app-listing-card
            [listing]="l"
            (clicked)="openListingDetail($event)"
          />
        </div>
      }
      @if (passageListings().length === 0) {
        <p style="padding:2rem;color:var(--ink-on-light-65);">Chargement des maisons de passage…</p>
      }
    </div>
  </section>

  <!-- ============================================================
       8. QUICKBAR & STATS BANNER
       ============================================================ -->
  <main class="content" style="margin-top:2rem">
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
  </main>

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
       9. FOOTER
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
        <h5>Informations & Services</h5>
        <ul>
          <li><a (click)="setActiveNav('about')">À propos d'InzuConnect</a></li>
          <li><a (click)="setActiveNav('contact')">Formulaire de Contact</a></li>
          <li><a (click)="isKycOpen.set(true)">Vérification KYC & Badge</a></li>
          <li><a (click)="isTransferOpen.set(true)">Services de Transfert</a></li>
          <li><a (click)="isVoiceOpen.set(true)">Assistant Vocal Kirundi</a></li>
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
    <button class="mobile-nav__tab" [class.is-active]="activeNav() === 'accueil'" (click)="setActiveNav('accueil')">Accueil</button>
    <button class="mobile-nav__tab" [class.is-active]="activeNav() === 'rent'" (click)="setActiveNav('rent')">Louer</button>
    <button class="mobile-nav__tab mobile-nav__tab--plus" (click)="navigateHostWizard()">+</button>
    <button class="mobile-nav__tab" [class.is-active]="activeNav() === 'about'" (click)="setActiveNav('about')">À propos</button>
    <button class="mobile-nav__tab" [class.is-active]="activeNav() === 'contact'" (click)="setActiveNav('contact')">Contact</button>
  </nav>
</div>

<!-- ==================== MODALS ==================== -->
<!-- MODAL À PROPOS -->
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
        <button type="button" class="btn btn-primary" (click)="isAboutOpen.set(false); setActiveNav('contact')">Nous contacter</button>
      </div>
    </div>
  </div>
</div>

<!-- MODAL CONTACT -->
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

<div class="overlay overlay--center" [class.is-open]="isKycOpen()">
  <div class="overlay__backdrop" (click)="isKycOpen.set(false)"></div>
  <div class="overlay__panel">
    <div class="overlay__head">
      <h3 class="overlay__title">Vérification KYC & Badge</h3>
      <button class="overlay__close" (click)="isKycOpen.set(false)">✕</button>
    </div>
    <div class="overlay__body">
      <p style="margin-bottom:1rem;color:var(--c-obsidian)">Téléversez votre pièce d'identité pour obtenir le badge Vérifié.</p>
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
      <p style="margin-bottom:1rem;color:var(--c-obsidian)">Appuyez pour parler en Kirundi ou tapez votre recherche.</p>
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

  readonly activeNav = signal<string>('accueil');
  readonly activeCategoryKey = signal<string>('');

  readonly searchCity = signal('');
  readonly searchType = signal('');
  readonly searchPriceMin = signal<number | null>(null);
  readonly searchPriceMax = signal<number | null>(null);
  readonly searchPieces = signal<number>(0);
  readonly newsletterEmail = signal('');
  readonly headerSearchQuery = signal('');

  setHeaderSearchQuery(e: Event): void {
    const v = (e.target as HTMLInputElement)?.value;
    if (typeof v === 'string') this.headerSearchQuery.set(v);
  }

  onHeaderSearch(): void {
    const q = this.headerSearchQuery().trim();
    if (q) {
      this.router.navigate(['/biens'], { queryParams: { q } });
    } else {
      this.router.navigate(['/biens']);
    }
  }

  // MODALS SIGNALS
  readonly isAboutOpen = signal(false);
  readonly isContactOpen = signal(false);
  readonly contactName = signal('');
  readonly contactEmail = signal('');
  readonly contactSubject = signal('renseignement');
  readonly contactMessage = signal('');

  readonly trustBadges: TrustBadge[] = [
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
      title: 'Annonces vérifiées', desc: 'Des annonces de qualité vérifiées par nos équipes.' },
    { icon:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>',
      title: 'Confiance & Qualité', desc: 'Des critères stricts pour votre tranquillité.' },
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

  readonly listings = signal<Listing[]>([]);

  readonly rentListings = computed<Listing[]>(() => {
    return this.listings().filter((l) => ['appartement','studio','chambre'].includes((l.category || '').toLowerCase()) || l.pricePerNightFbu < 180000);
  });

  readonly buyListings = computed<Listing[]>(() => {
    return this.listings().filter((l) => ['villa','maison','terrain'].includes((l.category || '').toLowerCase()) || l.pricePerNightFbu >= 180000);
  });

  readonly passageListings = computed<Listing[]>(() => {
    return this.listings().slice(0, 5);
  });

  readonly resultsCount = computed(() => `${this.listings().length} logements disponibles`);
  readonly showMap = signal(false);
  readonly isFilterOpen = signal(false);
  readonly isChatOpen = signal(false);
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

  setActiveNav(key: string): void {
    this.activeNav.set(key);
    if (key === 'accueil') this.scrollToHero();
    else if (key === 'buy') this.scrollTo('section-buy');
    else if (key === 'rent') this.scrollTo('section-rent');
    else if (key === 'passage') this.scrollTo('section-passage');
    else if (key === 'about') this.isAboutOpen.set(true);
    else if (key === 'contact') this.isContactOpen.set(true);
  }

  setNewsletterEmail(e: Event): void {
    const v = (e.target as HTMLInputElement)?.value;
    if (typeof v === 'string') this.newsletterEmail.set(v);
  }
  setPriceMax(e: Event): void {
    const n = Number((e.target as HTMLInputElement)?.value);
    if (!Number.isNaN(n)) this.priceMax.set(n);
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

  ngOnInit(): void {
    this.listingSvc.getListings().subscribe((data) => {
      this.listings.set(data);
    });
  }

  onContactSubmit(e: Event): void {
    e.preventDefault();
    this.isContactOpen.set(false);
    this.contactName.set('');
    this.contactEmail.set('');
    this.contactMessage.set('');
    this.toast.show('Message transmis à l\'équipe InzuConnect. Réponse sous 24h.');
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

  scrollToHero(): void { this.scrollTo('hero'); }
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
    this.scrollTo('section-rent');
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
      this.scrollTo('section-rent');
    });
  }

  onNewsletterSubmit(e: Event): void {
    e.preventDefault();
    const email = this.newsletterEmail().trim();
    if (!email) return;
    this.newsletterEmail.set('');
    this.toast.show(`Inscription newsletter effectuée — ${email}`);
  }

  openListingDetail(id: string | number): void {
    this.router.navigate(['/listing', String(id)]);
  }

  resetFilters(): void {
    this.activeNav.set('accueil');
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
    this.scrollTo('section-rent');
  }

  formatPrice(value: number): string {
    if (!value && value !== 0) return '0 FBu';
    return `${Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FBu`;
  }
}
