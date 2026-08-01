import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Listing } from '../../models/listing.model';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="listing-card animate-fade-in" (click)="onCardClick()">
      <!-- Image Carousel Container -->
      <div class="card-image-wrapper">
        <img 
          [src]="listing.photos[currentPhotoIndex] || listing.photos[0]" 
          [alt]="listing.title"
          class="card-img"
        />

        <!-- Favorite Heart Toggle -->
        <button 
          class="favorite-btn" 
          [class.is-favorite]="listing.isFavorite"
          (click)="toggleFavorite($event)"
          title="Ajouter aux favoris"
        >
          <i [class]="listing.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
        </button>

        <!-- Category Badge -->
        <div class="category-badge">
          <span>{{ listing.category }}</span>
        </div>

        <!-- Verified Host Badge -->
        <div class="verified-badge" *ngIf="listing.isVerifiedHost">
          <i class="fa-solid fa-shield-halved"></i>
          <span>VÉRIFIÉ</span>
        </div>

        <!-- Image Carousel Nav Controls -->
        <button 
          class="carousel-arrow prev" 
          *ngIf="listing.photos.length > 1 && currentPhotoIndex > 0"
          (click)="prevPhoto($event)"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button 
          class="carousel-arrow next" 
          *ngIf="listing.photos.length > 1 && currentPhotoIndex < listing.photos.length - 1"
          (click)="nextPhoto($event)"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>

        <!-- Carousel Dots -->
        <div class="carousel-dots" *ngIf="listing.photos.length > 1">
          <span 
            *ngFor="let photo of listing.photos; let idx = index" 
            class="dot"
            [class.active]="idx === currentPhotoIndex"
          ></span>
        </div>
      </div>

      <!-- Card Details Section -->
      <div class="card-content">
        <div class="card-header-row">
          <h3 class="card-location">{{ listing.location }}</h3>
          <div class="card-rating">
            <i class="fa-solid fa-star star-icon"></i>
            <span class="rating-value">{{ listing.rating }}</span>
            <span class="review-count">({{ listing.reviewCount }})</span>
          </div>
        </div>

        <p class="card-title">{{ listing.title }}</p>
        <p class="card-dates">{{ listing.datesAvailable }}</p>

        <div class="card-price-row">
          <span class="price-amount">{{ formatFbuPrice(listing.pricePerNightFbu) }}</span>
          <span class="price-unit">FBU / nuit</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .listing-card {
      display: flex;
      flex-direction: column;
      border-radius: 18px;
      overflow: hidden;
      background: #FFFFFF;
      cursor: pointer;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      position: relative;
    }

    .listing-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 28px rgba(54, 37, 92, 0.12);
    }

    .card-image-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      border-radius: 18px;
      background-color: #F3F4F6;
    }

    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .listing-card:hover .card-img {
      transform: scale(1.03);
    }

    .favorite-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      border: none;
      color: #374151;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      cursor: pointer;
      z-index: 5;
      transition: transform 0.2s ease, color 0.2s ease, background-color 0.2s ease;
    }

    .favorite-btn:hover {
      transform: scale(1.1);
      background: #FFFFFF;
      color: #FF385C;
    }

    .favorite-btn.is-favorite {
      color: #FF385C;
      background: #FFFFFF;
    }

    .category-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(54, 37, 92, 0.85);
      color: #D2C3F6;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      backdrop-filter: blur(4px);
    }

    .verified-badge {
      position: absolute;
      bottom: 12px;
      left: 12px;
      background: rgba(35, 23, 63, 0.9);
      color: #FFFFFF;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.68rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      border: 1px solid rgba(210, 195, 248, 0.4);
    }

    .carousel-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      color: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 4;
    }

    .listing-card:hover .carousel-arrow {
      opacity: 1;
    }

    .carousel-arrow.prev { left: 8px; }
    .carousel-arrow.next { right: 8px; }

    .carousel-dots {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
      z-index: 4;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transition: all 0.2s ease;
    }

    .dot.active {
      background: #FFFFFF;
      width: 14px;
      border-radius: 4px;
    }

    .card-content {
      padding: 0.85rem 0.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .card-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-location {
      font-size: 0.98rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: #111827;
    }

    .star-icon {
      color: #FFB800;
      font-size: 0.8rem;
    }

    .review-count {
      color: #6B7280;
      font-weight: 500;
      font-size: 0.78rem;
    }

    .card-title {
      font-size: 0.85rem;
      color: #4B5563;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-dates {
      font-size: 0.82rem;
      color: #9CA3AF;
      margin: 0;
    }

    .card-price-row {
      margin-top: 0.35rem;
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
    }

    .price-amount {
      font-size: 1.05rem;
      font-weight: 800;
      color: #36255C;
    }

    .price-unit {
      font-size: 0.8rem;
      color: #6B7280;
      font-weight: 600;
    }
  `]
})
export class ListingCardComponent {
  @Input({ required: true }) listing!: Listing;
  @Output() selectListing = new EventEmitter<Listing>();

  currentPhotoIndex = 0;

  formatFbuPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    this.listing.isFavorite = !this.listing.isFavorite;
  }

  prevPhoto(event: Event) {
    event.stopPropagation();
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--;
    }
  }

  nextPhoto(event: Event) {
    event.stopPropagation();
    if (this.currentPhotoIndex < this.listing.photos.length - 1) {
      this.currentPhotoIndex++;
    }
  }

  onCardClick() {
    this.selectListing.emit(this.listing);
  }
}
