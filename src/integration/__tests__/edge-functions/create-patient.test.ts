/**
 * Tests for create-patient edge function validation and business logic.
 * Source: supabase/functions/create-patient/index.ts
 */
import { describe, it, expect } from 'vitest';
import { makeNewPatientPayload } from '../../helpers/test-data';

// ─── Replicate validatePayload from create-patient/index.ts ─────────

interface NewPatientPayload {
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  sex?: string;
  weight?: string;
  color?: string;
  owner_name: string;
  owner_email: string;
  microchip_number?: string;
  blood_type?: string;
  known_allergies?: string;
  chronic_conditions?: string;
  force_create?: boolean;
}

type ValidationResult =
  | { valid: true; payload: NewPatientPayload }
  | { valid: false; error: string };

function validatePayload(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Body invalido' };
  const d = data as Record<string, unknown>;

  const name = typeof d.name === 'string' ? d.name.trim() : '';
  if (!name || name.length > 50)
    return { valid: false, error: 'Nombre requerido (max 50 caracteres)' };

  const species = typeof d.species === 'string' ? d.species.trim() : '';
  if (!species) return { valid: false, error: 'Especie requerida' };

  const owner_name = typeof d.owner_name === 'string' ? d.owner_name.trim() : '';
  if (!owner_name || owner_name.length < 2)
    return { valid: false, error: 'Nombre del dueno requerido (min 2 caracteres)' };

  const owner_email = typeof d.owner_email === 'string' ? d.owner_email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!owner_email || !emailRegex.test(owner_email))
    return { valid: false, error: 'Email del dueno invalido' };

  const microchip_number = typeof d.microchip_number === 'string' ? d.microchip_number.trim() : '';
  if (microchip_number && !/^\d{15}$/.test(microchip_number)) {
    return { valid: false, error: 'El microchip debe tener exactamente 15 digitos' };
  }

  return {
    valid: true,
    payload: {
      name,
      species,
      breed: typeof d.breed === 'string' ? d.breed.trim() : undefined,
      birth_date: typeof d.birth_date === 'string' ? d.birth_date.trim() : undefined,
      sex: typeof d.sex === 'string' ? d.sex.trim() : undefined,
      weight: typeof d.weight === 'string' ? d.weight.trim() : undefined,
      color: typeof d.color === 'string' ? d.color.trim() : undefined,
      owner_name,
      owner_email,
      microchip_number: microchip_number || undefined,
      blood_type: typeof d.blood_type === 'string' ? d.blood_type.trim() : undefined,
      known_allergies: typeof d.known_allergies === 'string' ? d.known_allergies.trim() : undefined,
      chronic_conditions:
        typeof d.chronic_conditions === 'string' ? d.chronic_conditions.trim() : undefined,
      force_create: d.force_create === true,
    },
  };
}

// ─── Replicate Paw Card helpers ─────────────────────────────────────

type HoloPattern =
  | 'holo-none'
  | 'holo-paws'
  | 'holo-stars'
  | 'holo-hearts'
  | 'holo-diamonds'
  | 'holo-waves'
  | 'holo-fire'
  | 'holo-galaxy'
  | 'holo-rainbow';

const HOLO_PATTERNS: { id: HoloPattern; probability: number }[] = [
  { id: 'holo-none', probability: 0.35 },
  { id: 'holo-paws', probability: 0.2 },
  { id: 'holo-stars', probability: 0.15 },
  { id: 'holo-hearts', probability: 0.1 },
  { id: 'holo-diamonds', probability: 0.08 },
  { id: 'holo-waves', probability: 0.05 },
  { id: 'holo-fire', probability: 0.04 },
  { id: 'holo-galaxy', probability: 0.02 },
  { id: 'holo-rainbow', probability: 0.01 },
];

function rollHoloPattern(): HoloPattern {
  const roll = Math.random();
  let cumulative = 0;
  for (const p of HOLO_PATTERNS) {
    cumulative += p.probability;
    if (roll < cumulative) return p.id;
  }
  return 'holo-none';
}

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generatePawCardId(): string {
  const block = (len: number) =>
    Array.from({ length: len }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('');
  return `PAW-${block(4)}-${block(4)}`;
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('create-patient: validatePayload', () => {
  it('accepts a valid payload', () => {
    const result = validatePayload(makeNewPatientPayload());
    expect(result.valid).toBe(true);
  });

  it('rejects null body', () => {
    const result = validatePayload(null);
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toBe('Body invalido');
  });

  it('rejects empty name', () => {
    const result = validatePayload(makeNewPatientPayload({ name: '' }));
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('Nombre');
  });

  it('rejects name over 50 chars', () => {
    const result = validatePayload(makeNewPatientPayload({ name: 'A'.repeat(51) }));
    expect(result.valid).toBe(false);
  });

  it('rejects empty species', () => {
    const result = validatePayload(makeNewPatientPayload({ species: '' }));
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('Especie');
  });

  it('rejects owner_name shorter than 2 chars', () => {
    const result = validatePayload(makeNewPatientPayload({ owner_name: 'A' }));
    expect(result.valid).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = validatePayload(makeNewPatientPayload({ owner_email: 'not-an-email' }));
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('Email');
  });

  it('accepts email and lowercases it', () => {
    const result = validatePayload(makeNewPatientPayload({ owner_email: 'Test@EXAMPLE.com' }));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.payload.owner_email).toBe('test@example.com');
  });

  it('rejects microchip with letters', () => {
    const result = validatePayload(makeNewPatientPayload({ microchip_number: '12345678901234A' }));
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('microchip');
  });

  it('rejects microchip with wrong length', () => {
    const result = validatePayload(makeNewPatientPayload({ microchip_number: '1234567890' }));
    expect(result.valid).toBe(false);
  });

  it('accepts valid 15-digit microchip', () => {
    const result = validatePayload(makeNewPatientPayload({ microchip_number: '123456789012345' }));
    expect(result.valid).toBe(true);
  });

  it('accepts empty microchip (optional)', () => {
    const result = validatePayload(makeNewPatientPayload({ microchip_number: '' }));
    expect(result.valid).toBe(true);
  });

  it('trims all string fields', () => {
    const result = validatePayload(
      makeNewPatientPayload({ name: '  Max  ', species: '  perro  ' })
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.name).toBe('Max');
      expect(result.payload.species).toBe('perro');
    }
  });

  it('sets force_create only when explicitly true', () => {
    const r1 = validatePayload(makeNewPatientPayload({ force_create: true }));
    if (r1.valid) expect(r1.payload.force_create).toBe(true);

    const r2 = validatePayload(makeNewPatientPayload({ force_create: false }));
    if (r2.valid) expect(r2.payload.force_create).toBe(false);

    const r3 = validatePayload(makeNewPatientPayload());
    if (r3.valid) expect(r3.payload.force_create).toBe(false);
  });
});

describe('create-patient: Paw Card generation', () => {
  it('generatePawCardId matches PAW-XXXX-XXXX format', () => {
    for (let i = 0; i < 20; i++) {
      const id = generatePawCardId();
      expect(id).toMatch(/^PAW-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
  });

  it('generatePawCardId excludes confusing characters (0, 1, I, O)', () => {
    for (let i = 0; i < 50; i++) {
      const id = generatePawCardId();
      const chars = id.replace(/PAW-|-/g, '');
      expect(chars).not.toMatch(/[01IO]/);
    }
  });

  it('rollHoloPattern always returns a valid pattern', () => {
    const validPatterns = HOLO_PATTERNS.map((p) => p.id);
    for (let i = 0; i < 100; i++) {
      expect(validPatterns).toContain(rollHoloPattern());
    }
  });

  it('holo probabilities sum to ~1.0', () => {
    const sum = HOLO_PATTERNS.reduce((acc, p) => acc + p.probability, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });
});
