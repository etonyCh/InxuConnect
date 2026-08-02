import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-host-listing-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <button class="icon-btn" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <h2>Ajouter un Logement (Espace Hôte InzuConnect)</h2>
          <span class="step-counter">Étape {{ currentStep }} sur 4</span>
        </div>
        <div class="modal-body">
          <div class="wizard-progress-bar">
            <div class="progress-fill" [style.width.%]="(currentStep / 4) * 100"></div>
          </div>
          <div *ngIf="currentStep === 1" class="wizard-step">
            <h3>Étape 1 : Titre et Catégorie du Logement</h3>
            <div class="form-group">
              <label>Titre de l'annonce</label>
              <input type="text" [(ngModel)]="listingTitle" placeholder="ex: Villa moderne avec vue lac à Bujumbura" class="form-input" />
            </div>
            <div class="form-group">
              <label>Catégorie de bien</label>
              <select [(ngModel)]="listingCategory" class="form-input">
                <option value="Vue lac">Vue lac</option>
                <option value="Tiny Homes">Tiny Homes</option>
                <option value="Cabanes">Cabanes</option>
                <option value="Chambres">Chambres</option>
                <option value="Fermes">Fermes</option>
                <option value="Piscines">Piscines</option>
              </select>
            </div>
          </div>
          <div *ngIf="currentStep === 2" class="wizard-step">
            <h3>Étape 2 : Emplacement au Burundi</h3>
            <div class="form-group">
              <label>Ville / Province</label>
              <select [(ngModel)]="listingCity" class="form-input">
                <option value="Bujumbura, Burundi">Bujumbura</option>
                <option value="Gitega, Burundi">Gitega</option>
                <option value="Ngozi, Burundi">Ngozi</option>
                <option value="Bururi, Burundi">Bururi</option>
                <option value="Rumonge, Burundi">Rumonge</option>
              </select>
            </div>
            <div class="form-group">
              <label>Quartier & Adresse exacte</label>
              <input type="text" [(ngModel)]="listingAddress" placeholder="ex: Avenue de la Plage, Rohero I" class="form-input" />
            </div>
          </div>
          <div *ngIf="currentStep === 3" class="wizard-step">
            <h3>Étape 3 : Photos et Équipements</h3>
            <div class="form-group">
              <label>URL de l'image principale</label>
              <input type="text" [(ngModel)]="photoUrl" placeholder="https://..." class="form-input" />
            </div>
            <div class="form-group">
              <label>Nombre de chambres</label>
              <input type="number" [(ngModel)]="bedrooms" min="1" class="form-input" />
            </div>
          </div>
          <div *ngIf="currentStep === 4" class="wizard-step">
            <h3>Étape 4 : Tarif en FBU (Franc Burundais) par Nuit</h3>
            <div class="form-group">
              <label>Prix par nuit (FBU)</label>
              <input type="number" [(ngModel)]="pricePerNightFbu" step="5000" min="20000" class="form-input" />
            </div>
            <div class="price-hint-card">
              <i class="fa-solid fa-lightbulb"></i>
              <span>Recommandation InzuConnect Price Coach : 150 000 FBU / nuit pour cette catégorie à {{ listingCity }}.</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" *ngIf="currentStep > 1" (click)="currentStep = currentStep - 1">Précédent</button>
          <button class="btn-primary" *ngIf="currentStep < 4" (click)="currentStep = currentStep + 1">Suivant</button>
          <button class="btn-success" *ngIf="currentStep === 4" (click)="submitListing()">
            <i class="fa-solid fa-cloud-arrow-up"></i> Publier l'annonce sur InzuConnect
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 10, 28, 0.65);
      backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .modal-card {
      background: #FFFFFF; width: 100%; max-width: 600px; max-height: 90vh; border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6; gap: 0.5rem;
    }
    .modal-header h2 { font-size: 1.05rem; font-weight: 800; color: #36255C; }
    .step-counter { font-size: 0.8rem; font-weight: 700; color: #7B4FB6; background: #F7F4FD; padding: 0.25rem 0.65rem; border-radius: 9999px; }
    .icon-btn { background: transparent; border: none; cursor: pointer; font-size: 1.1rem; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-y: auto; }
    .wizard-progress-bar { width: 100%; height: 6px; background: #E5E7EB; border-radius: 9999px; overflow: hidden; }
    .progress-fill { height: 100%; background: #36255C; transition: width 0.3s ease; }
    .wizard-step h3 { font-size: 1rem; font-weight: 800; color: #23173F; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
    .form-group label { font-size: 0.8rem; font-weight: 700; color: #374151; }
    .form-input { padding: 0.65rem 0.85rem; border-radius: 12px; border: 1px solid #D2C3F6; font-size: 0.9rem; outline: none; width: 100%; }
    .price-hint-card { background: #F7F4FD; border: 1px solid #D2C3F6; padding: 0.85rem; border-radius: 14px; font-size: 0.82rem; color: #36255C; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #F3F4F6; display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .btn-secondary { background: #F3F4F6; color: #374151; border: none; padding: 0.7rem 1.4rem; border-radius: 9999px; font-weight: 700; cursor: pointer; }
    .btn-primary { background: #36255C; color: #FFFFFF; border: none; padding: 0.7rem 1.4rem; border-radius: 9999px; font-weight: 700; cursor: pointer; }
    .btn-success { background: #10B981; color: #FFFFFF; border: none; padding: 0.7rem 1.4rem; border-radius: 9999px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
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
      .btn-secondary, .btn-primary, .btn-success {
        min-height: 44px;
        flex: 1;
        min-width: 120px;
      }
      .form-input {
        min-height: 44px;
        width: 100%;
      }
      .step-counter {
        font-size: 0.72rem;
        padding: 0.25rem 0.5rem;
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
export class HostListingWizardComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<any>();
  currentStep = 1;
  listingTitle = '';
  listingCategory = 'Vue lac';
  listingCity = 'Bujumbura, Burundi';
  listingAddress = '';
  photoUrl = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80';
  bedrooms = 2;
  pricePerNightFbu = 180000;
  closeModal() {
    this.close.emit();
  }
  submitListing() {
    const newListing = {
      title: this.listingTitle || 'Nouveau Logement InzuConnect',
      category: this.listingCategory,
      location: this.listingCity,
      address: this.listingAddress,
      pricePerNightFbu: this.pricePerNightFbu,
      photos: [this.photoUrl],
      bedroomsCount: this.bedrooms,
      rating: 5.0,
      reviewCount: 1,
      isVerifiedHost: true
    };
    alert(`Félicitations ! Votre annonce "${newListing.title}" a été publiée avec succès sur InzuConnect Burundi au tarif de ${new Intl.NumberFormat('fr-FR').format(this.pricePerNightFbu)} FBU / nuit.`);
    this.created.emit(newListing);
    this.closeModal();
  }
}
