import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { useMedicalDocuments, MedicalDocument } from "@/hooks/useMedicalDocuments";
import { useMedicalSharing } from "@/hooks/useMedicalSharing";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import {
  Heart, Shield, Pill, Syringe, Stethoscope, FileText, Share2,
  AlertTriangle, Dog, Cat, Calendar, MapPin, Phone, Building,
  Activity, Home as HomeIcon, Baby, Scale, Clipboard, Clock,
  ArrowLeft, Copy, ExternalLink, Download, Trash2, Link2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// --- Helpers ---

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const years = differenceInYears(now, birth);
  const months = differenceInMonths(now, birth) % 12;

  if (years === 0 && months === 0) return "Menos de 1 mes";
  if (years === 0) return `${months} ${months === 1 ? "mes" : "meses"}`;
  if (months === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years} ${years === 1 ? "ano" : "anos"}, ${months} ${months === 1 ? "mes" : "meses"}`;
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
}

function formatShortDate(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy");
}

function getSpeciesIcon(species?: string) {
  if (!species) return <Dog className="h-5 w-5" />;
  const s = species.toLowerCase();
  if (s === "gato" || s === "cat") return <Cat className="h-5 w-5" />;
  return <Dog className="h-5 w-5" />;
}

function getRecordTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "vacuna": return <Syringe className="h-4 w-4" />;
    case "consulta": return <Stethoscope className="h-4 w-4" />;
    case "medicamento":
    case "tratamiento": return <Pill className="h-4 w-4" />;
    case "cirugia":
    case "emergencia": return <Activity className="h-4 w-4" />;
    case "examen": return <FileText className="h-4 w-4" />;
    default: return <Clipboard className="h-4 w-4" />;
  }
}

function getRecordTypeBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case "vacuna": return "bg-green-100 text-green-800 border-green-200";
    case "consulta": return "bg-blue-100 text-blue-800 border-blue-200";
    case "medicamento":
    case "tratamiento": return "bg-purple-100 text-purple-800 border-purple-200";
    case "cirugia": return "bg-red-100 text-red-800 border-red-200";
    case "emergencia": return "bg-red-100 text-red-800 border-red-200";
    case "examen": return "bg-amber-100 text-amber-800 border-amber-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getDocTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    vaccine_card: "Carnet de vacunas",
    id_card: "Identificacion",
    lab_result: "Resultado de laboratorio",
    xray: "Radiografia",
    prescription: "Receta medica",
    other: "Otro",
  };
  return labels[type] || type;
}

function getActivityLevelLabel(level?: string): string {
  if (!level) return "No especificado";
  const labels: Record<string, string> = {
    low: "Bajo", medium: "Moderado", high: "Alto", very_high: "Muy alto",
    sedentary: "Sedentario", active: "Activo",
  };
  return labels[level] || level;
}

function getLivingEnvironmentLabel(env?: string): string {
  if (!env) return "No especificado";
  const labels: Record<string, string> = {
    apartment: "Departamento", house: "Casa", house_yard: "Casa con patio",
    rural: "Rural", farm: "Granja",
  };
  return labels[env] || env;
}

// --- Types ---

interface PetData {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birth_date: string | null;
  weight: number | null;
  size: string | null;
  color: string | null;
  photo_url: string | null;
  bio: string | null;
  microchip_number: string | null;
  neutered: boolean | null;
  vaccination_status: string | null;
  special_needs: string | null;
  personality: string | null;
  medical_notes: string | null;
  is_public: boolean | null;
  blood_type: string | null;
  neutered_date: string | null;
  chip_registry: string | null;
  weight_history: Array<{ date: string; weight: number }> | null;
  allergies_food: string[] | null;
  allergies_medication: string[] | null;
  allergies_environmental: string[] | null;
  chronic_conditions_detail: Record<string, any> | null;
  current_medications: Array<{ name: string; dose?: string; frequency?: string; since?: string }> | null;
  diet_type: string | null;
  diet_brand: string | null;
  diet_frequency: string | null;
  activity_level: string | null;
  living_environment: string | null;
  cohabitation_pets: number | null;
  cohabitation_children: boolean | null;
  emergency_vet_name: string | null;
  emergency_vet_phone: string | null;
  insurance_provider: string | null;
  insurance_policy: string | null;
  preferred_clinic: string | null;
  behavior_notes: string | null;
  last_vet_visit: string | null;
  adoption_date: string | null;
  is_adopted: boolean | null;
}

// --- Loading Skeleton ---

function ClinicalRecordSkeleton() {
  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

// --- Sub-components ---

function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value, className }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className || ""}`}>
      <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "No especificado"}</p>
      </div>
    </div>
  );
}

// --- Header ---

function PetHeader({ pet }: { pet: PetData }) {
  const totalAllergies =
    (pet.allergies_food?.length || 0) +
    (pet.allergies_medication?.length || 0) +
    (pet.allergies_environmental?.length || 0);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10 flex-shrink-0 self-center sm:self-start">
            <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {pet.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{pet.name}</h1>
                {getSpeciesIcon(pet.species)}
              </div>
              <p className="text-muted-foreground text-sm">
                {pet.species}{pet.breed ? ` - ${pet.breed}` : ""}
                {pet.gender ? ` | ${pet.gender}` : ""}
                {pet.color ? ` | ${pet.color}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {pet.birth_date && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{calculateAge(pet.birth_date)}</span>
                </div>
              )}
              {pet.weight && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Scale className="h-3.5 w-3.5" />
                  <span>{pet.weight} kg</span>
                </div>
              )}
              {pet.blood_type && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  <span>Tipo {pet.blood_type}</span>
                </div>
              )}
              {pet.microchip_number && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">{pet.microchip_number}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {pet.vaccination_status && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Syringe className="h-3 w-3 mr-1" />
                  {pet.vaccination_status === "up_to_date" ? "Vacunas al dia" : pet.vaccination_status}
                </Badge>
              )}
              {pet.neutered !== null && (
                <Badge variant="outline" className={pet.neutered
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
                }>
                  {pet.neutered ? "Esterilizado/a" : "No esterilizado/a"}
                </Badge>
              )}
              {totalAllergies > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {totalAllergies} {totalAllergies === 1 ? "alergia" : "alergias"}
                </Badge>
              )}
              {pet.is_adopted && (
                <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                  <Heart className="h-3 w-3 mr-1" />
                  Adoptado/a
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Tab: Resumen ---

function TabResumen({ pet }: { pet: PetData }) {
  const hasAllergies =
    (pet.allergies_food?.length || 0) +
    (pet.allergies_medication?.length || 0) +
    (pet.allergies_environmental?.length || 0) > 0;

  const hasMedications = pet.current_medications && pet.current_medications.length > 0;
  const hasChronicConditions = pet.chronic_conditions_detail &&
    Object.keys(pet.chronic_conditions_detail).length > 0;

  return (
    <div className="space-y-4">
      {/* Allergies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alergias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAllergies ? (
            <p className="text-sm text-muted-foreground">Sin alergias registradas</p>
          ) : (
            <div className="space-y-3">
              {pet.allergies_food && pet.allergies_food.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Alimentarias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pet.allergies_food.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {pet.allergies_medication && pet.allergies_medication.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Medicamentos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pet.allergies_medication.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {pet.allergies_environmental && pet.allergies_environmental.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Ambientales</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pet.allergies_environmental.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="h-4 w-4 text-purple-500" />
            Medicamentos actuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasMedications ? (
            <p className="text-sm text-muted-foreground">Sin medicamentos activos</p>
          ) : (
            <div className="space-y-3">
              {pet.current_medications!.map((med, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Pill className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{med.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {med.dose && <span>Dosis: {med.dose}</span>}
                      {med.frequency && <span>Frecuencia: {med.frequency}</span>}
                      {med.since && <span>Desde: {med.since}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chronic Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-blue-500" />
            Condiciones cronicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasChronicConditions ? (
            <p className="text-sm text-muted-foreground">Sin condiciones cronicas registradas</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(pet.chronic_conditions_detail!).map(([condition, detail], i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium capitalize">{condition}</p>
                  {typeof detail === "string" && (
                    <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
                  )}
                  {typeof detail === "object" && detail !== null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emergency Vet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-red-500" />
              Veterinario de emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pet.emergency_vet_name ? (
              <>
                <InfoRow icon={Building} label="Nombre" value={pet.emergency_vet_name} />
                {pet.emergency_vet_phone && (
                  <InfoRow icon={Phone} label="Telefono" value={
                    <a href={`tel:${pet.emergency_vet_phone}`} className="text-primary hover:underline">
                      {pet.emergency_vet_phone}
                    </a>
                  } />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No registrado</p>
            )}
          </CardContent>
        </Card>

        {/* Insurance & Clinic */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Seguro y clinica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pet.insurance_provider && (
              <InfoRow icon={Shield} label="Seguro" value={`${pet.insurance_provider}${pet.insurance_policy ? ` (${pet.insurance_policy})` : ""}`} />
            )}
            {pet.preferred_clinic && (
              <InfoRow icon={Building} label="Clinica preferida" value={pet.preferred_clinic} />
            )}
            {pet.last_vet_visit && (
              <InfoRow icon={Calendar} label="Ultima visita" value={formatDate(pet.last_vet_visit)} />
            )}
            {!pet.insurance_provider && !pet.preferred_clinic && !pet.last_vet_visit && (
              <p className="text-sm text-muted-foreground">No registrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical Notes & Special Needs */}
      {(pet.medical_notes || pet.special_needs) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-primary" />
              Notas medicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pet.special_needs && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Necesidades especiales</p>
                <p className="text-sm">{pet.special_needs}</p>
              </div>
            )}
            {pet.medical_notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Notas generales</p>
                <p className="text-sm">{pet.medical_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Tab: Historial ---

function TabHistorial({ petId }: { petId: string }) {
  const { records, isLoading } = useMedicalRecords(petId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={Clipboard}
        title="Sin historial medico"
        description="Los registros de consultas, vacunas, examenes y tratamientos apareceran aqui."
      />
    );
  }

  // Group by year
  const groupedByYear: Record<string, typeof records> = {};
  records.forEach((record) => {
    const year = new Date(record.date).getFullYear().toString();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(record);
  });

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="space-y-8">
      {sortedYears.map((year) => (
        <div key={year} className="space-y-4">
          <h3 className="text-lg font-bold text-primary sticky top-0 bg-background py-1 z-10">
            {year}
          </h3>
          <div className="relative space-y-4 pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
            {groupedByYear[year].map((record) => (
              <div key={record.id} className="relative">
                <div className={`absolute -left-8 top-4 w-7 h-7 rounded-full flex items-center justify-center text-xs ${getRecordTypeBadgeClass(record.record_type)}`}>
                  {getRecordTypeIcon(record.record_type)}
                </div>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{record.title}</p>
                          <Badge variant="outline" className={`text-xs capitalize ${getRecordTypeBadgeClass(record.record_type)}`}>
                            {record.record_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(record.date)}
                        </p>
                      </div>
                    </div>

                    {record.description && (
                      <p className="text-sm text-muted-foreground mt-2">{record.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {record.clinic_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {record.clinic_name}
                        </span>
                      )}
                      {record.veterinarian_name && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" /> Dr. {record.veterinarian_name}
                        </span>
                      )}
                    </div>

                    {record.next_date && (
                      <div className="flex items-center gap-1.5 text-xs mt-2 p-2 bg-primary/5 rounded border border-primary/10">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span className="font-medium text-primary">Proxima cita:</span>
                        <span>{formatDate(record.next_date)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Tab: Alimentacion y Habitos ---

function TabAlimentacion({ pet }: { pet: PetData }) {
  const hasDiet = pet.diet_type || pet.diet_brand || pet.diet_frequency;
  const hasHabits = pet.activity_level || pet.living_environment || pet.behavior_notes;
  const hasCohabitation = pet.cohabitation_pets !== null || pet.cohabitation_children !== null;

  return (
    <div className="space-y-4">
      {/* Diet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Alimentacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasDiet ? (
            <p className="text-sm text-muted-foreground">Sin informacion de dieta registrada</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pet.diet_type && (
                <InfoRow icon={Heart} label="Tipo de dieta" value={pet.diet_type} />
              )}
              {pet.diet_brand && (
                <InfoRow icon={Building} label="Marca" value={pet.diet_brand} />
              )}
              {pet.diet_frequency && (
                <InfoRow icon={Clock} label="Frecuencia" value={pet.diet_frequency} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity & Environment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" />
            Actividad y entorno
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasHabits && !hasCohabitation ? (
            <p className="text-sm text-muted-foreground">Sin informacion registrada</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pet.activity_level && (
                <InfoRow icon={Activity} label="Nivel de actividad" value={getActivityLevelLabel(pet.activity_level)} />
              )}
              {pet.living_environment && (
                <InfoRow icon={HomeIcon} label="Entorno de vida" value={getLivingEnvironmentLabel(pet.living_environment)} />
              )}
              {pet.cohabitation_pets !== null && (
                <InfoRow icon={Dog} label="Otras mascotas en el hogar" value={
                  pet.cohabitation_pets === 0 ? "Ninguna" : `${pet.cohabitation_pets}`
                } />
              )}
              {pet.cohabitation_children !== null && (
                <InfoRow icon={Baby} label="Convive con ninos" value={pet.cohabitation_children ? "Si" : "No"} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Behavior Notes */}
      {pet.behavior_notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-primary" />
              Notas de comportamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{pet.behavior_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Weight History */}
      {pet.weight_history && pet.weight_history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Historial de peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pet.weight_history
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm">
                    <span className="text-muted-foreground">{formatShortDate(entry.date)}</span>
                    <span className="font-medium">{entry.weight} kg</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Tab: Documentos ---

function TabDocumentos({ petId }: { petId: string }) {
  const { documents, isLoading, getDownloadUrl } = useMedicalDocuments(petId);

  const handleDownload = useCallback(async (doc: MedicalDocument) => {
    try {
      const url = await getDownloadUrl(doc);
      window.open(url, "_blank");
    } catch {
      toast.error("Error al obtener el enlace de descarga");
    }
  }, [getDownloadUrl]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin documentos"
        description="Los documentos medicos como recetas, resultados de laboratorio y carnets de vacunacion apareceran aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {getDocTypeLabel(doc.type)}
                  </Badge>
                  {doc.issued_at && (
                    <span>{formatShortDate(doc.issued_at)}</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(doc)}
              className="flex-shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Tab: Compartir ---

function TabCompartir({ petId }: { petId: string }) {
  const { tokens, isLoading, createShareToken, isCreating, revokeToken, isRevoking, getShareUrl } = useMedicalSharing(petId);

  const handleCopy = useCallback(async (token: string) => {
    const url = getShareUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }, [getShareUrl]);

  const handleCreate = useCallback(async () => {
    try {
      await createShareToken(30);
    } catch {
      // Error handled by the hook
    }
  }, [createShareToken]);

  const handleRevoke = useCallback(async (tokenId: string) => {
    try {
      await revokeToken(tokenId);
    } catch {
      // Error handled by the hook
    }
  }, [revokeToken]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Compartir ficha clinica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Genera un enlace seguro para compartir la ficha clinica de tu mascota con un veterinario.
            Los enlaces expiran automaticamente despues de 30 dias.
          </p>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            <Link2 className="h-4 w-4 mr-2" />
            {isCreating ? "Generando..." : "Generar enlace"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : tokens && tokens.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enlaces activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tokens.map((token) => {
              const isExpired = new Date(token.expires_at) < new Date();
              return (
                <div key={token.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {getShareUrl(token.token)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Creado: {formatShortDate(token.created_at)}
                      </span>
                      {isExpired ? (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                          Expirado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                          Activo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(token.token)}
                      title="Copiar enlace"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(token.id)}
                      disabled={isRevoking}
                      title="Revocar enlace"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Link2}
          title="Sin enlaces activos"
          description="Genera un enlace para compartir la ficha clinica con tu veterinario."
        />
      )}
    </div>
  );
}

// --- Main Page ---

// --- PDF Generation ---

function generatePDF(pet: PetData, records: any[]) {
  const age = pet.birth_date ? calculateAge(pet.birth_date) : "No especificada";
  const now = new Date().toLocaleDateString("es-CL");

  const allergies = [
    ...(pet.allergies_food || []).map(a => `Alimentaria: ${a}`),
    ...(pet.allergies_medication || []).map(a => `Medicamento: ${a}`),
    ...(pet.allergies_environmental || []).map(a => `Ambiental: ${a}`),
  ];

  const meds = (pet.current_medications || [])
    .map((m: any) => `${m.name}${m.dose ? ` - ${m.dose}` : ""}${m.frequency ? ` (${m.frequency})` : ""}`)
    .join("\n    ");

  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.date || b.visit_date || 0).getTime() - new Date(a.date || a.visit_date || 0).getTime()
  );

  const historyLines = sortedRecords.slice(0, 20).map(r => {
    const date = r.date || r.visit_date || "";
    const formattedDate = date ? new Date(date).toLocaleDateString("es-CL") : "Sin fecha";
    const type = (r.record_type || "").toUpperCase();
    const clinic = r.clinic_name ? ` | ${r.clinic_name}` : "";
    const vet = r.veterinarian_name ? ` | Dr. ${r.veterinarian_name}` : "";
    return `  ${formattedDate}  [${type}]  ${r.title || ""}${clinic}${vet}${r.description ? `\n    ${r.description}` : ""}`;
  }).join("\n\n");

  const content = `
═══════════════════════════════════════════════════
              FICHA CLÍNICA VETERINARIA
                    Paw Friend
═══════════════════════════════════════════════════
Fecha de emisión: ${now}

───────────────────────────────────────────────────
  DATOS DEL PACIENTE
───────────────────────────────────────────────────
  Nombre:         ${pet.name}
  Especie:        ${pet.species || "-"}
  Raza:           ${pet.breed || "No especificada"}
  Sexo:           ${pet.gender || "No especificado"}
  Edad:           ${age}
  Peso:           ${pet.weight ? `${pet.weight} kg` : "No registrado"}
  Tamaño:         ${pet.size || "No especificado"}
  Color:          ${pet.color || "No especificado"}
  Microchip:      ${pet.microchip_number || "No registrado"}
  Esterilizado/a: ${pet.neutered ? "Sí" : "No"}
  Tipo sangre:    ${pet.blood_type || "No registrado"}
  Adoptado/a:     ${pet.is_adopted ? "Sí" : "No"}

───────────────────────────────────────────────────
  ALERGIAS
───────────────────────────────────────────────────
${allergies.length > 0 ? allergies.map(a => `  ⚠ ${a}`).join("\n") : "  Sin alergias registradas"}

───────────────────────────────────────────────────
  MEDICAMENTOS ACTUALES
───────────────────────────────────────────────────
${meds || "  Sin medicamentos registrados"}

───────────────────────────────────────────────────
  ALIMENTACIÓN Y HÁBITOS
───────────────────────────────────────────────────
  Dieta:          ${pet.diet_type || "No especificada"}
  Marca:          ${pet.diet_brand || "No especificada"}
  Frecuencia:     ${pet.diet_frequency || "No especificada"}
  Actividad:      ${pet.activity_level || "No especificada"}
  Entorno:        ${pet.living_environment || "No especificado"}
  Otras mascotas: ${pet.cohabitation_pets ?? "No especificado"}
  Niños en casa:  ${pet.cohabitation_children === true ? "Sí" : pet.cohabitation_children === false ? "No" : "No especificado"}

───────────────────────────────────────────────────
  CONTACTO DE EMERGENCIA
───────────────────────────────────────────────────
  Veterinario:    ${pet.emergency_vet_name || "No registrado"}
  Teléfono:       ${pet.emergency_vet_phone || "No registrado"}
  Clínica pref.:  ${pet.preferred_clinic || "No registrada"}
  Seguro:         ${pet.insurance_provider || "No registrado"}

───────────────────────────────────────────────────
  HISTORIAL MÉDICO (${sortedRecords.length} registros)
───────────────────────────────────────────────────
${historyLines || "  Sin registros médicos"}

───────────────────────────────────────────────────
  NOTAS
───────────────────────────────────────────────────
  ${pet.behavior_notes || "Sin notas adicionales"}
  ${pet.medical_notes || ""}
  ${pet.special_needs || ""}

═══════════════════════════════════════════════════
  Generado por Paw Friend (pawfriend.cl)
  Este documento es informativo y no reemplaza
  la evaluación clínica profesional.
═══════════════════════════════════════════════════
`.trim();

  // Create and download text file (universal, no dependencies)
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ficha-clinica-${pet.name.toLowerCase().replace(/\s+/g, "-")}-${now.replace(/\//g, "-")}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success("Ficha clínica descargada");
}

// --- Main Page ---

const PetClinicalRecord = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: pet, isLoading: petLoading, error } = useQuery({
    queryKey: ["pet-clinical", petId],
    queryFn: async () => {
      if (!petId) return null;
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .maybeSingle();
      if (error) throw error;
      return data as PetData | null;
    },
    enabled: !!petId && !authLoading,
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ["pet-medical-records-pdf", petId],
    queryFn: async () => {
      if (!petId) return [];
      const { data } = await supabase
        .from("medical_records")
        .select("*")
        .eq("pet_id", petId)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!petId && !authLoading,
  });

  if (authLoading || petLoading) {
    return <ClinicalRecordSkeleton />;
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar"
          description="No se pudo cargar la ficha clinica. Intenta nuevamente."
        />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={Dog}
          title="Mascota no encontrada"
          description="No se encontro la mascota solicitada o no tienes permisos para verla."
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver
      </Button>

      {/* Page title + PDF button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ficha Clínica</h1>
          <p className="text-sm text-muted-foreground">
            Registro veterinario completo de {pet.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generatePDF(pet, medicalRecords)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Descargar PDF</span>
        </Button>
      </div>

      {/* Header Card */}
      <PetHeader pet={pet} />

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen" className="text-xs sm:text-sm">
            <Heart className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="historial" className="text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="alimentacion" className="text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Habitos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Docs
          </TabsTrigger>
          <TabsTrigger value="compartir" className="text-xs sm:text-sm">
            <Share2 className="h-3.5 w-3.5 mr-1 hidden sm:inline-block" />
            Compartir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <TabResumen pet={pet} />
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <TabHistorial petId={pet.id} />
        </TabsContent>

        <TabsContent value="alimentacion" className="mt-4">
          <TabAlimentacion pet={pet} />
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <TabDocumentos petId={pet.id} />
        </TabsContent>

        <TabsContent value="compartir" className="mt-4">
          <TabCompartir petId={pet.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PetClinicalRecord;
