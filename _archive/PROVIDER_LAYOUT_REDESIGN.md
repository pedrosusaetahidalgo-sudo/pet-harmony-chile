# Provider Layout Redesign — Paw Friend

> Rediseno completo de todas las pestanas del modo Profesional.
> Fecha: 2026-04-13

---

## Problemas detectados (estado actual)

| Problema | Donde ocurre | Impacto |
|---|---|---|
| Layout 100% vertical (scroll infinito) | Dashboard, Perfil, Panel Pro | El vet hace scroll 5+ pantallas para ver todo |
| Metricas sin jerarquia visual | Dashboard (8 MetricCards iguales) | No se distingue lo urgente de lo informativo |
| Cards apiladas sin relacion | Dashboard | Agenda, pacientes, fichas, metricas — todo mezclado sin agrupacion |
| Sidebar con solo 4 items | Sidebar provider | Pacientes y Calendario no aparecen, Seguimientos redirige al dashboard |
| Espacios muertos | Perfil publico, Reservas | Mucho padding, cards con poca densidad de informacion |
| Panel Pro desconectado | Panel Pro como pagina separada | El vet navega entre 2 dashboards sin saber cual mirar |
| Perfil publico = form largo | ProviderProfileEdit | 6 secciones lineales, scroll agotador |
| Reservas = solo calendario | MyBookings | No muestra resumen ni estadisticas de reservas |

---

## Principios de diseno

1. **Dashboard = cockpit, no feed.** Toda la info critica visible sin scroll.
2. **Grids de 2-3 columnas en desktop.** Aprovechar ancho, no solo apilar.
3. **Jerarquia visual clara.** Lo urgente arriba-izquierda, lo informativo abajo-derecha.
4. **Cards compactas con densidad.** Menos padding, mas informacion por pixel.
5. **Sticky elements.** Acciones frecuentes siempre visibles.
6. **Color = estado.** Rojo=urgente, amarillo=pendiente, verde=OK, morado=premium.

---

## 1. Sidebar Mejorado

### Estado actual
```
CONSULTORIO
  Dashboard
  Mis reservas

NEGOCIO
  Perfil publico
  Panel Pro

My Paws
```

### Propuesta
```
CONSULTORIO
  Dashboard             (LayoutDashboard)  ← resumen general
  Pacientes             (Users)            ← RESTAURAR, link a /provider/pacientes
  Mis reservas          (Calendar)
  Calendario            (CalendarDays)     ← RESTAURAR

COMUNICACION
  Mensajes              (MessageSquare)    ← RESTAURAR
  Seguimientos          (Bell)             ← link propio, NO redirect a dashboard

NEGOCIO
  Perfil publico        (UserCog)
  Panel Pro             (BarChart3)        ← icon cambiado de Star a BarChart3
  Reportes              (FileBarChart)     ← RESTAURAR si existe

MASCOTAS
  My Paws               (PawPrint)
```

**Cambios clave:**
- Restaurar Pacientes, Calendario, Mensajes (estan en el codigo pero no se renderizan)
- Seguimientos como link independiente, no redirect al dashboard
- Panel Pro con icono de graficos, no estrella (la estrella confunde con Premium)
- Separador visual entre secciones con labels mas visibles

---

## 2. Dashboard — "Mi Consultorio"

### Layout actual (problematico)
```
[Header + 2 botones]
[Tip grabacion IA]                          ← full width
[Agenda de hoy]                             ← full width card
[Seguimientos semana]                       ← full width card
[Solicitudes vinculacion]                   ← full width card
[Pacientes vinculados]                      ← full width card
[Fichas compartidas]                        ← full width card
[Onboarding 3 pasos]                        ← full width card
[Perfil publico]                            ← full width card ENORME
[4 MetricCards fila 1]                      ← grid 4 col
[4 MetricCards fila 2]                      ← grid 4 col
[Actividad reciente]                        ← full width card
[Promocionar servicios]                     ← full width card
```
**Total: ~12 bloques verticales, 5+ scrolls en desktop**

### Propuesta: Layout en grid de 2 zonas

```
┌─────────────────────────────────────────────────────────────────┐
│  Mi consultorio                        [Ver perfil] [Editar]   │
│  Bienvenido, Dr. Pedro — Lunes 13 abril                        │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                │
│  ZONA IZQUIERDA (60%)         │  ZONA DERECHA (40%)            │
│                                │                                │
│  ┌──────────────────────────┐  │  ┌────────────────────────────┐│
│  │ METRICAS HERO (3 cards)  │  │  │ MINI PERFIL PUBLICO       ││
│  │ ┌────┐ ┌────┐ ┌────┐    │  │  │ Avatar + nombre + rating  ││
│  │ │Pac.│ │Calif│ │Vis.│   │  │  │ Completitud: ██████░ 85%  ││
│  │ │ 3  │ │ 4.8│ │ 12 │   │  │  │ [Editar] [Compartir]      ││
│  │ └────┘ └────┘ └────┘    │  │  └────────────────────────────┘│
│  └──────────────────────────┘  │                                │
│                                │  ┌────────────────────────────┐│
│  ┌──────────────────────────┐  │  │ SEGUIMIENTOS PENDIENTES    ││
│  │ AGENDA DE HOY            │  │  │ ● Firulais — control      ││
│  │ 09:00  Firulais — Ctrl   │  │  │   en 2 dias               ││
│  │ 10:30  Otto — Vacuna     │  │  │ ● Otto — vacuna refuerzo  ││
│  │ 14:00  Kai — Consulta    │  │  │   en 5 dias               ││
│  │ Sin citas = empty state  │  │  │ (vacio = "Todo al dia!")   ││
│  └──────────────────────────┘  │  └────────────────────────────┘│
│                                │                                │
│  ┌──────────────────────────┐  │  ┌────────────────────────────┐│
│  │ FICHAS COMPARTIDAS       │  │  │ ACTIVIDAD RAPIDA          ││
│  │ RECIENTES                │  │  │ ┌──────┐ ┌──────┐         ││
│  │ compact list, max 3      │  │  │ │Reser.│ │Resen.│         ││
│  │ [Nota] [Grabar] [Ver]    │  │  │ │  2   │ │  1   │         ││
│  └──────────────────────────┘  │  │ └──────┘ └──────┘         ││
│                                │  │ ┌──────┐ ┌──────┐         ││
│  ┌──────────────────────────┐  │  │ │Fichas│ │Ingre.│         ││
│  │ PACIENTES VINCULADOS     │  │  │ │  5   │ │$45k  │         ││
│  │ ┌─────┐ ┌─────┐ ┌─────┐ │  │  │ └──────┘ └──────┘         ││
│  │ │Firu.│ │Otto │ │ Kai │ │  │  └────────────────────────────┘│
│  │ │🐕 5h│ │🐕23h│ │🐕 1d│ │  │                                │
│  │ └─────┘ └─────┘ └─────┘ │  │  ┌────────────────────────────┐│
│  │ grid horizontal, no list │  │  │ TIP: GRABA CONSULTAS (IA) ││
│  └──────────────────────────┘  │  │ Icono mic + texto corto   ││
│                                │  └────────────────────────────┘│
├────────────────────────────────┴────────────────────────────────┤
│  SOLICITUDES PENDIENTES (solo si hay, banner amarillo)          │
│  ⚠ Alice quiere vincularse — [Aceptar] [Rechazar]              │
└─────────────────────────────────────────────────────────────────┘
```

### Cambios clave

| Antes | Despues |
|---|---|
| 12 bloques verticales lineales | Grid 2 columnas: clinico (izq) + admin (der) |
| Metricas al fondo (scroll 3+) | Metricas HERO arriba, primer vistazo |
| Perfil publico = card enorme | Mini preview compacto en sidebar derecho |
| Tip IA arriba de todo | Movido abajo-derecha (no es urgente) |
| Pacientes = lista vertical | Grid horizontal de avatares (max 6 + "+N") |
| Solicitudes pendientes siempre visibles | Solo aparece si hay pendientes (banner) |
| Onboarding mezclado con operacion | Onboarding = overlay/modal al primer login, despues desaparece |

### Implementacion CSS

```tsx
{/* Container principal */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
  {/* Zona izquierda: 3/5 = 60% */}
  <div className="lg:col-span-3 space-y-4">
    {/* Metricas hero */}
    <div className="grid grid-cols-3 gap-3">
      <HeroMetric />
      <HeroMetric />
      <HeroMetric />
    </div>
    {/* Agenda */}
    <TodayAgendaCard compact />
    {/* Fichas compartidas */}
    <SharedFichasCard limit={3} />
    {/* Pacientes grid */}
    <LinkedPatientsGrid />
  </div>
  
  {/* Zona derecha: 2/5 = 40% */}
  <div className="lg:col-span-2 space-y-4">
    <MiniProfileCard />
    <VetFollowupsCard compact />
    <QuickStatsGrid />
    <RecordingTipCard />
  </div>
</div>

{/* Banner solicitudes pendientes */}
{hasPendingRequests && <PendingRequestsBanner />}
```

### Responsive (mobile)

En mobile (`< lg`), las 2 zonas se apilan:
1. Metricas hero (3 cards en fila, compactas)
2. Agenda
3. Mini perfil
4. Seguimientos
5. Fichas
6. Pacientes
7. Stats

---

## 3. Perfil Publico — "Editar Perfil"

### Layout actual (problematico)
```
[Preview perfil]          ← card full width
[Completitud 85%]         ← card full width
[Seccion 1: Info]         ← card full width, ~8 inputs
[Seccion 2: Especialidades] ← card full width
[Seccion 3: Comunas]      ← card full width
[Seccion 4: Precios]      ← card full width
[Seccion 5: Precio base]  ← card full width
[Seccion 6: Visibilidad]  ← card full width
[Sticky save bar]
```
**Total: 8 bloques verticales, scroll enorme**

### Propuesta: Layout con preview sticky + tabs

```
┌─────────────────────────────────────────────────────────────────┐
│  Editar perfil publico              [Ver como me ven] [Guardar] │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                │
│  FORM AREA (65%)              │  PREVIEW STICKY (35%)          │
│                                │  ┌────────────────────────────┐│
│  ┌──────────────────────────┐  │  │ ASI TE VEN EN EL          ││
│  │ Completitud: ██████░ 85% │  │  │ DIRECTORIO                ││
│  │ Te falta: Bio (min 50)   │  │  │                            ││
│  └──────────────────────────┘  │  │ [Avatar]                   ││
│                                │  │ Dr. Pedro Susaeta          ││
│  ┌──────────────────────────┐  │  │ ★★★★★ (0 resenas)         ││
│  │ [Info] [Espec] [Zona]    │  │  │ 📍 Las Condes             ││
│  │ [Precios] [Visibilidad]  │  │  │ Desde $40.000             ││
│  │                          │  │  │                            ││
│  │ ─── Tab activo: Info ─── │  │  │ Medicina interna           ││
│  │                          │  │  │ Animales exoticos          ││
│  │ Foto    [Cambiar]        │  │  │ Cirugia tejidos blandos   ││
│  │                          │  │  │                            ││
│  │ Nombre  [___________]    │  │  │ "Bio del vet aqui..."     ││
│  │ Tipo    [Consulta v]     │  │  │                            ││
│  │ Bio     [___________]    │  │  │ ─ ACTUALIZA EN VIVO ─     ││
│  │         [___________]    │  │  └────────────────────────────┘│
│  │                          │  │                                │
│  │ Exp.  [7] Colmevet [##]  │  │  Visibilidad: ✅ Visible     │
│  │ Email [___] Tel [___]    │  │  URL: pawfriend.cl/vet/pedro  │
│  │                          │  │                                │
│  └──────────────────────────┘  │                                │
│                                │                                │
├────────────────────────────────┴────────────────────────────────┤
│  [Guardar cambios]                                    sticky    │
└─────────────────────────────────────────────────────────────────┘
```

### Cambios clave

| Antes | Despues |
|---|---|
| Preview arriba, desaparece al scrollear | Preview sticky a la derecha, siempre visible |
| 6 secciones apiladas | Tabs horizontales, una seccion a la vez |
| Form inputs en columna unica | Grid 2 cols para campos cortos (exp + colmevet) |
| Completitud separada del form | Barra compacta arriba del form |
| Scroll 5+ pantallas | Max 1.5 pantallas por tab |

### Implementacion

```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  {/* Form area */}
  <div className="lg:col-span-3 space-y-4">
    <CompletenessBar score={85} missing={["Bio"]} />
    
    <Tabs defaultValue="info">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="specialties">Especialidades</TabsTrigger>
        <TabsTrigger value="zones">Zona</TabsTrigger>
        <TabsTrigger value="pricing">Precios</TabsTrigger>
        <TabsTrigger value="visibility">Visibilidad</TabsTrigger>
      </TabsList>
      
      <TabsContent value="info">
        {/* campos agrupados en grid 2-col */}
      </TabsContent>
      {/* ... */}
    </Tabs>
  </div>
  
  {/* Preview sticky */}
  <div className="lg:col-span-2">
    <div className="sticky top-20 space-y-3">
      <ProfilePreviewCard live />
      <VisibilityStatus />
      <PublicURL />
    </div>
  </div>
</div>
```

---

## 4. Mis Reservas

### Layout actual (problematico)
```
[Filter chips]              ← horizontal scroll
[Calendario grande]         ← full width card
[Slots del dia]             ← full width
```
**Solo muestra el calendario y slots, sin contexto ni metricas**

### Propuesta: Calendario + panel lateral + resumen

```
┌─────────────────────────────────────────────────────────────────┐
│  Mis reservas                                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │Hoy: 3  │ │Semana:8│ │Mes: 24 │ │Pend: 2 │                   │
│  │citas   │ │citas   │ │total   │ │confirm.│                   │
│  └────────┘ └────────┘ └────────┘ └────────┘                   │
├──────────────────────────────┬──────────────────────────────────┤
│                              │                                  │
│  CALENDARIO (60%)           │  DETALLE DEL DIA (40%)           │
│                              │                                  │
│  [Todos][Vet][Paseo][Cuid]  │  Lunes 13 abril                  │
│                              │  ─────────────────               │
│  ┌────────────────────────┐  │                                  │
│  │     Abril 2026         │  │  09:00 ┌─────────────────┐      │
│  │  Lu Ma Mi Ju Vi Sa Do  │  │        │ Firulais          │     │
│  │     1  2  3  4  5      │  │        │ Pedro S. — Ctrl  │      │
│  │  6  7  8  9 10 11 12   │  │        │ [Confirmar]      │      │
│  │ [13]14 15 16 17 18 19  │  │        └─────────────────┘      │
│  │ 20 21 22 23 24 25 26   │  │                                  │
│  │ 27 28 29 30            │  │  10:30 ┌─────────────────┐      │
│  └────────────────────────┘  │        │ Otto              │     │
│                              │        │ Pedro S. — Vacuna│      │
│  ● 3 citas hoy              │        │ [Confirmar]      │      │
│  ● 2 pendientes de confirmar │        └─────────────────┘      │
│                              │                                  │
│                              │  14:00  Sin citas                │
│                              │                                  │
│                              │  ──────────────────              │
│                              │  Disponible — 5 slots libres     │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

### Cambios clave

| Antes | Despues |
|---|---|
| Solo calendario sin contexto | 4 mini-metricas arriba (hoy, semana, mes, pendientes) |
| Slots abajo del calendario (linear) | Panel lateral derecho con timeline del dia |
| Sin indicadores en el calendario | Dots/badges en dias con citas |
| Sin confirmacion rapida | Botones de accion directa en cada slot |
| Mobile: todo apilado | Mobile: metricas > calendario > slots (natural) |

---

## 5. Panel Pro (Analytics)

### Layout actual (problematico)
```
[Titulo + filtros]
[4 summary cards]              ← grid 4 col
[Area chart — actividad]       ← full width, bloqueado
[Bar chart — comparativo]      ← full width, bloqueado
[Resumen vet (si aplica)]      ← 4 cards
[Exportar]                     ← card con botones
```
**Problema: todo bloqueado para no-premium, layout plano sin insights**

### Propuesta: Dashboard analitico compacto con insights

```
┌─────────────────────────────────────────────────────────────────┐
│  Panel Pro                    [Todas ▾] [Este mes ▾]   [Crown] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │RECORDAT. │ │VISITAS   │ │VACUNAS   │ │ BIENESTAR        │   │
│  │    12    │ │    3     │ │    5     │ │  ████████░ 78/100│   │
│  │ +20% ▲  │ │ -10% ▼  │ │ = 0%    │ │  +5 pts ▲        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                 │
├────────────────────────────────┬────────────────────────────────┤
│                                │                                │
│  ACTIVIDAD DEL PERIODO (60%) │  RESUMEN VET (40%)             │
│  ┌──────────────────────────┐  │  ┌────────────────────────────┐│
│  │  📈 Area chart           │  │  │ Reservas        12        ││
│  │  (recordatorios,         │  │  │ Clientes unicos  8        ││
│  │   visitas, vacunas)      │  │  │ Ingresos     $180.000    ││
│  │  h-[250px]               │  │  │ Resenas          4        ││
│  └──────────────────────────┘  │  │                            ││
│                                │  │ Top servicio: Consulta     ││
│  COMPARATIVO PERIODOS         │  │ Hora pico: 10:00-12:00    ││
│  ┌──────────────────────────┐  │  └────────────────────────────┘│
│  │  📊 Bar chart            │  │                                │
│  │  (actual vs anterior)    │  │  ┌────────────────────────────┐│
│  │  h-[200px]               │  │  │ INSIGHTS AUTOMATICOS      ││
│  └──────────────────────────┘  │  │                            ││
│                                │  │ "Tus vacunas subieron 20% ││
│                                │  │  este mes vs el anterior" ││
│                                │  │                            ││
│                                │  │ "Tu hora mas productiva   ││
│                                │  │  es entre 10-12 AM"       ││
│                                │  └────────────────────────────┘│
├────────────────────────────────┴────────────────────────────────┤
│  Exportar reporte    [📄 PDF]  [📊 CSV]     periodo: Este mes  │
└─────────────────────────────────────────────────────────────────┘
```

### Cambios clave

| Antes | Despues |
|---|---|
| Summary cards sin tendencia | Cards con delta % vs periodo anterior (▲▼) |
| Charts apilados verticalmente | Charts en columna izq + resumen en derecha |
| Resumen vet = 4 cards sueltas | Tabla compacta en panel derecho |
| Sin insights automaticos | Seccion de insights con texto generado |
| Export al fondo | Barra de export siempre visible al fondo |
| Bienestar = numero solo | Barra visual con color (rojo/amarillo/verde) |

---

## 6. Pacientes (/provider/pacientes)

### Layout actual
```
[Header + boton nuevo paciente]
[Search + filtro especie]
[Solicitudes pendientes]         ← collapsible
[Lista pacientes activos]        ← vertical cards
[Pendientes de reclamo]          ← vertical cards
```

### Propuesta: Vista tipo CRM compacta

```
┌─────────────────────────────────────────────────────────────────┐
│  Mis pacientes (12)                           [+ Nuevo paciente]│
│  [🔍 Buscar...________________] [Especie ▾] [Estado ▾]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠ 2 solicitudes pendientes                    [Ver todas →]   │
│  ┌─────────────────────────┐ ┌─────────────────────────┐       │
│  │ Alice — Pedro S.        │ │ Luna — Maria G.         │       │
│  │ Perro · Labrador        │ │ Gato · Siames           │       │
│  │ [✓ Aceptar] [✗ Rechazar]│ │ [✓ Aceptar] [✗ Rechazar]│       │
│  └─────────────────────────┘ └─────────────────────────┘       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Activos (10)                                                   │
│  ┌──────┬──────────────┬────────┬───────────┬──────────┬──────┐ │
│  │ Foto │ Nombre       │Especie │ Dueno     │Ult.visita│Accion│ │
│  ├──────┼──────────────┼────────┼───────────┼──────────┼──────┤ │
│  │ 🐕   │ Firulais     │ Perro  │ Pedro S.  │ Hace 5h  │[Ver] │ │
│  │ 🐕   │ Otto         │ Perro  │ Pedro S.  │ Hace 23h │[Ver] │ │
│  │ 🐕   │ Kai          │ Perro  │ Pedro S.  │ Hace 1d  │[Ver] │ │
│  │ 🐱   │ Misu         │ Gato   │ Ana R.    │ Hace 3d  │[Ver] │ │
│  └──────┴──────────────┴────────┴───────────┴──────────┴──────┘ │
│                                                                 │
│  Esperando reclamo (1)                                          │
│  ┌──────┬──────────────┬────────┬───────────┬──────────────────┐│
│  │ 🐕   │ Rex          │ Perro  │ —         │ [Enviar invit.] ││
│  └──────┴──────────────┴────────┴───────────┴──────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cambios clave

| Antes | Despues |
|---|---|
| Cards grandes apiladas | Tabla compacta tipo CRM |
| Solicitudes en collapsible oculto | Banner horizontal, 2 cols, siempre visible si hay |
| Accordion para sesiones | Click en fila abre panel lateral o modal |
| Sin filtro por estado | Filtro de estado (activo/pendiente/todos) |
| Mucho espacio entre cards | Densidad alta, mas pacientes por pantalla |

---

## 7. Componentes transversales mejorados

### 7.1 MetricCard V2 (con tendencia)

```tsx
// Antes: solo numero + subtitulo
// Despues: numero + delta + sparkline mini

<MetricCardV2
  label="Pacientes"
  value={12}
  delta={+20}           // % vs periodo anterior
  trend="up"            // up | down | flat
  sparkline={[3,5,4,8,12]}  // ultimos 5 periodos
  icon={Users}
  color="purple"
/>
```

Renderiza:
```
┌─────────────────┐
│ Pacientes    👥  │
│ 12    +20% ▲    │
│ ▁▃▂▅█           │
│ 3 notas clin.   │
└─────────────────┘
```

### 7.2 CompactPatientCard (grid, no lista)

```
┌──────────┐
│  [Avatar] │
│  Firulais │
│  🐕 Perro │
│  5h ago   │
│  [Ficha]  │
└──────────┘
```

Orientacion: horizontal grid en desktop, vertical stack en mobile.

### 7.3 StatusBanner (solicitudes/alertas)

```
┌─ ⚠ ──────────────────────────────────────────────────────────┐
│  2 solicitudes de vinculacion pendientes    [Ver] [Descartar] │
└──────────────────────────────────────────────────────────────┘
```

Solo aparece si hay contenido. Colores: amber (pendiente), red (urgente), green (exito).

---

## 8. Esquema de colores por seccion

| Seccion | Color primario | Uso |
|---|---|---|
| Dashboard general | `purple-600` | Headers, bordes activos |
| Agenda/Calendario | `indigo-500` | Cards de citas, calendario |
| Pacientes vinculados | `green-500` | Badge "Vinculado", bordes |
| Solicitudes pendientes | `amber-500` | Banners, badges pendientes |
| Fichas compartidas | `teal-500` | Iconos ficha, bordes |
| Analytics/Panel Pro | `purple-700` | Graficos, metricas premium |
| Groomer | `pink-500` | Todo el flujo peluquero |
| Alertas/Errores | `red-500` | Errores, acciones destructivas |
| Exito/Confirmacion | `green-600` | Toasts, badges OK |

---

## 9. Responsive breakpoints

| Breakpoint | Layout |
|---|---|
| `< 640px` (mobile) | 1 columna, cards full-width, bottom tab bar |
| `640-1024px` (tablet) | 1-2 columnas, sidebar colapsado |
| `> 1024px` (desktop) | 2-3 columnas, sidebar abierto, previews sticky |

### Reglas mobile-first

1. Metricas hero: `grid-cols-2` en mobile, `grid-cols-3` en desktop
2. Dashboard zones: stack en mobile, side-by-side en desktop
3. Perfil: form full-width en mobile, form+preview en desktop
4. Reservas: calendario full > slots debajo en mobile
5. Pacientes: cards en mobile, tabla en desktop
6. Panel Pro: charts full-width en mobile, chart+sidebar en desktop

---

## 10. Prioridad de implementacion

| Fase | Tarea | Impacto | Esfuerzo |
|---|---|---|---|
| **1** | Sidebar: restaurar items ocultos | Alto | Bajo |
| **2** | Dashboard: grid 2 zonas + metricas hero arriba | Alto | Medio |
| **3** | Perfil: tabs + preview sticky | Medio | Medio |
| **4** | MetricCard V2 con tendencias | Medio | Bajo |
| **5** | Reservas: panel lateral + mini metricas | Medio | Medio |
| **6** | Panel Pro: layout 2 cols + insights | Bajo | Alto |
| **7** | Pacientes: vista tabla CRM | Bajo | Medio |

**Fase 1+2 son el 80/20**: restaurar sidebar + reorganizar dashboard en grid = cambio mas visible con menor esfuerzo.

---

## Wireframes ASCII — Comparativa antes/despues

### Dashboard

**ANTES:**
```
┌──────────────────────────┐
│ Header                   │
│ [Card 1]                 │
│ [Card 2]                 │
│ [Card 3]                 │
│ [Card 4]                 │
│ [Card 5]                 │
│ [Card 6]                 │
│ [Metrics x4]             │
│ [Metrics x4]             │
│ [Card 7]                 │
│ [Card 8]                 │
│ ↓ scroll scroll scroll   │
└──────────────────────────┘
```

**DESPUES:**
```
┌──────────────────────────────────┐
│ Header                           │
│ ┌─────────────┬────────────────┐ │
│ │ [Metrics]   │ [Mini perfil]  │ │
│ │ [Agenda]    │ [Seguimientos] │ │
│ │ [Fichas]    │ [Quick stats]  │ │
│ │ [Pacientes] │ [Tip IA]       │ │
│ └─────────────┴────────────────┘ │
│ [Banner pendientes — si hay]     │
└──────────────────────────────────┘
```

**Resultado: de ~12 scrolls a ~1.5 scrolls en desktop.**
