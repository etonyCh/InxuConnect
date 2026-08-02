import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-airport-transfer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <button class="icon-btn" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <h2>Transfert & Chauffeur Certifié (Burundi)</h2>
          <span class="shield-badge"><i class="fa-solid fa-shield"></i> Chauffeurs Vérifiés</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Point de prise en charge</label>
            <select [(ngModel)]="pickupLocation" class="form-input">
              <option value="Aéroport Melchior Ndadaye (Bujumbura)">Aéroport International Melchior Ndadaye (Bujumbura)</option>
              <option value="Gare Routière Gitega">Gare Routière (Gitega)</option>
              <option value="Port de Bujumbura">Port de Bujumbura (Lac Tanganyika)</option>
            </select>
          </div>
          <div class="vehicles-grid">
            <div class="vehicle-card" [class.selected]="selectedVehicle === 'taxi'" (click)="selectedVehicle = 'taxi'">
              <i class="fa-solid fa-car vehicle-icon"></i>
              <strong>Taxi Privé VIP (Climatisé)</strong>
              <span>40 000 FBU</span>
            </div>
            <div class="vehicle-card" [class.selected]="selectedVehicle === 'moto'" (click)="selectedVehicle = 'moto'">
              <i class="fa-solid fa-motorcycle vehicle-icon"></i>
              <strong>Taxi-Moto Certifié (Casque)</strong>
              <span>10 000 FBU</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="book-transfer-btn" (click)="bookTransfer()">
            Réserver le transfert avec mon logement
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 10, 28, 0.65); backdrop-filter: blur(8px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal-card { background: #FFFFFF; width: 100%; max-width: 560px; max-height: 90vh; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3); display: flex; flex-direction: column; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6; gap: 0.5rem; }
    .modal-header h2 { font-size: 1.05rem; font-weight: 800; color: #36255C; }
    .shield-badge { background: #10B981; color: #FFFFFF; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 9999px; }
    .icon-btn { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-y: auto; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.8rem; font-weight: 700; color: #374151; }
    .form-input { padding: 0.65rem 0.85rem; border-radius: 12px; border: 1px solid #D2C3F6; font-size: 0.88rem; outline: none; width: 100%; }
    .vehicles-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .vehicle-card { border: 2px solid #E5E7EB; border-radius: 16px; padding: 1rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; cursor: pointer; transition: all 0.2s ease; }
    .vehicle-card.selected { border-color: #36255C; background: #F7F4FD; }
    .vehicle-icon { font-size: 2rem; color: #36255C; }
    .vehicle-card span { font-size: 0.85rem; font-weight: 800; color: #10B981; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #F3F4F6; }
    .book-transfer-btn { width: 100%; background: #36255C; color: #FFFFFF; border: none; padding: 0.85rem; border-radius: 9999px; font-weight: 800; cursor: pointer; }
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
      .modal-body {
        padding: 1rem;
      }
      .modal-footer {
        padding: 1rem;
      }
      .book-transfer-btn {
        min-height: 44px;
      }
      .vehicles-grid {
        grid-template-columns: 1fr;
      }
      .vehicle-card {
        min-height: 44px;
      }
      .form-input {
        min-height: 44px;
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
export class AirportTransferModalComponent {
  @Output() close = new EventEmitter<void>();
  pickupLocation = 'Aéroport Melchior Ndadaye (Bujumbura)';
  selectedVehicle: 'taxi' | 'moto' = 'taxi';
  closeModal() { this.close.emit(); }
  bookTransfer() {
    alert(`Votre transfert depuis ${this.pickupLocation} en ${this.selectedVehicle === 'taxi' ? 'Taxi VIP (40 000 FBU)' : 'Taxi-Moto (10 000 FBU)'} a été ajouté à votre réservation ! Le chauffeur vous accueillera avec un panneau InzuConnect.`);
    this.closeModal();
  }
}
