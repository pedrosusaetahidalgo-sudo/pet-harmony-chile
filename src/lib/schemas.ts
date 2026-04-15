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
  species: z.enum(['perro', 'gato', 'conejo', 'hamster', 'ave', 'tortuga', 'pez', 'otro']),
  breed: optionalText(100),
  date_of_birth: z.string().optional(),
});
export type PetFormData = z.infer<typeof petSchema>;
