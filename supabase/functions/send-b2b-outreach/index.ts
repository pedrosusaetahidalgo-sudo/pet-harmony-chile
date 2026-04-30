/**
 * Edge Function: send-b2b-outreach
 *
 * Outreach masivo a prospectos B2B (pharma, seguros, retail, gobierno,
 * banca, edificios, long-tail). Solo admin. Envia email con el pitch
 * deck especifico de la audiencia + CTA al form /aplicar?tipo=...
 *
 * Diferencia con send-lead-outreach:
 *  - send-lead-outreach apunta a vets individuales (tabla `leads.vet_profesionales`)
 *  - send-b2b-outreach apunta a empresas B2B (sin tabla, recibe lista raw)
 *
 * Cierra Task #8 del top 10 audit-readiness 2026-04-30. Convierte el
 * cuello de botella "outreach manual" en clicks desde Admin.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withTelemetry } from '../_shared/telemetry.ts';
import { bulletList, cta, emailFooter, emailHeader, paragraph } from '../_shared/email-blocks.ts';
import { renderEmail } from '../_shared/email-layout.ts';
import { TAGLINE } from '../_shared/email-theme.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type AudienceKind =
  | 'pharma'
  | 'seguros'
  | 'retail'
  | 'gobierno'
  | 'banca'
  | 'edificios'
  | 'longtail';

interface OutreachRecipient {
  email: string;
  contact_name?: string;
  company?: string;
}

interface OutreachRequest {
  audience: AudienceKind;
  recipients: OutreachRecipient[];
  custom_subject?: string;
  custom_intro?: string;
}

const AUDIENCE_CONFIG: Record<
  AudienceKind,
  {
    subject: string;
    headline: string;
    pitch: string;
    bullets: string[];
    cta_text: string;
    cta_url: string;
    deck_url: string;
  }
> = {
  pharma: {
    subject:
      'Paw Friend — acceso programatico a la ficha clinica longitudinal de mascotas chilenas',
    headline: 'API B2B con datos agregados de salud animal',
    pitch:
      'Construimos la infraestructura digital de la mascota chilena. Hoy operamos con codigo end-to-end listo en 7 motores B2B, y el motor #1 es nuestra API publica para pharma animal con 4 endpoints (breed_stats, species_stats, correlations, risk_score).',
    bullets: [
      'Auth via X-Pawfriend-Api-Key, onboarding self-service en /aplicar?tipo=b2b_api',
      'Datos agregados anonimizados con consent opt-in del owner (Ley 19.628 + 21.719)',
      'Pricing B2B de acceso a la ficha: el dueno no paga por la base, vos pagas por acceso',
      'Casos de uso: targeting de campanas, validacion de eficacia, deteccion de sub-poblaciones',
    ],
    cta_text: 'Postular a programa partner pharma',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=b2b_api',
    deck_url: 'https://pawfriend.cl/pitch-inversionistas/01_PHARMA_B2B.html',
  },
  seguros: {
    subject: 'Paw Friend — distribucion white-label de seguros para mascotas con risk score real',
    headline: 'Cotizador embebido + lead capture + risk score por raza',
    pitch:
      'Tenemos 3 motores activos para aseguradoras pet en Chile (Sura, BCI, Mapfre seed). Cotizador integrado en la ficha clinica con risk score basado en raza/edad/condiciones, lead capture transaccional con email automatico al partner, y data agregada para validacion de portafolio.',
    bullets: [
      'Cotizador en /cotizar-seguro/:petId — owner ya tiene la mascota cargada',
      'Risk score precomputado: edad, especie, raza, esterilizacion, condiciones cronicas',
      'Lead capture vivo: form -> email transaccional -> CRM partner',
      'Distribucion B2B2C (no Marsh ni broker tradicional): el owner recibe el pitch en contexto',
    ],
    cta_text: 'Postular como aseguradora partner',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=seguros',
    deck_url: 'https://pawfriend.cl/pitch-inversionistas/02_ASEGURADORAS.html',
  },
  retail: {
    subject: 'Paw Friend — canal de adquisicion contextual para retail pet',
    headline: 'Catalogo personalizado + tracking de clicks + revenue share',
    pitch:
      'Master Dog, Puppis y Pet Star ya estan seed en nuestra base. La mecanica es simple: el owner abre la ficha de su mascota, ve el catalogo de productos partner con descuento Paw Member, hace click, partner recibe el lead atribuido + revenue share de la conversion.',
    bullets: [
      'Catalogo en /tienda/:petId/:partnerSlug — contextual a especie/raza/edad',
      'Click tracking via SECURITY DEFINER RPC (anti-spam by design)',
      'Revenue share configurable por SKU + partner',
      'Reportes de attribution mensual + dashboard partner',
    ],
    cta_text: 'Postular como retail partner',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=retail',
    deck_url: 'https://pawfriend.cl/pitch-inversionistas/03_RETAIL.html',
  },
  gobierno: {
    subject: 'Paw Friend — registro digital Ley 21.020 white-label para municipios',
    headline: 'Infraestructura digital para tenencia responsable',
    pitch:
      'La Ley 21.020 obliga a las municipalidades a llevar un registro de mascotas con microchip, vacunas y tenedor responsable. Ningun municipio chileno tiene esto digital y centralizado. Nosotros si — lo tenemos en produccion para owners que se inscriben voluntariamente.',
    bullets: [
      'Ficha clinica longitudinal con vacunas, microchip, esterilizacion',
      'Geolocalizacion por comuna + reportes de cobertura',
      'Modelo B2G: el municipio paga la implementacion, el ciudadano usa gratis',
      'Onboarding masivo: bulk import desde Excel, validacion via veterinario partner',
    ],
    cta_text: 'Solicitar demo municipal',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=gobierno_municipio',
    deck_url: 'https://pawfriend.cl/pitch-inversionistas/04_GOBIERNO.html',
  },
  banca: {
    subject: 'Paw Friend — beneficio diferencial para clientes premium con mascota',
    headline: 'Suscripcion Paw Member como benefit corporativo',
    pitch:
      'Los bancos premium (Santander, BCI, Itau, Falabella) compiten por segmentar clientes high-value con beneficios reales. La mascota es un activo emocional con alto LTV de gasto (USD 1.5k/ano promedio en Chile). Nosotros entregamos la membership completa.',
    bullets: [
      'Paw Member: ficha clinica premium + descuentos retail + acceso prioritario vets',
      'White-label para co-branding (tarjeta + landing)',
      'Reporte mensual de uso por segmento (engagement metrics)',
      'Tier de banca empresarial: empleados con mascota + benefit corporativo',
    ],
    cta_text: 'Solicitar partnership banca',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=banca',
    deck_url: 'https://pawfriend.cl/pitch-inversionistas/05_BANCA.html',
  },
  edificios: {
    subject: 'Paw Friend — registro digital de mascotas para comunidades pet-friendly',
    headline: 'SaaS B2B para inmobiliarias y administradoras de edificios',
    pitch:
      'Edificios pet-friendly hoy llevan el registro de mascotas en Excel o WhatsApp. Nosotros entregamos un SaaS dedicado: cada propietario registra su mascota con ficha clinica + microchip + comportamiento, la administracion tiene dashboard global, y los vecinos ven solo lo publico.',
    bullets: [
      'Onboarding por edificio: codigo de invitacion + branding propio',
      'Reglamento digital + firmas de aceptacion automatizadas',
      'Reportes de cobertura de vacunas + esterilizacion (compliance)',
      'Modelo SaaS: $X CLP/unidad/mes facturado a la administracion',
    ],
    cta_text: 'Solicitar partnership inmobiliario',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=edificios',
    deck_url: 'https://pawfriend.cl/pitch-inversionistas/06_EDIFICIOS.html',
  },
  longtail: {
    subject: 'Paw Friend — alianza vertical para empresas pet-adjacent',
    headline: 'Aerolineas, academias vet, refugios privados, y mas',
    pitch:
      'Hay un long-tail de empresas que tocan el ecosistema mascota sin ser pharma/seguro/retail tradicional: aerolineas (Latam Cargo), academias veterinarias, fundaciones privadas, ferias pet, agroindustria. Para todas tenemos un modulo dedicado de partnership.',
    bullets: [
      'Acuerdos custom: data, distribucion, eventos, training',
      'Co-marketing en feed + newsletter Paw Friend',
      'Acceso a metricas agregadas de tu vertical especifico',
      'Ejecucion rapida: pitch -> firma -> integracion en <30 dias',
    ],
    cta_text: 'Postular partnership vertical',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=longtail',
    deck_url: 'https://pawfriend.cl/pitch-inversionistas/PITCH_7_MOTORES_CONSTRUIDOS.html',
  },
};

function buildEmailHTML(
  audience: AudienceKind,
  contactName: string,
  company: string,
  customIntro?: string
): string {
  const cfg = AUDIENCE_CONFIG[audience];

  const greeting = contactName
    ? `Hola ${contactName},`
    : company
      ? `Hola equipo ${company},`
      : 'Hola,';

  const intro = customIntro || cfg.pitch;

  const body = [
    emailHeader({
      variant: 'logo',
      tagline: TAGLINE.b2b ?? 'Infraestructura digital de la mascota chilena',
    }),
    paragraph(greeting),
    paragraph(`<strong>${cfg.headline}</strong>`),
    paragraph(intro),
    bulletList({
      items: cfg.bullets.map((b) => ({ icon: '✓', text: b })),
    }),
    cta({
      text: cfg.cta_text,
      url: cfg.cta_url,
      hint: `Pitch deck completo: <a href="${cfg.deck_url}" style="color:inherit;text-decoration:underline;">${cfg.deck_url}</a>`,
    }),
    paragraph(
      'Si te interesa coordinar una llamada de 30 min para una demo en vivo, responde este correo y te paso disponibilidad esta semana.'
    ),
    paragraph('— Pedro Susaeta, Paw Friend'),
    emailFooter({
      note: 'Recibes este correo porque tu rol corresponde a una de las verticales B2B objetivo del producto.',
      secondary: 'Si no deseas recibir mas correos, responde con "No me contacten".',
    }),
  ].join('');

  return renderEmail({
    title: cfg.subject,
    preheader: cfg.headline,
    body,
    width: 'wide',
  });
}

Deno.serve(
  withTelemetry('send-b2b-outreach', async (req) => {
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
      const { audience, recipients, custom_subject, custom_intro } = body;

      if (!audience || !AUDIENCE_CONFIG[audience]) {
        return new Response(JSON.stringify({ error: 'audience invalido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return new Response(JSON.stringify({ error: 'recipients vacio' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (recipients.length > 100) {
        return new Response(JSON.stringify({ error: 'Max 100 recipients por batch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const cfg = AUDIENCE_CONFIG[audience];
      const subject = custom_subject || cfg.subject;

      let enviados = 0;
      let errores = 0;
      const resultados: { email: string; status: string; detail?: string }[] = [];

      for (const recipient of recipients) {
        if (!recipient.email || !recipient.email.includes('@')) {
          errores++;
          resultados.push({ email: recipient.email || 'sin email', status: 'skipped' });
          continue;
        }

        if (!RESEND_API_KEY) {
          // Fallback a mailto link si no hay Resend configurado
          const mailtoUrl = `mailto:${recipient.email}?subject=${encodeURIComponent(subject)}`;
          resultados.push({ email: recipient.email, status: 'mailto_link', detail: mailtoUrl });
          enviados++;
          continue;
        }

        try {
          const htmlEmail = buildEmailHTML(
            audience,
            recipient.contact_name || '',
            recipient.company || '',
            custom_intro
          );

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Pedro Susaeta — Paw Friend <hola@pawfriend.cl>',
              reply_to: ['pedrosusaeta@pawfriend.cl'],
              to: [recipient.email],
              subject,
              html: htmlEmail,
              text: cfg.pitch,
            }),
          });

          if (emailRes.ok) {
            enviados++;
            resultados.push({ email: recipient.email, status: 'sent' });

            // Log en tabla outreach_log si existe
            await supabaseAdmin
              .from('b2b_outreach_log')
              .insert({
                audience,
                recipient_email: recipient.email,
                recipient_name: recipient.contact_name || null,
                recipient_company: recipient.company || null,
                subject,
                sent_by: user.id,
                status: 'sent',
              })
              .then(() => {})
              .catch(() => {
                // Tabla no existe aun, no es bloqueante
              });
          } else {
            const errDetail = await emailRes.text();
            errores++;
            resultados.push({ email: recipient.email, status: 'error', detail: errDetail });
          }
        } catch (e) {
          errores++;
          resultados.push({ email: recipient.email, status: 'error', detail: String(e) });
        }

        // Rate limit Resend (10 req/s)
        await new Promise((r) => setTimeout(r, 200));
      }

      return new Response(
        JSON.stringify({
          enviados,
          errores,
          total: recipients.length,
          audience,
          resultados,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      console.error('Error en send-b2b-outreach:', e);
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
