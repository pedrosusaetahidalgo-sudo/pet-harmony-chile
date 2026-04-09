# Estrategia MVP Paw Friend — análisis pain points + checklist de cobertura

> Documento base derivado de la investigación de mercado de pain points en el sector veterinario chileno y LATAM (sesión 2026-04-09). Sirve como referencia para priorizar features, posicionamiento y conversaciones con vets/inversores.

---

## TL;DR

- **Mercado validado**: USD 1.942M en Chile (2023) → USD 3.254M (2032). 86% de chilenos tiene mascota.
- **Dolor #1 dueños**: costo y opacidad de precios. 52% saltó atención por costo (EEUU); en Chile 80% no tiene salud al día (Vetivery).
- **Dolor #1 vets**: carga administrativa + burnout. 67% reporta burnout, 30-40% del día en data entry. En Chile 70% dificultades de organización/comunicación.
- **Recomendación**: empezar B2C (dueños) con la "ficha médica que nunca se pierde", construir desde día 1 pensando en integración con vet (Hipótesis 3).
- **Posicionamiento sugerido**: *"la ficha médica de tu mascota que nunca se pierde y te avisa antes de que duela el bolsillo"*.

---

## 1. Datos clave del mercado

### Chile (validado con fuentes locales)
| Métrica | Valor | Fuente |
|---|---|---|
| Mercado pet care | USD 1.942M (2023) → 3.254M (2032), CAGR 5.9% | — |
| Mascotas con dueño | 12.482.679 perros + gatos | — |
| Mascotas sin supervisión | 4.049.277 | — |
| Hogares con mascota | 86% | Cadem |
| Gasto mensual alimentación | ~$41.000 | Cadem |
| Gasto mensual veterinaria | $30.023 promedio (54% entre $10k-$30k) | — |
| Gasto pet ABC1 mensual | $81.490 | — |
| Gasto pet C2 mensual | $43.780 | — |
| Crecimiento clínicas vet RM | +22% en strip centers (2025) | GPS Property |
| **Dueños sin salud al día** | **80%** | **Vetivery (sep 2024)** |
| **Vets con dificultades organización/comunicación** | **70%** | **Vetivery** |
| Calendario vacunas no actualizado | 55% | SUBDERE/UC |
| Mascotas sin registro formal | 60% | SUBDERE/UC |
| Mascotas con microchip | solo 27.4% | SUBDERE/UC |
| Va al vet ≥1/año | 65% | SUBDERE/UC |
| Automedica con antibióticos humanos | 3.1% | SUBDERE/UC |

### EEUU (extrapolable, fuentes con mayor rigor)
| Métrica | Valor | Fuente |
|---|---|---|
| Saltó atención vet último año | 52% | PetSmart-Gallup 2024-2025 |
| Visitó vet pero rechazó recomendación | 37% | PetSmart-Gallup |
| No llevó mascota al vet | 15% | PetSmart-Gallup |
| Cita costo como factor | 71% | PetSmart-Gallup |
| Costos vet subieron desde 2014 | +60% | PetSmart-Gallup |
| Techo de pago tratamiento vital | USD 1.000 (66%) ≈ $950k CLP | PetSmart-Gallup |
| Duplica capacidad pago si hay cuotas sin interés | 64% | PetSmart-Gallup |
| **Rechazó atención sin recibir alternativa más barata** | **73%** | **PetSmart-Gallup** |
| **Vets que dicen "siempre ofrezco alternativa"** | **81%** | **PetSmart-Gallup** |
| Vets con burnout | 67% | Merck-AVMA Wellbeing 2024 |
| Vets reportando exhaustión alta | >60% | Merck-AVMA |
| % del día en data entry | 30-40% | Digitail |

**Gap clave**: 81% vets dicen ofrecer alternativa vs 73% dueños dicen no haber recibido nada. Es problema de **comunicación estructurada**, no de mala voluntad.

---

## 2. Pain points priorizados

### Dueños (B2C)
| # | Dolor | Severidad | Cubierto hoy en Paw Friend |
|---|---|---|---|
| 1 | Costo + opacidad de precios | 🔴 alto | 🟡 parcial (ver §4) |
| 2 | Olvido de citas y tratamientos | 🔴 alto | 🟢 sí |
| 3 | No interpreta señales de dolor/deterioro | 🟠 medio-alto | ❌ no |
| 4 | Historial clínico disperso | 🔴 alto | 🟢 sí (joya de la corona) |
| 5 | Adherencia a tratamientos crónicos | 🟠 medio | 🟡 parcial |
| 6 | Acceso y proximidad geográfica | 🟠 medio | 🟢 sí (directorio + maps) |

### Veterinarios (B2B)
| # | Dolor | Severidad | Cubierto hoy en Paw Friend |
|---|---|---|---|
| 1 | Carga administrativa duplicada | 🔴 alto | ❌ no |
| 2 | Llamados telefónicos rutinarios | 🔴 alto | ❌ no |
| 3 | Comunicación post-consulta y seguimiento | 🟠 medio-alto | 🟡 parcial (compartir ficha) |
| 4 | Conversaciones difíciles sobre costo | 🟠 medio-alto | ❌ no |
| 5 | Retención y no-shows | 🟠 medio | 🟡 parcial (recordatorios) |
| 6 | Burnout emocional (eutanasia financiera) | 🔴 alto | ❌ no abordable directamente |

---

## 3. Diferencias entre segmentos (decisión go-to-market)

| Dimensión | Dueños B2C | Vets B2B |
|---|---|---|
| Naturaleza del dolor | Episódica, emocional, financiera | Continua, operativa, crónica |
| Disposición a pagar | Baja directa, alta si evita costo futuro | Alta si hay ROI claro en horas |
| Velocidad de decisión | 1-3 días, impulso | 2-4 semanas, evaluación |
| Ticket potencial CLP | $2.000-$8.000/mes | $40.000-$150.000/mes |
| Costo de adquisición | Bajo (orgánico, viral) | Alto (ventas directas) |
| Churn esperado | Alto (15-25% mensual) | Bajo (2-5% mensual) |
| Referibilidad | 1 a 1 | 1 clínica = 500-2.000 dueños |
| Regulación | Mínima | Ley 21.020, IVA, datos médicos |
| Saturación competitiva CL | Alta (Vetivery, Dogo, etc.) | Baja (legacy: ezyVet, Provet) |

**Lectura**: el dueño paga si le ahorras plata; el vet paga si le ahorras horas.

---

## 4. CHECKLIST — qué cubre Paw Friend HOY vs lo que falta

Esta sección compara el estado actual del repo con cada oportunidad propuesta en la investigación.

### ✅ Hipótesis 1 — "El bolsillo preparado" (B2C, dueños)

#### 4.1. Ficha clínica portable y verificable
- [x] **Modelo de datos**: tabla `pets` + `medical_records` + `medical_documents` + `vaccinations` ✅
- [x] **UI ficha clínica**: `src/pages/PetClinicalRecord/` con 5 tabs (Resumen, Historial, Habitos, Documentos, Compartir) ✅
- [x] **Exportación PDF**: edge function `generate-medical-summary` deployada, español chileno ✅
- [x] **Exportación ZIP de documentos**: edge function `generate-medical-zip` con JSZip real ✅
- [x] **Compartir con vet via link temporal**: `medical_share_tokens` + tab Compartir ✅
- [ ] **QR code en la ficha** para que vet escanee → falta
- [ ] **Verificación de identidad de mascota** (microchip + foto + dueño confirmado) → parcial, falta enforcement
- [ ] **Importar carnet papel via foto + OCR** → falta
- **COBERTURA: 70%**

#### 4.2. Recordatorios multi-canal inteligentes
- [x] **Tabla `pet_reminders`** con tipos vacuna/checkup/medication/grooming ✅
- [x] **UI agregar recordatorio** desde ficha clínica ✅
- [x] **Hook `useReminders`** + listado en Home ✅
- [ ] **Push notifications nativas** (Capacitor FCM) → falta
- [ ] **Recordatorios por WhatsApp** (canal #1 en Chile) → falta, crítico
- [ ] **Recordatorios por email** → falta
- [ ] **Escalamiento si no responde** (3 días sin abrir = WhatsApp, 5 días = email) → falta
- [ ] **Confirmación de lectura** → falta
- **COBERTURA: 40%**

#### 4.3. Estimador de costos veterinarios por tratamiento/comuna
- [ ] **Tabla de precios referenciales por procedimiento + comuna** → ❌ no existe
- [ ] **UI "¿cuánto cuesta…?"** → ❌ no existe
- [ ] **Comparador entre clínicas del directorio** → ❌ no existe
- [ ] **Educación: vocabulario para preguntar alternativas** → ❌ no existe
- **COBERTURA: 0% — DIFERENCIADOR ÚNICO NO IMPLEMENTADO**

#### 4.4. Checklist visual de señales de dolor/deterioro
- [ ] **Módulo "¿cómo está tu mascota hoy?"** con escalas Grimace gato/perro → ❌ no existe
- [ ] **Educación con fotos de posturas de dolor** → ❌ no existe
- [ ] **Trigger "consultar al vet"** si el score cae → ❌ no existe
- [x] **AI assistant `pet-assistant`** ya responde preguntas en contexto ✅ (cubre parcialmente)
- **COBERTURA: 15%**

### 🟡 Hipótesis 2 — "El vet sin papeles" (B2B, clínicas)

#### 4.5. Portal para clínica veterinaria
- [x] **Tabla `service_providers`** con vets, geolocalización, status, rating ✅
- [x] **Tabla `vet_bookings`** con flujo pendiente/confirmado/completado ✅
- [x] **Tabla `vet_reviews`** con rating 1-5 + comentario ✅
- [x] **Página `ProviderDashboard`** básica ✅
- [x] **Página `RegistroVeterinario`** + flujo de onboarding ✅
- [x] **Plan B2B con pricing** ($9.900 / $29.900 / $59.900) ✅ definido
- [ ] **Editor de ficha médica desde el lado del vet** → ❌ falta
- [ ] **Plantillas de tratamientos comunes** (vacunación, esterilización, etc.) → ❌ falta
- [ ] **Inbox de mensajes de pacientes** consolidado → ❌ falta
- [ ] **Stats del negocio** (revenue, no-shows, retention) → ❌ falta
- [ ] **Calendario integrado** con disponibilidad real → 🟡 parcial
- [ ] **Cobro integrado** (Flow para B2C ya está; falta para B2B) → ❌ falta
- **COBERTURA: 35%**

#### 4.6. Reducción de llamados telefónicos rutinarios
- [x] **Chat in-app** entre dueño y vet (`Chat.tsx`, `ChatConversation.tsx`) ✅
- [x] **Reservas online** sin teléfono ✅
- [ ] **Bot FAQ** para preguntas tipo "¿están abiertos hoy?" → ❌ falta
- [ ] **Confirmación automática de turno** → 🟡 parcial
- **COBERTURA: 50%**

### 🟠 Hipótesis 3 — "El traductor vet-dueño" (cubre los 2 lados)

#### 4.7. Resumen post-consulta digerible
- [x] **AI assistant `pet-assistant`** puede generar contenido en contexto ✅
- [x] **Compartir ficha con vet** (link temporal) ✅
- [ ] **Plantillas de "qué hicimos hoy"** que el vet selecciona en 30 segundos → ❌ falta
- [ ] **Generación automática de instrucciones para el dueño** desde el dictado del vet → ❌ falta
- [ ] **Campo obligatorio "alternativas discutidas"** → ❌ falta (cubriría el gap 81/73)
- [ ] **Próxima cita sugerida automática** → ❌ falta
- [ ] **Señales de alarma específicas del tratamiento** → ❌ falta
- **COBERTURA: 20%**

### Otras features de la app (bonus)

| Feature | Estado | Relevancia para MVP |
|---|---|---|
| Premium B2C con Flow | ✅ Vivo | Crítica (monetización) |
| Directorio público de vets (SEO) | ✅ Vivo | Alta (adquisición orgánica) |
| Maps con mascotas perdidas + adopciones | ✅ Vivo | Media (engagement) |
| PawGame (gamification) | ✅ Vivo | Baja (Joao validó: orgánico, no central) |
| Feed social + posts + likes | ✅ Vivo | Media (retention) |
| Adopciones | ✅ Vivo | Media (viral) |
| Pet activities + cheers | ✅ Vivo | Baja (engagement) |
| Reportar mascota perdida | ✅ Vivo | Media (caso de uso emocional fuerte) |
| Switcher de mascotas con avatares | ✅ Vivo | Alta (UX) |
| Demo seed (100 users) | ✅ Vivo | Crítica (presentaciones) |

---

## 5. Mapa de prioridades — qué construir antes del demo

### 🔴 BLOQUEANTE PARA DEMO (próximas 2 semanas)
1. **Recordatorios por WhatsApp** — el canal #1 en Chile. Sin esto, los recordatorios in-app son invisibles.
2. **Estimador de costos por procedimiento/comuna** — diferenciador único que ningún competidor chileno tiene. Aunque sea con precios de referencia hardcoded.
3. **Plantillas post-consulta para vets** — input para Hipótesis 3, baja fricción para el vet.
4. **Push notifications nativas** (Capacitor + FCM) — para que la app no sea solo web.

### 🟠 ALTO IMPACTO (mes 1-2 post-demo)
5. **QR en la ficha clínica** — el vet escanea, ve el resumen, gana 30 segundos por consulta.
6. **Importar carnet papel via foto + OCR** — onboarding 10x más rápido para nuevos dueños.
7. **Editor de ficha desde el lado del vet** — habilita Hipótesis 2 (B2B).
8. **Checklist Grimace** para señales de dolor — costo casi cero, percepción de valor altísima.
9. **Bot FAQ para clínicas** — ataca el dolor #2 del vet (llamados rutinarios).

### 🟢 NICE TO HAVE (mes 3+)
10. Pagos en cuotas vía partnership (Khipu, Getnet)
11. Telemedicina (Vetivery ya lo hace, no es diferenciador)
12. Stats de negocio para el dashboard del vet
13. Inbox unificado de mensajes para vets
14. Adherencia asistida por IA (alerta si se pierden 3 dosis)

---

## 6. Recomendación de roadmap accionable

### Fase 1 — "El bolsillo preparado" (próximas 4 semanas)
**Objetivo**: validar B2C con 30-50 dueños reales pagando o dispuestos a pagar.

Construir:
- Recordatorios WhatsApp (Twilio o Meta API) ⭐
- Estimador de costos referencial por comuna ⭐
- Push notifications nativas
- QR exportable en ficha clínica

Métricas a tracking:
- % usuarios que activan recordatorios
- % usuarios que abren el estimador 2+ veces
- % usuarios que comparten ficha con vet
- Conversión a Premium

### Fase 2 — "El traductor vet-dueño" (mes 2-3)
**Objetivo**: cerrar 1-2 clínicas como design partners para diseñar el portal con ellas.

Construir:
- Editor de ficha desde lado vet (mínimo viable)
- Plantillas post-consulta + alternativas discutidas
- Notificación automática al dueño cuando el vet actualiza ficha

Métricas:
- Tiempo promedio del vet en escribir resumen
- % dueños que abren el resumen post-consulta
- Tasa de cumplimiento del campo "alternativas discutidas"

### Fase 3 — "El vet sin papeles" (mes 4-6)
**Objetivo**: vender plan B2B a las clínicas piloto + 5 más.

Construir:
- Plantillas de tratamientos comunes
- Inbox de mensajes
- Bot FAQ
- Stats de negocio
- Cobro integrado para B2B

---

## 7. Posicionamiento

### Frase corta (landing + ads)
> **"La ficha médica de tu mascota que nunca se pierde y te avisa antes de que duela el bolsillo."**

Por qué funciona:
- Ataca el dolor #1 (costo) y el dolor #4 (historial disperso) en una sola promesa
- "Nunca se pierde" → emocional, durable
- "Antes de que duela el bolsillo" → urgencia económica
- Es defensible: nadie en Chile lo dice así

### Frases secundarias por canal
- **Para vets en reunión**: *"Tus pacientes llegan con la ficha médica completa, sin papeles, en español, y vos ahorrás 5 minutos por consulta."*
- **Para inversores**: *"Atacamos el 80% de dueños chilenos sin salud al día con la ficha médica portable que reduce 30% los no-shows del vet."*
- **Para dueños en Instagram**: *"Olvidate de la libreta de vacunas. Todo en tu celular, gratis."*

---

## 8. Lo que NO conviene construir todavía

| Feature | Por qué NO | Cuándo sí |
|---|---|---|
| Telemedicina | Vetivery ya lo hace, requiere validación profesional | Después de 1.000 users activos |
| Pagos en cuotas (BNPL vet) | Riesgo financiero, regulación | Partnership en Fase 3 |
| Marketplace de productos pet | Distrae del core, low margin | Nunca o muy tarde |
| Red social pet (TikTok-like) | Saturado (Dogo, etc.) | Como side feature, no core |
| Sistema completo PIMS para clínica | Compite con ezyVet/Provet, ciclo venta lento | Después de 10 clínicas piloto |
| App separada para vets | Duplica esfuerzo, mejor portal web responsive | Solo si los vets lo piden 5+ veces |

---

## 9. Riesgos y contra-consideraciones

### Riesgo 1: Vetivery ya está atacando este mercado
- **Mitigación**: ellos son B2C también, pero más enfocados en telemedicina. Paw Friend puede ganar en el ángulo "ficha médica + costo + integración con vet".

### Riesgo 2: Solo founder construyendo 3 startups en paralelo (SYNAP + HOGAR + Paw Friend)
- **Mitigación**: B2C requiere menos go-to-market que B2B → Paw Friend puede correr en orgánico mientras vos te enfocás en SYNAP.
- **No hacer**: outbound a clínicas hasta validar B2C.

### Riesgo 3: Monetización B2C en Chile es dura ($3.990/mes puede ser alto para muchos)
- **Mitigación**: Premium con valor claro (multi-mascota + features pagas), grandfathering para early adopters, trial gratis si hace falta.
- **Plan B**: pivotar a B2B antes de 6 meses si la conversión Premium es <2%.

### Riesgo 4: El estimador de costos requiere data que no existe pública
- **Mitigación**: empezar con rangos de referencia hardcoded por comuna basados en el directorio que ya tenés. Crowdsourcing después.

---

## 10. Métricas para validar la estrategia (próximas 4 semanas)

| Métrica | Baseline | Meta semana 4 | Cómo medirlo |
|---|---|---|---|
| Users registrados (sin demo) | 0 | 50 | `count from auth.users where email not like '%@demo.pawfriend.cl'` |
| Mascotas creadas | 0 | 80 | `count from pets where owner_id in (select id from real users)` |
| Recordatorios activos | 0 | 100 | `count from pet_reminders where due_date > now()` |
| Fichas compartidas con vet | 0 | 10 | `count from medical_share_tokens` |
| Premium conversions | 0 | 3 | `count from profiles where is_premium and not is_grandfathered` |
| Estimador de costos abierto (cuando exista) | — | 30 | event tracking |
| Vets contactados | 0 | 5 | manual log |
| Vets en directorio (no demo) | 0 | 3 | `count from service_providers where is_demo=false` |

---

## 11. Acciones inmediatas (esta semana)

- [ ] Validar este documento con Joao (decisión de roadmap)
- [ ] Definir si Recordatorios WhatsApp vs Estimador de costos va primero (pick one)
- [ ] Escribir landing copy con la frase "ficha médica que nunca se pierde…"
- [ ] Identificar 3 clínicas amigas para conversaciones (no cierres todavía)
- [ ] Listar competidores chilenos directos (Vetivery, Vetapp, etc.) y comparar features

---

## Anexo A — Fuentes citadas

| Fuente | Año | Tipo | Relevancia |
|---|---|---|---|
| PetSmart Charities-Gallup Pet Health Care Study | 2024-2025 | Cuantitativo, n=2.498 dueños + 933 vets EEUU | Alta |
| Merck-AVMA Veterinary Wellbeing Study | 2024 | Cuantitativo, vets EEUU | Alta |
| Vetivery (plataforma chilena) | sep 2024 | Reporte interno (datos de mercado) | Media-alta |
| SUBDERE/Universidad Católica Chile | 2023 | Encuesta nacional | Alta |
| Cadem Chile | 2024 | Encuesta consumo | Alta |
| GPS Property | 2025 | Reporte inmobiliario clínicas vet | Media |
| Colegio Médico Veterinario de Chile | 2023 | Comunicado oficial IVA | Media |
| Digitail / PetDesk | 2024 | Reportes producto US | Media (extrapolación) |

---

## Anexo B — Diferenciador único de Paw Friend

De todas las features posibles, **3 cosas hacen única a Paw Friend** vs cualquier competidor chileno actual (al 2026-04-09):

1. **Ficha médica con PDF en español + ZIP de documentos** (joya de la corona) — ningún competidor exporta.
2. **Premium B2C con Flow nativo** — la mayoría usa Webpay que es más friccional.
3. **Directorio público de vets con SEO** — Vetivery tiene dashboard, no SEO público.

Lo que **falta para ser irreplicable**:

1. Estimador de costos por comuna
2. Integración bidireccional vet ↔ dueño (Hipótesis 3)
3. WhatsApp como canal de recordatorios

Si Paw Friend logra esos 3 en 8 semanas, **no hay competidor en Chile que lo pueda alcanzar en menos de 6 meses**.

---

*Documento generado 2026-04-09 como base estratégica. Revisar trimestralmente.*
