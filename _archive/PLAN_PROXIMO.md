# Plan de Ejecucion Proximo — Paw Friend
> Generado: 2026-04-15
> Fuente: PLAN_MEJORA_INTEGRAL (127 issues) + auditoria de docs + estado actual del proyecto

---

## Prioridad 1 — Seguridad (URGENTE, proxima sesion)

Estos items bloquean todo lo demas. Son vulnerabilidades reales en produccion.

| # | Issue | Archivo clave | Esfuerzo |
|---|---|---|---|
| S1 | Open redirect en Auth.tsx — `returnTo` sin validar | `src/pages/Auth.tsx:60,80,91` | 5 min |
| S2 | `get_medical_summary_data` expone ficha de cualquier mascota | Migracion nueva | 15 min |
| S3 | `upsert_lead_vet` sin REVOKE — cualquier user escribe leads | Migracion nueva | 5 min |
| S4 | `is_super_admin` sin REVOKE — enumeracion de admins | Migracion nueva | 5 min |
| S5 | `profiles` expone `phone` via RLS `USING(true)` | Migracion nueva | 15 min |
| S6 | `check_contact_exists` callable por `anon` | Migracion nueva | 5 min |

**Tiempo total estimado: ~50 min**

---

## Prioridad 2 — Edge Functions hardening (misma sesion o siguiente)

| # | Issue | Impacto |
|---|---|---|
| E1 | Re-habilitar `verify_jwt = true` (excepto webhook/sitemap/log-error) | Endpoints expuestos |
| E2 | Unificar CORS — importar `getCorsHeaders` en todas las funciones | 4 patrones distintos |
| E3 | Eliminar rate limiting dual en pet-assistant y ocr-vaccination | Race condition |
| E4 | Proteger `reminder-cron` con cron secret | Cualquiera puede dispararlo |
| E5 | Sanitizar inputs en 9 funciones IA (anti-inyeccion prompts) | Prompt injection |
| E6 | Agregar `send-lead-outreach` a config.toml | Falta en config |
| E7 | Limpiar dead code en _shared/ (5 exports nunca usados) | Limpieza |

**Tiempo total estimado: 1-2 horas**

---

## Prioridad 3 — Performance quick wins (alto impacto, bajo esfuerzo)

| # | Issue | Ahorro estimado |
|---|---|---|
| P1 | Eliminar `export * from 'lucide-react'` en icons.ts | 30-60 kB gzip |
| P2 | Eliminar `react-icons` de package.json (0 imports) | Dependencia muerta |
| P3 | `lang="en"` → `lang="es-CL"` en index.html | SEO + a11y |
| P4 | Source maps deshabilitados en prod | Bundle mas limpio |
| P5 | `stats.html` a .gitignore | Limpieza |
| P6 | Font loading: `@import` → `<link>` + reducir pesos | LCP |

**Tiempo total estimado: 30 min**

---

## Prioridad 4 — Data layer fixes (proximas 2-3 sesiones)

| # | Issue | Impacto |
|---|---|---|
| D1 | Agregar staleTime a 13 hooks sin configuracion | Requests redundantes |
| D2 | Resolver N+1 en useMissions, usePawCollection, useFollows | Lentitud |
| D3 | Fix useFeedPosts — following feed filtra client-side | UX rota |
| D4 | Fix useProAnalytics — rangeStart/rangeEnd nunca aplicados | Bug |
| D5 | Fix useRoutines — routineIds causa invalidacion infinita | Performance |
| D6 | Enforcement de limites server-side (historial, reminders, pets) | Bypass-eable |
| D7 | Regenerar tipos Supabase (elimina 55 `as any`) | DX + seguridad tipos |

---

## Prioridad 5 — UX/a11y improvements (iterativo)

| # | Issue | Impacto |
|---|---|---|
| U1 | Reemplazar 5 `window.confirm()` con `AlertDialog` | UX consistente |
| U2 | Cards clickeables sin keyboard access en Home.tsx | a11y |
| U3 | StarRating sin aria-label + touch targets chicos | a11y mobile |
| U4 | Migrar Home.tsx y Chat.tsx a React Query | Cache, dedup |
| U5 | Mover CSS PawCards (~2700 lineas) de global a module | Performance |
| U6 | Unificar EmptyState (3 componentes duplicados) | DX |
| U7 | `@media (prefers-reduced-motion: reduce)` | a11y |

---

## Prioridad 6 — Integraciones pendientes (requieren credenciales Pedro)

| # | Issue | Bloqueado por |
|---|---|---|
| I1 | WhatsApp Cloud API — verificacion Meta Business | Proceso Meta |
| I2 | Mobile — iOS Capacitor setup + App Store listing | Apple Developer Account |
| I3 | Mobile — Android Play Store listing + assets | Assets finales |
| I4 | Google OAuth en produccion (no solo dev) | Google Cloud Console |

---

## Docs archivados hoy (2026-04-15)

| Archivo original | Destino | Razon |
|---|---|---|
| `_pending/PARTNERS_ONBOARDING.md` | `_archive/PARTNERS_ONBOARDING_COMPLETE_2026_04_13.md` | 100% ejecutado |
| `docs-specs/IDEAS_Y_MEJORAS_PENDIENTES.md` | `_archive/ROADMAP_IDEAS_FUTURE.md` | Visionario, no activo |
| `docs-specs/AUDIO_CONSULTA_VET.md` | `_archive/SPEC_AUDIO_CONSULTA_PENDING.md` | Requiere infra IA, no iniciado |
| `docs-specs/PROPUESTA_SIDEBAR_PROVIDER.md` | `_archive/SIDEBAR_PROVIDER_IMPLEMENTED.md` | Ya implementado |
| `PLAN_EJECUCION_AUDITORIA_2026_04_15.md` | `_archive/PLAN_EJECUCION_AUDITORIA_2026_04_15.md` | Superado por PLAN_MEJORA_INTEGRAL |

---

## Docs actualizados hoy (2026-04-15)

- **CLAUDE.md** — fecha, 28 edge fns, 67 rutas, 464 archivos, 156 migraciones, toggle de rol actualizado, BecomeProviderDialog documentado
- **INDEX.md** — conteos actualizados, plan activo referenciado, docs archivados documentados, specs obsoletas removidas

---

## Siguiente sesion recomendada

1. **Empezar por S1-S6** (seguridad) — ~50 min, todos son migraciones SQL + 1 edit en Auth.tsx
2. **Seguir con P1-P3** (performance quick wins) — ~15 min
3. **Si queda tiempo**: E1-E5 (edge functions hardening)
4. **Commit + build + push**
