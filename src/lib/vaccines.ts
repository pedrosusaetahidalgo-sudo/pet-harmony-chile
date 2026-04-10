/**
 * Catálogo de vacunas por especie para Chile.
 * Se usa como selector Combobox con opción "Otra vacuna" para texto libre.
 */

export interface VaccineEntry {
  name: string;
  description: string;
  schedule: string;
}

export const VACCINE_CATALOG: Record<string, VaccineEntry[]> = {
  perro: [
    { name: "Séxtuple (DHPPI+L)", description: "Distemper, Hepatitis, Parvo, Parainfluenza, Leptospira", schedule: "8, 12, 16 semanas + anual" },
    { name: "Óctuple (DHPPI+L4)", description: "Ídem + 4 cepas de Leptospira", schedule: "8, 12, 16 semanas + anual" },
    { name: "Antirrábica", description: "Rabia", schedule: "16 semanas + anual (obligatoria Chile)" },
    { name: "KC (Kennel Cough)", description: "Bordetella + Parainfluenza intranasal", schedule: "Anual o pre-pensión" },
    { name: "Giardia", description: "Giardia lamblia", schedule: "Según riesgo" },
  ],
  gato: [
    { name: "Triple felina (FVRCP)", description: "Rinotraqueítis, Calicivirus, Panleucopenia", schedule: "8, 12, 16 semanas + anual" },
    { name: "Leucemia felina (FeLV)", description: "Virus leucemia felina", schedule: "8, 12 semanas + anual" },
    { name: "Antirrábica", description: "Rabia", schedule: "16 semanas + anual" },
    { name: "PIF (opcional)", description: "Peritonitis infecciosa felina", schedule: "Según riesgo" },
  ],
  conejo: [
    { name: "Mixomatosis", description: "Virus mixoma", schedule: "Anual" },
    { name: "VHD (Hemorrágica)", description: "Enfermedad hemorrágica viral", schedule: "Anual" },
  ],
};

/**
 * Devuelve vacunas para una especie. Retorna array vacío si no hay catálogo.
 */
export function getVaccinesForSpecies(species: string): VaccineEntry[] {
  return VACCINE_CATALOG[species.toLowerCase()] || [];
}
