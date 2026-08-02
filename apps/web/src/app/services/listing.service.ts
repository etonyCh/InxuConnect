import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Listing } from '../models/listing.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ListingService {
  private readonly apiBase = environment.apiBaseUrl;
  private readonly apiUrl = `${this.apiBase}/api/v1/listings`;

  constructor(private http: HttpClient) {}

  getListings(category?: string, searchLocation?: string): Observable<Listing[]> {
    let params = new HttpParams();
    if (category && category !== 'Tous') {
      params = params.set('category', category);
    }
    if (searchLocation && searchLocation.trim() !== '') {
      params = params.set('query', searchLocation);
    }

    return this.http
      .get<Listing[]>(this.apiUrl, { params, headers: this.defaultHeaders() })
      .pipe(
        catchError((err) => {
          console.warn('API connection returned empty or error, returning clean array:', err);
          return of([]);
        }),
      );
  }

  getListingById(id: number): Observable<Listing | undefined> {
    return this.http
      .get<Listing>(`${this.apiUrl}/${id}`, { headers: this.defaultHeaders() })
      .pipe(catchError(() => of(undefined)));
  }

  private defaultHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
    });
  }
}
