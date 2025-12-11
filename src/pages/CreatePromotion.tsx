import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const sponsorRegistrationId = searchParams.get('sponsor_id');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const [promotionLimits, setPromotionLimits] = useState<any>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    prize_description: '',
    prize_count: 1,
    promotion_end_date: '',
    city: '',
    state: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    checkUserRoleAndData();
  }, []);

  const checkUserRoleAndData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Carregar configurações do sistema
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('setting_value, setting_key')
        .in('setting_key', ['promotions_registration_enabled', 'promotion_limits']);

      const enabledSetting = settingsData?.find(s => s.setting_key === 'promotions_registration_enabled');
      const limitsSetting = settingsData?.find(s => s.setting_key === 'promotion_limits');

      const settingValue = enabledSetting?.setting_value as { enabled: boolean } | null;
      const enabled = settingValue?.enabled ?? true;
      setPromotionsEnabled(enabled);

      if (limitsSetting?.setting_value) {
        setPromotionLimits(limitsSetting.setting_value);
      }

      // Verificar se é admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const userIsAdmin = !!roleData;
      setIsAdmin(userIsAdmin);

      // Admins podem cadastrar mesmo quando bloqueado
      if (!userIsAdmin && !enabled) {
        toast({
          title: "Cadastros Bloqueados",
          description: "Novos cadastros de promoções estão temporariamente bloqueados.",
          variant: "destructive",
        });
      }

      // Se não for admin, buscar dados do patrocinador
      if (!userIsAdmin) {
        const { data: sponsorReg } = await supabase
          .from('sponsor_registrations')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setSponsorData(sponsorReg);
        
        // Preencher dados do formulário com os dados do patrocinador
        if (sponsorReg) {
          setFormData(prev => ({
            ...prev,
            company_name: sponsorReg.company || '',
            phone: sponsorReg.phone || '',
            city: sponsorReg.city || '',
            state: sponsorReg.state || '',
          }));
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível verificar seus dados.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const getBackRoute = () => {
    return isAdmin ? '/admin-panel' : '/sponsor-dashboard';
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação do logo obrigatório
    if (!logoFile) {
      toast({
        title: "Logo obrigatório",
        description: "Por favor, adicione o logo da empresa.",
        variant: "destructive",
      });
      return;
    }

    // Validação para admin
    if (isAdmin && (!formData.company_name || !formData.phone)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome da empresa e telefone.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // Verificar limite de promoções por mês para patrocinadores (não admins)
      if (!isAdmin && sponsorData) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // Contar promoções aprovadas no mês
        const { count: sponsorsCount } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        // Contar promoções pendentes no mês
        const { count: pendingCount } = await supabase
          .from('pending_promotions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        const totalPromotions = (sponsorsCount || 0) + (pendingCount || 0);

        // Verificar o plano do patrocinador
        const planName = sponsorData.plan?.toLowerCase() || '';
        const isBasicPlan = planName.includes('teste') || planName.includes('test') || planName.includes('básico') || planName.includes('basico');
        const maxPromotions = isBasicPlan 
          ? (promotionLimits?.basic_test_max_promotions ?? 3) 
          : (promotionLimits?.monthly_annual_max_promotions ?? 10);

        if (totalPromotions >= maxPromotions) {
          toast({
            title: "Limite de promoções atingido",
            description: isBasicPlan 
              ? `O plano básico/teste permite no máximo ${maxPromotions} promoções por mês. Você já possui ${totalPromotions}.`
              : `O limite máximo é de ${maxPromotions} promoções por mês. Você já possui ${totalPromotions}.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
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

      // Preparar dados para inserção
      const insertData: any = {
        user_id: session.user.id,
        name: isAdmin ? formData.company_name : (sponsorData?.company || formData.company_name),
        phone: isAdmin ? formData.phone : (sponsorData?.phone || formData.phone),
        logo_url: logoUrl,
        prize_description: formData.prize_description,
        prize_count: formData.prize_count,
        promotion_end_date: formData.promotion_end_date || null,
        sponsor_registration_id: sponsorRegistrationId || sponsorData?.id || null,
        city: formData.city || null,
        state: formData.state || null,
      };

      if (isAdmin) {
        // Admin insere diretamente na tabela sponsors (definitiva)
        const { error } = await supabase
          .from('sponsors')
          .insert(insertData);

        if (error) {
          throw new Error(error.message || 'Erro ao cadastrar promoção');
        }

        toast({
          title: "Promoção cadastrada!",
          description: "A promoção foi cadastrada com sucesso.",
        });

        navigate('/admin-panel');
      } else {
        // Patrocinador insere na tabela pending_promotions para validação
        const pendingData = {
          ...insertData,
          status: 'pending'
        };

        const { error } = await supabase
          .from('pending_promotions')
          .insert(pendingData);

        if (error) {
          throw new Error(error.message || 'Erro ao cadastrar promoção');
        }

        toast({
          title: "Promoção enviada!",
          description: "Sua promoção foi enviada para aprovação do administrador.",
        });

        navigate('/sponsor-dashboard');
      }
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

  // Se cadastros bloqueados e não é admin, mostrar mensagem
  if (!promotionsEnabled && !isAdmin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate(getBackRoute())}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Cadastros Bloqueados</CardTitle>
              <CardDescription>
                Novos cadastros de promoções estão temporariamente bloqueados pelo administrador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Entre em contato com o administrador para mais informações.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(getBackRoute())}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Promoção</CardTitle>
            <CardDescription>
              {isAdmin 
                ? 'Como administrador, preencha os dados da promoção' 
                : 'Preencha os dados da promoção que será oferecida aos jogadores'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Informativo sobre limites */}
            {promotionLimits && !isAdmin && sponsorData && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Limites do seu plano ({sponsorData.plan}):
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  {(() => {
                    const planName = sponsorData.plan?.toLowerCase() || '';
                    const isBasicPlan = planName.includes('teste') || planName.includes('test') || planName.includes('básico') || planName.includes('basico');
                    return isBasicPlan ? (
                      <>
                        <li>Até <strong>{promotionLimits.basic_test_max_prizes}</strong> prêmios por promoção</li>
                        <li>Até <strong>{promotionLimits.basic_test_max_promotions}</strong> promoções por mês</li>
                      </>
                    ) : (
                      <>
                        <li>Até <strong>{promotionLimits.monthly_annual_max_prizes}</strong> prêmios por promoção</li>
                        <li>Até <strong>{promotionLimits.monthly_annual_max_promotions}</strong> promoções por mês</li>
                      </>
                    );
                  })()}
                  <li>Jogadores no ranking: <strong>quantidade de prêmios + 10</strong></li>
                </ul>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isAdmin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nome do Patrocinador *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Digite o nome do patrocinador"
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Celular *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      required
                      className="bg-background"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company">Patrocinador</Label>
                    <Input
                      id="company"
                      value={sponsorData?.company || ''}
                      disabled
                      className="bg-yellow-200 dark:bg-yellow-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Celular</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={sponsorData?.phone || ''}
                      disabled
                      className="bg-yellow-200 dark:bg-yellow-900"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa *</Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="flex-1"
                      required
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {logoPreview && (
                    <div className="flex justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Preview do logo" 
                        className="h-32 w-32 object-contain border-2 border-border rounded-lg"
                      />
                    </div>
                  )}
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
                <Label htmlFor="prize_count">
                  Quantidade de Prêmios * 
                  {promotionLimits && !isAdmin && sponsorData && (
                    <span className="text-muted-foreground font-normal ml-1">
                      (máximo {(() => {
                        const planName = sponsorData.plan?.toLowerCase() || '';
                        const isBasicPlan = planName.includes('teste') || planName.includes('test') || planName.includes('básico') || planName.includes('basico');
                        return isBasicPlan ? promotionLimits.basic_test_max_prizes : promotionLimits.monthly_annual_max_prizes;
                      })()})
                    </span>
                  )}
                  {isAdmin && <span className="text-muted-foreground font-normal ml-1">(máximo 100)</span>}
                </Label>
                <Input
                  id="prize_count"
                  type="number"
                  min="1"
                  max={(() => {
                    if (isAdmin) return 100;
                    if (!sponsorData || !promotionLimits) return 10;
                    const planName = sponsorData.plan?.toLowerCase() || '';
                    const isBasicPlan = planName.includes('teste') || planName.includes('test') || planName.includes('básico') || planName.includes('basico');
                    return isBasicPlan ? promotionLimits.basic_test_max_prizes : promotionLimits.monthly_annual_max_prizes;
                  })()}
                  value={formData.prize_count}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    const maxPrizes = (() => {
                      if (isAdmin) return 100;
                      if (!sponsorData || !promotionLimits) return 10;
                      const planName = sponsorData.plan?.toLowerCase() || '';
                      const isBasicPlan = planName.includes('teste') || planName.includes('test') || planName.includes('básico') || planName.includes('basico');
                      return isBasicPlan ? promotionLimits.basic_test_max_prizes : promotionLimits.monthly_annual_max_prizes;
                    })();
                    
                    if (value > maxPrizes) {
                      toast({
                        title: "Limite excedido",
                        description: `O número máximo para cada promoção são ${maxPrizes}.`,
                        variant: "destructive",
                      });
                      setFormData({ ...formData, prize_count: maxPrizes });
                    } else {
                      setFormData({ ...formData, prize_count: value });
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion_end_date">Data e Horário de Término da Promoção</Label>
                <Input
                  id="promotion_end_date"
                  type="datetime-local"
                  value={formData.promotion_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, promotion_end_date: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Digite a cidade"
                    className={isAdmin ? "bg-background" : "bg-yellow-200 dark:bg-yellow-900"}
                    disabled={!isAdmin && !!sponsorData?.city}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">UF</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Ex: SP"
                    maxLength={2}
                    className={isAdmin ? "bg-background" : "bg-yellow-200 dark:bg-yellow-900"}
                    disabled={!isAdmin && !!sponsorData?.state}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full disabled:bg-accent disabled:text-accent-foreground disabled:text-2xl disabled:opacity-100" 
                disabled={loading}
              >
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
