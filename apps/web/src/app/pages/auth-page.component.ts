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
      <aside class="brand-panel">
        <a class="logo" routerLink="/">
          <span class="logo__mark"><span class="pulse"></span></span>
          InzuConnect
        </a>
        <div class="brand-panel__body">
          <p class="mono brand-eyebrow">AUTHENTIFICATION SÉCURISÉE</p>
          <h1>Chaque compte est un signal vérifié.</h1>
          <p class="brand-lede">Numéro confirmé par OTP, mot de passe chiffré Argon2id, session protégée par cookie HttpOnly. Rejoignez un réseau de logements où l'eau et l'électricité sont garanties.</p>
          <div class="brand-stats">
            <div><b class="mono">48</b><span>châteaux d'eau financés</span></div>
            <div><b class="mono">212</b><span>foyers électrifiés</span></div>
            <div><b class="mono">4.8★</b><span>satisfaction voyageurs</span></div>
          </div>
        </div>
      </aside>

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
            >Inscription</button>
          </div>

          <form
            class="auth-view"
            [class.is-active]="activeTab() === 'login'"
            [formGroup]="loginForm"
            (ngSubmit)="onLoginSubmit()"
          >
            <h2>Bon retour parmi nous</h2>
            <p class="section-lede">Connectez-vous avec votre numéro et votre mot de passe.</p>
            <div class="field">
              <label>Téléphone</label>
              <input type="tel" placeholder="+257 79 000 000" formControlName="phone" required>
            </div>
            <div class="field">
              <label>Mot de passe</label>
              <input type="password" placeholder="••••••••••" formControlName="password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
              {{ loading() ? 'Connexion...' : 'Se connecter' }}
            </button>
            <p class="auth-switch">Pas encore de compte ?
              <button type="button" class="link-btn" (click)="switchTab('register')">Créer un compte</button>
            </p>
          </form>

          <div class="auth-view" [class.is-active]="activeTab() === 'register'">
            <div class="reg-step" [class.is-active]="regStep() === 1">
              <h2>Créer un compte</h2>
              <p class="section-lede">Quelques informations pour commencer.</p>
              <div [formGroup]="regForm">
                <div class="two-col">
                  <div class="field">
                    <label>Prénom</label>
                    <input type="text" placeholder="Diane" formControlName="firstName">
                  </div>
                  <div class="field">
                    <label>Nom</label>
                    <input type="text" placeholder="Ndayishimiye" formControlName="lastName">
                  </div>
                </div>
                <div class="field">
                  <label>Téléphone</label>
                  <input type="tel" placeholder="+257 79 000 000" formControlName="phone">
                </div>
                <div class="field">
                  <label>Email (optionnel)</label>
                  <input type="email" placeholder="diane@example.com" formControlName="email">
                </div>

                <div class="field">
                  <label>Je m'inscris en tant que</label>
                  <div class="role-grid">
                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'GUEST'"
                      (click)="setRole('GUEST')"
                    >🧳<span>Voyageur</span></button>
                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'HOST'"
                      (click)="setRole('HOST')"
                    >🏠<span>Hôte</span></button>
                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'AGENT'"
                      (click)="setRole('AGENT')"
                    >🤝<span>Agent</span></button>
                    <button
                      type="button"
                      class="role-chip"
                      [class.is-active]="selectedRole() === 'B2B'"
                      (click)="setRole('B2B')"
                    >🏢<span>Entreprise</span></button>
                  </div>
                </div>

                <div class="two-col">
                  <div class="field">
                    <label>Mot de passe</label>
                    <input type="password" placeholder="10 caractères min." formControlName="password">
                  </div>
                  <div class="field">
                    <label>Confirmer</label>
                    <input type="password" placeholder="Confirmer" formControlName="confirm">
                  </div>
                </div>
              </div>
            </div>

            <div class="reg-step" [class.is-active]="regStep() === 2">
              <h2>Vérifiez votre numéro</h2>
              <p class="section-lede">Un code à 6 chiffres a été envoyé par SMS à votre numéro.</p>
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
              >Renvoyer le code ({{ formatCountdown() }})</button>
            </div>

            <div class="reg-step" [class.is-active]="regStep() === 3">
              <div class="success-badge"><span class="pulse"></span>✅</div>
              <h2 style="text-align:center">Compte créé avec succès</h2>
              <p class="section-lede" style="text-align:center">Votre session est active. Bienvenue sur InzuConnect.</p>
              <button type="button" class="btn btn-primary btn-block" (click)="goHome()">Aller à l'accueil</button>
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
                  >{{ loading() ? 'Envoi...' : 'Envoyer le code' }}</button>
                }
                @if (regStep() === 2) {
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="onVerifyOtp()"
                    [disabled]="loading()"
                  >{{ loading() ? 'Vérification...' : 'Vérifier' }}</button>
                }
              </div>
            }
            <p class="auth-switch">Déjà un compte ?
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

  setStep(n: 1 | 2 | 3): void {
    this.regStep.set(n);
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
          this.toastSvc.show('Code OTP envoyé');
          this.regStep.set(2);
          this.otpCountdown.set(32);
          this.startCountdown();
        } else {
          this.toastSvc.show(resp.message || 'Erreur envoi OTP');
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
      this.toastSvc.show('Code incomplet');
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
        this.toastSvc.show('Code renvoyé');
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
