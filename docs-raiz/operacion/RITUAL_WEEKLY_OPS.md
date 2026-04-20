# Ritual Semanal Operacional — Paw Friend

> Origen: INIT-19 del [Plan de Éxito 90 días](../planes/PLAN_EXITO_90D_20260420.md).
> Frecuencia: 1x/semana, **lunes 09:00-11:00** (confirmado por Pedro 2026-04-20, bloqueado en Google Calendar recurrente).
> Duración: 2 horas (120 min).
> Objetivo: evitar deriva, generar serie temporal para pitch y decidir pivotes con data.

---

## Reglas no negociables

1. **Se ejecuta siempre**, incluso si la semana fue caótica. Ritual ausente = semana perdida.
2. Pedro escribe la entrada en [`BITACORA_RITUAL.md`](./BITACORA_RITUAL.md) **durante** el ritual, no después.
3. Si una métrica no se puede consultar, dejar `N/A (por instrumentar)` — nunca inventar.
4. Máximo 120 min. Si se extiende, el bloque de "decisiones" se aplaza al lunes siguiente.

---

## Agenda (120 min)

### Bloque 1 — Pulso del negocio (25 min)

1. Abrir Admin panel → Home dashboard.
2. Capturar los siguientes números (copiarlos a la bitácora):
   - **North Star 30d** (fichas descargadas / compartidas por dueño activo).
   - **MAU owners** (dueños activos 30d).
   - **Vets pagando Premium o superior** (count).
   - **MRR B2B actual** (suma monthly_price).
   - **Donaciones 30d** (CLP).
   - **Paw Members activos** (count).
   - **Health score edge fns promedio**.
3. Delta vs semana anterior: +/- absoluto y porcentaje.
4. Apuntar la métrica que **más te preocupa** esta semana (sólo 1).

### Bloque 2 — Sprint en curso (30 min)

1. Abrir [PLAN_EXITO_90D_20260420.md §5](../planes/PLAN_EXITO_90D_20260420.md#5-roadmap-por-sprints).
2. Identificar en qué sprint estás (S1-S6).
3. Iniciativas del sprint: ¿cuáles están done, in-progress, blocked?
4. **Regla**: si una iniciativa lleva >1 sprint atrasada, decidir ahora: la mantienes, la simplificas o la eliminas.
5. Si hay blockers, nombrarlos y definir el próximo paso (quién / cuándo).

### Bloque 3 — Feedback y comunidad (20 min)

1. Feedback tab en admin (`/admin?section=content&sub=feedback`): leer los nuevos.
2. WhatsApp con Sofia (o otros vets beta): ¿hubo mensaje esta semana?
3. Instagram, Reddit, subreddits chilenos de mascotas: ¿algo que valga responder?
4. Anotar 1-2 items de feedback que quieres aplicar esta semana.

### Bloque 4 — Fundraising y outreach (25 min)

1. Tracker postulaciones ([PLAN_EXITO_90D_FUNDRAISING.md §9](../planes/PLAN_EXITO_90D_FUNDRAISING.md#9-tracker-mensual-para-copy-paste)).
2. ¿CORFO SSAF-I enviada? Si no, ¿a qué semana se posterga?
3. Pipeline angels: cuántos contactados, reuniones agendadas, en DD.
4. Outbound vets (INIT-09): cuántos emails enviados, demos, trialing.
5. Outbound Paw Companys (INIT-11): cuántas reuniones esta semana.

### Bloque 5 — Plan de la semana (10 min)

1. Top 3 tareas de la semana (no más — priorización dura).
2. Bloquear tiempo en Google Calendar para cada una.
3. Indicar cuáles requieren **(C)** Claude Code y cuáles **(P)** Pedro.
4. Anotar 1 hipótesis que vamos a validar esta semana con 1 experimento concreto.

### Bloque 6 — Snapshot + cierre (5 min)

1. Copiar/pegar el template de snapshot en [`BITACORA_RITUAL.md`](./BITACORA_RITUAL.md).
2. Commit con mensaje `ops: ritual semana N`.
3. Cerrar laptop. Si algo crítico salió, se agenda ejecución separada, no se extiende el ritual.

---

## Template snapshot (copiar a BITACORA_RITUAL.md)

```markdown
## Semana N — YYYY-MM-DD

### Métricas (30d)
- North Star: X (Δ vs semana anterior)
- MAU owners: X
- Vets pagando: X
- MRR B2B: $X
- Donaciones 30d: $X
- Paw Members: X
- Health score: X/100

### Sprint
- Sprint actual: Sn
- Done esta semana: INIT-XX, INIT-YY
- In progress: INIT-ZZ
- Blocked: INIT-AA (razón: ...)

### Feedback destacado
- Vet X: [mensaje]
- Dueño Y: [mensaje]

### Fundraising
- CORFO: [estado]
- Angels: [contactados/reuniones]
- Outbound vets: [emails/demos/trialing]
- Outbound PC: [reuniones]

### Top 3 tareas próxima semana
1. [tarea + owner P/C]
2. [tarea + owner P/C]
3. [tarea + owner P/C]

### Hipótesis de la semana
- Hipótesis: [frase corta]
- Experimento: [1 acción concreta]
- Cómo sabemos si funcionó: [métrica / señal]

### Decisión o pivote tomado
- [si aplica, describir decisión]
```

---

## Si te saltas un ritual

- **1 semana**: se permite, pero la siguiente se ejecuta ritual doble (revisar 2 semanas).
- **2 semanas consecutivas**: alerta roja. Significa que el plan 90d está en riesgo. Agendar sesión extra de 2 hrs para recuperar contexto.
- **3 semanas consecutivas**: replantear el plan entero. No sirve un plan que no se ejecuta.

---

## Regla de oro del ritual

> Es mejor un ritual de 30 min ejecutado que un ritual de 90 min idealizado pero saltado.

Si el lunes está saturado, ejecuta **sólo** bloques 1 y 5 (30 min). El resto se recupera el lunes siguiente. Nunca se salta completo.

---

## Herramientas

- Google Calendar: bloqueo recurrente "Ritual Paw Friend" lunes 09:00-10:30.
- Admin panel: `https://pawfriend.cl/admin` (requiere login con cuenta admin).
- Plan 90d: [`docs-raiz/planes/PLAN_EXITO_90D_20260420.md`](../planes/PLAN_EXITO_90D_20260420.md).
- Bitácora: [`BITACORA_RITUAL.md`](./BITACORA_RITUAL.md).
- Tracker fundraising: [`docs-raiz/planes/PLAN_EXITO_90D_FUNDRAISING.md`](../planes/PLAN_EXITO_90D_FUNDRAISING.md).
