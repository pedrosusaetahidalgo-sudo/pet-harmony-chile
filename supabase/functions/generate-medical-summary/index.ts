/* eslint-disable @typescript-eslint/no-explicit-any --
 * Esta edge function (Deno) trabaja con JSON dinamico retornado por el RPC
 * `get_medical_summary_data` de Supabase, donde los tipos son intrinsecamente
 * genericos (vaccinations[], visits[], medications, etc. son JSON nested).
 * Tipar correctamente requiere definir interfaces explicitas que reflejen
 * exactamente la forma del RPC, lo cual es un refactor dedicado fuera del
 * scope de FEATURE_MEDICAL_PDF_UPGRADE.md. Cuando se quiera tipar, remover
 * este disable y crear un commit separado "tipar generate-medical-summary
 * con interfaces reales del RPC".
 */
/**
 * Edge Function: Generate Medical Summary PDF
 * Creates a comprehensive, professionally formatted PDF of a pet's medical records.
 * Order: Header → Pet info → Owner → Estado actual → Vacunas → Consultas → Desparasitaciones → Footer
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PURPLE = rgb(0.416, 0.227, 0.718); // #6A3AB7
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const BLACK = rgb(0, 0, 0);
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 50;
const MARGIN_BOTTOM = 60;
const LOGO_URL = 'https://pawfriend.cl/pwa-icon-512.png';
const LOGO_SIZE = 40; // tamaño renderizado del logo en el header (pt)

// Cache top-level de los bytes del logo — se mantiene entre invocaciones
// mientras la edge function siga caliente. Si el fetch falla, se intenta
// de nuevo en la siguiente invocacion (no cacheamos el fallo).
let cachedLogoBytes: Uint8Array | null = null;

/**
 * Descarga el logo Paw Friend desde pawfriend.cl y lo cachea en memoria
 * del modulo para invocaciones siguientes. Devuelve null si el fetch falla,
 * en cuyo caso el PDF debe caer a fallback de texto (nunca emoji).
 * Ver FEATURE_MEDICAL_PDF_UPGRADE.md §4.1-4.2.
 */
async function getLogoBytes(): Promise<Uint8Array | null> {
  if (cachedLogoBytes) return cachedLogoBytes;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    cachedLogoBytes = new Uint8Array(await res.arrayBuffer());
    return cachedLogoBytes;
  } catch {
    return null;
  }
}

// =====================================================================
// Helpers de normalizacion tipografica para la ficha clinica PDF.
//
// Objetivo: renderizar texto libre del usuario con capitalizacion
// consistente, preservando tildes, nombres propios y siglas medicas.
// Ver _pending/features/FEATURE_MEDICAL_PDF_UPGRADE.md §3.
//
// Smoke tests (mentales, para referencia):
//   smartSentenceCase("PERRO CON DIARREA. NECESITA ANTIBIOTICO.")
//     -> "Perro con diarrea. Necesita antibiotico."
//   smartSentenceCase("se administro 5mg de metronidazol IV. paciente responde bien")
//     -> "Se administro 5mg de metronidazol iv. Paciente responde bien"
//     (IV se preserva mayuscula por ACRONYMS)
//   titleCase("maria jose de la fuente")
//     -> "Maria Jose de la Fuente"
//   properNoun("FIRULAIS")
//     -> "Firulais"
//   sanitizeForWinAnsi("Texto con — em-dash y "comillas"")
//     -> 'Texto con – em-dash y "comillas"'
// =====================================================================

const ACRONYMS = new Set([
  'DNI',
  'RUT',
  'PCR',
  'ECG',
  'EKG',
  'IV',
  'SC',
  'IM',
  'VO',
  'PRN',
  'BID',
  'TID',
  'QID',
  'SOS',
  'ML',
  'MG',
  'KG',
  'CM',
  'MM',
]);

// Preposiciones/articulos que en titleCase van en minuscula salvo al inicio.
const TITLE_CASE_LOWERCASES = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'y',
  'e',
  'o',
  'u',
  'da',
  'do',
]);

/**
 * Normaliza texto libre del usuario para renderizado formal en PDF.
 *
 * Reglas:
 *  1. Trim y colapso de espacios multiples -> un unico espacio.
 *  2. Todo a minuscula (toLocaleLowerCase es-CL, preserva tildes y ñ).
 *  3. Primera letra de la cadena -> mayuscula.
 *  4. Primera letra despues de ". ", "! ", "? " o newline -> mayuscula.
 *  5. Respeta siglas medicas conocidas (ACRONYMS): IV, SC, IM, BID, etc.
 *  6. Preserva tildes y ñ siempre.
 *  7. Si recibe null/undefined/"" -> devuelve "".
 */
function smartSentenceCase(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).replace(/\s+/g, ' ').trim();
  if (!s) return '';

  // 1. lowercase preservando tildes y ñ
  s = s.toLocaleLowerCase('es-CL');

  // 2. capitalizar inicio de cadena y despues de . ! ? \n
  s = s.replace(
    /(^|[.!?]\s+|\n\s*)([\p{L}])/gu,
    (_m, sep, ch) => sep + ch.toLocaleUpperCase('es-CL')
  );

  // 3. restaurar acronimos medicos conocidos (tokens completos)
  s = s.replace(/\b([\p{L}]+)\b/gu, (match) => {
    const upper = match.toLocaleUpperCase('es-CL');
    return ACRONYMS.has(upper) ? upper : match;
  });

  return s;
}

/**
 * "juan PEREZ de la fuente" -> "Juan Perez de la Fuente".
 * Usa para nombres propios multi-palabra (display_name, clinic_name).
 * Las preposiciones/articulos van en minuscula salvo si son la primera palabra.
 */
function titleCase(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).replace(/\s+/g, ' ').trim();
  if (!s) return '';

  return s
    .toLocaleLowerCase('es-CL')
    .split(' ')
    .map((word, i) => {
      if (!word) return word;
      if (i > 0 && TITLE_CASE_LOWERCASES.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase('es-CL') + word.slice(1);
    })
    .join(' ');
}

/**
 * "FIRULAIS" -> "Firulais". Usa para nombres propios single-word (pet.name).
 */
function properNoun(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim();
  if (!s) return '';
  return s.charAt(0).toLocaleUpperCase('es-CL') + s.slice(1).toLocaleLowerCase('es-CL');
}

/**
 * Reemplaza caracteres Unicode que WinAnsi (encoding de Helvetica estandar
 * de pdf-lib) no cubre, antes de pasar a page.drawText. Evita excepciones
 * del tipo "WinAnsi cannot encode" por em-dashes, comillas curly, ellipsis
 * y non-breaking spaces que el usuario puede haber pegado.
 */
function sanitizeForWinAnsi(s: string | null | undefined): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/\u2014/g, '\u2013') // em-dash -> en-dash (WinAnsi tiene en-dash)
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes -> straight
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes -> straight
    .replace(/\u2026/g, '...') // ellipsis -> tres puntos
    .replace(/\u00A0/g, ' '); // nbsp -> espacio normal
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { pet_id } = await req.json();
    if (!pet_id || typeof pet_id !== 'string') throw new Error('pet_id is required');

    // Ownership check
    const { data: petOwnership, error: ownershipError } = await supabase
      .from('pets')
      .select('owner_id')
      .eq('id', pet_id)
      .single();

    if (ownershipError || !petOwnership) throw new Error('Pet not found');
    if (petOwnership.owner_id !== userData.user.id) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Get all data
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'get_medical_summary_data',
      { p_pet_id: pet_id }
    );
    if (summaryError) throw summaryError;
    if (!summaryData) throw new Error('No data found');

    const pet = summaryData.pet;
    const owner = summaryData.owner;
    const vaccinations = (summaryData.vaccinations || []).sort((a: any, b: any) =>
      (b.date || '').localeCompare(a.date || '')
    );
    const recentVisits = (summaryData.recent_visits || []).sort((a: any, b: any) =>
      (b.visit_date || '').localeCompare(a.visit_date || '')
    );

    // Fetch dewormings separately
    const { data: dewormings } = await supabase
      .from('medical_records')
      .select('title, date, description')
      .eq('pet_id', pet_id)
      .in('record_type', ['desparasitacion', 'antipulgas'])
      .order('date', { ascending: false })
      .limit(20);

    // === Build PDF ===
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Fase 2: embeber logo Paw Friend para el header. Fallback silencioso
    // a null si el fetch o embed falla — el header usara solo texto.
    const logoBytes = await getLogoBytes();
    let logoImage: any = null;
    if (logoBytes) {
      try {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } catch {
        logoImage = null;
      }
    }

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - 40;

    const ensureSpace = (needed: number) => {
      if (y < MARGIN_BOTTOM + needed) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - 40;
      }
    };

    const text = (
      t: string,
      opts: { x?: number; size?: number; font?: any; color?: any; maxWidth?: number }
    ) => {
      ensureSpace(20);
      const font = opts.font || helvetica;
      const size = opts.size || 10;
      // Ultima defensa contra caracteres Unicode que WinAnsi no cubre
      // (em-dash, curly quotes, ellipsis, nbsp). Se aplica aqui para que
      // TODO drawText quede protegido sin pensarlo en cada call-site.
      let display = sanitizeForWinAnsi(t);
      const maxW = opts.maxWidth || PAGE_W - MARGIN_X * 2;
      while (font.widthOfTextAtSize(display, size) > maxW && display.length > 3) {
        display = display.slice(0, -4) + '...';
      }
      page.drawText(display, {
        x: opts.x || MARGIN_X,
        y,
        size,
        font,
        color: opts.color || BLACK,
      });
    };

    const line = () => {
      ensureSpace(10);
      page.drawLine({
        start: { x: MARGIN_X, y },
        end: { x: PAGE_W - MARGIN_X, y },
        thickness: 0.5,
        color: LIGHT_GRAY,
      });
      y -= 12;
    };

    const section = (title: string) => {
      ensureSpace(40);
      y -= 8;
      page.drawRectangle({
        x: MARGIN_X,
        y: y - 2,
        width: PAGE_W - MARGIN_X * 2,
        height: 20,
        color: rgb(0.95, 0.93, 1), // light purple bg
      });
      text(title, { size: 12, font: bold, color: PURPLE });
      y -= 18;
    };

    const field = (label: string, value: string) => {
      ensureSpace(16);
      text(label, { size: 9, font: bold, color: GRAY });
      text(value, { x: MARGIN_X + 140, size: 9 });
      y -= 14;
    };

    /**
     * Dibuja texto con word-wrap real: divide en palabras, calcula ancho con
     * la fuente dada, y agrega tantas lineas como haga falta, bajando `y`
     * automaticamente despues de cada linea. A diferencia de `text()` (que
     * trunca con "..."), preserva todo el contenido del usuario. Ver
     * FEATURE_MEDICAL_PDF_UPGRADE.md §5.4.
     *
     * NOTA: esta funcion SI baja `y` despues de dibujar (a diferencia de
     * `text()` que deja al caller bajarlo). No volver a bajar `y` despues
     * de llamar a drawWrappedText.
     */
    const drawWrappedText = (
      content: string,
      opts: {
        x?: number;
        maxWidth?: number;
        size?: number;
        font?: any;
        color?: any;
        lineHeight?: number;
      }
    ) => {
      const font = opts.font || helvetica;
      const size = opts.size || 9;
      const x = opts.x ?? MARGIN_X;
      const maxW = opts.maxWidth || PAGE_W - MARGIN_X - x;
      const lh = opts.lineHeight || size * 1.35;
      const color = opts.color || BLACK;

      const safe = sanitizeForWinAnsi(content);
      const words = safe.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      const lines: string[] = [];
      let current = '';
      for (const w of words) {
        const test = current ? `${current} ${w}` : w;
        if (font.widthOfTextAtSize(test, size) <= maxW) {
          current = test;
        } else {
          if (current) lines.push(current);
          // Edge case: palabra unica mas larga que maxW - la dibujamos tal
          // cual (desborda ligeramente) en vez de trabarnos en un loop.
          current = w;
        }
      }
      if (current) lines.push(current);

      for (const ln of lines) {
        ensureSpace(lh);
        page.drawText(ln, { x, y, size, font, color });
        y -= lh;
      }
    };

    const formatDate = (d: string | null) => {
      if (!d) return 'N/A';
      try {
        return new Date(d).toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return d;
      }
    };

    // ── HEADER ──
    // Fase 2: logo real PNG en la esquina superior izquierda + texto al costado.
    // Si el logo no pudo cargarse, fallback a solo texto sin emoji (nunca emoji).
    // Ver FEATURE_MEDICAL_PDF_UPGRADE.md §4-5.1.
    ensureSpace(LOGO_SIZE + 15);
    const headerTextX = logoImage ? MARGIN_X + LOGO_SIZE + 10 : MARGIN_X;
    if (logoImage) {
      // Alinear verticalmente con cap height del texto de 22pt:
      // logo bottom = y - 10 hace que el midpoint del logo quede cerca
      // del midpoint del bloque de 3 lineas del header.
      page.drawImage(logoImage, {
        x: MARGIN_X,
        y: y - 10,
        width: LOGO_SIZE,
        height: LOGO_SIZE,
      });
    }
    text('Paw Friend', { x: headerTextX, size: 22, font: bold, color: PURPLE });
    y -= 8;
    text('Ficha clínica veterinaria', { x: headerTextX, size: 11, color: GRAY });
    y -= 6;
    text(
      `Generado el ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      { x: headerTextX, size: 8, color: GRAY }
    );
    // Si hay logo, bajar extra para que el line() quede debajo del logo
    // (el logo ocupa ~LOGO_SIZE - 10 pt hacia arriba del y inicial, y las
    // 3 lineas de texto bajaron ~24 pt, faltan ~16 pt para despejar el logo).
    y -= logoImage ? 18 : 10;
    line();

    // ── 1. IDENTIFICACION DE LA MASCOTA ──
    section('1. Identificación de la mascota');

    const calcAge = (bd: string | null): string => {
      if (!bd) return 'N/A';
      const years = Math.floor(
        (Date.now() - new Date(bd).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (years < 1) {
        const months = Math.floor(
          (Date.now() - new Date(bd).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
        );
        return `${months} mes${months !== 1 ? 'es' : ''}`;
      }
      return `${years} año${years !== 1 ? 's' : ''}`;
    };

    // Normalizacion por campo (ver FEATURE_MEDICAL_PDF_UPGRADE.md §3.2).
    // pet.name        -> properNoun (nombre propio single-word)
    // pet.species     -> smartSentenceCase (texto libre del usuario)
    // pet.breed       -> smartSentenceCase
    // pet.gender      -> smartSentenceCase
    // pet.weight      -> sin transformar (numero + kg)
    // pet.neutered    -> sin transformar (boolean -> "Si"/"No")
    // pet.microchip_number -> sin transformar (identificador tecnico)
    const speciesLabel = smartSentenceCase(pet.species) || 'N/A';
    const breedLabel = pet.breed ? smartSentenceCase(pet.breed) : '';
    field('Nombre', properNoun(pet.name) || 'N/A');
    field('Especie / Raza', breedLabel ? `${speciesLabel} — ${breedLabel}` : speciesLabel);
    field(
      'Edad',
      `${calcAge(pet.birth_date)}${pet.birth_date ? ` (nac. ${formatDate(pet.birth_date)})` : ''}`
    );
    field('Sexo', smartSentenceCase(pet.gender) || 'N/A');
    field('Peso', pet.weight ? `${pet.weight} kg` : 'N/A');
    field('Esterilizado/a', pet.neutered ? 'Sí' : 'No');
    field('Microchip', pet.microchip_number || 'No registrado');

    // ── 2. RESPONSABLE ──
    // owner.display_name -> titleCase (nombre propio multi-palabra)
    // owner.email        -> sin transformar (email es case-insensitive semanticamente)
    section('2. Responsable');
    field('Nombre', titleCase(owner.display_name) || 'N/A');
    field('Email', owner.email || 'N/A');

    // ── 3. ESTADO CLINICO ACTUAL ──
    // chronic_conditions[] -> smartSentenceCase cada item (texto libre)
    // allergies[]          -> smartSentenceCase cada item (texto libre)
    // medications[].name   -> titleCase (nombres propios de farmacos)
    // medications[].dose   -> sin transformar (dosis con digitos y unidades)
    // Todos estos campos usan drawWrappedText porque el usuario puede
    // tener listas largas que antes se truncaban con "...".
    const hasAlerts =
      pet.chronic_conditions?.length || pet.allergies?.length || pet.current_medications;
    if (hasAlerts) {
      section('3. Estado clínico actual');
      if (pet.chronic_conditions?.length) {
        text('Condiciones crónicas', { size: 9, font: bold, color: GRAY });
        y -= 12;
        drawWrappedText(
          pet.chronic_conditions.map((c: string) => smartSentenceCase(c)).join(', '),
          { x: MARGIN_X + 10, size: 9 }
        );
        y -= 4;
      }
      if (pet.allergies?.length) {
        text('Alergias', { size: 9, font: bold, color: GRAY });
        y -= 12;
        drawWrappedText(pet.allergies.map((a: string) => smartSentenceCase(a)).join(', '), {
          x: MARGIN_X + 10,
          size: 9,
        });
        y -= 4;
      }
      if (pet.current_medications) {
        const meds = Array.isArray(pet.current_medications)
          ? pet.current_medications
              .map((m: any) => `${titleCase(m.name)}${m.dose ? ` (${m.dose})` : ''}`)
              .join(', ')
          : JSON.stringify(pet.current_medications);
        text('Medicamentos actuales', { size: 9, font: bold, color: GRAY });
        y -= 12;
        drawWrappedText(meds, { x: MARGIN_X + 10, size: 9 });
        y -= 4;
      }
    }

    // ── 4. VACUNAS (cronológico desc) ──
    // v.title -> smartSentenceCase (texto libre)
    section(`4. Vacunas (${vaccinations.length})`);
    if (vaccinations.length === 0) {
      text('Sin vacunas registradas', { size: 9, color: GRAY });
      y -= 14;
    } else {
      vaccinations.slice(0, 15).forEach((v: any) => {
        ensureSpace(16);
        text(`${formatDate(v.date)}`, { size: 8, font: bold, color: GRAY });
        text(smartSentenceCase(v.title) || 'Vacuna', { x: MARGIN_X + 90, size: 9 });
        if (v.next_date) {
          text(`Próxima: ${formatDate(v.next_date)}`, { x: MARGIN_X + 350, size: 8, color: GRAY });
        }
        y -= 14;
      });
    }

    // ── CONSULTAS VETERINARIAS (cronológico desc) ──
    // v.reason / v.title -> smartSentenceCase (texto libre)
    // v.clinic_name      -> titleCase (nombre propio)
    // v.diagnosis        -> smartSentenceCase (texto libre, frase completa)
    section(`5. Consultas veterinarias (${recentVisits.length})`);
    if (recentVisits.length === 0) {
      text('Sin consultas registradas', { size: 9, color: GRAY });
      y -= 14;
    } else {
      recentVisits.slice(0, 15).forEach((v: any) => {
        ensureSpace(40);
        text(formatDate(v.visit_date || v.date), { size: 8, font: bold, color: GRAY });
        text(smartSentenceCase(v.reason || v.title) || 'Consulta', {
          x: MARGIN_X + 90,
          size: 9,
          font: bold,
        });
        y -= 13;
        if (v.clinic_name) {
          text(`Clínica: ${titleCase(v.clinic_name)}`, { x: MARGIN_X + 20, size: 8, color: GRAY });
          y -= 12;
        }
        if (v.diagnosis) {
          // Diagnostico con word-wrap real: el texto completo se preserva
          // en multiples lineas en vez de truncarse con "..." (problema #3).
          drawWrappedText(`Diagnóstico: ${smartSentenceCase(v.diagnosis)}`, {
            x: MARGIN_X + 20,
            size: 8,
          });
        }
        y -= 4;
      });
    }

    // ── 6. DESPARASITACIONES ──
    // d.title       -> smartSentenceCase (texto libre)
    // d.description -> smartSentenceCase + drawWrappedText (texto libre largo)
    if (dewormings && dewormings.length > 0) {
      section(`6. Desparasitaciones (${dewormings.length})`);
      dewormings.slice(0, 10).forEach((d: any) => {
        ensureSpace(16);
        text(formatDate(d.date), { size: 8, font: bold, color: GRAY });
        text(smartSentenceCase(d.title) || 'Desparasitación', { x: MARGIN_X + 90, size: 9 });
        y -= 14;
        if (d.description) {
          drawWrappedText(smartSentenceCase(d.description), {
            x: MARGIN_X + 20,
            size: 8,
            color: GRAY,
          });
          y -= 2;
        }
      });
    }

    // ── FOOTER en todas las páginas ──
    const totalPages = pdfDoc.getPageCount();
    const allPages = pdfDoc.getPages();
    for (let i = 0; i < totalPages; i++) {
      const p = allPages[i];
      const footerY = 25;
      p.drawText(
        `Generado por Paw Friend · pawfriend.cl · ${new Date().toLocaleDateString('es-CL')}`,
        { x: MARGIN_X, y: footerY, size: 7, font: helvetica, color: GRAY }
      );
      p.drawText(`Página ${i + 1} de ${totalPages}`, {
        x: PAGE_W - MARGIN_X - 60,
        y: footerY,
        size: 7,
        font: helvetica,
        color: GRAY,
      });
    }

    // Generate and upload
    const pdfBytes = await pdfDoc.save();
    const fileName = `ficha-${pet.name?.replace(/\s+/g, '-').toLowerCase() || pet_id}-${Date.now()}.pdf`;
    const filePath = `summaries/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData, error: urlError } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(filePath, 3600);
    if (urlError) throw urlError;

    return new Response(
      JSON.stringify({ success: true, download_url: urlData.signedUrl, file_path: filePath }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error generating medical summary:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Error al generar la ficha. Intenta de nuevo.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
