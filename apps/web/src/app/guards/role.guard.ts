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
import { AuthRole, AuthService } from '../services/auth.service';
import { Observable, of, switchMap, catchError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanActivateChild, CanMatch {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const roles = route.data?.['roles'] as AuthRole[] | AuthRole | undefined;
    return this.evaluate(roles);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const roles = childRoute.data?.['roles'] as AuthRole[] | AuthRole | undefined;
    return this.evaluate(roles);
  }

  canMatch(route: Route, _segments: UrlSegment[]): Observable<boolean | UrlTree> {
    const roles = route.data?.['roles'] as AuthRole[] | AuthRole | undefined;
    return this.evaluate(roles);
  }

  private evaluate(roles: AuthRole[] | AuthRole | undefined): Observable<boolean | UrlTree> {
    const attempt = (): boolean | UrlTree => {
      if (!this.auth.isAuthenticated()) return this.router.createUrlTree(['/login']);
      if (!roles || (Array.isArray(roles) && roles.length === 0)) return true;
      const ok = this.auth.hasRole(Array.isArray(roles) ? roles : [roles]);
      return ok ? true : this.router.createUrlTree(['/403']);
    };

    const firstPass = attempt();
    if (firstPass === true) return of(true);

    if (this.auth.isAuthenticated()) {
      return of(firstPass);
    }

    return this.auth.refreshProfile().pipe(
      switchMap(() => of(attempt())),
      catchError(() => of(this.router.createUrlTree(['/login']))),
    );
  }
}
