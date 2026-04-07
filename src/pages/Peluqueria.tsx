import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, ArrowLeft, Bell } from "@/lib/icons";
import { LINKS } from "@/lib/links";

export default function Peluqueria() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(LINKS.servicios())}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a servicios
      </Button>

      <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
        <CardContent className="p-8 md:p-12 text-center space-y-5">
          <div className="inline-flex p-4 rounded-full bg-pink-100">
            <Scissors className="h-10 w-10 text-pink-600" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold">Peluquería para mascotas</h1>

          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Estamos sumando peluqueros profesionales al directorio. Pronto vas a poder reservar baño, corte, arreglo de uñas y más, directo desde Paw Friend.
          </p>

          <div className="bg-white rounded-lg p-4 border border-pink-200 max-w-md mx-auto">
            <div className="flex items-start gap-3 text-left">
              <Bell className="h-5 w-5 text-pink-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">¿Eres peluquero canino?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estamos buscando los primeros peluqueros profesionales para sumarse al directorio. Escríbenos a{" "}
                  <a href="mailto:hola@pawfriend.cl" className="text-pink-700 hover:underline font-medium">
                    hola@pawfriend.cl
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={() => navigate(LINKS.servicios())} variant="outline">
              Ver otros servicios
            </Button>
            <Button onClick={() => navigate(LINKS.vets())} className="bg-amber-500 hover:bg-amber-600">
              Buscar veterinario
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
