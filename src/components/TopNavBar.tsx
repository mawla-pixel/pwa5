import React from 'react';
import { Home, Film, Star, BarChart2, User, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { AlMamouraLogo } from './AlMamouraLogo';

export const TopNavBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    user,
    films,
    isLoadingFilms,
    currency,
    setCurrency,
    refreshFestivalData,
  } = useFestival();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'browse' as const, label: 'Browse Nominees', icon: Film },
    { id: 'vote' as const, label: 'Cast Paid Vote', icon: Star, highlight: true },
    { id: 'results' as const, label: 'Live Standings', icon: BarChart2 },
    { id: 'profile' as const, label: 'Voter Profile', icon: User },
  ];

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await refreshFestivalData('public_voting_films');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-[#A3792C]/25 text-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between gap-6">
        {/* Brand Logo & Festival Tag */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Go to Home"
        >
          <AlMamouraLogo variant="white" size="sm" headerMode={true} />
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Desktop Navigation" className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                    isActive
                      ? 'bg-[#C59B3F] text-black shadow-[#A3792C]/30'
                      : 'bg-white/10 hover:bg-white/15 text-[#FAF8F5] border border-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'fill-black text-black' : 'text-[#C59B3F]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C59B3F]' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Currency Toggle & Voter Wallet */}
        <div className="flex items-center gap-3">
          {/* Supabase Status Pill */}
          <div
            onClick={handleManualSync}
            title="Click to force-sync with Supabase database"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 cursor-pointer transition"
          >
            <Database className="w-3 h-3 text-[#C59B3F]" />
            <span className="font-mono">
              {isLoadingFilms && films.length === 0 ? 'Loading...' : `${films.length.toLocaleString()} films`}
            </span>
            <RefreshCw className={`w-3 h-3 text-neutral-400 ${isRefreshing ? 'animate-spin text-[#C59B3F]' : ''}`} />
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center rounded-lg bg-white/10 p-0.5 border border-white/10 text-xs font-bold">
            <button
              onClick={() => setCurrency('AED')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                currency === 'AED'
                  ? 'bg-[#C59B3F] text-black font-extrabold shadow-xs'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              AED
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                currency === 'USD'
                  ? 'bg-[#C59B3F] text-black font-extrabold shadow-xs'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              USD
            </button>
          </div>

          {/* User Voting Balance or Quick Vote Button */}
          {user.votesBalance > 0 ? (
            <button
              onClick={() => setActiveTab('vote')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/30 transition"
            >
              <Star className="w-3.5 h-3.5 text-[#C59B3F] fill-[#C59B3F]" />
              <span>{user.votesBalance} Credits</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('vote')}
              className="px-3.5 py-1.5 rounded-xl bg-[#C59B3F] hover:bg-[#b08732] active:scale-95 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-black" />
              <span>Vote</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
