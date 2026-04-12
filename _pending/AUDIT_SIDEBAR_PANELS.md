# Auditoría: Sidebar, Paneles y Configuración de Usuario

> Objetivo: mapear todas las funciones accesibles desde el sidebar (Mi Panel, Mi Perfil Pro, Panel Admin, Configuración, Perfil) y proponer la mejor organización lógica.
> Fecha: 2026-04-11

---

## 1. Estado actual — Qué hay y dónde

### 1.1. Sidebar (`AppSidebar.tsx`)

El sidebar tiene 4 grupos de navegación + 1 footer con opciones de usuario:

| Grupo | Items | Visible para |
|---|---|---|
| **Salud** | Inicio, Mis mascotas, Recordatorios | Todos |
| **Descubrir** | Buscar vet, Servicios, Mapa | Todos |
| **Comunidad** | Feed, Comunidad, Mensajes, Paw Game | Todos |
| **Profesional** | Mi panel, Mi perfil pro | Solo proveedores |
| **Admin** | Panel Admin | Solo admin |
| **Footer** | Avatar+email → `/profile`, Configuración → `/settings`, Cerrar Sesión | Todos |

### 1.2. Las 6 pantallas involucradas

| Pantalla | Ruta | Acceso | Qué hace |
|---|---|---|---|
| **Perfil** (`Profile.tsx`) | `/profile` | Sidebar footer (clic en email) | Vista social del usuario: avatar, stats, posts, mascotas, reseñas, logros, servicios |
| **Configuración** (`Settings.tsx`) | `/settings` | Sidebar footer (ícono ⚙) | Editar perfil personal (nombre, bio, avatar), cuenta, notificaciones, integraciones, reportes, legal |
| **Mi Panel** (`ProviderDashboard.tsx`) | `/provider/dashboard` | Sidebar grupo "Profesional" | Métricas del consultorio: visibilidad, pacientes, reservas, fichas compartidas |
| **Mi Perfil Pro** (`ProviderProfileEdit.tsx`) | `/provider/profile-edit` | Sidebar grupo "Profesional" | Editar perfil profesional: datos, especialidades, comunas, precios, visibilidad |
| **Panel Admin** (`Admin.tsx`) | `/admin` | Sidebar grupo "Admin" | 13 tabs de administración: métricas, usuarios, verificaciones, moderación, etc. |
| **Panel Pro** (`ProDashboard.tsx`) | `/panel-pro` | ⚠ **Sin link en sidebar** | Analytics premium B2C: gráficos de actividad, vacunas, comparativas |

---

## 2. Diagnóstico — Problemas detectados

### 2.1. Fragmentación de "mi cuenta"

Hay **3 pantallas** que editan datos del mismo usuario, pero en sitios distintos:

| Dato | Se edita en | Debería estar en |
|---|---|---|
| Nombre, bio, ubicación | `/settings` (Configuración) | ¿Perfil? ¿Settings? |
| Avatar (dicebear) | `/settings` | ¿Perfil? |
| Notificaciones | `/settings` | Settings ✓ |
| Integraciones (WhatsApp, GCal) | `/settings` | Settings ✓ |
| Reportes periódicos | `/settings` | Settings ✓ |
| Datos profesionales | `/provider/profile-edit` | Separado ✓ (distinto rol) |

**Problema:** el usuario edita su nombre y avatar en "Configuración" (que suena a settings técnicos) pero lo ve en "Perfil" (que es su vista social). La separación no es intuitiva. Muchas apps juntan la edición del perfil personal dentro del perfil mismo.

### 2.2. Perfil es solo lectura social

`/profile` es una página tipo "Instagram profile" — muestra posts, mascotas, reseñas, logros. Pero para editar cualquier dato, redirige a `/settings`. El botón "Editar" del perfil no edita inline, navega a otra página.

### 2.3. Panel Pro huérfano

`/panel-pro` (ProDashboard) **no tiene link en el sidebar**. Solo es accesible por URL directa. Es un dashboard de analytics premium para dueños B2C, completamente distinto al dashboard de proveedor (`/provider/dashboard`). Está "perdido" en la app.

### 2.4. Confusión "Panel" vs "Perfil Pro"

Para un proveedor, el sidebar muestra:
- **Mi panel** → dashboard con métricas
- **Mi perfil pro** → formulario de edición

Los nombres son similares y no comunican bien la diferencia. "Mi panel" suena genérico, "Mi perfil pro" suena a que es un upgrade del perfil personal.

### 2.5. Settings es un cajón de sastre

`/settings` mezcla 7 cards con propósitos muy distintos:
1. Edición de perfil (nombre, bio, avatar) — esto es **identidad**
2. Cuenta (email, cerrar sesión) — esto es **cuenta/auth**
3. Integraciones (WhatsApp, GCal) — esto es **conexiones**
4. Notificaciones — esto es **preferencias**
5. Reportes periódicos — esto es **preferencias**
6. Legal — esto es **info**
7. Avanzado (memorial) — esto es un **link suelto**
8. Acerca de — esto es **info**

No hay agrupación visual fuerte entre estos bloques.

### 2.6. Cerrar sesión duplicado

"Cerrar Sesión" aparece tanto en el sidebar footer como dentro de `/settings` (card "Cuenta"). Redundancia innecesaria.

### 2.7. Footer del sidebar sin jerarquía

El footer tiene 3 items al mismo nivel visual:
- Avatar + email → Perfil
- ⚙ Configuración → Settings
- 🚪 Cerrar Sesión

No hay indicador de que al hacer clic en el email se va al perfil público. Parece que debería abrir un menú contextual (como hacen Slack, Discord, Linear).

---

## 3. Inventario funcional cruzado

### ¿Qué funciones tiene cada pantalla?

```
/profile (Perfil social)
├── Ver avatar, nombre, bio, ubicación
├── Ver stats (posts, seguidores, mascotas)
├── Tab: Posts (grid visual)
├── Tab: Mascotas (grid + agregar)
├── Tab: Reseñas (historial + pendientes)
├── Tab: Logros (puntos, badges, misiones)
├── Tab: Servicios (crear promoción, solo proveedores)
├── Botón "Editar" → navega a /settings
├── Botón "Compartir perfil"
└── Badges profesionales

/settings (Configuración)
├── Editar perfil (nombre, bio, ubicación, avatar)
├── Cuenta (email readonly, cerrar sesión)
├── Integraciones (WhatsApp, Google Calendar)
├── Notificaciones (3 toggles)
├── Reportes periódicos (3 toggles)
├── Legal (términos, privacidad)
├── Avanzado (link a memorial)
└── Acerca de (versión)

/provider/dashboard (Mi Panel)
├── Métricas del consultorio
├── Estado de visibilidad en directorio
├── Fichas médicas compartidas
├── Seguimientos de pacientes
├── Lista de pacientes
├── Botón "Ver como me ven los dueños"
└── Botón "Editar perfil" → /provider/profile-edit

/provider/profile-edit (Mi Perfil Pro)
├── % completitud del perfil profesional
├── Datos profesionales (nombre, tipo, bio, experiencia, licencia)
├── Avatar profesional (upload real, no dicebear)
├── Especialidades (multi-select)
├── Zonas de atención (comunas)
├── Precios (mínimo + tabla detallada)
├── Toggle visibilidad pública
└── Onboarding wizard (si es nuevo)

/panel-pro (Panel Pro Analytics)
├── Selector de período
├── Selector de mascota
├── Gráficos de actividad (recordatorios, visitas, vacunas)
├── Comparativas período actual vs anterior
├── Export PDF/CSV (⚠ placeholder, no funciona)
└── Upgrade CTA para no-premium

/admin (Panel Admin)
├── 13 tabs de administración
└── Solo accesible con rol admin
```

---

## 4. Propuestas de reorganización

### Opción A: "Menú contextual en sidebar + unificar perfil/settings" ⭐ RECOMENDADA

**Concepto:** el clic en el email del sidebar abre un **popover/dropdown** (no navega directo) con acceso rápido a todo lo del usuario. El perfil y la configuración se fusionan en una sola página con tabs/secciones.

**Sidebar footer — Nuevo comportamiento:**
```
┌─────────────────────┐
│ 👤 pedro@email.com  │ ← clic abre popover ▼
│                     │
│ ┌─────────────────┐ │
│ │ Ver mi perfil   │ │ → /profile
│ │ Configuración   │ │ → /settings
│ │ ─────────────── │ │
│ │ Panel Pro ⭐     │ │ → /panel-pro (si premium)
│ │ ─────────────── │ │
│ │ Cerrar sesión   │ │
│ └─────────────────┘ │
└─────────────────────┘
```

**Beneficios:**
- El email ya no navega "mágicamente" a una página sin explicación
- Panel Pro deja de estar huérfano
- Se elimina "Cerrar sesión" del sidebar visible (solo en popover)
- El sidebar queda más limpio (solo 1 item en el footer)

**Perfil + Settings — Fusión parcial:**

`/profile` se mantiene como vista social pública. Pero al hacer clic en "Editar", en vez de navegar a `/settings` completo, abre una sección inline o modal de edición rápida (nombre, bio, avatar).

`/settings` se simplifica quitando la edición de perfil y dejando solo configuración real:
- Cuenta (email)
- Notificaciones
- Integraciones
- Reportes
- Legal
- Avanzado

### Opción B: "Página unificada Mi Cuenta con tabs"

**Concepto:** una sola página `/mi-cuenta` con tabs laterales que agrupa todo:

```
/mi-cuenta
├── Tab: Perfil (editar nombre, bio, avatar, ver stats)
├── Tab: Notificaciones
├── Tab: Integraciones
├── Tab: Reportes
├── Tab: Cuenta (email, contraseña, cerrar sesión)
└── Tab: Legal / Info
```

**Beneficios:**
- Todo en un solo lugar, estilo GitHub Settings o Discord User Settings
- Elimina la confusión perfil vs configuración

**Desventajas:**
- Pierde la vista social tipo "Instagram profile" de `/profile`
- Es un cambio más grande y más invasivo
- El perfil social público (`/user/:userId`) quedaría desconectado del perfil propio

### Opción C: "Mantener separación actual, solo ordenar"

**Concepto:** no fusionar nada, solo:
1. Agregar link a `/panel-pro` en el sidebar (grupo "Salud" o nuevo grupo)
2. Renombrar "Mi panel" → "Consultorio" y "Mi perfil pro" → "Editar perfil vet"
3. Quitar edición de perfil personal de `/settings` y ponerla inline en `/profile`
4. Cambiar el footer del sidebar a popover

**Beneficios:** cambio mínimo, bajo riesgo.

**Desventajas:** no resuelve la fragmentación de fondo.

---

## 5. Recomendación: Opción A con ajustes

### 5.1. Cambios en el sidebar

| Actual | Propuesto | Justificación |
|---|---|---|
| Footer: email → `/profile` directo | Email → popover con opciones | Patrón estándar (Slack, Discord, Linear) |
| Footer: ⚙ Configuración visible | Mover a popover | Limpia el footer |
| Footer: Cerrar Sesión visible | Mover a popover | Limpia el footer, red action escondida |
| "Mi panel" (nombre) | "Consultorio" | Más descriptivo |
| "Mi perfil pro" (nombre) | "Perfil profesional" | Evita confusión con perfil personal |
| `/panel-pro` sin link | Agregar en grupo "Salud" como "Analytics ⭐" | Deja de estar huérfano |

### 5.2. Cambios en las páginas

| Página | Cambio propuesto |
|---|---|
| `/profile` | Agregar edición inline (nombre, bio, avatar) con botón "Guardar", eliminar redirección a `/settings` |
| `/settings` | Quitar card "Mi Perfil" (ya vive en `/profile`). Quitar "Cerrar Sesión" (ya vive en popover). Dejar: Cuenta (solo email readonly), Notificaciones, Integraciones, Reportes, Legal, Avanzado, Acerca de |
| `/provider/dashboard` | Sin cambios funcionales, solo renombrar en sidebar |
| `/provider/profile-edit` | Sin cambios funcionales, solo renombrar en sidebar |
| `/panel-pro` | Sin cambios, solo hacerlo accesible desde sidebar |
| `/admin` | Sin cambios |

### 5.3. Sidebar resultante

```
SIDEBAR
─────────────────────
🐾 paw friend

SALUD
  Inicio            /home
  Mis mascotas      /my-pets
  Recordatorios     /reminders
  Analytics ⭐      /panel-pro        ← NUEVO (solo premium o con upsell)

DESCUBRIR
  Buscar vet        /veterinarios
  Servicios         /servicios
  Mapa              /maps

COMUNIDAD
  Feed              /feed
  Comunidad         /comunidad
  Mensajes          /chat
  Paw Game          /paw-game

PROFESIONAL (solo proveedores)
  Consultorio       /provider/dashboard     ← renombrado
  Perfil profesional /provider/profile-edit  ← renombrado

ADMIN (solo admin)
  Panel Admin       /admin

─────────────────────
👤 pedro@email.com  ← POPOVER, no navegación directa
```

### 5.4. Popover del usuario

```
┌────────────────────────────┐
│ 👤 Pedro Susa              │
│    pedro@email.com         │
│    Plan: Premium ⭐         │
├────────────────────────────┤
│ 📋 Ver mi perfil           │ → /profile
│ ⚙ Configuración            │ → /settings
│ 💎 Upgrade a Premium       │ → /upgrade (solo si free)
├────────────────────────────┤
│ 🚪 Cerrar sesión           │
└────────────────────────────┘
```

---

## 6. Funciones a eliminar o mover

| Función | Ubicación actual | Destino propuesto | Razón |
|---|---|---|---|
| Edición nombre/bio/avatar | `/settings` card "Mi Perfil" | `/profile` inline | El usuario espera editar su perfil en su perfil |
| Cerrar sesión (botón) | `/settings` card "Cuenta" | Solo en popover del sidebar | Eliminar duplicado |
| Link "Registro de despedida" | `/settings` card "Avanzado" | Mover a `/profile` tab "Mascotas" o como link en `/my-pets` | Tiene más sentido cerca de las mascotas |
| Selector avatar dicebear | `/settings` | `/profile` (edición inline) | Parte de la identidad visual |

---

## 7. Funciones que faltan (oportunidades)

| Función | Dónde agregarla | Prioridad |
|---|---|---|
| Cambiar contraseña | `/settings` card "Cuenta" | Media |
| Eliminar cuenta | `/settings` card "Cuenta" (con confirmación) | Baja |
| Tema oscuro/claro | `/settings` | Baja |
| Idioma | `/settings` (futuro si se internacionaliza) | Baja |
| Ver plan actual + gestionar suscripción | Popover + `/settings` | Alta |
| Historial de pagos | `/settings` nueva card | Media |

---

## 8. Resumen ejecutivo

1. **El sidebar footer necesita un popover** en vez de navegación directa — es el patrón que el usuario espera de apps modernas.
2. **La edición de perfil personal debe vivir en `/profile`**, no en `/settings`. Settings es para configuración técnica (notificaciones, integraciones, reportes).
3. **`/panel-pro` está huérfano** — necesita un link en el sidebar grupo "Salud".
4. **Renombrar** "Mi panel" → "Consultorio" y "Mi perfil pro" → "Perfil profesional" para evitar confusión.
5. **Eliminar el duplicado de "Cerrar sesión"** en `/settings`.
6. **El Admin panel está bien** como está — acceso condicional, separado, sin confusión.

### Impacto estimado

| Cambio | Archivos afectados | Riesgo |
|---|---|---|
| Popover en sidebar footer | `AppSidebar.tsx` | Bajo |
| Edición inline en Profile | `Profile.tsx`, `Settings.tsx` | Medio |
| Link Panel Pro en sidebar | `AppSidebar.tsx` | Bajo |
| Renombrar items sidebar | `AppSidebar.tsx` | Bajo |
| Limpiar Settings | `Settings.tsx` | Bajo |

---

**Fin de la auditoría.**
