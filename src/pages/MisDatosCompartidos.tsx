/**
 * Compliance Ley 21.719 (vigente 2026): panel de transparencia que muestra
 * a quien y cuando se compartieron datos personales del titular con
 * partners B2B (aseguradoras, pharma, biometria, vets).
 *
 * Complementa /profile/exportar-mis-datos (export ARCO) — este es la vista
 * "que se compartio con quien", no el dump completo.
 *
 * Llama RPC list_my_data_sharing() (mig 20260920) que devuelve eventos
 * de 5 categorias filtrados por auth.uid().
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Shield, Building2, ShoppingBag, Stethoscope, Camera, Info } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type SharingCategory =
  | 'aseguradora_lead'
  | 'pharma_research_consent'
  | 'paw_shield_training'
  | 'vet_checkin'
  | 'insurance_quote_calculated';

interface SharingEvent {
  category: SharingCategory;
  shared_at: string;
  partner_name: string;
  partner_kind: string;
  details: Record<string, unknown>;
  consent_revocable: boolean;
}

const CATEGORY_META: Record<
  SharingCategory,
  { label: string; description: string; icon: React.ElementType; color: string }
> = {
  aseguradora_lead: {
    label: 'Cotización aseguradora enviada',
    description:
      'Tu nombre, email y teléfono se compartieron con la aseguradora cuando pediste cotización formal.',
    icon: Building2,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  pharma_research_consent: {
    label: 'Datos para investigación pharma',
    description:
      'Activaste el opt-in de data anónima. Solo se comparten datos AGREGADOS — tu nombre y mascota individual nunca se exponen.',
    icon: Shield,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  paw_shield_training: {
    label: 'Imagen biométrica para training',
    description:
      'Aceptaste compartir la huella nasal de tu mascota para mejorar el modelo de identificación biométrica.',
    icon: Camera,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  vet_checkin: {
    label: 'Vet partner identificó tu mascota',
    description:
      'Un veterinario partner usó la API biométrica para identificar a tu mascota en su consulta.',
    icon: Stethoscope,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  insurance_quote_calculated: {
    label: 'Cotización local calculada',
    description:
      'Se calculó una prima estimada localmente basada en raza/edad. NO se envió al partner (solo si lo pediste explícitamente).',
    icon: ShoppingBag,
    color: 'text-slate-700 bg-slate-50 border-slate-200',
  },
};

function CategoryEventsCard({
  category,
  events,
  onRevoke,
}: {
  category: SharingCategory;
  events: SharingEvent[];
  onRevoke?: (event: SharingEvent) => void;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  if (events.length === 0) return null;

  return (
    <Card className={`border ${meta.color}`}>
      <CardHeader>
        <CardTitle className="flex items-start gap-3 text-lg">
          <Icon className="size-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div>{meta.label}</div>
            <p className="text-sm font-normal text-muted-foreground mt-1">{meta.description}</p>
          </div>
          <Badge variant="outline">{events.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((ev, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/60 border border-white"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{ev.partner_name}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(ev.shared_at), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
              </div>
              {/* Mostrar campos clave del details segun categoria */}
              {category === 'aseguradora_lead' && (
                <div className="text-xs mt-2 space-y-0.5">
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    {String(ev.details.contact_email || '-')}
                  </div>
                  {ev.details.contact_phone ? (
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>{' '}
                      {String(ev.details.contact_phone)}
                    </div>
                  ) : null}
                </div>
              )}
              {category === 'pharma_research_consent' && (
                <div className="text-xs mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700">Opt-in activo</Badge>
                </div>
              )}
              {category === 'vet_checkin' && (
                <div className="text-xs mt-2">
                  <Badge variant="outline">{String(ev.details.result || '-')}</Badge>
                  {ev.details.match_score !== undefined && ev.details.match_score !== null && (
                    <span className="ml-2 text-muted-foreground">
                      score: {String(ev.details.match_score)}
                    </span>
                  )}
                </div>
              )}
              {category === 'insurance_quote_calculated' && (
                <div className="text-xs mt-2 text-muted-foreground">
                  Prima mensual estimada: $
                  {Number(ev.details.monthly_premium_clp || 0).toLocaleString('es-CL')} CLP
                </div>
              )}
            </div>
            {ev.consent_revocable && onRevoke && (
              <Button size="sm" variant="outline" onClick={() => onRevoke(ev)}>
                Revocar
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MisDatosCompartidos() {
  const navigate = useNavigate();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-data-sharing'],
    queryFn: async () => {
      const { data, error } = await sb.rpc('list_my_data_sharing');
      if (error) throw error;
      return (data as SharingEvent[]) || [];
    },
  });

  const events = data || [];

  const eventsByCategory = events.reduce<Record<SharingCategory, SharingEvent[]>>(
    (acc, ev) => {
      const cat = ev.category as SharingCategory;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ev);
      return acc;
    },
    {} as Record<SharingCategory, SharingEvent[]>
  );

  const handleRevoke = async (event: SharingEvent) => {
    if (event.category === 'pharma_research_consent') {
      // Toggle off el research consent en profiles
      setRevokingId('research_consent');
      try {
        const { error } = await sb
          .from('profiles')
          .update({ anonymous_data_research_consent: false })
          .eq('id', (await sb.auth.getUser()).data.user?.id);
        if (error) throw error;
        toast.success('Consent revocado', {
          description: 'Tus datos ya no se incluirán en insights agregados pharma.',
        });
        refetch();
      } catch (err) {
        toast.error('Error revocando consent', {
          description: err instanceof Error ? err.message : 'Intenta de nuevo',
        });
      } finally {
        setRevokingId(null);
      }
    } else if (event.category === 'paw_shield_training') {
      // RPC revoke_paw_shield_archive_consent
      const archiveId = event.details.id as string | undefined;
      if (!archiveId) {
        toast.error('No se pudo identificar el archivo a revocar');
        return;
      }
      setRevokingId(archiveId);
      try {
        const { error } = await sb.rpc('revoke_paw_shield_archive_consent', {
          p_archive_id: archiveId,
        });
        if (error) throw error;
        toast.success('Imagen marcada para borrar');
        refetch();
      } catch (err) {
        toast.error('Error revocando consent', {
          description: err instanceof Error ? err.message : 'Intenta de nuevo',
        });
      } finally {
        setRevokingId(null);
      }
    } else if (event.category === 'aseguradora_lead') {
      // RPC revoke_insurance_lead — soft-delete con limpieza de PII (mig 20260930)
      const leadId = event.details.id as string | undefined;
      if (!leadId) {
        toast.error('No se pudo identificar el lead a revocar');
        return;
      }
      setRevokingId(leadId);
      try {
        const { error } = await sb.rpc('revoke_insurance_lead', {
          p_lead_id: leadId,
          p_reason: 'Revocado por el titular vía /mis-datos-compartidos',
        });
        if (error) throw error;
        toast.success('Cotización revocada', {
          description:
            'El partner ya no recibirá tu contacto. Si ya te llamaron, escribinos a pawfriendcl@gmail.com.',
        });
        refetch();
      } catch (err) {
        toast.error('Error revocando lead', {
          description: err instanceof Error ? err.message : 'Intenta de nuevo',
        });
      } finally {
        setRevokingId(null);
      }
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-4">
        <ArrowLeft className="size-4 mr-2" />
        Volver al perfil
      </Button>

      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Mis datos compartidos con partners</h1>
        <p className="text-muted-foreground text-sm">
          Transparencia total sobre qué datos se han compartido con quién, cuándo, y para qué.
          Cumplimiento Ley 21.719 (Reglamento Ley 19.628 vigente 2026).
        </p>
      </div>

      {/* Info banner */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6 flex gap-3">
          <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 space-y-1">
            <p className="font-semibold">Tu derecho a saber</p>
            <p>
              Acá ves cada evento donde Paw Friend compartió información tuya o de tu mascota con un
              partner B2B. Para descargar todos tus datos en JSON, ve a{' '}
              <button
                onClick={() => navigate('/profile/exportar-mis-datos')}
                className="underline font-medium"
              >
                Exportar mis datos
              </button>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Shield className="size-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Ningún dato compartido aún</h3>
            <p className="text-sm text-muted-foreground">
              No hemos compartido tu información con ningún partner B2B. Cuando lo hagas (pedir
              cotización seguro, opt-in pharma, etc), aparecerá acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <CategoryEventsCard
            category="aseguradora_lead"
            events={eventsByCategory.aseguradora_lead || []}
            onRevoke={handleRevoke}
          />
          <CategoryEventsCard
            category="pharma_research_consent"
            events={eventsByCategory.pharma_research_consent || []}
            onRevoke={handleRevoke}
          />
          <CategoryEventsCard
            category="paw_shield_training"
            events={eventsByCategory.paw_shield_training || []}
            onRevoke={handleRevoke}
          />
          <CategoryEventsCard category="vet_checkin" events={eventsByCategory.vet_checkin || []} />
          <CategoryEventsCard
            category="insurance_quote_calculated"
            events={eventsByCategory.insurance_quote_calculated || []}
          />
        </div>
      )}

      {/* Disabled state si revoking */}
      {revokingId && (
        <div className="text-xs text-muted-foreground mt-4">Procesando revocación...</div>
      )}
    </div>
  );
}
