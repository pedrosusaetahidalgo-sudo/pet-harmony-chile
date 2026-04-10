# Feature: Upgrade IA — web search + prompts optimizados

> Prioridad: P1 | Esfuerzo: ~14h | 0 tablas nuevas
> Dos mejoras en una: (1) agregar web search a 5 funciones, (2) recortar prompts para gastar menos tokens y obtener respuestas mas precisas.

---

## Inventario

| Funcion | max_tokens actual | max_tokens optimo | Web search | max_uses |
|---------|-------------------|-------------------|------------|----------|
| `pet-assistant` | 600 | 800 | SI | 3 |
| `medical-suggestions` | 1000 | 600 | SI | 1 |
| `breed-tips` | 400 | 300 | SI | 1 |
| `ocr-vaccination-card` | 2048 | 1024 | SI | 1 |
| `generate-shelters` | 200 | 200 | SI | 3 |

**No tocar:** `bereavement-assistant`, `moderate-service-promotion`, `generate-weekly-*-reports`.

---

## 1. pet-assistant

**Archivo:** `supabase/functions/pet-assistant/index.ts`

### Prompt actual: ~320 tokens de system prompt + contexto variable

### Prompt optimizado

```
Asistente veterinario de Paw Friend (Chile). Acceso a ficha clinica completa.

${petContext}

Reglas:
- Usa el nombre de la mascota. Basa respuestas en sus datos reales.
- Sintomas graves (vomitos con sangre, convulsiones, dificultad respiratoria, intoxicacion) → URGENCIA, ir al vet ya.
- Recordatorios vencidos relevantes → mencionalos.
- Alergias conocidas + pregunta sobre comida/medicamentos → advertir.
- No diagnostiques. Sugiere causas posibles, siempre indica confirmar con vet.
- Español chileno, tono calido. 2-4 oraciones. Sin relleno.
- Si no sabes, dilo.
- Si preguntan donde comprar algo, precios, normativa, o info que cambia → usa web_search con "Chile" o la comuna en la query. Cita la fuente.

JSON obligatorio:
{"respuesta":"...","nivel_urgencia":"bajo|medio|alto","requiere_veterinario":bool,"recordatorios_relevantes":[],"sugerencias_accion":[],"fuentes":[]}
```

### Contexto de mascota optimizado

```typescript
// ANTES: ~25 lineas con labels verbosos
// DESPUES: compacto, misma info
const petContext = [
  `${pet.name}, ${pet.species}, ${pet.breed || '?'}, ${petAge}, ${pet.weight ? pet.weight + 'kg' : '?'}, ${pet.gender || '?'}, ${pet.neutered ? 'esterilizado' : 'no esterilizado'}`,
  pet.allergies_food ? `Alergias comida: ${pet.allergies_food}` : null,
  pet.allergies_medication ? `Alergias meds: ${pet.allergies_medication}` : null,
  pet.allergies_environmental ? `Alergias amb: ${pet.allergies_environmental}` : null,
  pet.chronic_conditions_detail ? `Cronico: ${pet.chronic_conditions_detail}` : null,
  pet.current_medications ? `Medicamentos: ${pet.current_medications}` : null,
  pet.diet_type ? `Dieta: ${pet.diet_type}${pet.diet_brand ? ` (${pet.diet_brand})` : ''}` : null,
  records?.length ? `Historial:\n${records.map(r => `${r.date} ${r.record_type}: ${r.title}`).join('\n')}` : null,
  reminders?.length ? `Pendientes:\n${reminders.map(r => `${r.type}: ${r.title} (${r.due_date})`).join('\n')}` : null,
  profile?.location ? `Ubicacion dueno: ${profile.location}` : null,
].filter(Boolean).join('\n');
```

**Ahorro:** ~40% menos tokens en contexto al eliminar labels repetitivos y campos null.

### Request body

```typescript
{
  model: "claude-sonnet-4-5",
  max_tokens: 800,       // era 600, sube para acomodar web search results
  temperature: 0.3,
  system: systemPrompt,
  messages: [{ role: "user", content: question.trim() }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
}
```

---

## 2. medical-suggestions

**Archivo:** `supabase/functions/medical-suggestions/index.ts`

### Prompt actual: verboso, repite instrucciones que Claude ya sabe

### Prompt optimizado

```
Veterinario chileno. Genera sugerencias para registro medico.

JSON array, 6-10 items, sin texto extra:
[{"value":"id-con-guiones","label":"Nombre","description":"Max 15 palabras"}]

Reglas:
- Solo vacunas/medicamentos/procedimientos reales disponibles en Chile.
- Si hay web_search disponible, verifica protocolo ISP/SAG vigente.
- Español chileno.
```

### User message optimizado

```typescript
// ANTES: "Genera vacunas comunes para perros de raza Labrador en Chile. Incluye obligatorias..."
// DESPUES:
const prompt = `${recordType} para ${species} ${breed}, Chile. 6-10 opciones.`;
```

### Request body

```typescript
{
  model: "claude-sonnet-4-5",
  max_tokens: 600,       // era 1000, 6-10 items caben en 600
  temperature: 0.2,      // era undefined, bajamos para consistencia
  system: systemPrompt,
  messages: [{ role: "user", content: prompt }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 1 }],
}
```

**Ahorro:** ~50% menos tokens en prompt. max_tokens baja de 1000 a 600 (6-10 items vs 8-12).

---

## 3. breed-tips

**Archivo:** `supabase/functions/breed-tips/index.ts`

### Prompt actual: ya bastante bueno, pocas mejoras

### Prompt optimizado

```
Veterinario chileno. Tips de raza, BREVES.

4 secciones, max 2 puntos c/u, 1 oracion c/u, total <120 palabras:

🏥 Salud
🍖 Alimentacion
🏃 Ejercicio
⚠️ Ojo con...

Español chileno (tu/tienes). Solo datos correctos. Si hay web_search, busca alertas recientes de la raza.
```

### User message optimizado

```typescript
// ANTES: "Consejos breves para perro raza "Labrador". 4 secciones, maximo 2 puntos cada una, 150 palabras total."
// DESPUES:
const prompt = `Tips: ${species} ${breed}`;
```

### Request body

```typescript
{
  model: "claude-sonnet-4-5",
  max_tokens: 300,       // era 400, 120 palabras caben en 300
  temperature: 0.3,
  system: systemPrompt,
  messages: [{ role: "user", content: `Tips: ${species} ${breed}` }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 1 }],
}
```

**Ahorro:** ~30% menos tokens. Baja max de 150 a 120 palabras (mas conciso).

---

## 4. ocr-vaccination-card

**Archivo:** `supabase/functions/ocr-vaccination-card/index.ts`

### Prompt actual: bueno pero demasiado explicativo

### Prompt optimizado

```
OCR de carnet de vacunacion veterinario chileno. Extrae datos de la imagen.

JSON sin markdown:
{"vaccines":[{"name":"...","date":"YYYY-MM-DD|null","batch":"...|null","vet_name":"...|null"}],"deworming":[{"product":"...","date":"YYYY-MM-DD|null"}],"notes":"","alertas":[]}

Reglas:
- Fechas ISO. Campo ilegible → null. No inventar.
- Si no es carnet de vacunacion → arrays vacios + nota.
- Si hay web_search, valida contra calendario vacunal chileno y agrega alertas de vacunas faltantes en campo "alertas".
```

### Request body

```typescript
{
  model: "claude-sonnet-4-5",
  max_tokens: 1024,      // era 2048, un carnet no tiene mas de 10-15 vacunas
  temperature: 0,
  system: systemPrompt,
  messages: [{ role: "user", content: [imageBlock, textBlock] }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 1 }],
}
```

**Ahorro:** max_tokens baja 50%. Prompt ~40% mas corto. Agrega campo `alertas` para validacion.

---

## 5. generate-shelters

**Archivo:** `supabase/functions/generate-shelters/index.ts`

### Prompt actual: genera data ficticia

### Prompt optimizado

```
Busca refugios/fundaciones de rescate animal REALES en ${city}, Chile.

JSON array:
[{"name":"...","type":"refugio|fundacion|ong","address":"...","commune":"...","phone":"...","email":"...","url":"...","animal_types":["perro","gato"],"description":"2 oraciones"}]

Solo refugios con evidencia real. No inventar.
```

### Request body

```typescript
{
  model: "claude-sonnet-4-5",
  max_tokens: 200,
  temperature: 0.2,
  system: systemPrompt,
  messages: [{ role: "user", content: `Refugios animales en ${city}, Chile. Max ${count}.` }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
}
```

---

## Resumen de optimizacion de tokens

| Funcion | Tokens prompt antes | Tokens prompt despues | max_tokens antes | max_tokens despues |
|---------|--------------------|-----------------------|------------------|-------------------|
| pet-assistant | ~320 + contexto ~400 | ~180 + contexto ~250 | 600 | 800* |
| medical-suggestions | ~180 + user ~50 | ~90 + user ~15 | 1000 | 600 |
| breed-tips | ~200 + user ~30 | ~100 + user ~5 | 400 | 300 |
| ocr-vaccination-card | ~280 | ~150 | 2048 | 1024 |
| generate-shelters | ~40 | ~80** | 200 | 200 |

\* Sube porque web search puede devolver contenido largo.
\** Sube porque ahora busca data real en vez de generar 2 oraciones.

**Ahorro neto en tokens de input:** ~35-50% menos por consulta en las 4 funciones principales.
**Ahorro neto en tokens de output:** ~30% menos al bajar max_tokens en 3 funciones.

---

## Principios aplicados a todos los prompts

1. **No repetir lo que Claude ya sabe.** "No inventes nombres de vacunas que no existan" → Claude no lo hace si le das contexto correcto.
2. **Eliminar labels verbosos.** `- Nombre: Luna\n- Especie: perro` → `Luna, perro, Labrador, 3 años, 28kg`.
3. **Formato antes que reglas.** Claude respeta mejor el formato si lo ve primero.
4. **Omitir campos null.** No gastar tokens en `- Alergias: ninguna conocida`. Solo enviar lo que tiene valor.
5. **User messages minimos.** El system prompt ya dice que hacer. El user message solo da el input: `Tips: perro Labrador`.
6. **Temperature explicita.** `medical-suggestions` no tenia — ahora tiene 0.2 para consistencia.
7. **max_tokens ajustados.** Cada funcion tiene el minimo necesario. Menos output = menos costo + respuestas mas concisas.

---

## Request body estandar (copiar para cada funcion)

```typescript
body: JSON.stringify({
  model: "claude-sonnet-4-5",
  max_tokens: MAX,
  temperature: TEMP,
  system: systemPrompt,
  messages: [{ role: "user", content: userMessage }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: N }],
}),
```

---

## Plan de implementacion

| Paso | Que | Esfuerzo |
|------|-----|----------|
| 1 | Optimizar prompts de las 5 funciones (sin web search aun) | 3h |
| 2 | Agregar web search tool a pet-assistant + test | 2h |
| 3 | Agregar web search a medical-suggestions + breed-tips | 2h |
| 4 | Agregar web search a ocr-vaccination-card | 1.5h |
| 5 | Refactor generate-shelters para buscar data real | 2h |
| 6 | UI: fuentes, cards tiendas, badge "info actualizada" | 2h |
| 7 | Deploy + test end-to-end | 1.5h |
| **TOTAL** | | **~14h** |

**Paso 1 se puede hacer YA** sin web search — solo optimizar prompts ahorra tokens y mejora respuestas.

---

## Costos

### Ahorro por optimizacion de prompts (sin web search)

Con 200 usuarios activos, ~785 consultas/semana:
- **Antes:** ~$9.50/semana (prompts largos + max_tokens altos)
- **Despues:** ~$6.20/semana (prompts lean + max_tokens ajustados)
- **Ahorro:** ~35% → ~$170/año

### Costo adicional de web search

- Web search de Anthropic: incluido en tokens (no cargo extra por tool call)
- Aumento por contenido de busqueda en contexto: ~+$1.50/semana
- **Total con web search:** ~$7.70/semana → **menos que antes sin search**

---

## Riesgos

| Riesgo | Mitigacion |
|--------|-----------|
| Web search lento (+2-3s) | Timeout 15s→25s en pet-assistant. UI: "Buscando info actualizada..." |
| Resultados irrelevantes | Prompts acotan a Chile + dominio vet/mascotas |
| Respuestas muy cortas post-optimizacion | Testear con 20 queries reales antes de deploy |
| Anthropic web search no disponible | Fallback: funciona igual que hoy, sin tools |
