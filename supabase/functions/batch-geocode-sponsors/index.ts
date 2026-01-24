import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Sponsor {
  id: string;
  city: string;
  state: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sponsors without coordinates
    const { data: sponsors, error: fetchError } = await supabase
      .from('sponsors')
      .select('id, city, state')
      .is('latitude', null)
      .not('city', 'is', null)
      .not('state', 'is', null)
      .limit(50); // Process 50 at a time to avoid rate limits

    if (fetchError) {
      console.error('Error fetching sponsors:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar patrocinadores' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sponsors || sponsors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Todos os patrocinadores já têm coordenadas', updated: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${sponsors.length} sponsors without coordinates`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each sponsor with a delay to avoid rate limiting
    for (const sponsor of sponsors) {
      try {
        // Build the address query for geocoding
        const address = `${sponsor.city}, ${sponsor.state}, Brasil`;
        const encodedAddress = encodeURIComponent(address);

        // Use Nominatim for geocoding
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=br`;

        console.log(`Geocoding: ${address}`);

        const geocodeResponse = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'WinnerGameApp/1.0 (batch geocoding for sponsor locations)',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          }
        });

        if (!geocodeResponse.ok) {
          console.error(`Nominatim error for ${sponsor.id}:`, geocodeResponse.status);
          errorCount++;
          errors.push(`${sponsor.city}: API error ${geocodeResponse.status}`);
          continue;
        }

        const results = await geocodeResponse.json();

        if (!results || results.length === 0) {
          console.log(`No results for ${sponsor.city}, ${sponsor.state}`);
          errorCount++;
          errors.push(`${sponsor.city}: Endereço não encontrado`);
          continue;
        }

        const location = results[0];
        const latitude = parseFloat(location.lat);
        const longitude = parseFloat(location.lon);

        console.log(`Found: ${sponsor.city} -> (${latitude}, ${longitude})`);

        // Update sponsor with coordinates
        const { error: updateError } = await supabase
          .from('sponsors')
          .update({ latitude, longitude })
          .eq('id', sponsor.id);

        if (updateError) {
          console.error(`Update error for ${sponsor.id}:`, updateError);
          errorCount++;
          errors.push(`${sponsor.city}: Erro ao atualizar`);
        } else {
          successCount++;
        }

        // Respect Nominatim rate limit (1 request per second)
        await new Promise(resolve => setTimeout(resolve, 1100));

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing ${sponsor.id}:`, error);
        errorCount++;
        errors.push(`${sponsor.city}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Geocodificação concluída`,
        total: sponsors.length,
        updated: successCount,
        failed: errorCount,
        errors: errors.slice(0, 10) // Only return first 10 errors
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch geocode error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno ao processar geocodificação' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
