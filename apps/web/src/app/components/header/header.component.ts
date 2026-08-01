import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="site-header">
      <div class="header-inner">
        <!-- Brand Logo -->
        <div class="brand-logo" (click)="onResetFilters()">
          <div class="logo-icon">
            <i class="fa-solid fa-house-circle-check"></i>
          </div>
          <div class="logo-text">
            <span class="brand-name">Inzu<span class="highlight">Connect</span></span>
            <span class="brand-sub">Burundi Hospitality</span>
          </div>
        </div>

        <!-- Pill Search Bar (Airbnb Style) -->
        <div class="search-pill-container">
          <div class="search-segment">
            <span class="segment-label">Où ?</span>
            <input 
              type="text" 
              placeholder="Rechercher Bujumbura, Gitega..." 
              [(ngModel)]="searchLocation" 
              (keyup.enter)="triggerSearch()"
              class="segment-input"
            />
          </div>
          <div class="divider"></div>
          <div class="search-segment">
            <span class="segment-label">Quand ?</span>
            <span class="segment-value">Ajouter des dates</span>
          </div>
          <div class="divider"></div>
          <div class="search-segment">
            <span class="segment-label">Qui ?</span>
            <span class="segment-value">Voyageurs</span>
          </div>
          <button class="search-btn" (click)="triggerSearch()" title="Lancer la recherche">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>

        <!-- Right Menu Actions -->
        <div class="header-actions">
          <button class="icon-nav-btn" (click)="openChat.emit()" title="Messagerie Hôte">
            <i class="fa-regular fa-comment"></i>
          </button>

          <button class="icon-nav-btn" (click)="openWishlist.emit()" title="Mes Favoris">
            <i class="fa-regular fa-heart"></i>
          </button>

          <button class="mode-toggle-btn" [class.active-simulator]="isMobileSimulatorMode" (click)="toggleMobileSimulator()" title="Basculeur Vue Mobile / Web">
            <i [class]="isMobileSimulatorMode ? 'fa-solid fa-mobile-screen' : 'fa-solid fa-desktop'"></i>
            <span>{{ isMobileSimulatorMode ? 'Vue Mobile' : 'Vue Web' }}</span>
          </button>

          <button class="host-link-btn" (click)="openHostWizard.emit()">
            <i class="fa-solid fa-plus"></i>
            <span>Créer Annonce</span>
          </button>

          <button class="host-link-btn" (click)="openDashboard.emit()">
            <i class="fa-solid fa-chart-pie"></i>
            <span>Revenus Hôte</span>
          </button>

          <div class="user-menu-pill" (click)="openKyc.emit()" title="Vérification KYC & Badge">
            <i class="fa-solid fa-bars menu-bars"></i>
            <div class="user-avatar-circle">
              <i class="fa-solid fa-user-shield"></i>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .site-header { position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(210, 195, 248, 0.4); padding: 0.85rem 2rem; box-shadow: 0 2px 10px rgba(54, 37, 92, 0.05); }
    .header-inner { max-width: 1440px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .brand-logo { display: flex; align-items: center; gap: 0.65rem; cursor: pointer; }
    .logo-icon { width: 42px; height: 42px; background: linear-gradient(135deg, #36255C 0%, #6E44BA 100%); color: #FFFFFF; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; }
    .brand-name { font-family: 'Outfit', sans-serif; font-size: 1.35rem; font-weight: 800; color: #36255C; }
    .brand-name .highlight { color: #7B4FB6; }
    .brand-sub { display: block; font-size: 0.68rem; color: #6B7280; font-weight: 600; text-transform: uppercase; }
    .search-pill-container { display: flex; align-items: center; background: #FFFFFF; border: 1px solid rgba(210, 195, 248, 0.6); border-radius: 9999px; padding: 0.35rem 0.5rem 0.35rem 1.25rem; box-shadow: 0 4px 14px rgba(54, 37, 92, 0.08); max-width: 500px; width: 100%; }
    .search-segment { flex: 1; display: flex; flex-direction: column; padding: 0.15rem 0.5rem; }
    .segment-label { font-size: 0.7rem; font-weight: 800; color: #23173F; text-transform: uppercase; }
    .segment-input { border: none; outline: none; font-size: 0.85rem; color: #111827; background: transparent; width: 100%; }
    .segment-value { font-size: 0.82rem; color: #9CA3AF; }
    .divider { width: 1px; height: 24px; background: #E5E7EB; }
    .search-btn { width: 42px; height: 42px; border-radius: 50%; background: #36255C; color: #FFFFFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }
    .icon-nav-btn { width: 38px; height: 38px; border-radius: 50%; background: #F7F4FD; border: 1px solid #D2C3F6; color: #36255C; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer; }
    .mode-toggle-btn { display: flex; align-items: center; gap: 0.4rem; background: #F7F4FD; color: #36255C; border: 1.5px solid #D2C3F6; padding: 0.5rem 0.85rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
    .mode-toggle-btn.active-simulator { background: #36255C; color: #FFFFFF; }
    .host-link-btn { background: transparent; border: 1px solid #D2C3F6; font-size: 0.8rem; font-weight: 700; color: #36255C; padding: 0.45rem 0.8rem; border-radius: 9999px; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; }
    .user-menu-pill { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #E5E7EB; padding: 0.3rem 0.3rem 0.3rem 0.75rem; border-radius: 9999px; cursor: pointer; background: #FFFFFF; }
    .user-avatar-circle { width: 32px; height: 32px; border-radius: 50%; background: #36255C; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
  `]
})
export class HeaderComponent {
  @Output() searchEvent = new EventEmitter<string>();
  @Output() toggleSimulatorEvent = new EventEmitter<boolean>();
  @Output() resetEvent = new EventEmitter<void>();
  @Output() openHostWizard = new EventEmitter<void>();
  @Output() openDashboard = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<void>();
  @Output() openWishlist = new EventEmitter<void>();
  @Output() openKyc = new EventEmitter<void>();

  searchLocation = '';
  isMobileSimulatorMode = false;

  triggerSearch() { this.searchEvent.emit(this.searchLocation); }
  toggleMobileSimulator() {
    this.isMobileSimulatorMode = !this.isMobileSimulatorMode;
    this.toggleSimulatorEvent.emit(this.isMobileSimulatorMode);
  }
  onResetFilters() { this.searchLocation = ''; this.resetEvent.emit(); }
}
