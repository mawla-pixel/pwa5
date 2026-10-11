import React, { useState } from 'react';
import { ArrowLeft, Star, Lock, ShieldCheck, Sparkles, Check, ChevronRight } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { AlMamouraLogo } from './AlMamouraLogo';
import { SearchableFilmPicker } from './SearchableFilmPicker';
import { VoteOrder } from '../types';

export const VotingBundlesView: React.FC = () => {
  const {
    films,
    filmToVoteFor,
    setFilmToVoteFor,
    currency,
    setCurrency,
    pricePerVoteAED,
    pricePerVoteUSD,
    setActiveTab,
    setIsZiinaModalOpen,
    setVoteOrderToPay,
  } = useFestival();

  const [selectedFilmId, setSelectedFilmId] = useState<string>(() => {
    return filmToVoteFor?.id || films[0]?.id || '';
  });
  const [votesCount, setVotesCount] = useState<number>(5);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  // Sync if filmToVoteFor changed externally or when films load from Supabase
  React.useEffect(() => {
    if (filmToVoteFor) {
      setSelectedFilmId(filmToVoteFor.id);
    } else if (!selectedFilmId && films.length > 0) {
      setSelectedFilmId(films[0].id);
    }
  }, [filmToVoteFor, selectedFilmId, films]);

  const currentFilm = films.find((f) => f.id === selectedFilmId) || films[0];

  const unitPrice = currency === 'USD' ? pricePerVoteUSD : pricePerVoteAED;
  const totalPrice = Number((votesCount * unitPrice).toFixed(2));
  const priceDisplay = currency === 'USD' ? `$${totalPrice}` : `${totalPrice} AED`;
  const unitPriceDisplay = currency === 'USD' ? `$${pricePerVoteUSD}` : `${pricePerVoteAED} AED`;

  const handleSelectCount = (count: number) => {
    setVotesCount(Math.max(1, count));
    setCustomInputOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customInputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setVotesCount(parsed);
      setCustomInputOpen(false);
      setCustomInputValue('');
    }
  };

  const handleGoToPay = () => {
    if (!currentFilm) return;

    const voteOrder: VoteOrder = {
      filmId: currentFilm.id,
      filmTitle: currentFilm.title,
      filmTitleAr: currentFilm.titleAr,
      category: currentFilm.category,
      posterUrl: currentFilm.posterUrl,
      votesCount,
      unitPriceAED: pricePerVoteAED,
      unitPriceUSD: pricePerVoteUSD,
      amountAED: Number((votesCount * pricePerVoteAED).toFixed(2)),
      amountUSD: Number((votesCount * pricePerVoteUSD).toFixed(2)),
      currency,
      totalPrice,
    };

    setVoteOrderToPay(voteOrder);
    setIsZiinaModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-28 text-[#111111]">
      {/* Mobile-Only Subheader (hidden on Desktop PC where TopNavBar is present) */}
      <header className="md:hidden sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E3DA] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveTab('home')}
            aria-label="Go Back"
            className="w-10 h-10 rounded-full bg-white border border-[#E8E3DA] flex items-center justify-center text-[#111111] shadow-xs hover:bg-[#F3EFEA] transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Centered Al Mamoura Logo */}
          <div className="flex flex-col items-center">
            <AlMamouraLogo variant="dark" size="sm" headerMode={true} />
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center rounded-full bg-white border border-[#E8E3DA] p-0.5 shadow-xs">
            <button
              onClick={() => setCurrency('AED')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                currency === 'AED'
                  ? 'bg-[#A3792C] text-white'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              AED
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                currency === 'USD'
                  ? 'bg-[#111111] text-[#FAF8F5]'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              USD
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Responsive container on PC & Mobile */}
      <main className="max-w-md md:max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-6 md:space-y-8">
        {/* Hero Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#111111] flex items-center justify-center shadow-lg shadow-black/10">
              <Star className="w-6 h-6 text-[#C59B3F] fill-[#C59B3F]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E3DA] text-[11px] font-bold text-[#A3792C] shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A3792C]" />
              <span>Official 2026 Ballot</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#111111]">
            Official Paid Voting
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal max-w-2xl">
            Every vote is an authenticated, paid order directly logged in the Al Mamoura 2026 festival ledger. Select your nominee film, choose the number of votes, and proceed to instant secure payment.
          </p>
        </div>

        {/* Responsive Layout Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Left Column: Film Selection & Detailed Nominee Showcase */}
          <div className="md:col-span-5 space-y-4">
            {/* Step 1: Searchable Film Picker */}
            <SearchableFilmPicker
              label="Step 1 • Select Film Nominee"
              selectedFilmId={selectedFilmId}
              onSelectFilm={(f) => {
                setSelectedFilmId(f.id);
                setFilmToVoteFor(f);
              }}
            />

            {/* Film Highlight Showcase Card */}
            {currentFilm && (
              <div className="bg-white rounded-3xl border border-[#E8E3DA] overflow-hidden shadow-xs space-y-3">
                <div className="relative h-48 sm:h-56 bg-neutral-900">
                  <img
                    src={currentFilm.bannerUrl || currentFilm.posterUrl}
                    alt={currentFilm.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C59B3F] text-black font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                      {currentFilm.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base sm:text-lg font-extrabold leading-tight">
                      {currentFilm.title}
                    </h3>
                    {currentFilm.titleAr && (
                      <p className="text-xs text-neutral-300 font-arabic font-medium truncate">
                        {currentFilm.titleAr}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <span>Director: <strong className="text-[#111111]">{currentFilm.director}</strong></span>
                    <span>{currentFilm.country}</span>
                  </div>

                  {currentFilm.synopsis && (
                    <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed">
                      {currentFilm.synopsis}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#E8E3DA] flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Current Standing:</span>
                    <span className="font-extrabold text-[#111111] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E8E3DA]">
                      {currentFilm.votesCount.toLocaleString()} votes
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Vote Quantity, Pricing, and Checkout */}
          <div className="md:col-span-7 space-y-5">
            {/* Step 2: Press Votes Number */}
            <div className="space-y-3 bg-white p-5 rounded-3xl border border-[#E8E3DA] shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Step 2 &bull; Press Number of Votes
                </h2>
                <span className="text-xs font-bold text-[#A3792C]">
                  {unitPriceDisplay} / vote
                </span>
              </div>

              {/* Preset Buttons Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5, 10, 20, 50, 100].map((num) => {
                  const isSelected = votesCount === num && !customInputOpen;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSelectCount(num)}
                      className={`py-3 px-2 rounded-2xl border transition cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#111111] text-white border-black shadow-md ring-2 ring-[#C59B3F]'
                          : 'bg-[#FAF8F5] text-neutral-800 border-[#E8E3DA] hover:bg-neutral-100'
                      }`}
                    >
                      <span className="text-base font-black leading-none">{num}</span>
                      <span className="text-[10px] font-semibold opacity-75 mt-0.5">
                        {num === 1 ? 'Vote' : 'Votes'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Stepper + Custom Number option */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setVotesCount((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg hover:bg-white transition cursor-pointer"
                    aria-label="Decrease votes"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-black text-base text-[#111111]">
                    {votesCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVotesCount((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg hover:bg-white transition cursor-pointer"
                    aria-label="Increase votes"
                  >
                    +
                  </button>
                </div>

                {!customInputOpen ? (
                  <button
                    type="button"
                    onClick={() => setCustomInputOpen(true)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] hover:border-[#A3792C] text-xs font-bold text-neutral-600 transition text-center cursor-pointer"
                  >
                    Enter custom amount &rarr;
                  </button>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="flex-1 flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      autoFocus
                      value={customInputValue}
                      onChange={(e) => setCustomInputValue(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2 rounded-2xl border border-[#A3792C] bg-white text-xs font-bold text-[#111111] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-2xl bg-[#111111] text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Set
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Step 3: Order Breakdown */}
            <div className="rounded-3xl bg-white border border-[#E8E3DA] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Nominee Film</span>
                <span className="font-bold text-[#111111] truncate max-w-[240px]">
                  {currentFilm?.title}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Votes to Allocate</span>
                <span className="font-bold text-[#111111]">
                  {votesCount} {votesCount === 1 ? 'Official Vote' : 'Official Votes'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Per-Vote Rate</span>
                <span className="text-neutral-700 font-mono text-[11px]">
                  {unitPriceDisplay}
                </span>
              </div>

              <div className="h-px bg-[#E8E3DA] w-full" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#111111] block">Total to Pay</span>
                  <span className="text-[10px] text-neutral-400">Direct paid order &bull; Ziina UAE Gateway</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
                    {priceDisplay}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 4: Pay with Ziina Button */}
            <button
              onClick={handleGoToPay}
              className="w-full rounded-2xl bg-[#111111] hover:bg-[#202024] active:scale-[0.99] text-[#FAF8F5] py-4 px-6 flex items-center justify-center gap-2 text-sm sm:text-base font-bold transition shadow-lg shadow-black/15 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#C59B3F] stroke-[2.2]" />
              <span>Pay with Ziina {priceDisplay} &bull; Cast {votesCount} {votesCount === 1 ? 'Vote' : 'Votes'}</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Ziina Trust Footer */}
            <div className="flex flex-col items-center justify-center space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#A3792C]" />
                <span>Exclusively processed by <strong className="text-[#111111] font-bold">Ziina Payment Gateway</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <span>Apple Pay</span>
                <span>&bull;</span>
                <span>Visa &amp; Mastercard</span>
                <span>&bull;</span>
                <span className="text-emerald-700 font-semibold">Instant Ballot Authorization</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 text-center leading-relaxed px-4 pt-1">
              Votes are authenticated official ballots directly logged in the festival audit ledger for Al Mamoura 2026.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
