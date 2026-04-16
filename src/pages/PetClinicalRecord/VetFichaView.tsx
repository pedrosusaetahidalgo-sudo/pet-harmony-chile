import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Pill, Activity, Shield, Scale, ChevronDown } from '@/lib/icons';
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
      ? 'M'
      : pet.gender === 'female' || pet.gender === 'Hembra'
        ? 'H'
        : pet.gender;

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
        {/* Vet Clinical Header */}
        <Card>
          <CardContent className="p-4 md:p-5 space-y-4">
            {/* Row 1: Pet identity */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 ring-2 ring-teal-200 flex-shrink-0">
                  <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-bold">
                    {pet.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusInfo.dotClass}`}
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
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  {pet.microchip_number && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span className="font-mono">{pet.microchip_number}</span>
                    </span>
                  )}
                  {pet.weight && (
                    <span className="flex items-center gap-1">
                      <Scale className="h-3 w-3" />
                      {pet.weight} kg
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Alert cards */}
            {(allergies.length > 0 || medications.length > 0 || chronicConditions.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {allergies.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">
                        Alergias
                      </p>
                      <p className="text-xs text-red-600 truncate">{allergies.join(', ')}</p>
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
                      <p className="text-xs text-blue-600 truncate">
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
                      <p className="text-xs text-orange-600 truncate">
                        {chronicConditions.join(', ')}
                      </p>
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

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* Left: Timeline */}
          <div>
            <VetClinicalTimeline petId={pet.id} vetNotes={vetNotes || []} />
          </div>

          {/* Right: Patient data sidebar */}
          {/* On mobile: collapsible section above timeline */}
          <div className="hidden lg:block" ref={vitalsRef}>
            <VetPatientSidebar pet={pet} />
          </div>
        </div>

        {/* Mobile: collapsible sidebar data */}
        <div className="lg:hidden" ref={vitalsRef}>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors group">
              <span className="text-sm font-semibold">Datos del paciente</span>
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
