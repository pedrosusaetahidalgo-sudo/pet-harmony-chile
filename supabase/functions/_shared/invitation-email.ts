// Email template compartido para invitaciones de mascotas (vet → dueño).
// Usa la paleta de marca Paw Friend: morado #9333EA primary.

const LOGO_URL = 'https://pawfriend.cl/pwa-icon-512.png';
const WORDMARK_URL = 'https://pawfriend.cl/paw_friend_wordmark_horizontal.svg';

export function buildInvitationEmail(opts: {
  petName: string;
  ownerName: string;
  vetName: string;
  clinicName: string;
  actionUrl: string;
}): string {
  const { petName, ownerName, vetName, clinicName, actionUrl } = opts;
  const firstName = ownerName.split(' ')[0] || ownerName;
  const safePetName = escapeHtml(petName);
  const safeFirstName = escapeHtml(firstName);
  const safeVetName = escapeHtml(vetName);
  const safeClinicName = escapeHtml(clinicName);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safePetName} ya tiene ficha en Paw Friend</title>
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
              Hola ${safeFirstName}! Soy ${safePetName} y tengo noticias geniales: mi vet me creo una ficha medica digital, y necesito que la tengas tu tambien.
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
        <span style="font-size:18px;vertical-align:middle;margin-right:6px;">🩺</span>
        <strong>${safeVetName}</strong>${safeClinicName ? ` de ${safeClinicName}` : ''} acaba de crear la ficha clinica de ${safePetName} en Paw Friend.
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
      ${safePetName} te envio este correo con la ayuda de su vet y de
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
