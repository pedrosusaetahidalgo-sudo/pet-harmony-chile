# Feedback de usuario real — 2026-04-10

> Perfil: dueña de perros, se mudó a Puerto (Montt/Varas), busca alimento premium (Acana), potencial paseadora/cuidadora. Representa al usuario power-user que haría B2C + B2B dual.

---

## Resumen ejecutivo

8 puntos de feedback. 5 ya tienen implementación parcial o total. 3 son features nuevas con alto valor. El feedback confirma los dolores #1 (ficha médica) y #3 (emergencia vet) del roadmap, y agrega un dolor nuevo: **comunidad por condición/raza** que ningún competidor chileno tiene.

---

## Feedback desglosado + estado actual + acción

### 1. Localizador de tiendas de alimento/productos por marca

> *"Me cambié a Puerto y me di mil vueltas para encontrar Acana"*

| | |
|---|---|
| **Estado** | NO EXISTE |
| **Dolor** | Alto para dueños de mascotas con dietas especiales o que se mudan |
| **Prioridad** | BAJA — fuera del core actual. Requeriría partnership con distribuidoras (Champion Petfoods/Acana, Royal Canin, etc.) o scraping de stock. Alto esfuerzo, bajo ROI inmediato. |
| **Acción** | Anotar para roadmap futuro (v2+). Podría ser un diferenciador si se cruza con el mapa existente. No implementar ahora. |

---

### 2. Ficha médica: guardar papeles, recetas, imágenes

> *"La usaría para tener los papeles al día y no perder las recetas médicas. Se pueden guardar imágenes?"*

| | |
|---|---|
| **Estado** | EXISTE — `UploadMedicalDocumentDialog.tsx` soporta JPG, PNG, HEIC, PDF (max 10MB). Tipos: carnet vacunas, resultados lab, radiografías, recetas, otros. |
| **Dolor** | Altísimo — es el #1 motivo de uso según este y otros feedbacks. |
| **Prioridad** | Ya implementado. La joya de la corona. |
| **Accion** | **Mejorar discoverability**. Si el usuario no sabe que existe, no sirve. Considerar: (a) tooltip/onboarding que muestre "Sube fotos de recetas y carnet aquí", (b) CTA más visible en la ficha clínica para subir documentos. |

---

### 3. Feed social: ver otros perros, organizar paseos grupales

> *"La usaría para ver otros perrines! Quizás organizarme para pasear con otros perros que me caigan bien"*

| | |
|---|---|
| **Estado** | PARCIAL — Feed social existe (`/feed`) con posts, likes, comments, follows. Pero NO hay organización de paseos grupales ni eventos. |
| **Dolor** | Medio — social es engagement, no dolor crítico. Pero la parte de "organizar paseos" tiene valor real. |
| **Prioridad** | MEDIA — El feed ya existe. Agregar eventos/paseos grupales sería feature nueva. |
| **Accion** | **Corto plazo**: nada, el feed ya cubre lo básico. **Medio plazo**: considerar "Eventos" o "Quedadas" como tipo de post especial con fecha/lugar/RSVP. Bajo esfuerzo si se modela como post con metadata extra. |

---

### 4. Veterinarios de emergencia: precios + horarios + disponibilidad

> *"En emergencia seguro para ver precio y veterinarios abiertos. Ahí es donde uno se gasta la vida por estar asustado y no saber donde ir"*

| | |
|---|---|
| **Estado** | PARCIAL — Precios existen (`/precios-veterinarios`, `price_from` en directorio). Horarios de atención NO existen en el perfil público del vet. |
| **Dolor** | ALTÍSIMO — emergencia + desorientación + gasto innecesario. Dolor #3 del roadmap. |
| **Prioridad** | **ALTA** — Implementar horarios de atención en perfil vet. |
| **Accion inmediata** | |

```
1. Agregar campos a service_providers:
   - opening_hours jsonb (lunes-domingo, apertura/cierre)
   - emergency_available boolean
   - emergency_phone text
   - emergency_surcharge_pct int

2. Mostrar en DirectorioVets.tsx:
   - Badge "Abierto ahora" / "Cerrado" (calculado client-side)
   - Filtro "Abiertos ahora" + "Atiende urgencias"
   - Teléfono de emergencia visible

3. Botón "Emergencia" destacado en home/navbar que filtra
   directorio por: abiertos ahora + atiende urgencias + ordena por cercanía
```

**Esfuerzo**: M (8-12h). **Impacto**: Muy alto. Único en Chile con esta UX.

---

### 5. Registrarse como paseadora/cuidadora (dual role)

> *"También creo que la usaría como paseadora o cuidadora, me inscribiría así también"*

| | |
|---|---|
| **Estado** | EXISTE — Sistema multi-rol funciona. `dog_walker_profiles`, `dogsitter_profiles`, `trainer_profiles`, `groomer_profiles` con registro vía `/registro-veterinario` (nombre engañoso) y `/provider/profile-edit`. |
| **Dolor** | Medio — la funcionalidad existe pero el flujo de registro no es claro para no-vets. |
| **Prioridad** | MEDIA |
| **Accion** | (a) Renombrar o crear ruta `/registro-proveedor` que sea genérica (no solo "veterinario"). (b) En el perfil de usuario, agregar CTA "Ofrece tus servicios" que lleve al registro de proveedor con selector de tipo (paseador, cuidador, entrenador, peluquero). |

---

### 6. Perfil humano visible con mascotas (confianza)

> *"En los perfiles también podrías agregar un perfil para el humano. Ven a mis perros y al toque saben si confían para que cuide otros"*

| | |
|---|---|
| **Estado** | EXISTE — `/user/:userId` muestra display_name, bio, location, nivel, puntos, posts, y mascotas públicas (nombre, especie, raza, foto, género, edad). |
| **Dolor** | Bajo — ya está implementado. |
| **Prioridad** | BAJA |
| **Accion** | **Mejorar el perfil público** para proveedores de servicio: (a) mostrar badge "Paseador verificado" / "Cuidadora verificada", (b) mostrar rating y reseñas en el perfil público del usuario (no solo en el perfil de proveedor), (c) link directo "Ver mis servicios" desde el perfil. Esto cierra el loop de confianza que menciona la usuaria. |

---

### 7. Compartir ficha por QR a vet vía WhatsApp

> *"Que se comparta la ficha por QR? Uno hace una consulta a un vet por WhatsApp y le manda la ficha al toque"*

| | |
|---|---|
| **Estado** | PARCIAL — QR existe (`PetQRDisplay.tsx`), share tokens existen (`useMedicalSharing.tsx`), pero la página de destino del share está incompleta. |
| **Dolor** | Alto — es el flujo killer del MVP. Dueño → WhatsApp → vet ve ficha completa → ahorra tiempo. |
| **Prioridad** | **ALTA** — Ya está en roadmap como prioridad alta (RECOMENDACIONES §2). |
| **Accion inmediata** | |

```
1. Completar la página /medical-share/:token para que muestre:
   - Datos del pet (nombre, especie, raza, edad, peso)
   - Historial médico completo (vacunas, consultas, tratamientos)
   - Documentos subidos (fotos de recetas, etc.)
   - Botón "Descargar PDF" para el vet

2. Agregar botón "Compartir por WhatsApp" que genere link:
   https://wa.me/?text=Ficha+de+{petName}:+pawfriend.cl/medical-share/{token}

3. El QR debe codificar la misma URL del share token
```

**Esfuerzo**: S-M (4-8h, la infraestructura ya existe). **Impacto**: Altísimo.

---

### 8. Chat/grupo por raza o por condición médica

> *"Otro chat por raza o por problema, como que se pueda armar un grupo de perros con displasia de cadera y se compartan cosas"*

| | |
|---|---|
| **Estado** | NO EXISTE — Solo chat 1-on-1. No hay grupos, canales, ni comunidades temáticas. |
| **Dolor** | Medio-alto — los dueños de mascotas con condiciones crónicas (displasia, diabetes, epilepsia) están solos y buscan comunidad activamente en Facebook/WhatsApp. |
| **Prioridad** | **MEDIA-ALTA** — Feature nueva con potencial de retención enorme. Ningún competidor chileno lo tiene. |
| **Accion** | |

```
Fase 1 (MVP grupos, ~20-30h):
  - Tabla: community_groups (id, name, slug, description, category, 
    group_type enum('breed','condition','location','general'), 
    is_public, member_count, created_by, created_at)
  - Tabla: community_group_members (group_id, user_id, role, joined_at)
  - Tabla: community_group_messages (group_id, user_id, content, created_at)
  - UI: /comunidad con lista de grupos + búsqueda
  - UI: /comunidad/:slug con chat grupal
  - Grupos semilla: "Displasia de cadera", "Diabetes felina", 
    "Labradores Chile", "Gatos rescatados", "Perros senior"

Fase 2 (mejoras):
  - Moderación automática
  - Pin de mensajes útiles
  - Compartir fichas médicas en el grupo
  - Vet puede responder como "experto verificado"
```

**Impacto**: Alto en retención. Es el tipo de feature que hace que la gente abra la app todos los días.

---

### 9. WhatsApp + Calendar (confirmación)

> *"Está fino que se conecte a WhatsApp y Calendar"*

| | |
|---|---|
| **Estado** | IMPLEMENTADO en backend. WhatsApp pendiente verificación Meta. Google Calendar OAuth completo pero sin UI de activación visible en Settings. |
| **Accion** | (a) Terminar verificación Meta Business (bloqueante manual del dueño). (b) Agregar toggle en Settings para conectar Google Calendar con UI clara. |

---

## Matriz de priorización

| # | Feature | Dolor | Esfuerzo | Estado | Prioridad |
|---|---------|-------|----------|--------|-----------|
| 4 | Emergencia: horarios + filtro "abierto ahora" | Altísimo | M (8-12h) | Parcial | **P0** |
| 7 | Completar share por QR/WhatsApp | Alto | S-M (4-8h) | Parcial | **P0** |
| 2 | Mejorar discoverability de upload docs | Alto | S (2-3h) | Existe | **P1** |
| 8 | Grupos por raza/condición (MVP) | Medio-alto | L (20-30h) | No existe | **P1** |
| 9 | UI para WhatsApp + Calendar en Settings | Medio | S (3-4h) | Backend listo | **P1** |
| 5 | Registro proveedor genérico (no solo vet) | Medio | S (3-4h) | Existe mal nombrado | **P2** |
| 6 | Badge verificado + reseñas en perfil público | Bajo | S (2-3h) | Parcial | **P2** |
| 3 | Eventos/quedadas de paseo grupal | Medio | M (12-16h) | No existe | **P3** |
| 1 | Localizador de tiendas por marca | Alto pero fuera de scope | L (40h+) | No existe | **P4 (futuro)** |

---

## Insights clave de este feedback

1. **La ficha médica + compartir es EL producto**. Confirma que es la joya de la corona. Todo lo que facilite "mando la ficha al vet por WhatsApp" es oro.

2. **Emergencias es un momento de verdad**. La usuaria describe exactamente el dolor: "se gasta la vida por estar asustado y no saber dónde ir". Un botón "Emergencia" que muestre vets abiertos ahora con precios sería un game-changer y viral por boca a boca.

3. **La comunidad por condición médica es un ocean blue**. Nadie en Chile lo tiene. Los grupos de Facebook de "perros con displasia" tienen miles de miembros. Capturar eso dentro de Paw Friend = retención diaria.

4. **El dual-role (dueña + paseadora) existe pero no se descubre**. Esta usuaria no sabe que puede registrarse como proveedora. El flujo de registro necesita una puerta de entrada más visible.

5. **El perfil público ya muestra mascotas pero la usuaria no lo sabe**. Problema de discoverability, no de implementación.
