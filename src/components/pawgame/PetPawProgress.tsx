import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Activity, 
  Shield, 
  Smile, 
  PawPrint,
  Syringe,
  Dog,
  Stethoscope,
  Calendar,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Pet {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
}

interface PetProgress {
  id: string;
  pet_id: string;
  health_score: number;
  activity_score: number;
  happiness_score: number;
  social_score: number;
  total_walks: number;
  total_vet_visits: number;
  last_walk_date: string | null;
  last_vet_date: string | null;
  vaccines_up_to_date: boolean;
}

interface PetPawProgressProps {
  pets: Pet[];
  userId: string;
}

const ScoreBar = ({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  color: string;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1 text-muted-foreground">
        <Icon className={`h-3 w-3 ${color}`} />
        {label}
      </span>
      <span className="font-medium">{value}%</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
);

export const PetPawProgress = ({ pets, userId }: PetPawProgressProps) => {
  const navigate = useNavigate();
  const [petProgress, setPetProgress] = useState<Record<string, PetProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPetProgress();
  }, [pets]);

  const loadPetProgress = async () => {
    if (pets.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('pet_paw_progress')
        .select('*')
        .in('pet_id', pets.map(p => p.id));

      if (data) {
        const progressMap: Record<string, PetProgress> = {};
        data.forEach(p => {
          progressMap[p.pet_id] = p;
        });
        setPetProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading pet progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (pets.length === 0) {
    return (
      <Card className="text-center p-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <PawPrint className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No tienes peludos registrados</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Agrega tu primera mascota para comenzar a trackear su bienestar
        </p>
        <Button onClick={() => navigate('/add-pet')}>
          <PawPrint className="h-4 w-4 mr-2" />
          Agregar Mascota
        </Button>
      </Card>
    );
  }

  const calculateOverallScore = (progress: PetProgress | undefined) => {
    if (!progress) return 50;
    return Math.round(
      (progress.health_score + progress.activity_score + 
       progress.happiness_score + progress.social_score) / 4
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'bg-green-500/10 text-green-600' };
    if (score >= 60) return { label: 'Bueno', color: 'bg-yellow-500/10 text-yellow-600' };
    if (score >= 40) return { label: 'Regular', color: 'bg-orange-500/10 text-orange-600' };
    return { label: 'Necesita atención', color: 'bg-red-500/10 text-red-600' };
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-red-500/10 border-pink-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Mis Peludos
              </h3>
              <p className="text-sm text-muted-foreground">
                {pets.length} mascota{pets.length > 1 ? 's' : ''} registrada{pets.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/my-pets')}>
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pet Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {pets.map((pet) => {
          const progress = petProgress[pet.id];
          const overallScore = calculateOverallScore(progress);
          const scoreBadge = getScoreBadge(overallScore);

          return (
            <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                    <AvatarImage src={pet.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10">
                      <PawPrint className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pet.name}</CardTitle>
                      <Badge className={scoreBadge.color}>
                        {scoreBadge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {pet.species}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Overall Score */}
                <div className="flex items-center justify-center p-4 rounded-xl bg-muted/50">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                      {overallScore}
                    </div>
                    <p className="text-xs text-muted-foreground">Bienestar General</p>
                  </div>
                </div>

                {/* Individual Scores */}
                <div className="space-y-3">
                  <ScoreBar 
                    label="Salud" 
                    value={progress?.health_score || 50} 
                    icon={Shield} 
                    color="text-emerald-500" 
                  />
                  <ScoreBar 
                    label="Actividad" 
                    value={progress?.activity_score || 50} 
                    icon={Activity} 
                    color="text-blue-500" 
                  />
                  <ScoreBar 
                    label="Felicidad" 
                    value={progress?.happiness_score || 50} 
                    icon={Smile} 
                    color="text-yellow-500" 
                  />
                  <ScoreBar 
                    label="Social" 
                    value={progress?.social_score || 50} 
                    icon={Heart} 
                    color="text-pink-500" 
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Dog className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold">{progress?.total_walks || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Paseos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Stethoscope className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold">{progress?.total_vet_visits || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Visitas vet</p>
                    </div>
                  </div>
                </div>

                {/* Vaccines Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Syringe className={`h-4 w-4 ${progress?.vaccines_up_to_date ? 'text-green-500' : 'text-orange-500'}`} />
                    <span className="text-sm">Vacunas</span>
                  </div>
                  <Badge variant={progress?.vaccines_up_to_date ? 'default' : 'destructive'} className="text-xs">
                    {progress?.vaccines_up_to_date ? 'Al día' : 'Pendientes'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
