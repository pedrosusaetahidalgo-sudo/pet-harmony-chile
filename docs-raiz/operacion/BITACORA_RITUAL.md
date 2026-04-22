# Bitácora del Ritual Semanal — Paw Friend

> Registro de cada ejecución del ritual lunes 09:00-10:30.
> Protocolo: [RITUAL_WEEKLY_OPS.md](./RITUAL_WEEKLY_OPS.md).
> Pedro: escribir la entrada **durante** el ritual, no después.
> Horizonte: trimestre 2026-04-21 → 2026-07-20 (13 semanas).
> Target: ≥12/13 rituales ejecutados.

---

## Índice de semanas

| # | Fecha ritual | Sprint | Tema |
|---|---|---|---|
| 1 | 2026-04-27 | S1 | Fundación medible + fiscal (arranque) |
| 2 | 2026-05-04 | S1 | Cierre S1 |
| 3 | 2026-05-11 | S2 | Motor B2B + sugerencias Sofia |
| 4 | 2026-05-18 | S2 | Cierre S2 |
| 5 | 2026-05-25 | S3 | Capital público + embajadora + iOS |
| 6 | 2026-06-01 | S3 | Cierre S3 |
| 7 | 2026-06-08 | S4 | Performance + seguridad + push |
| 8 | 2026-06-15 | S4 | Cierre S4 |
| 9 | 2026-06-22 | S5 | Primera clínica + Paw Member + PC |
| 10 | 2026-06-29 | S5 | Cierre S5 |
| 11 | 2026-07-06 | S6 | Consolidación + pitch v2 + PR |
| 12 | 2026-07-13 | S6 | Cierre S6 |
| 13 | 2026-07-20 | — | Cierre trimestre + métricas finales |

---

## Semana 0 — 2026-04-20 (setup + baseline)

**Nota**: esta entrada la escribió Claude Code al generar el plan 90d. No es un ritual formal, es el baseline pre-Sprint 1.

### Métricas (baseline al inicio del trimestre)
- North Star: N/A (por instrumentar, INIT-02 + INIT-03 en S1).
- MAU owners: N/A (vista `mau_owners_v` creada 2026-04-20, por poblar).
- Vets pagando: 0.
- MRR B2B: $0.
- Donaciones 30d: N/A (feature flag OFF, se activa post INIT-01 migración SpA).
- Paw Members: N/A (por medir, columna pendiente o usar proxy).
- Health score: última corrida del audit-cron-daily.

### Setup de la semana 0 (ejecutado por Claude Code 2026-04-20)

Archivos generados en `docs-raiz/planes/`:
- `_DIAGNOSTICO_EXITO_20260420.md`
- `PLAN_EXITO_90D_20260420.md` (28 iniciativas, 6 sprints)
- `PLAN_EXITO_90D_INICIATIVAS.csv`
- `PLAN_EXITO_90D_KPIS.md`
- `PLAN_EXITO_90D_FUNDRAISING.md`

Archivos operacionales:
- `docs-raiz/operacion/RITUAL_WEEKLY_OPS.md`
- `docs-raiz/operacion/BITACORA_RITUAL.md`

Infraestructura agregada:
- Migración SQL para vistas `mau_owners_v`, `nsm_30d_v`, `mrr_b2b_v` — pendiente aplicar prod.
- Evento analytics `MEDICAL_SHARE_OPENED` + track en `MedicalShare.tsx`.
- Componente `AdminNorthStarHeader` al tope de admin Dashboard.
- Spec INIT-07 (vacunas + antiparasitarios Sofia) ejecutada — archivada en [_archive/VACUNAS_ANTIPARASITARIOS_SOFIA.md](../../_archive/VACUNAS_ANTIPARASITARIOS_SOFIA.md).

### Confirmaciones de Pedro (2026-04-20)
- ✅ 30-40 hrs/sem disponibles.
- 🔄 Cuenta corriente SpA en camino vía Mach.
- ✅ Testimoniales: Sofia + otros vets + dueños dispuestos. INIT-18 expandida.

### Top 3 tareas semana 1 (Sprint 1 arranque — lunes 2026-04-27)
1. **(P)** Confirmar CtaCte Mach operativa + pegar credenciales Flow SpA — INIT-01.
2. **(P)** Mandar a Claude la lista de 3 vets + 3 dueños para testimoniales — INIT-18.
3. **(C)** Si Pedro da luz verde: ejecutar INIT-07 (sub-tabs vacunas + antiparasitarios) leyendo spec.

### Hipótesis semana 1
- Hipótesis: SpA + SpA CtaCte Mach desbloquea donaciones recurrentes + Paw Companys facturables en ≤14 días.
- Experimento: hacer transacción test $100 CLP al webhook Flow con razón social SpA.
- Cómo sabemos si funcionó: `flow-webhook` procesa sin error + factura emitible.

---

## Semana 1 — (por escribir el 2026-04-27)

```
## Semana 1 — 2026-04-27

### Métricas (30d)
- North Star: ...
- MAU owners: ...
- Vets pagando: ...
- MRR B2B: ...
- Donaciones 30d: ...
- Paw Members: ...
- Health score: ...

### Sprint
- Sprint actual: S1
- Done esta semana: ...
- In progress: ...
- Blocked: ...

### Feedback destacado
- ...

### Fundraising
- CORFO: ...
- Angels: ...
- Outbound vets: ...
- Outbound PC: ...

### Top 3 tareas próxima semana
1. ...
2. ...
3. ...

### Hipótesis de la semana
- Hipótesis: ...
- Experimento: ...
- Cómo sabemos si funcionó: ...

### Decisión o pivote tomado
- ...
```

---

<!-- Agregar nuevas entradas ABAJO de esta línea cada lunes -->
