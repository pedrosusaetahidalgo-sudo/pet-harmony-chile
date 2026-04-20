/**
 * Edge Function: send-lead-outreach
 * Envía outreach con email HTML profesional (logo, branding) a leads veterinarios.
 * Solo accesible por admin autenticado.
 *
 * Para WhatsApp: retorna URLs wa.me para envío manual (API Meta pendiente).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const REGISTRO_VET_URL = 'https://pawfriend.cl/registro-veterinario';
const LOGO_URL = 'https://pawfriend.cl/lovable-uploads/f78e7803-40e0-4194-9e66-80e4fce27093.png';

interface OutreachRequest {
  lead_ids: string[];
  canal: 'email' | 'whatsapp';
  template: string;
  asunto?: string;
}

/** Genera el HTML del email con branding Paw Friend */
function buildEmailHTML(nombre: string, comunas: string, mensajeTexto: string): string {
  // Convertir saltos de línea del template a párrafos HTML
  const parrafos = mensajeTexto
    .split('\n\n')
    .filter(Boolean)
    .map((p) => {
      // Detectar listas (líneas que empiezan con -)
      if (p.includes('\n-')) {
        const lines = p.split('\n');
        const intro = lines[0].startsWith('-')
          ? ''
          : `<p style="margin:0 0 8px;color:#334155;">${lines[0]}</p>`;
        const items = lines
          .filter((l) => l.startsWith('-'))
          .map((l) => `<li style="margin:4px 0;color:#334155;">${l.slice(1).trim()}</li>`)
          .join('');
        return `${intro}<ul style="margin:0 0 16px;padding-left:20px;">${items}</ul>`;
      }
      // Detectar headers (PARA TI, PARA LOS DUEÑOS, etc.)
      if (p === p.toUpperCase() && p.length < 60 && !p.includes('http')) {
        return `<p style="margin:20px 0 8px;font-weight:700;color:#4f46e5;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">${p}</p>`;
      }
      // Detectar links
      const withLinks = p.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" style="color:#4f46e5;text-decoration:underline;">$1</a>'
      );
      return `<p style="margin:0 0 12px;color:#334155;line-height:1.6;">${withLinks}</p>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header con logo -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
          <img src="${LOGO_URL}" alt="Paw Friend" width="60" height="60" style="border-radius:12px;margin-bottom:12px;" />
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Paw Friend</h1>
          <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">La plataforma veterinaria de Chile</p>
        </td></tr>

        <!-- Cuerpo del email -->
        <tr><td style="padding:32px 40px;">
          ${parrafos}
        </td></tr>

        <!-- CTA Button -->
        <tr><td style="padding:0 40px 32px;" align="center">
          <a href="${REGISTRO_VET_URL}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            Crear mi perfil veterinario gratis
          </a>
        </td></tr>

        <!-- Separador -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" /></td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;text-align:center;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
            Paw Friend — pawfriend.cl
          </p>
          <p style="margin:0;color:#cbd5e1;font-size:11px;">
            Recibes este correo porque tu perfil profesional aparece en directorios publicos.
            <br/>Si no deseas recibir mas correos, responde con "No me contacten".
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(
  withTelemetry('send-lead-outreach', async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const supabaseUser = createClient(SUPABASE_URL, authHeader.replace('Bearer ', ''), {
        global: { headers: { Authorization: authHeader } },
      });

      const {
        data: { user },
      } = await supabaseUser.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: adminCheck } = await supabaseAdmin
        .from('admin_access')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!adminCheck) {
        return new Response(JSON.stringify({ error: 'Se requiere rol admin' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body: OutreachRequest = await req.json();
      const { lead_ids, canal, template, asunto } = body;

      if (!lead_ids?.length || !canal || !template) {
        return new Response(JSON.stringify({ error: 'Faltan parametros' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: leads, error: leadsError } = await supabaseAdmin

        .schema('leads' as unknown as string)
        .from('vet_profesionales')
        .select('id, nombre_completo, email, whatsapp, comunas_cobertura')
        .in('id', lead_ids);

      if (leadsError) {
        console.error('Error obteniendo leads:', leadsError);
        return new Response(JSON.stringify({ error: leadsError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let enviados = 0;
      let errores = 0;
      const resultados: { id: string; status: string; detail?: string }[] = [];

      for (const lead of leads || []) {
        const nombre = lead.nombre_completo?.split(' ')[0] || '';
        const comunas = (lead.comunas_cobertura || []).join(', ') || 'tu zona';
        const mensajeTexto = template.replace(/{nombre}/g, nombre).replace(/{comunas}/g, comunas);

        if (canal === 'email') {
          if (!lead.email) {
            errores++;
            resultados.push({ id: lead.id, status: 'skipped', detail: 'Sin email' });
            continue;
          }

          if (!RESEND_API_KEY) {
            // Sin Resend: fallback a mailto link
            const mailtoUrl = `mailto:${lead.email}?subject=${encodeURIComponent(asunto || 'Invitacion Paw Friend')}&body=${encodeURIComponent(mensajeTexto)}`;
            resultados.push({ id: lead.id, status: 'mailto_link', detail: mailtoUrl });
            enviados++;
            continue;
          }

          try {
            const htmlEmail = buildEmailHTML(nombre, comunas, mensajeTexto);
            const emailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                // from: dominio verificado en Resend. Mantener pawfriend.cl.
                // reply_to: correo de contacto oficial para que las
                // respuestas del vet lleguen a Pedro directamente.
                from: 'Paw Friend <hola@pawfriend.cl>',
                reply_to: ['pedrosusaeta@pawfriend.cl'],
                to: [lead.email],
                subject: asunto || 'Paw Friend te invita: tu perfil veterinario gratis',
                html: htmlEmail,
                text: mensajeTexto, // Fallback texto plano
              }),
            });

            if (emailRes.ok) {
              enviados++;
              resultados.push({ id: lead.id, status: 'sent' });
            } else {
              const errDetail = await emailRes.text();
              errores++;
              resultados.push({ id: lead.id, status: 'error', detail: errDetail });
            }
          } catch (e) {
            errores++;
            resultados.push({ id: lead.id, status: 'error', detail: String(e) });
          }
        } else if (canal === 'whatsapp') {
          if (!lead.whatsapp) {
            errores++;
            resultados.push({ id: lead.id, status: 'skipped', detail: 'Sin WhatsApp' });
            continue;
          }
          const waUrl = `https://wa.me/${lead.whatsapp.replace('+', '')}?text=${encodeURIComponent(mensajeTexto)}`;
          enviados++;
          resultados.push({ id: lead.id, status: 'wa_link', detail: waUrl });
        }

        // Registrar contacto
        await supabaseAdmin.rpc('registrar_contacto_lead', {
          p_lead_id: lead.id,
          p_canal: canal,
          p_notas: `Invitacion ${canal} enviada via admin`,
          p_template: canal === 'email' ? 'invitacion_email' : 'invitacion_whatsapp',
        });

        if (canal === 'email') {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      return new Response(JSON.stringify({ enviados, errores, resultados }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Error en send-lead-outreach:', e);
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
