/**
 * AdminComunaGap — ranking comunas con gap demanda/oferta de vets.
 *
 * Origen: Plan 90d INIT-09 — priorizar outreach a vets en comunas donde
 * hay dueños pero pocos o cero vets visibles en el directorio.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, AlertTriangle, Users, Stethoscope } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface ComunaGap {
  comuna: string;
  owners_count: number;
  vets_count: number;
  gap_ratio: number;
  pets_count: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function priorityBadge(gap: ComunaGap): { label: string; bg: string; text: string } {
  if (gap.vets_count === 0 && gap.owners_count > 0) {
    return { label: 'Crítica', bg: 'bg-red-100', text: 'text-red-800' };
  }
  if (gap.gap_ratio >= 20) {
    return { label: 'Alta', bg: 'bg-orange-100', text: 'text-orange-800' };
  }
  if (gap.gap_ratio >= 10) {
    return { label: 'Media', bg: 'bg-amber-100', text: 'text-amber-800' };
  }
  return { label: 'OK', bg: 'bg-emerald-100', text: 'text-emerald-800' };
}

export default function AdminComunaGap() {
  const {
    data: gaps,
    isLoading,
    error,
  } = useQuery<ComunaGap[]>({
    queryKey: ['admin-comuna-gap'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_comuna_demand_supply');
      if (error) {
        console.warn('[AdminComunaGap] RPC error', error);
        return [];
      }
      return (data || []) as ComunaGap[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !gaps) {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 text-sm text-amber-900">
          No se pudo cargar. Verifica que <code>20260707010000_comuna_gap_rpc.sql</code> esté
          aplicada.
        </CardContent>
      </Card>
    );
  }

  if (gaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-600" />
            Gap demanda/oferta por comuna
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-6 text-center">
          Sin datos de comuna suficientes (profiles.comuna vacío o sin pets). Cuando haya más
          usuarios con comuna registrada, este panel se puebla automáticamente.
        </CardContent>
      </Card>
    );
  }

  const critical = gaps.filter((g) => g.vets_count === 0 && g.owners_count > 0);
  const high = gaps.filter((g) => g.gap_ratio >= 20 && g.vets_count > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              Gap demanda/oferta por comuna
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comunas con dueños activos y pocos o cero vets. Priorización outreach B2B.
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="flex flex-wrap gap-2 mt-3">
          {critical.length > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {critical.length} crítica{critical.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {high.length > 0 && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              {high.length} alta prioridad
            </Badge>
          )}
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            {gaps.length} comunas con data
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                    Comuna
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                    Dueños
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                    Pets
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                    Vets
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                    Ratio
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground text-xs">
                    Prioridad
                  </th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g, i) => {
                  const badge = priorityBadge(g);
                  return (
                    <tr
                      key={g.comuna}
                      className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                    >
                      <td className="px-3 py-2 font-medium text-slate-800 truncate max-w-[160px]">
                        {g.comuna}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3 text-blue-500" />
                          {g.owners_count}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                        {g.pets_count}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Stethoscope className="h-3 w-3 text-emerald-500" />
                          {g.vets_count}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {g.gap_ratio === 999 ? (
                          <span className="text-red-600 font-bold">∞</span>
                        ) : (
                          g.gap_ratio.toFixed(1)
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium',
                            badge.bg,
                            badge.text
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          <strong>Ratio</strong>: dueños/vets. ∞ = comuna con dueños pero cero vets visibles.
          Prioridad alta para outreach: abrir cobertura donde ya hay demanda.
        </p>
      </CardContent>
    </Card>
  );
}
