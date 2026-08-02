import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Listing } from '../models/listing.model';
import { environment } from '../../environments/environment';

export interface PaginatedListingsResponse {
  data: Listing[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({
  providedIn: 'root',
})
export class ListingService {
  private readonly apiBase = environment.apiBaseUrl;
  private readonly apiUrl = `${this.apiBase}/api/listings`;
  private readonly searchUrl = `${this.apiBase}/api/v1/listings/search`;

  constructor(private http: HttpClient) {}

  getListings(category?: string, searchLocation?: string): Observable<Listing[]> {
    let params = new HttpParams();
    if (category && category !== 'Tous') {
      params = params.set('city', category);
    }
    if (searchLocation && searchLocation.trim() !== '') {
      params = params.set('country', searchLocation);
    }

    return this.http
      .get<PaginatedListingsResponse>(this.apiUrl, { params, headers: this.defaultHeaders() })
      .pipe(
        map((resp) => resp?.data ?? []),
        catchError((err) => {
          console.warn('API connection returned empty or error, returning clean array:', err);
          return of([] as Listing[]);
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
