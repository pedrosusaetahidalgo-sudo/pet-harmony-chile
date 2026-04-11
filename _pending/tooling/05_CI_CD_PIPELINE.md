# 05 — Diseño del CI/CD pipeline

> Generado: 2026-04-10 | Versión: 1.0
> Pipeline para GitHub Actions. Costo: $0 (free tier).

---

## Arquitectura del pipeline

```
                  PR abierto / push a branch
                           │
                    ┌──────┴──────┐
                    │   CI Check  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
         │  Lint   │ │  Types  │ │  Build  │
         │ ESLint  │ │ tsc -b  │ │  Vite   │
         └────┬────┘ └────┬────┘ └────┬────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │    Tests    │
                    │  Vitest CI  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  npm audit  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  Bundle sz  │
                    │   check     │
                    └──────┬──────┘
                           │
                      ✅ PR Green
                           │
                    merge a main
                           │
                    ┌──────┴──────┐
                    │   Deploy    │
                    │  (GH Pages  │
                    │  o CF Pages)│
                    └─────────────┘
```

---

## Workflow 1: CI (en cada PR y push)

Archivo: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      # Lint, typecheck, y build en paralelo
      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc -b

      - name: Build
        run: npm run build

      # Tests (cuando existan)
      # - name: Unit tests
      #   run: npm run test:ci

      # Security audit
      - name: npm audit
        run: npm audit --audit-level=high || true
        # || true para no bloquear por warnings moderados.
        # Cambiar a sin || true cuando se limpien las vulnerabilidades.

      # Bundle size check
      - name: Check bundle size
        run: |
          MAIN_SIZE=$(find docs/assets -name 'index-*.js' -exec wc -c {} + | tail -1 | awk '{print $1}')
          MAX_SIZE=350000  # 350 KB — hoy es ~295 KB
          echo "Main bundle: $MAIN_SIZE bytes (max: $MAX_SIZE)"
          if [ "$MAIN_SIZE" -gt "$MAX_SIZE" ]; then
            echo "::error::Bundle size $MAIN_SIZE exceeds limit of $MAX_SIZE bytes"
            exit 1
          fi
```

---

## Workflow 2: Deploy a GitHub Pages (en merge a main)

Archivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  pages: write
  id-token: write
  contents: read

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      # Asegurar que 404.html existe para SPA routing
      - name: Ensure SPA fallback
        run: cp docs/index.html docs/404.html

      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs

      - id: deployment
        uses: actions/deploy-pages@v4
```

> **Nota**: Con este workflow, ya no necesitás hacer `git add docs/` manualmente.
> El deploy se hace directo desde el artefacto del build, sin commitear `docs/` al repo.
> Esto elimina el bug de "chunks no commiteados" que ocurrió en commit `1c69396`.
>
> **Cambio requerido**: Agregar `docs/` a `.gitignore` y dejar de commitear la carpeta.

---

## Workflow 3: Dependabot

Archivo: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    labels:
      - dependencies
    groups:
      # Agrupar minor+patch de Radix para no tener 17 PRs
      radix:
        patterns:
          - "@radix-ui/*"
      capacitor:
        patterns:
          - "@capacitor/*"
      eslint:
        patterns:
          - "eslint*"
          - "@eslint/*"
          - "typescript-eslint"
```

---

## Workflow 4: E2E tests (cuando Playwright esté listo)

Archivo: `.github/workflows/e2e.yml` (activar en Fase 1)

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  # Solo correr E2E en PRs, no en cada push
  # (son lentos y consumen minutos de CI)

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Build
        run: npm run build

      - name: Run E2E tests
        run: npx playwright test
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Branch protection rules (configurar en GitHub Settings)

Una vez que CI esté corriendo:

1. **Settings → Branches → Add rule** para `main`:
   - Require status checks to pass: `check` (del workflow CI)
   - Require branches to be up to date
   - No force pushes
   - No deletions

2. **Settings → Code security**:
   - Enable Dependabot alerts
   - Enable Dependabot security updates
   - Enable secret scanning
   - Enable push protection

---

## Transición: de deploy manual a CI/CD

### Paso 1 (día 1): Crear workflow CI
- Solo lint + typecheck + build. Sin tests todavía.
- No cambiar el flujo de deploy todavía.

### Paso 2 (día 2): Crear workflow Deploy
- Habilitar GitHub Pages desde "GitHub Actions" (no desde branch).
- Dashboard → Settings → Pages → Source: "GitHub Actions".
- Agregar `docs/` a `.gitignore`.
- Último commit que incluye `docs/`: explicar en commit message que el deploy ahora es automático.

### Paso 3 (día 3): Branch protection
- Habilitar status checks.
- A partir de aquí, ningún push directo a main sin CI verde.

### Paso 4 (semana 3-4): Agregar tests al CI
- Descomentar step de Vitest en workflow CI.
- Agregar workflow E2E.

---

## Minutos de CI estimados

| Acción | Tiempo | Frecuencia | Minutos/mes |
|---|---|---|---|
| CI check (lint+types+build) | ~3 min | 30 PRs/mes | 90 min |
| Deploy | ~2 min | 20 merges/mes | 40 min |
| E2E tests | ~5 min | 15 PRs/mes | 75 min |
| **Total** | | | **~205 min** |

GitHub free tier: 2,000 min/mes (repos privados), ilimitado (públicos). Sobra ampliamente.

---

*Ver `06_COSTOS.md` para el análisis de costos completo.*
