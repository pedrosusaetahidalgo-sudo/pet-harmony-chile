/**
 * Upload Medical Document Dialog
 */

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useMedicalDocuments, MedicalDocumentType } from "@/hooks/useMedicalDocuments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface UploadMedicalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  onSuccess?: () => void;
}

const DOCUMENT_TYPES: { value: MedicalDocumentType; label: string }[] = [
  { value: 'vaccine_card', label: 'Tarjeta de Vacunación' },
  { value: 'id_card', label: 'Carnet de Identidad' },
  { value: 'lab_result', label: 'Resultado de Laboratorio' },
  { value: 'xray', label: 'Radiografía / Imagen' },
  { value: 'prescription', label: 'Receta Médica' },
  { value: 'other', label: 'Otro' },
];

export const UploadMedicalDocumentDialog = ({
  open,
  onOpenChange,
  petId,
  onSuccess,
}: UploadMedicalDocumentDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<MedicalDocumentType>('vaccine_card');
  const [title, setTitle] = useState('');
  const [issuedAt, setIssuedAt] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');

  const { uploadDocument, isUploading } = useMedicalDocuments(petId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo: 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido. Use JPG, PNG, HEIC o PDF');
        return;
      }

      setSelectedFile(file);
      if (!title) {
        // Auto-fill title from filename
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    if (!title.trim()) {
      alert('Por favor ingresa un título');
      return;
    }

    try {
      await uploadDocument({
        petId,
        file: selectedFile,
        type: documentType,
        title: title.trim(),
        issuedAt: issuedAt ? format(issuedAt, 'yyyy-MM-dd') : undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setIssuedAt(undefined);
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir Documento Médico</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Archivo</Label>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, HEIC o PDF (máx. 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/heic,application/pdf"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as MedicalDocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Vacuna antirrábica 2025"
            />
          </div>

          {/* Issued Date */}
          <div className="space-y-2">
            <Label>Fecha de Emisión (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !issuedAt && "text-muted-foreground"
                  )}
                >
                  {issuedAt ? format(issuedAt, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={issuedAt}
                  onSelect={setIssuedAt}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional sobre este documento..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading || !selectedFile || !title.trim()}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

