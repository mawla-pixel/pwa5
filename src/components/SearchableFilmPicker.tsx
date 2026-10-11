import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Film as FilmIcon } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';
import { Film } from '../types';

interface SearchableFilmPickerProps {
  selectedFilmId: string;
  onSelectFilm: (film: Film) => void;
  label?: string;
  className?: string;
}

export const SearchableFilmPicker: React.FC<SearchableFilmPickerProps> = ({
  selectedFilmId,
  onSelectFilm,
  label = 'Select Nominee Film',
  className = '',
}) => {
  const { films, categories } = useFestival();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const selectedFilm = useMemo(() => {
    return films.find((f) => f.id === selectedFilmId) || films[0];
  }, [films, selectedFilmId]);

  // Fast filtered list (capped at 30 items for maximum rendering performance on mobile)
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matches = films.filter((f) => {
      const matchCat = selectedCat === 'All' || f.category === selectedCat;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        (f.titleAr && f.titleAr.includes(q)) ||
        (f.director && f.director.toLowerCase().includes(q)) ||
        (f.country && f.country.toLowerCase().includes(q))
      );
    });
    return matches.slice(0, 30);
  }, [films, searchQuery, selectedCat]);

  const handleSelect = (film: Film) => {
    onSelectFilm(film);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
          <span>{label}</span>
          <span className="text-[10px] text-neutral-400 font-normal">
            {films.length.toLocaleString()} official nominees
          </span>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full p-2.5 sm:p-3 rounded-2xl border border-[#E8E3DA] bg-white text-left hover:border-[#A3792C] focus:outline-none focus:ring-2 focus:ring-[#A3792C]/20 shadow-xs transition flex items-center justify-between gap-3 cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedFilm?.posterUrl ? (
            <img
              src={selectedFilm.posterUrl}
              alt={selectedFilm.title}
              className="w-9 h-12 object-cover rounded-lg shrink-0 border border-neutral-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80';
              }}
            />
          ) : (
            <div className="w-9 h-12 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
              <FilmIcon className="w-4 h-4 text-neutral-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-[#A3792C] uppercase tracking-wider block truncate">
              {selectedFilm?.category || 'Festival Nominee'}
            </span>
            <p className="text-xs sm:text-sm font-bold text-[#111111] truncate group-hover:text-[#A3792C] transition">
              {selectedFilm?.title || 'Select a film'}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              Dir. {selectedFilm?.director || 'Unknown'} &bull; {selectedFilm?.country || 'International'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <span className="text-[11px] font-bold text-[#A3792C] hidden sm:inline">Change</span>
          <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E8E3DA] flex items-center justify-center text-neutral-500 group-hover:text-black">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Search & Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[82vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#E8E3DA] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E3DA] flex items-center justify-between bg-[#111111] text-[#FAF8F5]">
              <div>
                <h3 className="text-base font-extrabold text-[#FAF8F5]">Select Film Nominee</h3>
                <p className="text-[11px] text-neutral-400">
                  Search across {films.length.toLocaleString()} official festival films
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input & Category Filter */}
            <div className="p-3.5 space-y-2.5 bg-[#FAF8F5] border-b border-[#E8E3DA]">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, director, country..."
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white text-xs font-semibold border border-[#E8E3DA] focus:outline-none focus:border-[#A3792C] shadow-xs"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCat('All')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCat === 'All'
                      ? 'bg-[#111111] text-white'
                      : 'bg-white text-neutral-600 border border-[#E8E3DA] hover:bg-neutral-100'
                  }`}
                >
                  All ({films.length.toLocaleString()})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCat(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCat === c.id
                        ? 'bg-[#111111] text-white'
                        : 'bg-white text-neutral-600 border border-[#E8E3DA] hover:bg-neutral-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Film List */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2 divide-y divide-neutral-100">
              {filteredList.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  No nominee films found matching "{searchQuery}".
                </div>
              ) : (
                filteredList.map((f) => {
                  const isCurrent = f.id === selectedFilm?.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => handleSelect(f)}
                      className={`pt-2 first:pt-0 p-2 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#A3792C]/10 border border-[#A3792C]/30'
                          : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={f.posterUrl}
                          alt={f.title}
                          className="w-10 h-14 object-cover rounded-lg shrink-0 border border-neutral-100 bg-neutral-900"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span className="text-[10px] font-bold text-[#A3792C] uppercase tracking-wider block truncate">
                            {f.category}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-[#111111] truncate">
                            {f.title}
                          </p>
                          {f.titleAr && (
                            <p className="text-[11px] text-neutral-500 font-arabic truncate">
                              {f.titleAr}
                            </p>
                          )}
                          <p className="text-[10px] text-neutral-400 truncate">
                            Dir. {f.director} &bull; {f.country}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-[#C59B3F]" />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-[#A3792C] hover:underline px-2 py-1">
                            Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#FAF8F5] border-t border-[#E8E3DA] text-center text-[11px] text-neutral-500">
              Showing top {filteredList.length} matching films. Type in the search box to refine.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
