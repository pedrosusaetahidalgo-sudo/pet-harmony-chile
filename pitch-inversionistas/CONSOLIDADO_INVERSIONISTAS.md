# Paw Friend — Consolidado para inversionistas

> **Fuente de verdad unica** para pitches, data rooms, postulaciones a fondos publicos
> y reuniones con empresas interesadas en sponsor.
>
> Ultima revision: **2026-04-19**.
> Responsable: Paw Founder · pedrosusaeta@pawfriend.cl

---

## Indice

1. [La narrativa emocional](#1-la-narrativa-emocional)
2. [El problema](#2-el-problema)
3. [La solucion](#3-la-solucion)
4. [Producto en vivo (2026-04-19)](#4-producto-en-vivo)
5. [Traccion y signals unicos](#5-traccion-y-signals-unicos)
6. [Modelo de negocio (6 motores)](#6-modelo-de-negocio-6-motores)
7. [Mercado y timing](#7-mercado-y-timing)
8. [Competencia y moats](#8-competencia-y-moats)
9. [Apalancamiento fundador + IA](#9-apalancamiento-fundador--ia)
10. [Equipo](#10-equipo)
11. [Roadmap 18 meses](#11-roadmap-18-meses)
12. [Ask — pre-seed USD $150K](#12-ask--pre-seed-usd-150k)
13. [Impacto y transparencia](#13-impacto-y-transparencia)
14. [Riesgos y mitigaciones](#14-riesgos-y-mitigaciones)
15. [Apendices](#15-apendices)

---

## 1. La narrativa emocional

> **Amamos a las mascotas. Lo queremos hacer gratis. Necesitamos tu ayuda.**

Las mascotas no son un negocio. Son familia. En Chile, **7 de cada 10 hogares** tienen una — pero viven con los carnet de vacunas en la guantera del auto, recordando las dosis de memoria.

Paw Friend es la carta de amor de un ingeniero chileno a cada perro, gato, conejo y dueño que se ha sentido solo en una sala de urgencia veterinaria.

**Fundador**: Paw Founder — 10+ años como ingeniero de software, dueño real de **Kai** (perro, pastor suizo, cliente N°1) y **Ema** (gata, cliente N°2). Construyó Paw Friend en 2 meses con Claude como copiloto, desde Chile, sin capital externo.

**Tagline oficial**: *"La ficha clinica digital de tu mascota, conectada con tu veterinario. Hecho en Chile, de pura mano, con IA de Claude."*

---

## 2. El problema

### Evidencia cualitativa — voces reales

> *"Pepa fue vacunada hace 6 meses y no se si es hora de la proxima. El carnet esta en la guantera del auto."*
> — **Paloma**, duena beta tester, iPhone, 2 mascotas.

> *"Yo tomo notas en Word y mando por WhatsApp. Me gustaria que quedara en un solo lugar."*
> — **Sofia Rosi**, veterinaria beta tester.

### Segmentacion del dolor

| Segmento | Dolor real |
|---|---|
| **Dueno de mascota** | Carnet medico en papel, vacunas olvidadas, sin recordatorios, documentos perdidos al cambiar de vet |
| **Vet chico / clinica independiente** | Agenda en papel, WhatsApp como CRM, QVET/VetPraxis sin precio publico y para clinicas grandes |
| **Refugios y callejeros** | Sin infraestructura digital, donaciones perdidas entre Instagram y transferencias |

### Evidencia cuantitativa

- Tenencia de mascotas Chile: ~70% hogares.
- Mercado pet Chile: ~USD 1B+/ano.
- Digitalizacion: **<15%**.
- Ley 21.020 de tenencia responsable exige registro RUP.

---

## 3. La solucion

**Una ficha medica digital que el dueno descarga, el vet actualiza y la comunidad apoya.**

### 4 componentes integrados

1. **Ficha clinica + PDF descargable** (la joya). Vacunas, consultas, Feline Grimace Scale, compartir con token 30 dias, OCR de carnet.
2. **Directorio publico de vets** con pricing CLP transparente por comuna y especialidad. SEO optimizado. Unico en Chile.
3. **Agenda + recordatorios + resenas** end-to-end. Cierra el loop dueno ↔ clinica.
4. **Paw Voices + donaciones trazables**. Muralla publica de mensajes reales, aportes via Flow, dashboard de transparencia, Paw Companys con badge empresarial.

### Diferenciadores defendibles

- **Vertical B2C + B2B + comunidad integrada** — nadie mas cruza los 4 ejes.
- **Pricing CLP transparente** vs QVET/VetPraxis.
- **Onboarding vet <5 minutos** con OCR de carnet.
- **Costos variables <USD $100/mes** — producto artesanal + IA.

---

## 4. Producto en vivo

**Todo lo que sigue ya existe en pawfriend.cl al 2026-04-19. No es un prototipo.**

### Numeros verificables del repo

| Metrica | Valor |
|---|---|
| Commits en `main` | **504** |
| Rutas activas | **67** (18 publicas, 40 protegidas, 3 provider, 2 admin, 4 redirects) |
| Componentes React custom | **319** (20 subdirectorios) |
| Paginas | **65** |
| Hooks custom | **84** |
| Edge Functions (Deno) | **38** |
| Migraciones SQL | **201** |
| Tests pasando | **334** (Vitest + Playwright) |
| Lineas en `src/` | ~127.000 |
| Lineas en `supabase/` | ~32.000 |

### Core B2C (duenos)

- Ficha clinica digital con vacunas, consultas, vacunas por especie, Feline Grimace Scale
- PDF descargable + ZIP documentos + compartir con token 30 dias
- OCR carnet de vacunacion (IA)
- Recordatorios cronologicos + calendario unificado
- Directorio publico de vets (SEO por comuna + especialidad)
- `/donaciones` publico con Paw Voices y Paw Companys
- Paw Points (gamificacion vinculada a salud real)

### Core B2B (veterinarios)

- Dashboard: pacientes, reservas, agenda, audit trail
- Plantillas post-consulta + transcripcion audio
- Preview "como me ven los duenos" (diferenciador unico)
- Reportes semanales + analytics
- Reserva online con comisiones por plan
- Multi-vet (Clinica Basica/Pro)

### Core Admin

- **Sala de Inversion en vivo** — este deck nace de ahi
- **Pulso Diario** + auto-fixers + health score de edge functions
- Monitoreo de donaciones y feedback ratings en tiempo real
- CRM de leads veterinarios + outreach automatizado

### Stack tecnico

React 18 + Vite + TypeScript + Tailwind + Supabase (Postgres + Edge Functions + Storage + Auth) + Capacitor 7 (iOS + Android) + Flow.cl + PostHog + Sentry + Google Calendar OAuth + WhatsApp Cloud + Anthropic Claude.

---

## 5. Traccion y signals unicos

> **Regla**: en cada pitch, actualizar numeros desde `/admin?section=sala-inversion`. Nunca "aprox".

### Metricas vivas (plantilla)

| Metrica | Hoy | Meta 90d | Meta 12m |
|---|---|---|---|
| Usuarios totales | `[DATO]` | 2.000 | 15.000 |
| MAU | `[DATO]` | 500 | 5.000 |
| Premium B2C activos | `[DATO]` | 100 | 800 |
| Clinicas B2B pagando | `[DATO]` | 20 | 150 |
| MRR (CLP) | `[DATO]` | $1.9M | $15M |
| ARR run-rate (USD) | `[DATO]` | $24K | $190K |
| Retention D30 | `[DATO]` | 30% | 40% |
| Donaciones totales (CLP) | `[DATO]` | $500K | $5M |
| Donantes unicos | `[DATO]` | 50 | 500 |
| Paw Companys activos | `[DATO]` | 3 | 15 |
| Rating app | `[DATO]`/5 | 4.3/5 | 4.5/5 |
| Willingness-to-pay (yes) | `[DATO]`% | 40% | 55% |

### Signals unicos (no los tiene ningun competidor)

1. **Willingness-to-pay medido** — el widget de feedback pregunta explicitamente "¿Pagarias por esta app?". Yes/maybe/no como predictor de conversion Premium.
2. **Techo emocional medido** — las donaciones voluntarias miden cuantos duenos aportan sin contraparte directa. Proxy NPS monetizable.
3. **Feedback iterativo real** — Sofia (vet) y Paloma (duena) probaron en iPhone y Android, cada ajuste esta documentado en commits reales.

---

## 6. Modelo de negocio (6 motores)

**Modelo hibrido**: no dependemos de un solo pilar. Cada motor tiene su momento, audiencia y moat.

### Tabla maestra

| Motor | Tipo | Ticket | Comision | Rol estrategico |
|---|---|---|---|---|
| **Premium B2C** | SaaS dueno | $3.990 CLP/mes · $39.900/ano | — | Base recurrente mas ancha |
| **B2B Vet Free** | SaaS vet | $0 | 12% | Adquisicion + directorio publico |
| **B2B Vet Premium** | SaaS vet | $9.900 CLP/mes | 10% | Sweet spot vets individuales |
| **B2B Vet Pro Max** | SaaS vet | $29.900 CLP/mes | 0% | Clinicas medianas con volumen |
| **Paw Companys** | B2B2C sponsor | $49.900-$199.900 CLP/mes | — | Sponsorship empresarial + aval social |
| **Marketplace** | Comision booking | 0-12% | — | Upside sin fijo, escala con uso |
| **Donaciones** | Voluntarias | $100 CLP = 10 Paw Points | — | Proxy NPS + colchon a refugios |

### Unit economics (conservador)

| Metrica | Valor | Comentario |
|---|---|---|
| ARPU blended subs | USD $15-20/mes | Mix B2C + B2B |
| Ticket donacion promedio | `[DATO live]` | Dashboard admin |
| LTV estimado | USD $300-500 | 12-24 meses |
| CAC organico | USD $15-30 | Outreach founder, SEO directorio |
| Payback | 2-4 meses | — |
| LTV/CAC | **>10×** | Consistente con SaaS SMB CL |

### Por que este pricing

- Premium B2C a **"Netflix pet"** (precio accesible, gratis 2 mascotas).
- B2B Individual ataca vets chicos que **hoy no pagan PMS**.
- Techo alto (Clinica Pro) captura clinicas >5 vets.
- Paw Companys abre eje independiente: presupuesto CSR empresarial que hoy se pierde en ads tradicionales.

---

## 7. Mercado y timing

### TAM / SAM / SOM

| Nivel | Definicion | Tamano | Supuestos |
|---|---|---|---|
| **TAM** | Hogares pet × gasto digital anual (Chile + LATAM Andino) | USD **~2,5B**/ano | 20M hogares × USD $125/ano |
| **SAM** | Digital-native + ticket SaaS pet (CL + PE + CO) | USD **~120M**/ano | 5% del TAM |
| **SOM 3 anos** | Cuota con outreach organico + CORFO + Paw Companys | USD **~3-4M ARR** | 5-6% del SAM Chile + piloto regional |

### Solo Chile (para postulaciones CORFO / Start-Up Chile)

- 4M hogares con mascota × USD $40/ano digital = TAM Chile **~USD 160M**.
- SAM Chile: ~1.500 clinicas chicas pagables + ~500K duenos digital-native = **USD ~25-35M**/ano.
- SOM 3 anos Chile solo = **USD ~1.5M ARR** (techo si no expandimos).

**Implicancia VC**: Chile solo no es venture-scale. LATAM Andino lo vuelve defendible para una Seed Series.

### Ventana de timing — 12-18 meses

- Stack Capacitor + Supabase + Flow.cl: MVP con costos <USD $100/mes (imposible hace 5 anos).
- IA colaborativa (Claude): founder solo construye producto Series-A-grade con presupuesto angel.
- **QVET** (espanol, 8.000 clientes) sin comercial local todavia.
- **Petsy** overlap B2C pero sin directorio SEO ni B2B.
- **Comportamiento post-pandemia**: dueno busca online antes de ir al vet (resenas, precios, especialidad) + quiere apoyar causas locales con trazabilidad.

---

## 8. Competencia y moats

### Matriz 2×2 (ejes: B2C ↔ B2B | Con directorio ↔ Sin directorio)

|  | Con directorio SEO | Sin directorio SEO |
|---|---|---|
| **B2B only** | Veterinariachile.com (pasivo) | QVET, VetPraxis, GVET, Milovet |
| **B2C only** | — | Petsy, CuidaPet, Duko, Wolkie |
| **B2C + B2B + Comunidad** | **Paw Friend** 🐾 | — |

### Competidores clave y jugada

| Competidor | Amenaza | Nuestra jugada |
|---|---|---|
| **QVET** | Alta 18-24m — entran a Chile | Ganar vet chico chileno antes con onboarding 5 min |
| **Petsy** | Media — overlap B2C | Directorio SEO + plan B2B + Paw Companys |
| **CuidaPet** | Baja — solo vet a domicilio | No compite en ficha ni B2B |
| **WhatsApp + Instagram** | Alta (real) — 80% de vets chicos | "WhatsApp con memoria": onboarding + recordatorios |

### 5 Moats

1. **Directorio SEO publico** — `/veterinarios/[comuna]/[slug]`. Nadie mas lo tiene B2C.
2. **Pricing CLP transparente + onboarding rapido**.
3. **Integracion dueno ↔ vet end-to-end** — reserva + ficha + resena.
4. **Paw Companys + donaciones trazables** — aval social imposible de copiar.
5. **Costos home-made** — producto artesanal + IA. Quema baja = runway largo.

---

## 9. Apalancamiento fundador + IA

> **En 2 meses un founder + Claude entrego lo que un equipo de 5 expertos coordinados tardaria 6 meses — o un unico experto top-tier 2,5 anos.**

### Numeros gruesos

| | Tu realidad | Equipo de expertos sin IA |
|---|---|---|
| **Horas humanas** | ~320 hrs | ~4.800 hrs |
| **Tiempo calendario** | 2 meses (solo) | 6 meses (5 expertos coordinados) |
| **Costo tarifa CL** (USD 150/hr) | USD 22.400 | **USD 720.000** |
| **Costo tarifa US top-tier** (USD 300/hr) | USD 22.400 | **USD 1.440.000** |
| **Apalancamiento tiempo** | — | **15×** |
| **Apalancamiento costo** | — | **32× a 65×** |

### Detalle por area

| Area | Tu tiempo | Experto sin IA | Ratio |
|---|---|---|---|
| Frontend (65 pages + 319 comps + 84 hooks) | 90 hrs | 1.100 hrs | 12× |
| Backend Supabase (201 mig + 38 edge fns) | 55 hrs | 800 hrs | 15× |
| Ficha clinica + PDF (joya) | 20 hrs | 220 hrs | 11× |
| Directorio vets publico | 12 hrs | 120 hrs | 10× |
| Pagos Flow.cl (B2C + B2B) | 15 hrs | 170 hrs | 11× |
| Integraciones IA (OCR, asistente, resumen) | 15 hrs | 180 hrs | 12× |
| OAuth / WhatsApp / PostHog / Sentry / Firebase | 20 hrs | 230 hrs | 12× |
| Admin Panel (37 comp, 19.700 loc) | 25 hrs | 370 hrs | 15× |
| Mobile (Capacitor iOS + Android) | 10 hrs | 130 hrs | 13× |
| Seguridad + RLS + auditorias | 18 hrs | 240 hrs | 13× |
| Testing (334 tests) | 8 hrs | 100 hrs | 12× |
| Docs + auditorias (~95 MDs) | 20 hrs | 180 hrs | 9× |
| Producto / pitch / VC / monetizacion | 12 hrs | 150 hrs | 13× |
| Coordinacion / arquitectura / code review | — | 800 hrs | — |
| **TOTAL** | **~320 hrs** | **~4.800 hrs** | **~15×** |

### Comparacion con startups veterinarias internacionales

| Startup | Pais | Equipo inicial | Tiempo a MVP publico | Pre-seed |
|---|---|---|---|---|
| Pawp | US | 6 personas | ~12 meses | ~USD 3M |
| Fuzzy | US | 8 personas | ~14 meses | ~USD 4,5M |
| Barkibu | ES | 5 personas | ~10 meses | ~USD 1,8M |
| **Paw Friend** | **CL** | **1 founder + IA** | **~2 meses** | **<USD 25K invertido** |

### Lo que NO hace la IA

Claude escribe el **que** (boilerplate, migraciones, tests). El founder puso el **por que**:

- Pricing CL realista con datos de mercado local.
- Regla 9.8 de proteccion de datos reales en produccion (ver `CLAUDE.md`).
- Pivote a donaciones + Paw Companys como tercer motor.
- Feedback iterativo real con Sofia y Paloma.
- Copia en tuteo chileno (no argentino, no espanol).
- Modelo de roles duales dueno ↔ vet con switching inline.
- Posicionamiento "home-made Chile" explicito, no escondido.

**Un equipo de expertos construye lo que se le dicta; sin criterio de producto del founder, no hay Paw Friend — hay otro CRUD veterinario mas.**

---

## 10. Equipo

### Fundador

**Paw Founder** — Ingeniero de software (10+ años), fundador y líder del producto.

- Dueño de SpA SUSAETA GARNHAM SOFTWARE ENGINEERING (RUT **78.328.659-9**). Inicio SII en domicilio comercial Luis Pasteur 6111 Dp 201, Vitacura.
- Construyó el producto completo: frontend, backend, mobile, DevOps, producto, copy, seguridad.
- Dueño real de **Kai** (perro, pastor suizo) y **Ema** (gata) — clientes N°1 y 2.
- Contacto: pedrosusaeta@pawfriend.cl
- Repositorio disponible bajo NDA

### Co-pilot

**Claude (Anthropic)** — IA co-engineer.

- Permite ciclos de build + QA 5-10× mas rapidos que un founder solo tradicional.
- Acreditado en todos los footers publicos ("Con IA de Claude").
- Transparencia total — no es un secreto, es un moat.

### Advisors / beta testers

- **Sofia Rosi** — veterinaria, beta tester. Feedback incorporado: vacunas con lote/serie, antiparasitarios con recordatorio.
- **Paloma** — duena iPhone, 2 mascotas. Feedback incorporado: nav simplificada, onboarding gamificacion.

### Gap honesto y plan

- Buscamos **co-founder comercial/clinico** con equity vested antes del cierre de pre-seed.
- Advisor SaaS LATAM en pipeline (rellenar en cada pitch con nombres concretos).

### Por que el founder es el indicado

- 10+ anos de ingenieria de software.
- Dueno de mascota real con experiencia del dolor.
- Unica persona en Chile construyendo la interseccion B2C+B2B+directorio+comunidad en stack moderno.
- Construyo producto funcional Series-A-grade con presupuesto angel e IA como co-engineer.

---

## 11. Roadmap 18 meses

**Objetivo**: ARR USD $500K en 12 meses, USD $1M en 18 meses → Seed readiness.

### Fase 1 — Mes 1-3: Primeras ventas + primeros Paw Companys

- Reactivar Premium B2C → meta **100 pagos**.
- Outreach a 500 vets chilenos → cerrar **20 clinicas pagas**.
- Cerrar **3 Paw Companys** (pet shop, alimento, seguro).
- Publicar dashboard de transparencia de donaciones.
- Cerrar co-founder comercial.
- Esconder Paw Labs (gamificacion experimental) del pitch.

### Fase 2 — Mes 4-6: Consolidacion Chile

- Escalar a **500 Premium + 60 clinicas + 10 Paw Companys**.
- Postular **CORFO SSAF-I** (USD $28K) + **Start-Up Chile Ignite** (USD $15K).
- Contratar SDR (ventas B2B) + 1 engineer.
- Primer caso de exito B2B documentado (video + metricas).
- Convenio formal con refugio aliado.

### Fase 3 — Mes 7-12: Piloto LATAM

- Definir pais #2 (Peru o Colombia).
- **2.000 Premium + 150 clinicas + 20 Paw Companys** (Chile) + primer piloto en pais #2.
- Pre-seed angel LATAM cerrado (USD $100-200K).
- Roadmap Seed para mes 18.

### Hitos cuantitativos

| Mes | MRR (USD) | ARR (USD) | Paw Companys | Donaciones (CLP) |
|---|---|---|---|---|
| 3 | $2K | $24K | 3 | $500K |
| 6 | $8K | $96K | 10 | $2M |
| 12 | $40K | $500K | 20 | $5M |
| 18 | $80K | $1M | 30+ | $10M+ |

---

## 12. Ask — pre-seed USD $150K

**Instrumento**: SAFE o nota convertible (YC standard).
**Monto**: USD **$150K**.
**Valuation cap**: USD **$1,2M post-money**.
**Lead deseado**: angel pet-tech LATAM o Platanus Ventures / Magma Partners.

### Uso de fondos (12 meses)

| Categoria | % | Monto USD | Que se compra |
|---|---|---|---|
| Co-founder + 1 engineer | 45% | $67K | Salarios 12m |
| SDR ventas B2B + Paw Companys lead | 20% | $30K | Outreach clinicas + cierre empresas pet |
| Marketing performance B2C | 15% | $22K | Meta Ads + Google Ads + contenido |
| Legal, contabilidad, DPA | 10% | $15K | SpA, DPA Supabase, IP |
| Infraestructura + buffer | 10% | $15K | Supabase Pro, Sentry, PostHog, buffer |

### Por que este ticket

- 12-14 meses de runway.
- Cerrar co-founder comercial con equity + salario minimo viable.
- No diluye en exceso antes de demostrar traccion.

### Condiciones negociables

- Board observer para el lead.
- Pro-rata en Seed.
- Reporting mensual (Sala de Inversion snapshot + video loom).
- Acceso read-only al admin para el lead.

### Pre-money defendible

- Base: output de 2 meses = USD $720K-1,44M en valor de mercado (ver [APALANCAMIENTO_FUNDADOR_IA.md](../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md)).
- Conservador: pre-money USD 600-900K.
- Con traccion inicial (20 B2B + 100 Premium): techo USD 1M+ defendible frente a fondos US.

---

## 13. Impacto y transparencia

### Principio operativo

Paw Friend es un proyecto chico. Costos variables **<USD $100/mes**. Cualquier excedente de donaciones y sponsorship se destina a refugios y campanas de callejeros → adopciones.

### Flujo de trazabilidad

1. Donacion via Flow (dueno) o sponsorship recurrente (Paw Company).
2. Admin en `/admin?section=content&sub=feedback&tab=donaciones` muestra cada aporte.
3. Dashboard publico (roadmap mes 3): total recaudado, destinado, pendiente, por causa.
4. Paw Voices: muralla publica de mensajes de duenos que aportaron — aval social real.

### Por que esto importa para el VC

- Costos bajos + excedente comunitario = **menor quema, mejor NPS, historia de marca imposible de copiar** por Petsy/QVET.
- Paw Companys genera revenue recurrente **sin canibalizar** Premium/B2B.
- Angulo ESG/impacto que fondos LATAM (Platanus impact, Kaszek health) valoran.

### Por que esto importa para CORFO / Start-Up Chile

- **Impacto social medible**: refugios con trazabilidad, adopciones documentadas.
- **Ecosistema pet-tech chileno**: Paw Companys articula empresas chilenas con causas animales.
- **Generacion de empleo**: roadmap incluye 3-5 contrataciones en 12 meses.
- **Exportabilidad**: stack Capacitor + Supabase permite piloto LATAM con infra ya construida.

---

## 14. Riesgos y mitigaciones

| Riesgo | Mitigacion |
|---|---|
| QVET despliega comercial en Chile | Ganar vet chico antes 18m + Paw Companys como moat local |
| Petsy agrega ficha PDF | Directorio SEO + B2B SaaS + Paw Companys son moats distintos |
| Fundador solo | Co-founder en pipeline, cierre como condicion del angel |
| Mercado chico Chile | Plan LATAM expansion mes 7+ |
| Baja frecuencia B2C | Recordatorios + reportes semanales + Premium vinculado a salud real |
| Donaciones dependen de goodwill | Paw Companys (recurrente) > donaciones (one-shot) |
| Dependencia de IA (Claude) | Modelo portable (OpenAI, Gemini), prompts versionados |
| Dependencia de Flow.cl | Webpay como alternativa en roadmap post-seed |

---

## 15. Apendices

### A. Documentos de referencia

| Doc | Contenido |
|---|---|
| [../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md](../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md) | Desglose por area de horas founder vs equipo expertos |
| [../CLAUDE.md](../CLAUDE.md) | Manual operativo tecnico (fuente de verdad del stack) |
| [../MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) | Mapa de modulos, archivos, flujos |
| [../docs-raiz/pitch/PITCH_DECK.md](../docs-raiz/pitch/PITCH_DECK.md) | Deck narrativo 13 slides |
| [../INVENTARIO_APP_2026_04_17.md](../INVENTARIO_APP_2026_04_17.md) | Inventario de features funcionales |
| [../docs-raiz/pitch/CONSOLIDADO_2026_04_18.md](../docs-raiz/pitch/CONSOLIDADO_2026_04_18.md) | Snapshot tecnico verificado |
| [../audits/COMPETENCIA_2026_04_08.md](../audits/COMPETENCIA_2026_04_08.md) | 13 fichas completas de competidores |
| [../sales/PITCH_VET_CORTO.md](../sales/PITCH_VET_CORTO.md) | Pitch comercial B2B para clinicas |

### B. Docs derivados (este folder)

| Doc | Audiencia |
|---|---|
| [PRESENTACION.html](PRESENTACION.html) | Presentacion visual imprimible a PDF |
| [01_CORFO_SSAF-I.md](01_CORFO_SSAF-I.md) | Postulacion CORFO SSAF-I (USD $28K) |
| [02_START_UP_CHILE.md](02_START_UP_CHILE.md) | Postulacion Start-Up Chile Ignite (USD $15K) |
| [03_PAW_COMPANYS_EMPRESAS.md](03_PAW_COMPANYS_EMPRESAS.md) | Pitch B2B2C para empresas sponsors |
| [04_ANGELES_VC_LATAM.md](04_ANGELES_VC_LATAM.md) | Pitch para angels / VC LATAM |

### C. Notas para el founder antes de pitchear

1. **Ensayar en 3 minutos** (pitch corto) y en 10 minutos (deep). Si no cabe en 3, la historia no esta clara.
2. **Llegar con numeros reales, no proyecciones infladas**.
3. **Preparar 10 preguntas incomodas** (ver memoria `project_vc_plan_2026_04_18`).
4. **Tener 3 clinicas pagas reales con nombre y caso** antes del primer pitch con angel.
5. **Actualizar metricas en vivo** desde `/admin?section=sala-inversion` antes de cada meeting.
6. **Mostrar Paw Voices en vivo** — cierre emocional mas fuerte.
7. **No pedir NDA**.
8. **Cerrar con el ask explicito** — nunca quedarse en "y bueno, esto es".
9. **El angulo "home-made Chile + IA"** es el anti-moat-tradicional: ventaja, no debilidad.

---

**Fin del consolidado.**
Actualizar este documento en cada milestone (post-ronda, post-100-clientes, cada 3 meses).
