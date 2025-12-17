import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  showTime?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DateTimePicker({
  date,
  onDateChange,
  showTime = false,
  placeholder = "Seleccionar fecha",
  className = "",
  disabled = false,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve time if already set
      if (date) {
        selectedDate.setHours(date.getHours(), date.getMinutes());
      }
      onDateChange(selectedDate);
    } else {
      onDateChange(undefined);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    const newDate = date ? new Date(date) : new Date();
    if (type === "hour") {
      newDate.setHours(parseInt(value));
    } else {
      newDate.setMinutes(parseInt(value));
    }
    onDateChange(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            showTime ? (
              format(date, "PPP 'a las' HH:mm", { locale: es })
            ) : (
              format(date, "PPP", { locale: es })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={es}
          disabled={(dateToCheck) => {
            if (minDate && dateToCheck < minDate) return true;
            if (maxDate && dateToCheck > maxDate) return true;
            return false;
          }}
          className="pointer-events-auto"
        />
        {showTime && (
          <div className="border-t p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select
              value={date ? date.getHours().toString() : undefined}
              onValueChange={(value) => handleTimeChange("hour", value)}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Hora" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>:</span>
            <Select
              value={date ? date.getMinutes().toString() : undefined}
              onValueChange={(value) => handleTimeChange("minute", value)}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute.toString()}>
                    {minute.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default DateTimePicker;
