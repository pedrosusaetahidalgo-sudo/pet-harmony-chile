/**
 * Edge Function: Generate Shelter Report PDF (2026-04-20)
 *
 * Genera un PDF con el catalogo de mascotas actualmente en custodia de un
 * refugio, util para compartir con donantes, medios, prensa o adoptantes
 * potenciales.
 *
 * Body: { shelter_id: string }
 * Auth: JWT requerido. Solo el user dueno del adoption_center puede
 *       generar el reporte de su propio refugio.
 *
 * Contenido del PDF:
 *  - Portada: logo + nombre + mision + contacto + comuna
 *  - Resumen: total en custodia, total adoptadas historico, % adopcion
 *  - Listado de mascotas en custodia (foto si hay, nombre, edad, especie,
 *    sexo, descripcion breve)
 *  - Footer: link al perfil publico del refugio + pagina actual
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, PDFPage, StandardFonts, rgb, type RGB } from 'https://esm.sh/pdf-lib@1.17.1';
import { withTelemetry } from '../_shared/telemetry.ts';

const ALLOWED_ORIGINS = ['https://pawfriend.cl', 'http://localhost:8080', 'http://localhost:5173'];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const CONTENT_W = PAGE_W - 2 * MARGIN;

const PURPLE = rgb(0.486, 0.227, 0.929);
const PURPLE_SOFT = rgb(0.953, 0.941, 0.996);
const EMERALD = rgb(0.02, 0.588, 0.412);
const EMERALD_SOFT = rgb(0.945, 0.988, 0.969);
const TEXT_DARK = rgb(0.122, 0.161, 0.216);
const TEXT_BODY = rgb(0.282, 0.337, 0.408);
const TEXT_MUTED = rgb(0.42, 0.447, 0.502);
const BORDER = rgb(0.898, 0.906, 0.922);
const WHITE = rgb(1, 1, 1);

interface Shelter {
  id: string;
  legal_name: string;
  mission: string | null;
  commune: string;
  region: string | null;
  type: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  slug: string | null;
  total_pets_adopted: number;
  total_pets_in_care: number;
  accepts_donations: boolean;
}

interface Pet {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  photo_url: string | null;
  description: string | null;
}

function ageLabel(birth: string | null): string {
  if (!birth) return 'Edad no registrada';
  const days = Math.floor((Date.now() - new Date(birth).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 60) return `${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 18) return `${months} meses`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawFooter(
  page: PDFPage,
  font: PDFFont,
  pageNum: number,
  totalPages: number,
  shelterName: string,
  slug: string | null
) {
  const text = slug ? `${shelterName} - pawfriend.cl/refugios/${slug}` : shelterName;
  page.drawText(text, {
    x: MARGIN,
    y: 30,
    size: 8,
    font,
    color: TEXT_MUTED,
  });
  page.drawText(`Pagina ${pageNum} de ${totalPages}`, {
    x: PAGE_W - MARGIN - 80,
    y: 30,
    size: 8,
    font,
    color: TEXT_MUTED,
  });
  page.drawText('Generado por Paw Friend - pawfriend.cl', {
    x: MARGIN,
    y: 18,
    size: 7,
    font,
    color: TEXT_MUTED,
  });
}

type PDFFont = Awaited<ReturnType<PDFDocument['embedFont']>>;

serve(
  withTelemetry('generate-shelter-report-pdf', async (req) => {
    const corsHeaders = getCorsHeaders(req);
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No auth' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json().catch(() => ({}));
      const shelterId = String(body?.shelter_id ?? '').trim();
      if (!shelterId) {
        return new Response(JSON.stringify({ error: 'shelter_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
      );

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar que el user es dueno del adoption_center
      const { data: shelter, error: shelterErr } = await supabase
        .from('adoption_centers')
        .select(
          'id, legal_name, mission, commune, region, type, contact_email, contact_phone, website, slug, total_pets_adopted, total_pets_in_care, accepts_donations, user_id'
        )
        .eq('id', shelterId)
        .maybeSingle();

      if (shelterErr || !shelter) {
        return new Response(JSON.stringify({ error: 'Shelter not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if ((shelter as { user_id: string }).user_id !== userData.user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch pets en custodia (RLS del user refugio permite leer sus pets)
      const { data: petsData, error: petsErr } = await supabase
        .from('pets')
        .select('id, name, species, breed, sex, birth_date, photo_url, description')
        .eq('created_by_shelter_id', shelterId)
        .is('shelter_adopted_at', null)
        .is('owner_id', null)
        .order('created_at', { ascending: false });

      if (petsErr) {
        return new Response(JSON.stringify({ error: petsErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const pets = (petsData ?? []) as Pet[];
      const s = shelter as Shelter;

      // === Generar PDF ===
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // --- Portada ---
      const cover = pdfDoc.addPage([PAGE_W, PAGE_H]);
      cover.drawRectangle({ x: 0, y: PAGE_H - 180, width: PAGE_W, height: 180, color: PURPLE });
      cover.drawText('Reporte de mascotas en custodia', {
        x: MARGIN,
        y: PAGE_H - 80,
        size: 24,
        font: fontBold,
        color: WHITE,
      });
      cover.drawText(s.legal_name, {
        x: MARGIN,
        y: PAGE_H - 110,
        size: 18,
        font,
        color: WHITE,
      });
      cover.drawText(`${s.type.toUpperCase()} - ${s.commune}${s.region ? ', ' + s.region : ''}`, {
        x: MARGIN,
        y: PAGE_H - 135,
        size: 11,
        font,
        color: WHITE,
      });
      cover.drawText(`Generado: ${new Date().toLocaleDateString('es-CL')}`, {
        x: MARGIN,
        y: PAGE_H - 155,
        size: 10,
        font,
        color: WHITE,
      });

      let coverY = PAGE_H - 220;

      if (s.mission) {
        cover.drawText('Mision', {
          x: MARGIN,
          y: coverY,
          size: 13,
          font: fontBold,
          color: TEXT_DARK,
        });
        coverY -= 20;
        const missionLines = wrapText(s.mission, 90);
        for (const line of missionLines.slice(0, 6)) {
          cover.drawText(line, { x: MARGIN, y: coverY, size: 10, font, color: TEXT_BODY });
          coverY -= 14;
        }
        coverY -= 10;
      }

      // KPIs box
      cover.drawRectangle({
        x: MARGIN,
        y: coverY - 80,
        width: CONTENT_W,
        height: 80,
        color: PURPLE_SOFT,
      });
      const kpiX = MARGIN + 20;
      cover.drawText(`${pets.length}`, {
        x: kpiX,
        y: coverY - 35,
        size: 28,
        font: fontBold,
        color: PURPLE,
      });
      cover.drawText('en custodia hoy', {
        x: kpiX,
        y: coverY - 55,
        size: 10,
        font,
        color: TEXT_MUTED,
      });

      cover.drawText(`${s.total_pets_adopted}`, {
        x: kpiX + 170,
        y: coverY - 35,
        size: 28,
        font: fontBold,
        color: EMERALD,
      });
      cover.drawText('adoptadas historico', {
        x: kpiX + 170,
        y: coverY - 55,
        size: 10,
        font,
        color: TEXT_MUTED,
      });

      const totalEver = s.total_pets_adopted + pets.length;
      const adoptionPct = totalEver > 0 ? Math.round((s.total_pets_adopted / totalEver) * 100) : 0;
      cover.drawText(`${adoptionPct}%`, {
        x: kpiX + 340,
        y: coverY - 35,
        size: 28,
        font: fontBold,
        color: PURPLE,
      });
      cover.drawText('tasa adopcion', {
        x: kpiX + 340,
        y: coverY - 55,
        size: 10,
        font,
        color: TEXT_MUTED,
      });
      coverY -= 100;

      // Contacto
      cover.drawText('Contacto', {
        x: MARGIN,
        y: coverY,
        size: 13,
        font: fontBold,
        color: TEXT_DARK,
      });
      coverY -= 18;
      const contactLines: string[] = [];
      if (s.contact_email) contactLines.push(`Email: ${s.contact_email}`);
      if (s.contact_phone) contactLines.push(`Telefono: ${s.contact_phone}`);
      if (s.website) contactLines.push(`Web: ${s.website}`);
      if (s.slug) contactLines.push(`Perfil publico: pawfriend.cl/refugios/${s.slug}`);
      for (const line of contactLines) {
        cover.drawText(line, { x: MARGIN, y: coverY, size: 10, font, color: TEXT_BODY });
        coverY -= 14;
      }

      drawFooter(cover, font, 1, 0, s.legal_name, s.slug);

      // --- Listado de mascotas (2 por pagina para legibilidad) ---
      const petsPerPage = 2;
      const totalPages = 1 + Math.max(1, Math.ceil(pets.length / petsPerPage));
      let pageIdx = 1;

      if (pets.length === 0) {
        const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        page.drawText('Sin mascotas en custodia al momento', {
          x: MARGIN,
          y: PAGE_H - 100,
          size: 14,
          font: fontBold,
          color: TEXT_DARK,
        });
        page.drawText('Cuando ingreses mascotas al refugio desde Paw Friend, apareceran aqui.', {
          x: MARGIN,
          y: PAGE_H - 125,
          size: 10,
          font,
          color: TEXT_MUTED,
        });
        drawFooter(page, font, 2, totalPages, s.legal_name, s.slug);
      } else {
        for (let i = 0; i < pets.length; i += petsPerPage) {
          pageIdx += 1;
          const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
          page.drawText('Mascotas buscando hogar', {
            x: MARGIN,
            y: PAGE_H - 60,
            size: 16,
            font: fontBold,
            color: PURPLE,
          });
          page.drawLine({
            start: { x: MARGIN, y: PAGE_H - 70 },
            end: { x: PAGE_W - MARGIN, y: PAGE_H - 70 },
            thickness: 1,
            color: BORDER,
          });

          const slice = pets.slice(i, i + petsPerPage);
          let y = PAGE_H - 100;
          for (const pet of slice) {
            // Card rectangle
            page.drawRectangle({
              x: MARGIN,
              y: y - 280,
              width: CONTENT_W,
              height: 280,
              borderColor: BORDER,
              borderWidth: 1,
              color: EMERALD_SOFT,
              opacity: 0.3,
            });

            // Nombre
            page.drawText(pet.name, {
              x: MARGIN + 16,
              y: y - 30,
              size: 20,
              font: fontBold,
              color: TEXT_DARK,
            });

            // Chips: especie, edad, sexo
            const chips = [
              pet.species || 'animal',
              ageLabel(pet.birth_date),
              pet.sex === 'male' ? 'macho' : pet.sex === 'female' ? 'hembra' : 'sexo no registrado',
            ];
            let chipX = MARGIN + 16;
            const chipY = y - 52;
            for (const chip of chips) {
              const chipW = chip.length * 5.5 + 14;
              page.drawRectangle({
                x: chipX,
                y: chipY - 3,
                width: chipW,
                height: 16,
                color: PURPLE_SOFT,
              });
              page.drawText(chip, {
                x: chipX + 7,
                y: chipY,
                size: 9,
                font,
                color: PURPLE,
              });
              chipX += chipW + 6;
            }

            if (pet.breed) {
              page.drawText(`Raza: ${pet.breed}`, {
                x: MARGIN + 16,
                y: y - 80,
                size: 10,
                font,
                color: TEXT_BODY,
              });
            }

            if (pet.description) {
              const descLines = wrapText(pet.description, 80);
              let descY = y - 105;
              for (const line of descLines.slice(0, 9)) {
                page.drawText(line, {
                  x: MARGIN + 16,
                  y: descY,
                  size: 10,
                  font,
                  color: TEXT_BODY,
                });
                descY -= 14;
              }
            }

            page.drawText('Como adoptar:', {
              x: MARGIN + 16,
              y: y - 245,
              size: 9,
              font: fontBold,
              color: TEXT_DARK,
            });
            const contactText = s.contact_email || s.contact_phone || 'Contactar refugio';
            page.drawText(`Contactanos: ${contactText}`, {
              x: MARGIN + 16,
              y: y - 260,
              size: 9,
              font,
              color: TEXT_BODY,
            });

            y -= 300;
          }

          drawFooter(page, font, pageIdx, totalPages, s.legal_name, s.slug);
        }
      }

      const pdfBytes = await pdfDoc.save();

      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="refugio-${s.slug || s.id}.pdf"`,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('generate-shelter-report-pdf error:', msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
