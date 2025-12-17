import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, Calendar, MessageCircle, Eye, Check, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AdoptionPostCardProps {
  post: any;
  onUpdate: () => void;
  isOwner: boolean;
}

export function AdoptionPostCard({ post, onUpdate, isOwner }: AdoptionPostCardProps) {
  const { user } = useAuth();
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interests, setInterests] = useState<any[]>([]);

  const mainPhoto = post.photos?.[0] || "/placeholder.svg";
  const age = post.age_years > 0 || post.age_months > 0
    ? `${post.age_years > 0 ? `${post.age_years} año${post.age_years > 1 ? 's' : ''}` : ''} ${post.age_months > 0 ? `${post.age_months} mes${post.age_months > 1 ? 'es' : ''}` : ''}`.trim()
    : "Edad no especificada";

  const handleShowInterest = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("adoption_interests").insert({
        adoption_post_id: post.id,
        interested_user_id: user.id,
        message: interestMessage,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya has mostrado interés en esta mascota");
        } else {
          throw error;
        }
      } else {
        toast.success("Interés registrado exitosamente");
        setShowInterestDialog(false);
        setInterestMessage("");
        onUpdate();
      }
    } catch (error) {
      console.error("Error showing interest:", error);
      toast.error("Error al registrar interés");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadInterests = async () => {
    try {
      const { data, error } = await supabase
        .from("adoption_interests")
        .select(`
          *,
          profiles:interested_user_id (
            display_name,
            avatar_url
          )
        `)
        .eq("adoption_post_id", post.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterests(data || []);
    } catch (error) {
      console.error("Error loading interests:", error);
      toast.error("Error al cargar intereses");
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
          <img 
            src={mainPhoto} 
            alt={post.pet_name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2">
            <Badge className={`${
              post.status === "disponible" 
                ? "bg-secondary text-white shadow-md" 
                : "bg-muted text-muted-foreground"
            }`}>
              {post.status === "disponible" ? "Disponible" : "Adoptado"}
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
              {post.gender || "N/A"}
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
            {post.good_with_kids && <span className="flex items-center gap-1"><Check className="h-3 w-3 text-secondary" /> Niños</span>}
            {post.good_with_dogs && <span className="flex items-center gap-1"><Check className="h-3 w-3 text-secondary" /> Perros</span>}
            {post.good_with_cats && <span className="flex items-center gap-1"><Check className="h-3 w-3 text-secondary" /> Gatos</span>}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{post.location}</span>
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
            <Button 
              variant="outline" 
              className="w-full h-10 sm:h-11 border-2 hover:bg-muted"
              onClick={handleViewMessages}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ver Interesados
            </Button>
          ) : (
            <Button 
              className="w-full h-10 sm:h-11 bg-warm-gradient hover:opacity-90 text-white shadow-soft"
              onClick={() => setShowInterestDialog(true)}
              disabled={post.status !== "disponible"}
            >
              <Heart className="h-4 w-4 mr-2" />
              Me Interesa
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Interest Dialog */}
      <Dialog open={showInterestDialog} onOpenChange={setShowInterestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mostrar Interés en {post.pet_name}</DialogTitle>
            <DialogDescription>
              Envía un mensaje al dueño para iniciar el proceso de adopción
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={interestMessage}
              onChange={(e) => setInterestMessage(e.target.value)}
              placeholder="Cuéntale al dueño por qué eres el adoptante ideal..."
              rows={4}
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
                Enviar
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
            <DialogDescription>
              Revisa los mensajes de las personas interesadas
            </DialogDescription>
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
                        {interest.profiles?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {interest.profiles?.display_name || "Usuario"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interest.created_at), "d MMM", { locale: es })}
                        </span>
                      </div>
                      {interest.message && (
                        <p className="text-sm text-muted-foreground">{interest.message}</p>
                      )}
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
