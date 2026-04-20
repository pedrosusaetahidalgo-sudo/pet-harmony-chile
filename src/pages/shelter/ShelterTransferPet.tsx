/**
 * Flujo de transferencia de una mascota del refugio al nuevo adoptante.
 *
 * MVP (2026-04-20):
 * - Shelter marca la mascota como adoptada (shelter_adopted_at = now()).
 * - Setea pending_owner_email + owner_invitation_token (si no existia).
 * - Muestra un link copiable al refugio, que puede compartir via WhatsApp
 *   o cualquier canal manual.
 * - Si RESEND_API_KEY esta disponible en el backend, tambien llama a la
 *   edge function send-pet-invitation para enviar el email automatico.
 *   Esto requiere que la edge fn se actualice para aceptar shelters.
 *   Mientras tanto, el link manual siempre funciona.
 *
 * Cuando el adoptante abre el link:
 * - Si tiene cuenta con el email, la mascota aparece en /my-pets (auto-claim
 *   por useAutoClaimByEmail existente).
 * - Si no tiene cuenta, se registra y reclama.
 * - Ficha medica completa + timeline + Paw Card pasan intactas.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useShelter } from '@/hooks/useShelter';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Copy,
  Heart,
  Loader2,
  MessageCircle,
  PawPrint,
  Share2,
  CheckCircle2,
} from 'lucide-react';

interface TransferPet {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  photo_url: string | null;
  created_by_shelter_id: string | null;
  owner_id: string | null;
  pending_owner_email: string | null;
  owner_invitation_token: string | null;
  shelter_adopted_at: string | null;
}

function buildInviteLink(token: string): string {
  // El hook useClaimPetInvitation procesa ?invitation=TOKEN en /home y /my-pets.
  // Mandamos al usuario a /home para que si ya tiene cuenta, el reclamo sea
  // inmediato; si no la tiene, ProtectedRoute lo envia a /auth?returnTo=...
  return `${window.location.origin}/home?invitation=${token}`;
}

export default function ShelterTransferPet() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { shelter, isLoading: shelterLoading } = useShelter();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const { data: pet, isLoading } = useQuery<TransferPet | null>({
    queryKey: ['shelter-transfer-pet', petId],
    queryFn: async () => {
      if (!petId) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('pets') as any)
        .select(
          'id, name, species, breed, photo_url, created_by_shelter_id, owner_id, pending_owner_email, owner_invitation_token, shelter_adopted_at'
        )
        .eq('id', petId)
        .maybeSingle();
      return (data as unknown as TransferPet) || null;
    },
    enabled: !!petId,
  });

  const isOwnPet = pet?.created_by_shelter_id === shelter?.id;
  const isAlreadyAdopted = !!pet?.shelter_adopted_at || !!pet?.owner_id;

  const handleConfirm = async () => {
    if (!pet || !shelter) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Email invalido');
      return;
    }
    setSubmitting(true);
    try {
      const token = pet.owner_invitation_token || crypto.randomUUID();
      const { error } = await supabase
        .from('pets')
        .update({
          pending_owner_email: email.trim(),
          owner_invitation_token: token,
          owner_invitation_sent_at: new Date().toISOString(),
          shelter_adopted_at: new Date().toISOString(),
        })
        .eq('id', pet.id);
      if (error) throw error;

      // Best-effort: intentar enviar el email automatico via edge fn.
      // Si la edge fn aun no soporta shelters, la request fallara silenciosamente
      // y el refugio usa el link manual.
      try {
        await supabase.functions.invoke('send-pet-invitation', {
          body: { pet_id: pet.id },
        });
      } catch {
        // Silent: queda el link manual.
      }

      setInviteLink(buildInviteLink(token));
      setConfirmed(true);
      await queryClient.invalidateQueries({ queryKey: ['shelter'] });
      await queryClient.invalidateQueries({ queryKey: ['shelter-pets'] });
      toast.success('Mascota marcada como adoptada. Comparte el link con el adoptante.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo completar la transferencia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Link copiado');
    } catch {
      toast.error('No se pudo copiar. Copia el texto manualmente.');
    }
  };

  const handleWhatsApp = () => {
    if (!inviteLink || !pet) return;
    const msg = `Hola! Quiero entregarte la ficha de ${pet.name} en Paw Friend. Abre este link para reclamarla: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (shelterLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!pet || !isOwnPet) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Mascota no encontrada" onBack={() => navigate('/shelter/pets')} />
        <div className="container max-w-lg mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <PawPrint className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Esta mascota no existe o no pertenece a tu refugio.
              </p>
              <Button onClick={() => navigate('/shelter/pets')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`Entregar ${pet.name}`}
        subtitle="Transferir ficha al nuevo dueno"
        onBack={() => navigate('/shelter/pets')}
      />
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
                {pet.photo_url ? (
                  <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <PawPrint className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{pet.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </p>
                {isAlreadyAdopted && (
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    <Heart className="h-2.5 w-2.5 mr-1" /> Ya transferida
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!confirmed ? (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Vamos a enviar el acceso a{' '}
                  <span className="font-semibold text-foreground">la ficha completa</span> de{' '}
                  {pet.name}: historial medico, vacunas, fotos y todo lo que cargaste.
                </p>
                <p>
                  Cuando el adoptante abra el link, la mascota aparece en su cuenta de Paw Friend.
                  No parte desde cero.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Email del adoptante *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adoptante@ejemplo.cl"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={submitting || !email || isAlreadyAdopted}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Transfiriendo
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-1" /> Marcar como adoptada y generar link
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">¡Listo!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Comparte este link con el adoptante. Cuando lo abra, recibe la ficha completa.
                Tambien le enviamos un email (si el sistema esta activo).
              </p>

              <div className="space-y-1.5">
                <Label>Link de acceso</Label>
                <div className="flex gap-2">
                  <Input readOnly value={inviteLink || ''} className="font-mono text-xs" />
                  <Button variant="outline" onClick={handleCopy} size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleWhatsApp}>
                  <MessageCircle className="h-4 w-4 mr-1" /> Enviar por WhatsApp
                </Button>
                <Button className="flex-1" onClick={() => navigate('/shelter/pets')}>
                  Volver a mis mascotas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
