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

## Notas operativas

- **Memoria persistente** en `~/.claude/projects/.../memory/`. Decisiones clave persisten entre sesiones (Flow, secrets, español chileno).
- **Migration tracker**: aplicar SQL vía Dashboard SQL Editor (push automático falla en este proyecto), después marcar en `supabase_migrations.schema_migrations`.
- **Flow keys**: rotadas en sesiones 2026-04-07 y 2026-04-08. Las nuevas DEBEN ir como secrets de Supabase, NUNCA en repo. NUNCA pegar en chat el output de `supabase secrets list` (trae los valores).

## Antes de mandar cualquier prompt — checklist del dueño

- [ ] El repo está limpio (`git status` sin cambios)
- [ ] Última versión pulleada (`git pull origin main`)
- [ ] Sé qué archivos NO quiero que toque (lista en cada prompt)
- [ ] Sé cómo voy a probar el resultado antes de pushear
