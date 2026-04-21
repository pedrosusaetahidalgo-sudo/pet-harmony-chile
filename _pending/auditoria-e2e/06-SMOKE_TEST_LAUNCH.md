# Smoke test launch — checklist manual

**Fase 7 del prompt auditoría E2E**. Checklist ejecutable por Pedro en las horas previas al lanzamiento (1 junio 2026).

Cada bloque tiene pasos numerados + estado esperado + casilla para marcar ✅/❌. Estima ~2-3 horas el checklist completo si no hay bugs.

---

## Cuentas de prueba recomendadas

Crea estas cuentas antes de empezar (usa correos distintos a los reales):

| Rol | Correo tentativo | Nota |
|---|---|---|
| Owner nuevo | `test-owner@paw.test` (o un gmail tuyo) | Sin historia previa |
| Vet Básica | `test-vet@paw.test` | Registro externo + completa perfil |
| Vet Premium (tras pago) | mismo que arriba | Upgrade durante el test |
| Clínica | `test-clinica@paw.test` | Registro con `provider_type='clinic'` |
| Refugio | `test-refugio@paw.test` | Refugio con mission + mascotas |
| Paw Voice | `test-voice@paw.test` | Postula vía `/aplicar?tipo=paw_voices` |
| Admin | tu cuenta Pedro | Ya existe en `admin_access` |

---

## 1. ONBD-01 — Owner registro + primera mascota

- [ ] Entrar a `/` (incógnito) → click "Empezar"
- [ ] Llegar a `/auth` → registrar con email+pass
- [ ] Recibir email de confirmación ✉️ (verificar que NO cae en spam — si cae, ejecutar `DNS_EMAIL_SETUP.md`)
- [ ] Confirmar email → llega a `/onboarding-mascota`
- [ ] Agregar mascota: nombre "Test", perro, pastor alemán, birth 2023
- [ ] Llegar a `/home` con mascota visible
- [ ] Verificar email drip D0: debe llegar en minutos (si no, revisar edge fn `send-new-pet-drip` deployada)

**Estado esperado**: mascota en DB (`pets` con `owner_id = user.id`), llega en `/home` con empty state lleno.

---

## 2. ONBD-05 — Vet registro externo

- [ ] Entrar a `/registro-veterinario` (incógnito)
- [ ] Elegir "Individual" → paso 1 OK
- [ ] Completar paso 2 (email+pass) → paso 3 (bio + especialidades + comuna)
- [ ] Submit → redirect `/provider/dashboard`
- [ ] Verificar: `useActiveRole()` = provider, sidebar muestra rutas de vet
- [ ] Verificar: `service_providers` row con `status='pending'`, `provider_plan='provider_free'`

---

## 3. ONBD-07 — Clínica registra, se mantiene tipo

- [ ] Login como owner de prueba → header toggle → `BecomeProviderDialog`
- [ ] Elegir "Clínica veterinaria" en paso 1
- [ ] Completar perfil → submit
- [ ] Ir a `/provider/upgrade` → **verificar que el banner "Recomendado" aparece en card Clínica** (no en Premium)
- [ ] Verificar: `service_providers.provider_type = 'clinic'`

---

## 4. ONBD-28 — Upgrade vet B2B (crítico P0)

- [ ] Como vet (paso 2), ir a `/provider/upgrade`
- [ ] Ver las 4 cards con precios y **value prop clara** ("Qué ganas al subir aquí")
- [ ] Verificar que Pro Max muestra chips "Próximamente Q3 2026" en multi-sucursal y API
- [ ] Click en **Premium**
- [ ] Redirige a Flow.cl con monto $9.900
- [ ] Pagar con tarjeta (o monto $100 si tienes cuenta Flow sandbox; si no, $9.900 real y lo reembolsas luego)
- [ ] Flow redirige a `/provider/upgrade/success`
- [ ] Ver mensaje "Plan Premium activo" con features listadas
- [ ] Volver a `/provider/dashboard` → banner upgrade ya no aparece
- [ ] Verificar DB: `service_providers.provider_plan = 'provider_premium'`, `plan_started_at` y `plan_expires_at` con fechas correctas
- [ ] **Verificar gate**: crear 5+ pacientes desde vet, ver que ya no hay límite (antes era 5 en free)
- [ ] Ir a `/veterinarios` (directorio) → este vet debe aparecer arriba (featured_until vigente)

**Estado esperado**: plan activado, features desbloqueadas, destacado en directorio.

---

## 5. ONBD-27 — Upgrade Paw Member B2C

- [ ] Como owner → `/paw-member`
- [ ] Click "Suscribirme" mensual ($3.990)
- [ ] Flow redirige → pago → `/paw-member/success`
- [ ] Copy debe decir **"Gracias por sostener Paw Friend"** (no "Bienvenido a Premium")
- [ ] Badge Paw Member 💛 activo en perfil
- [ ] Verificar DB: `donations.status='paid'`, `donations.frequency='monthly'`

---

## 6. ONBD-10 — Refugio nuevo

- [ ] Login como owner → header toggle → `BecomeShelterDialog`
- [ ] Completar 3 pasos (tipo, dirección, mission)
- [ ] Checkbox "Quiero recibir donaciones dirigidas" → confirmar que copy YA NO dice "próximamente"
- [ ] Submit → redirect `/shelter/dashboard`
- [ ] Email welcome llega ✉️
- [ ] Verificar DB: `adoption_centers` row con `accepts_donations=true` y `status='active'`

---

## 7. ONBD-11 + ONBD-12 — Bulk import + transfer

- [ ] Como refugio, ir a `/shelter/bulk-import`
- [ ] Subir CSV con 3 mascotas de prueba (columnas: name, species, sex, birth_year)
- [ ] Verificar que 3 filas se insertaron en `/shelter/pets`
- [ ] Click en una mascota → botón "Transferir a adoptante"
- [ ] Llenar email del adoptante → generar link
- [ ] Copiar link y abrir en incógnito
- [ ] Registrarse/login con ese email
- [ ] Mascota aparece en `/my-pets` del adoptante con ficha completa

---

## 8. ONBD-13 — Paw Voices (aplicar)

- [ ] Ir a `/aplicar?tipo=paw_voices` (pública, sin login)
- [ ] Llenar formulario: nombre, IG, followers, mensaje
- [ ] Submit → toast de éxito
- [ ] **Pedro**: ir a `/admin?section=system&sub=pitch-applications` → la postulación debe aparecer
- [ ] Email a `pawfriendcl@gmail.com` con CTA al admin
- [ ] Admin click "Aprobar" → row creada en `paw_voices` pública
- [ ] Volver a `/donaciones` o `/paw-voices` → aparece en grid

Repetir para `paw_companys` (ONBD-14) y `paw_partners` (ONBD-15).

---

## 9. ONBD-29 — Donación dirigida a refugio (nuevo en lanzamiento)

- [ ] Como owner, ir a `/donaciones`
- [ ] **Verificar** que el selector "Dirigir a refugio" ahora aparece (feature flag activado)
- [ ] Seleccionar el refugio de prueba
- [ ] Click donar $5.000 → Flow → pago → success
- [ ] Verificar DB: `donations.beneficiary_adoption_center_id` = refugio seleccionado

---

## 10. ONBD-24 — Dual-role switch sin leakage

- [ ] Login como vet (con rol provider activo por defecto)
- [ ] Header toggle → cambiar a owner
- [ ] Sidebar debe mostrar solo rutas de owner (home, feed, my-pets, reminders, calendario, profile, etc.)
- [ ] Intentar acceder a `/provider/dashboard` directo → RoleGuard auto-switch o redirect
- [ ] Volver a provider → sidebar muestra rutas de vet

---

## 11. Integraciones críticas

### Resend (email)
- [ ] `send-new-pet-drip` ✉️ llega inbox después de crear mascota
- [ ] `notify-pitch-application` ✉️ llega a pawfriendcl@gmail.com tras postulación
- [ ] `send-shelter-welcome` ✉️ llega tras crear refugio
- [ ] Todos los emails sin spam (validar en Gmail + Hotmail)

### Flow.cl
- [ ] Pago B2C $3.990 funciona
- [ ] Pago B2B $9.900 funciona
- [ ] Donación $5.000 funciona
- [ ] Webhook procesa los 3 casos

### WhatsApp Cloud API (Lote G)
- [ ] Template `pet_reminder` aprobada por Meta
- [ ] Secrets configurados (`META_WA_ACCESS_TOKEN` + `META_WA_PHONE_NUMBER_ID`)
- [ ] Smoke test desde Supabase Dashboard envía mensaje → llega a tu WhatsApp

### Google Calendar (vets)
- [ ] Vet conecta Google Calendar desde `/profile`
- [ ] Crear booking → se sincroniza al calendar
- [ ] Desconectar → banner `GoogleCalendarStatusBanner` aparece

---

## 12. Verificaciones técnicas finales

- [ ] `npx tsc -b` → 0 errores
- [ ] `npm run lint` → 0 errores (warnings a11y ok)
- [ ] `npm run test:ci` → todos verdes
- [ ] `npm run build` → pasa, bundle dentro de `PERFORMANCE_BUDGET.md`
- [ ] Cron `downgrade-expired-vet-plans-daily` activo (query a `cron.job`)
- [ ] Cron `new-pet-drip-daily` activo
- [ ] Edge functions deployadas (verificar desde `npx supabase functions list`):
  - `flow-create-subscription`
  - `flow-webhook`
  - `create-patient`
  - `process-consultation-transcript`
  - `bulk-import-pets`
  - `send-whatsapp-reminder`
  - (y todas las preexistentes)

---

## 13. Verificación pre-launch de contenido

- [ ] `/` landing: hero, CTAs principales, RichFooter con SGSE
- [ ] `/para-veterinarios`: 4 tiers visibles con precios correctos
- [ ] `/transparencia`: desglose costos + donaciones públicas
- [ ] `/paw-core`: misión y modelo 100% gratis
- [ ] `/faq`: preguntas frecuentes actualizadas
- [ ] `/blog`: 12 posts visibles, sin rotos
- [ ] Sitemap: `https://pawfriend.cl/functions/v1/generate-sitemap` devuelve XML válido con todas las rutas

---

## 14. Monitoreo activo primera semana post-launch

- [ ] Admin Dashboard: Pulso Diario con alertas auto-fix
- [ ] Sentry capturando errores (no silencio ni ruido)
- [ ] PostHog tracking events (signup, pay, onboard)
- [ ] Resend dashboard: deliverability > 95%
- [ ] Meta WhatsApp: conversaciones tier inicial 250/24h (suficiente)

---

## Si algo falla

- **P0 bloqueantes**: no lanzar, arreglar primero.
- **P1/P2 no críticos**: documentar workaround, loguear issue, lanzar.
- **P3 cosméticos**: ignorar, post-launch.

---

## Ejecución

Pedro puede correr este checklist en bloques:
- **1 semana antes del launch**: bloques 1-10 (onboardings funcionales)
- **3 días antes**: bloque 11 (integraciones)
- **Día antes**: bloques 12-13 (técnico + contenido)
- **Primera semana post**: bloque 14 (monitoreo)
