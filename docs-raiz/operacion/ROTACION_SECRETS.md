# Rotación de secretos — Paw Friend

> **Épica A.6** (auditoría top-tier 2026-04-20). Plan operacional para
> rotar credenciales. Frecuencia base: anual + inmediato tras cualquier
> incidente (push accidental a git, ex-admin dado de baja, reporte de
> filtración).

## Inventario de secretos

| Secreto | Dónde vive | Alcance si se filtra | Rotación |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | **Crítico** — bypasea RLS, lee/escribe toda la DB | Anual + incidente |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | Público en bundle | Bajo — RLS lo restringe, pero rotar si hay abuso | Solo incidente |
| `FLOW_API_KEY` + `FLOW_SECRET_KEY` | Supabase Edge Fn secrets | **Crítico** — pagos B2C y B2B | Anual + incidente |
| `RESEND_API_KEY` | Supabase Edge Fn secrets | Medio — enviar email masivo en nombre del dominio | Anual |
| `OPENAI_API_KEY` | Supabase Edge Fn secrets | Medio — gasto económico + uso indebido | Anual + 2FA en cuenta OpenAI |
| `VITE_FIREBASE_*` | `.env` bundle | Bajo — config pública por diseño | Solo incidente |
| `VITE_POSTHOG_KEY` | `.env` bundle | Bajo — public write-only key | Solo incidente |
| `VITE_SENTRY_DSN` | `.env` bundle | Bajo — DSN público | Solo incidente |
| Google OAuth Client IDs | `capacitor.config.ts` + Supabase | Bajo (IDs) / Crítico (secrets backend) | Anual los backend |
| Apple Sign In keys (`.p8`) | `/ios/App/App/` | Crítico iOS | Anual + cuando rota Apple key |
| Meta App Secret (FB login) | Meta for Developers | Medio | Anual |
| Supabase JWT secret | Supabase Dashboard | **Crítico** — rotarlo invalida TODAS las sesiones | Solo incidente |

## Procedimiento estándar

### 1. Supabase Service Role Key

1. Dashboard → Settings → API → Roll service_role key.
2. Actualizar secretos en todas las edge fns que la usan:
   ```bash
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<nueva>"
   ```
3. Redeploy **todas** las edge fns (ya leen el secret en runtime, pero
   un cold start estará cacheando el viejo):
   ```bash
   npx supabase functions deploy --all
   ```
4. Verificar `flow-webhook`, `log-error`, `generate-medical-summary` con
   un hit real. El widget `PaymentEventsFailedWidget` (Admin > Finanzas)
   debería seguir cargando sin error `No pude leer payment_events`.

### 2. Flow (`FLOW_API_KEY` + `FLOW_SECRET_KEY`)

1. Flow Dashboard → Integración → Generar nuevas credenciales (marca las
   viejas como inactivas si hay UI para eso).
2. Actualizar secretos:
   ```bash
   npx supabase secrets set FLOW_API_KEY="<nueva>"
   npx supabase secrets set FLOW_SECRET_KEY="<nueva>"
   ```
3. Redeploy las 3 edge fns que las usan:
   ```bash
   npx supabase functions deploy flow-create-subscription
   npx supabase functions deploy flow-create-donation
   npx supabase functions deploy flow-webhook
   ```
4. **Smoke test**: hacer una donación real de CLP 100 y confirmar que
   llega a `payment_events.outcome='ok'`. Refund luego.

### 3. Resend

1. Resend Dashboard → API Keys → revoke old, create new.
2. `npx supabase secrets set RESEND_API_KEY="<nueva>"`.
3. Redeploy edge fns que envían email:
   ```bash
   npx supabase functions deploy send-donation-thanks
   npx supabase functions deploy send-pet-invitation
   npx supabase functions deploy notify-pitch-application
   npx supabase functions deploy send-lead-outreach
   npx supabase functions deploy generate-weekly-owner-reports
   npx supabase functions deploy generate-weekly-vet-reports
   npx supabase functions deploy send-shelter-welcome
   npx supabase functions deploy send-monthly-vet-stats
   npx supabase functions deploy send-new-pet-drip
   npx supabase functions deploy send-inactive-user-reminder
   npx supabase functions deploy send-pet-birthday-greeting
   ```
4. Smoke test: aplicar a `/aplicar?tipo=otro` con tu email; debe llegar
   el email de notify-pitch-application.

### 4. OpenAI

1. OpenAI Dashboard → API Keys → revoke + create.
2. `npx supabase secrets set OPENAI_API_KEY="<nueva>"`.
3. Redeploy todas las fns IA (usan `_shared/ai-base.ts`):
   ```bash
   npx supabase functions deploy pet-assistant breed-tips medical-suggestions \
     bereavement-assistant symptom-triage nutrition-coach wound-vision \
     consultation-prep ocr-vaccination-card verify-vet-document \
     verify-service-provider moderate-service-promotion \
     process-consultation-transcript generate-medical-summary \
     generate-vet-patient-summary
   ```
4. Smoke test: `/ficha/:petId` → abrir asistente IA, preguntar algo.

### 5. Supabase JWT secret — ⚠️ solo incidente

Rotar el JWT secret **invalida todas las sesiones activas**. Todos los
users van a tener que volver a loguearse. Solo hacer esto si hay
compromiso confirmado (ver precedente 2026-04-11).

1. Dashboard → Settings → API → Regenerar JWT Secret.
2. Refrescar `SUPABASE_SERVICE_ROLE_KEY` (también se regenera).
3. Comunicar proactivamente: "Hubo mantenimiento de seguridad. Tenés
   que volver a iniciar sesión".

### 6. Apple Sign In (`.p8`)

1. Apple Developer → Keys → Generar nuevo key con Sign In with Apple.
2. Descargar `.p8`, reemplazar en `/ios/App/App/AuthKey_XXXXX.p8`.
3. Actualizar Info.plist si cambia el Key ID.
4. Supabase Dashboard → Auth > Providers > Apple → actualizar Key ID +
   Team ID + contenido `.p8`.
5. `npx cap sync ios` + submit nuevo build.

## Detección automática

- **GitHub Push Protection**: ya activo. Bloqueó un push real 2026-04-11.
- **Gitleaks / trufflehog** en CI (pendiente, ver `INIT-XX` backlog).
- Revisar `git log -p | grep -iE 'sk_|api_key|secret'` antes de publicar
  branches viejas.

## Qué hacer si un secreto se filtra

1. **No borrar el commit** — git history keeps it.
2. Rotar el secreto ya mismo (procedimiento de arriba).
3. Revocar tokens derivados si aplica (Flow session tokens activos,
   OpenAI API usage últimas 24h).
4. Auditar logs: buscar uso del secreto filtrado entre commit y rotación.
5. Documentar en `docs-raiz/operacion/POSTMORTEMS/` con fecha.

## Calendario recomendado

| Trimestre | Secretos a rotar |
|---|---|
| Q1 | Flow + Resend |
| Q2 | Supabase Service Role |
| Q3 | OpenAI + Apple key |
| Q4 | Revisión completa + actualizar este doc |

Anotar fechas en `BITACORA_RITUAL.md` al completar.
