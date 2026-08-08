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
          loadComponent: () =>
            import('./app/pages/home-page.component').then(
              (m) => m.HomePageComponent,
            ),
          pathMatch: 'full',
        },
        {
          path: 'login',
          loadComponent: () =>
            import('./app/pages/auth-page.component').then((m) => m.AuthPageComponent),
        },
        {
          path: 'listing/:id',
          loadComponent: () =>
            import('./app/pages/listing-detail-page.component').then(
              (m) => m.ListingDetailPageComponent,
            ),
        },
        {
          path: 'host-wizard',
          loadComponent: () =>
            import('./app/pages/host-wizard-page.component').then(
              (m) => m.HostWizardPageComponent,
            ),
          canActivate: [AuthGuard],
          canMatch: [AuthGuard],
        },
        {
          path: 'dashboard',
          loadComponent: () =>
            import('./app/pages/host-dashboard-page.component').then(
              (m) => m.HostDashboardPageComponent,
            ),
          canActivate: [AuthGuard],
          canMatch: [AuthGuard],
        },
        {
          path: 'admin',
          loadComponent: () =>
            import('./app/pages/host-dashboard-page.component').then(
              (m) => m.HostDashboardPageComponent,
            ),
          canActivate: [AuthGuard, RoleGuard],
          canMatch: [AuthGuard, RoleGuard],
          data: { roles: ['ADMIN'] },
        },
        {
          path: '403',
          loadComponent: () =>
            import('./app/pages/auth-page.component').then((m) => m.AuthPageComponent),
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
