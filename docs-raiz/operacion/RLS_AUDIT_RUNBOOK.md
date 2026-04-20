# RLS Audit — Runbook

> Origen: INIT-22 del [Plan de Éxito 90 días](../planes/PLAN_EXITO_90D_20260420.md).
> Script: [scripts/rls-audit.mjs](../../scripts/rls-audit.mjs).
> Frecuencia sugerida: **1x por sprint** (cada 2 semanas) o antes de cualquier release grande.

---

## 1. Preparación (10 min, una sola vez)

### Crear las 2 cuentas de prueba

1. Ir a https://pawfriend.cl/auth.
2. Registrar `rls-a@pawfriend.local` con password `RlsAudit2026A!`.
3. Logout.
4. Registrar `rls-b@pawfriend.local` con password `RlsAudit2026B!`.
5. En cada cuenta, crear al menos:
   - 1 mascota.
   - 1 registro médico.
   - 1 recordatorio.
   - 1 donación (si el flag DONATIONS_MONTHLY está activo).

### Obtener los 2 JWT

Por cada cuenta:

1. Loguearse en https://pawfriend.cl/auth con esa cuenta.
2. Abrir DevTools (F12) → tab **Application** → **Local Storage** → `https://pawfriend.cl`.
3. Encontrar la key `pf-auth-v1` (ese es el storage key custom del cliente Supabase).
4. En el value, buscar `"access_token"` — copiar el string largo (es un JWT).
5. Guardarlo.

Output esperado: 2 JWTs largos (empiezan con `eyJ...`).

---

## 2. Correr el audit

### PowerShell (Windows)

```powershell
$env:SUPABASE_URL = "https://gwailbjlvevkhwcrovfd.supabase.co"
$env:SUPABASE_ANON_KEY = "<tu anon key publica>"
$env:RLS_USER_A_JWT = "<JWT de User A>"
$env:RLS_USER_B_JWT = "<JWT de User B>"
node scripts/rls-audit.mjs
```

### Bash (macOS/Linux)

```bash
export SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
export SUPABASE_ANON_KEY=<tu anon key publica>
export RLS_USER_A_JWT=<JWT de User A>
export RLS_USER_B_JWT=<JWT de User B>
node scripts/rls-audit.mjs
```

### Cómo obtener `SUPABASE_ANON_KEY`

En el repo, grep `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env` o en el valor actualmente desplegado. Es la key pública, segura de usar localmente.

---

## 3. Interpretar el output

El script imprime en consola línea por línea:

```
✅ [pets] User A cannot see User B pets — 0 rows when filtering by B
✅ [medical_records] Only own records visible — 12 rows
⚠️  [vet_clinical_notes] Notes visible to non-vet user — 3 rows
🚨 [donations] LEAK donations — 2 foreign donations
```

Al final resume:

```
=== SUMMARY ===
✅ Passed:   8
⚠️  Warnings: 1
🚨 Critical: 1
```

Y escribe el reporte en `audits/RLS_AUDIT_<YYYY_MM_DD>.md` para revisar después.

---

## 4. Tablas cubiertas (10 checks)

| Tabla | Check |
|---|---|
| `pets` | User A no ve pets de User B (por owner_id + sin filtro) |
| `medical_records` | Solo registros propios visibles |
| `medical_share_tokens` | Solo tokens propios |
| `pet_reminders` | Solo recordatorios propios |
| `bookings` | Solo reservas propias |
| `donations` | Solo donaciones propias |
| `pitch_applications` | Solo aplicaciones propias (o admin) |
| `paw_companys` | Solo rows con status='active' visibles a público |
| `adoption_centers` | Read público OK; UPDATE cruzado bloqueado |
| `vet_clinical_notes` | No visible a non-vet |

---

## 5. Qué hacer si hay CRITICAL

🚨 **NO IGNORAR**. Un leak = violación de privacidad = riesgo legal.

1. Identificar la tabla del leak en el output.
2. Ir a Supabase Dashboard → Database → Policies → buscar la tabla.
3. Revisar las políticas `SELECT`, `UPDATE`, `DELETE`:
   - `USING` clause debe filtrar por `auth.uid()` o equivalente.
   - `WITH CHECK` (en UPDATE/INSERT) debe validar lo mismo.
4. Ejemplos de policy correcta:
   ```sql
   CREATE POLICY "select_own_pets" ON public.pets
     FOR SELECT
     USING (owner_id = auth.uid());
   ```
5. Después de corregir, **volver a correr** el script para confirmar que pasa.
6. Si es crítico y pasó a prod, considerar:
   - Anuncio a usuarios afectados (dependiendo del impacto).
   - Post-mortem en `docs-raiz/operacion/` documentando qué pasó.

---

## 6. Qué hacer si hay WARNINGS

⚠️ Revisar en el próximo ritual semanal (bloque 2 — Sprint en curso).

Warnings comunes:
- **`paw_companys non-active visible`**: puede ser intencional (admin ve todo) o un leak. Verificar si el user A es admin.
- **`vet_clinical_notes visibles a non-vet`**: puede ser intencional si el user A es dueño de la mascota. Verificar.
- **HTTP errors en lectura**: la política puede estar bloqueando **demasiado**. Verificar que el flujo legítimo sigue funcionando.

---

## 7. Cadencia recomendada

| Momento | Qué hacer |
|---|---|
| Cierre sprint (cada 2 sem) | Correr audit → revisar reporte en ritual lunes |
| Antes de release con nueva tabla | Agregar check al script + correr |
| Post-incidente de seguridad | Correr + comparar con último reporte |
| Una vez al mes | Bajo |

---

## 8. Expansión futura

Si se necesitan más checks, agregar función al script y llamarla en `main()`. Tablas candidatas futuras:

- `paw_point_transactions` (aislamiento por user_id).
- `notification_attempts` (solo dueño ve los suyos).
- `audit_snapshots` (solo admin).
- `post_adoption_checkins` (owner + shelter + admin).
- `vaccine_schedule_doses` (read público OK, write admin-only).

Cada check nuevo sigue el patrón de `checkPetsIsolation` en el script.

---

## 9. Cuando el script falla

Si `node scripts/rls-audit.mjs` tira error antes de empezar:

| Error | Causa | Fix |
|---|---|---|
| `Missing env vars` | No exportaste las variables | Revisar paso 2 |
| `No se pudo resolver user` | JWT inválido o expirado | Re-loguearse y copiar JWT nuevo |
| `User A y User B tienen el mismo ID` | Copiaste el mismo JWT dos veces | Verificar que son cuentas distintas |
| `fetch is not defined` | Node < 18 | Usar Node 18+ (`nvm use 20`) |
| Todos los checks `HTTP 401` | Anon key incorrecta | Verificar `SUPABASE_ANON_KEY` |

---

## 10. Integración con CI (futuro)

Cuando Paw Friend tenga pipeline CI-CD serio, agregar el audit como step separado:

```yaml
# .github/workflows/rls-audit.yml (ejemplo)
name: RLS Audit
on:
  schedule:
    - cron: '0 12 * * 1' # Lunes 9 AM Chile
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node scripts/rls-audit.mjs
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          RLS_USER_A_JWT: ${{ secrets.RLS_USER_A_JWT }}
          RLS_USER_B_JWT: ${{ secrets.RLS_USER_B_JWT }}
      - uses: actions/upload-artifact@v4
        with: { name: rls-audit-report, path: audits/RLS_AUDIT_*.md }
```

Pedro: por ahora manual, agendarlo cuando CI tenga sentido (post fundraising).
