import { useState, useCallback } from 'react';
import { battlePhoto } from '@/api/photos';
import type { BattleResult, BattleOpponent } from '@/types/photo';

export function useBattle() {
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isBattling, setIsBattling] = useState(false);
  const [battlingId, setBattlingId] = useState<string | null>(null);

  const handleBattle = useCallback(async (id: string, opponent?: BattleOpponent): Promise<BattleResult | null> => {
    setBattlingId(id);
    setIsBattling(true);
    try {
      const result = await battlePhoto(id, opponent);
      setBattleResult(result);
      return result;
    } catch (err: any) {
      console.error('Battle failed:', err);
      alert(err.response?.data || '对战失败，请稍后重试');
      return null;
    } finally {
      setBattlingId(null);
      setIsBattling(false);
    }
  }, []);

  const clearBattle = useCallback(() => {
    setBattleResult(null);
  }, []);

  return {
    battleResult,
    isBattling,
    battlingId,
    handleBattle,
    clearBattle,
  };
}
