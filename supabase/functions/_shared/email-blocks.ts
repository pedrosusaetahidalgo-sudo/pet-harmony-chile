// ─────────────────────────────────────────────────────────────────────────────
// Paw Friend — Bloques reusables para emails.
// 2026-04-21
//
// Cada función retorna un `<tr>...</tr>` o un fragmento de `<td>` listo para
// ensamblar dentro del shell de `email-layout.ts`. Los colores, espaciados,
// radios y assets vienen de `email-theme.ts`.
//
// Principios:
//  - Una sola tabla exterior (manejada por renderEmail) — cada bloque es <tr>
//  - No usar media queries dentro de bloques; usar clases `pf-*` definidas
//    en el shell
//  - Siempre escapar texto dinámico con escapeHtml
//  - Pensar en Outlook: inline styles, sin flex/grid, padding en <td>
// ─────────────────────────────────────────────────────────────────────────────

import {
  ASSETS,
  AUDIENCE,
  BRAND,
  FONT,
  GOLD,
  GRADIENT,
  NEUTRAL,
  RADIUS,
  SEMANTIC,
  SHADOW,
  SIZE,
  SPACE,
  TAGLINE,
} from './email-theme.ts';
import { escapeHtml, escapeUrl } from './email-layout.ts';

// ── Header ────────────────────────────────────────────────────────────────

export type AudienceKind = keyof typeof AUDIENCE;

export interface HeaderOptions {
  /**
   * Variante: `logo` muestra icono PWA + wordmark centrado. `emoji` muestra
   * un emoji gigante + título (para bienvenidas, celebraciones). `compact`
   * es solo el wordmark sobre el gradiente (para outreach / pitch a admin).
   */
  variant?: 'logo' | 'emoji' | 'compact';
  /** Override del gradiente. Por defecto toma el de la audiencia. */
  gradient?: string;
  /** Audiencia para elegir gradiente si no se pasa `gradient`. */
  audience?: AudienceKind;
  /** Subtítulo pequeño bajo el logo. Default depende del contexto. */
  tagline?: string;
  /** Emoji gigante (variant emoji). */
  emoji?: string;
  /** Título grande bajo el emoji (variant emoji). */
  title?: string;
  /** Subtítulo/eyebrow sobre el título (variant emoji, opcional). */
  eyebrow?: string;
}

export function emailHeader(opts: HeaderOptions = {}): string {
  const {
    variant = 'logo',
    gradient,
    audience = 'brand',
    tagline = TAGLINE.owner,
    emoji,
    title,
    eyebrow,
  } = opts;
  const bg = gradient ?? GRADIENT.brand;
  const accentWhite = 'rgba(255,255,255,0.95)';

  if (variant === 'emoji') {
    return `<tr><td style="background:${bg};padding:${SPACE['3xl']} ${SPACE.xl} ${SPACE['2xl']};text-align:center;color:#ffffff;">
${eyebrow ? `<div style="font-size:${SIZE.sm};text-transform:uppercase;letter-spacing:0.12em;opacity:0.9;font-weight:600;">${escapeHtml(eyebrow)}</div>` : ''}
${emoji ? `<div style="font-size:48px;line-height:1;margin:${eyebrow ? SPACE.md : '0'} 0 ${SPACE.md};">${escapeHtml(emoji)}</div>` : ''}
${title ? `<div class="pf-h1" style="font-family:${FONT.display};font-size:${SIZE.h1};font-weight:700;line-height:1.25;color:#ffffff;">${escapeHtml(title)}</div>` : ''}
${tagline ? `<p style="color:${accentWhite};font-size:${SIZE.sm};margin:${SPACE.sm} 0 0;font-weight:500;letter-spacing:0.3px;">${escapeHtml(tagline)}</p>` : ''}
</td></tr>`;
  }

  if (variant === 'compact') {
    return `<tr><td style="background:${bg};padding:${SPACE.xl} ${SPACE.xl};text-align:center;">
<img src="${escapeUrl(ASSETS.wordmark)}" alt="Paw Friend" height="24" style="height:24px;display:inline-block;filter:brightness(0) invert(1);" />
${tagline ? `<p style="color:${accentWhite};font-size:${SIZE.xs};margin:${SPACE.sm} 0 0;font-weight:500;letter-spacing:0.4px;text-transform:uppercase;">${escapeHtml(tagline)}</p>` : ''}
</td></tr>`;
  }

  // default: logo
  return `<tr><td style="background:${bg};padding:${SPACE['3xl']} ${SPACE.xl} ${SPACE['2xl']};text-align:center;">
<img src="${escapeUrl(ASSETS.logoIcon)}" alt="Paw Friend" width="64" height="64" style="border-radius:16px;display:inline-block;border:3px solid rgba(255,255,255,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
<div style="margin-top:${SPACE.md};">
<img src="${escapeUrl(ASSETS.wordmark)}" alt="Paw Friend" height="24" style="height:24px;display:inline-block;filter:brightness(0) invert(1);" />
</div>
${tagline ? `<p style="color:${accentWhite};font-size:${SIZE.sm};margin:${SPACE.md} 0 0;font-weight:500;letter-spacing:0.3px;">${escapeHtml(tagline)}</p>` : ''}
</td></tr>`;
}

// ── Footer ────────────────────────────────────────────────────────────────

export interface FooterOptions {
  /**
   * Nota de cierre personalizada (quién envía, por qué). Default genérico.
   */
  note?: string;
  /**
   * Segunda línea (por ej. "Si no reconoces esto, puedes ignorarlo").
   */
  secondary?: string;
  /**
   * Mostrar la firma "hecho en Chile por un founder + IA". Default true.
   */
  homeMade?: boolean;
  /** Ocultar el link a pawfriend.cl (raro, usa solo si body ya lo tiene). */
  hideSiteLink?: boolean;
}

export function emailFooter(opts: FooterOptions = {}): string {
  const {
    note,
    secondary,
    homeMade = true,
    hideSiteLink = false,
  } = opts;

  const defaultNote = hideSiteLink
    ? 'Paw Friend'
    : `<a href="${escapeUrl(ASSETS.siteUrl)}" style="color:${BRAND[600]};text-decoration:none;font-weight:600;">pawfriend.cl</a>`;

  return `<tr><td style="background:${BRAND[50]};padding:${SPACE.xl} ${SPACE['2xl']};border-top:1px solid ${BRAND[100]};">
<p style="color:${NEUTRAL[400]};font-size:${SIZE.xs};text-align:center;margin:0;line-height:1.7;">
${note ? escapeHtml(note) + '<br>' : ''}
${defaultNote}${homeMade ? ' · hecho en Chile por un founder + IA 🐾' : ''}
${secondary ? `<br>${escapeHtml(secondary)}` : ''}
</p>
</td></tr>`;
}

// ── Body sections ─────────────────────────────────────────────────────────

/** Wrapper genérico de sección (padding estándar). */
export function section(content: string, pad = `${SPACE.xl} ${SPACE['2xl']}`): string {
  return `<tr><td class="pf-pad-x" style="padding:${pad};">${content}</td></tr>`;
}

export interface HeadingOptions {
  text: string;
  eyebrow?: string;
  align?: 'left' | 'center';
  accent?: string;
  subtitle?: string;
}

/** Título principal dentro del cuerpo. */
export function heading(opts: HeadingOptions): string {
  const { text, eyebrow, align = 'center', accent = BRAND[700], subtitle } = opts;
  return section(`
<div style="text-align:${align};">
${eyebrow ? `<p style="margin:0 0 ${SPACE.sm};color:${accent};font-size:${SIZE.sm};font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>` : ''}
<h1 class="pf-h1" style="margin:0;color:${NEUTRAL[900]};font-family:${FONT.display};font-size:${SIZE.h1};font-weight:700;line-height:1.3;">${escapeHtml(text)}</h1>
${subtitle ? `<p style="margin:${SPACE.md} 0 0;color:${NEUTRAL[600]};font-size:${SIZE.md};line-height:1.55;">${escapeHtml(subtitle)}</p>` : ''}
</div>
`, `${SPACE['2xl']} ${SPACE['2xl']} ${SPACE.md}`);
}

export interface ParagraphOptions {
  text: string;
  align?: 'left' | 'center';
  muted?: boolean;
  size?: keyof typeof SIZE;
}

/**
 * Párrafo simple. Escapa HTML excepto que se pase `html: true` explícito
 * (evitar esa vía — usar bloques en su lugar).
 */
export function paragraph(opts: ParagraphOptions | string): string {
  const o: ParagraphOptions = typeof opts === 'string' ? { text: opts } : opts;
  const color = o.muted ? NEUTRAL[500] : NEUTRAL[700];
  const size = o.size ? SIZE[o.size] : SIZE.md;
  return section(`<p style="margin:0;color:${color};font-size:${size};line-height:1.6;text-align:${o.align ?? 'left'};">${escapeHtml(o.text)}</p>`);
}

// ── Chat bubble (mensaje de la mascota) ───────────────────────────────────

export interface PetBubbleOptions {
  /** Texto del mensaje — se escapa */
  message: string;
  /** Nombre de la mascota para el "dice:" opcional */
  petName?: string;
  /** Emoji del avatar. Default 🐾. */
  avatar?: string;
  /** Gradiente del avatar */
  avatarGradient?: string;
}

/**
 * Burbuja tipo chat: avatar de la mascota + bubble izquierda con mensaje.
 * El patrón más distintivo del onboarding de Paw Friend.
 */
export function petBubble(opts: PetBubbleOptions): string {
  const {
    message,
    petName,
    avatar = '🐾',
    avatarGradient = `linear-gradient(135deg,${BRAND[600]},${BRAND[400]})`,
  } = opts;
  return section(`
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="48" valign="top" style="padding-right:14px;">
<div class="pf-avatar" style="width:48px;height:48px;border-radius:50%;background:${avatarGradient};text-align:center;line-height:48px;font-size:26px;box-shadow:${SHADOW.avatar};">${escapeHtml(avatar)}</div>
</td>
<td>
<div style="background:${BRAND[100]};border:1px solid ${BRAND[200]};border-radius:${RADIUS.xl};border-top-left-radius:4px;padding:${SPACE.base} ${SPACE.lg};">
${petName ? `<p style="margin:0 0 6px;font-weight:700;color:${BRAND[700]};font-size:${SIZE.sm};letter-spacing:0.2px;">${escapeHtml(petName)} dice:</p>` : ''}
<p style="margin:0;color:${BRAND[900]};font-size:${SIZE.md};line-height:1.55;">${escapeHtml(message)}</p>
</div>
</td>
</tr>
</table>
`, `${SPACE['2xl']} ${SPACE['2xl']} 0`);
}

// ── Callout (bloque de contexto coloreado) ─────────────────────────────────

export type CalloutVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'gold';

export interface CalloutOptions {
  /** Estado visual del callout. */
  variant?: CalloutVariant;
  /** Título pequeño uppercase (opcional). */
  label?: string;
  /** Cuerpo del mensaje. */
  body: string;
  /** Emoji o icono a la izquierda del body. */
  icon?: string;
  /** Borde solo a la izquierda (tipo quote). Default false (borde completo). */
  leftBorderOnly?: boolean;
}

export function callout(opts: CalloutOptions): string {
  const { variant = 'brand', label, body, icon, leftBorderOnly = false } = opts;

  let bg: string;
  let border: string;
  let textColor: string;
  let labelColor: string;

  if (variant === 'brand') {
    bg = BRAND[50];
    border = BRAND[100];
    textColor = BRAND[900];
    labelColor = BRAND[700];
  } else if (variant === 'gold') {
    bg = GOLD[50];
    border = GOLD[200];
    textColor = GOLD[900];
    labelColor = GOLD[700];
  } else {
    const sem = SEMANTIC[variant];
    bg = sem.light;
    border = sem.border;
    textColor = sem.text;
    labelColor = sem.textStrong;
  }

  const borderStyle = leftBorderOnly
    ? `border-left:4px solid ${labelColor};border-radius:${RADIUS.md};`
    : `border:1px solid ${border};border-radius:${RADIUS.lg};`;

  return section(`
<div style="background:${bg};${borderStyle}padding:${SPACE.base} ${SPACE.lg};">
${label ? `<p style="margin:0 0 6px;color:${labelColor};font-size:${SIZE.xs};font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${escapeHtml(label)}</p>` : ''}
<p style="margin:0;color:${textColor};font-size:${SIZE.body};line-height:1.6;">
${icon ? `<span style="font-size:18px;vertical-align:middle;margin-right:6px;">${escapeHtml(icon)}</span>` : ''}${escapeHtml(body)}
</p>
</div>
`, `${SPACE.lg} ${SPACE['2xl']} 0`);
}

/**
 * Variante de callout que acepta HTML crudo en el body (para `<strong>`,
 * `<a href>` ya sanitizados por el caller). Úsese con cuidado.
 */
export function calloutRaw(opts: Omit<CalloutOptions, 'body'> & { bodyHtml: string }): string {
  const { variant = 'brand', label, bodyHtml, icon, leftBorderOnly = false } = opts;

  let bg: string;
  let border: string;
  let textColor: string;
  let labelColor: string;

  if (variant === 'brand') {
    bg = BRAND[50];
    border = BRAND[100];
    textColor = BRAND[900];
    labelColor = BRAND[700];
  } else if (variant === 'gold') {
    bg = GOLD[50];
    border = GOLD[200];
    textColor = GOLD[900];
    labelColor = GOLD[700];
  } else {
    const sem = SEMANTIC[variant];
    bg = sem.light;
    border = sem.border;
    textColor = sem.text;
    labelColor = sem.textStrong;
  }

  const borderStyle = leftBorderOnly
    ? `border-left:4px solid ${labelColor};border-radius:${RADIUS.md};`
    : `border:1px solid ${border};border-radius:${RADIUS.lg};`;

  return section(`
<div style="background:${bg};${borderStyle}padding:${SPACE.base} ${SPACE.lg};">
${label ? `<p style="margin:0 0 6px;color:${labelColor};font-size:${SIZE.xs};font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">${escapeHtml(label)}</p>` : ''}
<p style="margin:0;color:${textColor};font-size:${SIZE.body};line-height:1.6;">
${icon ? `<span style="font-size:18px;vertical-align:middle;margin-right:6px;">${escapeHtml(icon)}</span>` : ''}${bodyHtml}
</p>
</div>
`, `${SPACE.lg} ${SPACE['2xl']} 0`);
}

// ── Bullet list (iconos + texto) ──────────────────────────────────────────

export interface BulletItem {
  /** Emoji / icono unicode a la izquierda */
  icon: string;
  /** Texto descriptivo (se escapa) */
  text: string;
}

export interface BulletListOptions {
  /** Label pequeño encima de la lista */
  label?: string;
  items: BulletItem[];
  /** Color del label. Default brand-700. */
  accent?: string;
}

export function bulletList(opts: BulletListOptions): string {
  const { label, items, accent = BRAND[700] } = opts;
  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding:${SPACE.sm} 0;font-size:${SIZE.body};color:${NEUTRAL[700]};line-height:1.55;">
<span style="display:inline-block;width:34px;text-align:center;font-size:18px;vertical-align:middle;">${escapeHtml(it.icon)}</span>
<span style="vertical-align:middle;">${escapeHtml(it.text)}</span>
</td></tr>`
    )
    .join('');
  return section(`
${label ? `<p style="color:${accent};font-size:${SIZE.sm};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 ${SPACE.md};">${escapeHtml(label)}</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${rows}
</table>
`, `${SPACE.xl} ${SPACE['2xl']} ${SPACE.sm}`);
}

// ── Call to Action ────────────────────────────────────────────────────────

export interface CtaOptions {
  text: string;
  url: string;
  /** Variante visual. `brand` morado (default), `gold` para premium, `ghost` outline. */
  variant?: 'brand' | 'gold' | 'ghost';
  /** Hint pequeño bajo el botón (ej. "Es gratis y toma 1 minuto"). */
  hint?: string;
}

export function cta(opts: CtaOptions): string {
  const { text, url, variant = 'brand', hint } = opts;

  let style = '';
  if (variant === 'gold') {
    style = `background:${GRADIENT.ctaGold};color:#ffffff;box-shadow:${SHADOW.ctaGold};`;
  } else if (variant === 'ghost') {
    style = `background:#ffffff;color:${BRAND[700]};border:2px solid ${BRAND[200]};`;
  } else {
    style = `background:${GRADIENT.ctaBrand};color:#ffffff;box-shadow:${SHADOW.cta};`;
  }

  return `<tr><td class="pf-pad-x" style="padding:${SPACE.xl} ${SPACE['2xl']} ${SPACE.sm};" align="center">
<a href="${escapeUrl(url)}" class="pf-cta" target="_blank" rel="noopener noreferrer"
style="display:inline-block;${style}font-size:${SIZE.lg};font-weight:700;text-decoration:none;padding:18px 48px;border-radius:${RADIUS.lg};letter-spacing:0.4px;">${escapeHtml(text)}</a>
</td></tr>
${hint ? `<tr><td class="pf-pad-x" style="padding:6px ${SPACE['2xl']} ${SPACE.xl};" align="center">
<p style="color:${NEUTRAL[400]};font-size:${SIZE.sm};margin:0;">${escapeHtml(hint)}</p>
</td></tr>` : ''}`;
}

// ── Metadata table (clave/valor, para pitches / reportes) ─────────────────

export interface MetaRow {
  label: string;
  value: string;
  /** Si es un email/phone/URL, pasa el tipo para que se renderice como link. */
  kind?: 'text' | 'email' | 'phone' | 'url';
}

export function metaTable(rows: MetaRow[]): string {
  if (!rows.length) return '';
  const tbody = rows
    .filter((r) => r.value !== null && r.value !== undefined && r.value !== '')
    .map((r) => {
      let valueHtml: string;
      if (r.kind === 'email') {
        valueHtml = `<a href="mailto:${escapeUrl(r.value)}" style="color:${BRAND[700]};text-decoration:none;">${escapeHtml(r.value)}</a>`;
      } else if (r.kind === 'phone') {
        valueHtml = `<a href="tel:${escapeUrl(r.value)}" style="color:${BRAND[700]};text-decoration:none;">${escapeHtml(r.value)}</a>`;
      } else if (r.kind === 'url') {
        valueHtml = `<a href="${escapeUrl(r.value)}" target="_blank" rel="noopener noreferrer" style="color:${BRAND[700]};text-decoration:none;">${escapeHtml(r.value)}</a>`;
      } else {
        valueHtml = escapeHtml(r.value);
      }
      return `<tr>
<td style="padding:10px 14px;color:${NEUTRAL[500]};font-size:${SIZE.xs};text-transform:uppercase;letter-spacing:0.05em;background:${NEUTRAL[50]};border-bottom:1px solid ${NEUTRAL[200]};width:40%;vertical-align:top;">${escapeHtml(r.label)}</td>
<td style="padding:10px 14px;color:${NEUTRAL[900]};font-size:${SIZE.body};border-bottom:1px solid ${NEUTRAL[200]};">${valueHtml}</td>
</tr>`;
    })
    .join('');
  return section(`
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid ${NEUTRAL[200]};border-radius:${RADIUS.md};overflow:hidden;">
${tbody}
</table>
`, `${SPACE.lg} ${SPACE['2xl']} ${SPACE.sm}`);
}

// ── Badges de estado ──────────────────────────────────────────────────────

export type StatusKind =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'paid'
  | 'failed'
  | 'info';

export function statusBadge(status: StatusKind, label?: string): string {
  const map: Record<StatusKind, { bg: string; fg: string; text: string }> = {
    pending: { bg: SEMANTIC.warning.soft, fg: SEMANTIC.warning.textStrong, text: 'Pendiente' },
    approved: { bg: SEMANTIC.success.soft, fg: SEMANTIC.success.textStrong, text: 'Aprobado' },
    rejected: { bg: SEMANTIC.danger.soft, fg: SEMANTIC.danger.textStrong, text: 'Rechazado' },
    active: { bg: SEMANTIC.success.soft, fg: SEMANTIC.success.textStrong, text: 'Activo' },
    inactive: { bg: NEUTRAL[200], fg: NEUTRAL[600], text: 'Inactivo' },
    paid: { bg: SEMANTIC.success.soft, fg: SEMANTIC.success.textStrong, text: 'Pagado' },
    failed: { bg: SEMANTIC.danger.soft, fg: SEMANTIC.danger.textStrong, text: 'Fallido' },
    info: { bg: SEMANTIC.info.soft, fg: SEMANTIC.info.textStrong, text: 'Info' },
  };
  const s = map[status];
  const text = label ?? s.text;
  return `<span style="display:inline-block;background:${s.bg};color:${s.fg};font-size:${SIZE.xs};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:4px 10px;border-radius:${RADIUS.pill};">${escapeHtml(text)}</span>`;
}

// ── Stats grid (KPIs en fila) ─────────────────────────────────────────────

export interface StatItem {
  label: string;
  value: string;
  emoji?: string;
}

/** Hasta 3 KPIs por fila se ven bien en desktop + mobile. */
export function statsGrid(items: StatItem[]): string {
  const limited = items.slice(0, 3);
  const width = Math.floor(100 / limited.length);
  const cells = limited
    .map(
      (s) => `<td width="${width}%" align="center" style="padding:${SPACE.lg} ${SPACE.sm};background:${BRAND[50]};border-radius:${RADIUS.md};">
${s.emoji ? `<div style="font-size:24px;line-height:1;margin-bottom:${SPACE.sm};">${escapeHtml(s.emoji)}</div>` : ''}
<div style="font-family:${FONT.display};font-size:${SIZE.h2};font-weight:700;color:${BRAND[700]};line-height:1;">${escapeHtml(s.value)}</div>
<div style="color:${NEUTRAL[500]};font-size:${SIZE.xs};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-top:${SPACE.sm};">${escapeHtml(s.label)}</div>
</td>`
    )
    .join(`<td width="8" style="font-size:0;line-height:0;">&nbsp;</td>`);
  return section(`
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>${cells}</tr>
</table>
`, `${SPACE.md} ${SPACE['2xl']}`);
}

// ── Divider ────────────────────────────────────────────────────────────────

export function divider(): string {
  return `<tr><td style="padding:${SPACE.lg} ${SPACE['2xl']};">
<hr style="border:none;border-top:1px solid ${BRAND[100]};margin:0;" />
</td></tr>`;
}

// ── Signature block (firma de Pedro / founder) ────────────────────────────

export interface SignatureOptions {
  /** Nombre del firmante. Default 'Pedro'. */
  name?: string;
  /** Rol / contexto. Default 'Paw Friend 🐾'. */
  role?: string;
  /** Mensaje intro antes de la firma. */
  intro?: string;
}

export function signature(opts: SignatureOptions = {}): string {
  const { name = 'Pedro', role = 'Paw Friend 🐾', intro } = opts;
  return section(`
${intro ? `<p style="margin:0 0 ${SPACE.md};color:${NEUTRAL[700]};font-size:${SIZE.md};line-height:1.6;">${escapeHtml(intro)}</p>` : ''}
<p style="margin:0;color:${NEUTRAL[700]};font-size:${SIZE.md};line-height:1.6;">
Con cariño,<br>
<strong style="color:${BRAND[700]};">${escapeHtml(name)}</strong> · ${escapeHtml(role)}
</p>
`);
}

// ── Blockquote / pull quote ────────────────────────────────────────────────

export function blockquote(text: string, author?: string): string {
  return section(`
<div style="background:${BRAND[50]};border-left:3px solid ${BRAND[400]};border-radius:${RADIUS.md};padding:${SPACE.md} ${SPACE.lg};">
<p style="margin:0;color:${BRAND[900]};font-size:${SIZE.md};line-height:1.6;font-style:italic;">${escapeHtml(text)}</p>
${author ? `<p style="margin:${SPACE.sm} 0 0;color:${BRAND[700]};font-size:${SIZE.xs};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">— ${escapeHtml(author)}</p>` : ''}
</div>
`, `${SPACE.md} ${SPACE['2xl']}`);
}

// ── Spacer (espacio vertical controlado) ──────────────────────────────────

export function spacer(height: keyof typeof SPACE = 'xl'): string {
  return `<tr><td style="height:${SPACE[height]};line-height:${SPACE[height]};font-size:0;">&nbsp;</td></tr>`;
}

// ── Generic table (para reportes) ─────────────────────────────────────────

export interface TableColumn {
  label: string;
  /** Alineación del contenido. Default 'left'. */
  align?: 'left' | 'center' | 'right';
  /** Ancho en px o % (ej. '25%'). */
  width?: string;
}

export interface DataTableOptions {
  columns: TableColumn[];
  rows: string[][];
  caption?: string;
}

export function dataTable(opts: DataTableOptions): string {
  const { columns, rows, caption } = opts;
  const headRow = columns
    .map(
      (c) =>
        `<th align="${c.align ?? 'left'}" ${c.width ? `width="${escapeHtml(c.width)}"` : ''} style="padding:10px 14px;background:${BRAND[600]};color:#ffffff;font-size:${SIZE.xs};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">${escapeHtml(c.label)}</th>`
    )
    .join('');
  const bodyRows = rows
    .map((r, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : NEUTRAL[50];
      const cells = r
        .map(
          (cell, idx) =>
            `<td align="${columns[idx]?.align ?? 'left'}" style="padding:10px 14px;font-size:${SIZE.body};color:${NEUTRAL[700]};border-bottom:1px solid ${NEUTRAL[200]};">${escapeHtml(cell)}</td>`
        )
        .join('');
      return `<tr style="background:${bg};">${cells}</tr>`;
    })
    .join('');
  return section(`
${caption ? `<p style="margin:0 0 ${SPACE.sm};color:${NEUTRAL[500]};font-size:${SIZE.sm};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(caption)}</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;border-radius:${RADIUS.md};overflow:hidden;border:1px solid ${NEUTRAL[200]};">
<thead><tr>${headRow}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
`, `${SPACE.lg} ${SPACE['2xl']}`);
}
