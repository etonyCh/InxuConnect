import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-category-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="category-bar-wrapper">
      <div class="categories-scroll-container">
        <button 
          *ngFor="let cat of categories" 
          class="category-item-btn"
          [class.active]="selectedCategory === cat.name"
          (click)="selectCategory(cat.name)"
        >
          <div class="icon-box">
            <i [class]="cat.icon"></i>
          </div>
          <span class="category-name">{{ cat.name }}</span>
        </button>
      </div>

      <div class="filter-controls">
        <button class="filters-btn" (click)="openFilterModal.emit()">
          <i class="fa-solid fa-sliders"></i>
          <span>Filtres</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .category-bar-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.25rem 2rem 0.5rem 2rem;
      max-width: 1440px;
      margin: 0 auto;
      background: #FFFFFF;
    }

    .categories-scroll-container {
      display: flex;
      align-items: center;
      gap: 2.25rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding-bottom: 0.5rem;
      flex: 1;
      flex-wrap: nowrap;
    }

    .categories-scroll-container::-webkit-scrollbar {
      display: none;
    }

    .category-item-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.4rem 0.2rem;
      min-height: 44px;
      color: #6B7280;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      white-space: nowrap;
      flex: 0 0 auto;
    }

    .category-item-btn:hover {
      color: #36255C;
      border-bottom-color: #D2C3F6;
    }

    .category-item-btn.active {
      color: #36255C;
      border-bottom-color: #36255C;
      font-weight: 700;
    }

    .icon-box {
      font-size: 1.4rem;
      height: 28px;
      min-width: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .category-item-btn.active .icon-box {
      color: #36255C;
      transform: translateY(-2px);
    }

    .category-name {
      font-size: 0.78rem;
      font-weight: 600;
    }

    .filter-controls {
      display: flex;
      align-items: center;
    }

    .filters-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      padding: 0.6rem 1rem;
      min-height: 44px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #374151;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .filters-btn:hover {
      border-color: #36255C;
      background: #F7F4FD;
      color: #36255C;
    }

    @media (max-width: 767px) {
      .category-bar-wrapper {
        padding: 0.85rem 1rem 0.35rem 1rem;
        gap: 0.75rem;
      }
      .categories-scroll-container {
        gap: 1.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        flex-wrap: nowrap;
      }
      .category-item-btn {
        flex: 0 0 auto;
        white-space: nowrap;
        gap: 0.35rem;
        padding: 0.35rem 0.15rem;
      }
      .icon-box {
        font-size: 1.2rem;
        height: 26px;
      }
      .category-name {
        font-size: 0.7rem;
      }
      .filters-btn {
        padding: 0.5rem 0.75rem;
        font-size: 0.78rem;
        gap: 0.35rem;
      }
    }

    @media (min-width: 600px) {
      .category-bar-wrapper {
        gap: 1.25rem;
      }
      .categories-scroll-container {
        gap: 1.75rem;
      }
    }

    @media (min-width: 900px) {
      .category-bar-wrapper {
        padding: 1.25rem 2rem 0.5rem 2rem;
        gap: 1.5rem;
      }
      .categories-scroll-container {
        flex-wrap: wrap;
        gap: 2.25rem;
        overflow-x: visible;
      }
      .category-item-btn {
        flex: 0 0 auto;
      }
    }
  `]
})
export class CategoryBarComponent {
  @Output() categoryChange = new EventEmitter<string>();
  @Output() openFilterModal = new EventEmitter<void>();

  selectedCategory = 'Tous';

  categories: CategoryItem[] = [
    { id: 'all', name: 'Tous', icon: 'fa-solid fa-border-all' },
    { id: 'lac', name: 'Vue lac', icon: 'fa-solid fa-water' },
    { id: 'tiny', name: 'Tiny Homes', icon: 'fa-solid fa-house-chimney-window' },
    { id: 'cabanes', name: 'Cabanes', icon: 'fa-solid fa-tree' },
    { id: 'chambres', name: 'Chambres', icon: 'fa-solid fa-bed' },
    { id: 'fermes', name: 'Fermes', icon: 'fa-solid fa-wheat-awn' },
    { id: 'piscines', name: 'Piscines', icon: 'fa-solid fa-person-swimming' },
    { id: 'campagne', name: 'Campagne', icon: 'fa-solid fa-mountain-sun' }
  ];

  selectCategory(categoryName: string) {
    this.selectedCategory = categoryName;
    this.categoryChange.emit(categoryName);
  }
}
