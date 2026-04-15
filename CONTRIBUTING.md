# Contributing to Paw Friend

## Setup

```bash
# Instalar dependencias
npm install

# Dev server (localhost:8080)
npm run dev

# Mobile (Android)
npm run dev:mobile
```

## Comandos clave

```bash
npm run check:all     # lint + tsc + tests + build (correr antes de PR)
npm run dev            # Dev server
npm run build          # Build produccion → docs/
npx tsc -b             # Type-check
npm run lint           # ESLint
npm run test:ci        # Tests unitarios
npm run test:e2e       # E2E Playwright
```

## Estructura del proyecto

Ver `CLAUDE.md` seccion 3 para estructura completa. Resumen:

- `src/pages/` — una pagina por ruta
- `src/components/` — componentes reutilizables (shadcn/ui en `ui/`)
- `src/hooks/` — custom hooks (`useXxx`)
- `src/lib/` — utilidades y configuracion
- `supabase/functions/` — edge functions Deno
- `supabase/migrations/` — migraciones SQL (aplicar manualmente)

## Convenciones

- **Componentes**: PascalCase `.tsx`
- **Hooks**: camelCase `useXxx.tsx`
- **UI primitivos (shadcn)**: kebab-case `.tsx`
- **Copy**: Espanol chileno (tu/tienes, NO vos/tenes)
- **Commits**: prefijos `feat:`, `fix:`, `chore:`, `docs:`

## Reglas criticas

1. **docs/** es output de build. NUNCA editar manualmente
2. **Migraciones SQL**: no aplicar automaticamente. El dueno las aplica via Supabase Dashboard
3. **Secrets**: NUNCA commitear API keys. Usar `.env` (gitignored) o Supabase secrets
4. **Ficha medica + directorio vets**: joya de la corona. Solo fixes puntuales, no refactors grandes

## Documentacion de referencia

| Doc | Contenido |
|---|---|
| `CLAUDE.md` | Fuente de verdad operativa |
| `INDEX.md` | Indice de documentacion |
| `MAPA_FUNCIONAL_COMPLETO.md` | Mapa de modulos y archivos |
| `docs/ROADMAP_90_DIAS.md` | Roadmap priorizado |
| `docs/RELEASE_PROCESS.md` | Proceso de release |
| `docs/FEATURE_FLAGS.md` | Feature flags |
| `docs/PERFORMANCE_BUDGET.md` | Performance budget |

## Planes ejecutados (historial de decisiones)

Ver `CLAUDE.md` seccion 15 para la lista completa de planes aplicados.
