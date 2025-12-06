import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verificar se já é patrocinador
      const { data: sponsorData } = await supabase
        .from('sponsor_registrations')
        .select('id, status')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (sponsorData) {
        navigate('/sponsor-dashboard');
        return;
      }

      // Verificar se já é jogador (tem dados no perfil)
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();

      if (profile?.name) {
        navigate('/player-dashboard');
        return;
      }

      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  const handlePlayerSelection = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verificar se usuário já é patrocinador
      const { data: sponsorData } = await supabase
        .from('sponsor_registrations')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (sponsorData) {
        toast({
          title: "Usuário já cadastrado como Patrocinador",
          description: "Este usuário já possui cadastro como patrocinador.",
          variant: "destructive",
        });
        setChecking(false);
        return;
      }

      // Prosseguir para seleção de patrocinador
      navigate('/player-register');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setChecking(false);
    }
  };

  const handleSponsorSelection = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verificar se usuário já é jogador (tem name preenchido)
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();

      if (profile?.name) {
        toast({
          title: "Usuário já cadastrado como jogador",
          description: "Este usuário já possui cadastro como jogador.",
          variant: "destructive",
        });
        setChecking(false);
        return;
      }

      // Prosseguir para cadastro de patrocinador
      navigate('/sponsor-register');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-4xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Escolha seu perfil
          </CardTitle>
          <CardDescription className="text-lg">
            Como você deseja participar do Winning Game?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Button
              variant="outline"
              size="lg"
              className="h-48 flex flex-col gap-4 border-2 hover:border-primary hover:bg-primary/10 transition-all group"
              onClick={handlePlayerSelection}
              disabled={checking}
            >
              <Trophy className="w-20 h-20 text-primary group-hover:scale-110 transition-transform" />
              <div className="space-y-2">
                <div className="font-bold text-2xl">Jogador</div>
                <div className="text-sm text-muted-foreground">
                  Participe dos jogos e concorra a prêmios incríveis
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-48 flex flex-col gap-4 border-2 hover:border-primary hover:bg-primary/10 transition-all group"
              onClick={handleSponsorSelection}
              disabled={checking}
            >
              <Building2 className="w-20 h-20 text-primary group-hover:scale-110 transition-transform" />
              <div className="space-y-2">
                <div className="font-bold text-2xl">Patrocinador</div>
                <div className="text-sm text-muted-foreground">
                  Cadastre sua empresa e promova suas ofertas
                </div>
              </div>
            </Button>
          </div>

          {checking && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Verificando...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
