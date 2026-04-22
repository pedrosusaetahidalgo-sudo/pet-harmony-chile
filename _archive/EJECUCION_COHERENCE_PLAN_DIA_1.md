# Ejecución del Plan Maestro de Coherencia — Día 1

> **Fecha**: 2026-04-21
> **Plan origen**: [PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md](./PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md)
> **Status**: Día 1 completo (Fase 0 + Fase 1 + parte de Fase 2). Día 2 pendiente para finalizar wiring de notificaciones, optimistic updates y tab Prevenciones.
> **Validación**: `npx tsc -b` 0 errores · `npm run lint` 0 errores (7 warnings a11y pre-existentes) · `npm run test:ci` 377/377 verdes · `npm run build` OK (1m 9s).

---

## Cambios aplicados

### Fase 0 · Hotfixes P0

| # | Cambio | Archivo |
|---|---|---|
| 1 | **Fix bug adopciones**: `queryClient.invalidateQueries(['adoption-posts'])` + auto-switch a tab `my-posts` tras crear. Antes `refetch()` era no-op en tab `shelters`. | [src/pages/Adoption.tsx](../../src/pages/Adoption.tsx) |
| 2 | **Defensa en profundidad**: `CreateAdoptionPost` ahora también invalida. | [src/components/CreateAdoptionPost.tsx](../../src/components/CreateAdoptionPost.tsx) |
| 3 | **Fix trigger `notify_adoption_interest`**: remueve JOIN inválido a `pets` (columna inexistente); usa `adoption_posts.pet_name` directo. | [supabase/migrations/20260521000030_fix_notify_adoption_interest_trigger.sql](../../supabase/migrations/20260521000030_fix_notify_adoption_interest_trigger.sql) |
| 4 | **Registrar 9 edge fns huérfanas en `config.toml`**: `send-push-notification` (crítica para push), `send-inactive-user-reminder`, `send-monthly-vet-stats`, `send-new-pet-drip`, `send-pet-birthday-greeting`, `send-shelter-welcome`, `backup-weekly-snapshot`, `geocode-address`, `notify-vet-share`. Sin esto, triggers/crons que las invocaban por `pg_net` fallaban silenciosamente. | [supabase/config.toml](../../supabase/config.toml) |
| 5 | **Nuevo componente `NewBadge`** (variantes `pilot`/`community`/`impact`) — reemplaza `PawLabsBanner` fuera de gamificación. | [src/components/NewBadge.tsx](../../src/components/NewBadge.tsx) |
| 6 | **Retirar `PawLabsBanner`** de Adopción/Community/BloodDonors, reemplazando con `<NewBadge variant="impact|community" />`. Política: `PawLabsBanner` queda solo para superficies ludicas (`PawGame`/`Missions`/`PawCollection`). | [src/pages/Adoption.tsx:99](../../src/pages/Adoption.tsx#L99), [src/pages/Community.tsx](../../src/pages/Community.tsx), [src/pages/BloodDonors.tsx](../../src/pages/BloodDonors.tsx) |

### Fase 1 · Coherencia navegación

| # | Cambio | Archivo |
|---|---|---|
| 7 | **Sidebar core 6→5 items**: elimina duplicación `Calendario`/`Mis reservas`/`Recordatorios` (los 3 apuntaban a `/calendario?tab=X`). Ahora: `Inicio`, `Mis Mascotas`, `Agenda`, `Buscar vet`, `Servicios`. | [src/components/AppSidebar.tsx:66-73](../../src/components/AppSidebar.tsx#L66-L73) |
| 8 | **Subgrupo "Día a día"** (abierto por default) absorbe las list views: `Mis reservas`, `Recordatorios`, `Rutinas`, `Reportes`. | [src/components/AppSidebar.tsx](../../src/components/AppSidebar.tsx) |
| 9 | **Renombre "Social" → "Comunidad"** y mueve "Grupos" como primer ítem del subgrupo. Elimina la redundancia semántica "Social > Grupos". | [src/components/AppSidebar.tsx](../../src/components/AppSidebar.tsx) |
| 10 | **`BottomTabBar.matchPaths`**: tab `Agenda` sigue matcheando list views (`/reminders`, `/rutinas`, `/mis-reservas`) para backwards compat; removimos `/calendar` (ya redirigía). | [src/components/BottomTabBar.tsx:94-99](../../src/components/BottomTabBar.tsx#L94-L99) |
| 11 | **Redirect `/calendar`** ahora apunta a `/calendario?tab=hoy` (antes iba a `/mis-reservas`, confuso). | [src/App.tsx:869](../../src/App.tsx#L869) |

### Fase 2 · Preventive care parcial

| # | Cambio | Archivo |
|---|---|---|
| 12 | **`src/lib/frequencies.ts`** — fuente única de frecuencias clínicas (`nextAntiparasiticDate`, `nextVaccineDate`, `antiparasiticRecurrence`, `reminderTypeForAntiparasitic`). Alinea FE con trigger SQL. | [src/lib/frequencies.ts](../../src/lib/frequencies.ts) |
| 13 | **`reminderTypes.ts` enriquecido** con `normalizeReminderType()` (mapea legacy `antiparasitic`→`deworming`, `appointment`→`checkup`) y `labelForReminderType()`. | [src/lib/reminderTypes.ts](../../src/lib/reminderTypes.ts) |
| 14 | **Migración `20260521000040_unify_reminder_types_canonical.sql`**: back-fill `'antiparasitic'` → `'deworming'/'flea'` según título; nuevo CHECK con 12 tipos canónicos (agrega `flea`, `dental`, `food`, `insurance`, `license`); redefine `create_vaccine_reminder()` para insertar con taxonomía canónica; deduplica reminders redundantes. | [supabase/migrations/20260521000040_unify_reminder_types_canonical.sql](../../supabase/migrations/20260521000040_unify_reminder_types_canonical.sql) |
| 15 | **Remover insert manual** de `pet_reminders` en `AddMedicalRecord.tsx:274-319`. Ahora lo hace sólo el trigger SQL (una fuente, una verdad). | [src/components/AddMedicalRecord.tsx](../../src/components/AddMedicalRecord.tsx) |
| 16 | **Migración `20260521000050_auto_reminder_on_booking_confirm.sql`**: nuevo trigger `trigger_booking_reminder_on_confirm` crea `pet_reminder` (`type='checkup'`) 24h antes de cita confirmada. Idempotente con `ON CONFLICT DO NOTHING`. | [supabase/migrations/20260521000050_auto_reminder_on_booking_confirm.sql](../../supabase/migrations/20260521000050_auto_reminder_on_booking_confirm.sql) |

### Fase 2.1 · Vista "Mis aplicaciones"

| # | Cambio | Archivo |
|---|---|---|
| 17 | **Hook `useMyApplications`** — agrega `paw_voices` (por `user_id` + `contact_email`), `paw_companys` (por `contact_email`) y `pitch_applications` (RLS `pitch_apps_self_read` ya permite). Devuelve estructura unificada con status normalizado. | [src/hooks/useMyApplications.ts](../../src/hooks/useMyApplications.ts) |
| 18 | **Componente `MyApplicationsSection`** — card embebible que lista postulaciones con badge de status tonificado y link a página pública del tipo. Se auto-esconde si no hay postulaciones. | [src/components/MyApplicationsSection.tsx](../../src/components/MyApplicationsSection.tsx) |
| 19 | **Integración en `/profile`** bajo el banner "Ofrecer servicios". | [src/pages/Profile.tsx](../../src/pages/Profile.tsx) |

---

## Pendientes manuales de Pedro

Estas 3 migraciones SQL son nuevas y requieren aplicación manual desde Supabase Dashboard > SQL Editor (regla 9.2 CLAUDE.md):

1. `supabase/migrations/20260521000030_fix_notify_adoption_interest_trigger.sql` — fix JOIN del trigger adoption_interests.
2. `supabase/migrations/20260521000040_unify_reminder_types_canonical.sql` — unifica taxonomía + back-fill + trigger v2. **Aplicar antes del próximo release** para alinear DB con el frontend que ya no hace insert manual.
3. `supabase/migrations/20260521000050_auto_reminder_on_booking_confirm.sql` — trigger owner reminder 24h antes de cita.

Y deploys:

4. **Deploy de 9 edge functions huérfanas recién registradas** en `config.toml` (especialmente `send-push-notification`). Sin deploy, los triggers `push_provider_on_new_booking` y `notify_booking_status_change` seguirán fallando silenciosamente vía `pg_net`.
   ```
   npx supabase functions deploy send-push-notification
   npx supabase functions deploy send-shelter-welcome
   npx supabase functions deploy send-inactive-user-reminder
   npx supabase functions deploy send-monthly-vet-stats
   npx supabase functions deploy send-new-pet-drip
   npx supabase functions deploy send-pet-birthday-greeting
   npx supabase functions deploy backup-weekly-snapshot
   npx supabase functions deploy geocode-address
   npx supabase functions deploy notify-vet-share
   ```

---

## Métricas

| Métrica | Valor |
|---|---|
| Archivos modificados | ~15 |
| Migraciones nuevas | 3 (fix trigger adoptions, unify reminder types, booking reminder) |
| Edge fns registradas | +9 en config.toml |
| Componentes nuevos | 2 (`NewBadge`, `MyApplicationsSection`) |
| Hooks nuevos | 1 (`useMyApplications`) |
| Libs nuevos | 1 (`frequencies.ts`) |
| `tsc -b` | 0 errores ✅ |
| `npm run lint` | 0 errores (7 warnings a11y pre-existentes) ✅ |
| `npm run test:ci` | 377/377 tests verdes ✅ |
| `npm run build` | OK en 1m 9s ✅ |

---

## Día 2 — qué sigue

### Fase 3 · Wiring notificaciones (alta prioridad)

- Integrar `user_can_receive_notification()` dentro de cada edge fn de notificaciones (`send-push-notification`, `send-whatsapp-reminder`, `send-pet-invitation`, `send-donation-thanks`).
- Insertar en `notification_attempts` por cada envío con clave de dedupe `(owner_id, type, target_id, channel)`.
- Smoke test `PROVIDER_PUSH=true` con 1 provider antes de rollout gradual.

### Fase 4 · Booking V3 — quick wins

- Optimistic updates en `useCreateBooking`, `useCancelBooking`, `useRescheduleBooking` (evita lag 500ms-2s en mobile).
- RPCs faltantes `increment_partner_impressions`/`_clicks` (llamados por `PartnerAd.tsx:59,75`).

### Fase 5 · Tab "Prevenciones" en `/calendario`

- Agregar `activeTab='prevenciones'` a `UnifiedCalendar`.
- Filter para próximos vacuna/antiparasitario ≤60 días (timeline visual).

### Fase 6 · Testing + hardening

- E2E Playwright: crear adopción en tab "Refugios" → switch a "Mis publicaciones" → aparece.
- E2E Playwright: crear vacuna en ficha → aparece en `/reminders` con label canónica.
- Activar `ICS_EXPORT=true` + implementar util.
