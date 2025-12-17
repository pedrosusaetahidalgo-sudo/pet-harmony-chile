import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  MapPin, 
  Clock, 
  Calendar,
  Plus,
  Search,
  Dog,
  Navigation,
  CheckCircle2,
  Heart,
  MessageCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DateTimePicker from "@/components/DateTimePicker";
import PlacesAutocomplete from "@/components/PlacesAutocomplete";
import GoogleMapsLoader from "@/components/GoogleMapsLoader";

const SharedWalks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sharedWalks, setSharedWalks] = useState<any[]>([]);
  const [myWalks, setMyWalks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state for creating walks
  const [walkTitle, setWalkTitle] = useState("");
  const [walkDescription, setWalkDescription] = useState("");
  const [walkDate, setWalkDate] = useState<Date | undefined>();
  const [meetingPoint, setMeetingPoint] = useState("");
  const [duration, setDuration] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [requirements, setRequirements] = useState("");

  useEffect(() => {
    loadWalks();
  }, [user]);

  const loadWalks = async () => {
    try {
      setLoading(true);
      
      // Load all shared walks
      const { data: walksData } = await (supabase as any)
        .from('shared_walks')
        .select(`
          *,
          profiles:organizer_id (display_name, avatar_url),
          participants:shared_walk_participants (
            id,
            profiles (display_name, avatar_url)
          )
        `)
        .eq('status', 'abierto')
        .order('scheduled_date', { ascending: true });
      
      setSharedWalks(walksData || []);

      // Load user's walks
      if (user) {
        const { data: myWalksData } = await (supabase as any)
          .from('shared_walks')
          .select(`
            *,
            profiles:organizer_id (display_name, avatar_url),
            participants:shared_walk_participants (
              id,
              profiles (display_name, avatar_url)
            )
          `)
          .eq('organizer_id', user.id)
          .order('scheduled_date', { ascending: false });
        
        setMyWalks(myWalksData || []);
      }
    } catch (error) {
      console.error('Error loading walks:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar los paseos compartidos"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinWalk = async (walkId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('shared_walk_participants')
        .insert({
          walk_id: walkId,
          user_id: user?.id,
          pet_ids: [],
          status: 'confirmado'
        });

      if (error) throw error;

      toast({
        title: "¡Te uniste al paseo! 🐕",
        description: "El organizador será notificado",
        className: "animate-scale-in"
      });

      loadWalks();
    } catch (error) {
      console.error('Error joining walk:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo unir al paseo"
      });
    }
  };

  const filteredWalks = sharedWalks.filter(walk =>
    walk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    walk.meeting_point?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createWalk = async () => {
    if (!user || !walkTitle || !walkDate || !meetingPoint) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos requeridos"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('shared_walks')
        .insert({
          organizer_id: user.id,
          title: walkTitle,
          description: walkDescription,
          scheduled_date: walkDate.toISOString(),
          meeting_point: meetingPoint,
          estimated_duration: parseInt(duration) || 60,
          max_participants: parseInt(maxParticipants) || 5,
          requirements: requirements,
          status: 'abierto'
        });

      if (error) throw error;

      toast({
        title: "¡Paseo creado!",
        description: "Tu paseo compartido ha sido publicado",
      });

      setCreateDialogOpen(false);
      resetForm();
      loadWalks();
    } catch (error) {
      console.error('Error creating walk:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el paseo"
      });
    }
  };

  const resetForm = () => {
    setWalkTitle("");
    setWalkDescription("");
    setWalkDate(undefined);
    setMeetingPoint("");
    setDuration("");
    setMaxParticipants("");
    setRequirements("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Dog className="h-12 w-12 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando paseos compartidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-violet-500 bg-clip-text text-transparent">
            Paseos Compartidos
          </span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Únete a otros dueños para pasear juntos con sus mascotas
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar paseos..." 
            className="pl-12 h-12 rounded-xl border-2 focus:border-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="gap-2 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-5 w-5" />
          <span className="hidden md:inline">Crear Paseo</span>
        </Button>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="w-full h-auto grid grid-cols-2 gap-2 bg-muted/50 p-2 rounded-xl border border-border/50">
          <TabsTrigger 
            value="available"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Disponibles
          </TabsTrigger>
          <TabsTrigger 
            value="mine"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-500 data-[state=active]:text-white"
          >
            <Dog className="h-4 w-4 mr-2" />
            Mis Paseos
          </TabsTrigger>
        </TabsList>

        {/* Available Walks */}
        <TabsContent value="available" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {filteredWalks.map((walk) => (
              <Card key={walk.id} className="overflow-hidden hover:shadow-lg transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={walk.profiles?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          {walk.profiles?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{walk.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Por {walk.profiles?.display_name}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-700">
                      {walk.participants?.length || 0}/{walk.max_participants} personas
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {walk.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{new Date(walk.scheduled_date).toLocaleDateString('es-CL', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{new Date(walk.scheduled_date).toLocaleTimeString('es-CL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="line-clamp-1">{walk.meeting_point}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="h-4 w-4 text-primary" />
                      <span>{walk.estimated_duration} minutos</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90"
                      onClick={() => joinWalk(walk.id)}
                      disabled={(walk.participants?.length || 0) >= walk.max_participants}
                    >
                      {(walk.participants?.length || 0) >= walk.max_participants ? 'Completo' : 'Unirme'}
                    </Button>
                    <Button variant="outline" className="hover:bg-primary hover:text-white">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWalks.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay paseos compartidos disponibles</p>
              <Button 
                className="mt-4 bg-warm-gradient hover:opacity-90"
                onClick={() => setCreateDialogOpen(true)}
              >
                Crear el Primero
              </Button>
            </div>
          )}
        </TabsContent>

        {/* My Walks */}
        <TabsContent value="mine" className="space-y-4 mt-6">
          {myWalks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dog className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No has creado paseos compartidos aún</p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-warm-gradient hover:opacity-90"
                >
                  Crear Paseo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myWalks.map((walk) => (
                <Card key={walk.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{walk.title}</h3>
                        <p className="text-sm text-muted-foreground">{walk.description}</p>
                      </div>
                      <Badge className={
                        walk.status === 'abierto' 
                          ? 'bg-green-500/10 text-green-700' 
                          : 'bg-gray-500/10 text-gray-700'
                      }>
                        {walk.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{new Date(walk.scheduled_date).toLocaleDateString('es-CL')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{walk.participants?.length || 0} participantes</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        Ver Detalles
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Gestionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Walk Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Paseo Compartido</DialogTitle>
            <DialogDescription>
              Organiza un paseo y conecta con otros dueños de mascotas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Título del Paseo *</Label>
              <Input 
                placeholder="Ej: Paseo matinal en Parque Bicentenario" 
                value={walkTitle}
                onChange={(e) => setWalkTitle(e.target.value)}
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea 
                placeholder="Describe el tipo de paseo, nivel de actividad, etc."
                rows={3}
                value={walkDescription}
                onChange={(e) => setWalkDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Fecha y Hora *</Label>
              <DateTimePicker
                date={walkDate}
                onDateChange={setWalkDate}
                showTime
                placeholder="Seleccionar fecha y hora"
                minDate={new Date()}
              />
            </div>

            <div>
              <Label>Punto de Encuentro *</Label>
              <GoogleMapsLoader fallback={
                <Input 
                  placeholder="Dirección o lugar específico" 
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                />
              }>
                <PlacesAutocomplete
                  value={meetingPoint}
                  onChange={setMeetingPoint}
                  onPlaceSelect={(place) => setMeetingPoint(place.address)}
                  placeholder="Buscar dirección..."
                />
              </GoogleMapsLoader>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duración (minutos)</Label>
                <Input 
                  type="number" 
                  placeholder="60" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div>
                <Label>Máx. Participantes</Label>
                <Input 
                  type="number" 
                  placeholder="5" 
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Requisitos</Label>
              <Textarea 
                placeholder="Ej: Perros sociables, correa obligatoria, etc."
                rows={2}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90"
                onClick={createWalk}
              >
                Crear Paseo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedWalks;
