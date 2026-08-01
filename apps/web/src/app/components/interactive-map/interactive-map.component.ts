import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Listing } from '../../models/listing.model';

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container-card glass-card animate-fade-in">
      <div class="map-toolbar">
        <div class="map-title-row">
          <i class="fa-solid fa-map-location-dot"></i>
          <h3>Carte Interactive du Burundi (OpenStreetMap)</h3>
        </div>
        <button class="search-area-btn" (click)="onSearchArea()">
          <i class="fa-solid fa-rotate-right"></i> Rechercher dans cette zone
        </button>
      </div>

      <div class="map-canvas">
        <div 
          *ngFor="let item of listings; let i = index" 
          class="map-price-marker" 
          [style.top]="getMarkerTop(i)" 
          [style.left]="getMarkerLeft(i)"
          (click)="selectListing.emit(item)"
        >
          <span>{{ formatFbu(item.pricePerNightFbu) }} FBU</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .map-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .map-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 800;
      color: #36255C;
      font-size: 1.1rem;
    }

    .search-area-btn {
      background: #FFFFFF;
      color: #36255C;
      border: 1px solid #D2C3F6;
      padding: 0.45rem 0.85rem;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: 0 2px 6px rgba(54, 37, 92, 0.06);
    }

    .map-canvas {
      width: 100%;
      height: 500px;
      background: #E8E0FA url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1400&q=80') center/cover;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      border: 2px solid #D2C3F6;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
    }

    .map-price-marker {
      position: absolute;
      background: #36255C;
      color: #FFFFFF;
      padding: 0.5rem 0.95rem;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 0.82rem;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      border: 2px solid #FFFFFF;
      transition: transform 0.2s ease, background-color 0.2s ease;
      white-space: nowrap;
    }

    .map-price-marker:hover {
      transform: scale(1.15);
      background: #6E44BA;
      z-index: 10;
    }
  `]
})
export class InteractiveMapComponent {
  @Input() listings: Listing[] = [];
  @Output() selectListing = new EventEmitter<Listing>();
  @Output() searchArea = new EventEmitter<void>();

  getMarkerTop(index: number): string {
    const tops = ['32%', '55%', '28%', '48%', '68%', '40%'];
    return tops[index % tops.length];
  }

  getMarkerLeft(index: number): string {
    const lefts = ['42%', '58%', '72%', '46%', '62%', '30%'];
    return lefts[index % lefts.length];
  }

  formatFbu(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }

  onSearchArea() {
    this.searchArea.emit();
  }
}
