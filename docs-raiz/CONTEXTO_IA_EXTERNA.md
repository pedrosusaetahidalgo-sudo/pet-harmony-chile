# Contexto Paw Friend para IA externa (Perplexity / Claude.ai / ChatGPT)

> Pegar este bloque como "memoria" o primer mensaje al iniciar una conversacion
> con una IA externa que NO tiene acceso al repo. Cubre producto, stack,
> monetizacion, roles y estado tecnico al 2026-04-21.
>
> Actualizado: 2026-04-21 (tarde, tras Booking Master Plan V3 + anti-spam).
> Mantener sincronizado cuando cambie el modelo de negocio, los roles o el
> stack. Para el detalle tecnico completo, la fuente de verdad sigue siendo
> `CLAUDE.md` + `INDEX.md` + `MAPA_FUNCIONAL_COMPLETO.md`.

---

## 1. Quien soy y que es Paw Friend

- **Fundador**: alias publico "Paw Founder". Dev solo, apalancado en IA.
- **Producto**: Paw Friend, app para dueños de mascotas en Chile.
  Ficha clinica digital + red social + directorio de veterinarios +
  reservas + adopcion (refugios) + gamificacion opcional.
- **Dominio**: pawfriend.cl (GitHub Pages, deploy desde `docs/`).
- **Contacto**: pawfriendcl@gmail.com.
- **Empresa**: SpA "SUSAETA GARNHAM SOFTWARE ENGINEERING" (RUT 78.328.659-9).
  Domicilio SII: Luis Pasteur 6111 Dp 201, Vitacura.
- **Lanzamiento publico**: 1 junio 2026 (modo autonomo).

## 2. Stack tecnico (verificado)

- Frontend: React 18 + TypeScript 5.8 + Vite 5 (plugin react-swc).
- UI: Tailwind 3 + shadcn/ui (Radix + CVA) + lucide-react.
- Estado servidor: @tanstack/react-query 5. Forms: react-hook-form + zod.
- Rutas: react-router-dom 6. Graficos: Recharts 2. Mapas: Leaflet.
- Backend: Supabase (Postgres + Auth + Edge Functions Deno + Storage).
  Proyecto: `gwailbjlvevkhwcrovfd`.
- Pagos: **Flow.cl** (NO Webpay). Edge fns `flow-create-subscription` +
  `flow-webhook`. Credenciales como secrets de Supabase.
- Mobile: Capacitor 7 (Android compilable, iOS testeado en simulator).
- Observabilidad: Sentry + PostHog + Firebase Analytics.
- Tests: Vitest (unit) + Playwright (E2E, 336/336 verde).

No hay: Zustand, Redux, Next.js.

## 3. Modelo de negocio (pivot 2026-04-19)

Norte: app **100% gratis** para dueños de mascota. Monetizacion opcional
y ninguna feature clinica detras de paywall.

**5 motores de monetizacion**:
1. **Donaciones voluntarias** en `/donaciones`.
2. **Paw Member** ($3.990/mes o $39.900/año) — badge 💛 + descuentos de
   alianzas. No desbloquea features.
3. **B2B Veterinarios individuales**:
   - Basica $0/mes, 10% comision, 5 pacientes, 1 seat.
   - Premium $9.900/mes, 5% comision, ilimitado, 1 seat.
4. **B2B Veterinarias (clinicas)**:
   - Clinica $19.900/mes, 3% comision, 500 pacientes, 3 seats, bulk import.
   - Pro Max $29.900/mes, 0% comision, ilimitado seats, multi-branch.
5. **Publicidad** con partners (solo si hay volumen).

**3 alianzas**:
- **Paw Voices**: creadores/influencers peludos (barter exposicion).
- **Paw Companys**: sponsors mensuales ($49.9k / $99.9k / $199.9k CLP).
- **Paw Partners**: tiendas/servicios con descuentos a Paw Members.

Tabla compartida `paw_companys` con `partnership_type ∈ {sponsor, partner}`.

## 4. 4 roles / 4 tipos de clientes

1. **Owner** (dueño) — default. Experiencia entretenida (gamificacion,
   Paw Cards, feed social). Todo gratis.
2. **Provider** (vet/profesional individual) — dashboard clinico, agenda,
   pacientes. Sin gamificacion.
3. **Shelter** (refugio/hogar de adopcion) — dashboard operativo, bulk
   import, transferencia al adoptante. Cuenta gratis siempre.
4. **Admin** — panel interno (tabla `admin_access.is_active=true`).

Un usuario puede tener doble rol. Toggle en Header. Persiste en
`localStorage` key `pf_active_role`. Hook `useActiveRole()`.

## 5. Rutas clave (de `src/App.tsx`)

- Publicas (sin login, 22): `/`, `/auth`, `/veterinarios`, `/veterinarios/:slug`,
  `/para-veterinarios`, `/refugios-hogares`, `/refugios/:slug`,
  `/paw-partners`, `/aplicar`, `/donaciones`, `/paw-voices`,
  `/paw-companys`, `/paw-core`, `/qr/:token`, `/paw-card/:pawCardId`,
  `/medical-share/:token`, `/resena/:token`, `/faq`, legales.
- Protegidas (40): `/home`, `/feed`, `/my-pets`, `/ficha/:petId`,
  `/calendario`, `/rutinas`, `/chat`, `/profile`, `/paw-member`,
  `/reportes`, `/panel-pro`, `/mis-reservas`, etc.
- Provider (3): `/provider/dashboard`, `/provider/pacientes`, `/provider/profile-edit`.
- Shelter (varios): `/shelter/dashboard`, `/shelter/bulk-import`,
  `/shelter/transfer/:petId`.
- Admin (2): `/admin`, `/demo`.

## 6. Edge Functions activas (29 + _shared)

Pagos: `flow-create-subscription`, `flow-webhook`, `flow-create-donation`.
IA: `pet-assistant`, `breed-tips`, `bereavement-assistant`, `ocr-vaccination-card`,
`medical-suggestions`, `generate-medical-summary`, `generate-medical-zip`,
`process-consultation-transcript`.
Operacion vet: `create-patient`, `send-pet-invitation`, `send-lead-outreach`,
`generate-vet-patient-summary`, `generate-weekly-vet-reports`,
`verify-vet-document`, `verify-service-provider`, `moderate-service-promotion`.
Owner: `generate-weekly-owner-reports`, `reminder-cron`, `send-whatsapp-reminder`.
Push/notifs: `send-push-notification` (disparada desde triggers SQL de booking).
Google Calendar: 4 fns OAuth/sync. Plataforma: `log-error`,
`generate-sitemap`, `generate-shelters`, `notify-pitch-application`.

Todas envueltas con `withTelemetry` (2026-04-17).

## 6.1. Notificaciones (prefs granulares + dedup)

- Tabla `user_notification_prefs` (mig `20260723000000`): 3 categorias
  (`transactional`, `reminders`, `marketing`) × 3 canales (`push`, `email`,
  `whatsapp`). Default permisivo para transactional.
- Funcion `user_can_receive_notification(user_id, category, channel)`:
  toda logica de envio (triggers SQL, edge fns, crons) la chequea antes
  de disparar.
- Tabla `notification_attempts` con UNIQUE index por
  `(booking_type, booking_id, reminder_type, channel)` donde status ∈
  `sent|delivered|read` → dedup automatico. Triggers insertan primero
  y solo si gana el INSERT disparan el push real.
- Aplica a: push al provider on new booking, push al owner on
  confirmed/cancelled, daily digest cron, reminder-cron.

## 7. Reglas criticas (overrides de CLAUDE.md)

- `docs/` es **output de build** (`npm run build`). Nunca editar a mano.
- Migraciones SQL en `supabase/migrations/` con timestamp; las aplica
  Pedro manualmente via Supabase Dashboard. Nunca `DROP TABLE` ni
  `DELETE FROM` sin `WHERE` en tablas con datos de usuarios.
- **Proteger datos de usuarios existentes** (regla 9.7): migrar datos
  al cambiar esquema, defaults en columnas nuevas NOT NULL, fallback
  al renombrar keys de localStorage.
- Copy en **espanol chileno** (tuteo: tu/tienes/puedes). NO voseo ni
  vosotros. Terminos: "comuna", "ficha clinica", "recordatorio".
- Nunca pegar API keys/JWTs en chat ni en commits.
- `diagrams/FLUJO_COMPLETO.mmd` es fuente de verdad unica del flujo
  end-to-end; debe ser un solo bloque Mermaid pegable en mermaid.live.
- PowerShell no soporta heredoc bash (Pedro corre Windows).
- Comandos Supabase CLI siempre con `npx` (`npx supabase ...`).

## 8. Estado tecnico (2026-04-21)

- Ramas: `main` al dia. Ultimo commit: `91f1bd3d feat(booking): Master
  Plan V3 completo — fases 0-5 + anti-spam`.
- Recientes (semana 2026-04-21):
  - Booking Master Plan V3 fases 0-5: timezone por provider,
    availability rules + lead windows, RPC `get_available_slots_range`,
    RPC `create_booking`, RPC `cancel/reschedule`, view `v_all_bookings`,
    push al provider on new booking, auto-cancel cron de pending.
  - Anti-spam en push triggers: chequeo `user_notification_prefs` +
    dedup via `notification_attempts` UNIQUE index (mig `20260725000011`).
  - Vault para service_role_key (mig `20260725000009/10`): nunca JWT
    hardcoded en triggers SQL.
  - `user_notification_prefs` granular (3 categorias × 3 canales).
  - Co-ownership de mascotas: invite por email (Resend), dialog
    accept/reject, seccion compartir en ficha.
  - Daily digest cron + smoke shelter/admin/gate en E2E.
  - Fix CHECK `pet_reminders.type` sin 'deworming' (bloqueaba crear
    mascota) + 3 prevenciones: smoke SQL post-migracion, E2E con
    triggers + RLS reales, widget admin de violaciones de schema.
  - E2E realignment: 21 tests corregidos por drift de UI.
- Tests: `npm run test:ci` ~176 unit verdes; Playwright 336/336.
- Type-check: `npx tsc -b` 0 errores.
- Lint: 0 errores, ~85 warnings a11y.
- Build: pasa, ~2m 31s. Bundle principal ~335 kB / 100 kB gzip.
- Migraciones: ultima aplicada serie `20260725000011`
  (booking_push_antispam). Pitch applications `20260625000000` ya en prod.
- Rutas totales: 67.

## 9. Que esta en curso (2026-04-21)

- Prod: app sana para crear mascotas (fix 2026-04-20/21).
- Booking V3 desplegado con triggers seguros (prefs + dedup).
- Pendientes operacionales Pedro (no Claude):
  - Aplicar migraciones `20260725000000-011` desde Supabase Dashboard
    si aun no estan todas en prod.
  - Migrar cuenta Flow a SpA (riesgo fiscal de cuenta personal).
  - Apple Developer + Play Console + assets para stores.
  - Verificacion Meta WhatsApp.
- Roadmap 90d en `docs-raiz/planes/` (28 iniciativas priorizadas por RICE).
- Testimonios multi-rol: Sofia Rosi (vet beta) + 2 vets mas + 3 duenos.

## 10. Mi perro y mi gata

- **Kai** — pastor suizo blanco (mi perro real, aparece en prod).
- **Ema** — gata (tambien real).

En copy publico uso alias "Paw Founder", no mi nombre real.

## 11. Documentos clave del repo para profundizar

- `CLAUDE.md` — manual operativo completo (fuente de verdad).
- `INDEX.md` — indice maestro de docs.
- `MAPA_FUNCIONAL_COMPLETO.md` — mapa de modulos y flujos.
- `AGENTS.md` — config para agentes IA externos (Cursor, Copilot).
- `diagrams/FLUJO_COMPLETO.mmd` — diagrama Mermaid end-to-end.
- `docs-raiz/planes/` — roadmap 90d y specs priorizadas.
- `pitch-inversionistas/` — decks y docs para CORFO, Start-Up Chile,
  angels/VCs, Paw Companys, Paw Voices, Paw Partners.

---

**Uso en Perplexity / Claude.ai**: pega el bloque arriba. Si tu prompt
es sobre un tema especifico, agrega solo la seccion relevante (ej:
"monetizacion" → seccion 3; "roles" → seccion 4; "stack" → seccion 2).
