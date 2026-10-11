import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Film, FilmCategory, VoteBundle, VoteOrder, CastVoteRecord, PaymentTransaction, UserSession, ZiinaSettings, SupabaseSettings } from '../types';
import { INITIAL_FILMS, CATEGORIES_DATA, VOTE_BUNDLES, VOTE_PRICE_AED, VOTE_PRICE_USD } from '../data/festivalData';
import { getZiinaSettings, saveZiinaSettings } from '../lib/ziina';
import {
  getSupabaseSettings,
  saveSupabaseSettings,
  getSupabaseClient,
  fetchAllFilmsFromSupabase,
  fetchBundlesFromSupabase,
  fetchRecentVotesFromSupabase,
  syncSupabaseWithServerConfig,
} from '../lib/supabase';
import confetti from 'canvas-confetti';

interface FestivalContextType {
  films: Film[];
  categories: typeof CATEGORIES_DATA;
  selectedCategory: FilmCategory | 'All';
  setSelectedCategory: (cat: FilmCategory | 'All') => void;
  bundles: VoteBundle[];
  selectedBundleId: string;
  setSelectedBundleId: (id: string) => void;
  currency: 'USD' | 'AED';
  setCurrency: (c: 'USD' | 'AED') => void;
  pricePerVoteAED: number;
  pricePerVoteUSD: number;
  user: UserSession;
  castVotesHistory: CastVoteRecord[];
  paymentsHistory: PaymentTransaction[];
  activeTab: 'home' | 'browse' | 'vote' | 'results' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'browse' | 'vote' | 'results' | 'profile' | 'admin') => void;
  selectedFilmForDetail: Film | null;
  setSelectedFilmForDetail: (film: Film | null) => void;
  isVoteModalOpen: boolean;
  setIsVoteModalOpen: (open: boolean) => void;
  filmToVoteFor: Film | null;
  setFilmToVoteFor: (film: Film | null) => void;
  isZiinaModalOpen: boolean;
  setIsZiinaModalOpen: (open: boolean) => void;
  bundleToPurchase: VoteBundle | null;
  setBundleToPurchase: (bundle: VoteBundle | null) => void;
  voteOrderToPay: VoteOrder | null;
  setVoteOrderToPay: (order: VoteOrder | null) => void;
  openPaidVoteModal: (film?: Film, initialVotes?: number) => void;
  ziinaSettings: ZiinaSettings;
  updateZiinaSettings: (settings: ZiinaSettings) => void;
  supabaseSettings: SupabaseSettings;
  updateSupabaseSettings: (settings: SupabaseSettings) => void;
  handlePurchaseVotes: (bundle: VoteBundle, method: 'apple_pay' | 'card' | 'ziina_wallet', intentId: string) => Promise<PaymentTransaction>;
  handlePaidVoteOrder: (order: VoteOrder, method: 'apple_pay' | 'card' | 'ziina_wallet', intentId: string) => Promise<{ success: boolean; txHash?: string; paymentId?: string; error?: string }>;
  handleCastVote: (filmId: string, count: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  toggleCategoryVoting: (category: FilmCategory) => void;
  setUser: React.Dispatch<React.SetStateAction<UserSession>>;
  totalFestivalRevenue: { usd: number; aed: number };
  totalVotesCastGlobal: number;
  isLoadingFilms: boolean;
  isLiveSupabaseData: boolean;
  lastSyncedAt: Date | null;
  loadFilmsFromSupabase: (tableName?: string) => Promise<{ success: boolean; count?: number; error?: string }>;
  refreshFestivalData: (tableName?: string) => Promise<{ success: boolean; count?: number; error?: string }>;
}

const FestivalContext = createContext<FestivalContextType | undefined>(undefined);

const LOCAL_STORAGE_FILMS = 'almamoura_films_v4';
const LOCAL_STORAGE_VOTES = 'almamoura_cast_votes_v4';
const LOCAL_STORAGE_PAYMENTS = 'almamoura_payments_v4';
const LOCAL_STORAGE_USER = 'almamoura_user_v4';
const LOCAL_STORAGE_IS_LIVE = 'almamoura_is_live_catalog_v4';

// Active purge of legacy cache keys to prevent mobile / desktop cache mismatch
try {
  const legacyKeys = [
    'almamoura_films',
    'almamoura_films_v1',
    'almamoura_films_v2',
    'almamoura_films_v3',
    'almamoura_cast_votes',
    'almamoura_cast_votes_v1',
    'almamoura_cast_votes_v2',
    'almamoura_cast_votes_v3',
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch {}

export const FestivalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Films state (strictly loaded from Supabase backend)
  const [films, setFilms] = useState<Film[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FILMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Reject any legacy demo data array
          const hasDemoFilm = parsed.some(
            (f: any) =>
              (typeof f.id === 'string' && f.id.startsWith('film-')) ||
              f.title === 'The Desert Whispers' ||
              f.title === 'Nomad of the Dunes'
          );
          if (!hasDemoFilm) {
            return parsed;
          }
          localStorage.removeItem(LOCAL_STORAGE_FILMS);
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const [isLoadingFilms, setIsLoadingFilms] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isLiveSupabaseData, setIsLiveSupabaseData] = useState<boolean>(true);

  const [categories, setCategories] = useState(CATEGORIES_DATA);
  const [selectedCategory, setSelectedCategory] = useState<FilmCategory | 'All'>('All');
  const [bundles, setBundles] = useState<VoteBundle[]>(VOTE_BUNDLES);
  const [selectedBundleId, setSelectedBundleId] = useState<string>('five'); // Matches DB bundle ID
  const [currency, setCurrency] = useState<'USD' | 'AED'>('AED'); // Default AED matching database currency

  // Navigation tab (Home view is default)
  const [activeTab, setActiveTab] = useState<'home' | 'browse' | 'vote' | 'results' | 'profile' | 'admin'>('home');

  // Modals & Sheets
  const [selectedFilmForDetail, setSelectedFilmForDetail] = useState<Film | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [filmToVoteFor, setFilmToVoteFor] = useState<Film | null>(null);
  const [isZiinaModalOpen, setIsZiinaModalOpen] = useState(false);
  const [bundleToPurchase, setBundleToPurchase] = useState<VoteBundle | null>(null);
  const [voteOrderToPay, setVoteOrderToPay] = useState<VoteOrder | null>(null);

  // Per-vote official pricing
  const pricePerVoteAED = VOTE_PRICE_AED;
  const pricePerVoteUSD = VOTE_PRICE_USD;

  // User state: strictly 0 free votes. Voting is a paid order.
  const [user, setUser] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear legacy free 5 votes if user hasn't made an actual payment
        const hasLegacyFreeBalance = parsed.totalVotesPurchased === 5 && !localStorage.getItem(LOCAL_STORAGE_PAYMENTS);
        if (hasLegacyFreeBalance) {
          return {
            ...parsed,
            votesBalance: 0,
            totalVotesPurchased: 0,
            totalVotesCast: 0,
          };
        }
        return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return {
      id: 'voter_' + Math.random().toString(36).substring(2, 8),
      email: 'festival.guest@almamoura.ae',
      name: 'Festival Guest',
      votesBalance: 0, // NO FREE VOTES! Voting is a paid order
      totalVotesPurchased: 0,
      totalVotesCast: 0,
      isAdmin: false,
    };
  });

  // History states (real data from Supabase/local transactions)
  const [castVotesHistory, setCastVotesHistory] = useState<CastVoteRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v) =>
              !v.id?.startsWith('vote_fake_') &&
              !v.id?.startsWith('pulse_') &&
              !v.txHash?.startsWith('0x_demo_')
          );
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const [paymentsHistory, setPaymentsHistory] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAYMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Settings
  const [ziinaSettings, setZiinaSettingsState] = useState<ZiinaSettings>(getZiinaSettings);
  const [supabaseSettings, setSupabaseSettingsState] = useState<SupabaseSettings>(getSupabaseSettings);

  const updateZiinaSettings = (s: ZiinaSettings) => {
    setZiinaSettingsState(s);
    saveZiinaSettings(s);
  };

  const updateSupabaseSettings = (s: SupabaseSettings) => {
    setSupabaseSettingsState(s);
    saveSupabaseSettings(s);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FILMS, JSON.stringify(films));
  }, [films]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_VOTES, JSON.stringify(castVotesHistory));
  }, [castVotesHistory]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS, JSON.stringify(paymentsHistory));
  }, [paymentsHistory]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));
  }, [user]);

  // Real-time Supabase sync listener (if client configured)
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    // Listen for votes
    const channel = client
      .channel('public:votes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, (payload) => {
        const newVote = payload.new as any;
        setFilms((prev) =>
          prev.map((f) => (f.id === newVote.film_id ? { ...f, votesCount: f.votesCount + newVote.votes_allocated } : f))
        );
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Load real films from Supabase (defaults to public_voting_films with 2,634 films)
  const loadFilmsFromSupabase = useCallback(async (tableName?: string) => {
    setIsLoadingFilms(true);
    const targetTable = tableName || 'public_voting_films';
    let result = await fetchAllFilmsFromSupabase(targetTable);

    // Fallback: If client-side query returned 0 films, query server proxy /api/films
    if (!result.films || result.films.length === 0) {
      try {
        const proxyRes = await fetch('/api/films?limit=1000');
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          if (proxyData.films && proxyData.films.length > 0) {
            const mapped: Film[] = proxyData.films.map((item: any, index: number) => ({
              id: String(item.id || item.film_id || `film_${index + 1}`),
              title: String(item.title || item.film_title || `Film #${index + 1}`),
              titleAr: String(item.original_title || item.title_ar || item.title || ''),
              category: Array.isArray(item.project_types) && item.project_types.length > 0
                ? String(item.project_types[0])
                : (item.submission_category ? String(item.submission_category) : 'Official Selection'),
              director: String(item.director || 'Festival Filmmaker'),
              country: Array.isArray(item.countries_of_origin) && item.countries_of_origin.length > 0
                ? String(item.countries_of_origin[0])
                : (item.country || 'International'),
              year: parseInt(String(item.year), 10) || 2026,
              duration: item.duration_minutes ? `${item.duration_minutes} min` : 'Festival Short',
              posterUrl: item.poster_url || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
              bannerUrl: item.hero_image_url || item.poster_url || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
              synopsis: item.synopsis || 'Official film competing at Al Mamoura Film Festival 2026.',
              synopsisAr: item.original_synopsis || item.synopsis_ar || '',
              cast: Array.isArray(item.tags) ? item.tags : ['Festival Selection'],
              votesCount: Number(item.audience_votes || item.votes_count || 0),
              initialVotes: Number(item.audience_votes || item.votes_count || 0),
              trailerUrl: item.trailer_url || item.video_url || undefined,
            }));
            result = { films: mapped, tableNameUsed: proxyData.tableUsed || targetTable };
          }
        }
      } catch (proxyErr) {
        console.warn('Server proxy fetch fallback failed:', proxyErr);
      }
    }

    setIsLoadingFilms(false);

    if (result.films && result.films.length > 0) {
      setFilms(result.films);
      setIsLiveSupabaseData(true);
      setLastSyncedAt(new Date());
      localStorage.setItem(LOCAL_STORAGE_IS_LIVE, 'true');

      // Dynamically generate category filters based on all film genres in Supabase
      const uniqueCats = Array.from(new Set(result.films.map((f) => f.category))).filter(Boolean);
      if (uniqueCats.length > 0) {
        const dynamicCats = uniqueCats.map((catName) => {
          const matchExisting = CATEGORIES_DATA.find((c) => c.name.toLowerCase() === catName.toLowerCase());
          return (
            matchExisting || {
              id: catName,
              name: catName,
              nameAr: catName,
              description: `Films competing in ${catName}`,
              votingOpen: true,
              totalVotes: result.films.filter((f) => f.category === catName).reduce((a, b) => a + b.votesCount, 0),
            }
          );
        });
        setCategories(dynamicCats);
      }

      // Also sync bundles from database if available
      try {
        const dbBundles = await fetchBundlesFromSupabase();
        if (dbBundles && dbBundles.length > 0) {
          setBundles(dbBundles);
          setSelectedBundleId(dbBundles[1]?.id || dbBundles[0]?.id);
        }
      } catch (err) {
        console.warn('Failed to fetch bundles from Supabase:', err);
      }

      return { success: true, count: result.films.length };
    }

    return { success: false, error: result.error || 'No films found in Supabase table' };
  }, []);

  // Comprehensive pull-to-refresh sync for LiveResultsView & BrowseFilmsView
  const refreshFestivalData = useCallback(async (tableName?: string) => {
    setIsLoadingFilms(true);
    const targetTable = tableName || 'public_voting_films';
    try {
      // 1. Fetch latest films and live standings
      const result = await fetchAllFilmsFromSupabase(targetTable);

      if (result.films && result.films.length > 0) {
        setFilms(result.films);
        setIsLiveSupabaseData(true);
        localStorage.setItem(LOCAL_STORAGE_IS_LIVE, 'true');

        const uniqueCats = Array.from(new Set(result.films.map((f) => f.category))).filter(Boolean);
        if (uniqueCats.length > 0) {
          const dynamicCats = uniqueCats.map((catName) => {
            const matchExisting = CATEGORIES_DATA.find((c) => c.name.toLowerCase() === catName.toLowerCase());
            return (
              matchExisting || {
                id: catName,
                name: catName,
                nameAr: catName,
                description: `Films competing in ${catName}`,
                votingOpen: true,
                totalVotes: result.films.filter((f) => f.category === catName).reduce((a, b) => a + b.votesCount, 0),
              }
            );
          });
          setCategories(dynamicCats);
        }
      }

      // 2. Fetch latest verified ballots/votes from Supabase
      try {
        const recentVotes = await fetchRecentVotesFromSupabase();
        if (recentVotes && recentVotes.length > 0) {
          setCastVotesHistory((prev) => {
            const existingKeys = new Set(prev.map((v) => v.txHash || v.id));
            const fresh = recentVotes.filter((v) => !existingKeys.has(v.txHash || v.id));
            return [...fresh, ...prev].slice(0, 50);
          });
        }
      } catch (voteErr) {
        console.warn('Could not sync votes ledger from Supabase:', voteErr);
      }

      // 3. Sync pricing bundles
      try {
        const dbBundles = await fetchBundlesFromSupabase();
        if (dbBundles && dbBundles.length > 0) {
          setBundles(dbBundles);
        }
      } catch (bundleErr) {
        console.warn('Could not sync bundles from Supabase:', bundleErr);
      }

      setLastSyncedAt(new Date());
      setIsLoadingFilms(false);

      if (result.films && result.films.length > 0) {
        return { success: true, count: result.films.length };
      }
      return { success: false, error: result.error || 'No records returned from Supabase' };
    } catch (err: unknown) {
      setIsLoadingFilms(false);
      const msg = err instanceof Error ? err.message : 'Failed to refresh data from Supabase';
      return { success: false, error: msg };
    }
  }, []);

  // On mount: synchronize server env credentials and load official Supabase catalog
  useEffect(() => {
    // 1. Sync server-injected environment variables (important for Coolify / Docker containers)
    syncSupabaseWithServerConfig().then((settings) => {
      setSupabaseSettingsState(settings);
    });

    // 2. Fetch official catalog from Supabase table public_voting_films
    loadFilmsFromSupabase('public_voting_films').catch((e) => {
      console.warn('Initial Supabase fetch error:', e);
    });

    // 3. Fetch official pricing bundles & verified votes
    fetchBundlesFromSupabase().then((dbBundles) => {
      if (dbBundles && dbBundles.length > 0) {
        setBundles(dbBundles);
        setSelectedBundleId(dbBundles[1]?.id || dbBundles[0]?.id);
      }
    });

    fetchRecentVotesFromSupabase().then((votes) => {
      if (votes && votes.length > 0) {
        setCastVotesHistory(votes);
      }
    });
  }, [loadFilmsFromSupabase]);

  // Purchase votes via Ziina
  const handlePurchaseVotes = useCallback(
    async (bundle: VoteBundle, method: 'apple_pay' | 'card' | 'ziina_wallet', intentId: string) => {
      const price = currency === 'USD' ? bundle.priceUSD : bundle.priceAED;
      const newPayment: PaymentTransaction = {
        id: `tx_zn_${Date.now()}`,
        userId: user.id,
        userEmail: user.email,
        bundleId: bundle.id,
        votesGranted: bundle.votes,
        amount: price,
        currency,
        gateway: 'Ziina',
        ziinaPaymentIntentId: intentId,
        status: 'succeeded',
        paymentMethod: method,
        createdAt: new Date().toISOString(),
      };

      setPaymentsHistory((prev) => [newPayment, ...prev]);

      setUser((prev) => ({
        ...prev,
        votesBalance: prev.votesBalance + bundle.votes,
        totalVotesPurchased: prev.totalVotesPurchased + bundle.votes,
      }));

      // Try pushing to Supabase if connected
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('payments').insert([
            {
              id: newPayment.id,
              user_id: newPayment.userId,
              user_email: newPayment.userEmail,
              bundle_id: newPayment.bundleId,
              votes_granted: newPayment.votesGranted,
              amount: newPayment.amount,
              currency: newPayment.currency,
              gateway: 'Ziina',
              ziina_payment_intent_id: newPayment.ziinaPaymentIntentId,
              status: 'succeeded',
              payment_method: newPayment.paymentMethod,
            },
          ]);
        } catch (e) {
          console.warn('Failed to push payment to Supabase:', e);
        }
      }

      // Confetti burst
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#C59B3F', '#A3792C', '#111111', '#FFFFFF'],
        });
      } catch (err) {
        console.warn('Confetti effect skipped:', err);
      }

      return newPayment;
    },
    [currency, user]
  );

  // Open direct paid voting modal for any nominee
  const openPaidVoteModal = useCallback((film?: Film, _initialVotes: number = 1) => {
    if (film) {
      setFilmToVoteFor(film);
    }
    setIsVoteModalOpen(true);
  }, []);

  // Direct Paid Vote Order: User selects votes count (1, 5, etc.) and pays via Ziina
  const handlePaidVoteOrder = useCallback(
    async (order: VoteOrder, method: 'apple_pay' | 'card' | 'ziina_wallet', intentId: string) => {
      const txHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const paymentId = `tx_zn_${Date.now()}`;
      const paidAmount = order.currency === 'USD' ? order.amountUSD : order.amountAED;

      const targetFilm = films.find((f) => f.id === order.filmId);
      const filmTitle = targetFilm?.title || order.filmTitle;
      const filmCategory = (targetFilm?.category || order.category || 'Official Selection') as FilmCategory;

      // 1. Create Payment Transaction
      const newPayment: PaymentTransaction = {
        id: paymentId,
        userId: user.id,
        userEmail: user.email,
        filmId: order.filmId,
        filmTitle,
        votesGranted: order.votesCount,
        amount: paidAmount,
        currency: order.currency,
        gateway: 'Ziina',
        ziinaPaymentIntentId: intentId,
        status: 'succeeded',
        paymentMethod: method,
        createdAt: new Date().toISOString(),
      };

      // 2. Create Cast Vote Record
      const voteRecord: CastVoteRecord = {
        id: voteId,
        userId: user.id,
        userName: user.name,
        filmId: order.filmId,
        filmTitle,
        category: filmCategory,
        votesAllocated: order.votesCount,
        timestamp: new Date().toISOString(),
        txHash,
      };

      // 3. Update local state
      setPaymentsHistory((prev) => [newPayment, ...prev]);
      setCastVotesHistory((prev) => [voteRecord, ...prev]);

      // Update user totals
      setUser((prev) => ({
        ...prev,
        totalVotesPurchased: prev.totalVotesPurchased + order.votesCount,
        totalVotesCast: prev.totalVotesCast + order.votesCount,
        votesBalance: 0,
      }));

      // Increment film vote count
      setFilms((prev) =>
        prev.map((f) => (f.id === order.filmId ? { ...f, votesCount: f.votesCount + order.votesCount } : f))
      );

      // 4. Push to Supabase if connected
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('payments').insert([
            {
              id: newPayment.id,
              user_id: newPayment.userId,
              user_email: newPayment.userEmail,
              film_id: order.filmId,
              film_title: filmTitle,
              votes_granted: order.votesCount,
              amount: newPayment.amount,
              currency: newPayment.currency,
              gateway: 'Ziina',
              ziina_payment_intent_id: newPayment.ziinaPaymentIntentId,
              status: 'succeeded',
              payment_method: newPayment.paymentMethod,
            },
          ]);
        } catch (e) {
          console.warn('Failed to push payment to Supabase:', e);
        }

        try {
          await client.from('votes').insert([
            {
              id: voteRecord.id,
              user_id: voteRecord.userId,
              user_name: voteRecord.userName,
              film_id: voteRecord.filmId,
              film_title: voteRecord.filmTitle,
              category: voteRecord.category,
              votes_allocated: voteRecord.votesAllocated,
              tx_hash: voteRecord.txHash,
            },
          ]);
        } catch (e) {
          console.warn('Failed to insert vote into Supabase:', e);
        }
      }

      // Festive celebration
      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#A3792C', '#C59B3F', '#D4AF37', '#111111', '#FFFFFF'],
        });
      } catch (err) {
        console.warn('Confetti effect skipped:', err);
      }

      return { success: true, txHash, paymentId };
    },
    [films, user]
  );

  // Cast vote for a film
  const handleCastVote = useCallback(
    async (filmId: string, count: number) => {
      if (user.votesBalance < count) {
        return { success: false, error: 'Insufficient vote credits. Please purchase a bundle first!' };
      }

      const targetFilm = films.find((f) => f.id === filmId);
      if (!targetFilm) {
        return { success: false, error: 'Film not found.' };
      }

      const txHash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const voteRecord: CastVoteRecord = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        userName: user.name,
        filmId,
        filmTitle: targetFilm.title,
        category: targetFilm.category,
        votesAllocated: count,
        timestamp: new Date().toISOString(),
        txHash,
      };

      // Deduct balance & increment totals
      setUser((prev) => ({
        ...prev,
        votesBalance: prev.votesBalance - count,
        totalVotesCast: prev.totalVotesCast + count,
      }));

      // Increment film vote count
      setFilms((prev) =>
        prev.map((f) => (f.id === filmId ? { ...f, votesCount: f.votesCount + count } : f))
      );

      setCastVotesHistory((prev) => [voteRecord, ...prev]);

      // Supabase sync
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('votes').insert([
            {
              id: voteRecord.id,
              user_id: voteRecord.userId,
              user_name: voteRecord.userName,
              film_id: voteRecord.filmId,
              film_title: voteRecord.filmTitle,
              category: voteRecord.category,
              votes_allocated: voteRecord.votesAllocated,
              tx_hash: voteRecord.txHash,
            },
          ]);
        } catch (e) {
          console.warn('Failed to insert vote into Supabase:', e);
        }
      }

      // Festive celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A3792C', '#C59B3F', '#D4AF37', '#111111'],
      });

      return { success: true, txHash };
    },
    [films, user]
  );

  const toggleCategoryVoting = (catId: FilmCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, votingOpen: !c.votingOpen } : c))
    );
  };

  // Aggregated metrics
  const totalFestivalRevenue = paymentsHistory.reduce(
    (acc, p) => {
      if (p.currency === 'USD') {
        acc.usd += p.amount;
        acc.aed += p.amount * 3.67;
      } else {
        acc.aed += p.amount;
        acc.usd += p.amount / 3.67;
      }
      return acc;
    },
    { usd: 0, aed: 0 }
  );

  const totalVotesCastGlobal = films.reduce((acc, f) => acc + f.votesCount, 0);

  return (
    <FestivalContext.Provider
      value={{
        films,
        categories,
        selectedCategory,
        setSelectedCategory,
        bundles,
        selectedBundleId,
        setSelectedBundleId,
        currency,
        setCurrency,
        user,
        setUser,
        castVotesHistory,
        paymentsHistory,
        activeTab,
        setActiveTab,
        selectedFilmForDetail,
        setSelectedFilmForDetail,
        isVoteModalOpen,
        setIsVoteModalOpen,
        filmToVoteFor,
        setFilmToVoteFor,
        isZiinaModalOpen,
        setIsZiinaModalOpen,
        bundleToPurchase,
        setBundleToPurchase,
        ziinaSettings,
        updateZiinaSettings,
        supabaseSettings,
        updateSupabaseSettings,
        pricePerVoteAED,
        pricePerVoteUSD,
        voteOrderToPay,
        setVoteOrderToPay,
        openPaidVoteModal,
        handlePaidVoteOrder,
        handlePurchaseVotes,
        handleCastVote,
        toggleCategoryVoting,
        totalFestivalRevenue,
        totalVotesCastGlobal,
        isLoadingFilms,
        isLiveSupabaseData,
        lastSyncedAt,
        loadFilmsFromSupabase,
        refreshFestivalData,
      }}
    >
      {children}
    </FestivalContext.Provider>
  );
};

export const useFestival = () => {
  const context = useContext(FestivalContext);
  if (!context) {
    throw new Error('useFestival must be used within a FestivalProvider');
  }
  return context;
};
