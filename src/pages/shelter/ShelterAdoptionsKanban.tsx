/**
 * /shelter/adopciones — Kanban de procesos de adopción del refugio.
 *
 * 7 columnas (interested → contacted → visit_scheduled → visit_done →
 *             approved → transferred + columna rejected al costado).
 *
 * Cada card es un proceso. Click → dialog para cambiar status, agendar visita,
 * agregar notas, motivar rechazo.
 *
 * Ver REFACTOR_ADOPCION_2026_04_24.md §3.3.
 */
import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useShelter } from '@/hooks/useShelter';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PawPrint, Calendar, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  useShelterProcesses,
  useUpdateAdoptionProcess,
  STATUS_LABELS,
  type AdoptionProcessStatus,
  type AdoptionProcessWithPet,
} from '@/hooks/useAdoptionProcesses';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';
import { supabase } from '@/integrations/supabase/client';

const COLUMN_ORDER: AdoptionProcessStatus[] = [
  'interested',
  'contacted',
  'visit_scheduled',
  'visit_done',
  'approved',
  'transferred',
];

export default function ShelterAdoptionsKanban() {
  const navigate = useNavigate();
  const flagEnabled = isFeatureEnabled('ADOPTION_PROCESSES_V1');
  const { shelter, isLoading: isLoadingShelter } = useShelter();
  const { data: processes, isLoading: isLoadingProcesses } = useShelterProcesses(shelter?.id);
  const [selectedProcess, setSelectedProcess] = useState<AdoptionProcessWithPet | null>(null);

  useEffect(() => {
    if (flagEnabled && shelter?.id) {
      trackRefactor(RefactorEvent.shelterKanbanViewed, { shelter_id: shelter.id });
    }
  }, [flagEnabled, shelter?.id]);

  const grouped = useMemo(() => {
    const groups: Record<AdoptionProcessStatus, AdoptionProcessWithPet[]> = {
      interested: [],
      contacted: [],
      visit_scheduled: [],
      visit_done: [],
      approved: [],
      transferred: [],
      rejected: [],
    };
    (processes ?? []).forEach((p) => {
      groups[p.status].push(p);
    });
    return groups;
  }, [processes]);

  if (!flagEnabled) {
    return <Navigate to="/shelter/dashboard" replace />;
  }

  if (isLoadingShelter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!shelter) {
    return <Navigate to="/onboarding-shelter" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Adopciones · {shelter.legal_name}</title>
      </Helmet>

      <PageHeader
        title="Adopciones"
        subtitle="Procesos de adopción en curso"
        onBack={() => navigate('/shelter/dashboard')}
      />

      <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-4">
        {isLoadingProcesses ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : !processes || processes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Kanban scrolleable horizontalmente */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {COLUMN_ORDER.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    items={grouped[status]}
                    onClick={(p) => setSelectedProcess(p)}
                  />
                ))}
              </div>
            </div>

            {grouped.rejected.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-red-700 mb-2">
                  Rechazados ({grouped.rejected.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {grouped.rejected.map((p) => (
                    <ProcessMiniCard key={p.id} process={p} onClick={() => setSelectedProcess(p)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProcess && (
        <ProcessDialog process={selectedProcess} onClose={() => setSelectedProcess(null)} />
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  items,
  onClick,
}: {
  status: AdoptionProcessStatus;
  items: AdoptionProcessWithPet[];
  onClick: (p: AdoptionProcessWithPet) => void;
}) {
  return (
    <div className="w-72 flex-shrink-0 bg-muted/30 rounded-lg p-2 space-y-2">
      <div className="px-2 py-1 flex items-center justify-between">
        <h4 className="font-semibold text-sm">{STATUS_LABELS[status]}</h4>
        <Badge variant="outline" className="text-[10px]">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">Sin procesos</div>
        ) : (
          items.map((p) => <ProcessMiniCard key={p.id} process={p} onClick={() => onClick(p)} />)
        )}
      </div>
    </div>
  );
}

function ProcessMiniCard({
  process,
  onClick,
}: {
  process: AdoptionProcessWithPet;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-md bg-card border p-3 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-2">
        <div className="h-12 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
          {process.pet?.photo_url ? (
            <img
              src={process.pet.photo_url}
              alt={process.pet.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">
            {process.pet?.name ?? 'Mascota'}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">{process.pet?.species}</p>
        </div>
      </div>
      {process.visit_date && process.status === 'visit_scheduled' && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-700">
          <Calendar className="h-3 w-3" />
          {new Date(process.visit_date).toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
          })}
        </div>
      )}
    </button>
  );
}

function ProcessDialog({
  process,
  onClose,
}: {
  process: AdoptionProcessWithPet;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<AdoptionProcessStatus>(process.status);
  const [notes, setNotes] = useState(process.notes_shelter ?? '');
  const [visitDate, setVisitDate] = useState(
    process.visit_date ? process.visit_date.slice(0, 16) : ''
  );
  const [rejectedReason, setRejectedReason] = useState(process.rejected_reason ?? '');

  const { mutate: update, isPending } = useUpdateAdoptionProcess();
  const statusChanged = status !== process.status;

  /**
   * Después del UPDATE exitoso, si el status cambió, dispara email al adopter
   * vía edge fn `send-adoption-status-email`. Best-effort: si falla el email
   * no bloqueamos el cambio de status (ya guardado en DB).
   */
  const sendStatusEmail = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;
      const supabaseUrl =
        (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
        'https://gwailbjlvevkhwcrovfd.supabase.co';
      await fetch(`${supabaseUrl}/functions/v1/send-adoption-status-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ process_id: process.id, new_status: status }),
      });
    } catch (err) {
      console.warn('send-adoption-status-email failed:', err);
    }
  };

  const handleSave = () => {
    update(
      {
        id: process.id,
        status,
        notes_shelter: notes,
        visit_date:
          status === 'visit_scheduled' && visitDate ? new Date(visitDate).toISOString() : null,
        rejected_reason: status === 'rejected' ? rejectedReason : null,
      },
      {
        onSuccess: () => {
          trackRefactor(RefactorEvent.adoptionProcessStatusChanged, {
            from: process.status,
            to: status,
          });
          // Disparar email solo si el status cambió (notes-only updates no
          // valen un email)
          if (statusChanged) {
            void sendStatusEmail();
          }
          if (status === 'transferred') {
            trackRefactor(RefactorEvent.adoptionProcessTransferred);
            toast.info('La mascota fue transferida. Se envió el link al adoptante.');
          }
          toast.success(`Estado actualizado: ${STATUS_LABELS[status]}`);
          onClose();
        },
        onError: (err: Error) => {
          toast.error(err.message || 'No pudimos actualizar el proceso.');
        },
      }
    );
  };

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{process.pet?.name ?? 'Mascota'}</DialogTitle>
          <DialogDescription>Actualizá el estado y añadí notas sobre el proceso.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="adoption-process-status" className="text-xs font-medium mb-1 block">
              Estado
            </label>
            <Select value={status} onValueChange={(v) => setStatus(v as AdoptionProcessStatus)}>
              <SelectTrigger id="adoption-process-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([s, label]) => (
                  <SelectItem key={s} value={s}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'visit_scheduled' && (
            <div>
              <label htmlFor="adoption-process-visit" className="text-xs font-medium mb-1 block">
                Fecha y hora de visita
              </label>
              <Input
                id="adoption-process-visit"
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
          )}

          {status === 'rejected' && (
            <div>
              <label htmlFor="adoption-process-reason" className="text-xs font-medium mb-1 block">
                Motivo del rechazo
              </label>
              <Textarea
                id="adoption-process-reason"
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                placeholder="Por qué no avanza esta adopción..."
                rows={3}
              />
            </div>
          )}

          <div>
            <label htmlFor="adoption-process-notes" className="text-xs font-medium mb-1 block">
              Notas internas
            </label>
            <Textarea
              id="adoption-process-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas para tu equipo o para el adoptante..."
              rows={3}
            />
          </div>

          {status === 'transferred' && (
            <div className="text-sm bg-emerald-50 border border-emerald-200 rounded p-3">
              <p className="font-medium text-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Al confirmar
              </p>
              <p className="text-emerald-700 text-xs mt-1">
                Se va a enviar un link al adoptante para que reclame a {process.pet?.name} en su
                cuenta. La ficha clínica se transfiere completa.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="gap-1">
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                Guardar <ArrowRight className="h-3 w-3" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <div className="inline-flex h-14 w-14 rounded-full bg-purple-100 items-center justify-center">
          <Heart className="h-7 w-7 text-purple-600" />
        </div>
        <h3 className="font-semibold">Sin procesos de adopción todavía</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Cuando un adoptante exprese interés en una de tus mascotas, aparecerá aquí. Vas a poder
          mover el proceso desde "Interesado" hasta "Transferido".
        </p>
      </CardContent>
    </Card>
  );
}
