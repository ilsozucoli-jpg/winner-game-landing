import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Trash2, Edit, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettingsMenuProps {
  className?: string;
}

export function SettingsMenu({ className }: SettingsMenuProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetGame } = useGame();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSponsor, setIsSponsor] = useState(false);
  const [hasActivePromotions, setHasActivePromotions] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    checkUserType();
  }, []);

  const checkUserType = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user is a sponsor
      const { data: sponsorReg } = await supabase
        .from('sponsor_registrations')
        .select('id, status')
        .eq('user_id', session.user.id)
        .eq('status', 'approved')
        .single();

      if (sponsorReg) {
        setIsSponsor(true);
        
        // Check for active or pending promotions
        const { data: activeSponsors } = await supabase
          .from('sponsors')
          .select('id, promotion_end_date')
          .eq('user_id', session.user.id);

        const { data: pendingPromos } = await supabase
          .from('pending_promotions')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('status', 'pending');

        const now = new Date();
        const hasActive = (activeSponsors || []).some(s => 
          !s.promotion_end_date || new Date(s.promotion_end_date) > now
        );

        setHasActivePromotions(hasActive || (pendingPromos || []).length > 0);
      }
    } catch (error) {
      console.error('Error checking user type:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone, email')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFormData({
          name: profile.name || '',
          phone: profile.phone || '',
          email: profile.email || session.user.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      resetGame();
      navigate('/');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
    setOpen(false);
  };

  const handleDelete = async () => {
    if (isSponsor && hasActivePromotions) {
      toast({
        title: "Não é possível excluir",
        description: "Você possui promoções ativas ou pendentes. Aguarde o encerramento para excluir sua conta.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Delete game results
      await supabase
        .from('game_results')
        .delete()
        .eq('user_id', session.user.id);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', session.user.id);

      // Delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', session.user.id);

      // Sign out
      await supabase.auth.signOut();
      
      resetGame();
      navigate('/');
      
      toast({
        title: "Conta excluída",
        description: "Sua conta e dados foram removidos com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro ao excluir conta",
        description: error.message || "Não foi possível excluir sua conta.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleEdit = () => {
    loadProfileData();
    setEditDialogOpen(true);
    setOpen(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: "Dados atualizados",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar seus dados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStart = () => {
    resetGame();
    if (isSponsor) {
      navigate('/sponsor-dashboard');
    } else {
      navigate('/player-dashboard');
    }
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`opacity-50 hover:opacity-100 transition-opacity ${className}`}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 bg-card border border-border" align="end">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={() => {
                setOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4" />
              Alterar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleStart}
            >
              <Home className="w-4 h-4" />
              Iniciar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {isSponsor && hasActivePromotions ? (
                "Você possui promoções ativas ou pendentes. Não é possível excluir sua conta enquanto houver promoções em andamento."
              ) : (
                "Tem certeza que deseja excluir sua conta? Esta ação é irreversível e você perderá todas as suas participações nos jogos."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            {!(isSponsor && hasActivePromotions) && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Excluindo...' : 'Excluir Conta'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Dados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Salvando...' : 'Alterar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
