# Contexto de Continuidad — Paw Friend
## Fecha: 2026-04-10 (para retomar el 2026-04-11)

---

## 1. Estado General del Proyecto

| Metrica | Valor |
|---|---|
| `npx tsc -b` | 0 errores |
| `npm run build` | Pasa (~19s) |
| Bundle principal | ~372 kB / 117 kB gzip |
| Migraciones aplicadas | ~67 en Supabase |
| Migraciones pendientes (no aplicadas) | 6 archivos untracked |
| Edge Functions | 17 activas |
| Paginas | 41 |
| Rutas | 59 (45 unicas + 9 redirects) |
| Tablas en DB | ~108 |
| RLS activo | 31+ tablas |
| Feature Flags | 6 definidos |

---

## 2. Lo Realizado en la Sesion del 2026-04-10

### 2.1 Panel Pro Analytics (COMPLETO)
**Archivos creados/modificados:**
- `src/pages/ProDashboard.tsx` — Dashboard Pro con datos reales
- `src/pages/standalone/AnalyticsDashboard.tsx` — Version demo con datos mock
- `src/hooks/useProAnalytics.ts` — Hook que consulta reminders, medical_records, paw_progress
- `src/hooks/useVetAnalytics.ts` — Hook para metricas de proveedor (reservas, ingresos, resenas)
- `src/components/analytics/LockedOverlay.tsx` — Overlay blur para features bloqueadas (free tier)
- `src/components/analytics/ProUpgradeCTA.tsx` — CTA de upgrade (3 variantes: inline, banner, minimal)
- `src/components/analytics/AnalyticsPreviewCard.tsx` — Mini preview en Home con sparkline
- `src/components/analytics/PetWellnessPreview.tsx` — Gauge radial de bienestar (0-100)

**Funcionalidad:**
- 4 KPIs: Recordatorios, Visitas vet, Vacunas, Bienestar/100
- Grafico de actividad 30 dias (AreaChart)
- Comparacion de periodos (BarChart current vs previous)
- Seccion vet: Reservas, Clientes unicos, Ingresos, Resenas
- Gating por plan: `usePlan()` + `checkAccess("pro_analytics")`
- Feature flag: `PRO_ANALYTICS: true`
- Ruta `/panel-pro` (protegida) y `/analytics-demo` (temporal, publica)

**Lo que falta del analytics:**
- Export PDF/CSV: botones existen pero funcion placeholder (no hay backend)
- Conectar AnalyticsDashboard standalone a datos reales (actualmente solo mock)

### 2.2 Ficha Clinica Mejorada
- Alergias/Medicamentos/Condiciones ahora son botones inline editables
- Tab Alimentacion: dropdown con 23 marcas chilenas de alimento
- Breed-tips: prompt optimizado (4 secciones, 2 puntos max, 150 palabras)

### 2.3 Navegacion y UX
- BottomTabBar: Recordatorios reemplazo a PawGame en barra inferior
- Home reordenado: alertas de salud primero
- Sidebar reorganizado: 3 grupos logicos
- QR tab compactado
- Estimador de precios: ahora con 10 servicios

### 2.4 Sidebar Fix
- Corregido bug de sidebar doble (se duplicaba en ciertas rutas)

### 2.5 Build y Deploy
- Build exitoso desplegado a `docs/` (GitHub Pages)
- Ruta `/analytics-demo` accesible para demos de venta

---

## 3. Archivos Untracked (NO commiteados)

### 3.1 Componente nuevo
| Archivo | Estado | Descripcion |
|---|---|---|
| `src/components/provider/VetFollowupsCard.tsx` | COMPLETO | Card de follow-ups veterinarios proximos 7 dias. Consulta `vet_clinical_notes` con followup_required=true. Boton "recordar dueno" es placeholder. |

### 3.2 Edge Functions compartidas
| Archivo | Estado | Descripcion |
|---|---|---|
| `supabase/functions/_shared/flow-utils.ts` | COMPLETO | HMAC-SHA256 signing para Flow.cl. Usa Web Crypto API (Deno). |
| `supabase/functions/_shared/prompt-utils.ts` | COMPLETO | Sanitizacion de inputs para AI (max 200 chars, strip injection). |

### 3.3 Migraciones SQL pendientes de aplicar
**IMPORTANTE: Estas migraciones NO se aplican automaticamente. El dueno las ejecuta manualmente desde Supabase Dashboard > SQL Editor.**

| Archivo | Que hace | Dependencias |
|---|---|---|
| `20260423000001_auto_create_pet_reminders.sql` | Crea tabla `vaccination_protocols` + trigger para auto-insertar vacunas al crear mascota | Ninguna |
| `20260423000002_clinical_note_followup_trigger.sql` | Agrega `followup_required`, `followup_date`, `followup_reason` a `vet_clinical_notes` + trigger auto-reminder | Ejecutar despues de 000001 |
| `20260423000003_auto_review_invitation.sql` | Auto-crea invitaciones de resena post-consulta en `pending_reviews` (30 dias expiry) | Independiente |
| `20260424000001_fix_vet_clinical_notes_pet_fk.sql` | Agrega FK faltante: `vet_clinical_notes.pet_id` -> `pets(id)` CASCADE | Independiente |
| `20260424000002_vaccination_protocols_unique.sql` | Constraint UNIQUE `(species, vaccine_name)` para evitar duplicados | Ejecutar despues de 000001 |
| `20260426000000_cleanup_and_reseed_all_demo.sql` | Limpieza de 100+ demo users + re-seed completo (28K+ lineas). Cascada por 30+ tablas. | Ejecutar AL FINAL de todas |

**Orden recomendado de ejecucion:**
1. `20260423000001` (vaccination_protocols)
2. `20260424000002` (unique constraint — depende de 000001)
3. `20260423000002` (clinical note followup trigger)
4. `20260423000003` (auto review invitation)
5. `20260424000001` (fix FK)
6. `20260426000000` (cleanup + reseed — SIEMPRE al final)

---

## 4. Feature Flags Actuales (`src/lib/featureFlags.ts`)

```
USER_PREMIUM:      false   ← B2C premium DESHABILITADO (pivot medico)
PAWGAME_SIDEBAR:   true    ← Reactivado abril 2026
MARKETPLACE:       false   ← Fuera de scope
SHARED_WALKS:      false   ← No alineado con foco medico
LOST_PETS_SECTION: false   ← Integrado como filtro de mapa
PRO_ANALYTICS:     true    ← ACTIVO — dashboard completo
```

---

## 5. Planes y Precios (vigentes en `src/lib/plans.ts`)

### B2C
| Plan | Precio | Mascotas | PDF | Analytics | Export |
|---|---|---|---|---|---|
| Gratis | $0 | 2 max | No | No | No |
| Premium | $3.990/mes o $39.900/ano | Ilimitadas | Si | Si | Si |

### B2B (Proveedores)
| Plan | Precio/mes | Clientes | Reservas | Analytics |
|---|---|---|---|---|
| Free | $0 | 20 | 10/mes | none |
| Individual | $9.900 | 100 | 50/mes | basic |
| Clinica Basica | $29.900 | 500 | ilimitadas | basic + featured |
| Clinica Pro | $59.900 | ilimitados | ilimitadas | advanced + API |

---

## 6. Pendientes Prioritarios

### P1 — Critico para crecimiento
| Tarea | Detalle | Archivos relacionados |
|---|---|---|
| **Aplicar 6 migraciones** | Ejecutar en Supabase Dashboard en el orden de seccion 3.3 | `supabase/migrations/202604*` |
| **Commitear archivos untracked** | VetFollowupsCard, flow-utils, prompt-utils, migraciones | Ver seccion 3 |
| **Push notifications (Capacitor/FCM)** | Necesario para percepcion de app nativa. No hay codigo aun. | Nuevo |
| **WhatsApp reminders** | Codigo existe (`send-whatsapp-reminder`), pendiente verificacion Meta Business | `supabase/functions/send-whatsapp-reminder/` |
| **Regenerar types.ts** | Post-ejecucion de migraciones, regenerar tipos Supabase | `src/integrations/supabase/types.ts` |

### P2 — Diferenciadores de alto valor
| Tarea | Detalle | Archivos relacionados |
|---|---|---|
| **Export PDF/CSV real** | Botones existen en ProDashboard, falta implementar backend/generacion | `src/pages/ProDashboard.tsx` linea ~134 |
| **Checklist Grimace Scale** | Evaluacion de dolor felino — 0 competidores tienen esto | Nuevo (componente + tabla) |
| **OCR carnet vacunacion** | 10x mejora en onboarding — escanear carnet fisico | Nuevo |
| **Bot FAQ clinicas** | Ataca pain #2 de vets (preguntas repetitivas) | Nuevo |
| **Plantillas post-consulta** | Tabla parcialmente existe, UI incompleta | Nuevo |
| **Conectar AnalyticsDashboard a datos reales** | Reemplazar mock data con hooks useProAnalytics/useVetAnalytics | `src/pages/standalone/AnalyticsDashboard.tsx` |

### P3 — Polish
| Tarea | Detalle |
|---|---|
| Optimizacion bundle | Sentry lazy-load (~80 kB ahorro) |
| Test en Samsung | Validar Capacitor en dispositivos Samsung |
| Limpiar ruta `/analytics-demo` | Es temporal, remover antes de produccion final |

---

## 7. Rutas Clave de la App (Resumen)

### Publicas
- `/` — Landing
- `/auth` — Login/registro
- `/veterinarios` — Directorio publico
- `/precios-veterinarios` — Estimador precios
- `/para-veterinarios` — Landing B2B
- `/demo` — Demo en vivo
- `/analytics-demo` — Demo analytics (TEMPORAL)
- `/resena/:token` — Dejar resena

### Protegidas
- `/home` — Dashboard
- `/my-pets` — Mis mascotas
- `/pet/:petId/clinical` — Ficha clinica completa
- `/medical-records` — Registros medicos
- `/reminders` — Recordatorios
- `/panel-pro` — **Dashboard Pro analytics** (NUEVO)
- `/feed` — Feed social
- `/provider/dashboard` — Dashboard proveedor
- `/admin` — Panel admin

---

## 8. Arquitectura de Hooks Principales

| Hook | Que hace | Usado en |
|---|---|---|
| `useProAnalytics` | Consulta reminders, medical_records, paw_progress. Retorna summary + timeline + comparison | ProDashboard, AnalyticsPreviewCard |
| `useVetAnalytics` | Consulta order_items del proveedor. Retorna bookings, revenue, rating | ProDashboard (seccion vet) |
| `usePlan` | Plan actual del usuario + `checkAccess()` para features | ProDashboard, LockedOverlay, varios |
| `useAuth` | Sesion, user, provider status | Toda la app |
| `useVetClinicalNotes` | CRUD notas clinicas veterinarias | PetClinicalRecord |
| `useVetPriceEstimator` | Precios por comuna/servicio (10 servicios) | PreciosVeterinarios |

---

## 9. Componentes Analytics (para referencia rapida)

```
src/components/analytics/
  AnalyticsPreviewCard.tsx  — Mini preview en Home (sparkline de reminders)
  LockedOverlay.tsx         — Blur + lock + "Desbloquear" para free tier
  ProUpgradeCTA.tsx         — CTA upgrade (inline/banner/minimal)
  PetWellnessPreview.tsx    — Gauge radial bienestar (0-100, 3 colores)
```

---

## 10. Commits Recientes (contexto de lo trabajado)

```
f721348 feat: ruta temporal /analytics-demo + build deploy
9f29c67 feat: dashboard analytics standalone con datos mock y recharts completos
af37890 feat: Panel Pro analytics — previews, gating, charts y documentacion de monetizacion
ca67e20 fix: sidebar doble, ficha clinica editable, breed-tips breve
d84fae1 feat: optimizar flujo app completo — nav, home, sidebar, docs, seed precios
58a41ec feat(mobile): consolidacion Capacitor 7 — plugins, helpers nativos, PDF/descargas/OAuth/deep links
ba7ec00 feat: plantillas vet, fix modal servicios, skeletons, SEO, limpieza demo
041a6a3 feat: QR landing, Grimace Scale, OCR vacunas, Sentry lazy, layouts responsive
```

---

## 11. Notas Importantes para Manana

1. **NO modificar `docs/` manualmente** — siempre `npm run build` primero
2. **Migraciones se aplican manual** — Supabase Dashboard > SQL Editor
3. **Credenciales**: Hay rotacion pendiente de claves Supabase+Google (ver memory: `project_rotate_keys_2026_04_11.md`)
4. **Copy siempre en espanol chileno**: tuteo (tu, tienes, puedes), nunca voseo
5. **Joya de la corona**: ficha medica PDF + directorio vets — solo fixes, no refactor grande
6. **`/analytics-demo` es temporal** — solo para demos de venta, no publicitar
7. **VetFollowupsCard tiene boton placeholder** — "recordar dueno" no hace nada aun
8. **Export PDF/CSV en ProDashboard es placeholder** — los botones existen pero no generan archivo

---

## 12. Prompts Sugeridos para Continuar

### Prompt 1: Commitear archivos pendientes
```
Commitea todos los archivos untracked: VetFollowupsCard.tsx, flow-utils.ts, 
prompt-utils.ts, y las 6 migraciones SQL. Usa un commit descriptivo.
```

### Prompt 2: Aplicar migraciones
```
Dame las instrucciones paso a paso para aplicar las 6 migraciones pendientes 
en Supabase Dashboard, en el orden correcto de dependencias.
```

### Prompt 3: Implementar Export PDF/CSV
```
Implementa la funcionalidad real de export PDF y CSV en ProDashboard.tsx. 
Los botones ya existen (linea ~134), falta la logica de generacion.
Usa jsPDF para PDF y genera CSV nativo.
```

### Prompt 4: Conectar AnalyticsDashboard a datos reales
```
En src/pages/standalone/AnalyticsDashboard.tsx, reemplaza todos los datos mock 
con los hooks useProAnalytics y useVetAnalytics que ya existen. Mantén el mismo 
layout y graficos.
```

### Prompt 5: Push Notifications con Capacitor
```
Implementa push notifications usando @capacitor/push-notifications + Firebase 
Cloud Messaging. Necesito: registro de token, guardar token en Supabase 
(tabla device_tokens), y enviar notificacion desde edge function.
```

### Prompt 6: Checklist Grimace Scale
```
Crea un componente GrimaceScaleChecklist para evaluacion de dolor felino.
Debe tener 5 categorias (orejas, ojos, hocico, bigotes, posicion cabeza) 
con escala 0-2 cada una. Score total 0-10. Guardar en medical_records.
Crear migracion SQL si es necesario.
```

### Prompt 7: Bot FAQ para clinicas
```
Diseña e implementa un bot FAQ para el dashboard de proveedores vet.
Debe responder preguntas frecuentes de duenos (horarios, precios, emergencias).
Usar edge function con prompt contextualizado al perfil del vet.
```

### Prompt 8: OCR Carnet de Vacunacion
```
Implementa OCR para escanear carnet de vacunacion fisico. Usar Capacitor Camera 
para captura + una edge function con vision AI para extraer datos de vacunas.
Auto-llenar la ficha clinica con los resultados.
```

---

## 13. Archivos Clave para Referencia Rapida

| Proposito | Archivo |
|---|---|
| Rutas de la app | `src/App.tsx` |
| Feature flags | `src/lib/featureFlags.ts` |
| Planes y precios | `src/lib/plans.ts` |
| Dashboard Pro | `src/pages/ProDashboard.tsx` |
| Analytics demo | `src/pages/standalone/AnalyticsDashboard.tsx` |
| Hook analytics B2C | `src/hooks/useProAnalytics.ts` |
| Hook analytics B2B | `src/hooks/useVetAnalytics.ts` |
| Home dashboard | `src/pages/Home.tsx` |
| Ficha clinica | `src/pages/PetClinicalRecord/index.tsx` |
| Navegacion inferior | `src/components/BottomTabBar.tsx` |
| Sidebar | `src/components/AppSidebar.tsx` |
| Tipos Supabase | `src/integrations/supabase/types.ts` |
| Config Supabase | `supabase/config.toml` |
| Manual operativo | `CLAUDE.md` |
| Mapa funcional | `MAPA_FUNCIONAL_COMPLETO.md` |
