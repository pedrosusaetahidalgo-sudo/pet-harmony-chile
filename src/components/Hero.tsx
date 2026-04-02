import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-pets.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="container px-4 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20">
                <Heart className="mr-2 h-4 w-4 fill-primary" />
                Red Social para Mascotas en Chile
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Conecta, Cuida y Comparte la Vida de tu{" "}
              <span className="bg-warm-gradient bg-clip-text text-transparent">
                Mascota
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              La plataforma donde cada mascota tiene su propia red social. Gestiona su salud,
              descubre lugares pet-friendly y conecta con otros dueños que comparten tu pasión por
              el bienestar animal.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 transition-all text-base shadow-lg hover:shadow-xl"
                onClick={() => navigate(user ? "/home" : "/auth")}
              >
                {user ? "Ir al Inicio" : "Comenzar Gratis"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base hover:bg-primary/5"
                onClick={() => navigate("/places")}
              >
                Explorar
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 transition-smooth hover:scale-105 cursor-default">
                <div className="rounded-full bg-secondary/10 p-2">
                  <MapPin className="h-5 w-5 text-secondary" />
                </div>
                <span className="text-sm font-medium">Lugares Pet-Friendly</span>
              </div>
              <div className="flex items-center gap-2 transition-smooth hover:scale-105 cursor-default">
                <div className="rounded-full bg-secondary/10 p-2">
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
                <span className="text-sm font-medium">Historial Médico</span>
              </div>
              <div className="flex items-center gap-2 transition-smooth hover:scale-105 cursor-default">
                <div className="rounded-full bg-primary/10 p-2">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Comunidad Activa</span>
              </div>
            </div>
          </div>

          <div className="relative animate-scale-in stagger-3">
            <div className="relative rounded-3xl overflow-hidden shadow-medium transition-smooth hover:shadow-xl">
              <img
                src={heroImage}
                alt="Mascotas felices en Chile"
                className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>

            {/* Floating Cards */}
            <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl p-4 shadow-soft max-w-[200px] hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary fill-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">15K+</div>
                  <div className="text-xs text-muted-foreground">Mascotas Registradas</div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-card border border-border rounded-2xl p-3 shadow-soft hidden lg:block">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-bold">500+</div>
                  <div className="text-[10px] text-muted-foreground">Lugares</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
