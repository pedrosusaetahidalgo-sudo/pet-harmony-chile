# Contexto Paw Friend para IA externa (Perplexity / Claude.ai / ChatGPT)

> Pegar este bloque como "memoria" o primer mensaje al iniciar una conversacion
> con una IA externa que NO tiene acceso al repo. Cubre producto, stack,
> monetizacion, roles y estado tecnico al 2026-04-27.
>
> Actualizado: 2026-04-22 (tras Content Studio v2 + batch 14 bugs post-smoke
> + Apple Sign-In end-to-end + limpieza repo).
> Mantener sincronizado cuando cambie el modelo de negocio, los roles o el
> stack. Para el detalle tecnico completo, la fuente de verdad sigue siendo
> [CLAUDE.md](../CLAUDE.md) + [INDEX.md](../INDEX.md) + [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md).

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
- Auth social: Apple Sign-In end-to-end (Team `7Q8L7A2WM7`, Service
  `cl.pawfriend.web`, Key `8KX2B9489M`), Google OAuth, Meta pendiente
  (espera decision Consumer vs Empresa).
- **Content Studio v2** (2026-04-22, pipeline interno en `content-studio/`):
  Satori + Remotion (video) + whisper (transcripcion) + ElevenLabs Pro
  (voz) + Midjourney Basic (imagenes). Render PNG/MP4 para Instagram/
  TikTok. Pausado hasta filmar Kai/Ema/Otto/Miguel propios (ver
  `content-studio/SHOT_LIST.md`).

No hay: Zustand, Redux, Next.js.

## 3. Modelo de negocio v2 (post-Roberto Camhi 2026-04-22)

Norte: el dueno **NUNCA paga**. Producto invisible. Modelo **estilo Mapcity**:
no le cobras a la tienda — le cobras a Equifax/bancos por acceso a la data.
Aqui: no le cobras al dueno ni al vet — le cobras a pharma/seguros/retail
por acceso a la ficha clinica longitudinal.

Validacion competitiva: **Petify** cobra USD $0.50/mascota/mes hasta eliminar
(modelo extractivo) → captura el ~10% que paga, deja el 90% afuera. Paw Friend
modelo v2 captura el 100% del mercado y monetiza B2B.

**Pilares ancla** (80% del revenue, mes 4-12 post-seed):
1. **Pharma animal** — Centrovet (Agrosuper), Virbac, Zoetis, MSD. Sponsored
   reminders + data deals + contenido. USD $20-500K / brand.
2. **Seguros pet** — Sura, BCI, Mapfre, Consorcio. Afiliado 10-20% sobre prima
   + white-label ficha. USD $500K-1M a escala.
3. **Retail pet** — Master Dog, Falabella Pet, Puppis. Afiliado 3-10% +
   suscripcion alimento. USD $50-200 / usuario activo-ano.

**Pilares soporte**:
4. **Paw Companys** — empresas pet-friendly + corporates con benefits.
   Sponsorship badge + SaaS bienestar animal ($1-3 USD/empleado/mes).
5. **Paw Support** (ex-donaciones) — pago voluntario del dueno. Reframe legal
   (Ley 19.885). Residual, alto NPS.

**Long-tail (mes 12+)**: data agregada anonima (consent opt-in), gobierno
(Ley 21.020), publicidad programatica.

**B2C dueno** — TODO gratis sin caps (`USER_PREMIUM=false`). Paw Member
$3.990/mes opcional = badge cosmetico + descuentos Paw Partners. No
desbloquea features.

**B2B vet** — canal de adquisicion, no revenue center. Pricing publico
solo Basica $0 + Premium $9.900. Clinica/Pro Max escondidos como
"Empresarial — contactanos".

**3 alianzas**:
- **Paw Voices**: creadores/influencers peludos (barter exposicion).
- **Paw Companys**: sponsors mensuales ($49.9k / $99.9k / $199.9k CLP).
- **Paw Partners**: tiendas/servicios con descuentos a Paw Members.

Tabla compartida `paw_companys` con `partnership_type ∈ {sponsor, partner}`.

Fuente de verdad: [docs-raiz/pitch/MODELO_V2_2026_04_22.md](pitch/MODELO_V2_2026_04_22.md).

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
- **Triggers plpgsql con smoke inline** (regla 9.2.1, 2026-04-21):
  toda migracion que crea o modifica un trigger plpgsql DEBE incluir
  un `DO $$ ... $$` con ROLLBACK que lo ejercite. plpgsql valida lazy
  las refs a columnas; sin smoke el trigger se crea "ok" y explota
  meses despues en prod con usuarios reales. Incidentes 2026-04-21:
  `sync_vaccination_status`, `notify_adoption_interest`,
  `create_default_reminders_for_new_pet`, `award_points`.
- Toda ruta de archivo (.sql, .ts, .md) y URL mencionada en respuesta
  va como link markdown clickeable, nunca como texto plano.
- Nunca flipear `verify_jwt` en bloque en >1 edge fn a la vez; hacerlo
  1 a 1 con smoke real (incidente 2026-04-20).
- Nunca hardcodear JWTs en `cron.schedule`; usar vault
  `current_setting('app.settings.service_role_key')`.

## 8. Estado tecnico (2026-04-22)

- Ramas: `main` al dia. Ultimo commit: `6bbab0f9 feat(content-studio):
  pipeline programatico de social media ads`.
- Recientes (2026-04-21 → 2026-04-22):
  - **Content Studio v2 pusheado** (`6bbab0f9`): 47 archivos, 9561 lineas.
    Stack Satori+Remotion+whisper+ElevenLabs Pro+Midjourney Basic.
    Pedro pago ambas suscripciones. Pausado hasta filmar mascotas propias.
    Guia siguiente en `content-studio/SHOT_LIST.md`.
  - **Batch 14 bugs post-smoke** (2026-04-21, hasta `ad5f2a78`): 9 migs
    SQL, 6 commits. Patrones recurrentes resueltos: joins
    `profiles`/`auth.users` rotos, triggers plpgsql lazy-validation
    (`sync_vaccination_status`, `notify_adoption_interest`,
    `create_default_reminders_for_new_pet`), varchar/text mismatch,
    JWT refresh en sesiones >1h, `award_points` defensivo ante schemas
    divergentes + smoke con user real, DialogDescription a11y.
  - **Apple Sign-In end-to-end** (2026-04-21): Team `7Q8L7A2WM7`,
    Service `cl.pawfriend.web`, Key `8KX2B9489M`, JWT generado via
    script `scripts/generate-apple-client-secret.mjs`. App Store Connect
    creada. Meta bloqueado decidiendo Consumer vs Empresa. Google
    esperando reverificacion carnet Play Console.
  - **Limpieza repo** (`49386538`): 14 specs/planes ejecutados archivados
    (Vacunas Sofia, Ficha PDF v3, Admin V2, Booking Overhaul, Adopcion,
    VetCheck, Coherence Plan, etc). Indices CLAUDE/INDEX/_pending al dia.
  - Pitch inversionista: `pitch-inversionistas/07_ROBERTO_CAMHI.md`
    (guia llamada 1:1 con angel founder Mapcity/Apanio, mentor
    FI/Start-Up Chile/CORFO).
  - Contexto previo (semana 2026-04-20/21): Booking Master Plan V3
    fases 0-5 + anti-spam, vault para service_role_key, prefs granulares
    `user_notification_prefs` (3 categorias × 3 canales), dedup via
    `notification_attempts` UNIQUE, co-ownership de mascotas, daily
    digest cron, fix CHECK `pet_reminders.type` + 3 prevenciones,
    E2E realignment.
- Tests: `npm run test:ci` ~176 unit verdes; Playwright 336/336.
- Type-check: `npx tsc -b` 0 errores.
- Lint: 0 errores, ~85 warnings a11y.
- Build: pasa, ~2m 31s. Bundle principal ~335 kB / 100 kB gzip.
- Migraciones: serie `20260725000011` (booking_push_antispam) +
  hotfixes plpgsql de 2026-04-21. Pitch applications `20260625000000`
  en prod.
- Rutas totales: 67.

## 9. Que esta en curso (2026-04-22)

- Prod: app sana para crear mascotas, triggers plpgsql verificados con
  smoke inline tras el batch de 14 bugs.
- Content Studio v2 listo tecnicamente; generacion **pausada** hasta
  filmar a Kai / Ema / Otto / Miguel (ver [content-studio/SHOT_LIST.md](../content-studio/SHOT_LIST.md)).
- Pendientes operacionales Pedro (no Claude):
  - Migrar cuenta Flow a SpA (riesgo fiscal de cuenta personal).
  - Decidir Meta WhatsApp tipo Consumer vs Empresa + verificacion.
  - Google Play Console: espera reverificacion carnet (desde 2026-04-22).
  - Apple Developer + assets stores (Sign-In ya listo).
- Roadmap 90d en [docs-raiz/planes/](planes/) (28 iniciativas priorizadas por RICE).
- Testimonios multi-rol: Sofia Rosi (vet beta) + 2 vets mas + 3 duenos.
- Lanzamiento publico: 1 junio 2026, modo autonomo, Flow $100 real.
  SHELTER_DONATIONS activable cuando SpA quede operativa en Flow.

## 10. Mi perro y mi gata

- **Kai** — pastor suizo blanco (mi perro real, aparece en prod).
- **Ema** — gata (tambien real).

En copy publico uso alias "Paw Founder", no mi nombre real.

## 11. Documentos clave del repo para profundizar

- [CLAUDE.md](../CLAUDE.md) — manual operativo completo (fuente de verdad).
- [INDEX.md](../INDEX.md) — indice maestro de docs.
- [MAPA_FUNCIONAL_COMPLETO.md](../MAPA_FUNCIONAL_COMPLETO.md) — mapa de modulos y flujos.
- [AGENTS.md](../AGENTS.md) — config para agentes IA externos (Cursor, Copilot).
- [diagrams/FLUJO_COMPLETO.mmd](../diagrams/FLUJO_COMPLETO.mmd) — diagrama Mermaid end-to-end.
- [docs-raiz/planes/](planes/) — roadmap 90d y specs priorizadas.
- [pitch-inversionistas/](../pitch-inversionistas/) — decks y docs para CORFO, Start-Up Chile,
  angels/VCs (incluye `07_ROBERTO_CAMHI.md`), Paw Companys, Paw Voices, Paw Partners.
- [content-studio/](../content-studio/) — pipeline programatico de social
  media ads. Ver `SHOT_LIST.md` para lo que viene.

---

**Uso en Perplexity / Claude.ai**: pega el bloque arriba. Si tu prompt
es sobre un tema especifico, agrega solo la seccion relevante (ej:
"monetizacion" → seccion 3; "roles" → seccion 4; "stack" → seccion 2).
