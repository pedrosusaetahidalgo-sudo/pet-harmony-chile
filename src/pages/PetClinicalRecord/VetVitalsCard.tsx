import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Loader2, TrendingUp } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { PetData } from './types';

interface VetVitalsCardProps {
  pet: PetData;
}

export function VetVitalsCard({ pet }: VetVitalsCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState(pet.weight?.toString() || '');
  const [temp, setTemp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respRate, setRespRate] = useState('');

  const lastWeightEntry = pet.weight_history?.length
    ? pet.weight_history[pet.weight_history.length - 1]
    : null;

  const handleSave = async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      toast.error('Ingresa un peso valido');
      return;
    }
    setSaving(true);
    try {
      // Update pet weight
      const newHistory = [
        ...(pet.weight_history || []),
        { date: new Date().toISOString().split('T')[0], weight: w },
      ];

      const { error } = await supabase
        .from('pets')
        .update({
          weight: w,
          weight_history: newHistory,
        })
        .eq('id', pet.id);

      if (error) throw error;

      // Create medical record for vitals
      const vitalsNote = [
        `Peso: ${w} kg`,
        temp ? `Temperatura: ${temp}°C` : null,
        heartRate ? `FC: ${heartRate} lpm` : null,
        respRate ? `FR: ${respRate} rpm` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      await supabase.from('medical_records').insert({
        pet_id: pet.id,
        record_type: 'control_sano',
        title: 'Signos vitales',
        description: vitalsNote,
        date: new Date().toISOString().split('T')[0],
      });

      toast.success('Signos vitales registrados');
      queryClient.invalidateQueries({ queryKey: ['pet-clinical', pet.id] });
      queryClient.invalidateQueries({ queryKey: ['pet-medical-records-timeline', pet.id] });
      setIsEditing(false);
      setTemp('');
      setHeartRate('');
      setRespRate('');
    } catch {
      toast.error('Error al guardar signos vitales');
    } finally {
      setSaving(false);
    }
  };

  // Mini sparkline for weight history
  const weightHistory = pet.weight_history?.slice(-6) || [];

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          Signos vitales
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {!isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Peso</p>
                <p className="text-lg font-bold">{pet.weight ? `${pet.weight} kg` : '—'}</p>
              </div>
              {lastWeightEntry && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Ultimo registro
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lastWeightEntry.date).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Weight mini history */}
            {weightHistory.length > 1 && (
              <div className="flex items-end gap-1 h-8">
                {weightHistory.map((entry, i) => {
                  const maxW = Math.max(...weightHistory.map((e) => e.weight));
                  const minW = Math.min(...weightHistory.map((e) => e.weight));
                  const range = maxW - minW || 1;
                  const height = ((entry.weight - minW) / range) * 24 + 8;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-teal-200 rounded-t hover:bg-teal-400 transition-colors"
                      style={{ height: `${height}px` }}
                      title={`${entry.date}: ${entry.weight} kg`}
                    />
                  );
                })}
                <TrendingUp className="h-3 w-3 text-muted-foreground ml-1" />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => {
                setWeight(pet.weight?.toString() || '');
                setIsEditing(true);
              }}
            >
              Registrar signos vitales
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="32.0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Temp (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="38.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">FC (lpm)</Label>
                <Input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="80"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">FR (rpm)</Label>
                <Input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="18"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
