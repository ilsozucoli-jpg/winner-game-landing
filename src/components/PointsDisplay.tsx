import { Trophy } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

export function PointsDisplay() {
  const { totalPoints, userData } = useGame();

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
          {totalPoints.toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
