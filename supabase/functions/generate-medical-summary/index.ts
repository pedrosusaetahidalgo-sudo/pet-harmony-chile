/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Edge Function: Generate Medical Summary PDF v2
 *
 * Genera un PDF profesional de la ficha clinica completa de una mascota.
 * Diseño: header con marca Paw Friend, secciones con borde lateral de color,
 * alertas clinicas destacadas, historial cronologico agrupado por categoria,
 * dieta/estilo de vida, y footer con codigo de verificacion.
 *
 * Bugs corregidos respecto a v1:
 * - sanitizeForWinAnsi ahora elimina TODOS los caracteres fuera de WinAnsi
 *   (emojis, CJK, simbolos Unicode exoticos) en vez de solo 4 reemplazos.
 * - CORS dinamico: acepta pawfriend.cl y localhost:8080 para dev.
 * - RPC actualizado (v2) incluye campos clinicos de migracion 20260402.
 * - Incluye TODOS los tipos de registro medico, no solo 3.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import { LOGO_PNG_BASE64 } from './logo.ts';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';

// ── CORS dinamico ──
const ALLOWED_ORIGINS = ['https://pawfriend.cl', 'http://localhost:8080', 'http://localhost:5173'];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// ── Paleta de colores (brand Paw Friend) ──
const BRAND_PURPLE = rgb(0.576, 0.2, 0.918); // #9333EA
const DARK_PURPLE = rgb(0.416, 0.227, 0.718); // #6A3AB7
const LIGHT_PURPLE = rgb(0.96, 0.94, 1.0); // #F5F0FF
const MED_GREEN = rgb(0.059, 0.6, 0.376); // #0F9960
const LIGHT_GREEN = rgb(0.94, 0.98, 0.96); // #F0FAF5
const ALERT_RED = rgb(0.839, 0.188, 0.192); // #D63031
const LIGHT_RED = rgb(1.0, 0.95, 0.95); // #FFF2F2
const AMBER = rgb(0.85, 0.55, 0.08); // #D98C14
const LIGHT_AMBER = rgb(1.0, 0.97, 0.92); // #FFF8EB
const TEXT_DARK = rgb(0.1, 0.1, 0.15); // #1A1A26
const TEXT_GRAY = rgb(0.35, 0.35, 0.4); // #595966
const TEXT_LIGHT = rgb(0.55, 0.55, 0.6); // #8C8C99
const BORDER_LIGHT = rgb(0.88, 0.88, 0.9); // #E0E0E6
const WHITE = rgb(1, 1, 1);
const ROW_ALT = rgb(0.975, 0.975, 0.98); // #F9F9FA

// ── Layout ──
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_L = 50;
const MARGIN_R = 50;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 512
const MARGIN_BOTTOM = 55;
const HEADER_H = 55;
const LOGO_SIZE = 32;
const SECTION_BORDER_W = 3;

// ── Logo embebido (base64 → Uint8Array, sin dependencia de red) ──
function getLogoBytes(): Uint8Array | null {
  try {
    const raw = atob(LOGO_PNG_BASE64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

// ── Verification code ──
async function generateVerificationCode(petId: string, timestamp: number): Promise<string> {
  const encoded = new TextEncoder().encode(`${petId}-${timestamp}`);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `PF-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

// =====================================================================
// Helpers de normalizacion tipografica
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
  'DEA',
]);

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
 * Sanitiza texto para WinAnsi (encoding de Helvetica en pdf-lib).
 * CRITICO: Elimina CUALQUIER caracter fuera del rango WinAnsi (0x20-0xFF)
 * incluyendo emojis, CJK, simbolos Unicode extendidos. Esto evita que
 * page.drawText() lance excepcion y crashee toda la edge function.
 */
function sanitizeForWinAnsi(s: string | null | undefined): string {
  if (s === null || s === undefined) return '';
  return (
    String(s)
      .replace(/\u2014/g, '-') // em-dash
      .replace(/\u2013/g, '-') // en-dash
      .replace(/[\u201C\u201D]/g, '"') // curly double quotes
      .replace(/[\u2018\u2019]/g, "'") // curly single quotes
      .replace(/\u2026/g, '...') // ellipsis
      .replace(/\u00A0/g, ' ') // nbsp
      // eslint-disable-next-line no-control-regex
      .replace(/[\x01-\x1F\x7F]/g, '') // control chars
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
  ); // strip anything outside WinAnsi
}

function smartSentenceCase(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  s = s.toLocaleLowerCase('es-CL');
  s = s.replace(
    /(^|[.!?]\s+|\n\s*)([\p{L}])/gu,
    (_m, sep, ch) => sep + ch.toLocaleUpperCase('es-CL')
  );
  s = s.replace(/\b([\p{L}]+)\b/gu, (match) => {
    const upper = match.toLocaleUpperCase('es-CL');
    return ACRONYMS.has(upper) ? upper : match;
  });
  return s;
}

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

function properNoun(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim();
  if (!s) return '';
  return s.charAt(0).toLocaleUpperCase('es-CL') + s.slice(1).toLocaleLowerCase('es-CL');
}

// ── Format helpers ──
function formatDate(d: string | null): string {
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
}

function calcAge(bd: string | null): string {
  if (!bd) return 'N/A';
  const ms = Date.now() - new Date(bd).getTime();
  const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) {
    const months = Math.floor(ms / (30.44 * 24 * 60 * 60 * 1000));
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  }
  return `${years} año${years !== 1 ? 's' : ''}`;
}

function genderLabel(g: string | null): string {
  if (!g) return 'N/A';
  const map: Record<string, string> = {
    macho: 'Macho',
    hembra: 'Hembra',
    desconocido: 'Desconocido',
  };
  return map[g.toLowerCase()] || smartSentenceCase(g);
}

function speciesLabel(s: string | null): string {
  if (!s) return 'N/A';
  const map: Record<string, string> = {
    perro: 'Perro',
    gato: 'Gato',
    otro: 'Otro',
  };
  return map[s.toLowerCase()] || smartSentenceCase(s);
}

/**
 * Detecta si `notes` es JSON (o contiene JSON) y lo convierte a texto legible.
 * Caso tipico: la escala de grimace felina guarda un objeto JSON con scores.
 * Si no es JSON, devuelve el texto tal cual.
 */
function humanizeNotes(raw: string): string {
  const trimmed = raw.trim();

  // Try to parse as JSON
  let parsed: any = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // Maybe JSON is embedded after some text — try extracting {...} or [...]
    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])\s*$/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
        // Return the text before JSON without the raw JSON
        const prefix = trimmed.slice(0, jsonMatch.index!).trim();
        if (prefix && parsed) {
          return prefix; // Drop the JSON, keep the human text
        }
      } catch {
        // Not valid JSON, return as-is
      }
    }
  }

  if (!parsed) return trimmed;

  // Handle pain grimace scale format
  if (parsed.assessment_type === 'pain_grimace_scale' || parsed.total_score !== undefined) {
    const parts: string[] = [];
    if (parsed.total_score !== undefined) parts.push(`Puntaje total: ${parsed.total_score}/10`);
    if (parsed.severity) parts.push(`Severidad: ${parsed.severity}`);
    if (parsed.species) parts.push(`Especie: ${parsed.species}`);
    if (parsed.details && Array.isArray(parsed.details)) {
      const detailParts = parsed.details
        .map((d: any) => `${d.label || d.id}: ${d.score} - ${d.description}`)
        .join('; ');
      if (detailParts) parts.push(detailParts);
    }
    return parts.join('. ');
  }

  // Generic object — skip raw JSON, return empty to suppress
  if (typeof parsed === 'object') return '';

  return trimmed;
}

/** Categoriza record_type en grupos para el PDF */
function categorizeRecord(type: string): string {
  const VACCINES = ['vacuna'];
  const CONSULTS = [
    'consulta',
    'consulta_general',
    'control_sano',
    'urgencia',
    'seguimiento',
    'segunda_opinion',
  ];
  const PROCEDURES = [
    'cirugia',
    'cirugía',
    'esterilizacion',
    'limpieza_dental',
    'ecografia',
    'rayos_x',
    'examen_sangre',
    'examen_orina',
  ];
  const TREATMENTS = ['tratamiento', 'quimioterapia', 'rehabilitacion', 'hospitalizacion'];
  const PREVENTIVE = ['desparasitacion', 'antipulgas'];

  if (VACCINES.includes(type)) return 'vaccines';
  if (CONSULTS.includes(type)) return 'consults';
  if (PROCEDURES.includes(type)) return 'procedures';
  if (TREATMENTS.includes(type)) return 'treatments';
  if (PREVENTIVE.includes(type)) return 'preventive';
  return 'other';
}

const CATEGORY_CONFIG: Record<string, { title: string; color: any; bg: any }> = {
  vaccines: { title: 'Vacunas', color: MED_GREEN, bg: LIGHT_GREEN },
  consults: { title: 'Consultas veterinarias', color: DARK_PURPLE, bg: LIGHT_PURPLE },
  procedures: { title: 'Procedimientos y examenes', color: AMBER, bg: LIGHT_AMBER },
  treatments: { title: 'Tratamientos', color: DARK_PURPLE, bg: LIGHT_PURPLE },
  preventive: { title: 'Cuidado preventivo', color: MED_GREEN, bg: LIGHT_GREEN },
  other: { title: 'Otros registros', color: TEXT_GRAY, bg: ROW_ALT },
};

// Orden de categorias en el PDF
const CATEGORY_ORDER = ['vaccines', 'consults', 'procedures', 'treatments', 'preventive', 'other'];

const CONFIDENTIALITY_NOTICE =
  'Este documento contiene informacion clinica sensible de la mascota identificada. Fue generado ' +
  'automaticamente por Paw Friend a partir de datos ingresados por el responsable y/o su veterinario. ' +
  'No reemplaza un informe clinico profesional ni tiene valor legal por si solo. ' +
  'Para consultas o verificacion: pawfriend.cl';

/** Max characters for a single record field to prevent PDF overflow */
const MAX_FIELD_CHARS = 300;

// =====================================================================
// PDF Builder — clase que encapsula la logica de cursor, paginacion,
// y helpers de dibujo para mantener el serve() limpio.
// =====================================================================

class PdfBuilder {
  doc: any;
  page: any;
  y: number;
  helvetica: any;
  bold: any;
  logoImage: any;
  pageCount = 0;

  constructor(doc: any, helvetica: any, bold: any, logoImage: any) {
    this.doc = doc;
    this.helvetica = helvetica;
    this.bold = bold;
    this.logoImage = logoImage;
    this.y = 0;
    this.page = null;
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    this.y = PAGE_H - 30;
    return this.page;
  }

  ensureSpace(needed: number) {
    if (!this.page || this.y < MARGIN_BOTTOM + needed) {
      this.newPage();
    }
  }

  // ── Drawing primitives ──

  drawText(
    t: string,
    opts: { x?: number; size?: number; font?: any; color?: any; maxWidth?: number }
  ) {
    const font = opts.font || this.helvetica;
    const size = opts.size || 9;
    const x = opts.x ?? MARGIN_L;
    const maxW = opts.maxWidth || PAGE_W - MARGIN_R - x;
    let display = sanitizeForWinAnsi(t);

    // Truncate if needed (single-line display)
    while (display.length > 3 && font.widthOfTextAtSize(display, size) > maxW) {
      display = display.slice(0, -4) + '...';
    }

    this.page.drawText(display, {
      x,
      y: this.y,
      size,
      font,
      color: opts.color || TEXT_DARK,
    });
  }

  drawWrapped(
    content: string,
    opts: {
      x?: number;
      maxWidth?: number;
      size?: number;
      font?: any;
      color?: any;
      lineHeight?: number;
    }
  ) {
    const font = opts.font || this.helvetica;
    const size = opts.size || 9;
    const x = opts.x ?? MARGIN_L;
    const maxW = opts.maxWidth || PAGE_W - MARGIN_R - x;
    const lh = opts.lineHeight || size * 1.4;
    const color = opts.color || TEXT_DARK;

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
        current = w;
      }
    }
    if (current) lines.push(current);

    for (const ln of lines) {
      this.ensureSpace(lh);
      this.page.drawText(ln, { x, y: this.y, size, font, color });
      this.y -= lh;
    }
  }

  drawLine(color = BORDER_LIGHT) {
    this.ensureSpace(10);
    this.page.drawLine({
      start: { x: MARGIN_L, y: this.y },
      end: { x: PAGE_W - MARGIN_R, y: this.y },
      thickness: 0.5,
      color,
    });
    this.y -= 8;
  }

  // ── Composed elements ──

  /** Header bar: purple rectangle + logo + title + date */
  drawHeader() {
    this.ensureSpace(HEADER_H + 20);

    // Purple header bar
    this.page.drawRectangle({
      x: 0,
      y: PAGE_H - HEADER_H,
      width: PAGE_W,
      height: HEADER_H,
      color: DARK_PURPLE,
    });

    // Thin accent line below header
    this.page.drawRectangle({
      x: 0,
      y: PAGE_H - HEADER_H - 2,
      width: PAGE_W,
      height: 2,
      color: BRAND_PURPLE,
    });

    const headerY = PAGE_H - HEADER_H + 15;

    // Logo
    let textX = MARGIN_L;
    if (this.logoImage) {
      try {
        this.page.drawImage(this.logoImage, {
          x: MARGIN_L,
          y: headerY - 2,
          width: LOGO_SIZE,
          height: LOGO_SIZE,
        });
        textX = MARGIN_L + LOGO_SIZE + 10;
      } catch {
        // fallback: no logo
      }
    }

    // Title
    this.page.drawText(sanitizeForWinAnsi('Paw Friend'), {
      x: textX,
      y: headerY + 15,
      size: 18,
      font: this.bold,
      color: WHITE,
    });
    this.page.drawText(sanitizeForWinAnsi('Ficha Clinica Veterinaria'), {
      x: textX,
      y: headerY,
      size: 10,
      font: this.helvetica,
      color: rgb(0.85, 0.82, 0.95),
    });

    // Date right-aligned
    const dateStr = new Date().toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const dateText = sanitizeForWinAnsi(`Generado: ${dateStr}`);
    const dateW = this.helvetica.widthOfTextAtSize(dateText, 8);
    this.page.drawText(dateText, {
      x: PAGE_W - MARGIN_R - dateW,
      y: headerY + 5,
      size: 8,
      font: this.helvetica,
      color: rgb(0.78, 0.75, 0.9),
    });

    this.y = PAGE_H - HEADER_H - 18;
  }

  /** Section header with colored left border and background */
  drawSectionHeader(title: string, color: any, bgColor: any, count?: number) {
    this.ensureSpace(35);
    this.y -= 10;

    const label = count !== undefined ? `${title} (${count})` : title;

    // Background rectangle
    this.page.drawRectangle({
      x: MARGIN_L,
      y: this.y - 4,
      width: CONTENT_W,
      height: 22,
      color: bgColor,
    });

    // Left border accent
    this.page.drawRectangle({
      x: MARGIN_L,
      y: this.y - 4,
      width: SECTION_BORDER_W,
      height: 22,
      color: color,
    });

    // Title text
    this.drawText(label, {
      x: MARGIN_L + 12,
      size: 11,
      font: this.bold,
      color: color,
    });

    this.y -= 22;
  }

  /** Two-column field row: label left, value right */
  drawField(label: string, value: string, opts?: { labelWidth?: number }) {
    this.ensureSpace(14);
    const lw = opts?.labelWidth || 130;
    this.drawText(label, { size: 8.5, font: this.bold, color: TEXT_GRAY });
    this.drawText(value, { x: MARGIN_L + lw, size: 9 });
    this.y -= 14;
  }

  /** Two fields side by side in a row */
  drawFieldPair(l1: string, v1: string, l2: string, v2: string) {
    this.ensureSpace(14);
    const col2X = MARGIN_L + CONTENT_W / 2;
    const lw = 110;

    // Column 1
    this.drawText(l1, { size: 8.5, font: this.bold, color: TEXT_GRAY });
    this.drawText(v1, { x: MARGIN_L + lw, size: 9, maxWidth: CONTENT_W / 2 - lw - 10 });

    // Column 2
    this.drawText(l2, { x: col2X, size: 8.5, font: this.bold, color: TEXT_GRAY });
    this.drawText(v2, { x: col2X + lw, size: 9, maxWidth: CONTENT_W / 2 - lw });

    this.y -= 14;
  }

  /** Small bullet item: "  - text" */
  drawBullet(text: string, opts?: { color?: any; indent?: number }) {
    this.ensureSpace(12);
    const x = opts?.indent ?? MARGIN_L + 14;
    this.drawText(`- ${text}`, { x, size: 8.5, color: opts?.color || TEXT_DARK });
    this.y -= 12;
  }

  /** Wrap a bullet with potentially long text */
  drawBulletWrapped(text: string, opts?: { color?: any; indent?: number }) {
    const x = opts?.indent ?? MARGIN_L + 14;
    this.drawWrapped(`- ${text}`, { x, size: 8.5, color: opts?.color || TEXT_DARK });
  }

  /** Draw a record entry (vaccine, consult, procedure, etc.) */
  drawRecordEntry(record: any, index: number) {
    this.ensureSpace(45);

    // Alternating row background — full width with padding
    if (index % 2 === 0) {
      this.page.drawRectangle({
        x: MARGIN_L + SECTION_BORDER_W,
        y: this.y + 4,
        width: CONTENT_W - SECTION_BORDER_W,
        height: 18,
        color: ROW_ALT,
      });
    }

    // Date column (left) — compact pill style
    const dateStr = formatDate(record.date);
    this.drawText(dateStr, {
      x: MARGIN_L + 10,
      size: 8,
      font: this.bold,
      color: TEXT_GRAY,
    });

    // Title / Reason
    const title =
      smartSentenceCase(record.reason || record.title) || smartSentenceCase(record.record_type);
    this.drawText(title, {
      x: MARGIN_L + 95,
      size: 9,
      font: this.bold,
    });
    this.y -= 15;

    // Vet + Clinic (if available)
    const vetClinicParts: string[] = [];
    if (record.veterinarian_name) vetClinicParts.push(titleCase(record.veterinarian_name));
    if (record.clinic_name) vetClinicParts.push(titleCase(record.clinic_name));
    if (vetClinicParts.length > 0) {
      this.drawText(vetClinicParts.join(' · '), {
        x: MARGIN_L + 95,
        size: 7.5,
        color: TEXT_LIGHT,
      });
      this.y -= 11;
    }

    // Diagnosis — with label in bold
    if (record.diagnosis) {
      this.ensureSpace(14);
      this.drawText('Diagnostico:', {
        x: MARGIN_L + 95,
        size: 8,
        font: this.bold,
        color: TEXT_GRAY,
      });
      this.y -= 10;
      const diagText = String(record.diagnosis).slice(0, MAX_FIELD_CHARS);
      this.drawWrapped(smartSentenceCase(diagText), {
        x: MARGIN_L + 108,
        size: 8,
        color: TEXT_DARK,
        maxWidth: CONTENT_W - 108,
      });
    }

    // Treatment — humanize if JSON
    if (record.treatment) {
      const treatmentStr =
        typeof record.treatment === 'string'
          ? record.treatment
          : typeof record.treatment === 'object'
            ? ''
            : JSON.stringify(record.treatment);
      if (treatmentStr) {
        this.ensureSpace(14);
        this.drawText('Tratamiento:', {
          x: MARGIN_L + 95,
          size: 8,
          font: this.bold,
          color: TEXT_GRAY,
        });
        this.y -= 10;
        this.drawWrapped(smartSentenceCase(treatmentStr.slice(0, MAX_FIELD_CHARS)), {
          x: MARGIN_L + 108,
          size: 8,
          color: TEXT_DARK,
          maxWidth: CONTENT_W - 108,
        });
      }
    }

    // Description (for vaccines and preventive — only if no diagnosis/treatment)
    if (record.description && !record.diagnosis && !record.treatment) {
      const descStr = typeof record.description === 'string' ? record.description : '';
      if (descStr) {
        this.drawWrapped(smartSentenceCase(descStr.slice(0, MAX_FIELD_CHARS)), {
          x: MARGIN_L + 95,
          size: 8,
          color: TEXT_GRAY,
          maxWidth: CONTENT_W - 95,
        });
      }
    }

    // Next date (for vaccines and preventive)
    if (record.next_date) {
      this.drawText(`Proxima fecha: ${formatDate(record.next_date)}`, {
        x: MARGIN_L + 95,
        size: 7.5,
        color: MED_GREEN,
        font: this.bold,
      });
      this.y -= 10;
    }

    // Notes — detect and humanize JSON (e.g. pain grimace scale)
    if (record.notes) {
      const notesStr =
        typeof record.notes === 'string' ? record.notes : JSON.stringify(record.notes);
      const humanized = humanizeNotes(notesStr);
      if (humanized) {
        this.ensureSpace(14);
        this.drawText('Nota:', {
          x: MARGIN_L + 95,
          size: 7.5,
          font: this.bold,
          color: TEXT_LIGHT,
        });
        this.y -= 9;
        this.drawWrapped(smartSentenceCase(humanized), {
          x: MARGIN_L + 108,
          size: 7.5,
          color: TEXT_LIGHT,
          maxWidth: CONTENT_W - 108,
        });
      }
    }

    this.y -= 6; // spacing between entries
  }

  /** Footer on all pages: verification code + pagination */
  drawFooters(verificationCode: string) {
    const total = this.doc.getPageCount();
    const allPages = this.doc.getPages();
    const footerSize = 7;
    const footerY = 20;

    for (let i = 0; i < total; i++) {
      const p = allPages[i];

      // Thin line above footer
      p.drawLine({
        start: { x: MARGIN_L, y: footerY + 12 },
        end: { x: PAGE_W - MARGIN_R, y: footerY + 12 },
        thickness: 0.5,
        color: BORDER_LIGHT,
      });

      // Footer text
      const footerText = sanitizeForWinAnsi(
        `${verificationCode}  |  Documento confidencial  |  pawfriend.cl  |  pag. ${i + 1} de ${total}`
      );
      const footerWidth = this.helvetica.widthOfTextAtSize(footerText, footerSize);
      p.drawText(footerText, {
        x: (PAGE_W - footerWidth) / 2,
        y: footerY,
        size: footerSize,
        font: this.helvetica,
        color: TEXT_LIGHT,
      });
    }
  }
}

// =====================================================================
// Main serve
// =====================================================================

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Auth ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error('User not authenticated');

    // ── Rate limit (5 req/min — PDF generation is heavy) ──
    const quota = await checkAiQuota(userData.user.id, { limit: 5, windowSeconds: 60 });
    if (!quota.allowed) {
      return rateLimitResponse(quota, corsHeaders);
    }

    const body = await req.json();
    const pet_id = body.pet_id;
    const mode = body.mode === 'complete' ? 'complete' : 'medical';
    const storeInStorage = body.store === true; // Only upload to storage when explicitly asked (for sharing)
    if (!pet_id || typeof pet_id !== 'string') throw new Error('pet_id is required');

    // ── Ownership / linked-vet check ──
    const { data: petOwnership, error: ownershipError } = await supabase
      .from('pets')
      .select('owner_id')
      .eq('id', pet_id)
      .single();

    if (ownershipError || !petOwnership) throw new Error('Pet not found');
    const isOwner = petOwnership.owner_id === userData.user.id;

    // Allow linked vets to generate PDF too
    let isLinkedVet = false;
    if (!isOwner) {
      const { data: providerRow } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      if (providerRow?.id) {
        const { data: link } = await supabase
          .from('pet_vet_links')
          .select('id')
          .eq('pet_id', pet_id)
          .eq('provider_id', providerRow.id)
          .eq('status', 'active')
          .maybeSingle();
        isLinkedVet = !!link;
      }
    }

    if (!isOwner && !isLinkedVet) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // ── Premium plan check: DESACTIVADO durante pivot médico ──
    // Reactivar cuando USER_PREMIUM=true en el frontend.
    // const { data: profileData } = await supabase
    //   .from('profiles').select('is_premium').eq('id', userData.user.id).single();
    // if (profileData?.is_premium !== true) {
    //   return new Response(
    //     JSON.stringify({ success: false, error: 'Exportar PDF requiere plan Premium' }),
    //     { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
    //   );
    // }

    // ── Fetch data via updated RPC (v4 supports mode) ──
    const { data: summaryData, error: summaryError } = await supabase.rpc(
      'get_medical_summary_data',
      { p_pet_id: pet_id, p_mode: mode }
    );
    if (summaryError) throw summaryError;
    if (!summaryData) throw new Error('No data found');

    const pet = summaryData.pet;
    const owner = summaryData.owner;
    const allRecords: any[] = summaryData.all_records || []; // Already ASC from v3 RPC
    const vetNotes: any[] = summaryData.vet_notes || [];
    const routines: any[] = summaryData.routines || [];

    // ══════════════════════════════════════════════════════════
    // BUILD PDF v3 — Chronological Timeline
    // ══════════════════════════════════════════════════════════

    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Logo
    const logoBytes = getLogoBytes();
    let logoImage: any = null;
    if (logoBytes) {
      try {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } catch {
        /* fallback */
      }
    }

    const verificationCode = await generateVerificationCode(pet_id, Date.now());

    const pdf = new PdfBuilder(pdfDoc, helvetica, bold, logoImage);

    // ── PAGE 1: Header ──
    pdf.newPage();
    pdf.drawHeader();

    // ── SECTION: Identificacion de la mascota ──
    pdf.drawSectionHeader('Identificacion de la mascota', DARK_PURPLE, LIGHT_PURPLE);
    pdf.y -= 4;

    const petName = properNoun(pet.name) || 'N/A';
    const petSpecies = speciesLabel(pet.species);
    const petBreed = pet.breed ? smartSentenceCase(pet.breed) : '';
    const speciesBreed = petBreed ? `${petSpecies} - ${petBreed}` : petSpecies;
    const petAge = calcAge(pet.birth_date);
    const ageDetail = pet.birth_date ? `${petAge} (nac. ${formatDate(pet.birth_date)})` : petAge;

    pdf.drawFieldPair('Nombre:', petName, 'Especie / Raza:', speciesBreed);
    pdf.drawFieldPair('Edad:', ageDetail, 'Peso:', pet.weight ? `${pet.weight} kg` : 'N/A');
    pdf.drawFieldPair(
      'Sexo:',
      genderLabel(pet.gender),
      'Esterilizado/a:',
      pet.neutered ? (pet.neutered_date ? `Si (${formatDate(pet.neutered_date)})` : 'Si') : 'No'
    );
    pdf.drawFieldPair(
      'Microchip:',
      pet.microchip_number || 'No registrado',
      'Grupo sanguineo:',
      pet.blood_type || 'No registrado'
    );
    if (pet.paw_card_id) {
      pdf.drawField('Paw Card ID:', pet.paw_card_id);
    }

    // ── SECTION: Responsable ──
    pdf.drawSectionHeader('Responsable', DARK_PURPLE, LIGHT_PURPLE);
    pdf.y -= 4;

    pdf.drawFieldPair(
      'Nombre:',
      titleCase(owner.display_name) || 'N/A',
      'Email:',
      owner.email || 'N/A'
    );
    if (pet.emergency_vet_name || pet.emergency_vet_phone) {
      pdf.drawFieldPair(
        'Vet emergencia:',
        titleCase(pet.emergency_vet_name) || 'N/A',
        'Tel. emergencia:',
        pet.emergency_vet_phone || 'N/A'
      );
    }
    if (pet.preferred_clinic) {
      pdf.drawField('Clinica preferida:', titleCase(pet.preferred_clinic));
    }
    if (pet.insurance_provider) {
      const insurance = pet.insurance_policy
        ? `${titleCase(pet.insurance_provider)} (poliza ${pet.insurance_policy})`
        : titleCase(pet.insurance_provider);
      pdf.drawField('Seguro:', insurance);
    }

    // ── SECTION: Alertas clinicas (solo si hay datos) ──
    const hasAllergiesFood = pet.allergies_food?.length > 0;
    const hasAllergiesMed = pet.allergies_medication?.length > 0;
    const hasAllergiesEnv = pet.allergies_environmental?.length > 0;
    const hasAllergiesLegacy = pet.allergies?.length > 0;
    const hasAnyAllergy =
      hasAllergiesFood || hasAllergiesMed || hasAllergiesEnv || hasAllergiesLegacy;

    const hasConditionsDetail = pet.chronic_conditions_detail?.length > 0;
    const hasConditionsLegacy = pet.chronic_conditions?.length > 0;
    const hasAnyCondition = hasConditionsDetail || hasConditionsLegacy;

    const hasMedications =
      Array.isArray(pet.current_medications) && pet.current_medications.length > 0;

    if (hasAnyAllergy || hasAnyCondition || hasMedications) {
      pdf.drawSectionHeader('Alertas clinicas', ALERT_RED, LIGHT_RED);
      pdf.y -= 4;

      if (hasAnyAllergy) {
        pdf.drawText('ALERGIAS', { size: 8.5, font: bold, color: ALERT_RED, x: MARGIN_L + 10 });
        pdf.y -= 12;

        if (hasAllergiesFood) {
          pdf.drawBullet(
            `Alimento: ${pet.allergies_food.map((a: string) => smartSentenceCase(a)).join(', ')}`,
            { color: TEXT_DARK }
          );
        }
        if (hasAllergiesMed) {
          pdf.drawBullet(
            `Medicamento: ${pet.allergies_medication.map((a: string) => smartSentenceCase(a)).join(', ')}`,
            { color: TEXT_DARK }
          );
        }
        if (hasAllergiesEnv) {
          pdf.drawBullet(
            `Ambiental: ${pet.allergies_environmental.map((a: string) => smartSentenceCase(a)).join(', ')}`,
            { color: TEXT_DARK }
          );
        }
        if (hasAllergiesLegacy && !hasAllergiesFood && !hasAllergiesMed && !hasAllergiesEnv) {
          pdf.drawBullet(pet.allergies.map((a: string) => smartSentenceCase(a)).join(', '), {
            color: TEXT_DARK,
          });
        }
        pdf.y -= 4;
      }

      if (hasAnyCondition) {
        pdf.drawText('CONDICIONES CRONICAS', {
          size: 8.5,
          font: bold,
          color: ALERT_RED,
          x: MARGIN_L + 10,
        });
        pdf.y -= 12;

        if (hasConditionsDetail) {
          for (const c of pet.chronic_conditions_detail) {
            const parts = [smartSentenceCase(c.condition || c.name || JSON.stringify(c))];
            if (c.diagnosed_date) parts.push(`desde ${formatDate(c.diagnosed_date)}`);
            if (c.severity) parts.push(smartSentenceCase(c.severity));
            pdf.drawBullet(parts.join(', '), { color: TEXT_DARK });
          }
        } else if (hasConditionsLegacy) {
          for (const c of pet.chronic_conditions) {
            pdf.drawBullet(smartSentenceCase(c), { color: TEXT_DARK });
          }
        }
        pdf.y -= 4;
      }

      if (hasMedications) {
        pdf.drawText('MEDICAMENTOS ACTUALES', {
          size: 8.5,
          font: bold,
          color: AMBER,
          x: MARGIN_L + 10,
        });
        pdf.y -= 12;

        for (const m of pet.current_medications) {
          const parts = [titleCase(m.name || 'Sin nombre')];
          if (m.dose) parts.push(m.dose);
          if (m.frequency) parts.push(smartSentenceCase(m.frequency));
          pdf.drawBullet(parts.join(' - '), { color: TEXT_DARK });
        }
        pdf.y -= 4;
      }
    }

    // ── HISTORIAL CLINICO CRONOLOGICO ──
    // Merge medical_records + vet_clinical_notes into a single chronological timeline (ASC)
    type TimelineEntry = {
      date: string;
      source: 'record' | 'vet_note';
      record_type: string;
      title: string;
      data: any;
    };

    const timeline: TimelineEntry[] = [];

    for (const r of allRecords) {
      timeline.push({
        date: r.date || '1900-01-01',
        source: 'record',
        record_type: r.record_type || 'otro',
        title: r.reason || r.title || r.record_type || '',
        data: r,
      });
    }

    for (const n of vetNotes) {
      timeline.push({
        date: n.consultation_date || '1900-01-01',
        source: 'vet_note',
        record_type: n.note_type || 'nota_vet',
        title: n.title || 'Nota clinica',
        data: n,
      });
    }

    // Sort ASC by date (oldest first)
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Type badge colors
    const TYPE_BADGE: Record<string, { label: string; color: any }> = {
      vacuna: { label: 'Vacuna', color: MED_GREEN },
      consulta: { label: 'Consulta', color: DARK_PURPLE },
      consulta_general: { label: 'Consulta', color: DARK_PURPLE },
      control_sano: { label: 'Control sano', color: DARK_PURPLE },
      urgencia: { label: 'Urgencia', color: ALERT_RED },
      seguimiento: { label: 'Seguimiento', color: DARK_PURPLE },
      segunda_opinion: { label: '2da opinion', color: DARK_PURPLE },
      cirugia: { label: 'Cirugia', color: AMBER },
      cirugía: { label: 'Cirugia', color: AMBER },
      esterilizacion: { label: 'Esterilizacion', color: AMBER },
      limpieza_dental: { label: 'Limpieza dental', color: AMBER },
      ecografia: { label: 'Ecografia', color: AMBER },
      rayos_x: { label: 'Rayos X', color: AMBER },
      examen_sangre: { label: 'Examen sangre', color: AMBER },
      examen_orina: { label: 'Examen orina', color: AMBER },
      tratamiento: { label: 'Tratamiento', color: DARK_PURPLE },
      quimioterapia: { label: 'Quimioterapia', color: AMBER },
      rehabilitacion: { label: 'Rehabilitacion', color: AMBER },
      hospitalizacion: { label: 'Hospitalizacion', color: ALERT_RED },
      desparasitacion: { label: 'Desparasitacion', color: MED_GREEN },
      antipulgas: { label: 'Antipulgas', color: MED_GREEN },
      nota_vet: { label: 'Nota Vet', color: BRAND_PURPLE },
    };

    // Header bar
    pdf.y -= 6;
    pdf.ensureSpace(30);
    pdf.page.drawRectangle({
      x: MARGIN_L,
      y: pdf.y - 1,
      width: CONTENT_W,
      height: 18,
      color: DARK_PURPLE,
    });
    pdf.drawText(`HISTORIAL CLINICO CRONOLOGICO (${timeline.length})`, {
      x: MARGIN_L + 10,
      size: 10,
      font: bold,
      color: WHITE,
    });
    pdf.y -= 18;

    if (timeline.length === 0) {
      pdf.ensureSpace(20);
      pdf.drawText('Sin registros medicos aun.', { size: 9, color: TEXT_LIGHT });
      pdf.y -= 14;
    } else {
      let lastYear = '';

      for (let i = 0; i < timeline.length; i++) {
        const entry = timeline[i];
        const entryDate = entry.date;
        const year = entryDate?.slice(0, 4) || '';

        // Year separator
        if (year && year !== lastYear) {
          lastYear = year;
          pdf.ensureSpace(22);
          pdf.y -= 6;
          // Draw year separator line
          const yearLabel = sanitizeForWinAnsi(`── ${year} ──`);
          const yearW = bold.widthOfTextAtSize(yearLabel, 9);
          const lineY = pdf.y + 4;
          pdf.page.drawLine({
            start: { x: MARGIN_L, y: lineY },
            end: { x: (PAGE_W - yearW) / 2 - 8, y: lineY },
            thickness: 0.5,
            color: BORDER_LIGHT,
          });
          pdf.page.drawText(yearLabel, {
            x: (PAGE_W - yearW) / 2,
            y: pdf.y,
            size: 9,
            font: bold,
            color: TEXT_GRAY,
          });
          pdf.page.drawLine({
            start: { x: (PAGE_W + yearW) / 2 + 8, y: lineY },
            end: { x: PAGE_W - MARGIN_R, y: lineY },
            thickness: 0.5,
            color: BORDER_LIGHT,
          });
          pdf.y -= 14;
        }

        // Alternating row background
        pdf.ensureSpace(45);
        if (i % 2 === 0) {
          pdf.page.drawRectangle({
            x: MARGIN_L,
            y: pdf.y + 4,
            width: CONTENT_W,
            height: 18,
            color: ROW_ALT,
          });
        }

        // Type badge (colored dot + label)
        const badge = TYPE_BADGE[entry.record_type] || {
          label: smartSentenceCase(entry.record_type),
          color: TEXT_GRAY,
        };

        // Date column (left)
        const dateStr = formatDate(entryDate);
        pdf.drawText(dateStr, {
          x: MARGIN_L + 6,
          size: 8,
          font: bold,
          color: TEXT_GRAY,
        });

        // Badge
        const badgeLabel = sanitizeForWinAnsi(badge.label);
        pdf.page.drawRectangle({
          x: MARGIN_L + 80,
          y: pdf.y - 2,
          width: bold.widthOfTextAtSize(badgeLabel, 7) + 8,
          height: 12,
          color: badge.color,
          borderColor: badge.color,
          borderWidth: 0,
        });
        pdf.page.drawText(badgeLabel, {
          x: MARGIN_L + 84,
          y: pdf.y,
          size: 7,
          font: bold,
          color: WHITE,
        });

        // Title
        const badgeEnd = MARGIN_L + 84 + bold.widthOfTextAtSize(badgeLabel, 7) + 14;
        const titleText = smartSentenceCase(entry.title) || smartSentenceCase(entry.record_type);
        pdf.drawText(titleText, {
          x: badgeEnd,
          size: 9,
          font: bold,
          maxWidth: PAGE_W - MARGIN_R - badgeEnd,
        });
        pdf.y -= 15;

        if (entry.source === 'record') {
          const r = entry.data;

          // Vet + Clinic
          const vetClinicParts: string[] = [];
          if (r.veterinarian_name) vetClinicParts.push(titleCase(r.veterinarian_name));
          if (r.clinic_name) vetClinicParts.push(titleCase(r.clinic_name));
          if (vetClinicParts.length > 0) {
            pdf.drawText(vetClinicParts.join(' · '), {
              x: MARGIN_L + 95,
              size: 7.5,
              color: TEXT_LIGHT,
            });
            pdf.y -= 11;
          }

          // Diagnosis
          if (r.diagnosis) {
            pdf.ensureSpace(14);
            pdf.drawText('Diagnostico:', {
              x: MARGIN_L + 95,
              size: 8,
              font: bold,
              color: TEXT_GRAY,
            });
            pdf.y -= 10;
            pdf.drawWrapped(smartSentenceCase(String(r.diagnosis).slice(0, MAX_FIELD_CHARS)), {
              x: MARGIN_L + 108,
              size: 8,
              color: TEXT_DARK,
              maxWidth: CONTENT_W - 108,
            });
          }

          // Treatment
          if (r.treatment) {
            const treatmentStr =
              typeof r.treatment === 'string'
                ? r.treatment
                : typeof r.treatment === 'object'
                  ? ''
                  : JSON.stringify(r.treatment);
            if (treatmentStr) {
              pdf.ensureSpace(14);
              pdf.drawText('Tratamiento:', {
                x: MARGIN_L + 95,
                size: 8,
                font: bold,
                color: TEXT_GRAY,
              });
              pdf.y -= 10;
              pdf.drawWrapped(smartSentenceCase(treatmentStr.slice(0, MAX_FIELD_CHARS)), {
                x: MARGIN_L + 108,
                size: 8,
                color: TEXT_DARK,
                maxWidth: CONTENT_W - 108,
              });
            }
          }

          // Description (for vaccines/preventive — only if no diagnosis/treatment)
          if (r.description && !r.diagnosis && !r.treatment) {
            const descStr = typeof r.description === 'string' ? r.description : '';
            if (descStr) {
              pdf.drawWrapped(smartSentenceCase(descStr.slice(0, MAX_FIELD_CHARS)), {
                x: MARGIN_L + 95,
                size: 8,
                color: TEXT_GRAY,
                maxWidth: CONTENT_W - 95,
              });
            }
          }

          // Batch/serial for vaccines
          if (r.batch_number || r.serial_number) {
            const lotParts: string[] = [];
            if (r.batch_number) lotParts.push(`Lote: ${r.batch_number}`);
            if (r.serial_number) lotParts.push(`Serie: ${r.serial_number}`);
            pdf.drawText(lotParts.join('  |  '), {
              x: MARGIN_L + 95,
              size: 7.5,
              color: TEXT_LIGHT,
            });
            pdf.y -= 10;
          }

          // Next date
          if (r.next_date) {
            pdf.drawText(`Proxima fecha: ${formatDate(r.next_date)}`, {
              x: MARGIN_L + 95,
              size: 7.5,
              color: MED_GREEN,
              font: bold,
            });
            pdf.y -= 10;
          }

          // Notes
          if (r.notes) {
            const notesStr = typeof r.notes === 'string' ? r.notes : JSON.stringify(r.notes);
            const humanized = humanizeNotes(notesStr);
            if (humanized) {
              pdf.ensureSpace(14);
              pdf.drawText('Nota:', {
                x: MARGIN_L + 95,
                size: 7.5,
                font: bold,
                color: TEXT_LIGHT,
              });
              pdf.y -= 9;
              pdf.drawWrapped(smartSentenceCase(humanized), {
                x: MARGIN_L + 108,
                size: 7.5,
                color: TEXT_LIGHT,
                maxWidth: CONTENT_W - 108,
              });
            }
          }
        } else {
          // Vet clinical note
          const n = entry.data;

          if (n.provider_name) {
            pdf.drawText(`Vet: ${titleCase(n.provider_name)}`, {
              x: MARGIN_L + 95,
              size: 7.5,
              color: BRAND_PURPLE,
            });
            pdf.y -= 11;
          }

          if (n.description) {
            pdf.drawWrapped(smartSentenceCase(String(n.description).slice(0, MAX_FIELD_CHARS)), {
              x: MARGIN_L + 95,
              size: 8,
              color: TEXT_DARK,
              maxWidth: CONTENT_W - 95,
            });
          }

          if (n.followup_required && n.followup_date) {
            pdf.drawText(
              `Seguimiento: ${formatDate(n.followup_date)}${n.followup_reason ? ' - ' + smartSentenceCase(n.followup_reason) : ''}`,
              {
                x: MARGIN_L + 95,
                size: 7.5,
                color: MED_GREEN,
                font: bold,
              }
            );
            pdf.y -= 10;
          }
        }

        pdf.y -= 6; // spacing between entries
      }
    }

    // ── SECTION: Resumen de vacunacion ──
    const vaccineRecords = allRecords.filter((r: any) => r.record_type === 'vacuna');
    if (vaccineRecords.length > 0) {
      pdf.drawSectionHeader('Resumen de vacunacion', MED_GREEN, LIGHT_GREEN, vaccineRecords.length);
      pdf.y -= 4;

      // Table header
      pdf.ensureSpace(16);
      const colVac = MARGIN_L + 10;
      const colDate = MARGIN_L + 200;
      const colLot = MARGIN_L + 290;
      const colNext = MARGIN_L + 390;

      pdf.drawText('Vacuna', { x: colVac, size: 8, font: bold, color: TEXT_GRAY });
      pdf.drawText('Fecha', { x: colDate, size: 8, font: bold, color: TEXT_GRAY });
      pdf.drawText('Lote/Serie', { x: colLot, size: 8, font: bold, color: TEXT_GRAY });
      pdf.drawText('Proximo ref.', { x: colNext, size: 8, font: bold, color: TEXT_GRAY });
      pdf.y -= 12;
      pdf.drawLine(BORDER_LIGHT);

      for (const v of vaccineRecords) {
        pdf.ensureSpace(14);
        pdf.drawText(smartSentenceCase(v.title || 'Vacuna'), { x: colVac, size: 8, maxWidth: 185 });
        pdf.drawText(formatDate(v.date), { x: colDate, size: 8 });
        const lot = [v.batch_number, v.serial_number].filter(Boolean).join('/');
        pdf.drawText(lot || '-', { x: colLot, size: 8 });
        pdf.drawText(v.next_date ? formatDate(v.next_date) : '-', {
          x: colNext,
          size: 8,
          color: v.next_date ? MED_GREEN : TEXT_LIGHT,
        });
        pdf.y -= 13;
      }
    }

    // ── SECTION: Peso historico ──
    const weightHistory: any[] = Array.isArray(pet.weight_history) ? pet.weight_history : [];
    if (weightHistory.length > 1) {
      pdf.drawSectionHeader('Peso historico', TEXT_GRAY, ROW_ALT, weightHistory.length);
      pdf.y -= 4;

      // Determine trend
      const first = parseFloat(weightHistory[0]?.weight) || 0;
      const last = parseFloat(weightHistory[weightHistory.length - 1]?.weight) || 0;
      const trend =
        last > first + 0.5
          ? 'Tendencia: subiendo'
          : last < first - 0.5
            ? 'Tendencia: bajando'
            : 'Tendencia: estable';
      pdf.drawText(trend, { x: MARGIN_L + 10, size: 8, color: TEXT_GRAY });
      pdf.y -= 14;

      // Table
      const colWDate = MARGIN_L + 10;
      const colWWeight = MARGIN_L + 150;
      pdf.drawText('Fecha', { x: colWDate, size: 8, font: bold, color: TEXT_GRAY });
      pdf.drawText('Peso (kg)', { x: colWWeight, size: 8, font: bold, color: TEXT_GRAY });
      pdf.y -= 12;
      pdf.drawLine(BORDER_LIGHT);

      for (const w of weightHistory) {
        pdf.ensureSpace(13);
        pdf.drawText(formatDate(w.date), { x: colWDate, size: 8 });
        pdf.drawText(String(w.weight), { x: colWWeight, size: 8 });
        pdf.y -= 12;
      }
    }

    // ── SECTION: Alimentacion y estilo de vida (solo si hay datos) ──
    const hasDiet = pet.diet_type || pet.diet_brand || pet.diet_frequency;
    const hasLifestyle = pet.activity_level || pet.living_environment || pet.behavior_notes;

    if (hasDiet || hasLifestyle) {
      pdf.drawSectionHeader('Alimentacion y estilo de vida', TEXT_GRAY, ROW_ALT);
      pdf.y -= 4;

      if (hasDiet) {
        const dietParts: string[] = [];
        if (pet.diet_type) dietParts.push(`Tipo: ${smartSentenceCase(pet.diet_type)}`);
        if (pet.diet_brand) dietParts.push(`Marca: ${titleCase(pet.diet_brand)}`);
        if (pet.diet_frequency)
          dietParts.push(`Frecuencia: ${smartSentenceCase(pet.diet_frequency)}`);
        pdf.drawWrapped(dietParts.join('  |  '), { x: MARGIN_L + 10, size: 8.5 });
        pdf.y -= 2;
      }

      if (pet.activity_level) {
        pdf.drawField('Nivel actividad:', smartSentenceCase(pet.activity_level), {
          labelWidth: 110,
        });
      }
      if (pet.living_environment) {
        pdf.drawField('Ambiente:', smartSentenceCase(pet.living_environment), { labelWidth: 110 });
      }
      if (pet.behavior_notes) {
        pdf.drawText('Notas de comportamiento:', { size: 8.5, font: bold, color: TEXT_GRAY });
        pdf.y -= 12;
        pdf.drawWrapped(smartSentenceCase(pet.behavior_notes), {
          x: MARGIN_L + 10,
          size: 8.5,
          color: TEXT_GRAY,
        });
      }
    }

    // ── Routines section (complete mode only) ──
    if (mode === 'complete' && routines.length > 0) {
      pdf.y -= 16;
      pdf.drawSectionHeader('Rutinas activas', MED_GREEN);

      const DAYS = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];
      for (const routine of routines) {
        pdf.checkNewPage();
        const daysStr = (routine.days_of_week || []).map((d: number) => DAYS[d] || '?').join(', ');
        const time = routine.time_of_day ? routine.time_of_day.slice(0, 5) : '';
        const duration = routine.duration_minutes ? `${routine.duration_minutes}min` : '';
        const category = routine.category ? `[${routine.category}]` : '';

        pdf.drawText(`${routine.title || 'Sin titulo'} ${category}`, {
          size: 9,
          font: bold,
          color: TEXT_DARK,
        });
        pdf.y -= 12;
        pdf.drawText(`${daysStr}  ${time}  ${duration}`.trim(), {
          size: 8,
          color: TEXT_GRAY,
          x: MARGIN_L + 10,
        });
        pdf.y -= 14;
      }
    }

    // ── Confidentiality notice ──
    pdf.y -= 12;
    pdf.drawLine();
    pdf.drawWrapped(CONFIDENTIALITY_NOTICE, {
      size: 7,
      color: TEXT_LIGHT,
      lineHeight: 9,
    });

    // ── Footer on all pages ──
    pdf.drawFooters(verificationCode);

    // ── Generate PDF bytes ──
    const pdfBytes = await pdfDoc.save();
    const safeName = (pet.name || 'mascota')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    const fileName = `ficha-${safeName}-${Date.now()}.pdf`;

    // If store=true (for sharing), upload to storage and return signed URL
    if (storeInStorage) {
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
    }

    // Default: return PDF bytes directly (faster, no ugly URL)
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error generating medical summary:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al generar la ficha. Intenta de nuevo.',
        detail: error?.message || String(error),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
