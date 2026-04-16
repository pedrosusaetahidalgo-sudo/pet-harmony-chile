# Feedback Paloma (Palo) — Consolidado 2026-04-16

> Fuente: documento `feedback palo.docx` (17 screenshots con anotaciones) + audio transcrito de WhatsApp.
> Paloma es usuaria real con 2 mascotas (Pepa y Chapo), cuenta Premium trial 14 dias, testeando desde iPhone Safari.

---

## Resumen ejecutivo

**Problema central (audio):** "Son demasiadas cosas y no esta bien jerarquizada la informacion. No se donde mirar. El tener dos menus me confunde porque hay botones que llevan al mismo lugar pero son distintos."

Paloma descubre features por sorpresa (PawPoints, Feed, secciones del sidebar) en vez de guiadamente. La app tiene demasiados puntos de entrada redundantes y falta claridad sobre que es importante.

---

## Hallazgos priorizados

### CRITICO — Jerarquia y navegacion

| # | Hallazgo | Screenshot | Archivo(s) afectado(s) | Fix propuesto |
|---|----------|------------|----------------------|---------------|
| C1 | **Dos menus redundantes confunden.** Top bar (sidebar + iconos) + bottom tab bar llevan a los mismos lugares. El sidebar se descubre tarde y tiene features ocultas que no estan en el bottom tab. Top bar choca con notch iPhone. | IMG-1, IMG-16 | `Header.tsx`, `BottomTabBar.tsx`, `AppSidebar.tsx` | Simplificar: sidebar solo para features secundarias/explorar. Core nav solo en bottom tab. Reducir iconos del top bar. |
| C2 | **PawPoints nunca se explican.** "Nunca se me habla sobre los puntos hasta que llego a esa seccion". La seccion de gamificacion (IMG-11) es dificil de encontrar y cuando la encuentra no sabe como volver. | IMG-11 | `src/pages/Home.tsx`, onboarding | Agregar paso 4 al onboarding: "Gana puntos cuidando a tu mascota". Mini-card en Home explicando PawPoints. |
| C3 | **Feed/Comunidad descubierto por accidente.** "Tampoco sabia que existia. Me lo encontre de sorpresa." Las features Paw Labs no se presentan al usuario. | Audio | Sidebar, onboarding | Agregar seccion "Explorar" visible en Home con cards de features disponibles. |

### ALTO — Bugs funcionales

| # | Hallazgo | Screenshot | Archivo(s) afectado(s) | Fix propuesto |
|---|----------|------------|----------------------|---------------|
| H1 | **Paw Card se voltea al hacer scroll.** El swipe horizontal en el carousel de mascotas activa el flip de la tarjeta porque `onClick={handleFlip}` no distingue tap de scroll. | IMG-4, IMG-5 | `PawCardFlippable.tsx:121` | Agregar deteccion de movimiento: si `touchmove` delta > 10px, marcar como scroll y suprimir el flip en `onClick`. |
| H2 | **Perfil vet muestra "no encontrado".** Vet con `is_directory_visible: false` no puede ver su propio perfil publico. Race condition: `isOwnProfile` no esta resuelto cuando se hace el primer fetch con filtro de visibilidad. | IMG-8 | `PerfilVetPublico.tsx:35-61`, `useDirectoryVets.tsx:55-71` | Esperar a que `isOwnProfile` se resuelva antes de aplicar filtro de visibilidad, o siempre permitir al propio vet ver su perfil. |
| H3 | **Post en Feed no aparece despues de publicar.** Publica foto exitosamente pero el feed sigue mostrando "No hay publicaciones todavia". | IMG-13, IMG-14 | `FeedCreatePost.tsx:157-158`, `useFeedRealtime.ts` | Forzar `refetch()` sincrono despues de cerrar el dialog, no depender solo de `invalidateQueries`. |
| H4 | **Reservas muestra data inconsistente.** Card de paseador con texto "samdbsadkjd" (datos de prueba) aparece, pero abajo dice "No se encontraron paseadores". Click en la card no hace nada. | IMG-10 | `MyBookings.tsx:127-461` | Limpiar datos de prueba en prod. Agregar `onClick` a booking cards. Validar que `display_name` no sea basura. |
| H5 | **Deseleccion de rasgo de personalidad no se ve.** Al deseleccionar un rasgo, el Badge no cambia visualmente hasta hacer click fuera. | IMG-3 | `AddPet.tsx:551-935` | Verificar re-render del Badge. Posible issue con batching de React — forzar update inmediato del variant. |

### MEDIO — UX confusa

| # | Hallazgo | Screenshot | Archivo(s) afectado(s) | Fix propuesto |
|---|----------|------------|----------------------|---------------|
| M1 | **Directorio vets pide especialidad 2 veces.** Barra de busqueda acepta especialidad Y hay un dropdown separado "Todas las especialidades". "Me esta preguntando lo mismo en 2 lugares distintos." | IMG-5/6 | `DirectorioVets.tsx:200-255` | Search bar solo para nombres. Dropdown para especialidad. Separar responsabilidades. |
| M2 | **Comparador de precios no compara.** "Por comparador me habria esperado poner 2 comunas y que me salgan los datos de ambas." Solo muestra 1 comuna a la vez. | IMG-6/7 | `PreciosVeterinarios.tsx` | Renombrar a "Precios por comuna" (no "comparador"). O agregar seleccion de 2 comunas side-by-side. |
| M3 | **Ficha clinica: header superpuesto.** Titulo truncado "Ficha...", breadcrumb, selector mascota — todo apretado arriba. "Las cosas se superponen y no alcanzo a ver la info." | IMG-9 | Pagina ficha clinica | Simplificar header: eliminar breadcrumb redundante, expandir titulo. |
| M4 | **Botones redundantes en My Paws.** Input "Tengo un codigo de mi vet" + boton coleccion + boton "+" en la misma barra. Abajo otro CTA "Agregar Mi Primera Mascota". "Es raro tener 2 agregar con otra cosa entremedio." | IMG-2, IMG-12 | `MyPets.tsx` | Colapsar input de codigo en un dropdown/dialog. Dejar solo boton "+" para agregar. |
| M5 | **Error de WhatsApp lejos del input.** Validacion "Numero invalido" aparece como toast en vez de inline cerca del campo. "Me costo ver que estaba ahi abajo." | IMG-15 | `IntegrationsCard.tsx:79` | Reemplazar `toast.error()` por error inline debajo del input. |
| M6 | **Switch rol vet/dueno confuso.** "Encuentro raro poder cambiar de perfil. Quizas preguntarlo al hacer la cuenta. Me sobra tener ese switch arriba." | IMG-16 | `Header.tsx:192-245` | Ocultar toggle para usuarios que NO son vet. Solo mostrar si tienen `service_providers` record activo. |
| M7 | **"Toda la RM" parece seleccionado sin estarlo.** En el wizard BecomeProvider, el chip "Toda la RM" tiene estilo activo pero no esta seleccionado. | IMG-17 | `BecomeProviderDialog.tsx` | Verificar variant del chip — usar `outline` cuando no seleccionado. |

### BAJO — Cosmeticos

| # | Hallazgo | Screenshot | Fix |
|---|----------|------------|-----|
| L1 | Historias descentradas en Comunidad | IMG-13 | Revisar alineacion del boton X en modal "Nueva historia" |
| L2 | Sector filtros "apretujado" en directorio vets | IMG-7 | Aumentar spacing entre filtros en mobile |

---

## Temas transversales del audio

1. **Discoverability**: Paloma no descubre features organicamente. Las encuentra por accidente explorando menus. Falta un tour o seccion "Explorar" prominente.
2. **Redundancia de navegacion**: Mismas rutas accesibles desde 3 puntos (header, sidebar, bottom tab) genera confusion, no conveniencia.
3. **Falta de onboarding de gamificacion**: PawPoints, rachas, niveles — todo aparece sin contexto. El onboarding actual (Primeros Pasos) solo cubre mascota + recordatorio + vet.
4. **Expectativa de simplicidad**: Paloma espera una app de mascotas simple. La cantidad de features la abruma. Priorizar lo esencial y esconder lo experimental.

---

## Plan de accion sugerido

### Fase 1 — Bugs criticos ✅
- [x] H1: Fix Paw Card flip en scroll
- [x] H2: Fix perfil vet propio
- [x] H3: Fix feed post no aparece
- [x] H5: Fix deseleccion personalidad
- [x] M5: Error WhatsApp inline
- [x] M6: Ocultar toggle rol para no-vets

### Fase 2 — Simplificacion nav ✅
- [x] C1: Reducir top bar a logo + notificaciones + avatar. Removidos Coleccion y Mensajes.
- [x] M4: Limpiar barra de acciones en My Paws (solo boton Agregar, ClaimPet secundario)
- [x] M1: Separar search (solo nombres) de dropdown (especialidad) en directorio
- [x] M3: Ficha clinica — breadcrumbs removidos en vista owner, titulo expandido
- [x] M7: Chip "Toda la RM" usa estilo gris neutro cuando no seleccionado

### Fase 3 — Discoverability ✅
- [x] C2: Onboarding paso 4 — "Gana PawPoints cuidando a tu mascota"
- [x] C3: Seccion "Explorar" en Home (Feed, Comunidad, Misiones, Paw Game)
- [x] M2: Renombrar "comparador" a "Precios por comuna"

### Cosmeticos ✅
- [x] L1: Historia preview centrada (aspect-square + mx-auto en FeedStories.tsx)
- [x] L2: Spacing filtros directorio vets (flex-wrap + mb-4 en botones rapidos)

---

## Perfil de la tester

- **Nombre**: Paloma ("Palo", "Sastre")
- **Dispositivo**: iPhone (Safari mobile)
- **Cuenta**: Premium trial 14 dias
- **Mascotas**: Pepa (perro quiltro mestizo, hembra, 13 anos, 12 kg) + Chapo (boxer, macho, 10 anos)
- **Nivel tecnico**: Medio — usuaria regular de apps, no tecnica
- **Feedback style**: Visual (anota directamente en screenshots), honesto, orientado a UX
