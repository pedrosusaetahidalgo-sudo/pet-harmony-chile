"""
Outreach B2B pre-launch — envio personalizado via Gmail SMTP.

Modos:
    --dry-run                    imprime emails sin enviar (default)
    --send-test                  manda 1 email a SMTP_USER (a si mismo)
    --send-all                   manda a todos los prospectos reales (requiere confirmacion)
    --audience <kind>            filtra por audience (pharma, seguros, retail, gobierno, banca, edificios, longtail)
    --recipient <email>          override: manda solo a ese destinatario (debug)

Setup: igual que send_outreach_refugios.py — Gmail app password en .env.local.

Uso tipico:
    python scripts/send_outreach_b2b.py --audience pharma --dry-run
    python scripts/send_outreach_b2b.py --audience pharma --send-test
    python scripts/send_outreach_b2b.py --audience pharma --send-all

Log de envios: _pending/outreach_b2b_log.csv
"""

import argparse
import csv
import os
import re
import smtplib
import sys
import time
from datetime import datetime
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# Importar prospectos del módulo separado
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _prospectos_b2b import PROSPECTS  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

REPO_ROOT = Path(__file__).resolve().parent.parent
LOG_PATH = REPO_ROOT / "_pending" / "outreach_b2b_log.csv"
ENV_PATH = REPO_ROOT / ".env.local"
LOGO_PATH = REPO_ROOT / "public" / "paw-friend-assets-v2" / "logo" / "pwa_icon_192.png"


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

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.environ.get("GMAIL_USER", "pawfriendcl@gmail.com")
SMTP_PASS = (os.environ.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
FROM_NAME = os.environ.get("GMAIL_FROM_NAME", "Pedro Susaeta — Paw Friend")
WHATSAPP = "+56 9 8209 2588"
WEBSITE = "https://pawfriend.cl"

SECONDS_BETWEEN_SENDS = 30

# Dominios donde el MX lookup falló — emails probablemente bouncean.
# Generado por DNS check 2026-04-30. Pedro debe confirmar manualmente y
# actualizar estos antes de enviar (ej: googlear "contacto puppis.cl" para
# encontrar el email correcto, o usar un form de contacto en su web).
# El --send-all skipea estos automáticamente y los reporta.
BLOCKED_DOMAINS = {
    "aconcagua.cl", "adopta.cl", "animalcenter.cl", "animallibre.cl",
    "aquamarket.cl", "banchileseguros.cl", "bbva.cl", "bosqueanimal.cl",
    "catdogs.cl", "dechra.cl", "edyce.cl", "eecc.cl",
    "falabellaseguros.cl", "fundacioncarlosariztia.cl", "hsbc.cl",
    "huellasdeesperanza.cl", "inmobiliariaplaza.cl", "mascotasycia.cl",
    "masquemascotas.cl", "patitasconcausa.cl", "pentasecurity.cl",
    "petluxe.cl", "petraveler.cl", "petstar.cl", "promex.cl",
    "puppis.cl", "realeseguros.cl", "refugiodelalma.cl", "sinergia.cl",
    "sociedaddeadmin.cl", "sosanimal.cl", "tiendabichos.cl",
    "tiendanimal.cl", "unibe.cl", "vetnil.cl",
}




# ── Templates por audience ───────────────────────────────────────────────────
AUDIENCE_LABELS = {
    "pharma": "Outreach Pharma — Pre-launch",
    "seguros": "Outreach Aseguradoras — Pre-launch",
    "retail": "Outreach Retail — Pre-launch",
    "gobierno": "Outreach Gobierno — Pre-launch",
    "banca": "Outreach Banca — Pre-launch",
    "edificios": "Outreach Inmobiliarias — Pre-launch",
    "longtail": "Outreach Vertical — Pre-launch",
}

# CTAs por audience: form de aplicación + pitch deck dedicado.
CTA_FORM_URLS = {
    "pharma": "https://pawfriend.cl/aplicar?tipo=b2b_api",
    "seguros": "https://pawfriend.cl/aplicar?tipo=b2b_api",
    "retail": "https://pawfriend.cl/aplicar?tipo=b2b_api",
    "gobierno": "https://pawfriend.cl/aplicar?tipo=gobierno_municipio",
    "banca": "https://pawfriend.cl/aplicar?tipo=banca",
    "edificios": "https://pawfriend.cl/aplicar?tipo=edificios",
    "longtail": "https://pawfriend.cl/aplicar?tipo=longtail",
}

CTA_DECK_URLS = {
    "pharma": "https://pawfriend.cl/pitch/pharma.html",
    "seguros": "https://pawfriend.cl/pitch/aseguradoras.html",
    "retail": "https://pawfriend.cl/pitch/retail.html",
    "gobierno": "https://pawfriend.cl/pitch/gobierno.html",
    "banca": "https://pawfriend.cl/pitch/banca.html",
    "edificios": "https://pawfriend.cl/pitch/edificios.html",
    "longtail": "https://pawfriend.cl/pitch/longtail.html",
}

SUBJECTS = {
    "pharma": "Hola — soy Pedro de Paw Friend, busco partners pharma pre-launch",
    "seguros": "Hola — soy Pedro de Paw Friend, busco aseguradora partner pre-launch",
    "retail": "Hola — soy Pedro de Paw Friend, busco retailer partner pre-launch",
    "gobierno": "Hola — soy Pedro de Paw Friend, registro Ley 21.020 listo",
    "banca": "Hola — soy Pedro de Paw Friend, benefit pet para clientes premium",
    "edificios": "Hola — soy Pedro de Paw Friend, SaaS pet para sus comunidades",
    "longtail": "Hola — soy Pedro de Paw Friend, alianza vertical pet-adjacent",
}

INTROS = {
    "pharma": (
        "Soy Pedro Susaeta. Estoy próximo a lanzar Paw Friend (https://pawfriend.cl), "
        "una app gratis para dueños de mascotas en Chile. La app les arma la ficha "
        "cronológica médica de la vida del animal — vacunas, antiparasitarios, peso, "
        "condiciones, todo en un lugar.\n\n"
        "Cuando lancemos al público, los dueños van a registrar en la app qué marca "
        "de antiparasitario usan, cuándo toca la próxima dosis, qué vacuna le falta "
        "a la mascota. Es el momento exacto en que el animal necesita el producto. "
        "Hoy esa información se queda en cuadernos de veterinarias; en la app va a "
        "quedar registrada en algo que el dueño abre todas las semanas.\n\n"
        "Para ustedes eso puede abrir dos cosas:\n\n"
        "1. Visibilidad en el momento de la decisión — recordatorios sponsored o "
        "banner contextual cuando el dueño busca antiparasitario para perro mediano "
        "de 15 kg.\n\n"
        "2. Insights del mercado real — cuántos dueños cambian de marca, en qué "
        "comunas crece la categoría, qué razas consumen qué. Hoy nadie tiene esa "
        "data en Chile en tiempo real.\n\n"
        "Antes de lanzar al público busco 1-2 partners pharma para construir esto "
        "juntos. Founder Partner pre-launch significa exclusividad por categoría "
        "terapéutica + pricing preferente blindado + co-branding."
    ),
    "seguros": (
        "Soy Pedro Susaeta. Estoy próximo a lanzar Paw Friend (https://pawfriend.cl), "
        "una app gratis para dueños de mascotas en Chile. La app les arma la ficha "
        "cronológica médica de la vida del animal — vacunas, antiparasitarios, peso, "
        "condiciones, todo en un lugar.\n\n"
        "El segmento pet en Chile crece 12% YoY pero la penetración de seguro pet "
        "es <3% del parque de mascotas. El cuello de botella no es demanda — es "
        "distribución. Hoy se vende vía bancario tradicional o telemarketing frío.\n\n"
        "Cuando lancemos, dentro de la app el dueño va a poder ver cotización en "
        "tiempo real desde la ficha de su mascota — la cotización usa los datos "
        "reales del animal (raza, edad, peso, condiciones), no formularios "
        "autoreportados. Pide contacto y la aseguradora recibe el lead transaccional.\n\n"
        "Para ustedes eso puede abrir dos cosas:\n\n"
        "1. Distribución B2B2C en contexto — el dueño no llega frío, llega con la "
        "mascota cargada, peso/raza/condiciones reales y decisión activa.\n\n"
        "2. Risk score precomputado — recibís leads ya scoreados por raza/edad/"
        "comuna, no tenés que pre-filtrar manualmente.\n\n"
        "Antes de lanzar al público busco 1 aseguradora founder para construirlo "
        "juntos. Founder Partner pre-launch significa exclusividad en el cotizador "
        "durante 6 meses + revenue share preferente + co-branding."
    ),
    "retail": (
        "Soy Pedro Susaeta. Estoy próximo a lanzar Paw Friend (https://pawfriend.cl), "
        "una app gratis para dueños de mascotas en Chile. La app les arma la ficha "
        "cronológica médica de la vida del animal y ahí mismo conecta con productos "
        "y servicios que la mascota necesita.\n\n"
        "Cuando lancemos al público, los dueños van a tener dentro de la app a su "
        "perro o gato cargado con raza, peso, edad, condiciones. En ese contexto "
        "podemos mostrar productos relevantes — alimento por edad/raza/peso, "
        "antiparasitarios por categoría, accesorios por tamaño — con descuento "
        "exclusivo a dueños que tienen Paw Member ($3.990/mes).\n\n"
        "Para ustedes eso puede abrir dos cosas:\n\n"
        "1. Canal de adquisición contextual — leads atribuibles con tracking real "
        "(no Google Analytics), no ads genéricos en Meta.\n\n"
        "2. Recurrencia — el dueño que tiene a su mascota cargada vuelve a la app, "
        "ve descuentos tuyos cada mes. Es retención más que adquisición one-shot.\n\n"
        "Antes de lanzar busco 1-2 retailers founder para validar la mecánica. "
        "Founder Partner significa posición destacada 12 meses + setup gratis "
        "primer año + colección colaborativa con landing dedicada."
    ),
    "gobierno": (
        "Soy Pedro Susaeta, founder de Paw Friend (https://pawfriend.cl), SpA "
        "chilena. La Ley 21.020 (tenencia responsable) obliga a las municipalidades "
        "a llevar registro digital de mascotas con microchip, vacunas y tenedor "
        "responsable. Hoy ningún municipio chileno lo tiene digital y centralizado "
        "— se sigue llevando en Excel o cuadernos.\n\n"
        "Construí esa infraestructura en 2 meses, solo apalancado con IA. "
        "Está en producción end-to-end pre-launch (0 usuarios públicos hoy). Próximos a lanzar.\n\n"
        "Para tu municipio eso puede abrir dos cosas:\n\n"
        "1. Cumplimiento Ley 21.020 sin construir nada — los ciudadanos se "
        "inscriben gratis vía pawfriend.cl, registran su mascota, geolocalización "
        "automática por comuna. Tu equipo de salud animal tiene dashboard de "
        "cobertura por barrio (vacunas, esterilización, microchip) + reportes "
        "automáticos para SAG/Subdere.\n\n"
        "2. Caso de éxito ante Subdere y Contraloría — ser el primer municipio "
        "chileno con Ley 21.020 100% digital es un diferenciador real para tu "
        "alcaldía y para postular fondos posteriores.\n\n"
        "Antes de lanzar busco 1-2 municipios founder para validar la "
        "implementación. Implementación gratis durante el primer año + soporte "
        "directo del founder + tarifa preferente blindada."
    ),
    "banca": (
        "Soy Pedro Susaeta. Estoy próximo a lanzar Paw Friend (https://pawfriend.cl), "
        "una app gratis para dueños de mascotas en Chile que les arma la ficha "
        "cronológica médica de la vida del animal y conecta con servicios pet "
        "(vets, retail, seguros).\n\n"
        "El segmento premium chileno gasta USD 1.500/año en sus mascotas (referencia "
        "INE + comparables LatAm). La banca compite por ese segmento con benefits "
        "viajes, gastronomía, cine. Falta uno: la mascota.\n\n"
        "Para tu banco eso puede abrir dos cosas:\n\n"
        "1. Benefit emocional con LTV alto — el cliente premium recibe Paw Member "
        "gratis vía su tarjeta. Accede a la ficha completa de su mascota, "
        "descuentos retail, acceso prioritario a vets. Es engagement medible mes "
        "a mes, no banner estático.\n\n"
        "2. Diferenciación frente a la competencia — Santander Select, BCI Premier, "
        "Itaú Personal compiten por el mismo cliente. Ningún banco premium "
        "chileno tiene benefit pet white-label todavía. El primero gana.\n\n"
        "Antes de lanzar al público busco 1 banco founder para construirlo juntos. "
        "Founder Partner pre-launch significa exclusividad por segmento 12 meses + "
        "cuota por cliente activo blindada durante el lock de 12 meses + tarjeta co-branded."
    ),
    "edificios": (
        "Soy Pedro Susaeta. Estoy próximo a lanzar Paw Friend (https://pawfriend.cl), "
        "una app gratis para dueños de mascotas en Chile que les arma la ficha "
        "cronológica médica de la vida del animal.\n\n"
        "Hay 50.000+ unidades pet-friendly en Chile y crece 10% anual. El registro "
        "interno de mascotas en cada edificio se sigue llevando en Excel o "
        "WhatsApp — no hay nada dedicado. Eso genera conflictos vecinales por "
        "vacunas faltantes, esterilización, ruido.\n\n"
        "Para sus comunidades pet-friendly eso puede abrir dos cosas:\n\n"
        "1. Cobertura compliance — dashboard global por edificio de cobertura "
        "vacunas/esterilización/microchip. Reglamento pet digital con firma "
        "electrónica. Reduce conflictos vecinales con data, no con \"el perro "
        "que ladra\".\n\n"
        "2. Branding propio — cada edificio recibe código de invitación con "
        "logo y colores del proyecto. Vale como add-on de venta y postventa "
        "para nuevos proyectos pet-friendly.\n\n"
        "Antes de lanzar al público busco 1-2 administradoras o inmobiliarias "
        "founder. Founder Partner significa primeras 100 unidades gratis 12 "
        "meses + branding propio + revenue share sobre Paw Member en sus edificios."
    ),
    "longtail": (
        "Soy Pedro Susaeta. Estoy próximo a lanzar Paw Friend (https://pawfriend.cl), "
        "una app gratis para dueños de mascotas en Chile que les arma la ficha "
        "cronológica médica de la vida del animal.\n\n"
        "Hay un long-tail de empresas que tocan el ecosistema mascota sin ser "
        "pharma/seguros/retail tradicional: aerolíneas con cargo de mascotas, "
        "academia veterinaria, fundaciones grandes, ferias pet, hardware vet. "
        "Cada una resuelve un pedazo del ciclo de vida del animal.\n\n"
        "Para tu organización eso puede abrir dos cosas:\n\n"
        "1. Acceso directo a la audiencia pet chilena — co-marketing en feed/"
        "newsletter, métricas agregadas de tu vertical, integración técnica "
        "modular si tiene sentido.\n\n"
        "2. Alianza vertical sin compromiso largo — la mayoría de los acuerdos "
        "long-tail son trimestrales con opción a renovar. Probamos juntos, "
        "medimos, decidimos.\n\n"
        "Antes de lanzar al público busco alianzas tempranas. Founder Partner "
        "vertical significa primer y único acuerdo en tu nicho específico durante "
        "12 meses + setup gratis durante piloto + co-marketing en la app."
    ),
}

CIERRES = {
    "pharma": (
        "Si les hace sentido, podemos hablar 30 min por video llamada esta semana o "
        "la próxima, sin compromiso. Si no es prioridad ahora, también vale — "
        "gracias por la honestidad."
    ),
    "seguros": (
        "Si les hace sentido, podemos hablar 30 min por video llamada para que vean "
        "la mecánica end-to-end. Sin compromiso, sin firma, solo conversar."
    ),
    "retail": (
        "Si les hace sentido, podemos hablar 30 min por video llamada para mostrar "
        "el catálogo contextual y el tracking. Sin compromiso."
    ),
    "gobierno": (
        "Si les hace sentido, podemos hablar 30 min por video llamada para mostrar "
        "el dashboard municipal y la integración SAG. Sin compromiso."
    ),
    "banca": (
        "Si les hace sentido, podemos hablar 30 min por video llamada para revisar "
        "el modelo de cuota fija + co-branding. Sin compromiso."
    ),
    "edificios": (
        "Si les hace sentido, podemos hablar 30 min por video llamada para mostrar "
        "el dashboard administrativo y el branding por proyecto. Sin compromiso."
    ),
    "longtail": (
        "Si les hace sentido, podemos hablar 30 min por video llamada para explorar "
        "qué tipo de alianza tiene sentido. Sin compromiso, abierto a ideas."
    ),
}


def _highlight_html(text: str) -> str:
    """Aplica negritas sutiles a frases clave del intro (sin exagerar)."""
    # Frases comerciales clave que merecen <strong>
    bold_patterns = [
        r"(Founder Partner pre-launch[^.]*)",
        r"(exclusividad por categoría[^.]*)",
        r"(exclusividad por segmento[^.]*)",
        r"(visibilidad en el momento de la decisión)",
        r"(insights del mercado real)",
        r"(canal de adquisición contextual)",
        r"(distribución B2B2C en contexto)",
        r"(risk score precomputado)",
        r"(cumplimiento Ley 21\.020 sin construir nada)",
        r"(caso de éxito ante Subdere)",
        r"(benefit emocional con LTV alto)",
        r"(diferenciación frente a la competencia)",
        r"(cobertura compliance)",
        r"(branding propio)",
        r"(acceso directo a la audiencia)",
        r"(sin compromiso largo)",
        r"(cero fricción)",
    ]
    out = text
    for pat in bold_patterns:
        out = re.sub(pat, r"<strong>\1</strong>", out, flags=re.IGNORECASE)
    return out


def _format_intro_html(intro: str) -> str:
    """Convierte el intro plano en HTML con párrafos + bullets numerados con
    íconos sutiles donde corresponda."""
    parts = intro.split("\n\n")
    out_parts = []
    for p in parts:
        # Detectar bullets "1. ..." al inicio de párrafo
        m = re.match(r"^([1-9])\.\s+(.+)$", p, re.DOTALL)
        if m:
            num, rest = m.group(1), m.group(2)
            icon = {"1": "→", "2": "→", "3": "→", "4": "→"}.get(num, "→")
            out_parts.append(
                f'<div style="margin:10px 0;display:flex;align-items:flex-start">'
                f'<span style="display:inline-block;min-width:22px;color:#a855f7;font-weight:700">{icon}</span>'
                f'<span>{_highlight_html(rest)}</span>'
                f'</div>'
            )
        else:
            out_parts.append(f'<p style="margin:0 0 14px 0">{_highlight_html(p)}</p>')
    return "".join(out_parts)


def build_body(audience: str, saludo: str, personalizado: str) -> tuple[str, str]:
    """Devuelve (texto plano, html) para la audience indicada."""
    intro = INTROS[audience]
    cierre = CIERRES[audience]

    text = f"""Hola {saludo},

{intro}

{personalizado}

{cierre}

Saludos,

Pedro Susaeta
{WEBSITE}
WhatsApp: {WHATSAPP}
"""

    intro_html = _format_intro_html(intro)
    personalizado_html = _highlight_html(personalizado)

    audience_label = AUDIENCE_LABELS.get(audience, "")
    cta_form = CTA_FORM_URLS.get(audience, "https://pawfriend.cl")
    cta_deck = CTA_DECK_URLS.get(audience, "https://pawfriend.cl")

    html = f"""<html><body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f7f9;padding:32px 16px">
  <tr><td align="center">
    <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05)">

      <!-- Header con brand -->
      <tr>
        <td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:24px 32px;text-align:left">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle" style="padding-right:14px">
                <table border="0" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:6px">
                  <tr><td>
                    <img src="cid:pawfriend_logo" width="44" height="44" alt="Paw Friend" style="border:0;display:block;border-radius:8px">
                  </td></tr>
                </table>
              </td>
              <td valign="middle">
                <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.01em;line-height:1">Paw Friend</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.9);margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">{audience_label}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Cuerpo -->
      <tr>
        <td style="padding:32px;font-size:15px;line-height:1.6;color:#1a1a1a">
          <p style="margin:0 0 18px 0">Hola {saludo},</p>

          <div style="margin:0 0 18px 0">{intro_html}</div>

          <div style="border-left:3px solid #a855f7;padding:2px 0 2px 14px;margin:20px 0 22px 0;color:#3a3a3a;font-style:italic">
            {personalizado_html}
          </div>

          <p style="margin:0 0 20px 0">{cierre}</p>

          <!-- CTAs -->
          <table border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 28px 0">
            <tr>
              <td style="padding-right:10px">
                <a href="{cta_form}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.01em">📅 Agendar 30 min</a>
              </td>
              <td>
                <a href="{cta_deck}" style="display:inline-block;background:#fff;color:#7c3aed;padding:12px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:1.5px solid #7c3aed">📄 Ver el deck completo</a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 8px 0;color:#666;font-size:13px">O respondé este correo directamente — todo llega a mí.</p>

          <p style="margin:18px 0 8px 0;color:#666">Saludos,</p>

          <!-- Firma -->
          <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:14px;border-top:1px solid #ececec;padding-top:18px">
            <tr>
              <td valign="middle" style="padding-right:14px">
                <a href="{WEBSITE}" style="text-decoration:none">
                  <img src="cid:pawfriend_logo" width="56" height="56" alt="Paw Friend" style="border:0;display:block;border-radius:12px">
                </a>
              </td>
              <td valign="middle" style="font-size:14px;color:#1a1a1a;line-height:1.5">
                <strong>Pedro Susaeta</strong> &middot; <span style="color:#666">Founder</span><br>
                Paw Friend &mdash; <span style="color:#888">próximos a lanzar</span><br>
                <a href="{WEBSITE}" style="color:#7c3aed;text-decoration:none">pawfriend.cl</a> &middot;
                <a href="https://wa.me/56982092588" style="color:#7c3aed;text-decoration:none">WhatsApp {WHATSAPP}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#fafafa;padding:18px 32px;border-top:1px solid #ececec;font-size:11px;color:#888;line-height:1.5">
          <strong style="color:#666">SpA SUSAETA GARNHAM SOFTWARE ENGINEERING</strong> &middot; RUT 78.328.659-9 &middot; Santiago, Chile<br>
          Recibís este correo porque tu rol o empresa corresponde a una vertical donde Paw Friend está buscando partners pre-launch. Si preferís no recibir más correos, respondé con "remover".
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>"""

    return text, html


def send_email(to_email: str, subject: str, text_body: str, html_body: str) -> bool:
    if not SMTP_PASS:
        print("ERROR: GMAIL_APP_PASSWORD no esta seteado.")
        return False

    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_email
    msg["Reply-To"] = SMTP_USER

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(text_body, "plain", "utf-8"))
    alt.attach(MIMEText(html_body, "html", "utf-8"))
    msg.attach(alt)

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


def log_send(audience: str, empresa: str, email: str, status: str, error: str = ""):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    new_file = not LOG_PATH.exists()
    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if new_file:
            writer.writerow(["timestamp", "audience", "empresa", "email", "status", "error"])
        writer.writerow([datetime.utcnow().isoformat(), audience, empresa, email, status, error])


def get_recipients(
    audience_filter: str | None, include_blocked: bool = False
) -> tuple[list[tuple[str, dict]], list[tuple[str, dict]]]:
    """Devuelve (verified, blocked) — verified son prospectos con dominio MX válido.
    blocked son los que tienen dominio en BLOCKED_DOMAINS (skip por defecto)."""
    verified, blocked = [], []
    for audience, prospects in PROSPECTS.items():
        if audience_filter and audience != audience_filter:
            continue
        for p in prospects:
            domain = p["email"].split("@")[1].lower()
            if domain in BLOCKED_DOMAINS:
                blocked.append((audience, p))
            else:
                verified.append((audience, p))
    if include_blocked:
        return verified + blocked, []
    return verified, blocked


def mode_dry_run(audience_filter: str | None):
    recipients, blocked = get_recipients(audience_filter)
    print(f"\n{'='*70}")
    print(f"DRY-RUN B2B — {len(recipients)} emails verificados (NO se envia nada)")
    if blocked:
        print(f"  + {len(blocked)} con dominio sin MX (skipped)")
    if audience_filter:
        print(f"Filtro: audience={audience_filter}")
    print(f"{'='*70}\n")
    for i, (audience, r) in enumerate(recipients, 1):
        text, _ = build_body(audience, r["saludo"], r["personalizado"])
        print(f"\n--- [{i}/{len(recipients)}] [{audience}] {r['empresa']} ---")
        print(f"Para: {r['email']}")
        print(f"Asunto: {SUBJECTS[audience]}")
        print(f"Cuerpo:")
        print(text)
        print(f"--- fin email {i} ---\n")
    print(f"\n[OK] Dry-run. Si te gusta, corre:")
    print(f"  python scripts/send_outreach_b2b.py --send-test"
          + (f" --audience {audience_filter}" if audience_filter else ""))


def mode_send_test(audience_filter: str | None, override_to: str | None = None):
    if not SMTP_PASS:
        print("ERROR: falta GMAIL_APP_PASSWORD en .env.local")
        return
    recipients, _ = get_recipients(audience_filter)
    if not recipients:
        print(f"No hay prospectos para audience={audience_filter}")
        return
    sample_audience, sample = recipients[0]
    target = override_to or SMTP_USER
    print(f"\nEnviando preview a {target} (sample: [{sample_audience}] {sample['empresa']})...\n")
    text, html = build_body(sample_audience, sample["saludo"], sample["personalizado"])
    ok = send_email(target, SUBJECTS[sample_audience], text, html)
    if ok:
        print(f"[OK] Email enviado a {target}.")
        print(f"  Es el contenido exacto que recibiria {sample['empresa']}.")
        print(f"  Si llego bien, corre:")
        print(f"  python scripts/send_outreach_b2b.py --send-all"
              + (f" --audience {audience_filter}" if audience_filter else ""))
        log_send(sample_audience, "PREVIEW", target, "sent")
    else:
        print(f"[FAIL] Fallo el envio de prueba.")
        log_send(sample_audience, "PREVIEW", target, "failed")


def mode_send_all(audience_filter: str | None, skip_confirm: bool = False):
    if not SMTP_PASS:
        print("ERROR: falta GMAIL_APP_PASSWORD en .env.local")
        return
    recipients, blocked = get_recipients(audience_filter)
    if not recipients:
        print(f"No hay prospectos para audience={audience_filter}")
        return

    print(f"\n{'='*70}")
    print(f"ENVIO REAL B2B - {len(recipients)} prospectos verificados")
    if blocked:
        print(f"  + {len(blocked)} con dominio sin MX → SKIP (no envío)")
    if audience_filter:
        print(f"Filtro: audience={audience_filter}")
    print(f"{'='*70}")
    print(f"Rate limit: 1 cada {SECONDS_BETWEEN_SENDS}s")
    print(f"Total tiempo estimado: ~{len(recipients) * SECONDS_BETWEEN_SENDS // 60} min")
    print(f"\nDestinatarios:")
    for audience, r in recipients:
        print(f"  - [{audience}] {r['empresa']}: {r['email']}")

    if skip_confirm:
        print("\n[--yes] Skip confirmacion, arrancando...")
    else:
        confirm = input("\nConfirmas envio real? Tipa 'mandalo' para continuar: ").strip()
        if confirm != "mandalo":
            print("Cancelado.")
            return

    print(f"\nArrancando envios...\n")
    sent = 0
    for i, (audience, r) in enumerate(recipients, 1):
        text, html = build_body(audience, r["saludo"], r["personalizado"])
        print(f"[{i}/{len(recipients)}] [{audience}] {r['empresa']} -> {r['email']} ... ", end="", flush=True)
        ok = send_email(r["email"], SUBJECTS[audience], text, html)
        if ok:
            print("OK")
            log_send(audience, r["empresa"], r["email"], "sent")
            sent += 1
        else:
            print("FAIL")
            log_send(audience, r["empresa"], r["email"], "failed")
        if i < len(recipients):
            time.sleep(SECONDS_BETWEEN_SENDS)

    print(f"\n=== Resumen: {sent}/{len(recipients)} enviados ===")
    print(f"Log: {LOG_PATH}")


def mode_send_recipient(email: str):
    if not SMTP_PASS:
        print("ERROR: falta GMAIL_APP_PASSWORD en .env.local")
        return
    for audience, prospects in PROSPECTS.items():
        for p in prospects:
            if p["email"].lower() == email.lower():
                text, html = build_body(audience, p["saludo"], p["personalizado"])
                print(f"Enviando a [{audience}] {p['empresa']} ({p['email']})... ", end="", flush=True)
                ok = send_email(p["email"], SUBJECTS[audience], text, html)
                print("OK" if ok else "FAIL")
                log_send(audience, p["empresa"], p["email"], "sent" if ok else "failed")
                return
    print(f"ERROR: {email} no esta en la lista.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true", default=True, help="Imprime emails sin enviar (default)")
    group.add_argument("--send-test", action="store_true", help="Envia 1 email a SMTP_USER")
    group.add_argument("--send-all", action="store_true", help="Envia a todos los prospectos reales")
    group.add_argument("--recipient", type=str, help="Envia solo a ese destinatario")
    parser.add_argument("--audience", type=str, choices=list(PROSPECTS.keys()),
                        help="Filtra por audience (pharma/seguros/retail/gobierno/banca/edificios/longtail)")
    parser.add_argument("--to", type=str, help="Override destinatario en --send-test (ej: --to pedro.x@gmail.com)")
    parser.add_argument("--yes", action="store_true", help="Skip confirmacion (cron)")
    args = parser.parse_args()

    if args.send_test:
        mode_send_test(args.audience, override_to=args.to)
    elif args.send_all:
        mode_send_all(args.audience, skip_confirm=args.yes)
    elif args.recipient:
        mode_send_recipient(args.recipient)
    else:
        mode_dry_run(args.audience)


if __name__ == "__main__":
    main()
