import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <button class="icon-btn" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <h2>Tableau de Bord Hôte - Revenus & Réservations (Burundi)</h2>
          <span class="badge-verified"><i class="fa-solid fa-shield-halved"></i> Hôte Vérifié</span>
        </div>
        <div class="modal-body">
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Revenus du mois (FBU)</span>
              <span class="stat-val">1 450 000 FBU</span>
              <span class="stat-change text-green">+18% par rapport au mois dernier</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Taux d'Occupation</span>
              <span class="stat-val">82 %</span>
              <span class="stat-change text-green">24 nuits réservées</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Épargne Accumulée</span>
              <span class="stat-val">75 000 FBU</span>
              <span class="stat-change">Micro-Savings InzuConnect</span>
            </div>
          </div>
          <div class="dashboard-section">
            <h3>Demandes de Réservation Récentes</h3>
            <div class="bookings-list">
              <div *ngFor="let b of bookings" class="booking-row">
                <div class="guest-info">
                  <strong>{{ b.guestName }}</strong>
                  <span>{{ b.listingTitle }}</span>
                </div>
                <div class="booking-dates">
                  <span>{{ b.dates }}</span>
                </div>
                <div class="booking-amount">
                  <strong>{{ formatFbu(b.totalPriceFbu) }} FBU</strong>
                  <span class="status-badge" [class.held]="b.status === 'Séquestre Escrow'">{{ b.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 10, 28, 0.65); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal-card { background: #FFFFFF; width: 100%; max-width: 680px; max-height: 90vh; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3); display: flex; flex-direction: column; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6; gap: 0.5rem; }
    .modal-header h2 { font-size: 1.05rem; font-weight: 800; color: #36255C; }
    .icon-btn { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; }
    .badge-verified { background: #36255C; color: #FFFFFF; font-weight: 800; font-size: 0.72rem; padding: 0.25rem 0.65rem; border-radius: 9999px; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .stat-card { background: #F7F4FD; border: 1px solid #D2C3F6; padding: 1rem; border-radius: 16px; display: flex; flex-direction: column; gap: 0.2rem; }
    .stat-label { font-size: 0.72rem; font-weight: 700; color: #6B7280; text-transform: uppercase; }
    .stat-val { font-size: 1.1rem; font-weight: 800; color: #36255C; }
    .stat-change { font-size: 0.7rem; font-weight: 600; color: #6B7280; }
    .text-green { color: #10B981; }
    .dashboard-section h3 { font-size: 0.95rem; font-weight: 800; color: #23173F; margin-bottom: 0.75rem; }
    .bookings-list { display: flex; flex-direction: column; gap: 0.65rem; overflow-x: auto; }
    .booking-row { display: flex; align-items: center; justify-content: space-between; background: #F9FAFB; padding: 0.85rem; border-radius: 14px; border: 1px solid #E5E7EB; gap: 1rem; flex-wrap: wrap; }
    .guest-info { display: flex; flex-direction: column; font-size: 0.85rem; }
    .guest-info span { font-size: 0.75rem; color: #6B7280; }
    .booking-dates { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .booking-amount { display: flex; flex-direction: column; align-items: flex-end; font-size: 0.9rem; color: #36255C; }
    .status-badge { font-size: 0.68rem; font-weight: 800; background: #D2C3F6; color: #36255C; padding: 0.15rem 0.5rem; border-radius: 9999px; }
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
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .bookings-list {
        overflow-x: auto;
      }
      .booking-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .booking-amount {
        align-items: flex-start;
        width: 100%;
      }
      .badge-verified {
        font-size: 0.65rem;
        padding: 0.2rem 0.5rem;
      }
      .modal-header h2 {
        font-size: 0.95rem;
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
export class HostDashboardComponent {
  @Output() close = new EventEmitter<void>();
  bookings = [
    { guestName: 'Aline Mugisha', listingTitle: 'Villa Lac Tanganyika', dates: '10 - 15 Août', totalPriceFbu: 1250000, status: 'Séquestre Escrow' },
    { guestName: 'David Kanyamibwa', listingTitle: 'Tiny Home Gitega', dates: '18 - 21 Août', totalPriceFbu: 330000, status: 'Confirmé' }
  ];
  formatFbu(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }
  closeModal() {
    this.close.emit();
  }
}
