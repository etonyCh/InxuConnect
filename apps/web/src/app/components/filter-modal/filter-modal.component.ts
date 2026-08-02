import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterCriteria {
  maxPriceFbu: number;
  bedrooms: number;
  bathrooms: number;
  instantBookOnly: boolean;
  selectedAmenities: string[];
}

@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <button class="icon-btn" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <h2>Filtres Avancés (Burundi)</h2>
          <button class="text-btn" (click)="resetFilters()">Effacer tout</button>
        </div>
        <div class="modal-body">
          <div class="filter-section">
            <h3>Tranche de prix (FBU / nuit)</h3>
            <div class="price-slider-box">
              <span class="price-label">Prix max : <strong>{{ formatFbu(maxPriceFbu) }} FBU</strong></span>
              <input type="range" min="50000" max="500000" step="10000" [(ngModel)]="maxPriceFbu" class="slider" />
              <div class="slider-ticks">
                <span>50 000 FBU</span>
                <span>500 000 FBU</span>
              </div>
            </div>
          </div>
          <div class="filter-section">
            <h3>Chambres & Salles de bain</h3>
            <div class="counter-row">
              <span>Chambres minimales</span>
              <div class="counter-controls">
                <button (click)="bedrooms = Math.max(1, bedrooms - 1)">-</button>
                <span>{{ bedrooms }}+</span>
                <button (click)="bedrooms = bedrooms + 1">+</button>
              </div>
            </div>
            <div class="counter-row">
              <span>Salles de bain minimales</span>
              <div class="counter-controls">
                <button (click)="bathrooms = Math.max(1, bathrooms - 1)">-</button>
                <span>{{ bathrooms }}+</span>
                <button (click)="bathrooms = bathrooms + 1">+</button>
              </div>
            </div>
          </div>
          <div class="filter-section">
            <h3>Équipements & Commodités</h3>
            <div class="amenities-grid">
              <label *ngFor="let am of availableAmenities" class="checkbox-box">
                <input type="checkbox" [checked]="isAmenitySelected(am)" (change)="toggleAmenity(am)" />
                <span>{{ am }}</span>
              </label>
            </div>
          </div>
          <div class="filter-section">
            <div class="toggle-row">
              <div class="toggle-text">
                <strong>Réservation Instantanée</strong>
                <p>Annonces réservables sans attendre l'accord manuel de l'hôte</p>
              </div>
              <input type="checkbox" [(ngModel)]="instantBookOnly" class="toggle-input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="apply-btn" (click)="applyFilters()">
            <i class="fa-solid fa-check"></i> Appliquer les filtres
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(15, 10, 28, 0.65);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
    }
    .modal-card {
      background: #FFFFFF; width: 100%; max-width: 580px; max-height: 90vh;
      border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6;
    }
    .modal-header h2 { font-size: 1.1rem; font-weight: 800; color: #36255C; }
    .icon-btn, .text-btn { background: transparent; border: none; cursor: pointer; font-weight: 700; }
    .icon-btn { font-size: 1.1rem; }
    .text-btn { color: #6B7280; font-size: 0.85rem; }
    .text-btn:hover { color: #36255C; }
    .modal-body { padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }
    .filter-section h3 { font-size: 0.95rem; font-weight: 800; color: #23173F; margin-bottom: 0.75rem; }
    .price-slider-box { background: #F7F4FD; border: 1px solid #D2C3F6; padding: 1rem; border-radius: 14px; }
    .price-label { font-size: 0.9rem; color: #36255C; display: block; margin-bottom: 0.5rem; }
    .slider { width: 100%; accent-color: #36255C; }
    .slider-ticks { display: flex; justify-content: space-between; font-size: 0.75rem; color: #6B7280; font-weight: 600; flex-wrap: wrap; gap: 0.5rem; }
    .counter-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; font-weight: 600; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem; }
    .counter-controls { display: flex; align-items: center; gap: 0.75rem; }
    .counter-controls button { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #D2C3F6; background: #FFFFFF; font-weight: 800; cursor: pointer; }
    .amenities-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
    .checkbox-box { display: flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; font-weight: 600; color: #374151; cursor: pointer; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; background: #F9FAFB; padding: 0.85rem; border-radius: 14px; gap: 1rem; }
    .toggle-text p { font-size: 0.78rem; color: #6B7280; margin: 0; }
    .toggle-input { width: 20px; height: 20px; accent-color: #36255C; cursor: pointer; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #F3F4F6; }
    .apply-btn { width: 100%; background: #36255C; color: #FFFFFF; border: none; padding: 0.85rem; border-radius: 9999px; font-weight: 800; cursor: pointer; font-size: 0.95rem; }
    @media (max-width: 767px) {
      .modal-backdrop {
        padding: 0;
      }
      .modal-card {
        width: 100vw !important;
        max-width: 100vw;
        height: 100vh;
        height: 100dvh;
        top: 0 !important;
        left: 0 !important;
        border-radius: 0 !important;
        padding: 1rem;
        overflow-y: auto;
        max-height: none;
      }
      .icon-btn {
        min-height: 44px;
        min-width: 44px;
      }
      .text-btn {
        min-height: 44px;
        padding: 0 0.75rem;
      }
      .modal-body {
        padding: 1rem;
      }
      .modal-footer {
        padding: 1rem;
      }
      .apply-btn {
        min-height: 44px;
      }
      .slider {
        width: 100%;
      }
      .amenities-grid {
        grid-template-columns: 1fr;
      }
      .counter-controls button {
        min-height: 44px;
        min-width: 44px;
      }
      .toggle-input {
        min-height: 44px;
        min-width: 44px;
      }
    }
    @media (min-width: 768px) {
      .modal-card {
        max-width: 90vw;
        max-height: 90vh;
      }
    }
  `]
})
export class FilterModalComponent {
  @Output() apply = new EventEmitter<FilterCriteria>();
  @Output() close = new EventEmitter<void>();
  Math = Math;
  maxPriceFbu = 300000;
  bedrooms = 1;
  bathrooms = 1;
  instantBookOnly = false;
  selectedAmenities: string[] = ['Wifi'];
  availableAmenities = ['Piscine', 'Wifi haut débit', 'Groupe Électrogène', 'Énergie Solaire', 'Climatisation', 'Vue Lac', 'Petit-déjeuner inclus'];
  formatFbu(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }
  isAmenitySelected(am: string): boolean {
    return this.selectedAmenities.includes(am);
  }
  toggleAmenity(am: string) {
    if (this.isAmenitySelected(am)) {
      this.selectedAmenities = this.selectedAmenities.filter(a => a !== am);
    } else {
      this.selectedAmenities.push(am);
    }
  }
  resetFilters() {
    this.maxPriceFbu = 500000;
    this.bedrooms = 1;
    this.bathrooms = 1;
    this.instantBookOnly = false;
    this.selectedAmenities = [];
  }
  applyFilters() {
    this.apply.emit({
      maxPriceFbu: this.maxPriceFbu,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      instantBookOnly: this.instantBookOnly,
      selectedAmenities: this.selectedAmenities
    });
    this.closeModal();
  }
  closeModal() {
    this.close.emit();
  }
}
