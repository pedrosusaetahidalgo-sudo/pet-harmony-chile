/**
 * Edge Function: Generate ZIP of all medical documents for a pet
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import JSZip from 'https://esm.sh/jszip@3.10.1';
import { checkAiQuota, rateLimitResponse } from '../_shared/rate-limit.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// Mapeo mime_type -> extension. Solo los que más vemos en medical documents.
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

// Sanitiza el nombre del archivo para que sea valido en cualquier OS
const safeName = (raw: string): string => raw.replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);

// Procesa documentos en chunks para no agotar memoria con muchos archivos
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error('User not authenticated');

    // ── Rate limit (3 req/min — ZIP generation is heaviest) ──
    const quota = await checkAiQuota(userData.user.id, { limit: 3, windowSeconds: 60 });
    if (!quota.allowed) {
      return rateLimitResponse(quota, corsHeaders);
    }

    const { pet_id } = await req.json();

    if (!pet_id || typeof pet_id !== 'string') {
      throw new Error('pet_id is required and must be a string');
    }

    // Ownership check
    const { data: petOwnership, error: ownershipError } = await supabase
      .from('pets')
      .select('owner_id')
      .eq('id', pet_id)
      .single();

    if (ownershipError || !petOwnership) {
      throw new Error('Pet not found');
    }
    if (petOwnership.owner_id !== userData.user.id) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Get all documents for the pet
    const { data: documents, error: docsError } = await supabase
      .from('medical_documents')
      .select('id, file_url, title, type, mime_type')
      .eq('pet_id', pet_id);

    if (docsError) throw docsError;

    if (!documents || documents.length === 0) {
      throw new Error('No documents found for this pet');
    }

    // Construir el ZIP en memoria. Procesamos en chunks de 5 para no saturar
    // si la mascota tiene muchos documentos.
    const zip = new JSZip();
    const usedNames = new Set<string>();

    await inChunks(documents, 5, async (doc) => {
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
      // Evitar duplicados de nombre dentro del ZIP
      let n = 2;
      while (usedNames.has(fileName)) {
        fileName = `${baseName}-${n}.${ext}`;
        n++;
      }
      usedNames.add(fileName);

      const arrayBuffer = await blob.arrayBuffer();
      zip.file(fileName, new Uint8Array(arrayBuffer));
    });

    if (Object.keys(zip.files).length === 0) {
      throw new Error('No se pudo descargar ningún documento de la mascota');
    }

    const zipBytes = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Subir el ZIP a Storage
    const zipPath = `zips/${pet_id}-${Date.now()}.zip`;
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
        document_count: Object.keys(zip.files).length,
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
});
