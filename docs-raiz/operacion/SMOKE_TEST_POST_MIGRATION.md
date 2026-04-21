# Smoke test post-migración

> **Prevención #1** (sesión 2026-04-21, post-incidente `deworming` CHECK).
> Ejercita triggers/constraints críticos ANTES de que lo haga un usuario real.

## Cuándo correrlo

- Después de aplicar **cualquier migración SQL** nueva en Supabase.
- Antes de anunciar features nuevas que dependan de triggers.
- Si un usuario reporta error 400/500 al crear recursos (pets, bookings, etc.).

## Cómo correrlo

1. Abrir **Supabase Dashboard → SQL Editor**.
2. Pegar el contenido completo de [`scripts/smoke-post-migration.sql`](../../scripts/smoke-post-migration.sql).
3. Click **Run**.

## Qué esperás ver

### ✅ Caso OK

Al final de los logs:

```
NOTICE:  OK #1 perro adulto: 22 reminders (4 deworming, 4 antiparasitic)
NOTICE:  OK #2 gato cachorro: 18 reminders
NOTICE:  OK #3 pet sin birth_date: INSERT pasa (trigger vacuna skipea)
NOTICE:  OK #4 species=otro con birth_date: INSERT pasa
NOTICE:  OK #5 pet_co_owners INSERT: trigger notify_co_owner_on_invite no rompe
NOTICE:  OK #6 payment_events INSERT pasa
NOTICE:  OK #7 check_and_increment_ip_quota RPC ejecuta sin error
NOTICE:  OK #8 user_can_receive_notification RPC ejecuta sin error
NOTICE:
NOTICE:  ══════════════════════════════════════════════
NOTICE:    TODOS LOS SMOKE TESTS PASARON (8/8)
NOTICE:  ══════════════════════════════════════════════
```

Y la tabla final con `residuo_pets=0, residuo_reminders=0, ...` confirma que ROLLBACK limpió todo.

### ❌ Caso falló

Un test falla y ves un error tipo:

```
ERROR: SMOKE FAIL #1: no se crearon reminders type=deworming (CHECK constraint roto?)
CONTEXT: PL/pgSQL function inline_code_block line XX at RAISE
```

- El `#1` te indica qué test falló.
- El mensaje entre comillas da la causa.
- El ROLLBACK se dispara automáticamente: **cero residuos**.

Si ves otro tipo de error de Postgres (no `SMOKE FAIL:`), entonces **un trigger real falló** — copiá ese error y ese es exactamente el mismo 400 que verá un usuario.

## Qué cubre

| Test | Ejercita |
|---|---|
| #1 | Trigger `generate_full_vaccine_schedule` con perro adulto + CHECK `pet_reminders.type` (los 8 valores) |
| #2 | Mismo trigger con gato cachorro (serie inicial + refuerzos) |
| #3 | Trigger `WHEN` clause: pet sin birth_date no lo dispara pero INSERT base pasa |
| #4 | `species='otro'` con birth_date: WHEN falso, INSERT pasa con `paw_card_id` + `holo_pattern` (NOT NULL) |
| #5 | Trigger `notify_co_owner_on_invite` (mig 20260721) sin romper pet_co_owners INSERT |
| #6 | Tabla `payment_events` (P0-2) acepta INSERT |
| #7 | RPC `check_and_increment_ip_quota` (P0-3) ejecuta |
| #8 | RPC `user_can_receive_notification` (D.4) ejecuta |

## Qué NO cubre

- RLS (el script corre como `postgres`, saltea policies)
- Edge functions (son Deno, se testean con `npx supabase functions serve` aparte)
- Flow.cl integración (requiere checkout real)
- Notificaciones push (requiere device tokens reales)

Para cobertura completa, combinar con:
- [E2E_COVERAGE.md](E2E_COVERAGE.md) — smoke Playwright
- [06-SMOKE_TEST_LAUNCH.md](../../_pending/auditoria-e2e/06-SMOKE_TEST_LAUNCH.md) — checklist manual

## Cómo extender

Cuando agregues una migración SQL que toca triggers / constraints,
**agregá un test** al smoke. Formato:

```sql
-- Test N: descripcion de lo que cubre
INSERT INTO <tabla_destino> (...) VALUES (...);
-- Verificacion opcional con IF ... RAISE EXCEPTION
RAISE NOTICE 'OK #N ...';
```

Todos los tests corren dentro del mismo `BEGIN/ROLLBACK` — cero side effects.

## Historia de incidentes que este test hubiera atrapado

| Fecha | Incidente | Qué test lo atrapa |
|---|---|---|
| 2026-04-21 | `pet_reminders.type` CHECK sin `'deworming'` | Test #1 (cuenta deworming count > 0) |

Cada vez que un bug llega a prod, agregar el test aquí + extender el smoke. Antiregression 1:1.
