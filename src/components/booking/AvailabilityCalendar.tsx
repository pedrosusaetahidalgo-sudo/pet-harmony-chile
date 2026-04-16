import { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  startOfDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import type { ComputedSlot } from '@/lib/availabilitySlots';

interface AvailabilityCalendarProps {
  providerId: string;
  serviceType?: string;
  onSlotSelect: (date: string, slot: ComputedSlot) => void;
  selectedDate?: string;
  selectedSlot?: string;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export function AvailabilityCalendar({
  providerId,
  serviceType,
  onSlotSelect,
  selectedDate,
  selectedSlot,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewDate, setViewDate] = useState<string | null>(selectedDate ?? null);

  const { data: slotsData, isLoading } = useAvailableSlots({
    providerId,
    serviceType,
    fromDate: startOfMonth(currentMonth),
    days: 35, // cover full month + overflow
  });

  // Map of date -> available slot count
  const dateSlotMap = useMemo(() => {
    const map = new Map<string, ComputedSlot[]>();
    for (const day of slotsData ?? []) {
      const available = day.slots.filter((s) => s.available);
      if (available.length > 0) {
        map.set(day.date, available);
      }
    }
    return map;
  }, [slotsData]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // Slots for selected date
  const selectedSlots = viewDate ? (dateSlotMap.get(viewDate) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-xs text-center text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasSlots = dateSlotMap.has(dateStr);
            const slotCount = dateSlotMap.get(dateStr)?.length ?? 0;
            const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day);
            const isSelected = viewDate === dateStr;

            return (
              <button
                key={dateStr}
                disabled={isPast || !hasSlots}
                onClick={() => setViewDate(dateStr)}
                className={`
                  relative h-10 rounded-md text-sm transition-colors
                  ${isPast ? 'text-muted-foreground/40 cursor-not-allowed' : ''}
                  ${!hasSlots && !isPast ? 'text-muted-foreground cursor-not-allowed' : ''}
                  ${hasSlots && !isPast ? 'hover:bg-purple-50 cursor-pointer font-medium' : ''}
                  ${isSelected ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
                  ${isToday(day) && !isSelected ? 'ring-1 ring-purple-300' : ''}
                `}
              >
                {format(day, 'd')}
                {hasSlots && !isPast && (
                  <span
                    className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Time slots for selected date */}
      {viewDate && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Horarios disponibles —{' '}
            {format(new Date(viewDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
          </h4>

          {selectedSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin horarios disponibles este dia.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {selectedSlots.map((slot) => {
                const isSlotSelected = selectedSlot === slot.start && selectedDate === viewDate;
                return (
                  <button
                    key={slot.start}
                    onClick={() => onSlotSelect(viewDate, slot)}
                    className={`
                      px-3 py-2 rounded-md text-sm border transition-colors
                      ${
                        isSlotSelected
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'hover:border-purple-300 hover:bg-purple-50 border-border'
                      }
                    `}
                  >
                    {slot.start}
                    {slot.capacity > 1 && (
                      <span className="block text-xs opacity-70">
                        {slot.capacity - slot.booked} cupos
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
