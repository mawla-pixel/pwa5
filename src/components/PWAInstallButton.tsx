import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'badge' | 'button' | 'compact' }> = ({
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  if (installSuccess) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>Installed Successfully!</span>
      </div>
    );
  }

  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={handleInstallClick}
          aria-label="Install App"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111111] text-[#FAF8F5] text-xs font-medium hover:bg-[#A3792C] transition-colors shadow-sm"
        >
          <Download className="w-3 h-3 text-[#A3792C]" />
          <span>Install PWA</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] shadow-sm hover:bg-[#252528] active:scale-95 transition-all border border-[#FAF8F5]/10"
      >
        <Download className="w-3.5 h-3.5 text-[#C59B3F]" />
        <span>Install Festival App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-full border border-[#D5CEBF] bg-[#FAF8F5] text-xs font-semibold text-[#111111] hover:bg-[#F3EFEA] transition shadow-xs ${
            variant === 'compact' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#A3792C]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-200/50"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center text-[#C59B3F] font-bold text-lg shadow-sm">
                  م
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Add to Home Screen</h3>
                  <p className="text-xs text-neutral-500">Al Mamoura Film Festival PWA</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-neutral-700 bg-white/70 rounded-xl p-4 border border-[#E8E3DA]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button <span className="text-[#A3792C] font-mono">⎋</span> at the bottom of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    2
                  </span>
                  <p>
                    Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    3
                  </span>
                  <p>
                    Tap <strong>Add</strong> on the top right. Access live voting & results anytime!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#111111] py-2.5 text-xs font-semibold tracking-wide text-white hover:bg-[#252528] transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
