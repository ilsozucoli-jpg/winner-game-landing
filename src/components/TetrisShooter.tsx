import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface TetrisShooterProps {
  onComplete: () => void;
  timeLimit: number;
}

interface FallingBlock {
  id: number;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  targetY: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
}

const COLORS = [
  'bg-red-500',
  'bg-yellow-400',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
];

const GAME_WIDTH = 100;
const GAME_HEIGHT = 100;
const BLOCK_SIZE = 8;
const SHOOTER_WIDTH = 12;
const TARGET_SCORE = 15;

export function TetrisShooter({ onComplete, timeLimit }: TetrisShooterProps) {
  const [blocks, setBlocks] = useState<FallingBlock[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [shooterX, setShooterX] = useState(50);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [isAiming, setIsAiming] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const blockIdRef = useRef(0);
  const bulletIdRef = useRef(0);
  const explosionIdRef = useRef(0);

  // Spawn falling blocks
  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      const newBlock: FallingBlock = {
        id: blockIdRef.current++,
        x: Math.random() * (GAME_WIDTH - BLOCK_SIZE),
        y: -BLOCK_SIZE,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
      };
      setBlocks(prev => [...prev, newBlock]);
    }, 800);

    return () => clearInterval(spawnInterval);
  }, [gameOver]);

  // Move falling blocks
  useEffect(() => {
    if (gameOver) return;

    const moveInterval = setInterval(() => {
      setBlocks(prev => {
        const updated = prev
          .map(block => ({ ...block, y: block.y + 1.5 }))
          .filter(block => block.y < GAME_HEIGHT + BLOCK_SIZE);
        return updated;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameOver]);

  // Move bullets and check collisions
  useEffect(() => {
    if (gameOver) return;

    const bulletInterval = setInterval(() => {
      setBullets(prev => {
        const updated = prev
          .map(bullet => ({ ...bullet, y: bullet.y - 4 }))
          .filter(bullet => bullet.y > 0);
        return updated;
      });

      // Check collisions
      setBullets(prevBullets => {
        const remainingBullets: Bullet[] = [];
        
        prevBullets.forEach(bullet => {
          let hit = false;
          
          setBlocks(prevBlocks => {
            const newBlocks = prevBlocks.filter(block => {
              const bulletCenterX = bullet.x;
              const bulletCenterY = bullet.y;
              const blockCenterX = block.x + block.width / 2;
              const blockCenterY = block.y + block.height / 2;
              
              const distance = Math.sqrt(
                Math.pow(bulletCenterX - blockCenterX, 2) +
                Math.pow(bulletCenterY - blockCenterY, 2)
              );
              
              if (distance < (block.width / 2) + 2) {
                hit = true;
                // Create explosion
                setExplosions(prev => [...prev, {
                  id: explosionIdRef.current++,
                  x: block.x + block.width / 2,
                  y: block.y + block.height / 2,
                }]);
                setScore(s => s + 1);
                return false;
              }
              return true;
            });
            return newBlocks;
          });
          
          if (!hit) {
            remainingBullets.push(bullet);
          }
        });
        
        return remainingBullets;
      });
    }, 30);

    return () => clearInterval(bulletInterval);
  }, [gameOver]);

  // Remove explosions after animation
  useEffect(() => {
    if (explosions.length === 0) return;

    const timeout = setTimeout(() => {
      setExplosions(prev => prev.slice(1));
    }, 300);

    return () => clearTimeout(timeout);
  }, [explosions]);

  // Timer
  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          if (score >= TARGET_SCORE) {
            setMessage('🎉 Parabéns! Você venceu!');
          } else {
            setMessage('⏰ Tempo esgotado!');
          }
          setTimeout(onComplete, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, onComplete, score]);

  // Check win condition
  useEffect(() => {
    if (score >= TARGET_SCORE && !gameOver) {
      setGameOver(true);
      setMessage('🎉 Parabéns! Você destruiu todos os blocos!');
      setTimeout(onComplete, 2000);
    }
  }, [score, gameOver, onComplete]);

  // Handle shooter movement
  const handleGameClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (gameOver) return;

    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const relativeX = ((clientX - rect.left) / rect.width) * 100;

    if (!isAiming) {
      // First tap - move shooter
      setShooterX(Math.max(SHOOTER_WIDTH / 2, Math.min(GAME_WIDTH - SHOOTER_WIDTH / 2, relativeX)));
      setIsAiming(true);
    } else {
      // Second tap - shoot
      const newBullet: Bullet = {
        id: bulletIdRef.current++,
        x: shooterX,
        y: 88,
        targetY: 0,
      };
      setBullets(prev => [...prev, newBullet]);
      setIsAiming(false);
    }
  }, [gameOver, isAiming, shooterX]);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Destrua os Blocos!</h2>
        
        <div className="flex items-center justify-center gap-4">
          <div className="bg-primary/20 text-primary px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">Pontos: </span>
            <span className="text-2xl font-bold">{score}/{TARGET_SCORE}</span>
          </div>
          <div className="bg-destructive/20 text-destructive px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">Tempo: </span>
            <span className="text-2xl font-bold">{timeLeft}s</span>
          </div>
        </div>
        
        {message && (
          <p className="text-lg font-bold animate-bounce">{message}</p>
        )}
        
        <p className="text-sm text-muted-foreground">
          {isAiming ? '🎯 Toque novamente para ATIRAR!' : '👆 Toque para MIRAR'}
        </p>
      </div>

      <div
        ref={gameRef}
        onClick={handleGameClick}
        onTouchStart={handleGameClick}
        className="relative rounded-lg overflow-hidden cursor-crosshair select-none"
        style={{
          height: '400px',
          background: 'linear-gradient(180deg, #1e3a5f 0%, #0a1929 50%, #0d47a1 100%)',
        }}
      >
        {/* Stars background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>

        {/* Falling blocks */}
        {blocks.map(block => (
          <div
            key={block.id}
            className={`absolute ${block.color} rounded shadow-lg transition-none`}
            style={{
              left: `${block.x}%`,
              top: `${block.y}%`,
              width: `${block.width}%`,
              height: `${block.height}%`,
              boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <div className="absolute inset-1 bg-white/20 rounded-sm" />
          </div>
        ))}

        {/* Bullets with trail effect */}
        {bullets.map(bullet => (
          <div key={bullet.id} className="absolute" style={{ left: `${bullet.x}%`, top: `${bullet.y}%` }}>
            {/* Trail */}
            <div
              className="absolute w-1 bg-gradient-to-t from-yellow-500/0 via-yellow-400 to-yellow-200"
              style={{
                height: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                top: '0',
              }}
            />
            {/* Bullet */}
            <div
              className="absolute w-3 h-3 bg-yellow-300 rounded-full shadow-lg"
              style={{
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 10px 4px rgba(255, 255, 0, 0.6)',
              }}
            />
          </div>
        ))}

        {/* Explosions */}
        {explosions.map(explosion => (
          <div
            key={explosion.id}
            className="absolute animate-ping"
            style={{
              left: `${explosion.x}%`,
              top: `${explosion.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full opacity-80" />
            <div className="absolute inset-0 w-12 h-12 bg-yellow-400 rounded-full opacity-50 -translate-x-2 -translate-y-2" />
          </div>
        ))}

        {/* Shooter */}
        <div
          className={`absolute bottom-4 transition-all duration-100 ${isAiming ? 'scale-110' : ''}`}
          style={{
            left: `${shooterX}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Aiming indicator */}
          {isAiming && (
            <div
              className="absolute w-0.5 bg-gradient-to-t from-cyan-400 to-transparent opacity-50"
              style={{
                height: '300px',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '100%',
              }}
            />
          )}
          
          {/* Cannon base */}
          <div className="relative">
            {/* Cannon barrel */}
            <div
              className="absolute w-3 h-8 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-full"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '100%',
                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3)',
              }}
            />
            {/* Cannon body */}
            <div
              className={`w-12 h-6 rounded-t-lg ${isAiming ? 'bg-cyan-500' : 'bg-blue-600'}`}
              style={{
                boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
              }}
            />
            {/* Wheels */}
            <div className="flex justify-between px-1">
              <div className="w-3 h-3 bg-gray-700 rounded-full border-2 border-gray-500" />
              <div className="w-3 h-3 bg-gray-700 rounded-full border-2 border-gray-500" />
            </div>
          </div>
        </div>

        {/* Ground */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{
            background: 'linear-gradient(180deg, #2d5a27 0%, #1a3a17 100%)',
          }}
        />
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Primeiro toque: mover o canhão | Segundo toque: atirar!
      </p>
    </div>
  );
}
