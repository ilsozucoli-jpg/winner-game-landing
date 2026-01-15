import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L, { DivIcon, LatLngExpression } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapPin, Award, Clock, Phone, Loader2, Navigation, ZoomIn, ZoomOut, LocateFixed, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Sponsor {
  id: string;
  name: string;
  city: string;
  logo_url: string;
  prize_description: string;
  phone: string;
  prize_count: number;
  promotion_end_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface PromotionsMapProps {
  sponsors: Sponsor[];
  onSelectSponsor: (sponsor: Sponsor) => void;
  onClose: () => void;
}

// Component to recenter map
function RecenterMap({ position }: { position: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

// Component for map controls
function MapControls({ onLocate }: { onLocate: () => void }) {
  const map = useMap();
  
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <Button 
        size="icon" 
        variant="secondary" 
        className="h-10 w-10 shadow-lg"
        onClick={() => map.zoomIn()}
      >
        <ZoomIn className="h-5 w-5" />
      </Button>
      <Button 
        size="icon" 
        variant="secondary" 
        className="h-10 w-10 shadow-lg"
        onClick={() => map.zoomOut()}
      >
        <ZoomOut className="h-5 w-5" />
      </Button>
      <Button 
        size="icon" 
        variant="secondary" 
        className="h-10 w-10 shadow-lg"
        onClick={onLocate}
      >
        <LocateFixed className="h-5 w-5" />
      </Button>
    </div>
  );
}

// Create pulsing target marker
const createPulsingIcon = () => {
  return new DivIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div class="pulsing-target">
        <div class="pulsing-target-core"></div>
        <div class="pulsing-target-ring"></div>
        <div class="pulsing-target-ring delay-1"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// User location icon
const userLocationIcon = new DivIcon({
  className: 'user-location-marker',
  html: `
    <div class="user-location">
      <div class="user-location-dot"></div>
      <div class="user-location-pulse"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function PromotionsMap({ sponsors, onSelectSponsor, onClose }: PromotionsMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(2); // km
  const [selectedPromotion, setSelectedPromotion] = useState<Sponsor | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Request geolocation
  const requestLocation = () => {
    setLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo seu navegador');
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
            setLocationError('Permissão de localização negada. Habilite nas configurações do navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Informação de localização indisponível.');
            break;
          case error.TIMEOUT:
            setLocationError('Tempo esgotado ao obter localização.');
            break;
          default:
            setLocationError('Erro desconhecido ao obter localização.');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Filter sponsors with valid coordinates within radius
  const sponsorsInRadius = useMemo(() => {
    if (!userPosition) return [];
    
    return sponsors.filter(sponsor => {
      if (!sponsor.latitude || !sponsor.longitude) return false;
      
      // Check if promotion is active
      if (sponsor.promotion_end_date && new Date(sponsor.promotion_end_date) <= new Date()) {
        return false;
      }
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (sponsor.latitude - userPosition[0]) * Math.PI / 180;
      const dLon = (sponsor.longitude - userPosition[1]) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userPosition[0] * Math.PI / 180) * Math.cos(sponsor.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= radius;
    });
  }, [sponsors, userPosition, radius]);

  const handleMarkerClick = (sponsor: Sponsor) => {
    setSelectedPromotion(sponsor);
    setShowDetails(true);
  };

  const handlePlay = () => {
    if (selectedPromotion) {
      onSelectSponsor(selectedPromotion);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Obtendo sua localização...</h3>
            <p className="text-sm text-muted-foreground">
              Permita o acesso à localização quando solicitado pelo navegador
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center space-y-4">
            <Navigation className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold">Erro de Localização</h3>
            <p className="text-sm text-muted-foreground">{locationError}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={requestLocation} variant="game">
                Tentar Novamente
              </Button>
              <Button onClick={onClose} variant="outline">
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userPosition) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Floating back button */}
      <Button 
        onClick={onClose} 
        variant="secondary" 
        size="icon"
        className="fixed top-4 left-4 z-[1001] h-12 w-12 rounded-full shadow-lg"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Header */}
      <div className="p-4 bg-card border-b flex items-center justify-between pl-20">
        <div>
          <h2 className="text-lg font-bold">Mapa das Promoções</h2>
          <p className="text-sm text-muted-foreground">
            {sponsorsInRadius.length} promoções em {radius}km
          </p>
        </div>
      </div>

      {/* Radius control */}
      <div className="p-4 bg-card border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium min-w-[80px]">Raio: {radius}km</span>
          <Slider
            value={[radius]}
            onValueChange={(value) => setRadius(value[0])}
            min={1}
            max={50}
            step={1}
            className="flex-1"
          />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={userPosition}
          zoom={14}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RecenterMap position={userPosition} />
          <MapControls onLocate={requestLocation} />

          {/* User location marker */}
          <Marker position={userPosition} icon={userLocationIcon}>
            <Popup>Você está aqui</Popup>
          </Marker>

          {/* Radius circle */}
          <Circle
            center={userPosition}
            radius={radius * 1000}
            pathOptions={{
              color: 'hsl(var(--primary))',
              fillColor: 'hsl(var(--primary))',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />

          {/* Sponsor markers */}
          {sponsorsInRadius.map((sponsor) => (
            <Marker
              key={sponsor.id}
              position={[sponsor.latitude!, sponsor.longitude!]}
              icon={createPulsingIcon()}
              eventHandlers={{
                click: () => handleMarkerClick(sponsor),
              }}
            >
              <Popup>
                <div className="text-center p-1">
                  <strong>{sponsor.name}</strong>
                  <br />
                  <span className="text-xs">{sponsor.prize_description}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute top-4 left-4 z-[1000] bg-card/90 backdrop-blur rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span>Promoção ativa</span>
          </div>
          <div className="flex items-center gap-2 text-xs mt-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Sua localização</span>
          </div>
        </div>
      </div>

      {/* Promotion details dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          {selectedPromotion && (
            <>
              <DialogHeader>
                <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-2">
                  <img 
                    src={selectedPromotion.logo_url} 
                    alt={selectedPromotion.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <DialogTitle className="text-xl">{selectedPromotion.name}</DialogTitle>
                <DialogDescription className="sr-only">
                  Detalhes da promoção
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{selectedPromotion.city}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{selectedPromotion.phone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="w-4 h-4 text-primary" />
                  <span>{selectedPromotion.prize_count} {selectedPromotion.prize_count === 1 ? 'prêmio' : 'prêmios'}</span>
                </div>
                
                {selectedPromotion.promotion_end_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Até {format(new Date(selectedPromotion.promotion_end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-foreground font-medium">
                    {selectedPromotion.prize_description}
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="game" className="flex-1" onClick={handlePlay}>
                    Jogar
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowDetails(false)}>
                    Voltar ao Mapa
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
