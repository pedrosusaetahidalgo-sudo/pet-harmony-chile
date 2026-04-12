import { describe, it, expect } from 'vitest';
import { getVaccinesForSpecies, VACCINE_CATALOG } from '../vaccines';

describe('getVaccinesForSpecies', () => {
  it('returns vaccines for perro', () => {
    const vaccines = getVaccinesForSpecies('perro');
    expect(vaccines.length).toBeGreaterThan(0);
    expect(vaccines.some((v) => v.name.includes('Antirrábica'))).toBe(true);
  });

  it('returns vaccines for gato', () => {
    const vaccines = getVaccinesForSpecies('gato');
    expect(vaccines.length).toBeGreaterThan(0);
    expect(vaccines.some((v) => v.name.includes('Triple felina'))).toBe(true);
  });

  it('returns vaccines for conejo', () => {
    const vaccines = getVaccinesForSpecies('conejo');
    expect(vaccines).toHaveLength(2);
  });

  it('is case-insensitive', () => {
    expect(getVaccinesForSpecies('Perro')).toEqual(getVaccinesForSpecies('perro'));
  });

  it('returns empty array for unknown species', () => {
    expect(getVaccinesForSpecies('dragón')).toEqual([]);
  });
});

describe('VACCINE_CATALOG', () => {
  it('has entries for perro, gato, conejo', () => {
    expect(VACCINE_CATALOG).toHaveProperty('perro');
    expect(VACCINE_CATALOG).toHaveProperty('gato');
    expect(VACCINE_CATALOG).toHaveProperty('conejo');
  });

  it('each vaccine has name, description, and schedule', () => {
    for (const species of Object.keys(VACCINE_CATALOG)) {
      for (const vaccine of VACCINE_CATALOG[species]) {
        expect(vaccine.name).toBeTruthy();
        expect(vaccine.description).toBeTruthy();
        expect(vaccine.schedule).toBeTruthy();
      }
    }
  });
});
