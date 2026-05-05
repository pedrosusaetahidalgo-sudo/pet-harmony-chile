/**
 * Opciones parametrizadas para formularios de mascotas.
 * Fuente de verdad para dropdowns que se reusan en AddPet, CreateAdoptionPost, NewPatientForm, etc.
 */

// ── Colores de pelaje / cuerpo ──

export const PET_COLORS = [
  { value: 'negro', label: 'Negro' },
  { value: 'blanco', label: 'Blanco' },
  { value: 'cafe', label: 'Café' },
  { value: 'dorado', label: 'Dorado' },
  { value: 'crema', label: 'Crema' },
  { value: 'gris', label: 'Gris' },
  { value: 'naranja', label: 'Naranja' },
  { value: 'atigrado', label: 'Atigrado' },
  { value: 'bicolor', label: 'Bicolor' },
  { value: 'tricolor', label: 'Tricolor' },
  { value: 'merle', label: 'Merle' },
  { value: 'manchado', label: 'Manchado' },
  { value: 'negro_cafe', label: 'Negro y café' },
  { value: 'blanco_negro', label: 'Blanco y negro' },
  { value: 'blanco_cafe', label: 'Blanco y café' },
] as const;

// ── Marcas de alimento (vendidas en Chile) ──

export const FOOD_BRANDS = [
  { value: 'royal_canin', label: 'Royal canin' },
  { value: 'purina_pro_plan', label: 'Purina pro plan' },
  { value: 'hills', label: "Hill's" },
  { value: 'eukanuba', label: 'Eukanuba' },
  { value: 'brit_care', label: 'Brit care' },
  { value: 'acana', label: 'Acana' },
  { value: 'orijen', label: 'Orijen' },
  { value: 'taste_of_the_wild', label: 'Taste of the wild' },
  { value: 'nutram', label: 'Nutram' },
  { value: 'champion_cat', label: 'Champion cat' },
  { value: 'champion_dog', label: 'Champion dog' },
  { value: 'master_dog', label: 'Master dog' },
  { value: 'bravery', label: 'Bravery' },
  { value: 'pedigree', label: 'Pedigree' },
  { value: 'whiskas', label: 'Whiskas' },
  { value: 'felix', label: 'Felix' },
  { value: 'mon_ami', label: 'Mon ami' },
  { value: 'dog_chow', label: 'Dog chow' },
  { value: 'cat_chow', label: 'Cat chow' },
  { value: 'proplan_veterinary', label: 'Proplan veterinary diets' },
  { value: 'nutrisource', label: 'Nutrisource' },
  { value: 'canidae', label: 'Canidae' },
  { value: 'farmina', label: 'Farmina' },
] as const;

// ── Estado de salud (adopción) ──

export const HEALTH_STATUS_OPTIONS = [
  { value: 'sano', label: 'Sano' },
  { value: 'vacunado', label: 'Vacunado al día' },
  { value: 'esterilizado', label: 'Esterilizado/a' },
  { value: 'vacunado_esterilizado', label: 'Vacunado y esterilizado' },
  { value: 'en_tratamiento', label: 'En tratamiento' },
  { value: 'condicion_cronica', label: 'Condición crónica controlada' },
  { value: 'convaleciente', label: 'Convaleciente' },
  { value: 'discapacidad', label: 'Con discapacidad' },
  { value: 'sin_informacion', label: 'Sin información' },
] as const;

// ── Motivo de adopción ──

export const ADOPTION_REASON_OPTIONS = [
  { value: 'cambio_domicilio', label: 'Cambio de domicilio' },
  { value: 'alergias_familia', label: 'Alergias en la familia' },
  { value: 'falta_tiempo', label: 'Falta de tiempo' },
  { value: 'problemas_economicos', label: 'Problemas económicos' },
  { value: 'fallecimiento_dueno', label: 'Fallecimiento del dueño' },
  { value: 'rescatado', label: 'Rescatado de la calle' },
  { value: 'camada_no_planificada', label: 'Camada no planificada' },
  { value: 'incompatibilidad', label: 'Incompatibilidad con otras mascotas' },
] as const;

// ── Tipo de sangre por especie ──

export const BLOOD_TYPES_BY_SPECIES: Record<string, { value: string; label: string }[]> = {
  perro: [
    { value: 'DEA_1.1_pos', label: 'DEA 1.1 positivo' },
    { value: 'DEA_1.1_neg', label: 'DEA 1.1 negativo' },
    { value: 'DEA_1.2', label: 'DEA 1.2' },
    { value: 'DEA_3', label: 'DEA 3' },
    { value: 'DEA_4', label: 'DEA 4' },
    { value: 'DEA_5', label: 'DEA 5' },
    { value: 'DEA_7', label: 'DEA 7' },
  ],
  gato: [
    { value: 'tipo_A', label: 'Tipo A' },
    { value: 'tipo_B', label: 'Tipo B' },
    { value: 'tipo_AB', label: 'Tipo AB' },
  ],
};

// ── Personalidad (reutilizable en AddPet y adopción) ──

export const PERSONALITY_OPTIONS = [
  'Juguetón',
  'Tranquilo',
  'Energético',
  'Cariñoso',
  'Tímido',
  'Protector',
  'Sociable',
  'Independiente',
  'Curioso',
  'Obediente',
] as const;
