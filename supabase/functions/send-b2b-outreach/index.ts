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
  /**
   * Si true: NO envía a recipients reales. Reemplaza el destinatario por
   * TEST_EMAIL (correo del founder) y agrega "[TEST]" al subject. Permite
   * ver el email exacto que recibirá cada partner antes del batch real.
   * Cada recipient se envía como email separado al test_email para validar
   * personalización (greeting con nombre, company, etc.).
   */
  test_mode?: boolean;
}

/** Email destino cuando test_mode=true. Override via OUTREACH_TEST_EMAIL env. */
const TEST_EMAIL = Deno.env.get('OUTREACH_TEST_EMAIL') || 'pedro.susaeta.hidalgo@gmail.com';

/**
 * Dedupe recipients por dominio. Si hay 2+ emails del mismo dominio
 * preserva solo el primero. Razón: enviar 2 correos al mismo dominio el
 * mismo día = pinta como spam → baja sender reputation Resend → riesgo
 * bloqueo DKIM/SPF.
 */
function dedupeByDomain(recipients: OutreachRecipient[]): {
  unique: OutreachRecipient[];
  duplicates: { email: string; reason: string }[];
} {
  const seenDomains = new Map<string, OutreachRecipient>();
  const duplicates: { email: string; reason: string }[] = [];

  for (const r of recipients) {
    if (!r.email || !r.email.includes('@')) continue;
    const domain = r.email.split('@')[1].toLowerCase().trim();
    if (seenDomains.has(domain)) {
      duplicates.push({
        email: r.email,
        reason: `dominio ${domain} ya cubierto por ${seenDomains.get(domain)?.email}`,
      });
    } else {
      seenDomains.set(domain, r);
    }
  }
  return { unique: Array.from(seenDomains.values()), duplicates };
}

/**
 * Copy reescrito 2026-04-30 (Pedro decision pre-launch outreach):
 * - Tono honesto: "estoy buscando partners pre-launch" (no "tenemos miles
 *   de users", porque no tenemos publico todavía).
 * - Hook fuerte: que ganan ELLOS, qué ganamos NOSOTROS, tradeoff explicito.
 * - CTA suave: 30 min call sin compromiso, no "firma ya".
 * - Disclaimer pre-launch para evitar overselling.
 * - Tildes castellano chileno (tú/podés/podemos).
 */
const AUDIENCE_CONFIG: Record<
  AudienceKind,
  {
    subject: string;
    preheader: string;
    headline: string;
    pitch: string;
    bullets: string[];
    /**
     * Oferta Founder Partner: incentivo para quienes se sumen ANTES del
     * lanzamiento. Cierra el deal con escasez real (lock por segmento) +
     * pricing/revenue preferente + co-branding. 4 líneas, formato consistente:
     *  1. Exclusividad por segmento durante X meses
     *  2. Pricing/revenue preferente
     *  3. Co-branding / naming / case study
     *  4. Onboarding dedicado white-glove
     */
    founder_offer: string[];
    cta_text: string;
    cta_url: string;
    deck_url: string;
  }
> = {
  pharma: {
    subject: 'Pre-launch: la ficha clínica longitudinal de las mascotas chilenas, ¿les sirve?',
    preheader:
      'API con consent ARCO + 4 endpoints listos. Lanzamiento próximo. Busco 1-2 partners pharma early.',
    headline:
      'Construí la infraestructura digital de mascotas chilenas. Lanzamiento próximo. Antes de eso, ¿les sirve a ustedes?',
    pitch:
      'Soy Pedro Susaeta, founder de Paw Friend (SpA chilena, RUT 78.328.659-9). Construí en 8 meses la ficha clínica longitudinal del 100% del mercado pet chileno. Estamos próximos a lanzar (cohorte beta cerrada en marcha). Antes de abrir al público, busco 1-2 partners pharma early para validar el motor #1: API B2B con datos agregados anonimizados + consent ARCO.',
    bullets: [
      'Qué ganan ustedes: targeting de campañas con segmentación raza/edad/comuna real (no panel autoseleccionado), validación de eficacia con cohort longitudinal, detección temprana de sub-poblaciones con condiciones específicas.',
      'Qué ganamos nosotros: validar pricing pharma + 1 case study para abrir conversación con Sura/Centrovet adicionales + tener un partner que crezca con nosotros desde mes 0.',
      'Cómo funciona: 4 endpoints públicos (breed_stats, species_stats, correlations, risk_score) con auth X-Pawfriend-Api-Key. Onboarding self-service. SLA 99.5%.',
      'Compliance pre-resuelto: Ley 19.628 + 21.719 + ARCO + DPA template listo. SpA constituida. No tengo que pedir permiso de privacy a nadie — lo tengo.',
    ],
    founder_offer: [
      'Exclusividad por categoría terapéutica durante 12 meses post-launch (ej: solo tu marca en antiparasitarios sponsored reminders).',
      'Pricing fundador: 50% off durante el primer año + lock garantizado de pricing por 24 meses adicionales.',
      'Naming en case study oficial Paw Friend + co-branding en comunicaciones a la comunidad veterinaria.',
      'Onboarding white-glove: integración API en 2 semanas con soporte directo del founder + acceso a data agregada con 30 días de anticipación al público.',
    ],
    cta_text: 'Pedir 30 min call (sin compromiso)',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=b2b_api',
    deck_url: 'https://pawfriend.cl/pitch/pharma.html',
  },
  seguros: {
    subject: 'Pre-launch: cotizador pet insurance embebido + risk score real, ¿les sirve?',
    preheader: 'Lanzamiento próximo. Busco 1 aseguradora early para validar distribución B2B2C.',
    headline:
      'Construí un cotizador pet insurance con risk score real. Lanzamiento próximo. Antes, ¿les sirve a ustedes?',
    pitch:
      'Soy Pedro Susaeta, founder de Paw Friend (SpA chilena). En 8 meses construí la primera distribución B2B2C de seguros pet en Chile: el dueño abre la ficha de su mascota, ve cotizaciones en tiempo real de aseguradoras partner, pide contacto, ustedes reciben lead transaccional. Estamos próximos a lanzar (cohorte beta cerrada en marcha). Antes busco 1 partner aseguradora early.',
    bullets: [
      'Qué ganan ustedes: distribución B2B2C en contexto (el owner ya tiene la mascota cargada con peso/raza/condiciones, no autoreporte). Risk score precomputado por raza/edad/comuna. Lead transaccional vía email automático.',
      'Qué ganamos nosotros: validar la mecánica con un partner real + tener case study para abrir conversación con BCI/Mapfre/Consorcio + revenue share de la primera póliza vendida.',
      'Cómo funciona: cotizador en /cotizar-seguro/:petId, lead capture transaccional, RPC compute_insurance_quote con factores actuariales reales, todo en producción end-to-end.',
      'Anti-fraude (upside): la biometría Paw Shield (Petify, 100% accuracy validada) está dormida en consumer pero reactivable B2B-funded — ustedes pagan COGS y nosotros activamos en su cohort.',
    ],
    founder_offer: [
      'Exclusividad como única aseguradora visible en el cotizador durante 6 meses post-launch (ningún competidor aparece en /cotizar-seguro/ a tus potenciales asegurados).',
      'Revenue share fundador: 30% de comisión sobre prima primer año (vs 15% standard) durante todos los leads cerrados en los primeros 12 meses.',
      'Co-branding del cotizador: "Paw Friend × [Tu marca]" + landing dedicada para tus clientes existentes.',
      'Onboarding white-glove: setup de risk score con tus factores actuariales + dashboard partner + integración a tu CRM en 3 semanas.',
    ],
    cta_text: 'Pedir 30 min call (sin compromiso)',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=seguros',
    deck_url: 'https://pawfriend.cl/pitch/aseguradoras.html',
  },
  retail: {
    subject: 'Pre-launch: canal de adquisición contextual para retail pet, ¿les sirve?',
    preheader: 'Lanzamiento próximo. Busco 1-2 retailers para validar afiliado contextual.',
    headline:
      'Construí un canal de adquisición contextual para retail pet. Lanzamiento próximo. ¿Les sirve a ustedes?',
    pitch:
      'Soy Pedro Susaeta, founder de Paw Friend (SpA chilena). En 8 meses construí el catálogo retail más contextual del mercado pet chileno: cada producto se filtra automáticamente por especie + raza + edad + peso de la mascota del dueño. Estamos próximos a lanzar (cohorte beta cerrada en marcha). Antes busco 1-2 retailers early para validar la mecánica.',
    bullets: [
      'Qué ganan ustedes: leads atribuibles con tracking real (no Google Analytics — RPC track_retail_click con SECURITY DEFINER), descuento contextual a Paw Members (tier que paga $3.990/mes), reporte mensual de attribution.',
      'Qué ganamos nosotros: validar el modelo de revenue share con un retailer real + tener un partner que aporta inventario + tener case study para abrir conversación con cadenas más grandes.',
      'Cómo funciona: el owner abre la ficha de su mascota → ve productos con descuento Paw Member → click trackeado → su retailer recibe el lead atribuido + revenue share de la conversión.',
      'Sin marketplace fee: no soy MercadoLibre. No cobro 15% de cada venta. Mi modelo es revenue share configurable por SKU + setup mensual fijo. Tu logística + checkout siguen siendo tuyos.',
    ],
    founder_offer: [
      'Posición destacada en /tienda durante 12 meses post-launch (tu logo aparece primero en home retail antes que cualquier otro retailer).',
      'Setup gratis durante el primer año + revenue share preferente (te quedas con más margen que partners post-launch).',
      'Colección colaborativa "Master Dog × Paw Friend" (o equivalente) con landing dedicada + push a Paw Members.',
      'Onboarding white-glove: catálogo cargado en 2 semanas + tracking de conversión configurado + reportes mensuales personalizados.',
    ],
    cta_text: 'Pedir 30 min call (sin compromiso)',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=retail',
    deck_url: 'https://pawfriend.cl/pitch/retail.html',
  },
  gobierno: {
    subject: 'Pre-launch: registro digital Ley 21.020 listo, ¿le sirve a su municipio?',
    preheader: 'Lanzamiento próximo. Busco 1-2 municipios early para validar implementación.',
    headline:
      'La Ley 21.020 los obliga a tener registro digital de mascotas. Lo construí. ¿Les sirve?',
    pitch:
      'Soy Pedro Susaeta, founder de Paw Friend (SpA chilena). La Ley 21.020 (tenencia responsable) obliga a las municipalidades a llevar registro de mascotas con microchip, vacunas y tenedor responsable. Ningún municipio chileno lo tiene digital y centralizado. Nosotros sí — está en producción end-to-end. Estoy próximo a lanzar. Antes busco 1-2 municipios early.',
    bullets: [
      'Qué ganan ustedes: cumplimiento Ley 21.020 sin construir nada. Dashboard de cobertura por barrio (vacunas, esterilización, microchip). Reportes para SAG/Subdere automatizados. Onboarding ciudadano gratis.',
      'Qué ganamos nosotros: validar el modelo B2G con 1-2 municipios early + tener case study Las Condes/Vitacura/Providencia para abrir conversación con Subdere + escala nacional.',
      'Cómo funciona: ciudadano se inscribe gratis vía pawfriend.cl, registra mascota con microchip, ficha clínica vivienda, geolocalización por comuna. Municipio paga la implementación + soporte.',
      'No es Excel + WhatsApp: es SaaS chileno con boleta + SpA + cumplimiento ARCO. La data del ciudadano es del ciudadano (Ley 21.719). Ustedes solo ven los datos del ciudadano que vive en su comuna.',
    ],
    founder_offer: [
      'Municipio Founder: ser el primer municipio referente en Chile con Ley 21.020 100% digital (caso de éxito ante Subdere, Contraloría, otros municipios).',
      'Implementación gratis durante el primer año + soporte dedicado del founder + tarifa preferente blindada por 36 meses.',
      'Co-branding "Las Condes × Paw Friend" (o el municipio que firme) en toda comunicación pública del registro digital + ferias municipales.',
      'Onboarding white-glove: bulk import de mascotas existentes + capacitación a personal + integración con SAG en 4 semanas.',
    ],
    cta_text: 'Pedir 30 min call (sin compromiso)',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=gobierno_municipio',
    deck_url: 'https://pawfriend.cl/pitch/gobierno.html',
  },
  banca: {
    subject: 'Pre-launch: Paw Member como benefit diferencial para sus clientes premium',
    preheader: 'Lanzamiento próximo. Busco 1 banco early para validar co-branding.',
    headline: 'Construí Paw Member como benefit corporativo. ¿Les sirve para diferenciar?',
    pitch:
      'Soy Pedro Susaeta, founder de Paw Friend (SpA chilena). El segmento premium chileno gasta USD 1.500/año en sus mascotas (referencia INE + comparables LatAm). La banca compite por ese segmento con benefits emocionales: viajes, gastronomía, cine. Falta uno: la mascota. Lo construí. Estoy próximo a lanzar. Antes busco 1 banco early.',
    bullets: [
      'Qué ganan ustedes: benefit emocional con LTV alto, white-label co-branding (tarjeta + landing), engagement metrics mensual por segmento, costo predecible (cuota fija anual por cliente activo).',
      'Qué ganamos nosotros: validar el modelo de banca con 1 partner early + tener case study para abrir conversación con BCI/Itau/Falabella + ingreso recurrente garantizado vía contrato anual.',
      'Cómo funciona: cliente premium recibe Paw Member gratis vía su tarjeta. Accede a ficha clínica completa, descuentos retail partners, acceso prioritario a vets. La banca paga una cuota fija por cliente activo.',
      'Tier B2B empresarial (upside): empleados con mascota + benefit corporativo. Misma mecánica, B2B en lugar de B2C.',
    ],
    founder_offer: [
      'Exclusividad por segmento durante 12 meses: si entran como banca premium, ningún otro banco premium aparece en Paw Friend hasta que termine el lock.',
      'Pricing fundador: cuota por cliente activo congelada por 36 meses (sin alza inflacionaria) + setup gratis primer año.',
      'Tarjeta co-branded "[Banco] × Paw Member" + landing dedicada para tu base premium + push a Paw Members existentes con beneficio cruzado.',
      'Onboarding white-glove: integración con tu app de cliente vía API + reportes mensuales personalizados de engagement por segmento.',
    ],
    cta_text: 'Pedir 30 min call (sin compromiso)',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=banca',
    deck_url: 'https://pawfriend.cl/pitch/banca.html',
  },
  edificios: {
    subject: 'Pre-launch: registro digital de mascotas para sus edificios pet-friendly',
    preheader: 'Lanzamiento próximo. Busco 1-2 administradoras early para validar SaaS comunidad.',
    headline:
      'Construí el SaaS para edificios pet-friendly que falta. ¿Les sirve a sus comunidades?',
    pitch:
      'Soy Pedro Susaeta, founder de Paw Friend (SpA chilena). Edificios pet-friendly hoy llevan el registro en Excel o WhatsApp. Hay 50.000+ unidades pet-friendly en Chile y crece 10% anual. Construí el SaaS dedicado en 8 meses. Estoy próximo a lanzar. Antes busco 1-2 administradoras o inmobiliarias early.',
    bullets: [
      'Qué ganan ustedes: cobertura compliance vacunas/esterilización por comunidad, reglamento digital con firma electrónica, reducción de conflictos vecinales (data en lugar de "el perro que ladra"), branding propio.',
      'Qué ganamos nosotros: validar el modelo SaaS B2B con 1-2 partners early + tener case study para escalar a Manquehue/PAZ/Actual + ingreso recurrente predecible (cuota mensual por unidad).',
      'Cómo funciona: cada edificio recibe código de invitación con branding. Propietarios registran mascota gratis. Administración tiene dashboard global. Vecinos ven solo lo público.',
      'Diferencia con apps de comunidad genéricas: nosotros entendemos pet (vacunas, microchip, comportamiento, esterilización). EdiFy/Mediakit no.',
    ],
    founder_offer: [
      'Inmobiliaria Founder: las primeras 100 unidades de su portafolio activadas gratis durante 12 meses (sin tope de unidades en pet-friendly).',
      'Pricing fundador: cuota fija por unidad/mes congelada por 24 meses + revenue share sobre Paw Member que viva en tu edificio.',
      'Branding propio en cada edificio: tu logo + colores + reglamento personalizado por proyecto + caso de éxito conjunto en prensa inmobiliaria.',
      'Onboarding white-glove: integración con tu sistema de administración + capacitación a conserjes + soporte directo del founder.',
    ],
    cta_text: 'Pedir 30 min call (sin compromiso)',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=edificios',
    deck_url: 'https://pawfriend.cl/pitch/edificios.html',
  },
  longtail: {
    subject: 'Pre-launch: alianza vertical pet-adjacent, ¿les hace sentido?',
    preheader: 'Lanzamiento próximo. Acuerdos custom rápidos: data, distribución, co-marketing.',
    headline:
      'Si tu empresa toca el ecosistema mascota sin ser pharma/seguro/retail tradicional, hablemos.',
    pitch:
      'Soy Pedro Susaeta, founder de Paw Friend (SpA chilena). Hay un long-tail de empresas que tocan el ecosistema mascota: aerolíneas (Latam Cargo), academias veterinarias (UAutónoma, USS), fundaciones privadas, ferias pet, agroindustria, hardware vet. Construí Paw Friend en 8 meses con código modular. Estoy próximo a lanzar. Antes busco alianzas verticales rápidas.',
    bullets: [
      'Qué ganan ustedes: acceso a la audiencia pet chilena vía la app, co-marketing en feed/newsletter, métricas agregadas de tu vertical, integración técnica modular.',
      'Qué ganamos nosotros: distribución, contenido educativo, eventos físicos, expansión de uso casos. No buscamos cheque.',
      'Cómo funciona: pitch — firma — integración en <30 días. Acuerdos custom: data deals, distribución, eventos, training, co-branding.',
      'Sin compromiso largo: la mayoría de los acuerdos long-tail son trimestrales con opción a renovar. Probamos juntos, medimos, decidimos.',
    ],
    founder_offer: [
      'Founder Partner vertical: primer y único acuerdo en tu nicho específico (aerolínea pet, academia vet, etc.) durante 12 meses post-launch.',
      'Setup + integración técnica gratis durante el piloto + tarifa preferente en el contrato comercial post-piloto.',
      'Co-marketing en feed Paw Friend + newsletter mensual + naming en todas las comunicaciones del partnership.',
      'Onboarding white-glove: el founder acompaña cada paso de la integración hasta tener primera tracción medible.',
    ],
    cta_text: 'Pedir 30 min call (sin compromiso)',
    cta_url: 'https://pawfriend.cl/aplicar?tipo=longtail',
    deck_url: 'https://pawfriend.cl/pitch/inversionistas.html',
  },
};

function buildEmailHTML(
  audience: AudienceKind,
  contactName: string,
  company: string,
  customIntro?: string,
  isTest?: boolean
): string {
  const cfg = AUDIENCE_CONFIG[audience];

  const greeting = contactName
    ? `Hola ${contactName},`
    : company
      ? `Hola equipo ${company},`
      : 'Hola,';

  const intro = customIntro || cfg.pitch;

  // Banner test si test_mode=true. Asi cuando Pedro recibe el test sabe
  // exactamente qué iban a recibir los recipients reales.
  const testBanner = isTest
    ? `<div style="background:#fef3c7;border:1px solid #f59e0b;padding:12px 16px;border-radius:8px;margin-bottom:24px;font-size:13px;color:#78350f;">
        <strong>⚠️ MODO TEST</strong> — Este email se envió a TEST_EMAIL en lugar del recipient real.
        Recipient original: <strong>${contactName || 'sin nombre'}</strong> ${company ? `· ${company}` : ''}.
      </div>`
    : '';

  // Bloque destacado "Founder Partner Offer" — incentivo escasez para
  // quienes se sumen ANTES del lanzamiento (lock por segmento + pricing
  // preferente + co-branding). Renderizado como card dorado distintivo.
  const founderOfferBlock = `
    <div style="margin: 28px 0; border: 2px solid #eab308; background: linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%); border-radius: 12px; padding: 18px 20px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <span style="font-size: 20px;">🏆</span>
        <strong style="font-size: 14px; color: #78350f; text-transform: uppercase; letter-spacing: 0.05em;">
          Oferta Founder Partner — sólo pre-launch
        </strong>
      </div>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #78350f; line-height: 1.5;">
        Esta oferta aplica únicamente a partners que firmen carta de intención <strong>antes del lanzamiento público</strong>. Una vez que abrimos al mundo, el contrato comercial pasa a tarifa standard y la exclusividad por segmento ya no se garantiza.
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1a1a1a; line-height: 1.6;">
        ${cfg.founder_offer.map((line) => `<li style="margin-bottom: 6px;">${line}</li>`).join('')}
      </ul>
    </div>
  `;

  const body = [
    testBanner,
    emailHeader({
      variant: 'logo',
      tagline: TAGLINE.b2b ?? 'Infraestructura digital de la mascota chilena',
    }),
    paragraph(greeting),
    paragraph(`<strong style="font-size:17px;line-height:1.4;">${cfg.headline}</strong>`),
    paragraph(intro),
    bulletList({
      items: cfg.bullets.map((b) => ({ icon: '→', text: b })),
    }),
    founderOfferBlock,
    cta({
      text: cfg.cta_text,
      url: cfg.cta_url,
      hint: `O revisá el deck completo primero: <a href="${cfg.deck_url}" style="color:inherit;text-decoration:underline;">${cfg.deck_url}</a><br>App en vivo: <a href="https://pawfriend.cl" style="color:inherit;text-decoration:underline;">pawfriend.cl</a>`,
    }),
    paragraph(
      'Si te hace sentido, respondé este correo con disponibilidad y agendamos 30 min esta semana o la próxima. Sin compromiso, sin firma, solo conversar. Si no es para ustedes ahora, también vale — agradezco la honestidad.'
    ),
    paragraph(
      '— Pedro Susaeta, founder<br>Paw Friend · SpA SUSAETA GARNHAM SOFTWARE ENGINEERING<br>RUT 78.328.659-9 · Santiago, Chile'
    ),
    emailFooter({
      note: 'Recibís este correo porque tu rol o empresa corresponde a una vertical donde Paw Friend está buscando partners pre-launch. Es un envío único — no estás en una lista de marketing recurrente.',
      secondary:
        'Si preferís no recibir más correos de Paw Friend, respondé con "remover" y te saco de la lista.',
    }),
  ].join('');

  return renderEmail({
    title: (isTest ? '[TEST] ' : '') + cfg.subject,
    preheader: cfg.preheader,
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
      const { audience, recipients, custom_subject, custom_intro, test_mode } = body;

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

      // Dedupe por dominio (anti-spam): 1 email por empresa.
      const { unique: uniqueRecipients, duplicates } = dedupeByDomain(recipients);

      const cfg = AUDIENCE_CONFIG[audience];
      const baseSubject = custom_subject || cfg.subject;
      const subject = test_mode ? `[TEST] ${baseSubject}` : baseSubject;

      let enviados = 0;
      let errores = 0;
      const resultados: { email: string; status: string; detail?: string }[] = [];

      // Reportar duplicados como skipped antes de enviar.
      for (const dup of duplicates) {
        resultados.push({ email: dup.email, status: 'skipped_dedupe', detail: dup.reason });
      }

      for (const recipient of uniqueRecipients) {
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
            custom_intro,
            test_mode === true
          );

          // En test_mode el destinatario real es TEST_EMAIL pero el preview
          // muestra el contact_name/company del recipient original.
          const actualTo = test_mode ? TEST_EMAIL : recipient.email;

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              // from: dominio verificado en Resend. Mantener pawfriend.cl
              // sin caracteres no-ASCII en el display name (RFC 5322).
              from: 'Paw Friend <hola@pawfriend.cl>',
              reply_to: ['pedrosusaeta@pawfriend.cl'],
              to: [actualTo],
              subject,
              html: htmlEmail,
              text: cfg.pitch,
            }),
          });

          if (emailRes.ok) {
            enviados++;
            resultados.push({
              email: recipient.email,
              status: test_mode ? 'sent_to_test' : 'sent',
              detail: test_mode ? `redirected to ${TEST_EMAIL}` : undefined,
            });

            // Log en tabla outreach_log SOLO si NO es test mode.
            if (!test_mode) {
              await supabaseAdmin
                .from('b2b_outreach_log')
                .insert({
                  audience,
                  recipient_email: recipient.email,
                  recipient_name: recipient.contact_name || null,
                  recipient_company: recipient.company || null,
                  subject: baseSubject,
                  sent_by: user.id,
                  status: 'sent',
                })
                .then(() => {})
                .catch(() => {
                  // Tabla no existe aun, no es bloqueante
                });
            }
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
          unique_after_dedupe: uniqueRecipients.length,
          duplicates_skipped: duplicates.length,
          test_mode: test_mode === true,
          test_email: test_mode ? TEST_EMAIL : null,
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
