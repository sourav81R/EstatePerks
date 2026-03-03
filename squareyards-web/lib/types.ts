export type PropertyType = "Apartment" | "Villa" | "Plot" | "Office";
export type PropertyStatus = "Ready to Move" | "Under Construction" | "New Launch";

export interface Property {
  id: string;
  slug: string;
  name: string;
  city: string;
  locality: string;
  state: string;
  type: PropertyType;
  bhk: number;
  bathrooms: number;
  areaSqft: number;
  priceCr: number;
  pricePerSqft: number;
  status: PropertyStatus;
  possession: string;
  builder: string;
  reraId: string;
  rating: number;
  isFeatured?: boolean;
  isNewLaunch?: boolean;
  image: string;
  gallery: string[];
  summary: string;
  highlights: string[];
  amenities: string[];
}

export interface PropertyFilters {
  city?: string;
  type?: PropertyType | "All";
  bhk?: number;
  minPriceCr?: number;
  maxPriceCr?: number;
  keyword?: string;
}

export interface LeadPayload {
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
}
