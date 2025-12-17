import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarCheck, Clock, User, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface BookingCalendarViewProps {
  providerId: string;
  providerType: "dog_walker" | "dogsitter" | "veterinarian" | "trainer";
  providerName?: string;
  providerAvatar?: string;
  onSelectDateTime: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  className?: string;
}

export const BookingCalendarView = ({
  providerId,
  providerType,
  providerName,
  providerAvatar,
  onSelectDateTime,
  selectedDate,
  selectedTime,
  className = ""
}: BookingCalendarViewProps) => {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalDate, setInternalDate] = useState<Date | undefined>(selectedDate);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    loadProviderAvailability();
  }, [providerId, providerType]);

  useEffect(() => {
    if (internalDate && availability.length > 0) {
      const dateStr = format(internalDate, 'yyyy-MM-dd');
      const dayAvail = availability.find(a => a.date === dateStr);
      setAvailableSlots(dayAvail?.time_slots || []);
    } else {
      setAvailableSlots([]);
    }
  }, [internalDate, availability]);

  const loadProviderAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('user_id', providerId)
        .eq('provider_type', providerType)
        .eq('is_available', true)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading provider availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availability.some(a => a.date === dateStr);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setInternalDate(date);
  };

  const handleTimeSelect = (time: string) => {
    if (internalDate) {
      onSelectDateTime(internalDate, time);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {providerAvatar && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={providerAvatar} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Disponibilidad
            </CardTitle>
            {providerName && (
              <p className="text-sm text-muted-foreground">{providerName}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : availability.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Este profesional no ha configurado disponibilidad aún</p>
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={internalDate}
              onSelect={handleDateSelect}
              locale={es}
              disabled={(date) => {
                if (date < new Date()) return true;
                return !hasAvailability(date);
              }}
              modifiers={{
                available: (date) => hasAvailability(date)
              }}
              modifiersStyles={{
                available: { 
                  backgroundColor: 'hsl(var(--primary) / 0.15)',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-md border pointer-events-auto"
            />

            {internalDate && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg animate-fade-in">
                <p className="font-semibold text-sm">
                  {format(internalDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                
                {availableSlots.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Selecciona un horario
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={selectedTime === slot && selectedDate?.toDateString() === internalDate.toDateString() ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTimeSelect(slot)}
                          className={selectedTime === slot && selectedDate?.toDateString() === internalDate.toDateString() ? "bg-primary" : ""}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay horarios disponibles para esta fecha
                  </p>
                )}
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Fecha seleccionada:</p>
                  <p className="text-sm text-primary font-bold">
                    {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} - {selectedTime}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingCalendarView;
