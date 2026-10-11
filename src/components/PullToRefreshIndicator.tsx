import React from 'react';
import { ArrowDown, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import { PullToRefreshState } from '../hooks/usePullToRefresh';

interface PullToRefreshIndicatorProps {
  state: PullToRefreshState;
  syncLabel?: string;
  sourceBadge?: string;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  state,
  syncLabel = 'Supabase Database',
  sourceBadge,
}) => {
  const { pullDistance, pullProgress, isPulling, isRefreshing, canRefresh } = state;

  // If completely at 0 and not refreshing, render invisible/collapsed
  if (pullDistance <= 0 && !isRefreshing) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-200 ease-out"
      style={{
        transform: `translateY(${Math.min(pullDistance, 70)}px)`,
      }}
    >
      <div className="bg-[#111111]/95 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-[#C59B3F]/40 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
        {/* Dynamic Icon */}
        <div className="relative w-6 h-6 flex items-center justify-center">
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 text-[#C59B3F] animate-spin" />
          ) : (
            <div
              className="transition-transform duration-200"
              style={{
                transform: canRefresh ? 'rotate(180deg)' : `rotate(${pullProgress * 180}deg)`,
              }}
            >
              <ArrowDown
                className={`w-4 h-4 transition-colors ${
                  canRefresh ? 'text-[#C59B3F]' : 'text-neutral-400'
                }`}
              />
            </div>
          )}

          {/* Glowing pulse ring if ready or refreshing */}
          {(canRefresh || isRefreshing) && (
            <span className="absolute inset-0 rounded-full border border-[#C59B3F] animate-ping opacity-30" />
          )}
        </div>

        {/* Dynamic Status Text */}
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-tight text-[#FAF8F5]">
            {isRefreshing
              ? `Syncing with ${syncLabel}...`
              : canRefresh
              ? `Release to sync ${syncLabel}`
              : `Pull down to refresh`}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
            <Database className="w-2.5 h-2.5 text-[#C59B3F]" />
            <span>{sourceBadge || 'Live festival data sync'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
