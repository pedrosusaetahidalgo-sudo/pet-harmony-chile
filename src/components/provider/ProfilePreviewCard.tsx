/**
 * Preview en vivo del perfil profesional tal como se ve en el directorio.
 * Se actualiza en tiempo real mientras el vet edita su perfil.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, MapPin, Star } from '@/lib/icons';
import type { ProviderProfileForm } from '@/hooks/useProviderProfile';

interface Props {
  form: ProviderProfileForm;
  slug?: string | null;
}

export function ProfilePreviewCard({ form, slug }: Props) {
  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `Desde $${price.toLocaleString('es-CL')}`;
  };

  return (
    <Card className="border-dashed border-purple-200 bg-purple-50/30">
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-purple-500 font-semibold mb-3">
          Así se ve tu perfil en el directorio
        </p>
        <div className="flex items-start gap-3">
          {form.avatar_url ? (
            <img
              src={form.avatar_url}
              alt="Preview"
              className="w-14 h-14 rounded-full object-cover border-2 border-purple-100 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-6 w-6 text-purple-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{form.display_name || 'Tu nombre'}</h3>
            {form.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {form.specialties.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {s}
                  </Badge>
                ))}
                {form.specialties.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{form.specialties.length - 3}
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              {form.commune && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {form.commune}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3" />
                Sin reseñas aún
              </span>
            </div>
            {form.price_from && (
              <p className="text-xs font-medium text-purple-700 mt-1">
                {formatPrice(form.price_from)}
              </p>
            )}
            {form.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.bio}</p>
            )}
          </div>
        </div>
        {slug && (
          <p className="text-[10px] text-muted-foreground mt-2">pawfriend.cl/veterinarios/{slug}</p>
        )}
      </CardContent>
    </Card>
  );
}
