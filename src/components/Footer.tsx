import { LogOut, Music } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';
import * as Tone from 'tone';

export function Footer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetGame } = useGame();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMusic = async () => {
    if (isPlaying) {
      // Stop music
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Start music
      try {
        await Tone.start();
        
        const melody = [
          { note: 'E5', duration: '8n' },
          { note: 'E5', duration: '8n' },
          { note: 'rest', duration: '8n' },
          { note: 'E5', duration: '8n' },
          { note: 'rest', duration: '8n' },
          { note: 'C5', duration: '8n' },
          { note: 'E5', duration: '8n' },
          { note: 'rest', duration: '8n' },
          { note: 'G5', duration: '4n' },
          { note: 'rest', duration: '4n' },
          { note: 'G4', duration: '4n' },
          { note: 'rest', duration: '4n' },
        ];

        synthRef.current = new Tone.Synth({
          oscillator: {
            type: 'square',
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.1,
          },
        }).toDestination();

        synthRef.current.volume.value = -10;

        const playSequence = () => {
          let time = Tone.now();
          melody.forEach((step) => {
            if (step.note !== 'rest') {
              synthRef.current?.triggerAttackRelease(step.note, step.duration, time);
            }
            time += Tone.Time(step.duration).toSeconds();
          });
        };

        playSequence();
        intervalRef.current = setInterval(playSequence, melody.length * 0.2 * 1000);
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing music:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  const confirmLogout = async () => {
    // Stop music on logout
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (synthRef.current) synthRef.current.dispose();
      setIsPlaying(false);
    }

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    } else {
      resetGame();
      toast({
        title: "Logout realizado",
        description: "Você saiu com sucesso!",
      });
      navigate('/auth');
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowLogoutDialog(true)}
        className="fixed top-6 right-6 gap-2 opacity-50 hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border border-border shadow-lg"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </Button>

      <Button
        variant="game"
        size="icon"
        className="fixed top-20 right-6 z-50 rounded-full shadow-lg hover:scale-110 transition-transform opacity-50 hover:opacity-100"
        onClick={toggleMusic}
      >
        <Music className={`h-5 w-5 ${isPlaying ? 'animate-pulse' : ''}`} />
      </Button>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída</AlertDialogTitle>
            <AlertDialogDescription>
              Você realmente deseja sair do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
