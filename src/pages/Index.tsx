import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PublicHeader } from "@/components/PublicHeader";
import { LegalFooter } from "@/components/LegalFooter";
import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import PetCard from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Heart, 
  Users, 
  Bell, 
  MessageSquare,
  Shield,
  Sparkles,
  Trophy,
  Home,
  Dog,
  Stethoscope,
  FileText,
  Camera,
  Share2,
  Zap,
  Star,
  Gift,
  Brain,
  Search
} from "lucide-react";
const dogProfileUrl = "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=faces";
const catProfileUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=faces";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <Hero />

      {/* Features Section */}
      <section className="container px-4 py-20">
        <div className="text-center mb-12 space-y-4 animate-fade-in-up">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
            ✨ Características Principales
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Todo lo que tu Mascota{" "}
            <span className="bg-warm-gradient bg-clip-text text-transparent">Necesita</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Una plataforma completa diseñada para el bienestar y la felicidad de tus compañeros peludos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 p-4 inline-flex group-hover:scale-110 transition-transform">
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="font-bold text-lg">Pet Social</h3>
              <p className="text-sm text-muted-foreground">
                Comparte momentos, conecta con otros dueños y crea una comunidad
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 inline-flex group-hover:scale-110 transition-transform">
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">Lugares Pet-Friendly</h3>
              <p className="text-sm text-muted-foreground">
                Descubre parques, cafés y servicios cerca de ti con IA
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 inline-flex group-hover:scale-110 transition-transform">
                <Home className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-bold text-lg">Adopción</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra tu compañero perfecto o ayuda a otros a encontrar hogar
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 inline-flex group-hover:scale-110 transition-transform">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="font-bold text-lg">Gamificación</h3>
              <p className="text-sm text-muted-foreground">
                Gana puntos, logros y recompensas por cuidar de tus mascotas
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Professional Services */}
      <section className="container px-4 py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="text-center mb-12 space-y-4">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-sm px-4 py-1">
            🐾 Servicios Profesionales
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Profesionales{" "}
            <span className="bg-nature-gradient bg-clip-text text-transparent">Verificados</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conecta con expertos certificados que cuidan de tu mascota como si fuera suya
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500/50 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <CardContent className="p-8 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-5 inline-flex group-hover:scale-110 transition-transform">
                <Dog className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="font-bold text-xl">Paseadores</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Profesionales verificados con seguimiento GPS, reportes fotográficos y rutas registradas
              </p>
              <div className="flex gap-2 flex-wrap pt-2">
                <Badge variant="secondary" className="text-xs">GPS en vivo</Badge>
                <Badge variant="secondary" className="text-xs">Reportes</Badge>
                <Badge variant="secondary" className="text-xs">Verificados</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-500/50 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardContent className="p-8 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5 inline-flex group-hover:scale-110 transition-transform">
                <Stethoscope className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="font-bold text-xl">Veterinarios</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Atención a domicilio con profesionales certificados. Consultas, vacunas y emergencias
              </p>
              <div className="flex gap-2 flex-wrap pt-2">
                <Badge variant="secondary" className="text-xs">A domicilio</Badge>
                <Badge variant="secondary" className="text-xs">Certificados</Badge>
                <Badge variant="secondary" className="text-xs">Emergencias</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-500/50 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
            <CardContent className="p-8 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-5 inline-flex group-hover:scale-110 transition-transform">
                <Home className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="font-bold text-xl">Cuidadores</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hogares verificados para el cuidado de tu mascota. Reportes diarios con fotos y videos
              </p>
              <div className="flex gap-2 flex-wrap pt-2">
                <Badge variant="secondary" className="text-xs">Reportes diarios</Badge>
                <Badge variant="secondary" className="text-xs">Fotos/Videos</Badge>
                <Badge variant="secondary" className="text-xs">Hogares seguros</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Features */}
      <section className="container px-4 py-20">
        <div className="text-center mb-12 space-y-4">
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-sm px-4 py-1">
            🤖 Inteligencia Artificial
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Powered by{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Claude AI potencia nuestras funciones más avanzadas para darte la mejor experiencia
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 inline-flex">
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="font-bold text-lg">Análisis de Comportamiento</h3>
              <p className="text-sm text-muted-foreground">
                Sube videos de tu perro y obtén análisis detallado de su lenguaje corporal y estado emocional
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 inline-flex">
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">Consejos por Raza</h3>
              <p className="text-sm text-muted-foreground">
                Obtén recomendaciones personalizadas según la raza, edad y características de tu mascota
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 inline-flex">
                <Search className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-bold text-lg">Generación de Lugares</h3>
              <p className="text-sm text-muted-foreground">
                IA que encuentra y genera información de lugares pet-friendly cerca de ti automáticamente
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sample Feed Section */}
      <section className="container px-4 py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="text-center mb-12 space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
            🐕 Explora Nuestra App
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Pet Social{" "}
            <span className="bg-warm-gradient bg-clip-text text-transparent">en Acción</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mira lo que otras mascotas y sus dueños están compartiendo ahora mismo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <PetCard
            postId="example-1"
            petName="Max"
            petImage={dogProfileUrl}
            ownerName="María González"
            location="Santiago, Chile"
            description="¡Primer día en el parque! Max está súper feliz corriendo con sus nuevos amigos 🐕"
            likes={234}
            comments={18}
            tags={["Golden", "Activo", "Amigable"]}
          />
          <PetCard
            postId="example-2"
            petName="Luna"
            petImage={catProfileUrl}
            ownerName="Carlos Pérez"
            location="Valparaíso, Chile"
            description="Luna descubrió su nuevo lugar favorito. Le encanta ver los pájaros desde aquí 🐱"
            likes={189}
            comments={12}
            tags={["Gato", "Curioso", "Indoor"]}
          />
          <PetCard
            postId="example-3"
            petName="Rocky"
            petImage={dogProfileUrl}
            ownerName="Ana Martínez"
            location="Viña del Mar, Chile"
            description="Rocky y yo disfrutando del atardecer en la playa. ¡Momentos perfectos! 🌅"
            likes={301}
            comments={25}
            tags={["Beagle", "Playa", "Aventurero"]}
          />
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg" 
            className="bg-warm-gradient hover:opacity-90 transition-opacity text-lg px-8 h-12"
            onClick={() => navigate(user ? "/home" : "/auth")}
          >
            {user ? "Ir a Pet Social" : "Únete Ahora"}
          </Button>
        </div>
      </section>

      {/* Health & Organization */}
      <section className="container px-4 py-20">
        <div className="text-center mb-12 space-y-4">
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-sm px-4 py-1">
            🏥 Salud y Organización
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Gestión{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Completa</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mantén toda la información de salud y documentos organizados en un solo lugar
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center space-y-3">
              <div className="rounded-full bg-red-500/10 p-4 inline-flex">
                <Calendar className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="font-semibold">Historial Médico</h3>
              <p className="text-xs text-muted-foreground">
                Vacunas, tratamientos y consultas en timeline
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center space-y-3">
              <div className="rounded-full bg-blue-500/10 p-4 inline-flex">
                <FileText className="h-7 w-7 text-blue-500" />
              </div>
              <h3 className="font-semibold">Documentos</h3>
              <p className="text-xs text-muted-foreground">
                Certificados, microchip y documentación oficial
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center space-y-3">
              <div className="rounded-full bg-purple-500/10 p-4 inline-flex">
                <Bell className="h-7 w-7 text-purple-500" />
              </div>
              <h3 className="font-semibold">Recordatorios</h3>
              <p className="text-xs text-muted-foreground">
                Notificaciones automáticas de citas y vacunas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center space-y-3">
              <div className="rounded-full bg-green-500/10 p-4 inline-flex">
                <Camera className="h-7 w-7 text-green-500" />
              </div>
              <h3 className="font-semibold">PDF Export</h3>
              <p className="text-xs text-muted-foreground">
                Exporta registros para compartir con veterinarios
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Community Features */}
      <section className="container px-4 py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="text-center mb-12 space-y-4">
          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-sm px-4 py-1">
            🤝 Comunidad
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            Conecta y{" "}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Comparte</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500/50">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4">
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Paseos Compartidos</h3>
                  <p className="text-sm text-muted-foreground">Organiza salidas grupales</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Crea eventos de paseos, invita a otros dueños y disfruta de actividades sociales con tus mascotas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-500/50">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 p-4">
                  <MessageSquare className="h-8 w-8 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Chat Directo</h3>
                  <p className="text-sm text-muted-foreground">Mensajería integrada</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Coordina con paseadores, veterinarios y otros dueños. Todo en un solo lugar y de forma segura
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="container px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex-shrink-0">
              <div className="rounded-xl bg-yellow-500/10 p-3 group-hover:scale-110 transition-transform">
                <Gift className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Recompensas Reales</h3>
              <p className="text-sm text-muted-foreground">
                Canjea puntos por descuentos en tiendas y servicios para mascotas
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex-shrink-0">
              <div className="rounded-xl bg-red-500/10 p-3 group-hover:scale-110 transition-transform">
                <Bell className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Alertas de Mascotas Perdidas</h3>
              <p className="text-sm text-muted-foreground">
                Sistema comunitario para ayudar a encontrar mascotas extraviadas
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex-shrink-0">
              <div className="rounded-xl bg-green-500/10 p-3 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Privacidad Total</h3>
              <p className="text-sm text-muted-foreground">
                Control completo sobre la visibilidad de tus datos y los de tus mascotas
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex-shrink-0">
              <div className="rounded-xl bg-blue-500/10 p-3 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Rutas con GPS</h3>
              <p className="text-sm text-muted-foreground">
                Seguimiento en tiempo real de los paseos de tu mascota con paseadores
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex-shrink-0">
              <div className="rounded-xl bg-purple-500/10 p-3 group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sistema de Reseñas</h3>
              <p className="text-sm text-muted-foreground">
                Califica y lee opiniones de servicios profesionales verificados
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex-shrink-0">
              <div className="rounded-xl bg-pink-500/10 p-3 group-hover:scale-110 transition-transform">
                <Share2 className="h-6 w-6 text-pink-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Comparte Logros</h3>
              <p className="text-sm text-muted-foreground">
                Celebra los hitos de tu mascota con la comunidad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-warm-gradient p-12 md:p-20 text-center shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Únete a miles de dueños felices</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              ¿Listo para una Experiencia Completa?
            </h2>
            <p className="text-xl text-white/95 leading-relaxed">
              Todo lo que necesitas para cuidar, conectar y disfrutar con tu mascota en una sola app
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg px-10 h-14 font-semibold"
                onClick={() => navigate(user ? "/feed" : "/auth")}
              >
                {user ? "Ir a Pet Social" : "Comenzar Gratis"}
              </Button>
            </div>
            <p className="text-white/80 text-sm">
              ✓ Sin tarjeta de crédito  ✓ 100% Gratis  ✓ Disponible en Chile
            </p>
          </div>
          <div className="absolute top-0 right-0 -mt-32 -mr-32 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        </div>
      </section>

      <LegalFooter />
    </div>
  );
};

export default Index;
