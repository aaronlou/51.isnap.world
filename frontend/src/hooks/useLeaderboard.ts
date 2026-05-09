import { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard } from '@/api/photos';
import type { Photo } from '@/types/photo';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 延迟加载：由调用方（App）在切换到 leaderboard tab 时触发

  return { leaderboard, isLoading, loadLeaderboard };
}
