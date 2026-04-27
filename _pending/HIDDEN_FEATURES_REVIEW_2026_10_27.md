# Hidden features review — 2026-10-27

> **Origen**: Refactor Maestro §1.4 — política "esconder, no eliminar" requiere
> revisión a +6 meses. Este documento lista features detrás de feature flag con
> fecha de creación y criterio de decisión.
>
> **Próxima revisión programada**: 2026-10-27 (1° lunes hábil del mes).
> **Owner de la decisión**: Pedro.
> **Output**: por cada feature, decisión final = mantener / reactivar / eliminar.

---

## Política

Cada feature con `flag=false` desde hace ≥6 meses debe pasar por estos checks:

1. ¿Hay 0 usuarios pidiendo el feature? → **eliminar**
2. ¿Hay 0 código que la referencia? (grep en repo) → **eliminar**
3. ¿Hay tablas DB con datos asociados pero ningún acceso reciente? → **mantener tablas, eliminar código UI**
4. ¿Las cosas cambiaron y la feature ahora encaja con la trinidad? → **reactivar**

---

## Features con flag false (a revisar 2026-10-27)

### 🟢 Probablemente eliminar (no encajan trinidad, sin tracción)

| Flag | Activa desde | Razón inicial | Estado código | Decisión sugerida |
|---|---|---|---|---|
| `MARKETPLACE` | 2026-04-19 | Fuera de scope médico | Código hidden, tablas con datos | **Eliminar UI + mantener tablas 1 año más** |
| `SHARED_WALKS` | 2026-04-19 | No alineado foco médico | Hidden | **Eliminar UI** |
| `LOST_PETS_SECTION` | 2026-04-19 | Integrado a mapa/feed | Hidden, integración pendiente | **Eliminar después de migrar a /nose-scan** |
| `MAP_PET_FRIENDLY` | 2026-04-19 | Datos hardcodeados | Hidden | **Eliminar** o reactivar con DB real |
| `FEED` | 2026-04-19 | No conecta con ficha | Hidden completo | **Eliminar UI + tablas a `_deprecated`** |
| `CHAT` | 2026-04-19 | Incompleto | Hidden | **Eliminar UI + tablas a `_deprecated`** |

### 🟡 Esperar más tiempo (algún uso o partner pendiente)

| Flag | Activa desde | Razón inicial | Estado | Decisión sugerida |
|---|---|---|---|---|
| `PAWGAME_PROMINENT` | 2026-04-23 | Mover a sidebar colapsado | OK, accesible | **Mantener `false`** |
| `BOOKING_V3_WIZARD` | 2026-04-21 | Reemplazo BookingFlow | Code stub | Reevaluar Q1 2027 |
| `PROVIDER_AGENDA_CALENDAR` | 2026-04-21 | Componente no listo | Stub | Reevaluar 2027 |
| `PROVIDER_PUSH` | 2026-04-21 | Infra existe, falta encender | Listo, pendiente smoke test | **Reactivar después de smoke test 1 vet** |
| `ICS_EXPORT` | 2026-04-21 | Util pero no crítico | Sin implementar | Mantener `false` Y2 |

### 🟠 Mantener (esperando partners — no decidir hasta deal firmado)

| Flag | Activa desde | Razón | Estado |
|---|---|---|---|
| `EMBEDDED_INSURANCE` | 2026-04-27 | Esperando iki/Mapfre/Sura | Scaffolding listo |
| `PHARMA_INSIGHTS_API` | 2026-04-27 | Esperando deal Pharma | Scaffolding listo |
| `RETAIL_FULFILLMENT` | 2026-04-27 | Esperando Mathiesen/Kiwoko | Scaffolding listo |
| `B2B_API` | 2026-04-27 | Edge fn live, sin clientes | Listo |
| `PARTNER_DISCOUNTS` | 2026-04-27 | Esperando partner retail | Edge fn lista |
| `PARTNER_SCANNER_API` | 2026-04-27 | Hardware partner | Plan §2.8.2 (Y2) |
| `PARTNER_AUTO_TIMELINE` | 2026-04-27 | Depende scanner | Y2 |
| `PASSIVE_DETECTION_GPS` | 2026-04-27 | Mobile permisos | Y2 |
| `WALK_GPS_TRACKING` | 2026-04-27 | Permisos background | Y2 |
| `CASCADE_AI_SUGGESTIONS` | 2026-04-27 | Requiere LLM + volumen data | Y2 |
| `AI_PATTERN_DETECTION` | 2026-04-27 | Requiere 1k+ users con 30+d | Y2 |
| `LATAM_*` (MX, AR, CO, PE) | 2026-04-27 | Decisión estratégica | Y3+ |
| `DONATIONS_MONTHLY` | 2026-04-19 | SpA + cuenta Flow | Pendiente Pedro |

### 🔵 Activas — verificar tracción

Flags activas (`true`) hoy. En 6 meses, si tracción <5% MAU, evaluar:

| Flag | Activa | Tracción esperada |
|---|---|---|
| `PAWGAME_SIDEBAR` | true | Si <5% MAU usa /paw-game o /misiones, considerar mover a "Más" |
| `LABS_ADOPTION` | true | Si refugios <10 activos, considerar feature flag |
| `LABS_BLOOD_DONORS` | true | Si <50 donadores registrados, esconder |
| `LABS_COMMUNITY` | true | Sin grupos de comunidad creados → considerar esconder |
| `PRO_ANALYTICS` | true (gated isProvider/isAdmin) | Plan dice "esconder Pedro-only" — gate ya aplicado, mantener |

---

## Decisiones tomadas en revisiones anteriores

(Vacío al 2026-04-27. Llenar tras cada revisión mensual.)

---

## Acciones de limpieza derivadas

### Renames de tablas huérfanas — aplicado 2026-04-27

Mig `20260903900000_rename_orphan_tables.sql` renombró 4 tablas detectadas en §9.0.bis:

- `comprehensive_medical_records` → `_deprecated_20260427`
- `vet_pet_relationships` → `_deprecated_20260427`
- `points_history` → `_deprecated_20260427`
- `virtual_routes` → `_deprecated_20260427`

**Próximo check (2026-10-27)**: si ningún build/test rompe en 6 meses, drop definitivo.

### Tablas "buckets D + E" del §9.0.bis — pendiente

Auditar tablas de gamificación con tracción real:

```sql
-- Run en SQL Editor:
SELECT
  schemaname, relname AS tabla, n_live_tup AS filas,
  last_autovacuum, last_analyze
FROM pg_stat_user_tables
WHERE schemaname='public'
  AND relname IN (
    'achievements', 'activities', 'daily_challenges', 'guardian_levels',
    'missions', 'paw_badges', 'paw_card_collections', 'paw_game_monthly_rankings',
    'paw_missions', 'paw_shop_rewards', 'pet_activities', 'pet_activity_cheers',
    'pet_paw_progress', 'rewards', 'user_achievements', 'user_activities',
    'user_challenges', 'user_guardian_progress', 'user_mission_progress',
    'user_missions', 'user_paw_badges', 'user_rewards', 'user_shop_redemptions'
  )
ORDER BY n_live_tup DESC;
```

Si `n_live_tup < 100` Y `last_autovacuum < NOW() - 60 days`: candidata a `_deprecated`.

---

## Referencias

- Plan: [docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md) §1.4 + §9.0.bis
- Auditoría features ejecutada 2026-04-27: [_pending/AUDITORIA_FEATURES_2026_04_27.md](AUDITORIA_FEATURES_2026_04_27.md)
- Feature flags: [src/lib/featureFlags.ts](../src/lib/featureFlags.ts)
