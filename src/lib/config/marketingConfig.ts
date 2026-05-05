/**
 * Marketing & comercial config centralizada (playbook 2026-04-19).
 *
 * Toda constante editable relacionada a ofertas comerciales, presets de
 * donacion, precios, deadlines y copy de marketing vive aca. Evita
 * hardcode disperso en componentes y permite override via env vars sin
 * tocar codigo — solo rebuild.
 *
 * Prioridad de lectura:
 * 1. `import.meta.env.VITE_*` si esta definida (permite cambio en
 *    deploy sin re-commit).
 * 2. Default declarado aca.
 *
 * Si a futuro se quiere editar sin rebuild → migrar estos a una tabla
 * `app_config` en Supabase + hook `useAppConfig`.
 */

// Helper interno: lee env var Vite con fallback y parseo seguro.
function readNumberEnv(key: string, fallback: number): number {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readStringEnv(key: string, fallback: string): string {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  return raw && raw.trim().length > 0 ? raw : fallback;
}

// ────────────────────────────────────────────────────────────
// Founding Vet Offer (playbook §9.4)
// ────────────────────────────────────────────────────────────

/**
 * Oferta fundadora B2B vet: los primeros N veterinarios que se registren
 * antes del deadline quedan locked at un precio preferente de por vida.
 * Crea urgencia + prueba social para el lanzamiento 2026-05-01.
 *
 * Env overrides soportados:
 * - VITE_FOUNDING_VET_SPOTS_TOTAL (number, default 10)
 * - VITE_FOUNDING_VET_DEADLINE_ISO (ISO date string, default 2026-05-01T23:59:59-04:00)
 * - VITE_FOUNDING_VET_PRICE_CLP (number, default 4990)
 * - VITE_FOUNDING_VET_PUBLIC_PRICE_CLP (number, default 9900)
 */
export const FOUNDING_VET = {
  spotsTotal: readNumberEnv('VITE_FOUNDING_VET_SPOTS_TOTAL', 10),
  deadline: new Date(readStringEnv('VITE_FOUNDING_VET_DEADLINE_ISO', '2026-05-01T23:59:59-04:00')),
  priceClp: readNumberEnv('VITE_FOUNDING_VET_PRICE_CLP', 4990),
  publicPriceClp: readNumberEnv('VITE_FOUNDING_VET_PUBLIC_PRICE_CLP', 9900),
} as const;

export function foundingVetDaysLeft(now: Date = new Date()): number {
  const diffMs = FOUNDING_VET.deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isFoundingVetOfferOpen(now: Date = new Date()): boolean {
  return now.getTime() < FOUNDING_VET.deadline.getTime();
}

// ────────────────────────────────────────────────────────────
// Donation presets (playbook §3)
// ────────────────────────────────────────────────────────────

export interface DonationPreset {
  amount: number;
  label: string;
  sub: string;
  featured?: boolean;
}

/**
 * Presets de donacion en /donaciones. Para cambiar montos/copy sin
 * redeploy, migrar a tabla `app_config` en Supabase o definir env var
 * VITE_DONATION_PRESETS_JSON (parseable como array JSON).
 *
 * Tramos rediseñados en feedback Antonia 2026-05-05:
 *   $1.000  → mantener app gratis
 *   $3.990  → Paw Member (membresía opcional con beneficios)
 *   $9.990  → Manada (familia multimascota)
 *   $15.000 → fichas para refugios
 *   $30.000 → sponsor mensual con match a refugio o mascota específica
 */
export const DONATION_PRESETS: readonly DonationPreset[] = [
  { amount: 1000, label: '$1.000', sub: 'Ayudas a mantener Paw Friend gratis' },
  { amount: 3990, label: '$3.990', sub: 'Te haces Paw Member', featured: true },
  { amount: 9990, label: '$9.990', sub: 'Apoyas a una manada / familia multimascota' },
  { amount: 15000, label: '$15.000', sub: 'Ayudas a financiar fichas para refugios' },
  { amount: 30000, label: '$30.000', sub: 'Sponsor mensual de salud animal' },
];

export const DONATION_MIN_CLP = readNumberEnv('VITE_DONATION_MIN_CLP', 500);
export const DONATION_MAX_CLP = readNumberEnv('VITE_DONATION_MAX_CLP', 500000);

// ────────────────────────────────────────────────────────────
// First PDF nudge (playbook §9.3)
// ────────────────────────────────────────────────────────────

/**
 * Claves localStorage usadas por el nudge "Primer PDF". Se centralizan
 * para evitar typos cross-component (MedicalSummaryButton marca done,
 * FirstPdfNudge lee done + dismissed).
 */
export const STORAGE_KEYS = {
  firstPdfDone: 'pf_first_pdf_done',
  firstPdfNudgeDismissed: 'pf_first_pdf_nudge_dismissed',
} as const;

// ────────────────────────────────────────────────────────────
// Contact info canonico (evita hardcode del email en multiples lugares)
// ────────────────────────────────────────────────────────────

export const CONTACT_EMAIL = readStringEnv('VITE_CONTACT_EMAIL', 'pedrosusaeta@pawfriend.cl');
