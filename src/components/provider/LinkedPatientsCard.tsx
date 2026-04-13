import { Link } from 'react-router-dom';
import { LINKS } from '@/lib/links';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Stethoscope, FileText, PawPrint } from '@/lib/icons';
import { useLinkedPatients } from '@/hooks/usePetVetLinks';

export function LinkedPatientsCard() {
  const { data: patients, isLoading } = useLinkedPatients();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-purple-600" />
            Mis pacientes vinculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patients || patients.length === 0) return null;

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Mis pacientes vinculados
          </CardTitle>
          <Badge variant="outline" className="bg-white border-green-200 text-green-700">
            {patients.length} activo{patients.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {patients.map((link) => {
          const pet = link.pets;
          const owner = link.profiles;
          const since = link.responded_at
            ? formatDistanceToNowStrict(new Date(link.responded_at), {
                locale: es,
                addSuffix: true,
              })
            : null;

          return (
            <div
              key={link.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100 hover:bg-green-50/30 transition"
            >
              <Avatar className="h-11 w-11">
                {pet?.photo_url ? (
                  <AvatarImage src={pet.photo_url} alt={pet?.name || 'Mascota'} />
                ) : null}
                <AvatarFallback className="bg-green-100 text-green-700">
                  {(pet?.name || 'M')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {pet?.name || 'Mascota'}
                  {pet?.species && (
                    <span className="text-muted-foreground font-normal capitalize">
                      {' '}
                      · {pet.species}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {owner?.display_name || 'Dueño'}
                  {since && ` · vinculado ${since}`}
                </p>
              </div>
              <Link to={LINKS.petClinical(pet?.id || link.pet_id)}>
                <Button size="sm" variant="outline" className="h-9 gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ficha</span>
                </Button>
              </Link>
            </div>
          );
        })}

        {patients.length === 0 && (
          <div className="text-center py-6">
            <PawPrint className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Los pacientes aparecen cuando aceptes solicitudes de vinculacion.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
