# Recomendaciones estratégicas Paw Friend — 2026-04-08

> Análisis cruzado: estado actual del producto + competencia chilena + roadmap MVP. Recomendaciones priorizadas para los próximos 30/60/90 días. Toda referencia a "competencia" remite a `audits/COMPETENCIA_2026_04_08.md`.

---

## TL;DR ejecutivo

- **Pricing Premium B2C está desalineado**: `src/lib/plans.ts:47` dice `$3.990` pero `CONTEXTO_2026_04_11.md:17` y la memoria del proyecto dicen `$2.990`. Decisión del dueño esta semana: alinear a UN precio. Recomiendo **$3.990 mensual / $39.900 anual** (ya en código) y comunicarlo consistentemente — sigue por debajo de Netflix/Spotify CL.
- **El moat defendible real es el cruce B2C+B2B+directorio SEO + estimador de precios por comuna**. Ningún competidor chileno lo tiene (ver COMPETENCIA §"Posicionamiento"). Hay que terminar de cargar data real en `vet_service_prices` en 30 días o la página pública queda vacía.
- **El plan Premium+ ($6.990) existe en el código pero nadie lo vende**: `src/lib/plans.ts:64-85` lo define pero `CONTEXTO` y la memoria solo hablan de "Premium". Decisión: matar Premium+ o darle lugar real en `Upgrade.tsx` y landing. Hoy es deuda muerta.
- **WhatsApp recordatorios sigue sin encender** (CONTEXTO_2026_04_11.md:136, edge function `send-whatsapp-reminder` en espera de Meta). Es el diferenciador #2 más importante del MVP (ESTRATEGIA_MVP_2026.md §5). Bloqueante manual del dueño: terminar verificación Meta Business.
- **Comisiones 15/12/10/8% no son competitivas vs un vet que usa WhatsApp (0%)**. Petsy/CuidaPet no publican comisiones. Recomendación fuerte: **eliminar comisiones del plan Clínica Pro ($59.900)** para darle sentido al upgrade y **bajar la comisión del plan Gratis a 10%** para que no parezca un castigo.

---

## 1. Posicionamiento que tenés que defender

Los diferenciadores reales que tenés HOY vs competencia chilena (ver tabla COMPETENCIA §"Posicionamiento" y ficha Petsy/CuidaPet/QVET):

1. **Cruce verticalmente integrado B2C + B2B + directorio SEO público**. Único en Chile. QVET/VetPraxis son B2B puros; Petsy/CuidaPet son B2C puros; Veterinariachile.com es directorio pasivo. Paw Friend es el único en el cruce.
2. **Ficha clínica con PDF español + ZIP de documentos** (`supabase/functions/generate-medical-summary`, `generate-medical-zip`). Petsy tiene ficha pero no exporta. QVET exporta pero no llega al dueño chileno.
3. **Directorio público SEO `/veterinarios`, `/veterinarios/comuna/:comuna`, `/veterinarios/:slug`** (`src/App.tsx:143-146`). Nadie en B2C lo tiene. Es el moat más durable contra Petsy.
4. **Pricing B2B publicado en CLP** ($9.900 / $29.900 / $59.900) — QVET y VetPraxis no publican precios, generan fricción enterprise.
5. **Estimador de precios veterinarios por comuna** (`/precios-veterinarios`, commits `b68ea81`/`7f70ff5`/`33a97b8`/`2e11be6`). **Único en Chile** según ESTRATEGIA_MVP_2026.md §4.3 + Anexo B. Pero **necesita data real para ser útil** — hoy depende de lo que cada vet cargue manualmente.
6. **Google Calendar sync nativo** (CONTEXTO §2). Único en el mercado chileno según CONTEXTO §16.
7. **Premium B2C con Flow** (no Webpay) — fricción menor que CuidaPet que cobra abono Webpay.

**Lo que NO es diferenciador pero creías que sí:**

- **Chat in-app** (`/chat`) — Petsy y CuidaPet lo tienen.
- **Reservas online** — Petsy, CuidaPet, Duko, Wolkie lo tienen.
- **Ficha clínica básica** — Petsy ya la tiene (COMPETENCIA §5).
- **Mapa de vets** — los directorios pasivos lo tienen en versión estática.

---

## 2. Qué AGREGAR (priorizado por impacto vs esfuerzo)

### Alta prioridad (próximas 2-4 semanas)

| Feature | Por qué | Esfuerzo | Cómo se mide éxito |
|---|---|---|---|
| **Cargar 50+ precios reales en `vet_service_prices`** (seed manual + 5-10 vets piloto) | Sin data, `/precios-veterinarios` queda vacío y pierde el 4to diferenciador (ESTRATEGIA §Anexo B). SEO muere. | M (8-16h, mezcla data entry + outreach) | `select count(*) from vet_service_prices` ≥ 50 + 3 comunas ≥ 5 precios |
| **Activar WhatsApp Cloud API** (completar secrets Meta + cron) | El canal #1 en Chile. ESTRATEGIA §5 lo marca bloqueante. Código ya está (`send-whatsapp-reminder`, CONTEXTO §6). | S (2h dueño + 1h dev post-aprobación Meta) | # recordatorios enviados vía WA / semana > 0, tasa apertura > 60% |
| **Alinear pricing Premium B2C a un único número** ($3.990) en plans.ts + Upgrade.tsx + Index.tsx + landing + memoria | Contradicción entre `src/lib/plans.ts:47` ($3.990) y memoria/CONTEXTO ($2.990) destruye confianza. | S (1-2h) | Grep por `2990` devuelve 0 matches en `src/` |
| **QR exportable en ficha clínica** (anexo al PDF + tab Compartir) | ESTRATEGIA §5 lo lista como "alto impacto mes 1-2". Vet escanea, gana 30s/consulta. Complementa el WhatsApp share. | S (3-4h, usa librería qrcode.react) | # escaneos detectados vía token /shared/:id |
| **Plantillas post-consulta para vets** (resumen en 30s con alternativas discutidas) | Ataca el gap 81/73 del Anexo PetSmart-Gallup (ESTRATEGIA §1). Hipótesis 3 de ESTRATEGIA. Único en Chile. | M (12-16h) | % bookings con resumen generado > 40% |
| **Push notifications nativas Capacitor/FCM** | Sin esto, la app es "solo web" y las notificaciones web son ignoradas. ESTRATEGIA §5. | M (8-12h) | opt-in > 30%, retención D7 mejora 2x |

### Media prioridad (1-3 meses)

| Feature | Por qué | Esfuerzo | Éxito |
|---|---|---|---|
| **Editor de ficha desde lado vet** (mínimo viable: update de último registro + instrucciones) | Habilita Hipótesis 2 (B2B). Sin esto, el vet no tiene razón real para pagar. | L (30-40h) | # bookings que terminan con ficha editada por vet |
| **Importar carnet papel vía foto + OCR** (Vision API o Claude multimodal) | Onboarding 10x más rápido. Dueño no tipea nada. Único en Chile. | M (16-20h) | % nuevos users que usan OCR vs manual |
| **Notificación al vet cuando dueño comparte ficha** (badge dashboard) | Commit `89cc9f8` dice que se hizo. **Verificar** si está realmente visible. Si no, terminar. Cierra loop B2C→B2B. | S (4-6h si falta polish) | # bookings originados por ficha compartida |
| **Checklist Grimace señales de dolor/deterioro** | Cero competidores. Percepción de valor altísima. ESTRATEGIA §4.4. | M (10-14h) | # checks/semana por usuario activo |
| **Bot FAQ para clínicas** (responde "¿están abiertos?" "¿precio vacuna?") | Ataca dolor #2 del vet: llamados rutinarios. | M (12h con prompt engineering) | % bookings con FAQ previo resuelto |
| **Stats de negocio en ProviderDashboard** (revenue, no-shows, retención 30/60/90) | Sin esto el vet no sabe si el plan vale la pena. Churn B2B sube. | M (10-12h) | % vets pagos que entran a stats ≥ 1x/sem |

### Baja prioridad / nice to have

| Feature | Por qué | Esfuerzo | Éxito |
|---|---|---|---|
| **Inbox unificado de mensajes vet** | Deseable pero Chat ya existe. | L (20h) | — |
| **Pagos en cuotas BNPL** (partnership Khipu/Getnet) | Ataca costo vet, pero riesgo regulatorio. ESTRATEGIA §8 dice "nunca o muy tarde". | L | — |
| **Telemedicina** | Vetivery/CuidaPet ya lo hacen, no diferencia. ESTRATEGIA §8. | L | No hacer hoy |
| **Sentry error tracking** | CONTEXTO §5.1.5 ya lo menciona. Operacional. | S (2h) | # errores capturados/semana |

---

## 3. Qué ELIMINAR o simplificar

### 3.1. Código/features a borrar

| Qué | Archivo | Justificación |
|---|---|---|
| **Plan `premium_plus` ($6.990)** | `src/lib/plans.ts:64-85` | No aparece mencionado en `CONTEXTO_2026_04_11.md:17` ni en la memoria como parte del pitch. Hoy es deuda: código muerto o opción que confunde al usuario en `/upgrade`. **Decisión dueño**: matar o relanzar con propósito (ej. multi-mascota ilimitada + IA ilimitada). Yo mataría, 1 tier B2C es más claro. |
| **`webpay-confirm` edge function** | CONTEXTO_2026_04_11 §4.1 + commit `c85747c` ya la borró. Verificar que no queden restos en el cliente. | Obsoleta, Flow reemplaza. |
| **`/places` redirect** | `src/App.tsx:100` | Redirect legacy. Si nadie tiene deep links viejos, borrar. |
| **`/payment-success` y `/payment-failed` redirects** | `src/App.tsx:128-129` | Sobreviven solo por links viejos de Webpay. Borrar en 60 días. |
| **`/dog-walkers`, `/home-vets`, `/dog-sitters`, `/dog-trainers` redirects** | `src/App.tsx:115-118` | Legacy. Si quedan links SEO indexados, 301 a `/services/:type`. En 90 días eliminar. |
| **`PawGame` (gamification) como eje central** | `src/pages/PawGame.tsx`, `src/App.tsx:108` | ESTRATEGIA §4 (tabla "Otras features") la marca "Baja relevancia MVP, Joao validó: orgánico, no central". Mantener el componente pero sacar del bottom nav / home destacado. |
| **`/adoption` como feature de primera línea** | `src/App.tsx:106` | ESTRATEGIA §4 la marca "Media (viral)". No compite con el core. Mantenerla pero no invertir tiempo de dev. |
| **`Feed` social como pilar** | `src/pages/Feed.tsx` | Relevancia "Media (retention)" en ESTRATEGIA §4. El usuario chileno ya tiene Instagram. No escalar; mantener para no romper. |

### 3.2. Rutas huérfanas o redundantes detectadas en AUDIT_2026_04_08 §1.1

- `/actividad` y `/feed` siguen existiendo en paralelo (`src/App.tsx:98-99`). QA video (CONTEXTO §3.3) flagó contradicción ya "resuelta" con titles diferenciados, pero **la pregunta real**: ¿justifica mantener dos feeds? Mi voto: **merge a uno solo** (`/feed` con filtro "Salud" vs "Social"). Ahorra mantenimiento.
- `/peluquero/perfil` + `/provider/profile-edit` (`src/App.tsx:112,133`): dos editores de perfil según rol. Si los campos divergen poco, unificar.

### 3.3. Simplificación de navegación

- **Bajar sidebar drawer a 4 grupos como máximo** (Salud / Servicios / Comunidad / Cuenta). Hoy hay mezcla (CONTEXTO §5.2.1).
- **BottomTabBar ya tiene 5 tabs correctas** tras commit `3a7f01b` (Inicio/Mascotas/Vets/Recordatorios/Perfil). Mantener — no tocar.

---

## 4. Pricing — análisis y recomendación

### B2C Premium

**Estado actual (inconsistente)**:
- `src/lib/plans.ts:47` → `$3.990/mes, $39.900/año`
- `CONTEXTO_2026_04_11.md:17` + memoria → `$2.990/mes, $24.990/año`
- `premium_plus` en código → `$6.990/mes` (no aparece en pitch)

**Referencias de mercado**:
- Netflix CL ~$5.500/mes, Spotify CL ~$5.490/mes (referencias públicas)
- CuidaPet: $27.000/consulta, $20.000/teleconsulta, $10.000 abono (COMPETENCIA §6)
- Petsy Smart: sin precio público (COMPETENCIA §5)

**Recomendación**:
1. **Matar `premium_plus`**. Un solo tier B2C. Menos decisión = más conversión.
2. **Alinear todo a $3.990/mes y $39.900/año** (ya en código). Sigue siendo menos que Netflix/Spotify y la mitad de una consulta CuidaPet.
3. **Trial de 14 días gratis** sin tarjeta (ESTRATEGIA §9 Riesgo 3). Grandfathering para primeros 500 users a $2.990 permanente — **diferenciador emocional + narrativa de lanzamiento**.
4. **Plan anual con descuento visible** (ya existe: $39.900 = 10 meses). Comunicar "ahorras 2 meses" en `/upgrade`.

### B2B Vets

**Estado actual** (`src/lib/plans.ts:177-278`):
- Gratis: $0, comisión 15%, 20 clientes, 10 bookings/mes
- Individual: $9.900/mes, comisión 12%, 100 clientes, 50 bookings/mes
- Clínica Básica: $29.900/mes, comisión 10%, 500 clientes, bookings ilimitados
- Clínica Pro: $59.900/mes, comisión 8%, clientes ilimitados, multi-sucursal

**Referencias**:
- QVET, VetPraxis, GVET, Milovet: **sin precio público** (COMPETENCIA §1-4). Fricción enterprise.
- WhatsApp/Instagram: **$0 + 0% comisión** — el competidor real (COMPETENCIA §11).

**Recomendación**:

1. **Quitar comisión del plan Clínica Pro ($59.900)** → `commissionRate: 0`. Justificación: el upgrade de Básica a Pro hoy solo da multi-sucursal + analytics avanzado + API. Por $30.000 más, el vet grande quiere **reglas claras sin surprise fees**. Es el plan enterprise, debe sentirse premium de verdad.
2. **Bajar comisión Gratis de 15% → 10%**. 15% es castigo; parece un mensaje "pagá o sufrí". 10% es competitivo con cualquier marketplace y sigue creando incentivo al upgrade sin ser hostil.
3. **Crear plan Gratis REAL** como "WhatsApp con memoria" (ESTRATEGIA §competencia Instagram): perfil público + directorio + ficha + 1 vet + 10 bookings/mes + recordatorios WhatsApp. Sin comisión en los primeros 5 bookings del mes. **Ese es el ataque a Instagram/WhatsApp**.
4. **Mantener $9.900 / $29.900** — competitivos vs el "no publican precio" de QVET/VetPraxis y accesibles para clínica chica RM.
5. **Alinear el guión de pitch con comisiones reales** (ya flagueado en commit `9efa391` del log). WALKTHROUGH §Walk 2 paso 4 lo confirma.

### Comisiones — análisis específico

El walkthrough señala la inconsistencia "pitch sin comisiones" vs producto con comisiones. El commit `9efa391` dice que ya se alineó. La pregunta estratégica restante: **¿las comisiones son competitivas?**

- **vs Petsy/CuidaPet**: no publican comisiones, pero sus modelos son servicio propio (no marketplace) → no es comparable 1:1.
- **vs QVET**: QVET es licencia SaaS sin comisión por booking. Un vet mediano/grande ve "comisión por booking" como impuesto.
- **vs WhatsApp**: comisión 0%. El vet chico que hoy usa WhatsApp no migra si la comisión le come el margen de la primera consulta.

**Veredicto**: las comisiones son defensibles en los tiers bajos donde el valor del marketplace (leads nuevos) justifica el cost. Pero **no deben existir en Pro** porque ese cliente ya tiene leads propios y paga por el software. Propuesta final:

| Plan | Fee mensual | Comisión | Racional |
|---|---|---|---|
| Gratis | $0 | **10%** (de 15%) | Menos hostil, upgrade no forzado |
| Individual | $9.900 | 12% | Mantener |
| Clínica Básica | $29.900 | 10% | Mantener |
| Clínica Pro | $59.900 | **0%** (de 8%) | Diferenciador real del upgrade |

---

## 5. Roadmap concreto 30/60/90 días

### 30 días — defensa del moat

1. **Cargar 50 precios reales en `vet_service_prices`** — sin esto `/precios-veterinarios` (commit `33a97b8`) queda vacía y el diferenciador #4 de ESTRATEGIA §Anexo B es humo. Tarea mixta: seed manual con precios referenciales públicos + outreach a 5 vets piloto para que carguen los suyos.
2. **Activar WhatsApp Cloud API** (acción dueño: completar Meta Business verification; acción dev: setear secrets + cron). Desbloquea ESTRATEGIA §5.1.
3. **Alinear precio Premium B2C a $3.990** en TODOS los lugares (código, copy, landing, memoria, CONTEXTO). Decisión requerida del dueño.
4. **Matar `premium_plus`** de `src/lib/plans.ts` y su UI en `Upgrade.tsx`.
5. **QR en ficha clínica** + botón descargar QR en tab Compartir.

### 60 días — captación B2B

1. **Editor de ficha desde lado vet** (mínimo viable) — habilita Hipótesis 2 de ESTRATEGIA.
2. **Stats de negocio** en ProviderDashboard (revenue/no-shows/retención).
3. **Plantillas post-consulta** con campo obligatorio "alternativas discutidas".
4. **Outbound a 50 clínicas chicas RM** — el mercado total de clínicas pequeñas chilenas está desatendido (COMPETENCIA §1 sobre QVET enfocado a grandes). Script: "5 minutos de onboarding, pricing CLP publicado, soporte chileno".
5. **Landing específica por comuna** (`/veterinarios/comuna/ñuñoa` etc.) con precio promedio, # de vets, especialidades → SEO long-tail que ni Petsy ni QVET van a poder clonar rápido.

### 90 días — diferenciación vs QVET

1. **Importar carnet papel vía OCR** — cero competencia, onboarding 10x.
2. **Bot FAQ para clínica** — ataca dolor vet #2.
3. **Checklist Grimace** — percepción de valor altísima, costo bajo.
4. **Push notifications nativas** + app publicada en Play Store (hoy solo web responsive según CONTEXTO §1).
5. **Case study público con 3 clínicas piloto** (# bookings, horas ahorradas, revenue generado) — contenido defensivo + SEO.

---

## 6. Riesgos que NO podés ignorar

| Riesgo | Probabilidad | Impacto | Mitigación concreta |
|---|---|---|---|
| **Petsy publica un directorio público SEO de vets** | Media (18 meses) | Alta — mata el moat #1 | Acelerar contenido SEO (50 comunas × long-tail) en 60 días. Registrar slugs antes de que suban. |
| **QVET lanza comercialización directa en Chile** | Baja-Media (24 meses) | Muy alta B2B | Llegar a 200 clínicas chicas chilenas antes, con onboarding <5 min y pricing CLP publicado (ya tenés la ventaja, falta ejecutar). |
| **Meta no aprueba el template de WhatsApp** | Media | Bloquea feature crítica | Plan B: fallback a `wa.me` directo desde el cliente (commit `1e63e08` ya lo hace para share). Recordatorios sin template de Meta se hacen en `wa.me` click-to-chat con texto pre-armado. No es push real pero desbloquea. |
| **Conversión Premium B2C <2%** (ESTRATEGIA §9 Riesgo 3) | Media | Alta — obliga pivot B2B | Plan B: pivotar 100% a B2B en mes 6. Mientras, trial 14 días sin tarjeta + grandfathering. |
| **Data de `vet_service_prices` queda escasa** | **Alta** (es acción manual) | Mata diferenciador #4 | Seed hardcoded con 10 servicios × 15 comunas × precio referencial público (consumer.es, posts foros). No esperar a que los vets carguen. |
| **Contradicción de precios Premium entre código/docs** (ya presente) | Certeza | Pierde confianza en pitch | Fix en 2h. Ya listado en quick wins. |
| **Inconsistencia comisiones pitch vs producto** | Presente | Pierde confianza vet | Ya resuelto en commit `9efa391` — validar que realmente el guión y la página dicen lo mismo. |
| **SEO indexa rutas legacy `/dog-walkers` etc** | Baja | Media | 301 en servidor por 90 días, luego 404. |
| **RLS roto o FK rota en prod** | Baja-Media | Alta | Iniciativa A de CONTEXTO §5.1 (backend hardening). Ejecutar antes del push a 50 clínicas. |

---

## 7. Métricas que tenés que empezar a medir hoy

| KPI | Cómo medirlo | Meta 30 días |
|---|---|---|
| Users registrados reales (no demo) | `select count(*) from auth.users where email not like '%@demo.pawfriend.cl'` | 50 |
| Mascotas activas | `select count(*) from pets where owner_id in (users reales)` | 80 |
| Recordatorios activos | `select count(*) from pet_reminders where due_date > now()` | 100 |
| Fichas compartidas vía token | `select count(*) from medical_share_tokens` | 15 |
| Conversión Premium | `profiles where is_premium=true and not is_grandfathered` / total users reales | ≥2% |
| Vets reales en directorio | `service_providers where is_demo=false` | 10 |
| Precios cargados | `select count(*) from vet_service_prices` | 50 |
| Comunas con ≥5 precios | `select comuna, count(*) ... group by comuna having count(*) >= 5` | 3 |
| Bookings B2B reales | `vet_bookings where provider not demo and created_at > 30 days` | 20 |
| % bookings con ficha compartida previa | custom query join | 20% |

**Dónde vivirá este dashboard**: no crear `/admin/metrics` todavía — usar Supabase Studio SQL snippets guardados. Cuando llegues a 50 users reales, crear una página simple en `/admin` (ya existe ruta) con estas queries hardcoded.

---

## 8. Cosas que el competidor hace mejor que vos

### Petsy Chile

- **App iOS publicada en App Store** (COMPETENCIA §5). Vos tenés Capacitor compilable pero no publicado (CONTEXTO §1).
  - **¿Igualar?** Sí, en 90 días. Publicar en Play Store (Android primero, menos fricción regulatoria) y luego App Store.
- **Marketplace de servicios a domicilio** integrado. Vos tenés directorio + reservas en clínica.
  - **¿Igualar?** **No**. Modelo distinto. Tu ventaja es "clínica establecida con ficha clínica persistente". El "a domicilio" es terreno de Petsy y CuidaPet. No competir ahí.
- **Membresía "Petsy Smart"** sin precio visible (posible beneficio descuentos).
  - **¿Igualar?** Parcialmente. Premium B2C debe tener beneficios visibles en reservas (ej: sin fee, prioridad, descuentos en clínicas partner).

### CuidaPet

- **Precios publicados transparentemente** ($27.000 consulta, $20.000 tele, $10.000 abono) (COMPETENCIA §6).
  - **¿Igualar?** **Sí, mejorarlo**: tu estimador por comuna ES la versión superior. Ejecutarlo (30 días acción #1).
- **Cobertura geográfica 8 ciudades** (Santiago, Valpo, Viña, Concón, Coquimbo, La Serena, Antofa, Concepción).
  - **¿Igualar?** Sí pero en 90 días. Tu directorio puede crecer sin logística física — ventaja estructural. Outreach a 5 vets por ciudad fuera RM.

### QVET

- **30 años en mercado, 8.000 clientes declarados, PMS robusto** (COMPETENCIA §1).
  - **¿Igualar?** **No, evitar.** Compiten en hospitales/cadenas. Vos jugás en clínicas chicas con onboarding rápido. Ejecutar antes de que prioricen Chile.
- **App `LaClinica` complementaria para dueños** (500k descargas declaradas).
  - **¿Igualar?** No directamente. Tu app B2C ya existe y es más rica (ficha + estimador + directorio SEO). Cuidado: si QVET decide empujar `LaClinica` en Chile comercialmente, tenés ~18 meses (COMPETENCIA §"Veredicto QVET").

### Instagram/WhatsApp (el competidor real)

- **Cero fricción, cero costo, conversación natural** (COMPETENCIA §11).
  - **¿Igualar?** **Sí, con el plan Gratis B2B** rediseñado como "WhatsApp con memoria". Es la recomendación #3 de §4.

---

## 9. Quick wins inmediatos (esta semana)

Todos son baja fricción, alto impacto, ejecutables por dev o dueño en horas:

1. **Alinear precio Premium B2C** — pick one: $2.990 o $3.990. Actualizar `src/lib/plans.ts:47`, `src/pages/Upgrade.tsx`, `src/pages/Index.tsx`, `CONTEXTO_2026_04_11.md`, memoria. Grep final: `2990` debe devolver 0 matches fuera del changelog. **Decisión dueño**. [S, 1-2h]
2. **Matar `premium_plus`** de `src/lib/plans.ts:64-85` + UI en `Upgrade.tsx`. [S, 1h]
3. **Mover precio Premium al Hero de Index.tsx** con "Desde $3.990/mes, cancela cuando quieras". Hoy el Hero no lo muestra (landing nueva del commit `7487849`). [S, 30min]
4. **Agregar OG image** para compartir en WhatsApp/Instagram. Hoy falta, `public/og-image.png` debería existir. [S, 30min + asset]
5. **Cambiar copy del plan Gratis B2B** a "WhatsApp con memoria: perfil público, ficha clínica, 10 bookings/mes, sin costo". Hoy se siente como "plan castigo". [S, 30min]
6. **Quitar `/places` redirect** de `src/App.tsx:100` si no hay links externos apuntando. [S, 5min]
7. **Verificar que commit `9efa391` realmente alineó pitch y planes** en `src/pages/ParaVeterinarios.tsx:74-75` con la recomendación de §4 (si bajás Gratis a 10% y Pro a 0%, hay que re-editar). [S, 30min]
8. **Seed hardcoded de precios referenciales** en migración: 10 servicios (consulta, vacuna séxtuple, esterilización, desparasitación, limpieza dental, radiografía, ecografía, hospitalización/día, grooming, corte uñas) × 5 comunas RM (Providencia, Las Condes, Ñuñoa, Maipú, La Florida) = 50 filas. Referencia: encuestas Cadem/SUBDERE + consumer.es. [M, 4-6h + research]
9. **Badge "primeros 500 users gratis para siempre al precio viejo"** en `/upgrade` — narrativa de lanzamiento. Implementable con flag `is_grandfathered` que ya existe en `profiles`. [S, 2h]
10. **Footer con `Hecho en Chile, para Chile, con Flow`** — trust + diferenciación vs vendors extranjeros (QVET/VetPraxis). Visible en Index + ParaVeterinarios. [S, 15min]

---

## Notas finales

- **Contradicciones flageadas** que requieren decisión del dueño antes de ejecutar:
  1. Premium B2C: $2.990 vs $3.990 (plans.ts dice uno, CONTEXTO y memoria dicen otro).
  2. `premium_plus` existe en código pero no en pitch — eliminar o relanzar.
  3. Comisión Clínica Pro: mantener 8% o bajar a 0% como argumento de upgrade.
- **Lo que el dev puede ejecutar sin pedir permiso**: quick wins 2, 4, 6, 7, 8 y roadmap 30-días #1 (seed de precios) y #4 (kill premium_plus).
- **Lo que requiere acción del dueño** (no dev): roadmap 30-días #2 (WhatsApp Meta verification), alineación de precio (#1/#3), outbound a clínicas (roadmap 60 #4).

*Documento generado 2026-04-08 cruzando COMPETENCIA_2026_04_08, ESTRATEGIA_MVP_2026, CONTEXTO_2026_04_11, AUDIT_2026_04_08, WALKTHROUGH_2026_04_08, `src/lib/plans.ts`, `src/App.tsx`, `src/pages/Upgrade.tsx`, `src/pages/ParaVeterinarios.tsx` y `git log -40`. No se modificó código.*
