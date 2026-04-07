import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle2, XCircle, Stethoscope, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase;
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ServiceProviderRow } from '@/types/vetDirectory';

type Vet = ServiceProviderRow;

/**
 * Panel admin: lista veterinarios pendientes de verificar Colmevet,
 * permite aprobarlos (marcar is_verified=true) o rechazar.
 */
export default function AdminVetVerifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Vets pendientes: tienen license_number pero is_verified = false
  const { data: pending, isLoading } = useQuery({
    queryKey: ['admin-vet-verifications-pending'],
    queryFn: async (): Promise<Vet[]> => {
      const { data, error } = await sb
        .from('service_providers')
        .select('*')
        .eq('is_verified', false)
        .not('license_number', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Vet[];
    },
  });

  // Vets ya verificados (últimos 20)
  const { data: verified } = useQuery({
    queryKey: ['admin-vet-verifications-done'],
    queryFn: async (): Promise<Vet[]> => {
      const { data, error } = await sb
        .from('service_providers')
        .select('*')
        .eq('is_verified', true)
        .not('license_number', 'is', null)
        .order('verified_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Vet[];
    },
  });

  const approve = useMutation({
    mutationFn: async (vetId: string) => {
      const { error } = await sb
        .from('service_providers')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id ?? null,
        })
        .eq('id', vetId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Veterinario verificado');
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-done'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reject = useMutation({
    mutationFn: async ({ vetId, reason }: { vetId: string; reason: string }) => {
      // Limpia el license_number y guarda el motivo en rejection_reason
      const { error } = await sb
        .from('service_providers')
        .update({
          is_verified: false,
          rejection_reason: reason,
        })
        .eq('id', vetId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verificación rechazada');
      setRejectingId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-pending'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-amber-500" />
            Pendientes de verificación ({pending?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pending || pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay verificaciones pendientes.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((vet) => (
                <div key={vet.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {vet.avatar_url ? (
                      <img
                        src={vet.avatar_url}
                        alt={vet.display_name}
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-purple-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold truncate">{vet.display_name}</h3>
                        {vet.slug && (
                          <a
                            href={`/veterinarios/${vet.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-purple-700 hover:underline flex items-center gap-1"
                          >
                            Ver perfil <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-sm space-y-0.5">
                        <p>
                          <strong>N° Colmevet:</strong>{' '}
                          <span className="font-mono">{vet.license_number}</span>
                        </p>
                        <p>
                          <strong>Comuna:</strong> {vet.commune ?? '—'}
                        </p>
                        <p>
                          <strong>Tipo:</strong> {vet.provider_type ?? 'individual'}
                        </p>
                        {vet.public_email && (
                          <p>
                            <strong>Email:</strong> {vet.public_email}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Verifica el N° en{' '}
                        <a
                          href="https://www.colegioveterinario.cl"
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-700 hover:underline"
                        >
                          colegioveterinario.cl
                        </a>
                      </p>
                    </div>
                  </div>

                  {rejectingId === vet.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Motivo del rechazo (visible para el vet)…"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            reject.mutate({ vetId: vet.id, reason: rejectReason })
                          }
                          disabled={!rejectReason.trim() || reject.isPending}
                        >
                          {reject.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar rechazo'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approve.mutate(vet.id)}
                        disabled={approve.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approve.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(vet.id)}>
                        <XCircle className="h-3 w-3 mr-1" /> Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verificados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Verificados recientemente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!verified || verified.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no hay vets verificados.
            </p>
          ) : (
            <div className="space-y-2">
              {verified.map((vet) => (
                <div
                  key={vet.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded"
                >
                  {vet.avatar_url ? (
                    <img
                      src={vet.avatar_url}
                      alt={vet.display_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-purple-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{vet.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Colmevet {vet.license_number}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    ✓ Verificado
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
