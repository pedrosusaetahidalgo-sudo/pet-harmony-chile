/**
 * Edge Function: Generate ZIP of all medical documents for a pet — v2 (2026-04-19)
 *
 * Rediseño: el ZIP ahora incluye:
 *   1. README.txt con índice legible (nombre, tipo, fecha, tamaño)
 *   2. ficha-clinica.pdf generada on-the-fly (la joya de la corona dentro del bundle)
 *   3. Subcarpeta /documentos/ con los archivos subidos por el dueño o vet
 *
 * Esto transforma el ZIP de un bundle opaco a un paquete profesional que
 * se puede compartir con otro vet o especialista y entender al abrirlo.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import JSZip from 'https://esm.sh/jszip@3.10.1';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

const extFromMime = (mime: string | null | undefined): string => {
  if (!mime) return 'bin';
  return MIME_TO_EXT[mime.toLowerCase()] ?? 'bin';
};

const safeName = (raw: string): string => raw.replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
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

function pad(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return str + ' '.repeat(width - str.length);
}

async function inChunks<T, R>(
  items: T[],
  chunkSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const slice = items.slice(i, i + chunkSize);
    const out = await Promise.all(slice.map(fn));
    results.push(...out);
  }
  return results;
}

serve(
  withTelemetry('generate-medical-zip', async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Authenticate user
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('No authorization header');

      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new Error('User not authenticated');

      // Rate limit (3 req/min)
      const quota = await checkAiQuota(userData.user.id, { limit: 3, windowSeconds: 60 });
      if (!quota.allowed) return rateLimitResponse(quota, corsHeaders);

      const { pet_id } = await req.json();
      if (!pet_id || typeof pet_id !== 'string') {
        throw new Error('pet_id is required and must be a string');
      }

      // Ownership + linked-vet check
      const { data: petRow, error: petError } = await supabase
        .from('pets')
        .select('owner_id, name')
        .eq('id', pet_id)
        .single();

      if (petError || !petRow) throw new Error('Pet not found');

      const isOwner = petRow.owner_id === userData.user.id;
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

      // Get all documents for the pet
      const { data: documents } = await supabase
        .from('medical_documents')
        .select('id, file_url, title, type, mime_type, file_size, created_at')
        .eq('pet_id', pet_id)
        .order('created_at', { ascending: true });

      const docs = documents ?? [];

      // ── Build ZIP ──
      const zip = new JSZip();
      const usedNames = new Set<string>();

      // 1. Generar ficha PDF y agregarla en la raíz del ZIP
      let fichaBytes: Uint8Array | null = null;
      try {
        const fichaResp = await fetch(`${supabaseUrl}/functions/v1/generate-medical-summary`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pet_id, mode: 'complete' }),
        });
        if (fichaResp.ok) {
          const contentType = fichaResp.headers.get('content-type') || '';
          if (contentType.includes('pdf')) {
            const buf = await fichaResp.arrayBuffer();
            fichaBytes = new Uint8Array(buf);
            zip.file('ficha-clinica.pdf', fichaBytes);
          }
        }
      } catch (e) {
        console.warn('[medical-zip] no se pudo generar la ficha PDF:', e);
      }

      // 2. Procesar documentos subidos en subcarpeta /documentos/
      const docIndex: Array<{ name: string; type: string; date: string; size: string }> = [];

      await inChunks(docs, 5, async (doc) => {
        const { data: blob, error: dlError } = await supabase.storage
          .from('medical-documents')
          .download(doc.file_url);

        if (dlError || !blob) {
          console.warn('[medical-zip] no se pudo descargar', doc.id, dlError?.message);
          return;
        }

        const ext = extFromMime(doc.mime_type);
        const baseName = safeName(doc.title || doc.id);
        let fileName = `${baseName}.${ext}`;
        let n = 2;
        while (usedNames.has(fileName)) {
          fileName = `${baseName}-${n}.${ext}`;
          n++;
        }
        usedNames.add(fileName);

        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        zip.file(`documentos/${fileName}`, bytes);

        docIndex.push({
          name: fileName,
          type: doc.type || '-',
          date: formatDate(doc.created_at),
          size: formatBytes(bytes.byteLength),
        });
      });

      // 3. README.txt con índice legible
      const petName = petRow.name || 'mascota';
      const generatedAt = new Date().toLocaleString('es-CL', {
        dateStyle: 'long',
        timeStyle: 'short',
      });

      const readmeLines: string[] = [
        '════════════════════════════════════════════════════════════',
        `  PAW FRIEND — Expediente de ${petName}`,
        '════════════════════════════════════════════════════════════',
        '',
        `Generado: ${generatedAt}`,
        `Total de archivos: ${Object.keys(zip.files).length}`,
        '',
        'Contenido del paquete:',
        '────────────────────────────────────────────────────────────',
        '',
      ];

      if (fichaBytes) {
        readmeLines.push(
          '📄 ficha-clinica.pdf',
          '   Ficha clínica generada automáticamente por Paw Friend.',
          '   Incluye datos de la mascota, alertas clínicas, historial',
          '   cronológico, vacunación, peso histórico y rutinas.',
          ''
        );
      }

      if (docIndex.length > 0) {
        readmeLines.push(
          '📁 documentos/',
          '   Archivos originales subidos por el responsable o vet.',
          '',
          '   ' + pad('Archivo', 50) + pad('Tipo', 20) + pad('Fecha', 16) + 'Tamaño',
          '   ' + '─'.repeat(98)
        );
        for (const d of docIndex) {
          readmeLines.push('   ' + pad(d.name, 50) + pad(d.type, 20) + pad(d.date, 16) + d.size);
        }
        readmeLines.push('');
      }

      if (!fichaBytes && docIndex.length === 0) {
        readmeLines.push(
          '⚠️  Este expediente está vacío.',
          '   No se encontraron documentos médicos ni se pudo generar',
          '   la ficha clínica. Verifica que la mascota tenga registros',
          '   antes de descargar el ZIP.',
          ''
        );
      }

      readmeLines.push(
        '────────────────────────────────────────────────────────────',
        '',
        'Cómo usar este paquete:',
        '',
        '  • ficha-clinica.pdf es un resumen profesional listo para',
        '    compartir con veterinarios o especialistas.',
        '  • Los archivos en documentos/ son los originales subidos',
        '    (análisis, recetas, fotos, etc.).',
        '',
        'Contacto: pawfriend.cl',
        'Documento confidencial. No reemplaza un informe clínico profesional.',
        '',
        '════════════════════════════════════════════════════════════'
      );

      zip.file('README.txt', readmeLines.join('\n'));

      // Validación: si solo hay README (sin ficha ni docs), error
      const realFiles = Object.keys(zip.files).filter((f) => f !== 'README.txt');
      if (realFiles.length === 0) {
        throw new Error('No se pudo generar ningún contenido para el ZIP');
      }

      const zipBytes = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const safePet = petName
        .replace(/\s+/g, '-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      const zipPath = `zips/${safePet}-${Date.now()}.zip`;
      const { error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(zipPath, zipBytes, {
          contentType: 'application/zip',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = await supabase.storage
        .from('medical-documents')
        .createSignedUrl(zipPath, 3600);

      if (urlError) throw urlError;

      return new Response(
        JSON.stringify({
          success: true,
          download_url: urlData.signedUrl,
          file_path: zipPath,
          document_count: realFiles.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error: unknown) {
      console.error('Error generating medical ZIP:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se pudo generar el ZIP. Inténtalo de nuevo en unos minutos.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  })
);
