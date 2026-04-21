# Acciones manuales — sesión 2026-04-20 → 2026-04-21

> Lista consolidada de TODO lo que Pedro tiene que ejecutar para
> activar en producción lo commiteado en esta sesión.
>
> Orden importa: SQL primero, después edge fns, después smoke test.

---

## 1. Aplicar migraciones SQL (Supabase Dashboard → SQL Editor)

Correr en este orden. Todas idempotentes (re-ejecutar es seguro).

| # | Archivo | Qué crea |
|---|---|---|
| 1 | `supabase/migrations/20260713000000_payment_events_idempotency.sql` | Tabla `payment_events` + policy admin (ya aplicada 2026-04-20) |
| 2 | `supabase/migrations/20260713000001_log_error_rate_limit.sql` | `ip_request_quota` + RPC `check_and_increment_ip_quota` |
| 3 | `supabase/migrations/20260714000000_onboarding_completed_at.sql` | Columna `profiles.onboarding_completed_at` + backfill |
| 4 | `supabase/migrations/20260530000000_fix_pet_co_owners_rls_recursion.sql` | Helper `pets_with_co_ownership` + policy `co_owner_reads_own` sin recursión |
| 5 | `supabase/migrations/20260715000000_pet_co_owners_defensive_policies.sql` | Helper `user_owns_pet` + policy `owner_manages_co_owners` defensiva |
| 6 | `supabase/migrations/20260721000000_co_owner_invitation_notification.sql` | Trigger `trg_notify_co_owner_on_invite` → noti in-app al invitado con cuenta |
| 7 | `supabase/migrations/20260722000000_daily_digest_cron.sql` | Cron diario 8 AM Chile → `generate-daily-digest` |
| 8 | `supabase/migrations/20260723000000_user_notification_prefs.sql` | Tabla `user_notification_prefs` + RPC `user_can_receive_notification` |

### Verificación rápida post-apply

```sql
SELECT
  exists(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payment_events') AS payment_events,
  exists(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ip_request_quota') AS ip_request_quota,
  exists(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_notification_prefs') AS user_notification_prefs,
  exists(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed_at') AS onboarding_col,
  exists(SELECT 1 FROM pg_proc WHERE proname='pets_with_co_ownership') AS fix_pet_co_owners_recursion,
  exists(SELECT 1 FROM pg_proc WHERE proname='user_owns_pet') AS user_owns_pet_fn,
  exists(SELECT 1 FROM pg_proc WHERE proname='user_can_receive_notification') AS notif_prefs_rpc,
  exists(SELECT 1 FROM pg_trigger WHERE tgname='trg_notify_co_owner_on_invite') AS co_owner_trigger,
  exists(SELECT 1 FROM cron.job WHERE jobname='daily-digest') AS daily_digest_cron;
```

Todas las columnas deben devolver `true`.

---

## 2. Pre-requisito para los crons

Si nunca seteaste el JWT service role en la DB, correr UNA vez:

```sql
ALTER DATABASE postgres SET app.settings.service_role_key = '<JWT_service_role_desde_Settings_API>';
```

Si ya está (porque los crons `weekly-owner-reports` funcionan), saltate este paso.

---

## 3. Deploy de edge functions

```powershell
# Las 3 edge fns nuevas de esta sesión
npx supabase functions deploy send-co-owner-invitation
npx supabase functions deploy generate-daily-digest

# Las 2 modificadas (idempotente si las deployaste ya)
npx supabase functions deploy flow-webhook
npx supabase functions deploy log-error

# Nota: config.toml cambió. Para que el gateway recargue los flags
# verify_jwt, cualquier deploy dispara el refresh global.
```

Si preferís re-deployar todas en bloque (más lento pero más seguro), usá el script:

```powershell
.\scripts\redeploy-rollback.ps1
```

---

## 4. Smoke test mínimo (5 min)

Después de todo lo de arriba:

1. **Auth + crear mascota**:
   - Login (user existente o crear uno nuevo)
   - `/add-pet` → formulario carga sin errores en consola
   - Crear mascota de prueba sin marcar el switch "compartir" — debería aparecer el reveal de Paw Card + navegar a `/my-pets`

2. **Invitación co-owner (email sin cuenta)**:
   - `/add-pet` otra vez → marcar switch "compartir con otra persona"
   - Ingresar email inventado (ej `test-sin-cuenta@nomail.cl`), rol co-dueño
   - Al submit, abre `InviteCoOwnerLinkDialog` con link copiable
   - Verificar que llegó email a ese address (si Resend alcanza)

3. **Invitación co-owner (email con cuenta)**:
   - Crear segunda cuenta de prueba en otro browser
   - Desde la primera, crear mascota con switch + email de la segunda
   - En la segunda: `🔔` debe tener badge. Click → dialog "X te invitó... Aceptar / Rechazar"
   - Aceptar → toast OK → navega a la ficha

4. **Daily digest** (si es después de las 11 UTC = 8 AM Chile):
   - Crear un reminder que vence hoy
   - Esperar al cron (o forzar manual con el snippet de la migración)
   - Revisar que apareció noti tipo `daily_digest` en el 🔔

5. **Prefs notifs**:
   - `/profile` → abrir drawer "Notificaciones"
   - Toggles granulares (7 categorías, 3 canales) guardan sin error
   - Recargar → persisten

6. **Admin widget pagos fallidos**:
   - `/admin?section=finance` → card "Pagos con problemas" carga sin error RLS
   - Si no hay fallos, debe decir "Sin pagos fallidos en los últimos 7 días"

7. **Auditoría e2e (opcional)**:
   ```powershell
   npm run smoke
   ```

---

## 5. Pendientes operacionales no-código

### Deep Links universales (D.3)

Ver [DEEP_LINKS_SETUP.md](DEEP_LINKS_SETUP.md):
- Reemplazar `__TEAM_ID__` en `public/.well-known/apple-app-site-association`
- Crear `ios/App/App/App.entitlements` con Associated Domains

### Rotación de secrets (A.6)

Ver [ROTACION_SECRETS.md](ROTACION_SECRETS.md). Calendario Q1-Q4 + procedimiento por secreto.

### Activar flag `SHELTER_DONATIONS` post cuenta Flow SpA

Ya está en `true` según `src/lib/featureFlags.ts:107`. Validar cuando migres Flow a SpA.

---

## 6. Commits de esta sesión (referencia)

```
eae97dde feat(co-owner): email automatico de invitacion via Resend
af443664 feat(co-owner): dialog accept/reject + seccion compartir en ficha
57df1564 refactor(admin): E.3 AdminLeadsCRM 1.231 -> 987L
2be29b51 feat(pitch): publicar deck inmersivo v2 en /pitch/investors-live.html
8d5d9c11 feat(engagement+e2e): daily digest cron + I.5 smoke shelter/admin/gate
8286fdf7 feat(notifications): D.4 prefs granulares por categoria + canal
```

Más el de cleanup que cierra esta sesión.

---

## 7. Features diferidas (registradas para futura sesión)

Las siguientes requieren 2-3 días c/u y tocan componentes críticos.
Preferí dejarlas como work stream aislado antes que abrir tantos frentes
al mismo tiempo:

| # | Épica | Por qué se difirió |
|---|---|---|
| G.3 | Paw Companys selfservice con pago Flow | Requiere extender `flow-webhook` (componente crítico; cualquier bug = doble cobro) |
| D.5 | Offline-first ficha clínica | 3 días reales (service worker + sync Supabase + UI indicador) |
| E.4 | Refactor AddPet.tsx (1.300L+) | 3 días para wizard declarativo sin romper el flow que se acaba de cambiar |

Para cada una, recomiendo abrir una sesión dedicada con tiempo + smoke test
en vivo post-cambio.

---

## 8. Features que ya quedaron listas

Lista completa de entregables en main tras esta sesión (referencia de
qué probar exhaustivamente antes del lanzamiento 1-jun):

- ✅ Seguridad P0: verify_jwt gates + payment_events idempotencia + log-error rate limit persistente
- ✅ B.1 Onboarding gate post-signup (owner puro sin onboarding → `/onboarding-mascota`)
- ✅ Co-owner completo: invite desde `/add-pet` + email automático + noti in-app + dialog accept/reject + gestión en ficha
- ✅ Daily digest cron (noti in-app, fase 1)
- ✅ Preferencias granulares de notifs (7 categorías × 3 canales) en Settings
- ✅ E.1, E.2, E.3 refactor admin (AdminSalaInversion -648L, AdminSystemHealth -479L, AdminLeadsCRM -244L)
- ✅ Dark mode real + ThemeToggle en Header
- ✅ EmptyState variants loading/error
- ✅ Deep links universales (AASA + assetlinks, pendiente Team ID)
- ✅ ATT iOS (hook en AppLayout)
- ✅ Safe-area completo + haptics taxonómicos
- ✅ ErrorBoundary por ruta (key=pathname)
- ✅ queryConfig.ts centralizado
- ✅ Lazy-load por tab en PetClinicalRecord
- ✅ Vet upsell en perfil público (si es dueño y free)
- ✅ Badge Paw Member + contador donaciones en Home
- ✅ Sentry performance budget (browserTracing + INP)
- ✅ Widget admin pagos fallidos
- ✅ E2E smoke tests ampliados (shelter, admin, gate B.1)
- ✅ Docs: ROTACION_SECRETS, DEEP_LINKS_SETUP, WEEKLY_REPORTS_CRON, E2E_COVERAGE
- ✅ Pitch inmersivo v2 live en https://pawfriend.cl/pitch/investors-live.html
