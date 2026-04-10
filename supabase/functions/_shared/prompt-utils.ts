/**
 * Utilidades para sanitizar inputs antes de inyectarlos en prompts de IA.
 * Previene prompt injection al escapar caracteres que podrian alterar
 * la estructura del prompt o la salida JSON.
 */

/**
 * Escapa caracteres peligrosos en strings que se inyectan en prompts.
 * Remueve newlines, comillas, y caracteres de control que podrian
 * romper el formato del prompt o inyectar instrucciones.
 */
export function escapePromptInput(input: string, maxLength = 200): string {
  if (!input || typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/[\n\r\t]/g, " ")       // Newlines/tabs -> espacio
    .replace(/["""]/g, "'")           // Comillas dobles -> simples
    .replace(/[\\`]/g, "")            // Backslashes y backticks
    .replace(/\s{2,}/g, " ")          // Multiples espacios -> uno
    .trim();
}

/**
 * Envuelve datos de usuario en delimitadores claros para que el LLM
 * los trate como datos y no como instrucciones.
 */
export function wrapUserData(label: string, data: Record<string, string>): string {
  const lines = Object.entries(data)
    .map(([key, value]) => `${key}: ${escapePromptInput(value)}`)
    .join("\n");
  return `=== INICIO ${label} ===\n${lines}\n=== FIN ${label} ===`;
}
