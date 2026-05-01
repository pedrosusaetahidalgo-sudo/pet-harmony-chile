# Paw Friend — Consolidado para inversionistas

> **Fuente de verdad unica** para pitches, data rooms, postulaciones a fondos publicos
> y reuniones con empresas interesadas en sponsor.
>
> Ultima revision: **2026-04-29** (modelo v2.1 — Plan v5 Opcion 3).
> Responsable: Paw Founder · pedrosusaeta@pawfriend.cl
>
> **⚠️ Modelo v2.1 vigente desde 2026-04-29** (Plan v5 Opcion 3). Ver [`docs-raiz/pitch/MODELO_V2_2026_04_22.md`](../docs-raiz/pitch/MODELO_V2_2026_04_22.md)
> con el addendum 2026-04-29 para el documento canonico. Cambios clave vs v1:
> - **Freemium B2C 3 tiers**: Free $0 (lo esencial) · Paw Member $3.990/mes · Manada $9.990/mes (suma aporte $2K/mes a refugios). Sin COGS externo en consumer (margen ~99% Paw Member). 🔮 Paw Shield (biometría Petify) en roadmap futuro · activable solo con financiamiento B2B.
> - **B2B de acceso a la ficha en pharma + seguros + retail** sigue siendo el motor de escala (grueso del ARR a 50k MAU).
> - **Vet = canal de adquisicion**, no revenue center (planes Clinica escondidos).
> - **Donaciones → Paw Support / Manada** (reframe legal Ley 19.885: Paw Friend SpA es quien dona, no el usuario).

---

## Indice

1. [La narrativa emocional](#1-la-narrativa-emocional)
2. [El problema](#2-el-problema)
3. [La solucion](#3-la-solucion)
4. [Producto en vivo (2026-04-19)](#4-producto-en-vivo)
5. [Traccion y signals unicos](#5-traccion-y-signals-unicos)
6. [Modelo de negocio (modelo v2)](#6-modelo-de-negocio-modelo-v2-post-pivot-2026-04-22)
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

**Fundador**: Paw Founder — 10+ años como ingeniero de software, dueño real de **Kai** (perro, pastor suizo, cliente N°1) y **Ema** (gata, cliente N°2). Construyó Paw Friend en **2 meses** con Claude Code como copiloto, desde Chile, sin capital externo. **Founder solo · sin co-founder firmado · sin advisors con contrato · sin equipo contratado.**

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

- Tenencia de mascotas Chile: ~74% hogares — *CADEM Plaza Pública 2023-2024 (estudios de tenencia, citados ampliamente en prensa).*
- Mercado pet Chile: crecimiento sostenido — *Euromonitor pet care Chile reporta crecimiento del sector (cifra absoluta en USD requiere licencia Euromonitor; "USD 1B+" usado historicamente es estimacion sin fuente publica auditable).*
- Digitalizacion: **mayoria de vets/clinicas aun en papel y planilla** — no existe sistema digital nacional homologado para mascotas.
- Ley 21.020 de tenencia responsable exige registro RUP — *BCN, vigente desde 2017.*

---

## 3. La solucion

**Una ficha medica digital que el dueno descarga, el vet actualiza y la comunidad apoya.**

### 4 componentes integrados

1. **Ficha clinica + PDF descargable** (la joya). Vacunas, consultas, Feline Grimace Scale, compartir con token 30 dias, OCR de carnet.
2. **Directorio publico de vets** con pricing CLP transparente por comuna y especialidad. SEO optimizado. Unico en Chile.
3. **Agenda + recordatorios + resenas** end-to-end. Cierra el loop dueno ↔ clinica.
4. **Paw Voices + Paw Support trazables**. Muralla publica de mensajes reales, aportes via Flow, dashboard de transparencia, Paw Companys con badge empresarial.

### Diferenciadores defendibles

- **Vertical B2C + B2B + comunidad integrada** — nadie mas cruza los 4 ejes.
- **Pricing CLP transparente** vs QVET/VetPraxis.
- **Onboarding vet <5 minutos** con OCR de carnet.
- **Costo operativo actual ~USD $2k/mes** (Supabase Pro + APIs IA) — runway largo con poco capital.

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
- `/paw-support` (ex-`/donaciones`) publico con Paw Voices y Paw Companys
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
- Monitoreo de Paw Support y feedback ratings en tiempo real
- CRM de leads veterinarios + outreach automatizado

### Stack tecnico

React 18 + Vite + TypeScript + Tailwind + Supabase (Postgres + Edge Functions + Storage + Auth) + Capacitor 7 (iOS + Android) + Flow.cl + PostHog + Sentry + Google Calendar OAuth + WhatsApp Cloud + Anthropic Claude.

---

## 5. Traccion y signals unicos

> **Regla**: en cada pitch, actualizar numeros desde `/admin?section=sala-inversion`. Nunca "aprox".

### Metricas vivas (plantilla)

| Metrica | Hoy | Meta 90d | Meta 12m |
|---|---|---|---|
| Usuarios totales | `[DATO]` | 2.000 | 20.000 |
| MAU | `[DATO]` | 1.000 | 15.000 |
| Vets activos creando fichas | `[DATO]` | 50 | 300 |
| Fichas con OCR completado | `[DATO]` | 30% | 60% |
| Pacientes con >=10 eventos timeline | `[DATO]` | 100 | 3.000 |
| Research consent opt-in % | `[DATO]` | 25% | 40% |
| Paw Companys activos | `[DATO]` | 3 | 12 |
| Pharma deals piloto | 0 | 0 | 1-3 |
| ARR run-rate pilotos (USD) | `[DATO]` | $0 | $100-300K |
| Paw Support total (CLP) | `[DATO]` | $500K | $5M |
| Aportantes unicos | `[DATO]` | 50 | 500 |
| Rating app | `[DATO]`/5 | 4.3/5 | 4.5/5 |
| Retention D30 | `[DATO]` | 35% | 50% |

### Signals unicos (no los tiene ningun competidor)

1. **Research consent opt-in rate** — porcentaje de duenos que aceptan compartir
   data agregada anonima para research. Leading indicator del moat pharma:
   sin consent, no hay deals.
2. **Pacientes con ficha completa** (>=10 eventos timeline) — proxy de "ficha
   longitudinal valiosa" que pharma/seguros pagaran por acceder.
3. **Techo emocional medido** — Paw Support voluntario mide cuantos duenos
   aportan sin contraparte directa. Proxy NPS monetizable.
4. **Feedback iterativo real** — Sofia (vet) y Paloma (duena) probaron en iPhone
   y Android, cada ajuste documentado en commits reales.

---

## 6. Modelo de negocio (modelo v2 post-pivot 2026-04-22)

> **Tesis core**: *El activo no es la app — es la ficha clinica longitudinal.
> Paw Friend no le cobra al vet ni al dueno por construirla. Le cobra a pharma,
> seguros y retail por acceso a esa cohorte con consent ARCO.*

**Principio guia**: *Producto invisible.* El dueno promedio chileno abre la app
4 veces al ano. Si disenamos para power users, perdemos al 90% del mercado.
**El dueno paga solo si quiere features avanzadas** (freemium 3 tiers; el plan
Free cubre lo esencial para siempre) → no se va → la ficha se enriquece sola →
pharma/seguros/retail pagan por acceso a escala. Loop coherente.

### Pilares ancla (80% del revenue **target**)

> Todos los tickets son **rangos del founder bajo modelo F7**, no contratos firmados. Pre-launch hoy (Junio 2026), 0 deals pagadores. Tickets se ajustan al cierre de cada negociacion real.

| # | Pilar | Quien paga | Modelo | Ticket anual (target) | Activacion |
|---|---|---|---|---|---|
| 1 | **Pharma animal** | Centrovet (Agrosuper), Virbac, Zoetis, MSD, Elanco, Boehringer | Sponsored reminders + data deals agregados + contenido educacional | rango propuesto USD $20-500K / brand · negociable | Mes 4-6 post-seed |
| 2 | **Seguros pet** | Sura, BCI, Mapfre, Consorcio, emergentes | Afiliado sobre prima + white-label ficha + canal de claims | a escala USD $500K-1M target · % se negocia | Mes 6-9 |
| 3 | **Retail pet** | Master Dog (Agrosuper), Falabella Pet, Puppis, Agrogarden | Afiliado + suscripcion alimento integrada + ads contextuales | rango propuesto USD $50-200 / usuario activo-ano | Mes 8-12 |

### Pilares soporte (estabilizan + dan narrativa)

| # | Pilar | Quien paga | Modelo | Ticket | Estado |
|---|---|---|---|---|---|
| 4 | **Paw Companys** | Empresas pet-friendly + corporates con benefits | Sponsorship badge + SaaS bienestar animal | tiers $49.900 / $99.900 / $199.900 CLP/mes (publicos) | Vivo · 0 firmados publicamente |
| 5 | **Paw Support** (ex-donaciones) | Duenos voluntariamente | Pago voluntario + aporte a refugios trazable | Residual, alto en NPS | Reframe en curso |

### Long-tail (mes 12+, todos rangos del modelo founder)

| # | Pilar | Quien paga | Modelo | Ticket (target) | Timing |
|---|---|---|---|---|---|
| 6 | **Data agregada anonima** | SAG, Minsal, academia (UACh, UNAB), pharma R&D | Licensing con consent opt-in | rango propuesto USD $50-500K / deal | Mes 18+ (con cohort suficiente) |
| 7 | **Gobierno / municipios** | Las Condes, Providencia, Subdere | White-label registro digital Ley 21.020 | rango propuesto USD $10-50K / municipio | Mes 12+ |
| 8 | **Publicidad programatica** | Brands pet + adjacentes | CPM residual | Marginal | Mes 12+ con escala MAU |

### B2C dueno — freemium 3 tiers (Plan v5 Opcion 3)

- **Free ($0, hasta 2 mascotas)**: ficha clinica, recordatorios, calendario, OCR del carnet, Pet ID Card basica, QR, memorial, adoption, directorio vets. Lo esencial gratis para siempre. Conversion target 85%.
- **Paw Member ($3.990/mes, hasta 4 mascotas)**: + Paw Passport PDF + Insights Pro + audio notes IA + reportes >30d + descuentos Paw Partners + badge 💛. Conversion target 13%. Sin COGS externo (margen ~99%). 🔮 Roadmap futuro: Paw Shield (biometría del hocico vía Petify) — pausado hoy, código dormido en repo, reactivable solo si entra un partner B2B que financie el COGS USD 0,75/pet/mes.
- **Manada ($9.990/mes, hasta 5 mascotas)**: + descuentos exclusivos + soporte prioritario + early access + badge 👑 + **$2.000/mes a Fondo Paw Friend Refugios** (Paw Friend SpA es quien dona, no el usuario — evita la Ley 19.885). Conversion target 1-2%.
- A escala el grueso del ARR sigue siendo B2B (pharma + seguros + retail). Freemium B2C es el motor de monetización del dueño con margen ~99% (sin COGS externo en consumer). Si en el futuro reactivamos Paw Shield, su COGS lo cubre el partner B2B que la pida.

### B2B vet — canal de adquisicion, no revenue center

> *El vet no paga por el software porque su valor esta en construir la ficha.
> El activo es la ficha. Quien paga es quien quiere acceder a la mascota a traves
> de ella.*

| Plan | Precio | Visible en pricing publico |
|---|---|---|
| **Basica** | $0 / 5 pacientes | Si — punto de entrada |
| **Premium** | $9.900 CLP/mes | Si — vet freelance/domicilio opcional |
| **Clinica Starter** | $19.900 CLP/mes | NO — "Empresarial — contactanos" |
| **Pro Max** | $29.900 CLP/mes | NO — on demand |

### Unit economics v2 a escala — TARGET MODELADO (50k MAU, mes 18 post-seed)

> Tabla de proyeccion del founder · escenarios base/optimista del modelo F7. Pre-launch hoy. Numeros se calibran trimestralmente con traccion real post-launch.

| Motor | Deals/conversion (asumidos) | ARR target |
|---|---|---|
| Pharma (3 brands) | 3 deals activos asumidos | USD $300-600K |
| Seguros (2 aseguradoras) | 5% conv = 2.500 polizas asumidas | USD $200-500K |
| Retail (2 retailers) | 10% conv activos asumido | USD $250-500K |
| Paw Companys | 20 empresas asumidas | USD $120-240K |
| Paw Support | voluntario | USD $20-50K |
| Long-tail (data/gobierno) | 1-2 deals asumidos | USD $50-200K |
| **Total ARR target** | | **USD $940K - $2.1M** |

vs modelo v1 vet-centrico (techo USD $400-600K ARR) → delta **2-4×** con el mismo
producto, solo reorientando quien paga. *Ningun deal pagador firmado todavia.*

### Por que este modelo gana

- **Dueno gratis sin caps** = retencion alta + ficha enriquecida = activo defendible.
- **Pharma/seguros/retail** = bolsillo profundo, ticket recurrente, B2B con LTV multi-anual.
- **Paw Companys** = aval social + revenue recurrente sin canibalizar nada.
- **Vet gratis** = canal de adquisicion sin friccion comercial (tesis pivot 2026-04-22: vets no son motor de revenue — tienen demanda excedida y estan chatos de vendors).
- **Producto invisible** = onboarding 4 campos + OCR + recordatorios automaticos = el dueno promedio (4 visitas/ano) queda feliz, ficha se enriquece sola.

---

## 7. Mercado y timing

### TAM / SAM / SOM — modelado founder (no oficial)

> Estas cifras absolutas en USD son **estimaciones del founder bajo modelo F7**, no reportes auditados. Se construyen con supuestos publicos y privados a partes iguales:
>
> - Penetracion mascotas hogar: ~74% (CADEM Plaza Pública 2023-2024, estudios de tenencia)
> - Numero de hogares con mascota: estimacion sobre INE Censo 2017 + proyecciones
> - Gasto digital anual por mascota: **supuesto del founder** (no benchmark publicado, Euromonitor pet care Chile reporta crecimiento sostenido pero las cifras absolutas requieren licencia)
>
> Fuentes a confirmar antes de pitch presencial: Euromonitor *Pet Care in Chile* / *Pet Care in Latin America*, Mintel pet sector reports, INE.

| Nivel | Definicion | Tamano TARGET | Supuestos del modelo |
|---|---|---|---|
| **TAM** target | Hogares pet × gasto digital anual (Chile + LATAM Andino) | USD ~2,5B/ano | 20M hogares × USD $125/ano (supuestos founder) |
| **SAM** target | Digital-native + ticket SaaS pet (CL + PE + CO) | USD ~120M/ano | 5% del TAM (supuesto founder) |
| **SOM 3 anos** target | Cuota con outreach organico + CORFO + Paw Companys | USD ~3-4M ARR | 5-6% del SAM Chile + piloto regional |

### Solo Chile — modelado founder (para postulaciones CORFO / Start-Up Chile)

- TAM Chile estimado: 4M hogares × USD $40/ano digital ≈ **USD ~160M** (ambos supuestos del founder).
- SAM Chile estimado: ~1.500 clinicas chicas pagables + ~500K duenos digital-native ≈ **USD ~25-35M**/ano.
- SOM 3 anos Chile solo target: **USD ~1.5M ARR** (techo si no expandimos).

**Implicancia VC**: Chile solo no es venture-scale; LATAM Andino vuelve la oportunidad defendible para Seed.

### Ventana de timing — 12-18 meses

- Stack Capacitor + Supabase + Flow.cl: costo operativo actual ~USD $2k/mes (Supabase Pro + APIs IA + dominios; verificable con facturas).
- IA colaborativa (Claude): founder solo construye producto con presupuesto angel.
- **QVET** (Espana) sin comercial local todavia. *La cifra "8.000 clientes" aparece en su sitio publico — verificar al pitch.*
- **Petsy** overlap B2C pero sin directorio SEO ni B2B (verificable en su sitio).
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
| **Petify** | **Modelo extractivo opuesto**: Basic USD $0.50/pet/mes (registro+verificacion+admin) · Pro USD $0.75/pet/mes (suma lost pet recovery 1:N) · Premium contact-sales (suma QR check-in) — todos cobrados al dueno hasta que se elimine la mascota (~$16.500 CLP/ano Pro tier por 2 mascotas; 30× mascotas refugio = inviable) | **Contraposicionamiento directo**: "dueno nunca paga la base". Modelo B2B de acceso a la ficha captura el 90% que Petify deja en la mesa por friction. **Petify es nuestro proveedor de biometria** (Pro tier $0.75/pet absorbido por revenue B2B + Manada), no competidor primario. Petify ARR techo USD $300K vs Paw Friend USD $940K-2.1M a misma escala (2-7×) |
| **QVET** | Alta 18-24m — entran a Chile | Ganar vet chico chileno antes con onboarding 5 min |
| **Petsy** | Media — overlap B2C | Directorio SEO + plan B2B + Paw Companys |
| **CuidaPet** | Baja — solo vet a domicilio | No compite en ficha ni B2B |
| **WhatsApp + Instagram** | Alta (real) — 80% de vets chicos | "WhatsApp con memoria": onboarding + recordatorios |

### Por que el modelo Petify valida la tesis pero pierde el 90% del mercado

- Petify cobrando $11.000 CLP/año por 2 mascotas **confirma que el dolor existe** (gente paga por ficha digital).
- Pero $0.50-0.75/pet/mes es friction real en Chile. El 90% prefiere WhatsApp gratis.
- Incentivos perversos del modelo Petify:
  - Mas mascotas = mas cobro → castiga a multi-pet owners (40% de hogares pet en Chile tienen >=2 mascotas).
  - "Hasta que se elimine" presiona a borrar fichas para dejar de pagar → choca con memorial.
  - Refugios (10-50 mascotas en rotacion) quedan fuera del modelo.
- Paw Friend captura el 90% que Petify deja afuera + monetiza con B2B de bolsillo profundo.

### 5 Moats

1. **Directorio SEO publico** — `/veterinarios/[comuna]/[slug]`. Nadie mas lo tiene B2C.
2. **Pricing CLP transparente + onboarding rapido**.
3. **Integracion dueno ↔ vet end-to-end** — reserva + ficha + resena.
4. **Paw Companys + Paw Support trazables** — aval social imposible de copiar.
5. **Costos home-made** — producto artesanal + IA. Quema baja = runway largo.

---

## 9. Apalancamiento fundador + IA (estimación propia)

> **En 2 meses un founder solo + Claude Code entrego lo que estimamos que un equipo de 5 expertos coordinados tardaria ~6 meses — o un unico experto top-tier ~2,5 años.** Los ratios son nuestra observación en este proyecto, no benchmarks externos validados.

### Numeros gruesos (estimación)

| | Realidad medida | Estimación equipo de expertos sin IA |
|---|---|---|
| **Horas humanas** | ~320 hrs (estimadas) | ~4.800 hrs (estimadas) |
| **Tiempo calendario** | 2 meses (1 founder solo) | ~6 meses (5 expertos coordinados estimados) |
| **Costo tarifa CL** (USD 150/hr) | ~USD 22.400 | ~USD 720.000 |
| **Costo tarifa US top-tier** (USD 300/hr) | ~USD 22.400 | ~USD 1.440.000 |
| **Apalancamiento tiempo (estimado)** | — | ~15× |
| **Apalancamiento costo (estimado)** | — | ~32× a 65× |

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
- Pivote a Paw Support + Paw Companys como tercer motor.
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

## 11. Roadmap 18 meses (modelo v2)

**Objetivo**: ARR USD $300-500K en mes 12 (pilotos pharma + seguros) → ARR USD $940K-2.1M en mes 18 → Seed readiness.

### Fase 1 — Mes 1-3: Producto invisible + escala MAU

- Lanzar **producto invisible** (home dueno con ficha + recordatorios + urgencia + directorio).
- Onboarding 4 campos + OCR carnet vacunacion empujado post-onboarding.
- Outreach a 500 vets chilenos → **50 vets activos creando fichas (gratis)**.
- Cerrar **3 Paw Companys** (pet shop, alimento, seguro).
- Reframe `/donaciones` → `/paw-support` + dashboard de transparencia.
- Mover Paw Labs a `/explorar` (opt-in escondido).
- Cerrar co-founder comercial/clinico.

### Fase 2 — Mes 4-6: Primer piloto Pharma

- **5.000 MAU + 150 vets activos + 5 Paw Companys**.
- Primer contacto **Centrovet (Agrosuper)** o **Virbac Chile** → MVP sponsored reminder.
- Postular **CORFO SSAF-I** (USD $28K) + **Start-Up Chile Ignite** (USD $15K).
- Contratar 1 engineer + 1 BD (pharma/seguros).
- **Primer deal pharma firmado**: USD $20-50K piloto 6 meses.
- Caso de exito B2B documentado (video + metricas vet beta).

### Fase 3 — Mes 7-12: Pharma escala + piloto Seguros

- **15.000 MAU + 300 vets activos + 10 Paw Companys**.
- 2-3 brands pharma activos = USD $100-300K ARR.
- Primer contacto **Sura Pet** + **BCI Seguros** → MVP afiliado poliza.
- Pre-seed angel LATAM cerrado (USD $150-300K).
- Roadmap Seed mes 18-24.

### Fase 4 — Mes 13-18: Seguros consolidado + piloto Retail (PROYECCION)

- **MAU target: 20.000 (cons.) / 50.000 (opt.) · Vets activos: 350 · Paw Companys: 12-20**.
- 1-2 aseguradoras activas = USD $80-300K ARR aseguradoras.
- Primer contacto **Master Dog (Agrosuper)** + **Falabella Pet** → MVP afiliado retail.
- Long-tail: primer deal data agregada con academia (UACh/UNAB).

### Hitos cuantitativos (PROYECCION · modelo v2 · 2 escenarios)

> **Pre-launch (hoy)**: 0 usuarios publicos · 0 deals firmados · 0 MRR.
> Toda la tabla es modelado conservador (col Cons.) y optimista (col Opt.).

| Mes | MAU Cons. | MAU Opt. | Vets activos | Pharma deals | Seguros conv | ARR Cons. (USD) | ARR Opt. (USD) | Paw Companys |
|---|---|---|---|---|---|---|---|---|
| 3 | 500 | 1.500 | 30 | 0 | 0 | $0 | $0 | 1-3 |
| 6 | 2.000 | 5.000 | 80 | 0-1 piloto | 0 | $0-20K | $20-50K | 3-5 |
| 12 | 8.000 | 15.000 | 200 | 1-2 | 0-1 piloto | **$120K** | **$420K** | 6-10 |
| 18 | 20.000 | 50.000 | 350 | 2-3 | 1-2 | $300-500K | $940K-2.1M | 12-20 |

> **Y1 ARR realista** (mes 12) en banda **$120K conservador / $420K optimista** modelado.
> El rango asume 1 deal pharma piloto + 1 aseguradora afiliado + 1-2 retail affiliate firmados.
> Si ningun B2B firma Y1, el revenue cae a freemium B2C (Paw Member / Manada) que requiere
> volumen de MAU que no se garantiza founder-solo.

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

- Base: output de 2 meses ≈ USD $720K-1,44M en valor de mercado estimado (ver [APALANCAMIENTO_FUNDADOR_IA.md](../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md)).
- Conservador: pre-money USD 600-900K.
- Con traccion inicial (20 B2B + 100 Premium): techo USD 1M+ defendible frente a fondos US.

---

## 13. Impacto y transparencia

### Principio operativo

Paw Friend es un proyecto chico. Costo operativo actual **~USD $2k/mes** (Supabase Pro + APIs IA). Cualquier excedente de Paw Support y sponsorship se destina a refugios y campanas de callejeros → adopciones.

### Flujo de trazabilidad

1. Donacion via Flow (dueno) o sponsorship recurrente (Paw Company).
2. Admin en `/admin?section=content&sub=feedback&tab=donaciones` (key DB interna) muestra cada aporte.
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
| Paw Support depende de goodwill | Paw Companys (recurrente) + pharma deals (B2B fijo) > Paw Support (one-shot) |
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
