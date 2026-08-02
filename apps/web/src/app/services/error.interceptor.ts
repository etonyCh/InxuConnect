import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { ErrorService } from './error.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorService: ErrorService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            this.errorService.pushNetwork();
          } else {
            this.errorService.pushFromApi(error.status, error.error);
          }
        } else if (error instanceof Error) {
          this.errorService.pushGeneric(error.message);
        }
        return throwError(() => error);
      }),
    );
  }
}
