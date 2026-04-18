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
  useAdminPawCompanys,
  useDeletePawCompany,
  useUpsertPawCompany,
  type PawCompany,
  type PawCompanyInput,
  type PawCompanyTier,
} from '@/hooks/usePawCompanys';
import { Plus, Pencil, Trash2, Building2, ExternalLink, Sparkles, PawPrint } from '@/lib/icons';
import { formatCLP } from '@/lib/format';

const TIER_LABEL: Record<PawCompanyTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

const EMPTY: PawCompanyInput = {
  name: '',
  slug: '',
  logo_url: '',
  website: '',
  description: '',
  tier: 'bronze',
  monthly_clp: null,
  featured: false,
  is_active: true,
  started_at: null,
  notes: '',
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export default function AdminPawCompanys() {
  const { data, isLoading } = useAdminPawCompanys();
  const upsert = useUpsertPawCompany();
  const del = useDeletePawCompany();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PawCompany | null>(null);
  const [form, setForm] = useState<PawCompanyInput>(EMPTY);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function startEdit(company: PawCompany) {
    setEditing(company);
    setForm({
      name: company.name,
      slug: company.slug,
      logo_url: company.logo_url ?? '',
      website: company.website ?? '',
      description: company.description ?? '',
      tier: company.tier,
      monthly_clp: company.monthly_clp,
      featured: company.featured,
      is_active: company.is_active,
      started_at: company.started_at,
      notes: company.notes ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const slug = form.slug.trim() || slugify(form.name);
    if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug)) {
      toast.error('Slug inválido', {
        description: 'Solo minúsculas, números y guiones (3-64 chars).',
      });
      return;
    }
    const input: PawCompanyInput = {
      ...form,
      slug,
      logo_url: form.logo_url?.trim() || null,
      website: form.website?.trim() || null,
      description: form.description?.trim() || null,
      notes: form.notes?.trim() || null,
      started_at: form.started_at || null,
      monthly_clp: form.monthly_clp ?? null,
    };

    try {
      await upsert.mutateAsync({ id: editing?.id, input });
      toast.success(editing ? 'Sponsor actualizado' : 'Sponsor creado');
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('No se pudo guardar', { description: msg });
    }
  }

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id);
      toast.success('Sponsor eliminado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('No se pudo eliminar', { description: msg });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Paw Companys
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Sponsors empresariales visibles en <code>/donaciones</code>. Billing manual por ahora.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo sponsor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar sponsor' : 'Nuevo sponsor'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Nombre" required>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name: v,
                      slug: !editing && !f.slug ? slugify(v) : f.slug,
                    }));
                  }}
                  placeholder="Ej: Pet Shop Ñuñoa"
                  maxLength={80}
                />
              </Field>
              <Field label="Slug" hint="minúsculas, números y guiones. Se usa en la URL.">
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="pet-shop-nunoa"
                  maxLength={64}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tier">
                  <Select
                    value={form.tier}
                    onValueChange={(v) => setForm((f) => ({ ...f, tier: v as PawCompanyTier }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Mensual (CLP)">
                  <Input
                    type="number"
                    min={0}
                    max={10_000_000}
                    value={form.monthly_clp ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        monthly_clp: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder="49900"
                  />
                </Field>
              </div>
              <Field label="Logo URL">
                <Input
                  value={form.logo_url ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                />
              </Field>
              <Field label="Sitio web">
                <Input
                  value={form.website ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                />
              </Field>
              <Field label="Descripción (máx 280)">
                <Textarea
                  value={form.description ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value.slice(0, 280) }))
                  }
                  rows={3}
                  maxLength={280}
                  placeholder="Ej: Tienda de alimentos para perros y gatos en Ñuñoa."
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha inicio">
                  <Input
                    type="date"
                    value={form.started_at ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, started_at: e.target.value || null }))}
                  />
                </Field>
                <div className="flex items-end gap-4 pb-1">
                  <label htmlFor="pawco-active" className="flex items-center gap-2 text-sm">
                    <Switch
                      id="pawco-active"
                      checked={form.is_active ?? true}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                    />
                    Activo
                  </label>
                  <label htmlFor="pawco-featured" className="flex items-center gap-2 text-sm">
                    <Switch
                      id="pawco-featured"
                      checked={form.featured ?? false}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
                    />
                    Destacado
                  </label>
                </div>
              </div>
              <Field label="Notas internas (no públicas)">
                <Textarea
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Contacto, fecha de cobro, etc."
                />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={upsert.isPending}>
                {editing ? 'Guardar cambios' : 'Crear sponsor'}
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
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p>
              Aún no hay Paw Companys. Crea el primer sponsor para que aparezca en{' '}
              <code>/donaciones</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
              >
                {c.logo_url ? (
                  <img
                    src={c.logo_url}
                    alt={`Logo ${c.name}`}
                    className="h-10 w-10 rounded-md object-contain bg-white border shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm truncate">{c.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      <PawPrint className="h-3 w-3 mr-0.5" />
                      {TIER_LABEL[c.tier]}
                    </Badge>
                    {c.featured && <Badge className="text-[10px] bg-amber-500">Destacado</Badge>}
                    {!c.is_active && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.monthly_clp ? `${formatCLP(c.monthly_clp)}/mes · ` : ''}
                    {c.website ?? 'sin sitio'}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {c.website && (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-muted"
                      aria-label={`Abrir sitio de ${c.name}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => startEdit(c)}>
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
                        <AlertDialogTitle>¿Eliminar sponsor?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción elimina <b>{c.name}</b> permanentemente. Si solo quieres
                          ocultarlo, usa el switch de Activo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(c.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
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
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
