import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();

        if (roleData) {
          navigate('/admin');
        } else {
          // Check if user is a sponsor
          const { data: sponsorData } = await supabase
            .from('sponsor_registrations')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (sponsorData) {
            navigate('/sponsor-dashboard');
          } else {
            navigate('/');
          }
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();

        if (roleData) {
          navigate('/admin');
        } else {
          // Check if user is a sponsor
          const { data: sponsorData } = await supabase
            .from('sponsor_registrations')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (sponsorData) {
            navigate('/sponsor-dashboard');
          } else {
            navigate('/');
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptTerms = () => {
    if (termsAccepted && hasScrolledToBottom) {
      setShowTerms(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });

        // Verificar se o usuário é admin consultando a tabela user_roles
        if (data.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .eq('role', 'admin')
            .single();

          if (roleData) {
            navigate('/admin');
          } else {
            // Check if user is a sponsor
            const { data: sponsorData } = await supabase
              .from('sponsor_registrations')
              .select('id')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (sponsorData) {
              navigate('/sponsor-dashboard');
            } else {
              navigate('/sponsor-selection');
            }
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (error) throw error;
        
        toast({
          title: "Cadastro realizado!",
          description: "Você já pode fazer login.",
        });
        setIsLogin(true);
      }
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
    <>
      {/* Terms and Conditions Dialog */}
      <Dialog open={showTerms} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-exo font-black">
              Termos e Condições de Uso
            </DialogTitle>
            <DialogDescription>
              Por favor, leia atentamente os termos e condições antes de continuar
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4" onScrollCapture={handleScroll}>
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-bold text-lg mb-2">1. Introdução e Aceitação</h3>
                <p className="text-muted-foreground">
                  Este documento estabelece as Regras de Utilização e os Termos de Serviço do aplicativo móvel Winner Game. 
                  O Aplicativo é uma plataforma digital que atua como intermediário, disponibilizando um espaço para que 
                  Patrocinadores possam cadastrar e promover ofertas, promoções e sorteios online para os Usuários.
                </p>
                <p className="text-muted-foreground mt-2">
                  A utilização do Aplicativo implica na aceitação integral e irrestrita destes Termos. Caso não concorde 
                  com qualquer disposição aqui contida, deve abster-se de utilizar o Aplicativo.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">2. Definições Chave</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Aplicativo:</strong> A plataforma móvel denominada "Winner Game"</li>
                  <li><strong>Usuário:</strong> Pessoa física que acessa e utiliza o Aplicativo para participar das Promoções</li>
                  <li><strong>Patrocinador:</strong> Pessoa jurídica ou física que utiliza o Aplicativo para cadastrar e promover Promoções</li>
                  <li><strong>Promoção:</strong> Qualquer oferta, desconto, sorteio ou ação comercial cadastrada pelo Patrocinador</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">3. Objeto e Natureza da Relação</h3>
                <p className="text-muted-foreground">
                  O Winner Game estabelece-se como provedor de aplicação de internet, cuja função é intermediar a comunicação 
                  entre Patrocinadores e Usuários. O Aplicativo não é fornecedor dos produtos ou serviços objeto das Promoções.
                </p>
                <p className="text-muted-foreground mt-2">
                  A responsabilidade do Aplicativo limita-se à manutenção da plataforma. Qualquer relação de consumo é 
                  estabelecida diretamente entre o Patrocinador e o Usuário.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">4. Responsabilidades do Patrocinador</h3>
                <p className="text-muted-foreground">
                  O Patrocinador assume total responsabilidade pela legalidade, veracidade, execução e cumprimento das Promoções, 
                  devendo observar o CDC e as normas regulatórias brasileiras.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">5. Conformidade com o CDC</h3>
                <p className="text-muted-foreground mb-2">
                  O Patrocinador deve garantir o pleno respeito aos direitos básicos do consumidor:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Vinculação da Oferta: Toda informação obriga o Patrocinador</li>
                  <li>Direito à Informação: Informações claras e precisas sobre produtos e serviços</li>
                  <li>Direito de Arrependimento: 7 dias para desistência em compras online</li>
                  <li>Proibição de Práticas Abusivas: Vedada propaganda enganosa ou abusiva</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">6. Proteção de Dados Pessoais (LGPD)</h3>
                <p className="text-muted-foreground mb-2">
                  O tratamento de dados pessoais observa a Lei Geral de Proteção de Dados:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Dados coletados: nome, e-mail, telefone e informações de participação</li>
                  <li>Finalidade: intermediação de promoções e comunicação</li>
                  <li>Base legal: consentimento e execução de contrato</li>
                  <li>Direitos do titular: acesso, correção, exclusão e portabilidade</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">7. Direitos e Deveres do Usuário</h3>
                <p className="text-muted-foreground mb-2">Direitos:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Acesso gratuito ao Aplicativo</li>
                  <li>Informações claras sobre as Promoções</li>
                  <li>Proteção de dados pessoais</li>
                  <li>Reclamação em caso de irregularidades</li>
                </ul>
                <p className="text-muted-foreground mt-3 mb-2">Deveres:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Fornecer informações verdadeiras no cadastro</li>
                  <li>Não utilizar o Aplicativo para fins ilícitos</li>
                  <li>Respeitar os direitos de propriedade intelectual</li>
                  <li>Observar as regras específicas de cada Promoção</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">8. Limitação de Responsabilidade</h3>
                <p className="text-muted-foreground">
                  O Aplicativo não se responsabiliza por danos decorrentes de falhas técnicas, interrupções de conexão, 
                  ações de terceiros ou caso fortuito. Não garante disponibilidade ininterrupta dos serviços.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">9. Propriedade Intelectual</h3>
                <p className="text-muted-foreground">
                  Todos os direitos sobre o Aplicativo, incluindo design, código-fonte e marca, são de propriedade exclusiva 
                  do Winner Game. É proibida a reprodução não autorizada.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">10. Modificações dos Termos</h3>
                <p className="text-muted-foreground">
                  O Aplicativo reserva-se o direito de modificar estes Termos a qualquer momento, mediante comunicação prévia. 
                  O uso continuado após as alterações constitui aceitação.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">11. Resolução de Conflitos e Foro</h3>
                <p className="text-muted-foreground">
                  Eventuais controvérsias serão resolvidas pela legislação brasileira. Fica eleito o foro da comarca de 
                  residência do Usuário para dirimir questões relacionadas ao CDC.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-lg mb-2">12. Disposições Finais</h3>
                <p className="text-muted-foreground">
                  A nulidade de qualquer cláusula não afeta a validade das demais. O não exercício de direitos não implica renúncia.
                </p>
              </section>

              <section className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  Para mais informações, consulte o documento completo em{" "}
                  <a 
                    href="/termos-e-condicoes.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Termos e Condições (PDF)
                  </a>
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                disabled={!hasScrolledToBottom}
              />
              <Label 
                htmlFor="terms" 
                className={`text-sm leading-relaxed cursor-pointer ${!hasScrolledToBottom ? 'text-muted-foreground' : ''}`}
              >
                Li e concordo com os Termos e Condições de Uso do Winner Game
                {!hasScrolledToBottom && (
                  <span className="block text-xs text-destructive mt-1">
                    Role até o final para aceitar os termos
                  </span>
                )}
              </Label>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleAcceptTerms}
                disabled={!termsAccepted || !hasScrolledToBottom}
                className="bg-success text-success-foreground hover:brightness-110"
              >
                Aceitar e Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Form - Only visible after accepting terms */}
      {!showTerms && (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Winning Game
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isLogin ? 'Faça login para continuar' : 'Crie sua conta'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="game"
                size="xl"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                >
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
