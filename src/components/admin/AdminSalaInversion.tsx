/**
 * Sala de Inversion — KPIs y data room para presentar a inversores y fondos.
 *
 * Consume el plan 90/180/365d documentado en memory/project_vc_plan_2026_04_18.md.
 * Disenado para:
 *  - Snapshot listo para compartir con angels (Platanus, Magma, Chile Global Angels)
 *  - Postulaciones a CORFO SSAF-I, Start-Up Chile Ignite/Seed, SERCOTEC
 *  - Seguimiento de metas north-star que desbloquean la siguiente ronda
 *
 * Estilo: paleta Paw Friend (fondo claro + brand purple + acentos gold/emerald).
 * Optimizado para impresion/captura de pantalla en procesos de inversion.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  PawPrint,
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
const TARGETS_90D = {
  premium_b2c: 100,
  paying_b2b: 20,
  mrr_clp: 1_900_000,
  retention_d30_pct: 30,
  wau_min: 500,
};

const ANGEL_READY_THRESHOLD = {
  mrr_clp: 1_000_000,
  b2b_min: 5,
  premium_min: 30,
};

const SEED_READY_THRESHOLD = {
  mrr_clp: 8_000_000,
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

// ── Brand palette ────────────────────────────────────────
const BRAND = {
  primary: '#9333ea',
  primaryLight: '#a855f7',
  primaryDeep: '#7e22ce',
  gold: '#d97706',
  emerald: '#16a34a',
  sky: '#0284c7',
  coral: '#dc2626',
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

const TIER_LABELS: Record<
  Tier,
  { label: string; badgeClass: string; dotClass: string; desc: string }
> = {
  'pre-traccion': {
    label: 'Pre-traccion',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    desc: 'Todavia no hay tesis cuantitativa. Foco: primeras ventas.',
  },
  'angel-ready': {
    label: 'Angel-ready',
    badgeClass: 'bg-brand-50 text-brand-700 border-brand-200',
    dotClass: 'bg-brand-500',
    desc: 'Listo para conversar con angels LATAM y Start-Up Chile Ignite.',
  },
  'pre-seed-ready': {
    label: 'Pre-seed ready',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    desc: 'Cumple metas 90d del plan. Postular a CORFO SSAF-I y Platanus/Magma.',
  },
  'seed-ready': {
    label: 'Seed ready',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    desc: 'ARR > USD $100K. Kaszek, Monashees, Cometa en rango.',
  },
};

// ── Data room checklist ──────────────────────────────────
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

// ── Financiamiento tracker ───────────────────────────────
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
  'no-iniciado': {
    label: 'No iniciado',
    color: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
  },
  'en-preparacion': {
    label: 'En preparacion',
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  postulado: {
    label: 'Postulado',
    color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  },
  'en-comite': {
    label: 'En comite',
    color: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100',
  },
  aprobado: {
    label: 'Aprobado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  rechazado: {
    label: 'Rechazado',
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
};

// ── Lead outreach funnel stages ──────────────────────────
const LEAD_STAGES: { key: string; label: string; color: string }[] = [
  { key: 'pendiente', label: 'Pendientes', color: '#94a3b8' },
  { key: 'contactado', label: 'Contactados', color: '#9333ea' },
  { key: 'respondio', label: 'Respondieron', color: '#0284c7' },
  { key: 'interesado', label: 'Interesados', color: '#d97706' },
  { key: 'convertido', label: 'Convertidos', color: '#16a34a' },
  { key: 'descartado', label: 'Descartados', color: '#dc2626' },
];

// ── Chart tooltip ────────────────────────────────────────
function LightTooltip({
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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold text-slate-900">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Meta row ─────────────────────────────────────────────
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              done
                ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                : 'bg-brand-50 text-brand-600 ring-1 ring-brand-100'
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              'font-mono text-sm font-bold',
              done ? 'text-emerald-600' : 'text-slate-900'
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
          className={cn(
            'h-2 flex-1 bg-slate-100',
            done ? '[&>div]:bg-emerald-500' : '[&>div]:bg-brand-600'
          )}
        />
        <span
          className={cn(
            'text-xs font-mono shrink-0 w-10 text-right font-semibold',
            done ? 'text-emerald-600' : 'text-slate-500'
          )}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

// ── KPI card (tema claro Paw Friend) ─────────────────────
function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  tone = 'brand',
  loading,
  to,
  alert,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  tone?: 'brand' | 'emerald' | 'gold' | 'sky' | 'coral';
  loading?: boolean;
  to?: string;
  alert?: boolean;
}) {
  if (loading) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm p-4">
        <Skeleton className="h-4 w-24 bg-slate-100" />
        <Skeleton className="mt-2 h-8 w-20 bg-slate-100" />
        <Skeleton className="mt-2 h-3 w-32 bg-slate-100" />
      </Card>
    );
  }

  const TONE_STYLES: Record<string, { iconBg: string; iconText: string; ring: string }> = {
    brand: { iconBg: 'bg-brand-50', iconText: 'text-brand-600', ring: 'ring-brand-100' },
    emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', ring: 'ring-emerald-100' },
    gold: { iconBg: 'bg-amber-50', iconText: 'text-amber-600', ring: 'ring-amber-100' },
    sky: { iconBg: 'bg-sky-50', iconText: 'text-sky-600', ring: 'ring-sky-100' },
    coral: { iconBg: 'bg-rose-50', iconText: 'text-rose-600', ring: 'ring-rose-100' },
  };

  const t = TONE_STYLES[tone];

  const card = (
    <Card
      className={cn(
        'relative bg-white border-slate-200 shadow-sm p-4 transition-all',
        to && 'cursor-pointer hover:shadow-md hover:border-brand-200',
        alert && 'border-rose-200 bg-rose-50/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 truncate">{value}</p>
          {description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{description}</p>}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
            t.iconBg,
            t.iconText,
            t.ring
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none">
        {card}
      </Link>
    );
  }
  return card;
}

// ── Main component ───────────────────────────────────────
export default function AdminSalaInversion() {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);
  const snapshotDate = format(now, "d 'de' MMMM yyyy", { locale: es });

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

  // ── Retention ──
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

  // ── Activation funnel ──
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
          step: 'Premium / B2B',
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

  // ── MAU trend ──
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

  // ── MRR trend ──
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

      const lifetimeMonths = churnPct > 0 ? Math.round(100 / churnPct) : 24;
      const ltvBlended = arpuBlended * lifetimeMonths;
      const estimatedCac = 15_000;
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

  // ── Leads funnel ──
  const { data: leadsFunnel } = useQuery({
    queryKey: ['sala-inversion-leads-funnel'],
    staleTime: 120_000,
    refetchInterval: 300_000,
    queryFn: async () => {
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

  // ── Health ──
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

  // ── Export brief ──
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

  const tier = computeTier(
    northStar?.mrrTotal ?? 0,
    northStar?.b2bCount ?? 0,
    northStar?.premiumCount ?? 0
  );
  const tierConfig = TIER_LABELS[tier];
  const checklistDone = checklist.filter((i) => i.done).length;
  const checklistTotal = checklist.length;
  const checklistCritical = checklist.filter((i) => i.critical && !i.done).length;

  return (
    <div className="min-h-full -mx-4 lg:-mx-6 -my-5 px-4 lg:px-6 py-6 bg-gradient-to-br from-brand-50/50 via-white to-amber-50/30 text-slate-900">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* ── Hero ── */}
        <Card className="border-brand-200 shadow-lg overflow-hidden bg-white">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-amber-500" />
          <CardContent className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-900">Sala de Inversion</h2>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-medium text-xs border inline-flex items-center gap-1.5',
                      tierConfig.badgeClass
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', tierConfig.dotClass)} />
                    {tierConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">{tierConfig.desc}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <PawPrint className="h-3.5 w-3.5 text-brand-500" />
                    <span>Paw Friend</span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <span>Snapshot: {snapshotDate}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-9 gap-2 bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                onClick={handleExportBrief}
              >
                <Download className="h-3.5 w-3.5" />
                Brief inversor (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── North Star KPIs ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              North Star
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="MRR total"
              value={formatCLPCompact(northStar?.mrrTotal ?? 0)}
              icon={DollarSign}
              tone="emerald"
              description={`B2C ${formatCLPCompact(northStar?.mrrB2C ?? 0)} · B2B ${formatCLPCompact(northStar?.mrrB2B ?? 0)}`}
              loading={nsLoading}
            />
            <KpiCard
              title="ARR run-rate"
              value={formatCLPCompact(northStar?.arr ?? 0)}
              icon={TrendingUp}
              tone="brand"
              description="MRR × 12"
              loading={nsLoading}
            />
            <KpiCard
              title="Premium B2C activos"
              value={northStar?.premiumCount ?? 0}
              icon={Crown}
              tone="gold"
              description={`${formatCLPCompact(northStar?.mrrB2C ?? 0)} MRR B2C`}
              loading={nsLoading}
              to="/admin?section=finance"
            />
            <KpiCard
              title="Clinicas B2B pagando"
              value={northStar?.b2bCount ?? 0}
              icon={Briefcase}
              tone="sky"
              description={`${formatCLPCompact(northStar?.mrrB2B ?? 0)} MRR B2B`}
              loading={nsLoading}
              to="/admin?section=providers&sub=central"
            />
          </div>
        </div>

        {/* ── Context KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="MAU (30d)"
            value={formatNumber(northStar?.mau ?? 0)}
            icon={Users}
            tone="brand"
            description={`${formatNumber(northStar?.totalUsers ?? 0)} usuarios totales`}
            loading={nsLoading}
            to="/admin?section=users&sub=users"
          />
          <KpiCard
            title="WAU (7d)"
            value={formatNumber(northStar?.wau ?? 0)}
            icon={Activity}
            tone="brand"
            description="Usuarios activos semana"
            loading={nsLoading}
          />
          <KpiCard
            title="Retention D30"
            value={`${retention?.d30 ?? 0}%`}
            icon={Target}
            tone={(retention?.d30 ?? 0) >= TARGETS_90D.retention_d30_pct ? 'emerald' : 'coral'}
            description={`D1 ${retention?.d1 ?? 0}% · D7 ${retention?.d7 ?? 0}%`}
            alert={(retention?.d30 ?? 0) < TARGETS_90D.retention_d30_pct}
          />
          <KpiCard
            title="Clinicas aprobadas"
            value={health?.approvedProviders ?? 0}
            icon={BadgeCheck}
            tone="emerald"
            description={`${health?.reviewsCount ?? 0} resenas totales`}
            to="/admin?section=providers&sub=central"
          />
        </div>

        {/* ── Metas 90d ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Flag className="h-4 w-4" />
              </div>
              Metas 90 dias
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Del plan ejecutable post-DD. Si los 4 en verde, es momento de postular a CORFO SSAF-I
              y abrir conversaciones con Platanus / Magma.
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

        {/* ── Funnel ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Zap className="h-4 w-4" />
              </div>
              Embudo de activacion
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Registro &rarr; Mascota &rarr; Ficha &rarr; Reserva &rarr; Pago. El drop-off define
              donde esta la fuga de valor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!funnel ? (
              <Skeleton className="h-40 w-full bg-slate-100" />
            ) : (
              <div className="space-y-3">
                {funnel.map((step, i) => {
                  const maxCount = funnel[0]?.count || 1;
                  const barWidth = Math.max((step.count / maxCount) * 100, 8);
                  return (
                    <div key={step.step} className="flex items-center gap-3">
                      <div className="w-36 shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-800">{step.step}</p>
                        <p className="text-[11px] text-slate-500">{step.description}</p>
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-9 rounded-lg flex items-center px-3 shadow-sm transition-all"
                          style={{
                            width: `${barWidth}%`,
                            background: `linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%)`,
                          }}
                        >
                          <span className="text-sm font-bold font-mono text-white">
                            {formatNumber(step.count)}
                          </span>
                        </div>
                      </div>
                      <span className="w-12 shrink-0 text-right text-sm font-mono font-semibold text-slate-700">
                        {step.pct}%
                      </span>
                      {i > 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] w-14 justify-center shrink-0 border',
                            step.dropFromPrev > 50
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : step.dropFromPrev > 25
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
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

        {/* ── Growth trends ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                MAU y nuevos usuarios (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!mauTrend ? (
                <Skeleton className="h-52 w-full bg-slate-100" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={mauTrend}>
                    <defs>
                      <linearGradient id="gradMauLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradNewLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND.sky} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={BRAND.sky} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<LightTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="mau"
                      name="MAU"
                      stroke={BRAND.primary}
                      strokeWidth={2}
                      fill="url(#gradMauLight)"
                    />
                    <Area
                      type="monotone"
                      dataKey="nuevos"
                      name="Nuevos"
                      stroke={BRAND.sky}
                      strokeWidth={2}
                      fill="url(#gradNewLight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">MRR (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              {!mrrTrend ? (
                <Skeleton className="h-52 w-full bg-slate-100" />
              ) : mrrTrend.every((m) => m.mrr === 0) ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100 mb-3">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Sin ingresos aun</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Reactivar Premium y cerrar primera clinica B2B
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={mrrTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCLPCompact(v)}
                    />
                    <Tooltip content={<LightTooltip formatter={formatCLPCompact} />} />
                    <Line
                      type="monotone"
                      dataKey="mrr"
                      name="MRR"
                      stroke={BRAND.emerald}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: BRAND.emerald }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Unit economics ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <DollarSign className="h-4 w-4" />
              </div>
              Unit economics
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              CAC estimado asume outreach organico fundador. Ajustar cuando haya spend real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: 'ARPU blended',
                  value: formatCLPCompact(unitEcon?.arpuBlended ?? 0),
                  hint: 'Por suscripcion / mes',
                  valueClass: 'text-brand-700',
                },
                {
                  label: 'ARPU B2C',
                  value: formatCLPCompact(unitEcon?.arpuB2C ?? 0),
                  hint: 'Dueno Premium',
                  valueClass: 'text-sky-700',
                },
                {
                  label: 'ARPU B2B',
                  value: formatCLPCompact(unitEcon?.arpuB2B ?? 0),
                  hint: 'Clinica / profesional',
                  valueClass: 'text-amber-700',
                },
                {
                  label: 'Churn mensual',
                  value: `${unitEcon?.churnPct ?? 0}%`,
                  hint: 'Target < 8%',
                  valueClass: (unitEcon?.churnPct ?? 0) > 10 ? 'text-rose-600' : 'text-emerald-600',
                },
                {
                  label: 'LTV blended',
                  value: formatCLPCompact(unitEcon?.ltvBlended ?? 0),
                  hint: `${unitEcon?.lifetimeMonths ?? 24} meses de vida`,
                  valueClass: 'text-emerald-700',
                },
                {
                  label: 'CAC estimado',
                  value: formatCLPCompact(unitEcon?.estimatedCac ?? 0),
                  hint: 'Placeholder — actualizar',
                  valueClass: 'text-slate-800',
                },
                {
                  label: 'Payback',
                  value: unitEcon?.paybackMonths ? `${unitEcon.paybackMonths}m` : '—',
                  hint: 'Target < 6 meses',
                  valueClass: 'text-brand-700',
                },
                {
                  label: 'LTV / CAC',
                  value:
                    unitEcon && unitEcon.estimatedCac > 0
                      ? `${Math.round(unitEcon.ltvBlended / unitEcon.estimatedCac)}x`
                      : '—',
                  hint: 'Saludable > 3x',
                  valueClass: 'text-emerald-700',
                },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200"
                >
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    {cell.label}
                  </p>
                  <p className={cn('text-xl font-bold font-mono mt-1', cell.valueClass)}>
                    {cell.value}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{cell.hint}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Leads funnel ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Target className="h-4 w-4" />
              </div>
              <Link
                to="/admin?section=leads-crm"
                className="hover:text-brand-700 transition-colors"
              >
                Traccion comercial B2B (leads vets) &rarr;
              </Link>
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Pipeline de clinicas contactadas. Meta semana: 20 nuevos contactados, 2 demos
              agendadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!leadsFunnel ? (
              <AdminEmptyState
                icon={Target}
                title="Sin datos de leads"
                description="Ir a Leads Vets para agregar o activar el schema."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={leadsFunnel.stages} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        tick={{ fontSize: 11, fill: '#475569' }}
                        width={100}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<LightTooltip />} />
                      <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]} barSize={24}>
                        {leadsFunnel.stages.map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                      Total leads
                    </p>
                    <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                      {formatNumber(leadsFunnel.total)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                    <p className="text-[10px] text-sky-600 uppercase tracking-wider font-medium">
                      Contactados
                    </p>
                    <p className="text-2xl font-bold font-mono text-sky-700 mt-1">
                      {formatNumber(leadsFunnel.contacted)}
                    </p>
                    <p className="text-[10px] text-sky-600 mt-0.5">
                      {leadsFunnel.contactRate}% del total
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-medium">
                      Convertidos
                    </p>
                    <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                      {formatNumber(leadsFunnel.converted)}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      {leadsFunnel.conversionRate}% conversion
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Data room checklist ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              Data room para inversores
              <Badge
                variant="outline"
                className="ml-2 bg-slate-50 text-slate-700 border-slate-200 font-mono"
              >
                {checklistDone} / {checklistTotal}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Minimo exigido al mes 3 del plan. Click en cada item para marcar/desmarcar.
              {checklistCritical > 0 && (
                <span className="ml-1 text-rose-600 font-medium">
                  {checklistCritical} criticos pendientes.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                    item.done
                      ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50'
                      : item.critical
                        ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                  )}
                >
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle
                      className={cn(
                        'h-5 w-5 shrink-0',
                        item.critical ? 'text-rose-500' : 'text-slate-400'
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          item.done ? 'text-emerald-800' : 'text-slate-900'
                        )}
                      >
                        {item.label}
                      </p>
                      {item.critical && !item.done && (
                        <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] h-4 px-1.5 font-semibold">
                          CRITICO
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{item.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Financiamiento tracker ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Building2 className="h-4 w-4" />
              </div>
              Rutas de financiamiento
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Click en el estado para cambiar (no-iniciado &rarr; en-preparacion &rarr; postulado
              &rarr; en-comite &rarr; aprobado &rarr; rechazado).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2.5 pl-4 sm:pl-0 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Programa
                    </th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      Etapa
                    </th>
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      Requisito clave
                    </th>
                    <th className="text-left py-2.5 pr-4 sm:pr-0 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {financing.map((route) => (
                    <tr
                      key={route.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 pl-4 sm:pl-0 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1',
                              route.dilutivo
                                ? 'bg-amber-50 text-amber-600 ring-amber-100'
                                : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
                            )}
                          >
                            {route.dilutivo ? (
                              <Briefcase className="h-3.5 w-3.5" />
                            ) : (
                              <Award className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{route.nombre}</p>
                            <p className="text-[10px] text-slate-500 md:hidden">{route.etapa}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-xs font-mono text-slate-800 font-semibold">
                          {route.montoCLP}
                        </p>
                        <p className="text-[10px] text-slate-500">{route.montoUSD}</p>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600 hidden md:table-cell">
                        {route.etapa}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600 hidden lg:table-cell">
                        {route.requisito}
                      </td>
                      <td className="py-3 pr-4 sm:pr-0">
                        <button
                          onClick={() => cycleFinancingStatus(route.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all',
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

        {/* ── Salud operacional ── */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                <Activity className="h-4 w-4" />
              </div>
              Salud operacional (DD tecnico)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  DB latency
                </p>
                <p
                  className={cn(
                    'text-lg font-bold font-mono mt-1',
                    (health?.dbLatency ?? 0) < 500 ? 'text-emerald-600' : 'text-amber-600'
                  )}
                >
                  {health?.dbLatency ?? '...'}ms
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Target &lt; 500ms</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  Errores criticos
                </p>
                <p
                  className={cn(
                    'text-lg font-bold font-mono mt-1',
                    (health?.criticalErrors ?? 0) === 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {health?.criticalErrors ?? 0}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Sin resolver</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  Vets aprobados
                </p>
                <p className="text-lg font-bold font-mono text-brand-700 mt-1">
                  {health?.approvedProviders ?? 0}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">En directorio publico</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  Resenas totales
                </p>
                <p className="text-lg font-bold font-mono text-amber-700 mt-1">
                  {health?.reviewsCount ?? 0}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Social proof</p>
              </div>
            </div>
            {(health?.criticalErrors ?? 0) > 0 && (
              <div className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-200 bg-rose-50">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700 flex-1">
                  Hay errores criticos sin resolver. Resolverlos antes de exponer acceso a DD
                  externo.
                </p>
                <Link
                  to="/admin?section=system&sub=errors"
                  className="text-sm text-rose-700 font-semibold underline hover:text-rose-800 shrink-0"
                >
                  Ver errores &rarr;
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Footer ── */}
        <Card className="bg-gradient-to-br from-brand-50 to-white border-brand-200 shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-brand-100 text-brand-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">Proxima revision del plan: mes 1</p>
              <p className="mt-1 text-slate-600">
                Si O1 (reactivar Premium) y O2 (20 B2B pagas) no avanzan, ajustar metas antes de
                postular. Ver{' '}
                <code className="text-brand-700 bg-white px-1.5 py-0.5 rounded border border-brand-100 font-mono text-xs">
                  project_vc_plan_2026_04_18.md
                </code>{' '}
                en memoria para contexto completo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
