import { useEffect } from 'react';

/**
 * En mobile, cuando el teclado virtual aparece, los inputs pueden quedar
 * tapados (especialmente los submit buttons). Este hook agrega un listener
 * que hace scroll al elemento enfocado con un pequeño delay para esperar
 * que el teclado termine de abrirse.
 *
 * Usar en pages con forms largos: Auth, AddPet, RegistroVeterinario.
 */
export function useScrollOnFocus(containerRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;

      // Esperar a que el teclado virtual se abra (~300ms en la mayoría de dispositivos)
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    };

    // Cast a EventListener: addEventListener no acepta listeners narrowed
    // a FocusEvent. Runtime es identico (FocusEvent extends Event).
    const el = containerRef?.current ?? document;
    el.addEventListener('focusin', handleFocusIn as EventListener);
    return () => el.removeEventListener('focusin', handleFocusIn as EventListener);
  }, [containerRef]);
}
