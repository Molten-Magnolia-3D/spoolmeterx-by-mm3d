import { useState, useRef, useCallback } from "react";

/**
 * Reusable pull-to-refresh hook.
 *
 * @param {() => Promise<void>} onRefresh  Async callback that reloads data.
 * @returns {{ containerProps, pullY, isPulling, PullIndicator }}
 */
export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const isRefreshing = useRef(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = containerRef.current?.scrollTop === 0
      ? e.touches[0].clientY
      : 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === 0 || isRefreshing.current) return;
    if (containerRef.current?.scrollTop > 0) {
      touchStartY.current = 0;
      setPullY(0);
      return;
    }
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      // Prevent the native Android WebView pull-to-refresh from firing
      if (e.cancelable) e.preventDefault();
      setPullY(Math.min(dy * 0.35, 64));
    } else {
      touchStartY.current = 0;
      setPullY(0);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    const triggered = pullY > 52;
    setPullY(0);
    touchStartY.current = 0;
    if (triggered && !isRefreshing.current) {
      isRefreshing.current = true;
      setIsPulling(true);
      await onRefresh();
      setIsPulling(false);
      isRefreshing.current = false;
    }
  }, [pullY, onRefresh]);

  const setContainerRef = useCallback((node) => {
    containerRef.current = node;
  }, []);

  const containerProps = {
    ref: setContainerRef,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  const PullIndicator = (pullY > 0 || isPulling) ? (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
      style={{ height: isPulling ? 48 : pullY }}
    >
      <div
        className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${isPulling ? "animate-spin" : ""}`}
        style={{ opacity: isPulling ? 1 : Math.min(pullY / 52, 1) }}
      />
    </div>
  ) : null;

  return { containerProps, pullY, isPulling, PullIndicator };
}