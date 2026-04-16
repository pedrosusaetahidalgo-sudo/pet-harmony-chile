import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Image, Loader2 } from '@/lib/icons';
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
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

const statusLabels: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string }
> = {
  pending: {
    label: 'Pendiente',
    variant: 'secondary',
    className: 'bg-amber-500/20 text-amber-300',
  },
  approved: { label: 'Aprobado', variant: 'default', className: 'bg-green-500/20 text-green-300' },
  rejected: { label: 'Rechazado', variant: 'destructive', className: 'bg-red-500/20 text-red-300' },
};

const serviceTypeLabels: Record<string, string> = {
  dog_walker: 'Paseo',
  dog_sitter: 'Cuidado',
  vet: 'Veterinario',
  trainer: 'Entrenamiento',
  grooming: 'Peluqueria',
  other: 'Otro',
};

const AdminServicePromotions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPromotion, setSelectedPromotion] = useState<
    | (Tables<'service_promotions'> & {
        profiles: { id: string; display_name: string | null; avatar_url: string | null } | null;
      })
    | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin-service-promotions'],
    queryFn: async () => {
      const { data: promotionsData, error } = await supabase
        .from('service_promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(promotionsData?.map((p) => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      return (
        promotionsData?.map((p) => ({
          ...p,
          profiles: profilesMap.get(p.user_id) || null,
        })) || []
      );
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: string;
      rejectionReason?: string;
    }) => {
      const { error } = await supabase
        .from('service_promotions')
        .update({
          status,
          rejection_reason: rejectionReason || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-promotions'] });
      toast.success(variables.status === 'approved' ? 'Promocion aprobada' : 'Promocion rechazada');
      setSelectedPromotion(null);
      setRejectionReason('');
    },
    onError: () => {
      toast.error('Error al procesar promocion');
    },
  });

  const pendingCount = promotions?.filter((p) => p.status === 'pending').length || 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          Promociones de Servicios
          {pendingCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-300">{pendingCount} pendientes</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : !promotions || promotions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No hay promociones</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Titulo</TableHead>
                  <TableHead className="text-slate-400">Usuario</TableHead>
                  <TableHead className="text-slate-400">Tipo</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                  <TableHead className="text-slate-400">Metricas</TableHead>
                  <TableHead className="text-slate-400">Fecha</TableHead>
                  <TableHead className="text-slate-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => {
                  const hasImages = promotion.images && promotion.images.length > 0;
                  const firstImage = hasImages ? (promotion.images as string[])[0] : null;
                  const sl = statusLabels[promotion.status];

                  return (
                    <TableRow key={promotion.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium max-w-[200px] text-slate-200">
                        <div className="flex items-center gap-2">
                          {firstImage && (
                            <img
                              src={firstImage}
                              alt=""
                              className="h-6 w-6 rounded object-cover shrink-0"
                              loading="lazy"
                            />
                          )}
                          {!firstImage && hasImages && (
                            <Image className="h-5 w-5 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{promotion.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {promotion.profiles?.display_name || 'Sin nombre'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                          {serviceTypeLabels[promotion.service_type] || promotion.service_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', sl?.className || '')}>
                          {sl?.label || promotion.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promotion.status === 'approved' ? (
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span title="Impresiones">--</span>
                            <span>/</span>
                            <span title="Clicks">--</span>
                            <span>/</span>
                            <span title="CTR">-- %</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {new Date(promotion.created_at).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          onClick={() => setSelectedPromotion(promotion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {promotion.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                updatePromotionMutation.mutate({
                                  id: promotion.id,
                                  status: 'approved',
                                })
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedPromotion(promotion)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog
          open={!!selectedPromotion}
          onOpenChange={() => {
            setSelectedPromotion(null);
            setRejectionReason('');
          }}
        >
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Detalles de la Promocion</DialogTitle>
            </DialogHeader>
            {selectedPromotion && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Titulo</p>
                    <p className="font-medium text-slate-200">{selectedPromotion.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Usuario</p>
                    <p className="font-medium text-slate-200">
                      {selectedPromotion.profiles?.display_name || 'Sin nombre'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tipo de Servicio</p>
                    <Badge variant="outline" className="border-slate-700 text-slate-300">
                      {serviceTypeLabels[selectedPromotion.service_type] ||
                        selectedPromotion.service_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Estado</p>
                    <Badge
                      className={cn(
                        'text-xs',
                        statusLabels[selectedPromotion.status]?.className || ''
                      )}
                    >
                      {statusLabels[selectedPromotion.status]?.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Descripcion</p>
                  <p className="bg-slate-800 p-3 rounded text-slate-300">
                    {selectedPromotion.description}
                  </p>
                </div>

                {selectedPromotion.images && selectedPromotion.images.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Imagenes</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedPromotion.images.map((url: string, index: number) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Imagen ${index + 1}`}
                            loading="lazy"
                            className="w-full h-24 object-cover rounded border border-slate-700"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPromotion.ai_moderation_score && (
                  <div>
                    <p className="text-sm text-slate-500">Puntuacion AI</p>
                    <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto text-slate-300">
                      {JSON.stringify(selectedPromotion.ai_moderation_score, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedPromotion.rejection_reason && (
                  <div>
                    <p className="text-sm text-slate-500">Motivo de rechazo</p>
                    <p className="bg-red-500/10 text-red-300 p-2 rounded">
                      {selectedPromotion.rejection_reason}
                    </p>
                  </div>
                )}

                {selectedPromotion.status === 'pending' && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Motivo de rechazo (opcional)</p>
                    <Textarea
                      placeholder="Escribe el motivo del rechazo..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                    />
                  </div>
                )}
              </div>
            )}
            {selectedPromotion?.status === 'pending' && (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() =>
                    updatePromotionMutation.mutate({
                      id: selectedPromotion.id,
                      status: 'rejected',
                      rejectionReason,
                    })
                  }
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() =>
                    updatePromotionMutation.mutate({
                      id: selectedPromotion.id,
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

export default AdminServicePromotions;
