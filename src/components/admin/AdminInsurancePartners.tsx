/**
 * AdminInsurancePartners — gestion de aseguradoras + leads.
 *
 * Spec: Refactor Maestro Fase 2 §7.2.
 *
 * 2 secciones:
 *   1. Partners — toggle is_active de cada partner (sura/bci/mapfre + futuros).
 *   2. Leads recientes — lista con status + boton "marcar contactado" / "cerrar".
 *
 * Pricing model JSONB: editable solo via SQL (es complejo). Aqui solo el
 * toggle is_active y read-only del summary.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ExternalLink } from '@/lib/icons';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Partner {
  id: string;
  slug: string;
  display_name: string;
  contact_email: string;
  partner_url: string | null;
  is_active: boolean;
  display_order: number;
  notes: string | null;
}

interface LeadRow {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  message: string | null;
  status: string;
  partner_notified_at: string | null;
  created_at: string;
  insurance_partners: { display_name: string } | null;
  pets: { name: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  sent: 'bg-purple-50 text-purple-700 border-purple-200',
  partner_replied: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-red-50 text-red-700 border-red-200',
};

export function AdminInsurancePartners() {
  const qc = useQueryClient();

  const { data: partners, isLoading: partnersLoading } = useQuery({
    queryKey: ['admin-insurance-partners'],
    queryFn: async (): Promise<Partner[]> => {
      const { data, error } = await supabase
        .from('insurance_partners')
        .select(
          'id, slug, display_name, contact_email, partner_url, is_active, display_order, notes'
        )
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Partner[];
    },
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['admin-insurance-leads'],
    queryFn: async (): Promise<LeadRow[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('insurance_leads')
        .select(
          'id, contact_name, contact_email, contact_phone, message, status, partner_notified_at, created_at, insurance_partners(display_name), pets(name)'
        )
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return (data ?? []) as LeadRow[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (args: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from('insurance_partners')
        .update({ is_active: args.next, updated_at: new Date().toISOString() })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: (_, args) => {
      toast.success(args.next ? 'Partner activado' : 'Partner desactivado');
      qc.invalidateQueries({ queryKey: ['admin-insurance-partners'] });
    },
    onError: (err) =>
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'unknown',
      }),
  });

  const updateLeadStatus = useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('insurance_leads')
        .update({ status: args.status, updated_at: new Date().toISOString() })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status actualizado');
      qc.invalidateQueries({ queryKey: ['admin-insurance-leads'] });
    },
    onError: (err) =>
      toast.error('Error', { description: err instanceof Error ? err.message : 'unknown' }),
  });

  return (
    <div className="space-y-4">
      {/* Partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-purple-600" />
            Aseguradoras partners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {partnersLoading && <Skeleton className="h-24 w-full" />}
          {!partnersLoading && partners && partners.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay partners cargados.</p>
          )}
          {!partnersLoading &&
            partners?.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Switch
                  checked={p.is_active}
                  onCheckedChange={(v) => toggleActive.mutate({ id: p.id, next: v })}
                  disabled={toggleActive.isPending}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{p.display_name}</p>
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{p.slug}</code>
                    <Badge variant={p.is_active ? 'default' : 'outline'} className="text-[10px]">
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {p.contact_email}
                    {p.partner_url && (
                      <>
                        {' · '}
                        <a
                          href={p.partner_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          {p.partner_url.replace(/^https?:\/\//, '')}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </>
                    )}
                  </p>
                  {p.notes && <p className="text-[10px] text-amber-700 mt-1 italic">{p.notes}</p>}
                </div>
              </div>
            ))}
          <p className="text-[11px] text-muted-foreground pt-2 italic">
            Pricing model JSONB se edita via SQL. Aca solo activas/desactivas.
          </p>
        </CardContent>
      </Card>

      {/* Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads recientes (20 ultimos)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leadsLoading && <Skeleton className="h-24 w-full" />}
          {!leadsLoading && leads && leads.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay leads todavia. Aparecen cuando un dueno hace click en "Contactar partner".
            </p>
          )}
          {!leadsLoading &&
            leads?.map((l) => (
              <div key={l.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{l.contact_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {l.insurance_partners?.display_name ?? 'Partner desconocido'} ·{' '}
                      {l.pets?.name ?? 'pet'} · {l.contact_phone}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={STATUS_COLOR[l.status] ?? 'bg-muted text-muted-foreground'}
                  >
                    {l.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Recibido: {format(parseISO(l.created_at), "d 'de' MMM HH:mm", { locale: es })}
                  {l.partner_notified_at && (
                    <>
                      {' · '}Email enviado:{' '}
                      {format(parseISO(l.partner_notified_at), 'd MMM HH:mm', { locale: es })}
                    </>
                  )}
                </p>
                {l.message && <p className="text-xs italic bg-muted/30 p-2 rounded">{l.message}</p>}
                {l.status !== 'closed' && l.status !== 'lost' && (
                  <div className="flex gap-2 flex-wrap">
                    {l.status === 'sent' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateLeadStatus.mutate({ id: l.id, status: 'partner_replied' })
                        }
                        disabled={updateLeadStatus.isPending}
                      >
                        Partner respondio
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700"
                      onClick={() => updateLeadStatus.mutate({ id: l.id, status: 'closed' })}
                      disabled={updateLeadStatus.isPending}
                    >
                      Cerrar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700"
                      onClick={() => updateLeadStatus.mutate({ id: l.id, status: 'lost' })}
                      disabled={updateLeadStatus.isPending}
                    >
                      Perdido
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
