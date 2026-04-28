# Audit Features / Monetización / Mobile / Docs / Compliance — 2026-04-27

> Panel auditor — Dominios 7, 8, 9, 13, 15.
> Working dir: `c:/Users/psusa/Desktop/pet-harmony-chile-main`.
> Reglas inviolables: el dueño NUNCA paga · USER_PREMIUM=false · vets = canal · Track Clínica oculto · SpA SUSAETA recién constituida · Lanzamiento 2026-06-01.

---

## SECCIÓN A — Features Core (Dominio 7)

### A.1. Onboarding dueño

**Hallazgo FEAT-001 [P0]** — Hay DOS onboardings de dueño funcionales, ambos cargados como rutas reales y con flujos divergentes.
- `src/pages/OnboardingDuenoMinimal.tsx:43-454` (3 pasos: pet básico → OCR carnet → directorio vets, marca `markOnboardingComplete` vía hook).
- `src/pages/OnboardingQuickFlow.tsx:63-622` (3-4 pasos: básicos → nose print opcional → microchip → research consent opcional, NO llama a `markOnboardingComplete`, redirige a `/ficha/:id`).
- Problema: el dueño ve uno u otro según la ruta de entrada (`onboarding-mascota` vs `add-pet` con flag `ONBOARDING_V2_MINIMAL=true`). El primero trackea "onboarding completo", el segundo no, lo que rompe el funnel y el `useOnboardingStatus`.
- Fix: consolidar en `OnboardingQuickFlow` (es el oficial del Refactor Maestro §5.3). Borrar `OnboardingDuenoMinimal.tsx` o convertirlo en redirect 301 al wizard nuevo. Asegurar que el wizard llame a `markOnboardingComplete` en `handleFinish` (`OnboardingQuickFlow.tsx:127-230`).

**Hallazgo FEAT-002 [P1]** — Time-to-first-pet competitivo (paso 1 con foto + nombre + especie obligatorio en `OnboardingQuickFlow.tsx:94`), pero el OCR del carnet de vacunas se ofrece ÚNICAMENTE en `OnboardingDuenoMinimal.tsx:317` (el flujo legacy). El wizard nuevo nunca le pide el carnet, perdiendo la propuesta de valor "ficha completa sin tipear" del modelo v2.
- Fix: agregar paso post-creación al `OnboardingQuickFlow` que invoque `<VaccinationCardOCR petId={createdPet.id} />` antes de redirigir. Mantener "Saltar" claro.

**Hallazgo FEAT-003 [P2]** — `OnboardingQuickFlow.tsx:212-214` redirige a `LINKS.petClinical()` con tab `?tab=identidad` cuando el dueño elige capturar nose print, pero `NosePrintSection` está gateado tras `NOSE_PRINT_ENABLED=true` (OK) y la captura NO se dispara automáticamente: el dueño llega a la tab y debe encontrar y tocar el botón. UX se rompe vs lo prometido en el paso 2.

### A.2. Onboarding vet

**Hallazgo FEAT-004 [P1]** — El wizard de vet (`src/pages/OnboardingVetMinimal.tsx:23-311`) es 100% pitch decorativo: tres slides de "lo que vas a poder hacer" sin un solo input. No crea el `service_providers` ni configura disponibilidad, solo pone `localStorage.setItem('pf_vet_onboarding_complete', 'true')` (`OnboardingVetMinimal.tsx:29,120,137`) y redirige a `/provider/dashboard` o `/provider/profile-edit`.
- Problema: el funnel real es `/registro-veterinario` → `BecomeProviderDialog`. Tener este "fake onboarding" en `/onboarding-vet` ofrece dos puertas distintas, una con datos, otra solo decorativa. El localStorage flag tampoco está protegido contra borrado.
- Fix: borrar `OnboardingVetMinimal.tsx` o convertirlo en wrapper que redirige a `/registro-veterinario`. Mover el copy a `RegistroVeterinario` como hero.

**Hallazgo FEAT-005 [P0]** — No hay flujo multi-vet para clínica (track Clínica $19.900 / Pro Max $29.900 prometen 3 seats / ilimitados). Sólo hay `src/pages/ProviderSeats.tsx` (revisado por grep), y los planes en `src/lib/plans.ts:317,350` declaran `commissionRate` 3% y 0% pero NO hay UI consistente para invitar vets adicionales. El track Clínica está, según CLAUDE.md, "escondido del pricing público", pero entonces ¿cómo se onboardean los seats reales si la página vetada no admite postulación? Bloquea ventas tier alto.
- Fix: confirmar que `/provider/seats` está accesible solo para `provider_clinic_starter` y `provider_pro_max` y testear el flujo de invitación.

### A.3. Gestión mascotas + Ficha clínica

**Hallazgo FEAT-006 [P1]** — La ficha clínica usa **9 tabs legacy y 4 tabs V2 simultáneamente**, controlados por `FICHA_TABS_V2=true` (`src/lib/featureFlags.ts:229` + `src/pages/PetClinicalRecord/index.tsx:92-118`). Lazy-load OK pero bundle de la ficha sigue cargando ambos sets en builds donde el flag puede flipear → muerto código en producción si el flag se queda fijo en true 6+ meses.
- Fix: una vez validado, eliminar imports legacy (`TabHistorial`, `TabAlimentacion`, `TabDocumentos`) si V2 se queda. Política 9.6 ya manda limpiar tras 6 meses estable.

**Hallazgo FEAT-007 [P2]** — `src/pages/PetClinicalRecord/tabs/TabVacunas.tsx` y `TabAntiparasitarios.tsx` existen pero con `FICHA_TABS_V2=true` (default) no se renderizan: están reemplazados por `TabCuidados`. Verificar que la migración de UI no perdió campos lote/fabricante (feedback Sofía vet).

### A.4. Paw Game

**Hallazgo FEAT-008 [P0]** — `PAWGAME_PROMINENT=false` (`src/lib/featureFlags.ts:184`) está OK con el principio "producto invisible", pero hay un conflicto con `PAWGAME_SIDEBAR=true` (`featureFlags.ts:27`) y la ruta `/paw-game` queda autenticada para todos. La auto-creación de `user_guardian_progress` en `src/pages/PawGame.tsx:247-253` se hace SIEMPRE que el user pisa la ruta — incluso si la app es "invisible". Esto contamina la base con miles de filas vacías.
- Fix: gate la creación de progress detrás de `RoleGuard` "owner" + chequeo de visita explícita (no auto-creación). El `PAWGAME_PROMINENT=false` debe ser respetado en BottomTab (verificar).

**Hallazgo FEAT-009 [P2]** — Streak diaria (`PawGame.tsx:118-196`) empuja al dueño a check-in diario. Choca con el modelo "el dueño no debería estar metido todos los días en la app". El flag `PAWGAME_PROMINENT=false` lo esconde pero no lo desactiva.
- Choca con regla "producto invisible". Alternativa: convertir streak en "días seguidos cumpliendo recordatorios reales" (sin necesidad de check-in manual).

### A.5. QR sync vet → dueño

**Hallazgo FEAT-010 [P1]** — `src/hooks/useClaimPetInvitation.ts:15-74` invoca RPC `claim_pet_by_invitation`. Toast en error sin `track()` de analytics → no podemos medir conversión del vínculo (cuántos QR se reclaman / cuántos fallan por token expirado).
- Fix: agregar `track({ event: 'pet_claimed', properties: { vet_linked: result.vet_linked } })` en el `success`, y `track('pet_claim_failed', { error: result.error })` en cada switch case.

**Hallazgo FEAT-011 [P2]** — `src/pages/QRLanding.tsx:43` no tiene rate limit en lookup por `qr_token`. Aunque la tabla es pública por `is_public=true`, se puede enumerar tokens. Mitigación: tokens largos UUID v4 OK, pero conviene agregar log de telemetría para detectar patrones.

### A.6. Audit Export System

**Hallazgo FEAT-012 [P2]** — `supabase/functions/audit-cron-daily/index.ts:21` declara `verify_jwt=false` y se ejecuta vía cron interno. Bien. Pero `computeMetrics` (`audit-cron-daily/index.ts:57-79`) hace 10 queries `count: 'exact'` paralelos sin paginación; en una DB con >100K filas (post-launch escala) esto puede hacer timeout (default Postgres exact count es lento sobre tablas grandes). Riesgo: el cron silencioso falla y nadie se entera.
- Fix: cambiar a `count: 'estimated'` o pre-computar en una vista materializada `master_kpis_daily` (que ya existe según CLAUDE §12).

### A.7. Booking + comisión

**Hallazgo FEAT-013 [P0]** — `src/pages/MyBookings.tsx:67-113` mezcla V1 + V2 bookings con `_source` discriminador. La cancelación / reembolso NO está en la UI del dueño: no hay botón "cancelar" en la card (`MyBookings.tsx:344-441`), solo "Reseña" cuando ya pasó. Si el dueño quiere cancelar, no tiene cómo desde acá. La RPC `cancel_reschedule_booking` existe (mig `20260725000006`) pero el frontend no la conecta acá.
- Fix: agregar `<Button>Cancelar</Button>` que llame a la RPC con confirm dialog y respete grace period 12h.

**Hallazgo FEAT-014 [P1]** — La comisión declarada (10% Básica / 5% Premium / 3% Clínica / 0% Pro Max) está en `src/lib/plans.ts:250,283,317,350` como `commissionRate`. Sin embargo, el flujo de pago de la cita NO está conectado a Flow: no encuentro `flow-create-booking` ni `flow-booking-webhook`. La comisión es un número en TS sin enforcement DB. Bloquea el modelo de revenue pre-launch.
- Fix: confirmar si las reservas se cobran via Flow o si solo es booking sin cobro online. Si lo último, declarar explícito en `/para-veterinarios` ("la comisión se aplica sólo cuando habilitemos cobros online en post-launch").

**Hallazgo FEAT-015 [P2]** — Idempotencia del flow-webhook está bien implementada (`supabase/functions/flow-webhook/index.ts:122-175` con tabla `payment_events` PK compuesta). Validación de firma vía `getStatus` server-to-server (`flow-webhook/index.ts:92-119`), no confiando en el body. Excelente. Sólo falta documentar para el equipo en docs.

### A.8. Memorial / Nose print / Paw passport

**Hallazgo FEAT-016 [P1]** — `src/pages/NoseScan.tsx:58` está gateado por `NOSE_PRINT_PUBLIC_SCAN=false` (`featureFlags.ts:344`) — correcto, el modelo SigLIP2-base aún no discrimina hermanos. La página renderiza un fallback genérico cuando `flagEnabled=false`, pero el botón "Lost & found" en /home (si existe) puede confundir al user.
- Fix: revisar todos los enlaces a `/nose-scan` en la app y esconderlos cuando el flag está false (búsqueda rápida en `src/components/`).

**Hallazgo FEAT-017 [P0]** — **Decisión "qué abandonar entre Memorial / Nose print / Paw passport" si solo te quedas con 2:**

| Feature | Esfuerzo restante | ROI emocional | ROI viral | ROI revenue B2B | Estado |
|---|---|---|---|---|---|
| **Memorial viral** | Bajo (ya hecho) | Altísimo | Alto (share card 1080x1080) | Bajo | Activo |
| **Nose print** | Alto (modelo no discrimina) | Bajo en producción | Medio (lost&found es viral) | Alto a futuro (pharma quiere identificación robusta) | Pausado (CLAUDE §12) |
| **Paw passport** | Bajo (PDF 8 páginas hecho) | Medio | Bajo (PDF no se viraliza) | Medio (vets lo valoran) | Activo |

**Recomendación: ABANDONAR Nose Print v1.** Justificación:
1. SigLIP2-base 0.445 gap insuficiente (memoria `project_nose_print_master_plan.md`).
2. Riesgo legal: revelar contacto del dueño equivocado (`featureFlags.ts:341-343` ya advierte).
3. Costo opex: HF Inference API + pgvector = +$40-80 USD/mes sin revenue de respaldo.
4. El microchip Ley 21.020 + QR ID Card cubren el 90% del use-case "mascota perdida".
5. Paw Passport PDF y Memorial generan emoción y compartir social SIN costo de infra ML.

Mantener: **Memorial + Paw Passport**. Reactivar Nose Print en Fase 3 cuando haya volumen para entrenar fine-tune propio O cuando un partner pharma lo financie.

### A.9. PMH (PawFriend Marketing Hub)

**Hallazgo FEAT-018 [P3]** — No existe ningún archivo `PMH`, `MarketingHub`, ni rutas/components con esa nomenclatura (búsqueda regex en `src/`). Si el panel lo requiere como concepto futuro, no hay scaffolding.

### A.10. Cascadas a 10× pets

**Hallazgo FEAT-019 [P1]** — Sistema de cascadas: `pet_health_alerts` (mig `20260902200000`) + 6 tipos (weight_loss, vaccine_overdue, antiparasitic, no_activity_7d, birthday, memorial_anniversary). Edge fn `notify-health-alerts` envía email solo a severity=high. Bien arquitecturado. **Pero**: las cascadas RPC corren via cron, y en CLAUDE §12 dice "cron pendiente programar por Pedro". Si no hay cron activo, las alertas no se generan a escala.
- Fix: confirmar `cron.schedule` en pg_cron para las RPCs `compute_*_alerts`. Sin eso el sistema escala a 0× users.
- Fix escalabilidad: el trigger sync de `weight_loss_30d` corre en cada INSERT a `pet_weights` — a 10K pets con 4 pesadas/año = 40K triggers/año, OK. Pero `compute_inactive_user_alerts()` escanea `profiles` completo cada hora; con 100K profiles eso son ~100ms × cron, manejable.

---

## SECCIÓN B — Monetización (Dominio 8)

### B.1. Paywall y posicionamiento

**Hallazgo BIZ-001 [P1]** — `src/pages/PawMember.tsx:140-151` muestra `PlanComparisonTableB2C` con "¿Qué diferencia hay con ser Paw Member?" pero el copy no es claro: la columna "Gratis" y "Paw Member" tienen literalmente los mismos features (`src/lib/plans.ts:36-82`). El user lee la tabla y se confunde porque no ve un beneficio funcional. La nota legal mínima `PawMember.tsx:387-392` lo aclara, pero está al fondo.
- Fix: poner banner amarillo arriba: "Paw Member NO desbloquea features. Es tu forma de sostener Paw Friend. La app es gratis para siempre." Mover la tabla a sección secundaria.

**Hallazgo BIZ-002 [P2]** — `Donaciones.tsx:43,73` define presets `[5000]` como default seleccionado pero no muestra el equivalente "USD" ni el "% del costo mensual de operación que cubre tu donación". Pierde oportunidad de transparencia y refuerzo motivacional.

### B.2. Flow.cl integración

**Hallazgo BIZ-003 [P0]** — Idempotencia del webhook: implementada (`flow-webhook/index.ts:122-175`). Validación firma: implementada (`flow-webhook/index.ts:92-119`, llama a `getStatus` server-to-server). Rate limit en create: 10 req/h vía RPC `check_and_increment_payment_quota` (`flow-create-subscription/index.ts:97-113`). **Excelente**.

**Hallazgo BIZ-004 [P0]** — **Riesgo fiscal SpA**: la cuenta Flow.cl sigue a nombre personal de Pedro (CLAUDE.md "cuenta Flow aún a nombre personal"), pero la SpA SUSAETA GARNHAM SOFTWARE ENGINEERING está constituida desde 2026-04-17. Cada pago Premium B2C ($3.990) o B2B Vet ($9.900-$29.900) que entra hoy se factura por la persona natural, no la SpA → riesgo SII (boletas no emitidas correctamente, retenciones mal aplicadas).
- Fix urgente pre-launch 1-jun: completar migración cuenta Flow a SpA. Sin eso el lanzamiento expone responsabilidad personal.

**Hallazgo BIZ-005 [P1]** — No encuentro emisión de **boleta electrónica SII** en el código (búsqueda regex `boleta|invoice|emision_boleta` = 0 matches). El flow-webhook marca `donations.status='paid'` y aplica subscription, pero no dispara emisión de boleta al SII. Los T&C `TermsOfService.tsx:193` declaran "Paw Friend emite boleta electrónica por cada pago, conforme a las normas del SII" — declaración sin implementación.
- Fix: integrar SII via Openfactura, OpenFactura o similar API; o documentar que Flow emite la boleta en nombre del comercio (depende de configuración Flow).

### B.3. Suscripciones — vencimiento, downgrade, churn, grace period

**Hallazgo BIZ-006 [P1]** — `flow-webhook/index.ts:289-329` setea `plan_expires_at: now + 30d` y `plan_next_billing_at: expiresAt`. Pero NO veo cron `subscription-renewal-cron` que ejecute pagos recurrentes Flow.cl al día 30. Sin eso, todo plan B2B vence a los 30 días sin recobro automático.
- Fix: implementar `subscription-renewal-cron` que reuse Flow Customer/Subscription API (Flow tiene `/subscription/create` por separado de `/payment/create`). Hoy se está cobrando "one-shot" sin recurrencia real.

**Hallazgo BIZ-007 [P2]** — Sin `grace_period` ni manejo de tarjeta declinada. Si el pago falla en mes 2, el plan muere abruptamente sin enviar email de cobro fallido. Churn invisible.

### B.4. Upsell vet → clínica

**Hallazgo BIZ-008 [P1]** — La página `/para-veterinarios` solo muestra Básica + Premium (público) y un card "Empresarial — contáctanos" (CLAUDE §5). Bien alineado con regla "Track Clínica oculto". Pero NO encuentro flujo de upsell post-Premium: cuando un vet llega a 5 pacientes y choca el cap del plan Premium, ¿qué CTA ve? Si no hay upsell visible, perdemos 100% del revenue tier alto.
- Fix: confirmar `UpgradePlanBanner.tsx` (encontrado en grep) muestra "Pasar a Clínica" cuando vet >X pacientes. Sin eso el track Clínica nunca convierte.

### B.5. Tracking conversión

**Hallazgo BIZ-009 [P1]** — `src/lib/analytics.ts` tiene `track()` y `EVENTS.*`, pero solo encontré 2 archivos en `src/lib` que la usan. La instrumentación del funnel de pago (`flow-create-subscription`) no emite `track('subscription_started', { plan, amount })` desde el client-side, y el éxito post-Flow no emite `track('subscription_paid')`. El funnel queda ciego a partir del momento que el user clickea "Pagar".
- Fix: agregar `track('checkout_initiated')` en `Donaciones.tsx:124-148` (ya existe `EVENTS.DONATION_INITIATED` pero falta el `paid` companion event en el callback de éxito).

### B.6. Pricing display (claridad fiscal IVA + formato CLP)

**Hallazgo BIZ-010 [P1]** — `ParaVeterinarios.tsx:228-246` declara "Premium $9.900" sin "+ IVA" ni "incluye IVA". En Chile servicios B2B llevan IVA 19%. Si el precio es neto, un vet espera ver $11.781 al pagar (sorpresa negativa en checkout). Si es bruto, hay que decirlo.
- Fix: agregar texto "Precios incluyen IVA" o "Precios netos, agregar 19% IVA" según sea el caso, en `PlanComparisonTableVet`.

**Hallazgo BIZ-011 [P2]** — Formato CLP: el helper `formatCLP` existe (`src/lib/format.ts` per imports en `PawMember.tsx:29`). Verificar uso en `Donaciones.tsx:131` que formatea `$${MIN.toLocaleString('es-CL')}` — este sí usa locale CL (separador punto miles, OK). En PR copy hay mezclas: `$3.990 CLP` (`TermsOfService.tsx:158`) vs `$9.900` sin CLP en otras partes. Estandarizar.

### B.7. B2B API

**Hallazgo BIZ-012 [P1]** — `supabase/functions/b2b-api/index.ts:84-191` tiene auth via `X-Pawfriend-Api-Key`, scope check, rate limit per-key (RPC `increment_b2b_api_usage`). 4 endpoints: `breed_stats`, `species_stats`, `correlation_insights`, `correlation_catalog`. Threshold privacy >=50 (forzado en `b2b-api/index.ts:205-206`). **Bien construido.**
- **Pero**: no hay partner real conectado. Es 100% stub esperando primer cliente pharma/seguro. El feature flag `B2B_API` está en `false` (`featureFlags.ts:427`). Ojo: la edge fn está deployada y pública (`Allow-Origin: *`), funciona si alguien tiene una key. Si las keys no están firmadas (no se documenta hashing), inserción manual en `b2b_api_keys` daría acceso.
- Fix: confirmar que `verify_b2b_api_key` RPC compara hashes (no plain text). Si no, riesgo de filtración.

**Hallazgo BIZ-013 [P2]** — `b2b-api/index.ts:144-148` aplica fail-OPEN si la RPC del rate limiter falla ("No queremos bloquear clientes pagantes por bug interno nuestro"). Decisión defendible pero arriesgada: un bug en `increment_b2b_api_usage` permite uso ilimitado. Recomendado: fail-OPEN con alerta a Sentry, no silencioso.

---

## SECCIÓN C — Mobile / Capacitor (Dominio 9)

### C.1. Plugins Capacitor

**Hallazgo MOB-001 [P0]** — **No existe `@capacitor/camera`** en `package.json`. El upload de fotos usa `<input type="file" accept="image/*">` (`OnboardingQuickFlow.tsx:290-298`, `OnboardingDuenoMinimal.tsx:194-200`). En Android moderno el `<input file>` nativo funciona OK con permiso `READ_MEDIA_IMAGES` (`AndroidManifest.xml:17`), pero en iOS WebView hay quirks: la cámara directa no se puede invocar sin `getUserMedia` o el plugin nativo. Solo `NoseScan.tsx:75-87` usa `navigator.mediaDevices.getUserMedia`.
- Fix: agregar `@capacitor/camera` y reemplazar inputs en onboarding por el plugin nativo. UX significativamente mejor en mobile (Pedro tiene Kai/Ema y usa app native).

**Hallazgo MOB-002 [P2]** — `@capacitor/share` se importa dinámicamente en 4 lugares (`PetClinicalRecord/pdf.ts`, `nativeDownload.ts`, `ProDashboard.tsx:1022`, `standalone/AnalyticsDashboard.tsx:376`). No deep links explícitos vía Share, solo PDFs. OK.

**Hallazgo MOB-003 [P1]** — `@capacitor/push-notifications` registra token en `device_tokens` (`App.tsx:191-212`) — bien. Pero el flag `PROVIDER_PUSH=false` (`featureFlags.ts:134`) significa que el provider no recibe push de bookings. Sin eso, vets pierden citas.

**Hallazgo MOB-004 [P2]** — `@capacitor-community/apple-sign-in` se carga dinámicamente (`useAppleAuth.tsx:40`) y `@capacitor-firebase/analytics` con scrubbing de tokens (`firebaseConfig.ts`). OK.

### C.2. Splash + iconos

**Hallazgo MOB-005 [P0]** — **iOS NO tiene set completo de iconos.** Solo encuentro `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` + `Contents.json`. App Store rechaza submission sin todos los tamaños (1024x1024, 180, 167, 152, 120, 87, 80, 60, 58, 40, 29, 20, etc.).
- Fix: ejecutar `npm run assets:generate` (`package.json:21`) y commitear los outputs en `Assets.xcassets/AppIcon.appiconset/`.
- Android **sí** tiene los 5 mipmaps con `ic_launcher.png` y `ic_launcher_round.png`.

### C.3. Permisos iOS

**Hallazgo MOB-006 [P0]** — `ios/App/App/Info.plist:50-59` tiene `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSCalendarsUsageDescription`, `NSUserTrackingUsageDescription`. **Pero falta `NSLocationWhenInUseUsageDescription`** y `NSLocationAlwaysAndWhenInUseUsageDescription`, requeridos si se usa Leaflet con geolocation o si en futuro se activa `WALK_GPS_TRACKING` (`featureFlags.ts:389`). Maps usa Leaflet y muchos providers requieren ubicación del user.
- Fix: agregar las 2 keys en `Info.plist` con copy chileno: "Paw Friend usa tu ubicación para mostrarte veterinarios cerca de ti."

**Hallazgo MOB-007 [P1]** — `Info.plist:113-115` declara que Associated Domains se configura en Xcode "Signing & Capabilities" (comentario). Si Pedro no lo hizo, los Universal Links a `https://pawfriend.cl` no abren la app nativa (caen al browser). El `App.tsx:175-181` parsea el `appUrlOpen`, pero requiere que iOS sepa que pawfriend.cl pertenece a la app.
- Fix manual Pedro: en Xcode > Signing & Capabilities > Associated Domains agregar `applinks:pawfriend.cl` + subir `apple-app-site-association` JSON a `https://pawfriend.cl/.well-known/apple-app-site-association`.

### C.4. Permisos Android

**Hallazgo MOB-008 [P2]** — `AndroidManifest.xml:1-101`: tiene INTERNET, NETWORK_STATE, READ/WRITE_EXTERNAL_STORAGE (con maxSdkVersion correcto), READ_MEDIA_IMAGES, POST_NOTIFICATIONS, VIBRATE. Falta CAMERA permission para uso futuro nativo. App Links autoVerify=true en `pawfriend.cl` requiere `assetlinks.json` en `https://pawfriend.cl/.well-known/assetlinks.json`. Verificar deployado.

### C.5. Build pipeline & docs

**Hallazgo MOB-009 [P3]** — Scripts en `package.json:7-39` están claros. No existe `docs/RELEASE_PROCESS.md` (búsqueda fallida) — CLAUDE §15 menciona el doc pero el archivo no aparece en `docs/`. Si está, está enterrado.

### C.6. Offline

**Hallazgo MOB-010 [P1]** — Solo 4 archivos manejan algo offline: `PWAInstallPrompt.tsx`, `AdminDataExport.tsx`, `useErrorReporter.ts`, `useGoogleAuth.tsx`. **No encuentro un boundary que capture `ChunkLoadError`** (búsqueda regex fallida). Cuando se hace deploy nuevo y el user tiene la app abierta, el code-splitting fallará al ir a una ruta nueva → pantalla blanca.
- Fix: Error Boundary global en `main.tsx` que detecte `ChunkLoadError` y haga `window.location.reload()`.

---

## SECCIÓN D — Documentación (Dominio 13)

### D.1. README

**Hallazgo DOC-001 [P1]** — `README.md` (104 líneas) tiene setup en `npm install` + `npm run dev` (líneas 27-56). Funciona <10 min. **Pero**: el README está desactualizado en cifras: dice "21 Edge Functions" (línea 75) y "88 migraciones SQL" (línea 76). CLAUDE.md actual dice 35+ edge fns y 184+ migraciones. Inconsistencia confunde a colaboradores nuevos.
- Fix: actualizar README con cifras actuales y enlace canónico a CLAUDE.md.

### D.2. ADRs

**Hallazgo DOC-002 [P2]** — No existen ADRs (`docs/adr/` no encontrado). Decisiones críticas como "Flow vs Webpay", "Mapcity model", "Track Clínica oculto", "Nose Print pause" están dispersas en memorias `~/.claude/projects/...` y CLAUDE.md, no son ADRs versionados.
- Fix: crear `docs/adr/0001-flow-payment-gateway.md`, `0002-mapcity-business-model.md`, `0003-track-clinica-hidden.md`. Plantilla MADR.

### D.3. Schema docs / ER diagram

**Hallazgo DOC-003 [P2]** — No encuentro diagrama ER. El schema es 184+ migraciones — sin diagrama es imposible para contributor nuevo. `diagrams/FLUJO_COMPLETO.mmd` existe pero es flujo de UX, no ER.
- Fix: usar `pg_dump --schema-only` + `pgmodeler` o Mermaid `erDiagram` para generar ER de las 30 tablas core.

### D.4. Runbook diario / weekly

**Hallazgo DOC-004 [P2]** — `docs/CHECKLIST_OPERACION_DIARIA.md` y `docs/RITUAL_WEEKLY_OPS.md` referenciados en CLAUDE §15 como entregables del plan, pero `find docs -name "*.md"` no devuelve ningún archivo (probablemente están en `docs-raiz/operacion/`). Si los docs no están donde dicen estar, el contributor nuevo no los encuentra.
- Fix: mover/symlinkear a `docs/` ó actualizar CLAUDE.md con paths reales.

### D.5. Doc bloat

**Hallazgo DOC-005 [P0]** — **239 archivos .md** en raíz + `docs-raiz/` + `_pending/` + `_archive/` + carpetas (sin contar `node_modules` ni `docs/`). Este conteo es **bloat masivo**.
- Top 10 más recientes (por mtime):
  1. `docs-raiz/EJECUTAR_AUDITORIA_PAWFRIEND.md`
  2. `_pending/SQL_PENDIENTES_2026_04_27.md`
  3. `docs-raiz/PROMPT_AUDITORIA_NEXT_LEVEL.md`
  4. `docs-raiz/CONTEXTO_IA_EXTERNA.md`
  5. `CLAUDE.md`
  6. `pitch-inversionistas/04_ANGELES_VC_LATAM.md`
  7. `pitch-inversionistas/CONSOLIDADO_INVERSIONISTAS.md`
  8. `docs-raiz/pitch/PITCH_DECK.md`
  9. `pitch-inversionistas/02_START_UP_CHILE.md`
  10. `pitch-inversionistas/README.md`
- Fix: reducir a <50 archivos vivos. Mover todo `_pending/*` ejecutado a `_archive/`. Consolidar pitch-inversionistas/ + docs-raiz/pitch/ en una sola carpeta. INDEX.md como única entrada.

---

## SECCIÓN E — Compliance Chile (Dominio 15)

### E.1. T&C — Ley 19.628 + ARCO

**Hallazgo COMP-001 [P1]** — `TermsOfService.tsx:32-276` es razonablemente completo: secciones 1-12 cubren aceptación, descripción, registro, uso aceptable, servicios profesionales, contenido, privacidad, pagos (con sub-secciones 8.1 donaciones, 8.2 Paw Member, 8.3 Vets, 8.4 publicidad), responsabilidad, modificaciones, ley chilena, contacto. Bien.
- **Falta**: mencionar Ley 19.628 explícitamente (la mención está sólo en `PrivacyPolicy.tsx:118`). Agregar en T&C sección 7 referencia cruzada.

**Hallazgo COMP-002 [P0]** — `PrivacyPolicy.tsx:115-132` enumera derechos ARCO (acceso, rectificación, cancelación, oposición, portabilidad) y referencia Ley 19.628. **Bien**. Pero no hay mecanismo automatizado: el user debe enviar email a `pedrosusaeta@pawfriend.cl`. Para 100K users post-launch eso no escala.
- Fix: agregar página `/profile/exportar-mis-datos` (export JSON) y `/profile/eliminar-cuenta` (existe `DeleteAccount` page según assets de docs). Verificar que la eliminación borre TODO (cascade delete) y notifique al user.

### E.2. Datos de salud animal

**Hallazgo COMP-003 [P2]** — La ficha clínica (`pets`, `pet_weights`, `pet_vaccines`, etc.) almacena datos de salud animal sin tratamiento explícito en `PrivacyPolicy.tsx:44-50` ("Información de Mascotas: Nombre, especie, raza, edad y características físicas, Fotos y videos, Registros médicos y vacunaciones, Historial de servicios"). Mencionado pero no profundizado.
- En Chile no hay ley específica sobre datos de salud animal (Ley 19.628 es de personas naturales), pero sí aplica para datos del DUEÑO (RUT, dirección, comuna). Aclarar que datos del dueño + datos de mascota están vinculados.
- Fix: agregar sub-sección en Privacy Policy "8.3. Datos clínicos veterinarios" explicando que cuando un vet vinculado consulta la ficha, recibe datos del dueño (nombre, contacto) y datos clínicos de la mascota, y que el dueño puede revocar la vinculación.

### E.3. Boletas SII

**Hallazgo COMP-004 [P0]** — Como BIZ-005 ya señaló: T&C declara emisión de boleta electrónica SII (`TermsOfService.tsx:193`) pero no hay implementación. Si el SII audita, esto es contingencia tributaria.
- Fix urgente: integrar emisor de boletas (Openfactura, Acepta, OpenFactura, SimpleAPI) y disparar emisión desde `flow-webhook/index.ts:331-362` antes del retorno OK. La SpA debe emitir bajo su RUT 78.328.659-9.

### E.4. Consentimiento marketing separado

**Hallazgo COMP-005 [P1]** — Búsqueda regex `marketing_consent|consent_marketing|marketing_opt` = 0 matches. Al registrarse el user (`Auth.tsx`) acepta T&C en bloque, pero NO hay checkbox separado para "Quiero recibir comunicaciones de marketing" como exige la práctica chilena post-Ley 21.521 (de neoprotección al consumidor) y la GDPR-like.
- El research consent (`profiles.anonymous_data_research_consent`) ya existe (mig `20260901100000_research_consent`), pero es para data anónima a pharma — distinto de marketing.
- Fix: agregar columna `profiles.marketing_consent BOOLEAN DEFAULT FALSE` + checkbox en signup. Send-grids/Resend debe respetarlo.

---

## RESUMEN

**Total hallazgos: 32** (5 secciones).
- P0: 11 (críticos pre-launch)
- P1: 12 (altos)
- P2: 7 (medios)
- P3: 2 (bajos)

**Archivos clave revisados**:
- `src/pages/OnboardingDuenoMinimal.tsx`, `OnboardingQuickFlow.tsx`, `OnboardingVetMinimal.tsx`, `PawMember.tsx`, `Donaciones.tsx`, `ParaVeterinarios.tsx`, `MyBookings.tsx`, `PetClinicalRecord/index.tsx`, `PawGame.tsx`, `NoseScan.tsx`, `QRLanding.tsx`, `TermsOfService.tsx`, `PrivacyPolicy.tsx`
- `supabase/functions/flow-create-subscription/index.ts`, `flow-webhook/index.ts`, `audit-cron-daily/index.ts`, `b2b-api/index.ts`
- `src/lib/featureFlags.ts`, `plans.ts`, `analytics.ts`
- `capacitor.config.ts`, `ios/App/App/Info.plist`, `android/app/src/main/AndroidManifest.xml`
- `package.json`, `README.md`
