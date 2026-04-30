# Paw Friend — Modelo financiero v2.1 (2026-04-29)

> Generado durante ejecución de [pawfriend-prompt-v5.md Fase 7](../pawfriend-prompt-v5.md).
> **FX único declarado**: USD 1 = CLP 905 (Pedro confirmó 2026-04-29).
> **Modelo**: v2.1 freemium B2C 3 tiers + B2B 7 motores de acceso a la ficha.
> **Horizonte de proyección**: 12 / 24 / 36 meses post-launch (1 junio 2026).

---

## 1. Asunciones base (no negociables · explícitas)

### 1.1 Costos variables

| Concepto | Costo unitario | Cuándo se incurre |
|---|---|---|
| **Petify Pro tier** (Paw Shield) | USD 0,75 / mascota activa / mes | Por mascota con Paw Shield activado mensualmente |
| Supabase Pro plan | USD 25 / mes | Mensual fijo (Pedro confirmó 2026-04-29) |
| Hosting frontend (Vercel/GitHub Pages) | USD 0 | GitHub Pages para SPA + bandwidth gratis |
| Dominio + DNS (Namecheap) | CLP ~30.000 / año | ≈ CLP 2.500/mes |
| Email transaccional (Resend) | USD 0-20 / mes (free tier 3k emails) | Variable según volumen |
| Google Cloud (OCR, etc) | USD ~5-30 / mes | Variable según uso IA |
| Sentry, PostHog | USD 0 (free tier) | Si excedemos free → ~USD 26/mes Sentry, ~USD 0 PostHog hasta 1M events |
| Procesamiento Flow.cl | 2,9% + IVA por transacción | Por cobro Premium |

### 1.2 Conversión freemium B2C (Plan v5 Opción 3)

| Tier | Conversión target | Ticket mensual neto Paw Friend (CLP) |
|---|---|---|
| Free | 85% del MAU | $0 |
| Paw Member | 13% del MAU (≈ 15% de los pagantes) | $3.990 |
| Manada | 2% del MAU | $9.990 - $2.000 (refugio) = $7.990 neto |

Pedro target 10-20% pagantes — usamos 15% como escenario base, 10% conservador, 20% optimista.

### 1.3 Petify opt-in dentro de cada tier

| Tier | % opt-in Paw Shield (asunción) | Mascotas promedio que activan |
|---|---|---|
| Free | 0% (no tiene acceso) | 0 |
| Paw Member | 30% (los preocupados por extravío) | 1.2 mascotas/4 disponibles |
| Manada | 60% (hogares grandes activistas) | 3 mascotas/5 disponibles |

### 1.4 Otras asunciones operacionales

- **Mascotas promedio por user**: 1.3 (referencia INE Chile + comparables LatAm).
- **Churn mensual Paw Member**: 5% conservador / 3% base / 2% optimista.
- **Churn mensual Manada**: 4% conservador / 2.5% base / 1.5% optimista.
- **CAC Paw Member**: USD 5-15 (founder ventas directas + content/SEO + referrals).
- **CAC Manada**: USD 30-50 (segmento más nicho, requiere outreach específico).

---

## 2. Costo total por usuario activo (CLP/mes)

### 2.1 Per-tier breakdown a 10k MAU

| Costo | Free | Paw Member | Manada |
|---|---|---|---|
| Petify (mascotas × $0.75 × 905) | $0 | $326 (1.2 × $679 × 0.4 ratio uso) | $1.358 (3 × $679 × 0.66) |
| Supabase prorrateado | $11 | $11 | $11 |
| OCR + IA (Google Cloud, OpenAI) | $20 | $80 (más uso) | $120 (más uso) |
| Email + push (Resend, FCM) | $5 | $15 | $25 |
| Sentry + PostHog | $5 | $5 | $5 |
| Procesamiento Flow (2.9% del ticket) | $0 | $116 | $290 |
| **Total costo CLP/mes** | **~$41** | **~$553** | **~$1.809** |
| Aporte Refugio (Manada only) | — | — | $2.000 |
| **Total con aporte** | $41 | $553 | **$3.809** |

### 2.2 Margen contribution per user/mes

| Tier | Ticket CLP | Costo CLP | **Margen CLP** | **% margen** |
|---|---|---|---|---|
| Free | $0 | $41 | **-$41** | (subsidiado por upgrade) |
| Paw Member | $3.990 | $553 | **$3.437** | **86%** |
| Manada | $9.990 | $3.809 | **$6.181** | **62%** |

Excelente. El subsidio del Free user se cubre con < 1.5% de upgrade → 100% sostenible con 15% conversión target.

---

## 3. Revenue por motor × escala (FX 905)

### 3.1 Motor B2C Freemium (lo más medible hoy)

| Escala MAU | Free (85%) | Paw Member (13%) | Manada (2%) | Revenue mensual neto CLP | Revenue anual neto CLP | USD/año |
|---|---|---|---|---|---|---|
| 1.000 | 850 | 130 | 20 | $678.500 | **$8.142.000** | **USD 9.000** |
| 10.000 | 8.500 | 1.300 | 200 | $6.785.000 | **$81.420.000** | **USD 90.000** |
| 50.000 | 42.500 | 6.500 | 1.000 | $33.925.000 | **$407.100.000** | **USD 450.000** |
| 100.000 | 85.000 | 13.000 | 2.000 | $67.850.000 | **$814.200.000** | **USD 900.000** |

**Revenue mensual neto = (Paw Member × $3.437 + Manada × $6.181) margen contribution.**
Acá ya descontados costos variables → es contribution margin, no ARR bruto.

### 3.2 Motores B2B (ARR potencial post firma partners)

Conservador a 10k MAU, escala media (50k MAU), escala alta (100k MAU). Asume firmas sucesivas: pharma → seguros → retail desde mes 6 post-launch:

| Motor | 10k MAU | 50k MAU | 100k MAU |
|---|---|---|---|
| **Pharma** (3 deals × USD 50k-200k/año) | USD 50k (1 deal piloto) | USD 250k (3 deals) | USD 600k (4-5 deals) |
| **Seguros** (afiliado 5% conv polizas) | USD 0 (sin partner) | USD 200k (2 partners) | USD 500k (3 partners) |
| **Retail** (afiliado + suscripción comida) | USD 0 | USD 250k (2 partners) | USD 500k (3 partners) |
| **B2B API** (Pharma + universidades) | USD 5k (1 research) | USD 50k (5 deals) | USD 200k (15 deals) |
| **Paw Companys** (sponsorship empresas) | USD 30k (5 empresas) | USD 120k (20 empresas) | USD 240k (40 empresas) |
| **Gobierno/Municipios** (white-label Ley 21.020) | USD 0 | USD 30k (1 piloto) | USD 80k (3 deals) |
| **Long-tail** (data deals, ads programatica) | USD 0 | USD 20k | USD 50k |
| **Total motores B2B USD/año** | **USD 85k** | **USD 920k** | **USD 2.170k** |

### 3.3 ARR consolidado (B2C + B2B) — escenario base

| Escala MAU | B2C neto | B2B | **Total ARR USD/año** | **Total ARR CLP/año** |
|---|---|---|---|---|
| 1.000 | USD 9k | USD 0 | **USD 9k** | CLP 8M |
| 10.000 | USD 90k | USD 85k | **USD 175k** | CLP 158M |
| 50.000 | USD 450k | USD 920k | **USD 1.37M** | CLP 1.240M |
| 100.000 | USD 900k | USD 2.17M | **USD 3.07M** | CLP 2.778M |

---

## 4. OPEX (gastos fijos) por escala

| Línea | 1k MAU | 10k MAU | 50k MAU | 100k MAU |
|---|---|---|---|---|
| Founder salary (Pedro) | $0 (mes 1-6 post-seed) | $1.5M CLP/mes | $3M CLP/mes | $6M CLP/mes |
| Co-founder técnico (mes 6+) | $0 | $1.5M CLP/mes | $3M CLP/mes | $5M CLP/mes |
| Contador SpA | $300k/mes | $300k/mes | $400k/mes | $500k/mes |
| Legal (abogado on-call) | $200k/mes | $300k/mes | $500k/mes | $800k/mes |
| Marketing/ads | $0 | $500k/mes | $2M/mes | $5M/mes |
| Tools (Slack, Notion, etc) | $30k/mes | $80k/mes | $200k/mes | $400k/mes |
| **Total OPEX CLP/mes** | **$530k** | **$4.18M** | **$9.1M** | **$17.7M** |
| **Total OPEX USD/año** | **USD 7k** | **USD 55k** | **USD 121k** | **USD 235k** |

---

## 5. Margen consolidado (ARR − COGS − OPEX)

| Escala | ARR USD/año | OPEX USD/año | **EBITDA USD/año** | **Margen %** |
|---|---|---|---|---|
| 1.000 MAU | $9k | $7k | **$2k** | **22%** ✅ |
| 10.000 MAU | $175k | $55k | **$120k** | **69%** ✅ |
| 50.000 MAU | $1.37M | $121k | **$1.25M** | **91%** ✅ |
| 100.000 MAU | $3.07M | $235k | **$2.84M** | **92%** ✅ |

**Conclusión**: el modelo es viable desde la escala "tracción" (10k MAU) con margen positivo del 69%. A 100k MAU genera USD 2.84M EBITDA/año, suficiente para reinvertir en LatAm o Series A.

**A escala "inicial" (1k MAU)**: EBITDA marginal positivo. Bueno para no quemar runway pero requiere reach 10k para sustentabilidad real.

---

## 6. Sensibilidad

### 6.1 FX

| FX USD/CLP | Petify costo (CLP) | Margen Paw Member | Margen Manada |
|---|---|---|---|
| 850 (-6%) | $638 | 87% | 64% |
| **905 (base)** | **$679** | **86%** | **62%** |
| 950 (+5%) | $713 | 85% | 60% |
| 1.000 (+10%) | $750 | 84% | 58% |
| 1.100 (+22%) | $825 | 82% | 53% |

**Modelo aguanta FX hasta CLP 1.100 sin romper margen contribution.** Por encima requiere subir pricing CLP o renegociar Petify.

### 6.2 Costo Petify

Si Petify dobla precio a USD 1.50/pet/mes:

| Tier | Ticket | Costo Petify | Margen | % margen |
|---|---|---|---|---|
| Paw Member (1.2 mascotas Shield) | $3.990 | $652 | $2.911 | 73% |
| Manada (3 mascotas Shield) | $9.990 | $2.443 | $4.737 | 47% |

**Modelo aguanta x2 Petify** pero margen Manada baja a 47%. Acción: subir pricing Manada a $11.990 o renegociar.

### 6.3 Conversión real distinta a target

Con conversión real solo 5% Paw Member + 0.5% Manada (peor caso):

| Escala | Paw Member | Manada | ARR B2C neto |
|---|---|---|---|
| 10k | 500 | 50 | USD 26k/año |
| 100k | 5.000 | 500 | USD 260k/año |

A 100k MAU con conversión peor caso, ARR B2C cae 71% pero **B2B sigue dando USD 2.17M** → modelo sigue rentable. Es decir, el modelo sobrevive si freemium B2C falla, siempre que B2B funcione.

---

## 7. Runway y capital requerido

### 7.1 Pre-launch (mes 1-6 post 1 junio 2026)

- Bootstrap actual: founder + IA + costos ~USD 100/mes.
- Burn neto pre-revenue: ~USD 100/mes × 6 = USD 600 hasta llegar a 1k MAU.

### 7.2 Post-launch (mes 6-18)

Escenario base (alcanzar 10k MAU al mes 12):
- Mes 6: 1k MAU · break-even contribution margin (USD 2k EBITDA).
- Mes 12: 10k MAU · USD 120k EBITDA anualizado.
- Sin necesidad de capital externo si Pedro mantiene founder salary $0.
- Si activa salary $1.5M CLP/mes (~USD 1.7k) desde mes 6, runway con USD 50k de buffer.

### 7.3 Capital ask sugerido

Para acelerar a 50k MAU al mes 24 + activar pilotos pharma/seguros:

| Concepto | Monto USD |
|---|---|
| Founder salary 18 meses | $30k |
| Co-founder técnico 12 meses | $30k |
| Marketing/growth | $40k |
| Contador + legal | $15k |
| Buffer 6 meses | $35k |
| **Total ask** | **USD 150k pre-seed (CORFO SSAF + angel)** |

Valuación pre-money sugerida: USD 600k - 1.2M (cap table razonable post-seed). Justificación: 4-8x ARR proyectado mes 12 (USD 175k).

---

## 8. Tabla resumen 12/24/36 meses (escenario base)

| Métrica | Mes 6 (launch) | Mes 12 | Mes 24 | Mes 36 |
|---|---|---|---|---|
| MAU | 1.000 | 10.000 | 50.000 | 100.000 |
| ARR USD | $9k | $175k | $1.37M | $3.07M |
| EBITDA USD/año | $2k | $120k | $1.25M | $2.84M |
| Headcount | 1 (founder) | 2 | 5-7 | 12-15 |
| Pilotos B2B firmados | 0 | 1 (pharma) | 4 (3 motores) | 8+ |
| Capital requerido | $0 (bootstrap) | $50-150k seed | $500k Series A | $2-3M Series B |

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Conversión Paw Member < 5% | Media | Alto | Iterar pricing, A/B test paywall placement, mejorar onboarding upsell |
| Petify + 2x precio | Baja-media | Medio | Plan B: entrenar modelo propio (ya en marcha — outreach refugios + Paw Shield Data Archive) |
| FX > 1.100 | Media | Bajo | Subir pricing CLP proporcionalmente |
| Pharma no firma a tiempo | Alta | Medio | B2C freemium cubre operación. Acelerar Centrovet/Virbac outreach |
| Pivote estratégico vuelve | Baja | Alto | Modelo v2.1 documentado, decks reescritos |
| Competidor entra al mercado Chile | Media | Medio | Moat: ficha clínica longitudinal + Paw Shield biometría + B2B alianzas |

---

## 10. Notas y caveats

- **Todas las cifras USD se convirtieron a CLP con FX 905 declarado al inicio**.
- **Petify opt-in 30% Paw Member / 60% Manada son asunciones**: la realidad puede diferir. Iterar después de 3 meses con datos reales.
- **B2B es proyectado**, depende de firmas que aún no hay. El modelo NO depende de B2B para sobrevivir 1k-10k MAU (margen B2C cubre).
- **OPEX founder salary asume $0 hasta tener $1k MRR**, alineado con [policy founder salary](../C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_founder_salary_policy.md).
- **Aporte refugio Manada $2.000/mes**: es parte del ticket cobrado al user pero no margen para Paw Friend. Va al Fondo Paw Friend Refugios.
- **Cuando se firme primer partner B2B (pharma)**, recalibrar la sección 3.2 con números reales.

---

**Próxima revisión sugerida**: mes 3 post-launch con datos reales de conversión y churn.

**Preparado para uso en**: pitch decks (CORFO, Start-Up Chile, Companys, Angels), data room inversionistas, planning interno.
