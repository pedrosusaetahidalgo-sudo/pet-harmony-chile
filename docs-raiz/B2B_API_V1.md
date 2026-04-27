# Paw Friend B2B API v1

> Estado: **scaffolding** (2026-04-27). Endpoint deployable; sin clientes
> firmados todavía. Cuando se firme el primer deal, esta página pasa a
> `docs-raiz/api/` o se publica en una landing pública.

## Auth

Header obligatorio en cada request:

```
X-Pawfriend-Api-Key: pf_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Las keys se generan desde el panel admin de Paw Friend (RPC
`create_b2b_api_key`). El cliente recibe la key plaintext **una sola vez**;
después solo se ve el prefix.

## Tiers

| Tier | Rate limit | Scopes default |
|---|---|---|
| `free` | 100 req/h | `breed_stats` |
| `research` | 1.000 req/h | `breed_stats`, `species_stats`, `correlation_catalog` |
| `enterprise` | 10.000 req/h | + `correlation_insights`, `risk_score` (futuro) |

Rate limit es por API key, ventana móvil de 1 hora. Al exceder devolvemos
`429 Too Many Requests` con headers `X-RateLimit-Remaining`, `Retry-After`.

## Endpoint base

```
POST https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/b2b-api
Content-Type: application/json
X-Pawfriend-Api-Key: pf_live_xxx
```

El cuerpo decide qué endpoint llamar (`{ endpoint, params }`):

```json
{
  "endpoint": "breed_stats",
  "params": { "species": "perro", "min_pet_count": 100 }
}
```

## Endpoints v1

### `breed_stats` — stats agregadas por raza

**Params (todos opcionales)**:

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `breed` | string (ILIKE) | — | Filtrar por nombre de raza |
| `species` | string | — | `perro` / `gato` / `otro` |
| `min_pet_count` | int | 50 | Threshold privacy (cap inferior 50) |

**Response**:

```json
{
  "endpoint": "breed_stats",
  "threshold_privacy": 50,
  "count": 12,
  "rows": [
    {
      "breed": "Golden Retriever",
      "species": "perro",
      "pet_count": 184,
      "avg_weight_kg": 28.5,
      "min_weight_kg": 18.0,
      "max_weight_kg": 41.0,
      "avg_age_years": 5.2
    }
    // ...
  ]
}
```

### `species_stats` — overview por especie

**Params**:

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `species` | string | — | Filtrar por una especie específica |
| `min_pet_count` | int | 50 | Threshold privacy |

**Response**: incluye `count_male`, `count_female`, `count_neutered`,
`distinct_breeds`.

### `correlation_catalog` — listar correlaciones disponibles

Sin params. Devuelve todas las `correlation_definitions` con
`status='published'` (las en draft/computing/archived no aparecen).

**Response**:
```json
{
  "endpoint": "correlation_catalog",
  "count": 2,
  "correlations": [
    {
      "id": "uuid",
      "slug": "razas-mas-longevas-chile-vs-mundo",
      "question": "Cuales razas viven mas tiempo en Chile?",
      "category": "longevity",
      "input_dimensions": ["breed", "comuna_zone"],
      "output_metric": "years_lived",
      "status": "published"
    }
  ]
}
```

### `correlation_insights` — observaciones de una correlación

**Params**:

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `definition_id` | UUID | — | (Required) ID de una correlation_definition publicada |
| `min_sample_size` | int | 50 | Threshold privacy. Floor 50. |

**Response**:
```json
{
  "endpoint": "correlation_insights",
  "definition_id": "uuid",
  "threshold_privacy": 50,
  "count": 3,
  "observations": [
    {
      "bucket": { "breed": "Golden Retriever", "comuna_zone": "norte" },
      "sample_size": 87,
      "output_value": 11.2,
      "output_stddev": 1.8,
      "confidence_level": "medium"
    }
  ]
}
```

### `risk_score` — futuro

No disponible en v1. Se activa cuando primer deal con aseguradora cierra
(requiere consent del dueño + scope `risk_score`).

## Privacy

- **Threshold k-anonymity**: ningún row con `pet_count < 50` se expone.
  Los `params.min_pet_count` solo pueden subir el threshold, no bajarlo.
- **No PII**: no exponemos `pet.name`, `owner.email`, `pet.id`, fotos ni
  nada individual. Solo agregados.
- **No re-identificación**: combinar `breed_stats` con `species_stats` no
  permite identificar individuos (ambos tienen el mismo threshold).

Para queries que requieran data más granular o cohortes específicas
(ej: estudios Pharma), contactar a `pawfriendcl@gmail.com` para acuerdo
custom con consent opt-in del usuario.

## Errores

| Status | Causa |
|---|---|
| 400 | Body inválido (no JSON, sin `endpoint`) |
| 401 | API key faltante / inválida / expirada |
| 403 | Scope no incluye el `endpoint` solicitado |
| 405 | Método HTTP distinto de POST |
| 429 | Rate limit por hora excedido |
| 500 | Error interno (DB, etc) |

## Ejemplo curl

```bash
curl -X POST https://gwailbjlvevkhwcrovfd.supabase.co/functions/v1/b2b-api \
  -H "Content-Type: application/json" \
  -H "X-Pawfriend-Api-Key: pf_live_a1b2c3d4e5f6..." \
  -d '{
    "endpoint": "breed_stats",
    "params": { "species": "perro", "min_pet_count": 100 }
  }'
```

## Crear una key (admin)

Desde Supabase SQL Editor logueado como admin:

```sql
SELECT * FROM public.create_b2b_api_key(
  'Mapfre Pet — research',           -- name
  'partner@mapfre.cl',                -- contact_email
  'research',                         -- tier
  NULL,                               -- rate_limit (NULL = default del tier)
  NULL,                               -- scopes (NULL = default del tier)
  NULL,                               -- expires_at (NULL = no expira)
  'Cerrado por Pedro 2026-XX-XX'      -- notes
);
```

Devuelve `plain_key` UNA SOLA VEZ. Copiarla y enviarla al cliente por
canal seguro (1Password share, signal). Después solo queda el `key_prefix`
en la tabla.
