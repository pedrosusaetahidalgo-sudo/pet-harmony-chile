import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Loader2, Sparkles } from '@/lib/icons';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { useOrganicRewards } from '@/hooks/useOrganicRewards';
import { MEDICAL_RECORD_TYPES } from '@/lib/medicalRecordTypes';
import { PostRecordRecommendation } from '@/components/medical/PostRecordRecommendation';
import { getVaccinesForSpecies } from '@/lib/vaccines';

interface AddMedicalRecordProps {
  petId: string;
  petBreed: string;
  petSpecies: string;
  petName?: string;
  /**
   * Si se provee, al abrir el dialog se pre-rellenan fecha + clinica y se
   * linkea el medical_record creado al booking (medical_records.booking_id).
   * Pensado para el flujo "Cita completada -> Crear nota clinica".
   */
  fromBooking?: {
    bookingId: string;
    bookingDate: string; // YYYY-MM-DD
    serviceType?: string;
    providerName?: string;
  };
  /** Si true y fromBooking esta presente, abre el dialog automaticamente. */
  autoOpen?: boolean;
  /** Callback que se dispara despues de guardar el record exitosamente. */
  onSaved?: (medicalRecordId: string) => void;
}

interface MedicalSuggestion {
  value: string;
  label: string;
  description?: string;
}

export function AddMedicalRecord({
  petId,
  petBreed,
  petSpecies,
  petName = 'Tu mascota',
  fromBooking,
  autoOpen = false,
  onSaved,
}: AddMedicalRecordProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recordType, setRecordType] = useState('');
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [savedRecordType, setSavedRecordType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>();
  const [nextDate, setNextDate] = useState<Date>();
  const [clinicName, setClinicName] = useState('');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [notes, setNotes] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [antiparasiticType, setAntiparasiticType] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [suggestions, setSuggestions] = useState<MedicalSuggestion[]>([]);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { reward } = useOrganicRewards();

  // Pre-fill desde una cita completada.
  // Efecto idempotente: solo corre la primera vez que fromBooking aparece.
  useEffect(() => {
    if (!fromBooking) return;
    // Solo sobreescribe si los campos estan vacios (no pisamos typing del vet).
    if (!date && fromBooking.bookingDate) {
      setDate(new Date(fromBooking.bookingDate + 'T12:00:00'));
    }
    if (!veterinarianName && fromBooking.providerName) {
      setVeterinarianName(fromBooking.providerName);
    }
    if (!recordType && fromBooking.serviceType) {
      // Mapeo parcial service_type -> record_type; caer a 'consultation' si no matchea.
      const map: Record<string, string> = {
        consulta_general: 'consultation',
        vacunacion: 'vaccine',
        cirugia: 'surgery',
        emergencia: 'consultation',
        dental: 'consultation',
      };
      setRecordType(map[fromBooking.serviceType] ?? 'consultation');
    }
    if (autoOpen && !open) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- corre solo cuando cambia fromBooking.bookingId
  }, [fromBooking?.bookingId, autoOpen]);

  // Fetch veterinarias for selection
  const { data: veterinarias } = useQuery({
    queryKey: ['places-veterinarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('place_type', 'veterinaria');

      if (error) throw error;
      return data || [];
    },
  });

  // Valores alineados con el CHECK constraint de medical_records.record_type
  // (migración 20260421000000_expand_medical_record_types.sql)
  const recordTypes = MEDICAL_RECORD_TYPES;

  const fetchSuggestions = async (type: string) => {
    if (!petBreed || !petSpecies) return;

    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('medical-suggestions', {
        body: { breed: petBreed, species: petSpecies, recordType: type },
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      logger.error('Error fetching suggestions:', error);
      toast.error('Error al obtener sugerencias', {
        description: 'No se pudieron cargar las recomendaciones de IA',
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setRecordType(type);
    setTitle('');
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
    const place = veterinarias?.find((v) => v.id === placeId);
    if (place) {
      setClinicName(place.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !recordType || !title) {
      toast.error('Campos requeridos', {
        description: 'Por favor completa los campos obligatorios',
      });
      return;
    }

    if (!user) {
      toast.error('Sesión expirada', {
        description: 'Tienes que iniciar sesion de nuevo para guardar el registro.',
      });
      return;
    }

    setLoading(true);
    try {
      const insertPayload: Record<string, unknown> = {
        pet_id: petId,
        owner_id: user.id,
        record_type: recordType,
        title,
        description,
        date: format(date, 'yyyy-MM-dd'),
        next_date: nextDate ? format(nextDate, 'yyyy-MM-dd') : null,
        clinic_name: clinicName,
        veterinarian_name: veterinarianName,
        notes,
        batch_number: batchNumber || null,
        serial_number: serialNumber || null,
        antiparasitic_type: antiparasiticType || null,
        product_brand: productBrand || null,
      };
      // Link al booking si se creo desde una cita completada.
      // Columnas agregadas en migracion 20260612000000.
      if (fromBooking?.bookingId) {
        insertPayload.booking_id = fromBooking.bookingId;
        insertPayload.booking_type = 'vet';
      }

      const { data: medicalRecord, error } = await supabase
        .from('medical_records')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- booking_id/booking_type agregadas en migracion 20260612000000, tipos sin regenerar
        .insert(insertPayload as any)
        .select('id')
        .single();

      if (error) throw error;
      if (!medicalRecord) throw new Error('No se pudo crear el registro.');

      // Notifica al caller (ej: BookingDetailDrawer) que el record fue creado
      // para que pueda cerrar el drawer, navegar, etc.
      onSaved?.(medicalRecord.id);

      // Award points for vet visit
      try {
        // Get pet owner
        const { data: pet } = await supabase
          .from('pets')
          .select('owner_id')
          .eq('id', petId)
          .maybeSingle();

        if (pet?.owner_id) {
          await supabase.rpc('award_points', {
            p_user_id: pet.owner_id,
            p_points: 30, // DEFAULT_POINTS_CONFIG.vetVisit
            p_action_type: 'vet_visit',
            p_action_id: medicalRecord.id,
            p_description: 'Visita veterinaria registrada',
          });
        }
      } catch (pointsError) {
        logger.error('Error awarding points:', pointsError);
        // Don't fail the medical record creation if points fail
      }

      toast('Registro creado', { description: 'El registro médico se ha guardado correctamente' });

      // Fire-and-forget organic rewards + social activity
      reward({ kind: 'medical_record_added', petId, petName });
      if (recordType === 'vacuna') {
        reward({ kind: 'vaccine_logged', petId, petName, vaccineName: title });
      }

      // 2026-04-21 (plan §31.2): eliminamos el insert manual de pet_reminders
      // aqui. Ahora es el trigger SQL create_vaccine_reminder() (mig
      // 20260521000040) quien inserta con la taxonomia canonica
      // (vaccine | deworming | flea) y frecuencia auto-calculada alineada
      // con src/lib/frequencies.ts. Dos fuentes → una fuente.
      //
      // Si el usuario definio next_date, el trigger la respeta; si no, se
      // auto-calcula +12m vacuna, +3m deworming interno, +1m flea externo
      // (Bravecto/Nexgard Spectra +3m).
      //
      // Si quieres volver al insert manual como fallback, consulta el
      // historial git commit que introdujo esta migracion.
      const isAntiparasitario =
        recordType === 'antiparasitario' ||
        recordType === 'desparasitacion' ||
        recordType === 'antipulgas';
      if (recordType === 'vacuna' || isAntiparasitario) {
        toast.info('Recordatorio automatico creado para la proxima aplicacion');
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
        queryClient.invalidateQueries({ queryKey: ['pet-reminders'] });
      }

      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      // Show IA recommendation before closing
      setSavedRecordType(recordType);
      setShowRecommendation(true);
      resetForm();
    } catch (error: unknown) {
      toast.error('Error al guardar', {
        description:
          describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]) ||
          'Ocurrio un error inesperado',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecordType('');
    setTitle('');
    setDescription('');
    setDate(undefined);
    setNextDate(undefined);
    setClinicName('');
    setVeterinarianName('');
    setNotes('');
    setPlaceId('');
    setBatchNumber('');
    setSerialNumber('');
    setAntiparasiticType('');
    setProductBrand('');
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
            Agrega un nuevo registro a la ficha clínica de tu mascota
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
              list={recordType === 'vacuna' ? 'vaccine-suggestions' : undefined}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Vacuna Antirrábica, Control de Rutina..."
              required
            />
            {recordType === 'vacuna' && (
              /* eslint-disable jsx-a11y/control-has-associated-label -- <option> dentro de <datalist> no requiere label individual */
              <datalist id="vaccine-suggestions">
                {getVaccinesForSpecies(petSpecies).map((v) => (
                  <option key={v.name} value={v.name} label={v.description} />
                ))}
              </datalist>
              /* eslint-enable jsx-a11y/control-has-associated-label */
            )}
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
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: es }) : 'Selecciona fecha'}
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
                      'w-full justify-start text-left font-normal',
                      !nextDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextDate ? format(nextDate, 'PPP', { locale: es }) : 'Selecciona fecha'}
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

          {/* Lote y Serie (vacunas, desparasitacion, antiparasitario) */}
          {(recordType === 'vacuna' ||
            recordType === 'desparasitacion' ||
            recordType === 'antiparasitario' ||
            recordType === 'antipulgas') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-number">N° de Lote</Label>
                <Input
                  id="batch-number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Ej: AB1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial-number">N° de Serie</Label>
                <Input
                  id="serial-number"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Ej: S-56789"
                />
              </div>
            </div>
          )}

          {/* Antiparasitario: tipo + producto/marca + sugerencia de frecuencia */}
          {recordType === 'antiparasitario' && (
            <div className="space-y-4 p-3 bg-green-50/50 border border-green-100 rounded-lg">
              <p className="text-xs font-medium text-green-700">Datos del antiparasitario</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="antiparasitic-type">Tipo *</Label>
                  <Select
                    value={antiparasiticType}
                    onValueChange={(val) => {
                      setAntiparasiticType(val);
                      // Auto-suggest next date based on type
                      if (date) {
                        if (val === 'externo') {
                          setNextDate(addMonths(date, 1));
                        } else if (val === 'interno') {
                          setNextDate(addMonths(date, 3));
                        } else if (val === 'ambos') {
                          setNextDate(addMonths(date, 3));
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="interno">Interno (comprimidos, pasta)</SelectItem>
                      <SelectItem value="externo">Externo (pipeta, collar, spray)</SelectItem>
                      <SelectItem value="ambos">Ambos (ej. Bravecto, Nexgard Spectra)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-brand">Producto / Marca</Label>
                  <Input
                    id="product-brand"
                    list="antiparasitic-brands"
                    value={productBrand}
                    onChange={(e) => setProductBrand(e.target.value)}
                    placeholder="Ej: Bravecto, Nexgard..."
                  />
                  {/* eslint-disable jsx-a11y/control-has-associated-label -- <option> dentro de <datalist> no requiere label individual */}
                  <datalist id="antiparasitic-brands">
                    <option value="Bravecto" />
                    <option value="Nexgard" />
                    <option value="Nexgard Spectra" />
                    <option value="Frontline" />
                    <option value="Frontline Plus" />
                    <option value="Simparica" />
                    <option value="Simparica Trio" />
                    <option value="Drontal" />
                    <option value="Drontal Plus" />
                    <option value="Milbemax" />
                    <option value="Advocate" />
                    <option value="Revolution" />
                    <option value="Seresto (collar)" />
                    <option value="Scalibor (collar)" />
                  </datalist>
                  {/* eslint-enable jsx-a11y/control-has-associated-label */}
                </div>
              </div>
              {antiparasiticType && (
                <p className="text-xs text-green-600">
                  {antiparasiticType === 'externo'
                    ? 'Frecuencia sugerida: cada 1 mes. Se sugirio automaticamente la proxima fecha.'
                    : antiparasiticType === 'interno'
                      ? 'Frecuencia sugerida: cada 3 meses. Se sugirio automaticamente la proxima fecha.'
                      : 'Frecuencia sugerida: cada 3 meses (Bravecto/Nexgard Spectra). Se sugirio automaticamente la proxima fecha.'}
                </p>
              )}
            </div>
          )}

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
                'Guardar Registro'
              )}
            </Button>
          </div>
        </form>

        {/* IA recommendation after saving */}
        {showRecommendation && (
          <div className="mt-4">
            <PostRecordRecommendation
              petBreed={petBreed}
              petSpecies={petSpecies}
              recordType={savedRecordType}
              onDismiss={() => {
                setShowRecommendation(false);
                setOpen(false);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => {
                setShowRecommendation(false);
                setOpen(false);
              }}
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
