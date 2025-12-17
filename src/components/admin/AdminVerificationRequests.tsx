import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, FileText, ExternalLink } from "lucide-react";
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

const roleLabels: Record<string, string> = {
  dog_walker: "Paseador",
  dog_sitter: "Cuidador",
  vet: "Veterinario",
  trainer: "Entrenador",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

const AdminVerificationRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-verification-requests"],
    queryFn: async () => {
      const { data: requestsData, error } = await supabase
        .from("verification_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      return requestsData?.map(r => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || null
      })) || [];
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("verification_requests")
        .update({ 
          status, 
          notes: notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", id);
      if (error) throw error;

      // If approved, add the role to the user
      if (status === "approved" && selectedRequest) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ 
            user_id: selectedRequest.user_id, 
            role: selectedRequest.requested_role 
          });
        if (roleError && !roleError.message.includes("duplicate")) throw roleError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] });
      toast.success(variables.status === "approved" ? "Solicitud aprobada" : "Solicitud rechazada");
      setSelectedRequest(null);
      setRejectionNotes("");
    },
    onError: () => {
      toast.error("Error al procesar solicitud");
    },
  });

  const pendingCount = requests?.filter(r => r.status === "pending").length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Solicitudes de Verificación
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
        ) : !requests || requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay solicitudes de verificación</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol Solicitado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.profiles?.display_name || "Sin nombre"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {roleLabels[request.requested_role] || request.requested_role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[request.status]?.variant || "secondary"}>
                      {statusLabels[request.status]?.label || request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleDateString("es-CL")}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedRequest(request);
                            updateRequestMutation.mutate({ id: request.id, status: "approved" });
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedRequest(request)}
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

        <Dialog open={!!selectedRequest} onOpenChange={() => {
          setSelectedRequest(null);
          setRejectionNotes("");
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Solicitud</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">{selectedRequest.profiles?.display_name || "Sin nombre"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rol Solicitado</p>
                    <Badge>{roleLabels[selectedRequest.requested_role] || selectedRequest.requested_role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge variant={statusLabels[selectedRequest.status]?.variant}>
                      {statusLabels[selectedRequest.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de solicitud</p>
                    <p>{new Date(selectedRequest.created_at).toLocaleString("es-CL")}</p>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas del solicitante</p>
                    <p className="bg-muted p-2 rounded">{selectedRequest.notes}</p>
                  </div>
                )}

                {selectedRequest.document_urls && selectedRequest.document_urls.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Documentos adjuntos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.document_urls.map((url: string, index: number) => (
                        <Button key={index} variant="outline" size="sm" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-1" />
                            Documento {index + 1}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notas de rechazo (opcional)</p>
                    <Textarea
                      placeholder="Motivo del rechazo..."
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            {selectedRequest?.status === "pending" && (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => updateRequestMutation.mutate({ 
                    id: selectedRequest.id, 
                    status: "rejected",
                    notes: rejectionNotes 
                  })}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => updateRequestMutation.mutate({ 
                    id: selectedRequest.id, 
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

export default AdminVerificationRequests;
