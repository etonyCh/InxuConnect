import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanMatch,
  Router,
  UrlTree,
  Route,
  UrlSegment,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of, switchMap, catchError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild, CanMatch {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.evaluate(state.url);
  }

  canActivateChild(_childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.evaluate(state.url);
  }

  canMatch(_route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    return this.evaluate('/' + segments.map((s) => s.path).join('/'));
  }

  private evaluate(returnUrl: string): Observable<boolean | UrlTree> {
    if (this.auth.isAuthenticated()) return of(true);
    return this.auth.refreshProfile().pipe(
      switchMap(() => of(this.auth.isAuthenticated())),
      catchError(() => of(false)),
      switchMap((ok) => {
        if (ok) return of(true as boolean);
        return of(
          this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: returnUrl !== '/login' ? returnUrl : undefined },
          }),
        );
      }),
    );
  }
}
