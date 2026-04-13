# Ideas y Mejoras para Paw Friend

> Documento de trabajo — ideas priorizadas para ejecutar.
> Creado: 2026-04-12.

---

## 1. Breeding / Cruza Responsable (NUEVO)

**Concepto**: Modulo de matching para duenos que buscan cruzar su mascota de forma responsable. Un golden inscrito busca otro golden verificado, etc.

### Que construir

- **Perfil de cruza** en la ficha de la mascota: campo "Disponible para cruza" (toggle), requisitos minimos automaticos (vacunas al dia, desparasitado, edad reproductiva, sin condiciones hereditarias conocidas).
- **Busqueda y matching**: filtro por raza, comuna, verificacion sanitaria. Mostrar compatibilidad basica (raza pura vs cruce, edad, distancia).
- **Tarjeta de interes**: solicitud de contacto entre duenos. Chat interno o WhatsApp directo (con consentimiento).
- **Disclaimer legal permanente**: "Paw Friend facilita el contacto pero no certifica la salud reproductiva. Consulta a tu veterinario antes de cualquier cruza."

### Monetizacion

| Modelo | Detalle |
|---|---|
| Gratis | Ver perfiles disponibles, 1 solicitud de contacto/mes |
| Premium ($3.990) | Solicitudes ilimitadas, badge "Verificado por vet" si su vet lo confirma |
| Destacar publicacion | Pago unico ~$1.990 por 7 dias de visibilidad top |

### Guardrails eticos

- Solo mascotas con ficha clinica completa pueden activar el perfil.
- Bloquear razas con problemas hereditarios graves (braquicefalos severos) con advertencia educativa, no prohibicion total.
- Obligar a marcar si la mascota esta esterilizada (esterilizada = no aparece en matching).

### Archivos a crear/modificar

- Nueva pagina: `src/pages/BreedingMatch.tsx`
- Nuevo componente: `src/components/breeding/BreedingProfileCard.tsx`
- Campos en `pets`: `available_for_breeding boolean`, `breeding_requirements jsonb`
- Migracion SQL nueva
- Ruta nueva en `App.tsx`: `/cruza`

---

## 2. Banco de Sangre / Donaciones (NUEVO)

**Concepto**: En Chile siempre suben en Instagram buscando donantes de sangre para perros en emergencias. Paw Friend puede ser la plataforma donde se registran donantes y se buscan por tipo de sangre y ubicacion.

### Que construir

- **Campo `blood_type`**: ya existe en la ficha clinica (`PetData.blood_type`), pero NO se pide en el onboarding ni en AddPet. Exponerlo mas.
- **Toggle "Disponible como donante"** en la ficha de la mascota: activa si tiene tipo de sangre registrado, vacunas al dia, peso >25 kg (perros), edad 1-8 anos.
- **Busqueda de donantes**: filtro por tipo de sangre (DEA 1.1+, DEA 1.1-, etc. para perros; A, B, AB para gatos), comuna, disponibilidad.
- **Alerta de emergencia**: un dueno puede publicar "Necesito DEA 1.1+ urgente en Providencia" y notificar a donantes cercanos registrados.
- **Seccion educativa**: que es la donacion, requisitos, donde se hace, mitos vs realidad.

### Monetizacion

- Gratis para todos (es un servicio social, genera goodwill y retencion).
- Las clinicas que ofrezcan servicio de banco de sangre pagan por aparecer destacadas como "Centro de donacion verificado" → upsell al plan Clinica Basica/Pro.

### Archivos a crear/modificar

- Nueva pagina: `src/pages/BloodDonors.tsx`
- Componentes: `src/components/blood-bank/DonorCard.tsx`, `DonorSearch.tsx`, `EmergencyAlert.tsx`
- Agregar `blood_type` al formulario de `AddPet.tsx` (campo opcional)
- Agregar `available_as_donor boolean` a tabla `pets`
- Migracion SQL nueva
- Ruta nueva en `App.tsx`: `/donantes-sangre`

---

## 3. Mapa Pet Friendly: Restaurantes, Cafeterias y Parques (NUEVO)

**Concepto**: Extender el mapa existente con una capa de lugares pet friendly — restaurantes, cafes, parques, playas donde puedes ir con tu mascota.

### Estado actual del mapa

El mapa (`src/pages/Maps.tsx`) ya tiene 4 capas: Perdidas, Adopcion, Servicios, Tiendas/Partners. La infraestructura de capas, filtros y markers ya existe.

### Que construir

- **Nueva capa "Pet Friendly"** en el mapa existente con chips: Restaurantes / Cafes / Parques / Playas / Otros.
- **Tabla `pet_friendly_places`**: nombre, tipo, direccion, lat/lng, comuna, horario, restricciones (tamano mascota, terraza vs interior), fotos, rating de la comunidad.
- **Crowdsourcing**: cualquier usuario puede sugerir un lugar. Moderacion basica (admin aprueba o comunidad vota).
- **Resenas pet-specific**: "Tienen agua para perros", "Espacio amplio para perros grandes", "Solo terraza", etc. con tags predefinidos.
- **Integracion con Google Maps** para direcciones (link externo, no embed para no pagar API).

### Monetizacion

| Modelo | Detalle |
|---|---|
| Gratis | Ver mapa y resenas |
| Restaurante/cafe destacado | Pago mensual ~$9.900 por badge "Recomendado Pet Friendly" + posicion top en resultados |
| Alianzas | Restaurantes partner ofrecen descuento a usuarios Premium de Paw Friend (win-win) |

### Archivos a crear/modificar

- Extender `src/pages/Maps.tsx` con nueva capa/tab
- Nuevos componentes: `src/components/maps/PetFriendlyCard.tsx`, `src/components/maps/AddPlaceDialog.tsx`
- Nueva tabla `pet_friendly_places` + migracion
- Hook: `src/hooks/usePetFriendlyPlaces.ts`

---

## 4. Seguros Medicos para Mascotas (NUEVO)

**Concepto**: Marketplace de seguros medicos para mascotas. No crear una aseguradora propia, sino ser intermediario/comparador de planes existentes en Chile (Bupa Pets, Cubi Mascotas, MetLife Pets, etc.).

### Que construir

- **Pagina comparador**: "Compara seguros para tu mascota". Input: especie, raza, edad, comuna. Output: tabla comparativa de planes disponibles con cobertura, precio, exclusiones.
- **Lead generation**: boton "Cotizar" redirige al sitio del seguro con UTM de Paw Friend (modelo afiliado).
- **Campo en ficha clinica**: ya existe `insurance_provider` y `insurance_policy` en `PetData`. Conectar con el comparador para sugerir seguros si el campo esta vacio.
- **Contenido educativo**: "Que cubre un seguro para mascotas", "Vale la pena?", etc.

### Monetizacion

| Modelo | Detalle |
|---|---|
| Comision por lead/conversion | 5-15% del primer mes o fee fijo por lead calificado (modelo afiliado) |
| Posicion destacada | Aseguradoras pagan por aparecer primeras en el comparador |
| Dato agregado | Vender insights anonimizados a aseguradoras (razas mas aseguradas, comunas, etc.) — solo con consentimiento |

### Archivos a crear/modificar

- Nueva pagina: `src/pages/InsuranceCompare.tsx`
- Componentes: `src/components/insurance/InsurancePlanCard.tsx`, `InsuranceQuoteForm.tsx`
- Tabla `insurance_partners` (nombre, logo, url, planes, comision)
- Ruta nueva en `App.tsx`: `/seguros`

---

## 5. Adopcion Responsable — Mejora del Modulo Existente

**Estado actual**: La pagina de adopcion (`src/pages/Adoption.tsx`) ya existe con 4 tabs (Disponibles, Hogares IA, Mis Publicaciones, Me Interesa). Formulario completo en `CreateAdoptionPost.tsx`.

### Que mejorar

- **Perfil de adoptante**: antes de poder expresar interes, el usuario completa un mini-cuestionario: tipo de vivienda, horas en casa, experiencia previa, otras mascotas, ninos en el hogar, compromiso de esterilizacion post-adopcion.
- **Score de compatibilidad**: matching basico entre perfil del adoptante y necesidades de la mascota (tamano vs espacio, energia vs actividad del dueno, good_with_kids/dogs/cats).
- **Seguimiento post-adopcion**: recordatorios automaticos a los 7, 30 y 90 dias pidiendo una foto + update. Genera engagement y verifica bienestar.
- **Badge "Adoptante verificado"**: usuarios que completaron el perfil y tienen historial positivo.
- **Refugios verificados**: badge para refugios que cumplen estandares minimos, con link a su perfil publico.

### Monetizacion

- Gratis para adoptantes y publicadores.
- Refugios pagan plan Clinica Basica ($29.900/mes) para gestion avanzada de sus animales.
- Patrocinios: marcas pet pueden patrocinar la seccion de adopcion (banner discreto).

---

## 6. Revision de Monetizacion Completa

### Modelo actual

| Canal | Ingreso actual |
|---|---|
| B2C Premium | $3.990/mes o $39.900/ano |
| B2B Suscripciones vet | $0 / $9.900 / $29.900 / $59.900 mes |
| Comision por reserva | 12% flat (implementado en `src/lib/commissions.ts`) |
| Fee al usuario por booking | 5% plan gratis, 0% premium (actualmente DESACTIVADO — "Pivot medico: app 100% gratis para usuarios") |

### Nuevos canales propuestos

| Canal | Modelo | Ingreso estimado |
|---|---|---|
| **Comision por paciente nuevo** | Cobrar a clinicas/vets un fee por cada paciente nuevo que llegue via Paw Friend (no solo por reserva, sino por lead) | $2.000-5.000 por paciente nuevo verificado |
| **Breeding destacado** | Pago unico por visibilidad top en matching de cruza | ~$1.990 / 7 dias |
| **Lugares Pet Friendly** | Suscripcion mensual para restaurantes/cafes | ~$9.900/mes |
| **Seguros (afiliado)** | Comision por lead o conversion a aseguradora | 5-15% primer mes |
| **Paw Cards Premium** | Patrones holograficos exclusivos o disenos custom | ~$990-2.990 one-time |
| **Ads nativos** | Publicidad contextual en feed social (marcas pet) | CPM/CPC segun audiencia |
| **Data insights** | Reportes anonimizados para la industria pet (con consentimiento) | Enterprise, por reporte |

### Comision por paciente (detalle)

Actualmente se cobra 12% por reserva. La propuesta es agregar un **fee por lead/paciente nuevo**:

- Cuando un dueno encuentra un vet en el directorio publico y agenda su primera consulta → Paw Friend cobra un fee fijo a la clinica.
- Diferente de la comision por reserva (que es recurrente). Este es un fee de adquisicion one-time.
- Trackear con campo `referred_by_pawfriend boolean` en la tabla de bookings o una tabla `patient_referrals`.
- Solo clinicas en plan pagado (Individual+) pueden recibir leads del directorio. Las gratuitas aparecen pero sin CTA de agendar.

### Revision de pricing B2B

| Plan | Actual | Propuesta |
|---|---|---|
| Gratis | 10% comision, 20 clientes | Mantener, pero limitar visibilidad en directorio |
| Individual | $9.900, 12% comision | **Bajar comision a 8%**, agregar fee por lead ($2.000) |
| Clinica Basica | $29.900, 10% comision | **Bajar comision a 5%**, incluir leads ilimitados |
| Clinica Pro | $59.900, 0% comision | Mantener, agregar analytics de captacion de pacientes |

---

## 7. Revision de Onboarding

### Estado actual

**Onboarding dueno** (`OnboardingDuenoMinimal.tsx`):
- Solo pide: nombre mascota, especie, rango edad, foto opcional.
- Mensaje: "Tu ficha esta al 30%".
- Problema: NO pide datos del dueno (comuna, telefono), NO pide tipo de sangre, NO pregunta si esta esterilizada, NO explica features clave.

**Onboarding vet** (`OnboardingVetMinimal.tsx`):
- Pide: nombre, comuna, especialidades, avatar.
- Mensaje: "Tu perfil esta al 40%".
- Problema: NO explica el modelo de comision, NO muestra preview del perfil publico, NO motiva a completar.

### Mejoras propuestas

#### 7.1 Onboarding dueno — flujo mejorado (3 pasos)

**Paso 1 — Tu mascota** (actual, mantener):
- Nombre, especie, raza (agregar), edad, foto.

**Paso 2 — Salud basica** (NUEVO):
- Esterilizada? (si/no) — importante para breeding y para vets.
- Tipo de sangre (opcional, con link educativo "Por que es importante?").
- Vacunas al dia? (si/no/no se).
- Alergias conocidas (texto libre, opcional).

**Paso 3 — Tu ubicacion** (NUEVO):
- Comuna (autocomplete Santiago) — para conectar con vets cercanos y alertas.
- "Que te interesa?" (multi-select): Veterinarios cercanos / Adopcion / Cruza responsable / Lugares pet friendly / Seguros.
- Esto permite personalizar el home dashboard segun intereses.

**Barra de progreso** visual (30% → 60% → 90%) que motive a completar.

**Post-onboarding**: tooltip tour de 3 bubbles mostrando ficha clinica, directorio vets, y mapa.

#### 7.2 Onboarding vet — flujo mejorado (3 pasos)

**Paso 1 — Tu perfil** (actual, mantener):
- Nombre, comuna, especialidades, avatar.

**Paso 2 — Tu clinica** (NUEVO):
- Nombre clinica (opcional, para independientes).
- Direccion con mapa pin (para aparecer en el mapa).
- Horarios de atencion (selector de rangos).
- Telefono / WhatsApp (para contacto directo).

**Paso 3 — Como funciona Paw Friend** (NUEVO):
- Mini-explainer visual: "Los duenos te encuentran en el directorio → agendan contigo → tu gestionas desde el dashboard".
- Mostrar preview de como se vera su perfil publico (reutilizar el "Ver como me ven los duenos" que ya existe).
- Explicar modelo de comision transparentemente.
- CTA: "Completar perfil para aparecer en el directorio".

#### 7.3 Onboarding adopcion (NUEVO)

Si el usuario marca interes en adopcion o entra a `/adoption` por primera vez:
- Mini-cuestionario de perfil adoptante (vivienda, horas, experiencia, etc.).
- Explicacion del proceso de adopcion responsable.
- Badge "Perfil de adoptante completo" que da prioridad en solicitudes.

---

## 8. Prioridades de Ejecucion

| Prioridad | Feature | Impacto | Esfuerzo |
|---|---|---|---|
| **P0** | Mejora onboarding dueno (pasos 2-3) | Alto — retencion dia 1 | Medio (2-3 dias) |
| **P0** | Mejora onboarding vet (pasos 2-3) | Alto — conversion B2B | Medio (2-3 dias) |
| **P1** | Banco de sangre / donantes | Alto — diferenciador unico, viralidad IG | Medio (3-4 dias) |
| **P1** | Mapa pet friendly (nueva capa) | Alto — engagement diario | Medio (3-4 dias) |
| **P1** | Comision por paciente nuevo (B2B) | Alto — revenue | Bajo (1-2 dias, es logica de tracking) |
| **P2** | Adopcion responsable (mejoras) | Medio — social impact, PR | Medio (3-4 dias) |
| **P2** | Breeding / cruza responsable | Medio — nicho pero monetizable | Alto (5-7 dias) |
| **P3** | Seguros (comparador afiliado) | Medio — revenue pasivo | Alto (depende de alianzas) |
| **P3** | Paw Cards Premium | Bajo — gamificacion, nice revenue | Bajo (2 dias) |

---

## 9. Notas de Implementacion

- **Cada feature nueva debe incluir**: migracion SQL (no aplicar automaticamente), actualizacion de `FLUJO_COMPLETO.mmd`, actualizacion de `MAPA_FUNCIONAL_COMPLETO.md`.
- **Copy siempre en espanol chileno** (tu, tienes, puedes).
- **Mobile-first**: todo debe funcionar en Capacitor Android/iOS.
- **No tocar la joya de la corona** (ficha medica PDF + directorio vets) mas alla de conectar las nuevas features con ella.
- **Banco de sangre**: validar con un vet real antes de definir requisitos de donacion (peso minimo, edad, etc.).
- **Seguros**: requiere conversaciones comerciales con aseguradoras antes de construir. Empezar con landing informativa + waitlist.
