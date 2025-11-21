import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, Eye, EyeOff } from 'lucide-react';

interface ColorSequenceProps {
  onComplete: () => void;
  timeLimit: number;
}

const COLORS = [
  { name: 'Vermelho', value: 'bg-red-500', border: 'border-red-500' },
  { name: 'Azul', value: 'bg-blue-500', border: 'border-blue-500' },
  { name: 'Verde', value: 'bg-green-500', border: 'border-green-500' },
  { name: 'Amarelo', value: 'bg-yellow-500', border: 'border-yellow-500' },
  { name: 'Roxo', value: 'bg-purple-500', border: 'border-purple-500' },
  { name: 'Rosa', value: 'bg-pink-500', border: 'border-pink-500' },
  { name: 'Laranja', value: 'bg-orange-500', border: 'border-orange-500' },
  { name: 'Ciano', value: 'bg-cyan-500', border: 'border-cyan-500' },
];

export function ColorSequence({ onComplete, timeLimit }: ColorSequenceProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState(true);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('Memorize a sequência de cores!');
  const [showingSequence, setShowingSequence] = useState(true);

  // Generate random sequence on mount
  useEffect(() => {
    const newSequence = Array(5).fill(0).map(() => Math.floor(Math.random() * COLORS.length));
    setSequence(newSequence);

    // Show sequence for 3 seconds then hide
    const timer = setTimeout(() => {
      setShowSequence(false);
      setShowingSequence(false);
      setMessage('Recrie a sequência!');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameOver || showingSequence) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          if (attempts < 4) {
            setMessage('⏰ Tempo esgotado! Você não somou pontos.');
          }
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, showingSequence, attempts]);

  const handleColorClick = useCallback((colorIndex: number) => {
    if (gameOver || showingSequence) return;

    const newPlayerSequence = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSequence);

    // Check if sequence is correct so far
    if (newPlayerSequence.length <= sequence.length) {
      const isCorrectSoFar = newPlayerSequence.every((color, idx) => color === sequence[idx]);
      
      if (!isCorrectSoFar) {
        // Wrong color
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPlayerSequence([]);
        
        if (newAttempts >= 4) {
          setGameOver(true);
          setMessage('❌ 4 tentativas esgotadas! Você não somou pontos.');
          setTimeout(() => onComplete(), 2000);
        } else {
          setMessage(`❌ Errado! Tentativa ${newAttempts}/4`);
        }
      } else if (newPlayerSequence.length === sequence.length) {
        // Correct sequence!
        setGameOver(true);
        setMessage('🎉 Parabéns! Sequência correta!');
        setTimeout(() => onComplete(), 2000);
      }
    }
  }, [playerSequence, sequence, gameOver, showingSequence, attempts, onComplete]);

  const handleShowSequence = () => {
    setShowSequence(true);
    setTimeout(() => {
      setShowSequence(false);
    }, 2000);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-slide-up">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          🎨 Sequência de Cores
        </h2>
        
        <div className="flex items-center justify-center gap-4">
          <div className="bg-success/20 rounded-lg p-3 flex items-center gap-2">
            <Timer className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-success">{timeLeft}s</span>
          </div>
          
          <div className="bg-destructive/20 rounded-lg p-3">
            <span className="text-xl font-bold text-destructive">
              Tentativas: {attempts}/4
            </span>
          </div>
        </div>

        <p className="text-lg font-semibold text-foreground">{message}</p>
      </div>

      {/* Sequence Display */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <div className="flex justify-center gap-3">
          {sequence.map((colorIndex, idx) => (
            <div
              key={idx}
              className={`w-16 h-16 rounded-lg ${
                showSequence ? COLORS[colorIndex].value : 'bg-muted'
              } border-4 ${
                showSequence ? COLORS[colorIndex].border : 'border-muted-foreground'
              } transition-all duration-300 shadow-lg ${
                showSequence ? 'animate-bounce-in' : ''
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            />
          ))}
        </div>

        {!showingSequence && !gameOver && (
          <Button
            onClick={handleShowSequence}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={showSequence}
          >
            {showSequence ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showSequence ? 'Memorizando...' : 'Ver Sequência (2s)'}
          </Button>
        )}
      </div>

      {/* Player's Current Sequence */}
      {!showingSequence && playerSequence.length > 0 && (
        <div className="bg-background/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2 text-center">Sua sequência:</p>
          <div className="flex justify-center gap-2">
            {playerSequence.map((colorIndex, idx) => (
              <div
                key={idx}
                className={`w-12 h-12 rounded-lg ${COLORS[colorIndex].value} border-2 ${COLORS[colorIndex].border} shadow-md animate-scale-in`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color Buttons */}
      {!showingSequence && !gameOver && (
        <div className="grid grid-cols-4 gap-3">
          {COLORS.map((color, idx) => (
            <button
              key={idx}
              onClick={() => handleColorClick(idx)}
              className={`h-20 rounded-lg ${color.value} border-4 ${color.border} shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 hover:shadow-xl`}
              disabled={gameOver || playerSequence.length >= 5}
            >
              <span className="text-white font-bold text-sm drop-shadow-lg">
                {color.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {gameOver && attempts >= 4 && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Você usou todas as tentativas. Continue para a próxima etapa!
          </p>
        </div>
      )}
    </div>
  );
}
