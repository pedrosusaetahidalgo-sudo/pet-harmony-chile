import { useState, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isBefore,
  startOfDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { formatBookingDate } from '@/lib/format';
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

  const {
    data: slotsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAvailableSlots({
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
      ) : isError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-center space-y-3"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-900">
              No pudimos cargar los horarios disponibles.
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Puede ser un problema de conexion. Intenta nuevamente.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 border-red-300 text-red-900 hover:bg-red-100"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Reintentar
          </Button>
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

            // CC-10: etiqueta accesible + tooltip nativo con el count de horarios.
            // Antes solo había un dot sin número: el tutor no sabía si había 1 o 10.
            const dayLabel = format(day, 'd');
            const accessibleLabel =
              hasSlots && !isPast
                ? `${dayLabel} — ${slotCount} ${slotCount === 1 ? 'horario disponible' : 'horarios disponibles'}`
                : isPast
                  ? `${dayLabel} (fecha pasada)`
                  : `${dayLabel} (sin horarios)`;

            return (
              <button
                key={dateStr}
                disabled={isPast || !hasSlots}
                onClick={() => setViewDate(dateStr)}
                aria-label={accessibleLabel}
                title={accessibleLabel}
                className={`
                  relative h-10 rounded-md text-sm transition-colors
                  ${isPast ? 'text-muted-foreground/40 cursor-not-allowed' : ''}
                  ${!hasSlots && !isPast ? 'text-muted-foreground cursor-not-allowed' : ''}
                  ${hasSlots && !isPast ? 'hover:bg-purple-50 cursor-pointer font-medium' : ''}
                  ${isSelected ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
                  ${isToday(day) && !isSelected ? 'ring-1 ring-purple-300' : ''}
                `}
              >
                {dayLabel}
                {hasSlots && !isPast && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-semibold leading-[14px] text-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {slotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Time slots for selected date */}
      {viewDate && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1.5 capitalize">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Horarios disponibles — {formatBookingDate(viewDate)}
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
