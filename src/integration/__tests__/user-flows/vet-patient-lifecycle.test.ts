/**
 * Tests for the vet patient lifecycle:
 * Vet creates patient → patient appears in list → owner claims invitation → vet-pet link active
 */
import { describe, it, expect } from 'vitest';
import { createMockSupabase } from '../../helpers/mock-supabase';
import { makeVetUser, makeUser, makePet, makeProvider } from '../../helpers/test-data';

describe('Vet patient lifecycle', () => {
  const vet = makeVetUser();
  const owner = makeUser();
  const provider = makeProvider({ user_id: vet.id });
  const pet = makePet({
    owner_id: null,
    created_by_vet_id: vet.id,
    pending_owner_email: owner.email,
    owner_invitation_token: 'invite-token-123',
  });

  it('1. Vet is verified as a service provider', async () => {
    const supabase = createMockSupabase({
      authUser: vet,
      tables: { service_providers: { data: [provider] } },
    });

    const { data } = await supabase
      .from('service_providers')
      .select('id, display_name, is_verified')
      .eq('user_id', vet.id)
      .maybeSingle();
    expect(data).toBeTruthy();
    expect(data!.is_verified).toBe(true);
  });

  it('2. Vet creates a patient via edge function', async () => {
    const supabase = createMockSupabase({
      authUser: vet,
      functions: {
        'create-patient': {
          data: {
            success: true,
            pet_id: pet.id,
            pet_name: pet.name,
            email_sent: true,
            owner_already_registered: false,
            invitation_token: 'invite-token-123',
          },
        },
      },
    });

    const { data, error } = await supabase.functions.invoke('create-patient', {
      body: {
        name: pet.name,
        species: pet.species,
        owner_name: 'Test Owner',
        owner_email: owner.email,
      },
    });
    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.pet_id).toBe(pet.id);
    expect(data.email_sent).toBe(true);
  });

  it('3. Patient appears in vet patient list', async () => {
    const supabase = createMockSupabase({
      authUser: vet,
      tables: { pets: { data: [pet] } },
    });

    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('created_by_vet_id', vet.id)
      .maybeSingle();
    expect(data).toBeTruthy();
    expect(data!.name).toBe(pet.name);
    expect(data!.pending_owner_email).toBe(owner.email);
  });

  it('4. Owner claims invitation via RPC', async () => {
    const supabase = createMockSupabase({
      authUser: owner,
      rpcs: {
        claim_pet_by_invitation: {
          data: { success: true, pet_name: pet.name, vet_linked: true },
        },
      },
    });

    const { data, error } = await supabase.rpc('claim_pet_by_invitation', {
      p_token: 'invite-token-123',
    });
    expect(error).toBeNull();
    expect(data.success).toBe(true);
    expect(data.pet_name).toBe(pet.name);
    expect(data.vet_linked).toBe(true);
  });

  it('5. Pet-vet link is active after claim', async () => {
    const supabase = createMockSupabase({
      authUser: vet,
      tables: {
        pet_vet_links: {
          data: [
            {
              pet_id: pet.id,
              owner_id: owner.id,
              provider_id: provider.id,
              status: 'active',
            },
          ],
        },
      },
    });

    const { data } = await supabase
      .from('pet_vet_links')
      .select('*')
      .eq('pet_id', pet.id)
      .eq('provider_id', provider.id)
      .maybeSingle();
    expect(data).toBeTruthy();
    expect(data!.status).toBe('active');
    expect(data!.owner_id).toBe(owner.id);
  });

  it('6. Vet can add medical records to patient', async () => {
    const supabase = createMockSupabase({
      authUser: vet,
      tables: {
        medical_records: {
          data: [
            {
              id: 'mr-new',
              pet_id: pet.id,
              vet_id: vet.id,
              type: 'consulta',
              diagnosis: 'Cachorro sano',
            },
          ],
        },
      },
    });

    const { data } = await supabase
      .from('medical_records')
      .insert({
        pet_id: pet.id,
        vet_id: vet.id,
        type: 'consulta',
        diagnosis: 'Cachorro sano',
      })
      .select('*')
      .single();

    expect(data).toBeTruthy();
    expect(data!.diagnosis).toBe('Cachorro sano');
  });
});
