import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Stethoscope,
  Loader2,
  ExternalLink,
  Brain,
  Clock,
} from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase;
import { useAuth } from '@/hooks/useAuth';
import { useAdminAudit } from '@/hooks/useAdminAudit';
import { toast } from 'sonner';
import type { ServiceProviderRow } from '@/types/vetDirectory';
import { differenceInDays } from 'date-fns';

type Vet = ServiceProviderRow;

interface VerificationResult {
  confidence_score: number;
  extracted_name: string | null;
  extracted_license: string | null;
  name_match_score: number;
  document_quality: string;
  auto_approved: boolean;
  reasoning?: string;
}

function WaitingBadge({ createdAt }: { createdAt: string | null }) {
  if (!createdAt) return null;
  const days = differenceInDays(new Date(), new Date(createdAt));
  let colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (days > 7) {
    colorClass = 'bg-red-500/20 text-red-300 border-red-500/30';
  } else if (days >= 2) {
    colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }
  return (
    <Badge className={`text-xs border ${colorClass}`}>
      <Clock className="h-3 w-3 mr-1" />
      {days === 0 ? 'Hoy' : `${days}d esperando`}
    </Badge>
  );
}

/**
 * Panel admin: verificacion de veterinarios Colmevet con IA-assist.
 * Score >= 80: auto-aprobado. 50-79: revision rapida. < 50: revision manual.
 */
export default function AdminVetVerifications() {
  const { user } = useAuth();
  const { logAction } = useAdminAudit();
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vets pendientes
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

  // Vets verificados (ultimos 20)
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

  // Verification results
  const { data: verificationResults } = useQuery({
    queryKey: ['admin-vet-verification-results'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from('vet_verification_results') as any)
        .select(
          'provider_id, confidence_score, extracted_name, extracted_license, name_match_score, document_quality, auto_approved, reviewed_by, created_at'
        )
        .order('created_at', { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Map(((data as Array<Record<string, any>>) ?? []).map((r) => [r.provider_id, r]));
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
    onSuccess: (_d, vetId) => {
      toast.success('Veterinario verificado');
      logAction('provider.verify', 'provider', vetId, { method: 'manual' });
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-done'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reject = useMutation({
    mutationFn: async ({ vetId, reason }: { vetId: string; reason: string }) => {
      const { error } = await sb
        .from('service_providers')
        .update({ is_verified: false, rejection_reason: reason })
        .eq('id', vetId);
      if (error) throw error;
    },
    onSuccess: (_d, { vetId }) => {
      toast.success('Verificacion rechazada');
      logAction('provider.reject', 'provider', vetId, { method: 'manual_vet_verification' });
      setRejectingId(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-pending'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // IA Verification
  const verifyWithAI = useMutation({
    mutationFn: async ({
      providerId,
      imageBase64,
    }: {
      providerId: string;
      imageBase64: string;
    }) => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://gwailbjlvevkhwcrovfd.supabase.co'}/functions/v1/verify-vet-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ provider_id: providerId, image_base64: imageBase64 }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error en verificacion');
      }

      return response.json() as Promise<VerificationResult>;
    },
    onSuccess: (result) => {
      if (result.auto_approved) {
        toast.success(`Verificado automaticamente (score: ${result.confidence_score})`);
      } else {
        toast.info(
          `Analisis completado (score: ${result.confidence_score}). Requiere revision manual.`
        );
      }
      setVerifyingId(null);
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-pending'] });
      qc.invalidateQueries({ queryKey: ['admin-vet-verifications-done'] });
      qc.invalidateQueries({ queryKey: ['admin-vet-verification-results'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setVerifyingId(null);
    },
  });

  const handleFileUpload = async (vetId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se aceptan imagenes');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagen muy grande (max 10MB)');
      return;
    }

    setVerifyingId(vetId);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      verifyWithAI.mutate({ providerId: vetId, imageBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  function ScoreBadge({ score }: { score: number }) {
    if (score >= 80)
      return (
        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {score}% - Auto-aprobado
        </Badge>
      );
    if (score >= 50)
      return (
        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {score}% - Revisar
        </Badge>
      );
    return (
      <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">
        {score}% - Manual
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full bg-slate-800" />
        <Skeleton className="h-32 w-full bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        aria-label="Subir documento de verificacion"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const vetId = fileInputRef.current?.dataset.vetId;
          if (file && vetId) handleFileUpload(vetId, file);
          e.target.value = '';
        }}
      />

      {/* Pendientes */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Stethoscope className="h-5 w-5 text-amber-400" />
            Pendientes de verificacion ({pending?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pending || pending.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No hay verificaciones pendientes.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((vet) => {
                const aiResult = verificationResults?.get(vet.id);
                const isVerifying = verifyingId === vet.id;

                return (
                  <div
                    key={vet.id}
                    className="border border-slate-800 rounded-lg p-4 bg-slate-800/50"
                  >
                    <div className="flex items-start gap-4">
                      {vet.avatar_url ? (
                        <img
                          src={vet.avatar_url}
                          alt={vet.display_name}
                          className="w-14 h-14 rounded-full object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Stethoscope className="h-6 w-6 text-purple-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate text-white">
                              {vet.display_name}
                            </h3>
                            <WaitingBadge createdAt={vet.created_at} />
                          </div>
                          {vet.slug && (
                            <a
                              href={`/veterinarios/${vet.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-purple-300 hover:underline flex items-center gap-1"
                            >
                              Ver perfil <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-sm space-y-0.5 text-slate-300">
                          <p>
                            <strong className="text-slate-200">N Colmevet:</strong>{' '}
                            <span className="font-mono text-amber-300">{vet.license_number}</span>
                          </p>
                          <p>
                            <strong className="text-slate-200">Comuna:</strong>{' '}
                            {vet.commune ?? '--'}
                          </p>
                          {vet.public_email && (
                            <p>
                              <strong className="text-slate-200">Email:</strong> {vet.public_email}
                            </p>
                          )}
                        </div>

                        {/* AI verification result */}
                        {aiResult && (
                          <div className="mt-2 p-3 bg-slate-900/80 border border-slate-700 rounded-md text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <Brain className="h-3.5 w-3.5 text-purple-300" />
                              <span className="font-medium text-slate-200">Resultado IA:</span>
                              <ScoreBadge score={aiResult.confidence_score} />
                            </div>
                            {aiResult.extracted_name && (
                              <p className="text-slate-300">
                                Nombre extraido:{' '}
                                <strong className="text-white">{aiResult.extracted_name}</strong>
                              </p>
                            )}
                            {aiResult.extracted_license && (
                              <p className="text-slate-300">
                                N extraido:{' '}
                                <strong className="text-white">{aiResult.extracted_license}</strong>
                              </p>
                            )}
                            <p className="text-slate-400">
                              Calidad doc:{' '}
                              <span className="text-slate-300">{aiResult.document_quality}</span> ·
                              Match nombre:{' '}
                              <span className="text-slate-300">
                                {Math.round((aiResult.name_match_score ?? 0) * 100)}%
                              </span>
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 mt-2">
                          Verifica en{' '}
                          <a
                            href="https://www.colegioveterinario.cl"
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-300 hover:underline"
                          >
                            colegioveterinario.cl
                          </a>
                        </p>
                      </div>
                    </div>

                    {rejectingId === vet.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Motivo del rechazo (visible para el vet)..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={2}
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reject.mutate({ vetId: vet.id, reason: rejectReason })}
                            disabled={!rejectReason.trim() || reject.isPending}
                          >
                            {reject.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Confirmar rechazo'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
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
                      <div className="mt-3 flex flex-wrap gap-2">
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          onClick={() => setRejectingId(vet.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Rechazar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                          disabled={isVerifying}
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.dataset.vetId = vet.id;
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" /> Analizando...
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3 mr-1" /> Verificar con IA
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verificados */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Verificados recientemente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!verified || verified.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aun no hay vets verificados.</p>
          ) : (
            <div className="space-y-2">
              {verified.map((vet) => {
                const aiResult = verificationResults?.get(vet.id);
                return (
                  <div
                    key={vet.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded"
                  >
                    {vet.avatar_url ? (
                      <img
                        src={vet.avatar_url}
                        alt={vet.display_name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Stethoscope className="h-4 w-4 text-purple-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">{vet.display_name}</p>
                      <p className="text-xs text-slate-400">Colmevet {vet.license_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {aiResult && (
                        <Badge className="text-xs bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          <Brain className="h-3 w-3 mr-1" />
                          {aiResult.confidence_score}%
                        </Badge>
                      )}
                      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Verificado
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
