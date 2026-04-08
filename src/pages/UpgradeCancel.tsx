import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UpgradeCancel() {
  const navigate = useNavigate();

  return (
    <div className="container px-4 py-12 max-w-md mx-auto animate-fade-in">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pago cancelado</CardTitle>
          <CardDescription className="mt-2">
            No se realizó ningún cargo. Cuando quieras, podés volver a probar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full h-12" onClick={() => navigate("/upgrade")}>
            Ver planes de nuevo
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
