import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  AlertTriangle,
} from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Partner = Tables<'partners'>;
type PartnerInsert = TablesInsert<'partners'>;
type PartnerUpdate = TablesUpdate<'partners'>;

const PLACEMENT_COLORS: Record<string, string> = {
  home: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  services: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  map: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  content: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  feed: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  insurance: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  clinic: 'bg-red-500/20 text-red-300 border-red-500/30',
  store: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  adoption: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  general: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const AdManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    ad_text: '',
    ad_image_url: '',
    ad_link: '',
    placement: 'home',
    category: 'general',
    is_active: true,
    priority: 0,
    start_date: '',
    end_date: '',
  });

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PartnerInsert) => {
      const { error } = await supabase.from('partners').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast('Anuncio creado exitosamente');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      // Sprint 1 P2 LOC-MICROCOPY: copy especifico por accion en vez de generico.
      toast.error('No pudimos crear el anuncio', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartnerUpdate }) => {
      const { error } = await supabase.from('partners').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast('Anuncio actualizado exitosamente');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast.error('No pudimos actualizar el anuncio', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast('Anuncio eliminado exitosamente');
      setDeleteTarget(null);
    },
    onError: (error: unknown) => {
      toast.error('No pudimos eliminar el anuncio', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
      setDeleteTarget(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('partners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });

  const resetForm = () => {
    setFormData({
      brand_name: '',
      ad_text: '',
      ad_image_url: '',
      ad_link: '',
      placement: 'home',
      category: 'general',
      is_active: true,
      priority: 0,
      start_date: '',
      end_date: '',
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: Partner) => {
    setEditingAd(ad);
    setFormData({
      brand_name: ad.brand_name,
      ad_text: ad.ad_text,
      ad_image_url: ad.ad_image_url || '',
      ad_link: ad.ad_link,
      placement: ad.placement,
      category: ad.category,
      is_active: ad.is_active,
      priority: ad.priority || 0,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
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
    if (impressions === 0) return '0.00';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-3xl tracking-tight text-white">
            Gestión de Anuncios
          </h2>
          <p className="text-slate-400">Administra los anuncios y socios estrategicos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Anuncio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingAd ? 'Editar Anuncio' : 'Nuevo Anuncio'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Crea o edita un anuncio para mostrar en la plataforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre de la Marca *</Label>
                  <Input
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    placeholder="Ej: PetFood Chile"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Prioridad</Label>
                  <Input
                    className="bg-slate-800 border-slate-700 text-white"
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
                <Label className="text-slate-300">Texto del Anuncio *</Label>
                <Textarea
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  value={formData.ad_text}
                  onChange={(e) => setFormData({ ...formData, ad_text: e.target.value })}
                  placeholder="Descripcion breve del anuncio..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">URL de la Imagen</Label>
                <Input
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  value={formData.ad_image_url}
                  onChange={(e) => setFormData({ ...formData, ad_image_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Enlace del Anuncio *</Label>
                <Input
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  value={formData.ad_link}
                  onChange={(e) => setFormData({ ...formData, ad_link: e.target.value })}
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Ubicacion *</Label>
                  <Select
                    value={formData.placement}
                    onValueChange={(value) => setFormData({ ...formData, placement: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="home">Inicio</SelectItem>
                      <SelectItem value="services">Servicios</SelectItem>
                      <SelectItem value="map">Mapa</SelectItem>
                      <SelectItem value="content">Contenido</SelectItem>
                      <SelectItem value="feed">Feed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="food">Alimentos</SelectItem>
                      <SelectItem value="insurance">Seguros</SelectItem>
                      <SelectItem value="clinic">Clinicas</SelectItem>
                      <SelectItem value="store">Tiendas</SelectItem>
                      <SelectItem value="adoption">Adopcion</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Fecha de Inicio (opcional)</Label>
                  <Input
                    className="bg-slate-800 border-slate-700 text-white"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Fecha de Fin (opcional)</Label>
                  <Input
                    className="bg-slate-800 border-slate-700 text-white"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-800"
                  aria-label="Activo"
                />
                <Label htmlFor="is_active" className="text-slate-300">
                  Activo
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingAd ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {partners?.map((partner) => (
          <Card key={partner.id} className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-white">{partner.brand_name}</h3>
                    <Badge
                      className={
                        partner.is_active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }
                    >
                      {partner.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge
                      className={`text-xs border ${PLACEMENT_COLORS[partner.placement] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}
                    >
                      {partner.placement}
                    </Badge>
                    <Badge
                      className={`text-xs border ${CATEGORY_COLORS[partner.category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}
                    >
                      {partner.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{partner.ad_text}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-slate-500" />
                      <span className="font-mono text-slate-300">
                        {(partner.impressions || 0).toLocaleString('es-CL')}
                      </span>
                      <span className="text-slate-500 text-xs">imp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-slate-500" />
                      <span className="font-mono text-slate-300">
                        {(partner.clicks || 0).toLocaleString('es-CL')}
                      </span>
                      <span className="text-slate-500 text-xs">clics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-slate-500" />
                      <span className="font-mono text-amber-300">
                        {getCTR(partner.impressions || 0, partner.clicks || 0)}%
                      </span>
                      <span className="text-slate-500 text-xs">CTR</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => handleEdit(partner)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        id: partner.id,
                        is_active: !partner.is_active,
                      })
                    }
                  >
                    {partner.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => setDeleteTarget(partner)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {partners?.length === 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-slate-400">No hay anuncios creados aun</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Confirmar eliminacion
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Estas seguro de eliminar el anuncio{' '}
              <strong className="text-white">{deleteTarget?.brand_name}</strong>? Esta accion no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdManagement;
