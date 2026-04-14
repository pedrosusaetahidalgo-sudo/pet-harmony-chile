# Paw Friend -- Plan de Ejecucion Maestro 2026-04-13

> Generado por analisis exhaustivo de 6 agentes especializados.
> Perspectivas: Dev Senior, Product Owner, CEO, UX Lead, Security Auditor, Monetization Strategist.
> Priorizado por impacto en revenue + retencion + experiencia de usuario.
> **Pedro: ejecuta esto al volver de cenar. Aprueba todo, Claude Code lo ejecuta en orden.**

---

## RESUMEN EJECUTIVO

**Estado real de Paw Friend hoy:**
- App funcionalmente rica (~35 paginas, 21 edge functions, 113 migraciones)
- Ficha medica PDF + directorio vets = joya de la corona, bien implementada
- **Monetizacion rota**: 10 de 13 features premium NO tienen enforcement real
- **Bugs criticos**: 3-4 que bloquean flujos de usuario
- **48+ ideas no ejecutadas** con valor potencial de $1-2M CLP/ano
- **Sofia (vet beta)** dio feedback concreto que no se ha implementado

**Filosofia de este plan:**
1. Primero arreglar lo roto (bugs + seguridad)
2. Segundo cerrar las puertas del premium (revenue)
3. Tercero pulir flujos criticos (conversion)
4. Cuarto features de alto ROI (diferenciacion)

---

## FASE 0: BUGS CRITICOS + SEGURIDAD (2-3 horas)

> Sin esto, nada mas importa. Arreglar antes de cualquier feature.

### 0.1 Fix copy voseo argentino (10 min)
**Archivos:** `src/pages/ProviderProfileEdit.tsx` (lineas ~114, 128, 471)
**Que:** Reemplazar "Verifica", "Necesitas" por formas chilenas correctas si hay voseo ("Verifica" ya es correcto, buscar "tenes", "podes", etc.)
**Por que:** Violacion directa de CLAUDE.md §9.5

### 0.2 Fix terminologia "Historial medico" -> "Ficha clinica" (15 min)
**Archivos:** `src/lib/plans.ts:317` + ~11 archivos mas
**Que:** Buscar todas las instancias de "Historial medico" y reemplazar por "Ficha clinica"
**Por que:** Inconsistencia de marca en la joya de la corona

### 0.3 Fix nombre PDF generico (15 min)
**Archivo:** `src/components/medical/MedicalDocumentsTab.tsx:216`
**Que:** Pasar prop `petName` a `<MedicalSummaryButton>` para que el PDF descargue como `ficha_clinica_Luna.pdf` en vez de `resumen_medico_mascota.pdf`
**Por que:** UX rota para usuarios con multiples mascotas

### 0.4 Inline logo en edge function PDF (30 min)
**Archivo:** `supabase/functions/generate-medical-summary/index.ts`
**Que:** Convertir logo `pwa-icon-512.png` a base64 e incrustarlo en el .ts en vez de fetchearlo live desde pawfriend.cl
**Por que:** Si GH Pages esta caido, el PDF de la joya de la corona falla silenciosamente

### 0.5 Fix staleTime global de React Query (5 min)
**Archivo:** Donde se configura el QueryClient (probablemente `src/main.tsx` o similar)
**Que:** Agregar `defaultOptions: { queries: { staleTime: 60_000 } }` al QueryClient
**Por que:** Sin esto, cada mount de componente refetchea datos innecesariamente

### 0.6 Fix recurrence values en reminderTypes (15 min)
**Archivo:** `src/lib/reminderTypes.ts`
**Que:** Cambiar `"3months"` -> `"quarterly"` y `"6months"` -> `"biannual"` para que coincidan con los valores validos de la BD (`pet_reminders.recurrence_interval`)
**Por que:** Bug silencioso que impide que recordatorios recurrentes funcionen

**Verificacion:** `npx tsc -b` + `npm run build` al terminar Fase 0.

---

## FASE 1: CERRAR PUERTAS DEL PREMIUM (3-4 horas)

> El analisis revela que solo 3 de 13 features premium tienen enforcement real.
> Los usuarios free acceden a TODO. Esto es dinero en la mesa.
> Ref: `docs-specs/ANALISIS_PREMIUM_VS_FREE.md`

### 1.1 Enforcement `max_reminders` (30 min)
**Archivos:** `src/pages/Reminders.tsx`, `src/hooks/useReminders.tsx`
**Que:** Antes de crear recordatorio, verificar conteo actual vs limite del plan (3 free, ilimitado premium). Si excede, mostrar `PremiumNudge` con redirect a `/upgrade?feature=max_reminders`.
**Patron:** Ya existe en `useCanAddPet.ts` — copiar enfoque.

### 1.2 Enforcement `medical_history` por fecha (45 min)
**Archivos:** hooks de medical records (`src/hooks/useMedicalRecords.tsx`)
**Que:** En queries de ficha clinica, filtrar registros por fecha segun plan: free = ultimos 6 meses, premium = todo. Mostrar banner "Registros anteriores a 6 meses disponibles con Premium" con CTA.

### 1.3 Enforcement `share_clinical` con contador (30 min)
**Archivos:** `src/pages/PetClinicalRecord/tabs/TabCompartir.tsx` o componente de compartir
**Que:** Free = 1 ficha compartida (ya creada cuenta como usada). Premium = ilimitadas. Antes de generar token, verificar conteo en `medical_share_tokens` para el usuario.

### 1.4 Enforcement `ai_vet_assistant` con contador mensual (45 min)
**Archivos:** `src/components/ai/PetAssistant.tsx`, posiblemente edge function
**Que:** Free = 1 consulta/mes. Crear contador en tabla `ai_request_quota` (ya existe). Mostrar "Te queda 1 consulta gratis este mes" o "Desbloquea consultas ilimitadas con Premium".

### 1.5 Enforcement `export_pdf` en edge function (30 min)
**Archivo:** `supabase/functions/generate-medical-summary/index.ts`
**Que:** Verificar que el usuario tenga plan premium antes de generar PDF. Si no, retornar error 403 con mensaje claro. El frontend ya deberia gatear con PremiumGate, pero el backend debe ser la fuente de verdad.

### 1.6 Enforcement `ocr_scans` (30 min)
**Archivos:** `src/components/onboarding/VaccinationCardOCR.tsx`, edge function `ocr-vaccination-card/`
**Que:** Free = 1 scan/mes. Premium = ilimitado. Agregar check antes de invocar edge function.

**Verificacion:** `npx tsc -b` + `npm run build` al terminar Fase 1.

---

## FASE 2: PROPUESTAS VALIDADAS DE ALTO ROI (4-5 horas)

> Las 8 propuestas de `_pending/PROPUESTAS_FUNCIONALIDADES.md` estan 100% especificadas
> con archivos exactos, lineas, y patron a seguir. Zero risk, alto impacto.

### 2.1 P1: Busqueda y filtro en historial medico (2h)
**Archivo:** `src/pages/PetClinicalRecord/tabs/TabHistorial.tsx`
**Que:** Input de busqueda + Select de tipo de registro. Filtrado client-side sobre datos ya cargados.
**Valor:** Los duenos con mascotas con historial largo no encuentran nada hoy.

### 2.2 P2: Snooze de recordatorios vencidos (2h)
**Archivos:** `src/hooks/useReminders.tsx`, `src/pages/Reminders.tsx`
**Que:** Botones "Posponer 1 dia" / "Posponer 1 semana" en cada recordatorio vencido.
**Valor:** UX basica que falta — los vencidos se acumulan sin opcion de manejarlos.

### 2.3 P6: Recordatorios recurrentes automaticos (2h)
**Archivos:** `src/lib/reminderTypes.ts`, `src/hooks/useReminders.tsx`, `src/pages/Reminders.tsx`
**Que:** Al completar recordatorio con `is_recurring=true`, auto-crear el proximo segun `recurrence_interval`.
**Valor:** Feature #1 pedida por usuarios. Las columnas YA existen en la BD.

### 2.4 P4: Agenda del dia para vets (2h)
**Archivos:** Nuevo `src/components/provider/TodayAgendaCard.tsx`, `ProviderDashboard.tsx`
**Que:** Card con reservas de hoy al tope del dashboard vet. Query propia a `bookings`.
**Valor:** Los vets abren el dashboard y no ven que tienen hoy.

**Verificacion:** `npx tsc -b` + `npm run build` al terminar Fase 2.

---

## FASE 3: FEEDBACK VET SOFIA + MEJORAS FICHA CLINICA (3-4 horas)

> Sofia es la primera veterinaria real usando Paw Friend.
> Su feedback es oro — implementar sus pedidos la convierte en champion.
> Ref: memoria `project_sofia_vet_beta_tester.md`

### 3.1 Campos vacunas: lote y serie (2h)
**Archivos:** Form de `AddMedicalRecord` (componente que agrega registros medicos), tipos en `medicalRecordTypes.ts`, migracion SQL nueva
**Que:** Agregar campos `batch_number` (lote) y `serial_number` (serie) al formulario de vacunas. Migracion: `ALTER TABLE medical_records ADD COLUMN batch_number TEXT, ADD COLUMN serial_number TEXT;`
**Por que:** Sofia dijo que sin lote/serie la ficha no sirve para auditorias SAG.

### 3.2 Tab dedicada de vacunas en ficha clinica (2h)
**Archivos:** `src/pages/PetClinicalRecord/index.tsx`, nuevo tab `TabVacunas.tsx`
**Que:** Separar vacunas del timeline general a su propia tab con tabla cronologica: fecha, vacuna, lote, serie, vet, clinica. Incluir indicador "Al dia" / "Pendiente".
**Por que:** Sofia necesita ver vacunas de un vistazo, no buscarlas en el timeline.

### 3.3 Antiparasitarios con recordatorio automatico (1.5h)
**Archivos:** Similar a 3.1, agregar tipo `deworming` a `medicalRecordTypes.ts` si no existe, con campos producto, dosis, frecuencia. Al registrar antiparasitario, auto-crear recordatorio para proxima dosis.
**Por que:** Sofia dijo que los duenos nunca se acuerdan del antiparasitario.

### 3.4 Migracion SQL (NO aplicar, solo crear archivo)
**Archivo:** `supabase/migrations/20260413220000_vaccine_batch_serial.sql`
**Que:** Crear archivo con los ALTER TABLE necesarios. Pedro lo aplica manualmente desde Supabase Dashboard.

**Verificacion:** `npx tsc -b` + `npm run build` al terminar Fase 3.

---

## FASE 4: UX ONBOARDING + CONVERSION (3-4 horas)

> El analisis de flujos revela que el onboarding es funcional pero no maximiza conversion.
> Ref: `docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md` seccion 7

### 4.1 Mejorar onboarding dueno: agregar Step 2 (Salud basica) (1.5h)
**Archivo:** `src/pages/OnboardingDuenoMinimal.tsx`
**Que:** Si el Step 2 (esterilizado, tipo sangre, vacunas, alergias) ya existe, verificar que se pregunte. Si no, agregarlo. Agregar barra de progreso visual (30% -> 60% -> 90%).
**Por que:** El onboarding actual solo pide nombre + especie. Sin datos de salud, la ficha arranca vacia.

### 4.2 Mejorar HomeOnboardingHints (1h)
**Archivo:** `src/components/HomeOnboardingHints.tsx`
**Que:** Cambiar el dismiss de localStorage a que solo se oculte cuando el usuario COMPLETA las 3 acciones (agregar mascota, crear recordatorio, buscar vet), no cuando hace click en X. Agregar celebracion al completar las 3.
**Por que:** Hoy el usuario hace click en X y pierde la guia para siempre.

### 4.3 Post-pago: confirmacion clara de Premium activo (1h)
**Archivo:** `src/pages/PaymentResult.tsx`
**Que:** En caso de success, mostrar "Ya eres Premium" con badge, listar 3 features desbloqueadas, y boton directo a la feature que el usuario queria (si vino de upgrade?feature=X, redirigir ahi).
**Por que:** Hoy el usuario paga y ve un mensaje generico sin saber que cambio.

### 4.4 Badge "Atiende hoy" en directorio vets (1.5h)
**Archivos:** `src/hooks/useDirectoryVets.tsx`, `src/pages/DirectorioVets.tsx`
**Que:** Query secundaria a `provider_availability` para IDs de vets del resultado. Badge verde "Atiende hoy" en cada card del directorio.
**Valor:** Los duenos buscan vet y no saben cual esta abierto hoy. Propuesta P5 del menu de funcionalidades.

**Verificacion:** `npx tsc -b` + `npm run build` al terminar Fase 4.

---

## FASE 5: PROPUESTAS COMPLEMENTARIAS (2-3 horas)

### 5.1 P3: Tips estacionales de cuidado en Home (1.5h)
**Archivos:** Nuevo `src/lib/seasonalTips.ts`, nuevo `src/components/home/SeasonalTipsCard.tsx`, `src/pages/Home.tsx`
**Que:** Card con tips segun estacion + especie. Hemisferio sur (Chile): Abr-Sep invierno, Oct-Mar verano. Data estatica, zero backend.

### 5.2 P7: Vista rapida de paciente para vets (2h)
**Archivos:** Nuevo `src/components/provider/PatientQuickView.tsx`, `src/components/provider/VetPatientsList.tsx`
**Que:** Sheet lateral (shadcn) con resumen del paciente al hacer click. Query interna a pets + medical_records (ultimos 5). Boton "Ver ficha completa".

### 5.3 P8: Fix export CSV del Panel Pro (1h)
**Archivo:** `src/pages/ProDashboard.tsx`
**Que:** Verificar si `handleExport` ya fue implementado (memoria dice que si, 2026-04-12). Si el standalone `AnalyticsDashboard.tsx` aun tiene botones sin onClick, implementar ahi tambien.

**Verificacion:** `npx tsc -b` + `npm run build` al terminar Fase 5.

---

## FASE 6: BUILD + DEPLOY (15 min)

### 6.1 Build final
```bash
npx tsc -b
npm run build
```

### 6.2 Stage y commit
```bash
git add -A
git commit -m "feat: plan ejecucion 2026-04-13 — bugs + premium enforcement + propuestas + feedback Sofia"
```

### 6.3 Actualizar docs vivos (si hubo cambios en rutas/flujos)
- `diagrams/FLUJO_COMPLETO.mmd` — actualizar fecha + cualquier flujo nuevo
- `MAPA_FUNCIONAL_COMPLETO.md` — agregar nuevos componentes/hooks
- `_pending/README.md` — marcar items ejecutados

---

## BACKLOG POST-EJECUCION (para proximas sesiones)

### Prioridad Alta (proxima sesion)
| Item | Fuente | Esfuerzo |
|------|--------|----------|
| Trial 7 dias premium | `docs-specs/ANALISIS_PREMIUM_VS_FREE.md` Fase 4.2 | 5-8h |
| Completar integracion WhatsApp (Pedro crea Meta app) | `_pending/INTEGRACIONES_SETUP.md` | 2-4h manual |
| Completar integracion Google Calendar (Pedro crea OAuth creds) | `_pending/INTEGRACIONES_SETUP.md` | 2h |
| Audio consulta vet (MVP transcripcion) | `docs-specs/AUDIO_CONSULTA_VET.md` | 15-20h |
| Activar partners onboarding (aplicar migracion + auto-approval) | `_pending/PARTNERS_ONBOARDING.md` | 8-10h |
| Rotar API keys | `_pending/ROTAR_API_KEYS.md` | Manual Pedro |

### Prioridad Media (semana 2-3)
| Item | Fuente | Esfuerzo |
|------|--------|----------|
| Banco de sangre / donantes | `docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md` #2 | 12-16h |
| Mapa pet friendly (nueva capa) | `docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md` #3 | 12-15h |
| Sidebar provider redesign + /pacientes | `docs-specs/PROPUESTA_SIDEBAR_PROVIDER.md` | 20-25h |
| Community groups by breed/condition | `_pending/feedback/FEEDBACK_USUARIO_REAL_2026_04_10.md` #8 | 20-30h |
| Map redesign (bottom sheet, clustering, FAB) | `_pending/map-redesign-blueprint.md` | 40-60h |
| Mobile iOS consolidation | `_pending/CONSOLIDACION_MOBILE.md` | 30-40h |
| AI web search upgrade (5 edge functions) | `_pending/features/FEATURE_AI_WEB_SEARCH_UPGRADE.md` | 14h |

### Prioridad Baja (mes 2+)
| Item | Fuente | Esfuerzo |
|------|--------|----------|
| Breeding marketplace | `docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md` #1 | 15-20h |
| Insurance comparison | `docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md` #4 | 10-15h |
| Google Places migration | `_pending/migrations/PLAN_GOOGLE_PLACES_MIGRATION.md` | 8-12h |
| Testing virtual user (Playwright) | `_pending/testing-virtual-user-blueprint.md` | 15-20h |
| Tooling produccion (8 semanas) | `_pending/tooling/` | 40-60h |
| Adopcion responsable (mejoras) | `docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md` #5 | 12-16h |
| Ads nativos free tier | `docs-specs/ANALISIS_PREMIUM_VS_FREE.md` Fase 5 | 15-20h |

---

## TECH DEBT IDENTIFICADA (no bloquea, resolver incrementalmente)

| Issue | Severidad | Donde |
|-------|-----------|-------|
| TypeScript strict mode OFF | Media | `tsconfig.app.json:18` |
| 147 `as any` / `as unknown` en codebase | Media | Disperso |
| ESLint `no-unused-vars: off` | Baja | `eslint.config.js:29` |
| Solo 2 Error Boundaries en toda la app | Media | Falta en rutas criticas |
| Admin panels sin paginacion (fetch all) | Media | `src/components/admin/` |
| 33 aria-labels en toda la app (accessibility) | Media | Disperso |
| Imagenes sin srcSet/webp optimization | Baja | `src/components/LazyImage.tsx` |
| lucide-react wildcard export (150KB+) | Baja | `src/lib/icons.ts:19` |

---

## METRICAS DE EXITO POST-EJECUCION

| Metrica | Baseline | Target 30 dias |
|---------|----------|----------------|
| Gates premium con enforcement real | 3/13 | 10/13 |
| Bugs criticos abiertos | 4+ | 0 |
| Copy con voseo argentino | 3+ strings | 0 |
| Features de Sofia implementadas | 1/5 | 4/5 |
| Propuestas P1-P8 implementadas | 0/8 | 6/8 |
| Conversion free->premium | ~0% (gates abiertos) | 3-5% |

---

## INSTRUCCIONES PARA CLAUDE CODE (auto-ejecucion)

```
Ejecutar PLAN_EJECUCION_2026_04_13.md en orden de fases (0 -> 5 -> 6).

Reglas:
1. Leer CLAUDE.md primero
2. Leer cada archivo ANTES de editarlo
3. Una fase a la vez, en orden
4. Despues de cada fase: npx tsc -b para verificar 0 errores de tipos
5. NO crear migraciones SQL a menos que se indique (Fase 3.4 es la excepcion)
6. NO instalar dependencias nuevas (npm install)
7. NO modificar archivos que el plan marque como "No tocar"
8. Usar componentes shadcn/ui ya existentes
9. Copy en espanol chileno (tuteo: tu, tienes, puedes — NO voseo)
10. Al terminar Fase 5: npm run build para verificar build limpio
11. NO hacer push — solo commit local. Pedro decide cuando pushear.
12. Actualizar docs vivos si se modifican rutas o flujos (CLAUDE.md §9.7)
```

---

## NOTAS FINALES

- **Tiempo estimado total Fases 0-5:** 18-23 horas de trabajo
- **ROI esperado:** Cerrar gates premium = revenue inmediato. Features Sofia = retencion B2B.
- **Riesgo:** Zero. Todas las propuestas fueron validadas contra el codigo real.
- **Dependencias externas:** Solo Fase 3.4 (migracion SQL que Pedro aplica manual).

> Buen provecho Pedro. Cuando vuelvas, di "ejecutar plan" y arrancamos.
