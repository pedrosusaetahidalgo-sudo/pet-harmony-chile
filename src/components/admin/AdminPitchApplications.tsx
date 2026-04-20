/**
 * Admin > Aplicaciones pitch: revision de postulaciones que llegan desde
 * /aplicar?tipo=<kind>. Permite aprobar (auto-crea entidad publica cuando
 * corresponde), rechazar, marcar como contactado, o agregar notas.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Mail,
  Phone,
  ExternalLink,
  Eye,
  MessageSquare,
} from 'lucide-react';

type Kind =
  | 'corfo'
  | 'startup_chile'
  | 'paw_companys'
  | 'angels_vc'
  | 'refugio'
  | 'paw_partners'
  | 'vet'
  | 'paw_voices'
  | 'otro';

type Status = 'submitted' | 'in_review' | 'approved' | 'rejected' | 'contacted';

interface PitchApp {
  id: string;
  kind: Kind;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  organization_name: string | null;
  website: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  source_url: string | null;
  status: Status;
  admin_notes: string | null;
  reviewed_at: string | null;
  approved_entity_id: string | null;
  approved_entity_table: string | null;
  created_at: string;
}

const KIND_LABELS: Record<Kind, string> = {
  corfo: 'CORFO',
  startup_chile: 'Start-Up Chile',
  paw_companys: 'Paw Company',
  angels_vc: 'Angels/VC',
  refugio: 'Refugio',
  paw_partners: 'Paw Partner',
  vet: 'Veterinario',
  paw_voices: 'Paw Voice',
  otro: 'Otro',
};

const STATUS_COLOR: Record<Status, string> = {
  submitted: 'border-blue-300 text-blue-700 bg-blue-50',
  in_review: 'border-amber-300 text-amber-700 bg-amber-50',
  approved: 'border-green-300 text-green-700 bg-green-50',
  rejected: 'border-red-300 text-red-700 bg-red-50',
  contacted: 'border-purple-300 text-purple-700 bg-purple-50',
};

export default function AdminPitchApplications() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [kindFilter, setKindFilter] = useState<'all' | Kind>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<PitchApp | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const { data: applications, isLoading } = useQuery<PitchApp[]>({
    queryKey: ['admin-pitch-applications', statusFilter, kindFilter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from('pitch_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (kindFilter !== 'all') q = q.eq('kind', kindFilter);
      const { data } = await q;
      return (data as PitchApp[]) || [];
    },
  });

  const filtered =
    applications?.filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        a.contact_name.toLowerCase().includes(q) ||
        a.contact_email.toLowerCase().includes(q) ||
        (a.organization_name || '').toLowerCase().includes(q) ||
        (a.message || '').toLowerCase().includes(q)
      );
    }) || [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-pitch-applications'] });
    await queryClient.invalidateQueries({ queryKey: ['public-partners'] });
    await queryClient.invalidateQueries({ queryKey: ['paw-companys-grid'] });
    await queryClient.invalidateQueries({ queryKey: ['paw-voices-wall'] });
  };

  const approve = async (app: PitchApp, notes: string) => {
    setBusyId(app.id);
    try {
      const { data, error } = await supabase.rpc('approve_pitch_application', {
        p_application_id: app.id,
        p_notes: notes || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; entity_table?: string };
      if (!result.success) {
        toast.error(
          result.error === 'duplicate_entity'
            ? 'Conflicto: entidad duplicada'
            : 'No se pudo aprobar'
        );
      } else {
        toast.success(
          result.entity_table
            ? `Aprobado · creado en ${result.entity_table}`
            : 'Aprobado (sin entidad publica, es lead interno)'
        );
      }
      await refresh();
      setDetailApp(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al aprobar');
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (app: PitchApp, newStatus: Status, notes?: string) => {
    setBusyId(app.id);
    try {
      const { error } = await supabase
        .from('pitch_applications')
        .update({
          status: newStatus,
          admin_notes: notes ?? app.admin_notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', app.id);
      if (error) throw error;
      toast.success(`Estado: ${newStatus}`);
      await refresh();
      setDetailApp(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    total: applications?.length || 0,
    submitted: applications?.filter((a) => a.status === 'submitted').length || 0,
    in_review: applications?.filter((a) => a.status === 'in_review').length || 0,
    approved: applications?.filter((a) => a.status === 'approved').length || 0,
  };

  const openDetail = (app: PitchApp) => {
    setDetailApp(app);
    setNotesDraft(app.admin_notes || '');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Por revisar" value={counts.submitted} />
        <StatCard label="En proceso" value={counts.in_review} />
        <StatCard label="Aprobadas" value={counts.approved} />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, email, organizacion, mensaje..."
            className="pl-9"
          />
        </div>
        <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as 'all' | Kind)}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | Status)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="submitted">Por revisar</TabsTrigger>
          <TabsTrigger value="in_review">En proceso</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="contacted">Contactadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay postulaciones con esos filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => (
            <AppRow
              key={app.id}
              app={app}
              busy={busyId === app.id}
              onOpen={() => openDetail(app)}
            />
          ))}
        </div>
      )}

      {/* Detalle modal */}
      <Dialog open={!!detailApp} onOpenChange={(o) => !o && setDetailApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailApp ? KIND_LABELS[detailApp.kind] : ''}</DialogTitle>
          </DialogHeader>
          {detailApp && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{detailApp.contact_name}</h3>
                {detailApp.organization_name && (
                  <p className="text-sm text-muted-foreground">{detailApp.organization_name}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-sm">
                  <a
                    href={`mailto:${detailApp.contact_email}`}
                    className="flex items-center gap-1 text-purple-700 hover:underline"
                  >
                    <Mail className="h-4 w-4" /> {detailApp.contact_email}
                  </a>
                  {detailApp.contact_phone && (
                    <a
                      href={`tel:${detailApp.contact_phone}`}
                      className="flex items-center gap-1 text-purple-700 hover:underline"
                    >
                      <Phone className="h-4 w-4" /> {detailApp.contact_phone}
                    </a>
                  )}
                  {detailApp.website && (
                    <a
                      href={detailApp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-700 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> Web
                    </a>
                  )}
                </div>
              </div>

              {detailApp.message && (
                <div className="rounded-lg bg-purple-50 border-l-4 border-purple-600 p-3">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                    Mensaje
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{detailApp.message}</p>
                </div>
              )}

              {detailApp.payload && Object.keys(detailApp.payload).length > 0 && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Datos adicionales
                  </p>
                  <dl className="space-y-1 text-sm">
                    {Object.entries(detailApp.payload).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="text-muted-foreground capitalize min-w-[120px]">{k}:</dt>
                        <dd className="font-medium">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {detailApp.approved_entity_id && (
                <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Creado en{' '}
                  {detailApp.approved_entity_table}
                </Badge>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-notes"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Notas internas
                </label>
                <Textarea
                  id="admin-notes"
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Contexto para el equipo..."
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {detailApp.status !== 'approved' && (
                  <Button
                    onClick={() => approve(detailApp, notesDraft)}
                    disabled={busyId === detailApp.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setStatus(detailApp, 'contacted', notesDraft)}
                  disabled={busyId === detailApp.id}
                >
                  <MessageSquare className="h-4 w-4 mr-1" /> Marcar contactado
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStatus(detailApp, 'in_review', notesDraft)}
                  disabled={busyId === detailApp.id}
                >
                  En proceso
                </Button>
                {detailApp.status !== 'rejected' && (
                  <Button
                    variant="outline"
                    onClick={() => setStatus(detailApp, 'rejected', notesDraft)}
                    disabled={busyId === detailApp.id}
                    className="text-red-700 border-red-300"
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                )}
                {busyId === detailApp.id && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function AppRow({ app, busy, onOpen }: { app: PitchApp; busy: boolean; onOpen: () => void }) {
  return (
    <Card className="hover:border-purple-300 transition cursor-pointer" onClick={onOpen}>
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm">{app.contact_name}</h3>
              <Badge variant="outline" className="text-[10px]">
                {KIND_LABELS[app.kind]}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[app.status]}`}>
                {app.status}
              </Badge>
              {app.approved_entity_id && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-green-300 text-green-700 bg-green-50"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> publicado
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
              <span>{app.contact_email}</span>
              {app.organization_name && <span>· {app.organization_name}</span>}
              <span>· {new Date(app.created_at).toLocaleDateString('es-CL')}</span>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
