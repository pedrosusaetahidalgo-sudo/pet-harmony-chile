# Microchip + Registro Nacional de Mascotas Chile

> Spec para consultar el Registro Nacional de Mascotas (Ley 21.020 "Ley Cholito") a partir del numero de microchip y auto-poblar datos en Paw Friend.

**Estado**: Pendiente
**Prioridad**: Media-Alta (diferenciador competitivo, ahorra tiempo al dueno y al vet)
**Dependencias**: Campo `microchip_number` ya existe en DB y formulario AddPet

---

## 1. Contexto

### 1.1. Que existe hoy

- Campo `microchip_number` (TEXT) en tabla `pets`
- Input en AddPet.tsx (linea 1062) con validacion ISO 15 digitos
- Validacion de unicidad contra la DB (lineas 472-488)
- Display en PetHeader de ficha clinica (shared.tsx:273-278)
- El campo es de ingreso manual, sin consulta externa

### 1.2. Que queremos agregar

- Boton "Buscar en Registro Nacional" junto al campo de microchip
- Consulta al registro SAG/ACHIPIA con el numero de chip
- Auto-poblar campos del perfil con la info obtenida
- Mostrar badge "Verificado en Registro Nacional" cuando la mascota tiene match

---

## 2. Registro Nacional de Mascotas de Chile

### 2.1. Marco legal

- **Ley 21.020** (2017, "Ley Cholito"): obliga a registrar e identificar con microchip a perros y gatos
- **Organismo**: Subsecretaria de Desarrollo Regional (SUBDERE), no SAG directamente
- **Plataforma**: registronacionaldemascotas.cl (administrado por SUBDERE)
- **Registro veterinario**: los vets registrados insertan chips ISO 11784/11785 (FDX-B, 134.2 kHz, 15 digitos)

### 2.2. Datos disponibles en el registro

Segun la ficha publica del registro, al consultar un microchip se obtiene:

| Dato | Campo Paw Friend equivalente | Auto-poblar? |
|---|---|---|
| Nombre del animal | `name` | Si (si vacio) |
| Especie | `species` | Si |
| Raza | `breed` | Si (si vacio) |
| Sexo | `gender` | Si |
| Color | `color` | Si (si vacio) |
| Fecha nacimiento (aprox) | `birth_date` | Si (si vacio) |
| Esterilizado | `neutered` | Si |
| Nombre del responsable | — (no guardamos datos del dueno externo) | No |
| RUT del responsable | — | No (datos sensibles) |
| Comuna de registro | — (metadata) | Mostrar pero no guardar |
| Fecha de registro chip | `chip_registered_at` (nuevo) | Si |
| Veterinario que instalo | `chip_vet_name` (nuevo) | Si |

### 2.3. Como acceder a los datos — analisis de opciones

#### Opcion A: API oficial (ideal pero no existe hoy)

- registronacionaldemascotas.cl **no tiene API publica documentada** a la fecha
- Se puede enviar solicitud formal via Transparencia (Ley 20.285) pidiendo acceso API o datos abiertos
- Contacto: Mesa de ayuda SUBDERE o portal de datos abiertos datos.gob.cl

**Accion recomendada**: Enviar solicitud a SUBDERE pidiendo:
1. Acceso a endpoint de consulta por microchip
2. Formato de respuesta (idealmente JSON)
3. Rate limits y condiciones de uso
4. Si existe plan de API publica

Modelo de carta en seccion 6.

#### Opcion B: Scraping controlado (intermedio, con riesgos)

- La pagina permite buscar por numero de chip
- Se puede hacer scraping con una edge function (Deno fetch + parse HTML)
- **Riesgos**:
  - Puede violar TOS del sitio
  - El HTML puede cambiar sin aviso
  - Rate limiting / IP blocking
  - Zona gris legal (datos publicos, pero el metodo no esta autorizado)

**Si se usa esta opcion**:
- Implementar como edge function con cache agresivo (1 chip = 1 consulta, cachear resultado)
- Rate limit: max 10 consultas/min por usuario
- User-Agent honesto: `PawFriend/1.0 (+https://pawfriend.cl)`
- Guardar resultado en DB para no re-consultar
- Plan B inmediato si el sitio bloquea

#### Opcion C: Base de datos ICAM / AIAC (internacional)

- Los chips ISO tienen prefijo de pais (152 = Chile) y fabricante
- Plataformas internacionales como petmaxx.com o europetnet.com agregan registros de multiples paises
- Algunos permiten consulta por API (petmaxx tiene API limitada)
- Cobertura de Chile: parcial, depende de que el fabricante reporte

**Util como fallback**, no como fuente primaria para Chile.

#### Opcion D: Convenio directo con clinicas veterinarias (largo plazo)

- Las clinicas que instalan chips tienen la data en sus sistemas
- Si Paw Friend crece en el segmento vet, se puede ofrecer:
  - "Tu instalas el chip → nosotros registramos en Paw Friend automaticamente"
  - Edge function `create-patient` ya soporta `microchip_number`
- Esto crea un registro paralelo propio, complementario al oficial

### 2.4. Recomendacion de implementacion por fases

| Fase | Que | Dependencia |
|---|---|---|
| **Fase 1** (ahora) | UI de lookup + campos nuevos + mock/manual | Ninguna |
| **Fase 2** (1-2 semanas) | Edge function scraping con cache | Analizar TOS del registro |
| **Fase 3** (si hay respuesta) | Migrar a API oficial SUBDERE | Respuesta solicitud formal |
| **Fase 4** (mediano plazo) | Registro propio via red de vets | Traccion B2B |

---

## 3. Cambios en base de datos

### 3.1. Nuevas columnas en `pets`

```sql
-- Migracion: YYYYMMDDHHMMSS_microchip_registry_lookup.sql

-- Datos obtenidos del registro nacional
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS chip_registered_at DATE,
  ADD COLUMN IF NOT EXISTS chip_vet_name TEXT,
  ADD COLUMN IF NOT EXISTS chip_registry_source TEXT,       -- 'registro_nacional' | 'manual' | 'vet_entry'
  ADD COLUMN IF NOT EXISTS chip_registry_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS chip_registry_data JSONB;        -- respuesta cruda del registro (para auditar)

-- Index para busqueda por chip (ya deberia existir, verificar)
CREATE INDEX IF NOT EXISTS idx_pets_microchip
  ON public.pets (microchip_number)
  WHERE microchip_number IS NOT NULL;

COMMENT ON COLUMN public.pets.chip_registered_at IS 'Fecha de registro del chip en registro nacional';
COMMENT ON COLUMN public.pets.chip_vet_name IS 'Veterinario que instalo el chip segun registro';
COMMENT ON COLUMN public.pets.chip_registry_source IS 'Fuente de datos del chip: registro_nacional, manual, vet_entry';
COMMENT ON COLUMN public.pets.chip_registry_verified_at IS 'Ultima verificacion contra registro nacional';
COMMENT ON COLUMN public.pets.chip_registry_data IS 'Respuesta cruda del registro (JSON, para auditar)';
```

### 3.2. Tabla de cache de consultas (evitar re-scraping)

```sql
CREATE TABLE IF NOT EXISTS public.microchip_registry_cache (
  microchip_number TEXT PRIMARY KEY,
  registry_data JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'registro_nacional',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  fetch_status TEXT NOT NULL DEFAULT 'success'  -- 'success' | 'not_found' | 'error'
);

-- RLS: solo lectura para usuarios autenticados, escritura solo via service_role (edge fn)
ALTER TABLE public.microchip_registry_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cache"
  ON public.microchip_registry_cache FOR SELECT
  TO authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated — solo service_role (edge function)
```

---

## 4. Edge Function: `lookup-microchip`

### 4.1. Endpoint

```
POST /functions/v1/lookup-microchip
Authorization: Bearer <user_jwt>
Content-Type: application/json

{ "microchip_number": "152000012345678" }
```

### 4.2. Flujo interno

```
1. Validar JWT (verify_jwt: true)
2. Validar formato ISO: 15 digitos, prefijo 152 (Chile) o aceptar otros
3. Buscar en microchip_registry_cache
   → Si existe y no expiro → retornar cache
4. Si no hay cache:
   a. Consultar registro nacional (scraping o API segun fase)
   b. Parsear respuesta
   c. Guardar en microchip_registry_cache
   d. Retornar datos
5. Rate limit: 10 consultas/min por user_id
```

### 4.3. Respuesta

```json
{
  "found": true,
  "data": {
    "name": "Max",
    "species": "perro",
    "breed": "Pastor Aleman",
    "gender": "macho",
    "color": "Negro y fuego",
    "birth_date": "2022-03-15",
    "neutered": true,
    "chip_registered_at": "2022-06-20",
    "chip_vet_name": "Dra. Maria Lopez",
    "registration_commune": "Providencia"
  },
  "source": "registro_nacional",
  "cached": false
}
```

### 4.4. Scraping del registro (Fase 2)

```typescript
// supabase/functions/lookup-microchip/index.ts (pseudocodigo)

async function fetchFromRegistroNacional(chipNumber: string) {
  // URL del formulario de consulta publica
  const REGISTRY_URL = "https://registronacionaldemascotas.cl/consulta";

  // 1. Hacer POST al formulario con el numero de chip
  const response = await fetch(REGISTRY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "PawFriend/1.0 (+https://pawfriend.cl)",
    },
    body: new URLSearchParams({ microchip: chipNumber }),
  });

  // 2. Parsear HTML de respuesta
  const html = await response.text();

  // 3. Extraer datos con regex o DOMParser (Deno)
  // NOTA: La estructura exacta del HTML debe verificarse manualmente
  //       antes de implementar el parser
  const parsed = parseRegistryHTML(html);

  return parsed;
}

function parseRegistryHTML(html: string): RegistryData | null {
  // Implementar segun estructura real del sitio
  // Verificar manualmente en https://registronacionaldemascotas.cl
  // antes de escribir el parser
  throw new Error("TODO: implementar despues de analizar HTML del registro");
}
```

**IMPORTANTE**: Antes de implementar el scraping:
1. Visitar manualmente registronacionaldemascotas.cl
2. Documentar la URL exacta de consulta y metodo (GET/POST)
3. Capturar un ejemplo de respuesta HTML
4. Verificar si hay CAPTCHA o proteccion anti-bot
5. Leer TOS del sitio

---

## 5. Cambios en frontend

### 5.1. AddPet.tsx — Boton "Buscar en Registro"

Junto al input de microchip (linea 1062), agregar:

```tsx
<div className="space-y-2">
  <Label htmlFor="microchip">Numero de Microchip</Label>
  <div className="flex gap-2">
    <Input
      id="microchip"
      value={formData.microchip_number}
      onChange={(e) => updateField("microchip_number", e.target.value.replace(/\D/g, "").slice(0, 15))}
      placeholder="152XXXXXXXXXXXX"
      maxLength={15}
      className="font-mono"
    />
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLookupChip}
      disabled={!formData.microchip_number || formData.microchip_number.length !== 15 || isLookingUp}
      className="shrink-0"
    >
      {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      Buscar
    </Button>
  </div>
  <p className="text-xs text-muted-foreground">
    15 digitos ISO 11784. Prefijo 152 = Chile.
  </p>
</div>
```

### 5.2. Dialog de confirmacion de datos

Cuando el registro retorna datos, mostrar un dialog:

```
┌──────────────────────────────────────────────┐
│  Datos encontrados en Registro Nacional      │
│                                              │
│  Nombre: Max                                 │
│  Especie: Perro                              │
│  Raza: Pastor Aleman                         │
│  Sexo: Macho                                 │
│  Color: Negro y fuego                        │
│  Nacimiento: 15/03/2022                      │
│  Esterilizado: Si                            │
│  Registrado: 20/06/2022 (Providencia)        │
│  Veterinario: Dra. Maria Lopez               │
│                                              │
│  ☑ Nombre       ☑ Raza      ☑ Color         │
│  ☑ Sexo         ☑ Nacimiento                │
│  ☑ Esterilizado                              │
│                                              │
│  [Cancelar]            [Aplicar seleccion]   │
└──────────────────────────────────────────────┘
```

- Cada campo tiene checkbox para que el usuario elija que importar
- Campos que ya tienen valor en el formulario se muestran con warning: "Ya tienes: Golden Retriever → Se cambiara a: Pastor Aleman"
- Boton "Aplicar seleccion" actualiza el formulario con los campos seleccionados

### 5.3. Badge "Verificado" en ficha clinica

En PetHeader (shared.tsx:273-278), si `chip_registry_verified_at` existe:

```tsx
{pet.microchip_number && (
  <div className="flex items-center gap-1.5 text-muted-foreground">
    <Shield className="h-3.5 w-3.5" />
    <span className="font-mono text-xs">{pet.microchip_number}</span>
    {pet.chip_registry_verified_at && (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1">
        Verificado
      </Badge>
    )}
  </div>
)}
```

### 5.4. Hook: `useMicrochipLookup`

```typescript
// src/hooks/useMicrochipLookup.ts

export function useMicrochipLookup() {
  return useMutation({
    mutationFn: async (microchipNumber: string) => {
      const { data, error } = await supabase.functions.invoke("lookup-microchip", {
        body: { microchip_number: microchipNumber },
      });
      if (error) throw error;
      return data as MicrochipLookupResult;
    },
  });
}
```

---

## 6. Modelo de carta para solicitud API a SUBDERE

```
Asunto: Solicitud de acceso a API de consulta del Registro Nacional de Mascotas

Estimados,

Mi nombre es [NOMBRE], desarrollador de Paw Friend (https://pawfriend.cl),
una plataforma digital de salud y bienestar animal que opera en Chile.

Solicito formalmente informacion sobre la disponibilidad de una API o servicio
web para consultar datos del Registro Nacional de Mascotas (Ley 21.020) a partir
del numero de microchip ISO 11784/11785.

Contexto de uso:
- Nuestra plataforma permite a duenos y veterinarios gestionar fichas clinicas digitales
- Al registrar una mascota, el usuario ingresa su numero de microchip
- Queremos validar y complementar esa informacion con los datos del registro oficial
- Esto mejora la trazabilidad y cumplimiento de la Ley Cholito

Datos que necesitamos consultar:
- Nombre del animal, especie, raza, sexo, color, fecha nacimiento aproximada
- Estado de esterilizacion
- Fecha de registro del chip
- NO necesitamos datos del responsable (RUT, direccion, etc.)

Preguntas especificas:
1. Existe actualmente un endpoint API o servicio web de consulta?
2. De no existir, esta planificado?
3. Es posible acceder a los datos mediante un convenio o acuerdo de uso?
4. Los datos de las mascotas (sin datos personales del responsable) son considerados datos abiertos?

Agradezco su orientacion. Quedo atento a su respuesta.

Saludos cordiales,
[NOMBRE]
[EMAIL]
[TELEFONO]
Paw Friend — pawfriend.cl
```

**Enviar via**:
- Portal de Transparencia: https://www.portaltransparencia.cl/PortalPdT/ (Ley 20.285, respuesta obligatoria en 20 dias habiles)
- Email directo SUBDERE si se encuentra contacto

---

## 7. Validaciones y seguridad

### 7.1. Formato microchip

```typescript
// Validacion ISO 11784/11785
const MICROCHIP_REGEX = /^\d{15}$/;
const CHILE_PREFIX = "152";

function validateMicrochip(chip: string): { valid: boolean; isChilean: boolean } {
  const valid = MICROCHIP_REGEX.test(chip);
  const isChilean = chip.startsWith(CHILE_PREFIX);
  return { valid, isChilean };
}
```

- Aceptar chips no chilenos (mascotas importadas) pero solo buscar en registro nacional los que empiecen con 152
- Mostrar nota: "Este chip no tiene prefijo chileno (152). No se puede verificar en el Registro Nacional."

### 7.2. Rate limiting

- Edge function: max 10 lookups/min por `user_id`
- Cache de 30 dias para resultados exitosos
- Cache de 7 dias para "no encontrado" (el animal podria registrarse despues)

### 7.3. Privacidad

- **NO almacenar** datos del responsable (RUT, nombre, direccion) del registro
- Solo almacenar datos del animal
- `chip_registry_data` (JSONB crudo) debe sanitizarse para remover datos personales antes de guardar
- Log de acceso: registrar quien consulto que chip y cuando (auditoria)

---

## 8. UX copy (espanol chileno)

| Contexto | Texto |
|---|---|
| Label del campo | "Numero de Microchip" |
| Placeholder | "152XXXXXXXXXXXX" |
| Helper text | "15 digitos ISO. Si tu mascota tiene chip, lo encuentras en el certificado de vacunacion o en el carnet de registro." |
| Boton buscar | "Buscar en Registro" |
| Loading | "Consultando Registro Nacional..." |
| Encontrado | "Encontramos a tu mascota en el Registro Nacional" |
| No encontrado | "No encontramos este chip en el Registro Nacional. Puede que no este registrado aun o que el numero tenga un error." |
| Error red | "No pudimos conectar con el registro. Intenta de nuevo en unos minutos." |
| Badge verificado | "Verificado" (tooltip: "Datos confirmados con el Registro Nacional de Mascotas") |
| Chip no chileno | "Este chip no tiene prefijo chileno (152). Solo podemos verificar chips registrados en Chile." |

---

## 9. Metricas de exito

| Metrica | Target |
|---|---|
| % mascotas con microchip registrado | >30% de mascotas activas en 3 meses |
| % lookups exitosos (match en registro) | >60% de consultas |
| Tiempo promedio de auto-poblado | <3s (con cache), <8s (sin cache) |
| Reduccion de campos manuales por mascota | -4 campos promedio cuando hay match |
| Uso del badge "Verificado" como trust signal | Trackear clicks en ficha compartida |

---

## 10. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigacion |
|---|---|---|
| Registro no tiene API y bloquea scraping | Alta | Solicitud formal + modo manual como fallback |
| CAPTCHA en sitio del registro | Media | Usar servicios de resolucion o pivotear a solo manual |
| Datos del registro incompletos o incorrectos | Media | Siempre dejar que el usuario confirme/edite antes de aplicar |
| Ley de datos personales limita acceso | Baja | Solo pedimos datos del animal, no del responsable |
| Chip duplicado (2 mascotas, mismo chip — error de vet) | Baja | Mostrar warning, no bloquear |
