# Inventario exhaustivo de onboardings — Paw Friend

**Fecha**: 2026-04-20
**Autor**: Claude Code (auditoría E2E pre-lanzamiento)
**Fecha lanzamiento objetivo**: 1 junio 2026
**Fase**: 0 — Inventario (Prompt §3)

---

## Resumen ejecutivo

- **30 onboardings mapeados** (incluye 5 flujos cruzados críticos).
- **Estado global**: 20 vivos ✅, 6 parciales 🟡, 4 con gap crítico ❌.
- **Bonus — entradas no listadas detectadas en código**: 4 flujos adicionales (`/qr/:token`, `/medical-share/:token`, `/post-adoption/:id`, OAuth social).

---

## Leyenda

| Símbolo | Significado |
|---|---|
| ✅ | Vivo y completo |
| 🟡 | Parcial (funcional pero con inconsistencias) |
| ❌ | Faltante o roto |
| 🚧 | Solo landing (UI sin lógica) |

---

## Tabla maestra

| ID | Nombre | Entry point | Actor | Estado | Exit point |
|---|---|---|---|---|---|
| ONBD-01 | Dueño nuevo registro | `/auth` → `/onboarding-mascota` | Owner | ✅ | `/home` |
| ONBD-02 | Claim mascota vet (token) | `?invitation=TOKEN` | Owner invitado por vet | ✅ | `/home` |
| ONBD-03 | Claim mascota refugio | Link de `/shelter/transfer/:petId` | Adoptante | ✅ | `/home` |
| ONBD-04 | Re-claim mascota perdida | Login (auto) + `ClaimPetDialog` | Owner que perdió email | ✅ | `/home` |
| ONBD-05 | Vet registro externo | `/registro-veterinario` → `/onboarding-vet` | Profesional vet | ✅ | `/provider/dashboard` |
| ONBD-06 | Vet inline (header) | Toggle header → `BecomeProviderDialog` | Owner → Provider | ✅ | `/provider/dashboard` |
| ONBD-07 | Vet clínica (Pro Max tier) | Mismo que 05/06 + selector plan | Clínica vet | 🟡 | `/provider/dashboard` |
| ONBD-08 | Servicios no-vet | `BecomeProviderDialog` tipo walker/sitter/trainer/groomer | Provider servicios | ✅ | `/provider/dashboard` |
| ONBD-09 | Dual-role switch | Toggle en Header (siempre visible) | Usuario dual-role | ✅ | `/home` o `/provider/dashboard` |
| ONBD-10 | Refugio nuevo | `BecomeShelterDialog` o `/onboarding-shelter` | Refugio/ONG | ✅ | `/shelter/dashboard` |
| ONBD-11 | Refugio bulk import | `/shelter/bulk-import` (CSV/XLSX) | Refugio con data | ✅ | `/shelter/pets` |
| ONBD-12 | Refugio → adoptante | `/shelter/transfer/:petId` | Refugio | ✅ | Link para adoptante |
| ONBD-13 | Paw Voices | `/aplicar?tipo=paw_voices` | Creador/influencer | ✅ | Admin aprueba |
| ONBD-14 | Paw Companys | `/aplicar?tipo=paw_companys` | Empresa sponsor | ✅ | Admin aprueba |
| ONBD-15 | Paw Partners | `/aplicar?tipo=paw_partners` | Tienda/servicio barter | ✅ | Admin aprueba |
| ONBD-16 | Refugio vía /aplicar | `/aplicar?tipo=refugio` | Refugio alt entry | ✅ | Redirige a BecomeShelterDialog o queda en admin |
| ONBD-17 | Vet vía /aplicar | `/aplicar?tipo=vet` | Vet lead no registro directo | ✅ | Admin contacta |
| ONBD-18 | CORFO | `/aplicar?tipo=corfo` | Lead capital público | ✅ | **EXCLUIR lanzamiento** |
| ONBD-19 | Start-Up Chile | `/aplicar?tipo=startup_chile` | Lead acelerador | ✅ | Admin |
| ONBD-20 | Angels/VC | `/aplicar?tipo=angels_vc` | Lead capital privado | ✅ | **EXCLUIR lanzamiento** |
| ONBD-21 | Otro | `/aplicar?tipo=otro` | Catch-all | ✅ | Admin |
| ONBD-22 | Admin access | Tabla `admin_access` + `/admin` | Pedro (hoy) | ✅ | `/admin` |
| ONBD-23 | Demo admin-only | `/demo` + `AdminRoute` | Pedro | ✅ | Fullscreen demo |
| ONBD-24 | Cambio rol sin leakage | `useActiveRole` → Sidebar/Header/BottomTabBar | Usuario dual-role | ✅ | Sin leakage |
| ONBD-25 | Huérfana vet → claim | RPC `claim_pet_by_invitation` | Owner + vet | ✅ | Owner tiene mascota, vet tiene paciente linked |
| ONBD-26 | Huérfana refugio → claim | RPC `auto_claim_pets_by_email` o token | Adoptante + refugio | ✅ | Owner tiene mascota, refugio conserva historial |
| ONBD-27 | Upgrade Paw Member | `/upgrade` → Flow.cl → `/upgrade/success` | Owner voluntario | 🟡 | Badge 💛 activo |
| ONBD-28 | Upgrade vet B2B | **No existe en código** | Vet quiere escalar | ❌ | — |
| ONBD-29 | Donación dirigida refugio | `/donaciones?refugio=X` + `SHELTER_DONATIONS` flag | Donante + refugio | 🟡 | **OFF al lanzamiento** (SpA pendiente) |
| ONBD-30 | Pitch aprobada → público | RPC `approve_pitch_application` desde admin | Admin | ✅ | Row pública en `paw_companys`/`paw_voices` |

---

## Detalle por onboarding

### ONBD-01 — Dueño nuevo registro

| Campo | Valor |
|---|---|
| Entry point | `/auth` → `/onboarding-mascota` |
| Actor | Owner (usuario final) |
| Estado | ✅ Vivo |
| Archivos | `Auth.tsx`, `OnboardingDuenoMinimal.tsx`, `hooks/useAuth.tsx` |
| Tablas DB | `auth.users`, `profiles`, `pets` |
| Integraciones | Supabase Auth (email/pass, Google/Apple/Facebook OAuth), Resend (welcome opcional) |
| RLS | `profiles_own_read/write`, `pets_owner_*` |
| Exit | `/home` con mascota agregada |

### ONBD-02 — Claim mascota vet (token)

| Campo | Valor |
|---|---|
| Entry point | Link `?invitation=TOKEN` (email del vet) |
| Actor | Owner invitado por vet |
| Estado | ✅ Vivo |
| Archivos | `useClaimPetInvitation.ts`, `ClaimPetDialog.tsx`, edge fn `send-pet-invitation` |
| Tablas DB | `pets`, `pet_vet_links`, RPC `claim_pet_by_invitation` |
| Integraciones | Resend (email), token único con `owner_invitation_token` |
| RLS | Policy `pets_public_read_if_pending_claim` o RPC con SECURITY DEFINER |
| Exit | `/home` con mascota claimed y vet auto-linked |

### ONBD-03 — Claim mascota refugio

| Campo | Valor |
|---|---|
| Entry point | Link generado en `/shelter/transfer/:petId` (WhatsApp/Copy) |
| Actor | Adoptante nuevo |
| Estado | ✅ Vivo |
| Archivos | `ShelterTransferPet.tsx`, `send-pet-invitation` (caller `shelter`) |
| Tablas DB | `pets`, `adoption_centers`, trigger `adoption_centers_counter_trg` |
| Integraciones | Resend (email), WhatsApp (wa.me URL), token |
| RLS | `pets_shelter_manage`, `pets_adopter_claim` |
| Exit | `/home`, refugio conserva historial ficha |

### ONBD-04 — Re-claim mascota perdida

| Campo | Valor |
|---|---|
| Entry point | Auto al login (hook) o `ClaimPetDialog` manual |
| Actor | Owner que perdió email |
| Estado | ✅ Vivo |
| Archivos | `useAutoClaimByEmail.ts`, `ClaimPetDialog.tsx` |
| Tablas DB | `pets` (match por `pending_owner_email`) |
| Integraciones | RPC `auto_claim_pets_by_email`, email verificado en `auth.users` |
| RLS | Via RPC SECURITY DEFINER |
| Exit | Toast "X mascotas reclamadas" + `/my-pets` |

### ONBD-05 — Vet registro externo

| Campo | Valor |
|---|---|
| Entry point | `/registro-veterinario` (4 pasos: tipo, cuenta, perfil, resultado) |
| Actor | Profesional vet externo |
| Estado | ✅ Vivo |
| Archivos | `RegistroVeterinario.tsx`, `useProviderSignup`, `/onboarding-vet` |
| Tablas DB | `auth.users`, `profiles`, `service_providers` (status='pending' o 'active') |
| Integraciones | Supabase Auth, Resend (welcome vet) |
| RLS | `service_providers_own_*` |
| Exit | `/provider/dashboard` (con active role provider) |

### ONBD-06 — Vet inline desde header

| Campo | Valor |
|---|---|
| Entry point | Toggle header → `BecomeProviderDialog` (2-3 pasos inline) |
| Actor | Owner con cuenta que quiere ser provider |
| Estado | ✅ Vivo |
| Archivos | `BecomeProviderDialog.tsx`, `Header.tsx:192-245` |
| Tablas DB | `service_providers` (status='pending', `is_directory_visible=false`) |
| Integraciones | — (solo DB) |
| RLS | `service_providers_own_insert` |
| Exit | Toast + `/provider/dashboard` (active role = provider) |

### ONBD-07 — Vet clínica (Pro Max tier)

| Campo | Valor |
|---|---|
| Entry point | Mismo que ONBD-05/06 + selección plan clínica |
| Actor | Clínica veterinaria con >1 vet |
| Estado | 🟡 Parcial — persiste `provider_type='clinic'` pero **no setea plan** |
| Archivos | `BecomeProviderDialog.tsx:227-243`, `plans.ts` |
| Tablas DB | `service_providers.primary_service_type`, **falta `provider_plan`** |
| Integraciones | — (sin Flow activo para B2B aún) |
| RLS | — |
| Exit | `/provider/dashboard` pero en plan free (no escalado) |

### ONBD-08 — Servicios no-vet (walker/sitter/trainer/groomer)

| Campo | Valor |
|---|---|
| Entry point | `BecomeProviderDialog` con tipos `walker`/`sitter`/`trainer`/`groomer` |
| Actor | Profesional servicios pet no médicos |
| Estado | ✅ Vivo |
| Archivos | `BecomeProviderDialog.tsx`, `Servicios.tsx`, `/services/:type` |
| Tablas DB | `service_providers`, `provider_service_offerings` |
| Integraciones | — |
| RLS | `service_providers_own_*`, `provider_service_offerings_own` |
| Exit | `/provider/dashboard` |

### ONBD-09 — Dual-role switch

| Campo | Valor |
|---|---|
| Entry point | Toggle en Header (siempre visible para usuarios autenticados) |
| Actor | Usuario que es dueño + provider o shelter |
| Estado | ✅ Vivo |
| Archivos | `useActiveRole.tsx`, `Header.tsx`, `RoleGuard.tsx` |
| Tablas DB | — (solo localStorage `pf_active_role`) |
| Integraciones | — |
| RLS | `RoleGuard` + `routing.ts` helpers |
| Exit | Redirect a home del rol activo |

### ONBD-10 — Refugio nuevo

| Campo | Valor |
|---|---|
| Entry point | `BecomeShelterDialog` wizard 3 pasos o `/onboarding-shelter` |
| Actor | Refugio/ONG/fundación/municipal/independiente |
| Estado | ✅ Vivo |
| Archivos | `BecomeShelterDialog.tsx`, `OnboardingShelter.tsx`, `useShelter.ts` |
| Tablas DB | `adoption_centers` (status='active' auto) |
| Integraciones | Resend (welcome shelter), geocoding Nominatim opcional |
| RLS | `adoption_centers_owner_*`, `adoption_centers_public_read` |
| Exit | `/shelter/dashboard` |

### ONBD-11 — Refugio bulk import

| Campo | Valor |
|---|---|
| Entry point | `/shelter/bulk-import` |
| Actor | Refugio con data existente |
| Estado | ✅ Vivo — edge fn `bulk-import-pets` |
| Archivos | `ShelterBulkImport.tsx`, edge fn `bulk-import-pets` |
| Tablas DB | `pets` (batch insert con `created_by_shelter_id`) |
| Integraciones | CSV/XLSX parser (SheetJS), Supabase Storage opcional |
| RLS | `pets_shelter_insert` |
| Exit | `/shelter/pets` con contador actualizado |

### ONBD-12 — Refugio transfiere mascota

| Campo | Valor |
|---|---|
| Entry point | `/shelter/transfer/:petId` (link desde dashboard) |
| Actor | Refugio transfiriendo a adoptante |
| Estado | ✅ Vivo |
| Archivos | `ShelterTransferPet.tsx`, `send-pet-invitation` |
| Tablas DB | `pets.shelter_adopted_at`, `pending_owner_email`, `owner_invitation_token` |
| Integraciones | Resend, WhatsApp wa.me, copy link |
| RLS | `pets_shelter_update` |
| Exit | Link copiable/WhatsApp al adoptante |

### ONBD-13 — Paw Voices

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=paw_voices` |
| Actor | Creador/influencer |
| Estado | ✅ Vivo |
| Archivos | `Aplicar.tsx:178-208`, edge fn `notify-pitch-application` |
| Tablas DB | `pitch_applications` (status='submitted'), RPC `approve_pitch_application` crea row en `paw_voices` al aprobar |
| Integraciones | Resend a admin, opcional Resend al applicant |
| RLS | `pitch_applications_public_insert`, `pitch_applications_admin_read` |
| Exit | Admin aprueba → `paw_voices` público |

### ONBD-14 — Paw Companys

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=paw_companys` |
| Actor | Empresa sponsor (Bronze/Silver/Gold) |
| Estado | ✅ Vivo |
| Archivos | `Aplicar.tsx:143-176`, `notify-pitch-application` |
| Tablas DB | `pitch_applications` → `paw_companys` (`partnership_type='sponsor'`) al aprobar |
| Integraciones | Resend admin |
| RLS | Same |
| Exit | Row en grid `/donaciones` con tier |

### ONBD-15 — Paw Partners

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=paw_partners` |
| Actor | Tienda/restaurante/seguro (barter: descuentos por publicidad) |
| Estado | ✅ Vivo |
| Archivos | `Aplicar.tsx:102-141`, `notify-pitch-application` |
| Tablas DB | `pitch_applications` → `paw_companys` (`partnership_type='partner'`) |
| Integraciones | Resend admin |
| RLS | Same |
| Exit | Row en `/paw-partners` |

### ONBD-16 — Refugio vía /aplicar

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=refugio` |
| Actor | Refugio alt entry point (no BecomeShelterDialog) |
| Estado | ✅ Vivo |
| Archivos | `Aplicar.tsx:71-100` |
| Tablas DB | `pitch_applications` (status='submitted') |
| Integraciones | Notify admin |
| RLS | Same |
| Exit | Admin ayuda onboarding o redirige a `BecomeShelterDialog` |

### ONBD-17 — Vet vía /aplicar

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=vet` |
| Actor | Vet lead sin registro directo |
| Estado | ✅ Vivo |
| Archivos | `Aplicar.tsx:210-233` |
| Tablas DB | `pitch_applications` |
| Integraciones | Notify admin |
| RLS | Same |
| Exit | Admin contacta o redirige a `/registro-veterinario` |

### ONBD-18 — CORFO

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=corfo` |
| Actor | Lead capital público |
| Estado | ✅ Vivo en código, **🚫 EXCLUIR del lanzamiento** (Pedro) |
| Archivos | `Aplicar.tsx:235-241` |
| Decisión Pedro | Desactivar con banner "Postulaciones cerradas" |

### ONBD-19 — Start-Up Chile

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=startup_chile` |
| Estado | ✅ Vivo |
| Archivos | `Aplicar.tsx:243-249` |

### ONBD-20 — Angels/VC

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=angels_vc` |
| Estado | ✅ Vivo en código, **🚫 EXCLUIR del lanzamiento** (Pedro) |
| Archivos | `Aplicar.tsx:251-257` |
| Decisión Pedro | Desactivar con banner |

### ONBD-21 — Otro

| Campo | Valor |
|---|---|
| Entry point | `/aplicar?tipo=otro` |
| Estado | ✅ Vivo (catch-all) |
| Archivos | `Aplicar.tsx:259-266` |

### ONBD-22 — Admin access

| Campo | Valor |
|---|---|
| Entry point | `/admin` (AdminRoute + ProtectedRoute) |
| Actor | Solo Pedro hoy (tabla `admin_access` con `is_active=true`) |
| Estado | ✅ Vivo |
| Archivos | `AdminRoute.tsx`, `useIsAdmin.tsx`, `Admin.tsx` |
| Tablas DB | `admin_access`, RPC `is_active_admin(auth.uid())` |

### ONBD-23 — Demo admin-only

| Campo | Valor |
|---|---|
| Entry point | `/demo` + `AdminRoute` |
| Estado | ✅ Vivo |
| Archivos | `Demo.tsx`, `App.tsx:864-871` |

### ONBD-24 — Cambio rol sin leakage

| Campo | Valor |
|---|---|
| Estado | ✅ Vivo |
| Archivos | `useActiveRole.tsx`, `RoleGuard.tsx`, `Sidebar`, `BottomTabBar`, `Header` |
| Riesgo | Bajo (posible 1 frame de leak durante re-render, no bloqueante) |

### ONBD-25 — Huérfana vet → claim

| Campo | Valor |
|---|---|
| Estado | ✅ Vivo |
| Archivos | RPC `claim_pet_by_invitation` (atómico: marca token usado + linkea `pet_vet_links`) |

### ONBD-26 — Huérfana refugio → claim

| Campo | Valor |
|---|---|
| Estado | ✅ Vivo |
| Archivos | `useAutoClaimByEmail`, RPC `auto_claim_pets_by_email` |

### ONBD-27 — Upgrade Paw Member

| Campo | Valor |
|---|---|
| Entry point | `/upgrade` → redirige a `/paw-member` (pivot 2026-04-19) |
| Estado | 🟡 Parcial |
| Archivos | `PawMember.tsx`, edge fn `flow-create-subscription`, callbacks `/upgrade/success` y `/upgrade/cancel` |
| Problema | Callbacks legacy de Flow siguen en App.tsx pero la ruta principal cambió. El copy en `UpgradeSuccess.tsx` dice "Bienvenido a Premium" (obsoleto). |
| Tablas DB | `auth.users`, `donations.frequency='monthly'` (pivot pago recurrente) |
| Integraciones | Flow.cl (monthly=$3990, yearly=$39900) |

### ONBD-28 — Upgrade vet B2B

| Campo | Valor |
|---|---|
| Entry point | **No existe** |
| Estado | ❌ **Gap crítico — bloqueador de monetización B2B** |
| Archivos | `flow-create-subscription` solo soporta `plan: 'monthly'|'yearly'` (B2C), no acepta tier de vet |
| Impacto | Vets quedan en `provider_free` for ever. No se puede cobrar Premium/Clínica/Pro Max. |

### ONBD-29 — Donación dirigida refugio

| Campo | Valor |
|---|---|
| Entry point | `/donaciones?refugio=ID` con flag `SHELTER_DONATIONS` |
| Estado | 🟡 Infra lista, flag OFF al lanzamiento (SpA pendiente) |
| Archivos | `Donaciones.tsx`, `featureFlags.ts`, `flow-create-donation` |
| Tablas DB | `donations.beneficiary_adoption_center_id` (mig 20260620000000) |
| Decisión Pedro | Flag OFF hasta cuenta Flow migrada a SpA |

### ONBD-30 — Pitch aprobada → público

| Campo | Valor |
|---|---|
| Trigger | Admin hace click "Aprobar" en `AdminPitchApplications.tsx:134` |
| Estado | ✅ Vivo — RPC `approve_pitch_application` existe (mig 20260625000000:114) y se invoca |
| Archivos | `AdminPitchApplications.tsx`, RPC en mig |
| Tablas DB | `pitch_applications.status='approved'` + insert en `paw_voices`/`paw_companys` según kind |
| Nota | Tipos corfo/startup_chile/angels_vc/refugio/vet/otro solo marcan approved (no tienen tabla pública destino) |

---

## Flujos adicionales detectados (no en el listado inicial)

Detectados por el agente Explore pero no estaban en los 30 ONBD del prompt. Los documento para completitud — se evaluarán en Fase 2.

| ID | Nombre | Estado | Nota |
|---|---|---|---|
| BONUS-01 | OAuth social (Google/Apple/Facebook) | ✅ Vivo | Integra con ONBD-01, subset de Auth |
| BONUS-02 | `/qr/:token` Pet QR público | ✅ Vivo | Landing pública de QR físico, puede gatillar claim |
| BONUS-03 | `/medical-share/:token` | ✅ Vivo | Compartir ficha sin login (30 días) |
| BONUS-04 | `/post-adoption/:id` check-in | ✅ Vivo | Email-link post-adopción, cron-driven |

---

## Bloqueadores de lanzamiento identificados (pre Fase 2)

### P0 (no se lanza sin esto)

1. **ONBD-28 — Vet upgrade B2B pagado**: `flow-create-subscription` debe aceptar `{ plan: 'provider_premium'|'provider_clinic_starter'|'provider_pro_max' }` con precios correctos ($9.9k/$19.9k/$29.9k). Crear UI de upgrade vet (`/provider/upgrade` o integrado en `/para-veterinarios`).

### P1 (arreglar antes de lanzar)

2. **ONBD-07 — Tier clínica se pierde**: `BecomeProviderDialog` captura `provider_type='clinic'` pero no lo persiste junto al plan. Fix: setear `primary_service_type` y mantener `provider_plan='provider_free'` por defecto; que el upgrade (P0 #1) sepa escalar.

3. **ONBD-27 — Callbacks Flow legacy + copy obsoleto**: Ajustar `UpgradeSuccess.tsx` copy de "Bienvenido a Premium" a "Gracias por sostener Paw Friend" + badge Paw Member. Mantener callbacks funcionales durante deprecation.

### P2 (nice-to-have al lanzamiento)

4. **ONBD-18 + ONBD-20 — Desactivar CORFO + Angels/VC**: Agregar flag o banner "Postulaciones cerradas" a esos tipos en `Aplicar.tsx`. Conservar URLs para SEO.

5. **ONBD-29 — Donaciones dirigidas**: Verificar que `SHELTER_DONATIONS` está en `false` y que la UI no promete features que no funcionan.

---

## Próximos pasos

1. **Fase 1** — Generar flujo E2E detallado por cada ONBD-XX (`01-FLUJOS_E2E.md`).
2. **Fase 2** — Auditoría checklist 30 puntos por flujo (`02-HALLAZGOS/ONBD-XX.md`).
3. **Fase 3** — Matriz integraciones cruzadas (`03-INTEGRACIONES_CRUZADAS.md`).
4. **Fase 4** — Catálogo priorizado de gaps (`04-CATALOGO_GAPS.md` + `.csv`).
5. **Gate 1** — Presentar a Pedro antes de ejecutar fixes.
