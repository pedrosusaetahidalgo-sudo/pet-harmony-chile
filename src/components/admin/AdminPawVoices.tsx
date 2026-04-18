import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  useAdminPawVoices,
  useDeletePawVoice,
  useUpsertPawVoice,
  type PawVoice,
  type PawVoiceStatus,
} from '@/hooks/usePawVoices';
import { Megaphone, Check, X, Sparkles, Trash2, ExternalLink, User } from '@/lib/icons';

const STATUS_LABEL: Record<PawVoiceStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  inactive: 'Inactivo',
  rejected: 'Rechazado',
};

const STATUS_COLOR: Record<PawVoiceStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  inactive: 'bg-slate-100 text-slate-700 border-slate-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export default function AdminPawVoices() {
  const { data, isLoading } = useAdminPawVoices();
  const upsert = useUpsertPawVoice();
  const del = useDeletePawVoice();

  const [filter, setFilter] = useState<PawVoiceStatus | 'all'>('all');

  const filtered =
    filter === 'all' ? (data ?? []) : (data ?? []).filter((v) => v.status === filter);

  const pendingCount = (data ?? []).filter((v) => v.status === 'pending').length;

  async function changeStatus(voice: PawVoice, newStatus: PawVoiceStatus) {
    try {
      await upsert.mutateAsync({
        id: voice.id,
        input: {
          name: voice.name,
          slug: voice.slug,
          handle: voice.handle,
          platform: voice.platform,
          profile_url: voice.profile_url,
          avatar_url: voice.avatar_url,
          bio: voice.bio,
          speciality: voice.speciality,
          followers_estimated: voice.followers_estimated,
          status: newStatus,
          featured: voice.featured,
          started_at:
            newStatus === 'active' && !voice.started_at
              ? new Date().toISOString().slice(0, 10)
              : voice.started_at,
          contact_email: voice.contact_email,
          notes: voice.notes,
        },
      });
      toast.success(`Voice ${STATUS_LABEL[newStatus].toLowerCase()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error('No se pudo actualizar', { description: msg });
    }
  }

  async function toggleFeatured(voice: PawVoice) {
    try {
      await upsert.mutateAsync({
        id: voice.id,
        input: {
          name: voice.name,
          slug: voice.slug,
          handle: voice.handle,
          platform: voice.platform,
          profile_url: voice.profile_url,
          avatar_url: voice.avatar_url,
          bio: voice.bio,
          speciality: voice.speciality,
          followers_estimated: voice.followers_estimated,
          status: voice.status,
          featured: !voice.featured,
          started_at: voice.started_at,
          contact_email: voice.contact_email,
          notes: voice.notes,
        },
      });
      toast.success(voice.featured ? 'Quitado de destacados' : 'Marcado como destacado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error('No se pudo actualizar', { description: msg });
    }
  }

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id);
      toast.success('Voice eliminado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error('No se pudo eliminar', { description: msg });
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-violet-500" />
              Paw Voices
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-white">{pendingCount} pendientes</Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Aplicaciones publicas de creadores. Aprueba para que aparezcan en{' '}
              <code>/paw-voices</code>.
            </p>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'pending', 'active', 'inactive', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="h-7 text-xs"
            >
              {f === 'all' ? 'Todos' : STATUS_LABEL[f]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center space-y-2">
            <Megaphone className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p>No hay Paw Voices en esta vista.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex-wrap"
              >
                {v.avatar_url ? (
                  <img
                    src={v.avatar_url}
                    alt={`Avatar ${v.name}`}
                    className="h-10 w-10 rounded-full object-cover bg-muted shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-violet-600" />
                  </div>
                )}

                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm truncate">{v.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[v.status]}`}>
                      {STATUS_LABEL[v.status]}
                    </Badge>
                    {v.featured && (
                      <Badge className="text-[10px] bg-amber-500">
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {v.platform}
                    {v.handle && ` · ${v.handle}`}
                    {v.followers_estimated &&
                      ` · ${v.followers_estimated.toLocaleString('es-CL')} seguidores`}
                  </div>
                  {v.contact_email && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      📧 {v.contact_email}
                    </div>
                  )}
                  {v.bio && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{v.bio}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                  {v.profile_url && (
                    <a
                      href={v.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-muted"
                      aria-label={`Abrir perfil de ${v.name}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  {v.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => changeStatus(v, 'active')}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => changeStatus(v, 'rejected')}
                      >
                        <X className="h-3.5 w-3.5" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {v.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => toggleFeatured(v)}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        {v.featured ? 'Quitar' : 'Destacar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => changeStatus(v, 'inactive')}
                      >
                        Inactivar
                      </Button>
                    </>
                  )}

                  {v.status === 'inactive' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => changeStatus(v, 'active')}
                    >
                      Reactivar
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar {v.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Elimina el registro permanentemente. Si solo quieres ocultarlo, usa
                          "Inactivar".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(v.id)}
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
