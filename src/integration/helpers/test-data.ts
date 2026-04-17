/**
 * Factory functions for test entities.
 * Each returns a valid default object that can be overridden.
 */

export function makeUser(
  overrides: Partial<{ id: string; email: string; display_name: string }> = {}
) {
  return {
    id: overrides.id ?? 'user-00000000-0000-0000-0000-000000000001',
    email: overrides.email ?? 'test@pawfriend.cl',
    display_name: overrides.display_name ?? 'Test User',
  };
}

export function makeVetUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: overrides.id ?? 'vet-00000000-0000-0000-0000-000000000001',
    email: overrides.email ?? 'vet@pawfriend.cl',
  };
}

export function makePet(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'pet-00000000-0000-0000-0000-000000000001',
    name: 'Luna',
    species: 'perro',
    breed: 'Labrador',
    birth_date: '2023-01-15',
    gender: 'hembra',
    weight: 25.5,
    color: 'dorado',
    owner_id: 'user-00000000-0000-0000-0000-000000000001',
    created_by_vet_id: null,
    microchip_number: null,
    blood_type: null,
    holo_pattern: 'holo-paws',
    paw_card_id: 'PAW-ABCD-1234',
    photo_url: null,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeProvider(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'provider-00000000-0000-0000-0000-000000000001',
    user_id: 'vet-00000000-0000-0000-0000-000000000001',
    display_name: 'Dr. Test Vet',
    primary_service_type: 'veterinario',
    is_verified: true,
    is_directory_visible: true,
    status: 'active',
    comuna: 'providencia',
    ...overrides,
  };
}

export function makeSubscription(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sub-00000000-0000-0000-0000-000000000001',
    user_id: 'user-00000000-0000-0000-0000-000000000001',
    plan_type: 'monthly',
    status: 'active',
    start_date: '2025-01-01T00:00:00Z',
    end_date: '2025-02-01T00:00:00Z',
    payment_amount_clp: 3990,
    payment_provider_id: 'flow-token-123',
    auto_renew: true,
    ...overrides,
  };
}

export function makeReminder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'rem-00000000-0000-0000-0000-000000000001',
    pet_id: 'pet-00000000-0000-0000-0000-000000000001',
    user_id: 'user-00000000-0000-0000-0000-000000000001',
    title: 'Vacuna antirrábica',
    type: 'vacuna',
    due_date: '2025-06-15T10:00:00Z',
    is_completed: false,
    ...overrides,
  };
}

export function makeBooking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'booking-00000000-0000-0000-0000-000000000001',
    owner_id: 'user-00000000-0000-0000-0000-000000000001',
    provider_id: 'provider-00000000-0000-0000-0000-000000000001',
    pet_id: 'pet-00000000-0000-0000-0000-000000000001',
    status: 'pendiente' as const,
    booking_type: 'vet' as const,
    scheduled_date: '2025-06-20T14:00:00Z',
    notes: 'Control de rutina',
    ...overrides,
  };
}

export function makeMedicalRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'mr-00000000-0000-0000-0000-000000000001',
    pet_id: 'pet-00000000-0000-0000-0000-000000000001',
    vet_id: 'vet-00000000-0000-0000-0000-000000000001',
    type: 'consulta',
    date: '2025-03-15',
    diagnosis: 'Control de rutina, mascota sana',
    treatment: 'Ninguno requerido',
    notes: 'Próximo control en 6 meses',
    ...overrides,
  };
}

/** Valid payload for create-patient edge function */
export function makeNewPatientPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: 'Max',
    species: 'perro',
    breed: 'Golden Retriever',
    birth_date: '2024-03-10',
    sex: 'macho',
    weight: '12',
    owner_name: 'María González',
    owner_email: 'maria@example.com',
    ...overrides,
  };
}
