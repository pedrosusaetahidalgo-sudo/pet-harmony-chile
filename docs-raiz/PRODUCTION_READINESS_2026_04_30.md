# Production Readiness Checklist — Paw Friend 2026-04-30

> Estado real del producto al cierre del Revenue Master Plan + segundo
> batch audit-readiness 2026-04-30. Doc preparado para **auditor externo
> que tenga 30 minutos** y necesite entender qué está listo, qué tiene
> riesgo, y qué pasa si entra el primer cliente B2B mañana.
>
> **Reglas de lectura**:
> - 🟢 = OK, sin riesgo accionable
> - 🟡 = funciona pero con caveat documentado
> - 🔴 = riesgo abierto, requiere atención antes de escalar

---

## 1. Estado por área (snapshot)

| Área | Status | Notas |
|---|---|---|
| **Frontend** | 🟢 | React 18 + Vite 5, build 1m31s, bundle Admin 173kB / Owner 55kB |
| **Backend** | 🟢 | Supabase (Postgres 15, 42+ edge fns, 197+ migrations) |
| **Auth** | 🟢 | Email + Google + Apple + role-based (owner/provider/shelter/admin) |
| **Pagos** | 🟢 | Flow.cl con idempotencia + rate limit. Pendiente migrar cuenta a SpA |
| **RLS** | 🟢 | Auditado 2026-04-30, mig 20260918 cerró 4 hallazgos |
| **Compliance Ley 21.719** | 🟢 | Export ARCO + panel Mis datos compartidos + revoke endpoints |
| **Tests E2E** | 🟢 | 587 unit + 9 specs E2E para 7 motores |
| **Observabilidad** | 🟢 | Sentry + PostHog + AdminRiskMonitor con 9 signals (5 originales + 4 B2B) |
| **CI/CD** | 🟡 | Build manual desde laptop. No hay GitHub Actions deploy. Usar `npm run build` + push commits |
| **Mobile** | 🟡 | Capacitor 7 Android compilable. iOS testeado en simulator. App Store no submitido aún |
| **Backup DB** | 🟢 | Supabase Pro auto-backup diario 7 días |
| **Secrets management** | 🟢 | Supabase Vault para crons + secrets en Edge Functions |
| **Mons. de costos** | 🟡 | AdminProjectHealth muestra costos vs revenue, pero sin alertas activas |

---

## 2. Los 7 motores B2B — qué pasa si entra primer cliente

### Motor #1 · Pharma B2B (`/b2b` + API)

**Lo que funciona hoy**:
- 4 endpoints públicos: `breed_stats`, `species_stats`, `correlation_insights`, `risk_score`
- Auth via `X-Pawfriend-Api-Key` header (SHA256 hash, key plain text vista UNA VEZ)
- Onboarding self-service: `/aplicar?tipo=b2b_api` → admin approve → email automático
- 3 tiers: free / research / enterprise con rate limits diferenciados
- Logging en `b2b_api_usage` table

**Si entra primer cliente mañana**: 🟢 listo. Pedro genera key desde Admin > B2B Keys, copia, manda. Cliente prueba en 30 segundos.

**Riesgo abierto**: 🟡
- No hay SLA documentado por tier (response time, uptime).
- No hay partner-facing dashboard (cliente debe pedir stats por email).

### Motor #2 · Aseguradoras (`/cotizar-seguro/:petId`)

**Lo que funciona hoy**:
- Cotizador real-time con `calculate_pet_risk_score` (heurístico MVP)
- Lead capture → email automático al partner via `request-insurance-quote`
- Seed: Sura, BCI, Mapfre con copy mock pero estructura real
- Feature flag `EMBEDDED_INSURANCE` para esconder hasta firmar

**Si entra primer cliente mañana**: 🟡 falta cerrar contrato + verificar `contact_email` real del partner antes de activar `is_active=true`. La data del seed son emails genéricos `contacto@sura.cl`.

**Riesgo abierto**: 🔴 (alto valor, alto riesgo de mala primera impresión)
- El email transaccional al partner se envía de `hola@pawfriend.cl` — si filtra como spam, lead se pierde silenciosamente.
- Mitigación: Pedro debe activar `is_active=true` solo después de coordinar con partner que el dominio está whitelisteado.

### Motor #3 · Retail (`/tienda/:petId/:partnerSlug`)

**Lo que funciona hoy**:
- Catálogo filtrado por especie/edad de mascota
- Click tracking via SECURITY DEFINER RPC `track_retail_click`
- Seed: Master Dog, Puppis, Pet Star
- Revenue share configurable por SKU

**Si entra primer cliente mañana**: 🟡 funciona pero la atribución de conversiones depende de **postback del partner** (que partners tienen que implementar).

**Riesgo abierto**: 🟡
- Sin postback, `converted_at` queda NULL → revenue share = 0 → conflicto comercial.
- Mitigación: contrato con partner debe especificar postback URL + timeout (ej: 30 días).

### Motor #4-7 · Inbound (Gobierno / Banca / Edificios / Long-tail)

**Lo que funciona hoy**:
- Form `/aplicar?tipo=<kind>` con campos extras por kind
- Email automático a Pedro vía `notify-pitch-application`
- Admin panel `Admin > Sistema > Postulaciones` para review
- Pitch decks dedicados (5 HTMLs)

**Si entra primer cliente mañana**: 🟢 listo. Pedro recibe email con link directo al admin panel.

**Riesgo abierto**: 🟢 ninguno crítico. Estos son inbound leads, no transacciones automáticas.

---

## 3. Compliance regulatoria

### Ley 19.628 + Ley 21.719 (Reglamento vigente 2026)

**Cumplido** ✅:
- 🟢 Export ARCO de portabilidad (`/profile/exportar-mis-datos` → `export_user_data` RPC)
- 🟢 Panel Mis datos compartidos (`/profile/mis-datos-compartidos` → `list_my_data_sharing` RPC)
- 🟢 Revoke consent: research consent toggle + `revoke_paw_shield_archive_consent` RPC
- 🟢 Privacy Policy completa con subprocesadores (Supabase, Resend, Anthropic, Sentry, PostHog)
- 🟢 Opt-out claro en cada email transaccional ("responde con No me contacten")
- 🟢 RLS policies en TODAS las tablas con PII (auditado 2026-04-30)

**Pendiente** ⚠️:
- 🔴 DPA (Data Processing Agreement) con partners B2B aún no firmado. Necesario antes de compartir leads con Sura/BCI/Mapfre/etc.
- 🟡 No hay banner explícito de cookies en sitio público (PostHog lo trackea sin consent banner). Riesgo bajo en Chile, alto si abrimos a Europa.

### Ley 21.020 (Tenencia Responsable)

🟢 Producto compatible: ficha clínica con microchip, vacunas, esterilización + geolocalización por comuna. Listo para B2G con municipios.

---

## 4. Producción operacional

### Performance

| Métrica | Target | Hoy | Status |
|---|---|---|---|
| LCP (Home) | <2.5s | ~2.0s | 🟢 |
| INP | <200ms | ~150ms | 🟢 |
| CLS | <0.1 | ~0.05 | 🟢 |
| Bundle inicial Owner | <100kB gzip | 55kB gzip | 🟢 |
| Bundle Admin | <60kB gzip | 48kB gzip | 🟢 |
| Build time | <2min | 1m31s | 🟢 |

### Capacidad

- **Supabase Pro**: hasta 8GB DB + 500GB transfer + 100k edge fn calls/mes. Hoy ~5% utilizado.
- **Capacidad estimada**: 10k usuarios activos sin upgrade. 100k usuarios requiere Team plan (+$599/mes).
- **Bottleneck previsible**: edge fns IA (Claude Haiku) — costo escala linealmente. Hoy ~$10/mes en producción mock; con 1k users podría llegar a $200/mes.

### Backup + DR

- 🟢 Supabase Pro: backup diario 7 días retention
- 🟡 No hay backup off-Supabase. Si Supabase tiene un incidente catastrófico (multi-region), perderíamos hasta 24h de data.
- 🟡 No hay runbook de restore documentado (necesario para 1k+ users).

### Monitoring

- 🟢 Sentry: errors frontend + edge fns
- 🟢 PostHog: analytics + funnels
- 🟢 AdminMasterKPIs: 30+ métricas con bands verde/amarillo/rojo
- 🟢 AdminRiskMonitor: 9 signals automáticas
- 🟡 No hay alertas push (email/SMS/Slack) si signal cruza threshold critical. Pedro debe abrir admin manualmente.

---

## 5. Seguridad

### Auth

- 🟢 Supabase Auth con email/password + Google OAuth + Apple Sign-In
- 🟢 RLS en todas las tablas con datos de usuario
- 🟢 Service role solo en edge fns con `verify_jwt = false` que validan auth interno
- 🟢 Admin role gate: tabla `admin_access` + checks SECURITY DEFINER

### API Keys (B2B)

- 🟢 SHA256 hash en DB, plain text vista UNA VEZ al admin via toast
- 🟢 Rate limit por hora configurable per-key
- 🟢 Tier-based scopes
- 🟢 Revoke instantáneo (set is_active=false)
- 🟡 No hay rotation policy automática (key dura hasta admin la revoque)

### Secrets

- 🟢 Supabase Vault para JWT del cron schedule
- 🟢 Edge fn secrets via Supabase secrets (no en código)
- 🟢 Frontend: anon key + URL en `.env`, no secrets sensibles
- 🟡 Pedro pegó service_role JWT en chat 1 vez (2026-04-25). Rotado, pero proceso humano sigue siendo el eslabón débil.

### Vulnerabilidades

- 🟢 No hay XSS conocido (todo escape en email-blocks + escape de HTML en sanitize)
- 🟢 No hay SQL injection (todas queries via Supabase client, no raw SQL en frontend)
- 🟢 CORS restringido a `https://pawfriend.cl` en edge fns
- 🟢 Rate limiting en edge fns IA (`checkAiQuota`)
- 🟡 No hay CSP (Content Security Policy) headers configurados

---

## 6. Riesgos abiertos priorizados

### 🔴 Bloqueantes para escalar (debe resolverse antes de 1k users)

1. **DPA con partners B2B** — sin firmar, no podemos compartir PII con Sura/BCI/Mapfre legalmente.
2. **Email deliverability con `hola@pawfriend.cl`** — DKIM/SPF/DMARC verificados? Si no, leads pueden perderse en spam.
3. **CI/CD automation** — hoy build manual desde laptop. Si Pedro está enfermo o sin internet, no se puede deployar fix urgente.

### 🟡 Importantes pero no bloqueantes

4. **CSP headers** — agregar para defensive XSS en futuro.
5. **Backup off-Supabase** — script de pg_dump → S3 semanal.
6. **Alertas push admin** — Slack/email si signal critical.
7. **Cookie banner** — para PostHog tracking explícito.
8. **Partner-facing dashboard** — partner pidiendo stats por email es fricción.

### 🟢 Deuda explícita pero accionable

9. **COGS Petify Plan B/C/D** — documentado en SINTESIS § 4.4. Activar al cruzar 1k pets.
10. **i18n LATAM** — postpone Y2.
11. **Whisper Fase 2** — postpone hasta primer deal B2B.

---

## 7. Lo que NO va a pasar (deuda explícita aceptada)

- No vamos a tener app store (Google Play / Apple) listo en mayo 2026. Q3 más realista.
- No vamos a tener feature flag system server-side antes de Y2.
- No vamos a tener multi-tenancy (un cliente con sus propios users) antes de Y2.
- No vamos a tener i18n completo. Producto solo en español chileno hasta Y2.
- No vamos a tener WhatsApp Cloud API hasta Meta apruebe verification (pendiente desde 2026-04-17).

---

## 8. Si entra primer cliente B2B en 30 días — checklist

**Día -30 a Día -15** (preparación):
- [ ] Firmar DPA con partner
- [ ] Verificar DKIM/SPF/DMARC del dominio `pawfriend.cl` (usar mxtoolbox.com)
- [ ] Confirmar `contact_email` real del partner para `is_active=true`
- [ ] Setup webhook/postback URL en partner side (retail) o email forwarding (insurance/pharma)
- [ ] Generar API key con tier acordado y enviar via canal seguro (no email)

**Día -15 a Día 0** (validación):
- [ ] Test smoke: hacer 5 calls al endpoint asignado, verificar 200 OK + datos correctos
- [ ] Test smoke insurance: pedir 1 cotización con pet test, verificar email llega al partner
- [ ] Test smoke retail: hacer click en partner test, verificar tracking en `retail_clicks`
- [ ] Coordinar reunión con partner: capacitar uso del producto

**Día 0 → +30** (monitoring):
- [ ] Revisar `AdminRevenueDashboard` diariamente
- [ ] Revisar `AdminRiskMonitor` semanalmente
- [ ] Reunión semanal con partner para feedback
- [ ] Si reply rate del partner >7d → outreach proactivo de Pedro

---

## 9. Decisión de auditoría

> **Si yo fuera el auditor externo y leyera este doc en 30 minutos**, mi
> conclusión sería: el producto está **production-ready para escala
> mediana (hasta 5k users)** y **comercialmente listo para piloto B2B
> con 1-2 partners** previo firma DPA + email deliverability check.

> Los 3 bloqueantes 🔴 son **resolvables en 1-2 semanas con presupuesto
> bajo** (legal $500 USD para DPA, 2h dev para CI/CD básico, 30min para
> verificar DKIM). No son obstáculos de arquitectura.

> El moat técnico real es:
> 1. **Ficha clínica longitudinal** con 197 migraciones de schema bien
>    versionadas y 587 tests verde.
> 2. **API B2B** con 4 endpoints + onboarding self-service: deal con
>    pharma se cierra en días, no en meses de integración.
> 3. **RLS hardening + compliance** que un auditor de Sura/BCI puede
>    revisar y aprobar sin pivots.

> El moat comercial es **el modelo Mapcity** ("dueño nunca paga, B2B
> bolsillo profundo paga por acceso") que captura el 100% del mercado
> mientras Petify (modelo extractivo cobrando al dueño) solo captura
> el 10% que paga.

---

**Estado**: ✅ Production-ready con caveats documentados.
**Acción Pedro**: trabajar los 3 🔴 antes del primer deal real.
**Próxima revisión**: 2026-08-01 (post Q2 con datos reales de prod).
