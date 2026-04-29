# UX Polish Backlog (2026-04-29)

> Items validados pero no críticos del menú PROPUESTAS_FUNCIONALIDADES.md
> que NO se ejecutaron en Sprint 0+1 ni en Plan v5. Quedan para iteración
> incremental post-launch.
>
> Doc creado por instrucción de [_pending/SINTESIS_2026_04_30.md sec 6](SINTESIS_2026_04_30.md).

---

## Items vivos (4 tickets de UX polish)

### UX-01 · Snooze de recordatorios — UX micro-mejoras

**Estado**: ✅ Funcional (snoozeReminder en useReminders.tsx + DropdownMenu 1d/3d/7d).

**Polish pendiente**:
- [ ] Confirmación visual mejor cuando el snooze se aplica (toast con "Snooze aplicado · vuelve en 3d").
- [ ] Opción "Snooze custom" (date picker) para casos como "vuelve en 2 semanas".
- [ ] Botón deshacer snooze inmediato en el toast (5 segundos).

**Effort**: ~2-3 horas.
**Impacto**: bajo-medio (mejora satisfacción, no bloqueante).

---

### UX-05 · Badge "Atiende hoy" en directorio vets

**Estado**: ✅ Funcional (`attendsToday` prop + `todayAvailableIds` query).

**Polish pendiente**:
- [ ] Badge debería ser más prominente visualmente (color verde, animación sutil).
- [ ] Filtro "Solo vets que atienden hoy" en `/veterinarios` (toggle al tope).
- [ ] Si vet tiene 1 slot libre en próx 2h → badge "Disponible ahora" más urgente.

**Effort**: ~3-4 horas.
**Impacto**: medio (drive bookings inmediatos).

---

### UX-07 · Vista rápida paciente (Sheet) — completar polish

**Estado**: ✅ Funcional (`PatientQuickView` en VetPatientsList.tsx).

**Polish pendiente**:
- [ ] Acción "Llamar al dueño" con WhatsApp link directo.
- [ ] Mostrar última consulta + próximos recordatorios pendientes.
- [ ] Quick action "Crear nota rápida sin abrir ficha completa".
- [ ] Compatibilidad mobile sheet (hoy puede ser muy chico).

**Effort**: ~4-5 horas.
**Impacto**: medio-alto (vets usan esto frecuente).

---

### UX-08 · Export CSV/PDF Panel Pro — RFC 4180 polish

**Estado**: ✅ Funcional (handleExport real con downloadCSV + buildPDFHtml).

**Polish pendiente**:
- [ ] Loading state mientras genera (especialmente PDF que puede ser lento).
- [ ] Customización: user elige qué columnas exportar.
- [ ] Date range picker explícito (hoy default es últimos 30d sin opción).
- [ ] Email export en background si > 1MB (usar edge fn).

**Effort**: ~5-6 horas.
**Impacto**: bajo (Premium users power, ya funciona).

---

## Items adicionales detectados durante Plan v5

### UX-09 · Empty states ilustrados consistentes

Después del speech sweep + refactor PawMember, hay páginas con empty states genéricos. Auditar:

- [ ] `/reportes` — empty cuando no hay data histórica
- [ ] `/transparencia` — cuando no hay donaciones aún
- [ ] `/paw-companys` — cuando no hay sponsors (hoy vacío)
- [ ] `/paw-voices` — cuando no hay creadores
- [ ] `/paw-partners` — cuando no hay aliados
- [ ] Tab Manada Impact en `/paw-member` — cuando aporte = 0 (recién suscrito)

**Effort**: ~3-4 horas.
**Impacto**: medio (primera impresión user nuevo).

---

### UX-10 · Loading skeletons coherentes

El refactor PawMember y nuevos componentes (Tier3Pricing, PremiumGate) usan distintos patterns de loading. Estandarizar:

- [ ] Mismo skeleton color y animación en todas las pages.
- [ ] Spinner secondary cuando query es < 500ms (evitar flicker).
- [ ] `ManadaImpactSection` usa Skeleton coherente con resto.

**Effort**: ~2-3 horas.
**Impacto**: bajo (consistency visual).

---

### UX-11 · Tooltips en features premium

PremiumGate muestra "qué desbloqueas" pero hay features dentro de Paw Member que no son obvias.

- [ ] Tooltip en cada feature gated explicando valor concreto.
- [ ] Ejemplo: en "Paw Shield" tooltip dice "Si tu mascota se pierde, cualquier persona puede escanear su huella nasal en /nose-scan y devolverla".
- [ ] Demo gif corto opcional (15-30 seg).

**Effort**: ~6-8 horas (incluye gif production).
**Impacto**: medio (sube conversión paywall).

---

### UX-12 · Disclaimer demos Insurance/Retail más visible

Plan v5 agregó disclaimer "piloto en marcha" en `/cotizar-seguro/:petId` y `/tienda/:petId`. Polish:

- [ ] Banner permanente al tope (no solo card al final).
- [ ] Si hay partners reales firmados, cambiar copy automáticamente vía feature flag.
- [ ] Para Insurance: ocultar precios estimados si user es de comuna sin cobertura real.

**Effort**: ~2-3 horas.
**Impacto**: medio (credibilidad).

---

## Priorización post-launch

| Prioridad | Items | Cuándo ejecutar |
|---|---|---|
| 🔥 Alta | UX-09 (empty states), UX-12 (disclaimers) | Mes 1-2 post-launch |
| 🟠 Media | UX-05 (badge), UX-07 (Patient quickview), UX-11 (tooltips) | Mes 2-3 |
| 🟡 Baja | UX-01 (snooze), UX-08 (export), UX-10 (loading) | Mes 4+ |

**Estimación total**: ~30-40 horas de UX polish — equivalente a 1-2 sprints de 2 semanas.

---

## Cómo decidir qué iterar primero

**Métrica**: tras 4 semanas post-launch, mirar:
1. PostHog funnels: dónde caen users del onboarding al paywall.
2. Bug reports beta: cuáles son los más frecuentes.
3. Reviews tienda (cuando salgan iOS/Android): qué piden.

Los items con más fricción real → suben prioridad. Los demás esperan.

---

**Origen**: items extraídos de PROPUESTAS_FUNCIONALIDADES.md (P2/P5/P7/P8) más detección durante Plan v5 ejecución.
