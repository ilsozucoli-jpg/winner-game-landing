import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import winnerBackground from "@/assets/winner-background.jpg";

const Index = () => {
  const navigate = useNavigate();

  const handleStartGame = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Usuário está logado, vai para seleção de patrocinador
      navigate('/sponsor-selection');
    } else {
      // Usuário não está logado, vai para tela de login
      navigate('/auth');
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
    </div>
  );
};

export default Index;
