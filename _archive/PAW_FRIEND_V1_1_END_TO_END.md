# Paw Friend v1.1 — Plan Integral End-to-End

> **Documento unico consolidado**: INDEX + OWNERS + VETS + MOBILE.
> Todos los flujos, todos los dolores, todas las fases, un solo archivo.
> Basado en auditoria real del repo al 2026-04-10.
> Deadline: lunes 2026-04-13 (15 vets reales entran a usar la app).

---

## TABLA DE CONTENIDOS

1. [Contexto y objetivo real](#1-contexto)
2. [Personas: Maria Constanza y Dr. Matias](#2-personas)
3. [Estado actual verificado del repo](#3-estado-actual)
4. [Principios no negociables](#4-principios)
5. [Semaforos de decision](#5-semaforos)
6. [BLOQUE A — Bloqueadores tecnicos (12 items)](#6-bloque-a)
7. [BLOQUE B — Flujos del dueno (5 dolores)](#7-bloque-b)
8. [BLOQUE C — Flujos del vet (5 dolores)](#8-bloque-c)
9. [BLOQUE D — Consolidacion mobile (13 fases)](#9-bloque-d)
10. [BLOQUE E — Onboarding dueno en 3 minutos](#10-bloque-e)
11. [BLOQUE F — Onboarding vet en 3 minutos](#11-bloque-f)
12. [BLOQUE G — Dashboards ideales](#12-bloque-g)
13. [BLOQUE H — Reglas UX estrictas](#13-bloque-h)
14. [Orden de ejecucion por sesion](#14-sesiones)
15. [Checklist final lunes](#15-checklist)
16. [Lo que NO entra a v1.1](#16-no-entra)
17. [Migraciones SQL consolidadas](#17-migraciones)
18. [Edge Functions nuevas](#18-edge-functions)

---

# 1. CONTEXTO Y OBJETIVO REAL <a id="1-contexto"></a>

**Que pasa el lunes**: 15 veterinarios recien egresados entran a usar y difundir Paw Friend. Cada uno atiende ~12 consultas/dia. Si quedan satisfechos, cada uno difunde a 20-50 colegas. Si quedan decepcionados, es un freno permanente.

**Que NO es este sprint**: construir 50 features. Es aterrizar la experiencia de 2 personas reales (dueno + vet) para que se sientan comodos, profesionales y aliviados.

**Metrica de exito real**: Los 15 vets pudieron crear cuenta, crear su primera ficha de paciente, el dueno recibio la invitacion y la acepto, pudieron escanear el QR y ver la ficha completa, y se sintieron orgullosos de la app.

---

# 2. PERSONAS <a id="2-personas"></a>

## Maria Constanza Rodriguez — Duena, 34, Nunoa

- Tiene a Luna (perra mestiza, 6 anos, esterilizada, 18kg)
- Customer Success Manager, trabaja desde casa
- No es tecnica — abandona apps complicadas (abandono TikTok, Notion)
- Mala memoria para fechas medicas
- Le da verguenza preguntar al vet a las 22:00 un domingo
- **Necesita una app que la libere de pensar, no que le agregue carga mental**

### Lo que Maria SI quiere
- Ver de un vistazo si Luna esta bien
- Que le avisen cuando es la proxima vacuna
- Tener todo el historial medico en un lugar
- Poder preguntar algo medico rapido sin sentirse tonta
- Encontrar un buen vet cerca
- Que el vet pueda ver el historial cuando llega a consulta
- Saber cuanto va a costar antes de ir al vet

### Lo que Maria NO quiere
- Notificaciones de ranking, niveles, puntos
- 8 categorias de servicios diferentes
- Avatar customizer y colores
- Feed social con likes como Instagram
- Tutoriales de 6 pantallas

## Dr. Matias Reyes Soto — Vet, 27, recien titulado

- Reg. Colmevet 21XXX (emitido hace 2 meses)
- Trabaja en clinica de barrio (mananas) + servicio a domicilio (tardes)
- Gana ~$800.000 brutos/mes — necesita 50-100 pacientes regulares
- Nativo digital: WhatsApp Business, Instagram, Google Calendar
- Toma notas en papel durante consulta (no le gusta tipear frente al dueno)
- Pasa apuntes al computador despues: 30-45 min/dia de admin gratis
- Olvida seguimientos post-operatorios
- Tiene 0 pacientes propios, 0 reviews, 0 reputacion
- **Necesita ahorro de tiempo, reputacion rapida y primeros pacientes**

### Lo que Matias SI quiere
- Crear paciente en < 1 minuto
- Ver historial clinico al escanear QR (3 segundos)
- Plantillas pre-cargadas de notas clinicas
- Sincronizacion Google Calendar
- Recordatorios automaticos para post-ops
- Perfil publico que construya reputacion
- Reviews verificadas que se acumulen rapido
- Comunicacion con pacientes que NO sea WhatsApp personal

### Lo que Matias NO quiere
- Onboardings de 10 pasos
- Llenar formularios largos
- Notificaciones de gamification
- Aprender un sistema nuevo de gestion clinica

---

# 3. ESTADO ACTUAL VERIFICADO DEL REPO <a id="3-estado-actual"></a>

Verificado contra el codigo real al 2026-04-10:

### Gates tecnicos
| Gate | Resultado |
|---|---|
| `npx tsc -b` | 0 errores |
| `npm run build` | pasa, ~19s |
| Bundle principal | 372 kB / 117 kB gzip |
| Migraciones SQL | 67 archivos aplicados |
| Edge functions | 22 activas |
| RLS | 31+ tablas con RLS activo |

### Features que YA EXISTEN (no reconstruir)

| Feature | Estado | Archivos clave |
|---|---|---|
| Recordatorios con 12 tipos | Vivo | `pet_reminders`, `src/hooks/useReminders.tsx` |
| Asistente IA `pet-assistant` (5/dia) | Vivo | `supabase/functions/pet-assistant/` |
| Ficha clinica PDF descargable | Vivo | `supabase/functions/generate-medical-summary/` |
| ZIP documentos medicos | Vivo | `supabase/functions/generate-medical-zip/` |
| Directorio publico vets con SEO | Vivo | `src/pages/DirectorioVets.tsx` |
| Estimador precios por comuna | Vivo | `src/pages/PreciosVeterinarios.tsx` |
| Reviews verificadas (5 tablas) | Vivo | `service_reviews`, `vet_reviews`, `review_invitations` |
| Notas clinicas vet | Vivo | `vet_clinical_notes`, `src/hooks/useVetClinicalNotes.ts` |
| Plantillas consulta (5 del sistema) | Vivo | `consultation_templates`, `src/hooks/useConsultationTemplates.ts` |
| Memorial con bereavement-assistant | Vivo | `supabase/functions/bereavement-assistant/` |
| Paw Game (20 misiones, 18 rewards) | Vivo | `src/pages/PawGame.tsx` |
| Google Calendar OAuth | Vivo | `supabase/functions/google-calendar-*` |
| Admin panel (13 tabs) | Vivo | `src/pages/Admin.tsx` |
| 25 tipos de registro medico | Vivo | `src/lib/medicalRecordTypes.ts` |
| 8 especies con autocompletado razas | Vivo | `src/lib/breeds.ts` |
| Catalogo vacunas por especie | Vivo | `src/lib/vaccines.ts` |
| Onboarding dueno minimal | Vivo | `src/pages/OnboardingDuenoMinimal.tsx` |
| Onboarding vet minimal | Vivo | `src/pages/OnboardingVetMinimal.tsx` |
| QR Landing con deteccion de rol | Vivo | `src/pages/QRLanding.tsx` |
| Lista pacientes vet | Vivo | `src/components/provider/VetPatientsList.tsx` |
| Form nuevo paciente vet | Vivo | `src/components/provider/NewPatientForm.tsx` |
| Edge function invitacion mascota | Vivo | `supabase/functions/send-pet-invitation/` |
| OCR carnet vacunacion | Vivo | `supabase/functions/ocr-vaccination-card/` |
| Reportes semanales dueno/vet | Vivo | `generate-weekly-owner-reports`, `generate-weekly-vet-reports` |

**Regla critica**: ANTES de implementar algo, buscarlo con grep en `src/`, `supabase/migrations/`, `supabase/functions/`. Casi siempre ya existe.

---

# 4. PRINCIPIOS NO NEGOCIABLES <a id="4-principios"></a>

### 4.1 No construyas lo que ya existe
El barrido confirma que la mayoria de features ya estan. El trabajo es alinear, no reconstruir.

### 4.2 No abrumar al usuario
Cada decision de UI pasa este test: "Esto le ayuda a Maria/Matias a resolver su dolor en 1 paso o le agrega 1 mas?" Si agrega un paso, se elimina o se esconde.

### 4.3 El lunes es linea dura
3 dias. 15 vets reales. Solo bugs bloqueadores, flujos rotos, cosas que asusten al primer uso, y el flujo critico vet-dueno (QR + crear paciente + invitar).

### 4.4 Joya de la corona intocable
Ficha medica PDF + directorio publico de vets. Solo fixes puntuales, nada de refactor grande.

### 4.5 Migraciones SQL no se aplican automaticamente
Generar archivo en `supabase/migrations/`. Pedro las aplica manualmente.

### 4.6 Copy en espanol chileno
Tuteo (tu, tienes, puedes). Terminos: "comuna", "ficha clinica", "recordatorio", "Paw Friend".

### 4.7 Pagos con Flow.cl
No Webpay. Edge function `flow-create-subscription`.

### 4.8 Tiempo del vet es sagrado
Cada segundo que la app le quita es 1/12 de un paciente perdido. Si una feature le ahorra tiempo, va. Si le quita, no.

---

# 5. SEMAFOROS DE DECISION <a id="5-semaforos"></a>

### VERDE — Hazlo sin preguntar
- Bug que rompe un flujo (clic no responde, pagina vacia, error en consola)
- Copy con falta de ortografia o voseo argentino
- Color que rompe la paleta purple
- Componente sin loading/empty state
- Form sin validacion

### AMARILLO — Pregunta a Pedro
- Cambios en `pets`, `vet_clinical_notes`, `medical_records`, `service_reviews`
- Modificacion a edge functions de IA
- Cambios en flujo de pagos Flow
- Agregar ruta nueva visible al usuario
- Agregar tabla nueva a la BD

### ROJO — NO LO HAGAS
- Tocar `docs/` manualmente
- Aplicar migraciones SQL automaticamente
- Refactorizar ficha clinica PDF o directorio vets
- Agregar libreria pesada (>50kB) sin justificacion
- Cambiar Flow por otro proveedor
- Pegar API keys en codigo

---

# 6. BLOQUE A — BLOQUEADORES TECNICOS <a id="6-bloque-a"></a>

Estos son independientes del enfoque de dolores. Hay que arreglarlos porque rompen la primera impresion.

| # | Bloqueador | Prioridad | Tiempo est. | Impacto |
|---|---|---|---|---|
| A1 | OAuth Google muestra ID crudo Supabase | CRITICA | Config manual Pedro | Maria se asusta y abandona |
| A2 | `/chat` carga vacia | CRITICA | 1h | Flujo roto |
| A3 | Validacion fecha nacimiento por especie | CRITICA | 1h | Bug critico |
| A4 | Sincronizacion vet-dueno QR | CRITICA | 4h | Flujo critico lunes |
| A5 | QR escaneable no existe | CRITICA | 2h | Flujo critico lunes |
| A6 | Sidebar no sticky | ALTA | 2h | UX rota |
| A7 | Layout `/auth` desperdicia desktop | ALTA | 2h | Primera impresion |
| A8 | Modal "Ofrecer servicios" descoordinado | MEDIA | 30min | Confusion |
| A9 | Paleta marron en perfiles vet | MEDIA | 1h | Marca rota |
| A10 | Datos demo visibles (DEMO001) | MEDIA | 30min | Quick win |
| A11 | Reviews "0.0 (30 resenas)" imposibles | MEDIA | 30min | Credibilidad |
| A12 | Sistema de reviews — verificar si ya existe | BAJA | Auditoria | Probablemente ya esta |

### A1 — OAuth Google (requiere config manual de Pedro)

**Problema**: `window.location.origin` devuelve `gwailbjlvevkhwcrovfd.supabase.co` y Maria ve el ID crudo.

**Mitigacion inmediata (codigo)**:
1. Cambiar orden en `/auth`: email magic link primero, Google como alternativa
2. Agregar disclaimer debajo del boton Google
3. Documentar redirect URI para custom domain

**Solucion real (Pedro manual)**:
1. Google Cloud Console > Credentials > configurar redirect URI con custom domain
2. Supabase Dashboard > Auth > configurar custom domain
3. Verificar flujo completo

### A2 — Chat vacio

**Problema**: `/chat` carga sin layout completo.

**Accion**: Auditar `src/pages/Chat.tsx` y `src/pages/ChatConversation.tsx`. Verificar que:
- Empty state muestra "Aun no tienes conversaciones"
- Hay CTA para iniciar chat con vet
- Layout es consistente con el resto de la app

### A3 — Validacion fecha nacimiento

**Problema**: Se puede poner 1995 como nacimiento de un perro.

**Accion**: En `src/pages/AddPet.tsx` y `src/pages/EditPet.tsx`, agregar validacion por especie:
```
perro/gato: max 25 anos
conejo: max 15 anos
hamster: max 5 anos
tortuga: max 150 anos
ave: max 80 anos
pez: max 30 anos
otro: max 50 anos
```

### A4-A5 — QR y sincronizacion vet-dueno

**Estado actual verificado**:
- `src/pages/QRLanding.tsx` YA EXISTE con deteccion de rol (vet/dueno/otro)
- `src/components/provider/NewPatientForm.tsx` YA EXISTE
- `src/components/provider/VetPatientsList.tsx` YA EXISTE
- `supabase/functions/send-pet-invitation/` YA EXISTE

**Accion**: Auditar estos archivos. Verificar que el flujo completo funciona end-to-end:
1. Vet crea paciente con email del dueno
2. Email de invitacion llega al dueno
3. Dueno acepta y mascota se vincula
4. Vet puede ver ficha del paciente
5. QR se genera al crear mascota
6. QR redirige correctamente segun rol

Si alguno de estos pasos falla, completar lo que falta.

### A6 — Sidebar sticky

**Accion**: En `src/components/AppSidebar.tsx`, asegurar `position: sticky; top: 0; height: 100vh; overflow-y: auto`.

### A7 — Auth split layout

**Accion**: En `src/pages/Auth.tsx`, implementar layout 50/50 en desktop:
- Izquierda: imagen/branding con propuesta de valor
- Derecha: formulario de login/registro

### A8 — Modal servicios descoordinado

**Accion**: Revisar modal "Ofrecer servicios" y asegurar coherencia con el flujo de registro de proveedor.

### A9 — Paleta marron

**Accion**: Buscar todos los colores marron/amber/brown en componentes de perfil vet y reemplazar con purple del design system.

### A10 — Datos demo

**Accion**: `grep -rn "DEMO001\|demo.*data\|mock.*vet" src/` y eliminar referencias visibles.

### A11 — Reviews imposibles

**Accion**: Cuando `review_count === 0`, mostrar "Sin resenas aun" en lugar de "0.0 (0 resenas)".

---

# 7. BLOQUE B — FLUJOS DEL DUENO (5 dolores) <a id="7-bloque-b"></a>

## B1 — Costo y opacidad de precios vet

**Dolor**: Maria no sabe cuanto va a costar antes de ir al vet.

**Ya existe**: Estimador por comuna (`/precios-veterinarios`), directorio con precios.

**Lo que falta**: Discoverability desde el dashboard.

**Tareas**:
1. Card "Cuanto cuesta una consulta?" en dashboard del dueno (solo si usuario creado hace < 7 dias)
2. Badge prominente "Consultas desde $X" en perfil publico del vet
3. Verificar que estimador funciona correctamente

**Regla**: Una sola card discreta con 1 CTA "Ver precios en mi comuna".

---

## B2 — Olvido de vacunas y citas

**Dolor**: Maria se entera tarde de que Luna necesita vacuna.

**Ya existe**: `pet_reminders` (12 tipos), `/reminders`, catalogo vacunas por especie, `reminder-cron`, Google Calendar OAuth.

**Lo que falta**:
1. Trigger en BD que autocree recordatorios al agregar mascota nueva
2. Card en dashboard con proximo recordatorio prominente
3. Verificar que `reminder-cron` esta activo como cron job en Supabase

**Tareas**:

**Tarea B2.1** — Migracion auto-creacion recordatorios (ver Seccion 17).

**Tarea B2.2** — Card proximo recordatorio en dashboard:
```
Si tiene recordatorio proximo:
  [icono calendario] Proxima atencion de Luna
  Antirrabica anual - en 23 dias
  [Ver detalles ->]

Si esta vencido (rojo):
  [icono alerta] Luna tiene atencion pendiente
  Antirrabica anual - vencido hace 5 dias
  [Agendar ahora ->]

Si esta al dia (verde):
  [icono check] Luna esta al dia
  No hay recordatorios proximos
```

**Tarea B2.3** — Instrucciones para Pedro activar cron:
```
Supabase Dashboard > Database > Cron jobs
Nombre: reminder-cron-daily
Schedule: 0 9 * * * (9 AM Chile diario)
Funcion: reminder-cron
```

**Regla**: Un solo recordatorio visible en dashboard. Lista completa en `/reminders`.

---

## B3 — "Mi mascota esta rara, no se si es grave"

**Dolor**: Domingo 22:00, Luna esta decaida, Maria no sabe si es urgencia.

**Ya existe**: `pet-assistant` (5/dia), `medical-suggestions`, componentes en `src/components/ai/`.

**Lo que falta**:
1. Triage de urgencias en 3 niveles (verde/amarillo/rojo)
2. UI distintiva por nivel de urgencia
3. Disclaimer modal de primera vez
4. Visibilidad del asistente desde mas lugares

**Tareas**:

**Tarea B3.1** — Auditar `pet-assistant` actual:
- Verificar si ya tiene clasificacion de urgencia en system prompt
- Verificar si devuelve campo `urgency_level`
- Verificar disclaimer en cada respuesta

**Tarea B3.2** — Modificar system prompt para incluir triage:
- `green`: no urgente, observar en casa
- `yellow`: consulta veterinaria en 24-48h
- `red`: URGENCIA, llevar al vet inmediatamente

Para urgencias rojas incluir:
- Frase clara: "Esto puede ser una urgencia veterinaria"
- Botones: "Ver clinicas 24h cerca de mi" / "Llamar a mi vet de cabecera"

**Tarea B3.3** — UI por nivel:
- Verde: fondo green-50, icono Info
- Amarillo: fondo amber-50, icono AlertTriangle
- Rojo: fondo red-50, borde doble, icono AlertCircle con pulse

**Tarea B3.4** — Disclaimer modal primera vez:
```
Soy un asistente de inteligencia artificial. Quiero ser claro:
- No reemplazo a un veterinario real
- Si tu mascota tiene sintomas graves, llevala al vet de inmediato
- Mis sugerencias son orientativas, no diagnosticos
[Entendido, empezar]
```

**Regla**: Boton siempre accesible en ficha clinica. Respuestas breves (3-4 frases). Disclaimer permanente al final de cada respuesta.

---

## B4 — Historial clinico disperso

**Dolor**: Cuando Maria cambia de vet, el nuevo no tiene informacion de Luna.

**Ya existe**: `medical_records` (25 tipos), `medical_documents`, `medical_share_tokens`, PDF, ZIP, ficha con 5 tabs, `QRLanding.tsx`.

**Lo que falta**: Que Maria sepa COMO darle el historial al vet nuevo.

**Tareas**:

**Tarea B4.1** — Hacer boton "Compartir con mi vet" prominente en ficha clinica:
```
[Compartir con mi veterinario]  [Descargar PDF]
```

**Tarea B4.2** — Tab "Compartir" en ficha clinica con 3 opciones claras:

1. **QR de Luna** (opcion principal):
   - "Muestra este codigo a tu veterinario y podra ver el historial completo en 3 segundos"
   - QR grande centrado
   - Botones: Descargar / Imprimir / Compartir

2. **Link temporal** (30 dias):
   - "Genera un link para enviar por WhatsApp o email"
   - Boton: Crear link de 30 dias

3. **PDF descargable**:
   - "Si tu vet no usa Paw Friend, descarga e imprime la ficha"
   - Boton: Descargar PDF

**Regla**: 3 opciones en orden de preferencia (QR > link > PDF). NO refactorizar el PDF (joya de la corona).

---

## B5 — "No se que vet elegir"

**Dolor**: Maria necesita vet nuevo pero Google Maps tiene 4 resenas de hace 5 anos.

**Ya existe**: Directorio publico con SEO, filtros por comuna/especialidad, perfil publico con slug, reviews verificadas, estimador precios.

**Lo que falta**: Los 15 vets nuevos no tendran reviews al principio.

**Tareas**:

**Tarea B5.1** — Seccion "Veterinarios nuevos en Paw Friend" en directorio:
```sql
SELECT * FROM vet_profiles
WHERE created_at > NOW() - INTERVAL '90 days'
  AND is_active = TRUE
ORDER BY created_at DESC
LIMIT 10;
```

**Tarea B5.2** — Badge "Nuevo en Paw Friend" en perfil vet (si created_at < 90 dias).

**Tarea B5.3** — Texto cuando 0 reviews:
```
Veterinario recien egresado
Aun no tiene resenas en Paw Friend. Esta construyendo su reputacion
atendiendo nuevos pacientes con tarifas accesibles.
```
Esto convierte la ausencia de reviews en oportunidad.

**Tarea B5.4** — Card en dashboard dueno (si no tiene vet asignado):
```
Buscando veterinario para Luna?
Tenemos veterinarios verificados en Nunoa con resenas reales.
[Ver directorio ->]
```

**Regla**: NO mostrar 100 vets en dashboard. Una card discreta con CTA.

---

# 8. BLOQUE C — FLUJOS DEL VET (5 dolores) <a id="8-bloque-c"></a>

## C1 — "Cada paciente nuevo llega sin historial" (CRITICO LUNES)

**Dolor**: Matias recibe paciente nuevo y pasa 8-10 minutos haciendo preguntas basicas que deberian estar en una ficha.

**Ya existe (verificado en repo)**:
- `src/components/provider/NewPatientForm.tsx` — form de nuevo paciente
- `src/components/provider/VetPatientsList.tsx` — lista mis pacientes
- `src/pages/QRLanding.tsx` — QR con deteccion de rol
- `supabase/functions/send-pet-invitation/` — email de invitacion
- Tabla `pets` con campo `qr_token`
- Tabla `vet_clinical_notes`

**Accion**: Auditar flujo completo end-to-end y completar lo que falta:

### Flujo completo esperado

**Caso A — Dueno YA tiene cuenta Paw Friend**:
1. Maria abre app, va a ficha de Luna, muestra QR
2. Matias escanea QR (o abre `/qr/[token]`)
3. Sistema detecta que Matias es vet verificado
4. Matias ve ficha completa de Luna en 3 segundos
5. Se registra relacion vet-mascota automaticamente

**Caso B — Dueno NO tiene cuenta**:
1. Matias va a "Nuevo paciente" en su dashboard
2. Llena 5 campos obligatorios + email del dueno
3. Click "Crear ficha y enviar invitacion"
4. Sistema crea mascota con `pending_owner_email`
5. Email llega al dueno con magic link
6. Dueno acepta, crea cuenta, mascota se vincula automaticamente
7. Matias ya puede tomar notas en la ficha

### Verificacion necesaria

```bash
# Verificar tablas de relacion vet-mascota
grep -rn "vet_pet_relationship" supabase/migrations/
# Verificar campo pending_owner_email en pets
grep -rn "pending_owner_email" supabase/migrations/
# Verificar edge function de invitacion
cat supabase/functions/send-pet-invitation/index.ts
# Verificar NewPatientForm completo
cat src/components/provider/NewPatientForm.tsx
```

Si alguna pieza falta, ver Seccion 17 (migraciones) para el SQL necesario.

### Migracion necesaria (si no existe)

Ver `20260411000001_vet_patient_sync.sql` en Seccion 17.

**Regla**: 5 campos obligatorios + email del dueno. Todo lo demas es opcional.

---

## C2 — "30-40% de mi dia es admin"

**Dolor**: Matias pasa 1.5 horas/dia pasando apuntes en papel al computador.

**Ya existe**:
- `vet_clinical_notes` con campo `alternatives_discussed`
- `consultation_templates` con 5 plantillas del sistema
- `src/hooks/useVetClinicalNotes.ts`
- `src/hooks/useConsultationTemplates.ts`
- Edge function `medical-suggestions` (30/h)

**Lo que falta**: UI completa de "agregar nota clinica" con selector de plantillas.

**Tareas**:

**Tarea C2.1** — Auditar UI existente:
```bash
grep -rn "NewClinicalNote\|ClinicalNoteForm\|AddClinicalNote" src/
```

**Tarea C2.2** — Componente "Nueva nota clinica" (si no existe):
- Selector de plantilla rapida (5 opciones)
- Campos: motivo consulta (obligatorio), observaciones, diagnostico, tratamiento, alternativas discutidas
- Checkbox "Requiere seguimiento" con fecha y motivo
- Si requiere seguimiento: auto-crear recordatorio para dueno Y vet

**Tarea C2.3** — Campo "Alternativas discutidas":
- Help text: "El 73% de duenos dice nunca recibir alternativas. Documenta las opciones que discutiste."
- Esto cierra el gap documentado en la estrategia

**Regla**: Todos los campos opcionales excepto motivo. Guardado instantaneo. Trigger de followup automatico.

---

## C3 — "Olvido seguimientos post-operatorios"

**Dolor**: Matias opera el lunes, dice "vuelve en 10 dias", olvida llamar. El dueno pierde confianza.

**Ya existe**: `pet_reminders`, `reminder-cron`, Google Calendar.

**Lo que falta**:
1. Trigger automatico de recordatorio cuando vet marca "requiere seguimiento" en nota clinica
2. Vista "Seguimientos pendientes" en dashboard vet
3. Notificacion al vet 2 dias antes

**Tareas**:

**Tarea C3.1** — Migracion trigger followup (ver Seccion 17, `20260411000002`).

**Tarea C3.2** — Card "Seguimientos esta semana" en dashboard vet:
```
Seguimientos esta semana (2):
  Rocco - Retiro de puntos - manana    [Recordar al dueno] [Ver ficha]
  Luna - Control post-vacuna - miercoles [Recordar al dueno] [Ver ficha]
```
Solo proximos 7 dias. Ocultar si no hay pendientes.

**Regla**: NO mostrar todos los seguimientos (1 ano). Solo proximos 7 dias con acciones rapidas.

---

## C4 — "No tengo primeros pacientes"

**Dolor**: Matias tiene 3 pacientes propios al mes. Necesita 50 para ser sustentable.

**Ya existe**: Directorio publico con SEO, filtros, reviews verificadas, verificacion Colmevet.

**Lo que falta**:
1. Boost a vets nuevos (cubierto en B5)
2. Auto-invitar review post-consulta
3. Visibilidad del perfil desde ficha del paciente

**Tareas**:

**Tarea C4.1** — Boost nuevos: ya cubierto en B5 (seccion "Veterinarios nuevos").

**Tarea C4.2** — Migracion auto-invitacion de review (ver Seccion 17, `20260411000003`):
- Trigger: despues de cada `INSERT` en `vet_clinical_notes`
- Crea entrada en `review_invitations` para el dueno
- Cron envia email de review 24h despues

**Tarea C4.3** — Email de bienvenida a los 15 vets:
```
Asunto: Bienvenido a Paw Friend, Dr. [Nombre]

Eres uno de los 15 veterinarios que estamos destacando los proximos 90 dias.
Tu perfil aparece en seccion "Veterinarios nuevos".
Cada consulta genera invitacion automatica de review.
En 90 dias deberias tener 10-30 reviews verificadas.

Consejo:
1. Completa perfil al 100%
2. Sube foto profesional
3. Escribe bio empatica de 200 chars
4. Define especialidades y zonas
5. Sube titulo Colmevet para verificacion
```

**Regla**: Honestidad sobre expectativas. No sobrevender.

---

## C5 — "Llamados telefonicos rutinarios me consumen"

**Dolor**: 10 de 15 llamadas diarias podrian ser un mensaje.

**Ya existe**: Chat (`/chat`), perfil publico del vet.

**Lo que falta**:
1. Seccion "Como contactarme" en perfil vet
2. Respuestas rapidas pre-cargadas en chat
3. FAQ en perfil vet (opcional, v1.1.1 si no llegamos)

**Tareas**:

**Tarea C5.1** — Bloque "Como contactarme" en perfil publico vet:
```
Chat: preguntas no urgentes (respondo 9-19h)
Llamada: solo urgencias reales (24/7 para pacientes activos)
```

**Tarea C5.2** — Respuestas rapidas en chat del vet (5 pre-cargadas):
- "En horario laboral te respondo. Si es urgencia, llamame"
- "Para esa duda, te recomiendo agendar consulta"
- "Puedes mandarme una foto?"
- "Llega 10 minutos antes de tu hora"
- "Recuerda traer carnet de vacunas"

**Regla**: NO obligar al vet a configurar FAQ completo. Respuestas rapidas opcionales.

---

# 9. BLOQUE D — CONSOLIDACION MOBILE <a id="9-bloque-d"></a>

Objetivo: dejar la app 100% funcional en iOS y Android via Capacitor 7 sin romper la web.

### Estado actual mobile
- Android: directorio `android/` existe, compilable
- iOS: `@capacitor/ios` en package.json pero NO existe directorio `ios/`
- Plugins nativos: solo `@codetrix-studio/capacitor-google-auth`
- OAuth Google: forzado a web flow (`FORCE_WEB_OAUTH = true`)
- Descargas/PDF: usan `window.open()` (no funciona en nativo)
- Links externos: usan `target="_blank"` (sale de la app en nativo)

### D1 — Instalar plugins Capacitor (PREREQUISITO)

```bash
npm install @capacitor/app @capacitor/browser @capacitor/filesystem @capacitor/share @capacitor/device @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/haptics @capacitor/clipboard @capacitor/push-notifications
npx cap sync
npx cap add ios
npx cap sync ios
```

Agregar a `capacitor.config.ts`:
```typescript
ios: { contentInset: 'automatic', backgroundColor: '#8B5CF6' },
plugins: {
  // ...mantener existente + agregar:
  PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
}
```

### D2 — Helper de plataforma

Crear `src/lib/platform.ts`:
```typescript
import { Capacitor } from '@capacitor/core';
export const isNative = () => Capacitor.isNativePlatform();
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isWeb = () => Capacitor.getPlatform() === 'web';
```

Crear `src/lib/native-navigation.ts`:
```typescript
import { Browser } from '@capacitor/browser';
import { isNative } from './platform';

export async function openExternalUrl(url: string) {
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
```

### D3 — Arreglar descargas de archivos (CRITICO)

Crear `src/lib/native-download.ts`:
- En web: `window.open(url, '_blank')`
- En nativo: `fetch` > `Filesystem.writeFile` (base64, Directory.Cache) > `Share.share`
- Con toast de progreso y manejo de errores

Actualizar todos los `window.open(url, '_blank')` de descarga en:
- `src/components/medical/MedicalDocumentsTab.tsx`
- Cualquier otro componente que descargue archivos

### D4 — Arreglar generacion PDF en nativo (CRITICO)

En `src/pages/PetClinicalRecord/pdf.ts`:
- Web: mantener flujo actual (`window.open` + `document.write` + `window.print`)
- Nativo: generar HTML > `Filesystem.writeFile` > `Share.share`

**NO refactorizar** la generacion del HTML. Solo bifurcar la salida.

### D5 — Arreglar OAuth en nativo (CRITICO)

**Google Auth** (`src/hooks/useGoogleAuth.tsx`):
1. Cambiar `FORCE_WEB_OAUTH = true` a `false`
2. El hook ya tiene logica para flujo nativo — solo esta deshabilitado
3. Prerequisitos manuales: SHA-1 en Google Cloud Console (Android), URL scheme en Xcode (iOS)

**Facebook Auth** (`src/hooks/useFacebookAuth.tsx`):
- Fix `redirectTo`: usar deep link en nativo (`cl.pawfriend.app://auth/callback`)

**Deep links**:
- Android: verificar intent-filter con scheme `cl.pawfriend.app` en AndroidManifest.xml
- iOS: agregar URL scheme `cl.pawfriend.app` en Info.plist
- Listener en `src/App.tsx`:
```typescript
import { App as CapApp } from '@capacitor/app';
if (isNative()) {
  CapApp.addListener('appUrlOpen', ({ url }) => {
    const slug = url.split('cl.pawfriend.app://').pop();
    if (slug) window.location.href = '/' + slug;
  });
}
```

### D6 — Links externos con InAppBrowser

Buscar todos los `target="_blank"` en `src/` y reemplazar con `openExternalUrl()` para nativo:
- `AdminVetVerifications.tsx` — link colegioveterinario.cl
- `AdminVerificationRequests.tsx` — links a documentos PDF
- `TermsOfService.tsx`, `PrivacyPolicy.tsx` — links legales

### D7 — Teclado y formularios

Verificar que formularios criticos no queden ocultos bajo teclado:
- `Auth.tsx`, `AddPet.tsx`, `EditPet.tsx`, `ReviewForm.tsx`, `AddMedicalRecordForm.tsx`, `RegistroVeterinario.tsx`

Si algun formulario queda oculto, agregar `scrollIntoView` en `keyboardWillShow`.

### D8 — StatusBar y SplashScreen

En `App.tsx` useEffect (solo si nativo):
```typescript
StatusBar.setBackgroundColor({ color: '#8B5CF6' });
StatusBar.setStyle({ style: Style.Dark });
SplashScreen.hide();
```

Assets: usar `npx capacitor-assets generate` con iconos 1024x1024 en `assets/`.

### D9 — Push Notifications (base)

1. Registrar en App.tsx: `PushNotifications.requestPermissions()` > `register()`
2. Listener `registration`: guardar token en `profiles.push_token`
3. Listener `pushNotificationReceived`: toast info
4. Listener `pushNotificationActionPerformed`: navegar segun `data.route`
5. Android: Firebase `google-services.json`
6. iOS: APNs key en Apple Developer + Firebase

### D10 — Back button Android

```typescript
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) window.history.back();
  else CapApp.exitApp();
});
```

### D11 — Bundle optimization mobile

- Verificar lazy loading de Recharts (458 kB) y Leaflet
- Preload de rutas criticas: Home, MyPets, MedicalRecords
- Comprimir imagenes >100kB en `src/assets/` a WebP

### D12 — Scripts npm para mobile

```json
{
  "cap:sync": "npm run build && npx cap sync",
  "ios:run": "npx cap run ios",
  "ios:open": "npx cap open ios",
  "android:open": "npx cap open android",
  "android:build": "npm run build && npx cap sync android && cd android && ./gradlew assembleRelease",
  "assets:generate": "npx capacitor-assets generate --iconBackgroundColor '#8B5CF6' --splashBackgroundColor '#8B5CF6'"
}
```

### D13 — Verificacion final mobile

```bash
npx tsc -b          # 0 errores
npm run build        # sin errores, <350kB main chunk
npx cap sync         # sin errores
npx cap run android  # testar en emulador
npx cap run ios      # testar en simulador (requiere macOS)
```

### Prioridad mobile

| Prioridad | Fase | Impacto |
|---|---|---|
| CRITICA | D1 Plugins + iOS | Prerequisito de todo |
| CRITICA | D2 Helper plataforma | Base para bifurcaciones |
| CRITICA | D3 Descargas | Sin esto no funcionan documentos |
| CRITICA | D4 PDF nativo | Joya de la corona en mobile |
| CRITICA | D5 OAuth nativo | Sin esto no hay login |
| ALTA | D6 Links externos | UX rota sin esto |
| ALTA | D10 Back button | UX basica Android |
| MEDIA | D7-D9 | Pulido |
| BAJA | D11-D13 | Optimizacion y DX |

---

# 10. BLOQUE E — ONBOARDING DUENO EN 3 MINUTOS <a id="10-bloque-e"></a>

**Nota**: `OnboardingDuenoMinimal.tsx` ya existe. Verificar que cumple con este flujo.

### Paso 1 — Cuenta (30 segundos)
- Email magic link (sin advertencias de Google)
- Confirmacion instantanea
- Bienvenida visual con nombre real

### Paso 2 — Primera mascota (60 segundos)
**Solo 5 campos obligatorios**:
1. Foto (puede saltarse, default avatar morado con inicial)
2. Nombre
3. Especie (dropdown 8 opciones)
4. Raza (autocomplete con razas top Chile)
5. Edad aproximada (dropdown ano + mes)

**Todo lo demas es "Datos opcionales (editar despues)".**

### Paso 3 — Recordatorios automaticos (instantaneo)
Al guardar mascota, toast:
```
Luna agregada
Creamos 4 recordatorios automaticos segun su edad y especie:
- Antirrabica anual (proxima: 1 mayo)
- Sextuple anual
- Antiparasitario interno
- Control general
```

### Paso 4 — Tour rapido (60 segundos, skipeable)
Tooltips en elementos clave del dashboard:
1. "Aca ves el estado de Luna"
2. "Aca ves su proximo recordatorio"
3. "Aca puedes preguntarle al asistente IA"
4. "Aca ves su ficha clinica completa"
5. "Aca buscas veterinarios cerca de ti"

**Total maximo: 3 minutos.**

---

# 11. BLOQUE F — ONBOARDING VET EN 3 MINUTOS <a id="11-bloque-f"></a>

**Nota**: `OnboardingVetMinimal.tsx` ya existe. Verificar que cumple.

### Paso 1 — Cuenta (30 segundos)
- Email magic link
- Seleccionar "Soy veterinario"

### Paso 2 — Perfil profesional (90 segundos)
**Solo 5 campos obligatorios**:
1. Nombre completo
2. Registro Colmevet (formato XX.XXX)
3. Especialidades (multi-select de 31 opciones)
4. Comuna principal de atencion
5. Bio corta (min 50 chars)

**Opcionales**: foto, telefono, horarios, precios, zonas adicionales.

### Paso 3 — Upload titulo (30 segundos)
- "Sube tu titulo profesional para verificacion" (PDF/JPG/PNG)
- "Mientras verificamos, puedes empezar a usar la app"

### Paso 4 — Dashboard vacio con acciones claras
```
Bienvenido Dr. Matias
Aun no tienes pacientes.

[+ Crear mi primer paciente]   [Completar mi perfil publico]
```

**Total maximo: 3 minutos.**

---

# 12. BLOQUE G — DASHBOARDS IDEALES <a id="12-bloque-g"></a>

## Dashboard dueno (`/home`)

```
Hola Maria
Estos son los proximos cuidados de Luna

[Foto Luna]  LUNA
             Pastor Suizo - 6 anos
             Estado: Al dia (verde)

Proxima atencion de Luna:
Antirrabica anual - en 23 dias
[Ver detalles ->]

Preguntale al asistente sobre Luna
"Si esta rara, te ayudo a entender que hacer"
[Abrir asistente ->]

Ficha clinica de Luna
"Todo el historial en un lugar"
[Ver ficha ->]

Buscando veterinario?
Veterinarios verificados en Nunoa
[Ver directorio ->]
```

**4 cards, 1 por dolor real. Nada mas en primera vista.**

**LO QUE NO ESTA**: Paw Game stats, feed social, servicios P2P, ranking, achievements, avatar customizer. Eso vive en el sidebar para quien lo busque.

## Dashboard vet (`/provider/dashboard`)

```
Buenos dias Dr. Matias
Hoy tienes 4 pacientes agendados

[+ Nuevo paciente]  [Escanear QR]

Tus pacientes de hoy:
  10:00 - Luna (control vacunas) - M. Constanza
  11:30 - Rocco (post-op) - Sra. Perez
  14:00 - Mishu (consulta general) - C. Lopez
  16:00 - [Disponible]

Seguimientos esta semana (2):
  Rocco - Retiro puntos - manana
  Luna - Control vacuna - miercoles

Tu mes en Paw Friend:
  Pacientes nuevos: 8
  Consultas: 47
  Reviews: 12 (4.8 estrellas)
```

**4 secciones. Dos botones rapidos prominentes (Nuevo paciente / Escanear QR). Informacion clinica primero, metricas despues.**

**LO QUE NO ESTA**: Paw Game, feed, servicios P2P, marketing, upselling.

---

# 13. BLOQUE H — REGLAS UX ESTRICTAS <a id="13-bloque-h"></a>

### Para ambos (dueno y vet)

1. **Una sola card por dolor** — No 3 cards mostrando info parcial del mismo tema.
2. **Un solo color por estado** — Verde = bien. Amarillo = atencion. Rojo = urgente.
3. **Un solo numero por metrica** — "Al dia" o "1 atencion pendiente", no "92% salud, 3 vacunas vencidas, 2 controles".
4. **Un solo boton principal por seccion** — Botones secundarios solo si criticos.
5. **Defaults inteligentes** — Autocompletar todo lo posible. Recordatorios automaticos. Sugerencias de raza.
6. **Sin formularios largos** — Max 5 campos obligatorios. Lo demas es "Datos opcionales".
7. **Copy honesto y empatico** — "Listo, recordamos vacunarla en mayo" NO "Felicitaciones, ganaste 50 PawPoints!".

### Solo para dueno

8. **Sin notificaciones gratuitas** — Solo si: recordatorio proximo (max 1/semana), cambio importante de la mascota, mensaje del vet. NUNCA: "Como esta hoy?", "Sube de nivel".
9. **Sin gamification visible al inicio** — Paw Game aparece despues de 7 dias de uso.
10. **Sin tooltips obligatorios** — Todo skipeable.

### Solo para vet

11. **Cada interaccion en < 30 segundos** — Si requiere mas, repensar.
12. **Mobile-first en consulta** — Todo funciona en celular.
13. **Acciones rapidas siempre visibles** — "Nuevo paciente" y "Escanear QR" a 1 click.
14. **Plantillas pre-cargadas siempre** — Reducir tipeo al minimo.
15. **Sin notificaciones de gamification** — Solo clinico.

---

# 14. ORDEN DE EJECUCION POR SESION <a id="14-sesiones"></a>

### Sesion 1 — Auditoria de coincidencia (30 min)

**No codear nada.** Leer CLAUDE.md, BARRIDO, CONTEXTO, y este documento. Luego auditar cada feature "nueva" vs lo que ya existe en el codigo.

Output: tabla Feature | Estado real (EXISTE / PARCIAL / NO EXISTE) | Archivo.

### Sesion 2 — Bloqueadores tecnicos (jueves noche - viernes manana)

Orden:
1. A10 (datos demo) — quick win, 30 min
2. A3 (validacion fecha) — 1h
3. A9 (paleta marron) — 1h
4. A8 (modal descoordinado) — 30 min
5. A6 (sidebar sticky) — 2h
6. A7 (auth split layout) — 2h
7. A2 (chat vacio) — 1h
8. A11 (reviews imposibles) — 30 min

**NO tocar A1 (OAuth)** — requiere config de Pedro.
**NO tocar A4-A5 (QR vet)** — eso es sesion 4.

### Sesion 3 — OAuth (viernes manana, Pedro configura Google Cloud)

Mientras Pedro configura:
1. Cambiar orden auth methods: email magic link primero
2. Agregar disclaimer debajo boton Google
3. Documentar redirect URI nuevo

### Sesion 4 — Flujo critico vet (viernes tarde - sabado)

Trabajar C1 completo (el mas importante del lunes):
1. Auditar QRLanding, NewPatientForm, VetPatientsList, send-pet-invitation
2. Verificar flujo end-to-end caso A (dueno con cuenta) y caso B (sin cuenta)
3. Completar lo que falta
4. Crear migraciones SQL si necesarias

### Sesion 5 — Dolores del dueno (sabado tarde - domingo)

B1 al B5 en orden:
1. B1 (precios) — verificar estimador, agregar card
2. B2 (vacunas) — autocrear recordatorios, card proximo
3. B3 (urgencias) — triage en pet-assistant
4. B4 (historial) — visibilidad PDF y QR en ficha
5. B5 (encontrar vet) — boost 15 vets nuevos

### Sesion 6 — Polish y deploy (domingo)

Recorrer checklist de Seccion 15. Fix rapido por cada item fallido.

```bash
npx tsc -b
npm run build
git add docs/ && git add -u
# Commit: "feat(v1.1): sprint pre-launch — bloqueadores + flujo vet + dolores dueno"
```

### Sesion 7 — Mobile (post-lunes o en paralelo si hay tiempo)

D1 a D13 en orden de prioridad (criticas primero).

---

# 15. CHECKLIST FINAL LUNES <a id="15-checklist"></a>

## Bloqueadores tecnicos
- [ ] OAuth Google con email magic link como mitigacion
- [ ] `/chat` con layout completo y empty state
- [ ] Validacion fecha nacimiento por especie
- [ ] Sidebar sticky en todas las paginas
- [ ] Auth con split layout en desktop
- [ ] Paleta purple consistente (sin marrones)
- [ ] Datos demo (DEMO001) eliminados
- [ ] Reviews "Sin resenas aun" cuando count=0
- [ ] Modal "Ofrecer servicios" coherente

## Flujo vet critico
- [ ] Vet puede crear paciente nuevo desde su panel
- [ ] Form pide email del dueno obligatorio
- [ ] Email automatico llega al dueno con magic link
- [ ] Dueno acepta invitacion y mascota se vincula
- [ ] Vet mantiene acceso de lectura a la ficha
- [ ] QR unico por mascota se genera al crear
- [ ] Vet puede escanear QR y ver ficha en 3 segundos
- [ ] Vista "Mis pacientes" funcional
- [ ] Nota clinica con plantillas funcional
- [ ] Seguimientos pendientes visibles

## Experiencia dueno
- [ ] Dashboard muestra proximo recordatorio prominente
- [ ] Asistente IA accesible desde ficha clinica
- [ ] Asistente IA tiene disclaimer claro
- [ ] PDF de ficha clinica descarga correctamente
- [ ] Directorio de vets muestra los 15 nuevos visiblemente
- [ ] Recordatorios se autocrean al agregar mascota
- [ ] Card "Cuanto cuesta consulta?" visible para nuevos
- [ ] Tab "Compartir" con QR + link + PDF

## Pulido visual
- [ ] Sin emojis en lugar de iconos
- [ ] Sin gradientes rotos
- [ ] Sin avatares vacios por defecto
- [ ] Layouts responsive en /reminders, /my-pets, /profile
- [ ] Loading skeletons en paginas criticas
- [ ] Empty states en todas las listas vacias

## Mobile (post-lunes o en paralelo)
- [ ] Plugins Capacitor instalados
- [ ] iOS proyecto creado
- [ ] Descargas funcionan en nativo
- [ ] PDF se comparte en nativo
- [ ] OAuth funciona en nativo
- [ ] Links externos abren en InAppBrowser
- [ ] Back button Android funciona
- [ ] StatusBar y SplashScreen configurados

## Comunicacion pre-lunes
- [ ] Email de bienvenida a los 15 vets preparado
- [ ] FAQ de primeros pasos
- [ ] Pedro disponible lunes 09:00-22:00

---

# 16. LO QUE NO ENTRA A V1.1 <a id="16-no-entra"></a>

Estas cosas son interesantes pero NO van al sprint del lunes:

| Feature | Version objetivo |
|---|---|
| Asistente IA notas SOAP por voz (Whisper) | v1.2 |
| Marketplace canjes con partners | Exposicion organica |
| Modo oscuro completo | v1.2 |
| Onboarding tour guiado con tooltips | v1.2 |
| Push notifications nativas Capacitor/FCM | v1.1.1 |
| WhatsApp Cloud API en vivo | Esperando Meta Business |
| Bot FAQ para clinicas | v1.2 |
| Dual-role mode switching (dueno/vet) | v1.2 |
| Paw Rewards QR completo (ledger, canjes) | v1.2 |

**Resiste la tentacion de meterlas al sprint.**

---

# 17. MIGRACIONES SQL CONSOLIDADAS <a id="17-migraciones"></a>

Todas las migraciones nuevas necesarias. **Pedro las aplica manualmente.**

## 20260411000001_vet_patient_sync.sql

**Proposito**: Permitir sincronizacion vet-dueno por QR.
**Solo crear si las tablas/columnas NO existen ya.**

```sql
-- 1. Tipo de relacion vet-mascota
DO $$ BEGIN
  CREATE TYPE vet_pet_relationship_type AS ENUM (
    'primary_vet', 'consulting', 'emergency', 'specialist'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabla de relaciones vet-mascota
CREATE TABLE IF NOT EXISTS vet_pet_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  relationship_type vet_pet_relationship_type NOT NULL DEFAULT 'primary_vet',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vet_id, pet_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_vet_pet_rel_vet ON vet_pet_relationships(vet_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vet_pet_rel_pet ON vet_pet_relationships(pet_id) WHERE revoked_at IS NULL;

-- 3. QR token unico por mascota (si no existe)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE
  DEFAULT encode(gen_random_bytes(16), 'hex');
CREATE INDEX IF NOT EXISTS idx_pets_qr_token ON pets(qr_token);

-- 4. Campos para mascotas pendientes de dueno
ALTER TABLE pets ADD COLUMN IF NOT EXISTS pending_owner_email TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS created_by_vet_id UUID REFERENCES auth.users(id);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owner_invitation_token TEXT UNIQUE;

-- 5. RLS
ALTER TABLE vet_pet_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vets_see_their_relationships" ON vet_pet_relationships
  FOR SELECT USING (vet_id = auth.uid());

CREATE POLICY "owners_see_relationships_for_their_pets" ON vet_pet_relationships
  FOR SELECT USING (pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid()));

CREATE POLICY "vets_read_their_active_patients" ON pets
  FOR SELECT USING (
    id IN (
      SELECT pet_id FROM vet_pet_relationships
      WHERE vet_id = auth.uid()
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
```

## 20260411000002_clinical_note_followup_trigger.sql

**Proposito**: Auto-crear recordatorio cuando vet marca "requiere seguimiento".

```sql
CREATE OR REPLACE FUNCTION create_followup_from_clinical_note()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.followup_required = TRUE AND NEW.followup_date IS NOT NULL THEN
    INSERT INTO pet_reminders (pet_id, user_id, title, reminder_type, due_date, notes)
    SELECT
      NEW.pet_id,
      pets.user_id,
      COALESCE(NEW.followup_reason, 'Control veterinario'),
      'followup',
      NEW.followup_date::TIMESTAMPTZ,
      'Creado automaticamente desde consulta del ' || to_char(NEW.consultation_date, 'DD/MM/YYYY')
    FROM pets WHERE pets.id = NEW.pet_id AND pets.user_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_followup_from_clinical_note ON vet_clinical_notes;
CREATE TRIGGER trigger_followup_from_clinical_note
  AFTER INSERT ON vet_clinical_notes
  FOR EACH ROW EXECUTE FUNCTION create_followup_from_clinical_note();
```

## 20260411000003_auto_review_invitation.sql

**Proposito**: Auto-invitar review al dueno despues de cada consulta.

```sql
CREATE OR REPLACE FUNCTION create_review_invitation_after_consultation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO review_invitations (user_id, target_user_id, target_type, pet_id, invitation_token, expires_at)
  SELECT
    pets.user_id,
    NEW.provider_id,
    'vet_consultation',
    NEW.pet_id,
    encode(gen_random_bytes(16), 'hex'),
    NOW() + INTERVAL '30 days'
  FROM pets
  WHERE pets.id = NEW.pet_id AND pets.user_id IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_review_invitation_after_note ON vet_clinical_notes;
CREATE TRIGGER trigger_review_invitation_after_note
  AFTER INSERT ON vet_clinical_notes
  FOR EACH ROW EXECUTE FUNCTION create_review_invitation_after_consultation();
```

## 20260411000004_auto_create_pet_reminders.sql

**Proposito**: Auto-crear recordatorios basicos al agregar mascota nueva.

```sql
CREATE TABLE IF NOT EXISTS vaccination_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  applies_from_age_months INTEGER NOT NULL DEFAULT 0,
  frequency_months INTEGER NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO vaccination_protocols (species, vaccine_name, applies_from_age_months, frequency_months, is_mandatory)
VALUES
  ('perro', 'Antirrabica', 4, 12, TRUE),
  ('perro', 'Sextuple', 2, 12, TRUE),
  ('perro', 'Antiparasitario interno', 1, 3, TRUE),
  ('gato', 'Triple felina', 2, 12, TRUE),
  ('gato', 'Antirrabica', 4, 12, FALSE),
  ('gato', 'Antiparasitario interno', 1, 3, TRUE)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION create_default_reminders_for_new_pet()
RETURNS TRIGGER AS $$
DECLARE
  protocol RECORD;
  pet_age_months INTEGER;
BEGIN
  IF NEW.birth_date IS NULL THEN RETURN NEW; END IF;

  pet_age_months := EXTRACT(YEAR FROM AGE(NEW.birth_date)) * 12
                  + EXTRACT(MONTH FROM AGE(NEW.birth_date));

  FOR protocol IN
    SELECT * FROM vaccination_protocols
    WHERE LOWER(species) = LOWER(NEW.species)
      AND applies_from_age_months <= pet_age_months
      AND is_mandatory = TRUE
  LOOP
    INSERT INTO pet_reminders (pet_id, user_id, title, reminder_type, due_date)
    VALUES (
      NEW.id, NEW.user_id,
      protocol.vaccine_name || ' de ' || NEW.name,
      'vaccine',
      CURRENT_DATE + INTERVAL '1 month'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_reminders ON pets;
CREATE TRIGGER trigger_create_default_reminders
  AFTER INSERT ON pets
  FOR EACH ROW
  WHEN (NEW.birth_date IS NOT NULL AND NEW.species IS NOT NULL)
  EXECUTE FUNCTION create_default_reminders_for_new_pet();
```

---

# 18. EDGE FUNCTIONS NUEVAS <a id="18-edge-functions"></a>

### send-pet-invitation (YA EXISTE — verificar)

**Proposito**: Enviar email de invitacion cuando vet crea paciente con email de dueno.

Verificar que `supabase/functions/send-pet-invitation/index.ts` incluye:
- Validacion de autorizacion (vet logueado)
- Fetch de datos de la mascota
- Email con magic link de aceptacion
- Branding Paw Friend

### Posibles nuevas (solo si no existen)

| Edge function | Proposito | Prioridad |
|---|---|---|
| `send-review-invitation` | Email de review 24h post-consulta | Media |
| `vet-dashboard-stats` | Estadisticas mensuales del vet | Baja |

**NO crear edge functions nuevas si se puede resolver con queries del frontend.** Preferir simplicidad.

---

# FLUJO CRITICO END-TO-END — RESUMEN VISUAL

```
LUNES 10:00 AM — Matias recibe a Maria con Luna

Maria abre Paw Friend
  -> Ficha de Luna -> Tab Compartir -> Muestra QR
      |
Matias escanea QR (o abre /qr/TOKEN)
  -> QRLanding detecta rol "vet"
  -> Registra relacion vet_pet_relationships
  -> Redirect a /pet/LUNA_ID/clinical
  -> Matias ve TODA la ficha en 3 segundos
      |
Matias atiende consulta (25 min)
      |
Matias click "Nueva nota clinica"
  -> Selecciona plantilla "Control vacunas"
  -> Edita campos especificos
  -> Marca "Requiere seguimiento" -> miercoles
  -> Guarda (30 seg)
      |
TRIGGERS AUTOMATICOS:
  -> pet_reminders: recordatorio para Maria (push + email)
  -> pet_reminders: recordatorio para Matias (vista seguimientos)
  -> review_invitations: invitacion de review a Maria (email 24h)
      |
Maria recibe push: "Luna tiene control el miercoles"
Maria recibe email 24h despues: "Como fue tu experiencia con Dr. Matias?"
Maria deja review -> Matias sube de 0 a 1 review verificada
      |
RESULTADO:
  - Maria: ficha al dia, recordatorio automatico, asistente IA disponible
  - Matias: 90 seg de admin (vs 90 min antes), review acumulandose
  - Los 15 vets repiten esto 12 veces/dia = 180 reviews potenciales/dia
```

---

*Documento consolidado generado 2026-04-10*
*Fuentes: INDEX.md + OWNERS.md + VETS.md + CONSOLIDACION_MOBILE.md*
*Para uso con Claude Code. Verificar contra estado actual del repo antes de ejecutar.*
