import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const personalityOptions = [
  "Juguetón", "Tranquilo", "Energético", "Cariñoso", "Tímido",
  "Protector", "Sociable", "Independiente", "Curioso", "Obediente"
];

const AddPet = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    birth_date: "",
    gender: "",
    size: "",
    color: "",
    weight: "",
    bio: "",
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("pet-photos")
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("pet-photos")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error al subir foto",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const { error } = await supabase.from("pets").insert({
        owner_id: user?.id,
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        size: formData.size || null,
        color: formData.color || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bio: formData.bio || null,
        personality: selectedPersonality.length > 0 ? selectedPersonality : null,
        photo_url: photoUrl,
        is_public: true,
      });

      if (error) throw error;

      toast({
        title: "¡Mascota agregada!",
        description: "El perfil de tu mascota ha sido creado exitosamente",
      });

      navigate("/my-pets");
    } catch (error: any) {
      toast({
        title: "Error al agregar mascota",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePersonality = (trait: string) => {
    setSelectedPersonality(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Agregar Nueva Mascota</h1>
          <p className="text-muted-foreground">
            Completa la información de tu compañero peludo
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Mascota</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Foto de la Mascota</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Subir foto</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Max, Luna, Rocky..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="species">Especie *</Label>
                  <Select
                    value={formData.species}
                    onValueChange={(value) => setFormData({ ...formData, species: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona especie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perro">Perro</SelectItem>
                      <SelectItem value="gato">Gato</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Raza</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="Golden Retriever, Persa..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="macho">Macho</SelectItem>
                      <SelectItem value="hembra">Hembra</SelectItem>
                      <SelectItem value="desconocido">Desconocido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Tamaño</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pequeño">Pequeño (1-10 kg)</SelectItem>
                      <SelectItem value="Mediano">Mediano (10-25 kg)</SelectItem>
                      <SelectItem value="Grande">Grande (25-45 kg)</SelectItem>
                      <SelectItem value="Gigante">Gigante (45+ kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Café, Negro, Blanco..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="5.5"
                  />
                </div>
              </div>

              {/* Personality */}
              <div className="space-y-3">
                <Label>Personalidad</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {personalityOptions.map((trait) => (
                    <Badge
                      key={trait}
                      variant={selectedPersonality.includes(trait) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80 transition-colors justify-center py-2 text-xs"
                      onClick={() => togglePersonality(trait)}
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Cuéntanos sobre tu mascota..."
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/my-pets")}
                  className="w-full sm:flex-1 h-12 rounded-xl hover:bg-muted transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full sm:flex-1 h-12 rounded-xl bg-warm-gradient hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {loading ? "Guardando..." : "✨ Agregar Mascota"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
};

export default AddPet;
