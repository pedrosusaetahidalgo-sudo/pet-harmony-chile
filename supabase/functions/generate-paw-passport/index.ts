/**
 * generate-paw-passport — genera el Paw Passport (PDF multi-pagina) de una mascota.
 *
 * Pilar 2 de la Trinidad del Corazon (Refactor Maestro 2026-04-23 §6.3 Fase 1).
 *
 * Inspirado en el pasaporte chileno real. PDF multi-pagina (A5 portrait):
 *   1. Tapa (azul oscuro + escudo + titulo)
 *   2. Pagina datos (data page con foto biometrica + campos formales + MRZ)
 *   3. Identidad biometrica (microchip + nose print + QR)
 *   4. Vacunas (tabla)
 *   5. Antiparasitarios (tabla)
 *   6. Datos medicos criticos (sangre, alergias, condiciones, peso historial)
 *   7. Contactos de emergencia
 *   8. Validaciones (paginas en blanco para sellos veterinarios)
 *
 * Uso: para viajes (aerolineas), vets externos, hoteles caninos, refugios.
 *
 * Request: POST { pet_id: UUID }
 * Response: PDF binario (application/pdf)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PageSizes,
  type PDFFont,
  type PDFPage,
} from 'https://esm.sh/pdf-lib@1.17.1';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Paleta cédula chilena (verde turquesa → rosa)
const C_GREEN = rgb(0.49, 0.83, 0.75); // #7dd3c0
const C_ROSE = rgb(0.99, 0.91, 0.88); // #fce7e0
const C_NAVY = rgb(0.0, 0.2, 0.63); // #0033A0
const C_NAVY_DARK = rgb(0.0, 0.1, 0.3); // #001a4d
const C_GOLD = rgb(0.98, 0.75, 0.14); // #fbbf24
const C_RED = rgb(0.84, 0.17, 0.12); // #D52B1E
const C_GRAY = rgb(0.39, 0.45, 0.55); // #64748b
const C_DARK = rgb(0.06, 0.09, 0.16); // #0f172a
const C_LIGHT_GRAY = rgb(0.95, 0.96, 0.98);
const C_WHITE = rgb(1, 1, 1);

// Sanitiza para WinAnsi (Helvetica/Times no soportan unicode completo)
function san(s: string | null | undefined): string {
  if (!s) return '';
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .slice(0, 200);
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function fmtDateMrz(d: string | null | undefined): string {
  if (!d) return '<<<<<<';
  try {
    return new Date(d).toISOString().slice(2, 10).replace(/-/g, '');
  } catch {
    return '<<<<<<';
  }
}

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '';
  try {
    const years = Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)
    );
    if (years >= 1) return `${years} year${years !== 1 ? 's' : ''}`;
    const months = Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (30.44 * 24 * 3600 * 1000)
    );
    return `${months} month${months !== 1 ? 's' : ''}`;
  } catch {
    return '';
  }
}

interface PassportData {
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
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: Array<{ name?: string; dosage?: string; frequency?: string }> | null;
  weight: number | null;
  weight_history: Array<{ weight: number; date: string }> | null;
  vaccination_status: string | null;
  emergency_vet_name: string | null;
  emergency_vet_phone: string | null;
  preferred_clinic: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  nose_print_hash: string | null;
  issued_at: string;
  expires_at: string;
  vaccines: Array<{
    vaccine_name: string;
    date: string;
    lot: string | null;
    vet: string | null;
    next_due: string | null;
  }>;
  deworming: Array<{ product: string; date: string; next_due: string | null; vet: string | null }>;
}

// ───────────────────────────────────────────────────────────────────────────
// PÁGINA 1 — TAPA
// ───────────────────────────────────────────────────────────────────────────
function drawCover(page: PDFPage, fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont }) {
  const { width, height } = page.getSize();

  // Fondo azul oscuro
  page.drawRectangle({ x: 0, y: 0, width, height, color: C_NAVY_DARK });

  // Borde dorado decorativo
  page.drawRectangle({
    x: 16,
    y: 16,
    width: width - 32,
    height: height - 32,
    borderColor: C_GOLD,
    borderWidth: 0.8,
  });
  page.drawRectangle({
    x: 22,
    y: 22,
    width: width - 44,
    height: height - 44,
    borderColor: C_GOLD,
    borderWidth: 0.3,
  });

  // "REPÚBLICA DE CHILE" arriba
  const titleSize = 16;
  const titleText = san('REPUBLICA DE CHILE');
  const titleW = fonts.bold.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (width - titleW) / 2,
    y: height - 90,
    size: titleSize,
    font: fonts.bold,
    color: C_GOLD,
  });

  // Escudo central (huella + estrella) - simplificado
  const cx = width / 2;
  const cy = height / 2 + 20;

  // Círculo dorado
  page.drawCircle({ x: cx, y: cy, size: 60, borderColor: C_GOLD, borderWidth: 1.2 });
  page.drawCircle({ x: cx, y: cy, size: 54, borderColor: C_GOLD, borderWidth: 0.5 });

  // Estrella central dorada (5 puntas)
  const starPoints = [
    [cx, cy + 35],
    [cx + 10, cy + 12],
    [cx + 33, cy + 12],
    [cx + 15, cy - 3],
    [cx + 22, cy - 27],
    [cx, cy - 13],
    [cx - 22, cy - 27],
    [cx - 15, cy - 3],
    [cx - 33, cy + 12],
    [cx - 10, cy + 12],
  ];
  // pdf-lib drawSvgPath o usar líneas
  // Simplificado: triángulos de la estrella
  for (let i = 0; i < starPoints.length; i++) {
    const [x1, y1] = starPoints[i];
    const [x2, y2] = starPoints[(i + 1) % starPoints.length];
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1.2,
      color: C_GOLD,
    });
  }

  // "PAW FRIEND" abajo del escudo
  const brandSize = 14;
  const brandText = san('PAW FRIEND');
  const brandW = fonts.bold.widthOfTextAtSize(brandText, brandSize);
  page.drawText(brandText, {
    x: (width - brandW) / 2,
    y: cy - 70,
    size: brandSize,
    font: fonts.bold,
    color: C_GOLD,
  });

  // "PASAPORTE DE MASCOTA / PET PASSPORT" abajo
  const subSize = 12;
  const subText = san('PASAPORTE DE MASCOTA');
  const subW = fonts.bold.widthOfTextAtSize(subText, subSize);
  page.drawText(subText, {
    x: (width - subW) / 2,
    y: 140,
    size: subSize,
    font: fonts.bold,
    color: C_GOLD,
  });

  const subEnSize = 10;
  const subEnText = san('PET PASSPORT');
  const subEnW = fonts.italic.widthOfTextAtSize(subEnText, subEnSize);
  page.drawText(subEnText, {
    x: (width - subEnW) / 2,
    y: 122,
    size: subEnSize,
    font: fonts.italic,
    color: C_GOLD,
  });

  // Símbolo chip ePassport (rectángulo + círculos concéntricos)
  page.drawRectangle({
    x: cx - 18,
    y: 60,
    width: 36,
    height: 22,
    borderColor: C_GOLD,
    borderWidth: 0.8,
  });
  page.drawCircle({ x: cx, y: 71, size: 6, borderColor: C_GOLD, borderWidth: 0.8 });
  page.drawCircle({ x: cx, y: 71, size: 3, borderColor: C_GOLD, borderWidth: 0.5 });
}

// ───────────────────────────────────────────────────────────────────────────
// PÁGINA 2 — DATA PAGE (la principal, estilo pasaporte chileno)
// ───────────────────────────────────────────────────────────────────────────
async function drawDataPage(
  doc: PDFDocument,
  page: PDFPage,
  data: PassportData,
  fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont },
  photoBytes: Uint8Array | null
) {
  const { width, height } = page.getSize();

  // Fondo papel rosa pálido (como pasaporte chileno)
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.99, 0.96, 0.94) });

  // Banda superior turquesa → rosa (estilo cédula real)
  page.drawRectangle({ x: 0, y: height - 50, width: width * 0.55, height: 50, color: C_GREEN });
  page.drawRectangle({
    x: width * 0.55,
    y: height - 50,
    width: width * 0.45,
    height: 50,
    color: C_ROSE,
  });

  // Texto banda superior
  page.drawText(san('PASAPORTE / PASSPORT'), {
    x: 16,
    y: height - 22,
    size: 9,
    font: fonts.bold,
    color: C_NAVY,
  });
  page.drawText(san('REPUBLICA DE CHILE'), {
    x: 16,
    y: height - 38,
    size: 7,
    font: fonts.regular,
    color: C_NAVY,
  });

  // Bandera Chile pequeña esquina superior derecha
  const flagX = width - 60;
  const flagY = height - 38;
  page.drawRectangle({ x: flagX, y: flagY, width: 18, height: 6, color: C_NAVY });
  page.drawRectangle({ x: flagX + 18, y: flagY, width: 18, height: 6, color: C_WHITE });
  page.drawRectangle({ x: flagX, y: flagY - 6, width: 36, height: 6, color: C_RED });
  // Estrella blanca en azul
  page.drawText('*', {
    x: flagX + 6,
    y: flagY,
    size: 8,
    font: fonts.bold,
    color: C_WHITE,
  });

  // Foto biométrica izquierda
  const photoX = 16;
  const photoY = height - 220;
  const photoW = 100;
  const photoH = 130;
  page.drawRectangle({
    x: photoX - 1,
    y: photoY - 1,
    width: photoW + 2,
    height: photoH + 2,
    borderColor: C_NAVY,
    borderWidth: 1.5,
  });
  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoW,
    height: photoH,
    color: C_LIGHT_GRAY,
  });
  if (photoBytes) {
    try {
      const img =
        photoBytes[0] === 0xff && photoBytes[1] === 0xd8
          ? await doc.embedJpg(photoBytes)
          : await doc.embedPng(photoBytes);
      page.drawImage(img, { x: photoX, y: photoY, width: photoW, height: photoH });
    } catch {
      // Fallback: dejar el cuadro gris
    }
  }

  // Datos en columna derecha (estilo pasaporte chileno data page)
  let cy = height - 75;
  const labelX = 130;
  const labelSize = 6;
  const valueSize = 10;
  const lineGap = 22;

  function field(label: string, value: string, color = C_DARK) {
    page.drawText(san(label.toUpperCase()), {
      x: labelX,
      y: cy,
      size: labelSize,
      font: fonts.regular,
      color: C_GRAY,
    });
    page.drawText(san(value), {
      x: labelX,
      y: cy - 11,
      size: valueSize,
      font: fonts.bold,
      color,
    });
    cy -= lineGap;
  }

  field('Tipo / Type', 'P');
  field('Codigo / Country code', 'CHL');
  field('N. pasaporte / Number', data.card_number, C_RED);
  field('Apellidos / Surname', '—');
  field('Nombres / Given names', data.pet_name);
  field('Especie / Species', data.species);
  field('Raza / Breed', data.breed || '—');

  // Segunda columna abajo de la foto
  cy = photoY - 18;
  const labelX2 = 16;
  function field2(label: string, value: string) {
    page.drawText(san(label.toUpperCase()), {
      x: labelX2,
      y: cy,
      size: labelSize,
      font: fonts.regular,
      color: C_GRAY,
    });
    page.drawText(san(value), {
      x: labelX2,
      y: cy - 11,
      size: valueSize,
      font: fonts.bold,
      color: C_DARK,
    });
    cy -= lineGap;
  }

  field2('Sexo / Sex', data.gender === 'macho' ? 'M' : data.gender === 'hembra' ? 'F' : '—');
  field2('Color', data.color || '—');
  field2('Fecha nacimiento / Date of birth', fmtDate(data.birth_date));
  field2('Fecha emision / Date of issue', fmtDate(data.issued_at));
  field2('Fecha vencimiento / Date of expiry', fmtDate(data.expires_at));
  field2('Autoridad emisora / Authority', 'Paw Friend · Chile');

  // MRZ abajo (3 líneas tipo pasaporte ICAO 9303)
  const mrzY = 60;
  page.drawRectangle({
    x: 8,
    y: mrzY - 8,
    width: width - 16,
    height: 70,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 0.5,
  });

  const padField = (s: string, len: number) =>
    (s || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '<')
      .padEnd(len, '<')
      .slice(0, len);

  const dobMrz = fmtDateMrz(data.birth_date);
  const expMrz = fmtDateMrz(data.expires_at);
  const sexMrz = data.gender === 'macho' ? 'M' : data.gender === 'hembra' ? 'F' : '<';

  const mrz1 = `P<CHL${padField(data.pet_name, 39)}`.slice(0, 44);
  const mrz2 =
    `${padField(data.card_number, 9)}<CHL${dobMrz}${sexMrz}${expMrz}<<<<<<<<<<<<<<`.slice(0, 44);
  const mrz3 =
    `${padField(data.microchip_number || '', 14)}<${padField(data.species, 12)}<${padField(data.breed || '', 16)}`.slice(
      0,
      44
    );

  page.drawText(mrz1, { x: 16, y: mrzY + 36, size: 9, font: fonts.bold, color: C_DARK });
  page.drawText(mrz2, { x: 16, y: mrzY + 20, size: 9, font: fonts.bold, color: C_DARK });
  page.drawText(mrz3, { x: 16, y: mrzY + 4, size: 9, font: fonts.bold, color: C_DARK });
}

// ───────────────────────────────────────────────────────────────────────────
// PÁGINA 3 — IDENTIDAD BIOMÉTRICA
// ───────────────────────────────────────────────────────────────────────────
function drawBiometricPage(
  page: PDFPage,
  data: PassportData,
  fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont }
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: C_WHITE });

  // Header
  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: C_NAVY });
  page.drawText(san('IDENTIDAD BIOMETRICA / BIOMETRIC IDENTITY'), {
    x: 16,
    y: height - 23,
    size: 10,
    font: fonts.bold,
    color: C_WHITE,
  });

  let y = height - 70;

  // Microchip (Ley 21.020)
  page.drawText(san('Microchip (Ley 21.020 Cholito)'), {
    x: 16,
    y,
    size: 8,
    font: fonts.regular,
    color: C_GRAY,
  });
  page.drawText(san(data.microchip_number || 'No registrado'), {
    x: 16,
    y: y - 16,
    size: 14,
    font: fonts.bold,
    color: data.microchip_number ? C_DARK : C_GRAY,
  });
  if (data.chip_registry) {
    page.drawText(san(`Registro: ${data.chip_registry}`), {
      x: 16,
      y: y - 30,
      size: 9,
      font: fonts.regular,
      color: C_GRAY,
    });
  }

  y -= 56;

  // Nose print hash
  page.drawText(san('Huella nasal / Nose print biometric hash'), {
    x: 16,
    y,
    size: 8,
    font: fonts.regular,
    color: C_GRAY,
  });
  page.drawText(san(data.nose_print_hash || 'Pendiente captura'), {
    x: 16,
    y: y - 16,
    size: 12,
    font: fonts.bold,
    color: data.nose_print_hash ? C_NAVY : C_GRAY,
  });

  y -= 56;

  // QR placeholder
  page.drawText(san('Codigo QR de emergencia'), {
    x: 16,
    y,
    size: 8,
    font: fonts.regular,
    color: C_GRAY,
  });
  page.drawRectangle({
    x: 16,
    y: y - 130,
    width: 110,
    height: 110,
    color: C_WHITE,
    borderColor: C_DARK,
    borderWidth: 1,
  });
  // QR placeholder marcadores
  page.drawRectangle({ x: 22, y: y - 28, width: 22, height: 22, color: C_DARK });
  page.drawRectangle({ x: 26, y: y - 24, width: 14, height: 14, color: C_WHITE });
  page.drawRectangle({ x: 30, y: y - 20, width: 6, height: 6, color: C_DARK });

  page.drawRectangle({ x: 100, y: y - 28, width: 22, height: 22, color: C_DARK });
  page.drawRectangle({ x: 104, y: y - 24, width: 14, height: 14, color: C_WHITE });
  page.drawRectangle({ x: 108, y: y - 20, width: 6, height: 6, color: C_DARK });

  page.drawRectangle({ x: 22, y: y - 116, width: 22, height: 22, color: C_DARK });
  page.drawRectangle({ x: 26, y: y - 112, width: 14, height: 14, color: C_WHITE });
  page.drawRectangle({ x: 30, y: y - 108, width: 6, height: 6, color: C_DARK });

  page.drawText('QR', {
    x: 65,
    y: y - 80,
    size: 8,
    font: fonts.bold,
    color: C_DARK,
  });

  page.drawText(san(`pawfriend.cl/id/${data.card_number}`), {
    x: 140,
    y: y - 60,
    size: 9,
    font: fonts.regular,
    color: C_GRAY,
  });
  page.drawText(san('Escanea para acceder'), {
    x: 140,
    y: y - 76,
    size: 11,
    font: fonts.bold,
    color: C_NAVY,
  });
  page.drawText(san('a la ficha clinica completa.'), {
    x: 140,
    y: y - 92,
    size: 11,
    font: fonts.bold,
    color: C_NAVY,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// PÁGINA 4 — VACUNAS
// ───────────────────────────────────────────────────────────────────────────
function drawVaccinesPage(
  page: PDFPage,
  data: PassportData,
  fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont }
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: C_WHITE });

  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: C_NAVY });
  page.drawText(san('VACUNAS / VACCINES'), {
    x: 16,
    y: height - 23,
    size: 10,
    font: fonts.bold,
    color: C_WHITE,
  });

  let y = height - 70;

  if (!data.vaccines.length) {
    page.drawText(san('Sin vacunas registradas todavia.'), {
      x: 16,
      y,
      size: 11,
      font: fonts.italic,
      color: C_GRAY,
    });
    return;
  }

  // Headers tabla
  const cols = [
    { label: 'Fecha', x: 16, w: 60 },
    { label: 'Vacuna', x: 76, w: 130 },
    { label: 'Lote', x: 206, w: 70 },
    { label: 'Vet', x: 276, w: 80 },
    { label: 'Proxima', x: 356, w: 60 },
  ];
  cols.forEach((c) => {
    page.drawText(san(c.label.toUpperCase()), {
      x: c.x,
      y,
      size: 7,
      font: fonts.bold,
      color: C_GRAY,
    });
  });
  page.drawLine({
    start: { x: 16, y: y - 4 },
    end: { x: width - 16, y: y - 4 },
    thickness: 0.6,
    color: C_DARK,
  });
  y -= 18;

  for (const v of data.vaccines) {
    if (y < 60) break;
    page.drawText(fmtDate(v.date), {
      x: 16,
      y,
      size: 8,
      font: fonts.regular,
      color: C_DARK,
    });
    page.drawText(san(v.vaccine_name).slice(0, 24), {
      x: 76,
      y,
      size: 8,
      font: fonts.bold,
      color: C_DARK,
    });
    page.drawText(san(v.lot || '—').slice(0, 14), {
      x: 206,
      y,
      size: 8,
      font: fonts.regular,
      color: C_GRAY,
    });
    page.drawText(san(v.vet || '—').slice(0, 16), {
      x: 276,
      y,
      size: 8,
      font: fonts.regular,
      color: C_GRAY,
    });
    page.drawText(fmtDate(v.next_due), {
      x: 356,
      y,
      size: 8,
      font: fonts.regular,
      color: C_GRAY,
    });
    y -= 16;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// PÁGINA 5 — DATOS MÉDICOS CRÍTICOS
// ───────────────────────────────────────────────────────────────────────────
function drawMedicalCriticalPage(
  page: PDFPage,
  data: PassportData,
  fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont }
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: C_WHITE });

  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: C_RED });
  page.drawText(san('DATOS MEDICOS CRITICOS / CRITICAL MEDICAL'), {
    x: 16,
    y: height - 23,
    size: 10,
    font: fonts.bold,
    color: C_WHITE,
  });

  let y = height - 70;

  // Sangre + peso (línea grande)
  page.drawText(san('Grupo sanguineo / Blood type'), {
    x: 16,
    y,
    size: 8,
    font: fonts.regular,
    color: C_GRAY,
  });
  page.drawText(san(data.blood_type || '—'), {
    x: 16,
    y: y - 18,
    size: 18,
    font: fonts.bold,
    color: C_RED,
  });

  page.drawText(san('Peso actual / Current weight'), {
    x: 200,
    y,
    size: 8,
    font: fonts.regular,
    color: C_GRAY,
  });
  page.drawText(san(data.weight ? `${data.weight} kg` : '—'), {
    x: 200,
    y: y - 18,
    size: 18,
    font: fonts.bold,
    color: C_DARK,
  });

  y -= 50;

  // Alergias (banner amarillo si tiene)
  if (data.allergies && data.allergies.length > 0) {
    page.drawRectangle({
      x: 16,
      y: y - 30,
      width: width - 32,
      height: 36,
      color: rgb(1, 0.95, 0.78),
      borderColor: rgb(0.96, 0.62, 0.04),
      borderWidth: 1,
    });
    page.drawText(san('ALERGIAS - NO ADMINISTRAR'), {
      x: 24,
      y: y - 8,
      size: 9,
      font: fonts.bold,
      color: rgb(0.71, 0.33, 0.04),
    });
    page.drawText(san(data.allergies.join(', ')).slice(0, 70), {
      x: 24,
      y: y - 22,
      size: 11,
      font: fonts.bold,
      color: rgb(0.47, 0.21, 0.04),
    });
    y -= 50;
  }

  // Condiciones crónicas
  if (data.chronic_conditions && data.chronic_conditions.length > 0) {
    page.drawText(san('Condiciones cronicas / Chronic conditions'), {
      x: 16,
      y,
      size: 8,
      font: fonts.regular,
      color: C_GRAY,
    });
    page.drawText(san(data.chronic_conditions.join(', ')).slice(0, 80), {
      x: 16,
      y: y - 16,
      size: 10,
      font: fonts.regular,
      color: C_DARK,
    });
    y -= 36;
  }

  // Medicamentos
  if (data.current_medications && data.current_medications.length > 0) {
    page.drawText(san('Medicamentos actuales / Current medications'), {
      x: 16,
      y,
      size: 8,
      font: fonts.regular,
      color: C_GRAY,
    });
    y -= 14;
    for (const m of data.current_medications.slice(0, 5)) {
      const text = `${m.name || ''}${m.dosage ? ` · ${m.dosage}` : ''}${m.frequency ? ` · ${m.frequency}` : ''}`;
      page.drawText(san(text).slice(0, 70), {
        x: 24,
        y,
        size: 9,
        font: fonts.regular,
        color: C_DARK,
      });
      y -= 14;
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// PÁGINA 6 — CONTACTOS DE EMERGENCIA
// ───────────────────────────────────────────────────────────────────────────
function drawEmergencyPage(
  page: PDFPage,
  data: PassportData,
  fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont }
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: C_WHITE });

  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: C_NAVY });
  page.drawText(san('CONTACTOS DE EMERGENCIA / EMERGENCY CONTACTS'), {
    x: 16,
    y: height - 23,
    size: 10,
    font: fonts.bold,
    color: C_WHITE,
  });

  let y = height - 70;

  // Tutor
  page.drawText(san('Tutor / Owner'), { x: 16, y, size: 8, font: fonts.regular, color: C_GRAY });
  page.drawText(san(data.owner_name || '—'), {
    x: 16,
    y: y - 16,
    size: 13,
    font: fonts.bold,
    color: C_DARK,
  });
  page.drawText(san(data.owner_phone || '—'), {
    x: 16,
    y: y - 32,
    size: 11,
    font: fonts.regular,
    color: C_DARK,
  });

  y -= 60;

  // Veterinario
  page.drawText(san('Veterinario / Veterinarian'), {
    x: 16,
    y,
    size: 8,
    font: fonts.regular,
    color: C_GRAY,
  });
  page.drawText(san(data.emergency_vet_name || '—'), {
    x: 16,
    y: y - 16,
    size: 13,
    font: fonts.bold,
    color: C_DARK,
  });
  page.drawText(san(data.emergency_vet_phone || '—'), {
    x: 16,
    y: y - 32,
    size: 11,
    font: fonts.regular,
    color: C_DARK,
  });
  if (data.preferred_clinic) {
    page.drawText(san(`Clinica: ${data.preferred_clinic}`), {
      x: 16,
      y: y - 48,
      size: 9,
      font: fonts.italic,
      color: C_GRAY,
    });
  }
}

// ───────────────────────────────────────────────────────────────────────────
// PÁGINA 7 — VALIDACIONES (espacio para sellos vet)
// ───────────────────────────────────────────────────────────────────────────
function drawStampsPage(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont }
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: C_WHITE });

  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: C_GREEN });
  page.drawText(san('VALIDACIONES / STAMPS'), {
    x: 16,
    y: height - 23,
    size: 10,
    font: fonts.bold,
    color: C_NAVY,
  });

  page.drawText(
    san('Espacio para sellos veterinarios. Cada visita o validacion deja constancia aqui.'),
    {
      x: 16,
      y: height - 60,
      size: 9,
      font: fonts.italic,
      color: C_GRAY,
    }
  );

  // Cuadrículas para sellos (2x3)
  const slotW = (width - 48) / 2;
  const slotH = 130;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const x = 16 + col * (slotW + 16);
      const y = height - 100 - row * (slotH + 16) - slotH;
      page.drawRectangle({
        x,
        y,
        width: slotW,
        height: slotH,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.5,
        borderDashArray: [4, 4],
      });
      page.drawText(san(`Sello ${row * 2 + col + 1}`), {
        x: x + 8,
        y: y + slotH - 14,
        size: 7,
        font: fonts.regular,
        color: rgb(0.7, 0.7, 0.7),
      });
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ───────────────────────────────────────────────────────────────────────────
serve(async (req) => {
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
    const pet_id = body.pet_id as string;
    if (!pet_id) {
      return new Response(JSON.stringify({ error: 'pet_id required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Datos pet
    const { data: pet, error: petErr } = await admin
      .from('pets')
      .select('*')
      .eq('id', pet_id)
      .maybeSingle();

    if (petErr || !pet) {
      return new Response(JSON.stringify({ error: 'Pet not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Verificar permisos (owner o co-owner)
    if (pet.owner_id !== user.id) {
      const { data: coOwner } = await admin
        .from('pet_co_owners')
        .select('permissions')
        .eq('pet_id', pet_id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();
      if (!coOwner) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    // Owner profile
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('display_name, phone')
      .eq('id', pet.owner_id)
      .maybeSingle();

    // Pet ID Card (para card_number compartido)
    const { data: idCard } = await admin
      .from('pet_id_cards')
      .select('card_number')
      .eq('pet_id', pet_id)
      .eq('is_active', true)
      .maybeSingle();

    // Vacunas
    const { data: vaccines } = await admin
      .from('vaccinations')
      .select('vaccine_name, date_administered, lot_number, vet_name, next_due_date')
      .eq('pet_id', pet_id)
      .order('date_administered', { ascending: false })
      .limit(20);

    // Antiparasitarios
    const { data: deworming } = await admin
      .from('deworming_records')
      .select('product_name, date_administered, next_due_date, vet_name')
      .eq('pet_id', pet_id)
      .order('date_administered', { ascending: false })
      .limit(20);

    // Photo bytes
    let photoBytes: Uint8Array | null = null;
    if (pet.photo_url) {
      try {
        const r = await fetch(pet.photo_url);
        if (r.ok) photoBytes = new Uint8Array(await r.arrayBuffer());
      } catch {
        photoBytes = null;
      }
    }

    // Construir data
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 5);

    const data: PassportData = {
      pet_id,
      card_number: idCard?.card_number || `PF-TMP-${pet_id.slice(0, 8).toUpperCase()}`,
      pet_name: pet.name,
      species: pet.species,
      breed: pet.breed,
      birth_date: pet.birth_date,
      gender: pet.gender,
      neutered: pet.neutered,
      color: pet.color,
      microchip_number: pet.microchip_number,
      chip_registry: pet.chip_registry,
      photo_url: pet.photo_url,
      blood_type: pet.blood_type,
      allergies: pet.allergies,
      chronic_conditions: pet.chronic_conditions,
      current_medications: pet.current_medications,
      weight: pet.weight,
      weight_history: pet.weight_history,
      vaccination_status: pet.vaccination_status,
      emergency_vet_name: pet.emergency_vet_name,
      emergency_vet_phone: pet.emergency_vet_phone,
      preferred_clinic: pet.preferred_clinic,
      owner_name: ownerProfile?.display_name ?? null,
      owner_phone: (ownerProfile as { phone?: string | null } | null)?.phone ?? null,
      nose_print_hash: null, // futuro
      issued_at: now.toISOString(),
      expires_at: expires.toISOString(),
      vaccines:
        (vaccines || []).map((v: Record<string, unknown>) => ({
          vaccine_name: (v.vaccine_name as string) || '',
          date: (v.date_administered as string) || '',
          lot: (v.lot_number as string) || null,
          vet: (v.vet_name as string) || null,
          next_due: (v.next_due_date as string) || null,
        })) ?? [],
      deworming:
        (deworming || []).map((d: Record<string, unknown>) => ({
          product: (d.product_name as string) || '',
          date: (d.date_administered as string) || '',
          next_due: (d.next_due_date as string) || null,
          vet: (d.vet_name as string) || null,
        })) ?? [],
    };

    // Crear PDF
    const doc = await PDFDocument.create();
    doc.setTitle(`Paw Passport — ${data.pet_name}`);
    doc.setAuthor('Paw Friend');
    doc.setSubject('Pasaporte de Mascota');
    doc.setKeywords(['mascota', 'paw friend', 'pasaporte', 'chile']);
    doc.setProducer('Paw Friend pawfriend.cl');

    const fonts = {
      bold: await doc.embedFont(StandardFonts.HelveticaBold),
      regular: await doc.embedFont(StandardFonts.Helvetica),
      italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    };

    // A5 portrait (148×210mm = 419.5×595.3 pts) — usamos el preset
    const pageSize = PageSizes.A5;

    // Páginas
    drawCover(doc.addPage(pageSize), fonts);
    await drawDataPage(doc, doc.addPage(pageSize), data, fonts, photoBytes);
    drawBiometricPage(doc.addPage(pageSize), data, fonts);
    drawVaccinesPage(doc.addPage(pageSize), data, fonts);
    drawMedicalCriticalPage(doc.addPage(pageSize), data, fonts);
    drawEmergencyPage(doc.addPage(pageSize), data, fonts);
    drawStampsPage(doc.addPage(pageSize), fonts);

    const pdfBytes = await doc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="paw-passport-${data.pet_name.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('generate-paw-passport error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
