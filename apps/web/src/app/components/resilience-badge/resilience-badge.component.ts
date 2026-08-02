import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resilience-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resilience-card" [class.tier-autonome]="score >= 80" [class.tier-semi]="score >= 50 && score < 80">
      <div class="badge-header">
        <div class="badge-title">
          <i class="fa-solid fa-bolt-lightning"></i>
          <span>Indice de Résilience Énergétique Burundi</span>
        </div>
        <span class="score-pill">{{ score }}% Autonome</span>
      </div>

      <div class="score-progress-bar">
        <div class="score-fill" [style.width.%]="score"></div>
      </div>

      <div class="utilities-list">
        <div class="utility-item" [class.active]="hasSolar">
          <i class="fa-solid fa-solar-panel"></i>
          <span>Énergie Solaire 24/7</span>
        </div>
        <div class="utility-item" [class.active]="hasGenerator">
          <i class="fa-solid fa-charging-station"></i>
          <span>Groupe Électrogène Auto</span>
        </div>
        <div class="utility-item" [class.active]="hasWaterTank">
          <i class="fa-solid fa-faucet-drip"></i>
          <span>Citerne d'eau 5000L</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .resilience-card {
      background: #EAFBFE;
      border: 1.5px solid #50E8F4;
      border-radius: 16px;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .tier-autonome {
      background: #ECFDF5;
      border-color: #10B981;
    }

    .tier-semi {
      background: #FFFBEB;
      border-color: #F59E0B;
    }

    .badge-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .badge-title {
      font-size: 0.78rem;
      font-weight: 800;
      color: #001619;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .tier-autonome .badge-title { color: #065F46; }
    .tier-semi .badge-title { color: #92400E; }

    .score-pill {
      font-size: 0.72rem;
      font-weight: 800;
      background: #001619;
      color: #50E8F4;
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
    }

    .tier-autonome .score-pill { background: #10B981; color: #FFFFFF; }
    .tier-semi .score-pill { background: #F59E0B; color: #FFFFFF; }

    .score-progress-bar {
      width: 100%;
      height: 6px;
      background: #C7F8FE;
      border-radius: 9999px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: #001619;
      transition: width 0.4s ease;
    }

    .tier-autonome .score-fill { background: #10B981; }
    .tier-semi .score-fill { background: #F59E0B; }

    .utilities-list {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .utility-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      font-size: 0.68rem;
      font-weight: 700;
      color: #7ADEEB;
      background: rgba(255, 255, 255, 0.7);
      padding: 0.3rem;
      border-radius: 8px;
    }

    .utility-item.active {
      color: #001619;
      background: #FFFFFF;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
  `]
})
export class ResilienceBadgeComponent {
  @Input() hasSolar = true;
  @Input() hasGenerator = true;
  @Input() hasWaterTank = true;

  get score(): number {
    let total = 0;
    if (this.hasSolar) total += 40;
    if (this.hasGenerator) total += 30;
    if (this.hasWaterTank) total += 30;
    return total;
  }
}
