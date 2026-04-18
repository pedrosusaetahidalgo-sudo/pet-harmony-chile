# Paw Friend — Pitch Deck (Esqueleto)

> Guía de 12 slides para levantar pre-seed con angels LATAM, CORFO SSAF-I y Start-Up Chile.
> Versión vivo 2026-04-18. Mantener sincronizado con datos de `/admin?section=sala-inversion`.
>
> **Convención**:
> - `[DATO]` = reemplazar con métrica real del dashboard al momento del pitch
> - `[RELLENAR]` = requiere decisión o redacción del fundador
> - **Regla de oro**: nunca mostrar métrica inventada. Si es 0, mostrar 0 con contexto ("apenas reactivamos Premium hace X semanas").

---

## Slide 1 — Portada

**Layout**: logo centrado + una sola línea de tagline + nombre fundador + fecha + contacto.

```
                    [LOGO PAW FRIEND]

                        Paw Friend
          La ficha clínica digital de tu mascota,
              conectada con tu veterinario.

                    [Pedro Susaeta — Founder]
            pedro.susaeta.hidalgo@gmail.com · pawfriend.cl
                     Abril 2026 · Santiago, Chile
```

**Notas visuales**: fondo blanco, morado brand #9333ea como único acento. Sin stock photos.

---

## Slide 2 — El problema

**Principio**: un problema = una frase. Evidencia en máximo 3 puntos.

**Título**: *La ficha clínica de tu mascota hoy vive en WhatsApp.*

Bullets:
- **Para el dueño**: 70% de los hogares chilenos tiene mascota, pero el historial médico está en pantallazos, carnets físicos y grupos de WhatsApp. Cuando cambia de vet, empieza de cero.
- **Para el vet chico/clínica independiente**: opera con agenda en papel, recordatorios manuales y pagos en efectivo. Software como QVET/VetPraxis no publica precio y está diseñado para clínicas grandes.
- **Resultado**: vacunas se olvidan, consultas se repiten, conversión a vet premium se pierde.

**Evidencia real**:
- Cita literal de Paloma (beta tester iPhone, 2 mascotas): *"Pepa fue vacunada hace 6 meses y no sé si es hora de la próxima. El carnet está en la guantera del auto."*
- Cita de Sofía (veterinaria beta tester): *"Yo tomo notas en Word y mando por WhatsApp. Me gustaría que quedara en un solo lugar."*

---

## Slide 3 — Solución

**Título**: *Una ficha médica digital que el dueño puede descargar y el vet puede actualizar.*

**3 componentes visibles**:
1. **Ficha clínica digital + PDF descargable** (joya de la corona).
2. **Directorio público de vets con precio por comuna** (único en Chile).
3. **Agenda + recordatorios + reseñas** end-to-end, integrando dueño y clínica.

**Demo en 30 segundos** (hero visual — screenshot real):
- Pantalla 1: ficha clínica con vacunas + cronología de consultas.
- Pantalla 2: botón "Descargar PDF" → PDF con marca Paw Friend.
- Pantalla 3: perfil público de un vet en `/veterinarios/[slug]`.

**Diferenciadores defendibles**:
- **Vertical B2C + B2B integrado** — nadie más cruza ficha dueño + directorio + reservas + SaaS clínica.
- **Pricing CLP transparente** vs QVET/VetPraxis (sin precio público, onboarding comercial largo).
- **Onboarding vet < 5 minutos** con OCR de carnet — el vet chico no se siente pidiendo "software".

---

## Slide 4 — Por qué ahora

**Título**: *El mercado pet chileno está digitalizando 10 años tarde — y hay ventana de 12 meses.*

- **Tenencia de mascotas Chile**: ~70% hogares. Mercado pet ~USD 1B+/año. Digitalización < 15%.
- **Regulación**: Ley 21.020 de tenencia responsable exige registro RUP; Paw Friend integra QR de mascota.
- **Capacitor + Supabase + Flow.cl**: stack permite MVP con costos variables bajo USD $100/mes.
- **Competencia congelada**: QVET (español, sin comercial local), Petsy (B2C, sin directorio SEO), CuidaPet (vertical), VetPraxis (LATAM B2B sin B2C).
- **Comportamiento post-pandemia**: dueño busca información online antes de ir al vet (reseñas, precios, especialidad).
- **Ventana crítica**: 12-18 meses antes de que un incumbente regional (Petlove Brasil o QVET LATAM) empuje comercialmente en Chile.

---

## Slide 5 — Mercado

**Título**: *TAM Chile + LATAM Andino en 3 cajas — sin optimismo.*

| Nivel | Definición | Tamaño | Supuestos |
|---|---|---|---|
| **TAM** | Hogares con mascota × gasto digital anual (Chile + LATAM Andino) | USD **~2.5B**/año | 20M hogares pet × USD $125/año digital |
| **SAM** | Digital-native + ticket SaaS pet (Chile + Perú + Colombia) | USD **~120M**/año | 5% del TAM |
| **SOM 3 años** | Cuota alcanzable solo con outreach orgánico + CORFO | USD **~3-4M ARR** | 5-6% del SAM Chile + piloto regional |

**Caja Chile solo**:
- 4M hogares con mascota × USD $40/año digital = TAM Chile USD **~160M**.
- SAM Chile: ~1.500 clínicas chicas pagables + ~500K dueños digital-native = USD **~25-35M**/año.
- **SOM 3 años Chile**: USD **~1.5M ARR** = techo si no expandimos.

**Implicancia para VC**: Chile solo no es venture-scale. LATAM Andino sí lo vuelve defendible para una Seed Series.

---

## Slide 6 — Producto

**Título**: *Lo que hoy funciona en pawfriend.cl*

**Hero visual**: mockup 3 pantallas lado a lado (ficha, directorio, admin vet).

**Core B2C** (ya en prod):
- Ficha clínica digital con vacunas, consultas, vacunas por especie, Feline Grimace Scale.
- PDF descargable + ZIP documentos + compartir con token 30 días.
- OCR carnet de vacunación (IA).
- Recordatorios cronológicos + calendario unificado.
- Directorio público de vets (SEO por comuna + especialidad).

**Core B2B** (ya en prod):
- Dashboard vet: pacientes, reservas, agenda, audit trail.
- Plantillas post-consulta + transcripción audio.
- Preview "como me ven los dueños" (diferenciador único).
- Reportes semanales + analytics.

**Stack**: React + Vite + Supabase + Capacitor (Android + iOS) + Flow.cl. 502+ archivos fuente, 156 migraciones, 176 tests verdes, PostHog + Sentry, trigger de monitoreo automatizado.

**Callout pequeño**: "Todo lo que ven ya existe en `pawfriend.cl`. No es un prototipo."

---

## Slide 7 — Tracción

**Título**: *Tracción actual y velocidad*

> **Regla**: números exactos del dashboard al momento del pitch, nunca "aprox".

**Métricas (actualizar desde `/admin?section=sala-inversion` el día del pitch)**:

| Métrica | Hoy | Meta 90d | Meta 12m |
|---|---|---|---|
| Usuarios totales | `[DATO]` | 2.000 | 15.000 |
| MAU | `[DATO]` | 500 | 5.000 |
| Premium B2C activos | `[DATO]` | 100 | 800 |
| Clínicas B2B pagando | `[DATO]` | 20 | 150 |
| MRR (CLP) | `[DATO]` | $1.9M | $15M |
| ARR run-rate (USD) | `[DATO]` | $24K | $190K |
| Retention D30 | `[DATO]` | 30% | 40% |

**Historia qualitativa** (usar si números son bajos):
- Beta tester real vet Sofía → feedback incorporado (vacunas con lote, sección antiparasitarios).
- Beta tester real dueña Paloma → feedback incorporado (nav simplificada, onboarding gamificación).
- Admin panel live con Pulso Diario + auto-fixes sobre datos de usuarios reales en producción.

**Velocidad de desarrollo**:
- 28 edge functions + 156 migraciones en < 6 meses.
- 67 rutas activas, 176 tests pasando.
- Store launch Android/iOS en preparación (SpA SUSAETA GARNHAM constituida 2026-04-17).

---

## Slide 8 — Modelo de negocio

**Título**: *SaaS con dos motores de revenue y un marketplace de reservas.*

**B2C — Premium dueño** (`src/lib/plans.ts`):
- Gratis: 2 mascotas, 3 recordatorios, ficha básica.
- **Premium $3.990 CLP/mes** ($39.900 anual): mascotas ilimitadas, PDF descargable, compartir ficha, reportes semanales IA, sin ads.

**B2B — SaaS vet**:
- Gratis: 15 clientes, directorio público, 2 invitaciones.
- **Individual $9.900 CLP/mes**: 100 clientes, transcripción audio, analytics básico.
- **Clínica Básica $29.900 CLP/mes**: 500 clientes, multi-vet, featured position.
- **Clínica Pro $59.900 CLP/mes**: ilimitado, multi-branch, 0% comisión, API.

**Marketplace booking**: comisión 0-10% según plan vet.

**Unit economics** (estimación post-reactivación, actualizar con datos reales):
- ARPU blended: ~USD $15-20/mes.
- LTV estimado: USD $300-500 (12-24 meses).
- CAC orgánico: USD $15-30 (outreach fundador).
- **Payback**: 2-4 meses. LTV/CAC **>10x**.

**Por qué este pricing**:
- Premium B2C precio "Netflix pet" accesible.
- B2B Individual ataca vets chicos que hoy no pagan PMS.
- Techo alto (Clínica Pro) captura valor de clínicas >5 vets.

---

## Slide 9 — Competencia

**Título**: *Somos los únicos en el cruce B2C + B2B + directorio SEO.*

**Matriz 2×2** (ejes: B2C ↔ B2B | SEO directorio ↔ Sin directorio):

| | Con directorio SEO | Sin directorio SEO |
|---|---|---|
| **B2B only** | Veterinariachile.com (pasivo) | QVET, VetPraxis, GVET, Milovet |
| **B2C only** | — | Petsy, CuidaPet, Duko, Wolkie |
| **B2C + B2B** | **Paw Friend** | — |

**Competidores clave**:

- **QVET** (amenaza alta 18-24m): español, 8.000 clientes declarados, sin comercial local, sin precio público. *Nuestra jugada: ganar vet chico chileno antes de que activen Chile.*
- **Petsy** (overlap B2C 1:1): iOS publicada, marketplace a domicilio. *Nuestro moat: directorio SEO público y plan B2B integrado.*
- **CuidaPet** (vertical): vet a domicilio con precio ($27K consulta). *No compite en ficha ni B2B.*
- **WhatsApp + Instagram** (competidor real, 80% de vets chicos). *Atacamos con "WhatsApp con memoria": onboarding 5 min + recordatorios automáticos.*

**Moats**:
1. Directorio SEO público (`/veterinarios/[comuna]/[slug]`) — nadie más lo tiene B2C.
2. Pricing CLP transparente + onboarding rápido — QVET/VetPraxis no lo hacen.
3. Integración dueño ↔ vet end-to-end (reserva + ficha + reseña) — ni Petsy ni CuidaPet cierran el loop.

---

## Slide 10 — Equipo

**Título**: *Quién lo construye.*

**Founder**:
- **Pedro Susaeta Hidalgo** — Software engineer, dueño de SpA SUSAETA GARNHAM SOFTWARE ENGINEERING (78.328.659-9). Builder del producto completo (frontend, backend, mobile, DevOps). Dueño de perro real (Kai, pastor suizo) — cliente N°1.
- **Foto real + LinkedIn + GitHub**.

**Advisors / mentoring** *(rellenar)*:
- `[RELLENAR: nombre vet advisor clínico]` — Sofía Rosi (si acepta oficializar).
- `[RELLENAR: nombre advisor SaaS LATAM]`.

**Gap honesto + plan de mitigación**:
- Buscando **co-founder comercial/clínico** con equity vested antes del cierre de pre-seed.
- Candidatos en pipeline: `[RELLENAR: 2-3 nombres concretos]`.

**Por qué el fundador es el indicado**:
- 10+ años ingeniería software.
- Dueño de mascota con experiencia real del dolor.
- Única persona en Chile construyendo la intersección B2C+B2B+directorio en stack moderno.
- Construyó producto funcional de Series-A-grade con presupuesto angel.

---

## Slide 11 — Roadmap & plan de crecimiento

**Título**: *Cómo llegamos a USD $500K ARR en 12 meses.*

**Fase 1 (mes 1-3) — Primeras ventas**:
- Reactivar Premium B2C → meta 100 pagos.
- Outreach a 500 vets chilenos → cerrar 20 clínicas pagas.
- Amputar scope Paw Labs (esconder gamificación experimental).
- Cerrar co-founder comercial.

**Fase 2 (mes 4-6) — Consolidación Chile**:
- Escalar a 500 Premium + 60 clínicas.
- Postular CORFO SSAF-I (USD $28K) + Start-Up Chile Ignite (USD $15K).
- Contratar SDR (ventas B2B) + 1 engineer.
- Primer caso de éxito B2B documentado + video.

**Fase 3 (mes 7-12) — Piloto LATAM**:
- Definir país #2 (Perú o Colombia).
- 2.000 Premium + 150 clínicas (Chile) + primer piloto país #2.
- Pre-seed angel LATAM cerrado (USD $100-200K).
- Roadmap Seed para mes 18.

**Hitos cuantitativos**:
- Mes 3: MRR USD $2K.
- Mes 6: MRR USD $8K.
- Mes 12: MRR USD $40K (ARR $500K).
- Mes 18: MRR USD $80K (ARR $1M) → levantar Seed con Platanus/Magma/Kaszek.

---

## Slide 12 — Ask

**Título**: *Lo que pedimos y cómo se usa.*

**Ronda**:
- Instrumento: SAFE o nota convertible (Y Combinator standard).
- **Monto**: USD **$150K** pre-seed.
- **Valuation cap**: USD **$1.2M** post-money.
- **Lead deseado**: `[RELLENAR: angel pet-tech LATAM o Platanus Ventures]`.

**Uso de fondos (12 meses)**:

| Categoría | % | Monto USD | Qué se compra |
|---|---|---|---|
| Co-founder + 1 engineer | 45% | $67K | Salarios 12m |
| SDR ventas B2B | 20% | $30K | Outreach + conversión clínicas |
| Marketing performance B2C | 15% | $22K | Meta Ads + Google Ads + contenido |
| Legal, contabilidad, DPA | 10% | $15K | SpA, DPA Supabase, propiedad intelectual |
| Infraestructura + buffer | 10% | $15K | Supabase Pro, Sentry, PostHog, buffer |

**Hitos con este capital**:
- Mes 6: MRR USD $8K + CORFO aprobado.
- Mes 12: MRR USD $40K + co-founder + piloto LATAM listo.
- Mes 18: Seed readiness (ARR USD $1M).

**Por qué este ticket**:
- Suficiente para 12-14 meses de runway.
- Permite cerrar co-founder comercial con equity + salario mínimo viable.
- No diluye en exceso antes de demostrar tracción.

**Condiciones que estamos dispuestos a negociar**:
- Board observer para el lead.
- Pro-rata en Seed.
- Milestone-based reporting mensual (Sala de Inversión snapshot).

**Contacto**:
- pedro.susaeta.hidalgo@gmail.com · pawfriend.cl
- Calendly: `[RELLENAR link]`

---

## Apéndice (slides 13+, opcional para Q&A)

### A1 — Demo de producto en detalle
- Screenshots de: ficha clínica completa, PDF descargable, directorio de vets, dashboard vet, admin Sala de Inversión.

### A2 — Cohortes de retención
- Tabla 6 meses × 6 cohortes del dashboard `/admin?section=analytics`.

### A3 — Testimonios reales
- Sofía Rosi (vet) + Paloma (dueña) + `[RELLENAR 2-3 más]`.

### A4 — Riesgos y mitigaciones
- QVET despliega comercial → mitigación: ganar vet chico antes 18m.
- Petsy agrega ficha PDF → mitigación: directorio SEO + B2B SaaS son moats distintos.
- Fundador solo → mitigación: co-founder en pipeline, cierre como condición del angel.
- Mercado chico Chile → mitigación: plan LATAM expansion mes 6.
- Baja frecuencia B2C → mitigación: recordatorios + reportes semanales + Premium vinculado a salud real.

### A5 — Unit economics detallado
- Cálculo ARPU/LTV/CAC/payback por segmento con data real del dashboard.

### A6 — Competencia expandida
- Ver [audits/COMPETENCIA_2026_04_08.md](audits/COMPETENCIA_2026_04_08.md) — 13 fichas completas.

---

## Notas para el fundador antes de pitchear

1. **Ensayar en 3 minutos** (pitch corto) y en 10 minutos (deep). Si no cabe en 3, la historia no está clara.
2. **Llegar con números reales, no proyecciones infladas**. Un MRR real de USD $500 > un proyectado de USD $50K.
3. **Preparar las 10 preguntas incómodas** (ver `memory/project_vc_plan_2026_04_18.md` sección FASE 6).
4. **Tener 3 clínicas pagas reales con nombre y caso** antes del primer pitch con angel.
5. **Actualizar métricas del slide 7 en vivo** desde `/admin?section=sala-inversion` antes de cada meeting.
6. **No pedir NDA**. Nadie firma antes de decidir si les interesa.
7. **Cerrar el deck con el ask explícito** — nunca quedarse en "y bueno, esto es".

---

**Siguiente paso**: diseñar el deck visual (Keynote/Figma/Pitch.com) con estos contenidos. Mantener 1 idea por slide. Paleta morada brand + blanco + gold accent Paw Friend.
