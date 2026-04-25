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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
  chip_registry: string | null;
  photo_url: string | null;
  blood_type: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  emergency_vet_name: string | null;
  emergency_vet_phone: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  emergency_contact_alt: string | null;
  weight_kg: number | null;
  weight_date: string | null;
  vaccination_status: string | null;
  current_medications_summary: string | null;
  diet_summary: string | null;
  nose_print_hash: string | null;
  issued_at: string;
  expires_at: string | null;
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
  const sexLabel = data.gender === 'macho' ? 'M' : data.gender === 'hembra' ? 'F' : '—';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <!-- Banda superior estilo cédula chilena REAL: verde turquesa → rosa pálido -->
    <linearGradient id="bandSolid" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7dd3c0"/>
      <stop offset="35%" stop-color="#a7f3d0"/>
      <stop offset="65%" stop-color="#fce7e0"/>
      <stop offset="100%" stop-color="#fbb6a0"/>
    </linearGradient>
    <!-- Acento verde oscuro para tag "MASCOTA RESIDENTE" (como "EXTRANJERO" en la real) -->
    <linearGradient id="greenTag" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <!-- Fondo papel: blanco perlado con tonalidad sutil rosa/celeste tipo cédula real -->
    <radialGradient id="bgPaper" cx="50%" cy="40%" r="90%">
      <stop offset="0%" stop-color="#fffbf5"/>
      <stop offset="50%" stop-color="#fef3f2"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </radialGradient>
    <!-- Cordillera: gradientes verticales suaves -->
    <linearGradient id="mountainBack" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#7dd3fc" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="mountainMid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="mountainFront" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0.15"/>
    </linearGradient>
    <!-- Guilloché ondulado tipo billete real (líneas finas curvas, no círculos) -->
    <pattern id="guilloche" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 C 20 5, 40 35, 60 20 S 80 5, 80 20" fill="none" stroke="#0033A0" stroke-width="0.35" opacity="0.22"/>
      <path d="M0 20 C 20 35, 40 5, 60 20 S 80 35, 80 20" fill="none" stroke="#D52B1E" stroke-width="0.25" opacity="0.18"/>
    </pattern>
    <!-- Micro-letras Paw Friend de seguridad -->
    <pattern id="microText" x="0" y="0" width="200" height="20" patternUnits="userSpaceOnUse">
      <text x="0" y="14" font-family="Arial,sans-serif" font-size="6" fill="#0033A0" opacity="0.12" letter-spacing="2">PAW FRIEND · CHILE · PAW FRIEND · CHILE</text>
    </pattern>
    <!-- Sombra suave para foto/elementos -->
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <!-- Holograma iridiscente fake -->
    <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="33%" stop-color="#60a5fa"/>
      <stop offset="66%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>

  <!-- Fondo principal con radial gradient (no plano) -->
  <rect width="856" height="540" rx="22" fill="url(#bgPaper)"/>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- CORDILLERA ORGÁNICA con curvas Bezier (3 capas)       -->
  <!-- ───────────────────────────────────────────────────── -->
  <!-- Capa lejana: curvas suaves -->
  <path d="M0 280 C 60 240, 120 290, 200 250 C 280 210, 340 280, 420 245 C 500 215, 560 285, 640 250 C 720 220, 780 280, 856 255 L856 540 L0 540 Z"
        fill="url(#mountainBack)"/>
  <!-- Capa media: con cumbres más pronunciadas -->
  <path d="M0 340 C 50 290, 100 320, 170 280 C 240 240, 290 320, 360 290 C 430 250, 500 310, 570 285 C 640 260, 720 320, 790 295 C 820 285, 856 305, 856 305 L856 540 L0 540 Z"
        fill="url(#mountainMid)"/>
  <!-- Capa frontal: colinas suaves -->
  <path d="M0 410 C 80 380, 160 420, 240 395 C 320 370, 400 415, 480 395 C 560 370, 640 415, 720 395 C 800 370, 856 405, 856 405 L856 540 L0 540 Z"
        fill="url(#mountainFront)"/>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- Patrones de seguridad encima del fondo (sutiles)      -->
  <!-- ───────────────────────────────────────────────────── -->
  <rect width="856" height="540" rx="22" fill="url(#guilloche)"/>
  <rect width="856" height="540" rx="22" fill="url(#microText)"/>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- BORDE DOBLE DECORATIVO (línea exterior + interior)    -->
  <!-- ───────────────────────────────────────────────────── -->
  <rect width="856" height="540" rx="22" fill="none" stroke="#0033A0" stroke-width="2.5"/>
  <rect x="6" y="6" width="844" height="528" rx="18" fill="none" stroke="#0033A0" stroke-width="0.5" opacity="0.5"/>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- CÓNDOR DETALLADO con curvas suaves (más realista)     -->
  <!-- ───────────────────────────────────────────────────── -->
  <g opacity="0.22" transform="translate(540 195)">
    <!-- Ala izquierda con curvas -->
    <path d="M0 30 C 15 10, 35 5, 55 18 C 70 22, 80 25, 95 28"
          fill="none" stroke="#0033A0" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Ala derecha con curvas -->
    <path d="M105 28 C 120 25, 135 22, 155 18 C 175 8, 195 12, 210 30"
          fill="none" stroke="#0033A0" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Cuerpo central -->
    <ellipse cx="100" cy="28" rx="12" ry="7" fill="#0033A0"/>
    <!-- Plumas de las alas (líneas finas) -->
    <line x1="20" y1="22" x2="25" y2="35" stroke="#0033A0" stroke-width="1" opacity="0.7"/>
    <line x1="35" y1="18" x2="40" y2="33" stroke="#0033A0" stroke-width="1" opacity="0.7"/>
    <line x1="50" y1="16" x2="55" y2="32" stroke="#0033A0" stroke-width="1" opacity="0.7"/>
    <line x1="155" y1="16" x2="160" y2="32" stroke="#0033A0" stroke-width="1" opacity="0.7"/>
    <line x1="170" y1="18" x2="175" y2="33" stroke="#0033A0" stroke-width="1" opacity="0.7"/>
    <line x1="185" y1="22" x2="190" y2="35" stroke="#0033A0" stroke-width="1" opacity="0.7"/>
    <!-- Cabeza con detalle (cuello rojo cóndor real) -->
    <circle cx="115" cy="23" r="5" fill="#0033A0"/>
    <circle cx="116" cy="22" r="2" fill="#D52B1E" opacity="0.8"/>
    <!-- Cola triangular -->
    <path d="M88 32 L78 42 L98 35 Z" fill="#0033A0"/>
  </g>

  <!-- Estrella solitaria izquierda (decorativa con líneas finas) -->
  <g opacity="0.15" transform="translate(720 130)">
    <polygon points="0,-18 5,-6 18,-6 8,3 12,16 0,8 -12,16 -8,3 -18,-6 -5,-6" fill="none" stroke="#D52B1E" stroke-width="1"/>
    <polygon points="0,-12 3,-4 12,-4 5,2 8,11 0,5 -8,11 -5,2 -12,-4 -3,-4" fill="#D52B1E" opacity="0.6"/>
  </g>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- BANDA SUPERIOR con curva orgánica de transición       -->
  <!-- ───────────────────────────────────────────────────── -->
  <!-- Fondo azul base completo -->
  <path d="M 22 0 L 856 0 L 856 78 L 0 78 L 0 22 Q 0 0 22 0 Z" fill="url(#bandSolid)"/>
  <!-- Acento rojo derecha con curva diagonal (NO recta) -->
  <path d="M 660 0 L 856 0 L 856 78 L 700 78 C 720 50, 690 30, 660 0 Z" fill="url(#redAccent)"/>
  <!-- Línea decorativa fina dorada que separa azul y rojo -->
  <path d="M 660 0 C 680 30, 720 55, 700 78" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.7"/>

  <!-- Líneas decorativas finas en la banda azul (security pattern) -->
  <g opacity="0.25" stroke="#ffffff" stroke-width="0.4" fill="none">
    <path d="M 0 22 L 660 22"/>
    <path d="M 0 56 L 700 56"/>
  </g>

  <!-- Bandera Chile pequeña con sombra suave -->
  <g transform="translate(26 18)" filter="url(#softShadow)">
    <rect width="38" height="26" fill="#ffffff"/>
    <rect width="15" height="13" fill="#0033A0"/>
    <rect x="15" y="0" width="23" height="13" fill="#ffffff"/>
    <rect x="0" y="13" width="38" height="13" fill="#D52B1E"/>
    <polygon points="7.5,3.5 9,6.5 12.5,6.5 9.5,8.5 10.5,12 7.5,10 4.5,12 5.5,8.5 2.5,6.5 6,6.5" fill="#ffffff"/>
  </g>

  <!-- Texto título con FUENTE SERIF (no Arial común) -->
  <text x="84" y="30" font-family="Georgia,'Times New Roman',serif" font-size="16" font-weight="700" fill="#ffffff" letter-spacing="3">REPÚBLICA DE CHILE</text>
  <text x="84" y="52" font-family="Georgia,'Times New Roman',serif" font-size="22" font-style="italic" fill="#fef3c7" letter-spacing="1">Cédula de Mascota</text>
  <text x="84" y="68" font-family="Arial,sans-serif" font-size="7" fill="#bfdbfe" letter-spacing="2" opacity="0.95">PAW FRIEND · SERVICIO DE IDENTIFICACIÓN DE MASCOTAS</text>

  <!-- Estrella estilizada con detalle (no plana) -->
  <g transform="translate(795 38)">
    <polygon points="0,-22 6,-7 22,-7 9.5,3 14,18 0,9 -14,18 -9.5,3 -22,-7 -6,-7" fill="#ffffff"/>
    <polygon points="0,-14 4,-4.5 14,-4.5 6,2 9.5,11.5 0,6 -9.5,11.5 -6,2 -14,-4.5 -4,-4.5" fill="#fbbf24" opacity="0.95"/>
  </g>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- FOTO ÁREA con marco azul institucional               -->
  <!-- ───────────────────────────────────────────────────── -->
  <rect x="30" y="100" width="226" height="290" rx="8" fill="#ffffff" stroke="#0033A0" stroke-width="3"/>
  <rect x="36" y="106" width="214" height="278" rx="4" fill="#f1f5f9"/>
  ${
    data.photo_url
      ? `<image x="36" y="106" width="214" height="278" href="${escapeXml(data.photo_url)}" preserveAspectRatio="xMidYMid slice"/>`
      : `<g transform="translate(143 215)">
          <circle cx="0" cy="0" r="80" fill="#dbeafe"/>
          <text x="0" y="20" font-size="100" text-anchor="middle">${speciesEmoji(data.species)}</text>
          <text x="0" y="100" font-family="Arial,sans-serif" font-size="11" text-anchor="middle" fill="#64748b" letter-spacing="1">FOTO PENDIENTE</text>
        </g>`
  }
  <!-- Tag especie color destacado debajo de foto -->
  <rect x="30" y="396" width="226" height="26" rx="4" fill="#0033A0"/>
  <text x="143" y="414" font-family="Arial,sans-serif" font-size="12" text-anchor="middle" fill="#ffffff" letter-spacing="3" font-weight="bold">${escapeXml(data.species.toUpperCase())}</text>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- TAG MASCOTA RESIDENTE - Banner verde llamativo        -->
  <!-- ───────────────────────────────────────────────────── -->
  <rect x="288" y="100" width="180" height="22" rx="3" fill="#15803d"/>
  <text x="378" y="116" font-family="Arial,sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2.5">MASCOTA RESIDENTE</text>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- DATOS EN COLUMNAS - tipografía mejorada               -->
  <!-- ───────────────────────────────────────────────────── -->
  <g font-family="Arial,sans-serif">
    <!-- NOMBRE grande y prominente -->
    <text x="288" y="148" font-size="9" fill="#64748b" letter-spacing="1.5" font-weight="600">NOMBRES</text>
    <text x="288" y="180" font-size="32" font-weight="900" fill="#0f172a" letter-spacing="0.5">${escapeXml(data.pet_name)}</text>

    <!-- Línea sutil separadora -->
    <line x1="288" y1="195" x2="824" y2="195" stroke="#cbd5e1" stroke-width="0.8"/>

    <!-- Columna izquierda: ESPECIE / RAZA / NACIMIENTO -->
    <text x="288" y="218" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">ESPECIE</text>
    <text x="288" y="238" font-size="14" font-weight="600" fill="#0f172a">${escapeXml(data.species)}</text>

    <text x="288" y="266" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">RAZA</text>
    <text x="288" y="286" font-size="14" font-weight="600" fill="#0f172a">${escapeXml(data.breed || '—')}</text>

    <text x="288" y="314" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">FECHA DE NACIMIENTO</text>
    <text x="288" y="334" font-size="14" font-weight="600" fill="#0f172a">${escapeXml(formatDate(data.birth_date))}${age ? ` <tspan font-size="11" fill="#64748b" font-weight="400">· ${escapeXml(age)}</tspan>` : ''}</text>

    <!-- Columna derecha: N° MASCOTA / SEXO / COLOR / EMISIÓN -->
    <text x="560" y="218" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">N° MASCOTA</text>
    <text x="560" y="240" font-size="20" font-weight="900" font-family="'Courier New',monospace" fill="#D52B1E">${escapeXml(data.card_number)}</text>

    <text x="560" y="266" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">SEXO</text>
    <text x="560" y="286" font-size="14" font-weight="600" fill="#0f172a">${sexLabel}${data.neutered ? ' · Esterilizado' : ''}</text>

    <text x="560" y="314" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">COLOR</text>
    <text x="560" y="334" font-size="14" font-weight="600" fill="#0f172a">${escapeXml(data.color || '—')}</text>

    <!-- Línea final separadora antes del footer -->
    <line x1="288" y1="350" x2="824" y2="350" stroke="#cbd5e1" stroke-width="0.8"/>

    <!-- Fechas emisión / vencimiento + biometría -->
    <text x="288" y="372" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">FECHA EMISIÓN</text>
    <text x="288" y="392" font-size="13" fill="#0f172a">${escapeXml(formatDate(data.issued_at))}</text>

    <text x="440" y="372" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">VENCIMIENTO</text>
    <text x="440" y="392" font-size="13" fill="#0f172a">${escapeXml(formatDate(data.expires_at))}</text>

    ${
      data.nose_print_hash
        ? `
    <text x="600" y="372" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">HUELLA NASAL</text>
    <text x="600" y="392" font-size="13" font-family="'Courier New',monospace" font-weight="bold" fill="#0033A0">${escapeXml(data.nose_print_hash)}</text>
    `
        : `<text x="600" y="372" font-size="8" fill="#64748b" letter-spacing="1.5" font-weight="600">BIOMETRÍA</text>
    <text x="600" y="392" font-size="11" font-style="italic" fill="#94a3b8">Pendiente captura</text>`
    }
  </g>

  <!-- ───────────────────────────────────────────────────── -->
  <!-- FOOTER con barra azul + holograma iridiscente         -->
  <!-- ───────────────────────────────────────────────────── -->
  <!-- Barra inferior azul (NO tricolor torpe, solo azul + acentos) -->
  <path d="M 0 510 L 856 510 L 856 518 Q 856 540 836 540 L 22 540 Q 0 540 0 518 Z"
        fill="url(#bandSolid)"/>

  <!-- Línea decorativa dorada arriba del footer -->
  <line x1="22" y1="510" x2="836" y2="510" stroke="#fbbf24" stroke-width="0.6" opacity="0.7"/>

  <!-- Card number con marco fino -->
  <text x="48" y="530" font-family="'Courier New',monospace" font-size="12" font-weight="900" fill="#ffffff" letter-spacing="1.5">${escapeXml(data.card_number)}</text>

  <!-- Texto Ley 21.020 centrado -->
  <text x="428" y="527" font-family="Georgia,serif" font-size="9" fill="#fef3c7" text-anchor="middle" letter-spacing="0.5" font-style="italic">Cumple Ley 21.020 · Cholito · Tenencia responsable</text>

  <!-- Holograma iridiscente derecha -->
  <g transform="translate(770 525)">
    <circle r="12" fill="url(#holoGrad)" opacity="0.85"/>
    <circle r="12" fill="none" stroke="#ffffff" stroke-width="0.8"/>
    <text y="-1" font-family="Arial,sans-serif" font-size="5" text-anchor="middle" fill="#ffffff" font-weight="bold">PAW</text>
    <text y="6" font-family="Arial,sans-serif" font-size="5" text-anchor="middle" fill="#ffffff" font-weight="bold">FRIEND</text>
  </g>

  <!-- ★ CHILE estilizado -->
  <g transform="translate(815 530)">
    <polygon points="0,-5 1.5,-1.5 5,-1.5 2,1 3,5 0,2.5 -3,5 -2,1 -5,-1.5 -1.5,-1.5" fill="#fbbf24"/>
  </g>
  <text x="828" y="533" font-family="Georgia,serif" font-size="9" fill="#ffffff" font-weight="bold">CHILE</text>

  <!-- URL del QR (debug): ${escapeXml(qrUrl)} -->
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
  // REVERSO ESTILO CÉDULA CHILENA REAL: QR arriba izquierda, huella arriba derecha,
  // datos secundarios en bloque medio, MRZ-like al fondo (3 líneas legibles).
  // Misma estructura visual que toda persona en Chile reconoce instantáneamente
  // como cédula. Pertenencia + autenticidad.

  // Helpers para construir MRZ-style (formato passport ICAO 9303 adaptado)
  const padField = (s: string, len: number) => {
    const clean = (s || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '<')
      .padEnd(len, '<');
    return clean.slice(0, len);
  };
  const dobMrz = data.birth_date ? data.birth_date.replace(/-/g, '').slice(2, 8) : '<<<<<<';
  const sexMrz = data.gender === 'macho' ? 'M' : data.gender === 'hembra' ? 'F' : '<';
  const cardClean = data.card_number.replace(/[^A-Z0-9]/gi, '');
  const mrzLine1 = `PF${padField(data.pet_name, 28)}<<${padField(data.species, 8)}`;
  const mrzLine2 = `${padField(cardClean, 9)}<CHL${dobMrz}${sexMrz}<<<${padField(data.breed || '', 10)}`;
  const mrzLine3 = `${padField(data.microchip_number || '', 15)}<${padField(data.color || '', 8)}<${
    data.neutered ? 'STZ' : '<<<'
  }<${padField(data.blood_type || '', 4)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540" width="856" height="540">
  <defs>
    <linearGradient id="bandFlagBack" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0033A0"/>
      <stop offset="15%" stop-color="#0033A0"/>
      <stop offset="15%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#D52B1E"/>
      <stop offset="100%" stop-color="#D52B1E"/>
    </linearGradient>
    <linearGradient id="bgPaperBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3e8"/>
      <stop offset="50%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <pattern id="guillocheBack" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <circle cx="30" cy="30" r="22" fill="none" stroke="#0033A0" stroke-width="0.4" opacity="0.18"/>
      <circle cx="30" cy="30" r="14" fill="none" stroke="#0033A0" stroke-width="0.3" opacity="0.15"/>
      <circle cx="30" cy="30" r="6" fill="none" stroke="#D52B1E" stroke-width="0.3" opacity="0.18"/>
    </pattern>
    <linearGradient id="mountainBackR" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- Fondo papel rico (NO blanco) + guilloché -->
  <rect width="856" height="540" rx="20" fill="url(#bgPaperBack)" stroke="#0033A0" stroke-width="2"/>
  <rect width="856" height="540" rx="20" fill="url(#guillocheBack)"/>
  <!-- Cordillera abajo -->
  <path d="M0 420 L60 380 L120 410 L200 360 L290 400 L380 365 L470 400 L560 370 L660 405 L760 375 L856 395 L856 540 L0 540 Z"
        fill="url(#mountainBackR)"/>

  <!-- Banda superior tricolor (más fina que el frente) -->
  <rect x="0" y="0" width="856" height="28" fill="url(#bandFlagBack)" rx="20" ry="20"/>
  <rect x="0" y="14" width="856" height="14" fill="url(#bandFlagBack)"/>
  <text x="32" y="18" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#ffffff" letter-spacing="2">REPÚBLICA DE CHILE · PAW FRIEND</text>
  <text x="824" y="18" font-family="monospace" font-size="8" fill="#ffffff" text-anchor="end" opacity="0.9">#${escapeXml(data.card_number)}</text>

  <!-- QR ARRIBA IZQUIERDA (como cédula real) -->
  <rect x="48" y="56" width="160" height="160" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" rx="4"/>
  <!-- Marcadores QR esquina (decorativos, cliente sustituye con QR real) -->
  <rect x="56" y="64" width="36" height="36" fill="#0f172a"/>
  <rect x="62" y="70" width="24" height="24" fill="#ffffff"/>
  <rect x="66" y="74" width="16" height="16" fill="#0f172a"/>
  <rect x="164" y="64" width="36" height="36" fill="#0f172a"/>
  <rect x="170" y="70" width="24" height="24" fill="#ffffff"/>
  <rect x="174" y="74" width="16" height="16" fill="#0f172a"/>
  <rect x="56" y="172" width="36" height="36" fill="#0f172a"/>
  <rect x="62" y="178" width="24" height="24" fill="#ffffff"/>
  <rect x="66" y="182" width="16" height="16" fill="#0f172a"/>
  <text x="128" y="142" font-family="Arial,sans-serif" font-size="9" text-anchor="middle" fill="#0f172a" font-weight="bold">QR</text>
  <text x="128" y="156" font-family="Arial,sans-serif" font-size="8" text-anchor="middle" fill="#64748b">FICHA CLÍNICA</text>
  <text x="128" y="232" font-family="Arial,sans-serif" font-size="7" text-anchor="middle" fill="#64748b" letter-spacing="1">pawfriend.cl/id</text>

  <!-- HUELLA NASAL ARRIBA DERECHA (donde va la huella dactilar en cédula real) -->
  <g>
    <ellipse cx="752" cy="135" rx="60" ry="80" fill="#fafafa" stroke="#0f172a" stroke-width="1.5" opacity="0.7"/>
    <!-- Patrón huella estilizado -->
    <ellipse cx="734" cy="108" rx="14" ry="18" fill="#0f172a" opacity="0.4"/>
    <ellipse cx="770" cy="108" rx="14" ry="18" fill="#0f172a" opacity="0.4"/>
    <path d="M 720 158 Q 752 178 784 158" stroke="#0f172a" stroke-width="1.2" fill="none" opacity="0.5"/>
    <path d="M 715 170 Q 752 195 789 170" stroke="#0f172a" stroke-width="1" fill="none" opacity="0.4"/>
    <path d="M 712 184 Q 752 208 792 184" stroke="#0f172a" stroke-width="0.8" fill="none" opacity="0.3"/>
  </g>
  <text x="752" y="234" font-family="Arial,sans-serif" font-size="7" text-anchor="middle" fill="#64748b" letter-spacing="1.5">HUELLA NASAL</text>

  <!-- Banda lateral derecha tipo "ESPÉCIMEN VISA" del pasaporte (vertical) -->
  <text x="836" y="160" font-family="Arial,sans-serif" font-size="8" fill="#0033A0" letter-spacing="3" font-weight="bold" transform="rotate(-90 836 160)" opacity="0.6">PF · CHILE</text>

  <!-- DATOS CENTRALES (entre QR y huella) - mínimos -->
  <g font-family="Arial,sans-serif">
    <text x="232" y="76" font-size="7" fill="#64748b" letter-spacing="1.2">EN EMERGENCIA</text>
    <text x="232" y="98" font-size="14" font-weight="bold" fill="#0f172a">${escapeXml(data.emergency_contact_alt || data.owner_phone || '—')}</text>

    <text x="232" y="124" font-size="7" fill="#64748b" letter-spacing="1.2">TUTOR</text>
    <text x="232" y="142" font-size="11" fill="#0f172a">${escapeXml(data.owner_name || '—')}</text>

    ${
      data.microchip_number
        ? `
    <text x="232" y="172" font-size="7" fill="#64748b" letter-spacing="1.2">MICROCHIP</text>
    <text x="232" y="190" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a">${escapeXml(data.microchip_number)}</text>
    ${
      data.chip_registry
        ? `<text x="232" y="206" font-size="9" fill="#64748b">Registro ${escapeXml(data.chip_registry)} · Ley 21.020 Cholito</text>`
        : `<text x="232" y="206" font-size="9" fill="#64748b">Cumple Ley 21.020 (Cholito)</text>`
    }
    `
        : `<text x="232" y="186" font-size="10" font-style="italic" fill="#94a3b8">Sin microchip registrado · Ley 21.020 Cholito recomienda chipear</text>`
    }
  </g>

  <!-- Línea separadora antes del MRZ -->
  <line x1="48" y1="290" x2="808" y2="290" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Mensaje de pertenencia -->
  <text x="428" y="320" font-family="Arial,sans-serif" font-size="11" text-anchor="middle" fill="#0033A0" font-weight="bold" letter-spacing="1.5">LAS MASCOTAS TAMBIÉN SON CHILENAS 🇨🇱</text>
  <text x="428" y="340" font-family="Arial,sans-serif" font-size="9" text-anchor="middle" fill="#64748b" font-style="italic">Cada huella nasal es única. Cada mascota merece su identidad.</text>

  <!-- MRZ-style abajo (3 líneas estilo pasaporte chileno) -->
  <rect x="48" y="408" width="760" height="100" fill="#fafafa" stroke="#cbd5e1" stroke-width="0.5" rx="4"/>
  <text x="64" y="438" font-family="'Courier New',monospace" font-size="14" font-weight="bold" fill="#0f172a" letter-spacing="2">${escapeXml(mrzLine1)}</text>
  <text x="64" y="466" font-family="'Courier New',monospace" font-size="14" font-weight="bold" fill="#0f172a" letter-spacing="2">${escapeXml(mrzLine2)}</text>
  <text x="64" y="494" font-family="'Courier New',monospace" font-size="14" font-weight="bold" fill="#0f172a" letter-spacing="2">${escapeXml(mrzLine3)}</text>

  <!-- Footer micro -->
  <text x="824" y="528" font-family="Arial,sans-serif" font-size="7" text-anchor="end" fill="#94a3b8" letter-spacing="0.5">pawfriend.cl/id/${escapeXml(data.card_number)}</text>
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
        'id, owner_id, name, species, breed, birth_date, gender, neutered, color, microchip_number, chip_registry, photo_url, blood_type, allergies, chronic_conditions, emergency_vet_name, emergency_vet_phone, weight, weight_history, current_medications, vaccination_status, diet_brand, diet_type'
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

    // Resúmenes derivados (solo si hay valor, sin saturar la cédula)
    const weightHistory =
      (pet.weight_history as Array<{ weight: number; date: string }> | null) ?? [];
    const lastWeightEntry =
      weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null;

    const meds =
      (pet.current_medications as Array<{ name?: string; dosage?: string }> | null) ?? [];
    const medsSummary =
      meds.length > 0
        ? meds
            .slice(0, 2)
            .map((m) => m.name)
            .filter(Boolean)
            .join(', ') + (meds.length > 2 ? '…' : '')
        : null;

    const dietParts = [pet.diet_brand, pet.diet_type].filter(Boolean);
    const dietSummary = dietParts.length > 0 ? dietParts.join(' · ') : null;

    // Vencimiento: 5 años desde emisión (estándar cédula chilena)
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 5);

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
      chip_registry: (pet as { chip_registry?: string | null }).chip_registry ?? null,
      photo_url: pet.photo_url,
      blood_type: pet.blood_type,
      allergies: Array.isArray(pet.allergies)
        ? pet.allergies.join(', ')
        : (pet.allergies as string | null),
      chronic_conditions: Array.isArray(pet.chronic_conditions)
        ? pet.chronic_conditions.join(', ')
        : (pet.chronic_conditions as string | null),
      emergency_vet_name: pet.emergency_vet_name,
      emergency_vet_phone: pet.emergency_vet_phone,
      owner_name: ownerProfile?.display_name ?? null,
      owner_phone: (ownerProfile as { phone?: string | null } | null)?.phone ?? null,
      emergency_contact_alt: null, // futuro: campo dedicado en pets
      weight_kg: (pet.weight as number | null) ?? lastWeightEntry?.weight ?? null,
      weight_date: lastWeightEntry?.date ?? null,
      vaccination_status: pet.vaccination_status,
      current_medications_summary: medsSummary,
      diet_summary: dietSummary,
      nose_print_hash: (nosePrint as { short_hash?: string } | null)?.short_hash ?? null,
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
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
