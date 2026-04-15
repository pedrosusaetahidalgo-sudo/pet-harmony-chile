import { useMemo } from 'react';
import { Syringe, CheckCircle, AlertTriangle, Clock, Plus } from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { formatDate } from '../helpers';
import { EmptyState } from '../shared';

/** Extract batch/serial: prefer DB columns, fallback to notes parsing (legacy) */
function extractBatchSerial(r: {
  batch_number?: string | null;
  serial_number?: string | null;
  notes?: string | null;
}): { batch: string | null; serial: string | null } {
  if (r.batch_number || r.serial_number) {
    return { batch: r.batch_number ?? null, serial: r.serial_number ?? null };
  }
  if (!r.notes) return { batch: null, serial: null };
  const batchMatch = r.notes.match(/Lote:\s*([^|\n]+)/i);
  const serialMatch = r.notes.match(/Serie:\s*([^|\n]+)/i);
  return {
    batch: batchMatch ? batchMatch[1].trim() : null,
    serial: serialMatch ? serialMatch[1].trim() : null,
  };
}

interface VaccineRow {
  id: string;
  date: string;
  title: string;
  vetName: string | null;
  clinicName: string | null;
  batch: string | null;
  serial: string | null;
  nextDate: string | null;
}

export function TabVacunas({ petId }: { petId: string }) {
  const { records, isLoading } = useMedicalRecords(petId);

  const vaccines = useMemo<VaccineRow[]>(() => {
    return (records ?? [])
      .filter((r) => r.record_type === 'vacuna')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((r) => {
        const { batch, serial } = extractBatchSerial(r);
        return {
          id: r.id,
          date: r.date,
          title: r.title,
          vetName: r.veterinarian_name ?? null,
          clinicName: r.clinic_name ?? null,
          batch,
          serial,
          nextDate: r.next_date ?? null,
        };
      });
  }, [records]);

  // Determine status: if any vaccine has a next_date in the past, it's overdue
  const hasOverdue = vaccines.some((v) => v.nextDate && new Date(v.nextDate) < new Date());
  const hasUpcoming = vaccines.some((v) => v.nextDate && new Date(v.nextDate) >= new Date());

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (vaccines.length === 0) {
    return (
      <EmptyState
        icon={Syringe}
        title="Sin vacunas registradas"
        description="Las vacunas que registres aparecerán aquí con su fecha, lote, serie y veterinario."
        action={
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Plus className="h-4 w-4" />
            Registrar vacuna
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        {hasOverdue ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Vacunas pendientes
          </Badge>
        ) : hasUpcoming ? (
          <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
            <Clock className="h-3 w-3" />
            Proxima vacuna programada
          </Badge>
        ) : (
          <Badge className="gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Al dia
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {vaccines.length} vacuna{vaccines.length !== 1 ? 's' : ''} registrada
          {vaccines.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Vaccine table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Syringe className="h-4 w-4 text-purple-600" />
            Historial de vacunas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Vacuna</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                    Lote
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                    Serie
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">
                    Veterinario
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">
                    Clinica
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Proxima</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((v, i) => {
                  const isOverdue = v.nextDate && new Date(v.nextDate) < new Date();
                  return (
                    <tr
                      key={v.id}
                      className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(v.date)}</td>
                      <td className="px-4 py-2.5 font-medium">{v.title}</td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                        {v.batch || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                        {v.serial || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                        {v.vetName ? `Dr. ${v.vetName}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                        {v.clinicName || '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {v.nextDate ? (
                          <span
                            className={isOverdue ? 'text-red-600 font-medium' : 'text-amber-600'}
                          >
                            {formatDate(v.nextDate)}
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
    </div>
  );
}
