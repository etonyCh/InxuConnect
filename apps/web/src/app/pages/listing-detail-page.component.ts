import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Listing } from '../models/listing.model';
import { ListingService } from '../services/listing.service';
import { ToastService } from '../services/toast.service';
import { ListingCardComponent } from '../components/listing-card.component';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, ListingCardComponent],
  template: `
    <!-- ============================================================
         1. TOP BAR NAVIGATION
         ============================================================ -->
    <header class="detail-topbar">
      <div class="detail-topbar__inner">
        <a class="detail-topbar__back" routerLink="/biens">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          <span>Retour aux biens</span>
        </a>

        <div class="detail-topbar__actions">
          <button class="btn btn-ghost btn-sm" (click)="onShare()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.8" x2="15.7" y2="6.2"/><line x1="8.3" y1="13.2" x2="15.7" y2="17.8"/></svg>
            Partager
          </button>
        </div>
      </div>
    </header>

    <main class="detail-wrap">
      @if (listing(); as l) {
        <!-- HEADER TITLE & BADGES -->
        <section class="detail-head">
          <div class="detail-head__left">
            <span class="detail-category-tag mono">{{ l.category || 'Maison' }} · {{ l.province || 'Burundi' }}</span>
            <h1 class="detail-title">{{ l.title }}</h1>
            <div class="detail-meta-row">
              <span class="rating-badge">★ {{ l.rating || '4.9' }}</span>
              <span class="reviews-count">({{ l.reviewCount || 42 }} avis vérifiés)</span>
              <span class="dot-sep">•</span>
              <span class="loc-text">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s-7-6.3-7-12a7 7 0 1 1 14 0c0 5.7-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                {{ l.location }}, {{ l.province || 'Burundi' }}
              </span>
            </div>
          </div>

          <div class="detail-head__right">
            <div class="price-showcase">
              <span class="price-val mono">{{ formatPrice(l.pricePerNightFbu) }} FBu</span>
              <span class="price-unit">/ nuit</span>
            </div>
            <span class="guarantee-chip">✓ Eau & Électricité Garanties</span>
          </div>
        </section>

        <!-- ALIEXPRESS STYLE PHOTO GALLERY GRID + THUMBNAILS -->
        <section class="ali-gallery">
          <div class="ali-gallery__main-wrap" (click)="isLightboxOpen.set(true)">
            <img [src]="photoAt(galleryIdx())" [alt]="l.title" class="ali-gallery__main-img">
            <div class="ali-gallery__zoom-badge">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Agrandir les photos ({{ galleryIdx() + 1 }}/{{ photoCount() }})
            </div>
            <button class="ali-gallery__nav prev" (click)="$event.stopPropagation(); prevImg()">‹</button>
            <button class="ali-gallery__nav next" (click)="$event.stopPropagation(); nextImg()">›</button>
          </div>

          <div class="ali-gallery__thumbs">
            @for (p of photos(); track $index; let i = $index) {
              <button
                type="button"
                class="ali-gallery__thumb"
                [class.is-active]="galleryIdx() === i"
                (mouseenter)="galleryIdx.set(i)"
                (click)="galleryIdx.set(i)"
              >
                <img [src]="p" [alt]="'Photo ' + (i + 1)">
              </button>
            }
          </div>
        </section>

        <!-- MAIN PRODUCT SPECIFICATIONS + STICKY ALIEXPRESS BUY BOX -->
        <div class="detail-grid">
          <div class="detail-info">

            <!-- HOST TRUST BOX -->
            <div class="seller-card">
              <div class="seller-card__left">
                <span class="seller-avatar">{{ hostInitials(l.hostName) }}</span>
                <div>
                  <div class="seller-name-row">
                    <strong>Hébergé par {{ l.hostName }}</strong>
                    <span class="kyc-badge">✓ Hôte Vérifié KYC</span>
                  </div>
                  <p class="seller-sub">Taux de réponse 99% · Répond en moins de 30 minutes</p>
                </div>
              </div>
              <button class="btn btn-ghost btn-sm" (click)="onContactHost()">
                💬 Contacter l'hôte
              </button>
            </div>

            <!-- KEY SPECIFICATIONS GRID -->
            <div class="specs-grid">
              <div class="spec-box">
                <span class="spec-icon">🛏️</span>
                <div>
                  <strong>{{ l.bedroomsCount }} Chambres</strong>
                  <small>Lits king-size prêts</small>
                </div>
              </div>
              <div class="spec-box">
                <span class="spec-icon">🚿</span>
                <div>
                  <strong>{{ l.bathroomsCount }} Salles de bain</strong>
                  <small>Eau chaude 24h/7d</small>
                </div>
              </div>
              <div class="spec-box">
                <span class="spec-icon">👥</span>
                <div>
                  <strong>{{ l.guestsCount }} Voyageurs max</strong>
                  <small>Espace spacieux</small>
                </div>
              </div>
              <div class="spec-box">
                <span class="spec-icon">📐</span>
                <div>
                  <strong>{{ listingSurfaceEstimate(l) }}</strong>
                  <small>Superficie certifiée</small>
                </div>
              </div>
            </div>

            <hr class="detail-rule">

            <!-- RESILIENCE INFRASTRUCTURE GUARANTEES -->
            <section class="infra-section">
              <h3>Infrastructures & Garanties InzuConnect</h3>
              <p class="section-lede">Pour vous garantir un séjour sans interruption d'eau ni d'électricité au Burundi.</p>

              <div class="infra-cards-grid">
                <div class="infra-item-card" [class.is-dim]="!hasAmenity(l, 'GROUPE ELECTROGENE')">
                  <div class="infra-item-head">
                    <span class="pulse" [class.is-dim]="!hasAmenity(l, 'GROUPE ELECTROGENE')"></span>
                    <span class="infra-icon">⚡</span>
                    <strong>Groupe Électrogène Autonome</strong>
                  </div>
                  <p>{{ hasAmenity(l, 'GROUPE ELECTROGENE') ? 'Déclenchement automatique en 8 secondes en cas de coupure REGIDESO.' : 'Non disponible sur ce logement' }}</p>
                </div>

                <div class="infra-item-card" [class.is-dim]="!hasAmenity(l, 'CITERNE 5000L')">
                  <div class="infra-item-head">
                    <span class="pulse" [class.is-dim]="!hasAmenity(l, 'CITERNE 5000L')"></span>
                    <span class="infra-icon">💧</span>
                    <strong>Citerne d'eau Potable 5000L</strong>
                  </div>
                  <p>{{ hasAmenity(l, 'CITERNE 5000L') ? "Réserve d'eau autonome sous pression constante jusqu'à 5 jours." : 'Non disponible sur ce logement' }}</p>
                </div>

                <div class="infra-item-card" [class.is-dim]="!hasAmenity(l, 'STARLINK')">
                  <div class="infra-item-head">
                    <span class="pulse" [class.is-dim]="!hasAmenity(l, 'STARLINK')"></span>
                    <span class="infra-icon">📡</span>
                    <strong>Internet Haut Débit Starlink</strong>
                  </div>
                  <p>{{ hasAmenity(l, 'STARLINK') ? 'Connexion Internet satellite illimitée haute vitesse.' : 'Non disponible sur ce logement' }}</p>
                </div>

                <div class="infra-item-card" [class.is-dim]="!hasAmenity(l, 'CUISINE EQUIPEE')">
                  <div class="infra-item-head">
                    <span class="pulse" [class.is-dim]="!hasAmenity(l, 'CUISINE EQUIPEE')"></span>
                    <span class="infra-icon">🍳</span>
                    <strong>Cuisine Équipée Gaz & Électrique</strong>
                  </div>
                  <p>{{ hasAmenity(l, 'CUISINE EQUIPEE') ? 'Réchaud mixte gaz et électrique avec ustensiles complets.' : 'Non disponible sur ce logement' }}</p>
                </div>
              </div>
            </section>

            <hr class="detail-rule">

            <!-- DESCRIPTION -->
            <section class="description-section">
              <h3>À propos de ce bien</h3>
              <p class="desc-text">{{ l.description }}</p>
            </section>

            <hr class="detail-rule">

            <!-- REVIEWS SECTION -->
            <section class="reviews-section">
              <div class="reviews-head">
                <h3>Avis des clients ({{ l.reviewCount || 42 }})</h3>
                <span class="score-pill">★ {{ l.rating || '4.9' }} / 5.0</span>
              </div>

              <div class="review-bars-grid">
                <div class="review-bar-item">
                  <span>Propreté</span>
                  <div class="bar-track"><div class="bar-fill" style="width: 98%"></div></div>
                  <strong>4.9</strong>
                </div>
                <div class="review-bar-item">
                  <span>Confort & Équipements</span>
                  <div class="bar-track"><div class="bar-fill" style="width: 96%"></div></div>
                  <strong>4.8</strong>
                </div>
                <div class="review-bar-item">
                  <span>Communication Hôte</span>
                  <div class="bar-track"><div class="bar-fill" style="width: 100%"></div></div>
                  <strong>5.0</strong>
                </div>
                <div class="review-bar-item">
                  <span>Emplacement</span>
                  <div class="bar-track"><div class="bar-fill" style="width: 94%"></div></div>
                  <strong>4.7</strong>
                </div>
              </div>

              <div class="reviews-list">
                <div class="review-card">
                  <div class="review-user">
                    <span class="seller-avatar sm">JN</span>
                    <div>
                      <strong>Jeanne N.</strong>
                      <small>Séjour en Juillet 2026</small>
                    </div>
                  </div>
                  <p>« Séjour impeccable ! Le groupe électrogène s'est déclenché automatiquement pendant l'orage, aucun arrêt de WiFi ni de lumière. Hôte très serviable. »</p>
                </div>

                <div class="review-card">
                  <div class="review-user">
                    <span class="seller-avatar sm">PM</span>
                    <div>
                      <strong>Patrick M.</strong>
                      <small>Séjour en Août 2026</small>
                    </div>
                  </div>
                  <p>« Villa de très haut standing à Bujumbura. Cadre sécurisé et vue splendide. Je recommande vivement pour les déplacements professionnels. »</p>
                </div>
              </div>
            </section>
          </div>

          <!-- STICKY ALIEXPRESS-STYLE BOOKING CARD -->
          <aside class="sticky-buy-box">
            <div class="buy-box-card">
              <div class="buy-box-header">
                <div class="buy-box-price">
                  <strong class="mono">{{ formatPrice(l.pricePerNightFbu) }} FBu</strong>
                  <span>/ nuit</span>
                </div>
                <span class="buy-box-stock">✓ Disponible aujourd'hui</span>
              </div>

              <div class="buy-box-fields">
                <div class="date-fields-row">
                  <div class="date-field">
                    <label>Arrivée</label>
                    <input type="date" [(ngModel)]="checkIn" (change)="computeNights()">
                  </div>
                  <div class="date-field">
                    <label>Départ</label>
                    <input type="date" [(ngModel)]="checkOut" (change)="computeNights()">
                  </div>
                </div>

                <div class="guest-field">
                  <label>Nombre de voyageurs</label>
                  <div class="stepper">
                    <button type="button" class="stepper__btn" (click)="decGuests()">−</button>
                    <span class="stepper__val mono">{{ guests() }}</span>
                    <button type="button" class="stepper__btn" (click)="incGuests()">+</button>
                  </div>
                </div>
              </div>

              <!-- PRICE BREAKDOWN -->
              <div class="buy-breakdown">
                <div class="breakdown-row">
                  <span>{{ formatPrice(l.pricePerNightFbu) }} FBu × {{ nights() }} nuits</span>
                  <span class="mono">{{ formatPrice(subtotal()) }} FBu</span>
                </div>
                <div class="breakdown-row">
                  <span>Frais de service InzuConnect (5%)</span>
                  <span class="mono">{{ formatPrice(fee()) }} FBu</span>
                </div>
                <div class="breakdown-row total-row">
                  <strong>Total à régler</strong>
                  <strong class="mono price-total">{{ formatPrice(total()) }} FBu</strong>
                </div>
              </div>

              <button class="btn btn-primary btn-block buy-cta-btn" (click)="onReserve()">
                ⚡ Réserver maintenant
              </button>

              <button class="btn btn-ghost btn-block" (click)="onContactHost()">
                💬 Discuter avec l'hôte
              </button>

              <div class="buy-trust-notes">
                <div class="trust-note-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>Paiement 100% sécurisé (Mobile Money / Carte)</span>
                </div>
                <div class="trust-note-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Annulation gratuite jusqu'à 48h avant l'arrivée</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <!-- SIMILAR LISTINGS CAROUSEL -->
        <section class="similar-section">
          <div class="section-head">
            <div>
              <p class="section-eyebrow mono">RECOMMANDATIONS</p>
              <h2>Logements similaires que vous pourriez aimer</h2>
            </div>
            <button class="btn btn-ghost btn-sm" routerLink="/biens">Voir tout le portefeuille →</button>
          </div>

          <div class="similar-grid">
            @for (sim of similarListings(); track sim.id) {
              <app-listing-card
                [listing]="sim"
                (clicked)="openListingDetail($event)"
              />
            }
          </div>
        </section>
      }
    </main>

    <!-- FULLSCREEN LIGHTBOX MODAL FOR GALLERY -->
    <div class="overlay overlay--center" [class.is-open]="isLightboxOpen()">
      <div class="overlay__backdrop" (click)="isLightboxOpen.set(false)"></div>
      <div class="lightbox-panel">
        <button class="lightbox-close" (click)="isLightboxOpen.set(false)">✕</button>
        <img [src]="photoAt(galleryIdx())" [alt]="listing()?.title" class="lightbox-img">
        <div class="lightbox-nav-row">
          <button class="btn btn-ghost" (click)="prevImg()">‹ Photo précédente</button>
          <span class="mono" style="color:white">{{ galleryIdx() + 1 }} / {{ photoCount() }}</span>
          <button class="btn btn-primary" (click)="nextImg()">Photo suivante ›</button>
        </div>
      </div>
    </div>
  `,
})
export class ListingDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private listingSvc = inject(ListingService);
  readonly toastSvc = inject(ToastService);
  private router = inject(Router);

  listing = signal<Listing | undefined>(undefined);
  allListings = signal<Listing[]>([]);
  galleryIdx = signal(0);
  checkIn = signal('');
  checkOut = signal('');
  guests = signal(2);
  nights = signal(3);
  isLightboxOpen = signal(false);

  subtotal = computed(() => (this.listing()?.pricePerNightFbu ?? 0) * this.nights());
  fee = computed(() => Math.round(this.subtotal() * 0.05));
  total = computed(() => this.subtotal() + this.fee());

  similarListings = computed<Listing[]>(() => {
    const currentId = this.listing()?.id;
    return this.allListings()
      .filter((l) => l.id !== currentId)
      .slice(0, 4);
  });

  ngOnInit(): void {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const departure = new Date();
    departure.setDate(nextWeek.getDate() + this.nights());

    this.checkIn.set(this.toIsoDate(nextWeek));
    this.checkOut.set(this.toIsoDate(departure));

    this.listingSvc.getListings().subscribe((list) => {
      this.allListings.set(list);
    });

    this.route.params.subscribe((params) => {
      const idParam = params['id'];
      const id = Number(idParam) || 1;
      this.listingSvc.getListingById(id).subscribe((l) => {
        if (l) {
          this.listing.set(l);
          if (l.photos?.length) {
            this.galleryIdx.set(0);
          }
        } else {
          this.listing.set(this.fallbackListing(id));
        }
      });
    });
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  photoCount(): number {
    return this.listing()?.photos?.length ?? 5;
  }

  photos(): string[] {
    const l = this.listing();
    if (l?.photos && l.photos.length > 0) {
      const pads: string[] = [];
      for (let i = 0; i < Math.max(5, l.photos.length); i++) {
        pads.push(l.photos[i] ?? `https://picsum.photos/seed/inzu-${l.id}-${i}/800/520`);
      }
      return pads.slice(0, 5);
    }
    const id = l?.id ?? 1;
    return [
      `https://picsum.photos/seed/inzu-${id}-1/1000/700`,
      `https://picsum.photos/seed/inzu-${id}-2/600/420`,
      `https://picsum.photos/seed/inzu-${id}-3/600/420`,
      `https://picsum.photos/seed/inzu-${id}-4/600/420`,
      `https://picsum.photos/seed/inzu-${id}-5/600/420`,
    ];
  }

  photoAt(i: number): string {
    return this.photos()[i] ?? this.photos()[0];
  }

  prevImg(): void {
    const n = this.photoCount();
    this.galleryIdx.set((this.galleryIdx() - 1 + n) % n);
  }

  nextImg(): void {
    const n = this.photoCount();
    this.galleryIdx.set((this.galleryIdx() + 1) % n);
  }

  hostInitials(name: string): string {
    if (!name) return 'HC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'HC';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  hasAmenity(l: Listing, key: string): boolean {
    const arr = l.amenities ?? [];
    return arr.some((a) => a.toUpperCase().includes(key.toUpperCase().slice(0, 6)));
  }

  listingSurfaceEstimate(l: Listing): string {
    const bedrooms = Math.max(1, l.bedroomsCount ?? 1);
    return `${bedrooms * 28 + 20} m²`;
  }

  computeNights(): void {
    const ci = this.checkIn();
    const co = this.checkOut();
    if (!ci || !co) return;
    const d1 = new Date(ci).getTime();
    const d2 = new Date(co).getTime();
    const diff = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    this.nights.set(diff);
  }

  onShare(): void {
    this.toastSvc.show('Lien copié dans le presse-papier');
  }

  onReserve(): void {
    this.toastSvc.show(`Réservation de ${this.nights()} nuits enregistrée avec succès !`);
  }

  onContactHost(): void {
    this.toastSvc.show('Demande d\'information transmise à l\'hôte. Réponse sous 30 min.');
  }

  openListingDetail(id: string | number): void {
    this.router.navigate(['/listing', String(id)]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  decGuests(): void {
    this.guests.set(Math.max(1, this.guests() - 1));
  }

  incGuests(): void {
    const cap = (this.listing()?.guestsCount ?? 99) || 99;
    this.guests.set(Math.min(cap, this.guests() + 1));
  }

  formatPrice(n: number): string {
    if (!n && n !== 0) return '0';
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private fallbackListing(id: string | number): Listing {
    return {
      id: String(id),
      title: 'Villa Kigobe vue lac',
      location: 'Kigobe',
      province: 'Bujumbura',
      category: 'Villa',
      pricePerNightFbu: 180000,
      rating: 4.9,
      reviewCount: 62,
      description:
        "Villa spacieuse perchée sur les hauteurs de Kigobe, avec vue dégagée sur le lac Tanganyika. Parfaite pour les familles ou les séjours professionnels prolongés — l'électricité et l'eau sont garanties toute l'année grâce au groupe électrogène et à la citerne de secours.",
      photos: [],
      amenities: ['📶 WiFi fibre', '🅿️ Parking privé', '🧺 Blanchisserie', '🔒 Gardien 24h', 'GROUPE ELECTROGENE', 'CITERNE 5000L', 'CUISINE EQUIPEE'],
      hostName: 'Diane Ndayishimiye',
      isVerifiedHost: true,
      datesAvailable: '',
      guestsCount: 8,
      bedroomsCount: 4,
      bathroomsCount: 2,
      isFavorite: false,
    };
  }
}
