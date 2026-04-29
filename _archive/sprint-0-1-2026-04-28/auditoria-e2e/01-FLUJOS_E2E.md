# Flujos E2E por onboarding — Paw Friend

**Fase 1 del prompt auditoría** — detalle paso a paso por ONBD.

> Los 10 flujos más críticos (P0/P1) se detallan completos. El resto queda en formato compacto (los pasos son análogos al template).

---

## Template base (todos los flujos)

```
Pre-condiciones → Trigger → Pasos happy path → Side effects → Exit state
                                ↓
                        Variantes unhappy path
                                ↓
                        Sync points críticos
                                ↓
                        Mensajes al usuario (UI + email + WA)
```

---

## ONBD-01 — Dueño nuevo registro

**Pre**: Usuario sin cuenta. **Trigger**: click "Empezar" en `/` o navegar a `/auth`.

**Happy path**:
1. `/auth` — elige Email+password o OAuth (Google/Apple/Facebook).
2. Supabase Auth crea `auth.users`, trigger `handle_new_user` crea row en `profiles`.
3. Redirect a `/onboarding-mascota` (OnboardingDuenoMinimal.tsx).
4. Paso 1: nombre mascota, especie, raza opcional, birth_date → `pets` insert con `owner_id=user.id`, `lifecycle_status='active'`.
5. Paso 2 (opcional): upload foto → Supabase Storage `pets/{pet_id}/main.jpg`.
6. Paso 3: tour rápido (explicar ficha, vets, recordatorios) → CTA "Ir a home".
7. Redirect `/home` con `hasPets=true`.
8. Side effect: trigger `notify_new_pet_drip_d0` dispara `send-new-pet-drip` (email welcome D0).

**Unhappy paths**:
- Email ya existe → toast "Ya tienes cuenta, ¿quieres recuperar password?"
- OAuth cancelado → se queda en `/auth` sin estado raro.
- Red cae durante insert pet → pet no se crea, toast retry.
- Skip onboarding → `/home` con empty state "Agrega tu primera mascota".

**Sync points**:
- Trigger `handle_new_user` debe correr antes de que el frontend intente leer `profiles` (verificar con RLS).
- Trigger D0 drip requiere `owner_id IS NOT NULL` y `lifecycle_status='active'` (ya valida).

**Mensajes**:
- Toast éxito: "Bienvenido a Paw Friend" + "Tu mascota está lista"
- Email D0: template de welcome (aún no leído — verificar copy chileno)
- Error: "No pudimos crear tu cuenta, intenta de nuevo"

---

## ONBD-02 — Claim mascota vet (token)

**Pre**: Vet creó pet orfana via `NewPatientForm`, se envió email con `owner_invitation_token`. **Trigger**: dueño abre link `/auth?invitation=TOKEN` o `/claim?invitation=TOKEN`.

**Happy path**:
1. Link contiene `?invitation=<uuid>`. `useClaimPetInvitation` lee query.
2. Si no autenticado → redirige a `/auth?invitation=TOKEN` (preserva token).
3. Usuario se registra/logea. Al llegar al `AuthCallback`, detecta invitation pending.
4. Llama RPC `claim_pet_by_invitation(p_token, p_user_id)`:
   - Valida token no expirado y no usado.
   - `UPDATE pets SET owner_id=user_id, pending_owner_email=NULL, owner_invitation_token=NULL, invitation_accepted_at=NOW()`.
   - `INSERT INTO pet_vet_links (pet_id, vet_id, source='invitation_claimed')` si `created_by_vet_id` existía.
   - Commit atómico.
5. Toast "Tu mascota fue agregada" + redirect `/home`.

**Unhappy paths**:
- Token expirado (>30d) → toast "Link expirado, pide uno nuevo a tu vet".
- Token ya usado → toast "Este link ya fue utilizado".
- Email del token no coincide con user → proceder igual (el token es la autoridad; email es referencia).
- Usuario cierra mitad del signup → volver con el link funciona.
- Vet fue eliminado → link sigue usable pero sin `pet_vet_links`.

**Sync points**:
- RPC atómico (no dejar `pets.owner_id` set sin borrar `owner_invitation_token`).
- Vet que originó debe ver "paciente activo" en dashboard INMEDIATAMENTE (realtime subscribe o refetch).

**Mensajes**:
- Email vet → dueño: Template `invitation-email.ts` con `sourceKind='vet'`.
- Toast: "Agregamos a {petName} a tu cuenta"
- Error: "Este link ya no es válido"

---

## ONBD-03 — Claim mascota refugio

**Pre**: Refugio creó pet + gatilló transfer en `/shelter/transfer/:petId`. **Trigger**: adoptante abre link WhatsApp/email.

**Happy path**:
1. Mismo flujo que ONBD-02 (usa mismo `useClaimPetInvitation` + RPC).
2. Email template: `sourceKind='shelter'`, copy dice "Te adoptamos a {petName} en {refugio}".
3. Al claim: trigger `shelter_pets_counter_trg` decrementa `adoption_centers.total_pets_in_care` y incrementa `total_pets_adopted`.
4. Refugio conserva historial ficha (ve pet en `/shelter/pets` tab "Adoptadas").

**Unhappy paths**:
- Adoptante rechaza (no abre link) → pet sigue con `shelter_adopted_at=NULL`, refugio puede re-transferir.
- Refugio cancela transferencia → `UPDATE pets SET pending_owner_email=NULL, shelter_adopted_at=NULL` manual desde dashboard.

**Sync points**:
- Trigger `adoption_centers_counter_trg` debe correr (mig 20260620000000).
- Refugio debe ver status cambiar a "adoptada" en tiempo real o con refetch post-claim.

---

## ONBD-05 — Vet registro externo

**Pre**: Vet sin cuenta. **Trigger**: click "Soy veterinario" en landing → `/registro-veterinario`.

**Happy path**:
1. Paso 1: Tipo (individual/domicilio/clínica) → guarda en state.
2. Paso 2: Email + password → Supabase Auth signup.
3. Paso 3: Bio, especialidades, comuna, license_number (opcional).
4. Zod valida → `service_providers` insert con `status='pending'`, `is_directory_visible=false`, `provider_plan='provider_free'`.
5. Redirect `/onboarding-vet` (tour 3 slides) → `/provider/dashboard`.
6. Side effect: `useActiveRole.setRole('provider')` → localStorage actualizado.
7. Email welcome a vet (Resend) con link al dashboard + CTA activar directorio.

**Unhappy paths**:
- Email ya en uso como owner → puede seguir (mismo user, rol adicional). **Verificar en Fase 2**.
- Zod falla (license_number inválido) → error inline.
- Insert falla por RLS → toast retry.

**Sync points**:
- Después de signup, `useAuth` debe refetch session antes de RoleGuard activar provider.
- Directorio no muestra al vet hasta admin verificar (`verified=true`).

**Mensajes**:
- Email welcome vet: template ¿existe? Verificar en `supabase/functions/` si hay `send-vet-welcome` o se deja al trigger `handle_new_user` genérico.

---

## ONBD-10 — Refugio nuevo

**Pre**: Usuario logueado (owner). **Trigger**: click "Soy refugio" → abre `BecomeShelterDialog` wizard.

**Happy path**:
1. Paso 1: tipo (ong/fundacion/refugio/independiente/municipal) + legal_name + rut opcional.
2. Paso 2: comuna + región + address + capacity + contact email/phone/website.
3. Paso 3: mission (textarea), animal_types (checkbox perros/gatos/otros), checkbox `accepts_donations` (con disclaimer SHELTER_DONATIONS OFF).
4. Submit → `INSERT INTO adoption_centers` con `user_id=auth.uid()`, `status='active'`, `verified=false`.
5. Trigger `adoption_centers_ensure_slug` genera slug único (si legal_name="Refugio X" → slug="refugio-x", +"-2" si colisión).
6. `useActiveRole.setRole('shelter')` → redirect `/shelter/dashboard`.
7. Side effect: edge fn `send-shelter-welcome` (trigger `shelter_welcome_trigger`) envía email con checklist 4 pasos.

**Unhappy paths**:
- User ya tiene `adoption_centers` (UNIQUE user_id) → toast "Ya tienes un refugio creado" + redirect `/shelter/dashboard`.
- Datos inválidos (rut, email) → zod inline.
- Slug colision → auto-incremento (refugio-x-2, refugio-x-3).

**Sync points**:
- Trigger slug corre BEFORE INSERT.
- Trigger welcome corre AFTER INSERT.
- Admin panel `AdminShelters.tsx` debe mostrar el nuevo refugio con status='active'.

---

## ONBD-13 — Paw Voices (aplicar)

**Pre**: Público (no requiere login). **Trigger**: navega `/aplicar?tipo=paw_voices` desde `/paw-voices` o footer.

**Happy path**:
1. Form dinámico en `Aplicar.tsx` según `KIND_CONFIG[paw_voices]`: nombre, handle instagram/tiktok, followers, tipo de contenido, email, mensaje.
2. Zod valida. Rate limit via trigger BEFORE INSERT en DB (máx 3/24h por email, dedup mismo kind+email).
3. `INSERT INTO pitch_applications (kind='paw_voices', status='submitted', ...)`.
4. Trigger `pitch_applications_notify_trg` invoca edge fn `notify-pitch-application` → email a `pedrosusaeta@pawfriend.cl` con CTA al admin panel.
5. Toast "Postulación enviada" + redirect a `/paw-voices` o landing agradecimiento.

**Variantes**:
- Duplicado (mismo kind+email) → trigger raise, error custom "Ya tienes una postulación pendiente".
- Rate limit alcanzado → error "Demasiadas postulaciones recientes, intenta en 24h".
- Edge fn notify cae → insert sigue OK, admin descubre al entrar al panel.

**Sync points**:
- Admin ve en `Admin > Sistema > Postulaciones` casi inmediato.
- Aprobación (RPC `approve_pitch_application`) crea row en `paw_voices` + cambia status='approved'.

---

## ONBD-14 — Paw Companys (aplicar)

Idéntico a ONBD-13 pero `kind='paw_companys'`, campos incluyen `tier` (Bronze/Silver/Gold), y aprobación crea row en `paw_companys` con `partnership_type='sponsor'`.

---

## ONBD-15 — Paw Partners

Idéntico pero `kind='paw_partners'`. Aprobación crea row en `paw_companys` con `partnership_type='partner'`.

---

## ONBD-27 — Upgrade Paw Member (Flow.cl B2C)

**Pre**: Owner logueado sin badge. **Trigger**: click "Hazte Paw Member" en `/paw-member` o `/home` widget.

**Happy path**:
1. Navega `/paw-member` (antes `/upgrade`).
2. Click "Suscribirme" → llama edge fn `flow-create-subscription` con `{ plan: 'monthly' }` o `{ plan: 'yearly' }`.
3. Edge fn:
   - Valida JWT, user_id, email.
   - Rate limit 10/h (RPC `check_and_increment_payment_quota`).
   - Crea order en Flow.cl con HMAC-SHA256 signed params.
   - `return_url` = `https://pawfriend.cl/payment-result?source=flow`
   - Devuelve `{ url, token }`.
4. Redirect user a URL Flow.
5. Usuario paga en Flow.
6. Flow webhook → edge fn `flow-webhook` (verify_jwt=false) valida signature, busca `orders` row, actualiza `donations` row con `status='paid'`, `frequency='monthly'`, `paid_at=NOW()`.
7. Flow redirige al user a `/payment-result?status=success&token=X`.
8. `/payment-result` llama RPC `verify_flow_payment_status(token)`, muestra resultado.
9. Badge "Paw Member 💛" activo via query `useMyDonationStats` (>0 total).

**Unhappy paths**:
- Usuario abandona en Flow → sin side effect, puede volver a intentar.
- Pago falla en Flow → callback con status='failed' → toast "Pago no completado".
- Webhook no llega (Flow caído) → cron `reconcile-flow-pending` (¿existe?) debería retry.
- Rate limit (10/h) → toast "Demasiados intentos, espera 1 hora".

**Problemas identificados (Fase 0)**:
- `UpgradeSuccess.tsx` copy dice "Bienvenido a Premium" (obsoleto, ahora es Paw Member).
- Rutas `/upgrade/success` y `/upgrade/cancel` aún en App.tsx pero `/upgrade` redirige a `/paw-member`.

**Sync points**:
- `donations` row debe crearse ANTES del redirect a Flow (para poder matchear webhook).
- Badge activation es query reactiva (no requiere trigger explícito).

---

## ONBD-28 — Upgrade vet B2B (**NO EXISTE**)

**Pre**: Vet logueado, plan actual `provider_free`. **Trigger**: click "Upgrade a Premium" en `/provider/dashboard` o `/para-veterinarios`.

**Estado actual**: ❌ **No hay UI ni edge fn ni RPC**.

**Happy path esperado (diseño propuesto)**:
1. Navega `/provider/upgrade` o abre modal desde dashboard.
2. Muestra 4 tiers: Básica ($0, sin checkout), Premium ($9.900), Clínica ($19.900), Pro Max ($29.900).
3. Click tier → llama edge fn `flow-create-subscription` con `{ plan: 'provider_premium' }`.
4. Edge fn debe soportar nuevos plans:
   - Agregar al `PRICES`: `provider_premium: 9900, provider_clinic_starter: 19900, provider_pro_max: 29900`.
   - Marcar order con `order_type='b2b_vet'` para distinguir en webhook.
5. Flujo idéntico a ONBD-27 pero al confirmar pago:
   - `UPDATE service_providers SET provider_plan='provider_premium', plan_started_at=NOW() WHERE user_id=...`
6. Redirect `/provider/dashboard?upgraded=true` con toast.

**Migración necesaria**:
- `service_providers.plan_started_at TIMESTAMPTZ`
- `service_providers.plan_expires_at TIMESTAMPTZ` (30d post pago mensual)
- Cron mensual `downgrade_expired_vet_plans` (si no paga mes siguiente → vuelve a `provider_free`).

**Bloqueador**: sin esto, Premium/Clínica/Pro Max son vaporware. Features limitadas por plan (bulk import clinic, multi-branch pro_max) nunca se activan porque ningún vet está en esos planes.

---

## ONBD-30 — Pitch aprobada → público

**Pre**: Admin (Pedro) logueado. **Trigger**: click "Aprobar" en `AdminPitchApplications.tsx`.

**Happy path**:
1. Admin revisa form details en modal.
2. Click "Aprobar con notas opcionales".
3. Frontend llama `supabase.rpc('approve_pitch_application', { p_application_id, p_notes })` (AdminPitchApplications.tsx:134).
4. RPC (migraciones):
   - Valida `is_active_admin(auth.uid())`.
   - Según `kind`:
     - `paw_voices` → `INSERT INTO paw_voices (display_name, handle, followers, ...) SELECT ... FROM pitch_applications WHERE id=p_application_id`.
     - `paw_companys` o `paw_partners` → `INSERT INTO paw_companys (name, partnership_type, tier, ...)`.
     - Otros (corfo/startup_chile/angels_vc/refugio/vet/otro) → solo marca approved (no destino público, son leads internos).
   - `UPDATE pitch_applications SET status='approved', approved_at=NOW(), admin_notes=p_notes`.
5. Frontend refetch lista, toast "Aprobada".
6. Aplicante queda público en `paw_voices`/`paw_companys` grid.

**Unhappy paths**:
- RPC falla (RLS) → toast error admin.
- Approved 2x (admin re-aprueba por error) → INSERT duplicado en destino. Verificar UNIQUE constraint en `paw_voices.handle` o `paw_companys.name`.

**Sync points**:
- `/donaciones` PawCompanysGrid debe refetch automático o ver cambio al F5.

---

## Flujos compactos (resto)

### ONBD-04 — Re-claim mascota perdida
Login → hook `useAutoClaimByEmail` dispara RPC `auto_claim_pets_by_email(auth.uid(), auth.email())`. Si hay pets con `pending_owner_email=user.email` → se reclaman. Botón manual `ClaimPetDialog` en `/my-pets`.

### ONBD-06 — Vet inline header
Owner → header toggle → dialog → paso 1 (tipo) + paso 2 (perfil) → insert `service_providers` → `setRole('provider')` → `/provider/dashboard`. Sin email welcome (asume ya es user existente).

### ONBD-07 — Vet clínica (Pro Max tier)
Mismo que 05/06 + eligió `provider_type='clinic'`. **Hoy persiste primary_service_type pero NO setea plan** — queda en `provider_free`. Requiere ONBD-28 implementado para poder escalar.

### ONBD-08 — Servicios no-vet
`BecomeProviderDialog` → tipos walker/sitter/trainer/groomer → insert + crear `provider_service_offerings` default. Custom fields groomer (especialidad de corte). Sin registro externo landing.

### ONBD-09 — Dual-role switch
Toggle Header → `useActiveRole.setRole(x)` → localStorage `pf_active_role` → redirect home del rol → RoleGuard valida cada ruta.

### ONBD-11 — Refugio bulk import
`/shelter/bulk-import` → upload CSV/XLSX → edge fn `bulk-import-pets` parsea con SheetJS → valida columnas (name, species, sex, birth_date, description) → batch insert con `created_by_shelter_id=shelter.id`. Report: X éxitos, Y errores.

### ONBD-12 — Refugio transfiere
`/shelter/transfer/:petId` → form email adoptante + mensaje → genera token + update pet → UI con link copiable + botón WhatsApp.

### ONBD-16 — Refugio vía /aplicar
Alt entry point. Form simple → `pitch_applications` kind='refugio'. Admin contacta para onboarding real con `BecomeShelterDialog` o confirma registro propio. No crea `adoption_centers` automático.

### ONBD-17 — Vet vía /aplicar
Lead no registro. Form → admin contacta → vet procede a `/registro-veterinario`.

### ONBD-18 — CORFO (**DESACTIVAR**)
Form → insert `pitch_applications kind='corfo'`. **Pedro: agregar banner "Postulaciones cerradas" en UI para ocultar el botón submit**.

### ONBD-19 — Start-Up Chile
Form estándar → insert kind='startup_chile'.

### ONBD-20 — Angels/VC (**DESACTIVAR**)
Igual. **Banner "Ronda no abierta"**.

### ONBD-21 — Otro
Catch-all. Form con `message` libre.

### ONBD-22 — Admin access
Tabla `admin_access` con UNIQUE `user_id`. `AdminRoute.tsx` consulta `useIsAdmin` (RPC `is_active_admin(auth.uid())`). Si no admin → redirect `/home`. Solo Pedro hoy.

### ONBD-23 — Demo admin-only
`AdminRoute` wrapper. Fullscreen. Solo se accede manualmente.

### ONBD-24 — Cambio rol sin leakage
`RoleGuard` checa ruta vs rol activo. Si disparidad → auto-switch + redirect o modal "Cambiar a modo X?". Menús (`Sidebar`, `BottomTabBar`) leen `useActiveRole()` y renderizan condicional. Posible 1 frame leak durante `setRole` → re-render.

### ONBD-25 — Huérfana vet claim
RPC `claim_pet_by_invitation` atómico. Parte de ONBD-02. Vet ve en dashboard vía realtime subscribe a `pet_vet_links` cambios.

### ONBD-26 — Huérfana refugio claim
Parte de ONBD-03. RPC `auto_claim_pets_by_email` o token path. Refugio libera via trigger counter.

### ONBD-29 — Donación dirigida refugio
Flag `SHELTER_DONATIONS` en `featureFlags.ts`. Si `true`: selector de refugio en `/donaciones`. Query param `?refugio=ID` preselecciona. Backend `flow-create-donation` propaga `beneficiary_adoption_center_id` (cols en mig 20260620000000). **Flag OFF hasta SpA**.

---

## Resumen Fase 1

- **Flujos core con descripción completa**: ONBD-01, 02, 03, 05, 10, 13, 14, 15, 27, 28, 30 (10 críticos).
- **Flujos compactos**: 19 restantes.
- **Gaps P0 confirmados**: ONBD-28 (vet upgrade B2B).
- **Gaps P1**: ONBD-07 (tier clínica no se persiste), ONBD-27 (copy obsoleto).
- **Gaps P2**: ONBD-18/20 (desactivar), ONBD-29 (asegurar flag OFF + copy).

Próxima fase (§2 auditoría) chequea 30 puntos por flujo, pero para ser eficientes se hace en matriz consolidada (`02-HALLAZGOS_MATRIZ.md`).
