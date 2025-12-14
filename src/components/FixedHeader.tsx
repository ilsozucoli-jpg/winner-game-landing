import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsMenu } from '@/components/SettingsMenu';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';

export function FixedHeader() {
  const navigate = useNavigate();
  const { resetGame } = useGame();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetGame();
    navigate('/');
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="bg-background/80 backdrop-blur-sm hover:bg-background"
      >
        <LogOut className="w-5 h-5" />
      </Button>
      <SettingsMenu className="bg-background/80 backdrop-blur-sm hover:bg-background" />
    </div>
  );
}
