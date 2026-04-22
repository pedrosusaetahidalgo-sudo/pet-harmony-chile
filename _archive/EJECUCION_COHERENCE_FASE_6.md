# Ejecución Coherence Plan — Fase 6 (hardening)

> **Fecha**: 2026-04-21
> **Origen**: plan maestro [PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md](./PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md)
> **Contexto**: Día 1 + Día 2 + Fase Final ya en prod.
> **Alcance**: regresión E2E protegida, deuda técnica limpiada, pendientes manuales acumulados al final.
> **Validación**: `tsc -b` 0 errores · `lint` 0 errores (7 warnings pre-existentes) · `test:ci` 377/377 verdes · `build` 1m 5s.

---

## Cambios aplicados

### A · Actualización de regresión E2E existente

El test [e2e/reorganization-v3.spec.ts](../../e2e/reorganization-v3.spec.ts) tenía dos aserciones que se habían vuelto inválidas tras el Coherence Plan:

1. `await expect(tabs).toHaveCount(4)` en `/calendario` — ahora son **5 tabs** (agregamos "Prevenciones" en Fase 5).
2. `await expect(nav.getByText('My Paws')).toBeVisible()` en BottomTabBar — el label real es **"Mis Mascotas"** (cambio previo al plan pero no actualizado en test).

Ambas corregidas + agregado nuevo test `deep link ?tab=prevenciones activa tab Prevenciones` para proteger el deep-linking de la tab nueva.

### B · Refactor: cálculo próxima dosis centralizado

Nueva función en [src/lib/frequencies.ts](../../src/lib/frequencies.ts):

```ts
export function nextPreventiveCareDate(params: {
  recordType: string;
  date: Date;
  antiparasiticType?: AntiparasiticType | null;
  productBrand?: string | null;
  nextDateOverride?: Date | null;
}): Date | null
```

Elimina la lógica duplicada que quedó en [AddMedicalRecord.tsx:266](../../src/components/AddMedicalRecord.tsx#L266) tras la Fase Final. Ahora el toast reusa el mismo helper que en principio también se puede usar en admin/debug views. DEBE mantenerse en sync con el trigger SQL `create_vaccine_reminder()` (migración `20260521000040`).

### C · Nueva suite E2E de regresión Coherence Plan

[e2e/coherence-plan-regression.spec.ts](../../e2e/coherence-plan-regression.spec.ts) — UI-only con fake auth. Cubre:

1. **Adopción**: tab "Hogares IA" visible; NewBadge reemplaza PawLabsBanner; botón "Publicar Mascota" condicional por tab.
2. **Preventive care**: estructura base `/my-pets` navega.
3. **Sidebar core**: ítem "Agenda" único (reducido de 3 duplicados).
4. **Tab Prevenciones**: visible en `/calendario` + deep-link `?tab=prevenciones` funciona.

No reemplazan el smoke manual [SMOKE_MANUAL_COHERENCE.md](./SMOKE_MANUAL_COHERENCE.md) — lo complementan: ese hace escrituras reales en DB, estos validan DOM sin red.

---

## Pendientes manuales acumulados (para correr cuando estés listo)

### 1. Smoke manual end-to-end (Pedro cuando quiera)

Seguir [docs-raiz/planes/SMOKE_MANUAL_COHERENCE.md](./SMOKE_MANUAL_COHERENCE.md) — 15-20 min en prod. 4 escenarios guiados con URL + expected/NOT expected + SQL de verificación.

### 2. Activar `PROVIDER_PUSH=true` con smoke de 1 provider

**NO se flipea desde código** por regla de [feedback_no_global_jwt_flip.md](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\feedback_no_global_jwt_flip.md) (*"Hacerlo 1 a 1 con smoke test real"*).

Procedimiento seguro cuando decidas activarlo:

```bash
# 1. Abrir src/lib/featureFlags.ts linea 134
# 2. Cambiar PROVIDER_PUSH: false → true
# 3. git commit + npm run build + git push
# 4. Hacer una reserva de prueba con 1 provider que sepas testeador
# 5. Verificar en notification_attempts que aparece row con:
#    channel='push', status='sent' (o 'skipped' si no hay device_token)
# 6. Si falla, revertir el flag (1 commit rollback, sin ceremonias).
```

SQL de verificación post-smoke:

```sql
SELECT channel, status, error_message, attempted_at
FROM public.notification_attempts
WHERE channel = 'push'
  AND attempted_at > NOW() - INTERVAL '10 minutes'
ORDER BY attempted_at DESC
LIMIT 10;
```

### 3. Correr los E2E Playwright al menos una vez contra un ambiente real

```bash
npx playwright test coherence-plan-regression --project="Desktop Chrome"
npx playwright test reorganization-v3 --project="Desktop Chrome"
```

Si pasan: merge con confianza. Si falla algo: diagnosticar y reportar.

### 4. Push del commit Fase 6

```bash
git push origin main
```

---

## Fuera de alcance (explícitamente diferido)

- **Reorganización `src/features/`** — es un refactor estructural largo (~3-5 días). Requiere plan separado con commits pequeños para no romper imports masivos. No es bloqueante.
- **Reactivación de Feed** (`FEED=true`) — decisión estratégica Q3 según engagement de Grupos. Requiere UI de moderación admin para reports que no existe hoy.
- **Activar `BOOKING_V3_WIZARD=true` / `PROVIDER_AGENDA_CALENDAR=true` / `ICS_EXPORT=true`** — cada una requiere smoke independiente como el de `PROVIDER_PUSH`.

---

## Archivos modificados

- [e2e/reorganization-v3.spec.ts](../../e2e/reorganization-v3.spec.ts) (actualización)
- [e2e/coherence-plan-regression.spec.ts](../../e2e/coherence-plan-regression.spec.ts) (nuevo)
- [src/lib/frequencies.ts](../../src/lib/frequencies.ts) (+ `nextPreventiveCareDate`)
- [src/components/AddMedicalRecord.tsx](../../src/components/AddMedicalRecord.tsx) (reusa helper)
- `INDEX.md` (referencia)

**Sin migraciones SQL. Sin re-deploys. Sin cambios de flags.**

---

## Estado final del plan maestro

| Fase | Estado |
|---|---|
| Fase 0 — Hotfixes P0 | ✅ Día 1 |
| Fase 1 — Navegación coherente | ✅ Día 1 |
| Fase 2 — Preventive care canónico | ✅ Día 1 |
| Fase 3 — Wiring notifs | ✅ Día 2 |
| Fase 4 — Optimistic updates booking | ✅ Día 2 |
| Fase 5 — Tab Prevenciones | ✅ Día 2 |
| Fase Final — 4 gaps residuales | ✅ 2026-04-21 |
| **Fase 6 — Hardening** | ✅ **esta sesión** |

Plan maestro ejecutado al **100%** en scope. Lo que queda son acciones manuales de Pedro + decisiones estratégicas (Q3).
