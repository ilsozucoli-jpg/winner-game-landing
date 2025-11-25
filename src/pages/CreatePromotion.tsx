import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';

export default function CreatePromotion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [formData, setFormData] = useState({
    prize_description: '',
    prize_count: 1,
    promotion_end_date: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    verifySponsorStatus();
  }, []);

  const verifySponsorStatus = async () => {
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

      if (data.status !== 'approved') {
        toast({
          title: "Acesso negado",
          description: "Seu cadastro precisa estar aprovado para cadastrar promoções.",
          variant: "destructive",
        });
        navigate('/sponsor-dashboard');
        return;
      }

      setSponsorData(data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível verificar seus dados.",
        variant: "destructive",
      });
      navigate('/sponsor-dashboard');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // Verify sponsor is approved before proceeding
      if (sponsorData.status !== 'approved') {
        throw new Error('Seu cadastro precisa estar aprovado para cadastrar promoções');
      }

      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('sponsor-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('sponsor-logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Insert sponsor data
      const { error } = await supabase
        .from('sponsors')
        .insert({
          user_id: session.user.id,
          name: sponsorData.company,
          phone: sponsorData.phone,
          logo_url: logoUrl,
          prize_description: formData.prize_description,
          prize_count: formData.prize_count,
          promotion_end_date: formData.promotion_end_date,
        });

      if (error) {
        console.error('Erro ao inserir promoção:', error);
        throw new Error(error.message || 'Erro ao cadastrar promoção');
      }

      toast({
        title: "Sucesso!",
        description: "Promoção cadastrada com sucesso.",
      });

      navigate('/sponsor-dashboard');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cadastrar a promoção.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/sponsor-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Promoção</CardTitle>
            <CardDescription>
              Preencha os dados da promoção que será oferecida aos jogadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa/Promotor</Label>
                <Input
                  id="company"
                  value={sponsorData?.company || ''}
                  disabled
                  className="bg-white dark:bg-white text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Celular *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={sponsorData?.phone || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa (opcional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prize_description">Descrição do Prêmio *</Label>
                <Textarea
                  id="prize_description"
                  value={formData.prize_description}
                  onChange={(e) =>
                    setFormData({ ...formData, prize_description: e.target.value })
                  }
                  placeholder="Descreva o prêmio oferecido..."
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prize_count">Quantidade de Prêmios *</Label>
                <Input
                  id="prize_count"
                  type="number"
                  min="1"
                  value={formData.prize_count}
                  onChange={(e) =>
                    setFormData({ ...formData, prize_count: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion_end_date">Data de Término da Promoção</Label>
                <Input
                  id="promotion_end_date"
                  type="date"
                  value={formData.promotion_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, promotion_end_date: e.target.value })
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar Promoção'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
