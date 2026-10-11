import React, { useState } from 'react';
import { X, Lock, CheckCircle2, CreditCard, Shield, AlertCircle, Loader2, Sparkles, ArrowRight, Star, Film as FilmIcon } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { createZiinaPaymentIntent, finalizeZiinaPayment } from '../lib/ziina';

export const ZiinaCheckoutModal: React.FC = () => {
  const {
    isZiinaModalOpen,
    setIsZiinaModalOpen,
    voteOrderToPay,
    setVoteOrderToPay,
    bundleToPurchase,
    currency,
    user,
    handlePaidVoteOrder,
    handlePurchaseVotes,
    setActiveTab,
    ziinaSettings,
  } = useFestival();

  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'card' | 'ziina_wallet'>('apple_pay');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('884');
  const [cardHolder, setCardHolder] = useState('Al Mamoura Film Patron');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedTxRef, setCompletedTxRef] = useState<string | null>(null);
  const [recordedTxHash, setRecordedTxHash] = useState<string | null>(null);

  if (!isZiinaModalOpen || (!voteOrderToPay && !bundleToPurchase)) return null;

  const votesCount = voteOrderToPay ? voteOrderToPay.votesCount : (bundleToPurchase?.votes || 1);
  const filmTitle = voteOrderToPay?.filmTitle;
  const filmPoster = voteOrderToPay?.posterUrl;
  const filmCategory = voteOrderToPay?.category;

  const price = voteOrderToPay
    ? (currency === 'USD' ? voteOrderToPay.amountUSD : voteOrderToPay.amountAED)
    : (bundleToPurchase ? (currency === 'USD' ? bundleToPurchase.priceUSD : bundleToPurchase.priceAED) : 0);

  const priceDisplay = currency === 'USD' ? `$${price}` : `${price} AED`;

  const handlePayNow = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    // Card details validation if Card method is selected
    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 13) {
        setErrorMsg('Please enter a valid 15 or 16-digit card number.');
        setIsProcessing(false);
        return;
      }
      if (!expiry || !expiry.includes('/') || expiry.replace(/\D/g, '').length < 4) {
        setErrorMsg('Please enter a valid card expiration date (MM/YY).');
        setIsProcessing(false);
        return;
      }
      if (!cvc || cvc.replace(/\D/g, '').length < 3) {
        setErrorMsg('Please enter a valid 3 or 4-digit CVC code.');
        setIsProcessing(false);
        return;
      }
      if (!cardHolder || cardHolder.trim().length < 2) {
        setErrorMsg('Please enter the name on the card.');
        setIsProcessing(false);
        return;
      }
    }

    try {
      // 1. Create Ziina Payment Intent
      const intent = await createZiinaPaymentIntent({
        amount: price,
        currency,
        bundleId: bundleToPurchase?.id,
        filmId: voteOrderToPay?.filmId,
        filmTitle: voteOrderToPay?.filmTitle,
        votes: votesCount,
        userEmail: user.email,
        userName: user.name,
      });

      // 2. Finalize payment directly in-app (avoids iframe crashes from external portal redirects)
      const result = await finalizeZiinaPayment(
        intent.paymentIntentId,
        {
          amount: price,
          currency,
          bundleId: bundleToPurchase?.id,
          filmId: voteOrderToPay?.filmId,
          filmTitle: voteOrderToPay?.filmTitle,
          votes: votesCount,
          userEmail: user.email,
          userName: user.name,
        },
        paymentMethod
      );

      if (result.success) {
        // 3. Complete direct paid vote order (or legacy purchase if bundle)
        if (voteOrderToPay) {
          const res = await handlePaidVoteOrder(voteOrderToPay, paymentMethod, result.paymentIntentId);
          if (res.txHash) {
            setRecordedTxHash(res.txHash);
          }
        } else if (bundleToPurchase) {
          await handlePurchaseVotes(bundleToPurchase, paymentMethod, result.paymentIntentId);
        }

        setCompletedTxRef(result.transactionRef);
        setIsSuccess(true);
      } else {
        setErrorMsg('Payment could not be completed. Please verify your card details.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ziina gateway temporarily unavailable';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsZiinaModalOpen(false);
    setVoteOrderToPay(null);
    setIsSuccess(false);
    setErrorMsg(null);
    setCompletedTxRef(null);
    setRecordedTxHash(null);
  };

  const handleViewResults = () => {
    handleClose();
    setActiveTab('results');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF8F5] border border-[#E8E3DA] shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-[#111111] px-6 py-4 text-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Ziina Distinctive Logo Monogram */}
            <div className="w-7 h-7 rounded-lg bg-[#C59B3F] text-black font-extrabold flex items-center justify-center text-xs tracking-tighter shadow-sm">
              Z
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide">Ziina Pay UAE</span>
                <span className="text-[9px] bg-white/20 text-neutral-200 px-1.5 py-0.2 rounded-full uppercase font-mono">
                  {ziinaSettings.isTestMode ? 'Test Mode' : 'Live Gateway'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">Merchant: Al Mamoura Cultural Festival</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {!isSuccess ? (
            <>
              {/* Paid Vote Order Recap */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E3DA] space-y-3 shadow-xs">
                {filmTitle && (
                  <div className="flex items-center gap-3 pb-3 border-b border-[#E8E3DA]">
                    {filmPoster ? (
                      <img
                        src={filmPoster}
                        alt={filmTitle}
                        className="w-12 h-16 object-cover rounded-lg border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-neutral-900 flex items-center justify-center text-white shrink-0">
                        <FilmIcon className="w-5 h-5 text-[#C59B3F]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[#A3792C] uppercase tracking-wider block truncate">
                        {filmCategory || 'Official Nominee'}
                      </span>
                      <h4 className="text-sm font-bold text-[#111111] leading-tight truncate">
                        {filmTitle}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Allocating <strong>{votesCount} {votesCount === 1 ? 'official vote' : 'official votes'}</strong>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-500 font-medium">Order Total</span>
                    <p className="text-xs text-neutral-400">
                      {votesCount} {votesCount === 1 ? 'vote' : 'votes'} &bull; Al Mamoura 2026
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#111111]">{priceDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods - Exclusively Ziina Gateway */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#111111]">
                    Payment Gateway: <span className="text-[#A3792C]">Ziina (Exclusive)</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Ziina Active &bull; 0% Fee
                  </span>
                </div>

                {/* Ziina Apple Pay Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-between border font-bold text-sm transition cursor-pointer ${
                    paymentMethod === 'apple_pay'
                      ? 'bg-black text-white border-black ring-2 ring-[#C59B3F] shadow-md'
                      : 'bg-neutral-900 text-white border-neutral-800 hover:bg-black'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none font-sans font-normal">&#63743;</span>
                    <span>Apple Pay via Ziina</span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider text-neutral-300">
                    1-Tap Instant
                  </span>
                </button>

                {/* Ziina Card Option (Visa / Mastercard) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full py-3 px-4 rounded-xl flex items-center justify-between border text-xs font-bold transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white border-[#111111] ring-2 ring-[#C59B3F] text-[#111111] shadow-xs'
                      : 'bg-white/80 border-[#E8E3DA] hover:bg-white text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#A3792C]" />
                    <span>Card via Ziina (Visa, Mastercard)</span>
                  </div>
                  <div className="flex gap-1 text-[10px] text-neutral-400 font-mono">
                    <span>AE &bull; GCC &bull; Global</span>
                  </div>
                </button>
              </div>

              {/* Card inputs if card selected */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 p-3.5 bg-white rounded-xl border border-[#E8E3DA] text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                      Card Number
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setCardNumber(formatted);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-xs focus:outline-none focus:border-[#A3792C]"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
                          const formatted = raw.length >= 3 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
                          setExpiry(formatted);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-xs focus:outline-none focus:border-[#A3792C]"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] font-mono text-xs focus:outline-none focus:border-[#A3792C]"
                        placeholder="CVC"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E3DA] bg-[#FAF8F5] text-xs focus:outline-none focus:border-[#A3792C]"
                      placeholder="Name on card"
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full py-4 px-4 rounded-2xl bg-[#111111] hover:bg-[#202024] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C59B3F]" />
                    <span>Processing with Ziina Secure...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#C59B3F]" />
                    <span>
                      Pay {priceDisplay} &bull; Cast {votesCount} {votesCount === 1 ? 'Vote' : 'Votes'}
                    </span>
                  </>
                )}
              </button>

              {/* Trust footer */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                <Shield className="w-3.5 h-3.5 text-[#A3792C]" />
                <span>PCI-DSS Level 1 &bull; End-to-end encrypted by Ziina UAE</span>
              </div>
            </>
          ) : (
            /* Success State - Ballot Recorded & Receipt */
            <div className="py-2 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#111111]">Vote Recorded & Paid!</h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Your official ballot is verified and logged directly into the Supabase festival audit ledger.
                </p>
              </div>

              {/* Receipt card */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E3DA] text-left text-xs space-y-2 shadow-xs">
                {filmTitle && (
                  <div className="flex justify-between pb-2 border-b border-[#E8E3DA]">
                    <span className="text-neutral-500">Nominee:</span>
                    <span className="font-extrabold text-[#111111] text-right truncate max-w-[200px]">{filmTitle}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Official Votes Cast:</span>
                  <span className="font-black text-[#A3792C]">+{votesCount} {votesCount === 1 ? 'Vote' : 'Votes'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Amount Paid:</span>
                  <span className="font-bold text-[#111111]">{priceDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Reference:</span>
                  <span className="font-mono font-bold text-[#111111]">{completedTxRef}</span>
                </div>
                {recordedTxHash && (
                  <div className="flex justify-between items-center pt-2 border-t border-[#E8E3DA]">
                    <span className="text-neutral-500 text-[10px]">Audit Hash:</span>
                    <span className="font-mono text-[10px] text-[#A3792C] truncate max-w-[170px]">
                      {recordedTxHash}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-neutral-400">Gateway:</span>
                  <span className="font-semibold text-neutral-700">Ziina UAE</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleViewResults}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#111111] hover:bg-[#202024] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#C59B3F]" />
                  <span>View Live Standings &rarr;</span>
                </button>

                <button
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-600 hover:text-black transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
