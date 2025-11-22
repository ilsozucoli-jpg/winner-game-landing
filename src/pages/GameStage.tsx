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
import { Minesweeper } from '@/components/Minesweeper';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { Timer, Target } from 'lucide-react';

const STAGE_BASE_POINTS = [100, 200, 300, 400, 500];

export default function GameStage() {
  const { stage } = useParams<{ stage: string }>();
  const stageNumber = parseInt(stage || '1') - 1;
  const navigate = useNavigate();
  const { addPoints, addStagePoints, userData, setUserData, setSelectedSponsor } = useGame();
  const { toast } = useToast();
  
  const [showWheel, setShowWheel] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [challengeComplete, seteChallengeComplete] = useState(false);

  useEffect(() => {
    // Check for test mode
    const testMode = localStorage.getItem('testMode');
    const testSponsor = localStorage.getItem('testSponsor');
    
    if (testMode === 'true' && testSponsor) {
      // Set test user data
      setUserData({
        name: 'Admin (Teste)',
        phone: '00000000000',
        email: 'admin@teste.com'
      });
      
      // Set test sponsor
      setSelectedSponsor(JSON.parse(testSponsor));
      
      // Clear test mode flag
      localStorage.removeItem('testMode');
      localStorage.removeItem('testSponsor');
    } else if (!userData) {
      navigate('/register');
    }
  }, [userData, navigate, setUserData, setSelectedSponsor]);

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

  const handleMinesweeperComplete = (score: number) => {
    setIsTimerRunning(false);
    
    if (score > 0) {
      addPoints(score);
      addStagePoints(stageNumber, score);
      
      toast({
        title: "🎯 Etapa Concluída!",
        description: `Você ganhou ${score} pontos!`,
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
            ) : stageNumber === 4 ? (
              <Minesweeper 
                onComplete={handleMinesweeperComplete} 
                timeLeft={60 - timer}
              />
            ) : null}
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

        {userData?.name === 'Admin (Teste)' && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Voltar ao Painel Admin
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
