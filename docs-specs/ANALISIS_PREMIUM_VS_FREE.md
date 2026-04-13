# Paw Friend -- Analisis Premium vs Free + Plan de Ejecucion

> Fecha: 2026-04-12
> Objetivo: definir que features deben ser gratuitas (para generar traccion) y cuales premium (para monetizar), con un plan de ejecucion concreto.

---

## 1. Principios estrategicos

| Principio | Razon |
|---|---|
| **Free = hook de enganche** | El usuario debe enamorarse de la app antes de pagar. Si el free es muy pobre, no retiene. Si es muy rico, nadie paga. |
| **Premium = valor irremplazable** | El upgrade debe sentirse como "no puedo vivir sin esto", no como "me estan bloqueando algo basico". |
| **La ficha clinica es la joya** | Es el diferenciador real vs competencia. El PDF y compartir ficha son los triggers de conversion mas fuertes. |
| **Los vets son el canal B2B** | Si el vet recomienda Paw Friend al dueno, la conversion B2C es organica. El plan free del vet debe ser lo suficientemente bueno para que lo use y recomiende. |
| **No cobrar por lo social** | Feed, follows, comunidad, adopcion -- esto genera efecto red. Bloquearlo mata el crecimiento. |

---

## 2. Estado actual vs propuesta

### 2.1. Features B2C (duenos de mascotas)

| Feature | Estado actual | Propuesta | Justificacion |
|---|---|---|---|
| **Registrar mascotas** | Free: 2 / Premium: ilimitadas | **Mantener** | 2 mascotas cubren al 70% de los hogares chilenos. Quien tiene 3+ es power user dispuesto a pagar. |
| **Ficha clinica (ver)** | Free: 1 ano / Premium: completa | **Cambiar a Free: 6 meses / Premium: completa** | 1 ano es muy generoso. 6 meses da suficiente para enganchar pero el historial completo es claramente premium. |
| **Ficha clinica PDF** | Premium only | **Mantener premium** | Es el trigger de conversion #1. El vet pide "trae la ficha" y ahi el dueno necesita el PDF. Conversion natural. |
| **Compartir ficha** | Premium only | **Cambiar: 1 compartida free / ilimitadas premium** | Dar 1 gratis para que el usuario pruebe el flujo y vea el valor. Despues quiere compartir con otro vet o familiar y necesita premium. |
| **Recordatorios** | Free: 5 / Premium: ilimitados | **Cambiar a Free: 3 / Premium: ilimitados** | 5 es demasiado generoso. Con 3 recordatorios (vacuna, desparasitacion, control), el usuario llega al limite rapido si tiene 2 mascotas. |
| **IA comportamiento** | Free: 1/mes / Premium: ilimitado | **Mantener** | 1 al mes es suficiente para probar, genera curiosidad sin regalar todo. |
| **IA asistente vet** | Free: 0 / Premium: ilimitado | **Cambiar: Free: 1 consulta/mes / Premium: ilimitado** | Bloquear 100% la IA es un error. Si el usuario nunca la prueba, no sabe que existe. 1 consulta gratis al mes es el "dealer's hook". |
| **Resumen semanal IA** | Premium only | **Mantener premium** | Es un lujo, no una necesidad. Buen diferenciador premium. |
| **Fee reservas** | Free: 5% / Premium: 0% | **Mantener** | Funciona bien. El ahorro se siente cada vez que reservas. |
| **Pro Analytics** | Premium only | **Cambiar: preview free con datos limitados / completo premium** | El preview ya existe (AnalyticsPreviewCard). Mantener eso free como teaser. El dashboard completo sigue siendo premium. |
| **Export analytics** | Premium only | **Mantener premium** | Es feature de power user. |
| **Sin publicidad** | Premium only | **Mantener premium** | Modelo clasico freemium. Pero OJO: no implementar ads agresivos que arruinen la UX. Banners discretos. |
| **Soporte prioritario** | Premium only | **Mantener premium** | Estandar en SaaS. |
| **Feed social** | Free | **Mantener free** | Efecto red. Bloquearlo mata crecimiento. |
| **Adopcion** | Free | **Mantener free** | Valor social, genera goodwill y PR. Nunca cobrar por esto. |
| **Chat/mensajes** | Free | **Mantener free** | Comunicacion basica es expectativa minima. |
| **Comunidad/grupos** | Free | **Mantener free** | Efecto red. |
| **Mapa servicios** | Free | **Mantener free** | Utilidad basica que retiene usuarios. |
| **Paw Cards** | Free | **Considerar: basicas free / holograficas-raras premium** | Gamificacion. Las cartas basicas enganchan, las raras/holograficas son un premio premium que no afecta funcionalidad. |
| **Memorial** | Free | **Mantener free** | Momento emocional. Cobrar aqui seria un desastre de imagen. |
| **OCR carnet vacunacion** | Free (edge function activa) | **Cambiar: 1 scan free/mes / ilimitados premium** | Tiene costo de API (IA). 1 gratis para probar, despues premium. |
| **QR mascota** | Free | **Mantener free** | Safety feature. Cobrar por la seguridad de una mascota perdida es mala optica. |
| **Notificaciones** (adopcion, follows, mensajes) | Free | **Mantener free** | Son engagement hooks. Mas notificaciones = mas tiempo en la app = mas probabilidad de upgrade. |

### 2.2. Features B2B (veterinarios/proveedores)

| Feature | Free | Individual ($9.900) | Clinica Basica ($29.900) | Clinica Pro ($59.900) | Cambio propuesto |
|---|---|---|---|---|---|
| Clientes max | 20 | 100 | 500 | Ilimitados | **Free: 15** (reducir para acelerar conversion) |
| Reservas/mes | 10 | 50 | Ilimitadas | Ilimitadas | Mantener |
| Invitaciones resena | 0 | 5 | 20 | Ilimitadas | **Free: 2/mes** (que prueben el sistema de resenas) |
| Perfil publico | Si | Si | Si | Si | Mantener (es la vitrina) |
| Directorio | Si | Si | Si | Si | Mantener (genera trafico organico SEO) |
| Posicion destacada | No | No | Si | Si | Mantener |
| Multi-vet | No | No | Si | Si | Mantener |
| Multi-sucursal | No | No | No | Si | Mantener |
| Branding | Ninguno | Basico | Completo | Completo | Mantener |
| Analytics | Ninguno | Basico | Basico | Avanzado | **Individual: basico. Clinica Basica: avanzado** (diferenciar mas los tiers) |
| Comision | 10% | 12% | 10% | 0% | **Revisar: Individual 10%, no 12%** (la comision mayor en un plan pagado se siente como castigo) |
| Reporte semanal vet | ? | ? | ? | ? | **Nuevo: free=no / Individual=basico / Clinica=completo** |
| "Ver como me ven" (preview perfil) | Si | Si | Si | Si | Mantener free (diferenciador unico vs competencia) |

---

## 3. Resumen de cambios propuestos

### 3.1. Cambios en `src/lib/plans.ts` (B2C)

```
medical_history:    '1_year'  →  '6_months'   (free)
share_clinical:     false     →  1             (free, 1 compartida)
max_reminders:      5         →  3             (free)
ai_vet_assistant:   0         →  1             (free, 1/mes)
```

### 3.2. Cambios en `src/lib/plans.ts` (B2B)

```
provider_free.max_clients:                    20  →  15
provider_free.max_review_invitations:          0  →  2
provider_individual.commissionRate:           12  →  10
provider_clinic_basic.analytics_level:   'basic'  →  'advanced'
```

### 3.3. Nuevas features a gatear (no gateadas hoy)

| Feature | Tipo de gate | Archivo principal |
|---|---|---|
| OCR carnet vacunacion | 1 free/mes, ilimitado premium | Edge function `ocr-vaccination-card/` |
| Paw Cards holograficas/raras | Solo premium las genera | `src/components/paw-cards/` |
| Reporte semanal vet (B2B) | No/Basico/Completo por tier | Edge function `generate-weekly-vet-reports/` |

---

## 4. Enforcement actual: brechas detectadas

Features definidas en `plans.ts` pero **sin enforcement real en la UI**:

| Feature | Definida | UI gate | Backend gate | Accion requerida |
|---|---|---|---|---|
| `max_reminders` | Si | **NO** | **NO** | Agregar check en creacion de recordatorio |
| `ai_behavior_analysis` | Si | **NO** | Parcial | Agregar contador mensual + LockedOverlay |
| `ai_vet_assistant` | Si | **NO** | Parcial | Agregar contador mensual + LockedOverlay |
| `medical_history` | Si | **NO** | **NO** | Filtrar queries por fecha en hook de ficha clinica |
| `weekly_summary` | Si | **NO** | Parcial | Edge function ya existe, verificar que chequea plan |
| `ad_free` | Si | **NO** | N/A | No hay ads implementados aun. Posponer. |
| `priority_support` | Si | **NO** | N/A | Badge en UI de soporte/settings |
| `share_clinical` | Si | Parcial | Parcial | Agregar check en frontend al generar token |
| `export_pdf` | Si | Parcial | Parcial | Verificar que edge function rechaza si no es premium |
| `booking_user_fee` | Si | **SI** | Parcial | Ya funciona en BookingModal. OK. |
| `pro_analytics` | Si | **SI** | N/A | LockedOverlay activo. OK. |
| `analytics_export` | Si | **SI** | N/A | LockedOverlay activo. OK (pero handleExport es placeholder). |

**Conclusion**: solo 3 de 13 features tienen enforcement real end-to-end. Las demas son "puertas abiertas con un cartel de premium".

---

## 5. Plan de ejecucion

### Fase 1: Cerrar las puertas abiertas (Prioridad ALTA)
> Sin esto, no hay monetizacion real. Los usuarios "free" acceden a todo.

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| 1.1 | Enforcement `max_reminders`: check en creacion de recordatorio con redirect a /upgrade | `src/pages/Reminders.tsx`, hook de creacion | Bajo |
| 1.2 | Enforcement `medical_history`: filtrar registros por fecha segun plan en queries de ficha clinica | `src/hooks/` (hooks de medical records) | Medio |
| 1.3 | Enforcement `share_clinical`: check plan antes de generar token de compartir | `src/components/medical/` (boton compartir) | Bajo |
| 1.4 | Enforcement `export_pdf`: verificar en edge function `generate-medical-summary` que el usuario es premium | `supabase/functions/generate-medical-summary/` | Bajo |
| 1.5 | Enforcement `ai_vet_assistant`: contador mensual en DB + check antes de llamar edge function | `src/components/ai/PetAssistant.tsx`, edge function | Medio |
| 1.6 | Enforcement `ai_behavior_analysis`: contador mensual + LockedOverlay despues del limite | Componentes de IA de comportamiento | Medio |
| 1.7 | Implementar `handleExport` real en ProDashboard (actualmente es placeholder) | `src/pages/ProDashboard.tsx` | Medio |

### Fase 2: Ajustar limites segun propuesta (Prioridad MEDIA)
> Optimizar la conversion free→premium sin romper UX.

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| 2.1 | Cambiar `max_reminders` free de 5 a 3 | `src/lib/plans.ts` | Trivial |
| 2.2 | Cambiar `medical_history` free de `1_year` a `6_months` | `src/lib/plans.ts` | Trivial |
| 2.3 | Cambiar `share_clinical` free de `false` a `1` (1 compartida gratis) | `src/lib/plans.ts` + logica de conteo | Bajo |
| 2.4 | Cambiar `ai_vet_assistant` free de `0` a `1` (1 consulta/mes gratis) | `src/lib/plans.ts` | Trivial |
| 2.5 | Reducir `provider_free.max_clients` de 20 a 15 | `src/lib/plans.ts` | Trivial |
| 2.6 | Dar 2 invitaciones de resena gratis a vets free | `src/lib/plans.ts` | Trivial |
| 2.7 | Bajar comision Individual de 12% a 10% | `src/lib/plans.ts` | Trivial |
| 2.8 | Subir analytics de Clinica Basica de `basic` a `advanced` | `src/lib/plans.ts` | Trivial |

### Fase 3: Nuevos gates de monetizacion (Prioridad MEDIA)
> Features que hoy son 100% gratis y tienen costo o valor premium.

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| 3.1 | Gate OCR carnet: 1 scan free/mes, ilimitados premium | Edge function `ocr-vaccination-card/`, UI del boton OCR | Medio |
| 3.2 | Gate Paw Cards raras/holograficas: solo premium las desbloquea | `src/components/paw-cards/` | Medio |
| 3.3 | Gate reporte semanal vet por tier B2B | Edge function `generate-weekly-vet-reports/` | Bajo |

### Fase 4: UX de conversion (Prioridad MEDIA-ALTA)
> Hacer que el usuario SIENTA el valor de premium en el momento justo.

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| 4.1 | "Upgrade nudge" contextual: cuando el usuario llega a un limite, mostrar un modal que explique que gana con premium (no solo "bloqueado") | Componente reutilizable `PremiumNudge` | Medio |
| 4.2 | Trial de 7 dias: permitir probar premium gratis por 7 dias (requiere logica de trial en DB + edge function Flow) | `src/lib/plans.ts`, `profiles` table, edge function | Alto |
| 4.3 | Badge premium visible en perfil social (status symbol) | `src/components/social/`, perfil | Bajo |
| 4.4 | Contador de ahorro: "Con Premium te habrias ahorrado $X en fees de reserva este mes" | `src/pages/Upgrade.tsx` o home dashboard | Medio |
| 4.5 | Email/notificacion cuando el usuario esta cerca de un limite (2/3 recordatorios usados, por ejemplo) | Edge function nueva o logica en frontend | Medio |

### Fase 5: Ads para free tier (Prioridad BAJA)
> Solo cuando haya volumen de usuarios. No arruinar la UX.

| # | Tarea | Archivos | Esfuerzo |
|---|---|---|---|
| 5.1 | Definir formato y ubicacion de ads (banner discreto en feed, NO en ficha clinica ni en momentos criticos) | Nuevo componente `AdBanner` | Medio |
| 5.2 | Integrar proveedor de ads (Google AdMob para mobile, AdSense para web) | Capacitor plugin + componentes | Alto |
| 5.3 | Gate `ad_free` ya definido -- solo conectar al componente de ads | `src/lib/plans.ts` ya lo tiene | Bajo |

---

## 6. Orden de ejecucion recomendado

```
Semana 1:  Fase 1 completa (cerrar puertas abiertas)
           → Sin esto, cambiar limites no tiene sentido porque nada se enforce.

Semana 2:  Fase 2 (ajustar limites) + Fase 4.1 (nudge contextual)
           → Los limites nuevos + un buen mensaje de upgrade = conversion inmediata.

Semana 3:  Fase 3 (nuevos gates) + Fase 4.3-4.4 (badge + contador ahorro)
           → Monetizar features con costo real (OCR) y mejorar percepcion de valor.

Semana 4:  Fase 4.2 (trial 7 dias)
           → Esto es el game changer. Reduce friccion de pago masivamente.

Futuro:    Fase 5 (ads) solo cuando haya +1000 MAU.
```

---

## 7. Metricas de exito

| Metrica | Baseline actual | Target 3 meses |
|---|---|---|
| Conversion free→premium | ~0% (gates abiertos) | 3-5% |
| % usuarios que ven upgrade page | Desconocido | 30% de MAU |
| % usuarios que llegan a limite de feature | Desconocido | 50% de free users |
| Revenue mensual B2C | $0 | $50.000+ CLP |
| Revenue mensual B2B | $0 | $100.000+ CLP |
| Churn premium mensual | N/A | <10% |

---

## 8. Lo que NUNCA debe ser premium

Estas features deben ser **siempre gratuitas**, sin excepcion:

1. **QR de mascota perdida** -- seguridad animal, cobrar es indefendible
2. **Adopcion** -- valor social, genera PR y goodwill
3. **Memorial (En Memoria)** -- momento emocional, cobrar seria un desastre de imagen
4. **Feed social y comunidad** -- efecto red, bloquear mata crecimiento
5. **Chat basico** -- expectativa minima de comunicacion
6. **Directorio de vets (ver)** -- genera trafico SEO y es la puerta de entrada
7. **Notificaciones** -- son engagement hooks, mas notificaciones = mas retention
8. **Perfil publico del vet** -- es la vitrina, debe ser visible para todos

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Reducir limites free ahuyenta usuarios nuevos | Media | Alto | Implementar trial 7 dias simultaneamente (Fase 4.2) |
| Gate de IA frustra a usuarios sin dar valor | Baja | Medio | Dar siempre 1 uso gratis/mes para probar |
| Vets free sienten que 15 clientes es poco | Media | Alto | Comunicar bien que es un plan "starter" + onboarding que explica beneficios de upgrade |
| Comision 12%→10% en Individual reduce margen | Baja | Bajo | Se compensa con mayor adopcion del tier pagado |

> **Nota**: Export PDF/CSV en ProDashboard ya esta implementado (CSV + HTML-to-print). No es placeholder.
