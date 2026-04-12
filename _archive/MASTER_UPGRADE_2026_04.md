# Paw Friend — MASTER UPGRADE PLAN
## Consolidado ejecutable · Abril 2026

> Fuentes cruzadas: QA_UX_UI_COMPLETO.md (40 bugs, 50 frames), UX_DUENO_MASCOTA.md, UX_VETERINARIO.md,
> ADDENDUM_FRAMES_FALTANTES.md (7 frames nuevos, 7 bugs nuevos, escalacion privacy),
> FEATURE_AI_WEB_SEARCH_UPGRADE.md, FEEDBACK_USUARIO_REAL_2026_04_10.md, RECOMENDACIONES_2026_04_08.md,
> AUDITORIA_TOTAL_APP.md, SEED_CONTAMINATION_REPORT_2026_04_09.md, seed migration 20260426,
> pro-analytics-monetization-plan.md, dashboard-preview-and-upsell-plan.md, embedded-analytics-options.md,
> PLAN_GOOGLE_PLACES_MIGRATION.md, BUG_GROOMERS_GRADIENT_CRASH.md.
>
> Objetivo: documento unico que un dev (o Claude Code) pueda ejecutar de arriba a abajo.
> Cada tarea tiene: que hacer, donde, por que, esfuerzo estimado, y criterio de "hecho".
>
> **Total bugs documentados: 40 | Hallazgos positivos: 17 | Tareas accionables: ~70**

---

## FASE 0 — BLOQUEANTES CRITICOS (esta semana)

> Sin resolver estos, ningun usuario nuevo puede usar la app. Marketing/pitch/demo son prematuros.

### 0.1. Bug de schema al crear mascota (iPhone + probablemente Android)

**Fuente**: QA_UX_UI_COMPLETO.md bug #1, UX_DUENO_MASCOTA.md §3
**Severidad**: MAXIMA — bloquea el primer paso del producto para todo usuario nuevo
**Sintoma**: `"Error al agregar mascota — Una columna usada por la app no existe en la base. Avisa al equipo tecnico."`

**Diagnostico**:
```sql
-- 1. Listar columnas reales de pets
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pets' AND table_schema = 'public'
ORDER BY ordinal_position;
```

```bash
# 2. Buscar payloads en el repo
grep -rn "from('pets').insert" src/
grep -rn "from('pets').update" src/
```

**Fix**:
1. Comparar columnas reales vs payload del form en `src/pages/AddPet.tsx` (o donde este el insert)
2. Regenerar types: `npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts`
3. `npx tsc -b` — TypeScript marca errores automaticamente
4. Corregir el form para usar nombres de columna correctos
5. Mejorar el mensaje de error: agregar CTA "Reportar este error" con `mailto:soporte@pawfriend.cl`
6. `npm run build`

**Esfuerzo**: 2-4h
**Hecho cuando**: un usuario nuevo puede crear mascota en iPhone Safari + Android Chrome sin error

---

### 0.2. Google OAuth muestra UUID de Supabase ✅ CERRADO 2026-04-12

**Fuente**: QA_UX_UI_COMPLETO.md bug #2, UX_DUENO_MASCOTA.md §2.1, UX_VETERINARIO.md §2.2
**Severidad**: GRAVE — rompe confianza antes de entrar al producto
**Sintoma**: Google mostraba `gwailbjlvevkhwcrovfd.supabase.co` en vez de "Paw Friend"

**Fix aplicado 2026-04-12** (Google Auth Platform, proyecto `811742672720`, estado "In production"):
- Seccion "Informacion de la marca" completada:
  - Nombre de la aplicacion: `Paw Friend`
  - Logotipo: `public/android-chrome-512x512.png` subido
  - Pagina principal: `https://pawfriend.cl`
  - Politica de privacidad: `https://pawfriend.cl/privacy`
  - Terminos del servicio: `https://pawfriend.cl/terms`
  - Dominios autorizados: `pawfriend.cl`, `supabase.co`
  - Contacto del desarrollador: configurado
- Validacion visual en ventana incognito: titulo "Paw Friend" aparece en consent screen (ya no `gwailbjlvevkhwcrovfd.supabase.co`).

**Salvedad**: la propagacion del logo via cache de Google puede tardar hasta 24h para todos los usuarios — el texto aparece inmediato pero el logo a veces tarda mas. No bloquea. Se verifica visualmente el 2026-04-13 si hay dudas.

**Pendiente opcional** (no bloquea el cierre de esta fase): solicitar verificacion oficial de Google en "Centro de verificacion" para eliminar el warning "Google no ha verificado esta aplicacion". Proceso de 4-6 semanas. Dejar para sprint dedicado.

**Hecho cuando**: ✅ Google consent screen dice "Paw Friend" (texto confirmado en incognito 2026-04-12)

---

### 0.3. HTTPS en pawfriend.cl ✅ CERRADO 2026-04-12

**Fuente**: QA_UX_UI_COMPLETO.md bug #32
**Severidad**: GRAVE — "No seguro" visible en iPhone mata confianza, especialmente para vets
**Fix aplicado**: Enforce HTTPS activado en GitHub Pages (Settings > Pages).
**Verificacion 2026-04-12**:
- `curl.exe -I https://pawfriend.cl` → `HTTP/1.1 200 OK` (cert SSL provisionado, sirviendo desde `cache-scl2220049-SCL` / Fastly Santiago)
- `curl.exe -I http://pawfriend.cl` → `HTTP/1.1 301 Moved Permanently` + `Location: https://pawfriend.cl/` (redirect forzado de HTTP plano)
**Estado**: iPhone ya no muestra "No seguro". Bug #32 resuelto.

---

### 0.4. Seed data con email/telefono/Colmevet de otro vet (riesgo privacy) ✅ CERRADO 2026-04-12

**Fuente**: ADDENDUM f44+f45, QA bug #3 ESCALADO a CRITICO
**Severidad historica**: CRITICA — riesgo de filtracion de datos personales (Ley 19.628 Chile)
**Sintoma original**: el formulario de edicion del perfil vet se pre-cargaba con datos COMPLETOS de otro vet seed (foto, bio, email, telefono, Colmevet, anos de experiencia).

**Estado 2026-04-12**: **bug cerrado en codigo** — probablemente fixeado en commits `44c0fb3` o `490b29b` (mismo patron que los 3 falsos abiertos auditados ayer). Verificacion punto por punto contra los 6 requisitos del fix original:

| # | Requisito | Estado | Ubicacion |
|---|---|---|---|
| 1 | Componente editor de perfil vet identificado | ✅ | `src/pages/ProviderProfileEdit.tsx`, `src/components/provider/VetOnboardingWizard.tsx`, `src/components/provider/ProviderDirectoryCard.tsx` |
| 2 | Campos VACIOS para usuarios nuevos | ✅ | Constante `EMPTY` en `ProviderProfileEdit.tsx:37-51` y `VetOnboardingWizard.tsx:42-56` |
| 3 | Filtrar por `WHERE user_id = auth.uid()` | ✅ | Hook `useMyProvider()` en `useProviderProfile.tsx:34-38` (`.eq('user_id', user!.id).maybeSingle()`) |
| 4 | Placeholders neutros tipo "Ej: Medico/a veterinario/a..." | ✅ | `VetOnboardingWizard.tsx:201` |
| 5 | Guard al guardar contra demos | ✅ | `useUpsertProviderProfile` en `useProviderProfile.tsx:52-58` bloquea con mensaje "Estos datos coinciden con un perfil de demostracion. Editalos antes de publicar tu perfil." |
| 6 | Card "Tu perfil publico" carga datos propios | ✅ | `ProviderDirectoryCard.tsx:36` usa `useMyProvider()` (mismo filtro). `ProviderDashboard.tsx:28-40` tambien filtra por `user_id`. |

**Auditoria retroactiva 2026-04-12** (corrida en Supabase SQL Editor por el dueno):
```sql
-- Extendida con public_email, public_phone, license_number
SELECT sp.id, sp.display_name, sp.slug, sp.user_id, sp.created_at
FROM service_providers sp
WHERE sp.is_demo = false
  AND (
    sp.display_name IN (SELECT display_name FROM service_providers WHERE is_demo = true)
    OR sp.slug IN (SELECT slug FROM service_providers WHERE is_demo = true)
    OR sp.public_email IN (SELECT public_email FROM service_providers WHERE is_demo = true AND public_email IS NOT NULL)
    OR sp.public_phone IN (SELECT public_phone FROM service_providers WHERE is_demo = true AND public_phone IS NOT NULL)
    OR sp.license_number IN (SELECT license_number FROM service_providers WHERE is_demo = true AND license_number IS NOT NULL)
  );
```
**Resultado**: 0 filas. Ningun vet real tiene datos duplicados de seeds. No hay limpieza retroactiva pendiente.

**Deuda tecnica menor detectada** (no bloqueante, queda para sprint futuro):
- `useProviderProfile.tsx:8-10` usa listas hardcodeadas (`DEMO_EMAILS`, `DEMO_PHONES`, `DEMO_COLMEVET`) en vez de consultar `WHERE is_demo = true` en DB. Si se agregan seeds nuevos hay que actualizar estas listas manualmente. Approach robusto: mover el guard a un trigger de Postgres o hacer lookup dinamico a DB al guardar.

**Hecho cuando**: ✅ editor de perfil vet muestra campos vacios para usuarios nuevos, dashboard muestra solo datos propios, ningun vet real tiene datos clonados de seeds (auditoria SQL retroactiva: 0 filas).

---

### 0.5. Seguridad critica — secrets expuestos

**Fuente**: AUDITORIA_TOTAL_APP.md C1
**Severidad**: CRITICA — SERVICE_ROLE_KEY visible en archivos
**Fix**:
1. Eliminar `.env.demo.local`, `.env.backup`, `.env.bak` del repo
2. Agregar al `.gitignore`: `.env*`, `!.env.example`
3. Rotar SERVICE_ROLE_KEY en Supabase Dashboard
4. Rotar Google OAuth client secret

**Esfuerzo**: 1h
**Hecho cuando**: `grep -rn "SERVICE_ROLE" .` no encuentra nada fuera de .env.example

---

### 0.6. Terminos y Condiciones contradicen el positioning real

**Fuente**: ADDENDUM f49
**Severidad**: GRAVE — riesgo legal + incoherencia comercial
**Sintoma**: T&C seccion 2 define Paw Friend como *"red social para duenos de mascotas"*, pero:
- Landing dice: "Cuida la salud de tu mascota con veterinarios verificados" (plataforma veterinaria)
- Login dice: "Red social para amantes de las mascotas" (red social)
- Pitch/ESTRATEGIA dice: plataforma veterinaria B2C+B2B con ficha medica, directorio, estimador, reservas

**Riesgos**:
1. Un vet con problema argumenta que firmo para una "red social", no un PIMS
2. Datos de ficha clinica son datos sensibles de salud animal — "red social" no tiene mismas obligaciones
3. Inversor o vet que lea T&C antes de reunion pierde confianza en el pitch

**Fix**:
1. Reescribir seccion 2 de T&C: *"Paw Friend es una plataforma veterinaria chilena que conecta duenos de mascotas con profesionales verificados. Ofrece: (a) gestion de ficha clinica digital, (b) directorio publico de veterinarios y proveedores de servicios, (c) reservas y mensajeria, (d) gamificacion y comunidad, (e) servicios Premium opcionales, (f) planes profesionales para veterinarios y clinicas."*
2. Agregar secciones: responsabilidad sobre datos medicos, terminos para vets verificados, politica de pagos Flow.cl
3. Unificar tagline en landing, login, T&C y README
4. **Consultar con abogado chileno de derecho digital** antes de onboardear mas vets

**Esfuerzo**: 2-3h reescritura + consulta legal (accion dueno)
**Hecho cuando**: T&C, landing, login y README usan la misma definicion de Paw Friend

---

### 0.7. Verificar que datos seed sean 100% sinteticos

**Fuente**: ADDENDUM f45
**Severidad**: GRAVE — si Javiera Munoz, Francisca Lagos o Nicolas Parra son personas reales, hay infraccion de privacidad

**Fix**:
1. Confirmar que TODOS los nombres, emails, telefonos y Colmevet en los seeds son ficticios
2. Si alguno corresponde a persona real, cambiar inmediatamente en la migracion de seed
3. Ejecutar auditoria retroactiva (query SQL en 0.4)

**Esfuerzo**: 1h
**Hecho cuando**: confirmado que todos los datos seed son sinteticos y no corresponden a personas reales

---

### 0.8. CRASH en /services/groomers — "Cannot read properties of undefined (reading 'gradient')"

**Fuente**: BUG_GROOMERS_GRADIENT_CRASH.md
**Severidad**: ALTA — ruta `/services/groomers` completamente rota
**Sintoma**: `Cannot read properties of undefined (reading 'gradient')` al abrir peluqueros

**Causa raiz**: `ProviderProfileCard.tsx` tiene `providerTypeConfig` con 4 tipos (dog_walker, dogsitter, veterinarian, trainer) pero falta `"groomer"`. Cuando ServiceDirectory pasa `providerType="groomer"`, `config` queda `undefined` y crashea al acceder a `config.gradient`.

**Fix**:
1. Agregar `"groomer"` a `providerTypeConfig` en `src/components/ProviderProfileCard.tsx`:
   - gradient: `"from-pink-600 to-rose-500"`
   - ringColor: `"ring-pink-500/20"`
   - badgeColor: `"bg-pink-500/10 text-pink-700"`
   - title: `"Peluquero"`, priceLabel: `"servicio"`, totalLabel: `"citas"`
2. Actualizar tipo `ProviderType` para incluir `"groomer"` en ProviderProfileCard y ServiceDirectory
3. Agregar caso `groomer` en `getPrice()` y `getTotalCount()`
4. Revisar `MyBookingsHistory` y `EnhancedBookingDialog` para soporte groomer

**Esfuerzo**: 1-2h
**Hecho cuando**: `/services/groomers` renderiza sin crash y muestra cards con gradiente rosa

---

## FASE 1 — LAYOUT MOBILE + VALIDACION (semana 1-2)

> Overflow horizontal, empty states, validaciones. La capa de "parece indie" que hay que pulir.

### 1.1. Auditar y arreglar todos los modales Dialog

**Fuente**: QA bugs #4 (tab Compartir cortado), #5 (boton Guardar invisible en modal subir doc)
**Donde**: Todos los `<Dialog>` de shadcn en `src/components/`

**Fix global**:
```tsx
// En src/components/ui/dialog.tsx o en cada Dialog que lo necesite:
// Agregar al DialogContent:
className="max-w-[calc(100vw-2rem)] overflow-x-hidden"
```

**Verificar en ancho 320px** que:
- Modal de subir documento medico: boton primario visible
- Modal de verificacion profesional: todo visible
- Cualquier otro Dialog

**Esfuerzo**: 3-4h
**Hecho cuando**: ningun modal tiene overflow horizontal en 320px de ancho

---

### 1.2. Tabs scrolleables en ficha clinica

**Fuente**: QA bug #4 — tab "Compartir" (feature estrella) cortado
**Donde**: Componente de tabs de la ficha clinica (probablemente en `src/components/medical/`)

**Fix**: Hacer tabs horizontalmente scrolleables con indicador de scroll (flecha derecha o fade)
O apilar en 2 filas en mobile si hay >=5 tabs

**Esfuerzo**: 2h
**Hecho cuando**: los 5 tabs (Resumen, Historial, Habitos, Documentos, Compartir) son visibles en 320px

---

### 1.3. Empty state de Recordatorios

**Fuente**: QA bug #6 — pantalla en blanco total cuando no hay recordatorios
**Donde**: Pagina de Recordatorios (`src/pages/Reminders.tsx` o similar)

**Fix**: Agregar empty state con icono de campana, copy "No tienes recordatorios pendientes" y CTA "+ Crear recordatorio"

**Esfuerzo**: 1h
**Hecho cuando**: la pagina de recordatorios nunca queda en blanco

---

### 1.4. Componente EmptyState unificado

**Fuente**: QA bug #16 — "No hay documentos" vs "Sin documentos" en la misma vista
**Donde**: Crear `src/components/ui/EmptyState.tsx`

**Fix**:
```tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
```
Reemplazar todos los empty states custom del repo por este componente

**Esfuerzo**: 3-4h
**Hecho cuando**: `grep -rn "No hay" src/ | grep -i empty` retorna 0 matches custom

---

### 1.5. Raza como combobox dependiente de especie

**Fuente**: QA bugs #8, #17 (f30) — "gato - pastor suizo" paso validacion
**Donde**: Form de AddPet y EditPet

**Fix**:
1. Buscar `breeds.ts` o similar en `src/lib/`
2. Convertir el input de raza en autocomplete filtrado por especie seleccionada
3. Fallback a texto libre solo con confirmacion explicita ("Esta raza no esta en la lista, continuar?")

**Esfuerzo**: 3-4h
**Hecho cuando**: seleccionar "Gato" filtra las razas a solo razas de gato

---

### 1.6. Validacion de edad maxima de mascota

**Fuente**: QA bug #9 — kai tiene 30 anos (imposible)
**Donde**: Form de AddPet y EditPet + migracion SQL

**Fix**:
1. Frontend: warning "Edad superior a 25 anos para esta especie, es correcta?" si birth_date > 25 anos
2. SQL (migracion nueva):
```sql
ALTER TABLE pets ADD CONSTRAINT pets_birth_date_reasonable
  CHECK (birth_date >= CURRENT_DATE - INTERVAL '30 years');
```

**Esfuerzo**: 1-2h
**Hecho cuando**: no se puede guardar un pet con fecha de nacimiento anterior a 30 anos

---

### 1.7. Unificar fuente de verdad de vacunas

**Fuente**: QA bug #7 — PawGame dice "Vacunas Pendientes" (rojo) y ficha clinica dice "Vacunas al dia" (verde) para el mismo pet
**Donde**: Wellness score en PawGame vs badge en ficha clinica

**Fix**: Ambos deben leer de la misma query/vista. Crear una funcion `getVaccinationStatus(petId)` y usarla en ambos lugares.

**Esfuerzo**: 3-4h
**Hecho cuando**: PawGame y ficha clinica muestran el mismo estado de vacunas para el mismo pet

---

### 1.8. Carrusel "Acciones rapidas" — primera card cortada

**Fuente**: QA bug #11 — se lee "ha medica" en vez de "Ficha medica"
**Donde**: Home dashboard, componente de acciones rapidas

**Fix**: Agregar `pl-4` al contenedor + `snap-x snap-mandatory` + fade o indicador de scroll en borde izquierdo

**Esfuerzo**: 1h
**Hecho cuando**: la primera card del carrusel se lee completa sin scroll

---

### 1.9. Fix copy PawGame "Nivel maximo" con nivel 1

**Fuente**: QA bug #10 — badge dice "Nivel maximo" cuando el usuario tiene 15 pts y nivel 1
**Donde**: Componente PawGame (probablemente `src/components/pawgame/` o `src/pages/PawGame.tsx`)

**Fix**: El badge debe mostrar "Proximo nivel: [nombre]" en vez de "Nivel maximo" cuando level < max_level

**Esfuerzo**: 30min
**Hecho cuando**: un usuario nivel 1 no ve "Nivel maximo"

---

### 1.10. Overlay borroso en Paw Shop cards

**Fuente**: QA bug #15 — text overlay semitransparente sobre descripcion en cards de 1,000 pts
**Donde**: Paw Shop component

**Fix**: Revisar z-index y backdrop-filter. El overlay de "Faltan X pts" no debe tapar el texto de descripcion.

**Esfuerzo**: 30min

---

### 1.11. Filtros del mapa truncados a 5-6 caracteres

**Fuente**: ADDENDUM f41 — "Veteri", "Cuidad", "Entrena", "Groor" ilegibles
**Donde**: Componente de mapa (`src/components/maps/`)

**Fix** (mejor opcion para mobile): Reemplazar pills de texto por iconos con label corto:
- Tijeras → Peluquero
- Estetoscopio → Vet
- Pata → Paseador
- Casa → Cuidador
- Cerebro → Entrenador

O usar scroll horizontal con `snap-x` en la barra de filtros.

**Esfuerzo**: 2h
**Hecho cuando**: los 5 filtros del mapa son legibles e identificables en 320px

---

### 1.12. Mensajes de validacion no dinamicos en verificacion profesional

**Fuente**: ADDENDUM f38 — toast dice "Los veterinarios deben subir su titulo profesional" aunque el usuario eligio "Entrenador Canino"
**Donde**: Modal de verificacion profesional

**Fix**: El mensaje de validacion debe adaptarse al tipo seleccionado:
- Veterinario: "Los veterinarios deben subir su titulo profesional"
- Entrenador: "Los entrenadores deben subir su certificacion"
- Paseador: "Los paseadores deben verificar su identidad"
- etc.

Y el titulo del modal debe actualizarse segun el dropdown (no quedarse fijo en "Paseador").

**Esfuerzo**: 1h

---

### 1.13. Header de card "Mis Reservas" con layout cramado

**Fuente**: ADDENDUM f39 — titulo + sub-tabs en misma fila causan overflow
**Donde**: Componente de reservas

**Fix**: Mover sub-tabs "Proximas / Pasadas / Todas" a una segunda fila debajo del titulo

**Esfuerzo**: 30min

---

## FASE 2 — FEATURES DE ALTO VALOR (semana 2-4)

> Cierran el embudo de valor y habilitan el pitch comercial.

### 2.1. Completar pagina de share medico por QR/WhatsApp

**Fuente**: FEEDBACK_USUARIO_REAL P0, RECOMENDACIONES §2
**Donde**: `/medical-share/:token` o similar
**Prioridad**: P0 — es el flujo killer del MVP

**Fix**:
1. Completar la pagina de destino `/medical-share/:token` para que muestre:
   - Datos del pet (nombre, especie, raza, edad, peso)
   - Historial medico completo (vacunas, consultas, tratamientos)
   - Documentos subidos (fotos de recetas)
   - Boton "Descargar PDF"
2. Agregar boton "Compartir por WhatsApp" que genere:
   `https://wa.me/?text=Ficha+de+{petName}:+pawfriend.cl/medical-share/{token}`
3. El QR debe codificar la misma URL

**Esfuerzo**: 4-8h (infraestructura ya existe: tokens, QR component, PDF generator)
**Hecho cuando**: un vet puede abrir un link compartido por WhatsApp y ver la ficha completa + descargar PDF

---

### 2.2. Emergencia vet: horarios + filtro "abierto ahora"

**Fuente**: FEEDBACK_USUARIO_REAL P0
**Prioridad**: P0 — unico en Chile, viral por boca a boca

**Fix**:
1. Migracion SQL — agregar campos a `service_providers`:
```sql
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS opening_hours jsonb;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_available boolean DEFAULT false;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_phone text;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS emergency_surcharge_pct int;
```

2. UI en DirectorioVets:
   - Badge "Abierto ahora" / "Cerrado" (calculado client-side con opening_hours)
   - Filtro "Abiertos ahora" + "Atiende urgencias"
   - Telefono de emergencia visible

3. Boton "Emergencia" destacado en home/navbar que filtra directorio por: abiertos ahora + atiende urgencias + ordena por cercania

4. Actualizar seed para que providers demo tengan opening_hours

**Esfuerzo**: 8-12h
**Hecho cuando**: filtro "Abiertos ahora" funciona y muestra badge verde/rojo en cards

---

### 2.3. Mejorar discoverability de upload de documentos

**Fuente**: FEEDBACK_USUARIO_REAL P1
**Donde**: Ficha clinica, tab Documentos

**Fix**:
1. Agregar tooltip/onboarding en primera visita: "Sube fotos de recetas y carnet aqui"
2. CTA mas visible en la ficha clinica (no solo en el tab Documentos)
3. Considerar un boton flotante "+" en la ficha que permita subir doc directo

**Esfuerzo**: 2-3h

---

### 2.4. Idempotencia en pagos Flow.cl

**Fuente**: AUDITORIA_TOTAL_APP.md C2
**Severidad**: CRITICA — riesgo de cobros duplicados por double-click
**Donde**: `supabase/functions/flow-create-subscription/index.ts`

**Fix**: Agregar idempotency key (UUID generado por el cliente, enviado en header). Si el backend ve el mismo key en <5min, retorna la respuesta anterior sin crear nueva suscripcion.

**Esfuerzo**: 3-4h
**Hecho cuando**: double-click rapido en "Pagar" no genera 2 cargos

---

### 2.5. Sanitizar prompt injection en edge functions IA

**Fuente**: AUDITORIA_TOTAL_APP.md C3
**Donde**: `pet-assistant`, `medical-suggestions`, `breed-tips`, `ocr-vaccination-card`

**Fix**: Escapar/sanitizar datos del usuario antes de interpolarlosen el prompt. No concatenar `pet.name` o `user_question` directamente en el system prompt sin sanitizacion.

**Esfuerzo**: 2-3h
**Hecho cuando**: un input malicioso como `"Ignore previous instructions and..."` no altera el comportamiento del asistente

---

### 2.6. Migracion de cleanup seeds del directorio vet

**Fuente**: QA bug #19, UX_VETERINARIO.md §2.3
**Donde**: Migracion SQL nueva

```sql
-- Remover especialidades que son procedimientos, no especialidades
UPDATE service_providers
SET specialties = array_remove(array_remove(specialties, 'Vacunación'), 'Esterilización')
WHERE 'Vacunación' = ANY(specialties) OR 'Esterilización' = ANY(specialties);
```

**Esfuerzo**: 30min
**Hecho cuando**: ningun vet en el directorio muestra "Vacunacion" o "Esterilizacion" como especialidad

---

### 2.7. Frecuencia de medicamento como dropdown

**Fuente**: QA bug #17
**Donde**: Form de agregar medicamento en ficha clinica

**Fix**: Convertir input texto libre en dropdown con opciones:
`['1 vez/dia', '2 veces/dia', '3 veces/dia', 'Semanal', 'Quincenal', 'Mensual', 'Cada 3 meses', 'Cada 6 meses', 'Anual', 'Segun necesidad']`

**Esfuerzo**: 1h

---

### 2.8. Default correcto en tipo de documento

**Fuente**: QA bug #25
**Donde**: Modal de subir documento medico

**Fix**: Cambiar default del dropdown "Tipo de Documento" de "Carnet de Identidad" a placeholder vacio o "Carnet de Vacunacion"

**Esfuerzo**: 15min

---

### 2.9. Deshabilitar "Guardar" cuando OCR no extrae datos

**Fuente**: QA bug #26
**Donde**: Componente OCR de carnet

**Fix**: Si el payload de vacunas/desparasitaciones esta vacio, deshabilitar el boton "Guardar todo en la ficha" y mostrar "No se detectaron datos validos — sube otra imagen"

**Esfuerzo**: 30min

---

## FASE 3 — UPGRADE IA + PRICING (semana 3-5)

> Optimizacion de prompts + web search + alineacion comercial.

### 3.1. Optimizar prompts de las 5 edge functions IA

**Fuente**: FEATURE_AI_WEB_SEARCH_UPGRADE.md completo
**Donde**: 5 edge functions en `supabase/functions/`

**Paso 1 (sin web search, solo prompts lean)**:
- `pet-assistant`: prompt ~320→180 tokens, contexto compacto (-40%)
- `medical-suggestions`: prompt ~180→90 tokens, max_tokens 1000→600
- `breed-tips`: prompt ~200→100 tokens, max_tokens 400→300
- `ocr-vaccination-card`: prompt ~280→150 tokens, max_tokens 2048→1024
- `generate-shelters`: prompt actualizado para buscar data real

**Paso 2 (agregar web search)**:
```typescript
tools: [{ type: "web_search_20250305", name: "web_search", max_uses: N }]
```
- pet-assistant: max_uses 3 (donde comprar, precios, normativa Chile)
- medical-suggestions: max_uses 1 (protocolo ISP/SAG vigente)
- breed-tips: max_uses 1 (alertas recientes de raza)
- ocr-vaccination-card: max_uses 1 (calendario vacunal chileno)
- generate-shelters: max_uses 3 (refugios reales)

**Ahorro**: ~35% tokens input, ~30% tokens output, ~$170/ano
**Esfuerzo**: 7-8h (paso 1: 3h, paso 2: 4-5h)
**Hecho cuando**: las 5 funciones responden correctamente con prompts lean + web search activo

---

### 3.2. Alinear pricing Premium B2C

**Fuente**: RECOMENDACIONES §4, §9 quick win #1
**Donde**: `src/lib/plans.ts`, `src/pages/Upgrade.tsx`, `src/pages/Index.tsx`, landing

**Fix**:
1. Confirmar $3.990/mes y $39.900/ano (ya en plans.ts:47)
2. Grep por `2990` en todo `src/` y eliminar referencias al precio viejo
3. Comunicar "ahorras 2 meses" en plan anual

**Decision del dueno requerida**: confirmar $3.990

**Esfuerzo**: 1-2h

---

### 3.3. Matar plan premium_plus

**Fuente**: RECOMENDACIONES §3.1, §4
**Donde**: `src/lib/plans.ts:64-85`, `src/pages/Upgrade.tsx`

**Fix**: Eliminar `premium_plus` del codigo y UI. Un solo tier B2C = menos decision = mas conversion.

**Esfuerzo**: 1h

---

### 3.4. Ajustar comisiones B2B

**Fuente**: RECOMENDACIONES §4
**Donde**: `src/lib/plans.ts` seccion B2B

| Plan | Comision actual | Comision nueva |
|------|----------------|----------------|
| Gratis | 15% | **10%** |
| Individual | 12% | 12% (mantener) |
| Clinica Basica | 10% | 10% (mantener) |
| Clinica Pro | 8% | **0%** |

**Esfuerzo**: 30min
**Hecho cuando**: plans.ts refleja las nuevas comisiones

---

### 3.5. FK faltante en vet_clinical_notes

**Fuente**: AUDITORIA_TOTAL_APP.md C4
**Donde**: Migracion SQL nueva

```sql
ALTER TABLE vet_clinical_notes
ADD CONSTRAINT fk_vet_clinical_notes_pet_id
FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE;
```

**Esfuerzo**: 15min

---

## FASE 4 — UX AVANZADO + COMUNIDAD (mes 1-2)

> Features que diferencian de la competencia y aumentan retencion.

### 4.1. Grupos/comunidad por raza o condicion medica

**Fuente**: FEEDBACK_USUARIO_REAL #8 — "ocean blue", ningun competidor chileno lo tiene
**Prioridad**: P1 — alto potencial de retencion diaria

**Fase 1 MVP**:
```sql
-- Tablas nuevas
CREATE TABLE community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text,
  group_type text CHECK (group_type IN ('breed','condition','location','general')),
  is_public boolean DEFAULT true,
  member_count int DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE community_group_members (
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE community_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

Grupos semilla: "Displasia de cadera", "Diabetes felina", "Labradores Chile", "Gatos rescatados", "Perros senior"

UI: `/comunidad` con lista + busqueda, `/comunidad/:slug` con chat grupal

**Esfuerzo**: 20-30h
**Hecho cuando**: un usuario puede unirse a un grupo y enviar mensajes

---

### 4.2. Switch de rol dueno/vet

**Fuente**: UX_VETERINARIO.md §1 hallazgo #3, QA bug #31
**Donde**: Header/navbar

**Fix**: Toggle en el header "Modo dueno / Modo vet" para usuarios con ambos perfiles. Cambia la navegacion y dashboard visible.

**Esfuerzo**: 8-12h

---

### 4.3. Registro proveedor generico (no solo vet)

**Fuente**: FEEDBACK_USUARIO_REAL #5
**Donde**: Ruta `/registro-veterinario` → renombrar a `/registro-proveedor`

**Fix**:
1. Crear ruta `/registro-proveedor` generica con selector de tipo (paseador, cuidador, entrenador, peluquero, vet)
2. CTA "Ofrece tus servicios" visible en perfil de usuario
3. Mantener `/registro-veterinario` como redirect

**Esfuerzo**: 3-4h

---

### 4.4. Badge verificado + resenas en perfil publico

**Fuente**: FEEDBACK_USUARIO_REAL #6
**Donde**: `/user/:userId`

**Fix**: Mostrar badge "Paseador verificado" / "Cuidadora verificada", rating y resenas en el perfil publico del usuario (no solo en perfil de proveedor).

**Esfuerzo**: 2-3h

---

### 4.5. UI para WhatsApp + Calendar en Settings

**Fuente**: FEEDBACK_USUARIO_REAL #9
**Donde**: Pagina de Settings

**Fix**: Agregar toggles visibles:
- "Conectar Google Calendar" → inicia OAuth flow existente
- "Activar recordatorios WhatsApp" → cuando Meta apruebe

**Esfuerzo**: 3-4h

---

### 4.6. Onboarding guiado para vets

**Fuente**: UX_VETERINARIO.md §7 medio plazo
**Donde**: Nuevo componente wizard

**Fix**: Wizard de 4 pasos (datos basicos → foto + bio → servicios y precios → Colmevet) con progreso visible. Hoy el form es una sola pagina larga.

**Esfuerzo**: 8-12h

---

### 4.7. Plantillas post-consulta para vets

**Fuente**: RECOMENDACIONES §2 alta prioridad
**Donde**: Dashboard vet + `consultation_templates` (tabla ya existe con 5 plantillas sistema)

**Fix**: UI para que el vet elija plantilla, llene campos variables, y genere resumen con campo "alternativas discutidas"

**Esfuerzo**: 12-16h

---

### 4.8. Migrar de Leaflet/OSM a Google Maps + Places (con control de costos)

**Fuente**: PLAN_GOOGLE_PLACES_MIGRATION.md
**Prioridad**: P2 — mejora UX significativa pero no bloqueante (Leaflet funciona)

**Contexto**: Actualmente usa Leaflet + OSM (gratis). Se quiere volver a Google Maps con Places Autocomplete para mejor UX de busqueda de direcciones, con restricciones de costos.

**Fases**:
1. **Setup**: Instalar `@react-google-maps/api`, crear `GoogleMapsProvider`, `googleMapsConfig.ts`, quitar `leaflet.css`
2. **Mapa base**: Migrar `Maps.tsx` (~625 lineas), `LostPetsMap.tsx`, `AdoptionSheltersList.tsx` de Leaflet a Google Maps
3. **Places Autocomplete**: Componente reutilizable `PlacesAutocomplete.tsx` con restriccion `country="cl"`, debounce 500ms, min 3 chars. Integrar en ReportLostPetForm, GroomerProfileEdit, ProviderProfileEdit
4. **Cleanup**: Desinstalar Leaflet, limpiar imports, mantener `locations.ts` como fallback

**Control de costos**:
- Google da $200 USD gratis/mes (suficiente para ~10,000-15,000 MAUs)
- Usar session-based Autocomplete (no per-keystroke) → $0.017/sesion
- Cachear coordenadas en DB (nunca re-geocodificar)
- Lazy load del mapa (solo en /maps o forms con mapa)
- Billing alert a $20, cap a $50/mes

**Decision del dueno**: Confirmar que quiere volver a Google Maps y tiene billing habilitado en Google Cloud

**Esfuerzo**: 16-20h (16+ archivos involucrados)
**Hecho cuando**: /maps usa Google Maps, forms usan Places Autocomplete restringido a Chile, costo < $10/mes con < 2,000 MAUs

---

## FASE 4B — PRO ANALYTICS + MONETIZACION (mes 1-2)

> Panel Pro como motor de conversion a Premium. Preview gratuito → gating → upgrade.
> Fuente: pro-analytics-monetization-plan.md, dashboard-preview-and-upsell-plan.md, embedded-analytics-options.md

### 4B.0. Decision tecnica: Recharts nativo (NO Power BI / Metabase / Grafana)

**Fuente**: embedded-analytics-options.md — comparativa de 5 opciones
**Decision**: **Recharts nativo para V1-V3**

| Criterio | Recharts | Power BI | Metabase | Grafana |
|----------|----------|----------|----------|---------|
| Costo | $0 (ya instalado) | ~$5-10/user/mes | $0-85/mes | $0-8/user/mes |
| Mobile/Capacitor | Perfecto (SVG) | Problematico (iframe) | Problematico | Problematico |
| Offline | Si (React Query cache) | No | No | No |
| Personalizacion | Total (Tailwind) | Limitada | Media | Baja (infra look) |
| Percepcion premium | Alta | Media (embebido) | Media | Baja |

**Razon**: ya instalado, wrapper shadcn listo (`src/components/ui/chart.tsx`), cero costo, funciona offline, control total del diseno. Charts: AreaChart (actividad), BarChart (comparativo), RadialBarChart (bienestar).

**Export (V2)**: `jsPDF` + `html2canvas` para PDF, `json2csv` para CSV. Todo client-side.
**Evolucion futura**: si >5000 usuarios, evaluar PostHog. Si vets piden reporteria avanzada, considerar Metabase Cloud solo para Clinica Pro via iframe JWT.

---

### 4B.1. Preview cards en Home (V1 — ya implementado parcialmente)

**Donde**: `Home.tsx`, despues de WeeklyReportCard y antes de Acciones rapidas

**Componentes**:
- `AnalyticsPreviewCard`: 3 metricas del mes (recordatorios completados, visitas vet, vacunas) + mini sparkline AreaChart 60px + CTA "Ver Panel Pro →"
- `PetWellnessPreview`: Score bienestar (0-100) RadialBarChart donut. Verde >=70, ambar 40-69, rojo <40. Click → /panel-pro

**Regla de diseno**: mostrar valor suficiente para generar curiosidad, no para satisfacer la necesidad completa.

**Esfuerzo**: 4-6h si no existe, 1-2h si ya esta parcialmente implementado
**Hecho cuando**: ambas cards renderizan datos reales en Home para usuarios con mascotas

---

### 4B.2. Panel Pro con gating (/panel-pro)

**Estructura de acceso**:

| Feature | Gratis | Premium ($3.990/mes) |
|---------|--------|----------------------|
| Summary row (4 KPIs) | Si (datos reales) | Si |
| Filtros (mascota/periodo) | Si | Si |
| Grafico actividad mensual | **Blur + CTA** | Si |
| Comparativo de periodos | **Blur + CTA** | Si |
| Seccion veterinaria (providers) | **Blur + CTA** | Si |
| Export PDF/CSV | **Blur + CTA** | Si |

**LockedOverlay component**:
- Blur 6px Gaussian sobre contenido
- Fondo white/60% + backdrop-blur 2px
- Icono Lock (lucide) en circulo purple-100
- Boton "Desbloquear" bg-purple-600 con icono Crown → navega a /upgrade
- Cada click trackea `pro_panel_upgrade_cta_clicked`

**Copy espanol chileno** (tuteo):
- "Disponible en Premium"
- "Ve tu actividad dia a dia con tu plan Premium"
- "Compara la actividad entre meses con tu plan Premium"
- "Descarga tus datos en PDF o CSV con el plan Premium"

**Esfuerzo**: 8-12h
**Hecho cuando**: usuario gratis ve summary row con datos reales + charts bloqueados con blur, usuario premium ve todo desbloqueado

---

### 4B.3. Funnel de conversion + tracking

**Eventos a implementar** (usar `feature_usage` o tabla de analytics):

| Evento | Momento |
|--------|---------|
| `analytics_preview_viewed` | Preview card renderizada en Home |
| `analytics_preview_cta_clicked` | Click en CTA del preview |
| `pro_panel_viewed` | Pagina /panel-pro cargada |
| `pro_panel_filter_changed` | Cambio de filtro |
| `pro_panel_export_clicked` | Click en boton PDF/CSV |
| `pro_panel_upgrade_cta_clicked` | Click en CTA de upgrade |
| `vet_report_viewed` | Seccion vet analytics vista |

**Funnel objetivo**:
```
analytics_preview_viewed (100%)
  → cta_clicked (~15% target)
    → panel_viewed (~80%)
      → upgrade_cta_clicked (~8%)
        → premium_converted (~3% del total)
```

**Senales de ajuste**:
- Preview CTR < 5% → cambiar copy, agregar dato mas impactante
- Panel → CTA < 3% → reducir blur, mostrar mas data parcial
- CTA → Conversion < 1% → revisar /upgrade, probar trial 14 dias

**Esfuerzo**: 3-4h
**Hecho cuando**: todos los eventos se registran y el funnel es consultable en Supabase

---

### 4B.4. ProUpgradeCTA (3 variantes)

| Variante | Donde | Diseno |
|----------|-------|--------|
| `minimal` | Debajo de preview cards en Home | Link texto "Ver Panel Pro →" + Crown icon |
| `inline` | Standalone (uso futuro) | Card compacto gradiente purple-pink |
| `banner` | Header del Panel Pro (free users) | Full-width card titulo bold + boton "Activar" |

**Flujo completo**:
1. Home → AnalyticsPreviewCard → click
2. → /panel-pro
3. → Ve summary row (datos reales)
4. → Ve graficos bloqueados (blur + LockedOverlay)
5. → Click "Desbloquear"
6. → /upgrade
7. → Selecciona plan → Flow.cl checkout
8. → /upgrade-success → vuelve a /panel-pro desbloqueado

**Esfuerzo**: 2-3h
**Hecho cuando**: las 3 variantes de CTA estan implementadas y navegan correctamente

---

### 4B.5. Analytics level por plan provider (B2B)

| Plan provider | analytics_level | Capacidades |
|--------------|----------------|-------------|
| Gratis | none | Sin analytics |
| Individual ($9.900) | basic | KPIs basicos, graficos |
| Clinica Basica ($29.900) | basic | KPIs + comparativos |
| Clinica Pro ($59.900) | advanced | Todo + export + API futura |

**Migracion SQL**:
```sql
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS analytics_level text
  DEFAULT 'none' CHECK (analytics_level IN ('none', 'basic', 'advanced'));

-- Actualizar segun plan
UPDATE service_providers SET analytics_level = 'basic'
  WHERE provider_plan IN ('provider_individual', 'provider_clinic_basic');
UPDATE service_providers SET analytics_level = 'advanced'
  WHERE provider_plan = 'provider_clinic_pro';
```

**Esfuerzo**: 1-2h
**Hecho cuando**: analytics_level gatea correctamente el acceso del vet a sus metricas

---

### 4B.6. Evolucion futura (no implementar ahora)

| Fase | Contenido | Cuando |
|------|-----------|--------|
| V2 | Export PDF/CSV funcional (jsPDF + json2csv) | >100 usuarios activos |
| V3 | Insights IA mensuales ("tu mascota mejoro X% este mes") | Data de >3 meses |
| V4 | Reporteria vet avanzada con templates (logo clinica) | >10 vets activos |
| V5 | API de datos para integracion externa | Solo plan Clinica Pro |

---

## FASE 5 — PULIDO COPY + TILDES + TRUNCAMIENTO (continuo)

> Tareas de polish que se pueden hacer en paralelo con las fases anteriores.

### 5.1. Audit de tildes

**Fuente**: QA bug #27
**Donde**: Todo `src/`

Palabras sin acento detectadas: "medicos", "vacunacion", "cronicas", "condicion", "apareceran"

```bash
grep -rn "medicos\|vacunacion\|cronicas\|condicion\b\|apareceran" src/ --include="*.tsx" --include="*.ts"
```

Corregir a: "medicos"→"médicos", "vacunacion"→"vacunación", etc.

---

### 5.2. Unificar taglines

**Fuente**: QA bug #24
- Landing: "Cuida la salud de tu mascota con veterinarios verificados"
- Login: "Red social para amantes de las mascotas"

**Fix**: Unificar a una sola value prop en ambas pantallas

---

### 5.3. Truncamiento de nombres en cards del directorio

**Fuente**: QA bugs #12, #13, #14
**Donde**: Cards de vets en directorio, cards de badges en PawGame

**Fix**:
- Priorizar nombre completo sobre especialidades
- Usar `line-clamp-2` en nombres
- Especialidades en pills de una segunda fila
- Comunas como pills en vez de texto con comas

---

### 5.4. Toast posicion

**Fuente**: QA bug #20
**Donde**: Configuracion de sonner/toast global

**Fix**: Cambiar posicion de toasts de top a bottom para no tapar header

---

### 5.5. Feed y Memorial en sidebar

**Fuente**: QA bug #30
**Donde**: Sidebar/drawer component

**Fix**: Agregar "Feed" a seccion COMUNIDAD del menu lateral. Memorial se mantiene discreto en Perfil > Avanzado (decision correcta).

---

### 5.6. Combobox de condiciones cronicas

**Fuente**: QA bug #18
**Donde**: Form de agregar condicion cronica en ficha clinica

**Fix**: Combobox con top 20 condiciones comunes en Chile + opcion "Otra":
Displasia, Diabetes, Insuficiencia renal, Artritis, Alergia atopica, Obesidad, Epilepsia, Hipotiroidismo, Enfermedad cardiaca, Enfermedad periodontal, Insuficiencia hepatica, Cancer, Asma felina, FLUTD, Cushing, Addison, Pancreatitis, IBD, Cataratas, Sordera

---

### 5.7. Normalizar capitalizacion de display_name

**Fuente**: ADDENDUM f47 — "pedro susaeta" en vez de "Pedro Susaeta"
**Donde**: Guardado de `profiles.display_name`

**Fix**: Aplicar `toTitleCase()` al guardar nombre en perfil. No mutar datos existentes retroactivamente (puede haber nombres con formato intencional como "María del Carmen"), solo normalizar en el form de edicion.

**Esfuerzo**: 30min

---

### 5.8. Auto-formateo de texto en inputs (mayúscula inteligente)

**Fuente**: Feedback dueño 2026-04-10
**Donde**: Todos los inputs de texto libre que no sean email/password (nombre mascota, bio, notas médicas, comentarios)

**Fix**:
1. Crear helper `smartCapitalize(text: string): string` en `src/lib/format.ts`
   - Primera letra del texto en mayúscula
   - Primera letra después de cada punto en mayúscula
   - Resto en minúscula (excepto nombres propios que el usuario haya escrito con mayúscula deliberada)
2. Aplicar `onBlur` (no `onChange`) en inputs relevantes: nombre mascota, bio, notas, comportamiento, etc.
3. NO aplicar en: email, contraseña, número Colmevet, microchip, URLs

**Esfuerzo**: 2-3h
**Hecho cuando**: escribir "mi perro se llama max. le gusta correr" auto-formatea a "Mi perro se llama max. Le gusta correr" al salir del campo

---

### 5.9. Rediseño completo de la ficha clínica PDF

**Fuente**: Feedback dueño 2026-04-10
**Donde**: Edge function `generate-medical-summary` + componente de descarga PDF
**Prioridad**: ALTA — es la joya de la corona del producto

**Fix**:
1. Reordenar secciones del PDF con sentido cronológico y clínico:
   - Header: nombre mascota, especie, raza, edad, peso, foto, QR de la ficha
   - Datos del dueño: nombre, contacto
   - Identificación: microchip, seguro, clínica preferida
   - Estado actual: condiciones crónicas, medicamentos actuales, alergias
   - Historial de vacunas (orden cronológico descendente)
   - Historial de consultas veterinarias (orden cronológico descendente)
   - Historial de desparasitaciones
   - Documentos adjuntos (lista con fechas)
   - Notas y observaciones
   - Footer: "Generado por Paw Friend · pawfriend.cl · {fecha}"
2. Mejorar diseño visual: tipografía clara, iconos por sección, colores del brand, separadores
3. Agregar paginación si el contenido excede una página
4. Incluir fecha de última actualización por sección

**Esfuerzo**: 8-12h
**Hecho cuando**: el PDF descargado tiene todas las secciones ordenadas cronológicamente, es visualmente profesional, y un veterinario puede leerlo y encontrar la información rápidamente

---

## FASE 6 — LIMPIEZA DE CODIGO (continuo)

> Eliminar deuda tecnica y rutas muertas.

### 6.1. Eliminar archivos sensibles

```bash
# Verificar y eliminar
git rm --cached .env.demo.local .env.backup .env.bak 2>/dev/null
# Agregar a .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### 6.2. Eliminar rutas legacy

**Fuente**: RECOMENDACIONES §3.1-3.2

Rutas a eliminar de `src/App.tsx`:
- `/places` redirect
- `/payment-success` y `/payment-failed` redirects (Webpay legacy)
- `/dog-walkers`, `/home-vets`, `/dog-sitters`, `/dog-trainers` → redirect a `/services/:type`

### 6.3. Merge `/actividad` y `/feed`

**Fuente**: RECOMENDACIONES §3.2
Dos feeds en paralelo no se justifican. Merge a uno solo (`/feed`) con filtro "Salud" vs "Social".

### 6.4. Unificar editores de perfil proveedor

`/peluquero/perfil` + `/provider/profile-edit` → unificar si los campos divergen poco.

---

## FASE 7 — DATA Y METRICAS (mes 1)

### 7.1. Cargar 50+ precios reales en vet_service_prices

**Fuente**: RECOMENDACIONES §2 alta prioridad, §5 roadmap 30 dias
**Por que**: Sin data, `/precios-veterinarios` (diferenciador #4) es una pagina vacia

**Fix**: Seed hardcoded con precios referenciales publicos:
- 10 servicios × 5 comunas RM (Providencia, Las Condes, Nunoa, Maipu, La Florida)
- Referencia: encuestas publicas + consumer.es + foros

**Nota**: La migracion `20260426000000_cleanup_and_reseed_all_demo.sql` ya incluye precios estimados para providers demo. Verificar que sean realistas y cubran las comunas principales.

**Esfuerzo**: 4-6h (research + migracion)

### 7.2. Queries de metricas basicas ✅ CERRADO 2026-04-12

**Fuente**: RECOMENDACIONES §7

**Estado 2026-04-12**: 4 queries guardadas en Supabase Studio del proyecto `gwailbjlvevkhwcrovfd` como "Saved Queries". Baseline de metricas capturada (numeros crudos no guardados en repo por ser potencialmente sensibles — si el repo llegara a abrirse al publico). Las 4 queries fueron extendidas respecto al esbozo original del master upgrade para dar breakdowns utiles (real vs demo, activas vs memorial, tokens activos vs expirados, visibles vs ocultos).

**Queries guardadas**:

```sql
-- 1. Metrics: users reales (no demo)
-- Breakdown demo vs real + total. Uso: salud del funnel de registro.
SELECT
  count(*) FILTER (WHERE email NOT LIKE '%@demo.pawfriend.cl') AS users_reales,
  count(*) FILTER (WHERE email LIKE '%@demo.pawfriend.cl')     AS users_demo,
  count(*)                                                      AS total
FROM auth.users;

-- 2. Metrics: mascotas reales activas
-- Separa mascotas activas de las en memorial (lifecycle_status). Uso: parque activo real.
SELECT
  count(*) FILTER (WHERE p.lifecycle_status = 'active')   AS mascotas_activas,
  count(*) FILTER (WHERE p.lifecycle_status = 'deceased') AS mascotas_memorial,
  count(*)                                                 AS total_reales
FROM pets p
JOIN profiles pr ON p.owner_id = pr.id
WHERE pr.is_demo = false;

-- 3. Metrics: fichas medicas compartidas
-- Breakdown tokens activos vs expirados. Uso: adopcion real de la joya de la corona.
SELECT
  count(*)                                                 AS total_tokens_creados,
  count(*) FILTER (WHERE expires_at > now())               AS tokens_activos,
  count(*) FILTER (WHERE expires_at <= now())              AS tokens_expirados
FROM medical_share_tokens;

-- 4. Metrics: vets reales en directorio
-- Breakdown reales visibles/ocultos + demos + total. Uso: salud B2B + directorio publico.
SELECT
  count(*) FILTER (WHERE is_demo = false AND is_directory_visible = true)  AS vets_reales_visibles,
  count(*) FILTER (WHERE is_demo = false AND is_directory_visible = false) AS vets_reales_ocultos,
  count(*) FILTER (WHERE is_demo = true)                                    AS vets_demo,
  count(*)                                                                  AS total
FROM service_providers;
```

**Hecho cuando**: ✅ las 4 queries aparecen en "Saved Queries" del SQL Editor de Supabase Studio y corren sin errores.

**Nota para sprint futuro**: cuando se necesiten metricas mas profundas (cohorts, retention, funnel completo), considerar una migracion a Metabase/Redash embebido o a Pro Analytics propio (ver `_pending/tooling/` y las propuestas de embedded analytics en `junk/embedded-analytics-options.md`).

---

## FASE 8 — DOCUMENTACION VIVA (con cada commit) ✅ CERRADA 2026-04-12

> Mantener sincronizados segun regla de INDEX.md

### Documentos a actualizar si se tocan rutas/navegacion/flujos (regla CONTINUA, no cerrable):

- `diagrams/FLUJO_COMPLETO.mmd` ✅ sincronizado en commit `7040db5` (2026-04-11)
- `diagrams/FLUJOS_MERMAID.md` ✅ sincronizado en commit `7040db5`
- `MAPA_FUNCIONAL_COMPLETO.md` ✅ sincronizado en commit `7040db5`
- `AGENTS.md` ✅ sincronizado en commit `7040db5`

**Esta regla permanece ongoing**: cualquier cambio futuro en rutas de `src/App.tsx`, navegacion (`BottomTabBar`, `Sidebar`), flujos criticos, pricing de planes, edge functions o features debe actualizar los 4 documentos de arriba **en el mismo commit** que introduce el cambio. Ver CLAUDE.md §9.7 para la regla completa.

### Features subcomunicadas documentadas como EXISTENTES:

**Fuente**: QA_UX_UI_COMPLETO.md hallazgos positivos

1. ✅ **OCR de carnet de vacunacion con IA** — documentado en `CLAUDE.md:311` y `AGENTS.md:135` (commit `7040db5`).
2. ✅ **Feline Grimace Scale** — documentado en `CLAUDE.md:312` y `AGENTS.md:136` (commit `7040db5`).
3. ✅ **Boton "Ver como me ven los duenos"** — documentado en `CLAUDE.md:315` y `AGENTS.md:139` (commit 2026-04-12). Implementado en `ProviderProfileEdit.tsx:166` y `ProviderDashboard.tsx:193`. Marcado como diferenciador unico vs la competencia (preview publico del perfil vet en 1 click, sin salir de la app).

**Hecho cuando**: ✅ los 4 documentos vivos estan sincronizados con el estado actual del repo y las 3 features subcomunicadas aparecen en `CLAUDE.md` y `AGENTS.md` como features en produccion.

---

## RESUMEN EJECUTIVO DE PRIORIDADES

| Fase | Foco | Tareas | Esfuerzo total | Impacto |
|------|-------|--------|---------------|---------|
| **0** | Bloqueantes criticos (schema, OAuth, HTTPS, privacy vet, secrets, T&C, seeds sinteticos, crash groomers) | 8 | ~14-18h + config dueno + consulta legal | Sin esto nada funciona y hay riesgo legal |
| **1** | Layout mobile + validacion (modales, tabs, empty states, raza, edad, mapa, validator) | 13 | ~22-28h | App deja de verse "indie" |
| **2** | Features alto valor (QR share, emergencia vet, idempotencia, prompt injection, seeds) | 9 | ~25-35h | Embudo de valor completo |
| **3** | IA + pricing (prompts lean, web search, alinear precios, comisiones, FK) | 5 | ~10-12h | Ahorro tokens + comercial alineado |
| **4** | UX avanzado + comunidad (grupos, switch rol, registro proveedor, onboarding vet, Google Maps migration) | 8 | ~71-95h | Diferenciacion real vs competencia |
| **4B** | Pro Analytics + monetizacion (Recharts, preview, gating, funnel, CTA, analytics_level) | 7 | ~20-28h | Motor de conversion a Premium |
| **5** | Copy + polish (tildes, taglines, truncamiento, capitalizacion, auto-formateo, PDF ficha) | 9 | ~20-27h | Profesionalismo percibido |
| **6** | Limpieza codigo (env, rutas legacy, merge feeds, unificar editores) | 4 | ~4-6h | Menos deuda tecnica |
| **7** | Data + metricas | 2 | ~6-8h | Decisiones informadas |
| **8** | Docs vivos | Continuo | Continuo | Coherencia del proyecto |
| | **TOTAL** | **~65** | **~193-257h** | |

**Camino critico minimo para habilitar marketing/pitch**:
Fase 0 completa + Fase 1 (items 1.1-1.3) + Fase 2 (item 2.1 share QR) = **~25-30h de trabajo**.

---

## HALLAZGOS POSITIVOS (features que SI funcionan y hay que comunicar)

| # | Hallazgo | Donde |
|---|----------|-------|
| 1 | OCR de carnet de vacunacion con IA funcionando | Edge function `ocr-vaccination-card` |
| 2 | Feline Grimace Scale implementado (cero competidores en Chile) | Ficha clinica |
| 3 | Boton "Ver como me ven los duenos" en perfil vet (unico en mercado) | Editor perfil vet |
| 4 | Catalogo de 31 especialidades reales (no procedimientos) | Directorio vets |
| 5 | Comparador de precios por comuna accesible desde directorio | `/precios-veterinarios` |
| 6 | Ficha clinica con 5 tabs, IA integrada, gamification | Ficha clinica |
| 7 | Resenas verificadas (solo quien reservo puede resenar) | Service reviews |
| 8 | Link al memorial empatico en ficha de mascota viva | Ficha clinica |
| 9 | Sistema unificado de verificacion profesional (5 tipos) | Modal verificacion |
| 10 | Empty state de Mensajes con CTA a buscar vets | Chat |
| 11 | Barra "Te falta: Numero Colmevet" accionable en perfil vet | Editor perfil vet |
| 12 | Skeleton loaders consistentes sin layout shift | Home |
| 13 | Selector de archivos nativo (Camara / Fotos) | Upload documentos |
| 14 | Onboarding coaching de 3 pasos en dashboard vet | Provider dashboard |
| 15 | Avatar customization con 6 colores y 10 estilos de cara | Perfil usuario |
| 16 | Empty state de "Mis Reservas" con CTA claro | Reservas |
| 17 | T&C con fecha de ultima actualizacion visible | Terminos |

**Accion inmediata**: actualizar roadmap/docs internos para dejar de comunicar como "pendiente" lo que ya existe (OCR, Grimace Scale, avatar customization).

---

*Generado 2026-04-10, actualizado con addendum de frames 38/39/41/43/45/47/49.
Consolida: QA_UX_UI_COMPLETO.md, UX_DUENO_MASCOTA.md, UX_VETERINARIO.md, ADDENDUM_FRAMES_FALTANTES.md,
FEATURE_AI_WEB_SEARCH_UPGRADE.md, FEEDBACK_USUARIO_REAL_2026_04_10.md, RECOMENDACIONES_2026_04_08.md,
AUDITORIA_TOTAL_APP.md, SEED_CONTAMINATION_REPORT_2026_04_09.md, 20260426000000_cleanup_and_reseed_all_demo.sql,
pro-analytics-monetization-plan.md, dashboard-preview-and-upsell-plan.md, embedded-analytics-options.md.*

---

## ANEXO — Sesión 2026-04-11 (post cierre FASE 0-8)

> Esta sección consolida los hallazgos de la sesión del 2026-04-11 posterior al cierre del master upgrade, para mantener el documento como fuente única de verdad. El plan principal (FASE 0-8) sigue marcado como **100% CERRADO 2026-04-12**. Lo que sigue son items nuevos o rescatados que se descubrieron al auditar `junk/` y al barrer código heredado de Lovable.

### A.1. Auditoría de código heredado de Lovable

**Fuente**: [audits/AUDIT_LOVABLE_LEGACY.md](../audits/AUDIT_LOVABLE_LEGACY.md)
**Fecha**: 2026-04-11
**Alcance**: 176 archivos fuente del commit inicial `0f458c2` (2025-12-17), generados por Lovable con una IA más débil.
**Método**: delegación a agente Explore con verificación de imports y lectura de archivos.

**Roadmap en 5 fases** (orden por riesgo creciente):

| Fase | Acción | Esfuerzo | Riesgo | Archivos afectados |
|---|---|---|---|---|
| **Fase 1** | Reemplazar 10× `.single()` con `.maybeSingle()` + null check | 10 min | **Cero** | `AddPet.tsx:335`, `MedicalShare.tsx:115,149`, `useConsultationTemplates.ts:94`, `useVetClinicalNotes.ts:122`, `useGroomerProfile.tsx:114`, `useProviderProfile.tsx:81`, `useReviewInvitations.tsx:75`, `AddMedicalRecord.tsx:157`, `RegistroVeterinario.tsx:145` |
| **Fase 2** | Eliminar `src/components/MissionCard.tsx` (duplicado muerto — solo vive `components/pawgame/MissionCard.tsx`) | 15 min | **Bajo** | 1 archivo, ~100 líneas |
| **Fase 3** | Regenerar tipos Supabase y matar 4× `const sb = supabase as any` | 2-3 h | **Bajo** | `useConsultationTemplates.ts`, `useVetClinicalNotes.ts`, `usePendingReviews.ts`, `VetFollowupsCard.tsx` |
| **Fase 4** | Refactor `Home.tsx` de `useEffect` + setState en cascada (6 queries) a `useQuery` × 3-4 | 4-6 h | **Medio** | `pages/Home.tsx`, posiblemente `useGamification.tsx`, `useReminders` |
| **Fase 5** | Split de componentes gigantes (PawGame 950L, AddPet 917L, ServiceDirectory 914L, EnhancedBookingDialog 662L, ProviderDashboard 534L) | 8-10 h | **Mayor — REQUIERE AUTORIZACIÓN** | 5 archivos, split en ~15 subcomponentes |

**Hallazgos complementarios**:
- **168 instancias de `any`** en archivos Lovable, concentradas en `ServiceDirectory.tsx` (11), `PawGame.tsx` (10), `Auth.tsx` (4), hooks de datos. Atacables en Fase 3 con tipos generados.
- **Copy chileno OK** — `grep -r "vos tenés|vos podés|vosotros|cogéis" src/` devuelve 0 coincidencias en los archivos Lovable. No hay voseo argentino en esa capa. (Caso aparte: `ProviderProfileEdit.tsx` sí tiene voseo — ver A.2.)
- **Performance low-hanging**: `loading="lazy"` ausente en listas de vet, markers de Leaflet sin memoizar en `Maps.tsx`, callbacks inline en `AddPet.tsx:459,719`.
- **Joyas de la corona protegidas**: `MedicalRecords.tsx`, directorio vets, pagos Flow, auth — sólo micro-mejoras (ver §9.6 de CLAUDE.md). Únicas acciones seguras documentadas: `.maybeSingle()` en `MedicalShare.tsx` y tipado de `current_medications: any`.

**Prioridad recomendada**: Fase 1 → 2 → 3 → 4. Fase 5 solo con autorización explícita del dueño.

---

### A.2. Rescate desde `junk/task_docs/` — REDISENO_DASHBOARD_PROVIDER

**Fuente**: [_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md](bugs/REDISENO_DASHBOARD_PROVIDER.md) (rescatado desde `junk/task_docs/` el 2026-04-11)
**Severidad**: 🔴 **ALTA — bug vigente en producción**
**Verificado contra código actual**: sí

**Diagnóstico confirmado**:
- [`src/components/provider/ProviderDashboard.tsx:49`](../src/components/provider/ProviderDashboard.tsx#L49) sigue consultando `provider_balances` (tabla existe pero **nunca se pobla** — no hay trigger ni edge function que la llene).
- [`src/components/provider/ProviderDashboard.tsx:60`](../src/components/provider/ProviderDashboard.tsx#L60) sigue consultando `order_items` + `orders!inner` (pipeline viejo de marketplace genérico diseñado para Webpay).
- **No hay ninguna referencia a `vet_bookings`** (que es el flujo real de reservas de vets).
- **Resultado en prod**: todos los vets ven **$0 en las 8 tarjetas financieras** del dashboard: balance disponible, pendiente, ganado, retirado, reservas completadas, ingresos brutos, comisiones, clientes únicos.
- [`src/pages/ProviderProfileEdit.tsx:114,128,471`](../src/pages/ProviderProfileEdit.tsx#L114) además mantiene voseo argentino ("Verificá", "Necesitás") — no es chileno.

**Acción propuesta** (resumida — detalle completo en el MD rescatado):
1. Re-apuntar las queries del dashboard de `order_items`/`orders`/`provider_balances` a `vet_bookings` + `service_reviews`.
2. Corregir `"Clientes únicos"` para contar mascotas únicas de `vet_clinical_notes` + `medical_share_tokens`.
3. Corregir `"Fichas compartidas"` (actualmente calcula `netPayouts/grossRevenue * 100` y lo etiqueta mal).
4. Reemplazar voseo por tuteo chileno en `ProviderProfileEdit.tsx` (2 strings).
5. (Redesign opcional) agregar campos faltantes del perfil vet: horario de atención, dirección específica, redes sociales, sección de credenciales/verificación.

**Esfuerzo estimado**: 4-6h para el fix crítico de queries + voseo, 8-12h adicionales para el redesign completo de 8 tarjetas.

**Hecho cuando**: un vet con `vet_bookings` reales ve sus métricas correctas en dashboard, y `ProviderProfileEdit.tsx` no tiene voseo.

---

### A.3. Triage de `junk/` — items borderline no movidos

La sesión 2026-04-11 triageó ~30 MDs en `junk/` y `junk/task_docs/`. Además del rescate documentado en A.2, se identificaron **3 items borderline** que NO se movieron porque solapan con trabajo ya ejecutado o requieren decisión del dueño:

| Archivo | Estado | Razón para no mover |
|---|---|---|
| `junk/PROMPTS_PROXIMA_SESION.md` (2026-04-08) | Parcialmente ejecutado | Prompt 1 (PDF médico español) ya parcialmente ejecutado (ver commit reciente `bc48d13` de normalización tipográfica). Prompt 2 (material reuniones vets) obsoleto — las reuniones del deadline 2026-04-13 ya son pasado. Prompt 6 (god component `PetClinicalRecord.tsx` 1444L) choca con CLAUDE.md §9.6 (joya de la corona, no refactor grande sin luz verde). Prompts 3-5 potencialmente vigentes pero requieren triage fase-por-fase. |
| `junk/MEJORAS_CALIDAD_V2.md` (2026-04-09) | Parcialmente ejecutado | Verificado: las especialidades vet ya están corregidas (`src/lib/vetDirectory.ts` no contiene "Vacunacion"/"Esterilizacion"). Resto del doc tiene barridos por módulo que no se verificaron contra código actual. |
| `junk/PAW_FRIEND_V1_1_END_TO_END.md` (2026-04-10) | Mayoritariamente cubierto por este mismo master upgrade | Plan para deadline 2026-04-13 (15 vets reales). Solapa con FASE 0-8 del master upgrade que está 100% cerrado. Mejor candidato a `_archive/` (referencia estratégica: personas Maria Constanza y Dr. Matías, dolores documentados) que a `_pending/`. |

**Decisión pendiente del dueño**: si vale la pena editar `PROMPTS_PROXIMA_SESION.md` para dejar solo los prompts vigentes y moverlo a `_pending/`, o si se descarta completo.

### A.4. Estado de junk/ analytics docs vs bug de export

Los 3 docs de analytics en `junk/` (`pro-analytics-monetization-plan.md`, `embedded-analytics-options.md`, `dashboard-preview-and-upsell-plan.md`) se relacionan con el bug **"Export PDF/CSV del Panel Pro roto en prod"** (`handleExport` es placeholder, registrado en memoria persistente). Los docs son estratégicos, no accionables directos, y el bug ya está registrado fuera del master upgrade. Se quedan en `junk/` sin mover.

---

### A.5. Landing redesign ejecutado (blueprint landing-redesign-blueprint) ✅ CERRADO 2026-04-11

**Fuente**: [_pending/landing-redesign-blueprint.md](landing-redesign-blueprint.md) (778 líneas, autor: Claude Code, 2026-04-11)
**Objetivo**: pasar la landing de "explicar" a "demostrar", aplicando estándar Principal Landing Page Designer + Art Director + UX Strategist.
**Severidad**: MEDIA — impacto directo en conversión fría en `/` (primera impresión).

**Ejecutado en esta sesión**:

| Cambio | Archivo | Blueprint § |
|---|---|---|
| HeroV2 Concepto A "Ficha viva" — split 55/45 desktop, stack mobile con visual entre subhead y CTAs, device frame CSS puro con mockup de Firulais + 2 tarjetas flotantes (próxima vacuna, vet verificado), headline ≤7 palabras, sólo 2 CTAs, bloque confianza compacto con avatares + rating | [src/components/HeroV2.tsx](../src/components/HeroV2.tsx) (nuevo) | §3 (§3.3 concepto A), §3.4 copy, §3.5-3.6 layout, §7.1 mobile |
| MedicalPDFShowcase — nueva sección dedicada a la joya con mockup rotado del PDF (Firulais · vacunas · alergias) + badge flotante "PDF listo" + 3 bullets con check | [src/components/MedicalPDFShowcase.tsx](../src/components/MedicalPDFShowcase.tsx) (nuevo) | §4 sección 4 |
| Demo 3 pasos rehecha como zig-zag con cards mockup + números `01/02/03` grandes | [src/pages/Index.tsx](../src/pages/Index.tsx) | §4 sección 3 |
| Directorio vets showcase — mockup mapa estilizado con 4 pines + card vet flotante | [src/pages/Index.tsx](../src/pages/Index.tsx) | §4 sección 5 |
| Stats chilenos compactados: de grid 3 cards a 1 banda con gradiente cálido + blobs | [src/pages/Index.tsx](../src/pages/Index.tsx) | §4 sección 6 |
| Banda B2B dedicada — fondo `neutral-950`, blobs cálidos, mini dashboard mockup con reservas + stats | [src/pages/Index.tsx](../src/pages/Index.tsx) | §4 sección 8 (regla "vet CTA fuera del hero") |
| FAQ pulida — `rounded-2xl` sin bordes duros, `bg-neutral-50`, gap-3, primero abierto por defecto | [src/pages/Index.tsx](../src/pages/Index.tsx) | §8.8 |
| CTA final — banda gradiente warm full-width con botón blanco grande | [src/pages/Index.tsx](../src/pages/Index.tsx) | §4 sección 10 |
| Eliminado del hero: 3er CTA de vets, fine print de precios, trust row textual, foto stock de Unsplash | [src/components/Hero.tsx](../src/components/Hero.tsx) (legacy, reemplazado por HeroV2) | §3.8 §9.1 §11 antipatrones |

**Aplicado del blueprint**: 100% de críticos (§9.1) + 100% de importantes (§9.2) que no requieren assets reales + pulido premium (§9.3) en shadows cálidas, tipografía display con tracking-tight, copy chileno tuteado.

**NO aplicado (requiere assets reales, el propio blueprint advierte "logos inventados = error")**:
- §4 sección 2: banda de logos de clínicas (necesita 4-6 logos reales en grayscale)
- §4 sección 7: testimonios con caras reales (necesita 2-3 fotos de dueños chilenos)

Ambas quedan pendientes para PR separada cuando se consigan los assets.

**Verificación**:
- `npx tsc -b` → exit 0
- `npm run build` → ✓ 36.57s, `Index-*.js` 30.67 kB / 7.14 kB gzip (pequeño crecimiento por mockups CSS inline, aceptable)
- `FLUJO_COMPLETO.mmd` NO requiere update: las rutas públicas no cambiaron, sólo la estructura visual del nodo `LAND["pawfriend.cl Landing"]`.

**Hecho cuando**: ✅ landing `/` renderiza con HeroV2 + 8 secciones rediseñadas, typecheck/build pasa, blueprint mantiene pendientes sólo los 2 items que necesitan assets reales.

---

### A.6. Bug crítico: CTA descarga ficha PDF invisible en la UI ✅ CERRADO 2026-04-11

**Fuente**: feedback directo del dueño en sesión 2026-04-11 ("donde aparece que se descarga la ficha medica, se pierde de vista pasa desapercibido").
**Severidad**: 🔴 **CRÍTICA** — la joya de la corona (CLAUDE.md §9.6) estaba **literalmente inaccesible desde la UI**.

**Root cause encontrado**:
- El componente [`src/components/medical/MedicalSummaryButton.tsx`](../src/components/medical/MedicalSummaryButton.tsx) existía y llamaba correctamente a la edge function `generate-medical-summary`.
- [`src/components/medical/MedicalDocumentsTab.tsx:30`](../src/components/medical/MedicalDocumentsTab.tsx#L30) **lo importaba pero nunca lo renderizaba en el JSX** (grep `<MedicalSummaryButton` devolvía 0 matches en todo `src/`).
- `generate-medical-summary` sólo se llamaba desde ese componente huérfano → la edge function estaba viva en Supabase pero nadie podía dispararla desde la app.
- Impacto: ningún usuario en producción podía descargar el PDF completo de su ficha clínica. El único camino era el share-link externo (`/medical-share/:token`), que no todos los usuarios usan.

**Fix aplicado**:

1. **Rediseño visual del botón** — [`src/components/medical/MedicalSummaryButton.tsx`](../src/components/medical/MedicalSummaryButton.tsx):
   - Variante `hero` (default): solid gradient primary → purple → rose, altura 14, icono `FileDown` grande, shadow cálida `0 20px 40px -18px rgba(168,85,247,0.55)`. Ya no es `variant="outline"` tímido.
   - Variante `inline` conservada para usos secundarios.
   - Copy actualizado: "Descargar ficha clínica (PDF)" (antes: "Descargar Resumen Médico").

2. **Card destacado al tope del tab de documentos** — [`src/components/medical/MedicalDocumentsTab.tsx:175`](../src/components/medical/MedicalDocumentsTab.tsx#L175):
   - Container con `bg-gradient-to-br from-primary/5 via-amber-50/60 to-rose-50/60`, blobs blur decorativos, ring primary/20.
   - Badge "Ficha clínica PDF" uppercase + título "Descarga toda la ficha clínica en un solo PDF" + descripción + botón solid.
   - Separado visualmente del resto de botones outline (Descargar Todo ZIP, Compartir) para que no compita con ellos.

**Verificación**:
- `npx tsc -b` → exit 0
- `npm run build` → ✓ 36.57s
- QA manual pendiente (dev server): abrir `/medical-records` > pet seleccionado > tab "Documentos" > confirmar que el card gradient es lo primero que se ve arriba del tab.

**Relación con §5.9**: este fix es complementario al §5.9 "Rediseño completo de la ficha clínica PDF" (que sigue pendiente y se refiere al **contenido** del PDF generado por la edge function: orden de secciones, tipografía, paginación, etc.). §A.6 resuelve el problema de **visibilidad del CTA de descarga**; §5.9 seguirá abierto hasta que se rediseñe la estructura del PDF en sí.

**Hecho cuando**: ✅ el CTA de descarga de la ficha clínica PDF es imposible de perder de vista al tope del tab "Documentos" en `/medical-records`.

---

### Resumen de acciones aplicadas en la sesión 2026-04-11

| # | Acción | Destino | Estado |
|---|---|---|---|
| 1 | Auditoría código Lovable legacy generada | `audits/AUDIT_LOVABLE_LEGACY.md` | ✅ Creada |
| 2 | Rescate `REDISENO_DASHBOARD_PROVIDER.md` desde `junk/task_docs/` | `_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md` | ✅ Movido |
| 3 | Índice de `_pending/README.md` actualizado con item #11 🔴 Alta prioridad | `_pending/README.md` | ✅ Actualizado |
| 4 | Consolidación en master upgrade (este anexo) | `_pending/MASTER_UPGRADE_2026_04.md` | ✅ Este commit |
| 5 | **Landing redesign aplicado (A.5)** — HeroV2 + MedicalPDFShowcase + 8 secciones rediseñadas | `src/components/HeroV2.tsx`, `src/components/MedicalPDFShowcase.tsx`, `src/pages/Index.tsx` | ✅ Ejecutado (100% de críticos + importantes sin assets) |
| 6 | **Bug crítico CTA descarga PDF invisible (A.6)** — joya de la corona ahora accesible | `src/components/medical/MedicalSummaryButton.tsx`, `src/components/medical/MedicalDocumentsTab.tsx` | ✅ Fixed |
| 7 | Fase 1 auditoría Lovable (10× `.single()`) | — | ⏳ Pendiente (10 min, riesgo cero) |
| 8 | Bug REDISENO_DASHBOARD_PROVIDER fix de queries + voseo | `ProviderDashboard.tsx`, `ProviderProfileEdit.tsx` | ⏳ Pendiente (4-6h) |

**Nota sobre el cierre del master upgrade**: el plan FASE 0-8 sigue marcado como **100% CERRADO 2026-04-12** y es candidato a archivo en `junk/` en sesión próxima. Este anexo documenta los hallazgos de la auditoría post-cierre del 2026-04-11 para no perder visibilidad antes de archivar.

---

## ANEXO B — Auditoría Consolidada 2026-04-11

> **Fuente única de verdad de la auditoría total**: [audits/REPORTE_CONSOLIDADO_2026_04_11.md](../audits/REPORTE_CONSOLIDADO_2026_04_11.md).
> Este anexo extrae SOLO los fixes accionables en formato paso a paso, agrupados en 3 olas. Cada item lleva: qué hacer, dónde, por qué, esfuerzo, criterio de "hecho".
>
> **Estado de los checks al momento de la auditoría** (branch `main`, HEAD `fc48e94`):
> - `npx tsc -b` ✅ 0 errores
> - `npm run build` ✅ pasa
> - `vitest` ✅ 81/81
> - Playwright Desktop Chrome ✅ 50/50
> - `npm run lint` ❌ **539 problemas** (353 errores + 186 warnings)
> - `npm audit --omit=dev` ❌ **9 high severity**
>
> Metodología: 4 subagentes en paralelo (project/schema/RLS, code-review/TS/perf, UX-copy/QA/bugs, cross-platform), más checks técnicos en background.

### B.0. Checklist maestro (marca a medida que avanzas)

**OLA 1 — esta sesión / mañana** (7 items, 1-2 días totales)
- [ ] B.1.1 · `npm audit fix` — 9 vulnerabilidades high en prod
- [ ] B.1.2 · String maestro "Historial médico" → "Ficha clínica" (joya)
- [ ] B.1.3 · Voseo argentino en ProviderProfileEdit (3 toasts)
- [ ] B.1.4 · Pasar `petName` al `<MedicalSummaryButton>`
- [ ] B.1.5 · Fix `react-hooks/rules-of-hooks` en ServiceDirectory.tsx
- [ ] B.1.6 · Verificar RLS `ai_request_quota` y policies sospechosas
- [ ] B.1.7 · Bug groomers crash (`providerTypeConfig` sin key `groomer`)

**OLA 2 — próxima semana** (8 items)
- [ ] B.2.1 · Descarga QR rota en WebView/Safari iOS
- [ ] B.2.2 · Flow `urlReturn` único ignora rechazos
- [ ] B.2.3 · `generate-medical-summary`: logo base64 inline
- [ ] B.2.4 · `vite.config.ts`: separar recharts/leaflet/pdf/qr en vendors
- [ ] B.2.5 · Regenerar `supabase/types.ts` y eliminar zombies
- [ ] B.2.6 · Top 50 `any` de ESLint en páginas públicas
- [ ] B.2.7 · WhatsApp `window.open` → `openExternalUrl`
- [ ] B.2.8 · Rotación de claves Supabase + Google

**OLA 3 — backlog** (10 items)
- [ ] B.3.1 · Rediseño dashboard proveedor (6 fases — ver A.2)
- [ ] B.3.2 · Implementar `handleExport` PDF/CSV de Panel Pro
- [ ] B.3.3 · QueryClient con `staleTime` default
- [ ] B.3.4 · Memoización de Feed.tsx y MyPets.tsx
- [ ] B.3.5 · Limpieza de `junk/` (archivar 14 obsoletos)
- [ ] B.3.6 · Eliminar `src/pages/Actividad.tsx` huérfano
- [ ] B.3.7 · `tailwind.config.ts`: `require()` → `import`
- [ ] B.3.8 · Refactor `PetClinicalRecord/shared.tsx` (HMR fino)
- [ ] B.3.9 · Correr matriz Playwright completa (5 engines) en CI
- [ ] B.3.10 · Actualizar `CLAUDE.md §12` con métricas reales de bundle

---

## OLA 1 — AHORA (esta sesión / mañana)

### B.1.1. Resolver 9 vulnerabilidades high en dependencias de producción

**Fuente**: `npm audit --omit=dev` ejecutado 2026-04-11
**Severidad**: 🔴 Alta — 4 paquetes con exploits públicos
**Paquetes afectados**:
- `@xmldom/xmldom` — XML injection (GHSA-wh4c-j3r5-mjhp)
- `lodash` ≤ 4.17.23 — prototype pollution + code injection (3 CVEs)
- `minimatch` 10.0.0-10.2.2 — ReDoS (3 CVEs, vía `rimraf/node_modules/minimatch`)
- `tar` ≤ 7.5.10 — hardlink path traversal + symlink poisoning (6 CVEs, vía `@capacitor/cli`)

**Fix**:
```bash
# 1. Rama aparte por si hay breaking changes
git checkout -b fix/npm-audit-2026-04-11

# 2. Aplicar fix
npm audit fix

# 3. Si deja vulns pendientes (capacitor-cli puede necesitar major bump):
npm audit

# 4. Si todo limpio, validar build + tests
npx tsc -b
npm run build
npx vitest run
npx playwright test --project="Desktop Chrome"

# 5. npx cap sync android  # si @capacitor/cli bumpeó
```

**Por qué**: Capacitor CLI empaqueta assets en build móvil — un exploit de `tar` puede escribir archivos fuera del sandbox al descomprimir plugins. `lodash` prototype pollution es explotable desde cualquier entrada de usuario parseada con `_.template`.
**Esfuerzo**: 30 min (1 h si `@capacitor/cli` requiere major bump y rebuild android)
**Hecho cuando**: `npm audit --omit=dev` devuelve `found 0 vulnerabilities` **Y** `npm run build` pasa **Y** `vitest` sigue en 81/81.

---

### B.1.2. Renombrar "Historial médico" → "Ficha clínica" (string maestro + cascada)

**Fuente**: Reporte consolidado §5.8 (UX Copy Chileno top 15)
**Severidad**: 🔴 Alta — afecta directo a la joya de la corona; viola [CLAUDE.md §9.5](../CLAUDE.md) que define "ficha clínica" como término estandarizado
**Archivos** (12 strings visibles + 1 string central):

```
1. src/lib/plans.ts:317          — 'Historial médico' (string central, propaga)
2. src/pages/MedicalRecords.tsx:167,168,173,185,257,413
3. src/pages/Upgrade.tsx:20,34
4. src/pages/UpgradeSuccess.tsx:45
5. src/pages/AddPet.tsx:435
6. src/components/AddMedicalRecord.tsx:235
```

**Fix paso a paso**:
1. Arrancar por el string central en [plans.ts:317](../src/lib/plans.ts#L317):
   ```ts
   // ANTES
   medical_history: 'Historial médico',
   // DESPUÉS
   medical_history: 'Ficha clínica',
   ```
2. `grep -rn "Historial médico\|historial médico" src/` — confirmar los 6 hits en [MedicalRecords.tsx](../src/pages/MedicalRecords.tsx) y el resto.
3. Reemplazar uno por uno con `Edit` tool, manteniendo concordancia de género ("el historial médico" → "la ficha clínica").
4. Verificar que el breadcrumb en [MedicalRecords.tsx:173](../src/pages/MedicalRecords.tsx#L173) también dice "Ficha clínica".
5. Revisar el tooltip interno inconsistente de [MedicalSummaryButton.tsx:74 vs 98](../src/components/medical/MedicalSummaryButton.tsx#L74) — ambos deben decir "Generando tu ficha..." (o ambos "Generando...").
6. `npx tsc -b && npm run build`.

**Por qué**: el usuario ve dos nombres distintos para lo mismo dependiendo de qué parte del flujo toque. Es el estándar de CLAUDE.md §9.5 y el nombre que el producto usa en pitch/marketing.
**Esfuerzo**: 20 min
**Hecho cuando**: `grep -rn "Historial médico\|historial médico" src/` devuelve **0 hits** en archivos visibles al usuario (comentarios de código pueden quedar).

---

### B.1.3. Eliminar voseo argentino en `ProviderProfileEdit.tsx`

**Fuente**: Reporte consolidado §5.8 y auditoría agente UX
**Severidad**: 🔴 Alta — viola [CLAUDE.md §9.5](../CLAUDE.md) (tuteo chileno, NO voseo rioplatense)
**Strings**:

| Línea | Antes | Después |
|---|---|---|
| [114](../src/pages/ProviderProfileEdit.tsx#L114) | "Verificá que el bucket..." | "Verifica que el bucket..." |
| [128](../src/pages/ProviderProfileEdit.tsx#L128) | "Necesitás al menos ${REQUIRED...}% de perfil completo" | "Necesitas al menos..." |
| [471](../src/pages/ProviderProfileEdit.tsx#L471) | "Necesitás completar más campos primero." | "Necesitas completar más campos primero." |

**Fix**: tres `Edit` en el mismo archivo.
**Por qué**: Pedro ya tiene una memoria `feedback_chilean_spanish.md` que dice "toda copy/UI/toasts/errores con tuteo chileno, NO voseo rioplatense". Estos 3 toasts son el único foco de voseo detectado en toda la auditoría.
**Esfuerzo**: 5 min
**Hecho cuando**: `grep -rn "ificá\|sitás\|tenés\|podés\|querés" src/` devuelve 0 hits.

---

### B.1.4. Pasar `petName` al `<MedicalSummaryButton>` (nombre del PDF)

**Fuente**: Reporte consolidado §5.10 bug potencial #1
**Severidad**: 🟡 Media — PDF se descarga como `resumen_medico_mascota.pdf` literal en la joya de la corona
**Archivo**: [src/components/medical/MedicalDocumentsTab.tsx:216](../src/components/medical/MedicalDocumentsTab.tsx#L216)

**Diagnóstico**:
- `MedicalDocumentsTab` ya tiene el `petId` en props; necesita también recibir `petName` desde [MedicalRecords.tsx](../src/pages/MedicalRecords.tsx) donde se monta.
- `MedicalSummaryButton` acepta `petName` opcional pero si no se pasa, cae a un nombre genérico en `downloadFile`.

**Fix paso a paso**:
1. Abrir [MedicalRecords.tsx:353](../src/pages/MedicalRecords.tsx#L353) y buscar el `<MedicalDocumentsTab petId={selectedPetId} />`.
2. Pasar también `petName={selectedPet?.name}`.
3. Editar props de `MedicalDocumentsTab` para aceptar `petName?: string`.
4. En línea 216, cambiar `<MedicalSummaryButton petId={petId} />` → `<MedicalSummaryButton petId={petId} petName={petName} />`.
5. Verificar que el PDF descargado se llame `ficha_clinica_${slugify(petName)}.pdf` o similar.

**Por qué**: el usuario descarga el PDF de Kai y ve un archivo `resumen_medico_mascota.pdf` en Descargas. Fricción gratis de arreglar.
**Esfuerzo**: 15 min
**Hecho cuando**: descargar la ficha de una mascota llamada "Kai" produce un archivo con "Kai" en el nombre.

---

### B.1.5. Fix `react-hooks/rules-of-hooks` en `ServiceDirectory.tsx`

**Fuente**: `npm run lint` → 14 errores de `react-hooks/rules-of-hooks` en mismo archivo
**Severidad**: 🔴 Alta — **bug real de React**, no cosmético. Los hooks llamados después de un early return causan UI impredecible al cambiar de rama.
**Archivo**: [src/pages/ServiceDirectory.tsx:528-566](../src/pages/ServiceDirectory.tsx#L528)

**Diagnóstico**: en líneas 528-547 se llaman `useNavigate`, `useAuth`, `useToast`, `useState` × 7, `useEffect` × 2 **después** de un early return condicional. React requiere que los hooks se llamen siempre en el mismo orden.

**Fix paso a paso**:
1. Leer líneas 490-570 del archivo para entender la estructura.
2. Mover todos los hooks al tope del componente, antes de cualquier `return` condicional.
3. Si el early return existe por `if (!providerType)`, reemplazar por `const providerType = useServiceType(); if (!providerType) return <NotFound/>;` **después** de declarar todos los hooks.
4. Confirmar con `npm run lint` que los 14 errores desaparecen.

**Por qué**: en CI estricto, estos errores bloquean merge. Y en runtime, si el early return se dispara a veces sí y a veces no (ej. mientras `useAuth` está cargando), React lanza "Rendered more hooks than during the previous render" y la página crashea.
**Esfuerzo**: 30-60 min (requiere leer el componente completo, es grande: 914 líneas)
**Hecho cuando**: `npm run lint 2>&1 | grep "rules-of-hooks" | wc -l` devuelve `0`.

---

### B.1.6. Auditar RLS sospechoso en `ai_request_quota` y `medical_records`

**Fuente**: Reporte consolidado §5.3 (RLS Guardian)
**Severidad**: 🔴 Alta — potencial fuga de datos médicos o abuso de quota IA
**Riesgos**:

1. **`ai_request_quota`** ([supabase/migrations/20260410000000_ai_request_quota.sql:17](../supabase/migrations/20260410000000_ai_request_quota.sql#L17))
   - Policy actual: `using (true) with check (true)`
   - **Si la tabla guarda quotas por `user_id`**: cualquiera puede resetear la quota ajena o ver consumo de otros.
   - **Si la tabla es sólo service_role (escrita desde edge functions)**: la policy está ok pero debe estar documentada.

2. **`medical_records`** (migración `20251127152253_*.sql`)
   - Cerca de la habilitación de RLS hay un `USING(true)` suelto.
   - Riesgo si aplica a `medical_records` y no a `profiles` como debiera: **ficha clínica de todos los usuarios expuesta**.

**Fix paso a paso**:
1. Abrir [supabase/migrations/20260410000000_ai_request_quota.sql](../supabase/migrations/20260410000000_ai_request_quota.sql) completa. Confirmar a qué tabla aplica el `USING(true)`.
2. Si la tabla se lee desde cliente autenticado (ej. para mostrar "te quedan 3 consultas"), crear nueva migración `20260429000000_fix_ai_quota_rls.sql`:
   ```sql
   DROP POLICY IF EXISTS "..." ON public.ai_request_quota;
   CREATE POLICY "Users can read their own quota"
     ON public.ai_request_quota FOR SELECT
     USING (auth.uid() = user_id);
   -- Writes solo desde service_role (ya lo son implícitamente)
   ```
3. Abrir `supabase/migrations/20251127152253_*.sql` (líneas 13-50). Leer qué tabla lleva el `USING(true)` — típicamente es `profiles` (público por diseño).
4. Si resulta que `medical_records` no tiene policy restrictiva, migración urgente:
   ```sql
   CREATE POLICY "Users see only their pet's records"
     ON public.medical_records FOR SELECT
     USING (
       pet_id IN (SELECT id FROM public.pets WHERE user_id = auth.uid())
     );
   ```
5. **NO aplicar la migración**. Dejar el SQL listo en `supabase/migrations/` y avisar a Pedro para que la corra desde Supabase Dashboard > SQL Editor (regla §9.2 CLAUDE.md).

**Por qué**: la joya de la corona (ficha médica) se hace inútil comercialmente si cualquiera puede leer fichas ajenas. Hay que confirmar que no es el caso.
**Esfuerzo**: 45 min (lectura + diagnóstico + redacción de migración)
**Hecho cuando**: documentado en este anexo cuál era el estado real de cada policy, y — si había bug — migración lista en `supabase/migrations/` pendiente de aplicar.

---

### B.1.7. Bug crash en `/services/groomers` (gradient undefined)

**Fuente**: [junk/BUG_GROOMERS_GRADIENT_CRASH.md](../junk/BUG_GROOMERS_GRADIENT_CRASH.md) (bug diagnosticado, no corregido)
**Severidad**: 🟡 Media — crashea una sección completa del directorio
**Síntoma**: "Cannot read properties of undefined (reading 'gradient')" al navegar a `/services/groomers`.

**Diagnóstico**:
- [ProviderProfileCard.tsx:56-89](../src/components/provider/ProviderProfileCard.tsx#L56) define `providerTypeConfig` con keys `vet`, `walker`, `sitter`, `trainer` — **falta** `groomer`.
- [ServiceDirectory.tsx:806-809](../src/pages/ServiceDirectory.tsx#L806) pasa `providerType="groomer"` al componente.
- Acceso `providerTypeConfig[providerType].gradient` → `undefined.gradient` → crash.

**Fix**:
1. Abrir [ProviderProfileCard.tsx:56](../src/components/provider/ProviderProfileCard.tsx#L56).
2. Añadir entrada `groomer` al objeto:
   ```ts
   groomer: {
     label: 'Peluquero',
     icon: Scissors,  // lucide
     gradient: 'from-pink-500 to-rose-600',
     bgSoft: 'bg-pink-50',
     ringColor: 'ring-pink-200',
   },
   ```
3. Navegar manualmente a `/services/groomers` en dev server para confirmar que no crashea y que el styling se ve razonable.
4. Revisar que las mismas keys existan también en otros lookups (`providerType === 'groomer'` en el archivo).

**Por qué**: sección completa caída en prod.
**Esfuerzo**: 15 min
**Hecho cuando**: `/services/groomers` renderiza sin error de consola.

---

## OLA 2 — PRÓXIMA SEMANA

### B.2.1. Arreglar descarga QR rota en WebView iOS y Safari iOS

**Fuente**: Reporte consolidado §5.7 (Cross-Platform Validator) — **Alta** cross-platform
**Severidad**: 🔴 Alta en iOS — los usuarios iPhone no pueden descargar el QR de su mascota
**Archivos**:
- [src/components/medical/PetQRDisplay.tsx:25-28](../src/components/medical/PetQRDisplay.tsx#L25) — `a.download` + `a.click()` sobre data URL
- [src/pages/PetClinicalRecord/tabs/TabCompartir.tsx:132-135](../src/pages/PetClinicalRecord/tabs/TabCompartir.tsx#L132) — mismo patrón
- [src/components/medical/MedicalDocumentsTab.tsx:162](../src/components/medical/MedicalDocumentsTab.tsx#L162), [ProviderDirectoryCard.tsx:102/109/144](../src/components/provider/ProviderDirectoryCard.tsx#L102) — `navigator.share` sin try/catch

**Diagnóstico**: en WKWebView iOS y Safari iOS el click programático sobre `<a download>` con data URL **no descarga nada** — abre el data URL inline o falla en silencio. En Capacitor hay que usar `Filesystem.writeFile` + `Share.share`.

**Fix paso a paso**:
1. Revisar [src/lib/nativeDownload.ts](../src/lib/nativeDownload.ts) — ya existe `nativeDownload(dataUrl, filename)` que bifurca web vs nativo (es el mismo patrón que usa `MedicalSummaryButton.tsx:48`).
2. En `PetQRDisplay.tsx:25-28`:
   ```tsx
   // ANTES
   const a = document.createElement('a');
   a.download = `qr_${petName}.png`;
   a.href = canvas.toDataURL();
   a.click();
   // DESPUÉS
   import { nativeDownload } from '@/lib/nativeDownload';
   await nativeDownload(canvas.toDataURL(), `qr_${petName}.png`);
   ```
3. Hacer lo mismo en [TabCompartir.tsx:132](../src/pages/PetClinicalRecord/tabs/TabCompartir.tsx#L132).
4. Envolver los `navigator.share` y `navigator.clipboard.writeText` en try/catch con toast de error — ver [PetQRDisplay.tsx:33-44](../src/components/medical/PetQRDisplay.tsx#L33) como referencia.
5. **Test obligatorio**: `npx cap sync ios && npx cap run ios` o test en simulador. Descargar QR y confirmar que aparece en Files/Fotos.

**Por qué**: es iOS-bloqueante y afecta la joya de la corona (sharing de ficha + QR de mascota). Los usuarios Android están OK, pero ~40% del mercado chileno es iPhone.
**Esfuerzo**: 1-2 h (más test en simulador)
**Hecho cuando**: descargar QR en simulator iOS guarda archivo en Fotos/Files sin error.

---

### B.2.2. Flow `urlReturn` no diferencia éxito/rechazo

**Fuente**: Reporte consolidado §5.9 (QA Verifier — Pagos Flow)
**Severidad**: 🔴 Alta — usuario puede ver "¡Gracias por tu Premium!" aunque el webhook haya marcado el pago como `failed`
**Archivo**: [supabase/functions/flow-create-subscription/index.ts:136](../supabase/functions/flow-create-subscription/index.ts#L136)

**Diagnóstico**: `urlReturn: \`${SITE_URL}/upgrade/success\`` se usa para todos los casos. Flow redirige a la misma URL tanto en pago exitoso como rechazado (`status=3`) o anulado (`status=4`). La ruta `/payment-result?status=...` ya existe en [App.tsx](../src/App.tsx) y maneja ambos estados.

**Fix paso a paso**:
1. Abrir [flow-create-subscription/index.ts:136](../supabase/functions/flow-create-subscription/index.ts#L136).
2. Cambiar:
   ```ts
   // ANTES
   urlReturn: `${SITE_URL}/upgrade/success`,
   // DESPUÉS
   urlReturn: `${SITE_URL}/payment-result`,
   ```
3. Asegurar que [src/pages/PaymentResult.tsx](../src/pages/PaymentResult.tsx) (o donde viva `/payment-result`) lee el `?status=` del query param de Flow y:
   - `status=2` → mostrar éxito + redirigir a `/home` en 3s
   - `status=3|4` → mostrar rechazo + botón "Reintentar" → `/upgrade`
4. **NO borrar `/upgrade/success`** — queda como landing estática por si Flow envía query raro, pero no será la ruta primaria.
5. Deploy edge function: `npx supabase functions deploy flow-create-subscription`.
6. Test end-to-end en sandbox de Flow si existe, o con tarjeta de test real.

**Por qué**: confianza del usuario en el flujo de pago. Si paga y le dicen "gracias" pero al día siguiente no tiene Premium, pierde la fe en el producto.
**Esfuerzo**: 1-2 h (más deploy + test)
**Hecho cuando**: pago rechazado muestra UI de rechazo (no UI de éxito falsa).

---

### B.2.3. `generate-medical-summary`: logo base64 inline

**Fuente**: Reporte consolidado §5.4 Code Review — Alta
**Severidad**: 🟡 Media — dependencia externa viva en cada cold start
**Archivo**: [supabase/functions/generate-medical-summary/index.ts](../supabase/functions/generate-medical-summary/index.ts)

**Diagnóstico**: la edge function fetchea `https://pawfriend.cl/pwa-icon-512.png` en cada cold start para ponerlo en el header del PDF. Si GH Pages está caído (update de DNS, deploy en progreso, etc.), el PDF se genera SIN logo usando un fallback silencioso. Ningún error al usuario.

**Fix paso a paso**:
1. Convertir `public/pwa-icon-512.png` a base64:
   ```bash
   base64 -w0 public/pwa-icon-512.png > /tmp/logo.b64
   ```
2. Crear `supabase/functions/generate-medical-summary/logo.ts`:
   ```ts
   // Logo Paw Friend como data URL — regenerar si cambia public/pwa-icon-512.png
   export const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgo...';
   ```
3. En `index.ts`, reemplazar el `fetch('https://pawfriend.cl/pwa-icon-512.png')` por `import { LOGO_BASE64 } from './logo.ts'`.
4. Verificar que `pdf-lib` acepta el data URL directamente (o convertir a bytes con `Uint8Array.from(atob(...))`).
5. `npx supabase functions deploy generate-medical-summary`.
6. Probar generación del PDF en `/medical-records` → tab Documentos → botón hero.

**Por qué**: el PDF es la joya de la corona y no debe depender de GH Pages estando vivo. Cold start rápido + robusto.
**Esfuerzo**: 1 h
**Hecho cuando**: `grep -r 'pawfriend.cl/pwa' supabase/functions/generate-medical-summary/` devuelve 0 hits **Y** el PDF sigue mostrando el logo.

---

### B.2.4. `vite.config.ts`: separar chunks pesados en vendors dedicados

**Fuente**: Reporte consolidado §4 (bundle) + §5.6 (performance)
**Severidad**: 🟡 Media — bundle crítico path ~295 kB gzip vs 89 kB que declara CLAUDE.md §12
**Archivo**: [vite.config.ts:26-48](../vite.config.ts#L26)

**Diagnóstico**: `manualChunks` ya separa `react-vendor`, `query-vendor`, `ui-vendor`, `icons-vendor`, `date-vendor`, `supabase-vendor`. Pero **no aísla** `recharts` (383 kB!), `leaflet`, `pdf-lib`, `qrcode.react`. Estas libs caen en el chunk de la página que las importa primero.

**Fix paso a paso**:
1. Abrir [vite.config.ts:26](../vite.config.ts#L26). Añadir al objeto `manualChunks`:
   ```ts
   'charts-vendor': ['recharts'],
   'maps-vendor': ['leaflet', 'react-leaflet'],
   'pdf-vendor': ['pdf-lib'],
   'qr-vendor': ['qrcode.react'],
   ```
2. Revisar si [src/components/ui/chart.tsx:2](../src/components/ui/chart.tsx#L2) (`import * as RechartsPrimitive from "recharts"`) sigue usándose — los dashboards ya importan recharts directo. Si nada más usa `ui/chart`, **eliminarlo** con `rm src/components/ui/chart.tsx`.
3. Revisar [AdoptionSheltersList.tsx:16](../src/components/AdoptionSheltersList.tsx#L16) — si importa leaflet eager, convertir el componente a lazy import dentro de `/adoption`.
4. `npm run build` y comparar `docs/assets/` — debería aparecer `charts-vendor-*.js`, `maps-vendor-*.js`, etc.
5. Medir el chunk principal (`index-*.js`). Target: < 200 kB raw, < 70 kB gzip.

**Por qué**: tiempo a primer render mejora notablemente en 3G. Páginas que no usan charts/maps/pdf/qr dejan de descargarlos.
**Esfuerzo**: 1-2 h
**Hecho cuando**: `npm run build` muestra chunks separados Y el `index-*.js` principal baja bajo 70 kB gzip.

---

### B.2.5. Regenerar `supabase/types.ts` y eliminar tipos zombies

**Fuente**: Reporte consolidado §5.2 (Schema Auditor) + §5.5 (18 `as unknown as` por tablas ausentes)
**Severidad**: 🟡 Media — 14 tipos `walk_*`, `lost_pets`, `shared_walks`, `dog_walker_profiles` que probablemente ya fueron dropeados
**Archivo**: [src/integrations/supabase/types.ts](../src/integrations/supabase/types.ts) (6093 líneas)

**Fix paso a paso**:
1. **Verificar primero** qué tablas siguen vivas en la DB:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name LIKE '%walk%' OR table_name LIKE '%lost_pet%';
   ```
   (correr desde Supabase Dashboard SQL Editor)
2. Si las tablas NO existen, regenerar types:
   ```bash
   npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
   ```
3. `npx tsc -b` — TypeScript marcará automáticamente los imports rotos.
4. Buscar los 18 `as unknown as` y ver cuáles ahora se pueden simplificar porque el tipo existe:
   ```bash
   grep -rn "as unknown as" src/
   ```
5. Candidatos a eliminar casts: `useConsultationTemplates.ts`, `useVetClinicalNotes.ts`, `usePendingReviews.ts`, `VetFollowupsCard.tsx`, `useOrganicRewards.ts`, `Home.tsx:220`, `PerfilVetPublico.tsx:107` (tabla `vet_bookings`).
6. Si las tablas zombies SÍ siguen en DB, crear migración para dropearlas:
   ```sql
   DROP TABLE IF EXISTS public.walk_bookings CASCADE;
   DROP TABLE IF EXISTS public.shared_walks CASCADE;
   DROP TABLE IF EXISTS public.dog_walker_profiles CASCADE;
   DROP TABLE IF EXISTS public.walk_reports CASCADE;
   DROP TABLE IF EXISTS public.lost_pets CASCADE;
   ```
   (guardar en `supabase/migrations/20260429000001_drop_walk_legacy.sql`, **no aplicar**, avisar a Pedro).

**Por qué**: cada `as unknown as` es un bypass de tipos que oculta bugs. Es la forma más común en este repo de "tapar" tablas faltantes en el type generator. Arreglando la raíz se pagan ~10 items de deuda de tipos de una vez.
**Esfuerzo**: 2-3 h
**Hecho cuando**: `grep -rn "as unknown as" src/ | wc -l` baja de 18 a <8, y `npx tsc -b` sigue en 0 errores.

---

### B.2.6. Top 50 `any` de ESLint en páginas públicas

**Fuente**: Reporte consolidado §3 (ESLint) + §5.5 (top 10 deuda)
**Severidad**: 🟡 Media — ~90 `any` totales, concentrados en 6 archivos
**Foco**:

| Archivo | Hits | Prioridad |
|---|---|---|
| [ServiceDirectory.tsx](../src/pages/ServiceDirectory.tsx) | 13 | 🔴 (página pública + rules-of-hooks en B.1.5) |
| [admin/AdManagement.tsx](../src/components/admin/AdManagement.tsx) | 6 | 🟡 (panel admin) |
| [MedicalRecords.tsx](../src/pages/MedicalRecords.tsx) | 4 | 🔴 (joya) |
| [useProAnalytics.ts](../src/hooks/useProAnalytics.ts) + [useVetAnalytics.ts](../src/hooks/useVetAnalytics.ts) | 12 | 🟡 (analytics premium) |
| [MyBookings.tsx](../src/pages/MyBookings.tsx) | 6 | 🟡 |
| [Auth.tsx](../src/pages/Auth.tsx) | 4 (catch error: any) | 🟢 |
| [QRLanding.tsx](../src/pages/QRLanding.tsx) | 5 | 🟡 (landing pública QR) |
| [Reportes.tsx](../src/pages/Reportes.tsx) | 2 | 🟢 |
| [Settings.tsx](../src/pages/Settings.tsx) | 3 | 🟢 |
| [UserProfile.tsx](../src/pages/UserProfile.tsx) | 4 | 🟢 |

**Fix paso a paso**:
1. Empezar por [MedicalRecords.tsx:152,270,277,368](../src/pages/MedicalRecords.tsx#L152) — tipar `groupRecordsByYear(records: MedicalRecord[])`.
2. Para `catch (error: any)` en [Auth.tsx:204,264,300,332](../src/pages/Auth.tsx#L204) → `catch (error: unknown)` + helper `describeError(error: unknown): string`.
3. ServiceDirectory se ataca junto con B.1.5 (ya hay que tocarlo para los hooks).
4. Analytics hooks: crear interfaces `VetRevenueRow`, `ProAnalyticsMetric` en `src/types/analytics.ts`.
5. Correr `npm run lint` después de cada archivo para verificar progreso.

**Por qué**: cada `any` es un bug futuro esperando. Esta ola apunta a ~50 de los 353 errores; el resto (ola 3+) pueden ir con el refactor de Lovable legacy (ver A.1).
**Esfuerzo**: 4-6 h
**Hecho cuando**: `npm run lint 2>&1 | grep "no-explicit-any" | wc -l` baja de ~90 a <40.

---

### B.2.7. WhatsApp `window.open` → `openExternalUrl` en Capacitor

**Fuente**: Reporte consolidado §5.7 (Cross-Platform) — Media
**Severidad**: 🟡 Media — `wa.me` abre en el mismo WebView en mobile, no sale a WhatsApp nativo
**Archivo**: [src/pages/MedicalShare.tsx:164](../src/pages/MedicalShare.tsx#L164)

**Fix**:
```tsx
// ANTES
window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

// DESPUÉS
import { openExternalUrl } from '@/lib/nativeNavigation';
await openExternalUrl(`https://wa.me/?text=${encodeURIComponent(text)}`);
```

**Por qué**: `src/lib/nativeNavigation.ts` ya usa `@capacitor/browser` en web, y `App.openUrl` en nativo para lanzar WhatsApp como app externa. Con `window.open` el link se queda atrapado en el WebView de la app.
**Esfuerzo**: 10 min
**Hecho cuando**: compartir ficha por WhatsApp en APK Android abre la app de WhatsApp nativa, no un WebView interno.

---

### B.2.8. Rotación de claves Supabase + Google

**Fuente**: Memoria `project_rotate_keys_2026_04_11.md` — pendiente desde 2026-04-11
**Severidad**: 🟡 Media — una clave fue bloqueada por GitHub Push Protection en commit pasado
**Acción**: rotar en consola de Supabase y de Google Cloud, actualizar secrets de Supabase Edge Functions, actualizar `.env.local` de Pedro, verificar que nada se rompió.

**Pasos**:
1. Supabase: Dashboard → Project Settings → API → Regenerate `anon` y `service_role` keys.
2. Google Cloud: Console → APIs & Services → Credentials → OAuth Client → Reset secret.
3. Actualizar secrets de Supabase Edge Functions (`flow-create-subscription`, `google-calendar-*`, `pet-assistant`, etc).
4. Actualizar `.env.local` local de Pedro.
5. Redeploy edge functions.
6. Test flujo de pago + login con Google + generación de ficha PDF.
7. Marcar memoria `project_rotate_keys_2026_04_11.md` como resuelta.

**Por qué**: una key pegada en commit fue bloqueada antes, pero puede haber cachés de bots scrapeando PR. Higiene de seguridad.
**Esfuerzo**: 1 h
**Hecho cuando**: claves nuevas en prod, login + pago + IA funcionan, memoria actualizada.

---

## OLA 3 — BACKLOG

### B.3.1. Rediseño dashboard proveedor (6 fases)
Ya documentado en [A.2](#a2-rescate-desde-junktask_docs--rediseno_dashboard_provider) y [_pending/bugs/REDISENO_DASHBOARD_PROVIDER.md](bugs/REDISENO_DASHBOARD_PROVIDER.md). Esfuerzo: 8-12 h.

### B.3.2. Implementar `handleExport` PDF/CSV de Panel Pro
**Archivo**: memoria `project_analytics_export_broken.md` — botones visibles pero `handleExport` es placeholder.
**Fix**: integrar `jspdf` + `papaparse` (o csv-stringify) para generar archivos reales. Reusar `nativeDownload.ts`.
**Esfuerzo**: 3-4 h.

### B.3.3. QueryClient con `staleTime` default 60s
**Archivo**: `src/main.tsx` donde se instancia `QueryClient`.
```ts
new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } }
})
```
**Por qué**: ~25 hooks usan default 0 y refetchean en cada mount. Big win barato.
**Esfuerzo**: 15 min + QA de regresión (¿algún hook depende de refetch inmediato?).

### B.3.4. Memoización de `Feed.tsx` y `MyPets.tsx`
**Archivos**: [Feed.tsx](../src/pages/Feed.tsx), [MyPets.tsx](../src/pages/MyPets.tsx).
**Fix**: envolver `filterBlocked(posts)` y callbacks inline en `useMemo`/`useCallback`. Extraer `PostCard` como `React.memo`.
**Esfuerzo**: 1-2 h.

### B.3.5. Limpieza de `junk/` — archivar 14 obsoletos
Ver §9 del reporte consolidado para la lista exacta. Mover a `_archive/` o borrar. Esfuerzo: 30 min.

### B.3.6. Eliminar `src/pages/Actividad.tsx`
Página huérfana, App.tsx:72 ya la tiene comentada. `grep -rn "Actividad" src/` para confirmar que no hay referencias reales (solo strings en breadcrumbs) y borrar. Esfuerzo: 15 min.

### B.3.7. `tailwind.config.ts:177` — `require()` → `import`
Un error ESLint `@typescript-eslint/no-require-imports` trivial de arreglar. Esfuerzo: 5 min.

### B.3.8. Refactor `PetClinicalRecord/shared.tsx`
6 warnings `react-refresh/only-export-components` — archivo mezcla componentes con constantes. Split en `shared.tsx` (componentes) + `shared-constants.ts`. Esfuerzo: 30 min.

### B.3.9. Correr matriz Playwright completa (5 engines) en CI
Actualmente sólo corre Desktop Chrome subset. Hay que investigar por qué la matriz completa se estanca (probablemente instalación de browsers en background sin progreso). Validar con `npx playwright install` previo. Esfuerzo: 1-2 h.

### B.3.10. Actualizar `CLAUDE.md §12` con métricas reales
El manual afirma "~291 kB / 89 kB gzip" pero la realidad es ~458 kB / 151 kB gzip para el chunk principal. Y §7 referencia `VetProfilePublic.tsx` cuando el archivo real se llama `PerfilVetPublico.tsx`. Fix de docs. Esfuerzo: 15 min.

---

### Resumen de acciones consolidadas desde auditoría 2026-04-11

| # | Origen | Destino | Estado |
|---|---|---|---|
| 1 | Reporte maestro auditoría total | [audits/REPORTE_CONSOLIDADO_2026_04_11.md](../audits/REPORTE_CONSOLIDADO_2026_04_11.md) | ✅ Creado |
| 2 | 25 fixes accionables extraídos en 3 olas | Este anexo B | ✅ Creado |
| 3 | OLA 1 — 7 items esta sesión | — | ⏳ Pendiente ejecución |
| 4 | OLA 2 — 8 items próxima semana | — | ⏳ Pendiente ejecución |
| 5 | OLA 3 — 10 items backlog | — | ⏳ Pendiente ejecución |

**Cómo ejecutar este anexo**: marca cada checkbox de §B.0 a medida que terminas cada fix. Cada item es autocontenido (qué / dónde / por qué / esfuerzo / hecho cuando). Empezar por B.1.1 (audit fix) porque desbloquea CI, seguir por orden dentro de cada ola.

---

## ANEXO C — Análisis Forense de Video QA (2026-04-11)

> **Fuente**: video "Paw Friend video 25 min.mp4" (~24 min de uso real con DevTools abiertos, grabado 2026-04-09).
> **Método**: extracción de 229 frames por scene-change detection (ffmpeg, threshold 0.08) + OCR spa+eng (Tesseract 5.4) sobre cada frame.
> **Artefactos**: `qa-analysis/20260411_195541/` contiene `ocr.md` (356 KB, 7757 líneas), `manifest.json` (229 entries), `frames/` (229 PNGs + 229 TXTs).
>
> Este anexo consolida TODOS los hallazgos accionables del video. 9 frames con errores de consola detectados por OCR, más bugs de UX y flujos rotos identificados a lo largo de la sesión.

### C.0. Checklist maestro video QA

**P0 — BLOQUEANTES (6 items)**
- [ ] C.1.1 · `pet_reminders` GET query devuelve 400 en CADA página — schema mismatch
- [ ] C.1.2 · `pet_reminders` POST viola constraint `pet_reminders_type_check` — no se pueden crear recordatorios
- [ ] C.1.3 · `/upgrade` devuelve 404 en producción — funnel Premium roto
- [ ] C.1.4 · `bereavement-assistant` edge function devuelve 401 — chat memorial roto
- [ ] C.1.5 · `posts`, `user_roles`, `user_stats`, `award_points` queries devuelven 400 — feed y gamificación rotos
- [ ] C.1.6 · Retry loop de `bereavement-assistant` se dispara en CADA navegación posterior a `/en-memoria`

**P1 — DEBEN ARREGLARSE (3 items)**
- [ ] C.2.1 · DialogContent sin DialogTitle en TODOS los modales — violación a11y
- [ ] C.2.2 · RadioGroup controlled/uncontrolled warning en Grimace Scale
- [ ] C.2.3 · Date picker muestra `mm/dd/yyyy` en vez de `dd/mm/yyyy` (formato chileno)

**P2 — NICE TO HAVE (1 item)**
- [ ] C.3.1 · "BLANCo" mixed-case en color de mascota

---

### C.1. ERRORES DE CONSOLA (P0 — BLOQUEANTES)

#### C.1.1. `pet_reminders` GET query devuelve 400 (Bad Request) — PERSISTENTE

**Timestamps**: desde 00:41 (frame 11206) hasta el final del video. 83+ issues acumuladas en DevTools.
**Endpoint**: `GET .../rest/v1/pet_reminders?select=id...`
**Severidad**: 🔴 MÁXIMA — se dispara en CADA carga de página autenticada durante toda la sesión.

**Diagnóstico probable**: query malformada — nombre de columna que no existe en la tabla, filtro inválido, o drift de schema entre types.ts y la DB real. Dado que se ejecuta en cada página, probablemente viene de un hook global (sidebar, widget de recordatorios, o provider de layout).

**Fix**:
1. `grep -rn "pet_reminders" src/` — identificar el hook/query que hace el SELECT
2. Comparar las columnas del SELECT contra `information_schema.columns WHERE table_name = 'pet_reminders'`
3. Si hay columna faltante: crear migración para agregarla, o corregir el query
4. Regenerar types: `npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts`

**Esfuerzo**: 1-2h
**Hecho cuando**: navegar por 5+ páginas autenticadas no produce ningún 400 de `pet_reminders` en DevTools

---

#### C.1.2. `pet_reminders` POST viola constraint `pet_reminders_type_check`

**Timestamps**: 14:04 (frame 26809) al intentar crear recordatorio desde la ficha clínica.
**Endpoint**: `POST .../rest/v1/pet_reminders`
**Error**: `new row for relation "pet_reminders" violates check constraint "pet_reminders_type_check"` (código PostgreSQL 23514)
**Severidad**: 🔴 MÁXIMA — los usuarios NO PUEDEN crear recordatorios. Feature core completamente rota.

**Diagnóstico**: el valor de `type` enviado por el formulario no coincide con los valores permitidos por el constraint `CHECK (type IN (...))` en la tabla.

**Fix**:
1. En Supabase SQL Editor:
   ```sql
   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
   WHERE conrelid = 'public.pet_reminders'::regclass AND contype = 'c';
   ```
2. Comparar los valores permitidos contra el dropdown del formulario de recordatorios en el frontend
3. Alinear: o bien actualizar el constraint en DB, o corregir el valor enviado por el form

**Esfuerzo**: 30min-1h
**Hecho cuando**: un usuario puede crear un recordatorio desde la ficha clínica sin error

---

#### C.1.3. `/upgrade` devuelve 404 en producción (GitHub Pages)

**Timestamps**: 13:53 (frame 2617)
**Endpoint**: `GET https://pawfriend.cl/upgrade`
**Severidad**: 🔴 ALTA — el funnel de conversión a Premium está COMPLETAMENTE ROTO en producción.

**Diagnóstico**: GitHub Pages no maneja rutas SPA — al navegar directamente a `/upgrade` (o al refrescar), el servidor devuelve 404 porque no existe `docs/upgrade/index.html`. Esto afecta a TODAS las rutas deep-linked de la SPA, no solo `/upgrade`.

**Fix**:
1. Crear `docs/404.html` como copia de `docs/index.html` — GitHub Pages redirige automáticamente 404s al SPA router
2. Agregar al script de build en `package.json`:
   ```json
   "build": "vite build && cp docs/index.html docs/404.html"
   ```
3. O alternativamente, ya verificar si `vite.config.ts` puede generar el 404.html automáticamente

**Esfuerzo**: 15min
**Hecho cuando**: navegar directamente a `pawfriend.cl/upgrade` carga la página de upgrade correctamente

---

#### C.1.4. `bereavement-assistant` edge function devuelve 401 (Unauthorized)

**Timestamps**: 06:55 (frame 19884), repetido en cada navegación posterior
**Endpoint**: `POST .../functions/v1/bereavement-assistant`
**UI visible**: "No pude procesar tu mensaje" aparece DOS VECES duplicado en el chat de duelo
**Severidad**: 🔴 ALTA — el flujo memorial es emocionalmente sensible; mostrar errores repetidos a usuarios en duelo es la peor UX posible.

**Diagnóstico**: token JWT inválido o expirado enviado a la edge function, o la función tiene verificación de JWT mal configurada.

**Fix**:
1. Verificar en `supabase/functions/bereavement-assistant/index.ts` cómo se valida el JWT
2. Confirmar que el cliente envía `Authorization: Bearer ${session.access_token}` en el header
3. Verificar que la función no requiere `service_role` cuando debería aceptar `anon` autenticado
4. En el frontend: agregar deduplicación de mensajes de error (no mostrar 2 toasts/bubbles idénticas)
5. Agregar retry con backoff exponencial en vez de retry inmediato

**Esfuerzo**: 2-3h
**Hecho cuando**: el chat de duelo responde correctamente Y no muestra errores duplicados

---

#### C.1.5. `posts`, `user_roles`, `user_stats`, `award_points` — queries 400

**Timestamps**: desde 17:42 (frame 31988, en `/feed`) y 20:21 (frame 37153, en `/paw-game`)
**Endpoints afectados**:
- `GET .../rest/v1/user_roles?select=rol...` → 400
- `GET .../rest/v1/posts?select=*%2Cprof...` → 400
- `GET .../rest/v1/user_stats?select=tot...` → 400
- `POST .../rest/v1/rpc/award_points` → 400
**Severidad**: 🔴 ALTA — feed social y gamificación completamente rotos.

**Diagnóstico**: misma raíz que C.1.1 — schema drift entre types.ts y las tablas reales. Es probable que las tablas `user_roles`, `posts`, `user_stats` hayan sido modificadas por migraciones recientes sin regenerar los tipos.

**Fix**:
1. Verificar existencia de las tablas:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('user_roles', 'posts', 'user_stats');
   ```
2. Si existen: comparar columnas vs queries del frontend
3. Si NO existen: las tablas nunca se crearon y el código hace queries a tablas fantasma
4. Regenerar types después de confirmar schema

**Esfuerzo**: 2-4h (depende de si las tablas existen o hay que crearlas)
**Hecho cuando**: `/feed` muestra posts y `/paw-game` muestra stats reales sin 400s en DevTools

---

#### C.1.6. Retry loop de `bereavement-assistant` persiste después de salir de `/en-memoria`

**Timestamps**: desde 06:55 hasta el final del video (24 min)
**Severidad**: 🟡 MEDIA-ALTA — el POST a `bereavement-assistant` sigue disparándose en CADA navegación posterior, incluso en páginas que no tienen nada que ver con el memorial. Contamina la consola y desperdicia requests.

**Diagnóstico**: probablemente un `useEffect` o `useQuery` que se monta a nivel de layout/provider y nunca se desmonta, o un interval/polling que no se limpia.

**Fix**:
1. `grep -rn "bereavement-assistant" src/` — identificar dónde se monta el hook
2. Asegurar que el efecto se ejecute SOLO dentro de la ruta `/en-memoria`
3. Si usa `useQuery` con `refetchInterval`, asegurar que se desactiva al salir del componente
4. Si usa `setInterval`, limpiar con `clearInterval` en el cleanup del `useEffect`

**Esfuerzo**: 1h
**Hecho cuando**: navegar fuera de `/en-memoria` detiene completamente los requests a `bereavement-assistant`

---

### C.2. BUGS DE UX (P1 — DEBEN ARREGLARSE)

#### C.2.1. DialogContent sin DialogTitle — violación a11y en todos los modales

**Timestamps**: desde 05:13 (frame 16765), repetido en CADA modal de la app
**Warning**: `"DialogContent" requires a "DialogTitle" for the component to be accessible for screen reader users`
**Segundo warning**: `Missing "Description" or "aria-describedby={undefined}" for {DialogContent}`
**Donde**: todos los `<Dialog>` de shadcn/Radix en la app

**Fix**: agregar `<DialogTitle>` y `<DialogDescription>` (o `aria-describedby={undefined}`) a cada `<DialogContent>`. Si el título no debe ser visible, usar `<VisuallyHidden>`.

**Esfuerzo**: 2-3h (buscar todos los DialogContent sin DialogTitle)
**Hecho cuando**: `npm run dev` + navegar por modales no produce warnings de Radix en DevTools

---

#### C.2.2. RadioGroup controlled/uncontrolled en Grimace Scale

**Timestamps**: 01:22 (frame 12253) en el modal de evaluación de dolor (Feline Grimace Scale)
**Warning**: `RadioGroup is changing from uncontrolled to controlled`
**Donde**: componente de pain assessment en la ficha clínica

**Fix**: inicializar el estado del RadioGroup con un valor por defecto (`""` o `"0"`) en vez de `undefined`.

**Esfuerzo**: 15min
**Hecho cuando**: abrir el Grimace Scale no produce warning de controlled/uncontrolled

---

#### C.2.3. Date picker muestra `mm/dd/yyyy` en vez de `dd/mm/yyyy`

**Timestamps**: 10:25 (frame 20743, formulario memorial), 13:26 (frame 25344, formulario recordatorio)
**Severidad**: 🟡 MEDIA — los usuarios chilenos esperan `dd/mm/yyyy`. Usar formato USA causa errores de entrada de fecha.

**Fix**: configurar el locale del date picker a `es-CL` o `es`. Si usa `input type="date"`, el formato depende del navegador — considerar usar un date picker de shadcn con formato explícito.

**Esfuerzo**: 1h
**Hecho cuando**: los date pickers de memorial y recordatorios muestran `dd/mm/aaaa`

---

### C.3. NICE TO HAVE (P2)

#### C.3.1. Color "BLANCo" con capitalización inconsistente

**Timestamps**: frames 22015, 22230, 25085
**Donde**: perfil de mascota, display del campo `color`
**Fix**: aplicar `toTitleCase()` o `.toLowerCase()` + capitalizar primera letra al renderizar. Relacionado con §5.7 del master upgrade (normalización de `display_name`).

**Esfuerzo**: 10min

---

### C.4. OBSERVACIONES POSITIVAS

| # | Hallazgo | Timestamp |
|---|----------|-----------|
| 1 | Landing pública carga limpia, sin errores de consola | 00:00-00:22 |
| 2 | Google OAuth funciona correctamente | 00:27 |
| 3 | Ficha clínica renderiza completa: emergencia vet, seguro, Grimace Scale, crónicos, medicamentos | 00:41+ |
| 4 | **PDF médico se genera correctamente** — layout con datos del paciente, alergias, medicamentos, dieta. Diálogo de impresión funciona. La joya de la corona **funciona** | 11:02-11:36 |
| 5 | Directorio de vets carga bien — Clínica Veterinaria Altamira con Colmevet, comunas, precios | 14:06+ |
| 6 | Directorio de walkers/sitters carga con ratings, precios y descripciones | 15:07-16:32 |
| 7 | Flow.cl payment gateway integra correctamente — plan Premium $3,990 CLP, user ID correcto | 12:35 |
| 8 | Memorial UX es empática — copy explica qué pasará, preserva historial, ofrece ventana de deshacer | 05:13-10:25 |
| 9 | Disclaimer responsable en asistente IA: "Soy un asistente de inteligencia artificial, no una persona" | 06:55 |
| 10 | Pet edit guarda correctamente con toast: "Cambios guardados - Los datos de Kai se actualizaron correctamente" | 23:54 |

---

### C.5. RUTAS VISITADAS (cronológico)

| Tiempo | Ruta | Notas |
|--------|------|-------|
| 00:00-00:22 | `/` (Landing) | Limpia, sin errores |
| 00:23-00:27 | `/auth` | Login, luego Google OAuth |
| 00:27 | Google OAuth redirect | Exitoso |
| 00:41-01:27 | `/pet/:petId/clinical` | Ficha clínica de Kai. Comienzan los 400 de `pet_reminders` |
| 01:39-01:59 | `/auth` (redirect loop?) | Flash breve de auth |
| 01:42-01:43 | `/edit-pet/:petId` | Editar Kai |
| 04:41 | `/?/home` (URL rara) | Home dashboard |
| 05:13 | `/pet/:petId/clinical` + modal share | Diálogo de compartir ficha |
| 05:13-06:13 | Flujo memorial (diálogo despedida) | Kai → "En Memoria" |
| 06:13-06:55 | `/en-memoria` | Formulario memorial + chat bereavement |
| 06:55-09:18 | `/en-memoria` | Chat de duelo (errores 401) |
| 09:27-09:33 | `/my-pets` → `/pet/:petId/clinical` | Vuelve a ficha clínica |
| 09:55-10:25 | Flujo memorial (segundo intento) | Segundo intento de despedida |
| 10:25 | Formulario memorial | Fecha, causa, mensaje |
| 11:02-11:59 | PDF médico (about:blank) | PDF renderiza, diálogo de impresión |
| 12:06 | New Tab (Google) | Breve cambio de tab |
| 12:13 | `/pet/:petId/clinical` | Vuelve a ficha clínica |
| 12:13-12:34 | `/paw-game` | PawGame, misiones, ranking |
| 12:35 | Flow.cl payment page | Redirect upgrade Premium |
| 12:36-13:15 | `/my-pets` | Lista de mascotas |
| 13:19-13:31 | `/pet/:petId/clinical` | Clínica + recordatorios |
| 13:22-13:31 | Formulario crear recordatorio | Tipo, título, fecha (falla silenciosamente) |
| 13:53 | `/upgrade` | **404 error** |
| 14:04 | `/precios-veterinarios` | Estimador de precios |
| 14:06-14:56 | `/veterinarios/:slug` | Perfil vet (Altamira) + booking |
| 15:07-16:17 | `/services/walkers` | Directorio paseadores |
| 16:17-16:32 | `/services/sitters` | Directorio cuidadores |
| 17:42-17:46 | `/feed` | Feed social (**roto**, queries 400) |
| 20:21-20:41 | `/paw-game` (revisita) | Stats **rotas** |
| 20:37 | `/medical-records` | Registros médicos |
| 23:54 | `/my-pets` | Edit pet exitoso |

---

### C.6. Cruce con items existentes del master upgrade

| Bug video | Item existente | Nota |
|-----------|---------------|------|
| C.1.3 (`/upgrade` 404) | Nuevo — no estaba documentado | SPA routing en GH Pages nunca se configuró |
| C.1.1-C.1.2 (pet_reminders) | Nuevo — no estaba documentado | Schema drift post-migraciones |
| C.1.4 (bereavement 401) | Nuevo | Edge function auth issue |
| C.1.5 (posts/user_roles 400) | Nuevo | Feed social nunca testeado end-to-end |
| C.2.1 (DialogTitle a11y) | §1.1 auditar modales Dialog (parcial) | §1.1 se enfoca en overflow, no en a11y |
| C.2.3 (date format) | Nuevo | Locale no configurado para Chile |
| C.3.1 (capitalización color) | §5.7 normalizar capitalización | Ya documentado, scope ampliado |

**6 bugs nuevos** no documentados previamente en ninguna fase del master upgrade. Los más graves: la ruta `/upgrade` devolviendo 404 mata el funnel de monetización, y `pet_reminders` roto en cada página degrada toda la experiencia autenticada.

---

### C.7. Resumen ejecutivo video QA

| Categoría | Conteo | Impacto |
|-----------|--------|---------|
| Errores de consola P0 | 6 | Recordatorios, feed, gamificación, memorial IA, upgrade Premium — todos rotos |
| Bugs UX P1 | 3 | a11y en modales, locale fechas, state warning |
| Nice-to-have P2 | 1 | Capitalización cosmética |
| **Positivos confirmados** | **10** | Landing, OAuth, PDF médico, directorio vets, Flow.cl, memorial UX |
| Rutas visitadas | 25+ | Cobertura amplia del flujo dueño de mascota |

**Camino crítico de este anexo**: C.1.3 (15 min, desbloquea monetización) → C.1.1 + C.1.2 (2h, desbloquea recordatorios) → C.1.5 (2-4h, desbloquea feed y game) → C.1.4 + C.1.6 (3h, desbloquea memorial IA).

*Análisis generado 2026-04-11. Fuente: video "Paw Friend video 25 min.mp4" + OCR automatizado (229 frames, Tesseract spa+eng).*
