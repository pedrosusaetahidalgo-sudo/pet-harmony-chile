/**
 * Helpers para calcular si un proveedor está abierto ahora
 * basado en su campo `opening_hours` (jsonb).
 *
 * Estructura esperada:
 * { "lun": { "open": "09:00", "close": "18:00" }, "dom": null }
 */

const DAY_KEYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"] as const;

interface DayHours {
  open: string; // "HH:mm"
  close: string; // "HH:mm"
}

type OpeningHours = Record<string, DayHours | null>;

export function isOpenNow(openingHours: OpeningHours | null | undefined): boolean {
  if (!openingHours) return false;

  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const todayHours = openingHours[dayKey];

  if (!todayHours) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todayHours.open.split(":").map(Number);
  const [closeH, closeM] = todayHours.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getTodayHours(openingHours: OpeningHours | null | undefined): string {
  if (!openingHours) return "Sin horario";

  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const todayHours = openingHours[dayKey];

  if (!todayHours) return "Cerrado hoy";
  return `${todayHours.open} - ${todayHours.close}`;
}
