/* eslint-disable jsx-a11y/label-has-associated-control -- <label> visuales sobre <Select> shadcn; radix maneja aria-labelledby internamente */
import { useState } from 'react';
import {
  Heart,
  Building,
  Clock,
  Activity,
  Home as HomeIcon,
  Dog,
  Baby,
  Scale,
  Clipboard,
  Plus,
  Pencil,
} from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PetData } from '../types';
import { formatShortDate } from '../helpers';
import { InfoRow, getActivityLevelLabel, getLivingEnvironmentLabel } from '../shared';

const PET_FOOD_BRANDS = [
  'Royal Canin',
  'Hills Science Diet',
  'Purina Pro Plan',
  'Eukanuba',
  'Bravery',
  'Brit Care',
  'Acana',
  'Orijen',
  'Taste of the Wild',
  'Diamond Naturals',
  'Nutram',
  'Canidae',
  'Blue Buffalo',
  'Pedigree',
  'Dog Chow',
  'Cat Chow',
  'Whiskas',
  'Felix',
  'Fit Formula',
  'Master Dog',
  'Champion Dog',
  'Nutri Best',
  'Otro',
];

const DIET_TYPES = [
  'Alimento seco (pellet)',
  'Alimento humedo (latas)',
  'BARF / Crudo',
  'Mixto (seco + humedo)',
  'Dieta casera',
  'Dieta veterinaria especial',
  'Otro',
];

const DIET_FREQUENCIES = [
  '1 vez al dia',
  '2 veces al dia',
  '3 veces al dia',
  'Libre acceso',
  'Otro',
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentario' },
  { value: 'low', label: 'Bajo' },
  { value: 'medium', label: 'Moderado' },
  { value: 'high', label: 'Alto' },
  { value: 'very_high', label: 'Muy alto' },
];

const LIVING_ENVIRONMENTS = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'house_yard', label: 'Casa con patio' },
  { value: 'rural', label: 'Rural' },
  { value: 'farm', label: 'Granja' },
];

export function TabAlimentacion({
  pet,
  onRefresh,
  viewMode,
}: {
  pet: PetData;
  onRefresh?: () => void;
  viewMode?: 'owner' | 'vet';
}) {
  // Diet state
  const [editingDiet, setEditingDiet] = useState(false);
  const [dietType, setDietType] = useState(pet.diet_type || '');
  const [dietBrand, setDietBrand] = useState(pet.diet_brand || '');
  const [dietFreq, setDietFreq] = useState(pet.diet_frequency || '');

  // Habits state
  const [editingHabits, setEditingHabits] = useState(false);
  const [activityLevel, setActivityLevel] = useState(pet.activity_level || '');
  const [livingEnv, setLivingEnv] = useState(pet.living_environment || '');
  const [cohabPets, setCohabPets] = useState(pet.cohabitation_pets?.toString() ?? '');
  const [cohabChildren, setCohabChildren] = useState(
    pet.cohabitation_children === true ? 'true' : pet.cohabitation_children === false ? 'false' : ''
  );
  const [behaviorNotes, setBehaviorNotes] = useState(pet.behavior_notes || '');

  const [saving, setSaving] = useState(false);

  const hasDiet = pet.diet_type || pet.diet_brand || pet.diet_frequency;
  const hasHabits = pet.activity_level || pet.living_environment || pet.behavior_notes;
  const hasCohabitation = pet.cohabitation_pets !== null || pet.cohabitation_children !== null;

  const saveDiet = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('pets')
      .update({
        diet_type: dietType || null,
        diet_brand: dietBrand || null,
        diet_frequency: dietFreq || null,
      })
      .eq('id', pet.id);
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
      return;
    }
    toast.success('Alimentacion actualizada');
    setEditingDiet(false);
    onRefresh?.();
  };

  const saveHabits = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('pets')
      .update({
        activity_level: activityLevel || null,
        living_environment: livingEnv || null,
        cohabitation_pets: cohabPets !== '' ? parseInt(cohabPets, 10) : null,
        cohabitation_children:
          cohabChildren === 'true' ? true : cohabChildren === 'false' ? false : null,
        behavior_notes: behaviorNotes || null,
      })
      .eq('id', pet.id);
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
      return;
    }
    toast.success('Hábitos actualizados');
    setEditingHabits(false);
    onRefresh?.();
  };

  const isOwner = viewMode !== 'vet';

  return (
    <div className="space-y-4">
      {/* Diet */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-purple-600" />
              Alimentación
            </CardTitle>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-purple-600"
                onClick={() => setEditingDiet(!editingDiet)}
              >
                {editingDiet ? (
                  'Cancelar'
                ) : hasDiet ? (
                  <>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingDiet ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Tipo de dieta
                </label>
                <Select value={dietType} onValueChange={setDietType}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Marca de alimento
                </label>
                <Select value={dietBrand} onValueChange={setDietBrand}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {PET_FOOD_BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Frecuencia
                </label>
                <Select value={dietFreq} onValueChange={setDietFreq}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIET_FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="w-full h-9" onClick={saveDiet} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar alimentación'}
              </Button>
            </div>
          ) : !hasDiet ? (
            !isOwner ? (
              <p className="text-sm text-muted-foreground p-3">
                Sin información de dieta registrada
              </p>
            ) : (
              <button
                onClick={() => setEditingDiet(true)}
                className="w-full text-left p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group"
              >
                <p className="text-sm text-muted-foreground group-hover:text-purple-600">
                  Sin información de dieta registrada
                </p>
                <p className="text-xs text-muted-foreground/60 group-hover:text-purple-500 mt-0.5">
                  Toca para agregar
                </p>
              </button>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pet.diet_type && (
                <InfoRow icon={Heart} label="Tipo de dieta" value={pet.diet_type} />
              )}
              {pet.diet_brand && <InfoRow icon={Building} label="Marca" value={pet.diet_brand} />}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Actividad y entorno
            </CardTitle>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-green-600"
                onClick={() => setEditingHabits(!editingHabits)}
              >
                {editingHabits ? (
                  'Cancelar'
                ) : hasHabits || hasCohabitation ? (
                  <>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingHabits ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Nivel de actividad
                </label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Entorno de vida
                </label>
                <Select value={livingEnv} onValueChange={setLivingEnv}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona entorno" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIVING_ENVIRONMENTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Otras mascotas en el hogar
                </label>
                <Input
                  type="number"
                  min="0"
                  className="h-9 text-sm"
                  placeholder="0"
                  value={cohabPets}
                  onChange={(e) => setCohabPets(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Convive con niños
                </label>
                <Select value={cohabChildren} onValueChange={setCohabChildren}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Notas de comportamiento
                </label>
                <Textarea
                  className="text-sm min-h-[80px]"
                  placeholder="Ej: Le tiene miedo a los fuegos artificiales, es amigable con otros perros..."
                  value={behaviorNotes}
                  onChange={(e) => setBehaviorNotes(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full h-9 bg-green-600 hover:bg-green-700"
                onClick={saveHabits}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar hábitos'}
              </Button>
            </div>
          ) : !hasHabits && !hasCohabitation ? (
            !isOwner ? (
              <p className="text-sm text-muted-foreground p-3">Sin información registrada</p>
            ) : (
              <button
                onClick={() => setEditingHabits(true)}
                className="w-full text-left p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-green-300 hover:bg-green-50/50 transition-colors group"
              >
                <p className="text-sm text-muted-foreground group-hover:text-green-600">
                  Sin información de actividad o entorno
                </p>
                <p className="text-xs text-muted-foreground/60 group-hover:text-green-500 mt-0.5">
                  Toca para agregar nivel de actividad, entorno y convivencia
                </p>
              </button>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pet.activity_level && (
                <div className="flex items-center gap-2">
                  <InfoRow
                    icon={Activity}
                    label="Nivel de actividad"
                    value={
                      <Badge
                        variant="outline"
                        className={
                          pet.activity_level === 'high' || pet.activity_level === 'very_high'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : pet.activity_level === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                        }
                      >
                        {getActivityLevelLabel(pet.activity_level)}
                      </Badge>
                    }
                  />
                </div>
              )}
              {pet.living_environment && (
                <div className="flex items-center gap-2">
                  <InfoRow
                    icon={HomeIcon}
                    label="Entorno de vida"
                    value={
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getLivingEnvironmentLabel(pet.living_environment)}
                      </Badge>
                    }
                  />
                </div>
              )}
              {pet.cohabitation_pets !== null && (
                <InfoRow
                  icon={Dog}
                  label="Otras mascotas en el hogar"
                  value={pet.cohabitation_pets === 0 ? 'Ninguna' : `${pet.cohabitation_pets}`}
                />
              )}
              {pet.cohabitation_children !== null && (
                <InfoRow
                  icon={Baby}
                  label="Convive con niños"
                  value={pet.cohabitation_children ? 'Sí' : 'No'}
                />
              )}
              {pet.behavior_notes && (
                <div className="sm:col-span-2">
                  <InfoRow
                    icon={Clipboard}
                    label="Notas de comportamiento"
                    value={pet.behavior_notes}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm"
                  >
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
