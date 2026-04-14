import { useState } from "react";
import {
  Heart, Building, Clock, Activity, Home as HomeIcon, Dog, Baby, Scale, Clipboard, Plus, Pencil,
} from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PetData } from "../types";
import { formatShortDate } from "../helpers";
import { InfoRow, getActivityLevelLabel, getLivingEnvironmentLabel } from "../shared";

const PET_FOOD_BRANDS = [
  "Royal Canin", "Hills Science Diet", "Purina Pro Plan", "Eukanuba",
  "Bravery", "Brit Care", "Acana", "Orijen", "Taste of the Wild",
  "Diamond Naturals", "Nutram", "Canidae", "Blue Buffalo", "Pedigree",
  "Dog Chow", "Cat Chow", "Whiskas", "Felix", "Fit Formula",
  "Master Dog", "Champion Dog", "Nutri Best", "Otro",
];

const DIET_TYPES = [
  "Alimento seco (pellet)", "Alimento humedo (latas)", "BARF / Crudo",
  "Mixto (seco + humedo)", "Dieta casera", "Dieta veterinaria especial", "Otro",
];

const DIET_FREQUENCIES = [
  "1 vez al dia", "2 veces al dia", "3 veces al dia", "Libre acceso", "Otro",
];

export function TabAlimentacion({ pet, onRefresh, viewMode }: { pet: PetData; onRefresh?: () => void; viewMode?: 'owner' | 'vet' }) {
  const [editing, setEditing] = useState(false);
  const [dietType, setDietType] = useState(pet.diet_type || "");
  const [dietBrand, setDietBrand] = useState(pet.diet_brand || "");
  const [dietFreq, setDietFreq] = useState(pet.diet_frequency || "");
  const [saving, setSaving] = useState(false);

  const hasDiet = pet.diet_type || pet.diet_brand || pet.diet_frequency;

  const saveDiet = async () => {
    setSaving(true);
    const { error } = await supabase.from("pets").update({
      diet_type: dietType || null,
      diet_brand: dietBrand || null,
      diet_frequency: dietFreq || null,
    }).eq("id", pet.id);
    setSaving(false);
    if (error) { toast.error("Error al guardar"); return; }
    toast.success("Alimentacion actualizada");
    setEditing(false);
    onRefresh?.();
  };
  const hasHabits = pet.activity_level || pet.living_environment || pet.behavior_notes;
  const hasCohabitation = pet.cohabitation_pets !== null || pet.cohabitation_children !== null;

  return (
    <div className="space-y-4">
      {/* Diet */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-purple-600" />
              Alimentacion
            </CardTitle>
            {viewMode !== 'vet' && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-purple-600" onClick={() => setEditing(!editing)}>
                {editing ? "Cancelar" : hasDiet ? <><Pencil className="h-3.5 w-3.5" /> Editar</> : <><Plus className="h-3.5 w-3.5" /> Agregar</>}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de dieta</label>
                <Select value={dietType} onValueChange={setDietType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                  <SelectContent>
                    {DIET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Marca de alimento</label>
                <Select value={dietBrand} onValueChange={setDietBrand}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecciona marca" /></SelectTrigger>
                  <SelectContent>
                    {PET_FOOD_BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Frecuencia</label>
                <Select value={dietFreq} onValueChange={setDietFreq}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecciona frecuencia" /></SelectTrigger>
                  <SelectContent>
                    {DIET_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="w-full h-9" onClick={saveDiet} disabled={saving}>
                {saving ? "Guardando..." : "Guardar alimentacion"}
              </Button>
            </div>
          ) : !hasDiet ? (
            viewMode === 'vet' ? (
              <p className="text-sm text-muted-foreground p-3">Sin informacion de dieta registrada</p>
            ) : (
            <button onClick={() => setEditing(true)} className="w-full text-left p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group">
              <p className="text-sm text-muted-foreground group-hover:text-purple-600">Sin informacion de dieta registrada</p>
              <p className="text-xs text-muted-foreground/60 group-hover:text-purple-500 mt-0.5">Toca para agregar</p>
            </button>
            )
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
              <Clipboard className="h-4 w-4 text-purple-600" />
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
              <Scale className="h-4 w-4 text-purple-600" />
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
