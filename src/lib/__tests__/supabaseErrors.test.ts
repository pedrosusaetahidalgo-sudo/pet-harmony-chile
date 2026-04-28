/**
 * Tests de describeSupabaseError (Sprint 1 P1, 2026-04-28).
 *
 * Cubre los 3 paths de matching: nombre de constraint > codigo Postgres > fallback.
 */
import { describe, it, expect } from 'vitest';
import { describeSupabaseError } from '../supabaseErrors';

describe('describeSupabaseError', () => {
  it('devuelve fallback en null/undefined', () => {
    expect(describeSupabaseError(null)).toMatch(/error inesperado/i);
    expect(describeSupabaseError(undefined)).toMatch(/error inesperado/i);
  });

  it('respeta fallback custom cuando err es vacio', () => {
    expect(describeSupabaseError(null, 'mi fallback custom')).toBe('mi fallback custom');
  });

  describe('codigos Postgres', () => {
    it('23505 (unique violation) → ya existe', () => {
      expect(describeSupabaseError({ code: '23505', message: 'duplicate' })).toMatch(
        /Ya existe un registro/
      );
    });

    it('23503 (FK violation) → falta dato relacionado', () => {
      expect(describeSupabaseError({ code: '23503', message: 'fk fail' })).toMatch(
        /falta un dato relacionado/
      );
    });

    it('23502 (NOT NULL violation) → falta campo obligatorio', () => {
      expect(describeSupabaseError({ code: '23502', message: 'null val' })).toMatch(
        /campo obligatorio/
      );
    });

    it('42501 (insufficient privilege) → sin permisos', () => {
      expect(describeSupabaseError({ code: '42501', message: 'permission' })).toMatch(
        /No tienes permisos/
      );
    });

    it('PGRST116 (not found) → no se encontro', () => {
      expect(describeSupabaseError({ code: 'PGRST116', message: 'not found' })).toMatch(
        /No se encontró el registro/
      );
    });

    it('PGRST301 (JWT expired via code) → sesion expiro', () => {
      expect(describeSupabaseError({ code: 'PGRST301', message: 'expired' })).toMatch(
        /Tu sesión expiró/
      );
    });

    it('42703 (column missing) → reporta a soporte', () => {
      expect(describeSupabaseError({ code: '42703', message: 'col not found' })).toMatch(
        /soporte@pawfriend\.cl/
      );
    });
  });

  describe('matching por nombre de constraint', () => {
    it('pets_species_check → mensaje especifico', () => {
      const err = {
        code: '23514',
        message: 'new row for relation "pets" violates check constraint "pets_species_check"',
      };
      expect(describeSupabaseError(err)).toMatch(/especie seleccionada no está permitida/);
    });

    it('pets_birth_date_reasonable → mensaje especifico', () => {
      const err = {
        code: '23514',
        message: 'violates check constraint "pets_birth_date_reasonable"',
      };
      expect(describeSupabaseError(err)).toMatch(/fecha de nacimiento no es válida/);
    });

    it('chk_pet_has_responsible → mensaje especifico', () => {
      const err = {
        code: '23514',
        message: 'violates check constraint "chk_pet_has_responsible"',
      };
      expect(describeSupabaseError(err)).toMatch(/dueño o un veterinario creador/);
    });

    it('constraint desconocido → mensaje generico con nombre', () => {
      const err = {
        code: '23514',
        message: 'violates check constraint "some_unmapped_constraint"',
      };
      const out = describeSupabaseError(err);
      expect(out).toMatch(/regla de la base de datos/);
      expect(out).toContain('some_unmapped_constraint');
    });

    it('constraint match tiene precedencia sobre code mapping', () => {
      // El codigo 23514 mapea a "no cumple reglas", pero el constraint
      // pets_species_check es mas especifico.
      const err = {
        code: '23514',
        message: 'violates check constraint "pets_species_check"',
      };
      expect(describeSupabaseError(err)).toMatch(/especie/);
      expect(describeSupabaseError(err)).not.toMatch(/no cumple las reglas/);
    });
  });

  describe('matching por substring de message', () => {
    it('mensaje con "JWT" → sesion expiro', () => {
      expect(describeSupabaseError({ message: 'JWT expired or invalid' })).toMatch(
        /Tu sesión expiró/
      );
    });

    it('mensaje con "violates row-level security" → sin permisos', () => {
      expect(
        describeSupabaseError({ message: 'new row violates row-level security policy' })
      ).toMatch(/No tienes permisos/);
    });
  });

  describe('fallback con detalles del server', () => {
    it('concatena message + details + hint con separador', () => {
      const err = {
        code: 'UNKNOWN',
        message: 'msg principal',
        details: 'mas detalle',
        hint: 'sugerencia',
      };
      expect(describeSupabaseError(err)).toBe('msg principal — mas detalle — sugerencia');
    });

    it('omite null/undefined del concat', () => {
      const err = {
        code: 'UNKNOWN',
        message: 'solo mensaje',
        details: null,
        hint: undefined,
      };
      expect(describeSupabaseError(err)).toBe('solo mensaje');
    });

    it('cae al fallback final si todos los campos son vacios', () => {
      const err = { code: 'UNKNOWN', message: null, details: null, hint: null };
      expect(describeSupabaseError(err)).toMatch(/error inesperado/i);
    });
  });

  describe('orden de precedencia (constraint > code > substring > fallback)', () => {
    it('constraint match gana sobre todo', () => {
      const err = {
        code: '23514',
        message: 'JWT expired and violates check constraint "pets_species_check"',
      };
      // Aunque tiene "JWT", el constraint match es mas especifico.
      expect(describeSupabaseError(err)).toMatch(/especie/);
    });

    it('JWT substring gana sobre code mapping', () => {
      const err = { code: '42501', message: 'JWT expired' };
      // 42501 es "sin permisos" pero JWT viene primero en el if-chain.
      expect(describeSupabaseError(err)).toMatch(/Tu sesión expiró/);
    });
  });
});
