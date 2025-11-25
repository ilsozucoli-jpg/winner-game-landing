import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, UserPlus, Trash2 } from 'lucide-react';
import { createAdminUser } from '@/lib/adminUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Users, UserX, Key, List, Zap, Store, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [prizeDescription, setPrizeDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [prizeCount, setPrizeCount] = useState('1');
  const [promotionEndDate, setPromotionEndDate] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [passwordSearchQuery, setPasswordSearchQuery] = useState('');
  const [passwordSearchResults, setPasswordSearchResults] = useState<any[]>([]);
  const [searchingPassword, setSearchingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(false);
  const [deletingSponsor, setDeletingSponsor] = useState(false);
  const [sponsorRegistrations, setSponsorRegistrations] = useState<any[]>([]);
  const [loadingSponsorRegistrations, setLoadingSponsorRegistrations] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
  const [approvingRegistration, setApprovingRegistration] = useState(false);
  const [editingValidityDate, setEditingValidityDate] = useState(false);
  const [newValidityDate, setNewValidityDate] = useState('');
  const [activeSection, setActiveSection] = useState<'sponsor' | 'users' | 'delete' | 'password' | 'list' | 'shortcuts' | 'sponsors-list' | 'registrations'>('sponsor');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at');

      if (profilesError) throw profilesError;

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const usersWithRoles = profilesData.map(profile => ({
        ...profile,
        roles: rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSponsors = async () => {
    setLoadingSponsors(true);
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar patrocinadores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSponsors(false);
    }
  };

  const loadSponsorRegistrations = async () => {
    setLoadingSponsorRegistrations(true);
    try {
      const { data, error } = await supabase
        .from('sponsor_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSponsorRegistrations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cadastros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSponsorRegistrations(false);
    }
  };

  const handleApproveRegistration = async (registrationId: string, approve: boolean) => {
    if (!confirm(`Tem certeza que deseja ${approve ? 'aprovar' : 'rejeitar'} este cadastro?`)) {
      return;
    }

    setApprovingRegistration(true);
    try {
      const { error } = await supabase
        .from('sponsor_registrations')
        .update({ status: approve ? 'approved' : 'rejected' })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Cadastro ${approve ? 'aprovado' : 'rejeitado'} com sucesso.`,
      });

      setSelectedRegistration(null);
      loadSponsorRegistrations();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApprovingRegistration(false);
    }
  };

  const handleUpdateValidityDate = async (registrationId: string) => {
    if (!newValidityDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data de validade.",
        variant: "destructive",
      });
      return;
    }

    setEditingValidityDate(true);
    try {
      const { error } = await supabase
        .from('sponsor_registrations')
        .update({ validity_date: new Date(newValidityDate).toISOString() })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Data de validade atualizada com sucesso.",
      });

      setNewValidityDate('');
      loadSponsorRegistrations();
      // Update selected registration
      if (selectedRegistration) {
        setSelectedRegistration({
          ...selectedRegistration,
          validity_date: new Date(newValidityDate).toISOString()
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditingValidityDate(false);
    }
  };

  const handleDeleteSponsor = async (sponsorId: string) => {
    if (!confirm('Tem certeza que deseja excluir este patrocinador?')) {
      return;
    }

    setDeletingSponsor(true);
    try {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', sponsorId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Patrocinador excluído com sucesso.",
      });

      loadSponsors();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir patrocinador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingSponsor(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      navigate('/');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!logoFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem para o logo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Upload da imagem
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('sponsor-logos')
        .upload(fileName, logoFile);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-logos')
        .getPublicUrl(fileName);

      // Inserir novo patrocinador
      const { error: insertError } = await supabase
        .from('sponsors')
        .insert([{
          logo_url: publicUrl,
          prize_description: prizeDescription.trim(),
          phone: phone.trim(),
          prize_count: parseInt(prizeCount) || 1,
          promotion_end_date: promotionEndDate ? new Date(promotionEndDate).toISOString() : null,
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Sucesso!",
        description: "Patrocinador cadastrado com sucesso.",
      });

      // Limpar formulário
      setPrizeDescription('');
      setPhone('');
      setPrizeCount('1');
      setPromotionEndDate('');
      setLogoFile(null);
      setLogoPreview('');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);

    try {
      await createAdminUser(newUserEmail, newUserPassword, 'admin');
      
      toast({
        title: "Sucesso!",
        description: `Usuário ${newUserEmail} criado como admin.`,
      });

      setNewUserEmail('');
      setNewUserPassword('');
      loadUsers(); // Reload users list
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!confirm('Tem certeza que deseja deletar TODOS os usuários? Esta ação não pode ser desfeita!')) {
      return;
    }

    setDeletingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      // Delete all user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .neq('user_id', session.user.id); // Keep current admin

      if (rolesError) throw rolesError;

      // Delete all profiles except current user
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .neq('id', session.user.id);

      if (profilesError) throw profilesError;

      toast({
        title: "Sucesso!",
        description: "Todos os usuários foram deletados (exceto você).",
      });

      loadUsers(); // Reload users list
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingUsers(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um email ou nome para buscar.",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .or(`email.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        toast({
          title: "Não encontrado",
          description: "Nenhum usuário encontrado com esse email ou nome.",
        });
        setSearchResults([]);
        return;
      }

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const usersWithRoles = profilesData.map(profile => ({
        ...profile,
        roles: rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      }));

      setSearchResults(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user.id === userId) {
      toast({
        title: "Erro",
        description: "Você não pode deletar a si mesmo!",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o usuário ${userEmail}?`)) {
      return;
    }

    setDeletingUser(true);
    try {
      // Delete user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      toast({
        title: "Sucesso!",
        description: `Usuário ${userEmail} deletado com sucesso.`,
      });

      setSearchResults(searchResults.filter(u => u.id !== userId));
      setSearchQuery('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSearchUserForPassword = async () => {
    if (!passwordSearchQuery.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um email ou nome para buscar.",
        variant: "destructive",
      });
      return;
    }

    setSearchingPassword(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .or(`email.ilike.%${passwordSearchQuery}%,name.ilike.%${passwordSearchQuery}%`);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        toast({
          title: "Não encontrado",
          description: "Nenhum usuário encontrado com esse email ou nome.",
        });
        setPasswordSearchResults([]);
        return;
      }

      setPasswordSearchResults(profilesData);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearchingPassword(false);
    }
  };

  const handleChangePassword = async (userId: string, userEmail: string) => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja alterar a senha do usuário ${userEmail}?`)) {
      return;
    }

    setChangingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('change-user-password', {
        body: { userId, newPassword }
      });

      if (response.error) throw response.error;

      toast({
        title: "Sucesso!",
        description: `Senha do usuário ${userEmail} alterada com sucesso.`,
      });

      setNewPassword('');
      setPasswordSearchResults([]);
      setPasswordSearchQuery('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const menuButtons = [
    { id: 'sponsor', label: 'Patrocinador', icon: Settings, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'sponsors-list', label: 'Lista Patrocinadores', icon: Users, color: 'bg-indigo-500 hover:bg-indigo-600' },
    { id: 'registrations', label: 'Promotores Cadastrados', icon: Store, color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'users', label: 'Criar Admin', icon: UserPlus, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'delete', label: 'Excluir Usuário', icon: UserX, color: 'bg-red-500 hover:bg-red-600' },
    { id: 'password', label: 'Mudar Senha', icon: Key, color: 'bg-amber-500 hover:bg-amber-600' },
    { id: 'list', label: 'Lista Usuários', icon: List, color: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'shortcuts', label: 'Atalhos Etapas', icon: Zap, color: 'bg-cyan-500 hover:bg-cyan-600' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Painel Administrativo
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menuButtons.map((button) => {
            const Icon = button.icon;
            return (
              <Button
                key={button.id}
                onClick={() => {
                  setActiveSection(button.id as any);
                  if (button.id === 'list') loadUsers();
                  if (button.id === 'sponsors-list') loadSponsors();
                  if (button.id === 'registrations') loadSponsorRegistrations();
                }}
                className={`${button.color} text-white h-24 flex flex-col items-center justify-center gap-2 transition-all`}
                size="lg"
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-semibold">{button.label}</span>
              </Button>
            );
          })}
        </div>

        {activeSection === 'sponsor' && (
            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Patrocinador</CardTitle>
                <CardDescription>Configure o patrocinador e o prêmio do evento</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Logo do Patrocinador</label>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      {logoPreview && (
                        <div className="border border-border rounded-lg p-4 flex justify-center">
                          <img src={logoPreview} alt="Preview" className="max-h-48 object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição do Prêmio</label>
                    <Textarea
                      value={prizeDescription}
                      onChange={(e) => setPrizeDescription(e.target.value)}
                      placeholder="Ex: R$ 10.000 em produtos"
                      required
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone de Contato</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Quantidade de Prêmios</label>
                    <Input
                      type="number"
                      value={prizeCount}
                      onChange={(e) => setPrizeCount(e.target.value)}
                      placeholder="1"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Data e Horário Final da Promoção</label>
                    <Input
                      type="datetime-local"
                      value={promotionEndDate}
                      onChange={(e) => setPromotionEndDate(e.target.value)}
                      placeholder="Data final"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deixe em branco se não houver data limite
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading} variant="game" size="xl" className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Cadastrar Patrocinador
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/')}>
                      Voltar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
        )}

        {activeSection === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Criar Usuário Admin</CardTitle>
                <CardDescription>Crie novos usuários com privilégios administrativos</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Senha</label>
                    <Input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Senha forte"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={creatingUser} variant="game" size="xl" className="flex-1">
                      {creatingUser ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Criar Admin
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
        )}

        {activeSection === 'delete' && (
            <Card>
              <CardHeader>
                <CardTitle>Excluir Usuário</CardTitle>
                <CardDescription>Busque e exclua usuários por email ou nome</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Digite o email ou nome do usuário"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                    />
                    <Button 
                      onClick={handleSearchUser} 
                      disabled={searching}
                      variant="secondary"
                    >
                      {searching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {searchResults.length} usuário(s) encontrado(s)
                      </p>
                      {searchResults.map((user) => (
                        <div key={user.id} className="border border-border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{user.email || 'Email não cadastrado'}</p>
                              {user.name && <p className="text-sm text-muted-foreground">{user.name}</p>}
                              <p className="text-xs text-muted-foreground mt-1">
                                Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              <div className="flex gap-2 mt-2">
                                {user.roles.length > 0 ? (
                                  user.roles.map((role: string) => (
                                    <span 
                                      key={role}
                                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                                    >
                                      {role}
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                                    user
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={deletingUser}
                            >
                              {deletingUser ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Excluir'
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        )}

        {activeSection === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle>Mudar Senha</CardTitle>
                <CardDescription>Altere a senha de um usuário ou admin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={passwordSearchQuery}
                      onChange={(e) => setPasswordSearchQuery(e.target.value)}
                      placeholder="Digite o email ou nome do usuário"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUserForPassword()}
                    />
                    <Button 
                      onClick={handleSearchUserForPassword}
                      disabled={searchingPassword}
                      variant="game"
                    >
                      {searchingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  {passwordSearchResults.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nova Senha</label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nova senha (mínimo 6 caracteres)"
                          minLength={6}
                        />
                      </div>

                      <div className="border rounded-lg divide-y">
                        {passwordSearchResults.map((user) => (
                          <div key={user.id} className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.email}</p>
                              {user.name && <p className="text-sm text-muted-foreground">{user.name}</p>}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleChangePassword(user.id, user.email)}
                              disabled={changingPassword || !newPassword}
                            >
                              {changingPassword ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Alterando...
                                </>
                              ) : (
                                'Alterar Senha'
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        )}

        {activeSection === 'list' && (
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os usuários do sistema. Por segurança, senhas não podem ser visualizadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button 
                    onClick={handleDeleteAllUsers} 
                    disabled={deletingUsers || users.length === 0}
                    variant="destructive"
                    size="sm"
                  >
                    {deletingUsers ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      'Deletar Todos os Usuários'
                    )}
                  </Button>
                </div>
                {loadingUsers ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">Nenhum usuário encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{user.email || 'Email não cadastrado'}</p>
                            {user.name && <p className="text-sm text-muted-foreground">{user.name}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                              Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {user.roles.length > 0 ? (
                              user.roles.map((role: string) => (
                                <span 
                                  key={role}
                                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                                user
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
        )}

        {activeSection === 'sponsors-list' && (
            <Card>
              <CardHeader>
                <CardTitle>Patrocinadores Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os patrocinadores cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSponsors ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : sponsors.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">Nenhum patrocinador cadastrado</p>
                ) : (
                  <div className="space-y-4">
                    {sponsors.map((sponsor: any) => (
                      <div key={sponsor.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img 
                              src={sponsor.logo_url} 
                              alt="Logo do Patrocinador" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg text-foreground">{sponsor.name || 'Nome não cadastrado'}</p>
                            <p className="text-sm text-muted-foreground mt-1">Cidade: {sponsor.city || 'Não informada'}</p>
                            <p className="text-sm text-muted-foreground">Prêmios: {sponsor.prize_count || 1}</p>
                            <p className="font-medium text-foreground mt-2">Prêmio: {sponsor.prize_description}</p>
                            <p className="text-sm text-muted-foreground mt-1">Telefone: {sponsor.phone}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Cadastrado em: {new Date(sponsor.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSponsor(sponsor.id)}
                            disabled={deletingSponsor}
                          >
                            {deletingSponsor ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </CardContent>
          </Card>
      )}

        {activeSection === 'registrations' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Promotores Cadastrados</CardTitle>
                <CardDescription>
                  Lista de cadastros de promotores pendentes ou processados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSponsorRegistrations ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : sponsorRegistrations.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">Nenhum cadastro encontrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Endereço</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>UF</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sponsorRegistrations.map((registration: any) => (
                          <TableRow key={registration.id}>
                            <TableCell className="font-medium">{registration.name}</TableCell>
                            <TableCell>{registration.address}</TableCell>
                            <TableCell>{registration.city}</TableCell>
                            <TableCell>{registration.state}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded ${
                                registration.status === 'approved' 
                                  ? 'bg-green-500/10 text-green-500'
                                  : registration.status === 'rejected'
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-yellow-500/10 text-yellow-500'
                              }`}>
                                {registration.status === 'approved' ? 'Aprovado' : 
                                 registration.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedRegistration(registration)}
                              >
                                Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!selectedRegistration} onOpenChange={(open) => !open && setSelectedRegistration(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detalhes do Cadastro</DialogTitle>
                  <DialogDescription>
                    Informações completas do promotor cadastrado
                  </DialogDescription>
                </DialogHeader>
                {selectedRegistration && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome</label>
                        <p className="text-foreground">{selectedRegistration.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                        <p className="text-foreground">{selectedRegistration.company}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Celular</label>
                        <p className="text-foreground">{selectedRegistration.phone || 'Não informado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-foreground">{selectedRegistration.email || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Cidade</label>
                        <p className="text-foreground">{selectedRegistration.city}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Estado</label>
                        <p className="text-foreground">{selectedRegistration.state}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Endereço Completo</label>
                      <p className="text-foreground">{selectedRegistration.address}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Plano</label>
                        <p className="text-foreground">{selectedRegistration.plan}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Valor</label>
                        <p className="text-foreground">R$ {selectedRegistration.plan_value}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className={`font-medium ${
                        selectedRegistration.status === 'approved' 
                          ? 'text-green-500'
                          : selectedRegistration.status === 'rejected'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                      }`}>
                        {selectedRegistration.status === 'approved' ? 'Aprovado' : 
                         selectedRegistration.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground">Data de Validade</label>
                      <p className="text-foreground mb-2">
                        {selectedRegistration.validity_date 
                          ? new Date(selectedRegistration.validity_date).toLocaleDateString('pt-BR')
                          : 'Não definida'}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={newValidityDate}
                          onChange={(e) => setNewValidityDate(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateValidityDate(selectedRegistration.id)}
                          disabled={editingValidityDate || !newValidityDate}
                        >
                          {editingValidityDate ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Atualizar'
                          )}
                        </Button>
                      </div>
                    </div>

                    {selectedRegistration.payment_proof_url && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Comprovante de Pagamento</label>
                        <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                          <img 
                            src={selectedRegistration.payment_proof_url} 
                            alt="Comprovante de Pagamento"
                            className="max-h-96 w-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      <p>Cadastrado em: {new Date(selectedRegistration.created_at).toLocaleString('pt-BR')}</p>
                      <p>Atualizado em: {new Date(selectedRegistration.updated_at).toLocaleString('pt-BR')}</p>
                    </div>

                    {selectedRegistration.status === 'pending' && (
                      <div className="flex gap-4 pt-4 border-t">
                        <Button
                          variant="default"
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => handleApproveRegistration(selectedRegistration.id, true)}
                          disabled={approvingRegistration}
                        >
                          {approvingRegistration ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Validar Cadastro
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleApproveRegistration(selectedRegistration.id, false)}
                          disabled={approvingRegistration}
                        >
                          {approvingRegistration ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Rejeitar por Falta de Pagamento
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}

        {activeSection === 'shortcuts' && (
          <Card>
            <CardHeader>
              <CardTitle>Atalhos para Etapas</CardTitle>
              <CardDescription>Navegue diretamente para qualquer etapa do jogo (modo teste)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={async () => {
                    const { data: sponsorData } = await supabase
                      .from('sponsors')
                      .select('*')
                      .limit(1)
                      .maybeSingle();
                    
                    if (sponsorData) {
                      localStorage.setItem('testMode', 'true');
                      localStorage.setItem('testSponsor', JSON.stringify(sponsorData));
                      navigate('/stage/2');
                    } else {
                      toast({
                        title: "Erro",
                        description: "Cadastre um patrocinador primeiro",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-gradient-primary text-primary-foreground h-16"
                  size="lg"
                >
                  Ir para Etapa 2
                </Button>
                <Button
                  onClick={async () => {
                    const { data: sponsorData } = await supabase
                      .from('sponsors')
                      .select('*')
                      .limit(1)
                      .maybeSingle();
                    
                    if (sponsorData) {
                      localStorage.setItem('testMode', 'true');
                      localStorage.setItem('testSponsor', JSON.stringify(sponsorData));
                      navigate('/stage/3');
                    } else {
                      toast({
                        title: "Erro",
                        description: "Cadastre um patrocinador primeiro",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-gradient-success text-success-foreground h-16"
                  size="lg"
                >
                  Ir para Etapa 3
                </Button>
                <Button
                  onClick={async () => {
                    const { data: sponsorData } = await supabase
                      .from('sponsors')
                      .select('*')
                      .limit(1)
                      .maybeSingle();
                    
                    if (sponsorData) {
                      localStorage.setItem('testMode', 'true');
                      localStorage.setItem('testSponsor', JSON.stringify(sponsorData));
                      navigate('/stage/4');
                    } else {
                      toast({
                        title: "Erro",
                        description: "Cadastre um patrocinador primeiro",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-gradient-primary text-primary-foreground h-16"
                  size="lg"
                >
                  Ir para Etapa 4
                </Button>
                <Button
                  onClick={async () => {
                    const { data: sponsorData } = await supabase
                      .from('sponsors')
                      .select('*')
                      .limit(1)
                      .maybeSingle();
                    
                    if (sponsorData) {
                      localStorage.setItem('testMode', 'true');
                      localStorage.setItem('testSponsor', JSON.stringify(sponsorData));
                      navigate('/stage/5');
                    } else {
                      toast({
                        title: "Erro",
                        description: "Cadastre um patrocinador primeiro",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-gradient-success text-success-foreground h-16"
                  size="lg"
                >
                  Ir para Etapa 5
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
