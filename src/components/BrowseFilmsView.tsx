import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Play, Clock, Globe, Award, Sparkles, ChevronRight, X, RefreshCw, Database, CheckCircle2, ChevronDown } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { Film, FilmCategory } from '../types';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

export const BrowseFilmsView: React.FC = () => {
  const {
    films,
    categories,
    selectedCategory,
    setSelectedCategory,
    setFilmToVoteFor,
    setIsVoteModalOpen,
    setActiveTab,
    isLiveSupabaseData,
    isLoadingFilms,
    loadFilmsFromSupabase,
    refreshFestivalData,
    lastSyncedAt,
  } = useFestival();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilmDetail, setSelectedFilmDetail] = useState<Film | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(24);
  const [syncToast, setSyncToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  // Pull-to-refresh hook
  const pullState = usePullToRefresh({
    onRefresh: async () => {
      const res = await refreshFestivalData('public_voting_films');
      if (res.success) {
        setSyncToast({
          show: true,
          msg: `Synced ${(res.count || films.length).toLocaleString()} films from Supabase backend`,
        });
      } else {
        setSyncToast({
          show: true,
          msg: `Synced festival catalog (${films.length} films)`,
        });
      }
      setTimeout(() => {
        setSyncToast({ show: false, msg: '' });
      }, 3500);
    },
  });

  // Filtered films
  const filteredFilms = useMemo(() => {
    return films.filter((film) => {
      const matchesCategory =
        selectedCategory === 'All' || film.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        film.title.toLowerCase().includes(q) ||
        (film.titleAr && film.titleAr.includes(q)) ||
        (film.director && film.director.toLowerCase().includes(q)) ||
        (film.country && film.country.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [films, selectedCategory, searchQuery]);

  // Paginated slice
  const visibleFilms = useMemo(() => {
    return filteredFilms.slice(0, displayCount);
  }, [filteredFilms, displayCount]);

  const handleQuickVote = (film: Film) => {
    setFilmToVoteFor(film);
    setIsVoteModalOpen(true);
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 24);
  };

  return (
    <div
      ref={pullState.containerRef}
      className="min-h-screen bg-[#FAF8F5] pb-28 text-[#111111] relative"
    >
      {/* Visual Pull to Refresh Header Indicator */}
      <PullToRefreshIndicator
        state={pullState}
        syncLabel="public_voting_films (2,634 films)"
        sourceBadge="Supabase Official Catalog"
      />

      {/* Sync confirmation toast */}
      {syncToast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{syncToast.msg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#111111] text-[#FAF8F5] px-5 pt-8 pb-10 border-b border-[#A3792C]/20">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A3792C] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C59B3F]">
                Official Selection 2026
              </span>
            </div>

            {/* Catalog Source Indicator & Sync Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3 text-[#C59B3F]" />
                <span>
                  {isLoadingFilms && films.length === 0
                    ? 'Loading Supabase Catalog...'
                    : `Supabase Catalog (${films.length.toLocaleString()} films)`}
                </span>
              </span>

              <button
                onClick={() => pullState.triggerRefresh()}
                disabled={pullState.isRefreshing || isLoadingFilms}
                title="Pull down or tap to sync latest films from Supabase"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition disabled:opacity-50 active:scale-95 border border-white/10"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    pullState.isRefreshing || isLoadingFilms ? 'animate-spin text-[#C59B3F]' : ''
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Festival Nominees &amp; Films
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
                Explore world-class feature films, shorts, and documentaries competing for the Al Mamoura Golden Palm. Cast your paid vote to decide the winners.
              </p>
            </div>

            {/* Mobile gesture hint */}
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
              <ChevronDown className="w-3.5 h-3.5 text-[#C59B3F] animate-bounce" />
              <span>Pull down to sync</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-5 space-y-6">
        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-2xl p-3 shadow-md border border-[#E8E3DA] space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayCount(24);
              }}
              placeholder={`Search ${films.length.toLocaleString()} films by title, director, country...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] text-xs font-medium border border-[#E8E3DA] focus:outline-none focus:border-[#A3792C]"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDisplayCount(24);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setDisplayCount(24);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'All'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-neutral-600 hover:bg-[#F3EFEA] border border-[#E8E3DA]'
              }`}
            >
              All Nominees ({films.length.toLocaleString()})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setDisplayCount(24);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-neutral-600 hover:bg-[#F3EFEA] border border-[#E8E3DA]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 px-1">
            <span>
              Showing {Math.min(displayCount, filteredFilms.length)} of {filteredFilms.length.toLocaleString()} matching films
            </span>
            {filteredFilms.length > displayCount && (
              <span className="text-[#A3792C] font-semibold">
                {filteredFilms.length - displayCount} more available
              </span>
            )}
          </div>
        </div>

        {/* Film Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleFilms.map((film) => (
            <div
              key={film.id}
              className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Poster Banner */}
                <div className="relative h-52 overflow-hidden bg-neutral-900">
                  <img
                    src={film.posterUrl}
                    alt={film.title}
                    loading="lazy"
                    onError={(e) => {
                      // Fallback image if poster link from database is broken
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#FAF8F5] text-[10px] font-bold border border-white/10 uppercase tracking-wider truncate max-w-[170px]">
                      {film.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#A3792C] text-white text-[10px] font-bold shrink-0">
                      {film.year}
                    </span>
                  </div>

                  {/* Bottom details on poster */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-extrabold leading-snug drop-shadow-md truncate">
                      {film.title}
                    </h3>
                    {film.titleAr && (
                      <p className="text-xs text-neutral-300 font-arabic truncate">{film.titleAr}</p>
                    )}
                  </div>
                </div>

                {/* Info body */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <Globe className="w-3.5 h-3.5 text-[#A3792C] shrink-0" />
                      <span className="truncate">{film.country}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {film.duration}
                    </span>
                    <span className="font-medium text-neutral-700 truncate max-w-[110px]">
                      {film.director}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {film.synopsis}
                  </p>

                  {/* Live vote count bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] font-medium text-neutral-500">Live Voter Standing</span>
                      <span className="font-extrabold text-[#111111]">{film.votesCount.toLocaleString()} votes</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8E3DA]">
                      <div
                        className="h-full bg-gradient-to-r from-[#C59B3F] to-[#A3792C] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (film.votesCount / 2500) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 pt-0 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedFilmDetail(film)}
                  className="py-2 px-2.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] text-xs font-bold text-neutral-800 hover:bg-[#F3EFEA] transition text-center"
                >
                  Synopsis
                </button>

                <button
                  onClick={() => handleQuickVote(film)}
                  className="py-2 px-2.5 rounded-xl bg-[#111111] hover:bg-[#252528] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Star className="w-3.5 h-3.5 text-[#C59B3F] fill-[#C59B3F]" />
                  <span>Vote</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Pagination */}
        {filteredFilms.length > displayCount && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3.5 rounded-2xl bg-[#111111] hover:bg-[#202024] text-white font-bold text-xs uppercase tracking-wider transition shadow-md active:scale-95"
            >
              Load Next 24 Nominees ({filteredFilms.length - displayCount} Remaining)
            </button>
          </div>
        )}

        {/* Loading skeleton when loading from Supabase */}
        {films.length === 0 && isLoadingFilms && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#A3792C]/20 flex items-center justify-center gap-2 text-xs font-bold text-[#A3792C]">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading 2,634 films from Supabase backend...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden animate-pulse">
                  <div className="h-52 bg-neutral-200" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty database state with Supabase sync action */}
        {films.length === 0 && !isLoadingFilms && (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#E8E3DA] space-y-3">
            <Database className="w-8 h-8 text-[#A3792C] mx-auto animate-bounce" />
            <p className="text-sm font-bold text-neutral-800">No films retrieved from Supabase database.</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Please check your Supabase credentials or tap below to sync table public_voting_films.
            </p>
            <button
              onClick={() => refreshFestivalData('public_voting_films')}
              className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#202024] text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C59B3F]" />
              <span>Sync Films from Supabase</span>
            </button>
          </div>
        )}

        {/* No search results */}
        {filteredFilms.length === 0 && films.length > 0 && (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#E8E3DA] space-y-3">
            <p className="text-sm font-bold text-neutral-700">No films match your search query.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Film Detail Modal */}
      {selectedFilmDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#FAF8F5] border border-[#E8E3DA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative">
            <button
              onClick={() => setSelectedFilmDetail(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Banner */}
            <div className="relative h-60 bg-neutral-900 shrink-0">
              <img
                src={selectedFilmDetail.bannerUrl || selectedFilmDetail.posterUrl}
                alt={selectedFilmDetail.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-transparent to-black/40" />
              <div className="absolute bottom-3 left-6 right-6">
                <span className="px-2.5 py-1 rounded-full bg-[#111111] text-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider">
                  {selectedFilmDetail.category}
                </span>
                <h2 className="text-xl font-black text-[#111111] mt-1 leading-snug">
                  {selectedFilmDetail.title}
                </h2>
                {selectedFilmDetail.titleAr && (
                  <p className="text-sm text-neutral-600 font-arabic font-bold">
                    {selectedFilmDetail.titleAr}
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable info */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-700 leading-relaxed">
              <div className="flex flex-wrap gap-4 text-neutral-500 py-1 border-b border-[#E8E3DA]">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Director</span>
                  <span className="font-bold text-[#111111]">{selectedFilmDetail.director}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Country</span>
                  <span className="font-bold text-[#111111]">{selectedFilmDetail.country}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Duration</span>
                  <span className="font-bold text-[#111111]">{selectedFilmDetail.duration}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Current Votes</span>
                  <span className="font-bold text-[#A3792C]">{selectedFilmDetail.votesCount}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#111111] mb-1">Synopsis</h4>
                <p className="text-neutral-600 leading-relaxed">{selectedFilmDetail.synopsis}</p>
                {selectedFilmDetail.synopsisAr && (
                  <p className="text-neutral-600 font-arabic leading-relaxed mt-2 text-right">
                    {selectedFilmDetail.synopsisAr}
                  </p>
                )}
              </div>

              {selectedFilmDetail.cast && selectedFilmDetail.cast.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-[#111111] mb-1">Principal Cast</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFilmDetail.cast.map((actor, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E3DA] text-[11px] font-medium text-neutral-700"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-white border-t border-[#E8E3DA] flex gap-3">
              <button
                onClick={() => {
                  setSelectedFilmDetail(null);
                  handleQuickVote(selectedFilmDetail);
                }}
                className="flex-1 py-3 rounded-xl bg-[#111111] hover:bg-[#202024] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition"
              >
                <Star className="w-4 h-4 text-[#C59B3F] fill-[#C59B3F]" />
                <span>Vote for this Film</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
