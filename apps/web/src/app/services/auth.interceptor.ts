import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshToken$ = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = req.url.startsWith('/api') || req.url.startsWith(environment.apiBaseUrl);
    const token = this.auth.token();

    let request = req;
    if (isApiRequest && token) {
      request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: false,
      });
    }

    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next, error);
        }
        return throwError(() => error);
      }),
    );
  }

  private handle401Error(
    req: HttpRequest<unknown>,
    next: HttpHandler,
    err: HttpErrorResponse,
  ): Observable<HttpEvent<unknown>> {
    const url = req.url.toLowerCase();
    const isLoginOrAuth =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/otp');

    if (!this.auth.isAuthenticated() || isLoginOrAuth) {
      this.auth.logout();
      return throwError(() => err);
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshToken$.next(null);
      this.auth.refreshProfile().subscribe({
        next: () => {
          const token = this.auth.token();
          this.isRefreshing = false;
          this.refreshToken$.next(token);
        },
        error: () => {
          this.isRefreshing = false;
          this.auth.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
          });
          this.refreshToken$.next(null);
        },
      });
    }

    return this.refreshToken$.pipe(
      filter((t) => t !== null),
      take(1),
      switchMap((token) => {
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${token ?? ''}` },
        });
        return next.handle(cloned);
      }),
      catchError(() => {
        this.auth.logout();
        return throwError(() => err);
      }),
    );
  }
}
