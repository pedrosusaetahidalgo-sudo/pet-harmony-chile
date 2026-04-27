/**
 * AdminB2BApiKeys — gestion de API keys del programa B2B (Refactor §7.5).
 *
 * Permite a Pedro crear/listar/revocar keys sin abrir SQL Editor.
 * Cuando se cierra primer deal con cliente B2B, en 30 segundos genera
 * la key, copia plain text y se la entrega por canal seguro.
 *
 * Diseño:
 *   - Lista keys ordenadas por last_used_at DESC
 *   - "Nueva key" abre dialog con form (name, email, tier, notes)
 *   - Submit llama RPC create_b2b_api_key → muestra plain_key UNA SOLA VEZ
 *     en un Alert con copy-to-clipboard. Al cerrar, plain_key se pierde.
 *   - Boton "Revocar" en cada row (set is_active=false)
 *   - Filtro: activas / revocadas / todas
 *
 * Privacy: la plain_key solo se ve UNA VEZ. Si Pedro pierde el chat
 * con el cliente, hay que crear key nueva — no se puede recuperar.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Key, Plus, Copy, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface ApiKeyRow {
  id: string;
  key_prefix: string;
  name: string;
  contact_email: string;
  tier: string;
  scopes: string[];
  rate_limit_per_hour: number;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  total_requests: number;
  created_at: string;
  notes: string | null;
}

const TIER_BADGES: Record<string, string> = {
  free: 'bg-slate-200 text-slate-700',
  research: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

export default function AdminB2BApiKeys() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'active' | 'revoked' | 'all'>('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<{ plain: string; name: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTier, setFormTier] = useState('free');
  const [formNotes, setFormNotes] = useState('');

  const { data: keys = [], isLoading } = useQuery<ApiKeyRow[]>({
    queryKey: ['admin-b2b-api-keys', filter],
    staleTime: 30_000,
    queryFn: async () => {
      let query = sb
        .from('b2b_api_keys')
        .select(
          'id, key_prefix, name, contact_email, tier, scopes, rate_limit_per_hour, is_active, expires_at, last_used_at, total_requests, created_at, notes'
        )
        .order('last_used_at', { ascending: false, nullsFirst: false });

      if (filter === 'active') query = query.eq('is_active', true);
      if (filter === 'revoked') query = query.eq('is_active', false);

      const { data, error } = await query;
      if (error) {
        console.warn('[AdminB2BApiKeys] query error', error);
        return [];
      }
      return (data ?? []) as ApiKeyRow[];
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      if (!formName.trim() || !formEmail.trim()) {
        throw new Error('Nombre y email son obligatorios');
      }
      const { data, error } = await sb.rpc('create_b2b_api_key', {
        p_name: formName.trim(),
        p_contact_email: formEmail.trim(),
        p_tier: formTier,
        p_rate_limit: null,
        p_scopes: null,
        p_expires_at: null,
        p_notes: formNotes.trim() || null,
      });
      if (error) throw error;
      const row = (data as { plain_key: string }[])[0];
      if (!row?.plain_key) throw new Error('No se devolvio plain_key');
      return { plain: row.plain_key, name: formName.trim() };
    },
    onSuccess: (result) => {
      setNewKey(result);
      setCreateOpen(false);
      setFormName('');
      setFormEmail('');
      setFormTier('free');
      setFormNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-b2b-api-keys'] });
    },
    onError: (err) => {
      toast.error(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await sb.from('b2b_api_keys').update({ is_active: false }).eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Key revocada');
      queryClient.invalidateQueries({ queryKey: ['admin-b2b-api-keys'] });
    },
  });

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-4 w-4" /> API B2B Keys
          </h2>
          <p className="text-xs text-muted-foreground">
            Refactor Maestro §7.5. Genera keys para clientes B2B (vets grandes, aseguradoras, ONGs,
            universidades). Documentacion: docs-raiz/B2B_API_V1.md
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="revoked">Revocadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Nueva key
          </Button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            No hay keys {filter === 'active' ? 'activas' : filter === 'revoked' ? 'revocadas' : ''}{' '}
            todavia. La primera deberia crearse cuando se cierre primer deal B2B.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <Card key={key.id} className={key.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{key.name}</p>
                    <Badge variant="outline" className={TIER_BADGES[key.tier] ?? ''}>
                      {key.tier}
                    </Badge>
                    {!key.is_active && (
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        Revocada
                      </Badge>
                    )}
                    {key.expires_at && new Date(key.expires_at) < new Date() && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700">
                        Expirada
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{key.key_prefix}</p>
                  <div className="flex gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>{key.contact_email}</span>
                    <span>•</span>
                    <span>{key.rate_limit_per_hour}/h</span>
                    <span>•</span>
                    <span>{key.total_requests} requests</span>
                    <span>•</span>
                    <span>
                      {key.last_used_at
                        ? `Ultimo uso ${formatDistanceToNow(new Date(key.last_used_at), { locale: es, addSuffix: true })}`
                        : 'Nunca usada'}
                    </span>
                  </div>
                  {key.notes && (
                    <p className="text-[11px] italic text-muted-foreground mt-1">{key.notes}</p>
                  )}
                </div>
                {key.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Revocar la key de "${key.name}"? El cliente perdera acceso inmediatamente.`
                        )
                      ) {
                        revokeKey.mutate(key.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Revocar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva API key B2B</DialogTitle>
            <DialogDescription>
              La plain key se mostrara UNA SOLA VEZ. Copiala y enviala al cliente por canal seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="b2b-key-name">Nombre identificador</Label>
              <Input
                id="b2b-key-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Mapfre Pet — research"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b2b-key-email">Email contacto cliente</Label>
              <Input
                id="b2b-key-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="partner@mapfre.cl"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b2b-key-tier">Tier</Label>
              <Select value={formTier} onValueChange={setFormTier}>
                <SelectTrigger id="b2b-key-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">free — 100/h, breed_stats</SelectItem>
                  <SelectItem value="research">research — 1000/h, +species_stats</SelectItem>
                  <SelectItem value="enterprise">enterprise — 10000/h, +risk_score</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="b2b-key-notes">Notas internas (opcional)</Label>
              <Textarea
                id="b2b-key-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Cerrado por Pedro 2026-XX-XX. Deal $X/mes."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createKey.mutate()} disabled={createKey.isPending}>
              {createKey.isPending ? 'Creando...' : 'Crear key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog mostrando plain key (una sola vez) */}
      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Copia esto AHORA
            </DialogTitle>
            <DialogDescription>
              Esta es la unica vez que vas a ver la plain key de "{newKey?.name}". Despues de cerrar
              este dialog se pierde.
            </DialogDescription>
          </DialogHeader>
          <Card className="bg-slate-50">
            <CardContent className="p-3">
              <p className="font-mono text-xs break-all">{newKey?.plain}</p>
            </CardContent>
          </Card>
          <DialogFooter>
            <Button onClick={() => newKey && handleCopy(newKey.plain)} className="gap-1">
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
            <Button variant="outline" onClick={() => setNewKey(null)}>
              Cerrar (perder key)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
