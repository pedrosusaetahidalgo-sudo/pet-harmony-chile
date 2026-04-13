import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Inbox,
  ExternalLink,
} from '@/lib/icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type PartnerStatus = 'pendiente' | 'contactado' | 'aprobado' | 'rechazado';

interface PartnerSubmission {
  id: string;
  categoria: string;
  nombre_negocio: string;
  nombre_contacto: string;
  email: string;
  telefono: string | null;
  website: string | null;
  instagram: string | null;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  descripcion: string | null;
  servicios_ofrecidos: string[] | null;
  horario: string | null;
  status: string | null;
  notas_admin: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const STATUS_CONFIG: Record<
  PartnerStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: typeof Clock;
  }
> = {
  pendiente: { label: 'Pendiente', variant: 'outline', icon: Clock },
  contactado: { label: 'Contactado', variant: 'secondary', icon: MessageSquare },
  aprobado: { label: 'Aprobado', variant: 'default', icon: CheckCircle },
  rechazado: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
};

const CATEGORIA_LABELS: Record<string, string> = {
  veterinaria: 'Veterinaria',
  tienda: 'Tienda',
  peluqueria: 'Peluquería',
  paseador: 'Paseador',
  cuidador: 'Cuidador',
  entrenador: 'Entrenador',
  refugio: 'Refugio',
  seguro: 'Seguro',
  crematorio: 'Crematorio',
  transporte: 'Transporte',
  alimento: 'Alimentación',
  otro: 'Otro',
};

export default function AdminPartnerSubmissions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [selected, setSelected] = useState<PartnerSubmission | null>(null);
  const [notasEdit, setNotasEdit] = useState('');
  const [statusEdit, setStatusEdit] = useState<PartnerStatus>('pendiente');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-partner-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PartnerSubmission[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notas_admin,
    }: {
      id: string;
      status: PartnerStatus;
      notas_admin: string;
    }) => {
      const { error } = await supabase
        .from('partner_submissions')
        .update({ status, notas_admin })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-submissions'] });
      toast.success('Solicitud actualizada');
      setSelected(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    },
  });

  const filtered = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (catFilter !== 'all' && s.categoria !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.nombre_negocio.toLowerCase().includes(q) ||
        s.nombre_contacto.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.comuna?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const counts = {
    total: submissions.length,
    pendiente: submissions.filter((s) => s.status === 'pendiente').length,
    contactado: submissions.filter((s) => s.status === 'contactado').length,
    aprobado: submissions.filter((s) => s.status === 'aprobado').length,
  };

  const openDetail = (sub: PartnerSubmission) => {
    setSelected(sub);
    setNotasEdit(sub.notas_admin || '');
    setStatusEdit((sub.status as PartnerStatus) || 'pendiente');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Solicitudes de Partners ({counts.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Pendientes', count: counts.pendiente, color: 'text-amber-600 bg-amber-50' },
              { label: 'Contactados', count: counts.contactado, color: 'text-blue-600 bg-blue-50' },
              { label: 'Aprobados', count: counts.aprobado, color: 'text-green-600 bg-green-50' },
              { label: 'Total', count: counts.total, color: 'text-slate-600 bg-slate-50' },
            ].map((c) => (
              <div key={c.label} className={`rounded-lg p-3 text-center ${c.color}`}>
                <p className="text-2xl font-bold">{c.count}</p>
                <p className="text-xs font-medium">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, comuna..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="contactado">Contactado</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {submissions.length === 0
                ? 'No hay solicitudes aún'
                : 'Sin resultados para los filtros'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Comuna</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub) => {
                    const st = STATUS_CONFIG[(sub.status as PartnerStatus) || 'pendiente'];
                    return (
                      <TableRow
                        key={sub.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetail(sub)}
                      >
                        <TableCell className="font-medium">{sub.nombre_negocio}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIA_LABELS[sub.categoria] || sub.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{sub.nombre_contacto}</div>
                          <div className="text-xs text-muted-foreground">{sub.email}</div>
                        </TableCell>
                        <TableCell className="text-sm">{sub.comuna || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sub.created_at
                            ? format(new Date(sub.created_at), 'dd MMM', { locale: es })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.nombre_negocio}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Categoría</p>
                    <p className="font-medium">
                      {CATEGORIA_LABELS[selected.categoria] || selected.categoria}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Contacto</p>
                    <p className="font-medium">{selected.nombre_contacto}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <a
                      href={`mailto:${selected.email}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {selected.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Teléfono</p>
                    <p className="font-medium">{selected.telefono || '—'}</p>
                  </div>
                  {selected.website && (
                    <div>
                      <p className="text-muted-foreground text-xs">Website</p>
                      <a
                        href={selected.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-600 hover:underline flex items-center gap-1"
                      >
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {selected.instagram && (
                    <div>
                      <p className="text-muted-foreground text-xs">Instagram</p>
                      <p className="font-medium">{selected.instagram}</p>
                    </div>
                  )}
                  {selected.comuna && (
                    <div>
                      <p className="text-muted-foreground text-xs">Comuna</p>
                      <p className="font-medium">{selected.comuna}</p>
                    </div>
                  )}
                  {selected.ciudad && (
                    <div>
                      <p className="text-muted-foreground text-xs">Ciudad</p>
                      <p className="font-medium">{selected.ciudad}</p>
                    </div>
                  )}
                </div>

                {selected.direccion && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Dirección</p>
                    <p>{selected.direccion}</p>
                  </div>
                )}

                {selected.descripcion && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Descripción</p>
                    <p className="whitespace-pre-wrap">{selected.descripcion}</p>
                  </div>
                )}

                {selected.servicios_ofrecidos && selected.servicios_ofrecidos.length > 0 && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1">Servicios</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.servicios_ofrecidos.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selected.horario && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Horario</p>
                    <p>{selected.horario}</p>
                  </div>
                )}

                <hr />

                {/* Admin controls */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Estado</p>
                    <Select
                      value={statusEdit}
                      onValueChange={(v) => setStatusEdit(v as PartnerStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="contactado">Contactado</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Notas internas</p>
                    <Textarea
                      value={notasEdit}
                      onChange={(e) => setNotasEdit(e.target.value)}
                      placeholder="Notas privadas (solo admin)..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: selected.id,
                      status: statusEdit,
                      notas_admin: notasEdit,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
