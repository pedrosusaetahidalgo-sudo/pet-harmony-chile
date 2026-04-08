import {
  Heart, Building, Clock, Activity, Home as HomeIcon, Dog, Baby, Scale, Clipboard,
} from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PetData } from "../types";
import { formatShortDate } from "../helpers";
import { InfoRow, getActivityLevelLabel, getLivingEnvironmentLabel } from "../shared";

export function TabAlimentacion({ pet }: { pet: PetData }) {
  const hasDiet = pet.diet_type || pet.diet_brand || pet.diet_frequency;
  const hasHabits = pet.activity_level || pet.living_environment || pet.behavior_notes;
  const hasCohabitation = pet.cohabitation_pets !== null || pet.cohabitation_children !== null;

  return (
    <div className="space-y-4">
      {/* Diet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-emerald-600" />
            Alimentación
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
              <Clipboard className="h-4 w-4 text-emerald-600" />
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
              <Scale className="h-4 w-4 text-emerald-600" />
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
