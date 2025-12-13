import { useState, useEffect, useCallback } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArcheryGameProps {
  onComplete: () => void;
  timeLimit: number;
}

interface TargetData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hit: boolean;
}

function generateRandomSequence(): number[] {
  const sequence = [1, 2, 3, 4, 5];
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  return sequence;
}

function generateInitialTargets(): TargetData[] {
  return [1, 2, 3, 4, 5].map((id) => ({
    id,
    x: 15 + (id - 1) * 17,
    y: 20 + Math.random() * 50,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    hit: false,
  }));
}

export function ArcheryGame({ onComplete, timeLimit }: ArcheryGameProps) {
  const [targets, setTargets] = useState<TargetData[]>(generateInitialTargets);
  const [sequence, setSequence] = useState<number[]>(generateRandomSequence);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');

  // Movimento dos alvos
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setTargets(prev => prev.map(target => {
        if (target.hit) return target;

        let newX = target.x + target.vx;
        let newY = target.y + target.vy;
        let newVx = target.vx;
        let newVy = target.vy;

        if (newX <= 5 || newX >= 85) {
          newVx = -target.vx;
          newX = Math.max(5, Math.min(85, newX));
        }
        if (newY <= 10 || newY >= 75) {
          newVy = -target.vy;
          newY = Math.max(10, Math.min(75, newY));
        }

        return { ...target, x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [gameOver]);

  // Timer
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

  // Verificar vitória
  useEffect(() => {
    if (currentIndex >= 5 && !gameOver) {
      setGameOver(true);
      setMessage('🎯 Parabéns! Você acertou toda a sequência!');
      setTimeout(onComplete, 2000);
    }
  }, [currentIndex, gameOver, onComplete]);

  const resetGame = useCallback(() => {
    setTargets(generateInitialTargets());
    setSequence(generateRandomSequence());
    setCurrentIndex(0);
    setMessage('');
  }, []);

  const handleTargetClick = useCallback((targetId: number) => {
    if (gameOver) return;

    const expectedId = sequence[currentIndex];

    if (targetId === expectedId) {
      setTargets(prev => prev.map(t => 
        t.id === targetId ? { ...t, hit: true } : t
      ));
      setCurrentIndex(prev => prev + 1);
      setMessage('🎯 Acertou!');
      setTimeout(() => setMessage(''), 800);
    } else {
      setMessage('❌ Sequência errada! Reiniciando...');
      setTimeout(() => {
        resetGame();
      }, 1500);
    }
  }, [gameOver, sequence, currentIndex, resetGame]);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Acerte a Sequência!</h2>
        
        {/* Sequência a seguir */}
        <div className="bg-primary/10 rounded-lg p-3">
          <p className="text-sm text-muted-foreground mb-2">Acerte os alvos nesta ordem:</p>
          <div className="flex justify-center gap-3">
            {sequence.map((num, idx) => (
              <div 
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                  idx < currentIndex 
                    ? 'bg-green-500 border-green-600 text-white' 
                    : idx === currentIndex 
                      ? 'bg-primary border-primary text-primary-foreground animate-pulse' 
                      : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="bg-primary/20 text-primary px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">Acertos: </span>
            <span className="text-2xl font-bold">{currentIndex}/5</span>
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
        className="relative bg-gradient-to-b from-muted/30 to-muted/10 border-2 border-border rounded-lg overflow-hidden" 
        style={{ height: '350px' }}
      >
        {/* Alvos móveis */}
        {targets.map(target => (
          <button
            key={target.id}
            onClick={() => handleTargetClick(target.id)}
            disabled={gameOver || target.hit}
            className={`absolute transition-none w-16 h-16 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 ${
              target.hit 
                ? 'pointer-events-none' 
                : 'hover:shadow-lg'
            }`}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Círculos do alvo */}
            <div className={`absolute w-16 h-16 rounded-full border-4 ${
              target.hit ? 'border-green-500 bg-green-100' : 'border-gray-400 bg-white'
            }`} />
            <div className={`absolute w-11 h-11 rounded-full border-3 ${
              target.hit ? 'border-green-400 bg-green-200' : 'border-gray-300 bg-gray-100'
            }`} />
            <div className={`absolute w-6 h-6 rounded-full ${
              target.hit ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {/* Número do alvo */}
            <span className={`relative z-10 font-bold text-lg ${
              target.hit ? 'text-white' : 'text-white'
            }`}>
              {target.id}
            </span>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Clique nos alvos na ordem correta da sequência mostrada acima!
      </p>
    </div>
  );
}
