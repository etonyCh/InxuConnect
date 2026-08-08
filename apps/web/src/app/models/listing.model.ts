export interface Listing {
  id: string;
  title: string;
  location: string;
  province: string;
  category: string;
  pricePerNightFbu: number;
  rating: number;
  reviewCount: number;
  description: string;
  photos: string[];
  amenities: string[];
  hostName: string;
  hostAvatar?: string;
  isVerifiedHost: boolean;
  datesAvailable: string;
  guestsCount: number;
  bedroomsCount: number;
  bathroomsCount: number;
  isFavorite?: boolean;
  city?: string;
  address?: string;
  country?: string;
  owner?: { id: string; name: string; badge: string; phone?: string };
  latitude?: number;
  longitude?: number;
}

export interface TripSummary {
  destination: string;
  dates: string;
  budgetFbu: number;
  guests: number;
}
