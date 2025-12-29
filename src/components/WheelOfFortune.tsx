import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';

const WHEEL_VALUES = [500, 300, 800, 100, 200, 600, 1000, 700, 100, 500, 600, 1000];

export function WheelOfFortune({ onComplete, stage }: { onComplete: () => void; stage: number }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const { addPoints, addWheelPoints, selectedSponsor } = useGame();
  const { toast } = useToast();

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowExplosion(true);
    
    // Remove explosion effect after animation
    setTimeout(() => setShowExplosion(false), 1000);
    
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
            
            {/* Centro da roleta com logo do patrocinador */}
            <div 
              className={`absolute inset-0 m-auto w-28 h-28 rounded-full shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 ${!isSpinning ? 'animate-pulse' : ''}`}
              style={{
                background: 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)',
                border: '4px solid #FFD700',
              }}
              onClick={spinWheel}
            >
              {/* Explosion Effects */}
              {showExplosion && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 rounded-full animate-explosion"
                      style={{
                        background: ['#FF1493', '#FFD700', '#00BFFF', '#FF0000', '#8B00FF', '#FF6B00'][i % 6],
                        transform: `rotate(${i * 30}deg)`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`star-${i}`}
                      className="absolute text-2xl animate-explosion-star"
                      style={{
                        transform: `rotate(${i * 45}deg)`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    >
                      ✨
                    </div>
                  ))}
                </>
              )}
              
              {/* Logo do patrocinador */}
              {selectedSponsor?.logo_url ? (
                <img 
                  src={selectedSponsor.logo_url} 
                  alt={selectedSponsor.name}
                  className="w-16 h-16 object-contain rounded-full"
                />
              ) : (
                <div className="text-3xl">💰</div>
              )}
              
              {/* Texto GIRAR */}
              {!isSpinning && (
                <span className="text-xs font-bold text-amber-900 mt-1 drop-shadow-sm">
                  GIRAR
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        {isSpinning ? 'Girando...' : 'Clique no centro para girar!'}
      </p>
    </div>
  );
}
