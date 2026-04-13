# Vistas por Rol y Plan — Paw Friend

> Spec de referencia para definir exactamente que ve cada tipo de usuario.
> Fecha: 2026-04-13

---

## 1. Los 3 modos de vista

| Modo | Quien lo ve | Como se activa | Sidebar | BottomTabBar | Home |
|---|---|---|---|---|---|
| **Dueno** | Todo usuario autenticado | Default al hacer login | Salud + Descubrir + Comunidad | Inicio, Mascotas, Vets, Recordatorios, Perfil | Dashboard mascotas |
| **Proveedor** | Usuarios con perfil en `service_providers` | Toggle en header o acceso directo a `/provider/*` | Consultorio + Negocio | Dashboard, Mascotas, Reservas, Perfil Pro, Perfil | Dashboard profesional |
| **Dual-role** | Usuarios que son dueno Y proveedor | Toggle en header cambia entre ambos modos | Cambia segun modo activo | Cambia segun modo activo | Cambia segun modo activo |

---

## 2. Vista Dueno — Detalle completo

### 2.1 Sidebar (desktop)

| Seccion | Items | Gate |
|---|---|---|
| **Salud** | Inicio, Mis mascotas, Recordatorios | Tutorial onboarding (no es premium) |
| **Descubrir** | Buscar vet, Servicios, Mapa, Banco de sangre | Tutorial onboarding |
| **Comunidad** | Feed, Comunidad, Mensajes, Paw Cards, Paw Game | Tutorial onboarding |

Si el usuario es dual-role, aparece un link compacto "Mi consultorio" al final del sidebar que lleva a `/provider/dashboard`.

### 2.2 BottomTabBar (mobile)

| Tab | Ruta | Badge |
|---|---|---|
| Inicio | `/home` | — |
| Mascotas | `/my-pets` | — |
| Vets | `/veterinarios` | — |
| Recordatorios | `/reminders` | Vencidos + proximos 24h |
| Perfil | `/profile` | — |

### 2.3 Home — Dashboard de mascotas

| Seccion | Descripcion | Gate |
|---|---|---|
| Saludo + avatar | "Buenas tardes, Pedro" + avatar usuario | Ninguno |
| Pet switcher | Circulos con foto de cada mascota + boton agregar | `max_pets` limita agregar |
| Status cards (x4) | Proxima cita, Vacunas, Ficha medica %, Racha paseos | Ninguno |
| SOS Vet | Banner emergencia veterinaria | Ninguno |
| Proximos cuidados | Recordatorios vencidos y proximos | Ninguno |
| Estimador precios | Card para agregar comuna | Ninguno |
| Reporte semanal | Card resumen IA semanal | `weekly_summary` — premium |
| Tips estacionales | Consejos por especie y temporada | Ninguno |
| Analytics preview | Preview de analytics para PRO | Flag `PRO_ANALYTICS` |
| Resenas pendientes | Invitaciones de resena sin responder | Ninguno |
| Acciones rapidas | 4 botones: Agregar mascota, Buscar vet, Recordatorio, Ver ficha | Ninguno |
| Paw Game widget | Mini-juego gamificacion | Flag `PAWGAME_SIDEBAR` |
| Integraciones | Prompt Google Calendar si no conectado | Ninguno |
| Feed comunidad | Actividad reciente del feed social | Ninguno |

### 2.4 Paginas exclusivas del dueno

| Pagina | Ruta | Descripcion |
|---|---|---|
| Mis mascotas | `/my-pets` | Lista de mascotas con cards TCG |
| Agregar mascota | `/add-pet` | Formulario + OCR carnet |
| Editar mascota | `/edit-pet/:id` | Edicion de perfil mascota |
| Ficha clinica | `/ficha/:petId` | Ficha medica completa con tabs |
| Recordatorios | `/reminders` | Lista de recordatorios activos |
| Adopcion | `/adoption` | Publicaciones de adopcion |
| En memoria | `/en-memoria` | Memorial de mascotas fallecidas |
| Paw Cards | `/paw-collection` | Coleccion de cards TCG |
| Paw Game | `/paw-game` | Mini-juego gamificacion |
| Feed | `/feed` | Feed social |
| Comunidad | `/comunidad` | Grupos por raza/condicion |
| Chat | `/chat` | Mensajeria |
| Reportes | `/reportes` | Reportes semanales IA |

---

## 3. Vista Proveedor — Detalle completo

### 3.1 Sidebar (desktop)

| Seccion | Items | Gate |
|---|---|---|
| **Consultorio** | Dashboard, Mis reservas | RoleGuard (requiere `service_providers`) |
| **Negocio** | Perfil publico, Panel Pro | RoleGuard + Panel Pro requiere plan vet premium |

Si el usuario es dual-role, aparece un link compacto "Mis mascotas" al final del sidebar que lleva a `/my-pets`.

Si es groomer (`groomer_profiles`), aparece "Perfil peluquero" en la seccion Negocio.

### 3.2 BottomTabBar (mobile)

| Tab | Ruta | Badge |
|---|---|---|
| Dashboard | `/provider/dashboard` | — |
| Mascotas | `/my-pets` | — |
| Reservas | `/mis-reservas` | — |
| Perfil Pro | `/provider/profile-edit` | — |
| Perfil | `/profile` | — |

### 3.3 Home — Dashboard profesional

Cuando el proveedor navega a `/home`, ve el `ProviderDashboard` directamente:

| Seccion | Descripcion | Gate |
|---|---|---|
| Header "Mi consultorio" | Titulo + botones ver perfil publico + editar perfil | Ninguno |
| Tip consulta | Recordatorio de registrar consultas | Ninguno |
| Agenda del dia | Citas programadas para hoy | Ninguno |
| Seguimientos semanales | Pacientes con seguimiento pendiente | Ninguno |
| Solicitudes vinculacion | Solicitudes pendientes de vincular mascotas | Ninguno |
| Pacientes vinculados | Lista de mascotas vinculadas al vet | Ninguno |
| Fichas compartidas | Fichas enviadas por duenos via link publico | Ninguno |
| Onboarding wizard | Si no tiene actividad, guia paso a paso | Ninguno |
| Card directorio | Link a su perfil en el directorio publico | Ninguno |
| Metricas (x4) | Pacientes mes, Rating, Vistas perfil, Seguimientos | Ninguno |
| Actividad (x4) | Fichas compartidas, Reservas, Resenas, Ingresos estimados | Ninguno |
| Tabla actividad reciente | Ultimas acciones del consultorio | Ninguno |
| Crear promocion | Formulario para crear promocion de servicio | Ninguno |

### 3.4 Paginas exclusivas del proveedor

| Pagina | Ruta | Descripcion |
|---|---|---|
| Dashboard | `/provider/dashboard` | Centro de control profesional |
| Mis reservas | `/mis-reservas` | Agenda y reservas |
| Perfil publico | `/provider/profile-edit` | Editar perfil en directorio |
| Panel Pro | `/panel-pro` | Analytics avanzados |
| Perfil peluquero | `/peluquero/perfil` | Solo groomers |
| Onboarding vet | `/onboarding-vet` | Onboarding inicial |

---

## 4. Vista Dual-role — Diferencias

El usuario dual-role tiene acceso a AMBAS vistas y puede alternar con el toggle en el header.

| Elemento | Modo Dueno activo | Modo Proveedor activo |
|---|---|---|
| **Toggle header** | Pill purpura "Dueno" con icono pata | Pill teal "Profesional" con icono estetoscopio |
| **Click toggle** | Cambia a provider + navega a `/provider/dashboard` | Cambia a owner + navega a `/home` |
| **Sidebar** | Salud + Descubrir + Comunidad + link "Mi consultorio" | Consultorio + Negocio + link "Mis mascotas" |
| **BottomTabBar** | Tabs de dueno | Tabs de proveedor |
| **Home `/home`** | Dashboard mascotas | Dashboard profesional |
| **Boton Coleccion** | Visible en header | Oculto |

---

## 5. Free vs Premium — Matriz completa

### 5.1 Estado actual

`USER_PREMIUM = false` en `featureFlags.ts`. Esto significa que **toda la app es gratis** para usuarios B2C hoy. Los gates estan implementados pero dormidos. Cuando se prenda el flag, se activan automaticamente.

### 5.2 Que cambia entre Free y Premium

| Feature | Free | Premium | Donde se ve | Enforcement |
|---|---|---|---|---|
| **Mascotas** | 2 max | Ilimitadas | `/add-pet` — bloquea agregar 3ra | Server RPC `can_add_pet` |
| **Recordatorios activos** | 3 max | Ilimitados | `/reminders` — bloquea crear 4to | Hook `useReminders` |
| **Historial medico** | Ultimos 6 meses | Completo | `/ficha/:petId` — filtra registros por fecha | Hook `useMedicalRecords` |
| **Exportar PDF** | Bloqueado | Habilitado | `/ficha/:petId` — boton Exportar PDF | `PremiumGate` + server 402 |
| **Compartir ficha** | 1 token activo | Ilimitados | `/ficha/:petId` — boton Compartir | Hook `useMedicalSharing` |
| **Asistente IA** | 1 consulta/mes | Ilimitado | Componente `PetAssistant` | Hook `checkAccess` |
| **Tips por raza** | 1 uso/sesion | Ilimitado | Componente `BreedTips` | Hook `checkAccess` |
| **OCR carnet** | 1 escaneo | Ilimitado | `/add-pet` — VaccinationCardOCR | Client-side |
| **Reporte semanal IA** | Bloqueado | Habilitado | Home — `WeeklyReportCard` | `PremiumGate` |
| **Analytics** | Bloqueado | Habilitado | `/panel-pro` — `ProDashboard` | `LockedOverlay` |
| **Export analytics** | Bloqueado | Habilitado | `/panel-pro` — botones CSV/PDF | `checkAccess` |
| **Tarifa reserva** | $5 por booking | $0 | `BookingModal` | Calculo en UI |
| **Publicidad** | Con ads | Sin ads | Toda la app | Flag `ad_free` |
| **Soporte prioritario** | No | Si | `/settings` | Flag `priority_support` |

### 5.3 Que NO cambia entre Free y Premium

Estas features son identicas en ambos planes:

| Feature | Disponible para todos | Ruta |
|---|---|---|
| Ver ficha clinica | Si (con limite de historial en free) | `/ficha/:petId` |
| Buscar veterinarios | Si | `/veterinarios` |
| Directorio servicios | Si | `/servicios` |
| Mapa de servicios | Si | `/maps` |
| Banco de sangre | Si | `/donantes-sangre` |
| Feed social | Si | `/feed` |
| Comunidad / grupos | Si | `/comunidad` |
| Chat / mensajes | Si | `/chat` |
| Paw Cards coleccion | Si | `/paw-collection` |
| Paw Game | Si | `/paw-game` |
| Adopcion | Si | `/adoption` |
| En memoria | Si | `/en-memoria` |
| Perfil usuario | Si | `/profile` |
| Configuracion | Si | `/settings` |
| Google Calendar | Si | Integracion |
| Onboarding | Si | `/onboarding-mascota` |
| Editar mascota | Si | `/edit-pet/:id` |
| Agendar cita | Si (con tarifa en free) | Booking modal |
| Sugerencias medicas IA | Si | Edge function |
| Asistente memorial IA | Si | Edge function |

### 5.4 UX del teaser para Free users (cuando USER_PREMIUM = true)

| Feature bloqueada | Que ve el usuario free | Componente |
|---|---|---|
| **PDF export** | Boton visible con blur + overlay "Desbloquear con Premium" | `PremiumGate` envolviendo `MedicalSummaryButton` |
| **Reporte semanal** | Card de ejemplo con datos ficticios + blur + CTA | `PremiumGate` envolviendo `WeeklyReportSampleCard` |
| **AI assistant** | Despues de 1 consulta: respuesta ejemplo blurred + barra uso 1/1 + CTA | `PremiumNudge` con preview blurred |
| **Recordatorios** | Barra de progreso "2/3 recordatorios" + CTA inline | `PremiumNudge` inline |
| **Analytics** | Dashboard con datos blurred + overlay lock | `LockedOverlay` existente |
| **Sidebar Panel Pro** | Badge "PRO" junto al nombre | `PremiumBadge` |
| **Upgrade page** | Scroll automatico al feature si llega con `?feature=xxx` + social proof | Query param highlight |

### 5.5 Pricing

| Plan | Mensual | Anual | Equivalente/mes |
|---|---|---|---|
| **Gratis** | $0 | $0 | $0 |
| **Premium** | $3.990 | $39.900 | $3.325 |

Oferta de lanzamiento: primeros 500 usuarios mantienen $3.990/mes para siempre.

---

## 6. Planes Veterinarios B2B (separados del B2C)

| Plan | Precio/mes | Clientes | Reservas/mes | Resenas | Destacado | Comision | Extras |
|---|---|---|---|---|---|---|---|
| **Vet Gratis** | $0 | 15 | 10 | 2 invitaciones | No | 10% | — |
| **Individual** | $9.900 | 100 | 50 | 5 invitaciones | No | 10% | Audio transcripcion |
| **Clinica Basica** | $29.900 | 500 | Ilimitadas | 20 invitaciones | Si | 10% | Multi-vet |
| **Clinica Pro** | $59.900 | Ilimitados | Ilimitadas | Ilimitadas | Si | 0% | Analytics, API, soporte prioritario |

---

## 7. Feature flags que afectan visibilidad

| Flag | Estado actual | Que controla |
|---|---|---|
| `USER_PREMIUM` | **false** | Todo el sistema de gating B2C. Si false, todo es gratis. |
| `PAWGAME_SIDEBAR` | **true** | Paw Game visible en sidebar y Home |
| `PRO_ANALYTICS` | **true** | Panel Pro y analytics cards visibles |
| `MARKETPLACE` | false | Marketplace oculto |
| `SHARED_WALKS` | false | Paseos compartidos oculto |
| `LOST_PETS_SECTION` | false | Mascotas perdidas como seccion oculto |

---

## 8. Resumen visual

```
USUARIO NO LOGUEADO
  └─ Ve: Landing, directorio vets, precios, demo, QR publico, paw card publica

USUARIO LOGUEADO (DUENO)
  ├─ FREE:  Todo el sidebar, Home completo, 2 mascotas, 3 recordatorios, 6 meses historial
  │         Features premium visibles pero con blur/lock/teaser
  └─ PREMIUM: Todo desbloqueado, sin limites, sin publicidad, sin tarifa reserva

USUARIO LOGUEADO (PROVEEDOR)
  ├─ VET GRATIS: Dashboard, 15 clientes, 10 reservas, perfil basico
  └─ VET PRO:    Todo ilimitado, 0% comision, analytics, API

USUARIO DUAL-ROLE
  └─ Toggle en header cambia entre vista dueno y vista proveedor completas
     Cada modo tiene su propio sidebar, home, y tabs
```
