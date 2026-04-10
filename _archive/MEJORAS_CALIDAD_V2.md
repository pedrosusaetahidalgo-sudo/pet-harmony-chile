# Paw Friend — Mejoras de calidad v2.0
## Barrido completo para llevar cada modulo al siguiente nivel

> **Fecha**: 2026-04-09
> **Proposito**: Documento para copiar y pegar en otra sesion de Claude Code.
> **Instruccion**: Lee CLAUDE.md primero, luego ejecuta este documento fase por fase.
> **Estado base**: app deployada en pawfriend.cl, Supabase prod, 17 edge functions, modulo memorial, PawGame conectado.

---

## 1. ESPECIALIDADES VETERINARIAS — Problema critico de calidad

### Estado actual (src/lib/vetDirectory.ts)

15 especialidades definidas, pero con errores conceptuales graves:

```
Medicina general, Cirugia, Dermatologia, Oftalmologia, Cardiologia,
Oncologia, Geriatria, Comportamiento animal, Animales exoticos,
Reproduccion, Odontologia, Neurologia, Ortopedia, Vacunacion, Esterilizacion
```

### Problemas detectados

1. **"Vacunacion" NO es especialidad** — es un procedimiento basico de medicina general. Ningun vet se presenta como "especialista en vacunacion". Equivale a poner "tomar la presion" como especialidad medica.
2. **"Esterilizacion" NO es especialidad** — es una cirugia estandar. Todo vet general la hace.
3. **Faltan especialidades reales** reconocidas por el Colegio Medico Veterinario de Chile:
   - Medicina interna
   - Imagenologia (ecografia, rayos X)
   - Endocrinologia
   - Medicina felina (especialidad en auge)
   - Urgencias y cuidados criticos
   - Rehabilitacion y fisioterapia
   - Nutricion animal
   - Anestesiologia
   - Patologia clinica (laboratorio)
   - Medicina de animales silvestres

### Accion requerida

Reemplazar lista completa en `src/lib/vetDirectory.ts`:

```ts
export const VET_SPECIALTIES = [
  // Generales
  "Medicina general",
  "Medicina interna",
  "Medicina felina",
  "Medicina de animales exoticos",

  // Quirurgicas
  "Cirugia general",
  "Cirugia ortopedica",
  "Cirugia de tejidos blandos",

  // Especialidades clinicas
  "Dermatologia",
  "Oftalmologia",
  "Cardiologia",
  "Oncologia",
  "Neurologia",
  "Endocrinologia",
  "Odontologia",
  "Gastroenterologia",
  "Nefrologia y urologia",

  // Diagnostico
  "Imagenologia (ecografia/rayos X)",
  "Patologia clinica (laboratorio)",

  // Etapas de vida
  "Geriatria",
  "Neonatologia y pediatria",

  // Comportamiento y rehabilitacion
  "Comportamiento animal (etologia)",
  "Rehabilitacion y fisioterapia",

  // Otras
  "Reproduccion y obstetricia",
  "Nutricion animal",
  "Anestesiologia",
  "Urgencias y cuidados criticos",
  "Medicina preventiva",
  "Animales silvestres",
];
```

Tambien actualizar los chips del formulario de registro vet y el filtro del directorio.

---

## 2. TIPOS DE SERVICIO VETERINARIO — Demasiado genericos

### Estado actual (AddMedicalRecord, BookingModal)

```
vacuna, consulta, tratamiento, alergia, cirugia, otro
```

### Problemas

- "Consulta" es generico. Un dueno no sabe si fue control sano, urgencia, o seguimiento.
- No hay diferencia entre consulta preventiva vs curativa.
- "Tratamiento" no especifica (desparasitacion? quimioterapia? antibioticos?).
- Faltan categorias comunes en Chile.

### Accion: Ampliar tipos de registro medico

```ts
export const MEDICAL_RECORD_TYPES = [
  // Consultas
  { value: "consulta_general", label: "Consulta general" },
  { value: "control_sano", label: "Control sano (preventivo)" },
  { value: "urgencia", label: "Urgencia" },
  { value: "seguimiento", label: "Consulta de seguimiento" },
  { value: "segunda_opinion", label: "Segunda opinion" },

  // Vacunas y prevencion
  { value: "vacuna", label: "Vacuna" },
  { value: "desparasitacion", label: "Desparasitacion" },
  { value: "antipulgas", label: "Antipulgas / garrapatas" },

  // Procedimientos
  { value: "cirugia", label: "Cirugia" },
  { value: "esterilizacion", label: "Esterilizacion / castracion" },
  { value: "limpieza_dental", label: "Limpieza dental" },
  { value: "ecografia", label: "Ecografia" },
  { value: "rayos_x", label: "Rayos X" },
  { value: "examen_sangre", label: "Examen de sangre" },
  { value: "examen_orina", label: "Examen de orina" },

  // Tratamientos
  { value: "tratamiento", label: "Tratamiento / medicacion" },
  { value: "quimioterapia", label: "Quimioterapia" },
  { value: "rehabilitacion", label: "Rehabilitacion / fisioterapia" },
  { value: "hospitalizacion", label: "Hospitalizacion" },

  // Registros
  { value: "alergia", label: "Alergia detectada" },
  { value: "peso", label: "Control de peso" },
  { value: "microchip", label: "Implantacion de microchip" },

  // Otros
  { value: "otro", label: "Otro" },
];
```

Archivos a modificar:
- `src/components/AddMedicalRecord.tsx` — select de tipos
- `src/pages/PetClinicalRecord/shared.tsx` — iconos y badges por tipo
- `src/pages/PetClinicalRecord/tabs/TabHistorial.tsx` — filtro de timeline

---

## 3. ESPECIES Y RAZAS — Mejorar profundidad

### Estado actual

- Especies: perro, gato, otro (selector en AddPet.tsx)
- Razas: campo de texto libre, sin sugerencias

### Problemas

- "Otro" agrupa conejo, hamster, tortuga, ave, pez — pero esos ya tienen validacion de edad. Incoherencia.
- Sin razas sugeridas, el usuario escribe "pastor suiso" (mal) en vez de "Pastor Suizo Blanco".
- Las razas afectan alertas medicas (displasia cadera en razas grandes, problemas respiratorios en braquicefalos).

### Accion

1. **Expandir selector de especie** a los 8 tipos que ya tienen validacion de edad:

```tsx
const SPECIES_OPTIONS = [
  { value: "perro", label: "Perro", emoji: "🐶" },
  { value: "gato", label: "Gato", emoji: "🐱" },
  { value: "conejo", label: "Conejo", emoji: "🐰" },
  { value: "hamster", label: "Hamster", emoji: "🐹" },
  { value: "ave", label: "Ave", emoji: "🐦" },
  { value: "tortuga", label: "Tortuga", emoji: "🐢" },
  { value: "pez", label: "Pez", emoji: "🐟" },
  { value: "otro", label: "Otro", emoji: "🐾" },
];
```

2. **Agregar autocompletado de razas** (top 50 por especie en Chile):

Crear `src/lib/breeds.ts` con las razas mas comunes por especie. Usar un `Combobox` con fuzzy search en el campo de raza.

Perros top 20 Chile: Pastor Aleman, Labrador Retriever, Golden Retriever, Bulldog Frances, Poodle/Caniche, Chihuahua, Yorkshire Terrier, Schnauzer, Cocker Spaniel, Beagle, Husky Siberiano, Rottweiler, Dalmata, Boxer, Doberman, Border Collie, Jack Russell, Dachshund/Salchicha, Pastor Suizo Blanco, Quiltro (mestizo).

Gatos top 10 Chile: Mestizo, Siames, Persa, Maine Coon, Ragdoll, Bengal, British Shorthair, Angora, Sphynx, Scottish Fold.

---

## 4. VACUNAS — Reemplazar texto libre por catalogo

### Estado actual

Campo de texto libre para nombre de vacuna. El usuario puede escribir "la del moquillo" o "octuple" sin estandarizar.

### Accion: Catalogo de vacunas por especie

```ts
export const VACCINE_CATALOG = {
  perro: [
    { name: "Sextuple (DHPPI+L)", description: "Distemper, Hepatitis, Parvo, Parainfluenza, Leptospira", schedule: "8, 12, 16 semanas + anual" },
    { name: "Octuple (DHPPI+L4)", description: "Idem + 4 cepas de Leptospira", schedule: "8, 12, 16 semanas + anual" },
    { name: "Antirrabica", description: "Rabia", schedule: "16 semanas + anual (obligatoria Chile)" },
    { name: "KC (Kennel Cough)", description: "Bordetella + Parainfluenza intranasal", schedule: "Anual o pre-pension" },
    { name: "Giardia", description: "Giardia lamblia", schedule: "Segun riesgo" },
  ],
  gato: [
    { name: "Triple felina (FVRCP)", description: "Rinotraqueitis, Calicivirus, Panleucopenia", schedule: "8, 12, 16 semanas + anual" },
    { name: "Leucemia felina (FeLV)", description: "Virus leucemia felina", schedule: "8, 12 semanas + anual" },
    { name: "Antirrabica", description: "Rabia", schedule: "16 semanas + anual" },
    { name: "PIF (opcional)", description: "Peritonitis infecciosa felina", schedule: "Segun riesgo" },
  ],
  conejo: [
    { name: "Mixomatosis", description: "Virus mixoma", schedule: "Anual" },
    { name: "VHD (Hemorragica)", description: "Enfermedad hemorragica viral", schedule: "Anual" },
  ],
};
```

Usar como selector `Combobox` con opcion "Otra vacuna" para texto libre.

---

## 5. RECORDATORIOS — Agregar tipos predefinidos

### Estado actual

Tipo de recordatorio es texto libre en el formulario.

### Accion: Tipos predefinidos

```ts
export const REMINDER_TYPES = [
  { value: "vaccine", label: "Vacuna", icon: Syringe, defaultRecurrence: "yearly" },
  { value: "checkup", label: "Control veterinario", icon: Stethoscope, defaultRecurrence: "6months" },
  { value: "deworming", label: "Desparasitacion", icon: Bug, defaultRecurrence: "3months" },
  { value: "flea", label: "Antipulgas / garrapatas", icon: Shield, defaultRecurrence: "monthly" },
  { value: "medication", label: "Medicamento", icon: Pill, defaultRecurrence: null },
  { value: "grooming", label: "Bano / peluqueria", icon: Scissors, defaultRecurrence: "monthly" },
  { value: "weight", label: "Control de peso", icon: Scale, defaultRecurrence: "monthly" },
  { value: "dental", label: "Limpieza dental", icon: Smile, defaultRecurrence: "yearly" },
  { value: "walk", label: "Paseo", icon: Footprints, defaultRecurrence: "daily" },
  { value: "food", label: "Comprar alimento", icon: ShoppingCart, defaultRecurrence: "monthly" },
  { value: "insurance", label: "Renovar seguro", icon: FileCheck, defaultRecurrence: "yearly" },
  { value: "license", label: "Renovar registro municipal", icon: FileText, defaultRecurrence: "yearly" },
  { value: "custom", label: "Personalizado", icon: Bell, defaultRecurrence: null },
];
```

Agregar sugerencia de recurrencia automatica segun tipo.

---

## 6. MODULO MEMORIAL — Visibilidad y acceso

### Estado actual

- Componentes existen: MemorialFlow.tsx, MemorialCard.tsx, BereavementChat.tsx, EnMemoria.tsx
- Ruta `/en-memoria` existe y esta en sidebar
- Entry point en ficha clinica: "Si {nombre} ya no esta con nosotros..."

### Problemas detectados

1. **El memorial solo se accede desde la ficha clinica** (link sutil al fondo) o desde sidebar. Si el usuario no sabe que existe, nunca lo encuentra.
2. **No hay onboarding del memorial** — cuando el usuario entra por primera vez a `/en-memoria` sin mascotas memorial, el empty state no explica bien que es.
3. **BereavementChat no tiene historial** — cada vez que se abre, empieza de cero.
4. **No se filtra el memorial del conteo de mascotas** en el header del dashboard ("3 mascotas registradas" incluye las memorial).

### Acciones

1. Agregar mencion del memorial en la seccion de ajustes (Settings > Avanzado > "Registro de despedida").
2. Mejorar empty state de `/en-memoria` con explicacion de que es y como funciona.
3. Guardar conversaciones del BereavementChat en tabla (opcional, con consentimiento).
4. Filtrar conteo de mascotas en Home para excluir `lifecycle_status = 'memorial'`.

---

## 7. PAGINA DE PRECIOS / UPGRADE — No existe UI dedicada

### Estado actual

- Existe `/upgrade` como ruta pero el contenido es basico.
- Los planes estan en `src/lib/plans.ts` pero no hay pagina de comparacion visual.
- El usuario no sabe que existe Premium ni que beneficios tiene.

### Accion

Crear pagina `/upgrade` con:
- Comparacion visual B2C: Gratis vs Premium ($3.990/mes)
- Features: PDF ilimitados, compartir ficha, mascotas ilimitadas
- CTA a Flow.cl para pago
- Testimoniales (pueden ser demo inicialmente)
- FAQ de pricing

---

## 8. FEED / COMUNIDAD — Mejorar tipos de contenido

### Estado actual

Posts genericos de texto + imagen. Sin categorias ni tipos.

### Accion

Agregar tipos de post:
- **Foto** (default actual)
- **Pregunta** (el usuario pregunta algo a la comunidad)
- **Consejo** (tip de cuidado, alimentacion, etc.)
- **Perdido/Encontrado** (link rapido al modulo de mascotas perdidas)
- **Adopcion** (link al modulo de adopcion)
- **Logro** (auto-generado cuando gana badge o sube de nivel en PawGame)

Agregar filtro por tipo en el feed.

---

## 9. CALIDAD DE DATOS — Validaciones faltantes

### 9.1 Peso de mascota

- Actualmente acepta cualquier numero > 0
- Un chihuahua de 80kg o un gran danes de 0.5kg no deberia pasar
- Agregar rangos por especie/raza (opcional, warning no bloqueante)

### 9.2 Telefono de contacto

- Sin validacion de formato chileno (+569XXXXXXXX)
- Agregar mascara de input para telefono

### 9.3 Numero de microchip

- Ya valida 15 digitos ISO — correcto
- Agregar: verificacion de digito de control ISO 11784 (opcional)

### 9.4 RUT / Registro Colmevet

- Campo libre actualmente
- Agregar formato esperado: "XX.XXX" para Colmevet

---

## 10. PAWGAME — Mejorar misiones y badges

### Estado actual

Misiones y badges configurables desde DB. Pero los seeds iniciales son genericos.

### Accion: Agregar misiones especificas de valor

```sql
-- Misiones de salud real (no generico)
INSERT INTO paw_missions (mission_type, category, title, description, target_action, target_count, points_reward, is_active) VALUES
('daily', 'health', 'Registra el peso de tu mascota', 'Anota el peso actual en la ficha clinica', 'log_weight', 1, 15, true),
('weekly', 'health', 'Completa un control preventivo', 'Lleva a tu mascota al vet para un chequeo', 'log_vet_visit', 1, 50, true),
('weekly', 'health', 'Actualiza las vacunas', 'Registra una vacuna en la ficha medica', 'log_vaccine', 1, 40, true),
('daily', 'activity', 'Sube una foto de paseo', 'Publica una foto de tu paseo diario', 'post_walk_photo', 1, 10, true),
('weekly', 'community', 'Deja una resena a un vet', 'Ayuda a otros duenos compartiendo tu experiencia', 'leave_review', 1, 25, true),
('monthly', 'health', 'Ficha clinica 100%', 'Completa todos los campos de la ficha de tu mascota', 'complete_profile', 1, 100, true),
('story', 'exploration', 'Primer servicio reservado', 'Reserva tu primera consulta desde Paw Friend', 'first_booking', 1, 75, true),
('story', 'community', 'Conecta con 5 duenos', 'Sigue a 5 usuarios de la comunidad', 'follow_5', 5, 60, true)
ON CONFLICT DO NOTHING;
```

---

## 11. CONSISTENCIA DE COPY — Revision completa

### Problemas encontrados

1. **Voseo residual**: "Podes" encontrado en IntegrationsCard (ya corregido). Buscar mas instancias.
2. **"Mascotas" vs "Peludos"**: inconsistencia — el copy mezcla ambos terminos.
3. **Ingles residual**: algunos empty states tienen "No items found" o textos en ingles.
4. **Emojis inconsistentes**: algunos botones tienen emoji, otros no. Definir regla.

### Accion

Ejecutar grep completo:
```bash
grep -rn "podés\|tenés\|querés\|vos " src/
grep -rn "No items\|not found\|loading\.\.\." src/ --include="*.tsx"
```

Corregir todo a tuteo chileno.

---

## 12. DARK MODE — Resolver inconsistencia

### Estado actual

- Date picker usa dark mode (del sistema)
- Resto de la app es light mode forzado
- No hay toggle de dark mode en Settings

### Accion

Opcion A (recomendada para v1): Forzar light mode en el date picker para consistencia.
Opcion B (v2): Implementar dark mode completo con toggle en Settings.

---

## 13. EMPTY STATES — Unificar con EmptyState component

### Estado actual

- Componente `src/components/ui/EmptyState.tsx` ya existe (recien creado)
- Pero NO se usa en ningun lugar — los empty states actuales son inline

### Accion

Migrar todos los empty states a usar el componente reutilizable:
- Feed.tsx (sin posts)
- Chat.tsx (sin conversaciones)
- MyPets.tsx (sin mascotas)
- Reminders.tsx (sin recordatorios)
- MedicalRecords.tsx (sin registros)
- Profile.tsx tabs (sin posts, sin mascotas, sin resenas)
- PawGame tabs (sin misiones, sin badges)

---

## 14. ADMIN — Features faltantes

### Estado actual

8 tabs de admin. Pero faltan herramientas criticas.

### Agregar

1. **Dashboard de metricas**: usuarios activos, mascotas registradas, reservas/semana, revenue
2. **Moderacion de contenido**: reportes de posts, bloqueo de usuarios
3. **Gestion de rewards**: CRUD de paw_shop_rewards desde admin (no SQL directo)
4. **Gestion de misiones**: CRUD de paw_missions
5. **Logs de seguridad**: ver bereavement_safety_logs con flags de crisis

---

## 15. PERFORMANCE — Optimizaciones pendientes

1. **Imagenes sin lazy loading**: fotos de mascotas y avatares cargan todas juntas
2. **Queries sin paginacion**: Feed carga todos los posts, MyPets todas las mascotas
3. **Bundle**: 371 kB principal — considerar code-splitting mas agresivo para PawGame (41 kB) y Maps (89 kB)

---

## 16. PRIORIDAD DE EJECUCION

### Fase 1 — Calidad de datos (1-2 dias)
- [ ] Reemplazar especialidades vet (item 1)
- [ ] Ampliar tipos de registro medico (item 2)
- [ ] Expandir selector de especies (item 3)
- [ ] Catalogo de vacunas por especie (item 4)
- [ ] Tipos predefinidos de recordatorios (item 5)

### Fase 2 — Memorial y UX (1 dia)
- [ ] Mejorar visibilidad del memorial (item 6)
- [ ] Unificar empty states (item 13)
- [ ] Fix dark mode date picker (item 12)
- [ ] Revisar copy chileno (item 11)

### Fase 3 — Features de valor (2-3 dias)
- [ ] Pagina de precios/upgrade (item 7)
- [ ] Tipos de post en feed (item 8)
- [ ] Autocompletado de razas (item 3.2)
- [ ] Misiones especificas PawGame (item 10)

### Fase 4 — Admin y polish (1-2 dias)
- [ ] Dashboard de metricas admin (item 14)
- [ ] Validaciones avanzadas (item 9)
- [ ] Performance (item 15)

---

## PROMPT EJECUTABLE PARA CLAUDE CODE

```
Lee CLAUDE.md y MEJORAS_CALIDAD_V2.md.
Ejecuta las 4 fases en orden.
Cada fase: plan → ejecutar → npx tsc -b → npm run build → esperar aprobacion.
No tocar: docs/ manualmente, pricing B2B, PDF ficha medica, edge functions existentes.
Empezar por Fase 1 item 1: reemplazar especialidades vet.
```
