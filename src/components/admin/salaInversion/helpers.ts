/**
 * Sala de Inversion — helpers puros extraidos de AdminSalaInversion.tsx
 * (E.1 auditoria top-tier 2026-04-20).
 */
import {
  ANGEL_READY_THRESHOLD,
  DATA_ROOM_DEFAULT,
  FINANCING_DEFAULT,
  SEED_READY_THRESHOLD,
  TARGETS_90D,
  type DataRoomItem,
  type FinancingRoute,
  type Tier,
} from './constants';

export function formatNumber(n: number): string {
  return n.toLocaleString('es-CL');
}

export function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function computeTier(mrr: number, b2b: number, premium: number): Tier {
  if (
    mrr >= SEED_READY_THRESHOLD.mrr_clp &&
    b2b >= SEED_READY_THRESHOLD.b2b_min &&
    premium >= SEED_READY_THRESHOLD.premium_min
  ) {
    return 'seed-ready';
  }
  if (
    mrr >= TARGETS_90D.mrr_clp &&
    b2b >= TARGETS_90D.paying_b2b &&
    premium >= TARGETS_90D.premium_b2c
  ) {
    return 'pre-seed-ready';
  }
  if (
    mrr >= ANGEL_READY_THRESHOLD.mrr_clp &&
    b2b >= ANGEL_READY_THRESHOLD.b2b_min &&
    premium >= ANGEL_READY_THRESHOLD.premium_min
  ) {
    return 'angel-ready';
  }
  return 'pre-traccion';
}

// ── Persistence: data room checklist ────────────────────────
const CHECKLIST_KEY = 'pf_sala_inversion_checklist';

export function loadChecklist(): DataRoomItem[] {
  try {
    const stored = localStorage.getItem(CHECKLIST_KEY);
    if (!stored) return DATA_ROOM_DEFAULT;
    const parsed = JSON.parse(stored) as Record<string, boolean>;
    return DATA_ROOM_DEFAULT.map((item) => ({
      ...item,
      done: parsed[item.id] ?? item.done,
    }));
  } catch {
    return DATA_ROOM_DEFAULT;
  }
}

export function saveChecklist(items: DataRoomItem[]): void {
  try {
    const map: Record<string, boolean> = {};
    items.forEach((i) => {
      map[i.id] = i.done;
    });
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(map));
  } catch {
    // noop
  }
}

// ── Persistence: financing routes ───────────────────────────
const FINANCING_KEY = 'pf_sala_inversion_financing';

export function loadFinancing(): FinancingRoute[] {
  try {
    const stored = localStorage.getItem(FINANCING_KEY);
    if (!stored) return FINANCING_DEFAULT;
    const parsed = JSON.parse(stored) as Record<string, FinancingRoute['status']>;
    return FINANCING_DEFAULT.map((r) => ({ ...r, status: parsed[r.id] ?? r.status }));
  } catch {
    return FINANCING_DEFAULT;
  }
}

export function saveFinancing(routes: FinancingRoute[]): void {
  try {
    const map: Record<string, FinancingRoute['status']> = {};
    routes.forEach((r) => {
      map[r.id] = r.status;
    });
    localStorage.setItem(FINANCING_KEY, JSON.stringify(map));
  } catch {
    // noop
  }
}
