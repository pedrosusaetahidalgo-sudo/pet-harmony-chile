# Prompts listos para próxima(s) sesión(es) — Paw Friend

> Última actualización: 2026-04-08 (post sesión Premium B2C + landing + look dorado).
> Cada prompt es self-contained: copia-pega uno en una conversación nueva con Claude Code y arranca con todo el contexto necesario.
>
> **Antes de empezar cualquier prompt**, hace `git pull origin main` para tener la última versión.

---

## Estado al cierre de la sesión 2026-04-08

### ✅ Hecho y vivo en producción
- Audit + ownership fix de las 4 edge functions médicas / sitemap / webpay
- Migración backend cleanup (`training_reviews` policies + bucket size limits)
- Rename `ServiceCalendar → MyBookings`, ruta `/mis-reservas`
- **Premium B2C completo end-to-end con Flow** (paywall + 2 edge functions + hook + 3 páginas)
- Look dorado en Premium (`/upgrade`, paywall, success, badge en perfil)
- **Rediseño landing** `Index.tsx` (597 → 132 líneas, -78%)
- Copy en español chileno (archivos nuevos y modificados esta sesión)
- Video hero del landing en producción (Kling, 4.4 MB)
- Memoria persistente: Flow, secrets-en-chat, español chileno

### 🔴 Acciones manuales pendientes del dueño (NO van como prompt)
1. **Eliminar `VITE_GOOGLE_MAPS_API_KEY` del Google Cloud Console** (la app ya migró a Leaflet, la key sigue activa pero sin uso).
2. **Spend cap Anthropic** (heredado del CONTEXTO original, USD 10/mes) — confirmar si ya está hecho.
3. **Verificar plan de backups Supabase** — confirmar que los daily backups están activos.

### ⏳ Prompts disponibles abajo

| # | Prompt | Riesgo | Tiempo estimado | Bloqueado por |
|---|---|---|---|---|
| 1 | Bugs pendientes médicos (PDF español + overflow + ZIP real) | Bajo | 1-2h | Nada |
| 2 | Material para reuniones con vets (no código, solo docs) | Cero | 1h | Nada |
| 3 | Backend hardening (logs, CORS, eliminar function huérfana) | Bajo | 1h | Acceso al dashboard |
| 4 | Pendientes legacy baratos (imports, optimizar PNGs, sitemap) | Bajo | 1-2h | Nada |
| 5 | Audit copy chilena en TODA la app (155+ componentes) | Bajo | 1-2h | Nada |
| 6 | God component `PetClinicalRecord.tsx` (1444 líneas) | Medio | 2-3h | Nada |

**Recomendación de orden**: 2 → 5 → 1 → 3 → 4 → 6
- 2 primero porque las reuniones con vets son inminentes y es lo único que tiene deadline real
- 5 segundo porque es mecánico y sin riesgo, mejora la percepción inmediata del producto para el target chileno
- 1 tercero porque cierra la deuda médica que dejamos a medio fixear
- 3 y 4 son backend cleanup, hacer cuando haya tiempo
- 6 al final porque es deuda técnica pura, no urgente

---

## PROMPT 1 — Bugs pendientes en `generate-medical-summary` y `generate-medical-zip`

```
Lee AUDIT_REPORT_2026_04_07.md sección "Bugs documentados pero NO fixeados".

Hay 3 bugs documentados de la sesión 2026-04-07 que quedaron pendientes en las edge functions médicas. Atacalos los 3 en este orden:

PARTE A — generate-medical-summary (PDF)
Archivo: supabase/functions/generate-medical-summary/index.ts

A.1) Traducir TODOS los literales del PDF al español (es producto chileno, joya de la corona):
   - "Pet Medical Summary" → "Resumen médico de la mascota"
   - "Pet Information" → "Información de la mascota"
   - Name/Species/Breed/Gender/Birth Date/Weight/Microchip/Neutered →
     Nombre/Especie/Raza/Sexo/Fecha de nacimiento/Peso/Microchip/Esterilizado
   - "Allergies" → "Alergias"
   - "Chronic Conditions" → "Condiciones crónicas"
   - "Owner Information" → "Información del dueño"
   - "Vaccination Overview" → "Vacunas"
   - "Recent Visits" → "Visitas recientes"
   - "Date/Clinic/Reason/Diagnosis" → "Fecha/Clínica/Motivo/Diagnóstico"
   - "Generated on" → "Generado el"
   - Si encontras otro literal en inglés que se me pasó, traducilo también

A.2) Bug overflow: cuando yPosition < 50 se crea newPage pero el código sigue
   dibujando en la variable page original. Refactor:
   - Convertir page de const a let
   - Cuando se haga overflow: page = newPage; yPosition = page.getSize().height - 50
   - Verificar que el footer "Generado el" se dibuja en lastPage correctamente

PARTE B — generate-medical-zip (ZIP real con JSZip)
Archivo: supabase/functions/generate-medical-zip/index.ts

Hoy devuelve un array de signed URLs sueltas con un mensaje "ZIP generation not yet implemented". Implementar el ZIP real:

1. import JSZip from "https://esm.sh/jszip@3.10.1"
2. Por cada doc en medical_documents:
   - Descargar el archivo desde Storage:
     supabase.storage.from("medical-documents").download(doc.file_url)
   - Agregarlo al ZIP con nombre legible: `${doc.title || doc.id}.${ext}`
     (deducir ext del mime_type)
3. Generar el blob ZIP: zip.generateAsync({ type: "uint8array" })
4. Subir a medical-documents/zips/${pet_id}-${Date.now()}.zip
5. Devolver signed URL del ZIP (1h expiry)
6. Si hay >20 documentos, procesarlos en chunks de 5 en paralelo para no agotar memoria
7. Mantener el ownership check que se aplicó en sesión 2026-04-07 (NO tocar)

VERIFICACIONES:
- npx tsc -b limpio
- Redeploy de las 2 functions:
  npx supabase functions deploy generate-medical-summary --project-ref gwailbjlvevkhwcrovfd
  npx supabase functions deploy generate-medical-zip --project-ref gwailbjlvevkhwcrovfd
- Test manual con un pet_id real desde la app:
  · Generar PDF → verificar que esta en español, sin overflow
  · Generar ZIP con un pet que tenga 3+ documentos → debe devolver un ZIP descargable

REGLAS DE ORO heredadas. Commits separados por fix. Push solo cuando los 3 bugs estén verdes.
```

---

## PROMPT 2 — Material para reuniones con vets

```
Lee CONTEXTO_2026_04_07.md sección 7.4, AUDIT_REPORT_2026_04_07.md y src/pages/ParaVeterinarios.tsx.

MISIÓN: NO escribir código. Generar 3 archivos en docs/sales/ (crear la carpeta si no existe):

1. docs/sales/PITCH_VET_CORTO.md
   - 1 página, leíble en 60 segundos
   - Estructura: problema → solución → pricing → CTA
   - Tono: directo, sin jerga, hablando a un vet que no conoce la app
   - Pricing: Individual $9.900 / Clínica Básica $29.900 / Clínica Pro $59.900
   - Toda la copy en ESPAÑOL CHILENO (tuteo, no voseo). Ver memory/feedback_chilean_spanish.md.

2. docs/sales/DEMO_SCRIPT_VETS.md
   - Guion de 10 minutos para mostrar la app en vivo a un vet
   - Incluir: que tabs abrir en orden, que decir en cada una, que objeciones esperar y cómo responder
   - Reflejar el rediseño actual (Home con status cards, Premium B2C, ficha médica con PDF, directorio público)
   - Mostrar el video del hero del landing como apertura
   - Mencionar que el flujo Premium ya está vivo y que Pedro mismo puede demostrarlo

3. docs/sales/POST_REUNION_LEAVE_BEHIND.md
   - 1 página para dejar después de la reunión
   - Resumen del producto + pricing + link a pawfriend.cl/para-veterinarios + número de contacto
   - Diseño tipo flyer simple (markdown que después se exporta a PDF con pandoc o similar)

CONSIDERACIONES:
- Pedro tiene 2 reuniones próximas:
  · Una veterinaria establecida (más conservadora, ya tiene clientes)
  · Un grupo de vets recién egresados (más receptivos, sin clientela atada)
- Empezar por los recién egresados (más receptivos según contexto sección 7.4)
- Considerá si el pitch debe ser distinto para cada audiencia o uno solo funciona
- Diferencial competitivo: ficha médica descargable (PDF) + directorio público con reseñas verificadas + 0 fricción para el dueño (B2C gratis)
- NO mencionar PawGame en el pitch (Joao validó: gamification orgánica, no central)
- NO inventar métricas: si necesitas un dato que no está en el repo, marcalo con <<TODO Pedro: ...>>

ENTREGABLE: los 3 .md con copy listo para usar tal cual, en español chileno.

REGLAS: NO toques código fuente, NO regenerés types. Commit único: docs(sales): material para reuniones con vets. Push cuando esté revisado.
```

---

## PROMPT 3 — Backend hardening

```
Lee CONTEXTO_2026_04_07.md sección 7.5 y AUDIT_REPORT_2026_04_07.md.

MISIÓN: Endurecer el backend Supabase. Solo bug-fixing y cleanup, no features nuevas.

CHECKLIST:

1. Logs Supabase últimos 7 días
   Pedir al usuario el output de:
   ```sql
   select function_id, count(*) as errors, max(timestamp) as last_seen
     from edge_logs
    where level = 'error' and timestamp > now() - interval '7 days'
    group by function_id order by errors desc;
   ```
   Por cada function con errores recurrentes, reportar y proponer fix.

2. Eliminar edge function huérfana get-google-maps-key
   La app ya migró a Leaflet, la function sigue desplegada en Supabase remoto.
   ```bash
   npx supabase functions delete get-google-maps-key --project-ref gwailbjlvevkhwcrovfd
   ```
   Verificar primero con grep que el código local no la llama (debería ser 0 referencias).

3. CORS de las edge functions
   Verificar que TODAS las edge functions activas tengan
   "Access-Control-Allow-Origin": "https://pawfriend.cl"
   en lugar de "*". Buscar con:
   ```bash
   grep -rn "Allow-Origin" supabase/functions/
   ```
   Si alguna usa "*", proponer fix y validar con el dueño antes de aplicar.

4. Verificar tracker de migraciones
   Confirmar que TODAS las migraciones aplicadas en sesiones 2026-04-07 y 2026-04-08 están en el tracker:
   ```sql
   select version from supabase_migrations.schema_migrations
    where version in ('20260409000000','20260410000000','20260411000000','20260412000000','20260413000000');
   ```
   Si falta alguna, insertarla.

5. Backups Supabase
   Verificar que los daily backups están activos en el plan actual (free tier no los tiene).
   Si no, advertir al dueño.

6. Webhook idempotencia (Premium B2C)
   El flow-webhook actual NO chequea duplicados por payment_provider_id antes de llamar apply_premium.
   Si Flow reintenta el callback (puede pasar), va a crear rows duplicadas en subscriptions.
   Proponer fix: en apply_premium RPC, agregar guard "if exists subscription with same provider_id and status='active' return early".

7. Rate limit de las 2 edge functions nuevas de Flow
   flow-create-subscription y flow-webhook NO tienen rate limit hoy.
   - flow-create-subscription: agregar 10/h por user (suficiente para retries)
   - flow-webhook: NO rate limit (Flow puede reintentar legítimamente)

REGLAS DE ORO heredadas. Commits chicos por fix. Push después de validar con el dueño.

REPORTE FINAL: checklist con ✅/❌, fixes aplicados con commit hash, items que requieren acción manual del dueño.
```

---

## PROMPT 4 — Pendientes legacy baratos

```
Lee CONTEXTO_2026_04_07.md sección 7.6.

MISIÓN: Atacar pendientes mecánicos del ESTADO_APP.md viejo. NO features nuevas, solo cleanup.

ORDEN DE ATAQUE:

1. Migrar imports legacy a @/lib/icons y @/lib/links (~30 archivos, 30 min)
   - Buscar `from "lucide-react"` directo (no debería haber pero verificar):
     ```bash
     grep -rn 'from "lucide-react"' src/
     ```
   - Buscar URLs hardcoded ("/medical-records", "/profile", etc.) en navigate() o href:
     ```bash
     grep -rn 'navigate("/' src/ | grep -v 'navigate("/auth\|navigate("/upgrade'
     ```
   - Reemplazar por helpers de @/lib/links (LINKS.medicalRecords(), LINKS.profile(), etc.)
   - Mantener cambios atómicos: 1 commit por dominio (icons, links)

2. Optimizar imágenes pesadas (15 min)
   ```bash
   find public/ src/assets -name "*.png" -size +300k 2>/dev/null
   ```
   - Convertir a WebP con cwebp o https://squoosh.app
   - Reemplazar referencias en código

3. Sitemap dinámico (verificar si aplica)
   - generate-sitemap edge function ya está auditada y OK pero NO deployada
   - Deployarla:
     ```bash
     npx supabase functions deploy generate-sitemap --project-ref gwailbjlvevkhwcrovfd
     ```
   - Después agregar el endpoint al robots.txt si corresponde

NO TOCAR EN ESTA TANDA (requieren features grandes o decisiones de diseño):
- Push notifications nativas (FCM/OneSignal)
- Splash screen iOS/Android
- Google Calendar OAuth real
- Aplicar paleta verde médica completa
- Migrar más dialogs a ResponsiveModal

REGLAS DE ORO. Commits chicos por ítem. Push después de validar.

REPORTE FINAL: tabla con cada ítem, estado (✅ hecho / ⏭ skipped / ❌ bloqueado), motivo si bloqueado.
```

---

## PROMPT 5 — Audit copy chilena en TODA la app

```
Lee memory/feedback_chilean_spanish.md.

MISIÓN: Pasada mecánica por TODOS los archivos del repo corrigiendo voseo argentino → tuteo chileno. Esto es deuda heredada de versiones previas, no de la sesión 2026-04-08 (en esa solo se barrieron los archivos nuevos).

PATRONES A BUSCAR Y REEMPLAZAR (case-sensitive):

Conjugaciones (las más frecuentes):
- "vos tenés" → "tú tienes" o "tienes"
- "vos podés" → "tú puedes" o "puedes"
- "vos querés" → "tú quieres" o "quieres"
- "tenés" → "tienes"
- "podés" → "puedes"
- "querés" → "quieres"
- "sos" → "eres"
- "decime" → "dime"
- "fijate" → "fíjate"

Imperativos voseo:
- "cancelá" → "cancela"
- "ingresá" → "ingresa"
- "andá" → "anda" o "ve"
- "pegá" → "pega"
- "agregá" → "agrega"
- "sumá" → "suma"
- "mirá" → "mira"
- "llamá" → "llama"
- "dejá" → "deja"
- "probá" → "prueba"
- "creá" → "crea"
- "dale" (saludo/cierre rioplatense) → "ok" o "listo"

EJECUCIÓN:

1. Buscar primero TODOS los matches con grep para tener el universo:
   ```bash
   grep -rn 'tenés\|podés\|querés\|cancelás\|ingresá\|sumá\|cuidá\|agregá\|mirá\|probá\|creá' src/ supabase/ docs/ *.md
   ```

2. Por cada archivo con matches, leer el contexto y reemplazar UNO POR UNO. NO replace_all sin contexto, porque puede romper acentos en otras palabras.

3. Excluir intencionalmente:
   - node_modules/
   - docs/assets/ (bundles compilados)
   - Cualquier comentario de código en inglés
   - Nombres de funciones, variables, tipos

4. Después de cada batch, gates:
   - npx tsc -b
   - npm run build
   - Visual check de 2-3 pantallas afectadas

5. Commits por dominio:
   - chore(copy-cl): toasts y errores
   - chore(copy-cl): pages 1-15
   - chore(copy-cl): pages 16-30
   - chore(copy-cl): components
   - etc

REGLAS DE ORO. Push después de revisar visualmente al menos 3 pantallas.

REPORTE FINAL: cantidad de matches encontrados, archivos modificados, capturas textuales antes/después de los textos más visibles.
```

---

## PROMPT 6 — God component PetClinicalRecord.tsx

```
Lee src/pages/PetClinicalRecord.tsx (1444 líneas).

MISIÓN: Refactor de god component. Extraer las 5 funciones Tab a componentes separados sin cambiar comportamiento.

ESTRUCTURA OBJETIVO:
src/pages/PetClinicalRecord/
├── index.tsx                      ← orquestador, ~200 líneas
├── tabs/
│   ├── TabResumen.tsx
│   ├── TabHistorial.tsx
│   ├── TabAlimentacion.tsx
│   ├── TabDocumentos.tsx
│   └── TabCompartir.tsx
├── hooks/                         ← si hay lógica de fetch reusable
│   └── usePetClinicalData.ts
└── types.ts                       ← interfaces compartidas

REGLAS:
- Comportamiento idéntico (zero functional changes)
- NO renombrar nada visible al usuario
- Cada Tab queda como su propio componente con sus props tipadas
- El padre (index.tsx) solo orquesta state global + tabs nav
- Imports actualizados en App.tsx (la ruta sigue siendo la misma)

PROCESO:
1. Leer el archivo entero, mapear: state global, helpers, los 5 tabs, props que cada tab necesita
2. Crear la estructura de carpetas
3. Extraer 1 tab a la vez, cada uno con su commit:
   - chore(clinical): extract TabResumen
   - chore(clinical): extract TabHistorial
   - etc.
4. Después de cada extracción: tsc -b + build + click manual en la tab afectada
5. Al final: commit chore(clinical): drop original god component (solo si todo verde)

NO HACER:
- NO refactorizar lógica adentro de los tabs (eso es otra sesión)
- NO renombrar componentes visibles al usuario
- NO cambiar el routing
- NO tocar otras pages

REGLAS DE ORO. Push solo cuando los 5 tabs funcionen idénticos al original.

REPORTE FINAL: líneas antes/después de cada archivo, screenshots textuales de las 5 tabs verificadas.
```

---

## PROMPT 7 — Data sync end-to-end para MVP demo

```
MISIÓN: Asegurar que TODA la información médica, de mascotas y de usuarios esté
perfectamente sincronizada y consistente entre tablas, RLS, edge functions y UI.
Objetivo: que el MVP se pueda demostrar sin sorpresas (filas huérfanas, datos
que aparecen en una pantalla pero no en otra, joins rotos, etc.).

ALCANCE — entidades clave:
- profiles (auth.users ↔ public.profiles)
- pets (owner_id → profiles.id)
- pet_medical_records / medical_documents / vaccinations / medical_visits
- vet_bookings, service_reviews, training_reviews
- subscriptions ↔ profiles.is_premium / premium_end_date
- pet_activities, pet_activity_cheers
- provider_directory ↔ profiles (perfil vet)

CHECKLIST:

1. Auditar FKs e integridad referencial
   ```sql
   -- Filas huérfanas en cada tabla crítica
   select 'pets sin owner' as check, count(*) from public.pets p
     left join public.profiles pr on pr.id = p.owner_id where pr.id is null
   union all
   select 'medical_documents sin pet', count(*) from public.medical_documents md
     left join public.pets p on p.id = md.pet_id where p.id is null
   union all
   select 'vaccinations sin pet', count(*) from public.vaccinations v
     left join public.pets p on p.id = v.pet_id where p.id is null
   union all
   select 'subscriptions sin profile', count(*) from public.subscriptions s
     left join public.profiles pr on pr.id = s.user_id where pr.id is null
   union all
   select 'profiles is_premium=true sin sub activa', count(*) from public.profiles
     where is_premium = true and is_grandfathered = false and id not in (
       select user_id from public.subscriptions where status = 'active'
     );
   ```
   Para cada inconsistencia: proponer migración de cleanup + FK ON DELETE CASCADE
   donde corresponda.

2. Validar coherencia profiles ↔ subscriptions
   - Si profiles.is_premium = true → debe existir subscription con status='active'
     y end_date > now() (excepto grandfathered).
   - Si profiles.premium_end_date < now() → is_premium debe ser false.
   - Crear RPC sync_premium_status() que reconcilie y correrla una vez.

3. Validar que los joins de la UI no se rompan
   Por cada page que hace join multi-tabla, verificar que el embed de Supabase
   match con FKs reales:
   - PetClinicalRecord (pets + medical_records + vaccinations + documents)
   - DirectorioVets (provider_directory + profiles + service_reviews)
   - MyBookings (vet_bookings + provider_directory + pets)
   - Profile (profiles + subscriptions + pets)
   Listar las queries y verificar que la respuesta tenga todos los campos esperados.

4. RLS coverage check
   ```sql
   select schemaname, tablename, rowsecurity
     from pg_tables where schemaname = 'public' and rowsecurity = false;
   ```
   Cualquier tabla con datos de usuarios SIN RLS = fix urgente.

5. Datos seed para demo
   - Verificar que pawfriend.cl/demo tenga al menos:
     · 2 mascotas con ficha completa (vacunas + visitas + 1 documento)
     · 1 vet en el directorio público con 2+ reseñas
     · 1 user con Premium activo (para mostrar el badge dorado)
   - Si falta algo, crear migración seed `99999999000000_demo_data.sql`
     idempotente que se pueda re-correr.

6. Verificar tipos generados vs schema real
   ```bash
   npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > /tmp/types.ts
   diff /tmp/types.ts src/integrations/supabase/types.ts
   ```
   Si hay drift, regenerar y corregir errores TS resultantes.

7. Smoke test end-to-end (manual checklist en el reporte)
   - Crear user nuevo → ver Home vacío → Add Pet → ver pet en MyPets →
     abrir PetClinicalRecord → agregar vacuna → descargar PDF → ver datos
     traducidos al español → todo consistente.
   - User Premium → puede agregar 2da mascota → badge dorado en Profile.
   - Vet en directorio → reseñas visibles → click en vet abre PerfilVetPublico.

REGLAS:
- NO inventar datos: si una tabla no existe o un campo no está, reportarlo.
- NO romper RLS para "facilitar" la demo. La demo debe correr con las mismas
  policies que producción.
- Migraciones de cleanup van con prefijo `20260415000000_data_sync_*`.
- Cualquier query SQL que requiera correr en remoto: pegarla al usuario para
  que él la ejecute en el Dashboard SQL Editor.

ENTREGABLE:
- Reporte tipo audit con: tablas auditadas, inconsistencias encontradas,
  fixes aplicados (commit hash), fixes que requieren acción manual del dueño,
  smoke test pasado/fallido por flujo.
- Confianza nivel "puedo abrir mi laptop en una reunión y demostrar el MVP
  sin que me pase nada raro".
```

---

## PROMPT 8 — Seed de 100 usuarios demo (poblar la app para mostrar MVP)

```
MISIÓN: Crear un dataset realista de ~100 usuarios demo con mascotas, fichas
médicas, vacunas, documentos, reseñas y proveedores de servicios. El objetivo
es que cuando alguien abra la app o pawfriend.cl/demo vea la plataforma "viva",
con feed, directorio y mascotas pobladas — no pantallas vacías.

REGLAS GLOBALES:
- TODOS los usuarios demo terminan su nombre con " Demo" (ej: "Camila Soto Demo",
  "Dr. Felipe Aravena Demo"). Esto permite filtrarlos/borrarlos fácil después.
- Emails con dominio @demo.pawfriend.cl (ej: camila.soto@demo.pawfriend.cl).
- Marca cada profile con un campo `is_demo boolean` (crear si no existe) para
  poder excluirlos de métricas reales y borrarlos en bloque.
- Migración idempotente con prefijo `99999999000000_demo_seed.sql` para que se
  pueda re-correr sin duplicar (usar `on conflict do nothing` por email).
- Datos en español chileno (tuteo). Nombres y apellidos chilenos reales.
- NO inventar URLs externas; usar fotos de placeholder de
  https://images.unsplash.com o el bucket pet-photos del proyecto si ya tiene
  assets.

DATASET OBJETIVO:

1. 100 perfiles de usuarios dueños de mascotas
   - Distribución regional: 60 RM, 15 Valparaíso, 10 Biobío, 10 Araucanía,
     5 otras regiones.
   - 50% con 1 mascota, 35% con 2, 15% con 3+ (estos últimos sirven para
     mostrar el grandfathering / Premium).
   - 20% con `is_premium = true` (para que aparezca el badge dorado en
     varios perfiles).
   - 5 con `is_grandfathered = true` (early adopters).

2. ~180 mascotas
   - Mix realista: 65% perros, 25% gatos, 5% conejos, 3% aves, 2% reptiles.
   - Razas chilenas comunes (mestizo, labrador, golden, quiltro, persa, etc.).
   - Cada mascota con: nombre, especie, raza, fecha nacimiento, peso, color,
     género, foto, microchip (formato 15 dígitos), vaccination_status,
     activity_level, living_environment.
   - 30% con alergias (food/medication/environmental).
   - 20% con condiciones crónicas detalladas.
   - 15% con medicamentos actuales.

3. Fichas médicas pobladas
   - medical_records: 3-8 registros por mascota (consultas, vacunas, exámenes).
     Distribución: 40% vacuna, 30% consulta, 15% examen, 10% tratamiento,
     5% cirugía/emergencia.
   - medical_documents: 1-3 docs por mascota (carnet vacunas, lab, receta).
     Como no podemos subir archivos reales, usar `file_url` con ruta dummy
     y `mime_type='application/pdf'`. Documentar que son placeholders.
   - vaccinations: 4-6 vacunas estándar por especie (séxtuple, antirrábica,
     leptospirosis, etc.) con fechas distribuidas en los últimos 24 meses.
   - reminders: 1-2 recordatorios futuros por mascota.

4. ~15 proveedores de servicios (vets, peluqueros, paseadores, adiestradores)
   - Distribución: 8 veterinarias, 3 peluqueros caninos, 2 paseadores,
     2 adiestradores.
   - Cada uno con perfil en `provider_directory` (o tabla equivalente):
     nombre, especialidad, ciudad, dirección, teléfono, foto, descripción,
     `is_verified=true`, lat/lng aproximadas.
   - 5 vets con plan pago (`Individual`, `Clínica Básica`, `Clínica Pro`)
     para mostrar el modelo B2B en acción.
   - Cada proveedor con `is_demo=true`.

5. Reseñas y reputación
   - 3-10 service_reviews por proveedor (rating 3-5 estrellas, mayoría 4-5).
   - Comentarios cortos en español chileno realistas
     ("Súper amable, mi perro quedó regio 🐶", "Excelente atención, recomendado").
   - 2 training_reviews para los adiestradores.

6. Actividad social (pet_activities + cheers)
   - 50 pet_activities recientes (paseos, baños, vacunas) distribuidas en
     los últimos 14 días para que el feed se vea vivo.
   - 1-5 cheers por activity de otros users demo.

7. Reservas (vet_bookings)
   - 20 reservas: 10 pasadas (status='completed'), 5 hoy (status='confirmed'),
     5 futuras (status='pending'). Asociadas a mascotas y vets demo.

CHECKLIST DE TABLAS A POBLAR (verificar TODAS):
- [ ] auth.users (vía supabase admin createUser, NO insertar directo)
- [ ] profiles
- [ ] pets
- [ ] medical_records
- [ ] medical_documents
- [ ] vaccinations (si la tabla existe)
- [ ] reminders
- [ ] subscriptions (para los premium)
- [ ] provider_directory
- [ ] service_reviews
- [ ] training_reviews
- [ ] vet_bookings
- [ ] pet_activities
- [ ] pet_activity_cheers
- [ ] cualquier tabla que aparezca al inspeccionar el schema y que tenga
      datos visibles en la UI

DOBLE PROPÓSITO:
Mientras pueblas los datos vas a descubrir si FALTA alguna tabla, columna,
RLS policy, o si algún join de la UI no funciona con datos reales. Reportar
TODO eso. Cualquier inconsistencia detectada es input directo para el
Prompt 7 (data sync).

EJECUCIÓN:

1. Inspeccionar schema actual:
   ```sql
   select table_name from information_schema.tables
    where table_schema='public' order by table_name;
   ```
   Listar al usuario todas las tablas y confirmar que las del checklist existen.

2. Crear migración `supabase/migrations/99999999000000_demo_seed.sql`
   con `is_demo` en profiles + provider_directory si no existe.

3. Generar el seed en un script Node/Deno (no en SQL puro — más fácil para
   randomización):
   `scripts/seed-demo.ts` que:
   - Use `@supabase/supabase-js` con SERVICE_ROLE_KEY
   - Cree los 100 users vía `supabase.auth.admin.createUser`
   - Inserte profiles, pets, medical_records, etc. con datos generados
   - Sea idempotente: chequee `is_demo=true` y borre antes de re-poblar
     (modo `--reset` opcional)
   - El script lo corre el dueño localmente con:
     `npx tsx scripts/seed-demo.ts`
   - Pedir al dueño la SERVICE_ROLE_KEY, NUNCA pegarla en el repo, leerla
     de un .env local (.env.demo.local en .gitignore).

4. Verificación post-seed:
   - Login con un user demo (ej: camila.soto@demo.pawfriend.cl / Demo1234!)
     desde la app y navegar Home → MyPets → PetClinicalRecord → DirectorioVets.
   - Confirmar que TODO se ve sin pantallas vacías y sin errores en consola.
   - Verificar que el feed (pet_activities) muestra actividad reciente.
   - Verificar que el directorio de vets tiene marcadores en el mapa.

5. Documentar:
   - `DEMO_GUIDE.md` (raíz, ya existe): agregar sección "Cuentas demo" con 5
     credenciales tipo (free / premium / grandfathered / vet con clientes /
     vet recién registrado).
   - Cómo borrar todos los demos: query SQL
     `delete from auth.users where email like '%@demo.pawfriend.cl';`
     (cascada borra todo lo demás vía FKs).

REGLAS DE ORO heredadas. Commit único:
chore(seed): 100 users demo + mascotas + fichas + servicios.

ENTREGABLE:
- Migración con `is_demo`
- Script `scripts/seed-demo.ts`
- Sección nueva en DEMO_GUIDE.md con credenciales
- Reporte de tablas detectadas vs pobladas
- Lista de inconsistencias / FKs faltantes / RLS gaps encontrados durante el
  seed (input directo para Prompt 7)
```

---

## PROMPT 9 — Rediseño del 404 ("estamos trabajando en esto")

```
MISIÓN: Reemplazar la página 404 actual por una versión amigable, on-brand,
con tono "estamos trabajando para resolver esto" en vez de un error frío.
Aplica tanto a la SPA como al fallback de GitHub Pages.

CONTEXTO:
- La app es SPA en GitHub Pages servida desde docs/. GitHub Pages usa
  docs/404.html como fallback para rutas que no existen — además es lo que
  permite que el routing client-side funcione (típico hack SPA + GH Pages).
- Hoy hay un docs/404.html generado por Vite (que es el index.html básico)
  y un componente NotFound en src/pages/NotFound.tsx para rutas internas.
- Branding actual: tokens en src/index.css, paleta emerald/teal, look médico.
  Para Premium: dorado (--premium, --premium-gradient).
- Joya de la corona intocable: ficha médica + directorio público.

OBJETIVO DE COPY (español chileno, tuteo):
- Título grande: "🐾 Estamos trabajando en esto"
- Subtítulo: "La página que buscas no existe o aún está en construcción.
  Volvemos a ponerla en línea apenas podamos."
- 3 acciones claras: "Volver al inicio", "Ir a mis mascotas", "Reportar el
  problema" (link mailto o WhatsApp).
- Tono cálido, no técnico. Cero "404 Not Found" / "Page not found".

ALCANCE:

1. src/pages/NotFound.tsx (SPA route)
   - Rediseñar con Card centrada, ilustración de pata o emoji 🐾, botones
     usando los componentes ya existentes (Button de shadcn).
   - Detectar pathname con useLocation y mostrarlo discreto:
     "Buscaste: /ruta-que-no-existe"
   - CTA principal: navigate("/") con look emerald.
   - CTAs secundarios: link a /home, /my-pets, mailto a hola@pawfriend.cl
     (o el contacto real si existe en el repo, buscar antes con grep).
   - Mobile-first, mismo container max-w-md o max-w-lg.

2. public/404.html (fallback GitHub Pages)
   - HTML estático standalone (NO React) porque GH Pages lo sirve antes
     de cargar el bundle. Incluir <meta http-equiv="refresh"> a "/" después
     de 5 segundos como red de seguridad — pero ANTES mostrar la misma copy
     con CSS inline (no Tailwind, no fuentes externas para que cargue
     instantáneo).
   - Mantener el script de redirect SPA si existe (típico hack
     `sessionStorage.redirect = location.href`) — verificar primero si está
     y NO romperlo.
   - Vite copia public/* tal cual a docs/, así que con tocar public/404.html
     basta. Después de `npm run build` debe quedar en docs/404.html.

3. Verificación:
   - npx tsc -b limpio
   - npm run build genera docs/404.html con el contenido nuevo
   - Visual check local: vite dev → ir a /no-existe → ver el rediseño SPA
   - Visual check GH Pages: después de pushear, ir a
     pawfriend.cl/url-inventada → ver el 404 estático

4. NO TOCAR:
   - Routing principal (App.tsx)
   - El componente NotFound de cualquier subapp si existe
   - El hack SPA→GH Pages de redirect si lo hay (verificar con grep
     "sessionStorage" en public/404.html actual)

REGLAS DE ORO heredadas. Commit único:
fix(404): pagina amigable "estamos trabajando en esto"

ENTREGABLE:
- src/pages/NotFound.tsx rediseñado
- public/404.html estático on-brand
- Captura textual de la copy final para revisión
```

---

## PROMPT 10 — Migrar de legacy API keys de Supabase al nuevo sistema

```
CONTEXTO:
Supabase está deprecando las "legacy API keys" (JWTs viejos tipo eyJ... con role
anon / service_role) en favor del nuevo sistema:
  - sb_publishable_* (reemplaza anon, va en el frontend)
  - sb_secret_* (reemplaza service_role, va en secrets de edge functions)

Hoy la app sigue usando legacy keys. Cuando Supabase las deshabilita, login
falla con "Legacy API keys are disabled". El dueño tuvo que re-habilitarlas
manualmente como workaround.

MISIÓN: Migrar todo el proyecto al sistema nuevo y dejar las legacy desactivadas
permanentemente.

CHECKLIST:

1. Identificar dónde se usa la anon key vieja
   ```bash
   grep -rn "eyJ" src/integrations/supabase/
   ```
   Debería estar hardcoded en src/integrations/supabase/client.ts.

2. Pedir al dueño que genere las keys nuevas en el Dashboard:
   - Settings → API → "Project API keys"
   - Habilitar el sistema nuevo si no está
   - Copiar la sb_publishable_* (es pública, OK que vaya al repo)
   - Generar sb_secret_* (NUNCA pegarla en chat)

3. Reemplazar la anon hardcoded por la sb_publishable_*
   - Editar src/integrations/supabase/client.ts
   - Verificar que el cliente acepta el formato nuevo
     (puede requerir bumpear @supabase/supabase-js a la última versión)

4. Actualizar secrets de las edge functions
   - Pedirle al dueño que corra:
     npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<sb_secret_*> \
       --project-ref gwailbjlvevkhwcrovfd
   - Verificar que TODAS las functions que usan service_role siguen
     funcionando: probar 1 médica, 1 de IA, 1 de Flow.

5. Smoke test end-to-end
   - Login con cuenta nueva
   - Crear mascota
   - Generar PDF ficha clínica
   - Iniciar pago Premium (sandbox de Flow)
   - Verificar logs sin errores

6. Deshabilitar legacy keys en el Dashboard
   - Settings → API → toggle "Enable legacy API keys" → OFF
   - Esperar 5 min y re-probar login

7. Documentar
   - Actualizar ROTAR_API_KEYS.md con el nuevo procedimiento
   - Agregar memoria persistente si corresponde
   - Bumpear versión en README si hay

REGLAS DE ORO. Commit:
chore(auth): migrar de legacy supabase keys al nuevo sistema sb_*

ENTREGABLE:
- src/integrations/supabase/client.ts con sb_publishable_*
- Confirmación de que las edge functions siguen verdes
- Legacy keys deshabilitadas en producción
- ROTAR_API_KEYS.md actualizado
```

---

## Notas operativas

- **Memoria persistente** en `~/.claude/projects/.../memory/`. Decisiones clave persisten entre sesiones (Flow, secrets, español chileno).
- **Migration tracker**: aplicar SQL vía Dashboard SQL Editor (push automático falla en este proyecto), después marcar en `supabase_migrations.schema_migrations`.
- **Flow keys**: rotadas en sesiones 2026-04-07 y 2026-04-08. Las nuevas DEBEN ir como secrets de Supabase, NUNCA en repo. NUNCA pegar en chat el output de `supabase secrets list` (trae los valores).

## Antes de mandar cualquier prompt — checklist del dueño

- [ ] El repo está limpio (`git status` sin cambios)
- [ ] Última versión pulleada (`git pull origin main`)
- [ ] Sé qué archivos NO quiero que toque (lista en cada prompt)
- [ ] Sé cómo voy a probar el resultado antes de pushear
