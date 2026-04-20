/**
 * Panel admin para gestionar refugios / hogares de adopcion.
 * Permite:
 *   - Ver lista completa con filtros (estado, verificado, comuna).
 *   - Otorgar / revocar badge "Verificado".
 *   - Cambiar status (pending / active / suspended).
 *   - Ver ultimo bulk import + contadores de mascotas por refugio.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Loader2,
  Shield,
  ShieldOff,
  Ban,
  Play,
  Search,
  ExternalLink,
} from 'lucide-react';

interface AdminShelter {
  id: string;
  user_id: string;
  legal_name: string;
  type: 'ong' | 'fundacion' | 'refugio' | 'independiente' | 'municipal';
  commune: string;
  contact_email: string | null;
  contact_phone: string | null;
  rut: string | null;
  slug: string | null;
  verified: boolean;
  verified_at: string | null;
  status: 'pending' | 'active' | 'suspended';
  accepts_donations: boolean;
  total_pets_adopted: number;
  total_pets_in_care: number;
  created_at: string;
}

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended';
type VerifiedFilter = 'all' | 'verified' | 'not_verified';

const TYPE_LABEL: Record<AdminShelter['type'], string> = {
  ong: 'ONG',
  fundacion: 'Fundacion',
  refugio: 'Refugio',
  independiente: 'Rescatista',
  municipal: 'Municipal',
};

export default function AdminShelters() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: shelters, isLoading } = useQuery<AdminShelter[]>({
    queryKey: ['admin-shelters', statusFilter, verifiedFilter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from('adoption_centers')
        .select(
          'id, user_id, legal_name, type, commune, contact_email, contact_phone, rut, slug, verified, verified_at, status, accepts_donations, total_pets_adopted, total_pets_in_care, created_at'
        )
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (verifiedFilter === 'verified') q = q.eq('verified', true);
      if (verifiedFilter === 'not_verified') q = q.eq('verified', false);
      const { data } = await q;
      return (data as AdminShelter[]) || [];
    },
  });

  const filtered =
    shelters?.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.legal_name.toLowerCase().includes(q) ||
        s.commune.toLowerCase().includes(q) ||
        (s.contact_email || '').toLowerCase().includes(q) ||
        (s.rut || '').toLowerCase().includes(q)
      );
    }) || [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-shelters'] });
    await queryClient.invalidateQueries({ queryKey: ['public-shelters'] });
  };

  const setVerified = async (shelter: AdminShelter, verified: boolean) => {
    setActingId(shelter.id);
    try {
      const { error } = await supabase
        .from('adoption_centers')
        .update({
          verified,
          verified_at: verified ? new Date().toISOString() : null,
        })
        .eq('id', shelter.id);
      if (error) throw error;
      toast.success(verified ? 'Refugio verificado' : 'Verificacion revocada');
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setActingId(null);
    }
  };

  const setStatus = async (shelter: AdminShelter, status: AdminShelter['status']) => {
    setActingId(shelter.id);
    try {
      const { error } = await supabase
        .from('adoption_centers')
        .update({ status })
        .eq('id', shelter.id);
      if (error) throw error;
      toast.success(
        status === 'active'
          ? 'Refugio reactivado'
          : status === 'suspended'
            ? 'Refugio suspendido'
            : 'Status actualizado'
      );
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setActingId(null);
    }
  };

  const totalVerified = shelters?.filter((s) => s.verified).length || 0;
  const totalActive = shelters?.filter((s) => s.status === 'active').length || 0;
  const totalPending = shelters?.filter((s) => s.status === 'pending').length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini label="Total" value={shelters?.length || 0} />
        <StatMini label="Activos" value={totalActive} />
        <StatMini label="Verificados" value={totalVerified} />
        <StatMini label="Pendientes" value={totalPending} />
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, comuna, email, RUT"
            className="pl-9"
          />
        </div>
        <Select
          value={verifiedFilter}
          onValueChange={(v) => setVerifiedFilter(v as VerifiedFilter)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="verified">Verificados</SelectItem>
            <SelectItem value="not_verified">Sin verificar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="suspended">Suspendidos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay refugios que coincidan con los filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <ShelterRow
              key={s.id}
              shelter={s}
              busy={actingId === s.id}
              onVerify={(v) => setVerified(s, v)}
              onSetStatus={(st) => setStatus(s, st)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ShelterRow({
  shelter,
  busy,
  onVerify,
  onSetStatus,
}: {
  shelter: AdminShelter;
  busy: boolean;
  onVerify: (verified: boolean) => void;
  onSetStatus: (status: AdminShelter['status']) => void;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm">{shelter.legal_name}</h3>
              <Badge variant="outline" className="text-[10px]">
                {TYPE_LABEL[shelter.type]}
              </Badge>
              {shelter.verified && (
                <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100 border-green-300">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Verificado
                </Badge>
              )}
              {shelter.status === 'pending' && (
                <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">
                  Pendiente
                </Badge>
              )}
              {shelter.status === 'suspended' && (
                <Badge variant="outline" className="text-[10px] border-red-400 text-red-700">
                  Suspendido
                </Badge>
              )}
              {shelter.slug && (
                <a
                  href={`/refugios/${shelter.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5"
                >
                  Ver publico <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
              <span>{shelter.commune}</span>
              {shelter.contact_email && <span>· {shelter.contact_email}</span>}
              {shelter.rut && <span>· RUT {shelter.rut}</span>}
              <span>
                · {shelter.total_pets_in_care} en cuidado / {shelter.total_pets_adopted} adoptados
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {!shelter.verified ? (
              <Button size="sm" variant="outline" onClick={() => onVerify(true)} disabled={busy}>
                <Shield className="h-3.5 w-3.5 mr-1" /> Verificar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onVerify(false)}
                disabled={busy}
                className="text-amber-700"
              >
                <ShieldOff className="h-3.5 w-3.5 mr-1" /> Revocar
              </Button>
            )}
            {shelter.status === 'suspended' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetStatus('active')}
                disabled={busy}
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Reactivar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetStatus('suspended')}
                disabled={busy}
                className="text-red-700"
              >
                <Ban className="h-3.5 w-3.5 mr-1" /> Suspender
              </Button>
            )}
            {shelter.status === 'pending' && (
              <Button size="sm" onClick={() => onSetStatus('active')} disabled={busy}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activar
              </Button>
            )}
            {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
