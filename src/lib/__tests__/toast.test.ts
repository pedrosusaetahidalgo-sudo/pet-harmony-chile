/**
 * Tests del helper de toasts centralizado (Sprint 1 P2 LOC-MICROCOPY).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sonner antes de importar el helper.
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import { toast } from 'sonner';
import { toastError, toastAuthRequired, toastSuccess, toastInfo, toastWarning } from '../toast';

describe('toastError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama toast.error con el action y descripción default chilena', () => {
    toastError('No pudimos guardar');
    expect(toast.error).toHaveBeenCalledWith('No pudimos guardar', {
      description: 'Inténtalo de nuevo en unos segundos. Si sigue, escríbenos a hola@pawfriend.cl.',
    });
  });

  it('respeta un hint custom', () => {
    toastError('No pudimos cancelar', { hint: 'Tu cambio se aplicó parcialmente.' });
    expect(toast.error).toHaveBeenCalledWith('No pudimos cancelar', {
      description: 'Tu cambio se aplicó parcialmente.',
    });
  });
});

describe('toastAuthRequired', () => {
  beforeEach(() => vi.clearAllMocks());

  it('default message accionable en español chileno', () => {
    toastAuthRequired();
    expect(toast.error).toHaveBeenCalledWith('Inicia sesión para continuar', {
      description: 'Tu acción se completará al volver.',
    });
  });

  it('respeta un mensaje custom', () => {
    toastAuthRequired('Inicia sesión para reservar');
    expect(toast.error).toHaveBeenCalledWith('Inicia sesión para reservar', {
      description: 'Tu acción se completará al volver.',
    });
  });
});

describe('re-exports', () => {
  it('toastSuccess es toast.success', () => {
    expect(toastSuccess).toBe(toast.success);
  });
  it('toastInfo es toast.info', () => {
    expect(toastInfo).toBe(toast.info);
  });
  it('toastWarning es toast.warning', () => {
    expect(toastWarning).toBe(toast.warning);
  });
});
