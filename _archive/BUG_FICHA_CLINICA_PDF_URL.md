# Bug: Botón PDF invisible en ficha clínica + URL en inglés

> **Prioridad:** 🔴 Alta — afecta la joya de la corona (CLAUDE.md §9.6)
> **Reportado:** 2026-04-11 por Pedro (usuario real, producción)
> **Estado:** ✅ EJECUTADO 2026-04-13 — Fix A + Fix B aplicados, MedicalRecords unificado como redirect
> **Ruta afectada:** `/pet/:petId/clinical` → [src/pages/PetClinicalRecord/index.tsx](../../src/pages/PetClinicalRecord/index.tsx)

---

## 0. TL;DR

Dos problemas en la página de ficha clínica (`/pet/:petId/clinical`):

1. **El botón PDF es casi invisible**: solo hay un `Button size="sm" variant="outline"` en la esquina superior derecha del `PageHeader`, que en mobile ni siquiera muestra texto (solo un ícono de 16px). El CTA prominente con gradiente (`MedicalSummaryButton`) que existe en `MedicalDocumentsTab.tsx` **nunca se renderiza en esta página** — solo se usa en la ruta `/medical-records`.

2. **La URL está en inglés**: `/pet/{uuid}/clinical` mezcla slugs en inglés (`pet`, `clinical`) con una app 100% en español chileno. Se espera algo como `/mascota/{id}/ficha-clinica`.

---

## 1. Diagnóstico detallado

### 1.1. Botón PDF perdido

**Archivos involucrados:**

| Archivo | Qué tiene | Problema |
|---|---|---|
| [PetClinicalRecord/index.tsx:132-144](../../src/pages/PetClinicalRecord/index.tsx#L132) | `PageHeader` con botón PDF `size="sm"` `variant="outline"` | Botón diminuto, texto oculto en mobile (`hidden sm:inline`), solo ícono `Download 16px` |
| [PetClinicalRecord/tabs/TabDocumentos.tsx](../../src/pages/PetClinicalRecord/tabs/TabDocumentos.tsx) | Lista de documentos subidos | **NO tiene `MedicalSummaryButton`** — solo muestra archivos del storage |
| [components/medical/MedicalDocumentsTab.tsx:198-218](../../src/components/medical/MedicalDocumentsTab.tsx#L198) | Card con gradiente + `MedicalSummaryButton` prominente | Solo se usa en `/medical-records` ([MedicalRecords.tsx:353](../../src/pages/MedicalRecords.tsx#L353)), **NO en la ficha clínica** |
| [components/medical/MedicalSummaryButton.tsx](../../src/components/medical/MedicalSummaryButton.tsx) | Botón hero con gradiente, animación hover, spinner | Componente existe y funciona, pero no está conectado a la ficha clínica |

**Flujo actual del usuario:**
```
MyPets → click mascota → /pet/{id}/clinical
  → ve PageHeader con botón PDF minúsculo en esquina (fácil de ignorar)
  → si hace scroll y va al tab "Documentos", ve lista de archivos SIN el CTA de PDF
  → para encontrar el CTA prominente tendría que ir a /medical-records (otra ruta)
```

**Flujo esperado:**
```
MyPets → click mascota → /pet/{id}/clinical
  → ve CTA prominente de descarga PDF (visible sin scroll ni cambio de tab)
  → tab "Documentos" también tiene el CTA como respaldo
```

### 1.2. URL en inglés

**Estado actual:**

| Segmento | Idioma | Esperado |
|---|---|---|
| `/pet/` | Inglés | `/mascota/` |
| `/{uuid}/` | UUID (ok) | Podría ser slug del nombre, pero UUID funciona bien para deep linking |
| `/clinical` | Inglés | `/ficha-clinica` |

**Definición en [src/lib/links.ts:41](../../src/lib/links.ts#L41):**
```ts
petClinical: (petId: string) => `/pet/${petId}/clinical`,
```

**Rutas relacionadas que también usan inglés:**
- `/pet/:petId/clinical?action=share` → compartir ficha
- `/pet/:petId/clinical?action=book` → reservar vet

**Otras rutas que SÍ usan español:**
- `/veterinarios`, `/veterinarios/comuna/:comuna`, `/veterinarios/especialidad/:especialidad`
- `/mis-reservas`, `/registro-veterinario`, `/para-veterinarios`
- `/precios-veterinarios/comuna/:comuna`

La inconsistencia es clara: las rutas públicas (SEO) ya están en español, pero las rutas protegidas (internas) mezclan idiomas.

---

## 2. Plan de fix

### Fix A — CTA de PDF prominente en la ficha clínica (CRÍTICO)

**Objetivo:** que el usuario vea el botón de descarga PDF sin tener que buscarlo.

**Cambios:**

1. **En [PetClinicalRecord/index.tsx](../../src/pages/PetClinicalRecord/index.tsx):**
   - Importar `MedicalSummaryButton` desde `@/components/medical/MedicalSummaryButton`
   - Agregar el card con gradiente (copiar el bloque de `MedicalDocumentsTab.tsx:198-218`) justo **debajo del `PetHeader`** y **encima de los tabs**, para que sea visible sin scroll en la mayoría de pantallas
   - Pasar `petName={pet.name}` al `MedicalSummaryButton` (fix pendiente del master upgrade B.1.4)
   - Mantener el botón pequeño del `PageHeader` como acceso secundario (no eliminar)

2. **En [PetClinicalRecord/tabs/TabDocumentos.tsx](../../src/pages/PetClinicalRecord/tabs/TabDocumentos.tsx):**
   - Importar y renderizar `MedicalSummaryButton` al tope del tab (como respaldo si el usuario llega directo al tab)
   - Versión más compacta que el CTA principal (sin el card con gradiente, solo el botón)

**Resultado visual esperado:**
```
┌─────────────────────────────────────────┐
│ ← Ficha clínica de Kai          [PDF]  │  ← PageHeader (botón secundario)
│    Mascotas > Kai > Ficha clínica       │
├─────────────────────────────────────────┤
│ Mascota: [Kai (perro) ▼]               │
├─────────────────────────────────────────┤
│ ┌─ PetHeader ─────────────────────────┐ │
│ │  K  Kai  perro - pastor suizo ...   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ CTA PDF (NUEVO) ──────────────────┐ │  ← PROMINENTE, con gradiente
│ │  📄 Ficha clínica PDF              │ │
│ │  Descarga toda la ficha en un PDF   │ │
│ │                    [Descargar PDF]   │ │  ← MedicalSummaryButton hero
│ └─────────────────────────────────────┘ │
│                                         │
│ 🩺 Preguntar a la IA sobre Kai          │
│                                         │
│ [Resumen] [Historial] [Hábitos] [Docs]  │
```

### Fix B — URL en español (MEDIA)

**Cambios:**

1. **En [src/App.tsx](../../src/App.tsx):**
   - Cambiar la ruta de `/pet/:petId/clinical` → `/mascota/:petId/ficha-clinica`
   - Agregar redirect legacy: `/pet/:petId/clinical` → `/mascota/:petId/ficha-clinica` (para links ya compartidos que no se rompan)

2. **En [src/lib/links.ts:41](../../src/lib/links.ts#L41):**
   ```ts
   // Antes:
   petClinical: (petId: string) => `/pet/${petId}/clinical`,
   // Después:
   petClinical: (petId: string) => `/mascota/${petId}/ficha-clinica`,
   ```
   - Actualizar también `petClinicalShare` y `petClinicalBook`

3. **En [PetClinicalRecord/index.tsx:159](../../src/pages/PetClinicalRecord/index.tsx#L159):**
   - Cambiar el `navigate` hardcodeado del selector de mascotas:
   ```ts
   // Antes:
   navigate(`/pet/${id}/clinical`)
   // Después:
   navigate(LINKS.petClinical(id))
   ```

4. **Buscar y reemplazar** cualquier otro string hardcodeado `/pet/` + `/clinical` en el codebase.

5. **Actualizar documentos vivos** (CLAUDE.md §9.7):
   - `diagrams/FLUJO_COMPLETO.mmd` — nodo de ficha clínica
   - `MAPA_FUNCIONAL_COMPLETO.md` — rutas
   - `CLAUDE.md` §7 — tabla de rutas

---

## 3. Impacto y riesgo

| Fix | Impacto | Riesgo | Tiempo estimado |
|---|---|---|---|
| A — CTA PDF prominente | 🔴 Alto — joya de la corona visible | Bajo — solo agrega un componente ya existente | ~30 min |
| B — URL español | 🟠 Medio — consistencia UX | Medio — requiere redirect legacy + grep de strings hardcodeados + actualizar docs vivos | ~1h |

**Recomendación:** ejecutar Fix A primero (es el más crítico y de menor riesgo). Fix B puede ir en el mismo commit o separado.

---

## 4. Checklist de implementación

- [ ] A.1 · Importar `MedicalSummaryButton` en `PetClinicalRecord/index.tsx`
- [ ] A.2 · Agregar card CTA con gradiente debajo de `PetHeader`, encima de tabs
- [ ] A.3 · Pasar `petName={pet.name}` al `MedicalSummaryButton`
- [ ] A.4 · Agregar `MedicalSummaryButton` compacto en `TabDocumentos.tsx`
- [ ] B.1 · Cambiar ruta en `App.tsx` a `/mascota/:petId/ficha-clinica`
- [ ] B.2 · Actualizar `links.ts` (3 funciones: `petClinical`, `petClinicalShare`, `petClinicalBook`)
- [ ] B.3 · Agregar redirect legacy `/pet/:petId/clinical` → nueva ruta
- [ ] B.4 · Grep y fix de strings hardcodeados con `/pet/` + `/clinical`
- [ ] B.5 · Actualizar `FLUJO_COMPLETO.mmd`, `MAPA_FUNCIONAL_COMPLETO.md`, `CLAUDE.md` §7
- [ ] C.1 · `npx tsc -b` sin errores
- [ ] C.2 · `npm run build` exitoso
- [ ] C.3 · Verificar en browser que el CTA es visible y funciona
