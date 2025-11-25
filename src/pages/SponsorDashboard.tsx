import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SponsorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sponsorData, setSponsorData] = useState<any>(null);

  useEffect(() => {
    loadSponsorData();
  }, []);

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard do Promotor</h1>
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
              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/create-promotion')} 
                  className="w-full"
                  size="lg"
                >
                  <Store className="mr-2 h-5 w-5" />
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
      </div>
    </div>
  );
}
