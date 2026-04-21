/**
 * Sala de Inversion — componentes reutilizables (LightTooltip, MetaRow,
 * KpiCard). Extraidos de AdminSalaInversion.tsx (E.1 auditoria top-tier
 * 2026-04-20).
 */
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { clampPct, formatNumber } from './helpers';

// ── Chart tooltip ────────────────────────────────────────────
export function LightTooltip({
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

// ── Meta row ─────────────────────────────────────────────────
export function MetaRow({
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

// ── KPI card (tema claro Paw Friend) ─────────────────────────
export function KpiCard({
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
