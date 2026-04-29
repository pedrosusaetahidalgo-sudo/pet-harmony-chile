# Cleanup Fase 1 — Plan v5 ejecutado 2026-04-29

> Documento generado durante la ejecución del [pawfriend-prompt-v5.md](../../pawfriend-prompt-v5.md)
> en sesión Claude Code del 2026-04-29.
>
> **Decisiones origen** (Pedro, Checkpoint 1):
> - Activar Paw Shield con Petify (incurrir COGS USD 0.75/pet/mes opt-in)
> - Activar EMBEDDED_INSURANCE + RETAIL_FULFILLMENT como demo con disclaimer
> - **Pivot Opción 3**: freemium B2C de 3 tiers (Free / Paw Member / Manada)
> - Donaciones → Aportes en UI (mantener "Paw Support" como concepto interno)
> - DROP 28 tablas `_deprecated_20260427` el 8 junio post-launch
> - Mantener 16 tablas cuestionables bajo flag

---

## 1. Lo que ejecuté en código

### 1.1 Feature flags (`src/lib/featureFlags.ts`)

| Flag | Antes | Ahora | Razón |
|---|---|---|---|
| `NOSE_PRINT_ENABLED` | false | **true** | Paw Shield Petify activo |
| `NOSE_PRINT_PUBLIC_SCAN` | false | **true** | `/nose-scan` público funcional |
| `PAW_SHIELD_PETIFY` | false | **true** | Backend Petify activo (¡pendiente API key PROD!) |
| `EMBEDDED_INSURANCE` | false | **true** | Demo con disclaimer "próximamente" |
| `RETAIL_FULFILLMENT` | false | **true** | Demo con disclaimer "próximamente" |
| `PARTNER_DISCOUNTS` | false | **true** | Demo con disclaimer |
| `USER_PREMIUM` | false | **PENDIENTE flipear a `true`** | Cuando termine wire PremiumGate (agente background) |

### 1.2 Disclaimers UI

- [src/pages/InsuranceQuotes.tsx](../../src/pages/InsuranceQuotes.tsx): banner "Piloto en marcha · próximamente" + nota de cotización referencial.
- [src/pages/RetailStore.tsx](../../src/pages/RetailStore.tsx): banner "Piloto en marcha" con CTA postular como Paw Partner.

### 1.3 Rename "donaciones" → "aportes" (UI pública)

Agente delegado completó: **25 archivos modificados, ~50 strings reemplazados**.

- DB tabla `donations` se mantiene (regla 9.7).
- Variables, funciones, imports, URLs `/donaciones` se mantienen.
- "Donantes de sangre" (feature distinta) se preserva.
- Ley 19.885 referenciada legalmente se preserva.
- Nueva ruta `/aportes` agregada como alias 301 a `/paw-support` en
  [src/App.tsx](../../src/App.tsx).

### 1.4 Pricing 3 tiers ([src/lib/plans.ts](../../src/lib/plans.ts))

```
type PlanId = 'free' | 'premium' | 'paw_manada';
```

| Plan | DB id | UI label | Precio | Mascotas | Aporte refugio |
|---|---|---|---|---|---|
| Free | `free` | "Gratis" | $0 | 2 | — |
| Paw Member | `premium` (compat DB) | "Paw Member" | $3.990/mes · $39.900/año | 4 | — |
| Manada | `paw_manada` | "Manada" 👑 | $9.990/mes · $99.900/año | 5 | $2.000/mes |

Helpers nuevos:
- `normalizePlanId(id)` — resuelve cualquier alias DB/UI/legacy a PlanId canónico
- `getPlanLabel(planId)` — nombre con badge para UI
- `getRefugioAporteClp(planId)` — monto del aporte mensual al fondo
- `findMinUpgradePlan(feature, value)` — evalúa el menor plan que desbloquea la feature
- `canAccess()` actualizado para soportar string enums (`partner_discounts`)

Features split:

| Feature key | Free | Paw Member | Manada |
|---|---|---|---|
| `max_pets` | 2 | 4 | 5 |
| `paw_shield` | ❌ | ✅ | ✅ |
| `paw_passport` | ❌ | ✅ | ✅ |
| `insights_pro` | ❌ | ✅ | ✅ |
| `audio_notes_ai` | ❌ | ✅ | ✅ |
| `reports_history_days` | 30 | -1 (∞) | -1 (∞) |
| `share_clinical_days` | 30 | 365 | 365 |
| `partner_discounts` | none | basic | exclusive |
| `priority_support` | ❌ | ❌ | ✅ |
| `early_access` | ❌ | ❌ | ✅ |
| `ai_behavior_analysis` | 5/mes | -1 (∞) | -1 (∞) |
| `ai_vet_assistant` | 10/mes | -1 (∞) | -1 (∞) |
| `ocr_scans` | 5/mes | -1 (∞) | -1 (∞) |
| `weekly_summary` | ❌ | ✅ | ✅ |

### 1.5 PremiumGate component ([src/components/PremiumGate.tsx](../../src/components/PremiumGate.tsx))

Componente nuevo. Bloqueador hard (vs `PremiumNudge` que es soft).

```tsx
<PremiumGate
  feature="paw_shield"
  title="Paw Shield · biometría anti-pérdida"
  description="Registra la huella nasal. Si se pierde, cualquiera puede escanearla."
>
  <PawShieldEnrollment />
</PremiumGate>
```

Props: `feature`, `title`, `description`, `children`, `variant` (`card` | `banner`),
`currentUsage` (para gates numéricos como max_pets).

Si bloqueado, muestra card upsell con:
- Badge del plan target (Paw Member o Manada)
- Lista de features que desbloquea
- CTA "Activa [Plan] · $X.XXX/mes" → `/paw-member`
- Tracking automático con event `pro_panel_upgrade_cta_clicked`

### 1.6 Migración SQL Manada Fondo Refugios

Archivo: [supabase/migrations/20260929000000_manada_fondo_refugios.sql](../../supabase/migrations/20260929000000_manada_fondo_refugios.sql)

**3 tablas nuevas**:
- `manada_refugio_preferences` — refugio que el user Manada eligió apoyar
- `manada_fondo_pool` — pool mensual (1 fila por mes) con total acumulado
- `manada_aportes_log` — bitácora de cada aporte ($2.000 c/u) con `flow_charge_id` UNIQUE para idempotencia

**3 RPCs nuevas**:
- `set_manada_refugio_preference(shelter_id)` — set/update preferencia user
- `get_manada_aporte_summary()` — total aportado lifetime + count + refugio elegido (UI dashboard `/paw-member`)
- `get_manada_fondo_transparency()` — KPIs públicos para `/transparencia` y decks (total recaudado, distribuido, refugios apoyados)

**RLS configurado**:
- `manada_refugio_preferences`: user ve/edita su propia
- `manada_fondo_pool`: lectura pública (transparencia), modificación admin
- `manada_aportes_log`: user ve su log, admin ve todo

**Diseño legal**: Paw Friend SpA hace la donación efectiva al refugio (Art. 31
N°7 LIR aplica). User NO emite recibo. Esto evita activar Ley 19.885.

**Smoke test inline incluido** (regla 9.2.1).

### 1.7 Documentación actualizada

- [CLAUDE.md sección 5](../../CLAUDE.md) — modelo v2.1 con freemium 3 tiers documentado, tabla actualizada, Manada Fondo Refugios explicado, rutas actualizadas.
- [docs-raiz/pitch/MODELO_V2_2026_04_22.md](../../docs-raiz/pitch/MODELO_V2_2026_04_22.md) — addendum 2026-04-29 al inicio explicando el pivot Opción 3.

---

## 2. Completado por agente background (terminó)

### Batch A — Wire PremiumGate ✅ (6 features + bonus)

| Feature | Archivo | Comportamiento |
|---|---|---|
| `paw_shield` | [PetClinicalRecord/index.tsx:753-768](../../src/pages/PetClinicalRecord/index.tsx) | Card en tab Identidad gated (free → upsell) |
| `paw_passport` | [PetClinicalRecord/index.tsx:780-790](../../src/pages/PetClinicalRecord/index.tsx) | Sección PDF gated |
| `audio_notes_ai` | [HomePetFocusV2.tsx:421-431](../../src/components/home/HomePetFocusV2.tsx) | Recorder con banner inline |
| `insights_pro` | [ProDashboard.tsx:651-878](../../src/pages/ProDashboard.tsx) | Owner view wrappeada (provider/admin no afectados) |
| `reports_history_days` | [Reportes.tsx:88-180](../../src/pages/Reportes.tsx) | Page entera gated |
| `max_pets` | [AddPet.tsx:743-760](../../src/pages/AddPet.tsx) | Free con 2 pets → upsell card |
| Bonus | [useCanAddPet.ts:59](../../src/hooks/useCanAddPet.ts) | Redirect `/upgrade` → `/paw-member` |

### Batch B — Refactor PremiumNudge ✅

[src/components/PremiumNudge.tsx](../../src/components/PremiumNudge.tsx):
- `navigate('/donaciones')` → `navigate('/paw-member')`
- Default ctaText: "Apoyar Paw Friend" → "Activa Paw Member"
- Copy actualizado para reflejar paywall real
- Track event source: `paw_member_nudge_*`

### Batch C — Hooks @deprecated ✅ (3 marcados, no 12)

**El agente backend original tenía 9 falsos positivos** — solo 3 hooks tienen 0 imports activos. Marcados `@deprecated 2026-04-29`:

1. [useLeadsClinicas.ts](../../src/hooks/useLeadsClinicas.ts)
2. [useProviderActivityFeed.ts](../../src/hooks/useProviderActivityFeed.ts)
3. [usePaymentReminder.ts](../../src/hooks/usePaymentReminder.ts)

**Falsos positivos (NO marcados, tienen imports activos)**:
- `useCommunityGroups` (Community.tsx)
- `useAdoptionProcesses` (ShelterAdoptionsKanban + MisAdopciones)
- `useAdvertisements` (AdminAdvertisements + AdSlot)
- `useConsultationTemplates` (ConsultationTemplateSelector + SaveTemplateButton)
- `useMyApplications` (MisPostulaciones + MyApplicationsSection)
- `useNotificationDeliveryKpis` (NotificationDeliveryWidget)
- `useNotificationPrefs` (NotificationPrefsSection)
- `usePetHealthAlerts` (PetHealthAlertsBanner)
- `useVetPatientSummary` (PatientConsolidatedSummary)

Lección: el agente backend inventory inicial debe verificarse manualmente antes de actuar.

### Batch D — withTelemetry edge fns ✅

| Edge fn | Cambio |
|---|---|
| [consultation-prep/index.ts](../../supabase/functions/consultation-prep/index.ts) | Import + `serve(withTelemetry('consultation-prep', ...))` |
| [generate-paw-passport/index.ts](../../supabase/functions/generate-paw-passport/index.ts) | Import + wrap |
| [generate-pet-id-card/index.ts](../../supabase/functions/generate-pet-id-card/index.ts) | Import + wrap |

**`npx tsc -b` corre 0 errores tras todos los cambios del agente.**

---

## 3. Adicional ejecutado (post agente)

### 3.1 Cleanup #5 — Rutas legacy ✅

- `/peluquero/perfil` → ahora redirect 301 a `/provider/profile-edit`. Componente `GroomerProfileEdit` lazy import eliminado de [App.tsx](../../src/App.tsx).
- `/analytics-demo` → mantenido (admin-only via AdminRoute, herramienta interna útil).

### 3.2 Mig SQL Manada Fondo Refugios — fixes adicionales ✅

Pedro intentó aplicar y reportó 2 errores. Fixes aplicados:
- **Smoke test** simplificado: verifica catálogo (3 tablas + 3 RPCs en information_schema/pg_proc) en vez de insertar dummy. La FK a `auth.users` no aceptaba UUID random.
- **Policies idempotentes**: agregado `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`.
- **Columna `subscriptions`**: era `plan_type` no `plan_id`. RPCs ajustadas. Comentario de constraint al final actualizado con guidance correcto.

### 3.3 Fase 7 — Modelo financiero ✅

Creado [docs-raiz/MODELO_FINANCIERO_2026_04_29.md](../../docs-raiz/MODELO_FINANCIERO_2026_04_29.md):
- FX 905 declarado único.
- Conversión target 13% Paw Member + 2% Manada.
- Petify opt-in 30% Paw Member / 60% Manada.
- Costo per-tier breakdown (Paw Member margen 86%, Manada margen 62%).
- Revenue B2C + B2B por escala 1k/10k/50k/100k MAU.
- ARR consolidado: USD 9k → 175k → 1.37M → 3.07M.
- EBITDA: positivo desde 1k MAU, 91-92% margen a 50k+.
- Sensibilidad FX (aguanta hasta 1.100), Petify (aguanta x2).
- Capital ask sugerido: USD 150k pre-seed (CORFO + angel).

---

## 4. Pendiente (próxima sesión)

### 4.1 Implementación restante Opción 3

- [ ] **PawMember.tsx refactor 3 tiers** (en curso por agente background al cierre de sesión).
- [ ] Update 4 decks pitch (CORFO, Start-Up, Companys, Angels) — slide modelo de negocio.
- [ ] Edge fn `flow-create-subscription` aceptar `plan_type='paw_manada'` con $9.990/$99.900.
- [ ] Edge fn `flow-webhook` insertar en `manada_aportes_log` al cobrar Manada con `amount_clp=2000`.
- [ ] Cron mensual `close_manada_pool_for_previous_month` — cuando Pedro confirme workflow transferencia bancaria a refugios.
- [ ] Tests E2E del paywall (free user → ve gate → upgrade flow).

### 4.2 Cleanup técnico restante

- [ ] **Cleanup #6 — SQL DROPs verificadas**: tras verificación rigurosa, candidatos REALES (descartando falsos positivos) son:
  - `virtual_routes` — 0 uso confirmado, walk routes virtuales descartado
  - `post_reports` — 0 uso confirmado, ya marcado deprecated en mig 20260424000000
  - `points_history` — usa migs viejas paw_points pre-canonización (verificar trigger refs antes)
  - **Decisión**: NO crear mig DROP en esta sesión. Pedro confirma post-launch (8 junio) cuando logs prod confirmen 0 acceso por 1 semana.
  - **Tablas vivas confirmadas (NO drop)**: `correlation_observations`, `partner_integrations`, `b2b_api_keys`, `b2b_outreach_log`, `b2b_api_usage`, `vet_pet_relationships_deprecated_20260424` (ya rename'eado).
- [ ] Smoke test a 4 triggers timeline (mig 20260903800000) sin DO block — agregar smoke en mig nueva post-launch.

### 4.3 Fases v5 pendientes

| # | Fase | Estado |
|---|---|---|
| 3 | Polish E2E + 6 flujos críticos | Pendiente |
| 4 | Brand consistency check | Pendiente (Brand v2 ya está aplicado, falta auditar consistencia en producto + decks) |
| 5 | Legal review final + paywall B2C compliance (Ley 21.719 + 19.628) | Pendiente — abogado externo recomendado |
| 6 | Monetización actualizada (freemium 15% + 7 motores B2B) | ✅ ya cubierto en F7 financiero, sintetizar en pitch deck |
| 7 | Modelo financiero | ✅ COMPLETADO esta sesión |
| 8 | Beta criteria formal | Pendiente |
| 9 | Pitch refinement (4 decks slide modelo) | Pendiente |
| 10 | Consolidación memoria + commit | En curso |

---

## 4. Acciones MANUALES de Pedro (urgentes)

### 4.1 Pre-launch (antes de mergear estos cambios)

1. **API key Petify PROD**:
   - Hoy en Supabase Secrets hay key TEST según [memoria](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_petify_integration.md).
   - Confirmar contrato con Petify ($0.75/pet/mes opt-in).
   - Reemplazar TEST → PROD en Supabase Secrets.
   - Smoke test: registrar 1 mascota real → verificar identify funciona.

2. **Aplicar mig SQL nueva**:
   - [supabase/migrations/20260929000000_manada_fondo_refugios.sql](../../supabase/migrations/20260929000000_manada_fondo_refugios.sql)
   - Aplicar desde Supabase Dashboard > SQL Editor.

3. **Update CHECK constraint subscriptions** (si no acepta `paw_manada`):
   ```sql
   ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;
   ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_check
     CHECK (plan_id IN ('free', 'premium', 'paw_manada'));
   ```

4. **Mig pricing_defaults_seed pendiente** (de tu sesión anterior):
   - [supabase/migrations/20260925000000_pricing_defaults_seed.sql](../../supabase/migrations/20260925000000_pricing_defaults_seed.sql) — seteer pricing default partners B2B.

### 4.2 Post-wire PremiumGate (cuando termine agente)

5. **Flipear `USER_PREMIUM=true`** en [src/lib/featureFlags.ts](../../src/lib/featureFlags.ts):
   - Solo cuando confirmes que PremiumGate está wireado en todos los componentes premium.
   - Esto activa el paywall real.

6. **Smoke test paywall**:
   - User Free → entrar a tab Identidad de la ficha → ver Paw Shield gated → click upgrade → completar Flow checkout → confirmar tier desbloquea.

### 4.3 Workflow Manada Refugios (semanal/mensual operacional)

7. **Confirmar workflow transferencia bancaria a refugios**:
   - Cron mensual cierra el pool del mes anterior.
   - Vos (admin) ves en panel admin el monto pendiente + count de users activos.
   - Calculas split por refugio (proporcional a preferencias) o pool genérico.
   - Hacés transferencia bancaria.
   - Marcas en `manada_fondo_pool.status = 'distributed'`.
   - Si querés automatizar: API bancaria (BCI/Banco Estado) → fuera de scope MVP.

8. **Crear AdminManadaFondo panel** (futuro):
   - Vista de pool mensual + aportes pendientes + log distribuciones.
   - Por ahora puede vivir como query SQL manual hasta tener volumen real.

### 4.4 POST-launch (8 junio 2026)

9. **DROP 28 tablas `_deprecated_20260427`** (mig 905):
   - Confirmar en logs prod que ningún proceso accedió a esas tablas en 1 semana.
   - Generar mig DROP final.
   - Aplicar.

10. **DROP tablas zombie verificadas** (lista en sección 3.2 cuando se confirmen).

---

## 5. Tensiones flagueadas (decisiones a futuro)

### 5.1 COGS Petify

A escala 100k MAU con 30% opt-in Paw Shield = 39k mascotas × USD 0.75 =
USD 29k/mes ≈ CLP 26.5M/mes COGS Petify. Modelo financiero F7 va a tener
que demostrar cómo se cubre con freemium 15% Paw Member + Manada 1-2% +
partners B2B firmados (pharma+seguros+retail).

### 5.2 Demo Insurance/Retail sin partner

Disclaimer "próximamente" en `/cotizar-seguro` y `/tienda` puede leerse como
vaporware si un inversionista revisa el producto en demo. Mitigación:
disclaimer debe decir explícitamente *"piloto en negociación con [partner
real en pipeline]"* — no genérico. Si todavía no hay partner real, queda
genérico hasta firmar.

### 5.3 Idea Petify hack-2-meses

Pedro propuso usar Petify primeros 2 meses por mascota, capturar data,
construir base propia. **Mi diagnóstico**: probablemente no funciona
técnicamente porque Petify no entrega embeddings raw (su IP). El plan
correcto sigue siendo el dual ya existente: Petify producto vendible HOY
+ archive de fotos para entrenar modelo propio cuando haya masa crítica
(ver [project_nose_print_master_plan](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_nose_print_master_plan.md)).

**Acción de bajo costo**: cuando hables con Johnny/Petify, preguntar si
API expone embeddings raw o endpoint `extractFingerprint(image)`. Si sí →
hay escenario híbrido viable.

---

## 6. Archivos cambiados en esta sesión

```
src/lib/featureFlags.ts                                        [editado]
src/lib/plans.ts                                               [editado · refactor 3 tiers]
src/components/PremiumGate.tsx                                 [creado]
src/pages/InsuranceQuotes.tsx                                  [editado · disclaimer]
src/pages/RetailStore.tsx                                      [editado · disclaimer]
supabase/migrations/20260929000000_manada_fondo_refugios.sql   [creado]
CLAUDE.md                                                      [editado · sección 5]
docs-raiz/pitch/MODELO_V2_2026_04_22.md                        [editado · addendum]
docs/audit/cleanup-fase1.md                                    [creado · este doc]
+ 25 archivos editados por agente rename donaciones→aportes:
  src/pages/Donaciones.tsx, PawCore.tsx, Transparencia.tsx,
  PawMember.tsx, PrivacyPolicy.tsx, TermsOfService.tsx, Profile.tsx,
  Home.tsx, PawMemberSuccess.tsx, RefugiosHogares.tsx,
  RefugioPublico.tsx, ParaVeterinarios.tsx, ExportarMisDatos.tsx,
  FAQ.tsx, OnboardingShelter.tsx, shelter/ShelterDashboard.tsx,
  shelter/ShelterProfile.tsx,
  src/components/EmptyStateIllustration.tsx, ViewTutorial.tsx,
  PawVoicesWall.tsx, BecomeShelterDialog.tsx, AppSidebar.tsx,
  landing/LandingHeader.tsx, landing/AlmaSection.tsx,
  DonationsTransparency.tsx, DonorBadge.tsx,
  pricing/PlanComparisonTable.tsx, pawgame/PawShopRewards.tsx,
  src/content/blog/cuanto-cuesta-tener-perro-primer-ano-chile.tsx,
  supabase/functions/send-donation-thanks/index.ts,
  supabase/functions/flow-create-donation/index.ts,
  supabase/functions/send-shelter-welcome/index.ts,
  public/paw-friend-assets-v2/email/welcome_dueno.html,
  public/paw-friend-assets-v2/email/donation_thanks.html,
  public/pitch/recorrido.html, companys.html, inversionistas.html,
  shelter.html
```

Total: ~36 archivos editados/creados.

---

**Siguiente sesión** debería continuar:
1. Review reporte agente background (wire PremiumGate + hooks deprecated + edge fns telemetry).
2. Update página `/paw-member` con 3 tiers.
3. Update 4 decks pitch.
4. Cleanup #5-7.
5. Fases v5 (3, 5, 4, 6, 7, 8, 9, 10).

Pedro: revisar este doc + ejecutar acciones manuales sección 4 antes de mergear.
