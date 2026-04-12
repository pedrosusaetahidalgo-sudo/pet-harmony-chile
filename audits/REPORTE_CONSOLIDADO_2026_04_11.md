# Reporte Consolidado Paw Friend — 2026-04-11

> Auditoría total ejecutada el **2026-04-11**. Fuente de verdad única del estado técnico al cierre de esta sesión. Reemplaza/complementa los reportes sueltos de `audits/` y `junk/`.

## Contexto de ejecución

| Campo | Valor |
|---|---|
| Fecha | 2026-04-11 |
| Branch | `main` |
| Commit HEAD | `fc48e94` (`fc48e945b9ab6d7a0732028e41de9982b4437039`) |
| Node | v24.13.0 |
| npm | 11.6.2 |
| Plataforma | Windows 11 Pro (bash) |
| Working tree | sucio (muchos docs en `junk/`, `_pending/`, tests en `src/__tests__/`, `src/lib/__tests__/`) |

---

## 1. TL;DR ejecutivo

1. **La joya de la corona está viva**: tras [fc48e94](../src/components/medical/MedicalDocumentsTab.tsx#L216), `MedicalSummaryButton` está efectivamente renderizado dentro del tab "Documentos". El flujo ficha PDF → descarga → edge function `generate-medical-summary` funciona end-to-end.
2. **Build verde**: `npx tsc -b` 0 errores, `npm run build` pasa en 9m (más lento que los ~25s del manual — la máquina está saturada, no es regresión real de Vite), `vitest` 81/81 passing, Playwright Desktop Chrome 50/50.
3. **ESLint es el agujero**: **539 problemas (353 errores, 186 warnings)** bloqueantes para CI serio. Mayoría `@typescript-eslint/no-explicit-any` + `react-hooks/rules-of-hooks` en [ServiceDirectory.tsx:528-566](../src/pages/ServiceDirectory.tsx#L528) (14 hooks llamados después de early return — bug real, no falso positivo).
4. **Bundle fuera de lo que dice CLAUDE.md**: el manual §12 afirma "~291 kB / 89 kB gzip" pero el chunk `index-CGgiH3gw.js` pesa **458 kB / 151 kB gzip** y `chart-DkVKNgDP.js` **383 kB / 106 kB gzip**. Hay que actualizar la línea base del manual o rearmar `manualChunks` para extraer `recharts`, `leaflet`, `pdf-lib`.
5. **9 vulnerabilidades high en prod**: `xmldom`, `lodash`, `minimatch`, `tar` vía `@capacitor/cli`. Todas fix-available con `npm audit fix`. Hay que aplicarlo esta semana.
6. **Descarga QR rota en WebView iOS y Safari iOS**: [PetQRDisplay.tsx:25-28](../src/components/medical/PetQRDisplay.tsx#L25) y [TabCompartir.tsx:132-135](../src/pages/PetClinicalRecord/tabs/TabCompartir.tsx#L132) usan `<a download>` + data URL. Hay que envolver en `isNative()` y usar `Filesystem.writeFile` como ya hace `nativeDownload.ts`.
7. **Copy de la joya inconsistente**: 12+ strings "Historial médico" donde debería decir "Ficha clínica" (término estandarizado en [CLAUDE.md §9.5](../CLAUDE.md)). El string maestro está en [src/lib/plans.ts:317](../src/lib/plans.ts#L317) — fix de 1 línea propaga a toda la UI.
8. **Voseo argentino en perfil de proveedor**: [ProviderProfileEdit.tsx:114,128,471](../src/pages/ProviderProfileEdit.tsx#L114) ("Verificá", "Necesitás"). Violación directa de §9.5.
9. **Dashboard de proveedor estructuralmente roto** ([_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md](../_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md)): 8 tarjetas financieras leyendo tablas nunca pobladas (`orders`, `order_items`, `provider_balances`). Bug conocido, no fixed.
10. **Top riesgos**: (a) RLS de `ai_request_quota` con `using(true) with check(true)` — verificar si es tabla service-role; (b) Flow `urlReturn` siempre a `/upgrade/success` aunque el pago sea rechazado; (c) fetch de logo vivo `pawfriend.cl/pwa-icon-512.png` en cada cold start de `generate-medical-summary`.

**Top 5 riesgos**: RLS cuota IA · Flow urlReturn único · logo live-fetch en edge function · 9 vulns npm prod · ESLint 353 errores.
**Top 5 quick wins**: `npm audit fix` · `plans.ts:317` Historial→Ficha · voseo 3 strings · lazy-chunk recharts/leaflet · añadir `staleTime` default a QueryClient.

---

## 2. Resultados de tests y checks

| Check | Resultado | Tiempo | Notas |
|---|---|---|---|
| `npx tsc -b` | PASS (0 errores) | 7m 25s | Lentísimo por carga de la máquina, no por tamaño del proyecto |
| `npm run lint` (eslint .) | **FAIL**: 539 problemas (353 err + 186 warn) | 5m 06s | Ver §3 |
| `npm run build` (vite → docs/) | PASS | 9m 02s | Ver §4 para métricas de bundle |
| `npx vitest run` | PASS: 81/81 en 7 archivos | 29.6s | `distance`, `featureFlags`, `openingHours`, `vaccines`, `gamification`, `plans`, `format` |
| `npx playwright test --project="Desktop Chrome"` | PASS: 50/50 | 1m 18s | Subset ejecutado tras cancelar matriz completa estancada 22+ min sin output |
| `npx playwright test` (matriz 5 engines) | **NO CORRIÓ** | — | Se abortó la corrida inicial; el subset Desktop Chrome confirma que los specs son sanos |
| `npm audit --omit=dev` | **FAIL**: 9 high | <5s | Ver §7 |
| `npx depcheck` | Ran OK | ~90s | Ver §8 |
| Migraciones SQL pendientes | — | — | 88 archivos, última real `20260428000000` + flag `99999999000000`. Ver §6 |
| Edge functions con `index.ts` | OK | — | 21/21 tienen `index.ts`, más `_shared/` |

---

## 3. ESLint: 539 problemas

Exit forzado verde por el pipe a `tail` (falso verde de `npm run lint`). El linter SÍ falla. Breakdown aproximado:

- **`react-hooks/rules-of-hooks`** (error): 14 ocurrencias en [ServiceDirectory.tsx:528-566](../src/pages/ServiceDirectory.tsx#L528) — `useNavigate`, `useAuth`, `useToast`, `useState`, `useEffect` llamados después de un early return. **Bug real de React**, no cosmético.
- **`@typescript-eslint/no-explicit-any`** (error): ~90 ocurrencias en 40+ archivos. Peores nidos:
  - [ServiceDirectory.tsx](../src/pages/ServiceDirectory.tsx) — 13 `any`
  - [Profile.tsx:45-48](../src/pages/Profile.tsx#L45), [UserProfile.tsx:37-40](../src/pages/UserProfile.tsx#L37) — 4 `any` en loaders
  - [QRLanding.tsx:41,46,163,168](../src/pages/QRLanding.tsx#L41) — 5 `any`
  - [Reportes.tsx:37,49](../src/pages/Reportes.tsx#L37) — 2 `any`
  - [Settings.tsx:373,385,397](../src/pages/Settings.tsx#L373) — 3 `any`
  - [supabase/functions/_shared/ai-base.ts:44,121](../supabase/functions/_shared/ai-base.ts#L44) — 2 `any`
  - [supabase/functions/medical-suggestions/index.ts:140,141,155](../supabase/functions/medical-suggestions/index.ts#L140) — 3 `any`
  - [supabase/functions/pet-assistant/index.ts:299](../supabase/functions/pet-assistant/index.ts#L299) — 1 `any`
  - [supabase/functions/generate-medical-zip/index.ts:174](../supabase/functions/generate-medical-zip/index.ts#L174) — 1 `any`
- **`react-hooks/exhaustive-deps`** (warning): dispersos en `Profile.tsx`, `Settings.tsx`, `UserProfile.tsx`, `ServiceDirectory.tsx`.
- **`jsx-a11y/label-has-associated-control`** y **`jsx-a11y/label-has-for`** (warning): varios `<label>` huérfanos en formularios (`PreciosVeterinarios.tsx`, `ProviderProfileEdit.tsx:245`, otros).
- **`react-refresh/only-export-components`** (warning): 6 hits en [PetClinicalRecord/shared.tsx](../src/pages/PetClinicalRecord/shared.tsx) — archivo mezcla componentes y constantes, rompe HMR fino.
- **`@typescript-eslint/no-require-imports`** (error): [tailwind.config.ts:177](../tailwind.config.ts#L177) — usa `require()` en ESM.
- **`prefer-const`** (error): [generate-medical-zip/index.ts:121](../supabase/functions/generate-medical-zip/index.ts#L121).

**Cero** `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` — señal de que el equipo prefiere `any` antes que silenciar. Bueno para visibilidad, malo para tipos reales.

---

## 4. Métricas de build

Build a `docs/` con Vite (chunks top 10 por peso):

| Chunk | Bytes | gzip |
|---|---|---|
| `index-CGgiH3gw.js` (entry app) | 458,020 | 151,160 |
| `chart-DkVKNgDP.js` | 383,000 | 106,160 |
| `index-C47cFprv.js` (secundario) | 319,770 | 98,580 |
| `supabase-vendor-B4DEupPq.js` | 172,570 | 43,720 |
| `react-vendor-BDIKVvNc.js` | 163,370 | 53,280 |
| `ui-vendor-DVtSlUcm.js` | 145,880 | 46,520 |
| `index-Cqf8n7qq.js` | 97,780 | 28,380 |
| `Maps-BAphnSrf.js` | 89,030 | 21,970 |
| `Admin-C4GoOOh8.js` | 77,990 | 14,800 |
| `ServiceDirectory-CZUaNcJd.js` | 73,650 | 17,670 |

**Total gzip estimado del critical path** (entry + react + ui + supabase) ≈ **295 kB gzip**. Muy por encima del "89 kB gzip" que declara [CLAUDE.md §12](../CLAUDE.md). Hay tres causas probables, detectadas por el subagente de performance:

- [vite.config.ts:26-48](../vite.config.ts#L26) no aísla `recharts`, `leaflet`, `pdf-lib`, `qrcode.react` en vendors dedicados.
- [src/components/ui/chart.tsx:2](../src/components/ui/chart.tsx#L2) hace `import * as RechartsPrimitive from "recharts"` y los dashboards ya importan recharts directo — superficie duplicada.
- [AdoptionSheltersList.tsx:16](../src/components/AdoptionSheltersList.tsx#L16) importa Leaflet eager aunque `Maps` sí esté lazy.

---

## 5. Hallazgos por subagente

### 5.1 Project Auditor

**Media**
- [src/pages/Actividad.tsx](../src/pages/Actividad.tsx) es **página huérfana**: [App.tsx:72](../src/App.tsx#L72) la tiene comentada ("ruta consolidada a /feed"), pero el archivo sigue existiendo y referenciado en 13 archivos como string. Código muerto.
- `AnalyticsDashboard.tsx` se monta en `/analytics-demo` y `ProDashboard` en `/panel-pro` — verificar que no sean duplicados accidentales.
- [App.tsx:18](../src/App.tsx#L18) declara `PublicWithLayoutIfAuth` **entre imports** (hoisting funciona, pero rompe convención).

**Baja**
- [src/pages/PetClinicalRecord/](../src/pages/PetClinicalRecord/) es carpeta mientras el resto de páginas son archivos sueltos — inconsistencia menor con §4.
- `src/contexts/` vacío aunque `ActiveRoleProvider` vive en `src/hooks/`.

### 5.2 Schema Auditor

**Media**
- [src/integrations/supabase/types.ts](../src/integrations/supabase/types.ts) (6093 líneas) todavía contiene tipos del pivot pre-médico: `lost_pets`, `shared_walks`, `dog_walker_profiles`, `walk_bookings` (14 ocurrencias de `walk_*`). O se dropearon las tablas y hay que regenerar, o son zombies en DB.
- Migración [99999999000000_demo_seed_flag.sql](../supabase/migrations/99999999000000_demo_seed_flag.sql) con timestamp ficticio es anti-patrón — funciona pero ensucia el orden.

**Baja**
- [20260424000001_fix_vet_clinical_notes_pet_fk.sql](../supabase/migrations/20260424000001_fix_vet_clinical_notes_pet_fk.sql) sugiere que hubo FK incorrecta — verificar registros huérfanos.

### 5.3 RLS Guardian

**Alta**
- [supabase/migrations/20260410000000_ai_request_quota.sql:17](../supabase/migrations/20260410000000_ai_request_quota.sql#L17) — `ai_request_quota` con `using (true) with check (true)`. Si guarda quota por `user_id`, **cualquiera puede leer/modificar quotas ajenas**. Verificar si es tabla sólo de service_role; si es cliente, reescribir policy a `user_id = auth.uid()`.
- Migración `20251127152253_*.sql:13-50` tiene un `USING(true)` cerca de donde `medical_records` habilita RLS. Confirmar manualmente que la policy permisiva corresponde a `profiles` y NO a `medical_records`. Riesgo si está mal: **ficha clínica pública**.

**Media**
- [20260414000000_flow_hardening](../supabase/migrations/) y [20260416000000_whatsapp_and_google_calendar](../supabase/migrations/) tienen `using (true) with check (true)`. Probablemente tablas service-role; documentar explícitamente en la migración.

**Baja**
- [20260427000003_community_groups.sql:36-68](../supabase/migrations/20260427000003_community_groups.sql#L36) — policies bien escopadas por `user_id = auth.uid()` y membresía con `is_public = true` sólo para discover. Correcto.

### 5.4 Code Reviewer (últimos 10 commits)

**Alta**
- Commit `fc48e94` mezcla `docs/` con `src/` (126 archivos de `docs/assets/*.js` en el mismo diff que el feature). Válido por §9.1 pero diluye el diff. Separar build en commit aparte.
- [generate-medical-summary/index.ts](../supabase/functions/generate-medical-summary/index.ts) fetchea logo desde `https://pawfriend.cl/pwa-icon-512.png` **en cada cold start** (commit `18661f1`). Dependencia externa viva dentro de la edge function; si GH Pages falla, el PDF cae al fallback silencioso. Bundlear el PNG como base64 en el propio `.ts`.
- Commit `bc48d13` agregó `/* eslint-disable @typescript-eslint/no-explicit-any */` al tope de `generate-medical-summary/index.ts` documentando 11 `any` preexistentes — ok como tregua, pero es deuda agendada.

**Media**
- `generateVerificationCode` (commit `eedf1d3`) usa `Date.now() + petId` SHA-256 truncado a 8 hex chars. Para trazabilidad está bien; riesgo de colisión teórico si se regenera el mismo ms.
- `drawWrappedText` (commit `3b06e37`) sin tests unitarios — edge case "palabra única más larga que maxWidth" se deja desbordar.
- Commits `18661f1` y `fc48e94` afirman "FLUJO_COMPLETO.mmd no requiere update". Correcto porque no cambian rutas, pero no se validó que [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) ni [MASTER_UPGRADE_2026_04.md](../_pending/MASTER_UPGRADE_2026_04.md) reflejen el fix del botón invisible.

**Baja**
- Sin `console.log` olvidados, sin claves hardcodeadas, sin migraciones tocadas en estos 5 commits. Limpio.

### 5.5 TypeScript Refactorer — top 10 deuda de tipos

1. [ServiceDirectory.tsx:194,255,314,363,423,482,491,502,691,696](../src/pages/ServiceDirectory.tsx#L194) — 10 `any` (provider map). Página pública crítica.
2. [admin/AdManagement.tsx:69,79,89,102,120,158](../src/components/admin/AdManagement.tsx#L69) — 6 `any` en mutationFn y handlers.
3. [MedicalRecords.tsx:152,270,277,368](../src/pages/MedicalRecords.tsx#L152) — `groupRecordsByYear(records: any[])` en la joya.
4. [useVetAnalytics.ts](../src/hooks/useVetAnalytics.ts) + [useProAnalytics.ts](../src/hooks/useProAnalytics.ts) — 12 `any` en cálculos de revenue.
5. [MyBookings.tsx:150-159](../src/pages/MyBookings.tsx#L150) — 6 `any` en filter/map.
6. [Auth.tsx:204,264,300,332](../src/pages/Auth.tsx#L204) — 4 `catch(error: any)` en login/signup/OTP.
7. [ActivityFeed.tsx:64,100,116,118,137,174](../src/components/social/ActivityFeed.tsx#L64) — 6 `as unknown as`.
8. [PetClinicalRecord/tabs/TabResumen.tsx:59,73](../src/pages/PetClinicalRecord/tabs/TabResumen.tsx#L59) — `as unknown as null` en update de `current_medications` / `chronic_conditions_detail`.
9. [PerfilVetPublico.tsx:107](../src/pages/PerfilVetPublico.tsx#L107) — cast de `supabase.from('vet_bookings')` por tabla ausente en `types.ts`.
10. [useOrganicRewards.ts:116](../src/hooks/useOrganicRewards.ts#L116) + [Home.tsx:220](../src/pages/Home.tsx#L220) — casts en gamificación y dashboard.

**18** `as unknown as` totales. La mitad son casts para acceder a tablas fuera de `types.ts` generados (`vet_bookings`, `pet_activity`, `organic_rewards`). Señal: **regenerar `supabase/types.ts`** desde CLI.

### 5.6 Performance Profiler

**Alta**
- [vite.config.ts:26-48](../vite.config.ts#L26): `manualChunks` no separa `recharts`, `leaflet`, `pdf-lib`, `qrcode.react`. Añadir `charts-vendor`, `maps-vendor`, `qr-vendor`.
- [ui/chart.tsx:2](../src/components/ui/chart.tsx#L2) importa `* from 'recharts'`. Dado que dashboards ya importan recharts directo, revisar si se puede borrar `chart.tsx`.
- [AdoptionSheltersList.tsx:16](../src/components/AdoptionSheltersList.tsx#L16) importa leaflet eager.

**Media**
- **React Query sin `staleTime` default**: hay `useCanAddPet` 30s, `useNotifications` 60s, `useBlockedUsers`/`useVetPriceEstimator` 10min, `useProAnalytics` 5min… pero **~25 hooks usan default 0** y refetchean en cada mount. Setear `defaultOptions.queries.staleTime = 60_000` en `QueryClient`.
- [Feed.tsx](../src/pages/Feed.tsx) y [MyPets.tsx](../src/pages/MyPets.tsx) — **0 `useMemo`/`useCallback`** en listas calientes con filtros recalculados en cada render.

**Baja**
- `icons-vendor`, `date-vendor`, `supabase-vendor` correctamente separados.

### 5.7 Cross-Platform Validator

**Alta (bloqueante en algún target)**
- [PetQRDisplay.tsx:25-28](../src/components/medical/PetQRDisplay.tsx#L25) — `<a download>` + data URL. **Rompe en WKWebView iOS y Safari iOS**. Envolver en `isNative()` + `Filesystem.writeFile`.
- [TabCompartir.tsx:132-135](../src/pages/PetClinicalRecord/tabs/TabCompartir.tsx#L132) — mismo patrón. Rompe en WebView iOS y Safari iOS ≤ 15.
- [MedicalDocumentsTab.tsx:162](../src/components/medical/MedicalDocumentsTab.tsx#L162) y `ProviderDirectoryCard.tsx:102/109/144` — `navigator.share` / `clipboard.writeText` sin try/catch; un `NotAllowedError` no capturado en WebView iOS rompe el handler.

**Media**
- [MedicalShare.tsx:164](../src/pages/MedicalShare.tsx#L164) — `window.open('https://wa.me/...', '_blank')` dentro de WebView Capacitor abre en el mismo WebView. Existe `openExternalUrl` en `src/lib/nativeNavigation.ts`; usarlo.
- [PetClinicalRecord/pdf.ts:223](../src/pages/PetClinicalRecord/pdf.ts#L223) — rama web usa `window.open("", "_blank")` + `document.write(html)`. Safari iOS bloquea popups async. Alternativa: `URL.createObjectURL(new Blob(...))` + `location.assign`.
- `:has()` en `ui/calendar.tsx:31` y `ui/table.tsx:49,60` — degrada estéticamente en WebView Android ≤ 11 (Chromium 104-). Interacción sí funciona.

**OK**
- No se encontró `oklch()`, `color-mix()`, `@container`, `subgrid`, `text-wrap: balance`, `structuredClone`, `Intl.Segmenter`, top-level await ni Service Worker en `src/`.
- `src/lib/platform.ts` + `nativeNavigation.ts` + `nativeDownload.ts` es el patrón correcto, ya usado en [MedicalSummaryButton.tsx:48](../src/components/medical/MedicalSummaryButton.tsx#L48) — la joya está bien.

### 5.8 UX Copy Chileno

**Alta**
- Voseo argentino en flujo de perfil proveedor (viola §9.5).
- Uso sistemático de "Historial médico" en vez de "Ficha clínica" — afecta directo a la joya.

**Top 15 strings problemáticos**

| # | Archivo | String actual | Fix |
|---|---|---|---|
| 1 | [ProviderProfileEdit.tsx:114](../src/pages/ProviderProfileEdit.tsx#L114) | "Verificá que el bucket..." | "Verifica que el bucket..." |
| 2 | [ProviderProfileEdit.tsx:128](../src/pages/ProviderProfileEdit.tsx#L128) | "Necesitás al menos ${...}%..." | "Necesitas al menos..." |
| 3 | [ProviderProfileEdit.tsx:471](../src/pages/ProviderProfileEdit.tsx#L471) | "Necesitás completar más campos..." | "Necesitas completar..." |
| 4 | [MedicalRecords.tsx:167](../src/pages/MedicalRecords.tsx#L167) | title="Historial médico" | "Ficha clínica" |
| 5 | [MedicalRecords.tsx:168](../src/pages/MedicalRecords.tsx#L168) | "...el historial médico..." | "...la ficha clínica..." |
| 6 | [MedicalRecords.tsx:173](../src/pages/MedicalRecords.tsx#L173) | breadcrumb "Historial médico" | "Ficha clínica" |
| 7 | [MedicalRecords.tsx:185](../src/pages/MedicalRecords.tsx#L185) | "...su historial médico" | "...su ficha clínica" |
| 8 | [MedicalRecords.tsx:257](../src/pages/MedicalRecords.tsx#L257) | "Comienza a agregar el historial..." | "...la ficha clínica..." |
| 9 | [MedicalRecords.tsx:413](../src/pages/MedicalRecords.tsx#L413) | "...gestionar su historial médico" | "...su ficha clínica" |
| 10 | [Upgrade.tsx:20](../src/pages/Upgrade.tsx#L20) | "Historial médico completo..." | "Ficha clínica completa..." |
| 11 | [Upgrade.tsx:34](../src/pages/Upgrade.tsx#L34) | feature "Historial médico" | "Ficha clínica" |
| 12 | [UpgradeSuccess.tsx:45](../src/pages/UpgradeSuccess.tsx#L45) | "...historial médico completo" | "...ficha clínica completa" |
| 13 | [AddPet.tsx:435](../src/pages/AddPet.tsx#L435) | "...el historial médico completo..." | "...la ficha clínica completa..." |
| 14 | [AddMedicalRecord.tsx:235](../src/components/AddMedicalRecord.tsx#L235) | "...historial médico de tu mascota" | "...ficha clínica..." |
| 15 | [plans.ts:317](../src/lib/plans.ts#L317) | `medical_history: 'Historial médico'` | `'Ficha clínica'` (string central) |

No se detectó voseo rioplatense fuera de `ProviderProfileEdit.tsx`, ni españolismos, ni "distrito"/"barrio"/"alarma".

### 5.9 QA Verifier (flujos críticos)

**Auth** — Sólido. [useAuth.tsx:11-54](../src/hooks/useAuth.tsx#L11) subscribe primero, `getSession` después, timeout de 3s evita spinner colgado. [ProtectedRoute.tsx:50-54](../src/components/ProtectedRoute.tsx#L50) preserva `returnTo`. Sin redirect loops detectados.

**Ficha PDF (joya)** — **Verificado post-fc48e94**: [MedicalSummaryButton.tsx](../src/components/medical/MedicalSummaryButton.tsx) importado en [MedicalDocumentsTab.tsx:35](../src/components/medical/MedicalDocumentsTab.tsx#L35) **y renderizado en línea 216** dentro del hero card. [MedicalRecords.tsx:353](../src/pages/MedicalRecords.tsx#L353) monta el tab. El fix del botón invisible está efectivamente aplicado. **Observación menor**: texto "Generando tu ficha..." (L98) vs "Generando..." (L74) — inconsistencia de copy dentro del mismo componente.

**Pagos Flow** — **Idempotencia correcta** en [flow-create-subscription/index.ts:100-120](../supabase/functions/flow-create-subscription/index.ts#L100): busca subscription `pending` del mismo user+plan de los últimos 5 min y reutiliza token. Rate limit 10/h por user vía RPC. Timeout 15s. Firma HMAC-SHA256 correcta. [flow-webhook/index.ts](../supabase/functions/flow-webhook/index.ts) consulta `getStatus` a Flow (nunca confía en body), marca `failed` cuando `status !== 2`.

**Riesgo Medio**: [flow-create-subscription/index.ts:136](../supabase/functions/flow-create-subscription/index.ts#L136) siempre usa `urlReturn: ${SITE_URL}/upgrade/success` aunque el pago sea rechazado. El usuario podría ver "¡Gracias por tu Premium!" aunque el webhook ya haya marcado `failed`. Debería usar `/payment-result?status=...` (que ya existe en [App.tsx](../src/App.tsx)).

**Riesgo Bajo**: CORS hard-coded a `https://pawfriend.cl` en línea 14 — rompe testing local.

**Directorio vets** — [PerfilVetPublico.tsx](../src/pages/PerfilVetPublico.tsx) maneja isLoading con Skeleton, 404 friendly, SEO tags dinámicos + JSON-LD `Veterinarian` con `AggregateRating` condicional. Sólido. Observación: **el archivo real se llama `PerfilVetPublico.tsx`, no `VetProfilePublic.tsx` como dice [CLAUDE.md §7](../CLAUDE.md)** — actualizar manual.

### 5.10 Bug Debugger

**Bugs abiertos conocidos**

1. **[_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md](../_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md)** — Dashboard proveedor consulta tablas `orders`/`order_items`/`provider_balances` nunca pobladas; 8 tarjetas financieras en $0. "Fichas compartidas" muestra margen neto mal etiquetado. "Clientes únicos" derivado de `orderNumber.split("-")` roto. Plan de rediseño en 6 fases propuesto, **no ejecutado**.
2. **[junk/BUG_GROOMERS_GRADIENT_CRASH.md](../junk/BUG_GROOMERS_GRADIENT_CRASH.md)** — `/services/groomers` crashea con "Cannot read properties of undefined (reading 'gradient')". `providerTypeConfig` en [ProviderProfileCard.tsx:56-89](../src/components/provider/ProviderProfileCard.tsx#L56) no incluye key `groomer`; [ServiceDirectory.tsx:806-809](../src/pages/ServiceDirectory.tsx#L806) pasa `providerType="groomer"`. **Diagnosticado, no corregido**.
3. **[project_analytics_export_broken](../../.claude/projects/c--Users-psusa-Desktop-pet-harmony-chile-main/memory/project_analytics_export_broken.md)** (memoria) — Botones export PDF/CSV del Panel Pro son placeholders. `handleExport` vacío. **Aún abierto**.

**Bugs potenciales detectados**

1. **[Media]** [MedicalDocumentsTab.tsx:216](../src/components/medical/MedicalDocumentsTab.tsx#L216) llama `<MedicalSummaryButton petId={petId} />` **sin `petName`**. El PDF se descarga como `resumen_medico_mascota.pdf` literal — nombre genérico en la joya de la corona.
2. **[Media]** Flow `urlReturn` no diferencia éxito/rechazo (ver §5.9).
3. **[Baja]** [Auth.tsx:38-45](../src/pages/Auth.tsx#L38) `useEffect` sin cleanup; si se desmonta antes de resolver, `navigate` se llama en componente desmontado (no crashea pero está sucio).
4. **[Baja]** [useAuth.tsx:38-47](../src/hooks/useAuth.tsx#L38) doble `setLoading(false)`: el timeout de 3s y `getSession().then()` compiten. Ruido en telemetría en conexiones lentas.
5. **[Baja]** [PerfilVetPublico.tsx:178-188](../src/pages/PerfilVetPublico.tsx#L178) `handleShare` defensivo innecesario con `v?.slug` cuando ya hay early return — fragilidad estructural si alguien mueve el guard.

---

## 6. Migraciones SQL y Edge Functions

### Migraciones
- **88 archivos** en [supabase/migrations/](../supabase/migrations/).
- Últimas 5 reales: `20260427000003_community_groups`, `20260427000004_seed_vet_service_prices`, `20260428000000_pets_species_expand`. Más flag anti-patrón `99999999000000_demo_seed_flag.sql`.
- Per §9.2 de CLAUDE.md: nunca se aplican automáticamente. Dueño aplica manual desde Supabase Dashboard. **Este reporte NO ejecuta migraciones**.

### Edge functions
21 funciones activas + `_shared/`. Todas con `index.ts` presente. Lista verificada:

```
bereavement-assistant    generate-weekly-vet-reports   ocr-vaccination-card
breed-tips               google-calendar-callback      pet-assistant
flow-create-subscription google-calendar-disconnect    reminder-cron
flow-webhook             google-calendar-oauth-init    send-pet-invitation
generate-medical-summary google-calendar-sync          send-whatsapp-reminder
generate-medical-zip     medical-suggestions
generate-shelters        moderate-service-promotion
generate-sitemap         generate-weekly-owner-reports
```

---

## 7. Seguridad

### 7.1 `npm audit --omit=dev`

**9 vulnerabilidades high severity**, todas fix-available:

| Paquete | Severity | CVE / Advisory | Ruta |
|---|---|---|---|
| `@xmldom/xmldom` | high | GHSA-wh4c-j3r5-mjhp (XML injection) | dep directa |
| `lodash` ≤ 4.17.23 | high | GHSA-xxjr-mmjv-4gpg, GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh (prototype pollution + code injection) | dep directa |
| `minimatch` 10.0.0-10.2.2 | high | GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74 (ReDoS) | `rimraf/node_modules/minimatch` |
| `tar` ≤ 7.5.10 | high | GHSA-34x7-hfp2-rc4v, GHSA-8qq5-rm4j-mr97, GHSA-83g3-92jg-28cx, GHSA-qffp-2rhf-9h96, GHSA-9ppj-qmqm-q256, GHSA-r6q2-hw4h-h46w (hardlink path traversal, symlink poisoning) | vía `@capacitor/cli` 0.0.10 - 7.4.5 |

Acción: `npm audit fix`. El jump de `@capacitor/cli` puede tener breaking changes menores; probar en rama aparte.

### 7.2 Secretos hardcodeados
No se detectaron API keys pegadas en código en los últimos commits revisados. Memoria [project_rotate_keys_2026_04_11](../../.claude/projects/c--Users-psusa-Desktop-pet-harmony-chile-main/memory/project_rotate_keys_2026_04_11.md) indica rotación pendiente de Supabase + Google (bloqueada previamente por GitHub Push Protection) — agendar para esta semana.

### 7.3 RLS
Ver §5.3. Riesgo crítico: verificar `ai_request_quota` y la migración `20251127152253` (`USING(true)` cerca de `medical_records`).

---

## 8. Deuda técnica priorizada

| # | Archivo:línea | Descripción | Severidad | Esfuerzo |
|---|---|---|---|---|
| 1 | [ServiceDirectory.tsx:528-566](../src/pages/ServiceDirectory.tsx#L528) | 14 hooks llamados después de early return — bug de React | Alta | M |
| 2 | `npm audit` × 9 | Vulnerabilidades high en prod | Alta | S |
| 3 | [PetQRDisplay.tsx:25-28](../src/components/medical/PetQRDisplay.tsx#L25) + [TabCompartir.tsx:132-135](../src/pages/PetClinicalRecord/tabs/TabCompartir.tsx#L132) | Descarga QR rota en WebView/Safari iOS | Alta | S |
| 4 | [plans.ts:317](../src/lib/plans.ts#L317) + 11 strings | "Historial médico" → "Ficha clínica" | Alta | S |
| 5 | [ProviderProfileEdit.tsx:114,128,471](../src/pages/ProviderProfileEdit.tsx#L114) | Voseo argentino | Alta | XS |
| 6 | [20260410000000_ai_request_quota.sql:17](../supabase/migrations/20260410000000_ai_request_quota.sql#L17) | RLS `using(true) with check(true)` sospechoso | Alta | S |
| 7 | [flow-create-subscription/index.ts:136](../supabase/functions/flow-create-subscription/index.ts#L136) | `urlReturn` único ignora rechazos | Alta | S |
| 8 | [generate-medical-summary/index.ts](../supabase/functions/generate-medical-summary/index.ts) | Fetch live de logo en cada cold start | Media | S |
| 9 | [vite.config.ts:26-48](../vite.config.ts#L26) | `manualChunks` no aísla recharts/leaflet/pdf-lib | Media | M |
| 10 | [MedicalDocumentsTab.tsx:216](../src/components/medical/MedicalDocumentsTab.tsx#L216) | `<MedicalSummaryButton>` sin `petName` → PDF genérico | Media | XS |
| 11 | ESLint 353 errores | `any` + `rules-of-hooks` | Media | L |
| 12 | [_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md](../_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md) | Dashboard proveedor estructuralmente roto | Media | L |
| 13 | [junk/BUG_GROOMERS_GRADIENT_CRASH.md](../junk/BUG_GROOMERS_GRADIENT_CRASH.md) | `/services/groomers` crashea | Media | XS |
| 14 | `handleExport` Analytics Pro | Botones export PDF/CSV placeholder | Media | M |
| 15 | [types.ts](../src/integrations/supabase/types.ts) | Tipos zombies `walk_*`, `lost_pets` | Media | S |
| 16 | [Actividad.tsx](../src/pages/Actividad.tsx) | Página huérfana | Baja | XS |
| 17 | [Feed.tsx](../src/pages/Feed.tsx), [MyPets.tsx](../src/pages/MyPets.tsx) | 0 memoización en listas calientes | Baja | M |
| 18 | QueryClient | Sin `staleTime` default | Baja | XS |
| 19 | [tailwind.config.ts:177](../tailwind.config.ts#L177) | `require()` en ESM | Baja | XS |
| 20 | [PetClinicalRecord/shared.tsx](../src/pages/PetClinicalRecord/shared.tsx) | 6 warnings `react-refresh` | Baja | S |

---

## 9. Inventario de reportes MD consolidados

| Archivo | Última modif. | Estado | Hallazgos clave |
|---|---|---|---|
| [audits/AUDITORIA_TOTAL_APP.md](AUDITORIA_TOTAL_APP.md) | 2026-04-11 | Vigente | 718 líneas. Auditoría multi-dominio previa. Referencia principal. |
| [audits/AUDIT_2026_04_08.md](AUDIT_2026_04_08.md) | 2026-04-11 | Vigente | 114 líneas. Auditoría técnica del código. |
| [audits/WALKTHROUGH_2026_04_08.md](WALKTHROUGH_2026_04_08.md) | 2026-04-11 | Vigente | 91 líneas. Walkthrough funcional. |
| [audits/COMPETENCIA_2026_04_08.md](COMPETENCIA_2026_04_08.md) | 2026-04-11 | Vigente | 197 líneas. Análisis competitivo Chile. |
| [audits/RECOMENDACIONES_2026_04_08.md](RECOMENDACIONES_2026_04_08.md) | 2026-04-11 | Vigente | 280 líneas. Priorización estratégica. |
| [audits/AUDIT_LOVABLE_LEGACY.md](AUDIT_LOVABLE_LEGACY.md) | 2026-04-11 | Vigente | 333 líneas. Deuda heredada de Lovable. |
| [_pending/README.md](../_pending/README.md) | 2026-04-11 | Vigente | 109 líneas. Índice de pendientes. |
| [_pending/MASTER_UPGRADE_2026_04.md](../_pending/MASTER_UPGRADE_2026_04.md) | 2026-04-11 | Vigente | 1423 líneas. Plan maestro 7 fases. |
| [_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md](../_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md) | 2026-04-10 | Vigente | Bug crítico abierto. Ver §5.10. |
| [_pending/features/FEATURE_MEDICAL_PDF_UPGRADE.md](../_pending/features/FEATURE_MEDICAL_PDF_UPGRADE.md) | 2026-04-11 | Vigente | 437 líneas. Roadmap PDF v2. |
| [_archive/CONTEXTO_2026_04_11.md](../_archive/CONTEXTO_2026_04_11.md) | 2026-04-09 | Vigente | 495 líneas. Estado técnico al cierre. |
| [_archive/ESTRATEGIA_MVP_2026.md](../_archive/ESTRATEGIA_MVP_2026.md) | 2026-04-10 | Vigente | 369 líneas. Pain points, checklist cobertura. |
| [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) | 2026-04-11 | Vigente | 1068 líneas. Mapa por módulo. |
| [INDEX.md](../INDEX.md) | 2026-04-10 | Vigente | Índice maestro. |
| [AGENTS.md](../AGENTS.md) | 2026-04-11 | Vigente | Config agentes IA externos. |
| [diagrams/FLUJO_COMPLETO.mmd](../diagrams/FLUJO_COMPLETO.mmd) | 2026-04-11 | Vigente | 349 líneas. Header dice "Actualizado 2026-04-11". Refleja rutas reales. |
| [junk/REDESIGN_REPORT.md](../junk/REDESIGN_REPORT.md) | 2026-04-07 | Obsoleto | 145 líneas. Redesign ya aplicado en landing. Archivar. |
| [junk/REFACTOR_PLAN.md](../junk/REFACTOR_PLAN.md) | 2026-04-07 | Obsoleto | 190 líneas. Plan ya ejecutado parcialmente. |
| [junk/AUDIT_FUNCIONAL.md](../junk/AUDIT_FUNCIONAL.md) | 2026-04-07 | Obsoleto | 120 líneas. Snapshot viejo. Reemplazado por este reporte. |
| [junk/AUDIT_REPORT.md](../junk/AUDIT_REPORT.md) | 2026-04-07 | Obsoleto | 538 líneas. Reemplazado. |
| [junk/AUDIT_REPORT_2026_04_07.md](../junk/AUDIT_REPORT_2026_04_07.md) | 2026-04-07 | Obsoleto | 90 líneas. |
| [junk/BARRIDO_COMPLETO.md](../junk/BARRIDO_COMPLETO.md) | 2026-04-10 | Duplicado | 503 líneas. Hay 3 barridos diferentes fechados. |
| [junk/BARRIDO_COMPLETO_2026_04_10.md](../junk/BARRIDO_COMPLETO_2026_04_10.md) | 2026-04-09 | Duplicado | 330 líneas. |
| [junk/BARRIDO_RESULTADO_2026_04_10.md](../junk/BARRIDO_RESULTADO_2026_04_10.md) | 2026-04-10 | Duplicado | 352 líneas. |
| [junk/CONTEXTO_2026_04_10.md](../junk/CONTEXTO_2026_04_10.md) | 2026-04-08 | Obsoleto | 427 líneas. Reemplazado por `_archive/CONTEXTO_2026_04_11.md`. |
| [junk/CONTEXTO_2026_04_10_CONTINUIDAD.md](../junk/CONTEXTO_2026_04_10_CONTINUIDAD.md) | 2026-04-10 | Obsoleto | 322 líneas. |
| [junk/CONTEXTO_2026_04_10_root.md](../junk/CONTEXTO_2026_04_10_root.md) | 2026-04-09 | Obsoleto | 251 líneas. |
| [junk/CONTEXTO_2026_04_09.md](../junk/CONTEXTO_2026_04_09.md) | 2026-04-08 | Obsoleto | 198 líneas. |
| [junk/CONTEXTO_ACTUAL.md](../junk/CONTEXTO_ACTUAL.md) | 2026-04-02 | Obsoleto | 245 líneas. |
| [junk/DESIGN_AUDIT.md](../junk/DESIGN_AUDIT.md) | 2026-04-07 | Obsoleto | 348 líneas. |
| [junk/ESTADO_APP.md](../junk/ESTADO_APP.md) | 2026-04-07 | Obsoleto | 248 líneas. |

**Recomendación**: todo lo marcado "Obsoleto"/"Duplicado" en `junk/` se puede archivar. Los vigentes viven en `audits/`, `_pending/`, `_archive/` y raíz.

---

## 10. Roadmap sugerido en 3 olas

### Ola 1 — Ahora (esta sesión / mañana)
1. `npm audit fix` (9 high vulns). Probar build post-fix.
2. [plans.ts:317](../src/lib/plans.ts#L317): `medical_history: 'Historial médico'` → `'Ficha clínica'`. Auditar propagación en [Upgrade.tsx](../src/pages/Upgrade.tsx), [MedicalRecords.tsx](../src/pages/MedicalRecords.tsx).
3. [ProviderProfileEdit.tsx:114,128,471](../src/pages/ProviderProfileEdit.tsx#L114): voseo → tuteo (3 strings).
4. [MedicalDocumentsTab.tsx:216](../src/components/medical/MedicalDocumentsTab.tsx#L216): pasar `petName` al `<MedicalSummaryButton>`.
5. [ServiceDirectory.tsx:528-566](../src/pages/ServiceDirectory.tsx#L528): fix rules-of-hooks (mover hooks arriba del early return).
6. Verificar RLS `ai_request_quota` y migración `20251127152253` contra `medical_records`.
7. [junk/BUG_GROOMERS_GRADIENT_CRASH.md](../junk/BUG_GROOMERS_GRADIENT_CRASH.md): añadir key `groomer` a `providerTypeConfig` en [ProviderProfileCard.tsx:56-89](../src/components/provider/ProviderProfileCard.tsx#L56).

### Ola 2 — Próxima semana
1. [PetQRDisplay.tsx](../src/components/medical/PetQRDisplay.tsx) + [TabCompartir.tsx](../src/pages/PetClinicalRecord/tabs/TabCompartir.tsx): descarga QR vía `nativeDownload.ts`.
2. [flow-create-subscription/index.ts:136](../supabase/functions/flow-create-subscription/index.ts#L136): `urlReturn` diferenciado.
3. [generate-medical-summary/index.ts](../supabase/functions/generate-medical-summary/index.ts): logo base64 inline, eliminar fetch vivo.
4. [vite.config.ts:26-48](../vite.config.ts#L26): añadir `charts-vendor`, `maps-vendor`, `qr-vendor`, `pdf-vendor` a `manualChunks`.
5. Regenerar `supabase/types.ts` desde CLI — eliminar `walk_*`, `lost_pets`, `shared_walks` zombies; rellenar `vet_bookings`, `pet_activity`, `organic_rewards`.
6. Atacar top 50 `any` de ESLint (ServiceDirectory, Profile, QRLanding, Reportes, Settings, UserProfile).
7. [MedicalShare.tsx:164](../src/pages/MedicalShare.tsx#L164): WhatsApp vía `openExternalUrl`.
8. Rotación de claves Supabase + Google ([project_rotate_keys_2026_04_11](../../.claude/projects/c--Users-psusa-Desktop-pet-harmony-chile-main/memory/project_rotate_keys_2026_04_11.md)).

### Ola 3 — Backlog
1. Rediseño dashboard proveedor ([_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md](../_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md), 6 fases).
2. Implementar `handleExport` PDF/CSV de Panel Pro.
3. Setear `staleTime` default en `QueryClient`.
4. Memoizar [Feed.tsx](../src/pages/Feed.tsx) y [MyPets.tsx](../src/pages/MyPets.tsx).
5. Limpiar `junk/` según §9: archivar los ~14 obsoletos.
6. Eliminar [src/pages/Actividad.tsx](../src/pages/Actividad.tsx) huérfano.
7. [tailwind.config.ts:177](../tailwind.config.ts#L177): `require()` → `import`.
8. Refactor [PetClinicalRecord/shared.tsx](../src/pages/PetClinicalRecord/shared.tsx) para separar componentes y constantes.
9. Correr matriz Playwright completa (5 engines) en CI.
10. Actualizar [CLAUDE.md §12](../CLAUDE.md) con métricas reales de bundle y renombrar referencia a `PerfilVetPublico.tsx` en §7.

---

## 11. Anexo — Comandos ejecutados

| Comando | Exit | Duración | Output |
|---|---|---|---|
| `node --version && npm --version` | 0 | <1s | v24.13.0 / 11.6.2 |
| `git rev-parse --short HEAD` | 0 | <1s | fc48e94 |
| `npx tsc -b` | 0 | 7m 25s | 0 errores |
| `npm run lint` | 1 (pipe enmascaró a 0) | 5m 06s | 539 problems |
| `npm run build` | 0 | 9m 02s | Build OK, chunks en §4 |
| `npx vitest run` | 0 | 29.6s | 81/81 passing |
| `npx playwright test --project="Desktop Chrome"` | 0 | 1m 18s | 50/50 passing |
| `npx playwright test` (matriz 5) | — | abortado 22+ min sin output | NO corrió |
| `npm audit --omit=dev` | 1 | <5s | 9 high |
| `npx depcheck --json` | 0 | ~90s | JSON persistido |

Playwright matriz completa quedó pendiente — se validó con subset Desktop Chrome que los specs son sanos.

---

_Generado por Claude Code — auditoría total Paw Friend 2026-04-11._
