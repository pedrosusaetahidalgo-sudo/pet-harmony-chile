import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, Image } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

const serviceTypeLabels: Record<string, string> = {
  dog_walker: "Paseo",
  dog_sitter: "Cuidado",
  vet: "Veterinario",
  trainer: "Entrenamiento",
  grooming: "Peluquería",
  other: "Otro",
};

const AdminServicePromotions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["admin-service-promotions"],
    queryFn: async () => {
      const { data: promotionsData, error } = await supabase
        .from("service_promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(promotionsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      return promotionsData?.map(p => ({
        ...p,
        profiles: profilesMap.get(p.user_id) || null
      })) || [];
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      const { error } = await supabase
        .from("service_promotions")
        .update({ 
          status, 
          rejection_reason: rejectionReason || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-promotions"] });
      toast.success(variables.status === "approved" ? "Promoción aprobada" : "Promoción rechazada");
      setSelectedPromotion(null);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Error al procesar promoción");
    },
  });

  const pendingCount = promotions?.filter(p => p.status === "pending").length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Promociones de Servicios
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pendientes</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !promotions || promotions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay promociones</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {promotion.title}
                  </TableCell>
                  <TableCell>
                    {promotion.profiles?.display_name || "Sin nombre"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {serviceTypeLabels[promotion.service_type] || promotion.service_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[promotion.status]?.variant || "secondary"}>
                      {statusLabels[promotion.status]?.label || promotion.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(promotion.created_at).toLocaleDateString("es-CL")}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPromotion(promotion)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {promotion.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updatePromotionMutation.mutate({ id: promotion.id, status: "approved" })}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedPromotion(promotion)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!selectedPromotion} onOpenChange={() => {
          setSelectedPromotion(null);
          setRejectionReason("");
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Promoción</DialogTitle>
            </DialogHeader>
            {selectedPromotion && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Título</p>
                    <p className="font-medium">{selectedPromotion.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">{selectedPromotion.profiles?.display_name || "Sin nombre"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Servicio</p>
                    <Badge>{serviceTypeLabels[selectedPromotion.service_type] || selectedPromotion.service_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={statusLabels[selectedPromotion.status]?.variant}>
                      {statusLabels[selectedPromotion.status]?.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="bg-muted p-3 rounded">{selectedPromotion.description}</p>
                </div>

                {selectedPromotion.images && selectedPromotion.images.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Imágenes</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedPromotion.images.map((url: string, index: number) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Imagen ${index + 1}`} className="w-full h-24 object-cover rounded" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPromotion.ai_moderation_score && (
                  <div>
                    <p className="text-sm text-muted-foreground">Puntuación AI</p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedPromotion.ai_moderation_score, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedPromotion.rejection_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motivo de rechazo</p>
                    <p className="bg-destructive/10 text-destructive p-2 rounded">{selectedPromotion.rejection_reason}</p>
                  </div>
                )}

                {selectedPromotion.status === "pending" && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Motivo de rechazo (opcional)</p>
                    <Textarea
                      placeholder="Escribe el motivo del rechazo..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            {selectedPromotion?.status === "pending" && (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => updatePromotionMutation.mutate({ 
                    id: selectedPromotion.id, 
                    status: "rejected",
                    rejectionReason 
                  })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => updatePromotionMutation.mutate({ 
                    id: selectedPromotion.id, 
                    status: "approved" 
                  })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminServicePromotions;
