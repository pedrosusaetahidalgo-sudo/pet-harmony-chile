import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, 
  SlidersHorizontal, 
  Calendar as CalendarIcon, 
  Star, 
  MapPin,
  X,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FilterState {
  searchTerm: string;
  date: Date | undefined;
  priceRange: [number, number];
  minRating: number;
  sortBy: string;
  availableNow: boolean;
}

interface AdvancedServiceFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  maxPrice?: number;
  serviceType: string;
  className?: string;
}

export const AdvancedServiceFilters = ({
  onFiltersChange,
  maxPrice = 100000,
  serviceType,
  className = ""
}: AdvancedServiceFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    date: undefined,
    priceRange: [0, maxPrice],
    minRating: 0,
    sortBy: "rating",
    availableNow: false
  });
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      searchTerm: "",
      date: undefined,
      priceRange: [0, maxPrice],
      minRating: 0,
      sortBy: "rating",
      availableNow: false
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount = [
    filters.date,
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
    filters.minRating > 0,
    filters.availableNow
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o ubicación..." 
            className="pl-12 h-12 rounded-xl border-2 focus:border-primary transition-all"
            value={filters.searchTerm}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
          />
        </div>
        
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-12 px-4 rounded-xl border-2 gap-2",
                filters.date && "border-primary bg-primary/5"
              )}
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">
                {filters.date ? format(filters.date, "d MMM", { locale: es }) : "Fecha"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={filters.date}
              onSelect={(date) => updateFilter("date", date)}
              locale={es}
              disabled={(date) => date < new Date()}
              className="pointer-events-auto"
            />
            {filters.date && (
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => updateFilter("date", undefined)}
                >
                  Limpiar fecha
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Filters Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-12 px-4 rounded-xl border-2 gap-2 relative",
                activeFiltersCount > 0 && "border-primary bg-primary/5"
              )}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filtros Avanzados
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar todo
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Available Now */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium">Disponible ahora</p>
                  <p className="text-sm text-muted-foreground">
                    Mostrar solo profesionales con disponibilidad inmediata
                  </p>
                </div>
                <Button
                  variant={filters.availableNow ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter("availableNow", !filters.availableNow)}
                >
                  {filters.availableNow ? <Check className="h-4 w-4" /> : "Activar"}
                </Button>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Rango de precio</Label>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    min={0}
                    max={maxPrice}
                    step={1000}
                    onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
                    className="mt-2"
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>${filters.priceRange[0].toLocaleString()}</span>
                    <span>${filters.priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Valoración mínima</Label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={filters.minRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilter("minRating", rating)}
                      className="flex-1"
                    >
                      {rating === 0 ? (
                        "Todos"
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" />
                          {rating}+
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Ordenar por</Label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => updateFilter("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Mejor valorados</SelectItem>
                    <SelectItem value="reviews">Más reseñas</SelectItem>
                    <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="experience">Más experiencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80"
                onClick={() => setIsOpen(false)}
              >
                Aplicar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.date && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 gap-1">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {format(filters.date, "d MMM", { locale: es })}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("date", undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 gap-1">
              ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("priceRange", [0, maxPrice])}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 gap-1">
              <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
              {filters.minRating}+
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("minRating", 0)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.availableNow && (
            <Badge variant="secondary" className="pl-3 pr-1 py-1 gap-1">
              Disponible ahora
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter("availableNow", false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedServiceFilters;
