import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Pet {
  id: string;
  name: string;
  photo_url: string | null;
}

interface CalendarFiltersProps {
  pets: Pet[];
  selectedPetId: string;
  onPetChange: (petId: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const EVENT_TYPES = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'routine', label: 'Rutinas' },
  { value: 'reminder', label: 'Recordatorios' },
  { value: 'booking', label: 'Citas' },
];

export function CalendarFilters({
  pets,
  selectedPetId,
  onPetChange,
  selectedType,
  onTypeChange,
}: CalendarFiltersProps) {
  return (
    <div className="flex gap-2">
      <Select value={selectedPetId} onValueChange={onPetChange}>
        <SelectTrigger className="h-8 text-xs flex-1">
          <SelectValue placeholder="Todas las mascotas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las mascotas</SelectItem>
          {pets.map((pet) => (
            <SelectItem key={pet.id} value={pet.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={pet.photo_url || undefined} />
                  <AvatarFallback className="text-[8px]">{pet.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {pet.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="h-8 text-xs flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EVENT_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
