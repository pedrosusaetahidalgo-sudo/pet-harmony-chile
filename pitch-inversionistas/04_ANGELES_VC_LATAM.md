# Paw Friend — Pitch para angels y VC LATAM

> **Audiencia**: angel investors LATAM, Platanus Ventures, Magma Partners, Kaszek, fondos health-tech / pet-tech.
> **Ronda**: pre-seed **USD $150K SAFE** con cap **USD $1,2M post-money**.
> **Stage**: producto en produccion, pre-traccion comercial, founder solo + co-founder en pipeline.
>
> Ultima revision: 2026-04-29 (modelo v2.1 — Plan v5 Opcion 3).
> Contacto: pedrosusaeta@pawfriend.cl
>
> **⚠️ Modelo v2.1 vigente desde 2026-04-29** (Plan v5 Opcion 3). Ver [`docs-raiz/pitch/MODELO_V2_2026_04_22.md`](../docs-raiz/pitch/MODELO_V2_2026_04_22.md) con el addendum 2026-04-29.
> Cambios clave: freemium B2C 3 tiers (Free $0 · Paw Member $3.990/mes · Manada $9.990/mes con aporte refugios), vet = canal de adquisicion (no revenue),
> 3 pilares ancla B2B = pharma + seguros + retail (motor de escala). Tesis core:
> *"El activo no es la app — es la ficha clinica longitudinal. Pagan quienes
> quieren acceso a esa cohorte (pharma, seguros, retail)."*

---

## 1. One-liner

> *Paw Friend es la ficha clinica digital de mascotas chilenas, con directorio publico de vets y donaciones trazables a refugios. Un founder + IA construyo en 2 meses lo que un equipo US de 8 personas tarda 14 meses.*

---

## 2. Elevator pitch (90 segundos — para Slack/DM a partners)

> Hola `[name]`,
>
> Soy el fundador de **Paw Friend** (pawfriend.cl). Vertical pet-tech chileno con modelo híbrido de múltiples fuentes de ingreso.
>
> **El gancho**: en 2 meses, solo + Claude como co-engineer, construi un producto funcional equivalente al output de un equipo de 5 expertos senior coordinados (320 hrs tuyas vs ~4.800 hrs ellos — 15× en tiempo, 32-65× en costo). Apps iOS + Android, 38 edge functions, 201 migraciones SQL, 334 tests, dashboard admin en vivo.
>
> **El producto**: ficha clinica digital + PDF descargable (la joya), directorio publico de veterinarios con SEO (unico en Chile), y un tercer motor B2B2C (Paw Companys) que articula empresas pet-friendly con aval social medible. Excedentes a refugios con trazabilidad publica.
>
> **El ask**: USD $150K pre-seed, SAFE cap USD $1,2M post-money, 12-14 meses runway, cerrar co-founder comercial + 1 engineer + SDR.
>
> **El timing**: 12-18 meses de ventana antes que QVET (espanol, 8.000 clientes) active comercial en Chile. Mercado Chile ~USD $160M, LATAM Andino ~USD $2,5B.
>
> ¿Te tinca una llamada de 20 min?

---

## 3. Deck narrativo (13 slides)

Usar la version autocontenida: **[PRESENTACION.html](PRESENTACION.html)**.
Version detallada con todas las secciones: **[CONSOLIDADO_INVERSIONISTAS.md](CONSOLIDADO_INVERSIONISTAS.md)**.
Version original 13 slides con notas del fundador: **[../docs-raiz/pitch/PITCH_DECK.md](../docs-raiz/pitch/PITCH_DECK.md)**.

---

## 4. Highlights para partners con poco tiempo

### ¿Por que este founder?

- **10+ anos ingenieria software**, dueno de mascota real (Kai, pastor suizo).
- **Builder full-stack**: frontend, backend, mobile, DevOps, producto, copy, seguridad.
- **SpA constituida** + inicio SII + sin salario por 2 meses → skin in the game 100%.
- **Unico en Chile** construyendo la interseccion B2C + B2B + directorio + comunidad en stack moderno.

### ¿Por que este producto?

- **Producto en produccion hoy** en pawfriend.cl — no es un prototipo.
- **Ficha clinica PDF + directorio publico** son features defendibles (moats SEO + UX).
- **Beta testers reales**: Sofia (vet) y Paloma (duena) con feedback ya incorporado.
- **Stack moderno y portable**: React + Supabase + Capacitor + Flow.cl.

### ¿Por que esta oportunidad?

- **Mercado Chile** subdigitalizado (<15%) + Ley 21.020 de tenencia responsable = tailwind regulatorio.
- **LATAM Andino** (CL + PE + CO) = USD $2,5B TAM, USD $120M SAM.
- **Ventana de 12-18 meses** antes que QVET entre comercialmente.
- **Stack permite piloto regional** con CAPEX ya pagado en horas del founder.

### ¿Por que ahora?

- **Claude IA** reduce time-to-market de 14 meses a 2. Capital de ronda se usa en GTM, no en building.
- **Costos variables <USD $100/mes** = runway largo con poco capital.
- **3 pilares ancla B2B** (pharma + seguros + retail) reducen dependencia de un solo cliente.
- **Modelo B2B de acceso a la ficha**: el grueso a escala lo paga B2B por acceso a la ficha longitudinal. Para el dueno hay freemium 3 tiers (Free $0 · Member $3.990 · Manada $9.990) — el Free cubre lo esencial para siempre y los planes pagos absorben el COGS biometrico Petify.
- **Paw Companys** abre un eje de revenue no correlacionado (CSR empresarial).

---

## 5. Los numeros (para due diligence rapida)

### Producto (verificable en GitHub publico)

| Metrica | Valor |
|---|---|
| Commits en `main` | 504 |
| Rutas activas | 67 |
| Componentes React custom | 319 |
| Paginas | 65 |
| Hooks custom | 84 |
| Edge Functions (Deno) | 38 |
| Migraciones SQL | 201 |
| Tests pasando | 334 |
| Lineas en `src/` | ~127.000 |
| Lineas en `supabase/` | ~32.000 |

### Apalancamiento IA (ver [APALANCAMIENTO_FUNDADOR_IA.md](../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md))

| | Realidad | Equipo expertos sin IA |
|---|---|---|
| Horas | 320 | 4.800 |
| Tiempo calendario | 2 meses | 6 meses |
| Costo CL | USD 22.400 | USD 720.000 |
| Costo US top-tier | USD 22.400 | USD 1.440.000 |

### Unit economics

- ARPU blended: USD $15-20/mes.
- LTV: USD $300-500 (12-24m).
- CAC organico: USD $15-30.
- Payback: 2-4 meses.
- LTV/CAC: >10×.

### Comparables de startups veterinarias

| Startup | Pais | Equipo | Tiempo MVP | Pre-seed |
|---|---|---|---|---|
| Pawp | US | 6 | 12m | USD 3M |
| Fuzzy | US | 8 | 14m | USD 4,5M |
| Barkibu | ES | 5 | 10m | USD 1,8M |
| **Paw Friend** | **CL** | **1+IA** | **2m** | **<USD 25K** |

---

## 6. Lista de angels / fondos prioritarios

### Tier 1 — primer outreach

| Fondo / Angel | Por que | Via de contacto |
|---|---|---|
| **Platanus Ventures** | Pre-seed LATAM, foco CL, tesis founder-first | Pedir intro via alum Platanus |
| **Magma Partners** | LATAM software early stage | LinkedIn partners + referido |
| **Broota** | Crowdfunding chileno + angels locales | Postulacion directa |
| **AddVentures Chile** | CORFO-backed + early stage | Red BancoEstado |
| **500 LATAM** | Experiencia pet-tech en region | Aplicacion + warm intro |

### Tier 2 — outreach mes 4+

| Fondo / Angel | Por que |
|---|---|
| Kaszek | Impact + health-tech LATAM |
| Monashees | Brasil + expansion LATAM |
| Canary | Brasil/MX pre-seed |
| Alaya Capital | LATAM social impact |

### Tier 3 — angels especializados

- Founders de startups pet-tech US (Pawp, Fuzzy) — retornos con insight vertical.
- Empresarios pet chilenos (propietarios de cadenas pet shops).
- Vets prominentes de Chile (Sofia Rosi como advisor puede abrir puertas).

---

## 7. Preguntas incomodas preparadas

### "¿Por que un founder solo?"

- Co-founder comercial en pipeline (cerramos con ronda).
- El stack + IA permite velocidad que no requiere equipo grande para el MVP.
- 15× en velocidad demostrable. Un co-founder no duplicaria; sumaria especializacion distinta (ventas/comercial).

### "¿Chile no es muy chico?"

- SOM 3 anos Chile solo: USD $1,5M ARR (techo).
- LATAM Andino: USD $2,5B TAM.
- Plan de expansion pais #2 en mes 7.

### "¿Y si Petify (u otro) los ataca con un freemium?"

- Petify hoy cobra al dueno: **Basic USD $0.50/pet/mes · Pro USD $0.75/pet/mes (suma lost pet recovery) · Premium contact-sales (suma QR check-in)** — modelo extractivo opuesto. Y Petify es **nuestro proveedor de biometria** (Pro tier $0.75/pet/mes absorbido por revenue B2B), no nuestro competidor primario.
- Si Petify pivotea a freemium pierden ARR existente y siguen sin moat de ficha longitudinal.
- Paw Friend tiene **2 anos de ventaja arquitectonica**: research consent opt-in, b2b-api keys,
  partner_integrations, correlation_definitions ya en produccion. Construir el moat pharma
  desde cero toma minimo 18-24 meses.
- **Modelo B2B de acceso a la ficha (no le cobras al usuario, le cobras al que quiere data) es estructuralmente
  superior**: gratuidad real captura el 90% del mercado que Petify pierde por friction.
- Stack portable: multi-region en Supabase, Capacitor cross-platform.

### "¿Que pasa si QVET activa Chile?"

- QVET tiene 18-24 meses antes de ser amenaza comercial real.
- Paw Friend tiene **moats que QVET no tiene**: directorio SEO publico, B2C integrado, Paw Companys.
- Onboarding vet Paw Friend: 5 min. QVET: horas + sesion comercial.

### "¿Paw Support (donaciones) no distrae del revenue core?"

- **Paw Support es proxy de NPS monetizable**, no revenue core.
- Revenue core viene de **3 pilares ancla**: pharma, seguros, retail.
- Reframe legal (insight 2026-04-22): "donacion" en Chile activa Ley 19.885 (donatarios, SII, credito tributario). Por eso lo llamamos **"pago voluntario por servicio"** — Paw Support.
- Paw Companys (recurrente B2B) es el motor comunitario real, no Paw Support.
- Costo de operar Paw Support: marginal (infraestructura Flow ya pagada).

### "¿Que hace si Claude cierra o sube mucho precio?"

- Stack portable: prompts y arquitectura agnosticas a proveedor.
- Alternativas: OpenAI, Gemini, llamas locales.
- Costo IA actual: <USD $200/mes. Impacto real: marginal.

### "¿Por que ficha clinica si no eres vet?"

- **Sofia Rosi** (veterinaria beta tester) valida estructura clinica.
- Feline Grimace Scale implementada segun estandar academico.
- Plan: contratar vet clinico part-time post-seed para validar features medicas.

### "¿Como defiende contra Petsy?"

- Petsy no tiene directorio SEO publico.
- Petsy no tiene plan B2B SaaS.
- Petsy no tiene Paw Companys ni comunidad con donaciones trazables.
- Paw Friend captura valor en 3 ejes donde Petsy no compite.

### "¿Si el founder se enferma o se va?"

- Repositorio publico en GitHub, documentacion exhaustiva (CLAUDE.md, MAPA_FUNCIONAL, INDEX).
- Co-founder a cerrar con ronda reduce bus factor.
- Stack con proveedores managed (Supabase) reduce dependencia de ops.

### "¿Donde esta la data de retencion?"

- Pre-traccion comercial. Metricas en vivo en `/admin?section=sala-inversion`.
- Widget de feedback mide willingness-to-pay antes de conversion.
- **Primer compromiso post-ronda**: dashboard de cohortes y retencion en mes 2.

### "¿Cual es el moat de largo plazo?"

1. Network effects de directorio SEO (cada vet que entra mejora rankings).
2. Switching cost de ficha clinica (los duenos no migran historial medico).
3. Aval social de Paw Companys (empresas se quedan por la comunidad, no solo por ads).
4. Data propietaria de salud veterinaria chilena (recordatorios, vacunas, consultas).

---

## 8. Plan post-inversion (6 meses) — modelo v2

### Mes 1

- Firmar co-founder comercial / clinico.
- Publicar apps iOS + Android.
- Lanzar **producto invisible** (home dueno con ficha + recordatorios + urgencia).
- Onboarding 4 campos + push OCR carnet vacunacion.
- Contratar engineer full-stack.

### Mes 2

- Dashboard de cohortes + retencion en vivo + research consent opt-in tracking.
- Cerrar primeros 3 Paw Companys (alimento, pet shop, seguro).
- Meta: **2.000 MAU + 80 vets activos creando fichas + 30% fichas con OCR completado**.

### Mes 3

- Contratar SDR/BD para outreach **pharma** (Centrovet, Virbac).
- Publicar convenio con refugio aliado.
- Postular CORFO SSAF-I (USD $28K cofinanciamiento).
- Iniciar conversaciones con primera farmaceutica.

### Mes 4

- **5.000 MAU + 150 vets activos + 5 Paw Companys**.
- Postular Start-Up Chile Ignite (USD $15K).
- **Primer deal pharma firmado (USD $20-50K piloto 6 meses)**: sponsored reminder MVP.
- Preparar docs para piloto regional + outreach a Sura Pet / BCI Seguros.

### Mes 5-6

- **8.000-10.000 MAU + 200 vets activos + 8 Paw Companys**.
- 1-2 brands pharma activos = MRR USD $5-15K.
- MVP afiliado seguros con Sura o BCI.
- Seleccionar pais #2 (Peru o Colombia).
- Preparar Seed: metricas defendibles para USD $1-2M (ARR runrate USD $300-500K proyectado mes 12).

---

## 9. Reporting que me comprometo con el lead

- **Snapshot mensual** de metricas desde `/admin?section=sala-inversion` (video loom).
- **Reporte trimestral** con tabla P&L, cohortes, burn rate.
- **Acceso read-only al admin** (opcional, para lead investor).
- **Board observer seat** para el lead.
- **Pro-rata** en Seed.

---

## 10. Anexos

- [PRESENTACION.html](PRESENTACION.html) — deck visual imprimible.
- [CONSOLIDADO_INVERSIONISTAS.md](CONSOLIDADO_INVERSIONISTAS.md) — fuente de verdad unificada.
- [../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md](../docs-raiz/pitch/APALANCAMIENTO_FUNDADOR_IA.md) — calculo de velocidad vs equipo.
- [../docs-raiz/pitch/PITCH_DECK.md](../docs-raiz/pitch/PITCH_DECK.md) — version 13 slides con notas fundador.
- [../CLAUDE.md](../CLAUDE.md) — manual tecnico (para due diligence).
- [../audits/COMPETENCIA_2026_04_08.md](../audits/COMPETENCIA_2026_04_08.md) — 13 fichas competitivas.
- [../MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) — arquitectura producto.
- Repositorio disponible bajo NDA
- Producto: pawfriend.cl

---

## Siguiente paso — Contacto para conversacion

**Via form en linea** (2 minutos, nos llega al email del founder):
[pawfriend.cl/aplicar?tipo=angels_vc](https://pawfriend.cl/aplicar?tipo=angels_vc)

**Via email directo**: pedrosusaeta@pawfriend.cl con asunto `[Angel/VC]` y
breve nota sobre tu fondo/perfil de inversion.

---

**Contacto**:
Paw Founder · pedrosusaeta@pawfriend.cl
SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT 78.328.659-9
Luis Pasteur 6111 Dp 201, Vitacura, Santiago

**Calendly**: `[RELLENAR link]`
