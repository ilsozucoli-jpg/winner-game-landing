import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';

const WHEEL_VALUES = [100, 200, 300, 500, 750, 1000, 1250, 1500, 1750, 2000, 500, 'PERDE'];

export function WheelOfFortune({ onComplete, stage }: { onComplete: () => void; stage: number }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { addPoints, addWheelPoints } = useGame();
  const { toast } = useToast();

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    
    // Calcula rotações aleatórias (5-10 voltas completas + posição final)
    const spins = 5 + Math.floor(Math.random() * 5);
    const segmentAngle = 360 / WHEEL_VALUES.length;
    const randomSegment = Math.floor(Math.random() * WHEEL_VALUES.length);
    const finalRotation = (spins * 360) + (randomSegment * segmentAngle);
    
    setRotation(finalRotation);

    // Após a animação, mostra o resultado
    setTimeout(() => {
      const value = WHEEL_VALUES[randomSegment];
      
      if (value === 'PERDE') {
        addWheelPoints(stage, 0);
        toast({
          title: "😢 Que pena!",
          description: "Você perdeu os pontos desta rodada!",
          variant: "destructive",
        });
      } else {
        const points = value as number;
        addPoints(points);
        addWheelPoints(stage, points);
        toast({
          title: "🎉 Parabéns!",
          description: `Você ganhou ${points} pontos!`,
          className: "bg-success text-success-foreground",
        });
      }
      
      setTimeout(() => {
        setIsSpinning(false);
        onComplete();
      }, 2000);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-2xl font-bold text-foreground">Gire a Roleta!</h2>
      
      <div className="relative">
        {/* Indicador fixo no topo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-accent"></div>
        </div>

        {/* Roleta */}
        <div 
          className="relative w-72 h-72 rounded-full border-8 border-primary shadow-glow overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {WHEEL_VALUES.map((value, index) => {
            const angle = (360 / WHEEL_VALUES.length) * index;
            const segmentAngle = 360 / WHEEL_VALUES.length;
            const isLose = value === 'PERDE';
            
            return (
              <div
                key={index}
                className={`absolute w-full h-full ${
                  isLose ? 'bg-destructive' : index % 2 === 0 ? 'bg-primary' : 'bg-secondary'
                }`}
                style={{
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%)',
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'center',
                }}
              >
                <div
                  className="absolute text-sm font-bold text-white whitespace-nowrap"
                  style={{
                    top: '25%',
                    left: '70%',
                    transform: `rotate(${segmentAngle / 2}deg)`,
                    transformOrigin: 'center',
                  }}
                >
                  {value}
                </div>
              </div>
            );
          })}
          
          {/* Centro da roleta */}
          <div className="absolute inset-0 m-auto w-16 h-16 bg-accent rounded-full shadow-lg flex items-center justify-center">
            <div className="text-2xl font-bold text-accent-foreground">🎯</div>
          </div>
        </div>
      </div>

      <Button 
        variant="game" 
        size="xl"
        onClick={spinWheel}
        disabled={isSpinning}
        className="animate-bounce-in"
      >
        {isSpinning ? 'Girando...' : 'GIRAR ROLETA'}
      </Button>
    </div>
  );
}
