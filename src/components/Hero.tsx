import { Button } from "@/components/ui/button";
import { Heart, Stethoscope, Star, Shield, Sparkles } from "@/lib/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LINKS } from "@/lib/links";

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimary = () => navigate(user ? LINKS.home() : LINKS.auth());
  const handleSecondary = () => navigate(LINKS.auth());

  return (
    <section className="relative min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 py-10 bg-hero-gradient overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl pointer-events-none" />

      {/* Top content: badge + title + subtitle + buttons */}
      <div className="relative flex flex-col items-center text-center gap-4 w-full max-w-md">
        <span className="inline-flex items-center rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20 shadow-sm">
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
          Hecha en Chile · Para mascotas chilenas
        </span>

        <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
          Cuida la salud de tu mascota con{" "}
          <span className="bg-warm-gradient bg-clip-text text-transparent">
            veterinarios verificados
          </span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground leading-snug max-w-md">
          Encuentra, reserva y lleva la ficha médica de tu mascota en un solo lugar. <strong className="text-foreground">Gratis</strong> para tu primera mascota.
        </p>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1">
            <div className="flex">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
            Reseñas verificadas
          </span>
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            Datos seguros
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            Sin tarjeta
          </span>
        </div>

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

      {/* Hero media: en mobile mostramos sólo la imagen (el video pesa 4.4 MB
          y consume datos del usuario). En md+ cargamos el video con
          preload="none" para que no descargue hasta que sea visible. */}
      <div className="relative w-full max-w-md mt-8 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/40 aspect-[8/5] bg-muted">
        {/* Mobile: sólo imagen ligera */}
        <img
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop"
          alt="Dueño jugando con su mascota"
          className="md:hidden w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Desktop: video con poster, sin auto-descarga */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop"
          className="hidden md:block w-full h-full object-cover"
        >
          <source src="/videos/hero-pet.mp4" type="video/mp4" />
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
