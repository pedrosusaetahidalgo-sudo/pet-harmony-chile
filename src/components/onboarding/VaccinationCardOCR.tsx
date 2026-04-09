import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Loader2, Check, X, FileText } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface VaccineEntry {
  name: string;
  date: string;
  batch?: string;
  vet_name?: string;
}

interface DewormingEntry {
  product: string;
  date: string;
}

interface OCRResult {
  vaccines: VaccineEntry[];
  deworming: DewormingEntry[];
  notes: string;
}

interface Props {
  petId: string;
  onSaved?: () => void;
}

export function VaccinationCardOCR({ petId, onSaved }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen es muy pesada. Máximo 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!preview || !user) return;
    setProcessing(true);

    try {
      // Extract base64 without the data:image/... prefix
      const base64 = preview.split(",")[1];

      const { data, error } = await supabase.functions.invoke("ocr-vaccination-card", {
        body: { image_base64: base64, pet_id: petId },
      });

      if (error) throw error;
      setResult(data as OCRResult);
      toast.success("Carnet procesado. Revisa los datos antes de guardar.");
    } catch (err: any) {
      const msg = err?.message || "Error al procesar la imagen";
      if (msg.includes("rate") || msg.includes("429")) {
        toast.error("Llegaste al límite de 3 escaneos por día. Intenta mañana.");
      } else {
        toast.error(msg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const removeVaccine = (idx: number) => {
    if (!result) return;
    setResult({ ...result, vaccines: result.vaccines.filter((_, i) => i !== idx) });
  };

  const removeDeworming = (idx: number) => {
    if (!result) return;
    setResult({ ...result, deworming: result.deworming.filter((_, i) => i !== idx) });
  };

  const handleSaveAll = async () => {
    if (!result || !user) return;
    setSaving(true);

    try {
      // Save vaccines as medical_records
      const vaccineRecords = result.vaccines.map((v) => ({
        pet_id: petId,
        owner_id: user.id,
        record_type: "vacuna",
        title: `Vacuna: ${v.name}`,
        description: v.batch ? `Lote: ${v.batch}` : null,
        veterinarian_name: v.vet_name || null,
        date: v.date,
      }));

      // Save deworming as medical_records
      const dewormingRecords = result.deworming.map((d) => ({
        pet_id: petId,
        owner_id: user.id,
        record_type: "tratamiento",
        title: `Desparasitación: ${d.product}`,
        date: d.date,
      }));

      const allRecords = [...vaccineRecords, ...dewormingRecords];

      if (allRecords.length > 0) {
        const { error } = await supabase.from("medical_records").insert(allRecords);
        if (error) throw error;
      }

      toast.success(`${allRecords.length} registros guardados en la ficha.`);
      setResult(null);
      setPreview(null);
      onSaved?.();
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar los registros");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-5 w-5 text-purple-600" />
          Subir carnet de vacunas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-colors"
          >
            <Camera className="h-10 w-10 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Sube una foto del carnet y completamos la ficha por ti
            </p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG o HEIC. Máximo 10 MB.</p>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Preview */}
            <div className="relative">
              <img
                src={preview}
                alt="Carnet de vacunas"
                className="w-full rounded-lg border border-slate-200 max-h-48 object-cover"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={() => { setPreview(null); setResult(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Process button */}
            {!result && (
              <Button onClick={handleProcess} disabled={processing} className="w-full">
                {processing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando con IA...</>
                ) : (
                  <><FileText className="h-4 w-4 mr-2" /> Procesar con IA</>
                )}
              </Button>
            )}

            {/* Editable results */}
            {result && (
              <div className="space-y-3">
                {result.vaccines.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Vacunas detectadas</p>
                    {result.vaccines.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg mb-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{v.name}</p>
                          <p className="text-xs text-slate-500">{v.date}{v.batch ? ` · Lote: ${v.batch}` : ""}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeVaccine(i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {result.deworming.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Desparasitaciones detectadas</p>
                    {result.deworming.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg mb-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{d.product}</p>
                          <p className="text-xs text-slate-500">{d.date}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeDeworming(i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {result.notes && (
                  <p className="text-xs text-slate-500 italic">Notas: {result.notes}</p>
                )}

                <Button onClick={handleSaveAll} disabled={saving} className="w-full">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Guardar todo en la ficha</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
