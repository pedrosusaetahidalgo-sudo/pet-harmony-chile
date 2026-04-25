"""
Outreach a refugios — envío personalizado vía Gmail SMTP.

Modos:
    --dry-run                    imprime los emails listos SIN enviar (default)
    --send-test                  manda 1 email de prueba a SMTP_USER (a sí mismo)
    --send-all                   manda a los refugios reales (requiere confirmación)
    --recipient <email>          override: manda sólo a ese destinatario (debug)

Setup:
    1. En Gmail (pawfriendcl@gmail.com): activar 2FA + crear app password
       https://myaccount.google.com/apppasswords
    2. Copiar .env.local.example → .env.local y rellenar GMAIL_APP_PASSWORD
    3. NUNCA commitear .env.local

Uso típico:
    # 1. Revisar borradores
    python scripts/send_outreach_refugios.py --dry-run

    # 2. Probar con uno mismo
    python scripts/send_outreach_refugios.py --send-test

    # 3. Enviar real
    python scripts/send_outreach_refugios.py --send-all

Log de envíos: _pending/outreach_log.csv
"""

import argparse
import csv
import os
import smtplib
import sys
import time
from datetime import datetime
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# Windows cp1252 rompe con ✓/✗/—; forzar UTF-8 en stdout/stderr
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

REPO_ROOT = Path(__file__).resolve().parent.parent
LOG_PATH = REPO_ROOT / "_pending" / "outreach_log.csv"
ENV_PATH = REPO_ROOT / ".env.local"
LOGO_PATH = REPO_ROOT / "public" / "paw-friend-assets-v2" / "logo" / "pwa_icon_192.png"

# ── Cargar .env.local manualmente (sin python-dotenv para no agregar dep) ─────
def load_env_local():
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), val)

load_env_local()

# ── Config ──────────────────────────────────────────────────────────────────
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.environ.get("GMAIL_USER", "pawfriendcl@gmail.com")
# Gmail muestra el app password con espacios visuales; SMTP los rechaza
SMTP_PASS = (os.environ.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
FROM_NAME = os.environ.get("GMAIL_FROM_NAME", "Pedro Susaeta — Paw Friend")
WHATSAPP = "+56 9 8209 2588"
WEBSITE = "https://pawfriend.cl"

# Rate limit — Gmail tolera mucho más, pero queremos verse humano
SECONDS_BETWEEN_SENDS = 30

# ── Lista de destinatarios (sólo emails verificables) ────────────────────────
RECIPIENTS = [
    {
        "refugio": "Proanimal",
        "email": "contacto@proanimal.cl",
        "saludo": "equipo de Proanimal",
        "personalizado": (
            "Conozco el trabajo que hacen con esterilizaciones y con todos los animales "
            "que rescatan en distintas comunas. Justamente ahí cuesta más mantener el "
            "rastro de cada uno cuando ya pasaron por ustedes."
        ),
    },
    {
        "refugio": "Refugio El Arca",
        "email": "refugioelarca@gmail.com",
        "saludo": "equipo del Refugio El Arca",
        "personalizado": (
            "Veo que tienen rescates seguidos y van fotografiando a los animales en su "
            "proceso, y eso es justo el tipo de fotos que me sirven para esto."
        ),
    },
    {
        "refugio": "Adoptame.cl",
        "email": "hola@adoptame.cl",
        "saludo": "equipo de Adoptame.cl",
        "personalizado": (
            "Como ustedes trabajan con varios refugios a la vez, esto podría abrir la "
            "puerta a algo más grande que un refugio solo. Y a los refugios que ustedes "
            "listan, identificar a los animales también les terminaría sumando."
        ),
    },
    {
        "refugio": "Fundación Galgos Chile",
        "email": "galgoschile@gmail.com",
        "saludo": "equipo de Galgos Chile",
        "personalizado": (
            "Con los galgos rescatados de canódromos suelen tener registro fotográfico "
            "fuerte (antes y después, la evolución del animal), y eso es exactamente lo "
            "que necesito: la misma mascota en distintos momentos."
        ),
    },
    {
        "refugio": "Refugio Voz Animal",
        "email": "vozanimalrefugio@gmail.com",
        "saludo": "equipo del Refugio Voz Animal",
        "personalizado": (
            "Sé que son una operación más chica y eso a veces es ventaja: deciden rápido, "
            "hablan directo. Por eso los contacto sin armar mucho proceso."
        ),
    },
]


# ── Template ────────────────────────────────────────────────────────────────
SUBJECT = "Hola, les escribo desde Paw Friend"


def build_body(saludo: str, personalizado: str) -> tuple[str, str]:
    """Devuelve (texto plano, html)."""
    text = f"""Hola {saludo},

Les escribo porque estoy desarrollando Paw Friend ({WEBSITE}), una app que estoy haciendo para dueños de mascotas acá en Chile. Todavía no la lanzamos al público pero ya está bastante avanzada.

Una de las cosas que estoy construyendo es identificar mascotas por la nariz. La nariz de cada perro y de cada gato es única, como una huella digital, y se puede usar para reconocerlos en una foto. Sirve sobre todo cuando se pierden o cuando llegan animales sin chip a un refugio o a la calle.

{personalizado}

Para que el sistema funcione bien necesito un tipo de fotos muy específico: fotos de la misma mascota en distintos momentos. O sea, no me sirve una foto suelta de cada perro — necesito que estén etiquetadas por animal, para que el modelo aprenda a reconocer que esta foto y esta otra son del mismo "Firulais".

Los refugios suelen tener algo así en su archivo (foto al ingreso, foto en control, foto al momento de la adopción). Si me pueden dar acceso a fotos así, organizadas por animal, me ayudan muchísimo. Cualquier formato sirve: carpetas en el computador, álbumes, drive, lo que sea.

Las fotos no se publican ni se comparten en ningún lado, sólo las uso para entrenar el modelo. Si les hace falta, firmamos algo simple por escrito.

A cambio, cuando lancemos:
- Les armo una cuenta gratis para que carguen sus mascotas y la transferencia al adoptante quede con la ficha clínica completa.
- Los nombramos en los créditos del feature ("entrenado con la colaboración de [su nombre]").
- Acceso prioritario al sistema cuando esté listo (sirve para identificar si un animal que llega es uno que ya pasó por el refugio antes).
- Pueden recibir donaciones dirigidas a su refugio cuando activemos esa parte.

Si les hace sentido, podemos hablar 20 minutos por WhatsApp o video llamada para que vean cómo va el proyecto. Si no es prioridad ahora, igual gracias por lo que hacen.

Saludos,

Pedro Susaeta
{WEBSITE}
WhatsApp: {WHATSAPP}
"""

    html = f"""<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.5; color: #222;">
<p>Hola {saludo},</p>

<p>Les escribo porque estoy desarrollando <a href="{WEBSITE}">Paw Friend</a>, una app que estoy haciendo para dueños de mascotas acá en Chile. Todavía no la lanzamos al público pero ya está bastante avanzada.</p>

<p>Una de las cosas que estoy construyendo es identificar mascotas por la nariz. La nariz de cada perro y de cada gato es única, como una huella digital, y se puede usar para reconocerlos en una foto. Sirve sobre todo cuando se pierden o cuando llegan animales sin chip a un refugio o a la calle.</p>

<p>{personalizado}</p>

<p>Para que el sistema funcione bien necesito un tipo de fotos muy específico: fotos de la misma mascota en distintos momentos. O sea, no me sirve una foto suelta de cada perro — necesito que estén etiquetadas por animal, para que el modelo aprenda a reconocer que esta foto y esta otra son del mismo "Firulais".</p>

<p>Los refugios suelen tener algo así en su archivo (foto al ingreso, foto en control, foto al momento de la adopción). Si me pueden dar acceso a fotos así, organizadas por animal, me ayudan muchísimo. Cualquier formato sirve: carpetas en el computador, álbumes, drive, lo que sea.</p>

<p>Las fotos no se publican ni se comparten en ningún lado, sólo las uso para entrenar el modelo. Si les hace falta, firmamos algo simple por escrito.</p>

<p>A cambio, cuando lancemos:</p>
<ul>
  <li>Les armo una cuenta gratis para que carguen sus mascotas y la transferencia al adoptante quede con la ficha clínica completa.</li>
  <li>Los nombramos en los créditos del feature ("entrenado con la colaboración de [su nombre]").</li>
  <li>Acceso prioritario al sistema cuando esté listo (sirve para identificar si un animal que llega es uno que ya pasó por el refugio antes).</li>
  <li>Pueden recibir donaciones dirigidas a su refugio cuando activemos esa parte.</li>
</ul>

<p>Si les hace sentido, podemos hablar 20 minutos por WhatsApp o video llamada para que vean cómo va el proyecto. Si no es prioridad ahora, igual gracias por lo que hacen.</p>

<p>Saludos,</p>

<table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px">
  <tr>
    <td valign="middle" style="padding-right:14px">
      <a href="{WEBSITE}" style="text-decoration:none">
        <img src="cid:pawfriend_logo" width="56" height="56" alt="Paw Friend" style="border:0;display:block;border-radius:12px">
      </a>
    </td>
    <td valign="middle" style="font-size:14px;color:#222;line-height:1.45;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <strong>Pedro Susaeta</strong><br>
      Paw Friend &mdash; <span style="color:#888">en desarrollo</span><br>
      <a href="{WEBSITE}" style="color:#1976d2;text-decoration:none">{WEBSITE}</a> &middot;
      <a href="https://wa.me/56982092588" style="color:#1976d2;text-decoration:none">WhatsApp {WHATSAPP}</a>
    </td>
  </tr>
</table>
</body></html>"""

    return text, html


# ── Envío ───────────────────────────────────────────────────────────────────
def send_email(to_email: str, subject: str, text_body: str, html_body: str) -> bool:
    if not SMTP_PASS:
        print("ERROR: GMAIL_APP_PASSWORD no está seteado.")
        print(f"  Cargá .env.local con GMAIL_APP_PASSWORD=...")
        return False

    # Estructura: mixed > (alternative > text + html) + image (cid)
    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Reply-To"] = SMTP_USER

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(text_body, "plain", "utf-8"))
    alt.attach(MIMEText(html_body, "html", "utf-8"))
    msg.attach(alt)

    # Logo inline (cid:pawfriend_logo)
    if LOGO_PATH.exists():
        with open(LOGO_PATH, "rb") as f:
            logo = MIMEImage(f.read(), _subtype="png")
        logo.add_header("Content-ID", "<pawfriend_logo>")
        logo.add_header("Content-Disposition", "inline", filename="pawfriend_logo.png")
        msg.attach(logo)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"ERROR enviando a {to_email}: {e}")
        return False


def log_send(refugio: str, email: str, status: str, error: str = ""):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    new_file = not LOG_PATH.exists()
    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if new_file:
            writer.writerow(["timestamp", "refugio", "email", "status", "error"])
        writer.writerow([datetime.utcnow().isoformat(), refugio, email, status, error])


# ── Modos ───────────────────────────────────────────────────────────────────
def mode_dry_run():
    print(f"\n{'='*70}")
    print(f"DRY-RUN — {len(RECIPIENTS)} emails (NO se envía nada)")
    print(f"{'='*70}\n")
    for i, r in enumerate(RECIPIENTS, 1):
        text, _ = build_body(r["saludo"], r["personalizado"])
        print(f"\n--- [{i}/{len(RECIPIENTS)}] {r['refugio']} ---")
        print(f"Para: {r['email']}")
        print(f"Asunto: {SUBJECT}")
        print(f"Cuerpo:")
        print(text)
        print(f"--- fin email {i} ---\n")
    print(f"\n✓ Dry-run OK. Si te gusta, corré:")
    print(f"  python scripts/send_outreach_refugios.py --send-test")


def mode_send_test():
    if not SMTP_PASS:
        print("ERROR: falta GMAIL_APP_PASSWORD en .env.local")
        return
    print(f"\nEnviando vista previa a {SMTP_USER}...\n")
    # Usa el contenido exacto del primer refugio real (sin marcas de prueba)
    sample = RECIPIENTS[0]
    text, html = build_body(sample["saludo"], sample["personalizado"])
    ok = send_email(SMTP_USER, SUBJECT, text, html)
    if ok:
        print(f"[OK] Email enviado a {SMTP_USER}.")
        print(f"  Es el contenido exacto que recibira {sample['refugio']}.")
        print(f"  Si llego bien, corre:")
        print(f"  python scripts/send_outreach_refugios.py --send-all")
        log_send("PREVIEW", SMTP_USER, "sent")
    else:
        print(f"[FAIL] Fallo el envio de prueba.")
        log_send("PREVIEW", SMTP_USER, "failed")


def mode_send_all(skip_confirm: bool = False):
    if not SMTP_PASS:
        print("ERROR: falta GMAIL_APP_PASSWORD en .env.local")
        return

    print(f"\n{'='*70}")
    print(f"ENVIO REAL - {len(RECIPIENTS)} refugios")
    print(f"{'='*70}")
    print(f"Rate limit: 1 cada {SECONDS_BETWEEN_SENDS}s")
    print(f"Total tiempo estimado: ~{len(RECIPIENTS) * SECONDS_BETWEEN_SENDS // 60} min")
    print(f"\nDestinatarios:")
    for r in RECIPIENTS:
        print(f"  - {r['refugio']}: {r['email']}")

    if skip_confirm:
        print("\n[--yes] Skip confirmacion interactiva, arrancando envios...")
    else:
        confirm = input("\nConfirmas envio real? Tipa 'mandalo' para continuar: ").strip()
        if confirm != "mandalo":
            print("Cancelado.")
            return

    print(f"\nArrancando envíos...\n")
    sent = 0
    for i, r in enumerate(RECIPIENTS, 1):
        text, html = build_body(r["saludo"], r["personalizado"])
        print(f"[{i}/{len(RECIPIENTS)}] {r['refugio']} → {r['email']} ... ", end="", flush=True)
        ok = send_email(r["email"], SUBJECT, text, html)
        if ok:
            print("✓")
            log_send(r["refugio"], r["email"], "sent")
            sent += 1
        else:
            print("✗")
            log_send(r["refugio"], r["email"], "failed")
        if i < len(RECIPIENTS):
            time.sleep(SECONDS_BETWEEN_SENDS)

    print(f"\n=== Resumen: {sent}/{len(RECIPIENTS)} enviados ===")
    print(f"Log: {LOG_PATH}")


def mode_send_recipient(email: str):
    if not SMTP_PASS:
        print("ERROR: falta GMAIL_APP_PASSWORD en .env.local")
        return
    target = next((r for r in RECIPIENTS if r["email"] == email), None)
    if not target:
        print(f"ERROR: {email} no está en la lista. Disponibles:")
        for r in RECIPIENTS:
            print(f"  - {r['email']}")
        return
    text, html = build_body(target["saludo"], target["personalizado"])
    print(f"Enviando a {target['refugio']} ({target['email']})... ", end="", flush=True)
    ok = send_email(target["email"], SUBJECT, text, html)
    print("✓" if ok else "✗")
    log_send(target["refugio"], target["email"], "sent" if ok else "failed")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true", default=True, help="Imprime emails sin enviar (default)")
    group.add_argument("--send-test", action="store_true", help="Envia 1 email a SMTP_USER (a si mismo)")
    group.add_argument("--send-all", action="store_true", help="Envia a todos los refugios reales")
    group.add_argument("--recipient", type=str, help="Envia solo a ese destinatario")
    parser.add_argument("--yes", action="store_true", help="Skip confirmacion interactiva (para schtasks/cron)")
    args = parser.parse_args()

    if args.send_test:
        mode_send_test()
    elif args.send_all:
        mode_send_all(skip_confirm=args.yes)
    elif args.recipient:
        mode_send_recipient(args.recipient)
    else:
        mode_dry_run()


if __name__ == "__main__":
    main()
