import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Navigation, ExternalLink } from '@/lib/icons';
import { PARTNER_CATEGORY_LABELS, PARTNER_CATEGORY_ICONS, type Partner } from '@/hooks/usePartners';
import { calculateDistance } from '@/lib/distance';

interface PartnerDetailCardProps {
  partner: Partner;
  userLocation?: { lat: number; lng: number };
}

const categoryColors: Record<string, string> = {
  store: 'bg-emerald-500',
  insurance: 'bg-blue-600',
  clinic: 'bg-green-500',
  food: 'bg-amber-500',
  general: 'bg-slate-500',
  adoption: 'bg-orange-500',
};

const categoryGradients: Record<string, string> = {
  store: 'from-emerald-500 to-teal-600',
  insurance: 'from-blue-500 to-indigo-600',
  clinic: 'from-green-500 to-emerald-600',
  food: 'from-amber-500 to-orange-600',
  general: 'from-slate-500 to-slate-600',
  adoption: 'from-orange-500 to-red-600',
};

const PartnerDetailCard = ({ partner, userLocation }: PartnerDetailCardProps) => {
  let displayDistance: number | undefined;
  if (userLocation && partner.latitude && partner.longitude) {
    displayDistance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      partner.latitude,
      partner.longitude
    );
  }

  const gradient = categoryGradients[partner.category] || categoryGradients.general;
  const badgeColor = categoryColors[partner.category] || categoryColors.general;
  const icon = PARTNER_CATEGORY_ICONS[partner.category] || '📍';
  const label = PARTNER_CATEGORY_LABELS[partner.category] || 'Servicio';

  const handleOpenWebsite = () => {
    const url = partner.website || partner.ad_link;
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCall = () => {
    if (partner.contact_phone) {
      window.open(`tel:${partner.contact_phone.replace(/\s/g, '')}`, '_self');
    }
  };

  const handleEmail = () => {
    if (partner.contact_email) {
      window.open(`mailto:${partner.contact_email}`, '_self');
    }
  };

  const socialMedia = partner.social_media as Record<string, string> | null;

  return (
    <Card className="w-[320px] overflow-hidden shadow-lg">
      <div className={`relative h-24 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">{icon}</span>
        </div>
        <Badge className={`absolute top-2 left-2 ${badgeColor} text-white`}>
          {icon} {label}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-2">
        <div>
          <h3 className="font-bold text-lg leading-tight">{partner.brand_name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{partner.ad_text}</p>
        </div>

        <div className="space-y-1 text-xs">
          {partner.address && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {partner.address}
                {partner.commune ? `, ${partner.commune}` : ''}
              </span>
            </div>
          )}
          {partner.contact_phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{partner.contact_phone}</span>
            </div>
          )}
          {partner.contact_email && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{partner.contact_email}</span>
            </div>
          )}
          {displayDistance !== undefined && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Navigation className="h-3 w-3 flex-shrink-0" />
              <span>{displayDistance.toFixed(1)} km de distancia</span>
            </div>
          )}
        </div>

        {socialMedia && Object.keys(socialMedia).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {socialMedia.instagram && (
              <Badge variant="outline" className="text-[10px]">
                IG {socialMedia.instagram}
              </Badge>
            )}
            {socialMedia.facebook && (
              <Badge variant="outline" className="text-[10px]">
                FB
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {(partner.website || partner.ad_link !== '#') && (
            <Button
              size="sm"
              className={`flex-1 h-9 text-xs ${badgeColor} hover:opacity-90 text-white`}
              onClick={handleOpenWebsite}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver sitio
            </Button>
          )}
          {partner.contact_phone && (
            <Button size="sm" variant="outline" className="h-9 px-3" onClick={handleCall}>
              <Phone className="h-3 w-3" />
            </Button>
          )}
          {partner.contact_email && (
            <Button size="sm" variant="outline" className="h-9 px-3" onClick={handleEmail}>
              <Mail className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerDetailCard;
