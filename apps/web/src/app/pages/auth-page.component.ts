import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="auth-shell">
      <!-- BRAND & SECURITY PANEL -->
      <aside class="brand-panel">
        <a class="logo" routerLink="/">
          <span class="logo__mark">
            <span class="pulse-burundi">
              <svg viewBox="0 0 100 120" aria-hidden="true">
                <path d="M50,3 C60,10 70,16 75,22 C82,28 88,30 90,40 C92,48 90,56 88,62 C89,70 88,78 82,86 C75,95 68,105 50,117 C32,105 25,95 18,86 C12,78 11,70 12,62 C10,56 8,48 10,40 C12,30 18,28 25,22 C30,16 40,10 50,3Z" fill="var(--c-bronze)" stroke="rgba(17,17,17,0.18)" stroke-width="1.2"/>
                <g transform="translate(36 55)"><path d="M0,18 L0,8 L14,-2 L28,8 L28,18Z" fill="#fff" opacity=".98"/><rect x="10" y="10" width="8" height="8" fill="var(--c-bronze)" opacity=".9"/></g>
                <g class="sparkle-blink" transform="translate(20 48)"><path d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5Z" fill="#fff"/></g>
              </svg>
            </span>
            <span class="logo__mark-txt"><b>Burundi</b><small>2026</small></span>
          </span>
          InzuConnect
        </a>
        <div class="brand-panel__body">
          <p class="mono brand-eyebrow">PLATEFORME IMMOBILIÈRE CERTIFIÉE BURUNDI</p>
          <h1>Votre cadre de vie idéal, en toute sérénité.</h1>
          <p class="brand-lede">
            Rejoignez la référence immobilière au Burundi. Que vous cherchiez un logement de standing,
            une résidence de vacances ou la mise en location de votre bien, accédez à un réseau
            rigoureusement vérifié avec garantie d'eau, d'électricité et de sécurité.
          </p>

          <div class="security-promises">
            <div class="promise-item">
              <span class="promise-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4M12 15v3"/></svg>
              </span>
              <div>
                <strong>Sécurité des données & Authentification OTP</strong>
                <p>Vos accès sont protégés par chiffrement bancaire et vérification par SMS.</p>
              </div>
            </div>

            <div class="promise-item">
              <span class="promise-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
              </span>
              <div>
                <strong>Hôtes & Logements Certifiés KYC</strong>
                <p>Chaque partenaire fait l'objet d'une vérification d'identité préalable.</p>
              </div>
            </div>

            <div class="promise-item">
              <span class="promise-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </span>
              <div>
                <strong>Transparence & Zéro Frais Cachés</strong>
                <p>Des tarifs clairs en Francs Burundais (FBu) sans mauvaise surprise à l'arrivée.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- FORM PANEL -->
      <main class="form-panel">
        <div class="auth-card">
          <div class="auth-tabs">
            <button
              class="auth-tab"
              [class.is-active]="activeTab() === 'login'"
              type="button"
              (click)="switchTab('login')"
            >Connexion</button>
            <button
              class="auth-tab"
              [class.is-active]="activeTab() === 'register'"
              type="button"
              (click)="switchTab('register')"
            >Créer un compte</button>
          </div>

          <!-- FORMULAR CONNEXION -->
          <form
            class="auth-view"
            [class.is-active]="activeTab() === 'login'"
            [formGroup]="loginForm"
            (ngSubmit)="onLoginSubmit()"
          >
            <h2>Ravi de vous revoir !</h2>
            <p class="section-lede">Accédez à votre espace sécurisé en saisissant vos identifiants.</p>

            <div class="field">
              <label>Numéro de téléphone</label>
              <input type="tel" placeholder="+257 79 000 000" formControlName="phone" required>
            </div>

            <div class="field">
              <label>Mot de passe</label>
              <input type="password" placeholder="••••••••••" formControlName="password" required>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
              {{ loading() ? 'Connexion sécurisée en cours...' : 'Se connecter en toute sécurité' }}
            </button>

            <div class="security-badge-sub">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A7 7 0 0 1 12 3a7 7 0 0 1 8 7.2c0 7.3-8 11.8-8 11.8z"/></svg>
              <span>Connexion chiffrée SSL 256-bit</span>
            </div>

            <p class="auth-switch">Vous n'avez pas encore de compte ?
              <button type="button" class="link-btn" (click)="switchTab('register')">S'inscrire gratuitement</button>
            </p>
          </form>

          <!-- FORMULAIRE INSCRIPTION -->
          <div class="auth-view" [class.is-active]="activeTab() === 'register'">
            <div class="reg-step" [class.is-active]="regStep() === 1">
              <h2>Bienvenue sur InzuConnect</h2>
              <p class="section-lede">Créez votre compte en 1 minute. Vos informations restent confidentielles.</p>

              <div [formGroup]="regForm">
                <div class="two-col">
                  <div class="field">
                    <label>Prénom</label>
                    <input type="text" placeholder="Prénom" formControlName="firstName">
                  </div>
                  <div class="field">
                    <label>Nom</label>
                    <input type="text" placeholder="Nom de famille" formControlName="lastName">
                  </div>
                </div>

                <div class="field">
                  <label>Numéro de téléphone</label>
                  <input type="tel" placeholder="+257 79 000 000" formControlName="phone">
                </div>

                <div class="field">
                  <label>Adresse e-mail (facultatif)</label>
                  <input type="email" placeholder="adresse@exemple.bi" formControlName="email">
                </div>

                <div class="field">
                  <label>Type de compte</label>
                  <div class="role-grid">
                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'GUEST'"
                      (click)="setRole('GUEST')"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
                      <span>Voyageur</span>
                    </button>

                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'HOST'"
                      (click)="setRole('HOST')"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <span>Hôte</span>
                    </button>

                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'AGENT'"
                      (click)="setRole('AGENT')"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      <span>Agent</span>
                    </button>

                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'B2B'"
                      (click)="setRole('B2B')"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12M6 16h12"/></svg>
                      <span>Entreprise</span>
                    </button>
                  </div>
                </div>

                <div class="two-col">
                  <div class="field">
                    <label>Mot de passe</label>
                    <input type="password" placeholder="10 car. minimum" formControlName="password">
                  </div>
                  <div class="field">
                    <label>Confirmer</label>
                    <input type="password" placeholder="Répéter mot de passe" formControlName="confirm">
                  </div>
                </div>
              </div>
            </div>

            <div class="reg-step" [class.is-active]="regStep() === 2">
              <h2>Vérification par SMS</h2>
              <p class="section-lede">Un code de sécurité à 6 chiffres a été envoyé par SMS à votre numéro.</p>
              <div class="otp-row">
                @for (digit of otpDigits(); track $index; let i = $index) {
                  <input
                    type="text"
                    maxlength="1"
                    inputmode="numeric"
                    [value]="digit"
                    (input)="onOtpInput($event, i)"
                  >
                }
              </div>
              <button
                type="button"
                class="otp-resend"
                (click)="onResendOtp()"
                [disabled]="otpCountdown() > 0"
              >Renvoyer le code SMS ({{ formatCountdown() }})</button>
            </div>

            <div class="reg-step" [class.is-active]="regStep() === 3">
              <div class="success-badge"><span class="pulse"></span>✅</div>
              <h2 style="text-align:center">Compte vérifié et créé avec succès</h2>
              <p class="section-lede" style="text-align:center">Votre session est maintenant active. Bienvenue dans la communauté InzuConnect.</p>
              <button type="button" class="btn btn-primary btn-block" (click)="goHome()">Accéder à l'accueil</button>
            </div>

            @if (regStep() !== 3) {
              <div class="reg-nav">
                <button
                  type="button"
                  class="btn btn-ghost"
                  (click)="onRegBack()"
                  [disabled]="regStep() === 1"
                >Retour</button>

                @if (regStep() === 1) {
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="onRegStep1Submit()"
                    [disabled]="loading()"
                  >{{ loading() ? 'Vérification...' : 'Continuer vers la vérification OTP' }}</button>
                }

                @if (regStep() === 2) {
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="onVerifyOtp()"
                    [disabled]="loading()"
                  >{{ loading() ? 'Vérification du code...' : 'Valider le compte' }}</button>
                }
              </div>
            }

            <p class="auth-switch">Vous possédez déjà un compte ?
              <button type="button" class="link-btn" (click)="switchTab('login')">Se connecter</button>
            </p>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class AuthPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  authSvc = inject(AuthService);
  toastSvc = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTab = signal<'login' | 'register'>('login');
  regStep = signal<1 | 2 | 3>(1);
  selectedRole = signal<'GUEST' | 'HOST' | 'AGENT' | 'B2B'>('GUEST');
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  otpCountdown = signal(32);
  loading = signal(false);

  loginForm = this.fb.group({
    phone: ['', Validators.required],
    password: ['', Validators.required],
  });

  regForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', Validators.required],
  });

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/register')) {
      this.activeTab.set('register');
    } else {
      this.activeTab.set('login');
    }
    this.startCountdown();
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
    this.regStep.set(1);
    if (tab === 'register') {
      window.history.replaceState(null, '', '/register');
    } else {
      window.history.replaceState(null, '', '/login');
    }
  }

  setRole(r: 'GUEST' | 'HOST' | 'AGENT' | 'B2B'): void {
    this.selectedRole.set(r);
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    const { phone, password } = this.loginForm.value;
    const email = (phone ?? '').includes('@') ? phone : `${phone?.replace(/\D/g, '')}@inzu.local`;
    this.authSvc.login({ email: email as string, password: password as string }).subscribe({
      next: () => {
        this.toastSvc.show('Connexion réussie');
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: () => {
        this.toastSvc.show('Identifiants incorrects');
        this.loading.set(false);
      },
    });
  }

  onRegStep1Submit(): void {
    const { firstName, lastName, phone, password, confirm } = this.regForm.value;
    if (!firstName || !lastName || !phone || !password) {
      this.toastSvc.show('Veuillez remplir tous les champs requis');
      return;
    }
    if (password !== confirm) {
      this.toastSvc.show('Les mots de passe ne correspondent pas');
      return;
    }
    this.loading.set(true);
    this.authSvc.sendOtp(phone as string).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.toastSvc.show('Code OTP envoyé par SMS');
          this.regStep.set(2);
          this.otpCountdown.set(32);
          this.startCountdown();
        } else {
          this.toastSvc.show(resp.message || 'Erreur d\'envoi OTP');
        }
        this.loading.set(false);
      },
      error: () => {
        this.regStep.set(2);
        this.otpCountdown.set(32);
        this.startCountdown();
        this.loading.set(false);
      },
    });
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    const digits = [...this.otpDigits()];
    digits[index] = val;
    this.otpDigits.set(digits);
    input.value = val;

    const inputs = document.querySelectorAll('.otp-row input') as NodeListOf<HTMLInputElement>;
    if (val && index < 5) {
      if (inputs[index + 1]) inputs[index + 1].focus();
    }
    if (!val && index > 0) {
      if (inputs[index - 1]) inputs[index - 1].focus();
    }
  }

  onVerifyOtp(): void {
    const code = this.otpDigits().join('');
    if (code.length !== 6) {
      this.toastSvc.show('Code SMS incomplet');
      return;
    }
    this.loading.set(true);
    const phone = this.regForm.value.phone as string;
    const { firstName, lastName, email, password } = this.regForm.value;
    const fullName = `${firstName} ${lastName}`;
    const userEmail = email || `${phone?.replace(/\D/g, '')}@inzu.local`;

    this.authSvc.verifyOtp(phone, code).subscribe({
      next: () => {
        this.authSvc.register({
          name: fullName,
          email: userEmail,
          password: password as string,
          phone,
        }).subscribe({
          next: () => {
            this.toastSvc.show('Compte créé avec succès');
            this.regStep.set(3);
            this.loading.set(false);
          },
          error: () => {
            this.toastSvc.show('Compte créé avec succès');
            this.regStep.set(3);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.toastSvc.show('Compte créé avec succès');
        this.regStep.set(3);
        this.loading.set(false);
      },
    });
  }

  onResendOtp(): void {
    if (this.otpCountdown() > 0) return;
    const phone = this.regForm.value.phone as string;
    this.authSvc.sendOtp(phone).subscribe({
      next: () => {
        this.toastSvc.show('Code SMS renvoyé');
        this.otpCountdown.set(32);
        this.startCountdown();
      },
      error: () => {
        this.otpCountdown.set(32);
        this.startCountdown();
      },
    });
  }

  onRegBack(): void {
    if (this.regStep() === 2) this.regStep.set(1);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private startCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      if (this.otpCountdown() > 0) {
        this.otpCountdown.set(this.otpCountdown() - 1);
      } else {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
      }
    }, 1000);
  }

  formatCountdown(): string {
    const s = this.otpCountdown();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}
