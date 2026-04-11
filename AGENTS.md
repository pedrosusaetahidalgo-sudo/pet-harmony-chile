# Paw Friend -- Configuracion para agentes IA

> Espejo publico y agnostico de CLAUDE.md. Compatible con Cursor, Codex, Windsurf, Copilot Workspace y cualquier herramienta que lea un archivo de contexto en la raiz del repo.

---

## Proyecto

- **Nombre**: Paw Friend
- **Descripcion**: Plataforma veterinaria chilena B2C+B2B. Ficha medica digital, directorio publico de vets, estimador de precios por comuna, reservas, chat, gamificacion.
- **Dominio**: pawfriend.cl
- **Repo**: pet-harmony-chile (branch main)

---

## Stack

- React 18 + TypeScript 5.8 + Vite 5
- Tailwind CSS 3 + shadcn/ui (Radix + CVA)
- @tanstack/react-query 5
- react-hook-form 7 + zod 3
- Supabase (auth, Postgres, Edge Functions Deno, Storage)
- Flow.cl (pagos)
- react-router-dom 6
- date-fns 4, Recharts 2, lucide-react, react-icons
- Leaflet + react-leaflet 4.2.1
- Capacitor 7 (Android + iOS)
- react-helmet-async (SEO)

---

## Estructura

```
src/
  pages/           # Paginas (PascalCase.tsx, ~35 archivos)
  components/      # Componentes (PascalCase.tsx, subdirs: ui/, admin/, ai/, calendar/, home/, maps/, medical/, pawgame/, provider/, reviews/, settings/, social/)
  hooks/           # Custom hooks (useXxx.tsx/.ts, ~30 archivos)
  lib/             # Utilidades (camelCase.ts, ~20 archivos)
  integrations/
    supabase/      # Cliente + tipos generados
  types/           # Tipos adicionales
  assets/          # Imagenes

supabase/
  functions/       # 21 Edge Functions Deno + _shared/ helpers
  migrations/      # 88 migraciones SQL (hasta 20260428000000)

docs/              # Build output (GitHub Pages) -- NO editar
audits/            # Auditorias, competencia, walkthroughs
diagrams/          # Diagramas Mermaid de flujo (MANTENER ACTUALIZADOS)
INDEX.md           # Indice maestro de documentacion
MAPA_FUNCIONAL_COMPLETO.md  # Mapa funcional completo
AGENTS.md          # (este archivo)
```

---

## Convenciones

- **Componentes**: PascalCase `.tsx` (AppLayout.tsx, ProtectedRoute.tsx)
- **Hooks**: camelCase `useXxx.tsx` o `.ts` (useAuth.tsx, usePlan.tsx)
- **Libs**: camelCase `.ts` (plans.ts, format.ts)
- **UI shadcn**: kebab-case `.tsx` (alert-dialog.tsx, scroll-area.tsx)
- **Edge Functions**: kebab-case directorio (flow-create-subscription/)
- **Migraciones**: `YYYYMMDDHHMMSS_descripcion.sql`
- **Copy**: Espanol chileno con tuteo (tu/tienes/puedes). NO voseo argentino. NO vosotros.
- **Terminos**: "comuna", "ficha clinica", "recordatorio", "Paw Friend"

---

## Comandos

```bash
npm run dev            # Dev server (localhost:8080)
npm run build          # Build produccion -> docs/
npm run preview        # Preview del build
npx tsc -b             # Type-check
npm run lint           # ESLint
npx cap run android    # Compilar Android
```

NO existen: `npm run test`, `npm run typecheck`.

---

## Reglas criticas

1. **docs/ es output de build**. Nunca editar manualmente. `npm run build` y despues `git add docs/ && git add -u`.
2. **Migraciones SQL**: generar archivo en `supabase/migrations/`, aplicar MANUALMENTE desde Supabase Dashboard SQL Editor.
3. **Pagos**: Flow.cl (NO Webpay). Credenciales como secrets de Supabase.
4. **Secrets**: NUNCA commitear API keys. Advertir si el usuario las pega.
5. **Ficha medica PDF + directorio vets**: joya de la corona. Solo fixes puntuales.

---

## Pricing

### B2C
| Plan | Mensual | Anual |
|---|---|---|
| Gratis | $0 | $0 |
| Premium | $3.990 | $39.900 |

### B2B
| Plan | Mensual | Comision |
|---|---|---|
| Gratis | $0 | 10% |
| Individual | $9.900 | 12% |
| Clinica Basica | $29.900 | 10% |
| Clinica Pro | $59.900 | 0% |

---

## Documentos de referencia

- `CONTEXTO_2026_04_11.md` -- Estado tecnico actual
- `ESTRATEGIA_MVP_2026.md` -- Vision y mercado
- `GUION_PITCH_VETS_60S.md` -- Pitch veterinarios
- `audits/COMPETENCIA_2026_04_08.md` -- Analisis competitivo
- `audits/RECOMENDACIONES_2026_04_08.md` -- Recomendaciones
- `audits/AUDIT_2026_04_08.md` -- Auditoria tecnica
- `audits/WALKTHROUGH_2026_04_08.md` -- Walkthrough funcional

---

## Features roadmap (NO implementadas)

- Paw Rewards QR completo (ledger, partner_locations, canje presencial)
- Asistente medico IA triage avanzado
- Bot FAQ clinicas

## Features que SI estan en produccion (dejar de listarlas como futuras)

- OCR carnet vacunacion → edge function `ocr-vaccination-card/`
- Checklist Grimace Scale → integrado en ficha clinica
- Plantillas post-consulta → tabla `consultation_templates` + UI
- Dual-role mode switching → `ActiveRoleProvider` en `src/hooks/useActiveRole.tsx`

---

## Subagentes (.claude/agents/)

13 agentes especializados disponibles:

| Agente | Archivo |
|---|---|
| Project Auditor | project-auditor.md |
| Schema Auditor | schema-auditor.md |
| RLS Guardian | rls-guardian.md |
| Medical AI Guardian | medical-ai-guardian.md (futuro) |
| Rewards QR Validator | rewards-qr-validator.md (futuro) |
| Capacitor Mobile | capacitor-mobile-specialist.md |
| Cross-Platform Validator | cross-platform-validator.md |
| TypeScript Refactorer | typescript-refactorer.md |
| Bug Debugger | bug-debugger.md |
| QA Verifier | qa-verifier.md |
| Code Reviewer | code-reviewer.md |
| UX Copy Chilean | ux-copy-chilean.md |
| Performance Profiler | performance-profiler.md |
