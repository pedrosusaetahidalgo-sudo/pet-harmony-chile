import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  VET_SERVICE_LABELS,
  VET_SERVICE_ORDER,
  type VetServiceType,
} from '@/hooks/useVetPriceEstimator';

interface Props {
  providerId: string | null | undefined;
}

interface PriceRow {
  service_type: VetServiceType;
  price_clp: string;
  notes: string;
}

/**
 * Editor de precios publicos del veterinario.
 * Lee/escribe en vet_service_prices con upsert por (provider_id, service_type).
 *
 * Cast a `any` mientras types.ts no incluya la tabla nueva.
 */
export default function MisPreciosEditor({ providerId }: Props) {
  const [rows, setRows] = useState<PriceRow[]>(
    VET_SERVICE_ORDER.map((s) => ({ service_type: s, price_clp: '', notes: '' }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!providerId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('vet_service_prices')
        .select('service_type, price_clp, notes')
        .eq('provider_id', providerId);
      if (cancel) return;
      if (error) {
        // Tabla aun no existe (migracion pendiente) — no rompemos
        setLoading(false);
        return;
      }
      setRows((prev) =>
        prev.map((r) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = (data ?? []).find((d: any) => d.service_type === r.service_type);
          if (!found) return r;
          return {
            service_type: r.service_type,
            price_clp: String(found.price_clp ?? ''),
            notes: found.notes ?? '',
          };
        })
      );
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [providerId]);

  if (!providerId) return null;

  const updateRow = (svc: VetServiceType, patch: Partial<PriceRow>) => {
    setRows((prev) => prev.map((r) => (r.service_type === svc ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toUpsert = rows
        .filter((r) => r.price_clp && Number(r.price_clp) > 0)
        .map((r) => ({
          provider_id: providerId,
          service_type: r.service_type,
          price_clp: Number(r.price_clp),
          notes: r.notes || null,
          is_estimate: false,
        }));

      const toDelete = rows
        .filter((r) => !r.price_clp || Number(r.price_clp) <= 0)
        .map((r) => r.service_type);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      if (toUpsert.length > 0) {
        const { error } = await sb
          .from('vet_service_prices')
          .upsert(toUpsert, { onConflict: 'provider_id,service_type' });
        if (error) throw error;
      }

      if (toDelete.length > 0) {
        const { error } = await sb
          .from('vet_service_prices')
          .delete()
          .eq('provider_id', providerId)
          .in('service_type', toDelete);
        if (error) throw error;
      }

      toast.success('Precios actualizados');
    } catch (e) {
      toast.error('No pudimos guardar tus precios. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">6. Mis precios públicos</CardTitle>
        <CardDescription>
          Publica tus precios por servicio. Aparecerán en el comparador público de Paw Friend
          para que los dueños puedan comparar antes de elegir. Deja en blanco los servicios que
          no quieras publicar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.service_type}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
              >
                <Label className="md:col-span-3 text-sm">{VET_SERVICE_LABELS[r.service_type]}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="CLP"
                  value={r.price_clp}
                  onChange={(e) => updateRow(r.service_type, { price_clp: e.target.value })}
                  className="md:col-span-3 h-11"
                />
                <Input
                  placeholder="Notas (opcional, ej: incluye examen)"
                  value={r.notes}
                  onChange={(e) => updateRow(r.service_type, { notes: e.target.value })}
                  className="md:col-span-6 h-11"
                />
              </div>
            ))}
            <Button onClick={handleSave} disabled={saving} className="mt-3">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Guardar precios
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
