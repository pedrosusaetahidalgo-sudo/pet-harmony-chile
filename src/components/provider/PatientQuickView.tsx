import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LINKS } from '@/lib/links';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertTriangle, Clock, Pill } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  petId: string | null;
  open: boolean;
  onClose: () => void;
}

export function PatientQuickView({ petId, open, onClose }: Props) {
  const { data: pet, isLoading: loadingPet } = useQuery({
    queryKey: ['quick-view-pet', petId],
    enabled: !!petId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pets')
        .select(
          'name, species, breed, photo_url, birth_date, weight, allergies_food, allergies_medication, current_medications, neutered'
        )
        .eq('id', petId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: recentRecords = [] } = useQuery({
    queryKey: ['quick-view-records', petId],
    enabled: !!petId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, title, record_type, date')
        .eq('pet_id', petId!)
        .order('date', { ascending: false })
        .limit(5);
      if (error) return [];
      return data || [];
    },
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Resumen del paciente</SheetTitle>
        </SheetHeader>

        {loadingPet ? (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : pet ? (
          <div className="space-y-5 mt-4">
            {/* Cabecera mascota */}
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                {pet.photo_url && <AvatarImage src={pet.photo_url} alt={pet.name} />}
                <AvatarFallback className="bg-purple-100 text-purple-700 text-lg">
                  {pet.name?.charAt(0)?.toUpperCase() || 'M'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{pet.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </p>
                {pet.weight && <p className="text-xs text-muted-foreground">{pet.weight} kg</p>}
              </div>
            </div>

            {/* Alergias */}
            {(pet.allergies_food as string[] | null)?.length ||
            (pet.allergies_medication as string[] | null)?.length ? (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Alergias
                </p>
                <div className="flex flex-wrap gap-1">
                  {((pet.allergies_food as string[]) || []).map((a: string) => (
                    <Badge
                      key={a}
                      variant="outline"
                      className="text-xs bg-amber-100 text-amber-700 border-amber-200"
                    >
                      {a}
                    </Badge>
                  ))}
                  {((pet.allergies_medication as string[]) || []).map((a: string) => (
                    <Badge
                      key={a}
                      variant="outline"
                      className="text-xs bg-red-100 text-red-700 border-red-200"
                    >
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Medicamentos actuales */}
            {(pet.current_medications as string[] | null)?.length ? (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 flex items-center gap-1 mb-1">
                  <Pill className="h-3.5 w-3.5" /> Medicamentos actuales
                </p>
                <div className="flex flex-wrap gap-1">
                  {(pet.current_medications as string[]).map((m: string) => (
                    <Badge key={m} variant="outline" className="text-xs">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Ultimos registros */}
            <div>
              <p className="text-sm font-semibold mb-2">Ultimos registros</p>
              {recentRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin registros medicos aun.</p>
              ) : (
                <div className="space-y-2">
                  {recentRecords.map((rec) => (
                    <div key={rec.id} className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{rec.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {rec.record_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(rec.date), 'd MMM', { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boton ver ficha completa */}
            {petId && (
              <Link to={LINKS.petClinical(petId)} onClick={onClose}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver ficha completa
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">
            No se encontro informacion del paciente.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
