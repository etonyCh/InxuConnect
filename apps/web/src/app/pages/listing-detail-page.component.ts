import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Listing } from '../models/listing.model';
import { ListingService } from '../services/listing.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <header class="top-bar">
      <a class="top-bar__back" routerLink="/">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        InzuConnect
      </a>
      <div class="top-bar__actions">
        <button class="icon-btn" (click)="onShare()" aria-label="Partager">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <circle cx="18" cy="5" r="2.6"/>
            <circle cx="6" cy="12" r="2.6"/>
            <circle cx="18" cy="19" r="2.6"/>
            <line x1="8.3" y1="10.8" x2="15.7" y2="6.2"/>
            <line x1="8.3" y1="13.2" x2="15.7" y2="17.8"/>
          </svg>
        </button>
        <button
          class="icon-btn"
          (click)="toggleFav()"
          aria-label="Ajouter aux favoris"
          [class.icon-btn--ghost]="isFav()"
        >
          @if (isFav()) {
            <svg viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1.7">
              <path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/>
            </svg>
          }
        </button>
      </div>
    </header>

    <main class="listing-wrap">
      @if (listing(); as l) {
        <div class="listing-title-row">
          <div>
            <h1>{{ l.title }}</h1>
            <p class="listing-sub">
              ★ {{ l.rating }} · {{ l.reviewCount }} avis · {{ l.location }}, {{ l.province }}
            </p>
          </div>
          <div class="listing-badges-row">
            @if (hasAmenity(l, 'GROUPE ELECTROGENE')) {
              <span class="infra-badge"><span class="pulse"></span>🔌 ÉLECTRICITÉ</span>
            }
            @if (hasAmenity(l, 'CITERNE 5000L')) {
              <span class="infra-badge"><span class="pulse"></span>💧 EAU</span>
            }
            @if (hasAmenity(l, 'STARLINK')) {
              <span class="infra-badge"><span class="pulse"></span>🛰️ INTERNET</span>
            }
          </div>
        </div>

        <section class="gallery">
          <button class="gallery__main" type="button">
            <img [src]="photoAt(galleryIdx())" [alt]="l.title + ' — vue principale'">
            <button class="gallery__nav gallery__nav--prev" (click)="prevImg()" aria-label="Photo précédente">‹</button>
            <button class="gallery__nav gallery__nav--next" (click)="nextImg()" aria-label="Photo suivante">›</button>
            <span class="gallery__count mono">
              {{ galleryIdx() + 1 }} / {{ photoCount() }}
            </span>
          </button>
          <div class="gallery__thumbs">
            @for (p of photos(); track $index; let i = $index) {
              <button
                type="button"
                (click)="galleryIdx.set(i)"
                [class.is-active]="galleryIdx() === i"
              >
                <img [src]="p" [alt]="'Photo ' + (i + 1)">
              </button>
            }
          </div>
        </section>

        <div class="listing-grid">
          <div class="listing-main">
            <section class="host-row">
              <div>
                <h3>Logement entier hébergé par {{ l.hostName }}</h3>
                <p class="listing-sub">
                  {{ l.bedroomsCount }} chambres · {{ l.bathroomsCount }} salles de bain · {{ l.guestsCount }} voyageurs max
                </p>
              </div>
              <span class="host-avatar">{{ hostInitials(l.hostName) }}</span>
            </section>

            <hr class="rule">

            <section>
              <h3>Résilience & fiabilité — Burundi</h3>
              <p class="section-lede">Ce logement a été vérifié par InzuConnect pour continuer à fonctionner même en cas de coupure.</p>
              <div class="infra-grid">
                <div class="infra-card" [class.is-dim]="!hasAmenity(l, 'GROUPE ELECTROGENE')">
                  <span class="pulse" [class.is-dim]="!hasAmenity(l, 'GROUPE ELECTROGENE')"></span>
                  <span class="infra-card__icon">🔌</span>
                  <div>
                    <strong>Groupe électrogène</strong>
                    <p>{{ hasAmenity(l, 'GROUPE ELECTROGENE') ? 'Bascule automatique en 8 secondes' : 'Non disponible sur ce logement' }}</p>
                  </div>
                </div>
                <div class="infra-card" [class.is-dim]="!hasAmenity(l, 'CITERNE 5000L')">
                  <span class="pulse" [class.is-dim]="!hasAmenity(l, 'CITERNE 5000L')"></span>
                  <span class="infra-card__icon">💧</span>
                  <div>
                    <strong>Citerne d'eau 5000L</strong>
                    <p>{{ hasAmenity(l, 'CITERNE 5000L') ? 'Réserve autonome de 4 jours' : 'Non disponible sur ce logement' }}</p>
                  </div>
                </div>
                <div class="infra-card" [class.is-dim]="!hasAmenity(l, 'STARLINK')">
                  <span class="pulse" [class.is-dim]="!hasAmenity(l, 'STARLINK')"></span>
                  <span class="infra-card__icon">🛰️</span>
                  <div>
                    <strong>Starlink</strong>
                    <p>{{ hasAmenity(l, 'STARLINK') ? 'Internet satellite rapide' : 'Non disponible sur ce logement' }}</p>
                  </div>
                </div>
                <div class="infra-card" [class.is-dim]="!hasAmenity(l, 'CUISINE EQUIPEE')">
                  <span class="pulse" [class.is-dim]="!hasAmenity(l, 'CUISINE EQUIPEE')"></span>
                  <span class="infra-card__icon">🍳</span>
                  <div>
                    <strong>Cuisine équipée</strong>
                    <p>{{ hasAmenity(l, 'CUISINE EQUIPEE') ? 'Réchaud gaz + électrique' : 'Non disponible sur ce logement' }}</p>
                  </div>
                </div>
              </div>
            </section>

            <hr class="rule">

            <section>
              <h3>À propos de ce logement</h3>
              <p class="section-lede">{{ l.description }}</p>
            </section>

            <hr class="rule">

            <section>
              <h3>Équipements</h3>
              <div class="amenity-list">
                <span>🛏️ {{ l.bedroomsCount }} chambres</span>
                <span>🚿 {{ l.bathroomsCount }} salles de bain</span>
                @for (a of l.amenities; track a) {
                  <span>{{ a }}</span>
                }
              </div>
            </section>

            <hr class="rule">

            <section>
              <h3>★ {{ l.rating }} · {{ l.reviewCount }} avis</h3>
              <div class="review-bars">
                <div class="review-bar">
                  <span>Propreté</span>
                  <div><i style="width:96%"></i></div>
                  <b>4.9</b>
                </div>
                <div class="review-bar">
                  <span>Exactitude</span>
                  <div><i style="width:94%"></i></div>
                  <b>4.8</b>
                </div>
                <div class="review-bar">
                  <span>Communication</span>
                  <div><i style="width:98%"></i></div>
                  <b>5.0</b>
                </div>
                <div class="review-bar">
                  <span>Emplacement</span>
                  <div><i style="width:90%"></i></div>
                  <b>4.7</b>
                </div>
              </div>
              <div class="review-list">
                <div class="review-item">
                  <span class="host-avatar host-avatar--sm">JN</span>
                  <div>
                    <strong>Jeanne N.</strong>
                    <p>Séjour impeccable, l'électricité n'a jamais coupé même pendant l'orage. Hôte très réactive.</p>
                  </div>
                </div>
                <div class="review-item">
                  <span class="host-avatar host-avatar--sm">PM</span>
                  <div>
                    <strong>Patrick M.</strong>
                    <p>Vue magnifique sur le lac, quartier calme et sécurisé. Je recommande pour un séjour pro.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside class="booking-card">
            <div class="booking-card__price">
              <b class="mono">{{ formatPrice(l.pricePerNightFbu) }} FBu</b>
              <span>/ nuit</span>
            </div>

            <div class="booking-card__dates">
              <div class="field">
                <label>Arrivée</label>
                <input type="date" [(ngModel)]="checkIn" (change)="computeNights()">
              </div>
              <div class="field">
                <label>Départ</label>
                <input type="date" [(ngModel)]="checkOut" (change)="computeNights()">
              </div>
            </div>
            <div class="field">
              <label>Voyageurs</label>
              <div class="stepper">
                <button type="button" class="stepper__btn" (click)="guests.set(Math.max(1, guests() - 1))">−</button>
                <span class="stepper__val mono">{{ guests() }}</span>
                <button type="button" class="stepper__btn" (click)="guests.set(Math.min(l.guestsCount, guests() + 1))">+</button>
              </div>
            </div>

            <button class="btn btn-primary btn-block" (click)="onReserve()">Réserver maintenant</button>
            <button class="btn btn-ghost btn-block" (click)="onContact()">💬 Contacter l'hôte</button>

            <div class="price-breakdown">
              <div>
                <span class="mono">{{ formatPrice(l.pricePerNightFbu) }} FBu × {{ nights() }} nuits</span>
                <span class="mono">{{ formatPrice(subtotal()) }} FBu</span>
              </div>
              <div>
                <span class="mono">Frais de service</span>
                <span class="mono">{{ formatPrice(fee()) }} FBu</span>
              </div>
              <div class="price-breakdown__total">
                <span>Total</span>
                <span class="mono">{{ formatPrice(total()) }} FBu</span>
              </div>
            </div>
          </aside>
        </div>
      }
    </main>

    <div class="toast" [class.is-show]="toastSvc.state().show">
      <span class="pulse"></span>
      <span>{{ toastSvc.state().text }}</span>
    </div>
  `,
})
export class ListingDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private listingSvc = inject(ListingService);
  toastSvc = inject(ToastService);
  private router = inject(Router);

  listing = signal<Listing | undefined>(undefined);
  galleryIdx = signal(0);
  checkIn = signal('');
  checkOut = signal('');
  guests = signal(2);
  nights = signal(3);
  isFav = signal(false);

  subtotal = computed(() => (this.listing()?.pricePerNightFbu ?? 0) * this.nights());
  fee = computed(() => Math.round(this.subtotal() * 0.05));
  total = computed(() => this.subtotal() + this.fee());

  ngOnInit(): void {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const departure = new Date();
    departure.setDate(nextWeek.getDate() + this.nights());

    this.checkIn.set(this.toIsoDate(nextWeek));
    this.checkOut.set(this.toIsoDate(departure));

    this.route.params.subscribe((params) => {
      const idParam = params['id'];
      const id = Number(idParam) || 1;
      this.listingSvc.getListingById(id).subscribe((l) => {
        if (l) {
          this.listing.set(l);
          this.isFav.set(l.isFavorite ?? false);
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
        pads.push(l.photos[i] ?? `https://picsum.photos/seed/inzu-${l.id}-${i}/600/420`);
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
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  hasAmenity(l: Listing, key: string): boolean {
    const arr = l.amenities ?? [];
    return arr.some((a) => a.toUpperCase().includes(key.toUpperCase().slice(0, 6)));
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

  toggleFav(): void {
    this.isFav.set(!this.isFav());
    this.toastSvc.show(this.isFav() ? 'Ajouté aux favoris' : 'Retiré des favoris');
  }

  onShare(): void {
    this.toastSvc.show('Lien copié dans le presse-papier');
  }

  onReserve(): void {
    this.toastSvc.show(`Réservation de ${this.nights()} nuits confirmée !`);
  }

  onContact(): void {
    this.toastSvc.show('Message envoyé à l\'hôte');
  }

  formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  private fallbackListing(id: number): Listing {
    return {
      id,
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
