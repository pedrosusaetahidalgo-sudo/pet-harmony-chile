/**
 * generate-pet-id-card — genera la Pet ID Card digital de una mascota
 *
 * Pilar 1 de la Trinidad del Corazon (Refactor Maestro 2026-04-23 §2.4.1).
 * Produce 3 artefactos:
 *   - SVG: formato vectorial editable, tamano cedula CR-80 (85.6 × 53.98 mm)
 *   - PNG: rasterizado 300 DPI imprimible (~1000 × 630 px)
 *   - PDF: documento A7 con 2 caras (frente + reverso)
 *
 * Flujo:
 *   1. Verifica auth: solo owner del pet (o co-owner con permiso) puede generar
 *   2. Lee pets + profiles + datos clinicos (blood_type, allergies, etc.)
 *   3. Si no existe pet_id_cards row, crea una (con card_number generado via
 *      RPC generate_pet_id_card_number) en version 1
 *   4. Genera SVG usando template inline, sube a storage bucket 'pet-id-cards'
 *   5. Actualiza pet_id_cards con las URLs y version
 *   6. Retorna URLs + card_number + version
 *
 * Regenera si ya existe (nueva version) cuando cambian datos criticos,
 * controlado por parametro force_regenerate.
 *
 * Request:
 *   POST { pet_id: UUID, force_regenerate?: boolean }
 *
 * Response:
 *   { card_number, version, svg_url, png_url, pdf_url }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET_NAME = 'pet-id-cards';

interface PetIdCardData {
  pet_id: string;
  card_number: string;
  pet_name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  gender: string | null;
  neutered: boolean | null;
  color: string | null;
  microchip_number: string | null;
  photo_url: string | null;
  blood_type: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  emergency_vet_name: string | null;
  emergency_vet_phone: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  nose_print_hash: string | null;
  issued_at: string;
}

// ────────────────────────────────────────────────────────────────────────
// SVG Template (cedula estilo chileno, proporciones CR-80 1.586:1)
// Dimensiones base: 856 × 540 (escalables, representa 85.6 × 54 mm a 10x)
// ────────────────────────────────────────────────────────────────────────
function escapeXml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '';
  try {
    const birth = new Date(birthDate);
    const years = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
    if (years >= 1) return `${years} año${years !== 1 ? 's' : ''}`;
    const months = Math.floor((Date.now() - birth.getTime()) / (30.44 * 24 * 3600 * 1000));
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  } catch {
    return '';
  }
}

function renderFrontSvg(data: PetIdCardData): string {
  const age = calcAge(data.birth_date);
  const qrUrl = `https://pawfriend.cl/id/${data.card_number}?mode=emergency`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <linearGradient id="bandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#faf5ff"/>
    </linearGradient>
  </defs>
  <rect width="856" height="540" rx="24" fill="url(#bgGrad)" stroke="#93c5fd" stroke-width="4"/>
  <rect x="0" y="0" width="856" height="56" fill="url(#bandGrad)" rx="24" ry="24"/>
  <rect x="0" y="32" width="856" height="24" fill="url(#bandGrad)"/>

  <text x="28" y="35" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#ffffff" letter-spacing="2">REPÚBLICA DE CHILE · PAW FRIEND</text>
  <text x="828" y="35" font-family="monospace" font-size="11" fill="#ffffff" text-anchor="end" opacity="0.85">#${escapeXml(data.card_number)}</text>

  <!-- Foto (si existe, va rasterizada en PNG) -->
  <rect x="32" y="88" width="220" height="220" rx="16" fill="#f3e8ff" stroke="#e5e7eb" stroke-width="2"/>
  ${
    data.photo_url
      ? `<image x="32" y="88" width="220" height="220" href="${escapeXml(data.photo_url)}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 16px)"/>`
      : `<text x="142" y="210" font-size="100" text-anchor="middle">${speciesEmoji(data.species)}</text>`
  }
  <text x="142" y="340" font-family="Arial,sans-serif" font-size="14" text-anchor="middle" fill="#6b7280" letter-spacing="2">${escapeXml(data.species.toUpperCase())}</text>

  <!-- Datos principales -->
  <text x="288" y="118" font-family="Arial,sans-serif" font-size="10" fill="#9ca3af" letter-spacing="1">NOMBRE</text>
  <text x="288" y="145" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="#111827">${escapeXml(data.pet_name)}</text>

  ${
    data.breed
      ? `
  <text x="288" y="178" font-family="Arial,sans-serif" font-size="10" fill="#9ca3af" letter-spacing="1">RAZA</text>
  <text x="288" y="198" font-family="Arial,sans-serif" font-size="16" fill="#374151">${escapeXml(data.breed)}</text>
  `
      : ''
  }

  <text x="288" y="228" font-family="Arial,sans-serif" font-size="10" fill="#9ca3af" letter-spacing="1">NACIMIENTO</text>
  <text x="288" y="248" font-family="Arial,sans-serif" font-size="16" fill="#374151">${escapeXml(formatDate(data.birth_date))}${age ? ` (${escapeXml(age)})` : ''}</text>

  ${
    data.nose_print_hash
      ? `
  <text x="528" y="228" font-family="Arial,sans-serif" font-size="10" fill="#9ca3af" letter-spacing="1">BIOMETRÍA</text>
  <text x="528" y="248" font-family="monospace" font-size="16" font-weight="bold" fill="#4f46e5">${escapeXml(data.nose_print_hash)}</text>
  `
      : ''
  }

  <!-- Emitida + QR -->
  <text x="288" y="440" font-family="Arial,sans-serif" font-size="11" fill="#9ca3af">Emitida: ${escapeXml(formatDate(data.issued_at))}</text>

  <!-- QR placeholder (cliente lo reemplaza con QRCode canvas si quiere) -->
  <rect x="700" y="380" width="120" height="120" fill="#ffffff" stroke="#d1d5db" stroke-width="1" rx="4"/>
  <text x="760" y="444" font-family="Arial,sans-serif" font-size="8" text-anchor="middle" fill="#6b7280">QR</text>
  <text x="760" y="460" font-family="monospace" font-size="7" text-anchor="middle" fill="#6b7280">${escapeXml(data.card_number)}</text>
  <!-- URL del QR: ${escapeXml(qrUrl)} -->
</svg>`;
}

function speciesEmoji(species: string): string {
  const map: Record<string, string> = {
    perro: '🐶',
    gato: '🐱',
    conejo: '🐰',
    hamster: '🐹',
    ave: '🐦',
    tortuga: '🐢',
    pez: '🐟',
  };
  return map[species.toLowerCase()] || '🐾';
}

function renderBackSvg(data: PetIdCardData): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <linearGradient id="bandGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9333ea"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faf5ff"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eff6ff"/>
    </linearGradient>
  </defs>
  <rect width="856" height="540" rx="24" fill="url(#bgGrad2)" stroke="#c4b5fd" stroke-width="4"/>
  <rect x="0" y="0" width="856" height="56" fill="url(#bandGrad2)" rx="24" ry="24"/>
  <rect x="0" y="32" width="856" height="24" fill="url(#bandGrad2)"/>

  <text x="28" y="35" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#ffffff" letter-spacing="2">INFORMACIÓN COMPLEMENTARIA</text>
  <text x="828" y="35" font-family="monospace" font-size="11" fill="#ffffff" text-anchor="end" opacity="0.85">#${escapeXml(data.card_number)}</text>

  <g font-family="Arial,sans-serif" fill="#374151">
    <text x="32" y="100" font-size="10" fill="#9ca3af" letter-spacing="1">DUEÑO</text>
    <text x="32" y="124" font-size="16" font-weight="bold">${escapeXml(data.owner_name || '—')}${data.owner_phone ? ` · ${escapeXml(data.owner_phone)}` : ''}</text>

    <text x="32" y="160" font-size="10" fill="#9ca3af" letter-spacing="1">VETERINARIO DE CABECERA</text>
    <text x="32" y="184" font-size="16" font-weight="bold">${escapeXml(data.emergency_vet_name || '—')}${data.emergency_vet_phone ? ` · ${escapeXml(data.emergency_vet_phone)}` : ''}</text>

    <text x="32" y="220" font-size="10" fill="#9ca3af" letter-spacing="1">GRUPO SANGUÍNEO</text>
    <text x="32" y="244" font-size="18" font-weight="bold" fill="#b91c1c">${escapeXml(data.blood_type || '—')}</text>

    <text x="232" y="220" font-size="10" fill="#9ca3af" letter-spacing="1">SEXO</text>
    <text x="232" y="244" font-size="16" font-weight="bold">${data.gender === 'macho' ? '♂ Macho' : data.gender === 'hembra' ? '♀ Hembra' : '—'}${data.neutered ? ' · Esterilizado' : ''}</text>

    ${
      data.allergies
        ? `
    <text x="32" y="280" font-size="10" fill="#d97706" letter-spacing="1" font-weight="bold">⚠ ALERGIAS</text>
    <text x="32" y="302" font-size="14" fill="#92400e">${escapeXml(data.allergies)}</text>
    `
        : ''
    }

    ${
      data.chronic_conditions
        ? `
    <text x="32" y="340" font-size="10" fill="#9ca3af" letter-spacing="1">CONDICIONES CRÓNICAS</text>
    <text x="32" y="362" font-size="14">${escapeXml(data.chronic_conditions)}</text>
    `
        : ''
    }

    ${
      data.microchip_number
        ? `
    <line x1="32" y1="440" x2="824" y2="440" stroke="#e5e7eb" stroke-width="1"/>
    <text x="32" y="470" font-size="10" fill="#9ca3af" letter-spacing="1">MICROCHIP (Ley 21.020)</text>
    <text x="32" y="494" font-family="monospace" font-size="14" fill="#6b7280">${escapeXml(data.microchip_number)}</text>
    `
        : ''
    }
  </g>
</svg>`;
}

// ────────────────────────────────────────────────────────────────────────
// Handler principal
// ────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsOptions(req);
  const cors = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { pet_id, force_regenerate = false } = body as {
      pet_id: string;
      force_regenerate?: boolean;
    };

    if (!pet_id) {
      return new Response(JSON.stringify({ error: 'pet_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Client con user auth (respeta RLS)
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Admin client para operaciones sensibles (bypass RLS pero validado por auth arriba)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Cargar datos de la mascota + owner
    const { data: pet, error: petErr } = await admin
      .from('pets')
      .select(
        'id, owner_id, name, species, breed, birth_date, gender, neutered, color, microchip_number, photo_url, blood_type, allergies, chronic_conditions, emergency_vet_name, emergency_vet_phone'
      )
      .eq('id', pet_id)
      .maybeSingle();

    if (petErr || !pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el caller es owner o co-owner con permiso
    const isOwner = pet.owner_id === user.id;
    if (!isOwner) {
      const { data: coOwner } = await admin
        .from('pet_co_owners')
        .select('permissions')
        .eq('pet_id', pet_id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (!coOwner || !(coOwner.permissions ?? []).includes('edit_pet')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    // Owner profile para nombre/telefono en el reverso
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('display_name, phone')
      .eq('id', pet.owner_id)
      .maybeSingle();

    // Buscar si ya existe card activa
    const { data: existingCard } = await admin
      .from('pet_id_cards')
      .select('id, card_number, version, svg_url, png_url, pdf_url, is_active')
      .eq('pet_id', pet_id)
      .eq('is_active', true)
      .maybeSingle();

    // Si existe y no se fuerza regenerar, retornar el existente
    if (existingCard && !force_regenerate) {
      return new Response(
        JSON.stringify({
          card_number: existingCard.card_number,
          version: existingCard.version,
          svg_url: existingCard.svg_url,
          png_url: existingCard.png_url,
          pdf_url: existingCard.pdf_url,
          regenerated: false,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Nose print hash si existe
    const { data: nosePrint } = await admin
      .from('nose_prints' as 'pet_id_cards') // Cast porque la tabla puede no existir aun en types
      .select('short_hash')
      .eq('pet_id', pet_id)
      .eq('is_primary', true)
      .maybeSingle()
      .then((r) => r)
      .catch(() => ({ data: null }));

    // Generar card_number si es nueva card
    let cardNumber: string;
    let version: number;
    if (existingCard) {
      cardNumber = existingCard.card_number;
      version = existingCard.version + 1;
      // Desactivar la anterior
      await admin.from('pet_id_cards').update({ is_active: false }).eq('id', existingCard.id);
    } else {
      const { data: newNumber } = await admin.rpc('generate_pet_id_card_number');
      cardNumber = newNumber as unknown as string;
      version = 1;
    }

    const cardData: PetIdCardData = {
      pet_id,
      card_number: cardNumber,
      pet_name: pet.name,
      species: pet.species,
      breed: pet.breed,
      birth_date: pet.birth_date,
      gender: pet.gender,
      neutered: pet.neutered,
      color: pet.color,
      microchip_number: pet.microchip_number,
      photo_url: pet.photo_url,
      blood_type: pet.blood_type,
      allergies: pet.allergies,
      chronic_conditions: pet.chronic_conditions,
      emergency_vet_name: pet.emergency_vet_name,
      emergency_vet_phone: pet.emergency_vet_phone,
      owner_name: ownerProfile?.display_name ?? null,
      owner_phone: (ownerProfile as { phone?: string | null } | null)?.phone ?? null,
      nose_print_hash: (nosePrint as { short_hash?: string } | null)?.short_hash ?? null,
      issued_at: new Date().toISOString(),
    };

    // Generar SVGs
    const frontSvg = renderFrontSvg(cardData);
    const backSvg = renderBackSvg(cardData);

    // Upload a storage
    const timestamp = Date.now();
    const basePath = `${pet_id}/v${version}_${timestamp}`;

    const [frontUpload, backUpload] = await Promise.all([
      admin.storage
        .from(BUCKET_NAME)
        .upload(`${basePath}_front.svg`, new Blob([frontSvg], { type: 'image/svg+xml' }), {
          contentType: 'image/svg+xml',
          upsert: true,
        }),
      admin.storage
        .from(BUCKET_NAME)
        .upload(`${basePath}_back.svg`, new Blob([backSvg], { type: 'image/svg+xml' }), {
          contentType: 'image/svg+xml',
          upsert: true,
        }),
    ]);

    if (frontUpload.error || backUpload.error) {
      console.error('Storage upload error:', frontUpload.error || backUpload.error);
      return new Response(
        JSON.stringify({
          error: 'Failed to upload SVGs',
          details: frontUpload.error?.message || backUpload.error?.message,
        }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { data: frontPub } = admin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${basePath}_front.svg`);
    const { data: backPub } = admin.storage.from(BUCKET_NAME).getPublicUrl(`${basePath}_back.svg`);

    // PNG y PDF: generacion deferida. Por ahora apuntamos a las SVG como fallback.
    // TODO: agregar canvas server-side (@resvg/resvg-wasm) para PNG y PDF (pdf-lib)
    const svgUrl = frontPub.publicUrl;
    const pngUrl = frontPub.publicUrl; // placeholder — cliente puede rasterizar
    const pdfUrl = backPub.publicUrl; // placeholder — futuro: combinar front+back en 1 PDF

    // Insertar fila pet_id_cards
    const { error: insertErr } = await admin.from('pet_id_cards').insert({
      pet_id,
      card_number: cardNumber,
      version,
      is_active: true,
      svg_url: svgUrl,
      png_url: pngUrl,
      pdf_url: pdfUrl,
      metadata: cardData as unknown as Record<string, unknown>,
      default_qr_mode: 'emergency',
    });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(
        JSON.stringify({ error: 'Failed to save card', details: insertErr.message }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        card_number: cardNumber,
        version,
        svg_url: svgUrl,
        png_url: pngUrl,
        pdf_url: pdfUrl,
        regenerated: !!existingCard,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-pet-id-card error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
