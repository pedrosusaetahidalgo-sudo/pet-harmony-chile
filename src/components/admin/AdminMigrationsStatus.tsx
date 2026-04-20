/**
 * AdminMigrationsStatus — visibilidad de migraciones aplicadas en prod.
 *
 * Origen: Plan 90d — antes de aplicar una migración nueva, el admin debe
 * poder confirmar qué está aplicado. Usa RPC rpc_applied_migrations.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, CheckCircle2, AlertCircle } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Migration {
  version: string;
  name: string;
  statements_count: number;
  inserted_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/** Formatea version YYYYMMDDHHMMSS a fecha legible */
function formatVersion(version: string): string {
  // Supabase guarda version como string tipo '20260703000001' o similar
  if (/^\d{14}$/.test(version)) {
    const y = version.slice(0, 4);
    const m = version.slice(4, 6);
    const d = version.slice(6, 8);
    const h = version.slice(8, 10);
    const mi = version.slice(10, 12);
    return `${y}-${m}-${d} ${h}:${mi}`;
  }
  return version;
}

export default function AdminMigrationsStatus() {
  const {
    data: migrations,
    isLoading,
    error,
  } = useQuery<Migration[]>({
    queryKey: ['admin-applied-migrations'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_applied_migrations');
      if (error) {
        console.warn('[AdminMigrationsStatus] RPC error', error);
        return [];
      }
      return (data || []) as Migration[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !migrations) {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 text-sm text-amber-900">
          No se pudo cargar lista de migraciones. Verifica que{' '}
          <code>20260705000000_backup_cron_and_migrations_view.sql</code> esté aplicada.
        </CardContent>
      </Card>
    );
  }

  if (migrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-600" />
            Migraciones aplicadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              No hay migraciones registradas en <code>supabase_migrations.schema_migrations</code>.
              Esto es normal si las migraciones se aplican manualmente via SQL Editor (no via
              Supabase CLI).
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mostRecent = migrations[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-600" />
              Migraciones aplicadas
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Últimas 100 migraciones en <code>supabase_migrations.schema_migrations</code>
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            {migrations.length} totales
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Highlight última */}
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
              Más reciente
            </span>
          </div>
          <p className="font-mono text-sm text-emerald-800 break-all">{mostRecent.name}</p>
          <p className="text-[11px] text-emerald-700 mt-1">
            {formatVersion(mostRecent.version)} ·{' '}
            {format(new Date(mostRecent.inserted_at), 'd MMM yyyy HH:mm', { locale: es })}
          </p>
        </div>

        {/* Lista scrollable */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                    Version
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
                    Name
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                    Stmts
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">
                    Aplicada
                  </th>
                </tr>
              </thead>
              <tbody>
                {migrations.map((m, i) => (
                  <tr
                    key={m.version}
                    className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                      {formatVersion(m.version)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-800 truncate max-w-[280px]">
                      {m.name}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                      {m.statements_count}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(m.inserted_at), 'd MMM HH:mm', { locale: es })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
