import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { useMedicalDocuments, MedicalDocument } from "@/hooks/useMedicalDocuments";
import { useMedicalSharing } from "@/hooks/useMedicalSharing";
import { useReminders } from "@/hooks/useReminders";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import {
  Heart, Shield, Pill, Syringe, Stethoscope, FileText, Share2,
  AlertTriangle, Dog, Cat, Calendar, MapPin, Phone, Building,
  Activity, Home as HomeIcon, Baby, Scale, Clipboard, Clock,
  ArrowLeft, Copy, ExternalLink, Download, Trash2, Link2, Plus,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import PremiumGate from "@/components/PremiumGate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// --- Helpers ---

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  const years = differenceInYears(now, birth);
  const months = differenceInMonths(now, birth) % 12;

  if (years === 0 && months === 0) return "Menos de 1 mes";
  if (years === 0) return `${months} ${months === 1 ? "mes" : "meses"}`;
  if (months === 0) return `${years} ${years === 1 ? "año" : "años"}`;
  return `${years} ${years === 1 ? "año" : "años"}, ${months} ${months === 1 ? "mes" : "meses"}`;
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
  owner_id: string;
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
  const now = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

  const allergies = [
    ...(pet.allergies_food || []).map(a => ({ type: "Alimentaria", name: a })),
    ...(pet.allergies_medication || []).map(a => ({ type: "Medicamento", name: a })),
    ...(pet.allergies_environmental || []).map(a => ({ type: "Ambiental", name: a })),
  ];

  const meds = pet.current_medications || [];

  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const recordRows = sortedRecords.map(r => {
    const date = r.date || "";
    const formattedDate = date ? new Date(date).toLocaleDateString("es-CL") : "\u2014";
    return `<tr>
      <td>${formattedDate}</td>
      <td><span class="badge">${(r.record_type || "").toUpperCase()}</span></td>
      <td>${r.title || "\u2014"}</td>
      <td>${r.clinic_name || "\u2014"}</td>
      <td>${r.veterinarian_name || "\u2014"}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha Cl\u00ednica - ${pet.name}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { background: #f0f0f0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; font-size: 11px; line-height: 1.5; max-width: 210mm; margin: 0 auto; background: white; padding: 24mm; min-height: 297mm; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }

    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 3px solid #7c3aed; margin-bottom: 20px; }
    .header h1 { font-size: 20px; color: #7c3aed; font-weight: 700; }
    .header .subtitle { font-size: 10px; color: #666; }
    .header .date { font-size: 10px; color: #999; text-align: right; }
    .header .logo { font-size: 22px; color: #7c3aed; font-weight: 800; display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px; }
    .header .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #a855f7); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(124,58,237,0.3); }

    .section { margin-bottom: 14px; }
    .section-title { font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px; }

    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 16px; }
    .field { display: flex; gap: 6px; padding: 2px 0; }
    .field .label { color: #666; font-weight: 500; min-width: 90px; flex-shrink: 0; }
    .field .value { color: #1a1a2e; font-weight: 600; }

    .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; }
    .alert-box .alert-title { font-weight: 700; color: #92400e; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
    .badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }

    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
    tr:hover td { background: #faf5ff; }

    .footer { margin-top: 20px; padding-top: 10px; border-top: 2px solid #e5e7eb; text-align: center; color: #999; font-size: 9px; }
    .footer .brand { color: #7c3aed; font-weight: 700; }

    .med-item { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; margin-bottom: 4px; }
    .med-name { font-weight: 700; color: #166534; }
    .med-detail { color: #666; font-size: 10px; }

    .no-data { color: #999; font-style: italic; }

    @media print {
      html { background: white; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-shadow: none; padding: 0; margin: 0; max-width: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#7c3aed;color:white;padding:12px 20px;text-align:center;font-size:13px;">
    Usa <strong>Ctrl+P</strong> (o Cmd+P) para guardar como PDF o imprimir &nbsp;|&nbsp;
    <a href="javascript:window.print()" style="color:white;text-decoration:underline;">Imprimir ahora</a>
  </div>

  <div class="header">
    <div>
      <h1>Ficha Cl\u00ednica Veterinaria</h1>
      <div class="subtitle">Documento generado digitalmente \u2014 pawfriend.cl</div>
    </div>
    <div class="date">
      <div class="logo"><div class="logo-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/></svg></div> Paw Friend</div>
      <div>Emitido: ${now}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos del Paciente</div>
    <div class="grid">
      <div class="field"><span class="label">Nombre:</span><span class="value">${pet.name}</span></div>
      <div class="field"><span class="label">Especie:</span><span class="value">${pet.species || "\u2014"}</span></div>
      <div class="field"><span class="label">Raza:</span><span class="value">${pet.breed || "No especificada"}</span></div>
      <div class="field"><span class="label">Sexo:</span><span class="value">${pet.gender || "\u2014"}</span></div>
      <div class="field"><span class="label">Edad:</span><span class="value">${age}</span></div>
      <div class="field"><span class="label">Peso:</span><span class="value">${pet.weight ? pet.weight + " kg" : "\u2014"}</span></div>
      <div class="field"><span class="label">Tama\u00f1o:</span><span class="value">${pet.size || "\u2014"}</span></div>
      <div class="field"><span class="label">Color:</span><span class="value">${pet.color || "\u2014"}</span></div>
      <div class="field"><span class="label">Microchip:</span><span class="value">${pet.microchip_number || "No registrado"}</span></div>
      <div class="field"><span class="label">Esterilizado:</span><span class="value">${pet.neutered ? "S\u00ed" : "No"}</span></div>
      <div class="field"><span class="label">Tipo sangre:</span><span class="value">${pet.blood_type || "\u2014"}</span></div>
      <div class="field"><span class="label">Adoptado:</span><span class="value">${pet.is_adopted ? "S\u00ed" : "No"}</span></div>
    </div>
  </div>

  ${allergies.length > 0 ? `
  <div class="section">
    <div class="section-title">Alergias</div>
    <div class="alert-box">
      ${allergies.map(a => `<div><strong>${a.type}:</strong> ${a.name}</div>`).join("")}
    </div>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Medicamentos Actuales</div>
    ${meds.length > 0 ? meds.map((m: any) => `
      <div class="med-item">
        <span class="med-name">${m.name || "\u2014"}</span>
        <span class="med-detail">${m.dose ? " \u2014 " + m.dose : ""}${m.frequency ? " | " + m.frequency : ""}${m.since ? " | Desde: " + m.since : ""}</span>
      </div>
    `).join("") : '<p class="no-data">Sin medicamentos registrados</p>'}
  </div>

  <div class="section">
    <div class="section-title">Alimentaci\u00f3n y H\u00e1bitos</div>
    <div class="grid">
      <div class="field"><span class="label">Dieta:</span><span class="value">${pet.diet_type || "\u2014"}</span></div>
      <div class="field"><span class="label">Marca:</span><span class="value">${pet.diet_brand || "\u2014"}</span></div>
      <div class="field"><span class="label">Actividad:</span><span class="value">${pet.activity_level || "\u2014"}</span></div>
      <div class="field"><span class="label">Entorno:</span><span class="value">${pet.living_environment || "\u2014"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Contacto de Emergencia</div>
    <div class="grid">
      <div class="field"><span class="label">Veterinario:</span><span class="value">${pet.emergency_vet_name || "\u2014"}</span></div>
      <div class="field"><span class="label">Tel\u00e9fono:</span><span class="value">${pet.emergency_vet_phone || "\u2014"}</span></div>
      <div class="field"><span class="label">Cl\u00ednica:</span><span class="value">${pet.preferred_clinic || "\u2014"}</span></div>
      <div class="field"><span class="label">Seguro:</span><span class="value">${pet.insurance_provider || "\u2014"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Historial M\u00e9dico (${sortedRecords.length} registros)</div>
    ${sortedRecords.length > 0 ? `
    <table>
      <thead><tr><th>Fecha</th><th>Tipo</th><th>T\u00edtulo</th><th>Cl\u00ednica</th><th>Veterinario</th></tr></thead>
      <tbody>${recordRows}</tbody>
    </table>` : '<p class="no-data">Sin registros m\u00e9dicos</p>'}
  </div>

  ${(pet.behavior_notes || pet.medical_notes || pet.special_needs) ? `
  <div class="section">
    <div class="section-title">Notas Adicionales</div>
    <p>${[pet.behavior_notes, pet.medical_notes, pet.special_needs].filter(Boolean).join(" | ")}</p>
  </div>` : ""}

  <div class="footer">
    <div class="brand">🐾 Paw Friend — pawfriend.cl</div>
    <div>Este documento es informativo y no reemplaza la evaluaci\u00f3n cl\u00ednica profesional.</div>
    <div>Documento privado \u2014 Solo para uso del tutor y profesionales autorizados.</div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }

  toast.success("Ficha cl\u00ednica generada \u2014 usa Ctrl+P para guardar como PDF");
}

// --- Main Page ---

const PetClinicalRecord = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addReminder } = useReminders();
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderData, setReminderData] = useState({ type: "vaccine", title: "", due_date: "" });

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

  const { data: userPets } = useQuery({
    queryKey: ["user-pets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, species, photo_url")
        .eq("owner_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
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

  // Privacy check - only owner can see clinical record
  if (pet.owner_id !== user?.id) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={Shield}
          title="Acceso restringido"
          description="Solo el dueño de la mascota puede ver su ficha clínica."
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

      {/* Pet Selector */}
      {userPets && userPets.length > 1 && (
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">Mascota:</Label>
          <Select value={petId} onValueChange={(id) => navigate(`/pet/${id}/clinical`)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userPets.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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

        <TabsContent value="resumen" className="mt-4 space-y-4">
          <TabResumen pet={pet} />
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                ¿Necesitas actualizar la información clínica de {pet.name}?
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate(`/edit-pet/${pet.id}`)}>
                <Clipboard className="h-4 w-4 mr-2" />
                Editar datos clínicos
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Programa recordatorios de vacunas, controles y medicamentos
              </p>
              <Dialog open={showReminderForm} onOpenChange={setShowReminderForm}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Recordatorio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Recordatorio</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={reminderData.type} onValueChange={(v) => setReminderData(d => ({...d, type: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vaccine">Vacuna</SelectItem>
                          <SelectItem value="checkup">Control veterinario</SelectItem>
                          <SelectItem value="medication">Medicamento</SelectItem>
                          <SelectItem value="grooming">Peluquería</SelectItem>
                          <SelectItem value="weight">Control de peso</SelectItem>
                          <SelectItem value="custom">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={reminderData.title}
                        onChange={(e) => setReminderData(d => ({...d, title: e.target.value}))}
                        placeholder="Ej: Vacuna antirrábica"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={reminderData.due_date}
                        onChange={(e) => setReminderData(d => ({...d, due_date: e.target.value}))}
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!reminderData.title || !reminderData.due_date}
                      onClick={() => {
                        addReminder.mutate({
                          pet_id: pet.id,
                          type: reminderData.type,
                          title: reminderData.title,
                          due_date: reminderData.due_date,
                        });
                        setShowReminderForm(false);
                        setReminderData({ type: "vaccine", title: "", due_date: "" });
                      }}
                    >
                      Crear Recordatorio
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <TabHistorial petId={pet.id} />
        </TabsContent>

        <TabsContent value="alimentacion" className="mt-4 space-y-4">
          <TabAlimentacion pet={pet} />
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                ¿Necesitas actualizar la información clínica de {pet.name}?
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate(`/edit-pet/${pet.id}`)}>
                <Clipboard className="h-4 w-4 mr-2" />
                Editar datos clínicos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <TabDocumentos petId={pet.id} />
        </TabsContent>

        <TabsContent value="compartir" className="mt-4">
          <PremiumGate feature="Compartir ficha clínica" description="Comparte la ficha clínica de tu mascota con veterinarios mediante un enlace seguro.">
            <TabCompartir petId={pet.id} />
          </PremiumGate>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PetClinicalRecord;
