import { Injectable } from '@angular/core';
import { CanActivateFn, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('inzu_token');
  if (token) {
    return true;
  }
  console.warn('Accès refusé - Authentification requise pour', state.url);
  return false;
};

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return authGuard(route, state) as boolean;
  }
}

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return (route, state) => {
    const userRole = localStorage.getItem('inzu_user_role') || 'GUEST';
    if (userRole === requiredRole || userRole === 'ADMIN') {
      return true;
    }
    console.warn(`Accès refusé - Rôle ${requiredRole} requis.`);
    return false;
  };
};
