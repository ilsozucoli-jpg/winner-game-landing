import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/register');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-8 animate-bounce-in">
        <div className="relative">
          <Trophy className="w-32 h-32 text-primary mx-auto animate-pulse-glow" />
          <div className="absolute inset-0 bg-primary blur-3xl opacity-30 animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Winning Game
          </h1>
          <p className="text-xl text-muted-foreground animate-pulse">
            Prepare-se para vencer!
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
