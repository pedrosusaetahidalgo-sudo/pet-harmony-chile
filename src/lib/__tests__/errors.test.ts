/**
 * Tests del helper Sprint 1 P2 (2026-04-28).
 */
import { describe, it, expect } from 'vitest';
import { errorMessageForUser, errorMessageForLog } from '../errors';

describe('errorMessageForUser', () => {
  it('extrae mensaje de un Error real', () => {
    const err = new Error('No autorizado');
    expect(errorMessageForUser(err)).toBe('No autorizado');
  });

  it('devuelve string si el err es un string', () => {
    expect(errorMessageForUser('algo manual')).toBe('algo manual');
  });

  it('devuelve fallback chileno cálido si err es null', () => {
    expect(errorMessageForUser(null)).toBe('Inténtalo de nuevo en unos segundos.');
  });

  it('devuelve fallback chileno cálido si err es undefined', () => {
    expect(errorMessageForUser(undefined)).toBe('Inténtalo de nuevo en unos segundos.');
  });

  it('devuelve fallback si el err es un objeto no-Error', () => {
    expect(errorMessageForUser({ unknown: 'shape' })).toBe('Inténtalo de nuevo en unos segundos.');
  });

  it('devuelve fallback si Error no tiene mensaje', () => {
    const err = new Error('');
    expect(errorMessageForUser(err)).toBe('Inténtalo de nuevo en unos segundos.');
  });

  it('devuelve fallback si string es vacío', () => {
    expect(errorMessageForUser('')).toBe('Inténtalo de nuevo en unos segundos.');
  });
});

describe('errorMessageForLog', () => {
  it('extrae mensaje de un Error real', () => {
    const err = new Error('DB connection failed');
    expect(errorMessageForLog(err)).toBe('DB connection failed');
  });

  it('devuelve "Error desconocido" si err es null (debug-friendly)', () => {
    expect(errorMessageForLog(null)).toBe('Error desconocido');
  });

  it('devuelve "Error desconocido" si Error sin mensaje', () => {
    expect(errorMessageForLog(new Error())).toBe('Error desconocido');
  });

  it('devuelve string si el err es un string no-vacío', () => {
    expect(errorMessageForLog('manual log')).toBe('manual log');
  });
});
