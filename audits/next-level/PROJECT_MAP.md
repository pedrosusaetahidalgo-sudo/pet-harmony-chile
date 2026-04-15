# PROJECT_MAP.md — Mapa Tecnico Completo — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Estructura de archivos fuente — src/ (432 archivos)

```
src/
├── App.tsx                        # 66 rutas (lazy-loaded)
├── main.tsx                       # Entry point
├── index.css                      # Tailwind + globals
│
├── pages/                         # 63 paginas (una por ruta)
│   ├── Home.tsx                   # Dashboard dueno — 785 lineas, raw useState (deuda tecnica)
│   ├── Auth.tsx                   # Login/registro — ~650 lineas
│   ├── AddPet.tsx                 # Alta de mascota — ~1100 lineas (mayor del proyecto)
│   ├── EditPet.tsx                # Edicion de mascota
│   ├── MyPets.tsx                 # Mis mascotas — backfill paw_card_id secuencial
│   ├── MyBookings.tsx             # Mis reservas — waterfall anidado en queryFn
│   ├── MedicalRecords.tsx         # Redirect legacy -> /ficha/:petId
│   ├── Reminders.tsx              # Recordatorios/Avisos
│   ├── Feed.tsx                   # Feed social
│   ├── DirectorioVets.tsx         # Directorio publico — filtros por comuna/especialidad
│   ├── DirectorioVetComuna.tsx    # Filtro por comuna
│   ├── DirectorioVetEspecialidad.tsx
│   ├── VetProfile.tsx             # Perfil publico vet
│   ├── RegistroVeterinario.tsx    # Alta veterinario — ~600 lineas
│   ├── RegistroPartner.tsx        # Alta partner — ~850 lineas
│   ├── RegistroPartnerAlias.tsx   # Alias de RegistroPartner
│   ├── ProDashboard.tsx           # Panel Pro — ~820 lineas
│   ├── PetClinicalRecord/         # Ficha clinica (joya de la corona)
│   │   └── index.tsx              # 6 tabs, PDF/OCR/AI sobre tabs (problema UX mobile)
│   ├── QRLanding.tsx              # Landing publica QR mascota — supabase as any
│   ├── MedicalShare.tsx           # Ficha compartida (30 dias)
│   ├── PawCard.tsx                # Landing Paw Card publica
│   ├── Adoption.tsx               # Adopcion (Labs beta)
│   ├── BloodDonors.tsx            # Red donantes sangre (Labs beta)
│   ├── Community.tsx              # Grupos por raza/condicion (Labs beta)
│   ├── PawGame.tsx                # Mini-juego gamificacion (Labs beta)
│   ├── PawCollection.tsx          # Coleccion Paw Cards (Labs beta)
│   ├── Missions.tsx               # Misiones gamificacion (Labs beta)
│   ├── Memorial.tsx               # Memorial mascotas (Labs beta)
│   ├── Servicios.tsx              # Directorio servicios — supabase as any
│   ├── ServiceDirectory.tsx       # Por tipo de servicio
│   ├── Maps.tsx                   # Mapa Leaflet servicios
│   ├── Calendar.tsx               # Calendario unificado
│   ├── Reportes.tsx               # Reportes semanales — supabase as any
│   ├── Upgrade.tsx                # Upgrade a Premium
│   ├── UpgradeSuccess.tsx
│   ├── UpgradeCancel.tsx
│   ├── PaymentResult.tsx          # Resultado unificado Flow
│   ├── Profile.tsx                # Mi perfil
│   ├── UserProfile.tsx            # Perfil de otro usuario
│   ├── Chat.tsx / ChatConversation.tsx
│   ├── AdminPanel.tsx             # Panel admin (requiere rol admin)
│   ├── Demo.tsx                   # Demo admin-only
│   ├── AnalyticsDashboard.tsx     # Analytics standalone admin (datos mock aceptables)
│   ├── OnboardingMascota.tsx
│   ├── OnboardingVet.tsx
│   ├── Landing.tsx                # Pagina principal publica
│   ├── ParaVeterinarios.tsx       # Landing B2B
│   ├── ResenaPublica.tsx          # Dejar resena por token
│   ├── Terms.tsx / Privacy.tsx    # Legales
│   └── ... (resto de paginas)
│
├── components/                    # ~267 componentes en 20 subdirectorios
│   ├── ui/                        # 51 archivos — shadcn/ui primitivos (kebab-case)
│   ├── admin/                     # 21 — Panel admin
│   ├── ai/                        # 6 — Componentes de IA
│   ├── analytics/                 # 4 — Analytics preview
│   ├── calendar/                  # 7 — Calendario y reservas
│   ├── feed/                      # 14 — Feed social
│   ├── home/                      # 5 — Home dashboard
│   ├── maps/                      # 9 — Mapa Leaflet
│   ├── medical/                   # 7 — Ficha clinica, PDF, compartir
│   ├── memorial/                  # 3 — Memorial mascotas
│   ├── onboarding/                # 1 — Onboarding OCR
│   ├── paw-cards/                 # 8 — Paw Cards coleccionables
│   ├── pawgame/                   # 5 — Mini-juego gamificacion
│   ├── profile/                   # 5 — Perfil usuario
│   ├── provider/                  # 28 — Dashboard y perfil de proveedores/vets
│   ├── reviews/                   # 5 — Resenas
│   ├── routines/                  # 4 — Rutinas mascotas
│   ├── settings/                  # 1 — Configuracion usuario
│   └── social/                    # 1 — Feed, posts, follows
│
├── hooks/                         # 66 hooks custom (todos activos, ninguno muerto)
├── lib/                           # 38 utilidades y configuracion
├── integrations/supabase/         # Cliente Supabase, types generados
├── types/                         # Tipos adicionales
└── assets/                        # Imagenes estaticas
```

## Mapa de rutas — 66 paths

### Publicas sin login — 18 rutas

| Ruta | Pagina | Descripcion |
|---|---|---|
| `/` | Landing.tsx | Pagina principal |
| `/auth` | Auth.tsx | Login/registro |
| `/veterinarios` | DirectorioVets.tsx | Directorio publico vets |
| `/veterinarios/comuna/:comuna` | DirectorioVetComuna.tsx | Filtro por comuna |
| `/veterinarios/especialidad/:especialidad` | DirectorioVetEspecialidad.tsx | Filtro por especialidad |
| `/veterinarios/:slug` | VetProfile.tsx | Perfil publico vet |
| `/precios-veterinarios` | PreciosVeterinarios.tsx | Estimador precios |
| `/precios-veterinarios/comuna/:comuna` | PreciosVetComuna.tsx | Por comuna |
| `/para-veterinarios` | ParaVeterinarios.tsx | Landing B2B |
| `/registro-veterinario` | RegistroVeterinario.tsx | Registro vet |
| `/registro-proveedor` | RegistroPartnerAlias.tsx | Alias del anterior |
| `/registro-partner` | RegistroPartner.tsx | Registro partner |
| `/resena/:token` | ResenaPublica.tsx | Dejar resena publica |
| `/qr/:token` | QRLanding.tsx | Landing QR mascota |
| `/paw-card/:pawCardId` | PawCard.tsx | Landing Paw Card coleccionable |
| `/medical-share/:token` | MedicalShare.tsx | Ficha compartida (30 dias) |
| `/terms` | Terms.tsx | Terminos y condiciones |
| `/privacy` | Privacy.tsx | Politica de privacidad |

### Protegidas requieren auth — 39 rutas

| Ruta | Pagina |
|---|---|
| `/home` | Home.tsx |
| `/feed` | Feed.tsx |
| `/comunidad` | Community.tsx |
| `/comunidad/:slug` | CommunityGroup.tsx |
| `/my-pets` | MyPets.tsx |
| `/paw-collection` | PawCollection.tsx |
| `/misiones` | Missions.tsx |
| `/add-pet` | AddPet.tsx |
| `/edit-pet/:petId` | EditPet.tsx |
| `/medical-records` | MedicalRecords.tsx (redirect) |
| `/reminders` | Reminders.tsx |
| `/rutinas` | Routines.tsx |
| `/mascota/:petId/rutinas` | PetRoutines.tsx |
| `/calendario` | Calendar.tsx |
| `/ficha/:petId` | PetClinicalRecord/index.tsx |
| `/adoption` | Adoption.tsx |
| `/paw-game` | PawGame.tsx |
| `/en-memoria` | Memorial.tsx |
| `/donantes-sangre` | BloodDonors.tsx |
| `/servicios` | Servicios.tsx |
| `/services/:type` | ServiceDirectory.tsx |
| `/peluquero/perfil` | GroomerProfile.tsx |
| `/maps` | Maps.tsx |
| `/chat` | Chat.tsx |
| `/chat/:conversationId` | ChatConversation.tsx |
| `/profile` | Profile.tsx |
| `/user/:userId` | UserProfile.tsx |
| `/upgrade` | Upgrade.tsx |
| `/upgrade/success` | UpgradeSuccess.tsx |
| `/upgrade/cancel` | UpgradeCancel.tsx |
| `/payment-result` | PaymentResult.tsx |
| `/mis-reservas` | MyBookings.tsx |
| `/reportes` | Reportes.tsx |
| `/onboarding-mascota` | OnboardingMascota.tsx |
| `/onboarding-vet` | OnboardingVet.tsx |
| `/analytics-demo` | AnalyticsDashboard.tsx (admin) |
| `/panel-pro` | ProDashboard.tsx |
| `/peluquero/perfil` | GroomerProfile.tsx |
| y mas... | |

### Provider con RoleGuard — 3 rutas

| Ruta | Pagina |
|---|---|
| `/provider/dashboard` | ProviderDashboard.tsx |
| `/provider/pacientes` | ProviderPatients.tsx |
| `/provider/profile-edit` | ProviderProfileEdit.tsx |

### Admin con AdminRoute — 2 rutas

| Ruta | Pagina |
|---|---|
| `/admin` | AdminPanel.tsx |
| `/demo` | Demo.tsx |

### Redirects legacy — 4

| De | A |
|---|---|
| `/settings` | `/profile` |
| `/calendar` | `/mis-reservas` |
| `/mascota/:petId/ficha-clinica` | `/ficha/:petId` |
| `/pet/:petId/clinical` | `/ficha/:petId` |

## Edge Functions — 26 activas + _shared

### _shared/ — 6 helpers

- `ai-base` — configuracion base Anthropic
- `cors` — headers CORS
- `flow-utils` — utilidades Flow.cl
- `prompt-utils` — utilidades de prompts IA
- `rate-limit` — limitador de solicitudes (fail-open — ver auditoria de seguridad)
- `payment-gateway` — gateway de pagos

### Funciones activas

| Funcion | Proposito | Notas |
|---|---|---|
| `bereavement-assistant` | IA empatica para memorial | CORS fijo |
| `breed-tips` | Tips por raza (IA Haiku) | — |
| `flow-create-subscription` | Crear suscripcion Flow.cl | Live |
| `flow-webhook` | Webhook Flow.cl | Live, idempotente |
| `generate-medical-summary` | PDF ficha medica | Joya de la corona |
| `generate-medical-zip` | ZIP documentos medicos | — |
| `generate-shelters` | Data de refugios | — |
| `generate-sitemap` | Sitemap SEO | CORS wildcard aceptable (solo lectura) |
| `generate-vet-patient-summary` | Resumen consolidado pacientes vet | — |
| `generate-weekly-owner-reports` | Reporte semanal dueno | Premium gate |
| `generate-weekly-vet-reports` | Reporte semanal vet | — |
| `google-calendar-callback` | OAuth callback Google Calendar | — |
| `google-calendar-disconnect` | Desconectar Google Calendar | — |
| `google-calendar-oauth-init` | Iniciar OAuth Google Calendar | — |
| `google-calendar-sync` | Sync eventos Google Calendar | — |
| `log-error` | Error logging centralizado | Auth agregada pero con flaw |
| `medical-suggestions` | Sugerencias medicas IA basicas | — |
| `moderate-service-promotion` | Moderacion de promociones | — |
| `ocr-vaccination-card` | OCR carnet de vacunacion (IA) | — |
| `pet-assistant` | Asistente IA basico | — |
| `process-consultation-transcript` | Transcripcion audio consulta vet | — |
| `reminder-cron` | Cron de recordatorios (1x/dia) | — |
| `send-pet-invitation` | Invitar dueno a gestionar mascota | — |
| `send-whatsapp-reminder` | WhatsApp recordatorios | CORS wildcard — riesgo |
| `verify-service-provider` | Verificacion IA proveedor | — |
| `verify-vet-document` | Verificacion vet IA-assisted | — |

## Migraciones SQL — 142 archivos

- Rango: 2025-11-27 → 2026-05-15 + flag `99999999000000_demo_seed_flag`
- Todas aplicadas en produccion
- 3 pares con timestamp duplicado (idempotentes, afectan tablas distintas, no renombrar)
- Nuevas en sesion 2026-04-14: `vet_quick_notes`, `feedback_in_app`, `core_action_missions`
- RLS verificada en las 3 migraciones nuevas — CLEAN

## Modulos por categoria

### Core — no tocar sin QA

| Modulo | Archivos clave | Flujo |
|---|---|---|
| Ficha Clinica | `PetClinicalRecord/index.tsx`, `medical/` (7 componentes) | Tabs: Salud, Vacunas, Medicamentos, Alergias, Documentos, Historial |
| PDF/ZIP | Edge fn `generate-medical-summary`, `generate-medical-zip` | Genera y descarga |
| Directorio Vets | `DirectorioVets.tsx`, `maps/` (9 componentes) | Filtros, mapa, perfil publico |
| Auth & Roles | `Auth.tsx`, `useActiveRole.tsx`, `RoleGuard.tsx` | Login, switch dueno/vet |
| Mascotas CRUD | `AddPet.tsx`, `EditPet.tsx`, `MyPets.tsx` | Alta, edicion, listado |
| Premium/Pagos | `Upgrade.tsx`, `flow-create-subscription`, `flow-webhook` | Checkout Flow.cl |
| Mascota huerfana | `send-pet-invitation`, `useAutoClaimByEmail`, `ClaimPetDialog` | Re-claim por email o codigo |

### Pro — gated Premium

| Modulo | Archivos clave | Estado |
|---|---|---|
| Panel Pro | `ProDashboard.tsx` (~820 lineas) | Funcional — exportacion PDF/CSV placeholder |
| Reportes semanales | `Reportes.tsx`, edge fns weekly | Funcional |
| Provider Dashboard | `provider/` (28 componentes) | Funcional |

### Paw Labs — beta experimental

| Modulo | Banner | Estado |
|---|---|---|
| PawGame | PawLabsBanner | Funcional |
| Paw Cards | PawLabsBanner | Funcional |
| Misiones | PawLabsBanner | Funcional — nuevas core_action_missions |
| Comunidad | PawLabsBanner | Funcional |
| Adopcion | PawLabsBanner | Funcional |
| Donantes sangre | PawLabsBanner | Funcional |
| Memorial | PawLabsBanner | Funcional |

## Deuda tecnica identificada

| Archivo | Problema | Impacto |
|---|---|---|
| `Home.tsx` | raw useState + useEffect, 785 lineas, sin React Query | Performance — waterfalls secuenciales |
| `Header.tsx` | fetch de perfil fuera de React Query | Sin cache, refetch en cada render |
| (sin crear) | No existe `useCurrentUserProfile` hook | Perfil se fetchea 4 veces: Header, Home, AppSidebar, Profile |
| `MyPets.tsx` | backfill paw_card_id con for-of secuencial | N requests en lugar de Promise.all |
| `MyBookings.tsx` | waterfall providers luego profiles dentro de queryFn | Latencia innecesaria |
| `PetClinicalRecord/index.tsx` | acceso vet via useEffect en lugar de React Query | Inconsistente con patron del proyecto |
| `ProviderPatients.tsx`, `QRLanding.tsx`, `Reportes.tsx`, `ServiceDirectory.tsx` | `supabase as any` | Tipos desactualizados — regen pendiente |
| `MissionCard` | Duplicado: existe en raiz y en pawgame/ | Confusion de imports |
| `useServiceProviders` | Aun hace `select *` | Trafico innecesario |

## Entry flows por rol

### Dueno de mascota

```
/auth -> /onboarding-mascota -> /home -> /my-pets -> /add-pet -> /ficha/:petId
```

### Veterinario

```
/registro-veterinario -> /onboarding-vet -> /provider/dashboard -> /provider/pacientes -> NewPatientForm
```

### Admin

```
/auth (cuenta admin) -> /admin -> AdminDashboard -> [Usuarios, Finanzas, Moderacion, Logs, etc.]
```
