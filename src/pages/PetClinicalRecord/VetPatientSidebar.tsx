import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, UtensilsCrossed } from '@/lib/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VetVitalsCard } from './VetVitalsCard';
import { VetVaccinesCard } from './VetVaccinesCard';
import type { PetData } from './types';

interface VetPatientSidebarProps {
  pet: PetData;
}

export function VetPatientSidebar({ pet }: VetPatientSidebarProps) {
  // Fetch documents/attachments
  const { data: documents } = useQuery({
    queryKey: ['pet-documents-sidebar', pet.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('id, title, record_type, date, document_url')
        .eq('pet_id', pet.id)
        .not('document_url', 'is', null)
        .order('date', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!pet.id,
  });

  return (
    <div className="space-y-4">
      {/* Vitals */}
      <VetVitalsCard pet={pet} />

      {/* Vaccines */}
      <VetVaccinesCard petId={pet.id} species={pet.species} />

      {/* Diet & habits */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            Alimentacion y habitos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2 text-xs">
          {pet.diet_type || pet.diet_brand ? (
            <>
              {pet.diet_brand && (
                <div>
                  <span className="text-muted-foreground">Alimento: </span>
                  <span className="font-medium">{pet.diet_brand}</span>
                  {pet.diet_type && (
                    <span className="text-muted-foreground"> ({pet.diet_type})</span>
                  )}
                </div>
              )}
              {pet.diet_frequency && (
                <div>
                  <span className="text-muted-foreground">Frecuencia: </span>
                  <span className="font-medium">{pet.diet_frequency}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Sin informacion de dieta registrada</p>
          )}
          {pet.neutered !== null && (
            <div>
              <span className="text-muted-foreground">Esterilizado: </span>
              <span className="font-medium">
                {pet.neutered ? 'Si' : 'No'}
                {pet.neutered && pet.neutered_date
                  ? ` (${new Date(pet.neutered_date).getFullYear()})`
                  : ''}
              </span>
            </div>
          )}
          {pet.activity_level && (
            <div>
              <span className="text-muted-foreground">Actividad: </span>
              <span className="font-medium capitalize">{pet.activity_level}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {documents && documents.length > 0 ? (
            <div className="space-y-1.5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline py-1"
                >
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{doc.title || doc.record_type || 'Documento'}</span>
                  {doc.date && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-auto">
                      {new Date(doc.date).toLocaleDateString('es-CL', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin documentos adjuntos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
