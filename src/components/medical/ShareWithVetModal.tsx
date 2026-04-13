import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCreatePetVetLink } from '@/hooks/usePetVetLinks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Send, Loader2, Link2 } from '@/lib/icons';

interface DirectoryVet {
  id: string;
  slug: string | null;
  display_name: string;
  comuna: string | null;
  specialty: string | null;
  avatar_url: string | null;
}

interface ShareWithVetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  petName: string;
  onFallbackToLink?: () => void;
}

export function ShareWithVetModal({
  open,
  onOpenChange,
  petId,
  petName,
  onFallbackToLink,
}: ShareWithVetModalProps) {
  const [search, setSearch] = useState('');
  const [vets, setVets] = useState<DirectoryVet[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const createLink = useCreatePetVetLink();

  // Load vets from directory
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: providers } = await supabase
        .from('service_providers')
        .select('id, slug, user_id, is_directory_visible, commune, specialties')
        .eq('is_directory_visible', true)
        .limit(100);
      if (!providers || providers.length === 0) {
        if (!cancelled) {
          setVets([]);
          setLoading(false);
        }
        return;
      }
      const userIds = Array.from(
        new Set(providers.map((p: { user_id: string | null }) => p.user_id).filter(Boolean))
      );
      const { data: profiles } = userIds.length
        ? await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds as string[])
        : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };
      const map = new Map(
        (profiles || []).map((p) => [
          p.id,
          { name: p.display_name || 'Veterinario/a', avatar: p.avatar_url },
        ])
      );
      const merged: DirectoryVet[] = providers.map(
        (p: {
          id: string;
          slug: string | null;
          user_id: string | null;
          commune: string | null;
          specialties: string[] | null;
        }) => {
          const profile = p.user_id ? map.get(p.user_id) : null;
          return {
            id: p.id,
            slug: p.slug,
            display_name: profile?.name || 'Veterinario/a',
            comuna: p.commune,
            specialty: p.specialties?.[0] ?? null,
            avatar_url: profile?.avatar || null,
          };
        }
      );
      if (!cancelled) {
        setVets(merged);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = search.trim()
    ? vets.filter((v) => {
        const q = search.toLowerCase();
        return (
          v.display_name.toLowerCase().includes(q) ||
          (v.comuna && v.comuna.toLowerCase().includes(q)) ||
          (v.specialty && v.specialty.toLowerCase().includes(q))
        );
      })
    : vets;

  const handleSend = async (providerId: string) => {
    try {
      await createLink.mutateAsync({
        petId,
        providerId,
        message: message.trim() || undefined,
      });
      onOpenChange(false);
      setSearch('');
      setMessage('');
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartir ficha de {petName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar veterinario por nombre o comuna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Optional message */}
          <div className="space-y-1.5">
            <Label className="text-xs">Mensaje opcional</Label>
            <Textarea
              placeholder="Ej: Control anual, necesito revisar vacunas..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {search.trim()
                  ? 'No se encontraron veterinarios con ese nombre.'
                  : 'No hay veterinarios disponibles en el directorio.'}
              </p>
            ) : (
              filtered.map((vet) => (
                <div
                  key={vet.id}
                  className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-muted/40 hover:bg-muted/30 transition"
                >
                  <Avatar className="h-10 w-10">
                    {vet.avatar_url ? (
                      <AvatarImage src={vet.avatar_url} alt={vet.display_name} />
                    ) : null}
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                      {vet.display_name[0]?.toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{vet.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[vet.comuna, vet.specialty].filter(Boolean).join(' · ') || 'Veterinario/a'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="flex-shrink-0"
                    disabled={createLink.isPending}
                    onClick={() => handleSend(vet.id)}
                  >
                    {createLink.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Fallback to public link */}
          {onFallbackToLink && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                ¿Compartir con alguien que no esta en Paw Friend?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onFallbackToLink();
                }}
              >
                <Link2 className="h-3.5 w-3.5 mr-1" />
                Generar enlace publico
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
