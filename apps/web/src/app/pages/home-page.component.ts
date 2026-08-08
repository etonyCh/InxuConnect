import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCardComponent } from '../components/listing-card.component';
import { ListingService } from '../services/listing.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Listing } from '../models/listing.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent, FormsModule],
  template: `
<div class="app-shell" id="appShell">

  <header class="hero">
    <div class="hero__topline">
      <div class="hero__nav">
        <button class="logo" aria-label="Retour à l'accueil, réinitialiser les filtres" (click)="resetFilters()">
          <span class="logo__mark"><span class="pulse"></span></span>
          InzuConnect
        </button>

        <div class="hero__actions">
          <button class="icon-btn icon-btn--ghost" title="Messagerie hôte" aria-label="Ouvrir la messagerie" (click)="isChatOpen.set(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.7 8.7 0 0 1-3.8-.9L3 20l1.1-4.3A8.4 8.4 0 1 1 21 11.5Z"/></svg>
          </button>
          <button class="icon-btn icon-btn--ghost" title="Mes favoris" aria-label="Ouvrir mes favoris" (click)="isWishlistOpen.set(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>
          </button>
          <a class="btn btn-ghost-dark btn-sm mobile-hide" routerLink="/host-wizard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Créer une annonce
          </a>
          <a class="btn btn-ghost-dark btn-sm mobile-hide" routerLink="/dashboard">Revenus hôte</a>
          <button class="profile-pill" title="Vérification & Badge" (click)="isKycOpen.set(true)">
            <span class="profile-pill__avatar">{{userInitials()}}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/></svg>
          </button>
        </div>
      </div>

      <p class="hero__eyebrow mono">RÉSERVATION · EAU · ÉLECTRICITÉ — TROIS SIGNAUX, UN SÉJOUR</p>
      <h1 class="hero__title">Un logement au Burundi, <span>garanti connecté.</span></h1>

      <form class="search-pill" (ngSubmit)="onSearchSubmit()">
        <div class="search-pill__seg">
          <label>Où</label>
          <input type="text" [(ngModel)]="searchWhere" name="searchWhere" placeholder="Bujumbura, Gitega, Ngozi…" autocomplete="off">
        </div>
        <div class="search-pill__div"></div>
        <div class="search-pill__seg">
          <label>Quand</label>
          <input type="text" [(ngModel)]="searchWhen" name="searchWhen" placeholder="Ajouter des dates" autocomplete="off">
        </div>
        <div class="search-pill__div"></div>
        <div class="search-pill__seg">
          <label>Qui</label>
          <input type="text" [(ngModel)]="searchWho" name="searchWho" placeholder="Voyageurs" autocomplete="off">
        </div>
        <button type="submit" class="search-pill__btn" aria-label="Rechercher">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>
        </button>
      </form>
    </div>

    <div class="impact-strip">
      <div class="impact-strip__label">
        <span class="pulse"></span>
        <span>Ikigega — impact communautaire, en direct</span>
      </div>
      <div class="impact-strip__stats">
        <div class="impact-stat">
          <span class="impact-stat__value mono">2 340 500 <small>FBu</small></span>
          <span class="impact-stat__label">reversés ce mois-ci</span>
        </div>
        <div class="impact-stat">
          <span class="impact-stat__value mono">48</span>
          <span class="impact-stat__label">châteaux d'eau financés</span>
        </div>
        <div class="impact-stat">
          <span class="impact-stat__value mono">212</span>
          <span class="impact-stat__label">foyers électrifiés</span>
        </div>
      </div>
    </div>
  </header>

  <main class="content">

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
      <span class="mono">{{filterBannerText()}}</span>
      <button class="btn btn-ghost btn-sm" (click)="resetFilters()">Réinitialiser</button>
    </div>

    <div class="listings-head">
      <h2>{{resultsCount()}}</h2>
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
        <p style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--ink-on-light-65);">Aucun logement ne correspond à vos critères.</p>
      }
    </section>

    <section class="map-view" [hidden]="!showMap()">
      <div class="map-view__canvas"></div>
    </section>

  </main>

  <nav class="mobile-nav">
    <button class="mobile-nav__tab is-active" data-tab="home">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/></svg>
      Accueil
    </button>
    <button class="mobile-nav__tab" data-tab="search">
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
          <span class="mono filter-price-out">{{formatPrice(priceMax())}}</span>
        </div>
        <input type="range" min="15000" max="500000" step="5000" [value]="priceMax()" (input)="priceMax.set(+($event.target as HTMLInputElement).value)">
      </div>

      <div class="filter-block">
        <label class="mono">Chambres minimum</label>
        <div class="stepper">
          <button type="button" class="stepper__btn" (click)="stepBedrooms(-1)">−</button>
          <span class="stepper__val mono">{{bedroomsMin()}}</span>
          <button type="button" class="stepper__btn" (click)="stepBedrooms(1)">+</button>
        </div>
      </div>

      <div class="filter-block">
        <label class="mono">Commodités</label>
        <div class="check-grid">
          @for (amenity of amenityOptions; track amenity.value) {
            <label class="check-pill">
              <input type="checkbox" [checked]="selectedAmenities().includes(amenity.value)" (change)="toggleAmenity(amenity.value)">
              <span>{{amenity.icon}} {{amenity.label}}</span>
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
            <span class="chat-row__avatar">{{chat.initials}}</span>
            <span class="chat-row__body">
              <strong>{{chat.name}}</strong>
              <span>{{chat.lastMessage}}</span>
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
            <button type="button" class="chip style-chip" [class.is-active]="selectedStagingStyle()===style" (click)="selectedStagingStyle.set(style)">{{style}}</button>
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
              {{veh.icon}}<span>{{veh.name}}</span><em class="mono">{{veh.price}} FBu</em>
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
        <button class="btn btn-primary btn-block" (click)="bookTransfer()">✅ Réserver le transfert — <span class="mono">{{transferPrice()}}</span></button>
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

<div class="toast" [class.is-show]="toast.state().show"><span class="pulse"></span><span>{{toast.state().text}}</span></div>
  `,
})
export class HomePageComponent implements OnInit {
  private readonly listingSvc = inject(ListingService);
  readonly toast = inject(ToastService);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);

  readonly listings = signal<Listing[]>([]);
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

  ngOnInit(): void {
    this.listingSvc.getListings().subscribe((data) => {
      this.listings.set(data);
    });
  }

  loadByCategory(cat: string): void {
    this.listingSvc.getListings(cat, this.searchWhere()).subscribe((data) => {
      this.listings.set(data);
    });
  }

  onSearchSubmit(): void {
    this.listingSvc.getListings(this.activeCategory(), this.searchWhere()).subscribe((data) => {
      this.listings.set(data);
      this.toast.show('Recherche lancée');
    });
  }

  openListingDetail(id: number): void {
    this.router.navigate(['/listing', id]);
  }

  toggleFavorite(listing: Listing): void {
    if (listing.isFavorite) {
      this.toast.show(`${listing.title} ajouté aux favoris`);
    } else {
      this.toast.show(`Retiré des favoris`);
    }
  }

  hasActiveFilters(): boolean {
    return (
      this.priceMax() < 500000 ||
      this.bedroomsMin() > 1 ||
      this.selectedAmenities().length > 0 ||
      this.searchWhere() !== '' ||
      this.activeCategory() !== 'tous'
    );
  }

  filterBannerText(): string {
    const parts: string[] = [];
    if (this.activeCategory() !== 'tous') parts.push(`Catégorie: ${this.activeCategory()}`);
    if (this.searchWhere()) parts.push(`Lieu: ${this.searchWhere()}`);
    if (this.priceMax() < 500000) parts.push(`≤ ${this.formatPrice(this.priceMax())}`);
    if (this.bedroomsMin() > 1) parts.push(`${this.bedroomsMin()}+ ch.`);
    if (this.selectedAmenities().length) parts.push(`${this.selectedAmenities().length} commodité(s)`);
    return parts.length ? parts.join(' · ') : 'Filtres actifs';
  }

  resetFilters(): void {
    this.activeCategory.set('tous');
    this.searchWhere.set('');
    this.searchWhen.set('');
    this.searchWho.set('');
    this.priceMax.set(250000);
    this.bedroomsMin.set(1);
    this.selectedAmenities.set([]);
    this.listingSvc.getListings().subscribe((data) => this.listings.set(data));
    this.toast.show('Filtres réinitialisés');
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
    this.toast.show('Filtres appliqués');
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
