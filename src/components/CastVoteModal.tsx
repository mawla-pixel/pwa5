import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, ShieldCheck, Lock, Sparkles, CreditCard, ChevronRight } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { SearchableFilmPicker } from './SearchableFilmPicker';
import { VoteOrder } from '../types';

export const CastVoteModal: React.FC = () => {
  const {
    isVoteModalOpen,
    setIsVoteModalOpen,
    filmToVoteFor,
    setFilmToVoteFor,
    films,
    user,
    currency,
    setCurrency,
    pricePerVoteAED,
    pricePerVoteUSD,
    setVoteOrderToPay,
    setIsZiinaModalOpen,
    handleCastVote,
    setActiveTab,
  } = useFestival();

  const [selectedFilmId, setSelectedFilmId] = useState<string>(filmToVoteFor?.id || films[0]?.id || '');
  const [votesCount, setVotesCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  // Sync if opened with a specific film or when films load
  useEffect(() => {
    if (filmToVoteFor) {
      setSelectedFilmId(filmToVoteFor.id);
    } else if (!selectedFilmId && films.length > 0) {
      setSelectedFilmId(films[0].id);
    }
  }, [filmToVoteFor, selectedFilmId, films]);

  if (!isVoteModalOpen) return null;

  const currentFilm = films.find((f) => f.id === selectedFilmId) || films[0];

  const unitPrice = currency === 'USD' ? pricePerVoteUSD : pricePerVoteAED;
  const totalPrice = Number((votesCount * unitPrice).toFixed(2));
  const priceDisplay = currency === 'USD' ? `$${totalPrice}` : `${totalPrice} AED`;
  const unitPriceDisplay = currency === 'USD' ? `$${pricePerVoteUSD}` : `${pricePerVoteAED} AED`;

  const handleClose = () => {
    setIsVoteModalOpen(false);
    setFilmToVoteFor(null);
    setVotesCount(1);
    setCustomInputOpen(false);
  };

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

  // Direct "Go to Pay" action
  const handleProceedToPay = () => {
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
    setIsVoteModalOpen(false);
    setIsZiinaModalOpen(true);
  };

  // Allow existing legacy balance to cast directly if voter already possesses credits
  const handleUseExistingCredits = async () => {
    if (!currentFilm || user.votesBalance < votesCount) return;
    setIsSubmitting(true);
    await handleCastVote(currentFilm.id, votesCount);
    setIsSubmitting(false);
    handleClose();
    setActiveTab('results');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF8F5] border border-[#E8E3DA] shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-[#111111] px-6 py-4 text-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#A3792C] flex items-center justify-center text-white shadow-xs">
              <Star className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">Cast Official Paid Ballot</h3>
              <p className="text-[10px] text-neutral-400">Al Mamoura Film Festival 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency toggle */}
            <div className="flex items-center rounded-full bg-white/10 p-0.5 border border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => setCurrency('AED')}
                className={`px-2 py-0.5 rounded-full font-bold transition ${
                  currency === 'AED' ? 'bg-[#A3792C] text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                AED
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.5 rounded-full font-bold transition ${
                  currency === 'USD' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                USD
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Film Selection via performant SearchableFilmPicker */}
          <SearchableFilmPicker
            label="Nominee Film"
            selectedFilmId={selectedFilmId}
            onSelectFilm={(f) => {
              setSelectedFilmId(f.id);
              setFilmToVoteFor(f);
            }}
          />

          {/* Selected Film Preview Card */}
          {currentFilm && (
            <div className="flex gap-3 bg-white p-3 rounded-2xl border border-[#E8E3DA] shadow-xs">
              <img
                src={currentFilm.posterUrl}
                alt={currentFilm.title}
                className="w-16 h-22 object-cover rounded-xl shrink-0 border border-neutral-100"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#A3792C] uppercase tracking-wider block truncate">
                  {currentFilm.category}
                </span>
                <h4 className="text-sm font-bold text-[#111111] leading-tight truncate">
                  {currentFilm.title}
                </h4>
                {currentFilm.titleAr && (
                  <p className="text-xs text-neutral-500 font-arabic truncate">{currentFilm.titleAr}</p>
                )}
                <p className="text-[11px] text-neutral-500 truncate">
                  Dir. {currentFilm.director} &bull; {currentFilm.country}
                </p>
                <div className="pt-0.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Current standing: <strong>{currentFilm.votesCount.toLocaleString()} votes</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Press Votes Number */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111111]">
                Press Number of Votes to Cast
              </label>
              <span className="text-[11px] text-[#A3792C] font-semibold">
                Rate: {unitPriceDisplay} / vote
              </span>
            </div>

            {/* Quick Button Selector: 1, 2, 3, 5, 10, 25 */}
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 5, 10, 25].map((num) => {
                const isSelected = votesCount === num && !customInputOpen;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSelectCount(num)}
                    className={`py-2.5 text-xs font-extrabold rounded-xl border transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#111111] text-white border-black shadow-md ring-2 ring-[#C59B3F]'
                        : 'bg-white text-neutral-800 border-[#E8E3DA] hover:bg-neutral-50 hover:border-neutral-400'
                    }`}
                  >
                    <span>{num}</span>
                    <span className="text-[9px] font-normal opacity-80">
                      {num === 1 ? 'vote' : 'votes'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stepper + Custom Number option */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center rounded-xl bg-white border border-[#E8E3DA] p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setVotesCount((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base hover:bg-neutral-100 transition"
                  aria-label="Decrease votes"
                >
                  -
                </button>
                <span className="w-12 text-center font-extrabold text-sm text-[#111111]">
                  {votesCount}
                </span>
                <button
                  type="button"
                  onClick={() => setVotesCount((prev) => prev + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base hover:bg-neutral-100 transition"
                  aria-label="Increase votes"
                >
                  +
                </button>
              </div>

              {!customInputOpen ? (
                <button
                  type="button"
                  onClick={() => setCustomInputOpen(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E8E3DA] hover:border-[#A3792C] text-xs font-semibold text-neutral-600 transition text-center"
                >
                  Type custom amount...
                </button>
              ) : (
                <form onSubmit={handleCustomSubmit} className="flex-1 flex gap-1">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    autoFocus
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#A3792C] bg-white text-xs font-bold text-[#111111] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold shrink-0"
                  >
                    Set
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Live Order Recap Box */}
          <div className="rounded-2xl bg-white border border-[#E8E3DA] p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Order item</span>
              <span className="font-bold text-[#111111]">
                {votesCount} {votesCount === 1 ? 'Official Vote' : 'Official Votes'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Calculation</span>
              <span className="text-neutral-600 font-mono text-[11px]">
                {votesCount} &times; {unitPriceDisplay}
              </span>
            </div>

            <div className="h-px bg-[#E8E3DA] w-full" />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#111111] block">Total to Pay</span>
                <span className="text-[10px] text-neutral-400">One-time paid order via Ziina</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#111111] tracking-tight">
                  {priceDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button: "Go to Pay" via Ziina */}
          <button
            onClick={handleProceedToPay}
            className="w-full py-4 rounded-2xl bg-[#111111] hover:bg-[#202024] active:scale-[0.99] text-white font-extrabold text-sm tracking-wide shadow-lg shadow-black/15 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-[#C59B3F]" />
            <span>Pay with Ziina {priceDisplay} &bull; {votesCount} {votesCount === 1 ? 'Vote' : 'Votes'}</span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          {/* Payment Trust Badge - Ziina Only Gateway */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-400 pt-0.5">
            <span className="font-bold text-[#A3792C]">Ziina Payment Gateway Only</span>
            <span>&bull;</span>
            <span>Apple Pay</span>
            <span>&bull;</span>
            <span>Visa &amp; Mastercard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
