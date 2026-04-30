# Paw Friend — Postulacion CORFO SSAF-I

> **Fondo**: CORFO Subsidio Semilla de Asignacion Flexible para Emprendimientos Innovadores (SSAF-I).
> **Monto**: hasta USD $28.000 (75% cofinanciamiento).
> **Foco CORFO**: emprendimientos con innovacion, escalabilidad y potencial exportador.
> **Fecha objetivo de postulacion**: mes 4-6 (Q3 2026).
>
> Ultima revision: 2026-04-19.
> Preparado por: Paw Founder.

---

## Resumen ejecutivo (1 parrafo)

Paw Friend es una plataforma chilena que digitaliza la ficha medica de mascotas, conecta a duenos con veterinarios a traves de un directorio publico con pricing transparente, y canaliza aportes trazables hacia refugios. Construida en 2 meses por un ingeniero chileno con asistencia de IA (Claude), alcanza alcance funcional equivalente a USD $720K-$1,44M de desarrollo tradicional. **Modelo v2.1 (Plan v5 Opcion 3, 2026-04-29)**: freemium B2C 3 tiers para dueños (Free $0 / Paw Member $3.990/mes / Manada $9.990/mes con aporte refugios), vet como canal de adquisicion gratuito, y el grueso del revenue a escala viene de **3 pilares ancla B2B** (pharma + seguros + retail) + **2 soporte** (Paw Companys empresas + Paw Support voluntario). Meta ARR USD $300-500K en 12 meses, USD $940K-$2.1M en 18 meses, piloto LATAM en mes 12+.

---

## 1. Identificacion del emprendimiento

| Campo | Valor |
|---|---|
| **Nombre comercial** | Paw Friend |
| **Dominio** | pawfriend.cl |
| **Razon social** | SpA SUSAETA GARNHAM SOFTWARE ENGINEERING |
| **RUT** | 78.328.659-9 |
| **Inicio de actividades SII** | 2026-04-17 |
| **Domicilio comercial** | Luis Pasteur 6111 Dp 201, Vitacura, Santiago |
| **Fundador** | Paw Founder |
| **Email de contacto** | pedrosusaeta@pawfriend.cl |
| **Sector CIIU** | 620 — Actividades de programacion informatica y consultoria |
| **Vertical** | Pet-tech / HealthTech veterinaria |
| **Etapa** | Producto en produccion (MVP+) con beta testers reales |
| **Modelo** | SaaS B2C + B2B + B2B2C + Marketplace |

---

## 2. Innovacion (eje CORFO)

### 2.1. Componente tecnologico innovador

- **Ficha clinica digital con PDF descargable** — primer producto chileno que unifica dueno, vet y mascota en un documento portable con marca profesional.
- **OCR de carnet de vacunacion con IA** (Claude Haiku) — captura automatica de vacunas historicas en 5 segundos, reduciendo barrera de onboarding de 30 min a 1 min.
- **Directorio publico con SEO veterinario por comuna y especialidad** — estructura de URLs `pawfriend.cl/veterinarios/providencia/slug-vet` que captura busqueda organica sin equivalente nacional.
- **Compartir ficha via token temporal** (30 dias) — permite al dueno entregar historial a un vet nuevo sin fricciones legales.
- **Transcripcion de audio post-consulta** — el vet graba la consulta, la IA genera notas clinicas estructuradas.
- **Auditoria automatizada y auto-fixers** — cron diario que detecta inconsistencias en datos de usuarios y las corrige sin intervencion manual (Pulso Diario).

### 2.2. Componente metodologico innovador

- **Desarrollo asistido por IA como metodologia productiva**: un founder unico + Claude como co-engineer produjo en 2 meses lo que un equipo de 5 expertos senior tarda 6 meses (apalancamiento 15× en tiempo, 32-65× en costo). Ver [APALANCAMIENTO_FUNDADOR_IA.md](../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md).
- **Monetizacion hibrida con impacto social integrado**: Paw Companys (empresas sponsors con badge publico) + donaciones voluntarias con dashboard de transparencia. El excedente financia refugios.

### 2.3. Grado de novedad (nacional / regional / mundial)

- **Nacional**: unico en Chile que cruza B2C + B2B + directorio + comunidad con donaciones trazables.
- **Regional (LATAM Andino)**: sin competidor directo con estas 4 dimensiones integradas.
- **Mundial**: inspirado en Pawp/Fuzzy (US) y Barkibu (ES), pero con integracion B2B y directorio publico que ninguno ofrece.

---

## 3. Problema que resuelve

### 3.1. Dueno de mascota

- Carnet medico en papel → vacunas olvidadas.
- No hay recordatorios automaticos confiables.
- Al cambiar de vet, el historial se pierde.
- No sabe que causa apoyar ni como.

### 3.2. Veterinario chico / clinica independiente

- Agenda en papel o Google Calendar sin CRM.
- Recordatorios manuales por WhatsApp.
- PMS tradicionales (QVET, VetPraxis) sin precio publico y disenados para clinicas grandes.
- Sin canal de adquisicion de pacientes digital.

### 3.3. Refugios y callejeros

- Sin infraestructura digital para donaciones trazables.
- Campanas en Instagram sin contabilidad clara.
- Sin aval empresarial escalable.

### 3.4. Evidencia cualitativa (beta testers reales)

- **Paloma** (duena iPhone, 2 mascotas): *"Pepa fue vacunada hace 6 meses y no se si es hora de la proxima. El carnet esta en la guantera del auto."*
- **Sofia Rosi** (veterinaria): *"Yo tomo notas en Word y mando por WhatsApp. Me gustaria que quedara en un solo lugar."*

---

## 4. Modelo de negocio (modelo v2 2026-04-22)

> **Tesis core**: el activo no es la app — es la ficha clinica longitudinal.
> Paw Friend no le cobra al vet ni al dueno por construirla. Le cobra a pharma,
> seguros y retail por acceso a esa cohorte con consent ARCO.

### 4.1. Tres pilares ancla + dos soporte

| # | Pilar | Quien paga | Modelo | Ticket anual | Activacion |
|---|---|---|---|---|---|
| 1 | **Pharma animal** | Centrovet (Agrosuper), Virbac, Zoetis Chile | Sponsored reminders + data deals + contenido | USD $20-500K / brand | Mes 4-6 |
| 2 | **Seguros pet** | Sura, BCI, Mapfre, Consorcio | Afiliado 10-20% + white-label ficha | USD $500K-1M a escala | Mes 6-9 |
| 3 | **Retail pet** | Master Dog (Agrosuper), Falabella Pet, Puppis | Afiliado 3-10% + suscripcion alimento | USD $50-200 / usuario activo-ano | Mes 8-12 |
| 4 | **Paw Companys** | Empresas pet-friendly + corporates | Sponsorship badge + SaaS bienestar animal | USD $600-1.8K/mes/corporate | Vivo |
| 5 | **Paw Support** | Duenos voluntariamente | Pago voluntario (reframe legal Ley 19.885) | Residual, alto NPS | Reframe en curso |

### 4.2. B2C dueno — freemium 3 tiers (Plan v5 Opcion 3, 2026-04-29)

- **Free ($0, 2 mascotas)**: ficha clinica, PDF, ficha compartida, recordatorios,
  calendario, OCR, asistente IA, directorio de vets — lo esencial gratis para siempre.
- **Paw Member ($3.990/mes, 4 mascotas)**: + Paw Passport PDF + Insights Pro + audio
  notes IA + reportes >30d + descuentos Paw Partners + badge 💛. Sin COGS externo
  (margen ~99%). Conversion target 13%. Biometria Paw Shield queda fuera del modelo
  consumer (Opcion C 2026-04-30, codigo dormido reactivable B2B-funded).
- **Manada ($9.990/mes, 5 mascotas)**: + descuentos exclusivos + soporte prioritario +
  early access + badge 👑 + **$2.000/mes a Fondo Paw Friend Refugios** (Paw Friend SpA
  es quien dona, evita Ley 19.885). Conversion target 1-2%.

### 4.3. B2B vet — canal de adquisicion, no revenue center

- Plan Basica ($0 / 5 pacientes) y Premium ($9.900 / vet individual) visibles.
- Plan Clinica/Pro Max **escondidos** del pricing publico ("Empresarial — contactanos").
- *El vet no paga porque su valor esta en construir la ficha. El activo es la ficha.*

### 4.4. Unit economics v2 a escala (50k MAU, mes 18 post-seed)

| Motor | Conversion / deals | ARR estimado |
|---|---|---|
| Pharma (3 brands) | 3 deals activos | USD $300-600K |
| Seguros (2 aseguradoras) | 5% conv = 2.500 polizas | USD $200-500K |
| Retail (2 retailers) | 10% conv activos | USD $250-500K |
| Paw Companys | 20 empresas | USD $120-240K |
| Paw Support | Voluntario | USD $20-50K |
| Long-tail (data/gobierno) | 1-2 deals | USD $50-200K |
| **Total ARR proyectado** | | **USD $940K - $2.1M** |

---

## 5. Mercado y escalabilidad

### 5.1. Mercado Chile

- **TAM Chile**: ~USD $160M/ano (4M hogares × USD $40/ano digital).
- **SAM Chile**: ~USD $25-35M/ano (1.500 clinicas chicas + 500K duenos digital-native).
- **SOM 3 anos Chile**: **~USD $1,5M ARR**.

### 5.2. Mercado LATAM Andino (escalabilidad)

- **TAM LATAM Andino**: ~USD $2,5B/ano (20M hogares × USD $125/ano digital).
- **SAM**: ~USD $120M/ano.
- **SOM 3 anos**: **USD $3-4M ARR** (5-6% SAM Chile + piloto regional).

### 5.3. Potencial exportador (eje CORFO)

- Stack tecnico **portable** (Supabase multi-region, Capacitor cross-platform, Flow.cl reemplazable por Stripe/Kushki/Mercado Pago).
- Pricing en CLP facil de localizar a PEN/COP.
- Idioma espanol comun Chile + Peru + Colombia.
- **Piloto regional: mes 7+** (roadmap fase 3).

---

## 6. Competencia y diferenciacion

### Matriz competitiva

|  | Con directorio SEO | Sin directorio SEO |
|---|---|---|
| B2B only | Veterinariachile.com (pasivo) | QVET, VetPraxis, GVET, Milovet |
| B2C only | — | Petsy, CuidaPet, Duko, Wolkie |
| **B2C + B2B + Comunidad** | **Paw Friend** | — |

### Moats

1. Directorio SEO publico unico.
2. Pricing CLP transparente + onboarding 5 min.
3. Integracion dueno ↔ vet end-to-end.
4. Paw Companys + donaciones trazables.
5. Costos home-made (producto artesanal + IA).

---

## 7. Equipo

| Rol | Nombre | Estado |
|---|---|---|
| Fundador y líder | Paw Founder | Full-time |
| Copiloto IA | Claude (Anthropic) | Infraestructura |
| Consejera clínica | Sofía Rosi (veterinaria beta tester) | Informal |
| Beta tester dueña | Paloma | Informal |
| **Socio comercial** | — | **A cerrar con la ronda** |
| **Ingeniero adicional** | — | **A contratar con la ronda** |

**Paw Founder**: 10+ años como ingeniero de software, dueño de Kai (perro, pastor suizo) y Ema (gata), fundador de SpA constituida. Construyó el producto completo (frontend, backend, mobile, DevOps, producto, copy, seguridad).

---

## 8. Estado actual (evidencia verificable)

**Todo verificable en el repositorio disponible bajo NDA**:

- **504 commits** en `main`.
- **67 rutas** activas (18 publicas, 40 protegidas, 3 provider, 2 admin).
- **319 componentes** React custom.
- **38 edge functions** Deno en produccion.
- **201 migraciones** SQL versionadas.
- **334 tests** pasando (Vitest + Playwright).
- **2 beta testers reales** con feedback incorporado.

**URLs live**:

- Producto: pawfriend.cl
- Directorio publico: pawfriend.cl/veterinarios
- Donaciones: pawfriend.cl/donaciones
- Comunidad: pawfriend.cl/paw-voices
- Apps mobile: en preparacion (Android APK listo, iOS pending Apple Dev).

---

## 9. Uso del subsidio CORFO (USD $28K / 75%)

| Categoria | Monto USD | Que se compra con el 75% CORFO |
|---|---|---|
| **Engineer adicional** (6 meses) | $10.000 | Salario developer full-stack para escalar features y piloto LATAM |
| **SDR ventas B2B** (6 meses) | $6.000 | Outreach a 500 vets chilenos + cierre clinicas |
| **Marketing performance B2C** | $5.000 | Meta Ads + Google Ads + contenido SEO veterinario |
| **Infraestructura Pro + IA** | $3.000 | Supabase Pro, Sentry, PostHog, Anthropic API, Firebase |
| **Legal y propiedad intelectual** | $2.500 | DPA Supabase, registro marca INAPI, contratos co-founder |
| **Diseno y assets mobile stores** | $1.500 | App Store + Play Store launch, screenshots profesionales, video marketing |
| **TOTAL CORFO (75%)** | **$28.000** | |
| Aporte founder (25%) | $9.333 | Tiempo founder + infra existente |
| **TOTAL PROYECTO** | **$37.333** | |

### Hitos comprometidos con CORFO (12 meses post-adjudicacion)

| Mes | Hito |
|---|---|
| 1-3 | 100 Premium + 20 B2B pagas + 3 Paw Companys + engineer contratado |
| 4-6 | 500 Premium + 60 B2B + 10 Paw Companys + SDR contratada |
| 7-9 | 1.000 Premium + 100 B2B + 15 Paw Companys + primer piloto LATAM |
| 10-12 | 2.000 Premium + 150 B2B + 20 Paw Companys + ARR USD $500K |

---

## 10. Impacto social y ambiental

### Impacto social medible

- **Trazabilidad de donaciones**: cada peso donado via `/donaciones` tiene dashboard publico con destino.
- **Refugios aliados**: convenio formal con 1 refugio chileno en mes 6, 3 en mes 12.
- **Paw Voices**: muralla publica con mensajes de duenos que aportaron — aval social no falsificable.
- **Paw Companys**: articula empresas chilenas con causas animales (CSR medible, no ads tradicionales).

### Impacto en empleo

- **Mes 3**: 2 empleos directos (co-founder + engineer).
- **Mes 6**: 3 empleos directos (+ SDR).
- **Mes 12**: 5-6 empleos directos + network de vets chicos digitalizados.

### Impacto en digitalizacion de MIPYMES

- Cada veterinaria chica que adopta Paw Friend = **1 MIPYME digitalizada** (ERP basico + agenda + CRM + marketing organico).
- Meta 12 meses: **150 MIPYMES veterinarias digitalizadas** en Chile.

---

## 11. Cronograma (Gantt resumen)

| Mes | Hito clave |
|---|---|
| 1 | Engineer + SDR contratados, primera campana marketing |
| 2 | 50 Premium + 10 B2B + 1 Paw Company |
| 3 | 100 Premium + 20 B2B + 3 Paw Companys + dashboard transparencia publico |
| 4-6 | Escalado + postulacion Start-Up Chile Ignite + 500 Premium + 60 B2B |
| 7-9 | Piloto LATAM (Peru o Colombia) + 1.000 Premium + 100 B2B |
| 10-12 | ARR USD $500K + 150 B2B + 20 Paw Companys + preparar Seed |

---

## 12. Por que invertir en Paw Friend (closing CORFO)

1. **Velocidad comprobada**: 2 meses de producto + infraestructura que normalmente toma 6-12 meses con equipos de 5-8 personas y capital USD $1-4M.
2. **Eficiencia de capital**: ratio 32-65× en costo vs equipo tradicional. USD $28K de CORFO rinden como USD $1M en manos tradicionales.
3. **Traccion medible**: 334 tests verdes, 504 commits, 2 beta testers reales con feedback iterativo.
4. **Impacto social concreto**: modelo explicito de excedente a refugios con trazabilidad publica.
5. **Exportable**: stack portable + idioma comun = piloto LATAM en mes 7.
6. **Founder committed**: SpA constituida, inicio SII, dominio registrado, tiempo completo sin salario hace 2 meses.
7. **Sin competencia directa**: unicos en Chile en la interseccion B2C + B2B + directorio + comunidad.

---

## 13. Anexos de evidencia

- [CONSOLIDADO_INVERSIONISTAS.md](CONSOLIDADO_INVERSIONISTAS.md) — deck completo narrativo.
- [../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md](../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md) — calculo de velocidad vs equipo tradicional.
- [../CLAUDE.md](../CLAUDE.md) — manual tecnico del producto.
- [../MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) — inventario de modulos y flujos.
- [../audits/COMPETENCIA_2026_04_08.md](../audits/COMPETENCIA_2026_04_08.md) — 13 fichas competitivas.
- Repositorio disponible bajo NDA
- Producto en vivo: pawfriend.cl

---

## Siguiente paso — Postulacion / Contacto

**Via form en linea** (2 minutos, nos llega al email del equipo):
[pawfriend.cl/aplicar?tipo=corfo](https://pawfriend.cl/aplicar?tipo=corfo)

**Via email directo**: pedrosusaeta@pawfriend.cl con asunto `[CORFO]` y
adjunto de este documento.

---

**Contacto**:
Paw Founder · pedrosusaeta@pawfriend.cl
SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT 78.328.659-9
Luis Pasteur 6111 Dp 201, Vitacura, Santiago
