export interface Listing {
  id: number;
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
}

export interface TripSummary {
  destination: string;
  dates: string;
  budgetFbu: number;
  guests: number;
}
