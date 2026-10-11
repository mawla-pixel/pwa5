import { Film, CategoryInfo, VoteBundle } from '../types';

export const FESTIVAL_NAME = "Al Mamoura Film Festival";
export const FESTIVAL_NAME_AR = "مهرجان المعمورة السينمائي";
export const FESTIVAL_EDITION = "2026 Edition";
export const FESTIVAL_DATES = "October 14 – 22, 2026";
export const FESTIVAL_LOCATION = "Al Mamoura Cultural District, Abu Dhabi, UAE";

// Official per-vote pricing (Direct paid order per vote, no bundles, no free votes)
export const VOTE_PRICE_AED = 18.5;
export const VOTE_PRICE_USD = 5.0;

export const CATEGORIES_DATA: CategoryInfo[] = [
  {
    id: 'Short films',
    name: 'Short films',
    nameAr: 'أفلام قصيرة',
    description: 'Compact narratives delivering deep impact, creative vision, and striking visual artistry under 30 minutes.',
    votingOpen: true,
    totalVotes: 0,
  },
  {
    id: 'AI flims',
    name: 'AI films',
    nameAr: 'أفلام الذكاء الاصطناعي',
    description: 'Groundbreaking cinema exploring the boundaries of artificial intelligence and synthetic imagination.',
    votingOpen: true,
    totalVotes: 0,
  },
  {
    id: 'Documentary',
    name: 'Documentary',
    nameAr: 'أفلام وثائقية',
    description: 'True stories revealing heritage, human courage, social transformation, and unseen realities.',
    votingOpen: true,
    totalVotes: 0,
  },
  {
    id: 'Animation',
    name: 'Animation',
    nameAr: 'أفلام الرسوم المتحركة',
    description: 'Vibrant animated storytelling capturing cultural heritage, fantasy, and artistic innovation.',
    votingOpen: true,
    totalVotes: 0,
  },
  {
    id: 'Official Selection',
    name: 'Official Selection',
    nameAr: 'الاختيار الرسمي',
    description: 'Outstanding narrative storytelling showcasing cinematic excellence and cultural resonance.',
    votingOpen: true,
    totalVotes: 0,
  },
];

export const VOTE_BUNDLES: VoteBundle[] = [
  {
    id: 'single',
    votes: 1,
    priceAED: 5,
    priceUSD: 1.36,
    title: '1 vote',
    subtitle: 'Perfect for one favorite film',
    isPopular: false,
  },
  {
    id: 'five',
    votes: 5,
    priceAED: 25,
    priceUSD: 6.81,
    title: '5 votes',
    subtitle: 'Vote across multiple categories',
    badge: 'BEST VALUE',
    isPopular: true,
  },
  {
    id: 'ten',
    votes: 10,
    priceAED: 50,
    priceUSD: 13.62,
    title: '10 votes',
    subtitle: 'For dedicated festival supporters',
    isPopular: false,
  },
];

// No demo films: catalog is exclusively loaded from connected Supabase backend
export const INITIAL_FILMS: Film[] = [];

