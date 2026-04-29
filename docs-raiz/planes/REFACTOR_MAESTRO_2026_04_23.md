# Refactor Maestro Paw Friend — Plan 2026-04-23

> **Fuente de verdad** del pivote completo de producto, modelo de negocio y arquitectura.
> Elaborado tras conversación estratégica con Pedro (2026-04-23) post-insights de un mentor experimentado (2026-04-22).
> **Estado**: Plan aprobado conceptualmente, ejecución por horizontes. Nada aplicado aún.
> **Owner**: Paw Founder (Pedro)
> **IA de referencia**: Claude Opus 4.7 (1M)
> **Referencias vivas**: [docs-raiz/pitch/MODELO_V2_2026_04_22.md](../pitch/MODELO_V2_2026_04_22.md), [docs-specs/NOSE_PRINT_ID.md](../../docs-specs/NOSE_PRINT_ID.md), [CLAUDE.md](../../CLAUDE.md), [src/lib/featureFlags.ts](../../src/lib/featureFlags.ts)

---

## 0. TL;DR (si lees una sección, lee esta)

**Paw Friend deja de ser un "super app de mascotas" y se convierte en una sola cosa con foco quirúrgico: el corazón del producto es una trinidad**:

> **1. Pet ID Card — la cédula de identidad de la mascota (estilo cédula chilena, datos críticos).**
> **2. Huella Nasal — la biometría que la identifica sin chip.**
> **3. Ficha Médica Completa — su historia desde el primer día hasta el último.**

Los tres son el **corazón**. Cualquier otra feature — rutinas, recompensas, reservas con vets, partners, refugios, donaciones, memorial, notas de audio — es **pétalo que apunta al corazón**. No flores separadas que compiten por atención. Se conectan al eje o se esconden.

**Las 7 decisiones que ordenan el resto**:

1. **Un solo norte — la trinidad**: Pet ID Card + Huella Nasal + Ficha Médica Completa. Todo lo demás se evalúa por su contribución a ese corazón.
2. **Pet ID Card como artefacto visual y emocional**: cédula imitando el diseño de la cédula chilena pero para perros/gatos, con datos críticos (nombre, fecha nacimiento, raza, microchip, huella nasal, dueño, vet de cabecera, grupo sanguíneo, condiciones crónicas, contacto emergencia). Es el "dígito verificador" + el elemento que el dueño presume.
3. **Nose print como identidad primaria en la app**: en la app la mascota se reconoce por su cara/nariz. El chip queda como "dato legal" en la Pet ID Card. No reemplazamos el chip (ilegal), sino su rol cognitivo.
4. **Dual-role mantenido, vet NO es el centro**: el tutor es el centro. El vet contribuye a la ficha. Si el vet no tiene la mascota creada en su sistema, el **dueño puede registrar consultas via audio (transcripción automática) o texto manual**. Vets son un método más para alimentar la ficha, no el dueño de los datos.
5. **Gratis para siempre para dueños**: mantener el principio del modelo v2. Revenue viene de Pharma/Seguros/Retail (B2B invisible), nunca del dueño.
6. **Data moat construido en 24–36 meses**: insights agregados anónimos sobre razas, peso, alimentación, enfermedades, rutinas. Este es el activo real a largo plazo.
7. **Esconder, no eliminar**: todo lo que no sirve al corazón se oculta con feature flag. No se borra. Si en 6 meses no se reactiva, se revisa en lote y se decide.

**Timelines**:
- **0–30 días (Fase 0, "Unificar eje")**: colapsar frankenstein, BottomTab 4 ejes, Home = mascota en foco, ficha timeline, esconder redundantes.
- **30–90 días (Fase 1, "Moat emergente")**: nose print MVP, Paw Passport exportable, 1 partner piloto, SEO insights, memorial viral.
- **90–365 días (Fase 2, "Producto invisible")**: seguro embebido, insights B2B pagos, retail fulfillment hub, expansión LATAM vía refugios.

**Resultado esperado año 1**: 10–15k usuarios activos en Chile, 2–3 partners retail, 1 insurer piloto, MRR $8–15k USD.

---

## 1. Por qué este plan existe

### 1.1. Diagnóstico: el frankenstein real

Hoy Paw Friend tiene 6+ ejes compitiendo por el espacio del usuario:

- **Ficha clínica** (el eje correcto, hoy enterrado)
- Rutinas (buena feature, desconectada)
- Calendario unificado (sobrepuesto con rutinas + recordatorios + reservas)
- Gamificación: Paw Cards, Paw Points, Paw Game, Misiones (ruido para el eje médico)
- Social: Feed, Chat, Comunidad (escondido por flag pero el código pesa)
- Refugios + Adopción + Donantes de sangre (causas, correcto pero lateral)
- Vets directorio + Precios + Para veterinarios (canal, no eje)

La navegación lo muestra: 5 tabs inferiores + sidebar con 6 grupos + Home con dashboard de widgets. **Ningún usuario puede articular qué es Paw Friend en una frase**. Pedro lo dice en sus palabras: *"la app esta buena pero no siento que las funciones se conecten bien entre si, siento que es un frankenstein de cosas buenas pero aun no encuentro el flujo armonico correcto"*.

### 1.2. Por qué pasó esto (análisis honesto)

Paw Friend se construyó en 6 meses con tracción vertiginosa: cada feedback de beta testers (Sofia, Paloma) + cada idea estratégica (gamificación, social, refugios) se implementó. El resultado: **producto promiscuo con features buenas pero sin norte**. Es el patrón clásico de startup en fase pre-PMF.

El pivote de 2026-04-19 (B2C gratis + 6 motores) y el de Roberto (producto invisible, vets=canal) apuntaron en la dirección correcta pero no colapsaron la UI. Hoy el código, las rutas, el sidebar y el BottomTab siguen reflejando la "super app" inicial.

### 1.3. Lo que funciona y no se toca

Estos componentes son **exitosos y alineados con el eje**:

- Ficha médica completa (tab Vacunas + Antiparasitarios + Consultas + Timeline)
- Generación de PDF + ZIP exportable (joya de la corona, funciona)
- Creación de mascota y Paw Cards coleccionables (anclaje emocional al perfil)
- Booking V2 con vets (flujo clínico real)
- Compartir ficha con token 30 días (viralidad médica)
- Sistema de recordatorios (cronograma de vacunas automático post-fix 2026-04-23)
- Rol dual owner/provider (arquitectura correcta)
- Refugios con transferencia de ficha (feature ganadora, solo falta cerrar el loop)

### 1.4. Lo que NO vamos a eliminar hoy (lista "esconder + revisar después")

Regla de oro (ya documentada en [featureFlags.ts:4-7](../../src/lib/featureFlags.ts#L4-L7)): **esconder, no borrar**. Cada uno de estos se desactiva con feature flag; el código queda para auditoría en 6 meses:

| Feature | Flag propuesto | Estado actual | Razón de esconder |
|---|---|---|---|
| Feed social | `FEED` (ya existe, en false) | Confirmar hidden | No conecta con ficha |
| Chat | `CHAT` (ya existe, en false) | Confirmar hidden | Incompleto + distrae |
| PawGame en BottomTab / Home | `PAWGAME_SIDEBAR` (existe true) → bajar a `PAWGAME_PROMINENT` | Activo en sidebar | Mover a sección gamificación secundaria |
| Misiones (`/misiones`) | `PAWGAME_MISSIONS` nuevo | Activo | Reevaluar: ¿conectan con acciones de ficha? |
| Paw Game mini-juego | `PAWGAME_ARCADE` nuevo | Activo | Ocio puro, lateral al eje médico |
| Marketplace | `MARKETPLACE` (existe false) | Ya hidden | Mantener |
| Paseos compartidos | `SHARED_WALKS` (existe false) | Ya hidden | Mantener |
| Lugares pet-friendly | `MAP_PET_FRIENDLY` (existe false) | Ya hidden | Mantener |
| Lost Pets sección | `LOST_PETS_SECTION` (existe false) | Ya hidden | Integrar al mapa |
| Banco de sangre como destacado | `LABS_BLOOD_DONORS` (existe true) | Activo | Mover a "Causas" colapsado |
| Comunidad por raza | `LABS_COMMUNITY` (existe true) | Activo | Evaluar tracción, hoy sin data |
| Analytics Panel Pro B2C | `PRO_ANALYTICS` (existe true) | Activo | Mantener pero no destacar |
| AddReminder directo desde Home | — | Activo | Mover a ficha de la mascota |
| Precios Vets estimador | — | Activo | Mover a "Herramientas" colapsado |
| Onboarding gamificado | — | Activo | Simplificar onboarding a 3 pasos |

**Lista de revisión**: crear `_pending/HIDDEN_FEATURES_REVIEW_2026_11_23.md` con fecha +6 meses para decidir qué se elimina.

---

## 2. Tesis

### 2.1. Una frase

> **Paw Friend le da a tu mascota una cédula de identidad con su huella nasal, y una ficha que guarda su historia completa — desde el primer día hasta el último.**

### 2.2. Posicionamiento

| Dimensión | Antes (hoy) | Después (post-refactor) |
|---|---|---|
| Categoría | "App de mascotas" (vaga) | "Historia clínica digital de mascotas" |
| Core user action | Muchas (gamificar, feed, calendario, ficha…) | Una: **mantener la ficha viva** |
| Identidad de la mascota | Foto + nombre + Paw Card | **Huella nasal + foto + Paw Card** |
| Modelo | Gratis + donaciones + 6 motores confusos | Gratis B2C + data moat + B2B invisible |
| Promesa | "Cuida a tu mascota con Paw Friend" | "Tu mascota no se perderá — ni en la calle, ni en su historia" |
| Prueba | Muchas features | Un artefacto: **el Paw Passport exportable** |
| Diferenciador | Chilena, gratis, completa | **Biometría nasal primaria + historia completa + ética** |

### 2.3. Alineación con un mentor experimentado (modelo v2)

Roberto dijo "producto invisible, vets=canal, revenue real de Pharma+Seguros+Retail, clínica escondido". Este plan **no cambia esa tesis — la hace ejecutable**.

La ficha completa es el producto invisible. Los insights que genera son el activo vendible a Pharma/Seguros/Retail. El nose print es la llave que abre el canal físico (retail, vets, refugios). El dueño nunca ve el modelo de negocio. Ve a su mascota cuidada.

### 2.4. La Trinidad del Corazón (definición canónica)

Todo lo que Paw Friend hace converge en 3 piezas interconectadas que el usuario ve y siente. **Si una feature no alimenta al menos una de estas 3, no va en el producto principal — va oculta en flag**.

#### 2.4.1. Pet ID Card — la cédula de la mascota

Una tarjeta visual que imita el diseño de la cédula chilena (formato, proporciones, tipografía, elementos de seguridad) pero adaptada a mascotas. Funciona como:
- **Artefacto emocional**: el dueño la comparte en redes, la imprime, la lleva al vet
- **Identificación rápida**: en emergencia, el vet/rescatista ve todo lo crítico de un vistazo
- **Símbolo de pertenencia**: "mi perro tiene su cédula"

**Datos críticos en la Pet ID Card** (frente):
- Foto de la mascota (estilo foto cédula)
- Nombre
- Fecha de nacimiento + edad calculada
- Especie + raza
- Sexo + esterilizado
- Microchip (si tiene)
- **Nose Print ID** (hash corto visible, ej: `NP-A4F2-9X`)
- Fecha de emisión
- QR que lleva a ficha pública compartida

**Reverso**:
- Dueño + contacto
- Veterinario de cabecera
- Grupo sanguíneo
- Condiciones crónicas
- Alergias conocidas
- Contacto de emergencia
- Clínica preferida

**Enlace Pet ID Card ↔ Historia ↔ Chip ↔ Huella Nasal** (mecanismo de conexión):

La Pet ID Card funciona como **llave visible** al conjunto de identidades digitales de la mascota. Cualquier escaneo del QR en la card resuelve — según permisos del dueño — la vista correspondiente:

```
QR en Pet ID Card
        │
        ▼
  https://pawfriend.cl/id/PF-2026-A4F29X?t=<token>
        │
        ▼
  Router de visibilidad (según dueño + token)
        │
        ├─► Modo "Emergencia" (público, sin auth) → datos críticos: nombre, especie,
        │   dueño contacto, alergias, contacto emergencia vet. NUNCA historia completa.
        │
        ├─► Modo "Compartir con vet" (token temporal, 30 días) → ficha médica + timeline.
        │   Ya existe como MedicalShareView. Se reutiliza.
        │
        ├─► Modo "Público" (opt-in del dueño) → página de la mascota tipo perfil (foto,
        │   hitos, memorial si aplica). Consentimiento explícito requerido.
        │
        └─► Modo "Owner-auth" (dueño logueado) → ficha completa en modo edición.
```

**Campos de enlace en la ID Card** (todos son opcionales y respetan privacidad):

| Campo | Visible en card | Enlaza a |
|---|---|---|
| QR frontal | Sí | Modo según último setting del dueño (default: Emergencia) |
| Nose Print hash (ej `NP-A4F2-9X`) | Sí | Resuelve a pet_id internamente; permite scan en partner físico |
| Microchip ISO (si tiene, ej `956000012345678`) | Sí, en reverso | Referencia cruzada con Registro Nacional Mascotas (SAG). **No lo linkeamos automáticamente — es dato legal que el dueño ingresa** |
| Card Number (ej `PF-2026-A4F29X`) | Sí, grande | ID único de la cédula. Al regenerar (ej: cambio dueño), versiona |
| Nombre del dueño actual | Reverso | Referencia rápida en caso de pérdida |

**Trinidad de identificadores → 1 mascota**:

Una sola mascota puede identificarse por 3 caminos independientes, y los 3 resuelven al mismo `pet_id`:

1. **Nose Print** (biométrico, siempre presente post-captura) → tabla `nose_prints` → `pet_id`
2. **Microchip ISO 11784/11785** (legal, opcional según ley del país) → campo `pets.microchip_number` → `pet_id`
3. **Card Number** (administrativo, siempre presente) → tabla `pet_id_cards` → `pet_id`

Cualquiera de los 3 funciona como llave de entrada. La redundancia es **un feature**, no un bug:
- Si la mascota pierde el collar con la ID Card → nose print la identifica
- Si el chip migra/deja de leerse → nose print + card number funcionan
- Si la cámara para leer nose print no está disponible → chip (si tiene) o card number escrito funcionan

**Función RPC de resolución universal** (migración Fase 0):

```sql
CREATE OR REPLACE FUNCTION public.resolve_pet_identity(
  p_input TEXT,                                 -- Cualquiera de los 3 identifiers
  p_input_type TEXT DEFAULT NULL                -- 'nose_print' | 'microchip' | 'card_number' | NULL = auto-detect
)
RETURNS TABLE (pet_id UUID, match_type TEXT, confidence REAL)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Auto-detect si no se especifica tipo
  IF p_input_type IS NULL THEN
    IF p_input ~ '^PF-\d{4}-[A-Z0-9]+$' THEN
      p_input_type := 'card_number';
    ELSIF p_input ~ '^NP-[A-Z0-9]+-[A-Z0-9]+$' THEN
      p_input_type := 'nose_print';
    ELSIF p_input ~ '^\d{15}$' THEN
      p_input_type := 'microchip';
    ELSE
      RAISE EXCEPTION 'Formato no reconocido para: %', p_input;
    END IF;
  END IF;

  -- Resolver según tipo
  IF p_input_type = 'card_number' THEN
    RETURN QUERY
      SELECT pic.pet_id, 'card_number'::TEXT, 1.0::REAL
      FROM pet_id_cards pic WHERE pic.card_number = p_input LIMIT 1;
  ELSIF p_input_type = 'microchip' THEN
    RETURN QUERY
      SELECT p.id, 'microchip'::TEXT, 1.0::REAL
      FROM pets p WHERE p.microchip_number = p_input LIMIT 1;
  ELSIF p_input_type = 'nose_print' THEN
    -- Nose print hash corto resuelve a embedding completo en la tabla
    RETURN QUERY
      SELECT np.pet_id, 'nose_print'::TEXT, 1.0::REAL
      FROM nose_prints np WHERE np.short_hash = p_input LIMIT 1;
  END IF;
END;
$$;
```

**Generación**: edge function `generate-pet-id-card` que produce SVG + PNG + PDF imprimible tamaño cédula real (85.6 × 53.98 mm, CR-80). Opción de descargar como wallet pass (Apple/Google Wallet) en Fase 2.

**Regeneración**: la ID Card se regenera (version +1) cuando cambia un dato crítico (dueño, microchip, grupo sanguíneo, condiciones crónicas). La versión anterior queda como historial — importante para auditoría y para que tarjetas impresas sigan funcionando (el QR resuelve siempre a la mascota, aunque la card esté obsoleta).

#### 2.4.2. Huella Nasal — la biometría

Ver sección detallada en 6.2. Es la forma principal en que la app reconoce a la mascota. Aparece en la Pet ID Card como hash corto visible y en el backend como embedding para matching.

#### 2.4.3. Ficha Médica Completa + Timeline de Vida

La ficha es el **repositorio**. El **timeline es la visualización**. Cronológico, visual, con filtros por grupo. Cada evento de la vida de la mascota cae en una de 10 categorías canónicas:

| # | Categoría | Icono | Ejemplos de eventos |
|---|---|---|---|
| 1 | **Salud** | 🏥 | Vacunas, antiparasitarios, consultas, tratamientos, medicación, cirugías, exámenes, alergias, enfermedades crónicas, hospitalizaciones |
| 2 | **Peso y crecimiento** | ⚖️ | Registro peso, talla, cambio de etapa (cachorro→adulto→senior), curva de crecimiento |
| 3 | **Alimentación** | 🍗 | Cambios de dieta, marca, porción, intolerancias descubiertas, suplementos |
| 4 | **Higiene y cuidado** | 🛁 | Baños, corte de uñas, limpieza dental, limpieza de oídos, peluquería, estética |
| 5 | **Rutinas y actividad** | 🐾 | Paseos registrados, ejercicio, entrenamiento, juegos, socialización, deportes |
| 6 | **Vida social y fotos** | 📸 | Fotos subidas, cumpleaños, encuentros con otras mascotas, viajes, visitas a parques |
| 7 | **Compras y accesorios** | 🛒 | Collar, correa, cama, juguetes, cuchas, comederos, productos específicos |
| 8 | **Hogar y ambiente** | 🏠 | Mudanzas, llegada a nuevo hogar, nueva mascota en casa, cambios familiares, nuevo cuidador |
| 9 | **Momentos e hitos** | 💜 | Adopción, primer día en casa, primera vacuna, primera consulta, cirugía importante, recuperación, memorial |
| 10 | **Documentos y legal** | 📋 | Chip implantado, registro en Cholito, certificado sanitario, seguro contratado, pasaporte, licencias municipales |

**Visualización del timeline**:

- **Vista por defecto**: cronológica descendente (lo más reciente arriba), 1 evento por fila, con icono de categoría a la izquierda + color
- **Filtros**: chips arriba con las 10 categorías. Click → solo muestra esa categoría. Multi-select posible
- **Agrupación opcional**: toggle "Agrupar por mes / año" o "Agrupar por categoría"
- **Hitos destacados**: visual especial (cinta dorada) para eventos marcados como hito por el dueño o generados automáticos (ej: "Primer cumpleaños", "1.000 días con nosotros", "50 paseos registrados")
- **Mini-gráficas embebidas**: en la categoría Peso, mini chart del peso a lo largo del tiempo. En Salud, calendario de vacunas próximas.
- **Compartible**: cada evento individualmente compartible (imagen exportable). El timeline completo → Paw Passport PDF (ver 6.3).

**Entrada de eventos** (de dónde viene la data):

| Fuente | Categorías típicas |
|---|---|
| Dueño manual | Todas |
| Dueño via audio (transcripción) | Salud, Higiene, Rutinas, Momentos |
| Vet durante consulta | Salud, Peso |
| Vet post-consulta audio | Salud |
| Triggers automáticos app | Momentos (hitos), Rutinas (completadas), Salud (recordatorios completados) |
| OCR de carnet vacunas | Salud |
| Integración partner retail | Compras, Alimentación |
| Refugio al transferir | Salud, Momentos, Hogar |

**Base técnica**: tabla unificada `pet_timeline_events` con `category` enum de 10 valores + JSON `data` con schema por categoría. Se alimenta de triggers que leen de tablas existentes (`pet_reminders`, `medical_records`, `vet_bookings`, `pet_routines`, etc.) para no duplicar, + inserts directos para eventos manuales y de audio.

### 2.5. La postura ética (explícita)

Pedro provocó: *"a mí no me gustaría un chip en mi cuerpo, ¿por qué a ellos sí?"*. Respuesta del plan:

> **Paw Friend reconoce a tu mascota por su huella nasal — como los humanos nos identificamos por nuestra huella digital. El chip es el trámite legal que requiere la Ley 21.020. Lo registramos en tu ficha. Pero creemos que la biometría no invasiva es la forma correcta de identificar a un ser vivo, y trabajamos para que sea reconocida por SAG y los municipios.**

Esto es **marca**, no feature. Se comunica en onboarding, landing, sección "Por qué la huella nasal" y posts públicos. Diferencia a Paw Friend de cualquier competidor que trate el chip como neutral (Chewy, Mars, Purina no pueden tomar esta postura sin conflicto — venden productos relacionados al status quo).

### 2.6. Rol del vet en el nuevo modelo (explícito)

**El tutor es el centro. El vet contribuye, no es dueño del dato.**

Hoy la arquitectura dual-role owner/provider es correcta, pero hay un desbalance implícito: en muchos flujos el vet parece ser el primary user (provider dashboard, clinical notes, booking). Post-refactor, el vet es **uno de varios canales que alimentan la ficha del tutor**.

#### 2.6.1. Qué cambia para el vet

- Sigue teniendo `/provider/dashboard`, `/provider/pacientes`, ficha clínica en modo vet
- Sigue pudiendo crear pacientes (pending_owner hasta que el dueño reclame)
- Sigue generando notas clínicas estructuradas post-consulta (incluyendo transcripción audio)
- Sigue recibiendo reservas y gestionando agenda

#### 2.6.2. Qué se AGREGA para el tutor

Hasta hoy, si el vet no está en Paw Friend, el tutor no tiene cómo registrar la consulta digitalmente. **Cambio**: el tutor puede alimentar la ficha aunque el vet no use la app:

- **Audio en vivo durante la consulta**: botón "Grabar consulta" en ficha → audio subido → edge function [process-consultation-transcript](../../supabase/functions/process-consultation-transcript/) (ya existe para vets) extendida para aceptar caller owner → transcripción + resumen estructurado → evento en timeline categoría Salud
- **Nota manual post-consulta**: formulario rápido "Registrar consulta" con campos: fecha, veterinario (texto libre), motivo, diagnóstico, tratamiento, adjuntos → evento en timeline
- **Foto del recetario/carnet**: OCR existente ([ocr-vaccination-card](../../supabase/functions/ocr-vaccination-card/)) + foto genérica de documentos con extracción de datos
- **Voz directa del tutor**: "Hoy Kai tuvo una crisis alérgica, le pusieron corticoides, mejoró en 2 horas" → transcripción → evento en timeline categoría Salud con flag `user_reported`

#### 2.6.3. Reconciliación cuando el vet SÍ usa Paw Friend

Si el tutor registró la consulta manualmente + después el vet (usando Paw Friend) crea una nota clínica oficial de la misma consulta, el timeline marca ambas y las linkea como "mismo evento, 2 fuentes". El tutor puede ocultar su versión manual si la del vet es más completa, o mantenerlas ambas como respaldo.

#### 2.6.4. Implicancia de negocio

- Vets dejan de ser **bottleneck** para la ficha completa
- App usable desde el día 1 aunque el vet de cabecera no la use
- Aumenta **tasa de registro de eventos médicos** → data moat crece aunque adopción vet sea lenta
- Vets se integran porque ven que sus pacientes **ya tienen ficha** — les facilita trabajo (less typing, lectura rápida de historial) en vez de forzarlos a digitalizar desde cero

### 2.7. Accionabilidad One-Tap (principio de diseño del producto)

> **Regla de oro**: cada acción de cuidado se captura con **un solo tap** o al menos **menos de 10 segundos**. La app calcula, mide, ubica y guarda los metadatos automáticamente. El usuario confirma; no ingresa.

El mayor enemigo de la ficha completa no es la motivación del dueño — **es la fricción de ingresar datos**. Si registrar un paseo toma 2 minutos, nadie lo hace. Si toma 3 segundos (tap play → tap stop), todos lo hacen.

#### 2.7.1. Patrón universal

| Paso | Quién | Tiempo |
|---|---|---|
| 1. User abre Home, ve botón "Rutinas rápidas" o "Registro" | User | 1s |
| 2. Tap sobre la acción (paseo, medicación, baño, etc.) | User | 1s |
| 3. App captura automáticamente: hora, ubicación GPS, duración (si aplica), clima (opcional) | App | 0s |
| 4. User confirma o agrega foto/nota opcional | User | 0–10s |
| 5. Evento guardado en timeline con categoría correcta | App | 0s |

**Total: 2–12 segundos** vs formularios tradicionales (1–3 minutos).

#### 2.7.2. Modos de captura por categoría

| Categoría | Modo one-tap | Qué captura la app automáticamente |
|---|---|---|
| 🐾 Paseo | Tap play → cronómetro → tap stop | Duración, GPS track, distancia, ruta, hora, clima |
| 🏥 Medicación | Tap sobre dosis programada | Hora exacta, recordatorio marcado como completado |
| 🏥 Vacuna administrada | Tap "Aplicada" sobre reminder | Hora, tipo vacuna desde protocolo, próxima fecha auto |
| ⚖️ Peso | Tap "Registrar peso" → 1 número + enter | Fecha, comparación con último registro, curva |
| 🛁 Baño | Tap "Baño" → tap stop | Hora, duración, opcional foto before/after |
| 🍗 Comida | Tap sobre preset (marca + porción guardada) | Hora, recurrencia detectada automáticamente |
| 📸 Foto del día | Tap cámara → foto → auto-categoriza con AI | Hora, ubicación, detección facial (es la mascota correcta) |
| 🏥 Consulta vet | Tap "Grabar consulta" → audio → tap stop | Duración, transcripción, estructuración (motivo/dx/tx), sugerencia de follow-up |
| 🐾 Juego/entrenamiento | Tap sobre tipo preset | Hora, duración si usa timer |
| 🛒 Compra | Scan QR del producto (partner) O foto del recibo con OCR | Producto, monto, categoría, fecha |
| 💜 Hito | Tap "Marcar como hito" sobre evento | Destaque visual en timeline |

#### 2.7.3. Detección inteligente de patrones

Post-Fase 1, la app aprende del comportamiento del dueño y sugiere:
- "Registraste paseos los últimos 5 días a las 8am. ¿Automatizo?" → rutina creada en 1 tap
- "Kai pesa 12 kg hoy, era 15 kg hace 3 meses. ¿Alertamos a tu vet?" → sugiere consulta
- "Notamos que no registras baños. ¿Te ayudamos a recordar cada 3 semanas?" → recordatorio propuesto
- "Tu mascota es Golden Retriever 6 años. Otras Golden de tu edad en Paw Friend han registrado X. ¿Lo agregamos?" → onboarding de datos via comparación social

#### 2.7.4. Consecuencias arquitectónicas

Para que esto funcione:

- **GPS permission** solicitada en onboarding (con justificación clara: "Registramos paseos y ubicación de emergencia")
- **Background location** con consent y toggle en configuración
- **Service Worker** para tracking incluso con app en background
- **Foreground Service** en Android / Background Modes en iOS (Capacitor plugins: `@capacitor/geolocation`, `@capacitor-community/background-mode`)
- **Edge function de inferencia**: `detect-activity-patterns` que analiza últimos 30 días y sugiere rutinas
- **AI sugerencia contextual**: al abrir Home, la app propone acciones basadas en día/hora/patrones

#### 2.7.5. Componentes frontend nuevos

- `src/components/quickactions/QuickActionHub.tsx` — widget centralizado en Home con los 6 botones más usados
- `src/components/quickactions/WalkTracker.tsx` — cronómetro + GPS para paseo
- `src/components/quickactions/MedicationTap.tsx` — tap sobre dosis programadas
- `src/components/quickactions/WeightQuickInput.tsx` — input numérico optimizado
- `src/components/quickactions/PhotoDay.tsx` — cámara directa + auto-categorización
- `src/components/quickactions/ConsultationRecorder.tsx` — audio grabación con visualización de waveform

#### 2.7.6. Feature flag

```ts
QUICK_ACTIONS_HUB: true,     // Widget en Home con one-tap capture
WALK_GPS_TRACKING: false,    // Activar cuando permisos background resueltos
AI_PATTERN_DETECTION: false, // Activar cuando tengamos 1k+ users con 30+ días data
```

### 2.8. Ambient Computing — la app que trabaja sola (principio maestro de UX)

> **Regla absoluta**: Paw Friend **NUNCA** debe sentirse como una app de formularios. La vida de la mascota se registra **por eventos del mundo real que la app detecta o sugiere**, no por el dueño llenando campos.

Este es el principio que une todo lo anterior (trinidad, one-tap, timeline filtrable). Los 3 pilares de Ambient Computing en Paw Friend:

#### 2.8.1. Detección pasiva (la app percibe sin preguntar)

Señales del mundo real que la app captura automáticamente, sin que el user haga nada:

| Señal | Cómo la app la captura | Qué dispara |
|---|---|---|
| Celular cerca de clínica veterinaria conocida | Geofencing / BLE beacon opcional | Push suave: "¿Consulta en Vetplus hoy? Te preparo el audio" |
| Evento en Google Calendar con palabra "vet", "vacuna", "peluquero" | Integración calendar (ya existe `google-calendar-sync`) | Crea evento pending en timeline, pide confirmación post-evento |
| Paseo detectado por movimiento GPS >500m con velocidad caminata durante >10min | Movement API + background geolocation | Sugiere: "¿Fue paseo con Kai? Registrar" → 1 tap confirma |
| Foto nueva de la mascota en galería (con consent de photo library) | Photos Access + auto-detección facial con embedding de la mascota | Sugiere: "Agregar a Historia → Categoría Social" |
| Compra en partner retail con pago tokenizado | API del partner (Fase 2) | Auto-registra compra en timeline categoría Compras |
| QR escaneado de producto (comida, medicamento) | App scanner o compartido desde retailer | Pre-llena evento con marca/producto |
| Scan de nose print en tienda/clínica partner | Hardware físico (ver 2.8.2) | Identifica la mascota + abre ficha relevante |
| Fecha de cumpleaños | Desde birth_date de la ficha | Push con share card generada + sugerencia de celebración |
| Hora del día + patrón histórico | ML sobre 30d de data | "Suele pasear a esta hora. ¿Activo el tracker?" |

#### 2.8.2. Scanner físico distribuido (puntos de interés)

La idea de Pedro: scanners de nose print ubicados en **puntos estratégicos físicos** para registrar automáticamente la presencia de la mascota.

**Casos de uso**:

| Punto | Quién opera | Qué registra automáticamente |
|---|---|---|
| **Clínica veterinaria** | Recepcionista escanea al ingresar | Evento categoría Salud: "Llegó a [Clínica X] a las 10:30". Ficha se abre auto para el vet. Fin consulta: genera evento "Consultado por Dr. X el HH:MM" + audio transcript si grabaron. |
| **Tienda retail partner** | Tablet en mesón / escaneo voluntario del dueño | Descuento aplicado + evento "Visitó [Tienda] a las HH:MM" categoría Compras. Tracking anónimo de preferencias. |
| **Peluquería canina** | Escaneo pre/post servicio | Evento categoría Higiene: "Baño + corte el DD/MM por [Peluquero]". Foto opcional. |
| **Refugio / adopción** | Al ingreso y salida | Evento categoría Momentos: "Llegó al refugio", "Entregado en adopción". |
| **Parque canino / guardería** | Scanner voluntario en entrada | Evento Social: "Visitó Parque X durante 45 min". |
| **Pet-friendly hotel** | Check-in | Evento Social: "Viajó a [Hotel]". |

**Arquitectura técnica**:

- **Scanner**: tablet Android/iPad barata con app "Paw Scanner" (nueva, separada del main app), camera integrada, nose-print-match edge fn con auth
- **Auth**: el partner tiene API key. El scanner se identifica como ese partner.
- **Evento**: el scanner hace match → si >95% confidence → envía evento al backend → backend crea entrada en timeline de la mascota (categoría predefinida por tipo de partner)
- **Consent**: el dueño activa en onboarding "Permitir registro automático en partners". Puede revocar en cualquier momento.
- **Sin consent**: el scanner igual identifica (para flujos legítimos como vet consult), pero no registra evento automático. Solo el partner ve "es esta mascota" — el dato queda en el partner, no en el timeline público.

**Migración SQL adicional** (Fase 2):

```sql
CREATE TABLE public.partner_scanner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.paw_companys(id),
  partner_location TEXT,                    -- Ej: "Vetplus Providencia - Los Leones"
  scan_type TEXT NOT NULL CHECK (scan_type IN (
    'vet_arrival', 'vet_departure', 'retail_visit',
    'grooming_start', 'grooming_end', 'shelter_in',
    'shelter_out', 'park_visit', 'hotel_checkin', 'hotel_checkout'
  )),
  confidence REAL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auto_created_event_id UUID REFERENCES pet_timeline_events(id),
  metadata JSONB
);
```

**Feature flags**:

```ts
PARTNER_SCANNER_API: false,       // Edge fn para partners con API key
PARTNER_AUTO_TIMELINE: false,     // Auto-crear eventos desde scanner
PASSIVE_DETECTION_GPS: false,     // Detectar visitas a clínicas por geofence
```

#### 2.8.2.bis Integración semi-automática con partners (2 niveles)

Los partners (vets, peluquerías, tiendas, guarderías, refugios) se integran en **2 niveles de fricción**, según su nivel de adopción técnica:

**Nivel 1 — Scanner físico** (fácil, sin integración IT):

- Tablet / celular con app "Paw Scanner" provista por Paw Friend
- Usa nose print match para identificar la mascota
- Genera evento automático en timeline categoría correspondiente
- Ideal para: tiendas pequeñas, peluquerías independientes, refugios chicos, parques
- Costo para el partner: ~$0 (solo instalar app en tablet propio). Costo para Paw Friend: incluido en el plan.

**Nivel 2 — API del partner** (avanzado, con sistema propio):

- Partners con sistema de gestión (ej: clínica vet con software PIMS tipo VetOne, Vetware) envían eventos directamente vía API
- Endpoint: `POST /api/v1/partner/events` con auth key
- Payload estructurado: `{ pet_id, partner_id, event_type, data, occurred_at }`
- Partner recibe webhook cuando la mascota se marca como memorial (para cerrar su historial), cuando cambia de dueño, etc.
- Ideal para: clínicas grandes, cadenas retail, aseguradoras
- Beneficio para el partner: tiene **ficha completa del paciente** del historial de vida, no solo las visitas que hizo con ellos

**Cómo se conecta el paciente al partner** (3 modos):

| Modo | Cómo | Cuándo usar |
|---|---|---|
| Nose print scan | Scanner en recepción del partner | Primera visita, sin dato previo |
| Microchip scan | Lector de chip tradicional (el partner ya lo tiene) | Vets con lector, backup legal |
| QR + ID Card | Dueño muestra ID Card de Paw Friend con QR | Boutique/retail, visitas rápidas |

**Migración SQL adicional** (Fase 2):

```sql
CREATE TABLE public.partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.paw_companys(id),
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['events:create', 'pet:read_minimal'],
  rate_limit_per_hour INT NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.partner_api_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.paw_companys(id),
  endpoint TEXT NOT NULL,
  pet_id UUID,
  request_at TIMESTAMPTZ DEFAULT NOW(),
  status INT,
  duration_ms INT
);
```

#### 2.8.3. Triggers en cascada (acciones que disparan acciones)

**Principio**: cuando el usuario (o la app) registra un evento, la app **calcula la próxima acción probable** y la agenda/sugiere sin pedir permiso explícito (excepto para cosas críticas o con consentimiento previo).

**Ejemplos de cascadas**:

| Evento inicial | Cascada automática |
|---|---|
| Vacuna antirrábica aplicada | → Recordatorio próximo refuerzo en 12 meses + evento timeline Salud + update estado "al día con vacunas" en ficha |
| Peso registrado: baja 10% en 30 días | → Sugerencia "¿Consulta con vet?" con 1-tap → Si confirma, abre booking flow |
| Consulta registrada por audio → IA detecta "tratamiento con antibiótico 7 días" | → Crea 7 recordatorios diarios + sugerencia alarma cada 12h durante 7 días |
| Cambio de alimento registrado | → Recordatorio en 14 días: "¿Cómo le fue con [Marca]? ¿Hubo intolerancias?" |
| Paseo GPS registrado | → Actualiza gráfica semanal actividad + si rutina coincide con patrón, sugiere crear rutina permanente |
| Cumpleaños detectado por birth_date | → Genera share card hermosa + crea evento Milestone + sugiere foto + actualiza edad en toda la app |
| Nose print capturado por primera vez | → Genera Pet ID Card v1 + guarda en storage + push "Tu cédula está lista" |
| Mascota marcada como memorial | → Genera memorial compartible + envía email empático + esconde recordatorios médicos + mantiene historia accesible |
| Partner scanner: llegada a clínica | → Crea evento tentativo "Consulta en curso en X" + si dueño también está logueado en app, ofrece "grabar audio" preemptivo |
| 5 paseos registrados en misma semana | → Unlock achievement "Deportista" + +50 pts + sugerencia "¿Quieres que te recuerde pasear todos los días?" |
| Mascota no registra actividad en 7 días | → Push suave "¿Todo bien con [nombre]?" — detección de abandono de app o problema de salud |

**Implementación técnica**:

- **Postgres triggers + edge functions**: cada INSERT en `pet_timeline_events` dispara función que evalúa reglas de cascada (blindada con EXCEPTION WHEN OTHERS, regla 9.2.1)
- **Reglas declarativas** en tabla `timeline_cascade_rules` (type de evento → acción a tomar). Editable sin deploy.
- **AI layer**: edge function `suggest-next-action` que toma últimos eventos de la mascota + perfil y sugiere 1–3 acciones contextuales. Usa Claude Haiku (barato, rápido) con prompt cache.
- **Modo conservador por default**: la app SUGIERE, no ejecuta. Excepción: crear recordatorio recurrente post-vacuna (acción obvia, low risk).
- **Modo automático post-consent**: usuario opt-in por cascada. "Quiero que crees recordatorios automáticos después de cada vacuna" → sí / no por tipo.

**Feature flags**:

```ts
CASCADE_AUTO_REMINDERS: true,      // Post-vacuna crea recordatorio próxima (ya existe parcial)
CASCADE_WEIGHT_ALERTS: false,      // Alerta cuando peso baja 10%+
CASCADE_AI_SUGGESTIONS: false,     // AI layer que sugiere next action
CASCADE_BIRTHDAY_AUTO: true,       // Share card automática cumpleaños
CASCADE_INACTIVITY_CHECK: false,   // Push si no hay actividad 7d
```

#### 2.8.4. Consecuencia en el diseño del producto

Todo formulario largo existente queda en el blanco. **Reemplazar formularios por**:

1. **Audio**: user habla, IA estructura
2. **Foto + OCR**: user fotografía receta/carnet, IA extrae
3. **Import desde otro origen**: calendar, contactos, fotos, partner scanner
4. **1 tap sobre preset**: lo más usado se guarda como preset personal
5. **Sugerencia contextual**: la app propone, user confirma
6. **Cascada**: al completar A, la app crea B, C, D sin pedir nada

**Decisión de producto**: antes de cualquier feature nueva, preguntar "¿cómo se siente este flujo si el user NO llena ningún campo?". Si la respuesta es "no se puede", rediseñar.

### 2.9. Insights correlacionales — el verdadero moat de data

El activo que ningún competidor chileno/LATAM tendrá es una base de **datos longitudinales correlacionados** sobre mascotas reales. Cada ficha completa en Paw Friend suma una unidad a un dataset que vale más que la suma de sus partes.

#### 2.9.1. Ejemplos de correlaciones únicas (lo que podemos descubrir)

Son preguntas que **NINGÚN estudio hoy responde** porque requieren data longitudinal granular de miles de mascotas. Con Paw Friend, en 24–36 meses tenemos:

| Pregunta | Datos requeridos | Valor del insight | Quién paga |
|---|---|---|---|
| ¿Cuántas horas de paseo semanal correlacionan con mayor esperanza de vida en Golden Retriever? | Timeline actividad + memorial | Pharma (OTC suplementos articular), Petfood (dieta senior) | $15–40k / estudio |
| ¿El tipo de alimento seco vs húmedo correlaciona con incidencia de cristaluria en gatos? | Nutrition + Health | Veterinarias prescripción, Pharma, Marcas alimento | $20–50k |
| ¿A qué edad promedio se esteriliza en cada comuna chilena? | Pet data + health | Municipios, ONGs, gobierno (ley Cholito) | Grants públicos |
| ¿Cuáles razas viven más tiempo en Chile que el promedio mundial? (clima, latitud, aire) | Memorial + breed + location | Investigación académica, Pharma | Universidades + Pharma |
| ¿Qué patrones de cuidado correlacionan con menor incidencia de obesidad canina? | Peso + actividad + alimentación | Pet insurance, Pharma metabolismo | $30–80k |
| ¿Cuál es el gasto promedio mensual en cuidado pet por segmento socioeconómico en Chile? | Purchases + location | Retail (precio optimization), aseguradoras | $25–60k |
| ¿Qué frecuencia de baño correlaciona con menos dermatitis? | Hygiene + health | Groomers, marcas shampoo, Pharma dermatología | $15–30k |
| ¿Cómo cambia la actividad física de un perro tras la llegada de otro animal al hogar? | Activity + home | Estudios académicos, behaviorismo | Universidades |
| ¿Bulldog Francés chileno tiene mayor incidencia de problemas respiratorios que el francés? | Health + breed + location | Pharma respiratoria, criadores | $40k+ |
| ¿Qué vets tienen mejores outcomes en cirugías específicas? | Health + vet + followup | Aseguradoras (pricing), dueños (ranking honest) | SaaS B2B vets |

#### 2.9.2. Quién paga por estos insights

**3 canales de monetización del moat**:

1. **Research suscripción** para Pharma/Petfood/Insurers: acceso a dashboard con filtros + exports. $10–30k USD/año por empresa.
2. **Estudios custom**: "Necesitamos un paper sobre X, pagamos $50k USD por el estudio con tu data". Paw Friend ejecuta o facilita.
3. **Insights públicos SEO**: lo más básico (peso promedio por raza, vacunas recomendadas) se publica gratis en `/insights/` para traction orgánica. Lo valioso (correlaciones causales con consent opt-in) se monetiza.

#### 2.9.3. Requisitos técnicos para que el moat funcione

- **Consent granular por tipo de uso**: "Autorizo uso en insights agregados anónimos" (default ON), "Autorizo uso en estudios pharma" (opt-in), "Autorizo venta de ranking de mi vet" (opt-in)
- **Anonimización rigurosa**: nada sale de Paw Friend sin pasar por capa de k-anonymity (k≥50 mínimo)
- **Data pipeline**: vistas materializadas + refresh nightly, dbt para transformaciones
- **Dashboard B2B**: plataforma separada `insights.pawfriend.cl` con auth key + filtros + exports

#### 2.9.4. Por qué este moat es inclonable en 12–24 meses

- Un competidor nuevo necesita **2+ años** de data longitudinal antes de poder responder preguntas de ciclo de vida
- Las preguntas interesantes requieren **memorial events** — data que solo se acumula con el tiempo
- **Consent retroactivo es imposible**: si un competidor arranca en 2028, no puede obtener data de 2026–2028 de dueños que ya se fueron
- **Red de refugios + vets integrados** multiplica la velocidad de captura (LATAM expansion amplifica)

### 2.10. Principio operacional — los ejemplos son ilustrativos, el método se aplica a TODO

> **Directiva**: cada ejemplo concreto en este plan (paseo con cronómetro + GPS, vacuna con cascada de recordatorios, correlación Golden Retriever/esperanza de vida, scanner físico en clínica, etc.) **NO es una feature puntual a implementar aislada**. Es un caso ilustrativo del **método**. El método se aplica sistemáticamente a TODO lo que la app hace.

#### 2.10.1. Los 4 tests que toda feature pasa (nueva o existente)

Antes de implementar feature nueva, antes de mantener feature existente, se hacen estas 4 preguntas. Si la feature falla 2 o más, se **esconde detrás de feature flag** y se marca para revisión.

| # | Test | Pregunta |
|---|---|---|
| 1 | **Trinidad** | ¿Alimenta o visualiza Pet ID Card / Nose Print / Ficha Médica? |
| 2 | **One-Tap** | ¿Se captura en <10 segundos sin llenar formulario? |
| 3 | **Ambient** | ¿La app detecta/sugiere/encadena sin pedir permiso cada vez? |
| 4 | **Insights** | ¿La data generada suma a correlaciones útiles (incluso agregadas)? |

#### 2.10.2. Matriz de evaluación de features existentes

Cada feature de Paw Friend hoy se pasa por los 4 tests. Output: mantener / refactorizar / esconder.

| Feature existente | T1 Trinidad | T2 One-Tap | T3 Ambient | T4 Insights | Veredicto |
|---|---|---|---|---|---|
| Ficha clínica completa | ✅ | ⚠️ formulario | ⚠️ | ✅ | **Refactorizar** (reducir forms) |
| PDF/ZIP export ficha | ✅ | ✅ | ✅ | ✅ | **Mantener** |
| Booking V2 con vets | ✅ alimenta timeline | ⚠️ 3 pasos | ⚠️ | ✅ | **Refactorizar** (cascada post-booking) |
| Recordatorios manuales | ✅ | ⚠️ formulario | ⚠️ | ✅ | **Refactorizar** (presets + one-tap) |
| Rutinas (paseos manuales) | ✅ | ❌ | ❌ | ✅ | **Refactorizar** (GPS + cronómetro) |
| Compartir ficha (token 30d) | ✅ | ✅ | ✅ | ✅ | **Mantener** |
| Paw Cards coleccionables | ⚠️ decorativo | ✅ | ✅ | ❌ | **Esconder en sección secundaria** |
| Paw Game mini-juego | ❌ | ✅ | ❌ | ❌ | **Esconder detrás flag** |
| Misiones gamificación | ❌ | ⚠️ | ❌ | ❌ | **Esconder detrás flag** |
| Feed social | ❌ | ❌ | ❌ | ❌ | **Mantener escondido** |
| Chat | ❌ | ❌ | ❌ | ❌ | **Mantener escondido** |
| Panel Pro Analytics B2C | ⚠️ | ✅ | ❌ | ⚠️ | **Esconder (Pedro-only)** |
| Comunidad por raza | ⚠️ | ⚠️ | ❌ | ⚠️ | **Esconder detrás flag** |
| Banco de sangre | ⚠️ | ⚠️ | ❌ | ⚠️ | **Mantener en Causas secundarias** |
| Adopción / Refugios | ✅ transfer ficha | ⚠️ | ⚠️ | ✅ | **Refactorizar** (follow-up auto + insights) |
| Donaciones | ❌ lateral | ✅ | ✅ | ⚠️ | **Mantener como CTA secundario** |
| Memorial | ✅ cierra historia | ⚠️ | ⚠️ | ✅ | **Refactorizar** (auto-generate share + memorial day push) |
| Nose Print (nueva Fase 1) | ✅✅ identidad | ✅ | ✅ | ✅ | **Pilar** |
| Pet ID Card (nueva Fase 0) | ✅✅ | ✅ auto | ✅ auto | ✅ | **Pilar** |
| Timeline categorías (nueva Fase 0) | ✅✅ | ✅ | ✅ | ✅ | **Pilar** |
| Audio notes owner (nueva Fase 0) | ✅ | ✅ | ✅ | ✅ | **Pilar** |
| Quick Actions Hub (nueva Fase 0) | ✅ | ✅✅ | ✅ | ✅ | **Pilar** |
| Scanner partner físico (nueva Fase 2) | ✅ | ✅✅ automático | ✅✅ | ✅ | **Pilar** |

**Output consolidado**:
- **5 pilares nuevos** a construir (Trinidad + Audio + Quick Actions + Scanner)
- **6 features a refactorizar** bajo los 4 principios
- **8 features a esconder** detrás de flags con lista de revisión en 6 meses
- **3 features a mantener tal como están** (PDF export, compartir ficha, Banco de sangre)

#### 2.10.3. Ritual mensual de limpieza

Cada primer lunes del mes, revisar:

1. Features con flag `false` por >6 meses → **decidir: eliminar o reactivar**
2. Features con tracción <5% de usuarios activos → **evaluar en matriz 2.10.2**
3. Nuevas features propuestas → **deben pasar los 4 tests antes de spec**
4. Actualizar [`_pending/HIDDEN_FEATURES_REVIEW_*.md`](../../_pending/) con estado

Este ritual **no es opcional** para mantener foco. El enemigo no es "features malas" — es la acumulación silenciosa de features aceptables que diluyen el eje.

---

## 3. Data dura del mercado

### 3.1. Chile

| Métrica | Valor | Fuente / estimación |
|---|---|---|
| Población | 19.8M | INE 2024 |
| Hogares | 6.1M | INE 2024 |
| Hogares con mascota | 75% (~4.6M) | Cadem 2023 estudio mascotas |
| Perros estimados | 3.8M | IPSOS Pet Track 2022 + INE |
| Gatos estimados | 2.5M | IPSOS Pet Track 2022 + INE |
| **Mascotas totales** | **~6.3M** | Consolidado |
| Mascotas registradas con chip (SAG) | ~1.8M (cifra al 2024) | Registro Nacional Mascotas, Subdere |
| **Adopción de chip** | **~28–30% del parque estimado** | Cálculo: 1.8M / 6.3M |
| Mascotas sin chip | 4.5M | 70% de brecha — **oportunidad para nose print** |
| Mercado pet care Chile | $800M–1B USD/año | Nielsen Chile, Euromonitor 2023 |
| Growth CAGR | 8–10% post-COVID | Euromonitor |
| Gasto promedio/mascota/año | $150–250 USD | Nielsen |
| Cobertura seguros mascotas | <5% | iki / Mapfre estimates públicos |
| Retailers pet grandes | Mathiesen, Kiwoko, Clan Pet, Pet Zone, Casa Pet | Fuentes varias |
| Clínicas veterinarias registradas | ~2.500 | Colmevet 2024 |

**Conclusión Chile**: mercado mediano pero profundo, con 70% de mascotas sin identificación digital. Ventana para un player que resuelva identidad + historia.

### 3.2. LATAM

| País | Mascotas estimadas | Adopción chip | Pet care $ USD |
|---|---|---|---|
| Brasil | ~140M | <15% | $6.8B |
| México | ~85M | <10% | $2.9B |
| Argentina | ~25M | ~20% | $1.1B |
| Colombia | ~10M | <10% | $0.7B |
| Chile | ~6.3M | ~28% | $0.9B |
| Perú | ~9M | <8% | $0.4B |
| **LATAM total** | **~200M** | **promedio ~12%** | **~$13B** |

Fuente: FEDIAF LATAM 2023, Euromonitor, asociaciones nacionales.

**Conclusión LATAM**: la brecha es aún mayor que en Chile (88% sin chip). El nose print es **leapfrog tecnológico ideal** porque no hay infraestructura de chip que desplazar.

### 3.3. Pet tech global

| Métrica | Valor |
|---|---|
| Mercado pet tech 2024 | $8B USD |
| Proyección 2030 | $20B USD |
| CAGR | ~15% |
| Segmento pet identification | $1.2B (2024), $3B (2030) |
| Segmento pet insurance | $10B global, CAGR 13% |

Fuente: Grand View Research, Fortune Business Insights, MarketsandMarkets.

### 3.4. Competencia directa y adyacente

| Empresa | País | Core | Valuation / estado | Amenaza |
|---|---|---|---|---|
| Petnow | Corea | Nose print ID + lost pet | Series A $12M, 500k users, partner Samsung | Alta técnica, baja geo (no LATAM) |
| Petco LoveLost | USA | Face recognition lost pet | Propiedad de Petco ($4B) | Alta si entra LATAM |
| Chewy | USA | E-commerce + telehealth | $11B revenue, $7B market cap | Muy alta si entra al mercado |
| Rover | USA | Sitter/walker marketplace | $600M rev, IPO | Mediana, distinto foco |
| Mars Petcare / Purina | Global | Alimento + data (Kinship, Whistle) | Miles de millones | Alta si compran o replican |
| **Chile / LATAM** | — | — | **Sin player dominante** | Ventana abierta |
| PetChile, Petlover, MundoMascota | Chile | E-commerce local | Pequeños | Baja |

**Conclusión**: ventana de 18–24 meses antes de que un jugador global entre a Chile. Petnow ya probó que la tecnología funciona y levanta capital. Copiarla es factible y ya hay spec propia ([NOSE_PRINT_ID.md](../../docs-specs/NOSE_PRINT_ID.md)).

### 3.5. Nose print — viabilidad técnica

| Métrica | Valor |
|---|---|
| Accuracy top papers (CVPR Pet Biometric Challenge 2022) | 97–99% rank-1 |
| Accuracy Petnow reportada | 98.8% peer-reviewed |
| Edad mínima mascota para print estable | 6 meses |
| Modelos open source disponibles | MobileNetV3 + triplet loss; PetNet-Lite |
| Hardware requerido | Cámara celular promedio (iPhone 8+, Android medio) |
| Inferencia on-device | Sí (TFLite / CoreML) |
| Storage por embedding | ~512 floats = 2 KB por mascota |
| Base de embeddings 100k mascotas | ~200 MB (trivial en pgvector) |
| Costo de entrenar modelo propio | $3–8k USD (GPU cloud 1–2 semanas) o usar API Petnow |
| Costo por scan | ~$0 (on-device) o ~$0.0003 (API) |

Fuente: Pet Biometric Challenge CVPR 2022, Petnow whitepapers, Supabase pgvector docs.

### 3.6. Seguros mascotas — unit economics de referral

| Métrica | Valor |
|---|---|
| Prima promedio anual Chile | $300–600 USD |
| Comisión referral primer año | 15–25% |
| Comisión renovación | 5–10% |
| LTV cliente seguro 3 años | $900–1.800 USD |
| **Revenue para Paw Friend / póliza activada** | **$45–400 USD primer año** |
| Conversion rate en apps pet | 2–5% de usuarios activos |

**Proyección**: 10k usuarios activos × 3% conversion × $120 prom = **$36k USD/año** solo de seguros. Con 100k usuarios, $360k/año recurrente. Este es el motor B2B de mayor retorno/complejidad.

### 3.7. Ventana de oportunidad

Factores que abren ventana AHORA (2026):
- Ley 21.020 Cholito reforzada → conciencia legal subió
- Chip legalmente obligatorio pero 70% de parque sin chip → mercado no satisfecho
- Biometría madura (iPhones con Face ID desde 2017 normalizan el concepto)
- Pet humanization acelerada post-COVID → gasto por mascota sube 8–10%/año
- Telemedicina veterinaria emergente (post-COVID) → digitalización de la ficha es aceptada
- No hay player dominante en LATAM
- CORFO + Start-Up Chile activos para startups con componente tech + social

Factores que la cierran en 18–24 meses:
- Chewy / Mars / Purina pueden entrar a LATAM
- Petnow puede expandirse desde Korea
- Aseguradoras chilenas (iki, Mapfre) están desarrollando apps propias
- Consolidación retail (Mathiesen + Kiwoko posible fusión)

---

## 4. Estrategia de 3 horizontes

### 4.1. Principio rector

**Nada que no sirva al eje (ficha médica + historia + biometría) se destaca**. Todo lo que sirve al eje se optimiza al máximo. Todo lo demás se esconde o se secundariza.

### 4.2. Mapa de horizontes

| Horizonte | Fechas | Foco | Output esperado | Unlock |
|---|---|---|---|---|
| **0** | 2026-04-24 → 2026-05-24 | Unificar eje | App que se entiende en 10 segundos | Listos para scan biométrico |
| **1** | 2026-05-24 → 2026-07-24 | Moat emergente | Nose print + Paw Passport + 1 partner + memorial viral | Listos para B2B |
| **2** | 2026-07-24 → 2027-04-24 | Producto invisible | Seguro embebido + insights pagos + expansión LATAM | Ronda A o rentabilidad |

Cada horizonte sigue el principio: no arranca el siguiente hasta que el anterior tenga KPIs verificados.

---

## 5. Fase 0 — Unificar eje (0–30 días)

### 5.1. Objetivo de la fase

Colapsar el frankenstein. Al final de 30 días un usuario nuevo que abre Paw Friend entiende en 10 segundos:
- Mi mascota tiene una ficha
- La ficha cuenta su historia
- Todo lo que hago alimenta esa ficha

### 5.2. Cambios de UI/navegación (listado por archivo)

#### 5.2.1. `src/components/BottomTabBar.tsx` — bajar a 4 tabs

**Antes** (5 tabs o más según versión): Home / Mis mascotas / Calendario / Servicios / Perfil.

**Después** (4 tabs):

| Tab | Icono | Ruta | Propósito |
|---|---|---|---|
| Mascota | 🐾 | `/home` | Mascota en foco, última acción pendiente |
| Calendario | 📅 | `/calendario?tab=hoy` | Rutinas + recordatorios + reservas unificadas |
| Vets | 🩺 | `/veterinarios` | Directorio + búsqueda + reservar |
| Yo | 👤 | `/profile` | Perfil, planes, configuración, paw points |

Gamificación (Paw Cards, Paw Game, Misiones) se accede desde "Yo → Gamificación" como sección colapsada. No está en primer nivel.

#### 5.2.2. `src/pages/Home.tsx` — "Mi mascota hoy"

**Antes**: dashboard con múltiples widgets (saludo, Paw Points, próximos recordatorios, quick access a todo).

**Después**: página de **una mascota** (si hay varias, selector arriba). Layout:

1. Hero: foto grande de la mascota + nombre + edad + Paw Card holo sutil.
2. Estado salud: 1 línea. "Kai está al día con sus vacunas" o "Faltan 2 vacunas para estar al día".
3. Próxima acción (UNA): "Vacuna antirrábica vence en 3 días" con CTA "Agendar".
4. Timeline corto: últimas 3 entradas de la ficha (ej: "Ayer: consulta con Dra. Sofia").
5. "Ver ficha completa" → `/ficha/:petId`.
6. Más abajo (scroll): quick actions reducidas (Agregar foto / Registrar peso / Crear recordatorio).

**Código impactado**:
- `src/pages/Home.tsx` — reescritura (mantener lazy loading, no romper rutas)
- Nuevo componente `src/components/home/PetHeroCard.tsx`
- Nuevo `src/components/home/NextActionCard.tsx`
- Reusar `src/hooks/usePetHealthSummary.ts` (ya existe)

#### 5.2.3. `src/pages/PetClinicalRecord/index.tsx` — tab default "Desde su nacimiento"

**Antes**: tabs Medical / Vacunas / Antiparasitarios / Consultas / Share.

**Después**: tabs reordenados + tab nuevo **Historia** como default.

| Tab | Contenido |
|---|---|
| **Historia** (default, nuevo) | Timeline visual de TODA la vida. Nacimiento → adopción → vacunas → consultas → fotos → peso → enfermedades → eventos. Generado automáticamente. |
| Vacunas | Existente |
| Antiparasitarios | Existente |
| Consultas | Existente |
| Compartir | Existente |
| **Identidad** (nuevo, secundario) | Foto, nose print, chip (si tiene), microchip, QR. |

**Código**:
- Nuevo `src/components/medical/HistoriaTimeline.tsx`
- Nuevo hook `src/hooks/usePetHistoryTimeline.ts` (consolida vacunas + consultas + reminders + fotos + eventos memorial en un feed cronológico)
- Nuevo componente `src/components/medical/PetIdentityCard.tsx`

#### 5.2.4. `src/components/AppSidebar.tsx` — colapsar grupos

**Antes**: 6+ grupos visibles por default ("Día a día", "Salud", "Causas", "Beta 🧪", "Profesional", "Cuenta").

**Después**: 3 grupos principales + resto colapsado:

| Grupo | Items |
|---|---|
| **Mascotas** (default open) | Mi mascota (link a home), Ficha clínica, Calendario, Reservas |
| **Red** (default open) | Vets, Refugios, Paw Partners |
| **Yo** (default open) | Perfil, Paw Member, Donaciones |
| Más (colapsado) | Gamificación, Comunidad, Banco de sangre, Adopción, Herramientas |

#### 5.2.5. Eliminar rutas duplicadas (redirect, no delete)

- `/reminders` → redirect a `/calendario?tab=recordatorios` (ya existe, confirmar)
- `/rutinas` → redirect a `/calendario?tab=rutinas` (ya existe, confirmar)
- `/medical-records` → redirect a `/ficha/:petId` de la primera mascota (ya existe, confirmar)

#### 5.2.6. Feature flags a activar en Fase 0

Agregar a `src/lib/featureFlags.ts`:

```ts
// Fase 0 — frankenstein tamer
PAWGAME_PROMINENT: false,    // Paw Game NO en home/bottomtab, solo sidebar colapsado
PAWGAME_MISSIONS: true,       // /misiones sigue activo pero no destacado
PAWGAME_ARCADE: true,         // mini-juego sigue activo pero colapsado
HOME_PET_FOCUS: true,         // nuevo home "mascota en foco"
FICHA_HISTORIA_TAB: true,     // tab Historia como default
BOTTOM_TAB_V2: true,          // 4 tabs nuevo
```

Estos flags permiten **rollback instantáneo** si algo rompe.

### 5.3. Onboarding refactorizado

**Antes**: signup → (antes iba a /add-pet, hoy corregido a /home).

**Después**: signup → /home con dialog de "Bienvenida, ¿agregamos a tu primera mascota?" con 3 pasos:

1. Foto + nombre + especie (obligatorio)
2. Huella nasal opcional con skip "Más tarde" (ver Fase 1)
3. Chip opcional con mensaje claro: "Si tu mascota ya tiene chip, anótalo. Lo usamos para cumplir con la Ley 21.020. La huella nasal es cómo [nombre] se identificará en Paw Friend."

Listo. No personalidad, no colors, no blood_type, no foods. Todo eso queda en edición posterior.

### 5.4. Paw Points canonizados

**Antes**: puntos por acciones aleatorias (abrir app, ver feed, completar misión).

**Después**: puntos SOLO por acciones de cuidado real:

| Acción | Puntos |
|---|---|
| Completar vacuna | +100 |
| Registrar peso | +30 |
| Registrar consulta vet | +80 |
| Subir foto mensual | +40 |
| Completar rutina del día | +10 |
| Completar carnet de vacunas (OCR) | +150 |
| Compartir ficha por primera vez | +200 |
| Captura de nose print | +200 (Fase 1) |

Los puntos se **canjean por donaciones o Paw Member** (no por cosméticos). Eso mantiene alineación con propósito.

### 5.5. Copy y comunicación

Cambios de copy en toda la app:
- Home: "Cuida a [nombre]" (no "Hola, Pedro")
- Ficha: "La historia de [nombre]" (no "Ficha clínica")
- Calendario: sin cambios
- Onboarding: "Queremos conocer a [nombre]" (no "Datos de tu mascota")

### 5.6. KPIs de Fase 0

| KPI | Baseline (hoy) | Meta día 30 |
|---|---|---|
| Time to "first meaningful action" (signup → primer post-signup action) | 90s | <30s |
| % de usuarios que entran a ficha clínica en D1 | ~25% | >60% |
| % de usuarios que completan 5 acciones de cuidado en 7 días | ~15% | >40% |
| NPS post-onboarding | no medido | >40 |
| Errores en consola en flujos core | altos (ver sesión 2026-04-23) | 0 críticos |

### 5.7. Entregables de Fase 0

- [ ] BottomTab a 4 ejes
- [ ] Home refactor "Mi mascota hoy"
- [ ] Ficha con tab Historia default
- [ ] Sidebar colapsado
- [ ] Onboarding 3 pasos
- [ ] Paw Points canonizados
- [ ] Copy actualizada
- [ ] Feature flags agregados
- [ ] Tests E2E actualizados
- [ ] Documento de "HIDDEN_FEATURES_REVIEW" creado en `_pending/`

---

## 6. Fase 1 — Moat emergente (30–90 días)

### 6.1. Objetivo de la fase

Activar los 5 features que convierten a Paw Friend en **insustituible**:

1. Nose print MVP
2. Paw Passport exportable
3. Partner piloto retail
4. SEO de insights agregados
5. Memorial viral

### 6.2. Nose print — implementación MVP

Base spec: [docs-specs/NOSE_PRINT_ID.md](../../docs-specs/NOSE_PRINT_ID.md) (reescribir con framing "primary biometric + chip como recibo legal").

**Arquitectura técnica**:

1. **Captura**: componente `src/components/onboarding/NosePrintCapture.tsx`
   - Guía visual al usuario ("Acerca la nariz de tu mascota a la cámara")
   - Usa `getUserMedia` para video live
   - Detecta nariz con modelo face-detection (TFLite, ~200 KB) corriendo on-device
   - Captura 3 frames de buena calidad y envía al backend

2. **Extracción del embedding**: edge function `supabase/functions/nose-print-embed/`
   - Input: 3 imágenes base64
   - Usa modelo MobileNetV3 + fine-tuning open source (alternativa: Petnow API comercial)
   - Output: embedding de 512 floats
   - Guarda en `nose_prints` table (pgvector)

3. **Matching**: edge function `supabase/functions/nose-print-match/`
   - Input: 1 imagen
   - Extrae embedding y hace similarity search (cosine distance) sobre tabla
   - Retorna top-3 matches con score

4. **Scan público** (mascota perdida): `/nose-scan` ruta pública (sin auth)
   - Quien encuentra mascota sin chip/QR escanea nariz
   - Si hay match → muestra ficha con contacto del dueño (consent-gated)

**Migraciones SQL requeridas** (redactar, no aplicar hoy):

```sql
-- Migration: 20260815000000_nose_print_system.sql
-- Habilitar pgvector (requiere acción en Supabase Dashboard → Extensions)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.nose_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  embedding VECTOR(512) NOT NULL,
  capture_url TEXT,              -- Thumbnail de la captura principal
  quality_score REAL,             -- 0-1, del modelo
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_by_user_id UUID REFERENCES auth.users(id),
  is_primary BOOLEAN DEFAULT TRUE, -- Solo 1 primario por mascota
  UNIQUE (pet_id) -- 1 nose print activo por mascota, resto historial
);

CREATE INDEX idx_nose_prints_embedding
  ON public.nose_prints
  USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.nose_prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own pet nose prints"
  ON public.nose_prints FOR ALL
  USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

CREATE POLICY "Nose print match is allowed for all authenticated"
  ON public.nose_prints FOR SELECT
  TO authenticated
  USING (true); -- El match busca en toda la DB. El detalle solo se revela vía edge fn con consent.

-- Función RPC para match seguro
CREATE OR REPLACE FUNCTION public.match_nose_print(
  p_embedding VECTOR(512),
  p_threshold REAL DEFAULT 0.85,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (pet_id UUID, similarity REAL)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    pet_id,
    1 - (embedding <=> p_embedding) AS similarity
  FROM nose_prints
  WHERE 1 - (embedding <=> p_embedding) > p_threshold
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit;
$$;
```

**Feature flags**:

```ts
NOSE_PRINT_ENABLED: false,        // activar gradual 10% → 50% → 100%
NOSE_PRINT_ONBOARDING: false,     // integrar en flujo signup de mascota
NOSE_PRINT_PUBLIC_SCAN: false,    // ruta /nose-scan publica
```

**Costos proyectados**:
- Si usamos Petnow API: $0.0005 / match × 10k matches/mes = $5/mes (trivial)
- Si modelo propio: GPU training $3k one-time + Supabase compute ~$15/mes

**Tiempo de implementación**: 4–6 semanas, 1 dev senior ML + 1 frontend.

### 6.3. Paw Passport exportable

**Qué es**: 1 artefacto PDF hermoso con TODA la historia de la mascota, listo para compartir en redes o llevar a un vet nuevo, emigrar, etc.

**Por qué es estratégico**:
- **Retention**: el dueño nunca quiere perder esto → no se va.
- **Viralidad**: se comparte cuando muere la mascota, cuando se rescata, cuando viaja. Cada comparte genera signups.
- **Moneda social**: "Mira la historia de Kai desde que era cachorro" es un tweet/reel natural.

**Contenido**:
- Portada con foto + nombre + fecha nacimiento + Paw Card holo
- Hoja 2: identidad (microchip, nose print, QR)
- Hoja 3–N: timeline cronológico (vacunas, consultas, antiparasitarios, peso, fotos, eventos)
- Cierre: stats (años de vida, vets visitados, vacunas totales, fotos subidas)

**Diferencia con PDF actual** ([generate-medical-summary](../../supabase/functions/generate-medical-summary/)):
- Más visual (fotos grandes)
- Más narrativo (timeline, no tablas)
- Shareable (tarjeta de portada optimizada para Instagram/X)

**Implementación**:
- Edge function nueva `supabase/functions/generate-paw-passport/` que reutiliza [generate-medical-summary](../../supabase/functions/generate-medical-summary/) como base
- Frontend: botón "Generar Paw Passport" en ficha → descarga PDF + botón "Compartir en redes" con imagen de portada

**Feature flag**: `PAW_PASSPORT: false` → activar post-QA.

### 6.4. Partner piloto retail

**Objetivo**: cerrar **1 partner retail pagando** para validar el canal físico.

**Candidatos ordenados por fit**:

| Partner | Racional | Efort estimado |
|---|---|---|
| Kiwoko Chile | Retail pet más grande Chile, 20+ tiendas. Ya tienen app propia, saben del negocio. | Alto (burocracia) |
| Mathiesen | Farma-veterinaria líder mayorista, canal clínicas. Alianza estratégica. | Alto |
| Clan Pet / Pet Zone | Cadenas medianas, más ágiles. | Medio |
| Cencosud Pet Patas | Dentro de un retailer gigante, complejo pero enorme. | Muy alto |
| **Tiendas boutique** (Petit Pets, Le Chien, indies Providencia/Vitacura) | Más ágiles, menos escala pero más rápido | Bajo — **arranque óptimo** |

**Oferta a partner piloto**:
- Integración de nose print scan en POS (opcional para empezar, QR es suficiente)
- Descuento de 10–15% a Paw Members (ver postura B2C gratis + Member opcional)
- Datos agregados de preferencias de comida de sus mascotas clientes (anonimizados)
- Contraprestación: $500–2.000 USD/mes fee o comisión por venta

**Metas**:
- 1 partner firmado en 60 días
- 3 partners firmados en 90 días
- MRR $1.5–3k USD

**Feature flag**: `PARTNER_DISCOUNTS: false` → activar cuando haya partner real.

### 6.5. SEO de insights agregados

**Qué es**: landing pages dinámicas que exponen data agregada de Paw Friend. Genera tráfico orgánico + autoridad.

**Ejemplos de páginas**:
- `/insights/peso-promedio-golden-retriever-chile`
- `/insights/cuando-vacunar-cachorro-santiago`
- `/insights/cuanto-cuesta-tener-gato-primer-ano-chile`
- `/insights/razas-mas-comunes-providencia`
- `/insights/enfermedades-frecuentes-bulldog-frances`
- `/insights/veterinarios-mejor-rating-nunoa`

**Generación**: edge function `generate-insights-landing` que combina:
- Queries agregadas sobre `pets`, `medical_records`, `pet_reminders`, `vet_bookings`
- Template SEO-friendly con schema.org / FAQ markup
- Pre-renderizado vía [scripts/post-build-spa-routes.mjs](../../scripts/post-build-spa-routes.mjs) (ya existe, extender)

**Requisito crítico**: umbral mínimo de 50 mascotas por insight para evitar identificabilidad. Si hay <50 golden retrievers, la página dice "insuficiente data, ayúdanos agregando a tu mascota" (viral loop).

**Feature flag**: `PUBLIC_INSIGHTS: false` → activar cuando DB tenga masa.

### 6.6. Memorial viral

**Hoy**: el módulo memorial existe ([20260420000000_memorial_module.sql](../../supabase/migrations/20260420000000_memorial_module.sql)) y permite marcar mascota como fallecida con timeline de tributes.

**Lo que falta**:
- **Exportación automática** del memorial como imagen hermosa shareable (portrait, story format)
- Copy que invite a compartir: "Comparte la historia de [nombre]"
- Landing pública `/memorial/:slug` con historia visible (consent opt-in del dueño)
- Copy empática sin ser morboso

**Por qué es viral**:
- El duelo genera ganas de recordar y compartir
- Amigos del dueño ven la historia hermosa en Instagram → "quiero eso para mi mascota cuando…" → signup
- Este es el momento emocional más potente del producto

**Implementación**:
- Componente `src/components/memorial/MemorialShareCard.tsx` (render canvas → imagen exportable)
- Ruta pública `/memorial/:slug` (opt-in)
- Edge function `generate-memorial-share-image` (Satori / canvas server-side)

**Feature flag**: `MEMORIAL_SHARE: false` → activar gradual.

### 6.7. Refugios con transferencia completa

**Hoy**: refugio puede crear mascota + transferir a adoptante con ficha básica ([AdminShelters](../../src/components/admin/AdminShelters.tsx), [send-pet-invitation](../../supabase/functions/send-pet-invitation/)).

**Lo que falta**:
- **Historia de rescate visible**: cuándo llegó al refugio, cómo, tratamientos recibidos → parte de la ficha desde el día 0
- **Transferencia del nose print** al adoptante (si se capturó en refugio)
- **Certificado de adopción** generado (PDF) con historia de rescate incluida
- **Follow-up automático 30/90 días** al adoptante: "¿cómo va [nombre]?" → mantiene engagement y data

**Feature flag**: ya existen `SHELTER_DONATIONS` (true) + hooks, extender.

### 6.8. KPIs de Fase 1

| KPI | Meta día 90 |
|---|---|
| Mascotas con nose print capturado | >1.000 |
| Paw Passports generados | >500 |
| Partners retail firmados | ≥1 |
| Landings de insights publicadas | ≥20 |
| Tráfico orgánico /insights/* | >5k visitas/mes |
| Memoriales compartidos | ≥50 |
| Refugios con follow-up activo | ≥5 |
| MRR | $2–5k USD |

### 6.9. Entregables de Fase 1

- [ ] Spec Nose Print actualizado con framing ético + primary biometric
- [ ] Edge functions nose-print-embed + nose-print-match
- [ ] Tabla nose_prints con pgvector
- [ ] Componente captura nose print en onboarding
- [ ] Ruta pública /nose-scan
- [ ] Edge function generate-paw-passport + componente frontend
- [ ] Primer partner piloto firmado (paid)
- [ ] Landings SEO insights (20+)
- [ ] Memorial share card + landing pública
- [ ] Certificado de adopción para refugios

---

## 7. Fase 2 — Producto invisible (90–365 días)

### 7.1. Objetivo de la fase

Convertir la data en revenue B2B sin comprometer la experiencia del dueño. **El dueño no ve nada nuevo; el backend monetiza**.

### 7.2. Seguro embebido (la apuesta grande)

**Partners objetivo**:
- iki (Chile nativo, tech-forward, pequeño)
- Mapfre Pet (escala, burocrático)
- Sura Pet (emergente)
- InsurMyPet, BuenaPuntería

**Flujo**:
1. Usuario con ficha completa ve en /home un banner sutil: "Tu seguro de mascota desde $8.000/mes" (no intrusivo, no popup)
2. Click → onboarding de seguro PRE-LLENADO con ficha (raza, edad, condiciones, vets frecuentados)
3. Cotización en 3 segundos
4. Activación con 1 click (si acepta, pago automático)
5. Paw Friend recibe comisión: 15–25% primer año, 5–10% renovación

**Ingresos proyectados**:
- 10k usuarios × 3% conversión × $120 prom = $36k/año
- 50k usuarios × 4% conversión × $150 prom = $300k/año
- 100k usuarios × 5% conversión × $180 prom = $900k/año

**Feature flag**: `EMBEDDED_INSURANCE: false` → activar cuando partner firmado.

### 7.3. Pharma co-labeling

**Qué es**: Pharma veterinaria (Zoetis, Elanco, MSD, Bayer) paga por acceso a insights agregados anónimos. Ejemplo:

> "Según 8.500 Golden Retriever chilenos activos en Paw Friend, el 42% desarrolla cojera antes de los 7 años. El suplemento X reduce incidencia en 31% en usuarios que lo toman >3 meses (n=1.200)."

**Tipos de deals**:
- **Research access**: suscripción anual de $10–30k USD para acceso a dashboard B2B con filtros (raza, comuna, edad, enfermedad)
- **Co-labeling campañas**: "Artri-Pet + Paw Friend — probado en 1.200 perros" → retorno en ventas para Pharma, awareness para Paw Friend
- **Estudios custom**: Pharma paga $30–100k USD por un estudio de cohorte (con consentimiento opt-in de dueños)

**Requisito previo**: tener base de 10k+ mascotas con ficha completa y consentimiento opt-in claro en onboarding ("¿autorizas el uso de tus datos anónimos para estudios?").

**Ingresos proyectados año 2–3**: 3–5 deals Pharma × $20–50k = $60–250k USD/año.

**Feature flag**: `PHARMA_INSIGHTS_API: false` → activar con primer partner Pharma firmado.

### 7.4. Retail fulfillment hub

**Qué es**: Paw Friend sabe CUÁNDO la mascota necesita X (comida se acaba, vacuna próxima, antiparasitario). Ofrece compra 1-click con retailers partners.

> "[Kai] está por terminar su Royal Canin Junior. ¿Te lo mandamos? 10% descuento."

**Modelo**: Paw Friend NO es retailer. Es el **intermediador de intención**. Mathiesen / Kiwoko / Pet Zone fulfillan; Paw Friend cobra comisión (5–15%).

**Requisito**: integración con partners Fase 1 (7.4 ya cerrado).

**Ingresos proyectados año 2**: 30k usuarios × 40% usan fulfillment × $200 GMV/año × 10% comisión = $240k USD/año.

**Feature flag**: `RETAIL_FULFILLMENT: false`.

### 7.5. API B2B

**Qué es**: API pagada para vets grandes, aseguradoras, refugios institucionales.

**Endpoints**:
- `/api/v1/pet/:id` — ficha completa (solo con consent del dueño)
- `/api/v1/breed-stats` — stats por raza (pago por request)
- `/api/v1/risk-score` — score de riesgo de una mascota (usado por aseguradoras)

**Pricing**: tiers, desde $500/mes (dev) hasta $15k/mes (enterprise).

**Feature flag**: `B2B_API: false`.

### 7.6. Expansión LATAM vía refugios

**Por qué refugios son el beachhead LATAM**:
- Los refugios no tienen herramientas digitales (70%+ usan Excel o nada)
- Nose print es valor inmediato para ellos (mascotas rescatadas sin chip)
- Los adoptantes reciben ficha completa → retention en mercados nuevos
- Storytelling viral: "Este perro pasó de la calle a un hogar en México, aquí está su historia completa"

**Países piloto (orden)**:
1. México (volumen, idioma, baja adopción chip 10%)
2. Argentina (tech-forward, pet humanization alta)
3. Colombia (crecimiento pet care 12%+ anual)
4. Perú (cercano Chile, refugios activos)

**Feature flag**: `LATAM_MX: false`, `LATAM_AR: false`, etc.

### 7.7. KPIs de Fase 2

| KPI | Meta día 365 |
|---|---|
| Usuarios activos Chile | 10–15k |
| Usuarios activos LATAM | 3–5k |
| Mascotas con nose print | >8k |
| Partners retail firmados | 3–5 |
| Partner seguros firmado | 1 |
| Primer deal Pharma | Firmado |
| MRR B2B | $10–15k USD |
| Retention 6 meses | >50% |

---

## 8. Modelo de negocio pivotado

### 8.1.a. Refinamiento 2026-04-23 tarde (Pedro reprioriza)

> Tras debate sobre hipótesis validadas vs por-validar, se ajusta la prioridad de revenue streams:
>
> **Core del motor (no depende de partners)**:
> - Insights B2B (Pharma, Seguros, Estudios académicos)
> - Seguros embebidos (comisión vía aseguradora)
> - Paw Member + Apoyar Paw Friend (B2C voluntario)
>
> **Nice-to-have (si entran, aceleran; si no, el plan sigue)**:
> - Partners retail (Mathiesen, Kiwoko, Pet Zone, etc.)
> - Retail fulfillment
> - Scanner físico en partners
>
> **Implicancia**: Fase 1 prioriza nose print + paw passport + pipeline insights + conversación con 1 aseguradora. **Scanner físico + partners retail se pospone a Fase 2 o Y2**. El plan no se atasca si ningún retail partner firma en Y1.

### 8.1. Principio rector (directiva Pedro 2026-04-23)

> **El dueño NUNCA paga por features. El acceso a la ficha completa, a la huella, a la Pet ID Card, a todos los insights, a los partners y a la exportación es 100% gratuito para siempre.**
>
> **Las únicas dos formas en que un dueño puede aportar dinero son VOLUNTARIAS**:
> 1. **Paw Member**: membresía simbólica con badge honorífico. Sin features extra, sin acceso privilegiado. Es un "apoyar el proyecto" con identidad visible.
> 2. **Apoyar Paw Friend** (donaciones): aporte único o recurrente a /donaciones. No entrega nada a cambio excepto gratitud pública opcional.
>
> **Todo el resto del revenue viene de B2B (los indicados: Pharma, Seguros, Retail, Vets grandes, Aseguradoras, Estudios académicos, Sponsors empresas).**

Esta es una decisión ética y estratégica:

- **Ética**: la app es para cuidar mascotas. Cobrarle al dueño por cuidar mejor a su mascota es cobrarle por el amor. No va.
- **Estratégica**: masa de usuarios gratis = data moat. Data moat = revenue B2B a largo plazo. Cobrar B2C mata adopción y mata el moat.
- **Alineación con un mentor experimentado**: "producto invisible" — el modelo de negocio nunca está visible para el dueño.
- **Diferenciación**: Chewy, Mars, Petnow tienen todos algún pricing al dueño. Paw Friend no. Esto es pelea ganable con Pharma/Seguros/Retail como indicados.

### 8.2. Qué se ELIMINA/ESCONDE del modelo previo

| Era revenue B2C (modelo anterior) | Decisión |
|---|---|
| Premium B2C con features limitadas (caps mascotas, PDF, compartir) | **Eliminar** (flag `USER_PREMIUM` ya en false) |
| Features Pro Analytics B2C pagas | **Esconder** detrás flag (Pedro-only) |
| Microtransacciones gamificación (comprar Paw Points, items) | **No implementar** |
| Ads al dueño dentro de la app | **No implementar** |
| Marketplace B2C (carrito, checkout) | **Esconder** (flag `MARKETPLACE` ya false) |
| Paw Partners como canal de promociones pagadas al dueño | **Reconvertir** a descuentos gratuitos para Paw Members (no revenue) |

### 8.3. Revenue streams consolidados (los indicados)

Solo 2 fuentes B2C voluntarias + 5 fuentes B2B que son las que pagan el proyecto.

#### 8.3.1. B2C VOLUNTARIO (Paw Member + Apoyar Paw Friend)

| Stream | Mecánica | Y1 | Y2 | Y3 |
|---|---|---|---|---|
| **Paw Member** | $3.990 CLP/mes ó $39.900 CLP/año. **Sin features**, solo badge honorífico 💛 | $3–6k | $15–25k | $30–60k |
| **Apoyar Paw Friend** | Donación única o recurrente en /donaciones | $3–8k | $10–20k | $25–50k |
| **Subtotal B2C voluntario** | | **$6–14k** | **$25–45k** | **$55–110k** |

Este stream **no se escala para cubrir el proyecto**. Se mantiene porque:
- Es señal de apoyo real del usuario (validación)
- Financia mejoras específicas (transparencia: "tu aporte pagó X")
- Da identidad comunitaria (el badge Paw Member)
- Es defensa ética (la app no presiona al usuario, solo ofrece apoyar)

#### 8.3.2. B2B "los indicados" (el verdadero motor)

| Stream | Quién paga | Mecánica | Y1 | Y2 | Y3 |
|---|---|---|---|---|---|
| **Seguros embebidos** | iki / Mapfre / Sura | Comisión 15–25% primer año, 5–10% renovación | $5–15k | $80–200k | $200–900k |
| **Pharma insights + estudios** | Zoetis, Elanco, MSD, Bayer, etc. | Suscripción $10–30k/año + estudios custom $30–100k | $0 | $30–80k | $100–250k |
| **Retail fulfillment comisión** | Mathiesen, Kiwoko, Pet Zone, Clan Pet | 5–15% sobre GMV referido | $0 | $40–100k | $150–300k |
| **Partners retail fees + scanner** | Cadenas medianas + boutiques | $500–2.000/mes + $0–500 setup scanner | $10–30k | $50–120k | $120–250k |
| **API B2B** | Vets grandes (clínicas con PIMS), Aseguradoras | SaaS $500–15.000/mes por tier | $0 | $20–50k | $60–150k |
| **Paw Companys (sponsors)** | Empresas grandes que quieren asociar marca | $49.9k–$199.9k CLP/mes según tier | $5–15k | $15–35k | $30–80k |
| **Estudios académicos** | Universidades, ONGs, gobierno | Grants / estudios custom | $0 | $10–30k | $30–80k |
| **Subtotal B2B "los indicados"** | | | **$20–60k** | **$245–615k** | **$690–2.010k** |

#### 8.3.3. Total revenue proyectado

| Año | B2C voluntario | B2B indicados | **Total** | Nota |
|---|---|---|---|---|
| Y1 (2026) | $6–14k | $20–60k | **$26–74k** | Pre-break-even. Requiere $120k runway. |
| Y2 (2027) | $25–45k | $245–615k | **$270–660k** | Break-even Q3–Q4 |
| Y3 (2028) | $55–110k | $690–2.010k | **$745–2.120k** | Rentable. Opcional Serie A. |

**B2C voluntario = 2–8% del total**. Confirma directiva: no es el motor, es el respaldo ético-comunitario.

### 8.4. Cómo convertimos a cada "indicado" (playbook por canal)

#### 8.4.1. Seguros (iki / Mapfre Pet / Sura Pet)

- **Hook**: "Usuarios con ficha completa tienen 40% menos claims catastróficos (hipótesis, confirmar con data). Tus pólizas son más rentables si pre-llenas con Paw Friend."
- **Oferta**: integración 1-click, comisión 15–25% primer año. Partner paga setup $5–10k.
- **Prioridad**: firmar uno Q3 2026. Prueba de concepto = 100 pólizas activadas.

#### 8.4.2. Pharma veterinaria (Zoetis, Elanco, MSD, Bayer)

- **Hook**: "Chile tiene la única base longitudinal de 10k+ mascotas con ficha estructurada. Queremos hacer el primer estudio de X en LATAM."
- **Oferta**: dashboard research $15–25k/año + estudios custom $50–100k.
- **Prioridad**: firmar primer deal Q1 2027. Requiere 10k+ mascotas con ficha completa.

#### 8.4.3. Retail (Mathiesen, Kiwoko, Pet Zone, Clan Pet, boutiques)

- **Hook**: "Tus clientes con mascotas en Paw Friend compran 2× más que el promedio (hipótesis). Te damos la señal de cuándo comprar."
- **Oferta Fase 1**: scanner físico gratis + descuento para Paw Members ($500–2k/mes fee).
- **Oferta Fase 2**: fulfillment comisión 5–15% sobre GMV referido.
- **Prioridad**: 1 boutique en 30 días. 2–3 cadenas medianas en 90 días. 1 cadena grande en 12 meses.

#### 8.4.4. Vets grandes con PIMS (clínicas con sistema de gestión)

- **Hook**: "Tus pacientes ya tienen ficha completa. Integra Paw Friend con tu PIMS y deja de tipear historiales."
- **Oferta**: API Enterprise $2.000–15.000/mes según volumen.
- **Prioridad**: Y2. Requiere partner PIMS + 5+ clínicas grandes usando.

#### 8.4.5. Aseguradoras por score de riesgo

- **Hook**: "Podemos darte score de riesgo por mascota antes de cotizar. Pricing más justo = mejor loss ratio."
- **Oferta**: API $1.000–5.000/mes.
- **Prioridad**: Y2–Y3.

#### 8.4.6. Sponsors empresariales (Paw Companys)

- **Hook**: "Asocia tu marca al cuidado ético de mascotas en Chile."
- **Oferta**: Bronze $49.9k/mes, Silver $99.9k/mes, Gold $199.9k/mes.
- **Prioridad**: 1 Bronze en Y1 (validación), 2–3 Silver en Y2.

### 8.5. Unit economics (dueño)

| Métrica | Valor |
|---|---|
| Cost of acquisition (CAC) dueño | $3–8 USD (orgánico + refugios + SEO insights) |
| **Revenue directo del dueño** | **$0** (nunca cobramos) |
| Revenue indirecto atribuible por dueño (comisiones, insights agregados) | $8–50 USD Y1 → $40–200 USD Y3 |
| LTV / CAC | 5–25× (excelente considerando que no cobramos al user) |
| Churn mensual dueño activo | target <4% Y2 |

### 8.6. Proyección 3 años (conservadora vs optimista)

| Año | Usuarios activos (conservador) | Usuarios (optimista) | Revenue (conservador) | Revenue (optimista) | Runway req. |
|---|---|---|---|---|---|
| Y1 (2026) | 8k | 15k | $26k | $74k | $120k (CORFO + angel) |
| Y2 (2027) | 25k | 50k | $270k | $660k | Break-even Q3 |
| Y3 (2028) | 60k | 150k | $745k | $2.12M | Rentable o Serie A |

### 8.7. Output Engineering — pensar desde el insight hacia atrás

> **Principio**: cada dato que recolectamos debe tener **un output en mente desde antes de recolectarlo**. No recolectamos por recolectar. Si un dato no alimenta un insight que alguien pagaría, paga impuestos de storage, privacidad y complejidad sin retorno.

Esta sección es el método para **diseñar hacia atrás**: partir del reporte final que queremos vender o publicar, e ingeniería reversa hasta los inputs que lo hacen posible. Además mapea brechas de data y formas no invasivas de llenarlas.

#### 8.7.1. Inventario de datos actuales (qué ya recolectamos)

Auditoría de tablas principales y su valor output:

| Tabla / dato | Volumen hoy | Utilidad para insights | Veredicto |
|---|---|---|---|
| `pets` (id, name, species, breed, birth_date, gender, size, weight, color) | Bajo | Alto — base de toda segmentación | Mantener, enriquecer |
| `pets.neutered`, `blood_type`, `chronic_conditions_detail`, `allergies` | Muy bajo | Muy alto — pharma, seguros | Recolectar más activamente |
| `pets.microchip_number` | Bajo | Medio — cruzar con SAG | Útil para compliance, no para insights |
| `pets.food_brand`, `food_type` | Bajo | Muy alto — retail alimentación | Enriquecer con tracking de cambios |
| `medical_records` | Bajo-medio | Muy alto — pharma, estudios | **Mayor gap actual** |
| `pet_reminders` | Medio | Alto — compliance vacunas, cronogramas | Mantener |
| `vet_bookings` | Bajo | Medio — frecuencia visitas | Bueno si volumen sube |
| `pet_routines` | Muy bajo | Alto — actividad, bienestar | **Gap grande** |
| `vet_clinical_notes` | Bajo | Muy alto — diagnósticos, tratamientos | **Gap grande pero sensible** |
| `service_providers` (vets) | Medio | Medio — ranking, estudios canal | Mantener |
| `paw_points_ledger` | Alto | Bajo — solo interno gamificación | **No aporta a insights, candidato a no usar en outputs** |
| `notifications` | Alto | Bajo — log interno | Ignorar en outputs |
| `feed_posts`, `chat_messages` | Bajo (disabled) | Bajo | Ignorar |

**Diagnóstico**: lo que hoy recolectamos cubre ~40% de lo que necesitamos para los outputs target. Los gaps son: medical records (mucho texto libre, poco estructurado), clinical notes (gap grande), routines (casi sin data), timeline unificado (no existe hasta refactor).

#### 8.7.2. Los 12 outputs target (de acá sale el revenue B2B)

Lista priorizada de **reportes/insights/APIs que queremos vender** a 3 años. Cada uno con: qué mide, quién compra, qué data requiere, qué nos falta hoy.

| # | Output | Quién compra | Precio estimado | Data requerida | Gap hoy |
|---|---|---|---|---|---|
| 1 | **Cronograma real de vacunación por raza/edad/comuna Chile** | Pharma (Zoetis, MSD), Gobierno SAG | $15k/año suscripción | Vacunas aplicadas + fecha + raza + comuna | Medium — registro de vacunas manual |
| 2 | **Curva de crecimiento y peso por raza 0-24 meses** | Petfood (Royal Canin, Proplan), Pharma | $20k/estudio | Peso histórico + raza + edad | Alto — casi no hay registros peso |
| 3 | **Correlación horas paseo semanal × esperanza vida por raza** | Petfood senior, Pharma articular | $30k/estudio | Tracking paseos + memorial | Muy alto — rutinas + memorial en bajo volumen |
| 4 | **Mapa de enfermedades crónicas por raza en Chile** | Pharma especializada, Aseguradoras | $25k/estudio | Diagnósticos + raza + comuna | Alto — clinical notes estructurados |
| 5 | **Score de riesgo por mascota** (input: raza/edad/condiciones/peso) | Aseguradoras (API) | $5k/mes SaaS + $0.50/query | Ficha completa + siniestros históricos | Medio — sin siniestros data aún |
| 6 | **Preferencias de marca alimento por segmento sociodemográfico** | Retail (Mathiesen, Kiwoko), Marcas alimento | $20k/año dashboard | food_brand + location + compras | Alto — purchases no tracked |
| 7 | **Frecuencia de baño óptima por raza vs incidencia dermatológica** | Marcas shampoo, Groomers, Pharma derm | $15k/estudio | Eventos hygiene + health | Alto — gap grande |
| 8 | **Tiempo de adopción promedio en refugios + perfiles rescatables** | ONGs, Gobierno, Fundaciones | Grants + reports | Adoption_centers + pets + transferencias | Medio — infra existe, falta volumen |
| 9 | **Ranking honesto de vets por outcomes** | Aseguradoras (pricing), Dueños (freemium) | $10k/mes API aseguradora | Vet + outcomes + follow-ups | Muy alto — outcomes no trackeados |
| 10 | **Patrones de esterilización por comuna y consecuencias** | Municipios, Gobierno (Cholito 2.0) | Grants $30-80k | is_spayed + comuna + edad esterilización | Medio |
| 11 | **Ciclo de vida completo: gasto acumulado pet-owner por segmento** | Retail, Aseguradoras, Planners financieros | $20k/año | Purchases + services + duration_owned | Muy alto — purchases casi 0 |
| 12 | **Indicador de bienestar animal a nivel país** | Gobierno, ONGs, Medios | Free (SEO + PR) | Composite de todos anteriores | N/A — índice compuesto |

**Total revenue potencial de outputs Y3**: $200k–500k USD si activamos 6–8 de estos.

#### 8.7.3. Análisis de gaps de datos (qué necesitamos recolectar que hoy no está)

Los 7 gaps críticos ordenados por importancia estratégica:

**Gap 1 — Eventos de actividad/paseo estructurados** (para outputs 3, 11, 12)

- **Qué falta**: registro detallado de paseos (duración, distancia, tipo) e interacciones sociales
- **Cómo recolectar sin molestar**: Quick Action "play" cronómetro + GPS automático (sección 2.8), detección pasiva por movement API
- **Volumen target Y1**: >50k paseos registrados
- **Herramienta**: `pet_timeline_events` categoría `activity` + tabla dedicada `walks_detail`

**Gap 2 — Peso longitudinal frecuente** (para outputs 2, 5, 6)

- **Qué falta**: registros de peso cada 1–3 meses para construir curvas
- **Cómo recolectar sin molestar**: push suave cada 60 días "¿Pesaste a [nombre]?" con 1-tap input. Integración con balanzas smart (Fitbark, Whistle) en Fase 2. Durante consultas vet, el vet registra y alimenta.
- **Volumen target Y1**: 3+ registros de peso por mascota por año, >20k mascotas

**Gap 3 — Medical records con diagnóstico estructurado** (para outputs 4, 5, 9)

- **Qué falta**: estructura en diagnósticos (hoy es texto libre). Codificación tipo ICD-vet
- **Cómo recolectar sin molestar**:
  - Audio notes owner → IA estructura diagnóstico con taxonomía (ej: "dermatitis atópica", "displasia cadera leve")
  - Vets: sugerencia de tagging en clinical notes (autocompletar con ontología)
  - OCR de recetas + extracción de principio activo
- **Volumen target Y1**: 5k registros con diagnóstico estructurado

**Gap 4 — Alimentación con marca + cantidad + cambio** (para outputs 2, 6, 11)

- **Qué falta**: marca + tipo comida + porción diaria + cambios
- **Cómo recolectar sin molestar**:
  - Onboarding pregunta opcional "¿Qué come [nombre]?" con autocompletar marcas
  - Partner retail integrado: compra = cambio automático registrado
  - Scan de bolsa de comida (OCR/barcode) → registra marca + fecha apertura
- **Volumen target Y1**: 70% de mascotas activas con marca declarada

**Gap 5 — Compras/productos** (para outputs 6, 11)

- **Qué falta**: no trackeamos nada de purchases hoy
- **Cómo recolectar sin molestar**:
  - Foto/OCR de recibo (opcional, user voluntario)
  - Scanner de QR en punto de venta partner (Fase 2)
  - Integración API partner (Fase 2) — la más escalable
- **Volumen target Y1**: ~10% mascotas con ≥1 purchase registrada
- **Volumen target Y3**: 60%+ vía partners integrados

**Gap 6 — Outcomes/seguimiento post-consulta** (para outputs 5, 9)

- **Qué falta**: tras consulta vet ¿mejoró? ¿recayó? ¿cambió tratamiento? → outcome real
- **Cómo recolectar sin molestar**:
  - Push 7/14/30 días post-consulta: "¿Cómo está [nombre]? 😊 mejor / 😐 igual / 😟 peor" (1 tap)
  - Si vet registra followup, se cierra el loop
- **Volumen target Y1**: 30% de consultas con outcome registrado
- **Volumen target Y3**: 70%

**Gap 7 — Intolerancias, alergias, reacciones adversas** (para outputs 4, 5)

- **Qué falta**: hoy solo hay `allergies` en texto libre
- **Cómo recolectar sin molestar**:
  - Al cambiar alimento: push 14 días "¿Hubo intolerancias?" con presets (diarrea, vómitos, prurito, nada)
  - Al registrar tratamiento: push 3 días "¿Reacciones al medicamento?"
- **Volumen target Y1**: 20% de mascotas con alergias/intolerancias declaradas

#### 8.7.4. Matriz Dato → Output → Pagador

Para cada tipo de dato que la app recolecta, vinculamos explícitamente a qué output(s) alimenta y quién paga por ese output. **Ningún dato se recolecta si no aparece en esta columna de outputs**.

| Input | Category timeline | Outputs que alimenta | Pagador principal |
|---|---|---|---|
| Vacuna aplicada | Health | 1, 4 | Pharma, Gobierno |
| Diagnóstico consulta | Health | 4, 5, 9, 12 | Pharma, Aseguradoras |
| Medicamento recetado | Health | 4, 11 | Pharma, Retail |
| Peso registrado | Weight | 2, 5, 6 | Petfood, Pharma |
| Marca alimento | Nutrition | 2, 6, 11 | Petfood, Retail |
| Paseo GPS | Activity | 3, 11, 12 | Petfood, Pharma articular, Gobierno |
| Baño | Hygiene | 7 | Marcas shampoo, Groomers |
| Foto mensual | Social | 12 | Medios (PR gratis) |
| Compra producto | Purchases | 6, 11 | Retail |
| Cambio hogar | Home | 11 | Estudios conductuales |
| Cumpleaños / hitos | Milestone | 12 | Medios, engagement viral |
| Chip / cédula | Legal | 1, 10 | Gobierno, Aseguradoras |
| Nose print | (identidad) | Todos — llave de data | N/A (infra) |
| Memorial | Milestone | 3, 12 | Universidades, Pharma senior |
| Transferencia refugio | Home + Milestone | 8, 12 | ONGs, Gobierno |
| Scanner partner | Varios | 6, 11 | Retail |

**Regla derivada**: si alguien propone agregar un campo/tabla al producto, primero llenar su fila en esta matriz. Si no tiene pagador o output claro, **no se implementa o se esconde**.

#### 8.7.5. Cómo validamos que un dato realmente vale

Proceso trimestral de auditoría de dato:

1. Para cada tabla/campo recolectado, contar % de usuarios que lo llenan
2. Si llenado <5% → gap de UX (la app lo pide mal) o dato innecesario → evaluar
3. Para cada output objetivo, verificar si la data necesaria está presente y estructurada
4. Para cada gap, priorizar recolección por ratio: (valor B2B potencial) / (esfuerzo técnico + fricción usuario)

#### 8.7.6. Anti-patrones que NO hacemos (por ética + por foco)

- **No recolectar data que no alimente un output en la matriz 8.7.4**. Regla dura.
- **No vender data individual identificable**. Solo agregados con k≥50.
- **No compartir con partner sin consent granular del dueño**.
- **No recolectar data que el dueño tiene que llenar en formulario largo**. Si no hay método ambient u one-tap, rediseñar o descartar.
- **No recolectar data sensible de terceros** (ej: info del vet de cabecera beyond lo público — solo su consentimiento).

#### 8.7.7. Proceso de revisión continua del dato

En el ritual mensual (sección 2.10.3), además de features, revisar data:

1. **Nueva data recolectada últimos 30 días**: ¿alimenta algún output? ¿Llenado >10%?
2. **Data con llenado bajo**: ¿rediseñar recolección o remover campo?
3. **Outputs sin data suficiente**: ¿activar plan de recolección focalizado?
4. **Requests de pagadores**: ¿qué data están pidiendo? ¿podemos ofrecerla?
5. **Gap con quick win**: un gap donde 20% de esfuerzo produce 80% del dato

#### 8.7.8. Del dolor al insight — mapeo end-to-end (principio Problem-first + UX-first)

> **Regla doble**: cada output que vendemos resuelve un dolor real para alguien que paga, **Y** se genera desde una experiencia de usuario que la mascota y su dueño sienten como útil, simple, rápida. Si uno de los 2 lados falla, el output no se construye.

Toda feature de Paw Friend se evalúa con la cadena completa:

```
DOLOR REAL DEL MERCADO
   ↓
OUTPUT QUE LO RESUELVE
   ↓
DATOS QUE EL OUTPUT REQUIERE
   ↓
EXPERIENCIA DE USUARIO QUE GENERA ESOS DATOS (simple, rápida, útil)
   ↓
HOOK DEL USUARIO (por qué le conviene aportarlo)
```

**Si cualquier eslabón de la cadena no está claro, la feature NO se implementa**.

#### 8.7.9. Mapa consolidado: dolor → output → UX → revenue

| # | Dolor real (del mercado) | Quién sufre el dolor | Output que lo resuelve | UX en la app (cómo se siente el dueño) | Hook: por qué el dueño aporta el dato | Revenue Y3 |
|---|---|---|---|---|---|---|
| 1 | "Mi perro tiene 4 años y todavía no sé cuándo tocan sus vacunas, pierdo los papeles" | Dueño, Vet, Pharma (no sabe mercado real) | Cronograma vacunación por raza/edad/comuna | Un push "¿Pusiste la antirrábica el 15/3?". Tap "Sí" → registrado. Próxima auto-agendada. | Nunca más pierde una vacuna, no tiene que recordar | $20–60k |
| 2 | "No sé si mi cachorro Golden está creciendo normal. ¿Está bien de peso?" | Dueño (ansiedad), Petfood (no sabe mercado curva real) | Curva de crecimiento por raza 0-24 meses | Input peso 1-tap. Gráfica con comparativa "Otros Golden tu edad: 18–22 kg, [nombre] está en 19 kg ✅" | Tranquilidad inmediata + gamificación del crecimiento | $30–80k |
| 3 | "¿Le doy suficiente paseo? ¿Cuánto es suficiente?" | Dueño (culpa), Pharma articular (sin data esperanza vida) | Horas paseo × esperanza vida por raza | Tracker one-tap, app calcula, sugiere meta semanal. "Esta semana [nombre] caminó 3h 20min ✅" | Saca la culpa, le da sentido al paseo, mide cuidado | $50–150k |
| 4 | "Mi raza tiene problemas recurrentes pero nadie tiene data clara de qué esperar" | Dueño (preocupación), Pharma (mercado nicho sin evidencia) | Mapa enfermedades crónicas por raza en Chile | Reporte "Bulldog Francés chilenos tienen X% problemas respiratorios. Señales tempranas: …" visible en ficha | Información que le llega en momento crítico sin buscarla | $80–200k |
| 5 | "Cotizar seguro es un trámite de 20 min con 40 preguntas que ya tengo en otras partes" | Dueño (fricción), Aseguradora (caro pricing) | Score de riesgo por mascota + pre-llenado | "Tu seguro desde $8.000/mes" con botón "Activar" — 1 tap con ficha ya completa | 0 fricción para seguro, precio correcto desde día 1 | $200–900k |
| 6 | "¿Qué marca le doy? Hay 30 opciones y no sé cuál funciona con mi raza/edad" | Dueño (decisión paralizada), Retail/Petfood (no sabe preferencia real) | Preferencias de marca por segmento | "El 68% de Golden adulto chilenos comen Pro Plan. [Nombre] come esta marca hace 3 meses — sin intolerancias 👍" | Info social que reduce ansiedad de decisión | $120–250k |
| 7 | "¿Cuándo bañar? ¿Cada cuánto? ¿Qué shampoo?" | Dueño, Marcas shampoo (sin data frecuencia óptima) | Frecuencia baño × dermatitis | Recordatorio cada 3 semanas según raza + recomendación shampoo si hay incidentes registrados | Simplifica rutina higiene + menos dermatitis | $30–80k |
| 8 | "No encuentro refugio donde adoptar cerca. Y cuando llega el animal nuevo, no sé nada de él" | Adoptante, Refugio, ONGs (gestión manual) | Adopción + ficha completa transferida | Transferencia con 1 click desde refugio → adoptante recibe ficha completa + insights de la mascota | Continuidad del cuidado desde día 0 en nuevo hogar | Grants + Y3 comisión |
| 9 | "¿Este vet es bueno para esta cirugía? No tengo forma de saber" | Dueño (decisión crítica), Aseguradora (no puede pricing por vet) | Ranking vets por outcome | Sugerencia vet con track record + rating visible en booking | Confianza en elección, outcomes mejores | $60–150k |
| 10 | "¿A qué edad esterilizar? Hay opiniones encontradas" | Dueño, Municipios (no sabe impacto políticas) | Patrones esterilización y consecuencias | Recomendación contextual según raza + edad + comuna | Decisión informada, no genérica | Grants |
| 11 | "¿Cuánto voy a gastar en [mascota] este año? ¿Y en su vida?" | Dueño (ansiedad financiera), Retail/Seguros (sin modelo gasto) | Ciclo vida + gasto acumulado | Dashboard "este año llevas $X, promedio Golden $Y, proyección anual $Z" | Planificación real del cuidado sin sorpresas | $100–250k |
| 12 | "¿Cómo está el cuidado de mascotas en Chile? ¿Se está mejor que antes?" | Gobierno, ONGs, Medios, Sociedad | Indicador bienestar animal Chile | Reporte público anual "Paw Friend State of Pet Care Chile 2027" | PR + autoridad de marca | Free (viral + PR) |

#### 8.7.10. El principio UX-first que une todo

Toda UX que pedimos al dueño cumple estas 4 condiciones (**no negociables**):

1. **Simple**: 1 botón, 1 tap, sin elección entre múltiples opciones ambiguas
2. **Fácil**: no requiere recordar, buscar, comparar. La app propone, usuario confirma
3. **Rápido**: <10 segundos del tap al guardado. Si tarda más, reduce pasos
4. **Útil inmediata**: el usuario recibe valor en el mismo momento (gráfica que se actualiza, insight que aparece, próxima acción agendada automáticamente, tranquilidad emocional)

**Test interno**: si al implementar un input se necesita tutorial de más de 2 frases, **el diseño está mal**. Rediseñar antes de mergear.

#### 8.7.11. Problema central que Paw Friend resuelve (tesis en 1 frase, cierre)

> **Los dueños quieren cuidar bien a sus mascotas pero la información para hacerlo está fragmentada, desordenada, olvidada en carpetas, perdida en WhatsApp con el vet, o simplemente no existe. Paw Friend la junta, la guarda sin esfuerzo, y la devuelve como insight cuando importa — y en el proceso construye el mapa más completo de la vida animal en Chile, que Pharma, Seguros y Retail pagan por entender.**

Todo el resto del plan es consecuencia de esta frase.

---

## 9. Arquitectura técnica requerida

### 9.0. PROTECCIÓN FÉRREA DE DATOS EXISTENTES (lectura obligatoria antes de cualquier migración)

> **Estado de prod al 2026-04-23**: hay usuarios reales con mascotas reales usando Paw Friend. Ninguna acción de este plan puede borrar, corromper, o hacer inaccesible data existente. Esta sección es la aplicación del [CLAUDE.md §9.7](../../CLAUDE.md) reforzada al máximo para este refactor.

#### 9.0.1. Las 12 reglas férreas (todas negociables = 0)

1. **NUNCA `DROP TABLE` sobre**: `pets`, `profiles`, `auth.users`, `medical_records`, `pet_reminders`, `vet_bookings`, `bookings`, `service_providers`, `adoption_centers`, `pet_co_owners`, `medical_share_tokens`, `memorial_events`, `donations`, `paw_companys`, `paw_voices`, `pitch_applications`.

2. **NUNCA `DELETE FROM` sin `WHERE` específico** en tablas con data de usuarios. Cualquier delete debe filtrarse por un dato concreto (`id = X`, `owner_id = ... AND created_at < ...`), nunca barrido.

3. **NUNCA `ALTER TABLE ... DROP COLUMN`** sin haber migrado los datos de esa columna a la nueva estructura Y haberlo probado en staging. Si se va a droppear, primero `RENAME` a `col_deprecated` y mantener 1 release antes de drop real.

4. **Renombrar columnas → `RENAME COLUMN`, nunca drop + create nueva**. Los datos deben mantenerse.

5. **Columnas nuevas `NOT NULL` sin `DEFAULT`**: solo si la migración incluye un `UPDATE` previo que rellene TODAS las filas existentes. Si hay >100k filas, usar batch update con `WHERE id > last_id LIMIT 1000` para no bloquear.

6. **Nuevas tablas con FK a `pets` o `profiles`**: siempre `ON DELETE CASCADE` si la nueva tabla es metadata puramente de la mascota. Si puede tener valor propio (ej: `memorial_events`), usar `ON DELETE SET NULL` o lógica custom.

7. **Triggers plpgsql**: regla 9.2.1 de CLAUDE.md (smoke test inline + EXCEPTION WHEN OTHERS en INSERTs secundarios). **Sin excepciones**.

8. **Cambios de enum**: nunca `DROP TYPE`. Usar `ALTER TYPE ... ADD VALUE 'nuevo'` para agregar. Para eliminar valores, primero migrar filas.

9. **`is_public`, `lifecycle_status`, `deleted_at` (soft delete)**: si se necesita ocultar una mascota o perfil, usar soft delete (`lifecycle_status='archived'` o `deleted_at=now()`). **Nunca hard delete**.

10. **Backup automático antes de cada migración**: Pedro saca backup Supabase antes de aplicar cualquier migración de este plan. Si la mig falla o corrompe data, restauración desde backup es el plan B.

11. **Mascotas huérfanas** (creadas por vet o refugio sin dueño): deben preservarse con su `created_by_vet_id` o `created_by_shelter_id` + `pending_owner_email`. Nunca eliminar por "limpieza" porque aún no tienen dueño — son data legítima esperando reclamo.

12. **Auth**: no renombrar ni eliminar `auth.users` IDs. Cualquier columna `owner_id UUID` se mantiene apuntando a `auth.users(id)` con `ON DELETE CASCADE` solo para datos derivados (fotos, recordatorios), NUNCA para mascotas (las mascotas sobreviven al borrado del dueño en auth pidiendo re-claim — ver mig `20260413200000_fix_vet_pet_creation.sql`).

#### 9.0.2. Checklist pre-migración (aplicar a cada una)

Antes de aplicar CUALQUIER migración de este plan, Pedro (o el que la aplique) debe verificar:

- [ ] ¿La migración toca `pets`, `profiles`, `auth.users`, `medical_records` o `pet_reminders`? Si sí → triple revisión.
- [ ] ¿Droppea alguna columna o tabla? Si sí → documentar dónde se migra la data antes.
- [ ] ¿Agrega columna `NOT NULL`? Si sí → tiene `DEFAULT` o `UPDATE` previo para filas existentes.
- [ ] ¿Crea o modifica trigger plpgsql? Si sí → tiene smoke test inline con rollback (regla 9.2.1).
- [ ] ¿Afecta RLS? Si sí → verificar que no bloquee acceso a usuarios existentes.
- [ ] ¿Backup actualizado hecho? Si no → hacerlo antes de ejecutar.
- [ ] ¿Pregunta del dueño: "un usuario que creó su cuenta ayer, ¿sigue viendo sus datos correctamente?" → SÍ con evidencia.
- [ ] ¿Pregunta del vet: "un vet con 50 pacientes pendientes, ¿perdería alguno?" → NO con evidencia.
- [ ] ¿Rollback claro documentado? → SÍ escrito arriba del SQL.

#### 9.0.3. Migraciones nuevas — todas son ADITIVAS

Todas las migraciones que este plan propone son **adiciones puras**, no destructivas:

- `pet_timeline_events` (nueva tabla, no toca existentes)
- `pet_id_cards` (nueva tabla)
- `owner_audio_notes` (nueva tabla)
- `nose_prints` (nueva tabla + pgvector extension)
- `paw_passport_cache` (nueva tabla)
- `consent_opt_in_data` (nueva tabla)
- `walks_detail` (nueva tabla)
- `insights_aggregates` (vistas materializadas, no afecta tablas base)
- `partner_integrations`, `partner_api_keys`, `partner_scanner_events`, `partner_api_audit` (nuevas)
- `insurance_policies_link`, `insurance_commissions` (nuevas)

**Zero DROP, zero RENAME destructivo, zero DELETE masivo.**

Las columnas en tablas existentes solo se agregan (`ADD COLUMN IF NOT EXISTS`), nunca se modifican. Excepciones: si durante Fase 0 descubrimos un campo obsoleto en `pets` con llenado <1%, seguir proceso del punto 3 (rename → deprecated → drop en release siguiente).

#### 9.0.4. Features escondidas ≠ data eliminada

Esconder una feature con feature flag **NO elimina nada de DB**. El código sigue en el repo. Las tablas siguen con data. Solo la UI oculta la ruta/componente.

Ejemplos concretos:
- Si se esconde Paw Game → tabla `game_sessions` sigue con records históricos
- Si se esconde Feed → posts viejos siguen en `posts`, `post_likes`, `post_comments`
- Si se esconde Chat → `chat_conversations` y `chat_messages` siguen intactas

Decisión de eliminar data histórica: solo tras 6+ meses de flag OFF y revisión explícita en el ritual mensual (sección 2.10.3). Nunca durante el refactor.

#### 9.0.5. Columnas candidatas a revisión (NO eliminar sin aprobación explícita)

Durante la auditoría Fase 0 puede detectarse que estas columnas/tablas están sub-utilizadas. **Ninguna se elimina** sin decisión explícita de Pedro y backup verificado:

| Tabla / columna | Uso estimado | Acción propuesta |
|---|---|---|
| `pets.is_public` | Medio | Mantener, se reutiliza en compartir |
| `pets.color` | Bajo pero útil | Mantener, es dato de cédula |
| `pets.personality` (array) | Bajo | Mantener, nice-to-have visible |
| `pets.vaccination_status` | Legacy (reemplazado por timeline) | Mantener hasta Fase 1 completa, luego candidate a rename+deprecated |
| `pets.special_needs` | Muy bajo | Mantener, potencial input clínico |
| `pets.medical_notes` | Bajo (texto libre) | Mantener, migrar contenido a timeline en Fase 1 |
| `paw_points_ledger` | Alto en records, bajo en valor | Mantener para compatibilidad gamificación |
| `post_*` (feed) | Legacy, flag OFF | Mantener hasta decisión ritual +6 meses |
| `chat_*` | Legacy, flag OFF | Mantener hasta decisión ritual +6 meses |

#### 9.0.6. Estrategia de testing durante el refactor

Antes de cada deploy a prod con cambios de este plan:

1. **Staging con copia de prod**: backup prod → restore a env staging → aplicar mig → validar
2. **Queries de verificación post-mig**: para cada tabla tocada, `COUNT(*)` antes y después debe cuadrar (o crecer, nunca decrecer)
3. **Smoke test con usuario real demo**: login con cuenta demo, verificar que ve sus mascotas, ficha, recordatorios, reservas
4. **Monitoring 24h post-deploy**: alertas en Sentry + audit snapshot (ya existe sistema) para detectar regresiones

### 9.0.bis Inventario real DB prod al 2026-04-23 — 150 tablas clasificadas

> **Hallazgo crítico del auditoría** (Pedro corrió query `SELECT tablename FROM pg_tables WHERE schemaname='public'` 2026-04-23): la DB de prod tiene **150 tablas activas**, no ~50 como el plan asumía. 276 migraciones aplicadas. Hay tablas duplicadas (mismo concepto en 2–3 tablas distintas), tablas huérfanas (existen en DB pero el código no las usa), y tablas zombies (feature apagado por flag pero data sigue).
>
> Este inventario es la **base real** sobre la que se ejecuta el refactor. No podemos agregar más tablas nuevas sin entender qué ya existe.

#### 9.0.bis.1 Clasificación en 5 buckets

**Bucket A — CORE del nuevo plan (usar activamente)** — 22 tablas:

`pets`, `profiles`, `medical_records`, `pet_reminders`, `vet_bookings`, `bookings`, `service_providers`, `adoption_centers`, `pet_co_owners`, `medical_share_tokens`, `memorial_events`, `donations`, `paw_companys`, `paw_voices`, `pitch_applications`, `vaccine_schedule_doses`, `vaccination_protocols`, `vet_clinical_notes`, `pet_routines`, `routine_completions`, `admin_access`, `analytics_events`.

**Bucket B — LEGACY ACTIVA (mantener y eventualmente conectar al eje)** — ~50 tablas:

Perfiles especializados, booking, reviews, providers, comunidad, gamificación básica, notificaciones, error logging, CRM vets, adoption flow, documentos. Ejemplos: `device_tokens`, `notification_preferences`, `pet_documents`, `provider_availability`, `error_logs`, `audit_snapshots`, `consultation_templates`, etc.

**Bucket C — LEGACY DORMIDA (flag OFF, data quieta, no tocar)** — ~35 tablas:

Feed social, chat, paseos compartidos, dogsitter full flow, training, marketplace, advertisements. Ejemplos: `posts`, `post_comments`, `post_likes`, `chat_*`, `shared_walks`, `dogsitter_*`, `training_*`, `orders`, `order_items`, `cart_items`, `advertisements`, `shared_walk_participants`, `walk_routes`, `walk_bookings`, `walk_reviews`, `pending_reviews`, etc.

**Bucket D — HUÉRFANAS (DB pero sin uso en código)** — ~5 tablas detectadas:

Tablas que existen en `types.ts` (generado de Supabase) pero ningún componente/hook las consulta. **No se alimentan, no se leen, pero ocupan espacio mental y físico**:

- `comprehensive_medical_records` — tabla alternativa a `medical_records` que nunca se adoptó. Solo en types.ts.
- `vet_pet_relationships` — tercer intento de modelar relación vet↔mascota. Solo en types.ts.
- `points_history` — tabla alternativa a `paw_point_transactions`. Solo en types.ts.
- `virtual_routes` — feature experimental abandonada.
- `activities` vs `pet_activities` vs `user_activities` — probable duplicación histórica.

**Bucket E — DUPLICACIONES DEL MISMO CONCEPTO (resolver antes de Fase 0)** — 5 grupos críticos:

Este es el hallazgo más importante. Hay **5 conceptos modelados por múltiples tablas** que crean ambigüedad:

| Concepto | Tablas existentes | Tabla canónica propuesta | Acción |
|---|---|---|---|
| **Medical records** | `medical_records`, `comprehensive_medical_records` | `medical_records` + nuevo `pet_timeline_events` | Huerfana `comprehensive_*` → rename a `_deprecated` en Fase 1 |
| **Relación vet↔mascota** | `pet_vet_links`, `vet_pet_relationships`, `pet_co_owners` | `pet_vet_links` (vets) + `pet_co_owners` (co-dueños, no vets) | `vet_pet_relationships` huérfana → rename `_deprecated` |
| **Puntos de gamificación** | `paw_point_transactions`, `points_history` | `paw_point_transactions` | `points_history` huérfana → rename `_deprecated` |
| **Perfiles de servicio** | `service_providers` + `vet_profiles` + `dog_walker_profiles` + `dogsitter_profiles` + `trainer_profiles` + `groomer_profiles` | `service_providers` (unificada) | Los 5 perfiles especializados → mantener como legacy read-only, migrar datos residuales |
| **Bookings** | `bookings`, `vet_bookings`, `dogsitter_bookings`, `walk_bookings`, `training_bookings`, `appointments` | `vet_bookings` (canónica vet), `bookings` (otros servicios) | Los 4 "_bookings" especializados y `appointments` → mantener read-only, migrar datos si corresponde |

#### 9.0.bis.2 Gamificación — el frankenstein más profundo

Sistema de puntos/logros modelado en **~20 tablas**. Muchas con uso bajo o cero:

`achievements`, `activities`, `daily_challenges`, `guardian_levels`, `missions`, `paw_badges`, `paw_card_collections`, `paw_game_monthly_rankings`, `paw_missions`, `paw_point_transactions`, `paw_shop_rewards`, `pet_activities`, `pet_activity_cheers`, `pet_paw_progress`, `points_history`, `rewards`, `user_achievements`, `user_activities`, `user_challenges`, `user_guardian_progress`, `user_mission_progress`, `user_missions`, `user_paw_badges`, `user_rewards`, `user_shop_redemptions`.

**Acción Fase 0**: auditar cuáles tienen data real (>100 filas) y cuáles son schema muerto. Las últimas → mover a bucket D, documentar para posible drop en 6+ meses.

**Decisión del plan post-refactor**: gamificación se colapsa a 3 tablas canónicas:
- `paw_point_transactions` — ledger único
- `pet_timeline_events` categoría `milestone` — reemplaza achievements individuales
- `paw_badges` + `user_paw_badges` — badges visibles (simplificada)

El resto se marca como legacy dormida.

#### 9.0.bis.3 Regla de ejecución

**Ninguna migración de las propuestas 9.1 se aplica sin antes**:

1. **Confirmar tabla canónica** en caso de concepto duplicado (bucket E)
2. **Migrar datos residuales** de tablas huérfanas/legacy a la canónica si corresponde
3. **Rename a `_deprecated`** las huérfanas (no drop aún)
4. **Actualizar types.ts** regenerando desde Supabase tras cada rename
5. **Verificar que el código no referencia** las tablas deprecated

#### 9.0.bis.4 Query de verificación ejecutar cada fase

Para detectar nuevas duplicaciones o huérfanas a medida que el refactor avanza:

```sql
-- Tablas con 0 filas (potenciales huérfanas)
SELECT schemaname, relname, n_live_tup AS filas
FROM pg_stat_user_tables
WHERE schemaname='public' AND n_live_tup = 0
ORDER BY relname;

-- Tablas con >100 filas pero sin INSERT reciente (data vieja, tabla dormida)
SELECT schemaname, relname, n_live_tup AS filas,
       last_autovacuum, last_analyze
FROM pg_stat_user_tables
WHERE schemaname='public'
  AND n_live_tup > 100
  AND (last_autovacuum IS NULL OR last_autovacuum < NOW() - INTERVAL '30 days')
ORDER BY n_live_tup DESC;

-- Cross-check: qué tablas están en DB pero NO en types.ts ni referenciadas en src/
-- (correr manualmente: generar lista de DB, diff con grep -r en src/)
```

#### 9.0.bis.5 Lista concreta de acciones pre-Fase 0

Antes de aplicar cualquier migración nueva del plan:

- [ ] Correr query de 0-filas y listar tablas sin data (candidatas a drop futuro)
- [ ] Auditar uso real de las ~20 tablas de gamificación — cuáles tienen >100 filas
- [ ] Rename `comprehensive_medical_records` → `comprehensive_medical_records_deprecated_20260424`
- [ ] Rename `vet_pet_relationships` → `vet_pet_relationships_deprecated_20260424`
- [ ] Rename `points_history` → `points_history_deprecated_20260424`
- [ ] Rename `virtual_routes` → `virtual_routes_deprecated_20260424` (validar primero que no se use)
- [ ] Regenerar types.ts post-renames: `npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts`
- [ ] Verificar que nada compila roto: `npx tsc -b`
- [ ] Documentar en `_pending/DB_DEPRECATED_TABLES_REVIEW_2026_10_24.md` lista para eliminación definitiva en 6 meses

### 9.1. Nuevas tablas SQL (redactadas, sin aplicar)

Migraciones a crear:

1. `20260525000000_pet_timeline_events.sql` — tabla unificada de eventos con 10 categorías canónicas (Fase 0)
2. `20260530000000_pet_id_cards.sql` — tabla pet_id_cards con metadata de la cédula + versionado (Fase 0)
3. `20260601000000_owner_audio_notes.sql` — tabla owner_audio_notes + trigger que crea eventos en timeline (Fase 0)
4. `20260815000000_nose_print_system.sql` — tabla nose_prints + pgvector + RPC match (Fase 1)
5. `20260830000000_paw_passport_cache.sql` — cache de passports generados (Fase 1)
6. `20260905000000_consent_opt_in_data.sql` — consentimientos granulares por tipo de uso (Fase 1)
7. `20260915000000_quick_action_events.sql` — tabla walks + presets de acciones rápidas (Fase 1)
8. `20260920000000_insights_aggregates.sql` — vistas materializadas para insights (Fase 1)
9. `20261001000000_partner_integrations.sql` — tablas partners + descuentos + integrations (Fase 2)
10. `20261101000000_insurance_embed.sql` — policies link + comisiones tracking (Fase 2)
11. `20261201000000_api_b2b_keys.sql` — API keys, rate limits, audit (Fase 2)

**Schema de `pet_timeline_events`** (Fase 0, crítico):

```sql
CREATE TYPE timeline_category AS ENUM (
  'health',        -- 🏥 Salud
  'weight',        -- ⚖️ Peso y crecimiento
  'nutrition',     -- 🍗 Alimentación
  'hygiene',       -- 🛁 Higiene y cuidado
  'activity',      -- 🐾 Rutinas y actividad
  'social',        -- 📸 Vida social y fotos
  'purchases',     -- 🛒 Compras y accesorios
  'home',          -- 🏠 Hogar y ambiente
  'milestone',     -- 💜 Momentos e hitos
  'legal'          -- 📋 Documentos y legal
);

CREATE TABLE public.pet_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  category timeline_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_at TIMESTAMPTZ NOT NULL,             -- Cuándo OCURRIÓ el evento (no el registro)
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id),
  source TEXT NOT NULL CHECK (source IN (
    'manual', 'audio', 'auto_trigger', 'ocr', 'vet_note',
    'shelter_transfer', 'partner_integration', 'import'
  )),
  is_milestone BOOLEAN DEFAULT FALSE,        -- Destacar visualmente
  is_user_reported BOOLEAN DEFAULT TRUE,     -- vs oficial vet
  media_urls JSONB,                          -- fotos, audios, pdfs
  location_geojson JSONB,                    -- GPS cuando aplica
  data JSONB,                                -- Schema por categoría (weight_kg, duration_min, etc.)
  related_record_id UUID,                    -- Link a medical_records, pet_reminders, etc.
  related_record_table TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_pet_event_at ON pet_timeline_events(pet_id, event_at DESC);
CREATE INDEX idx_timeline_pet_category ON pet_timeline_events(pet_id, category, event_at DESC);
```

**Schema de `pet_id_cards`**:

```sql
CREATE TABLE public.pet_id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL UNIQUE REFERENCES public.pets(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL UNIQUE,          -- Formato: PF-2026-XXXXXXXX
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,            -- Se regenera si cambian datos críticos
  svg_url TEXT,                              -- Versión SVG en storage
  png_url TEXT,                              -- Versión PNG imprimible (300 DPI)
  pdf_url TEXT,                              -- Versión PDF tamaño cédula CR-80
  wallet_pass_url TEXT,                      -- Apple/Google Wallet (Fase 2)
  metadata JSONB NOT NULL,                   -- Snapshot de datos al generar
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Schema de `owner_audio_notes`**:

```sql
CREATE TABLE public.owner_audio_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  audio_url TEXT NOT NULL,
  duration_seconds INT,
  transcript TEXT,                           -- Poblado por edge function
  structured_data JSONB,                     -- IA extrae: fecha, motivo, vet, dx, tx
  category timeline_category DEFAULT 'health',
  event_at TIMESTAMPTZ,                      -- El user especifica cuándo fue la consulta
  processed_at TIMESTAMPTZ,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'transcribing', 'structuring', 'done', 'failed'
  )),
  timeline_event_id UUID REFERENCES pet_timeline_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Cada migración seguirá regla **9.2.1 de CLAUDE.md**: smoke test inline con rollback para cualquier trigger plpgsql.

### 9.2. Edge functions nuevas

Agregar a `supabase/functions/`:

- `nose-print-embed/` — generar embedding de imagen
- `nose-print-match/` — buscar mascota por huella
- `generate-paw-passport/` — PDF enriquecido
- `generate-memorial-share-image/` — imagen optimizada redes
- `generate-insights-landing/` — HTML SEO para rutas públicas
- `partner-discount-validate/` — validar Paw Member para descuento
- `insurance-prefill-quote/` — cotizar con partner aseguradora
- `pharma-insights-api/` — endpoint B2B con auth key

### 9.3. Cambios frontend principales por carpeta

| Carpeta | Cambios |
|---|---|
| `src/pages/Home.tsx` | Reescritura: "Mi mascota hoy" |
| `src/pages/PetClinicalRecord/` | Tab Historia nueva, Identidad nueva, reordenar |
| `src/components/home/` | 3 componentes nuevos (PetHeroCard, NextActionCard, QuickActions) |
| `src/components/medical/` | HistoriaTimeline, PetIdentityCard |
| `src/components/onboarding/` | NosePrintCapture, OnboardingMinimalV2 |
| `src/components/BottomTabBar.tsx` | 4 tabs |
| `src/components/AppSidebar.tsx` | 3 grupos + colapsado |
| `src/components/paw-passport/` | Nuevo: generación + share card |
| `src/pages/NoseScan.tsx` | Nueva página pública |
| `src/pages/Memorial/:slug.tsx` | Nueva pública opt-in |
| `src/lib/featureFlags.ts` | +20 flags nuevos |

### 9.4. pgvector habilitado

Requiere acción manual en Supabase Dashboard → Database → Extensions → habilitar `vector`.
Sin esto, no hay nose print.

### 9.5. Costos de infra proyectados

| Concepto | Hoy | Post-refactor Y2 |
|---|---|---|
| Supabase Pro | $25/mes | $25–150/mes |
| OpenAI / Claude / Gemini | $50/mes | $100–300/mes |
| Storage (fotos + pdf) | $10/mes | $50–200/mes |
| pgvector compute | $0 | $15–50/mes |
| Edge functions compute | incluido | $10–40/mes |
| CDN + GitHub Pages | $0 | $0–20/mes |
| **Total mensual** | **~$85/mes** | **$200–760/mes** |

Revenue target Y2 ($29k–50k/mes) cubre holgadamente.

---

## 10. Feature flags: lista maestra post-refactor

```ts
// src/lib/featureFlags.ts — estado objetivo post-Fase 2

export const FEATURE_FLAGS = {
  // ── Flags existentes (confirmar estados) ──
  USER_PREMIUM: false,
  PAWGAME_SIDEBAR: true,
  MARKETPLACE: false,
  SHARED_WALKS: false,
  LOST_PETS_SECTION: false,
  PRO_ANALYTICS: true,
  LABS_ADOPTION: true,
  LABS_BLOOD_DONORS: true,
  LABS_COMMUNITY: true,
  MAP_PET_FRIENDLY: false,
  FEED: false,
  CHAT: false,
  DONATIONS_MONTHLY: false, // solo true si SpA + cuenta Flow
  SHELTER_DONATIONS: true,
  BOOKING_V3_WIZARD: false,
  PROVIDER_AGENDA_CALENDAR: false,
  PROVIDER_PUSH: false,
  ICS_EXPORT: false,

  // ── Nuevos Fase 0 (frankenstein tamer + pilares trinidad) ──
  PAWGAME_PROMINENT: false,           // Paw Game NO en home/bottomtab
  PAWGAME_MISSIONS: true,              // /misiones accesible pero secundario
  PAWGAME_ARCADE: true,                // mini-juego accesible pero secundario
  HOME_PET_FOCUS: true,                // nuevo home "mascota en foco"
  FICHA_HISTORIA_TAB: true,            // tab Historia como default en ficha
  BOTTOM_TAB_V2: true,                 // BottomTab de 4 ejes
  SIDEBAR_COLLAPSED: true,             // sidebar 3 grupos default + resto colapsado
  ONBOARDING_V2_MINIMAL: true,         // onboarding 3 pasos minimal
  PAW_POINTS_CANONICAL: true,          // puntos solo por cuidado real
  PET_ID_CARD_V1: true,                // Pet ID Card estilo cédula
  TIMELINE_CATEGORIES: true,           // timeline unificado con 10 categorías
  OWNER_AUDIO_NOTES: true,             // Audio notes desde el dueño
  QUICK_ACTIONS_HUB: true,             // Widget one-tap en Home

  // ── Nuevos Fase 1 (moat emergente) ──
  NOSE_PRINT_ENABLED: false,           // gradual rollout 10% → 50% → 100%
  NOSE_PRINT_ONBOARDING: false,        // integrar en flujo signup mascota
  NOSE_PRINT_PUBLIC_SCAN: false,       // ruta /nose-scan publica
  PAW_PASSPORT: false,                 // PDF + share card
  PARTNER_DISCOUNTS: false,            // descuentos en partners para Paw Members
  PUBLIC_INSIGHTS: false,              // landings SEO /insights/*
  MEMORIAL_SHARE: false,               // memorial compartible viral
  SHELTER_FOLLOWUP: false,             // follow-up auto post-adopción
  WALK_GPS_TRACKING: false,            // GPS background con consent
  CASCADE_AUTO_REMINDERS: true,        // post-vacuna crea reminder próxima (ya existe parcial)
  CASCADE_WEIGHT_ALERTS: false,        // alerta si peso baja 10%+
  CASCADE_BIRTHDAY_AUTO: true,         // share card automática cumpleaños

  // ── Nuevos Fase 2 (producto invisible) ──
  EMBEDDED_INSURANCE: false,           // seguros embebidos con aseguradora partner
  PHARMA_INSIGHTS_API: false,          // dashboard B2B + estudios custom
  RETAIL_FULFILLMENT: false,           // comisión sobre GMV referido
  B2B_API: false,                      // API pagada para vets grandes / aseguradoras
  PARTNER_SCANNER_API: false,          // scanner físico en puntos de partner
  PARTNER_AUTO_TIMELINE: false,        // auto-crear eventos desde scanner
  PASSIVE_DETECTION_GPS: false,        // geofence clínicas veterinarias
  CASCADE_AI_SUGGESTIONS: false,       // AI layer que sugiere next action
  CASCADE_INACTIVITY_CHECK: false,     // push si no hay actividad 7d
  AI_PATTERN_DETECTION: false,         // ML sobre patrones de cuidado
  LATAM_MX: false,                     // expansión México
  LATAM_AR: false,                     // expansión Argentina
  LATAM_CO: false,                     // expansión Colombia
} as const;
```

**Estado inicial de rollout por fase**:
- **Fase 0**: 9 flags nuevos — la mayoría en `true` desde el deploy (cambios UI unificación). No hay riesgo de rollout gradual porque son refactors visuales con fallback claro.
- **Fase 1**: 12 flags nuevos — la mayoría en `false`, activados gradualmente. Nose print requiere rollout 10/50/100 con monitoring.
- **Fase 2**: 13 flags nuevos — todos en `false` hasta partners/deals firmados.

---

## 11. Riesgos y mitigación

### 11.1. Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Nose print accuracy baja en perros chilenos (razas mixtas) | Media | Alto | Entrenar con 500+ fotos locales antes de GA |
| pgvector performance con 100k+ embeddings | Baja | Medio | HNSW index, benchmark en Fase 1 |
| PDF generation lenta | Media | Bajo | Cache pre-generados, CDN |
| Costo OpenAI spikes | Media | Medio | Prompt cache + Haiku para tareas simples |

### 11.2. Riesgos de producto

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Users confunden nose print con chip requirement | Alta | Alto | Copy explícita + onboarding paso a paso |
| Memorial percibido como morboso | Media | Medio | Copy empática + opt-in doble |
| Partner retail no firma | Media | Medio | 3 opciones en paralelo + indie primero |
| Seguro embebido: bajo conversion | Alta | Medio | A/B test banners + pre-llenado |

### 11.3. Riesgos legales/regulatorios

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| SAG interpreta postura biométrica como "incentivar no-chip" | Baja | Alto | Copy clara "ley lo pide, lo registramos" + consultoría legal |
| GDPR-like exigencia de consent granular | Media | Medio | Opt-in por tipo ya planeado |
| Aseguradora requiere auditoría antes de integrar | Alta | Medio | Preparar documentación desde Fase 1 |
| Data de mascotas vendida sin consent → multa | Baja | Muy alto | Solo agregados anónimos, nunca individual |

### 11.4. Riesgos competitivos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Chewy / Mars entra a Chile | Media (18+ meses) | Muy alto | Acelerar moat data + partners exclusivos |
| Petnow expande a LATAM | Media | Alto | Firmar partners retail antes; marca local |
| Aseguradora lanza app propia | Alta | Medio | Ser el aggregator, no competir en pricing |
| Clon local | Alta | Bajo | Velocidad de ejecución + data moat |

### 11.5. Riesgos financieros

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| CORFO rechaza postulación | Media | Alto | Preparar angel + Start-Up Chile en paralelo |
| Runway <6 meses Q3 2026 | Media | Muy alto | Operar lean, founder salary $0–500 hasta validar MRR |
| Partner paga tarde | Alta | Medio | Contratos con net-30 + cobranza activa |

---

## 12. Cronograma detallado

### 12.1. Fase 0 (30 días): 2026-04-24 → 2026-05-24

| Semana | Entregable |
|---|---|
| 1 (24/4–30/4) | Feature flags agregados, spec Home/BottomTab aprobado, tests E2E actualizados, empezar refactor Home |
| 2 (1/5–7/5) | Home "Mi mascota hoy" en dev, BottomTab 4 tabs, sidebar colapsado |
| 3 (8/5–14/5) | Tab Historia en ficha, timeline component, onboarding v2 minimal |
| 4 (15/5–21/5) | Paw Points canonizados, copy refresh, QA end-to-end |
| Deploy (22/5–24/5) | Rollout gradual 10% → 100%, monitorear errores, ajustar |

### 12.2. Fase 1 (60 días): 2026-05-25 → 2026-07-24

| Mes | Entregables clave |
|---|---|
| Mes 1 (25/5–24/6) | Nose print MVP: pgvector, edge fns, captura, matching. Primer partner piloto (boutique tiendas Providencia). |
| Mes 2 (25/6–24/7) | Paw Passport PDF + share card. SEO insights (20 landings). Memorial share. Refugios follow-up. 2º partner firmado. |

### 12.3. Fase 2 (275 días): 2026-07-25 → 2027-04-24

| Trimestre | Entregables clave |
|---|---|
| Q3 2026 (7–9/2026) | Seguro embebido piloto con 1 aseguradora. API B2B v1. Pharma primer pitch. |
| Q4 2026 (10–12/2026) | Retail fulfillment vivo con 2 partners. Expansión LATAM MX piloto (refugios). |
| Q1 2027 (1–3/2027) | Pharma primer deal firmado. 3 países LATAM activos. Métricas de retention validadas. |
| Ajuste (4/2027) | Decisión Serie A o bootstrapping rentable. |

### 12.4. Dependencias externas (Pedro decide / opera)

| Item | Owner | Fecha límite |
|---|---|---|
| Cuenta Flow.cl migrada a SpA | Pedro (SGSE ya constituida, falta cuenta banc) | 2026-05-15 |
| Habilitar pgvector en Supabase Dashboard | Pedro | Antes Fase 1 (24/5) |
| Postulación CORFO SSAF-I | Pedro | 2026-06-30 |
| Apple Developer account activa | Pedro (en proceso) | 2026-06-15 |
| Meta Business Verification aprobada | Pedro (esperando) | 2026-06-30 |
| Primer contacto partner retail | Pedro | 2026-06-01 |
| Pitch a un mentor experimentado versión refinada | Pedro | 2026-04-30 |
| Legal review postura biométrica | Pedro contrata | 2026-05-10 |

---

## 13. KPIs consolidados de éxito

### 13.1. KPIs Fase 0 (día 30)

- [ ] Time to first action: <30s
- [ ] % entra a ficha D1: >60%
- [ ] Errors críticos consola: 0
- [ ] NPS post-onboarding: >40
- [ ] Tests E2E: 100% passing

### 13.2. KPIs Fase 1 (día 90)

- [ ] Mascotas con nose print: >1.000
- [ ] Paw Passports generados: >500
- [ ] Partners retail firmados: ≥1 pago
- [ ] Landings SEO: ≥20 publicadas
- [ ] Tráfico orgánico: >5k visitas/mes
- [ ] MRR: $2–5k USD

### 13.3. KPIs Fase 2 (día 365)

- [ ] Usuarios activos totales: 10–20k
- [ ] Mascotas con ficha completa (>5 entradas): >5.000
- [ ] Partners retail: 3–5
- [ ] Aseguradora firmada: 1
- [ ] Primer deal Pharma: firmado
- [ ] MRR total: $10–15k USD
- [ ] Runway restante: >18 meses o rentable

---

## 14. Checklist ejecutable (inicio inmediato)

### 14.1. Lo que se puede hacer HOY (Día 1)

- [x] Este plan aprobado (estado de este MD)
- [ ] Actualizar `_pending/README.md` con pointer a este plan
- [ ] Crear `_pending/HIDDEN_FEATURES_REVIEW_2026_11_23.md` con lista de revisión a +6 meses
- [ ] Reescribir [docs-specs/NOSE_PRINT_ID.md](../../docs-specs/NOSE_PRINT_ID.md) con framing "primary biometric + chip legal"
- [ ] Crear `docs-raiz/pitch/POSTURA_BIOMETRIA_2026_04_23.md` (manifiesto público)
- [ ] Agregar feature flags Fase 0 a [src/lib/featureFlags.ts](../../src/lib/featureFlags.ts) (todos en estado target)
- [ ] Confirmar con Pedro dependencias externas (cronograma 12.4)

### 14.2. Semana 1 (2026-04-24 → 2026-04-30)

- [ ] Diseño visual del nuevo Home "Mi mascota hoy" (Figma o mockup)
- [ ] Diseño visual del tab Historia
- [ ] Spec técnico aprobado por Pedro
- [ ] Backup completo DB prod antes de empezar refactor
- [ ] Branch feature/refactor-maestro-2026-04 creado

### 14.3. Gatekeeping entre fases

**No pasar a Fase 1** hasta que Fase 0 tenga:
- KPIs 13.1 alcanzados
- 0 errores críticos en consola prod
- NPS >40 de beta testers
- Aprobación explícita de Pedro

**No pasar a Fase 2** hasta que Fase 1 tenga:
- KPIs 13.2 alcanzados
- Al menos 1 partner retail pagando
- Nose print con >95% accuracy en test real de 50 mascotas chilenas

---

## 14.bis. Análisis profundo y opinión del pivote (Claude)

> Sección escrita tras releer el documento completo. No es resumen — es opinión honesta sobre la dirección, las fortalezas reales, y las tensiones que este plan todavía no resuelve.

### 14.bis.1. Qué estamos tratando de lograr (en una respiración)

Paw Friend deja de competir en la categoría vaga "app de mascotas" y se instala en una categoría nueva que hoy no existe en Chile/LATAM: **registro biométrico digital con historia longitudinal de mascotas, gratis para el dueño, monetizado en B2B invisible**.

Los 3 artefactos tangibles que el dueño usa — **Pet ID Card, Huella Nasal, Ficha Médica con Timeline** — son los pilares visibles. El modelo de negocio entero sucede afuera de su pantalla.

### 14.bis.2. Lo que este pivote hace bien (3 cosas)

**1. Colapsa el frankenstein por principios, no por gusto.**

El problema original no era qué feature eliminar — era que no había criterio. Con los 4 tests (Trinidad, One-Tap, Ambient, Insights) cualquier feature existente o nueva se evalúa objetivamente. Esto cierra debates y acelera decisiones. Es disciplina, no capricho.

**2. Alinea ética con estrategia sin sacrificar ninguna.**

La postura biométrica (nose print primario + no cobrar al dueño + no vender data individual) es **simultáneamente**:
- Ética (tratar bien a las mascotas y sus dueños)
- Estratégica (aumenta trust → aumenta adopción → aumenta data moat → aumenta revenue B2B)
- Diferenciadora (ni Chewy ni Mars ni Purina pueden tomar esta postura sin contradecirse)

Raro ver un pivote donde el interés ético y el económico están tan alineados. Cuando esto pasa, generalmente es señal de que la estrategia está bien.

**3. Crea activo defendible a 24 meses que nadie puede clonar rápido.**

La data longitudinal con consent opt-in no se compra, no se copia, no se clona. Un competidor que arranque en 2028 necesita esperar hasta 2030 para tener data que responda preguntas interesantes. Paw Friend con 2 años de ventaja gana esa carrera **incluso si lo copian**, siempre que mantenga la base de usuarios activos.

### 14.bis.3. Las 4 tensiones que este plan todavía no resuelve (hay que mirarlas)

**Tensión 1 — Runway vs tiempos del moat.**

El plan asume $120k de runway Y1 y break-even Q3 2027. El moat de data tarda 24–36 meses en madurar lo suficiente como para atraer deals Pharma significativos. La ventana entre "gastamos plata en construir" y "empezamos a cobrar en serio" es de 18 meses mínimo. **Riesgo: si runway se corta o tarda más en levantarlo, el plan se rompe**.

Mitigación propuesta que NO está suficientemente detallada en el plan actual:
- Revenue puente Y1–Y2 de partners retail + seguros (pueden activarse antes que pharma)
- Plan B: si Y1 no alcanza 3k usuarios activos, reducir scope a Chile + 1 partner + 1 insurer y esperar validación antes de expandir LATAM

**Tensión 2 — Complejidad técnica de Ambient Computing vs recursos disponibles.**

Background GPS, detección pasiva, BLE beacons, scanner distribuido, AI pattern detection, cascadas de triggers — esto es **MUCHO trabajo técnico para 1 persona o equipo pequeño**. El spec Ambient (sección 2.8) podría tomar 6–12 meses por sí solo.

Recomendación implícita en el plan pero que conviene explicitar: **implementar Ambient por partes, priorizando lo que genera más eventos de timeline con menor esfuerzo técnico**. Por ejemplo:
- Prio 1 (Fase 0): Quick Actions Hub + Audio Notes (90% del valor, 20% del esfuerzo)
- Prio 2 (Fase 1): Cascadas de triggers + Calendar integration (alto valor, esfuerzo medio)
- Prio 3 (Fase 2): Background GPS + BLE + scanner físico (esfuerzo alto, valor claro pero tardío)

**Tensión 3 — El dueño quiere resultados rápidos, la data tarda.**

Un dueño nuevo en Paw Friend el Día 1 tiene **una mascota y cero historia**. El valor del timeline, insights, Paw Passport y cédula requiere 30–90 días de uso sostenido para sentirse sustancial. Riesgo: churn temprano antes de que el valor se acumule.

Mitigación (sugerencia para agregar al plan):
- **Bootstrap automático al crear mascota**: al agregar, la app pre-carga eventos inferidos (nacimiento, primera vacuna según edad + raza estándar, hitos de cachorro). Timeline no nace vacío.
- **Comparación social agregada temprana**: "Otras Golden Retriever de 2 años en Chile pesan entre X–Y kg, tu mascota está en Z" desde el día 1 (si hay suficiente data). Da valor instantáneo.
- **Memorial preview** opcional: "Así se verá el álbum de vida de [nombre] en 5 años" → muestra template con placeholders. Crea compromiso emocional temprano.

**Tensión 4 — Scanner físico distribuido requiere 2 lados de la cancha.**

El scanner en partners físicos es una feature genial pero requiere:
- Paw Friend construya el hardware/software
- Partners acepten instalarlo y usarlo
- Usuarios tengan nose print capturado previamente

Si cualquiera de los 3 lados falla, el scanner no genera eventos. Es un bet de coordinación. Recomiendo Fase 2 (no Fase 1) y con un partner único lighthouse que valide el modelo antes de escalar.

### 14.bis.4. Lo que pondría con MÁS foco que el plan actual

**a. Audio notes del dueño en Fase 0 (no Fase 1).**

Este es el feature de mayor leverage en el plan: convierte cualquier interacción del dueño con su mascota (consulta vet, tratamiento en casa, observación de comportamiento) en un evento estructurado sin formulario. Debería estar listo antes que el nose print, porque alimenta el timeline inmediatamente incluso sin infraestructura biométrica.

**b. Memorial viral desde Fase 0.**

El memorial es el momento emocional más poderoso de todo el producto. Cada mascota que fallece con memorial generado y compartido = 5–10 signups de amigos del dueño (hipótesis optimista, confirmar). Moverlo a Fase 0 no cuesta mucho (ya hay módulo base en [20260420000000_memorial_module.sql](../../supabase/migrations/20260420000000_memorial_module.sql)) y acelera el loop viral.

**c. Seguros embebidos en Fase 1 (no Fase 2).**

Es el revenue stream más grande a 3 años. Iniciar conversaciones con iki/Mapfre AHORA (aunque firme en Y2) es estratégico. Los deals de integración toman 6–12 meses de due diligence + legal. Si se arranca recién en Fase 2, el primer peso de seguro llega en Y3, no Y2.

### 14.bis.5. Lo que pondría con MENOS foco que el plan actual (opinión controversial)

**a. LATAM expansion Y1–Y2.**

El plan habla de expansión a México/Argentina/Colombia. Mi opinión: **concentrar Chile hasta 30k+ usuarios activos y 3–5 partners firmados antes de cualquier expansión LATAM**. La tentación de expansión geográfica temprana diluye foco y multiplica complejidad (legal, integraciones bancarias, partners locales).

Chile tiene 6.3M mascotas. 5% de penetración = 315k usuarios. Alcanzar eso antes de pensar en México es disciplina saludable. El plan actualmente implica LATAM en Fase 2 — yo lo dejaría para Y3 solo si Chile ya está saturado o se agotó el growth.

**b. Paw Companys (sponsors empresariales) como prioridad.**

El flujo de sponsors ($49.9k–$199.9k CLP/mes) es revenue respetable pero requiere esfuerzo comercial desproporcionado vs el retorno. Recomendación: **reactivo, no proactivo**. Si una empresa pregunta por esto, atenderla. No destinar hours semanales a prospecting de sponsors. El revenue se construye con indicados (Pharma/Seguros/Retail), no con branding empresarial.

**c. API B2B para vets grandes.**

Tentador pero prematuro. Las clínicas grandes chilenas usan 2–3 sistemas PIMS distintos (ninguno dominante). Construir integraciones 1:1 es costoso y el retorno no justifica hasta tener 20+ clínicas interesadas simultáneamente. Mi voto: **Fase 2 tardía o Y3**.

### 14.bis.6. La métrica que decide si el pivote funciona

Por encima de MRR, usuarios activos, o retention: **la métrica maestra es "mascotas con ficha completa al cabo de 90 días"** donde "completa" significa:
- ≥10 eventos de timeline en al menos 3 categorías distintas
- Pet ID Card generada
- (Fase 1+) Nose print capturado

Si al día 90 el 50%+ de mascotas nuevas tiene ficha completa, el loop funciona. Si es <20%, algo está roto (probablemente fricción en captura). Esta métrica debe ser el **norte diario** del equipo.

### 14.bis.7. Recomendación final

El pivote es correcto y está bien estructurado. Las 3 cosas que harían la diferencia entre **ejecutarlo bien vs ejecutarlo perfecto**:

1. **Disciplina obsesiva sobre los 4 tests** (sección 2.10.1). Cada feature nueva o existente pasa por ahí sin excepción, aunque duela.
2. **Priorizar Audio Notes + Memorial en Fase 0**, moviéndolos desde Fase 1 para acelerar el loop de valor.
3. **Aplazar LATAM hasta que Chile muestre masa crítica**. Foco es tu único recurso infinito.

El plan tal como está es ejecutable con 1 persona + IA durante 6 meses si hay runway mínimo + dependencias externas resueltas. No requiere levantar una Serie A antes — requiere CORFO/angel ~$120k USD + no distracciones.

**Mi voto**: aprobar el plan, ajustar las 3 recomendaciones de arriba, empezar Fase 0 el 2026-04-24.

---

## 15. Referencias y docs relacionados

- [docs-raiz/pitch/MODELO_V2_2026_04_22.md](../pitch/MODELO_V2_2026_04_22.md) — Modelo v2 Roberto
- [docs-specs/NOSE_PRINT_ID.md](../../docs-specs/NOSE_PRINT_ID.md) — Spec biometría (a reescribir)
- [CLAUDE.md](../../CLAUDE.md) — Manual operativo del repo
- [src/lib/featureFlags.ts](../../src/lib/featureFlags.ts) — Sistema flags vigente
- [diagrams/FLUJO_COMPLETO.mmd](../../diagrams/FLUJO_COMPLETO.mmd) — Flujo actual (a actualizar post-refactor)
- [docs-raiz/planes/PLAN_EXITO_90D_20260420.md](PLAN_EXITO_90D_20260420.md) — Plan 90d anterior (superado por este)
- [docs-raiz/planes/BOOKING_SYSTEM_MASTER_PLAN.md](BOOKING_SYSTEM_MASTER_PLAN.md) — Plan booking V3 (compatible)

---

## 16. Historial del plan

| Fecha | Evento |
|---|---|
| 2026-04-22 | un mentor experimentado pitch → modelo v2 (producto invisible, vets=canal) |
| 2026-04-23 | Pedro expresa "frankenstein feeling", pide plan maestro refactor |
| 2026-04-23 | Conversación extendida sobre data moat, nose print, partners, expansión |
| 2026-04-23 | Claude Opus 4.7 genera este documento |
| — | Próximo: Pedro revisa, da feedback, aprobación de Fase 0 |

---

**Fin del plan.** Cualquier decisión de producto, negocio o técnica de los próximos 12 meses debe referenciar o actualizar este documento. Si una feature no tiene encaje aquí, hay que discutir si (a) la sumamos, (b) la aplazamos, (c) la eliminamos del backlog.
