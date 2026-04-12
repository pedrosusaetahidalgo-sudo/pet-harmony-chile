# Feature — Upgrade calidad de ficha clínica PDF

> **Tipo:** Feature / UX polish sobre joya de la corona
> **Prioridad:** 🟠 Media-alta (toca joya de la corona → solo fixes quirúrgicos, sin refactor mayor)
> **Archivo principal:** [supabase/functions/generate-medical-summary/index.ts](../../supabase/functions/generate-medical-summary/index.ts)
> **Estado:** Pendiente — no iniciado
> **Creado:** 2026-04-11

---

## 1. Objetivo

Elevar la ficha clínica PDF descargable a un documento **formal, tipográficamente consistente y visualmente alineado con la identidad de Paw Friend**, con tres ejes:

1. **Normalización tipográfica condicional** — que el texto ingresado por el usuario se renderice siempre con capitalización correcta (primera letra mayúscula, resto minúscula, mayúscula después de cada punto), sin importar cómo lo escribió.
2. **Integración de assets de marca** — reemplazar el emoji 🐾 del header por el wordmark real ([public/paw_friend_wordmark_horizontal.svg](../../public/paw_friend_wordmark_horizontal.svg)) y usar el icono principal como watermark / marca de agua.
3. **Calidad documental formal** — layout limpio, word-wrap real (no truncado con "..."), soporte de tildes/ñ, código de verificación, aviso de confidencialidad, y respeto de normas de registro clínico veterinario.

No-goals: **no** rehacer la edge function desde cero, **no** migrar a otra librería PDF, **no** cambiar el flujo de invocación desde [src/components/medical/MedicalSummaryButton.tsx](../../src/components/medical/MedicalSummaryButton.tsx), **no** tocar el schema de `medical_records`.

---

## 2. Estado actual (problemas detectados)

Archivo: [supabase/functions/generate-medical-summary/index.ts](../../supabase/functions/generate-medical-summary/index.ts)

| # | Problema | Línea | Impacto |
|---|---|---|---|
| 1 | Emoji 🐾 con `StandardFonts.Helvetica` — **pdf-lib standard fonts no soportan emoji** y pueden crashear con `WinAnsi cannot encode` | [index.ts:162](../../supabase/functions/generate-medical-summary/index.ts#L162) | Riesgo de fallo silencioso o tofu en el header |
| 2 | Texto del usuario renderizado tal cual (`pet.name`, `v.title`, `v.reason`, `v.diagnosis`, `pet.chronic_conditions`, `pet.allergies`) sin normalización | [index.ts:183,223,240,247,201,204](../../supabase/functions/generate-medical-summary/index.ts#L183) | Un usuario escribe "VACUNA ANTIRRABICA" y otro "vacuna antirrabica" → el PDF queda inconsistente |
| 3 | Truncado con `slice(-4) + "..."` en vez de word-wrap real | [index.ts:108](../../supabase/functions/generate-medical-summary/index.ts#L108) | Diagnósticos largos se cortan a mitad de palabra, se pierde información clínica |
| 4 | Sin manejo de caracteres fuera de WinAnsi (tildes raras, ñ, em-dash `—`) al usar Helvetica estándar | [index.ts:88-89](../../supabase/functions/generate-medical-summary/index.ts#L88) | `drawText` puede lanzar excepción si el usuario pega un carácter Unicode poco común |
| 5 | Sin logo real — solo emoji + texto | [index.ts:162](../../supabase/functions/generate-medical-summary/index.ts#L162) | PDF no tiene identidad visual de marca |
| 6 | Sin QR de verificación del documento | — | No hay trazabilidad ni posibilidad de que un vet verifique autenticidad |
| 7 | Sin aviso de confidencialidad ni disclaimers | — | No cumple estándares formales de registro clínico |
| 8 | `field()` pone label y valor en la misma línea `y` sin bajarla entre ellos → colapso visual si el valor es largo | [index.ts:145-150](../../supabase/functions/generate-medical-summary/index.ts#L145) | Layout desalineado en casos con descripción larga |
| 9 | `calcAge` usa `Date.now()` — está bien para hoy, pero el PDF no incluye fecha de nacimiento formateada consistente con el resto | [index.ts:173-181](../../supabase/functions/generate-medical-summary/index.ts#L173) | Menor — cosmético |
| 10 | Footer duplicado: loop al final itera todas las páginas pero no incluye el código de verificación único | [index.ts:266-279](../../supabase/functions/generate-medical-summary/index.ts#L266) | Menor — falta verificabilidad |

---

## 3. Reglas de normalización tipográfica

### 3.1. Helper `smartSentenceCase(text: string): string`

**Ubicación propuesta:** nuevo bloque de helpers dentro de [supabase/functions/generate-medical-summary/index.ts](../../supabase/functions/generate-medical-summary/index.ts), antes del `serve(...)`. Idealmente extraer a `supabase/functions/_shared/textCase.ts` si hay otras edge functions que lo necesiten más adelante (no crear ahora si no se reutiliza).

**Contrato:**

```ts
/**
 * Normaliza texto libre del usuario para renderizado formal en PDF.
 *
 * Reglas:
 *  1. Trim y colapso de espacios múltiples → un único espacio.
 *  2. Todo a minúscula.
 *  3. Primera letra de la cadena → mayúscula.
 *  4. Primera letra después de ". ", "! ", "? " → mayúscula.
 *  5. Primera letra después de newline → mayúscula.
 *  6. Respeta excepciones: siglas conocidas (DNI, RUT, PCR, ECG, IV, SC, IM),
 *     nombres propios de fármacos en mayúsculas si vienen así, y tokens
 *     con dígitos (p.ej. "5mg", "2ml").
 *  7. Siempre preserva tildes y ñ.
 *  8. Si recibe null/undefined/"" → devuelve "".
 */
function smartSentenceCase(raw: string | null | undefined): string
```

**Pseudo-implementación (para guiar al ejecutor, no pegar literal):**

```ts
const ACRONYMS = new Set(["DNI","RUT","PCR","ECG","EKG","IV","SC","IM","VO","PRN","BID","TID","QID","SOS","ML","MG","KG","CM","MM"]);

function smartSentenceCase(raw) {
  if (!raw) return "";
  // 1. normalize whitespace
  let s = String(raw).replace(/\s+/g, " ").trim();
  if (!s) return "";

  // 2. lowercase everything preservando tildes (Intl-safe)
  s = s.toLocaleLowerCase("es-CL");

  // 3. capitalizar inicio y después de . ! ? \n
  s = s.replace(/(^|[.!?]\s+|\n\s*)([a-záéíóúñ])/g, (_m, sep, ch) => sep + ch.toLocaleUpperCase("es-CL"));

  // 4. restaurar acrónimos
  s = s.split(/(\s+|[.,;:])/).map((tok) => {
    const upper = tok.toUpperCase();
    if (ACRONYMS.has(upper)) return upper;
    // tokens con dígitos: preservar tal cual (5mg, 2ml, 1.5kg)
    if (/\d/.test(tok)) return tok;
    return tok;
  }).join("");

  return s;
}
```

### 3.2. Dónde aplicar el helper (mapeo campo → regla)

| Campo | Normalizar con `smartSentenceCase` | Motivo |
|---|---|---|
| `pet.name` | ❌ No — **solo capitalizar primera letra** con helper `properNoun()` distinto | Es nombre propio, no frase |
| `pet.species`, `pet.breed`, `pet.gender` | ✅ Sí | Texto libre del usuario |
| `owner.display_name` | ❌ Usar `titleCase()` helper aparte (cada palabra con inicial mayúscula) | Nombre propio multi-palabra |
| `owner.email` | ❌ Nunca transformar — email es case-insensitive pero se renderiza tal cual | Semántica |
| `pet.microchip_number` | ❌ Nunca transformar | Identificador técnico |
| `pet.chronic_conditions[]` | ✅ Sí, cada item | Texto libre |
| `pet.allergies[]` | ✅ Sí, cada item | Texto libre |
| `pet.current_medications[].name` | ❌ `titleCase()` — preservar nombres de fármacos | Nombres propios |
| `pet.current_medications[].dose` | ❌ Preservar tal cual | Contiene dígitos y unidades |
| `v.title` (vacuna) | ✅ Sí | Texto libre |
| `v.reason` (consulta) | ✅ Sí | Texto libre |
| `v.diagnosis` | ✅ Sí | Texto libre, puede tener varias oraciones → regla de mayúscula post-punto es crítica |
| `v.clinic_name` | ❌ `titleCase()` | Nombre propio |
| `d.title` (desparasitación) | ✅ Sí | Texto libre |
| `d.description` | ✅ Sí | Texto libre |

### 3.3. Helpers auxiliares a crear

```ts
function titleCase(raw: string | null | undefined): string
/** "juan PÉREZ" → "Juan Pérez". Respeta preposiciones "de", "del", "la", "y". */

function properNoun(raw: string | null | undefined): string
/** Como titleCase pero para single-word: "FIRULAIS" → "Firulais". */
```

### 3.4. Tests de normalización (smoke tests)

Documentar como comentario en el archivo con ejemplos reales:

```
smartSentenceCase("PERRO CON DIARREA. NECESITA ANTIBIÓTICO.")
  → "Perro con diarrea. Necesita antibiótico."

smartSentenceCase("se administró 5mg de metronidazol IV. paciente responde bien")
  → "Se administró 5mg de metronidazol IV. Paciente responde bien"

smartSentenceCase("")
  → ""

titleCase("maría josé de la fuente")
  → "María José de la Fuente"

properNoun("FIRULAIS")
  → "Firulais"
```

---

## 4. Assets de marca a integrar

Los archivos ya existen en [public/](../../public/):

| Asset | Ruta | Uso en PDF |
|---|---|---|
| Wordmark horizontal | [public/paw_friend_wordmark_horizontal.svg](../../public/paw_friend_wordmark_horizontal.svg) | Header top-left, reemplaza el emoji 🐾 + texto "Paw Friend" |
| Icono principal | [public/paw_friend_icon_principal.svg](../../public/paw_friend_icon_principal.svg) | Watermark sutil al 5% opacidad en el centro de cada página |
| Icono cuadrado PNG 512 | [public/pwa-icon-512.png](../../public/pwa-icon-512.png) | Fallback si pdf-lib no puede rasterizar SVG — **preferir este** porque pdf-lib no renderiza SVG nativo |

### 4.1. Cómo embeber imágenes en pdf-lib

`pdf-lib` **no renderiza SVG**. Las opciones son:

- **Opción A (recomendada):** usar directamente los PNG ya existentes ([public/pwa-icon-512.png](../../public/pwa-icon-512.png)). Como la edge function corre en Deno, fetcharlo desde `https://pawfriend.cl/pwa-icon-512.png` al inicio de cada invocación y cachearlo en memoria del módulo (top-level `let logoBytes: Uint8Array | null = null`).
- **Opción B:** embeberlo como base64 en el archivo de la edge function. Pro: 0 latencia de red. Contra: aumenta tamaño del bundle de la function y acopla asset a código.
- **Opción C:** subirlo una sola vez a un bucket público de Supabase Storage y fetcharlo desde ahí. No aporta frente a Opción A.

**Decisión:** ir con **Opción A** + cache top-level en la edge function. Si falla el fetch, hacer fallback a texto "Paw Friend" sin emoji (nunca emoji).

### 4.2. Snippet de referencia

```ts
let cachedLogoBytes: Uint8Array | null = null;

async function getLogoBytes(): Promise<Uint8Array | null> {
  if (cachedLogoBytes) return cachedLogoBytes;
  try {
    const res = await fetch("https://pawfriend.cl/pwa-icon-512.png");
    if (!res.ok) return null;
    cachedLogoBytes = new Uint8Array(await res.arrayBuffer());
    return cachedLogoBytes;
  } catch {
    return null;
  }
}

// dentro del handler, después de pdfDoc = await PDFDocument.create():
const logoBytes = await getLogoBytes();
const logoImage = logoBytes ? await pdfDoc.embedPng(logoBytes) : null;
```

---

## 5. Diseño formal del PDF (propuesta)

### 5.1. Estructura de página

```
┌─────────────────────────────────────────────────┐
│ [LOGO 40px]  Paw Friend                         │  ← header alto
│              Ficha Clínica Veterinaria          │
│              Emitida el 11 de abril de 2026     │
│ ─────────────────────────────────────────────── │
│                                                 │
│  1. IDENTIFICACIÓN DE LA MASCOTA               │
│     Nombre:        Firulais                     │
│     Especie/Raza:  Perro — Labrador             │
│     ...                                         │
│                                                 │
│  2. RESPONSABLE                                 │
│     ...                                         │
│                                                 │
│  3. ESTADO CLÍNICO ACTUAL                       │
│     ...                                         │
│                                                 │
│  4. VACUNAS (N)                                 │
│     ...                                         │
│                                                 │
│  5. CONSULTAS VETERINARIAS (N)                  │
│     ...                                         │
│                                                 │
│  6. DESPARASITACIONES (N)                       │
│     ...                                         │
│                                                 │
│ ─────────────────────────────────────────────── │
│ Código: PF-A1B2-C3D4   [QR]                     │  ← footer con
│ Documento confidencial · pawfriend.cl · pág 1/3 │     verificación
└─────────────────────────────────────────────────┘
```

### 5.2. Tipografía

- **Fuente:** mantener Helvetica (StandardFonts) por compatibilidad pdf-lib. **No** cambiar a fuente custom — agrega peso al bundle y complicaciones con embedding.
- **Tamaños:** H1 = 18pt bold, H2 sección = 11pt bold con numeral, label = 9pt bold gris, valor = 9pt regular.
- **Interlineado:** 1.35 × size mínimo.
- **Color primario:** mantener `PURPLE = rgb(0.416, 0.227, 0.718)` ([index.ts:16](../../supabase/functions/generate-medical-summary/index.ts#L16)).
- **Background de sección:** mantener el actual `rgb(0.95, 0.93, 1)` ([index.ts:139](../../supabase/functions/generate-medical-summary/index.ts#L139)), aumentar altura a 24pt para respirar.

### 5.3. Sanitización de caracteres

Helvetica estándar usa encoding **WinAnsi**, que cubre latín extendido básico (tildes, ñ, €, ¿, ¡) pero **no** cubre em-dash `—` ni comillas curly `"` `"` `'` `'`. Antes de cada `drawText` pasar por un sanitizador:

```ts
function sanitizeForWinAnsi(s: string): string {
  return s
    .replace(/—/g, "–")   // em-dash → en-dash (WinAnsi sí lo tiene)
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, "...")
    .replace(/\u00A0/g, " "); // nbsp → espacio normal
}
```

Aplicar **después** de `smartSentenceCase`, justo antes de `page.drawText`.

### 5.4. Word-wrap real (no truncado)

Reemplazar la función `text()` actual ([index.ts:101-118](../../supabase/functions/generate-medical-summary/index.ts#L101)) por una que envuelva en múltiples líneas:

```ts
function drawWrappedText(
  content: string,
  opts: {
    x: number;
    maxWidth: number;
    size: number;
    font: PDFFont;
    color?: RGB;
    lineHeight?: number;
  }
): void {
  const words = content.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (opts.font.widthOfTextAtSize(test, opts.size) <= opts.maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  const lh = opts.lineHeight || opts.size * 1.35;
  for (const ln of lines) {
    ensureSpace(lh);
    page.drawText(ln, { x: opts.x, y, size: opts.size, font: opts.font, color: opts.color || BLACK });
    y -= lh;
  }
}
```

Mantener la función `text()` legacy para títulos single-line, pero usar `drawWrappedText` para `diagnosis`, `description`, `reason`, y `chronic_conditions` largas.

### 5.5. Código de verificación + QR

- Generar un código corto determinístico: `PF-${hash(pet_id + generated_at).slice(0,4)}-${hash(...).slice(4,8)}` usando SubtleCrypto (disponible en Deno).
- Incluirlo en el footer de **todas** las páginas.
- Opcional fase 2: generar QR apuntando a `https://pawfriend.cl/verify/{codigo}` (requiere ruta nueva — **fuera de scope de este MD**, dejar como nota para follow-up).

### 5.6. Aviso de confidencialidad

Texto fijo al final del documento (antes del loop de footers):

> "Este documento contiene información clínica sensible de la mascota identificada arriba. Fue generado automáticamente por Paw Friend a partir de los datos ingresados por la persona responsable y/o su veterinario. No reemplaza un informe clínico profesional ni tiene valor legal por sí solo. Para consultas o verificación, contactar a pawfriend.cl."

Renderizar en 7pt, color GRAY, con word-wrap.

---

## 6. Checklist de implementación

### Fase 1 — Helpers de texto (sin tocar layout)

- [ ] Agregar `smartSentenceCase`, `titleCase`, `properNoun`, `sanitizeForWinAnsi` en [supabase/functions/generate-medical-summary/index.ts](../../supabase/functions/generate-medical-summary/index.ts) antes de `serve(...)`.
- [ ] Documentar cada helper con el contrato del §3.
- [ ] Agregar comentarios con los smoke tests del §3.4.
- [ ] Aplicar los helpers en **todos** los puntos de render de texto del usuario según tabla §3.2.
- [ ] Verificar que emails, microchips y dosis **no** se transforman.
- [ ] Reemplazar `drawText` directo por paso previo a través de `sanitizeForWinAnsi`.

### Fase 2 — Assets de marca

- [ ] Agregar cache top-level `cachedLogoBytes` + función `getLogoBytes()` (§4.2).
- [ ] Fetchear [public/pwa-icon-512.png](../../public/pwa-icon-512.png) desde `https://pawfriend.cl/pwa-icon-512.png`.
- [ ] Embeber con `pdfDoc.embedPng(logoBytes)`.
- [ ] En el header, dibujar logo a 40×40pt en la esquina superior izquierda.
- [ ] Eliminar el emoji 🐾 en [index.ts:162](../../supabase/functions/generate-medical-summary/index.ts#L162).
- [ ] Fallback: si `logoBytes === null`, renderizar solo texto "Paw Friend" en 22pt bold PURPLE — nunca emoji.

### Fase 3 — Layout formal

- [ ] Implementar `drawWrappedText` (§5.4) y usarlo para `diagnosis`, `description`, `reason`, y `chronic_conditions`.
- [ ] Numerar secciones: `1. Identificación de la mascota`, `2. Responsable`, `3. Estado clínico actual`, `4. Vacunas`, `5. Consultas veterinarias`, `6. Desparasitaciones`.
- [ ] Aumentar altura del rect de sección de 20 a 24pt.
- [ ] Bajar `y` entre label y valor si el valor wrapped ocupa más de 1 línea (fix del problema #8).
- [ ] Reemplazar el `formatDate` para que use un formato consistente `"11 de abril de 2026"` (ya lo hace para el header — homologar al resto).

### Fase 4 — Confidencialidad + verificación

- [ ] Agregar bloque de confidencialidad al final (§5.6).
- [ ] Generar código de verificación `PF-XXXX-XXXX` con SHA-256 de `pet_id + timestamp`, truncado.
- [ ] Incluir código en el footer de cada página dentro del loop [index.ts:266-279](../../supabase/functions/generate-medical-summary/index.ts#L266).
- [ ] Mover el texto `"Generado por Paw Friend · pawfriend.cl"` a una sola línea centrada con el código.

### Fase 5 — Smoke test manual

- [ ] Crear mascota demo con campos en MAYÚSCULAS, minúsculas, y Mezcladas.
- [ ] Agregar diagnóstico de varios renglones con punto y mayúscula en el medio ("perro con vómitos. se indicó dieta blanda.").
- [ ] Generar PDF desde [/medical-records](../../src/pages/MedicalRecords.tsx) o desde la página de mascota.
- [ ] Verificar visualmente:
  - [ ] Logo aparece (no emoji, no tofu).
  - [ ] Nombres propios en Title Case.
  - [ ] Diagnósticos normalizados.
  - [ ] Email sin transformar.
  - [ ] Microchip sin transformar.
  - [ ] Tildes y ñ se renderizan OK.
  - [ ] Diagnóstico largo hace wrap (no se corta con "...").
  - [ ] Footer con código `PF-XXXX-XXXX` + paginación + confidencialidad.
  - [ ] Documento de 2+ páginas mantiene footer y header consistentes.
- [ ] Probar desde Capacitor Android (download via `downloadFile` en [src/lib/nativeDownload.ts](../../src/lib/nativeDownload.ts)).

---

## 7. Criterios de aceptación

1. **Normalización funcional:** un usuario que escribió `"VACUNA ANTIRRABICA ANUAL. proximo control en septiembre"` ve en el PDF `"Vacuna antirrabica anual. Próximo control en septiembre"` (con tilde si venía, o sin si no — no intentar corregir ortografía).
2. **Emails/identificadores intactos:** `pepe@PawFriend.CL` se renderiza tal cual `pepe@PawFriend.CL`; microchip `982000123456789` se renderiza tal cual.
3. **Marca visual presente:** el header contiene el logo PNG de Paw Friend, no el emoji 🐾.
4. **Tildes/ñ OK:** el texto "Año", "Vacuñación", "Diagnóstico" se renderiza sin crashes.
5. **Word-wrap real:** diagnósticos de 200+ caracteres ocupan múltiples líneas, no se truncan con `"..."`.
6. **Footer con verificación:** todas las páginas tienen `PF-XXXX-XXXX · Documento confidencial · pawfriend.cl · pág X de Y`.
7. **Sin regresión funcional:** el PDF se genera, se sube a storage, se obtiene signed URL, y se descarga — el contrato con [src/components/medical/MedicalSummaryButton.tsx](../../src/components/medical/MedicalSummaryButton.tsx) no cambia.
8. **Sin cambio de schema:** cero migraciones nuevas en [supabase/migrations/](../../supabase/migrations/).
9. **Sin nuevas dependencias:** no agregar librerías — seguir con `pdf-lib@1.17.1` y los helpers de Deno/SubtleCrypto.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `pdfDoc.embedPng` falla si el fetch del logo timeout | Try/catch + fallback a texto, ya descrito en §4.2 |
| El helper `smartSentenceCase` "corrige" nombres propios por error (p.ej. "GATOS ANTONIO PÉREZ CLÍNICA" → frase) | La tabla §3.2 separa texto-libre de nombres-propios; aplicar el helper correcto por campo |
| Caracteres Unicode exóticos (emoji en descripción del user) rompen WinAnsi | `sanitizeForWinAnsi` los reemplaza o elimina antes de `drawText`. Alternativa: envolver todo `drawText` en try/catch y logger.warn |
| Usuario escribe frase con acrónimos médicos (IV, SC, BID) y el lowercase los arruina | Set `ACRONYMS` en `smartSentenceCase` los preserva |
| Joya de la corona — cualquier refactor mal hecho rompe el flujo principal | Hacer los cambios **aditivos**: primero helpers (sin aplicarlos), después aplicación campo por campo, después layout. Nunca todo en un solo commit |

---

## 9. Fuera de alcance (para follow-ups)

- **QR de verificación físico** apuntando a `/verify/{codigo}` — requiere ruta pública nueva y tabla `medical_summary_verifications`. Crear MD separado si hay demanda.
- **Custom font con cobertura Unicode completa** (Inter, Source Sans) — agrega ~200KB al bundle de la edge function, no vale la pena hasta que falle WinAnsi en producción real.
- **Firma digital electrónica** (PAdES) — requiere HSM o servicio externo, está fuera del alcance de la edge function actual.
- **Multi-idioma** (EN/PT para futuro) — el helper debería funcionar igual con `toLocaleLowerCase("en")`, pero parametrizar cuando llegue el requirement.
- **Extraer helpers a `supabase/functions/_shared/textCase.ts`** — hacerlo solo si una segunda edge function los necesita (evitar shared prematura).

---

## 10. Dependencias con otros MDs de `_pending/`

- **[MASTER_UPGRADE_2026_04.md](../MASTER_UPGRADE_2026_04.md)** — si hay una fase "polish ficha clínica", este MD va ahí adentro. Revisar antes de ejecutar para no duplicar.
- **[features/FEATURE_AI_WEB_SEARCH_UPGRADE.md](FEATURE_AI_WEB_SEARCH_UPGRADE.md)** — si la IA va a generar sugerencias que se guardan como `diagnosis` o `description`, la normalización de este MD las beneficia pero no depende.
- **No bloquea** ni es bloqueado por ningún otro item del índice.

---

## 11. Actualización de [_pending/README.md](../README.md)

Al finalizar la implementación:

1. Agregar fila en el índice de pendientes (`§ Índice de pendientes`):
   ```
   | 11 | [features/FEATURE_MEDICAL_PDF_UPGRADE.md](features/FEATURE_MEDICAL_PDF_UPGRADE.md) | Feature / UX polish | 🟠 Media-alta | Pendiente — upgrade de ficha clínica PDF (normalización texto, logo real, word-wrap, confidencialidad) | — |
   ```
2. Al completar **todas** las fases del checklist §6, mover este MD a [junk/](../../junk/) con commit `chore: archivar FEATURE_MEDICAL_PDF_UPGRADE.md (ejecutado)`.
3. Si se ejecuta parcialmente, actualizar el campo "Estado" del encabezado con qué fase quedó cerrada y en qué commit.

---

## 12. Commit plan sugerido

```
1. feat(pdf): helpers smartSentenceCase/titleCase/properNoun + sanitizeForWinAnsi
2. feat(pdf): aplicar normalización a campos de texto libre en ficha clínica
3. feat(pdf): embeber logo Paw Friend en header, eliminar emoji
4. feat(pdf): word-wrap real para diagnóstico/descripción/condiciones
5. feat(pdf): código de verificación PF-XXXX-XXXX + aviso de confidencialidad
6. docs(pending): archivar FEATURE_MEDICAL_PDF_UPGRADE.md tras verificación
```

Cada commit debe pasar `npx tsc -b` y `npm run build` sin errores nuevos. **No hacer `npm run build` que toca [docs/](../../docs/) hasta el commit final**; los cambios de edge function no requieren rebuild del frontend.
