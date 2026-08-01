import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-toggle-floating-container">
      <button class="map-toggle-btn" (click)="toggleView()">
        <span>{{ isMapView ? 'Afficher la liste' : 'Afficher la carte' }}</span>
        <i [class]="isMapView ? 'fa-solid fa-list' : 'fa-solid fa-map'"></i>
      </button>
    </div>
  `,
  styles: [`
    .map-toggle-floating-container {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 850;
    }

    .map-toggle-btn {
      background: #23173F;
      color: #FFFFFF;
      border: 1px solid #D2C3F6;
      padding: 0.75rem 1.4rem;
      border-radius: 9999px;
      font-size: 0.88rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      transition: transform 0.2s ease, background-color 0.2s ease;
    }

    .map-toggle-btn:hover {
      transform: scale(1.05);
      background: #36255C;
    }
  `]
})
export class MapToggleComponent {
  @Input() isMapView = false;
  @Output() toggle = new EventEmitter<boolean>();

  toggleView() {
    this.isMapView = !this.isMapView;
    this.toggle.emit(this.isMapView);
  }
}
