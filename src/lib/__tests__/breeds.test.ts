/**
 * Tests de breeds.ts (Sprint 1 P1, 2026-04-28).
 *
 * Las razas son la fuente unica de verdad para dropdowns de pets +
 * adopcion + estimador de precios. La normalizacion de acentos hace
 * que escribir "frances" matchee "Bulldog Francés".
 */
import { describe, it, expect } from 'vitest';
import { BREEDS_BY_SPECIES, filterBreeds, getBreedLabel } from '../breeds';

describe('BREEDS_BY_SPECIES (constante)', () => {
  it('contiene perro y gato como minimo', () => {
    expect(BREEDS_BY_SPECIES.perro).toBeDefined();
    expect(BREEDS_BY_SPECIES.gato).toBeDefined();
  });

  it('cada raza tiene value y label', () => {
    for (const [, breeds] of Object.entries(BREEDS_BY_SPECIES)) {
      for (const b of breeds) {
        expect(typeof b.value).toBe('string');
        expect(typeof b.label).toBe('string');
        expect(b.value.length).toBeGreaterThan(0);
        expect(b.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('values no tienen mayusculas (slug-style)', () => {
    for (const [, breeds] of Object.entries(BREEDS_BY_SPECIES)) {
      for (const b of breeds) {
        expect(b.value).toBe(b.value.toLowerCase());
      }
    }
  });

  it('no hay duplicados de value dentro de una especie', () => {
    for (const [, breeds] of Object.entries(BREEDS_BY_SPECIES)) {
      const values = breeds.map((b) => b.value);
      const uniq = new Set(values);
      expect(uniq.size).toBe(values.length);
    }
  });
});

describe('filterBreeds', () => {
  it('especie sin razas registradas devuelve []', () => {
    expect(filterBreeds('especie-inexistente-xyz', '')).toEqual([]);
  });

  it('query vacio devuelve todas las razas de la especie', () => {
    const all = filterBreeds('perro', '');
    expect(all.length).toBe(BREEDS_BY_SPECIES.perro.length);
    expect(all.length).toBeGreaterThan(0);
  });

  it('matchea por substring case-insensitive', () => {
    const labrador = filterBreeds('perro', 'labrador');
    expect(labrador.some((b) => b.label.toLowerCase().includes('labrador'))).toBe(true);

    const LABRADOR = filterBreeds('perro', 'LABRADOR');
    expect(LABRADOR).toEqual(labrador);
  });

  it('normaliza acentos: "frances" matchea "Francés"', () => {
    const conAcento = filterBreeds('perro', 'francés');
    const sinAcento = filterBreeds('perro', 'frances');
    expect(sinAcento.length).toBe(conAcento.length);
    expect(sinAcento.length).toBeGreaterThan(0);
  });

  it('query con mayusculas y acentos mezclados normaliza', () => {
    expect(filterBreeds('perro', 'BULLDOG').length).toBeGreaterThan(0);
    expect(filterBreeds('perro', 'Pastor').length).toBeGreaterThan(0);
  });

  it('query sin matches devuelve []', () => {
    expect(filterBreeds('perro', 'xxxinexistentexxx')).toEqual([]);
  });

  it('query solo con espacios devuelve TODAS las razas (trim antes de check vacio)', () => {
    const all = filterBreeds('perro', '   ');
    expect(all.length).toBe(BREEDS_BY_SPECIES.perro.length);
  });
});

describe('getBreedLabel', () => {
  it('value vacio devuelve ""', () => {
    expect(getBreedLabel('perro', '')).toBe('');
  });

  it('value valido devuelve su label', () => {
    const firstPerro = BREEDS_BY_SPECIES.perro[0];
    expect(getBreedLabel('perro', firstPerro.value)).toBe(firstPerro.label);
  });

  it('value "otro:texto" devuelve el texto custom', () => {
    expect(getBreedLabel('perro', 'otro:Mestizo grande')).toBe('Mestizo grande');
  });

  it('value "otro:" sin texto devuelve "Otro"', () => {
    expect(getBreedLabel('perro', 'otro:')).toBe('Otro');
  });

  it('value desconocido devuelve el value como fallback', () => {
    expect(getBreedLabel('perro', 'breed-no-existe')).toBe('breed-no-existe');
  });

  it('especie sin razas devuelve el value como fallback', () => {
    expect(getBreedLabel('especie-inexistente', 'cualquiera')).toBe('cualquiera');
  });
});
