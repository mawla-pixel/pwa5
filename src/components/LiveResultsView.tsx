import React, { useState } from 'react';
import { Trophy, TrendingUp, Radio, Activity, Star, Award, ShieldCheck, Flame, ArrowUpRight, RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { FilmCategory } from '../types';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

export const LiveResultsView: React.FC = () => {
  const {
    films,
    categories,
    selectedCategory,
    setSelectedCategory,
    castVotesHistory,
    setActiveTab,
    setFilmToVoteFor,
    setIsVoteModalOpen,
    lastSyncedAt,
    refreshFestivalData,
    isLiveSupabaseData,
  } = useFestival();

  const [activeResultsCategory, setActiveResultsCategory] = useState<string>(() => {
    return categories[0]?.id || 'Short films';
  });
  const [syncToast, setSyncToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  // Pull-to-refresh hook
  const pullState = usePullToRefresh({
    onRefresh: async () => {
      const res = await refreshFestivalData('public_voting_films');
      if (res.success) {
        setSyncToast({
          show: true,
          msg: `Synced latest standings with Supabase (${(res.count || films.length).toLocaleString()} films)`,
        });
      } else {
        setSyncToast({
          show: true,
          msg: `Updated festival standings (${films.length} films)`,
        });
      }
      setTimeout(() => {
        setSyncToast({ show: false, msg: '' });
      }, 3500);
    },
  });

  // Filter films for this category and sort by votes descending
  const categoryFilms = films
    .filter((f) => f.category === activeResultsCategory)
    .sort((a, b) => b.votesCount - a.votesCount);

  const categoryTotalVotes = categoryFilms.reduce((acc, f) => acc + f.votesCount, 0) || 1;

  const leadingFilm = categoryFilms[0];

  return (
    <div
      ref={pullState.containerRef}
      className="min-h-screen bg-[#FAF8F5] pb-28 text-[#111111] relative"
    >
      {/* Visual Pull to Refresh Header Indicator */}
      <PullToRefreshIndicator state={pullState} syncLabel="Supabase Standings" sourceBadge="Live Ballot Standings" />

      {/* Sync confirmation toast */}
      {syncToast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{syncToast.msg}</span>
        </div>
      )}

      {/* Real-time Status Header */}
      <div className="bg-[#111111] text-[#FAF8F5] px-5 pt-8 pb-10 border-b border-[#A3792C]/20">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE VOTING AUDIT FEED ACTIVE</span>
            </div>

            {/* Sync Status & Action Button */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-400">
                Synced &bull; {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : new Date().toLocaleTimeString()}
              </span>

              <button
                onClick={() => pullState.triggerRefresh()}
                disabled={pullState.isRefreshing}
                title="Pull or tap to sync Supabase"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#FAF8F5] text-xs font-medium transition disabled:opacity-50 active:scale-95 border border-white/10"
              >
                <RefreshCw
                  className={`w-3 h-3 text-[#C59B3F] ${pullState.isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Real-Time Festival Results
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
                Live public and jury standings calculated with cryptographic audit receipts powered by Ziina payments and Supabase real-time sync.
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
        {/* Category Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-md border border-[#E8E3DA] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveResultsCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeResultsCategory === cat.id
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-[#F3EFEA]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Category Podium Leader Hero */}
        {leadingFilm && (
          <div className="rounded-3xl bg-gradient-to-br from-[#18181B] via-[#111111] to-[#242018] text-white p-6 shadow-xl border border-[#A3792C]/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3792C]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="relative shrink-0 w-28 h-38 md:w-36 md:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#C59B3F]/50">
                <img
                  src={leadingFilm.posterUrl}
                  alt={leadingFilm.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-[#C59B3F] text-black font-extrabold text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <Trophy className="w-3 h-3" />
                  <span>#1 LEADER</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-[#C59B3F] font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Category Leaderboard &bull; {activeResultsCategory}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-[#FAF8F5]">
                  {leadingFilm.title}
                </h2>
                <p className="text-xs text-neutral-300 font-arabic font-medium">
                  {leadingFilm.titleAr} &mdash; Dir. {leadingFilm.director} ({leadingFilm.country})
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-neutral-400 block uppercase">Total Votes</span>
                    <span className="text-lg font-black text-[#FAF8F5]">
                      {leadingFilm.votesCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-neutral-400 block uppercase">Vote Share</span>
                    <span className="text-lg font-black text-[#C59B3F]">
                      {((leadingFilm.votesCount / categoryTotalVotes) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setFilmToVoteFor(leadingFilm);
                      setIsVoteModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#C59B3F] hover:bg-[#b08732] text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-md active:scale-95"
                  >
                    <Star className="w-3.5 h-3.5 fill-black" />
                    <span>Boost Lead</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranked Standings Table */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E8E3DA] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DA]">
            <div>
              <h3 className="text-base font-extrabold text-[#111111]">Current Nominee Standings</h3>
              <p className="text-xs text-neutral-500">
                Total category votes cast: {categoryTotalVotes.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-neutral-500 font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Real-time</span>
            </div>
          </div>

          <div className="space-y-3">
            {categoryFilms.map((film, index) => {
              const votePercentage = ((film.votesCount / categoryTotalVotes) * 100).toFixed(1);

              return (
                <div
                  key={film.id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] hover:border-neutral-400 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Rank Monogram */}
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          index === 0
                            ? 'bg-[#C59B3F] text-black shadow-xs'
                            : index === 1
                            ? 'bg-neutral-300 text-neutral-900'
                            : index === 2
                            ? 'bg-amber-700/20 text-amber-900 border border-amber-700/30'
                            : 'bg-white border border-[#E8E3DA] text-neutral-500'
                        }`}
                      >
                        #{index + 1}
                      </div>

                      <img
                        src={film.posterUrl}
                        alt={film.title}
                        className="w-10 h-14 object-cover rounded-lg shrink-0"
                      />

                      <div>
                        <h4 className="text-sm font-bold text-[#111111] leading-tight">
                          {film.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          {film.director} &bull; {film.country}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-sm font-black text-[#111111] block">
                          {film.votesCount.toLocaleString()} votes
                        </span>
                        <span className="text-[11px] font-bold text-[#A3792C]">
                          {votePercentage}% share
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setFilmToVoteFor(film);
                          setIsVoteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-white border border-[#E8E3DA] hover:bg-[#111111] hover:text-white text-[#111111] transition shadow-xs"
                        title="Cast Vote"
                      >
                        <Star className="w-3.5 h-3.5 text-[#A3792C]" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Vote Bar */}
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E8E3DA]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        index === 0
                          ? 'bg-gradient-to-r from-[#C59B3F] to-[#A3792C]'
                          : 'bg-neutral-400'
                      }`}
                      style={{ width: `${votePercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Audit Stream */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E8E3DA] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DA]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#A3792C]" />
              <h3 className="text-sm font-bold text-[#111111]">Live Verified Ballot Stream</h3>
            </div>
            <span className="text-[11px] text-neutral-400">Past votes</span>
          </div>

          <div className="divide-y divide-[#E8E3DA] text-xs">
            {castVotesHistory.slice(0, 6).map((vote) => (
              <div key={vote.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E8E3DA] flex items-center justify-center text-[10px] text-[#A3792C] font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-[#111111]">{vote.userName}</span>
                    <span className="text-neutral-500"> voted for </span>
                    <span className="font-semibold text-neutral-800">{vote.filmTitle}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-[#A3792C]">+{vote.votesAllocated} votes</span>
                  <span className="text-[10px] text-neutral-400 block font-mono">{vote.txHash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
