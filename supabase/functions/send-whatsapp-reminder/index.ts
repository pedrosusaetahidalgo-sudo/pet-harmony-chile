/**
 * Edge Function: send-whatsapp-reminder
 *
 * Envía un recordatorio via Meta WhatsApp Cloud API usando la plantilla
 * pre-aprobada `pet_reminder` (categoria Utility).
 *
 * Body:
 * {
 *   user_id: uuid,
 *   pet_name: string,
 *   reminder_type: string ("vacuna" | "control" | etc.),
 *   due_date: string (ISO o "mañana"/"hoy"),
 *   reminder_id?: uuid,        // para trackear en whatsapp_message_log
 *   appointment_id?: uuid
 * }
 *
 * Auth: NO requiere JWT del user (lo llama el cron). Verifica via service_role.
 *
 * Secrets requeridos:
 *   META_WA_ACCESS_TOKEN  (token permanente del System User)
 *   META_WA_PHONE_NUMBER_ID  (id del número de prueba o de produccion)
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://pawfriend.cl',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const META_GRAPH_VERSION = 'v21.0';

interface ReminderPayload {
  user_id: string;
  pet_name: string;
  reminder_type: string;
  due_date: string;
  reminder_id?: string;
  appointment_id?: string;
}

async function sendWhatsAppTemplate(
  accessToken: string,
  phoneNumberId: string,
  toPhone: string,
  ownerName: string,
  reminderType: string,
  petName: string,
  formattedDate: string
) {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: toPhone,
    type: 'template',
    template: {
      name: 'pet_reminder',
      language: { code: 'es' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: ownerName },
            { type: 'text', text: reminderType },
            { type: 'text', text: petName },
            { type: 'text', text: formattedDate },
          ],
        },
      ],
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(`Meta API ${resp.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('META_WA_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('META_WA_PHONE_NUMBER_ID');
    if (!accessToken || !phoneNumberId) {
      throw new Error('Meta WhatsApp credentials not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const payload = (await req.json()) as ReminderPayload;
    if (!payload.user_id || !payload.pet_name || !payload.reminder_type || !payload.due_date) {
      throw new Error('Missing required fields');
    }

    // Fetch profile para obtener teléfono y consentimiento
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('display_name, whatsapp_number, whatsapp_opted_in')
      .eq('id', payload.user_id)
      .maybeSingle();

    if (profileErr || !profile) {
      throw new Error('Profile not found');
    }
    if (!profile.whatsapp_opted_in || !profile.whatsapp_number) {
      // Silencioso: el user no acepto WhatsApp, no es error
      return new Response(JSON.stringify({ skipped: 'not_opted_in' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalizar telefono a E.164 sin signos (+569... -> 569...)
    const toPhone = profile.whatsapp_number.replace(/[^0-9]/g, '');
    if (toPhone.length < 10) {
      throw new Error('Invalid phone number format');
    }

    const ownerName = profile.display_name?.split(' ')[0] || 'Hola';

    // Formato de fecha legible
    let formattedDate = payload.due_date;
    try {
      const d = new Date(payload.due_date);
      formattedDate = d.toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
      });
    } catch {
      // dejar el string como vino
    }

    let metaResponse;
    let status: 'sent' | 'failed' = 'sent';
    let errorMessage: string | null = null;
    let metaMessageId: string | null = null;

    try {
      metaResponse = await sendWhatsAppTemplate(
        accessToken,
        phoneNumberId,
        toPhone,
        ownerName,
        payload.reminder_type,
        payload.pet_name,
        formattedDate
      );
      metaMessageId = metaResponse?.messages?.[0]?.id ?? null;
    } catch (err) {
      status = 'failed';
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    // Bitacora
    await supabase.from('whatsapp_message_log').insert({
      user_id: payload.user_id,
      template_name: 'pet_reminder',
      recipient_phone: toPhone,
      status,
      meta_message_id: metaMessageId,
      error_message: errorMessage,
      related_reminder_id: payload.reminder_id || null,
      related_appointment_id: payload.appointment_id || null,
    });

    if (status === 'failed') {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, meta_message_id: metaMessageId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[send-whatsapp-reminder] error', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
