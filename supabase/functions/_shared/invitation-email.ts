// Paw Friend — Templates de invitación (vet/shelter → dueño, dueño → co-owner).
// 2026-04-21 · Refactor: usa el sistema compartido `email-theme` + `email-blocks`
// + `email-layout`. Los HEX, gradientes y assets NO se hardcodean aquí.

import {
  bulletList,
  callout,
  calloutRaw,
  cta,
  emailFooter,
  emailHeader,
  paragraph,
  petBubble,
  spacer,
} from './email-blocks.ts';
import {
  escapeHtml,
  firstName as firstNameOf,
  renderEmail,
  sendEmail,
  type SendEmailOptions,
  type SendEmailResult,
} from './email-layout.ts';
import { BRAND, TAGLINE } from './email-theme.ts';

// ═══════════════════════════════════════════════════════════════════════════
// Invitación vet/shelter → dueño
// ═══════════════════════════════════════════════════════════════════════════

export interface InvitationEmailOptions {
  petName: string;
  ownerName: string;
  vetName: string;
  clinicName: string;
  actionUrl: string;
  /**
   * 'vet' (default) = veterinario creó la ficha y la comparte.
   * 'shelter' = refugio/hogar de adopción entrega la mascota con su ficha al adoptante.
   */
  sourceKind?: 'vet' | 'shelter';
}

export function buildInvitationEmail(opts: InvitationEmailOptions): string {
  const { petName, ownerName, vetName, clinicName, actionUrl } = opts;
  const sourceKind = opts.sourceKind ?? 'vet';
  const first = firstNameOf(ownerName);
  const isShelter = sourceKind === 'shelter';

  const safePet = escapeHtml(petName);
  const safeVet = escapeHtml(vetName);
  const safeClinic = escapeHtml(clinicName);

  const subjectHint = isShelter
    ? 'ya llega a tu casa con su ficha medica'
    : 'ya tiene ficha veterinaria';

  // Mensaje principal en la burbuja de la mascota
  const bubbleMsg = isShelter
    ? `Hola ${first}! Soy ${petName}. Desde hoy estoy con mi nueva familia y el refugio que me cuidaba te esta entregando mi historia completa.`
    : `Hola ${first}! Soy ${petName} y tengo noticias geniales: mi vet me creo una ficha medica digital, y necesito que la tengas tu tambien.`;

  // Callout de quién entrega (HTML controlado: <strong> y texto ya escapados)
  const sourceIcon = isShelter ? '🏡' : '🩺';
  const sourceLabel = isShelter ? 'El refugio' : 'Tu veterinario';
  const sourceBodyHtml = isShelter
    ? `<strong>${safeVet}</strong>${safeClinic ? ` de ${safeClinic}` : ''} te entrega la ficha completa de ${safePet}: historial, vacunas, fotos y notas del cuidado en el refugio.`
    : `<strong>${safeVet}</strong>${safeClinic ? ` de ${safeClinic}` : ''} acaba de crear la ficha clinica de ${safePet} en Paw Friend.`;

  const body = [
    emailHeader({
      variant: 'logo',
      tagline: TAGLINE.owner,
    }),
    petBubble({
      petName,
      message: bubbleMsg,
    }),
    calloutRaw({
      variant: 'success',
      label: sourceLabel,
      icon: sourceIcon,
      bodyHtml: sourceBodyHtml,
    }),
    bulletList({
      label: 'Que vas a encontrar dentro',
      items: [
        { icon: '📋', text: 'Ficha clinica completa, descargable en PDF' },
        { icon: '💉', text: 'Vacunas y antiparasitarios con recordatorios automaticos' },
        { icon: '🔔', text: 'Alertas de controles, desparasitaciones y citas' },
        { icon: '📎', text: 'Examenes, recetas e imagenes en un solo lugar' },
        { icon: '🃏', text: `Una Paw Card coleccionable unica de ${petName}` },
        { icon: '🔗', text: 'Compartir la ficha con otro vet si viajas o hay urgencia' },
      ],
    }),
    cta({
      text: `🐾 Ver la ficha de ${petName}`,
      url: actionUrl,
      hint: 'Es gratis y toma menos de 1 minuto · Te crearas tu cuenta de dueno',
    }),
    petBubble({
      message: 'Te espero adentro! No me dejes en visto 🥺👉👈',
    }),
    spacer('md'),
    emailFooter({
      note: isShelter
        ? `${petName} te envio este correo con la ayuda del refugio y de`
        : `${petName} te envio este correo con la ayuda de su vet y de`,
      secondary: `Si no reconoces a ${petName}, puedes ignorar este correo sin problema.`,
    }),
  ].join('');

  return renderEmail({
    title: `${petName} ${subjectHint} en Paw Friend`,
    preheader: isShelter
      ? `${petName} llega con su ficha medica completa: vacunas, peso, notas del refugio. Abrila en 1 minuto.`
      : `${petName} ya tiene ficha veterinaria. Abrila y vas a ver historial, vacunas y recordatorios. Es gratis.`,
    body,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Invitación co-owner (dueño → pareja / familia / cuidador / entrenador)
// ═══════════════════════════════════════════════════════════════════════════

export type CoOwnerRole = 'co_owner' | 'caretaker' | 'trainer' | 'family_member';

const ROLE_COPY: Record<CoOwnerRole, { label: string; scope: string }> = {
  co_owner: {
    label: 'Co-dueno/a',
    scope:
      'Puedes ver y editar la ficha completa de la mascota, agregar recordatorios, subir documentos y mas.',
  },
  family_member: {
    label: 'Familiar',
    scope:
      'Puedes ver la ficha completa sin editarla: controles, vacunas, peso, fotos y documentos.',
  },
  caretaker: {
    label: 'Cuidador/a',
    scope:
      'Puedes ver la ficha y agregar notas de cuidado (paseo, comida, comportamiento, incidentes).',
  },
  trainer: {
    label: 'Entrenador/a',
    scope: 'Puedes ver la ficha y registrar rutinas de entrenamiento + progreso.',
  },
};

export interface CoOwnerInviteOptions {
  petName: string;
  inviterName: string;
  role: CoOwnerRole;
  actionUrl: string;
}

export function buildCoOwnerInviteEmail(opts: CoOwnerInviteOptions): string {
  const { petName, inviterName, role, actionUrl } = opts;
  const roleCopy = ROLE_COPY[role] ?? ROLE_COPY.co_owner;

  const safePet = escapeHtml(petName);
  const safeInviter = escapeHtml(inviterName);
  const safeRoleLabel = escapeHtml(roleCopy.label);

  // Título híbrido: <strong>inviter</strong> quiere que seas <span>rol</span> de pet
  const titleHtml = `<strong>${safeInviter}</strong> quiere que seas<br><span style="color:${BRAND[600]};">${safeRoleLabel}</span> de ${safePet}`;

  const body = [
    emailHeader({
      variant: 'logo',
      tagline: TAGLINE.share,
    }),
    // Heading custom con HTML controlado (no pasamos por heading() porque
    // necesitamos strong/span embebidos)
    `<tr><td class="pf-pad-x" style="padding:32px 32px 0;text-align:center;">
<p style="margin:0 0 6px;color:${BRAND[700]};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Te invitaron</p>
<h1 class="pf-h1" style="margin:0 0 10px;color:${BRAND[900]};font-size:24px;font-weight:800;line-height:1.3;">${titleHtml}</h1>
</td></tr>`,
    callout({
      variant: 'success',
      label: 'Que vas a poder hacer',
      body: roleCopy.scope,
    }),
    bulletList({
      label: 'En Paw Friend tienes',
      items: [
        { icon: '📋', text: 'Ficha clinica completa accesible desde el celular' },
        { icon: '🔔', text: 'Recordatorios de vacunas, controles y medicacion' },
        { icon: '🚨', text: 'En emergencias veterinarias, la ficha esta a un click' },
        { icon: '🔗', text: 'Compartir con otro vet o familiar cuando lo necesites' },
      ],
    }),
    cta({
      text: '🐾 Aceptar invitacion',
      url: actionUrl,
      hint: 'Si no tienes cuenta, podrás crearla desde ese link · Es gratis',
    }),
    paragraph({
      text: `Puedes aceptar o rechazar esta invitación. ${inviterName} puede revocar tu acceso en cualquier momento.`,
      align: 'center',
      muted: true,
      size: 'sm',
    }),
    spacer('md'),
    emailFooter({
      note: `Te envio este correo Paw Friend en nombre de ${inviterName}.`,
      secondary: `Si no reconoces a ${inviterName} o ${petName}, puedes ignorar este correo sin problema.`,
    }),
  ].join('');

  return renderEmail({
    title: `${inviterName} te invito a compartir ${petName} en Paw Friend`,
    preheader: `${inviterName} te agrego como ${roleCopy.label.toLowerCase()} de ${petName}. Entra en 1 click.`,
    body,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Envío (wrapper de compat — delega en sendEmail del layout)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Envía un email vía Resend. Signature preservada para compatibilidad con
 * llamadores existentes (`send-pet-invitation`, `send-co-owner-invitation`).
 * Nuevas edge fns deben importar `sendEmail` de `email-layout.ts` directo.
 */
export async function sendInvitationViaResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const result: SendEmailResult = await sendEmail({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  } satisfies SendEmailOptions);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
