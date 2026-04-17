/**
 * Tests for Supabase client query patterns used by hooks.
 * Validates that our mock matches the real chaining API and
 * that query shapes are correct.
 */
import { describe, it, expect } from 'vitest';
import { createMockSupabase } from '../../helpers/mock-supabase';
import { makePet, makeReminder, makeProvider, makeMedicalRecord } from '../../helpers/test-data';

describe('Supabase queries: pets', () => {
  it('fetches pets by owner_id', async () => {
    const pet = makePet();
    const supabase = createMockSupabase({ tables: { pets: { data: [pet] } } });

    const chain = supabase.from('pets');
    chain.select('*');
    chain.eq('owner_id', pet.owner_id);
    const { data } = await chain.maybeSingle();

    expect(supabase.from).toHaveBeenCalledWith('pets');
    expect(data).toEqual(pet);
  });

  it('returns null when pet not found', async () => {
    const supabase = createMockSupabase({ tables: { pets: { data: null } } });
    const { data } = await supabase.from('pets').select('*').eq('id', 'nonexistent').maybeSingle();
    expect(data).toBeNull();
  });

  it('returns error on query failure', async () => {
    const supabase = createMockSupabase({
      tables: { pets: { data: null, error: { message: 'permission denied' } } },
    });
    const { error } = await supabase.from('pets').select('*').single();
    expect(error).toBeTruthy();
    expect(error!.message).toBe('permission denied');
  });
});

describe('Supabase queries: reminders', () => {
  it('fetches active reminders for a pet', async () => {
    const reminder = makeReminder();
    const supabase = createMockSupabase({ tables: { pet_reminders: { data: [reminder] } } });

    const chain = supabase.from('pet_reminders');
    chain.select('*');
    chain.eq('pet_id', reminder.pet_id);
    chain.eq('is_completed', false);
    chain.order('due_date', { ascending: true });
    const { data } = await chain.maybeSingle();

    expect(supabase.from).toHaveBeenCalledWith('pet_reminders');
    expect(data).toEqual(reminder);
  });
});

describe('Supabase queries: service_providers', () => {
  it('fetches provider by user_id', async () => {
    const provider = makeProvider();
    const supabase = createMockSupabase({ tables: { service_providers: { data: [provider] } } });

    const { data } = await supabase
      .from('service_providers')
      .select('*')
      .eq('user_id', provider.user_id)
      .maybeSingle();
    expect(data).toEqual(provider);
  });
});

describe('Supabase queries: medical_records', () => {
  it('fetches records ordered by date', async () => {
    const record = makeMedicalRecord();
    const supabase = createMockSupabase({ tables: { medical_records: { data: [record] } } });

    const chain = supabase.from('medical_records');
    chain.select('*');
    chain.eq('pet_id', record.pet_id);
    chain.order('date', { ascending: false });
    const { data } = await chain.maybeSingle();

    expect(data).toEqual(record);
  });
});

describe('Supabase queries: insert operations', () => {
  it('inserts a pet and returns the id', async () => {
    const newPet = { id: 'new-pet-id', name: 'Max' };
    const supabase = createMockSupabase({ tables: { pets: { data: [newPet] } } });

    const { data } = await supabase
      .from('pets')
      .insert({ name: 'Max', species: 'perro' })
      .select('id')
      .single();
    expect(data).toEqual(newPet);
  });
});
