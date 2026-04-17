import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, PawPrint } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { generateDefaultName, toTitleCase } from '@/lib/format';
import { logger } from '@/lib/logger';

interface NamePromptDialogProps {
  open: boolean;
  onDone: (name: string) => void;
  currentName: string;
}

export function NamePromptDialog({ open, onDone, currentName }: NamePromptDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const handleGenerateRandom = () => {
    setName(generateDefaultName());
  };

  const handleSave = async () => {
    if (!user) return;
    const finalName = name.trim() || generateDefaultName();

    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: toTitleCase(finalName),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) {
      logger.error('Error saving display name:', error);
      toast.error('No se pudo guardar el nombre. Intenta de nuevo.');
      return;
    }

    toast.success(`¡Listo! Tu nombre es ${toTitleCase(finalName)}`);
    onDone(toTitleCase(finalName));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* prevent closing without choosing */
      }}
    >
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" />
            ¿Cómo te llamas?
          </DialogTitle>
          <DialogDescription>
            Elige un nombre para que otros usuarios te reconozcan. Puedes cambiarlo después en tu
            perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="promptName">Tu nombre</Label>
            <div className="flex gap-2">
              {}
              <Input
                id="promptName"
                placeholder="Ej: María, Carlos, PetLover..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                // eslint-disable-next-line jsx-a11y/no-autofocus -- dialog prompt es caso valido para autofocus
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateRandom}
                title="Generar nombre aleatorio"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Si no eliges uno, te asignaremos un nombre divertido.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Confirmar nombre'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
