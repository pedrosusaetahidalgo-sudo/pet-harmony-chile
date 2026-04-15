/**
 * Health score heuristic for pets.
 *
 * Computes a simple "Al día" / "Con pendientes" / "Requiere atención" status
 * based on reminders, medical records, and pet profile completeness.
 *
 * This is a CLIENT-SIDE heuristic — it uses data already fetched by hooks
 * (useReminders, pet profile fields) to avoid extra queries.
 */

export type HealthStatus = 'good' | 'pending' | 'critical';

export interface HealthScoreResult {
  status: HealthStatus;
  label: string;
  color: string;
  bgColor: string;
  score: number; // 0-100
  issues: string[];
}

interface HealthScoreInput {
  /** Overdue reminders for this pet */
  overdueCount: number;
  /** Upcoming reminders in next 7 days */
  upcomingCount: number;
  /** Whether vaccines are up to date */
  vaccinesUpToDate: boolean;
  /** Last vet visit date (ISO string or null) */
  lastVetVisit: string | null;
  /** Whether pet has weight recorded */
  hasWeight: boolean;
  /** Whether pet has photo */
  hasPhoto: boolean;
  /** Whether pet has microchip */
  hasMicrochip: boolean;
}

export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  let score = 100;
  const issues: string[] = [];

  // Overdue reminders are the biggest penalty
  if (input.overdueCount > 0) {
    score -= Math.min(input.overdueCount * 15, 45);
    issues.push(
      `${input.overdueCount} recordatorio${input.overdueCount > 1 ? 's' : ''} vencido${input.overdueCount > 1 ? 's' : ''}`
    );
  }

  // Vaccines not up to date
  if (!input.vaccinesUpToDate) {
    score -= 20;
    issues.push('Vacunas pendientes');
  }

  // No vet visit in last 12 months
  if (input.lastVetVisit) {
    const monthsSinceVisit = Math.floor(
      (Date.now() - new Date(input.lastVetVisit).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (monthsSinceVisit > 12) {
      score -= 15;
      issues.push('Sin control veterinario en más de 1 año');
    } else if (monthsSinceVisit > 6) {
      score -= 5;
    }
  } else {
    score -= 10;
    issues.push('Sin registro de visita veterinaria');
  }

  // Profile completeness bonuses (minor)
  if (!input.hasWeight) {
    score -= 5;
  }
  if (!input.hasPhoto) {
    score -= 3;
  }
  if (!input.hasMicrochip) {
    score -= 2;
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) {
    return {
      status: 'good',
      label: 'Al día',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      score,
      issues,
    };
  }

  if (score >= 50) {
    return {
      status: 'pending',
      label: 'Con pendientes',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      score,
      issues,
    };
  }

  return {
    status: 'critical',
    label: 'Requiere atención',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    score,
    issues,
  };
}
