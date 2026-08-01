import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-picker-card">
      <div class="dates-inputs-row">
        <div class="date-field">
          <label><i class="fa-regular fa-calendar"></i> Arrivée (Check-in)</label>
          <input type="date" [(ngModel)]="checkInDate" (change)="onDateChange()" [min]="minDate" class="date-input" />
        </div>
        <div class="date-field">
          <label><i class="fa-regular fa-calendar-check"></i> Départ (Check-out)</label>
          <input type="date" [(ngModel)]="checkOutDate" (change)="onDateChange()" [min]="checkInDate || minDate" class="date-input" />
        </div>
      </div>
      <div class="nights-summary-badge" *ngIf="nightCount > 0">
        <i class="fa-solid fa-moon"></i>
        <span>{{ nightCount }} nuit{{ nightCount > 1 ? 's' : '' }} sélectionnée{{ nightCount > 1 ? 's' : '' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .date-picker-card {
      background: #F7F4FD;
      border: 1px solid #D2C3F6;
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .dates-inputs-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .date-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-field label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #36255C;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .date-input {
      border: 1px solid #D2C3F6;
      background: #FFFFFF;
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.85rem;
      color: #111827;
      outline: none;
    }

    .nights-summary-badge {
      background: #36255C;
      color: #FFFFFF;
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      align-self: flex-start;
    }
  `]
})
export class DateRangePickerComponent {
  @Output() rangeChange = new EventEmitter<{ checkIn: string; checkOut: string; nights: number }>();

  minDate = new Date().toISOString().split('T')[0];
  checkInDate = this.minDate;
  checkOutDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  nightCount = 3;

  onDateChange() {
    if (this.checkInDate && this.checkOutDate) {
      const d1 = new Date(this.checkInDate);
      const d2 = new Date(this.checkOutDate);
      const diffTime = d2.getTime() - d1.getTime();
      this.nightCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      this.rangeChange.emit({ checkIn: this.checkInDate, checkOut: this.checkOutDate, nights: this.nightCount });
    }
  }
}
