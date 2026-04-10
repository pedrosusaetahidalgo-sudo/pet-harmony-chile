import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Loader2 } from "@/lib/icons";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SafetyLog {
  id: string;
  user_id: string;
  flag_type: string;
  detected_phrase: string | null;
  resources_provided: string[] | null;
  reviewed: boolean | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string | null;
}

export default function AdminSafetyLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-safety-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bereavement_safety_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SafetyLog[];
    },
  });

  const flagColors: Record<string, string> = {
    crisis: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="h-5 w-5" /> Logs de seguridad (Bereavement)
      </h2>
      <p className="text-sm text-muted-foreground">
        Registros de frases detectadas por el módulo memorial que activaron protocolos de seguridad.
      </p>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium">Sin alertas de seguridad</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {logs.map((log) => (
            <Card key={log.id} className={log.flag_type === "crisis" ? "border-red-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {log.flag_type === "crisis" ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Shield className="h-4 w-4 text-amber-500" />
                    )}
                    <Badge className={`text-xs ${flagColors[log.flag_type] || ""}`}>
                      {log.flag_type}
                    </Badge>
                    {log.reviewed && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" /> Revisado
                      </Badge>
                    )}
                  </div>
                  {log.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: es })}
                    </span>
                  )}
                </div>
                {log.detected_phrase && (
                  <p className="text-sm bg-muted/50 p-2 rounded text-muted-foreground italic">
                    "{log.detected_phrase}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  User: {log.user_id.slice(0, 8)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
