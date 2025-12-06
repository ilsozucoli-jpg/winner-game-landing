import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trophy, ArrowLeft, Loader2, GamepadIcon, Gift, Award, AlertTriangle, Clock, MapPin, Phone, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, differenceInDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Participation {
  id: string;
  sponsor_id: string;
  points: number;
  completed_at: string;
  is_winner: boolean | null;
  prize_claimed_at: string | null;
  sponsor: {
    id: string;
    name: string | null;
    logo_url: string | null;
    prize_description: string;
    phone: string;
    city: string | null;
    state: string | null;
    prize_count: number;
    promotion_end_date: string | null;
  } | null;
  rankingPosition?: number;
  isPromotionEnded?: boolean;
  isWinnerByRanking?: boolean;
}

interface CertificateData {
  participation: Participation;
  isExpired: boolean;
  daysRemaining: number;
}

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [wonPrizes, setWonPrizes] = useState<Participation[]>([]);
  const [playerProfile, setPlayerProfile] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Carregar perfil do jogador
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, phone')
        .eq('id', session.user.id)
        .single();

      if (!profile?.name) {
        navigate('/player-register');
        return;
      }

      setPlayerProfile(profile);

      // Carregar participações do jogador usando email do profile
      const { data: results, error } = await supabase
        .from('game_results')
        .select(`
          id,
          sponsor_id,
          points,
          completed_at,
          is_winner,
          prize_claimed_at
        `)
        .eq('player_email', profile.email)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos sponsors separadamente
      const sponsorIds = [...new Set((results || []).map(r => r.sponsor_id))];
      
      let sponsorsMap: Record<string, any> = {};
      if (sponsorIds.length > 0) {
        const { data: sponsors } = await supabase
          .from('sponsors')
          .select('id, name, logo_url, prize_description, phone, city, state, prize_count, promotion_end_date')
          .in('id', sponsorIds);
        
        if (sponsors) {
          sponsorsMap = sponsors.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
        }
      }

      // Para cada promoção encerrada, verificar posição no ranking
      const processedResults: Participation[] = [];
      
      for (const r of (results || [])) {
        const sponsor = sponsorsMap[r.sponsor_id] || null;
        const isPromotionEnded = sponsor?.promotion_end_date 
          ? new Date(sponsor.promotion_end_date) < new Date() 
          : false;
        
        let rankingPosition: number | undefined;
        let isWinnerByRanking = false;
        
        // Se a promoção encerrou, buscar posição no ranking
        if (isPromotionEnded && sponsor) {
          const { data: ranking } = await supabase
            .from('game_results')
            .select('player_email, points')
            .eq('sponsor_id', r.sponsor_id)
            .order('points', { ascending: false });
          
          if (ranking) {
            // Agrupar por email e pegar melhor pontuação
            const playerBestScores = new Map<string, number>();
            ranking.forEach(entry => {
              const current = playerBestScores.get(entry.player_email) || 0;
              if (entry.points > current) {
                playerBestScores.set(entry.player_email, entry.points);
              }
            });
            
            // Ordenar por pontuação
            const sortedPlayers = Array.from(playerBestScores.entries())
              .sort((a, b) => b[1] - a[1]);
            
            // Encontrar posição do jogador atual
            const playerPosition = sortedPlayers.findIndex(([email]) => email === profile.email);
            if (playerPosition !== -1) {
              rankingPosition = playerPosition + 1;
              // Verificar se está entre os vencedores
              isWinnerByRanking = rankingPosition <= (sponsor.prize_count || 1);
            }
          }
        }
        
        processedResults.push({
          ...r,
          sponsor,
          rankingPosition,
          isPromotionEnded,
          isWinnerByRanking
        });
      }

      setParticipations(processedResults);
      setWonPrizes(processedResults.filter(r => r.is_winner === true || r.isWinnerByRanking === true));

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCertificate = (participation: Participation) => {
    const completedDate = new Date(participation.completed_at);
    const expirationDate = addMonths(completedDate, 1);
    const now = new Date();
    const isExpired = now > expirationDate;
    const daysRemaining = differenceInDays(expirationDate, now);

    setSelectedCertificate({
      participation,
      isExpired,
      daysRemaining: Math.max(0, daysRemaining),
    });
    setCertificateOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Início
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </div>

        <div className="text-center space-y-2">
          <Trophy className="w-16 h-16 text-primary mx-auto animate-pulse-glow" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Olá, {playerProfile?.name}!
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas participações e prêmios
          </p>
        </div>

        {/* Alerta de prêmios ganhos */}
        {wonPrizes.length > 0 && (
          <Alert className="border-accent bg-accent/10">
            <Gift className="h-5 w-5 text-accent" />
            <AlertTitle className="text-accent font-bold">
              Parabéns! Você tem prêmios ganhos!
            </AlertTitle>
            <AlertDescription className="text-foreground">
              Verifique seus prêmios abaixo e entre em contato com o patrocinador para retirá-los.
            </AlertDescription>
          </Alert>
        )}

        {/* Botões principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="game"
            size="xl"
            className="h-24 text-lg"
            onClick={() => navigate('/sponsor-selection')}
          >
            <GamepadIcon className="w-8 h-8 mr-3" />
            JOGAR
          </Button>

          <Button
            variant={participations.length > 0 ? "outline" : "secondary"}
            size="xl"
            className="h-24 text-lg"
            disabled={participations.length === 0}
            onClick={() => {
              const section = document.getElementById('participations-section');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Award className="w-8 h-8 mr-3" />
            {participations.length > 0 
              ? `MINHAS PARTICIPAÇÕES (${participations.length})` 
              : 'MINHAS PARTICIPAÇÕES'
            }
          </Button>
        </div>

        {participations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground font-medium">
                Você ainda não tem participação em prêmios.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "JOGAR" para começar a participar!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Prêmios Ganhos */}
        {wonPrizes.length > 0 && (
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Gift className="w-6 h-6" />
                Prêmios Ganhos
              </CardTitle>
              <CardDescription>
                Clique em um prêmio para ver o certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {wonPrizes.map((prize) => {
                const completedDate = new Date(prize.completed_at);
                const expirationDate = addMonths(completedDate, 1);
                const isExpired = new Date() > expirationDate;

                return (
                  <div
                    key={prize.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      isExpired 
                        ? 'bg-muted/50 border-muted-foreground/30 opacity-60' 
                        : 'bg-accent/10 border-accent hover:bg-accent/20'
                    }`}
                    onClick={() => handleOpenCertificate(prize)}
                  >
                    <div className="flex items-center gap-4">
                      {prize.sponsor?.logo_url && (
                        <img 
                          src={prize.sponsor.logo_url} 
                          alt={prize.sponsor.name || 'Patrocinador'} 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-bold ${isExpired ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {prize.sponsor?.name || 'Promoção'}
                        </h3>
                        <p className={`text-sm ${isExpired ? 'text-muted-foreground' : 'text-foreground/80'}`}>
                          {prize.sponsor?.prize_description}
                        </p>
                        {isExpired ? (
                          <p className="text-sm text-destructive font-medium mt-1">
                            ⚠️ Prêmio já venceu a validade, indisponível.
                          </p>
                        ) : (
                          <p className="text-sm text-accent font-medium mt-1">
                            📅 Validade: {format(expirationDate, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {prize.points.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">pontos</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Todas as Participações */}
        {participations.length > 0 && (
          <Card id="participations-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Minhas Participações
              </CardTitle>
              <CardDescription>
                Resumo de todas as suas participações em promoções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {participations.map((participation) => {
                const isWinner = participation.is_winner || participation.isWinnerByRanking;
                
                return (
                  <div
                    key={participation.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isWinner && participation.isPromotionEnded
                        ? 'bg-accent/10 border-accent'
                        : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {participation.sponsor?.logo_url && (
                        <img 
                          src={participation.sponsor.logo_url} 
                          alt={participation.sponsor.name || 'Patrocinador'} 
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">
                            {participation.sponsor?.name || 'Promoção'}
                          </h3>
                          {participation.isPromotionEnded && (
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                              ENCERRADA
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {participation.sponsor?.prize_description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Jogado em: {format(new Date(participation.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {participation.rankingPosition && participation.isPromotionEnded && (
                          <p className="text-xs text-primary mt-1">
                            Posição no ranking: {participation.rankingPosition}º lugar
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {participation.points.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">pontos</div>
                      </div>
                    </div>
                    
                    {/* Aviso de vitória para promoção encerrada */}
                    {isWinner && participation.isPromotionEnded && (
                      <div className="mt-4 pt-4 border-t border-accent/30">
                        <div className="text-center mb-3">
                          <p className="text-2xl font-black text-accent uppercase tracking-wide animate-pulse">
                            🏆 VOCÊ VENCEU! 🎉
                          </p>
                          <p className="text-lg font-bold text-accent">
                            você venceu
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleOpenCertificate(participation)}
                        >
                          <Award className="w-5 h-5 mr-2" />
                          EMITIR COMPROVANTE DE VITÓRIA
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Dialog do Certificado */}
        <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-center justify-center">
                <Award className="w-6 h-6 text-accent" />
                Certificado de Prêmio
              </DialogTitle>
            </DialogHeader>

            {selectedCertificate && (
              <div className="space-y-6">
                {selectedCertificate.isExpired ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Prêmio Expirado</AlertTitle>
                    <AlertDescription>
                      Prêmio já venceu a validade, indisponível para retirada.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {/* Certificado */}
                    <div className="border-4 border-accent rounded-lg p-6 bg-gradient-to-br from-accent/5 to-primary/5">
                      <div className="text-center space-y-4">
                        <Trophy className="w-16 h-16 text-accent mx-auto" />
                        <h2 className="text-2xl font-bold text-foreground">
                          CERTIFICADO DE VENCEDOR
                        </h2>
                        
                        <div className="py-4 border-t border-b border-border">
                          <p className="text-lg">
                            <span className="font-bold text-primary">{playerProfile?.name}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ganhou o prêmio
                          </p>
                          <p className="text-xl font-bold text-accent mt-2">
                            {selectedCertificate.participation.sponsor?.prize_description}
                          </p>
                        </div>

                        <div className="space-y-2 text-left">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="font-medium">Patrocinador:</span>
                            <span>{selectedCertificate.participation.sponsor?.name || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-primary" />
                            <span className="font-medium">Contato:</span>
                            <span>{selectedCertificate.participation.sponsor?.phone}</span>
                          </div>

                          {(selectedCertificate.participation.sponsor?.city || selectedCertificate.participation.sponsor?.state) && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="font-medium">Local:</span>
                              <span>
                                {[selectedCertificate.participation.sponsor?.city, selectedCertificate.participation.sponsor?.state]
                                  .filter(Boolean)
                                  .join(' - ')}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-medium">Validade:</span>
                            <span className={selectedCertificate.daysRemaining <= 7 ? 'text-destructive font-bold' : ''}>
                              {selectedCertificate.daysRemaining} dias restantes
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground mt-4">
                          Data da vitória: {format(new Date(selectedCertificate.participation.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {/* Instruções */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-accent" />
                        Instruções para Retirada
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Validade de <strong>1 mês</strong> para retirar o prêmio</li>
                        <li>Retirar o prêmio <strong>somente no local da promoção</strong></li>
                        <li>Exibir este certificado para retirar o prêmio</li>
                        <li>Entre em contato com o patrocinador pelo telefone acima</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
