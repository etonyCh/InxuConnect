import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { ListingService } from '../services/listing.service';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 'success';

interface StepLabels {
  step: number;
  strong: string;
  em: string;
}

interface AmenityOption {
  key: string;
  label: string;
}

interface TypeOption {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-host-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <header class="top-bar">
      <a class="top-bar__back" routerLink="/">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Enregistrer et quitter
      </a>
      <div class="progress-track"><div class="progress-track__fill" [style.width.%]="progressPercent()"></div></div>
    </header>

    <main class="wizard">
      <aside class="wizard-side">
        <h2>Créer une annonce</h2>
        <p class="wizard-side__lede">6 étapes rapides pour publier votre logement sur InzuConnect.</p>
        <ol class="wizard-steps">
          @for (s of stepLabels; track s.step) {
            <li [class.is-active]="currentStep() === s.step || (currentStep() === 'success' && s.step === 6)">
              <span class="pulse" [class.is-dim]="currentStep() !== s.step && !(currentStep() === 'success' && s.step === 6)"></span>
              <div>
                <strong>{{ s.strong }}</strong>
                <em>{{ s.em }}</em>
              </div>
            </li>
          }
        </ol>
      </aside>

      <section class="wizard-content">
        <div class="wizard-panel" [class.is-active]="currentStep() === 1">
          <h3>Parlez-nous de votre logement</h3>
          <p class="section-lede">Un bon titre décrit le logement, le quartier et ce qui le rend fiable.</p>
          <form [formGroup]="wizardForm">
            <div class="field">
              <label>Titre de l'annonce</label>
              <input type="text" formControlName="step1Title" placeholder="Ex : Villa calme avec groupe électrogène, Kigobe">
            </div>
            <div class="field">
              <label>Description</label>
              <textarea formControlName="step1Description" rows="5" placeholder="Décrivez le logement, le quartier, l'accès à l'eau et à l'électricité…"></textarea>
            </div>
            <div class="field">
              <label>Ville</label>
              <select formControlName="step1City">
                <option value="">Sélectionner une ville</option>
                @for (c of cities; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
          </form>
        </div>

        <div class="wizard-panel" [class.is-active]="currentStep() === 2">
          <h3>Caractéristiques du logement</h3>
          <form [formGroup]="wizardForm">
            <div class="field">
              <label>Type de logement</label>
              <div class="check-grid">
                @for (t of typeOptions; track t.key) {
                  <button type="button" class="chip type-chip" [class.is-active]="wizardForm.get('step2Type')?.value === t.key" (click)="wizardForm.get('step2Type')?.setValue(t.key)">
                    {{ t.icon }} {{ t.label }}
                  </button>
                }
              </div>
            </div>
            <div class="two-col">
              <div class="field">
                <label>Chambres / lits</label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" (click)="stepBeds(-1)">−</button>
                  <span class="stepper__val mono">{{ wizardForm.get('step2Beds')?.value }}</span>
                  <button type="button" class="stepper__btn" (click)="stepBeds(1)">+</button>
                </div>
              </div>
              <div class="field">
                <label>Salles de bain</label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" (click)="stepBaths(-1)">−</button>
                  <span class="stepper__val mono">{{ wizardForm.get('step2Baths')?.value }}</span>
                  <button type="button" class="stepper__btn" (click)="stepBaths(1)">+</button>
                </div>
              </div>
            </div>
            <div class="field">
              <label>Voyageurs maximum</label>
              <div class="stepper">
                <button type="button" class="stepper__btn" (click)="stepGuests(-1)">−</button>
                <span class="stepper__val mono">{{ wizardForm.get('step2Guests')?.value }}</span>
                <button type="button" class="stepper__btn" (click)="stepGuests(1)">+</button>
              </div>
            </div>
          </form>
        </div>

        <div class="wizard-panel" [class.is-active]="currentStep() === 3">
          <h3>Prix et disponibilités</h3>
          <form [formGroup]="wizardForm">
            <div class="field">
              <label>Prix par nuit (FBu)</label>
              <input type="number" formControlName="step3Price" step="5000">
            </div>
            <div class="two-col">
              <div class="field">
                <label>Disponible à partir du</label>
                <input type="date" formControlName="step3AvailFrom">
              </div>
              <div class="field">
                <label>Jusqu'au</label>
                <input type="date" formControlName="step3AvailTo">
              </div>
            </div>
            <div class="field">
              <label>Frais de ménage (FBu)</label>
              <input type="number" formControlName="step3Cleaning" step="1000">
            </div>
          </form>
        </div>

        <div class="wizard-panel" [class.is-active]="currentStep() === 4">
          <h3>Équipements &amp; résilience</h3>
          <p class="section-lede">Les logements avec équipements de résilience reçoivent un badge visible sur la carte.</p>
          <div class="check-grid">
            @for (a of amenities; track a.key) {
              <label class="check-pill">
                <input type="checkbox" [checked]="amenityValue(a.key)" (change)="toggleAmenity(a.key)">
                <span>{{ a.label }}</span>
              </label>
            }
          </div>
        </div>

        <div class="wizard-panel" [class.is-active]="currentStep() === 5">
          <h3>Ajoutez vos photos</h3>
          <p class="section-lede">Jusqu'à 10 photos. La première sera votre photo de couverture.</p>
          <label class="dropzone" for="fPhotos">
            <span>📷</span><strong>Cliquez pour ajouter des photos</strong><em>JPG, PNG — 10 Mo max chacune</em>
          </label>
          <input type="file" id="fPhotos" multiple accept="image/*" hidden>
          <div class="photo-grid">
            @for (n of [1,2,3]; track n) {
              <div class="photo-grid__placeholder"></div>
            }
          </div>
        </div>

        <div class="wizard-panel" [class.is-active]="currentStep() === 6">
          <h3>Vérifiez votre annonce</h3>
          <div class="recap-card">
            <div class="recap-row">
              <span class="recap-row__label">Titre</span>
              <span class="recap-row__value">{{ wizardForm.get('step1Title')?.value || '—' }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Description</span>
              <span class="recap-row__value">{{ wizardForm.get('step1Description')?.value || '—' }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Ville</span>
              <span class="recap-row__value">{{ wizardForm.get('step1City')?.value || '—' }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Type</span>
              <span class="recap-row__value">{{ wizardForm.get('step2Type')?.value || '—' }}</span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Caractéristiques</span>
              <span class="recap-row__value">
                {{ wizardForm.get('step2Beds')?.value }} lits · {{ wizardForm.get('step2Baths')?.value }} salle(s) de bain · {{ wizardForm.get('step2Guests')?.value }} voyageurs
              </span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Prix / nuit</span>
              <span class="recap-row__value mono">{{ wizardForm.get('step3Price')?.value | number }} FBu</span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Disponibilité</span>
              <span class="recap-row__value">
                {{ (wizardForm.get('step3AvailFrom')?.value || 'Dès maintenant') + (wizardForm.get('step3AvailTo')?.value ? ' → ' + wizardForm.get('step3AvailTo')?.value : '') }}
              </span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Frais de ménage</span>
              <span class="recap-row__value mono">{{ wizardForm.get('step3Cleaning')?.value | number }} FBu</span>
            </div>
            <div class="recap-row">
              <span class="recap-row__label">Équipements</span>
              <span class="recap-row__value">{{ selectedAmenitiesLabels().join(', ') || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="wizard-panel wizard-panel--success" [class.is-active]="currentStep() === 'success'">
          <div class="success-badge"><span class="pulse"></span>✅</div>
          <h3>Votre annonce est en ligne</h3>
          <p class="section-lede">Elle apparaît désormais en tête de la grille sur la page d'accueil, avec ses badges de résilience.</p>
          <a class="btn btn-primary" routerLink="/">Voir sur la page d'accueil</a>
        </div>

        @if (currentStep() !== 'success') {
          <div class="wizard-nav">
            <button class="btn btn-ghost" (click)="prevStep()" [disabled]="currentStep() === 1">Précédent</button>
            @if (currentStep() === 6) {
              <button class="btn btn-primary" (click)="onSubmitStep6()">Publier l'annonce</button>
            } @else {
              <button class="btn btn-primary" (click)="nextStep()">Suivant</button>
            }
          </div>
        }
      </section>
    </main>

    @if (toast.state().show) {
      <div class="toast"><span class="pulse"></span><span>{{ toast.state().text }}</span></div>
    }
  `,
})
export class HostWizardPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly toast = inject(ToastService);
  private readonly listingService = inject(ListingService);

  readonly currentStep = signal<WizardStep>(1);
  readonly progressPercent = computed<number>(() => {
    const s = this.currentStep();
    if (s === 1) return 16;
    if (s === 2) return 33;
    if (s === 3) return 50;
    if (s === 4) return 66;
    if (s === 5) return 83;
    return 100;
  });

  readonly cities: string[] = ['Bujumbura', 'Gitega', 'Ngozi', 'Bururi'];
  readonly typeOptions: TypeOption[] = [
    { key: 'Maison', label: 'Maison', icon: '🏡' },
    { key: 'Studio', label: 'Studio', icon: '🛏️' },
    { key: 'Villa', label: 'Villa', icon: '🏛️' },
    { key: 'Appartement', label: 'Appartement', icon: '🏢' },
  ];
  readonly amenities: AmenityOption[] = [
    { key: 'Solaire', label: '☀️ Panneaux solaires' },
    { key: 'Citerne', label: '💧 Citerne d\'eau' },
    { key: 'Groupe', label: '🔌 Groupe électrogène' },
    { key: 'Starlink', label: '🛰️ Starlink' },
    { key: 'Cuisine', label: '🍳 Cuisine équipée' },
    { key: 'Parking', label: '🅿️ Parking privé' },
  ];
  readonly stepLabels: StepLabels[] = [
    { step: 1, strong: 'Infos de base', em: 'Titre, description, ville' },
    { step: 2, strong: 'Caractéristiques', em: 'Type, lits, capacité' },
    { step: 3, strong: 'Prix & disponibilités', em: 'Tarifs, dates, ménage' },
    { step: 4, strong: 'Équipements', em: 'Solaire, citerne, Starlink…' },
    { step: 5, strong: 'Photos', em: 'Jusqu\'à 10 images' },
    { step: 6, strong: 'Récapitulatif', em: 'Vérifier et publier' },
  ];

  readonly wizardForm: FormGroup;

  constructor() {
    this.wizardForm = this.fb.group({
      step1Title: [''],
      step1Description: [''],
      step1City: [''],
      step2Type: ['Maison'],
      step2Beds: [2],
      step2Baths: [1],
      step2Guests: [4],
      step3Price: [120000],
      step3AvailFrom: [''],
      step3AvailTo: [''],
      step3Cleaning: [10000],
      amenities: this.fb.group({
        Solaire: [false],
        Citerne: [true],
        Groupe: [true],
        Starlink: [false],
        Cuisine: [true],
        Parking: [false],
      }),
    });
  }

  private get amenitiesGroup(): FormGroup {
    return this.wizardForm.get('amenities') as FormGroup;
  }

  amenityValue(key: string): boolean {
    return Boolean(this.amenitiesGroup.get(key)?.value);
  }

  toggleAmenity(key: string): void {
    const ctrl = this.amenitiesGroup.get(key);
    if (ctrl) ctrl.setValue(!ctrl.value);
  }

  readonly selectedAmenitiesLabels = computed<string[]>(() => {
    const group = this.amenitiesGroup;
    return this.amenities
      .filter(a => Boolean(group.get(a.key)?.value))
      .map(a => a.label.replace(/^[^\s]+\s/, ''));
  });

  stepBeds(delta: number): void {
    const ctrl = this.wizardForm.get('step2Beds');
    if (!ctrl) return;
    ctrl.setValue(Math.max(0, (ctrl.value as number) + delta));
  }

  stepBaths(delta: number): void {
    const ctrl = this.wizardForm.get('step2Baths');
    if (!ctrl) return;
    ctrl.setValue(Math.max(0, (ctrl.value as number) + delta));
  }

  stepGuests(delta: number): void {
    const ctrl = this.wizardForm.get('step2Guests');
    if (!ctrl) return;
    ctrl.setValue(Math.max(1, (ctrl.value as number) + delta));
  }

  nextStep(): void {
    const s = this.currentStep();
    if (s === 1) this.currentStep.set(2);
    else if (s === 2) this.currentStep.set(3);
    else if (s === 3) this.currentStep.set(4);
    else if (s === 4) this.currentStep.set(5);
    else if (s === 5) this.currentStep.set(6);
  }

  prevStep(): void {
    const s = this.currentStep();
    if (s === 2) this.currentStep.set(1);
    else if (s === 3) this.currentStep.set(2);
    else if (s === 4) this.currentStep.set(3);
    else if (s === 5) this.currentStep.set(4);
    else if (s === 6) this.currentStep.set(5);
  }

  onSubmitStep6(): void {
    this.currentStep.set('success');
    this.toast.show('Annonce publiée avec succès !');
    setTimeout(() => {
      this.router.navigate(['/host/dashboard']);
    }, 2000);
  }
}
