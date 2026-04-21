// Email template compartido para invitaciones de mascotas (vet → dueño).
// Usa la paleta de marca Paw Friend: morado #9333EA primary.

// Brand kit v2 (2026-04-20): assets canonicos servidos desde /paw-friend-assets-v2/.
// Los paths antiguos en raiz de /public siguen funcionando como fallback para
// deploys viejos no rebuildeados; el code de esta edge fn usa v2 cuando Pedro
// hace redeploy.
const LOGO_URL = 'https://pawfriend.cl/paw-friend-assets-v2/logo/pwa_icon_512.png';
const WORDMARK_URL =
  'https://pawfriend.cl/paw-friend-assets-v2/logo/paw_friend_wordmark_horizontal.svg';

export function buildInvitationEmail(opts: {
  petName: string;
  ownerName: string;
  vetName: string;
  clinicName: string;
  actionUrl: string;
  /**
   * Tipo de quien invita. 'vet' = veterinario (default).
   * 'shelter' = refugio/hogar de adopcion que entrega la mascota al adoptante.
   * Ajusta copy del email y etiquetas visibles.
   */
  sourceKind?: 'vet' | 'shelter';
}): string {
  const { petName, ownerName, vetName, clinicName, actionUrl } = opts;
  const sourceKind = opts.sourceKind || 'vet';
  const firstName = ownerName.split(' ')[0] || ownerName;
  const safePetName = escapeHtml(petName);
  const safeFirstName = escapeHtml(firstName);
  const safeVetName = escapeHtml(vetName);
  const safeClinicName = escapeHtml(clinicName);
  const isShelter = sourceKind === 'shelter';
  // Copy dinamico segun fuente de la invitacion
  const sourceIcon = isShelter ? '🏡' : '🩺';
  const bubblePetMsg = isShelter
    ? `Hola ${safeFirstName}! Soy ${safePetName}. Desde hoy estoy con mi nueva familia y el refugio que me cuidaba te esta entregando mi historia completa.`
    : `Hola ${safeFirstName}! Soy ${safePetName} y tengo noticias geniales: mi vet me creo una ficha medica digital, y necesito que la tengas tu tambien.`;
  const sourceCardMsg = isShelter
    ? `<strong>${safeVetName}</strong>${safeClinicName ? ` de ${safeClinicName}` : ''} te entrega la ficha completa de ${safePetName}: historial, vacunas, fotos y notas del cuidado en el refugio.`
    : `<strong>${safeVetName}</strong>${safeClinicName ? ` de ${safeClinicName}` : ''} acaba de crear la ficha clinica de ${safePetName} en Paw Friend.`;
  const subjectHint = isShelter
    ? `ya llega a tu casa con su ficha medica`
    : `ya tiene ficha veterinaria`;
  const footerLine = isShelter
    ? `${safePetName} te envio este correo con la ayuda del refugio y de`
    : `${safePetName} te envio este correo con la ayuda de su vet y de`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safePetName} ${subjectHint} en Paw Friend</title>
</head>
<body style="margin:0;padding:0;background:#faf5ff;font-family:'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(147,51,234,0.15);border:1px solid #f3e8ff;">

  <!-- Header con gradiente morado -->
  <tr><td style="background:linear-gradient(135deg,#9333ea 0%,#a855f7 50%,#c084fc 100%);padding:40px 24px 32px;text-align:center;">
    <img src="${LOGO_URL}" alt="Paw Friend" width="64" height="64" style="border-radius:16px;display:inline-block;border:3px solid rgba(255,255,255,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
    <div style="margin-top:14px;">
      <img src="${WORDMARK_URL}" alt="Paw Friend" height="24" style="height:24px;display:inline-block;filter:brightness(0) invert(1);" />
    </div>
    <p style="color:rgba(255,255,255,0.95);font-size:13px;margin:10px 0 0;font-weight:500;letter-spacing:0.3px;">La ficha medica de tu mascota, en tu bolsillo</p>
  </td></tr>

  <!-- Mensaje de la mascota al dueño (chat bubble) -->
  <tr><td style="padding:32px 32px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48" valign="top" style="padding-right:14px;">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#9333ea,#c084fc);text-align:center;line-height:48px;font-size:26px;box-shadow:0 4px 12px rgba(147,51,234,0.25);">🐾</div>
        </td>
        <td>
          <div style="background:#f3e8ff;border:1px solid #e9d5ff;border-radius:18px;border-top-left-radius:4px;padding:18px 22px;">
            <p style="margin:0 0 6px;font-weight:700;color:#7e22ce;font-size:13px;letter-spacing:0.2px;">${safePetName} dice:</p>
            <p style="margin:0;color:#3b0764;font-size:15px;line-height:1.55;">
              ${bubblePetMsg}
            </p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Tarjeta del vet -->
  <tr><td style="padding:20px 32px 0;">
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:14px;padding:16px 20px;">
      <p style="margin:0;color:#15803d;font-size:13px;line-height:1.55;">
        <span style="font-size:18px;vertical-align:middle;margin-right:6px;">${sourceIcon}</span>
        ${sourceCardMsg}
      </p>
    </div>
  </td></tr>

  <!-- Lista de beneficios -->
  <tr><td style="padding:24px 32px 8px;">
    <p style="color:#7e22ce;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">Que vas a encontrar dentro</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">📋</span>
        Ficha clinica completa, descargable en PDF
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">💉</span>
        Vacunas y antiparasitarios con recordatorios automaticos
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">🔔</span>
        Alertas de controles, desparasitaciones y citas
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">📎</span>
        Examenes, recetas e imagenes en un solo lugar
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">🃏</span>
        Una Paw Card coleccionable unica de ${safePetName}
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">🔗</span>
        Compartir la ficha con otro vet si viajas o hay urgencia
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA principal -->
  <tr><td style="padding:28px 32px 8px;" align="center">
    <a href="${actionUrl}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#9333ea,#7e22ce);color:#ffffff;font-size:17px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:14px;box-shadow:0 8px 24px rgba(147,51,234,0.35);letter-spacing:0.4px;">
      🐾 Ver la ficha de ${safePetName}
    </a>
  </td></tr>
  <tr><td style="padding:6px 32px 28px;" align="center">
    <p style="color:#94a3b8;font-size:12px;margin:0;">
      Es gratis y toma menos de 1 minuto · Te crearas tu cuenta de dueno
    </p>
  </td></tr>

  <!-- Mensaje de cierre de la mascota -->
  <tr><td style="padding:0 32px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48" valign="top" style="padding-right:14px;">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#9333ea,#c084fc);text-align:center;line-height:48px;font-size:26px;box-shadow:0 4px 12px rgba(147,51,234,0.25);">🐾</div>
        </td>
        <td>
          <div style="background:#f3e8ff;border:1px solid #e9d5ff;border-radius:18px;border-top-left-radius:4px;padding:16px 22px;">
            <p style="margin:0;color:#3b0764;font-size:14px;line-height:1.55;">
              Te espero adentro! No me dejes en visto 🥺👉👈
            </p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#faf5ff;padding:22px 32px;border-top:1px solid #f3e8ff;">
    <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0;line-height:1.7;">
      ${footerLine}
      <a href="https://pawfriend.cl" style="color:#9333ea;text-decoration:none;font-weight:600;">Paw Friend</a><br>
      Si no reconoces a ${safePetName}, puedes ignorar este correo sin problema.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════════════════
// CO-OWNER INVITE (2026-04-21): el dueno de una mascota invita a otra
// persona (pareja, familia, cuidador, entrenador) a compartir la ficha.
// Distinto del vet/shelter → owner: el invitado NO se vuelve owner,
// solo tiene view/edit permissions segun el rol.
// ═══════════════════════════════════════════════════════════════════════

const ROLE_COPY: Record<
  'co_owner' | 'caretaker' | 'trainer' | 'family_member',
  { label: string; scope: string }
> = {
  co_owner: {
    label: 'Co-dueno/a',
    scope: 'Puedes ver y editar la ficha completa de la mascota, agregar recordatorios, subir documentos y mas.',
  },
  family_member: {
    label: 'Familiar',
    scope: 'Puedes ver la ficha completa sin editarla: controles, vacunas, peso, fotos y documentos.',
  },
  caretaker: {
    label: 'Cuidador/a',
    scope: 'Podes ver la ficha y agregar notas de cuidado (paseo, comida, comportamiento, incidentes).',
  },
  trainer: {
    label: 'Entrenador/a',
    scope: 'Podes ver la ficha y registrar rutinas de entrenamiento + progreso.',
  },
};

export function buildCoOwnerInviteEmail(opts: {
  petName: string;
  inviterName: string;
  role: 'co_owner' | 'caretaker' | 'trainer' | 'family_member';
  actionUrl: string;
}): string {
  const { petName, inviterName, role, actionUrl } = opts;
  const safePetName = escapeHtml(petName);
  const safeInviter = escapeHtml(inviterName);
  const roleCopy = ROLE_COPY[role] ?? ROLE_COPY.co_owner;
  const safeRoleLabel = escapeHtml(roleCopy.label);
  const safeScope = escapeHtml(roleCopy.scope);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeInviter} te invito a compartir ${safePetName} en Paw Friend</title>
</head>
<body style="margin:0;padding:0;background:#faf5ff;font-family:'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(147,51,234,0.15);border:1px solid #f3e8ff;">

  <!-- Header con gradiente morado -->
  <tr><td style="background:linear-gradient(135deg,#9333ea 0%,#a855f7 50%,#c084fc 100%);padding:40px 24px 32px;text-align:center;">
    <img src="${LOGO_URL}" alt="Paw Friend" width="64" height="64" style="border-radius:16px;display:inline-block;border:3px solid rgba(255,255,255,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
    <div style="margin-top:14px;">
      <img src="${WORDMARK_URL}" alt="Paw Friend" height="24" style="height:24px;display:inline-block;filter:brightness(0) invert(1);" />
    </div>
    <p style="color:rgba(255,255,255,0.95);font-size:13px;margin:10px 0 0;font-weight:500;letter-spacing:0.3px;">La ficha medica de tu mascota, compartida</p>
  </td></tr>

  <!-- Mensaje principal -->
  <tr><td style="padding:36px 32px 0;text-align:center;">
    <p style="margin:0 0 6px;color:#7e22ce;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Te invitaron</p>
    <h1 style="margin:0 0 10px;color:#3b0764;font-size:24px;font-weight:800;line-height:1.3;">
      <strong>${safeInviter}</strong> quiere que seas<br>
      <span style="color:#9333ea;">${safeRoleLabel}</span> de ${safePetName}
    </h1>
  </td></tr>

  <!-- Card del rol -->
  <tr><td style="padding:22px 32px 0;">
    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:14px;padding:18px 22px;">
      <p style="margin:0 0 6px;color:#15803d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Que vas a poder hacer</p>
      <p style="margin:0;color:#166534;font-size:14px;line-height:1.55;">
        ${safeScope}
      </p>
    </div>
  </td></tr>

  <!-- Beneficios -->
  <tr><td style="padding:24px 32px 8px;">
    <p style="color:#7e22ce;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">En Paw Friend tenes</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">📋</span>
        Ficha clinica completa accesible desde el celular
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">🔔</span>
        Recordatorios de vacunas, controles y medicacion
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">🚨</span>
        En emergencias veterinarias, la ficha esta a un click
      </td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#334155;">
        <span style="display:inline-block;width:34px;text-align:center;font-size:18px;">🔗</span>
        Compartir con otro vet o familiar cuando lo necesites
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA principal -->
  <tr><td style="padding:28px 32px 8px;" align="center">
    <a href="${actionUrl}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#9333ea,#7e22ce);color:#ffffff;font-size:17px;font-weight:700;text-decoration:none;padding:18px 48px;border-radius:14px;box-shadow:0 8px 24px rgba(147,51,234,0.35);letter-spacing:0.4px;">
      🐾 Aceptar invitacion
    </a>
  </td></tr>
  <tr><td style="padding:6px 32px 28px;" align="center">
    <p style="color:#94a3b8;font-size:12px;margin:0;">
      Si no tenes cuenta, podras crearla desde ese link · Es gratis
    </p>
  </td></tr>

  <!-- Seguridad nota -->
  <tr><td style="padding:0 32px 28px;">
    <p style="color:#64748b;font-size:12px;line-height:1.55;margin:0;text-align:center;">
      Podes aceptar o rechazar esta invitacion. ${safeInviter} puede revocar tu acceso en cualquier momento.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#faf5ff;padding:22px 32px;border-top:1px solid #f3e8ff;">
    <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0;line-height:1.7;">
      Te envio este correo <a href="https://pawfriend.cl" style="color:#9333ea;text-decoration:none;font-weight:600;">Paw Friend</a> en nombre de ${safeInviter}.<br>
      Si no reconoces a ${safeInviter} o ${safePetName}, podes ignorar este correo sin problema.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Send email via Resend ──────────────────────────────────────────────
export async function sendInvitationViaResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' };

  const from =
    Deno.env.get('RESEND_FROM_EMAIL') || 'Paw Friend <onboarding@resend.dev>';

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      // Reply-to ayuda a que no caiga en spam
      reply_to: 'hola@pawfriend.cl',
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    console.error('[Resend] error:', resp.status, body);
    return { ok: false, error: body };
  }
  return { ok: true };
}
