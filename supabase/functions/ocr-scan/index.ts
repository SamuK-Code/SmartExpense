// Supabase Edge Function: ocr-scan
// Salvar em: supabase/functions/ocr-scan/index.ts
// Requer: GOOGLE_VISION_API_KEY nas variáveis de ambiente do Supabase (Edge Function Secrets)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    if (!GOOGLE_VISION_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google Vision API key not configured' }),
        { status: 500, headers }
      )
    }

    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers }
      )
    }

    // Limitar tamanho da imagem (base64 ~ 5MB)
    if (imageBase64.length > 7 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Max 5MB.' }),
        { status: 413, headers }
      )
    }

    const body = {
      requests: [{
        image: { content: imageBase64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      }],
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    const result = await response.json()

    if (result.responses?.[0]?.error) {
      return new Response(
        JSON.stringify({ error: result.responses[0].error.message }),
        { status: 400, headers }
      )
    }

    const text = result.responses?.[0]?.textAnnotations?.[0]?.description || ''

    return new Response(
      JSON.stringify({ text }),
      { headers }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    )
  }
})