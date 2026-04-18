import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useAdminAdvertisements,
  useDeleteAdvertisement,
  useUpsertAdvertisement,
  type Advertisement,
  type AdvertisementInput,
  type AdPlacement,
} from '@/hooks/useAdvertisements';
import { Plus, Pencil, Trash2, ExternalLink, Megaphone } from '@/lib/icons';

const PLACEMENT_LABEL: Record<AdPlacement, string> = {
  home_feed: 'Home Feed',
  donations_page: '/donaciones',
  vet_directory: 'Directorio vets',
  maps: '/maps',
  feed_top: 'Feed top',
};

const EMPTY: AdvertisementInput = {
  title: '',
  description: '',
  image_url: '',
  target_url: '',
  placement: 'home_feed',
  partner_id: null,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  is_active: true,
  priority: 0,
  notes: '',
};

export default function AdminAdvertisements() {
  const { data, isLoading } = useAdminAdvertisements();
  const upsert = useUpsertAdvertisement();
  const del = useDeleteAdvertisement();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [form, setForm] = useState<AdvertisementInput>(EMPTY);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function startEdit(ad: Advertisement) {
    setEditing(ad);
    setForm({
      title: ad.title,
      description: ad.description ?? '',
      image_url: ad.image_url ?? '',
      target_url: ad.target_url,
      placement: ad.placement,
      partner_id: ad.partner_id,
      start_date: ad.start_date,
      end_date: ad.end_date,
      is_active: ad.is_active,
      priority: ad.priority,
      notes: ad.notes ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!/^https?:\/\//.test(form.target_url)) {
      toast.error('Target URL debe empezar con http:// o https://');
      return;
    }
    const input: AdvertisementInput = {
      ...form,
      description: form.description?.trim() || null,
      image_url: form.image_url?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    try {
      await upsert.mutateAsync({ id: editing?.id, input });
      toast.success(editing ? 'Ad actualizado' : 'Ad creado');
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error('No se pudo guardar', { description: msg });
    }
  }

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id);
      toast.success('Ad eliminado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error('No se pudo eliminar', { description: msg });
    }
  }

  function ctr(ad: Advertisement): string {
    if (ad.impressions_count === 0) return '—';
    return `${((ad.clicks_count / ad.impressions_count) * 100).toFixed(1)}%`;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-amber-500" />
            Publicidad
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Slots "Patrocinado" visibles en la app (SERNAC-compliant).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar aviso' : 'Nuevo aviso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Título" required>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 80) }))}
                  placeholder="Ej: Descuento en alimento Canis"
                  maxLength={80}
                />
              </Field>
              <Field label="Descripción (máx 200)">
                <Textarea
                  value={form.description ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value.slice(0, 200) }))
                  }
                  rows={2}
                  maxLength={200}
                  placeholder="Una línea que motive a hacer click"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Placement">
                  <Select
                    value={form.placement}
                    onValueChange={(v) => setForm((f) => ({ ...f, placement: v as AdPlacement }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PLACEMENT_LABEL) as AdPlacement[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PLACEMENT_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Prioridad (mayor gana)">
                  <Input
                    type="number"
                    value={form.priority ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                  />
                </Field>
              </div>
              <Field label="Target URL (click)" required>
                <Input
                  type="url"
                  value={form.target_url}
                  onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))}
                  placeholder="https://partner.com/landing"
                />
              </Field>
              <Field label="Image URL">
                <Input
                  type="url"
                  value={form.image_url ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Inicio" required>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  />
                </Field>
                <Field label="Fin" required>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  />
                </Field>
              </div>
              <label htmlFor="ad-active" className="flex items-center gap-2 text-sm">
                <Switch
                  id="ad-active"
                  checked={form.is_active ?? true}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                Activo
              </label>
              <Field label="Notas internas">
                <Textarea
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Cliente, acuerdo, precio, etc."
                />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={upsert.isPending}>
                {editing ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Cargando…</div>
        ) : !data || data.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center space-y-2">
            <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p>No hay avisos. Crea uno para probar el slot.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((ad) => (
              <div
                key={ad.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex-wrap"
              >
                {ad.image_url ? (
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="h-12 w-12 rounded-md object-cover bg-muted shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-slate-200 dark:bg-slate-800 shrink-0" />
                )}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm truncate">{ad.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {PLACEMENT_LABEL[ad.placement]}
                    </Badge>
                    {!ad.is_active && (
                      <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {ad.start_date} → {ad.end_date} · prioridad {ad.priority}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    👁️ {ad.impressions_count} impresiones · 🔗 {ad.clicks_count} clicks · CTR{' '}
                    {ctr(ad)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={ad.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted"
                    aria-label={`Abrir ${ad.title}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(ad)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este aviso?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Lo elimina permanentemente. Si solo quieres pausarlo, usa el switch
                          "Activo".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ad.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
