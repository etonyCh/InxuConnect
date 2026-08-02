import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-virtual-staging-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <button class="icon-btn" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <h2>Inzu AI Decorator - Staging Virtuel d'Intérieur</h2>
          <span class="ai-pill"><i class="fa-solid fa-wand-magic-sparkles"></i> IA Générative</span>
        </div>
        <div class="modal-body">
          <p class="staging-intro">
            Sublimez la valeur de votre logement en transformant vos photos brutes avec un style intérieur burundais moderne.
          </p>
          <div class="staging-visualizer">
            <div class="visual-box before-box">
              <span class="box-tag">Avant (Photo brute)</span>
              <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80" />
            </div>
            <div class="visual-box after-box">
              <span class="box-tag tag-ai">Après (IA Inzu Decorator)</span>
              <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80" />
            </div>
          </div>
          <div class="style-selector">
            <label class="style-label">Choisir un style déco :</label>
            <div class="styles-grid">
              <button class="style-btn active">🌿 Afro-Chic Bambou & Art Gitega</button>
              <button class="style-btn">🏙️ Modern Bujumbura Luxury</button>
              <button class="style-btn">☀️ Rustique Colline Bururi</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="apply-staging-btn" (click)="applyStaging()">
            <i class="fa-solid fa-camera-retro"></i> Générer l'image HD pour mon annonce
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 10, 28, 0.65); backdrop-filter: blur(8px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal-card { background: #FFFFFF; width: 100%; max-width: 640px; max-height: 90vh; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3); display: flex; flex-direction: column; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6; gap: 0.5rem; }
    .modal-header h2 { font-size: 1.05rem; font-weight: 800; color: #36255C; }
    .ai-pill { background: #F7F4FD; color: #36255C; font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 9999px; border: 1px solid #D2C3F6; }
    .icon-btn { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-y: auto; }
    .staging-intro { font-size: 0.88rem; color: #4B5563; }
    .staging-visualizer { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .visual-box { position: relative; aspect-ratio: 4/3; border-radius: 16px; overflow: hidden; }
    .visual-box img { width: 100%; height: 100%; object-fit: cover; }
    .box-tag { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.65); color: #FFFFFF; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 9999px; }
    .tag-ai { background: #36255C; }
    .style-label { font-size: 0.85rem; font-weight: 800; color: #23173F; display: block; margin-bottom: 0.5rem; }
    .styles-grid { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .style-btn { background: #F7F4FD; border: 1px solid #D2C3F6; color: #36255C; padding: 0.45rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
    .style-btn.active { background: #36255C; color: #FFFFFF; border-color: #36255C; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #F3F4F6; }
    .apply-staging-btn { width: 100%; background: #36255C; color: #FFFFFF; border: none; padding: 0.85rem; border-radius: 9999px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
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
      .apply-staging-btn {
        min-height: 44px;
      }
      .staging-visualizer {
        grid-template-columns: 1fr;
      }
      .style-btn {
        min-height: 44px;
      }
      .ai-pill {
        font-size: 0.7rem;
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
export class VirtualStagingModalComponent {
  @Output() close = new EventEmitter<void>();
  closeModal() { this.close.emit(); }
  applyStaging() {
    alert('L\'image retouchée par l\'IA Inzu Decorator a été ajoutée à votre annonce avec succès !');
    this.closeModal();
  }
}
