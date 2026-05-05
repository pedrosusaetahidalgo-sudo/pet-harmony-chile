/**
 * RecordConsultationLauncher — abre el ConsultationRecorderModal desde el
 * dashboard del vet sin requerir entrar al detalle de un paciente.
 *
 * Flujo:
 *   1. user toca el boton Mic del dashboard.
 *   2. se abre un dialog con los 8 pacientes mas recientes (notas clinicas
 *      + vinculaciones activas) + un boton "Otro paciente" que lleva al
 *      buscador de /provider/pacientes.
 *   3. al elegir un paciente se cierra el picker y se abre directamente
 *      ConsultationRecorderModal con ese pet.
 *
 * Bug que resuelve (feedback Pedro 2026-05-05): el boton del dashboard solo
 * cambiaba el activeTab a 'clinico' (ProviderDashboard.tsx:126) y nunca
 * abria el recorder, asi que aparentaba estar roto.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Mic, Search } from '@/lib/icons';
import { ConsultationRecorderModal } from './ConsultationRecorderModal';

interface RecentPatient {
  pet_id: string;
  pet_name: string;
  species: string | null;
  photo_url: string | null;
  last_seen: string;
}

interface RecordConsultationLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string | null | undefined;
}

export function RecordConsultationLauncher({
  open,
  onOpenChange,
  providerId,
}: RecordConsultationLauncherProps) {
  const navigate = useNavigate();
  const [target, setTarget] = useState<RecentPatient | null>(null);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['record-launcher-recent-patients', providerId],
    queryFn: async () => {
      if (!providerId) return [] as RecentPatient[];
      const map = new Map<string, RecentPatient>();

      // Notas clinicas recientes (90 dias) — la fuente mas honesta de pacientes activos.
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: notes } = await supabase
        .from('vet_clinical_notes')
        .select('pet_id, created_at, pets(name, species, photo_url)')
        .eq('provider_id', providerId)
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(40);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const note of (notes || []) as any[]) {
        const pid = note.pet_id as string;
        if (map.has(pid)) continue;
        map.set(pid, {
          pet_id: pid,
          pet_name: note.pets?.name ?? 'Mascota',
          species: note.pets?.species ?? null,
          photo_url: note.pets?.photo_url ?? null,
          last_seen: note.created_at,
        });
        if (map.size >= 8) break;
      }

      // Vinculaciones activas como complemento si quedan slots libres.
      if (map.size < 8) {
        const { data: links } = await supabase
          .from('pet_vet_links')
          .select('pet_id, responded_at, pets(name, species, photo_url)')
          .eq('provider_id', providerId)
          .eq('status', 'active')
          .order('responded_at', { ascending: false })
          .limit(20);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const link of (links || []) as any[]) {
          const pid = link.pet_id as string;
          if (map.has(pid)) continue;
          map.set(pid, {
            pet_id: pid,
            pet_name: link.pets?.name ?? 'Mascota',
            species: link.pets?.species ?? null,
            photo_url: link.pets?.photo_url ?? null,
            last_seen: link.responded_at,
          });
          if (map.size >= 8) break;
        }
      }

      return Array.from(map.values());
    },
    enabled: !!providerId && open,
    staleTime: 60 * 1000,
  });

  const handlePickPatient = (p: RecentPatient) => {
    setTarget(p);
    onOpenChange(false);
  };

  const handleClosePicker = () => onOpenChange(false);

  const handleCloseRecorder = (next: boolean) => {
    if (!next) setTarget(null);
  };

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClosePicker();
        }}
        title="Grabar consulta"
        description="Elige el paciente y empezá a grabar."
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          {!providerId && (
            <div className="text-sm text-muted-foreground p-3 bg-amber-50 border border-amber-200 rounded">
              Necesitas un perfil de profesional para grabar consultas. Completá tu perfil primero.
            </div>
          )}

          {providerId && isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {providerId && !isLoading && patients && patients.length === 0 && (
            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded">
              Aun no tenes pacientes activos. Buscá uno desde la lista completa.
            </div>
          )}

          {providerId && !isLoading && patients && patients.length > 0 && (
            <div className="divide-y divide-border/50 max-h-[50vh] overflow-y-auto -mx-1">
              {patients.map((p) => (
                <button
                  key={p.pet_id}
                  type="button"
                  onClick={() => handlePickPatient(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded transition-colors text-left"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.photo_url ?? undefined} alt={p.pet_name} />
                    <AvatarFallback className="text-xs bg-red-50 text-red-600">
                      {p.pet_name[0]?.toUpperCase() ?? 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.pet_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.species ?? 'Mascota'}
                    </p>
                  </div>
                  <Mic className="h-4 w-4 text-red-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              handleClosePicker();
              navigate('/provider/pacientes');
            }}
          >
            <Search className="h-4 w-4" />
            Buscar otro paciente
          </Button>
        </div>
      </ResponsiveModal>

      {target && providerId && (
        <ConsultationRecorderModal
          open={!!target}
          onOpenChange={handleCloseRecorder}
          providerId={providerId}
          petId={target.pet_id}
          petName={target.pet_name}
          petSpecies={target.species ?? undefined}
        />
      )}
    </>
  );
}
