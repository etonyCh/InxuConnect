import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

type BookingStatus = 'PAID' | 'CHECKED_IN' | 'PENDING';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  hasFbu?: boolean;
}

interface Booking {
  id: string;
  guest: string;
  dates: string;
  price: string;
  status: BookingStatus;
}

interface TopListing {
  title: string;
  pct: number;
  nights: number;
  amount: string;
}

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="dash-header">
      <a class="top-bar__back" routerLink="/">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        InzuConnect
      </a>
      <div>
        <p class="mono dash-eyebrow">TABLEAU DE BORD HÔTE</p>
        <h1>Bonjour, {{ userName() }} 👋</h1>
      </div>
      <a class="btn btn-primary" routerLink="/host/wizard">+ Nouvelle annonce</a>
    </header>

    <main class="dash-wrap">
      <section class="stat-grid">
        @for (s of stats; track s.label) {
          <div class="stat-card">
            <span class="stat-card__label">{{ s.label }}</span>
            <span class="stat-card__value mono">
              {{ s.value }}
              @if (s.hasFbu) { <small>FBu</small> }
            </span>
            <span class="stat-card__delta" [class.is-up]="s.up">{{ s.delta }}</span>
          </div>
        }
      </section>

      <div class="dash-grid">
        <section class="surface panel">
          <div class="panel__head">
            <h3>Réservations en cours</h3>
            <span class="mono panel__count">{{ bookings.length }} actives</span>
          </div>
          <div class="table-wrap">
            <table class="bookings-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Voyageur</th>
                  <th>Dates</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (b of bookings; track b.id) {
                  <tr>
                    <td class="mono">{{ b.id }}</td>
                    <td>{{ b.guest }}</td>
                    <td>{{ b.dates }}</td>
                    <td class="mono">{{ b.price }}</td>
                    <td>
                      <span class="status-badge" [class]="statusClass(b.status)">{{ b.status }}</span>
                    </td>
                    <td><button class="btn btn-ghost btn--sm">Détails</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="surface-dark panel savings-panel">
          <h3>Épargne Ikigega</h3>
          <p class="savings-panel__lede">5% de chaque réservation est mis de côté automatiquement.</p>
          <div class="savings-panel__balance mono">840 500 <small>FBu</small></div>
          <div class="savings-toggle">
            <span>Épargne automatique</span>
            <label class="switch">
              <input type="checkbox" [checked]="savingsAuto()" (change)="savingsToggle()">
              <span></span>
            </label>
          </div>
          <button class="btn btn-primary btn-block" (click)="withdraw()">💰 Demander un retrait</button>
        </section>

        <section class="surface panel">
          <h3>Top 5 logements les plus loués</h3>
          <div class="top-list">
            @for (l of topListings; track l.title) {
              <div class="top-list__row">
                <div class="top-list__img" [style.background-image]="'url(https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' + encodeURIComponent(l.title + '+modern+burundi+listing+photo') + '&image_size=square)'"></div>
                <div class="top-list__body">
                  <div class="top-list__head">
                    <strong>{{ l.title }}</strong>
                    <span class="mono">{{ l.amount }} FBu</span>
                  </div>
                  <div class="top-list__meta">
                    <div class="top-list__bar">
                      <div class="top-list__bar-fill" [style.width.%]="l.pct"></div>
                    </div>
                    <span class="mono top-list__nights">{{ l.nights }} nuits</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="surface panel">
          <div class="panel__head">
            <h3>Revenus — 12 derniers mois</h3>
            <span class="mono panel__count">{{ chartTotal() }}</span>
          </div>
          <div class="bar-chart">
            @for (bar of chartData; track bar; let i = $index) {
              <div class="bar-chart__col">
                <i [style.height.%]="100 * bar / chartMax"></i>
                <span>{{ chartLabels[i] }}</span>
              </div>
            }
          </div>
        </section>
      </div>
    </main>

    @if (toast.state().show) {
      <div class="toast"><span class="pulse"></span><span>{{ toast.state().text }}</span></div>
    }
  `,
})
export class HostDashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly toast = inject(ToastService);

  readonly savingsAuto = signal(true);
  readonly userName = computed<string>(
    () => this.authService.user()?.name?.split(' ')[0] ?? 'Hôte',
  );

  readonly stats: StatCard[] = [
    { label: 'Chiffre d\'affaires (mois)', value: '1 240 000', delta: '▲ 12% vs mois dernier', up: true, hasFbu: true },
    { label: 'Réservations confirmées', value: '18', delta: '▲ 4 nouvelles cette semaine', up: true },
    { label: 'Taux d\'occupation', value: '76%', delta: 'Sur 3 logements actifs', up: false },
    { label: 'Revenu moyen / nuit', value: '142 000', delta: '▲ 6%', up: true, hasFbu: true },
  ];

  readonly bookings: Booking[] = [
    { id: 'BK-7824', guest: 'Jeanne N.', dates: '12 mars → 15 mars', price: '540 000 FBu', status: 'PAID' },
    { id: 'BK-7823', guest: 'Patrick M.', dates: '15 mars → 20 mars', price: '900 000 FBu', status: 'CHECKED_IN' },
    { id: 'BK-7822', guest: 'Alice K.', dates: '18 mars → 22 mars', price: '720 000 FBu', status: 'PENDING' },
    { id: 'BK-7821', guest: 'Bob L.', dates: '22 mars → 24 mars', price: '360 000 FBu', status: 'PAID' },
    { id: 'BK-7820', guest: 'Chantal D.', dates: '25 mars → 30 mars', price: '900 000 FBu', status: 'PENDING' },
    { id: 'BK-7819', guest: 'David R.', dates: '30 mars → 2 avril', price: '540 000 FBu', status: 'CHECKED_IN' },
  ];

  readonly topListings: TopListing[] = [
    { title: 'Villa Kigobe vue lac', pct: 96, nights: 24, amount: '4 320 000' },
    { title: 'Studio Rohero centre', pct: 82, nights: 19, amount: '1 520 000' },
    { title: 'Maison Kinindo jardin', pct: 71, nights: 15, amount: '1 800 000' },
    { title: 'Appartement Gitega', pct: 58, nights: 11, amount: '880 000' },
    { title: 'Villa Ngozi montagne', pct: 42, nights: 8, amount: '720 000' },
  ];

  readonly chartData: number[] = [62, 48, 71, 83, 90, 77, 95, 88, 102, 118, 124, 140];
  readonly chartLabels: string[] = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  readonly chartMax: number = Math.max(...this.chartData);
  readonly chartTotal = computed<string>(() => this.chartData.reduce((a, b) => a + b, 0) + ' 000 FBu');

  statusClass(status: BookingStatus): string {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'PENDING': return 'status-pending';
      case 'CHECKED_IN': return 'status-checkedin';
    }
  }

  savingsToggle(): void {
    this.savingsAuto.update(v => !v);
    this.toast.show(this.savingsAuto() ? 'Épargne automatique activée' : 'Épargne automatique désactivée');
  }

  withdraw(): void {
    this.toast.show('Demande de retrait envoyée. Un agent vous contactera sous 24h.');
  }
}
