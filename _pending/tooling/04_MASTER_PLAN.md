# 04 — Master Plan de implementación

> Generado: 2026-04-10 | Versión: 1.0
> Plan en 4 fases de 2 semanas cada una. Total: 8 semanas.
> Prerequisito: cada fase asume que la anterior está completa.

---

## Principios del plan

1. **Backups primero** — Antes de tocar cualquier otra cosa, asegurar que los datos no se pueden perder.
2. **CI/CD segundo** — Sin pipeline, todo lo demás se aplica manualmente y se olvida.
3. **Observabilidad tercero** — Sin visibilidad, no sabés qué rompe.
4. **Testing cuarto** — Tests sin CI no se corren. Tests sin observabilidad no se priorizan.
5. **Todo lo demás después** — Comunicaciones, compliance, performance son importantes pero no urgentes.

---

## Fase 0 — Fundaciones (Semana 1-2)

**Objetivo**: Que nada se pierda, que cada push se valide automáticamente, y que sepas qué pasa en producción.

### Semana 1

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | Upgrade Supabase a Pro ($25/mes) | XS | Backups diarios + PITR habilitado |
| Lun | Crear `.github/dependabot.yml` | XS | PRs automáticos de seguridad |
| Lun | Instalar Prettier + Husky + lint-staged | XS | Pre-commit hooks corriendo |
| Mar | Crear GitHub Actions CI workflow | M | PR checks: lint + typecheck + build |
| Mie | Crear cuenta Betterstack, monitorear 3 URLs | XS | Alertas de downtime por email |
| Mie | Instalar rollup-plugin-visualizer | XS | `stats.html` generado en cada build |
| Jue | Crear cuenta PostHog, instalar `posthog-js` | S | Eventos reales en dashboard |
| Jue | Conectar `analytics.ts` a PostHog (reemplazar body de `track`) | S | 40+ eventos enviándose en producción |
| Vie | Configurar PostHog feature flags remotos | S | `featureFlags.ts` reemplazado |

### Semana 2

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | Sentry en edge functions (crear `_shared/sentry.ts`) | S | Errores de backend en Sentry dashboard |
| Lun | Agregar alert en Sentry para `flow-webhook` errors | XS | Notificación si un pago falla |
| Mar | Crear cuenta Helicone, proxy calls de Anthropic | XS | Dashboard de costos LLM |
| Mar | Auditoría manual de JWT en las 21 edge functions | M | Documento con hallazgos + fixes |
| Mie | Fix de las functions que no validan auth correctamente | M | Todas las functions seguras |
| Jue | Agregar `eslint-plugin-jsx-a11y` a ESLint | XS | Warnings de accesibilidad en lint |
| Jue | Agregar Axiom structured logging en `logger.ts` | S | Logs JSON en producción |
| Vie | Verificar todo funciona end-to-end, ajustar | — | Fase 0 completa |

**Checkpoint Fase 0**:
- [ ] Supabase Pro con backups diarios
- [ ] CI pipeline corriendo en cada PR
- [ ] Pre-commit hooks (Prettier + ESLint)
- [ ] Dependabot habilitado
- [ ] PostHog con eventos reales
- [ ] Sentry en frontend Y backend
- [ ] Helicone tracking costos IA
- [ ] Betterstack monitoreando uptime
- [ ] Axiom con logs estructurados
- [ ] Edge functions con JWT validado

**Costo agregado**: USD 25/mes (Supabase Pro). Todo lo demás free tier.

---

## Fase 1 — Testing (Semana 3-4)

**Objetivo**: Tests para los flujos críticos. No 100% coverage — los 5 flujos que NO pueden romperse.

### Semana 3

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | Setup Vitest + Testing Library + jsdom | S | `npm run test` funciona |
| Lun | Agregar `"test": "vitest"` y `"test:ci": "vitest run"` a scripts | XS | CI puede correr tests |
| Mar | Tests de lógica pura: `format.ts`, `plans.ts`, `openingHours.ts`, `featureFlags.ts` | M | ~20 tests, 100% de lib utils |
| Mie | Tests de `vaccines.ts`, `breeds.ts`, `distance.ts`, `gamification.ts` | M | ~15 tests más |
| Jue | Tests de hooks: `useAuth` (mock Supabase), `usePlan`, `useCanAddPet` | M | Hooks críticos testeados |
| Vie | Agregar tests al CI pipeline | XS | PRs no mergean sin tests pasando |

### Semana 4

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | Setup Playwright | S | `npx playwright test` funciona |
| Mar | E2E: flujo de login (email + Google mock) | M | Test E2E #1 |
| Mie | E2E: crear mascota + ver ficha clínica | M | Test E2E #2 |
| Jue | E2E: descargar PDF de ficha médica | M | Test E2E #3 |
| Vie | E2E: flujo de directorio de vets (público, sin auth) | S | Test E2E #4 |

**No incluido en esta fase** (postergar):
- pgTAP para RLS (requiere Supabase CLI local, más setup)
- Visual regression (requiere baseline estable)

**Checkpoint Fase 1**:
- [ ] `npm run test` corre ~35+ tests unitarios
- [ ] `npm run test:ci` en CI pipeline
- [ ] 4+ tests E2E con Playwright
- [ ] Playwright en CI (headless)

---

## Fase 2 — Comunicaciones y mobile (Semana 5-6)

**Objetivo**: Push notifications y email funcionando. El usuario recibe confirmaciones fuera de la app.

### Semana 5

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | Configurar Firebase project para FCM | S | FCM server key como secret |
| Mar | Implementar registro de push token en app (Capacitor) | M | Tabla `push_tokens` con tokens reales |
| Mie | Edge function `send-push-notification` | M | Push enviable desde backend |
| Jue | Integrar push con `reminder-cron` | S | Recordatorios llegan como push |
| Vie | Crear cuenta Resend, verificar dominio pawfriend.cl | S | Emails enviables |

### Semana 6

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | Template de email: confirmación de pago Premium | M | Email bonito post-pago |
| Mar | Integrar Resend con `flow-webhook` | S | Pago → email automático |
| Mie | Template de email: recordatorio de cita | S | Email de recordatorio |
| Jue | Template de email: resumen semanal de mascota | M | Email semanal opt-in |
| Vie | Cookie consent banner en la app | S | Compliance básico |

**Checkpoint Fase 2**:
- [ ] Push notifications funcionando en Android
- [ ] Email de confirmación de pago
- [ ] Email de recordatorio de cita
- [ ] Cookie consent banner

---

## Fase 3 — Hardening y polish (Semana 7-8)

**Objetivo**: Cerrar los gaps restantes, preparar para escalar.

### Semana 7

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | pgTAP tests para RLS de tablas críticas | L | Tests RLS para 10 tablas |
| Mar | (continuación pgTAP) | — | — |
| Mie | Supabase Image Transformations para feed y perfiles | S | Imágenes optimizadas |
| Jue | Evaluar migración a Cloudflare Pages | S | Headers de seguridad + CSP |
| Vie | Documentar disaster recovery runbook | S | Documento de DR |

### Semana 8

| Día | Tarea | Esfuerzo | Entregable |
|---|---|---|---|
| Lun | Stricter TypeScript (habilitar `strictNullChecks`) | L | Más type safety |
| Mar | (continuación fix de errores de strictNullChecks) | — | — |
| Mie | Más tests E2E: pago Premium, chat, mapa | M | 3 E2E tests más |
| Jue | Review general, limpieza, documentación | S | Todo consistente |
| Vie | Escribir `PRODUCCION_READINESS.md` final | S | Checklist de ship |

**Checkpoint Fase 3**:
- [ ] RLS testeada en tablas críticas
- [ ] Imágenes optimizadas
- [ ] DR runbook documentado
- [ ] TypeScript más estricto
- [ ] 7+ tests E2E

---

## Vista de pájaro

```
Semana  1-2  │ FASE 0: Fundaciones
             │ Backups, CI/CD, observabilidad, seguridad edge functions
             │ Costo: +USD 25/mes
             │
Semana  3-4  │ FASE 1: Testing
             │ Vitest unitarios, Playwright E2E, tests en CI
             │ Costo: +$0
             │
Semana  5-6  │ FASE 2: Comunicaciones
             │ Push notifications, email transaccional, cookie consent
             │ Costo: +$0 (free tiers)
             │
Semana  7-8  │ FASE 3: Hardening
             │ RLS tests, image optimization, stricter TS, DR
             │ Costo: +$0
```

**Costo total al final de las 8 semanas**: USD 25/mes (Supabase Pro).

---

## Qué NO está en este plan (y por qué)

| Item | Por qué no ahora |
|---|---|
| Storybook | Solo tiene valor con equipo de diseño o múltiples devs frontend. Pedro es solo. |
| Full strict TypeScript | `strictNullChecks` se habilita en Fase 3 pero `strict: true` completo generaría cientos de errores. Hacerlo incremental. |
| Migración a Cloudflare Pages | Se evalúa en Fase 3 pero no es bloqueante. GH Pages funciona. |
| Internacionalización | App es solo para Chile. No aplica. |
| API docs (Swagger) | Edge functions son internas, no hay API pública. |
| A/B testing | PostHog lo soporta pero no hay volumen para resultados significativos todavía. Activar cuando haya >1000 MAU. |
| Status page custom | Betterstack incluye una status page básica gratis. Suficiente por ahora. |

---

*Ver `05_CI_CD_PIPELINE.md` para el diseño detallado del pipeline.*
