import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActivityFeed from "@/components/social/ActivityFeed";

export default function Actividad() {
  return (
    <div className="container max-w-3xl mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividad de la comunidad</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed limit={20} />
        </CardContent>
      </Card>
    </div>
  );
}
