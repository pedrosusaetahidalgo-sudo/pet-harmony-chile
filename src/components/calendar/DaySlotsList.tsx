import { SlotCard } from "./SlotCard";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX } from "lucide-react";

interface Props {
  slots: any[];
  isLoading: boolean;
  onBook: (slot: any) => void;
}

export function DaySlotsList({ slots, isLoading, onBook }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarX className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No hay servicios disponibles este dia</p>
        <p className="text-xs text-muted-foreground mt-1">Prueba seleccionando otra fecha</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <SlotCard key={slot.id} slot={slot} onBook={() => onBook(slot)} />
      ))}
    </div>
  );
}
