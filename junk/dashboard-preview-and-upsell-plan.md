# Dashboard Preview & Upsell Plan

> Ubicacion, diseno y medicion de los previews de analytics y CTAs de conversion.
> Fecha: 2026-04-10.

---

## 1. Ubicacion en el panel principal (Home)

### Posicion de los preview cards

```
Home.tsx
  [Header + avatar]
  [Pet switcher (stories)]
  [4 StatusCards: cita, vacunas, ficha, racha]
  [Health alerts (si hay)]
  [PriceEstimatorCard]
  [WeeklyReportCard]
  >>> [AnalyticsPreviewCard]    ← NUEVO
  >>> [PetWellnessPreview]      ← NUEVO
  [Resenas pendientes]
  [Acciones rapidas]
  [PawGame widget]
  [Integraciones]
  [Activity feed]
```

**Razon de la posicion**: despues del reporte semanal (contexto de "datos") y antes de acciones rapidas (contexto de "hacer algo"). El usuario ya vio data basica y esta en mentalidad de "ver mas".

### Modulos preview implementados

#### AnalyticsPreviewCard
- **Datos**: 3 metricas del mes (recordatorios completados, visitas vet, vacunas)
- **Visual**: mini sparkline AreaChart (altura 60px, sin ejes)
- **Interaccion**: click navega a /panel-pro
- **CTA**: "Ver Panel Pro →" (variant minimal, solo si no es premium)
- **Cuando se muestra**: siempre que el usuario tenga mascotas

#### PetWellnessPreview
- **Datos**: score de bienestar (0-100) de la mascota activa
- **Visual**: RadialBarChart (donut) con score numerico al centro
- **Color**: verde (>=70), ambar (40-69), rojo (<40)
- **Interaccion**: click navega a /panel-pro
- **CTA**: "Ver Panel Pro →" (variant minimal)
- **Cuando se muestra**: solo si hay score > 0

---

## 2. Estados locked

### LockedOverlay
Se aplica a secciones del Panel Pro que requieren Premium.

| Propiedad | Valor |
|-----------|-------|
| Blur | 6px Gaussian sobre el contenido hijo |
| Fondo | white/60% + backdrop-blur 2px |
| Icono | Lock (lucide) en circulo purple-100 |
| Titulo | Configurable (default: "Disponible en Premium") |
| Descripcion | Configurable (default: "Mejora tu plan...") |
| Boton | "Desbloquear" con icono Crown, bg-purple-600 |
| Accion | Navega a /upgrade + trackea `pro_panel_upgrade_cta_clicked` |

### Secciones locked en Panel Pro

1. **Grafico de actividad mensual** — "Ve tu actividad dia a dia con tu plan Premium"
2. **Comparativo de periodos** — "Compara la actividad entre meses con tu plan Premium"
3. **Seccion veterinaria** (providers) — "Metricas de tu practica con el plan Premium"
4. **Export PDF/CSV** — "Descarga tus datos en PDF o CSV con el plan Premium"

### Secciones siempre visibles

1. Summary row (4 KPIs) — muestra datos reales para demostrar valor
2. Filtros — permiten cambiar mascota/periodo incluso sin premium (los charts cambian pero siguen locked)

---

## 3. CTAs implementados

### ProUpgradeCTA (3 variantes)

| Variante | Donde se usa | Diseno |
|----------|-------------|--------|
| `minimal` | Debajo de preview cards en Home | Link texto: "Ver Panel Pro →" con Crown icon |
| `inline` | Standalone (uso futuro) | Card compacto con gradiente purple-pink |
| `banner` | Header del Panel Pro (free users) | Full-width card con titulo bold + boton "Activar" |

### Flujo de upgrade

```
1. Home → AnalyticsPreviewCard → click
2. → /panel-pro (Panel Pro)
3. → Ve summary row (datos reales)
4. → Ve graficos bloqueados (blur + LockedOverlay)
5. → Click "Desbloquear" en cualquier overlay
6. → /upgrade (pagina de planes)
7. → Selecciona plan mensual/anual
8. → Flow.cl checkout
9. → /upgrade-success
10. → Vuelve a /panel-pro → graficos desbloqueados
```

---

## 4. Diferencia entre panel base y panel pro

| Aspecto | Base (gratis) | Pro (premium) |
|---------|--------------|---------------|
| Summary row KPIs | Si, datos reales | Si |
| Filtro por mascota | Si | Si |
| Filtro por periodo | Si | Si |
| Grafico actividad | Blur + CTA | Visible + interactivo |
| Comparativo periodos | Blur + CTA | Visible + interactivo |
| Seccion vet | Blur + CTA | Visible |
| Export PDF | Blur + CTA | Funcional |
| Export CSV | Blur + CTA | Funcional |
| Upgrade banner | Visible | Oculto |

---

## 5. Ideas de microcopy (espanol chileno, tuteo)

### Preview cards
- "Resumen del mes" — titulo AnalyticsPreviewCard
- "Bienestar de {nombre}" — titulo PetWellnessPreview
- "Ver Panel Pro →" — CTA minimal

### LockedOverlay
- "Disponible en Premium"
- "Mejora tu plan para desbloquear analytics avanzados"
- "Ve tu actividad dia a dia con tu plan Premium"
- "Compara la actividad entre meses con tu plan Premium"
- "Descarga tus datos en PDF o CSV con el plan Premium"
- Boton: "Desbloquear"

### Banner Pro
- "Desbloquea tu Panel Pro"
- "Accede a analytics avanzados, comparativos y exportaciones"
- Boton: "Activar"

### Export
- "Descargar reporte"
- "Exporta los datos de este periodo"

---

## 6. Como medir si el upsell funciona

### Metricas primarias

| Metrica | Evento | Formula |
|---------|--------|---------|
| Preview visibility | `analytics_preview_viewed` | Count por usuario |
| Preview engagement | `analytics_preview_cta_clicked` | CTR = clicked / viewed |
| Panel reach | `pro_panel_viewed` | Usuarios unicos que llegan al panel |
| Upgrade intent | `pro_panel_upgrade_cta_clicked` | % de visitantes que clickean CTA |
| Conversion | `premium_converted` | % de quienes clickean CTA que convierten |

### Funnel completo

```
analytics_preview_viewed (100%)
  → analytics_preview_cta_clicked (~15% target)
    → pro_panel_viewed (~80% de los que clickean)
      → pro_panel_upgrade_cta_clicked (~8% target)
        → premium_converted (~3% target del total)
```

### Señales de ajuste necesario

| Señal | Problema probable | Accion |
|-------|-------------------|--------|
| Preview CTR < 5% | Card no genera curiosidad | Cambiar copy, agregar dato mas impactante |
| Panel → CTA < 3% | Locked state no convence | Reducir blur, mostrar mas data "parcial" |
| CTA → Conversion < 1% | Precio alto o propuesta no clara | Revisar pagina /upgrade, probar trial |
| Retencion baja post-upgrade | Panel no entrega suficiente valor | Agregar mas charts, insights IA |

---

## 7. Recomendaciones de evolucion

### Corto plazo (V1, implementado)
- Preview cards en Home con datos reales
- Panel Pro con charts nativos + gating
- Tracking de todo el funnel

### Medio plazo (V2)
- Export PDF/CSV funcional
- Insights IA: "Este mes tu mascota tuvo 2 visitas vet mas que el promedio"
- Notificacion push: "Tu resumen mensual esta listo"

### Largo plazo (V3)
- Reporte veterinario profesional con template (logo clinica, datos paciente)
- Widgets de analytics en el sidebar (mini-chart persistente)
- Comparativo entre mascotas
- Score de bienestar historico (linea de tiempo)
