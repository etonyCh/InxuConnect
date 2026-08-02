import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, of, catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'GUEST' | 'HOST' | 'AGENT' | 'PARTNER' | 'B2B' | 'ADMIN';
  badge: 'NONE' | 'VERIFIED' | 'TRUSTED' | 'PREMIUM';
  phoneVerified: boolean;
  kycStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export type AuthRole = UserDto['role'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly isBrowser: boolean;

  private tokenSignal = signal<string | null>(null);
  private userSignal = signal<UserDto | null>(null);

  public readonly token = this.tokenSignal.asReadonly();
  public readonly user = this.userSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.userSignal() !== null);
  public readonly currentRole = computed<AuthRole | null>(() => this.userSignal()?.role ?? null);

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreSession();
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/login`, payload, { withCredentials: true })
      .pipe(tap((resp) => this.saveSession(resp)));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/register`, payload, { withCredentials: true })
      .pipe(tap((resp) => this.saveSession(resp)));
  }

  sendOtp(phone: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiBaseUrl}/api/auth/otp/send`,
      { phone },
      { withCredentials: true },
    );
  }

  verifyOtp(phone: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/api/auth/otp/verify`, {
        phone,
        code,
      }, { withCredentials: true })
      .pipe(tap((resp) => this.saveSession(resp)));
  }

  refreshProfile(): Observable<{ user: UserDto }> {
    return this.http
      .get<{ user: UserDto }>(`${environment.apiBaseUrl}/api/auth/profile`, { withCredentials: true })
      .pipe(
        tap((resp) => {
          if (resp.user) {
            this.userSignal.set(resp.user);
          }
        }),
        catchError(() => {
          this.logout();
          return throwError(() => new Error('Session invalide'));
        }),
      );
  }

  hasRole(requiredRole: AuthRole | AuthRole[]): boolean {
    const role = this.currentRole();
    if (!role) return false;
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return allowed.includes(role);
  }

  hasAnyAuthority(authorities: string[]): boolean {
    if (!this.userSignal()) return false;
    return authorities.includes(this.currentRole() ?? '');
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.http
      .post<void>(`${environment.apiBaseUrl}/api/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(undefined as unknown as void)))
      .subscribe();
  }

  decodeJwtExpiry(token: string): number | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const { exp } = JSON.parse(jsonPayload);
      return exp ? exp * 1000 : null;
    } catch {
      return null;
    }
  }

  isTokenExpiringSoon(): boolean {
    const token = this.tokenSignal();
    if (!token) return true;
    const expiry = this.decodeJwtExpiry(token);
    if (!expiry) return false;
    return expiry - Date.now() < environment.tokenRefreshThresholdMs;
  }

  authHeaders(): HttpHeaders {
    const token = this.tokenSignal();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  private saveSession(resp: AuthResponse): void {
    this.tokenSignal.set(resp.token);
    this.userSignal.set(resp.user);
  }

  private restoreSession(): void {
    if (!this.isBrowser) return;
    this.http
      .get<{ user: UserDto }>(`${environment.apiBaseUrl}/api/auth/profile`, { withCredentials: true })
      .pipe(
        catchError(() => of({ user: null as unknown as UserDto })),
      )
      .subscribe((resp) => {
        if (resp.user) {
          this.userSignal.set(resp.user);
        } else {
          this.tokenSignal.set(null);
          this.userSignal.set(null);
        }
      });
  }
}
