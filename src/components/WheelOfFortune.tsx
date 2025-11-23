import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';

const WHEEL_VALUES = [500, 300, 800, 100, 200, 600, 1000, 700, 100, 500, 600, 1000];

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
    const finalRotation = rotation + (spins * 360) + (randomSegment * segmentAngle);
    
    setRotation(finalRotation);

    // Após a animação, mostra o resultado
    setTimeout(() => {
      const value = WHEEL_VALUES[randomSegment];
      const points = value as number;
      
      addPoints(points);
      addWheelPoints(stage, points);
      toast({
        title: "🎉 Parabéns!",
        description: `Você ganhou ${points} pontos!`,
        className: "bg-success text-success-foreground",
      });
      
      setTimeout(() => {
        setIsSpinning(false);
        onComplete();
      }, 2000);
    }, 4000);
  };

  const getSegmentColor = (index: number) => {
    const colors = [
      '#FF1493', // Magenta/Pink
      '#FFFFFF', // White
      '#00BFFF', // Light Blue/Cyan
      '#8B00FF', // Purple
      '#FF0000', // Red
      '#FFD700', // Gold/Yellow
      '#FF1493', // Magenta/Pink
      '#FFFFFF', // White
      '#00BFFF', // Light Blue/Cyan
      '#8B00FF', // Purple
      '#FF0000', // Red
      '#FFD700', // Gold/Yellow
    ];
    return colors[index];
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-2xl font-bold text-foreground">Gire a Roleta!</h2>
      
      <div className="relative">
        {/* Anel de lâmpadas ao redor */}
        <div className="absolute inset-0 w-[420px] h-[420px] -translate-x-[30px] -translate-y-[30px] rounded-full">
          {[...Array(24)].map((_, i) => {
            const angle = (360 / 24) * i;
            return (
              <div
                key={i}
                className="absolute w-4 h-4 bg-yellow-300 rounded-full shadow-lg animate-pulse-glow"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translate(200px) rotate(-${angle}deg)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            );
          })}
        </div>

        {/* Indicador fixo no topo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-20">
          <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-xl"></div>
        </div>

        {/* Borda dourada externa */}
        <div className="relative w-[360px] h-[360px] rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl p-3">
          {/* Roleta */}
          <div 
            className="relative w-full h-full rounded-full overflow-hidden shadow-inner"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {WHEEL_VALUES.map((value, index) => {
              const angle = (360 / WHEEL_VALUES.length) * index;
              const segmentAngle = 360 / WHEEL_VALUES.length;
              
              return (
                <div
                  key={index}
                  className="absolute w-full h-full"
                  style={{
                    backgroundColor: getSegmentColor(index),
                    clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%)',
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center',
                    borderLeft: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <div
                    className="absolute text-xl font-black whitespace-nowrap"
                    style={{
                      top: '18%',
                      left: '62%',
                      transform: `rotate(${segmentAngle / 2}deg)`,
                      transformOrigin: 'center',
                      color: getSegmentColor(index) === '#FFFFFF' ? '#000000' : '#FFFFFF',
                      textShadow: getSegmentColor(index) === '#FFFFFF' 
                        ? '1px 1px 2px rgba(0,0,0,0.3)' 
                        : '2px 2px 4px rgba(0,0,0,0.8)',
                    }}
                  >
                    {value}$
                  </div>
                </div>
              );
            })}
            
            {/* Centro da roleta */}
            <div className="absolute inset-0 m-auto w-24 h-24 rounded-full shadow-2xl flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)',
                border: '4px solid #FFD700',
              }}
            >
              <div className="text-4xl font-bold drop-shadow-lg">💰</div>
            </div>
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
