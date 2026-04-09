import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Camera } from "@/lib/icons";
import { describeSupabaseError } from "@/lib/supabaseErrors";

type Species = "perro" | "gato" | "otro";
type AgeRange = "cachorro" | "joven" | "adulto" | "senior";

const AGE_YEARS: Record<AgeRange, number> = {
  cachorro: 0.5,
  joven: 2,
  adulto: 5,
  senior: 10,
};

function approximateBirthDate(age: AgeRange): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - Math.floor(AGE_YEARS[age]));
  d.setMonth(d.getMonth() - Math.round((AGE_YEARS[age] % 1) * 12));
  return d.toISOString().split("T")[0];
}

const OnboardingDuenoMinimal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    const ext = photoFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pet-photos").upload(path, photoFile);
    if (error) {
      toast.error("No se pudo subir la foto, pero tu mascota se creará igual.");
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from("pet-photos").getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("El nombre de tu mascota es obligatorio.");
      return;
    }
    if (!user) {
      toast.error("Tu sesión expiró. Inicia sesión de nuevo.");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const photoUrl = await uploadPhoto();

      const { error } = await supabase.from("pets").insert({
        owner_id: user.id,
        name: name.trim(),
        species: species ?? "perro",
        birth_date: ageRange ? approximateBirthDate(ageRange) : null,
        photo_url: photoUrl,
        is_public: true,
      });
      if (error) throw error;

      toast.info("Tu ficha está al 30%. Completar con foto del carnet", {
        duration: 6000,
      });
      navigate("/home");
    } catch (err) {
      toast.error(
        describeSupabaseError(err as Parameters<typeof describeSupabaseError>[0])
      );
    } finally {
      setLoading(false);
    }
  };

  const speciesOptions: { value: Species; label: string }[] = [
    { value: "perro", label: "Perro" },
    { value: "gato", label: "Gato" },
    { value: "otro", label: "Otro" },
  ];

  const ageOptions: { value: AgeRange; label: string; hint: string }[] = [
    { value: "cachorro", label: "Cachorro", hint: "0-1 año" },
    { value: "joven", label: "Joven", hint: "1-3 años" },
    { value: "adulto", label: "Adulto", hint: "3-8 años" },
    { value: "senior", label: "Senior", hint: "8+ años" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Agrega tu mascota</CardTitle>
          <CardDescription>
            Solo necesitas el nombre. Puedes completar el resto después.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Foto de mascota"
                  className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-100 flex flex-col items-center justify-center border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors">
                  <span className="text-3xl">🐾</span>
                  <span className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Foto
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* Name */}
          <div>
            <Input
              placeholder="Nombre de tu mascota *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Species chips */}
          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">Especie</p>
            <div className="flex gap-2">
              {speciesOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpecies(species === opt.value ? null : opt.value)}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium border transition-colors ${
                    species === opt.value
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-slate-700 border-slate-300 hover:border-purple-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age range chips */}
          <div>
            <p className="text-sm font-medium mb-2 text-slate-700">Edad aproximada</p>
            <div className="grid grid-cols-2 gap-2">
              {ageOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAgeRange(ageRange === opt.value ? null : opt.value)}
                  className={`py-2 px-3 rounded-full text-sm font-medium border transition-colors ${
                    ageRange === opt.value
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-slate-700 border-slate-300 hover:border-purple-400"
                  }`}
                >
                  {opt.label}
                  <span className={`block text-xs ${ageRange === opt.value ? "text-purple-200" : "text-slate-400"}`}>
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? "Guardando..." : "Crear mascota"}
          </Button>

          <p className="text-xs text-center text-slate-400">
            Puedes agregar más detalles después desde la ficha de tu mascota.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingDuenoMinimal;
