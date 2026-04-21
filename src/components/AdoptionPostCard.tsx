import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, MapPin, Calendar, MessageCircle, Eye, Check, X, PawPrint } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStartConversation } from '@/hooks/useStartConversation';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface AdoptionPostCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: any;
  onUpdate: () => void;
  isOwner: boolean;
}

export function AdoptionPostCard({ post, onUpdate, isOwner }: AdoptionPostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startConversation } = useStartConversation();
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // Adoptant profile mini-questionnaire
  const [housingType, setHousingType] = useState('');
  const [hoursHome, setHoursHome] = useState('');
  const [priorExperience, setPriorExperience] = useState('');
  const [otherPets, setOtherPets] = useState('');
  const [hasKids, setHasKids] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [interests, setInterests] = useState<any[]>([]);

  const mainPhoto = post.photos?.[0] || null;
  const age =
    post.age_years > 0 || post.age_months > 0
      ? `${post.age_years > 0 ? `${post.age_years} año${post.age_years > 1 ? 's' : ''}` : ''} ${post.age_months > 0 ? `${post.age_months} mes${post.age_months > 1 ? 'es' : ''}` : ''}`.trim()
      : 'Edad no especificada';

  const handleShowInterest = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Build enriched message with adoptant profile
      const profileParts: string[] = [];
      if (housingType) profileParts.push(`Vivienda: ${housingType}`);
      if (hoursHome) profileParts.push(`Horas en casa: ${hoursHome}`);
      if (priorExperience) profileParts.push(`Experiencia: ${priorExperience}`);
      if (otherPets) profileParts.push(`Otras mascotas: ${otherPets}`);
      if (hasKids) profileParts.push(`Niños en el hogar: ${hasKids}`);
      const profileSummary = profileParts.length > 0 ? `\n---\n${profileParts.join(' · ')}` : '';
      const fullMessage = (interestMessage + profileSummary).trim();

      const { error } = await supabase.from('adoption_interests').insert({
        adoption_post_id: post.id,
        interested_user_id: user.id,
        message: fullMessage || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya has mostrado interés en esta mascota');
        } else {
          throw error;
        }
      } else {
        toast.success('Interés registrado exitosamente');
        setShowInterestDialog(false);
        setInterestMessage('');
        onUpdate();
      }
    } catch (error) {
      logger.error('Error showing interest:', error);
      toast.error('Error al registrar interés');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadInterests = async () => {
    try {
      // Bug fix 2026-04-21: adoption_interests.interested_user_id tiene FK
      // a auth.users (no profiles). El join implicito fallaba silencioso.
      // Hacemos batch fetch de profiles aparte y merge manual.
      const { data, error } = await supabase
        .from('adoption_interests')
        .select('*')
        .eq('adoption_post_id', post.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      if (rows.length > 0) {
        const userIds = Array.from(new Set(rows.map((r) => r.interested_user_id).filter(Boolean)));
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        const profileMap = new Map(
          (profilesData || []).map((p) => [
            p.id,
            { display_name: p.display_name, avatar_url: p.avatar_url },
          ])
        );
        // Attach profiles en formato compatible con el render existente.
        setInterests(
          rows.map((r) => ({
            ...r,
            profiles: profileMap.get(r.interested_user_id) ?? null,
          }))
        );
      } else {
        setInterests([]);
      }
    } catch (error) {
      logger.error('Error loading interests:', error);
      toast.error('Error al cargar intereses');
    }
  };

  const handleUpdateStatus = async (newStatus: 'adoptado' | 'disponible') => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('adoption_posts')
        .update({ status: newStatus })
        .eq('id', post.id);
      if (error) throw error;
      toast.success(
        newStatus === 'adoptado' ? '¡Felicidades! Marcado como adoptado' : 'Publicación reactivada'
      );
      onUpdate();
    } catch {
      toast.error('No se pudo actualizar el estado');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewMessages = () => {
    loadInterests();
    setShowMessagesDialog(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 rounded-2xl">
        <div className="relative h-44 sm:h-48 overflow-hidden bg-muted">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={post.pet_name}
              loading="lazy"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PawPrint className="h-14 w-14 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge
              className={`${
                post.status === 'disponible'
                  ? 'bg-secondary text-white shadow-md'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {post.status === 'disponible' ? 'Disponible' : 'Adoptado'}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold truncate">{post.pet_name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {post.breed || post.species} • {age}
              </p>
            </div>
            <Badge variant="outline" className="capitalize text-xs flex-shrink-0">
              {post.gender || 'N/A'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 py-2 sm:py-3">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
            {post.description}
          </p>

          {post.temperament && post.temperament.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.temperament.slice(0, 3).map((trait: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                  {trait}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-muted-foreground">
            {post.good_with_kids && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-secondary" /> Niños
              </span>
            )}
            {post.good_with_dogs && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-secondary" /> Perros
              </span>
            )}
            {post.good_with_cats && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-secondary" /> Gatos
              </span>
            )}
          </div>

          {/* Show only general location (city/commune) for privacy, not exact address */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {(() => {
                // Extract only city/commune, not full address
                const location = post.location || '';
                const parts = location.split(',');
                return parts.length > 1 ? parts.slice(-2).join(', ').trim() : location;
              })()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{format(new Date(post.created_at), "d 'de' MMMM", { locale: es })}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 bg-muted/30 pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="w-full flex items-center justify-around sm:justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">{post.views_count || 0}</span>
              <span className="hidden sm:inline">vistas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              <span className="font-medium">{post.interests_count || 0}</span>
              <span className="hidden sm:inline">interesados</span>
            </span>
          </div>

          {isOwner ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 h-10 sm:h-11 border-2 hover:bg-muted"
                onClick={handleViewMessages}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Interesados
              </Button>
              {post.status === 'disponible' ? (
                <Button
                  variant="default"
                  className="flex-1 h-10 sm:h-11 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleUpdateStatus('adoptado')}
                  disabled={isUpdatingStatus}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Adoptado
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 h-10 sm:h-11"
                  onClick={() => handleUpdateStatus('disponible')}
                  disabled={isUpdatingStatus}
                >
                  Reactivar
                </Button>
              )}
            </div>
          ) : (
            <Button
              className="w-full h-10 sm:h-11 bg-warm-gradient hover:opacity-90 text-white shadow-soft"
              onClick={() => setShowInterestDialog(true)}
              disabled={post.status !== 'disponible'}
            >
              <Heart className="h-4 w-4 mr-2" />
              Me Interesa
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Interest Dialog — Enhanced with adoptant profile */}
      <Dialog open={showInterestDialog} onOpenChange={setShowInterestDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mostrar Interés en {post.pet_name}</DialogTitle>
            <DialogDescription>
              Completa tu perfil de adoptante para que el dueño conozca mejor tu situación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Adoptant profile mini-questionnaire */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de vivienda</Label>
                <Select value={housingType} onValueChange={setHousingType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casa con patio">Casa con patio</SelectItem>
                    <SelectItem value="Casa sin patio">Casa sin patio</SelectItem>
                    <SelectItem value="Departamento grande">Depto grande</SelectItem>
                    <SelectItem value="Departamento chico">Depto chico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Horas en casa al día</Label>
                <Select value={hoursHome} onValueChange={setHoursHome}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo el día (home office)">Todo el día</SelectItem>
                    <SelectItem value="Medio día">Medio día</SelectItem>
                    <SelectItem value="Solo mañanas/tardes">Mañanas/tardes</SelectItem>
                    <SelectItem value="Pocas horas">Pocas horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Experiencia con mascotas</Label>
                <Select value={priorExperience} onValueChange={setPriorExperience}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primera mascota">Primera mascota</SelectItem>
                    <SelectItem value="He tenido antes">He tenido antes</SelectItem>
                    <SelectItem value="Tengo actualmente">Tengo actualmente</SelectItem>
                    <SelectItem value="Experiencia profesional">Profesional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Otras mascotas en casa</Label>
                <Select value={otherPets} onValueChange={setOtherPets}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ninguna">Ninguna</SelectItem>
                    <SelectItem value="1 perro">1 perro</SelectItem>
                    <SelectItem value="1 gato">1 gato</SelectItem>
                    <SelectItem value="Varios">Varios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">¿Hay niños en el hogar?</Label>
              <div className="flex gap-2">
                {['No', 'Sí, menores de 5', 'Sí, mayores de 5'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHasKids(hasKids === opt ? '' : opt)}
                    className={`flex-1 py-1.5 px-2 rounded-full text-xs font-medium border transition-colors ${
                      hasKids === opt
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={interestMessage}
              onChange={(e) => setInterestMessage(e.target.value)}
              placeholder="Cuéntale al dueño por qué eres el adoptante ideal..."
              rows={3}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInterestDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleShowInterest}
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Enviar solicitud
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages Dialog */}
      <Dialog open={showMessagesDialog} onOpenChange={setShowMessagesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personas Interesadas en {post.pet_name}</DialogTitle>
            <DialogDescription>Revisa los mensajes de las personas interesadas</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {interests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aún no hay personas interesadas</p>
              </div>
            ) : (
              interests.map((interest) => (
                <Card key={interest.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-warm-gradient text-white">
                        {/* Show only first letter for privacy */}
                        {interest.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        {/* Hide full name for privacy - show only first name initial and last name initial */}
                        <span className="font-semibold">
                          {(() => {
                            const name = interest.profiles?.display_name || 'Usuario';
                            const nameParts = name.trim().split(/\s+/);
                            if (nameParts.length >= 2) {
                              return `${nameParts[0][0]}. ${nameParts[nameParts.length - 1][0]}.`;
                            }
                            return `${name[0]}.`;
                          })()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interest.created_at), 'd MMM', { locale: es })}
                        </span>
                      </div>
                      {interest.message && (
                        <p className="text-sm text-muted-foreground">{interest.message}</p>
                      )}
                      {/* Secure contact button - opens messaging instead of showing direct contact */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          // Navigate to chat with this user securely
                          await startConversation(interest.interested_user_id);
                          setShowMessagesDialog(false);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-2" />
                        Contactar de forma segura
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
