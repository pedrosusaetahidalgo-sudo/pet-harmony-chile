import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  ExternalLink,
  Sparkles,
  User as UserIcon,
  PawPrint,
  FileCheck,
  AlertCircle,
} from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Tables } from '@/integrations/supabase/types';

// Enum real de app_role en DB (veterinarian/dogsitter sin underscore).
const roleLabels: Record<string, string> = {
  dog_walker: 'Paseador',
  dogsitter: 'Cuidador',
  veterinarian: 'Veterinario',
  trainer: 'Entrenador',
  grooming: 'Peluquero',
};

// DB CHECK constraint: status IN ('pendiente','aprobado','rechazado').
const statusStyles: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  aprobado: {
    label: 'Aprobado',
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  rechazado: {
    label: 'Rechazado',
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

interface EnrichedProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
}

interface EligibilityChecks {
  profileComplete: boolean; // 4/4 fields
  hasPetWithRecord: boolean; // >= 1 pet with >= 1 medical_record
  hasDocuments: boolean; // >= 1 document_url
  isAutoApprovable: boolean; // all above
}

type VerificationRequestWithMeta = Tables<'verification_requests'> & {
  profile: EnrichedProfile | null;
  checks: EligibilityChecks;
};

function computeEligibility(
  profile: EnrichedProfile | null,
  petWithRecord: boolean,
  docCount: number
): EligibilityChecks {
  const profileComplete = !!(
    profile?.display_name &&
    profile?.bio &&
    profile?.location &&
    profile?.avatar_url
  );
  const hasDocuments = docCount > 0;
  const isAutoApprovable = profileComplete && petWithRecord && hasDocuments;
  return {
    profileComplete,
    hasPetWithRecord: petWithRecord,
    hasDocuments,
    isAutoApprovable,
  };
}

const AdminVerificationRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestWithMeta | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const { data: requests, isLoading } = useQuery<VerificationRequestWithMeta[]>({
    queryKey: ['admin-verification-requests'],
    queryFn: async () => {
      const { data: requestsData, error } = await supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!requestsData || requestsData.length === 0) return [];

      const userIds = [...new Set(requestsData.map((r) => r.user_id))];

      // 1) Perfiles de los solicitantes
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, location')
        .in('id', userIds);
      const profilesMap = new Map<string, EnrichedProfile>(
        (profilesData ?? []).map((p) => [p.id, p as unknown as EnrichedProfile])
      );

      // 2) Mascotas con registros medicos (indicador de "ficha activa").
      //    Contamos pets que tengan al menos 1 medical_record del mismo owner.
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, owner_id')
        .in('owner_id', userIds);

      const { data: recordsData } = await supabase
        .from('medical_records')
        .select('pet_id, owner_id')
        .in('owner_id', userIds);

      const petsByOwner = new Map<string, string[]>();
      for (const pet of petsData ?? []) {
        if (!pet.owner_id) continue;
        const arr = petsByOwner.get(pet.owner_id) ?? [];
        arr.push(pet.id);
        petsByOwner.set(pet.owner_id, arr);
      }
      const recordsByOwner = new Map<string, Set<string>>();
      for (const rec of recordsData ?? []) {
        if (!rec.owner_id || !rec.pet_id) continue;
        const set = recordsByOwner.get(rec.owner_id) ?? new Set<string>();
        set.add(rec.pet_id);
        recordsByOwner.set(rec.owner_id, set);
      }

      return requestsData.map((r) => {
        const profile = profilesMap.get(r.user_id) ?? null;
        const ownerPets = petsByOwner.get(r.user_id) ?? [];
        const ownerRecords = recordsByOwner.get(r.user_id) ?? new Set();
        const hasPetWithRecord = ownerPets.some((petId) => ownerRecords.has(petId));
        const docCount = Array.isArray(r.document_urls) ? r.document_urls.length : 0;
        return {
          ...r,
          profile,
          checks: computeEligibility(profile, hasPetWithRecord, docCount),
        };
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({
      request,
      status,
      notes,
    }: {
      request: VerificationRequestWithMeta;
      status: 'aprobado' | 'rechazado';
      notes?: string;
    }) => {
      if (!user) throw new Error('Usuario no autenticado');
      const { error } = await supabase.rpc('approve_verification_request', {
        p_request_id: request.id,
        p_reviewer_id: user.id,
        p_status: status,
        p_user_id: request.user_id,
        p_role: request.requested_role,
      });
      if (error) throw error;
      if (notes) {
        await supabase.from('verification_requests').update({ notes }).eq('id', request.id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      toast.success(variables.status === 'aprobado' ? 'Solicitud aprobada' : 'Solicitud rechazada');
      setSelectedRequest(null);
      setRejectionNotes('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al procesar solicitud');
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (eligibleRequests: VerificationRequestWithMeta[]) => {
      if (!user) throw new Error('Usuario no autenticado');
      for (const req of eligibleRequests) {
        const { error } = await supabase.rpc('approve_verification_request', {
          p_request_id: req.id,
          p_reviewer_id: user.id,
          p_status: 'aprobado',
          p_user_id: req.user_id,
          p_role: req.requested_role,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, eligibleRequests) => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      toast.success(`${eligibleRequests.length} solicitudes aprobadas automáticamente`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al aprobar en lote');
    },
  });

  const pending = useMemo(
    () => (requests ?? []).filter((r) => r.status === 'pendiente'),
    [requests]
  );
  const autoApprovable = useMemo(() => pending.filter((r) => r.checks.isAutoApprovable), [pending]);
  const needsReview = useMemo(() => pending.filter((r) => !r.checks.isAutoApprovable), [pending]);
  const history = useMemo(
    () => (requests ?? []).filter((r) => r.status !== 'pendiente'),
    [requests]
  );

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: resumen + CTA bulk */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Pendientes</p>
            <p className="text-2xl font-bold text-white">{pending.length}</p>
          </div>
          {autoApprovable.length > 0 && (
            <div>
              <p className="text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Auto-aprobables
              </p>
              <p className="text-2xl font-bold text-emerald-300">{autoApprovable.length}</p>
            </div>
          )}
          {needsReview.length > 0 && (
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-wider">Requieren revisión</p>
              <p className="text-2xl font-bold text-amber-300">{needsReview.length}</p>
            </div>
          )}
        </div>
        {autoApprovable.length > 0 && (
          <Button
            onClick={() => bulkApproveMutation.mutate(autoApprovable)}
            disabled={bulkApproveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Aprobar {autoApprovable.length} elegibles
          </Button>
        )}
      </div>

      {/* Auto-aprobables */}
      {autoApprovable.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> Cumplen todos los criterios
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {autoApprovable.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onOpenDetail={() => setSelectedRequest(r)}
                onApprove={() => updateRequestMutation.mutate({ request: r, status: 'aprobado' })}
                onReject={() => setSelectedRequest(r)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Necesitan revisión */}
      {needsReview.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> Necesitan revisión manual
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {needsReview.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onOpenDetail={() => setSelectedRequest(r)}
                onApprove={() => updateRequestMutation.mutate({ request: r, status: 'aprobado' })}
                onReject={() => setSelectedRequest(r)}
              />
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center text-slate-400">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            Sin solicitudes pendientes.
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      {history.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">
            Historial ({history.length})
          </h3>
          <div className="space-y-2">
            {history.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
                      {r.profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">
                      {r.profile?.display_name || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {roleLabels[r.requested_role] || r.requested_role} ·{' '}
                      {new Date(r.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={statusStyles[r.status]?.className || 'bg-slate-500/20 text-slate-300'}
                >
                  {statusStyles[r.status]?.label || r.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dialog detalle */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => {
          setSelectedRequest(null);
          setRejectionNotes('');
        }}
      >
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Detalles de la solicitud</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedRequest.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-700 text-slate-200">
                    {selectedRequest.profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">
                    {selectedRequest.profile?.display_name || 'Sin nombre'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Solicita:{' '}
                    {roleLabels[selectedRequest.requested_role] || selectedRequest.requested_role}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(selectedRequest.created_at).toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              <EligibilityGrid checks={selectedRequest.checks} />

              {selectedRequest.notes && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Notas del solicitante</p>
                  <p className="bg-slate-800 p-3 rounded text-slate-200 text-sm whitespace-pre-wrap">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {selectedRequest.document_urls && selectedRequest.document_urls.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">
                    Documentos ({selectedRequest.document_urls.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.document_urls.map((url: string, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-slate-300 hover:bg-slate-700"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" />
                          Doc {index + 1}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pendiente' && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Notas de rechazo (opcional)</p>
                  <Textarea
                    placeholder="Motivo del rechazo..."
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              )}
            </div>
          )}
          {selectedRequest?.status === 'pendiente' && (
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() =>
                  updateRequestMutation.mutate({
                    request: selectedRequest,
                    status: 'rechazado',
                    notes: rejectionNotes,
                  })
                }
                disabled={updateRequestMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() =>
                  updateRequestMutation.mutate({
                    request: selectedRequest,
                    status: 'aprobado',
                  })
                }
                disabled={updateRequestMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function RequestCard({
  request,
  onOpenDetail,
  onApprove,
  onReject,
}: {
  request: VerificationRequestWithMeta;
  onOpenDetail: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={request.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-slate-700 text-slate-200 text-sm">
              {request.profile?.display_name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white truncate">
              {request.profile?.display_name || 'Sin nombre'}
            </p>
            <p className="text-xs text-slate-400">
              {roleLabels[request.requested_role] || request.requested_role}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              request.checks.isAutoApprovable
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }
          >
            {request.checks.isAutoApprovable ? 'Apto' : 'Revisar'}
          </Badge>
        </div>

        <EligibilityGrid checks={request.checks} compact />

        {request.notes && <p className="text-xs text-slate-400 line-clamp-2">{request.notes}</p>}

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={onOpenDetail} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            Detalles
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={onApprove}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EligibilityGrid({
  checks,
  compact = false,
}: {
  checks: EligibilityChecks;
  compact?: boolean;
}) {
  const items = [
    { label: 'Perfil completo', ok: checks.profileComplete, icon: UserIcon },
    { label: 'Mascota con ficha', ok: checks.hasPetWithRecord, icon: PawPrint },
    { label: 'Documentos', ok: checks.hasDocuments, icon: FileCheck },
  ];
  return (
    <div className={`grid grid-cols-3 gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {items.map(({ label, ok, icon: Icon }) => (
        <div
          key={label}
          className={`flex items-center gap-1.5 ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded border ${
            ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{label}</span>
          {ok && <CheckCircle className="h-3 w-3 ml-auto" />}
        </div>
      ))}
    </div>
  );
}

export default AdminVerificationRequests;
