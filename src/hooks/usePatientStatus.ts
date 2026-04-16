import { useMemo } from 'react';
import { differenceInDays, differenceInYears, differenceInMonths } from 'date-fns';

export type PatientStatus = 'new' | 'active' | 'followup_soon' | 'followup_overdue' | 'inactive';

export interface PatientStatusInfo {
  status: PatientStatus;
  label: string;
  color: string;
  dotClass: string;
  bgClass: string;
}

const STATUS_MAP: Record<PatientStatus, Omit<PatientStatusInfo, 'status'>> = {
  new: {
    label: 'Nuevo',
    color: 'blue',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  active: {
    label: 'Activo',
    color: 'green',
    dotClass: 'bg-green-500',
    bgClass: 'bg-green-50 text-green-700 border-green-200',
  },
  followup_soon: {
    label: 'Seguimiento pendiente',
    color: 'amber',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  followup_overdue: {
    label: 'Seguimiento vencido',
    color: 'red',
    dotClass: 'bg-red-500',
    bgClass: 'bg-red-50 text-red-700 border-red-200',
  },
  inactive: {
    label: 'Inactivo',
    color: 'gray',
    dotClass: 'bg-gray-400',
    bgClass: 'bg-gray-50 text-gray-600 border-gray-200',
  },
};

export function getPatientStatus(
  lastVisit: string | null,
  followupDate: string | null,
  firstVisit?: string | null
): PatientStatusInfo {
  const now = new Date();

  // Check followup status first (higher priority)
  if (followupDate) {
    const fDate = new Date(followupDate);
    const daysUntil = differenceInDays(fDate, now);
    if (daysUntil < 0) {
      return { status: 'followup_overdue', ...STATUS_MAP.followup_overdue };
    }
    if (daysUntil <= 7) {
      return { status: 'followup_soon', ...STATUS_MAP.followup_soon };
    }
  }

  if (!lastVisit) {
    return { status: 'inactive', ...STATUS_MAP.inactive };
  }

  const lastDate = new Date(lastVisit);
  const daysSince = differenceInDays(now, lastDate);

  // New patient: first visit < 30 days ago
  if (firstVisit) {
    const firstDate = new Date(firstVisit);
    if (differenceInDays(now, firstDate) < 30) {
      return { status: 'new', ...STATUS_MAP.new };
    }
  }

  if (daysSince > 90) {
    return { status: 'inactive', ...STATUS_MAP.inactive };
  }

  return { status: 'active', ...STATUS_MAP.active };
}

export function calculatePetAge(birthDate: string | null): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate + 'T00:00:00');
  if (isNaN(birth.getTime())) return '';
  const now = new Date();
  if (birth > now) return '';
  const years = differenceInYears(now, birth);
  if (years > 30) return '';
  const months = differenceInMonths(now, birth) % 12;
  if (years === 0 && months === 0) return '<1m';
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}a`;
  return `${years}a ${months}m`;
}

export function usePatientStatus(
  lastVisit: string | null,
  followupDate: string | null,
  firstVisit?: string | null
): PatientStatusInfo {
  return useMemo(
    () => getPatientStatus(lastVisit, followupDate, firstVisit),
    [lastVisit, followupDate, firstVisit]
  );
}
