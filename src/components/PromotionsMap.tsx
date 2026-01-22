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

// Create pulsing target marker - POI icon 40x52px with anchor at center-bottom
const createPulsingIcon = () => {
  return new DivIcon({
    className: '',
    html: `
      <div style="width:40px;height:52px;display:flex;flex-direction:column;align-items:center;">
        <div style="width:16px;height:16px;background:linear-gradient(135deg,hsl(142,76%,45%),hsl(142,76%,35%));border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:6px;height:6px;background:white;border-radius:50%;"></div>
        </div>
        <div style="width:2px;height:30px;background:linear-gradient(to bottom,hsl(142,76%,45%),hsl(142,76%,35%));"></div>
        <div style="width:8px;height:8px;background:hsl(142,76%,45%);border-radius:50%;opacity:0.5;"></div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
  });
};

// User location icon - 18x18px with anchor at center [9, 9]
const userLocationIcon = new DivIcon({
  className: '',
  html: `
    <div style="width:18px;height:18px;position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="width:12px;height:12px;background:hsl(217,91%,60%);border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:2;"></div>
      <div style="position:absolute;width:18px;height:18px;background:hsla(217,91%,60%,0.3);border-radius:50%;animation:userPulse 2s ease-out infinite;"></div>
    </div>
    <style>
      @keyframes userPulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function PromotionsMap({ sponsors, onSelectSponsor, onClose }: PromotionsMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [radius, setRadius] = useState(2); // km
  const [selectedPromotion, setSelectedPromotion] = useState<Sponsor | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logMessage = `[${timestamp}] ${message}`;
    console.log('[PromotionsMap]', message);
    setDebugLogs(prev => [...prev.slice(-9), logMessage]); // Keep last 10 logs
  };

  // Check permission state
  const checkPermission = async () => {
    addLog('Verificando permissões de geolocalização...');
    
    if (!navigator.permissions) {
      addLog('API de permissões não suportada, usando fallback');
      setPermissionState('prompt');
      return;
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      addLog(`Estado da permissão: ${result.state}`);
      setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
      
      result.onchange = () => {
        addLog(`Permissão alterada para: ${result.state}`);
        setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
      };
    } catch (err) {
      addLog(`Erro ao verificar permissão: ${err}`);
      setPermissionState('prompt');
    }
  };

  // Request geolocation
  const requestLocation = () => {
    setLoading(true);
    setLocationError(null);
    addLog('Iniciando requisição de geolocalização...');
    
    if (!navigator.geolocation) {
      addLog('ERRO: Geolocalização não suportada');
      setLocationError('Geolocalização não suportada pelo seu navegador');
      setLoading(false);
      return;
    }

    addLog('Solicitando posição atual ao navegador...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        addLog(`✓ Localização obtida: ${lat.toFixed(6)}, ${lng.toFixed(6)} (precisão: ${position.coords.accuracy}m)`);
        setUserPosition([lat, lng]);
        setPermissionState('granted');
        setLoading(false);
      },
      (error) => {
        addLog(`✗ ERRO de geolocalização: código ${error.code} - ${error.message}`);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            addLog('Permissão negada pelo usuário');
            setLocationError('Permissão de localização negada. Por favor, habilite a localização nas configurações do seu navegador e tente novamente.');
            setPermissionState('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            addLog('Posição indisponível');
            setLocationError('Não foi possível obter sua localização. Verifique se o GPS está ativado.');
            break;
          case error.TIMEOUT:
            addLog('Timeout ao obter localização');
            setLocationError('Tempo esgotado ao obter localização. Verifique sua conexão e tente novamente.');
            break;
          default:
            addLog('Erro desconhecido');
            setLocationError('Erro desconhecido ao obter localização.');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    addLog('Componente PromotionsMap montado');
    addLog(`Total de patrocinadores recebidos: ${sponsors.length}`);
    const withCoords = sponsors.filter(s => s.latitude && s.longitude).length;
    addLog(`Patrocinadores com coordenadas: ${withCoords}`);
    checkPermission();
  }, []);

  useEffect(() => {
    if (permissionState !== 'checking') {
      addLog(`Estado de permissão: ${permissionState}, iniciando requestLocation...`);
      requestLocation();
    }
  }, [permissionState]);

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

  // Debug panel component
  const DebugPanel = () => {
    if (!showDebug || debugLogs.length === 0) return null;
    
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[1002] max-w-md">
        <Card className="bg-black/90 border-primary/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary">🔍 Debug Logs</span>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setShowDebug(false)}
              >
                Fechar
              </Button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {debugLogs.map((log, i) => (
                <p 
                  key={i} 
                  className={`text-xs font-mono ${
                    log.includes('ERRO') || log.includes('✗') 
                      ? 'text-destructive' 
                      : log.includes('✓') 
                        ? 'text-green-400' 
                        : 'text-muted-foreground'
                  }`}
                >
                  {log}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
        <DebugPanel />
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
        <DebugPanel />
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
      <div className="flex-1 relative" style={{ height: '500px', width: '100%' }}>
        <MapContainer
          center={userPosition}
          zoom={14}
          style={{ height: '500px', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileloadstart: () => addLog('Carregando tiles do mapa (OpenStreetMap)...'),
              load: () => addLog('✓ Tiles do mapa carregados com sucesso'),
              tileerror: (e) => addLog(`✗ Erro ao carregar tile: ${e.type}`)
            }}
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

      {/* Debug panel on map view */}
      <DebugPanel />
    </div>
  );
}
