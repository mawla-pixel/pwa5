export interface Film {
  id: string;
  title: string;
  titleAr: string;
  category: FilmCategory;
  director: string;
  country: string;
  year: number;
  duration: string;
  posterUrl: string;
  bannerUrl: string;
  synopsis: string;
  synopsisAr: string;
  trailerUrl?: string;
  cast: string[];
  votesCount: number;
  initialVotes: number;
  rank?: number;
}

export type FilmCategory =
  | 'Best Feature Film'
  | 'Best Short Film'
  | 'Best Documentary'
  | 'Best Emerging Director'
  | 'Audience Choice Award'
  | 'Best Cinematography'
  | string;

export interface CategoryInfo {
  id: FilmCategory;
  name: string;
  nameAr: string;
  description: string;
  votingOpen: boolean;
  totalVotes: number;
}

export interface VoteBundle {
  id: string;
  votes: number;
  priceUSD: number;
  priceAED: number;
  title: string;
  subtitle: string;
  badge?: string;
  isPopular?: boolean;
}

export interface VoteOrder {
  filmId: string;
  filmTitle: string;
  filmTitleAr?: string;
  category?: FilmCategory;
  posterUrl?: string;
  votesCount: number;
  unitPriceAED: number;
  unitPriceUSD: number;
  amountAED: number;
  amountUSD: number;
  currency: 'AED' | 'USD';
  totalPrice: number;
}

export interface CastVoteRecord {
  id: string;
  userId: string;
  userName: string;
  filmId: string;
  filmTitle: string;
  category: FilmCategory;
  votesAllocated: number;
  timestamp: string;
  txHash: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  bundleId?: string;
  filmId?: string;
  filmTitle?: string;
  votesGranted: number;
  amount: number;
  currency: 'USD' | 'AED';
  gateway: 'Ziina';
  ziinaPaymentIntentId: string;
  status: 'succeeded' | 'pending' | 'failed';
  paymentMethod: 'apple_pay' | 'card' | 'ziina_wallet';
  createdAt: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  votesBalance: number;
  totalVotesPurchased: number;
  totalVotesCast: number;
  isAdmin: boolean;
}

export interface ZiinaSettings {
  apiKey: string;
  webhookSecret: string;
  isTestMode: boolean;
  merchantId: string;
  currency: 'AED' | 'USD';
}

export interface SupabaseSettings {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
