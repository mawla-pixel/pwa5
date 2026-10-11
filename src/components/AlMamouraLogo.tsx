import React, { useState } from 'react';

interface LogoProps {
  variant?: 'dark' | 'white'; // 'dark' for light bg, 'white' for dark bg
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  headerMode?: boolean; // When true, matches Screen 7 top header
  className?: string;
}

const SUPABASE_BUCKET_BASE = 'https://cbksbxmzeqefbdqzbprn.supabase.co/storage/v1/object/public/posters';
const REMOTE_WHITE_LOGO = `${SUPABASE_BUCKET_BASE}/Almamoura%20festival%20logo%20white%20logo.png`;
const REMOTE_DARK_LOGO = `${SUPABASE_BUCKET_BASE}/Almamoura%20festival%20logo%20bg%20(Dark).png`;

export const AlMamouraLogo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 'md',
  headerMode = false,
  className = '',
}) => {
  const isDark = variant === 'dark';
  const [triedRemote, setTriedRemote] = useState(false);

  // Use the exact Supabase bucket logo URL requested by user as primary source:
  // https://cbksbxmzeqefbdqzbprn.supabase.co/storage/v1/object/public/posters/Almamoura%20festival%20logo%20white%20logo.png
  const supabaseLogoUrl = isDark ? REMOTE_DARK_LOGO : REMOTE_WHITE_LOGO;
  const localFallback = isDark ? '/almamoura-logo-dark-trimmed.png' : '/almamoura-logo-white-trimmed.png';

  const currentSrc = triedRemote ? localFallback : supabaseLogoUrl;

  // Header Mode for Screen 7 top navigation bar
  if (headerMode) {
    return (
      <div className={`flex flex-col items-center justify-center select-none ${className}`}>
        <img
          src={currentSrc}
          onError={() => {
            if (!triedRemote) setTriedRemote(true);
          }}
          alt="Al Mamoura Film Festival"
          className="h-9 sm:h-11 w-auto max-w-[190px] object-contain transition-all"
          loading="eager"
        />
      </div>
    );
  }

  // Size classes for standard logo display
  const sizeClasses = {
    xs: 'h-7 sm:h-8 max-w-[120px]',
    sm: 'h-10 sm:h-12 max-w-[160px]',
    md: 'h-16 sm:h-20 max-w-[240px]',
    lg: 'h-24 sm:h-28 max-w-[320px]',
    hero: 'h-28 sm:h-36 md:h-44 max-w-[420px]',
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src={currentSrc}
        onError={() => {
          if (!triedRemote) setTriedRemote(true);
        }}
        alt="Al Mamoura Film Festival"
        className={`${sizeClasses[size]} w-auto object-contain transition-all hover:scale-[1.01]`}
        loading="eager"
      />
    </div>
  );
};
