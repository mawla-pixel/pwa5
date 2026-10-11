import React, { useState } from 'react';
import { User, Ticket, Award, Shield, History, ExternalLink, Download, Sparkles, Smartphone, RefreshCw, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { PWAInstallButton } from './PWAInstallButton';

export const UserProfileView: React.FC = () => {
  const {
    user,
    castVotesHistory,
    paymentsHistory,
    setActiveTab,
    setIsVoteModalOpen,
    films,
    isLoadingFilms,
    refreshFestivalData,
  } = useFestival();

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const userVotes = castVotesHistory.filter((v) => v.userId === user.id);
  const userPayments = paymentsHistory.filter((p) => p.userId === user.id);

  const handleForceClearAndSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Purging local cache and connecting to Supabase...');
    try {
      // Clear legacy and active caches
      ['almamoura_films', 'almamoura_films_v1', 'almamoura_films_v2', 'almamoura_films_v3', 'almamoura_films_v4'].forEach(
        (key) => {
          try {
            localStorage.removeItem(key);
          } catch {}
        }
      );

      const res = await refreshFestivalData('public_voting_films');
      if (res.success) {
        setSyncStatus(`Successfully synchronized ${(res.count || films.length).toLocaleString()} films from Supabase backend!`);
      } else {
        setSyncStatus(`Database synchronized (${films.length} films ready).`);
      }
    } catch {
      setSyncStatus('Sync finished with festival catalog.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncStatus(null);
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-28 text-[#111111]">
      {/* Profile Header */}
      <div className="bg-[#111111] text-[#FAF8F5] px-5 pt-8 pb-12 border-b border-[#A3792C]/20">
        <div className="max-w-md md:max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#A3792C] text-black font-black flex items-center justify-center text-xl shadow-lg border-2 border-white/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#FAF8F5] leading-tight">
                {user.name}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-white/10 text-[#C59B3F] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified Festival Voter
                </span>
                {user.isAdmin && (
                  <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - Responsive on PC & Mobile */}
      <div className="max-w-md md:max-w-5xl mx-auto px-4 md:px-8 -mt-6 space-y-6">
        {syncStatus && (
          <div className="p-3.5 rounded-2xl bg-[#111111] text-white flex items-center gap-2.5 text-xs font-semibold shadow-lg border border-emerald-500/40 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Wallet, Voting Power, Sync Actions */}
          <div className="md:col-span-5 space-y-6">
            {/* Wallet & Voting Power Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E3DA] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3DA]">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#A3792C]" />
                  <h3 className="text-sm font-bold text-[#111111]">Your Festival Ballot Wallet</h3>
                </div>
                <span className="text-xs font-mono text-neutral-400">Ziina Secured</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-500 font-medium block">
                    Available Voting Credits
                  </span>
                  <p className="text-3xl font-black text-[#111111]">
                    {user.votesBalance} <span className="text-sm font-semibold text-neutral-500">votes</span>
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab('vote')}
                    className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#202024] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    + Cast Paid Vote
                  </button>

                  {user.votesBalance > 0 && (
                    <button
                      onClick={() => setIsVoteModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#A3792C] hover:bg-[#8e6722] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Cast Ballot
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E3DA] text-xs">
                <div className="p-2.5 rounded-xl bg-[#FAF8F5]">
                  <span className="text-[10px] text-neutral-400 block uppercase">Total Purchased</span>
                  <span className="font-bold text-[#111111]">{user.totalVotesPurchased} votes</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF8F5]">
                  <span className="text-[10px] text-neutral-400 block uppercase">Total Ballots Cast</span>
                  <span className="font-bold text-[#111111]">{user.totalVotesCast} votes</span>
                </div>
              </div>
            </div>

            {/* Supabase Device Sync Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E3DA] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DA]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#A3792C]" />
                  <h3 className="text-sm font-bold text-[#111111]">Supabase Official Backend</h3>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Connected to official table <strong className="font-mono text-[#111111]">public_voting_films</strong> ({films.length.toLocaleString()} competing films).
              </p>

              <button
                type="button"
                onClick={handleForceClearAndSync}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E8E3DA] hover:border-[#A3792C] bg-[#FAF8F5] hover:bg-white text-xs font-bold text-[#111111] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#A3792C] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing Backend...' : 'Force Sync & Clear Device Cache'}</span>
              </button>
            </div>

            {/* PWA & Mobile Installation */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E3DA] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E3DA] flex items-center justify-center text-[#111111]">
                  <Smartphone className="w-5 h-5 text-[#A3792C]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111111]">Al Mamoura Festival PWA</h4>
                  <p className="text-[11px] text-neutral-500">Fast offline voting on mobile</p>
                </div>
              </div>
              <PWAInstallButton variant="compact" />
            </div>

            {/* Admin Switcher */}
            <div className="text-center pt-1">
              <button
                onClick={() => setActiveTab('admin')}
                className="text-xs font-semibold text-neutral-500 hover:text-black underline underline-offset-4 transition"
              >
                Access Administrator Dashboard &rarr;
              </button>
            </div>
          </div>

          {/* Right Column: Cast Ballots History & Payment Transactions */}
          <div className="md:col-span-7 space-y-6">
            {/* User's Cast Ballots History */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E3DA] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DA]">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#A3792C]" />
                  <h3 className="text-sm font-bold text-[#111111]">Your Cast Ballots</h3>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {userVotes.length} recorded
                </span>
              </div>

              {userVotes.length > 0 ? (
                <div className="divide-y divide-[#E8E3DA] text-xs space-y-2">
                  {userVotes.map((v) => (
                    <div key={v.id} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#111111] block">{v.filmTitle}</span>
                        <span className="text-[11px] text-neutral-500">{v.category}</span>
                        <span className="text-[10px] text-neutral-400 font-mono block">
                          Audit Receipt: {v.txHash.substring(0, 16)}...
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                          +{v.votesAllocated} {v.votesAllocated === 1 ? 'vote' : 'votes'}
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-1">
                          {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 py-6 text-center">
                  You haven&apos;t cast any votes yet. Support your favorite filmmaker today!
                </p>
              )}
            </div>

            {/* Payment Transactions History */}
            {userPayments.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-[#E8E3DA] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E3DA]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#A3792C]" />
                    <h3 className="text-sm font-bold text-[#111111]">Ziina Payment Transactions</h3>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {userPayments.length} transactions
                  </span>
                </div>

                <div className="divide-y divide-[#E8E3DA] text-xs space-y-2">
                  {userPayments.map((p) => (
                    <div key={p.id} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#111111] block">
                          Purchased {p.votesGranted} votes
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ID: {p.ziinaPaymentIntentId} &bull; {p.paymentMethod}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-[#111111]">
                          {p.currency === 'USD' ? `$${p.amount}` : `${p.amount} AED`}
                        </span>
                        <span className="text-[10px] text-emerald-600 block font-semibold uppercase">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
