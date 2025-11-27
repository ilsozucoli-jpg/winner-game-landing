import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PlayerRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

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

      // Pré-preencher com email da sessão
      setFormData(prev => ({
        ...prev,
        email: session.user.email || '',
      }));

      // Verificar se já é patrocinador
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
        navigate('/sponsor-dashboard');
        return;
      }

      // Verificar se já tem dados preenchidos
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone, email')
        .eq('id', session.user.id)
        .single();

      if (profile?.name) {
        // Já tem cadastro, redirecionar para seleção de promoção
        navigate('/sponsor-selection');
      }
    } catch (error: any) {
      console.error('Erro ao verificar autenticação:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verificar novamente se não é patrocinador
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
        setLoading(false);
        return;
      }

      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: formData.name, 
          phone: formData.phone, 
          email: formData.email 
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: "Cadastro realizado!",
        description: `Bem-vindo, ${formData.name}!`,
        className: "bg-success text-success-foreground",
      });

      navigate('/sponsor-selection');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-6 animate-slide-up">
        <Button
          variant="ghost"
          onClick={() => navigate('/role-selection')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center space-y-2">
          <Trophy className="w-16 h-16 text-primary mx-auto animate-pulse-glow" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Cadastro de Jogador
          </h1>
          <p className="text-muted-foreground">
            Complete seus dados para começar a jogar
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Celular *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background"
                required
              />
            </div>

            <Alert>
              <AlertDescription>
                Estes dados serão utilizados para contato em caso de premiação.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              variant="game" 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'CONTINUAR'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
