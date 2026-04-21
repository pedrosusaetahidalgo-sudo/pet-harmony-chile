/**
 * Edge Function: send-lead-outreach
 * Envía outreach con email HTML profesional (logo, branding) a leads veterinarios.
 * Solo accesible por admin autenticado.
 *
 * Para WhatsApp: retorna URLs wa.me para envío manual (API Meta pendiente).
 *
 * 2026-04-21: refactor a sistema unificado `_shared/email-*`. Fix: logo URL
 * que apuntaba a `/lovable-uploads/*.png` (legacy, inconsistente con brand
 * v2) ahora usa el logo canónico. Paleta indigo → púrpura oficial.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';
import {
  bulletList,
  cta,
  emailFooter,
  emailHeader,
  paragraph,
  section,
} from '../_shared/email-blocks.ts';
import { escapeHtml, renderEmail } from '../_shared/email-layout.ts';
import { BRAND, NEUTRAL, SIZE, SPACE, TAGLINE } from '../_shared/email-theme.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const REGISTRO_VET_URL = 'https://pawfriend.cl/registro-veterinario';

interface OutreachRequest {
  lead_ids: string[];
  canal: 'email' | 'whatsapp';
  template: string;
  asunto?: string;
}

/**
 * Convierte un template de texto plano (con líneas en blanco = párrafos,
 * líneas que empiezan con `-` = bullets, líneas UPPER = headers) en bloques
 * del sistema de email compartido.
 *
 * Estrategia:
 *  - Bloques separados por doble \n
 *  - Si el bloque contiene líneas con `-`, usamos bulletList
 *  - Si es UPPER en su totalidad, lo tratamos como eyebrow
 *  - Resto: paragraph con links autodetectados (linkify en HTML seguro)
 */
function templateToBlocks(mensajeTexto: string): string {
  const chunks = mensajeTexto.split('\n\n').filter((c) => c.trim().length > 0);
  const out: string[] = [];
  for (const chunk of chunks) {
    const lines = chunk.split('\n');
    const bulletLines = lines.filter((l) => l.trim().startsWith('-'));

    // Es una lista si al menos la mitad de las líneas son bullets
    if (bulletLines.length >= 2 && bulletLines.length >= lines.length - 1) {
      const intro = lines.find((l) => !l.trim().startsWith('-'))?.trim();
      if (intro) out.push(paragraph(intro));
      out.push(
        bulletList({
          items: bulletLines.map((l) => ({
            icon: '✓',
            text: l.replace(/^\s*-\s*/, '').trim(),
          })),
        })
      );
      continue;
    }

    // Header UPPER
    const trimmed = chunk.trim();
    if (trimmed === trimmed.toUpperCase() && trimmed.length < 60 && !trimmed.includes('http')) {
      out.push(
        section(
          `<p style="margin:0;color:${BRAND[700]};font-size:${SIZE.sm};font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${escapeHtml(trimmed)}</p>`,
          `${SPACE.xl} ${SPACE['2xl']} ${SPACE.sm}`
        )
      );
      continue;
    }

    // Párrafo normal con linkify seguro (primero escapamos, después
    // convertimos las URLs escapadas en <a>)
    const escaped = escapeHtml(trimmed);
    const linkified = escaped.replace(
      /(https?:\/\/[^\s&<>"]+)/g,
      (m) =>
        `<a href="${m}" target="_blank" rel="noopener noreferrer" style="color:${BRAND[700]};text-decoration:underline;">${m}</a>`
    );
    out.push(
      section(
        `<p style="margin:0;color:${NEUTRAL[700]};font-size:${SIZE.md};line-height:1.6;">${linkified}</p>`,
        `${SPACE.sm} ${SPACE['2xl']}`
      )
    );
  }
  return out.join('');
}

/** Genera el HTML del email con branding Paw Friend */
function buildEmailHTML(_nombre: string, _comunas: string, mensajeTexto: string): string {
  const body = [
    emailHeader({
      variant: 'logo',
      tagline: TAGLINE.vet,
    }),
    templateToBlocks(mensajeTexto),
    cta({
      text: 'Crear mi perfil veterinario gratis',
      url: REGISTRO_VET_URL,
      hint: 'Plan Básica gratuito · 5 pacientes · sin comisión de suscripción',
    }),
    emailFooter({
      note: 'Recibes este correo porque tu perfil profesional aparece en directorios públicos.',
      secondary: 'Si no deseas recibir más correos, responde con "No me contacten".',
    }),
  ].join('');

  return renderEmail({
    title: 'Paw Friend — tu perfil veterinario gratis',
    preheader:
      'Los dueños de mascotas de Chile buscan vet todos los días. Tu ficha digital te posiciona primero.',
    body,
    width: 'wide',
  });
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
