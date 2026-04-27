# Paw Friend -- Manual operativo para Claude Code

> Este archivo es la fuente de verdad para cualquier agente o asistente IA que trabaje en este repositorio.
> Actualizado: 2026-04-27.

---

## 1. Identidad del producto

- **Nombre**: Paw Friend
- **Dominio**: pawfriend.cl (GitHub Pages, deploy desde `docs/`)
- **Repo**: github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile, branch `main`
- **Supabase project**: `gwailbjlvevkhwcrovfd`
- **Mobile**: Capacitor 7 (Android compilable, iOS testeado en simulator)

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
  pages/               # Una pagina por ruta (65 archivos incl. PetClinicalRecord/)
  components/          # Componentes reutilizables (272 archivos en 20 subdirs)
    ui/                # shadcn/ui primitivos (54 archivos, kebab-case)
    admin/             # Panel admin (21)
    ai/                # Componentes de IA (6)
    analytics/         # Analytics preview (4)
    calendar/          # Calendario y reservas (7)
    feed/              # Feed social (14)
    home/              # Home dashboard (5)
    maps/              # Mapa Leaflet (9)
    medical/           # Ficha clinica, PDF, compartir (7)
    memorial/          # Memorial mascotas (3)
    onboarding/        # Onboarding OCR (1)
    paw-cards/         # Paw Cards coleccionables (8)
    pawgame/           # Mini-juego gamificacion (5)
    profile/           # Perfil usuario (5)
    provider/          # Dashboard y perfil de proveedores/vets (28)
    reviews/           # Resenas (5)
    routines/          # Rutinas mascotas (4)
    settings/          # Configuracion usuario (1)
    social/            # Feed, posts, follows (1)
  hooks/               # Custom hooks (68 archivos, useXxx.tsx/.ts)
  lib/                 # Utilidades y configuracion (38 archivos + 12 tests)
  integrations/
    supabase/          # Cliente Supabase, types generados
  types/               # Tipos adicionales (capacitor-google-auth.d.ts, vetDirectory.ts)
  assets/              # Imagenes estaticas

supabase/
  functions/           # 26 Edge Functions Deno + _shared/ (6 helpers)
  migrations/          # 139 migraciones SQL (hasta 20260512000001 + flag 99999999000000)
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

## 5. Modelo de negocio FINAL (2026-04-19 — aspiracion 100% gratis B2C)

**Norte del proyecto**: que Paw Friend sea gratis para dueños y 100%
opcional en todo. La monetización es lo que permite sostener la
operación sin condicionar la experiencia del dueño de mascota.

### Los 5 tipos de monetización

| # | Motor | Quien paga | Obligatorio? | Cuando se activa |
|---|---|---|---|---|
| 1 | **Donaciones voluntarias** | Dueños que quieran aportar | Opcional siempre | Siempre disponible en /donaciones |
| 2 | **Paw Member** ($3.990/mes) | Dueños que quieran sostener | Opcional | Badge 💛 + acceso a descuentos de alianzas |
| 3 | **B2B Vets (3 tiers)** | Vets individuales | Solo para escalar | Cuando supera 5 pacientes o necesita features pro |
| 4 | **B2B Veterinarias** (clínicas) | Clínicas con varias sucursales | Solo para escalar | Tier Pro Max ($29.900) es el plan "veterinaria" |
| 5 | **Publicidad** | Partners | Solo si hay flujo | Si cruzamos N MAU que justifique slots |

### Las 3 alianzas

| Alianza | Quien | Qué aporta | Qué recibe |
|---|---|---|---|
| **Paw Voices** | Creadores/influencers peludos | Exposición de la app a su audiencia | Badge oficial + perfil destacado + código promo |
| **Paw Companys** | Empresas sponsor con aporte monetario mensual | $49.9k / $99.9k / $199.9k CLP/mes | Logo en grid /donaciones + badge Bronze/Silver/Gold + menciones |
| **Paw Partners** (nombre tentativo) | Tiendas de accesorios, comida, restaurantes, seguros | Descuentos a Paw Members + flujo a su negocio | Publicidad gratuita en la app (barter) |

Paw Companys y Paw Partners comparten la misma tabla `paw_companys` con
campo `partnership_type` ∈ {'sponsor', 'partner'} (mig 20260611000000).

### Los 4 tipos de clientes

1. **Dueños de mascotas** — usuario central. Todo gratis. Membresía Paw
   Member y donaciones son 100% opcionales.
2. **Veterinarios** — individuales. Plan Básica ($0, 5 pacientes) cubre
   vets con poco volumen. Premium/Pro Max solo para escalar.
3. **Personas que ofrecen servicios de mascotas no-vet** — walkers,
   sitters, trainers, groomers. Usan `/servicios` como vitrina.
4. **Tiendas/accesorios/restaurantes/seguros** — relación Paw Partner:
   publicidad gratuita a cambio de descuentos para Paw Members.

### B2C (dueños) — TODO GRATIS, sin features exclusivas

| Plan | Precio | Features | Badge |
|---|---|---|---|
| Gratis | $0 | Todo disponible (PDF, ficha compartida, mascotas ilimitadas, IA, analytics) | — |
| Paw Member (opcional) | $3.990/mes o $39.900/año | Mismos features + badge + acceso a descuentos de alianzas | 💛 Paw Member |

El id interno en DB sigue siendo `premium` (no romper). UI muestra "Paw Member".

### B2B (vets + veterinarias) — 4 tiers en 2 tracks

**Track INDIVIDUAL** (veterinario profesional solo):

| Plan | Precio/mes | Comisión | Pacientes | Seats | Multi-branch | Bulk import |
|---|---|---|---|---|---|---|
| Básica | $0 | 10% | 5 | 1 | No | No |
| Premium ⭐ | $9.900 | 5% | Ilimitado | 1 | No | No |

**Track CLÍNICA** (veterinaria con varios profesionales):

| Plan | Precio/mes | Comisión | Pacientes | Seats | Multi-branch | Bulk import |
|---|---|---|---|---|---|---|
| Clínica 🏥 | $19.900 | 3% | 500 | 3 vets | No | **Sí** (CSV/Excel) |
| Pro Max 👑 | $29.900 | 0% | Ilimitado | Ilimitado | Sí | Sí |

IDs internos:
- `provider_free` → Básica (individual)
- `provider_premium` → Premium (individual)
- `provider_clinic_starter` → Clínica (clínica entry)
- `provider_pro_max` → Pro Max (clínica top)

Aliases legacy via `normalizeProviderPlanId()`:
- `provider_individual` → `provider_premium`
- `provider_clinic_basic` → `provider_clinic_starter`
- `provider_clinic_pro` → `provider_pro_max`

Las features distintivas del track Clínica son: múltiples seats (3+ vets
bajo una cuenta), carga masiva de pacientes vía CSV/Excel (`bulk_patient_import`),
priority support y branding completo.

### Rutas del modelo

- `/paw-core` — visión, misión, valores, 5 motores, ideas futuras.
- `/paw-member` — página personal del user con aporte total, equivalente
  mensual, historial, descuentos de alianzas.
- `/donaciones` — aportes + muralla + grid Paw Companys + transparencia.
- `/paw-companys` — landing empresas con form aplicación.
- `/paw-voices` — landing creadores con form aplicación.
- `/para-veterinarios` — pricing B2B.
- `/upgrade` → redirige a `/paw-member` (Premium B2C descontinuado).

### Fondos y capital

Orden de prioridad en la búsqueda de financiamiento:
1. **Capital semilla público**: CORFO (SSAF-I, Semilla Expande), Chile
   Emprende, Start-Up Chile Ignite.
2. **Grants** de fundaciones que apoyen bienestar animal (futuro).
3. **Capital privado (VCs/angels)**: solo después de alcanzar volumen
   de usuarios que justifique una ronda. Score VC mejora con el modelo
   híbrido + alianzas (MRR defendible).

### Aviso fiscal operacional

Cuenta de Flow a nombre personal del fundador (no SpA). Riesgo fiscal
mientras no se migre a cuenta SpA. Pedro plan a migrar via Tenpo/Mach/
Prex. Ver memoria `project_session_2026_04_19_pivot_monetizacion.md`.

---

## 6. Edge Functions activas (29 + _shared)

```
_shared/                         # Helpers compartidos (ai-base, cors, flow-utils, prompt-utils, rate-limit, payment-gateway)
bereavement-assistant/           # Asistente IA empatico (memorial)
breed-tips/                      # Tips por raza (IA)
create-patient/                  # Crear paciente desde vet (validacion, duplicados, Paw Card, invitar dueno)
flow-create-subscription/        # Crear suscripcion Flow.cl
flow-webhook/                    # Webhook de Flow.cl
generate-medical-summary/        # PDF ficha medica
generate-medical-zip/            # ZIP documentos medicos
generate-shelters/               # Generar data de refugios
generate-sitemap/                # Sitemap SEO
generate-vet-patient-summary/    # Resumen consolidado pacientes vet
generate-weekly-owner-reports/   # Reporte semanal dueno (salud mascotas)
generate-weekly-vet-reports/     # Reporte semanal vet (stats consulta/rating)
google-calendar-callback/        # OAuth callback Google Calendar
google-calendar-disconnect/      # Desconectar Google Calendar
google-calendar-oauth-init/      # Iniciar OAuth Google Calendar
google-calendar-sync/            # Sync eventos Google Calendar
log-error/                       # Error logging centralizado (Sentry-like)
medical-suggestions/             # Sugerencias medicas IA basicas
moderate-service-promotion/      # Moderacion de promociones
ocr-vaccination-card/            # OCR de carnet de vacunacion (IA)
pet-assistant/                   # Asistente IA basico de mascotas
process-consultation-transcript/ # Transcripcion audio consulta vet
reminder-cron/                   # Cron de recordatorios
send-lead-outreach/              # Outreach a leads veterinarios (email HTML, WhatsApp wa.me URLs)
send-pet-invitation/             # Invitar dueno a gestionar mascota (vet)
send-whatsapp-reminder/          # WhatsApp (pendiente verificacion Meta)
verify-service-provider/         # Verificacion IA de proveedor
verify-vet-document/             # Verificacion vet IA-assisted
notify-pitch-application/        # Email a Pedro cuando alguien postula via /aplicar (any tipo)
```

---

## 7. Rutas principales (de src/App.tsx)

### Publicas (sin login) — 26 rutas
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
- `/registro-proveedor` -- Alias de `/registro-veterinario`
- `/registro-partner` -- Registro partner (legacy)
- `/refugios-hogares` -- Directorio publico refugios / hogares de adopcion
- `/refugios/:slug` -- Perfil publico refugio (SEO)
- `/paw-partners` -- Directorio publico Paw Partners (tiendas/servicios aliados con descuentos)
- `/aplicar` -- Form de postulacion generico (tipos: corfo, startup_chile, paw_companys, angels_vc, refugio, paw_partners, vet, paw_voices, otro)
- `/resena/:token` -- Dejar resena publica
- `/qr/:token` -- Landing publica de QR de mascota
- `/paw-card/:pawCardId` -- Landing publica de Paw Card coleccionable
- `/medical-share/:token` -- Landing publica de ficha compartida (30 dias)
- `/memoria/:petId` -- Memorial publico compartible (Refactor Maestro §6.6)
- `/nose-scan` -- Scan publico de huella nasal para identificar mascota perdida (Fase 1 §6.2, gateado por flag NOSE_PRINT_PUBLIC_SCAN)
- `/insights` -- Index de insights SEO con stats agregadas (Fase 1 §6.5)
- `/insights/:slug` -- Landing dinamica con 3 tipos de slugs: `peso-promedio-{breed}-chile` / `mascotas-{species}-chile` / `top-razas-{species}-chile`. Threshold privacy >=50 pets.
- `/terms`, `/privacy` -- Legales
- `/faq` -- Preguntas frecuentes (extraidas del landing en rediseno 2026-04-18)

### Protegidas (requieren auth) — 40 rutas
- `/home` -- Dashboard principal
- `/feed` -- Feed social
- `/comunidad`, `/comunidad/:slug` -- Grupos de comunidad (por raza/condicion)
- `/my-pets` -- Mis mascotas
- `/paw-collection` -- Coleccion de Paw Cards
- `/misiones` -- Misiones gamificacion
- `/add-pet`, `/edit-pet/:petId` -- CRUD mascotas
- `/medical-records` -- Redirect legacy → ficha clinica de primera mascota
- `/reminders` -- Recordatorios
- `/rutinas` -- Rutinas semanales por mascota
- `/mascota/:petId/rutinas` -- Rutinas de una mascota especifica
- `/mascota/:petId/timeline` -- Timeline de eventos de una mascota
- `/calendario` -- Calendario unificado (rutinas + recordatorios + citas)
- `/ficha/:petId` -- Ficha clinica completa (legacy `/mascota/:petId/ficha-clinica` y `/pet/:petId/clinical` redirigen aqui)
- `/adoption` -- Adopcion
- `/paw-game` -- Mini-juego gamificacion
- `/en-memoria` -- Memorial de mascotas fallecidas
- `/donantes-sangre` -- Red donantes sangre
- `/servicios` -- Directorio servicios
- `/services/:type` -- Servicios por tipo (walkers, vets, sitters, trainers, groomers)
- `/peluquero/perfil` -- Editar perfil groomer
- `/maps` -- Mapa de servicios
- `/chat`, `/chat/:conversationId` -- Chat
- `/profile` -- Mi perfil
- `/user/:userId` -- Perfil de otro usuario
- `/upgrade`, `/upgrade/success`, `/upgrade/cancel` -- Upgrade a Premium
- `/payment-result` -- Resultado unificado Flow (?status=success|failed)
- `/mis-reservas` -- Mis reservas
- `/mis-adopciones` -- Procesos de adopcion del adopter (Refactor Adopcion Bloque 2)
- `/mis-postulaciones` -- Aplicaciones del user (Paw Voice/Company/Pitch). Cierra loop UX
- `/reportes` -- Reportes semanales
- `/panel-pro` -- Panel Pro analytics (Premium)
- `/onboarding-mascota` -- Onboarding minimal dueno
- `/onboarding-vet` -- Onboarding minimal veterinario
- `/analytics-demo` -- Analytics dashboard (standalone demo)

### Provider (RoleGuard + ProtectedRoute) — 3 rutas
- `/provider/dashboard` -- Dashboard proveedor
- `/provider/pacientes` -- Lista pacientes
- `/provider/profile-edit` -- Editar perfil proveedor

### Admin (AdminRoute + ProtectedRoute) — 2 rutas
- `/admin` -- Panel admin (requiere rol admin)
- `/demo` -- Demo (admin-only)

### Redirects legacy — 4
- `/settings` → `/profile` (301)
- `/calendar` → `/mis-reservas` (301)
- `/mascota/:petId/ficha-clinica` → `/ficha/:petId`
- `/pet/:petId/clinical` → `/ficha/:petId`

---

## 8. Documentos de referencia

Ver `INDEX.md` para el indice completo con reglas de actualizacion.

> **Docs vivos** (deben mantenerse sincronizados con el codigo):
> ver `docs-vivos/README.md`. Hook `PostToolUse` en
> `.claude/settings.json` + `scripts/check-docs-vivos.mjs` recuerda
> actualizar el doc correspondiente cuando editas el archivo "dueño".

| Archivo | Contenido |
|---|---|
| `INDEX.md` | Indice maestro de documentacion y reglas de actualizacion |
| `MAPA_FUNCIONAL_COMPLETO.md` | Mapa de cada modulo, archivos, flujo y oportunidades |
| `AGENTS.md` | Config para agentes IA (Cursor, Copilot, etc.) |
| `diagrams/FLUJO_COMPLETO.mmd` | Diagrama Mermaid end-to-end |
| `diagrams/FLUJOS_MERMAID.md` | Diagramas individuales por modulo |
| `audits/AUDITORIA_UX_COMPLETA_2026_04_14.md` | Auditoria UX completa (reemplaza reporte 04-11) |
| `audits/FEATURES_INCOMPLETAS_2026_04_14.md` | 28 features con gaps detectados |
| `docs-raiz/planes/SUGERENCIAS_COMPLETAS_2026_04_16.md` | 49 sugerencias en 10 categorias (seguridad, perf, UX, DB, etc.) |
| `audits/OPTIMIZACION_COSTOS_2026_04_12.md` | Analisis de costos operativos y plan de eficiencia |
| `audits/COMPETENCIA_2026_04_08.md` | Analisis competitivo Chile |
| `audits/CROSS_PLATFORM_COMPATIBILITY.md` | Compatibilidad multiplataforma (iOS, Android, Web) |
| `audits/FEEDBACK_VET_SOFIA_2026_04_13.md` | Feedback de vet beta tester Sofia |
| `docs-specs/` | Specs de features pendientes (ver INDEX.md para listado) |
| `_pending/` | Plans y blueprints pendientes de ejecutar (ver _pending/README.md) |
| `_archive/` | 47 documentos ya ejecutados o superados |

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

**Nota sobre timestamps duplicados**: existen 3 pares de migraciones con el mismo timestamp (20260412200000, 20260413000000, 20260413200000). No rompen nada porque son idempotentes y afectan tablas distintas. Supabase las ejecuta en orden alfabetico cuando el timestamp coincide. NO renombrar archivos ya aplicados en produccion.

**REGLA 9.2.1 (2026-04-21) — Triggers plpgsql con smoke inline**:
plpgsql es lazy-validation: `CREATE FUNCTION` valida sintaxis pero NO valida
refs a columnas/tablas dentro del cuerpo. El trigger se crea bien y explota
solo cuando un usuario real lo dispara, posiblemente meses después.

Incidentes documentados:
- `sync_vaccination_status()` referenciaba `pets.vaccines_up_to_date`
  (columna inexistente) → 4 meses roto sin detectar.
- `notify_adoption_interest()` hacía `JOIN pets p ON p.id = ap.pet_id`
  (adoption_posts no tiene pet_id, solo pet_name).
- `create_default_reminders_for_new_pet()` insertaba con `user_id`
  (columna real: `owner_id`).

**Regla**: toda migración que crea o modifica un trigger plpgsql DEBE
incluir al final un smoke test:

```sql
CREATE OR REPLACE FUNCTION mi_trigger() RETURNS TRIGGER AS $$ ... $$;
DROP TRIGGER IF EXISTS t ON mi_tabla;
CREATE TRIGGER t AFTER INSERT ON mi_tabla FOR EACH ROW EXECUTE FUNCTION mi_trigger();

-- Smoke test: verificacion de refs del trigger. Rollback al final.
DO $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO mi_tabla (cols_minimas) VALUES (...) RETURNING id INTO v_id;
  -- Si el trigger tiene refs rotas, explota aqui y la mig falla.
  DELETE FROM mi_tabla WHERE id = v_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Trigger smoke test failed: %', SQLERRM;
END $$;
```

Si el trigger no permite insert sintético (ej: requiere FK válida a user
real), usar datos dummy con rollback completo. Lo importante: ejercitar
el trigger AL APLICAR, no en prod.

Query de auditoría para triggers existentes: [docs-raiz/planes/AUDIT_BROKEN_TRIGGERS.sql](docs-raiz/planes/AUDIT_BROKEN_TRIGGERS.sql).
Correr tras cada tanda de migraciones.

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

### 9.6. Documentacion viva
El proyecto tiene documentos que deben mantenerse actualizados. Ver `INDEX.md` para el indice completo.

**Documentos vivos** (SIEMPRE mantener actualizados):
- `diagrams/FLUJO_COMPLETO.mmd` — **FUENTE DE VERDAD** del flujo end-to-end (ver 9.7.1)
- `diagrams/FLUJOS_MERMAID.md` — diagramas individuales por modulo (complementario, NO reemplaza al `.mmd`)
- `MAPA_FUNCIONAL_COMPLETO.md` — mapa de modulos, archivos y flujos
- `AGENTS.md` — config para agentes IA externos (Cursor, Copilot, etc.)

**Regla**: si modificas rutas, navegacion, flujos de usuario, paginas, planes, o features criticas → actualizar el documento correspondiente **en el mismo commit**. Si se cambia BottomTabBar, Sidebar, Auth, pricing, o cualquier flujo critico, los diagramas y el mapa funcional deben reflejar el cambio.

#### 9.6.1. Regla del diagrama Mermaid completo

`diagrams/FLUJO_COMPLETO.mmd` es la **fuente de verdad unica** del flujo de la app y tiene reglas estrictas:

1. **Formato completo, un solo bloque pegable**. El archivo debe ser un unico `flowchart TD` continuo que el dueno pueda **seleccionar todo + copiar + pegar directo en [mermaid.live](https://mermaid.live)** sin tener que concatenar bloques ni editar nada. NO se permite:
   - Partirlo en multiples bloques ```mermaid ... ```
   - Envolverlo en markdown, headers, ni prosa fuera de comentarios `%%`
   - Dejar placeholders tipo `...` o `TODO`
2. **Siempre actualizado en el mismo commit**. Cualquier cambio en rutas (`src/App.tsx`), navegacion (BottomTabBar, Sidebar), onboarding, auth, pricing/planes, edge functions, ficha clinica, pagos, o cualquier flujo de usuario critico → **obliga** a actualizar `FLUJO_COMPLETO.mmd` en el mismo PR/commit. No se mergea el cambio si el diagrama queda desactualizado.
3. **Validar antes de commitear**. Despues de editarlo, verificar mentalmente (o pegando en mermaid.live si hay duda) que el diagrama renderiza sin errores de sintaxis. Nodos con caracteres especiales (`:`, `/`, `?`, `|`, `()`) deben ir entre comillas `["texto"]`.
4. **Cabecera con fecha**. Mantener al tope un comentario `%% FLUJO COMPLETO PAW FRIEND — Actualizado YYYY-MM-DD` con la fecha del ultimo cambio real.
5. **`FLUJOS_MERMAID.md` es secundario**. Sirve para ver modulos aislados, pero NO es la fuente de verdad. Si hay contradiccion entre ambos, gana `FLUJO_COMPLETO.mmd`.

### 9.7. Proteccion de datos de usuarios existentes

Paw Friend tiene usuarios reales en produccion. **Cualquier cambio que afecte datos, esquema, tipos, o contratos existentes debe proteger a los usuarios actuales**. Reglas:

1. **Migracion obligatoria de datos**. Si cambias una columna, tabla, enum, tipo de dato, o estructura JSON almacenada → generar migracion SQL que transforme los datos existentes al nuevo formato. Incluir `UPDATE` o `INSERT ... ON CONFLICT` para filas existentes. Nunca asumir que la tabla esta vacia.
2. **Defaults para columnas nuevas**. Toda columna `NOT NULL` nueva debe tener `DEFAULT` o un `UPDATE` previo que rellene las filas existentes. Si no, los usuarios actuales quedan con filas invalidas.
3. **Renombrar, no romper**. Si renombras una columna, campo de tipo TS, key de localStorage, o propiedad de API:
   - En DB: usar `ALTER TABLE ... RENAME COLUMN` (no drop+create).
   - En frontend: leer el valor antiguo como fallback durante al menos 1 release. Ejemplo: `localStorage.getItem('new_key') ?? localStorage.getItem('old_key')`.
   - En tipos TS: si el campo viene de Supabase, primero la migracion SQL, luego regenerar tipos, luego actualizar el codigo.
4. **Limpiar lo obsoleto**. Despues de migrar, eliminar el codigo/columna/key antiguo **en el mismo PR o en el inmediatamente siguiente**. No dejar fallbacks eternos. Marcar con comentario `// TODO(cleanup): eliminar fallback despues de release YYYY-MM-DD` si no se puede limpiar en el mismo PR.
5. **Edge functions y RPC**. Si cambias el contrato (parametros o respuesta) de una edge function o RPC que el frontend ya consume → actualizar frontend y backend en el mismo commit. Si hay clientes mobile con cache, considerar versionado o compatibilidad hacia atras temporal.
6. **Verificar antes de commitear**. Antes de dar por terminado un cambio que toca esquema o datos:
   - Preguntarse: "Un usuario que creo su cuenta ayer, ¿seguira viendo sus datos correctamente?"
   - Preguntarse: "Un vet que tiene 50 pacientes, ¿perderia algo?"
   - Si la respuesta no es un "si" claro → falta migracion o fallback.
7. **localStorage y estado local**. Si cambias keys de localStorage, sessionStorage, o IndexedDB → migrar el valor existente la primera vez que el usuario abre la app post-update. Patron:
   ```ts
   const oldVal = localStorage.getItem('old_key');
   if (oldVal) {
     localStorage.setItem('new_key', oldVal);
     localStorage.removeItem('old_key');
   }
   ```
8. **Nunca DROP TABLE ni DELETE FROM sin WHERE** en migraciones que tocan tablas con datos de usuarios. Si necesitas limpiar, usar `TRUNCATE` solo en tablas de cache/temp, y `DELETE ... WHERE condicion` para el resto.

---

## 10. Comandos disponibles

```bash
npm run dev            # Dev server (localhost:8080)
npm run build          # Build produccion -> docs/
npm run preview        # Preview del build
npx tsc -b             # Type-check (NO existe npm run typecheck)
npm run lint           # ESLint (flat config, a11y warnings)
npm run test           # Vitest unit tests (watch mode)
npm run test:ci        # Vitest sin watch (CI)
npm run test:e2e       # Playwright E2E (chromium, firefox, webkit)
npx cap run android    # Compilar y correr en Android
```

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

## 11.1. Categorizacion de modulos (Core / Labs / Pro)

| Categoria | Modulos | Descripcion |
|---|---|---|
| **Core** | Ficha clinica, PDF/ZIP, directorio vets, upgrade Premium, calendario, reminders, onboarding | Flujo principal de valor. No tocar sin QA. |
| **Pro** | Analytics dashboard, reportes semanales, weekly summary | Funcionalidades premium con datos reales. Gate via `PremiumGate`/`PremiumNudge`. |
| **Paw Labs (Beta)** | PawGame, Missions, PawCollection, Comunidad, Adopcion, Donantes de sangre | Features experimentales con banner `PawLabsBanner`. Funcionales pero en mejora continua. |
| **Internal** | Admin panel, Demo, AnalyticsDashboard (standalone) | Herramientas internas. No visibles para usuarios normales. |

Los modulos **Paw Labs** muestran un banner `<PawLabsBanner>` indicando que estan en beta. No eliminar estas rutas; mejorarlas iterativamente.

---

## 11.2. Modelo de roles y experiencias

### Roles disponibles

| Rol | Determinacion | Experiencia UI |
|---|---|---|
| **owner** (dueno) | Cualquier usuario autenticado. Default. | Entretenida: gamificacion, Paw Cards, feed social, colores vivos. |
| **provider** (vet/profesional) | Registro en tabla `service_providers`. | Profesional: dashboard clinico, pacientes, agenda. Sin gamificacion. |
| **shelter** (refugio/hogar de adopcion) | Registro en tabla `adoption_centers` (mig `20260620000000`). | Operativo: dashboard mascotas, bulk import, transferencia al adoptante. Sin gamificacion. Cuenta gratis siempre. |
| **admin** | Registro en tabla `admin_access` con `is_active=true`. | Panel interno con metricas, moderacion, sistema. |

### Principios de separacion

1. **Provider = profesional sin gamificacion**. Las vistas `/provider/*` no importan ni muestran Paw Game, Paw Cards, misiones, badges ni efectos visuales ludicos.
2. **Shelter = operativo sin gamificacion**. Las vistas `/shelter/*` son profesionales orientadas a operacion (cargar mascotas, entregar en adopcion, gestionar perfil publico).
3. **Owner = entretenido y util**. Las vistas de dueno pueden usar gradientes, animaciones holo, gamificacion, siempre alineada con salud real de la mascota.
4. **Sin leakage**: menus, sidebar y bottom tabs muestran solo rutas del rol activo. Rutas owner-only (`/paw-game`, `/paw-collection`, `/misiones`) usan `RoleGuard requiredRole="owner"`. Rutas provider-only (`/provider/*`) usan `RoleGuard requiredRole="provider"`. Rutas shelter-only (`/shelter/*`) usan `RoleGuard requiredRole="shelter"`.

### Cambio de rol (usuarios dual-role)

- Hook: `useActiveRole()` en `src/hooks/useActiveRole.tsx`
- Persiste en `localStorage` key `pf_active_role`
- Toggle **siempre visible** en Header para todos los usuarios autenticados
- **Provider → Owner**: toggle directo + toast + redirect a `/home` (sin popup de confirmacion)
- **Owner con provider record → Provider**: toggle directo + toast + redirect a `/provider/dashboard`
- **Owner SIN provider record → Provider**: abre `BecomeProviderDialog` (wizard 2 pasos: tipo + perfil profesional) → crea `service_providers` con `status: 'pending'` → redirect a `/provider/dashboard`
- `RoleGuard` auto-switchea si usuario accede a ruta del otro rol

### BecomeProviderDialog (registro inline de profesional)

- Archivo: `src/components/BecomeProviderDialog.tsx`
- **Paso 1**: elegir tipo (individual / domicilio / clinica)
- **Paso 2**: bio, especialidades, comuna base, areas de servicio (validado con zod)
- Crea registro `service_providers` con `status: 'pending'`, `is_directory_visible: false`
- No requiere aprobacion admin para usar la vista provider, pero si para aparecer en directorio publico

### Flujo mascota huerfana (vet o refugio crean mascota sin cuenta de dueno)

1. Vet crea mascota via `NewPatientForm` → pet con `pending_owner_email`, `owner_id=null`, `created_by_vet_id=callerId`
2. **Refugio** crea mascota via `/shelter/bulk-import` o formulario individual → pet con `created_by_shelter_id`
3. Edge function `send-pet-invitation` envia email con token (vet); o refugio usa link manual copiable en `/shelter/transfer/:petId`
4. Dueno click link (`?invitation=TOKEN`) → `useClaimPetInvitation` reclama la mascota
5. **Re-claim si pierde email**: `useAutoClaimByEmail` auto-detecta mascotas por email verificado
6. **Re-claim manual**: boton "Tengo un codigo de mi vet" en `/my-pets` (`ClaimPetDialog`)
7. Admin puede monitorear mascotas pendientes en Admin > Usuarios > Mascotas pendientes

### Flujo refugio → adoptante (nuevo 2026-04-20)

1. Refugio se registra via `BecomeShelterDialog` → crea `adoption_centers` con `status='active'`
2. Refugio carga mascotas via `/shelter/bulk-import` (CSV/Excel) o una por una en `/add-pet`
3. Cuando adoptante muestra interes y es aceptado, refugio va a `/shelter/transfer/:petId`:
   - Setea `pet.pending_owner_email`, `owner_invitation_token`, `shelter_adopted_at = now()`
   - Muestra link copiable + boton WhatsApp
   - Llama a `send-pet-invitation` que ya acepta shelters (email con copy adaptado)
4. Adoptante abre link → reclama la mascota con ficha medica COMPLETA

### Donaciones dirigidas a refugio (feature-flagged)

- Feature flag `SHELTER_DONATIONS` en `src/lib/featureFlags.ts` (hoy = `false`).
- Se activa cuando la cuenta Flow.cl migre a SpA (riesgo fiscal).
- UI lista en `src/pages/Donaciones.tsx`: selector de refugio beneficiario
  (aparece solo si el flag esta `true`).
- Backend: tabla `donations.beneficiary_type` + `beneficiary_adoption_center_id`
  ya existen (mig `20260620000000`). Edge fn `flow-create-donation` debe
  propagar estos campos cuando el flag se active.
- Query param `?refugio=ID` preselecciona el refugio al entrar a `/donaciones`.

### Archivos clave

- `src/hooks/useActiveRole.tsx` — contexto 3 roles (owner/provider/shelter) + persistencia
- `src/hooks/useShelter.ts` — query del adoption_center del user actual
- `src/hooks/useIsAdmin.tsx` — deteccion admin (tabla + fallback RPC)
- `src/components/RoleGuard.tsx` — guard de rutas por rol (soporta `'owner' | 'provider' | 'shelter'`)
- `src/components/AdminRoute.tsx` — guard admin
- `src/lib/routing.ts` — helpers `isOwnerRoute()`, `isProviderRoute()`, `isShelterRoute()`, constantes
- `src/components/Header.tsx:192-245` — toggle dueno/profesional (siempre visible)
- `src/components/BecomeProviderDialog.tsx` — wizard registro inline de profesional
- `src/components/BecomeShelterDialog.tsx` — wizard registro inline de refugio (3 pasos)
- `src/pages/OnboardingShelter.tsx` — landing de onboarding para refugios
- `src/pages/shelter/*` — dashboard, mascotas, bulk import, perfil, transferencia
- `src/pages/RefugiosHogares.tsx` — directorio publico `/refugios-hogares`
- `src/pages/RefugioPublico.tsx` — perfil publico `/refugios/:slug`
- `src/components/admin/AdminShelters.tsx` — panel admin (Proveedores > Refugios): verificar, suspender, activar
- `supabase/functions/send-pet-invitation/` — ahora acepta callers vet o shelter (mismo token, email con copy dinamico)
- `supabase/functions/_shared/invitation-email.ts` — template con `sourceKind: 'vet' | 'shelter'`

### Brand kit v2 (2026-04-20)

- **Ubicacion canonica**: `public/paw-friend-assets-v2/`. Auto-contenida con
  `logo/`, `favicon/`, `icons/brand-squircle/`, `icons/v1-legacy/` (45 iconos
  heredados), `icons/categories/` (6 slots para los iconos nuevos de audiencia),
  `illustrations/empty-states/`, `email/`, `event/`, `social/`, `store/`, etc.
- **Componente central**: `src/components/CategoryIcon.tsx` con tipos
  `voice | partner | company | shelter | investor | vet`. Renderiza el SVG
  de `/paw-friend-assets-v2/icons/categories/<kind>.svg` con fallback
  automatico a icono Lucide si el SVG aun no esta en produccion.
- **Como extender**: cuando se agregue un tipo nuevo de audiencia, crear
  el SVG en `icons/categories/`, agregar el kind al type `CategoryKind`
  en `CategoryIcon.tsx` y agregar meta (label/fallback/color). En el
  resto del codigo se usa `<CategoryIcon kind="xxx" badge size="lg" />`.

### Sistema de aplicaciones pitch (2026-04-20)

- **Tabla**: `pitch_applications` (mig `20260625000000`). RLS: insert
  publico con `status='submitted'`, read/update solo admin + applicant
  logueado puede leer sus propias apps.
- **Rate limit** (mig `20260625000001`): trigger BEFORE INSERT que
  rechaza >= 3 apps submitted/email/24h o duplicados mismo kind+email.
- **RPC** `approve_pitch_application(id, notes)`: segun kind crea row
  publica en `paw_companys` (sponsor|partner) o `paw_voices` (active).
  Tipos sin tabla publica (corfo/startup/angels/refugio/vet) solo
  marcan approved (leads internos + onboarding propio).
- **Edge fn** `notify-pitch-application`: email Resend a
  `PITCH_NOTIFICATION_EMAIL` (default `pedrosusaeta@pawfriend.cl`) con CTA
  directo a `admin?section=system&sub=pitch-applications`.
- **Pagina publica**: `/aplicar?tipo=<kind>` (`src/pages/Aplicar.tsx`)
  con form dinamico por tipo + usa `<CategoryIcon />` del brand v2.
- **Admin**: `src/components/admin/AdminPitchApplications.tsx` en
  `Admin > Sistema > Postulaciones` con filtros, detalle modal y
  acciones (aprobar/rechazar/contactado/en-proceso/notas).

---

## 12. Estado tecnico al cierre 2026-04-27 (post Fase 1 + Fase 2 scaffolding)

| Metrica | Valor |
|---|---|
| `npx tsc -b` | 0 errores |
| `npm run lint` | 0 errores (2 warnings react-refresh en PlanComparisonTable, no bloquean) |
| `npm run build` | Pasa (~50-70s) + post-build pre-render de 19 rutas SPA |
| `npm run test:ci` | 377/377 verde |
| Migraciones | 175+ (5 SQLs Fase 2 scaffolding 2026-04-27: research_consent, pet_risk_score, pet_health_alerts, b2b_api_keys, vaccine_overdue_cascade) |
| Edge functions | 34+ activas. Nueva Fase 2: `b2b-api` (auth via X-Pawfriend-Api-Key + rate limit per-key) |
| Rutas en App.tsx | 73+ paths |
| Premium B2C Flow | Vivo con idempotencia + rate limit |
| Google Calendar | Vivo end-to-end |
| Sentry | Integrado (@sentry/react 10.47.0) |
| WhatsApp Cloud API | Codigo listo, pendiente verificacion Meta Business |
| CRM Leads Vet | Vivo — AdminLeadsCRM + edge fn send-lead-outreach |
| Booking System V2 | Availability rules, exceptions, audit trail, all_bookings_view |
| SEO sitemap | public/sitemap.xml con 14 rutas estaticas + bloque INSIGHTS_DYNAMIC injectable en build-time |
| **Trinidad del Corazon** (Refactor Maestro) | Pet ID Card v2 + Owner Audio Notes + Quick Actions Hub |
| **Nose Print Biometrico** | DINOv2-large 1024 dims via HF Inference API. Threshold 0.55 cosine. pgvector HNSW. /nose-scan publico (gateado por flag NOSE_PRINT_PUBLIC_SCAN). PAUSADO 2026-04-27 esperando proveedor |
| **Paw Passport** | Edge fn `generate-paw-passport` PDF 8 paginas (tapa+datos+biometria+vacunas+antipara+medicos+contactos+validaciones) |
| **Memorial viral** | Pagina /memoria/:petId con OG meta + share card 1080x1080 Canvas API |
| **Refugios completos** | rescue_story + adoption_followups 30/90d trigger + cron edge fn |
| **Insights SEO** | 3 tipos de slugs (breed/species/breed_rank) + index /insights. Threshold privacy >=50 pets. Sitemap incluye slugs publicos |
| **Birthday share card** | Banner condicional Home ±14d + Canvas API descargable festiva |
| **Admin observabilidad Fase 1** | AdminFase1Widget con KPIs (nose prints, memoriales, passports, follow-up rate, insights publicados) |
| **Fase 2 §7.3 Pharma research consent** | profiles.anonymous_data_research_consent + paso 4 opcional en OnboardingQuickFlow + ResearchConsentNudge en /home + toggle en /profile |
| **Fase 2 §7.5 + §8.4.5 Risk score** | RPC calculate_pet_risk_score(pet_id) MVP heuristico + PetRiskScoreCard visible en tab Identidad de la ficha |
| **Fase 2 §2.8.3 Cascadas (ambient computing)** | pet_health_alerts + 2 cascadas activas: weight_loss_30d (trigger sync) + vaccine_overdue (RPC + cron). UI con CTAs especificos por tipo |
| **Fase 2 §7.5 API B2B v1** | Edge fn b2b-api con X-Pawfriend-Api-Key + tablas b2b_api_keys/usage + 4 RPCs + AdminB2BApiKeys panel para crear/listar/revocar sin SQL |
| **Fase 2 §7.2 Insurance scaffold** | InsuranceBanner componente listo en HomePetFocusV2, oculto behind EMBEDDED_INSURANCE=false hasta firmar partner |

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

---

## 15. Planes ejecutados (hasta 2026-04-27)

| Plan | Estado | Cambios clave |
|---|---|---|
| **Refactor Maestro Fase 0 (2026-04-23)** | Aplicado | Trinidad del Corazon (Pet ID Card + Audio + Quick Actions), 4 tabs ficha clinica (Historia/Cuidados/Identidad/Mas), Memorial viral, Paw Points canonizado, sidebar colapsado, 13 feature flags |
| **Refactor Maestro Fase 1 (2026-04-25)** | Aplicado | §6.2 Nose Print MVP con DINOv2-large 1024 dims (4 edge fns + componente captura + /nose-scan publico). §6.3 Paw Passport PDF 8 paginas. §6.5 SEO insights v2 con 3 tipos de slugs (breed/species/breed_rank) + /insights index. §6.6 Memorial share card 1080x1080 Canvas API + Birthday share card. §6.7 Refugios rescue_story + adoption_followups 30/90d trigger + cron edge fn |
| **Refactor Maestro Fase 2 scaffolding (2026-04-27)** | Aplicado | §7.3 research consent (column profiles + dialog + step en onboarding + nudge en /home). §7.5 + §8.4.5 risk score (RPC + PetRiskScoreCard en ficha). §2.8.3 cascadas (pet_health_alerts + 2 tipos: weight_loss_30d trigger + vaccine_overdue cron). §7.5 API B2B v1 (edge fn b2b-api con auth via X-Pawfriend-Api-Key + tablas keys/usage + AdminB2BApiKeys panel). §7.2 InsuranceBanner (oculto behind EMBEDDED_INSURANCE=false hasta firmar partner). Nudge consent en /home. AdminFase1Widget con KPIs Fase 1. SEO sitemap completo (14 rutas + insights dinamicos). 27→2 lint a11y warnings |
| **Refactor Adopcion 2026-04-24** | Aplicado | Bloque 1 (feed unificado /adoption + filtros + 'Me interesa'). Bloque 2 (procesos kanban /shelter/adopciones, timeline /mis-adopciones, onboarding shelter, follow-up automatico) |
| **6 refactors UX coherence (2026-04-25)** | Aplicado | AddReminderDialog con presets one-tap, QuickActionsHub usa RegisterInterventionSheet, OnboardingQuickFlow con cards especie, DejarReseña stars gigantes, Reminders FAB mobile, MyBookings con BookServiceSheet |
| **Brand v2 polish (2026-04-25)** | Aplicado | 4 empty states ilustrados (no_appointments/no_notifications/no_conversations/no_paw_cards), hero `/paw-companys`, EmptyState con prop `illustration` |
| **/mis-postulaciones (2026-04-25)** | Aplicado | Cierra loop UX donde users postulaban (Paw Voice/Company/Pitch) y nunca veían el estado. Hook useMyApplications ya existía + nueva pagina dedicada |
| Perfeccionamiento clinico/premium | Aplicado | 3 friction points vet, MedicalShare mejorado, PremiumNudge en BreedTips, PawLabsBanner en 6 paginas, Recharts lazy-load |
| Roles y experiencias | Aplicado | RoleGuard owner-only en gamificacion, routing helpers, contrato documentado |
| Mascota huerfana re-claim | Aplicado | useAutoClaimByEmail, ClaimPetDialog, AdminPendingPets |
| Limpieza de mocks | Aplicado | isPremium bug fix, AnalyticsDashboard aislado admin, chat quick replies extraidos, MOCKS_MAP.md |
| Auditoria backend | Aplicado | 8 edge functions en config.toml, timestamps duplicados documentados |
| Operacion y crecimiento 90d | Aplicado | KPIs en AdminDashboard, feature flags Labs, docs operacionales |
| Booking System V2 | Aplicado | Availability rules, exceptions, audit trail, 3-step flow, provider inbox |
| Vet ficha redesign | Aplicado | PatientKPIBar, VetFichaView 2-col, VetVitalsCard, calendar split |
| Quick wins Fase 1 | Aplicado | PublicLayout, EmptyState unificado, sonner unico, format.ts, a11y |
| Lint cleanup 2026-04-16 | Aplicado | 10 errores lint → 0, eslint ignores android/ios, tipos en useVetAnalytics |
| Vacunas + Antiparasitarios (INIT-07 Sofia) | Aplicado | TabVacunas + TabAntiparasitarios en PetClinicalRecord, mig 20260416210000 campos estructurados, mig 20260629000000 trigger auto-reminder |
| Mejora imagenes y avatares | Aplicado | `src/lib/imageUtils.ts` con compressImage + presets avatar/pet/feed, upload propio en EditProfileDrawer, crop en `ImageCropper.tsx` |
| Adopcion como onboarding (centros de adopcion) | Aplicado | Rol shelter, tabla `adoption_centers`, BecomeShelterDialog, dashboard, bulk import CSV/XLSX, transferencia a adoptante |
| Features competitivas VetCheck | Aplicado | Copropiedad (pet_co_owners + dialogs), bulk import de pacientes, reportes negocio vet, cobros WhatsApp/agenda |
| Consolidacion ficha + PDF profesional | Aplicado | PDF v3 cronologico con portada + timeline + tablas + watermark, ZIP v2, RPC `get_medical_summary_data` (sesion 2026-04-19) |
| Admin Control Center V2 | Aplicado | `error_logs` + edge fn `log-error` + withTelemetry + Admin Powerhouse 8 secciones + Pulso Diario + audit-cron-daily |
| Booking System Overhaul P0 (B2, B3, B8) | Aplicado | TodayAgendaCard usa `service_provider_id`, RescheduleDialog para provider con grace 12h, BottomTabBar "Mis Mascotas" |
| Product System Coherence Plan | Aplicado | Dia 1 + Dia 2 + Fase Final + Fase 6 al 100%: navegacion coherente, preventive care canonico, optimistic updates booking, tab Prevenciones, helpers centralizados |

### Documentos operacionales creados

- `docs/ROADMAP_90_DIAS.md` — 18 items priorizados en 4 fases
- `docs/CHECKLIST_OPERACION_DIARIA.md` — checklist de 10-15 min
- `docs/RITUAL_WEEKLY_OPS.md` — revision semanal de KPIs y feedback
- `docs/RELEASE_PROCESS.md` — flujo de release y checklist
- `docs/FEATURE_FLAGS.md` — listado y reglas de feature flags
- `docs/MOCKS_MAP.md` — auditoria de datos ficticios
- `docs/PERFORMANCE_BUDGET.md` — Web Vitals targets y bundle limits
- `docs/JOURNEYS_UX.md` — journeys dueno, vet y admin
- `docs/EDGE_FUNCTIONS_MAP.md` — mapa de 26 edge fns + helpers
- `CONTRIBUTING.md` — guia para colaboradores
- `.github/PULL_REQUEST_TEMPLATE.md` — checklist de PR
