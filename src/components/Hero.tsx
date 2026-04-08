import { Button } from "@/components/ui/button";
import { Heart, Stethoscope } from "@/lib/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LINKS } from "@/lib/links";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimary = () => navigate(user ? LINKS.home() : LINKS.auth());
  const handleSecondary = () => navigate(LINKS.auth());

  return (
    <section className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 py-6 bg-hero-gradient">
      {/* Top content: badge + title + subtitle + buttons */}
      <div className="flex flex-col items-center text-center gap-4 w-full max-w-sm">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
          <Heart className="mr-1.5 h-3.5 w-3.5 fill-primary" />
          Red Social para Mascotas en Chile
        </span>

        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Cuida la salud de tu mascota con{" "}
          <span className="bg-warm-gradient bg-clip-text text-transparent">
            veterinarios verificados
          </span>
        </h1>

        <p className="text-sm text-muted-foreground leading-snug max-w-xs">
          Encuentra, reserva y lleva el control médico de tu mascota en un solo lugar. 100% gratis para dueños.
        </p>

        <div className="flex flex-col gap-3 w-full pt-2">
          <Button
            className="h-12 text-base font-semibold w-full max-w-sm bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            onClick={handlePrimary}
          >
            {user ? "Ir al Inicio" : "Crear cuenta gratis"}
          </Button>
          <Button
            variant="outline"
            className="h-12 text-base font-semibold w-full max-w-sm border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
            onClick={handleSecondary}
          >
            {user ? "Explorar" : "Ya tengo cuenta"}
          </Button>

          {/* CTA destacado para veterinarios */}
          <div className="relative w-full max-w-sm mt-2">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-block bg-amber-400 text-purple-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                ¿Eres vet?
              </span>
            </div>
            <Button
              className="h-12 text-base font-bold w-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 hover:opacity-90 text-white shadow-xl border-2 border-amber-300 transition-all"
              onClick={() => navigate(LINKS.registroVeterinario())}
            >
              <Stethoscope className="h-5 w-5 mr-2" />
              Soy veterinario · Crear perfil
            </Button>
          </div>
        </div>
      </div>

      {/* Hero media: video con fallback a imagen.
          Cambiar HERO_VIDEO_URL por la URL del video de Kling cuando este listo.
          Formato sugerido: MP4 H.264, 800x500, <2MB, 5-8 seg, loop friendly. */}
      <div className="w-full max-w-md mt-6 rounded-2xl overflow-hidden shadow-md aspect-[8/5] bg-muted">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop"
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-pet.mp4" type="video/mp4" />
          {/* Fallback si el navegador no soporta video o falla la carga */}
          <img
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop"
            alt="Dueño jugando con su mascota"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </video>
      </div>
    </section>
  );
};

export default Hero;
