import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SponsorBanner } from '@/components/SponsorBanner';
import { useGame } from '@/contexts/GameContext';
import { Trophy, Star, Award, Medal, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGameMusic } from '@/hooks/useGameMusic';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Results() {
  const navigate = useNavigate();
  const { userData, totalPoints, stagePoints, wheelPoints, resetGame, selectedSponsor } = useGame();
  const [rankingPosition, setRankingPosition] = useState<number | null>(null);
  const [isClassified, setIsClassified] = useState<boolean | null>(null);
  
  useGameMusic();

  useEffect(() => {
    if (!userData) {
      navigate('/register');
      return;
    }
    
    saveGameResult();
  }, [userData, navigate]);

  const checkRankingPosition = async () => {
    if (!userData || !selectedSponsor) return;

    try {
      // Limite = quantidade de prêmios + 10
      const rankingLimit = (selectedSponsor.prize_count || 0) + 10;
      
      const { data: topResults, error } = await supabase
        .from('game_results')
        .select('player_name, points')
        .eq('sponsor_id', selectedSponsor.id)
        .order('points', { ascending: false })
        .limit(rankingLimit);

      if (error) throw error;

      if (topResults) {
        const position = topResults.findIndex(r => r.player_name === userData.name);
        if (position !== -1) {
          setRankingPosition(position + 1);
          // Classificado se estiver dentro do número de prêmios
          setIsClassified(position < (selectedSponsor.prize_count || 0));
        } else {
          setIsClassified(false);
        }
      }
    } catch (error) {
      console.error('Error checking ranking position:', error);
    }
  };

  const saveGameResult = async () => {
    if (!userData || !selectedSponsor) return;

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // Check if player already has a result for this sponsor
      const { data: existingResults, error: fetchError } = await supabase
        .from('game_results')
        .select('id, points')
        .eq('player_name', userData.name)
        .eq('sponsor_id', selectedSponsor.id);

      if (fetchError) throw fetchError;

      if (existingResults && existingResults.length > 0) {
        // Update only if current score is higher
        const existingResult = existingResults[0];
        if (totalPoints > existingResult.points) {
          const { error: updateError } = await supabase
            .from('game_results')
            .update({
              points: totalPoints,
              completed_at: new Date().toISOString(),
              player_phone: userData.phone,
              player_email: userData.email,
              user_id: userId,
            })
            .eq('id', existingResult.id);

          if (updateError) throw updateError;
          toast({
            title: "Novo recorde!",
            description: "Sua pontuação foi atualizada no ranking.",
          });
        }
      } else {
        // Insert new result
        const { error: insertError } = await supabase
          .from('game_results')
          .insert({
            player_name: userData.name,
            player_phone: userData.phone,
            player_email: userData.email,
            sponsor_id: selectedSponsor.id,
            points: totalPoints,
            completed_at: new Date().toISOString(),
            user_id: userId,
          });

        if (insertError) throw insertError;
        toast({
          title: "Resultado salvo!",
          description: "Sua pontuação foi registrada no ranking.",
        });
      }

      // Verificar posição no ranking após salvar
      await checkRankingPosition();
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        <div className="text-center space-y-4">
          <Trophy className="w-24 h-24 text-accent mx-auto animate-pulse-glow" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Parabéns, {userData?.name}!
          </h1>
          <p className="text-xl text-muted-foreground">Você completou todas as etapas!</p>
        </div>

        <SponsorBanner />

        <div className="bg-gradient-primary rounded-lg p-8 text-center space-y-4 shadow-glow">
          <Award className="w-16 h-16 text-primary-foreground mx-auto" />
          <h2 className="text-2xl font-bold text-primary-foreground">Pontuação Final</h2>
          <div className="text-6xl font-bold text-primary-foreground animate-pulse-glow">
            {totalPoints.toLocaleString('pt-BR')}
          </div>
          <p className="text-primary-foreground/80">pontos conquistados</p>
        </div>

        {/* Mensagem de classificação */}
        {isClassified !== null && (
          <div className={`rounded-lg p-6 text-center space-y-2 ${
            isClassified 
              ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' 
              : 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500'
          }`}>
            {isClassified ? (
              <>
                <Trophy className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto" />
                <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                  Parabéns! Você está classificado!
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  Você está na {rankingPosition}ª posição do ranking!
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto" />
                <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300">
                  Bom jogo, mas você ainda não atingiu a classificação, tente novamente!
                </h3>
                <p className="text-amber-600 dark:text-amber-400 font-semibold">
                  Boa sorte!
                </p>
              </>
            )}
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Desempenho por Etapa
          </h3>
          
          <div className="space-y-3">
            {stagePoints.map((points, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-white/90 rounded-lg border border-primary/20">
                  <span className="font-semibold text-foreground">Etapa {index + 1}</span>
                  <span className="text-primary font-bold">{points.toLocaleString('pt-BR')} pts</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-white/70 rounded-lg border border-accent/20 text-sm">
                  <span className="text-foreground/70">Pontos da Roleta:</span>
                  <span className="text-accent font-semibold">{wheelPoints[index].toLocaleString('pt-BR')} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Seus Dados</h3>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Nome:</span> {userData?.name}
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Celular:</span> {userData?.phone}
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">E-mail:</span> {userData?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="xl"
            onClick={() => navigate('/ranking')}
            className="w-full"
          >
            <Medal className="w-5 h-5 mr-2" />
            VER RANKING
          </Button>
          <Button
            variant="game"
            size="xl"
            onClick={() => {
              resetGame();
              window.location.href = '/';
            }}
            className="w-full"
          >
            JOGAR NOVAMENTE
          </Button>
        </div>
      </div>
    </div>
  );
}
