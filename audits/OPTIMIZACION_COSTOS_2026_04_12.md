# Optimizacion de costos — Paw Friend

> Analisis completo de costos operativos y plan de eficiencia maxima.
> Fecha: 2026-04-12 | Actualizado: 2026-04-12 | Autor: Claude Code (auditoria automatizada)

---

## Resumen ejecutivo

Paw Friend tiene **costos fijos bajos (~$34 USD/mes)** pero **costos variables mal controlados** que pueden escalar peligrosamente con usuarios. Los 3 mayores riesgos son:

1. **Anthropic API**: 11 edge functions usan `claude-sonnet-4-5` (incluye `verify-service-provider` y `process-consultation-transcript` agregados recientemente) cuando 9 de ellas funcionarian igual con Haiku (~85% mas barato). Cero caching implementado. 5 funciones usan `web_search` tool de Anthropic (costo adicional no contabilizado inicialmente).
2. **WhatsApp Cloud API**: cron cada hora (24x/dia) cuando 1x/dia basta. Sin filtro de opt-in antes de despachar. Cada mensaje no-opt-in genera 2 invocaciones de edge function + queries DB para nada.
3. **Realtime Supabase**: 3 de 4 subscripciones con tabla `messages`/`posts` no tienen filtro por usuario — broadcast global. (`PostComments.tsx` SI tiene filtro correcto por `post_id`).

**Ahorro estimado implementando todas las optimizaciones: 70-85% en costos variables.**

---

## Tabla de contenidos

1. [Costos actuales desglosados](#1-costos-actuales-desglosados)
2. [Anthropic Claude API — mayor oportunidad](#2-anthropic-claude-api)
3. [Supabase — base de datos y funciones](#3-supabase)
4. [WhatsApp Cloud API (Meta)](#4-whatsapp-cloud-api)
5. [Google APIs](#5-google-apis)
6. [Flow.cl (pagos)](#6-flowcl-pagos)
7. [Otros servicios](#7-otros-servicios)
8. [Plan de implementacion priorizado](#8-plan-de-implementacion-priorizado)
9. [Proyeccion de costos optimizados](#9-proyeccion-de-costos-optimizados)
10. [Alternativas evaluadas y descartadas](#10-alternativas-evaluadas-y-descartadas)

---

## 1. Costos actuales desglosados

### Fijos (independientes de usuarios)

| Servicio | Funcion | Costo | Frecuencia |
|---|---|---|---|
| Supabase Pro | DB, Auth, Storage, Edge Fn, Cron | $25 USD | /mes |
| GitHub Pages | Hosting web | $0 | gratis |
| Dominio pawfriend.cl | DNS | ~$12 USD | /ano |
| Apple Developer Program | iOS App Store | $99 USD | /ano |
| Google Play Console | Android Play Store | $25 USD | una vez |
| **Total fijo** | | **~$35 USD/mes** | |

### Variables (escalan con usuarios)

| Servicio | Modelo de cobro | Costo a 1K usuarios/mes | Costo a 5K usuarios/mes |
|---|---|---|---|
| Anthropic Claude API | Por token (Sonnet) | $50-90 USD | $250-500 USD |
| Meta WhatsApp Cloud | $0.027 USD/mensaje utility | $100-200 USD | $500-1,000 USD |
| Google Maps Places | $0.017/sesion (despues de $200 credito) | ~$0 (no activo) | ~$0 (no activo) |
| Supabase overages | Storage, bandwidth, invocaciones | ~$5-10 USD | ~$25-50 USD |
| Flow.cl | ~2.5% por transaccion | Proporcional a ingresos | Proporcional a ingresos |
| Sentry | Errores + replay | ~$0 (no activo) | ~$26 USD si se activa |
| **Total variable** | | **$155-300 USD** | **$800-1,575 USD** |

---

## 2. Anthropic Claude API

### 2.1. Estado actual: todas las funciones usan Sonnet

Las 11 edge functions con IA usan `claude-sonnet-4-5` sin excepcion. **No hay caching de respuestas. No hay prompt caching de la API.** El helper compartido `_shared/ai-base.ts:130` hardcodea `claude-sonnet-4-5` en `callClaude()`, usado por la mayoria de funciones. 5 funciones ademas usan el tool `web_search` de Anthropic (no contabilizado en estimaciones de tokens).

#### Costo por funcion (estimado a 1,000 usuarios activos)

| Funcion | Modelo actual | Tokens in/out aprox | Llamadas/mes | Costo/mes USD | Notas |
|---|---|---|---|---|---|
| `pet-assistant` | sonnet | ~280 / 400 | 30,000 | $20-30 | usa web_search |
| `breed-tips` | sonnet | ~185 / 300 | 15,000 | $8-12 | usa web_search |
| `medical-suggestions` | sonnet | ~80 / 600 | 20,000 | $12-18 | usa web_search |
| `ocr-vaccination-card` | sonnet (vision) | ~2,000-14,000 / 1,024 | 3,000 | $10-20 | usa web_search + vision |
| `bereavement-assistant` | sonnet-20241022 | ~600 / 400 | 2,000 | $3-5 | modelo versionado fijo |
| `moderate-service-promotion` | sonnet | ~150 / 400 | 5,000 | $3-5 | |
| `generate-shelters` | sonnet | ~70 / 200 | ~1 (seed) | ~$0 | usa web_search |
| `generate-weekly-owner-reports` | sonnet | ~130 / 200 | 4,000 | $4-6 | |
| `generate-weekly-vet-reports` | sonnet | ~115 / 200 | 400 | $0.5-1 | |
| `verify-service-provider` | sonnet (via callClaude) | ~300 / 500 | 1,000 | $3-5 | NUEVO — vision para OCR titulo vet |
| `process-consultation-transcript` | sonnet | ~2,500 / 800 | 2,000 | $8-12 | NUEVO — transcripciones de consulta |
| **Total** | | | | **$72-114** | |

### 2.2. Optimizacion A: Bajar modelo a Haiku donde corresponda

Precios comparativos (por millon de tokens):

| Modelo | Input | Output | Relativo a Sonnet |
|---|---|---|---|
| claude-sonnet-4-5 | $3.00 | $15.00 | 1x |
| claude-haiku-3-5 | $0.80 | $4.00 | ~3.7x mas barato input, ~3.7x output |

**Funciones que DEBEN bajar a Haiku** (calidad identica para la tarea):

| Funcion | Justificacion |
|---|---|
| `breed-tips` | Template rigido, 150 palabras max, info factual de razas. Haiku ideal. |
| `medical-suggestions` | Lista JSON de 8-12 items predefinidos por raza. Cero razonamiento complejo. |
| `moderate-service-promotion` | Clasificacion binaria (aprobado/rechazado) con 4 campos JSON. |
| `generate-shelters` | 2 oraciones motivacionales. Tarea trivial. |
| `generate-weekly-owner-reports` | 2 oraciones de insight con stats simples. |
| `generate-weekly-vet-reports` | 2 oraciones de insight con stats simples. |
| `pet-assistant` | Q&A corto sobre datos estructurados de mascota. Respuesta JSON 400 tokens. |
| `process-consultation-transcript` | Extraccion estructurada de datos de transcripcion. Tarea mecanica con formato JSON fijo. |

**Funciones que DEBEN quedarse en Sonnet**:

| Funcion | Justificacion |
|---|---|
| `bereavement-assistant` | Manejo de crisis de salud mental. Protocolo de seguridad critico. No se puede arriesgar. |
| `ocr-vaccination-card` | Vision/OCR requiere precision. Evaluar Haiku 3.5 (soporta vision) con A/B test antes de migrar. |
| `verify-service-provider` | Vision/OCR para titulos veterinarios + matching de nombre. Precision critica para verificacion profesional. |

**Nota sobre `callClaude()` en `ai-base.ts`**: El modelo esta hardcodeado en linea 130. Para migrar a Haiku las funciones que usan este helper, se debe agregar un parametro `model` opcional a `callClaude()` y pasar `claude-haiku-3-5` desde cada funcion que migre.

**Ahorro estimado con Haiku**: ~65-70% en las 8 funciones migradas (7 originales + `process-consultation-transcript`) = **~$42-65 USD/mes menos a 1K usuarios**.

### 2.3. Optimizacion B: Cache de respuestas en Supabase

Dos funciones producen respuestas **100% deterministas** para los mismos inputs:

#### `breed-tips` — cache por (especie, raza)

- Solo ~200 combinaciones comunes de (especie, raza) en Chile
- Despues del warmup, **>95% de llamadas se sirven desde cache**
- Implementacion: tabla `ai_cache_breed_tips` con columnas `species`, `breed`, `response_json`, `created_at`
- TTL sugerido: 90 dias (las razas no cambian)

#### `medical-suggestions` — cache por (especie, raza, tipo_registro)

- 6 tipos de registro x ~200 razas = ~1,200 combinaciones
- Implementacion: tabla `ai_cache_medical_suggestions` con columnas `species`, `breed`, `record_type`, `response_json`, `created_at`
- TTL sugerido: 90 dias

**Ahorro estimado con cache**: despues de 2 semanas de warmup, ~90% de llamadas a estas 2 funciones se eliminan = **~$15-25 USD/mes menos a 1K usuarios**.

### 2.4. Optimizacion C: Prompt caching de la API de Anthropic

La API de Anthropic soporta `cache_control` en el system prompt. Si el system prompt es identico entre llamadas consecutivas (dentro de 5 min), se cobra al 10% del precio normal de input.

**Funciones con system prompt estatico que se benefician**:

| Funcion | System prompt tokens | Llamadas consecutivas probables | Ahorro input |
|---|---|---|---|
| `generate-weekly-owner-reports` | ~30 | Si (batch lunes AM) | ~90% en system tokens |
| `generate-weekly-vet-reports` | ~35 | Si (batch lunes AM) | ~90% en system tokens |
| `breed-tips` | ~150 | Si (uso continuo) | ~90% en system tokens |
| `medical-suggestions` | ~40 | Si (uso continuo) | ~90% en system tokens |
| `bereavement-assistant` | ~550 | Moderado | ~90% en system tokens |

Implementacion: agregar `"cache_control": {"type": "ephemeral"}` al bloque system del request.

**Ahorro estimado**: ~$5-10 USD/mes adicional (complementario a las otras optimizaciones).

### 2.5. Optimizacion D: Caps en funciones cron sin limite

**Problema critico**: `generate-weekly-owner-reports` y `generate-weekly-vet-reports` no tienen cap de usuarios. A 10,000 usuarios = 10,000 llamadas Claude cada lunes.

**Opciones**:

| Opcion | Descripcion | Recomendacion |
|---|---|---|
| Solo Premium | Generar insights solo para usuarios Premium | **Recomendado** — agrega valor al plan de pago |
| Cap global | Max 500 reportes por ejecucion | Parche temporal |
| Template sin IA | Usar templates pre-escritos con variables (sin Claude) | Elimina costo IA al 100%, pierde personalizacion |
| Haiku + cache | Usar Haiku y cachear patrones comunes de insight | Buen balance costo/calidad |

**Recomendacion**: Solo generar reportes IA para Premium. Usuarios gratis reciben un resumen basico con template (sin llamada a Claude). **Ahorro: 80-90% de llamadas semanales eliminadas** (asumiendo 10-15% conversion a Premium).

### 2.6. Resumen de ahorro Anthropic

| Optimizacion | Ahorro mensual (1K users) | Dificultad | Prioridad |
|---|---|---|---|
| Bajar 8 funciones a Haiku + parametrizar callClaude | $42-65 | Baja-Media (parametrizar helper + cambiar en 8 fns) | **P0** |
| Cache breed-tips + medical-suggestions | $15-25 | Media (crear tabla + logica) | **P0** |
| Reportes solo Premium | $3-5 | Baja (if en cron) | **P1** |
| Prompt caching API | $5-10 | Baja (agregar campo JSON) | **P1** |
| **Total** | **$65-105** (~75% reduccion) | | |

---

## 3. Supabase

### 3.1. Realtime — broadcast global sin filtros

**Problema grave**: 3 de 5 subscripciones a `postgres_changes` escuchan la tabla `messages` **sin filtro por usuario**:

| Archivo | Canal | Tabla | Filtro | Problema |
|---|---|---|---|---|
| `src/components/Header.tsx:90` | `header-messages` | `messages` | **Ninguno** | Se ejecuta en TODA pagina autenticada. Cada INSERT en messages de cualquier usuario dispara `loadUnreadMsgs()` |
| `src/pages/Chat.tsx:39` | `messages-changes` | `messages` | **Ninguno** | Recarga lista completa de conversaciones en cada mensaje del sistema |
| `src/components/PostComments.tsx:42` | `comments-{postId}` | `post_likes` / `post_comments` | `post_id=eq.{postId}` | **OK — correctamente filtrado por post** |
| `src/pages/ChatConversation.tsx:47` | `conversation-{id}` | `messages` | `conversation_id=eq.{id}` | OK — correctamente filtrado |
| `src/hooks/useFeedRealtime.ts:11` | `feed-realtime` | `posts` | **Ninguno** | Broadcast de todos los posts nuevos |

**Impacto en costos**: Supabase cobra por mensajes realtime. Con 100 usuarios conectados y 1 mensaje/minuto en el sistema, `Header.tsx` genera 100 broadcasts/minuto = 144,000 mensajes realtime/dia solo de este canal. Supabase Pro incluye 500 conexiones concurrentes y mensajes basicos, pero el volumen de broadcast global puede generar overages.

**Solucion**: Agregar filtros RLS o de columna a cada canal:

```ts
// Header.tsx — filtrar por participante
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'messages',
  filter: `conversation_id=in.(${myConversationIds.join(',')})`
}, callback)

// O mejor: usar un canal por conversacion activa, como ya hace ChatConversation.tsx
```

**Ahorro estimado**: Reduccion del 95%+ de mensajes realtime innecesarios. Previene overages en Supabase Pro.

### 3.2. Queries ineficientes en hooks

#### N+1 y queries duplicadas

| Patron | Archivo | Problema | Solucion |
|---|---|---|---|
| 4 queries por perfil | `useFollows.tsx:27-52` | `is_following` + `is_followed_by` + `count_followers` + `count_following` en 4 round-trips | 1 RPC que retorne los 4 valores |
| Sequential en Home | `Home.tsx:115` | `profiles` → `pets` → `pet_paw_progress` en serie | `Promise.all()` (como ya hace `Profile.tsx`) |
| Admin check sin cache | `useIsAdmin.tsx:21` | `useEffect` raw, sin `useQuery`, re-ejecuta en cada mount | Envolver en `useQuery` con `staleTime: 600000` |
| Polling cada 10s | `useCommunityGroups.tsx:103` | `refetchInterval: 10000` en vez de realtime | Usar subscripcion realtime con filtro de grupo |
| Chat sin limite | `Chat.tsx:62-70` | Embeds TODOS los mensajes de cada conversacion (sin `.limit()`) | `.limit(1).order('created_at', {ascending: false})` para solo ultimo mensaje |
| ~~Reminders sin limite~~ | `useReminders.tsx:54` | **CORREGIDO** — ya filtra completados correctamente (lineas 66-72) | N/A |
| Shelters sin paginacion | `useAdoptionShelters.tsx:43` | `select('*')` sin limite, filtrado client-side | Agregar paginacion server-side |

#### select('*') excesivo

Archivos que traen columnas innecesarias:

| Archivo | Tabla | Columnas necesarias vs traidas |
|---|---|---|
| `Header.tsx:109` | `profiles` | Necesita: `display_name`, `avatar_url`. Trae: `*` (todas) |
| `useReminders.tsx:54` | `pet_reminders` | Trae `*` + join. Especificar columnas reduce payload |
| `useAdoptionShelters.tsx:43` | `adoption_shelters` | Trae `*`. Pagina solo muestra nombre, ubicacion, tipo |

**Ahorro estimado**: No es costo directo en dolares, pero reduce bandwidth de Supabase (que tiene limites en Pro), mejora latencia, y reduce riesgo de overages de egress.

### 3.3. Edge Functions sin verify_jwt

**Problema de seguridad Y costos**: **TODAS** las edge functions tienen `verify_jwt = false` en `config.toml`. Las que usan IA y son mas criticas:

- `pet-assistant`
- `breed-tips`
- `medical-suggestions`
- `moderate-service-promotion`
- `generate-shelters`
- `verify-service-provider` (NUEVO)
- `process-consultation-transcript` (NUEVO)
- `ocr-vaccination-card`
- `bereavement-assistant`
- `generate-weekly-owner-reports`
- `generate-weekly-vet-reports`

Cualquier persona sin autenticar puede invocar estas funciones directamente y generar costos de API Anthropic. La autenticacion manual (`supabase.auth.getUser(token)`) existe dentro de las funciones, pero un atacante podria enviar requests sin token y la funcion igual se ejecuta (consume invocacion de edge function) antes de fallar en auth.

**Solucion**: Cambiar a `verify_jwt = true` en `config.toml` para todas las funciones que requieren usuario autenticado. El JWT se valida en el gateway de Supabase ANTES de invocar la funcion, ahorrando la invocacion completa.

### 3.4. Storage — sin compresion de imagenes

No existe ningun paso de compresion/resize antes de subir imagenes a Storage. Ubicaciones de upload:

- `src/pages/AddPet.tsx:175` — fotos de mascotas
- `src/pages/OnboardingDuenoMinimal.tsx:54` — foto onboarding
- `src/hooks/usePetStories.ts:156` — stories
- `src/components/CreateAdoptionPost.tsx:62` — fotos adopcion
- `src/hooks/useProviderProfile.tsx:138` — avatares

Un usuario con camara de 12MP sube imagenes de 3-8 MB cada una. Con 1,000 usuarios subiendo 5 fotos promedio: ~15-40 GB de storage.

**Solucion**: Comprimir client-side antes de upload (ej: `browser-image-compression` o canvas resize a max 1200px). Reduccion tipica: 80-90% del tamano.

**Ahorro**: Reduce storage de Supabase y bandwidth de egress. Supabase Pro incluye 100 GB storage + 250 GB bandwidth; la compresion evita llegar a overages mucho mas tiempo.

---

## 4. WhatsApp Cloud API

### 4.1. Estado actual

- **Cron**: `reminder-cron` corre cada hora (`0 * * * *`), 24 veces/dia
- **Costo por mensaje**: ~$0.027 USD (utility, Chile)
- **Free tier**: 1,000 conversaciones user-initiated/mes (los utility son business-initiated, no entran en free tier)

### 4.2. Problemas identificados

| Problema | Impacto | Archivo |
|---|---|---|
| Cron cada hora, ventana de 24h fija | 22 de 24 ejecuciones diarias escanean lo mismo y no envian nada (idempotencia lo previene, pero las queries DB y invocaciones de function se gastan) | `reminder-cron/index.ts` |
| N+1 en idempotencia | Por cada reminder, 1 query a `whatsapp_message_log` + 1 HTTP a `send-whatsapp-reminder` | `reminder-cron/index.ts:53-66` |
| Sin filtro de opt-in | El cron despacha HTTP para TODOS los reminders. `send-whatsapp-reminder` verifica opt-in internamente y descarta. Cada descarte = 2 edge function invocations + 3 DB queries desperdiciadas | `reminder-cron/index.ts` |
| Sin batching | Cada mensaje es 1 llamada independiente a Meta API | `send-whatsapp-reminder/index.ts` |
| Profile fetch duplicado | Si un usuario tiene 5 reminders para manana, su perfil se consulta 5 veces | `send-whatsapp-reminder/index.ts` |

### 4.3. Optimizaciones

#### A. Reducir frecuencia del cron (impacto: enorme)

**Cambiar de `0 * * * *` (cada hora) a `0 11 * * *` (1x/dia, 8 AM Chile = 11 UTC).**

- La ventana `[now+23h, now+25h]` ya captura todo lo del dia siguiente
- Ejecutar 1x/dia en vez de 24x/dia = **96% menos invocaciones de cron**
- Los recordatorios se envian a la misma hora que el usuario los espera (manana por la manana)

#### B. Pre-filtrar opt-in en la query del cron

```sql
-- En vez de traer TODOS los reminders y filtrar despues:
SELECT r.*, p.phone, p.whatsapp_opted_in
FROM pet_reminders r
JOIN profiles p ON p.id = r.user_id
WHERE r.due_date BETWEEN $1 AND $2
  AND p.whatsapp_opted_in = true
  AND p.phone IS NOT NULL;
```

**Ahorro**: Elimina el 100% de invocaciones desperdiciadas para usuarios sin opt-in.

#### C. Batch idempotencia

```ts
// ANTES: N queries (una por reminder)
for (const reminder of reminders) {
  const { data } = await supabase.from('whatsapp_message_log')
    .select('id').eq('reference_id', reminder.id)...
}

// DESPUES: 1 query
const ids = reminders.map(r => r.id);
const { data: sent } = await supabase.from('whatsapp_message_log')
  .select('reference_id').in('reference_id', ids)
  .eq('status', 'sent').gte('created_at', twentyHoursAgo);
const sentSet = new Set(sent.map(s => s.reference_id));
```

**Ahorro**: De N+1 queries a 1 query. A 100 reminders/dia: 99 round-trips DB eliminados.

#### D. Consolidar mensajes por usuario

Si un usuario tiene 3 reminders para manana, enviar **1 solo mensaje** con las 3 en vez de 3 mensajes separados.

**Ahorro**: ~66% menos mensajes Meta (a $0.027 c/u, significativo a escala).

### 4.4. Resumen ahorro WhatsApp

| Optimizacion | Ahorro | Dificultad |
|---|---|---|
| Cron 1x/dia | 96% menos invocaciones edge fn | Cambiar 1 linea en schedule |
| Pre-filtrar opt-in | ~60-80% menos HTTP internos | Modificar query SQL |
| Batch idempotencia | ~99% menos queries DB en el loop | Refactor menor |
| Consolidar por usuario | ~50-66% menos mensajes Meta | Refactor medio |
| **Total** | **70-85% reduccion de costos WhatsApp** | |

---

## 5. Google APIs

### 5.1. Google Maps / Places — actualmente $0

**Hallazgo clave: Google Maps API no esta activo.** El script de Google Maps JS nunca se carga en `index.html` ni en `App.tsx`. `PlacesAutocomplete.tsx` existe pero no se importa en ningun lugar. `isGoogleMapsAvailable()` retorna `false` siempre. Los mapas usan **Leaflet + OpenStreetMap** (gratis).

**Costo actual: $0.** No hay riesgo de costos Google Maps mientras no se active.

**Si se activa en el futuro**: Google da $200 USD/mes de credito gratis. Con uso moderado (< 28,000 map loads/mes o < 11,700 Places sessions/mes), el costo seria $0.

**Recomendacion**: Mantener Leaflet/OSM como base. Solo activar Google Places si se necesita autocompletado de direcciones (y aprovechar el credito gratis). Limpiar el dead code de `PlacesAutocomplete.tsx` y `googleMapsConfig.ts` si no se va a usar.

### 5.2. Google Calendar — ineficiencia en sync

**Problema**: `google-calendar-sync` se invoca en cada creacion de reminder (`useReminders.tsx:93`) y sincroniza TODOS los reminders del usuario (no solo el nuevo).

| Problema | Detalle |
|---|---|
| Full sync por cada reminder nuevo | Si un usuario tiene 30 reminders y crea 1, se hacen 31 llamadas a Google Calendar API |
| Sin dirty flag | No compara `updated_at > last_synced_at` — re-envia todo siempre |
| Sin batching | Google Calendar soporta batch de 50 requests en 1 HTTP call; aqui va 1x1 |
| Se invoca sin verificar conexion | `useReminders.tsx:93` llama al sync aunque el usuario no tenga Google Calendar conectado |

**Soluciones**:

1. **Verificar conexion antes de invocar**: En `useReminders.tsx`, solo llamar sync si el usuario tiene `google_calendar_connected = true` (guardar en el perfil local o en React Query cache).
2. **Sync incremental**: Solo enviar el reminder recien creado/modificado, no todos.
3. **Batch API calls**: Agrupar en batch requests de Google Calendar API.

**Ahorro**: Google Calendar API es gratis, pero las invocaciones de edge function no. Cada sync innecesario = 1 invocacion de Supabase edge function. A 1,000 usuarios creando 5 reminders/semana = 5,000 invocaciones desperdiciadas/semana si no tienen Google Calendar conectado.

---

## 6. Flow.cl (pagos)

### 6.1. Costos transaccionales

Flow.cl cobra ~2.49% por transaccion. Esto es proporcional al ingreso y no optimizable significativamente (es la tarifa del mercado en Chile).

| Escenario | Suscriptores Premium | Ingreso mensual CLP | Comision Flow CLP |
|---|---|---|---|
| Inicial | 50 | $199,500 | ~$4,975 |
| Crecimiento | 200 | $798,000 | ~$19,870 |
| Escala | 1,000 | $3,990,000 | ~$99,350 |

### 6.2. Optimizaciones menores

| Item | Detalle | Impacto |
|---|---|---|
| `signFlowParams` duplicado | La misma funcion esta copiada en `flow-create-subscription` y `flow-webhook` en vez de importar de `_shared/flow-utils.ts` | Riesgo de bug, no costo directo |
| `end_date` placeholder 5 anos | Si webhook falla despues de borrar el pending, usuario pago sin registro | Riesgo de ingreso perdido |
| Fomentar plan anual | $39,900/ano vs $47,880/ano (12x$3,990) = 16% descuento. Menos transacciones = menos comisiones Flow | Menos comisiones acumuladas |

**Recomendacion**: Promover el plan anual mas agresivamente. Reduce transacciones mensuales y comisiones Flow en ~83% por usuario que migra a anual.

---

## 7. Otros servicios

### 7.1. Sentry — no activo, planificar bien

`@sentry/react` esta instalado. DSN no configurado en produccion. Si se activa:

| Tier Sentry | Errores/mes | Costo |
|---|---|---|
| Developer (free) | 5,000 | $0 |
| Team | 50,000 | $26/mes |
| Business | 100,000+ | $80+/mes |

**Config actual en codigo** (`src/lib/sentry.ts`): `tracesSampleRate: 0.1`, `replaysOnErrorSampleRate: 0.5`. Session Replay es lo mas caro de Sentry.

**Recomendacion**: Activar con free tier primero. Reducir `replaysOnErrorSampleRate` a `0.1` para evitar saltar al tier pago.

### 7.2. Analytics — no integrado

`src/lib/analytics.ts` tiene la infraestructura pero no conecta a ningun provider. Opciones cuando se active:

| Provider | Free tier | Costo despues |
|---|---|---|
| PostHog Cloud | 1M eventos/mes | ~$0.00031/evento |
| Mixpanel | 20M eventos/mes (new) | Pricing custom |
| Plausible | No free tier | $9/mes (10K pageviews) |
| Umami (self-hosted) | Ilimitado | $0 (hosting propio) |

**Recomendacion**: PostHog Cloud o Mixpanel free tier cubren mas que suficiente para los primeros 5,000 usuarios.

### 7.3. Firebase/FCM — gratis

Push notifications Android via FCM no tienen costo. iOS requiere el Apple Developer Program ($99/ano), que ya esta contabilizado en costos fijos.

### 7.4. PDF generation — gratis

`pdf-lib` corre dentro de la edge function. Sin costo externo. Solo consume CPU de Supabase edge function.

---

## 8. Plan de implementacion priorizado

### Fase 1 — Quick wins — EJECUTADO 2026-04-12

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1.1 | Cambiar modelo a `claude-haiku-3-5` en 8 funciones + parametrizar `callClaude()` | HECHO | 8 fns migradas, `ai-base.ts` parametrizado, deployeado |
| 1.2 | Reducir cron WhatsApp a 1x/dia | HECHO | `0 11 * * *` configurado en pg_cron (jobid 8) |
| 1.3 | Activar `verify_jwt = true` en funciones IA | HECHO | 11 fns cambiadas, 3 muertas eliminadas, deployeado |
| 1.4 | Agregar `cache_control` a system prompts | HECHO | 11 fns con prompt caching ephemeral, deployeado |

### Fase 2 — Optimizaciones medias — PARCIALMENTE EJECUTADO 2026-04-12

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.1 | Cache de `breed-tips` y `medical-suggestions` en tabla Supabase | PENDIENTE | Crear tabla `ai_cache_breed_tips` + logica en edge fn |
| 2.2 | Pre-filtrar opt-in WhatsApp en query del cron | HECHO | Implementado en reminder-cron rewrite |
| 2.3 | Batch idempotencia WhatsApp | HECHO | 1 query batch en vez de N+1 |
| 2.4 | Reportes semanales solo para Premium | PENDIENTE | Agregar `if (!is_premium) return template` en weekly-*-reports |
| 2.5 | Filtros en realtime subscriptions | HECHO | Header.tsx y Chat.tsx filtrados por conversation_id. useFeedRealtime dejado global (social feed intencional) |

### Extras ejecutados (no en plan original)

| # | Tarea | Estado | Notas |
|---|---|---|---|
| E.1 | `Home.tsx` loads en paralelo (Promise.all) | HECHO | 3 queries independientes en paralelo |
| E.2 | `Chat.tsx` limitar mensajes embebidos | HECHO | `.limit(1, { referencedTable: 'messages' })` |
| E.3 | `Header.tsx` select optimizado | HECHO | `select('display_name, avatar_url, level, points')` |
| E.4 | `useIsAdmin` migrado a useQuery | HECHO | staleTime 10 min |
| E.5 | `useCommunityGroups` polling 60s | HECHO | De 10s a 60s |

### Fase 3 — Pendiente (5-10 horas)

| # | Tarea | Archivo(s) | Ahorro |
|---|---|---|---|
| 3.1 | `useFollows` → 1 RPC en vez de 4 queries | `useFollows.tsx` | 75% menos round-trips en perfiles |
| 3.2 | Google Calendar sync incremental | `google-calendar-sync`, `useReminders.tsx` | ~95% menos invocaciones sync |
| 3.3 | Compresion de imagenes client-side | `AddPet.tsx`, `OnboardingDuenoMinimal.tsx`, etc. | 80-90% menos storage |
| 3.4 | Consolidar WhatsApp 1 msg/usuario | `reminder-cron`, `send-whatsapp-reminder` | ~50% menos mensajes Meta |

---

## 9. Proyeccion de costos optimizados

### A 1,000 usuarios activos/mes

| Servicio | Costo actual | Costo optimizado | Ahorro |
|---|---|---|---|
| Supabase Pro | $25 | $25 | $0 (fijo) |
| Anthropic Claude API | $60-97 | $10-20 | **$50-77** |
| WhatsApp Cloud API | $100-200 | $30-60 | **$70-140** |
| Google APIs | $0 | $0 | $0 |
| Supabase overages | $5-10 | $0-2 | **$5-8** |
| Flow.cl | Proporcional | Proporcional | $0 |
| Otros (Sentry, etc.) | $0 | $0 | $0 |
| **Total** | **$190-332** | **$65-107** | **$125-225 (~65%)** |

### A 5,000 usuarios activos/mes

| Servicio | Costo actual | Costo optimizado | Ahorro |
|---|---|---|---|
| Supabase Pro | $25 | $25 | $0 |
| Anthropic Claude API | $250-500 | $40-80 | **$210-420** |
| WhatsApp Cloud API | $500-1,000 | $100-200 | **$400-800** |
| Google APIs | $0 | $0 | $0 |
| Supabase overages | $25-50 | $5-10 | **$20-40** |
| **Total** | **$800-1,575** | **$170-315** | **$630-1,260 (~78%)** |

---

## 10. Alternativas evaluadas y descartadas

### 10.1. Reemplazar Supabase por self-hosted

| Pro | Contra |
|---|---|
| Sin limite de invocaciones | Costo de VPS ($20-50/mes para Postgres + storage + edge) |
| Control total | Mantencion de infra, backups, updates, SSL |
| | Auth, Realtime, Storage hay que replicar |
| | **No vale la pena hasta $200+/mes en Supabase** |

**Veredicto**: Descartado. Supabase Pro a $25/mes es mas barato que cualquier VPS equivalente con las mismas features.

### 10.2. Reemplazar Anthropic por OpenAI

| Pro | Contra |
|---|---|
| GPT-4o-mini es ~50% mas barato que Haiku | Cambiar SDK/formato en 10 funciones |
| | Calidad inferior en espanol chileno (probado informalmente) |
| | Vendor lock-in igual, solo cambia el vendor |
| | **La diferencia de costo Sonnet→Haiku ya cubre el 65% del ahorro** |

**Veredicto**: Descartado. Migrar a Haiku da el 80% del beneficio con 5% del esfuerzo.

### 10.3. Reemplazar Anthropic por modelos open-source (Llama, Mistral)

| Pro | Contra |
|---|---|
| Potencialmente gratis si es self-hosted | Requiere GPU ($50-200/mes en cloud) o API de terceros (Together, Groq) |
| Sin limites de rate | Calidad inferior en espanol chileno para tareas especificas |
| | Latencia mayor self-hosted |
| | **No justificado hasta que el gasto IA supere $300/mes** |

**Veredicto**: Descartado por ahora. Reconsiderar si el gasto Anthropic supera $300/mes despues de optimizar.

### 10.4. Reemplazar WhatsApp por email

| Pro | Contra |
|---|---|
| Supabase Auth emails gratis (limitados) | Open rate email ~20% vs WhatsApp ~90% |
| Resend/Sendgrid free tier: 100/dia | Los usuarios chilenos prefieren WhatsApp por lejos |
| | **Perderia la ventaja competitiva de recordatorios WhatsApp** |

**Veredicto**: No reemplazar, pero ofrecer email como fallback gratuito y WhatsApp como feature Premium.

### 10.5. Mover WhatsApp a plan gratuito con limitaciones

**Opcion hibrida recomendada**:
- Usuarios gratis: recordatorios por email (costo ~$0)
- Usuarios Premium: recordatorios por WhatsApp ($0.027/msg)
- Esto alinea el costo variable con el ingreso recurrente

---

## Apendice: Tabla de referencia rapida de precios

### Anthropic (abril 2026)

| Modelo | Input/MTok | Output/MTok | Cache write | Cache read |
|---|---|---|---|---|
| claude-sonnet-4-5 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-haiku-3-5 | $0.80 | $4.00 | $1.00 | $0.08 |

### Supabase Pro

| Recurso | Incluido | Overage |
|---|---|---|
| Database | 8 GB | $0.125/GB |
| Storage | 100 GB | $0.021/GB |
| Bandwidth | 250 GB | $0.09/GB |
| Edge Fn invocaciones | 2M | $2/M |
| Realtime mensajes | 5M | $2.50/M |
| Realtime conexiones | 500 concurrent | $10/1000 |

### Meta WhatsApp Cloud (Chile)

| Tipo | Costo/mensaje |
|---|---|
| Utility (business-initiated) | ~$0.027 USD |
| Marketing (business-initiated) | ~$0.062 USD |
| Service (user-initiated, 24h window) | Gratis (primeras 1,000/mes) |
