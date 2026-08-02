import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { CategoryBarComponent } from './components/category-bar/category-bar.component';
import { ListingCardComponent } from './components/listing-card/listing-card.component';
import { ListingDetailModalComponent } from './components/listing-detail-modal/listing-detail-modal.component';
import { MobileNavComponent } from './components/mobile-nav/mobile-nav.component';
import { MapToggleComponent } from './components/map-toggle/map-toggle.component';
import { FilterModalComponent, FilterCriteria } from './components/filter-modal/filter-modal.component';
import { HostListingWizardComponent } from './components/host-listing-wizard/host-listing-wizard.component';
import { ChatDrawerComponent } from './components/chat-drawer/chat-drawer.component';
import { WishlistModalComponent } from './components/wishlist-modal/wishlist-modal.component';
import { HostDashboardComponent } from './components/host-dashboard/host-dashboard.component';
import { KycUploadModalComponent } from './components/kyc-upload-modal/kyc-upload-modal.component';
import { VoiceAssistantComponent } from './components/voice-assistant/voice-assistant.component';
import { ResilienceBadgeComponent } from './components/resilience-badge/resilience-badge.component';
import { IkigegaImpactWidgetComponent } from './components/ikigega-impact-widget/ikigega-impact-widget.component';
import { VirtualStagingModalComponent } from './components/virtual-staging-modal/virtual-staging-modal.component';
import { AirportTransferModalComponent } from './components/airport-transfer-modal/airport-transfer-modal.component';
import { ListingService } from './services/listing.service';
import { Listing } from './models/listing.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    CategoryBarComponent,
    ListingCardComponent,
    ListingDetailModalComponent,
    MobileNavComponent,
    MapToggleComponent,
    FilterModalComponent,
    HostListingWizardComponent,
    ChatDrawerComponent,
    WishlistModalComponent,
    HostDashboardComponent,
    KycUploadModalComponent,
    VoiceAssistantComponent,
    ResilienceBadgeComponent,
    IkigegaImpactWidgetComponent,
    VirtualStagingModalComponent,
    AirportTransferModalComponent
  ],
  template: `
    <!-- MAIN APPLICATION WRAPPER -->
    <div [class.mobile-simulator-wrapper]="isMobileSimulator">
      
      <!-- MOBILE PHONE CONTAINER FRAME (WHEN IN SIMULATOR MODE) -->
      <div [class.mobile-phone-frame]="isMobileSimulator" class="app-main-layout">
        
        <div class="mobile-notch" *ngIf="isMobileSimulator">
          <div class="mobile-notch-camera"></div>
        </div>

        <!-- HEADER -->
        <app-header 
          (searchEvent)="onSearch($event)"
          (toggleSimulatorEvent)="onToggleSimulator($event)"
          (resetEvent)="onResetAll()"
          (openHostWizard)="showHostWizard = true"
          (openDashboard)="showHostDashboard = true"
          (openChat)="showChatDrawer = true"
          (openWishlist)="showWishlistModal = true"
          (openKyc)="showKycModal = true"
        ></app-header>

        <!-- CATEGORIES BAR -->
        <app-category-bar 
          (categoryChange)="onCategoryChange($event)"
          (openFilterModal)="showFilterModal = true"
        ></app-category-bar>

        <!-- MAIN BODY CONTENT -->
        <main class="main-content">
          
          <!-- CREATIVE FEATURE 1: KIRUNDI/FRENCH VOICE ASSISTANT -->
          <app-voice-assistant (searchVoice)="onSearch($event)"></app-voice-assistant>

          <!-- CREATIVE FEATURE 3: IKIGEGA COMMUNITY IMPACT WIDGET -->
          <app-ikigega-impact-widget></app-ikigega-impact-widget>

          <!-- Action Bar for Creative Features (Virtual Staging & Airport Transfer) -->
          <div class="creative-actions-bar">
            <button class="creative-btn" (click)="showVirtualStaging = true">
              <i class="fa-solid fa-wand-magic-sparkles"></i> AI Staging Déco
            </button>
            <button class="creative-btn" (click)="showAirportTransfer = true">
              <i class="fa-solid fa-taxi"></i> Transfert Aéroport / Moto
            </button>
          </div>

          <!-- Active Filter Banner (if filtering) -->
          <div class="filter-status-banner" *ngIf="activeCategory !== 'Tous' || currentSearchTerm || activeFilterCriteria">
            <span class="status-text">
              Filtres actifs : <strong>{{ activeCategory }}</strong>
              <span *ngIf="currentSearchTerm"> (Recherche: "{{ currentSearchTerm }}")</span>
              <span *ngIf="activeFilterCriteria"> (Prix max: {{ formatPrice(activeFilterCriteria.maxPriceFbu) }} FBU)</span>
            </span>
            <button class="clear-filter-btn" (click)="onResetAll()">Réinitialiser</button>
          </div>

          <!-- LISTING GRID VIEW WITH RESILIENCE BADGES -->
          <div class="listings-grid" *ngIf="!isMapView && listings.length > 0">
            <div *ngFor="let item of listings; trackBy: trackByListingId" class="listing-wrapper">
              <app-listing-card 
                [listing]="item"
                (selectListing)="onSelectListing($event)"
              ></app-listing-card>
              
              <!-- CREATIVE FEATURE 2: RESILIENCE BADGE FOR BURUNDI UTILITIES -->
              <app-resilience-badge 
                [hasSolar]="hasAmenity(item, 'solar')" 
                [hasGenerator]="hasAmenity(item, 'generator')" 
                [hasWaterTank]="hasAmenity(item, 'water_tank')"
              ></app-resilience-badge>
            </div>
          </div>

          <!-- EMPTY STATE -->
          <div class="empty-state" *ngIf="listings.length === 0">
            <i class="fa-solid fa-house-circle-xmark empty-icon"></i>
            <h3>Aucun logement trouvé</h3>
            <p>Essayez de modifier votre recherche ou la catégorie sélectionnée.</p>
            <button class="btn-primary" (click)="onResetAll()">Voir tous les logements</button>
          </div>

          <!-- MAP VIEW INTERACTIVE CONTAINER -->
          <div class="map-view-container glass-card" *ngIf="isMapView">
            <div class="map-header">
              <h3><i class="fa-solid fa-map-location-dot"></i> Carte des Logements au Burundi</h3>
              <p>Explorez les propriétés disponibles à Bujumbura, Gitega, Ngozi et Bururi</p>
            </div>
            <div class="map-mock-canvas" *ngIf="listings.length > 0">
              <div
                *ngFor="let item of listings.slice(0, 20); let i = index; trackBy: trackByListingId"
                class="map-pin"
                [style.top.%]="mapPinPosition(i).top"
                [style.left.%]="mapPinPosition(i).left"
                (click)="onSelectListing(item)">
                <span>{{ formatPrice(item.pricePerNightFbu) }} FBU</span>
              </div>
            </div>
            <div class="map-empty-state" *ngIf="listings.length === 0">
              <p>Aucune propriété à afficher sur la carte.</p>
            </div>
          </div>
        </main>

        <!-- FLOATING MAP/LIST SWITCHER BUTTON -->
        <app-map-toggle 
          [isMapView]="isMapView" 
          (toggle)="isMapView = $event"
        ></app-map-toggle>

        <!-- MOBILE BOTTOM NAVIGATION -->
        <app-mobile-nav (tabChange)="onMobileTabChange($event)"></app-mobile-nav>

        <!-- MODALS & DRAWERS -->
        <app-listing-detail-modal 
          [listing]="selectedListing"
          (close)="selectedListing = null"
        ></app-listing-detail-modal>

        <app-filter-modal 
          *ngIf="showFilterModal" 
          (close)="showFilterModal = false"
          (apply)="onApplyFilters($event)"
        ></app-filter-modal>

        <app-host-listing-wizard 
          *ngIf="showHostWizard" 
          (close)="showHostWizard = false"
          (created)="onListingCreated($event)"
        ></app-host-listing-wizard>

        <app-chat-drawer 
          *ngIf="showChatDrawer" 
          (close)="showChatDrawer = false"
        ></app-chat-drawer>

        <app-wishlist-modal 
          *ngIf="showWishlistModal" 
          (close)="showWishlistModal = false"
        ></app-wishlist-modal>

        <app-host-dashboard 
          *ngIf="showHostDashboard" 
          (close)="showHostDashboard = false"
        ></app-host-dashboard>

        <app-kyc-upload-modal 
          *ngIf="showKycModal" 
          (close)="showKycModal = false"
        ></app-kyc-upload-modal>

        <app-virtual-staging-modal 
          *ngIf="showVirtualStaging" 
          (close)="showVirtualStaging = false"
        ></app-virtual-staging-modal>

        <app-airport-transfer-modal 
          *ngIf="showAirportTransfer" 
          (close)="showAirportTransfer = false"
        ></app-airport-transfer-modal>

      </div>
    </div>
  `,
  styles: [`
    .app-main-layout { width: 100%; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; background: #FFFFFF; }
    .creative-actions-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .creative-actions-bar::-webkit-scrollbar { display: none; }
    .creative-btn { background: #F7F4FD; color: #36255C; border: 1px solid #D2C3F6; padding: 0.6rem 0.9rem; border-radius: 9999px; font-weight: 700; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 2px 8px rgba(54, 37, 92, 0.08); flex: 0 0 auto; white-space: nowrap; min-height: 40px; }
    .creative-btn:hover { background: #36255C; color: #FFFFFF; }
    .filter-status-banner { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: #F7F4FD; border: 1px solid #D2C3F6; padding: 0.65rem 1rem; border-radius: 14px; margin-bottom: 1.25rem; color: #36255C; flex-wrap: wrap; }
    .filter-status-banner .status-text { font-size: 0.82rem; line-height: 1.4; flex: 1 1 220px; min-width: 0; }
    .clear-filter-btn { background: #36255C; color: #FFFFFF; border: none; padding: 0.5rem 0.9rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; cursor: pointer; min-height: 40px; flex: 0 0 auto; }
    .listings-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem 1rem; }
    .listing-wrapper { display: flex; flex-direction: column; gap: 0.5rem; }
    .empty-state { text-align: center; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .empty-icon { font-size: 2.75rem; color: #D2C3F6; }
    .map-view-container { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .map-header h3 { font-size: 1rem; color: #36255C; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .map-header p { font-size: 0.8rem; line-height: 1.4; }
    .map-mock-canvas { width: 100%; height: 320px; background: #E8E0FA url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80') center/cover; border-radius: 16px; position: relative; overflow: hidden; border: 2px solid #D2C3F6; }
    .map-empty-state { width: 100%; height: 320px; display:flex; align-items:center; justify-content:center; color:#36255C; font-weight:700; border-radius:16px; background:#F7F4FD; border:2px dashed #D2C3F6; text-align:center; padding:1rem; }
    .map-pin { position: absolute; background: #36255C; color: #FFFFFF; padding: 0.35rem 0.65rem; border-radius: 9999px; font-weight: 800; font-size: 0.7rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid #FFFFFF; transition: transform 0.2s ease; }
    .map-pin:hover { transform: scale(1.1); background: #6E44BA; z-index: 10; }

    @media (min-width: 600px) {
      .listings-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 1.25rem; }
      .creative-actions-bar { gap: 0.75rem; margin-bottom: 1.25rem; }
      .map-mock-canvas, .map-empty-state { height: 400px; }
      .empty-state { padding: 4rem 2rem; }
      .empty-icon { font-size: 3.5rem; }
    }

    @media (min-width: 900px) {
      .listings-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.75rem 1.5rem; }
      .map-mock-canvas, .map-empty-state { height: 480px; }
      .map-view-container { padding: 1.5rem; gap: 1rem; }
      .filter-status-banner { padding: 0.75rem 1.25rem; margin-bottom: 1.5rem; }
      .creative-btn { font-size: 0.82rem; padding: 0.5rem 1rem; gap: 0.45rem; }
    }

    @media (min-width: 1280px) {
      .listings-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `]
})
export class AppComponent implements OnInit {
  listings: Listing[] = [];
  selectedListing: Listing | null = null;
  activeCategory = 'Tous';
  currentSearchTerm = '';
  isMapView = false;
  isMobileSimulator = false;

  showFilterModal = false;
  showHostWizard = false;
  showChatDrawer = false;
  showWishlistModal = false;
  showHostDashboard = false;
  showKycModal = false;
  showVirtualStaging = false;
  showAirportTransfer = false;

  activeFilterCriteria: FilterCriteria | null = null;

  constructor(private listingService: ListingService) {}

  ngOnInit() {
    this.loadListings();
  }

  loadListings() {
    this.listingService.getListings(this.activeCategory, this.currentSearchTerm).subscribe(data => {
      let filtered = data;
      if (this.activeFilterCriteria) {
        filtered = filtered.filter(item => 
          item.pricePerNightFbu <= this.activeFilterCriteria!.maxPriceFbu &&
          item.bedroomsCount >= this.activeFilterCriteria!.bedrooms
        );
      }
      this.listings = filtered;
    });
  }

  onCategoryChange(category: string) {
    this.activeCategory = category;
    this.loadListings();
  }

  onSearch(term: string) {
    this.currentSearchTerm = term;
    this.loadListings();
  }

  onResetAll() {
    this.activeCategory = 'Tous';
    this.currentSearchTerm = '';
    this.activeFilterCriteria = null;
    this.loadListings();
  }

  onSelectListing(listing: Listing) {
    this.selectedListing = listing;
  }

  onToggleSimulator(enabled: boolean) {
    this.isMobileSimulator = enabled;
  }

  onApplyFilters(criteria: FilterCriteria) {
    this.activeFilterCriteria = criteria;
    this.loadListings();
  }

  onListingCreated(newListing: Partial<Listing>) {
    const defaults: Partial<Listing> = {
      id: Date.now(),
      photos: [],
      amenities: [],
      rating: 0,
      reviewCount: 0,
      hostName: 'Nouvel hôte',
      isVerifiedHost: false,
      guestsCount: 2,
      bedroomsCount: 1,
      bathroomsCount: 1,
      pricePerNightFbu: 50000
    };
    const merged: Listing = {
      ...defaults,
      ...newListing,
      title: newListing.title ?? 'Sans titre',
      description: newListing.description ?? 'Logement au Burundi',
      location: newListing.location ?? newListing.province ?? 'Burundi',
      province: newListing.province ?? 'Bujumbura',
      category: newListing.category ?? 'Tous',
      datesAvailable: newListing.datesAvailable ?? 'Disponible maintenant'
    } as Listing;
    this.listings.unshift(merged);
  }

  onMobileTabChange(tabId: string) {
    if (tabId === 'messages') this.showChatDrawer = true;
    if (tabId === 'wishlist') this.showWishlistModal = true;
    if (tabId === 'profile') this.showKycModal = true;
  }

  formatPrice(val?: number): string {
    return val ? new Intl.NumberFormat('fr-FR').format(val) : '';
  }

  trackByListingId(_index: number, item: Listing): number {
    return item.id;
  }

  hasAmenity(listing: Listing, key: string): boolean {
    if (!listing?.amenities?.length) return false;
    const lower = String(key).toLowerCase();
    return listing.amenities.some(a => {
      const cmp = String(a).toLowerCase();
      if (cmp === lower) return true;
      if (lower === 'solar') return /solaire|solar|panneau/.test(cmp);
      if (lower === 'generator') return /groupe|generator|electrogene|genere/.test(cmp);
      if (lower === 'water_tank' || lower === 'watertank') return /citerne|reservoir|water.?tank|eau/.test(cmp);
      return false;
    });
  }

  mapPinPosition(i: number): { top: number; left: number } {
    // Stable, deterministic, index-based spread across the canvas (0-100%).
    // Avoids fixed-listings[0..3] array-out-of-bounds crash on <4 listings.
    const row = i % 4;
    const col = Math.floor(i / 4) % 4;
    const top = 15 + row * 22 + ((i * 7) % 9);
    const left = 12 + col * 21 + ((i * 11) % 7);
    return { top: Math.max(5, Math.min(85, top)), left: Math.max(5, Math.min(90, left)) };
  }
}
