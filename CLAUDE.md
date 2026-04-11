# Paw Friend -- Manual operativo para Claude Code

> Este archivo es la fuente de verdad para cualquier agente o asistente IA que trabaje en este repositorio.
> Actualizado: 2026-04-11.

---

## 1. Identidad del producto

- **Nombre**: Paw Friend
- **Dominio**: pawfriend.cl (GitHub Pages, deploy desde `docs/`)
- **Repo**: github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile, branch `main`
- **Supabase project**: `gwailbjlvevkhwcrovfd`
- **Mobile**: Capacitor 7 (Android compilable, iOS testeado en simulator)
- **Joya de la corona**: ficha medica PDF descargable + directorio publico de veterinarios. Solo fixes puntuales, nada de refactor grande.

---

## 2. Stack tecnologico (real, verificado en package.json)

| Capa | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript 5.8 |
| Bundler | Vite 5 (plugin react-swc) |
| Estilos | Tailwind CSS 3 + tailwindcss-animate |
| Componentes UI | shadcn/ui (Radix primitives + CVA) |
| Estado servidor | @tanstack/react-query 5 |
| Forms | react-hook-form 7 + @hookform/resolvers + zod 3 |
| Backend | Supabase (auth, DB Postgres, Edge Functions Deno, Storage) |
| Pagos | Flow.cl (edge functions `flow-create-subscription` + `flow-webhook`) |
| Rutas | react-router-dom 6 |
| Fechas | date-fns 4 |
| Graficos | Recharts 2 |
| Iconos | lucide-react + react-icons |
| Mapas | Leaflet + react-leaflet 4.2.1 |
| QR | qrcode.react |
| Notificaciones | sonner (toasts) |
| Mobile | @capacitor/core 7 + @capacitor/android + @capacitor/ios |
| SEO | react-helmet-async |

**NO hay**: Zustand, Redux, Next.js, zod standalone (zod existe pero se usa via @hookform/resolvers).

---

## 3. Estructura del proyecto

```
src/
  App.tsx              # Rutas principales (lazy-loaded)
  main.tsx             # Entry point
  index.css            # Tailwind + globals
  pages/               # Una pagina por ruta (~35 archivos)
  components/          # Componentes reutilizables (~60 top-level + subdirs)
    ui/                # shadcn/ui primitivos (accordion, button, card, etc.)
    admin/             # Panel admin
    ai/                # Componentes de IA (breed tips, pet assistant)
    calendar/          # Calendario y reservas
    home/              # Home dashboard
    maps/              # Mapa Leaflet
    medical/           # Ficha clinica, PDF, compartir
    pawgame/           # Mini-juego gamificacion
    provider/          # Dashboard y perfil de proveedores/vets
    reviews/           # Resenas
    settings/          # Configuracion usuario
    social/            # Feed, posts, follows
  hooks/               # Custom hooks (~30 archivos, useXxx.tsx/.ts)
  lib/                 # Utilidades y configuracion (~20 archivos)
  integrations/
    supabase/          # Cliente Supabase, types generados
  contexts/            # (vacio actualmente)
  types/               # Tipos adicionales (capacitor-google-auth.d.ts, vetDirectory.ts)
  assets/              # Imagenes estaticas

supabase/
  functions/           # 21 Edge Functions Deno + _shared/ helpers
  migrations/          # 88 migraciones SQL (hasta 20260428000000 + flag 99999999000000)
  config.toml

docs/                  # Output de `npm run build` (GitHub Pages). NO editar manualmente.
audits/                # Auditorias, competencia, walkthroughs, recomendaciones
diagrams/              # Diagramas Mermaid de flujo (MANTENER ACTUALIZADOS)
INDEX.md               # Indice maestro de documentacion viva
MAPA_FUNCIONAL_COMPLETO.md  # Mapa de cada modulo, archivos, flujo
AGENTS.md              # Config para agentes IA (Cursor, Copilot, etc.)
```

---

## 4. Convenciones de nombres

| Tipo | Convencion | Ejemplo |
|---|---|---|
| Componentes React | PascalCase `.tsx` | `AppLayout.tsx`, `ProtectedRoute.tsx` |
| Paginas | PascalCase `.tsx` | `MedicalRecords.tsx`, `DirectorioVets.tsx` |
| Hooks | camelCase `useXxx.tsx` o `.ts` | `useAuth.tsx`, `usePlan.tsx` |
| Libs/utils | camelCase `.ts` | `plans.ts`, `analytics.ts`, `format.ts` |
| UI primitivos (shadcn) | kebab-case `.tsx` | `alert-dialog.tsx`, `scroll-area.tsx` |
| Edge Functions | kebab-case directorio | `flow-create-subscription/`, `pet-assistant/` |
| Migraciones SQL | timestamp prefix | `20260418000000_paw_points_trigger.sql` |

**NO usar kebab-case** para componentes custom ni hooks. Solo shadcn/ui usa kebab-case.

---

## 5. Modelo de negocio y pricing (real, de src/lib/plans.ts)

### B2C (duenos de mascotas)

| Plan | Precio mensual | Precio anual | Mascotas | PDF | Compartir ficha |
|---|---|---|---|---|---|
| Gratis | $0 | $0 | 2 | No | No |
| Premium | $3.990 | $39.900 | Ilimitadas | Si | Si |

### B2B (veterinarios y clinicas)

| Plan | Precio/mes | Comision | Clientes | Destacado | Multi-vet |
|---|---|---|---|---|---|
| Gratis | $0 | 10% | 20 | No | No |
| Individual | $9.900 | 12% | 100 | No | No |
| Clinica Basica | $29.900 | 10% | 500 | Si | Si |
| Clinica Pro | $59.900 | 0% | Ilimitados | Si | Si |

---

## 6. Edge Functions activas (21 + _shared)

```
_shared/                         # Helpers compartidos (rate limit, AI base, payment)
bereavement-assistant/           # Asistente IA empatico (memorial)
breed-tips/                      # Tips por raza (IA)
flow-create-subscription/        # Crear suscripcion Flow.cl
flow-webhook/                    # Webhook de Flow.cl
generate-medical-summary/        # PDF ficha medica
generate-medical-zip/            # ZIP documentos medicos
generate-shelters/               # Generar data de refugios
generate-sitemap/                # Sitemap SEO
generate-weekly-owner-reports/   # Reporte semanal dueno (salud mascotas)
generate-weekly-vet-reports/     # Reporte semanal vet (stats consulta/rating)
google-calendar-callback/        # OAuth callback Google Calendar
google-calendar-disconnect/      # Desconectar Google Calendar
google-calendar-oauth-init/      # Iniciar OAuth Google Calendar
google-calendar-sync/            # Sync eventos Google Calendar
medical-suggestions/             # Sugerencias medicas IA basicas
moderate-service-promotion/      # Moderacion de promociones
ocr-vaccination-card/            # OCR de carnet de vacunacion (IA)
pet-assistant/                   # Asistente IA basico de mascotas
reminder-cron/                   # Cron de recordatorios
send-pet-invitation/             # Invitar dueno a gestionar mascota (vet)
send-whatsapp-reminder/          # WhatsApp (pendiente verificacion Meta)
```

---

## 7. Rutas principales (de src/App.tsx)

### Publicas (sin login)
- `/` -- Landing
- `/auth` -- Login/registro
- `/veterinarios` -- Directorio publico vets
- `/veterinarios/comuna/:comuna` -- Filtro por comuna
- `/veterinarios/especialidad/:especialidad` -- Filtro por especialidad
- `/veterinarios/:slug` -- Perfil publico vet
- `/precios-veterinarios` -- Estimador precios por comuna
- `/precios-veterinarios/comuna/:comuna`
- `/para-veterinarios` -- Landing B2B
- `/registro-veterinario` -- Registro vet
- `/demo` -- Demo en vivo (uso interno ventas)
- `/resena/:token` -- Dejar resena publica
- `/terms`, `/privacy` -- Legales

### Publicas (ampliacion)
- `/registro-proveedor` -- Alias de `/registro-veterinario`
- `/qr/:token` -- Landing publica de QR de mascota
- `/medical-share/:token` -- Landing publica de ficha compartida (30 dias)

### Protegidas (requieren auth)
- `/home` -- Dashboard principal
- `/feed` -- Feed social
- `/comunidad`, `/comunidad/:slug` -- Grupos de comunidad (por raza/condicion)
- `/my-pets` -- Mis mascotas
- `/add-pet`, `/edit-pet/:petId` -- CRUD mascotas
- `/medical-records` -- Registros medicos
- `/reminders` -- Recordatorios
- `/pet/:petId/clinical` -- Ficha clinica completa
- `/adoption` -- Adopcion
- `/en-memoria` -- Memorial de mascotas fallecidas
- `/servicios` -- Directorio servicios
- `/services/:type` -- Servicios por tipo (walkers, vets, sitters, trainers, groomers)
- `/maps` -- Mapa de servicios
- `/chat`, `/chat/:conversationId` -- Chat
- `/profile` -- Mi perfil
- `/user/:userId` -- Perfil de otro usuario
- `/settings` -- Configuracion
- `/upgrade`, `/upgrade/success`, `/upgrade/cancel` -- Upgrade a Premium
- `/payment-result` -- Resultado unificado Flow (?status=success|failed)
- `/mis-reservas` -- Mis reservas
- `/calendar` -- Redirect legacy a `/mis-reservas`
- `/provider/dashboard` -- Dashboard proveedor
- `/provider/profile-edit` -- Editar perfil proveedor
- `/peluquero/perfil` -- Editar perfil groomer
- `/onboarding-mascota` -- Onboarding minimal dueno
- `/onboarding-vet` -- Onboarding minimal veterinario
- `/reportes` -- Reportes semanales
- `/panel-pro` -- Pro Analytics dashboard
- `/analytics-demo` -- Analytics dashboard (standalone demo)
- `/admin` -- Panel admin (requiere rol admin)
- `/paw-game` -- Mini-juego gamificacion

---

## 8. Documentos de referencia

Ver `INDEX.md` para el indice completo con reglas de actualizacion.

| Archivo | Contenido |
|---|---|
| `INDEX.md` | Indice maestro de documentacion y reglas de actualizacion |
| `MAPA_FUNCIONAL_COMPLETO.md` | Mapa de cada modulo, archivos, flujo y oportunidades |
| `AGENTS.md` | Config para agentes IA (Cursor, Copilot, etc.) |
| `diagrams/FLUJO_COMPLETO.mmd` | Diagrama Mermaid end-to-end |
| `diagrams/FLUJOS_MERMAID.md` | Diagramas individuales por modulo |
| `audits/AUDITORIA_TOTAL_APP.md` | Auditoria multi-dominio completa |
| `audits/COMPETENCIA_2026_04_08.md` | Analisis competitivo Chile |
| `audits/RECOMENDACIONES_2026_04_08.md` | Recomendaciones estrategicas priorizadas |
| `audits/AUDIT_2026_04_08.md` | Auditoria tecnica del codigo |
| `audits/WALKTHROUGH_2026_04_08.md` | Walkthrough funcional de la app |
| `_archive/CONTEXTO_2026_04_11.md` | Estado tecnico al cierre 2026-04-11 |
| `_archive/ESTRATEGIA_MVP_2026.md` | Pain points, mercado, checklist de cobertura |
| `_archive/GUION_PITCH_VETS_60S.md` | Guion para venta a veterinarios |

---

## 9. Reglas criticas

### 9.1. Carpeta docs/
`docs/` es output de `npm run build` (Vite, `outDir: 'docs'`, `emptyOutDir`). **NUNCA** modificar manualmente. Flujo correcto:
```bash
npm run build
git add docs/ && git add -u
```

### 9.2. Migraciones SQL
Generar archivo en `supabase/migrations/` con timestamp `YYYYMMDDHHMMSS_descripcion.sql`. **NUNCA** aplicar automaticamente. El dueno las aplica manualmente desde Supabase Dashboard > SQL Editor.

### 9.3. Pagos con Flow.cl
Pagos Premium B2C y B2B usan **Flow.cl**, NO Webpay. Edge function `flow-create-subscription`. Credenciales como secrets de Supabase (nunca en codigo).

### 9.4. Secrets y API keys
**NUNCA** pegar API keys en chat ni en commits. Si el usuario las pega, advertir inmediatamente + recomendar rotacion + nunca commitear.

### 9.5. Copy en espanol chileno
Tuteo chileno: **tu, tienes, puedes**. NO voseo argentino (vos, tenes, podes). NO vosotros espanol. Terminos estandarizados:
- "comuna" (no distrito, no barrio)
- "ficha clinica" (no historial medico)
- "recordatorio" (no alarma)
- "Paw Friend" (marca, siempre con mayusculas)

### 9.6. Joya de la corona
La ficha medica PDF + directorio publico de vets son las features mas valiosas. Solo fixes puntuales, nada de refactor grande sin autorizacion explicita del dueno.

### 9.7. Documentacion viva
El proyecto tiene documentos que deben mantenerse actualizados. Ver `INDEX.md` para el indice completo.

**Documentos vivos** (SIEMPRE mantener actualizados):
- `diagrams/FLUJO_COMPLETO.mmd` — **FUENTE DE VERDAD** del flujo end-to-end (ver 9.7.1)
- `diagrams/FLUJOS_MERMAID.md` — diagramas individuales por modulo (complementario, NO reemplaza al `.mmd`)
- `MAPA_FUNCIONAL_COMPLETO.md` — mapa de modulos, archivos y flujos
- `AGENTS.md` — config para agentes IA externos (Cursor, Copilot, etc.)

**Regla**: si modificas rutas, navegacion, flujos de usuario, paginas, planes, o features criticas → actualizar el documento correspondiente **en el mismo commit**. Si se cambia BottomTabBar, Sidebar, Auth, pricing, o cualquier flujo critico, los diagramas y el mapa funcional deben reflejar el cambio.

#### 9.7.1. Regla del diagrama Mermaid completo

`diagrams/FLUJO_COMPLETO.mmd` es la **fuente de verdad unica** del flujo de la app y tiene reglas estrictas:

1. **Formato completo, un solo bloque pegable**. El archivo debe ser un unico `flowchart TD` continuo que el dueno pueda **seleccionar todo + copiar + pegar directo en [mermaid.live](https://mermaid.live)** sin tener que concatenar bloques ni editar nada. NO se permite:
   - Partirlo en multiples bloques ```mermaid ... ```
   - Envolverlo en markdown, headers, ni prosa fuera de comentarios `%%`
   - Dejar placeholders tipo `...` o `TODO`
2. **Siempre actualizado en el mismo commit**. Cualquier cambio en rutas (`src/App.tsx`), navegacion (BottomTabBar, Sidebar), onboarding, auth, pricing/planes, edge functions, ficha clinica, pagos, o cualquier flujo de usuario critico → **obliga** a actualizar `FLUJO_COMPLETO.mmd` en el mismo PR/commit. No se mergea el cambio si el diagrama queda desactualizado.
3. **Validar antes de commitear**. Despues de editarlo, verificar mentalmente (o pegando en mermaid.live si hay duda) que el diagrama renderiza sin errores de sintaxis. Nodos con caracteres especiales (`:`, `/`, `?`, `|`, `()`) deben ir entre comillas `["texto"]`.
4. **Cabecera con fecha**. Mantener al tope un comentario `%% FLUJO COMPLETO PAW FRIEND — Actualizado YYYY-MM-DD` con la fecha del ultimo cambio real.
5. **`FLUJOS_MERMAID.md` es secundario**. Sirve para ver modulos aislados, pero NO es la fuente de verdad. Si hay contradiccion entre ambos, gana `FLUJO_COMPLETO.mmd`.

---

## 10. Comandos disponibles

```bash
npm run dev            # Dev server (localhost:8080)
npm run build          # Build produccion -> docs/
npm run preview        # Preview del build
npx tsc -b             # Type-check (NO existe npm run typecheck)
npm run lint           # ESLint (existe en scripts pero sin config robusta)
npx cap run android    # Compilar y correr en Android
```

**NO existen**: `npm run test`, `npm run typecheck`. No listarlos como si existieran.

---

## 11. Features del roadmap (NO implementadas aun)

Estas features estan planificadas en el mega prompt futuro pero **NO existen en el codigo actual**:

- Paw Rewards QR completo (ledger, partner_locations, canje presencial)
- Asistente medico IA con triage avanzado (mas alla del pet-assistant basico actual)
- Bot FAQ para clinicas

**Features que SI existen (y hay que dejar de listarlas como futuras)**:
- OCR de carnet de vacunacion → edge function `ocr-vaccination-card/` activa
- Feline Grimace Scale → implementado en ficha clinica
- Plantillas post-consulta para vets → tabla `consultation_templates` + UI (`ClinicalNoteEditor`)
- Dual-role mode switching → `ActiveRoleProvider` + `useActiveRole` en `src/hooks/`
- Boton "Ver como me ven los duenos" en perfil vet → preview publico del perfil en 1 click desde `ProviderProfileEdit.tsx:166` y `ProviderDashboard.tsx:193` (diferenciador unico vs la competencia: el vet valida su propio perfil publico sin salir de la app)

---

## 12. Estado tecnico al cierre 2026-04-11

| Metrica | Valor |
|---|---|
| `npx tsc -b` | 0 errores |
| `npm run build` | Pasa (~25s) |
| Bundle principal | ~291 kB / 89 kB gzip |
| Vendor splitting | Configurado (react, query, ui, icons, date, supabase) |
| Migraciones | 88, hasta `20260428000000` + flag `99999999000000_demo_seed_flag` |
| Edge functions | 21 activas + `_shared/` helpers |
| Premium B2C Flow | Vivo con idempotencia + rate limit |
| Google Calendar | Vivo end-to-end |
| WhatsApp Cloud API | Codigo listo, pendiente verificacion Meta Business |

---

## 13. Instrucciones para TodoWrite

Cuando uses la herramienta TodoWrite, sigue estas convenciones:
- Prioridad `high`: bugs que bloquean flujos criticos (auth, pagos, ficha clinica)
- Prioridad `medium`: mejoras UX, features parciales, tech debt
- Prioridad `low`: nice-to-have, optimizaciones menores
- Siempre incluir archivo y linea cuando sea posible

---

## 14. Subagentes disponibles (.claude/agents/)

Para tareas especializadas, invocar el subagente correspondiente. **13 agentes activos**:

| Agente | Archivo | Uso |
|---|---|---|
| Project Auditor | `project-auditor.md` | Auditoria general de coherencia del proyecto |
| Schema Auditor | `schema-auditor.md` | Validar esquema DB, migraciones, tipos |
| RLS Guardian | `rls-guardian.md` | Revisar politicas Row Level Security |
| Medical AI Guardian | `medical-ai-guardian.md` | Guardrails del asistente medico IA (FUTURO) |
| Rewards QR Validator | `rewards-qr-validator.md` | Validar sistema Paw Rewards QR (FUTURO) |
| Capacitor Mobile | `capacitor-mobile-specialist.md` | Problemas mobile/Capacitor |
| Cross-Platform Validator | `cross-platform-validator.md` | Valida compatibilidad Chrome/Edge/Firefox/Safari iOS/WebView Capacitor |
| TypeScript Refactorer | `typescript-refactorer.md` | Refactors seguros con tipos |
| Bug Debugger | `bug-debugger.md` | Diagnostico y fix de bugs |
| QA Verifier | `qa-verifier.md` | Verificacion de flujos criticos |
| Code Reviewer | `code-reviewer.md` | Review de PRs y cambios |
| UX Copy Chilean | `ux-copy-chilean.md` | Revision de copy en espanol chileno |
| Performance Profiler | `performance-profiler.md` | Analisis de performance y bundle |
