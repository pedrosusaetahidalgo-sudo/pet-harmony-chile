# Rediseño Paw Friend — Fases 1-5

## 1. Resumen ejecutivo

Se ejecutó el rediseño dirigido por el feedback de Joao en 5 fases, con 4 commits (la Fase 4 no generó commit porque la auditoría encontró el código ya limpio).

- **Fase 1**: Home.tsx refactorizado a dashboard condensado (header mínimo, pet switcher, status cards 2x2, alerts, slot activity feed, quick actions horizontal).
- **Fase 2**: Nuevo hook `useOrganicRewards` (fire-and-forget, no bloqueante) + integrado en AddPet, AddMedicalRecord, CreateReviewForm.
- **Fase 3**: Migración SQL `pet_activities` + `pet_activity_cheers`, componente `<ActivityFeed>`, página `/actividad`, wire en sidebar y Home, inserts de actividad centralizados en `useOrganicRewards`.
- **Fase 4**: Auditoría de consolidación de servicios — sin cambios, el código ya estaba limpio.
- **Fase 5**: Este reporte.

TypeScript (`npx tsc -b`) limpio al final de cada fase. No se tocó la ficha médica PDF, el directorio público de vets, ni el modelo B2B.

## 2. Home: antes / después

### Antes (mobile y desktop)
- Header hero grande con gradiente verde, CTA "Agregar Mascota" grande, bloque con subtítulo y contador de mascotas.
- Empty state verde con paragraph largo.
- Tarjeta "Tus mascotas están al día" cuando no había recordatorios.
- Health alerts.
- Próxima cita veterinaria como tarjeta standalone grande.
- Quick Actions 2x2 con gradientes coloridos + subtítulo.
- Paw Game widget (deshabilitado por flag).
- PartnerAd.
- Grid 2-col Mis Mascotas + Próximas Citas, con asistente IA inline.
- Recommendations (ya removido antes).

### Después
**Mobile**:
1. Header mínimo (avatar 10x10 + saludo + nivel en una línea).
2. Si no hay mascotas: empty state compacto con CTA "Agregar tu primera mascota".
3. Si hay mascotas: pet switcher horizontal (tabs chicas con avatar) o nombre plano si hay 1.
4. Status cards 2x2: Próxima cita · Vacunas · Ficha médica · Racha paseos.
5. Health alerts (si hay).
6. Actividad de la comunidad (`<ActivityFeed limit={3} />`).
7. Acciones rápidas: scroll horizontal (Reservar vet / Ficha médica / Mapa / Agregar mascota).

**Desktop** (`lg:` breakpoint): status cards pasan a 4x1; acciones rápidas pasan a grid 4-col. No hay sidebar nuevo — el AppSidebar existente queda intacto.

### Removido del Home
- Hero grande con gradiente.
- Cards descriptivas con paragraphs.
- Tarjeta standalone "Próxima cita veterinaria" (ahora es una Status Card).
- Quick Actions con gradientes + descripciones.
- Paw Game widget inline.
- PartnerAd en el home.
- Grid "Mis Mascotas" + "Próximas Citas" + asistente IA inline (siguen accesibles desde otras páginas).

### Agregado
- `<StatusCard>` reutilizable (`src/components/home/StatusCard.tsx`).
- Pet switcher.
- Slot para `<ActivityFeed limit={3} />`.
- CTA única y discreta hacia PawGame vía la card "Racha paseos".

## 3. Cambios de navegación

- **Entró**: item "Actividad" en sidebar bajo Comunidad (`/actividad`).
- **Salió**: nada del sidebar/bottom bar existente.
- **Movido**: el acceso a PawGame desde el Home ahora es una sola card ("Racha paseos"), no un widget completo.

Legacy redirects de servicios ya presentes (confirmados en Fase 4):
- `/dog-walkers` → `/services/walkers`
- `/home-vets` → `/services/vets`
- `/dog-sitters` → `/services/sitters`
- `/dog-trainers` → `/services/trainers`
- `/servicios/peluqueria` → `/services/groomers`

Sidebar: un solo item "Buscar servicios" → `/servicios`. Bottom bar sin duplicados.

## 4. Tabla `pet_activities`

### activity_types disponibles
| Tipo | Descripción | Disparador |
|---|---|---|
| `walk` | Paseo registrado | `useOrganicRewards.reward({ kind: "walk_logged" })` (cuando exista un flujo de log-walk) |
| `vet_visit` | Visita al veterinario | `AddMedicalRecord` (cualquier record_type) vía `reward({ kind: "medical_record_added" })` |
| `vaccine` | Vacuna aplicada | `AddMedicalRecord` cuando `record_type === "vacuna"` → `reward({ kind: "vaccine_logged" })` |
| `medication` | Medicación | Reservado — no hay flujo aún |
| `grooming` | Peluquería/baño | Reservado — no hay flujo aún |
| `weight_check` | Control de peso | Reservado |
| `achievement` | Logro (perfil completo) | `AddPet` crear → `reward({ kind: "pet_profile_completed", pct: 60 })` |
| `streak_milestone` | Hito de racha | Reservado |

### Tabla auxiliar `pet_activity_cheers`
- PK compuesta `(activity_id, user_id)` — un user solo puede aplaudir una vez.
- Trigger `bump_pet_activity_cheers` sincroniza `pet_activities.cheers_count` en INSERT/DELETE.

Los inserts a `pet_activities` están centralizados en `useOrganicRewards` y son fire-and-forget. Si la migración aún no está aplicada en la base remota, el insert falla silenciosamente y solo el logger lo registra (el flujo del usuario no se rompe).

## 5. Checklist FASE 3.5 — NO implementada (documentada para futuro)

- [ ] **Tabla `pet_friendships`** y feed restringido a amigos de mascotas. Hoy el feed es "todos los usuarios autenticados" (policy `anyone authenticated reads activities (v1)`). Requiere: tabla `pet_friendships`, policy SELECT basada en follower, UI de "solicitar amistad entre mascotas".
- [ ] **Job diario de notificaciones de engagement** con CTA ("Pelusa lleva 10 días sin vet visit, ¿agendamos?"). Requiere edge function cron + tabla `notification_queue` + política de opt-out.
- [ ] **Login con Instagram / OAuth IG**. Requiere configurar provider en Supabase Auth + branding en `/auth`.
- [ ] **"Personas que quizás conozcas" vía contactos**. Requiere permiso nativo Capacitor + hashing de phone numbers en edge function + matching server-side.

## 6. Preguntas abiertas para Pedro

1. **Privacidad del feed**: actualmente cualquier usuario autenticado ve todas las actividades. ¿Confirmás que está OK para v1 o preferís limitar a seguidores desde el principio?
2. **Completitud de ficha**: el porcentaje se calcula sobre 10 campos básicos de `pets` (`name`, `species`, `breed`, `birth_date`, `gender`, `size`, `color`, `weight`, `photo_url`, `microchip_number`). ¿Querés ponderar distinto? ¿Incluir `medical_records` count?
3. **Estado de vacunas**: hoy se deriva de `pet_reminders` con `type='vaccine'`. Si hay un reminder vencido no-completado, se muestra como "Pendiente". ¿Querés usar `medical_records` en vez (última vacuna aplicada) como fuente de verdad?
4. **Racha de paseos**: se lee de `user_stats.streak_days` (ya existía). No hay flujo "log walk" en la app hoy, así que el contador no avanza orgánicamente. ¿Creamos un flujo explícito de registrar paseo en una fase posterior?
5. **Reward de `walk_logged`**: el hook está listo pero no hay caller. ¿Esperamos a Fase 3.5 o creamos ya un botón "registrar paseo" discreto en Home?
6. **Toasts de reward**: ¿querés un tono más sobrio (sin "+5 puntos" explícito) o así está bien?

## 7. Comandos manuales pendientes

### 7.1. Aplicar migración SQL en Supabase

Desde el dashboard de Supabase (SQL Editor) ejecutar el contenido completo de:

```
supabase/migrations/20260411000000_pet_activities_social.sql
```

O vía CLI:

```bash
supabase db push
```

Mientras no esté aplicada, el `<ActivityFeed>` muestra el empty state ("Todavía no hay actividad. ¡Sé el primero!") o un error manejado por `describeSupabaseError`, y los inserts fire-and-forget solo loguean el fallo.

### 7.2. Regenerar tipos Supabase (opcional, después de aplicar la migración)

```bash
supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
```

Una vez que `pet_activities` esté en `types.ts`, se pueden eliminar los casts `as unknown as ...` en:
- `src/hooks/useOrganicRewards.ts`
- `src/components/social/ActivityFeed.tsx`

### 7.3. Push al remoto

```bash
git push origin worktree-agent-a4600853
```

(No se hizo push desde este worktree — queda a criterio del operador.)

### 7.4. Edge functions

No se tocaron edge functions. No hay deploy pendiente por esa vía.
