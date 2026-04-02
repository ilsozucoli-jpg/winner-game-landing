import { Trophy } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function PointsDisplay() {
  const { userData, gamePlayId } = useGame();
  const [displayPoints, setDisplayPoints] = useState(0);

  useEffect(() => {
    if (!gamePlayId) return;

    const fetchPoints = async () => {
      const { data } = await supabase
        .from('game_play')
        .select('stage_points')
        .eq('id', gamePlayId)
        .single();

      if (data) {
        const total = (data.stage_points as number[]).reduce((sum, val) => sum + (val || 0), 0);
        setDisplayPoints(total);
      }
    };

    fetchPoints();
    const interval = setInterval(fetchPoints, 2000);
    return () => clearInterval(interval);
  }, [gamePlayId]);

  return (
    <div className="bg-gradient-primary rounded-lg p-4 shadow-glow mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary-foreground" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary-foreground">Pontos Totais</span>
            {userData?.name && (
              <span className="text-xs text-primary-foreground/80">{userData.name}</span>
            )}
          </div>
        </div>
        <div className="text-3xl font-bold text-primary-foreground animate-pulse-glow">
          {displayPoints.toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
