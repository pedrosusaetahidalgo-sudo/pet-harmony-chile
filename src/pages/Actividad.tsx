import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActivityFeed from "@/components/social/ActivityFeed";
import { PageHeader } from "@/components/PageHeader";
import { LINKS } from "@/lib/links";
import { useNavigate } from "react-router-dom";

export default function Actividad() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Actividad" onBack={() => navigate(LINKS.home())} />
      <div className="container max-w-3xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diario de salud de la comunidad</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Vacunas, paseos y controles que registran otros dueños. ¿Quieres compartir
            una foto? Anda al <a href="/feed" className="text-primary underline">Feed social</a>.
          </p>
        </CardHeader>
        <CardContent>
          <ActivityFeed limit={20} />
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
