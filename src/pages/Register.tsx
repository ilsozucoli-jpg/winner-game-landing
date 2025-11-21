import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SponsorBanner } from '@/components/SponsorBanner';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Settings, LogOut } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { setUserData, userData } = useGame();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUser(session.user);

    // Verificar se é admin
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);

    // Carregar dados do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile?.name) {
      setUserData({ 
        name: profile.name, 
        phone: profile.phone || '', 
        email: profile.email || session.user.email || '' 
      });
      navigate('/stage/1');
    }
  };

  useEffect(() => {
    if (userData) {
      navigate('/stage/1');
    }
  }, [userData, navigate]);

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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({ name: formData.name, phone: formData.phone, email: formData.email })
        .eq('id', session.user.id);

      if (error) throw error;

      setUserData(formData);
      toast({
        title: "Cadastro realizado!",
        description: `Bem-vindo, ${formData.name}!`,
        className: "bg-success text-success-foreground",
      });
      navigate('/stage/1');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-6 animate-slide-up">
        {isAdmin && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Painel Admin
            </Button>
          </div>
        )}

        <div className="text-center space-y-2">
          <Trophy className="w-16 h-16 text-primary mx-auto animate-pulse-glow" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Winning Game
          </h1>
        </div>

        <SponsorBanner />

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">Cadastro</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background"
              />
            </div>

            <Button type="submit" variant="game" size="lg" className="w-full">
              COMEÇAR JOGO
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
