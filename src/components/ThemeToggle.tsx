import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * ThemeToggle — alterna light/dark usando next-themes.
 *
 * Clicks consecutivos rotan entre light y dark. El modo "system" queda
 * disponible vía Settings (más adelante); este botón es para el cambio
 * rápido desde el Header y no incluye system para no hacer un popover.
 *
 * SSR-safe: hasta que el cliente hidrata usamos el ícono actual con
 * opacidad para evitar flash. next-themes marca `mounted` después del
 * primer render.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const nextTheme = isDark ? 'light' : 'dark';
  const label = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
      className={cn('min-h-[44px] min-w-[44px] hover:bg-accent', className)}
    >
      {/* Renderiza siempre el icono Moon como default (tema = light). Post-mount
          si el tema es dark, se cambia a Sun. Asi el boton es visible incluso
          antes de que next-themes termine de hidratar. */}
      {mounted && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">
        {mounted ? `Cambiar tema (actual: ${theme ?? 'light'})` : 'Cambiar tema'}
      </span>
    </Button>
  );
}
