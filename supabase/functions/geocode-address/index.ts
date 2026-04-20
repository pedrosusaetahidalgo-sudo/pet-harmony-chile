/**
 * Edge Function: geocode-address
 *
 * Convierte "Avenida Ossa 1234, Ñuñoa, Santiago" → { lat, lng } usando
 * Nominatim (OpenStreetMap, gratis). Respeta la política de uso de OSM:
 * User-Agent identificable + max 1 req/seg (no implementamos rate limit
 * server-side, confiamos en el volumen bajo — refugios se editan 1-2 veces/mes).
 *
 * Origen: INIT-23 del Plan 90d — permitir mapa de adopción con coords reales.
 *
 * POST body: { address: string, commune?: string, country?: string }
 * Default country: 'Chile'.
 *
 * Respuesta:
 *   { lat: number, lng: number, display_name: string }
 * o
 *   { error: string } con HTTP 404 si no se encontró.
 *
 * Auth: authenticated (cualquier usuario logueado puede usar — es info publica).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let payload: { address?: string; commune?: string; country?: string };
  try {
    payload = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const address = String(payload.address || '').trim();
  const commune = String(payload.commune || '').trim();
  const country = String(payload.country || 'Chile').trim();

  if (!address && !commune) {
    return errorResponse('address or commune required', 400);
  }

  // Construir query: "{address}, {commune}, {country}" — omitir vacíos
  const queryParts = [address, commune, country].filter(Boolean);
  const query = queryParts.join(', ');

  // Llamar a Nominatim. User-Agent requerido por política OSM.
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'cl'); // restringir a Chile por default
  url.searchParams.set('addressdetails', '0');

  let resp: Response;
  try {
    resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'PawFriend/1.0 (https://pawfriend.cl; pedrosusaeta@pawfriend.cl)',
        'Accept-Language': 'es-CL,es;q=0.9',
      },
    });
  } catch (err) {
    return errorResponse(`Nominatim fetch error: ${(err as Error).message}`, 502);
  }

  if (!resp.ok) {
    return errorResponse(`Nominatim HTTP ${resp.status}`, 502);
  }

  let results: NominatimResult[];
  try {
    results = (await resp.json()) as NominatimResult[];
  } catch {
    return errorResponse('Nominatim returned invalid JSON', 502);
  }

  if (!Array.isArray(results) || results.length === 0) {
    return jsonResponse({ error: 'No se encontraron coordenadas para esa dirección', query }, 404);
  }

  const first = results[0];
  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return errorResponse('Nominatim returned non-numeric coordinates', 502);
  }

  return jsonResponse({
    lat,
    lng,
    display_name: first.display_name,
    query,
  });
}

serve(withTelemetry('geocode-address', handle));
