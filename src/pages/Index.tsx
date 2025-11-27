import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import winnerBackground from "@/assets/winner-background.jpg";
import { useState } from "react";
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

const Index = () => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleStartGame = async () => {
    if (!termsAccepted) {
      setShowTerms(true);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      navigate('/sponsor-selection');
    } else {
      navigate('/auth');
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptTerms = () => {
    if (termsAccepted && hasScrolledToBottom) {
      setShowTerms(false);
      handleStartGame();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-purple-light overflow-hidden relative">
      {/* Animated sparkles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-8 md:space-y-12">
          
          {/* Logo */}
          <div className="animate-float">
            <img 
              src={winnerBackground} 
              alt="Winner Game Logo" 
              className="w-full max-w-md md:max-w-2xl h-auto rounded-2xl"
            />
          </div>

          {/* Description */}
          <div className="text-center max-w-2xl space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h1 className="font-exo text-3xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight">
              Jogo Interativo para <span className="text-gold">Toda Família</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/90 font-medium">
              Jogo interativo fácil e rápido com etapas onde você acumula pontos e concorre a vários prêmios.
            </p>
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <Button 
              size="lg"
              onClick={handleStartGame}
              className="font-exo text-xl md:text-2xl px-8 md:px-12 py-6 md:py-8 bg-success text-success-foreground font-black rounded-3xl animate-pulse-scale hover:brightness-110 transition-all duration-300"
            >
              <Zap className="mr-3 h-7 w-7" />
              Iniciar Jogo
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl mt-8 animate-fade-in" style={{ animationDelay: "0.9s" }}>
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border-2 border-gold/30 hover:border-gold transition-all duration-300 hover:shadow-glow">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-gradient-gold p-3 rounded-full">
                  <Sparkles className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-exo text-xl font-bold text-foreground">Fácil e Rápido</h3>
                <p className="text-muted-foreground">Jogue em minutos com regras simples e intuitivas</p>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border-2 border-gold/30 hover:border-gold transition-all duration-300 hover:shadow-glow">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-gradient-gold p-3 rounded-full">
                  <Trophy className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-exo text-xl font-bold text-foreground">Vários Prêmios</h3>
                <p className="text-muted-foreground">Acumule pontos e concorra a prêmios incríveis</p>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border-2 border-gold/30 hover:border-gold transition-all duration-300 hover:shadow-glow">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-gradient-gold p-3 rounded-full">
                  <Zap className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-exo text-xl font-bold text-foreground">Para Toda Família</h3>
                <p className="text-muted-foreground">Diversão garantida para todas as idades</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-exo font-black">
              Termos e Condições de Uso
            </DialogTitle>
            <DialogDescription>
              Por favor, leia atentamente os termos e condições antes de continuar
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4" onScrollCapture={handleScroll}>
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
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTerms(false)}
              >
                Voltar
              </Button>
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
    </div>
  );
};

export default Index;
