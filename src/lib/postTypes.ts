/**
 * Tipos de publicación en el feed.
 * El campo post_type ya existe en la tabla posts (nullable string).
 */

export const POST_TYPES = [
  { value: "foto", label: "Foto", emoji: "📸" },
  { value: "pregunta", label: "Pregunta", emoji: "❓" },
  { value: "consejo", label: "Consejo", emoji: "💡" },
  { value: "perdido", label: "Perdido / Encontrado", emoji: "🔍" },
  { value: "adopcion", label: "Adopción", emoji: "🏠" },
  { value: "logro", label: "Logro", emoji: "🏆" },
] as const;

export type PostType = (typeof POST_TYPES)[number]["value"];

export function getPostTypeLabel(type: string | null): string {
  if (!type) return "Publicación";
  const found = POST_TYPES.find((pt) => pt.value === type);
  return found ? `${found.emoji} ${found.label}` : "Publicación";
}
