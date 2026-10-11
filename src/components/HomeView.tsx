import React from 'react';
import { Star, Trophy, Sparkles, Film as FilmIcon, ChevronRight, ShieldCheck, Ticket, Calendar, MapPin, Globe } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { AlMamouraLogo } from './AlMamouraLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { FESTIVAL_DATES, FESTIVAL_LOCATION } from '../data/festivalData';

export const HomeView: React.FC = () => {
  const { setActiveTab, films, totalVotesCastGlobal, totalFestivalRevenue, setFilmToVoteFor, setIsVoteModalOpen, isLoadingFilms } =
    useFestival();

  const featuredFilm = films[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-28 text-[#111111]">
      {/* Cinematic Hero Header */}
      <section className="relative bg-[#111111] text-[#FAF8F5] pt-12 pb-16 px-5 overflow-hidden border-b border-[#A3792C]/20">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A3792C]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6 text-center">
          {/* Festival Logo */}
          <div className="flex justify-center">
            <AlMamouraLogo variant="white" size="hero" showSubtitle={true} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-[#C59B3F]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official 2026 Festival Voting Platform</span>
            </div>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal">
              Empowering visionary filmmakers from the Arab world and global cinema. Your paid votes determine the festival winners.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C59B3F]" />
                {FESTIVAL_DATES}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C59B3F]" />
                {FESTIVAL_LOCATION}
              </span>
            </div>
          </div>

          {/* Quick CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('vote')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#C59B3F] hover:bg-[#b08732] active:scale-95 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#A3792C]/20 transition cursor-pointer"
            >
              <Star className="w-4 h-4 fill-black" />
              <span>Cast Paid Vote &rarr;</span>
            </button>

            <button
              onClick={() => setActiveTab('browse')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#FAF8F5] font-bold text-sm flex items-center justify-center gap-2 border border-white/10 transition"
            >
              <FilmIcon className="w-4 h-4 text-[#C59B3F]" />
              <span>Browse 2026 Nominees</span>
            </button>
          </div>

          <div className="pt-2 flex justify-center">
            <PWAInstallButton variant="button" />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 -mt-6 space-y-6">
        {/* Real-time Ticker Metrics */}
        <div className="grid grid-cols-3 gap-2.5 bg-white rounded-3xl p-4 shadow-md border border-[#E8E3DA]">
          <div className="text-center p-2">
            <span className="text-[10px] sm:text-xs text-neutral-400 uppercase font-bold block">
              Total Votes Cast
            </span>
            <span className="text-lg sm:text-2xl font-black text-[#111111]">
              {totalVotesCastGlobal.toLocaleString()}
            </span>
          </div>

          <div className="text-center p-2 border-x border-[#E8E3DA]">
            <span className="text-[10px] sm:text-xs text-neutral-400 uppercase font-bold block">
              Competing Films
            </span>
            <span className="text-lg sm:text-2xl font-black text-[#A3792C]">
              {isLoadingFilms && films.length === 0 ? '2,634' : films.length.toLocaleString()} Official
            </span>
          </div>

          <div className="text-center p-2">
            <span className="text-[10px] sm:text-xs text-neutral-400 uppercase font-bold block">
              Secure Gateway
            </span>
            <span className="text-lg sm:text-2xl font-black text-emerald-700">
              Ziina UAE
            </span>
          </div>
        </div>

        {/* Spotlight Skeleton when loading */}
        {!featuredFilm && isLoadingFilms && (
          <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E3DA] p-8 animate-pulse text-center space-y-3">
            <div className="h-44 bg-neutral-200 rounded-2xl" />
            <div className="h-5 bg-neutral-200 rounded w-1/3 mx-auto" />
            <div className="h-3 bg-neutral-100 rounded w-1/2 mx-auto" />
          </div>
        )}

        {/* Spotlight Nominee Card */}
        {featuredFilm && (
          <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E3DA] shadow-xs">
            <div className="relative h-56 sm:h-72 bg-neutral-900">
              <img
                src={featuredFilm.bannerUrl}
                alt={featuredFilm.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-[#C59B3F] text-black font-extrabold text-[11px] uppercase tracking-wider shadow-md">
                  Festival Spotlight
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs text-[#C59B3F] font-bold uppercase tracking-wider">
                  {featuredFilm.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold mt-0.5 leading-snug">
                  {featuredFilm.title}
                </h3>
                <p className="text-xs text-neutral-300 font-arabic font-medium">
                  {featuredFilm.titleAr} &bull; Dir. {featuredFilm.director} ({featuredFilm.country})
                </p>
              </div>
            </div>

            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-600 max-w-lg leading-relaxed">
                {featuredFilm.synopsis}
              </p>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setFilmToVoteFor(featuredFilm);
                    setIsVoteModalOpen(true);
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#202024] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-[#C59B3F] fill-[#C59B3F]" />
                  <span>Vote Nominee</span>
                </button>

                <button
                  onClick={() => setActiveTab('results')}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E3DA] text-xs font-bold text-neutral-800 hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Live Standings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Official Paid Voting */}
          <div
            onClick={() => setActiveTab('vote')}
            className="p-5 rounded-3xl bg-white border border-[#E8E3DA] shadow-xs hover:border-[#A3792C] transition cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center group-hover:bg-[#A3792C] transition">
              <Ticket className="w-5 h-5 text-[#C59B3F] group-hover:text-white" />
            </div>
            <h4 className="text-base font-extrabold text-[#111111]">Official Paid Voting</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Every vote is a direct paid order via Ziina. Select votes number (1, 5, 10 or custom) and pay directly.
            </p>
            <span className="text-xs font-bold text-[#A3792C] flex items-center gap-1">
              Cast your vote &rarr;
            </span>
          </div>

          {/* Card 2: Real-time Results */}
          <div
            onClick={() => setActiveTab('results')}
            className="p-5 rounded-3xl bg-white border border-[#E8E3DA] shadow-xs hover:border-[#A3792C] transition cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center group-hover:bg-[#A3792C] transition">
              <Trophy className="w-5 h-5 text-[#C59B3F] group-hover:text-white" />
            </div>
            <h4 className="text-base font-extrabold text-[#111111]">Live Results Tracking</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Watch real-time nominee standing shifts, category vote velocity, and verifiable audit records updated live.
            </p>
            <span className="text-xs font-bold text-[#A3792C] flex items-center gap-1">
              View live standings &rarr;
            </span>
          </div>

          {/* Card 3: Ziina Payment Security */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E3DA] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#C59B3F]" />
            </div>
            <h4 className="text-base font-extrabold text-[#111111]">Ziina UAE Gateway</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Seamless 1-tap Apple Pay, UAE local cards, and international checkout with instant vote wallet credit.
            </p>
            <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
              Bank-grade security &bull; 0% voter fee
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
