# Auditoría de datos parametrizados — Paw Friend

> **Objetivo**: Que todos los campos de selección tengan datos completos, reales, parametrizados para métricas.
> **Fecha**: 2026-04-11

---

## Reglas globales

| Regla | Detalle |
|---|---|
| **Capitalización** | Primera letra mayúscula, resto minúsculas. Ej: "Pastor alemán", "Café oscuro". **Excepción**: alias/nombre de usuario (lo que el usuario escriba) |
| **Opción "Otro"** | Todo dropdown DEBE incluir `Otro` como última opción. Si selecciona "Otro", aparece un `<Input>` libre para escribir |
| **Datos reales** | Nunca inventar razas, comunas, especialidades ni nombres. Solo datos verificables |
| **Texto libre → Dropdown** | Campos que hoy son texto libre y deberían ser dropdown para métricas se marcan con 🔴 |
| **Ya es dropdown OK** | Campos que ya son dropdown se marcan con ✅ |
| **Dropdown incompleto** | Campos que son dropdown pero les falta data o "Otro" se marcan con 🟡 |

---

## 1. Especies de mascota

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L576-L583) | **Tipo**: Dropdown ✅

| Valor (DB) | Label | Emoji |
|---|---|---|
| `perro` | Perro | 🐶 |
| `gato` | Gato | 🐱 |
| `conejo` | Conejo | 🐰 |
| `hamster` | Hámster | 🐹 |
| `ave` | Ave | 🐦 |
| `tortuga` | Tortuga | 🐢 |
| `pez` | Pez | 🐟 |
| `otro` | Otro | 🐾 |

**Estado**: ✅ Completo. Tiene "Otro".

---

## 2. Razas por especie

**Archivo**: [src/lib/breeds.ts](src/lib/breeds.ts) | **Tipo**: Datalist (sugerencias) 🟡

### Problemas detectados:
1. Usa `<datalist>` (sugerencias) en vez de `<Select>` — el usuario puede escribir cualquier cosa → datos sucios, imposible hacer métricas por raza
2. **No tiene opción "Otro"** al final de cada lista
3. Capitalización mixta (algunas razas con mayúsculas intermedias correctas por ser nombres propios, pero inconsistencias menores)

### Acción requerida:
- **Convertir de `<Input>` + `<datalist>` a `<Select>` con buscador** (combobox) + opción "Otro" que abre un input libre
- El combobox es necesario porque hay 40+ razas de perro, un select plano sería mala UX

### Datos actuales (verificados, reales):

<details>
<summary><b>Perro (40 razas)</b></summary>

| Valor | Label |
|---|---|
| `quiltro_mestizo` | Quiltro (mestizo) |
| `pastor_aleman` | Pastor alemán |
| `labrador_retriever` | Labrador retriever |
| `golden_retriever` | Golden retriever |
| `bulldog_frances` | Bulldog francés |
| `poodle_caniche` | Poodle / Caniche |
| `chihuahua` | Chihuahua |
| `yorkshire_terrier` | Yorkshire terrier |
| `schnauzer` | Schnauzer |
| `cocker_spaniel` | Cocker spaniel |
| `beagle` | Beagle |
| `husky_siberiano` | Husky siberiano |
| `rottweiler` | Rottweiler |
| `dalmata` | Dálmata |
| `boxer` | Boxer |
| `doberman` | Doberman |
| `border_collie` | Border collie |
| `jack_russell_terrier` | Jack russell terrier |
| `dachshund_salchicha` | Dachshund / Salchicha |
| `pastor_suizo_blanco` | Pastor suizo blanco |
| `shih_tzu` | Shih tzu |
| `pug_carlino` | Pug / Carlino |
| `bichon_frise` | Bichón frisé |
| `maltes` | Maltés |
| `bull_terrier` | Bull terrier |
| `pit_bull_terrier` | Pit bull terrier |
| `weimaraner` | Weimaraner |
| `pointer_aleman` | Pointer alemán |
| `san_bernardo` | San bernardo |
| `gran_danes` | Gran danés |
| `akita_inu` | Akita inu |
| `shar_pei` | Shar pei |
| `pomerania` | Pomerania |
| `basenji` | Basenji |
| `samoyedo` | Samoyedo |
| `chow_chow` | Chow chow |
| `galgo` | Galgo |
| `fox_terrier` | Fox terrier |
| `pastor_australiano` | Pastor australiano |
| `cavalier_king_charles` | Cavalier king charles |
| `otro` | **Otro** → input libre |

</details>

<details>
<summary><b>Gato (15 razas + Otro)</b></summary>

| Valor | Label |
|---|---|
| `mestizo` | Mestizo |
| `siames` | Siamés |
| `persa` | Persa |
| `maine_coon` | Maine coon |
| `ragdoll` | Ragdoll |
| `bengali` | Bengalí |
| `british_shorthair` | British shorthair |
| `angora` | Angora |
| `sphynx` | Sphynx |
| `scottish_fold` | Scottish fold |
| `abisinio` | Abisinio |
| `birmano` | Birmano / Sagrado de birmania |
| `ruso_azul` | Ruso azul |
| `exotico_pelo_corto` | Exótico de pelo corto |
| `chartreux` | Chartreux |
| `otro` | **Otro** → input libre |

</details>

<details>
<summary><b>Conejo (8 + Otro)</b></summary>

| Valor | Label |
|---|---|
| `mestizo` | Mestizo |
| `mini_lop` | Mini lop |
| `holland_lop` | Holland lop |
| `rex` | Rex |
| `angora` | Angora |
| `cabeza_de_leon` | Cabeza de león |
| `enano_holandes` | Enano holandés |
| `belier` | Belier |
| `otro` | **Otro** → input libre |

</details>

<details>
<summary><b>Hámster (4 + Otro)</b></summary>

| Valor | Label |
|---|---|
| `sirio_dorado` | Sirio / Dorado |
| `ruso_campbell` | Ruso / Campbell |
| `roborovski` | Roborovski |
| `chino` | Chino |
| `otro` | **Otro** → input libre |

</details>

<details>
<summary><b>Ave (8 + Otro)</b></summary>

| Valor | Label |
|---|---|
| `periquito_australiano` | Periquito australiano |
| `canario` | Canario |
| `cacatua` | Cacatúa |
| `agapornis` | Agapornis |
| `ninfa_cockatiel` | Ninfa / Cockatiel |
| `loro_amazona` | Loro amazona |
| `guacamayo` | Guacamayo |
| `jilguero` | Jilguero |
| `otro` | **Otro** → input libre |

</details>

<details>
<summary><b>Tortuga (5 + Otro)</b></summary>

| Valor | Label |
|---|---|
| `orejas_rojas` | Tortuga de orejas rojas |
| `rusa` | Tortuga rusa |
| `sulcata` | Tortuga sulcata |
| `de_caja` | Tortuga de caja |
| `estrellada` | Tortuga estrellada |
| `otro` | **Otro** → input libre |

</details>

<details>
<summary><b>Pez (9 + Otro)</b></summary>

| Valor | Label |
|---|---|
| `betta` | Betta |
| `goldfish` | Goldfish / Carassius |
| `neon` | Neón |
| `guppy` | Guppy |
| `angel_escalar` | Ángel / Escalar |
| `disco` | Disco |
| `pleco` | Pleco |
| `molly` | Molly |
| `corydora` | Corydora |
| `otro` | **Otro** → input libre |

</details>

---

## 3. Color de pelaje / cuerpo

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L656-L662) | **Tipo**: Input texto libre 🔴

**Problema**: Es un `<Input>` libre → "cafe", "Cafe", "café", "CAFE", "marrón", "brown" son todos el mismo color pero datos distintos. Imposible hacer métricas.

### Acción requerida:
**Convertir a Select** con opciones predefinidas + "Otro" con input libre.

| Valor (DB) | Label |
|---|---|
| `negro` | Negro |
| `blanco` | Blanco |
| `cafe` | Café |
| `dorado` | Dorado |
| `crema` | Crema |
| `gris` | Gris |
| `naranja` | Naranja |
| `atigrado` | Atigrado |
| `bicolor` | Bicolor |
| `tricolor` | Tricolor |
| `merle` | Merle |
| `manchado` | Manchado |
| `negro_cafe` | Negro y café |
| `blanco_negro` | Blanco y negro |
| `blanco_cafe` | Blanco y café |
| `otro` | **Otro** → input libre |

> **Nota**: Estos son los colores estándar usados en registros veterinarios y kennel clubs en Chile. Para peces/tortugas/aves aplican los mismos pero se puede extender.

---

## 4. Género

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L620-L635) | **Tipo**: Dropdown ✅

| Valor | Label |
|---|---|
| `macho` | Macho |
| `hembra` | Hembra |

**Problema**: 🟡 No tiene opción para cuando no se sabe (ej: pez, tortuga bebé).

### Acción requerida:
Agregar `desconocido` → "Desconocido" (ya existe en el form de adopción pero NO en AddPet).

---

## 5. Tamaño

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L638-L652) | **Tipo**: Dropdown ✅

| Valor | Label |
|---|---|
| `pequeño` | Pequeño (1-10 kg) |
| `mediano` | Mediano (10-25 kg) |
| `grande` | Grande (25-45 kg) |
| `gigante` | Gigante (45+ kg) |

**Problema**: 🟡 Los rangos de peso solo aplican a perros. Un gato "grande" no pesa 25 kg. Falta "Miniatura" para hámsters/peces.

### Acción requerida:
- Agregar `miniatura` → "Miniatura (< 1 kg)" para especies pequeñas
- Considerar mostrar rangos dinámicos según especie (ya existe la lógica de peso por especie en líneas 200-228)

---

## 6. Nivel de actividad

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L800-L820) | **Tipo**: Dropdown ✅

| Valor | Label |
|---|---|
| `sedentario` | Sedentario |
| `bajo` | Bajo |
| `moderado` | Moderado |
| `alto` | Alto |
| `muy_alto` | Muy alto |

**Estado**: ✅ Completo. No necesita "Otro" (es una escala cerrada).

---

## 7. Tipo de dieta

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L840-L862) | **Tipo**: Dropdown 🟡

| Valor | Label |
|---|---|
| `seca` | Seca |
| `humeda` | Húmeda |
| `mixta` | Mixta |
| `barf` | Barf / Natural |
| `casera` | Casera |
| `veterinaria` | Prescrita por veterinario |

**Problema**: Falta opción "Otro".

### Acción requerida:
Agregar `otro` → "Otro" + input libre.

---

## 8. Marca de alimento

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L867-L873) | **Tipo**: Input texto libre 🔴

**Problema**: "Royal Canin", "royal canin", "ROYAL CANIN", "royalcanin" son la misma marca pero datos distintos.

### Acción requerida:
**Convertir a Select con buscador (combobox)** + "Otro" con input libre. Marcas reales vendidas en Chile:

| Valor (DB) | Label |
|---|---|
| `royal_canin` | Royal canin |
| `purina_pro_plan` | Purina pro plan |
| `hills` | Hill's |
| `eukanuba` | Eukanuba |
| `brit_care` | Brit care |
| `acana` | Acana |
| `orijen` | Orijen |
| `taste_of_the_wild` | Taste of the wild |
| `nutram` | Nutram |
| `champion_cat` | Champion cat |
| `champion_dog` | Champion dog |
| `master_dog` | Master dog |
| `pedigree` | Pedigree |
| `whiskas` | Whiskas |
| `felix` | Felix |
| `mon_ami` | Mon ami |
| `dog_chow` | Dog chow |
| `cat_chow` | Cat chow |
| `proplan_veterinary` | Proplan veterinary diets |
| `nutrisource` | Nutrisource |
| `canidae` | Canidae |
| `farmina` | Farmina |
| `otro` | **Otro** → input libre |

---

## 9. Personalidad de mascota

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L30-L33) | **Tipo**: Multi-select badges ✅

| Valor actual |
|---|
| Juguetón |
| Tranquilo |
| Energético |
| Cariñoso |
| Tímido |
| Protector |
| Sociable |
| Independiente |
| Curioso |
| Obediente |

**Problemas**: 🟡
1. No tiene opción "Otro" con input libre
2. Falta capitalización consistente en DB (se guarda tal cual)

### Acción requerida:
- Agregar badge "Otro" que al clickearlo abre un input
- Normalizar valores en DB a minúsculas con capitalización en display

---

## 10. Notas de comportamiento

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L878-L886) | **Tipo**: Textarea libre ✅ (correcto)

**Estado**: ✅ Mantener como texto libre. Es un campo narrativo, no parametrizable.

---

## 11. Biografía de mascota

**Archivo**: [src/pages/AddPet.tsx](src/pages/AddPet.tsx#L729-L737) | **Tipo**: Textarea libre ✅ (correcto)

**Estado**: ✅ Mantener como texto libre. Es narrativo.

---

## 12. Tipos de registro médico

**Archivo**: [src/lib/medicalRecordTypes.ts](src/lib/medicalRecordTypes.ts) | **Tipo**: Dropdown ✅

**Categorías y valores** (23 tipos + Otro):

| Categoría | Valor | Label |
|---|---|---|
| Consultas | `consulta_general` | Consulta general |
| | `control_sano` | Control sano |
| | `urgencia` | Urgencia |
| | `seguimiento` | Seguimiento |
| | `segunda_opinion` | Segunda opinión |
| Vacunas | `vacuna` | Vacuna |
| | `desparasitacion` | Desparasitación |
| | `antipulgas` | Antipulgas |
| Procedimientos | `cirugia` | Cirugía |
| | `esterilizacion` | Esterilización |
| | `limpieza_dental` | Limpieza dental |
| | `ecografia` | Ecografía |
| | `rayos_x` | Rayos x |
| | `examen_sangre` | Examen de sangre |
| | `examen_orina` | Examen de orina |
| Tratamientos | `tratamiento` | Tratamiento |
| | `quimioterapia` | Quimioterapia |
| | `rehabilitacion` | Rehabilitación |
| | `hospitalizacion` | Hospitalización |
| Registros | `alergia` | Alergia |
| | `peso` | Peso |
| | `microchip` | Microchip |
| Otros | `otro` | **Otro** |

**Estado**: ✅ Completo. Tiene "Otro".

---

## 13. Tipos de recordatorio

**Archivo**: [src/lib/reminderTypes.ts](src/lib/reminderTypes.ts) | **Tipo**: Dropdown 🟡

| Valor | Label | Recurrencia default |
|---|---|---|
| `vaccine` | Vacuna | Anual |
| `checkup` | Control veterinario | 6 meses |
| `deworming` | Desparasitación | 3 meses |
| `flea` | Antipulgas / garrapatas | Mensual |
| `medication` | Medicamento | — |
| `grooming` | Baño / peluquería | Mensual |
| `weight` | Control de peso | Mensual |
| `dental` | Limpieza dental | Anual |
| `food` | Comprar alimento | Mensual |
| `insurance` | Renovar seguro | Anual |
| `license` | Renovar registro municipal | Anual |
| `custom` | Personalizado | — |

**Problema**: Tiene `custom` pero no tiene un `otro` explícito. `custom` cumple la función, pero el label debería ser "Otro (personalizado)" para consistencia.

### Acción requerida:
- Renombrar label de `custom` a "Otro (personalizado)"

---

## 14. Catálogo de vacunas

**Archivo**: [src/lib/vaccines.ts](src/lib/vaccines.ts) | **Tipo**: Dropdown ✅

Cada especie tiene su catálogo. Ya incluye "Otra vacuna" como opción.

**Estado**: ✅ Completo.

---

## 15. Especialidades veterinarias

**Archivo**: [src/lib/vetDirectory.ts](src/lib/vetDirectory.ts) | **Tipo**: Dropdown/filtro 🟡

23 especialidades agrupadas en categorías. **No tiene "Otro"**.

### Acción requerida:
Agregar al final: `otro` → "Otra especialidad" + input libre.

---

## 16. Comunas (Santiago RM)

**Archivo**: [src/lib/locations.ts](src/lib/locations.ts) | **Tipo**: Dropdown ✅

33 comunas de Santiago. Solo RM por ahora.

**Problema**: 🟡 No tiene "Otra comuna" para usuarios fuera de Santiago (Valparaíso, Concepción, etc.)

### Acción requerida:
- Agregar `otro` → "Otra comuna" + input libre
- A futuro: expandir a regiones principales de Chile

---

## 17. Tipos de post (feed social)

**Archivo**: [src/lib/postTypes.ts](src/lib/postTypes.ts) | **Tipo**: Dropdown ✅

| Valor | Label |
|---|---|
| `foto` | 📸 Foto |
| `pregunta` | ❓ Pregunta |
| `consejo` | 💡 Consejo |
| `perdido` | 🔍 Perdido / Encontrado |
| `adopcion` | 🏠 Adopción |
| `logro` | 🏆 Logro |

**Problema**: 🟡 No tiene "Otro".

### Acción requerida:
Agregar `otro` → "🐾 Otro" + campo libre (o dejarlo así si se quiere forzar categorización).

---

## 18. Formulario de adopción — campos texto libre 🔴

**Archivo**: [src/components/CreateAdoptionPost.tsx](src/components/CreateAdoptionPost.tsx#L140-L244)

### 18a. Raza (adopción)
**Tipo actual**: Input libre 🔴
**Acción**: Usar el mismo combobox de razas de AddPet (punto 2).

### 18b. Estado de salud
**Tipo actual**: Input libre 🔴
**Acción**: **Convertir a Select** + "Otro" con input.

| Valor (DB) | Label |
|---|---|
| `sano` | Sano |
| `vacunado` | Vacunado al día |
| `esterilizado` | Esterilizado/a |
| `vacunado_esterilizado` | Vacunado y esterilizado |
| `en_tratamiento` | En tratamiento |
| `condicion_cronica` | Condición crónica controlada |
| `convaleciente` | Convaleciente |
| `discapacidad` | Con discapacidad |
| `sin_informacion` | Sin información |
| `otro` | **Otro** → input libre |

### 18c. Temperamento (adopción)
**Tipo actual**: Input libre separado por comas 🔴
**Acción**: **Convertir a multi-select badges** (igual que personalidad en AddPet, punto 9). Reusar la misma lista + "Otro".

### 18d. Motivo de adopción
**Tipo actual**: Textarea libre 🔴
**Acción**: **Convertir a Select** + "Otro" con textarea.

| Valor (DB) | Label |
|---|---|
| `cambio_domicilio` | Cambio de domicilio |
| `alergias_familia` | Alergias en la familia |
| `falta_tiempo` | Falta de tiempo |
| `problemas_economicos` | Problemas económicos |
| `fallecimiento_dueno` | Fallecimiento del dueño |
| `rescatado` | Rescatado de la calle |
| `camada_no_planificada` | Camada no planificada |
| `incompatibilidad` | Incompatibilidad con otras mascotas |
| `otro` | **Otro** → textarea libre |

### 18e. Tamaño (adopción)
**Tipo actual**: Dropdown 🟡
**Problema**: Tiene `pequeño`, `mediano`, `grande` pero le falta `gigante` y `miniatura` para consistencia con AddPet.

---

## 19. Tipos de servicio (proveedores)

**Archivo**: DB enum `service_type` | **Tipo**: Enum PostgreSQL ✅

| Valor | Label sugerido |
|---|---|
| `dog_walker` | Paseador |
| `dogsitter` | Cuidador |
| `veterinarian` | Veterinario/a |
| `trainer` | Entrenador/a |
| `grooming` | Peluquería |

**Estado**: ✅ Enum cerrado (correcto para roles del sistema). No necesita "Otro".

---

## 20. Color en formulario de nuevo paciente (provider)

**Archivo**: [src/components/provider/NewPatientForm.tsx](src/components/provider/NewPatientForm.tsx#L198) | **Tipo**: Input libre 🔴

**Problema**: Mismo problema que punto 3. Texto libre para color.

### Acción requerida:
Reusar el mismo dropdown de colores del punto 3.

---

## 21. Días de la semana (horarios)

**Archivo**: [src/lib/openingHours.ts](src/lib/openingHours.ts) | **Tipo**: Constante ✅

`dom, lun, mar, mie, jue, vie, sab`

**Estado**: ✅ Cerrado y correcto.

---

## 22. Niveles de gamificación

**Archivo**: [src/lib/levels.ts](src/lib/levels.ts) | **Tipo**: Constante ✅

10 niveles fijos. No es seleccionable por el usuario.

**Estado**: ✅ No aplica dropdown.

---

## 23. Tipos de desafío

**Archivo**: Migración SQL | **Tipo**: Enum DB ✅

| Valor | Dificultad |
|---|---|
| `caminar` | `facil`, `medio`, `dificil` |
| `jugar` | |
| `socializar` | |
| `cuidar` | |

**Estado**: ✅ Cerrado.

---

## Resumen de acciones requeridas

### 🔴 Campos texto libre → Convertir a dropdown (6 campos)

| # | Campo | Archivo | Componente nuevo |
|---|---|---|---|
| 1 | **Color pelaje** | AddPet.tsx:656 | Select con 16 opciones + Otro |
| 2 | **Marca alimento** | AddPet.tsx:867 | Combobox con 22 marcas + Otro |
| 3 | **Estado salud (adopción)** | CreateAdoptionPost.tsx:229 | Select con 10 opciones + Otro |
| 4 | **Temperamento (adopción)** | CreateAdoptionPost.tsx:238 | Multi-select badges + Otro |
| 5 | **Motivo adopción** | CreateAdoptionPost.tsx:219 | Select con 9 opciones + Otro |
| 6 | **Color (nuevo paciente vet)** | NewPatientForm.tsx:198 | Reusar dropdown de color |

### 🟡 Dropdowns existentes que necesitan ajustes (7 campos)

| # | Campo | Cambio necesario |
|---|---|---|
| 1 | **Raza** (AddPet) | `datalist` → combobox + "Otro" |
| 2 | **Género** (AddPet) | Agregar "Desconocido" |
| 3 | **Tamaño** (AddPet) | Agregar "Miniatura (< 1 kg)" |
| 4 | **Tipo dieta** | Agregar "Otro" |
| 5 | **Recordatorios** | Renombrar label `custom` → "Otro (personalizado)" |
| 6 | **Especialidades vet** | Agregar "Otra especialidad" |
| 7 | **Comunas** | Agregar "Otra comuna" + input |

### 📝 Normalización de capitalización

Todos los valores de display deben seguir: **Primera mayúscula, resto minúsculas**.

Archivos a revisar:
- `src/lib/breeds.ts` — normalizar labels
- `src/pages/AddPet.tsx` — personalityOptions
- `src/lib/vetDirectory.ts` — specialty labels
- `src/components/CreateAdoptionPost.tsx` — labels inline

### 🏗️ Componente reutilizable sugerido

Crear un componente `SelectWithOther` que encapsule el patrón:

```tsx
// src/components/ui/select-with-other.tsx
// Props: options, value, onChange, placeholder, otherLabel
// Comportamiento:
//   - Si selecciona cualquier opción normal → guarda el valor
//   - Si selecciona "Otro" → aparece Input libre debajo
//   - El valor se guarda como "otro:lo que escribió" para poder filtrar
```

Y un `ComboboxWithOther` para listas largas (razas, marcas):

```tsx
// src/components/ui/combobox-with-other.tsx
// Igual pero con búsqueda filtrable
```

---

## Orden de implementación sugerido

1. **Crear `SelectWithOther` y `ComboboxWithOther`** (componentes base)
2. **Color pelaje** (AddPet + NewPatientForm) — impacto alto en métricas
3. **Raza** (convertir datalist → combobox) — impacto alto en métricas
4. **Marca alimento** — impacto medio, dato comercial valioso
5. **Campos adopción** (salud, temperamento, motivo) — impacto medio
6. **Ajustes menores** (género, tamaño, dieta, recordatorios, especialidades, comunas)
7. **Normalización de capitalización** en todos los archivos

---

## Migración de datos existentes

Si ya hay datos guardados en texto libre, crear un script de normalización:

```sql
-- Ejemplo: normalizar colores existentes
UPDATE pets SET color = 'negro' WHERE lower(trim(color)) IN ('negro', 'black', 'negra');
UPDATE pets SET color = 'cafe' WHERE lower(trim(color)) IN ('café', 'cafe', 'marron', 'marrón', 'brown');
-- etc.
```

> **IMPORTANTE**: Este script se genera DESPUÉS de revisar los datos reales en producción con un `SELECT DISTINCT color FROM pets` para mapear las variantes que realmente existen.
