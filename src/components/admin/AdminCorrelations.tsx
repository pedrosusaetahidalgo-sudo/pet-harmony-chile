/**
 * AdminCorrelations — gestion de correlation_definitions (Refactor §2.9).
 *
 * Permite a Pedro:
 *   - Ver el catalogo completo (incluye draft/computing/archived)
 *   - Cambiar status de una correlacion (draft → computing → published)
 *   - Editar potential_buyers, estimated_price_usd, notes
 *   - Crear correlaciones nuevas (admin power-user)
 *
 * El RPC publico get_correlation_insights solo devuelve definitions con
 * status='published' Y observations con sample_size >= 50, asi que mover
 * status a published es la decision comercial: "esta correlacion ya tiene
 * volumen + consent suficiente para vendersela a un cliente B2B".
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TrendingUp, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type CorrelationStatus = 'draft' | 'computing' | 'published' | 'archived';

interface CorrelationRow {
  id: string;
  slug: string;
  question: string;
  hypothesis: string | null;
  category: string;
  input_dimensions: string[];
  output_metric: string;
  potential_buyers: string[] | null;
  estimated_price_usd: number | null;
  status: CorrelationStatus;
  created_at: string;
  notes: string | null;
}

const STATUS_BADGES: Record<CorrelationStatus, string> = {
  draft: 'bg-slate-200 text-slate-700',
  computing: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-red-100 text-red-700',
};

const CATEGORY_BADGES: Record<string, string> = {
  longevity: 'bg-purple-100 text-purple-800',
  nutrition: 'bg-orange-100 text-orange-800',
  health: 'bg-blue-100 text-blue-800',
  behavior: 'bg-pink-100 text-pink-800',
  spend: 'bg-emerald-100 text-emerald-800',
};

export default function AdminCorrelations() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<CorrelationStatus | 'all'>('all');
  const [editing, setEditing] = useState<CorrelationRow | null>(null);

  const { data: rows = [], isLoading } = useQuery<CorrelationRow[]>({
    queryKey: ['admin-correlations', statusFilter],
    staleTime: 30_000,
    queryFn: async () => {
      let query = sb
        .from('correlation_definitions')
        .select(
          'id, slug, question, hypothesis, category, input_dimensions, output_metric, potential_buyers, estimated_price_usd, status, created_at, notes'
        )
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) {
        console.warn('[AdminCorrelations] query error', error);
        return [];
      }
      return (data ?? []) as CorrelationRow[];
    },
  });

  const updateRow = useMutation({
    mutationFn: async (patch: Partial<CorrelationRow> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await sb.from('correlation_definitions').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Correlacion actualizada');
      queryClient.invalidateQueries({ queryKey: ['admin-correlations'] });
      setEditing(null);
    },
    onError: (err) => {
      toast.error(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Correlation Insights
          </h2>
          <p className="text-xs text-muted-foreground">
            Refactor Maestro §2.9 — el moat de data. Define correlaciones que valen plata para
            Pharma/Insurers. Status `published` requiere sample_size{'>'}=50 con consent=true en
            cada bucket.
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="computing">Computing</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No hay correlaciones {statusFilter === 'all' ? '' : `con status=${statusFilter}`}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm">{row.question}</p>
                    <Badge variant="outline" className={STATUS_BADGES[row.status]}>
                      {row.status}
                    </Badge>
                    <Badge variant="outline" className={CATEGORY_BADGES[row.category] ?? ''}>
                      {row.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground">{row.slug}</p>
                  {row.hypothesis && (
                    <p className="text-xs text-muted-foreground italic mt-1">H: {row.hypothesis}</p>
                  )}
                  <div className="flex gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>Inputs: {row.input_dimensions.join(', ')}</span>
                    <span>•</span>
                    <span>Output: {row.output_metric}</span>
                    {row.estimated_price_usd && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">
                          ~${row.estimated_price_usd.toLocaleString()} USD
                        </span>
                      </>
                    )}
                  </div>
                  {row.potential_buyers && row.potential_buyers.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {row.potential_buyers.map((b) => (
                        <Badge key={b} variant="outline" className="text-[10px] h-4 px-1.5">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {row.notes && (
                    <p className="text-[11px] italic text-muted-foreground mt-1 border-l-2 border-slate-200 pl-2">
                      {row.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(row)}
                  className="shrink-0"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog editar */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar correlacion</DialogTitle>
            <DialogDescription className="font-mono text-xs">{editing?.slug}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="corr-status">Status</Label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as CorrelationStatus })}
                >
                  <SelectTrigger id="corr-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="computing">Computing</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Solo `published` es visible al endpoint B2B.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="corr-price">Precio estimado USD</Label>
                <Input
                  id="corr-price"
                  type="number"
                  value={editing.estimated_price_usd ?? ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      estimated_price_usd: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="25000"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="corr-buyers">Potential buyers (separados por coma)</Label>
                <Input
                  id="corr-buyers"
                  value={(editing.potential_buyers ?? []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      potential_buyers: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Pharma, Insurance, Petfood"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="corr-notes">Notas internas</Label>
                <Textarea
                  id="corr-notes"
                  value={editing.notes ?? ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value || null })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                editing &&
                updateRow.mutate({
                  id: editing.id,
                  status: editing.status,
                  estimated_price_usd: editing.estimated_price_usd,
                  potential_buyers: editing.potential_buyers,
                  notes: editing.notes,
                })
              }
              disabled={updateRow.isPending || !editing}
            >
              {updateRow.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
