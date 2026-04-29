/**
 * Tests de locations.ts (Sprint 1 P1, 2026-04-28).
 *
 * Las 32 comunas de RM Santiago son fuente unica para dropdowns y mapas.
 * Si una coordenada esta mal, el pin del mapa cae en otra comuna y se
 * rompe el directorio. Estos tests congelan el contrato.
 */
import { describe, it, expect } from 'vitest';
import { COMUNAS_SANTIAGO, COMUNA_COORDS, COMUNAS_DROPDOWN, getComunaCoords } from '../locations';

describe('COMUNAS_SANTIAGO (constante)', () => {
  it('contiene 32 comunas RM', () => {
    expect(COMUNAS_SANTIAGO.length).toBe(32);
  });

  it('todas las comunas son strings no vacios', () => {
    for (const c of COMUNAS_SANTIAGO) {
      expect(typeof c).toBe('string');
      expect(c.length).toBeGreaterThan(0);
    }
  });

  it('comunas chilenas con acentos correctos', () => {
    expect(COMUNAS_SANTIAGO).toContain('Ñuñoa');
    expect(COMUNAS_SANTIAGO).toContain('Peñalolén');
    expect(COMUNAS_SANTIAGO).toContain('Maipú');
    expect(COMUNAS_SANTIAGO).toContain('Conchalí');
    expect(COMUNAS_SANTIAGO).toContain('San Joaquín');
  });

  it('no hay duplicados', () => {
    const uniq = new Set(COMUNAS_SANTIAGO);
    expect(uniq.size).toBe(COMUNAS_SANTIAGO.length);
  });

  it('comunas estan ordenadas alfabeticamente con locale es', () => {
    const sorted = [...COMUNAS_SANTIAGO].sort((a, b) => a.localeCompare(b, 'es'));
    expect([...COMUNAS_SANTIAGO]).toEqual(sorted);
  });
});

describe('COMUNA_COORDS', () => {
  it('coordenada por cada comuna en COMUNAS_SANTIAGO', () => {
    for (const c of COMUNAS_SANTIAGO) {
      expect(COMUNA_COORDS[c]).toBeDefined();
      expect(Array.isArray(COMUNA_COORDS[c])).toBe(true);
      expect(COMUNA_COORDS[c].length).toBe(2);
    }
  });

  it('todas las latitudes estan en RM Santiago (-33.7 a -33.3)', () => {
    for (const [, coords] of Object.entries(COMUNA_COORDS)) {
      const [lat] = coords;
      expect(lat).toBeGreaterThanOrEqual(-33.7);
      expect(lat).toBeLessThanOrEqual(-33.3);
    }
  });

  it('todas las longitudes estan en RM Santiago (-70.85 a -70.4)', () => {
    for (const [, coords] of Object.entries(COMUNA_COORDS)) {
      const [, lng] = coords;
      expect(lng).toBeGreaterThanOrEqual(-70.85);
      expect(lng).toBeLessThanOrEqual(-70.4);
    }
  });

  it('Las Condes esta al noreste (lat alta, lng cercana a 70.55)', () => {
    const [lat, lng] = COMUNA_COORDS['Las Condes'];
    expect(lat).toBeGreaterThan(-33.45);
    expect(lng).toBeGreaterThan(-70.6);
  });

  it('Maipu esta al suroeste (lat baja, lng baja)', () => {
    const [lat, lng] = COMUNA_COORDS['Maipú'];
    expect(lat).toBeLessThan(-33.5);
    expect(lng).toBeLessThan(-70.7);
  });
});

describe('getComunaCoords', () => {
  it('devuelve coords para comuna valida', () => {
    expect(getComunaCoords('Las Condes')).toEqual([-33.4172, -70.5476]);
    expect(getComunaCoords('Ñuñoa')).toEqual([-33.4569, -70.5972]);
  });

  it('devuelve null para comuna invalida', () => {
    expect(getComunaCoords('Valparaiso')).toBeNull();
    expect(getComunaCoords('Vina del Mar')).toBeNull();
    expect(getComunaCoords('')).toBeNull();
    expect(getComunaCoords('comuna inexistente')).toBeNull();
  });

  it('case-sensitive (requires exact match)', () => {
    // El cast as ComunaSantiago no normaliza — exact match required.
    expect(getComunaCoords('las condes')).toBeNull();
    expect(getComunaCoords('LAS CONDES')).toBeNull();
  });
});

describe('COMUNAS_DROPDOWN', () => {
  it('incluye todas las comunas + "Otra comuna" como ultimo', () => {
    expect(COMUNAS_DROPDOWN.length).toBe(COMUNAS_SANTIAGO.length + 1);
    expect(COMUNAS_DROPDOWN[COMUNAS_DROPDOWN.length - 1]).toBe('Otra comuna');
  });

  it('mantiene el orden de COMUNAS_SANTIAGO', () => {
    for (let i = 0; i < COMUNAS_SANTIAGO.length; i++) {
      expect(COMUNAS_DROPDOWN[i]).toBe(COMUNAS_SANTIAGO[i]);
    }
  });
});
