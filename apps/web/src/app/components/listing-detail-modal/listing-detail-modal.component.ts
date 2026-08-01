import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listing } from '../../models/listing.model';
import { DateRangePickerComponent } from '../date-range-picker/date-range-picker.component';

@Component({
  selector: 'app-listing-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DateRangePickerComponent],
  template: `
    <div class="modal-backdrop animate-fade-in" *ngIf="listing" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <button class="icon-circle-btn" (click)="closeModal()">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <h2 class="modal-header-title">Fiche & Réservation du Logement</h2>
          <button class="icon-circle-btn" (click)="toggleFavorite()">
            <i [class]="listing.isFavorite ? 'fa-solid fa-heart active-heart' : 'fa-regular fa-heart'"></i>
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="modal-body">
          <!-- Main Hero Image -->
          <div class="hero-image-box">
            <img [src]="listing.photos[0]" [alt]="listing.title" class="hero-img" />
            <div class="rating-pill">
              <i class="fa-solid fa-star"></i>
              <span>{{ listing.rating }} ({{ listing.reviewCount }} avis)</span>
            </div>
          </div>

          <!-- Title & Location -->
          <div class="title-section">
            <h1 class="listing-modal-title">{{ listing.title }}</h1>
            <p class="listing-modal-location">
              <i class="fa-solid fa-location-dot"></i> {{ listing.location }}
            </p>
          </div>

          <!-- Interactive Date Range Picker -->
          <app-date-range-picker (rangeChange)="onDatesSelected($event)"></app-date-range-picker>

          <!-- Detailed Price Breakdown Card -->
          <div class="price-breakdown-card">
            <h3 class="breakdown-title"><i class="fa-solid fa-receipt"></i> Décomposition du Prix (FBU)</h3>
            <div class="breakdown-line">
              <span>{{ formatFbu(listing.pricePerNightFbu) }} FBU × {{ selectedNights }} nuit{{ selectedNights > 1 ? 's' : '' }}</span>
              <span>{{ formatFbu(baseSubtotal) }} FBU</span>
            </div>
            <div class="breakdown-line">
              <span>Frais de ménage & accueil</span>
              <span>{{ formatFbu(cleaningFee) }} FBU</span>
            </div>
            <div class="breakdown-line">
              <span>Frais de service InzuConnect (5%)</span>
              <span>{{ formatFbu(serviceFee) }} FBU</span>
            </div>
            <div class="breakdown-line micro-savings-option">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="includeMicroSavings" />
                <span>Option Épargne Communautaire (Micro-Savings)</span>
              </label>
              <span *ngIf="includeMicroSavings">+{{ formatFbu(microSavingsAmount) }} FBU</span>
            </div>
            <div class="breakdown-divider"></div>
            <div class="breakdown-line total-line">
              <span>Total Général à Régler</span>
              <span class="total-price-tag">{{ formatFbu(totalPriceFbu) }} FBU</span>
            </div>
          </div>

          <!-- Amenities Grid -->
          <div class="amenities-section">
            <h3 class="section-title">Équipements & Commodités</h3>
            <div class="amenities-grid">
              <div class="amenity-item" *ngFor="let am of listing.amenities">
                <div class="amenity-icon-box">
                  <i class="fa-solid fa-check"></i>
                </div>
                <span>{{ am }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="description-section">
            <h3 class="section-title">Description</h3>
            <p class="description-text">{{ listing.description }}</p>
          </div>

          <!-- Host Info Card -->
          <div class="host-card">
            <img [src]="listing.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'" class="host-avatar" />
            <div class="host-info">
              <div class="host-name-row">
                <span class="host-name">{{ listing.hostName }}</span>
                <span class="verified-tag" *ngIf="listing.isVerifiedHost">
                  <i class="fa-solid fa-circle-check"></i> Hôte Vérifié
                </span>
              </div>
              <span class="host-subtitle">Hôte au Burundi</span>
            </div>
          </div>
        </div>

        <!-- Sticky Footer CTA -->
        <div class="modal-footer">
          <div class="footer-price-col">
            <span class="footer-price">{{ formatFbu(totalPriceFbu) }} FBU</span>
            <span class="footer-unit">total pour {{ selectedNights }} nuit{{ selectedNights > 1 ? 's' : '' }}</span>
          </div>

          <button class="book-trip-btn" (click)="onBookTrip()">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Réserver via Mobile Money (Escrow)</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 10, 28, 0.65);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #F3F4F6;
    }

    .modal-header-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #36255C;
    }

    .icon-circle-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #F7F4FD;
      border: 1px solid #D2C3F6;
      color: #36255C;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
    }

    .active-heart { color: #FF385C; }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .hero-image-box {
      position: relative;
      width: 100%;
      height: 250px;
      border-radius: 20px;
      overflow: hidden;
    }

    .hero-img { width: 100%; height: 100%; object-fit: cover; }

    .rating-pill {
      position: absolute;
      bottom: 14px;
      right: 14px;
      background: rgba(255, 255, 255, 0.95);
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 0.82rem;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .rating-pill i { color: #FFB800; }

    .listing-modal-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 800;
      color: #23173F;
    }

    .listing-modal-location {
      color: #6B7280;
      font-size: 0.88rem;
      font-weight: 600;
    }

    .price-breakdown-card {
      background: #F7F4FD;
      border: 1px solid #D2C3F6;
      border-radius: 18px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .breakdown-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #36255C;
      margin-bottom: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .breakdown-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #374151;
      font-weight: 600;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      cursor: pointer;
    }

    .breakdown-divider {
      height: 1px;
      background: #D2C3F6;
      margin: 0.25rem 0;
    }

    .total-line {
      font-size: 1rem;
      font-weight: 800;
      color: #23173F;
    }

    .total-price-tag {
      color: #36255C;
      font-size: 1.15rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 800;
      color: #23173F;
    }

    .amenities-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.6rem;
    }

    .amenity-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }

    .amenity-icon-box {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #D2C3F6;
      color: #36255C;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
    }

    .description-text { color: #4B5563; font-size: 0.9rem; line-height: 1.5; }

    .host-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      background: #F9FAFB;
      padding: 0.85rem;
      border-radius: 16px;
    }

    .host-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
    .host-name { font-weight: 800; color: #111827; font-size: 0.9rem; }

    .verified-tag {
      background: #36255C;
      color: #FFFFFF;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
    }

    .modal-footer {
      padding: 1.15rem 1.5rem;
      border-top: 1px solid #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #FFFFFF;
    }

    .footer-price { font-size: 1.15rem; font-weight: 800; color: #36255C; display: block; }
    .footer-unit { font-size: 0.75rem; color: #6B7280; }

    .book-trip-btn {
      background: linear-gradient(135deg, #36255C 0%, #5E3A9B 100%);
      color: #FFFFFF;
      border: none;
      padding: 0.8rem 1.75rem;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 8px 24px rgba(54, 37, 92, 0.3);
    }
  `]
})
export class ListingDetailModalComponent {
  @Input() listing: Listing | null = null;
  @Output() close = new EventEmitter<void>();

  selectedNights = 3;
  cleaningFee = 15000;
  includeMicroSavings = true;
  microSavingsAmount = 5000;

  get baseSubtotal(): number {
    return (this.listing?.pricePerNightFbu || 0) * this.selectedNights;
  }

  get serviceFee(): number {
    return Math.round(this.baseSubtotal * 0.05);
  }

  get totalPriceFbu(): number {
    let total = this.baseSubtotal + this.cleaningFee + this.serviceFee;
    if (this.includeMicroSavings) total += this.microSavingsAmount;
    return total;
  }

  formatFbu(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }

  onDatesSelected(event: { checkIn: string; checkOut: string; nights: number }) {
    this.selectedNights = event.nights;
  }

  closeModal() {
    this.close.emit();
  }

  toggleFavorite() {
    if (this.listing) {
      this.listing.isFavorite = !this.listing.isFavorite;
    }
  }

  onBookTrip() {
    alert(`Votre réservation de ${this.selectedNights} nuits pour "${this.listing?.title}" (${this.formatFbu(this.totalPriceFbu)} FBU) a été placée en séquestre Mobile Money (Lumicash/EcoCash) !`);
    this.closeModal();
  }
}
