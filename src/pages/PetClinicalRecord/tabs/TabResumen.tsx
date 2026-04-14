import { useState } from 'react';
import {
  AlertTriangle,
  Pill,
  Stethoscope,
  Phone,
  Building,
  Shield,
  Calendar,
  Clipboard,
  Plus,
} from '@/lib/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PetData } from '../types';
import { formatDate } from '../helpers';
import { InfoRow } from '../shared';
import { GrimaceChecklist } from '@/components/medical/GrimaceChecklist';

export function TabResumen({ pet, onRefresh, viewMode }: { pet: PetData; onRefresh?: () => void; viewMode?: 'owner' | 'vet' }) {
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergyType, setAllergyType] = useState<'food' | 'medication' | 'environmental'>('food');
  const [allergyValue, setAllergyValue] = useState('');
  const [showMedForm, setShowMedForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [conditionName, setConditionName] = useState('');
  const [conditionDetail, setConditionDetail] = useState('');
  const [saving, setSaving] = useState(false);

  const hasAllergies =
    (pet.allergies_food?.length || 0) +
      (pet.allergies_medication?.length || 0) +
      (pet.allergies_environmental?.length || 0) >
    0;

  const hasMedications = pet.current_medications && pet.current_medications.length > 0;
  const hasChronicConditions =
    pet.chronic_conditions_detail && Object.keys(pet.chronic_conditions_detail).length > 0;

  const saveAllergy = async () => {
    if (!allergyValue.trim()) return;
    setSaving(true);
    const field = `allergies_${allergyType}` as
      | 'allergies_food'
      | 'allergies_medication'
      | 'allergies_environmental';
    const current = pet[field];
    const updated = [...(current || []), allergyValue.trim()];
    const { error } = await supabase
      .from('pets')
      .update({ [field]: updated })
      .eq('id', pet.id);
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
      return;
    }
    toast.success('Alergia agregada');
    setAllergyValue('');
    setShowAllergyForm(false);
    onRefresh?.();
  };

  const saveMedication = async () => {
    if (!medName.trim()) return;
    setSaving(true);
    const current = pet.current_medications || [];
    const updated = [
      ...current,
      { name: medName.trim(), dose: medDose || undefined, frequency: medFreq || undefined },
    ];
    const { error } = await supabase
      .from('pets')
      .update({ current_medications: updated as unknown as null })
      .eq('id', pet.id);
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
      return;
    }
    toast.success('Medicamento agregado');
    setMedName('');
    setMedDose('');
    setMedFreq('');
    setShowMedForm(false);
    onRefresh?.();
  };

  const saveCondition = async () => {
    if (!conditionName.trim()) return;
    setSaving(true);
    const current = pet.chronic_conditions_detail || {};
    const updated = { ...current, [conditionName.trim()]: conditionDetail.trim() || true };
    const { error } = await supabase
      .from('pets')
      .update({ chronic_conditions_detail: updated as unknown as null })
      .eq('id', pet.id);
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
      return;
    }
    toast.success('Condicion agregada');
    setConditionName('');
    setConditionDetail('');
    setShowConditionForm(false);
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      {viewMode === 'vet' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
          <Stethoscope className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">Vista veterinaria — datos gestionados por el dueno</p>
        </div>
      )}
      {/* Allergies */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alergias
            </CardTitle>
            {viewMode !== 'vet' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-purple-600"
                onClick={() => setShowAllergyForm(!showAllergyForm)}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode !== 'vet' && showAllergyForm && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg space-y-2">
              <Select
                value={allergyType}
                onValueChange={(v) => setAllergyType(v as typeof allergyType)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Alimentaria</SelectItem>
                  <SelectItem value="medication">Medicamento</SelectItem>
                  <SelectItem value="environmental">Ambiental</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Pollo, Ibuprofeno, Polen..."
                  value={allergyValue}
                  onChange={(e) => setAllergyValue(e.target.value)}
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  className="h-9"
                  onClick={saveAllergy}
                  disabled={saving || !allergyValue.trim()}
                >
                  {saving ? '...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
          {!hasAllergies && !showAllergyForm ? (
            viewMode === 'vet' ? (
              <p className="text-sm text-muted-foreground p-3">Sin alergias registradas</p>
            ) : (
            <button
              onClick={() => setShowAllergyForm(true)}
              className="w-full text-left p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group"
            >
              <p className="text-sm text-muted-foreground group-hover:text-purple-600">
                Sin alergias registradas
              </p>
              <p className="text-xs text-muted-foreground/60 group-hover:text-purple-500 mt-0.5">
                Toca para agregar
              </p>
            </button>
            )
          ) : (
            <div className="space-y-3">
              {pet.allergies_food && pet.allergies_food.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Alimentarias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pet.allergies_food.map((a, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
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
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
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
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-purple-500" />
              Medicamentos actuales
            </CardTitle>
            {viewMode !== 'vet' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-purple-600"
                onClick={() => setShowMedForm(!showMedForm)}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode !== 'vet' && showMedForm && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg space-y-2">
              <Input
                placeholder="Nombre del medicamento"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                className="h-9 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Dosis (ej: 10mg)"
                  value={medDose}
                  onChange={(e) => setMedDose(e.target.value)}
                  className="h-9 text-sm"
                />
                <Select value={medFreq} onValueChange={setMedFreq}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 vez/día">1 vez/día</SelectItem>
                    <SelectItem value="2 veces/día">2 veces/día</SelectItem>
                    <SelectItem value="3 veces/día">3 veces/día</SelectItem>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Quincenal">Quincenal</SelectItem>
                    <SelectItem value="Mensual">Mensual</SelectItem>
                    <SelectItem value="Cada 3 meses">Cada 3 meses</SelectItem>
                    <SelectItem value="Cada 6 meses">Cada 6 meses</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                    <SelectItem value="Según necesidad">Según necesidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="h-9 w-full"
                onClick={saveMedication}
                disabled={saving || !medName.trim()}
              >
                {saving ? 'Guardando...' : 'Agregar medicamento'}
              </Button>
            </div>
          )}
          {!hasMedications && !showMedForm ? (
            viewMode === 'vet' ? (
              <p className="text-sm text-muted-foreground p-3">Sin medicamentos activos</p>
            ) : (
            <button
              onClick={() => setShowMedForm(true)}
              className="w-full text-left p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group"
            >
              <p className="text-sm text-muted-foreground group-hover:text-purple-600">
                Sin medicamentos activos
              </p>
              <p className="text-xs text-muted-foreground/60 group-hover:text-purple-500 mt-0.5">
                Toca para agregar
              </p>
            </button>
            )
          ) : (
            <div className="space-y-3">
              {pet.current_medications?.map((med, i) => (
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              Condiciones crónicas
            </CardTitle>
            {viewMode !== 'vet' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-purple-600"
                onClick={() => setShowConditionForm(!showConditionForm)}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode !== 'vet' && showConditionForm && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg space-y-2">
              <Select value={conditionName} onValueChange={setConditionName}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Displasia',
                    'Diabetes',
                    'Insuficiencia renal',
                    'Artritis',
                    'Alergia atópica',
                    'Obesidad',
                    'Epilepsia',
                    'Hipotiroidismo',
                    'Enfermedad cardíaca',
                    'Enfermedad periodontal',
                    'Insuficiencia hepática',
                    'Cáncer',
                    'Asma felina',
                    'FLUTD',
                    'Cushing',
                    'Addison',
                    'Pancreatitis',
                    'IBD',
                    'Cataratas',
                    'Sordera',
                    'Otra',
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Detalle (opcional)"
                value={conditionDetail}
                onChange={(e) => setConditionDetail(e.target.value)}
                className="h-9 text-sm"
              />
              <Button
                size="sm"
                className="h-9 w-full"
                onClick={saveCondition}
                disabled={saving || !conditionName.trim()}
              >
                {saving ? 'Guardando...' : 'Agregar condición'}
              </Button>
            </div>
          )}
          {!hasChronicConditions && !showConditionForm ? (
            viewMode === 'vet' ? (
              <p className="text-sm text-muted-foreground p-3">Sin condiciones cronicas registradas</p>
            ) : (
            <button
              onClick={() => setShowConditionForm(true)}
              className="w-full text-left p-3 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group"
            >
              <p className="text-sm text-muted-foreground group-hover:text-purple-600">
                Sin condiciones crónicas registradas
              </p>
              <p className="text-xs text-muted-foreground/60 group-hover:text-purple-500 mt-0.5">
                Toca para agregar
              </p>
            </button>
            )
          ) : (
            <div className="space-y-2">
              {Object.entries(pet.chronic_conditions_detail!).map(([condition, detail], i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium capitalize">{condition}</p>
                  {typeof detail === 'string' && (
                    <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
                  )}
                  {typeof detail === 'object' && detail !== null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Object.entries(detail)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
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
                  <InfoRow
                    icon={Phone}
                    label="Teléfono"
                    value={
                      <a
                        href={`tel:${pet.emergency_vet_phone}`}
                        className="text-purple-600 hover:underline"
                      >
                        {pet.emergency_vet_phone}
                      </a>
                    }
                  />
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
              <InfoRow
                icon={Shield}
                label="Seguro"
                value={`${pet.insurance_provider}${pet.insurance_policy ? ` (${pet.insurance_policy})` : ''}`}
              />
            )}
            {pet.preferred_clinic && (
              <InfoRow icon={Building} label="Clínica preferida" value={pet.preferred_clinic} />
            )}
            {pet.last_vet_visit && (
              <InfoRow
                icon={Calendar}
                label="Última visita"
                value={formatDate(pet.last_vet_visit)}
              />
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
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Necesidades especiales
                </p>
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
      {(pet.species?.toLowerCase() === 'gato' || pet.species?.toLowerCase() === 'perro') && (
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
            <GrimaceChecklist petId={pet.id} petName={pet.name} species={pet.species} />
          </CardContent>
        </Card>
      )}

      {/* CTA: subir documentos + compartir — discoverability (owner only) */}
      {viewMode !== 'vet' && (
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="border-purple-200/60 bg-purple-50/30 hover:bg-purple-50/60 transition-colors cursor-pointer"
            onClick={() => {
              const tabTrigger = document.querySelector('[value="documentos"]') as HTMLButtonElement;
              tabTrigger?.click();
            }}
          >
            <CardContent className="p-3 text-center">
              <Clipboard className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs font-medium">Subir recetas o examenes</p>
            </CardContent>
          </Card>
          <Card
            className="border-teal-200/60 bg-teal-50/30 hover:bg-teal-50/60 transition-colors cursor-pointer"
            onClick={() => {
              const tabTrigger = document.querySelector('[value="compartir"]') as HTMLButtonElement;
              tabTrigger?.click();
            }}
          >
            <CardContent className="p-3 text-center">
              <Phone className="h-5 w-5 text-teal-500 mx-auto mb-1" />
              <p className="text-xs font-medium">Compartir ficha con tu vet</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
