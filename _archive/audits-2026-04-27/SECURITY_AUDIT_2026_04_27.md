# SECURITY AUDIT 2026-04-27 — Paw Friend (Domains 4, 5, 12)

> Auditoria exhaustiva: Supabase schema/RLS/funcs + Auth & Seguridad + DevOps/Observabilidad.
> Severidad: P0 (vulnerabilidad activa, fix HOY) > P1 (privacidad/compliance, fix < 7d) > P2 (hardening, fix < 30d) > P3 (nice-to-have).

---

## Resumen ejecutivo

- 313 migraciones SQL (CLAUDE.md decia 184+, conteo real desactualizado)
- 64 edge functions Deno (CLAUDE.md decia 35+ — desactualizado)
- 55 fns en `config.toml` con `verify_jwt=false`, 3 con `true` (rollback 2026-04-20 documentado)
- 33 de 64 fns validan auth manual con `auth.getUser(token)`. Las restantes son crons o reciben service_role.
- 9 pares de timestamps de migracion duplicados (CLAUDE.md menciona 3 — desactualizado)
- 1 P0 critica de privacidad (pets `is_public DEFAULT true`)
- 4 P1 (Sentry sin scrub PII, PostHog identifica con email raw, notify-pitch-application sin auth, booking_events leaks cross-tenant)
- 6 P2 (`USING (true)` en tablas no triviales, CORS abierto, rate limit ausente en algunas fns sensibles)

---

## SECCION A — Schema & migraciones

### A.1 — Ultimas 20 migraciones (cronologico)

`supabase/migrations/`:

1. 20260903700000_partner_integrations.sql
2. 20260903800000_timeline_auto_sync_triggers.sql
3. 20260903900000_rename_orphan_tables.sql
4. 20260904000000_table_audit_rpc.sql
5. 20260905000000_cleanup_features_muertas.sql
6. 99999999000000_demo_seed_flag.sql (flag, no real)

(15 anteriores en bloque Fase 2/3 §7.x §2.x §13: research_consent → memorial_anniversary → ficha_complete_milestone)

**Conteo real**: `313` archivos `.sql` (CLAUDE.md tabla §12 dice "184+" — actualizar).

### A.2 — Timestamps duplicados (P3 — operativo)

CLAUDE.md menciona 3 pares. Conteo real: **9 pares**:

| Timestamp | Archivos |
|---|---|
| 20260412200000 | add_sidebar_tutorial_progress.sql, paw_card_collections_public_view.sql |
| 20260413000000 | ai_cache.sql, premium_b2c_flow.sql |
| 20260413200000 | fix_vet_pet_creation.sql, vet_opening_hours.sql |
| 20260515100000 | default_display_name_generator.sql, fix_seed_quality_missions.sql |
| 20260517100000 | get_user_id_by_email.sql, sync_pet_name_reminders.sql |
| 20260521000000 | unify_provider_service_type.sql, vet_orphan_pet_access.sql |
| 20260525000000 | fix_export_jobs_rls.sql, pet_timeline_events.sql |
| 20260530000000 | deprecate_benign_errors_autofixer.sql, fix_pet_co_owners_rls_recursion.sql, **pet_id_cards.sql** (TRIPLE) |
| 20260601000000 | google_calendar_revoked_at.sql, owner_audio_notes.sql |

**SEC-001 (P3)**: Actualizar `CLAUDE.md` §9.2 con la lista real. No bloquea, pero confunde a futuros agentes.

### A.3 — Tablas con datos sensibles

`pets`, `profiles`, `service_providers`, `medical_records`, `consultation_notes`, `vet_clinical_notes`, `donations`, `b2b_api_keys`, `b2b_api_usage`, `pet_co_owners`, `adoption_centers`, `pitch_applications`, `pet_timeline_events`, `medical_share_tokens`, `pet_id_cards`, `paw_passports`, `nose_print_embeddings`, `error_logs`, `payment_events`, `subscriptions`.

### A.4 — Foreign keys / timestamps / tipos

- Timestamps: todos usan `TIMESTAMP WITH TIME ZONE` o `TIMESTAMPTZ`. **OK**.
- FK faltantes: revision spot no encontro `_id uuid` sin `references`. **OK** en muestra.
- Indices en `owner_id`: `idx_pets_owner_id` existe ([20251127152253:47](supabase/migrations/20251127152253_1a29e3ec-0e7b-4c2e-bbe3-c9cecea9ac26.sql)). **OK**.

---

## SECCION B — RLS (CRITICO)

### B.1 — RLS habilitado

35+ archivos con `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, 170+ ocurrencias en migraciones. Cobertura aparente de tablas `public.*` con policies. Sin embargo hay zonas debiles abajo.

### B.2 — Policies con `USING (true)` (revisadas 1 a 1)

Ocurrencias totales: **70+**. La mayoria son OK (publicas intencionales o `service_role`-scoped). Hallazgos no triviales:

#### SEC-002 (P0) — `pets.is_public DEFAULT true` + policy publica

Archivo: [supabase/migrations/20251127152253_1a29e3ec-0e7b-4c2e-bbe3-c9cecea9ac26.sql:41,53-55](supabase/migrations/20251127152253_1a29e3ec-0e7b-4c2e-bbe3-c9cecea9ac26.sql).

```sql
CREATE TABLE pets (..., is_public BOOLEAN DEFAULT true, ...);
CREATE POLICY "Mascotas publicas son visibles por todos"
  ON public.pets FOR SELECT
  USING (is_public = true);
```

**Problema**: Toda mascota creada queda con `is_public = true`. Hay otra policy [20251128233606:15](supabase/migrations/20251128233606_7e570d60-8ff6-4a5e-999d-e480156585a6.sql) `USING (is_public = true OR auth.uid() = owner_id)` que mantiene la fuga publica.

**Evidencia**: cualquier usuario anonimo o autenticado puede listar TODAS las mascotas (`select * from pets`) y ver: nombre, especie, raza, edad, foto, condiciones medicas via campos como `medical_notes`, `microchip_number`. Ley 19.628 considera datos sensibles a microchip y salud.

**Fix sugerido**:
```sql
ALTER TABLE pets ALTER COLUMN is_public SET DEFAULT false;
UPDATE pets SET is_public = false WHERE is_public = true;
-- Solo true para mascotas en adopcion (campo separado)
ALTER TABLE pets ADD COLUMN listed_for_adoption BOOLEAN DEFAULT false;
DROP POLICY "Mascotas publicas son visibles por todos" ON pets;
CREATE POLICY "Adoption pets visible publicly" ON pets
  FOR SELECT USING (listed_for_adoption = true);
```

#### SEC-003 (P1) — `booking_events`: cualquier authenticated ve todo

Archivo: [supabase/migrations/20260520000000_booking_system_v2.sql:154-157](supabase/migrations/20260520000000_booking_system_v2.sql).

```sql
CREATE POLICY "Authenticated can view booking events"
  ON booking_events FOR SELECT
  TO authenticated
  USING (true);
```

**Problema**: cualquier usuario logueado puede leer audit trail de TODAS las reservas (incluyendo `metadata` con notas internas, telefono, transitions de estado). Cross-tenant leak: vet de clinica A ve eventos de clinica B; dueno X ve booking_events de dueno Y.

**Fix**:
```sql
DROP POLICY "Authenticated can view booking events" ON booking_events;
CREATE POLICY "Owner sees own booking events" ON booking_events
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid()
      OR EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM service_providers WHERE id = booking_id AND user_id = auth.uid()));
```

#### SEC-004 (P2) — `provider_availability_exceptions`: visible publicamente

Archivo: [supabase/migrations/20260520000000_booking_system_v2.sql:116-118](supabase/migrations/20260520000000_booking_system_v2.sql).

```sql
CREATE POLICY "Anyone can view exceptions"
  ON provider_availability_exceptions FOR SELECT
  USING (true);
```

**Problema**: revela `reason` (texto libre, posible PII como "vacaciones a Buenos Aires con familia"). Solo necesitamos disponibilidad, no la razon.

**Fix**: ocultar `reason` via vista publica o restringir `reason` a self+admin:
```sql
DROP POLICY "Anyone can view exceptions" ON provider_availability_exceptions;
CREATE POLICY "Public sees minimal exception data" ON provider_availability_exceptions
  FOR SELECT USING (true);  -- mantener el SELECT publico
-- Pero crear column-level grant:
REVOKE SELECT (reason) ON provider_availability_exceptions FROM anon, authenticated;
GRANT SELECT (reason) ON provider_availability_exceptions TO authenticated; -- limitado a self via policy adicional
```

#### SEC-005 (P2) — `owner_audio_notes`: service_role policy sin restriccion

Archivo: [supabase/migrations/20260601000000_owner_audio_notes.sql:154-159](supabase/migrations/20260601000000_owner_audio_notes.sql).

```sql
CREATE POLICY "Service role full access audio notes"
  ON public.owner_audio_notes FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);
```

`service_role` siempre tiene acceso total — esta policy es **redundante**, no añade riesgo, pero crea ruido. Pattern repetido en 20+ tablas.

**Fix**: eliminar policies redundantes scoped a `service_role` (RLS no aplica a service_role por default segun docs Supabase). No es riesgo, P2 limpieza.

### B.3 — `SECURITY DEFINER` en RPCs (revision)

`is_pet_owner(pet_uuid)` — [20251127152253:97-108](supabase/migrations/20251127152253_1a29e3ec-0e7b-4c2e-bbe3-c9cecea9ac26.sql) — valida `owner_id = auth.uid()`. **OK**.

`verify_b2b_api_key(plain_key)` — [20260902300000:111-140](supabase/migrations/20260902300000_b2b_api_keys.sql) — restringido a service_role via `REVOKE/GRANT`. **OK**.

`create_b2b_api_key(...)` — [20260902300000:206-283](supabase/migrations/20260902300000_b2b_api_keys.sql) — valida admin con check explicito. **OK**.

`_get_service_role_key()` — [20260725000009:34-58](supabase/migrations/20260725000009_push_provider_use_vault.sql) — REVOKE FROM public/anon/authenticated, GRANT TO service_role. **OK**.

#### SEC-006 (P3) — Auditar todos los SECURITY DEFINER

30+ funciones tienen `SECURITY DEFINER`. No revise una a una. Recomiendo correr query:
```sql
SELECT proname, pronamespace::regnamespace, prosecdef, prorettype::regtype
FROM pg_proc WHERE prosecdef AND pronamespace = 'public'::regnamespace;
```
Para cada una, validar `auth.uid()` o admin checks explicitos al inicio.

---

## SECCION C — Edge Functions

### C.1 — Funciones disco vs config.toml

64 funciones en disco (excluyendo `_shared/`); 55 en `config.toml`. **Diff = 0** (todas las del disco aparecen en config tras refresh — ok). Anteriormente hubo "huerfanas" registradas el 2026-04-21 (ver `config.toml:143-148`).

### C.2 — Auth manual (`auth.getUser`)

33 de 64 fns validan auth manual. Las restantes son crons (`audit-cron-daily`, `reminder-cron`, `booking-reminders-cron`, `post-adoption-checkin-cron`, `send-adoption-followups`, `send-inactive-user-reminder`, `send-monthly-vet-stats`, `send-new-pet-drip`, `send-pet-birthday-greeting`, `send-shelter-welcome`, `backup-weekly-snapshot`, `notify-health-alerts`, `run-all-cascades`, `generate-daily-digest`, `generate-sitemap`, `generate-shelters`) que se invocan con `service_role` desde `pg_cron`. **OK** si no estan expuestas al exterior — pero todas tienen `verify_jwt=false`, lo que significa que **una vez la URL se descubre cualquiera puede llamarla**.

#### SEC-007 (P1) — Edge fns cron expuestas sin auth manual

Archivo: ej [supabase/functions/audit-cron-daily/index.ts](supabase/functions/audit-cron-daily/index.ts), `verify_jwt=false`, sin verificar caller en codigo.

**Problema**: cualquier atacante puede invocar `https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/audit-cron-daily` y forzar trabajo costoso (DoS por amplificacion). Algunas envian emails (`send-pet-birthday-greeting`, `send-inactive-user-reminder`) — abuse podria mandar spam masivo.

**Fix**: en cada fn cron, validar header secreto compartido con pg_cron:
```ts
const secret = req.headers.get('x-cron-secret');
if (secret !== Deno.env.get('CRON_SHARED_SECRET')) {
  return new Response('forbidden', { status: 403 });
}
```
Y en `pg_cron`:
```sql
SELECT cron.schedule('...', ..., $$ SELECT net.http_post(
  url := '...',
  headers := jsonb_build_object('x-cron-secret', current_setting('app.cron_secret'))
) $$);
```

#### SEC-008 (P1) — `notify-pitch-application` sin auth

Archivo: [supabase/functions/notify-pitch-application/index.ts:209-275](supabase/functions/notify-pitch-application/index.ts).

```ts
serve(withTelemetry('notify-pitch-application', async (req) => {
  // ...
  const { application_id } = await req.json();
  // ❌ no auth check
  const { data: app } = await supabaseAdmin
    .from('pitch_applications')
    .select('id, kind, contact_name, contact_email, contact_phone, ...')
    .eq('id', application_id)
    .maybeSingle();
  // dispara emails Resend + Slack + Discord
}));
```

**Problema**: cualquiera puede triggerar reenvio de emails, abusar Resend quota, spamear Slack/Discord webhook. Tambien podria enumerar `application_id` UUIDs.

**Fix**: validar que el caller sea admin O que el `application_id` venga con un token firmado en RLS:
```ts
// Opcion A: requiere JWT del frontend
const authHeader = req.headers.get('Authorization');
const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', '') ?? '');
if (!user) return errorResponse('unauthorized', 401);

// Opcion B: shared secret entre la pagina /aplicar y la fn
```
Y rate limit por IP (ya existe `check_and_increment_ip_quota` RPC).

#### SEC-009 (P2) — `log-error` permite cualquier insert

Archivo: [supabase/functions/log-error/index.ts](supabase/functions/log-error/index.ts).

Tiene rate limit (30 req/60s por IP — OK), filtra ruido benigno (OK). Pero no autentica al caller — un atacante puede llenar `error_logs` con basura desde miles de IPs. Rate limit es por IP, asi que IPs distribuidas burlan el limite.

**Fix (P2)**: agregar limite global por hora, no solo por IP. Considerar que el caller valido siempre tiene anon key (tomar `apikey` header) y rechazar requests sin esa key.

### C.3 — `flow-webhook` valida firma

Archivo: [supabase/functions/flow-webhook/index.ts:23-38, 92-113](supabase/functions/flow-webhook/index.ts).

**No** valida firma del webhook entrante. **Si** valida via `getStatus` consultando Flow con HMAC firmado por nosotros — esto es la verdad y previene abuse. **OK** (mejor que validar firma del payload).

Idempotencia via `payment_events(flow_token, status_code)` UNIQUE. **OK**.

### C.4 — Edge fns mas criticas — estado

| Fn | Auth | Rate limit | Sanitize | Telemetria |
|---|---|---|---|---|
| flow-webhook | getStatus signed | idempotency lock | n/a | si |
| flow-create-subscription | auth.getUser | RPC quota | si | si |
| flow-create-donation | auth.getUser | RPC quota | si | si |
| b2b-api | API key + scope | per-key/h via RPC | parcial | si |
| pet-assistant | auth.getUser | 5/d via RPC | si | parcial |
| log-error | none | per-IP 30/60s | filtro benigno | si |
| ocr-vaccination-card | auth.getUser | si | n/a | si |
| process-consultation-transcript | auth.getUser | n/a | n/a | si |
| send-pet-invitation | auth.getUser | n/a | si | si |
| notify-pitch-application | **NONE** | **NONE** | n/a | si |
| audit-cron-daily | **NONE** | n/a | n/a | si |
| send-pet-birthday-greeting | **NONE** | n/a | n/a | si |

---

## SECCION D — Triggers SQL

### D.1 — Triggers recientes y smoke tests

`20260903800000_timeline_auto_sync_triggers.sql:288, 307` — incluye `DO $$ ... $$` smoke test al final. **OK**.

`20260902200000_pet_health_alerts.sql`, `20260902400000_vaccine_overdue_cascade.sql`, `20260903300000_antiparasitic_overdue_cascade.sql`, `20260903500000_memorial_anniversary.sql` — son RPCs de cron, no triggers AFTER INSERT/UPDATE — no aplica regla 9.2.1 directamente.

`20260903400000_pet_bootstrap_enrichment.sql` — crea trigger sobre `pets`. **Verificar**.

#### SEC-010 (P2) — Auditoria sistematica de triggers

Sin tiempo para revisar 30+ triggers, recomiendo correr el query `docs-raiz/planes/AUDIT_BROKEN_TRIGGERS.sql` (mencionado en CLAUDE.md §9.2.1) post-deploy de cada tanda. Documentar resultados.

---

## SECCION E — Storage

### E.1 — Buckets

- `medical-documents` (private, 10MB limit, mime whitelist [jpeg,png,heic,pdf]) — folder-based ownership policy con `auth.uid()::text = (storage.foldername(name))[1]`. **OK**.
- `verification-docs` (private). **OK**.
- `pet-documents` (private). **OK**.
- `service-providers` (**public** — fotos de paseadores/vets, OK porque son perfiles publicos).
- `walk-photos` (**public** — fotos de paseos, fotos de mascotas dentro). **Privacy concern**.

#### SEC-011 (P2) — `walk-photos` public

Archivo: [supabase/migrations/20251127220300_253dc18a-fe81-42e8-983c-24773d3094e8.sql:412-414](supabase/migrations/20251127220300_253dc18a-fe81-42e8-983c-24773d3094e8.sql).

```sql
INSERT INTO storage.buckets VALUES ('walk-photos', 'walk-photos', true);
```

**Problema**: cualquiera con la URL ve la foto. Los URLs de Supabase Storage publica son enumerables (hex random pero cortable). Si el path contiene `pet_id` o `user_id`, se pueden enumerar.

**Fix**: cambiar a `public=false` y usar signed URLs (`createSignedUrl(path, 3600)`) cuando dueño los necesite ver.

### E.2 — Image optimization

`src/lib/imageUtils.ts` con `compressImage` — **OK** (mencionado en CLAUDE.md §15).

---

## SECCION F — Auth & Secrets

### F.1 — Vars expuestas al cliente

Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (anon). Otros: `VITE_GOOGLE_CLIENT_ID_WEB`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_FACEBOOK_APP_ID`, `VITE_APPLE_SERVICE_ID`, `VITE_FIREBASE_*`, `VITE_META_PIXEL_ID`, `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`.

**Todas son publicas por diseno (frontend SDK)**. **OK**.

### F.2 — `service_role` en `src/`

Solo 1 match: [src/integrations/supabase/types.ts:8837](src/integrations/supabase/types.ts) — referencia al RPC `_get_service_role_key` (auto-generado, no expone valor real). **OK**.

### F.3 — Magic link redirects

[src/pages/Auth.tsx:42-45](src/pages/Auth.tsx) protege contra open-redirect:
```ts
const returnTo =
  rawReturnTo?.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : null;
```
**OK**.

`emailRedirectTo` usa `${window.location.origin}/auth` → debe estar en allow-list de Supabase Dashboard. Verificar manualmente.

### F.4 — PII en logs

`grep` con `console.(log|error|warn)` cruzado con `email|rut|password|telefono` en `src/`: **0 matches** sospechosos. PII no se loguea a console intencionalmente.

`useAuth.tsx:14` envia `email` raw a PostHog — **ver SEC-013**.

---

## SECCION G — Compliance Ley 19.628

### G.1 — `PrivacyPolicy.tsx`

Archivo [src/pages/PrivacyPolicy.tsx](src/pages/PrivacyPolicy.tsx). Existe, fechado 2026-04-19. Menciona:
- Datos personales (nombre, email, ubicacion, pago)
- Datos de mascotas (nombre, especie, raza, salud)
- Fotos/videos

**No verifique** si menciona derechos ARCO (Acceso, Rectificacion, Cancelacion, Oposicion), retencion explicita, transferencia internacional (Supabase = US), tratamiento de datos sensibles de salud.

#### SEC-012 (P1 — compliance) — Privacy Policy incompleta

Recomiendo expandir con:
- Lista exhaustiva de subprocesadores (Supabase, Flow.cl, Resend, Twilio?, Sentry, PostHog, Google Maps, Firebase, Meta, Apple)
- Tiempo de retencion explicito por categoria
- Procedimiento ARCO con email designado
- Aviso explicito Ley 19.628 + nuevo Reglamento de proteccion de datos 21.719 (entra en vigencia diciembre 2026)
- Consentimiento separado para datos de salud (sensibles)

### G.2 — Cookie banner

`src/components/CookieConsentBanner.tsx` existe. **No verifique** si separa consentimiento marketing/funcional/analytics.

---

## SECCION H — Observabilidad

### H.1 — Sentry

[src/lib/sentry.ts](src/lib/sentry.ts). Lazy-load OK. `dsn` desde env. Sample rate 0.1.

#### SEC-013 (P1) — Sentry sin `beforeSend` filter PII

[src/lib/sentry.ts:30-48](src/lib/sentry.ts) inicializa sin `beforeSend` ni `denyUrls`. Cualquier `Error` con email, RUT, address en su mensaje se envia a Sentry tal cual. Sentry tiene scrubbing server-side por defecto (passwords, tokens) pero **no scrubea email ni RUT chileno**.

**Fix**:
```ts
mod.init({
  // ...
  beforeSend(event) {
    // Scrub email patterns
    const scrub = (s: string | undefined) => s?.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]')
                                                .replace(/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g, '[rut]');
    if (event.message) event.message = scrub(event.message)!;
    if (event.exception?.values) {
      event.exception.values.forEach(v => { v.value = scrub(v.value); });
    }
    return event;
  },
});
```

### H.2 — PostHog

[src/hooks/useAuth.tsx:13-17](src/hooks/useAuth.tsx):
```ts
identify(u.id, {
  email: u.email ?? undefined,
  created_at: u.created_at,
  provider: u.app_metadata?.provider,
});
```

#### SEC-014 (P1) — PostHog identify con email raw

**Problema**: PostHog Person profile se vincula con `u.id` (UUID — OK) pero el `email` se envia como property. PostHog luego indexa esto en su DB en US. Para Ley 19.628 necesitas DPA explicito + consentimiento del usuario.

**Fix**: o quitar `email` del identify, o hashear (`sha256(email)`), o gatear por `analyticsConsent === true` desde `CookieConsentBanner`.

### H.3 — Telemetria edge fns

`_shared/telemetry.ts` con `withTelemetry` envuelve la mayoria de fns. CLAUDE.md §15 menciona "53b52402 pusheado: withTelemetry wrapper envuelve 29 edge fns". Hoy son 64 fns y al menos las verificadas (`flow-webhook`, `notify-pitch-application`, `b2b-api`, `pet-assistant`) lo usan. **OK**.

### H.4 — `.env.example`

Existe, completo, no contiene valores reales. **OK**.

---

## RESUMEN DE HALLAZGOS

| ID | Severidad | Problema | Archivo |
|---|---|---|---|
| SEC-001 | P3 | CLAUDE.md desactualizado (timestamps duplicados, count migs/fns) | CLAUDE.md §9.2, §12 |
| **SEC-002** | **P0** | `pets.is_public DEFAULT true` + policy publica → todas las mascotas son lectura publica anonima | 20251127152253:41,53-55 |
| SEC-003 | P1 | `booking_events` SELECT publico para authenticated → cross-tenant leak | 20260520000000:154-157 |
| SEC-004 | P2 | `provider_availability_exceptions.reason` publico → posible PII | 20260520000000:116-118 |
| SEC-005 | P2 | Policies redundantes scoped a `service_role` (ruido) | 20+ migrations |
| SEC-006 | P3 | Auditar `SECURITY DEFINER` masivo | 30+ funciones |
| SEC-007 | P1 | Edge fns cron (15+) con `verify_jwt=false` y sin shared secret check → DoS/abuse | supabase/functions/*-cron/, send-* |
| SEC-008 | P1 | `notify-pitch-application` sin auth → spam emails Resend | supabase/functions/notify-pitch-application/index.ts:209-275 |
| SEC-009 | P2 | `log-error` solo rate-limit por IP → bypass distribuido | supabase/functions/log-error/index.ts |
| SEC-010 | P2 | Auditoria sistematica de triggers pendiente | docs-raiz/planes/AUDIT_BROKEN_TRIGGERS.sql |
| SEC-011 | P2 | bucket `walk-photos` public → fotos enumerables | 20251127220300:412-414 |
| SEC-012 | P1 | Privacy Policy incompleta vs Ley 19.628 + 21.719 | src/pages/PrivacyPolicy.tsx |
| SEC-013 | P1 | Sentry sin `beforeSend` PII scrub | src/lib/sentry.ts:30-48 |
| SEC-014 | P1 | PostHog identify con `email` raw | src/hooks/useAuth.tsx:13-17 |

---

## RECOMENDACIONES TOP-5 DE EJECUCION

1. **HOY (P0)**: SEC-002. Migrar `pets.is_public` a `false` por default + crear `listed_for_adoption` separado. Riesgo de privacidad mas grave del codebase, fix < 30 min.
2. **Esta semana (P1)**: SEC-013 + SEC-014 — agregar `beforeSend` Sentry y quitar/hashear email PostHog. 1 hora total.
3. **Esta semana (P1)**: SEC-008 — proteger `notify-pitch-application`. 30 min.
4. **Esta semana (P1)**: SEC-007 — shared secret en crons. 2-3 horas para 15 fns.
5. **Esta semana (P1)**: SEC-003 — fix policy `booking_events` cross-tenant.

Total estimado: **1 dia de trabajo** para P0 + P1.
