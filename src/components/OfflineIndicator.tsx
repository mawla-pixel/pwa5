import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline Mode"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-[#18181B] text-[#FAF8F5] border border-[#A3792C]/40 px-4 py-2.5 text-xs shadow-xl max-w-sm mx-auto"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-[#C59B3F] animate-pulse" />
        <span>Offline Mode &bull; Cached festival data active</span>
      </div>
      <span className="text-[10px] text-neutral-400">PWA Offline</span>
    </aside>
  );
};
