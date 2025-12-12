import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Upload, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import paymentQRCode from '@/assets/payment-qrcode.jpg';

const PLAN_OPTIONS = [
  { value: 'test', label: 'Teste', price: 10.00 },
  { value: 'monthly', label: 'Mensal', price: 50.00 },
  { value: 'annual', label: 'Anual', price: 400.00 },
];

export default function SponsorRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [promotionLimits, setPromotionLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const renewalData = location.state?.renewalData;
  const isRenewal = !!renewalData;
  
  const [formData, setFormData] = useState({
    name: renewalData?.name || '',
    address: renewalData?.address || '',
    city: renewalData?.city || '',
    state: renewalData?.state || '',
    company: renewalData?.company || '',
    plan: 'monthly',
    phone: renewalData?.phone || '',
    email: renewalData?.email || '',
  });

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

      setUser(session.user);
      
      // Pré-preencher email do usuário logado (se não for renovação)
      if (!isRenewal) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || ''
        }));
      }

      await loadPromotionLimits();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      navigate('/auth');
    }
  };

  const loadPromotionLimits = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'promotion_limits')
        .single();

      if (data?.setting_value) {
        setPromotionLimits(data.setting_value);
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPaymentProof = async (userId: string): Promise<string | null> => {
    if (!paymentProofFile) return null;

    const fileExt = paymentProofFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, paymentProofFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city || !formData.state || !formData.company || !formData.phone || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentProofFile) {
      toast({
        title: "Comprovante obrigatório",
        description: "Por favor, anexe o comprovante de pagamento.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      if (isRenewal) {
        // Fluxo de renovação - atualizar registro existente
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        // Upload do novo comprovante
        const paymentProofUrl = await uploadPaymentProof(user.id);
        const selectedPlan = PLAN_OPTIONS.find(p => p.value === formData.plan);

        // Atualizar registro de patrocinador
        const { error: updateError } = await supabase
          .from('sponsor_registrations')
          .update({
            address: formData.address,
            city: formData.city,
            state: formData.state,
            phone: formData.phone,
            plan: formData.plan,
            plan_value: selectedPlan?.price || 0,
            payment_proof_url: paymentProofUrl,
            status: 'pending',
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        toast({
          title: "Renovação realizada!",
          description: "Cadastro atualizado e enviado para análise.",
          className: "bg-success text-success-foreground",
        });
        
        navigate('/sponsor-dashboard');
      } else {
        // Fluxo de novo cadastro - usar usuário já logado
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        // Upload do comprovante
        const paymentProofUrl = await uploadPaymentProof(user.id);
        const selectedPlan = PLAN_OPTIONS.find(p => p.value === formData.plan);
        
        // Inserir registro de patrocinador
        const { error } = await supabase
          .from('sponsor_registrations')
          .insert({
            user_id: user.id,
            name: formData.name,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            company: formData.company,
            plan: formData.plan,
            plan_value: selectedPlan?.price || 0,
            payment_proof_url: paymentProofUrl,
            status: 'pending',
            phone: formData.phone,
            email: formData.email,
          });

        if (error) throw error;

        toast({
          title: "Cadastro realizado!",
          description: "Cadastro de patrocinador enviado para análise.",
          className: "bg-success text-success-foreground",
        });
        
        // Redirecionar para dashboard do patrocinador
        navigate('/sponsor-dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const selectedPlan = PLAN_OPTIONS.find(p => p.value === formData.plan);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        <Button
          variant="ghost"
          onClick={() => navigate(isRenewal ? '/sponsor-dashboard' : '/role-selection')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center space-y-2">
          <Building2 className="w-16 h-16 text-primary mx-auto animate-pulse-glow" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Cadastro de Patrocinador
          </h1>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={isRenewal && renewalData?.name ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-background"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Nome da empresa"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={isRenewal && renewalData?.company ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-background"}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Celular *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={isRenewal && renewalData?.phone ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-background"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  readOnly
                  disabled
                  className="bg-yellow-100 dark:bg-yellow-900/30 cursor-not-allowed"
                />
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Rua, número, complemento"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={isRenewal && renewalData?.address ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-background"}
                  required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Sua cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={isRenewal && renewalData?.city ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-background"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="UF"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  className={isRenewal && renewalData?.state ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-background"}
                  required
                />
            </div>

            {promotionLimits && (
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <AlertDescription className="text-sm">
                  <strong>Limites do plano selecionado:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {formData.plan === 'test' ? (
                      <>
                        <li>Até <strong>{promotionLimits.basic_test_max_prizes}</strong> prêmios por promoção</li>
                        <li>Até <strong>{promotionLimits.basic_test_max_promotions}</strong> promoções por mês</li>
                      </>
                    ) : (
                      <>
                        <li>Até <strong>{promotionLimits.monthly_annual_max_prizes}</strong> prêmios por promoção</li>
                        <li>Até <strong>{promotionLimits.monthly_annual_max_promotions}</strong> promoções por mês</li>
                      </>
                    )}
                    <li>Jogadores no ranking: <strong>quantidade de prêmios + 10</strong></li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            </div>

            <div className="space-y-4">
              <Label>Plano de Patrocínio *</Label>
              <RadioGroup
                value={formData.plan}
                onValueChange={(value) => setFormData({ ...formData, plan: value })}
              >
                {PLAN_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-primary font-bold">R$ {option.price.toFixed(2)}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4 p-6 bg-accent/20 rounded-lg border-2 border-primary/20">
              <h3 className="text-lg font-bold text-center">QR Code para Pagamento</h3>
              <p className="text-sm text-muted-foreground text-center">
                Escaneie o QR Code abaixo para realizar o pagamento de <strong>R$ {selectedPlan?.price.toFixed(2)}</strong>
              </p>
              <div className="flex justify-center">
                <img 
                  src={paymentQRCode} 
                  alt="QR Code de Pagamento" 
                  className="w-80 h-80 object-contain border-4 border-primary rounded-lg shadow-elegant"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="payment-proof">Comprovante de Pagamento *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4 hover:border-primary transition-colors">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label 
                    htmlFor="payment-proof"
                    className="cursor-pointer text-primary hover:underline"
                  >
                    Clique aqui para anexar o comprovante
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
                  </p>
                </div>
                {paymentProofPreview && (
                  <div className="mt-4">
                    <img 
                      src={paymentProofPreview} 
                      alt="Preview do comprovante" 
                      className="max-w-xs mx-auto rounded-lg border border-border"
                    />
                    <p className="text-sm text-success mt-2">✓ Arquivo anexado</p>
                  </div>
                )}
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Após o envio, seu cadastro será analisado pela equipe. Você receberá uma notificação quando for aprovado.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              variant="game" 
              size="lg" 
              className="w-full"
              disabled={uploading}
            >
              {uploading ? 'ENVIANDO...' : 'ENVIAR CADASTRO'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}