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

  const getSegmentColor = (index: number, isLose: boolean) => {
    if (isLose) return 'bg-red-600';
    const colors = [
      'bg-yellow-400',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-lime-500',
      'bg-cyan-500',
      'bg-amber-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-2xl font-bold text-foreground">Gire a Roleta!</h2>
      
      <div className="relative">
        {/* Indicador fixo no topo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-red-600"></div>
        </div>

        {/* Roleta */}
        <div 
          className="relative w-80 h-80 rounded-full border-[12px] border-yellow-600 shadow-2xl overflow-hidden bg-white"
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
                className={`absolute w-full h-full ${getSegmentColor(index, isLose)} border-white`}
                style={{
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%)',
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'center',
                  borderWidth: '1px',
                }}
              >
                <div
                  className="absolute text-lg font-extrabold text-white whitespace-nowrap drop-shadow-lg"
                  style={{
                    top: '20%',
                    left: '65%',
                    transform: `rotate(${segmentAngle / 2}deg)`,
                    transformOrigin: 'center',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {value}
                </div>
              </div>
            );
          })}
          
          {/* Centro da roleta */}
          <div className="absolute inset-0 m-auto w-20 h-20 bg-yellow-600 rounded-full shadow-xl flex items-center justify-center border-4 border-white">
            <div className="text-3xl font-bold">⭐</div>
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
