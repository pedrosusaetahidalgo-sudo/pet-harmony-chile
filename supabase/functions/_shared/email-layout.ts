// ─────────────────────────────────────────────────────────────────────────────
// Paw Friend — Shell base para todos los emails.
// 2026-04-21
//
// Wrapper HTML5 con fallbacks MSO/Outlook, preheader invisible, fonts y
// reset. Los bloques (header, CTA, cards) viven en `email-blocks.ts`.
//
// Uso:
//   import { renderEmail, escapeHtml } from '../_shared/email-layout.ts';
//   import { emailHeader, emailFooter, emailCta } from '../_shared/email-blocks.ts';
//
//   const html = renderEmail({
//     title: 'Bienvenido',
//     preheader: 'Tu ficha medica, lista para usar',
//     body: `${emailHeader()}...${emailFooter()}`,
//   });
// ─────────────────────────────────────────────────────────────────────────────

import { BRAND, FONT, NEUTRAL, SPACE, WIDTH } from './email-theme.ts';

/** Escapa texto para usarlo dentro de HTML. Seguro contra XSS básico. */
export function escapeHtml(s: string | null | undefined): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escapa atributos de URL — previene javascript: inyectado. */
export function escapeUrl(url: string | null | undefined): string {
  if (!url) return '#';
  const trimmed = String(url).trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
  return escapeHtml(trimmed);
}

export interface RenderEmailOptions {
  /** `<title>` del email. Usado por algunos clientes como fallback de preview. */
  title: string;
  /**
   * Preheader: texto invisible que aparece junto al asunto en la bandeja.
   * Debe completar la promesa del subject (ej: subject "Luna ya tiene ficha"
   * + preheader "Abrela en 1 minuto. Es gratis y vas a ver su historial.").
   */
  preheader?: string;
  /** HTML del contenido (headers, cards, CTA, footer ya ensamblados). */
  body: string;
  /** Ancho del card principal. Default `standard` (560px). */
  width?: keyof typeof WIDTH;
  /**
   * Color del fondo "página" detrás del card. Default brand-50 (lavanda
   * clarísimo). Para emails emocionales (gracias donación) puede cambiarse
   * a un tono cálido usando los tokens del theme.
   */
  pageBackground?: string;
  /**
   * Idioma (atributo `lang` del root). Default 'es'.
   */
  lang?: string;
}

/**
 * Renderiza un email completo: DOCTYPE + html + head + body + shell.
 * Incluye:
 *  - Reset básico Outlook/Gmail (margin, outlook word-spacing)
 *  - Preheader invisible
 *  - Responsive mobile (padding reducido < 480px)
 *  - Font stack Paw Friend con fallback system
 */
export function renderEmail(opts: RenderEmailOptions): string {
  const {
    title,
    preheader,
    body,
    width = 'standard',
    pageBackground = '#faf5ff',
    lang = 'es',
  } = opts;
  const cardWidth = WIDTH[width];

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(preheader)}</div>
<div style="display:none;max-height:0;overflow:hidden;">&#847;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(title)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  /* Reset clients */
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0}
  img{-ms-interpolation-mode:bicubic;border:0;line-height:100%;outline:none;text-decoration:none}
  table{border-collapse:collapse!important}
  body{margin:0!important;padding:0!important;width:100%!important}
  a{color:${BRAND[600]}}
  /* Mobile */
  @media only screen and (max-width:480px){
    .pf-card{width:100%!important;border-radius:18px!important}
    .pf-pad-x{padding-left:20px!important;padding-right:20px!important}
    .pf-pad-x-sm{padding-left:16px!important;padding-right:16px!important}
    .pf-cta{padding-left:28px!important;padding-right:28px!important;font-size:16px!important}
    .pf-h1{font-size:22px!important;line-height:1.3!important}
    .pf-hide-mobile{display:none!important}
    .pf-avatar{width:40px!important;height:40px!important;line-height:40px!important;font-size:22px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${escapeHtml(pageBackground)};font-family:${FONT.sans};color:${NEUTRAL[800]};">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${escapeHtml(pageBackground)};padding:${SPACE['2xl']} ${SPACE.base};">
<tr><td align="center">
<table role="presentation" class="pf-card" width="${cardWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width:${cardWidth}px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(147,51,234,0.15);border:1px solid ${BRAND[100]};">
${body}
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Envia un email via Resend. Encapsula el fetch + headers + fallback de env.
 * Usado por TODAS las edge fns del repo — NO se debe hacer fetch directo a
 * api.resend.com en otros lugares.
 *
 * Lee:
 *   - RESEND_API_KEY (requerido)
 *   - RESEND_FROM_EMAIL (opcional, default 'Paw Friend <hola@pawfriend.cl>')
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text fallback. Muy recomendado para deliverability. */
  text?: string;
  /** Dirección reply-to. Default 'hola@pawfriend.cl'. */
  replyTo?: string | string[];
  /** Override del from por si alguna función necesita un remitente distinto. */
  from?: string;
  /** Tags para analytics Resend. */
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  status?: number;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' };

  const from =
    opts.from ||
    Deno.env.get('RESEND_FROM_EMAIL') ||
    'Paw Friend <hola@pawfriend.cl>';

  const body: Record<string, unknown> = {
    from,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    reply_to: opts.replyTo
      ? Array.isArray(opts.replyTo)
        ? opts.replyTo
        : [opts.replyTo]
      : ['hola@pawfriend.cl'],
  };
  if (opts.text) body.text = opts.text;
  if (opts.tags) body.tags = opts.tags;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const detail = await resp.text();
      console.error('[email-layout/sendEmail] Resend error', resp.status, detail);
      return { ok: false, status: resp.status, error: detail };
    }
    const json = (await resp.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: json.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[email-layout/sendEmail] fetch error', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Helper rápido para envolver una sección `<tr><td>` sin repetir la tabla
 * completa. Útil cuando un caller arma piezas ad-hoc fuera de los bloques.
 */
export function row(content: string, padding = `${SPACE.xl} ${SPACE['2xl']}`): string {
  return `<tr><td style="padding:${padding};">${content}</td></tr>`;
}

/**
 * Extrae el primer nombre de un full name, con fallback.
 * Ejemplo: "Pedro Susaeta" → "Pedro"
 */
export function firstName(fullName: string | null | undefined, fallback = 'amigue'): string {
  if (!fullName) return fallback;
  const trimmed = fullName.trim();
  if (!trimmed) return fallback;
  return trimmed.split(/\s+/)[0] || fallback;
}
