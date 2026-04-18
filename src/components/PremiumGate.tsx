import { ReactNode } from 'react';

interface PremiumGateProps {
  /**
   * Compat con usos existentes (feature key de plans.ts). Ya no se usa para
   * bloquear pero se acepta para no romper los llamados en 11 archivos.
   */
  feature?: string;
  /** Compat */
  currentUsage?: number;
  /** Contenido real — siempre se renderiza. */
  children: ReactNode;
  /** Compat con props del gate antiguo; ignorados. */
  title?: string;
  description?: string;
  blurLevel?: number;
  usage?: { current: number; max: number };
  ctaText?: string;
}

/**
 * PremiumGate (2026-04-19 pivot): dejó de ser un paywall.
 *
 * Antes bloqueaba features con overlay "Desbloquea con Premium". Con el
 * modelo "app gratis para todos + Paw Member voluntario", el concepto de
 * gate contradice el mensaje. El componente ahora es un pass-through
 * garantizado: **nunca** bloquea, siempre renderiza children.
 *
 * Se conserva el nombre y la API por compatibilidad con los 11 archivos
 * que ya lo importan (MedicalSummaryButton, BreedTips, VaccinationCardOCR,
 * PetAssistant, WeeklyReportCard, TabHistorial, TabCompartir, Reminders,
 * Home, etc). Si quieres invitar a apoyar, usa `PremiumNudge` (renombre
 * semantico a DonateNudge) como overlay post-uso, no como barrera.
 */
export function PremiumGate({ children }: PremiumGateProps) {
  return <>{children}</>;
}
