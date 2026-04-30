# Paw Shield · Data Archive para entrenamiento propio

> ⚠️ **DORMIDO desde 2026-04-30 (Opción C)**: la biometría Paw Shield quedó
> fuera del modelo consumer. La tabla `paw_shield_data_archive` y el cron
> `paw-shield-archive-cleanup` siguen en repo intactos. Este spec se
> reactiva solo si un partner B2B financia la captación biométrica en su
> cohort y eso genera flujo de imágenes para training propio. Mantener como
> **referencia histórica**.

Fecha original: 2026-04-29.
Autor: Paw Founder.
Relacionado: [PAW_SHIELD_PLAYBOOK.md](PAW_SHIELD_PLAYBOOK.md), [memoria nose print master plan](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_nose_print_master_plan.md).

---

## 1. Objetivo

Guardar **cada imagen capturada** durante un Paw Shield enrollment o identify
(con metadata anonimizada de la mascota: especie, raza, edad, comuna, accuracy
resultado) para:

1. **Entrenar un modelo propio futuro** que imite el comportamiento de Petify
   (foundation model fine-tuneado en hocicos chilenos).
2. **Validar/auditar Petify**: comparar accuracy con muestras propias.
3. **Mejorar guardrails**: detectar patrones de fotos que fallan (movimiento,
   iluminacion, angulo) y dar tips al usuario.

## 2. Por que importa

- Petify cobra por mascota/mes (**Basic $0.50 / Pro $0.75 / Premium contact-sales** USD/pet/mes — ver [PAW_SHIELD_PLAYBOOK.md](PAW_SHIELD_PLAYBOOK.md)). Tener nuestro propio modelo = independencia tecnologica + costos marginales.
- El dataset chileno (razas locales como quiltro/mestizo, terrier chileno, ovejero magallanico) es unico y dificil de replicar.
- Las imagenes capturadas son de hocicos en condiciones reales (no laboratorio), lo cual es exactamente lo que un modelo de produccion necesita.
- Construye un **moat de datos** progresivo: cada pet enrollado sube ~3-4 fotos. Con 50.000 pets en plataforma, son ~180.000 imagenes etiquetadas de hocicos chilenos.

## 3. Arquitectura propuesta

### 3.1 Storage

- **Bucket Supabase Storage:** `paw-shield-archive` (privado, RLS solo service role).
- **Path:** `pet/{petId}/{enrollment|identify}/{timestamp}_{frameIndex}.jpg`.
- **Lifecycle:** retencion indefinida si el usuario consintio archive; 30 dias si no.
- **Encryption:** at-rest (default Supabase Storage).

### 3.2 Tabla metadata

```sql
CREATE TABLE paw_shield_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL, -- nullable: si pet se borra, conservamos imagen anonimizada para training
  storage_path TEXT NOT NULL UNIQUE,
  capture_kind TEXT NOT NULL CHECK (capture_kind IN ('enrollment', 'identify', 'verification')),
  frame_index INT, -- 0,1,2 si es enrollment de 3 frames
  petify_session_id TEXT, -- ref opcional a la sesion Petify
  petify_pet_id TEXT, -- ref opcional al pet en Petify
  -- Metadata anonima para training (extraido de pets en momento de captura)
  species TEXT, -- 'DOG' | 'CAT'
  breed TEXT,
  age_months INT,
  weight_kg NUMERIC,
  comuna TEXT, -- granularidad geo, no exacta
  -- Resultado del proceso
  petify_quality_score NUMERIC,
  petify_match_score NUMERIC,
  sharpness_laplacian NUMERIC, -- nuestro propio measure
  accepted BOOLEAN, -- si paso threshold de calidad
  -- Consent
  consent_for_training BOOLEAN NOT NULL DEFAULT false,
  consent_revoked_at TIMESTAMPTZ,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- NULL si consent_for_training, sino NOW() + 30 dias
);

CREATE INDEX idx_psa_pet ON paw_shield_archive(pet_id);
CREATE INDEX idx_psa_consent ON paw_shield_archive(consent_for_training) WHERE consent_for_training = true;
CREATE INDEX idx_psa_expires ON paw_shield_archive(expires_at) WHERE expires_at IS NOT NULL;
```

### 3.3 Flujo de captura (ya existente · agregar archivado)

Modificar `paw-shield-register/index.ts` y `paw-shield-identify/index.ts`:

1. Recibe imagenes (3 frames enrollment o 1 identify).
2. (NUEVO) **Antes** de enviar a Petify: subir cada imagen a `paw-shield-archive` bucket.
3. Enviar a Petify (flujo existente).
4. (NUEVO) Insertar registro en `paw_shield_archive` con:
   - storage_path
   - metadata anonimizada (species, breed, age_months, comuna)
   - petify_session_id, quality_score
   - sharpness measure (Laplacian)
   - consent_for_training = `pets.paw_shield_data_archive_consent` (default false, opt-in)

### 3.4 Consent

Agregar columna a tabla `pets`:

```sql
ALTER TABLE pets ADD COLUMN paw_shield_data_archive_consent BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN paw_shield_data_archive_consent_at TIMESTAMPTZ;
```

UI: en el flujo de Paw Shield enrollment, agregar checkbox **opt-in**:

> 🛡️ Permitir que Paw Friend conserve estas imagenes para mejorar la
> identificacion de mascotas chilenas. Las imagenes se almacenan
> anonimizadas (sin tu nombre ni telefono) y se usan solo para entrenar
> nuestro proximo modelo. **Puedes revocar este permiso en cualquier
> momento desde tu perfil.**
>
> [ ] Sí, ayudo a Paw Friend a mejorar
> [ ] No, prefiero que se borren en 30 dias

### 3.5 Lifecycle

- Cron diario que ejecuta `DELETE FROM paw_shield_archive WHERE expires_at < NOW()` y borra el blob asociado del bucket.
- ARCO/Ley 19.628: si el usuario solicita borrar su cuenta, ON DELETE CASCADE de `pets.id` setea `pet_id = NULL` (preservamos la imagen anonimizada solo si consent=true), o tambien borramos imagen si consent=false.

## 4. Plan de fine-tuning futuro

Cuando lleguemos a **~10.000 imagenes con consent**, evaluar:

1. Fine-tunear un modelo open-source (DINOv2 large fine-tuneado, SigLIP2, o foundation model especifico de animales).
2. Pipeline en Hugging Face Inference API o Modal Labs (GPU on-demand barato).
3. Comparar accuracy contra Petify en un conjunto held-out.
4. Si accuracy >= 95%: switchear progresivamente nuevas mascotas a nuestro modelo, mantener Petify para legacy.

Costo estimado fine-tuning: ~$300-800 USD en GPU + 1 semana developer time.

## 5. Riesgos legales

- **Ley 19.628 + 21.719:** las imagenes son data sensible si identifican al individuo (mascota = data del dueno). Mitigacion: opt-in obligatorio, anonimizacion (sin nombre/telefono asociado), revocable.
- **Consent dinamico:** si el usuario revoca, debe ser real (borrar imagen en 30 dias maximo).
- **Subprocesadores:** anadir Supabase Storage como subprocesador en Privacy Policy si no esta.

## 6. Checklist de implementacion

- [ ] Crear bucket `paw-shield-archive` en Supabase Storage (privado).
- [ ] Crear tabla `paw_shield_archive` (migracion SQL).
- [ ] Agregar columnas consent a `pets`.
- [ ] Modificar `paw-shield-register/index.ts` para archivar.
- [ ] Modificar `paw-shield-identify/index.ts` para archivar (incluso si no hay pet_id local).
- [ ] Agregar checkbox consent en `PawShieldEnrollment.tsx`.
- [ ] Agregar toggle en `/profile` para revocar consent.
- [ ] Crear cron `paw-shield-archive-cleanup` que ejecute lifecycle.
- [ ] Actualizar Privacy Policy con subprocesador + uso para training.
- [ ] Documentar como exportar dataset filtrado para training.

## 7. Notas de seguridad

- **Nunca** subir a un bucket publico. RLS solo service_role.
- **Nunca** enviar imagenes archivadas a un servicio de terceros sin consentimiento explicito.
- **Logging:** cada acceso al bucket queda en `paw_shield_events` (tabla audit ya existente).

---

**Decision:** SI guardamos. Aprobado por Paw Founder 2026-04-29.

**Prioridad:** P1. Implementar antes del lanzamiento Junio 2026 (porque
una vez en produccion sin archivado, perdemos ese dato para siempre).
