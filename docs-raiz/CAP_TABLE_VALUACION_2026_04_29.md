# Paw Friend — Cap Table + Valuación + Uso de Fondos (2026-04-29)

> Fase 7C del [pawfriend-prompt-v5.md](../pawfriend-prompt-v5.md).
> Estructura del deal pre-seed para inversionistas + CORFO.
> Acompaña [MODELO_FINANCIERO_2026_04_29.md](MODELO_FINANCIERO_2026_04_29.md).

---

## 1. Cap table actual (pre-seed)

| Stakeholder | % | Acciones | Notas |
|---|---|---|---|
| **Pedro Susaeta** (founder) | 100% | 1.000 acc | SpA SUSAETA GARNHAM SOFTWARE ENGINEERING — RUT 78.328.659-9 |

**Total**: 1.000 acciones · 100% Pedro.

---

## 2. Ronda pre-seed propuesta

### Estructura del deal

**Total ask**: USD 150.000

**Composición sugerida**:

| Fuente | Monto USD | Equity / instrumento |
|---|---|---|
| **CORFO SSAF-I** (no equity) | $28.000 | Subsidio cofinanciamiento, no diluye |
| **Start-Up Chile Ignite** (equity-free) | $15.000 | Subsidio CL, no diluye |
| **Angel Tier 2-3 LatAm** (SAFE) | $107.000 | SAFE con cap USD 1.2M post-money + discount 20% |
| **Total cash a SpA** | $150.000 | |

### Cap table post-cierre SAFE (escenario base)

Asumiendo SAFE convierte en próxima ronda Series A a USD 1.2M post-money cap:

| Stakeholder | % | Notas |
|---|---|---|
| Pedro (founder) | **89%** | Ownership post-dilución SAFE |
| Angel SAFE | **9%** | Convertido al cap |
| ESOP pool reservado | **2%** | Para co-founder técnico futuro (Q4 2026) |

CORFO + Start-Up Chile son grants no diluyentes — no afectan equity.

---

## 3. Valuación

### 3.1 Pre-money sugerida: USD 600.000 - 1.200.000

**Justificación**:

#### Comparables LatAm pet-tech (2024-2025)

| Empresa | País | Etapa | Pre-money USD | Notas |
|---|---|---|---|---|
| Petlove | BR | Series A | $25M | Marketplace, 5 años |
| Pet Anjo | BR | Seed | $3M | Pet sitting, 18 meses |
| Vetster | CA | Seed | $8M | Vet telemedicine |
| Pawp | US | Seed | $5M | Pet care subscription |
| Paw Friend (proyectado) | CL | Pre-seed | **$0.6-1.2M** | Producto + 50 archivos código + tracción Beta |

#### Justificadores Paw Friend específicos

1. **Producto vivo** (no PPT): 78 rutas, 197 migs SQL, 42 edge fns, 587 tests verde, código end-to-end de 7 motores Revenue Master Plan.
2. **Apalancamiento founder + IA documentado**: 320 hrs founder = ~4.800 hrs equipo equivalente = USD 720k-1.44M valor de desarrollo capitalizable. Fuente: [APALANCAMIENTO_FUNDADOR_IA.md](pitch/APALANCAMIENTO_FUNDADOR_IA.md).
3. **Modelo B2B de acceso a la ficha reproducible**: el activo es la ficha clínica longitudinal, no la app. Pagan pharma/seguros/retail por acceso con consent ARCO.
4. **Compliance Ley 21.719 + 19.628 cumplido** (pre-seed startups raras lo tienen).
5. **SpA constituida + cuenta Flow lista** = bajo riesgo administrativo.
6. **Tracción inicial Beta**: Sofia (vet) + Palo (tutor) + 13 refugios en outreach.

#### Variables de ajuste

| Variable | Pre-money | Justificación |
|---|---|---|
| **Conservador** | $600k | Sin tracción confirmada beta + sin partner B2B firmado |
| **Base** | $900k | Beta cohorte completa + ~10 Paw Member pagantes |
| **Optimista** | $1.200k | Beta + 1 partner B2B firmado piloto |

**Cap del SAFE recomendado**: USD 1.2M post-money — protege upside del angel sin diluir excesivamente al founder.

### 3.2 Post-money escenarios

| Escenario | Pre-money | Cash | Post-money | Dilución founder |
|---|---|---|---|---|
| Conservador | $600k | $107k SAFE | $707k | 15.1% |
| Base | $900k | $107k SAFE | $1.007k | 10.6% |
| Optimista | $1.200k | $107k SAFE | $1.307k | 8.2% |

CORFO/Start-Up Chile ($43k subsidio combinado) no entran al cálculo de dilución — son grants.

---

## 4. Uso de fondos

USD 150.000 desplegados a 18 meses (julio 2026 - diciembre 2027):

| Categoría | Monto USD | % | Detalle |
|---|---|---|---|
| **Founder salary** (Pedro, mes 7-18) | $30.000 | 20% | $1.7k USD/mes desde mes 7 post-launch (cuando MRR > $1k) |
| **Co-founder técnico** (mes 12-18) | $30.000 | 20% | $5k USD/mes × 6 meses, 1.5% equity pool ESOP |
| **Marketing / growth** | $40.000 | 27% | Paid ads + content + Paw Voices + eventos |
| **Legal + tributario** | $15.000 | 10% | Abogado externo (T&C, DPA, INAPI), contador SpA, factura electrónica setup |
| **Infra + IA** | $15.000 | 10% | Supabase Pro + Petify ($9k Y1 estimado) + OpenAI/HF + Sentry/PostHog |
| **Buffer** | $20.000 | 13% | 6 meses runway extra contingency |
| **Total** | **$150.000** | **100%** | |

---

## 5. Hitos para próxima ronda (Series A post-launch)

Para justificar valuación Series A USD 3-5M post-money en Q3 2027:

| Hito | Métrica target | Mes objetivo |
|---|---|---|
| **MRR consolidado** | ≥ USD 30k/mes (≈ CLP 27M) | Mes 12 post-launch (junio 2027) |
| **MAU** | ≥ 15.000 | Mes 12 |
| **Partners B2B firmados** | ≥ 2 (1 pharma + 1 seguros) | Mes 9 |
| **Conversión Paw Member** | ≥ 13% | Mes 6 |
| **NPS** | ≥ 40 | Mes 9 |
| **Churn mensual Paw Member** | ≤ 5% | Mes 9 |
| **EBITDA** | Positivo o ≤ -USD 5k/mes | Mes 12 |

Si los 7 hitos cumplen → Series A USD 1-2M con post-money USD 5-10M es realista.

---

## 6. Termsheet draft pre-seed (para angel)

**Instrumento**: SAFE (Simple Agreement for Future Equity) versión Y Combinator estándar Chile/LatAm.

| Cláusula | Valor |
|---|---|
| Monto | USD 107.000 |
| Cap (valuation cap post-money) | USD 1.200.000 |
| Discount | 20% |
| MFN (Most Favored Nation) | Sí |
| Pro-rata rights | Sí, hasta Series A |
| Información rights | Reporte trimestral métricas + estados financieros anuales |
| Conversión | Automática en próxima ronda equity ≥ USD 250k |
| Liquidación preferente | 1x non-participating |
| Board seat | No (board observer rights opcional) |
| Anti-dilución | Sin protección (SAFE estándar) |

**Para CORFO SSAF-I**:

| Cláusula | Valor |
|---|---|
| Monto | USD 28.000 (CLP ~25M) |
| Tipo | Subsidio cofinanciamiento (no diluye) |
| Cofinanciamiento | Pedro pone 25% (USD 7k) en horas-hombre o cash |
| Plazo ejecución | 12 meses |
| Hitos reportables | Trimestrales según plan operativo CORFO |
| Restricción pivot | Si pivot mayor del modelo → notificar CORFO |

---

## 7. Defensa de valuación (anti-objeciones inversionista)

### Objeción: "Founder solo + sin co-founder técnico = riesgo single point of failure"

**Respuesta**: Apalancamiento IA documentado (15x output equipo). $30k del ask reservado específicamente para co-founder técnico mes 12. No es ASAP — es disciplina: primero validamos modelo + MRR, después escalamos equipo.

### Objeción: "Mercado pet Chile es chico"

**Respuesta**:
- TAM Chile: ~6M mascotas × USD 100/año gasto promedio = USD 600M/año.
- Modelo B2B de acceso a la ficha: NO necesita el 100% del mercado — solo el 1-2% capturado vía B2B (pharma + seguros + retail) genera ARR USD 2-3M/año a 100k MAU.
- Expansión LatAm año 3: México + Argentina + Colombia × 6 = USD 3.6B TAM combinado.

### Objeción: "Petify es un competidor"

**Respuesta**: Petify es proveedor (B2B API), NO competidor. Ellos cobran al dueño directo ($0.50-0.75/pet/mes); nosotros usamos su API como subprocesador y monetizamos B2B (acceso a la ficha por pharma/seguros/retail). Es complementario, no canibalízación.

### Objeción: "Si pharma tarda en firmar, ¿qué pasa?"

**Respuesta**: Freemium B2C cubre operación a 10k+ MAU sin partners B2B (margen 86% Paw Member, ver MODELO_FINANCIERO sec 5). Pharma/seguros son **upside**, no break-even.

### Objeción: "Valuation $1M para pre-seed sin tracción es alto"

**Respuesta**:
- Comparables LatAm pet-tech: $3M-5M seed con menos producto.
- Tracción documentada: Sofia (vet) testimonio + Palo (tutor) feedback + 13 refugios outreach + 587 tests verde.
- Apalancamiento founder + IA: USD 720k-1.4M valor de desarrollo ya capitalizado (no es promesa, es código).

---

## 8. Lista corta angels Tier 2-3 LatAm a contactar

| Angel/VC | Tier | País | Tickets típicos | Conexión |
|---|---|---|---|---|
| Angel chileno Tier 1 (warm intro red personal) | 1 | CL | $30-100k | Warm intro pendiente confirmar |
| Platanus Ventures | 2 | CL | $100-500k | Pitch público a través de form |
| Magma Partners | 2 | CL | $100-300k | Pitch público |
| Kaszek | 1 | LatAm | $1M+ | Demasiado grande, postpone Series A |
| Cathay Innovation | 1 | LatAm | $500k+ | Postpone Series A |
| FJ Labs | 2 | US/LatAm | $100-300k | Pitch directo |
| Manutara Ventures | 3 | CL | $50-150k | Pitch directo |
| ChileGlobal Angels | 3 | CL | $30-100k | Network founder |

**Estrategia**:
1. Angel chileno Tier 1 vía warm intro red personal — feedback + intro a 2-3 angels Tier 2.
2. Platanus + Magma público (Chile, conocen mercado pet) — meses 1-2 post-launch con métricas.
3. Si no cierra en CL: FJ Labs + ChileGlobal Angels meses 3-4.
4. Kaszek/Cathay solo en Series A con MRR > $30k.

---

## 9. Checklist pre-pitch (data room para angel review)

- [ ] Pitch deck v2 (12 slides) — [PITCH_DECK_V2_2026_04_29.md](PITCH_DECK_V2_2026_04_29.md)
- [ ] Modelo financiero — [MODELO_FINANCIERO_2026_04_29.md](MODELO_FINANCIERO_2026_04_29.md)
- [ ] Cap table actual + post-SAFE (este doc)
- [ ] Path al M$ MRR — [PATH_MRR_2026_04_29.md](PATH_MRR_2026_04_29.md)
- [ ] Beta criteria — [BETA_CRITERIA_2026_04_29.md](BETA_CRITERIA_2026_04_29.md)
- [ ] Legal review — [LEGAL_REVIEW_2026_04_29.md](LEGAL_REVIEW_2026_04_29.md)
- [ ] Apalancamiento founder + IA — [pitch/APALANCAMIENTO_FUNDADOR_IA.md](pitch/APALANCAMIENTO_FUNDADOR_IA.md)
- [ ] Producto demo URL: pawfriend.cl + admin sample dashboard pawfriend.cl/pitch/sample-dashboard.html
- [ ] Testimonios beta (Sofia + Palo + refugios) capturados con consent
- [ ] Estructura SpA + RUT + escrituras (legal)
- [ ] Términos SAFE preparados

---

## 10. Próximos pasos post-cierre ronda

Asumiendo cierre USD 150k en Q3 2026 (mes +2 post-launch):

| Mes | Acción | Métrica clave |
|---|---|---|
| Mes +2 | Cierre cash + comunicación a beta | $150k en cuenta SpA |
| Mes +3 | Activar founder salary | $1.7k USD/mes |
| Mes +4-5 | Acelerar marketing/growth | 200+ Paw Member pagantes |
| Mes +6 | Reach M$ MRR (Hito 8 PATH_MRR) | CLP 1M MRR |
| Mes +8-10 | 1-2 partners B2B firmados | USD 50-200k contratos |
| Mes +12 | Decisión: Series A o bootstrap | MRR ≥ USD 30k → Series A |

---

**Conclusión**: USD 150k pre-seed es el ask justo para llegar a Series A en 12-18 meses con tracción demostrable. Mayor ask diluye sin necesidad; menor ahoga el growth. Cap USD 1.2M post-money protege founder upside sin asustar al angel.
