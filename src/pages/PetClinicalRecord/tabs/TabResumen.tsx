import {
  AlertTriangle, Pill, Stethoscope, Phone, Building, Shield, Calendar, Clipboard,
} from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PetData } from "../types";
import { formatDate } from "../helpers";
import { InfoRow } from "../shared";
import { GrimaceChecklist } from "@/components/medical/GrimaceChecklist";

export function TabResumen({ pet }: { pet: PetData }) {
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
                  <Pill className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
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
            Condiciones crónicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasChronicConditions ? (
            <p className="text-sm text-muted-foreground">Sin condiciones crónicas registradas</p>
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
                  <InfoRow icon={Phone} label="Teléfono" value={
                    <a href={`tel:${pet.emergency_vet_phone}`} className="text-purple-600 hover:underline">
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
              Seguro y clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pet.insurance_provider && (
              <InfoRow icon={Shield} label="Seguro" value={`${pet.insurance_provider}${pet.insurance_policy ? ` (${pet.insurance_policy})` : ""}`} />
            )}
            {pet.preferred_clinic && (
              <InfoRow icon={Building} label="Clínica preferida" value={pet.preferred_clinic} />
            )}
            {pet.last_vet_visit && (
              <InfoRow icon={Calendar} label="Última visita" value={formatDate(pet.last_vet_visit)} />
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
              <Clipboard className="h-4 w-4 text-purple-600" />
              Notas médicas
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

      {/* Pain Assessment — Grimace Scale (cats & dogs only) */}
      {(pet.species?.toLowerCase() === "gato" || pet.species?.toLowerCase() === "perro") && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-rose-500" />
              Evaluación de dolor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Usa la escala de Grimace para evaluar si {pet.name} presenta signos de dolor.
            </p>
            <GrimaceChecklist
              petId={pet.id}
              petName={pet.name}
              species={pet.species}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
