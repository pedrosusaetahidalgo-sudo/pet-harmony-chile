# Paw Friend — Pitch Deck (Esqueleto)

> Guia de 13 slides para levantar pre-seed con angels LATAM, CORFO SSAF-I, Start-Up Chile
> y sponsors empresariales (Paw Companys). Version viva 2026-04-18.
> Mantener sincronizado con `/admin?section=sala-inversion` y `/admin?section=content&sub=feedback`.
>
> **Convencion**:
> - `[DATO]` = reemplazar con metrica real del dashboard al momento del pitch
> - `[RELLENAR]` = requiere decision o redaccion del fundador
> - **Regla de oro**: nunca mostrar metrica inventada. Si es 0, mostrar 0 con contexto
>   ("apenas reactivamos Premium hace X semanas" / "el flujo de donaciones se activo el 2026-04-18").
> - **Regla home-made**: Paw Friend es un producto artesanal chileno construido por una persona
>   con IA de Claude. No esconder esa historia — es el angulo emocional y el moat de costos.

---

## Slide 1 — Portada

**Layout**: logo centrado + tagline + subtagline + fundador + fecha + contacto.

```
                    [LOGO PAW FRIEND]

                        Paw Friend
          La ficha clinica digital de tu mascota,
              conectada con tu veterinario.

         Hecho en Chile, de pura mano, con IA de Claude.

                      [Paw Founder]
              pedrosusaeta@pawfriend.cl · pawfriend.cl
                     Abril 2026 · Santiago, Chile
```

**Notas visuales**: fondo blanco, morado brand #9333ea como unico acento. Sin stock photos.
La subtagline "Hecho en Chile, de pura mano, con IA de Claude" no se esconde: es lo que
nos hace unicos y defensivos en costos.

---

## Slide 2 — El problema

**Principio**: un problema = una frase. Evidencia en maximo 3 puntos.

**Titulo**: *La ficha clinica de tu mascota hoy vive en WhatsApp.*

Bullets:
- **Para el dueno**: 70% de los hogares chilenos tiene mascota, pero el historial medico
  esta en pantallazos, carnets fisicos y grupos de WhatsApp. Cuando cambia de vet, empieza de cero.
- **Para el vet chico / clinica independiente**: opera con agenda en papel, recordatorios
  manuales y pagos en efectivo. Software como QVET/VetPraxis no publica precio y esta disenado
  para clinicas grandes.
- **Para los refugios y callejeros**: no hay infraestructura digital que conecte donantes
  y causas cercanas. Las donaciones se pierden entre Instagram y transferencias.
- **Resultado**: vacunas se olvidan, consultas se repiten, conversion a vet premium se pierde,
  y los refugios siguen con campanas de WhatsApp.

**Evidencia real**:
- Cita literal de Paloma (beta tester iPhone, 2 mascotas): *"Pepa fue vacunada hace 6 meses
  y no se si es hora de la proxima. El carnet esta en la guantera del auto."*
- Cita de Sofia (veterinaria beta tester): *"Yo tomo notas en Word y mando por WhatsApp.
  Me gustaria que quedara en un solo lugar."*
- Signal cuantitativo: `[DATO willingness-to-pay del widget de feedback, ver slide 7]`.

---

## Slide 3 — Solucion

**Titulo**: *Una ficha medica digital que el dueno puede descargar, el vet puede actualizar,
y la comunidad puede apoyar.*

**4 componentes visibles**:
1. **Ficha clinica digital + PDF descargable** (joya de la corona).
2. **Directorio publico de vets con precio por comuna** (unico en Chile).
3. **Agenda + recordatorios + resenas** end-to-end, integrando dueno y clinica.
4. **Paw Voices + donaciones trazables** — muralla publica de mensajes reales de duenos,
   aportes via Flow hacia callejeros → adopciones → refugios, con dashboard de transparencia.

**Demo en 30 segundos** (hero visual — screenshot real):
- Pantalla 1: ficha clinica con vacunas + cronologia de consultas.
- Pantalla 2: boton "Descargar PDF" → PDF con marca Paw Friend.
- Pantalla 3: perfil publico de un vet en `/veterinarios/[slug]`.
- Pantalla 4: pagina `/donaciones` con Paw Voices, Paw Companys (sponsors empresariales con badge)
  y formulario de aporte voluntario (no subscription).

**Diferenciadores defendibles**:
- **Vertical B2C + B2B + comunidad integrada** — nadie mas cruza ficha dueno + directorio +
  reservas + SaaS clinica + donaciones trazables.
- **Pricing CLP transparente** vs QVET/VetPraxis (sin precio publico, onboarding comercial largo).
- **Onboarding vet < 5 minutos** con OCR de carnet — el vet chico no se siente pidiendo "software".
- **Costos variables bajo USD $100/mes** — producto artesanal hecho por una persona con IA de Claude.

---

## Slide 4 — Por que ahora

**Titulo**: *El mercado pet chileno esta digitalizando 10 anos tarde — y hay ventana de 12 meses.*

- **Tenencia de mascotas Chile**: ~70% hogares. Mercado pet ~USD 1B+/ano. Digitalizacion < 15%.
- **Regulacion**: Ley 21.020 de tenencia responsable exige registro RUP; Paw Friend integra QR.
- **Capacitor + Supabase + Flow.cl**: stack permite MVP con costos variables bajo USD $100/mes.
- **IA colaborativa**: Claude como co-engineer permite a un founder solo construir producto
  Series-A-grade con presupuesto angel.
- **Competencia congelada**: QVET (espanol, sin comercial local), Petsy (B2C, sin directorio SEO),
  CuidaPet (vertical), VetPraxis (LATAM B2B sin B2C).
- **Comportamiento post-pandemia**: dueno busca informacion online antes de ir al vet
  (resenas, precios, especialidad) y quiere apoyar causas locales con trazabilidad.
- **Ventana critica**: 12-18 meses antes de que un incumbente regional (Petlove Brasil o
  QVET LATAM) empuje comercialmente en Chile.

---

## Slide 5 — Mercado

**Titulo**: *TAM Chile + LATAM Andino en 3 cajas — sin optimismo.*

| Nivel | Definicion | Tamano | Supuestos |
|---|---|---|---|
| **TAM** | Hogares con mascota × gasto digital anual (Chile + LATAM Andino) | USD **~2.5B**/ano | 20M hogares pet × USD $125/ano digital |
| **SAM** | Digital-native + ticket SaaS pet (Chile + Peru + Colombia) | USD **~120M**/ano | 5% del TAM |
| **SOM 3 anos** | Cuota alcanzable solo con outreach organico + CORFO + Paw Companys | USD **~3-4M ARR** | 5-6% del SAM Chile + piloto regional |

**Caja Chile solo**:
- 4M hogares con mascota × USD $40/ano digital = TAM Chile USD **~160M**.
- SAM Chile: ~1.500 clinicas chicas pagables + ~500K duenos digital-native = USD **~25-35M**/ano.
- **SOM 3 anos Chile**: USD **~1.5M ARR** = techo si no expandimos.

**Implicancia para VC**: Chile solo no es venture-scale. LATAM Andino si lo vuelve defendible
para una Seed Series.

---

## Slide 6 — Producto

**Titulo**: *Lo que hoy funciona en pawfriend.cl*

**Hero visual**: mockup 4 pantallas lado a lado (ficha, directorio, admin vet, donaciones).

**Core B2C** (ya en prod):
- Ficha clinica digital con vacunas, consultas, vacunas por especie, Feline Grimace Scale.
- PDF descargable + ZIP documentos + compartir con token 30 dias.
- OCR carnet de vacunacion (IA).
- Recordatorios cronologicos + calendario unificado.
- Directorio publico de vets (SEO por comuna + especialidad).
- `/donaciones` publico con Paw Voices (muralla mensajes) y Paw Companys (sponsors con badge).

**Core B2B** (ya en prod):
- Dashboard vet: pacientes, reservas, agenda, audit trail.
- Plantillas post-consulta + transcripcion audio.
- Preview "como me ven los duenos" (diferenciador unico).
- Reportes semanales + analytics.

**Core Admin** (ya en prod):
- Sala de Inversion en vivo (este deck nace de ahi).
- Pulso Diario + auto-fixers + health score edge functions.
- Monitoreo de donaciones y feedback ratings en tiempo real.

**Stack**: React + Vite + Supabase + Capacitor (Android + iOS) + Flow.cl. 502+ archivos fuente,
156 migraciones, 334 tests verdes (2026-04-18), PostHog + Sentry, trigger de monitoreo automatizado.

**Callout pequeno**: "Todo lo que ven ya existe en `pawfriend.cl`. No es un prototipo."

---

## Slide 7 — Traccion

**Titulo**: *Traccion actual, voluntad de pago y velocidad.*

> **Regla**: numeros exactos del dashboard al momento del pitch, nunca "aprox".

**Metricas (actualizar desde `/admin?section=sala-inversion` el dia del pitch)**:

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
| **Paw Support total (CLP)** | `[DATO]` | $500K | $5M |
| **Aportantes unicos** | `[DATO]` | 50 | 500 |
| **Rating app (feedback)** | `[DATO]`/5 | 4.3/5 | 4.5/5 |
| Retention D30 | `[DATO]` | 35% | 50% |

**Signal de mercado unico**:
- **Research consent opt-in rate** (nuevo §7.3): porcentaje de duenos que aceptan
  compartir data agregada anonima para research. Es leading indicator del moat
  pharma — sin consent, no hay deals.
- **Pacientes con ficha completa** (>=10 eventos en timeline): proxy de "ficha
  longitudinal valiosa" que pharma/seguros pagaran por acceder.
- El flujo de Paw Support mide el techo emocional: cuantos duenos, sin contraparte
  directa, aportan por la causa Paw Friend. Es proxy NPS monetizable.

**Historia qualitativa** (usar si numeros son bajos):
- Beta tester real vet Sofia → feedback incorporado (vacunas con lote, seccion antiparasitarios).
- Beta tester real duena Paloma → feedback incorporado (nav simplificada, onboarding gamificacion).
- Admin panel live con Pulso Diario + auto-fixes sobre datos de usuarios reales en produccion.

**Velocidad de desarrollo**:
- 28 edge functions + 156 migraciones en < 6 meses.
- 67 rutas activas, 334 tests pasando.
- Store launch Android/iOS en preparacion (SpA SUSAETA GARNHAM constituida 2026-04-17).

---

## Slide 8 — Modelo de negocio (v2 post-Roberto Camhi 2026-04-22)

**Titulo**: *El dueno nunca paga. Pharma, seguros y retail pagan por acceso a la ficha.*

> **Paralelismo Mapcity**: *Mapcity no le cobraba a cada tienda chilena por
> georreferenciar — le cobraba a Equifax, bancos e inmobiliarias por acceso a la
> data. Paw Friend no le cobra al vet ni al dueno — le cobra a pharma, seguros
> y retail por acceso a la ficha clinica longitudinal.*

**Principio guia**: *Producto invisible.* Si el producto es invisible, el dueno
no se va. Si no se va, la ficha se enriquece sola (OCR + vet + IA + recordatorios).
Si la ficha se enriquece, pharma/seguros/retail pagan por acceso. Si ellos pagan,
el dueno **nunca** paga. Loop coherente.

### Pilares ancla (80% del revenue proyectado)

| # | Pilar | Quien paga | Modelo | Ticket anual | Activacion |
|---|---|---|---|---|---|
| 1 | **Pharma animal** | Centrovet (Agrosuper), Virbac, Zoetis, MSD, Elanco, Boehringer | Sponsored reminders + data deals agregados + contenido educacional | USD $20-500K / brand | Mes 4-6 post-seed |
| 2 | **Seguros pet** | Sura, BCI, Mapfre, Consorcio, emergentes | Afiliado 10-20% sobre prima + white-label ficha + canal de claims | USD $500K-1M a escala (5% conv sobre 50k MAU) | Mes 6-9 |
| 3 | **Retail pet** | Master Dog (Agrosuper), Falabella Pet, Puppis | Afiliado 3-10% + suscripcion alimento + ads contextuales | USD $50-200 / usuario activo-ano | Mes 8-12 |

### Pilares soporte (estabilizan + dan narrativa)

| # | Pilar | Quien paga | Modelo | Ticket | Estado |
|---|---|---|---|---|---|
| 4 | **Paw Companys** | Empresas pet-friendly + corporates con benefits | Sponsorship badge + SaaS bienestar animal ($1-3 USD/empleado/mes) | USD $600-1.8K/mes/corporate | Vivo |
| 5 | **Paw Support** (ex-donaciones) | Duenos voluntariamente | Pago voluntario + aporte a refugios trazable | Residual, alto en NPS | Reframe en curso |

### B2C dueno — gratis sin caps

- **Cero features de pago**. Mascotas ilimitadas, PDF descargable, ficha compartida,
  recordatorios, calendario, OCR, asistente IA — todo gratis para siempre.
- **Paw Member ($3.990/mes opcional)**: badge cosmetico + acceso a descuentos de Paw Partners.
  No desbloquea features funcionales. No es revenue core (proxy NPS).
- Feature flag `USER_PREMIUM=false` confirma: no hay paywall B2C activo.

### B2B vet — canal de adquisicion, no revenue center

> *El vet no paga por el software porque su valor esta en construir la ficha.
> El activo es la ficha. Quien paga es quien quiere acceder a la mascota a traves
> de ella.*

- **Plan Basica ($0)**: vet individual, 5 pacientes. Punto de entrada.
- **Plan Premium ($9.900/mes)**: vet freelance/domicilio, opcional. Ingreso residual.
- **Plan Clinica/Pro Max**: **escondidos del pricing publico**. On demand via "Empresarial — contactanos".

### Long-tail (mes 12-18+)

- **Data agregada anonimizada**: SAG, Minsal, academia (UACh, UNAB), pharma R&D. USD $50-500K/deal.
- **Gobierno/municipios**: Las Condes, Providencia, Subdere — white-label registro digital Ley 21.020. USD $10-50K/municipio.
- **Publicidad programatica**: residual con escala MAU.

### Unit economics v2 a escala (50k MAU, mes 18 post-seed)

| Motor | Deals/conversion | ARR estimado |
|---|---|---|
| Pharma (3 brands) | 3 deals activos | USD $300-600K |
| Seguros (2 aseguradoras) | 5% conv = 2.500 polizas | USD $200-500K |
| Retail (2 retailers) | 10% conv activos | USD $250-500K |
| Paw Companys | 20 empresas | USD $120-240K |
| Paw Support | voluntario | USD $20-50K |
| Long-tail (data/gobierno) | 1-2 deals | USD $50-200K |
| **Total ARR proyectado** | | **USD $940K - $2.1M** |

vs modelo v1 vet-centrico (techo USD $400-600K ARR) → delta **2-4×** con el mismo
producto, solo reorientando quien paga.

**Por que este modelo gana**:
- Dueno gratis sin caps = retencion alta + ficha enriquecida = activo defendible.
- Pharma/seguros/retail = bolsillo profundo, ticket recurrente, B2B con LTV multi-anual.
- Paw Companys = aval social + revenue recurrente sin canibalizar nada.
- Vet gratis = canal de adquisicion sin friccion comercial.

---

## Slide 9 — Competencia

**Titulo**: *Somos los unicos en el cruce B2C + B2B + directorio SEO + comunidad transparente.*

**Matriz 2×2** (ejes: B2C ↔ B2B | SEO directorio ↔ Sin directorio):

| | Con directorio SEO | Sin directorio SEO |
|---|---|---|
| **B2B only** | Veterinariachile.com (pasivo) | QVET, VetPraxis, GVET, Milovet |
| **B2C only** | — | Petsy, CuidaPet, Duko, Wolkie |
| **B2C + B2B + Comunidad** | **Paw Friend** | — |

**Competidores clave**:

- **Petify** (modelo extractivo opuesto): cobra **USD 0.50/mascota/mes hasta que la elimines**.
  Para 2 mascotas = ~$11.000 CLP/año. Para refugios con 30 mascotas = inviable. Incentivo
  perverso: borrar fichas para dejar de pagar (rompe memorial + historial). Nuestra jugada:
  contraposicionamiento directo — *"Mientras Petify te cobra por cada mascota, en Paw Friend
  la ficha es gratis para siempre. Pagamos con pharma/seguros/retail (modelo Mapcity), no
  con tu bolsillo."*
- **QVET** (amenaza alta 18-24m): espanol, 8.000 clientes declarados, sin comercial local,
  sin precio publico. *Nuestra jugada: ganar vet chico chileno antes de que activen Chile.*
- **Petsy** (overlap B2C 1:1): iOS publicada, marketplace a domicilio. *Nuestro moat:
  directorio SEO publico + plan B2B integrado + Paw Companys como aval empresarial.*
- **CuidaPet** (vertical): vet a domicilio con precio ($27K consulta). *No compite en ficha ni B2B.*
- **WhatsApp + Instagram** (competidor real, 80% de vets chicos). *Atacamos con "WhatsApp con
  memoria": onboarding 5 min + recordatorios automaticos.*

**Por que el modelo Petify valida nuestra tesis pero deja en la mesa al 90% del mercado**:
- Petify cobrando $11.000 CLP/año por 2 mascotas confirma que el dolor existe (gente paga por ficha digital).
- Pero ese $0.50/mes es friction real en Chile. El 90% del mercado prefiere WhatsApp gratis.
- Paw Friend captura ese 90% con producto gratis + monetiza con B2B de bolsillo profundo (pharma > USD $20-500K/brand).
- **Petify ARR maximo techo realista**: 50k mascotas × $6/año = USD $300K. **Paw Friend modelo v2 a misma escala**: USD $940K-2.1M (2-7×).

**Moats**:
1. **Dueno gratis sin caps para siempre** — ningun competidor con modelo extractivo (Petify) puede igualarlo sin destruir su revenue.
2. Directorio SEO publico (`/veterinarios/[comuna]/[slug]`) — nadie mas lo tiene B2C.
3. Pricing CLP transparente + onboarding rapido — QVET/VetPraxis no lo hacen.
4. Integracion dueno ↔ vet end-to-end (reserva + ficha + resena) — ni Petsy ni CuidaPet cierran el loop.
5. **Paw Companys + Paw Support trazable** — aval social y dashboard de transparencia que ningun competidor ofrece. CSR empresarial como canal de crecimiento.
6. **Costos home-made**: producto artesanal hecho por una persona + IA. Quema baja = runway largo.

---

## Slide 10 — Equipo

**Titulo**: *Quien lo construye.*

**Fundador**:
- **Paw Founder** — Ingeniero de software (10+ años). SpA SUSAETA GARNHAM SOFTWARE
  ENGINEERING (78.328.659-9). Construyó el producto completo (frontend, backend, mobile, DevOps).
  Dueño real de Kai (perro, pastor suizo) y Ema (gata) — clientes N°1 y 2.
- **Perfil privado disponible bajo NDA**.

**Advisors / mentoring** *(rellenar)*:
- `[RELLENAR: nombre vet advisor clinico]` — Sofia Rosi (si acepta oficializar).
- `[RELLENAR: nombre advisor SaaS LATAM]`.

**Co-pilot**:
- **Claude** (Anthropic) como IA co-engineer. Permite ciclos de build + QA de 5-10× mas rapidos
  que un founder solo tradicional. Acreditado en footers publicos ("Con IA de Claude").
- **Evidencia**: ver [APALANCAMIENTO_FUNDADOR_IA.md](APALANCAMIENTO_FUNDADOR_IA.md) — desglose
  por area de ~320 hrs humanas vs ~4.800 hrs equivalentes de un equipo de expertos sin IA
  (apalancamiento 15x en tiempo, 32-65x en costo, USD 720K-1,44M de output de mercado).

**Gap honesto + plan de mitigacion**:
- Buscando **co-founder comercial/clinico** con equity vested antes del cierre de pre-seed.
- Candidatos en pipeline: `[RELLENAR: 2-3 nombres concretos]`.

**Por que el fundador es el indicado**:
- 10+ anos ingenieria software.
- Dueno de mascota con experiencia real del dolor.
- Unica persona en Chile construyendo la interseccion B2C+B2B+directorio+comunidad en stack moderno.
- Construyo producto funcional de Series-A-grade con presupuesto angel y IA como co-engineer.

---

## Slide 11 — Roadmap & plan de crecimiento

**Titulo**: *Como llegamos a USD $500K ARR en 12 meses.*

**Fase 1 (mes 1-3) — Producto invisible + escala MAU**:
- Lanzar producto invisible (home dueno con ficha + recordatorios + urgencia).
- Onboarding 4 campos + OCR carnet vacunacion empujado.
- Outreach a 500 vets chilenos → 50 vets activos creando fichas (gratis).
- Cerrar 3 primeros Paw Companys (pet shop, alimento, seguro) con badge publico.
- Publicar dashboard de transparencia Paw Support.
- Amputar scope Paw Labs (mover a `/explorar` opt-in).
- Cerrar co-founder comercial.

**Fase 2 (mes 4-6) — Primer piloto Pharma**:
- 5.000 MAU + 150 vets activos + 5 Paw Companys.
- Primer contacto Centrovet (Agrosuper) o Virbac Chile → MVP sponsored reminder.
- Postular CORFO SSAF-I (USD $28K) + Start-Up Chile Ignite (USD $15K).
- Contratar 1 engineer + 1 BD (pharma/seguros).
- Primer deal pharma firmado: USD $20-50K piloto 6 meses.

**Fase 3 (mes 7-12) — Pharma escala + piloto Seguros**:
- 15.000 MAU + 300 vets activos + 10 Paw Companys.
- 2-3 brands pharma activos = USD $100-300K ARR.
- Primer contacto Sura Pet + BCI Seguros → MVP afiliado poliza.
- Pre-seed angel LATAM cerrado (USD $150-300K).
- Roadmap Seed mes 18-24.

**Hitos cuantitativos**:
- Mes 3: 1.000 MAU + 50 vets activos + 3 Paw Companys + $500K CLP Paw Support.
- Mes 6: 5.000 MAU + 1 deal pharma + 5 Paw Companys + $2M CLP Paw Support.
- Mes 12: 15.000 MAU + 3 deals pharma + 1 piloto seguros = ARR USD $300-500K + 10 Paw Companys.
- Mes 18: 50.000 MAU + 3 pharma + 2 seguros + 1 retail = ARR USD $940K-2.1M → levantar Seed con Platanus/Magma/Kaszek.

---

## Slide 12 — Ask

**Titulo**: *Lo que pedimos y como se usa.*

**Ronda**:
- Instrumento: SAFE o nota convertible (Y Combinator standard).
- **Monto**: USD **$150K** pre-seed.
- **Valuation cap**: USD **$1.2M** post-money.
- **Lead deseado**: `[RELLENAR: angel pet-tech LATAM o Platanus Ventures]`.

**Uso de fondos (12 meses)**:

| Categoria | % | Monto USD | Que se compra |
|---|---|---|---|
| Co-founder + 1 engineer | 45% | $67K | Salarios 12m |
| SDR ventas B2B + Paw Companys lead | 20% | $30K | Outreach clinicas + cierre empresas pet |
| Marketing performance B2C | 15% | $22K | Meta Ads + Google Ads + contenido |
| Legal, contabilidad, DPA | 10% | $15K | SpA, DPA Supabase, propiedad intelectual |
| Infraestructura + buffer | 10% | $15K | Supabase Pro, Sentry, PostHog, buffer |

**Hitos con este capital**:
- Mes 6: 5.000 MAU + 1 deal pharma piloto + 5 Paw Companys + CORFO aprobado.
- Mes 12: 15.000 MAU + 3 pharma + 1 piloto seguros = ARR USD $300-500K + co-founder cerrado.
- Mes 18: 50.000 MAU + pilotos retail + Seed readiness (ARR USD $940K-2.1M).

**Por que este ticket**:
- Suficiente para 12-14 meses de runway.
- Permite cerrar co-founder comercial con equity + salario minimo viable.
- No diluye en exceso antes de demostrar traccion.

**Condiciones que estamos dispuestos a negociar**:
- Board observer para el lead.
- Pro-rata en Seed.
- Milestone-based reporting mensual (Sala de Inversion snapshot).

**Contacto**:
- pedrosusaeta@pawfriend.cl · pawfriend.cl
- Calendly: `[RELLENAR link]`

---

## Slide 13 — Impacto y transparencia (closing slide opcional)

**Titulo**: *Que hacemos con lo que sobra.*

**Principio operativo**:
- Paw Friend es un proyecto chico hecho por una persona + IA. Costos variables
  bajo USD $100/mes. Cualquier excedente de donaciones y sponsorship se destina a
  refugios y campanas de callejeros → adopciones.

**Flujo de trazabilidad**:
1. Donacion via Flow (dueno) o sponsorship recurrente (Paw Company).
2. Admin `/admin?section=content&sub=feedback&tab=donaciones` muestra cada aporte.
3. Dashboard publico (roadmap mes 3): total recaudado, destinado, pendiente, por causa.
4. Paw Voices: murralla publica de mensajes de duenos que aportaron — aval social real.

**Por que esto importa para el VC**:
- Costos bajos + excedente comunitario = menor quema, mejor NPS, historia de marca
  imposible de copiar por Petsy/QVET.
- Paw Companys genera revenue recurrente **sin canibalizar** Premium/B2B.
- Es el angulo ESG/impacto que los fondos LATAM (Platanus impact, Kaszek health) valoran.

---

## Apendice (slides 14+, opcional para Q&A)

### A1 — Demo de producto en detalle
- Screenshots de: ficha clinica completa, PDF descargable, directorio de vets,
  dashboard vet, admin Sala de Inversion, pagina `/donaciones`.

### A2 — Cohortes de retencion
- Tabla 6 meses × 6 cohortes del dashboard `/admin?section=analytics`.

### A3 — Testimonios reales
- Sofia Rosi (vet) + Paloma (duena) + mensajes publicos de Paw Voices.

### A4 — Riesgos y mitigaciones
- QVET despliega comercial → mitigacion: ganar vet chico antes 18m + Paw Companys como moat local.
- Petsy agrega ficha PDF → mitigacion: directorio SEO + B2B SaaS + Paw Companys son moats distintos.
- Fundador solo → mitigacion: co-founder en pipeline, cierre como condicion del angel.
- Mercado chico Chile → mitigacion: plan LATAM expansion mes 6.
- Baja frecuencia B2C → mitigacion: recordatorios + reportes semanales + Premium vinculado a salud real.
- Donaciones dependen de goodwill → mitigacion: Paw Companys (recurrente) > donaciones (one-shot).

### A5 — Unit economics detallado
- Calculo ARPU/LTV/CAC/payback por segmento con data real del dashboard.
- Breakdown: B2C Premium, B2B Individual, B2B Clinica, Paw Companys, Donaciones.

### A6 — Competencia expandida
- Ver [audits/COMPETENCIA_2026_04_08.md](audits/COMPETENCIA_2026_04_08.md) — 13 fichas completas.

### A7 — Stack tecnico y moat de costos
- Stack explicado para tecnicos del fondo.
- Detalle por que IA de Claude reduce time-to-market sin aumentar riesgo.

---

## Notas para el fundador antes de pitchear

1. **Ensayar en 3 minutos** (pitch corto) y en 10 minutos (deep). Si no cabe en 3, la historia no esta clara.
2. **Llegar con numeros reales, no proyecciones infladas**. Un MRR real de USD $500 > un proyectado de USD $50K.
3. **Preparar las 10 preguntas incomodas** (ver `memory/project_vc_plan_2026_04_18.md` seccion FASE 6).
4. **Tener 3 clinicas pagas reales con nombre y caso** antes del primer pitch con angel.
5. **Actualizar metricas del slide 7 en vivo** desde `/admin?section=sala-inversion` antes de cada meeting.
6. **Mostrar Paw Voices en vivo**: la muralla publica con mensajes reales es el cierre emocional mas fuerte.
7. **No pedir NDA**. Nadie firma antes de decidir si les interesa.
8. **Cerrar el deck con el ask explicito** — nunca quedarse en "y bueno, esto es".
9. **El angulo "home-made Chile + IA"** es el anti-moat-tradicional: explica bajos costos y velocidad.
   Usarlo como ventaja, no esconderlo.

---

**Siguiente paso**: disenar el deck visual (Keynote/Figma/Pitch.com) con estos contenidos.
Mantener 1 idea por slide. Paleta morada brand + blanco + gold accent Paw Friend.
