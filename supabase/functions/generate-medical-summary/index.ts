/**
 * Edge Function: Generate Medical Summary PDF — v3 (2026-04-19)
 *
 * Rediseño completo del PDF de la ficha clínica:
 *  - Portada ejecutiva (nombre pet grande + vitales + alertas críticas)
 *  - Header compacto en páginas subsecuentes (logo + nombre + paginación)
 *  - Timeline cronológica agrupada por año con separadores elegantes
 *  - Tablas de vacunación y peso con bordes y encabezado en banda
 *  - Watermark diagonal en documentos compartidos públicamente
 *  - Footer con URL de verificación (pawfriend.cl/verify/PF-XXXX-XXXX)
 *  - Paleta más suave, tipografía con jerarquía clara (28/18/12/10/9/7.5)
 *
 * Mantiene contrato de API intacto: mismo body { pet_id, mode, store?, token? },
 * misma auth (user JWT o share token) y misma respuesta (Blob PDF o signed URL).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  PDFImage,
  rgb,
  degrees,
  StandardFonts,
  type RGB,
} from 'https://esm.sh/pdf-lib@1.17.1';
import { LOGO_PNG_BASE64 } from './logo.ts';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

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

// =====================================================================
// Theme — paleta + tipografía unificada
// =====================================================================

const PURPLE = rgb(0.486, 0.227, 0.929); // #7C3AED primary
const PURPLE_DARK = rgb(0.361, 0.094, 0.812); // #5B18CF
const PURPLE_SOFT = rgb(0.953, 0.941, 0.996); // #F4F0FE bg muy suave
const ROSE = rgb(0.882, 0.114, 0.282); // #E11D48 alertas
const ROSE_SOFT = rgb(0.996, 0.949, 0.957); // #FEF2F3
const GREEN = rgb(0.022, 0.588, 0.412); // #059669 preventivo/vacunas
const GREEN_SOFT = rgb(0.945, 0.988, 0.969); // #F1FCF7
const AMBER = rgb(0.851, 0.467, 0.024); // #D97706 procedimientos
const AMBER_SOFT = rgb(0.996, 0.969, 0.925); // #FEF7EC
const TEXT_DARK = rgb(0.122, 0.161, 0.216); // #1F2937
const TEXT_BODY = rgb(0.282, 0.337, 0.408); // #485568
const TEXT_MUTED = rgb(0.42, 0.447, 0.502); // #6B7280
const TEXT_FAINT = rgb(0.612, 0.639, 0.686); // #9CA3AF
const BORDER = rgb(0.898, 0.906, 0.922); // #E5E7EB
const BORDER_STRONG = rgb(0.82, 0.835, 0.859); // #D1D5DB
const SURFACE = rgb(0.976, 0.98, 0.984); // #F9FAFB
const WHITE = rgb(1, 1, 1);

// ── Layout ──
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_L = 48;
const MARGIN_R = 48;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 516
const MARGIN_BOTTOM = 60;

// ── Tipografía (jerarquía explícita) ──
const FS_HERO = 30;
const FS_H1 = 16;
const FS_H2 = 11;
const FS_H3 = 9;
const FS_BODY = 9;
const FS_SMALL = 8;
const FS_TINY = 7;
const FS_FOOTER = 7;

// =====================================================================
// Logo + verification code
// =====================================================================

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
// Normalización tipográfica
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
 * Elimina CUALQUIER caracter fuera del rango WinAnsi (emojis, CJK, etc).
 */
function sanitizeForWinAnsi(s: string | null | undefined): string {
  if (s === null || s === undefined) return '';
  return (
    String(s)
      .replace(/\u2014/g, '-')
      .replace(/\u2013/g, '-')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2026/g, '...')
      .replace(/\u00A0/g, ' ')
      // eslint-disable-next-line no-control-regex
      .replace(/[\x01-\x1F\x7F]/g, '')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
  );
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

function formatDateLong(d: string | null): string {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
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
 * Detecta si `notes` es JSON (ej. pain grimace scale) y lo convierte a texto legible.
 */
function humanizeNotes(raw: string): string {
  const trimmed = raw.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = null;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])\s*$/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
        const prefix = trimmed.slice(0, jsonMatch.index!).trim();
        if (prefix && parsed) return prefix;
      } catch {
        /* no-op */
      }
    }
  }

  if (!parsed) return trimmed;

  if (parsed.assessment_type === 'pain_grimace_scale' || parsed.total_score !== undefined) {
    const parts: string[] = [];
    if (parsed.total_score !== undefined) parts.push(`Puntaje total: ${parsed.total_score}/10`);
    if (parsed.severity) parts.push(`Severidad: ${parsed.severity}`);
    if (parsed.species) parts.push(`Especie: ${parsed.species}`);
    if (parsed.details && Array.isArray(parsed.details)) {
      const detailParts = parsed.details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((d: any) => `${d.label || d.id}: ${d.score} - ${d.description}`)
        .join('; ');
      if (detailParts) parts.push(detailParts);
    }
    return parts.join('. ');
  }

  if (typeof parsed === 'object') return '';

  return trimmed;
}

// =====================================================================
// Badges y categorías
// =====================================================================

const TYPE_BADGE: Record<string, { label: string; color: RGB }> = {
  vacuna: { label: 'Vacuna', color: GREEN },
  consulta: { label: 'Consulta', color: PURPLE },
  consulta_general: { label: 'Consulta', color: PURPLE },
  control_sano: { label: 'Control sano', color: PURPLE },
  urgencia: { label: 'Urgencia', color: ROSE },
  seguimiento: { label: 'Seguimiento', color: PURPLE },
  segunda_opinion: { label: '2da opinion', color: PURPLE },
  cirugia: { label: 'Cirugia', color: AMBER },
  cirugía: { label: 'Cirugia', color: AMBER },
  esterilizacion: { label: 'Esterilizacion', color: AMBER },
  limpieza_dental: { label: 'Limpieza dental', color: AMBER },
  ecografia: { label: 'Ecografia', color: AMBER },
  rayos_x: { label: 'Rayos X', color: AMBER },
  examen_sangre: { label: 'Examen sangre', color: AMBER },
  examen_orina: { label: 'Examen orina', color: AMBER },
  tratamiento: { label: 'Tratamiento', color: PURPLE },
  quimioterapia: { label: 'Quimioterapia', color: AMBER },
  rehabilitacion: { label: 'Rehabilitacion', color: AMBER },
  hospitalizacion: { label: 'Hospitalizacion', color: ROSE },
  desparasitacion: { label: 'Desparasitacion', color: GREEN },
  antipulgas: { label: 'Antipulgas', color: GREEN },
  nota_vet: { label: 'Nota clinica', color: PURPLE_DARK },
};

const CONFIDENTIALITY_NOTICE =
  'Este documento contiene informacion clinica sensible de la mascota identificada. ' +
  'Fue generado automaticamente por Paw Friend a partir de datos ingresados por el responsable y/o su veterinario. ' +
  'No reemplaza un informe clinico profesional ni tiene valor legal por si solo.';

/** Max chars per field to prevent PDF overflow */
const MAX_FIELD_CHARS = 300;

// =====================================================================
// PDF Builder
// =====================================================================

class PdfBuilder {
  doc: PDFDocument;
  page: PDFPage | null;
  y: number;
  helvetica: PDFFont;
  bold: PDFFont;
  logoImage: PDFImage | null;
  petNameForHeader: string;
  pageCount = 0;

  constructor(doc: PDFDocument, helvetica: PDFFont, bold: PDFFont, logoImage: PDFImage | null) {
    this.doc = doc;
    this.helvetica = helvetica;
    this.bold = bold;
    this.logoImage = logoImage;
    this.y = 0;
    this.page = null;
    this.petNameForHeader = '';
  }

  /** Página nueva con header compacto (o sin header en la portada) */
  newPage(withHeader = true) {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    this.y = PAGE_H - 30;
    if (withHeader && this.pageCount > 1) this.drawCompactHeader();
    return this.page;
  }

  ensureSpace(needed: number) {
    if (!this.page || this.y < MARGIN_BOTTOM + needed) {
      this.newPage();
    }
  }

  // ── Primitivas ──

  drawText(
    t: string,
    opts: { x?: number; size?: number; font?: PDFFont; color?: RGB; maxWidth?: number; y?: number }
  ) {
    const font = opts.font || this.helvetica;
    const size = opts.size || FS_BODY;
    const x = opts.x ?? MARGIN_L;
    const y = opts.y ?? this.y;
    const maxW = opts.maxWidth || PAGE_W - MARGIN_R - x;
    let display = sanitizeForWinAnsi(t);

    while (display.length > 3 && font.widthOfTextAtSize(display, size) > maxW) {
      display = display.slice(0, -4) + '...';
    }

    this.page!.drawText(display, {
      x,
      y,
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
      font?: PDFFont;
      color?: RGB;
      lineHeight?: number;
    }
  ) {
    const font = opts.font || this.helvetica;
    const size = opts.size || FS_BODY;
    const x = opts.x ?? MARGIN_L;
    const maxW = opts.maxWidth || PAGE_W - MARGIN_R - x;
    const lh = opts.lineHeight || size * 1.45;
    const color = opts.color || TEXT_BODY;

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
      this.page!.drawText(ln, { x, y: this.y, size, font, color });
      this.y -= lh;
    }
  }

  drawRule(color: RGB = BORDER, thickness = 0.5) {
    this.ensureSpace(10);
    this.page!.drawLine({
      start: { x: MARGIN_L, y: this.y },
      end: { x: PAGE_W - MARGIN_R, y: this.y },
      thickness,
      color,
    });
    this.y -= 8;
  }

  // ── Header compacto (páginas 2+) ──
  drawCompactHeader() {
    const yTop = PAGE_H - 24;

    // Logo mini
    let xLeft = MARGIN_L;
    if (this.logoImage) {
      try {
        this.page!.drawImage(this.logoImage, {
          x: MARGIN_L,
          y: yTop - 14,
          width: 16,
          height: 16,
        });
        xLeft = MARGIN_L + 22;
      } catch {
        /* noop */
      }
    }

    // Título: "Paw Friend · Ficha clínica — {Nombre}"
    const title = `Paw Friend  ·  Ficha clinica${this.petNameForHeader ? '  -  ' + this.petNameForHeader : ''}`;
    this.drawText(title, {
      x: xLeft,
      y: yTop - 9,
      size: FS_TINY,
      font: this.bold,
      color: TEXT_MUTED,
    });

    // Rule sutil bajo header
    this.page!.drawLine({
      start: { x: MARGIN_L, y: yTop - 22 },
      end: { x: PAGE_W - MARGIN_R, y: yTop - 22 },
      thickness: 0.4,
      color: BORDER,
    });

    this.y = yTop - 36;
  }

  // ── Portada ──
  drawCover(
    petName: string,
    subtitle: string,
    paws: { label: string; value: string }[],
    verificationCode: string,
    generatedAt: string
  ) {
    // Banner púrpura suave arriba
    this.page!.drawRectangle({
      x: 0,
      y: PAGE_H - 120,
      width: PAGE_W,
      height: 120,
      color: PURPLE_SOFT,
    });

    // Línea acento
    this.page!.drawRectangle({
      x: 0,
      y: PAGE_H - 124,
      width: PAGE_W,
      height: 4,
      color: PURPLE,
    });

    // Logo (si existe)
    let logoEndX = MARGIN_L;
    if (this.logoImage) {
      try {
        this.page!.drawImage(this.logoImage, {
          x: MARGIN_L,
          y: PAGE_H - 88,
          width: 48,
          height: 48,
        });
        logoEndX = MARGIN_L + 60;
      } catch {
        /* noop */
      }
    }

    // Marca + subtítulo
    this.drawText('Paw Friend', {
      x: logoEndX,
      y: PAGE_H - 55,
      size: FS_H1,
      font: this.bold,
      color: PURPLE_DARK,
    });
    this.drawText('Ficha clinica veterinaria', {
      x: logoEndX,
      y: PAGE_H - 72,
      size: FS_H3,
      color: TEXT_MUTED,
    });
    this.drawText(`Generado: ${generatedAt}`, {
      x: logoEndX,
      y: PAGE_H - 86,
      size: FS_TINY,
      color: TEXT_FAINT,
    });

    // Código de verificación en esquina superior derecha
    const codeLabel = sanitizeForWinAnsi(verificationCode);
    const codeW = this.bold.widthOfTextAtSize(codeLabel, FS_H3);
    this.page!.drawRectangle({
      x: PAGE_W - MARGIN_R - codeW - 16,
      y: PAGE_H - 80,
      width: codeW + 16,
      height: 20,
      color: PURPLE,
    });
    this.page!.drawText(codeLabel, {
      x: PAGE_W - MARGIN_R - codeW - 8,
      y: PAGE_H - 74,
      size: FS_H3,
      font: this.bold,
      color: WHITE,
    });

    // ── Bloque hero: nombre mascota enorme ──
    this.y = PAGE_H - 170;
    this.drawText(petName, {
      x: MARGIN_L,
      y: this.y,
      size: FS_HERO,
      font: this.bold,
      color: TEXT_DARK,
      maxWidth: CONTENT_W,
    });
    this.y -= 38;

    // Subtítulo (especie · raza)
    this.drawText(subtitle, {
      x: MARGIN_L,
      y: this.y,
      size: FS_H2,
      color: TEXT_BODY,
      maxWidth: CONTENT_W,
    });
    this.y -= 24;

    // ── Vitals grid (2 columnas, 4 filas) ──
    const vitalsBoxY = this.y - 10;
    const vitalsH = Math.ceil(paws.length / 2) * 36 + 20;
    this.page!.drawRectangle({
      x: MARGIN_L,
      y: vitalsBoxY - vitalsH + 10,
      width: CONTENT_W,
      height: vitalsH,
      color: SURFACE,
      borderColor: BORDER,
      borderWidth: 0.5,
    });

    const colW = CONTENT_W / 2;
    let cursorY = vitalsBoxY - 8;
    for (let i = 0; i < paws.length; i++) {
      const col = i % 2;
      const x = MARGIN_L + 16 + col * colW;

      // Label
      this.drawText(paws[i].label.toUpperCase(), {
        x,
        y: cursorY,
        size: FS_TINY,
        font: this.bold,
        color: TEXT_FAINT,
      });
      // Valor
      this.drawText(paws[i].value, {
        x,
        y: cursorY - 13,
        size: FS_H3,
        color: TEXT_DARK,
        maxWidth: colW - 20,
      });

      if (col === 1 || i === paws.length - 1) cursorY -= 32;
    }

    this.y = vitalsBoxY - vitalsH - 2;
  }

  // ── Alerta card (rojo/amarillo según severidad) ──
  drawAlertCard(title: string, lines: string[], opts: { tone: 'danger' | 'warning' }) {
    if (lines.length === 0) return;

    const accent = opts.tone === 'danger' ? ROSE : AMBER;
    const bg = opts.tone === 'danger' ? ROSE_SOFT : AMBER_SOFT;

    this.ensureSpace(30 + lines.length * 13);
    this.y -= 12;

    const cardH = 24 + lines.length * 13;

    // Fondo del card
    this.page!.drawRectangle({
      x: MARGIN_L,
      y: this.y - cardH + 14,
      width: CONTENT_W,
      height: cardH,
      color: bg,
    });
    // Borde izquierdo
    this.page!.drawRectangle({
      x: MARGIN_L,
      y: this.y - cardH + 14,
      width: 3,
      height: cardH,
      color: accent,
    });

    // Título
    this.drawText(title.toUpperCase(), {
      x: MARGIN_L + 14,
      size: FS_TINY,
      font: this.bold,
      color: accent,
    });
    this.y -= 14;

    // Items
    for (const ln of lines) {
      this.drawText(`• ${ln}`, {
        x: MARGIN_L + 14,
        size: FS_SMALL,
        color: TEXT_DARK,
        maxWidth: CONTENT_W - 20,
      });
      this.y -= 12;
    }
    this.y -= 6;
  }

  // ── Section header con acento ──
  drawSectionHeader(title: string, count?: number, accent: RGB = PURPLE) {
    this.ensureSpace(40);
    this.y -= 14;

    const label = count !== undefined ? `${title}  (${count})` : title;

    // Barra acento izquierda
    this.page!.drawRectangle({
      x: MARGIN_L,
      y: this.y - 2,
      width: 3,
      height: 18,
      color: accent,
    });

    // Título
    this.drawText(label, {
      x: MARGIN_L + 12,
      size: FS_H1,
      font: this.bold,
      color: TEXT_DARK,
    });

    this.y -= 24;
  }

  // ── Key-value pair compacto ──
  drawKV(label: string, value: string, opts?: { xCol?: number; labelW?: number }) {
    const x = opts?.xCol ?? MARGIN_L;
    const lw = opts?.labelW ?? 100;
    this.drawText(label, {
      x,
      size: FS_SMALL,
      font: this.bold,
      color: TEXT_MUTED,
    });
    this.drawText(value, {
      x: x + lw,
      size: FS_BODY,
      color: TEXT_DARK,
      maxWidth: CONTENT_W - lw,
    });
    this.y -= 14;
  }

  // ── Tabla con bordes ──
  drawTable(
    headers: string[],
    rows: string[][],
    columnWidths: number[],
    opts?: { rowHeight?: number; headColor?: RGB }
  ) {
    const rh = opts?.rowHeight ?? 16;
    const headBg = opts?.headColor ?? PURPLE_SOFT;
    const totalW = columnWidths.reduce((a, b) => a + b, 0);

    // Header
    this.ensureSpace(rh);
    this.page!.drawRectangle({
      x: MARGIN_L,
      y: this.y - 3,
      width: totalW,
      height: rh,
      color: headBg,
    });
    let x = MARGIN_L;
    for (let i = 0; i < headers.length; i++) {
      this.drawText(headers[i], {
        x: x + 6,
        size: FS_TINY,
        font: this.bold,
        color: PURPLE_DARK,
      });
      x += columnWidths[i];
    }
    this.y -= rh;

    // Rows
    for (let r = 0; r < rows.length; r++) {
      this.ensureSpace(rh);
      // Row border top (línea fina)
      this.page!.drawLine({
        start: { x: MARGIN_L, y: this.y + rh - 3 },
        end: { x: MARGIN_L + totalW, y: this.y + rh - 3 },
        thickness: 0.3,
        color: BORDER,
      });

      let cx = MARGIN_L;
      for (let c = 0; c < rows[r].length; c++) {
        this.drawText(rows[r][c] || '-', {
          x: cx + 6,
          size: FS_SMALL,
          color: c === 0 ? TEXT_DARK : TEXT_BODY,
          maxWidth: columnWidths[c] - 12,
        });
        cx += columnWidths[c];
      }
      this.y -= rh;
    }

    // Borde inferior
    this.page!.drawLine({
      start: { x: MARGIN_L, y: this.y + rh - 3 },
      end: { x: MARGIN_L + totalW, y: this.y + rh - 3 },
      thickness: 0.5,
      color: BORDER_STRONG,
    });
    this.y -= 4;
  }

  // ── Footer por página con URL verificable ──
  drawFooters(verificationCode: string) {
    const total = this.doc.getPageCount();
    const allPages = this.doc.getPages();
    const footerY = 24;

    for (let i = 0; i < total; i++) {
      const p = allPages[i];

      // Línea sutil sobre footer
      p.drawLine({
        start: { x: MARGIN_L, y: footerY + 16 },
        end: { x: PAGE_W - MARGIN_R, y: footerY + 16 },
        thickness: 0.3,
        color: BORDER,
      });

      // Col izquierda: código
      const leftText = sanitizeForWinAnsi(`${verificationCode}  ·  Verificar en pawfriend.cl`);
      p.drawText(leftText, {
        x: MARGIN_L,
        y: footerY,
        size: FS_FOOTER,
        font: this.helvetica,
        color: TEXT_MUTED,
      });

      // Col centro: confidencial
      const confText = sanitizeForWinAnsi('Documento confidencial');
      const confW = this.helvetica.widthOfTextAtSize(confText, FS_FOOTER);
      p.drawText(confText, {
        x: (PAGE_W - confW) / 2,
        y: footerY,
        size: FS_FOOTER,
        font: this.helvetica,
        color: TEXT_FAINT,
      });

      // Col derecha: paginación
      const pageText = sanitizeForWinAnsi(`${i + 1} / ${total}`);
      const pageW = this.bold.widthOfTextAtSize(pageText, FS_FOOTER);
      p.drawText(pageText, {
        x: PAGE_W - MARGIN_R - pageW,
        y: footerY,
        size: FS_FOOTER,
        font: this.bold,
        color: TEXT_MUTED,
      });
    }
  }

  // ── Watermark diagonal (solo en share access) ──
  drawWatermarkAll(label: string) {
    const all = this.doc.getPages();
    for (const p of all) {
      const text = sanitizeForWinAnsi(label);
      const size = 60;
      const w = this.bold.widthOfTextAtSize(text, size);
      p.drawText(text, {
        x: (PAGE_W - w * 0.7) / 2,
        y: PAGE_H / 2,
        size,
        font: this.bold,
        color: rgb(0.9, 0.9, 0.92),
        rotate: degrees(-30),
        opacity: 0.35,
      });
    }
  }

  // ── Timeline entry (usado en historial clinico) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drawTimelineEntry(entry: {
    date: string;
    record_type: string;
    title: string;
    source: 'record' | 'vet_note';
    data: any;
  }) {
    this.ensureSpace(42);

    const badge = TYPE_BADGE[entry.record_type] || {
      label: smartSentenceCase(entry.record_type),
      color: TEXT_MUTED,
    };

    // Date (fija a la izquierda)
    this.drawText(formatDate(entry.date), {
      x: MARGIN_L,
      size: FS_SMALL,
      font: this.bold,
      color: TEXT_MUTED,
    });

    // Badge tipo
    const badgeLabel = sanitizeForWinAnsi(badge.label);
    const badgeW = this.bold.widthOfTextAtSize(badgeLabel, FS_TINY) + 10;
    this.page!.drawRectangle({
      x: MARGIN_L + 70,
      y: this.y - 2,
      width: badgeW,
      height: 12,
      color: badge.color,
    });
    this.page!.drawText(badgeLabel, {
      x: MARGIN_L + 75,
      y: this.y + 1,
      size: FS_TINY,
      font: this.bold,
      color: WHITE,
    });

    // Título
    const titleStartX = MARGIN_L + 70 + badgeW + 8;
    const titleText = smartSentenceCase(entry.title) || smartSentenceCase(entry.record_type);
    this.drawText(titleText, {
      x: titleStartX,
      size: FS_H3,
      font: this.bold,
      color: TEXT_DARK,
      maxWidth: PAGE_W - MARGIN_R - titleStartX,
    });
    this.y -= 14;

    const bodyX = MARGIN_L + 70;
    const bodyMaxW = CONTENT_W - 70;

    if (entry.source === 'record') {
      const r = entry.data;

      // Vet + clínica
      const vetClinic: string[] = [];
      if (r.veterinarian_name) vetClinic.push(titleCase(r.veterinarian_name));
      if (r.clinic_name) vetClinic.push(titleCase(r.clinic_name));
      if (vetClinic.length > 0) {
        this.drawText(vetClinic.join('  ·  '), {
          x: bodyX,
          size: FS_TINY,
          color: TEXT_FAINT,
        });
        this.y -= 11;
      }

      // Diagnóstico
      if (r.diagnosis) {
        this.ensureSpace(14);
        this.drawText('Diagnostico', {
          x: bodyX,
          size: FS_TINY,
          font: this.bold,
          color: TEXT_MUTED,
        });
        this.y -= 10;
        this.drawWrapped(smartSentenceCase(String(r.diagnosis).slice(0, MAX_FIELD_CHARS)), {
          x: bodyX + 10,
          size: FS_SMALL,
          color: TEXT_BODY,
          maxWidth: bodyMaxW - 10,
        });
      }

      // Tratamiento
      if (r.treatment) {
        const tStr =
          typeof r.treatment === 'string'
            ? r.treatment
            : typeof r.treatment === 'object'
              ? ''
              : JSON.stringify(r.treatment);
        if (tStr) {
          this.ensureSpace(14);
          this.drawText('Tratamiento', {
            x: bodyX,
            size: FS_TINY,
            font: this.bold,
            color: TEXT_MUTED,
          });
          this.y -= 10;
          this.drawWrapped(smartSentenceCase(tStr.slice(0, MAX_FIELD_CHARS)), {
            x: bodyX + 10,
            size: FS_SMALL,
            color: TEXT_BODY,
            maxWidth: bodyMaxW - 10,
          });
        }
      }

      // Descripción solo si no hay diag/trat (vacunas/preventivo)
      if (r.description && !r.diagnosis && !r.treatment) {
        const dStr = typeof r.description === 'string' ? r.description : '';
        if (dStr) {
          this.drawWrapped(smartSentenceCase(dStr.slice(0, MAX_FIELD_CHARS)), {
            x: bodyX,
            size: FS_SMALL,
            color: TEXT_BODY,
            maxWidth: bodyMaxW,
          });
        }
      }

      // Lote/serie
      if (r.batch_number || r.serial_number) {
        const lot: string[] = [];
        if (r.batch_number) lot.push(`Lote ${r.batch_number}`);
        if (r.serial_number) lot.push(`Serie ${r.serial_number}`);
        this.drawText(lot.join('  ·  '), {
          x: bodyX,
          size: FS_TINY,
          color: TEXT_FAINT,
        });
        this.y -= 10;
      }

      // Próxima fecha
      if (r.next_date) {
        this.drawText(`Proxima fecha: ${formatDate(r.next_date)}`, {
          x: bodyX,
          size: FS_TINY,
          color: GREEN,
          font: this.bold,
        });
        this.y -= 10;
      }

      // Notas
      if (r.notes) {
        const notesStr = typeof r.notes === 'string' ? r.notes : JSON.stringify(r.notes);
        const humanized = humanizeNotes(notesStr);
        if (humanized) {
          this.drawWrapped(smartSentenceCase(humanized), {
            x: bodyX,
            size: FS_TINY,
            color: TEXT_FAINT,
            maxWidth: bodyMaxW,
          });
        }
      }
    } else {
      // Nota clínica del vet
      const n = entry.data;

      if (n.provider_name) {
        this.drawText(`Vet: ${titleCase(n.provider_name)}`, {
          x: bodyX,
          size: FS_TINY,
          color: PURPLE_DARK,
        });
        this.y -= 11;
      }

      if (n.description) {
        this.drawWrapped(smartSentenceCase(String(n.description).slice(0, MAX_FIELD_CHARS)), {
          x: bodyX,
          size: FS_SMALL,
          color: TEXT_BODY,
          maxWidth: bodyMaxW,
        });
      }

      if (n.followup_required && n.followup_date) {
        this.drawText(
          `Seguimiento: ${formatDate(n.followup_date)}${n.followup_reason ? '  -  ' + smartSentenceCase(n.followup_reason) : ''}`,
          {
            x: bodyX,
            size: FS_TINY,
            color: GREEN,
            font: this.bold,
          }
        );
        this.y -= 10;
      }
    }

    this.y -= 6;
  }

  drawYearSeparator(year: string) {
    this.ensureSpace(24);
    this.y -= 4;
    const label = sanitizeForWinAnsi(year);
    const labelW = this.bold.widthOfTextAtSize(label, FS_H3);

    // Dos líneas, con label en el medio
    const mid = (PAGE_W - labelW) / 2;
    this.page!.drawLine({
      start: { x: MARGIN_L, y: this.y + 3 },
      end: { x: mid - 10, y: this.y + 3 },
      thickness: 0.5,
      color: BORDER,
    });
    this.page!.drawText(label, {
      x: mid,
      y: this.y,
      size: FS_H3,
      font: this.bold,
      color: TEXT_MUTED,
    });
    this.page!.drawLine({
      start: { x: mid + labelW + 10, y: this.y + 3 },
      end: { x: PAGE_W - MARGIN_R, y: this.y + 3 },
      thickness: 0.5,
      color: BORDER,
    });
    this.y -= 14;
  }
}

// =====================================================================
// Main serve
// =====================================================================

serve(
  withTelemetry('generate-medical-summary', async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const body = await req.json();
      const pet_id = body.pet_id;
      const mode = body.mode === 'complete' ? 'complete' : 'medical';
      const storeInStorage = body.store === true;
      const shareToken = body.token;
      if (!pet_id || typeof pet_id !== 'string') throw new Error('pet_id is required');

      // ── Auth: JWT o share token ──
      const authHeader = req.headers.get('Authorization');
      let isPublicShareAccess = false;
      let authenticatedUserId: string | null = null;

      if (authHeader) {
        const jwtToken = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabase.auth.getUser(jwtToken);
        if (userData?.user) authenticatedUserId = userData.user.id;
      }

      if (authenticatedUserId) {
        const quota = await checkAiQuota(authenticatedUserId, { limit: 5, windowSeconds: 60 });
        if (!quota.allowed) return rateLimitResponse(quota, corsHeaders);

        const { data: petOwnership, error: ownershipError } = await supabase
          .from('pets')
          .select('owner_id')
          .eq('id', pet_id)
          .single();

        if (ownershipError || !petOwnership) throw new Error('Pet not found');
        const isOwner = petOwnership.owner_id === authenticatedUserId;

        let isLinkedVet = false;
        if (!isOwner) {
          const { data: providerRow } = await supabase
            .from('service_providers')
            .select('id')
            .eq('user_id', authenticatedUserId)
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
      } else if (shareToken && typeof shareToken === 'string') {
        const { data: tokenData, error: tokenErr } = await supabase
          .from('medical_share_tokens')
          .select('id, pet_id, expires_at, is_revoked')
          .eq('token', shareToken)
          .maybeSingle();

        if (tokenErr || !tokenData) {
          return new Response(
            JSON.stringify({ success: false, error: 'Token de compartir invalido' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
        if (tokenData.is_revoked) {
          return new Response(
            JSON.stringify({ success: false, error: 'Este enlace fue revocado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
        if (new Date(tokenData.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ success: false, error: 'Este enlace ha expirado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
          );
        }
        if (tokenData.pet_id !== pet_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Token no corresponde a esta mascota' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }

        const quota = await checkAiQuota(`share_${tokenData.id}`, { limit: 3, windowSeconds: 60 });
        if (!quota.allowed) return rateLimitResponse(quota, corsHeaders);

        isPublicShareAccess = true;
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Se requiere autenticacion o token de compartir',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Share access fuerza modo médico (sin rutinas/hábitos)
      const effectiveMode = isPublicShareAccess ? 'medical' : mode;

      // Fetch data via RPC
      const { data: summaryData, error: summaryError } = await supabase.rpc(
        'get_medical_summary_data',
        { p_pet_id: pet_id, p_mode: effectiveMode }
      );
      if (summaryError) throw summaryError;
      if (!summaryData) throw new Error('No data found');

      const pet = summaryData.pet;
      const owner = summaryData.owner;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allRecords: any[] = summaryData.all_records || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vetNotes: any[] = summaryData.vet_notes || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routines: any[] = summaryData.routines || [];

      // ══════════════════════════════════════════════════════════
      // BUILD PDF v3
      // ══════════════════════════════════════════════════════════

      const pdfDoc = await PDFDocument.create();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const logoBytes = getLogoBytes();
      let logoImage: PDFImage | null = null;
      if (logoBytes) {
        try {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } catch {
          /* noop */
        }
      }

      const verificationCode = await generateVerificationCode(pet_id, Date.now());
      const generatedAt = formatDateLong(new Date().toISOString());

      const pdf = new PdfBuilder(pdfDoc, helvetica, bold, logoImage);
      pdf.petNameForHeader = properNoun(pet.name) || '';

      // ── Portada (página 1, sin header compacto) ──
      pdf.newPage(false);

      const petName = properNoun(pet.name) || 'Sin nombre';
      const petSpecies = speciesLabel(pet.species);
      const petBreed = pet.breed ? smartSentenceCase(pet.breed) : '';
      const subtitle = petBreed ? `${petSpecies}  ·  ${petBreed}` : petSpecies;

      const vitals: { label: string; value: string }[] = [
        {
          label: 'Edad',
          value: pet.birth_date
            ? `${calcAge(pet.birth_date)} (nac. ${formatDate(pet.birth_date)})`
            : calcAge(pet.birth_date),
        },
        { label: 'Sexo', value: genderLabel(pet.gender) },
        { label: 'Peso', value: pet.weight ? `${pet.weight} kg` : 'No registrado' },
        {
          label: 'Esterilizado/a',
          value: pet.neutered
            ? pet.neutered_date
              ? `Si (${formatDate(pet.neutered_date)})`
              : 'Si'
            : 'No',
        },
        { label: 'Microchip', value: pet.microchip_number || 'No registrado' },
        { label: 'Grupo sanguineo', value: pet.blood_type || 'No registrado' },
      ];
      if (pet.paw_card_id) vitals.push({ label: 'Paw Card ID', value: String(pet.paw_card_id) });

      pdf.drawCover(petName, subtitle, vitals, verificationCode, generatedAt);

      // ── Alertas críticas en portada (alergias + condiciones + medicamentos) ──
      const allergyLines: string[] = [];
      if (pet.allergies_food?.length)
        allergyLines.push(
          `Alimento: ${pet.allergies_food.map((a: string) => smartSentenceCase(a)).join(', ')}`
        );
      if (pet.allergies_medication?.length)
        allergyLines.push(
          `Medicamento: ${pet.allergies_medication.map((a: string) => smartSentenceCase(a)).join(', ')}`
        );
      if (pet.allergies_environmental?.length)
        allergyLines.push(
          `Ambiental: ${pet.allergies_environmental.map((a: string) => smartSentenceCase(a)).join(', ')}`
        );
      if (!allergyLines.length && pet.allergies?.length) {
        allergyLines.push(pet.allergies.map((a: string) => smartSentenceCase(a)).join(', '));
      }

      const conditionLines: string[] = [];
      if (pet.chronic_conditions_detail?.length) {
        for (const c of pet.chronic_conditions_detail) {
          const parts = [smartSentenceCase(c.condition || c.name || JSON.stringify(c))];
          if (c.diagnosed_date) parts.push(`desde ${formatDate(c.diagnosed_date)}`);
          if (c.severity) parts.push(smartSentenceCase(c.severity));
          conditionLines.push(parts.join(', '));
        }
      } else if (pet.chronic_conditions?.length) {
        for (const c of pet.chronic_conditions) conditionLines.push(smartSentenceCase(c));
      }

      const medicationLines: string[] = [];
      if (Array.isArray(pet.current_medications)) {
        for (const m of pet.current_medications) {
          const parts = [titleCase(m.name || 'Sin nombre')];
          if (m.dose) parts.push(m.dose);
          if (m.frequency) parts.push(smartSentenceCase(m.frequency));
          medicationLines.push(parts.join(' - '));
        }
      }

      pdf.drawAlertCard('Alergias', allergyLines, { tone: 'danger' });
      pdf.drawAlertCard('Condiciones cronicas', conditionLines, { tone: 'danger' });
      pdf.drawAlertCard('Medicamentos actuales', medicationLines, { tone: 'warning' });

      // ── Contacto del responsable (card sutil al fondo de la portada) ──
      if (owner?.display_name || owner?.email || pet.emergency_vet_name || pet.preferred_clinic) {
        pdf.y -= 6;
        pdf.ensureSpace(60);
        const cardY = pdf.y;
        const lines: { label: string; value: string }[] = [];
        if (owner?.display_name)
          lines.push({ label: 'Responsable', value: titleCase(owner.display_name) });
        if (owner?.email) lines.push({ label: 'Contacto', value: owner.email });
        if (pet.emergency_vet_name || pet.emergency_vet_phone) {
          lines.push({
            label: 'Vet emergencia',
            value:
              `${titleCase(pet.emergency_vet_name || '')} ${pet.emergency_vet_phone ? '· ' + pet.emergency_vet_phone : ''}`.trim(),
          });
        }
        if (pet.preferred_clinic)
          lines.push({ label: 'Clinica preferida', value: titleCase(pet.preferred_clinic) });
        if (pet.insurance_provider) {
          lines.push({
            label: 'Seguro',
            value: pet.insurance_policy
              ? `${titleCase(pet.insurance_provider)} (poliza ${pet.insurance_policy})`
              : titleCase(pet.insurance_provider),
          });
        }

        const cardH = lines.length * 14 + 22;
        pdf.page!.drawRectangle({
          x: MARGIN_L,
          y: cardY - cardH + 14,
          width: CONTENT_W,
          height: cardH,
          color: SURFACE,
          borderColor: BORDER,
          borderWidth: 0.5,
        });

        pdf.drawText('RESPONSABLE Y CONTACTOS', {
          x: MARGIN_L + 12,
          size: FS_TINY,
          font: bold,
          color: TEXT_FAINT,
        });
        pdf.y -= 14;

        for (const row of lines) {
          pdf.drawText(row.label, {
            x: MARGIN_L + 12,
            size: FS_TINY,
            color: TEXT_MUTED,
          });
          pdf.drawText(row.value, {
            x: MARGIN_L + 110,
            size: FS_SMALL,
            color: TEXT_DARK,
            maxWidth: CONTENT_W - 120,
          });
          pdf.y -= 14;
        }
      }

      // ════════════ Nueva página: Historial clínico ════════════

      pdf.newPage();

      // ── Timeline cronológica ──
      type TimelineEntry = {
        date: string;
        source: 'record' | 'vet_note';
        record_type: string;
        title: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // Más reciente primero (descendente) — mejor UX para quien ojea
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      pdf.drawSectionHeader('Historial clinico', timeline.length, PURPLE);

      if (timeline.length === 0) {
        pdf.drawText('Sin registros medicos aun.', {
          x: MARGIN_L,
          size: FS_BODY,
          color: TEXT_FAINT,
        });
        pdf.y -= 14;
      } else {
        let lastYear = '';
        for (const entry of timeline) {
          const year = entry.date?.slice(0, 4) || '';
          if (year && year !== lastYear) {
            lastYear = year;
            pdf.drawYearSeparator(year);
          }
          pdf.drawTimelineEntry(entry);
        }
      }

      // ── Resumen de vacunación (tabla) ──
      const vaccineRecords = allRecords.filter((r) => r.record_type === 'vacuna');
      if (vaccineRecords.length > 0) {
        pdf.drawSectionHeader('Calendario de vacunacion', vaccineRecords.length, GREEN);

        const rows = vaccineRecords.map((v) => [
          smartSentenceCase(v.title || 'Vacuna'),
          formatDate(v.date),
          [v.batch_number, v.serial_number].filter(Boolean).join(' / ') || '-',
          v.next_date ? formatDate(v.next_date) : '-',
        ]);
        pdf.drawTable(
          ['Vacuna', 'Fecha', 'Lote / Serie', 'Proxima dosis'],
          rows,
          [210, 90, 110, 106],
          { headColor: GREEN_SOFT }
        );
      }

      // ── Peso histórico (tabla + tendencia) ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weightHistory: any[] = Array.isArray(pet.weight_history) ? pet.weight_history : [];
      if (weightHistory.length > 1) {
        pdf.drawSectionHeader('Peso historico', weightHistory.length);

        const first = parseFloat(weightHistory[0]?.weight) || 0;
        const last = parseFloat(weightHistory[weightHistory.length - 1]?.weight) || 0;
        const trend =
          last > first + 0.5 ? 'en alza' : last < first - 0.5 ? 'en descenso' : 'estable';
        pdf.drawText(`Tendencia: ${trend}`, {
          x: MARGIN_L,
          size: FS_SMALL,
          color: TEXT_MUTED,
        });
        pdf.y -= 14;

        const rows = weightHistory.map((w) => [formatDate(w.date), `${w.weight} kg`]);
        pdf.drawTable(['Fecha', 'Peso'], rows, [260, 256]);
      }

      // ── Alimentación y estilo de vida ──
      const hasDiet = pet.diet_type || pet.diet_brand || pet.diet_frequency;
      const hasLifestyle = pet.activity_level || pet.living_environment || pet.behavior_notes;

      if (hasDiet || hasLifestyle) {
        pdf.drawSectionHeader('Alimentacion y estilo de vida');

        if (hasDiet) {
          const dietParts: string[] = [];
          if (pet.diet_type) dietParts.push(`Tipo: ${smartSentenceCase(pet.diet_type)}`);
          if (pet.diet_brand) dietParts.push(`Marca: ${titleCase(pet.diet_brand)}`);
          if (pet.diet_frequency)
            dietParts.push(`Frecuencia: ${smartSentenceCase(pet.diet_frequency)}`);
          pdf.drawWrapped(dietParts.join('  ·  '), {
            x: MARGIN_L,
            size: FS_BODY,
            color: TEXT_BODY,
          });
          pdf.y -= 4;
        }

        if (pet.activity_level)
          pdf.drawKV('Nivel actividad', smartSentenceCase(pet.activity_level));
        if (pet.living_environment)
          pdf.drawKV('Ambiente', smartSentenceCase(pet.living_environment));
        if (pet.behavior_notes) {
          pdf.drawText('Notas de comportamiento', {
            x: MARGIN_L,
            size: FS_TINY,
            font: bold,
            color: TEXT_MUTED,
          });
          pdf.y -= 11;
          pdf.drawWrapped(smartSentenceCase(pet.behavior_notes), {
            x: MARGIN_L,
            size: FS_SMALL,
            color: TEXT_BODY,
          });
        }
      }

      // ── Rutinas (solo mode complete) ──
      if (effectiveMode === 'complete' && routines.length > 0) {
        pdf.drawSectionHeader('Rutinas activas', routines.length, GREEN);

        const DAYS = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];
        const rows = routines.map((routine) => {
          const daysStr = (routine.days_of_week || [])
            .map((d: number) => DAYS[d] || '?')
            .join(', ');
          const time = routine.time_of_day ? routine.time_of_day.slice(0, 5) : '';
          const duration = routine.duration_minutes ? `${routine.duration_minutes}min` : '';
          return [
            smartSentenceCase(routine.title || 'Sin titulo'),
            routine.category ? smartSentenceCase(routine.category) : '-',
            daysStr || '-',
            `${time} ${duration}`.trim() || '-',
          ];
        });
        pdf.drawTable(['Rutina', 'Categoria', 'Dias', 'Horario'], rows, [200, 116, 100, 100], {
          headColor: GREEN_SOFT,
        });
      }

      // ── Nota de confidencialidad al final ──
      pdf.y -= 10;
      pdf.drawRule(BORDER, 0.4);
      pdf.drawWrapped(CONFIDENTIALITY_NOTICE, {
        x: MARGIN_L,
        size: FS_TINY,
        color: TEXT_FAINT,
        lineHeight: 10,
      });

      // ── Footer en todas las páginas ──
      pdf.drawFooters(verificationCode);

      // ── Watermark si es share público ──
      if (isPublicShareAccess) {
        pdf.drawWatermarkAll('COMPARTIDO');
      }

      // ── Guardar PDF ──
      const pdfBytes = await pdfDoc.save();
      const safeFileName = (pet.name || 'mascota')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      const fileName = `ficha-${safeFileName}-${Date.now()}.pdf`;

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

      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
        status: 200,
      });
    } catch (error: unknown) {
      console.error('Error generating medical summary:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al generar la ficha. Intenta de nuevo.',
          detail: error instanceof Error ? error.message : String(error),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  })
);
