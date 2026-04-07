/**
 * Helpers compartidos para PetClinicalRecord y sus tabs.
 *
 * Extraído del componente principal como parte del split del god component.
 */

import { format, differenceInYears, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";

export function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const years = differenceInYears(now, birth);
  const months = differenceInMonths(now, birth) % 12;

  if (years === 0 && months === 0) return "Menos de 1 mes";
  if (years === 0) return `${months} ${months === 1 ? "mes" : "meses"}`;
  if (months === 0) return `${years} ${years === 1 ? "año" : "años"}`;
  return `${years} ${years === 1 ? "año" : "años"}, ${months} ${
    months === 1 ? "mes" : "meses"
  }`;
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
}

export function formatShortDate(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy");
}
