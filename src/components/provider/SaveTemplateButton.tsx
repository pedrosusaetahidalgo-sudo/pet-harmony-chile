import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "@/lib/icons";
import {
  useCreateConsultationTemplate,
  type TemplateCategory,
} from "@/hooks/useConsultationTemplates";

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: "vacunacion", label: "Vacunación" },
  { value: "control_sano", label: "Control sano" },
  { value: "post_esterilizacion", label: "Post-esterilización" },
  { value: "dermatologia", label: "Dermatología" },
  { value: "geriatrico", label: "Geriátrico" },
  { value: "urgencia", label: "Urgencia" },
  { value: "otro", label: "Otro" },
];

interface Props {
  providerId: string;
  getCurrentBody: () => Record<string, unknown>;
}

export default function SaveTemplateButton({
  providerId,
  getCurrentBody,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("otro");
  const createMutation = useCreateConsultationTemplate();

  const handleSave = () => {
    if (!name.trim()) return;
    createMutation.mutate(
      {
        name: name.trim(),
        category,
        templateBody: getCurrentBody(),
        providerId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setCategory("otro");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-1" />
          Guardar como mi plantilla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar plantilla</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nombre de la plantilla</Label>
            <Input
              id="template-name"
              placeholder="Ej: Control cachorro 3 meses"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TemplateCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
