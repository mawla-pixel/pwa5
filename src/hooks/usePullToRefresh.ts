import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<any>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

export interface PullToRefreshState {
  pullDistance: number;
  pullProgress: number; // 0 to 1+
  isPulling: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
  triggerRefresh: () => Promise<void>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  maxPull = 110,
  disabled = false,
}: UsePullToRefreshOptions): PullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isTracking = useRef(false);
  const hasTriggeredHaptic = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing || disabled) return;
    setIsRefreshing(true);
    setPullDistance(52); // hold indicator visible while loading

    try {
      await onRefreshRef.current();
    } catch (err) {
      console.warn('Pull-to-refresh execution error:', err);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [isRefreshing, disabled]);

  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      setIsPulling(false);
      setCanRefresh(false);
      return;
    }

    const isAtTop = () => {
      if (containerRef.current) {
        return containerRef.current.scrollTop <= 2 && (window.scrollY || document.documentElement.scrollTop || 0) <= 2;
      }
      return (window.scrollY || document.documentElement.scrollTop || 0) <= 2;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      if (isAtTop() && e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY;
        isTracking.current = true;
        hasTriggeredHaptic.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking.current || touchStartY.current === null || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const rawDelta = currentY - touchStartY.current;

      // Only handle downward swipe from the top
      if (rawDelta > 0 && isAtTop()) {
        // Logarithmic/damping resistance curve
        const damped = Math.min(maxPull, Math.pow(rawDelta, 0.82) * 1.4);
        setPullDistance(damped);
        setIsPulling(true);

        const ready = damped >= threshold;
        setCanRefresh(ready);

        // Tactile micro-haptic feedback on crossing threshold
        if (ready && !hasTriggeredHaptic.current) {
          hasTriggeredHaptic.current = true;
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(12);
            } catch (_) {}
          }
        } else if (!ready && hasTriggeredHaptic.current) {
          hasTriggeredHaptic.current = false;
        }

        // Prevent native rubberbanding or bounce only during intentional pull down
        if (damped > 30 && e.cancelable) {
          e.preventDefault();
        }
      } else if (rawDelta <= 0) {
        setPullDistance(0);
        setIsPulling(false);
        setCanRefresh(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!isTracking.current) return;
      isTracking.current = false;
      setIsPulling(false);
      touchStartY.current = null;

      if (canRefresh && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(52); // Hold visible during fetch
        try {
          await onRefreshRef.current();
        } catch (err) {
          console.warn('Error during pull refresh:', err);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          setCanRefresh(false);
          hasTriggeredHaptic.current = false;
        }
      } else {
        // Snap back
        setPullDistance(0);
        setCanRefresh(false);
      }
    };

    const handleTouchCancel = () => {
      isTracking.current = false;
      setIsPulling(false);
      touchStartY.current = null;
      setPullDistance(0);
      setCanRefresh(false);
    };

    const target = containerRef.current || window;
    target.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    target.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    target.addEventListener('touchend', handleTouchEnd as any, { passive: true });
    target.addEventListener('touchcancel', handleTouchCancel as any, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart as any);
      target.removeEventListener('touchmove', handleTouchMove as any);
      target.removeEventListener('touchend', handleTouchEnd as any);
      target.removeEventListener('touchcancel', handleTouchCancel as any);
    };
  }, [disabled, isRefreshing, canRefresh, threshold, maxPull]);

  const pullProgress = Math.min(pullDistance / threshold, 1.5);

  return {
    pullDistance,
    pullProgress,
    isPulling,
    isRefreshing,
    canRefresh,
    triggerRefresh,
    containerRef,
  };
}
