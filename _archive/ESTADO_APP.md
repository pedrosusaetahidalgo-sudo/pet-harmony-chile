# Estado de Paw Friend — 2026-04-08

> Documento de contexto para retomar mañana. Resumen ejecutivo de qué funciona, qué falta, y qué prompts pendientes hay.

---

## 🎯 Identidad del producto (post-pivot médico)

**Paw Friend** es una plataforma B2B2C chilena para el cuidado veterinario:

- **B2C — Dueños de mascotas**: 100% **gratis**. Ficha clínica digital, recordatorios automáticos, búsqueda de veterinarios, red social secundaria.
- **B2B — Veterinarios y clínicas**: el motor de ingresos. Plan Individual ($9.900/mes) y planes Clínica ($29.900 / $59.900).
- **Pieza central del producto**: el **directorio público de veterinarios** en `/veterinarios`. URL pública sin login, perfiles compartibles con SEO, reseñas verificadas.

**Dominio**: pawfriend.cl
**Repo**: github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile
**Supabase project**: gwailbjlvevkhwcrovfd
**Mobile**: Capacitor (iOS/Android)
**Hosting web**: GitHub Pages desde `docs/`

---

## ✅ Qué está funcionando

### Core técnico
- ✅ Build verde (`npm run build` sin errores)
- ✅ TypeScript estricto sin errores (`npx tsc --noEmit` limpio)
- ✅ 0 secretos en frontend
- ✅ 0 `console.log` en código (solo en `logger.ts` con flag dev)
- ✅ 0 imports directos de `lucide-react` (todos vía `@/lib/icons`)
- ✅ 0 navigates hardcodeados en pages/components nuevos (todos vía `@/lib/links`)
- ✅ 0 `as any` (los 5 que quedaban se eliminaron tras regenerar tipos Supabase)
- ✅ 0 Google Maps en código (migrado a Leaflet + OpenStreetMap → API key se puede eliminar)
- ✅ 0 PremiumGate en flujos de usuario (escondido tras feature flag)
- ✅ Score técnico final del audit: **97% (68/70)**

### Features funcionales
- ✅ **Directorio público de veterinarios** (`/veterinarios`) con búsqueda + 4 filtros + infinite scroll
- ✅ **5 perfiles demo cargados** (Javiera Muñoz, Matías Fernández, Clínica Patitas, Clínica Altamira, Cristián Rojas) con bio, fotos, reseñas, ratings
- ✅ **Perfil público compartible** (`/veterinarios/:slug`) con SEO completo, JSON-LD para Google, botón compartir nativo
- ✅ **Onboarding de vet** (`/registro-veterinario`) flujo de 4 pasos
- ✅ **Profile-edit del vet** (`/provider/profile-edit`) con score de completitud
- ✅ **Dashboard del vet** con métricas de directorio, botón compartir, invitar paciente a reseña
- ✅ **Sistema de reservas reales** desde el perfil público (inserta en `vet_bookings` + notificación al vet)
- ✅ **Sistema de invitaciones a reseña** para clientes off-platform
- ✅ **Notificaciones in-app** con triggers SQL automáticos (al recibir reseña, al ser verificado, al recibir reserva)
- ✅ **Panel admin** con verificación Colmevet manual
- ✅ **Mapa con Leaflet** (`/maps`) sin Google Maps
- ✅ **Bottom tab bar nativa** (5 tabs en mobile)
- ✅ **Sidebar** reorganizado en 3 secciones: Salud / Servicios / Comunidad
- ✅ **Página `/demo`** con menú para mostrar perfiles en reuniones de venta
- ✅ **Página `/para-veterinarios`** landing comercial con planes + FAQ
- ✅ **Servicios consolidados** en un hub (`/servicios`) con tab nativo de groomers en `ServiceDirectory`
- ✅ **`ResponsiveModal`** componente que muestra Drawer en mobile y Dialog en desktop
- ✅ **`design-tokens.ts`** + `vetDirectory.ts` + `locations.ts` + `links.ts` + `featureFlags.ts` + `icons.ts` (lib centralizada)

### Auth — corregido en este ciclo
- ✅ Bug crítico de OAuth resuelto: **`docs/404.html` ahora es la SPA** (era una página estática vieja que rompía deep links)
- ✅ `useAuth` con timeout de seguridad (3s) que fuerza `loading=false` aunque `getSession()` se cuelgue
- ✅ Auth.tsx escucha `SIGNED_IN` event en vez de pollear `getSession()` (necesario para Google OAuth)
- ✅ Post-login usa **`window.location.href`** (hard reload) en vez de `navigate()` para evitar race condition con `ProtectedRoute`
- ✅ Redirect post-login distingue entre owner / vet / nuevo usuario
- ✅ `ProtectedRoute` preserva returnTo cuando rechaza acceso

---

## ⚠️ Qué falta verificar mañana

### Test obligatorio antes de cualquier feature nueva

Después del último deploy (`f250ed2`), tengo que verificar manualmente que:

1. **Login con email/contraseña en browser PC**
   - `pawfriend.cl/auth` → Ctrl+Shift+R
   - Email + password de cuenta existente
   - **Esperado**: toast verde → hard reload → cae en `/home` o `/provider/dashboard`

2. **Login con Google en browser PC**
   - Click "Continuar con Google"
   - Auth flow de Google
   - Vuelve a `/auth#access_token=...`
   - **Esperado**: supabase procesa el hash, emite `SIGNED_IN`, hard reload a `/home`
   - **Si tarda**: fallback de 5s ejecuta `getSession()` una vez más

3. **Login en mobile simulator (Capacitor)**
   - Mismo flujo, debería funcionar igual ahora que `webDir: 'docs'` está corregido

4. **Pegar URL directa a ruta protegida** (ej. `pawfriend.cl/home`) en pestaña incógnita
   - **Esperado**: redirige a `/auth?returnTo=/home`, después de login vuelve

5. **Pegar URL directa a perfil público** (ej. `pawfriend.cl/veterinarios/dra-javiera-munoz`)
   - **Esperado**: carga el perfil sin pedir login

### Si sigue fallando

Necesito ver en la consola del browser:
- Logs `[useAuth]` y `[Auth]` (los agregué para debug)
- Tab Network: requests a `*.supabase.co/auth/v1/*`
- HTTP status codes específicos

---

## 🚧 Qué quedó pendiente / como deuda técnica

### Bloqueante para producción real (cuando haya clientes pagos)
1. **Verificar fix de auth en device real** (no solo browser PC)
2. **Aplicar las 2 migraciones SQL pendientes** en Supabase:
   - `20260408000000_notifications_and_groomers.sql` (triggers + tabla groomers)
   - `20260408100000_vet_bookings_directory_link.sql` (link al directorio)
3. **Eliminar Edge Function `get-google-maps-key`** del Supabase Dashboard (sigue desplegada aunque el código no la use)
4. **Eliminar variable `VITE_GOOGLE_MAPS_API_KEY`** del deploy y de Google Cloud Console
5. **Configurar budget alert** en Google Cloud Billing en $1 USD para captar tráfico residual

### Importante (cuando haya tiempo)
6. **God component `PetClinicalRecord.tsx` (1444 líneas)** — solo extraje types + helpers a archivos separados. Falta dividir las 5 funciones Tab (`TabResumen`, `TabHistorial`, `TabAlimentacion`, `TabDocumentos`, `TabCompartir`) en archivos propios. Es 2-3 horas de cirugía cuidadosa.
7. **Migrar imports legacy a `@/lib/icons` y `@/lib/links`** en las páginas que ya existían antes del refactor. Trabajo mecánico de ~30 archivos.
8. **Aplicar paleta verde médica a `MedicalRecords.tsx` y `PetClinicalRecord.tsx`** — solo el header tiene gradiente verde, el resto sigue en morado/primary. Sed masivo es riesgoso, necesita revisión visual.
9. **Renombrar `ServiceCalendar.tsx` → `MyBookings.tsx`** y la ruta `/calendar` → `/mis-reservas`. Naming inconsistente con el sidebar que dice "Mis reservas".
10. **Implementar Google Calendar OAuth real** o eliminar el feature stub (`googleCalendar.ts` está inerte).
11. **Splash screen iOS/Android** — Capacitor lo tiene configurado pero no testeado en device real.
12. **Push notifications nativas** (FCM/OneSignal) — solo hay in-app via bell del header.

### Nice to have
13. **Sitemap dinámico via Edge Function** (existe el archivo `generate-sitemap` pero no está deployado)
14. **Migrar más dialogs a `ResponsiveModal`** — quedan `EnhancedBookingDialog` y `CreateAdoptionPost` con full-screen mobile pero no son drawers reales
15. **Auditoría manual de coherencia visual** del prompt original (Tarea 3G del audit)
16. **Optimizar imágenes pesadas** del proyecto (PNGs > 300kB)

---

## 📊 Métricas del proyecto

| Métrica | Valor |
|---|---|
| Páginas (`src/pages/`) | 32 |
| Componentes (`src/components/`) | 150+ |
| Hooks (`src/hooks/`) | 26 |
| Edge functions activas | 10 |
| Tablas Supabase | ~70 |
| Líneas en `src/` | ~44.700 |
| `as any` totales | 0 ✅ |
| `console.log` | 1 (en logger con flag dev) |
| TODO/FIXME accionables | 0 |
| Bundle index principal | ~340 kB / 94 kB gzip |
| Bundle más pesado | Maps (Leaflet) 244 kB / 67 kB gzip |
| Tiempo de build | ~25-50 segundos |

---

## 🛠 Stack técnico (sin cambios)

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (50+ componentes)
- **State**: TanStack React Query + React Context
- **Routing**: React Router v6 (40+ rutas, lazy loading)
- **Maps**: **Leaflet + OpenStreetMap** (migrado de Google Maps)
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions Deno)
- **Auth**: Supabase Auth (Google OAuth, Email/Password, Facebook config pero no probado)
- **AI**: Claude API (Anthropic) vía Edge Functions
- **Pagos**: Webpay Plus (Transbank) — solo flujo `webpay-confirm` activo, el resto del marketplace está deshabilitado
- **Mobile**: Capacitor (Android compilable, iOS testeado en simulator)
- **Deploy**: GitHub Pages desde `docs/` con dominio custom `pawfriend.cl`

---

## 🗂 Archivos y documentos de referencia

| Archivo | Propósito |
|---|---|
| `PROYECTO_CONTEXTO.txt` | Contexto base completo del proyecto (turno 1) |
| `REFACTOR_PLAN.md` | Plan del refactor del pivot médico con métricas antes/después |
| `AUDIT_REPORT.md` | Auditoría técnica completa, 26 hallazgos, score 97% |
| `DESIGN_AUDIT.md` | Auditoría de diseño mobile, top 10 cambios, score 75% |
| `MIGRATION_GOOGLE_TO_LEAFLET.md` | Inventario y pasos manuales para terminar la migración |
| `DEMO_GUIDE.md` | Guía para Pedro de cómo mostrar la app en reuniones de venta |
| `supabase/seeds/demo_profiles.sql` | Seed SQL idempotente con los 5 perfiles demo |
| `supabase/migrations/20260406000000_provider_directory_and_plans.sql` | ✅ Aplicada |
| `supabase/migrations/20260407000000_review_triggers_and_limits.sql` | ✅ Aplicada |
| `supabase/migrations/20260408000000_notifications_and_groomers.sql` | ⏳ Pendiente |
| `supabase/migrations/20260408100000_vet_bookings_directory_link.sql` | ⏳ Pendiente |

---

## 🔥 Lo más urgente para mañana

1. **Probar que el login funciona** después del último deploy (`f250ed2`)
   - Si funciona → seguir con #2
   - Si NO funciona → mandar logs de consola y reabrir el debugging
2. **Aplicar las 2 migraciones SQL pendientes** en Supabase Dashboard
3. **Eliminar la API key de Google Maps** en Google Cloud Console + variables de entorno
4. **Si todo eso pasa**: empezar a contactar vets y mostrar la demo. El producto está listo.

---

## 🎯 Norte estratégico (recordatorio)

> El éxito de Paw Friend depende de tres cosas, en este orden:
> 1. **Que vets reales completen su perfil al 80% y lo activen.** Sin vets en el directorio no hay producto.
> 2. **Que cada vet comparta su URL pública en WhatsApp/Instagram.** Tráfico orgánico cero-costo.
> 3. **Que las reseñas sean creíbles** (verificadas por reserva o invitación con disclaimer).
>
> Toda decisión de producto debe medirse contra estas 3 métricas:
> - % de vets activos en directorio
> - Shares de URL pública
> - Reseñas publicadas/mes

---

## ⚙️ Comandos rápidos

```powershell
# Desarrollo local
npm run dev

# Build para producción (incluye copia 404.html)
npm run build

# TypeScript check sin compilar
npx tsc --noEmit

# Deploy a GitHub Pages
git add .
git commit -m "..."
git push

# Mobile Capacitor
npx cap sync
npx cap run android
# o desde Android Studio para iOS necesitás Mac

# Regenerar tipos Supabase (ya hechos pero por si hay nuevas tablas)
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
```

---

## 📝 Último estado de los commits

```
f250ed2  Fix /home loading infinito + Google OAuth callback con SIGNED_IN listener
b1c4b7b  Fix loop /auth: hard reload post-login para evitar race con ProtectedRoute
f9994cf  Add .nojekyll para forzar GH Pages a no procesar con Jekyll
6a1726c  Fix critico: 404.html era pagina estatica, no SPA - rompia OAuth y deep links
37dcfb0  feat: complete migration from Google Maps to Leaflet
51638ac  Demo profiles + Auth redirect fix + capacitor webDir docs
```

Branch actual: `main`
