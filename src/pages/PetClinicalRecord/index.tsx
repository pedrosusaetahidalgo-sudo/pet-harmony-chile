import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReminders } from '@/hooks/useReminders';

import {
  Heart,
  Shield,
  Stethoscope,
  FileText,
  Share2,
  AlertTriangle,
  Dog,
  Calendar,
  Activity,
  Clipboard,
  Clock,
  Download,
  Plus,
  Syringe,
  Camera,
  Leaf,
  ClipboardList,
  Sparkles,
} from '@/lib/icons';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PetAssistant } from '@/components/ai/PetAssistant';
import { SymptomTriage } from '@/components/ai/SymptomTriage';
import { NutritionCoach } from '@/components/ai/NutritionCoach';
import { WoundVision } from '@/components/ai/WoundVision';
import { ConsultationPrep } from '@/components/ai/ConsultationPrep';
import { MemorialFlow } from '@/components/memorial/MemorialFlow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import type { PetData } from './types';
import { ClinicalRecordSkeleton, PetHeader } from './shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { TabResumen } from './tabs/TabResumen';
import { TabHistorial } from './tabs/TabHistorial';
import { TabAlimentacion } from './tabs/TabAlimentacion';
import { TabDocumentos } from './tabs/TabDocumentos';
import { TabCompartir } from './tabs/TabCompartir';
import { TabVacunas } from './tabs/TabVacunas';
import { ViewTutorial, TUTORIALS } from '@/components/ViewTutorial';
import { generatePDF } from './pdf';
import { useVetClinicalNotesByPet } from '@/hooks/useVetClinicalNotes';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LINKS } from '@/lib/links';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { MedicalSummaryButton } from '@/components/medical/MedicalSummaryButton';
import { AddMedicalRecord } from '@/components/AddMedicalRecord';
import { VaccinationCardOCR } from '@/components/onboarding/VaccinationCardOCR';
import { FileDown } from '@/lib/icons';
import { VetActionsBar } from './VetActionsBar';
import { VetQuickNotes } from '@/components/provider/VetQuickNotes';
import { VetFichaView } from './VetFichaView';

const PetClinicalRecord = () => {
  const { petId } = useParams<{ petId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { addReminder } = useReminders();
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [activeAITool, setActiveAITool] = useState<
    'none' | 'triage' | 'nutrition' | 'wound' | 'prep'
  >('none');
  const [showMemorialFlow, setShowMemorialFlow] = useState(false);

  const {
    data: pet,
    isLoading: petLoading,
    error,
    refetch: refetchPet,
  } = useQuery({
    queryKey: ['pet-clinical', petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await supabase.from('pets').select('*').eq('id', petId).maybeSingle();
      if (error) throw error;
      return data as unknown as PetData | null;
    },
    enabled: !!petId && !authLoading,
  });

  const { data: userPets } = useQuery({
    queryKey: ['user-pets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, photo_url')
        .eq('owner_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ['pet-medical-records-pdf', petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date', { ascending: false });
      return data || [];
    },
    enabled: !!petId && !authLoading,
  });

  // Vet clinical notes — used for PDF generation
  const { data: vetNotesForPdf } = useVetClinicalNotesByPet(petId);

  // Vet access check: embedded in pet query to avoid adding a new hook
  // (adding useQuery here caused React #310 in prod due to hook count mismatch
  // with the existing cached component tree).
  const [isLinkedVet, setIsLinkedVet] = useState(false);
  const [vetCheckDone, setVetCheckDone] = useState(false);
  const [vetProviderId, setVetProviderId] = useState<string | null>(null);
  const [vetShareTokenId, setVetShareTokenId] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');

  // ?mode=vet forces vet view (used by provider navigation links)
  const forceVetMode = searchParams.get('mode') === 'vet';

  // B7: auto-open recorder with ?grabar=1 (must be before early returns to respect Rules of Hooks)
  const isOwner = pet?.owner_id === user?.id;
  const viewMode: 'owner' | 'vet' =
    forceVetMode && vetProviderId ? 'vet' : isOwner ? 'owner' : 'vet';

  useEffect(() => {
    if (viewMode === 'vet' && searchParams.get('grabar') === '1') {
      setShowRecorder(true);
    }
  }, [viewMode, searchParams]);

  useEffect(() => {
    if (!pet || !user?.id) {
      setVetCheckDone(true);
      return;
    }
    // Skip vet check only if owner AND not forcing vet mode
    if (pet.owner_id === user.id && !forceVetMode) {
      setVetCheckDone(true);
      return;
    }
    // Non-owner or forced vet mode: check if linked vet
    (async () => {
      try {
        const { data: provider } = await supabase
          .from('service_providers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (provider?.id) {
          const { data: link } = await supabase
            .from('pet_vet_links')
            .select('id')
            .eq('pet_id', pet.id)
            .eq('provider_id', provider.id)
            .eq('status', 'active')
            .maybeSingle();
          setIsLinkedVet(!!link);
          if (link) {
            setVetProviderId(provider.id);
            // Fetch active share token for this vet+pet
            const { data: token } = await supabase
              .from('medical_share_tokens')
              .select('id')
              .eq('pet_id', pet.id)
              .eq('target_provider_id', provider.id)
              .eq('is_revoked', false)
              .maybeSingle();
            if (token) setVetShareTokenId(token.id);
          }
        }
      } catch {
        // fail closed
      } finally {
        setVetCheckDone(true);
      }
    })();
  }, [pet?.id, user?.id, pet?.owner_id, forceVetMode]);

  if (authLoading || petLoading) {
    return <ClinicalRecordSkeleton />;
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          variant="card"
          icon={AlertTriangle}
          title="Error al cargar"
          description="No se pudo cargar la ficha clínica. Intenta nuevamente."
        />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          variant="card"
          icon={Dog}
          title="Mascota no encontrada"
          description="No se encontro la mascota solicitada o no tienes permisos para verla."
        />
      </div>
    );
  }

  if ((!isOwner || forceVetMode) && !vetCheckDone) {
    return <ClinicalRecordSkeleton />;
  }

  if (!isOwner && !isLinkedVet) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          variant="card"
          icon={Shield}
          title="Acceso restringido"
          description="Solo el dueño o un veterinario vinculado puede ver esta ficha clínica."
        />
      </div>
    );
  }

  // Vet view: completely different layout
  if (viewMode === 'vet' && vetProviderId) {
    return (
      <VetFichaView
        pet={pet}
        vetNotes={vetNotesForPdf || []}
        providerId={vetProviderId}
        shareTokenId={vetShareTokenId}
        onGeneratePDF={() => generatePDF(pet, medicalRecords, vetNotesForPdf)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`Ficha de ${pet.name}`}
        subtitle={`${pet.species}${pet.breed ? ` · ${pet.breed}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {viewMode === 'owner' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/edit-pet/${pet.id}`)}
                className="h-8 text-xs gap-1.5"
              >
                <Clipboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
            <MedicalSummaryButton
              petId={pet.id}
              petName={pet.name}
              bypassGate={viewMode === 'vet'}
            />
          </div>
        }
      >
        <Breadcrumbs
          items={
            viewMode === 'vet'
              ? [
                  { label: 'Pacientes', to: LINKS.providerPatients() },
                  { label: pet.name },
                  { label: 'Ficha clínica' },
                ]
              : [
                  { label: 'Mascotas', to: LINKS.myPets() },
                  { label: pet.name },
                  { label: 'Ficha clínica' },
                ]
          }
        />
      </PageHeader>
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Pet selector (multiple pets) */}
        {viewMode === 'owner' && userPets && userPets.length > 1 && (
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Mascota:</Label>
            <Select value={petId} onValueChange={(id) => navigate(LINKS.petClinical(id))}>
              <SelectTrigger className="w-full sm:w-[200px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userPets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Compact pet card */}
        <PetHeader pet={pet} />

        {/* Quick actions bar */}
        {viewMode === 'owner' && (
          <div className="flex items-center gap-2 flex-wrap">
            <AddMedicalRecord
              petId={pet.id}
              petBreed={pet.breed || ''}
              petSpecies={pet.species}
              petName={pet.name}
            />
            <AddReminderDialog
              open={showReminderForm}
              onOpenChange={setShowReminderForm}
              petId={pet.id}
              onSubmit={(data) => addReminder.mutate(data)}
              trigger={
                <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Recordatorio
                </Button>
              }
            />
            <VaccinationCardOCR
              petId={pet.id}
              onSaved={() =>
                queryClient.invalidateQueries({ queryKey: ['pet-medical-records-pdf', petId] })
              }
            />
          </div>
        )}

        {/* AI Tools — prominent banner above tabs */}
        {viewMode === 'owner' && (
          <>
            {showAssistant ? (
              <PetAssistant
                petId={pet.id}
                petName={pet.name}
                onClose={() => setShowAssistant(false)}
              />
            ) : activeAITool !== 'none' ? (
              <div className="space-y-2">
                {activeAITool === 'triage' && (
                  <SymptomTriage
                    petId={pet.id}
                    petName={pet.name}
                    onClose={() => setActiveAITool('none')}
                    onShowDirectory={() => navigate('/veterinarios')}
                  />
                )}
                {activeAITool === 'nutrition' && (
                  <NutritionCoach petId={pet.id} petName={pet.name} />
                )}
                {activeAITool === 'wound' && (
                  <WoundVision
                    petId={pet.id}
                    petName={pet.name}
                    onShowDirectory={() => navigate('/veterinarios')}
                  />
                )}
                {activeAITool === 'prep' && (
                  <ConsultationPrep petId={pet.id} petName={pet.name} />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setActiveAITool('none')}
                >
                  Volver a herramientas
                </Button>
              </div>
            ) : (
              <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/40 overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                        IA para {pet.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Herramientas inteligentes de salud
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setShowAssistant(true)}
                      className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl bg-white/80 border border-indigo-100/60 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <Stethoscope className="h-5 w-5 text-indigo-600" />
                      <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight">Asistente</span>
                    </button>
                    <button
                      onClick={() => setActiveAITool('triage')}
                      className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl bg-white/80 border border-blue-100/60 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight">Triage</span>
                    </button>
                    <button
                      onClick={() => setActiveAITool('nutrition')}
                      className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl bg-white/80 border border-green-100/60 hover:bg-white hover:border-green-200 hover:shadow-sm transition-all"
                    >
                      <Leaf className="h-5 w-5 text-green-600" />
                      <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight">Nutricion</span>
                    </button>
                    <button
                      onClick={() => setActiveAITool('wound')}
                      className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl bg-white/80 border border-orange-100/60 hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all"
                    >
                      <Camera className="h-5 w-5 text-orange-600" />
                      <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight">Foto herida</span>
                    </button>
                    <button
                      onClick={() => setActiveAITool('prep')}
                      className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl bg-white/80 border border-purple-100/60 hover:bg-white hover:border-purple-200 hover:shadow-sm transition-all"
                    >
                      <ClipboardList className="h-5 w-5 text-purple-600" />
                      <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight">Consulta</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Tabs — main content navigation */}
        <Tabs id="clinical-tabs" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative">
            <TabsList
              className={`flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-1 px-1 sm:grid ${viewMode === 'vet' ? 'sm:grid-cols-5' : 'sm:grid-cols-6'}`}
            >
              <TabsTrigger
                value="resumen"
                className="shrink-0 snap-start text-xs sm:text-sm min-h-[40px] touch-manipulation"
              >
                <Heart className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="vacunas"
                className="shrink-0 snap-start text-xs sm:text-sm min-h-[40px] touch-manipulation"
              >
                <Syringe className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
                Vacunas
              </TabsTrigger>
              <TabsTrigger
                value="historial"
                className="shrink-0 snap-start text-xs sm:text-sm min-h-[40px] touch-manipulation"
              >
                <Clock className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
                Historial
              </TabsTrigger>
              <TabsTrigger
                value="alimentacion"
                className="shrink-0 snap-start text-xs sm:text-sm min-h-[40px] touch-manipulation"
              >
                <Activity className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
                Habitos
              </TabsTrigger>
              <TabsTrigger
                value="documentos"
                className="shrink-0 snap-start text-xs sm:text-sm min-h-[40px] touch-manipulation"
              >
                <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
                Documentos
              </TabsTrigger>
              {viewMode === 'owner' && (
                <TabsTrigger
                  value="compartir"
                  className="shrink-0 snap-start text-xs sm:text-sm min-h-[40px] touch-manipulation"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
                  Compartir
                </TabsTrigger>
              )}
            </TabsList>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
          </div>

          <TabsContent value="resumen" className="mt-4 space-y-4">
            <TabResumen pet={pet} onRefresh={() => refetchPet()} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="vacunas" className="mt-4">
            <TabVacunas petId={pet.id} />
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <TabHistorial petId={pet.id} />
          </TabsContent>

          <TabsContent value="alimentacion" className="mt-4">
            <TabAlimentacion pet={pet} onRefresh={() => refetchPet()} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="documentos" className="mt-4">
            <TabDocumentos petId={pet.id} viewMode={viewMode} petOwnerId={pet.owner_id} />
          </TabsContent>

          {viewMode === 'owner' && (
            <TabsContent value="compartir" className="mt-4">
              <TabCompartir petId={pet.id} petName={pet.name} />
            </TabsContent>
          )}
        </Tabs>


        {/* PawPoints nudge — subtle, at the bottom */}
        {viewMode === 'owner' && (
          <div
            className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100/50 cursor-pointer hover:bg-purple-50 transition-colors"
            onClick={() => navigate('/paw-game')}
          >
            <span className="text-base">🐾</span>
            <p className="text-[11px] text-purple-600 flex-1">
              Completa la ficha de {pet.name} y gana <strong>30 PawPoints</strong>
            </p>
            <span className="text-[10px] text-purple-400 font-medium flex-shrink-0">Ver →</span>
          </div>
        )}

        {/* Tutorial floating button */}
        <ViewTutorial {...TUTORIALS.fichaClinical} />

        {/* Memorial entry point (owner only) */}
        {viewMode === 'owner' && pet.lifecycle_status !== 'memorial' && (
          <Card className="border-dashed border-purple-200/60 bg-purple-50/20 mt-4">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-purple-300" />
                <span className="text-sm text-muted-foreground">
                  Si {pet.name} ya no está contigo...
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMemorialFlow(true)}
                className="text-xs text-purple-400 hover:text-purple-600"
              >
                Crear memorial
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Memorial flow dialog (owner only) */}
        {viewMode === 'owner' && showMemorialFlow && (
          <Dialog open={showMemorialFlow} onOpenChange={setShowMemorialFlow}>
            <DialogContent className="max-w-lg">
              <MemorialFlow
                petId={pet.id}
                petName={pet.name}
                onComplete={() => {
                  setShowMemorialFlow(false);
                  navigate('/en-memoria');
                }}
                onCancel={() => setShowMemorialFlow(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Vet quick notes */}
        {viewMode === 'vet' && vetProviderId && (
          <VetQuickNotes petId={pet.id} providerId={vetProviderId} petName={pet.name} />
        )}

        {/* Vet actions bar */}
        {viewMode === 'vet' && vetProviderId && (
          <VetActionsBar
            petId={pet.id}
            petName={pet.name}
            petSpecies={pet.species}
            providerId={vetProviderId}
            shareTokenId={vetShareTokenId}
            showRecorder={showRecorder}
            onRecorderChange={setShowRecorder}
            onSwitchTab={(tab) => {
              setActiveTab(tab);
              // Scroll the tabs area into view after switching
              const tabsArea = document.getElementById('clinical-tabs');
              tabsArea?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}

        {/* Memorial badge for memorial pets */}
        {pet.lifecycle_status === 'memorial' && (
          <Card className="border-purple-100 bg-purple-50/30">
            <CardContent className="p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-purple-400">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">En nuestro corazón</span>
              </div>
              {pet.memorial_message && (
                <p className="text-sm text-muted-foreground italic">"{pet.memorial_message}"</p>
              )}
              <p className="text-xs text-muted-foreground">
                La ficha clínica de {pet.name} se preserva con cuidado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PetClinicalRecord;
