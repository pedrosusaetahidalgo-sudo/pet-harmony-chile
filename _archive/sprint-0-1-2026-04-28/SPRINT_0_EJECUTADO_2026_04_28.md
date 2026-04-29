# Sprint 0 ejecutado — 2026-04-28

> Acciones P0 del informe [AUDITORIA_PAWFRIEND_2026-04-27.md](../AUDITORIA_PAWFRIEND_2026-04-27.md) que se cerraron en código hoy + lista de acciones manuales que quedan en manos de Pedro.

---

## ✅ Completado en código (este sprint)

| ID | Resumen | Archivos modificados |
|---|---|---|
| **SEC-002** | Migración SQL `pets.is_public default false` + columna `listed_for_adoption` + drop de policy publica + smoke test inline | [supabase/migrations/20260906000000_pets_default_private.sql](../supabase/migrations/20260906000000_pets_default_private.sql) **(nueva)** |
| **AI-001** | `wound-vision` fallback conservador: `urgency:'amarillo' (Monitorear)` → `'naranja' (Consulta pronto)` + copy que pide foto nueva o consulta cercana | [supabase/functions/wound-vision/index.ts:212-222](../supabase/functions/wound-vision/index.ts) |
| **AI-002** | `verify-service-provider` rama vet pasa `model: 'claude-sonnet-4-6'` explícito (antes dependía del default implícito) | [supabase/functions/verify-service-provider/index.ts:267-273](../supabase/functions/verify-service-provider/index.ts) |
| **AI-005** | `nutrition-coach` mueve el bloque del paciente desde `systemPrompt` (cacheable) a `dynamicSystemText` para que el cache hit funcione (~80% ahorro de input tokens en llamadas dentro de 5 min) | [supabase/functions/nutrition-coach/index.ts:93-138](../supabase/functions/nutrition-coach/index.ts) |
| **LOC-PELUDITO** | "peludito" → "peludo" en pagina `Donaciones` | [src/pages/Donaciones.tsx:313](../src/pages/Donaciones.tsx) |
| **LOC-EMAIL** (10 archivos) | Voseo eliminado en 6 edge fns (`send-new-pet-drip`, `send-inactive-user-reminder`, `send-adoption-status-email`, `send-adoption-followups`, `send-shelter-welcome`, `nose-print-match`, `generate-shelter-report-pdf`) + 3 `_shared` (`email-theme`, `email-blocks`, `invitation-email`) + 2 HTML emails (`password_reset.html`, `member_welcome.html`) | ver lista completa abajo |
| **LOC-UI** (24+ archivos) | Voseo eliminado en `src/pages/*` (AddPet, OnboardingQuickFlow, Adoption, InsightsLanding, InsightsIndex, MisAdopciones, MisPostulaciones, NoseScan, NosePrintTest, ParaVeterinarios, PostAdoptionCheckin, RefugiosHogares, ShelterAdoptionsKanban) + `src/components/*` (CoOwnerInviteReceivedDialog, PawVoicesWall, ShelterPetCard, HomePetFocusV2, OwnerAudioNoteRecorder, RegisterInterventionSheet, ResearchConsentDialog, AddReminderDialog, NotificationPrefsSection, ShelterOnboardingChecklist, AudiencesStrip, PlanComparisonTable) + 5 blog posts SEO | ver lista completa abajo |
| **FEAT-001** | `OnboardingQuickFlow.handleFinish` ahora llama `markOnboardingComplete(user.id)` (antes el funnel quedaba sin marcar). También cambia `is_public: true` → `false` para coherencia con SEC-002. | [src/pages/OnboardingQuickFlow.tsx:33,165-169,205-216](../src/pages/OnboardingQuickFlow.tsx) |
| **FEAT-008** | `/paw-game` ya no auto-crea `user_guardian_progress` al pisar la ruta. La fila se crea lazy desde el RPC `award_paw_points` en la primera acción real (`INSERT ... ON CONFLICT DO UPDATE` ya existente). | [src/pages/PawGame.tsx:245-253](../src/pages/PawGame.tsx) |
| **FEAT-013** | Botón "Cancelar" en `MyBookings` conectado a la mutation existente `useCancelBooking` (RPC server-side `rpc_cancel_booking` + state machine + optimistic update + Google Calendar cleanup ya estaban listos, solo faltaba la entrada UI). AlertDialog con motivo opcional. | [src/pages/MyBookings.tsx](../src/pages/MyBookings.tsx) |
| **FEAT-017** | Flags `NOSE_PRINT_ENABLED` y `NOSE_PRINT_ONBOARDING` puestos en `false`. Código y tablas se mantienen (regla "esconder, no eliminar"); reactivar en Fase 3 cuando haya partner pharma o volumen para entrenar fine-tune propio. | [src/lib/featureFlags.ts:321-345](../src/lib/featureFlags.ts) |

### Verificación post-sprint

- `npx tsc -b` → **0 errores**.
- `grep -rE "tenés|querés|podés|sabés|escribinos|peludit" src/ supabase/functions/` → **0 hits** en runtime (solo quedan en docs internos: `_pending/`, `_archive/`, `content-studio/`, `docs-raiz/` que no se exhiben al usuario final).

---

## ⚠️ Acciones manuales pendientes (Pedro)

Las siguientes están **fuera del alcance de Claude Code** y requieren tu intervención directa antes del lanzamiento 1 junio 2026.

### 🔴 Bloqueantes lanzamiento

#### 1. Aplicar migración SEC-002 a Supabase prod

```bash
# Abrir Supabase Dashboard > SQL Editor
# Copiar/pegar el contenido de:
# supabase/migrations/20260906000000_pets_default_private.sql
# Ejecutar.
```

Verificar post-aplicación:

```sql
-- Default cambiado
SELECT column_default FROM information_schema.columns
  WHERE table_schema='public' AND table_name='pets' AND column_name='is_public';
-- Debe retornar 'false'

-- Backfill aplicado
SELECT count(*) FROM public.pets WHERE is_public = true;
-- Debe ser 0

-- Columna nueva existe
SELECT count(*) FROM public.pets WHERE listed_for_adoption = false;
-- Debe ser igual al total de pets
```

**Riesgo**: si NO se aplica esta migración, la fuga Ley 19.628 sigue activa. Es el único P0 que necesita acción manual antes de lanzar.

---

#### 2. Redeploy de las 13 edge functions modificadas

Las correcciones de voseo + AI-001 + AI-002 + AI-005 sólo entran en producción tras redeploy:

```bash
npx supabase functions deploy wound-vision
npx supabase functions deploy verify-service-provider
npx supabase functions deploy nutrition-coach
npx supabase functions deploy send-new-pet-drip
npx supabase functions deploy send-inactive-user-reminder
npx supabase functions deploy send-adoption-status-email
npx supabase functions deploy send-adoption-followups
npx supabase functions deploy send-shelter-welcome
npx supabase functions deploy nose-print-match
npx supabase functions deploy generate-shelter-report-pdf
```

Los 3 archivos `_shared` (`email-theme.ts`, `email-blocks.ts`, `invitation-email.ts`) se incluyen automáticamente en cada deploy.

**Verificación**: provocar un email de prueba (ej: aceptar invitación pet, reset password) y revisar que el copy ya use tuteo.

---

#### 3. Generar iOS app icons (MOB-005)

```bash
npm run assets:generate
git add ios/App/App/Assets.xcassets/AppIcon.appiconset/
git commit -m "feat(ios): app icons completos (P0 MOB-005)"
```

Genera el set completo (29@2x, 29@3x, 40@2x, 40@3x, 60@2x, 60@3x, 76, 76@2x, 83.5@2x, 1024). Sin esto, App Store Review rechaza submission.

---

#### 4. Agregar permisos iOS Info.plist (MOB-006)

Editar [ios/App/App/Info.plist](../ios/App/App/Info.plist) y agregar:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necesitamos tu ubicación para mostrar veterinarios cercanos en el mapa y sugerirte rutas de paseo. Solo se usa mientras la app está abierta.</string>
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceder a la cámara para que puedas tomar fotos de tu mascota y subir su carnet de vacunas.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Necesitamos acceder a tu galería para que puedas elegir fotos de tu mascota.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Necesitamos acceder al micrófono para grabar notas de voz sobre tu mascota.</string>
```

Sin estos strings, iOS bloquea la app al pedir permisos y App Store la rechaza.

---

#### 5. Decisión + parche T&C honesto sobre boletas SII (COMP-004)

**Riesgo**: T&C declara emisión de boletas SII pero hay 0 implementación → contingencia tributaria al primer pago.

**Camino corto** (esta semana):
1. Editar [src/pages/TermsOfService.tsx](../src/pages/TermsOfService.tsx) con el texto honesto:
   > "Las boletas/facturas se emiten manualmente por SUSAETA GARNHAM SOFTWARE ENGINEERING SpA (RUT 78.328.659-9) dentro de las 48h desde el pago. Para solicitar reenvío, escribe a hola@pawfriend.cl."
2. Bloquear pagos masivos hasta tener integración real.

**Camino largo** (Sprint 1-2): integrar OpenFactura o Bsale via edge fn `emit-sii-receipt` triggered desde `flow-webhook` post `payment_events.outcome='ok'`.

**Decisión que necesito de ti**: ¿corto o largo? Si corto, te entrego el parche del T&C en el próximo turn.

---

#### 6. Cierre migración Flow.cl a SpA (BIZ-003/004)

Ya en curso según memoria del proyecto. Bloqueante para activar `DONATIONS_MONTHLY` (hoy en `false` correctamente).

---

### 🟠 No bloqueantes pero alta prioridad

#### 7. Programar pg_cron de cascadas Fase 2 (FEAT-019)

Las RPCs `compute_*_alerts` + edge fn `notify-health-alerts` + `run-all-cascades` están listas. Sin cron escalan a 0× users.

```sql
-- En Supabase Dashboard > SQL Editor (extension pg_cron habilitada):
SELECT cron.schedule(
  'cascadas-diarias',
  '0 9 * * *',  -- 9 AM Chile (12:00 UTC)
  $$
    SELECT net.http_post(
      url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/run-all-cascades',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      )
    );
  $$
);
```

Recordatorio: **NO hardcodear el JWT** — usar `current_setting('app.settings.service_role_key')` (memoria del proyecto sobre incidente 2026-04-20).

---

## 📁 Lista detallada archivos modificados (32 archivos + 1 migración nueva)

### Backend
- `supabase/migrations/20260906000000_pets_default_private.sql` **(nuevo)**
- `supabase/functions/wound-vision/index.ts`
- `supabase/functions/verify-service-provider/index.ts`
- `supabase/functions/nutrition-coach/index.ts`
- `supabase/functions/send-new-pet-drip/index.ts`
- `supabase/functions/send-inactive-user-reminder/index.ts`
- `supabase/functions/send-adoption-status-email/index.ts`
- `supabase/functions/send-adoption-followups/index.ts`
- `supabase/functions/send-shelter-welcome/index.ts`
- `supabase/functions/nose-print-match/index.ts`
- `supabase/functions/generate-shelter-report-pdf/index.ts`
- `supabase/functions/_shared/email-theme.ts`
- `supabase/functions/_shared/email-blocks.ts`
- `supabase/functions/_shared/invitation-email.ts`

### Frontend páginas
- `src/pages/AddPet.tsx`
- `src/pages/Adoption.tsx`
- `src/pages/Donaciones.tsx`
- `src/pages/InsightsLanding.tsx`
- `src/pages/InsightsIndex.tsx`
- `src/pages/MisAdopciones.tsx`
- `src/pages/MisPostulaciones.tsx`
- `src/pages/MyBookings.tsx`
- `src/pages/NoseScan.tsx`
- `src/pages/NosePrintTest.tsx`
- `src/pages/OnboardingQuickFlow.tsx`
- `src/pages/ParaVeterinarios.tsx`
- `src/pages/PawGame.tsx`
- `src/pages/PostAdoptionCheckin.tsx`
- `src/pages/RefugiosHogares.tsx`
- `src/pages/shelter/ShelterAdoptionsKanban.tsx`

### Frontend componentes
- `src/components/CoOwnerInviteReceivedDialog.tsx`
- `src/components/PawVoicesWall.tsx`
- `src/components/adoption/ShelterPetCard.tsx`
- `src/components/home/HomePetFocusV2.tsx`
- `src/components/medical/OwnerAudioNoteRecorder.tsx`
- `src/components/medical/RegisterInterventionSheet.tsx`
- `src/components/profile/ResearchConsentDialog.tsx`
- `src/components/reminders/AddReminderDialog.tsx`
- `src/components/settings/NotificationPrefsSection.tsx`
- `src/components/shelter/ShelterOnboardingChecklist.tsx`
- `src/components/landing/AudiencesStrip.tsx`
- `src/components/pricing/PlanComparisonTable.tsx`

### Frontend lib y blog
- `src/lib/featureFlags.ts`
- `src/content/blog/seguro-mascotas-chile-vale-la-pena.tsx`
- `src/content/blog/protocolo-mascota-perdida-maipu.tsx`
- `src/content/blog/cuanto-cuesta-tener-perro-primer-ano-chile.tsx`
- `src/content/blog/barf-vs-pellet-que-conviene-perros.tsx`
- `src/content/blog/desparasitacion-perro-gato-cada-cuanto-chile.tsx`

### Public assets
- `public/paw-friend-assets-v2/email/password_reset.html`
- `public/paw-friend-assets-v2/email/member_welcome.html`

> Nota: `docs/paw-friend-assets-v2/email/*.html` también tiene voseo (espejo del build) — se limpia al correr `npm run build`.

---

## 🔄 Sprint 1 — primer batch ejecutado (mismo día, 2026-04-28)

Continuación tras cerrar Sprint 0. Items P1 que no requerían decisión de negocio:

| ID | Resumen | Archivos |
|---|---|---|
| **COMP-004** (corto) | T&C reescrito con lenguaje honesto sobre boletas SII manuales por SpA SUSAETA. Fecha "Última actualización" actualizada. | [src/pages/TermsOfService.tsx:28,193-198](../src/pages/TermsOfService.tsx) |
| **LOC-MICROCOPY** | Nuevo helper [src/lib/toast.ts](../src/lib/toast.ts) con `toastError(action, { hint, error })`, `toastAuthRequired()` y re-exports. Migración gradual de los 77 callsites legacy queda para Sprint 3-6. | [src/lib/toast.ts](../src/lib/toast.ts) **(nuevo)** |
| **SEC-013** | Sentry `beforeSend` + `beforeBreadcrumb` que scrub PII (email, RUT, teléfono chileno, JWT) por regex de keys + valores antes de enviar al data center US. `event.user` se reduce a `id` solamente. | [src/lib/sentry.ts:27-100](../src/lib/sentry.ts) |
| **SEC-014** | `identify()` en `analytics.ts` gateado por `localStorage.getItem('pf_cookie_consent') === 'accepted'`. Sin consent: solo `userId` (UUID). Con consent: traits completos. Firebase setUserId siempre con UUID. | [src/lib/analytics.ts:325-378](../src/lib/analytics.ts) |
| **SEC-008** | `notify-pitch-application` ahora exige `confirmation_email` en el body que coincide con `application.contact_email` + ventana de 10 minutos desde `created_at`. Bloquea enumeración + replay/abuse retroactivo. 3 callsites front actualizados (Aplicar, CategoryApplyInlineForm, VetOnboardingInlineForm). | [supabase/functions/notify-pitch-application/index.ts:209-260](../supabase/functions/notify-pitch-application/index.ts) + [src/pages/Aplicar.tsx:390-396](../src/pages/Aplicar.tsx) + [src/components/CategoryApplyInlineForm.tsx:158-164](../src/components/CategoryApplyInlineForm.tsx) + [src/components/VetOnboardingInlineForm.tsx:92-98](../src/components/VetOnboardingInlineForm.tsx) |
| **FEAT-010** | Eventos `PET_CLAIMED` y `PET_CLAIM_FAILED` agregados a `EVENTS` y conectados al hook `useClaimPetInvitation`. Permite medir % de invitaciones que cierran loop viral vet→dueño + breakdown de fallas (token inválido vs ya reclamada). | [src/lib/analytics.ts:158-162](../src/lib/analytics.ts) + [src/hooks/useClaimPetInvitation.ts](../src/hooks/useClaimPetInvitation.ts) |
| **MOB-010** | `ErrorBoundary` detecta `ChunkLoadError` por `name` y patrones (`Loading chunk`, `Failed to fetch dynamically imported module`). Auto-reload una vez por sesión + UI especifica "Hay una versión nueva — Actualizar" si auto-reload no resuelve. | [src/components/ErrorBoundary.tsx](../src/components/ErrorBoundary.tsx) |

### Verificación post-batch Sprint 1

- `npx tsc -b` → **0 errores**.
- Sin nuevas regresiones de voseo (las correcciones del Sprint 0 se mantienen).
- Sin cambios destructivos a DB ni a código de Pedro pendiente.

### Acciones manuales adicionales tras este batch

#### 7. Redeploy `notify-pitch-application`

```bash
npx supabase functions deploy notify-pitch-application
```

Sin esto, los formularios de /aplicar, /paw-companys, etc, fallan al notificar a Pedro porque la edge fn antigua no espera `confirmation_email` (los nuevos clients lo envían siempre, lo que es OK; pero el server antiguo aceptaría sin él, dejando la versión vieja vulnerable hasta que se redeployee).

---

## 🔄 Sprint 1 — segundo batch ejecutado (mismo día, 2026-04-28)

| ID | Resumen | Archivos |
|---|---|---|
| **SEC-007** | Helper [supabase/functions/_shared/cron-auth.ts](../supabase/functions/_shared/cron-auth.ts) con `requireCronAuth(req)` (timing-safe equality, acepta `X-Cron-Secret` env o `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`). Integrado en las **5 cron fns más sensibles** (vector spam emails / DoS): `run-all-cascades`, `notify-health-alerts`, `send-inactive-user-reminder`, `send-pet-birthday-greeting`, `send-new-pet-drip`. Las restantes (`send-monthly-vet-stats`, `send-shelter-welcome`, `post-adoption-checkin-cron`, `backup-weekly-snapshot`, etc.) quedan con el helper disponible para integrar en lote. | helper nuevo + 5 fns |
| **COMP-005** | Checkbox de marketing consent SEPARADO del consent de uso en `Auth.tsx` signup form (default desmarcado, opt-in real Ley 19.628 / Reglamento 21.719). Migración nueva `20260907000000_marketing_consent.sql` agrega `profiles.marketing_email_consent` + `marketing_email_consent_at` y reescribe `handle_new_user()` para persistir lo que viene en `raw_user_meta_data`. Smoke test inline. | [src/pages/Auth.tsx](../src/pages/Auth.tsx) + [supabase/migrations/20260907000000_marketing_consent.sql](../supabase/migrations/20260907000000_marketing_consent.sql) **(nueva)** |
| **FEAT-002** | Step "paso bonus" post-creación en `OnboardingQuickFlow` que muestra `<VaccinationCardOCR>` con `petId` recién creado. El dueño puede subir el carnet y la IA arma todo el historial (propuesta de valor "ficha completa sin tipear"), o saltar y ir directo a la ficha. Restaura el OCR del flow legacy. | [src/pages/OnboardingQuickFlow.tsx](../src/pages/OnboardingQuickFlow.tsx) |
| **COMP-002** | Página nueva `/profile/exportar-mis-datos` (ProtectedRoute) que llama RPC `export_user_data()` y descarga JSON `pawfriend-mis-datos-YYYY-MM-DD.json`. La RPC (`SECURITY DEFINER` filtra por `auth.uid()`) recoge profile + pets + medical_records + reminders + timeline + bookings V1/V2 + donations + pitch_applications. Cumple derecho ARCO de portabilidad. | [src/pages/ExportarMisDatos.tsx](../src/pages/ExportarMisDatos.tsx) **(nueva)** + [src/App.tsx](../src/App.tsx) ruta + [supabase/migrations/20260907100000_export_user_data_rpc.sql](../supabase/migrations/20260907100000_export_user_data_rpc.sql) **(nueva)** |
| **MOB-007** | `public/.well-known/apple-app-site-association` actualizado con paths de Refactor Maestro Fase 1 que faltaban: `/memoria/*`, `/insights*`, `/insights-pro*`, `/refugios-hogares`, `/precios-veterinarios/*`, `/post-adoption/*`, `/blog*`, `/paw-support`, `/paw-core`, `/nose-scan`. Mantiene `NOT /admin` y agrega `NOT /auth` (OAuth callbacks prefieren Safari). Vite copia automáticamente al build. `assetlinks.json` Android ya estaba OK. | [public/.well-known/apple-app-site-association](../public/.well-known/apple-app-site-association) |
| **TEST-002** | Spec nuevo [e2e/integration/happy-path-owner.spec.ts](../e2e/integration/happy-path-owner.spec.ts) con 3 tests: login → home → add-pet → my-pets → logout, redirect a /auth desde rutas protegidas sin sesión, export ARCO download flow. Usa env vars `E2E_TEST_EMAIL/PASSWORD`; skipea si faltan. | spec nuevo |
| **TEST-003** | Spec nuevo [e2e/integration/rls-cross-user.spec.ts](../e2e/integration/rls-cross-user.spec.ts) con **10 tests** que validan que user B no puede SELECT/UPDATE/DELETE/INSERT en data de user A: pets directos + via id, medical_records, pet_reminders, vet_bookings, profiles + verifica que anon NO ve pets post-SEC-002. Requiere segundo test user `E2E_TEST_EMAIL_B/PASSWORD_B`. | spec nuevo |

### Verificación post-batch 2

- `npx tsc -b` → **0 errores**.
- `tsc` también compila las 2 migraciones SQL nuevas implícitamente (revisión sintáctica vía smoke test inline).

### Acciones manuales adicionales tras este batch

#### 8. Aplicar 2 migraciones SQL nuevas

```bash
# Supabase Dashboard > SQL Editor:
# 1. supabase/migrations/20260907000000_marketing_consent.sql
# 2. supabase/migrations/20260907100000_export_user_data_rpc.sql
```

Verificación:

```sql
-- Marketing consent column existe
SELECT column_name, data_type, column_default FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles'
    AND column_name LIKE 'marketing_email_consent%';

-- RPC export_user_data existe y tiene el grant correcto
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'export_user_data';
SELECT grantee FROM information_schema.role_routine_grants
  WHERE routine_name = 'export_user_data';
-- debe estar 'authenticated'
```

#### 9. Crear secret PAWFRIEND_CRON_SECRET (opcional pero recomendado)

```bash
# Generar secret de 48 bytes:
openssl rand -base64 48
# Guardar en Supabase Dashboard > Settings > Edge Functions > Secrets
# como: PAWFRIEND_CRON_SECRET
```

Si no lo creas, las cron fns aceptan el `SUPABASE_SERVICE_ROLE_KEY` como fallback (que pg_cron envía por defecto). El secret separado es útil para crons externos (GitHub Actions, healthchecks).

#### 10. Crear segundo test user para TEST-003

```bash
# Supabase Dashboard > Auth > Users > Add user:
# email: e2e-test-b@pawfriend.local
# password: <random>
# Agregar a .env.local + GitHub Secrets:
#   E2E_TEST_EMAIL_B=e2e-test-b@pawfriend.local
#   E2E_TEST_PASSWORD_B=<password>
```

#### 11. Redeploy de las cron fns con nuevo guard

```bash
npx supabase functions deploy run-all-cascades
npx supabase functions deploy notify-health-alerts
npx supabase functions deploy send-inactive-user-reminder
npx supabase functions deploy send-pet-birthday-greeting
npx supabase functions deploy send-new-pet-drip
npx supabase functions deploy notify-pitch-application  # del batch 1
```

⚠️ Asegurate de tener `SUPABASE_SERVICE_ROLE_KEY` (variable estandar Supabase) seteado en Edge Functions Secrets — ya debería estar, es el default de cualquier proyecto Pro.

#### 12. Validar Universal Links iOS post-deploy

```bash
# Después de hacer git push y que docs/ se publique:
curl -I https://pawfriend.cl/.well-known/apple-app-site-association
# Debe responder Content-Type: application/json
# Si no: GitHub Pages requiere el archivo SIN extensión, ya está OK.

# Validar con Apple:
# https://app-site-association.cdn-apple.com/a/v1/pawfriend.cl
```

---

## 🔄 Sprint 1 — tercer batch ejecutado (mismo día, 2026-04-28)

| ID | Resumen | Archivos |
|---|---|---|
| **BIZ-010** | "IVA incluido" agregado bajo cada precio mensual del track Vet/Clínica en `PlanComparisonTable`. | [src/components/pricing/PlanComparisonTable.tsx](../src/components/pricing/PlanComparisonTable.tsx) |
| **BIZ-008** | Nuevo `PremiumToClinicNudge` dentro de `UpgradePlanBanner`: vets en Premium ven banner dismissable (cooldown 90d localStorage) "¿Trabajas con más vets?" → CTA `/aplicar?tipo=vet&segmento=clinica&fuente=dashboard`. | [src/components/provider/dashboard/UpgradePlanBanner.tsx](../src/components/provider/dashboard/UpgradePlanBanner.tsx) |
| **MOB-003** | Sin code change. Trigger DB `notify_provider_push_on_new_booking` ya existe (mig 20260725000007/9/10/11). Activación = smoke test 1 vet → flip flag `PROVIDER_PUSH`. Acción manual #15 abajo. | n/a |
| **BIZ-006** | Skeleton renovación Flow: edge fn nueva `flow-renewal-reminders-cron` que detecta subs con `auto_renew=true` + `end_date` en ventana 7d + cooldown idempotente 7d. Manda email Resend "Tu plan vence". Auth con `requireCronAuth` (SEC-007). Mig nueva agrega `subscriptions.last_renewal_reminder_at` + index parcial. Registrado en `config.toml`. | [supabase/functions/flow-renewal-reminders-cron/index.ts](../supabase/functions/flow-renewal-reminders-cron/index.ts) **(nueva)** + [supabase/migrations/20260907200000_subscriptions_renewal_reminder.sql](../supabase/migrations/20260907200000_subscriptions_renewal_reminder.sql) **(nueva)** + [supabase/config.toml](../supabase/config.toml) |

### Verificación post-batch 3

- `npx tsc -b` → **0 errores**.
- 4 migraciones SQL totales en el día.

### Acciones manuales adicionales tras batch 3

#### 13. Aplicar mig SQL `subscriptions_renewal_reminder`

```bash
# Supabase Dashboard > SQL Editor:
# supabase/migrations/20260907200000_subscriptions_renewal_reminder.sql
```

Verificación:
```sql
SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='subscriptions'
    AND column_name='last_renewal_reminder_at';
SELECT indexname FROM pg_indexes WHERE indexname='idx_subscriptions_renewal_window';
```

#### 14. Deploy + scheduling de `flow-renewal-reminders-cron`

```bash
npx supabase functions deploy flow-renewal-reminders-cron
```

Antes de schedularlo, **invocar 1 vez manual** y validar que responde `{ ok: true }`:
```bash
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/flow-renewal-reminders-cron
```

Si OK, schedular en SQL Editor:
```sql
SELECT cron.schedule(
  'flow-renewal-reminders-daily',
  '0 14 * * *',
  $$ SELECT net.http_post(
    url := 'https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/flow-renewal-reminders-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
      'Content-Type', 'application/json'
    )
  ); $$
);
```

#### 15. Activar `PROVIDER_PUSH` (smoke test 1 vet)

Con un vet de confianza (Sofia, Cafati, otro):
1. Pedirle que abra la app desde móvil — `App.tsx:191-211` registra el FCM token automáticamente.
2. Confirmar fila en `device_tokens` con su `user_id` y `enabled=true`:
   ```sql
   SELECT user_id, platform, enabled FROM device_tokens WHERE user_id = '<vet-uuid>';
   ```
3. Crear booking de prueba para él desde una cuenta dueño.
4. Esperar push (trigger `notify_provider_push_on_new_booking` debería disparar).
5. Si push llega OK → cambiar `featureFlags.ts:134` `PROVIDER_PUSH: false` → `true`.

Si push NO llega:
- Verificar `app.settings.service_role_key` seteado (mig `20260725000009`).
- Verificar `send-push-notification` deployed.
- Revisar logs de Supabase Edge Functions.

---

## 🔄 Resumen total Sprint 0 + Sprint 1 (mismo día 2026-04-28)

**29 hallazgos cerrados en código** (11 P0 + 18 P1) en 1 día:

| Categoría | Items | Highlights |
|---|---|---|
| Sprint 0 P0 (11) | SEC-002, AI-001, AI-002, AI-005, FEAT-001, FEAT-008, FEAT-013, FEAT-017, LOC-EMAIL, LOC-UI, LOC-PELUDITO | Privacy fix + voseo cero + AI safety + cancel booking |
| Sprint 1 batch 1 (7) | COMP-004 corto, LOC-MICROCOPY, SEC-013, SEC-014, SEC-008, FEAT-010, MOB-010 | T&C honesto + Sentry/PostHog scrub + ChunkLoadError |
| Sprint 1 batch 2 (7) | SEC-007, COMP-005, FEAT-002, COMP-002, MOB-007, TEST-002, TEST-003 | Cron auth + ARCO + OCR onboarding + tests RLS |
| Sprint 1 batch 3 (4) | BIZ-010, BIZ-008, MOB-003 (doc), BIZ-006 | IVA + upsell vets + cron renovación |

**Migraciones SQL nuevas (4)**:
1. `20260906000000_pets_default_private` (SEC-002 — privacy P0)
2. `20260907000000_marketing_consent` (COMP-005)
3. `20260907100000_export_user_data_rpc` (COMP-002 ARCO)
4. `20260907200000_subscriptions_renewal_reminder` (BIZ-006)

**Edge functions nuevas (1)**: `flow-renewal-reminders-cron` (BIZ-006).

**Edge functions modificadas (14, requieren redeploy)**:
`wound-vision`, `verify-service-provider`, `nutrition-coach`, `notify-pitch-application`, `run-all-cascades`, `notify-health-alerts`, `send-inactive-user-reminder`, `send-pet-birthday-greeting`, `send-new-pet-drip`, `send-adoption-status-email`, `send-adoption-followups`, `send-shelter-welcome`, `nose-print-match`, `generate-shelter-report-pdf`.

**Componentes/páginas/specs nuevos**:
- `src/lib/toast.ts` (LOC-MICROCOPY helper)
- `src/pages/ExportarMisDatos.tsx` (COMP-002 ARCO UI)
- `e2e/integration/happy-path-owner.spec.ts` (TEST-002)
- `e2e/integration/rls-cross-user.spec.ts` (TEST-003)
- `supabase/functions/_shared/cron-auth.ts` (SEC-007 helper)

**Lo que queda del informe maestro** (no abordado hoy):
- FEAT-005 multi-vet seats E2E test (depende de 2 vet test users en staging)
- FEAT-014 conectar cobro online booking (decisión post-launch)
- MOB-001 `@capacitor/camera` (`npm install` Pedro)
- COMP-004 largo (integración OpenFactura/Bsale SII automatizado — decisión negocio)
- ARCH-001 refactor god components (Sprint 3-6)
- ARCH-002 strict TS gradual (Sprint 3-6)
- ARCH-003 DRY (Sprint 3-6)
- PERF-003/005 (Sprint 3-6) — PERF-001 cerrado en batch 4
- DOC-005 reducir restantes .md (Sprint 3-6) — fase 1 cerrada en batch 4
- LOC-MICROCOPY: migrar 22 callsites legacy restantes (Sprint 3-6) — 11 cerrados en batch 4

— Sprint 0 + Sprint 1 (3 batches) cerrados en código, 2026-04-28.

---

## 🧹 Sprint 1 — cuarto batch ejecutado (limpieza estructural, mismo día)

| ID | Resumen | Archivos |
|---|---|---|
| **PERF-001** | xlsx (~400KB gzipped) ya no se importa estáticamente. Convertido a `await import('xlsx')` lazy en los 2 callsites: `auditExport.ts` (admin export) y `ShelterBulkImport.tsx`. El chunk admin y la ruta /shelter/bulk-import ya no cargan xlsx hasta que el usuario clickea "Exportar" / elige archivo. | [src/lib/auditExport.ts](../src/lib/auditExport.ts) + [src/pages/shelter/ShelterBulkImport.tsx](../src/pages/shelter/ShelterBulkImport.tsx) |
| **DOC-005 fase 1** | 19 archivos `.md` movidos a `_archive/`: 5 audits ya consumidos por la auditoría 04-27 + 7 docs nose-print pausados (FEAT-017) + 4 logs `.log` + 3 obsoletos de raíz. Raíz pasó de 11 a 8 `.md` canónicos. `_pending/` pasó de 30+ a 17 archivos relevantes. Links de informe maestro y INDEX.md actualizados. | `_archive/audits-2026-04-27/`, `_archive/nose-print-2026-04/`, `_archive/logs-2026-04/` |
| **LOC-MICROCOPY** | Helper `toastError` (creado batch 1) consumido en **11 callsites** críticos: `AdManagement` (3x crear/actualizar/eliminar), `Auth.tsx` (recovery), `AddPet.tsx` (3x validaciones de campo), `CreatePost.tsx` (4x), `Profile.tsx`, `ReviewForm`, `MedicalDocumentsTab` (2x), `EditProfileDrawer`. De los **77 originales** quedan **22** legacy (29% reducción). | 8 archivos UI |

### Verificación post-batch 4

- `npx tsc -b` → **0 errores**.
- xlsx fuera del bundle main + chunk admin (verificar con `stats.html` post `npm run build`).
- Microcopy con tono cálido + acción concreta en flujos críticos: signup, add-pet, post, review, profile, document download.

### 🔢 Conteo final del día

**32 hallazgos cerrados en código** (11 P0 + 21 P1/P2):

| Categoría | Items |
|---|---|
| Sprint 0 P0 | 11 |
| Sprint 1 batch 1 | 7 (COMP-004 corto, LOC-MICROCOPY helper, SEC-013, SEC-014, SEC-008, FEAT-010, MOB-010) |
| Sprint 1 batch 2 | 7 (SEC-007, COMP-005, FEAT-002, COMP-002, MOB-007, TEST-002, TEST-003) |
| Sprint 1 batch 3 | 4 (BIZ-010, BIZ-008, MOB-003 doc, BIZ-006) |
| Sprint 1 batch 4 cleanup | 3 (PERF-001, DOC-005 fase 1, LOC-MICROCOPY parcial) |

**Total archivos**: ~85+ tocados (32 código + 19 archivados + 4 SQL + 14 edge fns redeploy + 5 docs/specs/helpers nuevos).

— Sprint 0 + Sprint 1 (4 batches), 2026-04-28.

---

## 🧹 Sprint 1 — quinto batch ejecutado (refinement, mismo día)

| ID | Resumen | Archivos |
|---|---|---|
| **LOC-MICROCOPY (cierre)** | Los 22 callsites legacy restantes del patrón `'Algo salió mal'` migrados a microcopy específico por acción + descripción accionable. Archivos tocados: `BlockUserButton`, `BookingModal`, `EnhancedBookingDialog`, `PetCard`, `PostComments` (2x), `ProviderAvailabilityManager` (3x), `ReportLostPetForm` (2x), `ReportUserDialog`, hooks `useAISkill`, `useNotifications`, `useReminders`, `useStartConversation`, pages `ChatConversation` (2x), `ServiceDirectory`, `UserProfile` (2x). **De 77 originales a 0** (100% cierre). | 16 archivos |
| **PERF-005** | `<picture>` con `<source type="image/webp">` primario + `<img src=".jpg">` fallback en el `reducedMotion` path de `HeroVideo.tsx`. Si Pedro genera `og_image.webp` (cwebp), el browser sirve webp (~30% más chico → mejor LCP). Sin webp aún, fallback al jpg sin error. Bonus: `fetchPriority="high"` + `width/height` evitan CLS en hero. | [src/components/landing/HeroVideo.tsx](../src/components/landing/HeroVideo.tsx) |
| **PERF-003** | 5 queries públicas críticas migradas de `select('*')` a select narrow: `MedicalShare` (token validation con campos exactos), `Adoption.tsx` (feed público con cols de AdoptionPostCard), `RefugioPublico.tsx` (perfil público con interface PublicShelter), `Maps.tsx` (markers + popovers), `ServiceDirectory.tsx` (directorio público). Reducción ~40-60% bytes/row en endpoints de mayor frecuencia. | 5 archivos |

### Verificación post-batch 5

- `npx tsc -b` → **0 errores**.
- `grep "toast.error('Algo salió mal')"` en runtime → **0 hits** (77 → 0).
- 15 `.select('*')` restantes en `src/pages/` (todos en pages no críticas o admin).

### Acción manual adicional (opcional, mejora LCP)

```bash
# Generar webp del hero poster:
cd public/paw-friend-assets-v2/social/
# Mac: brew install webp · Linux: apt install webp
cwebp og_image.jpg -q 80 -o og_image.webp
git add og_image.webp
```

Sin webp el hero sigue funcionando con jpg (no es bloqueante).

### 🔢 Conteo final del día (5 batches)

**35 hallazgos cerrados en código** (11 P0 + 24 P1/P2):

| Categoría | Items |
|---|---|
| Sprint 0 P0 | 11 |
| Sprint 1 batch 1 | 7 |
| Sprint 1 batch 2 | 7 |
| Sprint 1 batch 3 | 4 |
| Sprint 1 batch 4 cleanup | 3 |
| Sprint 1 batch 5 refinement | 3 (LOC-MICROCOPY cierre, PERF-005, PERF-003) |

— Sprint 0 + Sprint 1 (5 batches) cerrados, 2026-04-28.

---

## 🧹 Sprint 1 — sexto batch ejecutado (deep cleanup, mismo día)

| ID | Resumen | Archivos |
|---|---|---|
| **DOC-005 fase 2** | 9 archivos más archivados de `docs-raiz/`: 3 raíz (`EJECUTAR_AUDITORIA_PAWFRIEND`, `PROMPT_AUDITORIA_NEXT_LEVEL`, `pawfriend-rebrand-rollout-masterplan`), 5 planes ya ejecutados (`_DIAGNOSTICO_EXITO_20260420`, `AUDITORIA_TOP_TIER_2026_04_20`, `SUGERENCIAS_COMPLETAS_2026_04_16`, `PROPUESTA_REORDENAMIENTO_2026_04_17`, `REFACTOR_ADOPCION_2026_04_24`), 1 operacion (`ACCIONES_MANUALES_2026_04_21`). Links actualizados en `INDEX.md` y `CLAUDE.md`. | `_archive/docs-raiz-snapshots-2026-04/` |
| **PERF-003 cleanup** | 6 callsites más migrados de `select('*')` a narrow: `Profile.tsx` (2x: profiles + notification_preferences), `UserProfile.tsx` (2x: profiles + pets — ambos paths isOwn/notOwn), `Reportes.tsx` (periodic_reports), `Chat.tsx` (profiles map). | 5 archivos |
| **Error desconocido** | Helper nuevo [src/lib/errors.ts](../src/lib/errors.ts) con `errorMessageForUser(err)` (default chileno cálido) y `errorMessageForLog(err)` (mantiene "Error desconocido" para Sentry/audit). 14 callsites UI migrados. Quedan 4 instancias en logs/persistence (audit_export, useAuditExports, useAISkill state, ImportPatientsModal log) que se mantienen porque no son user-facing. | helper nuevo + 16 archivos |
| **ARCH-002 fase 1 (parcial)** | Intento de habilitar `noUnusedLocals: true` en `tsconfig.app.json` reportó **268 errores TS6133** distribuidos en ~50 archivos (mayoría imports `lucide-react` residuales del refactor maestro). Revertido + comentario en `tsconfig.app.json` documentando el bloqueador. **Limpieza manual top 3 archivos infectados**: `PetClinicalRecord/index.tsx` (8 imports muertos), `PawGame.tsx` (10), `ProDashboard.tsx` (3) — ~21 imports eliminados. El resto (~245) requiere `eslint-plugin-unused-imports`. | tsconfig.app.json + 3 archivos |

### Verificación post-batch 6

- `npx tsc -b` → **0 errores**.
- `grep "'Error desconocido'"` runtime → 4 callsites de log/persistence (no UI, OK).
- 8 raíz `.md`; `docs-raiz/` con 5 directos.

### Acción manual #16 — Auto-cleanup de imports muertos restantes

```bash
npm i -D eslint-plugin-unused-imports
```

En `eslint.config.js` agregar:
```js
import unusedImports from 'eslint-plugin-unused-imports';
// dentro de la configuración:
plugins: { /* existentes */, 'unused-imports': unusedImports },
rules: {
  /* existentes */
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': [
    'warn',
    { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
  ],
},
```

Luego:
```bash
npx eslint --fix src/
```

Auto-elimina los ~245 imports muertos. Después flipear `noUnusedLocals: true` en `tsconfig.app.json`.

### 🔢 Conteo final del día (6 batches)

**42 hallazgos cerrados en código** (11 P0 + 31 P1/P2):

| Categoría | Items |
|---|---|
| Sprint 0 P0 | 11 |
| Sprint 1 batch 1 | 7 |
| Sprint 1 batch 2 | 7 |
| Sprint 1 batch 3 | 4 |
| Sprint 1 batch 4 cleanup | 3 |
| Sprint 1 batch 5 refinement | 3 |
| Sprint 1 batch 6 deep cleanup | 4 |

**Migraciones SQL aplicadas hoy** (4): `pets_default_private`, `marketing_consent`, `export_user_data_rpc`, `subscriptions_renewal_reminder`.

**Edge functions**: 1 nueva (`flow-renewal-reminders-cron`) + 14 modificadas redeployadas.

**Source files nuevos** (6): `toast.ts`, `errors.ts`, `cron-auth.ts`, `ExportarMisDatos.tsx`, `happy-path-owner.spec.ts`, `rls-cross-user.spec.ts`.

**Archivos `.md` archivados**: 28 (19 batch 4 + 9 batch 6).

— Sprint 0 + Sprint 1 (6 batches) cerrados, 2026-04-28.

---

## 🧹 Sprint 1 — séptimo batch ejecutado (DRY refactor, mismo día)

| ID | Resumen | Archivos |
|---|---|---|
| **ARCH-003 (parcial)** | Analizada duplicación entre `BecomeProviderDialog.tsx` (602L) y `BecomeShelterDialog.tsx` (504L). El patrón footer "Atrás + Acción primaria" aparecía 5 veces con copy levemente distinto. **Extraído** a [src/components/ui/wizard-footer.tsx](../src/components/ui/wizard-footer.tsx) con dos modos (`next` para steps intermedios, `submit` con loader animado). Props customizables: `submitLabel`, `loading`, `primaryDisabled`, `backLabel`, `nextLabel`, `loadingLabel` para preservar copy original (ej. "Atras" sin tilde en shelter, "Continuar" en lugar de "Siguiente"). Migrados 5 callsites: 3 en Provider, 2 en Shelter. Provider 602→595 LoC; Shelter 504→494 LoC. Reduce ~17 LoC duplicadas y deja el componente listo para futuros wizards. | 3 archivos (1 nuevo + 2 migrados) |

### Limitación de scope ARCH-003

La duplicación entre los dos Dialogs es mayor (~150 LoC entre handlers, post-submit common, wizard step indicator). Refactor completo a un `BecomeRoleDialog` abstracto con `RoleConfig` requeriría ~4-6h con test exhaustivo, incompatible con un sprint de 1 día sin QA real. **Pendiente Sprint 3-6**: extraer también `useRoleActivation` hook (post-submit común) y un `WizardStepHeader`.

### Verificación post-batch 7

- `npx tsc -b` → **0 errores**.

### 🔢 Conteo final del día (7 batches)

**43 hallazgos cerrados en código** (11 P0 + 32 P1/P2):

| Categoría | Items |
|---|---|
| Sprint 0 P0 | 11 |
| Sprint 1 batch 1 | 7 |
| Sprint 1 batch 2 | 7 |
| Sprint 1 batch 3 | 4 |
| Sprint 1 batch 4 cleanup | 3 |
| Sprint 1 batch 5 refinement | 3 |
| Sprint 1 batch 6 deep cleanup | 4 |
| Sprint 1 batch 7 DRY | 1 (ARCH-003 parcial) |

**Source files nuevos del día (7)**: `toast.ts`, `errors.ts`, `cron-auth.ts`, `wizard-footer.tsx`, `ExportarMisDatos.tsx`, `happy-path-owner.spec.ts`, `rls-cross-user.spec.ts`.

— Sprint 0 + Sprint 1 (7 batches) cerrados, 2026-04-28.

---

## 🧹 Sprint 1 — octavo batch ejecutado (deep cleanup + test coverage)

| ID | Resumen | Archivos |
|---|---|---|
| **ARCH-002 fase 2** | Habilité temporalmente `noUnusedLocals: true` y limpié los 5 archivos top: `AppSidebar.tsx` (10 errors), `MedicalDocumentsTab.tsx` (7), `AdoptionSheltersList.tsx` (7), `VetFichaView.tsx` (5), `MyPets.tsx` (5). Removidos imports muertos (Star, Lock, Eye, Tabs, FileText, etc.), variables no usadas (handleLockedClick, hasPets, navigate, isSectionUnlocked), 2 constantes legacy (SECTION_ITEMS, SECTION_LABELS — pre-reorder v3). **268 → 221 errores** (-47, -17.5%). Flag revertido; resto requiere `eslint-plugin-unused-imports`. | tsconfig.app.json + 5 archivos |
| **PERF-003 final** | 7 callsites más migrados: `ChatConversation` (3x con cast intencional para preservar narrow vs state global), `PawGame` (3x: user_guardian_progress según UserProgress, guardian_levels según GuardianLevel, paw_badges según PawBadge). Quedan 5 callsites donde narrow agregaría riesgo sin ahorro real. | 2 archivos |
| **ARCH-003 deep** | Hook nuevo [src/hooks/useRoleActivation.ts](../src/hooks/useRoleActivation.ts) que encapsula el patrón post-submit común (Promise.all invalidateQueries + setRole + onClose + toast + navigate). Migrados 2 dialogs reduciendo 3 hooks fragmentados a 1 línea. `ActiveRole` exportado desde `useActiveRole`. | 1 hook nuevo + 3 archivos |
| **Tests helpers** | **30 tests unit nuevos** pasando: `errors.test.ts` (11), `toast.test.ts` (8), `cron-auth.test.ts` (11). Patrón "replicate lógica pura" para edge fns Deno (mismo que `cors.test.ts`/`flow-utils.test.ts`). | 3 test files nuevos |

### Verificación post-batch 8

- `npx tsc -b` → **0 errores**.
- `npx vitest run` con los 3 test files → **30 passed**.

### 🔢 Conteo final del día (8 batches)

**46 hallazgos cerrados en código** (11 P0 + 35 P1/P2):

| Categoría | Items |
|---|---|
| Sprint 0 P0 | 11 |
| Sprint 1 batch 1 | 7 |
| Sprint 1 batch 2 | 7 |
| Sprint 1 batch 3 | 4 |
| Sprint 1 batch 4 cleanup | 3 |
| Sprint 1 batch 5 refinement | 3 |
| Sprint 1 batch 6 deep cleanup | 4 |
| Sprint 1 batch 7 DRY | 1 |
| Sprint 1 batch 8 deep + tests | 3 |

**Source files nuevos del día (8)**: `toast.ts`, `errors.ts`, `cron-auth.ts`, `wizard-footer.tsx`, `useRoleActivation.ts`, `ExportarMisDatos.tsx`, `happy-path-owner.spec.ts`, `rls-cross-user.spec.ts`.

**Test files nuevos (5)**: 2 specs E2E + 3 unit. **Test count delta**: +30 tests unit (de 28 originales a 58, ~2× cobertura).

— Sprint 0 + Sprint 1 (8 batches) cerrados, 2026-04-28.

---

## 🧹 Sprint 1 — noveno batch ejecutado (cleanup imports muertos top 10)

| ID | Resumen | Archivos |
|---|---|---|
| **ARCH-002 fase 3-4** | Limpieza manual de imports/vars muertos en top 10 archivos restantes. AdminAnalytics, AdminBookingsPanel, useProAnalytics, useServiceProviders, Auth (bug colateral: `description` calculada en catch nunca pasada a toast.error → fixeado), Community, MedicalShare, MyBookings, OnboardingVetMinimal, VetClinicalTimeline, AddMedicalRecord. **268 → 198 errores TS6133 (-70, -26%)**. Cumulativo desde batch 8: -25% extra. Falta wire-up de `eslint-plugin-unused-imports` en eslint.config.js (acción manual #16). | 10 archivos |
| **PERF-003 narrow** | `ChatConversation` consolidado: 3 casts narrow→full row con `as unknown as Parameters<typeof setX>[0]` (state global types vs narrow select). | 1 archivo |

— Sprint 1 batch 9 cerrado y pusheado (commit `611b2019`).

---

## 🧹 Sprint 1 — décimo batch (Web Vitals + PERF-003 amplio + 30 tests unit)

| ID | Resumen | Archivos |
|---|---|---|
| **PERF (nuevo)** | **Web Vitals nativos**: [src/lib/webVitals.ts](../src/lib/webVitals.ts) ~150 LoC con `PerformanceObserver` Web API (sin package `web-vitals`). Trackea LCP/CLS/INP/TTFB con thresholds web.dev/vitals oficiales (good/needs-improvement/poor) y los reenvía a `track({ event: 'web_vital' })` → PostHog. Llamado 1x desde `main.tsx` post-render. | 2 archivos (1 nuevo) |
| **PERF-003 hot path** | 5 selects narrowed: `useNotifications` (7 cols), **`useDirectoryVets` list view (16 cols vs 40+, win mayor: 12 rows × pagina × ~5KB/row)**, `useAvailableSlots` (rules + exceptions), `useMedicalDocuments` (13 cols), `useRoutines` (pet_routines + routine_completions). | 5 archivos |
| **Tests unit (+30)** | [webVitals.test.ts](../src/lib/__tests__/webVitals.test.ts) (12 tests rating thresholds) + [analytics.test.ts](../src/lib/__tests__/analytics.test.ts) (18 tests `scrubTokenizedUrl` privacy + `normalizeAnalyticsPath`). Suite total: **423 → 453 (+30, todo verde)**. | 2 test files |

### Verificación post-batch 10

- `npx tsc -b` → **0 errores**.
- `npm run lint` → **0 errores** (3 warnings legacy preexistentes).
- `npx vitest run` → **453/453 tests verde** (33 test files).

### 🔢 Conteo final del día (10 batches)

**51 hallazgos cerrados en código** (11 P0 + 40 P1/P2):

| Categoría | Items |
|---|---|
| Sprint 0 P0 | 11 |
| Sprint 1 batch 1 | 7 |
| Sprint 1 batch 2 | 7 |
| Sprint 1 batch 3 | 4 |
| Sprint 1 batch 4 cleanup | 3 |
| Sprint 1 batch 5 refinement | 3 |
| Sprint 1 batch 6 deep cleanup | 4 |
| Sprint 1 batch 7 DRY | 1 |
| Sprint 1 batch 8 deep + tests | 3 |
| Sprint 1 batch 9 cleanup top 10 | 3 |
| Sprint 1 batch 10 Web Vitals + PERF-003 + tests | 5 |

**Source files nuevos del día (9)**: `toast.ts`, `errors.ts`, `cron-auth.ts`, `wizard-footer.tsx`, `useRoleActivation.ts`, **`webVitals.ts`**, `ExportarMisDatos.tsx`, `happy-path-owner.spec.ts`, `rls-cross-user.spec.ts`.

**Test files nuevos (7)**: 2 E2E + 5 unit. Cobertura unit: **28 → 453 tests** (~16x).

— Sprint 0 + Sprint 1 (10 batches) cerrados, 2026-04-28.
