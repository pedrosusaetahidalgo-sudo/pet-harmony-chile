import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface TimeSlot {
  start: string;
  end: string;
}

interface ServiceAvailabilityCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  availableSlots?: TimeSlot[];
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  className?: string;
  providerId?: string;
  providerType?: "dog_walker" | "dogsitter" | "veterinarian" | "trainer";
}

const defaultTimeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

export const ServiceAvailabilityCalendar = ({
  selectedDate,
  onDateSelect,
  selectedTime,
  onTimeSelect,
  availableSlots,
  minDate = new Date(),
  maxDate,
  showTimeSelect = true,
  className = "",
  providerId,
  providerType
}: ServiceAvailabilityCalendarProps) => {
  const [providerAvailability, setProviderAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDaySlots, setCurrentDaySlots] = useState<string[]>([]);

  useEffect(() => {
    if (providerId && providerType) {
      loadProviderAvailability();
    }
  }, [providerId, providerType]);

  useEffect(() => {
    if (selectedDate && providerAvailability.length > 0) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayAvail = providerAvailability.find(a => a.date === dateStr);
      setCurrentDaySlots(dayAvail?.time_slots || []);
    } else {
      setCurrentDaySlots([]);
    }
  }, [selectedDate, providerAvailability]);

  const loadProviderAvailability = async () => {
    if (!providerId || !providerType) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('user_id', providerId)
        .eq('provider_type', providerType)
        .eq('is_available', true)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true });
      
      setProviderAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAvailability = (date: Date) => {
    if (!providerId || providerAvailability.length === 0) return true;
    const dateStr = format(date, 'yyyy-MM-dd');
    return providerAvailability.some(a => a.date === dateStr);
  };

  const slotsToShow = providerId && providerAvailability.length > 0 
    ? currentDaySlots 
    : defaultTimeSlots;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Selecciona Fecha y Hora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {providerId && providerAvailability.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">Este proveedor no ha configurado su disponibilidad</p>
              </div>
            )}
            
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              locale={es}
              disabled={(date) => {
                if (date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                if (providerId && providerAvailability.length > 0) {
                  return !hasAvailability(date);
                }
                return false;
              }}
              modifiers={providerId ? {
                available: (date) => hasAvailability(date)
              } : undefined}
              modifiersStyles={providerId ? {
                available: { 
                  backgroundColor: 'hsl(var(--primary) / 0.15)', 
                  fontWeight: 'bold' 
                }
              } : undefined}
              className="rounded-md border pointer-events-auto"
            />

            {selectedDate && showTimeSelect && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Hora disponible
                </Label>
                {slotsToShow.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {slotsToShow.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => onTimeSelect(time)}
                        className={selectedTime === time ? "bg-primary" : ""}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay horarios disponibles para esta fecha
                  </p>
                )}
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">Fecha seleccionada:</p>
                <p className="text-lg font-bold text-primary">
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} a las {selectedTime}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceAvailabilityCalendar;
