import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SponsorBanner } from '@/components/SponsorBanner';
import { PointsDisplay } from '@/components/PointsDisplay';
import { WheelOfFortune } from '@/components/WheelOfFortune';
import { TetrisShooter } from '@/components/TetrisShooter';
import { ArcheryGame } from '@/components/ArcheryGame';
import { TicTacToe } from '@/components/TicTacToe';
import { ColorSequence } from '@/components/ColorSequence';
import { Minesweeper } from '@/components/Minesweeper';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { useDailyPlayLimit } from '@/hooks/useDailyPlayLimit';
import { Timer, Target, LogOut, AlertTriangle, Clock } from 'lucide-react';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STAGE_BASE_POINTS = [100, 200, 300, 400, 500];

export default function GameStage() {
  const { stage } = useParams<{ stage: string }>();
  const stageNumber = parseInt(stage || '1') - 1;
  const navigate = useNavigate();
  const { addPoints, addStagePoints, userData, setUserData, setSelectedSponsor, isStageCompleted, getNextAvailableStage } = useGame();
  const { toast } = useToast();
  const { playsToday, maxDailyPlays, remainingPlays, isBlocked, showWarning, loading: limitLoading } = useDailyPlayLimit(userData?.name);
  
  const [showWheel, setShowWheel] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [challengeComplete, seteChallengeComplete] = useState(false);
  const [stageAlreadyCompleted, setStageAlreadyCompleted] = useState(false);

  useEffect(() => {
    // Check for test mode
    const testMode = localStorage.getItem('testMode');
    const testSponsor = localStorage.getItem('testSponsor');
    
    if (testMode === 'true' && testSponsor) {
      setUserData({
        name: 'Admin (Teste)',
        phone: '00000000000',
        email: 'admin@teste.com'
      });
      setSelectedSponsor(JSON.parse(testSponsor));
      localStorage.removeItem('testMode');
      localStorage.removeItem('testSponsor');
    } else if (!userData) {
      navigate('/register');
    }
  }, [userData, navigate, setUserData, setSelectedSponsor]);

  useEffect(() => {
    // Verificar se a etapa atual já foi completada
    if (isStageCompleted(stageNumber)) {
      setStageAlreadyCompleted(true);
    }
  }, [stageNumber, isStageCompleted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Show warning toast when player has 5 or fewer plays remaining (only on stage 1)
  useEffect(() => {
    if (showWarning && stageNumber === 0 && !limitLoading) {
      toast({
        title: "⚠️ Atenção - Limite Diário",
        description: `Você tem apenas ${remainingPlays} jogada(s) restante(s) de um total de ${maxDailyPlays} jogadas por dia.`,
        className: "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-500 text-yellow-900 dark:text-yellow-100",
      });
    }
  }, [showWarning, stageNumber, limitLoading]);

  const handleWheelComplete = () => {
    setShowWheel(false);
    setShowChallenge(true);
    setIsTimerRunning(true);
  };

  const handleChallengeComplete = (success: boolean = true) => {
    setIsTimerRunning(false);
    
    if (success) {
      const basePoints = STAGE_BASE_POINTS[stageNumber];
      const timeBonus = Math.floor((30 - timer) * 5);
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
      setShowWheel(true);
      setShowChallenge(false);
      setTimer(0);
      seteChallengeComplete(false);
    } else {
      navigate('/results');
    }
  };

  const handleGoToNextAvailableStage = () => {
    const nextStage = getNextAvailableStage();
    if (nextStage !== null) {
      navigate(`/stage/${nextStage + 1}`);
      setStageAlreadyCompleted(false);
      setShowWheel(true);
      setShowChallenge(false);
      setTimer(0);
      seteChallengeComplete(false);
    } else {
      navigate('/results');
    }
  };

  // If blocked, show daily limit reached message
  if (!limitLoading && isBlocked && stageNumber === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-end gap-2">
            <SettingsMenu />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Winning Game
            </h1>
          </div>

          <SponsorBanner />

          <div className="bg-card border-2 border-yellow-500 rounded-lg p-8 space-y-6 text-center animate-bounce-in">
            <Clock className="w-20 h-20 text-yellow-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Limite Diário Atingido</h2>
            <p className="text-muted-foreground text-lg">
              Você já completou <strong>{playsToday}</strong> jogada(s) hoje.
            </p>
            <p className="text-muted-foreground">
              O número máximo de jogadas por dia é <strong>{maxDailyPlays}</strong>.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-400 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                ⏰ Aguarde o próximo ciclo diário para jogar novamente!
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                O ciclo é renovado à meia-noite.
              </p>
            </div>
            <Button
              variant="outline"
              size="xl"
              onClick={() => navigate('/ranking')}
              className="w-full"
            >
              VER RANKING
            </Button>
            <Button
              variant="game"
              size="xl"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              VOLTAR AO INÍCIO
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If stage already completed, show message
  if (stageAlreadyCompleted) {
    const nextStage = getNextAvailableStage();
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-end gap-2">
            <SettingsMenu />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Winning Game
            </h1>
            <p className="text-lg text-muted-foreground">Etapa {stageNumber + 1} de 5</p>
          </div>

          <SponsorBanner />
          <PointsDisplay />

          <div className="bg-card border-2 border-orange-500 rounded-lg p-8 space-y-6 text-center animate-bounce-in">
            <AlertTriangle className="w-20 h-20 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Etapa já finalizada</h2>
            <p className="text-muted-foreground text-lg">
              Você já completou esta etapa. Siga para a próxima etapa disponível.
            </p>
            <Button
              variant="game"
              size="xl"
              onClick={handleGoToNextAvailableStage}
              className="w-full"
            >
              {nextStage !== null ? `IR PARA ETAPA ${nextStage + 1}` : 'VER RESULTADOS'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-end gap-2">
          <SettingsMenu />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Winning Game
          </h1>
          <p className="text-lg text-muted-foreground">Etapa {stageNumber + 1} de 5</p>
        </div>

        {/* Warning when 5 or fewer plays remaining */}
        {showWarning && stageNumber === 0 && (
          <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Você tem apenas <strong>{remainingPlays}</strong> jogada(s) restante(s) de um total de <strong>{maxDailyPlays}</strong> por dia.
            </AlertDescription>
          </Alert>
        )}

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
              <TetrisShooter 
                onComplete={handleChallengeComplete} 
                timeLimit={45}
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

      </div>
    </div>
  );
}
