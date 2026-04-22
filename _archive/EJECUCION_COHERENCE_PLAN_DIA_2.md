# Ejecución del Plan Maestro de Coherencia — Día 2

> **Fecha**: 2026-04-21
> **Plan origen**: [PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md](./PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md)
> **Día 1**: [EJECUCION_COHERENCE_PLAN_DIA_1.md](./EJECUCION_COHERENCE_PLAN_DIA_1.md) · smoke test verificó migraciones aplicadas.
> **Status**: Día 2 completo (Fases 3+4+5). Plan maestro ejecutado al 100% dentro del scope acordado.
> **Validación**: `npx tsc -b` 0 errores · `npm run lint` 0 errores (7 warnings a11y pre-existentes) · `npm run test:ci` 377/377 verdes · `npm run build` OK (1m 13s).

---

## Cambios aplicados

### Fase 3.1 · Wiring notificaciones

| # | Cambio | Archivo |
|---|---|---|
| 1 | **Helper compartido `_shared/notification-prefs.ts`**: `canReceive()` (RPC `user_can_receive_notification` + fallback `whatsapp_opted_in`), `logAttempt()` (inserción en `notification_attempts` con fail-silent) y `filterUserIdsByPrefs()`. Fail-open: si RPC/logging fallan, no bloquean el envío. | [supabase/functions/_shared/notification-prefs.ts](../../supabase/functions/_shared/notification-prefs.ts) |
| 2 | **`send-push-notification` wrapped**: acepta `category`/`reminder_type`/`booking_type`/`booking_id` en payload. Filtra user_ids con prefs antes de enviar. Registra en `notification_attempts` (sent/skipped/failed). Loggea cada skip con motivo (`opted_out_by_prefs`, `no_device_tokens`). | [supabase/functions/send-push-notification/index.ts](../../supabase/functions/send-push-notification/index.ts) |
| 3 | **`send-whatsapp-reminder` wrapped**: usa `canReceive('pet_reminders','whatsapp')` como gate único. Registra en `notification_attempts` (canal `whatsapp`) además del `whatsapp_message_log` legacy. | [supabase/functions/send-whatsapp-reminder/index.ts](../../supabase/functions/send-whatsapp-reminder/index.ts) |

### Fase 3.2 · RPCs partner ads

| # | Resultado |
|---|---|
| 4 | **Cancelada**. Las RPCs `increment_partner_impressions()` e `increment_partner_clicks()` YA existen desde la migración inicial [20251204000002_add_partners_ads.sql:50-69](../../supabase/migrations/20251204000002_add_partners_ads.sql#L50). El hallazgo del audit original era incorrecto. [PartnerAd.tsx:59,75](../../src/components/PartnerAd.tsx#L59) funciona sin cambios. |

### Fase 4 · Optimistic updates booking

| # | Cambio | Archivo |
|---|---|---|
| 5 | **Helpers internos** en el hook: `snapshotBookingQueries()`, `rollbackBookingQueries()`, `optimisticPatchBooking()`, `invalidateBookingQueries()`. Manejan arrays y shape `{pages:[]}` de `useInfiniteQuery`. Claves cubiertas: `['my-bookings']`, `['provider-inbox']`, `['booking-detail']`. | [src/hooks/useBookingMutations.ts](../../src/hooks/useBookingMutations.ts) |
| 6 | **6 mutations con optimistic updates**: `useCancelBooking`, `useRescheduleBooking`, `useConfirmBooking`, `useMarkCompleted`, `useMarkNoShow`, `useStartBooking`. Cada una: `onMutate` snapshot + patch optimista (status/fechas) → `onError` rollback + Sentry → `onSettled` invalidate. UX: lag de 500ms-2s pasa a cambio visual instantáneo. | Mismo archivo |

### Fase 5 · Tab Prevenciones

| # | Cambio | Archivo |
|---|---|---|
| 7 | **Tab "Prevenciones"** añadido a `UnifiedCalendar` (5 tabs ahora, grid-cols-5). Muestra solo reminders cuya `category ∈ {vaccine, deworming, flea}` — la taxonomía canónica definida en Día 1. Deep link `?tab=prevenciones`. Icon `Syringe`. | [src/pages/UnifiedCalendar.tsx](../../src/pages/UnifiedCalendar.tsx) |

---

## Pendientes manuales de Pedro

**No hay SQL nuevo aplicar**. Solo re-deploy de 2 edge functions modificadas:

1. Re-deploy [send-push-notification](../../supabase/functions/send-push-notification/index.ts):
   ```
   npx supabase functions deploy send-push-notification
   ```
2. Re-deploy [send-whatsapp-reminder](../../supabase/functions/send-whatsapp-reminder/index.ts):
   ```
   npx supabase functions deploy send-whatsapp-reminder
   ```

(Si aún no se hizo el deploy inicial del Día 1 de las 9 edge fns huérfanas — ver [EJECUCION_COHERENCE_PLAN_DIA_1.md](./EJECUCION_COHERENCE_PLAN_DIA_1.md) — hacerlo ahora junto con estas 2.)

---

## Métricas consolidadas (Día 1 + Día 2)

| Métrica | Día 1 | Día 2 | Total |
|---|---|---|---|
| Archivos modificados | ~15 | ~6 | ~21 |
| Migraciones nuevas | 3 | 0 | 3 |
| Edge fns nuevas/modificadas | 0 | 2 (modif) + 1 shared | 2 mod + 9 registradas + 1 shared |
| Componentes nuevos | 2 | 0 | 2 |
| Hooks nuevos | 1 | 0 | 1 |
| Libs nuevos | 1 | 0 | 1 |
| Tests | 377 ✅ | 377 ✅ | 377 ✅ |
| Build | 1m 9s | 1m 13s | OK |

---

## Qué queda del plan maestro

Del plan original de 6 fases (24-35 días-dev), se ejecutaron **Fases 0-5** en 2 días-dev calendario (con asistencia IA). Queda la **Fase 6 de hardening y cleanup**:

- E2E Playwright específicos (adoption-flow, preventive-care-flow, calendar-tabs).
- Reorganización de `src/` a `src/features/` (booking, preventive-care, calendar, applications).
- Revisión Q3: evaluar reactivar `FEED` en [featureFlags.ts:84](../../src/lib/featureFlags.ts#L84) si engagement de Grupos lo justifica.
- Encender `BOOKING_V3_WIZARD`, `PROVIDER_AGENDA_CALENDAR`, `PROVIDER_PUSH`, `ICS_EXPORT` con smoke tests 1-a-1.

Esos items no son hotfix; son maduración del producto post-plan.

---

## Smoke test SQL Día 2

Ver [SMOKE_TEST_COHERENCE_DIA_2.sql](./SMOKE_TEST_COHERENCE_DIA_2.sql) para validar el wiring de notifs una vez re-deployadas las edge fns.
