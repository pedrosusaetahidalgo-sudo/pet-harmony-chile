# Propuesta: Sidebar Profesional enriquecido

> Fecha: 2026-04-13
> Estado: Propuesta para revision
> Archivo de referencia: `src/components/AppSidebar.tsx`

---

## 1. Diagnostico actual

### Sidebar Owner (15 items en 3 secciones)

| Seccion | Items |
|---------|-------|
| **SALUD** | Inicio, My Paws, Recordatorios, Rutinas, Calendario |
| **DESCUBRIR** | Buscar vet, Servicios, Mapa, Banco de sangre |
| **COMUNIDAD** | Feed, Comunidad, Mensajes, Coleccion, Misiones, Paw Game |

### Sidebar Provider (4-5 items en 2 secciones)

| Seccion | Items |
|---------|-------|
| **CONSULTORIO** | Dashboard, Mis reservas |
| **NEGOCIO** | Perfil publico, Panel Pro, [Perfil peluquero si aplica] |
| _Link compacto_ | My Paws (dual-role) |

### Problema

El sidebar profesional tiene **4 items fijos** vs **15 del dueno**. Esto genera:

1. **Percepcion de producto vacio** -- el vet entra y ve un sidebar con 2 secciones minimas
2. **Features enterradas** -- Chat, Calendario, Reportes y Pacientes existen pero solo se acceden desde el Dashboard o cambiando de rol
3. **Sin acceso directo a herramientas clinicas** -- la grabacion de consulta, fichas compartidas y seguimientos estan escondidos dentro de cards del dashboard
4. **Admin sin presencia en sidebar** -- los admins deben navegar manualmente a `/admin`

---

## 2. Propuesta: Nuevo sidebar profesional

### Estructura propuesta (4 secciones, 11-13 items)

```
CONSULTORIO (clinica diaria)
  Dashboard              /provider/dashboard        LayoutDashboard
  Pacientes              /provider/dashboard#patients  Users          ← NUEVO
  Fichas compartidas     /provider/dashboard#fichas    FileText       ← NUEVO
  Mis reservas           /mis-reservas               Calendar
  Calendario             /calendario                 CalendarDays   ← RESCATADO de Owner

COMUNICACION
  Mensajes               /chat                       MessageSquare  ← RESCATADO de Owner
  Seguimientos           /provider/dashboard#followups  Bell         ← NUEVO (badge con count)

NEGOCIO
  Perfil publico         /provider/profile-edit       UserCog
  Panel Pro              /panel-pro                   Star           (PremiumBadge)
  Reportes               /reportes                    BarChart3      ← RESCATADO de Owner
  [Perfil peluquero]     /peluquero/perfil            Scissors       (condicional si groomer)

ADMIN (solo si rol admin)
  Panel admin            /admin                       Shield         ← NUEVO
```

### Link compacto dual-role (se mantiene)
```
  My Paws                /my-pets                     PawPrint       (color purple)
```

---

## 3. Detalle de cada item nuevo o rescatado

### 3.1. Pacientes (NUEVO)

**Que es**: Acceso directo a la lista de pacientes vinculados + solicitudes pendientes.

**Estado actual**: `LinkedPatientsCard`, `VetPatientsList` y `PendingVetLinksCard` existen como cards dentro del Dashboard. No tienen ruta propia.

**Implementacion**:
- **Opcion A (rapida)**: Scroll-to-section con anchor `#patients` en el Dashboard. El sidebar navega a `/provider/dashboard` y hace scroll automatico a la seccion de pacientes.
- **Opcion B (ideal a futuro)**: Pagina dedicada `/provider/pacientes` que reutiliza los componentes existentes (`VetPatientsList`, `PendingVetLinksCard`, `PatientQuickView`) con busqueda y filtros. Permitiria agregar busqueda por nombre de mascota, filtro por especie, y orden por ultima consulta.

**Badge**: Mostrar count de solicitudes pendientes de vinculacion (`usePendingVetLinks`).

### 3.2. Fichas compartidas (NUEVO)

**Que es**: Acceso directo a las fichas clinicas compartidas por duenos en los ultimos 7-30 dias.

**Estado actual**: `SharedFichasCard` existe en el Dashboard.

**Implementacion**:
- **Opcion A (rapida)**: Anchor `#fichas` en Dashboard con scroll automatico.
- **Opcion B (ideal)**: Pagina `/provider/fichas-compartidas` con la lista expandida, filtro por estado (activa/expirada), y acceso directo al editor de notas clinicas y grabador de consulta.

**Badge**: Mostrar count de fichas compartidas activas no revisadas.

### 3.3. Calendario (RESCATADO de Owner)

**Que es**: Calendario unificado que muestra citas, reservas y seguimientos del vet.

**Estado actual**: La ruta `/calendario` ya existe y funciona. El componente `UnifiedPetCalendar` ya maneja multiples fuentes de datos. Solo falta agregarlo al sidebar del provider.

**Implementacion**: Agregar el item al array `providerConsultItems`. Zero codigo nuevo.

### 3.4. Mensajes (RESCATADO de Owner)

**Que es**: Chat con clientes/duenos de mascotas.

**Estado actual**: La ruta `/chat` ya existe y es funcional para ambos roles. El sistema de chat no discrimina por rol. Solo falta el acceso desde el sidebar provider.

**Implementacion**: Agregar al sidebar. Zero codigo nuevo.

**Badge** (futuro): Count de mensajes no leidos.

### 3.5. Seguimientos (NUEVO)

**Que es**: Lista de seguimientos pendientes (followups agendados desde notas clinicas).

**Estado actual**: `VetFollowupsCard` existe en el Dashboard.

**Implementacion**:
- **Opcion A (rapida)**: Anchor `#followups` en Dashboard.
- **Opcion B (ideal)**: Pagina `/provider/seguimientos` con lista completa, filtro por fecha, mascota, y acciones de contactar dueno.

**Badge**: Count de seguimientos pendientes proximos 7 dias (`useProviderDashboardStats`).

### 3.6. Reportes (RESCATADO de Owner)

**Que es**: Reportes semanales generados por IA con estadisticas del vet.

**Estado actual**: La ruta `/reportes` existe. La edge function `generate-weekly-vet-reports` genera reportes especificos para vets (stats de consultas, ratings, tendencias). Solo falta el link en sidebar.

**Implementacion**: Agregar al array de items de negocio. Zero codigo nuevo.

### 3.7. Panel admin (NUEVO - condicional)

**Que es**: Acceso directo al panel de administracion para usuarios con rol `admin`.

**Estado actual**: La ruta `/admin` existe protegida por `AdminRoute`. Los admins hoy deben escribir la URL manualmente o tener un bookmark.

**Implementacion**:
- Usar el hook `useIsAdmin()` existente.
- Renderizar la seccion "ADMIN" al final del sidebar solo si `isAdmin === true`.
- Funciona tanto en modo owner como provider (los admins pueden estar en cualquier rol).
- Icono: `Shield` o `ShieldCheck` de lucide-react.

---

## 4. Que NO mover al sidebar provider

| Item Owner | Razon para no moverlo |
|------------|----------------------|
| Recordatorios | Contexto de dueno: recordatorios de SUS mascotas |
| Rutinas | Idem, rutinas de las mascotas del dueno |
| Buscar vet | Un vet no necesita buscar otros vets (ya esta en el directorio) |
| Servicios | Orientado a consumidores, no proveedores |
| Mapa | Idem |
| Banco de sangre | Feature de comunidad, accesible via cambio de rol |
| Comunidad | Accesible cambiando a modo dueno, no es core del flujo profesional |
| Coleccion | Gamificacion para duenos |
| Misiones | Idem |
| Paw Game | Idem |
| Feed | Accesible cambiando a modo dueno. Si a futuro hay un feed profesional (noticias veterinarias, actualizaciones de la plataforma), se puede agregar |

---

## 5. Bottom Tab Bar (mobile) -- propuesta actualizada

### Actual (5 tabs)

```
Dashboard | My Paws | Reservas | Perfil Pro | Perfil
```

### Propuesto (5 tabs, reorganizado)

```
Dashboard | Pacientes | Reservas | Mensajes | Perfil
```

**Cambios**:
- `My Paws` → `Pacientes` (mas relevante en contexto profesional; My Paws accesible via sidebar)
- `Perfil Pro` → `Mensajes` (Perfil Pro accesible via sidebar; mensajes son mas urgentes en mobile)
- `Perfil` se mantiene (acceso a settings + cuenta)

---

## 6. Mockup visual del sidebar propuesto

```
┌─────────────────────┐
│ 🐾 paw friend       │
├─────────────────────┤
│ CONSULTORIO    🩺    │
│  Dashboard          │
│  Pacientes      (3) │  ← badge: 3 solicitudes pendientes
│  Fichas compartidas │
│  Mis reservas       │
│  Calendario         │
├─────────────────────┤
│ COMUNICACION        │
│  Mensajes           │
│  Seguimientos   (2) │  ← badge: 2 followups esta semana
├─────────────────────┤
│ NEGOCIO             │
│  Perfil publico     │
│  Panel Pro     PRO  │
│  Reportes           │
│  [Perfil peluquero] │  ← solo si isGroomer
├─────────────────────┤
│ ADMIN          🛡    │  ← solo si isAdmin
│  Panel admin        │
├─────────────────────┤
│  My Paws       🟣   │  ← link compacto dual-role (purple)
├─────────────────────┤
│  ⚙ Configuracion    │
│  🚪 Cerrar sesion   │
└─────────────────────┘
```

---

## 7. Plan de ejecucion

### Fase 1 -- Quick wins (zero paginas nuevas)

Agregar items al sidebar que ya tienen ruta funcional:

| Item | Ruta | Seccion | Esfuerzo |
|------|------|---------|----------|
| Calendario | `/calendario` | Consultorio | 1 linea |
| Mensajes | `/chat` | Comunicacion (nueva seccion) | 3 lineas |
| Reportes | `/reportes` | Negocio | 1 linea |
| Panel admin | `/admin` | Admin (nueva seccion condicional) | ~15 lineas + `useIsAdmin` import |

**Archivos a modificar**:
- `src/components/AppSidebar.tsx` -- agregar items a los arrays y seccion admin
- `src/components/BottomTabBar.tsx` -- reorganizar tabs mobile

**Estimacion**: Cambios menores, solo en 2 archivos.

### Fase 2 -- Anchors con scroll (sin paginas nuevas)

| Item | Target | Badge |
|------|--------|-------|
| Pacientes | `/provider/dashboard` + scroll a seccion | Count de `pending_vet_links` |
| Fichas compartidas | `/provider/dashboard` + scroll a seccion | Count de fichas activas |
| Seguimientos | `/provider/dashboard` + scroll a seccion | Count proximos 7 dias |

**Archivos a modificar**:
- `src/components/AppSidebar.tsx` -- items con scroll logic
- `src/components/provider/ProviderDashboard.tsx` -- ids en secciones target
- `src/hooks/useProviderDashboardStats.ts` -- exponer counts para badges

### Fase 3 -- Paginas dedicadas (opcional, cuando crezca el uso)

Crear paginas standalone para Pacientes, Fichas compartidas y Seguimientos cuando el volumen de datos justifique separar la informacion del Dashboard. Reutilizar componentes existentes.

---

## 8. Impacto esperado

| Metrica | Antes | Despues |
|---------|-------|---------|
| Items sidebar provider | 4-5 | 11-13 |
| Secciones sidebar | 2 | 4 |
| Clicks para llegar a Chat | 3+ (cambiar rol → sidebar → chat) | 1 |
| Clicks para llegar a Calendario | 3+ (cambiar rol) | 1 |
| Clicks para llegar a Reportes | URL manual o cambio de rol | 1 |
| Acceso admin | URL manual `/admin` | 1 click desde sidebar |
| Visibilidad de followups pendientes | Solo dentro del Dashboard | Badge permanente en sidebar |

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigacion |
|--------|-----------|
| Sidebar demasiado largo en pantallas chicas | Las 4 secciones suman ~13 items, similar al sidebar owner (15). El scroll ya funciona. |
| Confusion con sidebar de owner | Color teal se mantiene para todo el modo profesional. Las secciones tienen nombres distintos (Consultorio vs Salud, Comunicacion vs Comunidad). |
| Badge queries adicionales | Los datos de `useProviderDashboardStats` ya se cargan en el Dashboard; reutilizar el mismo query con `staleTime` alto. |
| Admin visible a no-admins | Seccion condicional con `useIsAdmin()` que ya existe y esta probado. |

---

## 10. Decision requerida

- [ ] Aprobar Fase 1 (quick wins: Calendario, Mensajes, Reportes, Admin)
- [ ] Aprobar Fase 2 (anchors: Pacientes, Fichas compartidas, Seguimientos)
- [ ] Aprobar cambio Bottom Tab Bar mobile
- [ ] Aprobar/rechazar items individuales de la propuesta
