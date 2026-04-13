# Paw Friend - Plataforma Veterinaria Digital

Plataforma veterinaria chilena B2C + B2B. Ficha medica digital, directorio publico de veterinarios, estimador de precios por comuna, reservas, chat, gamificacion.

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
  functions/       # 21 Edge Functions Deno + _shared/
  migrations/      # 88 migraciones SQL

docs/              # Output de npm run build (GitHub Pages)
```

## Edge Functions principales

| Funcion | Proposito |
|---------|-----------|
| `generate-medical-summary` | PDF ficha medica (joya de la corona) |
| `flow-create-subscription` | Crear suscripcion Flow.cl |
| `flow-webhook` | Webhook de pagos Flow.cl |
| `pet-assistant` | Asistente IA de mascotas |
| `breed-tips` | Consejos por raza (IA) |
| `ocr-vaccination-card` | OCR de carnet de vacunacion (IA) |
| `reminder-cron` | Cron de recordatorios |
| `generate-sitemap` | Sitemap SEO |

## Documentacion

- [CLAUDE.md](CLAUDE.md) -- Manual operativo completo (fuente de verdad)
- [INDEX.md](INDEX.md) -- Indice maestro de documentacion viva
- [MAPA_FUNCIONAL_COMPLETO.md](MAPA_FUNCIONAL_COMPLETO.md) -- Mapa de cada modulo
- [AGENTS.md](AGENTS.md) -- Config para agentes IA externos

## Contacto

- **Email**: soporte@pawfriend.cl
- **Pais**: Chile
