# KPIs — Plan de Éxito 90 días Paw Friend

> Generado: 2026-04-20
> Complementa: [PLAN_EXITO_90D_20260420.md](./PLAN_EXITO_90D_20260420.md)
> Horizonte: día 1 a día 90 (2026-04-21 → 2026-07-20)
> Principio: cada KPI tiene fórmula, fuente técnica (tabla Supabase o edge fn), frecuencia de revisión y responsable.

---

## 1. North Star Metric

### NSM: Fichas clínicas PDF descargadas (propias o compartidas) por dueño activo, últimos 30 días

**Fórmula**:
```
NSM_30d = COUNT(DISTINCT user_id)
FROM posthog_events
WHERE event IN ('pdf_generated', 'medical_share_opened')
  AND timestamp >= NOW() - INTERVAL '30 days'
  AND user_role = 'owner';
```

**Fuente**:
- Evento `pdf_generated` → agregar en `src/components/medical/MedicalSummaryButton.tsx` (nuevo, INIT-02).
- Evento `medical_share_opened` → trigger al abrir `/medical-share/:token` (INIT-02).
- Vista materializada `nsm_daily` en Supabase (actualizar cada hora).

**Baseline** (por establecer S1): hipótesis <10 al momento de escribir esto.

**Target día 90**: ≥200.

**Frecuencia**: diario en widget admin (INIT-03), semanal en bitácora (INIT-19), acumulado mensual en board interno.

**Responsable**: Pedro.

---

## 2. KPIs de producto (activación y valor)

| KPI | Fórmula | Fuente | Target D90 | Frecuencia |
|---|---|---|---|---|
| **P1. Dueños con ≥1 mascota creada** | `COUNT(DISTINCT owner_id) FROM pets` | Tabla `pets` | ≥400 | Diario |
| **P2. Mascotas con ficha clínica completa (≥3 registros médicos + peso)** | ver query abajo | `pets` JOIN `medical_records` | ≥150 | Diario |
| **P3. Fichas PDF generadas/mes** | PostHog event count | PostHog | ≥500/mes | Semanal |
| **P4. Fichas compartidas con vet** | `COUNT(*) FROM pet_medical_shares WHERE created_at >= today-30d` | Tabla `pet_medical_shares` | ≥80 | Semanal |
| **P5. Tasa apertura vet (ficha compartida abierta <48h)** | `opened_at IS NOT NULL AND opened_at-created_at<48h` | `pet_medical_shares.opened_at` (columna nueva INIT-08) | ≥60% | Semanal |
| **P6. Onboarding owner p50 tiempo** | PostHog step timing | PostHog funnel | ≤3 min | Mensual |
| **P7. Retención D7 cohort semanal** | PostHog retention board | PostHog | ≥40% | Semanal |
| **P8. Retención D30 cohort mensual** | PostHog retention board | PostHog | ≥25% | Mensual |
| **P9. NPS vets beta** | Survey mensual por `feedback-admin` | Edge fn `feedback-admin` | ≥30 | Mensual |

### Queries SQL clave

**P2 — Fichas completas**:
```sql
SELECT COUNT(DISTINCT p.id)
FROM pets p
WHERE (
  SELECT COUNT(*) FROM medical_records m
  WHERE m.pet_id = p.id
) >= 3
AND p.weight IS NOT NULL;
```

**P4 — Fichas compartidas 30d**:
```sql
SELECT COUNT(*) FROM pet_medical_shares
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND revoked_at IS NULL;
```

---

## 3. KPIs de negocio (monetización)

| KPI | Fórmula | Fuente | Target D90 | Frecuencia |
|---|---|---|---|---|
| **N1. MRR B2B Vets** | `SUM(monthly_price) WHERE plan_id != 'provider_free'` | `service_providers` + `plans.ts` | ≥$69.500 CLP | Diario |
| **N2. Vets pagando Premium o superior** | `COUNT(*) WHERE plan_id IN (provider_premium, provider_clinic_starter, provider_pro_max)` | `service_providers` | ≥5 Premium + 1 Clínica | Diario |
| **N3. Paw Members activos** | `COUNT WHERE is_paw_member=true AND last_payment_ok=true` | `profiles` | ≥20 | Diario |
| **N4. MRR B2C (Paw Member)** | `COUNT(N3) × 3.990` | Supabase | ≥$79.800 CLP | Diario |
| **N5. Donaciones acumuladas trimestre** | `SUM(amount) WHERE created_at>=2026-04-21` | `donations` | ≥$500.000 CLP | Diario |
| **N6. Paw Companys sponsor activos** | `COUNT(*) FROM paw_companys WHERE partnership_type='sponsor' AND status='active'` | `paw_companys` | ≥3 | Semanal |
| **N7. ARR Paw Companys** | `SUM(monthly_aporte) × 12` | `paw_companys` | ≥$1.8M ARR ($150k × 12) | Mensual |
| **N8. Paw Partners (barter) activos** | `COUNT WHERE partnership_type='partner' AND status='active'` | `paw_companys` | ≥5 | Mensual |
| **N9. Tasa conversión Free → Paw Member** | `N3 / COUNT(DISTINCT owner_id)` | Cross-tabla | ≥5% | Mensual |
| **N10. LTV Paw Member estimado** | `MRR_B2C / churn_mensual` (30% asumido inicial) | Modelo manual | >$13.000 CLP | Mensual |

### Query SQL clave N1
```sql
SELECT
  SUM(CASE
    WHEN plan_id='provider_premium' THEN 9900
    WHEN plan_id='provider_clinic_starter' THEN 19900
    WHEN plan_id='provider_pro_max' THEN 29900
    ELSE 0
  END) AS mrr_b2b_clp
FROM service_providers
WHERE subscription_active=true;
```

---

## 4. KPIs de growth (adquisición)

| KPI | Fórmula | Fuente | Target D90 | Frecuencia |
|---|---|---|---|---|
| **G1. MAU owners** | `COUNT DISTINCT user_id FROM auth_events WHERE last_seen >= today-30d AND role='owner'` | Vista `mau_owners` (nueva, INIT-02) | ≥500 | Semanal |
| **G2. MAU vets** | Filtrado por `role='provider'` | Vista `mau_providers` | ≥50 | Semanal |
| **G3. Nuevos users/semana** | `COUNT signup WHERE week=curr` | PostHog | creciente 10%/sem | Semanal |
| **G4. Visitas orgánicas directorio /veterinarios** | Google Search Console + PostHog | GSC | ≥300/mes | Mensual |
| **G5. Comunas indexadas con ≥50 visitas/mes** | GSC property filter | GSC | ≥30 | Mensual |
| **G6. Posts blog publicados** | Contador manual | Manual | 6 | Bi-semanal |
| **G7. Backlinks totales** | Ahrefs / manual | Manual | ≥30 | Mensual |
| **G8. Conversión visitante → registro vet** | `registros_vet / visitas_para_veterinarios` | PostHog funnel | ≥15% | Semanal |
| **G9. CAC proxy (hrs Pedro / users nuevos)** | `40h/sem / users_nuevos_sem` | Bitácora | <0.5h por user | Mensual |
| **G10. Videos/posts IG con mención** | Manual (watch social mentions) | Manual + search `Paw Friend` en IG | ≥3 | Mensual |

---

## 5. KPIs técnicos (calidad)

| KPI | Fórmula | Fuente | Target D90 | Frecuencia |
|---|---|---|---|---|
| **T1. Bundle principal gzip** | Playwright perf / bundle analyzer | `npm run build` output | ≤280 kB | Por deploy |
| **T2. Lighthouse mobile Performance** | Lighthouse CI | Playwright CI | ≥70 | Por deploy |
| **T3. TS errors** | `npx tsc -b` | CI | 0 | Por PR |
| **T4. Lint errors** | `npm run lint` | CI | 0 | Por PR |
| **T5. Test unit passing** | `npm run test:ci` | CI | ≥377/377 | Por PR |
| **T6. E2E passing** | Playwright CI | CI | ≥336/336 | Por PR |
| **T7. Edge fn health score promedio** | `AVG(score) FROM audit_snapshots WHERE date=today` | `audit_snapshots` | ≥85/100 | Diario |
| **T8. Edge fns con score <70** | `COUNT WHERE score<70` | `audit_snapshots` | 0 | Diario |
| **T9. Migraciones pendientes (local vs prod)** | Manual check Supabase Dashboard | Supabase CLI | 0 | Por deploy |
| **T10. RLS fugas detectadas** | `COUNT WHERE rls_leak_detected=true FROM test_results` | Playwright RLS specs | 0 | Por PR |

---

## 6. KPIs de capital (fundraising)

| KPI | Fórmula | Fuente | Target D90 | Frecuencia |
|---|---|---|---|---|
| **C1. Postulaciones CORFO/Start-Up enviadas** | Contador manual | Tracker `FUNDRAISING_TRACKER.md` | ≥2 | Mensual |
| **C2. Reuniones angels formales** | Contador manual | Tracker | ≥3 | Semanal |
| **C3. LinkedIn DMs angels enviados** | Contador manual | Tracker | ≥10 | Semanal |
| **C4. Capital committed** | `SUM(amount) WHERE status='signed'` | Tracker | ≥USD $28k (CORFO) | Mensual |
| **C5. Pitch deck versión actual** | Versión en `pitch-inversionistas/PRESENTACION.html` | Repo | v2 con tracción | Mensual |
| **C6. Data room listo** | Checklist manual | Checklist en tracker | Completo | Al S5 |

---

## 7. KPIs operacionales

| KPI | Fórmula | Fuente | Target D90 | Frecuencia |
|---|---|---|---|---|
| **O1. Rituales semanales ejecutados** | Count entries `BITACORA_RITUAL.md` | Bitácora | ≥12/13 | Semanal |
| **O2. Sprint velocity (iniciativas completadas/sprint)** | Count closed issues por sprint | GitHub Projects / Notion | ≥3/sprint | Bi-semanal |
| **O3. Iniciativas atrasadas >1 sprint** | Count con `sprint_estimated_end < today AND status != done` | Tracker | ≤2 | Semanal |
| **O4. Feedback users recibido** | `COUNT FROM feedback` | Tabla `feedback` | ≥20 | Mensual |
| **O5. Incidentes producción** | Log Sentry + manual | Sentry | ≤1/mes | Mensual |
| **O6. Tiempo medio resolución incidente** | Manual | Manual | <24h | Por incidente |

---

## 8. Dashboard admin — organización de KPIs

### Home admin (nueva, INIT-03)
```
┌─────────────────────────────────────────────────┐
│ NORTH STAR (30d): 47 ↑12% WoW                   │
├─────────────────────────────────────────────────┤
│ MAU owners: 324    │ Vets pagando: 3            │
│ MRR B2B: $29.7k    │ Paw Members: 8             │
│ Donaciones 30d: $212k │ Health score: 91/100    │
├─────────────────────────────────────────────────┤
│ ⚠️ Alertas:                                      │
│ • Edge fn `medical-suggestions` score 62/100    │
│ • Migración 20260627 pendiente aplicar prod     │
│ • 2 vets registrados hace >7d sin 1er paciente  │
└─────────────────────────────────────────────────┘
```

### Pestañas detalle
- `/admin?tab=dashboard` — vista agregada (arriba).
- `/admin?tab=finance` — MRR, ARR, proyección 12 meses, burn rate.
- `/admin?tab=growth` — embudo signup → mascota → PDF, retention cohorts.
- `/admin?tab=health` — edge fns, migraciones, cron jobs, audit snapshots.
- `/admin?tab=sala-inversion` — tracker postulaciones y conversaciones angels.

---

## 9. Cadencia de revisión

| Frecuencia | Qué se revisa | Quién | Formato |
|---|---|---|---|
| **Diario 5 min** | North Star + alertas | Pedro | Widget admin + WhatsApp notif |
| **Semanal lunes 90 min** | Todos los KPIs + plan del sprint | Pedro | Ritual + bitácora |
| **Quincenal sprint close** | Velocity + KPIs sprint + pivot decisions | Pedro + advisor (si existe) | Bitácora + reunión 30 min |
| **Mensual** | Board completo + comparación mes anterior | Pedro | Screenshot + resumen 1 pág |
| **Fin trimestre (día 90)** | Todos vs target + lessons learned | Pedro + stakeholders | Documento cierre trimestre |

---

## 10. Instrumentación pendiente (bloqueada por INIT-02)

Para que este documento sea ejecutable, INIT-02 debe desplegar en Sprint 1:

1. Eventos PostHog: `pdf_generated`, `medical_share_opened`, `vet_signed_up`, `paw_member_converted`, `donation_made`.
2. Columnas nuevas:
   - `pet_medical_shares.opened_at TIMESTAMPTZ`
   - `profiles.is_paw_member BOOLEAN DEFAULT FALSE`
   - `profiles.paw_member_since TIMESTAMPTZ`
3. Vistas materializadas:
   - `mau_owners` (refresh cada hora)
   - `mau_providers`
   - `nsm_daily`
   - `mrr_b2b_daily`
4. Widget admin `<AdminNorthStarHeader>` + 5 cards + alertas.

Sin INIT-02, estos KPIs sólo se pueden medir manualmente revisando DB, lo cual no escala.

---

## 11. Reglas para agregar/quitar KPIs

- **Agregar KPI** requiere responder: fórmula, fuente técnica, dueño, target, frecuencia. Si alguno falta, no se agrega.
- **Quitar KPI** requiere 3 semanas sin consultarlo (verificable en log admin).
- **Cambiar target** requiere justificación en bitácora. No se cambia silenciosamente.
- **North Star no se cambia** durante los 90 días — si no sirve, anotar como hipótesis a validar §9 del plan y evaluar al cierre del trimestre.

---

**Fin del documento KPIs**.
