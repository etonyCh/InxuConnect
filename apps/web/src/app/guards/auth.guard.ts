import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, CanMatch, Router, UrlTree, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild, CanMatch {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.evaluate(state.url);
  }

  canActivateChild(
    _childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.evaluate(state.url);
  }

  canMatch(
    _route: Route,
    segments: UrlSegment[],
  ): boolean | UrlTree {
    return this.evaluate('/' + segments.map((s) => s.path).join('/'));
  }

  private evaluate(returnUrl: string): boolean | UrlTree {
    if (this.auth.isAuthenticated()) return true;
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: returnUrl !== '/login' ? returnUrl : undefined },
    });
  }
}
