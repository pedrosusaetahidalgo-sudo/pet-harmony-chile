import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface AddMedicalRecordProps {
  petId: string;
  petBreed: string;
  petSpecies: string;
}

interface MedicalSuggestion {
  value: string;
  label: string;
  description?: string;
}

export function AddMedicalRecord({ petId, petBreed, petSpecies }: AddMedicalRecordProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recordType, setRecordType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [nextDate, setNextDate] = useState<Date>();
  const [clinicName, setClinicName] = useState("");
  const [veterinarianName, setVeterinarianName] = useState("");
  const [notes, setNotes] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [suggestions, setSuggestions] = useState<MedicalSuggestion[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch veterinarias for selection
  const { data: veterinarias } = useQuery({
    queryKey: ["places-veterinarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("place_type", "veterinaria");
      
      if (error) throw error;
      return data || [];
    },
  });

  const recordTypes = [
    { value: "vacuna", label: "Vacuna" },
    { value: "consulta", label: "Consulta Veterinaria" },
    { value: "medicamento", label: "Medicamento/Tratamiento" },
    { value: "cirugia", label: "Cirugía" },
    { value: "examen", label: "Examen/Análisis" },
    { value: "emergencia", label: "Emergencia" },
  ];

  const fetchSuggestions = async (type: string) => {
    if (!petBreed || !petSpecies) return;
    
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("medical-suggestions", {
        body: { breed: petBreed, species: petSpecies, recordType: type },
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        title: "Error al obtener sugerencias",
        description: "No se pudieron cargar las recomendaciones de IA",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setRecordType(type);
    setTitle("");
    fetchSuggestions(type);
  };

  const handleSuggestionSelect = (suggestion: MedicalSuggestion) => {
    setTitle(suggestion.label);
    if (suggestion.description) {
      setDescription(suggestion.description);
    }
  };

  const handlePlaceSelect = (placeId: string) => {
    setPlaceId(placeId);
    const place = veterinarias?.find(v => v.id === placeId);
    if (place) {
      setClinicName(place.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !recordType || !title) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: medicalRecord, error } = await supabase
        .from("medical_records")
        .insert({
          pet_id: petId,
          record_type: recordType,
          title,
          description,
          date: format(date, "yyyy-MM-dd"),
          next_date: nextDate ? format(nextDate, "yyyy-MM-dd") : null,
          clinic_name: clinicName,
          veterinarian_name: veterinarianName,
          notes,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Award points for vet visit
      try {
        // Get pet owner
        const { data: pet } = await supabase
          .from("pets")
          .select("owner_id")
          .eq("id", petId)
          .maybeSingle();

        if (pet?.owner_id) {
          await supabase.rpc("award_points", {
            p_user_id: pet.owner_id,
            p_points: 30, // DEFAULT_POINTS_CONFIG.vetVisit
            p_action_type: "vet_visit",
            p_action_id: medicalRecord.id,
            p_description: "Visita veterinaria registrada",
          });
        }
      } catch (pointsError) {
        console.error("Error awarding points:", pointsError);
        // Don't fail the medical record creation if points fail
      }

      toast({
        title: "Registro creado",
        description: "El registro médico se ha guardado correctamente",
      });

      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecordType("");
    setTitle("");
    setDescription("");
    setDate(undefined);
    setNextDate(undefined);
    setClinicName("");
    setVeterinarianName("");
    setNotes("");
    setPlaceId("");
    setSuggestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-warm-gradient hover:opacity-90">
          <Plus className="h-4 w-4" />
          Agregar Registro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Registro Médico</DialogTitle>
          <DialogDescription>
            Agrega un nuevo registro al historial médico de tu mascota
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de registro */}
          <div className="space-y-2">
            <Label htmlFor="record-type">Tipo de Registro *</Label>
            <Select value={recordType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {recordTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sugerencias de IA */}
          {loadingSuggestions && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Obteniendo sugerencias de Claude...
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Sugerencias para {petBreed}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="text-left p-2 text-sm rounded-md hover:bg-primary/10 transition-colors border border-border/50"
                  >
                    <div className="font-medium">{suggestion.label}</div>
                    {suggestion.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {suggestion.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Vacuna Antirrábica, Control de Rutina..."
              required
            />
          </div>

          {/* Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha del Registro *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Selecciona fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={es}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Próxima Cita (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !nextDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextDate ? format(nextDate, "PPP", { locale: es }) : "Selecciona fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={nextDate}
                    onSelect={setNextDate}
                    initialFocus
                    locale={es}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Veterinaria */}
          <div className="space-y-2">
            <Label htmlFor="place">Veterinaria/Clínica</Label>
            <Select value={placeId} onValueChange={handlePlaceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una veterinaria" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {veterinarias?.map((vet) => (
                  <SelectItem key={vet.id} value={vet.id}>
                    {vet.name} - {vet.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Veterinario */}
          <div className="space-y-2">
            <Label htmlFor="vet-name">Nombre del Veterinario</Label>
            <Input
              id="vet-name"
              value={veterinarianName}
              onChange={(e) => setVeterinarianName(e.target.value)}
              placeholder="Ej: Dr. Juan Pérez"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del procedimiento, tratamiento o consulta..."
              rows={3}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones, reacciones, instrucciones de seguimiento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-warm-gradient hover:opacity-90">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Registro"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
