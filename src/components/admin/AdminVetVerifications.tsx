import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Stethoscope,
  Loader2,
  ExternalLink,
  Upload,
  Brain,
  AlertTriangle,
} from 'lucide-react';
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
      toast.success('Verificación rechazada');
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
        throw new Error(err.error || 'Error en verificación');
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
      toast.error('Solo se aceptan imágenes');
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
      return <Badge className="bg-green-100 text-green-800">{score}% - Auto-aprobado</Badge>;
    if (score >= 50)
      return <Badge className="bg-yellow-100 text-yellow-800">{score}% - Revisar</Badge>;
    return <Badge className="bg-red-100 text-red-800">{score}% - Manual</Badge>;
  }

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
              {pending.map((vet) => {
                const aiResult = verificationResults?.get(vet.id);
                const isVerifying = verifyingId === vet.id;

                return (
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
                          {vet.public_email && (
                            <p>
                              <strong>Email:</strong> {vet.public_email}
                            </p>
                          )}
                        </div>

                        {/* AI verification result */}
                        {aiResult && (
                          <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <Brain className="h-3.5 w-3.5 text-purple-500" />
                              <span className="font-medium">Resultado IA:</span>
                              <ScoreBadge score={aiResult.confidence_score} />
                            </div>
                            {aiResult.extracted_name && (
                              <p>
                                Nombre extraído: <strong>{aiResult.extracted_name}</strong>
                              </p>
                            )}
                            {aiResult.extracted_license && (
                              <p>
                                N° extraído: <strong>{aiResult.extracted_license}</strong>
                              </p>
                            )}
                            <p>
                              Calidad doc: {aiResult.document_quality} · Match nombre:{' '}
                              {Math.round((aiResult.name_match_score ?? 0) * 100)}%
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Verifica en{' '}
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
                          placeholder="Motivo del rechazo (visible para el vet)..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={2}
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
                        <Button size="sm" variant="outline" onClick={() => setRejectingId(vet.id)}>
                          <XCircle className="h-3 w-3 mr-1" /> Rechazar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
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
              {verified.map((vet) => {
                const aiResult = verificationResults?.get(vet.id);
                return (
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
                      <p className="text-xs text-muted-foreground">Colmevet {vet.license_number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {aiResult && (
                        <Badge variant="outline" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          {aiResult.confidence_score}%
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
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
