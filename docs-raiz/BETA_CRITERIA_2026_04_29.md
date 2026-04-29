# Paw Friend — Beta Criteria & Programa (2026-04-29)

> Fase 8 del [pawfriend-prompt-v5.md](../pawfriend-prompt-v5.md).
> Genera la rúbrica para pasar de beta cerrada → lanzamiento público (1 junio 2026).

---

## 1. Audiencia beta cerrada (4-6 semanas pre-launch)

| Segmento | Cantidad mínima | Estado actual | Acción pendiente |
|---|---|---|---|
| **Veterinarios independientes** | 5-10 | [Sofia](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_sofia_vet_beta_tester.md) (1) confirmada | Reclutar 4-9 más vía Colegio Médico Veterinario CL + grupos FB |
| **Clínicas medianas/grandes** | 1-2 | 0 confirmadas | Pitch directo Pedro a 5-10 prospects vía LinkedIn |
| **Refugios / hogares de adopción** | 3-5 | 13 contactados (outreach 2026-04-27) | Esperar respuestas, hacer follow-up DM Instagram |
| **Tutores de mascotas (dueños)** | 30-50 | [Palo](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_feedback_palo_2026_04_16.md) (1) confirmada | Outreach grupos FB pet Chile + Paw Voices red |

---

## 2. Métricas de éxito beta (no vanity)

### 2.1 Activación (medir semana 1)

- **Onboarding completion rate**: % de signups que completan onboarding minimal (4 campos) y suben 1 mascota. **Target ≥ 70%**.
- **First valuable action**: % que llega a uno de:
  - Crear ficha clínica con ≥ 1 dato (vacuna, peso, antiparasitario)
  - Activar Paw Shield (si aplica)
  - Configurar 1 recordatorio
  - **Target ≥ 60% de los que completan onboarding**.

### 2.2 Retención (medir semana 2 y 4)

- **W2 retention**: % de users que abren la app en semana 2. **Target ≥ 40%** (el dueño promedio chileno abre 4 veces al año, así que esta métrica es agresiva y bondadosa).
- **W4 retention**: **Target ≥ 25%**. Si se cae a < 15% → señal de que el producto no engancha lo suficiente.

### 2.3 Conversión paywall (Opción 3)

- **Free → Paw Member**: target conservador 5%, base 10%, optimista 15% durante beta. Real puede ajustar tras 1 mes de datos.
- **Free → Manada**: target 0.5-1% durante beta (segmento nicho).
- **Tiempo a primera conversión**: target mediana ≤ 7 días desde signup.

### 2.4 Calidad cualitativa

- **NPS estilo simple**: 1 pregunta semanal "¿Recomendarías Paw Friend a otro dueño? 0-10". **Target NPS ≥ 30** (alto pero alcanzable para producto B2C beta chileno).
- **Bug rate**: bugs reportados por user activo en beta. **Target ≤ 1 bug crítico/user/semana**.
- **Feature requests** (categorizar): cuántos pidieron cosas que no están vs cosas que están y no encontraron.

### 2.5 Uso real Paw Shield (Petify)

(Solo si Pedro flipea `PAW_SHIELD_PETIFY=true` con API PROD)

- **Activación**: % de Paw Member/Manada que activan Paw Shield. Target 30%+.
- **Match success rate** en `/nose-scan`: % de scans que devuelven match correcto vs falso positivo. Target ≥ 90% sobre la base que ya tenemos enrolled.
- **Tiempo medio enrollment**: target ≤ 2 minutos (3 fotos del hocico).

---

## 3. Ciclos de feedback

### 3.1 Canales

| Canal | Frecuencia | Audiencia |
|---|---|---|
| Grupo WhatsApp / Telegram beta | Real-time | Beta testers (cohorte completa) |
| Form semanal in-app | Domingos | Cohorte completa, 3 preguntas máx |
| Entrevistas profundas 1-on-1 | 2/semana | Rotativo, vet + tutor + refugio |
| Email digest founder semanal | Lunes | Cohorte: bugs fixeados, features nuevas, métricas |

### 3.2 SLA respuesta a beta testers

- Bugs críticos: respuesta < 2h, fix < 24h.
- Bugs no críticos: respuesta < 24h.
- Feature requests: respuesta < 48h con "Sí, en roadmap" / "No, fuera de scope" / "Vamos a evaluarlo".

---

## 4. Criterios formales: beta cerrada → lanzamiento público

**Todas estas condiciones deben cumplirse para soltar al público el 1 junio 2026**:

### 4.1 Producto — bloqueantes

- [ ] **0 bugs críticos** en flujos críticos (auth, signup, ficha clínica, recordatorios, calendario, paywall checkout Flow).
- [ ] **6 flujos críticos pasan E2E test** sin errores:
  1. Onboarding tutor (signup → primera mascota → primer recordatorio)
  2. Onboarding vet (signup → perfil → disponibilidad)
  3. Paw Shield enrollment (si activo) y `/nose-scan` con match
  4. Suscripción Paw Member o Manada via Flow.cl + activación de features
  5. Recuperación de mascota perdida (QR + ficha pública)
  6. Ficha clínica (creación, edición, share con vet, RLS por dueño)
- [ ] **Lighthouse ≥ 90** performance + accesibilidad en top 5 páginas.
- [ ] **Bundle inicial < 500 KB gzipped**.
- [ ] **0 placeholders visibles a usuarios reales**. Seed con datos chilenos.

### 4.2 Negocio — bloqueantes

- [ ] **Conversión Free → Paw Member ≥ 5%** durante beta.
- [ ] **W4 retention ≥ 25%**.
- [ ] **NPS ≥ 30**.
- [ ] **Pricing validado con beta**: si feedback dice "muy caro" o "muy barato", iterar antes de launch.

### 4.3 Compliance — bloqueantes

- [ ] **T&C + Política de privacidad** revisados por abogado chileno (ver Fase 5 Legal).
- [ ] **Ley 21.719 + 19.628** compliance verificado.
- [ ] **API Petify PROD operativa** si flag `PAW_SHIELD_PETIFY=true` (sino mantener flag false).
- [ ] **Cuenta Flow.cl migrada a SpA** (riesgo fiscal pendiente).

### 4.4 Operacional — bloqueantes

- [ ] **Cron pg_cron del Manada Fondo** registrado y testeado (cierre mensual del pool).
- [ ] **Edge fn `flow-create-subscription`** acepta `plan_type='paw_manada'`.
- [ ] **Edge fn `flow-webhook`** inserta correctamente en `manada_aportes_log`.
- [ ] **AdminManadaFondo panel** (mínimo: query SQL manual) que permita ver pool pendiente y procesar transferencia bancaria.

---

## 5. Plan comunicación post-launch

### 5.1 Email lanzamiento (1 junio 2026)

A toda la cohorte beta + waitlist (si lográs construir una pre-launch):
- Subject: "Paw Friend está abierto · gracias por probar con nosotros"
- Body: thank you, qué cambió desde su último feedback, link a app, descuentos exclusivos beta tester (ej: 1 mes Paw Member gratis).

### 5.2 Captura testimonios

Antes del launch, capturar **3-5 testimonios escritos** + **1-2 video cortos** de beta testers que aceptaron uso comercial. Para usar en:
- Landing post-launch (sección "Lo que dicen los que ya lo prueban")
- Pitch decks (CORFO, Start-Up, Angels)
- Email outreach a futuros B2B partners

### 5.3 Press kit Chile

- Comunicado breve a 3-5 medios pet/tech CL: La Tercera (sección Lifestyle), El Mercurio (sección Innovación), Diario Financiero (sección Startups), Pisapapeles, FayerWayer.
- Asset pack: logos, screenshots producto, founder story, cifras tracción beta.

---

## 6. Timeline realista 4-6 semanas pre-launch

| Semana | Foco | Hitos |
|---|---|---|
| **-6 (mid mayo)** | Cerrar reclutamiento beta | 5+ vets + 2+ refugios + 30+ tutores en cohorte |
| **-5** | Onboarding masivo cohorte | Welcome email, grupo WhatsApp/Telegram, primer feedback |
| **-4 a -3** | Iterar sobre feedback inicial | Fix bugs críticos, ajustar copy, validar paywall |
| **-2** | Estabilizar | 0 bugs críticos, métricas conversión + retention midiendo |
| **-1** | Pre-launch | Captura testimonios, press kit, landing waitlist abierta |
| **0 (1 junio 2026)** | LAUNCH | Email cohorte + redes + comunicado prensa |
| **+1 a +4** | Monitor + iterar | Métricas diarias en admin, hot fixes inmediatos |

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cohorte beta muy pequeña (< 30 tutores) | Aceptar y ajustar: foco en cualitativo profundo > cuantitativo amplio |
| Conversión paywall < 5% durante beta | Iterar pricing (¿bajar a $2.990?) o features split (¿agregar más al free?) |
| Bugs críticos día 0 launch | Tener rollback plan: feature flag para desactivar paywall si quema |
| Petify no listo para 1 junio | Lanzar sin Paw Shield activo. Free + Paw Member básico (sin biometría). Activar después |
| Vets beta no recomiendan | Iterar onboarding vet, ajustar copy, validar valor con entrevistas |

---

## 8. Próximos pasos para Pedro

1. **Esta semana** (29 abril - 5 mayo): completar cohorte beta tutores (target 30-50). Outreach grupos FB pet CL + Paw Voices.
2. **Semana 2** (6-12 mayo): consolidar onboarding cohorte beta + grupo WhatsApp/Telegram activo.
3. **Semana 3-4** (13-26 mayo): iteración rápida sobre feedback. Fix top 5 bugs.
4. **Semana 5-6** (27 mayo - 1 junio): preparación launch + checklist sección 4.

**No hay otro entregable formal de Fase 8 hasta que la cohorte real esté armada y midiendo.**
