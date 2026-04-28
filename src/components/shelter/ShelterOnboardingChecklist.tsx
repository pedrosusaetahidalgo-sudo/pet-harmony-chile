/**
 * Checklist de onboarding visible la primera vez que un refugio entra a su dashboard.
 *
 * 4 pasos guiados:
 *   1. Subí tus primeras mascotas
 *   2. Compartí el link de tu perfil público
 *   3. Recibí interesados de adoptantes
 *   4. Transferí mascotas con un click
 *
 * Cuando el shelter cierra el checklist (o cumple el último paso), se setea
 * adoption_centers.onboarding_completed_at y deja de aparecer.
 *
 * Ver REFACTOR_ADOPCION_2026_04_24.md §3.4.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Share2,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';

interface ShelterOnboardingChecklistProps {
  shelterId: string;
  shelterSlug: string | null;
  petsCount: number;
}

export function ShelterOnboardingChecklist({
  shelterId,
  shelterSlug,
  petsCount,
}: ShelterOnboardingChecklistProps) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const { mutate: completeOnboarding, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('adoption_centers' as any)
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', shelterId);
      if (error) throw error;
    },
    onSuccess: () => {
      trackRefactor(RefactorEvent.shelterOnboardingCompleted, { pets_count: petsCount });
      queryClient.invalidateQueries({ queryKey: ['shelter'] });
      toast.success('¡Listo! Cualquier duda, escribínos a pawfriendcl@gmail.com');
    },
  });

  const profileUrl = shelterSlug ? `${window.location.origin}/refugios/${shelterSlug}` : null;

  const copyProfileLink = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    toast.success('Link copiado al portapapeles');
  };

  const hasPets = petsCount > 0;

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Bienvenido a Paw Friend Refugios</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0"
              aria-label={collapsed ? 'Expandir' : 'Colapsar'}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => completeOnboarding()}
              disabled={isPending}
              className="h-8 w-8 p-0"
              aria-label="Cerrar guía"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!collapsed && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Cuatro pasos para arrancar. Ve completando a tu ritmo.
            </p>

            <ol className="space-y-3">
              <ChecklistItem
                step={1}
                done={hasPets}
                title="Sube tus primeras mascotas"
                description={
                  hasPets
                    ? `Tienes ${petsCount} mascota${petsCount === 1 ? '' : 's'} cargada${petsCount === 1 ? '' : 's'}.`
                    : 'Una a una o usando el bulk import (CSV/Excel).'
                }
                action={
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link to="/add-pet">
                        <Upload className="h-3 w-3 mr-1" /> Una mascota
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 bg-purple-600 hover:bg-purple-700">
                      <Link to="/shelter/bulk-import">
                        <Upload className="h-3 w-3 mr-1" /> Bulk import
                      </Link>
                    </Button>
                  </div>
                }
              />

              <ChecklistItem
                step={2}
                done={!!profileUrl && hasPets}
                title="Comparte tu perfil público"
                description={
                  profileUrl
                    ? 'Muestra tu refugio a quien te siga en redes.'
                    : 'Tu perfil va a estar listo cuando completes la información del refugio.'
                }
                action={
                  profileUrl ? (
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="h-8">
                        <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                          Ver
                        </a>
                      </Button>
                      <Button
                        onClick={copyProfileLink}
                        size="sm"
                        className="h-8 bg-purple-600 hover:bg-purple-700"
                      >
                        <Share2 className="h-3 w-3 mr-1" /> Copiar link
                      </Button>
                    </div>
                  ) : null
                }
              />

              <ChecklistItem
                step={3}
                done={false}
                title="Vas a recibir interesados"
                description="Cuando alguien quiera adoptar, vas a verlo en /shelter/adopciones con su mensaje."
                action={
                  <Badge variant="outline" className="text-[10px]">
                    Automático
                  </Badge>
                }
              />

              <ChecklistItem
                step={4}
                done={false}
                title="Transferí la mascota al adoptante"
                description="Un click pasa la ficha clínica completa al nuevo dueño."
                action={
                  <Badge variant="outline" className="text-[10px]">
                    Cuando aprobés un proceso
                  </Badge>
                }
              />
            </ol>

            <div className="flex justify-end mt-4 pt-3 border-t border-purple-100">
              <Button
                onClick={() => completeOnboarding()}
                disabled={isPending}
                variant="ghost"
                size="sm"
                className="text-purple-700 hover:bg-purple-100"
              >
                Ya lo tengo claro <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  step,
  done,
  title,
  description,
  action,
}: {
  step: number;
  done: boolean;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
          done
            ? 'bg-green-100 text-green-700 border-2 border-green-300'
            : 'bg-white border-2 border-purple-300 text-purple-700'
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-green-800' : ''}`}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </li>
  );
}
