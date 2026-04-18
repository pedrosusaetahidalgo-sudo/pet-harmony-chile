/**
 * Sala de Inversion — KPIs y data room para presentar a inversores y fondos.
 *
 * Consume el plan 90/180/365d documentado en memory/project_vc_plan_2026_04_18.md.
 * Disenado para:
 *  - Snapshot listo para compartir con angels (Platanus, Magma, Chile Global Angels)
 *  - Postulaciones a CORFO SSAF-I, Start-Up Chile Ignite/Seed, SERCOTEC
 *  - Seguimiento de metas north-star que desbloquean la siguiente ronda
 *
 * Estilo consistente con AdminDashboard / AdminAnalytics (slate-950 + indigo).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import AdminKpiCard from '@/components/admin/ui/AdminKpiCard';
import AdminEmptyState from '@/components/admin/ui/AdminEmptyState';
import { formatCLPCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  Crown,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Sparkles,
  Flag,
  BadgeCheck,
  Activity,
  AlertTriangle,
  Building2,
  Zap,
  Award,
} from '@/lib/icons';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Constantes del plan 90 dias ──────────────────────────
// Ver memory/project_vc_plan_2026_04_18.md — metas que desbloquean angel/pre-seed.
const TARGETS_90D = {
  premium_b2c: 100,
  paying_b2b: 20,
  mrr_clp: 1_900_000, // ~USD $2K al tipo de cambio ~950
  retention_d30_pct: 30,
  wau_min: 500,
};

const ANGEL_READY_THRESHOLD = {
  mrr_clp: 1_000_000, // conversacion con angel con al menos USD $1K MRR
  b2b_min: 5,
  premium_min: 30,
};

const SEED_READY_THRESHOLD = {
  mrr_clp: 8_000_000, // USD $8K MRR ≈ USD $100K ARR
  b2b_min: 60,
  premium_min: 500,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const PAID_PROVIDER_PLANS = ['provider_individual', 'provider_clinic_basic', 'provider_clinic_pro'];

const PROVIDER_PLAN_PRICES: Record<string, number> = {
  provider_free: 0,
  provider_individual: 9900,
  provider_clinic_basic: 29900,
  provider_clinic_pro: 59900,
};

function formatNumber(n: number): string {
  return n.toLocaleString('es-CL');
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

// ── Readiness tier ───────────────────────────────────────
type Tier = 'pre-traccion' | 'angel-ready' | 'pre-seed-ready' | 'seed-ready';

function computeTier(mrr: number, b2b: number, premium: number): Tier {
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

const TIER_LABELS: Record<Tier, { label: string; color: string; desc: string }> = {
  'pre-traccion': {
    label: 'Pre-traccion',
    color: 'bg-slate-700/40 text-slate-300 border-slate-600',
    desc: 'Todavia no hay tesis cuantitativa. Foco: primeras ventas.',
  },
  'angel-ready': {
    label: 'Angel-ready',
    color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    desc: 'Listo para conversar con angels LATAM y Start-Up Chile Ignite.',
  },
  'pre-seed-ready': {
    label: 'Pre-seed ready',
    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    desc: 'Cumple metas 90d del plan. Postular a CORFO SSAF-I y Platanus/Magma.',
  },
  'seed-ready': {
    label: 'Seed ready',
    color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    desc: 'ARR > USD $100K. Kaszek, Monashees, Cometa en rango.',
  },
};

// ── Data room checklist (hardcoded con toggles via localStorage) ──
interface DataRoomItem {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  critical?: boolean;
}

const DATA_ROOM_DEFAULT: DataRoomItem[] = [
  {
    id: 'spa',
    label: 'SpA constituida',
    detail: 'SUSAETA GARNHAM SOFTWARE ENGINEERING 78.328.659-9',
    done: true,
    critical: true,
  },
  {
    id: 'kpis',
    label: 'Dashboard KPIs',
    detail: 'Sala de Inversion en Admin (este modulo)',
    done: true,
    critical: true,
  },
  { id: 'terms', label: 'Terminos y condiciones publicados', detail: '/terms', done: true },
  { id: 'privacy', label: 'Politica de privacidad', detail: '/privacy', done: true },
  {
    id: 'pitch',
    label: 'Pitch deck 12 slides',
    detail: 'Problema, solucion, mercado, traccion, ask',
    done: false,
    critical: true,
  },
  {
    id: 'financials',
    label: 'Proyeccion financiera 24 meses',
    detail: 'P&L, cash flow, unit economics',
    done: false,
    critical: true,
  },
  {
    id: 'captable',
    label: 'Cap table + pool empleados',
    detail: 'Fundador 90%, ESOP 10%, proyectado',
    done: false,
  },
  {
    id: 'cofounder',
    label: 'Co-founder comercial o clinico',
    detail: 'Condicion de angel LATAM',
    done: false,
    critical: true,
  },

  {
    id: 'testimonials',
    label: 'Testimonios (2+ clinicas, 5+ duenos)',
    detail: 'Con nombre, foto y cita',
    done: false,
  },
  { id: 'demos', label: 'Demos grabadas (B2C y B2B)', detail: '3-5 min cada una', done: false },
  {
    id: 'roadmap',
    label: 'Roadmap 12 meses publico',
    detail: 'Milestones cuantitativos, responsables',
    done: false,
  },
  {
    id: 'corfo',
    label: 'Postulacion CORFO SSAF-I',
    detail: 'Requiere incubadora patrocinante',
    done: false,
  },
  {
    id: 'startupchile',
    label: 'Postulacion Start-Up Chile Ignite',
    detail: 'USD $15K equity-free',
    done: false,
  },
  {
    id: 'dpa',
    label: 'DPA Supabase firmado',
    detail: 'Data Processing Agreement para GDPR/CCPA',
    done: false,
  },
];

function loadChecklist(): DataRoomItem[] {
  try {
    const stored = localStorage.getItem('pf_sala_inversion_checklist');
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

function saveChecklist(items: DataRoomItem[]): void {
  try {
    const map: Record<string, boolean> = {};
    items.forEach((i) => {
      map[i.id] = i.done;
    });
    localStorage.setItem('pf_sala_inversion_checklist', JSON.stringify(map));
  } catch {
    // noop
  }
}

// ── Financiamiento Chile tracker ─────────────────────────
interface FinancingRoute {
  id: string;
  nombre: string;
  montoCLP: string;
  montoUSD: string;
  etapa: string;
  requisito: string;
  status: 'no-iniciado' | 'en-preparacion' | 'postulado' | 'en-comite' | 'aprobado' | 'rechazado';
  dilutivo: boolean;
}

const FINANCING_DEFAULT: FinancingRoute[] = [
  {
    id: 'su-chile-ignite',
    nombre: 'Start-Up Chile Ignite',
    montoCLP: '~$14M',
    montoUSD: '$15K',
    etapa: 'Pre-seed',
    requisito: 'SpA + MVP funcional',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'corfo-ssaf-i',
    nombre: 'CORFO SSAF-I (Semilla Inicia)',
    montoCLP: 'Hasta $25M',
    montoUSD: '$28K',
    etapa: 'Pre-traccion a traccion inicial',
    requisito: 'SpA + incubadora patrocinante',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'corfo-ssaf-e',
    nombre: 'CORFO SSAF-E (Semilla Expansion)',
    montoCLP: 'Hasta $60M',
    montoUSD: '$67K',
    etapa: 'Traccion validada',
    requisito: 'MRR + pilotos con clientes',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'su-chile-seed',
    nombre: 'Start-Up Chile Seed',
    montoCLP: '~$47M',
    montoUSD: '$50K',
    etapa: 'Seed',
    requisito: 'SpA + traccion + ingles',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'sercotec',
    nombre: 'SERCOTEC Capital Semilla',
    montoCLP: 'Hasta $3.5M',
    montoUSD: '$4K',
    etapa: 'Pre-traccion micro',
    requisito: 'Iniciacion de actividades',
    status: 'no-iniciado',
    dilutivo: false,
  },
  {
    id: 'angels-latam',
    nombre: 'Angels LATAM',
    montoCLP: '$95M-$190M',
    montoUSD: '$100-200K',
    etapa: 'Pre-seed',
    requisito: '100 Premium + 20 B2B + co-founder',
    status: 'no-iniciado',
    dilutivo: true,
  },
  {
    id: 'platanus',
    nombre: 'Platanus Ventures',
    montoCLP: '~$142M',
    montoUSD: '$150K',
    etapa: 'Pre-seed',
    requisito: 'ARR USD $100K run-rate',
    status: 'no-iniciado',
    dilutivo: true,
  },
  {
    id: 'magma',
    nombre: 'Magma Partners',
    montoCLP: '$95M-$475M',
    montoUSD: '$100-500K',
    etapa: 'Pre-seed/Seed',
    requisito: 'Tesis LATAM expansion',
    status: 'no-iniciado',
    dilutivo: true,
  },
];

function loadFinancing(): FinancingRoute[] {
  try {
    const stored = localStorage.getItem('pf_sala_inversion_financing');
    if (!stored) return FINANCING_DEFAULT;
    const parsed = JSON.parse(stored) as Record<string, FinancingRoute['status']>;
    return FINANCING_DEFAULT.map((r) => ({ ...r, status: parsed[r.id] ?? r.status }));
  } catch {
    return FINANCING_DEFAULT;
  }
}

function saveFinancing(routes: FinancingRoute[]): void {
  try {
    const map: Record<string, FinancingRoute['status']> = {};
    routes.forEach((r) => {
      map[r.id] = r.status;
    });
    localStorage.setItem('pf_sala_inversion_financing', JSON.stringify(map));
  } catch {
    // noop
  }
}

const FINANCING_STATUS_LABEL: Record<FinancingRoute['status'], { label: string; color: string }> = {
  'no-iniciado': { label: 'No iniciado', color: 'bg-slate-700/50 text-slate-400 border-slate-600' },
  'en-preparacion': {
    label: 'En preparacion',
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  postulado: { label: 'Postulado', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
  'en-comite': {
    label: 'En comite',
    color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  },
  aprobado: {
    label: 'Aprobado',
    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  rechazado: { label: 'Rechazado', color: 'bg-red-500/10 text-red-300 border-red-500/30' },
};

// ── Lead outreach funnel stages ──────────────────────────
const LEAD_STAGES: { key: string; label: string; color: string }[] = [
  { key: 'pendiente', label: 'Pendientes', color: '#64748b' },
  { key: 'contactado', label: 'Contactados', color: '#6366f1' },
  { key: 'respondio', label: 'Respondieron', color: '#06b6d4' },
  { key: 'interesado', label: 'Interesados', color: '#f59e0b' },
  { key: 'convertido', label: 'Convertidos', color: '#10b981' },
  { key: 'descartado', label: 'Descartados', color: '#ef4444' },
];

// ── Chart tooltip ────────────────────────────────────────
function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      {label && <p className="text-xs font-medium text-slate-300">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Meta row (progress bar con % real) ───────────────────
function MetaRow({
  icon: Icon,
  label,
  current,
  target,
  suffix,
  formatter,
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  target: number;
  suffix?: string;
  formatter?: (n: number) => string;
}) {
  const pct = clampPct((current / target) * 100);
  const fmt = formatter ?? formatNumber;
  const done = pct >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
              done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-200 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'font-mono text-sm font-bold',
              done ? 'text-emerald-400' : 'text-slate-300'
            )}
          >
            {fmt(current)}
            {suffix}
          </span>
          <span className="text-xs text-slate-500">
            / {fmt(target)}
            {suffix}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress
          value={pct}
          className={cn('h-1.5 flex-1 bg-slate-800', done && '[&>div]:bg-emerald-500')}
        />
        <span
          className={cn(
            'text-xs font-mono shrink-0 w-10 text-right',
            done ? 'text-emerald-400' : 'text-slate-500'
          )}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────
export default function AdminSalaInversion() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);

  // Snapshot date (solo para el banner, no reactivo)
  const snapshotDate = format(now, "d 'de' MMMM yyyy", { locale: es });

  // ── Checklist state (persisted in localStorage) ──
  const checklistQuery = useQuery({
    queryKey: ['sala-inversion-checklist'],
    queryFn: async () => loadChecklist(),
    staleTime: Infinity,
  });
  const checklist = checklistQuery.data ?? DATA_ROOM_DEFAULT;

  const toggleChecklist = (id: string) => {
    const updated = checklist.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    saveChecklist(updated);
    checklistQuery.refetch();
  };

  // ── Financing state (persisted in localStorage) ──
  const financingQuery = useQuery({
    queryKey: ['sala-inversion-financing'],
    queryFn: async () => loadFinancing(),
    staleTime: Infinity,
  });
  const financing = financingQuery.data ?? FINANCING_DEFAULT;

  const cycleFinancingStatus = (id: string) => {
    const order: FinancingRoute['status'][] = [
      'no-iniciado',
      'en-preparacion',
      'postulado',
      'en-comite',
      'aprobado',
      'rechazado',
    ];
    const updated = financing.map((r) => {
      if (r.id !== id) return r;
      const idx = order.indexOf(r.status);
      const next = order[(idx + 1) % order.length];
      return { ...r, status: next };
    });
    saveFinancing(updated);
    financingQuery.refetch();
  };

  // ── North Star KPIs ──
  const { data: northStar, isLoading: nsLoading } = useQuery({
    queryKey: ['sala-inversion-north-star'],
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const [
        { data: activeB2CSubs },
        { data: paidProviders },
        { count: mauRaw },
        { count: wauRaw },
        { count: totalPets },
        { count: totalUsers },
      ] = await Promise.all([
        sb
          .from('subscriptions')
          .select('payment_amount_clp, created_at, status')
          .eq('status', 'active'),
        sb
          .from('service_providers')
          .select('id, provider_plan, status, created_at')
          .in('provider_plan', PAID_PROVIDER_PLANS)
          .eq('status', 'approved'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('updated_at', monthAgo.toISOString()),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('updated_at', weekAgo.toISOString()),
        supabase
          .from('pets')
          .select('id', { count: 'exact', head: true })
          .eq('lifecycle_status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b2cSubs = (activeB2CSubs ?? []) as any[];
      const premiumCount = b2cSubs.length;
      const mrrB2C = b2cSubs.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, s: any) => sum + (s.payment_amount_clp || 0),
        0
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const providers = (paidProviders ?? []) as any[];
      const b2bCount = providers.length;
      const mrrB2B = providers.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, p: any) => sum + (PROVIDER_PLAN_PRICES[p.provider_plan] || 0),
        0
      );

      const mrrTotal = mrrB2C + mrrB2B;
      const arr = mrrTotal * 12;

      return {
        mrrTotal,
        mrrB2C,
        mrrB2B,
        arr,
        premiumCount,
        b2bCount,
        mau: mauRaw ?? 0,
        wau: wauRaw ?? 0,
        totalPets: totalPets ?? 0,
        totalUsers: totalUsers ?? 0,
      };
    },
  });

  // ── Retention (D1/D7/D30 de usuarios registrados en las ultimas 8 semanas) ──
  const { data: retention } = useQuery({
    queryKey: ['sala-inversion-retention'],
    staleTime: 300_000,
    refetchInterval: 600_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const eightWeeksAgo = subDays(now, 60).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('id, created_at, updated_at')
        .gte('created_at', eightWeeksAgo)
        .limit(2000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const users = (data ?? []) as any[];
      if (users.length === 0) return { d1: 0, d7: 0, d30: 0, base: 0 };

      const ageDays = (u: { created_at: string }) =>
        Math.floor((now.getTime() - new Date(u.created_at).getTime()) / 86_400_000);
      const lastSeenDays = (u: { updated_at: string | null; created_at: string }) => {
        const ref = u.updated_at ?? u.created_at;
        return Math.floor((now.getTime() - new Date(ref).getTime()) / 86_400_000);
      };

      const bucket = (minAge: number) => users.filter((u) => ageDays(u) >= minAge);

      const d1Base = bucket(1);
      const d7Base = bucket(7);
      const d30Base = bucket(30);

      const d1 =
        d1Base.length > 0
          ? Math.round(
              (d1Base.filter((u) => lastSeenDays(u) <= ageDays(u) - 1).length / d1Base.length) * 100
            )
          : 0;
      const d7 =
        d7Base.length > 0
          ? Math.round(
              (d7Base.filter((u) => lastSeenDays(u) <= ageDays(u) - 7).length / d7Base.length) * 100
            )
          : 0;
      const d30 =
        d30Base.length > 0
          ? Math.round(
              (d30Base.filter((u) => lastSeenDays(u) <= ageDays(u) - 30).length / d30Base.length) *
                100
            )
          : 0;

      return { d1, d7, d30, base: users.length };
    },
  });

  // ── Activation funnel (core pitch) ──
  const { data: funnel } = useQuery({
    queryKey: ['sala-inversion-funnel'],
    staleTime: 120_000,
    refetchInterval: 300_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const [
        { count: signupCount },
        { data: petsWithOwner },
        { data: medicalPets },
        { count: bookingsCount },
        { count: activeSubsCount },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('pets').select('owner_id').not('owner_id', 'is', null),
        supabase.from('medical_records').select('pet_id'),
        sb.from('all_bookings_view').select('id', { count: 'exact', head: true }),
        sb
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);

      const uniqueOwners = new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (petsWithOwner ?? []).map((p: any) => p.owner_id).filter(Boolean)
      ).size;
      const uniquePetsWithRecords = new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (medicalPets ?? []).map((r: any) => r.pet_id)
      ).size;

      const total = signupCount ?? 0;
      return [
        { step: 'Registro', count: total, description: 'Cuenta creada' },
        { step: 'Agrega mascota', count: uniqueOwners, description: 'Primer pet creado' },
        { step: 'Crea ficha', count: uniquePetsWithRecords, description: 'Registro medico real' },
        {
          step: 'Reserva vet',
          count: (bookingsCount as number | null) ?? 0,
          description: 'Conversion comercial',
        },
        {
          step: 'Premium / B2B pago',
          count: (activeSubsCount as number | null) ?? 0,
          description: 'Revenue real',
        },
      ].map((s, i, arr) => ({
        ...s,
        pct: total > 0 ? Math.round((s.count / total) * 100) : 0,
        dropFromPrev:
          i > 0 && arr[i - 1].count > 0
            ? Math.round(((arr[i - 1].count - s.count) / arr[i - 1].count) * 100)
            : 0,
      }));
    },
  });

  // ── Growth: MAU trend (6 meses) ──
  const { data: mauTrend } = useQuery({
    queryKey: ['sala-inversion-mau-trend'],
    staleTime: 300_000,
    refetchInterval: 600_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const sixMonthsAgo = subMonths(now, 5);
      const { data } = await supabase
        .from('profiles')
        .select('created_at, updated_at')
        .gte('created_at', startOfMonth(sixMonthsAgo).toISOString())
        .limit(5000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const users = (data ?? []) as any[];

      const months: { month: string; mau: number; nuevos: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const mStart = startOfMonth(subMonths(now, i));
        const mEnd = endOfMonth(mStart);
        const label = format(mStart, 'MMM yy', { locale: es });

        const mau = users.filter((u) => {
          const updated = new Date(u.updated_at ?? u.created_at);
          return updated >= mStart && updated <= mEnd;
        }).length;

        const nuevos = users.filter((u) => {
          const created = new Date(u.created_at);
          return created >= mStart && created <= mEnd;
        }).length;

        months.push({ month: label, mau, nuevos });
      }
      return months;
    },
  });

  // ── Growth: MRR trend (6 meses) ──
  const { data: mrrTrend } = useQuery({
    queryKey: ['sala-inversion-mrr-trend'],
    staleTime: 300_000,
    refetchInterval: 600_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const sixMonthsAgo = subMonths(now, 5);
      const { data } = await sb
        .from('subscriptions')
        .select('payment_amount_clp, status, created_at, end_date, cancelled_at')
        .gte('created_at', startOfMonth(sixMonthsAgo).toISOString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subs = (data ?? []) as any[];

      const months: { month: string; mrr: number; subs: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const mStart = startOfMonth(subMonths(now, i));
        const mEnd = endOfMonth(mStart);
        const label = format(mStart, 'MMM yy', { locale: es });

        const activeInMonth = subs.filter((s) => {
          const created = new Date(s.created_at);
          if (created > mEnd) return false;
          if (s.status === 'cancelled' || s.status === 'expired') {
            const cancelDate = s.cancelled_at ? new Date(s.cancelled_at) : null;
            if (cancelDate && cancelDate < mStart) return false;
          }
          return true;
        });

        const mrr = activeInMonth.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, s: any) => sum + (s.payment_amount_clp || 0),
          0
        );
        months.push({ month: label, mrr, subs: activeInMonth.length });
      }
      return months;
    },
  });

  // ── Unit economics ──
  const { data: unitEcon } = useQuery({
    queryKey: ['sala-inversion-unit-econ', northStar],
    staleTime: 120_000,
    refetchInterval: 300_000,
    enabled: Boolean(northStar),
    queryFn: async () => {
      const subsCount = (northStar?.premiumCount ?? 0) + (northStar?.b2bCount ?? 0);
      const arpuBlended = subsCount > 0 ? Math.round((northStar?.mrrTotal ?? 0) / subsCount) : 0;
      const arpuB2C =
        (northStar?.premiumCount ?? 0) > 0
          ? Math.round((northStar?.mrrB2C ?? 0) / (northStar?.premiumCount ?? 1))
          : 0;
      const arpuB2B =
        (northStar?.b2bCount ?? 0) > 0
          ? Math.round((northStar?.mrrB2B ?? 0) / (northStar?.b2bCount ?? 1))
          : 0;

      // Churn: cancelled in last 30d / active 30d ago
      const thirtyAgo = subDays(now, 30).toISOString();
      const sixtyAgo = subDays(now, 60).toISOString();

      const [{ data: cancelled30d }, { data: active60d }] = await Promise.all([
        sb
          .from('subscriptions')
          .select('id, cancelled_at')
          .eq('status', 'cancelled')
          .gte('cancelled_at', thirtyAgo),
        sb.from('subscriptions').select('id, created_at').lt('created_at', sixtyAgo),
      ]);

      const churned = (cancelled30d?.length as number | undefined) ?? 0;
      const baseActive = (active60d?.length as number | undefined) ?? 0;
      const churnPct = baseActive > 0 ? Math.round((churned / baseActive) * 100) : 0;

      // LTV = ARPU / churn mensual. Con 0% churn o sin datos, usamos supuesto 24 meses.
      const lifetimeMonths = churnPct > 0 ? Math.round(100 / churnPct) : 24;
      const ltvBlended = arpuBlended * lifetimeMonths;

      // CAC — placeholder (sin tabla de gasto marketing aun). Admin puede cambiar manualmente.
      const estimatedCac = 15_000; // CLP, estimado para outreach organico B2B
      const paybackMonths = arpuBlended > 0 ? Math.round(estimatedCac / arpuBlended) : null;

      return {
        arpuBlended,
        arpuB2C,
        arpuB2B,
        churnPct,
        lifetimeMonths,
        ltvBlended,
        estimatedCac,
        paybackMonths,
      };
    },
  });

  // ── B2B outreach funnel (leads vets schema) ──
  const { data: leadsFunnel } = useQuery({
    queryKey: ['sala-inversion-leads-funnel'],
    staleTime: 120_000,
    refetchInterval: 300_000,
    queryFn: async () => {
      // Intenta RPC principal, cae a ceros si el schema no existe.
      try {
        const { data, error } = await sb.rpc('listar_leads_vets', { p_limit: 5000 });
        if (error || !data) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = data as any[];
        const counts: Record<string, number> = {};
        LEAD_STAGES.forEach((s) => {
          counts[s.key] = 0;
        });
        rows.forEach((r) => {
          const est = r.estado_validacion || 'pendiente';
          counts[est] = (counts[est] ?? 0) + 1;
        });
        const total = rows.length;
        const converted = counts.convertido ?? 0;
        const contacted =
          (counts.contactado ?? 0) +
          (counts.respondio ?? 0) +
          (counts.interesado ?? 0) +
          (counts.convertido ?? 0);
        return {
          stages: LEAD_STAGES.map((s) => ({
            stage: s.label,
            count: counts[s.key] ?? 0,
            color: s.color,
          })),
          total,
          converted,
          contacted,
          conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
          contactRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
        };
      } catch {
        return null;
      }
    },
  });

  // ── System health (minimal para DD) ──
  const { data: health } = useQuery({
    queryKey: ['sala-inversion-health'],
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const start = performance.now();
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const latency = Math.round(performance.now() - start);

      const [{ count: criticalErrors }, { count: approvedProviders }, { count: reviewsCount }] =
        await Promise.all([
          sb
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .eq('severity', 'critical')
            .eq('resolved', false),
          sb
            .from('service_providers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'approved'),
          supabase.from('service_reviews').select('id', { count: 'exact', head: true }),
        ]);

      return {
        dbOk: !dbError,
        dbLatency: latency,
        criticalErrors: (criticalErrors as number | null) ?? 0,
        approvedProviders: (approvedProviders as number | null) ?? 0,
        reviewsCount: reviewsCount ?? 0,
      };
    },
  });

  // ── Export brief inversor ──
  const handleExportBrief = () => {
    const lines: string[] = [];
    lines.push('PAW FRIEND — Brief inversor');
    lines.push(`Snapshot: ${snapshotDate}`);
    lines.push('');
    lines.push('=== North Star ===');
    lines.push(`MRR total,${northStar?.mrrTotal ?? 0}`);
    lines.push(`MRR B2C,${northStar?.mrrB2C ?? 0}`);
    lines.push(`MRR B2B,${northStar?.mrrB2B ?? 0}`);
    lines.push(`ARR,${northStar?.arr ?? 0}`);
    lines.push(`Premium B2C,${northStar?.premiumCount ?? 0}`);
    lines.push(`Clinicas B2B pagando,${northStar?.b2bCount ?? 0}`);
    lines.push(`MAU,${northStar?.mau ?? 0}`);
    lines.push(`WAU,${northStar?.wau ?? 0}`);
    lines.push(`Mascotas activas,${northStar?.totalPets ?? 0}`);
    lines.push(`Usuarios totales,${northStar?.totalUsers ?? 0}`);
    lines.push('');
    lines.push('=== Metas 90d ===');
    lines.push(
      `Premium B2C,${northStar?.premiumCount ?? 0},${TARGETS_90D.premium_b2c},${Math.round(((northStar?.premiumCount ?? 0) / TARGETS_90D.premium_b2c) * 100)}%`
    );
    lines.push(
      `Clinicas B2B pagas,${northStar?.b2bCount ?? 0},${TARGETS_90D.paying_b2b},${Math.round(((northStar?.b2bCount ?? 0) / TARGETS_90D.paying_b2b) * 100)}%`
    );
    lines.push(
      `MRR (CLP),${northStar?.mrrTotal ?? 0},${TARGETS_90D.mrr_clp},${Math.round(((northStar?.mrrTotal ?? 0) / TARGETS_90D.mrr_clp) * 100)}%`
    );
    lines.push(`Retention D30 %,${retention?.d30 ?? 0},${TARGETS_90D.retention_d30_pct}`);
    lines.push('');
    lines.push('=== Funnel activacion ===');
    lines.push('Paso,Cantidad,%,Drop vs paso anterior');
    (funnel ?? []).forEach((s) => lines.push(`${s.step},${s.count},${s.pct}%,-${s.dropFromPrev}%`));
    lines.push('');
    lines.push('=== Unit economics ===');
    lines.push(`ARPU blended,${unitEcon?.arpuBlended ?? 0}`);
    lines.push(`ARPU B2C,${unitEcon?.arpuB2C ?? 0}`);
    lines.push(`ARPU B2B,${unitEcon?.arpuB2B ?? 0}`);
    lines.push(`Churn mensual %,${unitEcon?.churnPct ?? 0}`);
    lines.push(`LTV blended,${unitEcon?.ltvBlended ?? 0}`);
    lines.push(`CAC estimado,${unitEcon?.estimatedCac ?? 0}`);
    lines.push(`Payback meses,${unitEcon?.paybackMonths ?? 'n/a'}`);
    lines.push('');
    lines.push('=== MRR trend 6m ===');
    lines.push('Mes,MRR,Suscripciones');
    (mrrTrend ?? []).forEach((m) => lines.push(`${m.month},${m.mrr},${m.subs}`));

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paw-friend-brief-inversor-${format(now, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────
  const tier = computeTier(
    northStar?.mrrTotal ?? 0,
    northStar?.b2bCount ?? 0,
    northStar?.premiumCount ?? 0
  );
  const tierConfig = TIER_LABELS[tier];

  return (
    <div className="space-y-6">
      {/* ── Hero header ── */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900">
        <CardContent className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30">
              <Trophy className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">Sala de Inversion</h2>
                <Badge
                  variant="outline"
                  className={cn('font-medium text-xs border', tierConfig.color)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {tierConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">{tierConfig.desc}</p>
              <p className="text-xs text-slate-500 mt-1">Snapshot: {snapshotDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-2 border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
              onClick={handleExportBrief}
            >
              <Download className="h-3.5 w-3.5" />
              Exportar brief (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── North Star KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="MRR total"
          value={formatCLPCompact(northStar?.mrrTotal ?? 0)}
          icon={DollarSign}
          description={`B2C ${formatCLPCompact(northStar?.mrrB2C ?? 0)} · B2B ${formatCLPCompact(northStar?.mrrB2B ?? 0)}`}
          loading={nsLoading}
        />
        <AdminKpiCard
          title="ARR run-rate"
          value={formatCLPCompact(northStar?.arr ?? 0)}
          icon={TrendingUp}
          description="MRR × 12"
          loading={nsLoading}
        />
        <AdminKpiCard
          title="Premium B2C activos"
          value={northStar?.premiumCount ?? 0}
          icon={Crown}
          description={`${formatCLPCompact(northStar?.mrrB2C ?? 0)} MRR`}
          loading={nsLoading}
          to="/admin?section=finance"
        />
        <AdminKpiCard
          title="Clinicas B2B pagando"
          value={northStar?.b2bCount ?? 0}
          icon={Briefcase}
          description={`${formatCLPCompact(northStar?.mrrB2B ?? 0)} MRR`}
          loading={nsLoading}
          to="/admin?section=providers&sub=central"
        />
      </div>

      {/* ── Secondary context KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="MAU (30d)"
          value={formatNumber(northStar?.mau ?? 0)}
          icon={Users}
          description={`${formatNumber(northStar?.totalUsers ?? 0)} usuarios totales`}
          loading={nsLoading}
          to="/admin?section=users&sub=users"
        />
        <AdminKpiCard
          title="WAU (7d)"
          value={formatNumber(northStar?.wau ?? 0)}
          icon={Activity}
          description="Usuarios activos semana"
          loading={nsLoading}
        />
        <AdminKpiCard
          title="Retention D30"
          value={`${retention?.d30 ?? 0}%`}
          icon={Target}
          description={`D1 ${retention?.d1 ?? 0}% · D7 ${retention?.d7 ?? 0}%`}
          alert={(retention?.d30 ?? 0) < TARGETS_90D.retention_d30_pct}
        />
        <AdminKpiCard
          title="Clinicas aprobadas"
          value={health?.approvedProviders ?? 0}
          icon={BadgeCheck}
          description={`${health?.reviewsCount ?? 0} resenas totales`}
          to="/admin?section=providers&sub=central"
        />
      </div>

      {/* ── Metas 90 dias ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Flag className="h-4 w-4 text-indigo-400" />
            Metas 90 dias (desbloquean pre-seed)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Del plan ejecutable post-DD. Si los 4 en verde, es momento de postular a CORFO SSAF-I y
            abrir conversaciones con Platanus / Magma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <MetaRow
            icon={Crown}
            label="Premium B2C pagos"
            current={northStar?.premiumCount ?? 0}
            target={TARGETS_90D.premium_b2c}
          />
          <MetaRow
            icon={Briefcase}
            label="Clinicas B2B pagas"
            current={northStar?.b2bCount ?? 0}
            target={TARGETS_90D.paying_b2b}
          />
          <MetaRow
            icon={DollarSign}
            label="MRR (CLP)"
            current={northStar?.mrrTotal ?? 0}
            target={TARGETS_90D.mrr_clp}
            formatter={formatCLPCompact}
          />
          <MetaRow
            icon={Target}
            label="Retention D30"
            current={retention?.d30 ?? 0}
            target={TARGETS_90D.retention_d30_pct}
            suffix="%"
          />
          <MetaRow
            icon={Users}
            label="WAU minimo"
            current={northStar?.wau ?? 0}
            target={TARGETS_90D.wau_min}
          />
        </CardContent>
      </Card>

      {/* ── Funnel de activacion ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" />
            Embudo de activacion
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Registro &rarr; Mascota &rarr; Ficha &rarr; Reserva &rarr; Pago. El drop-off define
            donde esta la fuga de valor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!funnel ? (
            <Skeleton className="h-40 w-full bg-slate-800" />
          ) : (
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const maxCount = funnel[0]?.count || 1;
                const barWidth = Math.max((step.count / maxCount) * 100, 6);
                return (
                  <div key={step.step} className="flex items-center gap-3">
                    <div className="w-32 shrink-0 text-right">
                      <p className="text-xs font-medium text-slate-300">{step.step}</p>
                      <p className="text-[10px] text-slate-500">{step.description}</p>
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-8 rounded-md flex items-center px-3 transition-all"
                        style={{
                          width: `${barWidth}%`,
                          background: `linear-gradient(90deg, rgba(99,102,241,0.9) 0%, rgba(129,140,248,0.6) 100%)`,
                        }}
                      >
                        <span className="text-xs font-bold font-mono text-white">
                          {formatNumber(step.count)}
                        </span>
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs font-mono text-slate-400">
                      {step.pct}%
                    </span>
                    {i > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] w-14 justify-center shrink-0',
                          step.dropFromPrev > 50
                            ? 'border-red-800 text-red-400'
                            : step.dropFromPrev > 25
                              ? 'border-amber-800 text-amber-400'
                              : 'border-slate-700 text-slate-400'
                        )}
                      >
                        -{step.dropFromPrev}%
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Growth trends: MAU + MRR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400">
              MAU y nuevos usuarios (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!mauTrend ? (
              <Skeleton className="h-52 w-full bg-slate-800" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={mauTrend}>
                  <defs>
                    <linearGradient id="gradMau" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mau"
                    name="MAU"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#gradMau)"
                  />
                  <Area
                    type="monotone"
                    dataKey="nuevos"
                    name="Nuevos"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#gradNew)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400">
              MRR (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!mrrTrend ? (
              <Skeleton className="h-52 w-full bg-slate-800" />
            ) : mrrTrend.every((m) => m.mrr === 0) ? (
              <AdminEmptyState
                icon={DollarSign}
                title="Sin ingresos aun"
                description="Reactivar Premium y cerrar primera clinica B2B"
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCLPCompact(v)}
                  />
                  <Tooltip content={<DarkTooltip formatter={formatCLPCompact} />} />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Unit economics ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Unit economics
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            CAC estimado asume outreach organico fundador. Ajustar cuando haya spend real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">ARPU blended</p>
              <p className="text-xl font-bold font-mono text-indigo-300 mt-1">
                {formatCLPCompact(unitEcon?.arpuBlended ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Por suscripcion / mes</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">ARPU B2C</p>
              <p className="text-xl font-bold font-mono text-cyan-300 mt-1">
                {formatCLPCompact(unitEcon?.arpuB2C ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Dueno Premium</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">ARPU B2B</p>
              <p className="text-xl font-bold font-mono text-amber-300 mt-1">
                {formatCLPCompact(unitEcon?.arpuB2B ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Clinica / profesional</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Churn mensual</p>
              <p
                className={cn(
                  'text-xl font-bold font-mono mt-1',
                  (unitEcon?.churnPct ?? 0) > 10 ? 'text-red-400' : 'text-emerald-400'
                )}
              >
                {unitEcon?.churnPct ?? 0}%
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Target &lt; 8%</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">LTV blended</p>
              <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
                {formatCLPCompact(unitEcon?.ltvBlended ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {unitEcon?.lifetimeMonths ?? 24} meses de vida
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">CAC estimado</p>
              <p className="text-xl font-bold font-mono text-slate-200 mt-1">
                {formatCLPCompact(unitEcon?.estimatedCac ?? 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Placeholder — actualizar</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Payback</p>
              <p className="text-xl font-bold font-mono text-indigo-300 mt-1">
                {unitEcon?.paybackMonths ? `${unitEcon.paybackMonths}m` : '—'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Target &lt; 6 meses</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">LTV / CAC</p>
              <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
                {unitEcon && unitEcon.estimatedCac > 0
                  ? `${Math.round(unitEcon.ltvBlended / unitEcon.estimatedCac)}x`
                  : '—'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Saludable &gt; 3x</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── B2B outreach funnel ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-400" />
            <Link to="/admin?section=leads-crm" className="hover:text-slate-200 transition-colors">
              Traccion comercial B2B (leads vets) &rarr;
            </Link>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Pipeline de clinicas contactadas. Meta semana: 20 nuevos contactados, 2 demos agendadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!leadsFunnel ? (
            <AdminEmptyState
              icon={Target}
              title="Sin datos de leads"
              description="El schema 'leads' no esta disponible o no hay registros todavia. Ir a Leads Vets para agregar."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={leadsFunnel.stages} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]} barSize={20}>
                      {leadsFunnel.stages.map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total leads</p>
                  <p className="text-2xl font-bold font-mono text-white mt-1">
                    {formatNumber(leadsFunnel.total)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Contactados</p>
                  <p className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                    {formatNumber(leadsFunnel.contacted)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {leadsFunnel.contactRate}% del total
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Convertidos</p>
                  <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                    {formatNumber(leadsFunnel.converted)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {leadsFunnel.conversionRate}% conversion total
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Data room checklist ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Data room para inversores
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Minimo exigido al mes 3 del plan. Click en cada item para marcar/desmarcar (persistido
            localmente).
            {checklist.filter((i) => i.done).length} / {checklist.length} completados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-md border text-left transition-all',
                  item.done
                    ? 'bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10'
                    : item.critical
                      ? 'bg-slate-800/40 border-red-500/20 hover:border-red-500/40'
                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle
                    className={cn(
                      'h-5 w-5 shrink-0',
                      item.critical ? 'text-red-400' : 'text-slate-500'
                    )}
                  />
                )}
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      item.done ? 'text-emerald-200' : 'text-slate-200'
                    )}
                  >
                    {item.label}
                    {item.critical && !item.done && (
                      <span className="ml-2 text-[10px] text-red-400">CRITICO</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Financiamiento tracker ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400" />
            Rutas de financiamiento
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Click en el estado para cambiar (no-iniciado &rarr; en-preparacion &rarr; postulado
            &rarr; en-comite &rarr; aprobado &rarr; rechazado).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400">
                    Programa
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400">Monto</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400 hidden md:table-cell">
                    Etapa
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400 hidden lg:table-cell">
                    Requisito clave
                  </th>
                  <th className="text-left py-2 text-xs font-medium text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {financing.map((route) => (
                  <tr key={route.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        {route.dilutivo ? (
                          <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <Award className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span className="text-sm font-medium text-slate-200">{route.nombre}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div>
                        <p className="text-xs font-mono text-slate-300">{route.montoCLP}</p>
                        <p className="text-[10px] text-slate-500">{route.montoUSD}</p>
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-400 hidden md:table-cell">
                      {route.etapa}
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-400 hidden lg:table-cell">
                      {route.requisito}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => cycleFinancingStatus(route.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all hover:brightness-110',
                          FINANCING_STATUS_LABEL[route.status].color
                        )}
                      >
                        {FINANCING_STATUS_LABEL[route.status].label}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Salud operacional (para DD tecnico) ── */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            Salud operacional (para DD tecnico)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">DB latency</p>
              <p
                className={cn(
                  'text-lg font-bold font-mono mt-1',
                  (health?.dbLatency ?? 0) < 500 ? 'text-emerald-400' : 'text-amber-400'
                )}
              >
                {health?.dbLatency ?? '...'}ms
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Errores criticos
              </p>
              <p
                className={cn(
                  'text-lg font-bold font-mono mt-1',
                  (health?.criticalErrors ?? 0) === 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {health?.criticalErrors ?? 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sin resolver</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Vets aprobados</p>
              <p className="text-lg font-bold font-mono text-indigo-300 mt-1">
                {health?.approvedProviders ?? 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">En directorio publico</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Resenas totales</p>
              <p className="text-lg font-bold font-mono text-amber-300 mt-1">
                {health?.reviewsCount ?? 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Social proof</p>
            </div>
          </div>
          {(health?.criticalErrors ?? 0) > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-md border border-red-500/30 bg-red-500/5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">
                Hay errores criticos sin resolver. Resolverlos antes de exponer acceso a DD externo.
              </p>
              <Link
                to="/admin?section=system&sub=errors"
                className="ml-auto text-xs text-red-300 underline hover:text-red-200 shrink-0"
              >
                Ver errores &rarr;
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Footer: recordatorio del tier ── */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xs text-slate-400 leading-relaxed">
            <p className="font-medium text-slate-200">Proxima revision del plan: mes 1</p>
            <p className="mt-1">
              Si O1 (reactivar Premium) y O2 (20 B2B pagas) no avanzan, ajustar metas antes de
              postular. Ver <code className="text-slate-300">project_vc_plan_2026_04_18.md</code> en
              memoria para contexto completo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
