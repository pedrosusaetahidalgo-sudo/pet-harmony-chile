# Paw Friend — Polish E2E + QA Matrix (2026-04-29)

> Fase 3 del [pawfriend-prompt-v5.md](../pawfriend-prompt-v5.md).
> Matriz formal `flujo × estado × resultado` para los 6 flujos críticos.
> Pedro: usar como checklist QA pre-launch (1 junio 2026).

**Convenciones**:
- ✅ funciona como esperado
- ⚠️ funciona parcial / con caveats
- ❌ roto / bloqueante
- 💀 dead click / no responde
- ⏳ no testeado aún (rellenar durante beta)

---

## Flujo 1 — Onboarding tutor

`Free user signup → primera mascota → primer recordatorio`

| Paso | Acción | Estado esperado | Riesgos conocidos |
|---|---|---|---|
| 1.1 | Click "Crear cuenta" en `/auth` | Form válido aparece | Sin riesgos |
| 1.2 | Email + password (o OAuth Google/Apple/Facebook) | Magic link / OAuth callback OK | OAuth callback rotas en Apple si Service ID mal config |
| 1.3 | Verificar email (si magic link) | Redirect a `/onboarding-mascota` | Smart redirect según role |
| 1.4 | Llenar 4 campos minimal: nombre + especie + edad + foto opcional | Mascota creada (1ra del free tier) | Verificar `max_pets=2` no bloquea aún |
| 1.5 | Banner OCR carnet (si suben foto carnet) | Edge fn `ocr-vaccination-card` extrae datos | Tasa OCR ~80% con IA |
| 1.6 | Hotorio cards en home (Pet ID Card + Quick Actions Hub) | Renderizan con datos reales de mascota | Sin riesgos |
| 1.7 | Click "Agregar recordatorio" | Modal con presets one-tap | Verificar nuevo formato AddReminderDialog |
| 1.8 | Crear recordatorio (vacuna o vet visit) | Aparece en /calendario y /reminders | RLS owner_id |
| 1.9 | Intentar agregar 3ra mascota | Ve PremiumGate upsell card a Paw Member | Wireado en AddPet.tsx:743 |

**Estado actual**: `⏳ no testeado E2E con paywall activo` (USER_PREMIUM=false hoy). Se valida cuando flipee.

---

## Flujo 2 — Onboarding vet (B2B individual)

`Vet signup → registro profesional → activar perfil → contratar Premium`

| Paso | Acción | Estado esperado | Riesgos |
|---|---|---|---|
| 2.1 | `/registro-veterinario` form | Datos básicos + comuna + especialidad | Validation zod |
| 2.2 | Submit → crea `service_providers` row con `status='pending'` | Email confirmación + redirect /provider/dashboard | Sin riesgos |
| 2.3 | Admin aprueba (manual o auto) → `status='active'` | Vet aparece en `/veterinarios` directorio | Aún ManualBy admin |
| 2.4 | Vet completa perfil (`/provider/profile-edit`) | Bio, fotos, horarios, precios | UI redesign 2026 |
| 2.5 | Click "Ver como me ven los dueños" → preview público | Abre `/veterinarios/:slug` en nueva tab | Diferenciador único |
| 2.6 | Configurar disponibilidad (si activo BOOKING_V3_WIZARD) | Slots disponibles | Flag false hoy |
| 2.7 | Click "Activar Plan Premium" → `/provider/upgrade` | Flow.cl checkout $9.900/mes | flow-create-subscription `provider_premium` |
| 2.8 | Pago confirmado → webhook activa plan | `provider_plan='provider_premium'` + featured_until | Telemetry idempotency |

**Estado actual**: ✅ funcional según última revisión. Sofia (beta vet) ya lo probó.

---

## Flujo 3 — Paw Shield biométrico (Petify)

`Activar Paw Shield desde ficha → enrollment → public scan match`

| Paso | Acción | Estado esperado | Riesgos |
|---|---|---|---|
| 3.1 | Free user entra a tab Identidad ficha → ve PremiumGate "Paw Shield" | Card upsell a Paw Member | ✅ wireado |
| 3.2 | Upgrade a Paw Member → ve `PawShieldStatusCard` activable | Botón "Activar Paw Shield" visible | Requiere PAW_SHIELD_PETIFY=true |
| 3.3 | Click "Activar" → captura video 3 seg del hocico | 3 frames extraídos | Camera permissions iOS/Android |
| 3.4 | Edge fn `paw-shield-register` envía a Petify API | Petify retorna pet_id biométrico | **Bloqueante**: API key TEST → enrollments se pierden al rotar PROD |
| 3.5 | Foto raw + embedding archivado (opt-in consent) | `paw_shield_data_archive` row | Privacy ARCO |
| 3.6 | Persona externa entra a `/nose-scan` (sin auth) | Captura foto del hocico de mascota perdida | Verify_jwt=false en edge fn |
| 3.7 | Edge fn `paw-shield-identify` → match Petify | Devuelve owner contact si match score > threshold | Threshold a calibrar |
| 3.8 | UI muestra match con disclaimer | Owner contactado vía link/email | Privacy: no exponer email directo |

**Estado actual**: ❌ **bloqueado por Petify API TEST**. Flag PAW_SHIELD_PETIFY=false hasta tener PROD key. Este flujo NO se puede testear hasta entonces.

---

## Flujo 4 — Suscripción Manada B2C

`Free user → click activar Manada → Flow.cl → activación + aporte refugio`

| Paso | Acción | Estado esperado | Riesgos |
|---|---|---|---|
| 4.1 | Free user en `/paw-member` → ve sección Manada secundaria | Card con $9.990/mes + features | ✅ Tier3Pricing.tsx wireado |
| 4.2 | Click "Activar Manada · $9.990/mes" | Llama a edge fn `flow-create-subscription` con plan='paw_manada_monthly' | ✅ updated |
| 4.3 | Recibe URL Flow.cl → completa pago | Token Flow + redirect a `/paw-member/success` | URL params sanitization |
| 4.4 | Webhook `flow-webhook` activa subscription | `plan_type='paw_manada'` + status='active' | ✅ updated |
| 4.5 | INSERT en `manada_aportes_log` con $2.000 + flow_charge_id | UNIQUE constraint previene duplicados | ✅ updated |
| 4.6 | User vuelve a `/paw-member` | Ve dashboard Manada con "Tu impacto" | Refactor PawMember.tsx ✅ |
| 4.7 | Selecciona refugio elegido → llama RPC `set_manada_refugio_preference` | Preferencia guardada | Modal con Select shadcn |
| 4.8 | Día 1 del próximo mes: cron `manada-pool-monthly-close` | Pool cerrado + pool_id asignado a aportes | Mig 20260929000001 |
| 4.9 | Pedro recibe notif → consulta SQL → transferencia bancaria | UPDATE pool status='distributed' | Workflow manual al inicio |

**Estado actual**: ⏳ código completo, **no testeado E2E** porque requiere `USER_PREMIUM=true` flipeado + Flow.cl SpA migrado.

---

## Flujo 5 — Recuperación mascota perdida

`Mascota se pierde → owner publica QR → persona escanea → contacta`

| Paso | Acción | Estado esperado | Riesgos |
|---|---|---|---|
| 5.1 | Owner edita ficha mascota → estado="perdida" (si feature existe) | Mascota marcada perdida en DB | Verificar feature flag |
| 5.2 | Owner imprime/comparte QR de la mascota → `/qr/:token` | Pública sin auth | qr token único |
| 5.3 | Persona externa escanea QR | Landing pública con datos relevantes (foto, contacto, recompensa opcional) | Privacy: solo info necesaria |
| 5.4 | Persona contacta vía WhatsApp / Phone | Link `wa.me/56...` directo | Verificar phone en DB |
| 5.5 | Alternativa: persona escanea hocico en `/nose-scan` | Match contra base Paw Shield | Bloqueado por Petify TEST |

**Estado actual**: ⚠️ flujo QR funciona; flujo `/nose-scan` bloqueado por Petify.

---

## Flujo 6 — Ficha médica vet/tutor

`Vet crea consulta → owner ve actualización → comparte con segundo vet`

| Paso | Acción | Estado esperado | Riesgos |
|---|---|---|---|
| 6.1 | Vet busca paciente o crea via "Nuevo Paciente" form | Paciente creado con `pending_owner_email` si no existe owner | RLS por vet_id |
| 6.2 | Vet registra consulta vía `ClinicalNoteEditor` o audio transcripción | `consultation_notes` row | Edge fn process-consultation-transcript |
| 6.3 | Cascadas: aplica vacuna → trigger crea reminder próximo refuerzo | `pet_reminders` auto-generado | Trigger plpgsql ✅ |
| 6.4 | Owner abre app → ve actualización en home + push (si activado) | PetHealthAlertsBanner si aplica | RLS owner_id |
| 6.5 | Owner abre tab "Historia" en ficha → ve evento de consulta | Timeline cronológico ordenado | mig 20260903800000 |
| 6.6 | Owner click "Compartir ficha" → genera `medical_share` token | Token expira según plan (30d free, 365d Member) | RLS share token |
| 6.7 | Segundo vet abre `/medical-share/:token` (sin auth) | Ve ficha read-only durante validez | Sin login, solo token |
| 6.8 | Owner descarga PDF ficha (`generate-medical-summary`) | PDF v3 con timeline cronológico + watermark | Telemetría OK |

**Estado actual**: ✅ flujo core funcional. ⚠️ Audio IA detrás de PremiumGate cuando `USER_PREMIUM=true`.

---

## Estados ausentes a verificar (todos los componentes)

Para cada componente principal, validar que existen los 4 estados:

- ⏳ **Loading**: skeleton o spinner mientras query corre
- 📭 **Empty**: state ilustrado cuando no hay datos
- ❌ **Error**: card de error con retry button
- ✅ **Success**: render con datos

**Archivos críticos a auditar**:

- [src/pages/Home.tsx](../src/pages/Home.tsx)
- [src/pages/MyPets.tsx](../src/pages/MyPets.tsx)
- [src/pages/PetClinicalRecord/index.tsx](../src/pages/PetClinicalRecord/index.tsx)
- [src/pages/PawMember.tsx](../src/pages/PawMember.tsx) (post refactor 3 tiers)
- [src/pages/Reportes.tsx](../src/pages/Reportes.tsx) (post PremiumGate)
- [src/pages/Donaciones.tsx](../src/pages/Donaciones.tsx) (rebrand "aportes")
- [src/pages/InsuranceQuotes.tsx](../src/pages/InsuranceQuotes.tsx)
- [src/pages/RetailStore.tsx](../src/pages/RetailStore.tsx)

---

## Backend integrity audit

### Edge functions críticas

| Edge fn | Idempotencia | Telemetry | RLS | Riesgo |
|---|---|---|---|---|
| `flow-create-subscription` | ✅ pending reuse 5min | ✅ withTelemetry | service_role | ✅ |
| `flow-webhook` | ✅ payment_events PK | ✅ withTelemetry | service_role | ✅ |
| `paw-shield-register` | ✅ dedup via Petify | ✅ withTelemetry | service_role | ⚠️ blocked TEST |
| `paw-shield-identify` | N/A read-only | ✅ withTelemetry | verify_jwt=false | ⚠️ blocked TEST |
| `generate-medical-summary` | N/A read-only | ✅ withTelemetry | service_role | ✅ |
| `generate-paw-passport` | N/A read-only | ✅ withTelemetry (recién) | service_role | ✅ |
| `consultation-prep` | N/A | ✅ withTelemetry (recién) | service_role | ✅ |
| `request-insurance-quote` | ✅ user_id+timestamp | ✅ withTelemetry | service_role | ⚠️ demo |

### RLS hot-spots

Verificar policies funcionan correctamente:

- [ ] `pets`: owner_id puede leer/edit; vet_id con permiso puede leer; refugio puede leer si `created_by_shelter_id`
- [ ] `medical_records`: owner + vet con relación activa
- [ ] `manada_aportes_log`: user lee su propio log; admin all
- [ ] `subscriptions`: user lee su propia; admin all
- [ ] `service_providers`: user lee su propio + público lee si `status='active'` AND `is_directory_visible=true`

---

## Performance check (Lighthouse pre-launch)

Top 5 páginas más visitadas — meta ≥ 90 performance + accessibility:

| Página | Performance | Accessibility | Bundle |
|---|---|---|---|
| `/` (Index) | ⏳ medir | ⏳ | ⏳ |
| `/home` | ⏳ medir | ⏳ | ⏳ |
| `/ficha/:petId` | ⏳ medir | ⏳ | ⏳ |
| `/paw-member` (post refactor) | ⏳ medir | ⏳ | ⏳ |
| `/veterinarios` | ⏳ medir | ⏳ | ⏳ |

**Bundle inicial budget**: < 500 KB gzipped (último snapshot 2026-04-30: Admin -71%, Home 55KB).

---

## Acciones inmediatas pre-launch

### Bloqueantes (testing manual antes 1 junio)

1. [ ] Aplicar 2 migs SQL pendientes en Supabase
2. [ ] Re-deploy `flow-create-subscription` + `flow-webhook` con cambios Manada
3. [ ] Activar pg_cron extension si no está
4. [ ] Smoke test E2E flujos 1, 2, 4, 6 con account beta
5. [ ] Activar `USER_PREMIUM=true` y validar PremiumGates en producción
6. [ ] Cuando Petify PROD ready: activar `PAW_SHIELD_PETIFY=true` + smoke flujo 3
7. [ ] Lighthouse audit en top 5 páginas
8. [ ] Revisión legal completa por abogado externo

### Polish UX (no bloqueante)

- [ ] Empty states ilustrados en páginas con poco data
- [ ] Loading skeletons coherentes (mismo patrón en todas las pages)
- [ ] Tooltips en features premium (clarifican qué pasa al activar)
- [ ] Disclaimer "demo" en Insurance/Retail más visible

---

## Próximos pasos

1. **Esta semana**: Pedro re-aplica migs + re-deploy edge fns + smoke test flujos 1-2-4-6.
2. **Semana 2-3**: cohorte beta usa producto + reporta bugs (canal WhatsApp/Telegram).
3. **Semana 4 pre-launch**: Lighthouse + a11y audit + paywall validation.
4. **Pre-launch (1 junio)**: checklist sección "Acciones inmediatas" sección bloqueantes 1-7 al 100%.
