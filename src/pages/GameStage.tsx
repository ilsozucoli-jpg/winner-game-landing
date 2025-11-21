import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SponsorBanner } from '@/components/SponsorBanner';
import { PointsDisplay } from '@/components/PointsDisplay';
import { WheelOfFortune } from '@/components/WheelOfFortune';
import { MovingTargets } from '@/components/MovingTargets';
import { ArcheryGame } from '@/components/ArcheryGame';
import { TicTacToe } from '@/components/TicTacToe';
import { ColorSequence } from '@/components/ColorSequence';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { Timer, Target } from 'lucide-react';

const STAGE_BASE_POINTS = [100, 200, 300, 400, 500];

export default function GameStage() {
  const { stage } = useParams<{ stage: string }>();
  const stageNumber = parseInt(stage || '1') - 1;
  const navigate = useNavigate();
  const { addPoints, addStagePoints, userData } = useGame();
  const { toast } = useToast();
  
  const [showWheel, setShowWheel] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [challengeComplete, seteChallengeComplete] = useState(false);

  useEffect(() => {
    if (!userData) {
      navigate('/register');
    }
  }, [userData, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleWheelComplete = () => {
    setShowWheel(false);
    setShowChallenge(true);
    setIsTimerRunning(true);
  };

  const handleChallengeComplete = (success: boolean = true) => {
    setIsTimerRunning(false);
    
    if (success) {
      // Calcula pontos: pontos base mais bônus por tempo restante
      const basePoints = STAGE_BASE_POINTS[stageNumber];
      const timeBonus = Math.floor((30 - timer) * 5); // 5 pontos por segundo restante
      const totalPoints = Math.max(basePoints + timeBonus, basePoints);
      
      addPoints(totalPoints);
      addStagePoints(stageNumber, totalPoints);
      
      toast({
        title: "🎯 Etapa Concluída!",
        description: `Você ganhou ${totalPoints} pontos! Tempo: ${timer}s`,
        className: "bg-success text-success-foreground",
      });
    } else {
      toast({
        title: "Etapa Não Concluída",
        description: "Você não pontuou nesta etapa. Continue para a próxima!",
        className: "bg-muted text-muted-foreground",
      });
    }

    seteChallengeComplete(true);
  };

  const handleNextStage = () => {
    if (stageNumber < 4) {
      navigate(`/stage/${stageNumber + 2}`);
      // Reset state for next stage
      setShowWheel(true);
      setShowChallenge(false);
      setTimer(0);
      seteChallengeComplete(false);
    } else {
      navigate('/results');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Winning Game
          </h1>
          <p className="text-lg text-muted-foreground">Etapa {stageNumber + 1} de 5</p>
        </div>

        <SponsorBanner />
        <PointsDisplay />

        {showWheel && (
          <div className="bg-card border border-border rounded-lg animate-bounce-in">
            <WheelOfFortune onComplete={handleWheelComplete} stage={stageNumber} />
          </div>
        )}

        {showChallenge && !challengeComplete && (
          <>
            {stageNumber === 0 ? (
              <MovingTargets 
                onComplete={handleChallengeComplete} 
                timeLimit={20}
              />
            ) : stageNumber === 1 ? (
              <ArcheryGame 
                onComplete={handleChallengeComplete} 
                timeLimit={30}
              />
            ) : stageNumber === 2 ? (
              <TicTacToe 
                onComplete={handleChallengeComplete} 
                timeLimit={60}
              />
            ) : stageNumber === 3 ? (
              <ColorSequence 
                onComplete={handleChallengeComplete} 
                timeLimit={30}
              />
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 space-y-6 animate-slide-up">
                <div className="text-center space-y-4">
                  <Target className="w-16 h-16 text-primary mx-auto" />
                  <h2 className="text-2xl font-bold text-foreground">Desafio da Etapa {stageNumber + 1}</h2>
                  
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-center gap-2">
                    <Timer className="w-6 h-6 text-primary" />
                    <span className="text-3xl font-bold text-foreground">{timer}s</span>
                  </div>

                  <p className="text-muted-foreground">
                    Complete o desafio o mais rápido possível para ganhar mais pontos!
                  </p>

                  <div className="bg-background rounded-lg p-6 my-6">
                    <p className="text-lg text-foreground mb-4">
                      🎯 Clique no botão abaixo para completar esta etapa!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pontos base: {STAGE_BASE_POINTS[stageNumber]} / tempo gasto
                    </p>
                  </div>

                  <Button
                    variant="success"
                    size="xl"
                    onClick={() => handleChallengeComplete(true)}
                    className="w-full"
                  >
                    COMPLETAR ETAPA
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {challengeComplete && (
          <div className="bg-card border border-border rounded-lg p-8 space-y-6 text-center animate-bounce-in">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-success">Etapa Concluída!</h2>
            <p className="text-muted-foreground">Tempo: {timer}s</p>
            
            <Button
              variant="game"
              size="xl"
              onClick={handleNextStage}
              className="w-full"
            >
              {stageNumber < 4 ? 'PRÓXIMA ETAPA' : 'VER RESULTADOS'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
