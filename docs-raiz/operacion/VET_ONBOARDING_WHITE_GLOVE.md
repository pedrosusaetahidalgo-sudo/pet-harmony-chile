# Playbook Onboarding Vet White-Glove

> Origen: INIT-09 del [Plan de Éxito 90 días](../planes/PLAN_EXITO_90D_20260420.md).
> Target: **3 vets pagando Premium** al día 90 (capacidad founder solo).
> Filosofía: los primeros 10 vets los onboardea Pedro **personalmente**. A partir del 11, la experiencia es self-serve.
> Tiempo por vet: ~90 min distribuidos en 3 sesiones (15 + 45 + 30 min).

---

## 1. Por qué white-glove al inicio

Un vet registrado que no agrega pacientes en 14 días **probablemente churna**. El funnel CRM típico de SaaS B2B: 15% de free → trial → pagando. Con white-glove, subimos a 35-50% porque:

1. Pedro soluciona fricción en vivo (OCR carnet, compartir ficha, agenda).
2. El vet se siente valorado (contacto directo con fundador).
3. Pedro aprende dónde está la fricción real (feedback loop rápido).
4. El vet se convierte en testimonial si tiene buena experiencia.

Los 10 primeros vets son **inversión de tiempo, no pérdida**. Cada llamada de 30 min puede valer $500k-$2M en LTV si convierte.

---

## 2. Flujo en 3 sesiones

### Sesión 1 — Bienvenida (15 min, Zoom/WhatsApp)

**Cuándo**: en las primeras 24-48h post-registro.

**Cómo encontrarlos**:
- Admin Panel → Proveedores → tab **Churn risk** (usa `rpc_vets_at_churn_risk`).
- Filtrar por "registrados hace <=3 días".

**Agenda**:

1. **Presentación (2 min)**
   > "Hola [Nombre], soy Pedro de Paw Friend. Vi que te registraste ayer/antier, quería darte la bienvenida personal y asegurarme que aproveches bien la plataforma desde el día 1."

2. **Escucha (5 min)** — pregunta abierta:
   > "¿Qué te hizo probar Paw Friend? ¿Qué esperas conseguir con la plataforma este mes?"
   
   Anotar en tracker (Notion/Sheet): su motivación real. Los que responden "ficha digital" son distintos de los que responden "más pacientes".

3. **Plan individual (5 min)**:
   Según su motivación, proponer **el primer paso a dar en las próximas 48h**:
   - Si busca ficha: "te invito a crear 1 paciente de prueba ahora con su mascota. 2 min."
   - Si busca pacientes: "tu perfil público sale en el directorio si tienes rating ≥3. Vamos a hacer tu primera reseña con un paciente tuyo actual."
   - Si busca organizar agenda: "conecta Google Calendar ahora. Yo te mando el link."

4. **Agenda sesión 2 (3 min)** — 45 min la próxima semana.
   > "En 1 semana nos juntamos de nuevo, 45 min, para revisar tus primeros pacientes y resolver cualquier duda. ¿Qué día te calza?"

**Si no contestan email/WhatsApp**: 2do intento a los 3 días con mensaje corto. Si no responden al 2do: abandono (se acepta, no persigas).

---

### Sesión 2 — Primera ayuda real (45 min, Zoom con share screen)

**Cuándo**: 5-10 días post-registro.

**Pre-reunión (Pedro):**
- Abrir su perfil `service_providers` en admin.
- Ver cuántos pacientes tiene creados (cero es típico, está bien).
- Revisar si completó bio, foto, especialidades.
- Preparar **1 mascota de prueba** en tu cuenta de demo.

**Agenda**:

1. **Demo del flujo completo (15 min)** — share screen:
   - Crear paciente desde `NewPatientForm`.
   - Subir carnet de vacunas con OCR (si Sofia tiene feedback de vacunas con lote/serie, mostrar).
   - Compartir ficha con el vet (link temporal 30 días).
   - Abrir desde el "lado del dueño" y cómo llega el share.

2. **Ellos lo hacen (20 min)** — share screen de ellos:
   - Crear 2 pacientes reales (no demo). Pedro guía.
   - Completar perfil público: foto, bio, especialidades.
   - Si tienen un dueño con quien ya trabajan: hacer share ahora mismo, mandarlo por WhatsApp.

3. **Resolver dudas + feedback (10 min)**:
   - "¿Qué esperabas y no encontraste?" — anotar TODO en feedback widget.
   - "¿Qué te habría hecho abandonar?"
   - Commitment: "La próxima semana revisamos tus 10 primeros pacientes. Te mando recordatorio."

**Señales de que NO convertirá a Premium**:
- No completa perfil público (no le importa visibility).
- No crea paciente en la llamada (solo observa).
- Responde con "ya veré" a cada propuesta.
- No tiene red de pacientes propia (recién empezando como vet).

Si hay **2 señales rojas**, Pedro desprioriza. Agradece, manda materiales, y se enfoca en el siguiente lead.

---

### Sesión 3 — Propuesta de upgrade (30 min, Zoom o in-person)

**Cuándo**: entre día 15 y 25 post-registro.

**Pre-condición**: el vet tiene **≥3 pacientes creados** Y **abrió la app ≥2 veces esta semana**. Si no, mover a cola de "nurture" (email mensual).

**Agenda**:

1. **Review de lo logrado (10 min)**:
   - "Tienes X pacientes, Y compartiste ficha, Z pacientes dieron review."
   - Mostrar el valor en números. Un vet que generó 5 shares puede ver métrica clara.

2. **Dolor + aspiración (5 min)** — pregunta:
   > "Si Paw Friend tuviera que resolver UNA cosa para ti el próximo mes, ¿qué sería?"
   
   Respuestas típicas:
   - "Que aparezcan más pacientes" → ofrecer **Premium** con directorio destacado.
   - "Organizar toda mi agenda" → ofrecer **Premium** con booking ilimitado.
   - "Subir todos mis pacientes a la vez" → ofrecer **Clínica Starter** con bulk import.
   - "Seguir así como estoy" → esperar 30 días más, no forzar upgrade.

3. **Propuesta (10 min)**:
   > "Lo que quieres lo hace el plan X. Son $9.900 al mes (o $99k al año = 2 meses gratis). ¿Qué te parece probar 30 días y si no te mueve la aguja, cancelas sin costo?"
   
   **No** ofrecer:
   - Descuentos sin pedido explícito.
   - "Prueba gratis" que reemplace la suscripción (eso lo da `provider_free`).
   - Promesas de features que no existen todavía.

4. **Firma + onboarding Premium (5 min)**:
   - Si acepta: guiarlo al checkout Flow.cl.
   - Si duda: "¿qué te falta para decidir? ¿hablamos en 2 semanas?". Agendar.
   - Si dice no: agradecer, dejar la puerta abierta. "Cuando quieras crecer, acá estamos."

---

## 3. Tracker individual (plantilla Notion)

```markdown
## [Nombre Vet] · [Comuna] · Registrado [fecha]

**Plan actual**: provider_free
**Motivación declarada**: [texto de sesión 1]
**Pacientes creados**: [num]
**Días desde último login**: [num]

### Timeline
- [ ] Sesión 1 realizada — [fecha] — Link: [Zoom]
- [ ] Sesión 2 realizada — [fecha]
- [ ] Sesión 3 realizada — [fecha]
- [ ] Upgrade Premium — [fecha] o "no"

### Feedback clave
- [lo que dijo en texto]

### Próxima acción
- [WhatsApp mañana para recordatorio]
```

---

## 4. Conversión esperada (realista)

De 20 vets registrados/mes (objetivo S2 en adelante):
- 15 responden sesión 1 (75%).
- 10 completan sesión 2 (50%).
- 6 completan sesión 3 (30%).
- 3 convierten a Premium (15%).

Eso es **3 vets pagando Premium al mes en S3+**. Plan 90d target (3 vets) se cumple en **1-2 meses** si outreach es consistente.

**No pagar de más por conversión temprana**: mejor 3 vets que aman la plataforma que 10 que pagan porque les insististe.

---

## 5. Herramientas que usa Pedro

| Herramienta | Para qué |
|---|---|
| Admin → Churn risk | Ver quién está en alerta |
| Admin → Export CSV (vets) | Cohort analysis mensual |
| Calendar | Agendar sesiones con slot fijo (ej: martes 18-20 hrs) |
| Zoom / Google Meet | Video llamadas |
| WhatsApp | Seguimiento corto + mensajes de cortesía |
| Notion | Tracker individual (template arriba) |
| Loom | Grabar demos reutilizables (1 demo general se manda a 20 vets) |

---

## 6. Loom demo reutilizable (graba 1 vez, usa muchas)

Antes de arrancar el flujo, graba este Loom de 5 min (una sola vez):

- 0:00 — "Hola soy Pedro, fundador de Paw Friend"
- 0:30 — Demo: crear paciente
- 1:30 — Demo: subir carnet OCR
- 2:00 — Demo: compartir ficha con dueño
- 3:00 — Demo: perfil público vet
- 4:00 — Demo: estimador de precios
- 4:45 — CTA: "Si te interesa conectar en persona, mandame WhatsApp a +56 X"

**Uso**: en sesión 1, si el vet está saturado de tiempo, mandas Loom en vez de llamada. Conserva la personalización (saludo con nombre) + escala.

---

## 7. Cuándo escalar a 2do persona

Cuando Pedro tenga:
- 10+ vets Premium pagando (MRR >= $100k CLP).
- 20+ vets en cola de onboarding.
- Saturación comercial (>15 hrs/sem en outreach).

Ahí vale la pena contratar VA comercial 20 hrs/sem (~$400-600k CLP/mes). Con ese apoyo, conversión a Premium puede subir porque no hay cuello de botella.

**Hasta ese punto**: Pedro solo. Es el mayor leverage del negocio en esta fase.

---

## 8. Red flags que NO perdonan (disqualify early)

Aunque parezca un buen lead, **no invertir white-glove** si:

- Vet con menos de 6 meses de experiencia profesional. Paw Friend no es herramienta para aprender a ser vet.
- Pide descuento antes de usar la plataforma. Mala señal de valoración.
- Insulta o trata mal a Pedro en la primera llamada. Los que no respetan al fundador no van a respetar las reglas de la comunidad.
- Quiere Paw Friend solo como vitrina sin usar las features. Es un costo para el producto.

Amabilidad pero firmeza: "Creo que hoy Paw Friend no es el encaje perfecto para ti. Cuando [condición] cambie, vuelve y lo vemos."

---

## 9. Indicadores de éxito del playbook

Después de 30 vets onboardeados (~2-3 meses de operación):

- Conversión Free → Premium ≥ 15%.
- NPS vets onboardeados ≥ 40 (post sesión 3).
- 2 vets actúan como referidores espontáneos (recomiendan Paw Friend a colegas).
- 1-2 convertidos a testimoniales públicos (INIT-18).

Si después de 30 vets no hay ninguno de esos 4 indicadores, replantear:
- ¿El producto realmente les sirve a los vets?
- ¿El pricing está OK?
- ¿La segmentación de target está bien?

---

## 10. Escape hatch

Este playbook es guía, no dogma. Si ves que un vet particular no encaja en el flujo (ej: gran volumen, decide rápido), **salta directo a sesión 3**. Si ves que uno necesita más hand-holding (ej: primer software que usa), **agrega sesión 4**.

La regla única es: **convertir primero los 3 vets pagando al día 90**. El cómo es flexible.
