# PROJECT_SNAPSHOT_CURRENT.md — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Identidad del producto

| Campo | Valor |
|---|---|
| Nombre | Paw Friend |
| Dominio | pawfriend.cl |
| Hosting | GitHub Pages, deploy desde `docs/` (output de `npm run build`) |
| Repo | github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile, branch `main` |
| Supabase project | `gwailbjlvevkhwcrovfd` |
| Estado | MVP en produccion con beta tester real (Sofia, veterinaria) |

## Problema que resuelve

Centralizar la salud y bienestar de mascotas en Chile. Ofrece ficha clinica digital con PDF descargable, directorio publico de veterinarios, recordatorios de vacunas y medicamentos, y herramientas de gestion clinica para veterinarios.

## Segmentos de usuarios

| Segmento | Descripcion |
|---|---|
| B2C — Duenos de mascotas | Dashboard personal, ficha clinica, recordatorios, gamificacion, feed social |
| B2B — Veterinarios y clinicas | Dashboard clinico, gestion de pacientes, agenda, perfil publico, reportes |

## Stack tecnologico verificado en package.json

| Capa | Tecnologia | Version |
|---|---|---|
| Framework | React + TypeScript | 18.3 / 5.8 |
| Bundler | Vite + plugin react-swc | 5.x |
| Estilos | Tailwind CSS + tailwindcss-animate | 3.x |
| Componentes UI | shadcn/ui (Radix primitives + CVA) | — |
| Estado servidor | @tanstack/react-query | 5.x |
| Forms | react-hook-form + @hookform/resolvers + zod | 7 / — / 3 |
| Backend DB | Supabase Postgres | ~122 tablas |
| Auth | Supabase Auth | — |
| Edge Functions | Supabase Edge Functions (Deno) | 26 activas |
| Storage | Supabase Storage | — |
| Realtime | Supabase Realtime | filtrado activo |
| Mobile | Capacitor | 7.x (Android compilable, iOS simulator) |
| Monitoreo | Sentry | @sentry/react 10.47.0 |
| Pagos | Flow.cl | Live en produccion |
| IA | Anthropic Haiku | Live en produccion |
| Mapas | Leaflet + react-leaflet | 4.2.1 |
| Rutas | react-router-dom | 6.x |
| Fechas | date-fns | 4.x |
| Graficos | Recharts | 2.x — chunk independiente |
| Iconos | lucide-react + react-icons | — |
| QR | qrcode.react | — |
| Notificaciones | sonner (toasts) | — |
| SEO | react-helmet-async | — |

**NO presente en el stack**: Zustand, Redux, Next.js, PostHog, Mixpanel, Amplitude, Segment.

## Integraciones externas

| Integracion | Estado |
|---|---|
| Flow.cl — pagos Premium B2C y B2B | Live en produccion |
| Google Calendar OAuth | Live end-to-end |
| Anthropic Haiku — IA (OCR, asistente, breed-tips, ficha) | Live en produccion |
| Leaflet — mapas vets y servicios | Live en produccion |
| Sentry — error monitoring | Configurado |
| WhatsApp Cloud API | Codigo listo, pendiente verificacion Meta Business |

## Flujos criticos

| Flujo | Descripcion | Estado |
|---|---|---|
| Ficha clinica + PDF | Joya de la corona: registro medico completo + PDF descargable | Solido, en produccion |
| Directorio publico vets | Busqueda y filtros por comuna/especialidad, perfil publico | Solido, en produccion |
| Auth + role switching | Login, registro, cambio dueno/veterinario | Solido |
| Premium upgrade via Flow.cl | Checkout, webhook, activacion plan | Vivo con idempotencia + rate limit |
| Mascota huerfana re-claim | Vet crea mascota, dueno la reclama por email o codigo | Implementado |

## Metricas del proyecto — estado actual

| Metrica | Valor |
|---|---|
| Errores TypeScript (npx tsc -b) | 0 |
| Tiempo de build | ~1 minuto |
| Bundle principal index | 334 kB / 100 kB gzip |
| Chunk recharts-vendor | 432 kB / 114 kB gzip — chunk independiente |
| Archivos fuente src/ | 432 total |
| Paginas | 63 |
| Componentes | ~267 en 20 subdirectorios |
| Hooks custom | 66 |
| Libs/utilidades | 38 |
| Migraciones SQL | 142 (2025-11-27 a 2026-05-15 + flag) |
| Edge functions | 26 activas + _shared/ (6 helpers) |
| Rutas en App.tsx | 66 paths |
| Pruebas unitarias | 7 archivos |
| Specs E2E Playwright | 7 archivos (8 proyectos de browser) |

## Feature flags activos

| Flag | Valor en prod | Efecto |
|---|---|---|
| USER_PREMIUM | false | Todas las features premium estan libres — sin gate real activo |
| PRO_ANALYTICS | true | Panel Pro y analytics visibles |
| LABS_ADOPTION | true | Modulo de adopcion habilitado (Labs beta) |
| LABS_BLOOD_DONORS | true | Red de donantes de sangre habilitada (Labs beta) |
| LABS_COMMUNITY | true | Grupos de comunidad habilitados (Labs beta) |

**Atencion**: USER_PREMIUM=false significa que ninguna restriccion de plan esta activa en produccion actualmente. Las rutas /upgrade existen y son funcionales, pero la mayoria de features premium no estan bloqueadas. Esto debe corregirse antes de lanzar la monetizacion formal.

## Discrepancias detectadas: CLAUDE.md vs codigo

| Campo | CLAUDE.md | src/lib/plans.ts — fuente de verdad |
|---|---|---|
| provider_free — max clientes | 20 | 15 |
| provider_individual — comision | 12% | 10% |

`plans.ts` es la autoridad para logica de negocio. CLAUDE.md debe actualizarse.

## Riesgos actuales

| # | Riesgo | Severidad | Estado |
|---|---|---|---|
| 1 | .env keys en historial git | Alta | Rotacion pendiente — accion manual del owner |
| 2 | `//evil.com` open redirect bypass | Alta | Fix aplicado en sesion 2026-04-14 |
| 3 | log-error: `includes(supabaseAnonKey)` permite bypass auth | Alta | Pendiente |
| 4 | `verify_jwt=false` en todas las edge functions | Media | Pendiente — decision sistemica |
| 5 | `supabase as any` en 4 archivos | Media | Pendiente — requiere regen de tipos |
| 6 | send-whatsapp-reminder CORS wildcard (deberia ser interno) | Media | Pendiente |
| 7 | analytics.track() es NO-OP en produccion | Media | Pendiente |
| 8 | Cero tests de flujos criticos (ficha clinica, PDF) | Media | Pendiente |

## Madurez por modulo

| Categoria | Modulos | Estado |
|---|---|---|
| Core | Ficha clinica, PDF/ZIP, directorio vets, upgrade Premium, calendario, reminders, onboarding | Solido y en produccion |
| Pro | Analytics dashboard, reportes semanales, Provider dashboard | Funcional; analytics sin datos reales en prod |
| Paw Labs | PawGame, Paw Cards, Misiones, Comunidad, Adopcion, Memorial | Experimental — funcional con banner beta |
| Internal | Admin panel, Demo, AnalyticsDashboard standalone | Herramientas internas, no visibles para usuarios normales |

## Nuevas features implementadas en sesion 2026-04-14

| Feature | Tabla/Hook/UI | Migracion |
|---|---|---|
| vet_quick_notes | Post-it por paciente para vets | 20260515_vet_quick_notes.sql |
| feedback_in_app | Feedback in-app con UI integrada | 20260515_feedback_in_app.sql |
| core_action_missions | Misiones de gamificacion atadas a acciones reales de cuidado | data-only |

Todas estan completamente conectadas con hooks y UI.
