import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, Home, Building2 } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { SponsorBanner } from '@/components/SponsorBanner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RankingEntry {
  id: string;
  player_name: string;
  points: number;
  completed_at: string;
}

export default function Ranking() {
  const navigate = useNavigate();
  const { selectedSponsor, resetGame } = useGame();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedSponsor) {
      navigate('/sponsor-selection');
      return;
    }

    fetchRankings();
  }, [selectedSponsor, navigate]);

  const fetchRankings = async () => {
    if (!selectedSponsor) return;

    try {
      const { data, error } = await supabase
        .from('game_results')
        .select('id, player_name, points, completed_at')
        .eq('sponsor_id', selectedSponsor.id)
        .order('points', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRankings(data || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    resetGame();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        <div className="text-center space-y-4">
          <Trophy className="w-20 h-20 text-accent mx-auto animate-pulse-glow" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Ranking de Jogadores
          </h1>
        </div>

        <SponsorBanner />

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Top 10 Jogadores
          </h2>

          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando ranking...
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhum jogador registrado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    index === 0
                      ? 'bg-gradient-primary border-primary shadow-glow'
                      : index === 1
                      ? 'bg-accent/10 border-accent'
                      : index === 2
                      ? 'bg-accent/5 border-accent/50'
                      : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? 'bg-primary-foreground text-primary'
                          : index === 1
                          ? 'bg-accent text-accent-foreground'
                          : index === 2
                          ? 'bg-accent/50 text-accent-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-bold text-lg ${
                          index === 0
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {entry.player_name}
                      </p>
                      <p
                        className={`text-sm ${
                          index === 0
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {format(new Date(entry.completed_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      index === 0
                        ? 'text-primary-foreground'
                        : 'text-primary'
                    }`}
                  >
                    {entry.points.toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            size="xl"
            onClick={() => navigate('/results')}
            className="w-full"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            VOLTAR
          </Button>
          <Button
            variant="outline"
            size="xl"
            onClick={() => navigate('/sponsor-selection')}
            className="w-full"
          >
            <Building2 className="w-5 h-5 mr-2" />
            OUTRO PATROCINADOR
          </Button>
          <Button
            variant="game"
            size="xl"
            onClick={handleGoHome}
            className="w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            INÍCIO
          </Button>
        </div>
      </div>
    </div>
  );
}
