import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Check, PawPrint, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { SlotConflictDialog } from './SlotConflictDialog';
import { BookingConflictError, useCreateBooking } from '@/hooks/useBookingMutations';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findAlternativeSlots, type ComputedSlot } from '@/lib/availabilitySlots';
import type { BookingType } from '@/lib/bookingStateMachine';

interface BookingFlowProps {
  providerId: string;
  providerName: string;
  serviceType?: string;
  bookingType?: BookingType;
  isEmergency?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
}

type Step = 'pet' | 'slot' | 'confirm';

export function BookingFlow({
  providerId,
  providerName,
  serviceType = 'consulta_general',
  bookingType = 'vet',
  isEmergency = false,
  onSuccess,
  onClose,
}: BookingFlowProps) {
  const { user } = useAuth();
  const createBooking = useCreateBooking();

  const [step, setStep] = useState<Step>('pet');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<ComputedSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [conflictAlternatives, setConflictAlternatives] = useState<ComputedSlot[] | null>(null);

  // Lee slots disponibles del provider para poder sugerir alternativas en
  // caso de colision. Se invalida automaticamente cuando cambia el slot.
  const { data: slotsByDate } = useAvailableSlots({
    providerId,
    serviceType,
    fromDate: selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date(),
    days: 14,
  });

  // Fetch user's pets
  const { data: pets = [] } = useQuery({
    queryKey: ['my-pets-booking', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, photo_url')
        .eq('owner_id', user.id)
        .is('deceased_at', null)
        .order('name');
      return (data ?? []) as Pet[];
    },
    enabled: !!user,
    staleTime: 300_000,
  });

  const handleSlotSelect = (date: string, slot: ComputedSlot) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
  };

  const handleConfirm = async () => {
    if (!selectedPet || !selectedDate || !selectedSlot) return;

    try {
      await createBooking.mutateAsync({
        providerId,
        serviceType,
        bookingType,
        petId: selectedPet.id,
        scheduledDate: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        notes: notes || undefined,
        isEmergency,
        confirmationMode: 'auto',
      });

      onSuccess?.();
    } catch (err) {
      if (err instanceof BookingConflictError) {
        const alternatives =
          slotsByDate && selectedDate
            ? findAlternativeSlots(selectedDate, selectedSlot.start, slotsByDate, 3)
            : [];
        setConflictAlternatives(alternatives);
      }
      // Otros errores los maneja el mutation via toast.
    }
  };

  const handlePickAlternative = (slot: ComputedSlot) => {
    setSelectedDate(slot.date);
    setSelectedSlot(slot);
    setConflictAlternatives(null);
    setStep('confirm');
  };

  const goBack = () => {
    if (step === 'slot') setStep('pet');
    else if (step === 'confirm') setStep('slot');
    else onClose?.();
  };

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {step === 'pet' && 'Elige tu mascota'}
            {step === 'slot' && 'Elige fecha y hora'}
            {step === 'confirm' && 'Confirma tu reserva'}
          </p>
          <p className="text-xs text-muted-foreground">Reserva con {providerName}</p>
        </div>
        {/* Step indicator */}
        <div className="flex gap-1.5">
          {(['pet', 'slot', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                s === step
                  ? 'bg-purple-600'
                  : i < ['pet', 'slot', 'confirm'].indexOf(step)
                    ? 'bg-purple-300'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Pet selection */}
      {step === 'pet' && (
        <div className="space-y-3">
          {pets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tienes mascotas registradas. Agrega una primero.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => {
                    setSelectedPet(pet);
                    setStep('slot');
                  }}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border text-left transition-colors
                    ${selectedPet?.id === pet.id ? 'border-purple-500 bg-purple-50' : 'hover:border-purple-200 hover:bg-purple-50/30'}
                  `}
                >
                  {pet.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <PawPrint className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{pet.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{pet.species}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Date & slot selection */}
      {step === 'slot' && (
        <div className="space-y-4">
          <AvailabilityCalendar
            providerId={providerId}
            serviceType={serviceType}
            onSlotSelect={handleSlotSelect}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot?.start}
          />

          {selectedSlot && selectedDate && (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => setStep('confirm')}
            >
              Continuar
            </Button>
          )}
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && selectedPet && selectedDate && selectedSlot && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                {selectedPet.photo_url ? (
                  <img
                    src={selectedPet.photo_url}
                    alt={selectedPet.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <PawPrint className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{selectedPet.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selectedPet.species}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">
                  {format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
                </span>
                <span className="text-muted-foreground">a las</span>
                <span className="font-medium">{selectedSlot.start}</span>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Profesional:</span>{' '}
                <span className="font-medium">{providerName}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="booking-notes" className="text-sm">
              Motivo o notas (opcional)
            </Label>
            <Textarea
              id="booking-notes"
              placeholder="Ej: control anual, vacuna, revision de oido..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleConfirm}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Confirmar reserva
          </Button>
        </div>
      )}

      <SlotConflictDialog
        open={conflictAlternatives !== null}
        onOpenChange={(open) => {
          if (!open) setConflictAlternatives(null);
        }}
        alternatives={conflictAlternatives ?? []}
        onPickAlternative={handlePickAlternative}
        onCancel={() => setStep('slot')}
      />
    </div>
  );
}
