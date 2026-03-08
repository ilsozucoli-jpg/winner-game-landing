import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DailyPlayLimitResult {
  playsToday: number;
  maxDailyPlays: number;
  remainingPlays: number;
  isBlocked: boolean;
  showWarning: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useDailyPlayLimit(playerName: string | undefined): DailyPlayLimitResult {
  const [playsToday, setPlaysToday] = useState(0);
  const [maxDailyPlays, setMaxDailyPlays] = useState(50);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!playerName) {
      setLoading(false);
      return;
    }

    try {
      // Fetch max daily plays setting
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'promotion_limits')
        .single();

      if (settingsData?.setting_value) {
        const limits = settingsData.setting_value as any;
        setMaxDailyPlays(limits.max_daily_plays ?? 50);
      }

      // Count today's plays for this player
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('game_results')
        .select('*', { count: 'exact', head: true })
        .eq('player_name', playerName)
        .gte('completed_at', todayStart.toISOString());

      if (!error && count !== null) {
        setPlaysToday(count);
      }
    } catch (error) {
      console.error('Error fetching daily play limit:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [playerName]);

  const remainingPlays = Math.max(0, maxDailyPlays - playsToday);
  const isBlocked = remainingPlays <= 0;
  const showWarning = remainingPlays > 0 && remainingPlays <= 5;

  return {
    playsToday,
    maxDailyPlays,
    remainingPlays,
    isBlocked,
    showWarning,
    loading,
    refresh: fetchData,
  };
}
