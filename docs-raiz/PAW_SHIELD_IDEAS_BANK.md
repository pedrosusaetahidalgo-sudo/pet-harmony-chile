# Paw Shield · Banco de ideas explotables

> ⚠️ **DORMIDO desde 2026-04-30 (Opción C)**: la biometría Paw Shield está
> fuera del modelo consumer. Las 24 ideas RICE-priorizadas siguen siendo
> válidas como roadmap para una eventual reactivación B2B-funded. Mantener
> como **catálogo de upside** que se aplica solo si un partner (aseguradora,
> pharma, municipio) financia el COGS Petify y activa la biometría en su
> cohort.
>
> **Fecha original**: 2026-04-29
> **Complementa**: [PAW_SHIELD_PLAYBOOK.md](./PAW_SHIELD_PLAYBOOK.md) (estrategia general).

---

## Recordatorios clave

> **Cuesta**: $1.50 USD/pet/mes (Petify SaaS).
> **No cuesta**: identifies/verifies sobre la base ya registrada.
> **Lema operativo**: "maximizar utilidad de los pets ya registrados, no maximizar cuántos registramos".

**Cada idea debe responder**:
1. ¿Aporta utilidad al **animal, dueño, vet o partner**? (regla del juego de Pedro)
2. ¿Aprovecha identifies ilimitados (margin 0) o registra mascotas nuevas (margin negativo)?
3. ¿La data resultante es vendible o solo es vanity?

---

## Tabla maestra · 24 ideas, RICE-priorizadas

> RICE = (Reach × Impact × Confidence) / Effort. Escala 1-10. Higher = priorizar.

| # | Idea | Categoría | Reach | Impact | Conf | Effort | **RICE** | Beneficiario |
|---|---|---|---|---|---|---|---|---|
| 1 | Onboarding express con scan | UX dueño | 9 | 8 | 7 | 3 | **168** | Dueño |
| 2 | Vet check-in biométrico | B2B vet | 7 | 9 | 8 | 4 | **126** | Vet + dueño |
| 3 | Anti-robo refugios | B2B refugio | 6 | 10 | 8 | 4 | **120** | Refugio + dueño robado |
| 4 | Scan-to-discount tiendas | B2B retail | 8 | 7 | 7 | 5 | **78** | Tienda + dueño + Paw Friend (data) |
| 5 | Dashboard pharma raza×comuna×salud | B2B pharma | 5 | 10 | 7 | 6 | **58** | Pharma |
| 6 | Lost-and-found pasivo en feed | UX viral | 9 | 8 | 5 | 6 | **60** | Dueño perdido |
| 7 | Pet Login (escanear abre ficha) | UX dueño | 9 | 5 | 8 | 2 | **180** | Dueño |
| 8 | Quick switcher multi-pet | UX dueño | 5 | 6 | 8 | 2 | **120** | Dueño multi-pet |
| 9 | Aseguradora anti-fraude claims | B2B insurance | 4 | 10 | 6 | 5 | **48** | Aseguradora |
| 10 | Loyalty stamps biométrico tienda | B2B retail | 7 | 6 | 7 | 4 | **74** | Tienda + dueño |
| 11 | Recomendaciones por raza/edad/historial | UX + B2B retail | 9 | 8 | 8 | 5 | **115** | Dueño + retail |
| 12 | Promociones birthday biométrico | UX + B2B retail | 8 | 7 | 8 | 3 | **149** | Dueño + retail |
| 13 | Vacuna venciendo + auto-booking vet | UX + B2B vet | 9 | 9 | 8 | 4 | **162** | Dueño + vet |
| 14 | Hermanos genéticos detect | UX viral | 6 | 7 | 5 | 5 | **42** | Dueño + reproducción |
| 15 | Edificios pet-friendly (acceso) | B2B inmobiliario | 3 | 9 | 5 | 8 | **17** | Edificio + residente |
| 16 | Smart pet doors (hardware partner) | B2B + hardware | 2 | 9 | 4 | 9 | **8** | Dueño tech |
| 17 | Pet sitting verification | B2B servicios | 5 | 7 | 6 | 4 | **52** | Sitter + dueño |
| 18 | Adopción pre-check | B2B refugio | 6 | 8 | 7 | 3 | **112** | Refugio + adoptante |
| 19 | Municipio Ley 21.020 heatmap | B2B gobierno | 4 | 9 | 5 | 7 | **26** | Municipalidad |
| 20 | Concursos caninos verify | B2B eventos | 2 | 7 | 5 | 5 | **14** | Organizador |
| 21 | Insights públicos SEO | Marketing | 8 | 7 | 7 | 5 | **78** | Paw Friend reach |
| 22 | API pública para terceros | B2B tech | 3 | 9 | 5 | 7 | **19** | Apps competidoras |
| 23 | Cross-validation microchip + biometría | UX dueño | 6 | 8 | 7 | 4 | **84** | Dueño + Ley 21.020 |
| 24 | Auto-tag fotos del feed | UX viral | 7 | 6 | 6 | 5 | **50** | Dueño |

---

## Top 5 por RICE — atacar primero

### #7 · Pet Login (RICE 180) — 1 día
**Concepto**: usuario abre la app, escanea hocico → se abre directo la ficha clínica del pet (sin elegir de lista).

- **Quién paga**: nadie nuevo. Es UX delight que aumenta retención.
- **Cómo se ve**: botón "Buscar mi mascota 📷" en /home → cámara → match → push directo a `/ficha/{pet_id}`.
- **Por qué prioriza**: usa identify gratis, baja fricción, alto reach (todo dueño multi-pet).
- **Risk**: si match es el pet equivocado, abre ficha incorrecta → confusión. Mitiga con score≥95 o muestra confirmación "¿es Kai?".
- **Implementación**: 1 botón nuevo en /home + reuse de `paw-shield-identify`.

### #1 · Onboarding express con scan (RICE 168) — 2 días
**Concepto**: en lugar de formulario "agrega mascota", el dueño escanea hocico:
1. Si hay match → "¿es esta mascota tuya?" → claim flow.
2. Si no hay match → seguimos a formulario normal de creación.

- **Quién paga**: nadie. Es magia UX.
- **Por qué prioriza**: aumenta conversión de signup en ~15-20% (estimado), evita duplicados ANTES de crear.
- **Risk**: si Petify se cae, fallback al formulario tradicional (graceful degradation).
- **Implementación**: nueva primera pantalla en `/add-pet` antes del wizard.

### #13 · Vacuna venciendo + auto-booking vet (RICE 162) — 3 días
**Concepto**: 30 días antes de vencimiento de vacuna, push: "antirrábica de Kai vence el 15 mayo. ¿Reservas con Dra. Sofía? [1 click]".

- **Quién paga**: vet (comisión por booking) + farmacia veterinaria (recordatorio dispara compra).
- **Por qué prioriza**: alta utilidad real para dueño + revenue para vet partner. Identify no se usa pero el scan al check-in del vet sí.
- **Risk**: spam si abusamos. Limit 1 push/semana/pet.
- **Implementación**: cron diario que lee `medical_records.next_date` + crea push notif.

### #12 · Promociones birthday biométrico (RICE 149) — 2 días
**Concepto**: día del cumple del pet (`pets.birth_date`), tienda partner manda regalo virtual:
- "🎂 Kai cumple 5 hoy. Master Dog te regala 20% en su comida favorita."
- Dueño llega a tienda → escanea hocico de Kai → tienda valida cupón.

- **Quién paga**: tienda partner (comisión + visibilidad).
- **Por qué prioriza**: data dispara la promo, biometría asegura que es el pet real (no fraude).
- **Risk**: bajo. Es opt-in del partner.
- **Implementación**: cron birthday que crea cupón + integración mínima con tienda partner.

### #2 · Vet check-in biométrico (RICE 126) — 4 días
**Concepto**: vet integra widget en su software → mascota llega → escanea hocico → ficha abre automática.

- **Quién paga**: vet (suscripción mensual al SDK / widget).
- **Por qué prioriza**: -30% tiempo recepción + diferenciador único + B2B recurrente.
- **Risk**: requiere desarrollo de SDK/widget que pueda embeberse fuera de Paw Friend.
- **Implementación**: endpoint público autenticado per-vet + embed JS minimal.

---

## Categorización por tipo de monetización

### A. Generan REVENUE directo

| Idea | Quién paga | Modelo | Volumen target |
|---|---|---|---|
| Dashboard pharma | Centrovet, Virbac, Zoetis, MSD | $2-5k USD/mes/dashboard | 1 deal Q3 |
| Aseguradora actuarial | Sura, BCI, Mapfre | % de póliza vendida + acceso anual | 1 deal Q4 |
| Retail recommendations | Master Dog, Falabella, Puppis | Comisión por venta + suscripción motor | 1 deal Q3 |
| Vet check-in widget | Vet individuales/clínicas | $9.9k CLP/mes (alineado a Premium) | 50 vets Q4 |
| Scan-to-discount tienda | Pet Star, tiendas locales | $30-50k CLP/mes/tienda fee | 10 tiendas Q4 |
| Municipios Ley 21.020 | Municipalidades | Contrato anual ~$3-10M CLP | 1 piloto Q4 |
| API pública para terceros | Apps competidoras | $200/mes tier dev | 5 clientes Y2 |

### B. Generan DATA (vendible después)

| Idea | Data que genera |
|---|---|
| Scan-to-discount tienda | Compras reales por raza × edad × comuna |
| Vet check-in | Frecuencia visitas vet por demografía |
| Recomendaciones por raza | Match real entre sugerido vs comprado |
| Lost-and-found pasivo | Patterns geo de mascotas perdidas |
| Cross-validation microchip | Coverage real Ley 21.020 |

### C. Generan ENGAGEMENT (retención)

| Idea | Métrica que mueve |
|---|---|
| Pet Login | DAU/WAU |
| Quick switcher multi-pet | Sesiones por user |
| Promociones birthday | Push open rate |
| Hermanos genéticos | Compartidos / virality |
| Auto-tag fotos del feed | Posts con engagement |

---

## Razas + alimento + remedios + enfermedades + juguetes (idea de Pedro)

> "Asociar razas con tipos de alimento, remedios, enfermedades, juguetes."

Esto es el **MOTOR DE RECOMENDACIONES**. Diseño:

### Tabla DB nueva: `breed_profile`

```sql
CREATE TABLE breed_profile (
  breed_slug TEXT PRIMARY KEY,
  species TEXT NOT NULL CHECK (species IN ('DOG', 'CAT')),
  size_category TEXT NOT NULL,  -- toy, small, medium, large, giant
  energy_level SMALLINT NOT NULL CHECK (energy_level BETWEEN 1 AND 5),

  -- Cuidados nutricionales
  recommended_food_brands JSONB,  -- [{ brand, age_stage, why }]
  food_allergies_common TEXT[],

  -- Salud predictiva
  common_diseases JSONB,  -- [{ name, symptoms, prevention, age_onset }]
  vaccine_schedule_recommended JSONB,
  antiparasitic_frequency_months SMALLINT,

  -- Juguetes y accesorios
  recommended_toys JSONB,  -- [{ type, why, partner_link }]
  exercise_minutes_daily SMALLINT,

  -- Metadata
  origin_country TEXT,
  life_expectancy_years SMALLINT,
  source TEXT,  -- AKC, FCI, Royal Canin breed library, etc.
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Cómo se llena

**Fase 1 (1-2 semanas)**: seed manual de las 30 razas más comunes en Chile.
- Source: Royal Canin Breed Library, AKC, vets locales (Sofía).
- Output: 30 filas curadas, validadas por vet partner.

**Fase 2 (3-6 meses, post-data)**: enriquece con compras reales de partners + tendencias en tiendas asociadas.

### Cómo se usa

#### Sugerencias en la ficha del pet
> "Kai es Pastor Suizo Adulto. Recomendamos: Royal Canin Maxi Adult, control anual displasia cadera, juguetes de masticar resistentes."

- Aparece en tab Identidad de la ficha cuando `breed_profile` matchea la `pets.breed`.
- Cada recomendación lleva CTA → tienda partner + booking vet.

#### Promociones dirigidas push
- Si pet cumple edad-stage trigger ("Kai pasa de Junior a Adult"): push con marca recomendada para esa transición.
- Si pet llega a edad alta de riesgo enfermedad: "Empieza ahora con suplemento articular Cosequin."

#### Para B2B retail
> "Tu top 3 productos más recomendados por Paw Friend para Pastor Suizo: vendiste 47 unidades este mes."

#### Para B2B pharma
> "El 23% de los Pastor Suizo en LC NO tienen vacuna anti-leishmaniasis. Tu campaña digital tiene 312 leads calificados aquí."

---

## Preferencias de comida (idea Pedro) — extension de #11

### Tabla DB nueva: `pet_food_preferences`

```sql
CREATE TABLE pet_food_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,

  -- Lo que come
  current_brand TEXT NULL,         -- "Royal Canin"
  current_product TEXT NULL,        -- "Maxi Adult"
  current_protein TEXT NULL,        -- "pollo", "salmón", "cordero"
  current_form TEXT NULL,           -- "seco", "húmedo", "BARF", "mixto"

  -- Restricciones
  allergies TEXT[],                 -- ["pollo", "trigo"]
  conditions_diet TEXT[],           -- ["renal", "diabetes", "obesidad"]

  -- Comportamiento
  acceptance_score SMALLINT NULL CHECK (acceptance_score BETWEEN 1 AND 5),
  -- 1=rechaza/come poco, 5=devora

  -- Compras (data viva)
  last_purchase_at TIMESTAMPTZ NULL,
  last_purchase_partner TEXT NULL,
  purchase_frequency_days SMALLINT NULL,  -- promedio entre compras

  -- Recomendaciones aceptadas/rechazadas (signal para learn)
  recs_history JSONB,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Cómo se enriquece

1. **Onboarding**: pregunta opcional "¿qué come Kai?" en el wizard.
2. **Compras tracked** (#4 scan-to-discount): cada compra agrega timestamp + brand/product.
3. **Vet visit transcripts** (existing edge fn): si vet menciona dieta especial en la consulta, parsear y guardar.
4. **Notes IA del dueño**: "Kai está flojo con la comida" → procesa señal.

### Cómo se monetiza

- **Dashboard retail**: "Pet Star Vitacura tiene 47 clientes regulares con Pastor Suizo Adulto comprando Pro Plan. Bundle ofrecido por Paw Friend convirtió 18%."
- **Cross-sell**: dueño recibe "🐾 Llevas 60 días con la misma marca de Kai. Probá esta opción premium con 25% off."
- **Switch detection**: si pet baja `acceptance_score`, "¿problema digestivo? Estas marcas funcionan para Pastor Suizo sensibles."

---

## Microchip + biometría (idea Pedro)

> "Hasta integrarlo con el chip quizás."

### Lectura del chip + scan biométrico

**Concepto**: vet/refugio tiene un lector de chip ISO 11784/11785 + cámara → escanea ambos al ingreso de un perro encontrado:

- Si chip leído + nuestro `pets.microchip_number` matchea → dueño identificado por la **vía oficial** (Ley 21.020).
- Si match biométrico + chip no leído (chip dañado, no implantado) → fallback al **dueño implícito** vía Petify.
- Si chip leído pero NO match biométrico (suplantación) → alerta de fraude.

**Beneficio único**: somos los únicos que pueden detectar **fraude de chip** (mascota con chip clonado o reimplantado).

### Implementación

- **Hoy**: ya tenemos `pets.microchip_number`. Solo falta cross-reference cuando llega un escaneo desde refugio/vet.
- **Mediano plazo**: alianza con Registro Nacional de Mascotas (proyecto SAG/Minsalud).
- **Long-tail**: cobrar a SAG/municipalidad por validación de doble factor (chip + biometría) que descarta perros robados.

---

## Activación de funciones especiales en la app (idea Pedro)

> "Activar alguna función en la app especial."

### Ideas concretas

| Función | Cómo se activa | Para qué |
|---|---|---|
| **Modo viaje** | Escanear pet 1x al iniciar viaje | Activa ubicación en vivo + emergencia 24/7 + medicación pre-cargada |
| **Modo paseo** | Scan al llamar paseador | Tracking del paseo + auto-pago al llegar (si sitter integrado) |
| **Modo guardería** | Refugio escanea al recibir | Activa registro temporal + notificación al dueño cada 4h |
| **Modo médico crítico** | Vet escanea pre-cirugía | Bloquea ficha clínica para edición + audit log granular |
| **Modo herencia** | Dueño escanea + selecciona heredero | Co-ownership flow accelerated (si dueño fallece, contacto secundario) |
| **Modo migración** | Scan al cambiar país/comuna | Verifica vacunas internacionales requeridas + agenda recordatorios |

Todas usan identify ilimitado (sin costo extra).

---

## Quick wins recomendados para los próximos 14 días

Asumiendo flag `PAW_SHIELD_PETIFY: true` y al menos 100 pets registrados:

### Día 1-3: Pet Login + Onboarding express (#7 + #1)
- Más alto RICE, menos esfuerzo, pega directo al UX
- Usa solo identify (gratis)

### Día 4-7: Recordatorio vacuna + auto-booking (#13)
- Cron diario, alta utilidad medible
- Engancha vets como partner (CTA al booking)

### Día 8-14: Birthday promo + breed_profile seed (#12 + parcial #11)
- Queda lista la base de datos para todas las recommendations futuras
- 30 razas curated → cubre ~80% del pool real

---

## Ideas anti-explosión de costo (críticas)

> "Que no se nos escape de las manos."

### Hard limits

1. **Cap de pets registrados por mes**: si superamos 5x el target proyectado, freno automático en backend (la edge fn `paw-shield-register` retorna `quota_exceeded`).
2. **Geofence**: solo pets con `comuna IN (regiones_chile)` en una primera fase. Bloquea registros desde fuera.
3. **Cooldown post-failure**: si un dueño falla 3 veces seguidas, lock de 24h antes de reintentar (anti-loop).

### Cleanup automático

```sql
-- Cron mensual: pets de cuentas inactivas >12m → DELETE en Petify + flag local
SELECT id, petify_pet_id FROM pets
WHERE petify_pet_id IS NOT NULL
  AND owner_id IN (
    SELECT id FROM auth.users WHERE last_sign_in_at < NOW() - INTERVAL '12 months'
  );
-- Edge fn cleanup-inactive-petify llama DELETE /v2/pets/{id} para cada uno
```

### Dashboard admin

- Pets activos en Petify: contador en /admin con bandas (verde / amarillo / rojo).
- Forecast costo mensual: extrapola tasa de activación últimas 4 semanas.
- Alert por email: si proyección excede budget → push a Pedro.

---

## Riesgos por idea (matriz)

| Idea | Riesgo principal | Mitigación |
|---|---|---|
| #1 Onboarding scan | Match falso → claim incorrecto | Threshold ≥95 + confirmation step |
| #4 Scan-to-discount tienda | Tienda comparte API key | Rotar keys mensual + log per-key |
| #5 Dashboard pharma | Privacy threshold violado | k-anonymity ≥50 + agregar antes de exponer |
| #6 Lost-and-found pasivo | Foto de pet en feed = pet de otro | Solo cruzamos contra `lost_pets` con consent activo |
| #14 Hermanos genéticos | Información sensible (origen/criadero) | Opt-in explícito + no exponer detalle al match |
| #15 Edificios pet-friendly | Cámara H24 en accesos | Privacidad: solo procesamos al momento del scan, no archive |

---

## Próximas conversaciones a tener con partners

| Partner | Ask | Producto a vender |
|---|---|---|
| **Sofía Rosi** (vet beta) | Validar idea #2 + #13 | Vet check-in widget + auto-booking |
| **Centrovet** (Agrosuper) | Pitch dashboard pharma | #5 |
| **Master Dog** | Piloto scan-to-discount + breed_profile seed | #4 + #11 |
| **Sura/BCI/Mapfre** | Anti-fraude claims | #9 |
| **SAG** o **Munis** | Heatmap Ley 21.020 | #19 + #23 |
| **Refugios chilenos** (8 en outreach) | Anti-robo en ingreso | #3 |

---

**Última actualización**: 2026-04-29
**Owner ideación**: Pedro
**Próxima revisión**: post-firma contrato Petify (esperando email de equipo Petify).
