/**
 * Utilidades compartidas para integracion con Flow.cl.
 * Usado por flow-create-subscription y flow-webhook.
 */

/** Firma HMAC-SHA256 sobre params alfabeticamente concatenados (key1value1key2value2...) */
export async function signFlowParams(
  params: Record<string, string>,
  secret: string
): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((k) => `${k}${params[k]}`).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(toSign));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
