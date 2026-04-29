import { z } from 'zod';

// --- Shared field validators ---

/** Trimmed non-empty string with max length */
export const safeText = (max: number) =>
  z.string().trim().min(1, 'Campo requerido').max(max, `Maximo ${max} caracteres`);

/** Optional trimmed string (empty → undefined) */
export const optionalText = (max: number) =>
  z.string().trim().max(max, `Maximo ${max} caracteres`).optional().or(z.literal(''));

// --- Form schemas ---

export const reviewSchema = z.object({
  title: z.string().trim().max(100, 'Maximo 100 caracteres').optional().or(z.literal('')),
  comment: safeText(500),
  rating: z.number().min(1, 'Selecciona una calificacion').max(5),
});
export type ReviewFormData = z.infer<typeof reviewSchema>;

export const feedCommentSchema = z.object({
  content: safeText(500),
});
export type FeedCommentFormData = z.infer<typeof feedCommentSchema>;

export const petSchema = z.object({
  name: safeText(50),
  species: z.enum(['perro', 'gato', 'conejo', 'hamster', 'ave', 'tortuga', 'pez', 'otro'], {
    required_error: 'Selecciona una especie',
  }),
  breed: optionalText(100),
  date_of_birth: z.string().optional(),
});
export type PetFormData = z.infer<typeof petSchema>;

// --- Auth schemas ---

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'El email es obligatorio').email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  fullName: z.string().trim().max(100, 'Maximo 100 caracteres').optional().or(z.literal('')),
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// --- Vet registration schemas ---

export const vetAccountSchema = z.object({
  display_name: safeText(100).refine((v) => v.length > 2, 'Debe tener al menos 3 caracteres'),
  email: z.string().trim().min(1, 'El email es obligatorio').email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  phone: optionalText(20),
  license: optionalText(10),
});
export type VetAccountFormData = z.infer<typeof vetAccountSchema>;

export const vetProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(50, 'La bio debe tener al menos 50 caracteres')
    .max(500, 'Maximo 500 caracteres'),
  specialties: z.array(z.string()).min(1, 'Selecciona al menos 1 especialidad'),
  commune: z.string().min(1, 'Selecciona tu comuna base'),
  service_areas: z.array(z.string()).min(1, 'Selecciona al menos 1 comuna de atencion'),
  experience_years: z.string().optional().or(z.literal('')),
  price_from: z.string().optional().or(z.literal('')),
});
export type VetProfileFormData = z.infer<typeof vetProfileSchema>;

// --- AddPet extended schema ---

export const addPetSchema = z.object({
  name: safeText(50),
  species: z.string().min(1, 'Selecciona una especie'),
  breed: z.string().trim().max(80, 'Raza muy larga').optional().or(z.literal('')),
  birth_date: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || new Date(v).getTime() <= Date.now(),
      'La fecha de nacimiento no puede ser futura'
    ),
  gender: z.string().optional().or(z.literal('')),
  size: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
  weight: z.string().optional().or(z.literal('')),
  bio: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  microchip_number: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || /^\d{15}$/.test(v.trim()),
      'El microchip debe tener exactamente 15 digitos (estandar ISO)'
    ),
  blood_type: z.string().optional().or(z.literal('')),
  neutered: z.boolean().optional(),
  is_adopted: z.boolean().optional(),
  adoption_date: z.string().optional().or(z.literal('')),
  preferred_clinic: z.string().optional().or(z.literal('')),
  emergency_vet_name: z.string().optional().or(z.literal('')),
  emergency_vet_phone: z.string().optional().or(z.literal('')),
  diet_type: z.string().optional().or(z.literal('')),
  diet_brand: z.string().optional().or(z.literal('')),
  activity_level: z.string().optional().or(z.literal('')),
  behavior_notes: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  insurance_provider: z.string().optional().or(z.literal('')),
});
export type AddPetFormData = z.infer<typeof addPetSchema>;

// --- NewPatientForm schema (vet creates pet without owner account) ---

export const newPatientSchema = z.object({
  name: safeText(50),
  species: z.string().min(1, 'Selecciona una especie'),
  breed: optionalText(100),
  birth_date: z.string().optional().or(z.literal('')),
  sex: z.string().optional().or(z.literal('')),
  weight: z.string().optional().or(z.literal('')),
  color: optionalText(100),
  owner_name: safeText(100).refine(
    (v) => v.length >= 2,
    'El nombre del dueno debe tener al menos 2 caracteres'
  ),
  owner_email: z
    .string()
    .trim()
    .min(1, 'El email del dueno es obligatorio')
    .email('Ingresa un email valido'),
  microchip_number: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || /^\d{15}$/.test(v.trim()),
      'El microchip debe tener exactamente 15 digitos'
    ),
  blood_type: optionalText(30),
  known_allergies: optionalText(300),
  chronic_conditions: optionalText(300),
});
export type NewPatientFormData = z.infer<typeof newPatientSchema>;

// --- ReportLostPetForm schema ---

export const reportLostPetSchema = z.object({
  report_type: z.enum(['perdida', 'encontrada'], {
    required_error: 'Selecciona el tipo de reporte',
  }),
  pet_name: safeText(100),
  species: z.string().min(1, 'La especie es requerida'),
  breed: optionalText(100),
  description: z
    .string()
    .trim()
    .min(10, 'Describe con mas detalle (minimo 10 caracteres)')
    .max(1000, 'Maximo 1000 caracteres'),
  last_seen_location: z.string().min(1, 'La ubicacion es requerida'),
  last_seen_date: z.string().min(1, 'La fecha es requerida'),
  contact_phone: optionalText(20),
  contact_email: z.string().email('Email invalido').optional().or(z.literal('')),
  reward_offered: z.boolean().default(false),
  reward_amount: z.number().optional(),
  photo_url: z.string().optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
export type ReportLostPetFormData = z.infer<typeof reportLostPetSchema>;

// onboardingVetSchema — eliminado 2026-04-28 (FEAT-004).
// /onboarding-vet ahora es un redirect (no usa formularios), por lo que el
// schema no tiene callsite. Si vuelve un wizard real, recrear desde
// `BecomeProviderDialog` que sigue siendo la fuente de verdad B2B.
