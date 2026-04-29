# ANALYTICS_GROWTH_EVENTS.md — Plan de Analytics y Eventos de Crecimiento — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Diagnostico — estado actual de analytics

### Sistema A: analytics.ts — track() es NO-OP en produccion

**Archivo**: `src/lib/analytics.ts`

**Descripcion**: El modulo define ~40 eventos y una funcion `track()`. Sin embargo, `track()` solo hace `console.log()` en modo desarrollo y retorna sin hacer nada en produccion (`NODE_ENV === 'production'`). Ningun evento definido en este modulo llega a ningun sistema de analitica en produccion.

**`identify()` nunca se llama**: La funcion de identificacion de usuarios tampoco esta conectada. No hay perfil de usuario asociado a los eventos.

**Estado**: 14 eventos son invocados en el codigo. Todos van a `/dev/null` en produccion.

### Sistema B: useAnalyticsTracker — este SI esta vivo en produccion

**Archivo**: `src/hooks/useAnalyticsTracker.ts`

**Descripcion**: Este hook escribe directamente en la tabla `analytics_events` de Supabase. Registra:
- `page_view` — cada vez que el usuario navega a una ruta
- `page_leave` — cuando el usuario sale de una ruta
- `session_start` / `session_end` — por sesion de usuario

**`trackEvent()` existe pero nadie lo llama**: El hook exporta una funcion `trackEvent()` para eventos custom, pero no hay ningun componente que la use actualmente.

**Tabla analytics_events**: Esta en Supabase y tiene datos reales de navegacion. Es la unica fuente de datos de comportamiento que existe en produccion hoy.

### No hay proveedor externo de analytics

`package.json` confirma la ausencia de: PostHog, Mixpanel, Amplitude, Segment, Google Analytics, Heap. Solo Sentry (errores) y la tabla Supabase propia.

---

## Auditoria de eventos — estado completo

### Eventos llamados en codigo pero que van a consola (analytics.ts)

| Evento | Donde se llama | Impacto si se conecta |
|---|---|---|
| USER_REGISTERED | Auth.tsx | Conversion de registro |
| USER_LOGGED_IN | Auth.tsx | Sesiones activas |
| PET_CREATED | AddPet.tsx | Activacion (first pet) |
| PET_PROFILE_VIEWED | MyPets.tsx | Engagement |
| REMINDER_CREATED | Reminders.tsx | Feature usage |
| REMINDER_COMPLETED | Reminders.tsx | Completion rate |
| FEED_POST_CREATED | Feed.tsx | Social engagement |
| FEED_POST_LIKED | Feed.tsx | Social engagement |
| VET_DIRECTORY_SEARCHED | DirectorioVets.tsx | Intencion B2B |
| VET_PROFILE_VIEWED | VetProfile.tsx | Lead qualification |
| UPGRADE_INITIATED | Upgrade.tsx | Top of funnel Premium |
| PREMIUM_CONVERTED | (post-pago) | METRICA CRITICA |
| AI_ASSISTANT_USED | PetAssistant component | Feature adoption IA |
| OCR_USED | OCR component | Feature adoption OCR |

### Eventos definidos pero NUNCA llamados — oportunidades criticas perdidas

| Evento | Por que importa |
|---|---|
| CLINICAL_PDF_DOWNLOADED | Es la joya de la corona — sin datos de uso del diferenciador principal |
| CLINICAL_RECORD_VIEWED | Sin saber cuantas fichas se ven por sesion |
| MEDICAL_RECORD_ADDED | Sin datos de que tan activos son los usuarios con la ficha |
| VET_QUICK_NOTE_CREATED | Nueva feature — sin instrumentacion desde el inicio |
| IN_APP_FEEDBACK_SUBMITTED | Nueva feature — sin instrumentacion |
| MISSION_COMPLETED | Gamificacion sin metricas de completion |
| PAW_CARD_COLLECTED | Sin datos de engagement de Paw Cards |

---

## North Star Metric recomendada

**Weekly Active Medical Records Updated (WAMRU)**

Definicion: Numero de fichas clinicas con al menos una actualizacion en los ultimos 7 dias.

Por que es la North Star:
- Captura el valor core del producto (ficha medica activa)
- Distingue usuarios activos de usuarios registrados pero inactivos
- Correlaciona con retencion a largo plazo (usuarios que mantienen la ficha activa son menos propensos a churnar)
- Incentiva el flujo mas valioso: dueno -> ficha -> veterinario

**Metricas secundarias**:
1. PDF Downloads por semana (engagement con la joya de la corona)
2. Conversion Free -> Premium rate
3. Vet Directory searches -> Vet profile views (funnel B2B)
4. Weekly active vets (provider engagement)

---

## Plan de 30 eventos con prioridad de implementacion

### Grupo 1 — Criticos para negocio (implementar primero)

| Evento | Trigger | Datos a capturar |
|---|---|---|
| `clinical_pdf_downloaded` | Click en MedicalSummaryButton | pet_id, user_plan |
| `clinical_record_viewed` | Carga de /ficha/:petId | pet_id, tab_inicial |
| `medical_record_added` | Submit exitoso en cualquier tab de ficha | pet_id, record_type |
| `premium_converted` | flow-webhook procesa pago exitoso | plan_id, precio, fuente |
| `upgrade_initiated` | Click en boton de upgrade | fuente (banner/menu/block) |
| `upgrade_abandoned` | Llega a /upgrade pero no hace click en pagar | — |

### Grupo 2 — Activacion y onboarding (implementar segundo)

| Evento | Trigger |
|---|---|
| `user_registered` | Registro exitoso |
| `first_pet_added` | Primera mascota creada |
| `onboarding_completed` | Fin del flujo de onboarding |
| `vet_profile_completed` | Vet completa su perfil publico (100%) |

### Grupo 3 — Engagement y retencion (implementar tercero)

| Evento | Trigger |
|---|---|
| `reminder_created` | Alta de recordatorio/aviso |
| `reminder_completed` | Recordatorio marcado como hecho |
| `vet_directory_searched` | Busqueda con filtros |
| `vet_profile_viewed` | Click en perfil de vet |
| `medical_share_created` | Token de ficha compartida generado |
| `medical_share_viewed` | Token de ficha compartida accedido |

### Grupo 4 — Features Labs y gamificacion (implementar cuarto)

| Evento | Trigger |
|---|---|
| `mission_completed` | Mision gamificacion completada |
| `paw_card_collected` | Paw Card obtenida |
| `paw_game_played` | Session de PawGame |
| `vet_quick_note_created` | Nueva quick note por vet |
| `in_app_feedback_submitted` | Feedback enviado |
| `ocr_used` | OCR carnet de vacunacion usado |
| `ai_assistant_used` | Asistente IA consultado |
| `breed_tips_viewed` | Tips de raza vistos |

---

## Recomendacion de implementacion

### Opcion A — Conectar track() a PostHog (RECOMENDADA)

PostHog tiene free tier generoso (1M eventos/mes), es open-source, y tiene SDKs de React bien mantenidos.

```typescript
// src/lib/analytics.ts — modificacion minima
import posthog from 'posthog-js'

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, properties)
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  posthog.identify(userId, traits)
}
```

```bash
npm install posthog-js
```

Inicializar en `main.tsx`:
```typescript
import posthog from 'posthog-js'
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only'
})
```

**Ventajas**: Funciona con el codigo existente de analytics.ts sin cambiar ninguno de los 14 puntos de llamada. Solo cambiar track() y identify().

### Opcion B — Piping a tabla analytics_events de Supabase

Usar el `trackEvent()` que ya existe en `useAnalyticsTracker` para todos los eventos custom.

```typescript
// Modificar analytics.ts para usar trackEvent de Supabase
import { useAnalyticsTracker } from '@/hooks/useAnalyticsTracker'

// PROBLEMA: analytics.ts es una funcion, no un hook — no puede usar hooks
// Solucion: convertir track() a una funcion que llame al endpoint de Supabase directamente
```

**Desventaja**: Requiere mas trabajo de infraestructura (dashboards, queries custom). PostHog da dashboards listos.

---

## Donde llamar identify()

`identify()` debe llamarse una vez cuando el usuario inicia sesion o cuando se carga el perfil. El mejor lugar:

```typescript
// src/hooks/useAuth.tsx — post login exitoso
track('user_logged_in', { method: 'email' })
identify(user.id, {
  email: user.email,
  plan: profile?.plan_id,
  is_premium: profile?.is_premium,
  is_provider: !!providerProfile,
  created_at: user.created_at,
})
```

---

## Instrumentacion de la joya de la corona — ejemplo concreto

```typescript
// src/components/medical/MedicalSummaryButton.tsx
import { track } from '@/lib/analytics'

const handleDownload = async () => {
  track('clinical_pdf_downloaded', {
    pet_id: petId,
    user_plan: currentPlan,
    source: 'ficha_clinica',
  })
  // ... logica de descarga existente
}
```

Este cambio de 3 lineas es el mas valioso del proyecto completo desde una perspectiva de datos de negocio.
