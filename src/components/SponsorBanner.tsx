import { useState, useEffect } from 'react';
import { Building2, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Sponsor {
  logo_url: string;
  prize_description: string;
  phone: string;
}

export function SponsorBanner() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);

  useEffect(() => {
    loadSponsor();
  }, []);

  const loadSponsor = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setSponsor(data);
      }
    } catch (error) {
      console.error('Erro ao carregar patrocinador:', error);
    }
  };

  if (!sponsor) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground">Patrocinador Oficial</h3>
            <p className="text-xs text-muted-foreground mt-1">Aguardando cadastro</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img 
            src={sponsor.logo_url} 
            alt="Logo do Patrocinador" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-foreground">Patrocinador Oficial</h3>
          <p className="text-xs text-muted-foreground mt-1">Prêmio: {sponsor.prize_description}</p>
          <div className="flex items-center gap-1 mt-1">
            <Phone className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-semibold">{sponsor.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
