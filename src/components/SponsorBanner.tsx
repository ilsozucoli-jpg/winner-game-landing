import { Building2, Phone, MapPin, Award } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

export function SponsorBanner() {
  const { selectedSponsor } = useGame();

  if (!selectedSponsor) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground">Patrocinador Oficial</h3>
            <p className="text-xs text-muted-foreground mt-1">Aguardando seleção</p>
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
            src={selectedSponsor.logo_url} 
            alt={selectedSponsor.name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-foreground">{selectedSponsor.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground">{selectedSponsor.city}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Prêmio: {selectedSponsor.prize_description}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-semibold">{selectedSponsor.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-primary" />
              <span className="text-xs text-foreground font-semibold">
                {selectedSponsor.prize_count} {selectedSponsor.prize_count === 1 ? 'prêmio' : 'prêmios'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
