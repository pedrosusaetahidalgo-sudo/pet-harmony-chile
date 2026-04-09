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
  functions/           # 17 Edge Functions Deno
  migrations/          # ~56 migraciones SQL (hasta 20260418000000)
  config.toml

docs/                  # Output de `npm run build` (GitHub Pages). NO editar manualmente.
audits/                # Analisis competitivos y recomendaciones
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

## 6. Edge Functions activas (17)

```
_shared/                         # Helpers compartidos
breed-tips/                      # Tips por raza (IA)
flow-create-subscription/        # Crear suscripcion Flow.cl
flow-webhook/                    # Webhook de Flow.cl
generate-medical-summary/        # PDF ficha medica
generate-medical-zip/            # ZIP documentos medicos
generate-shelters/               # Generar data de refugios
generate-sitemap/                # Sitemap SEO
google-calendar-callback/        # OAuth callback Google Calendar
google-calendar-disconnect/      # Desconectar Google Calendar
google-calendar-oauth-init/      # Iniciar OAuth Google Calendar
google-calendar-sync/            # Sync eventos Google Calendar
medical-suggestions/             # Sugerencias medicas IA basicas
moderate-service-promotion/      # Moderacion de promociones
pet-assistant/                   # Asistente IA basico de mascotas
reminder-cron/                   # Cron de recordatorios
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

### Protegidas (requieren auth)
- `/home` -- Dashboard principal
- `/feed` -- Feed social
- `/my-pets` -- Mis mascotas
- `/add-pet`, `/edit-pet/:petId` -- CRUD mascotas
- `/medical-records` -- Registros medicos
- `/reminders` -- Recordatorios
- `/pet/:petId/clinical` -- Ficha clinica completa
- `/adoption` -- Adopcion
- `/servicios` -- Directorio servicios
- `/services/:type` -- Servicios por tipo (walkers, vets, sitters, trainers, groomers)
- `/maps` -- Mapa de servicios
- `/chat`, `/chat/:conversationId` -- Chat
- `/profile` -- Mi perfil
- `/user/:userId` -- Perfil de otro usuario
- `/settings` -- Configuracion
- `/upgrade` -- Upgrade a Premium
- `/mis-reservas` -- Mis reservas
- `/provider/dashboard` -- Dashboard proveedor
- `/provider/profile-edit` -- Editar perfil proveedor
- `/peluquero/perfil` -- Editar perfil groomer
- `/admin` -- Panel admin (requiere rol admin)
- `/paw-game` -- Mini-juego gamificacion

---

## 8. Documentos de referencia (existentes)

| Archivo | Contenido |
|---|---|
| `CONTEXTO_2026_04_11.md` | Estado tecnico actual (gates, bundle, features vivas) |
| `ESTRATEGIA_MVP_2026.md` | Pain points, mercado, checklist de cobertura |
| `GUION_PITCH_VETS_60S.md` | Guion para venta a veterinarios |
| `audits/COMPETENCIA_2026_04_08.md` | Analisis competitivo Chile |
| `audits/RECOMENDACIONES_2026_04_08.md` | Recomendaciones estrategicas priorizadas |
| `audits/AUDIT_2026_04_08.md` | Auditoria tecnica del codigo |
| `audits/WALKTHROUGH_2026_04_08.md` | Walkthrough funcional de la app |

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
- Dual-role mode switching (cambiar entre modo dueno y modo vet en la misma sesion)
- Bot FAQ para clinicas
- OCR de carnet de vacunacion
- Checklist Grimace Scale (dolor felino)
- Plantillas post-consulta para vets

---

## 12. Estado tecnico al cierre 2026-04-11

| Metrica | Valor |
|---|---|
| `npx tsc -b` | 0 errores |
| `npm run build` | Pasa (~25s) |
| Bundle principal | ~291 kB / 89 kB gzip |
| Vendor splitting | Configurado (react, query, ui, icons, date, supabase) |
| Migraciones | ~56, hasta `20260418000000` |
| Edge functions | 17 activas |
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

Para tareas especializadas, invocar el subagente correspondiente:

| Agente | Archivo | Uso |
|---|---|---|
| Project Auditor | `project-auditor.md` | Auditoria general de coherencia del proyecto |
| Schema Auditor | `schema-auditor.md` | Validar esquema DB, migraciones, tipos |
| RLS Guardian | `rls-guardian.md` | Revisar politicas Row Level Security |
| Medical AI Guardian | `medical-ai-guardian.md` | Guardrails del asistente medico IA (FUTURO) |
| Rewards QR Validator | `rewards-qr-validator.md` | Validar sistema Paw Rewards QR (FUTURO) |
| Capacitor Mobile | `capacitor-mobile-specialist.md` | Problemas mobile/Capacitor |
| TypeScript Refactorer | `typescript-refactorer.md` | Refactors seguros con tipos |
| Bug Debugger | `bug-debugger.md` | Diagnostico y fix de bugs |
| QA Verifier | `qa-verifier.md` | Verificacion de flujos criticos |
| Code Reviewer | `code-reviewer.md` | Review de PRs y cambios |
| UX Copy Chilean | `ux-copy-chilean.md` | Revision de copy en espanol chileno |
| Performance Profiler | `performance-profiler.md` | Analisis de performance y bundle |
