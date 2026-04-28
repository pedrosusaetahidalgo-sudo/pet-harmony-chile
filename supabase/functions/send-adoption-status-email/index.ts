/**
 * send-adoption-status-email — notifica al adopter cuando el shelter mueve
 * el status de un adoption_process en el kanban.
 *
 * Llamado desde el frontend (ShelterAdoptionsKanban) DESPUES del UPDATE.
 * No usamos pg_net trigger SQL porque queremos:
 *   - Auth context del shelter (RLS)
 *   - Errores visibles al user
 *   - Skipear emails de cambios sin valor (notes-only updates)
 *
 * Request: POST { process_id: UUID, new_status: string }
 * Response: { sent: boolean, email?: string }
 *
 * Templates por status:
 *   - contacted        → "[Shelter] te contactó por [Pet]"
 *   - visit_scheduled  → "Visita agendada para [Pet]"
 *   - visit_done       → "[Shelter] confirmó tu visita"
 *   - approved         → "¡Te aprobaron para adoptar a [Pet]!" 🎉
 *   - rejected         → "[Shelter] no pudo avanzar con tu solicitud"
 *   - transferred      → "[Pet] ya es tuyo, revisá tu correo"
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsOptions } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Status =
  | 'interested'
  | 'contacted'
  | 'visit_scheduled'
  | 'visit_done'
  | 'approved'
  | 'rejected'
  | 'transferred';

// Status que NO mandan email (interno o redundante)
const SILENT_STATUS: Status[] = ['interested'];

interface EmailTemplate {
  subject: string;
  preheader: string;
  body: (params: {
    petName: string;
    shelterName: string;
    adopterName: string;
    visitDate?: string | null;
    rejectedReason?: string | null;
    notes?: string | null;
  }) => string;
}

const TEMPLATES: Record<Exclude<Status, 'interested'>, EmailTemplate> = {
  contacted: {
    subject: '{shelter} te contactó por {pet}',
    preheader: 'El refugio quiere coordinar contigo',
    body: ({ petName, shelterName, adopterName, notes }) => `
      <p>Hola ${adopterName},</p>
      <p><strong>${shelterName}</strong> te contactó por tu interés en adoptar a <strong>${petName}</strong>.</p>
      ${notes ? `<p style="background:#f3f4f6;padding:12px;border-radius:6px"><em>"${notes}"</em></p>` : ''}
      <p>El siguiente paso suele ser agendar una visita. Atento a su mensaje por WhatsApp o correo.</p>
      <p>Puedes ver el estado del proceso en <a href="https://pawfriend.cl/mis-adopciones">tu cuenta de Paw Friend</a>.</p>
    `,
  },
  visit_scheduled: {
    subject: 'Visita agendada para {pet}',
    preheader: 'Tu visita con el refugio fue confirmada',
    body: ({ petName, shelterName, adopterName, visitDate, notes }) => `
      <p>Hola ${adopterName},</p>
      <p><strong>${shelterName}</strong> agendó una visita para que conozcas a <strong>${petName}</strong>.</p>
      ${visitDate ? `<p style="background:#ede9fe;padding:12px;border-radius:6px;color:#5b21b6"><strong>📅 ${visitDate}</strong></p>` : ''}
      ${notes ? `<p><em>${notes}</em></p>` : ''}
      <p>Si necesitas reagendar, contacta directamente al refugio.</p>
      <p>Detalles del proceso en <a href="https://pawfriend.cl/mis-adopciones">tu cuenta</a>.</p>
    `,
  },
  visit_done: {
    subject: '{shelter} registró tu visita a {pet}',
    preheader: 'Gracias por venir, próximos pasos',
    body: ({ petName, shelterName, adopterName, notes }) => `
      <p>Hola ${adopterName},</p>
      <p><strong>${shelterName}</strong> registró que ya tuviste tu visita con <strong>${petName}</strong>.</p>
      <p>Ahora ellos están evaluando si pueden avanzar contigo. Te avisamos apenas tomen una decisión.</p>
      ${notes ? `<p><em>${notes}</em></p>` : ''}
      <p>Mientras, puedes ver el proceso en <a href="https://pawfriend.cl/mis-adopciones">tu cuenta</a>.</p>
    `,
  },
  approved: {
    subject: '¡{shelter} te aprobó para adoptar a {pet}! 🎉',
    preheader: 'Felicidades, próximos pasos',
    body: ({ petName, shelterName, adopterName, notes }) => `
      <p>Hola ${adopterName},</p>
      <p style="font-size:18px;color:#16a34a"><strong>¡${shelterName} aprobó tu adopción de ${petName}!</strong> 🎉</p>
      <p>El siguiente paso es la transferencia: el refugio te va a enviar un link para reclamar la ficha clínica completa de ${petName} en tu cuenta de Paw Friend.</p>
      ${notes ? `<p style="background:#f0fdf4;padding:12px;border-radius:6px"><em>${notes}</em></p>` : ''}
      <p>Detalles en <a href="https://pawfriend.cl/mis-adopciones">tu cuenta</a>.</p>
    `,
  },
  rejected: {
    subject: '{shelter} no pudo avanzar con tu solicitud',
    preheader: 'Sobre tu interés en {pet}',
    body: ({ petName, shelterName, adopterName, rejectedReason }) => `
      <p>Hola ${adopterName},</p>
      <p>Te escribimos para avisarte que <strong>${shelterName}</strong> no pudo avanzar con tu solicitud de adopción para <strong>${petName}</strong>.</p>
      ${
        rejectedReason
          ? `<p style="background:#fef2f2;padding:12px;border-radius:6px;border-left:3px solid #dc2626"><strong>Motivo:</strong> ${rejectedReason}</p>`
          : ''
      }
      <p>Sabemos que no es la noticia que esperabas. En Paw Friend hay muchas mascotas esperando hogar — puedes <a href="https://pawfriend.cl/adoption">explorar otras opciones</a>.</p>
      <p>Gracias por considerar la adopción.</p>
    `,
  },
  transferred: {
    subject: '🐾 ¡${pet} ya es tuyo!',
    preheader: 'Reclama la ficha clínica',
    body: ({ petName, shelterName, adopterName }) => `
      <p>Hola ${adopterName},</p>
      <p style="font-size:18px;color:#16a34a"><strong>¡${petName} ya es oficialmente tuyo!</strong> 🐾</p>
      <p><strong>${shelterName}</strong> completó la transferencia. Te enviamos un correo aparte con el link para reclamar la ficha clínica completa de ${petName} en tu cuenta.</p>
      <p>Si no te llegó, revisa la carpeta de spam o ingresa a <a href="https://pawfriend.cl/mis-adopciones">tu cuenta</a>.</p>
      <p>Gracias por darle un hogar.</p>
    `,
  },
};

function fmtVisitDate(d: string | null | undefined): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleString('es-CL', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

function renderHtml(template: EmailTemplate, params: Parameters<EmailTemplate['body']>[0]): string {
  const body = template.body(params);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${template.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <span style="display:none;color:transparent;height:0;width:0;opacity:0">${template.preheader}</span>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f4f6;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <tr>
            <td style="background:#7c3aed;padding:18px 28px;color:#ffffff;font-weight:bold;letter-spacing:0.5px">
              🐾 Paw Friend
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#0f172a;font-size:15px;line-height:1.55">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#f9fafb;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb">
              Este correo es parte de tu proceso de adopción en Paw Friend. Si no esperabas este mensaje, puedes ignorarlo o responder este correo y te ayudamos.
              <br><br>
              <a href="https://pawfriend.cl" style="color:#7c3aed">pawfriend.cl</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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
    const process_id = body.process_id as string;
    const new_status = body.new_status as Status;

    if (!process_id || !new_status) {
      return new Response(JSON.stringify({ error: 'process_id and new_status required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Status sin email
    if (SILENT_STATUS.includes(new_status)) {
      return new Response(JSON.stringify({ sent: false, reason: 'silent_status' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const template = TEMPLATES[new_status as Exclude<Status, 'interested'>];
    if (!template) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Auth context del shelter
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

    // Cargar proceso + pet + shelter + adopter
    const { data: proc, error: procErr } = await admin
      .from('adoption_processes')
      .select(
        `
        id, status, notes_shelter, visit_date, rejected_reason, adopter_user_id, shelter_id, pet_id,
        pets!pet_id (name),
        adoption_centers!shelter_id (legal_name, user_id)
      `
      )
      .eq('id', process_id)
      .maybeSingle();

    if (procErr || !proc) {
      return new Response(JSON.stringify({ error: 'Process not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el caller es el shelter dueño del proceso
    const shelterUserId = (proc as Record<string, unknown>).adoption_centers as {
      user_id?: string;
    } | null;
    if (!shelterUserId || shelterUserId.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Email del adopter
    const { data: adopterUser } = await admin.auth.admin.getUserById(proc.adopter_user_id);
    const adopterEmail = adopterUser?.user?.email;
    if (!adopterEmail) {
      return new Response(JSON.stringify({ sent: false, reason: 'no_email' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Profile del adopter
    const { data: adopterProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', proc.adopter_user_id)
      .maybeSingle();
    const adopterName = (adopterProfile?.display_name as string) || 'tutor';

    const petData = (proc as Record<string, unknown>).pets as { name?: string } | null;
    const petName = petData?.name || 'tu mascota';
    const shelterData = (proc as Record<string, unknown>).adoption_centers as {
      legal_name?: string;
    } | null;
    const shelterName = shelterData?.legal_name || 'El refugio';

    const subject = template.subject.replace('{shelter}', shelterName).replace('{pet}', petName);

    const html = renderHtml(template, {
      petName,
      shelterName,
      adopterName,
      visitDate: fmtVisitDate(proc.visit_date as string | null),
      rejectedReason: (proc.rejected_reason as string) || null,
      notes: (proc.notes_shelter as string) || null,
    });

    // Enviar via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <no-reply@pawfriend.cl>';
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured', sent: false }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: adopterEmail,
        subject,
        html,
      }),
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      console.error('Resend error:', resendResp.status, errText);
      return new Response(JSON.stringify({ sent: false, error: `Resend ${resendResp.status}` }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sent: true, email: adopterEmail }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('send-adoption-status-email error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
