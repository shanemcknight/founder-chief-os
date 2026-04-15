import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoRefreshOptions {
  intervalMs: number;
  enabled?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export function useAutoRefresh({ intervalMs, enabled = true, onRefresh }: UseAutoRefreshOptions) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setLastRefreshed(new Date());
      setSecondsAgo(0);
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    intervalRef.current = setInterval(refresh, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [enabled, intervalMs, refresh]);

  // Tick every 10s to update "X ago" label
  useEffect(() => {
    if (!enabled) return;
    tickRef.current = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshed.getTime()) / 1000));
    }, 10_000);
    return () => clearInterval(tickRef.current);
  }, [enabled, lastRefreshed]);

  const formatAgo = () => {
    if (secondsAgo < 10) return "just now";
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const mins = Math.floor(secondsAgo / 60);
    return `${mins}m ago`;
  };

  return { lastRefreshed, isRefreshing, refresh, agoLabel: formatAgo() };
}
