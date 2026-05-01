# Runbook Outreach B2B Pre-launch

**Para mañana AM** — script Python listo para enviar 105 emails B2B
verificados (35 más con dominio sin MX skipeados automáticamente).

## Estado actual

| Audience | Verificados | Skipped (sin MX) |
|---|---|---|
| pharma | 18 | 2 |
| seguros | 16 | 4 |
| retail | 11 | 9 |
| gobierno | 18 | 2 |
| banca | 18 | 2 |
| edificios | 14 | 6 |
| longtail | 10 | 10 |
| **Total** | **105** | **35** |

Los 35 con dominio sin MX (en `BLOCKED_DOMAINS` del script) NO se envían
— evita bounces que dañan reputación de envío.

## Comando recomendado mañana

```bash
# 1. Dry-run de todo para revisar copy final
python scripts/send_outreach_b2b.py --dry-run

# 2. Test de 1 audience (manda a tu correo personal)
python scripts/send_outreach_b2b.py --send-test --audience pharma --to pedro.susaeta.hidalgo@gmail.com

# 3. Si te gusta, send-all por audience (1 cada 30s, ~9 min por batch)
python scripts/send_outreach_b2b.py --send-all --audience pharma
python scripts/send_outreach_b2b.py --send-all --audience seguros
python scripts/send_outreach_b2b.py --send-all --audience retail
python scripts/send_outreach_b2b.py --send-all --audience gobierno
python scripts/send_outreach_b2b.py --send-all --audience banca
python scripts/send_outreach_b2b.py --send-all --audience edificios
python scripts/send_outreach_b2b.py --send-all --audience longtail
```

Cada `--send-all` te pregunta `Confirmas envio real? Tipa 'mandalo' para continuar:`.
Tipear `mandalo` y enter. Si tipeás cualquier otra cosa, cancela.

**Total tiempo de envío real:** ~52 min para los 7 audiences (105 emails × 30s c/u).

## Qué incluye cada email

- **Header morado** con logo Paw Friend en caja blanca (visible) + label "Outreach Pharma — Pre-launch"
- **Saludo personalizado**: "Hola equipo de Zoetis Chile,"
- **Intro del audience** (qué es Paw Friend + 2 puntos de valor)
  - Negritas automáticas en frases comerciales clave
  - Bullets con flecha morada (→)
- **Personalizado por empresa** (resaltado en cita lateral morada)
- **2 botones CTA**:
  - 📅 Agendar 30 min → `pawfriend.cl/aplicar?tipo=...`
  - 📄 Ver el deck completo → `pawfriend.cl/pitch/<audience>.html`
- **Cierre soft** + reply-to directo
- **Firma** con foto + título "Founder" + WhatsApp clickeable
- **Footer**: SpA + RUT + opt-out

## Validación pre-envío (ya ejecutada 2026-04-30)

- ✅ 140 prospectos cargados (20 por audience)
- ✅ 0 emails duplicados
- ✅ 0 dominios duplicados entre audiences
- ✅ 0 empresas duplicadas
- ✅ 35 dominios sin MX detectados → BLOCKED_DOMAINS (skip auto)
- ✅ 105 dominios con MX confirmado vía `nslookup -type=MX`

## Si algo sale mal

- **Email no llega**: verificar `.env.local` tiene `GMAIL_APP_PASSWORD` válido.
- **SMTP error 535**: app password vencido, regenerar en https://myaccount.google.com/apppasswords
- **Rate limit Gmail**: el script ya tiene `SECONDS_BETWEEN_SENDS=30`. No bajar.
- **Quiero parar a media batch**: `Ctrl+C`. Los enviados quedan en log.

## Log de envíos

Cada send se loguea en `_pending/outreach_b2b_log.csv`:

```
timestamp, audience, empresa, email, status, error
```

## Estructura del código

- `scripts/send_outreach_b2b.py` — script principal (templates + envío)
- `scripts/_prospectos_b2b.py` — los 140 prospectos (separado para legibilidad)

## Editar prospectos / templates

- **Cambiar copy del intro de un audience**: editar `INTROS["audience"]` en `send_outreach_b2b.py`
- **Cambiar/agregar prospectos**: editar `PROSPECTS["audience"]` en `_prospectos_b2b.py`
- **Si encontrás email correcto para alguno blocked**: quitar el dominio de `BLOCKED_DOMAINS` y actualizar el email en `_prospectos_b2b.py`
