import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Listing } from '../models/listing.model';
import { environment } from '../../environments/environment';

export interface PaginatedListingsResponse {
  data: any[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({
  providedIn: 'root',
})
export class ListingService {
  private readonly apiBase = environment.apiBaseUrl;
  private readonly apiUrl = `${this.apiBase}/api/listings`;

  constructor(private http: HttpClient) {}

  getListings(category?: string, searchLocation?: string): Observable<Listing[]> {
    let params = new HttpParams();
    if (category && category !== 'Tous' && category !== 'tous') {
      const catLower = category.toLowerCase();
      if (['bujumbura', 'gitega', 'ngozi', 'bururi'].includes(catLower)) {
        params = params.set('city', category);
      } else {
        params = params.set('city', category);
      }
    }
    if (searchLocation && searchLocation.trim() !== '') {
      params = params.set('country', searchLocation.trim());
    }

    return this.http
      .get<PaginatedListingsResponse>(this.apiUrl, {
        params,
        headers: this.defaultHeaders(),
        withCredentials: true,
      })
      .pipe(
        map((resp) => (resp?.data ?? []).map((raw: any) => this.mapToListing(raw))),
        catchError(() => of([] as Listing[])),
      );
  }

  getListingById(id: string | number): Observable<Listing | undefined> {
    return this.http
      .get<any>(`${this.apiUrl}/${encodeURIComponent(String(id))}`, {
        headers: this.defaultHeaders(),
        withCredentials: true,
      })
      .pipe(
        map((raw) => (raw ? this.mapToListing(raw) : undefined)),
        catchError(() => of(undefined)),
      );
  }

  filterAdvanced(opts: {
    city?: string;
    maxPrice?: number;
    bedroomsMin?: number;
    hasGenerator?: boolean;
    hasWaterTank?: boolean;
    hasStarlink?: boolean;
  }): Observable<Listing[]> {
    let params = new HttpParams();
    if (opts.city) params = params.set('city', opts.city);
    if (opts.maxPrice) params = params.set('maxPrice', String(opts.maxPrice));
    if (opts.bedroomsMin) params = params.set('bedrooms', String(opts.bedroomsMin));
    if (opts.hasGenerator) params = params.set('hasGenerator', 'true');
    if (opts.hasWaterTank) params = params.set('hasWaterTank', 'true');
    if (opts.hasStarlink) params = params.set('hasStarlink', 'true');

    return this.http
      .get<PaginatedListingsResponse>(this.apiUrl, {
        params,
        headers: this.defaultHeaders(),
        withCredentials: true,
      })
      .pipe(
        map((resp) => (resp?.data ?? []).map((raw: any) => this.mapToListing(raw))),
        catchError(() => of([] as Listing[])),
      );
  }

  private mapToListing(raw: any): Listing {
    return {
      id: String(raw.id),
      title: raw.title ?? 'Sans titre',
      location: raw.location ?? [raw.city, raw.country].filter(Boolean).join(', '),
      province: raw.province ?? raw.city ?? '',
      category: raw.category ?? 'Maison',
      pricePerNightFbu: Number(raw.pricePerNightFbu ?? raw.price ?? 0),
      rating: Number(raw.rating ?? 4.9),
      reviewCount: Number(raw.reviewCount ?? 0),
      description: raw.description ?? '',
      photos: Array.isArray(raw.photos)
        ? raw.photos.map((p: any) => (typeof p === 'string' ? p : p?.url)).filter(Boolean)
        : [],
      amenities: Array.isArray(raw.amenities)
        ? raw.amenities.map((a: any) => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
        : [],
      hostName: raw.hostName ?? raw.owner?.name ?? 'Hôte InzuConnect',
      hostAvatar: raw.hostAvatar ?? undefined,
      isVerifiedHost: Boolean(raw.isVerifiedHost ?? /VERIFIED|PREMIUM/.test(raw.owner?.badge ?? '')),
      datesAvailable: raw.datesAvailable ?? 'Toute l\'année',
      guestsCount: Number(raw.guestsCount ?? Math.max(2, (raw.bedrooms ?? 1) * 2)),
      bedroomsCount: Number(raw.bedroomsCount ?? raw.bedrooms ?? 1),
      bathroomsCount: Number(raw.bathroomsCount ?? raw.bathrooms ?? 1),
      isFavorite: Boolean(raw.isFavorite),
      city: raw.city,
      address: raw.address,
      country: raw.country,
      owner: raw.owner,
      latitude: raw.latitude,
      longitude: raw.longitude,
    };
  }

  private defaultHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
    });
  }
}
