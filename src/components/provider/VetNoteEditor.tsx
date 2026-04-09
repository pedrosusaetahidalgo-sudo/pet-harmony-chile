import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText } from "@/lib/icons";
import { toast } from "sonner";
import {
  useCreateVetClinicalNote,
  type VetNoteType,
} from "@/hooks/useVetClinicalNotes";

interface VetNoteEditorProps {
  shareTokenId: string;
  providerId: string;
  petId: string;
  petName: string;
  onSaved?: () => void;
}

const NOTE_TYPES: { value: VetNoteType; label: string }[] = [
  { value: "consulta", label: "Consulta" },
  { value: "vacuna", label: "Vacuna" },
  { value: "control", label: "Control" },
  { value: "cirugia", label: "Cirugia" },
  { value: "urgencia", label: "Urgencia" },
  { value: "otro", label: "Otro" },
];

export function VetNoteEditor({
  shareTokenId,
  providerId,
  petId,
  petName,
  onSaved,
}: VetNoteEditorProps) {
  const [noteType, setNoteType] = useState<VetNoteType>("consulta");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createNote = useCreateVetClinicalNote();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("El titulo es obligatorio");
      return;
    }

    await createNote.mutateAsync({
      shareTokenId,
      providerId,
      petId,
      noteType,
      title: title.trim(),
      description: description.trim() || undefined,
    });

    toast.success(`Nota guardada en la ficha de ${petName}`);
    setTitle("");
    setDescription("");
    setNoteType("consulta");
    onSaved?.();
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Agregar nota clinica para {petName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de nota</Label>
          <Select
            value={noteType}
            onValueChange={(v) => setNoteType(v as VetNoteType)}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Titulo</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Control general, Vacuna sextuple..."
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Descripcion (opcional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles de la consulta, indicaciones, observaciones..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createNote.isPending || !title.trim()}
          className="w-full h-11"
        >
          {createNote.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Guardar nota clinica
        </Button>
      </CardContent>
    </Card>
  );
}
