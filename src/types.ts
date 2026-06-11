export type ActiveTab = 'home' | 'search' | 'favorites' | 'profile' | 'details' | 'comparison' | 'notifications' | 'auth';

export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  timeUnit: string;
  image: string;
  tags: string[];
  distance: string;
  source: 'platform' | 'exclusive' | 'alumni' | 'FB';
  totalEstimate: number; // base rent + estimates
  rating: number;
  floor?: string;
  description?: string;
  amenities?: string[];
  url?: string;
  costBreakdown?: {
    rent: number;
    electric: number;
    water: number;
    management: number;
  };
}

export interface Review {
  id: string;
  author: string;
  dept: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface NotificationItem {
  id: string;
  type: 'new_listing' | 'price_drop' | 'system' | 'announcement';
  title: string;
  content: string;
  time: string;
  unread: boolean;
  image?: string;
}

export interface UserRequirements {
  maxPrice: number;
  maxDistance: string; // e.g. "5分鐘", "10分鐘", "15分鐘", "無限制"
  needElevator: boolean;
  amenities: string[];
  rawText?: string;
}

export interface UserProfile {
  name: string;
  studentId: string;
  department: string;
  isVerified: boolean;
  avatar: string;
  favoriteCount: number;
  comparingCount: number;
  requirements?: UserRequirements;
}
