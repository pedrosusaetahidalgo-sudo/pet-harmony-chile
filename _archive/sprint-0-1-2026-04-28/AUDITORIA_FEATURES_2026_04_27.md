# Auditoría features existentes — 2026-04-27

> Ejecución del **§2.10 Matriz de evaluación** del Refactor Maestro
> ([docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md:645](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md#L645)).
>
> Cada feature pasa por los 4 tests. Output: **mantener / refactorizar / esconder**.
> Esta auditoría es snapshot post Fase 0 + Fase 1 + Fase 2 scaffolding (2026-04-27).
> El plan original tenía la matriz pero no estaba ejecutada con estado real.

## Los 4 tests

| # | Test | Pregunta |
|---|---|---|
| 1 | **Trinidad** | ¿Alimenta Pet ID Card / Nose Print / Ficha Médica? |
| 2 | **One-Tap** | ¿Se captura en <10 segundos sin llenar formulario? |
| 3 | **Ambient** | ¿La app detecta/sugiere/encadena sin pedir permiso cada vez? |
| 4 | **Insights** | ¿La data generada suma a correlaciones útiles (incluso agregadas)? |

Si una feature falla 2 o más → esconder behind flag y marcar para revisión.

## Estado actual (2026-04-27)

### 🟢 PILARES — features que cargan el moat (sin tocar)

| Feature | T1 | T2 | T3 | T4 | Acción |
|---|---|---|---|---|---|
| **Pet ID Card v2** | ✅✅ | ✅ auto | ✅ auto | ✅ | Mantener — Pilar Trinidad #1 |
| **Nose Print biométrico** | ✅✅ identidad | ✅ | ✅ | ✅ | Mantener — Pilar Trinidad #2 (PAUSADO esperando proveedor) |
| **Ficha clínica + Timeline 10 cat** | ✅✅ | ✅ | ✅ | ✅ | Mantener — Pilar Trinidad #3 |
| **Audio notes owner** | ✅ | ✅ | ✅ | ✅ | Mantener |
| **Quick Actions Hub** | ✅ | ✅✅ | ✅ | ✅ | Mantener |
| **Paw Passport PDF 8 páginas** | ✅✅ | ✅ | ✅ | ✅ | Mantener |
| **Memorial viral + share card** | ✅ cierra historia | ✅ | ✅ | ✅ | Mantener — refactor 2026-04-25 OK |
| **PDF/ZIP export ficha** | ✅ | ✅ | ✅ | ✅ | Mantener |
| **Compartir ficha token 30d** | ✅ | ✅ | ✅ | ✅ | Mantener |

### 🟡 REFACTORIZADAS — el plan pide trabajo, parcial o total ya hecho

| Feature | T1 | T2 | T3 | T4 | Acción + estado |
|---|---|---|---|---|---|
| **Recordatorios** | ✅ | ✅ presets one-tap | ✅ cascada vacunas | ✅ | ✅ Refactor 2026-04-25 (AddReminderDialog presets) + cascada vaccine_overdue 2026-04-27 |
| **Booking V2 con vets** | ✅ alimenta timeline | ⚠️ 3 pasos | ⚠️ | ✅ | ⚠️ Pendiente: cascada post-booking auto (registrar consulta en timeline) |
| **Adopción / Refugios** | ✅ transfer ficha | ✅ feed unificado | ✅ followup 30/90d | ✅ | ✅ Refactor adopción Bloque 2 + cron followups 2026-04-25 |
| **Rutinas (paseos manuales)** | ✅ | ❌ | ❌ | ✅ | ⚠️ Pendiente: GPS + cronómetro automático (`WALK_GPS_TRACKING=false`) |
| **Insights SEO públicos** | ✅ visualiza data | ✅ | ✅ | ✅✅ | ✅ Insights v2 con 3 tipos slugs 2026-04-25 |

### 🟠 ESCONDIDAS (correctamente) — flag false, no romper

| Feature | T1 | T2 | T3 | T4 | Flag | Acción |
|---|---|---|---|---|---|---|
| Paw Game | ❌ | ✅ | ❌ | ❌ | `PAWGAME_PROMINENT=false` | OK — accesible solo desde sidebar |
| Misiones | ❌ | ⚠️ | ❌ | ❌ | (route owner-only) | OK — escondido en owner mode |
| Feed social | ❌ | ❌ | ❌ | ❌ | `FEED=false` | OK |
| Chat | ❌ | ❌ | ❌ | ❌ | `CHAT=false` | OK |
| Panel Pro Analytics B2C | ⚠️ | ✅ | ❌ | ⚠️ | `PRO_ANALYTICS=true` (visible) | ⚠️ **REVISAR**: el plan dice esconder, hoy está visible |
| Marketplace | ❌ | ❌ | ❌ | ❌ | `MARKETPLACE=false` | OK |
| Paseos compartidos | ❌ | ❌ | ❌ | ❌ | `SHARED_WALKS=false` | OK |
| Mascotas perdidas (sección) | ⚠️ | ❌ | ❌ | ⚠️ | `LOST_PETS_SECTION=false` | OK — integrado vía mapa/feed |
| Map pet-friendly | ⚠️ | ✅ | ⚠️ | ❌ | `MAP_PET_FRIENDLY=false` | OK — datos hardcodeados |
| Comunidad por raza | ⚠️ | ⚠️ | ❌ | ⚠️ | `LABS_COMMUNITY=true` (Labs) | OK — banner Paw Labs explica beta |
| Banco de sangre | ⚠️ | ⚠️ | ❌ | ⚠️ | `LABS_BLOOD_DONORS=true` (Labs) | OK — Labs banner |
| Donantes adopción Labs | ⚠️ | ⚠️ | ❌ | ⚠️ | `LABS_ADOPTION=true` (Labs) | OK — Labs banner |

### 🟣 NUEVAS Fase 2 (scaffolding, dormidas hasta cliente)

| Feature | T1 | T2 | T3 | T4 | Flag | Estado |
|---|---|---|---|---|---|---|
| Insurance banner | ✅ visualiza | ✅ 1-click | ✅ pre-llena | ✅ | `EMBEDDED_INSURANCE=false` | Listo, esperando partner aseguradora |
| Risk score (B2B endpoint) | ✅ | n/a (B2B) | n/a | ✅✅ | (admin only) | Listo, `B2B_API=false` impide endpoint |
| API B2B v1 | n/a | n/a | n/a | ✅✅ | `B2B_API=false` | Listo, esperando primer deal |
| Pharma research consent | ✅ data | ✅ | ✅ nudge auto | ✅✅ | `RESEARCH_CONSENT_FLOW=true` | Activo — UI visible, opt-in opcional |
| Cascada weight_loss_30d | ✅ | ✅ trigger DB | ✅✅ ambient | ✅ | `CASCADE_WEIGHT_ALERTS=true` | Activo — espera detección real |
| Cascada vaccine_overdue | ✅ | ✅ cron | ✅✅ ambient | ✅ | (cron pendiente programar) | Listo — pg_cron pendiente Pedro |
| Email severity=high | ✅ | n/a (auto) | ✅✅ | ✅ | (cron pendiente) | Listo — pg_cron pendiente Pedro |

## Resumen ejecutivo

### Salud del producto

- **9 pilares activos** (vs 5 prometidos en plan original 2026-04-23) — incluye Paw Passport, Memorial, Compartir ficha y los 5 originales.
- **5 features refactorizadas** según los 4 tests, algunas parcialmente:
  - ✅ Recordatorios + cascada vacunas (cierra loop)
  - ✅ Adopción + followup automático
  - ✅ Insights SEO (3 tipos slugs)
  - ⚠️ Booking V2 — todavía 3 pasos formulario, sin cascada post-booking
  - ⚠️ Rutinas — sin GPS automático aún
- **12 features escondidas** correctamente behind flags, distribuidas en 4 categorías:
  - 6 escondidas en false (Feed, Chat, Marketplace, etc.) — sin tracción ni alineación
  - 4 escondidas en flags Labs (con banner explicativo)
  - 1 escondida porque queda en owner-only (Misiones)
  - 1 **REVISAR**: `PRO_ANALYTICS=true` está activo pero el plan §2.10.2 dice esconder a Pedro-only
- **7 features Fase 2** scaffolded esperando deals B2B o partners.

### Flags candidatas a evaluar (>6 meses sin uso)

Ninguna todavía — las flags Fase 0/1 se activaron 2026-04-23 (4 meses). Próximo ritual de revisión: 2026-10-23.

### Acciones pendientes derivadas de la auditoría

| # | Acción | Esfuerzo | Razón |
|---|---|---|---|
| 1 | Cambiar `PRO_ANALYTICS` a `false` o agregar gate Pedro-only | 30min | Plan §2.10.2 dice esconder; hoy visible para todos |
| 2 | Cascada post-booking → registrar consulta en timeline | 1h | Booking V2 falla T2/T3 |
| 3 | GPS + cronómetro paseos | 4-6h | Rutinas falla T2/T3. Requiere permisos background iOS/Android |
| 4 | Cascada `no_activity_7d` (push si no abre app 7d) | 2h | `CASCADE_INACTIVITY_CHECK=false` — falta implementar |
| 5 | Cascada `birthday_window` con auto-share | 1h | Hoy hay `BirthdayShareCard` manual; falta auto-create alert tipo birthday_window |
| 6 | Programar 2 crones nuevos (vaccine_overdue + notify-health-alerts) | Pedro | Acción manual para que las cascadas Fase 2 funcionen |

### Flags a NO tocar

- `NOSE_PRINT_PUBLIC_SCAN=false` — pausado por proveedor 2026-04-27.
- `EMBEDDED_INSURANCE=false`, `PHARMA_INSIGHTS_API=false`, `B2B_API=false`, `RETAIL_FULFILLMENT=false` — esperando deals.
- `PARTNER_AUTO_TIMELINE`, `PARTNER_SCANNER_API`, `PASSIVE_DETECTION_GPS`, `CASCADE_AI_SUGGESTIONS`, `AI_PATTERN_DETECTION` — Fase 2 nice-to-have, no urgentes.
- `LATAM_*` — expansión post Y2.

## Próximo ritual de revisión

**2026-05-27** (1er lunes mensual). Revisar:
1. ¿Cuántas alertas creó la cascada `weight_loss_30d` en el mes? ¿% dismissed por tipo?
2. ¿Cuántos opt-in de research consent? Threshold mínimo 30% para deal Pharma viable.
3. ¿Algún cliente B2B contactó por la API? Si sí, generar key y reportar en commit.
4. Revisar `PRO_ANALYTICS` flag — decidir esconder o eliminar.
5. Revisar tracking de `Paw Game` y `Misiones` — si <5% MAU, esconder más profundo.
