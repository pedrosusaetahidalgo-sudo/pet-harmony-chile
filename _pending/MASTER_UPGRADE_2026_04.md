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

### 0.2. Google OAuth muestra UUID de Supabase

**Fuente**: QA_UX_UI_COMPLETO.md bug #2, UX_DUENO_MASCOTA.md §2.1, UX_VETERINARIO.md §2.2
**Severidad**: GRAVE — rompe confianza antes de entrar al producto
**Sintoma**: Google muestra `gwailbjlvevkhwcrovfd.supabase.co` en vez de "Paw Friend"

**Fix (accion del dueno en Google Cloud Console)**:
1. Ir a Google Cloud Console > APIs & Services > OAuth consent screen
2. Nombre de app: "Paw Friend"
3. Logo: PNG 120x120 oficial
4. Dominio autorizado: `pawfriend.cl`
5. Privacy policy URL: `https://pawfriend.cl/privacy`
6. Terms URL: `https://pawfriend.cl/terms`
7. Solicitar verificacion oficial de Google (4-6 semanas)

**Esfuerzo**: 1h config + 4-6 semanas verificacion Google
**Hecho cuando**: Google consent screen dice "Paw Friend" con logo

---

### 0.3. HTTPS en pawfriend.cl

**Fuente**: QA_UX_UI_COMPLETO.md bug #32
**Severidad**: GRAVE — "No seguro" visible en iPhone mata confianza, especialmente para vets
**Fix**: Activar HTTPS en GitHub Pages (Settings > Pages > Enforce HTTPS) o migrar a Cloudflare Pages/Vercel
**Esfuerzo**: 30min
**Hecho cuando**: `curl -I https://pawfriend.cl` retorna 200

---

### 0.4. CRITICO — Seed data con email/telefono/Colmevet de otro vet (riesgo privacy)

**Fuente**: ADDENDUM f44+f45, QA bug #3 ESCALADO a CRITICO
**Severidad**: CRITICA — riesgo de filtracion de datos personales (Ley 19.628 Chile)
**Sintoma**: el formulario de edicion del perfil vet se pre-carga con datos COMPLETOS de otro vet seed:
- Foto de otra persona (Dra. Javiera Munoz / Francisca Lagos)
- Bio en femenino de otra persona
- Email publico: `javiera.munoz@demo.pawfriend.cl`
- Telefono publico: `+56 9 8765 1001`
- N Colmevet: `12345`
- Anos de experiencia de otro perfil

**Riesgo real**: si un vet nuevo guarda sin editar todos los campos, publica un perfil profesional con la identidad de otra persona. Los duenos contactan al numero equivocado. Potencial infraccion Ley 19.628.

**El dashboard del vet (f43) TAMBIEN esta contaminado**: muestra card "Tu perfil publico" con badge verde "Visible" y nombre "Dra. Javiera Munoz" aunque el usuario logueado es Pedro.

**Fix obligatorio**:
1. Buscar el componente editor de perfil vet (probablemente en `src/components/provider/` o `src/pages/`)
2. Para usuarios nuevos (sin provider existente): los campos DEBEN inicializar VACIOS
3. Para usuarios con provider existente: cargar SOLO sus propios datos con `WHERE user_id = auth.uid()`
4. Usar placeholders neutros: "Ej: Medico/a veterinario/a con experiencia en..."
5. Agregar guard al guardar: si email, telefono o Colmevet coinciden con otro `service_provider` que tenga `is_demo=true`, bloquear con mensaje "Estos datos coinciden con un perfil demo. Editalos antes de publicar."
6. Dashboard del vet: verificar que la card "Tu perfil publico" cargue datos del usuario actual, no de un seed

**Auditoria retroactiva** (ejecutar en Supabase SQL Editor):
```sql
-- Verificar que ningun vet real tenga datos duplicados de seeds
SELECT sp.id, sp.display_name, sp.slug
FROM service_providers sp
WHERE sp.is_demo = false
  AND (
    sp.display_name IN (SELECT display_name FROM service_providers WHERE is_demo = true)
    OR sp.slug IN (SELECT slug FROM service_providers WHERE is_demo = true)
  );
```
Si hay resultados, contactar a esos vets inmediatamente.

**Esfuerzo**: 3-4h
**Hecho cuando**: un usuario nuevo ve campos vacios en el editor de perfil vet, y el dashboard muestra solo sus propios datos

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

### 7.2. Queries de metricas basicas

**Fuente**: RECOMENDACIONES §7

Crear SQL snippets guardados en Supabase Studio:
```sql
-- Users reales
SELECT count(*) FROM auth.users WHERE email NOT LIKE '%@demo.pawfriend.cl';
-- Mascotas activas
SELECT count(*) FROM pets p JOIN profiles pr ON p.owner_id = pr.id WHERE pr.is_demo = false;
-- Fichas compartidas
SELECT count(*) FROM medical_share_tokens;
-- Vets reales
SELECT count(*) FROM service_providers WHERE is_demo = false;
```

---

## FASE 8 — DOCUMENTACION VIVA (con cada commit)

> Mantener sincronizados segun regla de INDEX.md

### Documentos a actualizar si se tocan rutas/navegacion/flujos:

- `diagrams/FLUJO_COMPLETO.mmd`
- `diagrams/FLUJOS_MERMAID.md`
- `MAPA_FUNCIONAL_COMPLETO.md`
- `AGENTS.md`

### Features subcomunicadas que hay que documentar como EXISTENTES:

**Fuente**: QA_UX_UI_COMPLETO.md hallazgos positivos

1. **OCR de carnet de vacunacion con IA** — esta conectado y funcionando (docs dicen "deployada, no conectada")
2. **Feline Grimace Scale** — esta en produccion (docs dicen "pendiente en roadmap")
3. **Boton "Ver como me ven los duenos"** en perfil vet — feature unica, documentar como diferenciador

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
