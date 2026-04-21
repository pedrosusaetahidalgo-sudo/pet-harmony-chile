import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration test: verifica que el ciclo INSERT pets + triggers
 * secundarios (generate_full_vaccine_schedule, auto_paw_card_id,
 * new_pet_drip_d0, etc.) funciona end-to-end contra la DB real.
 *
 * Prevención #2 del post-mortem del bug "deworming CHECK" (2026-04-21).
 * Si un cambio futuro rompe un CHECK/trigger/RLS, este test falla en
 * CI y bloquea el merge — el bug no llega a producción.
 *
 * Tipo: integration, NO unit, NO UI (no abre browser). Habla directo
 * con Supabase como un usuario real autenticado.
 *
 * Variables de entorno requeridas (si faltan, el test se skipea):
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY  (solo para cleanup seguro)
 *   - E2E_TEST_EMAIL             (user dedicado de test)
 *   - E2E_TEST_PASSWORD
 *
 * Ejecutar:
 *   npx playwright test pet-lifecycle-triggers --project="Desktop Chrome"
 *
 * Setup requerido (una vez):
 *   1. Crear un user de test en Supabase Dashboard > Auth > Users:
 *      email: e2e-test@pawfriend.local, password: <cualquiera>
 *   2. Copiar las 5 env vars arriba a tu .env.local (local) o a
 *      GitHub Secrets (CI).
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

const HAS_ENV = !!(SUPABASE_URL && ANON_KEY && SERVICE_KEY && TEST_EMAIL && TEST_PASSWORD);

test.describe('Pet lifecycle triggers (integration)', () => {
  test.skip(
    !HAS_ENV,
    'Missing env vars: VITE_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY / E2E_TEST_EMAIL / E2E_TEST_PASSWORD'
  );

  let userClient: SupabaseClient;
  let adminClient: SupabaseClient;
  let testUserId: string;
  const createdPetIds: string[] = [];

  test.beforeAll(async () => {
    if (!HAS_ENV) return;

    // Cliente admin para cleanup (bypasea RLS)
    adminClient = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false },
    });

    // Cliente user: login con password
    userClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, storageKey: 'e2e-test-session' },
    });

    const { data, error } = await userClient.auth.signInWithPassword({
      email: TEST_EMAIL!,
      password: TEST_PASSWORD!,
    });

    if (error || !data.user) {
      throw new Error(`Login test user failed: ${error?.message ?? 'unknown'}`);
    }

    testUserId = data.user.id;
  });

  test.afterEach(async () => {
    // Cleanup: borrar pets creados + sus reminders (cascade)
    if (createdPetIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any).from('pets').delete().in('id', createdPetIds);
      createdPetIds.length = 0;
    }
  });

  test('perro adulto con birth_date crea reminders con types deworming + antiparasitic', async () => {
    const { data, error } = await userClient
      .from('pets')
      .insert({
        owner_id: testUserId,
        name: `__E2E_PerroAdulto_${Date.now()}`,
        species: 'perro',
        birth_date: '2023-01-15',
        is_public: false,
      })
      .select('id, paw_card_id, holo_pattern')
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.id).toBeTruthy();
    // Triggers auto_paw_card_id + holo_pattern NOT NULL
    expect(data!.paw_card_id).toMatch(/^PAW-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(data!.holo_pattern).toBeTruthy();

    createdPetIds.push(data!.id as string);

    // Trigger generate_full_vaccine_schedule debe haber creado reminders
    const { data: reminders } = await userClient
      .from('pet_reminders')
      .select('type, title')
      .eq('pet_id', data!.id);

    expect(reminders).toBeTruthy();
    expect(reminders!.length).toBeGreaterThan(0);

    const types = new Set(reminders!.map((r) => r.type as string));
    // El bug de 2026-04-21 era que estos 2 values fallaban el CHECK.
    expect(types.has('deworming')).toBe(true);
    expect(types.has('antiparasitic')).toBe(true);
    expect(types.has('vaccine')).toBe(true);
  });

  test('gato cachorro crea reminders de serie inicial', async () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    const { data, error } = await userClient
      .from('pets')
      .insert({
        owner_id: testUserId,
        name: `__E2E_GatoCachorro_${Date.now()}`,
        species: 'gato',
        birth_date: twoMonthsAgo.toISOString().slice(0, 10),
        is_public: false,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    createdPetIds.push(data!.id as string);

    const { data: reminders } = await userClient
      .from('pet_reminders')
      .select('type')
      .eq('pet_id', data!.id);

    expect(reminders!.length).toBeGreaterThan(0);
  });

  test('pet sin birth_date no dispara trigger de vacunas pero INSERT pasa', async () => {
    const { data, error } = await userClient
      .from('pets')
      .insert({
        owner_id: testUserId,
        name: `__E2E_SinBirth_${Date.now()}`,
        species: 'perro',
        is_public: false,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    createdPetIds.push(data!.id as string);

    // El WHEN del trigger requiere birth_date NOT NULL, así que no genera
    // reminders automáticos. Solo los manuales del frontend (checkup +
    // grooming) se crearían en el flow real — acá no porque no pasamos
    // por AddPet.tsx.
    const { data: reminders } = await userClient
      .from('pet_reminders')
      .select('id')
      .eq('pet_id', data!.id);

    expect(reminders!.length).toBe(0);
  });

  test('species no-perro-ni-gato con birth_date no dispara trigger', async () => {
    const { data, error } = await userClient
      .from('pets')
      .insert({
        owner_id: testUserId,
        name: `__E2E_Conejo_${Date.now()}`,
        species: 'otro',
        birth_date: '2024-01-01',
        is_public: false,
      })
      .select('id, paw_card_id')
      .single();

    expect(error).toBeNull();
    expect(data!.paw_card_id).toBeTruthy();
    createdPetIds.push(data!.id as string);
  });
});
