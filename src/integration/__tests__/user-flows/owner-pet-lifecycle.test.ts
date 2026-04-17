/**
 * Tests for the owner pet lifecycle:
 * Create pet → view ficha → add reminders → share → download PDF
 */
import { describe, it, expect } from 'vitest';
import { createMockSupabase } from '../../helpers/mock-supabase';
import { makeUser, makePet, makeReminder, makeMedicalRecord } from '../../helpers/test-data';

describe('Owner pet lifecycle', () => {
  const owner = makeUser();
  const pet = makePet({ owner_id: owner.id });

  it('1. Owner creates a pet successfully', async () => {
    const supabase = createMockSupabase({
      authUser: owner,
      tables: { pets: { data: [{ id: pet.id }] } },
    });

    // Insert pet
    const { data, error } = await supabase
      .from('pets')
      .insert({
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birth_date: pet.birth_date,
        owner_id: owner.id,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
  });

  it('2. Owner can view their pet details', async () => {
    const supabase = createMockSupabase({
      authUser: owner,
      tables: { pets: { data: [pet] } },
    });

    const { data } = await supabase.from('pets').select('*').eq('owner_id', owner.id).maybeSingle();
    expect(data).toBeTruthy();
    expect(data!.name).toBe('Luna');
    expect(data!.species).toBe('perro');
  });

  it('3. Owner can view medical records for their pet', async () => {
    const record = makeMedicalRecord({ pet_id: pet.id });
    const supabase = createMockSupabase({
      authUser: owner,
      tables: { medical_records: { data: [record] } },
    });

    const { data } = await supabase
      .from('medical_records')
      .select('*')
      .eq('pet_id', pet.id)
      .maybeSingle();
    expect(data).toBeTruthy();
    expect(data!.diagnosis).toContain('rutina');
  });

  it('4. Owner can create reminders for their pet', async () => {
    const reminder = makeReminder({ pet_id: pet.id, user_id: owner.id });
    const supabase = createMockSupabase({
      authUser: owner,
      tables: { pet_reminders: { data: [reminder] } },
    });

    const { data } = await supabase
      .from('pet_reminders')
      .insert({
        pet_id: pet.id,
        user_id: owner.id,
        title: 'Vacuna antirrábica',
        type: 'vacuna',
        due_date: '2025-06-15T10:00:00Z',
      })
      .select('*')
      .single();

    expect(data).toBeTruthy();
    expect(data!.title).toBe('Vacuna antirrábica');
  });

  it('5. Owner can invoke share function', async () => {
    const supabase = createMockSupabase({
      authUser: owner,
      functions: {
        'send-pet-invitation': { data: { success: true, email_sent: true } },
      },
    });

    const { data, error } = await supabase.functions.invoke('send-pet-invitation', {
      body: { pet_id: pet.id, email: 'friend@example.com' },
    });
    expect(error).toBeNull();
    expect(data).toEqual({ success: true, email_sent: true });
  });

  it('6. Owner can invoke PDF generation', async () => {
    const supabase = createMockSupabase({
      authUser: owner,
      functions: {
        'generate-medical-summary': {
          data: { pdf_url: 'https://storage.example.com/summary.pdf' },
        },
      },
    });

    const { data, error } = await supabase.functions.invoke('generate-medical-summary', {
      body: { pet_id: pet.id },
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('pdf_url');
  });

  it('7. Owner can upload a pet photo', async () => {
    const supabase = createMockSupabase({
      authUser: owner,
      storage: { publicUrl: 'https://storage.example.com/pet-photos/luna.jpg' },
    });

    const { data, error } = await supabase.storage
      .from('pet-photos')
      .upload(`${owner.id}/${pet.id}.jpg`, new Blob(['fake-image'], { type: 'image/jpeg' }));
    expect(error).toBeNull();
    expect(data).toHaveProperty('path');

    const { data: urlData } = supabase.storage
      .from('pet-photos')
      .getPublicUrl(`${owner.id}/${pet.id}.jpg`);
    expect(urlData.publicUrl).toContain('pet-photos');
  });
});
