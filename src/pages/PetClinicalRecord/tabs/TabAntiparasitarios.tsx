import { useMemo } from 'react';
import { Bug, CheckCircle, AlertTriangle, Clock, Plus, Shield } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { formatDate } from '../helpers';
import { EmptyState } from '@/components/ui/EmptyState';

/** Antiparasitic type labels */
const ANTIPARASITIC_TYPE_LABELS: Record<string, string> = {
  interno: 'Interno',
  externo: 'Externo',
  ambos: 'Ambos',
};

/** Color classes per type */
function getTypeColor(type: string | null): string {
  switch (type) {
    case 'interno':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'externo':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'ambos':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

interface AntiparasiticRow {
  id: string;
  date: string;
  title: string;
  antiparasiticType: string | null;
  productBrand: string | null;
  batch: string | null;
  serial: string | null;
  nextDate: string | null;
  vetName: string | null;
  clinicName: string | null;
  recordType: string;
}

export function TabAntiparasitarios({ petId }: { petId: string }) {
  const { records, isLoading } = useMedicalRecords(petId);

  const antiparasitics = useMemo<AntiparasiticRow[]>(() => {
    return (records ?? [])
      .filter(
        (r) =>
          r.record_type === 'antiparasitario' ||
          r.record_type === 'desparasitacion' ||
          r.record_type === 'antipulgas'
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((r) => ({
        id: r.id,
        date: r.date,
        title: r.title,
        antiparasiticType:
          r.antiparasitic_type ??
          (r.record_type === 'antipulgas'
            ? 'externo'
            : r.record_type === 'desparasitacion'
              ? 'interno'
              : null),
        productBrand: r.product_brand ?? null,
        batch: r.batch_number ?? null,
        serial: r.serial_number ?? null,
        nextDate: r.next_date ?? null,
        vetName: r.veterinarian_name ?? null,
        clinicName: r.clinic_name ?? null,
        recordType: r.record_type,
      }));
  }, [records]);

  // Status: overdue if any has a next_date in the past
  const hasOverdue = antiparasitics.some((a) => a.nextDate && new Date(a.nextDate) < new Date());
  const hasUpcoming = antiparasitics.some((a) => a.nextDate && new Date(a.nextDate) >= new Date());

  // Split by type
  const internos = antiparasitics.filter((a) => a.antiparasiticType === 'interno');
  const externos = antiparasitics.filter((a) => a.antiparasiticType === 'externo');
  const ambos = antiparasitics.filter((a) => a.antiparasiticType === 'ambos');
  const sinTipo = antiparasitics.filter((a) => !a.antiparasiticType);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (antiparasitics.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon={Bug}
        title="Sin antiparasitarios registrados"
        description="Los tratamientos antiparasitarios (internos y externos) aparecerán aquí con su producto, frecuencia y recordatorios."
        action={
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Plus className="h-4 w-4" />
            Registrar antiparasitario
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {hasOverdue ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Antiparasitarios pendientes
          </Badge>
        ) : hasUpcoming ? (
          <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3" />
            Proxima aplicacion programada
          </Badge>
        ) : (
          <Badge className="gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Al dia
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {antiparasitics.length} registro{antiparasitics.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Frequency reminder info */}
      <Card className="border-green-100 bg-green-50/30">
        <CardContent className="p-3">
          <p className="text-xs text-green-700 font-medium mb-1">Frecuencias recomendadas</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-green-600">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>
                <strong>Interno:</strong> cada 3 meses
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>
                <strong>Externo:</strong> cada 1 mes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>
                <strong>Bravecto:</strong> cada 3 meses
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table grouped by type */}
      {[
        { label: 'Internos', items: internos, type: 'interno' },
        { label: 'Externos', items: externos, type: 'externo' },
        { label: 'Ambos (interno + externo)', items: ambos, type: 'ambos' },
        { label: 'Sin tipo especificado', items: sinTipo, type: null },
      ]
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <Card key={group.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bug className="h-4 w-4 text-green-600" />
                {group.label}
                <Badge variant="outline" className={`text-xs ml-auto ${getTypeColor(group.type)}`}>
                  {group.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                        Fecha
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                        Producto
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                        Marca
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                        Lote
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">
                        Veterinario
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                        Proxima
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((a, i) => {
                      const isOverdue = a.nextDate && new Date(a.nextDate) < new Date();
                      return (
                        <tr
                          key={a.id}
                          className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}
                        >
                          <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(a.date)}</td>
                          <td className="px-4 py-2.5 font-medium">{a.title}</td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                            {a.productBrand || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                            {a.batch || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                            {a.vetName ? `Dr. ${a.vetName}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {a.nextDate ? (
                              <span
                                className={
                                  isOverdue ? 'text-red-600 font-medium' : 'text-amber-600'
                                }
                              >
                                {formatDate(a.nextDate)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
