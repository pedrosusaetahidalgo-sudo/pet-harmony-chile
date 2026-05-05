# Security Audit — Lanzamiento Beta 2026-05-05

> Audit ligero post-lanzamiento beta el 2026-05-05.
> Objetivo: mientras llegan los primeros usuarios reales, asegurar que no hay
> exfiltracion ni privilege escalation accionable.
>
> Complementa (no reemplaza) [AUDITORIA_RLS_2026_04_30.md](AUDITORIA_RLS_2026_04_30.md)
> y [AUDIT_INTEGRAL_PRE_LAUNCH_2026_04_30.md](AUDIT_INTEGRAL_PRE_LAUNCH_2026_04_30.md).

---

## TL;DR

- **Bloqueantes encontrados y fixeados en esta sesion**: 2.
- **Items para revisar manana cuando rotes claves**: 4 (low/medium severity).
- **Secrets en working tree o docs/**: 0 (anon JWT visible es by-design publishable).
- **Tablas nuevas con RLS**: cubiertas por mig 20260918 (audit anterior).
- **Plan recomendado para manana**: aplicar las 2 migs nuevas + redeploy 2 edge fns + correr el SQL de inspeccion abajo.

---

## ✅ Fixeado en esta sesion

### A. `send-push-notification` — invocable sin auth (HIGH)

**Hallazgo**: la edge fn aceptaba POST publico y mandaba push a cualquier
`user_ids` sin validar caller. Vector real:

- Atacante hace POST con `user_ids` adivinados, `title="Tu mascota esta perdida"`, `data.route="https://phishing.example/login"`
- Push llega a usuarios reales que tienen device_tokens registrados
- Phishing trivial via deep-link arbitrario

CORS estaba abierto a `*`. El comentario decia "service_role only" pero el codigo no lo verificaba.

**Fix**: agregamos `requireCronAuth(req)` al inicio del handler. Acepta:
- `X-Cron-Secret: <PAWFRIEND_CRON_SECRET>`
- `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

Los callers internos (SQL fn `send_reminder_pushes()`, otras edge fns) ya envian el Bearer service_role, asi que no rompe nada. El frontend NO llama esta fn.

**Pendiente Pedro**: redeploy `send-push-notification` con `npx supabase functions deploy send-push-notification`.

### B. `notify-vet-share` — invocable sin auth (MEDIUM)

**Hallazgo**: la fn declaraba "Auth: usuario autenticado" pero el codigo no validaba ningun header. Cualquiera con un `share_token_id` (UUID adivinable o leakeado) podia triggear emails repetidos al vet → spam de Resend + reputacion danada del dominio.

**Fix**: agregamos `auth.getUser(token)` con el JWT del Authorization header. El frontend ya envia el JWT del dueno (es quien comparte la ficha).

**Pendiente Pedro**: redeploy `notify-vet-share`.

### C. Booking trigger V1/V2 — bug latente (no es security pero blocking)

Splitea `create_booking_reminder()` para que el flow legacy de
walkers/sitters/trainers/grooming via `EnhancedBookingDialog` no explote.
Detalle en mig [20261005000002](../supabase/migrations/20261005000002_split_booking_reminder_v1_v2.sql).

---

## 🟡 Para revisar manana (low/medium severity, no bloquean beta)

### 1. CORS hardcoded en 17 edge fns
`_shared/cors.ts` ya tiene el helper correcto (acepta pawfriend.cl + localhost),
pero 17 fns hardcodean `'Access-Control-Allow-Origin': 'https://pawfriend.cl'`:

flow-create-subscription, flow-create-donation, generate-sitemap,
process-consultation-transcript, send-whatsapp-reminder, generate-daily-digest,
send-co-owner-invitation, bulk-import-pets, send-pet-invitation,
generate-vet-patient-summary, ocr-vaccination-card, verify-vet-document,
moderate-service-promotion, google-calendar-oauth-init,
google-calendar-disconnect, generate-weekly-vet-reports,
generate-weekly-owner-reports.

**Impact**: bloquea local dev (localhost:8080) + Capacitor webview iOS/Android (`capacitor://localhost`) + Lovable preview. Funcionan en pawfriend.cl.

**Fix recomendado**: pase masivo `import { getCorsHeaders } from '../_shared/cors.ts'` y reemplazar el const literal. Cambio mecanico de 17 archivos. ~30 min.

### 2. `geocode-address` sin auth (LOW)
Nominatim es gratis pero limitado por OSM (1 req/s). Atacante puede hammear
nuestra IP → ban temporal. Tambien free geocoding indirecto a competidores.

**Fix recomendado**: agregar `requireAuth` (user JWT) o rate limit por IP via
RPC `check_and_increment_ip_quota` (mismo patron que `log-error`).

### 3. `notify-pitch-application` — knowledge-factor auth (ACEPTABLE)
La fn requiere `application_id` + `confirmation_email` matching + recency
window. No es ideal pero el atacante necesitaria un email valido + ID que ya
postulo. Severidad baja.

### 4. CSP / Helmet headers en GitHub Pages (no aplica)
Pages no soporta headers custom. Si en el futuro migramos a Cloudflare Pages
o Vercel, considerar Content-Security-Policy + X-Frame-Options.

---

## 🟢 OK (verificado en esta sesion)

- `.gitignore` cubre `.env`, `.env.local`, `.env.production`, `MIS_API_KEYS.md`. Confirmado con `git check-ignore`.
- No hay JWT service_role ni secret de Anthropic/Resend/ElevenLabs en working tree, src/, supabase/, docs/, scripts/, content-studio/.
- El JWT visible en `docs/assets/AdminSystemHealth-*.js` es el anon key (`role: anon`), publishable by design.
- `android/app/google-services.json` contiene Firebase API key publishable + restringida por package_name `cl.pawfriend.app` y SHA-1 fingerprint en Firebase Console.
- Las 9 tablas de revenue motors tienen RLS auditado en mig 20260918 (ver [AUDITORIA_RLS_2026_04_30.md](AUDITORIA_RLS_2026_04_30.md)).
- 37 edge fns validan caller con `auth.getUser(token)`. Los crons usan `requireCronAuth`.

---

## 🔍 SQL de inspeccion para correr en Supabase Dashboard > SQL Editor

Pedro: copia/pega cada bloque. Solo lecturas, no modifica nada.

### Q1. Tablas sin RLS habilitado (deberian ser 0 fuera de seed temporales)

```sql
SELECT
  schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
```

### Q2. Policies con `USING (true)` o `WITH CHECK (true)` (peligrosas)

```sql
SELECT
  schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, policyname;
```

### Q3. RPCs SECURITY DEFINER expuestas a `authenticated` o `anon`

```sql
SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS args,
  p.prosecdef AS security_definer,
  array_agg(a.rolname) AS granted_to
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN aclexplode(p.proacl) ax ON true
LEFT JOIN pg_authid a ON a.oid = ax.grantee
WHERE n.nspname = 'public'
  AND p.prosecdef = true
GROUP BY p.proname, p.oid, p.prosecdef
ORDER BY p.proname;
```

### Q4. Triggers que llamen a funciones plpgsql con refs lazy (audit clinico)

```sql
-- Detecta funciones plpgsql que insertan en pet_reminders (validar que
-- el `type` que emiten esta en el CHECK canonico post-mig 20261005000001).
SELECT
  p.proname,
  obj_description(p.oid) AS comment
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
  AND pg_get_functiondef(p.oid) ILIKE '%pet_reminders%INSERT%'
ORDER BY p.proname;
```

### Q5. Cuantos usuarios beta hay y cuantos pets crearon

```sql
SELECT
  COUNT(DISTINCT u.id) AS users_total,
  COUNT(DISTINCT p.owner_id) AS users_with_pets,
  COUNT(DISTINCT p.id) AS pets_total
FROM auth.users u
LEFT JOIN public.pets p ON p.owner_id = u.id
WHERE u.created_at >= '2026-05-05'::date;
```

### Q6. Audit log de errores hoy (deberia ser bajo)

```sql
SELECT
  source, level, COUNT(*) AS n,
  MAX(created_at) AS last_seen,
  MIN(LEFT(message, 80)) AS sample_message
FROM public.error_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY source, level
ORDER BY n DESC
LIMIT 20;
```

---

## 🔐 Plan de rotacion de claves manana

Pedro mencionó "lo rotaremos mañana". Recomendacion:

1. **Anon key Supabase**: NO rotar. Es publishable, debe estar en bundle frontend.
2. **Service_role key Supabase**: rotar SI Y SOLO SI sospechas que se filtro. Buscar en historial chat de Pedro+IAs cualquier sesion donde se haya pegado completa. Memoria `feedback_secrets_in_chat.md` y `project_session_2026_04_25_fase_1_cierre.md` indican que en abril hubo un incidente — verificar si se rotó completamente.
3. **PAWFRIEND_CRON_SECRET**: si existia desde antes, regenerar con `openssl rand -base64 48` y actualizar en Supabase Vault.
4. **ANTHROPIC_API_KEY, RESEND_API_KEY, FCM_SERVER_KEY, ELEVENLABS_KEY, MIDJOURNEY_KEY**: rotar SOLO si hay evidencia de leak. Buscar con grep en commits recientes.
5. **Petify API_KEY (TEST)**: si reemplazas por PROD manana, dejar TEST dormida.

Comando rapido para verificar que nada raro entro al repo en los ultimos 30 dias:

```bash
git log --since="30 days ago" --pretty=format:"%H %s" -p \
  | grep -E "(eyJ[A-Za-z0-9_-]{50,}|sk-ant-[A-Za-z0-9]|sk_live_|whsec_|RESEND_)" \
  | head -20
```

---

## Checklist de manana (orden sugerido)

1. ☐ Aplicar mig `20261005000001_recanonize_reminder_types.sql` (Supabase Dashboard > SQL Editor)
2. ☐ Aplicar mig `20261005000002_split_booking_reminder_v1_v2.sql`
3. ☐ Redeploy `send-push-notification` (`npx supabase functions deploy send-push-notification`)
4. ☐ Redeploy `notify-vet-share` (`npx supabase functions deploy notify-vet-share`)
5. ☐ Correr Q1-Q6 de arriba en SQL Editor, capturar output
6. ☐ Verificar que `PAWFRIEND_CRON_SECRET` existe en Supabase Vault (si no, generar)
7. ☐ Si hay tabla en Q1 sin RLS o policy en Q2 con `qual=true`: priorizar fix
8. ☐ (Opcional) Migrar las 17 edge fns CORS al `_shared/cors.ts` — bloquea local dev
