import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  MousePointerClick,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [formData, setFormData] = useState({
    brand_name: "",
    ad_text: "",
    ad_image_url: "",
    ad_link: "",
    placement: "home",
    category: "general",
    is_active: true,
    priority: 0,
    start_date: "",
    end_date: "",
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("partners").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Anuncio creado exitosamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("partners")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Anuncio actualizado exitosamente" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Anuncio eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("partners")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });

  const resetForm = () => {
    setFormData({
      brand_name: "",
      ad_text: "",
      ad_image_url: "",
      ad_link: "",
      placement: "home",
      category: "general",
      is_active: true,
      priority: 0,
      start_date: "",
      end_date: "",
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: any) => {
    setEditingAd(ad);
    setFormData({
      brand_name: ad.brand_name,
      ad_text: ad.ad_text,
      ad_image_url: ad.ad_image_url || "",
      ad_link: ad.ad_link,
      placement: ad.placement,
      category: ad.category,
      is_active: ad.is_active,
      priority: ad.priority || 0,
      start_date: ad.start_date ? ad.start_date.split("T")[0] : "",
      end_date: ad.end_date ? ad.end_date.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      priority: parseInt(formData.priority.toString()) || 0,
    };

    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return "0.00";
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Anuncios</h2>
          <p className="text-muted-foreground">
            Administra los anuncios y socios estratégicos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Anuncio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? "Editar Anuncio" : "Nuevo Anuncio"}
              </DialogTitle>
              <DialogDescription>
                Crea o edita un anuncio para mostrar en la plataforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Marca *</Label>
                  <Input
                    value={formData.brand_name}
                    onChange={(e) =>
                      setFormData({ ...formData, brand_name: e.target.value })
                    }
                    placeholder="Ej: PetFood Chile"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto del Anuncio *</Label>
                <Textarea
                  value={formData.ad_text}
                  onChange={(e) =>
                    setFormData({ ...formData, ad_text: e.target.value })
                  }
                  placeholder="Descripción breve del anuncio..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>URL de la Imagen</Label>
                <Input
                  value={formData.ad_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, ad_image_url: e.target.value })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Enlace del Anuncio *</Label>
                <Input
                  value={formData.ad_link}
                  onChange={(e) =>
                    setFormData({ ...formData, ad_link: e.target.value })
                  }
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ubicación *</Label>
                  <Select
                    value={formData.placement}
                    onValueChange={(value) =>
                      setFormData({ ...formData, placement: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Inicio</SelectItem>
                      <SelectItem value="services">Servicios</SelectItem>
                      <SelectItem value="map">Mapa</SelectItem>
                      <SelectItem value="content">Contenido</SelectItem>
                      <SelectItem value="feed">Feed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Alimentos</SelectItem>
                      <SelectItem value="insurance">Seguros</SelectItem>
                      <SelectItem value="clinic">Clínicas</SelectItem>
                      <SelectItem value="store">Tiendas</SelectItem>
                      <SelectItem value="adoption">Adopción</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Inicio (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Fin (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingAd ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {partners?.map((partner) => (
          <Card key={partner.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{partner.brand_name}</h3>
                    <Badge
                      variant={partner.is_active ? "default" : "secondary"}
                    >
                      {partner.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline">{partner.placement}</Badge>
                    <Badge variant="outline">{partner.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {partner.ad_text}
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{partner.impressions || 0} impresiones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                      <span>{partner.clicks || 0} clics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>
                        CTR: {getCTR(partner.impressions || 0, partner.clicks || 0)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(partner)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        id: partner.id,
                        is_active: !partner.is_active,
                      })
                    }
                  >
                    {partner.is_active ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          "¿Estás seguro de eliminar este anuncio?"
                        )
                      ) {
                        deleteMutation.mutate(partner.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {partners?.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">
                No hay anuncios creados aún
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdManagement;

