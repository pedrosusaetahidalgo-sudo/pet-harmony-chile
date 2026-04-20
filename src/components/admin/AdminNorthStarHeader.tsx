/**
 * AdminNorthStarHeader — Widget principal del admin Dashboard.
 *
 * Muestra el North Star Metric del Plan 90 Días (fichas clinicas
 * descargadas o compartidas por dueno activo 30d) + 5 KPIs top + captura
 * timestamp. Usa el RPC `rpc_north_star_snapshot` (migracion
 * 20260627000000) que valida admin internamente.
 *
 * Origen: INIT-03 del Plan de Exito 90 dias.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Users, Briefcase, DollarSign, Heart, Sparkles } from '@/lib/icons';
import { formatCLPCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

interface NorthStarSnapshot {
  nsm_30d: number | null;
  mau_owners_30d: number | null;
  vets_paying_total: number | null;
  mrr_b2b_clp: number | null;
  donations_30d_clp: number | null;
  paw_members: number | null;
  captured_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function AdminNorthStarHeader() {
  const { data, isLoading, error } = useQuery<NorthStarSnapshot | null>({
    queryKey: ['admin-north-star-snapshot'],
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_north_star_snapshot');
      if (error) {
        console.warn('[AdminNorthStarHeader] RPC error', error);
        return null;
      }
      // RPC RETURNS TABLE devuelve array de 1 fila
      return (data?.[0] ?? null) as NorthStarSnapshot | null;
    },
  });

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6">
        <Skeleton className="h-7 w-48 bg-slate-800 mb-3" />
        <Skeleton className="h-16 w-32 bg-slate-800 mb-2" />
        <Skeleton className="h-4 w-64 bg-slate-800" />
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 bg-slate-800" />
          ))}
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
        <p className="font-medium mb-1">North Star: sin acceso</p>
        <p className="text-xs text-amber-300/70">
          El RPC <code>rpc_north_star_snapshot</code> no esta disponible o no tienes permisos admin.
          Verifica que la migracion <code>20260627000000_north_star_kpi_rpcs.sql</code>
          este aplicada en Supabase.
        </p>
      </Card>
    );
  }

  const nsm = data.nsm_30d ?? 0;
  const mini = [
    {
      label: 'MAU owners',
      value: String(data.mau_owners_30d ?? 0),
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Vets pagando',
      value: String(data.vets_paying_total ?? 0),
      icon: Briefcase,
      color: 'text-emerald-400',
    },
    {
      label: 'MRR B2B',
      value: formatCLPCompact(data.mrr_b2b_clp ?? 0),
      icon: DollarSign,
      color: 'text-indigo-400',
    },
    {
      label: 'Donaciones 30d',
      value: formatCLPCompact(data.donations_30d_clp ?? 0),
      icon: Heart,
      color: 'text-pink-400',
    },
    {
      label: 'Paw Members',
      value: String(data.paw_members ?? 0),
      icon: Sparkles,
      color: 'text-amber-400',
    },
  ];

  const captured = new Date(data.captured_at);

  return (
    <Card className="relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6">
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-indigo-300/80 font-semibold">
              <Target className="h-3.5 w-3.5" />
              North Star · Plan 90d
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Fichas PDF / compartidas por dueno activo (30d)
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Snapshot</p>
            <p className="text-[10px] text-slate-400 font-mono">
              {captured.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Numero grande */}
        <div className="flex items-end gap-3 mb-2">
          <span className="font-mono text-6xl md:text-7xl font-black text-white leading-none">
            {nsm}
          </span>
          <span className="text-sm text-slate-400 pb-2">dueños activos</span>
        </div>

        <p className="text-xs text-slate-400 max-w-xl">
          Proxy conservador: owners con share token abierto O con medical_record nuevo en ultimos
          30d. Cuando PostHog tenga el evento{' '}
          <code className="text-indigo-300">clinical_pdf_downloaded</code> consolidado, este widget
          puede sumar ambas fuentes.
        </p>

        {/* 5 KPIs mini */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
          {mini.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 backdrop-blur"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={cn('h-3.5 w-3.5', m.color)} />
                <span className="text-[10px] uppercase tracking-wider text-slate-400">
                  {m.label}
                </span>
              </div>
              <p className="font-mono text-lg font-bold text-white leading-tight">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
