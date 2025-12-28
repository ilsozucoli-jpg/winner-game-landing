import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALIDATION_PROMPT = `Você é um especialista em análise de conformidade legal de conteúdo publicitário no Brasil.

Analise o conteúdo fornecido (imagem e/ou texto) e verifique se está em conformidade com as seguintes legislações e normas:

1. **Código de Defesa do Consumidor (CDC)**:
   - Não pode haver publicidade enganosa ou abusiva
   - Informações devem ser claras e verdadeiras
   - Não pode induzir o consumidor a erro

2. **CONAR (Código Brasileiro de Autorregulamentação Publicitária)**:
   - Publicidade deve ser honesta e verdadeira
   - Não pode ofender a dignidade humana
   - Deve respeitar a livre concorrência

3. **Conteúdo Discriminatório**:
   - Não pode haver discriminação de raça, gênero, religião, orientação sexual, etnia ou deficiência
   - Não pode promover preconceito ou intolerância

4. **Conteúdo Adulto**:
   - Não pode conter nudez explícita ou sugestiva
   - Não pode conter conteúdo sexual ou erótico
   - Não pode conter violência gráfica

5. **Estatuto da Criança e do Adolescente (ECA)**:
   - Não pode fazer apelo imperativo de consumo direcionado a crianças
   - Não pode explorar a imagem de menores de forma inadequada
   - Não pode conter elementos que possam prejudicar o desenvolvimento infantil

6. **LGPD (Lei Geral de Proteção de Dados)**:
   - Não pode expor dados pessoais de terceiros sem autorização
   - Não pode conter informações que violem a privacidade

7. **Conteúdo Não Autorizado**:
   - Verificar se há uso aparente de marcas registradas sem autorização
   - Verificar se há imagens de celebridades ou personalidades públicas que podem indicar uso não autorizado

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem código):
{
  "approved": true ou false,
  "reason": "Se reprovado, descreva o motivo principal em português de forma clara e direta. Se aprovado, deixe vazio.",
  "details": "Detalhes adicionais sobre a análise",
  "violations": ["lista de violações encontradas, se houver"]
}

Seja rigoroso na análise. Em caso de dúvida, reprove o conteúdo para proteção legal.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, text, type } = await req.json();
    
    console.log('Validating content:', { 
      hasImage: !!imageUrl, 
      hasText: !!text, 
      type,
      imageUrlPreview: imageUrl?.substring(0, 100) 
    });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the content array for the message
    const contentParts: any[] = [];
    
    // Add text instruction
    let instruction = "Analise o seguinte conteúdo para verificar conformidade legal:\n\n";
    
    if (text) {
      instruction += `TEXTO DA DESCRIÇÃO:\n"${text}"\n\n`;
    }
    
    if (imageUrl) {
      instruction += `Analise também a imagem fornecida abaixo.\n`;
      instruction += `Tipo de conteúdo: ${type === 'logo' ? 'Logo de empresa' : type === 'payment_proof' ? 'Comprovante de pagamento' : 'Imagem promocional'}\n`;
    }
    
    contentParts.push({
      type: "text",
      text: instruction
    });
    
    // Add image if provided
    if (imageUrl) {
      contentParts.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    console.log('Calling AI Gateway for content validation...');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: VALIDATION_PROMPT },
          { role: "user", content: contentParts }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requisições excedido. Tente novamente em alguns minutos.",
          approved: false,
          reason: "Serviço temporariamente indisponível"
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos insuficientes para validação.",
          approved: false,
          reason: "Serviço temporariamente indisponível"
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received:', JSON.stringify(data, null, 2));
    
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      console.error("No content in AI response");
      throw new Error("Resposta inválida do serviço de validação");
    }
    
    // Parse the JSON response from AI
    let validationResult;
    try {
      // Remove any markdown code blocks if present
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      validationResult = JSON.parse(cleanContent);
      console.log('Parsed validation result:', validationResult);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent, parseError);
      // If parsing fails, try to extract key info from text
      const isApproved = aiContent.toLowerCase().includes('"approved": true') || 
                         aiContent.toLowerCase().includes('"approved":true');
      validationResult = {
        approved: isApproved,
        reason: isApproved ? "" : "Não foi possível processar a validação completa. Por favor, tente novamente.",
        details: aiContent,
        violations: []
      };
    }

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido",
      approved: false,
      reason: "Erro ao processar validação. Tente novamente."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
