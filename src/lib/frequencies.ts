/**
 * Fuente unica de frecuencias clinicas (vacunas y antiparasitarios).
 *
 * Problema historico (ver plan PRODUCT_SYSTEM_COHERENCE §11.1): las
 * frecuencias aparecian hardcoded en 3 lugares distintos:
 *  - `AddMedicalRecord.tsx` (frontend UI + auto-calculo next_date)
 *  - `antiparasitic_reminder_trigger` (SQL trigger)
 *  - `vaccine_schedule_doses` seed (DB lookup)
 *
 * Si un valor cambia en uno sin los otros → reminders con `due_date`
 * inesperado. Este modulo es la unica fuente de verdad para el FE.
 * El trigger SQL tiene su propia copia en la migracion correspondiente
 * y ambas deben mantenerse en sync (documentado en el comment header
 * de la migracion).
 *
 * Regla del producto (plan §15, apendice A):
 * - Vacuna: proxima fecha por default +12 meses.
 * - Antiparasitario interno: +3 meses.
 * - Antiparasitario externo: +1 mes (salvo productos de duracion larga
 *   como Bravecto / Nexgard Spectra que van a +3 meses).
 */

import { addMonths } from 'date-fns';

export type AntiparasiticType = 'interno' | 'externo' | 'ambos';

/** Productos de duracion larga (3 meses aunque sean "externos"). */
const LONG_DURATION_PRODUCTS = ['bravecto', 'nexgard spectra'];

function isLongDurationProduct(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const normalized = brand.toLowerCase().trim();
  return LONG_DURATION_PRODUCTS.some((p) => normalized.includes(p));
}

/**
 * Calcula la proxima fecha de antiparasitario segun tipo y marca.
 * Mantener alineado con el trigger SQL create_preventive_reminder().
 */
export function nextAntiparasiticDate(
  appliedDate: Date,
  type: AntiparasiticType | null | undefined,
  productBrand?: string | null
): Date {
  if (type === 'interno' || type === 'ambos') {
    return addMonths(appliedDate, 3);
  }
  if (type === 'externo') {
    return isLongDurationProduct(productBrand)
      ? addMonths(appliedDate, 3)
      : addMonths(appliedDate, 1);
  }
  // Sin tipo especificado: asumir interno (default conservador: 3 meses).
  return addMonths(appliedDate, 3);
}

/**
 * Proxima fecha de vacuna. Si el medical_record trae `next_date`, se
 * usa eso (lo definio el vet). Si no, default +12 meses (recomendacion
 * estandar para vacunas anuales).
 */
export function nextVaccineDate(appliedDate: Date, nextDateOverride?: Date | null): Date {
  return nextDateOverride ?? addMonths(appliedDate, 12);
}

/**
 * Recurrencia textual recomendada (enum de reminderTypes.ts) segun
 * tipo de antiparasitario.
 */
export function antiparasiticRecurrence(
  type: AntiparasiticType | null | undefined,
  productBrand?: string | null
): 'monthly' | 'quarterly' {
  if (type === 'externo' && !isLongDurationProduct(productBrand)) {
    return 'monthly';
  }
  return 'quarterly';
}

/**
 * Mapea antiparasitic_type al `reminder_type` canonical usado por el
 * frontend y el trigger SQL (ver src/lib/reminderTypes.ts).
 */
export function reminderTypeForAntiparasitic(
  type: AntiparasiticType | null | undefined
): 'deworming' | 'flea' {
  // Externo = pipeta/collar/pulgas-garrapatas → 'flea'
  // Interno/ambos/desconocido = comprimido gastrointestinal → 'deworming'
  return type === 'externo' ? 'flea' : 'deworming';
}
