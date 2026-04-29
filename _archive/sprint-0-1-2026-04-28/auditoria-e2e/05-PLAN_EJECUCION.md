# Plan de ejecución por lotes

**Fase 5 del prompt** — plan de ejecución post Gate 1.

## Decisiones confirmadas por Pedro (2026-04-20)

1. **Tiers B2B**: Opción A — **construir el mínimo feature set para justificar los 4 tiers al lanzamiento 1 junio**. Cada tier debe tener al menos 1 feature real que lo diferencie.
2. **WhatsApp Cloud API**: activar pre-launch (Meta aceptada 2026-04-20).
3. **`SHELTER_DONATIONS`**: **TRUE al lanzamiento** (SpA ya existe, cuenta bancaria esta semana).
4. **Callbacks Flow**: **Opción B** — URLs limpias `/paw-member/success` y `/paw-member/cancel`, 301 desde legacy.
5. **DNS Resend**: validar post-launch con prueba real.

## Modo de ejecución

**Modo A** — autónomo. Claude ejecuta todos los lotes sin pausar salvo:
- Bloqueos críticos
- Decisiones de producto no anticipadas
- Cambios en joya de la corona (CLAUDE.md §9.6)

---

## Mapa de lotes

| Lote | Nombre | Esfuerzo | Dependencia | Prioridad |
|---|---|---|---|---|
| A | Migraciones DB + tipos B2B | 1d | — | P0 |
| B | Edge functions B2B (Flow + gating) | 2d | A | P0 |
| C | UI upgrade B2B + gating | 2d | A+B | P0 |
| D | Callbacks Flow limpios (Opción B) | 0.5d | B | P1 |
| E | Feature flags + copy decisiones | 0.5d | — | P1 |
| F | Activar SHELTER_DONATIONS | 0.5d | — | P1 |
| G | WhatsApp Cloud API activación | 1d | — | P2 |
| H | Docs vivos + infra email | 0.5d | A-F | P2 |
| I | Smoke tests E2E (Playwright) | 1-2d | A-H | P2 |

**Total**: 9-11 días de trabajo concentrado. En 40 días pre-launch cabe holgado.

---

## Lote A — Migraciones DB + tipos B2B

**Entregables**:

### A.1 `supabase/migrations/*_vet_plan_lifecycle.sql`

```sql
ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_next_billing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_service_providers_plan_expires
  ON service_providers(plan_expires_at)
  WHERE plan_expires_at IS NOT NULL;

-- Cron diario: downgrade de vets cuyo plan expiro sin renovacion
CREATE OR REPLACE FUNCTION downgrade_expired_vet_plans()
RETURNS JSONB ...;

SELECT cron.schedule('downgrade-expired-vet-plans-daily', '0 3 * * *', $$SELECT downgrade_expired_vet_plans();$$);
```

### A.2 `supabase/migrations/*_vet_featured_position.sql`

```sql
ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- featured_until futuro = destacado en directorio.
-- Se setea automaticamente al activar plan >= premium, NULL si downgrade.
CREATE INDEX IF NOT EXISTS idx_service_providers_featured
  ON service_providers(featured_until DESC NULLS LAST)
  WHERE is_directory_visible = true;
```

### A.3 `supabase/migrations/*_clinic_vet_seats.sql`

```sql
-- Tabla seats: permite que una cuenta clinic tenga multiples vets bajo una misma org.
CREATE TABLE IF NOT EXISTS clinic_vet_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  seat_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  invited_token UUID DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'vet' CHECK (role IN ('vet', 'admin_assistant')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'removed')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(parent_provider_id, seat_user_id)
);

-- RLS: solo el parent provider puede gestionar seats de su cuenta.
ALTER TABLE clinic_vet_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY clinic_vet_seats_parent_manage ON clinic_vet_seats
  FOR ALL USING (
    parent_provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- View: vets activos por parent (util para UI "mis seats")
CREATE VIEW clinic_active_seats AS ...;
```

### A.4 `supabase/migrations/*_booking_commission.sql`

```sql
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS commission_amount_clp INTEGER;

-- Trigger AFTER UPDATE status='completed': calcula commission
-- segun provider_plan actual del vet
```

### A.5 Regenerar tipos Supabase

Comando que Pedro debe correr (no automatizar):
```bash
npx supabase gen types typescript --project-id gwailbjlvevkhwcrovfd > src/integrations/supabase/types.ts
```

---

## Lote B — Edge functions B2B

### B.1 Extender `flow-create-subscription`

Aceptar nuevos plans con precios:
```ts
const PRICES: Record<string, number> = {
  // B2C (existente)
  monthly: 3990,
  yearly: 39900,
  // B2B NUEVO
  provider_premium: 9900,
  provider_clinic_starter: 19900,
  provider_pro_max: 29900,
};
```

Marcar `order_type` en metadata para que webhook sepa a qué tabla actualizar.

### B.2 Extender `flow-webhook`

Al recibir confirmación de pago:
- Si `order_type === 'b2c_paw_member'` → actualizar `donations` (ya hace esto).
- Si `order_type === 'b2b_vet'` → actualizar `service_providers.provider_plan + plan_started_at + plan_expires_at` (30 días adelante).

### B.3 Gate `max_clients` en `create-patient`

```ts
// Antes de insertar paciente, verificar limite:
const { data: provider } = await supabase
  .from('service_providers')
  .select('provider_plan')
  .eq('user_id', userId).single();
const planCfg = PROVIDER_PLANS[provider.provider_plan];
if (planCfg.features.max_clients !== -1) {
  const { count } = await supabase.from('pet_vet_links')
    .select('*', { count: 'exact' })
    .eq('vet_id', provider.id);
  if (count >= planCfg.features.max_clients) {
    return errorResponse('Límite de pacientes alcanzado. Actualiza tu plan.', 403);
  }
}
```

### B.4 Gate `audio_transcription` en `process-consultation-transcript`

Mismo patrón: consultar plan, si plan es `provider_free` → 403 con CTA upgrade.

### B.5 Extender `bulk-import-pets` para vets B2B

Detectar si caller es vet clínica/pro_max (no solo refugios). Si plan `provider_clinic_starter+` → permitir bulk.

---

## Lote C — UI upgrade B2B + gating

### C.1 `src/pages/ProviderUpgrade.tsx`

Página con 4 cards (Básica / Premium / Clínica / Pro Max) + detalle features por tier + CTA "Suscribirme" → `flow-create-subscription`.

### C.2 Banner en `/provider/dashboard`

Si `provider_plan === 'provider_free'`:
```
┌──────────────────────────────────────────────┐
│ 💡 Activa Premium y accede a pacientes       │
│    ilimitados + audio consultas + destacado  │
│    [Ver planes]                               │
└──────────────────────────────────────────────┘
```

### C.3 Gate `featured_position` en `DirectorioVets`

Modificar `useDirectoryVets`:
```ts
.order('featured_until', { ascending: false, nullsFirst: false })
.order('avg_rating', { ascending: false })
```

### C.4 Diferenciar analytics basic/advanced

En Panel Pro, gate widgets avanzados con `<FeatureGuard feature="analytics_level" minLevel="advanced">`.

### C.5 Fix tier clínica persist (GAP-02)

Al crear service_provider con `provider_type='clinic'`, setear `intended_plan='provider_clinic_starter'` para que UI de upgrade lo pre-seleccione.

### C.6 UI gestión seats (clínica+)

Página `/provider/seats` con invitar vet por email → crea row en `clinic_vet_seats`.

### C.7 Marcar "próximamente" honestamente

Para features no implementadas aún (`multiple_branches`, `api_access`):
- En `/para-veterinarios` y `/provider/upgrade` → chip "Próximamente" visible en cards Pro Max.
- No prometer lo que no existe.

---

## Lote D — Callbacks Flow limpios (Opción B)

### D.1 Crear nuevas páginas

- `src/pages/PawMemberSuccess.tsx` — copy "Gracias por sostener Paw Friend" + badge activo.
- `src/pages/PawMemberCancel.tsx` — copy neutro "Pago cancelado, no se hizo cargo".

### D.2 Actualizar `flow-create-subscription`

```ts
return_url: `${SITE_URL}/paw-member/success?token=...`
cancel_url: `${SITE_URL}/paw-member/cancel?token=...`
```

### D.3 Redirect 301 legacy en App.tsx

```tsx
<Route path="/upgrade/success" element={<Navigate to="/paw-member/success" replace />} />
<Route path="/upgrade/cancel" element={<Navigate to="/paw-member/cancel" replace />} />
```

### D.4 Equivalente B2B

- `/provider/upgrade/success` y `/provider/upgrade/cancel` para callbacks B2B.

---

## Lote E — Feature flags + copy decisiones

### E.1 Desactivar CORFO + Angels/VC (GAP-04)

En `Aplicar.tsx`, agregar campo `isOpen: boolean` a `KIND_CONFIG`:
```ts
corfo: { ..., isOpen: false, closedReason: "Postulaciones cerradas por ahora" },
angels_vc: { ..., isOpen: false, closedReason: "Ronda no abierta al público" },
```

UI si `!isOpen`: banner amarillo + submit disabled + mensaje.

### E.2 Copy SHELTER_DONATIONS disclaimer retirado

Cuando el flag pase a `true` (lote F), actualizar `BecomeShelterDialog.tsx:437-442`:
- Quitar "próximamente activo"
- Confirmar que checkbox inserta `adoption_centers.accepts_donations=true`

---

## Lote F — Activar SHELTER_DONATIONS

### F.1 `src/lib/featureFlags.ts`

```ts
SHELTER_DONATIONS: true,  // antes: false
```

### F.2 Verificar edge fn `flow-create-donation`

Que propague `beneficiary_adoption_center_id` correctamente (columnas ya existen en mig 20260620000000).

### F.3 UI `/donaciones`

- Selector de refugio aparece.
- Query param `?refugio=ID` preselecciona.
- Mostrar lista de refugios aliados con status='active'.

### F.4 Testing

- Donar directo a Paw Friend (sin refugio) → comportamiento actual.
- Donar dirigido a refugio X → `donations.beneficiary_adoption_center_id=X`.
- Admin puede ver en `AdminDonations` split por beneficiario.

---

## Lote G — WhatsApp Cloud API activación

### G.1 Secrets Supabase

```bash
npx supabase secrets set META_WHATSAPP_TOKEN=xxx
npx supabase secrets set META_WHATSAPP_PHONE_NUMBER_ID=xxx
```

### G.2 Deploy edge fn `send-whatsapp-reminder`

Ya existe código. Pedro deploy:
```bash
npx supabase functions deploy send-whatsapp-reminder
```

### G.3 Smoke test

- Trigger manual con `{ to: '+569XXXX', message: 'Test Paw Friend' }`.
- Verificar entrega.

### G.4 Conectar a flujos

- Reminder booking 2h antes (cron existente) → WhatsApp en vez de email.
- Medical share opened → WhatsApp al vet (opcional).

---

## Lote H — Docs vivos + infra email

### H.1 `diagrams/FLUJO_COMPLETO.mmd`

Actualizar con:
- Flujo refugio completo
- Flujo `/aplicar?tipo=xxx`
- Flujo upgrade B2B
- Donaciones dirigidas

### H.2 `MAPA_FUNCIONAL_COMPLETO.md`

Agregar módulos: refugios, pitch_applications, vet B2B upgrade.

### H.3 `INDEX.md`

Registrar archivos en `_pending/auditoria-e2e/`.

### H.4 Verificar SPF/DKIM Resend

Smoke test enviando email a Pedro desde edge fn y verificar que no caiga en spam.

---

## Lote I — Smoke tests E2E (Playwright)

Scripts mínimos en `e2e/`:
- `onboarding-owner.spec.ts` (ONBD-01)
- `onboarding-vet-premium.spec.ts` (ONBD-05 + upgrade B2B happy path)
- `onboarding-shelter.spec.ts` (ONBD-10)
- `aplicar-paw-voices.spec.ts` (ONBD-13)
- `aplicar-paw-companys.spec.ts` (ONBD-14)
- `aplicar-paw-partners.spec.ts` (ONBD-15)
- `claim-pet-invitation.spec.ts` (ONBD-02)
- `flow-payment-b2c.spec.ts` (ONBD-27)
- `flow-payment-b2b.spec.ts` (ONBD-28 nuevo)

---

## Gates en ejecución

- **Gate 2** (siguiente): Pedro confirma este plan antes de arrancar Lote A.
- **Gate 3** (después de Lote I): smoke test manual completo antes de anunciar launch.

---

## Estimación de días de trabajo

| Lote | Días | Acumulado |
|---|---|---|
| A | 1 | 1 |
| B | 2 | 3 |
| C | 2 | 5 |
| D | 0.5 | 5.5 |
| E | 0.5 | 6 |
| F | 0.5 | 6.5 |
| G | 1 | 7.5 |
| H | 0.5 | 8 |
| I | 1-2 | 9-10 |

**Trabajo concentrado ~10 días. Cabe holgado en los ~40 días a 1 junio.**
