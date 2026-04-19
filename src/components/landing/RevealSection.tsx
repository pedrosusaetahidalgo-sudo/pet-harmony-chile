import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  /** Delay en ms para stagger entre bloques. */
  delay?: number;
  as?: 'section' | 'div' | 'article' | 'header' | 'footer';
  ariaLabelledby?: string;
  ariaLabel?: string;
  id?: string;
}

/**
 * Wrapper que aplica fade-in + slide-up cuando el bloque entra al viewport.
 * Respeta prefers-reduced-motion via useIntersectionObserver (que ya marca
 * isVisible=true inmediatamente si el usuario lo prefiere).
 *
 * Uso:
 *   <RevealSection as="section" id="ecosystem" ariaLabelledby="eco-title">
 *     ...
 *   </RevealSection>
 */
export function RevealSection({
  children,
  className,
  delay = 0,
  as: Tag = 'section',
  ariaLabelledby,
  ariaLabel,
  id,
}: RevealSectionProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
  });

  return (
    <Tag
      // TS estrecha el ref a HTMLDivElement por la union de tags; el ref real es
      // HTMLElement (runtime-safe para todos los tags). Double-cast via unknown.
      ref={ref as unknown as React.LegacyRef<HTMLDivElement>}
      id={id}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
