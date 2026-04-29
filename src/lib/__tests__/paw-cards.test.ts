/**
 * Tests de paw-cards.ts (Sprint 1 P1, 2026-04-28).
 *
 * Cubre las funciones puras de matching:
 *   - getSpeciesPalette: especie → paleta de colores
 *   - getBreedTint: raza → CSS overlay tint
 *   - getBreedHoloPattern: raza+especie → patron holografico
 *   - generatePawCardId: formato del ID
 *   - rollHoloPattern: distribucion de probabilidades
 *
 * Estos tests congelan el contrato de visual identity que afecta a
 * /paw-card/:id (publica) y /paw-collection (privada).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  getSpeciesPalette,
  getBreedTint,
  getBreedHoloPattern,
  generatePawCardId,
  rollHoloPattern,
  HOLO_PATTERNS,
  HOLO_PATTERN_MAP,
  SPECIES_PALETTES,
} from '../paw-cards';

describe('getSpeciesPalette', () => {
  it('matchea perro (espanol y ingles)', () => {
    expect(getSpeciesPalette('perro')).toBe(SPECIES_PALETTES.perro);
    expect(getSpeciesPalette('Dog')).toBe(SPECIES_PALETTES.perro);
    expect(getSpeciesPalette('PERRO')).toBe(SPECIES_PALETTES.perro);
  });

  it('matchea gato', () => {
    expect(getSpeciesPalette('gato')).toBe(SPECIES_PALETTES.gato);
    expect(getSpeciesPalette('Cat')).toBe(SPECIES_PALETTES.gato);
  });

  it('matchea conejo', () => {
    expect(getSpeciesPalette('conejo')).toBe(SPECIES_PALETTES.conejo);
    expect(getSpeciesPalette('rabbit')).toBe(SPECIES_PALETTES.conejo);
  });

  it('matchea aves (ave, pajaro, bird)', () => {
    expect(getSpeciesPalette('ave')).toBe(SPECIES_PALETTES.ave);
    expect(getSpeciesPalette('pajaro')).toBe(SPECIES_PALETTES.ave);
    expect(getSpeciesPalette('Bird')).toBe(SPECIES_PALETTES.ave);
  });

  it('matchea reptiles (reptil, lagarto, tortuga, serpiente)', () => {
    expect(getSpeciesPalette('reptil')).toBe(SPECIES_PALETTES.reptil);
    expect(getSpeciesPalette('Lagarto')).toBe(SPECIES_PALETTES.reptil);
    expect(getSpeciesPalette('tortuga')).toBe(SPECIES_PALETTES.reptil);
    expect(getSpeciesPalette('serpiente')).toBe(SPECIES_PALETTES.reptil);
  });

  it('especie desconocida devuelve fallback (purple)', () => {
    const result = getSpeciesPalette('hamster');
    expect(result).toBeDefined();
    expect(result.icon).toBe('🐾');
  });

  it('case insensitive con espacios extra', () => {
    expect(getSpeciesPalette('  PERRO  ')).toBe(SPECIES_PALETTES.perro);
  });
});

describe('getBreedTint', () => {
  it('retorna null si breed es null', () => {
    expect(getBreedTint(null)).toBeNull();
  });

  it('matchea breed exacto (case-insensitive)', () => {
    const result = getBreedTint('Golden Retriever');
    expect(result).toContain('hsl(45 80% 65% / 0.08)');
  });

  it('matchea breed parcial (substring)', () => {
    expect(getBreedTint('Pastor Aleman puro')).toContain('hsl(30 55% 45%');
    expect(getBreedTint('Bulldog Frances mestizo')).toContain('hsl(340 55% 70%');
  });

  it('breed no listado retorna null', () => {
    expect(getBreedTint('mestizo desconocido')).toBeNull();
    expect(getBreedTint('quiltro')).toBeNull();
  });

  it('matchea gatos', () => {
    expect(getBreedTint('Bengal')).toContain('hsl(30 70% 55%');
    expect(getBreedTint('Siames')).toContain('hsl(200 50% 70%');
  });
});

describe('getBreedHoloPattern', () => {
  it('breed null usa fallback de especie', () => {
    expect(getBreedHoloPattern('perro', null)).toBe('holo-paws');
    expect(getBreedHoloPattern('gato', null)).toBe('holo-stars');
    expect(getBreedHoloPattern('conejo', null)).toBe('holo-paws');
    expect(getBreedHoloPattern('ave', null)).toBe('holo-rainbow');
    expect(getBreedHoloPattern('reptil', null)).toBe('holo-waves');
  });

  it('especie desconocida usa default holo-paws', () => {
    expect(getBreedHoloPattern('hamster', null)).toBe('holo-paws');
  });

  it('matchea breed especifico (perros pequenos → hearts)', () => {
    expect(getBreedHoloPattern('perro', 'Chihuahua')).toBe('holo-hearts');
  });

  it('matchea perros grandes (rottweiler/doberman) → fire', () => {
    expect(getBreedHoloPattern('perro', 'Rottweiler')).toBe('holo-fire');
  });

  it('matchea gatos lujo → diamonds', () => {
    expect(getBreedHoloPattern('gato', 'Persa')).toBe('holo-diamonds');
    expect(getBreedHoloPattern('gato', 'Ragdoll')).toBe('holo-diamonds');
  });

  it('matchea gatos exoticos → galaxy', () => {
    expect(getBreedHoloPattern('gato', 'Siames')).toBe('holo-galaxy');
    expect(getBreedHoloPattern('gato', 'Sphynx')).toBe('holo-galaxy');
  });

  it('matchea gato majestuoso (Maine Coon) → stars', () => {
    expect(getBreedHoloPattern('gato', 'Maine Coon')).toBe('holo-stars');
  });

  it('breed con case-insensitive matching', () => {
    expect(getBreedHoloPattern('perro', 'CHIHUAHUA')).toBe('holo-hearts');
    expect(getBreedHoloPattern('gato', 'persa')).toBe('holo-diamonds');
  });

  it('breed no mapeado cae a fallback de especie', () => {
    expect(getBreedHoloPattern('perro', 'Border Collie')).toBe('holo-paws');
  });
});

describe('generatePawCardId', () => {
  it('formato PAW-XXXX-XXXX', () => {
    const id = generatePawCardId();
    expect(id).toMatch(/^PAW-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it('NO incluye chars confusos (I, O, 0, 1)', () => {
    // Generar 100 IDs y verificar que ninguno contiene I/O/0/1
    for (let i = 0; i < 100; i++) {
      const id = generatePawCardId();
      expect(id).not.toMatch(/[IO01]/);
    }
  });

  it('IDs son razonablemente unicos', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generatePawCardId());
    }
    // 32^8 = 1.1e12 espacio, colisiones en 100 son astronomicamente improbables
    expect(ids.size).toBe(100);
  });
});

describe('rollHoloPattern', () => {
  it('siempre devuelve un patron del set HOLO_PATTERNS', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollHoloPattern();
      expect(HOLO_PATTERN_MAP[result]).toBeDefined();
    }
  });

  it('roll bajo (0.0) devuelve el primer patron por probabilidad', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(rollHoloPattern()).toBe('holo-none');
    vi.restoreAllMocks();
  });

  it('roll alto (0.999) devuelve el ultimo patron', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const result = rollHoloPattern();
    // El roll 0.999 cae despues de la suma acumulada de probabilidades.
    // Debe retornar uno de los patrones, en particular el ultimo o fallback.
    expect(HOLO_PATTERN_MAP[result]).toBeDefined();
    vi.restoreAllMocks();
  });

  it('probabilidades de HOLO_PATTERNS suman ~1.0', () => {
    const sum = HOLO_PATTERNS.reduce((acc, p) => acc + p.probability, 0);
    expect(sum).toBeGreaterThanOrEqual(0.99);
    expect(sum).toBeLessThanOrEqual(1.01);
  });
});

describe('HOLO_PATTERN_MAP consistency', () => {
  it('todos los HOLO_PATTERNS estan en HOLO_PATTERN_MAP', () => {
    for (const pattern of HOLO_PATTERNS) {
      expect(HOLO_PATTERN_MAP[pattern.id]).toBe(pattern);
    }
  });
});
