import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kyc-upload-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <button class="icon-btn" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <h2>Vérification d'Identité (KYC Burundi)</h2>
          <span class="shield-icon"><i class="fa-solid fa-user-shield"></i></span>
        </div>

        <div class="modal-body">
          <p class="kyc-intro">
            Obtenez le badge <strong>VÉRIFIÉ</strong> pour renforcer la confiance des hôtes et voyageurs au Burundi.
          </p>

          <div class="upload-box">
            <i class="fa-solid fa-id-card upload-icon"></i>
            <strong>Carte Nationale d'Identité (CNI) ou Passeport</strong>
            <p>Glissez-déposez le recto/verso de votre pièce d'identité</p>
            <button class="btn-select-file" (click)="simulateUpload('CNI')">Sélectionner un fichier</button>
            <span class="file-status" *ngIf="idUploaded">✓ CNI_Burundi_Scan.pdf chargé</span>
          </div>

          <div class="upload-box">
            <i class="fa-solid fa-camera upload-icon"></i>
            <strong>Photo Selfie en direct</strong>
            <p>Prenez une photo claire de votre visage</p>
            <button class="btn-select-file" (click)="simulateUpload('Selfie')">Prendre une photo</button>
            <span class="file-status" *ngIf="selfieUploaded">✓ Selfie_Live.jpg chargé</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-submit" [disabled]="!idUploaded || !selfieUploaded" (click)="submitKyc()">
            Soumettre pour Vérification Admin
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 10, 28, 0.65); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal-card { background: #FFFFFF; width: 100%; max-width: 540px; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6; }
    .modal-header h2 { font-size: 1.05rem; font-weight: 800; color: #36255C; }
    .shield-icon { color: #36255C; font-size: 1.2rem; }
    .icon-btn { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .kyc-intro { font-size: 0.88rem; color: #4B5563; }
    .upload-box { background: #F7F4FD; border: 2px dashed #D2C3F6; padding: 1.25rem; border-radius: 18px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
    .upload-icon { font-size: 2rem; color: #36255C; margin-bottom: 0.2rem; }
    .upload-box p { font-size: 0.78rem; color: #6B7280; margin: 0; }
    .btn-select-file { background: #FFFFFF; color: #36255C; border: 1px solid #D2C3F6; padding: 0.4rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; cursor: pointer; margin-top: 0.4rem; }
    .file-status { color: #10B981; font-size: 0.78rem; font-weight: 700; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #F3F4F6; }
    .btn-submit { width: 100%; background: #36255C; color: #FFFFFF; border: none; padding: 0.85rem; border-radius: 9999px; font-weight: 800; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class KycUploadModalComponent {
  @Output() close = new EventEmitter<void>();

  idUploaded = false;
  selfieUploaded = false;

  closeModal() {
    this.close.emit();
  }

  simulateUpload(type: string) {
    if (type === 'CNI') this.idUploaded = true;
    if (type === 'Selfie') this.selfieUploaded = true;
  }

  submitKyc() {
    alert('Vos pièces d\'identité ont été envoyées aux administrateurs InzuConnect. Vous recevrez la confirmation du badge VÉRIFIÉ sous 24h.');
    this.closeModal();
  }
}
