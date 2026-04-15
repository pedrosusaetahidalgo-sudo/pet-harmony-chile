import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from '@/lib/icons';
import DateTimePicker from './DateTimePicker';
import { COMUNAS_SANTIAGO, getComunaCoords } from '@/lib/locations';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { useGamification } from '@/hooks/useGamification';
import { reportLostPetSchema, type ReportLostPetFormData } from '@/lib/schemas';

type FormData = ReportLostPetFormData;

interface ReportLostPetFormProps {
  onSuccess: () => void;
}

const ReportLostPetForm = ({ onSuccess }: ReportLostPetFormProps) => {
  const { user } = useAuth();
  const { awardPoints } = useGamification();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rewardOffered, setRewardOffered] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(reportLostPetSchema),
    defaultValues: {
      report_type: 'perdida',
      reward_offered: false,
    },
  });

  const reportType = watch('report_type');

  const handleComunaSelect = (comuna: string) => {
    setLocationAddress(comuna);
    setValue('last_seen_location', comuna);
    const coords = getComunaCoords(comuna);
    if (coords) {
      setValue('latitude', coords[0]);
      setValue('longitude', coords[1]);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setValue('last_seen_date', format(date, 'yyyy-MM-dd'));
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: 'Algo salió mal',
        description: 'Debes iniciar sesión para reportar una mascota',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: lostPet, error } = await supabase
        .from('lost_pets')
        .insert({
          report_type: data.report_type,
          pet_name: data.pet_name,
          species: data.species,
          breed: data.breed || null,
          description: data.description,
          last_seen_location: data.last_seen_location,
          last_seen_date: data.last_seen_date,
          contact_phone: data.contact_phone || null,
          contact_email: data.contact_email || null,
          reward_offered: data.reward_offered,
          reward_amount: data.reward_amount || null,
          photo_url: data.photo_url || null,
          reporter_id: user.id,
          status: data.report_type,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Award points for helping with lost pet (fire-and-forget via hook)
      try {
        awardPoints({
          points: 75,
          actionType: 'lost_pet',
          actionId: lostPet?.id,
          description: `Ayuda con mascota ${data.report_type === 'perdida' ? 'perdida' : 'encontrada'}`,
        });
      } catch (pointsError) {
        logger.error('Error awarding points:', pointsError);
        // Don't fail the report creation if points fail
      }

      toast({
        title: 'Reporte creado',
        description: `Tu reporte de mascota ${data.report_type === 'perdida' ? 'perdida' : 'encontrada'} ha sido publicado`,
      });

      onSuccess();
    } catch (error) {
      logger.error('Error creating report:', error);
      toast({
        title: 'Algo salió mal',
        description: 'No se pudo crear el reporte. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="report_type">Tipo de Reporte</Label>
        <Select
          onValueChange={(value) => setValue('report_type', value as 'perdida' | 'encontrada')}
          defaultValue="perdida"
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perdida">Mascota Perdida</SelectItem>
            <SelectItem value="encontrada">Mascota Encontrada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pet_name">Nombre de la Mascota</Label>
          <Input id="pet_name" {...register('pet_name')} placeholder="Nombre" />
          {errors.pet_name && <p className="text-xs text-destructive">{errors.pet_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="species">Especie</Label>
          <Select onValueChange={(value) => setValue('species', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="perro">Perro</SelectItem>
              <SelectItem value="gato">Gato</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          {errors.species && <p className="text-xs text-destructive">{errors.species.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="breed">Raza (opcional)</Label>
        <Input id="breed" {...register('breed')} placeholder="Ej: Labrador, Mestizo..." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          {...register('description')}
          placeholder="Describe características, comportamiento, etc."
          rows={4}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="last_seen_comuna">Última Ubicación Vista (Comuna)</Label>
        <Select value={locationAddress} onValueChange={handleComunaSelect}>
          <SelectTrigger id="last_seen_comuna">
            <SelectValue placeholder="Selecciona una comuna" />
          </SelectTrigger>
          <SelectContent>
            {COMUNAS_SANTIAGO.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Si quieres agregar más detalle de la dirección, ponlo en la descripción.
        </p>
        {errors.last_seen_location && (
          <p className="text-xs text-destructive">{errors.last_seen_location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Fecha</Label>
        <DateTimePicker
          date={selectedDate}
          onDateChange={handleDateChange}
          placeholder="Seleccionar fecha"
          maxDate={new Date()}
        />
        {errors.last_seen_date && (
          <p className="text-xs text-destructive">{errors.last_seen_date.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
          <Input id="contact_phone" {...register('contact_phone')} placeholder="+56 9 XXXX XXXX" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Email de Contacto</Label>
          <Input
            id="contact_email"
            {...register('contact_email')}
            type="email"
            placeholder="correo@ejemplo.com"
          />
          {errors.contact_email && (
            <p className="text-xs text-destructive">{errors.contact_email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo_url">URL de Foto (opcional)</Label>
        <Input id="photo_url" {...register('photo_url')} placeholder="https://..." />
      </div>

      {reportType === 'perdida' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reward_offered"
              checked={rewardOffered}
              onCheckedChange={(checked) => {
                setRewardOffered(checked as boolean);
                setValue('reward_offered', checked as boolean);
              }}
            />
            <Label htmlFor="reward_offered" className="cursor-pointer">
              Ofrecer recompensa
            </Label>
          </div>

          {rewardOffered && (
            <div className="space-y-2">
              <Label htmlFor="reward_amount">Monto de la Recompensa (CLP)</Label>
              <Input
                type="number"
                {...register('reward_amount', { valueAsNumber: true })}
                placeholder="Ej: 50000"
              />
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full bg-warm-gradient" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {reportType === 'perdida' ? 'Reportar Mascota Perdida' : 'Reportar Mascota Encontrada'}
      </Button>
    </form>
  );
};

export default ReportLostPetForm;
