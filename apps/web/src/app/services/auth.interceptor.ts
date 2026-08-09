import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = req.url.startsWith('/api') || req.url.startsWith(environment.apiBaseUrl);

    let request = req;
    if (isApiRequest) {
      request = req.clone({
        withCredentials: true,
      });
    }

    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, error);
        }
        return throwError(() => error);
      }),
    );
  }

  private handle401Error(
    req: HttpRequest<unknown>,
    err: HttpErrorResponse,
  ): Observable<HttpEvent<unknown>> {
    const url = req.url.toLowerCase();
    const isLoginOrAuth =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/otp');

    const isPublicRoute =
      url.startsWith('/api/listings') ||
      url.startsWith('/api/ai/') ||
      url.includes('/api/health') ||
      url.includes('/api-docs') ||
      url.includes('/swagger-ui') ||
      url.includes('/api/users/') && url.includes('/reviews');

    if (!this.auth.isAuthenticated() || isLoginOrAuth) {
      if (!isPublicRoute) this.auth.logout();
      return throwError(() => err);
    }

    if (isPublicRoute) {
      return throwError(() => err);
    }

    this.auth.logout();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
    return throwError(() => err);
  }
}
