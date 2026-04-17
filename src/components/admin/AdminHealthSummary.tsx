import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { runAllQualityChecks } from '@/lib/auditExport';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Ghost,
  PawPrint,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Clock,
  Database,
} from '@/lib/icons';
import { Link } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type HealthRow = {
  label: string;
  count: number;
  threshold: number;
  icon: React.ElementType;
  href: string;
  hint: string;
};

/**
 * Resumen de salud del sistema — KPI cards con conteos en vivo de
 * cosas que requieren atencion del admin. Se carga al inicio del Dashboard.
 *
 * Cada card es un link directo a la seccion correspondiente. Si el conteo
 * supera el threshold se marca en rojo; si es 0 se marca en verde.
 */
export default function AdminHealthSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-health-summary'],
    queryFn: async (): Promise<HealthRow[]> => {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [ghostUsers, pendingPets, openErrors, unreadFeedback, pendingVerifs, pendingPartners] =
        await Promise.all([
          // Ghost users (creados por invite, nunca login)
          sb.rpc('admin_list_ghost_users').then(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (r: any) => r.data?.length ?? 0
          ),
          // Mascotas pendientes de reclamo
          sb
            .from('pets')
            .select('id', { count: 'exact', head: true })
            .is('owner_id', null)
            .not('created_by_vet_id', 'is', null)
            .is('owner_invitation_accepted_at', null)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r: any) => r.count ?? 0),
          // Errores no resueltos en últimas 24h
          sb
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .eq('resolved', false)
            .gte('created_at', since24h)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r: any) => r.count ?? 0),
          // Feedback sin responder en últimas 24h
          sb
            .from('feedback_in_app')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', since24h)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r: any) => r.count ?? 0),
          // Verificaciones pendientes
          sb
            .from('verification_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pendiente')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r: any) => r.count ?? 0),
          // Partners pendientes
          sb
            .from('partner_submissions')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pendiente')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((r: any) => r.count ?? 0)

            .catch(() => 0),
        ]);

      return [
        {
          label: 'Cuentas fantasma',
          count: ghostUsers as number,
          threshold: 5,
          icon: Ghost,
          href: '/admin?section=users&sub=ghost-users',
          hint: 'Cuentas creadas por invite sin login',
        },
        {
          label: 'Mascotas sin reclamar',
          count: pendingPets as number,
          threshold: 20,
          icon: PawPrint,
          href: '/admin?section=users&sub=pending-pets',
          hint: 'Pacientes vet esperando dueno',
        },
        {
          label: 'Errores 24h sin resolver',
          count: openErrors as number,
          threshold: 10,
          icon: AlertTriangle,
          href: '/admin?section=system&sub=errors',
          hint: 'Errores capturados por log-error',
        },
        {
          label: 'Feedback nuevo 24h',
          count: unreadFeedback as number,
          threshold: 0,
          icon: MessageSquare,
          href: '/admin?section=content&sub=feedback',
          hint: 'Mensajes de usuarios pendientes',
        },
        {
          label: 'Verificaciones pendientes',
          count: pendingVerifs as number,
          threshold: 5,
          icon: Clock,
          href: '/admin?section=users&sub=verifications',
          hint: 'Vets/proveedores esperando approval',
        },
        {
          label: 'Partners pendientes',
          count: pendingPartners as number,
          threshold: 5,
          icon: Clock,
          href: '/admin?section=commercial&sub=partners',
          hint: 'Solicitudes de partnership',
        },
      ];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Data quality — comparte cache con AdminDataQuality (5 min)
  const { data: dqChecks } = useQuery({
    queryKey: ['admin-data-quality'],
    queryFn: runAllQualityChecks,
    staleTime: 5 * 60 * 1000,
  });
  const dqIssues = (dqChecks ?? []).filter((c) => c.severity !== 'ok').length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  const dqRow: HealthRow = {
    label: 'Alertas calidad datos',
    count: dqIssues,
    threshold: 3,
    icon: Database,
    href: '/admin?section=system&sub=data-quality',
    hint: 'Checks de integridad + catalogos',
  };
  const rows = [...(data || []), dqRow];
  const critical = rows.filter((r) => r.count > r.threshold).length;
  const allGood = critical === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            {allGood ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            )}
            Salud del sistema
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {allGood
              ? 'Todo en orden — nada requiere accion inmediata'
              : `${critical} item${critical !== 1 ? 's' : ''} requieren atencion`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {rows.map((row) => {
          const Icon = row.icon;
          const isCritical = row.count > row.threshold;
          const isAttention = row.count > 0 && !isCritical;

          return (
            <Link key={row.label} to={row.href}>
              <Card
                className={`bg-slate-900 border transition-colors hover:border-slate-600 cursor-pointer ${
                  isCritical
                    ? 'border-red-500/40 hover:border-red-500/60'
                    : isAttention
                      ? 'border-amber-500/30 hover:border-amber-500/50'
                      : 'border-slate-800'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isCritical
                          ? 'text-red-400'
                          : isAttention
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}
                    />
                    {isCritical && (
                      <Badge
                        variant="outline"
                        className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px] h-4 px-1.5"
                      >
                        ALTO
                      </Badge>
                    )}
                  </div>
                  <p
                    className={`text-2xl font-bold leading-none ${
                      isCritical ? 'text-red-300' : isAttention ? 'text-amber-200' : 'text-white'
                    }`}
                  >
                    {row.count}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1.5 font-medium leading-tight">
                    {row.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                    {row.hint}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
