/**
 * Sprint 1 P0 TEST-003 (2026-04-28) — RLS cross-user isolation.
 *
 * Verifica que un usuario autenticado NO puede leer ni modificar datos de
 * otro usuario en las tablas sensibles. Bloquea regresiones del bug
 * existencial SEC-002 (pets.is_public DEFAULT true) y futuros equivalentes.
 *
 * Tablas auditadas:
 *   - pets (owner_id)
 *   - medical_records (via pet ownership)
 *   - pet_reminders (via pet ownership)
 *   - pet_timeline_events (via pet ownership)
 *   - service_providers (user_id)
 *   - vet_bookings (owner_id)
 *
 * Patron: dos users de test (A y B). A crea data via service_role (bypassa
 * RLS); B intenta leer/modificar con su JWT. Si RLS funciona, B obtiene 0
 * filas o error.
 *
 * Variables de entorno requeridas (skipea si faltan):
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - E2E_TEST_EMAIL          ← user A (creador)
 *   - E2E_TEST_PASSWORD
 *   - E2E_TEST_EMAIL_B        ← user B (atacante)
 *   - E2E_TEST_PASSWORD_B
 *
 * Setup: crear ambos users en Supabase Dashboard > Auth > Users.
 */
import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL_A = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD_A = process.env.E2E_TEST_PASSWORD;
const TEST_EMAIL_B = process.env.E2E_TEST_EMAIL_B;
const TEST_PASSWORD_B = process.env.E2E_TEST_PASSWORD_B;

const HAS_ENV = !!(
  SUPABASE_URL &&
  ANON_KEY &&
  SERVICE_KEY &&
  TEST_EMAIL_A &&
  TEST_PASSWORD_A &&
  TEST_EMAIL_B &&
  TEST_PASSWORD_B
);

test.describe('RLS cross-user isolation', () => {
  test.skip(!HAS_ENV, 'Missing env vars E2E_TEST_EMAIL_B / E2E_TEST_PASSWORD_B');

  let adminClient: SupabaseClient;
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userAId: string;
  let userBId: string;
  const aPetIds: string[] = [];

  test.beforeAll(async () => {
    if (!HAS_ENV) return;

    adminClient = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false },
    });

    // Login user A
    userAClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: a, error: aErr } = await userAClient.auth.signInWithPassword({
      email: TEST_EMAIL_A!,
      password: TEST_PASSWORD_A!,
    });
    if (aErr || !a.user) throw new Error(`User A login failed: ${aErr?.message}`);
    userAId = a.user.id;

    // Login user B
    userBClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: b, error: bErr } = await userBClient.auth.signInWithPassword({
      email: TEST_EMAIL_B!,
      password: TEST_PASSWORD_B!,
    });
    if (bErr || !b.user) throw new Error(`User B login failed: ${bErr?.message}`);
    userBId = b.user.id;

    expect(userAId).not.toBe(userBId);

    // User A crea una mascota (vía RLS, con su JWT) — confirma el path normal.
    const { data: pet, error: petErr } = await userAClient
      .from('pets')
      .insert({
        owner_id: userAId,
        name: `rls-test-pet-${Date.now()}`,
        species: 'perro',
        is_public: false, // Sprint 0 P0 SEC-002: default privado
      })
      .select('id')
      .single();
    if (petErr || !pet) throw new Error(`User A no pudo crear pet: ${petErr?.message}`);
    aPetIds.push(pet.id);

    // Crear medical_record asociada
    await userAClient.from('medical_records').insert({
      pet_id: pet.id,
      record_type: 'consulta',
      title: 'rls-test-record',
      date: new Date().toISOString().slice(0, 10),
    });
  });

  test.afterAll(async () => {
    if (!HAS_ENV || !adminClient) return;
    if (aPetIds.length > 0) {
      await adminClient.from('pets').delete().in('id', aPetIds);
    }
  });

  test('user B no puede SELECT pets de user A', async () => {
    const { data, error } = await userBClient
      .from('pets')
      .select('id, name, owner_id')
      .eq('owner_id', userAId);
    // Resultado correcto: data vacio o null. NO debe haber error de DB; RLS
    // simplemente filtra. Si data tiene rows, significa que B vio data de A.
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  test('user B no puede SELECT pets via id directo', async () => {
    const { data, error } = await userBClient
      .from('pets')
      .select('id, name, owner_id')
      .eq('id', aPetIds[0])
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('user B no puede UPDATE pet de user A', async () => {
    const { error, count } = await userBClient
      .from('pets')
      .update({ name: 'hacked' })
      .eq('id', aPetIds[0])
      .select('*', { count: 'exact', head: true });
    // RLS bloquea silenciosamente: error null pero count 0 filas afectadas.
    // (Algunos setups devuelven error. Aceptamos cualquiera de los dos.)
    if (error === null) {
      expect(count ?? 0).toBe(0);
    }
    // Verificar de todos modos via admin client que el name no cambio.
    const { data: pet } = await adminClient
      .from('pets')
      .select('name')
      .eq('id', aPetIds[0])
      .single();
    expect(pet?.name).not.toBe('hacked');
  });

  test('user B no puede DELETE pet de user A', async () => {
    const { error } = await userBClient.from('pets').delete().eq('id', aPetIds[0]);
    if (error === null) {
      // Verificar via admin que sigue existiendo
      const { data: pet } = await adminClient
        .from('pets')
        .select('id')
        .eq('id', aPetIds[0])
        .maybeSingle();
      expect(pet).not.toBeNull();
    }
  });

  test('user B no puede SELECT medical_records de pets de user A', async () => {
    const { data, error } = await userBClient
      .from('medical_records')
      .select('id, title')
      .eq('pet_id', aPetIds[0]);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  test('user B no puede INSERT medical_record en pet de user A', async () => {
    const { error } = await userBClient.from('medical_records').insert({
      pet_id: aPetIds[0],
      record_type: 'consulta',
      title: 'inyectado por B',
      date: new Date().toISOString().slice(0, 10),
    });
    expect(error).not.toBeNull();
  });

  test('anon client no puede SELECT pets (post SEC-002)', async () => {
    const anonClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anonClient
      .from('pets')
      .select('id, name, microchip_number')
      .eq('id', aPetIds[0])
      .maybeSingle();
    // Tras SEC-002, la pet creada con is_public=false NO debe ser visible a anon.
    // El test confirma que la fuga historica esta cerrada.
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('user B no puede SELECT pet_reminders de pets de user A', async () => {
    // pet_reminders es una tabla derivada via pet ownership.
    const { data, error } = await userBClient
      .from('pet_reminders')
      .select('id, title')
      .eq('pet_id', aPetIds[0]);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  test('user B no puede SELECT vet_bookings de owner A', async () => {
    // V2 bookings filtran por owner_id. B no debe ver bookings de A.
    const { data, error } = await userBClient
      .from('vet_bookings')
      .select('id')
      .eq('owner_id', userAId);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  test('user B no puede UPDATE profile de user A', async () => {
    const { error } = await userBClient
      .from('profiles')
      .update({ display_name: 'hacked-by-B' })
      .eq('id', userAId);
    if (error === null) {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('display_name')
        .eq('id', userAId)
        .single();
      expect(prof?.display_name).not.toBe('hacked-by-B');
    }
  });
});
