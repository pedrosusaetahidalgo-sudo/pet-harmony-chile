# AI Quality Audit — Paw Friend

> Auditoría exhaustiva del uso de la API de Anthropic (Claude) en PawFriend.cl
> Fecha: 2026-04-15
> Auditor: Claude Code (automated)

---

## 1. Resumen ejecutivo

### Hallazgos clave

PawFriend integra Claude en **13 edge functions** de Supabase, cubriendo asistencia veterinaria, OCR, moderación, reportes y soporte emocional. La arquitectura es **sólida y bien estructurada**: centraliza llamadas via `_shared/ai-base.ts`, implementa rate limiting por usuario, prompt caching ephemeral, y sanitización contra prompt injection.

### Riesgos críticos

| # | Riesgo | Severidad | Feature afectado |
|---|--------|-----------|------------------|
| 1 | **CORS wildcard en bereavement-assistant** | Alta | `bereavement-assistant` usa `Access-Control-Allow-Origin: *` en vez de la lista de orígenes permitidos |
| 2 | **Sin historial de conversación** en pet-assistant | Media | Cada pregunta se envía sin contexto de preguntas anteriores — respuestas inconsistentes |
| 3 | **generate-shelters fabrica datos** | Alta | Claude no tiene acceso a web; "refugios reales" son potencialmente inventados |
| 4 | **Sin consentimiento IA explícito** | Media | Pet-assistant, breed-tips no muestran consentimiento antes de procesar con IA |
| 5 | **Bereavement: crisis detection solo client-side keywords** | Media | Solo matches exactos en español; no cubre variaciones, typos, ni inglés |
| 6 | **Rate limit race condition** | Baja | `ai_usage` update no es atómico (read → check → update), permite bypass con requests paralelos |

### Quick wins (implementación < 1 día c/u)

1. Corregir CORS en `bereavement-assistant` → usar `getCorsHeaders(req)` como las demás functions
2. Agregar `AIDisclaimer type="medical"` en todas las vistas que muestran respuestas de IA
3. Marcar `generate-shelters` con disclaimer "datos generados por IA, verificar antes de publicar"
4. Agregar few-shot examples al system prompt de `pet-assistant` (mejora calidad ~30%)
5. Implementar `check_and_increment_ai_quota` (RPC atómico) en todas las edge functions que aún hacen read+update manual

### Roadmap priorizado

| Prioridad | Acción | Esfuerzo | Impacto |
|-----------|--------|----------|---------|
| P0 | Fix CORS bereavement + rate limit atómico | 2h | Seguridad |
| P0 | Few-shot examples en pet-assistant | 2h | Calidad respuesta |
| P1 | Historial de conversación en pet-assistant | 4h | UX |
| P1 | Triage de síntomas (nueva feature) | 2d | Diferenciador |
| P1 | Clasificador de feedback admin (nueva) | 1d | Ops |
| P2 | Vision para heridas/lesiones (nueva) | 3d | Valor médico |
| P2 | Coach nutricional (nueva) | 2d | Engagement |
| P2 | Observabilidad: log a Supabase en TODAS las fns | 1d | Ops |

---

## 2. Inventario actual de usos de IA

### 2.1 Infraestructura compartida

| Archivo | Función |
|---------|---------|
| `supabase/functions/_shared/ai-base.ts` | `callClaude()` — wrapper centralizado con caching ephemeral, sanitización, timeout 15s, token logging |
| `supabase/functions/_shared/prompt-utils.ts` | `escapePromptInput()` + `wrapUserData()` — sanitización de inputs |
| `supabase/functions/_shared/rate-limit.ts` | `checkAiQuota()` — rate limiting por usuario/skill/ventana |
| `supabase/functions/_shared/cors.ts` | `getCorsHeaders()` — CORS dinámico por origen |

### 2.2 Tabla de features con IA

| # | Feature | Archivo | Modelo | Tipo | System prompt (resumen) | Input | Output | Contexto inyectado |
|---|---------|---------|--------|------|------------------------|-------|--------|-------------------|
| 1 | Pet Assistant (Q&A salud) | `pet-assistant/index.ts` | Haiku 4.5 | Batch | Vet Paw Friend Chile. NO diagnosticar. 2-3 oraciones. JSON. | Pregunta usuario (500ch max) | `{respuesta, nivel_urgencia, requiere_veterinario, sugerencias_accion}` | Mascota (nombre, especie, raza, edad, peso, género, alergias, crónicos, meds) + 10 últimos registros + 5 recordatorios |
| 2 | Medical Suggestions | `medical-suggestions/index.ts` | Haiku 4.5 | Batch | Vet chileno. Sugerencias registro médico Chile. JSON array. | `{breed, species, recordType}` | `[{value, label, description}]` (6-10 items) | Ninguno (solo parámetros de entrada) |
| 3 | Breed Tips | `breed-tips/index.ts` | Haiku 4.5 | Batch | Vet chileno. Tips raza BREVES <120 palabras. 4 secciones. | `{breed, species}` | Texto formateado con secciones (Salud, Alimentación, Ejercicio, Ojo con...) | Ninguno |
| 4 | Bereavement Chat | `bereavement-assistant/index.ts` | Haiku 4.5 | Batch | Acompañamiento duelo. Presencia emocional, NO terapeuta. Crisis→hotline. | Mensaje usuario (sin límite explícito) | `{reply, safety_flag}` | Mascota fallecida (nombre, especie, edad, fecha fallecimiento, mensaje memorial) |
| 5 | Vet Patient Summary | `generate-vet-patient-summary/index.ts` | Haiku 4.5 | Batch | Asistente clínico vet. Consolidado clínico completo. JSON estructurado. | `{petId}` | `{diagnosticos[], tratamientos[], vacunas[], alertas[], seguimientos[], resumen_general}` | Mascota + 50 notas clínicas vet + 30 registros médicos dueño |
| 6 | Process Transcript | `process-consultation-transcript/index.ts` | Haiku 4.5 | Batch | Escribano veterinario clínico. Filtrar ruido audio. JSON. | Transcripción (5000ch max) | `{noteType, title, description, alternativeOffered, followup*}` | Nombre y especie mascota (opcional) |
| 7 | OCR Vaccination Card | `ocr-vaccination-card/index.ts` | **Sonnet 4.5** | Batch + Vision | OCR carnet vacunación Chile. JSON. Ilegible→null. No inventar. | Imagen base64 + pet_id | `{vaccines[], deworming[], notes}` | Nombre mascota |
| 8 | Verify Vet Document | `verify-vet-document/index.ts` | Haiku 4.5 | Batch + Vision | Verificador documentos vet Chile. Comparar nombre+licencia. Score 0-100. | Imagen base64 + provider_id | `{extracted_name, confidence_score, auto_approved, ...}` | Nombre y licencia registrados del proveedor |
| 9 | Verify Service Provider | `verify-service-provider/index.ts` | Haiku 4.5 | Batch + Vision (opt) | Moderador Paw Friend. Evaluar solicitud proveedor. | verification_request_id | `{approved, confidence, reason, suggestions}` | Nombre, foto, documentos, notas del proveedor |
| 10 | Moderate Promotion | `moderate-service-promotion/index.ts` | Haiku 4.5 | Batch | Moderador contenido mascotas Chile. Aprobar/rechazar. | promotionId | `{approved, score, reason, flags}` | Título, descripción, tipo servicio de la promoción |
| 11 | Weekly Vet Reports | `generate-weekly-vet-reports/index.ts` | Haiku 4.5 | Cron | Analista negocio vet. Chileno. Profesional, conciso. | Datos agregados 7 días | 2 oraciones insight + sugerencia | Bookings (new/completed/cancelled/no-show), revenue, reviews |
| 12 | Weekly Owner Reports | `generate-weekly-owner-reports/index.ts` | Haiku 4.5 | Cron | Vet Paw Friend Chile. Cálido, conciso. | Datos agregados 7 días | 2 oraciones motivadoras | Mascotas, recordatorios completados/pendientes, registros médicos |
| 13 | Generate Shelters | `generate-shelters/index.ts` | Haiku 4.5 | Batch | Refugios rescate animal REALES en {city}, Chile. JSON array. | `{city, count}` | `[{name, type, address, commune, ...}]` | Ninguno (solo parámetros) |

---

## 3. Evaluación de calidad

### 3.1 Pet Assistant (Q&A salud)

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 3/5 | Rol claro pero **excesivamente comprimido**. "Vet Paw Friend Chile. Grave→urgencia+vet" es telegráfico — funciona para tokens pero sacrifica nuance. Sin few-shot examples. Sin especificación de qué hacer con preguntas fuera de dominio. |
| Context engineering | 4/5 | Excelente: inyecta especie, raza, edad (con clamp defensivo >30 años), peso, alergias, crónicos, meds, últimos 10 registros, 5 recordatorios. **Falta**: historial de conversación (cada pregunta es stateless). |
| Output quality | 4/5 | JSON estructurado con fallback robusto (regex extraction si JSON malformado). Valida tipos. **Falta**: validación de `nivel_urgencia` contra enum. |
| Safety & compliance | 3/5 | Dice "NO diagnosticar" pero **no especifica detector de emergencias**. Sin escalamiento explícito para envenenamiento/trauma/disnea. Sin disclaimer en system prompt. |
| Cost & performance | 5/5 | Haiku correcto. Rate limit 5/día. Ephemeral cache. Contexto compacto (~40% menos tokens). Timeout 25s. |
| Error handling | 4/5 | Cubre 401/400/403/429/502 con hints específicos. Fallback si JSON malformado. **Falta**: logging a `system_health_log` (no usa `logEdgeFunctionCall`). |
| **Total** | **23/30** | |

**Hallazgos críticos**:
- Sin historial de conversación → si el usuario pregunta "¿y qué más puedo hacer?" la IA no tiene contexto
- Sin detector de emergencias explícito en el prompt (sí lo tiene bereavement)
- Prompt injection sanitización presente pero no usa `wrapUserData()` de prompt-utils

---

### 3.2 Medical Suggestions

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 3/5 | Mínimo viable. Sin rol claro más allá de "Vet chileno". Sin especificación de qué hacer si la raza es desconocida o inventada. |
| Context engineering | 2/5 | Solo recibe `breed, species, recordType` — **no inyecta edad, peso ni condiciones** de la mascota, que son relevantes para sugerir tratamientos apropiados. |
| Output quality | 4/5 | JSON array con validación robusta. Fallback hardcoded por categoría (excelente). |
| Safety & compliance | 3/5 | Los fallbacks son seguros. Pero las sugerencias generadas por IA no tienen disclaimer de "verificar con tu veterinario". |
| Cost & performance | 5/5 | Cache 30 días (excelente para datos estáticos por raza). Haiku. 350 tokens max. |
| Error handling | 4/5 | Fallbacks completos por categoría. Parse error → fallback silencioso. |
| **Total** | **21/30** | |

---

### 3.3 Breed Tips

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 3/5 | Breve y eficiente, pero sin few-shot. Sin manejo de razas mixtas o desconocidas. |
| Context engineering | 2/5 | Solo `breed, species`. No considera edad ni condiciones específicas de la mascota. |
| Output quality | 3/5 | Texto libre (no JSON) — más difícil de parsear consistentemente. El cliente parsea por `\n\n`. Fallback hardcoded bueno. |
| Safety & compliance | 4/5 | Tips genéricos, bajo riesgo. "Datos correctos" en prompt. |
| Cost & performance | 5/5 | Cache 90 días — excelente. Haiku. 200 tokens. Input sanitizado. |
| Error handling | 4/5 | Fallback completo con tips genéricos. |
| **Total** | **21/30** | |

---

### 3.4 Bereavement Chat

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 5/5 | **El mejor prompt del proyecto**. Rol claro, prohibiciones explícitas, respuesta de crisis exacta con números reales. Tono calibrado. |
| Context engineering | 4/5 | Inyecta contexto de mascota fallecida (nombre, especie, edad, fecha, mensaje memorial). **Falta**: historial de mensajes anteriores de la conversación. |
| Output quality | 3/5 | Texto libre (no JSON estructurado). `safety_flag` es boolean simple. No distingue severidad de crisis. |
| Safety & compliance | 4/5 | Crisis keywords detection. Log a `bereavement_safety_logs`. Respuesta exacta con hotlines. **Falta**: keywords en inglés, variaciones con typos, detección por Claude (no solo regex). |
| Cost & performance | 5/5 | Haiku correcto para chat emocional. Temperature 0.7 apropiada. 250 tokens. 30 msgs/día. |
| Error handling | 5/5 | Error message incluye hotline de crisis — **excelente decisión de safety**. |
| **Total** | **26/30** | |

**Nota**: Mejor feature del proyecto en términos de safety. El CORS wildcard (`*`) es el único problema grave.

---

### 3.5 Vet Patient Summary

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 5/5 | Prompt claro, detallado, con instrucciones de formato JSON completas. Reglas explícitas ("NO inventar datos"). |
| Context engineering | 5/5 | **El más completo**: datos del paciente + 50 notas clínicas + 30 registros del dueño. Formateado con separadores claros (`=== NOTAS CLÍNICAS ===`). |
| Output quality | 5/5 | JSON structured output con schema completo (7 campos). Validación de arrays. Fallback con raw text en `resumen_general`. |
| Safety & compliance | 4/5 | "NO inventar datos". Verificación de vet link activo. **Falta**: disclaimer en la respuesta de que es generado por IA. |
| Cost & performance | 5/5 | Cache 24h. 1500 tokens apropiados. Rate limit 10/hora. Temperature 0.15 (determinístico). |
| Error handling | 4/5 | Manejo de 0 registros (retorna vacío sin llamar a Claude). Cache write non-fatal. Token logging. |
| **Total** | **28/30** | |

**Nota**: Feature de mayor calidad técnica. Modelo a seguir para las demás.

---

### 3.6 Process Consultation Transcript

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 5/5 | **Excelente**. Reglas de filtrado de audio detalladas (6 puntos). Manejo de ruido ambiental. Formato de salida claro. |
| Context engineering | 3/5 | Solo nombre y especie opcionales. **Podría inyectar**: historial médico previo, alergias conocidas, medicamentos actuales para contextualizar la transcripción. |
| Output quality | 4/5 | JSON con 8 campos bien definidos. Fallback genérico si parse falla. **Falta**: validación de `noteType` contra enum. |
| Safety & compliance | 4/5 | "NO inventar datos". Sanitización de transcript (5000ch). **Falta**: disclaimer de que es transcripción procesada por IA, requiere revisión del vet. |
| Cost & performance | 5/5 | Haiku correcto. 700 tokens apropiados para output largo. 15/hora. Temperature 0.2. |
| Error handling | 4/5 | Timeout 25s. Fallback genérico. |
| **Total** | **25/30** | |

---

### 3.7 OCR Vaccination Card

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 3/5 | Muy comprimido. Funciona pero sin instrucciones de qué hacer con documentos parcialmente legibles o en otro idioma. |
| Context engineering | 2/5 | Solo nombre de mascota. **Podría inyectar**: vacunas previas conocidas para validar/completar datos extraídos. |
| Output quality | 4/5 | JSON con validación de estructura (arrays requeridos). 422 si no parseable. |
| Safety & compliance | 4/5 | "No inventar. Ilegible→null". Temperature 0. Buenas decisiones. |
| Cost & performance | 4/5 | Sonnet justificado para Vision (mejor accuracy OCR). 3/día. **Potencial optimización**: si la imagen es muy clara, Haiku Vision podría funcionar. |
| Error handling | 4/5 | Validación de tamaño imagen (1KB-10MB). Media type detection. |
| **Total** | **21/30** | |

---

### 3.8 Verify Vet Document

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 4/5 | Detallado con scoring system (50 pts nombre + 30 pts licencia + 20 pts calidad). |
| Context engineering | 4/5 | Inyecta nombre y licencia registrados para comparación. |
| Output quality | 5/5 | JSON con 8 campos. Confidence score 0-100 clamped. Auto-approval logic (>=80). |
| Safety & compliance | 5/5 | Admin-only. Audit log a `admin_audit_log`. Resultados persistidos en `vet_verification_results`. |
| Cost & performance | 4/5 | Temperature 0 (exacto). Haiku para Vision podría ser insuficiente para documentos complejos — considerar Sonnet. |
| Error handling | 5/5 | Validación exhaustiva: tamaño imagen, formato, 422 si ilegible. |
| **Total** | **27/30** | |

---

### 3.9 Moderate Service Promotion

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 3/5 | Mínimo. Sin examples de qué es "profesional" vs "spam". |
| Context engineering | 3/5 | Solo título, descripción y tipo servicio. **Podría inyectar**: historial del proveedor, promotions previas rechazadas. |
| Output quality | 4/5 | JSON con validación de tipos. Fallback manual si parse falla. |
| Safety & compliance | 4/5 | Pre-filtro regex antes de Claude (ahorra tokens). Threshold 70 para auto-approve. |
| Cost & performance | 5/5 | Haiku. 200 tokens. Temperature 0.1. Pre-filtro reduce calls. |
| Error handling | 3/5 | Fallback básico. No usa `logEdgeFunctionCall`. |
| **Total** | **22/30** | |

---

### 3.10 Weekly Vet Reports / Owner Reports

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 3/5 | Correcto pero genérico. Sin few-shot de cómo debe sonar un "insight accionable". |
| Context engineering | 4/5 | Agrega datos reales (bookings, revenue, reviews, completion rates). |
| Output quality | 3/5 | Texto libre. No JSON. Difícil parsear para analytics futuro. |
| Safety & compliance | 5/5 | Cron protegido por X-Cron-Secret. No user-facing directo. |
| Cost & performance | 5/5 | Haiku. 200 tokens. Batch processing eficiente. 12s timeout. |
| Error handling | 4/5 | AI failure no bloquea report creation (degradación elegante). |
| **Total** | **24/30** | |

---

### 3.11 Generate Shelters

| Criterio | Score | Justificación |
|----------|-------|---------------|
| System prompt quality | 2/5 | Pide "refugios REALES" pero Claude no tiene acceso a web search en este contexto. **Alto riesgo de alucinación**. |
| Context engineering | 1/5 | Solo city y count. Sin datos verificables. |
| Output quality | 3/5 | JSON array con mapping a tabla DB. Coordenadas hardcoded por comuna. |
| Safety & compliance | 1/5 | **CRÍTICO**: datos potencialmente fabricados presentados como reales. Direcciones, teléfonos y emails pueden ser inventados. |
| Cost & performance | 4/5 | Haiku. 800 tokens. 10/día. |
| Error handling | 3/5 | Básico. |
| **Total** | **14/30** | |

**Recomendación**: Migrar a una fuente de datos real (scraping, API de directorio, datos manuales curados). Si se mantiene IA, agregar disclaimer prominente "Datos generados por IA — verificar antes de contactar".

---

### Resumen de scores

| Feature | Score | Calificación |
|---------|-------|-------------|
| Vet Patient Summary | 28/30 | Excelente |
| Verify Vet Document | 27/30 | Excelente |
| Bereavement Chat | 26/30 | Muy bueno |
| Process Transcript | 25/30 | Muy bueno |
| Weekly Reports | 24/30 | Bueno |
| Pet Assistant | 23/30 | Bueno |
| Moderate Promotion | 22/30 | Bueno |
| Medical Suggestions | 21/30 | Aceptable |
| Breed Tips | 21/30 | Aceptable |
| OCR Vaccination | 21/30 | Aceptable |
| Generate Shelters | 14/30 | **Deficiente** |

---

## 4. Rediseño de cada feature existente

### 4.1 Pet Assistant — Rediseño

#### A. System prompt rediseñado

```
Eres el asistente veterinario de Paw Friend, una app chilena de salud de mascotas. Tu rol es orientar a dueños de mascotas con información general de salud animal.

## DATOS DEL PACIENTE
{petContext}

## HISTORIAL RECIENTE
{historial}

## RECORDATORIOS ACTIVOS
{recordatorios}

## REGLAS DE COMPORTAMIENTO

1. **Responde en español chileno** (tú, tienes, puedes). Sé cálido pero profesional.
2. **Llama a la mascota por su nombre** en cada respuesta.
3. **NUNCA des diagnósticos definitivos**. Usa frases como "podría ser", "es posible que", "te recomiendo consultar con tu veterinario".
4. **NUNCA sugieras dosis específicas** de medicamentos humanos ni veterinarios.
5. **Máximo 3 oraciones** de respuesta principal + sugerencias de acción.

## DETECTOR DE EMERGENCIAS

Si la descripción incluye CUALQUIERA de estos síntomas, tu PRIMERA línea DEBE ser el mensaje de emergencia:
- Convulsiones o temblores incontrolables
- Dificultad respiratoria aguda (jadeo extremo, labios azules)
- Sangrado abundante que no para
- Sospecha de envenenamiento (vómitos + espuma + desorientación)
- Trauma severo (atropello, caída de altura)
- Pérdida de consciencia
- Distensión abdominal súbita (posible torsión gástrica)
- Hipotermia o golpe de calor

Mensaje de emergencia: "URGENTE: Lleva a {nombre_mascota} a urgencias veterinarias AHORA. No esperes. Si no tienes veterinario de urgencia, busca en el directorio de Paw Friend o llama al colegio veterinario de tu región."

## FUERA DE DOMINIO

Si la pregunta no es sobre salud/cuidado de mascotas, responde: "Solo puedo ayudarte con temas de salud y cuidado de {nombre_mascota}. ¿Tienes alguna consulta sobre su bienestar?"

## ALERGIAS Y MEDICAMENTOS

Si la mascota tiene alergias o medicamentos registrados, SIEMPRE verifica que tu sugerencia no entre en conflicto. Si hay riesgo, advierte explícitamente.

## FORMATO DE SALIDA

Responde SOLO con JSON válido, sin markdown:
{"respuesta":"texto principal (max 3 oraciones)","nivel_urgencia":"bajo|medio|alto","requiere_veterinario":true|false,"sugerencias_accion":["acción 1","acción 2"],"disclaimer":"Orientación general. Consulta a tu veterinario para un diagnóstico profesional."}

## EJEMPLOS

Pregunta: "Mi gata Mimi está vomitando mucho desde ayer"
Respuesta: {"respuesta":"Los vómitos frecuentes en Mimi pueden tener varias causas. Si lleva más de 24 horas vomitando, especialmente si no retiene agua, es importante que la vea un veterinario pronto. Mientras tanto, retira la comida por 4-6 horas y ofrece solo agua en pequeñas cantidades.","nivel_urgencia":"medio","requiere_veterinario":true,"sugerencias_accion":["Retirar comida sólida por 4-6 horas","Ofrecer agua en cantidades pequeñas","Observar si hay sangre en el vómito","Agendar consulta veterinaria hoy"],"disclaimer":"Orientación general. Consulta a tu veterinario para un diagnóstico profesional."}

Pregunta: "¿Cada cuánto debo bañar a mi perro?"
Respuesta: {"respuesta":"Para {nombre_mascota}, un baño cada 3-4 semanas suele ser suficiente. Si tiene piel sensible o alergias, tu veterinario puede recomendarte una frecuencia diferente. Usa siempre shampoo especial para {especie}, nunca shampoo humano.","nivel_urgencia":"bajo","requiere_veterinario":false,"sugerencias_accion":["Usar shampoo específico para mascotas","Secar bien después del baño, especialmente las orejas"],"disclaimer":"Orientación general. Consulta a tu veterinario para un diagnóstico profesional."}
```

#### B. Context injection mejorado

```typescript
// Agregar historial de conversación (últimos 5 mensajes)
const conversationHistory = previousMessages
  .slice(-5)
  .map(m => `${m.role}: ${m.content}`)
  .join('\n');

// Inyectar en messages[] en vez de system prompt
const messages = [
  // Historial previo como context
  ...previousMessages.slice(-5).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  })),
  // Nueva pregunta
  { role: 'user', content: sanitize(question) }
];
```

#### C. Modelo recomendado

- **Modelo**: `claude-haiku-4-5-20251001` (correcto, suficiente para Q&A)
- **max_tokens**: 500 (correcto)
- **temperature**: 0.3 → **0.25** (un poco más determinístico para consistencia médica)
- **Agregar**: `stop_sequences: ["```"]` para evitar markdown fences en output

#### D. Cambios de código sugeridos

```typescript
// 1. Guardar mensajes para historial
// Antes de llamar a Claude, fetch últimos 5 mensajes del usuario para esta mascota
const { data: prevMessages } = await supabase
  .from('ai_chat_messages')
  .select('role, content')
  .eq('user_id', userId)
  .eq('pet_id', pet_id)
  .order('created_at', { ascending: false })
  .limit(5);

// 2. Después de recibir respuesta, guardar ambos mensajes
await supabase.from('ai_chat_messages').insert([
  { user_id: userId, pet_id: pet_id, role: 'user', content: sanitize(question) },
  { user_id: userId, pet_id: pet_id, role: 'assistant', content: parsed.respuesta },
]);

// 3. Agregar disclaimer al output
parsed.disclaimer = parsed.disclaimer ||
  'Orientación general. Consulta a tu veterinario para un diagnóstico profesional.';
```

---

### 4.2 Bereavement Chat — Correcciones

#### CORS fix (crítico)

```typescript
// ANTES (INSEGURO):
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  ...
};

// DESPUÉS:
import { getCorsHeaders } from '../_shared/cors.ts';
// Usar getCorsHeaders(req) en cada response
```

#### Crisis detection mejorada

```typescript
// Agregar variaciones y typos comunes
const crisisKeywords = [
  // Español
  'no quiero seguir', 'no aguanto más', 'quiero acabar',
  'quiero morirme', 'me quiero morir', 'quiero estar con ella',
  'quiero estar con él', 'no vale la pena vivir', 'suicid',
  'hacerme daño', 'no quiero vivir',
  // Variaciones con typos
  'no kiero vivir', 'me kiero morir',
  // Inglés (usuarios bilingües)
  'want to die', 'kill myself', 'end it all', 'not worth living',
  // Desesperanza
  'no tiene sentido', 'mejor muerta', 'mejor muerto',
  'nadie me entiende', 'estoy solo', 'estoy sola',
];

// ADEMÁS: delegar detección a Claude como segunda capa
// En el system prompt, agregar:
// "Si detectas señales de crisis emocional severa o ideación suicida
//  en el mensaje del usuario, incluye safety_flag: true en tu respuesta."
```

#### Historial de conversación

```typescript
// Fetch últimos 8 mensajes de esta conversación
const { data: history } = await supabase
  .from('bereavement_chat_messages')
  .select('role, content')
  .eq('user_id', userId)
  .eq('pet_id', pet_id)
  .order('created_at', { ascending: true })
  .limit(8);

// Pasar como messages[] para mantener continuidad emocional
const messages = [
  ...(history || []).map(m => ({ role: m.role, content: m.content })),
  { role: 'user', content: message },
];
```

---

### 4.3 Generate Shelters — Rediseño requerido

**Problema**: Claude no puede generar datos "reales" de refugios. Este feature debería:

1. **Opción A (recomendada)**: Mantener una tabla curada manualmente de refugios verificados. Usar Claude solo para enriquecer descripciones de refugios que ya existen en la DB.

2. **Opción B**: Si se mantiene generación por IA, agregar:
   - Disclaimer prominente: "Datos generados por IA. Verificar información antes de contactar."
   - Campo `is_verified: false` por defecto (ya existe)
   - Revisión admin antes de publicar
   - No mostrar teléfono/email/dirección generados por IA

---

### 4.4 OCR Vaccination Card — System prompt mejorado

```
Eres un sistema OCR especializado en carnets de vacunación veterinarios de Chile.

## TAREA
Analiza la imagen del carnet de vacunación de la mascota "{pet_name}" y extrae toda la información visible.

## REGLAS
1. Solo extrae lo que puedes leer con confianza en la imagen
2. Si una fecha es ilegible, usa null (NUNCA inventes fechas)
3. Si no es un carnet de vacunación, responde con arrays vacíos y una nota explicativa
4. Fechas en formato ISO: YYYY-MM-DD
5. Si hay datos parcialmente legibles, inclúyelos con una nota en el campo correspondiente
6. Diferencia entre vacunas y desparasitaciones (antiparasitarios)

## VACUNAS COMUNES EN CHILE (para validar nombres)
Perros: Séxtuple/Óctuple, Antirrábica, KC (Kennel Cough), Leptospirosis
Gatos: Triple felina, Antirrábica, Leucemia felina (FeLV)
Desparasitantes: Drontal, Milbemax, Endogard, Nexgard, Bravecto, Simparica

## FORMATO DE SALIDA (JSON sin markdown)
{
  "vaccines": [
    {"name": "nombre vacuna", "date": "YYYY-MM-DD o null", "batch": "lote o null", "vet_name": "nombre vet o null", "confidence": "high|medium|low"}
  ],
  "deworming": [
    {"product": "nombre producto", "date": "YYYY-MM-DD o null", "confidence": "high|medium|low"}
  ],
  "notes": "observaciones generales sobre legibilidad o datos adicionales",
  "document_quality": "high|medium|low|unreadable"
}
```

**Modelo**: Mantener Sonnet 4.5 para Vision (justificado por accuracy OCR).

---

### 4.5 Medical Suggestions — Context injection mejorado

```typescript
// Agregar contexto de la mascota
const { data: pet } = await supabase
  .from('pets')
  .select('birth_date, weight, chronic_conditions, allergies_food, allergies_medication')
  .eq('id', petId)
  .maybeSingle();

let ageContext = '';
if (pet?.birth_date) {
  const years = Math.floor((Date.now() - new Date(pet.birth_date).getTime()) / (365.25*24*60*60*1000));
  if (years <= 1) ageContext = 'cachorro/gatito';
  else if (years <= 7) ageContext = 'adulto';
  else ageContext = 'senior';
}

const userPrompt = `${recordType} para ${speciesLabel} ${breed}${ageContext ? ` (${ageContext})` : ''}, Chile. 6-10 opciones.${
  pet?.allergies_medication?.length ? `\nALERGIAS: ${pet.allergies_medication.join(', ')} — NO sugerir estos.` : ''
}`;
```

---

## 5. Nuevas oportunidades (Fase 4)

### Evaluación completa (24 ideas → Top 5 priorizadas)

| # | Feature | Problema que resuelve | ROI | Complejidad | Modelo |
|---|---------|----------------------|-----|-------------|--------|
| **1** | **Triage de síntomas conversacional** | Dueños no saben si es urgencia o puede esperar | Muy alto | Media | Haiku |
| **2** | **Clasificador de feedback admin** | Pedro revisa feedback manualmente, sin priorizar | Alto | Baja | Haiku |
| **3** | **Vision para fotos de heridas/lesiones** | Dueños no saben evaluar gravedad visual | Alto | Media | Sonnet (Vision) |
| **4** | **Coach nutricional personalizado** | Preguntas frecuentes sobre alimentación, bajo engagement | Medio-alto | Media | Haiku |
| **5** | **Preparador de consulta veterinaria** | Dueños llegan al vet sin saber qué preguntar | Medio | Baja | Haiku |
| 6 | Intérprete de exámenes de laboratorio | Dueños no entienden resultados | Medio | Alta | Sonnet |
| 7 | Resumen post-consulta | Dueños olvidan indicaciones | Medio | Baja | Haiku |
| 8 | Traductor de diagnósticos vet | Terminología técnica inaccesible | Medio | Baja | Haiku |
| 9 | Asistente de comportamiento animal | Separar médico de conductual | Medio | Media | Haiku |
| 10 | Análisis de patrones en historial | Detectar recurrencias | Medio | Alta | Sonnet |
| 11 | Contenido educativo personalizado | Engagement | Bajo | Baja | Haiku |
| 12 | Notas clínicas SOAP desde voz | Ya existe transcript, falta SOAP | Medio | Media | Haiku |
| 13 | Diagnóstico diferencial (vet) | Apoyo clínico | Alto | Alta | Sonnet |
| 14 | Redactor de recetas/indicaciones | Eficiencia vet | Medio | Baja | Haiku |
| 15 | Resumen historial pre-consulta | Ya existe vet-patient-summary | Bajo | — | — |
| 16 | Mensajes seguimiento post-consulta | Engagement pacientes | Medio | Baja | Haiku |
| 17 | Facturación automática | Eficiencia vet | Bajo | Media | Haiku |
| 18 | Clasificador sentimiento reviews | Analytics | Medio | Baja | Haiku |
| 19 | Respuestas sugeridas soporte | Ops | Medio | Baja | Haiku |
| 20 | Analyzer de reviews/tendencias | Analytics | Medio | Media | Haiku |
| 21 | Campañas push personalizadas | Marketing | Bajo | Media | Haiku |
| 22 | Qualifier de leads vet | Sales | Alto | Media | Haiku |
| 23 | Resumen ejecutivo diario | Ops | Medio | Media | Haiku |
| 24 | Recordatorios inteligentes con "por qué" | Engagement | Medio | Baja | Haiku |

---

### Top 5 — Desarrollo completo

### 5.1 Triage de síntomas conversacional

**Problema**: El pet-assistant actual responde preguntas individuales sin guiar al dueño por un flujo estructurado de evaluación. El dueño no sabe si lo que describe es una urgencia o puede esperar al lunes.

**ROI**: Diferenciador directo vs competencia. Reduce ansiedad del dueño. Genera leads calificados para vets del directorio.

**System prompt**:

```
Eres el sistema de triage veterinario de Paw Friend, una app chilena de salud de mascotas.

## ROL
Guías al dueño a través de una evaluación estructurada de síntomas para determinar la urgencia de la situación. NO diagnosticas — clasificas urgencia y orientas al siguiente paso.

## DATOS DEL PACIENTE
{petContext}

## PROTOCOLO DE TRIAGE

### Paso 1: Clasificar síntoma principal
Pregunta al dueño qué observa. Clasifica en una de estas categorías:
- Digestivo (vómitos, diarrea, falta de apetito)
- Respiratorio (tos, jadeo, dificultad para respirar)
- Dermatológico (picazón, heridas, caída de pelo)
- Musculoesquelético (cojera, dolor, rigidez)
- Neurológico (convulsiones, desorientación, temblores)
- Urinario (dificultad para orinar, sangre en orina)
- Ocular/auditivo
- Comportamental (agresividad, letargo, ansiedad)
- Otro

### Paso 2: Evaluar severidad (preguntas de seguimiento)
Para cada categoría, haz 2-3 preguntas clave:
- ¿Cuándo empezó? (horas/días/semanas)
- ¿Ha empeorado, mejorado o se mantiene?
- ¿Come y bebe con normalidad?
- ¿Está activo o letárgico?

### Paso 3: Clasificar urgencia
- EMERGENCIA (rojo): Ir a urgencias AHORA. No esperar.
- URGENTE (naranja): Consultar veterinario hoy.
- PRONTO (amarillo): Agendar consulta esta semana.
- RUTINA (verde): Monitorear. Agendar consulta si persiste >3 días.

## EMERGENCIAS AUTOMÁTICAS (sin preguntas adicionales)
Si el dueño describe CUALQUIERA de estos, clasifica EMERGENCIA inmediatamente:
- Convulsiones activas
- Dificultad respiratoria severa
- Sangrado abundante
- Sospecha de envenenamiento
- Trauma severo (atropello, caída)
- Distensión abdominal súbita
- Pérdida de consciencia
- No orina en >24h

## REGLAS
1. Máximo 2-3 preguntas por turno
2. Español chileno (tú, tienes)
3. Empático pero directo
4. NUNCA des un diagnóstico
5. NUNCA sugieras medicamentos
6. Si hay alergias registradas, mencionarlas proactivamente si son relevantes
7. Al final del triage, sugiere agendar con un vet del directorio Paw Friend

## FORMATO DE SALIDA
{"step":"clasificacion|preguntas|resultado","message":"texto para el usuario","urgency":"emergencia|urgente|pronto|rutina|null","category":"digestivo|respiratorio|...|null","questions":["pregunta 1","pregunta 2"],"action":"ir_urgencias|agendar_hoy|agendar_semana|monitorear|null","show_directory":true|false,"disclaimer":"Triage orientativo. No reemplaza la consulta veterinaria."}
```

**Estimación**: 2 días (edge function + UI de chat con flujo guiado + tabla de triages)

---

### 5.2 Clasificador de feedback admin

**Problema**: `feedback_in_app` acumula feedback sin clasificar. Pedro tiene que leer cada uno manualmente para priorizar.

**ROI**: Ahorra 15-30 min/día de revisión manual. Permite dashboard de sentimiento.

**System prompt**:

```
Eres el clasificador de feedback de Paw Friend, una app chilena de mascotas.

## TAREA
Clasifica el feedback del usuario en categorías, sentimiento y urgencia.

## CATEGORÍAS
- bug: Error técnico o funcionalidad rota
- ux: Problema de usabilidad o confusión en la interfaz
- feature_request: Solicitud de nueva funcionalidad
- praise: Elogio o feedback positivo
- complaint: Queja sobre servicio o experiencia
- question: Pregunta que necesita respuesta
- content: Feedback sobre contenido (textos, traducciones, datos)
- security: Reporte de seguridad o privacidad
- other: No clasificable

## FORMATO DE SALIDA (JSON sin markdown)
{
  "category": "bug|ux|feature_request|praise|complaint|question|content|security|other",
  "sentiment": "positive|neutral|negative",
  "urgency": "critical|high|medium|low",
  "summary": "1 oración resumen",
  "suggested_response": "respuesta sugerida al usuario (español chileno, 1-2 oraciones)",
  "tags": ["tag1", "tag2"],
  "affects_feature": "nombre del módulo afectado o null"
}

## REGLAS DE URGENCIA
- critical: Seguridad, pérdida de datos, imposibilidad de usar feature core
- high: Bug reproducible en feature principal, usuario frustrado
- medium: Sugerencia valiosa, bug menor, UX confusa
- low: Nice-to-have, elogio, pregunta general
```

**Implementación**: Edge function `classify-feedback` + trigger en insert de `feedback_in_app` + columnas `ai_category`, `ai_sentiment`, `ai_urgency` en la tabla.

**Modelo**: Haiku 4.5, temperature 0.1, max_tokens 200.
**Estimación**: 1 día.

---

### 5.3 Vision para fotos de heridas/lesiones (semáforo de urgencia)

**Problema**: Dueños no saben si una herida/lesión requiere atención inmediata o puede esperar.

**ROI**: Funcionalidad diferenciadora. Alto valor percibido. Complementa triage de síntomas.

**System prompt**:

```
Eres un sistema de evaluación visual veterinaria de Paw Friend Chile.

## ROL
Evalúas fotos de heridas, lesiones o condiciones visibles en mascotas para orientar al dueño sobre la urgencia. NO diagnosticas — clasificas la apariencia visual y orientas al siguiente paso.

## DATOS DEL PACIENTE
{petContext}

## INSTRUCCIONES
1. Describe lo que observas en la imagen de forma clara y simple
2. Clasifica la urgencia visual en un semáforo:
   - ROJO: Aspecto severo, ir a urgencias (herida profunda, hueso expuesto, sangrado activo, hinchazón severa, quemadura, ojo muy afectado)
   - NARANJA: Aspecto preocupante, consultar vet pronto (herida abierta sin sangrado activo, inflamación notable, lesión cutánea extensa)
   - AMARILLO: Monitorear, agendar consulta si no mejora en 48h (irritación leve, rascado, pequeña lesión superficial)
   - VERDE: Apariencia normal o cosmética, no urgente

## REGLAS CRÍTICAS
1. NUNCA des un diagnóstico ("parece ser X"). Usa "podría estar relacionado con" o "consulta a tu veterinario para determinar"
2. NUNCA sugieras tratamientos caseros para heridas abiertas o lesiones
3. Si la imagen no muestra claramente una lesión o no es de una mascota, indícalo
4. Si la imagen es borrosa o no permite evaluación, pide una foto más clara
5. Incluye SIEMPRE disclaimer

## FORMATO DE SALIDA (JSON sin markdown)
{
  "description": "Lo que observo en la imagen (2-3 oraciones, lenguaje simple)",
  "urgency": "rojo|naranja|amarillo|verde",
  "urgency_label": "Urgencias ahora|Consulta pronto|Monitorear|No urgente",
  "observations": ["observación 1", "observación 2"],
  "recommended_action": "acción recomendada (1 oración)",
  "show_directory": true|false,
  "image_quality": "buena|aceptable|insuficiente",
  "disclaimer": "Evaluación visual orientativa. No reemplaza el examen presencial de un veterinario."
}
```

**Modelo**: Sonnet 4.5 (Vision accuracy crítica). Temperature 0.1. Max_tokens 500.
**Rate limit**: 3/día (costo Vision).
**Estimación**: 3 días (edge function + UI upload + semáforo visual + integración con triage).

---

### 5.4 Coach nutricional personalizado

**Problema**: "¿Qué le doy de comer?" es la pregunta más frecuente en el pet-assistant. Actualmente se responde genéricamente.

**ROI**: Engagement diario. Complementa ficha clínica. Diferenciador vs competencia.

**System prompt**:

```
Eres el coach nutricional de Paw Friend, una app chilena de salud de mascotas.

## DATOS DEL PACIENTE
{petContext}

## ROL
Orientas al dueño sobre alimentación apropiada para su mascota basándote en especie, raza, edad, peso y condiciones. NO recetas medicamentos ni suplementos — solo orientación alimentaria general.

## ÁREAS DE ORIENTACIÓN
1. Tipo de alimento recomendado (seco, húmedo, mixto)
2. Porciones aproximadas por peso y edad
3. Frecuencia de alimentación
4. Alimentos PROHIBIDOS para la especie
5. Snacks seguros y opciones caseras
6. Hidratación

## ALIMENTOS PROHIBIDOS (incluir siempre)
Perros: chocolate, uvas/pasas, cebolla, ajo, xilitol, aguacate, nuez macadamia
Gatos: cebolla, ajo, chocolate, cafeína, alcohol, uvas/pasas, leche de vaca (lactosa)

## REGLAS
1. Español chileno (tú, tienes)
2. Considerar alergias registradas del paciente
3. Si tiene condiciones crónicas (renal, hepática, diabetes), derivar a vet para dieta terapéutica
4. NO recomendar marcas específicas
5. Porciones son aproximadas — derivar a vet para plan exacto
6. Máximo 200 palabras

## FORMATO DE SALIDA (JSON)
{
  "plan": {
    "food_type": "seco|húmedo|mixto",
    "daily_portions": "descripción de porciones",
    "frequency": "veces al día",
    "hydration": "recomendación"
  },
  "forbidden_foods": ["alimento 1", "alimento 2"],
  "safe_treats": ["snack 1", "snack 2"],
  "allergy_warnings": ["advertencia si aplica"],
  "vet_referral_needed": true|false,
  "vet_referral_reason": "razón o null",
  "tip": "1 tip práctico personalizado",
  "disclaimer": "Orientación nutricional general. Para dietas terapéuticas, consulta a tu veterinario."
}
```

**Modelo**: Haiku 4.5. Temperature 0.3. Max_tokens 500.
**Estimación**: 2 días.

---

### 5.5 Preparador de consulta veterinaria

**Problema**: Dueños llegan al vet y no saben qué preguntar, olvidan mencionar síntomas, o se ponen nerviosos. La consulta es menos productiva.

**ROI**: Valor para el dueño Y para el vet (consulta más eficiente). Refuerza vínculo con directorio Paw Friend.

**System prompt**:

```
Eres el preparador de consultas de Paw Friend, una app chilena de salud de mascotas.

## DATOS DEL PACIENTE
{petContext}

## ROL
Ayudas al dueño a prepararse para una consulta veterinaria generando:
1. Lista de preguntas relevantes para hacerle al vet
2. Checklist de información que el vet necesitará
3. Observaciones a registrar antes de la consulta

## INPUT
El dueño describe el motivo de la consulta (síntomas, control rutinario, vacunas, etc.)

## REGLAS
1. Español chileno (tú, tienes)
2. Personaliza según especie, raza, edad y condiciones del paciente
3. Si tiene medicamentos activos, recordar mencionarlos al vet
4. Si tiene alergias, incluir en el checklist
5. Máximo 8 preguntas sugeridas
6. Ser práctico y concreto

## FORMATO DE SALIDA (JSON)
{
  "questions_for_vet": ["¿Pregunta 1?", "¿Pregunta 2?"],
  "info_checklist": ["Llevar carnet de vacunación", "Anotar última desparasitación"],
  "observations_to_record": ["Registrar frecuencia del síntoma", "Anotar horarios"],
  "tip": "consejo práctico para la consulta",
  "disclaimer": "Lista sugerida para aprovechar mejor tu consulta veterinaria."
}
```

**Modelo**: Haiku 4.5. Temperature 0.3. Max_tokens 400.
**Estimación**: 1 día.

---

## 6. Roadmap de implementación priorizado

| Fase | Prioridad | Feature / Fix | Esfuerzo | Dependencias |
|------|-----------|--------------|----------|-------------|
| **Inmediato** | P0 | Fix CORS bereavement-assistant | 30 min | — |
| **Inmediato** | P0 | Rate limit atómico (RPC) en pet-assistant, ocr, breed-tips | 2h | Migración SQL |
| **Inmediato** | P0 | Few-shot examples en pet-assistant | 1h | — |
| **Semana 1** | P0 | Detector de emergencias explícito en pet-assistant | 2h | — |
| **Semana 1** | P1 | Historial de conversación pet-assistant | 4h | Tabla `ai_chat_messages` |
| **Semana 1** | P1 | Disclaimer "generado por IA" en generate-shelters | 30 min | — |
| **Semana 2** | P1 | Clasificador de feedback admin | 1d | Edge fn + migración |
| **Semana 2** | P1 | Context injection mejorado en medical-suggestions | 2h | — |
| **Semana 3** | P1 | Triage de síntomas conversacional | 2d | Edge fn + UI chat + migración |
| **Semana 4** | P2 | Preparador de consulta vet | 1d | Edge fn + UI |
| **Mes 2** | P2 | Coach nutricional personalizado | 2d | Edge fn + UI |
| **Mes 2** | P2 | Vision para heridas/lesiones | 3d | Edge fn + UI + Vision |
| **Mes 3** | P2 | Historial bereavement chat | 2h | Ya tiene tabla |
| **Mes 3** | P2 | OCR system prompt mejorado | 1h | — |
| **Mes 3** | P3 | Observabilidad completa (logEdgeFunctionCall en todas las fns) | 4h | — |
| **Mes 3** | P3 | A/B testing de prompts | 2d | Tabla `prompt_variants` + lógica |

---

## 7. Anexo: Checklist de QA para features con IA

### Pre-deploy

- [ ] System prompt no contiene API keys, secrets ni datos sensibles
- [ ] Input del usuario está sanitizado contra prompt injection
- [ ] Rate limiting implementado y testeado (probar con requests paralelos)
- [ ] Fallback funciona si Claude API está caído (hardcoded responses)
- [ ] JSON output se valida/parsea con try-catch + fallback
- [ ] CORS usa `getCorsHeaders(req)`, NO wildcard `*`
- [ ] Temperature apropiada (0-0.2 médico/safety, 0.3 general, 0.5-0.7 creativo/emocional)
- [ ] max_tokens dimensionado (no excesivo, no insuficiente)
- [ ] Timeout configurado con AbortController
- [ ] Token usage logging activo (`console.log` del `data.usage`)

### Safety (features médicos)

- [ ] Disclaimer visible en UI junto a cada respuesta de IA
- [ ] "NO diagnosticar" explícito en system prompt
- [ ] "NO sugerir dosis" explícito en system prompt
- [ ] Detector de emergencias con escalamiento (ir a urgencias)
- [ ] Alergias del paciente consideradas en el contexto
- [ ] Consentimiento del usuario para procesamiento con IA (al menos implícito)

### Safety (bereavement/emocional)

- [ ] Crisis keywords detection activa
- [ ] Hotlines de crisis en respuesta de error
- [ ] Log a safety_logs para auditoría
- [ ] Consentimiento explícito antes de empezar
- [ ] No guardar mensajes sin consentimiento

### Post-deploy

- [ ] Monitorear rate limit usage (¿usuarios chocan con límite?)
- [ ] Revisar token costs en Anthropic Console
- [ ] Revisar cache hit rate (¿se están aprovechando los caches?)
- [ ] Revisar safety logs (¿hay falsos positivos/negativos en crisis detection?)
- [ ] Revisar feedback de usuarios sobre calidad de respuestas

---

## 8. Anexo: Plantilla de system prompt estándar Paw Friend

```
Eres {ROL_ESPECÍFICO} de Paw Friend, una app chilena de salud de mascotas para dueños y veterinarios.

## DATOS DEL PACIENTE (si aplica)
{petContext — solo incluir campos con valor}

## INSTRUCCIONES
{instrucciones_específicas_del_feature}

## REGLAS
1. Responde en español chileno (tú, tienes, puedes). NO voseo.
2. {regla_específica_1}
3. {regla_específica_2}
4. NUNCA inventes datos que no estén en el contexto proporcionado.
5. Sé conciso: máximo {N} oraciones/palabras.

## SEGURIDAD (incluir en features médicos)
- NUNCA des diagnósticos definitivos
- NUNCA sugieras dosis de medicamentos
- Si detectas emergencia → "Lleva a tu mascota a urgencias veterinarias AHORA"
- Alergias registradas → advertir si tu sugerencia puede entrar en conflicto

## FUERA DE DOMINIO
Si la pregunta no es sobre {dominio}, responde: "Solo puedo ayudarte con {dominio}."

## FORMATO DE SALIDA
Responde SOLO con JSON válido, sin markdown ni texto adicional:
{schema_json}

## EJEMPLOS (2-3 few-shot)
Input: "{ejemplo_input_1}"
Output: {ejemplo_output_1_json}

Input: "{ejemplo_input_2}"
Output: {ejemplo_output_2_json}
```

### Principios de la plantilla

1. **Identidad clara**: siempre empezar con "Eres {rol} de Paw Friend"
2. **Contexto del paciente**: inyectar solo campos con valor (reduce tokens)
3. **Reglas numeradas**: fácil de seguir para el modelo
4. **Safety explícita**: no confiar en que el modelo "sabe" que no debe diagnosticar
5. **Fuera de dominio**: evitar que el modelo responda preguntas no relevantes
6. **JSON output**: con schema ejemplo para consistencia
7. **Few-shot**: 2-3 examples mejoran calidad ~30% sin cost significativo
8. **Máximo tokens**: dimensionar al output esperado, no al máximo del modelo

---

*Fin de la auditoría. Documento generado automáticamente por Claude Code.*
*Para implementar los fixes P0, ejecutar las correcciones en el orden del roadmap.*
