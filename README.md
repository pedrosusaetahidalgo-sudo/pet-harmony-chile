# Paw Friend — Infraestructura Digital de la Mascota Chilena

Plataforma freemium 3 tiers para dueños + 7 motores B2B de acceso a la ficha.
Ficha clínica digital + directorio veterinario + biometría Paw Shield +
APIs B2B + cotizador seguros + retail con descuentos + lead capture B2B
para gobierno, banca, edificios y long-tail.

**Estado al 2026-04-30:** los 7 motores del Revenue Master Plan tienen
código end-to-end listo · pendiente activación comercial. Ver
[docs-raiz/REVENUE_MASTER_PLAN_2026.md](docs-raiz/REVENUE_MASTER_PLAN_2026.md)
y [docs-raiz/AUDITORIA_RLS_2026_04_30.md](docs-raiz/AUDITORIA_RLS_2026_04_30.md).

## Informacion de la App

| Campo | Valor |
|-------|-------|
| **Nombre** | Paw Friend |
| **Package ID** | `cl.pawfriend.app` |
| **Version** | 1.0.0 |
| **Dominio** | [pawfriend.cl](https://pawfriend.cl) |
| **Pais** | Chile |

## Stack tecnologico

- **Frontend**: React 18 + TypeScript 5.8 + Vite 5
- **Estilos**: Tailwind CSS 3 + shadcn/ui (Radix + CVA)
- **Estado servidor**: @tanstack/react-query 5
- **Forms**: react-hook-form 7 + zod 3
- **Backend**: Supabase (Auth, Postgres, Edge Functions Deno, Storage)
- **Pagos**: Flow.cl (suscripciones B2C y B2B)
- **Mapas**: Leaflet + react-leaflet 4.2.1
- **Mobile**: Capacitor 7 (Android + iOS)
- **SEO**: react-helmet-async

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build produccion (output en docs/)
npm run build

# Type-check
npx tsc -b
```

## Mobile (Capacitor)

```bash
# Sincronizar despues de cambios
npm run build
npx cap sync

# Compilar y correr en Android
npx cap run android

# Abrir en IDE nativo
npx cap open android
npx cap open ios
```

## Estructura del proyecto

```
src/
  pages/           # Paginas (~35 archivos, PascalCase.tsx)
  components/      # Componentes reutilizables (~60+ archivos)
    ui/            # shadcn/ui primitivos
    medical/       # Ficha clinica, PDF, compartir
    paw-cards/     # Paw Cards coleccionables (TCG)
    social/        # Feed, posts, follows
    provider/      # Dashboard y perfil de vets
  hooks/           # Custom hooks (~30 archivos, useXxx.tsx)
  lib/             # Utilidades y configuracion
  integrations/    # Supabase client + tipos generados

supabase/
  functions/       # 42+ Edge Functions Deno + _shared/
  migrations/      # 197+ migraciones SQL

docs/              # Output de npm run build (GitHub Pages)
public/brand-assets/   # Brand v2 (badges + illustrations + dashboards)
pitch-inversionistas/  # 11 pitch decks B2B (HTML navegables)
```

## Motores Revenue B2B (estado 2026-04-30)

| # | Motor | Ruta / Endpoint | Status |
|---|---|---|---|
| 1 | Pharma B2B | `/b2b` portal · `/aplicar?tipo=b2b_api` | Live · API + onboarding auto-issue |
| 2 | Aseguradoras | `/cotizar-seguro/:petId` | Live · seed Sura/BCI/Mapfre |
| 3 | Retail | `/tienda/:petId/:partnerSlug` | Live · seed Master Dog/Puppis/Pet Star |
| 4 | Gobierno · Municipios | `/aplicar?tipo=gobierno_municipio` | Inbound lead capture |
| 5 | Banca | `/aplicar?tipo=banca` | Inbound lead capture |
| 6 | Edificios · Inmobiliarias | `/aplicar?tipo=edificios` | Inbound lead capture |
| 7 | Long-tail (aerolíneas, academia, etc.) | `/aplicar?tipo=longtail` | Inbound lead capture |

Vista consolidada en `/admin` (AdminRevenueDashboard) con KPIs + COGS + ARR
vs targets Y1 conservador ($120k USD) / optimista ($420k USD).

## Edge Functions principales (42+ activas)

**Core producto:**
| Función | Propósito |
|---|---|
| `generate-medical-summary` | PDF ficha médica (joya de la corona) |
| `flow-create-subscription` + `flow-webhook` | Pagos Flow.cl |
| `pet-assistant`, `breed-tips`, `ocr-vaccination-card` | IA Anthropic Claude |
| `reminder-cron`, `audit-cron-daily` | Cron diarios |

**Revenue motors (2026-04-29/30):**
| Función | Motor |
|---|---|
| `b2b-api` | #1 Pharma — 4 endpoints públicos B2B con auth `X-Pawfriend-Api-Key` |
| `send-b2b-welcome` | #1 Email transaccional con API key emitida |
| `request-insurance-quote` | #2 Lead capture aseguradoras + email partner |
| `vet-checkin-identify` | Vet check-in widget con `X-Vet-Api-Key` |

**Paw Shield (biometría Petify):**
| Función | Propósito |
|---|---|
| `paw-shield-register` / `paw-shield-identify` | Enrollment + identify 1:N |
| `paw-shield-archive-cleanup` | Cron lifecycle de imágenes archivadas |

## Documentación

**Vivos (siempre actualizados):**
- [CLAUDE.md](CLAUDE.md) — Manual operativo completo (fuente de verdad)
- [INDEX.md](INDEX.md) — Índice maestro de documentación viva
- [MAPA_FUNCIONAL_COMPLETO.md](MAPA_FUNCIONAL_COMPLETO.md) — Mapa de cada módulo
- [AGENTS.md](AGENTS.md) — Config para agentes IA externos
- [diagrams/FLUJO_COMPLETO.mmd](diagrams/FLUJO_COMPLETO.mmd) — Diagrama Mermaid end-to-end

**Brand + assets:**
- [docs-raiz/BRAND_SYSTEM_2026.md](docs-raiz/BRAND_SYSTEM_2026.md) — Brand System unificado
- [docs-raiz/ASSETS_GENERATION_PLAN.md](docs-raiz/ASSETS_GENERATION_PLAN.md) — Master ejecutable de assets

**Revenue + auditoría:**
- [docs-raiz/REVENUE_MASTER_PLAN_2026.md](docs-raiz/REVENUE_MASTER_PLAN_2026.md) — Plan revenue 7 motores
- [docs-raiz/AUDITORIA_RLS_2026_04_30.md](docs-raiz/AUDITORIA_RLS_2026_04_30.md) — Audit seguridad post-motores
- [docs-raiz/PAW_SHIELD_PLAYBOOK.md](docs-raiz/PAW_SHIELD_PLAYBOOK.md) — Estrategia biometría
- [docs-raiz/PAW_SHIELD_IDEAS_BANK.md](docs-raiz/PAW_SHIELD_IDEAS_BANK.md) — 24 ideas RICE-priorizadas

**Pitch decks:**
- [pitch-inversionistas/README.md](pitch-inversionistas/README.md) — Índice de 11 decks B2B

## Contacto

- **Email**: pawfriendcl@gmail.com
- **Web**: pawfriend.cl
- **País**: Chile · SpA SUSAETA GARNHAM SOFTWARE ENGINEERING
