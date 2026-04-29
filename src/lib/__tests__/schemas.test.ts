import { describe, it, expect } from 'vitest';
import {
  safeText,
  optionalText,
  reviewSchema,
  loginSchema,
  registerSchema,
  petSchema,
  addPetSchema,
  newPatientSchema,
  reportLostPetSchema,
} from '../schemas';

describe('safeText', () => {
  const field = safeText(50);

  it('accepts valid text', () => {
    expect(field.safeParse('Kai').success).toBe(true);
  });

  it('trims whitespace', () => {
    expect(field.parse('  Kai  ')).toBe('Kai');
  });

  it('rejects empty string', () => {
    expect(field.safeParse('').success).toBe(false);
  });

  it('rejects whitespace-only', () => {
    expect(field.safeParse('   ').success).toBe(false);
  });

  it('rejects text exceeding max length', () => {
    expect(field.safeParse('a'.repeat(51)).success).toBe(false);
  });

  it('accepts text at exactly max length', () => {
    expect(field.safeParse('a'.repeat(50)).success).toBe(true);
  });
});

describe('optionalText', () => {
  const field = optionalText(100);

  it('accepts valid text', () => {
    expect(field.safeParse('hola').success).toBe(true);
  });

  it('accepts empty string', () => {
    expect(field.safeParse('').success).toBe(true);
  });

  it('accepts undefined', () => {
    expect(field.safeParse(undefined).success).toBe(true);
  });

  it('rejects text exceeding max', () => {
    expect(field.safeParse('a'.repeat(101)).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({ email: 'user@test.cl', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    expect(loginSchema.safeParse({ email: '', password: '123456' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: '123456' }).success).toBe(
      false
    );
  });

  it('rejects password under 6 chars', () => {
    expect(loginSchema.safeParse({ email: 'u@t.cl', password: '12345' }).success).toBe(false);
  });

  it('accepts password of exactly 6 chars', () => {
    expect(loginSchema.safeParse({ email: 'u@t.cl', password: '123456' }).success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('extends loginSchema with optional fullName', () => {
    const result = registerSchema.safeParse({
      email: 'u@t.cl',
      password: '123456',
      fullName: 'Pedro',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty fullName', () => {
    const result = registerSchema.safeParse({
      email: 'u@t.cl',
      password: '123456',
      fullName: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('petSchema', () => {
  it('accepts valid pet', () => {
    const result = petSchema.safeParse({ name: 'Kai', species: 'perro' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(petSchema.safeParse({ name: '', species: 'perro' }).success).toBe(false);
  });

  it('rejects invalid species', () => {
    expect(petSchema.safeParse({ name: 'Kai', species: 'dinosaurio' }).success).toBe(false);
  });

  it('accepts all valid species', () => {
    const species = ['perro', 'gato', 'conejo', 'hamster', 'ave', 'tortuga', 'pez', 'otro'];
    species.forEach((s) => {
      expect(petSchema.safeParse({ name: 'Test', species: s }).success).toBe(true);
    });
  });
});

describe('reviewSchema', () => {
  it('accepts valid review', () => {
    const result = reviewSchema.safeParse({ comment: 'Excelente', rating: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    expect(reviewSchema.safeParse({ comment: 'Ok', rating: 0 }).success).toBe(false);
  });

  it('rejects rating above 5', () => {
    expect(reviewSchema.safeParse({ comment: 'Ok', rating: 6 }).success).toBe(false);
  });

  it('rejects empty comment', () => {
    expect(reviewSchema.safeParse({ comment: '', rating: 3 }).success).toBe(false);
  });
});

describe('addPetSchema — microchip validation', () => {
  const base = { name: 'Kai', species: 'perro' };

  it('accepts empty microchip', () => {
    expect(addPetSchema.safeParse({ ...base, microchip_number: '' }).success).toBe(true);
  });

  it('accepts valid 15-digit microchip', () => {
    expect(addPetSchema.safeParse({ ...base, microchip_number: '123456789012345' }).success).toBe(
      true
    );
  });

  it('rejects microchip with letters', () => {
    expect(addPetSchema.safeParse({ ...base, microchip_number: '12345678901234a' }).success).toBe(
      false
    );
  });

  it('rejects microchip with wrong length', () => {
    expect(addPetSchema.safeParse({ ...base, microchip_number: '1234567890' }).success).toBe(false);
    expect(addPetSchema.safeParse({ ...base, microchip_number: '1234567890123456' }).success).toBe(
      false
    );
  });
});

describe('newPatientSchema', () => {
  const base = {
    name: 'Luna',
    species: 'gato',
    owner_name: 'Maria',
    owner_email: 'maria@test.cl',
  };

  it('accepts valid new patient', () => {
    expect(newPatientSchema.safeParse(base).success).toBe(true);
  });

  it('rejects owner_name with 1 char', () => {
    expect(newPatientSchema.safeParse({ ...base, owner_name: 'A' }).success).toBe(false);
  });

  it('rejects invalid owner_email', () => {
    expect(newPatientSchema.safeParse({ ...base, owner_email: 'not-email' }).success).toBe(false);
  });
});

describe('reportLostPetSchema', () => {
  const base = {
    report_type: 'perdida' as const,
    pet_name: 'Kai',
    species: 'perro',
    description: 'Se perdio en el parque de Nunoa, es un pastor suizo blanco',
    last_seen_location: 'Parque Juan XXIII, Nunoa',
    last_seen_date: '2026-04-15',
  };

  it('accepts valid report', () => {
    expect(reportLostPetSchema.safeParse(base).success).toBe(true);
  });

  it('accepts "encontrada" report type', () => {
    expect(reportLostPetSchema.safeParse({ ...base, report_type: 'encontrada' }).success).toBe(
      true
    );
  });

  it('rejects invalid report type', () => {
    expect(reportLostPetSchema.safeParse({ ...base, report_type: 'robada' }).success).toBe(false);
  });

  it('rejects description under 10 chars', () => {
    expect(reportLostPetSchema.safeParse({ ...base, description: 'corta' }).success).toBe(false);
  });
});

// onboardingVetSchema tests eliminados 2026-04-28 (FEAT-004): el schema fue
// removido junto con OnboardingVetMinimal — la pagina ahora es un redirect.
