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
    <div style="position:absolute;bottom:.75rem;left:.75rem;display:flex;gap:.35rem;align-items:center;">
      @if(hasInfra()){<span class="infra-badge"><span class="pulse"></span>{{infraLabel()}}</span>}
    </div>
  </div>
  <div style="padding:.85rem .25rem 0;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">
      <h3 style="font-size:.98rem;line-height:1.25;">{{listing.title}}</h3>
      <span style="font-family:var(--f-mono);font-weight:600;white-space:nowrap;">★ {{listing.rating.toFixed(1)}}</span>
    </div>
    <p style="color:var(--ink-on-light-65);font-size:.85rem;margin-top:.25rem;">{{listing.location}} · {{listing.bedroomsCount}} ch. · {{listing.guestsCount}} voyageurs</p>
    <p style="font-weight:700;margin-top:.45rem;"><span class="mono">{{formatPrice(listing.pricePerNightFbu)}}</span> <span style="color:var(--ink-on-light-65);font-weight:500;font-size:.85rem;">/ nuit</span></p>
  </div>
</div>
  `,
})
export class ListingCardComponent {
  @Input() listing!: Listing;
  @Output() clicked = new EventEmitter<string>();

  clickEmit(): void {
    this.clicked.emit(this.listing.id);
  }

  hasInfra(): boolean {
    if (!this.listing.amenities) return false;
    const s = this.listing.amenities.join('|').toLowerCase();
    return s.includes('groupe') || s.includes('citerne') || s.includes('starlink');
  }

  infraLabel(): string {
    return 'SIGNAL LIVE';
  }

  formatPrice(value: number): string {
    const formatted = Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} FBu`;
  }
}
