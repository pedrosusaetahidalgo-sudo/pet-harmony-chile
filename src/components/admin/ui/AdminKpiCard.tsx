import { type ElementType } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminKpiCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  description?: string;
  delta?: number;
  deltaLabel?: string;
  alert?: boolean;
  loading?: boolean;
  sparkData?: number[];
}

export default function AdminKpiCard({
  title,
  value,
  icon: Icon,
  description,
  delta,
  deltaLabel,
  alert = false,
  loading = false,
  sparkData,
}: AdminKpiCardProps) {
  if (loading) {
    return (
      <Card className={cn('relative overflow-hidden border-slate-800 bg-slate-900 p-4')}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-800" />
            <Skeleton className="h-8 w-20 bg-slate-800" />
            <Skeleton className="h-3 w-32 bg-slate-800" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg bg-slate-800" />
        </div>
        {sparkData && <Skeleton className="mt-3 h-6 w-full bg-slate-800" />}
      </Card>
    );
  }

  const deltaIsPositive = delta !== undefined && delta > 0;
  const deltaIsNegative = delta !== undefined && delta < 0;

  const chartData = sparkData?.map((v, i) => ({ i, v }));

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-slate-800 bg-slate-900 p-4 transition-colors',
        alert && 'border-orange-500/50 bg-orange-500/5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-white">{value}</p>

          {delta !== undefined && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {deltaIsPositive && <ArrowUp className="h-3 w-3 text-emerald-400" />}
              {deltaIsNegative && <ArrowDown className="h-3 w-3 text-red-400" />}
              <span
                className={cn(
                  'font-medium',
                  deltaIsPositive && 'text-emerald-400',
                  deltaIsNegative && 'text-red-400',
                  delta === 0 && 'text-slate-400'
                )}
              >
                {delta > 0 ? '+' : ''}
                {delta}%
              </span>
              {deltaLabel && <span className="text-slate-500">{deltaLabel}</span>}
            </div>
          )}

          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>

        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            alert ? 'bg-orange-500/10 text-orange-400' : 'bg-indigo-500/10 text-indigo-400'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {chartData && chartData.length > 1 && (
        <div className="mt-3 h-6 w-full">
          <ResponsiveContainer width="100%" height={24}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={alert ? '#f97316' : '#6366f1'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={alert ? '#f97316' : '#6366f1'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={alert ? '#f97316' : '#6366f1'}
                strokeWidth={1.5}
                fill="url(#sparkGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
