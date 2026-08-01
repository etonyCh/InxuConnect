import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Listing } from '../models/listing.model';

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = 'http://localhost:8080/api/v1/listings';

  private mockListings: Listing[] = [
    {
      id: 1,
      title: 'Villa de Luxe au Bord du Lac Tanganyika',
      location: 'Bujumbura, Burundi',
      province: 'Bujumbura Mairie',
      category: 'Vue lac',
      pricePerNightFbu: 250000,
      rating: 4.95,
      reviewCount: 124,
      description: 'Superbe villa moderne offrant une vue panoramique imprenable sur le lac Tanganyika. Piscine privée, jardin tropical et accès direct à la plage.',
      photos: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'
      ],
      amenities: ['Piscine', 'Wifi haut débit', 'Petit-déjeuner inclus', 'Climatisation', 'Vue Lac', 'Parking sécurisé'],
      hostName: 'Jean-Claude Niyonzima',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      isVerifiedHost: true,
      datesAvailable: '10 - 15 Août',
      guestsCount: 4,
      bedroomsCount: 3,
      bathroomsCount: 2,
      isFavorite: true
    },
    {
      id: 2,
      title: 'Tiny Home Éco-responsable dans les Collines',
      location: 'Gitega, Burundi',
      province: 'Gitega',
      category: 'Tiny Homes',
      pricePerNightFbu: 110000,
      rating: 4.88,
      reviewCount: 92,
      description: 'Un charmant petit chalet écologique niché dans les collines verdoyantes de Gitega. Calme absolu, énergie solaire et vue spectaculaire.',
      photos: [
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1000&q=80'
      ],
      amenities: ['Énergie Solaire', 'Terrasse panoramique', 'Cuisine équipée', 'Jardin bio'],
      hostName: 'Aline Mugisha',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      isVerifiedHost: true,
      datesAvailable: '12 - 18 Août',
      guestsCount: 2,
      bedroomsCount: 1,
      bathroomsCount: 1,
      isFavorite: false
    },
    {
      id: 3,
      title: 'Chalet Panoramique sur les Hauteurs de Ngozi',
      location: 'Ngozi, Burundi',
      province: 'Ngozi',
      category: 'Cabanes',
      pricePerNightFbu: 160000,
      rating: 4.91,
      reviewCount: 68,
      description: 'Chalet romantique en bois local avec grande cheminée et vue à 360° sur les plantations de café de Ngozi.',
      photos: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80'
      ],
      amenities: ['Cheminée', 'Petit-déjeuner café local', 'Wifi', 'Balcon privé'],
      hostName: 'David Kanyamibwa',
      isVerifiedHost: true,
      datesAvailable: '14 - 20 Août',
      guestsCount: 3,
      bedroomsCount: 2,
      bathroomsCount: 1,
      isFavorite: false
    },
    {
      id: 4,
      title: 'Appartement Exécutif au Centre-Ville (Kiriri)',
      location: 'Kiriri, Bujumbura',
      province: 'Bujumbura Mairie',
      category: 'Chambres',
      pricePerNightFbu: 210000,
      rating: 4.97,
      reviewCount: 156,
      description: 'Idéal pour séjours d\'affaires ou vacances chic. Situé dans le quartier huppé de Kiriri avec sécurité 24/7.',
      photos: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'
      ],
      amenities: ['Sécurité 24/7', 'Climatisation', 'Wifi Fibre', 'Salle de sport'],
      hostName: 'InzuConnect Select',
      isVerifiedHost: true,
      datesAvailable: '8 - 14 Août',
      guestsCount: 2,
      bedroomsCount: 1,
      bathroomsCount: 1,
      isFavorite: true
    },
    {
      id: 5,
      title: 'Ferme & Lodge Authentique à Bururi',
      location: 'Bururi, Burundi',
      province: 'Bururi',
      category: 'Fermes',
      pricePerNightFbu: 135000,
      rating: 4.86,
      reviewCount: 47,
      description: 'Immersion nature dans une ferme traditionnelle rénovée près de la réserve naturelle de la forêt de Bururi.',
      photos: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1000&q=80'
      ],
      amenities: ['Produits de la ferme', 'Randonnées guidées', 'Barbecue', 'Espace feu de camp'],
      hostName: 'Emmanuel Nshimirimana',
      isVerifiedHost: false,
      datesAvailable: '20 - 26 Août',
      guestsCount: 5,
      bedroomsCount: 3,
      bathroomsCount: 2,
      isFavorite: false
    },
    {
      id: 6,
      title: 'Résidence Tropicale avec Piscine à Rohero',
      location: 'Rohero, Bujumbura',
      province: 'Bujumbura Mairie',
      category: 'Piscines',
      pricePerNightFbu: 280000,
      rating: 4.98,
      reviewCount: 210,
      description: 'Prestige et confort au cœur de Rohero. Piscine à débordement entourée de palmiers et service de conciergerie.',
      photos: [
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
      ],
      amenities: ['Piscine à débordement', 'Chef privé sur demande', 'Wifi Ultra-rapide', 'Service de ménage'],
      hostName: 'Marie-Rose Irakoze',
      isVerifiedHost: true,
      datesAvailable: '15 - 22 Août',
      guestsCount: 6,
      bedroomsCount: 4,
      bathroomsCount: 3,
      isFavorite: true
    }
  ];

  constructor(private http: HttpClient) {}

  getListings(category?: string, searchLocation?: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(this.apiUrl).pipe(
      catchError(() => {
        let results = [...this.mockListings];
        if (category && category !== 'Tous') {
          results = results.filter(l => l.category.toLowerCase() === category.toLowerCase());
        }
        if (searchLocation && searchLocation.trim() !== '') {
          const loc = searchLocation.toLowerCase();
          results = results.filter(l => l.location.toLowerCase().includes(loc) || l.title.toLowerCase().includes(loc));
        }
        return of(results);
      })
    );
  }

  getListingById(id: number): Observable<Listing | undefined> {
    return of(this.mockListings.find(l => l.id === id));
  }
}
