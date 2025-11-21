import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, Award, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';

interface Sponsor {
  id: string;
  name: string;
  city: string;
  logo_url: string;
  prize_description: string;
  phone: string;
  prize_count: number;
}

export default function SponsorSelection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setSelectedSponsor } = useGame();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    checkAuthAndLoadSponsors();
  }, []);

  const checkAuthAndLoadSponsors = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      await loadSponsors();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar autenticação.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  const loadSponsors = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast para garantir que todos os campos existam
      const sponsorsWithDefaults = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name || '',
        city: s.city || '',
        logo_url: s.logo_url,
        prize_description: s.prize_description,
        phone: s.phone,
        prize_count: s.prize_count || 1
      }));
      
      setSponsors(sponsorsWithDefaults);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar patrocinadores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSponsor = async (sponsor: Sponsor) => {
    setSelecting(true);
    
    try {
      setSelectedSponsor(sponsor);
      
      toast({
        title: "Patrocinador Selecionado!",
        description: `Você escolheu ${sponsor.name}`,
      });

      // Navegar para a primeira etapa do jogo
      navigate('/stage/1');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nenhum Patrocinador</CardTitle>
            <CardDescription>
              Não há patrocinadores cadastrados no momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Escolha seu Patrocinador
          </h1>
          <p className="text-muted-foreground">
            Selecione um patrocinador para começar a jogar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => (
            <Card 
              key={sponsor.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => !selecting && handleSelectSponsor(sponsor)}
            >
              <CardHeader>
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-4">
                  <img 
                    src={sponsor.logo_url} 
                    alt={sponsor.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <CardTitle className="text-xl">{sponsor.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{sponsor.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="w-4 h-4 text-primary" />
                  <span>{sponsor.prize_count} {sponsor.prize_count === 1 ? 'prêmio' : 'prêmios'}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-foreground font-medium">
                    {sponsor.prize_description}
                  </p>
                </div>
                <Button
                  variant="game"
                  className="w-full mt-4"
                  disabled={selecting}
                >
                  {selecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Selecionando...
                    </>
                  ) : (
                    'Selecionar'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
