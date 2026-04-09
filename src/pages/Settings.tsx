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
import { LINKS } from "@/lib/links";
import {
  User,
  Mail,
  Bell,
  Shield,
  Info,
  LogOut,
  Save,
  Loader2,
} from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { IntegrationsCard } from "@/components/settings/IntegrationsCard";
import { PageHeader } from "@/components/PageHeader";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const avatarSeeds = ["Luna", "Rocky", "Simba", "Nala", "Max", "Miso", "Buddy", "Pelusa", "Canela", "Toby"];
  const avatarColors = [
    { bg: "e8dbf5", shape: "7c3aed", label: "Morado" },
    { bg: "dbeafe", shape: "2563eb", label: "Azul" },
    { bg: "d1fae5", shape: "059669", label: "Verde" },
    { bg: "fce7f3", shape: "db2777", label: "Rosa" },
    { bg: "ffedd5", shape: "ea580c", label: "Naranja" },
    { bg: "fef3c7", shape: "d97706", label: "Amarillo" },
  ];
  const [selectedColor, setSelectedColor] = useState(0);
  const avatarOptions = avatarSeeds.map(seed =>
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=${avatarColors[selectedColor].bg}&shapeColor=${avatarColors[selectedColor].shape}`
  );

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

      if (error) {
        logger.error("Error loading profile:", error);
        toast({ title: "Algo salió mal", description: "No se pudo cargar el perfil", variant: "destructive" });
        // No marcamos profileLoaded=true para evitar que un save posterior
        // sobreescriba la fila con strings vacíos si el load falló.
        return;
      }
      if (data) {
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setProfileLoaded(true);
    };

    loadProfile();

    const loadNotificationPrefs = async () => {
      const { data: prefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefsError) {
        logger.error("Error loading notification preferences:", prefsError);
        toast({ title: "Algo salió mal", description: "No se pudieron cargar las preferencias de notificación", variant: "destructive" });
      }

      if (prefs) {
        setHealthReminders(prefs.reminder_notifications);
        setMessages(prefs.push_enabled);
        setSocialActivity(prefs.social_notifications);
      }
    };

    loadNotificationPrefs();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    // Guardia anti data-loss: no permitimos guardar si el profile aún no se
    // cargó. Sin esto, un click prematuro (o un re-render durante otro flow
    // como desconectar Google Calendar) sobreescribiría display_name/bio/
    // location con strings vacíos y dejaría el perfil "reseteado".
    if (!profileLoaded) {
      toast({
        title: "Espera un momento",
        description: "Estamos cargando tu perfil. Intenta guardar en unos segundos.",
      });
      return;
    }

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
        title: "Algo salió mal",
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

  const saveNotificationPreferences = async (field: string, value: boolean) => {
    if (!user) return;
    await supabase.from('notification_preferences').upsert({
      user_id: user.id,
      [field]: value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(LINKS.auth());
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Configuración" />
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">

        {/* Section 1: Mi Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Mi Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Completion */}
            {(() => {
              const filled = [displayName, bio, location, avatarUrl].filter(Boolean).length;
              const pct = Math.round((filled / 4) * 100);
              return pct < 100 ? (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">Perfil {pct}% completo</span>
                    <span className="text-muted-foreground">{filled}/4</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ) : null;
            })()}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {/* key={avatarUrl} fuerza el remount al cambiar la URL para
                    que Radix re-evalúe el load state inmediatamente y no se
                    quede mostrando el fallback "U" hasta el próximo render. */}
                {avatarUrl ? (
                  <AvatarImage key={avatarUrl} src={avatarUrl} alt="Avatar" />
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

            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">1. Elige un color de fondo</Label>
                <div className="flex gap-2 mt-2">
                  {avatarColors.map((color, i) => (
                    <button
                      key={color.label}
                      type="button"
                      onClick={() => setSelectedColor(i)}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                        selectedColor === i ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                      }`}
                      style={{ backgroundColor: `#${color.bg}`, border: `2px solid #${color.shape}` }}
                      title={color.label}
                      aria-label={`Color ${color.label}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">2. Elige un estilo</Label>
                <div className="grid grid-cols-5 gap-3 mt-2">
                {avatarOptions.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                      avatarUrl === url ? "border-primary ring-2 ring-primary/30 scale-110" : "border-transparent"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} loading="lazy" className="w-full h-full" />
                  </button>
                ))}
                </div>
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
                placeholder="Cuéntanos sobre ti y tus mascotas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ej: Santiago, Chile"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving || !profileLoaded} className="w-full">
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
              <Label className="text-muted-foreground">Correo electrónico</Label>
              <p className="font-medium mt-1">{user?.email}</p>
            </div>
            <Separator />
            <Button variant="destructive" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

        {/* Section 3: Integraciones (WhatsApp + Google Calendar) */}
        <IntegrationsCard />

        {/* Section 4: Notificaciones */}
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
              <Switch checked={healthReminders} onCheckedChange={(v) => { setHealthReminders(v); saveNotificationPreferences('reminder_notifications', v); }} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mensajes</p>
                <p className="text-sm text-muted-foreground">Nuevos mensajes directos</p>
              </div>
              <Switch checked={messages} onCheckedChange={(v) => { setMessages(v); saveNotificationPreferences('push_enabled', v); }} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Actividad social</p>
                <p className="text-sm text-muted-foreground">Likes, comentarios y seguidores</p>
              </div>
              <Switch checked={socialActivity} onCheckedChange={(v) => { setSocialActivity(v); saveNotificationPreferences('social_notifications', v); }} />
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
              onClick={() => navigate(LINKS.terms())}
            >
              <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Términos y Condiciones</p>
                <p className="text-sm text-muted-foreground">Lee nuestros términos de uso</p>
              </div>
            </Button>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3"
              onClick={() => navigate(LINKS.privacy())}
            >
              <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Política de Privacidad</p>
                <p className="text-sm text-muted-foreground">Cómo protegemos tus datos</p>
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
              <span className="text-muted-foreground">Versión</span>
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
