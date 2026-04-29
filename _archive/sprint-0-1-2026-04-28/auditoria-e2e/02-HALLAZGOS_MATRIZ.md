# Auditoría E2E — Matriz de hallazgos (Fase 2)

**30 checks x 30 ONBD = 900 auditorías**. Formato compacto. Las incidencias P0/P1/P2 se detallan al final. Los "OK" representan flujos que pasan el check.

## Leyenda

| Símbolo | Significado |
|---|---|
| ✅ | OK |
| 🟡 | Parcial (detalle en sección incidencias) |
| ❌ | Roto (P0/P1) |
| — | No aplica |

## Categorías (§5.1 del prompt)

1. **Rutas y nav** (4 checks): ruta existe, tipo soportado, redirects legacy, links internos.
2. **Guards y permisos** (4): RoleGuard, AdminRoute, ProtectedRoute, menús sin leakage.
3. **Formularios** (5): zod, copy chileno, doble-click, toast éxito/error, empty/loading.
4. **Backend** (5): endpoint existe, payload coincide, validación server, rate limit, errores propagados.
5. **DB y RLS** (5): tablas existen, defaults, RLS correcto, índices, triggers/RPCs aplicados.
6. **Integraciones** (5): Email Resend, WA wa.me/Meta, Flow.cl, Google Calendar, Storage.
7. **Docs vivos** (2): diagrama FLUJO_COMPLETO.mmd, MAPA_FUNCIONAL.

---

## Matriz por ONBD (resultado agregado por categoría)

| ONBD | Rutas | Guards | Forms | Backend | DB/RLS | Integr | Docs | Estado global |
|---|---|---|---|---|---|---|---|---|
| ONBD-01 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 | OK con detalles menores |
| ONBD-02 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ |
| ONBD-03 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ |
| ONBD-04 | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| ONBD-05 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | OK con copy vet welcome |
| ONBD-06 | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| ONBD-07 | ✅ | ✅ | ✅ | 🟡 | 🟡 | — | 🟡 | **🟡 tier clínica no se persiste** |
| ONBD-08 | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| ONBD-09 | ✅ | ✅ | — | — | ✅ | — | ✅ | ✅ |
| ONBD-10 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-11 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | OK, verificar bucket Storage |
| ONBD-12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-13 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-14 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-15 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-16 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-17 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-18 | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | **🟡 DESACTIVAR al launch** |
| ONBD-19 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-20 | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | **🟡 DESACTIVAR al launch** |
| ONBD-21 | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-22 | ✅ | ✅ | — | ✅ | ✅ | — | ✅ | ✅ |
| ONBD-23 | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| ONBD-24 | — | ✅ | — | — | ✅ | — | ✅ | ✅ |
| ONBD-25 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-26 | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| ONBD-27 | 🟡 | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 | **🟡 callbacks legacy + copy obsoleto** |
| ONBD-28 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **❌ P0 — bloqueador monetización B2B** |
| ONBD-29 | 🟡 | ✅ | 🟡 | 🟡 | ✅ | 🟡 | ✅ | **🟡 flag OFF al launch, verificar copy** |
| ONBD-30 | ✅ | ✅ | — | ✅ | ✅ | ✅ | 🟡 | ✅ |

---

## Incidencias detalladas (P0/P1/P2)

### ❌ P0 — ONBD-28: Upgrade vet B2B inexistente

**Categoría**: Backend + DB + UI (global)

**Evidencia**:
- `supabase/functions/flow-create-subscription/index.ts:23-26` — sólo define precios B2C (`monthly: 3990, yearly: 39900`).
- No hay edge fn `flow-create-subscription-b2b` ni otra que maneje tiers `provider_premium`/`provider_clinic_starter`/`provider_pro_max`.
- No hay UI en `/provider/dashboard` ni en `/para-veterinarios` con botón "Upgrade".
- `ParaVeterinarios.tsx` tiene los 4 tiers declarados pero los CTAs llevan a `/registro-veterinario`, nunca a un checkout.

**Impacto**:
- Vets no pueden pagar. Plan permanece en `provider_free`.
- Features Premium/Clínica/Pro Max (bulk import, multi-branch, priority support) nunca se activan.
- MRR B2B = 0 por incapacidad técnica.

**Requiere**:
- Crear migración `*_vet_plan_lifecycle.sql` con:
  - `service_providers.plan_started_at TIMESTAMPTZ`
  - `service_providers.plan_expires_at TIMESTAMPTZ`
  - `service_providers.plan_next_billing_at TIMESTAMPTZ`
  - Cron `downgrade_expired_vet_plans` (diario).
- Extender `flow-create-subscription` para aceptar `plan: 'provider_premium'|'provider_clinic_starter'|'provider_pro_max'` con precios `9900|19900|29900`.
- Agregar `order_type` al body del webhook para distinguir B2C vs B2B y escribir al target correcto (`service_providers.provider_plan` para B2B, `donations` para B2C).
- Crear `src/pages/ProviderUpgrade.tsx` con 4 cards de plan + checkout por Flow.
- Link desde `/provider/dashboard` header + banner en `/para-veterinarios` para providers logueados.

---

### 🟡 P1 — ONBD-07: Tier clínica no se persiste

**Evidencia**:
- `BecomeProviderDialog.tsx:227-243` — payload de insert a `service_providers` incluye `provider_type` y `primary_service_type` pero siempre setea `provider_plan='provider_free'`.
- Usuario que elige "Clínica veterinaria" queda indistinguible de vet individual en DB.

**Impacto**:
- UI podría mostrar CTAs confusos (ej: "Invitar seats" cuando no tienen seats).
- El intento de upgrade B2B (cuando ONBD-28 exista) debe detectar el tier elegido inicial.

**Requiere**:
- Preservar `provider_type='clinic'` (ya se hace) + agregar campo visual "Este es un plan de clínica, actualiza para activar seats" en dashboard.
- Al implementar ONBD-28, preseleccionar el plan correcto según `provider_type`.

---

### 🟡 P1 — ONBD-27: Callbacks Flow legacy + copy obsoleto

**Evidencia**:
- `UpgradeSuccess.tsx` existe y es alcanzable vía `/upgrade/success` (callback de Flow).
- Texto hoy: "Bienvenido a Premium" — pivot 2026-04-19 renombró Premium a Paw Member.
- `/upgrade` redirige a `/paw-member` pero los callbacks no se redirigieron.

**Impacto**:
- User que paga ve copy inconsistente. Confusión con el modelo.
- PostHog eventos antiguos (`premium_converted`) siguen disparándose — ok para trackear pero confunde dashboards.

**Requiere**:
- Actualizar `UpgradeSuccess.tsx` copy a "Gracias por sostener Paw Friend" + badge "Paw Member 💛 activo".
- Actualizar `UpgradeCancel.tsx` copy a neutro.
- Eventualmente mover callbacks a `/paw-member/success` y `/paw-member/cancel` sin romper webhooks en vuelo.

---

### 🟡 P2 — ONBD-18 + ONBD-20: Desactivar CORFO + Angels/VC

**Evidencia**:
- `Aplicar.tsx:235-257` incluye los 2 tipos con formularios completos.
- Pedro decisión 2026-04-20: excluir del lanzamiento.

**Impacto bajo**: solo recibe leads no procesables.

**Requiere**:
- Agregar campo `isOpen: boolean` al `KIND_CONFIG` o banner inline "Postulaciones cerradas por ahora".
- Bloquear botón submit con disabled + razón.
- Conservar URLs para SEO.

---

### 🟡 P2 — ONBD-29: Donaciones dirigidas a refugio

**Evidencia**:
- `featureFlags.ts` tiene `SHELTER_DONATIONS: false`.
- `BecomeShelterDialog.tsx:437-442` muestra checkbox "Acepta donaciones" con disclaimer.
- Donaciones `/donaciones?refugio=X` no fallan pero no transfieren al refugio (Flow cta personal).

**Impacto**: feature advertised pero bloqueada. Riesgo de expectativa rota.

**Requiere**:
- Confirmar `SHELTER_DONATIONS=false` en build prod.
- Ajustar copy en `BecomeShelterDialog` para decir "Esta opción se activará cuando Paw Friend migre a cuenta corporativa (próximamente)".
- Opcional: ocultar checkbox en UI hasta flag ON.

---

### 🟡 P2 — ONBD-11: Bulk import sin verificar Storage

**Evidencia**:
- Edge fn `bulk-import-pets` existe.
- CSV/XLSX via SheetJS parsea directo en memoria.
- No sube a Storage (no requiere bucket).

**Impacto**: solo si el archivo viene con fotos linkeadas. Hoy el flujo no soporta fotos bulk (solo campos texto).

**Requiere**: documentar en `docs/JOURNEYS_UX.md` que bulk import no incluye fotos. Futuro: soporte imagen por URL pública.

---

### 🟡 P2 — ONBD-05: Copy email welcome vet

**Evidencia**: no hay edge fn dedicada `send-vet-welcome`. Supabase Auth dispara su template default.

**Impacto**: email de welcome del Auth es genérico, no dice "Bienvenido veterinario, próximos pasos: completa tu perfil + directorio".

**Requiere**: crear edge fn opcional `send-vet-welcome` disparada por trigger AFTER INSERT en `service_providers` con plantilla específica. P3, no bloqueante.

---

### 🟡 P2 — ONBD-01: Trigger D0 drip email

**Evidencia**: trigger `notify_new_pet_drip_d0` existe (mig 20260709020000). Dispara `send-new-pet-drip` con `stage=0`.

**Impacto**: si `send-new-pet-drip` no está deployada, el email D0 falla silently (EXCEPTION NULL en trigger).

**Requiere**: verificar deploy de `send-new-pet-drip` (Pedro confirmó en tanda 13, ok).

---

### 🟡 P2 — Docs vivos (transversal)

**Evidencia**:
- `diagrams/FLUJO_COMPLETO.mmd` no se actualiza desde antes del ONBD-28 ni refleja los 6 flujos añadidos en tandas 10-16.
- `MAPA_FUNCIONAL_COMPLETO.md` tiene última edición antes del refugio bulk import.

**Impacto**: siguiente devs/IA pierden contexto. Violación CLAUDE.md §9.6.1.

**Requiere**: después de los fixes P0/P1, actualizar ambos documentos.

---

## Resumen por severidad

| Severidad | Count | ONBDs afectados |
|---|---|---|
| ❌ P0 | 1 | ONBD-28 |
| 🟡 P1 | 2 | ONBD-07, ONBD-27 |
| 🟡 P2 | 6 | ONBD-18, ONBD-20, ONBD-29, ONBD-11, ONBD-05, ONBD-01 |
| 🟡 P3 | 1 | Docs vivos (transversal) |

---

## Checklist por flujo (detalle para los críticos)

Solo los flujos con hallazgos no-triviales se expanden aquí. Los demás pasan los 30 checks limpiamente según la matriz (ver detalle en `01-FLUJOS_E2E.md`).

### ONBD-28 — detalle 30 checks

1-4 (Rutas): ❌ No existe `/provider/upgrade`.
5-8 (Guards): ❌ N/A sin ruta.
9-13 (Forms): ❌ N/A.
14-18 (Backend): ❌ `flow-create-subscription` no acepta tiers vet. No hay RPC `create_vet_subscription`. No hay rate limit específico B2B.
19-23 (DB/RLS): ❌ Falta `plan_started_at`, `plan_expires_at` en `service_providers`. No hay trigger de renovación. No hay RLS específica.
24-28 (Integr): ❌ Flow.cl no configurado para B2B en código.
29-30 (Docs): ❌ FLUJO_COMPLETO.mmd no tiene el flujo de upgrade B2B.

### ONBD-07 — detalle 30 checks

1-4: ✅
5-8: ✅
9-13: ✅ (zod presente, copy chileno)
14-18: 🟡 Backend crea row correctamente pero falta campo `plan_tier_intended` o similar para distinguir al momento de upgrade.
19-23: 🟡 `provider_type` se persiste ✅ pero no hay constraint que fuerce `provider_plan='provider_clinic_starter'` cuando type=clinic.
24-28: —
29-30: 🟡

### ONBD-27 — detalle 30 checks

1-4: 🟡 Rutas legacy `/upgrade/success` y `/upgrade/cancel` siguen vivas pero el home es `/paw-member`. No hay 301 redirect.
5-8: ✅
9-13: 🟡 Copy en UpgradeSuccess dice "Premium" (obsoleto).
14-18: ✅ flow-create-subscription B2C funciona.
19-23: ✅
24-28: ✅ Flow.cl operativo.
29-30: 🟡

---

## Próximo: Fase 3 — Matriz de integraciones cruzadas
