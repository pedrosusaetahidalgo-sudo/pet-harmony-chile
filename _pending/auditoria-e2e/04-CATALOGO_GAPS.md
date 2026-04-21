# Catálogo priorizado de gaps

**Fase 4 del prompt** — consolidación de hallazgos ordenados por severidad.

Launch target: **1 junio 2026**.

---

## Resumen

| Severidad | Count | Esfuerzo sum |
|---|---|---|
| P0 | 1 | L (3-5 días) |
| P1 | 3 | M |
| P2 | 6 | M |
| P3 | 4 | S |

---

## P0 — Blockers de lanzamiento

### GAP-01 — Upgrade vet B2B pagado inexistente

- **Flujos afectados**: ONBD-28, ONBD-07 (tier clínica), impacto global en monetización B2B.
- **Severidad**: **P0**
- **Tipo**: Missing feature
- **Descripción**: `flow-create-subscription` solo soporta B2C. No hay ruta `/provider/upgrade`, ni handler webhook para actualizar `service_providers.provider_plan`, ni columnas `plan_started_at/plan_expires_at`. Vets permanecen eternamente en `provider_free`.
- **Evidencia**: `flow-create-subscription/index.ts:23-26`, `ParaVeterinarios.tsx:472-550` muestra planes sin checkout link funcional.
- **Propuesta de fix**:
  1. Migración `*_vet_plan_lifecycle.sql` — cols `plan_started_at`, `plan_expires_at`, `plan_next_billing_at`, cron `downgrade_expired_vet_plans`.
  2. Extender `flow-create-subscription`:
     - Aceptar `plan: 'monthly'|'yearly'|'provider_premium'|'provider_clinic_starter'|'provider_pro_max'`.
     - Prices `9900|19900|29900` para B2B.
     - Persistir `order_type='b2b_vet'` en `orders`.
  3. Extender `flow-webhook` para reconocer `order_type` y actualizar `service_providers.provider_plan + plan_started_at + plan_expires_at`.
  4. Nueva página `src/pages/ProviderUpgrade.tsx`:
     - 4 cards (Básica / Premium / Clínica / Pro Max) con precios + features.
     - Click → `flow-create-subscription` con plan correcto.
     - Redirect a Flow, callback `/payment-result?source=b2b_vet`.
  5. Links:
     - `/provider/dashboard` — banner si plan='provider_free' + CTA upgrade.
     - `/para-veterinarios` — para providers logueados, botones "Contratar" → `/provider/upgrade`.
  6. Tests:
     - Unit tests en `src/lib/plans.ts` para normalización de plans.
     - E2E para flujo happy path (opcional P1 de tests).
- **Esfuerzo**: **L (3-5 días)**.
- **Requiere decisión Pedro?**: **Sí** — ¿lanzar con 4 tiers completos o solo Premium ($9.900) al inicio y tiers clínica post-launch? Recomiendo los 4 completos.
- **Dependencias**: GAP-02 (tier clínica persist) debería alinearse.
- **Riesgo si NO**: lanzamiento sin monetización B2B. MRR = 0. Contradice pitch a VCs.

---

## P1 — Graves (arreglar antes de lanzar)

### GAP-02 — Tier clínica no se persiste en signup

- **Flujos afectados**: ONBD-07.
- **Severidad**: **P1**
- **Tipo**: Bug de consistencia
- **Descripción**: `BecomeProviderDialog` captura `provider_type='clinic'` pero no setea plan intencionado. El tier elegido inicialmente se pierde al llegar al upgrade.
- **Evidencia**: `BecomeProviderDialog.tsx:227-243`.
- **Propuesta de fix**:
  1. Agregar columna `service_providers.intended_plan TEXT` (o usar `provider_type` ya presente como pista).
  2. En `BecomeProviderDialog`, al seleccionar tipo clínica, preseleccionar plan clínica en la UI de upgrade posterior.
  3. Banner en `/provider/dashboard` si `provider_type='clinic' AND provider_plan='provider_free'`: "Tu cuenta es de clínica. Activa el plan Clínica para habilitar seats y bulk import".
- **Esfuerzo**: S (medio día).
- **Requiere decisión Pedro?**: No.
- **Dependencias**: GAP-01.
- **Riesgo si NO**: Clínicas quedan confundidas; no saben cómo escalar. Mid UX fail.

### GAP-03 — Callbacks Flow + copy obsoleto Paw Member

- **Flujos afectados**: ONBD-27.
- **Severidad**: **P1**
- **Tipo**: Copy + routing
- **Descripción**: `UpgradeSuccess.tsx` dice "Bienvenido a Premium" (pivot 2026-04-19 renombró Premium → Paw Member). Rutas `/upgrade/success|/cancel` siguen en App.tsx sin redirect.
- **Evidencia**: `UpgradeSuccess.tsx`, `UpgradeCancel.tsx`, `App.tsx:700-718`.
- **Propuesta de fix**:
  1. Reemplazar copy de ambos archivos al vocabulario Paw Member.
  2. Agregar query param `?source=flow` al return_url para identificar origen y loggear en PostHog.
  3. Eventualmente (post-launch): mover callbacks a `/paw-member/success` con 301 desde legacy (hoy NO urgente, no romper webhooks en vuelo).
- **Esfuerzo**: XS (30 min).
- **Requiere decisión Pedro?**: No (copy).
- **Dependencias**: —.
- **Riesgo si NO**: usuarios que paguen ven "Bienvenido a Premium" y se confunden.

### GAP-04 — Desactivar CORFO + Angels/VC al lanzamiento

- **Flujos afectados**: ONBD-18, ONBD-20.
- **Severidad**: **P1** (decisión de producto del founder).
- **Tipo**: Feature flag / UX
- **Descripción**: Pedro pidió excluir estos 2 tipos del lanzamiento. Hoy las URLs son públicas y reciben postulaciones no procesables.
- **Evidencia**: `Aplicar.tsx:235-241` (corfo), `251-257` (angels_vc).
- **Propuesta de fix**:
  1. Agregar `isOpen: boolean` al objeto de config de cada kind.
  2. Si `isOpen===false`, mostrar banner "Postulaciones cerradas por ahora" + botón submit disabled.
  3. Mantener URLs y meta tags para SEO.
  4. Copy chileno: "Esta postulación abre el {fecha-tentativa}. Suscríbete para que te avisemos" o simple "Postulaciones cerradas por ahora."
- **Esfuerzo**: S.
- **Requiere decisión Pedro?**: No (ya decidió).
- **Dependencias**: —.
- **Riesgo si NO**: leads fantasma.

---

## P2 — Importantes

### GAP-05 — Donaciones dirigidas refugio: verificar flag OFF + copy

- **Flujos afectados**: ONBD-29.
- **Severidad**: P2
- **Tipo**: Feature flag + copy
- **Descripción**: `SHELTER_DONATIONS=false`. `BecomeShelterDialog` muestra checkbox "Acepto donaciones" con disclaimer "próximamente".
- **Propuesta**:
  1. Confirmar `featureFlags.ts` tiene `SHELTER_DONATIONS: false` en prod build.
  2. Ajustar copy checkbox: "Esta opción se activará cuando Paw Friend migre a cuenta corporativa (próximamente)".
  3. Opcional: ocultar checkbox hasta flag ON.
- **Esfuerzo**: XS.
- **Riesgo si NO**: expectativa rota.

### GAP-06 — Email welcome vet genérico

- **Flujos afectados**: ONBD-05.
- **Severidad**: P2
- **Tipo**: Copy + nuevo recurso
- **Descripción**: Auth default welcome no da next steps de vet.
- **Propuesta**: crear edge fn `send-vet-welcome` (opcional trigger AFTER INSERT en service_providers o dispatch manual).
- **Esfuerzo**: S.
- **Riesgo**: UX menor; vets podrían perder oportunidad de activación.

### GAP-07 — Verificar SPF/DKIM/DMARC de pawfriend.cl

- **Flujos afectados**: todos los que envían email (Resend).
- **Severidad**: P2
- **Tipo**: Infra
- **Descripción**: si DNS no está configurado, emails caen en spam.
- **Propuesta**:
  1. En Resend dashboard → Domains → verificar `pawfriend.cl`.
  2. Si falta DNS, agregar SPF/DKIM TXT records.
  3. DMARC record `v=DMARC1; p=quarantine`.
- **Esfuerzo**: XS (trámite Pedro en DNS provider).
- **Requiere Pedro?**: sí (acceso DNS).
- **Riesgo**: deliverability crítica.

### GAP-08 — Cron reconcile-flow-pending no existe

- **Flujos afectados**: ONBD-27, ONBD-28.
- **Severidad**: P2
- **Tipo**: Missing infra (post-launch)
- **Descripción**: si webhook Flow falla, `donations`/`service_providers` quedan en pending eterno.
- **Propuesta**: cron diario que consulta Flow API por `token` pendientes >24h y reconcilia.
- **Esfuerzo**: M.
- **Riesgo**: casos esquina, no bloqueante para launch.

### GAP-09 — Actualizar FLUJO_COMPLETO.mmd + MAPA_FUNCIONAL

- **Flujos afectados**: transversal.
- **Severidad**: P2
- **Tipo**: Docs vivos (CLAUDE.md §9.6.1)
- **Descripción**: diagramas desactualizados desde antes de ONBD-10 (refugios).
- **Propuesta**: actualizar en el mismo lote que los fixes P0/P1 (regla CLAUDE.md).
- **Esfuerzo**: S.
- **Riesgo**: violación regla proyecto.

### GAP-10 — ONBD-11 bulk import sin fotos

- **Flujos afectados**: ONBD-11.
- **Severidad**: P2
- **Tipo**: Feature parcial
- **Descripción**: CSV import no soporta URLs de fotos.
- **Propuesta**: documentar limitación en `docs/JOURNEYS_UX.md`. Roadmap post-launch.
- **Esfuerzo**: XS (docs).
- **Riesgo**: bajo.

---

## P3 — Cosméticos

### GAP-11 — OAuth social welcome para vets vs owners

- Mismo trigger Supabase. No hay diferenciación UX.
- Esfuerzo XS.

### GAP-12 — 301 redirects /upgrade/* → /paw-member/*

- Post-migración callback (post-launch).
- Esfuerzo XS.

### GAP-13 — Leak de 1 frame en cambio rol

- Cosmético. Usuario rara vez lo nota.
- Esfuerzo M (refactor RoleGuard).

### GAP-14 — E2E Playwright para happy paths ONBD

- Recomendado post-launch como regresión. Prompt Fase 7 pide esto.
- Esfuerzo M.

---

## Tabla CSV (para importar a Sheets/Notion)

```csv
gap_id,severity,type,title,onbds,effort,requires_pedro_decision,depends_on,launch_blocker
GAP-01,P0,missing_feature,Upgrade vet B2B pagado inexistente,ONBD-28;ONBD-07,L,si,GAP-02,si
GAP-02,P1,bug,Tier clinica no se persiste en signup,ONBD-07,S,no,GAP-01,no
GAP-03,P1,copy_routing,Callbacks Flow + copy obsoleto Paw Member,ONBD-27,XS,no,,no
GAP-04,P1,feature_flag,Desactivar CORFO y Angels/VC,ONBD-18;ONBD-20,S,no,,no
GAP-05,P2,feature_flag,Donaciones refugio verificar flag OFF,ONBD-29,XS,no,,no
GAP-06,P2,nuevo_recurso,Email welcome vet generico,ONBD-05,S,no,,no
GAP-07,P2,infra,Verificar SPF/DKIM/DMARC pawfriend.cl,ALL,XS,si,,no
GAP-08,P2,infra,Cron reconcile-flow-pending,ONBD-27;ONBD-28,M,no,GAP-01,no
GAP-09,P2,docs,Actualizar FLUJO_COMPLETO.mmd + MAPA_FUNCIONAL,ALL,S,no,,no
GAP-10,P2,feature_parcial,ONBD-11 bulk import sin fotos,ONBD-11,XS,no,,no
GAP-11,P3,cosmetic,OAuth welcome vs owners,ALL,XS,no,,no
GAP-12,P3,cosmetic,301 redirects upgrade legacy,ONBD-27,XS,no,GAP-03,no
GAP-13,P3,cosmetic,Leak 1 frame cambio rol,ONBD-24,M,no,,no
GAP-14,P3,tests,E2E Playwright happy paths ONBDs,ALL,M,no,,no
```

---

## Preguntas abiertas para Pedro (Gate 1)

### 🔴 Críticas (antes de ejecutar P0/P1)

1. **ONBD-28 alcance**: ¿Lanzamos con los 4 tiers (Básica/Premium/Clínica/Pro Max) o solo Premium ($9.900) al inicio? Los otros pueden activarse a 1-2 meses post-launch.
2. **WhatsApp Cloud API**: ¿Mantenemos `wa.me` URL fallback al lanzamiento (simple, funciona) o activamos Meta Cloud API producción ahora que Meta aprobó verificación?
3. **Feature flag `SHELTER_DONATIONS`**: ¿OFF hasta SpA (recomendado) o encender parcial con disclaimer legal?
4. **Rutas legacy `/upgrade/*`**: ¿Redirect a `/paw-member/*` con 301 o mantener como están con copy nuevo?

### 🟡 Informativas

5. Pricing B2B: ¿Confirmamos $9.9k / $19.9k / $29.9k o ajustamos?
6. Flow cta personal vs SpA: ¿cuándo tentativamente tendrás la cuenta SpA operativa? (afecta GAP-05 timing)
7. DNS Resend: ¿necesitas ayuda con los records SPF/DKIM? Puedo darte los valores exactos.

---

## Lotes sugeridos para ejecución (Fase 5)

Ordenado por dependencias y riesgo:

- **Lote A — DB + backend B2B** (P0 GAP-01 primera mitad): migración + extensión flow-create-subscription + flow-webhook.
- **Lote B — UI upgrade B2B** (P0 GAP-01 segunda mitad + P1 GAP-02): ProviderUpgrade.tsx + ParaVeterinarios CTAs + banner dashboard.
- **Lote C — Copy + flags** (P1 GAP-03, GAP-04, P2 GAP-05): UpgradeSuccess copy + isOpen flag /aplicar + SHELTER_DONATIONS copy.
- **Lote D — Infra email + docs** (P2 GAP-07, GAP-09): SPF/DKIM check + actualizar diagrama + mapa.
- **Lote E — Nice-to-have post-launch** (P2 GAP-06, GAP-08, GAP-10, P3s): dejar en roadmap.

---

## Estado para Gate 1

Archivos generados:
- ✅ `00-INVENTARIO_ONBOARDINGS.md`
- ✅ `01-FLUJOS_E2E.md`
- ✅ `02-HALLAZGOS_MATRIZ.md`
- ✅ `03-INTEGRACIONES_CRUZADAS.md`
- ✅ `04-CATALOGO_GAPS.md` (este archivo)

**Gate 1: listo para presentar a Pedro**.
