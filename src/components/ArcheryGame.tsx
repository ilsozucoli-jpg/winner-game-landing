import { useState, useEffect, useCallback } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArcheryGameProps {
  onComplete: () => void;
  timeLimit: number;
}

interface TargetPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function ArcheryGame({ onComplete, timeLimit }: ArcheryGameProps) {
  const [targetPosition, setTargetPosition] = useState<TargetPosition>({
    x: 50,
    y: 50,
    vx: 2,
    vy: 1.5,
  });
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [archerPosition, setArcherPosition] = useState(10);

  // Movimento do alvo
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setTargetPosition(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy;

        if (newX <= 10 || newX >= 85) {
          newVx = -prev.vx;
          newX = Math.max(10, Math.min(85, newX));
        }
        if (newY <= 10 || newY >= 80) {
          newVy = -prev.vy;
          newY = Math.max(10, Math.min(80, newY));
        }

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Timer
  useEffect(() => {
    if (gameOver || hits >= 5) return;

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
  }, [gameOver, hits, onComplete]);

  // Verificar vitória
  useEffect(() => {
    if (hits >= 5 && !gameOver) {
      setGameOver(true);
      setMessage('🎯 Parabéns! Você acertou todos os alvos!');
      setTimeout(onComplete, 2000);
    }
  }, [hits, gameOver, onComplete]);

  // Atualizar posição do arqueiro com base no mouse/touch
  useEffect(() => {
    const handleMove = (clientY: number, containerRect: DOMRect) => {
      const relativeY = ((clientY - containerRect.top) / containerRect.height) * 100;
      setArcherPosition(Math.max(5, Math.min(95, relativeY)));
    };

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('archery-game-container');
      if (container) {
        handleMove(e.clientY, container.getBoundingClientRect());
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const container = document.getElementById('archery-game-container');
      if (container && e.touches[0]) {
        handleMove(e.touches[0].clientY, container.getBoundingClientRect());
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const handleShoot = useCallback(() => {
    if (gameOver) return;

    // Verificar se o arqueiro está alinhado com o alvo (margem de erro de 10%)
    const archerY = archerPosition;
    const targetY = targetPosition.y;
    const tolerance = 8;

    if (Math.abs(archerY - targetY) < tolerance) {
      setHits(prev => prev + 1);
      setMessage('🎯 Acertou!');
      setTimeout(() => setMessage(''), 800);
    } else {
      setMessage('❌ Errou!');
      setTimeout(() => setMessage(''), 800);
    }
  }, [gameOver, archerPosition, targetPosition.y]);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Tiro ao Alvo!</h2>
        <div className="flex items-center justify-center gap-4">
          <div className="bg-primary/20 text-primary px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">Acertos: </span>
            <span className="text-2xl font-bold">{hits}/5</span>
          </div>
          <div className="bg-destructive/20 text-destructive px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">Tempo: </span>
            <span className="text-2xl font-bold">{timeLeft}s</span>
          </div>
        </div>
        {message && (
          <p className="text-lg font-bold animate-bounce-in">{message}</p>
        )}
      </div>

      <div 
        id="archery-game-container"
        className="relative bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20 rounded-lg overflow-hidden" 
        style={{ height: '400px' }}
        onClick={handleShoot}
      >
        {/* Arqueiro */}
        <div 
          className="absolute left-4 w-12 h-12 transition-all duration-100"
          style={{ 
            top: `${archerPosition}%`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="text-4xl">🏹</div>
        </div>

        {/* Alvo móvel */}
        <Button
          variant="ghost"
          size="icon"
          disabled={gameOver}
          className="absolute transition-none cursor-default"
          style={{
            left: `${targetPosition.x}%`,
            top: `${targetPosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Target 
            className="w-12 h-12 text-destructive"
            fill="currentColor"
          />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Mova o mouse para posicionar o arqueiro e clique para atirar!
      </p>
    </div>
  );
}
