import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wishlist-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <button class="icon-btn" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          <h2>Mes Favoris & Collections</h2>
          <button class="add-collection-btn" (click)="isCreating = !isCreating">+ Nouvelle Liste</button>
        </div>

        <div class="modal-body">
          <div class="new-collection-row" *ngIf="isCreating">
            <input type="text" [(ngModel)]="newListName" placeholder="Nom de la liste (ex: Séjour Bujumbura)" class="form-input" />
            <button class="btn-primary" (click)="addCollection()">Créer</button>
          </div>

          <div class="collections-grid">
            <div *ngFor="let col of collections" class="collection-card">
              <div class="collection-img-box">
                <img [src]="col.coverUrl" class="col-img" />
                <span class="count-badge">{{ col.count }} enregistrements</span>
              </div>
              <h3 class="col-name">{{ col.name }}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 10, 28, 0.65); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .modal-card { background: #FFFFFF; width: 100%; max-width: 580px; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(54, 37, 92, 0.3); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6; }
    .modal-header h2 { font-size: 1.1rem; font-weight: 800; color: #36255C; }
    .add-collection-btn { background: #F7F4FD; color: #36255C; border: 1px solid #D2C3F6; padding: 0.4rem 0.85rem; border-radius: 9999px; font-weight: 700; cursor: pointer; font-size: 0.8rem; }
    .icon-btn { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .new-collection-row { display: flex; gap: 0.5rem; }
    .form-input { flex: 1; padding: 0.5rem 0.85rem; border-radius: 12px; border: 1px solid #D2C3F6; outline: none; }
    .btn-primary { background: #36255C; color: #FFFFFF; border: none; padding: 0.5rem 1rem; border-radius: 12px; font-weight: 700; cursor: pointer; }
    .collections-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .collection-card { cursor: pointer; }
    .collection-img-box { position: relative; width: 100%; aspect-ratio: 4/3; border-radius: 16px; overflow: hidden; background: #F3F4F6; }
    .col-img { width: 100%; height: 100%; object-fit: cover; }
    .count-badge { position: absolute; bottom: 8px; left: 8px; background: rgba(54, 37, 92, 0.85); color: #FFFFFF; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 9999px; }
    .col-name { font-size: 0.9rem; font-weight: 800; color: #23173F; margin-top: 0.4rem; }
  `]
})
export class WishlistModalComponent {
  @Output() close = new EventEmitter<void>();

  isCreating = false;
  newListName = '';

  collections = [
    { name: 'Séjours Bujumbura Lac', count: 2, coverUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
    { name: 'Collines de Gitega & Escapades', count: 1, coverUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' }
  ];

  closeModal() {
    this.close.emit();
  }

  addCollection() {
    if (this.newListName.trim()) {
      this.collections.push({
        name: this.newListName,
        count: 0,
        coverUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'
      });
      this.newListName = '';
      this.isCreating = false;
    }
  }
}
