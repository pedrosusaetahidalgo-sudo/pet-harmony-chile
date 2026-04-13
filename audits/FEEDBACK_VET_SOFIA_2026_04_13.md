# Feedback veterinaria Sofia Rosi — 2026-04-13

> Fuente: conversacion WhatsApp entre Pedro y Sofia Rosi (veterinaria).
> Sofia es veterinaria y esta probando Paw Friend como usuaria real con sus pacientes.

---

## 1. Vacunas: campos insuficientes

### Problema
La seccion de vacunas no es clara. Falta informacion critica que cualquier veterinario necesita.

### Campos que deberia tener cada registro de vacuna
| Campo | Descripcion | Existe hoy? |
|---|---|---|
| Tipo de vacuna | Nombre comercial o tipo (ej. Octuple, Antirrabica) | Parcial (texto libre) |
| Numero de serie / lote | Batch number de la vacuna | No (solo via OCR en descripcion) |
| Fecha de aplicacion | Cuando se puso | Si (`date`) |
| Proxima vacunacion | Cuando toca la siguiente | Parcial (`next_date`, manual) |

### Vacunas obligatorias por especie

**Perros:**
- Octuple / Sextuple
- Antirrabica
- KC (Kennel Cough)

**Gatos:**
- Triple felina
- Antirrabica
- Leucemia felina

### Frecuencia
- Todas son **anuales** como regla general.
- Excepcion: existe una marca de antirrabica que se pone cada 3 anos, pero al haber muchas marcas no es manejable como regla fija.

### Estado actual en el codigo
- Las vacunas se guardan como `medical_records` genericos con `record_type: 'vacuna'`.
- No hay campos dedicados para lote/serie.
- Existe `vaccination_protocols` con frecuencias, pero no linkea con registros reales.
- El catalogo en `src/lib/vaccines.ts` tiene las vacunas hardcodeadas pero no se usa para validar.

---

## 2. Seccion separada de vacunas en el historial

### Problema
> "Lo del historial esta bacan pero yo haria una seccion aparte dentro del historial con las vacunas"

Las vacunas aparecen mezcladas con consultas, cirugias, examenes en el timeline general (`TabHistorial`). Para un veterinario, las vacunas son un bloque aparte que se revisa siempre.

### Propuesta
- Crear un sub-tab o seccion dedicada "Vacunas" dentro de la ficha clinica.
- Mostrar tabla resumen: vacuna | fecha | lote | proxima dosis | estado (al dia / atrasada).
- Mantener tambien la entrada en el historial general para contexto cronologico.

### Estado actual
- `TabHistorial` muestra todo mezclado con filtro por `record_type`, pero no hay vista dedicada de vacunas.
- El filtro existe pero no esta destacado para el caso de uso veterinario.

---

## 3. Antiparasitarios: seccion dedicada

### Problema
> "Antiparasitarios tambien! Porque eso si que se les olvida, seria bacan que les lleguen recordatorio de la proxima fecha"

### Tipos de antiparasitarios
| Tipo | Frecuencia general | Excepcion |
|---|---|---|
| Interno (desparasitacion) | Cada 3 meses | — |
| Externo (antipulgas/garrapatas) | Cada 1 mes | Bravecto = cada 3 meses |

### Propuesta
- Crear seccion "Antiparasitarios" junto a "Vacunas" en la ficha.
- Campos: tipo (interno/externo), producto, fecha aplicacion, proxima dosis.
- Auto-generar recordatorio con la frecuencia correspondiente.
- Caso especial Bravecto: si el producto es Bravecto, frecuencia = 3 meses en vez de 1.

### Estado actual
- Existen `record_type: 'desparasitacion'` y `record_type: 'antipulgas'` en medical_records.
- No hay tabla dedicada ni campos estructurados.
- No hay auto-recordatorio basado en frecuencia de antiparasitario.
- `vaccination_protocols` tiene "Antiparasitario interno" con frecuencia 3 meses, pero no esta linkeado a registros reales ni genera recordatorios automaticos post-aplicacion.

---

## 4. Subir documentos: ya existe pero no es descubrible

### Contexto
Pedro confirmo que la subida de documentos ya existe. Sofia no lo encontro a primera vista.

### Problema de UX
La funcionalidad de subir documentos (examenes, carnet, etc.) no es suficientemente visible o intuitiva para un usuario nuevo.

### Propuesta
- Revisar la visibilidad del boton/seccion de documentos en la ficha clinica.
- Considerar un onboarding tooltip o seccion destacada "Sube el carnet de vacunacion de tu mascota".

---

## 5. Plan Premium: bloqueo para veterinaria beta tester

### Contexto
> "Me quieres habilitar para poder agregar mas mascotas? Que me sale para contratar el plan"
> "Voy a agregar a mis pacientes para poder mandarles todo despues y subir sus examenes, etc."

Sofia quiere agregar multiples pacientes (mascotas de sus clientes) pero el plan gratis limita a 2 mascotas.

### Accion requerida
- Habilitar Premium manualmente a Sofia para que pueda hacer beta testing real con sus pacientes.
- Considerar: deberia usar el plan B2B (veterinario) en vez del B2C?
- Sofia podria ser la primera veterinaria real validando el flujo completo vet → paciente.

---

## 6. Resumen de prioridades

| # | Item | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|---|
| 1 | Seccion dedicada vacunas (vista tabla + campos lote/serie) | Alto | Medio | **Alta** |
| 2 | Seccion dedicada antiparasitarios + auto-recordatorio | Alto | Medio | **Alta** |
| 3 | Mejorar visibilidad de subida de documentos | Medio | Bajo | **Media** |
| 4 | Habilitar Premium/B2B a Sofia para beta testing | Alto | Bajo | **Inmediata** |
| 5 | Auto-recordatorio proxima vacuna al registrar una | Medio | Medio | **Media** |

---

## 7. Archivos relevantes del codebase

| Archivo | Relacion |
|---|---|
| `src/pages/PetClinicalRecord/tabs/TabHistorial.tsx` | Timeline general donde se mezclan vacunas |
| `src/lib/vaccines.ts` | Catalogo hardcodeado de vacunas por especie |
| `src/hooks/useMedicalRecords.tsx` | Hook principal de registros medicos |
| `src/components/onboarding/VaccinationCardOCR.tsx` | OCR de carnet (extrae lote en descripcion) |
| `supabase/migrations/20260423000001_*.sql` | Tabla vaccination_protocols |
| `supabase/migrations/20260421000000_*.sql` | Expansion de record_type (vacuna, desparasitacion, antipulgas) |

---

## 8. Archivos multimedia pendientes de analizar

Los siguientes archivos fueron mencionados pero no encontrados en el repositorio:

- `WhatsApp Video 2026-04-13 at 17.39.09` — Pedro usando la app (screencast)
- `WhatsApp Ptt 2026-04-13 at 17.42.37` — Audio de Sofia con feedback
- `WhatsApp Ptt 2026-04-13 at 17.40.55` — Audio de Sofia con feedback

**Accion**: Pedro debe copiar estos archivos al repo o compartir la ruta para analizar el feedback adicional contenido en los audios/video.
