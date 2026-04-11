# Paw Friend — Profile Redesign Blueprint

> Blueprint maestro para rediseñar la pestaña **Perfil** de Paw Friend con estándar de Principal Product Designer + Senior UX/UI + Mobile App UX Architect + Design Systems Expert.
> Autor: Claude Code · Fecha: 2026-04-11
> **Estado:** pendiente — no implementado. Ningún componente creado, `Profile.tsx` y `Settings.tsx` intactos.
> Archivos auditados:
> - [src/pages/Profile.tsx](src/pages/Profile.tsx) — pantalla actual
> - [src/pages/UserProfile.tsx](src/pages/UserProfile.tsx) — perfil público de otros usuarios
> - [src/pages/Settings.tsx](src/pages/Settings.tsx) — configuración (alias actual de "editar perfil")
> - [src/pages/MyPets.tsx](src/pages/MyPets.tsx) — gestión de mascotas
> - [src/pages/Home.tsx](src/pages/Home.tsx) — dashboard, punto de partida del flujo médico
> - [src/components/BottomTabBar.tsx](src/components/BottomTabBar.tsx) — navegación mobile (5 tabs)
> - [src/App.tsx](src/App.tsx) — mapa de rutas
> - Complementarios: `src/components/PointsWidget.tsx`, `AchievementBadge.tsx`, `MissionCard.tsx`, `ProfessionalBadges.tsx`, `UserReviewHistory.tsx`, `PendingReviewsList.tsx`, `CreateServicePromotion.tsx`, `src/components/settings/IntegrationsCard.tsx`

---

## 0. TL;DR ejecutivo

La pestaña Perfil actual ([src/pages/Profile.tsx](src/pages/Profile.tsx)) es una **pantalla tipo Instagram con 5 tabs** (Posts, Mascotas, Reseñas, Logros, Servicios) montada sobre una app cuyo valor principal es **salud y ficha clínica**. Consecuencias:

1. **Identidad fragmentada**: el avatar humano domina, las mascotas quedan en un tab secundario, pero el pivot del producto ya declarado en [BottomTabBar.tsx](src/components/BottomTabBar.tsx) es médico ("Inicio / Mascotas / Vets / Recordatorios / Perfil"). Profile va contra el pivot.
2. **Acciones importantes en el botón equivocado**: el botón "Editar" manda a `/settings`, mientras el ícono de engranaje al lado no hace nada (`onClick` ausente en [Profile.tsx:194](src/pages/Profile.tsx#L194)). Dos botones indistinguibles, uno muerto.
3. **Mezcla de capas**: social (posts, seguidores), identidad (nombre, bio, badges profesionales), comercio (Servicios/promociones B2B), gamificación (puntos, logros, misiones) y —lo que no está— salud. Todo pelea por el mismo espacio.
4. **Mobile-first roto**: tabs de 5 columnas con texto de 9 px, 3 botones en la misma fila y un `container max-w-5xl` que no está pensado para el viewport real del celular.
5. **Settings es la mitad faltante del perfil**: la edición real de `display_name`, `bio`, `location`, `avatar_url` vive en [Settings.tsx](src/pages/Settings.tsx). El usuario debe salir de Perfil para editar Perfil.

**Tesis del rediseño**: Perfil debe dejar de ser "mi muro social" y volverse **el hub personal del dueño y sus mascotas** — la tarjeta de identidad, el acceso rápido a cada mascota como sub-perfil, el panel de completitud y el centro de configuración. La capa social (posts, seguidores) queda subordinada, no desaparece.

---

## 1. Contexto detectado en el proyecto

### 1.1. Qué revisé

- **Pantalla actual**: [src/pages/Profile.tsx](src/pages/Profile.tsx) — 487 líneas, 5 tabs, mezcla auth + perfil + stats + gamificación + social + servicios.
- **Variante pública**: [src/pages/UserProfile.tsx](src/pages/UserProfile.tsx) — vista de terceros con follow/unfollow y chat ([src/pages/UserProfile.tsx:30-52](src/pages/UserProfile.tsx#L30-L52)). Comparte layout con Profile pero sin tabs de servicios/logros.
- **Edición real del perfil**: [src/pages/Settings.tsx:169-298](src/pages/Settings.tsx#L169-L298) — tarjeta "Mi Perfil" con selector de avatar DiceBear, display_name, bio, location, barra de completitud 4/4.
- **Mascotas**: [src/pages/MyPets.tsx](src/pages/MyPets.tsx) — la pantalla real donde el usuario gestiona pets, con BreedTips, memorial, delete.
- **Navegación mobile**: [src/components/BottomTabBar.tsx:47-80](src/components/BottomTabBar.tsx#L47-L80) — define el pivot del producto: "Inicio, Mascotas, Vets, Recordatorios, Perfil". La tab "Perfil" hace match tanto con `/profile` como con `/settings` ([BottomTabBar.tsx:78](src/components/BottomTabBar.tsx#L78)) — señal explícita del equipo de que **Perfil y Settings son conceptualmente la misma tab**.
- **Rutas**: [src/App.tsx:31-216](src/App.tsx) — Profile convive con `/user/:userId` (UserProfile público), `/provider/profile-edit` (ProviderProfileEdit), `/peluquero/perfil` (GroomerProfileEdit). Hay **cuatro nociones de "perfil"** en el repo.
- **Gamificación**: [src/hooks/useGamification.tsx](src/hooks/useGamification.tsx), `PointsWidget`, `AchievementBadge`, `MissionCard` — cargados ya en la home card de Profile.
- **CLAUDE.md**: confirma pivot médico, mobile-first, tuteo chileno, joya de la corona = ficha clínica PDF + directorio de vets.

### 1.2. Cómo Profile se conecta hoy

```
BottomTabBar "Perfil" ──▶ /profile ─┬─▶ Editar ──▶ /settings (Settings.tsx)
                                    ├─▶ Compartir ──▶ navigator.share a /user/:id
                                    ├─▶ Tab Mascotas ──▶ /add-pet (goToAddPet)
                                    ├─▶ Tab Posts ──▶ /feed (CTA vacío)
                                    ├─▶ Tab Reseñas ──▶ PendingReviewsList + history
                                    ├─▶ Tab Logros ──▶ PointsWidget + AchievementBadge
                                    └─▶ Tab Servicios ──▶ CreateServicePromotion (B2B)
```

- **No hay link** desde Profile a `/medical-records`, `/reminders`, ni a la ficha clínica de cada mascota (`/pet/:petId/clinical`). Es decir, el hub personal no expone la joya de la corona.
- **No hay link** a `/upgrade` desde Profile salvo la chip "PREMIUM" visual ([Profile.tsx:160-163](src/pages/Profile.tsx#L160-L163)) — esa chip ni siquiera es clickeable.
- **No hay switch de rol** (owner ↔ provider/vet), pese a que el repo tiene `/provider/dashboard` y `/provider/profile-edit`.

### 1.3. Supuestos declarados

- **Supuesto A**: el rol del usuario (owner vs provider/vet) se sabe desde el profile en Supabase (los componentes `ProfessionalBadges` y `CreateServicePromotion` lo asumen). Si no existe aún un flag `role` en `profiles`, hay que inferirlo vía presencia en `vets_directory` / tablas de providers.
- **Supuesto B**: Premium B2C (`profile.is_premium`) ya está wired desde Flow webhook — Profile actual lo lee pero no lo explota como upsell.
- **Supuesto C**: el "feed social" y los "posts" no son la superficie principal de engagement del producto hoy (no hay evidencia en la auditoría competitiva de que Paw Friend compita como red social). El peso que Instagram-profile les da es desproporcionado.
- **Supuesto D**: "Servicios" dentro de Profile sólo aplica a un subconjunto (proveedores/vets con plan). Para 80%+ de los usuarios es ruido.

Si alguno de estos supuestos es incorrecto, la sección 4 (Arquitectura ideal) debe ajustarse antes de implementar.

---

## 2. Rol de Perfil en Paw Friend

### 2.1. Lo que Perfil **debe** ser

> **Mi hub personal**: identidad del dueño, tarjetas de sus mascotas como sub-perfiles, estado de completitud, y entrada a configuración/plan/privacidad.

Perfil es:

- **Centro de identidad personal** — avatar, nombre, ubicación, bio corta, badge premium, badge profesional si aplica.
- **Launcher de las mascotas del usuario** — cada mascota es un sub-perfil con su propia ficha clínica, no un item de un tab escondido.
- **Panel de completitud y salud del perfil** — qué falta para que el valor del producto (ficha PDF, recordatorios, compartir con vet) se desbloquee al 100%.
- **Centro de cuenta** — plan actual, upgrade, integraciones (WhatsApp/Google Calendar), notificaciones, privacidad, sesión.
- **Switch de contexto** — si el usuario también es proveedor/vet, puedo saltar a mi dashboard profesional desde aquí.

### 2.2. Lo que Perfil **no** debe ser

- **No es un muro social**. Los posts del usuario son un complemento, no la estructura principal. Quien quiere ver su propio muro va al Feed.
- **No es un catálogo de servicios B2B**. Crear promociones B2B vive en `/provider/dashboard`, no en Perfil.
- **No es un reemplazo de MyPets**. MyPets sigue siendo la pantalla de gestión detallada. Perfil expone "mis mascotas" como *tarjetas de identidad*, no como CRUD.
- **No es el dashboard de salud**. Home y Recordatorios ya cumplen ese rol. Perfil sólo *enlaza* a ellos desde cada mascota.

### 2.3. Qué vive aquí y qué no

| Vive en Perfil | No vive en Perfil |
|---|---|
| Identidad humana (avatar, nombre, bio, ubicación) | Feed social completo |
| Sub-perfiles de mascotas (acceso rápido + completitud) | CRUD detallado de mascotas (eso es MyPets) |
| Estado de completitud del perfil y de cada mascota | Calendario médico completo |
| Plan actual + CTA a upgrade | Dashboard de proveedor |
| Integraciones (WhatsApp, Google Calendar) | Pipeline de clientes B2B |
| Notificaciones, privacidad, cerrar sesión | Mini-juego Paw Game |
| Share de perfil público | Creación de promociones B2B |
| Logros destacados + puntos (compactos) | Historial completo de misiones |
| Switch de rol owner ↔ provider (si aplica) | Moderación admin |

---

## 3. Diagnóstico UX/UI del Profile actual

### 3.1. Problemas de jerarquía

1. **El avatar humano ocupa 32×32 (desktop) con ring de 4px**, mientras las mascotas quedan en una grilla 3-col dentro del tab "Mascotas" por debajo del fold. El producto vende salud de mascotas; la pantalla vende ego humano.
2. **Stats row con 4 números** (Posts, Seguidores, Siguiendo, Mascotas) con igual peso visual ([Profile.tsx:218-235](src/pages/Profile.tsx#L218-L235)). En una app médica, "Seguidores" no debería competir visualmente con "Mascotas".
3. **La chip PREMIUM es estática** ([Profile.tsx:160-163](src/pages/Profile.tsx#L160-L163)) — no incita upgrade si el usuario no es premium, y si lo es, no da acceso a su facturación.
4. **PointsWidget compacto aparece dos veces** en el mismo `<div>` (header y tab Logros), sin jerarquía clara de cuál es la "verdadera".

### 3.2. Problemas de arquitectura de información

1. **5 tabs en un ancho mobile de ~375 px** → cada tab tiene ~75 px, con texto a 9 px ([Profile.tsx:261](src/pages/Profile.tsx#L261)). No legible, no accesible.
2. **Tab "Servicios"** es irrelevante para 80% de usuarios (solo proveedores/vets lo usan), pero consume la misma prominencia que "Mascotas".
3. **Tab "Reseñas"** mezcla dos cosas distintas: reseñas pendientes que yo debo dejar + historial de reseñas que me dejaron. Son dos flujos.
4. **Edit** y **Settings** son dos botones separados ([Profile.tsx:184-196](src/pages/Profile.tsx#L184-L196)) pero uno de ellos (`<Settings>`) no tiene handler — es un botón muerto.
5. **Share copia la URL `pawfriend.cl/user/${user?.id}`** — nunca verificamos que `UserProfile` esté accesible sin login; si requiere auth, el link se rompe para el receptor.
6. **No hay breadcrumb ni back** — el usuario que entra a Profile desde una card de notificación no tiene cómo volver.

### 3.3. Fricciones reales observadas

1. **Editar el nombre**: Profile → "Editar" → `/settings` → scroll al bloque "Mi Perfil" → botón "Guardar perfil". El usuario cruza 2 pantallas y hace scroll para cambiar 3 caracteres.
2. **Agregar mascota desde Profile**: Profile → tab "Mascotas" → card dashed "Agregar Mascota" ([Profile.tsx:389-402](src/pages/Profile.tsx#L389-L402)). Pero el usuario ya pulsó "Perfil" en la bottom bar cuando quería agregar una mascota — señal de que la información arquitectónicamente debería estar más alta.
3. **Ver ficha clínica de "Luna"**: no hay camino desde Profile. Tengo que salir, ir a "Mascotas", elegir, entrar a la ficha. Tres niveles.
4. **Cerrar sesión**: Profile no lo ofrece. Hay que ir a `/settings`, bajar, botón "Cerrar sesión". Un action de 1 click está a 3 clicks.
5. **Ver plan actual / facturación**: no existe UI para esto. Sólo la chip visual.
6. **Pasar del modo dueño al modo proveedor**: no hay switch. Cada rol vive en rutas distintas con su propio dashboard, sin transición.

### 3.4. Mezcla incorrecta de capas

La pantalla tiene **6 capas distintas de información** superpuestas:

| Capa | Componentes actuales | Problema |
|---|---|---|
| Identidad humana | Avatar, name, bio, location | OK pero enterrada entre stats |
| Identidad profesional | `ProfessionalBadges` | Se muestra inline, sin contexto |
| Red social | Posts grid, stats Seguidores/Siguiendo | Domina sin justificar valor |
| Gamificación | `PointsWidget`, `AchievementBadge`, `MissionCard` | Duplicada (header + tab) |
| Comercio B2B | `CreateServicePromotion` | Visible para todos cuando sólo aplica a algunos |
| Reviews | `PendingReviewsList` + `UserReviewHistory` | Dos flujos en un mismo tab |

**Ninguna** de estas capas es "mis mascotas" o "mi salud" — que son el core del producto.

### 3.5. Problemas mobile-first

- `container max-w-5xl` no es mobile-first, es desktop-first con fallbacks.
- Tabs con `text-[9px]` incumplen el mínimo legible (12 px).
- 3 botones (`Editar` + `Settings` + `Compartir`) en la misma fila con `flex-1` ([Profile.tsx:184-214](src/pages/Profile.tsx#L184-L214)) — tres touch targets de ~100 px compitiendo en el pulgar.
- La grilla 3×N de posts deja touch targets de ~120×120 px sin affordance de tap (`cursor-pointer` pero no abre nada).
- El scroll vertical es largo: header (~320 px) + tabs (~60 px) + contenido (~600 px+) → en un iPhone SE el usuario nunca ve "mascotas" sin hacer scroll intencional.

### 3.6. Razones por las que esta vista se siente desconectada

1. **Contradice el BottomTabBar**. La bottom bar ya cuenta la historia: Inicio / Mascotas / Vets / Recordatorios / Perfil. Profile repite "Mascotas" y "Stats" dentro, rompiendo el principio de una fuente de verdad por concepto.
2. **No reusa patrones**. Home tiene un estilo de tarjetas, MyPets otro, Profile otro — cada pantalla inventa su propia jerarquía.
3. **No convierte**. No empuja a premium, no cierra completitud, no muestra valor. Es pasiva.
4. **No identifica**. Un visitante externo no puede distinguir "este es mi perfil" de "este es el perfil de Luna" en un segundo.

---

## 4. Arquitectura ideal de Perfil

Estructura propuesta en **6 bloques jerárquicos**, del más prioritario al más secundario. Los bloques 1–3 son above-the-fold en mobile (< 375 px).

### Bloque A — Identity Card (arriba del todo)

**Propósito**: responder en < 1 segundo "¿de quién es este perfil y en qué estado está?".

- Avatar humano (h-16 mobile, h-20 desktop — no h-32 como ahora).
- Nombre + ubicación en una línea.
- Bio de máximo 2 líneas con truncate.
- **Chip de rol** (Dueño / Veterinario / Proveedor) a la izquierda del nombre.
- **Chip Premium** clickeable → `/upgrade` si no es premium, a "Mi plan" si lo es.
- **Botón primario único**: "Editar perfil" (no tres botones sin jerarquía). El share y el engranaje pasan a icon-buttons dentro de un overflow `…`.

Prioridad: **máxima**. Lo primero que el usuario ve.

### Bloque B — Pets Carousel / Grid (segundo above-the-fold)

**Propósito**: que las mascotas sean lo primero visible después de la identidad, en una app cuyo valor central son las mascotas.

- **En mobile**: carrusel horizontal scrollable, 1.5 tarjetas visibles (diseño "peek") con snap.
- **En desktop**: grid de 3–4 columnas.
- Cada tarjeta de mascota muestra:
  - Foto circular grande
  - Nombre
  - Especie + edad calculada
  - **Ring de completitud** (% ficha clínica completa) — afordance visual clave
  - **1 acción primaria**: "Ver ficha" → `/pet/:petId/clinical`
- Al final del carrusel: card **"Agregar mascota"** (dashed) si no llegó al límite del plan.
- Si no tiene mascotas: estado vacío grande con CTA único "Registrar mi primera mascota".

Prioridad: **máxima**. Esto es lo que diferencia a Paw Friend.

### Bloque C — Perfil Progress + Health Signals

**Propósito**: cerrar el loop de completitud y dar al usuario un próximo paso claro.

Un solo card que muestra:

- **Tu perfil está al X%** (reutiliza la barra que ya vive en [Settings.tsx:184-198](src/pages/Settings.tsx#L184-L198) pero movida a Perfil, donde corresponde).
- **Ficha de Luna 60% completa** (si hay mascotas).
- **N recordatorios próximos** con link a `/reminders`.
- **Share con tu vet** — CTA si la ficha PDF está lista.

Si todo está al 100%: colapsa a un estado "✓ Tu perfil está completo" sin consumir espacio vertical.

Prioridad: **alta**. El driver de activación principal.

### Bloque D — Social Mini-bar (compacta, no protagonista)

**Propósito**: la parte social del producto sigue existiendo, pero no lidera.

Una sola fila con 3 contadores *clickeables*:

- **Posts** (N) → abre un drawer/modal con la grilla de posts (o navega a `/feed?user=me`).
- **Seguidores** (N) → lista de seguidores.
- **Siguiendo** (N) → lista.

No tabs. No grid de Instagram. Si el usuario tiene 0 posts, la fila se reduce a un CTA "Comparte tu primer momento en el Feed".

Prioridad: **media**. Valor real pero no central.

### Bloque E — Gamificación compacta

**Propósito**: mantener el enganche sin robar foco.

- PointsWidget compacto (la versión `compact={true}` que ya existe).
- "Ver logros" → sheet lateral con grid + misiones activas (no un tab propio).
- 1 misión destacada con progreso (la más cercana a completarse).

Prioridad: **media-baja**. Es retención, no activación.

### Bloque F — Ajustes y cuenta (collapsado)

**Propósito**: absorber el contenido de Settings sin enviar al usuario a otra ruta.

Lista de filas tipo iOS/Android (cada una navega o abre drawer):

- 👤 **Editar mi perfil** — drawer con los campos de Settings (name, bio, location, avatar)
- 💳 **Mi plan y facturación** — muestra plan actual, renueva o upgrade
- 🔗 **Integraciones** — WhatsApp, Google Calendar (reusa `IntegrationsCard`)
- 🔔 **Notificaciones**
- 🔒 **Privacidad y datos**
- 🏥 **Modo veterinario** (sólo si role includes vet/provider) → switch → `/provider/dashboard`
- ❓ **Ayuda y soporte**
- 🚪 **Cerrar sesión**

Estas filas viven en el mismo Perfil, reemplazando 95% del contenido de `/settings`. Settings puede quedar como fallback deep-link o desaparecer gradualmente.

Prioridad: **baja** en jerarquía visual, **alta** en cobertura funcional.

### Bloques que deben moverse fuera de Perfil

| Contenido actual | Mover a |
|---|---|
| Tab "Servicios" con `CreateServicePromotion` | `/provider/dashboard` — es B2B, no personal |
| Tab "Reseñas" (pendientes + historial) | Inbox/centro de actividad o integrar en cada tarjeta de vet |
| Grid masiva de posts estilo Instagram | `/feed?user=me` o drawer secundario |
| Misiones activas completas | Drawer de gamificación, no inline |

---

## 5. Relación usuario ↔ mascota(s)

Este es el punto estructural más importante del rediseño. Hoy están mezclados; deben convivir sin chocar.

### 5.1. Principio: dos niveles de identidad

```
Perfil (usuario humano)
 ├── Identity Card      ← "Pedro Susaeta, Santiago"
 └── Pets Carousel
      ├── PetCard "Luna"   → /pet/luna-id/clinical
      ├── PetCard "Rocky"  → /pet/rocky-id/clinical
      └── PetCard "+"      → /add-pet
```

- El usuario humano es **el contenedor**.
- Cada mascota es **un sub-perfil** con su propia ficha clínica, foto, datos, recordatorios.
- `Perfil` nunca "se convierte" en el perfil de una mascota — siempre se queda a nivel humano, y navega a la mascota via `/pet/:petId/clinical`.

### 5.2. Público vs privado

| Dato | Ubicación | Visibilidad |
|---|---|---|
| Nombre, avatar, bio humana | Perfil → Identity Card | Público (en `/user/:userId`) |
| Ubicación | Perfil → Identity Card | Público a nivel comuna, no dirección |
| Email, teléfono | Perfil → Bloque F (Ajustes) | Privado |
| Posts | Perfil → Social Mini-bar | Público |
| Mascotas (nombre, foto, especie) | Perfil → Pets Carousel | Público |
| **Ficha clínica, peso, diagnósticos** | `/pet/:petId/clinical` | **Privado salvo share explícito** |
| Plan, facturación | Perfil → Bloque F | Privado |
| Seguidores/siguiendo | Perfil → Social Mini-bar | Público |

**Regla clave**: `UserProfile.tsx` (vista pública en `/user/:userId`) debe reusar los mismos bloques A, B y D del rediseño, pero **sin** C (progress), sin E (gamificación privada) y sin F (ajustes). Así el perfil público se siente igual al propio pero sin las zonas íntimas.

### 5.3. Edición

- **Editar yo** → drawer inline desde Bloque A → actualiza `profiles`.
- **Editar mascota** → tap en PetCard → pantalla existente de edición (`/edit-pet/:petId`). No se edita una mascota desde Perfil.
- **Agregar mascota** → card "+" al final del carrusel → `/add-pet`.

### 5.4. Cambiar de mascota "activa"

Paw Friend no tiene concepto de "mascota activa" global (a diferencia de apps bancarias con "cuenta activa"). **No lo introduzcas**. Cada mascota es una entidad independiente accesible por click. El usuario siempre ve todas sus mascotas en el carrusel.

### 5.5. Accesos a salud, actividad, servicios desde mascota

Cada `PetCard` en el carrusel tiene **1 acción primaria** ("Ver ficha") y un menú secundario (long-press o `…`) con:

- Ver recordatorios de Luna
- Reservar con vet
- Compartir ficha con vet
- Editar mascota
- Archivar / memorial

---

## 6. Flujos conectados

Mapa de entradas y salidas de Perfil en la arquitectura propuesta:

| Flujo | Origen | Destino |
|---|---|---|
| Editar perfil humano | Bloque A "Editar perfil" / Bloque F "Editar mi perfil" | Drawer inline (no `/settings`) |
| Crear mascota | Bloque B carousel "+" o empty state | `/add-pet` |
| Ver/cambiar entre mascotas | Bloque B carousel scroll | Click → `/pet/:petId/clinical` |
| Ficha clínica PDF | Bloque B PetCard → primary action | `/pet/:petId/clinical` → botón PDF |
| Recordatorios | Bloque C "N próximos" | `/reminders` |
| Posts propios | Bloque D "Posts" | `/feed?user=me` (o drawer) |
| Logros / misiones | Bloque E "Ver logros" | Drawer lateral (no ruta nueva) |
| Plan y upgrade | Bloque A chip PREMIUM / Bloque F "Mi plan" | `/upgrade` |
| Integraciones | Bloque F "Integraciones" | Reusar `IntegrationsCard` inline |
| Notificaciones | Bloque F "Notificaciones" | Card inline |
| Privacidad | Bloque F "Privacidad y datos" | Card inline |
| Modo veterinario | Bloque F toggle | `/provider/dashboard` + set role |
| Onboarding incompleto | Bloque C progress bar | Drawer "Completa tu perfil" con steps |
| Compartir mi perfil público | Bloque A icon Share | `https://pawfriend.cl/user/:userId` (validar auth requerida) |
| Ver perfil de otros | (Externo, desde Feed, Search) | `/user/:userId` (UserProfile.tsx) |
| Cerrar sesión | Bloque F "Cerrar sesión" | Logout + redirect a `/auth` |

### 6.1. Onboarding incompleto

Cuando un usuario tiene < 50% de completitud:

- El Bloque C (Progress) se expande y muestra los pasos ordenados:
  1. Sube una foto de perfil
  2. Completa tu bio
  3. Registra tu primera mascota
  4. Agrega 1 recordatorio
  5. Agenda con un vet
- Cada paso es tappable y navega al flujo correspondiente.
- Al completar, el bloque colapsa con animación de "✓".

Esto resuelve el problema de que hoy Perfil es pasivo: convierte el vacío en progreso.

---

## 7. Diseño de la pantalla

### 7.1. Layout mobile (prioritario)

```
┌──────────────────────────────────┐
│ [←]  Perfil            [⋮]       │  ← PageHeader con back + overflow
├──────────────────────────────────┤
│                                  │
│  ●●●   Pedro Susaeta    👑 Prem. │  ← Bloque A Identity Card
│        Santiago · Dueño          │
│        "Amo a Luna y Rocky..."   │
│        [ Editar perfil ]   [↗]   │
│                                  │
├──────────────────────────────────┤
│  Mis mascotas                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │  ← Bloque B carrusel horizontal
│  │ 🐕 │ │ 🐈 │ │ 🐰 │ │  + │     │     scroll-snap
│  │Luna│ │Rock│ │Nube│ │    │     │
│  │ 80%│ │ 45%│ │ 20%│ │    │     │
│  └────┘ └────┘ └────┘ └────┘     │
├──────────────────────────────────┤
│  Tu perfil está al 70%       ›   │  ← Bloque C collapsable
│  2 recordatorios próximos        │
├──────────────────────────────────┤
│  12 posts · 45 seg · 18 sig.     │  ← Bloque D compacto
├──────────────────────────────────┤
│  ⭐ Nivel 3 · 240 puntos     ›   │  ← Bloque E 1 línea
├──────────────────────────────────┤
│  Ajustes y cuenta                │  ← Bloque F lista
│  👤 Editar mi perfil         ›   │
│  💳 Mi plan y facturación    ›   │
│  🔗 Integraciones            ›   │
│  🔔 Notificaciones           ›   │
│  🔒 Privacidad               ›   │
│  ❓ Ayuda                    ›   │
│  🚪 Cerrar sesión                │
└──────────────────────────────────┘
```

**Above the fold en iPhone SE (667 px)**: Bloque A + arranque del Bloque B (con peek de la segunda mascota visible). Lo crítico está arriba.

### 7.2. Layout desktop (secundario)

```
┌──────────────────────────────────────────────────────────────┐
│  Perfil                                                      │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│  Bloque A                      │  Bloque F (lista ajustes)   │
│  Identity Card grande          │  como sidebar derecho       │
│                                │                             │
│  Bloque B                      │                             │
│  Pets grid 3 columnas          │                             │
│                                │                             │
│  Bloque C Progress             │                             │
│                                │                             │
│  Bloque D Social + Bloque E    │                             │
│  Gamificación en 2-col         │                             │
│                                │                             │
└────────────────────────────────┴─────────────────────────────┘
```

- Desktop usa un split 2/3 + 1/3: contenido principal + ajustes como columna sticky.
- Max-width 1024 px (no 5xl). Perfil no es una página de marketing.

### 7.3. Orden visual y scroll

1. **Identidad** → 2. **Mascotas** → 3. **Progreso/Salud** → 4. **Social** → 5. **Gamificación** → 6. **Ajustes**

Patrón de scroll: **single column, vertical, sin tabs**. Las tabs actuales se eliminan. Cada sección tiene un título H2 y un divider fino.

Para contenidos secundarios (logros completos, posts completos) se usa **drawer lateral** (shadcn `Sheet`) que no fuerza navegación.

### 7.4. Componentes usados

- `Card` (shadcn) para cada bloque.
- `Avatar` + `AvatarImage` para identidad.
- `Badge` para rol y chips.
- `Button` con variants `default`, `outline`, `ghost` — sin 3 botones en fila, máximo 1 primario.
- `Sheet` para drawers de edit, logros, posts expandidos.
- `Progress` (shadcn) para completitud.
- Carrusel horizontal con `overflow-x-auto snap-x snap-mandatory` (no requiere librería externa).
- `Collapsible` para Bloque C cuando colapsa.

---

## 8. Sistema visual

### 8.1. Tono visual

- **Cálido pero ordenado**: el rediseño mantiene el `bg-warm-gradient` y la paleta Paw Friend, pero reduce el maximalismo actual (ring de avatar 4 px, gradientes en chips, emojis decorativos).
- **Premium cercano**: los cards usan `rounded-2xl` (no `rounded-3xl` que se ve infantil, no `rounded-lg` que se ve corporativo).
- **Confiable**: tipografía con pesos 500/600/700, nunca 800+. Sin shadow exageradas.

### 8.2. Densidad

- **Mobile**: padding vertical de cards = `py-4`, gap entre bloques = `gap-4`. La pantalla debe sentirse **respirable**, no apretada.
- **Desktop**: padding `py-6`, gap `gap-6`.
- **Evitar**: secciones con más de 3 filas sin dividers.

### 8.3. Jerarquía tipográfica

| Elemento | Mobile | Desktop | Weight |
|---|---|---|---|
| Nombre del usuario | `text-xl` (20 px) | `text-2xl` | 700 |
| Bio | `text-sm` (14 px) | `text-base` | 400 |
| Títulos de bloque (H2) | `text-base` | `text-lg` | 600 |
| Labels de stats | `text-xs` | `text-sm` | 500 |
| Números grandes (contadores) | `text-2xl` | `text-3xl` | 700 |
| Texto de lista de ajustes | `text-sm` | `text-base` | 500 |

**Nunca < 12 px** (hoy hay texto a 9 px).

### 8.4. Spacing

- Container mobile: `px-4`
- Container desktop: `px-6 max-w-5xl mx-auto` → cambiar a `max-w-4xl` para que el split 2/3+1/3 respire.
- Separación inter-bloques: `space-y-4` mobile, `space-y-6` desktop.

### 8.5. Avatar

- Humano: `h-16 w-16` mobile, `h-20 w-20` desktop. Sin ring de 4px (excesivo).
- Mascota en carrusel: tarjeta cuadrada con foto edge-to-edge + nombre bajo foto. No circular.
- Fallback: iniciales sobre `bg-primary/10`, sin gradiente.

### 8.6. Tarjetas de mascota (componente nuevo `PetIdentityCard`)

```
┌───────────────┐
│               │
│   [  FOTO  ]  │  ← aspect-square, object-cover
│               │
├───────────────┤
│ Luna          │  ← text-sm font-semibold
│ Perro · 3 años│  ← text-xs text-muted-foreground
│ ●●●●●●●○○○  │  ← ring de completitud 70%
└───────────────┘
    [Ver ficha]     ← botón secundario small
```

- `w-36` en mobile (permite peek), `w-full` dentro del grid desktop.
- Hover: `shadow-md` + `translate-y-[-2px]`.
- Tap: ripple / scale-95.

### 8.7. Chips y badges

- **Rol** (`Dueño` / `Vet` / `Peluquero`): chip `outline`, texto `text-xs`, sin color.
- **Premium**: chip con `bg-premium-gradient` (ya existe), **clickeable**.
- **Completitud 100%**: chip verde con ✓, tamaño pequeño.
- **Profesional verificado**: integrar `ProfessionalBadges` dentro de la Identity Card, no suelto.

### 8.8. Estados vacíos

| Contexto | Estado vacío |
|---|---|
| Sin mascotas | Ilustración de pata + "Aún no has registrado mascotas" + CTA "Registrar mi primera mascota" (botón grande primario). **No un card dashed escondido en un tab**. |
| Sin posts | Texto pequeño en Bloque D: "Aún no compartes momentos · Ir al Feed" |
| Sin seguidores | No mostrar contador 0, colapsar |
| Sin logros | Bloque E colapsado a: "Completa acciones para desbloquear tus primeros logros" |
| Perfil 100% completo | Bloque C colapsa a una línea "✓ Tu perfil está completo" |

### 8.9. Señales de confianza y completitud

- **Ring circular** alrededor del avatar humano que muestra % de completitud del perfil humano.
- **Ring rectangular** sobre cada PetCard con % de ficha clínica.
- **Badge ✓ verificado** si el usuario es profesional verificado.
- **Chip "Perfil compartido con 2 vets"** si hay shares activos.

### 8.10. Visualización de múltiples mascotas

- Hasta 3: carrusel fijo sin scroll visible.
- 4+: carrusel con scroll horizontal y dots indicador.
- 10+ (caso límite, sólo premium): carrusel con scroll + un link "Ver todas" que abre un drawer con grid 2×N.

---

## 9. Estrategia mobile-first

### 9.1. Primer viewport (iPhone SE, 375×667 px)

Visible sin scroll: **completo Bloque A + inicio de Bloque B con 1.5 PetCards visibles**.

Eso significa:

- Bloque A debe caber en < 220 px verticales.
- Bloque B empieza en < 240 px y muestra al menos una PetCard completa.

### 9.2. Qué se apila, qué se colapsa

- **Se apila**: Bloques verticalmente (no hay columnas en mobile).
- **Se colapsa**: Bloque C si el perfil está al 100%, Bloque E siempre a una sola fila con link a drawer, Bloque F siempre como lista (no cards individuales).

### 9.3. Qué texto se resume

- Bio: 2 líneas con `line-clamp-2` y expand al tap.
- Nombre de mascota en PetCard: `truncate`.
- Location: sólo comuna, no dirección.
- Bloque D: "12 posts · 45 seg · 18 sig." en una sola línea, no 4 columnas.

### 9.4. Acciones al alcance del pulgar

Las acciones más frecuentes se colocan en el **tercio inferior** de cada bloque visible:

- "Editar perfil" en Bloque A → abajo a la derecha.
- "Ver ficha" en cada PetCard → botón pequeño al pie de la tarjeta.
- "+" de mascota → última card del carrusel, accesible con un scroll.
- "Cerrar sesión" al final del Bloque F → se alcanza con scroll deliberado (acción poco frecuente).

### 9.5. Cómo evitar saturación

- **Un solo botón primario por bloque.** Los otros, icon-only o ghost.
- **Sin tabs.** Todo vertical.
- **Drawers para secundarios.** Logros, posts, edición — todo en `Sheet`.
- **Sin ilustraciones decorativas.** Sólo en estados vacíos reales.

### 9.6. Claridad entre identidad, mascotas y ajustes

Regla de color y forma:

- **Identidad humana**: avatar circular + fondo claro.
- **Mascotas**: cards cuadradas con foto edge-to-edge.
- **Ajustes**: filas lineales con iconos monocromos y chevron a la derecha.

Las tres capas tienen signatura visual distinta, imposible confundirlas.

---

## 10. Estados especiales

### 10.1. Usuario nuevo (recién registrado)

- Bloque A: avatar fallback, "Completa tu perfil" como subtítulo.
- Bloque B: estado vacío grande "Registra tu primera mascota" con CTA.
- Bloque C: expandido, mostrando los 5 pasos de onboarding.
- Bloque D, E: ocultos o colapsados al mínimo.
- Bloque F: visible con foco en "Editar mi perfil" al tope.

### 10.2. Usuario sin mascota

Igual al anterior pero el perfil humano está completo.

- Bloque B: estado vacío específico "Aún no tienes mascotas" + CTA único.
- El resto normal.

### 10.3. Usuario con 1 mascota

- Bloque B: PetCard más grande (ocupa 70% del ancho) + card "+" a la derecha.
- Bloque C: muestra ficha de la mascota en vez de progreso genérico.

### 10.4. Usuario con múltiples mascotas

- Bloque B: carrusel con scroll + indicador.
- Bloque C: muestra "La ficha más atrasada es la de Rocky (45%)" como próxima acción.

### 10.5. Usuario activo en comunidad (>10 posts, >50 seguidores)

- Bloque D se expande a mostrar 6 thumbnails de posts recientes (no el grid completo).
- "Ver todos" abre el drawer.

### 10.6. Usuario con datos incompletos

- Bloque C protagonista, no colapsado.
- Banner sutil en Bloque A: "Termina de configurar tu perfil para descargar fichas en PDF".

### 10.7. Usuario que entra solo a editar algo puntual

- Overflow `⋮` en PageHeader con shortcut directo: "Editar perfil", "Cerrar sesión", "Cambiar plan".
- El tap en la tab "Perfil" del bottom bar **nunca** hace scroll al Bloque F — respeta la jerarquía.
- Si llega desde un deep-link `/settings/notifications`, abre el drawer correspondiente directamente.

### 10.8. Usuario premium

- Chip Premium visible y clickeable → "Mi plan" en drawer.
- Bloque B sin límite de mascotas.
- Bloque F agrega fila "Facturación y recibos".

### 10.9. Usuario profesional (vet/proveedor)

- Chip de rol "Veterinario verificado" junto al nombre.
- Bloque F incluye fila **"Modo veterinario → Ir a mi dashboard"**.
- El resto del perfil sigue siendo el perfil personal (no se mezcla con su negocio).

### 10.10. Usuario viendo perfil ajeno

(Para `UserProfile.tsx`, que reusa el mismo layout)

- Bloque A: botón primario **"Seguir"** / "Siguiendo" en vez de "Editar".
- Bloque B: las mascotas del otro usuario con card **no clickeable a ficha clínica** (privada).
- Bloque C: oculto.
- Bloque D: visible (posts públicos).
- Bloque E: oculto.
- Bloque F: oculto, reemplazado por "Enviar mensaje".

---

## 11. Lista priorizada de cambios

### 11.1. Cambios críticos (romper/reconstruir)

1. **Eliminar la estructura de 5 tabs** en [Profile.tsx:254-482](src/pages/Profile.tsx#L254-L482). Reemplazar por layout vertical de 6 bloques.
2. **Subir las mascotas al segundo above-the-fold**. Hoy están en un tab invisible.
3. **Conectar el botón de engranaje** o eliminarlo: hoy es un botón muerto en [Profile.tsx:194](src/pages/Profile.tsx#L194).
4. **Fusionar Settings.tsx dentro de Perfil** como Bloque F (lista + drawers). Mantener `/settings` como ruta de redirect hacia `/profile` para compatibilidad.
5. **Mover "Servicios" (`CreateServicePromotion`) a `/provider/dashboard`**. No tiene por qué vivir en el perfil personal.
6. **Agregar acceso directo a ficha clínica de cada mascota** desde la PetCard.
7. **Agregar bloque de completitud** visible arriba, reutilizando lógica de [Settings.tsx:184-198](src/pages/Settings.tsx#L184-L198).
8. **Cambiar tipografía < 12 px** a mínimo 12 px.

### 11.2. Cambios importantes (rediseño)

9. Rediseño del header con 1 botón primario ("Editar perfil") + icon-buttons secundarios en overflow.
10. Chip Premium clickeable, con destino diferente para premium vs free.
11. Carrusel de mascotas con scroll horizontal snap en mobile.
12. Componente nuevo `PetIdentityCard` con ring de completitud.
13. Social mini-bar en una sola fila (3 contadores), no 4 stats.
14. Drawer lateral (`Sheet`) para Edit Profile, Achievements, Posts expandidos.
15. Vaciar `UserProfile.tsx` (pantalla pública) a las 3 secciones públicas (A, B público, D).

### 11.3. Mejoras premium (después del core)

16. Banner contextual de completitud en Bloque A si el perfil es < 50%.
17. Dot indicator en el carrusel de mascotas con 4+ animales.
18. Peek de segunda mascota garantizado en todos los breakpoints.
19. Badge "Perfil compartido con N vets" si hay shares activos.
20. Switch explícito "Modo veterinario" para usuarios dual-role.
21. Animación de colapso en Bloque C al llegar al 100%.

### 11.4. Cosas a remover

- Tab de Servicios (mover a provider dashboard).
- Tab de Reseñas (repensar como inbox o parte de actividad).
- Duplicación de `PointsWidget` (hoy en header + tab Logros).
- `dogProfileUrl` / `catProfileUrl` hardcoded de Unsplash en [Profile.tsx:37-38](src/pages/Profile.tsx#L37-L38) — usar placeholder local con aspect correcto.
- Tres botones en fila en el header.
- Ring de 4 px en avatar humano.

### 11.5. Cosas a mover fuera de Perfil

| De | A |
|---|---|
| `CreateServicePromotion` | `/provider/dashboard` |
| `PendingReviewsList` completo | Inbox o actividad |
| Grid completa de posts | `/feed?user=me` o drawer |
| Misiones activas completas | Drawer de gamificación |

---

## 12. Guía de implementación posterior

### 12.1. Orden recomendado (fases)

**Fase 1 — Fundamentos (no rompe nada)**

1. Crear componente `PetIdentityCard` aislado en `src/components/profile/PetIdentityCard.tsx`.
2. Crear componente `ProfileIdentityCard` aislado con el nuevo Bloque A.
3. Crear `ProfileCompletionCard` (Bloque C) extrayendo lógica de Settings.
4. Unit tests básicos de los 3 componentes.

**Fase 2 — Rediseño de Profile.tsx**

5. Reemplazar el layout de tabs por el layout vertical de 6 bloques.
6. Integrar los 3 componentes de Fase 1.
7. Conectar navegación: tap en PetCard → `/pet/:petId/clinical`, "Editar" → drawer inline.
8. Migrar gamificación compacta al Bloque E.
9. Migrar social mini-bar al Bloque D.

**Fase 3 — Fusión con Settings**

10. Implementar Bloque F como lista + drawers.
11. Reutilizar `IntegrationsCard` dentro del drawer de Integraciones.
12. Migrar notificaciones y cierre de sesión al Bloque F.
13. Redirigir `/settings` → `/profile` como fallback.

**Fase 4 — UserProfile público**

14. Adaptar [UserProfile.tsx](src/pages/UserProfile.tsx) al mismo esqueleto con las restricciones de privacidad (sólo A + B público + D).

**Fase 5 — Mover lo que no pertenece**

15. Mover `CreateServicePromotion` a `/provider/dashboard`.
16. Repensar tab Reseñas como parte del centro de actividad.

**Fase 6 — Pulido**

17. Animaciones y transiciones.
18. Estados vacíos reales con ilustración.
19. QA visual y funcional completo.

### 12.2. Qué validar primero

- Que el BottomTabBar siga resaltando "Perfil" cuando el usuario está en `/profile` (ya lo hace).
- Que el `max-w` nuevo no rompa otros contenedores globales.
- Que el `profile.is_premium` siga leyéndose correctamente (la chip ahora es clickeable).
- Que el `useGamification` no dispare doble fetch al colapsar el widget.

### 12.3. Qué no romper

1. **Ficha clínica PDF** — joya de la corona. Profile sólo debe *enlazar*, nunca interceptar.
2. **Flow payment** — la chip Premium no debe interferir con el flujo de `/upgrade`.
3. **Reemplazo de `/settings`** — mantener ruta con redirect por 2-3 releases hasta que no existan deep links.
4. **RLS de `profiles`, `pets`, `posts`** — el rediseño no toca queries, sólo UI.
5. **Copy chileno** — validar con subagente `ux-copy-chilean`.
6. **Datos de completitud en Settings** — si dos pantallas calculan completitud, extraer la lógica a un hook compartido `useProfileCompletion`.

### 12.4. Dependencias a revisar

- `useAuth`, `useGamification`, `useReminders`, `useStartConversation` — siguen usándose.
- `PointsWidget`, `AchievementBadge`, `MissionCard`, `ProfessionalBadges` — se reubican, no se reescriben.
- `IntegrationsCard` en [src/components/settings/IntegrationsCard.tsx](src/components/settings/IntegrationsCard.tsx) — se instancia desde el drawer de Perfil.
- `PendingReviewsList`, `UserReviewHistory`, `CreateServicePromotion` — candidatas a mover.
- [src/lib/plans.ts](src/lib/plans.ts) — necesario para mostrar plan actual en el drawer "Mi plan".
- Bottom bar: la regla `matchPaths(/settings)` en [BottomTabBar.tsx:78](src/components/BottomTabBar.tsx#L78) puede simplificarse una vez que `/settings` redirija.

### 12.5. Qué validar en desktop

- Split 2/3 + 1/3 con Bloque F como sidebar.
- Scroll del contenido principal sin afectar al sidebar (sticky).
- Carrusel de mascotas se convierte en grid 3-col.
- Modales `Sheet` que en mobile son drawers deben comportarse como dialogs centrados en desktop.

### 12.6. Qué validar en mobile

- iPhone SE (375×667): Bloque A + 1.5 mascotas visibles sin scroll.
- Android small (360×640): lo mismo.
- Safe-area-bottom: el contenido no queda debajo del BottomTabBar.
- Scroll horizontal del carrusel no captura el scroll vertical de la página.
- Touch targets ≥ 44 px en todas las filas del Bloque F.

### 12.7. Checklist QA visual

- [ ] Ningún texto < 12 px.
- [ ] Ningún botón sin handler (eliminar el engranaje muerto de hoy).
- [ ] Un solo botón primario en Bloque A.
- [ ] Chip Premium clickeable con destino correcto (premium vs free).
- [ ] PetCard con ring de completitud visible.
- [ ] Avatar humano ≤ 80 px (no 128 px).
- [ ] Cards `rounded-2xl` consistentes.
- [ ] Gap vertical `space-y-4` en mobile, `space-y-6` en desktop.
- [ ] No hay tabs en Profile.
- [ ] Onboarding bloque expandido para usuarios nuevos.
- [ ] Estado vacío de mascotas con CTA grande.
- [ ] Sin tipografía a 9 px.

### 12.8. Checklist QA funcional

- [ ] Tap en "Editar perfil" abre el drawer y guarda en `profiles`.
- [ ] Tap en PetCard navega a `/pet/:petId/clinical`.
- [ ] Tap en "+" del carrusel navega a `/add-pet`.
- [ ] Tap en "Cerrar sesión" cierra sesión y redirige a `/auth`.
- [ ] Tap en chip Premium navega a `/upgrade` (si free) o a Mi Plan (si premium).
- [ ] Tap en "Mis logros" abre drawer con grid + misiones.
- [ ] Tap en "N posts" navega al feed filtrado o abre drawer.
- [ ] Deep link `/settings` redirige a `/profile`.
- [ ] `UserProfile.tsx` (público) oculta los bloques privados.
- [ ] Botón "Seguir" funciona en perfil ajeno.
- [ ] El bloque de completitud actualiza su % al guardar el perfil.
- [ ] La cuota de mascotas (free 2, premium ilimitado) se respeta en la card "+".
- [ ] Sign out funciona y BottomTabBar resetea.
- [ ] El drawer de Integraciones monta `IntegrationsCard` y las conexiones de Google Calendar / WhatsApp siguen funcionando.

---

## Anexo — Referencias rápidas al código actual

- Pantalla a rediseñar: [src/pages/Profile.tsx](src/pages/Profile.tsx)
- Settings a absorber: [src/pages/Settings.tsx](src/pages/Settings.tsx)
- Perfil público a alinear: [src/pages/UserProfile.tsx](src/pages/UserProfile.tsx)
- Pets a enlazar: [src/pages/MyPets.tsx](src/pages/MyPets.tsx)
- Ficha clínica destino: [src/pages/PetProfile.tsx](src/pages/PetProfile.tsx) (ruta `/pet/:petId/clinical`)
- Navegación: [src/components/BottomTabBar.tsx](src/components/BottomTabBar.tsx)
- Integraciones (reusable): [src/components/settings/IntegrationsCard.tsx](src/components/settings/IntegrationsCard.tsx)
- Planes y límites: [src/lib/plans.ts](src/lib/plans.ts)

---

**Fin del blueprint.** Próximo paso sugerido: aprobación del documento, extracción de tokens de diseño (spacing, typography scale) y arranque de la Fase 1 (componentes aislados) sin tocar `Profile.tsx` todavía.
