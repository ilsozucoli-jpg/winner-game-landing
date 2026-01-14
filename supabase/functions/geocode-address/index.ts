import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  address: string;
  city: string;
  state: string;
}

interface GeocodeResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
  formattedAddress?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, city, state }: GeocodeRequest = await req.json();

    if (!address || !city || !state) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Endereço, cidade e estado são obrigatórios'
        } as GeocodeResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build the full address query for geocoding
    const fullAddress = `${address}, ${city}, ${state}, Brasil`;
    const encodedAddress = encodeURIComponent(fullAddress);

    // Use Nominatim (OpenStreetMap) for geocoding - free and no API key required
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`;

    console.log(`Geocoding address: ${fullAddress}`);

    const geocodeResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'WinnerGameApp/1.0 (geocoding for sponsor locations)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    });

    if (!geocodeResponse.ok) {
      console.error('Nominatim API error:', geocodeResponse.status);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao consultar serviço de geocodificação'
        } as GeocodeResponse),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = await geocodeResponse.json();

    if (!results || results.length === 0) {
      // Try a simpler search with just city and state
      const simplifiedAddress = `${city}, ${state}, Brasil`;
      const simplifiedEncoded = encodeURIComponent(simplifiedAddress);
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${simplifiedEncoded}&limit=1&countrycodes=br`;

      console.log(`Trying simplified address: ${simplifiedAddress}`);

      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'WinnerGameApp/1.0 (geocoding for sponsor locations)',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        }
      });

      const fallbackResults = await fallbackResponse.json();

      if (!fallbackResults || fallbackResults.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Endereço não encontrado. Verifique os dados informados.'
          } as GeocodeResponse),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const location = fallbackResults[0];
      return new Response(
        JSON.stringify({
          success: true,
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          formattedAddress: location.display_name
        } as GeocodeResponse),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const location = results[0];
    console.log(`Found location: ${location.display_name} (${location.lat}, ${location.lon})`);

    return new Response(
      JSON.stringify({
        success: true,
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        formattedAddress: location.display_name
      } as GeocodeResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno ao processar geocodificação'
      } as GeocodeResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
