import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, MapPin, Shield, Building, MessageSquare, Paperclip } from 'lucide-react';
import { createAdminUser } from '@/lib/adminUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Users, UserX, Key, List, Zap, Store, CheckCircle, XCircle, Cog } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userListSearchQuery, setUserListSearchQuery] = useState('');
  const [userListCurrentPage, setUserListCurrentPage] = useState(1);
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
  const [sponsorsStatusFilter, setSponsorsStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [sponsorsSearchFilter, setSponsorsSearchFilter] = useState('');
  const [sponsorsCurrentPage, setSponsorsCurrentPage] = useState(1);
  const [sponsorRegistrations, setSponsorRegistrations] = useState<any[]>([]);
  const [loadingSponsorRegistrations, setLoadingSponsorRegistrations] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
  const [approvingRegistration, setApprovingRegistration] = useState(false);
  const [editingValidityDate, setEditingValidityDate] = useState(false);
  const [newValidityDate, setNewValidityDate] = useState('');
  const [activeSection, setActiveSection] = useState<'users' | 'delete' | 'password' | 'list' | 'shortcuts' | 'sponsors-list' | 'registrations' | 'pending-promotions' | 'config' | 'cities' | 'messages'>('users');
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pendingMessagesCount, setPendingMessagesCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [registeredCities, setRegisteredCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [addingCity, setAddingCity] = useState(false);
  const [deletingCity, setDeletingCity] = useState(false);
  const [promotionLimits, setPromotionLimits] = useState({
    basic_test_max_prizes: 10,
    monthly_annual_max_prizes: 100,
    basic_test_max_promotions: 3,
    monthly_annual_max_promotions: 10,
    plan_weekly_price: 10.00,
    plan_monthly_price: 10.00,
    plan_annual_price: 10.00,
    max_daily_plays: 50,
    map_radius_km: 25,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const [togglingPromotions, setTogglingPromotions] = useState(false);
  const [pendingPromotions, setPendingPromotions] = useState<any[]>([]);
  const [loadingPendingPromotions, setLoadingPendingPromotions] = useState(false);
  const [approvingPromotion, setApprovingPromotion] = useState(false);
  const [selectedPendingPromotion, setSelectedPendingPromotion] = useState<any | null>(null);
  const [sponsorSearchDialogOpen, setSponsorSearchDialogOpen] = useState(false);
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState('');
  const [sponsorSearchResults, setSponsorSearchResults] = useState<any[]>([]);
  const [searchingSponsors, setSearchingSponsors] = useState(false);
  const [selectedPromotionForSponsor, setSelectedPromotionForSponsor] = useState<any | null>(null);
  const [updatingSponsor, setUpdatingSponsor] = useState(false);
  const [registrationsStatusFilter, setRegistrationsStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [registrationsCityFilter, setRegistrationsCityFilter] = useState('');
  const [registrationsCurrentPage, setRegistrationsCurrentPage] = useState(1);
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<any | null>(null);
  const [editSponsorData, setEditSponsorData] = useState({
    promotion_end_date: '',
    prize_description: '',
    address: '',
    city: '',
    state: '',
  });
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [geocodingSponsor, setGeocodingSponsor] = useState(false);
  const [geocodeConfirmation, setGeocodeConfirmation] = useState<{
    latitude: number;
    longitude: number;
    formatted_address: string;
    confidence: string;
  } | null>(null);
  const [showGeocodeConfirm, setShowGeocodeConfirm] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadPromotionsSetting();
    loadPromotionLimits();
    loadPendingMessagesCount();
  }, []);

  const loadPromotionLimits = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'promotion_limits')
        .single();

      if (data?.setting_value) {
        const limits = data.setting_value as any;
        setPromotionLimits({
          basic_test_max_prizes: limits.basic_test_max_prizes ?? 10,
          monthly_annual_max_prizes: limits.monthly_annual_max_prizes ?? 100,
          basic_test_max_promotions: limits.basic_test_max_promotions ?? 3,
          monthly_annual_max_promotions: limits.monthly_annual_max_promotions ?? 10,
          plan_weekly_price: limits.plan_weekly_price ?? 10.00,
          plan_monthly_price: limits.plan_monthly_price ?? 10.00,
          plan_annual_price: limits.plan_annual_price ?? 10.00,
          max_daily_plays: limits.max_daily_plays ?? 50,
          map_radius_km: limits.map_radius_km ?? 25,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
    }
  };

  const loadPendingMessagesCount = async () => {
    try {
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setPendingMessagesCount(count || 0);
    } catch (error) {
      console.error('Erro ao carregar contagem de mensagens:', error);
    }
  };

  const loadSupportMessages = async () => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('is_read', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupportMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      loadSupportMessages();
      loadPendingMessagesCount();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleSendAdminReply = async () => {
    if (!selectedMessage || !adminReply.trim()) {
      toast({ title: "Erro", description: "Escreva uma resposta.", variant: "destructive" });
      return;
    }

    setSendingReply(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({
          admin_reply: adminReply.trim(),
          admin_replied_at: new Date().toISOString(),
          is_read: true,
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      toast({ title: "Resposta enviada!", description: "A resposta foi registrada com sucesso." });
      setSelectedMessage(null);
      setAdminReply('');
      loadSupportMessages();
      loadPendingMessagesCount();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'promotion_limits',
          setting_value: promotionLimits
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: "Os limites foram atualizados com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingConfig(false);
    }
  };

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
      const { data: sponsorsData, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get player counts for each sponsor
      const sponsorsWithPlayerCount = await Promise.all(
        (sponsorsData || []).map(async (sponsor) => {
          const { count } = await supabase
            .from('game_results')
            .select('*', { count: 'exact', head: true })
            .eq('sponsor_id', sponsor.id);
          
          return {
            ...sponsor,
            player_count: count || 0
          };
        })
      );

      setSponsors(sponsorsWithPlayerCount);
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

  const loadPendingPromotions = async () => {
    setLoadingPendingPromotions(true);
    try {
      const { data, error } = await supabase
        .from('pending_promotions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingPromotions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar promoções pendentes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPendingPromotions(false);
    }
  };

  const handleApprovePromotion = async (promotion: any, approve: boolean) => {
    if (!confirm(`Tem certeza que deseja ${approve ? 'aprovar' : 'rejeitar'} esta promoção?`)) {
      return;
    }

    setApprovingPromotion(true);
    try {
      if (approve) {
        // Inserir na tabela sponsors
        const sponsorData = {
          user_id: promotion.user_id,
          sponsor_registration_id: promotion.sponsor_registration_id,
          name: promotion.name,
          phone: promotion.phone,
          logo_url: promotion.logo_url,
          prize_description: promotion.prize_description,
          prize_count: promotion.prize_count,
          promotion_end_date: promotion.promotion_end_date,
          city: promotion.city,
          state: promotion.state,
          latitude: promotion.latitude,
          longitude: promotion.longitude,
        };

        const { error: insertError } = await supabase
          .from('sponsors')
          .insert(sponsorData);

        if (insertError) throw insertError;
      }

      // Excluir da tabela pending_promotions
      const { error: deleteError } = await supabase
        .from('pending_promotions')
        .delete()
        .eq('id', promotion.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Sucesso!",
        description: `Promoção ${approve ? 'aprovada' : 'rejeitada'} com sucesso.`,
      });

      setSelectedPendingPromotion(null);
      loadPendingPromotions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApprovingPromotion(false);
    }
  };

  const handleSearchSponsor = async () => {
    if (!sponsorSearchQuery.trim()) return;
    
    setSearchingSponsors(true);
    try {
      const { data, error } = await supabase
        .from('sponsor_registrations')
        .select('*')
        .eq('status', 'approved')
        .or(`name.ilike.%${sponsorSearchQuery}%,company.ilike.%${sponsorSearchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSponsorSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar patrocinadores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearchingSponsors(false);
    }
  };

  const handleAssociateSponsor = async (sponsorRegistration: any) => {
    if (!selectedPromotionForSponsor) return;
    
    setUpdatingSponsor(true);
    try {
      // Atualiza a promoção pendente com os dados do patrocinador, incluindo user_id
      const { error } = await supabase
        .from('pending_promotions')
        .update({
          user_id: sponsorRegistration.user_id, // IMPORTANTE: Associa a promoção ao patrocinador
          sponsor_registration_id: sponsorRegistration.id,
          name: sponsorRegistration.company,
          phone: sponsorRegistration.phone,
          city: sponsorRegistration.city,
          state: sponsorRegistration.state,
        })
        .eq('id', selectedPromotionForSponsor.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Patrocinador associado com sucesso. A promoção aparecerá no dashboard do patrocinador após aprovação.",
      });

      setSponsorSearchDialogOpen(false);
      setSponsorSearchQuery('');
      setSponsorSearchResults([]);
      setSelectedPromotionForSponsor(null);
      loadPendingPromotions();
    } catch (error: any) {
      toast({
        title: "Erro ao associar patrocinador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingSponsor(false);
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

  const loadPromotionsSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'promotions_registration_enabled')
        .single();

      if (error) throw error;
      const settingValue = data?.setting_value as { enabled: boolean } | null;
      setPromotionsEnabled(settingValue?.enabled ?? true);
    } catch (error: any) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleTogglePromotions = async () => {
    setTogglingPromotions(true);
    try {
      const newValue = !promotionsEnabled;
      
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: { enabled: newValue },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'promotions_registration_enabled');

      if (error) throw error;

      setPromotionsEnabled(newValue);
      toast({
        title: "Configuração atualizada!",
        description: `Cadastros de promoções ${newValue ? 'ativados' : 'bloqueados'} com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTogglingPromotions(false);
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

  const loadRegisteredCities = async () => {
    setLoadingCities(true);
    try {
      const { data, error } = await supabase
        .from('registered_cities')
        .select('*')
        .order('state', { ascending: true })
        .order('city', { ascending: true });

      if (error) throw error;
      setRegisteredCities(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cidades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingCities(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim() || !newCityState.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha cidade e estado.",
        variant: "destructive",
      });
      return;
    }

    setAddingCity(true);
    try {
      const { error } = await supabase
        .from('registered_cities')
        .insert({
          city: newCityName.trim(),
          state: newCityState.trim().toUpperCase()
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Esta cidade/estado já está cadastrada.');
        }
        throw error;
      }

      toast({
        title: "Cidade cadastrada!",
        description: `${newCityName.trim()} - ${newCityState.trim().toUpperCase()} adicionada com sucesso.`,
      });

      setNewCityName('');
      setNewCityState('');
      loadRegisteredCities();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingCity(false);
    }
  };

  const handleDeleteCity = async (cityId: string, cityName: string, cityState: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${cityName} - ${cityState}?`)) return;

    setDeletingCity(true);
    try {
      const { error } = await supabase
        .from('registered_cities')
        .delete()
        .eq('id', cityId);

      if (error) throw error;

      toast({
        title: "Cidade excluída!",
        description: `${cityName} - ${cityState} removida com sucesso.`,
      });

      loadRegisteredCities();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingCity(false);
    }
  };

  const handleOpenEditSponsor = (sponsor: any) => {
    setEditingSponsor(sponsor);
    setEditSponsorData({
      promotion_end_date: sponsor.promotion_end_date 
        ? new Date(sponsor.promotion_end_date).toISOString().slice(0, 16) 
        : '',
      prize_description: sponsor.prize_description || '',
      address: sponsor.address || '',
      city: sponsor.city || '',
      state: sponsor.state || '',
    });
  };

  const handleSaveSponsor = async () => {
    if (!editingSponsor) return;
    setSavingSponsor(true);
    try {
      const updateData: any = {
        prize_description: editSponsorData.prize_description,
        city: editSponsorData.city,
        state: editSponsorData.state.toUpperCase(),
        address: editSponsorData.address,
      };
      if (editSponsorData.promotion_end_date) {
        updateData.promotion_end_date = new Date(editSponsorData.promotion_end_date).toISOString();
      }

      const { error } = await supabase
        .from('sponsors')
        .update(updateData)
        .eq('id', editingSponsor.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Promoção atualizada com sucesso.",
      });
      setEditingSponsor(null);
      loadSponsors();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingSponsor(false);
    }
  };

  const handleGeocodeSponsor = async () => {
    if (!editingSponsor) return;
    setGeocodingSponsor(true);
    try {
      const response = await supabase.functions.invoke('ai-geocode', {
        body: { 
          address: editSponsorData.address,
          city: editSponsorData.city,
          state: editSponsorData.state
        }
      });

      if (response.error) throw new Error(response.error.message || 'Erro na geocodificação');

      const data = response.data;
      if (!data?.success || !data?.latitude || !data?.longitude) {
        toast({
          title: "Não encontrado",
          description: data?.error || "Não foi possível encontrar a geolocalização deste endereço.",
          variant: "destructive",
        });
        return;
      }

      setGeocodeConfirmation({
        latitude: data.latitude,
        longitude: data.longitude,
        formatted_address: data.formatted_address,
        confidence: data.confidence,
      });
      setShowGeocodeConfirm(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeocodingSponsor(false);
    }
  };

  const handleConfirmGeocode = async () => {
    if (!editingSponsor || !geocodeConfirmation) return;
    setSavingSponsor(true);
    try {
      const { error } = await supabase
        .from('sponsors')
        .update({ 
          latitude: geocodeConfirmation.latitude, 
          longitude: geocodeConfirmation.longitude,
          address: editSponsorData.address,
          city: editSponsorData.city,
          state: editSponsorData.state.toUpperCase(),
        })
        .eq('id', editingSponsor.id);

      if (error) throw error;

      setEditingSponsor({ 
        ...editingSponsor, 
        latitude: geocodeConfirmation.latitude, 
        longitude: geocodeConfirmation.longitude 
      });
      setShowGeocodeConfirm(false);
      setGeocodeConfirmation(null);
      toast({
        title: "Sucesso!",
        description: `Geolocalização atualizada: ${geocodeConfirmation.latitude.toFixed(4)}, ${geocodeConfirmation.longitude.toFixed(4)}`,
      });
      loadSponsors();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingSponsor(false);
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
    { id: 'config', label: 'Configuração', icon: Cog, color: 'bg-gray-600 hover:bg-gray-700' },
    { id: 'create-promotion', label: 'Cadastrar nova promoção', icon: Settings, color: 'bg-blue-500 hover:bg-blue-600', isNavigation: true },
    { id: 'pending-promotions', label: 'Promoções Pendentes', icon: CheckCircle, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { id: 'sponsors-list', label: 'Promoções', icon: Users, color: 'bg-indigo-500 hover:bg-indigo-600' },
    { id: 'registrations', label: 'Patrocinadores', icon: Store, color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'users', label: 'Criar Admin', icon: UserPlus, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'delete', label: 'Excluir Usuário', icon: UserX, color: 'bg-red-500 hover:bg-red-600' },
    { id: 'password', label: 'Mudar Senha', icon: Key, color: 'bg-amber-500 hover:bg-amber-600' },
    { id: 'list', label: 'Lista Usuários', icon: List, color: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'shortcuts', label: 'Atalhos Etapas', icon: Zap, color: 'bg-cyan-500 hover:bg-cyan-600' },
    { id: 'cities', label: 'Cidades Cadastradas', icon: Building, color: 'bg-teal-500 hover:bg-teal-600' },
    { id: 'messages', label: `Mensagens${pendingMessagesCount > 0 ? ` (${pendingMessagesCount})` : ''}`, icon: MessageSquare, color: 'bg-pink-500 hover:bg-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Painel Administrativo
          </h1>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {promotionsEnabled ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold">Cadastros de Promoções</p>
                    <p className="text-sm text-muted-foreground">
                      {promotionsEnabled ? 'Habilitados' : 'Bloqueados'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleTogglePromotions}
                  disabled={togglingPromotions}
                  variant={promotionsEnabled ? "destructive" : "default"}
                  size="sm"
                >
                  {togglingPromotions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : promotionsEnabled ? (
                    'Bloquear'
                  ) : (
                    'Ativar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menuButtons.map((button) => {
            const Icon = button.icon;
            return (
              <Button
                key={button.id}
                onClick={() => {
                  if (button.isNavigation) {
                    navigate('/create-promotion');
                  } else {
                    setActiveSection(button.id as any);
                    if (button.id === 'list') loadUsers();
                    if (button.id === 'sponsors-list') loadSponsors();
                    if (button.id === 'registrations') loadSponsorRegistrations();
                    if (button.id === 'pending-promotions') loadPendingPromotions();
                    if (button.id === 'cities') loadRegisteredCities();
                    if (button.id === 'messages') loadSupportMessages();
                  }
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

        {activeSection === 'config' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Sistema</CardTitle>
              <CardDescription>Defina os limites de prêmios e promoções</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Patrocinadores</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Máx. prêmios/promoção (Plano Básico/Teste)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={promotionLimits.basic_test_max_prizes}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        basic_test_max_prizes: Math.min(100, Math.max(1, parseInt(e.target.value) || 1))
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo: 1, Máximo: 100</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Máx. prêmios/promoção (Plano Mensal/Anual)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={promotionLimits.monthly_annual_max_prizes}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        monthly_annual_max_prizes: Math.min(100, Math.max(1, parseInt(e.target.value) || 1))
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo: 1, Máximo: 100</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Máx. promoções/mês (Plano Básico/Teste)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={promotionLimits.basic_test_max_promotions}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        basic_test_max_promotions: Math.min(100, Math.max(1, parseInt(e.target.value) || 1))
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo: 1, Máximo: 100</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Máx. promoções/mês (Plano Mensal/Anual)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={promotionLimits.monthly_annual_max_promotions}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        monthly_annual_max_promotions: Math.min(100, Math.max(1, parseInt(e.target.value) || 1))
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo: 1, Máximo: 100</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-lg">Valores dos Planos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Plano Semanal (R$)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={promotionLimits.plan_weekly_price}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        plan_weekly_price: Math.max(0.01, parseFloat(e.target.value) || 0.01)
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plano Mensal (R$)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={promotionLimits.plan_monthly_price}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        plan_monthly_price: Math.max(0.01, parseFloat(e.target.value) || 0.01)
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plano Anual (R$)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={promotionLimits.plan_annual_price}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        plan_annual_price: Math.max(0.01, parseFloat(e.target.value) || 0.01)
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-lg">Jogadores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Máx. jogadas por usuário por dia</Label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={promotionLimits.max_daily_plays}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        max_daily_plays: Math.min(1000, Math.max(1, parseInt(e.target.value) || 1))
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Número máximo de jogadas completas por dia por jogador</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-lg">Mapa de Promoções</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Raio do mapa (km)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="500"
                      value={promotionLimits.map_radius_km}
                      onChange={(e) => setPromotionLimits({
                        ...promotionLimits,
                        map_radius_km: Math.min(500, Math.max(1, parseInt(e.target.value) || 25))
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Raio em quilômetros para exibir promoções ativas no mapa</p>
                  </div>
                </div>
                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Ranking:</strong> A quantidade de jogadores armazenados e listados no ranking é igual à 
                    <strong> quantidade de prêmios da promoção + 10</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este valor é calculado automaticamente com base na quantidade de prêmios de cada promoção.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSaveConfig} 
                disabled={savingConfig}
                className="w-full"
                size="lg"
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : 'Salvar Configurações'}
              </Button>
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

        {activeSection === 'pending-promotions' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Promoções Pendentes de Aprovação</CardTitle>
                <CardDescription>Promoções criadas por patrocinadores aguardando sua aprovação</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPendingPromotions ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : pendingPromotions.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">Nenhuma promoção pendente de aprovação</p>
                ) : (
                  <div className="space-y-4">
                    {pendingPromotions.map((promotion) => (
                      <div key={promotion.id} className="border border-border rounded-lg p-4">
                        <div className="flex gap-4">
                          {promotion.logo_url && (
                            <img 
                              src={promotion.logo_url} 
                              alt={promotion.name || 'Logo'}
                              className="w-16 h-16 object-contain rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{promotion.name || 'Sem nome'}</p>
                            <p className="text-sm text-muted-foreground">{promotion.prize_description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Telefone: {promotion.phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Prêmios: {promotion.prize_count}
                            </p>
                            {promotion.promotion_end_date && (
                              <p className="text-xs text-muted-foreground">
                                Término: {new Date(promotion.promotion_end_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                            {promotion.ai_validation_notes && (
                              <Alert className="mt-2 bg-amber-50 dark:bg-amber-950/30 border-amber-500">
                                <Shield className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                                  <p className="font-semibold">⚠ Conteúdo reprovado pela IA:</p>
                                  {promotion.ai_validation_notes.split('\n').map((note: string, i: number) => (
                                    <p key={i}>{note}</p>
                                  ))}
                                </AlertDescription>
                              </Alert>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Criado em: {new Date(promotion.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedPromotionForSponsor(promotion);
                              setSponsorSearchDialogOpen(true);
                            }}
                          >
                            <Store className="h-4 w-4 mr-1" />
                            Patrocinador
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprovePromotion(promotion, true)}
                            disabled={approvingPromotion}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            {approvingPromotion ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleApprovePromotion(promotion, false)}
                            disabled={approvingPromotion}
                          >
                            {approvingPromotion ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={sponsorSearchDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setSponsorSearchDialogOpen(false);
                setSponsorSearchQuery('');
                setSponsorSearchResults([]);
                setSelectedPromotionForSponsor(null);
              }
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Associar Patrocinador</DialogTitle>
                  <DialogDescription>
                    Pesquise por nome da empresa ou nome do patrocinador
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={sponsorSearchQuery}
                      onChange={(e) => setSponsorSearchQuery(e.target.value)}
                      placeholder="Digite o nome..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSponsor()}
                    />
                    <Button 
                      onClick={handleSearchSponsor} 
                      disabled={searchingSponsors}
                      variant="secondary"
                    >
                      {searchingSponsors ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>

                  {sponsorSearchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {sponsorSearchResults.map((sponsor) => (
                        <div 
                          key={sponsor.id} 
                          className="border border-border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleAssociateSponsor(sponsor)}
                        >
                          <p className="font-medium">{sponsor.company}</p>
                          <p className="text-sm text-muted-foreground">{sponsor.name}</p>
                          <p className="text-xs text-muted-foreground">{sponsor.city} - {sponsor.state}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {sponsorSearchResults.length === 0 && sponsorSearchQuery && !searchingSponsors && (
                    <p className="text-center text-muted-foreground text-sm">
                      Nenhum patrocinador encontrado
                    </p>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSponsorSearchDialogOpen(false);
                        setSponsorSearchQuery('');
                        setSponsorSearchResults([]);
                        setSelectedPromotionForSponsor(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
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
                  <Input
                    type="text"
                    value={userListSearchQuery}
                    onChange={(e) => {
                      setUserListSearchQuery(e.target.value);
                      setUserListCurrentPage(1);
                    }}
                    placeholder="Filtrar por nome..."
                    className="max-w-sm"
                  />
                </div>
                {loadingUsers ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">Nenhum usuário encontrado</p>
                ) : (() => {
                  const filteredUsers = users.filter(user => 
                    !userListSearchQuery || 
                    (user.name && user.name.toLowerCase().includes(userListSearchQuery.toLowerCase()))
                  );
                  const usersPerPage = 10;
                  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
                  const startIndex = (userListCurrentPage - 1) * usersPerPage;
                  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

                  return (
                    <div className="space-y-4">
                      {filteredUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground p-8">Nenhum usuário encontrado com esse nome</p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Exibindo {startIndex + 1}-{Math.min(startIndex + usersPerPage, filteredUsers.length)} de {filteredUsers.length} usuário(s)
                          </p>
                          {paginatedUsers.map((user) => (
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
                          {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserListCurrentPage(p => Math.max(1, p - 1))}
                                disabled={userListCurrentPage === 1}
                              >
                                Anterior
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Página {userListCurrentPage} de {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserListCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={userListCurrentPage === totalPages}
                              >
                                Próxima
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
        )}

        {activeSection === 'sponsors-list' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Promoções</CardTitle>
                <CardDescription>
                  Lista de todas as promoções cadastradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sponsorsStatusFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSponsorsStatusFilter('all');
                        setSponsorsCurrentPage(1);
                      }}
                    >
                      Todas
                    </Button>
                    <Button
                      variant={sponsorsStatusFilter === 'active' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSponsorsStatusFilter('active');
                        setSponsorsCurrentPage(1);
                      }}
                      className={sponsorsStatusFilter === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      Ativas
                    </Button>
                    <Button
                      variant={sponsorsStatusFilter === 'expired' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSponsorsStatusFilter('expired');
                        setSponsorsCurrentPage(1);
                      }}
                      className={sponsorsStatusFilter === 'expired' ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      Vencidas
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={sponsorsSearchFilter}
                    onChange={(e) => {
                      setSponsorsSearchFilter(e.target.value);
                      setSponsorsCurrentPage(1);
                    }}
                    placeholder="Filtrar por cidade ou patrocinador..."
                    className="max-w-sm"
                  />
                </div>
                {loadingSponsors ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : sponsors.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">Nenhuma promoção cadastrada</p>
                ) : (() => {
                  const now = new Date();
                  const filteredSponsors = sponsors.filter((sponsor) => {
                    // Filter by status
                    const isExpired = sponsor.promotion_end_date && new Date(sponsor.promotion_end_date) < now;
                    if (sponsorsStatusFilter === 'active' && isExpired) return false;
                    if (sponsorsStatusFilter === 'expired' && !isExpired) return false;
                    
                    // Filter by search (city or name)
                    if (sponsorsSearchFilter) {
                      const searchLower = sponsorsSearchFilter.toLowerCase();
                      const matchesCity = sponsor.city && sponsor.city.toLowerCase().includes(searchLower);
                      const matchesName = sponsor.name && sponsor.name.toLowerCase().includes(searchLower);
                      if (!matchesCity && !matchesName) return false;
                    }
                    
                    return true;
                  });
                  
                  const sponsorsPerPage = 10;
                  const totalPages = Math.ceil(filteredSponsors.length / sponsorsPerPage);
                  const startIndex = (sponsorsCurrentPage - 1) * sponsorsPerPage;
                  const paginatedSponsors = filteredSponsors.slice(startIndex, startIndex + sponsorsPerPage);
                  
                  return (
                    <div className="space-y-4">
                      {filteredSponsors.length === 0 ? (
                        <p className="text-center text-muted-foreground p-8">Nenhuma promoção encontrada com os filtros aplicados</p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Exibindo {startIndex + 1}-{Math.min(startIndex + sponsorsPerPage, filteredSponsors.length)} de {filteredSponsors.length} promoção(ões)
                          </p>
                          {paginatedSponsors.map((sponsor: any) => {
                            const isExpired = sponsor.promotion_end_date && new Date(sponsor.promotion_end_date) < now;
                            return (
                              <div key={sponsor.id} className={`border rounded-lg p-4 ${isExpired ? 'border-red-500/50 bg-red-500/5' : 'border-border'}`}>
                                <div className="flex items-start gap-4">
                                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    <img 
                                      src={sponsor.logo_url} 
                                      alt="Logo do Patrocinador" 
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-lg text-foreground">{sponsor.name || 'Nome não cadastrado'}</p>
                                      {isExpired && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-red-500/10 text-red-500">Vencida</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Cidade: {sponsor.city || 'Não informada'}</p>
                                    <p className="text-sm text-muted-foreground">Prêmios: {sponsor.prize_count || 1}</p>
                                    <p className="font-medium text-foreground mt-2">Prêmio: {sponsor.prize_description}</p>
                                    <p className="text-sm text-muted-foreground mt-1">Telefone: {sponsor.phone}</p>
                                    {sponsor.promotion_end_date && (
                                      <p className={`text-sm mt-1 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        Vencimento: {new Date(sponsor.promotion_end_date).toLocaleString('pt-BR')}
                                      </p>
                                    )}
                                    <p className="text-sm font-semibold text-primary mt-1">
                                      Total de jogadores: {sponsor.player_count || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Cadastrado em: {new Date(sponsor.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleOpenEditSponsor(sponsor)}
                                    >
                                      <Cog className="h-4 w-4" />
                                    </Button>
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
                              </div>
                            );
                          })}
                          {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSponsorsCurrentPage(p => Math.max(1, p - 1))}
                                disabled={sponsorsCurrentPage === 1}
                              >
                                Anterior
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Página {sponsorsCurrentPage} de {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSponsorsCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={sponsorsCurrentPage === totalPages}
                              >
                                Próxima
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Dialog open={!!editingSponsor} onOpenChange={(open) => {
              if (!open) setEditingSponsor(null);
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle>Manutenção da Promoção</DialogTitle>
                  <DialogDescription>
                    Atualize os dados da promoção: {editingSponsor?.name}
                  </DialogDescription>
                </DialogHeader>
                {editingSponsor && (
                  <div className="space-y-4">
                    <div>
                      <Label>Data e Hora de Vencimento</Label>
                      <Input
                        type="datetime-local"
                        value={editSponsorData.promotion_end_date}
                        onChange={(e) => setEditSponsorData(prev => ({ ...prev, promotion_end_date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label>Descrição do Prêmio</Label>
                      <Textarea
                        value={editSponsorData.prize_description}
                        onChange={(e) => setEditSponsorData(prev => ({ ...prev, prize_description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold">Endereço</Label>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label className="text-xs">Endereço Completo</Label>
                          <Input
                            value={editSponsorData.address}
                            onChange={(e) => setEditSponsorData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Rua, número, bairro..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Cidade</Label>
                            <Input
                              value={editSponsorData.city}
                              onChange={(e) => setEditSponsorData(prev => ({ ...prev, city: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Estado</Label>
                            <Input
                              value={editSponsorData.state}
                              onChange={(e) => setEditSponsorData(prev => ({ ...prev, state: e.target.value }))}
                              maxLength={2}
                            />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleGeocodeSponsor}
                          disabled={geocodingSponsor || !editSponsorData.address}
                        >
                          {geocodingSponsor ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Geocodificando...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              Atualizar Geolocalização
                            </>
                          )}
                        </Button>
                        {editingSponsor.latitude && editingSponsor.longitude && (
                          <p className="text-xs text-green-500">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            Geolocalização atual: {editingSponsor.latitude.toFixed(4)}, {editingSponsor.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                      <Button
                        className="flex-1"
                        onClick={handleSaveSponsor}
                        disabled={savingSponsor}
                      >
                        {savingSponsor ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar Alterações'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingSponsor(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Geocode Confirmation Dialog */}
            <Dialog open={showGeocodeConfirm} onOpenChange={setShowGeocodeConfirm}>
              <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle>Confirmar Geolocalização</DialogTitle>
                  <DialogDescription>
                    Verifique os dados retornados pela IA antes de salvar.
                  </DialogDescription>
                </DialogHeader>
                {geocodeConfirmation && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Endereço Pesquisado</Label>
                        <p className="text-sm font-medium">
                          {editSponsorData.address}, {editSponsorData.city} - {editSponsorData.state}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Endereço Encontrado pela IA</Label>
                        <p className="text-sm font-medium">{geocodeConfirmation.formatted_address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Latitude</Label>
                          <p className="text-sm font-mono font-medium">{geocodeConfirmation.latitude.toFixed(6)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Longitude</Label>
                          <p className="text-sm font-mono font-medium">{geocodeConfirmation.longitude.toFixed(6)}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Nível de Confiança</Label>
                        <p className={`text-sm font-medium ${
                          geocodeConfirmation.confidence === 'high' ? 'text-green-600' :
                          geocodeConfirmation.confidence === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {geocodeConfirmation.confidence === 'high' ? '🟢 Alta' :
                           geocodeConfirmation.confidence === 'medium' ? '🟡 Média' :
                           '🔴 Baixa'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        onClick={handleConfirmGeocode}
                        disabled={savingSponsor}
                      >
                        {savingSponsor ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmar e Salvar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowGeocodeConfirm(false);
                          setGeocodeConfirmation(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}

        {activeSection === 'registrations' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Patrocinadores cadastrados</CardTitle>
                <CardDescription>
                  Lista de cadastros de patrocinadores pendentes ou processados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={registrationsStatusFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setRegistrationsStatusFilter('all');
                        setRegistrationsCurrentPage(1);
                      }}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={registrationsStatusFilter === 'approved' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setRegistrationsStatusFilter('approved');
                        setRegistrationsCurrentPage(1);
                      }}
                      className={registrationsStatusFilter === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      Aprovados
                    </Button>
                    <Button
                      variant={registrationsStatusFilter === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setRegistrationsStatusFilter('pending');
                        setRegistrationsCurrentPage(1);
                      }}
                      className={registrationsStatusFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                      Pendentes
                    </Button>
                    <Button
                      variant={registrationsStatusFilter === 'rejected' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setRegistrationsStatusFilter('rejected');
                        setRegistrationsCurrentPage(1);
                      }}
                      className={registrationsStatusFilter === 'rejected' ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      Rejeitados
                    </Button>
                  </div>
                  <Input
                    type="text"
                    value={registrationsCityFilter}
                    onChange={(e) => {
                      setRegistrationsCityFilter(e.target.value);
                      setRegistrationsCurrentPage(1);
                    }}
                    placeholder="Filtrar por cidade..."
                    className="max-w-sm"
                  />
                </div>
                {loadingSponsorRegistrations ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : sponsorRegistrations.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">Nenhum cadastro encontrado</p>
                ) : (() => {
                  const filteredRegistrations = sponsorRegistrations.filter(registration => {
                    const matchesStatus = registrationsStatusFilter === 'all' || registration.status === registrationsStatusFilter;
                    const matchesCity = !registrationsCityFilter || 
                      (registration.city && registration.city.toLowerCase().includes(registrationsCityFilter.toLowerCase()));
                    return matchesStatus && matchesCity;
                  });
                  const registrationsPerPage = 20;
                  const totalPages = Math.ceil(filteredRegistrations.length / registrationsPerPage);
                  const startIndex = (registrationsCurrentPage - 1) * registrationsPerPage;
                  const paginatedRegistrations = filteredRegistrations.slice(startIndex, startIndex + registrationsPerPage);

                  return (
                    <div className="space-y-4">
                      {filteredRegistrations.length === 0 ? (
                        <p className="text-center text-muted-foreground p-8">Nenhum cadastro encontrado com os filtros aplicados</p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Exibindo {startIndex + 1}-{Math.min(startIndex + registrationsPerPage, filteredRegistrations.length)} de {filteredRegistrations.length} cadastro(s)
                          </p>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Empresa</TableHead>
                                  <TableHead>Endereço</TableHead>
                                  <TableHead>Cidade</TableHead>
                                  <TableHead>UF</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedRegistrations.map((registration: any) => (
                                  <TableRow key={registration.id}>
                                    <TableCell className="font-medium">{registration.name}</TableCell>
                                    <TableCell>{registration.company}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={registration.address}>{registration.address}</TableCell>
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
                          {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRegistrationsCurrentPage(p => Math.max(1, p - 1))}
                                disabled={registrationsCurrentPage === 1}
                              >
                                Anterior
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                Página {registrationsCurrentPage} de {totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRegistrationsCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={registrationsCurrentPage === totalPages}
                              >
                                Próxima
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Dialog open={!!selectedRegistration} onOpenChange={(open) => {
              if (!open) {
                setSelectedRegistration(null);
                setEditingAddress(false);
                setNewAddress('');
                setNewCity('');
                setNewState('');
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detalhes do Cadastro</DialogTitle>
                  <DialogDescription>
                    Informações completas do patrocinador cadastrado
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

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-muted-foreground">Endereço Completo</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (editingAddress) {
                              setEditingAddress(false);
                              setNewAddress('');
                              setNewCity('');
                              setNewState('');
                            } else {
                              setEditingAddress(true);
                              setNewAddress(selectedRegistration.address || '');
                              setNewCity(selectedRegistration.city || '');
                              setNewState(selectedRegistration.state || '');
                            }
                          }}
                        >
                          {editingAddress ? 'Cancelar' : 'Editar Endereço'}
                        </Button>
                      </div>
                      
                      {editingAddress ? (
                        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                          <div>
                            <Label className="text-xs">Endereço</Label>
                            <Input
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              placeholder="Rua, número, bairro..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Cidade</Label>
                              <Input
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                placeholder="Cidade"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Estado</Label>
                              <Input
                                value={newState}
                                onChange={(e) => setNewState(e.target.value)}
                                placeholder="UF"
                                maxLength={2}
                              />
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            onClick={async () => {
                              if (!newAddress || !newCity || !newState) {
                                toast({
                                  title: "Erro",
                                  description: "Preencha todos os campos de endereço.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              setGeocodingAddress(true);
                              try {
                                // Geocodificar o novo endereço
                                const fullAddress = `${newAddress}, ${newCity}, ${newState}, Brasil`;
                                const response = await supabase.functions.invoke('geocode-address', {
                                  body: { address: fullAddress }
                                });

                                let latitude = null;
                                let longitude = null;

                                if (response.data?.lat && response.data?.lon) {
                                  latitude = response.data.lat;
                                  longitude = response.data.lon;
                                }

                                // Atualizar o registro
                                const { error } = await supabase
                                  .from('sponsor_registrations')
                                  .update({
                                    address: newAddress,
                                    city: newCity,
                                    state: newState.toUpperCase(),
                                    latitude,
                                    longitude,
                                  })
                                  .eq('id', selectedRegistration.id);

                                if (error) throw error;

                                toast({
                                  title: "Sucesso!",
                                  description: latitude 
                                    ? "Endereço atualizado com geolocalização." 
                                    : "Endereço atualizado (geolocalização não encontrada).",
                                });

                                // Atualizar o estado local
                                setSelectedRegistration({
                                  ...selectedRegistration,
                                  address: newAddress,
                                  city: newCity,
                                  state: newState.toUpperCase(),
                                  latitude,
                                  longitude,
                                });
                                setEditingAddress(false);
                                loadSponsorRegistrations();
                              } catch (error: any) {
                                toast({
                                  title: "Erro",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              } finally {
                                setGeocodingAddress(false);
                              }
                            }}
                            disabled={geocodingAddress}
                          >
                            {geocodingAddress ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Geocodificando...
                              </>
                            ) : (
                              <>
                                <MapPin className="mr-2 h-4 w-4" />
                                Salvar e Geocodificar
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-foreground">{selectedRegistration.address}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedRegistration.city} - {selectedRegistration.state}
                          </p>
                          {selectedRegistration.latitude && selectedRegistration.longitude && (
                            <p className="text-xs text-green-500 mt-1">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              Geolocalização: {selectedRegistration.latitude.toFixed(4)}, {selectedRegistration.longitude.toFixed(4)}
                            </p>
                          )}
                          {!selectedRegistration.latitude && !selectedRegistration.longitude && (
                            <p className="text-xs text-yellow-500 mt-1">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              Sem geolocalização
                            </p>
                          )}
                        </div>
                      )}
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
                        <a 
                          href={selectedRegistration.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-2 border rounded-lg p-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        >
                          <img 
                            src={selectedRegistration.payment_proof_url} 
                            alt="Comprovante de Pagamento"
                            className="max-h-96 w-full object-contain"
                          />
                          <p className="text-center text-sm text-muted-foreground mt-2">
                            Clique para abrir o arquivo
                          </p>
                        </a>
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

        {activeSection === 'cities' && (
          <Card>
            <CardHeader>
              <CardTitle>Cidades Cadastradas</CardTitle>
              <CardDescription>Gerencie as cidades onde patrocinadores e promoções podem ser cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Nome da cidade"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label>UF</Label>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={newCityState}
                    onChange={(e) => setNewCityState(e.target.value.toUpperCase())}
                  />
                </div>
                <Button onClick={handleAddCity} disabled={addingCity}>
                  {addingCity ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                </Button>
              </div>

              {loadingCities ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : registeredCities.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">Nenhuma cidade cadastrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredCities.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell>{city.city}</TableCell>
                        <TableCell>{city.state}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCity(city.id, city.city, city.state)}
                            disabled={deletingCity}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === 'messages' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mensagens de Suporte
                {pendingMessagesCount > 0 && (
                  <Badge variant="destructive">{pendingMessagesCount} pendente{pendingMessagesCount > 1 ? 's' : ''}</Badge>
                )}
              </CardTitle>
              <CardDescription>Leia e responda as mensagens dos patrocinadores</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : supportMessages.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">Nenhuma mensagem recebida</p>
              ) : (
                <div className="space-y-3">
                  {supportMessages.map((msg) => (
                    <Card 
                      key={msg.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${!msg.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
                      onClick={() => {
                        setSelectedMessage(msg);
                        setAdminReply(msg.admin_reply || '');
                        if (!msg.is_read) handleMarkAsRead(msg.id);
                      }}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!msg.is_read && <div className="w-2 h-2 rounded-full bg-primary" />}
                              <Badge variant="outline">{msg.subject}</Badge>
                              <span className="text-xs text-muted-foreground">{msg.promotion_name}</span>
                            </div>
                            <p className="text-sm truncate">{msg.message}</p>
                            {msg.attachment_url && (
                              <span className="text-xs text-primary flex items-center gap-1 mt-1">
                                <Paperclip className="h-3 w-3" /> Anexo
                              </span>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString('pt-BR')}
                            </p>
                            {msg.admin_reply && <Badge variant="secondary" className="text-xs mt-1">Respondida</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={(open) => { if (!open) setSelectedMessage(null); }}>
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle>Detalhes da Mensagem</DialogTitle>
              <DialogDescription>
                {selectedMessage?.promotion_name} — {selectedMessage?.subject}
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Enviada em: {new Date(selectedMessage.created_at).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm">{selectedMessage.message}</p>
                  {selectedMessage.attachment_url && (
                    <a href={selectedMessage.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                      <Paperclip className="h-3 w-3" /> Ver anexo
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Resposta</Label>
                  <Textarea
                    placeholder="Escreva sua resposta..."
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSendAdminReply}
                  disabled={sendingReply}
                  className="w-full"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : selectedMessage.admin_reply ? 'Atualizar Resposta' : 'Enviar Resposta'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
