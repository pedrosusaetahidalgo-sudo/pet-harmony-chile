# Ejecución Coherence Plan — Fase Final (gaps post-Día 2)

> **Fecha**: 2026-04-21
> **Origen**: plan maestro [PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md](./PRODUCT_SYSTEM_COHERENCE_MASTER_PLAN.md)
> **Contexto**: Día 1 y Día 2 ejecutados y en prod (ver [EJECUCION_COHERENCE_PLAN_DIA_1.md](./EJECUCION_COHERENCE_PLAN_DIA_1.md) y [EJECUCION_COHERENCE_PLAN_DIA_2.md](./EJECUCION_COHERENCE_PLAN_DIA_2.md)).
> **Alcance**: 4 gaps reales detectados al contrastar repo vs plan. Quirúrgico. Sin migraciones nuevas. Sin reescrituras.
> **Validación**: `tsc -b` 0 errores · `lint` 0 errores (7 warnings pre-existentes) · `test:ci` 377/377 verdes · `build` 1m 12s.

---

## Gaps detectados y resueltos

| # | Gap | Archivo | Fix |
|---|---|---|---|
| 1 | Label `Tipo *` para `antiparasitic_type` pero handleSubmit NO lo requiere y DB es NULLABLE → UI engañosa | [src/components/AddMedicalRecord.tsx:511](../../src/components/AddMedicalRecord.tsx#L511) | Cambio a `Tipo (opcional)` — alinea UI con lógica y schema |
| 2 | Form preventive care sin progressive disclosure: 13 campos siempre visibles | [src/components/AddMedicalRecord.tsx:593-643](../../src/components/AddMedicalRecord.tsx) | `<Collapsible>` con trigger "Agregar más detalles (opcional)" envuelve Veterinaria + Vet Name + Descripción + Notas. Los 3 campos requeridos quedan siempre visibles (tipo, título, fecha) |
| 3 | `useApplyAsPawVoice`/`useApplyAsPawCompany` y `CategoryApplyInlineForm` invalidan solo sus listas públicas pero NO `['my-applications']` → widget MyApplicationsSection del profile queda stale tras postular | [src/hooks/usePawVoices.ts:124](../../src/hooks/usePawVoices.ts#L124), [src/hooks/usePawCompanys.ts:142](../../src/hooks/usePawCompanys.ts#L142), [src/components/CategoryApplyInlineForm.tsx:156](../../src/components/CategoryApplyInlineForm.tsx#L156) | `queryClient.invalidateQueries({ queryKey: ['my-applications'] })` post-insert en los 3 flujos |
| 4 | Toast post-save de vacuna/antiparasitario no informa fecha próxima dosis. Plan apéndice C.3 pidió "Próxima dosis: 15 de julio 2026" | [src/components/AddMedicalRecord.tsx:266](../../src/components/AddMedicalRecord.tsx) | Toast enriquecido calcula próxima dosis usando misma lógica de `src/lib/frequencies.ts` (vaccine +12m, deworming interno/ambos +3m, flea externo +1m, Bravecto/Nexgard Spectra +3m) |

---

## Por qué estos 4 y no más

El plan original listaba ~30 items. Tras cruzar con repo real, **24 ya estaban en producción** (Días 1+2 ejecutados). Los 4 restantes de este batch son los únicos gaps *materiales* con impacto directo en UX. Lo demás del plan es o:

- **Manual de Pedro** (re-deploys, migraciones ya aplicadas, verificaciones).
- **Fase 6 opcional** (E2E Playwright, reorganizar `src/features/`, activar flags apagados `BOOKING_V3_WIZARD`/`PROVIDER_AGENDA_CALENDAR`/`PROVIDER_PUSH`/`ICS_EXPORT`).
- **Revisión estratégica** (Feed reactivación Q3, Paw Labs visibility policy ya aplicada).

---

## Riesgos remanentes

- **Bajo**: `Collapsible` por default cierra los 4 campos. Si hay flujos históricos donde el user *esperaba* encontrarlos abiertos (ej: Sofía vet registrando directo), ahora debe clickar "Agregar más detalles". Mitigación: el label es claro y el estado se mantiene por sesión del dialog. Monitorear feedback.
- **Bajo**: el toast con fecha calculada duplica parcialmente la lógica de [src/lib/frequencies.ts](../../src/lib/frequencies.ts). Si se cambia la lógica en `frequencies.ts`, hay que actualizar el toast. Opción futura: reusar `nextVaccineDate()`/`nextAntiparasiticDate()` del módulo. No crítico ahora.
- **Ninguno**: las 3 invalidaciones extra solo agregan refetch, nunca rompen.

---

## QA manual (post-merge)

### Owner

1. `/my-pets` → elegir mascota → "Agregar registro médico".
2. Tipo = Antiparasitario → verificar que label dice `Tipo (opcional)` y se puede submit con ese campo vacío si hay título+fecha.
3. Selectar tipo "externo" + producto "Bravecto" → submit → toast debe decir `Próxima dosis: <fecha + 3 meses>`.
4. Click "Agregar más detalles" → aparecen Veterinaria/Vet Name/Descripción/Notas. Click de nuevo → se ocultan.
5. `/profile` → scroll a "Mis postulaciones" (si el user no tiene, no sale). Postular como Paw Voice desde `/paw-voices` → volver a `/profile` → aparece inmediatamente en el widget.
6. Postular via `/aplicar?tipo=paw_companys` → volver a `/profile` → aparece.

### Provider/Vet

- Sin cambios de UX. Booking V3, ficha VetFichaView, optimistic updates intactos.

### Regresión

- Adopciones Día 1 fix sigue funcionando.
- Trigger de reminder automático al crear vacuna sigue disparando (1 row, no 2).
- Tab Prevenciones en `/calendario` sigue filtrando vaccine/deworming/flea.

---

## Follow-ups para Fase 6

1. Activar `PROVIDER_PUSH=true` en [featureFlags.ts:134](../../src/lib/featureFlags.ts#L134) con 1 provider de smoke.
2. E2E Playwright:
   - `adoption-create-in-shelters-tab.spec.ts`
   - `preventive-care-minimal.spec.ts` (solo 3 campos requeridos)
   - `my-applications-widget-updates.spec.ts`
3. Refactor: mover lógica duplicada de "próxima dosis calculada" del toast a helper de [frequencies.ts](../../src/lib/frequencies.ts).
4. Reorganizar `src/` a `src/features/` (booking, preventive-care, calendar, applications) — scope largo.
5. Revisar si E2E existentes siguen en verde con Playwright real (no solo vitest).

---

## Archivos modificados

- [src/components/AddMedicalRecord.tsx](../../src/components/AddMedicalRecord.tsx)
- [src/hooks/usePawVoices.ts](../../src/hooks/usePawVoices.ts)
- [src/hooks/usePawCompanys.ts](../../src/hooks/usePawCompanys.ts)
- [src/components/CategoryApplyInlineForm.tsx](../../src/components/CategoryApplyInlineForm.tsx)
- `INDEX.md` (referencia)

**Sin migraciones SQL nuevas.** Sin re-deploys de edge functions.
