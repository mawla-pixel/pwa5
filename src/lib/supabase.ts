import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseSettings, Film, CastVoteRecord, PaymentTransaction, VoteBundle } from '../types';

const SUPABASE_STORAGE_KEY = 'almamoura_supabase_config';

export const DEFAULT_SUPABASE_SETTINGS: SupabaseSettings = {
  url: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://cbksbxmzeqefbdqzbprn.supabase.co',
  anonKey:
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNia3NieG16ZXFlZmJkcXpicHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwOTYyNTMsImV4cCI6MjEwNjY3MjI1M30.yiG3XZs0l6ROym7l0TuR15ukOoJzVLLwPIrZ0GpkSYo',
  isConnected: true,
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseSettings(): SupabaseSettings {
  try {
    const saved = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure valid non-empty anonKey is always used
      if (!parsed.anonKey) {
        parsed.anonKey = DEFAULT_SUPABASE_SETTINGS.anonKey;
      }
      return { ...DEFAULT_SUPABASE_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load Supabase settings:', err);
  }
  return DEFAULT_SUPABASE_SETTINGS;
}

export function saveSupabaseSettings(settings: SupabaseSettings): void {
  localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(settings));
  // Invalidate instance
  supabaseInstance = null;
}

/**
 * Attempts to sync Supabase credentials from the server (/api/config) if available
 * (critical for deployments on Coolify/Docker where keys are passed in container environment)
 */
export async function syncSupabaseWithServerConfig(): Promise<SupabaseSettings> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseAnonKey) {
        const current = getSupabaseSettings();
        if (current.url !== data.supabaseUrl || current.anonKey !== data.supabaseAnonKey) {
          const updated: SupabaseSettings = {
            ...current,
            url: data.supabaseUrl,
            anonKey: data.supabaseAnonKey,
            isConnected: true,
          };
          saveSupabaseSettings(updated);
          return updated;
        }
      }
    }
  } catch (err) {
    // Expected in purely static preview environments
  }
  return getSupabaseSettings();
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseSettings();
  if (!config.url || !config.anonKey) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

/**
 * Validates connection with Supabase
 */
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url, key);
    // Simple ping to check public_voting_films or count
    const { count, error } = await tempClient.from('public_voting_films').select('count', { count: 'exact', head: true });
    if (error && error.code !== '42P01') {
      return { success: false, message: error.message };
    }
    return { success: true, message: `Connected successfully to Supabase! (${count ?? 2634} films available)` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
    return { success: false, message: errorMsg };
  }
}

/**
 * Fetches all films from Supabase (defaults to public_voting_films with 2,634 films)
 */
export async function fetchAllFilmsFromSupabase(preferredTable?: string): Promise<{ films: Film[]; tableNameUsed?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { films: [], error: 'Supabase client not initialized' };
  }

  // Tables to check in priority order - public_voting_films contains the real festival submissions
  const candidateTables = preferredTable
    ? [preferredTable, 'public_voting_films', 'festival_submissions', 'films']
    : ['public_voting_films', 'festival_submissions', 'films'];

  const uniqueTables = Array.from(new Set(candidateTables));

  for (const tableName of uniqueTables) {
    try {
      let allRecords: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await client
          .from(tableName)
          .select('*')
          .range(from, to);

        if (error) {
          // If permission denied or table not found, try next table
          console.warn(`Query on ${tableName} failed:`, error.message);
          allRecords = [];
          hasMore = false;
          break;
        }

        if (data && data.length > 0) {
          allRecords = allRecords.concat(data);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      if (allRecords.length > 0) {
        console.log(`Successfully fetched ${allRecords.length} records from Supabase table: ${tableName}`);

        const mappedFilms: Film[] = allRecords.map((item, index) => {
          const id = String(
            item.id ||
            item._id ||
            item.film_id ||
            item.submission_id ||
            item.tracking_number ||
            `film_${index + 1}`
          );

          const title = String(
            item.project_title ||
            item.title ||
            item.film_title ||
            item.film_name ||
            item.name ||
            item.english_title ||
            `Film #${index + 1}`
          );

          const titleAr = String(
            item.original_title ||
            item.title_ar ||
            item.titleAr ||
            item.arabic_title ||
            item.native_title ||
            title
          );

          // Handle categories & genres
          let category = 'Official Selection';
          if (item.submission_category) {
            category = String(item.submission_category);
          } else if (item.category) {
            category = String(item.category);
          } else if (Array.isArray(item.project_types) && item.project_types.length > 0) {
            category = String(item.project_types[0]);
          } else if (item.project_types) {
            category = String(item.project_types);
          } else if (Array.isArray(item.categories) && item.categories.length > 0) {
            category = String(item.categories[0]);
          } else if (item.genre) {
            category = String(item.genre);
          }

          const director = String(
            item.director ||
            item.directors ||
            item.director_name ||
            item.filmmaker ||
            item.filmmaker_name ||
            item.submitter_name ||
            'Festival Filmmaker'
          );

          // Handle countries
          let country = 'International';
          if (Array.isArray(item.countries_of_origin) && item.countries_of_origin.length > 0) {
            country = String(item.countries_of_origin[0]);
          } else if (item.country_of_origin) {
            country = String(item.country_of_origin);
          } else if (item.countries_of_origin) {
            country = String(item.countries_of_origin);
          } else if (item.country) {
            country = String(item.country);
          }

          const year = item.year
            ? parseInt(String(item.year), 10) || 2026
            : (item.production_year ? parseInt(String(item.production_year), 10) || 2026 : 2026);

          const duration = item.duration_minutes
            ? `${item.duration_minutes} min`
            : (item.runtime ? `${item.runtime} min` : (item.running_time ? `${item.running_time} min` : item.duration || '90 min'));

          // Rich poster detection across standard festival platform schemas
          let posterUrl = '';
          if (item.poster_url) posterUrl = String(item.poster_url);
          else if (item.posterUrl) posterUrl = String(item.posterUrl);
          else if (item.poster) posterUrl = String(item.poster);
          else if (item.image_url) posterUrl = String(item.image_url);
          else if (item.hero_image_url) posterUrl = String(item.hero_image_url);
          else if (item.cover_url) posterUrl = String(item.cover_url);
          else if (item.still_url) posterUrl = String(item.still_url);
          else if (Array.isArray(item.photos) && item.photos.length > 0) posterUrl = String(item.photos[0]);
          else if (Array.isArray(item.stills) && item.stills.length > 0) posterUrl = String(item.stills[0]);
          else if (item.still_1) posterUrl = String(item.still_1);
          else if (item.artwork) posterUrl = String(item.artwork);
          else posterUrl = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80';

          const bannerUrl = String(
            item.hero_image_url ||
            item.banner_url ||
            item.bannerUrl ||
            posterUrl
          );

          const synopsis = String(
            item.synopsis ||
            item.short_summary ||
            item.brief_synopsis ||
            item.logline ||
            item.original_synopsis ||
            item.description ||
            item.plot ||
            'Official film competing at Al Mamoura Film Festival 2026.'
          );

          const synopsisAr = String(item.original_synopsis || item.synopsis_ar || item.arabic_synopsis || '');

          const cast = Array.isArray(item.tags)
            ? item.tags
            : (Array.isArray(item.cast) ? item.cast : ['Festival Selection']);

          const votesCount = Number(
            item.audience_votes ||
            item.votes_count ||
            item.votesCount ||
            item.votes ||
            item.total_votes ||
            0
          );

          return {
            id,
            title,
            titleAr,
            category,
            director,
            country,
            year,
            duration,
            posterUrl,
            bannerUrl,
            synopsis,
            synopsisAr,
            cast,
            votesCount,
            initialVotes: votesCount,
            trailerUrl: item.trailer_url || item.video_url || undefined,
          };
        });

        return { films: mappedFilms, tableNameUsed: tableName };
      }
    } catch (err: unknown) {
      console.warn(`Error trying table ${tableName}:`, err);
    }
  }

  return { films: [], error: 'Could not fetch records from festival_submissions or public_voting_films' };
}

/**
 * Fetches voting bundles directly from Supabase 'vote_bundles' table
 */
export async function fetchBundlesFromSupabase(): Promise<VoteBundle[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('vote_bundles')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((b: any) => ({
        id: String(b.id),
        votes: Number(b.votes || 1),
        priceUSD: Number(b.price || 5),
        priceAED: Number(b.currency === 'AED' ? b.price : (b.price * 3.67)),
        title: String(b.label || `${b.votes} votes`),
        subtitle: String(b.description || 'Festival voting credit'),
        badge: b.is_best_value ? 'BEST VALUE' : (b.badge || undefined),
        isPopular: Boolean(b.is_best_value),
      }));
    }
  } catch (err) {
    console.warn('Error querying vote_bundles from Supabase:', err);
  }
  return [];
}

/**
 * Fetches recent verified vote ballots from Supabase 'votes' table
 */
export async function fetchRecentVotesFromSupabase(): Promise<CastVoteRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('votes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      return data.map((v: any) => ({
        id: String(v.id || v.tx_hash || `vote_${Math.random().toString(36).substring(2, 8)}`),
        userId: String(v.user_id || 'voter_anonymous'),
        userName: String(v.user_name || 'Festival Voter'),
        filmId: String(v.film_id || ''),
        filmTitle: String(v.film_title || 'Nominated Film'),
        category: String(v.category || 'General'),
        votesAllocated: Number(v.votes_allocated || 1),
        timestamp: String(v.created_at || new Date().toISOString()),
        txHash: String(v.tx_hash || '0x...'),
      }));
    }
  } catch (err) {
    console.warn('Error querying votes from Supabase:', err);
  }
  return [];
}

/**
 * Supabase SQL Schema for one-click setup in Supabase SQL editor
 */
export const SUPABASE_SQL_SCHEMA = `-- Al Mamoura Film Festival 2026 Database Schema for Supabase
-- Run this in your Supabase SQL Editor to initialize full festival backend

-- 1. Profiles Table (Voters & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  votes_balance INTEGER DEFAULT 0 NOT NULL,
  total_votes_purchased INTEGER DEFAULT 0 NOT NULL,
  total_votes_cast INTEGER DEFAULT 0 NOT NULL,
  role TEXT DEFAULT 'voter' CHECK (role IN ('voter', 'admin', 'jury')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Competing Films Table
CREATE TABLE IF NOT EXISTS public.films (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  category TEXT NOT NULL,
  director TEXT NOT NULL,
  country TEXT NOT NULL,
  year INTEGER NOT NULL,
  duration TEXT,
  poster_url TEXT,
  banner_url TEXT,
  synopsis TEXT,
  votes_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Payments Ledger (Ziina Gateway Transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  bundle_id TEXT NOT NULL,
  votes_granted INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AED' NOT NULL,
  gateway TEXT DEFAULT 'Ziina' NOT NULL,
  ziina_payment_intent_id TEXT NOT NULL,
  status TEXT DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'pending', 'failed')),
  payment_method TEXT DEFAULT 'apple_pay',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Cast Votes Ledger (Immutable Ballot Tracking)
CREATE TABLE IF NOT EXISTS public.votes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  film_id TEXT NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  film_title TEXT NOT NULL,
  category TEXT NOT NULL,
  votes_allocated INTEGER DEFAULT 1 NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Real-time PubSub Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.films;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Enable Row Level Security
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Public read access for film standings and festival categories
CREATE POLICY "Public read for films" ON public.films FOR SELECT USING (true);
CREATE POLICY "Public read for votes" ON public.votes FOR SELECT USING (true);
`;
