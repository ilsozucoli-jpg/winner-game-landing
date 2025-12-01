import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Store, Phone, Mail, MapPin, Calendar, Trophy, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  name: string;
  prize_description: string;
  prize_count: number;
  promotion_end_date: string;
  phone: string;
  logo_url: string;
}

export default function SponsorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [expiredPromotions, setExpiredPromotions] = useState<Promotion[]>([]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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

  const renderPromotionCard = (promotion: Promotion) => (
    <Card 
      key={promotion.id} 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/ranking?sponsor_id=${promotion.id}`)}
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
                  onClick={() => navigate(`/create-promotion?sponsor_id=${sponsorData.id}`)} 
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">
                    Ativas ({activePromotions.length})
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
      </div>
    </div>
  );
}
