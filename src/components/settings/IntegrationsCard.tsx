import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MessageCircle, Loader2, CheckCircle2, AlertCircle, Trash2 } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * IntegrationsCard
 * Settings card para WhatsApp opt-in + Google Calendar OAuth.
 * Sesión 2026-04-09.
 */
export function IntegrationsCard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // WhatsApp state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappOptedIn, setWhatsappOptedIn] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);

  // Google Calendar state
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Mostrar toast si volvemos del callback de Google
  useEffect(() => {
    const googleStatus = searchParams.get("google");
    if (googleStatus === "connected") {
      toast.success("Google Calendar conectado correctamente");
    } else if (googleStatus === "error") {
      toast.error("No se pudo conectar Google Calendar. Intenta de nuevo.");
    }
  }, [searchParams]);

  // Cargar estado actual
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("whatsapp_number, whatsapp_opted_in")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setWhatsappNumber((profile as any).whatsapp_number || "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setWhatsappOptedIn(!!(profile as any).whatsapp_opted_in);
      }

      const { data: statusRow } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("google_calendar_status" as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("user_id, google_email" as any)
        .eq("user_id", user.id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = statusRow as any;
      setCalendarConnected(!!row);
      setGoogleEmail(row?.google_email ?? null);
    })();
  }, [user]);

  const handleSaveWhatsApp = async () => {
    if (!user) return;
    if (whatsappOptedIn && !whatsappNumber.match(/^\+?56\s?9\s?\d{4}\s?\d{4}$/)) {
      toast.error("Número inválido. Usa formato +569 1234 5678");
      return;
    }
    setWhatsappSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        whatsapp_number: whatsappNumber.replace(/\s/g, ""),
        whatsapp_opted_in: whatsappOptedIn,
        whatsapp_opted_in_at: whatsappOptedIn ? new Date().toISOString() : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .eq("id", user.id);
    setWhatsappSaving(false);
    if (error) {
      toast.error("No se pudo guardar la preferencia");
    } else {
      toast.success(
        whatsappOptedIn
          ? "Recibirás recordatorios por WhatsApp 🐾"
          : "Notificaciones por WhatsApp desactivadas"
      );
    }
  };

  const handleConnectCalendar = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-oauth-init");
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const url = (data as any)?.url;
      if (!url) throw new Error("No URL returned");
      window.location.href = url;
    } catch (err) {
      console.error(err);
      toast.error("No se pudo iniciar la conexión con Google");
      setConnecting(false);
    }
  };

  const handleSyncCalendar = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync");
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = data as any;
      toast.success(`Sincronizados ${result?.synced ?? 0} eventos`);
    } catch (err) {
      console.error(err);
      toast.error("Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("¿Seguro que querés desconectar Google Calendar? Tu calendario \"Paw Friend\" quedará en tu Google, podés borrarlo manualmente si querés.")) return;
    setDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke("google-calendar-disconnect");
      if (error) throw error;
      setCalendarConnected(false);
      setGoogleEmail(null);
      toast.success("Google Calendar desconectado");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo desconectar");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Integraciones</span>
        </CardTitle>
        <CardDescription>
          Conecta Paw Friend con tus apps favoritas para no perderte ningún recordatorio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WhatsApp */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Recordatorios por WhatsApp</h3>
                <p className="text-xs text-muted-foreground">
                  Te enviamos un mensaje 1 día antes de cada vacuna o cita.
                </p>
              </div>
            </div>
            <Switch
              checked={whatsappOptedIn}
              onCheckedChange={setWhatsappOptedIn}
              disabled={whatsappSaving}
            />
          </div>

          {whatsappOptedIn && (
            <div className="space-y-2 pl-12">
              <Label htmlFor="wa-number" className="text-xs">
                Tu número de WhatsApp
              </Label>
              <div className="flex gap-2">
                <Input
                  id="wa-number"
                  type="tel"
                  placeholder="+569 1234 5678"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveWhatsApp} disabled={whatsappSaving} size="sm">
                  {whatsappSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Solo usamos tu número para mandarte recordatorios. Nunca compartimos tu información.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Google Calendar */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Google Calendar
                  {calendarConnected && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sincroniza recordatorios y citas con tu calendario de Google.
                </p>
                {calendarConnected && googleEmail && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cuenta: <span className="font-medium text-foreground">{googleEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pl-12 flex flex-wrap gap-2">
            {!calendarConnected ? (
              <Button onClick={handleConnectCalendar} disabled={connecting} size="sm">
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Conectar con Google
              </Button>
            ) : (
              <>
                <Button onClick={handleSyncCalendar} disabled={syncing} size="sm">
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar ahora
                </Button>
                <Button onClick={handleConnectCalendar} variant="outline" size="sm">
                  Cambiar cuenta
                </Button>
                <Button
                  onClick={handleDisconnectCalendar}
                  variant="outline"
                  size="sm"
                  disabled={disconnecting}
                  className="text-destructive hover:text-destructive"
                >
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>

          {!calendarConnected && (
            <div className="pl-12 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Al conectar, creamos un calendario llamado &ldquo;Paw Friend&rdquo; en tu Google con todos tus
                eventos. Podés desconectar cuando quieras.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
