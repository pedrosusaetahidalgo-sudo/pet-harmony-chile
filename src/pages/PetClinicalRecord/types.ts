/**
 * Tipos compartidos para PetClinicalRecord y sus tabs.
 *
 * Extraído del componente principal (1444 líneas) como parte del split
 * del god component documentado en el audit técnico (M-1).
 */

export interface PetData {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birth_date: string | null;
  weight: number | null;
  size: string | null;
  color: string | null;
  photo_url: string | null;
  bio: string | null;
  microchip_number: string | null;
  neutered: boolean | null;
  vaccination_status: string | null;
  special_needs: string | null;
  personality: string[] | null;
  medical_notes: string | null;
  is_public: boolean | null;
  blood_type: string | null;
  neutered_date: string | null;
  chip_registry: string | null;
  weight_history: Array<{ date: string; weight: number }> | null;
  allergies_food: string[] | null;
  allergies_medication: string[] | null;
  allergies_environmental: string[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chronic_conditions_detail: Record<string, any> | null;
  current_medications: Array<{
    name: string;
    dose?: string;
    frequency?: string;
    since?: string;
  }> | null;
  diet_type: string | null;
  diet_brand: string | null;
  diet_frequency: string | null;
  activity_level: string | null;
  living_environment: string | null;
  cohabitation_pets: number | null;
  cohabitation_children: boolean | null;
  emergency_vet_name: string | null;
  emergency_vet_phone: string | null;
  insurance_provider: string | null;
  insurance_policy: string | null;
  preferred_clinic: string | null;
  behavior_notes: string | null;
  last_vet_visit: string | null;
  adoption_date: string | null;
  is_adopted: boolean | null;
}
