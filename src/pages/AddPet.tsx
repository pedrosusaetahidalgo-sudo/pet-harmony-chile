import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { track, EVENTS } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ChevronDown, Stethoscope, Heart } from "lucide-react";
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
  const [showMedical, setShowMedical] = useState(false);

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
    // Clinical fields
    microchip_number: "",
    neutered: false,
    is_adopted: false,
    adoption_date: "",
    preferred_clinic: "",
    emergency_vet_name: "",
    emergency_vet_phone: "",
    diet_type: "",
    diet_brand: "",
    activity_level: "",
    behavior_notes: "",
    insurance_provider: "",
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

      const { error: uploadError } = await supabase.storage
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

    // Validate weight if provided
    if (formData.weight && parseFloat(formData.weight) <= 0) {
      toast({ title: "Error", description: "El peso debe ser mayor a 0", variant: "destructive" });
      return;
    }

    // Validate birth_date if provided
    if (formData.birth_date && new Date(formData.birth_date) > new Date()) {
      toast({ title: "Error", description: "La fecha de nacimiento no puede ser en el futuro", variant: "destructive" });
      return;
    }

    // Validate adoption_date if provided
    if (formData.adoption_date && new Date(formData.adoption_date) > new Date()) {
      toast({ title: "Error", description: "La fecha de adopción no puede ser en el futuro", variant: "destructive" });
      return;
    }

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
        // Clinical fields
        microchip_number: formData.microchip_number || null,
        neutered: formData.neutered,
        is_adopted: formData.is_adopted,
        adoption_date: formData.adoption_date || null,
        preferred_clinic: formData.preferred_clinic || null,
        emergency_vet_name: formData.emergency_vet_name || null,
        emergency_vet_phone: formData.emergency_vet_phone || null,
        diet_type: formData.diet_type || null,
        diet_brand: formData.diet_brand || null,
        activity_level: formData.activity_level || null,
        behavior_notes: formData.behavior_notes || null,
        insurance_provider: formData.insurance_provider || null,
      } as any);

      if (error) throw error;

      // Auto-create default reminders for the new pet
      try {
        const { data: newPet } = await supabase
          .from("pets")
          .select("id")
          .eq("owner_id", user?.id)
          .eq("name", formData.name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (newPet) {
          const today = new Date();
          const in30days = new Date(today); in30days.setDate(today.getDate() + 30);
          const in90days = new Date(today); in90days.setDate(today.getDate() + 90);
          const in365days = new Date(today); in365days.setDate(today.getDate() + 365);

          await supabase.from("pet_reminders").insert([
            { pet_id: newPet.id, owner_id: user?.id, type: "checkup", title: `Control veterinario de ${formData.name}`, due_date: in90days.toISOString().split("T")[0] },
            { pet_id: newPet.id, owner_id: user?.id, type: "vaccine", title: `Revisar vacunas de ${formData.name}`, due_date: in30days.toISOString().split("T")[0] },
            { pet_id: newPet.id, owner_id: user?.id, type: "grooming", title: `Baño y peluquería de ${formData.name}`, due_date: in30days.toISOString().split("T")[0], is_recurring: true, recurrence_interval: "monthly" },
          ] as any[]);
        }
      } catch (reminderError) {
        console.error("Error creating default reminders:", reminderError);
      }

      track({ event: EVENTS.PET_CREATED, properties: { species: formData.species, breed: formData.breed } });

      toast({
        title: "¡Mascota agregada! 🎉",
        description: `${formData.name} tiene ficha clínica y recordatorios de salud. ¡Explora su perfil!`,
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

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agregar Nueva Mascota</h1>
        <p className="text-muted-foreground">
          Completa la información de tu compañero peludo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Max, Luna, Rocky..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="species">Especie *</Label>
                <Select
                  value={formData.species}
                  onValueChange={(value) => updateField("species", value)}
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
                  onChange={(e) => updateField("breed", e.target.value)}
                  placeholder="Golden Retriever, Persa..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => updateField("birth_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Tamaño</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => updateField("size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequeño">Pequeño (1-10 kg)</SelectItem>
                    <SelectItem value="mediano">Mediano (10-25 kg)</SelectItem>
                    <SelectItem value="grande">Grande (25-45 kg)</SelectItem>
                    <SelectItem value="gigante">Gigante (45+ kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => updateField("color", e.target.value)}
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
                  onChange={(e) => updateField("weight", e.target.value)}
                  placeholder="5.5"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.neutered}
                  onCheckedChange={(checked) => updateField("neutered", checked)}
                />
                <Label className="cursor-pointer">Esterilizado/a</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_adopted}
                  onCheckedChange={(checked) => updateField("is_adopted", checked)}
                />
                <Label className="cursor-pointer">Adoptado/a</Label>
              </div>
            </div>

            {formData.is_adopted && (
              <div className="space-y-2">
                <Label htmlFor="adoption_date">Fecha de Adopción</Label>
                <Input
                  id="adoption_date"
                  type="date"
                  value={formData.adoption_date}
                  onChange={(e) => updateField("adoption_date", e.target.value)}
                />
              </div>
            )}

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
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Cuéntanos sobre tu mascota..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Info Card (Collapsible) */}
        <Collapsible open={showMedical} onOpenChange={setShowMedical}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">Información Médica</CardTitle>
                      <CardDescription>Opcional - útil para veterinarios</CardDescription>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showMedical ? "rotate-180" : ""}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="microchip">Número de Microchip</Label>
                    <Input
                      id="microchip"
                      value={formData.microchip_number}
                      onChange={(e) => updateField("microchip_number", e.target.value)}
                      placeholder="123456789012345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance">Seguro de Mascotas</Label>
                    <Input
                      id="insurance"
                      value={formData.insurance_provider}
                      onChange={(e) => updateField("insurance_provider", e.target.value)}
                      placeholder="Nombre del seguro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic">Clínica Veterinaria Preferida</Label>
                    <Input
                      id="clinic"
                      value={formData.preferred_clinic}
                      onChange={(e) => updateField("preferred_clinic", e.target.value)}
                      placeholder="Nombre de la clínica"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vet_name">Veterinario de Emergencia</Label>
                    <Input
                      id="vet_name"
                      value={formData.emergency_vet_name}
                      onChange={(e) => updateField("emergency_vet_name", e.target.value)}
                      placeholder="Dr. García"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vet_phone">Teléfono de Emergencia</Label>
                    <Input
                      id="vet_phone"
                      type="tel"
                      value={formData.emergency_vet_phone}
                      onChange={(e) => updateField("emergency_vet_phone", e.target.value)}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity">Nivel de Actividad</Label>
                    <Select
                      value={formData.activity_level}
                      onValueChange={(value) => updateField("activity_level", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentario">Sedentario</SelectItem>
                        <SelectItem value="bajo">Bajo</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                        <SelectItem value="muy_alto">Muy Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diet_type">Tipo de Dieta</Label>
                    <Select
                      value={formData.diet_type}
                      onValueChange={(value) => updateField("diet_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seca">Comida Seca</SelectItem>
                        <SelectItem value="humeda">Comida Húmeda</SelectItem>
                        <SelectItem value="mixta">Mixta</SelectItem>
                        <SelectItem value="barf">BARF / Natural</SelectItem>
                        <SelectItem value="casera">Casera</SelectItem>
                        <SelectItem value="veterinaria">Prescrita por Veterinario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diet_brand">Marca de Alimento</Label>
                    <Input
                      id="diet_brand"
                      value={formData.diet_brand}
                      onChange={(e) => updateField("diet_brand", e.target.value)}
                      placeholder="Royal Canin, Purina..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="behavior">Notas de Comportamiento</Label>
                  <Textarea
                    id="behavior"
                    value={formData.behavior_notes}
                    onChange={(e) => updateField("behavior_notes", e.target.value)}
                    placeholder="Miedos, fobias, comportamientos especiales..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/my-pets")}
            className="w-full sm:flex-1 h-12"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || uploading}
            className="w-full sm:flex-1 h-12"
          >
            {loading ? "Guardando..." : "Agregar Mascota"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPet;
