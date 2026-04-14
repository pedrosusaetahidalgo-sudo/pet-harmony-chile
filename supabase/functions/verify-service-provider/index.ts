import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  callClaude,
  parseJSON,
  handleEdgeFunctionError,
} from '../_shared/ai-base.ts';

/*
 * verify-service-provider
 *
 * Auto-validates verification requests using AI:
 * - Non-vets: checks profile completeness (bio, photo, notes)
 * - Vets: OCR of title document + name matching with profile
 *
 * Called after inserting a verification_request.
 * Uses service role key (no user auth needed — called server-side or from trigger).
 */

interface VerificationResult {
  approved: boolean;
  confidence: number; // 0-100
  reason: string;
  checks: {
    name_match?: boolean;
    document_readable?: boolean;
    profile_complete?: boolean;
    notes_adequate?: boolean;
  };
  suggestions: string[];
}

const FALLBACK_RESULT: VerificationResult = {
  approved: false,
  confidence: 0,
  reason: 'No se pudo procesar la verificación automática. Será revisada manualmente.',
  checks: {},
  suggestions: ['Espera la revisión manual de nuestro equipo.'],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: accept both user token and service role calls
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Authorization required', 401);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { verification_request_id } = await req.json();
    if (!verification_request_id) {
      return errorResponse('verification_request_id is required', 400);
    }

    // 1. Load the verification request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from('verification_requests')
      .select('*')
      .eq('id', verification_request_id)
      .maybeSingle();

    if (reqErr || !request) {
      return errorResponse('Verification request not found', 404);
    }

    if (request.status !== 'pendiente') {
      return jsonResponse({ message: 'Already processed', status: request.status });
    }

    // 2. Load user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name, avatar_url, bio')
      .eq('id', request.user_id)
      .maybeSingle();

    // 3. Load service provider profile if exists
    const { data: provider } = await supabaseAdmin
      .from('service_providers')
      .select(
        'display_name, bio, avatar_url, experience_years, specialties, service_areas, license_number'
      )
      .eq('user_id', request.user_id)
      .maybeSingle();

    const displayName = provider?.display_name || profile?.display_name || 'Sin nombre';
    const bio = provider?.bio || profile?.bio || '';
    const hasPhoto = !!(provider?.avatar_url || profile?.avatar_url);
    const notes = request.notes || '';
    const documentUrls: string[] = request.document_urls || [];
    const role = request.requested_role;

    // 4. Route by role type
    let result: VerificationResult;

    if (role === 'veterinarian') {
      result = await verifyVeterinarian(
        displayName,
        bio,
        hasPhoto,
        notes,
        documentUrls,
        provider,
        supabaseAdmin
      );
    } else {
      result = await verifyServiceProvider(
        role,
        displayName,
        bio,
        hasPhoto,
        notes,
        documentUrls,
        provider
      );
    }

    // 5. Update verification request
    const newStatus = result.approved ? 'aprobado' : 'rechazado';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      documents: {
        ai_verification: {
          result: result,
          verified_at: new Date().toISOString(),
          method: role === 'veterinarian' ? 'ai_ocr_name_match' : 'ai_profile_review',
        },
      },
    };

    await supabaseAdmin
      .from('verification_requests')
      .update(updateData)
      .eq('id', verification_request_id);

    // 6. If approved, grant the role
    if (result.approved) {
      // Insert role
      await supabaseAdmin.from('user_roles').upsert(
        {
          user_id: request.user_id,
          role: role,
        },
        { onConflict: 'user_id,role' }
      );

      // Create notification
      await supabaseAdmin.from('notifications').insert({
        user_id: request.user_id,
        type: 'verification_approved',
        title: '¡Tu solicitud fue aprobada!',
        body: `Ya puedes ofrecer tus servicios como ${getRoleLabel(role)} en Paw Friend.`,
        action_url: '/provider/dashboard',
        reference_id: verification_request_id,
      });
    } else {
      // Notify rejection with suggestions
      const suggestionText =
        result.suggestions.length > 0 ? ' ' + result.suggestions.join('. ') : '';
      await supabaseAdmin.from('notifications').insert({
        user_id: request.user_id,
        type: 'verification_rejected',
        title: 'Tu solicitud necesita ajustes',
        body: result.reason + suggestionText,
        action_url: '/profile',
        reference_id: verification_request_id,
      });
    }

    return jsonResponse({
      status: newStatus,
      verification: result,
    });
  } catch (error) {
    return handleEdgeFunctionError(error);
  }
});

// ============================================================
// Verify Veterinarian: OCR document + name match
// ============================================================

async function verifyVeterinarian(
  displayName: string,
  bio: string,
  hasPhoto: boolean,
  notes: string,
  documentUrls: string[],
  provider: Record<string, unknown> | null,
  supabaseAdmin: ReturnType<typeof createClient>
): Promise<VerificationResult> {
  if (documentUrls.length === 0) {
    return {
      approved: false,
      confidence: 100,
      reason:
        'No se adjuntó título profesional. Los veterinarios deben subir su título para ser verificados.',
      checks: { document_readable: false, name_match: false, profile_complete: false },
      suggestions: ['Sube una foto o PDF de tu título de Médico Veterinario.'],
    };
  }

  // Download the first document to analyze
  let imageBase64: string | null = null;
  let mediaType = 'image/jpeg';

  try {
    const docUrl = documentUrls[0];

    // If it's a Supabase storage URL, download it
    const response = await fetch(docUrl);
    if (!response.ok) throw new Error('Failed to download document');

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    mediaType = contentType;

    // For PDFs, we can't do vision directly — note this limitation
    if (contentType.includes('pdf')) {
      // PDF: Ask Claude to evaluate based on metadata only
      return await verifyVetWithoutOCR(displayName, bio, hasPhoto, notes, provider);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check size (max 10MB)
    if (bytes.length > 10 * 1024 * 1024) {
      return {
        approved: false,
        confidence: 80,
        reason: 'El documento es demasiado grande para procesar (máx 10MB).',
        checks: { document_readable: false },
        suggestions: ['Sube el documento en menor resolución o como JPG.'],
      };
    }

    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    imageBase64 = btoa(binary);
  } catch {
    // If download fails, fall back to profile-only verification
    return await verifyVetWithoutOCR(displayName, bio, hasPhoto, notes, provider);
  }

  // OCR + Name match via Claude Vision
  const systemPrompt = `Verificador título vet Chile. Analiza imagen documento.

Verificar: 1) Es título universitario/certificado veterinaria? 2) Nombre legible? 3) Coincide con "${displayName}"?

JSON: {"is_vet_title":true/false,"document_name":"o null","name_match":true/false,"confidence":0-100,"reason":"breve"}`;

  const aiResponse = await callClaude({
    systemPrompt,
    userMessage: 'Analiza este documento y verifica si es un título de veterinario válido.',
    maxTokens: 400,
    temperature: 0.1,
    images: [{ type: 'base64', media_type: mediaType, data: imageBase64 }],
  });

  const parsed = parseJSON<{
    is_vet_title: boolean;
    document_name: string | null;
    name_match: boolean;
    confidence: number;
    reason: string;
  }>(aiResponse, {
    is_vet_title: false,
    document_name: null,
    name_match: false,
    confidence: 0,
    reason: 'No se pudo analizar el documento.',
  });

  const profileComplete = !!bio && hasPhoto && (provider?.experience_years as number) > 0;

  // Decision logic
  const approved = parsed.is_vet_title && parsed.name_match && parsed.confidence >= 70;

  const suggestions: string[] = [];
  if (!parsed.is_vet_title)
    suggestions.push(
      'El documento no parece ser un título de veterinario. Sube tu título universitario.'
    );
  if (!parsed.name_match)
    suggestions.push(
      'El nombre en el documento no coincide con tu perfil. Verifica que tu nombre esté correcto.'
    );
  if (!profileComplete)
    suggestions.push(
      'Completa tu perfil profesional (bio, foto, experiencia) para mejor visibilidad.'
    );

  return {
    approved,
    confidence: parsed.confidence,
    reason: parsed.reason,
    checks: {
      name_match: parsed.name_match,
      document_readable: parsed.is_vet_title,
      profile_complete: profileComplete,
    },
    suggestions,
  };
}

async function verifyVetWithoutOCR(
  displayName: string,
  bio: string,
  hasPhoto: boolean,
  notes: string,
  provider: Record<string, unknown> | null
): Promise<VerificationResult> {
  // For PDFs or failed downloads, evaluate based on profile + notes only
  // Cannot auto-approve without document verification
  return {
    approved: false,
    confidence: 50,
    reason:
      'El documento subido es un PDF y no puede ser verificado automáticamente. Será revisado manualmente por nuestro equipo.',
    checks: {
      document_readable: false,
      name_match: false,
      profile_complete: !!bio && hasPhoto,
    },
    suggestions: [
      'Para verificación automática más rápida, sube una foto (JPG/PNG) de tu título.',
      'Tu solicitud será revisada manualmente en las próximas 24-48 horas.',
    ],
  };
}

// ============================================================
// Verify Non-Vet Service Provider: profile review
// ============================================================

async function verifyServiceProvider(
  role: string,
  displayName: string,
  bio: string,
  hasPhoto: boolean,
  notes: string,
  documentUrls: string[],
  provider: Record<string, unknown> | null
): Promise<VerificationResult> {
  const roleLabel = getRoleLabel(role);

  // Basic completeness checks (no AI needed)
  const checks = {
    profile_complete: false,
    notes_adequate: false,
    document_readable: documentUrls.length > 0,
  };

  // Profile completeness
  checks.profile_complete = !!displayName && displayName !== 'Sin nombre' && hasPhoto;

  // Notes should have some meaningful content
  checks.notes_adequate = notes.trim().length >= 20;

  // If basic checks fail, reject without AI
  if (!checks.document_readable) {
    return {
      approved: false,
      confidence: 100,
      reason: `Debes subir un documento de identidad para verificarte como ${roleLabel}.`,
      checks,
      suggestions: [
        'Sube una foto de tu cédula de identidad (puede ser con datos sensibles tapados).',
      ],
    };
  }

  if (!checks.profile_complete) {
    const suggestions: string[] = [];
    if (!displayName || displayName === 'Sin nombre') suggestions.push('Completa tu nombre.');
    if (!hasPhoto) suggestions.push('Sube una foto de perfil profesional.');
    return {
      approved: false,
      confidence: 90,
      reason: `Tu perfil está incompleto para verificarte como ${roleLabel}.`,
      checks,
      suggestions,
    };
  }

  // AI evaluation of notes + profile quality (uses Haiku — text classification, no vision needed)
  const systemPrompt = `Moderador Paw Friend Chile. Evaluar solicitud "${roleLabel}".

APROBAR: experiencia relevante mascotas, notas coherentes, nombre real, docs subidos.
RECHAZAR: spam, nombre falso, contenido inapropiado, sin docs.

JSON: {"approved":true/false,"confidence":0-100,"reason":"breve","suggestions":[]}`;

  const userMessage = `Solicitud de verificación como ${roleLabel}:
- Nombre: ${displayName}
- Bio: ${bio || '(sin bio)'}
- Notas: ${notes || '(sin notas)'}
- Tiene foto: ${hasPhoto ? 'Sí' : 'No'}
- Documentos subidos: ${documentUrls.length}`;

  try {
    const aiResponse = await callClaude({
      systemPrompt,
      userMessage,
      maxTokens: 200,
      temperature: 0.2,
      model: 'claude-3-haiku-20240307',
    });

    const parsed = parseJSON<{
      approved: boolean;
      confidence: number;
      reason: string;
      suggestions: string[];
    }>(aiResponse, {
      approved: false,
      confidence: 0,
      reason: 'No se pudo evaluar automáticamente.',
      suggestions: ['Tu solicitud será revisada manualmente.'],
    });

    return {
      ...parsed,
      checks: {
        ...checks,
        notes_adequate: parsed.approved,
      },
    };
  } catch {
    // AI unavailable: approve if basic checks pass (be lenient for non-vets)
    if (checks.profile_complete && checks.document_readable && notes.trim().length >= 10) {
      return {
        approved: true,
        confidence: 60,
        reason: 'Aprobado por verificación básica (revisión de IA no disponible).',
        checks: { ...checks, notes_adequate: true },
        suggestions: ['Completa tu perfil profesional para mejor visibilidad.'],
      };
    }
    return FALLBACK_RESULT;
  }
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    dog_walker: 'Paseador de Perros',
    dogsitter: 'Cuidador de Mascotas',
    veterinarian: 'Médico Veterinario',
    trainer: 'Entrenador Canino',
    groomer: 'Peluquero de Mascotas',
  };
  return labels[role] || role;
}
