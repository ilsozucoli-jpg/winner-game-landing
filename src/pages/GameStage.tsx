import { useState, useEffect, useRef } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { generateStageToken } from '@/lib/gameTokens';

const STAGE_BASE_POINTS = [100, 200, 300, 400, 500];

interface GameParam {
  max_score: number;
  max_time_seconds: number;
}

export default function GameStage() {
  const { stage } = useParams<{ stage: string }>();
  const stageNumber = parseInt(stage || '1') - 1;
  const navigate = useNavigate();
  const { addPoints, addStagePoints, userData, setUserData, setSelectedSponsor, resetGame, gamePlayId } = useGame();
  const { toast } = useToast();
  const { playsToday, maxDailyPlays, remainingPlays, isBlocked, showWarning, loading: limitLoading } = useDailyPlayLimit(userData?.name);
  
  const [showWheel, setShowWheel] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [challengeComplete, seteChallengeComplete] = useState(false);
  const [gameParams, setGameParams] = useState<Record<number, GameParam>>({});
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const stageStartedRef = useRef(false);

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

  // Fetch game parameters
  useEffect(() => {
    const fetchParams = async () => {
      const { data } = await supabase
        .from('game_parameters')
        .select('stage_number, max_score, max_time_seconds, stage_type')
        .eq('stage_type', 'game');
      if (data) {
        const map: Record<number, GameParam> = {};
        data.forEach((p: any) => {
          map[p.stage_number] = { max_score: p.max_score, max_time_seconds: p.max_time_seconds };
        });
        setGameParams(map);
      }
    };
    fetchParams();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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

  const triggerViolation = () => {
    setShowViolationDialog(true);
    setIsTimerRunning(false);
    setTimeout(() => {
      resetGame();
      navigate('/sponsor-selection');
    }, 15000);
  };

  const handleViolationOk = () => {
    setShowViolationDialog(false);
    resetGame();
    navigate('/sponsor-selection');
  };

  // Track stage start in game_play
  const trackStageStart = async () => {
    if (!gamePlayId || stageStartedRef.current) return;
    stageStartedRef.current = true;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const stageToken = generateStageToken(session.user.id, stageNumber + 1);
      
      // Update current_stage and stage token
      const { data: currentPlay } = await supabase
        .from('game_play')
        .select('stage_tokens')
        .eq('id', gamePlayId)
        .single();
      
      if (currentPlay) {
        const tokens = [...(currentPlay.stage_tokens as string[])];
        tokens[stageNumber] = stageToken;
        
        await supabase
          .from('game_play')
          .update({
            current_stage: stageNumber + 1,
            stage_tokens: tokens,
          })
          .eq('id', gamePlayId);
      }
    } catch (error) {
      console.error('Error tracking stage start:', error);
    }
  };

  const handleWheelComplete = () => {
    setShowWheel(false);
    setShowChallenge(true);
    setIsTimerRunning(true);
    trackStageStart();
  };

  const checkViolation = (points: number, timeUsed: number): boolean => {
    const stageNum = stageNumber + 1;
    const param = gameParams[stageNum];
    if (!param) return false;
    if (points > param.max_score || timeUsed > param.max_time_seconds) {
      triggerViolation();
      return true;
    }
    return false;
  };

  // Update stage points in game_play
  const trackStageEnd = async (points: number) => {
    if (!gamePlayId) return;
    try {
      const { data: currentPlay } = await supabase
        .from('game_play')
        .select('stage_points')
        .eq('id', gamePlayId)
        .single();
      
      if (currentPlay) {
        const stagePointsArr = [...(currentPlay.stage_points as number[])];
        stagePointsArr[stageNumber] = points;
        
        await supabase
          .from('game_play')
          .update({ stage_points: stagePointsArr })
          .eq('id', gamePlayId);
      }
    } catch (error) {
      console.error('Error tracking stage end:', error);
    }
  };

  const handleChallengeComplete = (success: boolean = true) => {
    setIsTimerRunning(false);
    
    if (success) {
      const basePoints = STAGE_BASE_POINTS[stageNumber];
      const timeBonus = Math.floor((30 - timer) * 5);
      const totalPoints = Math.max(basePoints + timeBonus, basePoints);
      
      if (checkViolation(totalPoints, timer)) return;

      addPoints(totalPoints);
      addStagePoints(stageNumber, totalPoints);
      trackStageEnd(totalPoints);
      
      toast({
        title: "🎯 Etapa Concluída!",
        description: `Você ganhou ${totalPoints} pontos! Tempo: ${timer}s`,
        className: "bg-success text-success-foreground",
      });
    } else {
      trackStageEnd(0);
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
      if (checkViolation(score, timer)) return;

      addPoints(score);
      addStagePoints(stageNumber, score);
      trackStageEnd(score);
      
      toast({
        title: "🎯 Etapa Concluída!",
        description: `Você ganhou ${score} pontos!`,
        className: "bg-success text-success-foreground",
      });
    } else {
      trackStageEnd(0);
      toast({
        title: "Etapa Não Concluída",
        description: "Você não pontuou nesta etapa. Continue para a próxima!",
        className: "bg-muted text-muted-foreground",
      });
    }

    seteChallengeComplete(true);
  };

  const handleNextStage = () => {
    stageStartedRef.current = false;
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

        {/* Violation Dialog */}
        <Dialog open={showViolationDialog} onOpenChange={() => {}}>
          <DialogContent className="bg-yellow-100 border-2 border-yellow-500 max-w-md [&>button]:hidden">
            <div className="text-center space-y-6 py-4">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
              <p className="text-xl font-bold text-destructive">
                Parâmetros de jogo inconsistentes, o jogo será reiniciado.
              </p>
              <Button
                variant="outline"
                size="xl"
                onClick={handleViolationOk}
                className="w-full border-yellow-500 text-yellow-800 hover:bg-yellow-200"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
