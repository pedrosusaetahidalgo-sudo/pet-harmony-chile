import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  Star, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  PawPrint,
  User,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  photo_url: string | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ProviderData {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  rating: number;
  total_reviews: number;
  price: number;
  address?: string;
  services?: Record<string, boolean>;
}

interface EnhancedBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ProviderData | null;
  providerType: "dog_walker" | "dogsitter" | "veterinarian" | "trainer";
  onBookingComplete: () => void;
}

const steps = [
  { id: 1, title: "Fecha y Hora", icon: CalendarCheck },
  { id: 2, title: "Mascota", icon: PawPrint },
  { id: 3, title: "Detalles", icon: MapPin },
  { id: 4, title: "Confirmación", icon: Check }
];

export const EnhancedBookingDialog = ({
  open,
  onOpenChange,
  provider,
  providerType,
  onBookingComplete
}: EnhancedBookingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [serviceType, setServiceType] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [instructions, setInstructions] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    if (open && user) {
      loadPets();
      if (provider) {
        loadProviderAvailability();
      }
    }
  }, [open, user, provider]);

  useEffect(() => {
    if (selectedDate && availability.length > 0) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayAvail = availability.find(a => a.date === dateStr);
      setAvailableSlots(dayAvail?.time_slots || []);
      setSelectedTime("");
    }
  }, [selectedDate, availability]);

  const loadPets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pets')
      .select('id, name, species, breed, photo_url')
      .eq('owner_id', user.id);
    setPets(data || []);
  };

  const loadProviderAvailability = async () => {
    if (!provider) return;
    const { data } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('user_id', provider.user_id)
      .eq('provider_type', providerType)
      .eq('is_available', true)
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .order('date', { ascending: true });
    setAvailability(data || []);
  };

  const hasAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availability.some(a => a.date === dateStr);
  };

  const calculateTotal = () => {
    if (!provider) return 0;
    const basePrice = provider.price;
    const petMultiplier = selectedPets.length > 1 ? 1 + (selectedPets.length - 1) * 0.5 : 1;
    const durationMultiplier = duration / 60;
    return Math.round(basePrice * petMultiplier * durationMultiplier);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedDate && selectedTime && availableSlots.includes(selectedTime);
      case 2:
        return selectedPets.length > 0;
      case 3:
        // For dogsitters, address is not required (they drop off at provider's location)
        // For others, address is required (pickup/visit at user's location)
        return serviceType && (providerType === "dogsitter" || address.trim().length > 0);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user || !provider || !selectedDate) return;
    
    setLoading(true);
    try {
      const bookingDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes));

      // Create booking directly
      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        provider_id: provider.user_id,
        service_type: providerType,
        status: 'confirmed',
        payment_status: 'pending',
        total_price: calculateTotal(),
        pet_id: selectedPets[0] || null,
        notes: instructions || null,
      });

      if (error) throw error;

      toast({
        title: "Reserva confirmada",
        description: "Tu reserva ha sido creada exitosamente.",
      });

      onBookingComplete();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la reserva. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedPets([]);
    setServiceType("");
    setDuration(60);
    setAddress("");
    setCoordinates(null);
    setInstructions("");
  };

  // Determine pickup/dropoff logic based on service type
  const getServiceLocationLogic = () => {
    switch (providerType) {
      case "dog_walker":
        return {
          label: "Dirección de recogida",
          description: "El paseador recogerá a tu mascota en esta dirección",
          placeholder: "Ingresa la dirección donde recogerán a tu mascota",
          isPickup: true
        };
      case "dogsitter":
        return {
          label: "Dirección de entrega",
          description: "Llevarás a tu mascota a la dirección del cuidador",
          placeholder: "La dirección del cuidador se mostrará después de confirmar",
          isPickup: false
        };
      case "veterinarian":
        return {
          label: "Dirección de visita",
          description: "El veterinario visitará a tu mascota en esta dirección",
          placeholder: "Ingresa la dirección donde se realizará la visita",
          isPickup: true
        };
      case "trainer":
        return {
          label: "Dirección de entrenamiento",
          description: "El entrenador visitará a tu mascota en esta dirección",
          placeholder: "Ingresa la dirección donde se realizará el entrenamiento",
          isPickup: true
        };
      default:
        return {
          label: "Dirección",
          description: "",
          placeholder: "Ingresa la dirección",
          isPickup: true
        };
    }
  };

  const locationLogic = getServiceLocationLogic();

  const getServiceOptions = () => {
    switch (providerType) {
      case 'dog_walker':
        return [
          { value: 'paseo', label: 'Paseo Regular' },
          { value: 'ejercicio', label: 'Ejercicio Intensivo' },
          { value: 'socializacion', label: 'Socialización' }
        ];
      case 'dogsitter':
        return [
          { value: 'hospedaje', label: 'Hospedaje' },
          { value: 'daycare', label: 'Guardería Diurna' },
          { value: 'visita', label: 'Visita a Domicilio' }
        ];
      case 'veterinarian':
        return [
          { value: 'consulta', label: 'Consulta General' },
          { value: 'vacunacion', label: 'Vacunación' },
          { value: 'desparasitacion', label: 'Desparasitación' },
          { value: 'emergencia', label: 'Emergencia' }
        ];
      case 'trainer':
        return [
          { value: 'obediencia', label: 'Obediencia Básica' },
          { value: 'avanzado', label: 'Entrenamiento Avanzado' },
          { value: 'comportamiento', label: 'Modificación de Conducta' },
          { value: 'cachorro', label: 'Entrenamiento Cachorro' }
        ];
      default:
        return [];
    }
  };

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with Provider Info */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={provider.avatar_url || ""} />
              <AvatarFallback className="bg-primary/20">
                <User className="h-8 w-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">{provider.display_name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{provider.rating?.toFixed(1) || '5.0'}</span>
                <span className="text-muted-foreground">({provider.total_reviews} reseñas)</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">${provider.price?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">por servicio</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep > step.id ? 'bg-primary text-primary-foreground' : 
                    currentStep === step.id ? 'bg-primary/20 text-primary border-2 border-primary' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[300px]">
          {/* Step 1: Date & Time */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Selecciona fecha y hora</h3>
              
              {availability.length === 0 ? (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Este profesional aún no ha configurado su disponibilidad
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                    disabled={(date) => date < new Date() || !hasAvailability(date)}
                    modifiers={{ available: (date) => hasAvailability(date) }}
                    modifiersStyles={{
                      available: { backgroundColor: 'hsl(var(--primary) / 0.15)', fontWeight: 'bold' }
                    }}
                    className="rounded-md border mx-auto pointer-events-auto"
                  />

                  {selectedDate && availableSlots.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Horarios disponibles para {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot}
                            variant={selectedTime === slot ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Pet Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Selecciona tu(s) mascota(s)</h3>
              
              {pets.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="p-6 text-center">
                    <PawPrint className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-3">No tienes mascotas registradas</p>
                    <Button variant="outline" onClick={() => navigate('/add-pet')}>
                      Agregar Mascota
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {pets.map((pet) => (
                    <Card 
                      key={pet.id}
                      className={`cursor-pointer transition-all ${
                        selectedPets.includes(pet.id) ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        if (providerType === 'veterinarian' || providerType === 'trainer') {
                          setSelectedPets([pet.id]);
                        } else {
                          setSelectedPets(prev => 
                            prev.includes(pet.id) 
                              ? prev.filter(id => id !== pet.id)
                              : [...prev, pet.id]
                          );
                        }
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={pet.photo_url || ""} />
                          <AvatarFallback className="bg-primary/10">
                            <PawPrint className="h-6 w-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{pet.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pet.species} • {pet.breed || 'Sin raza'}
                          </p>
                        </div>
                        <Checkbox 
                          checked={selectedPets.includes(pet.id)}
                          className="h-5 w-5"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Detalles del servicio</h3>

              <div className="space-y-2">
                <Label>Tipo de Servicio</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {getServiceOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(providerType === 'dog_walker' || providerType === 'trainer') && (
                <div className="space-y-2">
                  <Label>Duración</Label>
                  <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>{locationLogic.label}</Label>
                  {locationLogic.description && (
                    <span className="text-xs text-muted-foreground">({locationLogic.description})</span>
                  )}
                </div>
                {providerType === "dogsitter" ? (
                  // For sitters, show provider's address (they drop off at sitter's location)
                  <Card className="bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm mb-1">Dirección del cuidador</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.address || "La dirección se confirmará después de la reserva"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Llevarás a tu mascota a esta dirección
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  // For walkers, vets, trainers: user provides their address (pickup/visit at user's location)
                  <PlacesAutocomplete
                    value={address}
                    onChange={setAddress}
                    onPlaceSelect={(place) => {
                      setAddress(place.address);
                      setCoordinates({
                        lat: place.lat,
                        lng: place.lng
                      });
                    }}
                    placeholder={locationLogic.placeholder}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Instrucciones especiales (opcional)</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Información adicional sobre tu mascota, indicaciones de acceso, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Confirma tu reserva</h3>

              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      <span>Fecha y hora</span>
                    </div>
                    <span className="font-medium">
                      {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })} - {selectedTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-primary" />
                      <span>Mascota(s)</span>
                    </div>
                    <span className="font-medium">
                      {pets.filter(p => selectedPets.includes(p.id)).map(p => p.name).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{locationLogic.label}</span>
                    </div>
                    <span className="font-medium text-right max-w-[200px] truncate">
                      {providerType === "dogsitter" 
                        ? (provider.address || "Dirección del cuidador")
                        : address}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 pt-4 border-t-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold">Total</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      ${calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground text-center">
                El servicio se agregará a tu carrito para finalizar el pago.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t bg-muted/30 flex justify-between">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onOpenChange(false)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep > 1 ? 'Anterior' : 'Cancelar'}
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {loading ? "Reservando..." : "Confirmar Reserva"}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedBookingDialog;
