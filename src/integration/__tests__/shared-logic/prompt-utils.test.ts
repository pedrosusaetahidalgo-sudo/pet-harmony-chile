/**
 * Tests for prompt sanitization utilities.
 * Source: supabase/functions/_shared/prompt-utils.ts
 */
import { describe, it, expect } from 'vitest';

// Replicate pure logic from _shared/prompt-utils.ts
function escapePromptInput(input: string, maxLength = 200): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[\n\r\t]/g, ' ')
    .replace(/["""]/g, "'")
    .replace(/[\\`]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function wrapUserData(label: string, data: Record<string, string>): string {
  const lines = Object.entries(data)
    .map(([key, value]) => `${key}: ${escapePromptInput(value)}`)
    .join('\n');
  return `=== INICIO ${label} ===\n${lines}\n=== FIN ${label} ===`;
}

describe('escapePromptInput', () => {
  it('returns empty string for falsy input', () => {
    expect(escapePromptInput('')).toBe('');
    expect(escapePromptInput(null as unknown as string)).toBe('');
    expect(escapePromptInput(undefined as unknown as string)).toBe('');
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(300);
    expect(escapePromptInput(long, 200).length).toBeLessThanOrEqual(200);
  });

  it('replaces newlines with spaces', () => {
    expect(escapePromptInput('hello\nworld')).toBe('hello world');
    expect(escapePromptInput('hello\r\nworld')).toBe('hello world');
    expect(escapePromptInput('hello\tworld')).toBe('hello world');
  });

  it('replaces double quotes with single quotes', () => {
    expect(escapePromptInput('say "hello"')).toBe("say 'hello'");
  });

  it('removes backslashes and backticks', () => {
    expect(escapePromptInput('path\\to\\file')).toBe('pathtofile');
    expect(escapePromptInput('code `here`')).toBe('code here');
  });

  it('collapses multiple spaces', () => {
    expect(escapePromptInput('hello    world')).toBe('hello world');
  });

  it('trims whitespace', () => {
    expect(escapePromptInput('  hello  ')).toBe('hello');
  });

  it('handles normal text without modification', () => {
    expect(escapePromptInput('Mi perro tiene tos')).toBe('Mi perro tiene tos');
  });
});

describe('wrapUserData', () => {
  it('wraps data with labeled delimiters', () => {
    const result = wrapUserData('MASCOTA', { nombre: 'Luna', especie: 'perro' });
    expect(result).toContain('=== INICIO MASCOTA ===');
    expect(result).toContain('nombre: Luna');
    expect(result).toContain('especie: perro');
    expect(result).toContain('=== FIN MASCOTA ===');
  });

  it('sanitizes values within wrapped data', () => {
    const result = wrapUserData('TEST', { text: 'hello\n"world"' });
    expect(result).toContain("text: hello 'world'");
    expect(result).not.toContain('\n"world"');
  });

  it('handles empty data', () => {
    const result = wrapUserData('EMPTY', {});
    expect(result).toBe('=== INICIO EMPTY ===\n\n=== FIN EMPTY ===');
  });
});
