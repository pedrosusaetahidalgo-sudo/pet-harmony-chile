/**
 * Componentes y helpers compartidos para PetClinicalRecord y sus tabs.
 * Extraído del god component (1384 líneas) en el split 2026-04-08.
 */

import React from "react";
import {
  Heart, Shield, Syringe, Stethoscope, AlertTriangle, Dog, Cat,
  Calendar, Phone, Building, Scale, Clipboard,
} from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { PetData } from "./types";
import { calculateAge } from "./helpers";

// --- Icon / label helpers ---

export function getSpeciesIcon(species?: string) {
  if (!species) return <Dog className="h-5 w-5" />;
  const s = species.toLowerCase();
  if (s === "gato" || s === "cat") return <Cat className="h-5 w-5" />;
  return <Dog className="h-5 w-5" />;
}

export function getRecordTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "vacuna": return <Syringe className="h-4 w-4" />;
    case "consulta": return <Stethoscope className="h-4 w-4" />;
    case "medicamento":
    case "tratamiento": return <Stethoscope className="h-4 w-4" />;
    case "cirugia":
    case "emergencia": return <Heart className="h-4 w-4" />;
    case "examen": return <Clipboard className="h-4 w-4" />;
    default: return <Clipboard className="h-4 w-4" />;
  }
}

export function getRecordTypeBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case "vacuna": return "bg-green-100 text-green-800 border-green-200";
    case "consulta": return "bg-blue-100 text-blue-800 border-blue-200";
    case "medicamento":
    case "tratamiento": return "bg-purple-100 text-purple-800 border-purple-200";
    case "cirugia": return "bg-red-100 text-red-800 border-red-200";
    case "emergencia": return "bg-red-100 text-red-800 border-red-200";
    case "examen": return "bg-amber-100 text-amber-800 border-amber-200";
    default: return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export function getDocTypeLabel(type: string): string {
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

export function getActivityLevelLabel(level?: string): string {
  if (!level) return "No especificado";
  const labels: Record<string, string> = {
    low: "Bajo", medium: "Moderado", high: "Alto", very_high: "Muy alto",
    sedentary: "Sedentario", active: "Activo",
  };
  return labels[level] || level;
}

export function getLivingEnvironmentLabel(env?: string): string {
  if (!env) return "No especificado";
  const labels: Record<string, string> = {
    apartment: "Departamento", house: "Casa", house_yard: "Casa con patio",
    rural: "Rural", farm: "Granja",
  };
  return labels[env] || env;
}

// --- Loading Skeleton ---

export function ClinicalRecordSkeleton() {
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

export function EmptyState({ icon: Icon, title, description }: {
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

export function InfoRow({ icon: Icon, label, value, className }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className || ""}`}>
      <Icon className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "No especificado"}</p>
      </div>
    </div>
  );
}

// --- Header ---

export function PetHeader({ pet }: { pet: PetData }) {
  const totalAllergies =
    (pet.allergies_food?.length || 0) +
    (pet.allergies_medication?.length || 0) +
    (pet.allergies_environmental?.length || 0);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-purple-600/20 flex-shrink-0 self-center sm:self-start">
            <AvatarImage src={pet.photo_url || undefined} alt={pet.name} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl font-bold">
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
                  {pet.vaccination_status === "up_to_date" ? "Vacunas al día" : pet.vaccination_status}
                </Badge>
              )}
              {pet.neutered !== null && (
                <Badge variant="outline" className={pet.neutered
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
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

// Re-export para compat con el barrel del orquestador
export { Phone, Building };
