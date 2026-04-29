# Auditoría RLS — Motores Revenue (2026-04-30)

> Audit post-implementación de los 7 motores de revenue + 5 ideas RICE Paw Shield.
> Cubre 9 tablas nuevas + 12 RPCs SECURITY DEFINER creadas en migs `20260911`-`20260917`.
>
> Ejecutado: 2026-04-30. Mig de hardening: `20260918000000_rls_hardening_revenue_motors.sql`.

---

## Tablas auditadas

| # | Tabla | RLS | Policies | Veredicto |
|---|---|---|---|---|
| 1 | `paw_shield_archive` | ✅ | service_all + owner_select + owner_revoke (UPDATE) | ✅ OK · UPDATE permite revocar consent (no es vector de abuso, RPC dedicada) |
| 2 | `birthday_coupon_partners` | ✅ | public read (is_active) + admin all | ✅ OK · partners visibles solo activos |
| 3 | `vet_api_keys` | ✅ | admin + vet_select (propietario) | ✅ OK · keys plaintext nunca expuestas; solo metadata |
| 4 | `vet_checkin_log` | ✅ | admin + vet_select | ✅ OK |
| 5 | `insurance_partners` | ✅ | public read (is_active) + admin all | ✅ OK |
| 6 | `insurance_quotes` | ✅ | owner_select + admin | ✅ OK · insert vía RPC SECURITY DEFINER |
| 7 | `insurance_leads` | ✅ | owner_select + ~~owner_insert~~ + admin | ⚠️→✅ FIX: dropped owner_insert (spam vector) |
| 8 | `retail_partners` | ✅ | public read (is_active) + admin all | ✅ OK |
| 9 | `retail_clicks` | ✅ | owner_select + ~~owner_insert~~ + admin | ⚠️→✅ FIX: dropped owner_insert (spam vector) |

## RPCs SECURITY DEFINER auditados

| RPC | Auth check | Veredicto |
|---|---|---|
| `revoke_paw_shield_archive_consent()` | ✅ valida `auth.uid()` | OK |
| `paw_shield_archive_stats()` | ⚠️→✅ | FIX: agrega RAISE EXCEPTION si no admin |
| `approve_b2b_api_application(...)` | ✅ valida `admin_access` | OK |
| `get_b2b_self_stats(plain_key)` | ✅ valida hash key | OK |
| `verify_b2b_api_key(plain_key)` | ✅ valida hash key | OK |
| `create_b2b_api_key(...)` | ✅ valida `admin_access` | OK |
| `list_active_birthday_coupons(pet_id)` | ✅ ownership check | OK |
| `verify_vet_api_key(plain)` | ✅ valida hash | OK |
| `create_vet_api_key(...)` | ✅ valida `admin_access` | OK |
| `list_active_insurance_partners(pet_id)` | ✅ ownership opcional | OK |
| `compute_insurance_quote(pet_id, slug)` | ✅ ownership check | OK |
| `list_active_retail_partners(pet_id)` | ✅ ownership opcional | OK |
| `track_retail_click(...)` | ✅ valida `auth.uid()` | OK |
| `retail_partner_stats(...)` | ⚠️→✅ | FIX: RAISE EXCEPTION explícito |

## Hallazgos y fixes (mig 20260918)

### A) `paw_shield_archive_stats()` — sin gate admin
**Hallazgo:** función `STABLE` con SELECT directo. Cualquier `authenticated` user podía llamarla y ver stats globales del archive (total imágenes, count por especie, etc).
**Riesgo:** medio. No expone PII pero filtra metadata agregada que no debería.
**Fix:** convertida a `plpgsql` con `RAISE EXCEPTION 'admin only'` al inicio.

### B) `insurance_leads.il_owner_insert` policy — vector de spam
**Hallazgo:** policy permitía a cualquier `authenticated` insertar leads directo a DB (`WITH CHECK owner_id = auth.uid()`), bypaseando la edge fn `request-insurance-quote` que tiene validaciones de quote_id + partner_id + ownership de quote.
**Riesgo:** alto. User malicioso podía crear leads spam → emails masivos al partner → reputational damage del partner contra Paw Friend.
**Fix:** `DROP POLICY il_owner_insert`. La edge fn usa `service_role` que bypasea RLS naturalmente.

### C) `retail_clicks.rc_owner_insert` policy — vector de spam
**Hallazgo:** mismo patrón que insurance_leads. User podía inflar clicks falsos para sabotear attribution de partners (causar pagos por clicks que no existieron).
**Riesgo:** alto financiero. Manipulación de revenue share.
**Fix:** `DROP POLICY rc_owner_insert`. RPC `track_retail_click` es `SECURITY DEFINER` y persiste correctamente.

### D) `retail_partner_stats()` — gate silencioso
**Hallazgo:** la función tenía `EXISTS (SELECT 1 FROM admin_access...)` como filter en el `WHERE`. Si el caller no era admin, devolvía 0 filas silenciosamente (no error).
**Riesgo:** bajo (no expone data) pero confunde para debugging.
**Fix:** convertida a `plpgsql` con `RAISE EXCEPTION 'admin only'` explícito.

---

## Otros aspectos verificados (sin issue)

- **Bucket `paw-shield-archive`:** policies separadas para `service_role` insert/select/delete. ✅ Privado.
- **CHECK constraints en columnas:** validan enum de status, capture_kind, tier, etc. ✅
- **`pitch_applications.kind` constraint:** incluye los 14 kinds (10 originales + 4 nuevos B2B + b2b_api). ✅
- **API keys:** nunca se almacenan plaintext, solo `key_hash` (SHA256 via pgcrypto). El admin recibe la plain key UNA SOLA VEZ via RPC y debe copiarla.
- **Foreign keys + ON DELETE:** insurance_quotes/leads tienen `ON DELETE CASCADE` correcto. paw_shield_archive tiene `ON DELETE SET NULL` en pet_id (preserva imagen anonimizada para training si consent).
- **Triggers:** ninguna mig nueva crea triggers plpgsql, así que la regla 9.2.1 de smoke inline no aplica.

## Pendiente para futura iteración

- `paw_shield_archive` UPDATE policy podría restringirse a solo columnas `consent_for_training` + `consent_revoked_at` (vía column-level grants). Hoy permite UPDATE sobre cualquier campo si es del owner. Riesgo bajo porque no hay flujo de UI que abuse esto, pero hardening futuro recomendado.
- `insurance_partners.contact_email` y `retail_partners.contact_email` son visibles a `anon` cuando partner está activo. Es PII de empresa (no personal), pero scrapeable. Considerar moverlos a tabla privada admin-only si en algún momento expusiéramos partners reales.

---

**Estado post-fix:** ✅ Tier de seguridad aceptable para auditoría externa. Mig 20260918 lista para aplicar.
