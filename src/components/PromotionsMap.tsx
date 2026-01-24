import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Award, Clock, Loader2, Navigation, AlertCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

interface Sponsor {
  id: string;
  name: string;
  city: string;
  state?: string;
  logo_url: string;
  prize_description: string;
  phone: string;
  prize_count: number;
  promotion_end_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

interface PromotionsMapProps {
  sponsors: Sponsor[];
  onSelectSponsor: (sponsor: Sponsor) => void;
  onClose: () => void;
}

const SEARCH_RADIUS_KM = 50;

// Calculate distance between two coordinates in kilometers (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Create pulsing green target icon for promotions (40x52px, anchor at bottom center)
const promotionIcon = L.divIcon({
  className: '',
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -52],
  html: `
    <div class="pulse-marker" style="width: 40px; height: 52px; display: flex; flex-direction: column; align-items: center;">
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 12px solid #16a34a;
        margin-top: -2px;
      "></div>
    </div>
  `
});

// Create user location icon (18x18px, anchor at center)
const userIcon = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background: #3b82f6;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
    "></div>
  `
});

export default function PromotionsMap({ sponsors, onSelectSponsor, onClose }: PromotionsMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não é suportada pelo seu navegador');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Permissão de localização negada. Ative a localização para ver promoções próximas.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Informação de localização indisponível.');
            break;
          case error.TIMEOUT:
            setGeoError('Tempo esgotado ao obter localização.');
            break;
          default:
            setGeoError('Erro ao obter localização.');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Filter active promotions within search radius
  const nearbyPromotions = useMemo(() => {
    if (!userPosition) return [];
    
    const now = new Date();
    return sponsors.filter(sponsor => {
      // Must have coordinates
      if (!sponsor.latitude || !sponsor.longitude) return false;
      
      // Must be active (not expired)
      if (sponsor.promotion_end_date && new Date(sponsor.promotion_end_date) <= now) return false;
      
      // Must be within search radius
      const distance = calculateDistance(
        userPosition[0], userPosition[1],
        sponsor.latitude, sponsor.longitude
      );
      return distance <= SEARCH_RADIUS_KM;
    });
  }, [sponsors, userPosition]);

  // Open Google Maps with directions
  const openGoogleMapsDirections = (sponsor: Sponsor) => {
    if (!sponsor.latitude || !sponsor.longitude || !userPosition) return;
    
    const origin = `${userPosition[0]},${userPosition[1]}`;
    const destination = `${sponsor.latitude},${sponsor.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    window.open(url, '_blank');
  };

  // Get formatted address (full address if available)
  const getFormattedAddress = (sponsor: Sponsor) => {
    const parts: string[] = [];
    if (sponsor.address) parts.push(sponsor.address);
    if (sponsor.city) parts.push(sponsor.city);
    if (sponsor.state) parts.push(sponsor.state);
    return parts.length > 0 ? parts.join(', ') : 'Endereço não disponível';
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Obtendo sua localização...</p>
      </div>
    );
  }

  // Error state
  if (geoError || !userPosition) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Localização Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {geoError || 'Não foi possível obter sua localização.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                className="flex-1"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">Mapa das Promoções</h2>
          <p className="text-sm text-muted-foreground">
            {nearbyPromotions.length} promoções em até {SEARCH_RADIUS_KM}km
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm text-primary">
          <Navigation className="w-4 h-4" />
          <span>Localização ativa</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={userPosition}
          zoom={12}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User marker */}
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-semibold">Você está aqui</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Promotion markers */}
          {nearbyPromotions.map((sponsor) => (
            <Marker
              key={sponsor.id}
              position={[sponsor.latitude!, sponsor.longitude!]}
              icon={promotionIcon}
              eventHandlers={{
                click: () => setSelectedSponsor(sponsor)
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Selected promotion banner - clickable to start game */}
      {selectedSponsor && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-12">
          <Card 
            className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => onSelectSponsor(selectedSponsor)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Logo */}
                <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  <img
                    src={selectedSponsor.logo_url}
                    alt={selectedSponsor.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{selectedSponsor.name}</h3>
                  
                  <div className="flex items-start gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{getFormattedAddress(selectedSponsor)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Award className="w-3 h-3 flex-shrink-0" />
                    <span>{selectedSponsor.prize_count} {selectedSponsor.prize_count === 1 ? 'prêmio' : 'prêmios'}</span>
                  </div>
                  
                  {selectedSponsor.promotion_end_date && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>Até {format(new Date(selectedSponsor.promotion_end_date), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  )}
                  
                  <p className="text-sm font-medium mt-2 line-clamp-2">
                    {selectedSponsor.prize_description}
                  </p>
                </div>
              </div>
              
              {/* Actions - stop propagation to prevent card click */}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSponsor(null);
                  }}
                >
                  Fechar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openGoogleMapsDirections(selectedSponsor);
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Rota
                </Button>
                <Button 
                  variant="game" 
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSponsor(selectedSponsor);
                  }}
                >
                  Jogar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}