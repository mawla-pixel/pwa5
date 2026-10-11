import React from 'react';
import { Home, Film, Star, User, BarChart2 } from 'lucide-react';
import { useFestival } from '../context/FestivalContext';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, user } = useFestival();

  const navItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'browse' as const,
      label: 'Browse',
      icon: Film,
    },
    {
      id: 'vote' as const,
      label: 'Vote',
      icon: Star,
      isSpecial: true,
    },
    {
      id: 'results' as const,
      label: 'Results',
      icon: BarChart2,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Festival Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E3DA] py-2 px-3 shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isSpecial) {
            // Screen 7 highlighted Vote button
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center transition group relative"
                aria-label="Vote"
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#111111] text-[#FAF8F5] shadow-md shadow-black/20 ring-2 ring-[#C59B3F]'
                      : 'bg-[#FAF8F5] text-neutral-600 hover:bg-neutral-100 border border-[#E8E3DA]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-[#C59B3F] fill-[#C59B3F]' : 'text-neutral-700'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 transition ${
                    isActive ? 'text-[#111111]' : 'text-neutral-500'
                  }`}
                >
                  {item.label}
                </span>
                {user.votesBalance > 0 && !isActive && (
                  <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-[#A3792C]" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center py-1 px-2 transition text-neutral-500 hover:text-black group"
              aria-label={item.label}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isActive ? 'text-[#111111] bg-[#FAF8F5]' : 'group-hover:text-black'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.4] text-[#111111] scale-110' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 transition ${
                  isActive ? 'font-extrabold text-[#111111]' : 'font-medium text-neutral-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
