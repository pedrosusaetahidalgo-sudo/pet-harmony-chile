import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MapFiltersProps {
  activeView: "lost" | "adoption" | "services";
  filters: {
    searchRadius: number;
    petType: string;
    petSize: string;
    status: string;
    serviceType: string;
    adoptionView?: string;
  };
  setFilters: (filters: any) => void;
  onClose: () => void;
}

const MapFilters = ({ activeView, filters, setFilters, onClose }: MapFiltersProps) => {
  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setFilters({
      searchRadius: 50,
      petType: "all",
      petSize: "all",
      status: "all",
      serviceType: "all",
      adoptionView: "all",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Radius */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Radio de búsqueda</Label>
          <span className="text-sm text-muted-foreground">
            {filters.searchRadius >= 100 ? "Toda la región" : `${filters.searchRadius} km`}
          </span>
        </div>
        <Slider
          value={[filters.searchRadius]}
          onValueChange={(value) => updateFilter("searchRadius", value[0])}
          min={5}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5 km</span>
          <span>50 km</span>
          <span>Toda la región</span>
        </div>
      </div>

      {/* Pet Type - for lost and adoption views */}
      {(activeView === "lost" || activeView === "adoption") && (
        <div className="space-y-2">
          <Label>Tipo de mascota</Label>
          <Select
            value={filters.petType}
            onValueChange={(value) => updateFilter("petType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="perro">🐕 Perros</SelectItem>
              <SelectItem value="gato">🐱 Gatos</SelectItem>
              <SelectItem value="otro">🐾 Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Adoption View Filter - animals, shelters, or both */}
      {activeView === "adoption" && (
        <div className="space-y-2">
          <Label>Mostrar en mapa</Label>
          <Select
            value={filters.adoptionView || "all"}
            onValueChange={(value) => updateFilter("adoptionView", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🐾 Todo (Mascotas + Refugios)</SelectItem>
              <SelectItem value="animals">🐕 Solo mascotas</SelectItem>
              <SelectItem value="shelters">🏠 Solo refugios/hogares</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pet Size - for adoption view */}
      {activeView === "adoption" && (
        <div className="space-y-2">
          <Label>Tamaño</Label>
          <Select
            value={filters.petSize}
            onValueChange={(value) => updateFilter("petSize", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tamaño" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tamaños</SelectItem>
              <SelectItem value="Pequeño">Pequeño</SelectItem>
              <SelectItem value="Mediano">Mediano</SelectItem>
              <SelectItem value="Grande">Grande</SelectItem>
              <SelectItem value="Gigante">Gigante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status - for lost pets */}
      {activeView === "lost" && (
        <div className="space-y-2">
          <Label>Estado del reporte</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilter("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="lost">🔴 Perdidas</SelectItem>
              <SelectItem value="found">🟢 Encontradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Service Type - for services view */}
      {activeView === "services" && (
        <div className="space-y-2">
          <Label>Tipo de servicio</Label>
          <Select
            value={filters.serviceType}
            onValueChange={(value) => updateFilter("serviceType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              <SelectItem value="dog_walker">🐕 Paseadores</SelectItem>
              <SelectItem value="dogsitter">🏠 Cuidadores</SelectItem>
              <SelectItem value="veterinarian">🩺 Veterinarios</SelectItem>
              <SelectItem value="trainer">🎓 Entrenadores</SelectItem>
              <SelectItem value="grooming">✂️ Grooming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={resetFilters} className="flex-1">
          Restablecer
        </Button>
        <Button onClick={onClose} className="flex-1 bg-warm-gradient hover:opacity-90">
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};

export default MapFilters;
