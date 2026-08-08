import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Listing } from '../models/listing.model';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="listing-card" (click)="clickEmit()">
  <div class="listing-card__media" style="aspect-ratio:4/3;background:linear-gradient(135deg,#0a2b30,#123840);position:relative;border-radius:var(--r-md);overflow:hidden;">
    @if(listing.photos && listing.photos[0]){<img [src]="listing.photos[0]" [alt]="listing.title" style="width:100%;height:100%;object-fit:cover;transition:transform .4s var(--ease);">}
    <button class="icon-btn" style="position:absolute;top:.75rem;right:.75rem;background:rgba(0,22,25,.55);backdrop-filter:blur(8px);color:var(--thin-air);width:38px;height:38px;" (click.stop)="toggleFav()">
      <svg viewBox="0 0 24 24" [attr.fill]="listing.isFavorite?'#50e8f4':'none'" stroke="#50e8f4" stroke-width="1.7"><path d="M20.8 8.6c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10a5 5 0 0 1 9-3 5 5 0 0 1 8.6 3Z"/></svg>
    </button>
    <div style="position:absolute;bottom:.75rem;left:.75rem;display:flex;gap:.35rem;align-items:center;">
      @if(hasInfra()){<span class="infra-badge"><span class="pulse"></span>{{infraLabel()}}</span>}
    </div>
  </div>
  <div style="padding:.85rem .25rem 0;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">
      <h3 style="font-size:.98rem;line-height:1.25;">{{listing.title}}</h3>
      <span style="font-family:var(--f-mono);font-weight:600;white-space:nowrap;">★ {{listing.rating?.toFixed(1) || '4.9'}}</span>
    </div>
    <p style="color:var(--ink-on-light-65);font-size:.85rem;margin-top:.25rem;">{{listing.location}} · {{listing.bedroomsCount}} ch. · {{listing.guestsCount}} voyageurs</p>
    <p style="font-weight:700;margin-top:.45rem;"><span class="mono">{{formatPrice(listing.pricePerNightFbu)}}</span> <span style="color:var(--ink-on-light-65);font-weight:500;font-size:.85rem;">/ nuit</span></p>
  </div>
</div>
  `,
})
export class ListingCardComponent {
  @Input() listing!: Listing;
  @Output() clicked = new EventEmitter<number>();
  @Output() favorited = new EventEmitter<Listing>();

  clickEmit(): void {
    this.clicked.emit(this.listing.id);
  }

  toggleFav(): void {
    this.listing.isFavorite = !this.listing.isFavorite;
    this.favorited.emit(this.listing);
  }

  hasInfra(): boolean {
    if (!this.listing.amenities) return false;
    return this.listing.amenities.some(
      (a) =>
        a.toLowerCase() === 'groupe' ||
        a.toLowerCase() === 'citerne' ||
        a.toLowerCase() === 'starlink',
    );
  }

  infraLabel(): string {
    return 'SIGNAL LIVE';
  }

  formatPrice(value: number): string {
    const formatted = Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FBu`;
  }
}
