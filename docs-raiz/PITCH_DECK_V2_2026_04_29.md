# Paw Friend — Pitch Deck v2.1 definitivo (2026-04-29)

> Fase 9 del [pawfriend-prompt-v5.md](../pawfriend-prompt-v5.md).
> 12 slides para angel chileno experimentado / fondo / CORFO.
> Reemplaza versiones previas. Sin marketing-speak. 3-5 bullets por slide.
>
> Para ejecución HTML: usar [public/pitch/inversionistas.html](../public/pitch/inversionistas.html) (ya actualizado por agente speech sweep) como base visual.
> Este doc es la **fuente narrativa canónica** post-pivot Opción 3.

---

## Slide 1 — Portada

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║              🐾  PAW FRIEND                      ║
║                                                  ║
║   La ficha clínica longitudinal del 100%         ║
║   del mercado pet chileno.                       ║
║                                                  ║
║   El dueño no paga porque el activo no es la     ║
║   app — es la ficha. Pagan pharma, seguros y     ║
║   retail por acceso a esa cohorte.               ║
║                                                  ║
║   Pre-seed CL · 2026-06 launch · pawfriend.cl   ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

**One-liner**: La ficha clínica longitudinal del 100% del mercado pet chileno. El activo es la ficha, no la app — pagan quienes quieren acceso a esa cohorte (pharma, seguros, retail).

---

## Slide 2 — Problema

**Mercado pet Chile (2024)**:
- **6 millones de mascotas** registradas formalmente (SAG + estimación INE).
- **75% de hogares chilenos** tienen al menos 1 mascota.
- **Gasto promedio anual**: USD 100/mascota = **TAM USD 600M/año**.

**Lo que está roto hoy**:
- 90% del mercado pet **no usa software** para gestionar la salud de su mascota.
- Vets cargan ficha en papel o Excel; **no hay continuidad** entre veterinarios.
- Mascotas pierden historial al cambiar de vet o mudarse.
- Pharma + seguros + retail **no tienen acceso al cliente final** (canalizan vía dueños individuales con cero data).

**Quote textual** ([Sofia, vet beta tester](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_sofia_vet_beta_tester.md)):
> *"Tengo 200 fichas en Excel. Cuando un dueño me pide la historia para otro vet, paso 30 min copiando. Esto debería ser un click."*

---

## Slide 3 — Solución

**Paw Friend = ficha clínica longitudinal nube + biometría + B2B layer**.

**3 ingredientes únicos**:

1. **Ficha clínica completa** que viaja con la mascota (no con el vet) — vacunas, antiparasitarios, peso, condiciones, historial OCR carnet.

2. **Pet ID Card + QR público** — identificador único de cada mascota, gratis para todos. Si se pierde, cualquier persona escanea el QR y contacta al dueño. (Paw Shield biométrico opcional B2B-funded futuro: infra dormida en repo, reactivable solo si una aseguradora financia la captación.)

3. **Modelo B2B de acceso a la ficha**: el dueño no paga (free + freemium opcional). **Pharma + seguros + retail pagan** por acceso a la ficha agregada anonimizada con consent.

**Por qué el moat es real**:

- Cuanto más vets/dueños cargan datos, más rica la ficha → más útil para todos → más sticky.
- Datos longitudinales (años de historial mascota) imposibles de replicar por competidor nuevo.
- Compliance Ley 21.719 + 19.628 + ARCO ya implementado.

---

## Slide 4 — Producto

**Capturas reales** (no mockups):

| Pantalla | Qué muestra |
|---|---|
| Home pet-focus | Mascota en foco, próxima acción pendiente, timeline corto |
| Ficha clínica 4 tabs | Historia · Cuidados · Identidad · Más (timeline + Pet ID Card + QR) |
| /paw-member pricing | 3 tiers Free/Member/Manada visibles |

**Stack técnico verificado**:
- React 18 + TypeScript 5.8 + Vite + Supabase (Postgres + Edge Functions Deno)
- Capacitor 7 (iOS + Android compilable)
- 78+ rutas, 197+ migraciones SQL, 42+ edge functions
- 587 tests verde, RLS hardening 768 policies, telemetría centralizada
- Pagos Flow.cl integrados, OAuth Google/Apple/Facebook

**Ya funcional**: Pet ID Card + ficha completa + recordatorios + calendario + adopción + memorial + directorio vets + Paw Passport PDF.

---

## Slide 5 — Mercado (bottom-up)

### Chile (mercado primario)

| Segmento | Universo | Penetración Y3 | Usuarios objetivo | ARPU/año | Ingreso potencial |
|---|---|---|---|---|---|
| Tutores | 4.5M hogares con pet | 5% | 225.000 | USD 30 (mix free+pago) | USD 6.7M |
| Vets | 8.000 vets activos | 15% | 1.200 | USD 200 (premium) | USD 240k |
| Clínicas | 500 medianas/grandes | 20% | 100 | USD 600 | USD 60k |
| Pharma B2B | 6 brands | 50% (3 deals) | 3 | USD 150k/deal | USD 450k |
| Seguros B2B | 8 aseguradoras | 25% (2 deals) | 2 | USD 300k/deal | USD 600k |
| Retail B2B | 10 retailers | 30% (3 deals) | 3 | USD 250k/deal | USD 750k |
| **TAM Chile capturable Y3** | | | | | **USD 8.8M/año** |

### LatAm Y4-5 (México + Argentina + Colombia + Perú)

- 6x el tamaño de Chile combinados.
- TAM total LatAm: **USD 53M/año** capturable a 5% penetración.

**SOM realista año 1**: 1.5k MAU · USD 9k ARR. Año 3: 50k MAU · USD 1.37M ARR.

---

## Slide 6 — Modelo de negocio multi-engine

**Freemium B2C (acquisition + cubre COGS)**:

| Tier | Precio | Mascotas | Conversion target | Margen |
|---|---|---|---|---|
| Free | $0 | 2 | 85% MAU | -$41 (subsidiado) |
| Paw Member | $3.990/mes | 4 | 13% | **86%** |
| Manada | $9.990/mes | 5 | 2% | **62%** |

**Manada incluye $2.000/mes a Fondo Paw Friend Refugios** (donado por SpA, no user — diseño legal anti-Ley 19.885).

**B2B de acceso a la ficha (revenue principal a escala)**:

| Pilar | Quién paga | Ticket anual | Activación |
|---|---|---|---|
| **Pharma** | Centrovet, Virbac, Zoetis | USD 50-200k | Mes 4-6 post-seed |
| **Seguros** | Sura, BCI, Mapfre | USD 200-500k | Mes 6-9 |
| **Retail** | Master Dog, Falabella Pet, Puppis | USD 250-500k | Mes 8-12 |
| **Paw Companys** | Empresas pet-friendly | USD 600-1.8k/mes | Ya vivo |

**COGS clave**: ninguno externo en consumer (Opción C 2026-04-30). Paw Member margen ~99%, Manada ~80% (con $2.000/mes refugios). Petify queda como infra dormida reactivable solo con financiamiento B2B futuro.

**EBITDA proyectado**:

| MAU | ARR USD/año | EBITDA USD/año | Margen |
|---|---|---|---|
| 1.000 | $9k | $2k | 22% |
| 10.000 | $175k | $120k | 69% |
| 50.000 | $1.37M | $1.25M | 91% |
| 100.000 | $3.07M | $2.84M | 92% |

---

## Slide 7 — Tracción real

**Pre-launch (al 2026-04-29)**:

- **Sofia (vet)**: beta tester desde marzo 2026. Feedback: "vacunas con lote/serie, antiparasitarios con recordatorio". Implementado.
- **Palo (tutor iPhone)**: feedback usabilidad. 6 bugs fixeados.
- **Pivot estratégico 2026-04-22**: 3 insights aplicados (vets ≠ revenue, donaciones legal vía SpA Art. 31 N°7 LIR, paywall solo para features avanzadas).
- **13 refugios chilenos contactados** (outreach 2026-04-27) — relación se mantiene como canal de adquisición y voluntariado, no como source de training biométrico (Opción C: biometría dormida).
- **Producto deployed**: pawfriend.cl + iOS/Android compilable.
- **Compliance verificado**: Ley 21.719 + 19.628 + ARCO.

**Producto ejecutado en 8 meses por founder solo + IA**:

- 503 commits, 587 tests, 197 migraciones SQL, 42 edge functions, 78 rutas
- Apalancamiento documentado: **15x output equipo equivalente** (USD 720k-1.4M valor desarrollo capitalizado).

**Tesis core post-pivot 2026-04-22**:
> *"El vet no paga por el software porque su valor está en construir la ficha. El activo es la ficha. Quien paga es quien quiere acceder a la mascota a través de ella."*

---

## Slide 8 — Competencia (matriz 2×2 honesta)

```
                    Producto SaaS profundo
                            ↑
                            │
         Petify ──────────  │  ─── Paw Friend (post-launch)
         (CL)               │      Vetster (CA)
         B2C extractivo     │      PetDesk (US)
                            │
                            │
   ←────────────────────────┼────────────────────────→
   Modelo extractivo dueño  │  Modelo B2B acceso a ficha
                            │
                            │
   Vetstoria ──────────     │  ─── (espacio vacío en CL)
   (UK/global)              │
   B2B vets only            │
                            │
                            ↓
                    Producto vertical estrecho
```

**Posicionamiento Paw Friend**: cuadrante superior derecho — producto SaaS profundo + modelo B2B de acceso a la ficha.

**Vs Petify (Chile)**:
- Petify cobra USD 0.50-0.75/mascota/mes al dueño directo. Captura 10% del mercado dispuesto a pagar.
- Paw Friend usa Petify como subprocesador biométrico, NO compite directo. Capturamos el 100% del mercado vía freemium B2C + monetizamos B2B.

**Vs PetDesk/Vetster (US/CA)**:
- Foco vet-only, modelo SaaS clásico ($100+/mes vet). No tienen integración pharma/seguros/retail.

**Vs Vetstoria/Provet Cloud (UK/global)**:
- B2B vet management. Cero producto B2C. Caro para mercado chileno.

**Espacio vacío que ocupamos**: producto B2C profundo + B2B de acceso a la ficha en LatAm.

---

## Slide 9 — Go-to-market 12 meses post-launch

| Trimestre | Foco | Métrica clave |
|---|---|---|
| **Q1** (jul-sep 26) | Beta cohorte → launch público | 1.000 signups · 100 pagantes |
| **Q2** (oct-dic 26) | Content marketing + Paw Voices + 1 piloto B2B | 5.000 MAU · MRR CLP 1M ✅ |
| **Q3** (ene-mar 27) | Acelerar B2C + 2do partner B2B | 15.000 MAU · MRR USD 8k |
| **Q4** (abr-jun 27) | Decisión Series A o bootstrap | 30.000 MAU · MRR USD 25k |

**Canales de adquisición**:
1. **Paw Voices** (creadores influencers) — alianza barter, no paid.
2. **Content + SEO** — landings `/insights/:slug` + blog veterinario chileno.
3. **Vets como canal de adquisición** — cada vet trae ~50-100 dueños (cohorte beta confirmará tasa).
4. **Refugios** — onboarding dueños post-adopción con ficha pre-cargada.
5. **Paid ads** (mes 6+) — Instagram + Google con foco multi-pet households.

**Sales B2B**: Pedro directo a Centrovet (Agrosuper, chileno, accesible). Si firma → referencia para Virbac/Zoetis/Sura.

---

## Slide 10 — Equipo

### Pedro Susaeta (founder & CEO)

- **Track**: Macrotel (BI/SQL/DAX, 5 años) + SYNAP (BI manager) + freelance data.
- **SpA constituida**: SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT 78.328.659-9.
- **Apalancamiento founder + IA**: 320 hrs founder = ~4.800 hrs equipo equivalente = USD 720k-1.44M valor de desarrollo capitalizado. Documentado en [APALANCAMIENTO_FUNDADOR_IA.md](pitch/APALANCAMIENTO_FUNDADOR_IA.md).

### Plan equipo post-funding

| Mes | Hire | Equity ESOP |
|---|---|---|
| Mes 12 | Co-founder técnico | 1.5% ESOP pool |
| Mes 18 | Growth marketer (CL) | 0.5% |
| Mes 24 | BD lead B2B | 0.5% |

**Asesores ya activos**:
- Sofia (vet) — referencia vertical veterinario.

---

## Slide 11 — Financieros + Ask

### Ask: USD 150.000 pre-seed

| Fuente | Monto | Estructura |
|---|---|---|
| CORFO SSAF-I | $28k | Subsidio (no diluye) |
| Start-Up Chile Ignite | $15k | Subsidio (no diluye) |
| Angel Tier 2-3 LatAm | $107k | SAFE cap USD 1.2M post-money + discount 20% |

### Pre-money sugerida

USD 600k - 1.200k según tracción al cierre. **Base USD 900k**.

### Uso de fondos (18 meses)

| Categoría | % |
|---|---|
| Founder salary mes 7-18 | 20% |
| Co-founder técnico mes 12-18 | 20% |
| Marketing/growth | 27% |
| Legal + tributario | 10% |
| Infra + IA + Petify | 10% |
| Buffer | 13% |

### Hitos para próxima ronda Series A

- MRR ≥ USD 30k (mes 12)
- MAU ≥ 15.000
- 2 partners B2B firmados
- Conversión Paw Member ≥ 13%
- NPS ≥ 40

→ Series A USD 1-2M post-money USD 5-10M en Q3 2027.

Detalle completo: [CAP_TABLE_VALUACION_2026_04_29.md](CAP_TABLE_VALUACION_2026_04_29.md).

---

## Slide 12 — Cierre

### Por qué ahora

1. **Mercado pet Chile creció 35% post-pandemia**. Adopción récord en 2021-2024.
2. **Petify ya legitimizó la categoría** (USD 0.75/pet/mes) — mercado dispuesto a pagar por biometría/identidad mascota.
3. **Ley 21.020 obliga registro digital** mascotas — momento ideal para white-label gobierno (motor B2B #6).
4. **IA + cloud bajó costo de desarrollo 15x** (apalancamiento documentado) — startup pet-tech viable con USD 150k.

### Por qué este equipo

1. **Founder con track BI/data 5+ años** — entiende monetización de data agregada (consent ARCO + agregaciones por raza/comuna/edad).
2. **Producto vivo de 8 meses** — no es PPT, es 503 commits + 587 tests + 197 migs.
3. **Compliance pre-resuelto** (Ley 21.719 + 19.628 + ARCO) — barrera de entrada para competidores.

### Por qué Paw Friend ganará

1. **Free + Freemium = 100% del mercado capturado**. Petify captura 10%, deja 90% en la mesa.
2. **Modelo B2B de acceso a la ficha = ARR 5-10x SaaS clásico vet**.
3. **Compliance + biometría = moat regulatorio + producto** difícil de replicar.
4. **LatAm expansion path** ya mapeado — Chile es laboratorio.

### Cierre

> *"En 12 meses Paw Friend va a ser la ficha clínica longitudinal más completa del mercado pet chileno. En 36 meses, de LatAm. Buscamos USD 150k para acelerar lo que ya está en marcha."*

**Pedro Susaeta · pawfriendcl@gmail.com · pawfriend.cl**

---

## Anexo A — Datos para conversación post-pitch

**Modelo financiero detallado**: [MODELO_FINANCIERO_2026_04_29.md](MODELO_FINANCIERO_2026_04_29.md)
- Sensibilidad FX: aguanta hasta CLP 1.100 sin romper margen.
- Sensibilidad Petify: aguanta x2 precio sin romper Paw Member margen.
- Capital ask justificado por escenarios.

**Path al M$ MRR mes a mes**: [PATH_MRR_2026_04_29.md](PATH_MRR_2026_04_29.md)
- 8 hitos accionables con dueño + dependencia + métrica de éxito.
- Plan B por hito si hay riesgo.

**Cap table + termsheet**: [CAP_TABLE_VALUACION_2026_04_29.md](CAP_TABLE_VALUACION_2026_04_29.md)
- SAFE estándar Y Combinator + comparables LatAm pet-tech.
- Defensa anti-objeciones inversionista (5 objeciones típicas + respuestas).

**Beta criteria**: [BETA_CRITERIA_2026_04_29.md](BETA_CRITERIA_2026_04_29.md)
- Cohorte 4-6 semanas pre-launch.
- Métricas no-vanity para validar model.

**Polish E2E + QA**: [POLISH_QA_E2E_2026_04_29.md](POLISH_QA_E2E_2026_04_29.md)
- Matriz QA 6 flujos críticos.

**Legal**: [LEGAL_REVIEW_2026_04_29.md](LEGAL_REVIEW_2026_04_29.md)
- Ley 21.719 + 19.628 + ARCO compliance.
- Recomendaciones abogado externo CLP 500k-1.5M.

---

## Anexo B — Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Conversión Paw Member < 5% | Media | Alto | Iterar paywall, A/B test |
| Petify x2 precio | Baja-media | Medio | Modelo entrenamiento propio en marcha (refugios) |
| FX > CLP 1.100 | Media | Bajo | Subir pricing CLP proporcional |
| Pharma no firma | Alta | Medio | B2C cubre 1k-10k MAU sin B2B |
| Founder single point of failure | Media | Alto | $30k del ask reservado para co-founder técnico mes 12 |
| Competidor entra Chile | Media | Medio | Moat data longitudinal + compliance + Petify exclusivity nivel volumen |

---

**Versión**: 2.1 (post-pivot Opción 3 freemium)
**Fecha**: 2026-04-29
**Autor**: Pedro Susaeta
**Próxima actualización**: post-cohorte beta con métricas reales (junio 2026)
