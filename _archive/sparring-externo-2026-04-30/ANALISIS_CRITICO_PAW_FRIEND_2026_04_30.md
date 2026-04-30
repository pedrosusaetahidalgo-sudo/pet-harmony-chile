# Análisis crítico Paw Friend — Modo "ataque libre"

> **Autor**: Claude (rol: advisor/mentor crítico)
> **Fecha**: 2026-04-30
> **Régimen**: ataque libre. Sin anclas narrativas heredadas. Sin defender v2.1.
> **Audiencia**: Pedro Susaeta, founder
> **Para acompañar a**: `SPARRING_PAW_FRIEND_v1.0_2026_04_30.md` (análisis táctico)
> **Este documento es**: análisis estructural. Qué está mal de raíz, qué se decidió por inercia, y qué pivots son reales.

---

## 0. Reglas que cambian en este análisis

1. **Sin referencias a "modelo Mapcity"**. La analogía es ancla retórica, no estrategia. Una empresa B2B-95% que tomó 26 años y exitó en USD 14-25M no es el comparable correcto para un proyecto B2C-40% pre-launch con 1 founder. Usar esa analogía limitó pensamiento.

2. **Sin asumir que v2.1 es el camino correcto**. v2.1 fue iteración sobre v2 con feedback de un mentor. Eso no la valida; solo la calibra contra el modelo mental de una persona específica. Volvemos a primera evidencia.

3. **Sin asumir que pivotear es fracaso**. Pivot bien ejecutado en mes 9 es decisión sana; pivot forzado en mes 18 cuando el cash se agotó es fracaso.

4. **Sin asumir que 8 meses de desarrollo son sunk cost**. El stack técnico es asset reusable. Si el modelo de negocio cambia, el código se redirige; no se tira.

5. **Sin azúcar**. Honestidad sobre patrones que veo de afuera, incluyendo los que pueden doler.

---

## 1. Diagnóstico estructural — 10 puntos débiles que veo

Ordenados por gravedad. Los primeros 4 son existenciales: si no se resuelven, el plan no funciona, no importa cuánto se pula el pricing o el onboarding.

### 1.1 — El producto es demasiado grande para 1 founder

`[opinión, alta confianza]` Lo que se está construyendo en pre-launch:

- Ficha clínica longitudinal (producto 1)
- Directorio + reservas vets (productos 2 y 3)
- Biometría Petify (producto 4)
- Memorial (producto 5)
- Refugios + Fondo (producto 6)
- AI assistant + Audio IA (producto 7)
- Paw Passport internacional (producto 8)
- 7 motores B2B (Pharma, Seguros, Retail, Paw Companys, Gobierno, Banca, Academia)

Esto son ~8 productos B2C + 7 motores B2B = ~15 propuestas de valor distintas con 1 persona vendiendo. Cada uno tiene mercado distinto, sales cycle distinto, objection handling distinto, comms distinto.

**El patrón clásico**: founder con apalancamiento de IA cree que producir más features = mejor producto. Pero la restricción real no es producción de features, es **distribución y validación**. Producir 15 productos con IA toma 8 meses; validar 15 productos con mercado real toma 5+ años con un equipo de 10.

**Consecuencia**: pre-launch tenés un producto enorme y nadie sabe qué es Paw Friend. Cuando un dueño chileno te pregunta "¿qué hace tu app?", no podés responder en 10 segundos. Cuando un inversor pre-seed te pregunta "¿cuál es el motor #1?", la respuesta debería ser una palabra. Hoy son cinco.

### 1.2 — La asunción "el dueño chileno paga por software pet-tech" no está validada

`[opinión, alta confianza]` La pregunta más importante que un founder consumer responde **antes** de construir:

> ¿Cuántos dueños chilenos pagaron CLP 3.990 por mes durante 3 meses por una versión scrappy del producto?

Si la respuesta es 0 → la asunción crítica del modelo está sin testear, y construiste 8 meses sobre fe.

Si la respuesta es 5-20 con paid validation real → tenés evidencia inicial, débil pero real.

Si la respuesta es 50+ → estás en otro lugar.

`[especulación]` Por la trayectoria del proyecto, sospecho que la respuesta es 0 (Cafati piloto B2B no cuenta porque es B2B y free). Si es así, tu modelo financiero a 50k MAU × 13% conversión es teoría sobre teoría. Inversor pre-seed sofisticado va a detectar esto en 5 minutos.

**Comparable de cautela**: Pawp en US (mercado más maduro, dueños con disposición a pagar más alta) lleva 6 años y ha pivoteado pricing 3 veces (de USD 24/mes → USD 99/año + add-ons). Si Pawp en US no logra retention sostenible a USD 24/mes, pretender 13% conversion a CLP 3.990 en Chile sin paid validation es optimismo, no plan.

### 1.3 — El B2B es aspiracional, no operacional

`[opinión, alta confianza]` Hoy, abril 2026, en B2B tenés:

- 1 piloto B2B free (Cafati) — no es revenue
- 0 contratos firmados con pharma, seguros, retail, gobierno, banca
- 7 motores listados en deck pero ninguno con sales pipeline real

`[evidencia: estándar de inversor pre-seed]` Para un inversor B2B-tilted, "7 motores" sin contrato firmado se lee como wishful thinking. Para un inversor consumer-tilted, B2B es distracción del foco consumer.

Cualquiera de los 7 motores que **firme un piloto pago de USD 5-20k antes del pitch** vale más que los otros 6 listados como aspiración. Tener 1 motor con contrato + 1 línea de roadmap es más fuerte narrativo que 7 motores en bullet points.

### 1.4 — El moat real no es lo que pensás

`[opinión, media confianza]` Pregunta de defensibilidad: si Falabella, MercadoLibre, o un equipo bien financiado de México lanza un clon en 6-12 meses con USD 5M de marketing, ¿qué te protege?

Las respuestas que NO funcionan:
- **"Tenemos 587 tests y stack moderno"** → cualquier equipo competente arma esto en 4-6 meses con IA. No es moat.
- **"Tenemos Petify para biometría"** → Petify lo licencia a quien sea. Falabella firma un contrato de USD 50k y lo tiene en 2 semanas.
- **"Tenemos compliance Ley 21.719"** → cualquier abogado serio lo arma en 8 semanas. No es moat.
- **"Tenemos AI assistant con prompts custom"** → cualquier equipo replica el system prompt en 1 día.

Las respuestas que SÍ funcionan (cuando son verdaderas):
- **Red de vets activos en Chile que confían en la marca** → tarda años de relaciones. Es moat real.
- **Base de fichas clínicas activas con N años de historial** → switching cost real para el dueño.
- **Brand equity con dueños chilenos** → tarda años de PR, contenido, comunidad.
- **Data acumulada que pharma/seguros valoran** → solo si llegás primero a masa crítica.

**Hoy, ninguna de las respuestas que SÍ funcionan está construida**. Estás en pre-launch. Tu moat actual es 0. Eso no es un problema (todos los pre-launch tienen moat 0); es problema solo si **no tenés un plan claro y enfocado para construir ese moat con el capital y tiempo que tenés**.

### 1.5 — Founder spreading too thin

`[opinión, alta confianza, sensible]` Esta es la observación que va a doler pero es la que más importa.

En memoria del proyecto veo:
- Paw Friend (proyecto principal)
- SYNAP (WhatsApp AI agents B2B)
- HOGAR (real estate platform)
- Viral Content Engine
- KAM B2C en Macrotel (trabajo full-time)
- Búsqueda activa de roles senior (jefatura/subgerencia/gerencia)

`[opinión]` Esto es el patrón #1 que mata startups en pre-seed evaluación: **founder distribuido en 4-5 frentes simultáneos**. Inversor sofisticado va a preguntar:

- "¿Estás full-time en Paw Friend?"
- "¿Qué pasa con SYNAP cuando cierres pre-seed?"
- "¿Por qué estás aplicando a roles senior si el plan es ser founder?"

Si tu respuesta es algo como "estoy explorando opciones" o "es para hedge", el inversor cuelga la llamada mentalmente. Pre-seed invertir en founder no-committed es no-go. Es lo más básico de diligence.

**Esta no es crítica al hecho de tener múltiples proyectos**. Muchos founders exitosos tuvieron side projects. La crítica es al **mensaje que esto manda al ecosistema** mientras buscás capital. Necesitás resolver internamente: o Paw Friend es full-time, o no es. No hay opción intermedia que un inversor compre.

### 1.6 — El modelo financiero proyecta sin baseline

`[opinión, alta confianza]` Proyectar 50k MAU con 13% conversión = USD 1.37M ARR es matemática limpia. Es ingeniería sobre supuestos no validados.

El número que **falta** en el modelo:
- ¿Cuál es el CAC realista para un dueño chileno? (sin esto, el modelo no tiene unit economics)
- ¿Cuál es la retention mes 1, mes 3, mes 6 de tu cohorte beta? (sin esto, el LTV es ficción)
- ¿Cuál es el churn mensual proyectado? (con freemium y pricing $3.990, churn de 8-12%/mes es probable; eso destruye el LTV)
- ¿Cuántos meses de runway hay con el USD 150k pre-seed?

Sin estos 4 números, el modelo financiero no es planning, es storytelling.

`[especulación]` Sospecho que estos números no están explícitos en el modelo financiero porque cuando se calculan honestamente con benchmarks pet-tech, los resultados son menos atractivos. Pero ese es el punto: el inversor los va a calcular él mismo. Mejor que vos los calcules primero y muestres el plan para mejorarlos, que él los calcule en su comité y te bajen el cheque.

### 1.7 — Pricing structure no fue iterado con dueños reales

`[opinión, media confianza]` $3.990 → $9.990 (gap 2.5×) sin tier intermedio sugiere que el pricing fue diseñado en escritorio, no validado con encuesta o A/B con dueños reales.

Lo que un test simple revelaría (1-2 semanas de trabajo):
- 30 dueños chilenos en Instagram/Twitter respondiendo encuesta de willingness-to-pay
- Pregunta clave: "Si esta app te ofreciera [feature X], ¿cuánto pagarías al mes?"
- Otra pregunta: "¿Has pagado alguna app pet en tu vida? ¿Cuál? ¿Cuánto?"

Si 30 dueños chilenos responden "no, nunca pagué por una app pet, no tengo intención de empezar", tu pricing es teórico. Si 5 de 30 dicen "pagué Spotify Pet/Tractive/Similar", tenés tu segmento target identificado.

**Este test cuesta $0 y toma 1 semana**. No haberlo hecho antes de lanzar pricing es decisión rara.

### 1.8 — La biometría es feature comprado, no moat

`[opinión, alta confianza]` Paw Shield es marketing-bonito (foto del perro, ID único, "si se pierde lo encontrás") pero es servicio licenciado a Petify Korea. Implicaciones:

- Si Petify lanza app B2C en Chile → competencia directa con la cosa que vos vendés como diferenciador.
- Si Petify duplica precio o cambia ToS → tu COGS sube o tu feature muere.
- Si Falabella firma exclusiva con Petify → quedás afuera del proveedor que vendés como moat.

Ninguno de estos escenarios es probable hoy. Pero **hacer del feature licenciado el principal diferenciador del producto** es construir sobre arena alquilada.

`[especulación]` Sospecho que Paw Shield ocupa más espacio del que merece en el deck precisamente porque es el feature más visualmente diferenciador. Pero diferenciador visual ≠ moat económico.

### 1.9 — Multi-stakeholder marketplace sin validación de ningún lado

`[opinión, alta confianza]` Para que Paw Friend funcione como diseñado, necesitás:
- Dueños que paguen freemium → no validado
- Vets que adopten plan free como canal → 1 caso (Cafati), no validado a escala
- Refugios que participen y reciban Fondo → no validado
- Pharma que firme pilotos → no validado
- Seguros que afilien leads → no validado
- Municipios que contraten Ley 21.020 → no validado
- Academia que pida data deals → no validado

`[evidencia: economics de marketplaces]` Marketplaces multi-lados son notoriamente difíciles. Uber, Airbnb, eBay tomaron años en cada lado y fallaron varias veces antes de encontrar el equilibrio. Cada lado del marketplace requiere su propio go-to-market. Hacer 7 lados con 1 founder es matemáticamente imposible.

### 1.10 — Confusión entre "construir producto" y "construir negocio"

`[opinión, alta confianza]` Las métricas que se citan en el contexto del proyecto son métricas de producto:
- 587 tests Vitest verde
- 199 migraciones SQL
- 78 rutas
- 42 edge functions
- 15× output equipo equivalente

Las métricas que **no** se citan son métricas de negocio:
- N usuarios paga reales
- ARR real
- CAC validado
- LTV calculado de cohorte
- Retention curve de 90 días
- N vets activos paga
- N contratos B2B firmados

`[opinión]` Cuando un founder cita métricas de producto al hablar de tracción, generalmente significa que las métricas de negocio no están donde quisiera. Eso es ok en pre-launch, pero hay que ser explícito sobre el gap. Inversor pre-seed sofisticado descuenta agresivamente las métricas de producto en evaluación.

---

## 2. Asunciones críticas no validadas

Resumen de qué hipótesis está apostando el plan v2.1, ordenadas por riesgo.

| # | Asunción | Validación | Riesgo si falla | Costo de validar |
|---|---|---|---|---|
| 1 | Dueño chileno paga $3.990/mes por pet-tech | 0 evidencia | Modelo entero cae | $0, 2-4 semanas |
| 2 | 13% conversión free→paid en pet-tech B2C | Benchmarks LatAm sugieren 3-7% | ARR cae 50-70% | Cohorte beta |
| 3 | Vets adoptan plan free como canal | 1 caso (Cafati) | Sin data, sin moat | 4-6 semanas outreach |
| 4 | Pharma firma piloto $50-200k con <10k MAU | 0 evidencia | Motor B2B principal cae | 3-6 meses outreach |
| 5 | Petify mantiene pricing y ToS | Probable a 12 meses | COGS sube 2-3× | 0, conversación con Petify |
| 6 | Founder full-time disponible | Memoria sugiere distribuido | Inversor no firma | Decisión interna |
| 7 | Cohorte beta valida producto | No iniciada | Lanzamiento ciego | 4 semanas |
| 8 | Compliance Ley 21.719 abordado correctamente | Pendiente review legal | Multas hasta 4% revenue | 2-3 semanas + abogado |

`[opinión]` Las asunciones #1, #2, #4 son **las tres más críticas**. Si fallan las tres, el plan v2.1 no existe. Si falla solo una, el plan ajusta. Hoy las tres están sin validar simultáneamente. **Eso es el riesgo principal del plan, no las cosas que vos venías analizando**.

---

## 3. Pivots posibles

5 caminos alternativos analizados con honestidad. Los 5 son construibles sobre el stack actual; ninguno requiere botar el código.

### Pivot A — B2B Vet SaaS Puro

**Tesis**: vender software a clínicas veterinarias chilenas como producto principal. Dueño es usuario gratis (canal), no payer.

**Modelo**:
- 200 clínicas chilenas paga $14.990/mes en 18 meses
- ARR target: ~CLP 36M/año a 200 clínicas (~USD 40k a FX 905)
- Expansion target: 1.000 clínicas en LatAm en 36 meses (~USD 200k ARR)
- Acquisition target: USD 5-10M valuation en 4-5 años

**Comparables**: PetDesk (US, exit USD 100M+), Vetstoria (UK), ezyVet (NZ).

**Pros**:
- Modelo conocido. Sales cycle medible. Pricing simple.
- 1 producto, 1 vertical, 1 founder = ejecutable.
- Founder solo viable. No requiere equipo grande.
- Path a profitability en 18-24 meses sin Series A.
- Stack actual reusable casi 100% (mismo backend, frontend simplificado).

**Contras**:
- Mercado vet chileno tiene ~2.500 clínicas. TAM techo ~USD 4-6M ARR Chile-only.
- Expansion LatAm requiere localización. Puede agregar 12-18 meses.
- Salida menor: USD 5-10M en 4-5 años (vs aspiración USD 30-50M en 6-8 años con freemium).
- Menos sexy para inversor consumer-tilted.

**Ajuste vs hoy**:
- Eliminar freemium B2C (puede dejarse free como funnel).
- Eliminar 6 de 7 motores B2B aspiracional.
- Cobrar a vets desde día 1.
- Foco PR en comunidad veterinaria, no en dueños.

**Mi confianza en éxito**: alta. Es el camino más probable de generar revenue sostenido y opcional Series A más adelante.

---

### Pivot B — Insurtech-Affiliate

**Tesis**: Paw Friend es el canal de adquisición de seguros de mascotas. App es funnel; revenue viene de comisiones de afiliación.

**Modelo**:
- Partnership con Sura, Mapfre, BCI seguros pet
- Comisión 10-20% sobre prima primer año + retention bonus
- Prima promedio mascota Chile: ~USD 30-60/mes (CLP 27-54k)
- Comisión mensual por seguro vendido: USD 3-12/mes/cliente
- 2.000 seguros vendidos = USD 6-24k/mes recurring

**Pros**:
- ARPU mucho mayor que freemium.
- No requiere paywall consumer (problema de #1 resuelto).
- Aseguradora hace el cierre de venta; vos sos canal.
- Sales cycle más corto que pharma.
- Mismo stack actual reusable.

**Contras**:
- Dependencia de aseguradoras (concentración de revenue).
- Pet insurance penetration en Chile es bajo (<2% de hogares con mascota tienen seguro). Educación de mercado costosa.
- Comisiones afiliado son típicamente menores que SaaS B2B en términos de margen.

**Ajuste vs hoy**:
- Reposicionar app como "marketplace seguros + ficha clínica gratis".
- Pricing consumer = $0 (toda la app gratis).
- Revenue viene 100% de comisiones partners.
- Eliminar paywall, AI assistant premium, max_pets gating.

**Mi confianza**: media. Depende de cuán abiertas están Sura/Mapfre/BCI a partnership con startup pre-tracción. Conviene validarlo con 2-3 emails antes de pivotear.

---

### Pivot C — Vertical específico (Refugios SaaS)

**Tesis**: SaaS para los ~200-300 refugios + ONG animales en Chile. Mission-driven, vertical concentrado.

**Modelo**:
- $9.990-19.990/mes/refugio
- 100 refugios paga = CLP 1-2M/mes ARR
- Add-on: marketplace de adopción premium para dueños buscando adoptar
- Add-on: data deals con academia/gobierno

**Pros**:
- Vertical concentrado. Sales cycle corto. Sales founder-led viable.
- Mission narrative fuerte. PR fácil. CORFO Social Innovation funding posible.
- Competencia local minimal.
- Stack reusable.

**Contras**:
- TAM techo bajísimo: ~CLP 35M/año ARR Chile-only a 100% market share.
- Expansion LatAm refugios = vertical con cliente sin presupuesto.
- No es path a Series A. Es path a small-business sostenible.

**Ajuste vs hoy**:
- Reposicionar 100% como "el sistema operativo de los refugios chilenos".
- Eliminar consumer freemium completo.
- Consumer es portal de adopción gratis (canal).

**Mi confianza**: media-baja como negocio principal. Alta como **producto secundario** lateral al pivot A o B. Refugios SaaS dentro de un B2B Vet SaaS bigger play tiene sentido; refugios SaaS solo no.

---

### Pivot D — White-label / Platform-as-a-Service

**Tesis**: vender el stack a 5-10 cadenas de clínicas chilenas grandes para que armen sus propias apps de cliente con tu backend.

**Modelo**:
- Setup fee: USD 5-15k por cadena
- Recurring: USD 1-3k/mes/cadena
- 8 cadenas × USD 2k/mes = USD 16k/mes recurring + setup fees

**Pros**:
- Sales cycle largo pero pocos clientes — viable founder-led.
- ARPU alto.
- Cadenas grandes (Provet, Vetcenter, etc.) tienen presupuesto IT.
- Stack reusable casi 100%.

**Contras**:
- Mercado pequeño en Chile (~10-15 cadenas con scale para querer app propia).
- Cada implementación toma 2-3 meses → revenue lento.
- Cadenas grandes prefieren construir in-house o comprar a vendor establecido (NetSuite, etc.).

**Mi confianza**: baja como motor principal. Alta como upsell de pivot A en año 2-3.

---

### Pivot E — Cuchillazo focal sobre v2.1

**Tesis**: mantener camino actual pero brutal en focalización. Eliminar 70% del scope.

**Modelo**:
- 1 producto B2C (ficha clínica + directorio vets) — sin AI assistant, sin Audio, sin biometría premium en MVP
- 1 motor B2B (Seguros afiliado o Vet SaaS pago, pero NO los dos)
- 2 tiers consumer: Free (1 mascota) + Paw $4.990 (3 mascotas)
- Eliminar: Manada tier, Fondo Refugios, Paw Companys, AI assistant premium, Audio IA, Paw Passport, Reportes históricos
- Lanzar v1.0 minimal + iterar con cohorte real

**Pros**:
- No descarta 8 meses de trabajo.
- Mantiene aspiración consumer-mass.
- Founder solo puede ejecutar v1.0 reducido.
- Permite validar asunciones #1 y #2 sin haber pivotado.

**Contras**:
- Si asunción #1 falla (dueños no pagan), termina forzando pivot A o B en mes 6-9.
- Pierde la "gran narrativa" del plan actual.
- Riesgo: founder no quiere matar features que ya construyó (sunk cost mental).

**Mi confianza**: media. Es el camino menos disruptivo, pero **delays el reckoning** sin resolver el problema de fondo (asunciones críticas no validadas).

---

## 4. Mi recomendación concreta

Si fuera tu advisor con stake, te diría:

### Recomendación principal: Pivot A (B2B Vet SaaS) + Pivot B parcial

**El por qué**:

1. **Resuelve el problema #1**: 1 founder puede ejecutar 1 producto B2B con sales cycle medible. No puede ejecutar marketplace 7-lados.

2. **Resuelve el problema #2**: vets B2B pagan por software. Es modelo conocido. Asunción crítica baja a "¿200 vets chilenos pagarán $14.990/mes?" — esto se valida con 50 calls en 6 semanas, no con 8 meses de construcción ciega.

3. **Mantiene opcionalidad**: si en mes 12 tenés 100 vets paga + ficha clínica de N mil mascotas activas, **EN ESE PUNTO** podés agregar consumer freemium con datos reales que validen el path. Hoy es prematuro.

4. **Stack reusable**: 80%+ del código actual sirve. La ficha clínica, directorio, agendamiento, biometría son features de un Vet SaaS. Solo cambia la persona que paga y el énfasis del feature set.

5. **Path a Series A real**: 200 vets paga × $14.990 × 12 = ~CLP 36M/año en 18 meses. Más expansion LatAm. Eso te lleva a USD 500k-1M ARR con cliente paga real, que es threshold para Series A en pet-tech LatAm.

6. **Permite el affiliate seguros como motor #2** sin pivotear de nuevo: una vez tenés 200 clínicas activas, ofrecer afiliación a Sura/BCI como upsell del plan vet (vet receive comisión por seguro vendido a su cliente) es upsell natural.

### Plan concreto, próximos 30 días

**Semana 1 (esta semana)**:
- Decisión interna: ¿full-time en Paw Friend o no? Si sí, cerrar/pausar SYNAP, HOGAR, Viral Content. Si no, no avanzar a pre-seed pitch.
- 5 calls con vets chilenos (no Cafati, vets nuevos): "¿Pagarías $14.990/mes por software que te facilite agenda, ficha, recordatorios automáticos a tus clientes?" Anotá objeciones.
- Email a Petify pidiendo tiered pricing.

**Semanas 2-3**:
- 20 calls vets adicionales. Objetivo: 5 cartas de intención de pago condicional ("si Paw Friend lanza X feature, pago $14.990/mes").
- Reescribir landing como B2B Vet SaaS. Consumer journey queda como hook secundario.
- Modelo financiero V2: scenarios de B2B Vet SaaS con CAC realista.

**Semana 4**:
- Decisión final: ¿pivot A o seguir v2.1? Basado en tracción real de las 25 calls.
- Si pivot A: pitch nuevo a Camhi (no como "fracaso de v2.1" sino como "evolución basada en 25 calls de validación").
- Si v2.1: aceptar las 8 asunciones no validadas y proceder con plan de validación urgente.

### Condición de "no pivot"

Hay UN escenario donde mantener v2.1 tiene sentido: **si en las próximas 4 semanas conseguís 20+ dueños chilenos que paguen CLP 3.990 por 3 meses por una versión beta cerrada**.

Esto valida la asunción crítica #1. Sin esto, v2.1 es apuesta sobre fe.

---

## 5. Lo que NO te estoy diciendo

Para honestidad simétrica, lo que NO sé y donde podrías tener razón vos y yo no:

1. **Tu red personal en pet-tech / vet Chile**. Si tenés 5-10 vets prominentes que ya están comprometidos a recomendarte, mi análisis B2B Vet SaaS está infra-estimando tu velocidad de execution.

2. **Capital adicional disponible**. Si tu USD 150k pre-seed es complementario a USD 200-500k de family/founder savings que pueden financiar 24 meses sin presión, el cálculo de "validar antes de escalar" cambia.

3. **Tu tolerancia al riesgo**. Si querés explícitamente apostar a un swing big — Series A o quiebra — entonces v2.1 puede ser racional aún con sus debilidades. Lo que estoy haciendo es señalar que la probabilidad de éxito es menor de lo que el plan sugiere.

4. **Datos cualitativos de Cafati y otros vets que ya hablaste**. Si ellos te dicen "los dueños chilenos sí pagarán", eso es señal débil pero válida que yo no tengo.

5. **Información sobre CORFO / Start-Up Chile timing**. Si tenés señales internas de que CORFO Semilla Inicia firma este mes, el cash timing cambia el cálculo.

Mi análisis está basado en patrones generales de pet-tech LatAm + startup pre-seed. Vos tenés información local que yo no tengo. Si esa información contradice mi análisis con evidencia (no con esperanza), mi análisis es lo que está mal.

---

## 6. Preguntas que necesito que te hagas

Las cinco preguntas que un mentor te haría en una sesión 1:1, sin powerpoint ni deck:

1. **¿Cuántos dueños chilenos te dieron $3.990 alguna vez por algo similar?** Si la respuesta es 0, ¿por qué creés que mañana sí?

2. **Si tu mejor amigo te llamara con este mismo plan v2.1 pidiendo USD 50k, ¿se los darías?** Honestamente. Sin "porque es mi amigo".

3. **¿Cuál es el momento exacto donde el modelo se rompe?** No "todo va bien", sino el escenario que mantiene despierto en la noche. ¿Lo tenés mapeado?

4. **¿Si Paw Friend muere en 12 meses, qué hiciste mal? ¿Y qué señales lo van a indicar antes que sea tarde?**

5. **¿Por qué vos? ¿Por qué ahora?** Estas dos preguntas son las que cualquier inversor pre-seed va a hacer. Si tu respuesta cabe en menos de 30 segundos y es convincente, tenés algo. Si necesitás 5 minutos para explicarla, no.

---

## 7. Limpieza del repo — eliminación de referencias

Para purgar referencias a Mapcity y Camhi del proyecto. Comandos para Claude Code:

### Identificar archivos con referencias

```bash
cd /path/to/pawfriend
grep -ril "mapcity\|camhi\|roberto" --include="*.md" --include="*.html" --include="*.tsx" --include="*.ts" --include="*.json" .
```

### Archivos probablemente afectados (basado en tu lista de docs)

- `docs-raiz/MODELO_FINANCIERO_2026_04_29.md`
- `docs-raiz/CAP_TABLE_VALUACION_2026_04_29.md`
- `docs-raiz/PATH_MRR_2026_04_29.md`
- `docs-raiz/MANIFESTO_PAW_FRIEND_2026_04_29.md`
- `docs-raiz/PITCH_DECK_V2_2026_04_29.md`
- `docs-raiz/pitch/MODELO_V2_2026_04_22.md`
- `pawfriend.cl/pitch/inversionistas.html`
- `CLAUDE.md` (si menciona "modelo Mapcity" como guía)

### Reemplazos sugeridos

| Texto actual | Reemplazo |
|---|---|
| "modelo Mapcity en pet-tech" | "plataforma de datos pet-tech" |
| "estilo Mapcity" | (eliminar — usá descripción concreta del modelo) |
| Referencias a Roberto Camhi como mentor | (mantener si vas a citarlo como advisor; eliminar si fue mentor de paso) |
| "B2B Mapcity" como categoría | "B2B Plataforma" o categoría específica |

### Prompt sugerido para Claude Code

```
En el repo pawfriend, busca todas las referencias a "Mapcity", "Camhi", "Roberto" en archivos .md, .html, .tsx, .ts, .json. Lista cada ocurrencia con contexto (3 líneas antes/después). NO modifiques nada todavía. Solo reporta para review humano.
```

Después del review, segundo paso:

```
Reemplaza las ocurrencias confirmadas según mapping en /docs-raiz/REPLACE_MAPCITY_REFS.md. Ejecutá uno por uno con git diff entre cada cambio.
```

---

## Cierre

Este documento es honesto, no hostil. Lo que estoy señalando no es que el proyecto esté mal — es que el plan tiene asunciones críticas que no fueron validadas y que se decidieron por inercia narrativa más que por evidencia.

Tenés 8 meses de stack construido, conocimiento del dominio, una IA que apalancás bien, y red en Chile. Esos son assets reales. La pregunta no es si tenés capacidad — la respuesta es sí. La pregunta es si estás apostando los assets en la cosa correcta.

Mi apuesta personal: B2B Vet SaaS + opcionalidad insurance, foco brutal, full-time. Eso te da el path a USD 1M ARR en 24 meses con 1 founder + IA. Desde ahí, todo lo demás se puede agregar.

Pero vos sos el founder. Yo solo puedo señalar lo que veo.

---

> **Notas finales**:
> - Este documento NO reemplaza el sparring táctico (`SPARRING_PAW_FRIEND_v1.0`); lo complementa.
> - Si pivotás, el sparring previo de pricing/UX/B2B sigue siendo útil pero re-contextualizado.
> - Recomiendo dormir una noche con esto antes de actuar. Pivots emocionales son peores que no-pivots.
