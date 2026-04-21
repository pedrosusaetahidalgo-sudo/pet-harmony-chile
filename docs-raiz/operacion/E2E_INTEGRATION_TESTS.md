# E2E integration tests — auth + DB real

> **Prevención #2** (sesión 2026-04-21, post-bug `deworming CHECK`).
> Tests que hablan directo con Supabase como un usuario real autenticado.
> Complementan al smoke SQL (Prevención #1) con cobertura sobre RLS +
> cliente supabase-js + tipos TypeScript.

## Diferencia vs otros tests del repo

| Tipo | Archivo | Qué valida | Requiere auth real |
|---|---|---|---|
| Smoke público | `e2e/smoke-public.spec.ts` | Rutas cargan sin crash | No |
| Smoke protegido | `e2e/smoke-protected.spec.ts` | Redirect a `/auth` sin sesión | No |
| UI fake auth | `e2e/add-pet.spec.ts` | Validaciones del form | Sesión inyectada (no toca DB) |
| **Integration** | `e2e/integration/*.spec.ts` | **Triggers, RLS, CHECK** contra DB real | **Sí** |
| Unit / lib | `src/**/__tests__/*.test.ts` | Lógica pura | No |

## Setup una vez

### 1. Crear user de test en Supabase

En **Supabase Dashboard → Authentication → Users → Add user**:
- Email: `e2e-test@pawfriend.local`
- Password: generá uno fuerte y guardalo
- Marcá **Auto Confirm User**

El user debe tener un `profile` (se crea auto por trigger de Supabase) y, idealmente, `is_demo = false` para no disparar guards anti-seed por error.

### 2. Variables de entorno

En tu `.env.local` (local) **o** GitHub Secrets (CI):

```
VITE_SUPABASE_URL=https://gwailbjlvevkhwcrovfd.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key de Supabase>
SUPABASE_SERVICE_ROLE_KEY=<service role key, solo para cleanup seguro>
E2E_TEST_EMAIL=e2e-test@pawfriend.local
E2E_TEST_PASSWORD=<password que elegiste>
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` SOLO va en env, nunca en `src/`. Se usa únicamente en los test runners (Node) para el cleanup post-test.

## Correr los tests

### Local

```bash
npm run test:e2e:integration
```

Solo corre los specs de `e2e/integration/`. Si las env vars no están,
los tests se **skipean** (no fallan) — así la suite corre OK en
desarrolladores que no tengan credenciales.

### En CI

Agregar al workflow de GitHub Actions:

```yaml
- name: E2E integration tests
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
  run: npm run test:e2e:integration
```

## Cobertura actual

### `pet-lifecycle-triggers.spec.ts`

Cubre el ciclo INSERT en `pets` y sus triggers asociados:

1. **Perro adulto con birth_date** → `generate_full_vaccine_schedule` crea reminders con `type='deworming'` y `type='antiparasitic'`. **Este test hubiera atrapado el bug del 21-abr-2026**.
2. **Gato cachorro** → serie inicial de vacunas.
3. **Pet sin birth_date** → el trigger skipea, INSERT pasa.
4. **Species `otro`** → `auto_paw_card_id` + `holo_pattern NOT NULL` funcionan.

## Cómo extender

Cuando agregues un trigger o una RLS policy nueva, **agregá un test**:

```ts
test('descripción del caso', async () => {
  const { data, error } = await userClient
    .from('<tabla>')
    .insert({ ...payload })
    .select('id')
    .single();

  expect(error).toBeNull();
  createdPetIds.push(data!.id as string); // O pusheá a otro array si es otra tabla

  // Verificaciones adicionales de lo que el trigger debe haber hecho
  const { data: related } = await userClient.from('otra_tabla').select('...');
  expect(related!.length).toBeGreaterThan(0);
});
```

El `afterEach` limpia automáticamente los pets creados. Para otras tablas,
agregá el cleanup al `afterEach` con la misma lógica.

## Ventajas de este approach vs E2E puro UI

- ✅ Rápido: 2-3 seg por test (vs 20-30 seg de un UI test)
- ✅ Estable: no depende de selectores que pueden cambiar
- ✅ Cubre RLS real del user autenticado
- ✅ Cubre triggers DB sin necesidad de navegar UI
- ✅ Fácil de extender

## Limitaciones

- No prueba el **flujo UI** (form validations, crop de foto, reveal Paw Card).
  Para eso están los UI tests con `injectFakeAuth`.
- No prueba **edge functions** (AI, PDF, pagos). Para eso se corren
  localmente con `npx supabase functions serve`.
- Requiere **user dedicado** en Supabase — si alguien lo borra, romper.

## Historia de incidentes que este test hubiera atrapado

| Fecha | Bug | Test que falla |
|---|---|---|
| 2026-04-21 | `pet_reminders.type` CHECK sin `'deworming'` | test #1 — falla al verificar `types.has('deworming')` |

Cuando un bug llegue a producción que este suite debería haber detectado,
**agregar el test** acá para que no vuelva a pasar (antiregression 1:1).
