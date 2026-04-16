/**
 * Helpers compartidos para PetClinicalRecord y sus tabs.
 *
 * Extraído del componente principal como parte del split del god component.
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Re-export from canonical location for backward compatibility
export { calculateAge } from '@/lib/format';

export function formatDate(dateString: string): string {
  return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
}

export function formatShortDate(dateString: string): string {
  return format(new Date(dateString), 'dd/MM/yyyy');
}
