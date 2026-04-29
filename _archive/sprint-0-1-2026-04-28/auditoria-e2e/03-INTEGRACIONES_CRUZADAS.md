# Mapa de integraciones cruzadas

**Fase 3 del prompt** — matriz integración × onboarding + top 10 riesgos.

## Matriz integración × ONBD

### Integraciones que aplican a múltiples flujos

| Integración | ONBDs que la usan | Estado |
|---|---|---|
| **Supabase Auth** | 01, 02, 03, 05, 06, 07, 08, 09, 10, 22, 23, 25, 26, 27, 28 | ✅ |
| **Email (Resend)** | 01 (D0 drip), 02 (invite vet), 03 (invite shelter), 05 (welcome vet), 10 (welcome shelter), 13, 14, 15, 16, 17, 18, 19, 20, 21 (notify admin) | 🟡 Falta verificar deliverability |
| **WhatsApp (wa.me)** | 03 (invite adoptante), 12 (transfer mascota), viral loop InviteVetDialog | ✅ URLs únicamente — bajo riesgo |
| **WhatsApp (Evolution API / Meta Cloud)** | Ninguno activo — Meta Business aceptada 2026-04-20, código listo sin deploy | 🚧 Pendiente activación post-launch |
| **Flow.cl** | 27 (Paw Member B2C), 29 (donación), 28 (**NO EXISTE**) | 🟡 B2B bloqueado |
| **Google Calendar OAuth** | Vet dashboard (no es onboarding directo, pero afecta ONBD-05/06/07/08) | ✅ Edge fns deployed |
| **Supabase Storage** | 01 (pet photo), 10 (shelter logo/banner), 11 (opcional bulk), 02/03 (invite photos en email template) | ✅ |
| **RLS policies críticas** | Todos | ✅ salvo ONBD-28 que no tiene código |
| **Pet invitation tokens** | 02, 03, 04, 12, 25, 26 | ✅ |
| **Paw Card generation** | 01 (al agregar pet) | ✅ Automático |
| **OCR vaccination** | 01 (opcional en onboarding pet) | ✅ Edge fn `ocr-vaccination-card` |
| **QR codes** | `/qr/:token` — adyacente a claim flows | ✅ |
| **Sentry logging** | Transversal (all flows) | ✅ |
| **Sitemap SEO** | 18, 19, 20, 21 (tipos /aplicar indexables opt) | 🟡 Verificar exclusión de CORFO/angels |
| **Rate limiters** | 13-21 (pitch_applications, 3/24h), 27 (payment 10/h) | ✅ |
| **Nominatim geocoding** | 10 (shelter address) | ✅ |
| **PostHog analytics** | Transversal | 🟡 scrub tokens (hecho) |
| **pg_cron / pg_net** | 01 (drip D0/D3/D7), 27 (reconcile payments futuro), vet reports, birthday | ✅ |

---

## Top 10 riesgos de integración

### 🔴 1. Flow.cl a cuenta personal (riesgo fiscal)

**Afecta**: ONBD-27, ONBD-29 (cuando active).
**Impacto si cae**: tributariamente Pedro es contribuyente único. Si a Paw Friend le pasan fondos a nombre de la SpA SGSE en camino, habría doble contabilidad. Riesgo SII a mediano plazo.
**Plan contingencia**: migración a cta SpA (Mach SpA en tramitación — memoria `project_session_2026_04_19_pivot_monetizacion`). **Feature flag `SHELTER_DONATIONS=false` hasta migrar**.

### 🔴 2. Vet upgrade B2B (ONBD-28) no existe

**Afecta**: monetización B2B completa.
**Impacto**: ingreso = 0 por vets. Única monetización activa = donaciones voluntarias B2C.
**Plan contingencia**: **debe construirse antes del lanzamiento**. Ver P0 en catálogo.

### 🔴 3. Evolution API para WhatsApp

**Afecta**: potencial flujo de reminders vía WA (actualmente usamos wa.me URL fallback).
**Impacto**: si intentáramos switchear a API no-oficial, Meta puede banear número — pérdida de canal.
**Plan contingencia**: Meta Cloud API activada (verificación aprobada 2026-04-20). Migración post-lanzamiento sin urgencia — wa.me URLs cubren 100% de los flujos actuales.

### 🟡 4. Resend deliverability / SPF-DKIM

**Afecta**: ONBD-01 (drip), 02, 03, 05, 10 y todos los 13-21 notify admin.
**Impacto**: emails caen en spam → usuarios no activan → funnel roto.
**Plan contingencia**:
- Verificar SPF/DKIM/DMARC para `pawfriend.cl` en DNS.
- Remitente `no-reply@pawfriend.cl` correcto.
- Usar subdomain dedicado (`mail.pawfriend.cl`) si warmup es lento.
- Monitorear Resend dashboard (bounces, spam reports).

### 🟡 5. Tokens de invitación que expiran

**Afecta**: ONBD-02, ONBD-03, ONBD-12.
**Impacto**: dueño abre link después de 30 días → expired → bad UX ("cómo obtengo otro?").
**Plan contingencia**:
- Hoy: 30 días. Adecuado para mayoría.
- Mensaje de error claro: "Link caducado — pide a tu vet/refugio que te envíe uno nuevo".
- UI manual de re-claim por email (`ClaimPetDialog`) como fallback.

### 🟡 6. Google Calendar OAuth disconnect bug

**Afecta**: Vets con calendar sincronizado.
**Impacto**: si OAuth se resetea y usuario no sabe, citas dejan de sincronizarse.
**Plan contingencia**:
- Edge fn `google-calendar-disconnect` explícita (existe).
- Monitor periódico que valida token y alerta al vet si expiró.
- Botón "Reconectar Google" en settings (ya existe).

### 🟡 7. RLS regression al introducir shelter

**Afecta**: ONBD-10, 11, 12 y cruce con ONBD-01/02/03.
**Impacto**: si una policy nueva se superpone mal con una existente, dueños podrían ver pets de otros o shelters pisar data.
**Plan contingencia**:
- Script `scripts/rls-audit.mjs` (creado en tanda previa) — correr semanalmente.
- Queries forzadas en tests E2E (`e2e/rls.spec.ts`).
- Revisar manualmente mig `20260620000000_adoption_centers.sql` policies.

### 🟡 8. Rate limit pitch_applications

**Afecta**: ONBD-13 a 21.
**Impacto**: bot ataca con 1000 applications → llena DB. Hoy: trigger BEFORE INSERT limita 3/24h por email + dedup kind+email.
**Plan contingencia**: ya robusto. Adicionar reCAPTCHA o hCaptcha si se ve abuso real post-launch.

### 🟡 9. Pago Flow reconciliación

**Afecta**: ONBD-27 (y futuro ONBD-28).
**Impacto**: webhook Flow no llega (red inestable) → `donations.status='pending'` eterno → user pagó pero badge no activa.
**Plan contingencia**:
- Cron de reconciliación `reconcile-flow-pending` (**no existe hoy** — recomendable P2).
- Endpoint manual de admin para forzar status.
- `/payment-result` con RPC `verify_flow_payment_status(token)` — ya existe.

### 🟡 10. Trigger `handle_new_user` sincronía

**Afecta**: ONBD-01, 05, 10 y cualquier signup.
**Impacto**: si el trigger falla, el user queda en `auth.users` pero sin row en `profiles`. Frontend ve error de permisos.
**Plan contingencia**:
- Trigger debe ser IDEMPOTENT y tolerante.
- Upsert en vez de insert strict.
- Fallback: `useAuth` detecta falta de profile y re-intenta.

---

## Integraciones por ONBD (detalle compacto)

Solo los ONBD con ≥2 integraciones no triviales:

| ONBD | Auth | Resend | WA | Flow | GCal | Storage | Pet token | Notas |
|---|---|---|---|---|---|---|---|---|
| 01 | ✅ | ✅ drip | — | — | — | ✅ foto | — | OAuth + welcome |
| 02 | ✅ | ✅ invite | — | — | — | — | ✅ | RPC atómico |
| 03 | ✅ | ✅ invite shelter | ✅ wa.me | — | — | — | ✅ | Token + link |
| 05 | ✅ | 🟡 falta welcome específico | — | — | ✅ opt | ✅ avatar | — | |
| 10 | ✅ | ✅ welcome shelter | — | — | — | ✅ logo/banner | — | Nominatim geocode |
| 11 | ✅ | — | — | — | — | — | — | CSV/XLSX parse server |
| 13-21 | ✅ opcional | ✅ notify admin | — | — | — | — | — | pitch_applications |
| 27 | ✅ | — | — | ✅ B2C | — | — | — | webhook |
| 28 | ✅ | — | — | ❌ **FALTA** | — | — | — | **P0** |

---

## Resumen Fase 3

- **Riesgos críticos (🔴)**: 2 (Flow cta personal, ONBD-28).
- **Riesgos medios (🟡)**: 8 (deliverability, tokens, OAuth, RLS, rate limit, reconcile, trigger).
- **Bloqueador único de lanzamiento**: ONBD-28 (Flow B2B).
- **Debt pre-existente conocido**: migración Flow a SpA (Pedro en trámite).
- **No bloqueantes para 1 jun**: Evolution API (Meta Cloud ya aprobada), reconciliación Flow (raro, manual hace patch).

Próximo: Fase 4 catálogo priorizado para decidir qué se ejecuta pre-launch.
