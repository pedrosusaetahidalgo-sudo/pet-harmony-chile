/**
 * Preview en vivo del perfil profesional tal como se ve en el directorio.
 * Se actualiza en tiempo real mientras el vet edita su perfil.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, MapPin, Star, Phone, Mail, Clock, ExternalLink } from '@/lib/icons';
import type { ProviderProfileForm } from '@/hooks/useProviderProfile';

interface Props {
  form: ProviderProfileForm;
  slug?: string | null;
}

export function ProfilePreviewCard({ form, slug }: Props) {
  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `$${price.toLocaleString('es-CL')}`;
  };

  const providerTypeLabel: Record<string, string> = {
    individual: 'Consulta individual',
    home_visit: 'Atención a domicilio',
    clinic: 'Clínica veterinaria',
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/80 to-white overflow-hidden">
      <CardContent className="p-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-purple-100 font-semibold">
            Así se ve tu perfil en el directorio
          </p>
        </div>

        <div className="p-4 space-y-3">
          {/* Avatar + Nombre + Rating */}
          <div className="flex items-start gap-3">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Stethoscope className="h-7 w-7 text-purple-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{form.display_name || 'Tu nombre'}</h3>
              <p className="text-[11px] text-muted-foreground">
                {providerTypeLabel[form.provider_type] || 'Veterinario'}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <Star className="h-3.5 w-3.5 text-gray-200" />
                <span className="text-[10px] text-muted-foreground ml-1">Sin reseñas aún</span>
              </div>
            </div>
          </div>

          {/* Especialidades */}
          {form.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {form.specialties.slice(0, 4).map((s) => (
                <Badge
                  key={s}
                  className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100"
                >
                  {s}
                </Badge>
              ))}
              {form.specialties.length > 4 && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  +{form.specialties.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Info compacta */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            {form.commune && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-purple-400" />
                {form.commune}
              </span>
            )}
            {form.experience_years && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-400" />
                {form.experience_years} años exp.
              </span>
            )}
            {form.public_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-purple-400" />
                {form.public_phone}
              </span>
            )}
            {form.public_email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 text-purple-400" />
                {form.public_email}
              </span>
            )}
          </div>

          {/* Precio */}
          {form.price_from && (
            <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
              <span className="text-[11px] text-muted-foreground">Consulta desde</span>
              <span className="text-sm font-bold text-purple-700">
                {formatPrice(form.price_from)}
              </span>
            </div>
          )}

          {/* Bio */}
          {form.bio && (
            <p className="text-xs text-muted-foreground line-clamp-3 italic">"{form.bio}"</p>
          )}

          {/* Zonas */}
          {form.service_areas.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground">
                {form.service_areas.slice(0, 3).join(', ')}
                {form.service_areas.length > 3 && ` +${form.service_areas.length - 3} más`}
              </span>
            </div>
          )}

          {/* URL */}
          {slug && (
            <div className="flex items-center gap-1 text-[10px] text-purple-500 font-mono">
              <ExternalLink className="h-3 w-3" />
              pawfriend.cl/veterinarios/{slug}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
