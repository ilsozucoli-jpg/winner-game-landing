import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SponsorBanner } from '@/components/SponsorBanner';
import { useGame } from '@/contexts/GameContext';
import { Trophy, Star, Award } from 'lucide-react';
import { useEffect } from 'react';
import { useGameMusic } from '@/hooks/useGameMusic';

export default function Results() {
  const navigate = useNavigate();
  const { userData, totalPoints, stagePoints, wheelPoints, resetGame } = useGame();
  
  useGameMusic();

  useEffect(() => {
    if (!userData) {
      navigate('/register');
    }
  }, [userData, navigate]);

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
  );
}
