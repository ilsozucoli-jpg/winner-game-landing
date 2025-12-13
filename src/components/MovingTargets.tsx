import { useState, useEffect, useCallback } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MovingTargetsProps {
  onComplete: () => void;
  timeLimit: number;
}

interface TargetData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isReal: boolean;
}

export function MovingTargets({ onComplete, timeLimit }: MovingTargetsProps) {
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Criar 5 alvos, apenas 1 verdadeiro
    const realTargetIndex = Math.floor(Math.random() * 5);
    const newTargets: TargetData[] = [];
    
    for (let i = 0; i < 5; i++) {
      newTargets.push({
        id: i,
        x: Math.random() * 70 + 10,
        y: Math.random() * 60 + 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        isReal: i === realTargetIndex,
      });
    }
    setTargets(newTargets);
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setMessage('⏰ Tempo esgotado!');
          setTimeout(onComplete, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, onComplete]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setTargets(prev => prev.map(target => {
        let newX = target.x + target.vx;
        let newY = target.y + target.vy;
        let newVx = target.vx;
        let newVy = target.vy;

        if (newX <= 5 || newX >= 90) {
          newVx = -target.vx;
          newX = Math.max(5, Math.min(90, newX));
        }
        if (newY <= 5 || newY >= 85) {
          newVy = -target.vy;
          newY = Math.max(5, Math.min(85, newY));
        }

        return { ...target, x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver]);

  const handleTargetClick = useCallback((target: TargetData) => {
    if (gameOver) return;
    
    if (target.isReal) {
      setGameOver(true);
      setMessage('🎯 Alvo correto! Parabéns!');
      setTimeout(onComplete, 2000);
    } else {
      setMessage('❌ Alvo falso! Tente novamente!');
      setTimeout(() => setMessage(''), 1500);
    }
  }, [gameOver, onComplete]);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Acerte o Alvo Verdadeiro!</h2>
        <div className="flex items-center justify-center gap-4">
          <div className="bg-destructive/20 text-destructive px-4 py-2 rounded-lg">
            <span className="text-3xl font-bold">{timeLeft}s</span>
          </div>
        </div>
        {message && (
          <p className="text-lg font-bold animate-bounce-in">{message}</p>
        )}
      </div>

      <div className="relative bg-background border-2 border-primary/20 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        {targets.map(target => (
          <button
            key={target.id}
            disabled={gameOver}
            onClick={() => handleTargetClick(target)}
            className="absolute transition-none hover:scale-110 active:scale-95 cursor-pointer"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Alvo com 6 círculos cinza e 5 brancos alternados */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Círculo 1 - Cinza (externo) */}
              <div className="absolute w-20 h-20 rounded-full bg-gray-400" />
              {/* Círculo 2 - Branco */}
              <div className="absolute w-[72px] h-[72px] rounded-full bg-white" />
              {/* Círculo 3 - Cinza */}
              <div className="absolute w-16 h-16 rounded-full bg-gray-400" />
              {/* Círculo 4 - Branco */}
              <div className="absolute w-14 h-14 rounded-full bg-white" />
              {/* Círculo 5 - Cinza */}
              <div className="absolute w-12 h-12 rounded-full bg-gray-400" />
              {/* Círculo 6 - Branco */}
              <div className="absolute w-10 h-10 rounded-full bg-white" />
              {/* Círculo 7 - Cinza */}
              <div className="absolute w-8 h-8 rounded-full bg-gray-400" />
              {/* Círculo 8 - Branco */}
              <div className="absolute w-6 h-6 rounded-full bg-white" />
              {/* Círculo 9 - Cinza */}
              <div className="absolute w-4 h-4 rounded-full bg-gray-400" />
              {/* Círculo 10 - Branco */}
              <div className="absolute w-2 h-2 rounded-full bg-white" />
              {/* Círculo 11 - Cinza (centro) */}
              <div className="absolute w-1 h-1 rounded-full bg-gray-400" />
            </div>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Apenas um alvo é verdadeiro! Os outros são falsos.
      </p>
    </div>
  );
}
