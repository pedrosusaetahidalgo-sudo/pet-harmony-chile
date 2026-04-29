# CHANGELOG_PROPOSED.md — Changelog Propuesto — Paw Friend v1.1
<!-- Generado: 2026-04-14 | Auditoria sesion next-level -->

Este archivo documenta todos los cambios de la sesion de auditoria 2026-04-14 y los items pendientes para completar la version v1.1.

Items marcados con [x] fueron implementados en la sesion de auditoria 2026-04-14.
Items marcados con [ ] estan pendientes de implementacion.

---

## v1.1 — Seguridad

### Completado

- [x] Open redirect fix basico — bloquear URLs absolutas en parametro redirect post-login
- [x] Open redirect `//evil.com` bypass fix — regex `/^\/[^\/]/` para aceptar solo paths validos
- [x] CORS wildcard fix en bereavement-assistant — origenes especificos
- [x] CORS wildcard fix en log-error — origenes especificos
- [x] Auth check agregada en log-error — valida que la solicitud venga de un cliente autorizado

### Pendiente

- [ ] Rotar claves Supabase service_role + Google OAuth client secret — BLOQUEANTE
- [ ] Fix log-error bypass logico — reemplazar `includes(supabaseAnonKey)` con comparacion estricta
- [ ] Hardening CORS en send-whatsapp-reminder — restringir a origenes internos
- [ ] Verificar Google Maps API key con restriccion de referrer HTTP en Google Cloud Console
- [ ] Habilitar `verify_jwt=true` en edge functions que requieren usuario autenticado

---

## v1.1 — Bug fixes

### Completado

- [x] /panel-pro RoleGuard eliminado — ProDashboard maneja roles internamente
- [x] EmptyState consolidado — un solo componente en lugar de variantes duplicadas
- [x] Copy "My Paws" cambiado a "Mis Mascotas" — 5 archivos
- [x] Copy "Recordar" cambiado a "Avisos" en BottomTabBar y Reminders
- [x] dialog.tsx boton cerrar — ahora cumple 44px de touch target

### Pendiente

- [ ] Mismatch "Recordatorios" vs "Avisos" — actualizar AppSidebar.tsx para usar "Avisos"
- [ ] Wire lastVetVisit en Home.tsx — query definida pero no conectada al componente
- [ ] Appointments query en Home.tsx — agregar filtro `.eq('user_id', user.id)` como defensa adicional
- [ ] Double empty state en Home.tsx — eliminar Card purpura duplicada, dejar solo HomeOnboardingHints

---

## v1.1 — Performance

### Completado

- [x] Recharts en manualChunks de Vite — chunk independiente 432kB/114kB gzip, carga lazy
- [x] Promise.all en useFollows — requests en paralelo
- [x] select columnas especificas en Home.tsx — reduccion de payload
- [x] staleTime 5min en useServiceProviders — cache de lista de proveedores

### Pendiente

- [ ] Promise.all en MyPets backfill de paw_card_id — reemplazar for-of secuencial
- [ ] Promise.all en MyBookings waterfall dentro de queryFn
- [ ] Crear useCurrentUserProfile hook — eliminar 4 fetches duplicados del perfil
- [ ] Migrar Home.tsx completo a React Query — eliminar raw useState + useEffect
- [ ] select columnas especificas en useServiceProviders — actualmente select *
- [ ] Consolidar MyBookings con join de Supabase

---

## v1.1 — Nuevas features implementadas

### Completado

- [x] vet_quick_notes — post-it por paciente para veterinarios, con hook y UI integrada
- [x] feedback_in_app — feedback in-app con FeedbackDialog component
- [x] core_action_missions — misiones de gamificacion atadas a acciones reales de cuidado

---

## v1.1 — Limpieza de codigo

### Completado

- [x] 22 dead components eliminados (16 en sesiones anteriores + 6 en esta sesion):
  - PageSkeleton
  - FeatureCard
  - TrustBadge
  - EnhancedReviewCard
  - CreateReviewForm
  - LostPetsMap
  - + 16 componentes de sesiones anteriores

### Pendiente

- [ ] Consolidar MissionCard duplicado — eliminar de raiz de components/, usar solo pawgame/MissionCard
- [ ] Regenerar tipos de Supabase — `npx supabase gen types typescript`
- [ ] Eliminar `supabase as any` en ProviderPatients.tsx, QRLanding.tsx, Reportes.tsx, ServiceDirectory.tsx

---

## v1.1 — Accesibilidad

### Completado

- [x] dialog.tsx boton cerrar — touch target 44px

### Pendiente

- [ ] Skip-to-content link — WCAG 2.4.1 Level A (bloqueante para cumplimiento)
- [ ] Focus rings en dropdown-menu.tsx — color-only no es suficiente
- [ ] Focus rings en 24 archivos con outline-none sin ring compensatorio
- [ ] Touch targets >= 44px en BottomTabBar y controles de ficha clinica
- [ ] aria-pressed en role switcher del Header
- [ ] Feed Badge onClick — convertir a button nativo
- [ ] PetClinicalRecord PawPoints nudge — convertir div onClick a button con aria-label
- [ ] text-[9px] reemplazado por minimo text-[10px] en 13 archivos (20 instancias)
- [ ] user-select:none eliminado del body en index.css

---

## v1.1 — Analytics

### Pendiente

- [ ] Conectar analytics.track() a proveedor real — PostHog recomendado (free tier)
- [ ] Llamar identify() post-login con perfil del usuario
- [ ] Instrumentar CLINICAL_PDF_DOWNLOADED en MedicalSummaryButton
- [ ] Instrumentar PREMIUM_CONVERTED en flow-webhook o post-pago
- [ ] Instrumentar CLINICAL_RECORD_VIEWED en PetClinicalRecord
- [ ] Instrumentar MEDICAL_RECORD_ADDED en formularios de ficha clinica
- [ ] Conectar trackEvent() de useAnalyticsTracker para eventos custom

---

## v1.1 — Testing

### Completado

- [x] owner-clinical-lifecycle.spec.ts — spec E2E para flujo de ficha clinica (nuevo)
- [x] vet-daily-workflow.spec.ts — spec E2E para flujo diario del veterinario (nuevo)

### Pendiente

- [ ] auth.spec.ts — tests E2E de registro y login
- [ ] role-switching.spec.ts — tests E2E de cambio de rol
- [ ] clinical-record.spec.ts — expandir con tests de PDF y compartir ficha
- [ ] usePlan.test.ts — tests unitarios de logica de planes
- [ ] useActiveRole.test.ts — tests unitarios de gestion de roles
- [ ] Comenzar a usar @testing-library/react (instalado pero sin uso)

---

## v1.1 — Documentacion

### Completado

- [x] 12 documentos de auditoria en audits/next-level/:
  - PROJECT_SNAPSHOT_CURRENT.md
  - PROJECT_MAP.md
  - CLAUDE_AUDIT_MASTER.md
  - ARCHITECTURE_REFACTOR_PLAN.md
  - UX_UI_NEXT_LEVEL_AUDIT.md
  - PERFORMANCE_EDGE_DB_AUDIT.md
  - SECURITY_AUTH_AUDIT.md
  - TESTING_E2E_MATRIX.md
  - ANALYTICS_GROWTH_EVENTS.md
  - RESPONSIVE_ACCESSIBILITY_AUDIT.md
  - RELEASE_READINESS_REPORT.md
  - CHANGELOG_PROPOSED.md (este archivo)

### Pendiente

- [ ] Actualizar CLAUDE.md — corregir pricing: provider_free 20->15 clientes, comision 12%->10%
- [ ] Actualizar FLUJO_COMPLETO.mmd — reflejar las 3 nuevas features (vet_quick_notes, feedback_in_app, core_action_missions)

---

## Backlog v1.2+ (sesiones futuras)

Estos items son mejoras importantes pero no urgentes. Se documentan para no perderlos.

| Item | Categoria | Esfuerzo estimado |
|---|---|---|
| useCurrentUserProfile hook + migracion en 4 consumidores | Arquitectura | 2-3h |
| Home.tsx completo a React Query | Arquitectura | 4-6h |
| MyBookings consolidacion con join | Arquitectura | 2-3h |
| Expansion de testing — Fase 1 (auth E2E) | Testing | 3-4h |
| Expansion de testing — Fase 2 (clinical E2E) | Testing | 3-4h |
| Expansion de testing — Fase 3 (hooks unitarios) | Testing | 3-4h |
| PetClinicalRecord tabs scroll en mobile | UX | 2h |
| DirectorioVets filtros como chips/drawer en mobile | UX | 3-4h |
| PDF export real en ProDashboard | Feature | 4-6h |
| Paw Rewards QR completo (ledger, canje presencial) | Feature nueva | Sprint |
| Asistente medico IA con triage avanzado | Feature nueva | Sprint |
| useServiceProviders select columnas especificas | Performance | 30min |
