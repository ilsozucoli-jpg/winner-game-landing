import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Phone, Mail, MapPin, Calendar, Trophy, AlertCircle, Plus, Image, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  name: string;
  prize_description: string;
  prize_count: number;
  promotion_end_date: string;
  phone: string;
  logo_url: string;
  city?: string;
  state?: string;
  created_at?: string;
}

interface PendingPromotion {
  id: string;
  name: string | null;
  prize_description: string;
  prize_count: number;
  promotion_end_date: string | null;
  phone: string;
  logo_url: string | null;
  city?: string | null;
  state?: string | null;
  status: string;
  created_at: string;
}

interface RankingPlayer {
  player_name: string;
  player_email: string;
  player_phone: string;
  points: number;
  completed_at: string;
}

export default function SponsorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [expiredPromotions, setExpiredPromotions] = useState<Promotion[]>([]);
  const [pendingPromotions, setPendingPromotions] = useState<PendingPromotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [rankingPlayers, setRankingPlayers] = useState<RankingPlayer[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => {
    loadSponsorData();
  }, []);

  useEffect(() => {
    if (sponsorData?.validity_date) {
      const validityDate = new Date(sponsorData.validity_date);
      const now = new Date();
      
      if (validityDate < now) {
        toast({
          title: "Atenção",
          description: "Sua validade expirou, validar novamente seu período de cadastro.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  }, [sponsorData, toast]);

  const loadSponsorData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('sponsor_registrations')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      setSponsorData(data);
      
      // Load promotions
      await loadPromotions(session.user.id);
      await loadPendingPromotions(session.user.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive",
      });
      console.error('Error loading sponsor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromotions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const now = new Date();
      const active = data?.filter(promo => 
        promo.promotion_end_date && new Date(promo.promotion_end_date) >= now
      ) || [];
      const expired = data?.filter(promo => 
        promo.promotion_end_date && new Date(promo.promotion_end_date) < now
      ) || [];

      setActivePromotions(active);
      setExpiredPromotions(expired);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const loadPendingPromotions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pending_promotions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingPromotions(data || []);
    } catch (error) {
      console.error('Error loading pending promotions:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCreatePromotion = async () => {
    try {
      const { data: setting, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'promotions_registration_enabled')
        .single();

      if (error) throw error;

      const isEnabled = (setting?.setting_value as { enabled: boolean })?.enabled ?? true;

      if (!isEnabled) {
        toast({
          title: "Cadastro Bloqueado",
          description: "O cadastro de novas promoções está temporariamente bloqueado.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/create-promotion?sponsor_id=${sponsorData.id}`);
    } catch (error) {
      console.error('Error checking promotion status:', error);
      navigate(`/create-promotion?sponsor_id=${sponsorData.id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      approved: { label: 'Aprovado', variant: 'default' },
      rejected: { label: 'Rejeitado', variant: 'destructive' },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Não definida';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return 'Não definida';
    return new Date(date).toLocaleString('pt-BR');
  };

  const isValidityExpired = () => {
    if (!sponsorData?.validity_date) return false;
    return new Date(sponsorData.validity_date) < new Date();
  };

  const handlePromotionClick = async (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setLoadingRanking(true);
    try {
      const rankingLimit = promotion.prize_count + 10;
      const { data, error } = await supabase
        .from('game_results')
        .select('player_name, player_email, player_phone, points, completed_at')
        .eq('sponsor_id', promotion.id)
        .order('points', { ascending: false })
        .limit(rankingLimit);

      if (error) throw error;

      // Filter to keep only highest score per player
      const uniquePlayers = new Map<string, RankingPlayer>();
      data?.forEach(player => {
        const existing = uniquePlayers.get(player.player_email);
        if (!existing || player.points > existing.points) {
          uniquePlayers.set(player.player_email, player);
        }
      });

      setRankingPlayers(Array.from(uniquePlayers.values()).sort((a, b) => b.points - a.points));
    } catch (error) {
      console.error('Error loading ranking:', error);
    } finally {
      setLoadingRanking(false);
    }
  };

  const isPromotionExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const renderPromotionCard = (promotion: Promotion) => (
    <Card 
      key={promotion.id} 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => handlePromotionClick(promotion)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{promotion.name || 'Promoção'}</CardTitle>
            <CardDescription>
              Término: {formatDateTime(promotion.promotion_end_date)}
            </CardDescription>
          </div>
          <Trophy className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm"><strong>Prêmio:</strong> {promotion.prize_description}</p>
          <p className="text-sm"><strong>Quantidade:</strong> {promotion.prize_count}</p>
          <p className="text-sm"><strong>Contato:</strong> {promotion.phone}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sponsorData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nenhum cadastro encontrado</CardTitle>
            <CardDescription>Você ainda não possui um cadastro de promotor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/sponsor-register')} className="w-full">
              Cadastrar como Promotor
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tela do Patrocinador</h1>
          <Button onClick={handleLogout} variant="outline">
            Sair
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{sponsorData.company}</CardTitle>
                <CardDescription>{sponsorData.name}</CardDescription>
              </div>
              {getStatusBadge(sponsorData.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{sponsorData.phone || 'Não informado'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{sponsorData.email || 'Não informado'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {sponsorData.address}, {sponsorData.city} - {sponsorData.state}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Validade: {formatDate(sponsorData.validity_date)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plano:</span>
                  <span className="text-sm font-medium">{sponsorData.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-sm font-medium">
                    R$ {sponsorData.plan_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {sponsorData.status === 'approved' && (
              <div className="pt-4 space-y-2">
                {isValidityExpired() && (
                  <Button 
                    onClick={() => navigate('/sponsor-register', { 
                      state: { 
                        renewalData: {
                          name: sponsorData.name,
                          address: sponsorData.address,
                          city: sponsorData.city,
                          state: sponsorData.state,
                          company: sponsorData.company,
                          phone: sponsorData.phone,
                          email: sponsorData.email,
                        }
                      } 
                    })} 
                    className="w-full animate-pulse bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    size="lg"
                    variant="destructive"
                  >
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Renovar Período
                  </Button>
                )}
                
                <Button 
                  onClick={handleCreatePromotion} 
                  className="w-full"
                  size="lg"
                  disabled={isValidityExpired()}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Cadastrar Promoção
                </Button>
              </div>
            )}

            {sponsorData.status === 'pending' && (
              <div className="pt-4 text-center text-sm text-muted-foreground">
                Seu cadastro está em análise. Aguarde aprovação para cadastrar promoções.
              </div>
            )}

            {sponsorData.status === 'rejected' && (
              <div className="pt-4 text-center text-sm text-destructive">
                Seu cadastro foi rejeitado. Entre em contato com o administrador.
              </div>
            )}
          </CardContent>
        </Card>

        {sponsorData.status === 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle>Minhas Promoções</CardTitle>
              <CardDescription>Visualize e gerencie suas promoções cadastradas</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">
                    Ativas ({activePromotions.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pendentes ({pendingPromotions.length})
                  </TabsTrigger>
                  <TabsTrigger value="expired">
                    Vencidas ({expiredPromotions.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-4 mt-4">
                  {activePromotions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma promoção ativa no momento
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {activePromotions.map(renderPromotionCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4 mt-4">
                  {pendingPromotions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma promoção aguardando aprovação
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {pendingPromotions.map((promotion) => (
                        <Card key={promotion.id} className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{promotion.name || 'Promoção'}</CardTitle>
                                <CardDescription>
                                  Criada em: {formatDateTime(promotion.created_at)}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary" className="bg-yellow-500 text-white">
                                Aguardando Aprovação
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm"><strong>Prêmio:</strong> {promotion.prize_description}</p>
                              <p className="text-sm"><strong>Quantidade:</strong> {promotion.prize_count}</p>
                              <p className="text-sm"><strong>Contato:</strong> {promotion.phone}</p>
                              {promotion.promotion_end_date && (
                                <p className="text-sm"><strong>Término:</strong> {formatDateTime(promotion.promotion_end_date)}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="expired" className="space-y-4 mt-4">
                  {expiredPromotions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma promoção vencida
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {expiredPromotions.map(renderPromotionCard)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Promotion Detail Modal */}
        <Dialog open={!!selectedPromotion} onOpenChange={(open) => !open && setSelectedPromotion(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {selectedPromotion?.name || 'Detalhes da Promoção'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedPromotion && (
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6">
                  {/* Promotion Details */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      {selectedPromotion.logo_url && (
                        <img 
                          src={selectedPromotion.logo_url} 
                          alt="Logo" 
                          className="w-20 h-20 object-contain rounded-lg border"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <Badge variant={isPromotionExpired(selectedPromotion.promotion_end_date) ? "destructive" : "default"}>
                          {isPromotionExpired(selectedPromotion.promotion_end_date) ? "Vencida" : "Ativa"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {selectedPromotion.city && selectedPromotion.state 
                            ? `${selectedPromotion.city} - ${selectedPromotion.state}` 
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Prêmio</p>
                          <p className="text-sm font-medium">{selectedPromotion.prize_description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Quantidade de Prêmios</p>
                          <p className="text-sm font-medium">{selectedPromotion.prize_count}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Contato</p>
                          <p className="text-sm font-medium">{selectedPromotion.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Término</p>
                          <p className="text-sm font-medium">{formatDateTime(selectedPromotion.promotion_end_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ranking Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Ranking de Jogadores
                    </h3>
                    
                    {loadingRanking ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : rankingPlayers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum jogador participou desta promoção ainda.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {rankingPlayers.map((player, index) => {
                          const isWinner = index < selectedPromotion.prize_count;
                          return (
                            <div 
                              key={`${player.player_email}-${index}`}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                isWinner ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-orange-600 text-white' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{player.player_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{player.player_phone}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary">{player.points} pts</p>
                                {isWinner && (
                                  <Badge variant="default" className="text-xs">Premiado</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
