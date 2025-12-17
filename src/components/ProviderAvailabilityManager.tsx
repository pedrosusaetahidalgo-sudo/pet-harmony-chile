import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Clock, Save, Trash2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProviderAvailabilityManagerProps {
  providerType: "dog_walker" | "dogsitter" | "veterinarian" | "trainer";
  className?: string;
}

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

export const ProviderAvailabilityManager = ({
  providerType,
  className = ""
}: ProviderAvailabilityManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [notes, setNotes] = useState("");
  const [existingAvailability, setExistingAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadAvailability();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate && existingAvailability.length > 0) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existing = existingAvailability.find(a => a.date === dateStr);
      if (existing) {
        setSelectedSlots(existing.time_slots || []);
        setIsAvailable(existing.is_available);
        setNotes(existing.notes || "");
      } else {
        setSelectedSlots([]);
        setIsAvailable(true);
        setNotes("");
      }
    }
  }, [selectedDate, existingAvailability]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('user_id', user?.id)
        .eq('provider_type', providerType)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;
      setExistingAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot].sort()
    );
  };

  const saveAvailability = async () => {
    if (!selectedDate || !user) return;

    try {
      setSaving(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if exists
      const existing = existingAvailability.find(a => a.date === dateStr);
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('provider_availability')
          .update({
            time_slots: selectedSlots,
            is_available: isAvailable,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('provider_availability')
          .insert({
            user_id: user.id,
            provider_type: providerType,
            date: dateStr,
            time_slots: selectedSlots,
            is_available: isAvailable,
            notes: notes || null
          });

        if (error) throw error;
      }

      toast({
        title: "Disponibilidad guardada",
        description: `Tu disponibilidad para ${format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} ha sido actualizada`
      });

      loadAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la disponibilidad"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAvailability = async () => {
    if (!selectedDate || !user) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = existingAvailability.find(a => a.date === dateStr);
    
    if (!existing) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('provider_availability')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      toast({
        title: "Disponibilidad eliminada",
        description: "La disponibilidad ha sido eliminada"
      });

      setSelectedSlots([]);
      setIsAvailable(true);
      setNotes("");
      loadAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la disponibilidad"
      });
    } finally {
      setSaving(false);
    }
  };

  const hasAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return existingAvailability.some(a => a.date === dateStr && a.is_available);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          Gestionar Mi Disponibilidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={es}
          disabled={(date) => date < new Date()}
          modifiers={{
            available: (date) => hasAvailability(date)
          }}
          modifiersStyles={{
            available: { 
              backgroundColor: 'hsl(var(--primary) / 0.2)',
              borderRadius: '50%'
            }
          }}
          className="rounded-md border pointer-events-auto"
        />

        {selectedDate && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="available" className="text-sm">Disponible</Label>
                <Switch
                  id="available"
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
              </div>
            </div>

            {isAvailable && (
              <>
                <div>
                  <Label className="text-sm flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    Horarios disponibles
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedSlots.includes(slot) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSlot(slot)}
                        className={selectedSlots.includes(slot) ? "bg-primary" : ""}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Notas (opcional)</Label>
                  <Textarea
                    placeholder="Ej: Solo disponible para mascotas pequeñas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button
                onClick={saveAvailability}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              {existingAvailability.some(a => a.date === format(selectedDate, 'yyyy-MM-dd')) && (
                <Button
                  variant="destructive"
                  onClick={deleteAvailability}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Preview of upcoming availability */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Próxima disponibilidad</Label>
          {existingAvailability.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No has configurado disponibilidad aún
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {existingAvailability.slice(0, 5).map((avail) => (
                <div 
                  key={avail.id} 
                  className="flex items-center justify-between p-2 bg-background rounded border"
                >
                  <span className="text-sm font-medium">
                    {format(new Date(avail.date), "EEE d MMM", { locale: es })}
                  </span>
                  <div className="flex gap-1">
                    {avail.is_available ? (
                      <Badge variant="secondary" className="text-xs">
                        {avail.time_slots?.length || 0} horarios
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        No disponible
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderAvailabilityManager;
