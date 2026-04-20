/**
 * AdminVetsAtChurnRisk — lista vets en peligro de churn para outreach manual.
 *
 * Origen: Plan 90d INIT-09 — cada llamada de Pedro a un vet que no convierte
 * tiene alto leverage. Este componente le da la lista priorizada.
 *
 * Lee `rpc_vets_at_churn_risk` (mig 20260703020000).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Mail, Phone, ExternalLink, Copy, Check } from '@/lib/icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChurnRisk {
  provider_id: string;
  user_id: string;
  display_name: string | null;
  contact_email: string | null;
  public_phone: string | null;
  commune: string | null;
  provider_plan: string | null;
  status: string;
  registered_at: string;
  days_since_registration: number;
  patients_linked: number;
  last_login: string | null;
  days_since_login: number | null;
  risk_level: 'high' | 'medium' | 'low' | 'healthy';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const RISK_COLORS: Record<ChurnRisk['risk_level'], { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Alto' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Medio' },
  low: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Bajo' },
  healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'OK' },
};

function WhatsAppLink({ phone, text }: { phone: string; text: string }) {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
    >
      <Phone className="h-3 w-3" />
      WhatsApp
      <ExternalLink className="h-2.5 w-2.5" />
    </a>
  );
}

export default function AdminVetsAtChurnRisk() {
  const { data, isLoading, error } = useQuery<ChurnRisk[]>({
    queryKey: ['admin-vets-churn-risk'],
    staleTime: 300_000,
    refetchInterval: 300_000,
    queryFn: async () => {
      const { data, error } = await sb.rpc('rpc_vets_at_churn_risk');
      if (error) {
        console.warn('[AdminVetsAtChurnRisk] RPC error', error);
        return [];
      }
      return (data || []) as ChurnRisk[];
    },
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyOutreach = (vet: ChurnRisk) => {
    const firstName = (vet.display_name || '').split(' ')[0] || 'doctor/a';
    const message =
      vet.patients_linked === 0
        ? `Hola ${firstName}, te escribe Pedro de Paw Friend. Vi que te registraste hace ${vet.days_since_registration} dias y todavia no agregaste tu primer paciente. ¿Quieres que te ayude con un onboarding rapido por llamada de 10 min? Te muestro como vincular tus pacientes y obtener valor desde el dia 1.`
        : `Hola ${firstName}, Pedro de Paw Friend. Hace ${vet.days_since_login ?? '?'} dias que no te veo en la plataforma. ¿Hay algo que no esta funcionando bien para ti? Me encantaria un feedback rapido por WhatsApp o llamada de 10 min — tu input me sirve mucho.`;

    navigator.clipboard
      .writeText(message)
      .then(() => {
        setCopiedId(vet.provider_id);
        toast.success('Mensaje copiado al portapapeles');
        setTimeout(() => setCopiedId(null), 2500);
      })
      .catch(() => toast.error('No se pudo copiar'));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 text-sm text-amber-900">
          No se pudo cargar la lista. Verifica que{' '}
          <code>20260703020000_vets_at_churn_risk_rpc.sql</code> esté aplicada.
        </CardContent>
      </Card>
    );
  }

  const high = data.filter((v) => v.risk_level === 'high');
  const others = data.filter((v) => v.risk_level !== 'high');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Vets en peligro de churn
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Registrados 7-60 días atrás sin pacientes o inactivos. Cada llamada de outreach de Pedro a
          uno de estos = alto leverage comercial (INIT-09).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Sin vets en riesgo actualmente. 🎉
          </p>
        ) : (
          <>
            <div className="flex gap-3 flex-wrap text-xs">
              <Badge className="bg-red-100 text-red-800 border-red-200">{high.length} alto</Badge>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {data.filter((v) => v.risk_level === 'medium').length} medio
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                {data.filter((v) => v.risk_level === 'low').length} bajo
              </Badge>
            </div>

            {[...high, ...others].map((vet) => {
              const risk = RISK_COLORS[vet.risk_level];
              const outreachText =
                vet.patients_linked === 0
                  ? `Hola, vi que te registraste hace ${vet.days_since_registration} dias. Quieres onboarding?`
                  : `Hola, hace ${vet.days_since_login ?? '?'} dias que no te veo. Todo bien?`;

              return (
                <div
                  key={vet.provider_id}
                  className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 bg-white"
                >
                  <div className="flex items-start gap-2 flex-wrap">
                    <Badge className={`${risk.bg} ${risk.text} border-0`}>{risk.label}</Badge>
                    <span className="font-semibold text-sm">
                      {vet.display_name || 'Sin nombre'}
                    </span>
                    {vet.commune && (
                      <span className="text-xs text-muted-foreground">· {vet.commune}</span>
                    )}
                    {vet.provider_plan && (
                      <span className="text-xs text-muted-foreground">· {vet.provider_plan}</span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                    <span>
                      Registrado hace <strong>{vet.days_since_registration}d</strong>
                    </span>
                    <span>
                      Pacientes: <strong>{vet.patients_linked}</strong>
                    </span>
                    {vet.days_since_login !== null && (
                      <span>
                        Sin login hace <strong>{vet.days_since_login}d</strong>
                      </span>
                    )}
                    <span>{format(new Date(vet.registered_at), "d 'de' MMM", { locale: es })}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-1">
                    {vet.contact_email && (
                      <a
                        href={`mailto:${vet.contact_email}`}
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                      >
                        <Mail className="h-3 w-3" />
                        {vet.contact_email}
                      </a>
                    )}
                    {vet.public_phone && (
                      <WhatsAppLink phone={vet.public_phone} text={outreachText} />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs gap-1"
                      onClick={() => copyOutreach(vet)}
                    >
                      {copiedId === vet.provider_id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar mensaje
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
