/**
 * Tests de frequencies.ts (Sprint 1 P1, 2026-04-28).
 *
 * Frecuencias clinicas (vacuna, antiparasitario interno/externo) son la
 * fuente unica de verdad para el FE. Si estas reglas cambian, el trigger
 * SQL `create_preventive_reminder()` debe actualizarse en paralelo.
 * Estos tests congelan el contrato.
 */
import { describe, it, expect } from 'vitest';
import {
  nextAntiparasiticDate,
  nextVaccineDate,
  antiparasiticRecurrence,
  reminderTypeForAntiparasitic,
  nextPreventiveCareDate,
} from '../frequencies';

const BASE_DATE = new Date('2026-01-15T12:00:00Z');

describe('nextAntiparasiticDate', () => {
  it('interno → +3 meses', () => {
    const result = nextAntiparasiticDate(BASE_DATE, 'interno');
    expect(result.getUTCMonth()).toBe(3); // Abril (0-indexed)
    expect(result.getUTCFullYear()).toBe(2026);
  });

  it('ambos → +3 meses', () => {
    const result = nextAntiparasiticDate(BASE_DATE, 'ambos');
    expect(result.getUTCMonth()).toBe(3);
  });

  it('externo sin marca larga → +1 mes', () => {
    const result = nextAntiparasiticDate(BASE_DATE, 'externo');
    expect(result.getUTCMonth()).toBe(1); // Febrero
  });

  it('externo + Bravecto → +3 meses', () => {
    const result = nextAntiparasiticDate(BASE_DATE, 'externo', 'Bravecto Plus');
    expect(result.getUTCMonth()).toBe(3);
  });

  it('externo + Nexgard Spectra → +3 meses', () => {
    const result = nextAntiparasiticDate(BASE_DATE, 'externo', 'Nexgard Spectra 30mg');
    expect(result.getUTCMonth()).toBe(3);
  });

  it('externo + marca larga case-insensitive', () => {
    expect(nextAntiparasiticDate(BASE_DATE, 'externo', 'BRAVECTO').getUTCMonth()).toBe(3);
    expect(nextAntiparasiticDate(BASE_DATE, 'externo', 'bravecto').getUTCMonth()).toBe(3);
    expect(nextAntiparasiticDate(BASE_DATE, 'externo', '  Bravecto  ').getUTCMonth()).toBe(3);
  });

  it('externo + marca corta (Frontline) → +1 mes', () => {
    expect(nextAntiparasiticDate(BASE_DATE, 'externo', 'Frontline').getUTCMonth()).toBe(1);
  });

  it('null/undefined type → default +3 meses (conservador)', () => {
    expect(nextAntiparasiticDate(BASE_DATE, null).getUTCMonth()).toBe(3);
    expect(nextAntiparasiticDate(BASE_DATE, undefined).getUTCMonth()).toBe(3);
  });
});

describe('nextVaccineDate', () => {
  it('sin override → +12 meses (annual default)', () => {
    const result = nextVaccineDate(BASE_DATE);
    expect(result.getUTCFullYear()).toBe(2027);
    expect(result.getUTCMonth()).toBe(0); // Enero
  });

  it('respeta override del vet si existe', () => {
    const override = new Date('2026-07-15T12:00:00Z');
    expect(nextVaccineDate(BASE_DATE, override)).toBe(override);
  });

  it('override null → cae a +12 meses default', () => {
    const result = nextVaccineDate(BASE_DATE, null);
    expect(result.getUTCFullYear()).toBe(2027);
  });
});

describe('antiparasiticRecurrence', () => {
  it('externo + marca corta → monthly', () => {
    expect(antiparasiticRecurrence('externo')).toBe('monthly');
    expect(antiparasiticRecurrence('externo', 'Frontline')).toBe('monthly');
  });

  it('externo + marca larga → quarterly', () => {
    expect(antiparasiticRecurrence('externo', 'Bravecto')).toBe('quarterly');
    expect(antiparasiticRecurrence('externo', 'Nexgard Spectra')).toBe('quarterly');
  });

  it('interno → quarterly', () => {
    expect(antiparasiticRecurrence('interno')).toBe('quarterly');
  });

  it('ambos → quarterly', () => {
    expect(antiparasiticRecurrence('ambos')).toBe('quarterly');
  });

  it('null/undefined → quarterly (conservador)', () => {
    expect(antiparasiticRecurrence(null)).toBe('quarterly');
    expect(antiparasiticRecurrence(undefined)).toBe('quarterly');
  });
});

describe('reminderTypeForAntiparasitic', () => {
  it('externo → flea', () => {
    expect(reminderTypeForAntiparasitic('externo')).toBe('flea');
  });

  it('interno → deworming', () => {
    expect(reminderTypeForAntiparasitic('interno')).toBe('deworming');
  });

  it('ambos → deworming (interno gana)', () => {
    expect(reminderTypeForAntiparasitic('ambos')).toBe('deworming');
  });

  it('null/undefined → deworming (default conservador)', () => {
    expect(reminderTypeForAntiparasitic(null)).toBe('deworming');
    expect(reminderTypeForAntiparasitic(undefined)).toBe('deworming');
  });
});

describe('nextPreventiveCareDate (helper unificado)', () => {
  it('vacuna sin override → +12 meses', () => {
    const result = nextPreventiveCareDate({ recordType: 'vacuna', date: BASE_DATE });
    expect(result?.getUTCFullYear()).toBe(2027);
  });

  it('vacuna con override → respeta override', () => {
    const override = new Date('2026-08-01T12:00:00Z');
    const result = nextPreventiveCareDate({
      recordType: 'vacuna',
      date: BASE_DATE,
      nextDateOverride: override,
    });
    expect(result).toBe(override);
  });

  it('antiparasitario interno → +3 meses', () => {
    const result = nextPreventiveCareDate({
      recordType: 'antiparasitario',
      date: BASE_DATE,
      antiparasiticType: 'interno',
    });
    expect(result?.getUTCMonth()).toBe(3);
  });

  it('antiparasitario externo + marca corta → +1 mes', () => {
    const result = nextPreventiveCareDate({
      recordType: 'antiparasitario',
      date: BASE_DATE,
      antiparasiticType: 'externo',
      productBrand: 'Frontline',
    });
    expect(result?.getUTCMonth()).toBe(1);
  });

  it('antiparasitario externo + Bravecto → +3 meses', () => {
    const result = nextPreventiveCareDate({
      recordType: 'antiparasitario',
      date: BASE_DATE,
      antiparasiticType: 'externo',
      productBrand: 'Bravecto',
    });
    expect(result?.getUTCMonth()).toBe(3);
  });

  it('alias "desparasitacion" funciona como antiparasitario', () => {
    const result = nextPreventiveCareDate({
      recordType: 'desparasitacion',
      date: BASE_DATE,
      antiparasiticType: 'interno',
    });
    expect(result?.getUTCMonth()).toBe(3);
  });

  it('alias "antipulgas" funciona como antiparasitario', () => {
    const result = nextPreventiveCareDate({
      recordType: 'antipulgas',
      date: BASE_DATE,
      antiparasiticType: 'externo',
    });
    expect(result?.getUTCMonth()).toBe(1);
  });

  it('record_type no preventivo → null (no genera reminder)', () => {
    expect(nextPreventiveCareDate({ recordType: 'consulta', date: BASE_DATE })).toBeNull();
    expect(nextPreventiveCareDate({ recordType: 'cirugia', date: BASE_DATE })).toBeNull();
    expect(
      nextPreventiveCareDate({ recordType: 'examen_laboratorio', date: BASE_DATE })
    ).toBeNull();
  });

  it('antiparasitario con override gana sobre calculo automatico', () => {
    const override = new Date('2026-12-31T12:00:00Z');
    const result = nextPreventiveCareDate({
      recordType: 'antiparasitario',
      date: BASE_DATE,
      antiparasiticType: 'externo',
      productBrand: 'Frontline',
      nextDateOverride: override,
    });
    expect(result).toBe(override);
  });
});
