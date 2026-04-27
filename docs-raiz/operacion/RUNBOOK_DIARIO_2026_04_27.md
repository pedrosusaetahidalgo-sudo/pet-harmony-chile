# Runbook diario — Pedro

> Qué revisar cada mañana en `/admin` después del Refactor Maestro 2026-04-27.
> Tiempo estimado: **5-10 min**. Ejecutar idealmente antes de las 11am Chile.

---

## ☕ Pulso de 30 segundos (todos los días)

Abrir `/admin` y mirar **3 banners en orden**:

1. **AdminRiskMonitor** (al tope, solo si hay signals activos)
   - Si banner rojo `critical` → **bloquear**, atender ahora
   - Si banner amarillo `warn` → notar mentalmente, no urgente
   - Si no hay banner → pulso OK

2. **AdminFase1Widget**
   - ¿Crecieron los nose prints / passports / memoriales / followups?
   - Comparar mentalmente con ayer (no hay sparklines aún)

3. **AdminPulsoDiario**
   - Cron `audit-cron-daily` corre 8am Chile, refresca todo. Si está
     stale, algo se rompió en pg_cron — revisar Supabase Dashboard →
     Cron Jobs.

---

## 📊 Master KPIs (lunes / 1° lunes mes)

`/admin` → Sistema → **Master KPIs**.

### Norte del proyecto (§14.bis.6)

**`completion_rate_90d_pct`**: % de pets nuevas creadas en últimos 90d
con ficha completa.

| Color | Acción |
|---|---|
| 🟢 Verde (≥50%) | "Proyecto sano" — onboarding funciona, dueños llegan a ficha completa |
| 🟡 Amarillo (20-49%) | Atender — revisar fricción en captura |
| 🔴 Rojo (<20%) | Crítico — onboarding o ficha tiene problema serio. Pausar otras prioridades |

**Acciones sugeridas si rojo**:
- Revisar PostHog → onde se pierden usuarios entre signup → primer evento timeline
- Revisar feedback (`/admin` → Feedback)
- Probar el flujo completo en mobile real

### KPIs Fase 1

- `pets_with_nose_print`: meta día 90 = 1.000. Hoy en pause hasta validar fine-tune.
- `passports_generated_total`: meta día 90 = 500.
- `seo_landings`: meta día 90 = 20 (suma de breed + species + vets).

### KPIs Fase 2 (consent + B2B)

- **`users_consent_yes` / total decididos**: Pharma deal requiere ≥30%.
  Si <30%, revisar nudge en /home + paso 4 onboarding (pueden estar rotos).
- `b2b_keys_active`: hoy 0 (esperado). Cuando aparezca primer deal, crear
  desde `/admin` → Sistema → API B2B.
- `correlations_published`: hoy 0 (esperado hasta tener volumen).

### KPIs Refugios

- `followups_responded` / `followups_total`: response rate ideal ≥30%.
  Si <30% el cron `send-adoption-followups` o el copy del email puede
  estar fallando.

---

## 🎯 Project Health $ (semanal)

`/admin` → Sistema → **Health $**.

- **Costos mensuales**: ~$157 USD/mes (Supabase + AI + Resend + storage).
  Si ves spike (>$200), revisar AdminRiskMonitor → `openai_cost_spike`.
- **Revenue estimado**: donaciones 30d + Paw Member subs.
  - Si revenue < costos → burn negativo (esperado mientras escalamos).
  - Si revenue > costos → ¡celebrar!

**Hito break-even Y2 Q3-Q4**: requiere primer deal Pharma firmado.

---

## 🔍 Correlations (mensual o cuando hay news)

`/admin` → Sistema → **Correlations**.

1. Para cada correlation con compute RPC implementado (botón Play 💜),
   correr el RPC. El toast muestra `buckets_inserted` (publicables) vs
   `buckets_below_threshold` (esperando volumen).
2. Si una correlation tiene buckets_inserted ≥ 5, **considerar pasarla a
   `published`** (Edit → status). Eso la hace consultable vía B2B API.
3. Antes de publicar, validar que la data tiene sentido (no hay outliers
   raros, sample_size es saludable).

**Las 6 correlations seed**:
- `razas-mas-longevas-chile-vs-mundo` ✅ compute implementado
- `edad-esterilizacion-por-comuna-chile` ✅ compute implementado
- `paseo-vs-longevidad-golden-retriever` — espera GPS tracking
- `alimento-seco-vs-cristaluria-gatos` — espera campo food_type
- `cuidado-vs-obesidad-canina` — espera weight_history más data
- `vets-outcomes-cirugias` — Y3, requiere consent doble

---

## 🛡️ Risk Monitor (cuando hay banner)

`/admin` → Dashboard banner al tope.

5 signals automáticos:

| Signal | Threshold | Acción si dispara |
|---|---|---|
| `openai_cost_spike` | >1000 calls/24h | Revisar prompt cache, ver qué edge fn está spammeando |
| `low_consent_rate` | <30% (con n≥50) | Revisar nudge `/home` + paso 4 onboarding |
| `high_pet_dropout` | memorial >20% del crecimiento 30d | UX o copy memorial puede ser muy invasivo |
| `edge_fn_error_rate` | 5xx >5% en 24h | Revisar `/admin` → Sistema → Errores |
| `pgvector_slow` | nose-print-match >5s en 24h | HNSW index puede necesitar reindex |

---

## 🧹 Ritual mensual (1° lunes del mes)

Ejecutar en orden:

1. **Master KPIs** → snapshot mental, comparar con mes anterior
2. **Project Health** → ¿revenue creció? ¿costos bajo control?
3. **Correlations** → correr compute + considerar publicar
4. **Auditoría features** → leer `_pending/AUDITORIA_FEATURES_2026_04_27.md`,
   revisar si hay feature flags candidatas a archivar (>6 meses sin uso)
5. **Feature flags** → ver `src/lib/featureFlags.ts`, eliminar las que
   estuvieron en `false` >6 meses sin razón clara

---

## 🚨 Si todo se rompe

1. Revisar `/admin` → Sistema → Health (edge fns con error rate alta)
2. Revisar Supabase Dashboard → Logs
3. Revisar Sentry (`@sentry/react` integrado, dashboard externo)
4. Si es bug nuevo: rollback al commit anterior con `git revert`
5. Si es bug de DB: revisar última mig aplicada + RPC recientemente
   modificada

---

## 📞 Contactos / accesos

- **Supabase Dashboard**: gwailbjlvevkhwcrovfd.supabase.co
- **GitHub repo**: pedrosusaetahidalgo-sudo/pet-harmony-chile, branch `main`
- **PostHog**: dashboard.posthog.com
- **Sentry**: sentry.io
- **Resend** (emails): resend.com/dashboard
- **Flow.cl** (pagos): app.flow.cl

---

## 📋 Crones programados (verificar mensualmente)

Después de rotar APIs + configurar Vault:

```sql
-- Lista de crones activos
SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;
```

Esperar ver:
- `audit-cron-daily` (8am Chile)
- `send-adoption-followups-daily` (9am Chile)
- `detect-vaccine-overdue-daily` (9am Chile)
- `detect-inactive-users-daily` (10am Chile)
- `detect-birthday-window-daily` (10am Chile)
- `detect-antiparasitic-overdue-daily` (10am Chile)
- `detect-memorial-anniversary-daily` (10am Chile)
- `notify-health-alerts-daily` (9:15am Chile)
- `refresh-master-kpis-daily` (6am Chile)

Si alguno falta, revisar `_pending/MANUAL_ACTIONS_PENDING_FASE_0.md` para
los snippets `cron.schedule(...)`.

---

**Tiempo total estimado del runbook diario**: 5-10 min.
**Tiempo del ritual mensual**: 30-45 min.
