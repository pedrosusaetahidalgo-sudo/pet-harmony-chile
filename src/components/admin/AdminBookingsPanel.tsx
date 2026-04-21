import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { useCancelBooking } from '@/hooks/useBookingMutations';
import { formatCLP } from '@/lib/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Search,
  TrendingUp,
  Users,
  XCircle,
  AlertTriangle,
  CheckCircle,
} from '@/lib/icons';
import type { BookingStatus } from '@/lib/bookingStateMachine';

interface BookingRow {
  id: string;
  owner_id: string;
  service_provider_id: string | null;
  pet_id: string;
  scheduled_date: string;
  start_time: string | null;
  service_type: string;
  status: BookingStatus;
  total_price: number | null;
  is_emergency: boolean;
  created_at: string;
  // Joins
  owner_name?: string;
  provider_name?: string;
  pet_name?: string;
}

export default function AdminBookingsPanel() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Fetch all vet_bookings with joins
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('vet_bookings')
        .select(
          `
          *,
          owner:profiles!owner_id(display_name),
          provider:service_providers!service_provider_id(display_name),
          pet:pets!pet_id(name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(200);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(
        (row): BookingRow => ({
          id: row.id,
          owner_id: row.owner_id,
          service_provider_id: row.service_provider_id,
          pet_id: row.pet_id,
          scheduled_date: row.scheduled_date,
          start_time: row.start_time ?? null,
          service_type: row.service_type,
          status: row.status as BookingStatus,
          total_price: row.total_price,
          is_emergency: row.is_emergency ?? false,
          created_at: row.created_at,
          owner_name: row.owner?.display_name ?? '?',
          provider_name: row.provider?.display_name ?? '?',
          pet_name: row.pet?.name ?? '?',
        })
      );
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-booking-stats'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [total, confirmed, cancelled, noShow, completed] = await Promise.all([
        supabase
          .from('vet_bookings')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('vet_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'confirmado')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('vet_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'cancelado')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('vet_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'no_show')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('vet_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completado')
          .gte('created_at', thirtyDaysAgo),
      ]);

      const t = total.count ?? 0;
      return {
        total: t,
        confirmed: confirmed.count ?? 0,
        cancelled: cancelled.count ?? 0,
        noShow: noShow.count ?? 0,
        completed: completed.count ?? 0,
        cancelRate: t > 0 ? Math.round(((cancelled.count ?? 0) / t) * 100) : 0,
        noShowRate: t > 0 ? Math.round(((noShow.count ?? 0) / t) * 100) : 0,
        fillRate: t > 0 ? Math.round(((completed.count ?? 0) / t) * 100) : 0,
      };
    },
    staleTime: 60_000,
  });

  // CC-34 (Booking V3 Fase 5): Top 5 providers por bookings últimos 30d.
  // Requerido por el master plan §26.4 "dashboard admin recomendado".
  const { data: topProviders } = useQuery({
    queryKey: ['admin-top-providers-30d'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('vet_bookings')
        .select('service_provider_id')
        .gte('created_at', thirtyDaysAgo)
        .not('service_provider_id', 'is', null);

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const id = (row as { service_provider_id: string | null }).service_provider_id;
        if (!id) continue;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      const top = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (top.length === 0) return [];

      const ids = top.map(([id]) => id);
      const { data: providers } = await supabase
        .from('service_providers')
        .select('id, display_name, slug, commune')
        .in('id', ids);

      const byId = new Map(
        (providers ?? []).map((p) => [
          p.id,
          {
            name: (p as { display_name?: string | null }).display_name ?? 'Sin nombre',
            slug: (p as { slug?: string | null }).slug ?? null,
            commune: (p as { commune?: string | null }).commune ?? null,
          },
        ])
      );

      return top.map(([id, count]) => ({
        id,
        count,
        ...(byId.get(id) ?? { name: 'Desconocido', slug: null, commune: null }),
      }));
    },
    staleTime: 120_000,
  });

  const cancelBooking = useCancelBooking();

  const filtered = (bookings ?? []).filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.owner_name?.toLowerCase().includes(q) ||
      b.provider_name?.toLowerCase().includes(q) ||
      b.pet_name?.toLowerCase().includes(q) ||
      b.id.includes(q)
    );
  });

  const STATUS_FILTERS = [
    { value: 'all', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'confirmado', label: 'Confirmadas' },
    { value: 'en_curso', label: 'En curso' },
    { value: 'completado', label: 'Completadas' },
    { value: 'cancelado', label: 'Canceladas' },
    { value: 'no_show', label: 'No-show' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Total (30d)</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{stats?.total ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Fill rate</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats?.fillRate ?? '-'}%</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-slate-400">Cancel rate</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats?.cancelRate ?? '-'}%</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-slate-400">No-show rate</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats?.noShowRate ?? '-'}%</p>
          </CardContent>
        </Card>
      </div>

      {/* CC-34: Top 5 providers (últimos 30d) */}
      {topProviders && topProviders.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
              Top proveedores (30d)
            </p>
            <div className="space-y-1.5">
              {topProviders.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 text-sm text-slate-200 border-b border-slate-800 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="text-slate-500 w-5 text-xs">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    {p.commune && (
                      <p className="text-[11px] text-slate-500 truncate">{p.commune}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{p.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nombre, mascota, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-100"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? 'default' : 'outline'}
              size="sm"
              className={
                statusFilter === f.value ? '' : 'bg-slate-900 border-slate-700 text-slate-300'
              }
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900">
              <tr className="text-slate-400 text-xs">
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Dueno</th>
                <th className="text-left p-3">Mascota</th>
                <th className="text-left p-3">Profesional</th>
                <th className="text-left p-3">Servicio</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Precio</th>
                <th className="text-right p-3">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/50">
                  <td className="p-3 whitespace-nowrap">
                    <div className="text-slate-200 text-xs">
                      {format(new Date(b.scheduled_date), 'dd/MM/yy', { locale: es })}
                    </div>
                    {b.start_time && (
                      <div className="text-slate-500 text-[10px]">
                        {b.start_time.substring(0, 5)}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-slate-200 truncate max-w-[120px]">{b.owner_name}</td>
                  <td className="p-3 text-slate-200 truncate max-w-[100px]">{b.pet_name}</td>
                  <td className="p-3 text-slate-200 truncate max-w-[120px]">{b.provider_name}</td>
                  <td className="p-3 text-slate-300 text-xs">{b.service_type}</td>
                  <td className="p-3">
                    <BookingStatusBadge status={b.status} />
                    {b.is_emergency && (
                      <Badge variant="destructive" className="ml-1 text-[9px] px-1">
                        SOS
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-right text-slate-300 text-xs">
                    {b.total_price ? formatCLP(b.total_price) : '-'}
                  </td>
                  <td className="p-3 text-right">
                    {['pendiente', 'confirmado'].includes(b.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 text-xs"
                        onClick={() =>
                          cancelBooking.mutate({
                            bookingId: b.id,
                            bookingType: 'vet',
                            currentStatus: b.status,
                            reason: 'Cancelado por admin',
                          })
                        }
                      >
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Sin reservas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
