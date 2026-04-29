/**
 * AdminPartnerBilling — preview de facturas mensuales por partner B2B.
 *
 * Cuando entren los primeros partners pagadores, Pedro va a necesitar
 * calcular cuanto facturar a cada uno. Este panel:
 *   1. Selector de mes (default: mes anterior, asi se factura post-cierre)
 *   2. Tabla con N filas: una por partner activo
 *   3. Cada fila: line items detallados + subtotal + IVA + total
 *   4. Boton copy CSV / boton "Marcar como facturado" (futuro)
 *
 * RPC: compute_partner_invoices(p_year, p_month) (mig 20260923)
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Building2, Copy, Calendar } from '@/lib/icons';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface InvoicePreview {
  partner_kind: 'insurance' | 'retail' | 'b2b_api';
  partner_id: string;
  partner_name: string;
  partner_email: string;
  period_start: string;
  period_end: string;
  line_items: Record<string, unknown>;
  subtotal_clp: number;
  iva_clp: number;
  total_clp: number;
}

const KIND_LABELS: Record<string, { label: string; color: string }> = {
  insurance: { label: 'Aseguradora', color: 'bg-blue-100 text-blue-700' },
  retail: { label: 'Retail', color: 'bg-emerald-100 text-emerald-700' },
  b2b_api: { label: 'B2B API', color: 'bg-purple-100 text-purple-700' },
};

const fmtCLP = (n: number) => `$${n.toLocaleString('es-CL')}`;

function getDefaultPeriod() {
  const d = new Date();
  d.setDate(0); // ultimo dia del mes anterior
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function AdminPartnerBilling() {
  const defaults = getDefaultPeriod();
  const [year, setYear] = useState(defaults.year);
  const [month, setMonth] = useState(defaults.month);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['partner_invoices', year, month],
    queryFn: async () => {
      const { data, error } = await sb.rpc('compute_partner_invoices', {
        p_year: year,
        p_month: month,
      });
      if (error) throw error;
      return (data as InvoicePreview[]) || [];
    },
  });

  const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total_clp, 0) || 0;

  const handleCopyAll = () => {
    if (!invoices || invoices.length === 0) return;
    const rows = [
      ['Tipo', 'Partner', 'Email', 'Subtotal', 'IVA', 'Total CLP'].join(','),
      ...invoices.map((inv) =>
        [
          inv.partner_kind,
          `"${inv.partner_name}"`,
          inv.partner_email,
          inv.subtotal_clp,
          inv.iva_clp,
          inv.total_clp,
        ].join(',')
      ),
    ];
    navigator.clipboard.writeText(rows.join('\r\n'));
    toast.success('CSV copiado al clipboard');
  };

  const monthOptions = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const yearOptions = [year - 1, year, year + 1];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="size-5" />
          Facturacion partners
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Preview de facturas mensuales por partner. Insurance: $X CLP/lead. Retail: % de
          conversion. B2B API: fee mensual fijo por tier.
        </p>
      </div>

      {/* Period picker */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Mes
            </label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
              Año
            </label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {invoices && invoices.length > 0 && (
            <Button variant="outline" onClick={handleCopyAll} className="ml-auto">
              <Copy className="size-4 mr-2" />
              Copiar CSV
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary card */}
      {invoices && invoices.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs uppercase text-emerald-700 font-semibold">Partners</div>
                <div className="text-2xl font-bold mt-1">{invoices.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-emerald-700 font-semibold">Subtotal mes</div>
                <div className="text-2xl font-bold mt-1">
                  {fmtCLP(invoices.reduce((s, i) => s + i.subtotal_clp, 0))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-emerald-700 font-semibold">IVA 19%</div>
                <div className="text-2xl font-bold mt-1">
                  {fmtCLP(invoices.reduce((s, i) => s + i.iva_clp, 0))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-emerald-700 font-semibold">Total mes</div>
                <div className="text-2xl font-bold mt-1 text-emerald-900">
                  {fmtCLP(totalRevenue)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : !invoices || invoices.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="size-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Sin partners activos en este periodo</h3>
            <p className="text-sm text-muted-foreground">
              No hay partners con uso facturable en {monthOptions[month - 1]} {year}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const meta = KIND_LABELS[inv.partner_kind];
            return (
              <Card key={`${inv.partner_kind}-${inv.partner_id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={meta.color}>{meta.label}</Badge>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Building2 className="size-4" />
                          {inv.partner_name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{inv.partner_email}</p>

                      {/* Line items */}
                      <div className="text-sm space-y-1 bg-muted/30 p-3 rounded-lg">
                        {Object.entries(inv.line_items).map(([key, val]) => (
                          <div key={key} className="flex justify-between gap-4">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono">
                              {typeof val === 'number'
                                ? key.includes('clp')
                                  ? fmtCLP(val)
                                  : val.toLocaleString('es-CL')
                                : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right shrink-0 min-w-[140px]">
                      <div className="text-xs text-muted-foreground">Subtotal</div>
                      <div className="text-sm font-mono">{fmtCLP(inv.subtotal_clp)}</div>
                      <div className="text-xs text-muted-foreground mt-1">IVA 19%</div>
                      <div className="text-sm font-mono text-muted-foreground">
                        {fmtCLP(inv.iva_clp)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 border-t pt-1">Total</div>
                      <div className="text-lg font-bold text-emerald-700">
                        {fmtCLP(inv.total_clp)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">
        Esta es una preview. La factura legal real se emite manual desde SII (mientras no integremos
        OpenFactura/Toku). Los montos asumen modelos de comision default — ajustar{' '}
        <code>commission_config</code> JSONB en cada partner para reflejar contratos reales.
      </p>
    </div>
  );
}
