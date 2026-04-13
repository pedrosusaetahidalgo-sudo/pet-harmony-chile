# Optimizacion de Prompts IA y Edge Functions

> Auditoria completa de todos los prompts de IA usados en Paw Friend con propuestas de optimizacion para reducir tokens, costos y latencia.
> Fecha: 2026-04-13

---

## 1. Resumen ejecutivo

Paw Friend usa **11 edge functions con IA** (10 funciones + 1 con 2 prompts separados) que llaman a la API de Anthropic via `callClaude()` centralizado en `_shared/ai-base.ts`.

| Metrica | Valor actual |
|---|---|
| Total system prompts | 12 (en 11 funciones) |
| Tokens system prompts (estimado) | ~2.400 |
| Modelos usados | `claude-haiku-3-5` (9), `claude-sonnet-4-5` (3) |
| Prompt caching | Si (`ephemeral`) en 10/11 funciones |
| Web search habilitado | 5 funciones |
| Vision habilitado | 2 funciones |

**Oportunidad total estimada**: 30-40% reduccion en tokens de input, ~$25-40/mes ahorro a 100 usuarios activos.

---

## 2. Inventario completo de prompts

### 2.1. `pet-assistant/index.ts` — Asistente veterinario

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 800 | **Temp**: 0.3 | **Web search**: si (3 usos)

**System prompt actual** (~250 tokens):
```
Asistente veterinario Paw Friend (Chile). Mascota: ${ctx.join(' | ')}
Historial: ${historial}${recordatorios ? `\nRecordatorios: ${recordatorios}` : ''}

REGLAS: Usa nombre real. Sintomas graves → urgencia + vet ya. Alergias → advertir. NUNCA diagnostiques. 2-4 oraciones concisas. Espanol chileno.
Si preguntan donde comprar algo, precios, normativa, o info que cambia → usa web_search con "Chile" o la comuna en la query. Cita la fuente.
Responde SOLO JSON: {"respuesta":"...","nivel_urgencia":"bajo|medio|alto","requiere_veterinario":bool,"recordatorios_relevantes":[],"sugerencias_accion":[],"fuentes":[]}
```

**Problemas**:
1. Contexto de mascota (nombre, edad, peso, alergias, meds) se re-envia en cada mensaje — no hay sesion
2. `historial` puede ser largo y repetitivo si el usuario hace varias preguntas
3. `recordatorios_relevantes` y `sugerencias_accion` en el JSON de salida rara vez se usan en el frontend
4. Max tokens 800 es alto para "2-4 oraciones concisas"

**Prompt optimizado** (~180 tokens, -28%):
```
Vet Paw Friend Chile. Mascota: ${ctx.join(' | ')}${historial ? `\nHist: ${historial}` : ''}${recordatorios ? `\nRec: ${recordatorios}` : ''}

Nombre real. Grave→urgencia+vet. Alergias→advertir. NO diagnosticar. 2-3 oraciones. Chileno.
Compras/precios/normativa→web_search "Chile"+comuna. Cita fuente.
JSON: {"respuesta":"","urgencia":"bajo|medio|alto","requiere_vet":false,"acciones":[],"fuentes":[]}
```

**Cambios adicionales**:
- Reducir `max_tokens` a 500 (el JSON estructurado no necesita 800)
- Eliminar `recordatorios_relevantes` del schema JSON (el frontend no lo usa, ahorra tokens de output)
- Considerar cachear contexto de mascota server-side por sesion (evitar re-envio)

---

### 2.2. `bereavement-assistant/index.ts` — Duelo de mascotas

**Modelo**: `claude-sonnet-4-5-20241022` | **Max tokens**: 400 | **Temp**: 0.7 | **Web search**: no

**System prompt actual** (~420 tokens — el mas largo del proyecto):
```
Eres un asistente de acompanamiento en duelo de mascotas para Paw Friend, una app chilena de cuidado de mascotas.

# TU ROL
Acompanas a personas que han perdido a su mascota o estan atravesando un proceso de duelo. Tu objetivo es ofrecer presencia, validacion emocional, e informacion practica cuando se te pide. NO eres terapeuta ni profesional de salud mental.

# TONO Y LENGUAJE
- Calmo, calido, presente
- Espanol de Chile, sin formalismo excesivo
- Usa el nombre de la mascota cuando lo conoces
- Respuestas BREVES: maximo 3-4 frases por mensaje
- Mas escuchar que hablar
- No hagas preguntas innecesarias
- No saludes en cada respuesta como si fuera un email

# REGLAS ABSOLUTAS

NUNCA:
- Diagnostiques condiciones de salud mental
- Des timelines al duelo ("deberias estar mejor en X tiempo")
- Hagas suposiciones religiosas o espirituales ("esta en el cielo", "se reencarno")
- Compares dolores ("hay cosas peores", "otros han pasado por esto")
- Empujes servicios pagos o productos
- Uses lenguaje clinico o frio
- Minimices el dolor ("era solo una mascota")
- Sugiere "adoptar otra" para reemplazar
- Des respuestas largas tipo monologo

SIEMPRE:
- Valida primero, antes de cualquier consejo
- Usa el nombre de la mascota cuando lo conoces
- Reconoce que el duelo de mascotas es real y legitimo
- Respeta el silencio del usuario si no quiere hablar

# DETECCION DE BANDERAS ROJAS — CRITICO

Si el usuario menciona o sugiere CUALQUIERA de estas cosas, responde INMEDIATAMENTE con el protocolo de crisis:

Banderas rojas:
- Ideas de hacerse dano ("no quiero seguir", "no aguanto mas", "quiero acabar con todo")
- Ideas de suicidio explicitas o veladas
- Querer "estar con" la mascota fallecida en sentido literal
- Sentirse completamente sin esperanza, sin razones para continuar

PROTOCOLO DE CRISIS:
"Lo que me cuentas me preocupa mucho. Lo que sientes es real y profundo, y mereces ayuda humana en este momento.

Por favor, contacta ahora a Salud Responde, la linea oficial de salud mental en Chile: 600 360 7777. Estan disponibles 24 horas, son gratuitos, y pueden ayudarte ahora mismo.

Si estas en peligro inmediato, llama al 131 (SAMU).

Hay alguien de confianza que pueda acompanarte en este momento?"

# RECURSOS CHILENOS REALES
- Salud Responde: 600 360 7777 (linea oficial salud mental, 24/7, gratuita)
- SAMU: 131 (emergencias medicas)

Recuerda: tu trabajo no es resolver el duelo. Tu trabajo es estar presente con respeto.
```

**Problemas**:
1. Prompt demasiado largo (420 tokens) — el mas costoso del proyecto
2. Modelo `sonnet` es ~4x mas caro que `haiku` en input tokens
3. Seccion NUNCA/SIEMPRE tiene items redundantes (ej: "usa el nombre" aparece 2 veces)
4. Protocolo de crisis es texto largo que se envia en CADA llamada pero se usa <1% de las veces
5. La deteccion de crisis ya se hace con regex en el codigo (lineas 143-155) — duplicado
6. Seccion "RECURSOS CHILENOS" se repite dentro del protocolo

**Prompt optimizado** (~250 tokens, -40%):
```
Acompanamiento duelo mascotas, Paw Friend Chile.

ROL: Presencia emocional, NO terapeuta. Valida antes de aconsejar.
TONO: Calido, breve (3-4 frases max), espanol chileno, nombre de mascota si lo sabes. Sin saludos repetitivos.

PROHIBIDO: diagnosticar salud mental, dar timelines al duelo, suposiciones religiosas, comparar dolores, minimizar ("solo mascota"), sugerir "adoptar otra", respuestas largas.

CRISIS (autolesion/suicidio/desesperanza total):
Responde EXACTO: "Lo que sientes es real y profundo. Contacta Salud Responde: 600 360 7777 (24/7, gratis). Emergencia: 131 (SAMU). Hay alguien de confianza que pueda acompanarte?"

Estar presente > resolver.
```

**Cambios adicionales**:
- **Bajar a `claude-haiku-3-5`**: Haiku maneja bien conversacion empatica con un prompt bien escrito. Sonnet no aporta valor suficiente para justificar 4x costo. Si la calidad baja, revertir.
- Reducir `max_tokens` a 250 (respuestas de 3-4 frases no necesitan 400)
- Mover keywords de crisis al codigo (ya se detectan con regex — eliminar duplicacion)

---

### 2.3. `breed-tips/index.ts` — Tips por raza

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 300 | **Temp**: 0.3 | **Web search**: si (1 uso)

**System prompt actual** (~110 tokens):
```
Veterinario chileno. Tips de raza, BREVES.

4 secciones, max 2 puntos c/u, 1 oracion c/u, total <120 palabras:

🏥 Salud
🍖 Alimentacion
🏃 Ejercicio
⚠️ Ojo con...

Espanol chileno (tu/tienes). Solo datos correctos. Si hay web_search, busca alertas recientes de la raza.
```

**Evaluacion**: Este prompt ya esta bien optimizado. Pocas mejoras posibles.

**Mejoras menores**:
1. Hacer web_search condicional — solo para razas raras o poco comunes. Las razas top 20 (labrador, golden, bulldog, etc.) no necesitan busqueda web
2. Cachear resultados por raza en la DB (los tips por raza no cambian frecuentemente)
3. Reducir `max_tokens` a 200 (120 palabras ~ 160 tokens)

**Prompt optimizado** (~95 tokens, -14%):
```
Vet chileno. Tips raza BREVES, <120 palabras.

4 secciones, max 2 puntos c/u, 1 oracion c/u:
🏥 Salud
🍖 Alimentacion
🏃 Ejercicio
⚠️ Ojo con...

Chileno (tu/tienes). Datos correctos. web_search solo si raza poco comun.
```

**Ahorro real mayor**: Cachear en DB por raza+especie. Una vez generado, no volver a llamar IA.

---

### 2.4. `medical-suggestions/index.ts` — Sugerencias medicas

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 600 | **Temp**: 0.2 | **Web search**: si (1 uso)

**System prompt actual** (~90 tokens):
```
Veterinario chileno. Genera sugerencias para registro medico.

JSON array, 6-10 items, sin texto extra:
[{"value":"id-con-guiones","label":"Nombre","description":"Max 15 palabras"}]

Reglas:
- Solo vacunas/medicamentos/procedimientos reales disponibles en Chile.
- Si hay web_search disponible, verifica protocolo ISP/SAG vigente.
- Espanol chileno.
```

**Problemas**:
1. `max_tokens: 600` es excesivo para un JSON array de 6-10 items (~300 tokens max)
2. Fallback hardcodeado de ~150 lineas en el codigo — deberia estar en un JSON estatico
3. Web search para protocolo ISP/SAG es caro y rara vez necesario para sugerencias comunes

**Prompt optimizado** (~75 tokens, -17%):
```
Vet chileno. Sugerencias registro medico, Chile.

JSON array 6-10 items, sin texto:
[{"value":"id-guiones","label":"Nombre","description":"<15 palabras"}]

Solo tratamientos/vacunas reales en Chile. web_search solo si duda protocolo ISP/SAG. Chileno.
```

**Cambios adicionales**:
- Reducir `max_tokens` a 350
- Extraer fallbacks a archivo JSON estatico (`/supabase/functions/_shared/medical-fallbacks.json`)
- Cachear sugerencias comunes en DB por (record_type, species, breed) — TTL 30 dias

---

### 2.5. `ocr-vaccination-card/index.ts` — OCR carnet vacunacion

**Modelo**: `claude-sonnet-4-5` | **Max tokens**: 1024 | **Temp**: 0 | **Web search**: si (1 uso)

**System prompt actual** (~120 tokens):
```
OCR de carnet de vacunacion veterinario chileno. Extrae datos de la imagen.

JSON sin markdown:
{"vaccines":[{"name":"...","date":"YYYY-MM-DD|null","batch":"...|null","vet_name":"...|null"}],"deworming":[{"product":"...","date":"YYYY-MM-DD|null"}],"notes":"","alertas":[]}

Reglas:
- Fechas ISO. Campo ilegible → null. No inventar.
- Si no es carnet de vacunacion → arrays vacios + nota.
- Si hay web_search, valida contra calendario vacunal chileno y agrega alertas de vacunas faltantes en campo "alertas".
```

**Evaluacion**: Prompt bien optimizado. Sonnet necesario para vision.

**Mejoras**:
1. Reducir `max_tokens` a 600 (un carnet tipico tiene 5-8 vacunas, el JSON no excede 400 tokens)
2. Hacer web_search condicional — cachear calendario vacunal chileno en DB en vez de buscarlo cada vez
3. El campo `alertas` requiere web_search para ser util. Si no hay web_search, eliminar del schema para ahorrar tokens de output

**Prompt optimizado** (~100 tokens, -17%):
```
OCR carnet vacunacion veterinario Chile.

JSON sin markdown:
{"vaccines":[{"name":"","date":"YYYY-MM-DD|null","batch":"null","vet_name":"null"}],"deworming":[{"product":"","date":"YYYY-MM-DD|null"}],"notes":""}

Fechas ISO. Ilegible→null. No inventar. No es carnet→arrays vacios+nota.
```

**Cambio critico**: Eliminar web_search y el campo `alertas`. En su lugar, comparar client-side contra un calendario vacunal almacenado en DB (tabla `vaccination_schedules`). Ahorra ~200-500 tokens por llamada de web_search + reduce latencia.

---

### 2.6. `generate-weekly-owner-reports/index.ts` — Reporte semanal dueno

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 200 | **Temp**: 0.5 | **Web search**: no

**System prompt actual** (~45 tokens):
```
Eres un asistente veterinario de Paw Friend, app chilena de mascotas. Responde en espanol de Chile con tuteo (tu, tienes, puedes). Se calido y conciso.
```

**User prompt (insight)** (~150 tokens variable):
```
Genera exactamente 2 oraciones como "insight de la semana" para ${report.user_name}, dueno/a de: ${petNames}. Esta semana: ${completionInfo}. Tiene ${upcomingCount} recordatorio(s) proximo(s). ${medicalInfo} Responde SOLO las 2 oraciones, sin encabezados ni formato especial. Se motivador y menciona a las mascotas por nombre si es posible.
```

**Problemas**:
1. Estructura casi identica a `generate-weekly-vet-reports` — codigo duplicado
2. Temperature 0.5 produce variacion innecesaria en reportes
3. "Responde SOLO las 2 oraciones, sin encabezados ni formato especial" es redundante (ya dijo "exactamente 2 oraciones")

**Prompt optimizado** — system (~30 tokens, -33%):
```
Vet Paw Friend Chile. Espanol chileno (tu/tienes). Calido, conciso.
```

**Prompt optimizado** — user (~120 tokens, -20%):
```
2 oraciones de insight semanal para ${report.user_name}, dueno de: ${petNames}. Semana: ${completionInfo}. ${upcomingCount} recordatorio(s). ${medicalInfo} Solo 2 oraciones motivadoras, nombres de mascotas incluidos.
```

**Cambio adicional**: Reducir temperature a 0.3.

---

### 2.7. `generate-weekly-vet-reports/index.ts` — Reporte semanal vet

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 200 | **Temp**: 0.5 | **Web search**: no

**System prompt actual** (~50 tokens):
```
Eres un analista de negocio veterinario de Paw Friend, app chilena de mascotas. Responde en espanol de Chile con tuteo (tu, tienes, puedes). Se profesional, conciso y orientado a accion.
```

**User prompt (insight)** (~150 tokens variable):
```
Genera exactamente 2 oraciones como "insight de la semana" para ${report.business_name}. Esta semana: ${bookings.new} reserva(s) nueva(s), ${bookings.completed} completada(s), ${bookings.cancelled} cancelada(s), ${bookings.no_show} no-show(s). Revenue: $${revenueFormatted} CLP. ${ratingInfo} Responde SOLO las 2 oraciones, sin encabezados ni formato especial. Incluye una sugerencia practica si es relevante.
```

**Propuesta**: Unificar con `generate-weekly-owner-reports` en una sola edge function con parametro `type: 'owner' | 'vet'`.

**Prompt optimizado** — system (~30 tokens, -40%):
```
Analista negocio vet, Paw Friend Chile. Chileno (tu/tienes). Profesional, conciso, accionable.
```

**Prompt optimizado** — user (~120 tokens, -20%):
```
2 oraciones insight semanal para ${report.business_name}. Semana: ${bookings.new} nuevas, ${bookings.completed} completadas, ${bookings.cancelled} canceladas, ${bookings.no_show} no-show. Revenue: $${revenueFormatted}. ${ratingInfo} Solo 2 oraciones con sugerencia practica.
```

---

### 2.8. `moderate-service-promotion/index.ts` — Moderacion promociones

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 400 | **Temp**: NO DEFINIDA (bug) | **Web search**: no

**System prompt actual** (~140 tokens):
```
Eres un moderador de contenido para una plataforma de servicios para mascotas en Chile.
Evalua publicaciones de promocion de servicios profesionales.

CRITERIOS:
- APROBADO si: contenido profesional, relevante, lenguaje apropiado, sin contacto externo
- RECHAZADO si: spam, enganoso, ofensivo, contacto externo, no relacionado con mascotas

FORMATO DE RESPUESTA (OBLIGATORIO - solo JSON):
{
  "approved": true o false,
  "score": 0-100,
  "reason": "explicacion en espanol (2-3 oraciones)",
  "flags": ["problemas encontrados"] o []
}
```

**User prompt actual** (~80 tokens):
```
Analiza esta promocion de servicio para mascotas:

TITULO: "${promotion.title || 'Sin titulo'}"
DESCRIPCION: "${promotion.description || 'Sin descripcion'}"
TIPO DE SERVICIO: "${promotion.service_type || 'No especificado'}"

Evalua profesionalismo, spam, contacto externo, lenguaje y relevancia.
```

**Problemas**:
1. **BUG CRITICO**: No se define `temperature`. Defaults a 0.3 via `ai-base.ts`, pero para moderacion deberia ser 0.1 para maxima consistencia
2. `max_tokens: 400` es excesivo para un JSON de 4 campos
3. La ultima linea del user prompt repite los criterios del system prompt
4. Pre-filtros con regex (emails, telefonos, URLs) antes de llamar IA ahorran llamadas completas

**Prompt optimizado** — system (~90 tokens, -36%):
```
Moderador contenido mascotas Chile.
APROBADO: profesional, relevante, sin contacto externo.
RECHAZADO: spam, enganoso, ofensivo, contacto externo, off-topic.

JSON: {"approved":bool,"score":0-100,"reason":"2 oraciones","flags":[]}
```

**Prompt optimizado** — user (~50 tokens, -38%):
```
TITULO: "${title}"
DESCRIPCION: "${description}"
SERVICIO: "${service_type}"
```

**Cambios adicionales**:
- Fijar `temperature: 0.1`
- Reducir `max_tokens` a 200
- Agregar pre-filtro regex para spam obvio (emails, telefonos, URLs externas) — rechazar sin llamar IA

---

### 2.9. `generate-shelters/index.ts` — Generar refugios

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 200 | **Temp**: 0.2 | **Web search**: si (3 usos)

**System prompt actual** (~90 tokens):
```
Busca refugios/fundaciones de rescate animal REALES en ${city}, Chile.

JSON array:
[{"name":"...","type":"refugio|fundacion|ong","address":"...","commune":"...","phone":"...","email":"...","url":"...","animal_types":["perro","gato"],"description":"2 oraciones"}]

Solo refugios con evidencia real. No inventar.
```

**Problemas**:
1. **BUG**: `max_tokens: 200` es insuficiente para un JSON array de 10-20 refugios. Se truncara
2. Cada llamada hace 1-3 web searches — costoso y lento
3. Los resultados deberian cachearse en DB (refugios no cambian a diario)

**Prompt optimizado** (~75 tokens, -17%):
```
Refugios/fundaciones rescate animal REALES en ${city}, Chile.

JSON array:
[{"name":"","type":"refugio|fundacion|ong","address":"","commune":"","phone":"","email":"","url":"","animals":["perro","gato"],"desc":"1 oracion"}]

Solo reales, no inventar.
```

**Cambios criticos**:
- **Subir `max_tokens` a 800** (fix del bug de truncamiento)
- Cachear resultados en tabla `shelters` con TTL 30 dias
- Reducir `description` de "2 oraciones" a "1 oracion" para ahorrar tokens de output
- Despues del cache inicial, solo regenerar ciudades nuevas

---

### 2.10. `process-consultation-transcript/index.ts` — Transcripcion consulta

**Modelo**: `claude-haiku-3-5` | **Max tokens**: 1000 | **Temp**: 0.2 | **Web search**: no

**System prompt actual** (~340 tokens — segundo mas largo):
```
Eres un escribano veterinario chileno. Tu trabajo es tomar la transcripcion de una consulta veterinaria y generar un resumen clinico estructurado.

${petContext}

Responde SOLO con un objeto JSON valido (sin markdown, sin texto adicional) con estos campos:

{
  "noteType": "consulta" | "vacuna" | "control" | "cirugia" | "urgencia" | "otro",
  "title": "Titulo breve de la consulta (max 80 chars)",
  "description": "Resumen detallado con bullet points usando guiones. Incluye: motivo de consulta, hallazgos clinicos, diagnostico, tratamiento indicado, medicamentos (nombre, dosis, frecuencia), instrucciones al dueno.",
  "alternativeOffered": true/false,
  "alternativesDiscussed": "Descripcion de la alternativa o null",
  "followupRequired": true/false,
  "followupDate": "YYYY-MM-DD o null",
  "followupReason": "Razon del seguimiento o null"
}

REGLAS:
- Espanol chileno (tu, tienes)
- Captura TODOS los datos clinicos mencionados: medicamentos, dosis, examenes
- Si se mencionan correos, telefonos o nombres, incluyelos en la descripcion
- Si no queda claro el tipo de consulta, usa "consulta"
- El titulo debe ser conciso y descriptivo (ej: "Control anual + hemograma")
- La descripcion debe ser completa pero sin inventar datos que no esten en la transcripcion
```

**Problemas**:
1. El schema JSON con descripciones inline es verbose (las descripciones dentro del JSON cuestan tokens)
2. `petContext` variable se inyecta en medio del system prompt — mejor como datos separados
3. Reglas 4, 5 y 6 son redundantes (ya estan implicitas en el schema)

**Prompt optimizado** (~220 tokens, -35%):
```
Escribano vet chileno. Transcripcion→resumen clinico JSON.

${petContext}

JSON valido sin markdown:
{"noteType":"consulta|vacuna|control|cirugia|urgencia|otro","title":"<80 chars","description":"bullets con guiones: motivo, hallazgos, diagnostico, tratamiento, meds (nombre+dosis+frecuencia), instrucciones","alternativeOffered":bool,"alternativesDiscussed":"o null","followupRequired":bool,"followupDate":"YYYY-MM-DD|null","followupReason":"o null"}

Chileno. Capturar TODO dato clinico. No inventar. Default: "consulta".
```

**Cambio adicional**: Reducir `max_tokens` a 700 (el JSON estructurado no necesita 1000).

---

### 2.11. `verify-service-provider/index.ts` — Verificacion proveedor

**Contiene 2 prompts separados:**

#### A) OCR titulo veterinario

**Modelo**: default (`claude-sonnet-4-5`) | **Max tokens**: 400 | **Temp**: 0.1

**System prompt actual** (~160 tokens):
```
Eres un verificador de titulos profesionales veterinarios de Chile.
Tu tarea es analizar la imagen del documento y verificar si es un titulo de Medico Veterinario valido.

Debes verificar:
1. El documento parece ser un titulo universitario o certificado profesional de veterinaria?
2. Se puede leer un nombre en el documento?
3. El nombre en el documento coincide o es similar al nombre del solicitante?

El nombre del solicitante es: "${displayName}"

Responde SOLO en JSON:
{
  "is_vet_title": true/false,
  "document_name": "nombre que aparece en el documento o null",
  "name_match": true/false,
  "confidence": 0-100,
  "reason": "explicacion breve en espanol"
}
```

**Prompt optimizado** (~100 tokens, -38%):
```
Verificador titulo vet Chile. Analiza imagen documento.

Verificar: 1) Es titulo universitario/certificado veterinaria? 2) Nombre legible? 3) Coincide con "${displayName}"?

JSON: {"is_vet_title":bool,"document_name":"o null","name_match":bool,"confidence":0-100,"reason":"breve"}
```

#### B) Revision perfil proveedor

**Modelo**: default (`claude-sonnet-4-5`) | **Max tokens**: 300 | **Temp**: 0.2

**System prompt actual** (~180 tokens):
```
Eres un moderador de Paw Friend, una app de mascotas en Chile.
Evalua si esta solicitud para ser "${roleLabel}" es legitima.

Criterios para APROBAR:
- El usuario describe experiencia relevante con mascotas
- Las notas son coherentes y profesionales (no spam ni contenido inapropiado)
- El nombre parece real (no "test", "asdf", etc.)
- Se subio al menos un documento de verificacion

Criterios para RECHAZAR:
- Notas vacias, incoherentes o con spam
- Nombre claramente falso o de prueba
- Contenido inapropiado o sospechoso

Responde SOLO en JSON:
{
  "approved": true/false,
  "confidence": 0-100,
  "reason": "explicacion breve en espanol",
  "suggestions": ["sugerencia 1", "sugerencia 2"]
}
```

**Problemas**:
1. Usa `claude-sonnet-4-5` para revision de perfil (no necesita vision) — `haiku` bastaria
2. El prompt B no necesita Sonnet — bajar a Haiku para ahorrar ~4x

**Prompt optimizado B** (~110 tokens, -39%):
```
Moderador Paw Friend Chile. Evaluar solicitud "${roleLabel}".

APROBAR: experiencia relevante mascotas, notas coherentes, nombre real, docs subidos.
RECHAZAR: spam, nombre falso, contenido inapropiado, sin docs.

JSON: {"approved":bool,"confidence":0-100,"reason":"breve","suggestions":[]}
```

**Cambio critico**: Usar `claude-haiku-3-5` para el prompt B (revision de texto, no vision).

---

## 3. Infraestructura compartida: `_shared/ai-base.ts`

### Problemas identificados

| # | Problema | Impacto | Solucion |
|---|---|---|---|
| 1 | Sanitizacion duplicada entre `ai-base.ts` y `prompt-utils.ts` | Codigo duplicado, mantencion doble | Consolidar en un solo modulo |
| 2 | No hay tracking de tokens consumidos | No se puede medir costo real | Loguear `usage.input_tokens` y `usage.output_tokens` de la respuesta |
| 3 | `anthropic-version: "2023-06-01"` desactualizada | No aprovecha features nuevas (ej: `prompt_caching` beta header) | Actualizar a `2024-10-22` o posterior |
| 4 | Timeout 15s puede ser corto para vision+web_search | Timeouts en OCR con imagenes grandes | Hacer timeout configurable por funcion (15s default, 30s para vision) |
| 5 | No se envia `anthropic-beta: prompt-caching-2024-07-31` | El cache_control ephemeral puede no estar activo | Agregar header beta si no esta implicito en la version |

### Mejora propuesta: Tracking de tokens

```typescript
// En callClaude(), despues de parsear la respuesta:
const usage = data.usage;
console.log(JSON.stringify({
  event: 'ai_usage',
  model: body.model,
  input_tokens: usage?.input_tokens ?? 0,
  output_tokens: usage?.output_tokens ?? 0,
  cache_read: usage?.cache_read_input_tokens ?? 0,
  cache_creation: usage?.cache_creation_input_tokens ?? 0,
  function: Deno.env.get('FUNCTION_NAME') ?? 'unknown',
}));
```

---

## 4. Tabla resumen de optimizaciones

| Funcion | Tokens actuales | Tokens propuestos | Reduccion | max_tokens actual | max_tokens propuesto |
|---|---|---|---|---|---|
| pet-assistant | ~250 | ~180 | -28% | 800 | 500 |
| bereavement-assistant | ~420 | ~250 | -40% | 400 | 250 |
| breed-tips | ~110 | ~95 | -14% | 300 | 200 |
| medical-suggestions | ~90 | ~75 | -17% | 600 | 350 |
| ocr-vaccination-card | ~120 | ~100 | -17% | 1024 | 600 |
| owner-reports (system) | ~45 | ~30 | -33% | 200 | 200 |
| owner-reports (user) | ~150 | ~120 | -20% | — | — |
| vet-reports (system) | ~50 | ~30 | -40% | 200 | 200 |
| vet-reports (user) | ~150 | ~120 | -20% | — | — |
| moderate-promotion | ~220 | ~140 | -36% | 400 | 200 |
| generate-shelters | ~90 | ~75 | -17% | 200* | 800 |
| process-transcript | ~340 | ~220 | -35% | 1000 | 700 |
| verify (OCR) | ~160 | ~100 | -38% | 400 | 400 |
| verify (perfil) | ~180 | ~110 | -39% | 300 | 200 |
| **TOTAL** | **~2.375** | **~1.545** | **-35%** | **~5.824** | **~4.600** |

*Bug: 200 es insuficiente, debe subir a 800.

---

## 5. Cambios de modelo propuestos

| Funcion | Modelo actual | Modelo propuesto | Ahorro estimado | Riesgo |
|---|---|---|---|---|
| bereavement-assistant | `claude-sonnet-4-5` | `claude-haiku-3-5` | ~4x costo input | Medio — validar calidad empatica |
| verify (perfil review) | `claude-sonnet-4-5` | `claude-haiku-3-5` | ~4x costo input | Bajo — es clasificacion simple |
| ocr-vaccination-card | `claude-sonnet-4-5` | Mantener | — | Vision requiere Sonnet |
| verify (OCR titulo) | `claude-sonnet-4-5` | Mantener | — | Vision requiere Sonnet |

---

## 6. Estrategias de cache y ahorro estructural

### 6.1. Cache de resultados en DB

| Funcion | Cache key | TTL | Impacto |
|---|---|---|---|
| breed-tips | `breed:${species}:${breed}` | 90 dias | Elimina ~80% de llamadas IA |
| medical-suggestions | `suggestions:${recordType}:${species}:${breed}` | 30 dias | Elimina ~60% de llamadas |
| generate-shelters | `shelters:${city}` | 30 dias | Elimina ~95% de llamadas |

### 6.2. Pre-filtros sin IA

| Funcion | Pre-filtro propuesto | Llamadas evitadas |
|---|---|---|
| moderate-promotion | Regex: emails, telefonos, URLs externas → rechazo automatico | ~20% |
| pet-assistant | FAQ hardcodeadas (horarios, precios, contacto) → respuesta directa | ~10% |

### 6.3. Eliminar web_search innecesarios

| Funcion | Web search actual | Propuesta |
|---|---|---|
| breed-tips | Siempre 1 busqueda | Solo razas poco comunes (no top 30) |
| medical-suggestions | Siempre 1 busqueda | Solo si record_type es raro |
| ocr-vaccination-card | Siempre 1 busqueda | Eliminar — cachear calendario vacunal en DB |
| generate-shelters | Siempre 3 busquedas | Cachear resultados en DB, regenerar mensual |

---

## 7. Bugs encontrados

| # | Funcion | Bug | Severidad | Fix |
|---|---|---|---|---|
| 1 | moderate-service-promotion | No define `temperature` — usa default 0.3 pero deberia ser 0.1 | Media | Agregar `temperature: 0.1` |
| 2 | generate-shelters | `max_tokens: 200` trunca output JSON | Alta | Subir a `max_tokens: 800` |
| 3 | verify-service-provider | Usa Sonnet para review de texto plano (no vision) | Baja (costo) | Separar modelo por tipo de verificacion |
| 4 | _shared/ai-base.ts | `anthropic-version` desactualizada | Baja | Actualizar header |

---

## 8. Orden de implementacion

### Fase 1: Quick wins (sin cambio de logica)
1. [ ] Fijar `temperature: 0.1` en `moderate-service-promotion`
2. [ ] Subir `max_tokens: 800` en `generate-shelters`
3. [ ] Reducir `max_tokens` en: pet-assistant (500), breed-tips (200), medical-suggestions (350), ocr (600), transcript (700), moderate (200)
4. [ ] Agregar token logging en `callClaude()`
5. [ ] Aplicar prompts optimizados (copiar de seccion 2)

### Fase 2: Cambios de modelo
6. [ ] Bajar `bereavement-assistant` a `claude-haiku-3-5` + A/B test de calidad
7. [ ] Separar `verify-service-provider` — Haiku para perfil, Sonnet solo para OCR vision
8. [ ] Unificar `generate-weekly-owner-reports` + `generate-weekly-vet-reports` en 1 funcion

### Fase 3: Cache y pre-filtros
9. [ ] Implementar cache DB para `breed-tips` por raza
10. [ ] Implementar cache DB para `medical-suggestions` por tipo+especie
11. [ ] Implementar cache DB para `generate-shelters` por ciudad
12. [ ] Agregar pre-filtro regex en `moderate-service-promotion`
13. [ ] Eliminar web_search de `ocr-vaccination-card` — cachear calendario vacunal

### Fase 4: Monitoreo
14. [ ] Dashboard de uso de tokens por funcion (tabla `ai_token_usage`)
15. [ ] Alertas cuando costo diario excede umbral
16. [ ] Metricas de cache hit rate

---

## 9. Estimacion de ahorro

### Escenario: 100 usuarios activos/dia, 5 interacciones promedio

| Concepto | Costo actual/mes | Costo optimizado/mes | Ahorro |
|---|---|---|---|
| Tokens input (prompts) | ~$45 | ~$28 | -38% |
| Tokens output | ~$55 | ~$40 | -27% |
| Web search (tokens extra) | ~$15 | ~$5 | -67% |
| **Total API** | **~$115** | **~$73** | **-37%** |
| Cache DB hits (llamadas evitadas) | — | -$20 adicional | — |
| **Total con cache** | **~$115** | **~$53** | **-54%** |

### A 500 usuarios (proyeccion crecimiento)

| Concepto | Sin optimizar | Optimizado |
|---|---|---|
| Total API/mes | ~$575 | ~$265 |
| Ahorro anual | — | ~$3.720 |

---

## 10. Notas de seguridad

- **NO reducir** las instrucciones de seguridad del `bereavement-assistant` relacionadas con crisis/suicidio. Solo comprimir, nunca eliminar.
- **Mantener** sanitizacion de inputs (`sanitizeForPrompt` en `ai-base.ts`) en todas las funciones.
- **No cachear** respuestas del `pet-assistant` (cada consulta es unica y contextual).
- **No cachear** resultados de `moderate-service-promotion` (cada promocion es unica).
- Al agregar token logging, **no loguear** el contenido de los prompts ni mensajes del usuario — solo metricas numericas.
