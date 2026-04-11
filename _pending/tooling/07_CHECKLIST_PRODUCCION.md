# 07 — Checklist de producción profesional

> Generado: 2026-04-10 | Versión: 1.0
> Checklist para verificar que Paw Friend está en estado "producción profesional".
> Marcar cada item conforme se complete. Revisitar mensualmente.

---

## Instrucciones

- [ ] = Pendiente
- [x] = Completo
- [~] = Parcial (explicar en nota)

---

## 1. Infraestructura y backups

- [ ] Supabase en plan Pro con backups diarios habilitados
- [ ] PITR (Point-in-Time Recovery) habilitado y testeado al menos una vez
- [ ] Disaster recovery runbook documentado (qué hacer si la DB se corrompe)
- [ ] Backups de Supabase Storage verificados (fotos de mascotas, documentos médicos)
- [x] DNS configurado para pawfriend.cl
- [x] HTTPS forzado (via GitHub Pages)
- [ ] Status page pública en status.pawfriend.cl (Betterstack)
- [ ] Uptime monitoring activo para: app, API Supabase, al menos 1 edge function

---

## 2. CI/CD y dev tooling

- [ ] GitHub Actions CI corriendo en cada PR (lint + typecheck + build)
- [ ] Deploy automático en merge a main (sin `git add docs/` manual)
- [ ] `docs/` en `.gitignore` (deploy via GitHub Actions artifact)
- [ ] Branch protection en `main` con status checks requeridos
- [ ] Pre-commit hooks (Husky + lint-staged) corriendo Prettier + ESLint
- [ ] Dependabot habilitado con PRs semanales
- [ ] Secret scanning habilitado con push protection
- [x] `.gitignore` excluye `.env*`, `MIS_API_KEYS.md`, `_clean.ps1`, `_diag.ps1`

---

## 3. Calidad de código

- [x] `npx tsc -b` pasa con 0 errores
- [x] `npm run build` pasa sin warnings de chunks > 600 kB
- [x] 0 `as any` en el código
- [x] 0 `console.*` fuera de `logger.ts`
- [ ] ESLint con reglas de seguridad y accesibilidad (`jsx-a11y`)
- [ ] Prettier configurado y aplicado a todo el codebase
- [ ] `strictNullChecks: true` en tsconfig (migración incremental)
- [x] Vendor chunk splitting configurado (6 chunks)

---

## 4. Testing

- [ ] Framework de testing instalado (Vitest + Testing Library)
- [ ] `npm run test` y `npm run test:ci` funcionan
- [ ] Tests unitarios para libs críticos (`format`, `plans`, `openingHours`, `vaccines`)
- [ ] Tests de hooks críticos (`useAuth`, `usePlan`, `useCanAddPet`)
- [ ] Tests E2E con Playwright para 5 flujos: login, crear mascota, ficha clínica, PDF, directorio vets
- [ ] Tests E2E en CI pipeline
- [ ] RLS tests con pgTAP para tablas: `pets`, `medical_records`, `profiles`, `vet_bookings`, `medical_documents`, `medical_share_tokens`
- [ ] Tests de edge functions (al menos `flow-webhook` y `generate-medical-summary`)

---

## 5. Observabilidad

- [x] Sentry frontend instalado y configurado (`@sentry/react`)
- [x] ErrorBoundary global con reporte a Sentry
- [ ] Sentry en edge functions (backend)
- [ ] Alerta de Sentry si `flow-webhook` retorna error
- [ ] PostHog conectado con eventos reales en producción
- [ ] PostHog session replay habilitado (al menos `replaysOnErrorSampleRate: 1.0`)
- [ ] Feature flags migrados de `featureFlags.ts` estático a PostHog remoto
- [ ] Helicone proxy para calls de Anthropic/Gemini con dashboard de costos
- [ ] Axiom structured logging en producción
- [ ] Betterstack uptime monitoring activo

---

## 6. Seguridad

- [ ] Auditoría de JWT completada para las 21 edge functions
- [ ] Todas las edge functions que manejan datos de usuario validan `supabase.auth.getUser()`
- [ ] `flow-webhook` valida firma HMAC de Flow.cl
- [ ] `npm audit --audit-level=high` pasa sin vulnerabilidades críticas
- [ ] Secret scanning + push protection habilitados en GitHub
- [ ] No hay API keys hardcoded en el código (verificar con `grep -r "sk-" src/`)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` eliminada de Google Cloud Console (sin uso)
- [ ] Spend cap de Anthropic confirmado (USD 10/mes o el valor decidido)
- [ ] Supabase service_role key solo en secrets de edge functions, nunca en frontend

---

## 7. Comunicaciones

- [ ] Push notifications funcionando en Android via FCM
- [ ] Tabla `push_tokens` con registro de tokens
- [ ] `reminder-cron` envía push además de (futuro) WhatsApp
- [ ] Email transaccional vía Resend: confirmación de pago Premium
- [ ] Email transaccional vía Resend: recordatorio de cita
- [ ] WhatsApp Cloud API verificado y activo (pendiente Meta)
- [ ] Google Calendar Consent Screen verificado por Google

---

## 8. Performance

- [ ] Bundle principal < 350 kB (hoy: 288 kB, enforcement en CI)
- [ ] Hero video comprimido a < 1.5 MB (hoy: 4.4 MB)
- [ ] Imágenes de Supabase Storage con resize automático
- [ ] Lighthouse Performance score > 80 en mobile (verificar manualmente)
- [x] Lazy loading de páginas con `React.lazy`
- [x] Vendor chunk splitting (6 chunks)
- [x] Sentry lazy-loaded (no bloquea render)

---

## 9. Compliance y legal

- [ ] Cookie consent banner implementado
- [ ] Política de privacidad actualizada mencionando: Sentry, PostHog, Supabase, Flow.cl
- [ ] Términos de servicio actualizados con sección de datos médicos de mascotas
- [x] Páginas `/terms` y `/privacy` existen y son accesibles

---

## 10. Documentación

- [x] `CLAUDE.md` actualizado con stack, rutas, convenciones
- [x] `AGENTS.md` sincronizado con CLAUDE.md
- [ ] Disaster recovery runbook en `Tooling/` o `audits/`
- [ ] Edge functions documentadas (qué hace cada una, inputs, outputs)
- [ ] Diagrama de arquitectura actualizado si se agrega Cloudflare/Sentry/PostHog

---

## 11. Bugs conocidos — cerrar antes de "producción profesional"

- [ ] Race condition foto perfil pro (P1)
- [ ] `capacitor.config.production.ts` con `webDir: 'dist'` inconsistente (debería ser `docs`)
- [ ] `supabase/config.toml` project_id inconsistente con CLAUDE.md
- [ ] Edge function `webpay-confirm` obsoleta — decidir borrar o mantener
- [ ] Hero video 4.4 MB sin comprimir

---

## Scoreboard

| Categoría | Items | Completados | % |
|---|---|---|---|
| Infraestructura | 8 | 2 | 25% |
| CI/CD | 8 | 1 | 13% |
| Calidad de código | 8 | 4 | 50% |
| Testing | 8 | 0 | 0% |
| Observabilidad | 10 | 2 | 20% |
| Seguridad | 9 | 0 | 0% |
| Comunicaciones | 7 | 0 | 0% |
| Performance | 7 | 3 | 43% |
| Compliance | 4 | 1 | 25% |
| Documentación | 5 | 2 | 40% |
| Bugs conocidos | 5 | 0 | 0% |
| **Total** | **79** | **15** | **19%** |

**Meta**: llegar a 80%+ (63+ items) al final de las 8 semanas del Master Plan.

---

*Revisitar esta checklist al final de cada fase del Master Plan.*
