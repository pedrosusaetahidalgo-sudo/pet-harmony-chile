import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertTriangle,
  Pill,
  Activity,
  Shield,
  Scale,
  ChevronDown,
  User,
  Phone,
  Mail,
  Stethoscope,
  FileText,
  Mic,
  ClipboardList,
  Info,
} from '@/lib/icons';
import { calculateAge } from './helpers';
import { getSpeciesIcon } from './shared';
import { VetActionsHeader } from './VetActionsHeader';
import { VetClinicalTimeline } from './VetClinicalTimeline';
import { VetPatientSidebar } from './VetPatientSidebar';
import { getPatientStatus } from '@/hooks/usePatientStatus';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LINKS } from '@/lib/links';
import type { PetData } from './types';
import type { VetClinicalNote } from '@/hooks/useVetClinicalNotes';

interface VetFichaViewProps {
  pet: PetData;
  vetNotes: VetClinicalNote[];
  providerId: string;
  shareTokenId?: string | null;
  onGeneratePDF: () => void;
}

export function VetFichaView({
  pet,
  vetNotes,
  providerId,
  shareTokenId,
  onGeneratePDF,
}: VetFichaViewProps) {
  const navigate = useNavigate();
  const vitalsRef = useRef<HTMLDivElement>(null);

  const age = pet.birth_date ? calculateAge(pet.birth_date) : null;
  const genderLabel =
    pet.gender === 'male' || pet.gender === 'Macho'
      ? 'Macho'
      : pet.gender === 'female' || pet.gender === 'Hembra'
        ? 'Hembra'
        : pet.gender;

  // Fetch owner info
  const { data: ownerProfile } = useQuery({
    queryKey: ['pet-owner-profile', pet.owner_id],
    queryFn: async () => {
      if (!pet.owner_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, phone, email')
        .eq('id', pet.owner_id)
        .maybeSingle();
      return data;
    },
    enabled: !!pet.owner_id,
    staleTime: 10 * 60 * 1000,
  });

  // Alerts
  const allergies = [
    ...(pet.allergies_food || []),
    ...(pet.allergies_medication || []),
    ...(pet.allergies_environmental || []),
  ];
  const medications = pet.current_medications || [];
  const chronicConditions = pet.chronic_conditions_detail
    ? Object.keys(pet.chronic_conditions_detail)
    : [];

  // Get latest followup from notes
  const latestFollowup = vetNotes
    ?.filter((n) => n.followup_date)
    .sort((a, b) => new Date(b.followup_date!).getTime() - new Date(a.followup_date!).getTime())[0];

  const statusInfo = getPatientStatus(
    pet.last_vet_visit || vetNotes?.[0]?.created_at || null,
    latestFollowup?.followup_date ?? null
  );

  // Quick overview data points
  const overviewItems = [
    { label: 'Especie', value: pet.species },
    { label: 'Raza', value: pet.breed },
    { label: 'Sexo', value: genderLabel },
    { label: 'Edad', value: age },
    { label: 'Peso', value: pet.weight ? `${pet.weight} kg` : null },
    { label: 'Tamano', value: pet.size },
    { label: 'Color', value: pet.color },
    { label: 'Esterilizado', value: pet.neutered != null ? (pet.neutered ? 'Si' : 'No') : null },
    { label: 'Microchip', value: pet.microchip_number },
    { label: 'Tipo sangre', value: pet.blood_type },
    { label: 'Entorno', value: pet.living_environment },
    { label: 'Actividad', value: pet.activity_level },
  ].filter((i) => i.value);

  const hasAlerts = allergies.length > 0 || medications.length > 0 || chronicConditions.length > 0;
  const hasNotes = pet.behavior_notes || pet.medical_notes || pet.special_needs || pet.bio;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={`Ficha clinica de ${pet.name}`} subtitle="Vista profesional">
        <Breadcrumbs
          items={[
            { label: 'Pacientes', to: LINKS.providerPatients() },
            { label: pet.name },
            { label: 'Ficha clinica' },
          ]}
        />
      </PageHeader>

      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {/* ═══ Clinical Header Card ═══ */}
        <Card>
          <CardContent className="p-4 md:p-5 space-y-4">
            {/* Row 1: Pet identity + Owner info */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-2 ring-teal-200 flex-shrink-0">
                  <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-bold">
                    {pet.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${statusInfo.dotClass}`}
                  title={statusInfo.label}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{pet.name}</h1>
                  {getSpeciesIcon(pet.species)}
                  <Badge variant="outline" className={`text-[10px] ${statusInfo.bgClass}`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pet.breed || pet.species}
                  {genderLabel ? ` · ${genderLabel}` : ''}
                  {age ? ` · ${age}` : ''}
                  {pet.weight ? ` · ${pet.weight} kg` : ''}
                </p>
                {pet.microchip_number && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Shield className="h-3 w-3" />
                    <span className="font-mono text-[11px]">{pet.microchip_number}</span>
                  </p>
                )}

                {/* Owner contact info */}
                {(ownerProfile || pet.owner_id) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                    {ownerProfile?.display_name && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="font-medium text-foreground">
                          {ownerProfile.display_name}
                        </span>
                      </span>
                    )}
                    {ownerProfile?.phone && (
                      <a
                        href={`tel:${ownerProfile.phone}`}
                        className="flex items-center gap-1 text-teal-600 hover:text-teal-800"
                      >
                        <Phone className="h-3 w-3" />
                        {ownerProfile.phone}
                      </a>
                    )}
                    {ownerProfile?.email && (
                      <a
                        href={`mailto:${ownerProfile.email}`}
                        className="flex items-center gap-1 text-teal-600 hover:text-teal-800"
                      >
                        <Mail className="h-3 w-3" />
                        {ownerProfile.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Alert cards — only show if there are alerts */}
            {hasAlerts && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {allergies.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">
                        Alergias
                      </p>
                      <p className="text-xs text-red-600">{allergies.join(', ')}</p>
                    </div>
                  </div>
                )}
                {medications.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <Pill className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                        Farmacos
                      </p>
                      <p className="text-xs text-blue-600">
                        {medications
                          .map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ''}`)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {chronicConditions.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                    <Activity className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider">
                        Cronico
                      </p>
                      <p className="text-xs text-orange-600">{chronicConditions.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 3: Actions */}
            <VetActionsHeader
              petId={pet.id}
              petName={pet.name}
              petSpecies={pet.species}
              providerId={providerId}
              shareTokenId={shareTokenId}
              onGeneratePDF={onGeneratePDF}
              onScrollToVitals={() =>
                vitalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            />
          </CardContent>
        </Card>

        {/* ═══ Quick Overview Grid — always visible ═══ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-semibold">Datos del paciente</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
              {overviewItems.map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-xs font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Notes from owner — show if any */}
            {hasNotes && (
              <div className="mt-3 pt-3 border-t space-y-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Notas del dueno
                  </span>
                </div>
                {pet.bio && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Bio:</span> {pet.bio}
                  </p>
                )}
                {pet.behavior_notes && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Comportamiento:</span>{' '}
                    {pet.behavior_notes}
                  </p>
                )}
                {pet.medical_notes && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Notas medicas:</span>{' '}
                    {pet.medical_notes}
                  </p>
                )}
                {pet.special_needs && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Necesidades especiales:</span>{' '}
                    {pet.special_needs}
                  </p>
                )}
              </div>
            )}

            {/* Emergency contact */}
            {(pet.emergency_vet_name || pet.emergency_vet_phone || pet.preferred_clinic) && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Contacto de emergencia
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  {pet.emergency_vet_name && (
                    <span>
                      <span className="text-muted-foreground">Vet: </span>
                      <span className="font-medium">{pet.emergency_vet_name}</span>
                    </span>
                  )}
                  {pet.emergency_vet_phone && (
                    <a
                      href={`tel:${pet.emergency_vet_phone}`}
                      className="text-teal-600 hover:underline"
                    >
                      {pet.emergency_vet_phone}
                    </a>
                  )}
                  {pet.preferred_clinic && (
                    <span>
                      <span className="text-muted-foreground">Clinica: </span>
                      <span className="font-medium">{pet.preferred_clinic}</span>
                    </span>
                  )}
                  {pet.insurance_provider && (
                    <span>
                      <span className="text-muted-foreground">Seguro: </span>
                      <span className="font-medium">{pet.insurance_provider}</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ Two-column layout: Timeline + Sidebar ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* Left: Timeline */}
          <div>
            <VetClinicalTimeline petId={pet.id} vetNotes={vetNotes || []} />
          </div>

          {/* Right: Patient data sidebar — always visible on desktop */}
          <div className="hidden lg:block" ref={vitalsRef}>
            <div className="sticky top-20">
              <VetPatientSidebar pet={pet} />
            </div>
          </div>
        </div>

        {/* Mobile: collapsible sidebar data */}
        <div className="lg:hidden" ref={vitalsRef}>
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors group">
              <span className="text-sm font-semibold">Signos vitales, vacunas y documentos</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <VetPatientSidebar pet={pet} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
