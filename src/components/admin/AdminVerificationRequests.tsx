import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, FileText, ExternalLink } from '@/lib/icons';
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
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

const roleLabels: Record<string, string> = {
  dog_walker: 'Paseador',
  dog_sitter: 'Cuidador',
  vet: 'Veterinario',
  trainer: 'Entrenador',
};

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  approved: { label: 'Aprobado', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  rejected: { label: 'Rechazado', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

const AdminVerificationRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<
    | (Tables<'verification_requests'> & {
        profiles: { id: string; display_name: string | null; avatar_url: string | null } | null;
      })
    | null
  >(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-verification-requests'],
    queryFn: async () => {
      const { data: requestsData, error } = await supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(requestsData?.map((r) => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      return (
        requestsData?.map((r) => ({
          ...r,
          profiles: profilesMap.get(r.user_id) || null,
        })) || []
      );
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      if (!user) throw new Error('Usuario no autenticado');
      const requestToProcess = selectedRequest;
      const { error } = await supabase.rpc('approve_verification_request', {
        p_request_id: id,
        p_reviewer_id: user.id,
        p_status: status,
        p_user_id: requestToProcess?.user_id ?? '',
        p_role: requestToProcess?.requested_role ?? '',
      });
      if (error) throw error;

      // Persist reviewer notes if provided (not handled by the RPC)
      if (notes) {
        await supabase.from('verification_requests').update({ notes }).eq('id', id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      toast.success(variables.status === 'approved' ? 'Solicitud aprobada' : 'Solicitud rechazada');
      setSelectedRequest(null);
      setRejectionNotes('');
    },
    onError: () => {
      toast.error('Error al procesar solicitud');
    },
  });

  const pendingCount = requests?.filter((r) => r.status === 'pending').length || 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          Solicitudes de Verificacion
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30">
              {pendingCount} pendientes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No hay solicitudes de verificacion</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 uppercase text-xs">Usuario</TableHead>
                <TableHead className="text-slate-400 uppercase text-xs">Rol Solicitado</TableHead>
                <TableHead className="text-slate-400 uppercase text-xs">Estado</TableHead>
                <TableHead className="text-slate-400 uppercase text-xs">Fecha</TableHead>
                <TableHead className="text-slate-400 uppercase text-xs">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white">
                    {request.profiles?.display_name || 'Sin nombre'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-slate-500/20 text-slate-300 border-slate-500/30"
                    >
                      {roleLabels[request.requested_role] || request.requested_role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        statusStyles[request.status]?.className || 'bg-slate-500/20 text-slate-300'
                      }
                    >
                      {statusStyles[request.status]?.label || request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(request.created_at).toLocaleDateString('es-CL')}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedRequest(request);
                            updateRequestMutation.mutate({ id: request.id, status: 'approved' });
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog
          open={!!selectedRequest}
          onOpenChange={() => {
            setSelectedRequest(null);
            setRejectionNotes('');
          }}
        >
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Detalles de la Solicitud</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Usuario</p>
                    <p className="font-medium text-white">
                      {selectedRequest.profiles?.display_name || 'Sin nombre'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Rol Solicitado</p>
                    <Badge
                      variant="outline"
                      className="bg-slate-500/20 text-slate-300 border-slate-500/30"
                    >
                      {roleLabels[selectedRequest.requested_role] || selectedRequest.requested_role}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Estado</p>
                    <Badge
                      variant="outline"
                      className={
                        statusStyles[selectedRequest.status]?.className ||
                        'bg-slate-500/20 text-slate-300'
                      }
                    >
                      {statusStyles[selectedRequest.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Fecha de solicitud</p>
                    <p className="text-slate-300">
                      {new Date(selectedRequest.created_at).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <p className="text-sm text-slate-400">Notas del solicitante</p>
                    <p className="bg-slate-800 p-2 rounded text-slate-300">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}

                {selectedRequest.document_urls && selectedRequest.document_urls.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Documentos adjuntos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.document_urls.map((url: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                          asChild
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-1" />
                            Documento {index + 1}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'pending' && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Notas de rechazo (opcional)</p>
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
            {selectedRequest?.status === 'pending' && (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() =>
                    updateRequestMutation.mutate({
                      id: selectedRequest.id,
                      status: 'rejected',
                      notes: rejectionNotes,
                    })
                  }
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() =>
                    updateRequestMutation.mutate({
                      id: selectedRequest.id,
                      status: 'approved',
                    })
                  }
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminVerificationRequests;
