# Pro Analytics — Plan de Monetizacion

> Documento estrategico: como convertir la reporteria en razon para pagar Paw Friend.
> Fecha: 2026-04-10.

---

## 1. Propuesta de valor del Panel Pro

**"Paw Friend no solo guarda datos, los transforma en seguimiento util."**

El Panel Pro convierte actividad clinica, recordatorios y bienestar en visualizaciones accionables. Para duenos, responde: "como va la salud de mi mascota". Para veterinarios, responde: "como va mi practica este mes".

### Diferenciador competitivo

- Ningun competidor chileno (PetBook, DogHero, Vetster) ofrece analytics de mascotas integrados.
- El seguimiento temporal y comparativo es una funcionalidad aspiracional que justifica pago recurrente.
- La reporteria veterinaria descargable posiciona a Paw Friend como herramienta profesional.

---

## 2. Estructura de monetizacion por nivel

### Nivel 1 — Preview gratuito (Home)

| Componente | Datos mostrados | Objetivo |
|-----------|----------------|----------|
| AnalyticsPreviewCard | 3 metricas del mes + sparkline | Demostrar que existe data util |
| PetWellnessPreview | Score de bienestar (radial chart) | Generar interes en profundizar |
| CTA "Ver Panel Pro" | Link a /panel-pro | Llevar al usuario al panel |

**Regla**: mostrar valor suficiente para generar curiosidad, no para satisfacer la necesidad completa.

### Nivel 2 — Panel Pro (Premium $3.990/mes)

| Capacidad | Descripcion |
|-----------|-------------|
| Summary row completo | 4 KPIs con filtro por mascota y periodo |
| Grafico de actividad | AreaChart diario: recordatorios, visitas, vacunas |
| Comparativo de periodos | BarChart: mes actual vs anterior |
| Filtros avanzados | Por mascota, por periodo (mes actual, pasado, 3 meses) |
| Seccion veterinaria | Reservas, clientes, ingresos, resenas (solo providers) |

### Nivel 3 — Export Premium (Premium $3.990/mes, incluido)

| Capacidad | Descripcion |
|-----------|-------------|
| Descarga PDF | Reporte mensual formateado |
| Export CSV | Datos crudos para analisis propio |
| Reporte veterinario | Resumen mensual profesional descargable |

**Decision**: No crear un tier separado para export. Va incluido en Premium para maximizar percepcion de valor por un solo precio.

---

## 3. Features bloqueadas vs desbloqueadas

| Feature | Gratis | Premium |
|---------|--------|---------|
| Preview en Home (3 stats + sparkline) | Si | Si |
| Score bienestar (radial) | Si | Si |
| Panel Pro - summary row | Si | Si |
| Panel Pro - graficos detallados | Blur + CTA | Si |
| Panel Pro - comparativo periodos | Blur + CTA | Si |
| Panel Pro - filtros avanzados | Blur + CTA | Si |
| Export PDF/CSV | Blur + CTA | Si |
| Seccion vet (providers) | Blur + CTA | Si |

---

## 4. Triggers de upgrade

| Momento | Trigger | Copy sugerido |
|---------|---------|---------------|
| Home → preview card | Click en "Ver Panel Pro →" | Microcopy: "Ver Panel Pro →" |
| Panel Pro → grafico bloqueado | LockedOverlay visible | "Mejora tu plan para desbloquear analytics avanzados" |
| Panel Pro → export bloqueado | LockedOverlay visible | "Descarga tus datos en PDF o CSV con el plan Premium" |
| Panel Pro → header banner | ProUpgradeCTA banner | "Desbloquea tu Panel Pro — analytics avanzados, comparativos y exportaciones" |

---

## 5. Metricas de adopcion del panel

### Eventos de tracking implementados

| Evento | Momento |
|--------|---------|
| `analytics_preview_viewed` | Preview card renderizada en Home |
| `analytics_preview_cta_clicked` | Click en CTA del preview |
| `pro_panel_viewed` | Pagina /panel-pro cargada |
| `pro_panel_filter_changed` | Cambio de filtro (pet/periodo) |
| `pro_panel_export_clicked` | Click en boton PDF/CSV |
| `pro_panel_upgrade_cta_clicked` | Click en cualquier CTA de upgrade |
| `vet_report_viewed` | Seccion vet analytics vista |

### Funnel de conversion a medir

```
analytics_preview_viewed
  → analytics_preview_cta_clicked (CTR del preview)
    → pro_panel_viewed (llegada al panel)
      → pro_panel_upgrade_cta_clicked (intencion de upgrade)
        → premium_converted (conversion real)
```

### KPIs objetivo

- **Preview CTR**: >15% de usuarios que ven el preview hacen click
- **Panel → Upgrade intent**: >8% de visitantes del panel clickean CTA
- **Upgrade conversion**: >3% del funnel completo
- **Retencion premium**: usuarios con panel pro activo tienen >20% mejor retencion a 30 dias

---

## 6. Hipotesis de valor percibido

1. **Para duenos**: "Puedo ver como evoluciona la salud de mi mascota mes a mes" → esto justifica $3.990/mes porque es informacion que ningun otro servicio ofrece
2. **Para veterinarios**: "Tengo un resumen profesional de mi practica" → diferenciador en el mercado B2B chileno
3. **Para power users**: "Puedo descargar y analizar mis datos" → sensacion de control y ownership de la data

---

## 7. Timeline de evolucion

| Fase | Contenido | Cuando |
|------|-----------|--------|
| V1 (actual) | Previews + Panel con charts nativos + gating | Implementado |
| V2 | Export PDF/CSV funcional (jsPDF + json2csv) | Cuando haya >100 usuarios activos |
| V3 | Insights IA mensuales ("tu mascota mejoro X% este mes") | Cuando haya data de >3 meses |
| V4 | Reporteria veterinaria avanzada con templates | Cuando haya >10 vets activos |
| V5 | API de datos para integracion externa | Solo plan Clinica Pro |

---

## 8. Provider plans — analytics_level

| Plan provider | analytics_level | Capacidades |
|--------------|----------------|-------------|
| Gratis | none | Sin analytics |
| Individual ($9.900) | basic | KPIs basicos, graficos |
| Clinica Basica ($29.900) | basic | KPIs + comparativos |
| Clinica Pro ($59.900) | advanced | Todo + export + API |
