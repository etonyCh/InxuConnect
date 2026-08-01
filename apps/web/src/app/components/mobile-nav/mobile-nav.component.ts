import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="mobile-bottom-nav">
      <button 
        *ngFor="let tab of tabs" 
        class="nav-tab-btn" 
        [class.active]="activeTab === tab.id"
        (click)="selectTab(tab.id)"
      >
        <div class="tab-icon">
          <i [class]="activeTab === tab.id ? tab.activeIcon : tab.icon"></i>
        </div>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  `,
  styles: [`
    .mobile-bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(16px);
      border-top: 1px solid #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 900;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
    }

    .nav-tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      background: transparent;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      padding: 0.35rem 0.75rem;
      transition: color 0.2s ease, transform 0.15s ease;
    }

    .nav-tab-btn.active {
      color: #36255C;
    }

    .tab-icon {
      font-size: 1.25rem;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tab-label {
      font-size: 0.68rem;
      font-weight: 700;
    }
  `]
})
export class MobileNavComponent {
  @Output() tabChange = new EventEmitter<string>();
  activeTab = 'explore';

  tabs = [
    { id: 'explore', label: 'Explorer', icon: 'fa-solid fa-magnifying-glass', activeIcon: 'fa-solid fa-magnifying-glass' },
    { id: 'wishlist', label: 'Favoris', icon: 'fa-regular fa-heart', activeIcon: 'fa-solid fa-heart' },
    { id: 'trips', label: 'Voyages', icon: 'fa-solid fa-suitcase', activeIcon: 'fa-solid fa-suitcase' },
    { id: 'messages', label: 'Messages', icon: 'fa-regular fa-comment', activeIcon: 'fa-solid fa-comment' },
    { id: 'profile', label: 'Profil', icon: 'fa-regular fa-user', activeIcon: 'fa-solid fa-user' }
  ];

  selectTab(tabId: string) {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }
}
