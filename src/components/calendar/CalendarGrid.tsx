import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (date: Date) => void;
  slotsPerDay: Record<string, number>;
}

export function CalendarGrid({ currentMonth, selectedDate, onSelectDate, onChangeMonth, slotsPerDay }: Props) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => onChangeMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </p>
        <Button variant="ghost" size="icon" onClick={() => onChangeMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const count = slotsPerDay[dateStr] || 0;
          const isSelected = isSameDay(d, selectedDate);
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isToday = isSameDay(d, new Date());

          return (
            <button
              key={i}
              onClick={() => onSelectDate(d)}
              className={cn(
                "relative h-10 w-full rounded-lg text-xs font-medium transition-colors",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && "hover:bg-muted",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                isToday && !isSelected && "ring-1 ring-primary/30"
              )}
            >
              {format(d, "d")}
              {count > 0 && isCurrentMonth && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                    <div
                      key={j}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
