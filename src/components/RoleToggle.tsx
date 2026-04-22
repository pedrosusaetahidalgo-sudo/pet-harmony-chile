/**
 * RoleToggle — Pill toggle Dueño/Profesional reusable.
 *
 * 2026-04-21 (feedback Pedro): movido del Header al Sidebar para limpiar
 * la barra superior. Soporta 2 variantes de layout:
 *  - 'pill'  (default): compacto, lado-a-lado, pensado para header
 *  - 'stack': vertical expandido, 2 filas, pensado para sidebar footer
 *
 * Encapsula la logica de:
 *  - Abrir BecomeProviderDialog si el user no es provider aun.
 *  - Cambiar vista + navegar al dashboard correspondiente.
 *  - Toast + haptics.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PawPrint, Stethoscope } from '@/lib/icons';
import { useActiveRole } from '@/hooks/useActiveRole';
import { BecomeProviderDialog } from '@/components/BecomeProviderDialog';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface RoleToggleProps {
  variant?: 'pill' | 'stack';
}

export function RoleToggle({ variant = 'pill' }: RoleToggleProps) {
  const navigate = useNavigate();
  const { role, isProvider, toggle } = useActiveRole();
  const [becomeProviderOpen, setBecomeProviderOpen] = useState(false);

  const handleOwnerClick = () => {
    if (role !== 'owner') {
      haptics.navigate();
      toggle();
      navigate('/home');
      toast('Cambiaste a vista de dueño');
    }
  };

  const handleProviderClick = () => {
    if (role === 'provider') return;
    if (isProvider) {
      haptics.navigate();
      toggle();
      navigate('/provider/dashboard');
      toast('Cambiaste a vista profesional');
    } else {
      haptics.confirm();
      setBecomeProviderOpen(true);
    }
  };

  // ── Variante "stack": 2 botones de full-width apilados. Para sidebar. ──
  if (variant === 'stack') {
    return (
      <>
        <div className="flex flex-col gap-1 px-2 py-1">
          <button
            type="button"
            onClick={handleOwnerClick}
            className={cn(
              'flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors',
              role === 'owner'
                ? 'bg-purple-100 text-purple-800'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
            )}
          >
            <PawPrint className="h-4 w-4" />
            <span>Dueño</span>
          </button>
          <button
            type="button"
            onClick={handleProviderClick}
            className={cn(
              'flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors',
              role === 'provider'
                ? 'bg-teal-100 text-teal-800'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
            )}
          >
            <Stethoscope className="h-4 w-4" />
            <span>Profesional</span>
          </button>
        </div>
        <BecomeProviderDialog open={becomeProviderOpen} onOpenChange={setBecomeProviderOpen} />
      </>
    );
  }

  // ── Variante "pill" (default): compacto, lado-a-lado. Legacy para header. ──
  // Solo se muestra si el usuario ya es provider (en header el toggle era
  // condicional a isProvider).
  if (!isProvider) return null;

  return (
    <>
      <div className="flex items-center bg-gray-100 rounded-full p-0.5 relative">
        <div
          className={cn(
            'absolute top-0.5 bottom-0.5 rounded-full transition-all duration-200 ease-out',
            role === 'owner'
              ? 'left-0.5 bg-purple-100 w-[calc(50%-2px)]'
              : 'left-[50%] bg-teal-100 w-[calc(50%-2px)]'
          )}
        />
        <button
          type="button"
          onClick={handleOwnerClick}
          className={cn(
            'relative z-10 flex items-center gap-1.5 h-7 px-2.5 sm:px-3 rounded-full text-xs font-medium transition-colors duration-200',
            role === 'owner'
              ? 'text-purple-700 font-semibold'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <PawPrint className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dueño</span>
        </button>
        <button
          type="button"
          onClick={handleProviderClick}
          className={cn(
            'relative z-10 flex items-center gap-1.5 h-7 px-2.5 sm:px-3 rounded-full text-xs font-medium transition-colors duration-200',
            role === 'provider'
              ? 'text-teal-700 font-semibold'
              : 'text-gray-400 hover:text-gray-600'
          )}
        >
          <Stethoscope className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Profesional</span>
        </button>
      </div>
      <BecomeProviderDialog open={becomeProviderOpen} onOpenChange={setBecomeProviderOpen} />
    </>
  );
}
