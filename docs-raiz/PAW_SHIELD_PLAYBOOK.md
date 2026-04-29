# Paw Shield · Playbook estratégico

> **Fecha**: 2026-04-29
> **Estado**: integración con Petify (PetNow) implementada en código, flag `PAW_SHIELD_PETIFY=false` hasta firmar contrato comercial.
> **Resultado test**: 100% top-1 accuracy con 3 fotos por mascota (8 mascotas reales).

---

## 1. Principio rector — control de costos

> "Si el usuario puede activar esto libremente me saldrá un ojo de la cara."

Petify cobra **por pet registrado activo**, no por evento de match. Esto significa:

- **Lo caro**: registrar mascotas que nunca van a usar el feature (extravío que no ocurre).
- **Lo "gratis" (ya pagado)**: hacer infinitos `identify` y `verify` contra los pets ya registrados.

El modelo de monetización debe diseñarse para **maximizar identifies sobre la base ya registrada**, no para maximizar registros.

### Política de activación (anti-explosión de costos)

1. **Default OFF**: pet creado **nunca** se registra automático en Petify.
2. **Activación opt-in con fricción positiva**: usuario debe entender el valor antes de activar:
   - "Si tu mascota se pierde, otros la pueden encontrar."
   - Pantalla de consentimiento explícita + un click consciente.
3. **Reactivación masiva NO permitida**: si baja la tasa de activación voluntaria, NO bajar la fricción para forzar uptake. Eso multiplica el costo COGS.
4. **Cleanup automático**: pets con cuenta inactiva >12 meses → DELETE en Petify (sale de billing siguiente ciclo). Cron mensual.
5. **Cuenta cerrada por dueño**: `DELETE /v2/pets/{id}` inmediato → fuera de billing en 1 ciclo. ARCO compliance + cost saving.

### Métrica clave

```
Costo Petify mensual = pets_registered_activos × $1.50 USD
Revenue B2B asociado = pharma + seguros + retail + identify-as-a-service

Salud del modelo: revenue / costo > 5x
```

---

## 2. Features que aprovechan IDENTIFY ILIMITADO (lo verdaderamente nuevo)

Una vez la mascota está registrada, podemos hacer infinitos identifies sin costo extra. Aquí cada feature multiplica el ROI por mascota registrada.

### A. Para el dueño (UX magic)

| Feature | Cómo se ve | Valor |
|---|---|---|
| **Onboarding express** | "Escanea tu mascota → ya está creada" sin escribir nombre/edad/raza si la app puede sugerir desde la foto | Conversión registro |
| **Login del pet** | Escanear el hocico abre directo la ficha clínica del pet (sin elegir de lista) | UX delight |
| **Quick switcher** | Si dueño tiene 3 perros, escanear uno cambia el contexto activo a esa ficha | Multi-pet eficiente |
| **Verificación al claim** | Cuando un cuidador/vet/familiar quiere acceso a la ficha, escanear el hocico verifica que es el pet correcto | Anti-fraude |

### B. Para vets y clínicas

| Feature | Cómo se ve | Valor B2B |
|---|---|---|
| **Check-in biométrico** | Mascota llega, vet escanea hocico → ficha abierta automática (sin pedir RUT del dueño) | -30% tiempo recepción |
| **Medication match-back** | Antes de aplicar vacuna/medicamento, vet escanea para confirmar identidad → reduce errores | Defensa legal contra mala praxis |
| **Reporte de pacientes "fantasma"** | Detectar perros que vienen sin ficha en el sistema → oportunidad de captura | Pipeline para Paw Friend |

### C. Para refugios

| Feature | Cómo se ve | Valor |
|---|---|---|
| **Anti-robo** | Refugio recibe perro → escanea → si match con base de "perdidos" alerta dueño en segundos | Recuperaciones reales = caso viral |
| **Pre-adopción** | Antes de entregar a un adoptante, validar que NO está reportado como perdido por otro dueño | Anti-fraude |
| **Follow-up post-adopción** | Visita domiciliaria del refugio: escanear → confirmar que el adoptante sigue teniendo al pet correcto | Trust |

### D. Para tiendas / partners

> "Las tiendas escanean a perros que vienen a comprar con sus dueños y se les aplica un descuento."

| Feature | Cómo se ve | Valor para la tienda | Valor para Paw Friend |
|---|---|---|---|
| **Scan to discount** | Tienda integra QR/tablet → dueño escanea hocico de su perro → app de Paw Friend valida pet + Paw Member status → descuento aplicado | Conversion checkout + lealtad | Data: qué compra qué perro |
| **Loyalty stamps** | "10 visitas con Kai = bolsa gratis" — tracking biométrico (ningún humano puede falsearlo) | Programa loyalty robusto | Data: frecuencia de visitas |
| **Cross-sell por raza/edad** | Tienda escanea Pastor Suizo de 2 años → recomendaciones específicas (alimento mediano-grande, juguetes resistencia) | Upsell inteligente | Datos de comportamiento de compra |

### E. Lost-and-found pasivo

> El sistema "vigila" todas las fotos públicas (feed, adopciones, refugios). Si un pet reportado como perdido aparece en una foto random, alerta al dueño "tu mascota fue vista".

- Costo extra: 0 (ya pagaste por el pet registrado, identify es gratis).
- Implementación: cada foto subida al feed → fingerprint extraction async → cross-check contra `lost_pets`.
- **Caso emocional viral**: "el sistema encontró a mi perro perdido en una foto de otro dueño paseando en el mismo parque".

### F. Cross-app interop (B2B futuro)

| Producto | Cómo nos paga | Flujo |
|---|---|---|
| **API Paw Shield para terceros** | Apps competidoras / vet softwares pagan suscripción mensual por usar nuestro identify | "Powered by Paw Shield" |
| **Smart pet doors** | Hardware en casa (puerta automática) abre solo para pets autorizados — usa nuestra API | Hardware + recurring service |
| **Acceso edificios pet-friendly** | Edificio nuevo Vitacura permite mascotas → cámara entrada escanea hocico, valida lista de pets autorizados | SaaS B2B inmobiliario |
| **Concursos caninos / exhibiciones** | Verificación anti-suplantación en competencias | Fee por evento |

---

## 3. Data layer — explotación inteligente

> "Asociar razas con tipos de alimento, remedios, enfermedades, juguetes. Todo lo útil. También edad del animal."

Cada pet con Paw Shield activo tiene una **ficha clínica longitudinal** vinculada. La biometría es el ID único; alrededor podemos construir el dataset más granular del mercado pet chileno.

### Datos que ya tenemos en `pets` + `medical_records`

| Dato | Tabla | Fuente |
|---|---|---|
| Especie / raza | `pets.species`, `pets.breed` | Onboarding |
| Edad / fecha nacimiento | `pets.birth_date` | Onboarding |
| Peso (longitudinal) | `pets.weight_history` JSONB | Visitas vet + auto-tracking |
| Vacunas aplicadas + fechas | `medical_records` con `record_type='vacuna'` | Vet |
| Antiparasitarios + marca | `medical_records` con `record_type='antiparasitario'` + `product_brand` | Vet/dueño |
| Enfermedades crónicas | `pets.medical_notes`, `medical_records.diagnosis` | Vet |
| Alergias | `pets.allergies` array | Onboarding/vet |
| Comuna del dueño | `profiles.comuna` | Profile |

### Datos NUEVOS que sumamos con Paw Shield

| Dato | Fuente | Aplicación |
|---|---|---|
| **Frecuencia compra alimento** (tienda con scan-to-discount) | Tienda escanea pet en cada compra | Recomendar alimento por raza+edad |
| **Marca alimento real** (declarada vs comprada) | Idem | Insights pharma: "Pastor Suizo en LC compra Pro Plan, en Maipú compra Master Dog" |
| **Visitas tienda/clínica** | Cada scan = timestamp + lugar | Frecuencia de cuidado por demografía |
| **Cross-validation visita vet** | Cuando vet escanea, registramos visita real (no autoreporte del dueño) | Calibrar churn (vet activo = pet vivo) |
| **Preferencias** (juguetes, accesorios) | Tienda registra cada compra asociada | Personalización |

### Productos B2B que vendemos con esta data

#### B2B-1 · Pharma (Centrovet, Virbac, Zoetis, MSD)

> "El 47% de los Pastores Suizos en Las Condes >5 años no tienen vacuna anti-leishmaniasis al día. Tu campaña debería dirigirse aquí."

- **Producto**: dashboards segmentados por raza × comuna × edad × estado vacunal.
- **Pricing**: $2-5k USD/mes por dashboard custom.
- **Diferenciador vs encuestas**: data real, fresca, granular (no extrapolada).

#### B2B-2 · Aseguradoras (Sura, BCI, Mapfre)

> "Razas de alto riesgo de displasia de cadera: tasa real en nuestro pool. Ajusta tus pólizas."

- **Producto**: actuarial insights — incidencia real de patologías por raza, edad, comuna.
- **Pricing**: % de cada póliza vendida vía Paw Friend (afiliación) + acceso anual al dataset.
- **Anti-fraude**: cuando aseguradora paga claim, escanea hocico → confirma identidad pet (evita doble cobro).

#### B2B-3 · Retail pet (Master Dog, Falabella Pet, Puppis, Pet Star)

> "Crea bundles: 'kit Pastor Suizo cachorro' con los productos que más compran ese segmento real, no por intuición."

- **Producto**: recomendaciones automáticas por pet (alimento + juguete + accesorio adecuado por raza/edad/preferencias).
- **Pricing**: comisión por venta atribuida + suscripción mensual al motor recomendador.
- **UX**: "Paw Friend te recomienda, Master Dog te lo entrega".

#### B2B-4 · Gobierno / municipios (Ley 21.020)

> "Distribuye campañas de vacunación obligatoria con precisión: 1.347 perros sin antirrábica al día en Maipú, ubicados aquí."

- **Producto**: heatmaps de cumplimiento Ley 21.020 a nivel comuna/ZIP.
- **Pricing**: contrato anual con municipalidad o SEREMI Salud.
- **Win-win**: cumple su mandato + valida nuestro data layer.

#### B2B-5 · Academia / investigación

> "Nuestro dataset de 50k pets longitudinales con biometría permanente es único en LATAM."

- **Producto**: acceso anonimizado al dataset para tesis, papers, estudios epidemiológicos.
- **Pricing**: licencias institucionales (Universidad, hospital).
- **Reputacional**: "data citada en Nature Veterinary Research" → trust signal para B2C.

---

## 4. Promociones dirigidas (in-app)

Cada pet con Paw Shield tiene perfil rico → permite **promociones server-side** que no se pueden falsear:

| Trigger | Promoción dirigida |
|---|---|
| Pet llega a tienda partner (scan) | "Saluda a Kai con 15% descuento en Pro Plan Pastor Adulto" (inferido desde su raza+edad) |
| Pet cumple años (`birth_date`) | "Kai cumple 5 hoy 🎂 Master Dog te regala un hueso" |
| Vacuna venciendo en 30 días | "Recordatorio: anti-rabia de Kai vence el 15 mayo. Reserva con Dra. Sofía a 1 click" |
| Cambio de etapa (cachorro → adulto) | "Hora de cambiar a Royal Canin Junior → Adult" |
| Cambio de comuna (mudanza detectada) | "Vets cerca de tu nuevo barrio en Ñuñoa" |
| Hermano genético detectado en base | "Paw match found 🧬: Kai tiene un hermano viviendo en Vitacura. ¿Quieres conectar?" |

---

## 5. Insights públicos (SEO + viralidad)

Con suficiente data + Paw Shield identifiable, podemos publicar:

- **"Top 10 razas más comunes en Las Condes 2026"** (SEO chileno, link bait)
- **"Edad promedio de un Pastor Suizo en Chile"** (dato real, no inventado)
- **"Costos reales de mantener un perro grande vs chico"** (cruzando compras reales)
- **"Mapa de razas raras en Chile"** (interactivo, con privacy threshold k>=50)

Estos contenidos hoy NO existen en el internet chileno — somos los únicos que podemos generarlos con data real.

---

## 6. Implementación priorizada

### Sprint inmediato (ya en código, falta activar)

1. ✅ `paw-shield-register` edge fn con dedup server-side
2. ✅ `paw-shield-identify` edge fn pública
3. ✅ `PawShieldEnrollment` componente (video 3 seg + 3 frames)
4. ✅ `PawShieldStatusCard` en tab Identidad
5. ✅ Migración SQL `pets.petify_*` + `paw_shield_events`
6. ⏸️ **Pedro**: firmar contrato comercial Petify (PoC en evaluación)
7. ⏸️ **Pedro**: activar `PAW_SHIELD_PETIFY=true` cuando contrato OK

### Sprint corto (post-firma Petify, 1-2 semanas)

8. **Anti-explosión cost guards**:
   - Cron mensual: cuentas inactivas >12m → `DELETE /v2/pets/{id}` en Petify
   - Quota dashboard admin: contador de pets activos en Petify (alerta si >threshold)
9. **Vet check-in biométrico**: feature en `/provider/dashboard` para que vet escanee al paciente
10. **Onboarding express**: "Escanea para identificar si esta mascota ya existe" antes del flow normal de creación

### Sprint medio (1-3 meses)

11. **Tienda partner SDK**: endpoint público + widget JS embeddable para que partners integren scan-to-discount
12. **Lost-and-found pasivo**: cron que cruza fotos del feed con `lost_pets`
13. **Cross-app interop**: documentación pública + API key tier para terceros

### Sprint largo (3-6 meses, requiere data acumulada)

14. **Pharma dashboards** (segmentación raza × comuna × edad × salud)
15. **Insurance actuarial reports** (incidencia patologías por raza)
16. **Retail recommendation engine** (kit por pet)
17. **Public insights pages** SEO (razas chilenas, costos reales, etc.)

---

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Activación masiva descontrolada → costo Petify >$10k/mes | Media | Alto | Default OFF + fricción positiva opt-in + alert dashboard admin |
| Petify cambia precios o se cae | Baja | Alto | Mantener pipeline propio en backstop; foto raw archive ya existe |
| Falsos positivos revelan dueño equivocado | Baja | Crítico | UNIQUE constraint + threshold 92 + ambiguous_match si gap<5 + UI muestra "varias parecidas" |
| Petify lock-in (no exportan embeddings) | Media | Medio | Foto raw archive nuestro → re-train modelo propio si decidimos salir |
| Datos sensibles se filtran a B2B | Baja | Crítico | k-anonymity threshold >=50 + agregaciones antes de exponer |
| Partner mal integrado expone API key | Media | Medio | API keys per-partner + rate limit + log per-key |

---

## 8. Métricas de éxito (medir 90 días post-activación)

| Métrica | Target Q1 | Target Q4 |
|---|---|---|
| % pets con Paw Shield activo | 15% | 30% |
| Costo Petify mensual | <$200 USD | <$3k USD |
| Identifies/mes (free) | 1k | 50k |
| Lost-and-found recoveries reportadas | 1 | 10/mes |
| B2B deals activos (pharma+seguros+retail) | 0 | 3 |
| Revenue B2B/Costo Petify | n/a | >5x |

---

## 9. Próximas decisiones que requieren input

1. **Pricing Petify**: una vez recibida la propuesta, evaluar si tier estándar 1k-10k pets es razonable o pedir custom desde menos.
2. **Free tier para partners**: ¿damos identifies gratis hasta cierto volumen para incentivar adopción del SDK, o cobramos desde el primer scan?
3. **Política de retención**: ¿cuánto tiempo guardamos foto raw del enrollment? Implica storage cost + privacy.
4. **Etiquetado especies extras**: ¿soportamos solo DOG/CAT (lo que ofrece Petify) o agregamos otros con fallback al QR/microchip?

---

**Última actualización**: 2026-04-29
**Owner**: Pedro
**Reviewer técnico**: Claude (sesión actual)
