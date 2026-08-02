import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AppComponent } from './app/app.component';
import { AuthInterceptor } from './app/services/auth.interceptor';
import { ErrorInterceptor } from './app/services/error.interceptor';
import { AuthGuard } from './app/guards/auth.guard';
import { RoleGuard } from './app/guards/role.guard';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([]),
      withFetch(),
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    provideRouter(
      [
        {
          path: '',
          component: AppComponent,
          pathMatch: 'full',
        },
        {
          path: 'login',
          loadComponent: () => import('./app/app.component').then((m) => m.AppComponent),
        },
        {
          path: '403',
          loadComponent: () => import('./app/app.component').then((m) => m.AppComponent),
        },
        {
          path: 'host',
          loadComponent: () => import('./app/app.component').then((m) => m.AppComponent),
          canActivate: [AuthGuard],
          canMatch: [AuthGuard],
        },
        {
          path: 'admin',
          loadComponent: () => import('./app/app.component').then((m) => m.AppComponent),
          canActivate: [AuthGuard, RoleGuard],
          canMatch: [AuthGuard, RoleGuard],
          data: { roles: ['ADMIN'] },
        },
        {
          path: 'dashboard',
          loadComponent: () => import('./app/app.component').then((m) => m.AppComponent),
          canActivate: [AuthGuard],
        },
        {
          path: '**',
          redirectTo: '',
        },
      ],
      withComponentInputBinding(),
    ),
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
