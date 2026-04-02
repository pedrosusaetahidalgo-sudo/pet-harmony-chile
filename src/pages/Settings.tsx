import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Bell,
  Shield,
  Info,
  LogOut,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const avatarOptions = [
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Luna&backgroundColor=e8dbf5&shapeColor=7c3aed",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Rocky&backgroundColor=ddd6fe&shapeColor=8b5cf6",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Simba&backgroundColor=f3e8ff&shapeColor=a855f7",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Nala&backgroundColor=ede9fe&shapeColor=6d28d9",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Max&backgroundColor=fae8ff&shapeColor=c026d3",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Miso&backgroundColor=e0e7ff&shapeColor=4f46e5",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Buddy&backgroundColor=ede9fe&shapeColor=7c3aed",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Pelusa&backgroundColor=f5f3ff&shapeColor=8b5cf6",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Canela&backgroundColor=ddd6fe&shapeColor=a78bfa",
    "https://api.dicebear.com/9.x/thumbs/svg?seed=Toby&backgroundColor=e8dbf5&shapeColor=9333ea",
  ];

  const [healthReminders, setHealthReminders] = useState(true);
  const [messages, setMessages] = useState(true);
  const [socialActivity, setSocialActivity] = useState(false);

  const userInitial = user?.email?.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, bio, location, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setAvatarUrl(data.avatar_url || "");
      }
      if (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: displayName,
        bio,
        location,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil guardado",
        description: "Tus cambios se han guardado correctamente.",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Configuracion</h1>
        </div>

        {/* Section 1: Mi Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Mi Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                ) : null}
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{displayName || "Sin nombre"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Elige tu Avatar</Label>
              <div className="grid grid-cols-5 gap-3">
                {avatarOptions.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                      avatarUrl === url ? "border-primary ring-2 ring-primary/30 scale-110" : "border-transparent"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre para mostrar</Label>
              <Input
                id="displayName"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Cuentanos sobre ti y tus mascotas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicacion</Label>
              <Input
                id="location"
                placeholder="Ej: Santiago, Chile"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Guardando..." : "Guardar perfil"}
            </Button>
          </CardContent>
        </Card>

        {/* Section 2: Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Correo electronico</Label>
              <p className="font-medium mt-1">{user?.email}</p>
            </div>
            <Separator />
            <Button variant="destructive" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesion
            </Button>
          </CardContent>
        </Card>

        {/* Section 3: Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recordatorios de salud</p>
                <p className="text-sm text-muted-foreground">Vacunas, controles y citas</p>
              </div>
              <Switch checked={healthReminders} onCheckedChange={setHealthReminders} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mensajes</p>
                <p className="text-sm text-muted-foreground">Nuevos mensajes directos</p>
              </div>
              <Switch checked={messages} onCheckedChange={setMessages} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Actividad social</p>
                <p className="text-sm text-muted-foreground">Likes, comentarios y seguidores</p>
              </div>
              <Switch checked={socialActivity} onCheckedChange={setSocialActivity} />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate("/terms")}
            >
              <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Terminos y Condiciones</p>
                <p className="text-sm text-muted-foreground">Lee nuestros terminos de uso</p>
              </div>
            </Button>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate("/privacy")}
            >
              <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Politica de Privacidad</p>
                <p className="text-sm text-muted-foreground">Como protegemos tus datos</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Section 5: App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Acerca de
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Paw Friend &copy; {new Date().getFullYear()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Red Social para Mascotas en Chile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
